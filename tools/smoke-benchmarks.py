#!/usr/bin/env python3
"""Browser smoke test for the standalone ChipIndex benchmark page.

Serve the static site, exercise the SPEC, MLPerf, and Blender cohorts, and fail
on a broken interaction, wrong source set, JavaScript error, or phone overflow.
Run: python tools/smoke-benchmarks.py
"""

from __future__ import annotations

import functools
import http.server
import json
import re
import socketserver
import threading
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "js" / "data"
ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
SITE_REVISION = "20261007-shared-shell-2"
SPEC_CASES = (
    ("2026", "integer", "enterprise-benchmark-2026-int-sample.json", 20),
    ("2026", "floating", "enterprise-benchmark-2026-fp-sample.json", 20),
    ("2017", "integer", "enterprise-benchmark-sample.json", 140),
    ("2017", "floating", "enterprise-benchmark-fp-sample.json", 130),
)
SPEC_RESULT_PATHS = {
    ("2026", "integer"): "/cpu2026/results/rint2026/",
    ("2026", "floating"): "/cpu2026/results/rfp2026/",
    ("2017", "integer"): "/cpu2017/results/rint2017/",
    ("2017", "floating"): "/cpu2017/results/rfp2017/",
}
MLPERF_CASES = (
    ("server", "enterprise-benchmark-mlperf-v6-server-sample.json", 16),
    ("offline", "enterprise-benchmark-mlperf-v6-offline-sample.json", 16),
)
CATALOG_TYPES = {
    "enterprise": ({"amd/epyc", "intel/xeon", "nvidia/cpu", "ampere/processors"}, 918),
    "accelerator": ({"nvidia/datacenter"}, 53),
    "client": ({"amd/ryzen", "intel/client"}, 1114),
    "graphics": ({"intel/graphics", "nvidia/geforce"}, 352),
}


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class LocalServer(socketserver.ThreadingTCPServer):
    # The page loads independent source snapshots concurrently, like the real preview.
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 64


def snapshot(filename):
    with (DATA / filename).open(encoding="utf-8") as handle:
        return json.load(handle)



def expected_spec_rows(page, filename, cpu_count=None):
    """Resolve expected source rows from the selected build before CPU count."""
    rows = snapshot(filename)["results"]
    if "2026" in filename:
        build = page.locator("#specBuildSelect").input_value()
        rows = [row for row in rows if row["benchmarkVersion"] == build]
    return [row for row in rows if cpu_count is None or row["cpuCount"] == cpu_count]


def wait_for_restored_view(page):
    """Source rows may paint before the asynchronous catalog and shared view restore."""
    page.wait_for_function(
        "() => /^[0-9,]+$/.test(document.querySelector('#catalogMatchedCount').textContent.trim())"
    )


def select_legacy_spec_build(page):
    """Keep established interaction cases on their original CPU2026 build."""
    if page.locator("#cpu2026SuiteButton").get_attribute("aria-pressed") != "true":
        return
    select = page.locator("#specBuildSelect")
    if select.locator('option[value="SPEC CPU2026 v0.902.0"]').count() and select.is_visible():
        select.select_option("SPEC CPU2026 v0.902.0")


def catalog_expected_counts():
    """Count matched catalog identities independently of the rendered badges."""
    payload = snapshot("benchmark-catalog.json")
    products = payload["products"]
    check(len(products) == 2431, "catalog lost distinct dashboard products")
    matched = sum(bool(product["snapshotMetrics"]) for product in products)
    check(payload["meta"]["productsInCurrentSnapshots"] == matched,
          "catalog metadata does not match products with snapshot results")
    categories = {}
    for kind, (allowed_tabs, expected_total) in CATALOG_TYPES.items():
        members = [product for product in products
                   if allowed_tabs.intersection(product["dashboardTabs"])
                   or product["dashboardTabs"] == ["amd/gpu"] and
                   (product["sourceSegment"] == "datacenter") == (kind == "accelerator")
                   and kind in ("accelerator", "graphics")]
        check(len(members) == expected_total,
              f"catalog {kind} total changed unexpectedly: {len(members)}")
        categories[kind] = (sum(bool(product["snapshotMetrics"]) for product in members),
                            expected_total)
    return matched, categories


def source_key(url):
    parsed = urlsplit(url)
    return parsed.hostname, parsed.path, tuple(sorted(parse_qsl(parsed.query)))


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def check_shared_shell(page, active_section):
    """Both routes expose the same site identity, navigation, and release history."""
    nav = page.locator(".topbar .site-primary-nav")
    check(nav.count() == 1 and nav.is_visible(),
          f"{active_section}: shared site navigation is missing")
    links = nav.locator("a")
    check(links.count() == 2 and links.all_inner_texts() == ["Products", "Benchmarks"],
          f"{active_section}: global navigation labels changed")
    active = links.nth(0 if active_section == "Products" else 1)
    inactive = links.nth(1 if active_section == "Products" else 0)
    check(active.get_attribute("aria-current") == "page" and
          inactive.get_attribute("aria-current") is None,
          f"{active_section}: global navigation marks the wrong page active")
    brand = page.locator(".topbar .brand-lockup")
    check(brand.count() == 1 and brand.is_visible(),
          f"{active_section}: shared ChipIndex brand is missing")
    trigger = page.locator(".topbar-tools #whatsNewBtn")
    check(trigger.count() == 1 and trigger.is_visible(),
          f"{active_section}: shared What's new button is missing")
    trigger.click()
    dialog = page.locator("#whatsNewDialog")
    check(dialog.count() == 1 and dialog.get_attribute("open") is not None and
          trigger.get_attribute("aria-expanded") == "true",
          f"{active_section}: What's new did not open")
    dates = dialog.locator("#releaseHistory .release-version time").evaluate_all(
        "items => items.map(item => item.getAttribute('datetime'))"
    )
    check(len(dates) == 5 and dates[0] == "2026-10-07" and all(dates),
          f"{active_section}: dated release history is incomplete")
    page.keyboard.press("Escape")
    page.wait_for_function(
        "() => !document.querySelector('#whatsNewDialog').open && "
        "document.querySelector('#whatsNewBtn').getAttribute('aria-expanded') === 'false'"
    )
    return brand.inner_text().strip(), dates


def select_section(page, section):
    """Navigate through the page's visible information sections."""
    page.locator(f'[data-section="{section}"]').click()
    check(page.locator(f'[data-section="{section}"]').get_attribute("aria-selected") == "true",
          f"{section}: section navigation did not mark the active tab")


def open_test_conditions(page):
    disclosure = page.locator("#testConditionsDisclosure")
    if disclosure.get_attribute("open") is None:
        disclosure.locator("summary").click()


def check_empty_comparison(page, label):
    check(page.locator("#comparisonDiagram .benchmark-compare-row").count() == 0,
          f"{label}: comparison contains a result the user did not select")


def clear_comparison(page):
    if page.locator("#clearComparison").is_enabled():
        page.locator("#clearComparison").click()
    check_empty_comparison(page, "clear comparison")


def select_ranked_results(page, count=3):
    clear_comparison(page)
    for index in range(count):
        page.locator("#rankedResults .benchmark-select-button").nth(index).click()
    check(page.locator("#comparisonDiagram .benchmark-compare-row").count() == count,
          "selected results did not enter the comparison")


