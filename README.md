# Hardware Portal

An interactive dashboard for navigating the modern silicon landscape: AMD and Intel CPU
architectures and the full AMD GPU line, placed on a timeline with expandable
specification tables.

Built as a working reference for technical conversations — find a part, compare specs,
and see where it sits generationally.

## Coverage

| Tab | Product groups | Models |
|---|---|---|
| AMD EPYC | 20 series | 350 |
| AMD Ryzen | 32 series | 736 |
| AMD GPU | 43 series | 303 |
| Intel Xeon | 11 generations | 553 |
| Intel Client | 11 generations | 340 |
| Intel Graphics | 4 generations | 35 |
| NVIDIA Data Center | 9 launch-year groups | 20 |
| NVIDIA GeForce | 5 series | 47 |
| NVIDIA CPU + Superchips | 2 launch-year groups | 4 |

The GPU side spans AMD and NVIDIA: Instinct/CDNA, Radeon and Radeon PRO, NVIDIA
data-center accelerators, and GeForce desktop products from 2017 onward.

Newest entry: **Zen 6 / EPYC 9006 "Venice"** — 31 models across SP7 and SP8.

## Features

- **Timeline view** — architectures grouped by year, newest first, each with its own
  accent colour and a client/server badge derived from its SKUs.
- **Multi-select filtering** — one filter bar per tab. Tags within a group are OR'd,
  groups are AND'd. CPU tabs filter by Segment and Brand; the GPU tab by Segment
  (Datacenter / Workstation / Consumer / Mobile).
- **Relevance-ranked search** — exact SKUs outrank suffix variants and specification
  matches. Closed cards explain which SKU and field matched; opening one highlights
  only the relevant rows.
- **Expandable spec tables** — cores, threads, clocks, cache, TDP, socket and
  platform details, with a visible vendor → product line → generation → codename path.
- **Cross-vendor comparison** — select up to four CPU or GPU rows, carry them between
  tabs, and compare their available fields side by side with differences highlighted.
- **Source visibility** — every expanded table identifies its vendor dataset, and the
  Data Sources panel explains provenance and confidence.
- **Shareable views** — the URL remembers vendor, product line, search, filters, and
  core range, so a precise dashboard view can be bookmarked or sent to someone else.
- **Per-architecture links** — saved to `localStorage`, so they persist
  between visits on that browser.
- **Responsive** — three breakpoints; spec tables scroll horizontally on mobile.

## Running it

The dashboard fetches its data at runtime, so **opening `index.html` directly will not
work** — browsers block `fetch` over `file://` and you'll get a blank page. Serve it:

```bash
cd hardware-dashboard
python -m http.server 8084
```

Then open <http://localhost:8084>.

After changing data or code, hard-refresh with **Ctrl+Shift+R**. The `?v=` string on the
`script.js` tag in `index.html` is bumped on each change and doubles as a diagnostic — if
view-source shows an old version, you're serving a different directory than you edited.

**Hosting:** currently local-only. The repository is private, so GitHub Pages is not in
use; a hosting decision is still open.

## Project structure

```
hardware-dashboard/
├── index.html                      # Static shell — JS fills the containers
├── css/styles.css                  # All styling, tokens, animations
├── js/
│   ├── script.js                   # All logic — config, render, filter, persistence
│   └── data/                       # Fetched at runtime, cached per vendor
│       ├── amd-data.json           # AMD CPU architectures + SKUs
│       ├── intel-data.json         # Intel CPU architectures + SKUs
│       ├── amd-gpu-data.json       # AMD GPU families + models
│       ├── amd-cpu-specs.json      # AMD CPU models, keyed by SKU name
│       └── intel-cpu-specs.json    # Intel CPU models, keyed by SKU name
├── tools/
│   ├── smoke-test.py               # Headless regression test
│   └── import-specs.py             # Vendor CSV → JSON importer
├── docs/                           # See below
├── CLAUDE.md                       # Conventions + gotchas — read first
├── CHANGELOG.md
└── README.md
```

## Documentation

| File | Purpose |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Architecture, conventions, known issues. **Start here.** |
| [`docs/PROJECT-STATE.md`](docs/PROJECT-STATE.md) | Living status + session log |
| [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md) | Step-by-step recipes for common tasks |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | Colours, type, spacing, components |
| [`docs/DATA-SCHEMA.md`](docs/DATA-SCHEMA.md) | JSON contracts for every data file |
| [`docs/MOBILE-TESTING.md`](docs/MOBILE-TESTING.md) | Mobile test notes |
| [`docs/AUDIT-2026-02-14.md`](docs/AUDIT-2026-02-14.md) | Historical audit — superseded |

## Adding data

New silicon usually arrives as a CSV from a vendor specifications page. Use the importer
rather than hand-editing JSON — it catches the failure modes that are otherwise silent
(a SKU key that matches nothing, a brand with no filter chip, unit phrasing that drifts):

```bash
python3 tools/import-specs.py inspect specs.csv --target amd-cpu
python3 tools/import-specs.py import specs.csv --target amd-cpu \
    --sku "Venice SP7" --map map.json --server        # dry run
python3 tools/import-specs.py import ... --write      # apply
```

Full walkthrough in [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md) (Workflow 2b).

**Never invent a specification.** Every value must come from an official vendor source.
Omit an unknown field rather than guessing — a wrong spec in front of a customer is the
worst failure this project can have.

## Verifying changes

```bash
pip install playwright
python3 -m playwright install chromium-headless-shell
python3 tools/smoke-test.py --shots
```

Loads the real page, exercises every tab, reports element counts and JavaScript errors,
and exits non-zero on failure. With `--shots` it also writes screenshots to
`tools/screenshots/` — read them, since passing counts don't prove the layout is right.

The guarded model floors are AMD EPYC **350**, Ryzen **736**, AMD GPU **303**,
Intel Xeon **553**, Intel Client **340**, and Intel Graphics **35**.

## Technical notes

Vanilla HTML/CSS/JavaScript — no framework, no build step, no dependencies. Open it
through a web server and it runs.

The core convention is **render once, then filter with CSS classes**: `render()` builds
the entire DOM and stamps filter metadata as data attributes; `applyFilters()` only
toggles a `.hidden` class. This keeps filtering under ~5 ms and is load-bearing — a
feature that re-renders on every keystroke would undo it.

Data is lazy-loaded per vendor and cached. Search is debounced at 300 ms.

Targets modern browsers with ES6 support (Chrome/Edge 90+, Firefox 88+, Safari 14+).

## Data sources

AMD data is compiled from AMD's official Product Specifications CSV exports. Intel data
is imported from Intel ARK specification exports. NVIDIA data is compiled from audited
official product pages, comparison tables, architecture guides, and datasheets. Unknown
values are left blank rather than inferred.

## Repository

**GitHub:** https://github.com/DborUS/hardware-dashboard (private)
