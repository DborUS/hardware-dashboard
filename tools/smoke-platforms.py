#!/usr/bin/env python3
"""Focused browser smoke test for CPU-to-OEM platform details.

Runs the static site on an ephemeral local port. Searches an exact CPU model,
opens its spec table and platform action, and checks the sourced detail view.
Run: python tools/smoke-platforms.py
"""

from __future__ import annotations

import argparse
import functools
import http.server
import json
import socketserver
import threading
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "js" / "data"
ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class LocalServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 64


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def snapshot():
    with (DATA / "platform-compatibility.json").open(encoding="utf-8") as handle:
        return json.load(handle)


def model_row(page, model):
    matches = page.locator(".cpu-spec-table tbody tr[data-search]").filter(
        has=page.locator("td.cpu-model-name", has_text=model)
    )
    for index in range(matches.count()):
        row = matches.nth(index)
        if row.locator("td.cpu-model-name").inner_text().strip() == model:
            return row
    raise AssertionError(f"exact model row not found: {model}")


def navigate_to_model(page, product):
    """Follow the visitor's global-search route, then open its spec card."""
    model = product["model"]
    vendor, tab = product["dashboardTab"].split("/", 1)
    page.locator("#searchInput").fill(model)
    route = page.locator(
        f'#globalSearchRoutes .global-search-route[data-vendor="{vendor}"][data-tab="{tab}"]'
    )
    try:
        route.wait_for(state="visible", timeout=20000)
    except PlaywrightTimeoutError as exc:
        routes = page.locator("#globalSearchRoutes").inner_text()
        raise AssertionError(f"{model}: global search route missing; routes={routes!r}") from exc
    route.click()
    page.wait_for_function(
        "([vendor, tab]) => currentVendor === vendor && dashboardActiveProductLine() === tab",
        arg=[vendor, tab],
    )
    page.wait_for_function(
        "model => [...document.querySelectorAll('.cpu-spec-table tbody tr[data-search]')]"
        ".some(row => row.querySelector('td.cpu-model-name')?.textContent.trim() === model)",
        arg=model,
    )
    row = model_row(page, model)
    group = row.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' arch-group ')][1]")
    header = group.locator(".arch-header").first
    if header.get_attribute("aria-expanded") == "false":
        header.click()
    wrapper = row.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' cpu-spec-wrapper ')][1]")
    wrapper_id = wrapper.get_attribute("id")
    check(bool(wrapper_id), f"{model}: spec table has no wrapper id")
    card = page.locator(f'.sku-card[data-target="{wrapper_id}"]')
    if card.get_attribute("aria-expanded") == "false":
        card.click()
    button = row.locator(".platform-row-action")
    try:
        button.wait_for(state="visible")
    except PlaywrightTimeoutError as exc:
        state = {
            "group": group.get_attribute("class"),
            "cardExpanded": card.get_attribute("aria-expanded"),
            "wrapper": wrapper.get_attribute("class"),
            "buttonCount": button.count(),
            "row": row.get_attribute("class"),
        }
        raise AssertionError(f"{model}: platform button not visible; {state}") from exc
    check(row.is_visible(), f"{model}: exact model row is not visible after opening specs")
    return row, button


def expected_entries(data, product):
    links = [edge for edge in data["compatibility"]
             if edge["catalogId"] == product["catalogId"]
             and edge["supportLevel"] == "confirmed"]
    platforms = {platform["id"]: platform for platform in data["platforms"]}
    return links, platforms


def check_compact_action(row, model):
    geometry = row.evaluate("""row => {
      const action = row.querySelector('.platform-row-action');
      const cell = row.querySelector('td.cpu-model-name');
      const table = row.closest('table');
      const button = action.getBoundingClientRect();
      const withAction = row.getBoundingClientRect().height;
      const withActionWidth = table.getBoundingClientRect().width;
      const font = getComputedStyle(cell).font;
      action.style.display = 'none';
      const withoutAction = row.getBoundingClientRect().height;
      const withoutActionWidth = table.getBoundingClientRect().width;
      action.style.display = '';
      return {buttonWidth: button.width, buttonHeight: button.height,
        withAction, withoutAction, withActionWidth, withoutActionWidth,
        font, text: action.textContent.trim(),
        iconCount: action.querySelectorAll('svg').length};
    }""")
    check(geometry["buttonWidth"] <= 18 and geometry["buttonHeight"] <= 18 and
          geometry["iconCount"] == 1 and not geometry["text"],
          f"{model}: platform action is not a compact icon: {geometry}")
    check(abs(geometry["withAction"] - geometry["withoutAction"]) <= 0.1,
          f"{model}: platform icon enlarged the spec row: {geometry}")
    check(geometry["withActionWidth"] - geometry["withoutActionWidth"] <= 20,
          f"{model}: platform icon stretched the spec table: {geometry}")


