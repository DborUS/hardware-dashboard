# Hardware Dashboard

A static, interactive reference for exploring AMD, Intel, NVIDIA, and Ampere processors and
graphics products. It combines product timelines, searchable specification tables,
filters, and cross-vendor comparison in one browser-based dashboard.

**Live dashboard:** <https://dborus.github.io/hardware-dashboard/>

**Current local site version:** Public beta 0.0.5. Publication is not yet confirmed;
the platform catalog retains its separate 1.2.0 release version.

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
| Ampere Computing Processors | 5 families | 26 |

NVIDIA coverage begins in 2017. AMD and Intel coverage includes the modern product
families represented in their official specification exports.

## What it does

- Groups products by vendor, product line, generation, and codename.
- Searches model names and specification fields across all four vendor views.
- Filters by product segment, brand, and core count where applicable.
- Expands each family into detailed, horizontally scrollable specification tables.
- Compares as many as four CPU or GPU models across vendors.
- Preserves filters and navigation state in shareable URLs.
- Includes interactive architecture guides for EPYC 9005, selected Xeon 6 platforms, and NVIDIA GH200.
- Offers an interactive benchmark explorer with source-linked datacenter CPU, accelerator, and Blender rendering results.
- Shows data provenance and confidence information inside the dashboard.
- Runs as a responsive, zero-dependency static site.

## Platform learning guides

Open **Platforms** from Products or Benchmarks, or visit `platforms/`. The selected
102-profile reference spans Cisco UCS, HPE, Dell, Lenovo and Supermicro. It teaches
server families and generation dates, and compares processor populations, DIMM
slots, DPC, cooling and accelerator evidence. Products, Benchmarks, the Platform
Finder and all five OEM guides share the ChipIndex header, version and What's new
history. OEM selection and lesson navigation sit within Platforms, with a route
back to the finder. Unknown values and source conflicts stay explicit; this is a
curated learning and shortlisting tool.

The server icon beside an individual CPU continues to use the existing exact-CPU
compatibility snapshot. Its new **Open Platform Finder** link starts broader family
research and does not infer additional exact-SKU qualification.

Generated static pages are checked in under `platforms/`; source and review inputs
live under `tools/platform-guides/`. Rebuild with `python tools/build-platform-guides.py`
and check with `python tools/check-platform-guides-integration.py`. No sibling project
or runtime build is needed to serve the site. See [platform maintenance](docs/PLATFORM-GUIDES.md).

## Benchmark explorer

Open **Benchmarks** from any vendor product page or visit `benchmarks/`.
Products, Benchmarks and Platforms share the same site header, navigation and What's new history; the vendor selector remains in Products.
Vendor Benchmarks tabs start with all manufacturers; linked CPU table scores open their matching model and test. Choose hardware,
workload and source version, then read the score unit, tested-system boundary,
capture date and published result. The AMD-inspired red and black explorer
provides a model chart, equivalent score table, filtered source reports and
three-result comparisons. Search, manufacturer, core count, CPU count, client
Desktop/Laptop, scenario and test-build controls preserve a shareable view URL.
Long report lists show 100 at a time; Show more reveals all sourced reports.
The source directory lists each imported dataset's scope and count.

The **October 7, 2026** reviewed snapshot contains **3,862 linked results for
697 of 2,393 indexed products**:

| Source | Selected scope | Results | Distinct scored products |
| --- | --- | ---: | ---: |
| SPEC CPU | CPU 2017/2026 integer and floating-point rate, exact enterprise catalog CPUs | 3,642 | 516 |
| MLPerf® Inference | v6.0, Llama 2 70B 99%, Closed/Available, eight accelerators, Server and Offline | 46 | 7 |
| Blender Open Data | 5.2.0 rendering, exact client CPU and GPU models, at least five submissions | 174 | 174 |

SPEC CPU 2017 searches the available rate-result archives and retains the two
newest disclosures per exact model and CPU count, plus previously verified
reports. SPEC CPU 2026 includes every exact matched report found in the
reviewed archive indexes. Its four published test builds stay in separate
views. CPU 2017 and CPU 2026 scores, integer/floating-point tests, and one-/two-
CPU systems use separate comparisons. SPEC scores describe submitted server
systems, including compiler, memory and copy count. NVIDIA GB10 appears only
as a sourced CPU-component test in a DGX Spark system; it is not a GPU score.

