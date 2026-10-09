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
import json
import os
import re
import socketserver
import subprocess
import sys
import threading
from pathlib import Path
from urllib.parse import parse_qs, urlparse

REPO = Path(__file__).resolve().parent.parent
SITE_REVISION = "20261007-shared-shell-2"

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
    "amd_ryzen_cards": 84,
    "amd_ryzen_models": 774,
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
    "intel_xeon_groups": 10,
    "intel_xeon_cards": 31,
    "intel_xeon_models": 553,
    "intel_client_groups": 10,
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
    # Ampere Computing: one processor tab, five product families, 26 published
    # model rows. Roadmap families without SKUs do not count as products.
    "ampere_groups": 5,
    "ampere_cards": 5,
    "ampere_models": 26,
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
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.daemon_threads = True
    socketserver.ThreadingTCPServer.request_queue_size = 64
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", port), handler)
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
    base = f"http://127.0.0.1:{args.port}/"

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

            def check_npu_tables(vendor, tab):
                report = page.evaluate("""({vendor, tab}) => {
                  const source = vendor === 'amd' ? (a2Specs.cpu || {}) : (V2_SPECS[tab] || {});
                  const models = new Map(Object.values(source).flat().map(model => [model.n, model]));
                  const seen = new Set(), errors = [];
                  for (const table of document.querySelectorAll('.cpu-spec-table')) {
                    const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
                    const rows = [...table.querySelectorAll('tbody tr')].filter(row => row.cells.length > 1);
                    const rated = rows.some(row => models.get(row.cells[0].textContent.trim())?.npu);
                    const npu = headers.indexOf('NPU TOPS');
                    if (!rated) {
                      if (npu !== -1) errors.push('NPU column shown on an unrated table');
                      continue;
                    }
                    if (npu < 0 || headers[npu + 1] !== 'L3 Cache')
                      errors.push('NPU TOPS must immediately precede L3 Cache');
                    for (const row of rows) {
                      const name = row.cells[0].textContent.trim(), model = models.get(name);
                      if (!model) continue;
                      const expected = model.npu ? String(model.npu).replace(/\\s*TOPS$/i, '') : '—';
                      if (row.cells[npu]?.textContent.trim() !== expected ||
                          row.cells.length !== headers.length)
                        errors.push(name + ': NPU value or column alignment differs');
                      if (model.npu) {
                        seen.add(name);
                        const link = row.cells[npu]?.querySelector('a.npu-source');
                        if (link?.getAttribute('href') !== model.npuSource)
                          errors.push(name + ': NPU source link missing');
                      }
                    }
                  }
                  return {errors, count: seen.size};
                }""", {"vendor": vendor, "tab": tab})
                failures.extend(report["errors"])
                expected = {("amd", "ryzen"): 126, ("intel", "client"): 84}.get((vendor, tab), 0)
                if report["count"] != expected:
                    failures.append(f"{vendor}-{tab} NPU coverage: {report['count']} != {expected}")
                results[f"{vendor}_{tab}_npu_models"] = report["count"]

            def check_benchmark_nav(vendor, tab):
                nav_id = {"amd": "epycModeNav", "intel": "xeonModeNav",
                          "nvidia": "gh200ModeNav", "ampere": "ampereModeNav"}[vendor]
                nav = page.locator(f"#{nav_id}")
                if not nav.is_visible():
                    failures.append(f"{vendor}-{tab} product navigation is hidden")
                    return
                link = nav.locator(".benchmark-mode-tab")
                if link.count() != 1:
                    failures.append(f"{vendor}-{tab} has no single Benchmarks tab")
                    return
                if link.get_attribute("href") != f"benchmarks/?site={SITE_REVISION}":
                    failures.append(f"{vendor}-{tab} benchmark link is not the unfiltered explorer: {link.get_attribute('href')}")
                if link.get_attribute("role") == "tab":
                    failures.append(f"{vendor}-{tab} page link incorrectly uses an in-page tab role")

            def check_benchmark_table_links(vendor, tab):
                """Keep one compact final column and link scores to their product."""
                tables = page.locator(".cpu-spec-table").evaluate_all("""tables =>
                  tables.map((table, index) => {
                    const headers = [...table.querySelectorAll('thead th')]
                      .map(th => th.textContent.trim());
                    const rows = [...table.querySelectorAll('tbody tr:not(.v2-empty-row)')];
                    const malformedRows = rows.filter(row => {
                      const cells = [...row.querySelectorAll(':scope > td')];
                      return cells.length !== headers.length ||
                        cells.at(-1)?.classList.contains('bt-cell') !== true ||
                        row.querySelectorAll(':scope > td.bt-cell').length !== 1;
                    }).length;
                    const scored = rows.flatMap(row => {
                      const cell = row.querySelector(':scope > td.bt-cell');
                      const link = cell?.querySelector(':scope > a[href]');
                      if (!link) return [];
                      const test = link.querySelector('.bt-test');
                      const score = link.querySelector('.bt-score');
                      const testTop = test?.getBoundingClientRect().top;
                      const scoreTop = score?.getBoundingClientRect().top;
                      return [{
                        href: link.getAttribute('href'),
                        model: row.querySelector(':scope > td:first-child')?.textContent.trim(),
                        test: test?.textContent.trim(),
                        score: score?.textContent.trim(),
                        oneLine: test && score && Math.abs(testTop - scoreTop) <= 4,
                        extra: !!cell.querySelector('.bt-meta, .bt-entry')
                      }];
                    });
                    return {index, headers, malformedRows, scored};
                  })""")
                if not tables:
                    failures.append(f"{vendor}-{tab} has no CPU specification tables")
                    return
                for table in tables:
                    headers = table["headers"]
                    if headers[-1:] != ["Benchmark"] or headers.count("Benchmark") != 1:
                        failures.append(
                            f"{vendor}-{tab} table {table['index']} needs one rightmost Benchmark column: {headers[-4:]}"
                        )
                    if any(old in headers for old in ("Integer Rate", "FP Rate", "3D Render")):
                        failures.append(f"{vendor}-{tab} table {table['index']} still has multiple benchmark columns")
                    if table["malformedRows"]:
                        failures.append(
                            f"{vendor}-{tab} table {table['index']} has {table['malformedRows']} rows with extra or misplaced cells"
                        )
                scores = [score for table in tables for score in table["scored"]]
                if not scores:
                    failures.append(f"{vendor}-{tab} has no linked CPU benchmark scores")
                    return
                mode = "client" if tab in ("ryzen", "client") else "enterprise"
                for score in scores:
                    if (not score["oneLine"] or score["extra"] or
                            not re.fullmatch(r"[0-9][0-9,.]*", score["score"] or "")):
                        failures.append(f"{vendor}-{tab} has a tall or malformed benchmark score: {score}")
                        break
                    label = score["test"] or ""
                    if mode == "client":
                        if label != "Blender5.2":
                            failures.append(f"{vendor}-{tab} score lacks Blender shorthand: {label}")
                            break
                    elif not (label.startswith(("SPECint", "SPECfp")) and
                              label.endswith(("1P", "2P"))):
                        failures.append(f"{vendor}-{tab} score lacks SPEC shorthand and CPU count: {label}")
                        break
                    url = urlparse(score["href"] or "")
                    params = parse_qs(url.query)
                    if (url.path != "benchmarks/" or
                            params.get("site") != [SITE_REVISION] or
                            params.get("mode") != [mode]):
                        failures.append(f"{vendor}-{tab} score does not link into its benchmark mode: {score['href']}")
                        break
                    if params.get("q", [""])[0].casefold() != (score["model"] or "").casefold():
                        failures.append(f"{vendor}-{tab} score link searches for the wrong model: {score['href']}")
                        break
                    if mode == "client":
                        if params.get("version") != ["5.2.0"] or params.get("compute") != ["mixed"]:
                            failures.append(f"{vendor}-{tab} Blender link lacks its test cohort: {score['href']}")
                            break
                    else:
                        expected_metric = "integer" if label.startswith("SPECint") else "floating"
                        expected_suite = "2026" if "26" in label.split()[0] else "2017"
                        expected_cpus = label[-2]
                        try:
                            linked_model = json.loads(params.get("model", [""])[0])
                        except (TypeError, ValueError):
                            linked_model = None
                        if (params.get("suite") != [expected_suite] or
                                params.get("metric") != [expected_metric] or
                                not params.get("build", [""])[0] or
                                params.get("cpus") != [expected_cpus] or
                                linked_model != [vendor.casefold(), (score["model"] or "").casefold()]):
                            failures.append(f"{vendor}-{tab} SPEC score lacks its exact product/test cohort: {score['href']}")
                            break

            def check_shared_roadmap(vendor, tab, expected_cards):
                """Roadmap leads its tab, links to the maker, and has no model UI."""
                label = f"{vendor}-{tab}"
                roadmap = page.locator("#timeline > .arch-group.dashboard-roadmap")
                if expected_cards == 0:
                    if roadmap.count():
                        failures.append(f"{label} has an unannounced roadmap group")
                    return
                if (roadmap.count() != 1 or
                        page.locator("#timeline > .arch-group.dashboard-roadmap:first-child").count() != 1):
                    failures.append(f"{label} roadmap must be the first group")
                    return
                cards = roadmap.locator(".dashboard-roadmap-card")
                if cards.count() != expected_cards:
                    failures.append(f"{label} roadmap has {cards.count()} cards, expected {expected_cards}")
                prefix = {"amd": "a2", "intel": "v2", "nvidia": "n2"}[vendor]
                if (roadmap.get_attribute("id") != f"{prefix}-roadmap" or
                        roadmap.locator(".arch-header.unreleased-arch").count() != 1 or
                        roadmap.locator(".arch-body[inert]").count() != 1):
                    failures.append(f"{label} roadmap header or collapsed state is wrong")
                card_checks = page.eval_on_selector_all(
                    "#timeline > .dashboard-roadmap .dashboard-roadmap-card",
                    """(cards, domain) => cards.every(card => {
                      const links = [...card.querySelectorAll('a[href]')];
                      return links.length > 0 && links.every(link => {
                        const url = new URL(link.href);
                        return url.protocol === 'https:' &&
                          (url.hostname === domain || url.hostname.endsWith('.' + domain));
                      }) && !card.matches('.has-specs, [role], [tabindex], [data-target]') &&
                        !card.querySelector('table, .cpu-spec-wrapper, [data-target]');
                    })""", f"{vendor}.com")
                if not card_checks or roadmap.locator("tbody tr, .has-specs").count():
                    failures.append(f"{label} roadmap needs official links and static, nonselectable cards")

            def check_roadmap_rows(vendor, tab, expected_cards):
                """Expansion exposes collateral without adding model rows."""
                if not expected_cards:
                    return
                label = f"{vendor}-{tab}"
                if count(".dashboard-roadmap .arch-body[inert]"):
                    failures.append(f"{label} roadmap stayed inert after Expand all")
                if count(".dashboard-roadmap tbody tr"):
                    failures.append(f"{label} roadmap introduced model rows")
                all_rows = count(".cpu-spec-table tbody tr") - count(".v2-empty-row")
                released_rows = (count(".arch-group:not(.dashboard-roadmap) .cpu-spec-table tbody tr") -
                                 count(".arch-group:not(.dashboard-roadmap) .v2-empty-row"))
                if all_rows != released_rows:
                    failures.append(f"{label} roadmap changed the released model total")

            def check_chips(label, require_cards=False):
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
                    groups = visible(".arch-group:not(.dashboard-roadmap)")
                    cards = count(".arch-group:not(.dashboard-roadmap):not(.hidden) .sku-card:not(.hidden)")
                    rows = count(".arch-group:not(.dashboard-roadmap):not(.hidden) tbody tr[data-search]:not(.hidden)")
                    if groups == 0 or (require_cards and (cards == 0 or rows == 0)):
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

            site_nav = page.locator(".topbar > .site-primary-nav")
            if site_nav.count() != 1 or not site_nav.is_visible():
                failures.append("Products page is missing the shared site navigation")
            else:
                products_link = site_nav.locator(f'a[href="./?site={SITE_REVISION}"]')
                benchmarks_link = site_nav.locator(f'a[href="benchmarks/?site={SITE_REVISION}"]')
                platforms_link = site_nav.locator('a[href="platforms/index.html#finder"]')
                if (site_nav.locator("a").count() != 3 or products_link.count() != 1 or
                        benchmarks_link.count() != 1 or platforms_link.count() != 1 or
                        products_link.get_attribute("aria-current") != "page" or
                        benchmarks_link.get_attribute("aria-current") is not None or
                        platforms_link.get_attribute("aria-current") is not None):
                    failures.append("Products page has incorrect Products/Benchmarks/Platforms site navigation")
            # Exercise the maintained guide through the same links visitors use.
            # Keep its reviewed catalog separate from exact-SKU compatibility data.
            expected_platforms = json.loads(
                (REPO / "platforms" / "build-manifest.json").read_text(encoding="utf-8")
            )["modelCount"]
            page.locator('.site-primary-nav a[href="platforms/index.html#finder"]').click()
            page.wait_for_url("**/platforms/index.html#finder")
            page.locator("#resultsRegion .platform-card").first.wait_for(state="visible")
            platform_nav = page.locator(".site-primary-nav")
            platform_links = platform_nav.locator("a")
            if (platform_links.all_inner_texts() != ["Products", "Benchmarks", "Platforms"] or
                    platform_nav.locator('a[aria-current="page"]').inner_text() != "Platforms"):
                failures.append("Platforms page has incorrect shared navigation")
            platform_count = page.locator("#resultsRegion .platform-card").count()
            results["platform_finder_profiles"] = platform_count
            if platform_count != expected_platforms or platform_count < 102:
                failures.append(f"Platform Finder lost reviewed profiles: {platform_count}/{expected_platforms}")
            page.locator("#platformSearch").fill("C245 M8")
            page.wait_for_function("document.querySelectorAll('#resultsRegion .platform-card').length === 1")
            if page.locator("#resultsRegion .platform-card").get_attribute("data-platform") != "ucs:c245":
                failures.append("Platform Finder search no longer finds the reviewed C245 M8 profile")

            # Old local bookmarks must survive the hosted directory move, including
            # search/hash state. Merely keeping a second copy can hide stale guides.
            page.goto(base + "platforms/amd-platform-finder.html?integration=1#finder?oem=hpe&cpu=EPYC+9005")
            page.wait_for_url("**/platforms/index.html?integration=1#finder?oem=hpe&cpu=EPYC+9005")
            page.locator("#resultsRegion .platform-card").first.wait_for(state="visible")
            if (page.locator("#filter-oem").input_value() != "hpe" or
                    page.locator("#filter-cpu").input_value() != "EPYC 9005"):
                failures.append("Legacy Platform Finder redirect lost filter state")
            profile_ids = page.locator("#resultsRegion .platform-card").evaluate_all(
                "cards => cards.map(card => card.dataset.platform)")
            if not profile_ids or not all(model.startswith("hpe:") for model in profile_ids):
                failures.append("Platform Finder OEM deep link failed")
            page.locator("#resultsRegion [data-model]").first.click()
            page.locator("#detailDialog[open]").wait_for(state="visible")
            page.reload()
            page.locator("#detailDialog[open]").wait_for(state="visible")
            if "model=" not in page.url:
                failures.append("Platform Finder model detail lost its shareable deep link")
            page.locator("#detailDialog [data-close]").click()

            platform_nav.get_by_role("link", name="Benchmarks", exact=True).click()
            page.wait_for_url("**/benchmarks/**")
            page.locator('.site-primary-nav a[aria-current="page"]').wait_for(state="visible")
            if page.locator('.site-primary-nav a[aria-current="page"]').inner_text() != "Benchmarks":
                failures.append("Platforms to Benchmarks navigation failed")
            page.locator(".site-primary-nav").get_by_role("link", name="Products", exact=True).click()
            page.locator("#a2Subtabs.visible").wait_for(state="visible")
            if page.locator('.site-primary-nav a[aria-current="page"]').inner_text() != "Products":
                failures.append("Platforms roundtrip did not restore Products")

            if count(".topbar .brand-lockup") != 1 or count(".topbar-tools #whatsNewBtn") != 1:
                failures.append("Products page is missing the shared logo or What's new trigger")
            if count(".navrow .product-context #vendorPill") != 1:
                failures.append("Products vendor switcher is outside its product controls")

            if page.locator(".brand-lockup-version").inner_text().strip().lower() != "public beta 0.0.5":
                failures.append("header does not show public beta 0.0.5")
            page.click("#whatsNewBtn")
            releases = page.locator("#releaseHistory .release-version")
            release_dates = releases.locator("time").all_inner_texts()
            release_topics = page.locator("#whatsNewDialog .release-note h4").all_inner_texts()
            if count("#whatsNewDialog[open]") != 1 or len(release_topics) < 8 or not all(
                term in " ".join(release_topics).lower()
                for term in ("grace hopper", "xeon 6", "epyc 9005")
            ):
                failures.append("What's new dialog is missing release topics")
            if (releases.count() != 6 or len(release_dates) != 6 or not all(release_dates) or
                    releases.first.locator("time").get_attribute("datetime") != "2026-10-09" or
                    not all(term in " ".join(release_topics).lower()
                            for term in ("benchmark results", "all manufacturers", "oem server families"))):
                failures.append("What's new history is missing the October 9 Platforms release")
            if not page.locator("#releaseHistory").evaluate(
                "el => el.scrollHeight > el.clientHeight"
            ):
                failures.append("What's new history is not scrollable")
            page.keyboard.press("Escape")
            page.wait_for_timeout(150)  # native dialog close and aria sync are asynchronous
            if count("#whatsNewDialog[open]") != 0 or page.locator("#whatsNewBtn").get_attribute("aria-expanded") != "false":
                failures.append("What's new dialog did not close with Escape")

            # --- AMD: three sub-tabs, product-first renderer ---
            page.wait_for_function(
                "() => currentVendor === 'amd' && document.getElementById('a2Subtabs')?.classList.contains('visible')",
                timeout=20000,
            )
            if count("#a2Subtabs.visible") != 1:
                failures.append("AMD sub-tabs not visible on load")
            for tab in ("epyc", "ryzen", "gpu"):
                page.click(f'.a2-subtab[data-tab="{tab}"]')
                page.wait_for_timeout(700)
                check_benchmark_nav("amd", tab)
                check_shared_roadmap("amd", tab, {"epyc": 5, "ryzen": 1, "gpu": 4}[tab])
                results[f"amd_{tab}_groups"] = count(".arch-group:not(.dashboard-roadmap)")
                results[f"amd_{tab}_cards"] = count(".arch-group:not(.dashboard-roadmap) .sku-card")
                page.click("#expandAllBtn")
                page.wait_for_timeout(700)
                check_roadmap_rows("amd", tab, {"epyc": 5, "ryzen": 1, "gpu": 4}[tab])
                results[f"amd_{tab}_models"] = (
                    count(".cpu-spec-table tbody tr") - count(".v2-empty-row"))
                if tab in ("epyc", "ryzen"):
                    check_benchmark_table_links("amd", tab)
                    check_npu_tables("amd", tab)
                if tab == "ryzen":
                    ai_errors = page.evaluate("""async () => {
                      const errors = [];
                      const allRows = [...document.querySelectorAll('.cpu-spec-table tbody tr')];
                      const find = name => allRows.find(row => row.cells[0]?.textContent.trim() === name);
                      const expected = {
                        'Ryzen AI 9 HX 475': 'Up to 60', 'Ryzen AI 9 HX 470': 'Up to 55',
                        'Ryzen AI 9 HX PRO 475': 'Up to 60', 'Ryzen AI 9 HX PRO 470': 'Up to 55',
                        'Ryzen AI 9 HX 375': 'Up to 55', 'Ryzen AI 9 HX 370': 'Up to 50',
                        'Ryzen AI 9 HX PRO 375': 'Up to 55', 'Ryzen AI 9 HX PRO 370': 'Up to 50'
                      };
                      for (const [name, npu] of Object.entries(expected)) {
                        const row = find(name);
                        const headers = [...(row?.closest('table').querySelectorAll('thead th') || [])]
                          .map(th => th.textContent.trim());
                        const npuIndex = headers.indexOf('NPU TOPS');
                        if (!row || npuIndex !== 5 || headers[npuIndex + 1] !== 'L3 Cache' ||
                            headers.length !== 13 || row.cells[npuIndex]?.textContent.trim() !== npu ||
                            !row.cells[npuIndex]?.querySelector('a[href^="https://www.amd.com/"]')) {
                          errors.push(`${name}: NPU value, source or table width changed`);
                        }
                      }
                      for (const [higher, lower] of [
                        ['Ryzen AI 9 HX 475', 'Ryzen AI 9 HX 470'],
                        ['Ryzen AI 9 HX PRO 475', 'Ryzen AI 9 HX PRO 470'],
                        ['Ryzen AI 9 HX 375', 'Ryzen AI 9 HX 370'],
                        ['Ryzen AI 9 HX PRO 375', 'Ryzen AI 9 HX PRO 370'],
                        ['Ryzen AI 7 445', 'Ryzen AI 5 435']
                      ]) {
                        const a = find(higher), b = find(lower);
                        if (!a || !b || a.parentElement !== b.parentElement || a.rowIndex >= b.rowIndex)
                          errors.push(`${higher} must precede ${lower}`);
                      }
                      const selected = [find('Ryzen AI 9 HX 475'), find('Ryzen AI 9 HX 470')];
                      if (selected.every(Boolean)) {
                        const details = await dashboardLoadCompareDetails();
                        dashboardPaintComparison(selected.map(dashboardRowRecord), details);
                        const compareRows = [...dom.compareContent.querySelectorAll('tbody tr')];
                        for (const [label, values] of [
                          ['NPU TOPS', ['Up to 60 TOPS', 'Up to 55 TOPS']],
                          ['Overall AI TOPS', ['Up to 91 TOPS', 'Up to 86 TOPS']],
                          ['Socket', ['FP8', 'FP8']]
                        ]) {
                          const row = compareRows.find(r => r.querySelector('th')?.textContent === label);
                          const actual = [...(row?.querySelectorAll('td') || [])].map(td => td.textContent);
                          if (JSON.stringify(actual) !== JSON.stringify(values)) errors.push(`${label}: comparison mismatch`);
                        }
                        if (dom.compareContent.querySelectorAll('.compare-sources a[href^="https://www.amd.com/"]').length !== 2)
                          errors.push('AI comparison must link both official AMD product pages');
                      }
                      return errors;
                    }""")
                    failures.extend(ai_errors)
                if tab == "epyc":
                    price_check = page.eval_on_selector_all(
                        ".cpu-spec-table", """tables => ({
                          columns: tables.every(table => {
                            const headers = [...table.querySelectorAll('th')]
                              .map(th => th.textContent.trim());
                            return headers.at(-3) === '1kU Price' &&
                              headers.at(-2) === 'Product ID' &&
                              headers.at(-1) === 'Benchmark';
                          }),
                          published: tables.some(table => [...table.querySelectorAll('tr')]
                            .some(row => row.querySelector('td')?.textContent.trim() ===
                              'EPYC 9996' && [...row.querySelectorAll('td')].at(-3)
                                ?.textContent.trim() === '$14,904')),
                          missing: tables.some(table => [...table.querySelectorAll('tbody tr')]
                            .some(row => [...row.querySelectorAll('td')].at(-3)
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
            narrowed = visible(".arch-group:not(.dashboard-roadmap) .sku-card")
            if snapped != "96":
                failures.append(f"typed min 96 snapped to {snapped}")
            if not (0 < narrowed < results["amd_epyc_cards"]):
                failures.append(f"core min=96 should narrow 12 cards, got {narrowed}")
            results["amd_core_min96_cards"] = narrowed
            page.click("#a2core .cr-pre:last-child")   # All
            page.wait_for_timeout(350)
            if visible(".arch-group:not(.dashboard-roadmap) .sku-card") != results["amd_epyc_cards"]:
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
            all_series = count(".arch-group:not(.dashboard-roadmap)")
            page.fill("#searchInput", "9575F")
            page.wait_for_timeout(700)
            narrowed = visible(".arch-group:not(.dashboard-roadmap)")
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
            if count(".arch-group:not(.dashboard-roadmap).expanded") or count(".cpu-spec-wrapper.open"):
                failures.append("AMD exact search auto-opened a result")
            if count(".search-summary:not([hidden])") != 1:
                failures.append("AMD exact search should show one match summary")
            page.click(".arch-group:not(.dashboard-roadmap):not(.hidden) .arch-header")
            page.click(".arch-group:not(.dashboard-roadmap) .sku-card:not(.hidden)")
            page.wait_for_timeout(150)
            if count("tr.search-match") != 1:
                failures.append("AMD 9575F search should highlight exactly one row")
            page.fill("#searchInput", "")
            page.click("#collapseAllBtn")
            page.wait_for_timeout(350)

            # Unit boundaries such as "MB 300 W" must not masquerade as B300.
            page.fill("#searchInput", "B300")
            page.wait_for_selector('.global-search-route[data-vendor="nvidia"][data-tab="datacenter"]')
            if count(".global-search-route") != 1 or visible(".arch-group:not(.dashboard-roadmap)") != 0:
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
                check_benchmark_nav("intel", tab)
                roadmap_cards = {"xeon": 2, "client": 1, "graphics": 1}[tab]
                check_shared_roadmap("intel", tab, roadmap_cards)
                results[f"intel_{key}_groups"] = count(".arch-group:not(.dashboard-roadmap)")
                results[f"intel_{key}_cards"] = count(".arch-group:not(.dashboard-roadmap) .sku-card")
                check_chips(f"intel-{tab}")
                # Every Intel sub-tab now carries spec data, so every one gets
                # a model count. Expanding is required -- the rows only exist
                # in the DOM once the cards are open.
                page.click("#expandAllBtn")
                page.wait_for_timeout(1200)
                check_roadmap_rows("intel", tab, roadmap_cards)
                results[f"intel_{key}_models"] = (
                    count(".cpu-spec-table tbody tr") - count(".v2-empty-row"))
                if tab in ("xeon", "client"):
                    check_benchmark_table_links("intel", tab)
                    check_npu_tables("intel", tab)
                page.click("#collapseAllBtn")
                page.wait_for_timeout(500)
                if args.shots:
                    page.screenshot(path=str(shots_dir / f"04-intel-{tab}.png"))

            # Intel classifies the nine FCLGA1700 6300P models as Raptor
            # Lake-E Refresh, separate from the FCLGA4710 Granite Rapids SP.
            page.click('.v2-subtab[data-tab="xeon"]')
            page.wait_for_timeout(850)
            families = page.evaluate("""() => ({
                granite: (V2_SPECS.xeon['Granite Rapids SP'] || []).map(m => m.n),
                raptor: (V2_SPECS.xeon['Raptor Lake-E Refresh'] || []).map(m => m.n),
                card: document.querySelector('#v2-xeon6 .sku-card[data-seg="1P"] .sku-name')?.textContent
            })""")
            if (len(families['granite']) != 34 or len(families['raptor']) != 9
                    or families['card'] != 'Raptor Lake-E Refresh'
                    or any(name.startswith('Xeon 63') for name in families['granite'])
                    or not all(name.startswith('Xeon 63') for name in families['raptor'])):
                failures.append(f"Xeon 6300P family split is wrong: {families}")

            # Core microarchitecture names must resolve to the right Xeon 6
            # codename cards in both the visible tab and global search.
            for term, expected in (
                ("Redwood Cove", {"Granite Rapids AP", "Granite Rapids SP",
                                   "Granite Rapids D", "Granite Rapids WS"}),
                ("Crestmont", {"Sierra Forest SP"}),
            ):
                page.fill("#searchInput", term)
                page.wait_for_timeout(550)
                cards = set(page.locator(
                    ".arch-group:not(.dashboard-roadmap):not(.hidden) "
                    ".sku-card:not(.hidden) .sku-name").all_text_contents())
                if cards != expected:
                    failures.append(f"{term} search returned {sorted(cards)}, expected {sorted(expected)}")
                if count('.global-search-route[data-vendor="intel"][data-tab="xeon"]') != 1:
                    failures.append(f"{term} global search did not find Intel Xeon")
                if count(".arch-group:not(.hidden) .sku-card:not(.hidden) .v2-core-design") != len(expected):
                    failures.append(f"{term} card core-design labels are missing")
            page.click("#searchClear")

            # Intel now follows the same exact-match and collapsed-result rules.
            page.click('.v2-subtab[data-tab="client"]')
            page.wait_for_timeout(850)
            page.fill("#searchInput", "14900K")
            page.wait_for_timeout(500)
            if count(".arch-group:not(.dashboard-roadmap).expanded") or count(".cpu-spec-wrapper.open"):
                failures.append("Intel exact search auto-opened a result")
            if count(".search-summary:not([hidden])") != 1:
                failures.append("Intel 14900K search should prefer one exact SKU")
            summary = page.locator(".search-summary:not([hidden])").text_content()
            if "Exact SKU" not in summary or "14900K" not in summary:
                failures.append(f"Intel exact-match explanation is wrong: {summary}")
            page.click(".arch-group:not(.dashboard-roadmap):not(.hidden) .arch-header")
            page.click(".arch-group:not(.dashboard-roadmap) .sku-card:not(.hidden)")
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
            page.locator(".cpu-spec-wrapper.open tbody tr[data-search]").nth(0).locator("td").first.click()
            page.locator(".cpu-spec-wrapper.open tbody tr[data-search]").nth(1).locator("td").first.click()
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
            page.locator(".cpu-spec-wrapper.open tbody tr[data-search]").first.locator("td").first.click()
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
                check_benchmark_nav("nvidia", tab)
                roadmap_cards = {"datacenter": 3, "geforce": 0, "cpu": 1}[tab]
                check_shared_roadmap("nvidia", tab, roadmap_cards)
                results[f"nvidia_{tab}_groups"] = count(".arch-group:not(.dashboard-roadmap)")
                check_chips(f"nvidia-{tab}")
                page.click("#expandAllBtn")
                page.wait_for_timeout(350)
                check_roadmap_rows("nvidia", tab, roadmap_cards)
                results[f"nvidia_{tab}_models"] = (
                    count(".cpu-spec-table tbody tr") - count(".v2-empty-row"))
                if tab == "cpu":
                    check_benchmark_table_links("nvidia", tab)
                if args.shots:
                    page.locator(".arch-group:not(.dashboard-roadmap) .sku-card.has-specs").first.click()
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

            # --- Ampere Computing: five server-processor families ---
            # Search from another vendor to catch omissions in the global index
            # and navigation. This SKU is unique to AmpereOne M.
            page.fill("#searchInput", "A192-32M")
            ampere_route = '.global-search-route[data-vendor="ampere"][data-tab="processors"]'
            page.wait_for_selector(ampere_route)
            if count("#tabAmpere.search-beacon") != 1:
                failures.append("global search did not highlight Ampere for A192-32M")
            page.click(ampere_route)
            page.wait_for_timeout(500)
            if (page.input_value("#searchInput") != "A192-32M" or
                    count('#vendorPill[data-active="ampere"]') != 1):
                failures.append("Ampere search route did not retain the SKU query")
            if count(".search-summary:not([hidden])") != 1:
                failures.append("Ampere exact search should show one A192-32M match")
            if not all(part in page.url for part in
                       ("vendor=ampere", "tab=processors", "q=A192-32M")):
                failures.append(f"Ampere search URL did not preserve state: {page.url}")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(900)
            if (page.input_value("#searchInput") != "A192-32M" or
                    count('#vendorPill[data-active="ampere"]') != 1):
                failures.append("shared Ampere search URL did not restore its state")
            page.click("#searchClear")
            page.wait_for_timeout(400)
            check_benchmark_nav("ampere", "processors")
            page.click("#ampereGuideTab")
            page.wait_for_function("() => new URL(location.href).searchParams.get('guide') === 'ampere'")
            if (not page.locator("#ampereGuidePanel").is_visible() or
                    page.locator("#epycProductsPanel").is_visible() or
                    "panel=guide" not in page.url):
                failures.append("Ampere architecture tab did not open its guide panel")
            page.locator("#ampereGuideFrame").wait_for(state="attached")
            page.click("#ampereProductsTab")
            if (page.locator("#ampereGuidePanel").is_visible() or
                    not page.locator("#epycProductsPanel").is_visible()):
                failures.append("Ampere Products tab did not restore specifications")

            results["ampere_groups"] = count(".arch-group:not(.p2-roadmap)")
            results["ampere_cards"] = count(".arch-group:not(.p2-roadmap) .sku-card")
            if any(count(f"#{tab}.visible") for tab in
                   ("a2Subtabs", "v2Subtabs", "n2Subtabs")):
                failures.append("another vendor's product sub-tabs leaked into Ampere")
            if results["ampere_groups"] != 5 or results["ampere_cards"] != 5:
                failures.append("Ampere should render one card in each of five families")
            roadmap = page.locator("#timeline > .arch-group").first
            if (roadmap.get_attribute("id") != "p2-roadmap" or
                    count(".p2-roadmap .arch-header.unreleased-arch") != 1 or
                    count(".p2-roadmap .p2-roadmap-card") != 2 or
                    count(".p2-roadmap .p2-roadmap-card a[href*='amperecomputing.com']") != 2 or
                    count(".p2-roadmap .has-specs, .p2-roadmap tbody tr") != 0):
                failures.append("Ampere roadmap must lead the timeline with two linked, non-selectable products")
            roadmap_header = roadmap.locator(".arch-header")
            roadmap_header.focus()
            page.keyboard.press("Enter")
            if roadmap_header.get_attribute("aria-expanded") != "true":
                failures.append("Ampere roadmap did not expand with Enter")
            page.keyboard.press("Space")
            if roadmap_header.get_attribute("aria-expanded") != "false":
                failures.append("Ampere roadmap did not collapse with Space")
            family_names = [name.strip().lower() for name in
                            page.locator(".arch-group:not(.p2-roadmap) .arch-name").all_text_contents()]
            family_order = ("ampereone m", "ampereone", "altra max", "altra", "emag")
            if len(family_names) == 5 and any(
                    expected not in actual for expected, actual in
                    zip(family_order, family_names)):
                failures.append(f"Ampere family order is wrong: {family_names}")
            first_header = page.locator(".arch-group:not(.p2-roadmap) .arch-header").first
            first_header.focus()
            page.keyboard.press("Enter")
            if first_header.get_attribute("aria-expanded") != "true":
                failures.append("Ampere family did not expand with Enter")
            page.keyboard.press("Space")
            if first_header.get_attribute("aria-expanded") != "false":
                failures.append("Ampere family did not collapse with Space")
            first_header.click()
            first_card = page.locator(".arch-group:not(.p2-roadmap) .sku-card").first
            first_card.focus()
            page.keyboard.press("Enter")
            if first_card.get_attribute("aria-expanded") != "true":
                failures.append("Ampere specification card did not open with Enter")
            page.keyboard.press("Space")
            if first_card.get_attribute("aria-expanded") != "false":
                failures.append("Ampere specification card did not close with Space")
            first_header.click()
            if count("#p2core .crt") < 2:
                failures.append("Ampere core-count slider has fewer than two stops")
            check_chips("ampere-processors", require_cards=True)

            page.click("#expandAllBtn")
            page.wait_for_timeout(350)
            results["ampere_models"] = count(
                ".cpu-spec-table tbody tr[data-search]")
            check_benchmark_table_links("ampere", "processors")
            if results["ampere_models"] != 26:
                failures.append("Ampere inventory must have exactly 26 published model rows")
            rows_per_family = page.eval_on_selector_all(
                ".arch-group:not(.p2-roadmap)", "groups => groups.map(group => group.querySelectorAll('tbody tr[data-search]').length)")
            if any(rows == 0 for rows in rows_per_family):
                failures.append(f"Ampere has a family without published models: {rows_per_family}")
            model_names = [name.strip() for name in page.locator(
                ".cpu-spec-table tbody tr[data-search] td:first-child").all_text_contents()]
            if len(set(model_names)) != len(model_names):
                failures.append("Ampere inventory repeats a published model row")
            model_text = " ".join(page.locator(
                ".cpu-spec-table tbody tr[data-search]").all_text_contents())
            if "A192-32M" not in model_text:
                failures.append("AmpereOne M A192-32M specification row is missing")
            power_headers = [h.strip() for h in page.locator(
                ".cpu-spec-table thead th").all_text_contents()]
            if power_headers.count("Usage Power") != 4 or power_headers.count("TDP") != 1:
                failures.append("Ampere power headings should distinguish four usage-power families from eMAG TDP")
            if any(name in model_text for name in
                   ("Graviton", "Axion", "Cobalt", "Grace")):
                failures.append("a cloud or other-manufacturer chip appeared in Ampere rows")
            if args.shots:
                page.screenshot(path=str(shots_dir / "08-ampere-families.png"))

            page.click("#dataSourcesBtn")
            source_links = page.locator(
                '#sourceContent a[href*="amperecomputing.com"]').count()
            if source_links == 0:
                failures.append("Ampere source panel has no official Ampere Computing link")
            page.click('[data-close-dialog="sourceDialog"]')

            # Two Ampere model rows should be selectable and compare on cores.
            page.locator(".arch-group:not(.p2-roadmap) .sku-card").first.click()
            page.wait_for_selector(".cpu-spec-wrapper.open tbody tr[data-search]")
            ampere_rows = page.locator(".cpu-spec-wrapper.open tbody tr[data-search]")
            if ampere_rows.count() < 2:
                failures.append("Ampere's first family has fewer than two selectable SKUs")
            else:
                ampere_rows.nth(0).locator("td").first.click()
                ampere_rows.nth(1).locator("td").first.click()
                if (count("#compareTray:not([hidden])") != 1 or
                        page.locator("#compareOpenBtn").is_disabled()):
                    failures.append("Ampere comparison tray did not enable for two SKUs")
                else:
                    page.click("#compareOpenBtn")
                    if (count("#compareDialog[open]") != 1 or
                            count("#compareDialog thead th") != 3):
                        failures.append("Ampere comparison did not show two products")
                    page.wait_for_function("""() => [...document.querySelectorAll('#compareDialog tbody th')]
                        .some(th => th.textContent.trim() === 'CPU cores')""")
                    core_row = page.locator(
                        "#compareDialog tbody tr:has(> th:text-is('CPU cores'))")
                    if (core_row.count() != 1 or any(
                            value.strip() == '—' for value in
                            core_row.locator('td').all_text_contents())):
                        failures.append("Ampere comparison is missing CPU core counts")
                    page.click('[data-close-dialog="compareDialog"]')
                page.click("#compareClearBtn")
            page.click("#collapseAllBtn")
            page.set_viewport_size({"width": 390, "height": 900})
            page.wait_for_timeout(300)
            if page.evaluate("document.documentElement.scrollWidth > innerWidth + 1"):
                failures.append("Ampere tab overflows a 390px phone viewport")
            if args.shots:
                page.screenshot(path=str(shots_dir / "09-ampere-mobile.png"))
            page.set_viewport_size({"width": 1440, "height": 1000})

            page.click("#tabAmd")
            page.wait_for_timeout(1200)

            if count("#v2Subtabs.visible") != 0:
                failures.append("Intel sub-tabs still visible after switching to AMD")
            if count("#n2Subtabs.visible") != 0:
                failures.append("NVIDIA sub-tabs still visible after switching to AMD")
            if count("#a2Subtabs.visible") != 1:
                failures.append("AMD sub-tabs not restored after returning from Intel")
            if count(".arch-group:not(.dashboard-roadmap)") < 6:
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
