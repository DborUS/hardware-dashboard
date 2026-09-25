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
    "amd_epyc_groups": 20,
    "amd_epyc_cards": 27,
    "amd_epyc_models": 350,
    "amd_ryzen_groups": 32,
    "amd_ryzen_cards": 79,
    "amd_ryzen_models": 736,
    "amd_gpu_groups": 43,
    "amd_gpu_cards": 43,
    "amd_gpu_models": 303,
    "amd_core_stops": 20,
    "intel_core_stops": 36,
    # Intel uses the generation-first renderer (js/intel-v2.js): generation
    # blocks, not codename blocks, across three sub-tabs. All three now carry
    # spec data (Client and Graphics imported 2026-09-10), so all three are
    # guarded by a model count -- the assertion that catches a restructure
    # silently dropping rows.
    "intel_xeon_groups": 11,
    "intel_xeon_cards": 33,
    "intel_xeon_models": 553,
    "intel_client_groups": 11,
    "intel_client_cards": 49,
    "intel_client_models": 340,
    "intel_gfx_groups": 4,
    "intel_gfx_cards": 8,
    "intel_gfx_models": 35,
    # NVIDIA is generated from the fully audited 2017+ CSV set.
    "nvidia_datacenter_groups": 8,
    "nvidia_datacenter_models": 20,
    "nvidia_geforce_groups": 5,
    "nvidia_geforce_models": 47,
    "nvidia_cpu_groups": 2,
    "nvidia_cpu_models": 4,
}

