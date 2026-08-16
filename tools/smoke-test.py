#!/usr/bin/env python3
"""
Smoke test for Hardware Portal.

Loads the dashboard in a headless browser, exercises every tab and control,
and reports counts + JavaScript errors. Optionally writes screenshots.

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
    "amd_cpu_groups": 7,
    "amd_cpu_skus": 40,
    "amd_gpu_groups": 40,
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

            page.goto(base, wait_until="networkidle")
            page.wait_for_timeout(1500)

            # --- AMD CPU (default view) ---
            results["amd_cpu_groups"] = count(".arch-group")
            results["amd_cpu_skus"] = count(".sku-card")
            if args.shots:
                page.screenshot(path=str(shots_dir / "01-amd-cpu.png"))

            # --- Search narrows results ---
            page.fill("#searchInput", "9575F")
            page.wait_for_timeout(700)
            narrowed = visible(".arch-group")
            if narrowed >= results["amd_cpu_groups"] or narrowed == 0:
                failures.append(
                    f"search '9575F' should narrow results; got {narrowed} "
                    f"visible of {results['amd_cpu_groups']}"
                )
            results["search_visible"] = narrowed
            page.fill("#searchInput", "")
            page.wait_for_timeout(600)

            # --- Expand All renders spec tables ---
            page.click("#expandAllBtn")
            page.wait_for_timeout(1500)
            results["spec_tables"] = count("table")
            if results["spec_tables"] < 5:
                failures.append(f"expected spec tables after Expand All, got {results['spec_tables']}")
            if args.shots:
                page.screenshot(path=str(shots_dir / "02-amd-expanded.png"))
            page.click("#collapseAllBtn")
            page.wait_for_timeout(600)

            # --- AMD GPU ---
            page.click("#techTabGpu")
            page.wait_for_timeout(1800)
            results["amd_gpu_groups"] = count(".arch-group")
            if args.shots:
                page.screenshot(path=str(shots_dir / "03-amd-gpu.png"))

            # --- Intel: three sub-tabs, generation-first renderer ---
            page.click("#techTabCpu")
            page.wait_for_timeout(800)
            page.click("#tabIntel")
            page.wait_for_timeout(2000)
            for tab, key in (("xeon", "xeon"), ("client", "client"), ("graphics", "gfx")):
                page.click(f'.v2-subtab[data-tab="{tab}"]')
                page.wait_for_timeout(900)
                results[f"intel_{key}_groups"] = count(".arch-group")
                results[f"intel_{key}_cards"] = count(".sku-card")
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
            page.wait_for_timeout(1800)
            if count("#v2Subtabs.visible") != 0:
                failures.append("Intel sub-tabs still visible after switching to AMD")
            if count(".arch-group") < 7:
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
