# Hardware Dashboard

A static, interactive reference for exploring AMD, Intel, and NVIDIA processors and
graphics products. It combines product timelines, searchable specification tables,
filters, and cross-vendor comparison in one browser-based dashboard.

**Live dashboard:** <https://dborus.github.io/hardware-dashboard/>

## Coverage

| Vendor and tab | Product groups | Models |
|---|---:|---:|
| AMD EPYC | 20 series | 350 |
| AMD Ryzen | 32 series | 736 |
| AMD GPU | 45 series | 303 |
| Intel Xeon | 11 generations | 553 |
| Intel Client | 11 generations | 340 |
| Intel Graphics | 4 generations | 35 |
| NVIDIA Data Center | 9 launch-year groups | 20 |
| NVIDIA GeForce | 5 series | 47 |
| NVIDIA CPU and Superchips | 2 launch-year groups | 4 |

NVIDIA coverage begins in 2017. AMD and Intel coverage includes the modern product
families represented in their official specification exports.

## What it does

- Groups products by vendor, product line, generation, and codename.
- Searches model names and specification fields with relevance-ranked results.
- Filters by product segment, brand, and core count where applicable.
- Expands each family into detailed, horizontally scrollable specification tables.
- Compares as many as four CPU or GPU models across vendors.
- Preserves filters and navigation state in shareable URLs.
- Shows data provenance and confidence information inside the dashboard.
- Runs as a responsive, zero-dependency static site.

## Run locally

The dashboard loads JSON at runtime, so serve it over HTTP rather than opening
`index.html` directly:

```powershell
Set-Location "C:\path\to\hardware-dashboard"
python -m http.server 8084
```

Then open <http://localhost:8084/>. After changing JavaScript, CSS, or data, use
**Ctrl+Shift+R** to bypass the browser cache.

## Repository structure

```text
hardware-dashboard/
├── index.html                 Static application shell
├── css/
│   └── styles.css             Shared and vendor-scoped presentation
├── js/
│   ├── script.js              Bootstrap, shared state, search, comparison
│   ├── amd-v2.js              Generated AMD taxonomy plus renderer
│   ├── intel-v2.js            Intel renderer
│   ├── nvidia-v2.js           NVIDIA renderer
│   └── data/                  Runtime JSON loaded by the dashboard
├── docs/
│   ├── specs/                 Master data, audits, provenance, source exports
│   ├── DATA-SCHEMA.md         Runtime data contracts
│   ├── DESIGN-SYSTEM.md       Visual tokens and component conventions
│   ├── PROJECT-STATE.md       Current status and engineering history
│   └── WORKFLOWS.md           Maintenance and import procedures
├── tools/                     Importers, generators, audits, and browser tests
├── CLAUDE.md                  Repository-specific engineering instructions
└── CHANGELOG.md               Release history
```

## Data provenance

Specifications are never filled from guesswork. Unknown values remain blank.

- **AMD:** compiled from AMD Product Specifications CSV exports. The maintained
  runtime source is `docs/specs/amd-master.csv`, supplemented only by presentation
  metadata in `js/data/amd-presentation.json`.
- **Intel:** imported from Intel ARK exports with separate Xeon, Client, and Graphics
  importers.
- **NVIDIA:** compiled from audited official product pages, comparison tables,
  architecture guides, and datasheets. The audit records source disagreements rather
  than silently choosing an inferred value.

`docs/specs/hardware-specs-master.csv` is a broader research workbench. It contains
confidence and source-quality fields and may include secondary-source or provisional
records. It is not a runtime input and should not be treated as the dashboard's
authoritative dataset.

See [the data schema](docs/DATA-SCHEMA.md) and
[specification notes](docs/specs/SPEC.md) for the complete contracts.

## Updating generated data

AMD's generated files are rebuilt in this order:

```bash
python3 tools/build-amd-data.py
python3 tools/derive-blocks.py
python3 tools/gen-amd-v2.py
```

NVIDIA's runtime data is rebuilt with:

```bash
python3 tools/build-nvidia-data.py
```

`tools/audit-nvidia-specs.py` is the optional secondary-source corroboration workflow.
It requires pandas and an external DBGPU CSV supplied through `--dbgpu`; the committed
`nvidia-audit.csv` and `nvidia-gaps.csv` retain its reviewed results.

Intel has a dedicated importer for each product tab:

```bash
python3 tools/import-xeon-specs.py
python3 tools/import-client-specs.py -o js/data/intel-client-specs.json
python3 tools/import-graphics-specs.py -o js/data/intel-graphics-specs.json
```

Do not hand-edit generated runtime files. The ownership and ordering rules are described
in [CLAUDE.md](CLAUDE.md) and [the workflows guide](docs/WORKFLOWS.md).

## Verification

Install Playwright once, then run the ordering, data, browser, and layout checks:

```bash
pip install playwright
python3 -m playwright install chromium-headless-shell
python3 tools/check-order.py
python3 tools/build-amd-data.py --check
python3 tools/smoke-test.py
python3 tools/audit-layout.py
```

The smoke test exercises all nine product tabs and guards these minimum model counts:

- AMD: EPYC 350, Ryzen 736, GPU 303
- Intel: Xeon 553, Client 340, Graphics 35
- NVIDIA: Data Center 20, GeForce 47, CPU and Superchips 4

Use `python3 tools/smoke-test.py --shots` after visual changes and inspect the generated
screenshots; passing counts alone do not prove that the layout is correct.

## Documentation

| Document | Purpose |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Architecture, conventions, and repository-specific safeguards |
| [Project state](docs/PROJECT-STATE.md) | Current baseline, open issues, and session history |
| [Workflows](docs/WORKFLOWS.md) | Repeatable import, generation, and verification procedures |
| [Design system](docs/DESIGN-SYSTEM.md) | Colours, typography, spacing, and components |
| [Data schema](docs/DATA-SCHEMA.md) | JSON contracts and SKU ordering rules |
| [Specification notes](docs/specs/SPEC.md) | Master datasets, confidence, and provenance |

## Technology

Vanilla HTML, CSS, and JavaScript. There is no framework, package manager, runtime
dependency, or production build step. GitHub Pages serves the files directly.

## Repository and site

- Repository: <https://github.com/DborUS/hardware-dashboard>
- Dashboard: <https://dborus.github.io/hardware-dashboard/>
