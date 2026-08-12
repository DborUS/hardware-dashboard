# Changelog
All notable changes to the Hardware Portal project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Zen 6 / EPYC 9006 "Venice" — 31 new server SKUs (2026-08-12):
  - New `zen6` architecture entry (2026, magenta `#ec4899` extending the warm end of the
    AMD accent progression), a `2026` era separator, and a codename-table row.
  - Split into two SKU cards by socket, since the series spans both: **Venice SP7**
    (9 models, up to 256C/512T, PCIe 6.0 x96) and **Venice SP8** (22 models, 8C–128C,
    PCIe 6.0 x128). All DDR5 RDIMM/MRDIMM at 8000 / 12800 MT/s.
  - Imported with `tools/import-specs.py` from AMD's Server Processor Specifications CSV
    (240 rows → 31 after `--filter "Series=EPYC 9006 Series"`).
  - **Every field of all 31 models was verified against the source CSV** — cores, threads,
    clocks, cache, TDP, socket, socket count, PCIe, memory and tray ID all match exactly.
  - Subtitle is `EPYC 9006 (Venice) · SP7 / SP8`. **Process node deliberately omitted** —
    AMD's CSV has no process/lithography column, and the house convention is to lead the
    subtitle with the node. Add `TSMC 2 nm · ` to the front once confirmed from an
    official source, and set `process` in the codename table (currently `—`).

### Fixed
- SKU names ending in a digit broke spec-table search (2026-08-12):
  - `applyFilters()` recovered the SKU name by splitting the rendered card text on
    `/\d+\sSKUs/`. For "Venice SP7" the card reads `Venice SP79 SKUs`, so the regex
    consumed the trailing `7` and produced `Venice SP` — which matches no spec key, so
    searching `EPYC 9996` found nothing while `EPYC 9755` worked.
  - Fixed by stamping `data-sku-name` on each card and reading that instead of parsing
    rendered text. The fragile regex is gone from both call sites.
  - Also made `.sku-spec-count` `inline-block` so its margin actually separates the count
    from a name ending in a digit (`Venice SP79 SKUs` → `Venice SP7 9 SKUs`).
- `tools/import-specs.py` gained `--filter COL=VALUE` (repeatable) and
  `--transform FIELD:NAME` for vendor CSVs that need row selection or value cleanup:
  `strip-amd` (`AMD EPYC™ 9996` → `EPYC 9996`), `up-to`, `tight-watt`.
- `tools/import-specs.py` — CSV → JSON importer for new silicon (2026-08-12):
  - `inspect` prints CSV columns with guessed schema mappings and sample values;
    `import` does a dry run by default and only writes with `--write`; `export` dumps
    existing specs back to CSV for diffing against a vendor update.
  - Encodes the project's known silent failures as checks: **blocks** when the `--sku`
    key doesn't match any `skus[].name` (the table would never render), and **warns** on
    `_srv`/field mismatches, unit-phrasing drift (`"600 W"` vs `"600W"`), and duplicate
    model names.
  - Verified end-to-end against a synthetic EPYC 9006 CSV: guessed all 12 AMD columns
    correctly, blocked an invalid SKU key, warned on a missing `--server` flag and on
    TDP spacing drift, wrote 3 models, round-tripped via `export`, then rolled back.
  - Documented as Workflow 2b in `docs/WORKFLOWS.md`. GPU import not yet supported —
    GPU specs nest inside the architecture entry rather than a separate keyed file.

