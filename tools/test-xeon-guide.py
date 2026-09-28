"""Browser regression for the embedded Xeon 6 architecture guide.

Run after tools/smoke-test.py. This serves the dashboard and checks guide
scope, navigation, deep links, product-state return, and iframe behavior.
"""
from __future__ import annotations

import http.server
import tempfile
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def check(condition, description):
    if not condition:
        raise AssertionError(description)
    print("PASS", description)


def wait_route(page, view, mode=None):
    page.wait_for_function(
        """([view, mode]) => {
          const p = new URLSearchParams(location.search);
          return p.get('vendor') === 'intel' && p.get('tab') === 'xeon'
            && p.get('panel') === 'guide' && p.get('guide') === 'xeon-6'
            && p.get('diagram') === view && p.get('mode') === mode;
        }""",
        arg=[view, mode],
    )


def wait_frame_height(page):
    page.wait_for_function(
        """() => {
          const frame = document.querySelector('#xeonGuideFrame');
          const shell = frame?.contentDocument?.querySelector('.app-shell');
          return frame && shell && frame.getBoundingClientRect().height + 8
            >= shell.getBoundingClientRect().height;
        }"""
    )


def check_narrow_guide(page, frame, width):
    page.set_viewport_size({"width": width, "height": 844})
    wait_frame_height(page)
    page.wait_for_timeout(250)
    check(
        page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1"),
        f"{width}px guide has no page-level horizontal overflow",
    )
    can_pan = frame.locator("#stageScroller").evaluate(
        """element => {
          if (element.scrollWidth <= element.clientWidth) return false;
          element.scrollLeft = 180;
          const moved = element.scrollLeft > 0;
          element.scrollLeft = 0;
          return moved;
        }"""
    )
    check(can_pan, f"{width}px diagram pans horizontally within its stage")
    check(
        page.locator("#xeonGuideFrame").bounding_box()["height"] + 8
        >= frame.locator(".app-shell").evaluate("element => element.getBoundingClientRect().height"),
        f"{width}px iframe contains the full guide height",
    )


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}/"
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
                chromium_sandbox=False,
            )
            try:
                page = browser.new_page(viewport={"width": 1440, "height": 900})
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(base + "?vendor=intel&tab=xeon", wait_until="domcontentloaded")
                nav = page.locator("#xeonModeNav")
                nav.wait_for(state="visible")
                check(page.locator("#xeonProductsTab").get_attribute("aria-selected") == "true",
                      "Intel Xeon Products is the default")
                contextual = page.locator('[data-architecture-guide="xeon-6"]')
                check(contextual.count() == 1, "Xeon 6 generation has one contextual guide entry")
                check(page.locator("#epycModeNav").is_hidden(), "AMD guide entry is hidden on Intel")

                # A filtered product view should be intact after visiting the guide.
                generation = page.locator('#filterControls .fchip[data-key="gen"][data-tag="Xeon 6"]')
                generation.click()
                page.locator("#searchInput").fill("Granite Rapids")
                check(generation.get_attribute("aria-pressed") == "true", "Xeon 6 filter is selected")
                check(contextual.is_visible(), "guide entry remains available in filtered Xeon 6 view")
                page.locator("#xeonGuideTab").click()
                frame = page.frame_locator("#xeonGuideFrame")
                frame.locator("#viewNav .view-btn").first.wait_for()
                wait_route(page, "family")
                check(page.locator("#xeonGuidePanel").is_visible(), "Xeon guide opens in dashboard")
                check(page.locator(".layout").is_hidden(), "Products layout is hidden while guide is open")
                check(frame.locator("#viewNav .view-btn").count() == 4, "all four architecture models load")
                scope = frame.locator(".scope-rail").inner_text()
                check(all(name in scope for name in ("Granite Rapids-AP", "Granite Rapids-SP", "Sierra Forest-SP")),
                      "embedded guide names the selected package branches")
                check("Xeon 6+" in scope and "6300P" in scope,
                      "embedded guide states the boundaries of its coverage")
                check(page.locator("#xeonGuidePanel .epyc-guide-source").count() == 3,
                      "dashboard guide header links the three supplied Intel documents")
                wait_frame_height(page)
                check(page.locator("#xeonGuideFrame").bounding_box()["height"] > 860,
                      "iframe expands beyond its initial height")
                screenshots = Path(tempfile.mkdtemp(prefix="xeon-guide-qa-"))
                desktop_shot = screenshots / "xeon-guide-desktop.png"
                page.screenshot(path=str(desktop_shot), full_page=True)
                print(f"SCREENSHOT {desktop_shot}")
                check_narrow_guide(page, frame, 390)
                phone_shot = screenshots / "xeon-guide-390px.png"
                page.screenshot(path=str(phone_shot), full_page=True)
                print(f"SCREENSHOT {phone_shot}")
                check_narrow_guide(page, frame, 320)
                page.set_viewport_size({"width": 1440, "height": 900})
                wait_frame_height(page)

                frame.locator("#viewNav .view-btn").filter(has_text="Package and board").click()
                wait_route(page, "package", "6900")
                frame.locator("#modeControls button").filter(has_text="SIERRA FOREST-SP").click()
                wait_route(page, "package", "6700E")
                check("SIERRA FOREST-SP" in frame.locator('#modeControls button[aria-pressed="true"]').inner_text(),
                      "selected package configuration remains visible")
                wait_frame_height(page)
                frame.locator("#viewNav .view-btn").filter(has_text="Server platform links").click()
                wait_route(page, "io", "6900-2S")
                frame.locator("#modeControls button").filter(has_text="1 SOCKET").click()
                wait_route(page, "io", "6781-1S")
                check("1 SOCKET" in frame.locator('#modeControls button[aria-pressed="true"]').inner_text(),
                      "selected platform-link mode updates the embedded diagram")

                # Glossary notifications are independent; opening a second term
                # must not replace the first one.
                frame.locator("#diagramGlossary summary").click()
                terms = frame.locator("#diagramKey .term-link")
                check(terms.count() >= 2, "the diagram has at least two glossary terms")
                terms.nth(0).click()
                first_title = frame.locator("#termToastStack .term-toast-title").first.inner_text()
                terms.nth(1).click()
                titles = frame.locator("#termToastStack .term-toast-title").all_inner_texts()
                check(len(titles) == 2 and first_title in titles,
                      "clicked acronym definitions stack without replacing each other")
                frame.locator("#termToastStack .term-toast").first.locator(".term-toast-timer button").click()
                check(frame.locator("#termToastStack .term-toast").count() == 1,
                      "closing one acronym notification leaves the other open")

                page.locator("#xeonProductsTab").click()
                check(page.locator(".layout").is_visible(), "Products layout returns")
                check(page.locator("#searchInput").input_value() == "Granite Rapids",
                      "return to Products preserves search")
                check(generation.get_attribute("aria-pressed") == "true",
                      "return to Products preserves the Xeon 6 filter")
                contextual.click()
                check(page.locator("#xeonGuidePanel").is_visible(),
                      "contextual Xeon 6 entry reopens the guide")
                page.locator("#xeonProductsTab").click()

                page.locator('#v2Subtabs [data-tab="client"]').click()
                check(nav.is_hidden() and contextual.count() == 0,
                      "Client tab does not show the Xeon guide entry")
                page.locator('#v2Subtabs [data-tab="graphics"]').click()
                check(nav.is_hidden() and contextual.count() == 0,
                      "Intel Graphics tab does not show the Xeon guide entry")
                page.locator("#tabAmd").click()
                check(nav.is_hidden() and contextual.count() == 0,
                      "AMD tab does not show the Xeon guide entry")

                page.goto(base + "?vendor=intel&tab=xeon&panel=guide&guide=xeon-6"
                          "&diagram=io&mode=6700E-2S", wait_until="domcontentloaded")
                frame = page.frame_locator("#xeonGuideFrame")
                frame.locator('#viewNav .view-btn[aria-current="page"]').wait_for()
                wait_route(page, "io", "6700E-2S")
                check("Server platform links" in frame.locator('#viewNav .view-btn[aria-current="page"]').inner_text(),
                      "direct link restores the chosen model")
                check("SIERRA FOREST-SP" in frame.locator('#modeControls button[aria-pressed="true"]').inner_text(),
                      "direct link restores the chosen diagram mode")

                page.goto(base + "?vendor=intel&tab=xeon&panel=guide&guide=xeon-6"
                          "&diagram=unknown&mode=unknown", wait_until="domcontentloaded")
                frame = page.frame_locator("#xeonGuideFrame")
                frame.locator('#viewNav .view-btn[aria-current="page"]').wait_for()
                wait_route(page, "family")
                check("Two processor designs" in frame.locator('#viewNav .view-btn[aria-current="page"]').inner_text(),
                      "invalid guide route falls back to the family overview")

                page.goto(base + "?vendor=intel&tab=client&panel=guide&guide=xeon-6"
                          "&diagram=package&mode=6900", wait_until="domcontentloaded")
                page.locator('#v2Subtabs [data-tab="client"].active').wait_for()
                check(page.locator("#xeonModeNav").is_hidden()
                      and page.locator("#xeonGuidePanel").is_hidden(),
                      "Xeon guide deep link is ineligible outside Intel Xeon")
                check(not errors, f"no browser JavaScript errors ({errors})")
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
