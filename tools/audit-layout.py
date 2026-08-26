"""Measure alignment, spacing and overflow across every tab and width.

Reports facts rather than opinions: shared left edges, vertical rhythm,
horizontal overflow, touch-target sizes and text clipping.
"""
import http.server, socketserver, threading, functools, collections
from playwright.sync_api import sync_playwright

ROOT = '/sessions/charming-modest-thompson/mnt/hardware-dashboard'
PORT = 9011
ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]

h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(("127.0.0.1", PORT), h)
srv.RequestHandlerClass.log_message = lambda *a, **k: None
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

  // horizontal overflow anywhere?
  R.overflow = [];
  document.querySelectorAll('.container *').forEach(e => {
    const r = e.getBoundingClientRect();
    if (r.width > 0 && r.right > document.documentElement.clientWidth + 1) {
      R.overflow.push((e.className||e.tagName).toString().slice(0,42) + ' right=' + r.right.toFixed(0));
    }
  });
  R.overflow = [...new Set(R.overflow)].slice(0, 8);

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
        pg.wait_for_timeout(2100)
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
    pg.wait_for_timeout(2100)
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
    b.close()
srv.shutdown()