CPU names also show catalog core and clock specifications where the product
source provides them. These are processor model specifications, not clocks
measured during a benchmark run. Intel client P-core and E-core frequency
pairs stay distinct; power figures with a different scope are not presented
as CPU TDP. SPEC system CPU count and enabled cores remain separate.

CPU specification tables keep their original columns and add one compact
Benchmark column at the end. Enterprise rows show the test, build, tested
CPU count and one published SPEC system score; client rows show the Blender
5.2.0 rendering median. Select a score to open that model and test in the
benchmark explorer. These are sourced system or community results, not an
intrinsic CPU rating. A dash means no result in the imported snapshots, not
that the processor has no public benchmark result.

MLPerf Request stream and Batch processing retain the official Server and
Offline scenarios as separate whole-system Tokens/s results. B300 remains
unmatched because its source and catalog memory labels lack a reviewed identity
bridge. Blender medians pool community submissions and do not describe gaming
or overall laptop performance. Some AMD client models appear under Desktop
and Laptop because the manufacturer lists both form factors; the filter does
not identify the chassis that submitted each Blender run.

**Coverage is selected, not exhaustive.** Missing products may have public
scores outside these matched sources or comparison cohorts. PassMark remains
unconnected because its standard terms restrict public benchmark comparison
sites; the owner confirmed no separate permission. OpenBenchmarking/Phoronix
remains unconnected while result access and reuse terms are unresolved. See
[benchmark program and source policy](docs/BENCHMARK-PROGRAM.md).

### Refresh and release checks

The static site loads reviewed JSON snapshots. The browser does not query
third-party benchmark sites. Dates represent actual source capture, not the
page visit. Importers retain source hashes and reviewed exclusions. Run:

```powershell
python tools/refresh-benchmarks.py --check
python tools/build-product-benchmark-index.py --check
python tools/smoke-benchmarks.py
python tools/smoke-test.py
python tools/audit-layout.py
```

`--check` replays the retained inputs and verifies snapshots, catalog, source
registry and the generated product-table benchmark index without fetching new
data. Use
`python tools/refresh-benchmarks.py --refresh all --allow-network` to capture
supported public sources explicitly, then review source exclusions, browser
screenshots and the changed files before publication. `--refresh spec`,
`--refresh mlperf`, or `--refresh blender` can replay or refresh one source;
omit `--allow-network` for offline replay. Failed refreshes restore the prior
validated files. GitHub's benchmark validation workflow performs read-only
checks on changes; it does not refresh or publish data.

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
├── benchmarks/               Standalone interactive benchmark explorer
├── js/
│   ├── script.js              Bootstrap, shared state, search, comparison
│   ├── amd-v2.js              Generated AMD taxonomy plus renderer
│   ├── intel-v2.js            Intel renderer
│   ├── nvidia-v2.js           NVIDIA renderer
│   ├── ampere-v2.js           Ampere renderer
│   ├── roadmap.js             Announced product cards
│   └── data/                  Runtime JSON loaded by the dashboard
├── docs/
│   ├── specs/                 Master data, audits, provenance, source exports
│   ├── DATA-SCHEMA.md         Runtime data contracts
│   ├── DESIGN-SYSTEM.md       Visual tokens and component conventions
│   ├── PROJECT-STATE.md       Current status and engineering history
│   └── WORKFLOWS.md           Maintenance and import procedures
├── architecture/             Embedded EPYC 9005, Xeon 6, and GH200 diagram guides
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
- **Ampere:** generated from an official-source master CSV, with published usage power
  kept separate from TDP.

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

The smoke test exercises all ten product tabs and guards these minimum model counts:

- AMD: EPYC 350, Ryzen 736, GPU 303
- Intel: Xeon 553, Client 340, Graphics 35
- NVIDIA: Data Center 20, GeForce 47, CPU and Superchips 4
- Ampere: Processors 26

Use `python3 tools/smoke-test.py --shots` after visual changes and inspect the generated
screenshots; passing counts alone do not prove that the layout is correct.

## Documentation

| Document | Purpose |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Architecture, conventions, and repository-specific safeguards |
| [Project state](docs/PROJECT-STATE.md) | Current baseline, open issues, and session history |
| [Update queue](docs/UPDATE-QUEUE.md) | Visitor-facing changes waiting for a New update post |
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
