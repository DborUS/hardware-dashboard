#!/usr/bin/env python3
"""
Smoke test for Hardware Portal.

Loads the dashboard in a headless browser, exercises every tab and control,
and reports counts + JavaScript errors. Optionally writes screenshots.

Also clicks every filter chip on every tab: a chip that matches no rendered
block empties the page when clicked, and no count-based check can see it.

This is the primary "did I break anything?" check. Run it after ANY change
to js/script.js, css/styles.css, index.html, or js/data/*.json.

Usage:
    python3 tools/smoke-test.py                 # run checks
    python3 tools/smoke-test.py --shots         # also write screenshots to tools/screenshots/
    python3 tools/smoke-test.py --port 8899     # use a different port

Requirements:
    pip install playwright
    python3 -m playwright install chromium-headless-shell

Exit code is 0 if all checks pass, 1 otherwise -- so this can gate a commit.
"""

import argparse
import http.server
import os
import socketserver
import subprocess
import sys
import threading
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Expected minimums. These are lower bounds, not exact values -- adding data
# should never fail the test, but losing data or breaking a render will.
EXPECT = {
    # AMD is now product-first (js/amd-v2.js): EPYC / Ryzen / GPU sub-tabs,
    # product-series blocks holding codename cards. Model counts are the real
    # guard -- they must be conserved across any future restructure.
    "amd_epyc_groups": 6,
    "amd_epyc_cards": 12,
    "amd_epyc_models": 162,
    "amd_ryzen_groups": 19,
    "amd_ryzen_cards": 34,
    "amd_ryzen_models": 478,
    "amd_gpu_groups": 40,
    "amd_gpu_models": 258,
    "amd_core_stops": 20,
    "intel_core_stops": 36,
    # Intel uses the generation-first renderer (js/intel-v2.js): generation
    # blocks, not codename blocks, across three sub-tabs. Spec tables render
    # empty until the bulk CSV import lands, so no model-count check here.
    "intel_xeon_groups": 11,
    "intel_xeon_cards": 33,
    "intel_client_groups": 11,
    "intel_client_cards": 47,
    "intel_gfx_groups": 3,
    "intel_gfx_cards": 12,
    "intel_xeon_models": 553,
}

# Filter chips that are known to match no content, as "<tab>:<chip>".
#
# A chip whose tag matches no rendered block is unreachable-by-filter: clicking
# it empties the page. That is the inverse of the recurring bug class in
# CLAUDE.md (data values with no UI chip) and it is invisible to a count-based
# check, which is how these ten survived.
#
# Cause: v2ApplyFilters() compares a chip's tag against `data-gen`, which
# v2Gen() stamps with the block's DISPLAY NAME. They match only when the two
# strings are identical -- "Xeon 6" does, "Xeon 5" vs "Xeon 5 (5th Gen
# Scalable)" does not.
#
# These are tracked, not accepted. Empty this set when the tags are reconciled;
# the check below then enforces that no chip is ever dead again.
KNOWN_DEAD_CHIPS = {
    "intel-xeon:Xeon 5", "intel-xeon:Xeon 4", "intel-xeon:Xeon 3",
    "intel-xeon:Xeon 2", "intel-xeon:Xeon 1",
    "intel-client:Series 3", "intel-client:Series 2", "intel-client:Series 1",
    "intel-client:Core X", "intel-client:Atom / N",

    # Different cause: these tags exist in VENDOR_CONFIG / V2_DATA filters but
    # no SKU carries them, so the chip is real and simply matches nothing.
    #   Athlon -- no Athlon SKU remains in amd-data.json (brands: Epyc, Ryzen,
    #             Ryzen AI, Threadripper). Stale chip.
    #   Silver / Bronze -- 32 Silver and 6 Bronze models ARE imported, but every
    #             V2_DATA.xeon family is tiered Platinum/Gold, so the tier is
    #             unreachable. Resolves when tiering is finished.
    "intel-xeon:Silver", "intel-xeon:Bronze",
}