def check_platform_dialog(page, data, product, expand=False, shots_dir=None):
    model = product["model"]
    row, button = navigate_to_model(page, product)
    check_compact_action(row, model)
    check(button.get_attribute("data-catalog-id") == product["catalogId"],
          f"{model}: platform action joined to another catalog product")
    before = page.locator("#compareTray").is_hidden()
    check(before, f"{model}: comparison tray unexpectedly open before platform click")
    button.click()
    dialog = page.locator("#platformDialog")
    check(dialog.evaluate("element => element.open"), f"{model}: platform dialog did not open")
    check(page.locator("#platformTitle").inner_text().strip() == model,
          f"{model}: dialog title names another CPU")
    check(page.locator("#compareTray").is_hidden() and not row.evaluate(
        "element => element.classList.contains('row-selected')"),
        f"{model}: platform action changed comparison selection")

    links, platforms = expected_entries(data, product)
    expected_ids = {edge["platformId"] for edge in links}
    expected_models = {platforms[ident]["model"] for ident in expected_ids}
    expected_oems = {platforms[edge["platformId"]]["oem"] for edge in links}
    stats = page.locator("#platformContent .platform-overview-stats strong").all_inner_texts()
    check(stats == [str(len(expected_ids)), str(len(expected_oems))],
          f"{model}: overview counts {stats} do not match the snapshot")
    oems = set(page.locator("#platformContent .platform-oem-head h3").all_inner_texts())
    check(oems == expected_oems, f"{model}: OEM grouping differs from snapshot")
    names = set(page.locator("#platformContent .platform-card-title").all_inner_texts())
    check(names == expected_models, f"{model}: platform names differ from snapshot")
    check(page.locator("#platformContent .platform-card").count() == len(expected_ids),
          f"{model}: duplicate or missing platform cards")
    check(data["snapshotDate"] in page.locator("#platformContent .platform-overview").inner_text(),
          f"{model}: dialog omits the snapshot date")

    if expand:
        card = page.locator("#platformContent .platform-card").filter(
            has=page.locator(".platform-card-title", has_text="ThinkSystem SR665 V3")
        ).first
        check(card.count() == 1, "9575F: expected Lenovo SR665 V3 detail missing")
        card.locator("summary").click()
        detail = card.locator(".platform-card-detail")
        check(detail.is_visible(), "9575F: expanded platform detail is hidden")
        detail_text = detail.inner_text().casefold()
        check(all(value.casefold() in detail_text for value in
                  ("CPU sockets", "Memory channels", "Supported CPU count", "Official evidence")),
              "9575F: platform detail lacks high-level specifications or provenance")
        links_in_card = card.locator(".platform-sources a[href]")
        check(links_in_card.count() >= 1 and links_in_card.first.is_visible(),
              "9575F: expanded detail lacks a visible source link")
        source_urls = {source["url"] for source in data["sources"]}
        check(all(url in source_urls for url in links_in_card.evaluate_all(
            "elements => elements.map(element => element.href)")),
            "9575F: a platform source URL differs from the reviewed snapshot")
        hpe_card = page.locator("#platformContent .platform-card").filter(
            has=page.locator(".platform-card-title", has_text="ProLiant DL325 Gen11")
        ).first
        check(hpe_card.count() == 1, "9575F: reviewed HPE Gen11 option missing")
        hpe_card.locator("summary").click()
        hpe_note = hpe_card.locator(".platform-restriction").inner_text().casefold()
        check("configuration notes" in hpe_note and "cooling" in hpe_note,
              "9575F: HPE cooling restriction is not visible")
        if shots_dir:
            page.screenshot(path=str(shots_dir / "platforms-desktop-9575f.png"))
            card.locator(".platform-sources").scroll_into_view_if_needed()
            page.screenshot(path=str(shots_dir / "platforms-desktop-9575f-detail.png"))
    if model.startswith("AmpereOne"):
        card = page.locator("#platformContent .platform-card").first
        card.locator("summary").click()
        check("qualified vendor list" in card.locator(".platform-card-detail").inner_text().casefold(),
              f"{model}: QVL evidence is not identified as a qualified vendor list")
    if model == "Core Ultra 7 265H":
        card = page.locator("#platformContent .platform-card").filter(
            has=page.locator(".platform-card-title", has_text="EliteBook 8 G1i 14")
        ).first
        check(card.count() == 1, "HP fixed product-code configuration missing")
        card.locator("summary").click()
        detail = card.locator(".platform-card-detail").inner_text()
        check("D6DG0UA#ABA" in detail and "DOCUMENTED MARKET" in detail.upper()
              and "US" in detail and "published configuration" in detail.casefold(),
              f"HP fixed regional configuration is not clearly labeled: {detail!r}")

    page.locator('#platformDialog [data-close-dialog="platformDialog"]').click()
    check(not dialog.evaluate("element => element.open"), f"{model}: dialog did not close")