def check_model_chart_data(page, rows, label, representative="highest"):
    """The chart links to its documented source report per model."""
    grouped = {}
    for row in rows:
        key = (row["vendor"].casefold(), row["model"].casefold())
        grouped.setdefault(key, []).append(row)
    representatives = {}
    for key, reports in grouped.items():
        ordered = sorted(reports, key=lambda row: (row["score"], row["sourceUrl"]))
        representatives[key] = (ordered[(len(ordered) - 1) // 2]
                                if representative == "middle" else ordered[-1])
    limited_chart = len(representatives) > 25
    if limited_chart:
        page.wait_for_function(
            "() => document.querySelectorAll('#modelChartPlot .benchmark-model-chart-item').length === 25"
        )
        range_button = page.locator("#modelChartRangeButton")
        check(range_button.is_visible() and f"Show all {len(representatives)} models" in range_button.inner_text(),
              f"{label}: expanded chart lacks a useful range control")
        range_button.click()
        check(dict(parse_qsl(urlsplit(page.url).query)).get("allModels") == "1",
              f"{label}: Show all does not persist in the shared view link")
    page.wait_for_function(
        "count => document.querySelectorAll('#modelChartPlot .benchmark-model-chart-item').length === count",
        arg=len(representatives),
    )
    items = page.locator("#modelChartPlot .benchmark-model-chart-item").evaluate_all(
        """elements => elements.map(item => {
          const bar = item.querySelector('.benchmark-model-chart-bar');
          return {
            name: item.querySelector('.benchmark-model-chart-x-label').textContent.trim(),
            score: item.querySelector('.benchmark-model-chart-score').textContent.trim(),
            rawScore: item.dataset.score,
            accessibleName: bar.getAttribute('aria-label') || '',
            resultId: bar.getAttribute('data-result-id'),
            pressed: bar.getAttribute('aria-pressed')
          };
        })"""
    )
    actual = {}
    for item in items:
        name = item["name"]
        score = float(item["score"].replace(",", ""))
        raw_score = float(item["rawScore"] or "nan")
        accessible_name = item["accessibleName"]
        matches = [key for key, row in representatives.items()
                   if row["model"] == name and f'{row["vendor"]} {name}' in accessible_name]
        check(len(matches) == 1, f"{label}: chart x-axis label does not identify one sourced model: {name}")
        check(matches[0] not in actual, f"{label}: chart repeats processor model {name}")
        actual[matches[0]] = score
        check(raw_score == representatives[matches[0]]["score"],
              f"{label}: chart bar score differs from the {representative} listed report for {name}")
        check(item["resultId"] and item["pressed"] in ("true", "false"),
              f"{label}: chart bar lacks comparison identity or pressed state")
    check(set(actual) == set(representatives), f"{label}: chart model set differs from the selected cohort")
    for key, row in representatives.items():
        check(abs(actual[key] - row["score"]) < .011,
              f"{label}: chart did not use the source-linked {representative} report for {row['model']}")
    check(f"{len(representatives)} {'MODEL' if len(representatives) == 1 else 'MODELS'}" in
          page.locator("#modelChartMetric").inner_text(),
          f"{label}: chart does not explain how many models it plots")
    table_rows = page.locator("#modelTableBody tr[data-result-id]").evaluate_all(
        """rows => rows.map(row => ({
          id: row.dataset.resultId,
          model: row.querySelector('.benchmark-table-model strong').textContent,
          score: Number(row.querySelector('.benchmark-table-score').textContent.replaceAll(',', '')),
          source: row.querySelector('a').href
        }))"""
    )
    check(len(table_rows) == len(representatives),
          f"{label}: the score table omits chart model representatives")
    expected_table = {(row["model"], row["score"], source_key(row["sourceUrl"]))
                      for row in representatives.values()}
    actual_table = {(row["model"], row["score"], source_key(row["source"])) for row in table_rows}
    check(actual_table == expected_table, f"{label}: the table score/source set differs from the chart")
    if limited_chart:
        check("Show top 25" in range_button.inner_text(),
              f"{label}: expanded chart has no way back to the overview")
        range_button.click()
        check("allModels" not in dict(parse_qsl(urlsplit(page.url).query)),
              f"{label}: Show top 25 left a stale expanded-view link")
        page.wait_for_function(
            "() => document.querySelectorAll('#modelChartPlot .benchmark-model-chart-item').length === 25"
        )


def check_ranked_scores(page, rows, label):
    """Each published score stays attached to its exact source after filtering/paging."""
    expected = {source_key(row["sourceUrl"]): row["score"] for row in rows}
    displayed = page.locator("#rankedResults .benchmark-rank-row").evaluate_all(
        """items => items.map(row => ({
          source: row.querySelector('.benchmark-source-link').href,
          score: Number(row.querySelector('.benchmark-rank-score').firstChild.textContent.replaceAll(',', ''))
        }))"""
    )
    check(len(displayed) == len(rows), f"{label}: score check does not cover every published row")
    for row in displayed:
        key = source_key(row["source"])
        check(key in expected and abs(row["score"] - expected[key]) < .011,
              f"{label}: a ranked score differs from its linked source: {row['source']}")


def check_results(page, filename, minimum, source_path=None, device=None, cpu_count=None):
    payload = snapshot(filename)
    rows = payload["results"]
    if device:
        rows = [row for row in rows if row["deviceType"] == device]
    if cpu_count is not None:
        rows = expected_spec_rows(page, filename, cpu_count)
    check(len(rows) >= minimum, f"{filename} lost expected sample coverage")
    wait_rank_count(page, len(rows))
    rendered = page.locator("#rankedResults .benchmark-rank-row").count()
    check(rendered == len(rows), f"{filename}: expected {len(rows)} ranked rows, found {rendered}")
    expected_links = {source_key(row["sourceUrl"]) for row in rows}
    links = page.locator("#rankedResults .benchmark-source-link").evaluate_all(
        "elements => elements.map(link => link.getAttribute('href'))"
    )
    actual_links = {source_key(link) for link in links}
    check(actual_links == expected_links, f"{filename}: rendered source links differ from snapshot")
    check(len(links) == len(rows), f"{filename}: one source link required per result")
    check_ranked_scores(page, rows, filename)
    if source_path:
        check(all(key[1].startswith(source_path) for key in actual_links),
              f"{filename}: results crossed into another SPEC suite")
    unique_models = {(row["vendor"], row["model"]) for row in rows}
    check(page.locator("#coverageCount").inner_text().strip() == str(len(unique_models)),
          f"{filename}: coverage readout does not count distinct models")
    check_model_chart_data(page, rows, filename, "middle" if cpu_count is not None else "highest")
    return rows


def check_model_focus(page, rows, label):
    """A model's summary must expose the exact selected report and all evidence."""
    check(page.locator("#enterpriseFocus").is_visible(), f"{label}: model focus is hidden")
    groups = {}
    for row in rows:
        key = json.dumps([row["vendor"].lower(), row["model"].lower()], separators=(",", ":"))
        groups.setdefault(key, []).append(row)
    for reports in groups.values():
        reports.sort(key=lambda row: (row["score"], row["sourceUrl"]))
    check(page.locator("#focusModelSelect option").count() == len(groups),
          f"{label}: focus picker does not cover every sourced model")
    target_key = max(groups, key=lambda key: len(groups[key]))
    reports = groups[target_key]
    representative = reports[(len(reports) - 1) // 2]
    page.locator("#focusModelSelect").select_option(target_key)
    overview = page.locator("#focusOverview")
    score_text = overview.locator(".benchmark-focus-score-number").inner_text()
    check(float(score_text.replace(",", "")) == representative["score"],
          f"{label}: focus score is not the lower-middle linked report")
    check(overview.locator(".benchmark-focus-evidence-count").inner_text().startswith(str(len(reports))),
          f"{label}: focus report count is wrong")
    format_score = lambda value: f"{value:,.2f}".rstrip("0").rstrip(".")
    expected_range = (f"Listed score range: {format_score(reports[0]['score'])}–"
                      f"{format_score(reports[-1]['score'])}" if len(reports) > 1
                      else f"Only listed score: {format_score(reports[0]['score'])}")
    check(overview.locator(".benchmark-focus-range").inner_text() == expected_range,
          f"{label}: focus score range does not match the listed reports")
    focus_link = overview.locator(".benchmark-focus-score .benchmark-focus-source")
    check(source_key(focus_link.get_attribute("href")) == source_key(representative["sourceUrl"]),
          f"{label}: focus score does not link to its exact disclosure")
    report_links = overview.locator(".benchmark-focus-report-list a").evaluate_all(
        "links => links.map(link => link.getAttribute('href'))"
    )
    check({source_key(link) for link in report_links} ==
          {source_key(row["sourceUrl"]) for row in reports},
          f"{label}: focus drilldown omits a source report")
    check(len(report_links) == len(reports), f"{label}: focus drilldown duplicates a report")
    peer_key = page.locator("#focusPeerSelect").input_value()
    if peer_key:
        peer_reports = groups[peer_key]
        peer = peer_reports[(len(peer_reports) - 1) // 2]
        peer_link = overview.locator(".benchmark-focus-peer .benchmark-focus-source")
        check(source_key(peer_link.get_attribute("href")) == source_key(peer["sourceUrl"]),
              f"{label}: peer ratio lacks its exact source report")
        ratio = float(overview.locator(".benchmark-focus-ratio").inner_text().rstrip("×"))
        check(abs(ratio - representative["score"] / peer["score"]) < .006,
              f"{label}: peer ratio disagrees with the two linked scores")
    before_ranked = page.locator("#rankedResults .benchmark-rank-row").count()
    page.locator("#focusModelQuery").fill(representative["model"])
    expected_matches = sum(representative["model"].lower() in
                           f"{items[0]['vendor']} {items[0]['model']}".lower()
                           for items in groups.values())
    check(page.locator("#focusModelSelect option").count() == expected_matches,
          f"{label}: model search did not narrow the model picker")
    check(page.locator("#rankedResults .benchmark-rank-row").count() == before_ranked,
          f"{label}: searching the focus picker unexpectedly removed system reports")
    page.locator("#focusModelQuery").fill("")


def check_spec_scope(page, suite, metric, rows):
    label = f"SPEC CPU {suite} {metric}"
    open_test_conditions(page)
    scope = page.locator("#benchmarkScope")
    check(scope.is_visible(), f"{label}: selected-sample scope note is hidden")
    wording = page.locator("#benchmarkScopeText").inner_text()
    check(all(phrase in wording for phrase in (
        f"SPEC CPU {suite}",
        "integer rate (throughput)" if metric == "integer" else "floating-point rate (throughput)",
        f"{page.locator('#socketSelect').input_value()}-CPU",
        "selected sample",
        "not SPEC's full database",
        "Search can narrow the view further",
        "a model can have multiple submissions",
    )), f"{label}: scope note misstates the selected cohort or full-public coverage")
    link = page.locator("#benchmarkScopeLink")
    expected_path = SPEC_RESULT_PATHS[(suite, metric)]
    check(source_key(link.get_attribute("href"))[:2] == ("www.spec.org", expected_path),
          f"{label}: full-results link does not target the exact official SPEC metric")
    check(link.is_visible() and "Browse all SPEC" in link.inner_text()
          and ("integer" if metric == "integer" else "floating-point") in link.inner_text(),
          f"{label}: full-results link does not identify the active metric")
    check(page.locator("#rankingCount").inner_text().strip() ==
          f"{len(rows)} CHIPINDEX {'RESULT' if len(rows) == 1 else 'RESULTS'}",
          f"{label}: ranked count implies the rows are SPEC's full list")
    check("models matching this view" in page.locator("#coverageLabel").inner_text(),
          f"{label}: coverage label implies a full SPEC model count")


def check_visible_spec_sources(page, rows, label):
    wait_rank_count(page, len(rows))
    links = page.locator("#rankedResults .benchmark-source-link")
    actual = [source_key(link) for link in links.evaluate_all(
        "items => items.map(item => item.href)"
    )]
    expected = [source_key(row["sourceUrl"]) for row in rows]
    check(sorted(actual) == sorted(expected),
          f"{label}: filtered result sources differ from the selected snapshot")
    check_ranked_scores(page, rows, label)
    models = {(row["vendor"].casefold(), row["model"].casefold())
              for row in rows}
    check(page.locator("#coverageCount").inner_text().strip() == str(len(models)),
          f"{label}: filtered model count differs from the visible source records")


def check_spec(page, suite, metric, filename, minimum):
    page.locator(f"#cpu{suite}SuiteButton").click()
    page.locator(f"#{'integer' if metric == 'integer' else 'floating'}MetricButton").click()
    select_legacy_spec_build(page)
    expected_metric = snapshot(filename)["meta"]["metric"]
    page.wait_for_function(
        "name => document.querySelector('#metricNote').textContent.includes(name)",
        arg=expected_metric,
    )
    check(page.locator(f"#cpu{suite}SuiteButton").get_attribute("aria-pressed") == "true",
          f"{suite}: suite button did not activate")
    check(page.locator(f"#{metric}MetricButton").get_attribute("aria-pressed") == "true",
          f"{suite} {metric}: metric button did not activate")
    counts = set(page.locator("#socketSelect option").evaluate_all(
        "options => options.map(option => Number(option.value))"))
    check({1, 2}.issubset(counts),
          f"{suite} {metric}: CPU-count control must offer sourced 1- and 2-CPU cohorts")
    page.locator("#socketSelect").select_option("1")
    rows = check_results(page, filename, minimum, f"/cpu{suite}/results/", cpu_count=1)
    check_spec_scope(page, suite, metric, rows)
    # Missing imports are distinguished from public availability; a newly
    # imported NVIDIA report must instead remain selectable in its exact build.
    if page.locator("#catalogTotalCount").inner_text().strip() != "—":
        if any(row["vendor"].casefold() == "nvidia" for row in rows):
            check(page.locator('#manufacturerSelect option[value="NVIDIA"]').is_enabled(),
                  f"{suite} {metric}: imported NVIDIA cohort is unreachable")
        else:
            missing_nvidia = page.locator('#manufacturerSelect option[value="nvidia"]')
            check(missing_nvidia.count() == 1 and missing_nvidia.is_disabled()
                  and "no imported result" in missing_nvidia.inner_text(),
                  f"{suite} {metric}: NVIDIA must explain missing imports instead of disappearing")
            help_text = page.locator("#manufacturerHelp")
            check(help_text.is_visible() and "NVIDIA" in help_text.inner_text()
                  and "test and CPU count" in help_text.inner_text()
                  and "Public scores may exist" in help_text.inner_text(),
                  f"{suite} {metric}: missing-vendor help incorrectly implies no public scores")
        check(page.locator("#manufacturerSelect").get_attribute("aria-describedby") == "manufacturerHelp",
              f"{suite} {metric}: missing-vendor explanation is not associated with the filter")
    check(page.locator("#testDescription").inner_text().strip(),
          f"{suite} {metric}: test explanation missing")
    check(page.locator("#specAttribution").is_visible(),
          f"{suite} {metric}: source attribution is hidden outside the result view")
    check("SPEC" in page.locator("#scoreUnit").inner_text()
          and "higher" in page.locator("#scoreUnit").inner_text().lower(),
          f"{suite} {metric}: score unit and direction are unclear")
    check(page.locator("#scoreMeaning").inner_text().strip()
          and "1 CPU" in page.locator("#activeConfiguration").inner_text(),
          f"{suite} {metric}: score interpretation or tested CPU count is missing")
    check_empty_comparison(page, f"{suite} {metric} CPU-count selection")
    select_ranked_results(page)
    top = page.locator("#comparisonDiagram .benchmark-compare-top").inner_text()
    check(f"SPEC CPU {suite}" in top and expected_metric in top,
          f"{suite} {metric}: comparison used another suite or metric")
    for item in page.locator("#comparisonDiagram .benchmark-compare-meta").all_inner_texts():
        check(expected_metric in item, f"{suite} {metric}: comparison contains a cross-metric score")
    check(page.locator("#comparisonDiagram .benchmark-compare-row").count() <= 3,
          "comparison exceeds three results")

    # The controls and labels must describe the bounded loaded sample honestly
    # even as manufacturer, search, and system CPU count change the cohort.
    amd_rows = [row for row in rows if row["vendor"] == "AMD"]
    page.locator("#manufacturerSelect").select_option("AMD")
    check_visible_spec_sources(page, amd_rows, f"{suite} {metric} AMD")
    check_spec_scope(page, suite, metric, amd_rows)
    page.locator("#modelSearch").fill("EPYC 9965")
    searched_rows = [row for row in amd_rows if "EPYC 9965" in row["model"]]
    check_visible_spec_sources(page, searched_rows, f"{suite} {metric} AMD search")
    check_spec_scope(page, suite, metric, searched_rows)
    page.locator("#modelSearch").fill("")
    page.locator("#manufacturerSelect").select_option("")

    page.locator("#socketSelect").select_option("2")
    check_empty_comparison(page, f"{suite} {metric} two-CPU switch")
    two_cpu_rows = check_results(page, filename, 2, f"/cpu{suite}/results/", cpu_count=2)
    check_spec_scope(page, suite, metric, two_cpu_rows)
    page.locator("#socketSelect").select_option("1")
    check_visible_spec_sources(page, rows, f"{suite} {metric} restored 1-CPU")
    check_spec_scope(page, suite, metric, rows)
    return rows


def check_blender(page, mode, device, minimum):
    page.locator(f"#{mode}Button").click()
    page.wait_for_function(
        "mode => document.querySelector('#' + mode + 'Button').getAttribute('aria-pressed') === 'true'",
        arg=mode,
    )
    check(page.locator("#enterpriseTestControls").is_hidden(),
          f"{mode}: enterprise suite controls are visible")
    check(page.locator("#benchmarkScope").is_visible(),
          f"{mode}: Blender coverage note is hidden")
    check("SELECTED BLENDER SNAPSHOT" in page.locator("#benchmarkScopeLabel").inner_text(),
          f"{mode}: Blender snapshot is not identified")
    check("not gaming or AI performance" in page.locator("#benchmarkScopeText").inner_text() if mode == "graphics"
          else "not an overall laptop CPU rating" in page.locator("#benchmarkScopeText").inner_text(),
          f"{mode}: workload limit is unclear")
    check("How Blender defines this test" in page.locator("#testGuideLink").inner_text(),
          f"{mode}: test guide points to the wrong benchmark")
    check("Blender Open Data" in page.locator("#testDescription").inner_text(),
          f"{mode}: Blender test explanation missing")
    check_results(page, "benchmark-sample.json", minimum, device=device)
    check(page.locator("#versionField").is_hidden() and page.locator("#computeField").is_hidden(),
          f"{mode}: single-option benchmark controls still occupy filter space")
    configuration = page.locator("#activeConfiguration").inner_text()
    check("5.2.0" in configuration and "mixed" in configuration,
          f"{mode}: hiding single-option controls removed the benchmark configuration")
    check("BLENDER" in page.locator("#metricNote").inner_text().upper(),
          f"{mode}: wrong benchmark metric shown")
    check("samples" in page.locator("#scoreUnit").inner_text().lower()
          and "higher" in page.locator("#scoreUnit").inner_text().lower(),
          f"{mode}: rendering unit and score direction are unclear")
    check_empty_comparison(page, f"{mode} mode switch")



def check_client_segments(page):
    """Form factors must preserve sourced medians and scope every interaction."""
    client = [row for row in snapshot("benchmark-sample.json")["results"] if row["deviceType"] == "CPU"]
    cohorts = {"all": client, **{segment: [row for row in client if segment in row["deviceSegments"]]
                                 for segment in ("desktop", "laptop")}}
    shared = sum(len(row["deviceSegments"]) > 1 for row in client)
    check(all(len(rows) > 25 for rows in cohorts.values()), "client form-factor coverage unexpectedly collapsed")
    check(len(cohorts["desktop"]) + len(cohorts["laptop"]) - shared == len(client),
          "client form-factor source identities are unclassified or double counted")
    for width in (1440, 320):
        page.set_viewport_size({"width": width, "height": 900})
        page.goto(base_url + "?mode=client", wait_until="domcontentloaded")
        wait_rank_count(page, len(client))
        controls = page.locator("#clientSegmentControls")
        check(controls.is_visible() and controls.get_attribute("aria-label"),
              f"{width}px client: form-factor switch lacks an accessible group")
        check(controls.locator('[data-segment="all"]').get_attribute("aria-pressed") == "true",
              f"{width}px client: default view does not include every client CPU")
        for segment, rows in cohorts.items():
            check(controls.locator(f'[data-segment="{segment}"] span').inner_text() == f"{len(rows)} models",
                  f"{width}px client: {segment} count differs from official classification")
        note = page.locator("#clientSegmentNote").inner_text()
        check(f"{shared} models are listed for both" in note and "medians pool submitted systems" in note,
              "client segments imply separately measured laptop/desktop medians")
        for segment in ("desktop", "laptop"):
            label = f"{width}px client {segment}"
            controls.locator(f'[data-segment="{segment}"]').click()
            rows = cohorts[segment]
            check_visible_spec_sources(page, rows, label)
            check_model_chart_data(page, rows, label)
            check(dict(parse_qsl(urlsplit(page.url).query)).get("segment") == segment,
                  f"{label}: chosen form factor is absent from the shared URL")
            check_no_overflow(page, label)

            # Manufacturer, core count, search, and comparison must operate only
            # on the chosen form factor, including after a shared-view reload.
            stops = sorted({row["coreCount"] for row in rows})
            page.locator("#manufacturerSelect").select_option("AMD")
            move_core_slider(page, "coreMax", len(stops) - 2)
            narrowed = [row for row in rows if row["vendor"] == "AMD" and row["coreCount"] <= stops[-2]]
            query = narrowed[0]["model"]
            page.locator("#modelSearch").fill(query)
            searched = [row for row in narrowed if query.casefold() in row["model"].casefold()]
            check_visible_spec_sources(page, searched, label + " filtered")
            check_model_chart_data(page, searched, label + " filtered")
            page.locator("#rankedResults .benchmark-select-button").first.click()
            selected = page.locator("#baselineSelect option").evaluate_all("items => items.map(item => item.value)")
            check(len(selected) == 1, f"{label}: filtered comparison selection failed")
            page.reload(wait_until="domcontentloaded")
            wait_rank_count(page, len(searched))
            check(controls.locator(f'[data-segment="{segment}"]').get_attribute("aria-pressed") == "true",
                  f"{label}: reload restored another form factor")
            check_visible_spec_sources(page, searched, label + " restored")
            check(page.locator("#manufacturerSelect").input_value() == "AMD"
                  and page.locator("#coreMaxValue").inner_text() == str(stops[-2])
                  and page.locator("#modelSearch").input_value().casefold() == query.casefold(),
                  f"{label}: reload lost filters")
            check(page.locator("#baselineSelect option").evaluate_all("items => items.map(item => item.value)") == selected,
                  f"{label}: reload lost the selected source result")
            page.locator("#resetFilters").click()
            check_visible_spec_sources(page, rows, label + " reset")
            check_empty_comparison(page, label + " reset")
            check(controls.locator(f'[data-segment="{segment}"]').get_attribute("aria-pressed") == "true",
                  f"{label}: Reset unexpectedly changed the form factor")

            page.locator("#manufacturerSelect").select_option("AMD")
            move_core_slider(page, "coreMax", len(stops) - 2)
            page.locator("#modelSearch").fill(query)
            page.locator("#rankedResults .benchmark-select-button").first.click()
            other = "laptop" if segment == "desktop" else "desktop"
            controls.locator(f'[data-segment="{other}"]').click()
            check_visible_spec_sources(page, cohorts[other], label + " switched")
            check_model_chart_data(page, cohorts[other], label + " switched")
            check_empty_comparison(page, label + " switched")
            check(page.locator("#modelSearch").input_value() == ""
                  and page.locator("#manufacturerSelect").input_value() == ""
                  and page.locator("#coreMin").input_value() == "0"
                  and page.locator("#coreMax").input_value() == page.locator("#coreMax").get_attribute("max"),
                  f"{label}: segment switch retained stale filters")

        # Invalid links fall back to the default and cannot strand a zero-data view.
        page.goto(base_url + "?mode=client&segment=not-a-form-factor", wait_until="domcontentloaded")
        check_visible_spec_sources(page, client, f"{width}px invalid client segment")
        check(controls.locator('[data-segment="all"]').get_attribute("aria-pressed") == "true"
              and "segment" not in dict(parse_qsl(urlsplit(page.url).query)),
              f"{width}px: invalid segment was retained in state or shared links")
        check(page.locator("#versionField").is_hidden() and page.locator("#computeField").is_hidden(),
              f"{width}px client: redundant benchmark controls are still shown")
        check_no_overflow(page, f"{width}px client controls")
    # Keep the original all-client cohort for the rest of the existing suite.
    controls.locator('[data-segment="all"]').click()


def check_accelerator(page, scenario, filename, minimum):
    if page.locator("#acceleratorButton").get_attribute("aria-pressed") != "true":
        page.locator("#acceleratorButton").click()
    if page.locator(f"#{scenario}ScenarioButton").get_attribute("aria-pressed") != "true":
        page.locator(f"#{scenario}ScenarioButton").click()
    page.wait_for_function(
        "value => document.querySelector('#metricNote').textContent.toLowerCase().includes(value)",
        arg=scenario,
    )
    check(page.locator("#acceleratorButton").get_attribute("aria-pressed") == "true",
          "accelerator mode did not activate")
    check(page.locator(f"#{scenario}ScenarioButton").get_attribute("aria-pressed") == "true",
          f"MLPerf {scenario}: scenario button did not activate")
    check(page.locator("#enterpriseTestControls").is_hidden(),
          "MLPerf: enterprise controls are visible")
    check(page.locator("#benchmarkScope").is_hidden(),
          "MLPerf: SPEC selected-sample note is visible outside enterprise CPUs")
    check(page.locator("#acceleratorTestControls").is_visible(),
          "MLPerf: scenario controls are hidden")
    for official, title in (("Server", "Request stream"), ("Offline", "Batch processing")):
        button = page.locator(f"#{official.lower()}ScenarioButton")
        check(button.locator("strong").inner_text() == title
              and f"MLPerf {official}" in button.locator("span").inner_text(),
              f"MLPerf {official}: plain-language label lost the official scenario identity")
        description = page.locator("#" + button.get_attribute("aria-describedby")).inner_text()
        check(f"Official scenario: {official}" in description,
              f"MLPerf {official}: accessible scenario description lacks the source name")
    check(scenario.capitalize() in page.locator("#testDescription").inner_text(),
          f"MLPerf {scenario}: test explanation missing")
    check(page.locator("#mlperfAttribution").is_visible(),
          f"MLPerf {scenario}: result footnote target is hidden outside the result view")
    payload = snapshot(filename)
    rows = payload["results"]
    check(len(rows) >= minimum, f"{filename} lost expected sample coverage")
    wait_rank_count(page, len(rows))
    ranked = page.locator("#rankedResults .benchmark-rank-row")
    expected_pairs = {
        (source_key(row["sourceUrl"]), source_key(row["summaryUrl"])) for row in rows
    }
    actual_pairs = set()
    for index in range(ranked.count()):
        links = ranked.nth(index).locator(".benchmark-source-link")
        check(links.count() >= 2, f"{filename}: each SUT needs source and summary links")
        actual_pairs.add((source_key(links.nth(0).get_attribute("href")),
                          source_key(links.nth(1).get_attribute("href"))))
        check(all(source_key(links.nth(extra).get_attribute("href")) ==
                  source_key(links.nth(1).get_attribute("href"))
                  for extra in range(2, links.count())),
              f"{filename}: additional source links point outside the official summary")
    check(actual_pairs == expected_pairs,
          f"{filename}: rendered SUT/summary links differ from snapshot")
    check(len(actual_pairs) == len(rows), f"{filename}: duplicate SUT source links")
    check_ranked_scores(page, rows, filename)
    unique_models = {(row["vendor"], row["model"]) for row in rows}
    check(page.locator("#coverageCount").inner_text().strip() == str(len(unique_models)),
          f"{filename}: coverage readout does not count distinct models")
    check_model_chart_data(page, rows, filename)
    check("tokens per second" in page.locator("#scoreUnit").inner_text().lower()
          and "8" in page.locator("#activeConfiguration").inner_text(),
          f"MLPerf {scenario}: whole-system score unit or accelerator count is missing")
    select_ranked_results(page)
    check(scenario in page.locator("#comparisonDiagram .benchmark-compare-top").inner_text().casefold(),
          f"MLPerf {scenario}: comparison crossed scenarios")
    check(all("Tokens/s" in text for text in page.locator(
        "#comparisonDiagram .benchmark-compare-meta").all_inner_texts()),
          f"MLPerf {scenario}: comparison contains another metric")
    check(page.locator("#comparisonDiagram .benchmark-compare-row").count() <= 3,
          "MLPerf comparison exceeds three SUTs")
    check(all(value.startswith(f"accelerator{scenario.capitalize()}:")
              for value in page.locator("#baselineSelect option").evaluate_all(
                  "options => options.map(option => option.value)")),
          f"MLPerf {scenario}: comparison contains another scenario's IDs")
    if scenario == "offline":
        comparison = page.locator("#comparisonDiagram .benchmark-compare-row")
        check(comparison.first.locator(".benchmark-compare-ratio").inner_text() == "1.00×",
              "MLPerf Offline: the baseline must display 1.00×")
        close_rows = [comparison.nth(index) for index in range(comparison.count())
                      if "6.0-0002" in comparison.nth(index).inner_text()]
        check(len(close_rows) == 1 and "Instinct MI355X" in close_rows[0].inner_text(),
              "MLPerf Offline: expected close-score MI355X SUT is absent")
        check(close_rows[0].locator(".benchmark-compare-ratio").inner_text() != "1.00×",
              "MLPerf Offline: unequal MI355X score is misleadingly rounded to 1.00×")
    return rows


def check_catalog(page):
    select_section(page, "coverage")
    matched, categories = catalog_expected_counts()
    page.wait_for_function(
        "count => document.querySelector('#catalogTotalCount').textContent.trim() === '2,431' "
        "&& document.querySelector('#catalogMatchedCount').textContent.trim() === String(count)",
        arg=matched,
    )
    check(page.locator("#catalogMatchedCount").inner_text().strip() == str(matched),
          "catalog global match count differs from checked snapshots")
    check("2,452" in page.locator("#catalogCoverageNote").inner_text(),
          "catalog does not explain displayed placements")
    for product_type, (type_matched, total) in categories.items():
        page.locator(f'[data-catalog-type="{product_type}"]').click()
        check(page.locator("#catalogMatchedCount").inner_text().strip() == str(type_matched),
              f"catalog {product_type}: scored count differs from checked snapshots")
        check(page.locator("#catalogTotalCount").inner_text().strip() == f"{total:,}",
              f"catalog {product_type}: denominator differs from source catalog")
        check(page.locator(f'[data-catalog-type="{product_type}"]').get_attribute("aria-pressed") == "true",
              f"catalog {product_type}: type filter did not activate")
    page.locator("#catalogAllButton").click()
    check(page.locator("#catalogTotalCount").inner_text().strip() == "2,431",
          "catalog All filter did not restore distinct-product denominator")

    # A Ryzen source SKU appears on both EPYC and Ryzen dashboard tabs, but
    # its product ID identifies one catalog product with two placements.
    page.locator("#catalogSearch").fill("100-000000600")
    check(page.locator("#catalogResults .benchmark-catalog-row").count() == 1,
          "cross-tab AMD source SKU was duplicated or lost")
    shared = page.locator("#catalogResults .benchmark-catalog-row").first
    check("Ryzen 5 PRO 7645" in shared.inner_text()
          and "AMD / EPYC" in shared.inner_text() and "AMD / Ryzen" in shared.inner_text(),
          "catalog does not preserve both display placements for one AMD source SKU")
    check("No result in these selected snapshots" in shared.inner_text(),
          "unscored catalog SKU is missing the honest no-snapshot-result state")
    page.locator("#catalogStatus").select_option("unscored")
    check(page.locator("#catalogResults .benchmark-catalog-row").count() == 1,
          "unscored filter dropped the cross-tab SKU")
    for product_type in ("enterprise", "client"):
        page.locator(f'[data-catalog-type="{product_type}"]').click()
        check(page.locator("#catalogResults .benchmark-catalog-row").count() == 1,
              f"cross-tab AMD SKU is absent from {product_type} catalog type")

    page.locator("#catalogAllButton").click()
    page.locator("#catalogStatus").select_option("matched")
    page.locator("#catalogSearch").fill("Instinct MI355X")
    check(page.locator("#catalogResults .benchmark-catalog-row").count() == 1,
          "scored accelerator lookup did not resolve to one catalog SKU")
    scored = page.locator("#catalogResults .benchmark-catalog-row").first
    check("Selected snapshot result" in scored.inner_text(),
          "scored accelerator is not marked as having a selected result")
    scored.locator(".benchmark-catalog-details summary").click()
    details = scored.locator(".benchmark-catalog-details")
    check("Server" in details.inner_text() and "Offline" in details.inner_text(),
          "catalog did not retain both MLPerf scenarios")
    sut_links = details.locator('a[href^="https://github.com/mlcommons/inference_results_v6.0/tree/main/closed/"]')
    check(sut_links.count() >= 2,
          "scored catalog product lacks its official published SUT links")
    check("vendor=amd" in scored.locator(".benchmark-catalog-dashboard-link").get_attribute("href"),
          "catalog product route does not target the AMD dashboard")
    page.locator("#catalogStatus").select_option("unscored")
    check(page.locator("#catalogResults .benchmark-catalog-row").count() == 0,
          "unscored filter includes a model with checked snapshot results")
    page.locator("#catalogStatus").select_option("all")
    select_section(page, "results")


def check_no_overflow(page, label):
    width, scroll = page.evaluate(
        "() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]"
    )
    check(scroll <= width + 1, f"{label}: 320px viewport overflows to {scroll}px")


def check_cpu_product_specs(page):
    """Known catalog facts reach every CPU surface without becoming system facts."""
    expected = {
        ("AMD", "EPYC 9965"): (
            {"coreLabel": "192 cores / CPU · 384 threads / CPU",
             "clockLabel": "2.25 GHz base · up to 3.70 GHz boost",
             "powerLabel": "500W TDP"},
            {"c": "192", "t": "384", "bas": "2.25 GHz", "bst": "Up to 3.70 GHz", "tdp": "500W"},
        ),
        ("INTEL", "Xeon 6990E+"): (
            {"coreLabel": "288 E-cores / CPU · 288 threads / CPU",
             "clockLabel": "2.2 GHz base · 3.2 GHz max turbo",
             "powerLabel": "450W TDP"},
            {"pc": "0", "ec": "288", "t": "288", "bas": "2.2 GHz", "bst": "3.2 GHz", "tdp": "450W"},
        ),
        ("INTEL", "Core Ultra 9 285H"): (
            {"coreLabel": "16 cores (6 P + 10 E) · 16 threads",
             "clockLabel": "P-core 2.9 / 5.4 GHz (base / max turbo) · E-core 2.7 / 4.5 GHz (base / max turbo)",
             "powerLabel": "45W base / 115W max turbo power"},
            {"pc": "6", "ec": "10", "t": "16", "pcl": "2.9 / 5.4 GHz",
             "ecl": "2.7 / 4.5 GHz", "tdp": "45W / 115W"},
        ),
        ("NVIDIA", "GB10 Grace Blackwell Superchip"): (
            {"coreLabel": "20 CPU cores / superchip · 20 threads"},
            {"cores": "20", "threads": "20", "tdp": "140 W"},
        ),
    }
    product_views = {
        ("AMD", "EPYC 9965"): ("amd", "epyc"),
        ("INTEL", "Xeon 6990E+"): ("intel", "xeon"),
        ("INTEL", "Core Ultra 9 285H"): ("intel", "client"),
        ("NVIDIA", "GB10 Grace Blackwell Superchip"): ("nvidia", "cpu"),
    }
    catalog = snapshot("benchmark-catalog.json")["products"]
    products = {}
    for identity, (labels, raw_fields) in expected.items():
        matches = [product for product in catalog
                   if (product["vendor"], product["model"]) == identity]
        check(len(matches) == 1, f"{identity}: source catalog identity is ambiguous")
        product = matches[0]
        products[identity] = product
        specs = product.get("productSpecs") or {}
        for field, label in labels.items():
            check(specs.get(field) == label,
                  f"{identity}: catalog {field} differs from checked product specification")
        if identity[0] == "NVIDIA":
            check(not specs.get("clockLabel") and not specs.get("powerLabel"),
                  "GB10: combined CPU/GPU power was misrepresented as CPU-only power")
        source_file, pointer = product["sourceRecordRef"].split("#/", 1)
        source_record = snapshot(source_file)
        from urllib.parse import unquote
        for part in pointer.split("/"):
            source_record = source_record[int(part) if part.isdigit() else unquote(part)]
        for field, value in raw_fields.items():
            check(source_record[field] == value,
                  f"{identity}: product-spec expectation no longer agrees with the vendor source row")

    def verify_line(scope, identity, label, dashboard_link=False):
        line = scope.locator(".benchmark-product-specs")
        check(line.count() == 1, f"{label}: missing single catalog CPU spec line")
        rendered = line.inner_text()
        check(rendered.startswith("Catalog CPU specs"),
              f"{label}: CPU specs lack catalog provenance label")
        for value in expected[identity][0].values():
            check(value in rendered, f"{label}: source-backed {value!r} is absent")
        if identity[0] == "NVIDIA":
            check("GHz" not in rendered and "140W" not in rendered and "140 W" not in rendered,
                  f"{label}: unknown GB10 CPU clock or combined CPU/GPU power was shown")
        if dashboard_link:
            link = line.locator(".benchmark-product-spec-link")
            check(link.count() == 1 and "Product specs" in link.inner_text(),
                  f"{label}: no route to the product spec record")
            target = urlsplit(urljoin(page.url, link.get_attribute("href")))
            query = dict(parse_qsl(target.query))
            vendor, tab = product_views[identity]
            check(target.path == urlsplit(urljoin(base_url, "../")).path and
                  query.get("site") == SITE_REVISION and
                  query.get("vendor") == vendor and query.get("tab") == tab and
                  query.get("q") == identity[1],
                  f"{label}: product spec link points to another model")

    def verify_chart_and_table(identity, label):
        bars = page.locator("#modelChartPlot .benchmark-model-chart-item").evaluate_all(
            """items => items.map(item => ({
                model: item.querySelector('.benchmark-model-chart-x-label').textContent.trim(),
                aria: item.querySelector('.benchmark-model-chart-bar').getAttribute('aria-label') || '',
                title: item.querySelector('.benchmark-model-chart-bar').getAttribute('title') || ''
            }))"""
        )
        matching = [bar for bar in bars if bar["model"] == identity[1]]
        check(len(matching) == 1, f"{label}: chart lost the selected CPU model")
        for value in expected[identity][0].values():
            check(value in matching[0]["aria"] and value in matching[0]["title"],
                  f"{label}: chart accessibility text omits a product spec")
        table_rows = page.locator("#modelTableBody tr").filter(
            has=page.locator(".benchmark-table-model strong", has_text=identity[1]))
        check(table_rows.count() == 1, f"{label}: model table lost the CPU")
        verify_line(table_rows.locator(".benchmark-table-model"), identity, f"{label} model table")

    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    wait_for_restored_view(page)
    page.locator("#specBuildSelect").select_option("SPEC CPU2026 v1.0.1")
    page.locator("#socketSelect").select_option("1")
    for identity in (("AMD", "EPYC 9965"), ("INTEL", "Xeon 6990E+")):
        page.locator("#modelSearch").fill(identity[1])
        row = page.locator("#rankedResults .benchmark-rank-row").first
        check(identity[1] in row.locator(".benchmark-rank-title").inner_text(),
              f"{identity}: selected enterprise model is missing")
        verify_line(row.locator(".benchmark-rank-main"), identity,
                    f"{identity} ranked system", dashboard_link=True)
        verify_chart_and_table(identity, f"{identity} enterprise")
    page.locator("#modelSearch").fill("")
    focus_key = json.dumps(["amd", "epyc 9965"], separators=(",", ":"))
    peer_key = json.dumps(["intel", "xeon 6990e+"], separators=(",", ":"))
    page.locator("#focusModelSelect").select_option(focus_key)
    page.locator("#focusPeerSelect").select_option(peer_key)
    verify_line(page.locator("#focusOverview .benchmark-focus-score"),
                ("AMD", "EPYC 9965"), "focused EPYC", dashboard_link=True)
    verify_line(page.locator("#focusOverview .benchmark-focus-peer"),
                ("INTEL", "Xeon 6990E+"), "focus peer Xeon", dashboard_link=True)
    page.locator("#modelSearch").fill("EPYC 9965")
    page.locator("#rankedResults .benchmark-select-button").first.click()
    verify_line(page.locator("#comparisonDiagram .benchmark-compare-row").first,
                ("AMD", "EPYC 9965"), "enterprise comparison", dashboard_link=True)
    page.locator("#socketSelect").select_option("2")
    page.locator("#modelSearch").fill("EPYC 9965")
    two_cpu = page.locator("#rankedResults .benchmark-rank-row").first
    verify_line(two_cpu.locator(".benchmark-rank-main"),
                ("AMD", "EPYC 9965"), "two-CPU SPEC result", dashboard_link=True)
    two_cpu.locator(".benchmark-system-details summary").click()
    enabled_cores = two_cpu.locator(".benchmark-system-grid").evaluate(
        "grid => Array.from(grid.querySelectorAll('dt')).find(term => term.textContent === 'Enabled cores')?.nextElementSibling?.textContent"
    )
    check(enabled_cores == "384" and "192 cores / CPU" in two_cpu.inner_text(),
          "tested-system enabled cores were confused with per-CPU catalog core count")

    select_section(page, "coverage")
    page.locator("#catalogSearch").fill("EPYC 9965")
    verify_line(page.locator("#catalogResults .benchmark-catalog-row-main").first,
                ("AMD", "EPYC 9965"), "EPYC catalog lookup")
    page.locator("#catalogSearch").fill("GB10 Grace Blackwell Superchip")
    verify_line(page.locator("#catalogResults .benchmark-catalog-row-main").first,
                ("NVIDIA", "GB10 Grace Blackwell Superchip"), "GB10 catalog lookup")
    select_section(page, "results")
    page.locator("#specBuildSelect").select_option("SPEC CPU2026 v0.902.0")
    page.locator("#socketSelect").select_option("1")
    page.locator("#modelSearch").fill("GB10 Grace Blackwell Superchip")
    verify_line(page.locator("#rankedResults .benchmark-rank-main").first,
                ("NVIDIA", "GB10 Grace Blackwell Superchip"), "GB10 tested CPU component",
                dashboard_link=True)
    page.set_viewport_size({"width": 320, "height": 900})
    check_no_overflow(page, "GB10 CPU spec line")

    page.locator("#clientButton").click()
    page.locator("#modelSearch").fill("Core Ultra 9 285H")
    client = page.locator("#rankedResults .benchmark-rank-row").first
    check("Core Ultra 9 285H" in client.locator(".benchmark-rank-title").inner_text(),
          "sourced Intel client CPU is absent from rendering scores")
    verify_line(client.locator(".benchmark-rank-main"),
                ("INTEL", "Core Ultra 9 285H"), "Intel client ranked result",
                dashboard_link=True)
    verify_chart_and_table(("INTEL", "Core Ultra 9 285H"), "Intel client")
    client.locator(".benchmark-select-button").click()
    verify_line(page.locator("#comparisonDiagram .benchmark-compare-row").first,
                ("INTEL", "Core Ultra 9 285H"), "Intel client comparison",
                dashboard_link=True)
    check_no_overflow(page, "Intel P/E-core catalog spec line")

    for mode in ("graphics", "accelerator"):
        page.locator(f"#{mode}Button").click()
        check(page.locator("#rankedResults .benchmark-product-specs").count() == 0
              and page.locator("#comparisonDiagram .benchmark-product-specs").count() == 0
              and page.locator("#modelTableBody .benchmark-product-specs").count() == 0,
              f"{mode}: CPU product specifications leaked into non-CPU results")
        bar_labels = page.locator("#modelChartPlot .benchmark-model-chart-bar").evaluate_all(
            "bars => bars.map(bar => bar.getAttribute('aria-label') || '')"
        )
        check(all("Catalog CPU specs" not in label for label in bar_labels),
              f"{mode}: chart mislabels non-CPU bars with CPU specifications")
        check_no_overflow(page, f"{mode} after CPU spec views")


def wait_rank_count(page, expected):
    """Load the complete source set only for checks that need every report."""
    page.wait_for_function(
        "count => document.querySelector('#rankingPageStatus').textContent.endsWith(`of ${count} results`) "
        "&& document.querySelectorAll('#rankedResults .benchmark-rank-row').length >= Math.min(count, 100)",
        arg=expected,
    )
    while page.locator("#rankedResults .benchmark-rank-row").count() < expected:
        before = page.locator("#rankedResults .benchmark-rank-row").count()
        more = page.locator("#rankingMore")
        check(more.is_visible(), f"ranking omitted reports after {before} of {expected}")
        more.click()
        page.wait_for_function(
            "count => document.querySelectorAll('#rankedResults .benchmark-rank-row').length === count",
            arg=min(before + 100, expected),
        )
    check(page.locator("#rankedResults .benchmark-rank-row").count() == expected,
          "ranking contains records outside the expected cohort")


def move_core_slider(page, thumb, index):
    page.locator(f"#{thumb}").evaluate(
        "(element, value) => { element.value = String(value); "
        "element.dispatchEvent(new Event('input', { bubbles: true })); "
        "element.dispatchEvent(new Event('change', { bubbles: true })); }",
        index,
    )


def check_core_slider_input(page):
    """Exercise the two native range handles, not only synthetic input events."""
    for width in (1440, 320):
        page.set_viewport_size({"width": width, "height": 900})
        page.goto(base_url, wait_until="domcontentloaded")
        page.locator("#coreField").wait_for(state="visible")
        select_legacy_spec_build(page)
        stops = sorted({row["enabledCores"] // row["cpuCount"]
                        for row in expected_spec_rows(page, SPEC_CASES[0][2], 1)})
        check(len(stops) >= 3, "core control needs enough sourced stops for input checks")
        minimum = page.locator("#coreMin")
        maximum = page.locator("#coreMax")
        check(minimum.get_attribute("aria-label") and maximum.get_attribute("aria-label"),
              f"{width}px: core handles need distinct accessible names")
        check(minimum.input_value() == "0" and maximum.input_value() == str(len(stops) - 1),
              f"{width}px: initial core span is not the full sourced range")

        maximum.focus()
        page.keyboard.press("ArrowLeft")
        page.wait_for_function(
            "value => document.querySelector('#coreMaxValue').textContent.trim() === value",
            arg=str(stops[-2]),
        )
        check(maximum.input_value() == str(len(stops) - 2),
              f"{width}px: keyboard did not move maximum core handle")
        page.keyboard.press("ArrowRight")
        page.wait_for_function(
            "value => document.querySelector('#coreMaxValue').textContent.trim() === value",
            arg=str(stops[-1]),
        )

        box = maximum.bounding_box()
        check(box is not None, f"{width}px: maximum core handle has no geometry")
        y = box["y"] + box["height"] / 2
        # The 34px native hit target centers at each end of the range input.
        page.mouse.move(box["x"] + box["width"] - 17, y)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] / 2, y, steps=8)
        page.mouse.up()
        selected = int(maximum.input_value())
        check(0 <= selected < len(stops) - 1
              and page.locator("#coreMaxValue").inner_text().strip() == str(stops[selected]),
              f"{width}px: dragging maximum core handle missed a sourced middle stop")
        check_no_overflow(page, f"{width}px filtered core controls")


def check_model_chart_interaction(page):
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(base_url, wait_until="domcontentloaded")
    items = page.locator("#modelChartPlot .benchmark-model-chart-item")
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    select_legacy_spec_build(page)
    one_cpu = expected_spec_rows(page, SPEC_CASES[0][2], 1)
    model_count = len({(row["vendor"], row["model"]) for row in one_cpu})
    page.wait_for_function(
        "count => document.querySelectorAll('#modelChartPlot .benchmark-model-chart-item').length === count",
        arg=min(model_count, 25),
    )
    disclosure = page.locator("#modelChartDisclosure")
    summary = disclosure.locator("summary")
    check(disclosure.get_attribute("open") is not None and "Server scores by CPU model" in summary.inner_text(),
          "model chart is not open and identified on first load")
    summary.focus()
    page.keyboard.press("Enter")
    check(disclosure.get_attribute("open") is None
          and page.locator("#modelChartViewport").is_hidden(),
          "Enter did not collapse the model chart")
    page.keyboard.press("Enter")
    check(disclosure.get_attribute("open") is not None
          and page.locator("#modelChartViewport").is_visible(),
          "Enter did not reopen the model chart")

    check_empty_comparison(page, "initial page")
    comparison_jump = page.locator("#viewComparison")
    check(comparison_jump.is_hidden(), "comparison jump is visible before any selection")
    select_ranked_results(page)
    check(comparison_jump.is_visible() and "(3)" in comparison_jump.inner_text(),
          "selected scores do not expose their comparison destination")
    comparison_jump.click()
    check(page.locator("#comparisonTitle").evaluate("element => document.activeElement === element"),
          "comparison jump did not focus its destination")

    # The maximum bar should meet the top score gridline, with processor names
    # visibly angled under their own columns.
    plot = page.locator("#modelChartPlot")
    # Read related geometry atomically while the comparison shortcut can still be scrolling.
    geometry = plot.evaluate("""element => ({
      plotTop: element.getBoundingClientRect().top,
      fillTop: element.querySelector('.benchmark-model-chart-fill').getBoundingClientRect().top,
      stageTop: parseFloat(getComputedStyle(element, '::before').top)
    })""")
    check(abs(geometry["fillTop"] - geometry["plotTop"] - geometry["stageTop"]) <= 2,
          "highest model bar does not meet the top score gridline")
    axis_labels = page.locator(".benchmark-model-chart-y-axis").inner_text()
    check("%" not in axis_labels, "model chart presents score values as percentages")
    angled = items.first.locator(".benchmark-model-chart-x-label").evaluate(
        "element => { const matrix = new DOMMatrix(getComputedStyle(element).transform); "
        "return Math.abs(matrix.b) > .2 && Math.abs(matrix.a) > .2; }"
    )
    check(angled, "processor names on the x-axis are not angled")

    full_chart_bar = page.locator("#modelChartPlot .benchmark-model-chart-bar[aria-pressed='false']").first
    check(full_chart_bar.count() == 1, "full comparison has no unselected chart bar to test")
    full_chart_bar.click()
    check(full_chart_bar.get_attribute("aria-pressed") == "false"
          and page.locator("#modelChartStatus").is_visible()
          and "Comparison full" in page.locator("#modelChartStatus").inner_text(),
          "full comparison did not visibly explain why another chart bar could not be added")

    clear_comparison(page)
    first_bar = items.first.locator(".benchmark-model-chart-bar")
    model = items.first.locator(".benchmark-model-chart-x-label").inner_text().strip()
    first_bar.focus()
    page.keyboard.press("Enter")
    check(first_bar.get_attribute("aria-pressed") == "true"
          and model in page.locator("#comparisonDiagram").inner_text(),
          "keyboard selection from model chart did not update the comparison")
    check(page.locator("#modelChartPlot .benchmark-model-chart-bar:focus").count() == 1,
          "chart bar lost keyboard focus when comparison updated")
    page.keyboard.press("Enter")
    check(first_bar.get_attribute("aria-pressed") == "false",
          "second chart activation did not remove the result from comparison")

    page.locator('[data-display="table"]').click()
    check(page.locator("#modelTableViewport").is_visible()
          and page.locator(".benchmark-model-chart-body").is_hidden(),
          "table toggle does not switch the visible score presentation")
    table_button = page.locator("#modelTableBody .benchmark-table-compare").first
    table_button.focus()
    page.keyboard.press("Enter")
    check(table_button.get_attribute("aria-pressed") == "true"
          and page.locator("#comparisonDiagram .benchmark-compare-row").count() == 1,
          "keyboard selection from the score table did not update the comparison")
    check(page.locator("#modelTableBody .benchmark-table-compare:focus").count() == 1,
          "score table comparison update lost keyboard focus")
    page.keyboard.press("Enter")
    check_empty_comparison(page, "table comparison removal")
    page.locator('[data-display="chart"]').click()
    check(page.locator(".benchmark-model-chart-body").is_visible()
          and page.locator("#modelTableViewport").is_hidden(),
          "chart toggle did not restore the visual score presentation")

    page.locator("#modelSearch").fill("EPYC 9375F")
    page.wait_for_function(
        "() => document.querySelectorAll('#modelChartPlot .benchmark-model-chart-item').length === 1"
    )
    check("EPYC 9375F" in items.first.inner_text(),
          "model chart did not follow the result search")
    page.locator("#acceleratorButton").click()
    page.locator("#offlineScenarioButton").click()
    page.set_viewport_size({"width": 320, "height": 900})
    offline_rows = snapshot(MLPERF_CASES[1][1])["results"]
    check_model_chart_data(page, offline_rows, "phone MLPerf Offline")
    viewport = page.locator("#modelChartViewport")
    page.wait_for_function(
        "() => { const element = document.querySelector('#modelChartViewport'); "
        "return element.scrollWidth > element.clientWidth + 1; }"
    )
    check(viewport.get_attribute("tabindex") == "0"
          and page.locator("#modelChartScrollHint").is_visible(),
          "phone model chart has no keyboard-scrollable plot or scroll cue")
    viewport.focus()
    page.keyboard.press("ArrowRight")
    page.wait_for_function(
        "() => document.querySelector('#modelChartViewport').scrollLeft > 0"
    )
    check_no_overflow(page, "320px model chart")

    page.locator("#manufacturerSelect").select_option("AMD")
    amd_rows = [row for row in offline_rows if row["vendor"] == "AMD"]
    check_model_chart_data(page, amd_rows, "phone filtered MLPerf Offline")
    check_no_overflow(page, "320px filtered model chart")


def check_filters(page):
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    page.wait_for_function(
        "count => document.querySelector('#catalogMatchedCount').textContent.trim() === String(count)",
        arg=catalog_expected_counts()[0],
    )
    check_spec(page, *SPEC_CASES[0])
    check(page.locator("#manufacturerField").is_visible()
          and page.locator("#coreField").is_visible(),
          "enterprise CPU manufacturer/core controls are missing")
    one_cpu = expected_spec_rows(page, SPEC_CASES[0][2], 1)
    vendors = {row["vendor"] for row in one_cpu}
    options = set(page.locator("#manufacturerSelect option").evaluate_all(
        "items => items.map(item => item.value)"))
    check(vendors.issubset(options), "enterprise manufacturer options omit a scored vendor")
    page.locator("#manufacturerSelect").select_option("AMD")
    amd_one = [row for row in one_cpu if row["vendor"] == "AMD"]
    wait_rank_count(page, len(amd_one))
    check("Xeon" not in page.locator("#comparisonDiagram").inner_text(),
          "manufacturer filter kept a hidden vendor in comparison")

    stops = sorted({row["enabledCores"] // row["cpuCount"] for row in one_cpu})
    check(len(stops) >= 2, "enterprise core filter has fewer than two sourced stops")
    move_core_slider(page, "coreMax", len(stops) - 2)
    max_cores = stops[-2]
    wait_rank_count(page, sum(row["enabledCores"] <= max_cores for row in amd_one))
    check(page.locator("#coreMaxValue").inner_text() == str(max_cores),
          "enterprise core slider readout did not update")

    page.locator("#manufacturerSelect").select_option("")
    page.locator("#socketSelect").select_option("2")
    two_cpu = expected_spec_rows(page, SPEC_CASES[0][2], 2)
    check_results(page, SPEC_CASES[0][2], 2, "/cpu2026/results/", cpu_count=2)
    ranking_scrolls = page.locator("#rankedResultsViewport").evaluate(
        "element => element.scrollHeight > element.clientHeight + 1")
    check(page.locator("#rankingScrollHint").is_visible() == ranking_scrolls,
          "two-CPU ranking scroll cue disagrees with its content height")
    check(page.locator("#coreMinValue").inner_text() == str(min(
        row["enabledCores"] // 2 for row in two_cpu)),
        "CPU-count change did not reset core range to available two-CPU results")
    page.locator("#manufacturerSelect").select_option("Intel")
    wait_rank_count(page, sum(row["vendor"] == "Intel" for row in two_cpu))
    check("EPYC" not in page.locator("#comparisonDiagram").inner_text(),
          "two-CPU manufacturer filter kept a hidden CPU in comparison")

    page.locator("#clientButton").click()
    page.wait_for_function(
        "() => { const select = document.querySelector('#manufacturerSelect'); "
        "return !select.disabled && [...select.options].some(option => option.value === 'Intel'); }"
    )
    page.locator("#manufacturerSelect").select_option("")
    check(page.locator("#coreField").is_visible(),
          "client CPU core filter is missing")
    client = [row for row in snapshot("benchmark-sample.json")["results"]
              if row["deviceType"] == "CPU"]
    client_stops = sorted({row["coreCount"] for row in client})
    check(len(client_stops) >= 2, "client core filter has fewer than two sourced stops")
    move_core_slider(page, "coreMax", len(client_stops) - 2)
    wait_rank_count(page, sum(row["coreCount"] <= client_stops[-2] for row in client))
    page.locator("#graphicsButton").click()
    check(page.locator("#coreField").is_hidden(),
          "graphics view shows a CPU core filter")
    page.locator("#acceleratorButton").click()
    check(page.locator("#coreField").is_hidden(),
          "accelerator view shows a CPU core filter")
    page.locator("#manufacturerSelect").select_option("NVIDIA")
    server = snapshot(MLPERF_CASES[0][1])["results"]
    wait_rank_count(page, sum(row["vendor"] == "NVIDIA" for row in server))
    page.set_viewport_size({"width": 320, "height": 900})
    check_no_overflow(page, "filtered MLPerf")



def check_source_directory(page):
    """Only imported sources offer local result navigation."""
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    check(page.locator("#coveragePanel").is_hidden()
          and page.locator("#sourcesPanel").is_hidden(),
          "secondary information sections crowd the initial results view")
    page.locator('[data-section="results"]').focus()
    page.keyboard.press("ArrowRight")
    check(page.locator("#coveragePanel").is_visible(),
          "section tabs do not support keyboard navigation")
    page.keyboard.press("ArrowRight")
    check(page.locator("#sourcesPanel").is_visible(),
          "keyboard navigation did not reach benchmark sources")
    registry = snapshot("benchmark-sources.json")
    select_section(page, "sources")
    cards = page.locator("#sourceDirectory .benchmark-source-card")
    page.wait_for_function(
        "count => document.querySelectorAll('#sourceDirectory .benchmark-source-card').length === count",
        arg=len(registry["sources"]),
    )
    check(page.locator("#resultsPanel").is_hidden()
          and page.locator("#coveragePanel").is_hidden()
          and page.locator("#sourcesPanel").is_visible(),
          "source navigation did not isolate its information panel")
    for source in registry["sources"]:
        card = cards.filter(has=page.get_by_role("heading", name=source["name"], exact=True))
        check(card.count() == 1, f"source directory lost {source['name']}")
        text = card.inner_text()
        check(source["label"] in text, f"{source['name']}: source access status is wrong")
        if source["status"] == "available":
            check(str(source["recordCount"]) in text.replace(",", ""),
                  f"{source['name']}: imported record count differs from registry")
            check(card.locator("button").count() > 0,
                  f"{source['name']}: imported results have no local navigation action")
        else:
            check(card.locator("button").count() == 0,
                  f"{source['name']}: an unconnected source offers unavailable local results")
        links = card.locator("a[href]").evaluate_all("items => items.map(item => item.href)")
        check(source["homepage"] in links,
              f"{source['name']}: source homepage is missing")
        check(all(urlsplit(link).scheme == "https" for link in links),
              f"{source['name']}: source directory includes an unsafe external link")
    for source_id, expected_mode in (("spec", "enterprise"), ("mlperf", "accelerator"), ("blender", "client")):
        source = next(item for item in registry["sources"] if item["id"] == source_id)
        card = cards.filter(has=page.get_by_role("heading", name=source["name"], exact=True))
        card.locator("button").first.click()
        check(page.locator("#resultsPanel").is_visible()
              and page.locator(f"#{expected_mode}Button").get_attribute("aria-pressed") == "true",
              f"{source['name']}: source action did not open its matching results")
        select_section(page, "sources")
    page.set_viewport_size({"width": 320, "height": 900})
    check_no_overflow(page, "source directory")
    select_section(page, "results")



def check_spec_builds(page):
    """Every CPU2026 build is an isolated, shareable comparison cohort."""
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    wait_for_restored_view(page)
    integer_rows = snapshot(SPEC_CASES[0][2])["results"]
    versions = {row["benchmarkVersion"] for row in integer_rows}
    newest = max(versions, key=lambda version: tuple(map(int, re.findall(r"\d+", version))))
    check(page.locator("#specBuildSelect").input_value() == newest,
          "new visitors do not start on the newest available CPU2026 build")
    for metric, filename in (("integer", SPEC_CASES[0][2]), ("floating", SPEC_CASES[1][2])):
        page.locator(f"#{metric}MetricButton").click()
        source_rows = snapshot(filename)["results"]
        builds = sorted({row["benchmarkVersion"] for row in source_rows})
        check(len(builds) >= 4, f"{metric}: expanded source data lacks four reviewed CPU2026 builds")
        options = page.locator("#specBuildSelect option").evaluate_all("items => items.map(item => item.value)")
        check(set(options) == set(builds), f"{metric}: test-build options omit a sourced build")
        for build in builds:
            page.locator("#specBuildSelect").select_option(build)
            counts = {row["cpuCount"] for row in source_rows if row["benchmarkVersion"] == build}
            options = page.locator("#socketSelect option").evaluate_all("items => items.map(item => Number(item.value))")
            check(set(options) == counts, f"{metric} {build}: CPU counts came from another test build")
            for count in sorted(counts):
                if page.locator("#socketSelect").input_value() != str(count):
                    page.locator("#socketSelect").select_option(str(count))
                rows = expected_spec_rows(page, filename, count)
                label = f"{metric} {build} {count}-CPU"
                check_visible_spec_sources(page, rows, label)
                check_model_chart_data(page, rows, label, "middle")
                check(build in page.locator("#activeConfiguration").inner_text(),
                      f"{label}: visible score context omits the exact test build")
                check(dict(parse_qsl(urlsplit(page.url).query)).get("build") == build,
                      f"{label}: share URL omits the exact test build")
            select_ranked_results(page, 1)
            selected = page.locator("#baselineSelect").input_value()
            page.reload(wait_until="domcontentloaded")
            wait_for_restored_view(page)
            page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
            check(page.locator("#specBuildSelect").input_value() == build
                  and page.locator("#baselineSelect").input_value() == selected,
                  f"{metric} {build}: reload changed the build or selected source")
            other_build = next(value for value in builds if value != build)
            query = dict(parse_qsl(urlsplit(page.url).query))
            query["build"] = other_build
            page.goto(base_url + "?" + urlencode(query), wait_until="domcontentloaded")
            wait_for_restored_view(page)
            page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
            check_empty_comparison(page, f"{metric}: selected source from another build")
            check("selected" not in dict(parse_qsl(urlsplit(page.url).query)),
                  "a forged shared URL retained a comparison ID from another build")

    # The same build control and bounded ranking remain usable on a narrow phone.
    page.set_viewport_size({"width": 320, "height": 900})
    page.locator("#integerMetricButton").click()
    for build in sorted(versions):
        page.locator("#specBuildSelect").select_option(build)
        rows = expected_spec_rows(page, SPEC_CASES[0][2], int(page.locator("#socketSelect").input_value()))
        check(page.locator("#rankedResults .benchmark-rank-row").count() == min(100, len(rows)),
              f"phone {build}: switching builds did not reset the ranking page")
        check_no_overflow(page, f"phone {build}")
    page.goto(base_url + "?mode=enterprise&suite=2026&build=unknown", wait_until="domcontentloaded")
    wait_for_restored_view(page)
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    check(page.locator("#specBuildSelect").input_value() == newest
          and dict(parse_qsl(urlsplit(page.url).query)).get("build") == newest,
          "unknown test-build URL did not recover to the newest reviewed build")
    page.locator("#cpu2017SuiteButton").click()
    check(page.locator("#specBuildField").is_hidden(), "CPU2017 incorrectly requires a CPU2026 test build")
    rows = expected_spec_rows(page, SPEC_CASES[2][2], int(page.locator("#socketSelect").input_value()))
    check_visible_spec_sources(page, rows, "compatible CPU2017 patch versions")


def check_ranking_pagination(page):
    """Large cohorts stay bounded initially without making later reports unreachable."""
    for width in (1440, 320):
        page.set_viewport_size({"width": width, "height": 900})
        page.goto(base_url + "?mode=enterprise&suite=2017&metric=integer&cpus=1", wait_until="domcontentloaded")
        rows = snapshot(SPEC_CASES[2][2])["results"]
        rows = [row for row in rows if row["cpuCount"] == 1]
        check(len(rows) > 200, "expanded cohort is too small to exercise multiple ranking pages")
        page.wait_for_function(
            "count => document.querySelector('#rankingPageStatus').textContent === `Showing 100 of ${count} results`",
            arg=len(rows),
        )
        check(page.locator("#rankedResults .benchmark-rank-row").count() == 100,
              "initial ranking rendered the entire large source archive")
        page.locator("#rankingMore").click()
        check(page.locator("#rankedResults .benchmark-rank-row").count() == 200,
              "Show more did not append the next 100 reports")
        query = min({row["model"] for row in rows}, key=lambda model: sum(model in row["model"] for row in rows))
        page.locator("#modelSearch").fill(query)
        searched = [row for row in rows if query.casefold() in row["model"].casefold()]
        check(page.locator("#rankedResults .benchmark-rank-row").count() == min(100, len(searched)),
              "search retained an expanded page count from a different cohort")
        check_visible_spec_sources(page, searched, f"{width}px paged search")
        page.locator("#modelSearch").fill("")
        check(page.locator("#rankedResults .benchmark-rank-row").count() == 100,
              "clearing search did not return the ranking to its first page")
        check_visible_spec_sources(page, rows, f"{width}px complete paged cohort")
        check(page.locator("#rankingMore").is_hidden()
              and page.locator("#rankingPageStatus").inner_text() == f"Showing {len(rows)} of {len(rows)} results",
              "completed paging does not report the full source coverage")
        page.locator("#socketSelect").select_option("2")
        expected = sum(row["cpuCount"] == 2 for row in snapshot(SPEC_CASES[2][2])["results"])
        check(page.locator("#rankedResults .benchmark-rank-row").count() == min(100, expected),
              "CPU-count switch retained an old pagination limit")
        check_no_overflow(page, f"{width}px paged report controls")


def check_source_freshness_and_failure(page):
    page.set_viewport_size({"width": 320, "height": 900})
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    check(page.locator("#reviewSources").is_visible()
          and "not every publicly available benchmark" in page.locator("#coverageScopeSummary").inner_text(),
          "result view hides the imported-source coverage boundary")
    page.locator("#reviewSources").click()
    check(page.locator("#sourcesPanel").is_visible(), "coverage shortcut does not open source details")
    dated = snapshot(SPEC_CASES[0][2])
    dated["meta"]["snapshotDate"] = "2000-01-01"
    page.route("**/enterprise-benchmark-2026-int-sample.json",
               lambda route: route.fulfill(status=200, content_type="application/json", body=json.dumps(dated)))
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    check(page.locator("#freshnessNotice").is_visible()
          and "Newer public results may be available" in page.locator("#freshnessNotice").inner_text(),
          "old imported results have no visible freshness warning")
    check_no_overflow(page, "phone source freshness")
    page.unroute("**/enterprise-benchmark-2026-int-sample.json")
    page.route("**/enterprise-benchmark-mlperf-v6-server-sample.json", lambda route: route.abort("timedout"))
    page.goto(base_url + "?mode=accelerator&scenario=server", wait_until="domcontentloaded")
    page.wait_for_function("() => document.querySelector('#rankedResults').textContent.includes('Results unavailable')")
    check(page.locator("#rankedResults .benchmark-rank-row").count() == 0
          and page.locator("#snapshotDate").inner_text() == "Unavailable",
          "timed-out source silently produced a partial or stale cohort")
    check_accelerator(page, *MLPERF_CASES[1])
    page.unroute("**/enterprise-benchmark-mlperf-v6-server-sample.json")


def check_view_roundtrip(page):
    """A shared view restores the precise workload, filters and chosen source results."""
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    page.locator("#cpu2017SuiteButton").click()
    page.locator("#floatingMetricButton").click()
    page.locator("#socketSelect").select_option("2")
    page.locator("#manufacturerSelect").select_option("AMD")
    maximum = int(page.locator("#coreMax").get_attribute("max"))
    move_core_slider(page, "coreMax", maximum - 1)
    page.locator("#modelSearch").fill("EPYC")
    select_ranked_results(page, 2)
    baseline_options = page.locator("#baselineSelect option").evaluate_all(
        "items => items.map(item => item.value)"
    )
    page.locator("#baselineSelect").select_option(baseline_options[-1])
    expected = {
        name: page.locator(f"#{name}").input_value()
        for name in ("socketSelect", "manufacturerSelect", "coreMin", "coreMax", "modelSearch", "baselineSelect")
    }
    selected = set(baseline_options)
    sources = page.locator("#rankedResults .benchmark-source-link").evaluate_all(
        "items => items.map(item => item.href)"
    )
    page.locator('[data-display="table"]').click()
    select_section(page, "sources")
    shared_url = page.url
    query = dict(parse_qsl(urlsplit(shared_url).query))
    check(query.get("mode") == "enterprise" and query.get("suite") == "2017"
          and query.get("metric") == "floating" and query.get("cpus") == "2"
          and query.get("manufacturer") == "AMD" and query.get("section") == "sources"
          and query.get("display") == "table",
          "view link does not identify its benchmark, system configuration and section")
    check(query.get("selected") and query.get("baseline")
          and query.get("coresMin") and query.get("coresMax") and query.get("q"),
          "view link omits selected reports or result filters")
    # Intercept only this test's clipboard write so verification cannot replace the user's clipboard.
    page.evaluate("""() => {
      window.__benchmarkCopiedView = null;
      Object.defineProperty(navigator, 'clipboard', { configurable: true,
        value: { writeText: async text => { window.__benchmarkCopiedView = text; } } });
    }""")
    page.locator("#shareView").click()
    page.wait_for_function("() => window.__benchmarkCopiedView !== null")
    check(page.evaluate("window.__benchmarkCopiedView") == shared_url,
          "Copy view link did not copy the current reproducible view")
    page.reload(wait_until="domcontentloaded")
    page.locator("#sourceDirectory .benchmark-source-card").first.wait_for()
    check(page.locator("#sourcesPanel").is_visible()
          and page.locator('[data-section="sources"]').get_attribute("aria-selected") == "true",
          "reloading a source-section view returned to the wrong section")
    select_section(page, "results")
    check(page.locator("#modelTableViewport").is_visible()
          and page.locator('[data-display="table"]').get_attribute("aria-pressed") == "true",
          "shared view reload did not preserve table presentation")
    for name, expected_value in expected.items():
        actual = page.locator(f"#{name}").input_value()
        check(actual.casefold() == expected_value.casefold() if name == "modelSearch" else actual == expected_value,
              f"view reload did not restore {name}")
    restored = set(page.locator("#baselineSelect option").evaluate_all("items => items.map(item => item.value)"))
    check(restored == selected, "view reload changed the selected source reports")
    check(page.locator("#rankedResults .benchmark-source-link").evaluate_all(
        "items => items.map(item => item.href)") == sources,
        "view reload changed the filtered source report set")
    check(page.locator("#cpu2017SuiteButton").get_attribute("aria-pressed") == "true"
          and page.locator("#floatingMetricButton").get_attribute("aria-pressed") == "true",
          "view reload mixed benchmark suite or metric")


def exercise(page):
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    products_root = urljoin(base_url, "../")
    page.goto(products_root, wait_until="domcontentloaded")
    products_brand, products_dates = check_shared_shell(page, "Products")
    check(page.locator(".navrow .product-context #vendorPill").count() == 1,
          "Products page lost its vendor switcher")
    check(page.locator(".site-primary-nav a[aria-current='page']").get_attribute("href") ==
          f"./?site={SITE_REVISION}",
          "Products self-navigation does not use the versioned canonical root")
    page.locator(f".site-primary-nav a[href='benchmarks/?site={SITE_REVISION}']").click()
    check(page.title() == "Benchmarks · ChipIndex", "Products navigation did not open Benchmarks")
    benchmarks_brand, benchmarks_dates = check_shared_shell(page, "Benchmarks")
    check((products_brand, products_dates) == (benchmarks_brand, benchmarks_dates),
          "Products and Benchmarks show different ChipIndex branding or release history")
    check(page.locator("#vendorPill").count() == 0,
          "Benchmarks incorrectly shows the Products-only vendor switcher")
    check(page.locator("#productsLink").get_attribute("href") == f"../?site={SITE_REVISION}" and
          page.locator("#productsLink").inner_text().strip() == "Products",
          "Benchmarks global Products link does not use the versioned canonical root")
    check(page.locator(".site-primary-nav a[aria-current='page']").get_attribute("href") == "./",
          "Benchmarks navigation does not identify the current page")
    page.locator("#productsLink").click()
    check(urlsplit(page.url).path == urlsplit(products_root).path and
          page.title() == "Products · ChipIndex",
          "Benchmarks top Products link returned to a different product page")
    page.locator("#epycBenchmarkTab").wait_for(state="visible")
    check(page.locator("#epycBenchmarkTab").count() == 1,
          "AMD Products lost its Benchmarks tab after the round trip")
    page.goto(base_url, wait_until="domcontentloaded")
    # A shared benchmark URL must lead back to the matching product line even
    # when opened directly, without relying on a previous dashboard visit.
    for query, vendor, tab, label in (
        ({"mode": "enterprise", "manufacturer": "AMD"}, "amd", "epyc", "AMD EPYC specs"),
        ({"mode": "client", "manufacturer": "Intel"}, "intel", "client", "Intel client specs"),
        ({"mode": "accelerator", "manufacturer": "NVIDIA"}, "nvidia", "datacenter", "NVIDIA data center specs"),
        ({"mode": "enterprise", "manufacturer": "Ampere", "suite": "2017"}, "ampere", "processors", "Ampere CPU specs"),
    ):
        page.goto(base_url + "?" + urlencode(query), wait_until="domcontentloaded")
        check(page.locator("#productsLink").get_attribute("href") == f"../?site={SITE_REVISION}" and
              page.locator("#productsLink").inner_text().strip() == "Products",
              f"benchmark view {query} changed the global Products navigation")
        link = page.locator("#returnProductsLink")
        target = urlsplit(urljoin(page.url, link.get_attribute("href")))
        target_query = dict(parse_qsl(target.query))
        check(target.path == urlsplit(products_root).path and
              target_query.get("site") == SITE_REVISION and
              target_query.get("vendor") == vendor and target_query.get("tab") == tab and
              label in link.inner_text(),
              f"benchmark view {query} does not return to {label}")
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator("#rankedResults .benchmark-rank-row").first.wait_for()
    check(page.locator("#manufacturerSelect").input_value() == "" and
          page.locator("#manufacturerSelect option:checked").inner_text() == "All" and
          not {"manufacturer", "q"}.intersection(
              dict(parse_qsl(urlsplit(page.url).query))),
          "bare Benchmarks entry did not reset to All manufacturers")
    check_catalog(page)

    # The newest enterprise suite is the initial view. Every selection stays
    # inside one metric and one suite, including the comparison diagram.
    check_spec(page, "2026", "integer", SPEC_CASES[0][2], SPEC_CASES[0][3])
    check_model_focus(page, expected_spec_rows(page, SPEC_CASES[0][2], 1), "SPEC CPU2026 integer")
    check_spec(page, "2026", "floating", SPEC_CASES[1][2], SPEC_CASES[1][3])
    check_spec(page, "2017", "integer", SPEC_CASES[2][2], SPEC_CASES[2][3])
    check_model_focus(page, expected_spec_rows(page, SPEC_CASES[2][2], 1), "SPEC CPU2017 integer")
    check_spec(page, "2017", "floating", SPEC_CASES[3][2], SPEC_CASES[3][3])

    check_accelerator(page, *MLPERF_CASES[0])
    clear_comparison(page)
    page.locator("#modelSearch").fill("B200 SXM")
    page.locator("#rankedResults .benchmark-select-button").first.click()
    check(page.locator("#baselineSelect option").count() == 1,
          "MLPerf Server: selected SUT did not enter comparison")
    page.locator("#offlineScenarioButton").click()
    check(page.locator("#modelSearch").input_value() == "",
          "MLPerf scenario switch kept stale search")
    check_empty_comparison(page, "MLPerf scenario switch")
    check_accelerator(page, *MLPERF_CASES[1])
    viewport = page.locator("#rankedResultsViewport")
    page.wait_for_function(
        "() => { const region = document.querySelector('#rankedResultsViewport'); "
        "return region.scrollHeight > region.clientHeight; }"
    )
    check(viewport.get_attribute("tabindex") == "0"
          and page.locator("#rankingScrollHint").is_visible(),
          "long ranking has no keyboard-scrollable region or scroll cue")
    viewport.focus()
    page.keyboard.press("End")
    # Keyboard scrolling can animate. Wait for End to reach the bottom before
    # testing unrelated comparison and search actions on the same scroller.
    page.wait_for_function(
        "() => { const region = document.querySelector('#rankedResultsViewport'); "
        "return region.scrollTop > 0 && "
        "Math.abs(region.scrollHeight - region.clientHeight - region.scrollTop) <= 1; }",
        timeout=5000,
    )
    clear_comparison(page)
    viewport.evaluate("element => { element.scrollTop = element.scrollHeight; }")
    before_compare = viewport.evaluate("element => element.scrollTop")
    page.locator("#rankedResults .benchmark-select-button").last.click()
    check(viewport.evaluate("element => element.scrollTop") >= before_compare - 5,
          "choosing a result unexpectedly reset ranking scroll position")
    page.locator("#modelSearch").fill("MI350X")
    # Assert the completed user-visible state, including the filtered results;
    # an immediate read can race Chromium's pending keyboard scroll/layout.
    expected_matches = sum("mi350x" in row["model"].lower()
                           for row in snapshot(MLPERF_CASES[1][1])["results"])
    wait_rank_count(page, expected_matches)
    page.wait_for_function(
        "() => document.querySelector('#rankedResultsViewport').scrollTop === 0",
        timeout=5000,
    )
    check(viewport.evaluate("element => element.scrollTop") == 0,
          "searching a new ranking did not return the list to its top")
    check_accelerator(page, *MLPERF_CASES[0])

    # Search and selected source records must reset when a different suite or
    # metric becomes active; the new cohort supplies the comparison.
    page.locator("#enterpriseButton").click()
    page.locator("#cpu2026SuiteButton").click()
    page.locator("#integerMetricButton").click()
    select_legacy_spec_build(page)
    clear_comparison(page)
    page.locator("#modelSearch").fill("EPYC 9375F")
    page.locator("#rankedResults .benchmark-select-button").first.click()
    check("EPYC 9375F" in page.locator("#comparisonDiagram").inner_text(),
          "selected result did not enter comparison")
    page.locator("#cpu2017SuiteButton").click()
    check(page.locator("#modelSearch").input_value() == "", "suite switch kept stale search")
    check("EPYC 9375F" not in page.locator("#comparisonDiagram").inner_text(),
          "suite switch kept a CPU2026 selection")
    check_spec(page, "2017", "integer", SPEC_CASES[2][2], SPEC_CASES[2][3])
    page.locator("#modelSearch").fill("A192-32X")
    page.locator("#floatingMetricButton").click()
    check(page.locator("#modelSearch").input_value() == "", "metric switch kept stale search")
    check("A192-32X" not in page.locator("#comparisonDiagram").inner_text(),
          "metric switch kept an integer-only model")
    check_spec(page, "2017", "floating", SPEC_CASES[3][2], SPEC_CASES[3][3])

    check_blender(page, "client", "CPU", 112)
    check_blender(page, "graphics", "GPU", 44)

    page.set_viewport_size({"width": 320, "height": 900})
    page.locator("#enterpriseButton").click()
    for suite, metric, filename, minimum in SPEC_CASES:
        check_spec(page, suite, metric, filename, minimum)
        check_no_overflow(page, f"SPEC CPU{suite} {metric} 1-CPU")
        page.locator("#socketSelect").select_option("2")
        check_no_overflow(page, f"SPEC CPU{suite} {metric} 2-CPU")
    check_accelerator(page, *MLPERF_CASES[0])
    check_no_overflow(page, "MLPerf Server")
    check_accelerator(page, *MLPERF_CASES[1])
    check_no_overflow(page, "MLPerf Offline")
    check_blender(page, "client", "CPU", 112)
    check_no_overflow(page, "Client CPUs")
    check_blender(page, "graphics", "GPU", 44)
    check_no_overflow(page, "Graphics")
    select_section(page, "coverage")
    page.locator("#catalogAllButton").click()
    page.locator("#catalogSearch").fill("Instinct MI355X")
    page.locator("#catalogResults .benchmark-catalog-details summary").click()
    check_no_overflow(page, "expanded catalog lookup")
    select_section(page, "results")

    check_client_segments(page)
    check_spec_builds(page)
    check_ranking_pagination(page)
    check_filters(page)
    check_core_slider_input(page)
    check_model_chart_interaction(page)
    check_source_directory(page)
    check_view_roundtrip(page)
    check_source_freshness_and_failure(page)
    check_cpu_product_specs(page)

    # A single malformed published row must invalidate its entire snapshot.
    # Otherwise the page can silently present an incomplete ranking as a full
    # cohort. The other CPU2026 metric must remain available.
    broken = snapshot("enterprise-benchmark-2026-int-sample.json")
    broken["results"][0]["score"] = -1
    page.route("**/enterprise-benchmark-2026-int-sample.json",
               lambda route: route.fulfill(status=200, content_type="application/json",
                                           body=json.dumps(broken)))
    page.goto(base_url, wait_until="domcontentloaded")
    page.locator("#floatingMetricButton").wait_for()
    page.locator("#integerMetricButton").click()
    page.wait_for_function(
        "() => document.querySelector('#rankedResults').textContent.includes('Results unavailable')"
    )
    check(page.locator("#rankedResults .benchmark-rank-row").count() == 0,
          "malformed SPEC snapshot produced a partial ranking")
    check(page.locator("#coverageCount").inner_text().strip() == "—",
          "malformed SPEC snapshot shows a false coverage count")
    check(page.locator("#snapshotDate").inner_text().strip() == "Unavailable",
          "malformed SPEC snapshot does not show unavailable state")
    check_spec(page, "2026", "floating", SPEC_CASES[1][2], SPEC_CASES[1][3])

    # Corrupting one catalog row must hide the entire lookup and its counts;
    # the benchmark view itself remains available on the fresh load.
    page.unroute("**/enterprise-benchmark-2026-int-sample.json")
    broken_catalog = snapshot("benchmark-catalog.json")
    broken_catalog["products"][0]["id"] = ""
    page.route("**/benchmark-catalog.json",
               lambda route: route.fulfill(status=200, content_type="application/json",
                                           body=json.dumps(broken_catalog)))
    page.goto(base_url, wait_until="domcontentloaded")
    page.wait_for_function(
        "() => document.querySelector('#catalogResultStatus').textContent.includes('Catalog unavailable')"
    )
    check(page.locator("#catalogMatchedCount").inner_text().strip() == "—"
          and page.locator("#catalogTotalCount").inner_text().strip() == "—",
          "invalid catalog response retained misleading coverage counts")
    check(page.locator("#catalogResults .benchmark-catalog-row").count() == 0,
          "invalid catalog response produced a partial product lookup")
    select_section(page, "coverage")
    check("Catalog unavailable" in page.locator("#catalogResults").inner_text(),
          "invalid catalog response lacks an explicit unavailable state")
    select_section(page, "results")
    check_spec(page, "2026", "integer", SPEC_CASES[0][2], SPEC_CASES[0][3])
    check(not errors, "JavaScript errors: " + "; ".join(errors))


if __name__ == "__main__":
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = LocalServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base_url = f"http://127.0.0.1:{server.server_address[1]}/benchmarks/"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, args=ARGS)
            try:
                page = browser.new_page(viewport={"width": 1440, "height": 900})
                exercise(page)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Benchmark browser smoke PASS: four isolated SPEC2026 builds, compatible SPEC2017 patches, 100-result pagination with complete source/score integrity, MLPerf/Blender chart/table cohorts, desktop/laptop reload and reset, keyboard controls, source coverage/freshness, shared views, source-backed CPU specs across views, timeout/malformed failure states, 320px layout, no JS errors")