# Filter chips that are known to match no content, as "<tab>:<chip>".
#
# EMPTY AS OF 2026-09-10 -- and it must stay that way. A chip whose tag matches
# no rendered block is unreachable-by-filter: clicking it empties the page.
# That is the inverse of the recurring bug class in CLAUDE.md (data values with
# no UI chip) and it is invisible to a count-based check, which is how twelve of
# these survived for weeks.
#
# The twelve were resolved two ways:
#   - Ten were label-vs-name mismatches. v2ApplyFilters() compares a chip's tag
#     against `data-gen`, which carried the block's DISPLAY name, so "Xeon 5"
#     never matched "Xeon 5 (5th Gen Scalable)". Blocks now carry an explicit
#     `genTag` and data-gen prefers it.
#   - Silver / Bronze were real data that the UI could not reach: 38 such Xeons
#     are imported, but every family is tagged Platinum or Gold. Cards now
#     publish `data-tiers`, the set of tiers their MODELS span, and the filter
#     matches against that set.
#
# Any entry appearing here again is a regression, not a backlog item.
KNOWN_DEAD_CHIPS = set()


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
            if os.environ.get("SMOKE_TRACE"):
                # SMOKE_TRACE=1 prints every driven action with a timestamp and
                # caps waits at 9s. The default 30s timeout turns any missing
                # selector into a five-minute stall with no output, which is
                # indistinguishable from a slow run.
                page.set_default_timeout(9000)
                import time as _t
                _t0 = _t.time()
                for _m in ("click", "fill"):
                    def _mk(name, fn):
                        def w(*a, **kw):
                            print(f"[{_t.time() - _t0:6.1f}s] {name} {a[:1]}",
                                  flush=True)
                            return fn(*a, **kw)
                        return w
                    setattr(page, _m, _mk(_m, getattr(page, _m)))

            def on_console(m):
                if m.type == "error":
                    # Font CDN blocked by corporate proxy is environmental, not a code bug.
                    if "ERR_CERT_AUTHORITY_INVALID" in m.text or "fonts.g" in m.text:
                        return
                    js_errors.append(f"[console] {m.text}")

            page.on("console", on_console)
            page.on("pageerror", lambda e: js_errors.append(
                f"[pageerror] {getattr(e, 'stack', None) or e}"))

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
                if tab == "epyc":
                    price_check = page.eval_on_selector_all(
                        ".cpu-spec-table", """tables => ({
                          columns: tables.every(table => {
                            const headers = [...table.querySelectorAll('th')]
                              .map(th => th.textContent.trim());
                            return headers.at(-2) === '1kU Price' &&
                              headers.at(-1) === 'Product ID';
                          }),
                          published: tables.some(table => [...table.querySelectorAll('tr')]
                            .some(row => row.querySelector('td')?.textContent.trim() ===
                              'EPYC 9996' && [...row.querySelectorAll('td')].at(-2)
                                ?.textContent.trim() === '$14,904')),
                          missing: tables.some(table => [...table.querySelectorAll('tbody tr')]
                            .some(row => [...row.querySelectorAll('td')].at(-2)
                              ?.textContent.trim() === '—'))
                        })""")
                    if not all(price_check.values()):
                        failures.append(f"EPYC pricing column failed: {price_check}")
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

            # Exact SKU search stays collapsed, explains the match, and only
            # highlights the exact row after the user opens it.
            page.fill("#searchInput", "9575F")
            page.wait_for_timeout(500)
            if count(".arch-group.expanded") or count(".cpu-spec-wrapper.open"):
                failures.append("AMD exact search auto-opened a result")
            if count(".search-summary:not([hidden])") != 1:
                failures.append("AMD exact search should show one match summary")
            page.click(".arch-group:not(.hidden) .arch-header")
            page.click(".sku-card:not(.hidden)")
            page.wait_for_timeout(150)
            if count("tr.search-match") != 1:
                failures.append("AMD 9575F search should highlight exactly one row")
            page.fill("#searchInput", "")
            page.click("#collapseAllBtn")
            page.wait_for_timeout(350)

            # Unit boundaries such as "MB 300 W" must not masquerade as B300.
            page.fill("#searchInput", "B300")
            page.wait_for_selector('.global-search-route[data-vendor="nvidia"][data-tab="datacenter"]')
            if count(".global-search-route") != 1 or visible(".arch-group") != 0:
                failures.append("B300 search should only find NVIDIA Data Center")
            page.fill("#searchInput", "")
            page.wait_for_timeout(350)

            # A query for another vendor must reveal and open its product tab
            # without clearing the query. The beacon deliberately has no count.
            page.fill("#searchInput", "8490H")
            page.wait_for_selector('.global-search-route[data-vendor="intel"][data-tab="xeon"]')
            if count("#tabIntel.search-beacon") != 1:
                failures.append("global search did not highlight Intel for Xeon 8490H")
            page.click('.global-search-route[data-vendor="intel"][data-tab="xeon"]')
            page.wait_for_timeout(450)
            if page.input_value("#searchInput") != "8490H" or count('#v2Subtabs .v2-subtab[data-tab="xeon"].active') != 1:
                failures.append("global search route did not retain query in Intel Xeon")
            page.click("#searchClear")

            # --- Intel: three sub-tabs, generation-first renderer ---
            page.wait_for_timeout(1200)
            for tab, key in (("xeon", "xeon"), ("client", "client"), ("graphics", "gfx")):
                page.click(f'.v2-subtab[data-tab="{tab}"]')
                page.wait_for_timeout(900)
                results[f"intel_{key}_groups"] = count(".arch-group")
                results[f"intel_{key}_cards"] = count(".sku-card")
                check_chips(f"intel-{tab}")
                # Every Intel sub-tab now carries spec data, so every one gets
                # a model count. Expanding is required -- the rows only exist
                # in the DOM once the cards are open.
                page.click("#expandAllBtn")
                page.wait_for_timeout(1200)
                results[f"intel_{key}_models"] = (
                    count(".cpu-spec-table tbody tr") - count(".v2-empty-row"))
                page.click("#collapseAllBtn")
                page.wait_for_timeout(500)
                if args.shots:
                    page.screenshot(path=str(shots_dir / f"04-intel-{tab}.png"))

            # Intel now follows the same exact-match and collapsed-result rules.
            page.click('.v2-subtab[data-tab="client"]')
            page.wait_for_timeout(850)
            page.fill("#searchInput", "14900K")
            page.wait_for_timeout(500)
            if count(".arch-group.expanded") or count(".cpu-spec-wrapper.open"):
                failures.append("Intel exact search auto-opened a result")
            if count(".search-summary:not([hidden])") != 1:
                failures.append("Intel 14900K search should prefer one exact SKU")
            summary = page.locator(".search-summary:not([hidden])").text_content()
            if "Exact SKU" not in summary or "14900K" not in summary:
                failures.append(f"Intel exact-match explanation is wrong: {summary}")
            page.click(".arch-group:not(.hidden) .arch-header")
            page.click(".sku-card:not(.hidden)")
            page.wait_for_timeout(150)
            if count("tr.search-match") != 1:
                failures.append("Intel 14900K search should highlight exactly one row")

            # Search, vendor and product line must survive a copied/reloaded URL.
            page.wait_for_timeout(150)
            if "vendor=intel" not in page.url or "tab=client" not in page.url or "q=14900K" not in page.url:
                failures.append(f"shareable URL missing dashboard state: {page.url}")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1000)
            if page.input_value("#searchInput") != "14900K" or count("#v2Subtabs.visible") != 1:
                failures.append("shared Intel search URL did not restore its state")

            # Select two Intel products, carry them to AMD, add a third product,
            # and open one cross-vendor comparison.
            page.click("#searchClear")
            page.wait_for_timeout(300)
            page.click("#expandAllBtn")
            page.click(".sku-card:has(+ .cpu-spec-wrapper tbody tr[data-search])")
            page.wait_for_timeout(150)
            page.locator(".cpu-spec-wrapper.open tbody tr[data-search]").nth(0).click()
            page.locator(".cpu-spec-wrapper.open tbody tr[data-search]").nth(1).click()
            if count("#compareTray:not([hidden])") != 1 or page.locator("#compareOpenBtn").is_disabled():
                failures.append("comparison tray did not enable after two selections")

            page.click("#dataSourcesBtn")
            if "Intel ARK" not in page.locator("#sourceContent").text_content():
                failures.append("Intel source panel does not identify Intel ARK")
            page.click('[data-close-dialog="sourceDialog"]')
            page.click("#tabAmd")
            page.wait_for_timeout(1100)
            if "2 products selected" not in page.locator("#compareCount").text_content():
                failures.append("comparison selections did not survive vendor switch")
            page.click("#expandAllBtn")
            page.click(".sku-card:has(+ .cpu-spec-wrapper tbody tr[data-search])")
            page.locator(".cpu-spec-wrapper.open tbody tr[data-search]").first.click()
            page.click("#compareOpenBtn")
            if count("#compareDialog[open]") != 1 or count("#compareDialog thead th") != 4:
                failures.append("cross-vendor comparison did not render three products")
            page.wait_for_function("""() => [...document.querySelectorAll('#compareDialog tbody th')]
                .some(th => th.textContent.trim() === 'CPU cores')""")
            core_row = page.locator("#compareDialog tbody tr:has(> th:text-is('CPU cores'))")
            if core_row.count() != 1 or any(value.strip() == '—' for value in core_row.locator('td').all_text_contents()):
                failures.append("cross-vendor CPU cores did not align across all selected products")
            page.click('[data-close-dialog="compareDialog"]')
            page.click("#compareClearBtn")
            # AMD chrome must not leak into the Intel tab
            page.click("#tabIntel")
            page.wait_for_timeout(1200)
            if count("#v2Subtabs.visible") != 1:
                failures.append("Intel sub-tabs not visible")
            # Intel Xeon stores no total-core field -- only pc/ec -- so its
            # stops depend on coreTotal() summing them. Assert they exist.
            xstops = count("#v2core .crt")
            results["intel_core_stops"] = xstops
            if xstops < 2:
                failures.append(f"Intel Xeon core slider has {xstops} stops; "
                                f"P+E summing may have regressed")

            # --- NVIDIA: audited data-center-first renderer ---
            page.click("#tabNvidia")
            page.wait_for_timeout(1000)
            if count("#n2Subtabs.visible") != 1:
                failures.append("NVIDIA sub-tabs not visible")
            for tab in ("datacenter", "geforce", "cpu"):
                page.click(f'.n2-subtab[data-tab="{tab}"]')
                page.wait_for_timeout(500)
                results[f"nvidia_{tab}_groups"] = count(".arch-group")
                check_chips(f"nvidia-{tab}")
                page.click("#expandAllBtn")
                page.wait_for_timeout(350)
                results[f"nvidia_{tab}_models"] = (
                    count(".cpu-spec-table tbody tr") - count(".v2-empty-row"))
                if args.shots:
                    page.locator(".sku-card").first.click()
                    page.wait_for_timeout(120)
                    page.screenshot(path=str(shots_dir / f"07-nvidia-{tab}.png"))
                page.click("#collapseAllBtn")

            page.click('.n2-subtab[data-tab="datacenter"]')
            page.fill("#searchInput", "B300 SXM")
            page.wait_for_timeout(350)
            if count(".search-summary:not([hidden])") != 1:
                failures.append("NVIDIA exact search should show one B300 match")
            page.click("#dataSourcesBtn")
            if "NVIDIA official" not in page.locator("#sourceContent").text_content():
                failures.append("NVIDIA source panel does not identify official NVIDIA data")
            page.click('[data-close-dialog="sourceDialog"]')
            page.click("#searchClear")

            page.click("#tabAmd")
            page.wait_for_timeout(1200)

            if count("#v2Subtabs.visible") != 0:
                failures.append("Intel sub-tabs still visible after switching to AMD")
            if count("#n2Subtabs.visible") != 0:
                failures.append("NVIDIA sub-tabs still visible after switching to AMD")
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