def check_empty_state(page, data, catalog):
    covered = {product["catalogId"] for product in data["products"]}
    candidates = [product for product in catalog["products"]
                  if "amd/epyc" in product.get("dashboardTabs", [])
                  and product["id"] not in covered]
    check(bool(candidates), "no uncovered EPYC model remains for the empty-state test")
    # Prefer a familiar modern server SKU, but choose another uncovered EPYC
    # if it is added to the curated compatibility snapshot later.
    candidate = next((product for product in candidates
                      if product["model"] == "EPYC 9965"), candidates[0])
    product = {"model": candidate["model"], "dashboardTab": "amd/epyc"}
    row, button = navigate_to_model(page, product)
    check(button.get_attribute("data-catalog-id") == "",
          "uncovered CPU incorrectly joined to a covered product")
    button.click()
    message = page.locator("#platformContent .platform-empty").inner_text()
    check("No verified OEM platform entries yet" in message and
          "coverage gap" in message and "unsupported" in message,
          "uncovered CPU lacks an honest no-verified-entries message")
    check(page.locator("#compareTray").is_hidden() and not row.evaluate(
        "element => element.classList.contains('row-selected')"),
        "empty-state platform action changed comparison selection")
    page.locator('#platformDialog [data-close-dialog="platformDialog"]').click()


def check_phone_dialog(page, product, shots_dir=None):
    page.set_viewport_size({"width": 390, "height": 844})
    row, button = navigate_to_model(page, product)
    check_compact_action(row, product["model"])
    button.click()
    dialog = page.locator("#platformDialog")
    detail_card = page.locator("#platformContent .platform-card").filter(
        has=page.locator(".platform-card-title", has_text="ThinkSystem SR665 V3")
    ).first
    check(detail_card.count() == 1, "phone: Lenovo platform detail missing")
    detail_card.locator("summary").click()
    for width in (390, 320):
        page.set_viewport_size({"width": width, "height": 844})
        box = dialog.bounding_box()
        check(box is not None and box["x"] >= -1 and box["x"] + box["width"] <= width + 1,
              f"{width}px: platform dialog overflows viewport: {box}")
        check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"),
              f"{width}px: platform view creates page-level horizontal overflow")
        content_fits = page.locator("#platformContent").evaluate(
            "element => element.scrollWidth <= element.clientWidth + 1")
        check(content_fits, f"{width}px: platform dialog body overflows horizontally")
        check(page.locator("#platformContent .platform-oem").count() >= 2,
              f"{width}px: OEM groups disappeared")
        if width == 390 and shots_dir:
            page.screenshot(path=str(shots_dir / "platforms-phone-390-9575f.png"))
            detail_card.locator(".platform-sources").scroll_into_view_if_needed()
            page.screenshot(path=str(shots_dir / "platforms-phone-390-9575f-detail.png"))
    page.locator('#platformDialog [data-close-dialog="platformDialog"]').click()
    check_compact_action(row, product["model"])


def exercise(page, base_url, data, catalog, shots_dir=None):
    errors = []

    def on_console(message):
        if message.type == "error" and not any(token in message.text for token in
                                            ("ERR_CERT_AUTHORITY_INVALID", "fonts.g")):
            errors.append(f"console: {message.text}")

    page.on("console", on_console)
    page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
    page.set_default_timeout(12000)
    page.goto(base_url, wait_until="domcontentloaded")
    try:
        page.locator("#timeline .arch-group").first.wait_for(state="attached", timeout=20000)
    except PlaywrightTimeoutError as exc:
        state = {"title": page.title(), "url": page.url,
                 "timeline": page.locator("#timeline").inner_text()[:400],
                 "scriptErrors": errors[:5]}
        raise AssertionError(f"dashboard did not render: {state}") from exc

    products = {product["model"]: product for product in data["products"]}
    required = ("EPYC 9575F", "Xeon 6787P", "Ryzen AI 7 PRO 350",
                "Core Ultra 7 265", "Core Ultra 7 265H", "AmpereOne A192-32X")
    for model in required:
        check(model in products, f"seed data lost {model}")
    check_platform_dialog(page, data, products["EPYC 9575F"], expand=True,
                          shots_dir=shots_dir)
    for model in required[1:]:
        check_platform_dialog(page, data, products[model])
    check_empty_state(page, data, catalog)
    check_phone_dialog(page, products["EPYC 9575F"], shots_dir=shots_dir)
    check(not errors, "JavaScript errors: " + "; ".join(errors))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shots", action="store_true",
                        help="save desktop and phone screenshots to tools/screenshots/")
    args = parser.parse_args()
    shots_dir = ROOT / "tools" / "screenshots" if args.shots else None
    if shots_dir:
        shots_dir.mkdir(parents=True, exist_ok=True)
    with (DATA / "benchmark-catalog.json").open(encoding="utf-8") as handle:
        catalog_data = json.load(handle)
    platform_data = snapshot()
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = LocalServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, args=ARGS)
            try:
                page = browser.new_page(viewport={"width": 1440, "height": 900})
                base_url = f"http://127.0.0.1:{server.server_address[1]}/index.html"
                exercise(page, base_url, platform_data, catalog_data, shots_dir)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("Platform browser smoke PASS: 9575F search/detail/OEM/source, Intel/client/Ampere records, empty coverage, comparison isolation, 390px/320px dialog, no JS errors")
    if shots_dir:
        print(f"Screenshots: {shots_dir / 'platforms-desktop-9575f.png'}; "
              f"{shots_dir / 'platforms-phone-390-9575f.png'}")
