"""Measure alignment, spacing and overflow across every tab and width.

Reports facts rather than opinions: shared left edges, vertical rhythm,
horizontal overflow, touch-target sizes and text clipping.
"""
import http.server, socketserver, threading, functools, collections
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 9011
ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class AuditServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 64


h = functools.partial(QuietHandler, directory=str(ROOT))
srv = AuditServer(("127.0.0.1", PORT), h)
threading.Thread(target=srv.serve_forever, daemon=True).start()

MEASURE = """() => {
  const R = {};
  const bb = s => { const e=document.querySelector(s); if(!e) return null;
                    const r=e.getBoundingClientRect();
                    return {l:+r.left.toFixed(1), t:+r.top.toFixed(1),
                            w:+r.width.toFixed(1), h:+r.height.toFixed(1),
                            r:+r.right.toFixed(1), b:+r.bottom.toFixed(1)}; };

  // left edges that ought to agree
  R.edges = {
    sidebar:   bb('#filterControls'),
    coreGroup: bb('.core-range'),
    firstChip: bb('.fchip'),
    label:     bb('.fgroup-label'),
    timeline:  bb('#timeline'),
    firstBlock:bb('.arch-name'),
    era:       bb('.v2-era-label'),
    subtabs:   bb('.v2-subtabs.visible'),
    search:    bb('.search-wrap'),
    pill:      bb('.vendor-pill'),
    title:     bb('#pageHeader h1'),
  };

  // horizontal overflow outside intentional scroll areas?
  R.overflow = [];
  document.querySelectorAll('.container *').forEach(e => {
    const r = e.getBoundingClientRect();
    if (r.width > 0 && r.right > document.documentElement.clientWidth + 1) {
      let parent = e.parentElement;
      let insideScrollArea = false;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        const box = parent.getBoundingClientRect();
        if (['auto', 'scroll'].includes(style.overflowX) && box.right <= document.documentElement.clientWidth + 1) {
          insideScrollArea = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!insideScrollArea) {
        R.overflow.push((e.className||e.tagName).toString().slice(0,42) + ' right=' + r.right.toFixed(0));
      }
    }
  });
  R.overflow = [...new Set(R.overflow)].slice(0, 8);
  R.documentWidth = document.documentElement.scrollWidth;

  // element wider than its parent (a clipping risk)
  R.clipped = [];
  document.querySelectorAll('.sku-name, .arch-name, .fchip-label, #pageHeader p, .v2-era-note, .arch-subtitle')
    .forEach(e => { if (e.scrollWidth > e.clientWidth + 1)
      R.clipped.push((e.textContent||'').trim().slice(0,34)); });
  R.clipped = [...new Set(R.clipped)].slice(0, 8);

  // vertical gaps between consecutive timeline blocks
  const blocks = [...document.querySelectorAll('#timeline > .arch-group:not(.hidden)')];
  R.blockGaps = [];
  for (let i=1;i<blocks.length;i++) {
    const g = blocks[i].getBoundingClientRect().top - blocks[i-1].getBoundingClientRect().bottom;
    R.blockGaps.push(Math.round(g));
  }
  R.blockGaps = [...new Set(R.blockGaps)];

  // gaps between sidebar filter groups
  const gs = [...document.querySelectorAll('#filterControls > .fgroup')];
  R.groupGaps = [];
  for (let i=1;i<gs.length;i++)
    R.groupGaps.push(Math.round(gs[i].getBoundingClientRect().top - gs[i-1].getBoundingClientRect().bottom));
  R.groupGaps = [...new Set(R.groupGaps)];

  // interactive targets under 32px tall
  R.smallTargets = [];
  document.querySelectorAll('button, input, [role="button"], [role="slider"]').forEach(e => {
    const r = e.getBoundingClientRect();
    if (r.height > 0 && r.height < 32)
      R.smallTargets.push(((e.className||e.tagName)+'').slice(0,34)+' h='+r.height.toFixed(0));
  });
  R.smallTargets = [...new Set(R.smallTargets)].slice(0, 8);

  return R;
}"""


def edge_report(e):
    """Group elements by left edge; anything within 2px should share one."""
    groups = collections.defaultdict(list)
    for k, v in e.items():
        if v:
            groups[round(v['l'])].append(k)
    return dict(sorted(groups.items()))