### Fixed
- Search now covers spec fields, not just model names (2026-08-12):
  - **Searching a socket like `sp5` returned nothing.** The index only included the model
    name (`m.n`) from each spec record — socket, TDP, PCIe, memory and product ID were all
    unsearchable on every CPU tab.
  - Added `CPU_SEARCH_FIELDS = ['sk','tdp','pcie','mem','tr']` with `cpuModelSearchText()`
    and `cpuModelMatches()` helpers, so `render()` and both `applyFilters()` fallbacks use
    one definition instead of three copies of `m.n.toLowerCase()`.
  - Raw numerics (cores, threads, clocks, cache) are deliberately **not** indexed — a bare
    `128` would match core counts, thread counts and cache sizes simultaneously.
  - GPU search gained `form`, `tbp`, `bw` and `pcie`, so `OAM`, `1400 W` and `8000 GB/s`
    now work. Also removed a dead `specs.consumer || specs.workstation` branch there
    (those flags don't exist in the data).
  - Row highlighting now matches on the whole row rather than just the model-name cell,
    and applies to GPU tables too. Searching `sp5` highlights all 51 SP5 rows in amber.
  - Verified: `sp5` → Zen 5 + Zen 4 (Turin, Turin Dense, Genoa, Genoa-X, Bergamo — exactly
    the 5 codenames with SP5 parts) and 51 highlighted rows, matching the data.
    `AM5`, `sTR5`, `500W`, tray IDs, Intel `LGA1851`/`DDR5-6400`/`125W`, GPU `OAM` all work.

### Changed
- Unified filter bar completed on the Intel tab + legacy code removed (2026-08-12):
  - Intel CPU now uses the same multi-select bar (Segment + Brand). All three tabs are
    consistent; the old legend row and single-select button row are gone everywhere.
  - **Fixed: three Intel brands had no filter chip and were unreachable.** The data
    contains 8 brands but `VENDOR_CONFIG.intel.brandTags` listed only 5 — `Xeon 6+`
    (Clearwater Forest), `Xeon D` (Xeon D Embedded) and `Atom` (Atom Embedded) could not
    be filtered at all. Added with distinct colours; each now correctly narrows to its
    single architecture.
  - Bar auto-stacks into one row per group when a vendor has more than 10 chips, since
    12 chips wrapped awkwardly around the vertical divider. AMD (9) stays inline,
    Intel (12) stacks.
  - Removed the now-dead legacy path: `buildLegend()`, `buildFilters()`,
    `toggleLegendTag()`, `updateLegendDimming()`, `syncLegendToggles()`, the
    `buildCpuFilterUI()` dispatcher, the empty `#legendToggles` container, and 30
    orphaned CSS rules (`.legend*`, `.filter-btn*`, `.filter-divider`).
  - Net across the whole filter rework: **215 lines deleted, 157 added** — the dashboard
    gained multi-select on every tab while shrinking.

- Unified filter bar extended to the AMD GPU tab (2026-08-12):
  - GPU tab now uses the same single multi-select bar as the CPU tab: one `SEGMENT`
    group (Datacenter / Workstation / Consumer / Mobile) plus the contextual
    `Clear filters` chip. The decorative legend row and the old single-select button
    row are both gone.
  - **GPU segments are now multi-select**, which they never were before.
    `activeGpuSegment` (a string) became `activeGpuSegments` (a Set); empty means
    "show all", so the `All` button was no longer needed.
    Verified: Datacenter 7, Workstation 9, Consumer 22, Mobile 4 individually;
    Datacenter+Mobile = 11; +Workstation = 20; Clear = 42.
  - Refactored `buildUnifiedFilters()` into a generic `buildFilterBar(groups)` shared by
    both tabs, so CPU and GPU can't drift apart. CPU passes two groups
    (Segment + Brand), GPU passes one. `syncUnifiedFilters()` now reads the active bar's
    group descriptors from `filterBarGroups`.
  - Deleted `buildGpuLegend()`, `updateGpuLegend()` and `buildGpuFilters()` (~42 lines).
  - The GPU legend was previously decorative only — it had no click handler despite
    looking identical to the interactive CPU legend.
  - Intel still uses the legacy two-row layout; verified unchanged.

- Unified filter bar on the AMD CPU tab (2026-08-12):
  - Replaced the two-row filter design (legend pills + button row) with a single
    multi-select bar: `SEGMENT` group + `BRAND` group, divided, plus a `Clear filters`
    chip that appears only when a filter is active.
  - **Why:** the two rows carried the same segment labels but behaved differently and
    nothing on screen said so. The legend row was multi-select (Desktop + Laptop = 32
    cards); the button row was single-select (clicking Laptop silently deselected
    Desktop = 20 cards). Selecting two legend pills also left the button row with no
    active state, so it looked broken. Brands existed only in the legend row.
  - All chips are now multi-select. Within a group selections are OR'd; the two groups
    are AND'd. Verified: Desktop+Laptop = 32 cards, +Ryzen narrows further, Clear
    restores 44.
  - Opt-in per vendor via `unifiedFilters: true` in `VENDOR_CONFIG`. Only AMD has it;
    **Intel deliberately keeps the legacy two-row layout for now** and was verified
    unchanged. New `buildCpuFilterUI()` dispatches between the two.
  - New `buildUnifiedFilters()` / `syncUnifiedFilters()`; new `.filter-bar`, `.fgroup`,
    `.fchip`, `.fclear` styles with a stacked layout below 768px. Chips carry
    `aria-pressed` and a `:focus-visible` outline.

- GPU filtering reworked (2026-08-12):
  - Removed the PCIe / OAM form-factor filter buttons and their legend pills. They hid
    12 of 42 GPU families, because the matcher only recognised the substrings `pcie` and
    `oam` while the data contains 8 distinct `form` values. Workstation cards labelled
    `Desktops`, `Laptops` or `Workstations` silently vanished when PCIe was selected.
  - GPU segment filters are now: All / Datacenter / Workstation / Consumer / Mobile.
    Counts are datacenter 7 + workstation 9 + consumer 22 + mobile 4 = 42, so every
    family is now reachable.
  - New `Mobile` segment, derived at render time by `gpuSegmentOf()` from a family's form
    factors (`Laptops` / `Mobile Workstations`) rather than stored in the data, so new
    mobile families categorise themselves. Covers PRO W6000/W5000/WX X100/WX X200 Mobile.
  - Added `GPU_SEGMENTS` as the single source of truth for both the legend and the filter
    buttons, replacing two hardcoded lists.
  - `Form` column moved to second position in GPU spec tables, immediately after Model,
    with a new `.gpu-form-cell` style.
  - Bumped the `script.js?v=` cache-buster so browsers pick up the change.

### Known (pre-existing, reviewed 2026-08-12, won't fix)
- `gpuSpecs.consumer` / `gpuSpecs.workstation` flags are absent from all 42 GPU families,
  so the consumer and workstation table layouts in `renderGpu()` are unreachable and every
  family renders the datacenter column set. Verified against the pre-change build.
  **Cosmetic only — all displayed values are accurate.** Consumer tables carry two
  low-value columns (`FP32 Matrix` duplicates `FP32` on consumer parts; `Form` is `PCIe`
  for all 201 consumer models) and omit gaming specs (SPs, boost/game clocks, bus, cache)
  that don't exist in the data. Closed as not worth the sourcing effort.

### Added
- Project documentation and verification system (2026-08-12):
  - `CLAUDE.md` - architecture, conventions, golden rules, known issues
  - `docs/PROJECT-STATE.md` - living status document with verified baseline and session log
  - `docs/WORKFLOWS.md` - step-by-step recipes for common tasks
  - `docs/DESIGN-SYSTEM.md` - colour tokens, typography, motion, component patterns
  - `docs/DATA-SCHEMA.md` - JSON contracts for all five data files
  - `tools/smoke-test.py` - headless browser regression test; exercises every tab,
    reports element counts and JS errors, exits non-zero on failure
  - Marked `docs/AUDIT-2026-02-14.md` as superseded (most findings already fixed)

### Documented (bugs found during audit, not yet fixed)
- GPU form-factor filter hides 12 of 42 groups - buttons offer only PCIe/OAM but the data
  contains 8 distinct `form` values; `Desktops`, `Laptops` etc. silently vanish
- All 219 Intel CPU records flagged `_srv: true`, including desktop parts, so desktop
  chips render server table columns instead of GPU columns
- Notes textarea interpolates unescaped (`script.js:664`)
- `getLinks()` returns unvalidated `JSON.parse` output (`script.js:1174`)
- Working tree is CRLF while the repo stores LF - a fresh clone shows all files as
  modified; use `git diff --ignore-all-space` to see real changes

### Added
- Intel CPU detailed specifications (2026-02-15):
  - Parsed intel_cpu_complete.csv into intel-cpu-specs.json (88KB, 219 CPUs, 25 architectures)
  - All 216 unique CPU models verified accurate (100% field match with source CSV)
  - Includes Arrow Lake, Raptor Lake, Alder Lake, Lunar Lake, Panther Lake, and more
  - Server CPUs: Sapphire Rapids, Emerald Rapids, Granite Rapids, Sierra Forest, Diamond Rapids
  - Matches AMD CPU spec table design and functionality
  - Search now includes Intel CPU model names in results
  - Expandable tables show detailed specs: cores, threads, clock speeds, cache, TDP, socket, PCIe, memory
- Extended Intel architecture data (2026-02-15):
  - Added Clearwater Forest (next-gen Xeon 6+ E-Core)
  - Added Alder Lake variants (S, N)
  - Added Xeon W-2400/2500 workstation processors
  - Added Xeon D embedded processors
  - Added Twin Lake, Comet Lake, Rocket Lake architectures
- Unreleased architecture indicators (2026-02-15):
  - Visual distinction for unreleased/future architectures (2025-2026)
  - Red diagonal line overlay on architecture headers
  - Larger italic "Unreleased" text label (red color)
  - "No specs yet" message on SKU cards without data
  - Applied to Nova Lake, Panther Lake, Diamond Rapids, Clearwater Forest
- Tag filtering verification (2026-02-15):
  - All 50 Intel SKUs properly tagged (desktop, mobile, server, embedded)
  - Filter buttons work correctly for all segment tags
  - Brand filtering supports Core Ultra, Core, Xeon, Xeon 6 variants

### Fixed
- Mobile layout stability when expanding spec tables (2026-02-15):
  - Fixed font size inconsistency where SKU cards appeared larger after opening spec tables
  - Prevented grid columns from expanding beyond viewport with minmax(0, 1fr)
  - Fixed scroll behavior so only tables scroll horizontally, not entire content
  - Added explicit width constraints to prevent layout shifts on mobile
  - Constrained .skus-grid, .sku-card, and .cpu-spec-wrapper to 100% width with box-sizing

### Added
- AMD GPU consumer and workstation data (2026-02-15):
  - Parsed 244 GPU models from CSV files into JSON format
  - Added 22 consumer GPU series (Radeon RX 9000, 7000, 6000, etc.)
  - Added 13 workstation GPU series (Radeon PRO W7000, AI PRO, etc.)
  - Merged with existing Instinct datacenter GPUs (7 series)
  - Sorted by year (newest first) and performance within each year
  - Total: 35 GPU series across all segments
- GPU filtering system (2026-02-15):
  - New segment filters: Datacenter, Workstation, Consumer
  - Form factor filters: PCIe, OAM
  - Visual legend with colored indicators for active filters
  - Filter divider separating segment and form factor buttons
  - Segment names updated: server → datacenter, desktop → consumer
- Search clear button (2026-02-15):
  - X button appears inside search input when typing
  - Click to instantly clear search and reset results
  - Auto-hides when search is empty
  - Hover effect for better visibility
- CPU comparison features (2026-02-15):
  - Search highlighting: CPU model names in spec tables highlight yellow when searched
  - Manual row selection: Click any CPU spec table row to highlight green for comparison
  - Multi-select: Shift+click to select multiple rows for side-by-side comparison
  - "Clear Selections" button in toolbar to remove all green highlights
  - Click outside tables (on timeline/background) to clear selections
  - Yellow (search) and green (selected) highlights work together for easy comparison
  - Works across all vendor tabs (AMD CPU, Intel CPU, AMD GPU)
  - Search now finds CPU model names (e.g., "9575F", "EPYC 9575F") in addition to architecture names
- Mobile-responsive design improvements:
  - Touch-friendly tap targets (44x44px minimum) for all interactive elements
  - Horizontal scrolling for spec tables with -webkit-overflow-scrolling: touch
  - Three responsive breakpoints: 768px (tablet), 640px (mobile), 375px (small mobile)
  - Enhanced scrollbar styling for better visibility (8px height on mobile)
  - Collapsible codename table with horizontal scroll on mobile
  - Optimized font sizes and spacing for smaller screens
  - Touch-optimized padding for buttons, tabs, and legend items

### Changed
- Improved table scrolling behavior:
  - Added -webkit-overflow-scrolling: touch for smooth momentum scrolling on iOS
  - Increased scrollbar thickness from 6px to 8px for better touch interaction
  - Applied overflow-x: auto to codename table body for horizontal scrolling
- Enhanced mobile layout:
  - Single-column SKU grid on mobile devices (below 768px)
  - Reduced timeline dot size and repositioned for compact layouts
  - Hidden architecture segment badges on mobile to save space
  - Adjusted header sizes, margins, and padding for mobile screens
  - Optimized search input and filter controls for touch interaction
- Increased minimum button sizes for WCAG accessibility compliance

### Fixed
- Tables now scroll horizontally on mobile devices (primary issue resolved)
- Touch targets meet 44x44px accessibility standard for better mobile usability
- Expand/collapse functionality works smoothly on touch devices
- Filter controls properly wrap on narrow screens

### Performance Improvements Skipped
- Task #7: Virtual scrolling - Skipped. Current performance is excellent for the dataset size (~50 architectures). Virtual scrolling would add complexity without significant benefit for the current scale.

## [0.3.0] - 2026-02-14

### Performance Improvements Completed
- [x] Task #5: CSS-based filtering - **95% performance improvement on filtering operations**
- [x] Task #6: Extract data to JSON files - **-1MB initial JavaScript, lazy loading enabled**

### Changed
- Replaced DOM re-rendering with CSS-based filtering for search, segment, and brand filters
- Modified `render()` function to store filter metadata as data attributes on elements
- All architecture groups now render once and remain in the DOM
- Filtering now toggles `.hidden` CSS class instead of destroying/recreating DOM nodes

### Added
- New `applyFilters()` function for CSS-based filtering logic
- `.hidden { display: none !important; }` CSS utility class
- Data attributes on `.arch-group` elements for filter metadata:
  - `data-segments`: Comma-separated list of segment tags
  - `data-brands`: Comma-separated list of brand tags
  - `data-search-text`: Searchable text content
  - `data-gpu-segment`: GPU segment type (consumer/workstation/accelerator)
- Debounced search now calls `applyFilters()` instead of `render()`
- Dynamic data loading system with caching (`loadVendorData()` function)
- Three JSON data files in `js/data/` directory:
  - `intel-data.json` (11KB) - Intel CPU architectures
  - `amd-data.json` (12KB) - AMD CPU architectures
  - `amd-gpu-data.json` (9.1KB) - AMD GPU accelerators
- Loading indicators during data fetch
- Error handling for failed data loads

### Technical Details
- **css/styles.css line 14**: Added `.hidden` utility class for CSS-based filtering
- **js/script.js lines 702-720**: Added data attribute generation for CPU architecture filtering
- **js/script.js lines 847-855**: Added data attribute generation for GPU architecture filtering
- **js/script.js lines 980-1051**: New `applyFilters()` function with performance logging
- **js/script.js line 1129**: Updated search to use debounced `applyFilters()`
- **js/script.js lines 595, 612, 639**: Updated filter buttons to call `applyFilters()`
- **js/script.js lines 681, 821**: `render()` now calls `applyFilters()` after DOM creation
- Removed filtering logic from `render()` - now renders ALL items unconditionally
- Removed filtering logic from `renderGpu()` - now renders ALL GPU items unconditionally

### Performance Impact
**Before Task #5:**
- Search/filter caused full DOM re-render (300-500ms)
- Created/destroyed 1,500+ DOM nodes on every filter change
- Scroll position lost on filter
- Animations interrupted on filter
- Expand/collapse state required manual preservation

**After Task #5:**
- Search/filter uses CSS class toggling (<5ms)
- Zero DOM node creation/destruction for filtering
- Scroll position preserved automatically
- Animations never interrupted
- Expand/collapse state preserved automatically
- 95% reduction in filter operation time

### Benefits
- Instant filtering response (<5ms vs ~300-500ms)
- Scroll position preserved during filtering
- Expanded groups remain expanded during filtering
- Notes and links persist without special handling
- Smoother user experience with no DOM flashing
- Reduced memory churn from DOM manipulation

## [0.2.0] - 2026-02-14

### Added
- Comprehensive audit report saved to `docs/AUDIT-2026-02-14.md`
- Task tracking system for performance improvements
- CHANGELOG.md for tracking all changes
- DOM caching system (`initDomCache()`) to reduce repeated DOM queries
- Performance logging utilities (`perfStart()`, `perfEnd()`)
- Debounce utility function for search optimization
- Resource hints (preconnect) for Google Fonts CDN

### Changed
- Restructured from single HTML file to proper project structure
- Separated concerns: index.html, css/styles.css, js/script.js

### Performance Improvements Completed ✅
- [x] Task #1: Add search debouncing (300ms delay) - **90% improvement on search**
- [x] Task #2: Cache DOM query results - All critical paths now use cached references
- [x] Task #3: Add performance logging - `console.time/timeEnd` tracking render performance
- [x] Task #4: Optimize font loading - Added preconnect hints + display=swap

### Technical Details
- **js/script.js lines 410-453**: Added DOM cache and performance utilities
- **js/script.js line 669**: Added `perfStart('render')` at beginning of render function
- **js/script.js lines 682, 816**: Added `perfEnd('render')` at render exits
- **js/script.js line 1063**: Implemented debounced search with 300ms delay
- **index.html lines 7-9**: Added preconnect hints for fonts.googleapis.com
- Updated 8 functions to use cached DOM references instead of `document.getElementById()`

### Metrics
**Before optimization:**
- Search caused full re-render on every keystroke
- 1,500+ DOM nodes created/destroyed per search character
- Repeated DOM queries throughout application

**After optimization:**
- Search debounced to 300ms (12 keystrokes → 1 render for "architecture")
- DOM queries cached and reused
- Performance logging enabled for measuring improvements

## [0.1.0] - 2026-02-14

### Added
- Initial commit with CPU architecture roadmap HTML file
- Git repository initialization
- README.md with project documentation
- .gitignore for system files

### Notes
- Original single-file implementation preserved as `cpu-architecture-roadmap.html`
