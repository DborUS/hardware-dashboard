"""Browser regression for the AMD EPYC 9005 architecture guide.

Run after tools/smoke-test.py. Serves the checkout and checks the guide
navigation, diagram links, component details, state return, and responsive width.
"""
from __future__ import annotations

import http.server
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


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}/"
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"], chromium_sandbox=False)
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            page.on("pageerror", lambda err: errors.append(str(err)))
            page.goto(base, wait_until="domcontentloaded")
            page.locator("#timeline .arch-group").first.wait_for()
            nav = page.locator("#epycModeNav")
            check(nav.is_visible(), "EPYC section switch is visible")
            check(page.locator("#epycProductsTab").get_attribute("aria-selected") == "true", "Products is the default")
            page.locator("#searchInput").fill("9005")
            product_count = page.locator("#timeline .arch-group").count()
            page.locator("#epycGuideTab").click()
            frame = page.frame_locator("#epycGuideFrame")
            frame.locator("#viewNav .view-btn").first.wait_for()
            check("5th Gen AMD EPYC™ Processor Architecture" in page.locator(".epyc-guide-source").inner_text(),
                  "guide header names the source white paper")
            check(len(frame.locator("#viewNav .view-btn").all()) == 8, "all eight diagram models load")
            for view in ("package", "ccd", "core", "iod", "lanes", "sockets", "numa", "protection"):
                frame.locator(f'#viewNav [data-view="{view}"]').click()
                frame.locator(f'#viewNav [data-view="{view}"].active').wait_for()
                # Some diagrams put a small selectable part inside a larger one.
                # Keyboard selection reaches the large part without aiming at its rim.
                frame.locator("#diagram .hit").first.focus()
                frame.locator("#diagram .hit").first.press("Enter")
                check(bool(frame.locator("#detailDefinition").inner_text().strip()), f"{view} component has a definition")
                if view == "sockets":
                    metric_clearances = frame.locator("#diagram").evaluate("""svg => {
                      const names = ['PROCESSORS', 'DDR5 CHANNELS', 'MAX GEN 5 LANES'];
                      const cards = [...svg.querySelectorAll('rect')].filter(rect =>
                        rect.getAttribute('y') === '31' && rect.getAttribute('height') === '42');
                      return names.map(name => {
                        const label = [...svg.querySelectorAll('text')].find(text => text.textContent === name);
                        if (!label) return -1;
                        const bounds = label.getBBox();
                        const card = cards.find(rect => bounds.x >= Number(rect.getAttribute('x')) &&
                          bounds.x < Number(rect.getAttribute('x')) + Number(rect.getAttribute('width')));
                        return card ? Number(card.getAttribute('x')) + Number(card.getAttribute('width'))
                          - bounds.x - bounds.width : -1;
                      });
                    }""")
                    check(all(clearance >= 12 for clearance in metric_clearances),
                          f"socket metric labels have padding inside their badges ({metric_clearances})")
            frame.locator('#viewNav [data-view="package"]').click()
            check(page.locator(".layout").is_hidden(), "product layout is hidden in guide")
            check(page.locator("#searchInput").is_hidden(), "product search is hidden in guide")
            check(frame.locator(".stage-scroll").evaluate("(e) => e.scrollWidth >= e.clientWidth"), "diagram stage is available")
            page.wait_for_function("() => { const f = document.querySelector('#epycGuideFrame'); return f && f.getBoundingClientRect().height > 800; }")
            frame_height = page.locator("#epycGuideFrame").bounding_box()["height"]
            content_height = frame.locator("body").evaluate("(e) => e.scrollHeight")
            check(frame_height + 8 >= content_height, "embedded guide has no nested vertical scrollbar")
            check(page.locator("#epycGuideActions").count() == 0, "dashboard note and sharing controls are removed")
            check(frame.locator(".usage, .note, #cards, #addNote, #exportBtn, #importBtn, #resetBtn").count() == 0,
                  "atlas note and sharing features are removed")
            frame.locator('#viewNav [data-view="lanes"]').click()
            page.wait_for_url("**diagram=lanes**")
            check("diagram=lanes" in page.url, "diagram selection updates direct link")
            page.reload(wait_until="domcontentloaded")
            frame = page.frame_locator("#epycGuideFrame")
            frame.locator('#viewNav [data-view="lanes"].active').wait_for()
            check(frame.locator('#viewNav [data-view="lanes"].active').count() == 1, "guide reload restores selected diagram")
            page.locator("#epycProductsTab").click()
            check(page.locator("#searchInput").input_value() == "9005", "return to Products preserves search")
            check(page.locator("#timeline .arch-group").count() == product_count, "return to Products preserves product DOM")
            check(page.locator(".layout").is_visible(), "product layout returns")
            contextual = page.locator('[data-architecture-guide="epyc-9005"]')
            check(contextual.count() == 1, "9005 series has one contextual guide entry")
            contextual.click()
            check(page.locator("#epycGuidePanel").is_visible(), "contextual entry opens the guide")
            page.locator("#epycProductsTab").click()
            page.locator("#epycGuideTab").click()
            frame.locator('#viewNav [data-view="lanes"].active').wait_for()
            page.locator("#tabIntel").click()
            check(nav.is_hidden(), "guide switch hides on Intel")
            check(page.locator(".layout").is_visible(), "Intel products remain visible")
            page.goto(base + "?vendor=amd&tab=epyc&panel=guide&guide=epyc-9005&diagram=bad", wait_until="domcontentloaded")
            frame = page.frame_locator("#epycGuideFrame")
            frame.locator('#viewNav [data-view="package"].active').wait_for()
            check(frame.locator('#viewNav [data-view="package"].active').count() == 1, "unknown diagram falls back to package")
            page.set_viewport_size({"width": 390, "height": 844})
            page.wait_for_timeout(300)
            no_overflow = page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1")
            check(no_overflow, "guide has no page-level horizontal overflow at phone width")
            check(frame.locator(".stage-scroll").evaluate("(e) => e.scrollWidth > e.clientWidth"), "phone diagram pans horizontally")
            page.set_viewport_size({"width": 320, "height": 700})
            page.wait_for_timeout(300)
            check(page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1"), "guide has no page-level horizontal overflow at 320px")
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    check(not errors, f"no browser JavaScript errors ({errors})")


if __name__ == "__main__":
    main()