with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS, chromium_sandbox=False)
    for width in (1440, 1024, 390):
        pg = b.new_page(viewport={"width": width, "height": 1100})
        pg.goto(f"http://127.0.0.1:{PORT}/index.html")
        pg.locator('#a2Subtabs.visible').wait_for(state='visible', timeout=20000)
        print("=" * 66)
        print("  VIEWPORT %dpx  ·  AMD EPYC" % width)
        print("=" * 66)
        r = pg.evaluate(MEASURE)
        print("  left edges (px -> elements sharing it):")
        for x, names in edge_report(r['edges']).items():
            print("    %5d  %s" % (x, ', '.join(names)))
        print("  block gaps      :", r['blockGaps'])
        print("  filter group gaps:", r['groupGaps'])
        print("  overflow        :", r['overflow'] or 'none')
        print("  clipped text    :", r['clipped'] or 'none')
        print("  targets <32px   :", r['smallTargets'] or 'none')
        print()
        pg.close()

    # Intel at desktop
    pg = b.new_page(viewport={"width": 1440, "height": 1100})
    pg.goto(f"http://127.0.0.1:{PORT}/index.html")
    pg.locator('#a2Subtabs.visible').wait_for(state='visible', timeout=20000)
    pg.click("#tabIntel")
    pg.wait_for_timeout(2000)
    r = pg.evaluate(MEASURE)
    print("=" * 66)
    print("  VIEWPORT 1440px  ·  INTEL XEON")
    print("=" * 66)
    for x, names in edge_report(r['edges']).items():
        print("    %5d  %s" % (x, ', '.join(names)))
    print("  block gaps      :", r['blockGaps'])
    print("  overflow        :", r['overflow'] or 'none')
    print("  clipped text    :", r['clipped'] or 'none')
    print("  targets <32px   :", r['smallTargets'] or 'none')
    pg.click("#tabNvidia")
    pg.wait_for_timeout(1200)
    r = pg.evaluate(MEASURE)
    print()
    print("=" * 66)
    print("  VIEWPORT 1440px  ·  NVIDIA DATA CENTER")
    print("=" * 66)
    for x, names in edge_report(r['edges']).items():
        print("    %5d  %s" % (x, ', '.join(names)))
    print("  block gaps      :", r['blockGaps'])
    print("  overflow        :", r['overflow'] or 'none')
    print("  clipped text    :", r['clipped'] or 'none')
    print("  targets <32px   :", r['smallTargets'] or 'none')
    # Ampere has a single processor view; inspect it at desktop and phone
    # widths, including 320px where a four-vendor switcher is most constrained.
    ampere_overflow = []
    ampere_table_failures = []
    pg.click("#tabAmpere")
    pg.locator('.arch-group:not(.p2-roadmap) .arch-header').first.wait_for(
        state="visible", timeout=15000
    )
    for width in (1440, 1024, 390, 320):
        pg.set_viewport_size({"width": width, "height": 1100})
        r = pg.evaluate(MEASURE)
        print()
        print("=" * 66)
        print("  VIEWPORT %dpx  ·  AMPERE PROCESSORS" % width)
        print("=" * 66)
        for x, names in edge_report(r['edges']).items():
            print("    %5d  %s" % (x, ', '.join(names)))
        print("  block gaps      :", r['blockGaps'])
        print("  filter group gaps:", r['groupGaps'])
        print("  overflow        :", r['overflow'] or 'none')
        print("  document width  :", r['documentWidth'])
        print("  clipped text    :", r['clipped'] or 'none')
        print("  targets <32px   :", r['smallTargets'] or 'none')
        if r['documentWidth'] > width + 1:
            ampere_overflow.append((width, r['documentWidth']))
        if width in (390, 320):
            header = pg.locator('.arch-group:not(.p2-roadmap) .arch-header').first
            if header.get_attribute('aria-expanded') == 'false':
                header.click()
            card = pg.locator('.arch-group:not(.p2-roadmap) .sku-card').first
            if card.get_attribute('aria-expanded') == 'false':
                card.click()
            spec = pg.evaluate("""() => {
              const panel = document.querySelector('.cpu-spec-overflow');
              panel.scrollLeft = panel.scrollWidth;
              return {client: panel.clientWidth, content: panel.scrollWidth,
                      moved: panel.scrollLeft,
                      document: document.documentElement.scrollWidth};
            }""")
            print("  expanded spec   :", spec)
            if (spec['content'] <= spec['client'] + 1 or spec['moved'] <= 0 or
                    spec['document'] > width + 1):
                ampere_table_failures.append((width, spec))
    pg.close()

    b.close()
srv.shutdown()
if ampere_overflow:
    raise SystemExit(f"Ampere viewport overflow: {ampere_overflow}")
if ampere_table_failures:
    raise SystemExit(f"Ampere specification table did not scroll within its panel: {ampere_table_failures}")