def serve(port, directory):
    handler = lambda *a, **kw: http.server.SimpleHTTPRequestHandler(
        *a, directory=str(directory), **kw
    )
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8899)
    ap.add_argument("--shots", action="store_true", help="write screenshots")
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("ERROR: playwright not installed.")
        print("  pip install playwright")
        print("  python3 -m playwright install chromium-headless-shell")
        return 1

    shots_dir = REPO / "tools" / "screenshots"
    if args.shots:
        shots_dir.mkdir(parents=True, exist_ok=True)

    httpd = serve(args.port, REPO)
    base = f"http://127.0.0.1:{args.port}/index.html"

    failures = []
    js_errors = []
    results = {}
    known_dead_seen = []

    # Chromium flags required in restricted/container environments.
    ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=ARGS, chromium_sandbox=False)
            page = browser.new_page(viewport={"width": 1440, "height": 1000})

            def on_console(m):
                if m.type == "error":
                    # Font CDN blocked by corporate proxy is environmental, not a code bug.
                    if "ERR_CERT_AUTHORITY_INVALID" in m.text or "fonts.g" in m.text:
                        return
                    js_errors.append(f"[console] {m.text}")

            page.on("console", on_console)
            page.on("pageerror", lambda e: js_errors.append(f"[pageerror] {e}"))

            def count(sel):
                return page.eval_on_selector_all(sel, "e => e.length")

            def visible(sel):
                return page.eval_on_selector_all(
                    sel, "e => e.filter(x => !x.classList.contains('hidden')).length"
                )

            def check_chips(label):
                """Click every filter chip; a chip that hides everything is a bug.

                Counts alone cannot catch this -- the page renders correctly and
                only goes blank once a user clicks. Chips are toggled off again
                so the tab is left as found.
                """
                chips = page.query_selector_all(".fchip")
                dead, checked = [], 0
                for chip in chips:
                    tag = chip.get_attribute("data-tag")
                    if not tag:
                        continue
                    chip.click()
                    page.wait_for_timeout(18)
                    checked += 1
                    if visible(".arch-group") == 0:
                        dead.append(tag)
                    chip.click()          # restore
                    page.wait_for_timeout(10)
                results[f"chips_{label}"] = checked
                for tag in dead:
                    key = f"{label}:{tag}"
                    if key not in KNOWN_DEAD_CHIPS:
                        failures.append(
                            f"filter chip '{tag}' on {label} selects nothing "
                            f"(matches no rendered block)"
                        )
                    else:
                        known_dead_seen.append(key)

            page.goto(base, wait_until="networkidle")
            page.wait_for_timeout(900)

            # --- AMD: three sub-tabs, product-first renderer ---
            if count("#a2Subtabs.visible") != 1:
                failures.append("AMD sub-tabs not visible on load")
            for tab in ("epyc", "ryzen", "gpu"):
                page.click(f'.a2-subtab[data-tab="{tab}"]')
                page.wait_for_timeout(700)
                results[f"amd_{tab}_groups"] = count(".arch-group")
                results[f"amd_{tab}_cards"] = count(".sku-card")
                page.click("#expandAllBtn")
                page.wait_for_timeout(700)
                results[f"amd_{tab}_models"] = (
                    count(".cpu-spec-table tbody tr") - count(".v2-empty-row"))
                if args.shots:
                    page.screenshot(path=str(shots_dir / f"01-amd-{tab}.png"))
                page.click("#collapseAllBtn")
                page.wait_for_timeout(500)
                check_chips(f"amd-{tab}")

            # --- Core-range slider ---
            # Regression guard: the slider derives its stops from the loaded
            # spec data, so an ordering slip (build filters before loading
            # specs) silently yields an empty control. That exact bug shipped
            # on the Intel tab and was invisible to every count check.
            page.click('.a2-subtab[data-tab="epyc"]')
            page.wait_for_timeout(550)
            stops = count("#a2core .crt")
            results["amd_core_stops"] = stops
            if stops < 2:
                failures.append(f"EPYC core slider has {stops} stops, expected the "
                                f"20 distinct core counts")
            # Typing a min must snap to a real stop and actually filter.
            page.fill("#a2core-min", "96")
            page.press("#a2core-min", "Enter")
            page.wait_for_timeout(400)
            snapped = page.input_value("#a2core-min")
            narrowed = visible(".sku-card")
            if snapped != "96":
                failures.append(f"typed min 96 snapped to {snapped}")
            if not (0 < narrowed < results["amd_epyc_cards"]):
                failures.append(f"core min=96 should narrow 12 cards, got {narrowed}")
            results["amd_core_min96_cards"] = narrowed
            page.click("#a2core .cr-pre:last-child")   # All
            page.wait_for_timeout(350)
            if visible(".sku-card") != results["amd_epyc_cards"]:
                failures.append("core-range 'All' preset did not restore every card")
            # GPU has no core data and must therefore render no slider.
            page.click('.a2-subtab[data-tab="gpu"]')
            page.wait_for_timeout(500)
            if count("#a2core") != 0:
                failures.append("GPU tab should have no core slider")
            page.click('.a2-subtab[data-tab="epyc"]')
            page.wait_for_timeout(500)

            # --- Search reaches into the spec tables ---
            page.click('.a2-subtab[data-tab="epyc"]')
            page.wait_for_timeout(700)
            all_series = count(".arch-group")
            page.fill("#searchInput", "9575F")
            page.wait_for_timeout(700)
            narrowed = visible(".arch-group")
            if narrowed >= all_series or narrowed == 0:
                failures.append(
                    f"search '9575F' should narrow results; got {narrowed} "
                    f"visible of {all_series}"
                )
            results["search_visible"] = narrowed
            page.fill("#searchInput", "")
            page.wait_for_timeout(600)

            # --- Intel: three sub-tabs, generation-first renderer ---
            page.click("#tabIntel")
            page.wait_for_timeout(1200)
            for tab, key in (("xeon", "xeon"), ("client", "client"), ("graphics", "gfx")):
                page.click(f'.v2-subtab[data-tab="{tab}"]')
                page.wait_for_timeout(900)
                results[f"intel_{key}_groups"] = count(".arch-group")
                results[f"intel_{key}_cards"] = count(".sku-card")
                check_chips(f"intel-{tab}")
                if tab == "xeon":
                    page.click("#expandAllBtn")
                    page.wait_for_timeout(1200)
                    results["intel_xeon_models"] = count(".cpu-spec-table tbody tr") - count(".v2-empty-row")
                    page.click("#collapseAllBtn")
                    page.wait_for_timeout(500)
                if args.shots:
                    page.screenshot(path=str(shots_dir / f"04-intel-{tab}.png"))
            # AMD chrome must not leak into the Intel tab
            if count("#v2Subtabs.visible") != 1:
                failures.append("Intel sub-tabs not visible")
            page.click("#tabAmd")
            page.wait_for_timeout(1100)
            # Intel Xeon stores no total-core field -- only pc/ec -- so its
            # stops depend on coreTotal() summing them. Assert they exist.
            page.click("#tabIntel")
            page.wait_for_timeout(1300)
            xstops = count("#v2core .crt")
            results["intel_core_stops"] = xstops
            if xstops < 2:
                failures.append(f"Intel Xeon core slider has {xstops} stops; "
                                f"P+E summing may have regressed")
            page.click("#tabAmd")
            page.wait_for_timeout(1200)

            if count("#v2Subtabs.visible") != 0:
                failures.append("Intel sub-tabs still visible after switching to AMD")
            if count("#a2Subtabs.visible") != 1:
                failures.append("AMD sub-tabs not restored after returning from Intel")
            if count(".arch-group") < 6:
                failures.append("AMD did not re-render after returning from Intel")

            browser.close()
    finally:
        httpd.shutdown()

    # --- Evaluate ---
    for key, minimum in EXPECT.items():
        got = results.get(key, 0)
        if got < minimum:
            failures.append(f"{key}: expected >= {minimum}, got {got}")

    print("=" * 58)
    print("  Hardware Portal -- smoke test")
    print("=" * 58)
    for k, v in results.items():
        print(f"  {k:<22} {v}")
    print("-" * 58)

    if known_dead_seen:
        print(f"  KNOWN-DEAD CHIPS ({len(known_dead_seen)}) -- tracked, not failing:")
        for k in known_dead_seen:
            print(f"    {k}")
        print("-" * 58)

    if js_errors:
        print(f"  JS ERRORS ({len(js_errors)}):")
        for e in js_errors[:10]:
            print(f"    {e}")
        failures.append(f"{len(js_errors)} JavaScript error(s)")
    else:
        print("  JS errors             none")

    print("-" * 58)
    if failures:
        print(f"  RESULT: FAIL ({len(failures)})")
        for f in failures:
            print(f"    - {f}")
        print("=" * 58)
        return 1

    print("  RESULT: PASS")
    if args.shots:
        print(f"  screenshots -> {shots_dir}")
    print("=" * 58)
    return 0


if __name__ == "__main__":
    sys.exit(main())
