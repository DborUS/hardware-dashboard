# Project State

**Living document.** Read after `CLAUDE.md`; update at the end of every working session.
This is how a new session picks up without re-deriving everything.

**Last updated:** 2026-10-07 (compact benchmark score column)
**Current version:** Public beta 0.0.4
**Previous release:** Public beta 0.0.3 (`fdf51f1`)
**Health:** October 7 captures hold 3,862 linked public results for 697 of
2,393 catalog products. SPEC contributes 3,642 system reports across reviewed
CPU2017/CPU2026 rate cohorts; MLPerf contributes 46 SUT results; Blender
contributes 174 medians. Offline source replay, catalog and registry checks,
46 importer/refresh regression tests, benchmark browser smoke, full dashboard
smoke and layout audit pass locally. Benchmark previews show no JavaScript
errors or horizontal overflow at 1440, 1024, 390 and 320px. Local validation does not establish the hosted workflow outcome.
Existing dashboard small controls and sidebar clipping were observed in the
layout audit. The benchmark page now also shows catalog CPU specifications
for all 645 scored CPU models; the latest benchmark and dashboard smoke tests
pass after this addition.

## 2026-10-07 — Add benchmark update to What's new

The dashboard's visible What's new history now leads with an October 7 entry
about the selected public benchmark results and the all-manufacturer entry
links and the compact CPU table score. Public beta 0.0.4 remains the
displayed version; this change does not claim the pending release is live.
Visitor copy stays in the pending update queue until publication is confirmed.

## 2026-10-07 — Integrate benchmarks into product views

Products, Architecture guide, and Benchmarks now sit together in vendor-local
navigation for AMD, Intel, NVIDIA, and Ampere. Every vendor Benchmarks tab
opens the default explorer with all manufacturers and no preset product line,
suite or CPU count. A CPU table score instead opens its exact model, test,
build and tested CPU count. The benchmark page links back to the current
product view, with a vendor/spec fallback for direct shared links. Ampere's architecture tab
opens a clear coming-soon guide in the dashboard, without an invented diagram.

CPU specification tables keep their original columns and append one compact
Benchmark column. Server CPU rows show a shorthand SPEC test, exact build,
tested CPU count and one score from a published system report; client CPU
rows show the Blender 5.2.0 mixed-compute rendering median. The score link
opens that model and test in the benchmark explorer. The generated index
covers 645 exact catalog CPU models and does not imply that a SPEC system
score is intrinsic to the CPU. Missing cells mean no result in the retained
snapshots. Its builder is part of refresh rollback, read-only checks and CI
validation. The dashboard smoke check verifies unfiltered vendor tabs and
model-specific score links. Direct shareable explorer URLs still restore
selected filters. The catalog builder now locates Product ID by its named
header, so the appended Benchmark column does not alter catalog identity.

Current checks passed: all 516 featured SPEC scores and source URLs match the
selected lower-middle published system report; generated index `--check`;
benchmark validation and refresh `--check`; dashboard browser smoke with no
JavaScript errors. An EPYC 9755 score link opened its 2026 integer v0.902.0
one-CPU model view at score 497. The new end column stays one line per row.
Earlier release checks also passed: generated index `--check`, benchmark source/catalog validation,
SKU order, benchmark browser smoke, dashboard browser smoke, refresh `--check`,
12 refresh transaction tests, and layout audit (no page overflow at tested
widths). Browser review confirmed the Ampere guide, a linked SPEC product
coverage result, and the return to Ampere specifications. Changes remain local;
no commit, PR, or deployment was made.

---

## 2026-10-07 — Audit enterprise benchmark score interpretation

Verified the SPEC CPU2026 Integer Rate v1.0.1 two-CPU source cache against
official report hashes and live ASUS, Compal, and Supermicro disclosures.
The 90 imported system reports represent 48 exact catalog CPU models in
this cohort. Linked Base scores match their disclosures. The chart ranks
one lower-middle report per model, so its order is a ChipIndex editorial
view rather than SPEC's system-report order or intrinsic CPU performance.
The page now labels the model chart and imported report list accordingly.
Benchmark validation, raw-cache replay, benchmark browser smoke, and full
dashboard smoke pass. Three importer unit cases that create temporary
workspace directories could not complete under the restricted runner
because that tmp directory denied writes.

---

## 2026-10-07 — Clarify SPEC Rate versus Speed

The enterprise workload choices now name Integer Rate and Floating-point Rate and display the exact SPECrate metric. The chart summary uses the metric key, and the workload description notes that SPECspeed is a separate single-task test on a different scale. This addresses confusion caused by comparing the dashboard throughput chart with the official SPEC Integer Speed search table. No scores or source rows changed. Benchmark and dashboard smoke checks passed locally.

---

## 2026-10-07 — Catalog CPU specs beside benchmark scores

The generated benchmark catalog projects CPU core, clock and applicable power
labels from each product's exact dashboard source record. It covers 1,988 CPU
products, including all 645 scored CPU models. Every scored CPU has a core
label; 644 have clock information. GPU records carry no CPU specs.

The benchmark page displays these as Catalog CPU specs in ranked results,
model tables, focus and peer cards, selected comparisons, and product coverage.
Chart labels stay short; accessible chart names include the specs. Links open
the matching product dashboard entry. Published model specifications remain
separate from SPEC system CPU count and enabled cores, which may differ from
nominal model cores. Intel client P/E clocks and base/max turbo power stay
distinct. Ampere frequency is not mislabeled base/boost; measured usage power
is not TDP. NVIDIA GB10 shows CPU-component cores without inventing a CPU
clock or assigning whole-package power to the CPU.

Checks passed: regenerated catalog and offline source replay, benchmark browser
smoke with exact source-backed AMD/Intel/NVIDIA examples and 320px layout,
full dashboard smoke, SKU ordering, and layout audit. The owner still handles
commit and publication under CLAUDE.md.

---

## 2026-10-07 — Benchmark production release candidate

The source import now searches available SPEC rate-result archives for exact
enterprise catalog CPUs. CPU2017 keeps two latest system disclosures per
model/CPU count plus prior verified reports; CPU2026 imports all reviewed
matched reports. 2017 uses SPEC-supported v1.0/v1.1 compatibility. 2026's
four test builds are separate filters, URL states and score scales. A narrowly
verified NVIDIA GB10 alias imports CPU-component reports for DGX Spark only.
Page rankings load 100 reports at a time; the chart shows top 25 model
representatives with Show all, search, table and source access preserved.
The workbench stays inactive until the snapshot and shared URL have loaded, so
an early click cannot replace a saved view.

MLPerf v6.0 now has 23 system submissions in each Server/Offline scenario,
seven catalog accelerators. Blender 5.2.0 has 129 CPU and 45 GPU medians.
Three importers support source-hashed retained input replay and explicit
online fetch; the coordinator backs up the snapshots and evidence before an
update and restores them if catalog or validation fails. `--check` works
without the large ignored SPEC HTML cache or network. The source directory
shows per-dataset count, scope and capture date; the retained registry also
records byte sizes and SHA-256 hashes. A visible coverage notice links to the
directory, and stale dates are called out.

The owner confirmed no PassMark public-display grant. Its standard subscription
restricts public benchmark ranking sites. OpenBenchmarking access/reuse remain
unverified (public requests returned 403), so both stay disconnected and their
status is disclosed. Source policy and comparison rules are in
`docs/BENCHMARK-PROGRAM.md`; schema and maintenance commands are in
`docs/DATA-SCHEMA.md` and `README.md`. `.github/workflows/benchmark-validation.yml`
provides read-only PR/push/manual gates, never a scheduled feed or publisher.
Do not commit or push from the sandbox; the owner reviews these files before
publication. Pending visitor copy remains in `docs/UPDATE-QUEUE.md`.

---


## 2026-10-07 — Benchmark review: client segments, labels and compact filters

Client CPU results offer All client, Desktop and Laptop views. All 112 CPU
records now carry `deviceSegments` and `deviceSegmentSource` from retained AMD
Form Factor / Intel ARK Vertical Segment fields. The counts are 82 desktop and
49 laptop, with 19 AMD models explicitly listed for both; 63 desktop-only and
30 laptop-only. The UI explains the overlap and that Blender medians pool
submitted systems, rather than distinguishing actual laptop/desktop test runs.
Future unknown or conflicting classifications remain under All with an explicit
unavailable source status. Import replay and snapshot validation re-read official
fields. Segments scope the chart, table, reports, core/vendor filters, comparison
and share URL (`segment=desktop|laptop`); changing segment clears old selections
and filters. Single-option Blender settings are hidden, with the version and
compute grouping retained beside the score.

Client and graphics descriptions now sit above a horizontal filter toolbar,
removing the empty column beside a tall stack of controls. AI scenario choices
use Request stream / Batch processing with official Server / Offline names below;
scenario identities, result attribution and URLs retain the official names.
Manufacturer options include disabled catalog vendors without imported results,
with a note explaining the selected snapshot's coverage. There are public NVIDIA
CPU reports, including an Arm-sponsored one-CPU GB10 SPEC2026 report
(`https://ftp.spec.org/cpu2026/results/res2026q2/cpu2026-20260210-00020.html`),
but the current exact-name-matched SPEC snapshots contain no NVIDIA CPU results.
This pass does not import that report or add scores. All 932 records, 277 scored
catalog products, and September 30 capture dates are unchanged.

Validation: Blender replay, snapshot and registry checks pass. Catalog output is
byte-identical (2,393 products / 2,414 placements / 277 scored); verification used
an in-memory threaded server because the stock single-thread catalog harness
intermittently refuses concurrent script requests. Full dashboard smoke passes
on rerun; layout audit completes with existing root-dashboard small controls and
sidebar clipping. Desktop, 1024px, 390px and 320px benchmark previews show no page
errors or horizontal overflow. Expanded benchmark smoke passes: segment counts,
source score/link identity, chart/table cohorts, combined filters, comparison,
URL reload/reset, invalid segment fallback, new scenario/vendor explanations,
and existing malformed-data states, with no JavaScript errors. Publication
remains pending in `docs/UPDATE-QUEUE.md`.

---

## 2026-10-07 — Benchmark explorer structure and source directory

The benchmark page now uses the AMD page’s black/charcoal surfaces and dark red
selection states. Its main flow is hardware type → workload → benchmark version.
Workload choices explain general compute, scientific compute, AI inference, or
rendering. The active score’s unit, direction, tested-system boundary, matched
model/report counts, and Last updated date remain near the controls. Filters sit
beside workload choices on desktop; 320–390px layouts stack without overflow.

Explore results, Product coverage, and Benchmarks & sources are separate keyboard
accessible sections. The collapsible model overview switches between a bar chart
with actual score units and a table of the same source-linked representatives,
report/submission counts, score ranges, and source links. Comparisons start empty;
up to three selections can be inspected via View comparison. Filters, comparisons,
baseline, display mode, and catalog selection survive URL sharing and reload.
The preexisting two-model CPU evidence view and scrollable system reports remain
available, with detailed conditions after the primary model chart.

The generated `js/data/benchmark-sources.json` directory identifies SPEC, MLPerf,
and Blender imported snapshots, and separately explains OpenBenchmarking/Phoronix
and PassMark access status. Neither additional source is connected. The new
`tools/refresh-benchmarks.py` provides status, registry generation/checks, existing
SPEC online import replay, retained-export Blender rebuild, and MLPerf source
audits. Validation failure restores the prior files. This pass leaves all 932
records, 277 matched catalog products, and September 30 capture dates unchanged;
it does not add a background updater or claim complete source coverage.

Validation: snapshot validation, generated registry checks, importer replay,
source-refresh rollback, and full dashboard smoke pass. The dashboard layout audit
completed; existing small root-dashboard controls remain outside this change.
The expanded benchmark smoke passes across all modes, chart/table source identity,
keyboard interactions, section/source navigation, URL/clipboard round trips,
attribution, malformed data, and 320px layouts. The test server now handles
parallel requests to avoid intermittent missing snapshot loads. The comparison
shortcut passed a focused check. Desktop/table/source screenshots and phone
layouts were inspected, with no page errors or horizontal overflow. Visitor-facing publication remains pending in `docs/UPDATE-QUEUE.md`.

---

## 2026-10-05 — Architecture guide discovery across product tabs

The Products / Architecture guide navigation is now visible on every AMD,
Intel, and NVIDIA product-line tab. The guide label names its scope: EPYC 9005,
selected Xeon 6, or GH200. Selecting a guide from another product line switches
to EPYC, Xeon, or NVIDIA CPU first, then opens the existing embedded atlas.
The guide panel and shareable route remain scoped to the corresponding product
line. The Products helper follows the active product line. The updated script
cache key ensures the change appears after deployment. Focused browser checks
passed for six cross-tab guide entries at 1440, 390, and 320px, including URL
reload and Products navigation. Full dashboard smoke and layout audit pass;
the layout audit still reports existing small controls and clipped sidebar
labels. Changes are local and pending publication in `docs/UPDATE-QUEUE.md`.

---

## 2026-09-30 — Expanded OEM platform compatibility

The local compatibility snapshot now has 224 distinct catalog CPU identities,
43 named systems, 749 exact CPU-to-system links, and 68 official source records
across Lenovo, HPE, Dell, Cisco, GIGABYTE, and HP Inc. The added systems span
rack servers, a multi-node compute sled, GPU servers, laptops, desktops, and
workstations. The compact 14px server icon stays beside the CPU model in the
existing spec table; table font and row dimensions are unchanged. Platform
details show socket and memory layout, physical form/size where sourced,
market or product code for fixed client configurations, and prominent OEM
configuration limits.

`docs/platforms/COVERAGE.md` and `ELIGIBILITY.json` define the current server
generation set: 272 catalog CPU identities, of which 208 have at least one
exact OEM system edge in this selected snapshot (AMD EPYC 77/115, Intel Xeon
124/140, AmpereOne 7/13, NVIDIA CPU modules 0/4). The 64 remaining identities
are unverified here, not known to be incompatible. Client and workstation
queues still need an OEM-inventory-based eligibility denominator. The
snapshot is a selective research index, not a complete compatibility matrix.

Four pinned research candidates feed `tools/build-platform-snapshot.py` under
`docs/platforms/PUBLICATION-MANIFEST.json`. Independent second-review notes
cover Lenovo, HPE, Dell, and client examples. Lenovo's 182 Intel rows retain
their exact SKU/system edge but do not assert CPU-count availability while the
configuration context is unresolved. Fourteen Dell candidate edges remain
held, including cooling and source-access questions; only 22 reviewed Dell
expansion edges enter the snapshot. HP's fixed regional client product codes
remain labelled as fixed configurations. Candidate rows are never published
automatically after a source file changes: the manifest pins their hashes.

`tools/build-platform-snapshot.py --check`, `tools/build-platform-coverage.py
--check`, and `tools/check-platforms.py` pass. The focused platform browser
check, full dashboard smoke, and general layout audit pass with no JavaScript
errors or document overflow. The platform browser check also verifies 9575F,
the newer HPE cooling note, an HP fixed laptop configuration, icon and table
row dimensions, phone dialogs, and comparison isolation. Screenshots were
visually reviewed at desktop and 390px phone widths. The layout audit still
reports existing clipped desktop sidebar text and small controls; at 320px,
the spec table correctly scrolls inside its container. Changes are local,
uncommitted, and pending publication; the visitor note remains in
`docs/UPDATE-QUEUE.md`.

Next: verify more OEM system lists for the 64 unmapped contemporary server
identities, adjudicate held thermal and quantity cases, expand current client
and workstation families beyond the initial nine added systems, and establish
an OEM source-refresh cadence.

---

## 2026-09-30 — Client CPU and graphics benchmark expansion

The Blender Open Data 5.2.0 snapshot now has 156 exact catalog matches from
its official grouped device-name export: 112 client CPUs and 44 graphics
products, up from 4 and 10. The CPU results include laptop-class models such
as Ryzen 9 9955HX and Core Ultra 9 290HX Plus. The importer requires at least
five submissions, a unique model match, and an exact catalog core count for
CPUs. It retains the 858-row source export and an exclusion audit. Nineteen
qualifying laptop GPU labels remain excluded because ChipIndex's GeForce
catalog does not list corresponding laptop SKUs; ambiguous memory variants
also remain unscored. The score means Blender rendering throughput, not an
overall CPU, gaming, or AI performance rating.

The benchmark page now says which workload each product view uses, links the
client and graphics test guide to Blender, and explains selected snapshot
coverage and laptop system variation. For the larger Blender cohorts, the
horizontal bar chart starts with the top 25 models and can expand to all;
search and the full scrollable ranking still expose every matched result.
The catalog now reports 277 products with any selected result out of 2,393.

`tools/import-blender-benchmarks.py --check`, `tools/check-benchmarks.py`,
`tools/build-benchmark-catalog.py --check`, `tools/smoke-benchmarks.py`, and
the full `tools/smoke-test.py` pass. The catalog builder now waits for the
asynchronous AMD renderer before reading its rows. The general layout audit
still reports dashboard clipping and small controls, then times out on an
Ampere card; the benchmark smoke check verifies the 320px layout and finds no
page overflow or JavaScript errors. Changes are local and pending publication;
the visitor update remains in `docs/UPDATE-QUEUE.md`.

---

## 2026-09-30 — GH200 guide and dated public beta history

The NVIDIA CPU tab now embeds the three-view GH200 architecture atlas. The
superchip, Grace CPU, and full GH100 GPU drawings use the same component-detail
pattern as the AMD and Intel guides, while preserving the distinction between
the full GH100 blueprint and shipping enabled-unit counts. The embedded view
and dashboard URL stay synchronized, and the iframe grows with the diagram.

The header advances to public beta 0.0.4. What's new has a scrollable history
with dates and short summaries for 0.0.1 through 0.0.4. The technical release
entry is in `CHANGELOG.md`; the visitor update remains pending in
`docs/UPDATE-QUEUE.md` until the site is confirmed live.

Browser review covered desktop and 320–390px widths, diagram navigation,
definitions, source links, product return, and the update history. The full
dashboard smoke test passed without JavaScript errors. Benchmark and OEM
platform work is still local and outside this release.

---

## 2026-09-30 — Model-first benchmark evidence expansion

The enterprise benchmark view now starts with a searchable CPU model picker.
For the selected SPEC release, metric, and one- or two-CPU system cohort, it
shows the lower-middle source-linked system result among that model's listed
reports, the report count and score range, the tested configuration, and a
peer ratio linked to both official disclosures. That number is one published
server result, not a processor average. The collapsible model chart uses the
same selected report; the scrollable ranking keeps every system disclosure.
The page asks what workload the user wants to compare and explains the test in
plain language. It retains the datacenter accelerator, client CPU, and
graphics views.

`tools/import-spec-benchmarks.py` imports fixed official publication windows:
CPU 2026 Q2 2026 and CPU 2017 Q4 2025, plus previously verified disclosures
outside those windows. Each accepted score is checked against its own official
report. The 2026 integer and floating-point snapshots each contain 49 reports
across 18 models, with 21 one-CPU and 28 two-CPU reports. CPU 2017 integer
contains 336 reports across 108 models (147 one-CPU, 189 two-CPU); floating
point has 310 across 106 (141, 169). The generated catalog now has 115 scored
enterprise CPUs and 135 scored products overall. CPU 2026 v0.902.0 is kept
separate from newer builds; CPU 2017 uses the reviewed v1.1.8/v1.1.9 group.
The 96 exclusions in `tools/spec-import-review.json` are 59 four-CPU rows,
35 CPU 2026 build mismatches, and two ambiguous model matches. The page
labels this as a selected ChipIndex snapshot and links to the full SPEC
indexes; missing results never imply zero performance.

The official-source import replay, benchmark validator, catalog rebuild
check, benchmark browser smoke, full dashboard smoke, and responsive layout
audit pass. UI checks cover model search, linked representative and peer
reports, score range, chart, filters, failure states, and 320px phone layout.
The pending visitor update is
in `docs/UPDATE-QUEUE.md`. Changes are local and not committed or published.
The layout audit still notes existing clipped sidebar text and a few undersized
dashboard controls at some widths, with no page overflow.

---

## 2026-09-30 — OEM platform compatibility pilot

Added a separate source-backed CPU-to-OEM-platform dataset and a compact server
icon beside model names in CPU spec tables. Search for `9575F`, open its
spec table, then choose the icon for an OEM summary and expandable named
system cards. Each card shows available chassis socket count, memory channels
per CPU, physical form, size, exact CPU-count/option restrictions, and the
official evidence. The icon does not select the CPU for comparison. CPU
rows without a researched match say so explicitly rather than implying
incompatibility.

The local seed has 12 catalog CPU identities, 14 platform models, 22 exact
links, and 17 official sources across Lenovo, HPE, Dell, Cisco, GIGABYTE,
and HP. EPYC 9575F has eight sourced systems across four OEMs. Other examples
include EPYC 9554, Xeon 6787P, seven AmpereOne X SKUs on one Gigabyte
system, an HP Ryzen AI laptop configuration, and a Lenovo Core Ultra tiny
desktop. Cisco and HP links are labelled as OEM-published fixed
configurations rather than interchangeable CPU options. The seven Gigabyte
QVL CPU rows were directly verified in an interactive browser on 2026-09-30;
the dynamic table is not exposed by a plain-text page fetch. The source's
displayed update date is June 28, 2026. The check is recorded in
`docs/platforms/AMPERE-RESEARCH.md`.

`docs/PLATFORM-COMPATIBILITY-PLAN.md` sets the Genoa-era server floor,
contemporary Intel/Ampere/NVIDIA and client scope, evidence gates, OEM
research workflow, and coverage metrics. `tools/check-platforms.py` validates
catalog identity joins, exact edges, references, and source domains. The
pilot remains deliberately sparse: an eligible-CPU denominator and broad OEM
inventory still need the next research phase. `docs/platforms/SOURCES.md`
is the source ledger. The visitor update is pending in
`docs/UPDATE-QUEUE.md`; no changes have been committed or published.

Validation so far: platform validator, JavaScript syntax checks, SKU order,
full dashboard smoke, and responsive layout audit pass. The layout audit
still reports pre-existing small filter touch targets and clipped sidebar
copy on some desktop views, with no page overflow. A focused platform browser
check covers the exact CPU path, comparison isolation, source expansion,
client/Ampere examples, and 390/320px dialog width.

After review of the first UI pass, the text action was replaced by a 14px
server icon. Browser measurements show the original model font and the same
31px desktop / 27px phone spec-row heights with the icon present; it adds only
18px to the model column. The focused browser test passes with explicit
row-height and width regression checks. A later full dashboard smoke run had
no JavaScript errors but failed three release-copy assertions that still
expect public beta 0.0.3 while the page now identifies 0.0.4.

---

## 2026-09-30 — GH200 inline term definitions

Final standalone-guide review: NVIDIA architecture sources support the GH200,
Grace, and full GH100 claims. Citation locators now cover the Grace core/cache
table and the H100 NVLink discussion; the superchip diagram says "processor
dies" to distinguish the CPU and GPU from their DRAM packages. Keyboard view
switches retain focus, keyboard selection moves focus to the selected-part
explanation, and the Hopper inset's SM targets are 56 × 44 px. The three
views render at phone through desktop widths without script errors or page
overflow. The guide remains an untracked local directory and has no entry
point from the dashboard's NVIDIA section; publishing it within ChipIndex
requires including that directory and adding a dashboard link. The broader
dashboard smoke flow still has the unrelated hidden-EPYC-subtab issue below.

The standalone `architecture/gh200/` guide now underlines defined technical
terms in the introduction, model notes, connection paths, scope text, source
notes, and both selected-part explanation columns. Each link opens its short
definition in the existing top-right notification style; SVG diagram labels
remain component controls. Added terms for the Grace and Hopper hierarchy,
cache levels, memory variants, GPU math units, and coherent interconnects.
The per-view acronym keys now expose the same accessible controls.

Term notifications stack without discarding earlier clicks. The newest card
shows its explanation, older cards compact, and an earlier-term control can
retrieve hidden cards. Each card has an independent 15-second progress ring,
countdown, close control, and keyboard dismissal. The stack fits phone
screens and can follow the visible portion of an embedded iframe. Inline
links and selected-part notes were checked in all three views, including a
390px phone viewport; the guide reported no browser errors. The visitor
update remains pending in `docs/UPDATE-QUEUE.md`. The full dashboard smoke
run did not complete: it timed out clicking a hidden EPYC subtab in the
dashboard flow, outside this standalone guide. Changes are local.

---

## 2026-09-30 — SPEC snapshot scope clarification

The enterprise CPU rankings now label their row count as ChipIndex results
and display a selected-sample note above the model chart. The note follows
the SPEC suite, integer or floating-point test, and one- or two-CPU cohort;
it links to the matching official full-results listing. It also explains
that filters narrow the local sample and the same CPU can have multiple
published system submissions. The model coverage label explicitly refers to
distinct CPU models in the ChipIndex snapshot cohort.

The four one-CPU CPU 2026 integer reports and six one-CPU CPU 2017 integer
reports are curated ChipIndex selections, not the entire SPEC archives.
[SPEC reports](https://www.spec.org/cpu2026/Docs/credits.html) over 51,000
published CPU 2017 results across the suite as of April 2026; that number
must not be described as an integer-rate total.
Expand official-result coverage through the reviewed import path in
`docs/BENCHMARK-PROGRAM.md`, counting submissions and matched chip models
separately. The focused benchmark browser smoke passes across both suites,
both metrics, one- and two-CPU cohorts, filters, official links, and phone
width. The full dashboard smoke and layout audit pass. The visitor update
remains pending in `docs/UPDATE-QUEUE.md`;
changes are local for Daniel's review.

---

## 2026-09-30 — GH200 component explanations

Expanded all 17 distinct selected-part definitions in the standalone
`architecture/gh200/` field guide. They now explain the Grace core →
SCF/cache → LPDDR5X route, Hopper SM → L2/controller → HBM route, and
Grace ↔ Hopper coherent NVLink-C2C path. The copy distinguishes the full
GH100 design from enabled H100 and GH200 products, and separates on-module
C2C from optional peer-GPU NVLink. The component panel can show multiple
targeted NVIDIA sources. Added a Grace memory-interface source, corrected
the GH200 architecture article year to 2022, and added GH100/H100 to the
Hopper acronym key.

The current and launch-era NVIDIA documents give different memory-capacity
figures, and their Grace L3 capacities conflict, so no unqualified capacity
was added. All selectable concepts rendered their definitions and source
links in the live three-view atlas. Desktop and 390px detail layouts showed
no overflow. JavaScript syntax and the full dashboard smoke test passed with
no browser errors. The visitor update remains pending in
`docs/UPDATE-QUEUE.md`. Changes are local for Daniel's review.

---

## 2026-09-30 — Model score chart and core-range grips

The benchmark page now opens with a collapsible, full-width vertical bar chart
above Ranked results. It uses the current test, manufacturer, core range, and
search filters. Each bar is the highest listed source-linked system or
submission result for one distinct vendor/model; the 0–100% scale is relative
to the highest model shown, and labels show actual scores. This does not turn
system results into chip-only scores. Angled model names and horizontal
scrolling keep the chart usable on phones. Activating a bar selects its exact
underlying result for the existing comparison, while the ranking retains all
individual records. The chart is expanded initially and can be collapsed.

The CPU core-range control now uses slim squared grip handles in place of
circles. The native 34px hit areas, endpoint alignment, keyboard control, and
sourced core stops remain in place. The visitor update remains pending in
`docs/UPDATE-QUEUE.md`. Focused browser checks cover chart data across SPEC,
MLPerf, and Blender, collapse/reopen, score-axis alignment, selection and
capacity feedback, 320px scrolling, and pointer/keyboard slider input. The
full dashboard smoke and layout audit pass. Changes are local for Daniel's
review.

---

## 2026-09-30 — Scrollable rankings and chart polish

Long Ranked results lists now scroll inside their chart panel, keeping the
title, update date, result count, explanation, and percentage axis visible.
An overflow cue appears only when scrolling is needed; the scroll region is
keyboard focusable in that state. Search and cohort changes return the list
to its top, while comparison actions preserve its position and focus. Short
result lists retain their natural height.

The core-range slider now matches the dashboard's flat track and knob style:
the rail and thumb centers align, the extra cyan glow is gone, and each knob
keeps a 34px interaction area with a visible keyboard focus state. Ranked
bars use flat fills without colored glow. A shared desktop score-column width
aligns the chart's 0–100% axis with the bars, including a mobile adjustment.
Focused browser checks covered the 16-row MLPerf Offline list, scrolling by
keyboard, comparison selection, filters, short two-result cohorts, and phone
overflow. The full dashboard smoke and layout audit also pass. The visitor
update remains pending in `docs/UPDATE-QUEUE.md`.
Changes are local for Daniel's review.

---

## 2026-09-30 — Benchmark manufacturer, core, and CPU-count filters

The benchmark page now filters the selected test by chip manufacturer. The
enterprise and client CPU views have a two-thumb core range that snaps to
sourced counts. SPEC uses enabled cores per CPU from each tested system's
disclosure; Blender client CPU rows use official product-specification counts
from the matching dashboard models. The range is hidden in accelerator and
graphics views. Filtering updates the coverage readout, ranked results,
chart scale, and selected comparison together.

Every SPEC 2026 and 2017 integer and floating-point snapshot now includes
two exact, official two-CPU disclosures: one AMD and one Intel. The CPU-count
selector offers 1 and 2, with separate cohorts and scales. Eight records were
added, raising the curated snapshot total from 65 to 73 without changing the
29 matched catalog products. The SPEC validator checks the source identities,
version compatibility, CPU counts, enabled-core arithmetic, and exact model
matches; the Blender core counts are checked against dashboard source specs.

`tools/check-benchmarks.py`, `tools/build-benchmark-catalog.py --check`, and
`tools/smoke-benchmarks.py` pass. The browser check covers both CPU counts,
manufacturer and core filtering, all workload views, comparisons, source
links, failure states, and 320px layout. Visual checks at 320px, 390px,
768px, and 1440px found no overflow. The visitor update remains pending in
`docs/UPDATE-QUEUE.md`; changes are local for Daniel's review.

---

## 2026-09-30 — Benchmark result recency and spacing

The Ranked results heading now shows **Last updated** for the selected
benchmark snapshot. It follows the current SPEC, MLPerf, or Blender view and
uses that dataset's retrieval or capture date. Invalid snapshots show
**Unavailable**. Its accessible description distinguishes ChipIndex's snapshot
date from the publication date of an individual benchmark report.

Spacing is moderately tighter across the benchmark hero, workload choices,
filters, chart panels, catalog, and method section. At 320px the four workload
choices use a two-column grid. Text sizes for scores and chart rows and control
hit areas were preserved. The Ranked results panel begins about 115px sooner
at 1440px and 286px sooner at 320px. Focused browser checks verified all eight
test views and the unavailable state. The benchmark and full dashboard smoke
tests passed. Desktop and phone visual checks found no horizontal overflow.
An earlier full layout audit passed, while two reruns after the final badge
type adjustment timed out waiting for the 320px Ampere architecture panel on
the main dashboard. The audit also notes pre-existing small controls and
clipped sidebar copy in some main-dashboard views.

The visitor update remains pending in `docs/UPDATE-QUEUE.md`. Changes are
local for Daniel's review; nothing was committed or published.

---

## 2026-09-30 — Datacenter benchmark expansion and catalog coverage

The dedicated benchmark page now starts with datacenter CPUs and accelerators.
Datacenter CPUs can switch between SPEC CPU 2026 and 2017, then integer and
floating-point base-rate tests. Each test explains its workload; suites and
metrics keep separate rankings, scales, and comparisons. The new CPU 2026
snapshots contain four exact one-CPU system disclosures for each metric.
Datacenter accelerators can switch between MLPerf® Inference v6.0 Server and
Offline scenarios for a fixed Closed/Available Llama 2 70B 99% cohort. Each
scenario retains 16 published whole-system, eight-accelerator SUT records
across six exact ChipIndex SKUs, with result IDs, submitters, configurations,
and official links. B300 awaits a separate catalog alias review. Client CPUs
and graphics retain the selected Blender rendering views.

The generated `js/data/benchmark-catalog.json` indexes every displayed
non-roadmap specification row: 2,414 placements but 2,393 distinct source SKU
identities. It collapses 15 repeat EPYC placements and six AMD SKUs shared
between EPYC and Ryzen tabs, while preserving distinct product IDs for four
same-name Ryzen variants. Its all-product lookup shows 29 products with a
result in the current seven snapshots, search and product-type filters, exact
score drilldowns, source links, and an explicit no-selected-result state.
Commercial release status remains unverified. The 2,393-product denominator
describes the dashboard index, not eligibility for any one benchmark.

`tools/build-benchmark-catalog.py --check` rebuilds the index from rendered
dashboard rows and verifies every source pointer. `tools/check-benchmarks.py`
validates the seven snapshots, 65 records, exact catalog matches, cohort
rules, and index counts. `tools/smoke-benchmarks.py` covers all benchmark
switches, catalog counts and search, source links, ratios, malformed-data
states, and 320px layout. These checks passed, as did the full dashboard
smoke test, JavaScript syntax check, and responsive layout audit. The audit
still notes pre-existing small touch targets and clipped sidebar copy on
some dashboard views, with no horizontal overflow. Desktop and phone
screenshots were reviewed; the catalog attribution spacing was corrected.

The [benchmark program plan](BENCHMARK-PROGRAM.md) records source policy,
coverage gaps, and the next milestones: broader official datacenter result
ingestion, reviewed test-specific denominators, and deeper client/graphics
coverage. The visitor update remains pending in `docs/UPDATE-QUEUE.md`.
Changes are local and ready for Daniel's review; nothing was committed or
published.

---

## 2026-09-30 — Enterprise benchmark metric selector

The Enterprise CPUs view adds visible Integer throughput and Floating-point
throughput buttons. Each has a brief explanation of its SPEC CPU 2017 workload:
integer rate runs concurrent copies of 10 programs such as compilation,
compression, and route planning; floating-point rate runs concurrent copies of
13 programs such as fluid dynamics, molecular dynamics, and weather modeling.
Higher scores mean more work completed per unit time. The views use separate
scales and result lists; switching clears the current search and comparison.
Client CPU and graphics views still show Blender rendering only, with an
explanation of that test.

`js/data/enterprise-benchmark-sample.json` has six one-CPU system results for
`SPECrate2017_int_base`. The new
`js/data/enterprise-benchmark-fp-sample.json` has five one-CPU system results
for `SPECrate2017_fp_base`: two EPYC, two Xeon, and one Altra Max. No exact,
source-verified floating-point result was found for AmpereOne A192-32X, so it
remains unscored in that view. Integer and floating-point results for the same
CPU can come from separate SPEC disclosures and different configurations,
including SMT or memory changes. Each metric is compared only within its own
CPU-count cohort; the chart describes tested systems, not intrinsic chip speed.

The visitor update remains pending in `docs/UPDATE-QUEUE.md`. Browser checks
confirmed six integer and five floating-point results, metric-specific source
links and charts, comparison reset on metric change, the Blender views, and no
horizontal overflow at 390px or 320px. The full `tools/smoke-test.py` passed
with no JavaScript errors; `tools/audit-layout.py` completed. The latter
continues to report existing small touch targets and clipped sidebar copy on
some main-dashboard views, while reporting no horizontal overflow. Changes
are ready for Daniel's review; nothing has been committed or published.

---

## 2026-09-29 — Public benchmarking prototype

Added a dedicated `benchmarks/` page, linked from the product dashboard header.
It follows the ChipIndex dark visual system and offers interactive, source-linked
rankings and three-model comparisons with a selectable baseline. The follow-up
adds an enterprise CPU view for published SPEC CPU 2017
SPECrate2017_int_base system results beside the original client CPU and GPU
Blender views. Visitors can search within each group. Returning to Products
restores the previous dashboard URL, including vendor, tab, and filter state.

Enterprise scores are tested-system throughput results, not isolated processor
performance claims. The sample contains one-CPU systems and shows the original
result page, system, CPU count, and test configuration. Only results with the
same metric and socket count belong in a direct chart comparison. Platform,
memory, compiler, and test settings still differ between published systems.
The enterprise sample is deliberately limited; an unlisted ChipIndex model has
no assigned benchmark score.

The rendering views read `js/data/benchmark-sample.json`, a dated snapshot of 14
Blender Open Data 5.2.0 grouped median scores. Every entry is mapped to an exact
ChipIndex model name, has at least five public submissions, and links to a
version- and device-filtered source query. The source groups operating systems
and compute backends, so the page labels ratios as exploratory comparisons of
community medians. Models absent from the sample are not assigned scores.

Browser checks now cover enterprise/client/graphics switching, six enterprise
source links, dated disclosures, system-configuration expansion, search,
selection, baseline ratios, and 390/320 px enterprise layouts without
horizontal overflow or JavaScript errors. The full dashboard smoke test passed
on its traced rerun after an initial timing-only home-page visibility timeout;
the responsive layout audit passed. The audit waits for an Ampere card before
measuring narrow views. Changes remain local; no commit or push. The visitor
update is pending in `docs/UPDATE-QUEUE.md`.

---

## 2026-09-28 — Public beta 0.0.3 release preparation

Before this update, the latest commit on `origin/main` was public beta 0.0.2.
The header and What's new dialog now identify 0.0.3. The new release notes
describe the selected Xeon 6 architecture guide and the revised EPYC
9005 guide as changes since 0.0.2. Ampere, roadmaps, and Xeon family
corrections remain recorded under the earlier 0.0.2 release.

The 0.0.3 changes passed the full dashboard smoke test, both guide
regressions, the responsive layout audit, JavaScript syntax checks, and
`git diff --check`. No commit or push was made in this session.

---

## 2026-09-28 — AMD EPYC 9005 guide alignment and final diagram review

Integrated the reviewed AMD visual proposal into the dashboard's EPYC
architecture guide. The guide now has an explanation above the diagram,
consistent model headers and typography, a collapsible acronym key, and a
source library naming the AMD architecture white paper and supporting EPYC
9005 datasheet. Acronym definitions appear in a compact top-right dashboard
stack, retain independent 15-second timers, can be closed with Escape or the
close button, and clear when the user returns to Products. The standalone
preview was kept in sync.

The NUMA diagram now switches between Zen 5 and Zen 5c examples: each NPS=4
domain has three I/O-die DDR5 controllers and up to four Zen 5 or three Zen 5c
CCDs. The protection diagram now shows the Secure Processor, ROM, loader,
BIOS, and core startup in order. Separate branches describe key management,
memory encryption, and guest protection; RAS shows detection/correction and
poisoning/reporting of uncorrectable errors. Socket and I/O lane labels
qualify maximums. Related connection and protection capabilities are
selectable beneath their diagrams, with the same sourced detail panel.

Validation: the expanded EPYC guide regression, Xeon guide regression, full
dashboard smoke test, and responsive layout audit pass. Browser screenshots
of the integrated desktop guide, both NUMA modes, protection, sockets, and
the term stack were reviewed. No commit or push was made; the revised EPYC
visitor update remains pending in `docs/UPDATE-QUEUE.md`.

---

## 2026-09-28 - EPYC guide channel counts and definitions

The two-socket EPYC 9005 diagram now shows twelve DDR5 channel marks per
processor (six on each side), matching the 24-channel header. The one-socket
view remains at twelve. All 51 short selected-component definitions were
reviewed and rewritten to identify the part or function before explaining its
purpose. Zen 5c is now distinguished from a Zen 5c CCD; the latter is a
densely packed compute chiplet. Floating-point, cache, SERDES, GMI, security,
and NUMA descriptions were clarified. The embedded guide cache tag advanced.

The separate AMD visual-alignment preview acquired a source-backed term key
with full NPS, SEV-ES, and SEV-SNP entries. Its Zen 5c clock comparison was
qualified to the EPYC 9005 model lineup and linked to the AMD processor
datasheet as a supporting source. Its later dashboard integration and NUMA
and boot-flow corrections are recorded in the section above.

Verification: all 219 preview diagram targets passed, the focused glossary
and 24/12-channel checks passed, the EPYC guide regression passed, and the
full dashboard smoke test passed with no JavaScript errors. The pending
visitor update was revised. No commit or push was made.

---

## 2026-09-28 — Xeon 6 architecture guide integration

Added the finished four-view Xeon learning atlas under Intel → Xeon → Architecture
guide. The dashboard introduction identifies its physical-diagram scope as selected
Granite Rapids 6900P/6700P/6500P and Sierra Forest 6700E platforms; Xeon 6+ is
family context only. It links the Intel product brief, HPC tuning guide, and RAS
paper by title. The Xeon 6 timeline group offers a contextual guide entry.

The isolated guide at `architecture/xeon-6/` retains the standalone diagrams,
definitions, source library, and independently timed acronym notices. Embedded
styling hides only its duplicate masthead and hero. The iframe reports its
height, view, and mode to the dashboard. URLs restore `panel=guide`,
`guide=xeon-6`, `diagram=VIEW`, and valid `mode=MODE`; switching back to Products
keeps search and filters. Guide navigation is limited to the Intel Xeon tab.
The standalone atlas project remains unchanged. CSS, script, data-fetch, and
embedded-atlas cache tags were advanced together. The 0.0.3 release labels
this guide for visitors.

Verification: JavaScript syntax checks, the full dashboard smoke test, the
responsive layout audit, and the existing EPYC guide regression pass. The new
Xeon guide regression passes 35 checks, including deep links, view/mode changes,
acronym stacking, product-state return, iframe height, and 390/320 px phone
overflow and diagram panning. Desktop and 390 px guide screenshots were reviewed.
No commit or push was made; the visitor update remains pending in
`docs/UPDATE-QUEUE.md`.

---

## 2026-09-28 — Public beta 0.0.2 release review

The shared header and What's new dialog now cover the new Ampere Computing tab,
manufacturer-sourced announced roadmaps, corrected Xeon 6 family and core-design
lookup, and refined EPYC 9005 socket diagrams. The release text describes changes
since 0.0.1. CSS, JavaScript, and runtime JSON use the same cache version.

The release includes the dashboard's Ampere source data, roadmap ledger, Xeon
correction, guide changes, and their checks. The separate Xeon learning projects
are outside this repository and are not part of this release. The README now
reflects four vendors and ten product tabs. Pending visitor updates remain in
`docs/UPDATE-QUEUE.md` until the owner confirms the site is live and the New
update block has been posted.

Verification: `tools/check-order.py`, AMD and Ampere generated-data checks,
`tools/smoke-test.py`, `tools/test-epyc-guide.py`, and `tools/audit-layout.py`
pass. The smoke test reports 350 EPYC, 736 Ryzen, 303 AMD GPU, 553 Xeon,
340 Intel Client, 35 Intel Graphics, 71 NVIDIA, and 26 Ampere models, with
no browser JavaScript errors. The layout audit reports no page-level overflow
at its checked desktop and phone widths.

---

## 2026-09-28 — Xeon 6300P family correction

Intel's [6300-series support article](https://www.intel.com/content/www/us/en/support/articles/000100193/processors/intel-xeon-processors.html) identifies the nine Xeon 6 6300P models as Raptor Lake-E Refresh. The [6377P ARK page](https://www.intel.com/content/www/us/en/products/sku/246153/intel-xeon-6377p-processor-36m-cache-3-100-ghz/specifications.html) confirms Intel 7 and FCLGA1700. These are distinct from Intel 3 / FCLGA4710 Granite Rapids SP. The old ARK assignment rule folded both sockets into SP, and the Xeon 6 card repeated that error.

The assignment rule now routes 6300P to Raptor Lake-E Refresh and leaves only LGA4710 parts in Granite Rapids SP. The nine models have their own Xeon 6 card; SP falls from 43 to 34 models, while the Xeon total remains 553. The ARK-derived runtime JSON, research master, and comparison details were updated. The separate card has 1P and Intel 7 labels, and the broader era label now covers entry-server Xeon 6. The pending Xeon visitor update was revised. Syntax, ordering, data conservation, and the full browser smoke test pass with no JavaScript errors (31 Xeon cards, 553 models). Changes are local; no commit or push.

---

## 2026-09-26 — Intel Xeon 6 core design lookup

The Intel Xeon cards now show the core microarchitecture beneath their
processor codename: Granite Rapids uses the Redwood Cove P-core design,
and Sierra Forest uses the Crestmont E-core design. This relationship is
sourced to Intel's [affected-processor model table](https://www.intel.com/content/www/us/en/developer/topic-technology/software-security-guidance/processors-affected-consolidated-product-cpu-model.html).
It identifies core names that do not appear as separate product codenames
or SKUs in ChipIndex. The expanded card links to the Intel source.

Intel card search and cross-vendor search index these names. Searches for
`Redwood Cove` show the four Granite Rapids cards; `Crestmont` shows the
Sierra Forest SP card. Intel's [current Xeon 6 E-core catalog](https://www.intel.com/content/www/us/en/products/details/processors/xeon/6-e-core-series.html)
lists 6700E Sierra Forest SKUs but no 6900E. Its [288-core 6990E+](https://www.intel.com/content/www/us/en/products/sku/246074/intel-xeon-6990e-processor-576m-cache-2-20-ghz/specifications.html)
belongs to Xeon 6+ Clearwater Forest. The former zero-spec Sierra Forest
AP/6900E card was therefore removed from the active released timeline;
no replacement SKU claim was invented. Existing SKU specifications and
ordering remain unchanged. The Intel renderer, shared search, card styles,
smoke assertion, and asset cache tags were updated. The update queue entry
remains pending until the owner confirms it is live.

Verification: JavaScript syntax checks, `tools/check-order.py`, and the
full `tools/smoke-test.py` pass with no JavaScript errors. The responsive
layout audit exits successfully and reports no horizontal overflow.
Changes are local; no commit or push was made.

---

## 2026-09-26 — Manufacturer roadmaps

Added 18 announced roadmap entries across eight product tabs: AMD EPYC,
Ryzen, and GPU; Intel Xeon, Client, and Graphics; and NVIDIA Data Center and
CPU. Each section leads its tab as a collapsible unreleased group with
individual product cards and direct manufacturer collateral. A source ledger
and exclusions are recorded in `docs/specs/manufacturer-roadmap-sources.md`.
The entries remain outside released model totals, filter chips, and comparison.
No GeForce roadmap group appears because no named future product was supported
by NVIDIA collateral at review time.

Removed the speculative Intel Xeon 7 and Core Ultra Series 4 labels and the
unsupported Diamond Rapids HBM variant from the released-product timeline.
The sourced Intel roadmap now uses Diamond Rapids, Coral Rapids, and Nova Lake
with only timing that Intel stated. The full browser smoke test passes,
including roadmap placement, official links, expansion, and unchanged released
model totals; ordering and responsive layout audits pass with no overflow.
Desktop and 390/320 px phone screenshots were reviewed, and the roadmap
subtitle and timing badge contrast was refined. Changes remain local and
uncommitted pending owner review and publication.

---

## 2026-09-26 — Ampere Computing processor tab

Added Ampere Computing as a fourth vendor tab using the established product
timeline, core range, filter chip, specification table, search, comparison,
source, and shareable URL patterns. Its five families contain 26 published
model rows: AmpereOne M (6), AmpereOne (7), Altra Max (5), Altra (7), and
eMAG 8180 (1). Announced AmpereOne MX and Aurora appear in a separate roadmap
group because no model-level specifications are published. The data excludes
cloud-provider and partner processors. Official Ampere product documents are
linked from the tab and recorded in `docs/specs/ampere-sources.md`.

The source master separates measured usage power from eMAG's TDP, preserves
frequency qualifiers, and generates both the runtime tab data and normalized
comparison entries. Search, filter, URL restore, source links, cross-vendor
comparison, and keyboard controls are covered in the smoke test. The data
builder check and ordering check pass. The layout audit found no new horizontal
overflow at 1440, 1024, 390, or 320 px; expanded specification tables scroll
within their panels on phones. Fresh desktop and phone screenshots were
reviewed. The update is local and awaits owner review; no commit or push.

A follow-up visual review set Ampere's primary accent to `#fe4943`, stacked the
header and four-way switcher before they crowd the logo, and corrected an
intermediate-width byline/status overlap. Cards now preview a real model and
keep the spec toggle clear on phones. Source notes are easier to read, long
tables and phone comparisons show sideways-scroll cues, and the phone
comparison gives product values more room. Model selection has a keyboard
button with a pressed state. The sidebar, phone specification table, and
comparison views were checked visually after these changes.

The announced roadmap now leads the Ampere timeline as an expandable,
Xeon 7-style unreleased group. MX and Aurora have individual cards with direct
official collateral links. The hatch and badge use Ampere's `#fe4943` accent.
Roadmap entries stay outside released family/model totals, filters, and
comparison. Collapsed Ampere groups keep their hidden cards and links out of
keyboard navigation. The full browser smoke test passed with no JavaScript
errors; desktop and phone screenshots were reviewed. The responsive layout audit
passed at 1440, 1024, 390, and 320 px with no Ampere overflow. The revised
view is open in the sidebar; changes remain local and uncommitted.

---

## 2026-09-26 — EPYC 9005 socket topology routing

Updated the one- and two-socket architecture diagrams from AMD white paper
pp. 11–12. The 1P view centers the single-socket title and traces each G and P
SERDES group to PCIe Gen 5 (64 + 64 lanes). The 2P view illustrates three
G groups per CPU carrying intersocket Infinity Fabric, with the remaining G
group and all P groups routed to PCIe (16 + 64 lanes per CPU, 160 per server).
The specific G numbering is labeled illustrative; the diagram also notes the
four-link fabric alternative. Individual SERDES tiles now have selectable
definitions. The embedded guide URL uses a new version tag so the update is
loaded after publication.

Reviewed desktop renders of both socket modes. The EPYC guide regression,
full dashboard smoke test, and layout audit pass with no JavaScript errors
or new page overflow. The existing pending Architecture guide visitor update
was revised. Changes are local and await owner review; no commit or push.

---

## 2026-09-25 — Public beta 0.0.1 release notes

The shared header now says public beta 0.0.1 and offers a What's new button at
the top right. Its accessible dialog summarizes the visitor-facing changes
since Tuesday, September 22, grouped into six short topics: EPYC
architecture, cross-vendor search, comparisons, readability, Intel theme, and
EPYC pricing. It opens on demand and closes with the button, Escape, or the
backdrop. The prior guide file's extra EOF blank line and the update queue
template's trailing spaces were cleaned up after the preceding push.
The full dashboard smoke test, EPYC guide regression, JavaScript syntax check,
and responsive layout audit pass. The pop-up was visually reviewed on all three
vendors, at the 1024/920/900 px header breakpoints, and at 390/320 px phone
widths without horizontal overflow. The new version and release notes remain
local until the owner publishes them.

---

## 2026-09-25 — EPYC guide source and diagram polish

The AMD EPYC Architecture guide now names and links the exact source title,
“5th Gen AMD EPYC™ Processor Architecture,” beside its introduction. The
standalone atlas header and footer use the same title. The one- and two-socket
diagram metric badges have more room for their labels. Cache versions were
advanced so the dashboard stylesheet and embedded diagram update together.
The visitor update remains in its existing Pending publication entry. The
EPYC guide regression (including badge clearance and phone overflow), full
dashboard smoke test, and responsive layout audit pass; desktop and phone
renders were reviewed. The owner will review and publish the local changes.

---

## 2026-09-25 — EPYC guide publication cleanup

Removed the Working together panel and all annotation features from the
deployed EPYC 9005 guide: the dashboard note/share toolbar, the atlas note
overlay, browser note storage, add/edit/delete actions, project import/export,
and reset. The How to read this model panel now spans the available width.
All eight diagrams, component hover names, selected highlights, definitions,
Zen 5 / Zen 5c and socket switches, direct links, and frame resizing remain.
The original separate atlas project was not edited.

The full dashboard smoke test, JavaScript syntax check, layout audit, and
`tools/test-epyc-guide.py` pass with no new overflow or JavaScript errors.
Fresh desktop and phone renders are in the atlas-dashboard-plan review folder
as `implementation-no-notes-*.png`. The pending visitor update was revised;
this change remains local and unpublished.

---

## 2026-09-25 — EPYC 9005 architecture guide integrated

Added an AMD EPYC-only Products / Architecture guide section row below the
product toolbar. Products remains the default. The guide is explicitly scoped
to EPYC 9005 / Zen 5, and the EPYC 9005 product series has a contextual
Explore architecture entry. Other vendors and AMD product lines stay on
Products. The product renderer remains mounted when the guide opens, preserving
search, filters, core range, expansions, and comparison selections on return.

The eight-model atlas is deployed at `architecture/epyc-9005/index.html` in an
isolated same-origin frame with a compact ChipIndex appearance. Dashboard
buttons initially added notes and imported/exported project files; those
features were removed later the same day for web publication (see above).
The original standalone atlas is unchanged.
Guide and diagram direct links use `panel=guide`, `guide=epyc-9005`, and
`diagram=ID`. The guide resizes its frame to content height, while diagrams
pan horizontally on narrow screens. The header links to AMD’s 5th Gen EPYC
white paper.

Verified JavaScript syntax, the AMD ordering check, the full dashboard smoke
test (all counts intact, zero JavaScript errors), the layout audit (no new
overflow), and `tools/test-epyc-guide.py`. The guide test covers all eight
model definitions, note import/export, direct links, product-state return,
vendor exit, unknown IDs, and 390/320 px layouts. Browser renders are in the
atlas-dashboard-plan review folder named in the proposal entry below. This
change remains local; no commit or push was made.

---

## 2026-09-25 — EPYC architecture guide proposal

Prepared a review plan and browser renders for adding the EPYC 9005 architecture
atlas under a new AMD EPYC “Architecture guide” section row. The proposal keeps
Products as the default, gives the atlas the full content width, and clearly
limits its scope to EPYC 9005. The plan and renders are in
`C:/Users/dbor/.codex/visualizations/2026/09/24/01a0d118-251d-7503-a9db-3a7c099418cc/atlas-dashboard-plan/`.
This proposal was implemented later on 2026-09-25; see the integration entry
above.

---

## 2026-09-23 — Specification table typography

Raised CPU and GPU specification table headers and values by another 5%,
including their phone sizes and the GPU form-factor cell override. Kept the
existing table padding and horizontal scrolling. Revised the pending
readability update rather than adding another announcement entry. Checked
rendered EPYC, Intel Xeon, and NVIDIA table sizes at desktop width and EPYC at
phone width without page overflow; the full browser smoke test passed with no
JavaScript errors.

---

## 2026-09-23 — Cross-vendor comparison alignment

The comparison dialog now puts shared specifications from the maintained vendor
product records on the same rows across manufacturers. Original vendor-specific
fields remain in an additional-details section. The lazy comparison dataset now
includes newer Intel products that lack an ARK CSV export, using the maintained
cross-vendor master only for Intel entries absent from intel-master.csv. The
AMD and NVIDIA vendor masters remain authoritative for their products.
The browser smoke test (including a shared CPU-core row assertion), ordering
check, and JavaScript syntax check pass. EPYC 9536 and Xeon 6990E+ were
checked directly for cores, threads, clocks, cache, power, socket, and memory
channels in the regenerated comparison data.

---

## 2026-09-23 — Card and spec header readability

Raised the text inside product cards and the metadata above specification
tables by another 5% after review of the EPYC screenshot. The change covers
card title, description, silicon label, and tag text, plus the spec header
title, product path, and source line. Mobile card overrides were raised as well.
Desktop and phone EPYC views show no page overflow, and the full browser smoke
test passed with no JavaScript errors. The pending readability update was
revised rather than duplicated.

---

## 2026-09-23 — Comparison table layout

The comparison dialog now sizes its columns by the number of selected products,
wraps long values within their cells, and lets the sticky specification column
reach the scroll edge. This prevents values from appearing beneath row labels
or leaking into the left gutter during horizontal scrolling. Chromium also
needed a separate painting layer for pinned row labels so product values stay
behind them. The full browser smoke test passed, and the dialog was visually
checked at 840px with two and four selected products.

---

## 2026-09-23 — Readability pass

Raised every small CSS font size at or below 0.8rem by 15% across the shared
dashboard, including responsive overrides. Specification and comparison table
cell padding grew by roughly 7%. At phone width, the four toolbar actions now
form a two-column grid so the enlarged labels remain on one line. Verified
desktop AMD, Intel, and NVIDIA views plus an open EPYC specification table at
desktop and phone widths without page overflow; a 320px phone viewport also
showed no clipped toolbar labels. The full browser smoke test and layout audit
passed with no JavaScript errors. Added a pending visitor update.

---

## 2026-09-23 — Intel dark theme

Replaced the Intel tab's pale page and control surfaces with dark navy, using
blue for selection and cyan for platform landmarks. Comparison tray and dialogs
now use the same palette. Kept the existing layout and generation colors. Added
the visitor-facing change to the pending update queue. Desktop and phone-width
screenshots were reviewed; the browser smoke test and layout audit passed.
Restored the shared Clear Selections toolbar button on Intel; its existing
handler clears cross-vendor comparison picks and selected rows.

---

## 2026-09-23 — Global search beacon

The shared search bar now indexes product records across all nine AMD, Intel,
and NVIDIA tabs when a visitor searches. Matching vendor and product-line tabs
receive the selected beacon glow without a count badge. A route below the bar
jumps to a matching tab while preserving the query; a manual vendor or
product-line switch also keeps the query. The current tab retains its local
search highlighting and filters. The index is built from the maintained runtime
data and renderer taxonomies, then cached for the page session. Added a pending
entry in `docs/UPDATE-QUEUE.md`.
After review at a narrow sidebar width, the large vendor glow was reduced to
an inset ring and small point. Inactive matching product tabs use a small
amber dot, selected AMD tabs use a stronger red fill, and keyboard focus stays
inside the tab boundary. The broad-query route presentation is under review
before any further UI change.
Fixed a search correctness issue: punctuation normalization had joined adjacent
spec values, so "MB 300 W" looked like "B300" and marked AMD and Intel tabs as
matches. Global indexing now checks each field separately, and local matching
keeps words separate. The browser smoke test confirms B300 returns only NVIDIA
Data Center, with no visible AMD result; the full smoke test passes.
Verified routes for a sample from each of the nine tabs. Browser checks covered
cross-vendor jumps, query persistence through manual tab changes and URL reload,
clearing search, and phone-width overflow. The full smoke test and layout audit
passed with no JavaScript errors.

---

## 2026-09-23 — EPYC pricing in specification tables

AMD's 183 published EPYC 1kU prices now flow from `amd-master.csv` into
`amd-cpu-specs.json` as formatted USD values. The EPYC table displays **1kU
Price** immediately before Product ID; models without a published price show
a dash. Ryzen and GPU source records have no prices, so their tables are
unchanged. Added a pending visitor-facing entry in `docs/UPDATE-QUEUE.md`.
Verified all 183 prices exactly match the master CSV, the browser smoke test
checks the rendered column and sample values, and the layout audit passed.
Updated `tools/amd-v2-renderer.js` to preserve the existing disclosure wrapper
when the AMD renderer is regenerated.

---

## 2026-09-23 — Update tracking workflow

Added `AGENTS.md` and `docs/UPDATE-QUEUE.md` so future work sessions record
visitor-facing changes as they happen. Entries stay pending until the changes
are live and their **New update** announcement is posted or declined. This is
separate from the technical `CHANGELOG.md`. No dashboard behavior changed.

---

## 2026-09-21 — ChipIndex header identity

Replaced the visible per-tab product title in the top header with the approved
`ChipIndex by Dan Bor` wordmark. The lockup uses a white italic display name, smaller
monospace attribution, magenta/cyan signal line, and `PUBLIC BETA 0.0.0` below it.
The product-line title remains in `#pageHeader` for assistive technology while the
segmented control immediately below continues to identify the visible product line.

The wordmark is CSS/HTML rather than a raster image, so it stays sharp and reflows at
the existing 900px and 640px breakpoints. It scales down on medium screens; at phone
width it moves above the vendor selector, while on desktop it occupies the former
product-title position. The Intel theme
uses its dark navy text token for contrast on the pale background while preserving the
same magenta/cyan signal line.

Verified with the full browser smoke test across all nine AMD/Intel/NVIDIA tabs:
baseline counts preserved, no JavaScript errors. Layout audit at 1440 / 1024 / 390
reported no horizontal overflow. Its clipped-text list now includes the intentionally
screen-reader-only dynamic product descriptions; screenshots confirm the visible logo
and page chrome are not clipped.

Files changed: `index.html`, `css/styles.css`, `docs/PROJECT-STATE.md`.

---

## Start here — first 5 minutes of a new session

1. **Read `CLAUDE.md`, especially "Working efficiently here."** It has the sandbox
   pitfalls that cost the most time. Don't skip it to save tokens; it pays for itself.
2. **Ask Daniel whether the tree is committed** before editing. If the header above says
   uncommitted, get that landed first — a day's work in an uncommitted tree is fragile.
3. **Set up verification** (`docs/WORKFLOWS.md` Workflow 0, ~3 min) and run
   `python3 tools/smoke-test.py` to confirm the baseline *before* changing anything.
   If it already fails, say so rather than layering changes on top.
4. **Don't re-audit.** Known issues below are current and were verified by running the
   code, not by reading it. Items marked "won't fix" or "reviewed" are decided.

**Cadence that worked:** small, verified increments. One change → smoke test →
screenshot → tell Daniel what changed and what was verified → he commits. He'll happily
go several rounds; he does not want a large unverified batch.

**How Daniel works:** he spots real problems from the rendered page and asks *why*, not
just for a fix. Explain the cause, classify it (cosmetic vs correctness), offer options
with a recommendation, then implement the one he picks. He pushes back when a path looks
wrong — he's usually right, so re-check rather than defend.

---

## Verified baseline

Intel measured 2026-09-10; AMD rebuilt from official CSV exports 2026-09-21.
**Model counts are the load-bearing assertions** — they are what catches a
restructure silently dropping data.

| Check | Value |
|---|---|
| AMD EPYC series / cards / models | 20 · 27 · **350** |
| AMD Ryzen series / cards / models | 32 · 79 · **736** |
| AMD GPU series / cards / models | 45 · 45 · **303** |
| Intel Xeon generations / cards / models | 11 · 33 · **553** |
| Intel Client generations / cards / models | 11 · 49 · **340** |
| Intel Graphics generations / cards / models | 4 · 8 · **35** |
| NVIDIA Data Center groups / models | 9 · **20** |
| NVIDIA GeForce series / models | 5 · **47** |
| NVIDIA CPU groups / models | 2 · **4** |
| Core-slider stops — AMD EPYC / Intel Xeon | 20 / 36 |
| Filter chips exercised | 52 Intel (23 · 18 · 11) + 40 AMD |
| Dead chips | **0** — `KNOWN_DEAD_CHIPS` is empty and enforced |
| JS errors | none |

> **Note on the smoke test in a sandbox.** The full suite drives ~92 chips and
> can exceed the 45s bash cap; run it detached with `setsid … nohup … &` and poll
> the log. `SMOKE_TRACE=1` prints every driven action with a timestamp and caps
> waits at 9s — without it, a missing selector stalls for 30s per call with no
> output and looks identical to a slow run.

**Layout invariants** (`python3 tools/audit-layout.py`):

| Check | Value |
|---|---|
| Timeline dot offset from rail | 0.00px, all tabs, 5 widths |
| Era diamond offset from rail | 0.00px, all tabs, 5 widths |
| Horizontal overflow | none at 1440 / 1024 / 390 |
| Clipped text | none |
| Chrome above the timeline | 167px AMD (was 403px) |

Also covered by the browser suite: exact-SKU precedence, collapsed search results with
match explanations, URL restoration, source panels, persistent selections, and a
three-product cross-vendor comparison.

**Filter bar counts** (all multi-select, verified 2026-08-12):

| Tab | Chips | Layout |
|---|---|---|
| AMD CPU | 9 (4 segment + 5 brand) | inline |
| AMD GPU | 4 (segment only) | inline |
| Intel CPU | 12 (4 segment + 8 brand) | stacked (>10 chips) |

Intel segments → 8 / 9 / 8 / 6 groups (desktop/mobile/server/embedded).
GPU segments → 7 / 9 / 22 / 4, summing to 42.

If these numbers drop, something regressed.

---

## What's done

**v0.1.0 → v0.3.0** — split from a single HTML file into `index.html` + `css` + `js`;
extracted data to JSON with lazy loading; the performance rewrite.

Performance work is **complete**. All four P0 items and both P1 items from the Feb audit
shipped: search debouncing (300 ms, `script.js:1206`), DOM caching (`initDomCache()`),
CSS-based filtering (the `.hidden` toggle model), data extraction to JSON, font preconnect
+ `display=swap`. Virtual scrolling was deliberately skipped — correct call at ~50
architectures.

**Post-v0.3.0** (in `CHANGELOG.md` under Unreleased): Intel CPU specs (219 models, 25
architectures), AMD consumer + workstation GPUs (244 models parsed), GPU filtering
system, search clear button, CPU comparison via row selection, mobile-responsive pass,
unreleased-architecture indicators.

---

## Known issues

Verified against current code on 2026-08-12 — all reproducible.

### 1. ~~Accessibility — the biggest gap~~ — LARGELY FIXED 2026-08-13
Architecture headers and SKU cards are now keyboard-operable (Tab to reach, Enter/Space
to open), carry `role="button"` / `aria-expanded` / `aria-label`, and show a
`:focus-visible` ring in the architecture's accent colour. A polite live region
announces filter result counts. Verified: 54 of 54 targets reachable, up from 0.

**Still open, smaller:**
- Spec-table rows (640) are click-to-compare but not keyboard-reachable. Deliberate —
  making each tabbable would mean 640 Tab presses to pass one table. Needs a roving
  tabindex or arrow-key navigation if wanted.
- No skip-link to jump past the filter bar to the timeline.
- The codename quick-reference table's rows are click-to-jump, still mouse-only.
- Not yet tested with a real screen reader (NVDA/JAWS/VoiceOver) — the markup is correct
  and verified programmatically, but that isn't the same as hearing it.

### 2. ~~GPU form-factor filter hides 12 of 42 groups~~ — FIXED 2026-08-12
Form-factor buttons removed; `Mobile` added as a fifth segment. Counts now sum to 42, so
no family is unreachable. See `docs/WORKFLOWS.md` Workflow 6 for the worked example.

**Related, reviewed and deliberately closed — do not re-raise:** `renderGpu()` branches
on `gpuSpecs.consumer` / `gpuSpecs.workstation` to pick one of three table layouts, but
**zero of 42 families carry those flags**, so every GPU table renders the datacenter
column set. Long-standing (verified against the pre-change build), not a regression.

**This is cosmetic, not a correctness bug.** Every value rendered is accurate and comes
straight from the data; the columns are simply generic rather than segment-tailored.
Consumer tables show `FP32 Matrix` (duplicates `FP32` on consumer parts) and `Form`
(always `PCIe` across all 201 consumer models) instead of gaming-relevant `SPs` /
`Boost` / `Game Clock` / `Bus` / `Cache`.

Fixing properly would require sourcing five fields that don't exist in the data for 201
consumer + 43 workstation models. **Daniel reviewed this on 2026-08-12 and chose to leave
it** — he doesn't work with gaming graphics often enough to justify the data effort, and
nothing displayed is incorrect. Revisit only if the consumer/workstation side of the
dashboard becomes customer-facing.

### 3. All Intel CPUs flagged `_srv: true`
219 of 219, including desktop parts (Core Ultra 9 285K). `_srv` selects the table layout,
so desktop chips render Sockets/PCIe/Memory instead of GPU columns. Confirmed in the
rendered page.

*Scope: medium — needs GPU data for client parts, or a decision to accept it.*

### 4. ~~Notes textarea not escaped~~ — RESOLVED 2026-08-26
Removed entirely. Daniel asked for the per-architecture notes boxes to go, which
deleted the unescaped interpolation along with them. Links sections are unchanged.

### 5. `getLinks()` doesn't validate parsed JSON
`script.js:1174` returns `JSON.parse` output unchecked. Low severity, self-inflicted only.

### 6. Filter chips that match no content — 13 tracked
Found 2026-08-26 by the new chip coverage in `tools/smoke-test.py`, and confirmed in a
real browser: clicking one of these empties the page (`0 GENERATIONS · 0 CODENAMES`).

**Two distinct causes.**

**(a) Tag/name mismatch — 10 chips.** `v2ApplyFilters()` compares a chip's tag against
`data-gen`, which `v2Gen()` stamps with the block's **display name**. They match only
when the strings are identical: `Xeon 6` works, `Xeon 5` vs `Xeon 5 (5th Gen Scalable)`
does not.

| Tab | Dead chips |
|---|---|
| Xeon | `Xeon 5` `Xeon 4` `Xeon 3` `Xeon 2` `Xeon 1` |
| Client | `Series 3` `Series 2` `Series 1` `Core X` `Atom / N` |

Xeon 5 is not a data gap — Emerald Rapids has 32 models loaded and renders fine
unfiltered. Three fixes were sketched: add a `genTag` per block (most surgical, ~11
lines), match on `g.id`, or rename the chips to the full block names. **Daniel's call —
he is building the Intel framework first and will revisit.**

**(b) Tag exists, no SKU carries it — 3 chips.** `Athlon` (no Athlon SKU remains in
`amd-data.json`; brands are Epyc, Ryzen, Ryzen AI, Threadripper) and `Silver` / `Bronze`
on Xeon — 32 Silver and 6 Bronze models *are* imported, but every `V2_DATA.xeon` family
is tiered Platinum/Gold, so the tier is unreachable. Expected to resolve as tiering is
finished.

All 13 are listed in `KNOWN_DEAD_CHIPS` in `tools/smoke-test.py`, printed on every run
so they cannot be forgotten. **Anything new that breaks fails the build.** Empty that
set once the tags are reconciled.

### 7. Content gap — AMD CPU coverage
8 AMD architectures vs 19 Intel (Zen 6 added 2026-08-12). Still thinner than Intel, though
AMD now has 46 SKU cards vs Intel's 44.

### 8. Dead file — RESOLVED 2026-09-10
`cpu-architecture-roadmap.html` (279 KB) deleted, along with `js/amd-v2-data.js`
and `intel-v2.html`. Nothing linked to any of them.

---

## Environment notes

**CRLF vs LF.** The working tree is CRLF; the repo stores LF. A fresh clone can show all
14 files as modified with zero real changes. Always check with:

```powershell
git diff --stat --ignore-all-space
```

Confirmed 2026-08-12: full diff showed 21,376 insertions / 21,376 deletions, and
`--ignore-all-space` showed **zero** files changed. Pure line-endings.

**Sandbox verification setup** resets each session — see `docs/WORKFLOWS.md` Workflow 0.
Key gotchas: `NODE_OPTIONS="--use-system-ca"` is required behind Zscaler; browsers must be
installed to native disk, not a network mount; `libXdamage1` may need manual extraction.

**Git from the sandbox fails** on the mounted Windows folder (`Operation not permitted`).
Daniel runs all git commands. It can also leave a `.git/index.lock` behind that the
sandbox cannot delete — if a git command from the sandbox fails, tell Daniel so he can
`Remove-Item .git\index.lock`. Better: never run git from the sandbox.

**Canonical repository:** `https://github.com/DborUS/hardware-dashboard.git`.
Repository visibility may change, but this is the only origin that should receive new
work. GitHub Pages publishes at `https://dborus.github.io/hardware-dashboard/` whenever
the repository visibility and account plan permit Pages deployment.

---

## Suggested next steps

Ordered by value, with the blocking question named.

### 1. ~~Intel Client + Graphics spec data~~ — DONE 2026-09-10

Both tabs now carry real data. The framework needed no changes to accept it:
`v2LoadSpecs()` picked the files up as designed.

- **Client: 340 models, 24 codenames** — `tools/import-client-specs.py`
- **Graphics: 35 models, 13 families** — `tools/import-graphics-specs.py`

Every model lands on a timeline block (340/340 and 35/35); there are no orphans.

### 2. ~~The 12 dead Intel chips~~ — FIXED 2026-09-10

**Zero dead chips across all 52.** Two distinct causes, two fixes:

- **Ten label-vs-name mismatches.** Blocks now carry an explicit `genTag`
  ('Xeon 5') alongside the display name ('Xeon 5 (5th Gen Scalable)'), and
  `data-gen` prefers it. Daniel chose this over renaming the chips so the
  descriptive headings survive.
- **Silver / Bronze were real data the UI could not reach.** 38 such Xeons are
  imported, but tier is one value per family and every family is tagged
  Platinum or Gold. Cards now publish `data-tiers` — the set of tiers their
  *models* span, derived at render time — and the filter matches against that
  set via `v2CardHasTier()`.

`KNOWN_DEAD_CHIPS` is now empty and the smoke test enforces it: any chip that
selects nothing is a build failure, not a backlog item.

### 3. Housekeeping — DONE 2026-09-10
All three dead files deleted (`js/amd-v2-data.js`, `intel-v2.html`,
`cpu-architecture-roadmap.html`). The sandbox *can* delete on the mount once
permission is granted — the earlier "Operation not permitted" was a
default-off setting, not a hard limit.

### 4. Optional polish

- ~~**Sticky header**~~ — **DECIDED 2026-09-10: leave it scrolling. Do not
  re-raise.** Pinning 167px would cost roughly a fifth of a laptop viewport
  permanently, and Daniel would rather spend that on content. The sidebar
  filters are sticky and that is enough — they are what you reach for mid-scroll.
  A condensed 56px variant was offered and also declined.
- **Ryzen Brand filter is lopsided** — 10 of 34 codenames are plain "Ryzen". Unlike
  the old EPYC Platform filter it *is* data-derived, so it is defensible; a core
  slider or segment-first grouping would sharpen it.
- **`check-order.py`'s two violations** — data hygiene only, invisible on the page.
- **Legacy code removal** — `render()`, `renderGpu()`, `applyFilters()`,
  `buildFilterBar()`, `buildCodenameTable()` are unreachable. Deleting them would
  cut ~400 lines from `script.js`, but touches the file both renderers depend on,
  so it deserves its own session and its own smoke run.

### 5. Content and hosting (Daniel deprioritised both)

AMD CPU coverage is thinner than Intel's; no live site reflects current work.

## Session log

Newest first. One short entry per session — what changed, what was verified, what's next.

### 2026-09-21g — Repository prepared for coworker sharing

Rewrote the README to describe the current nine-tab AMD, Intel, and NVIDIA dashboard,
corrected repository and Pages URLs, documented the authoritative runtime inputs versus
the broader research workbench, repaired the malformed mixed-encoding `.gitignore`, and
added file-specific line-ending rules that preserve the AMD generator's intentional
CRLF outputs. Removed obsolete personal-account and credential history from this living
document. No application code or runtime data was intentionally changed.

Verification: all Markdown links resolve; all `index.html` assets exist; no credential
patterns were found; `build-amd-data.py --check` passes; `check-order.py` passes; the
full nine-tab browser smoke test passes with zero JavaScript errors; and the layout audit
reports no horizontal overflow or clipped text. The smoke test confirms 45 AMD GPU
groups / 303 models, correcting the stale 43-group documentation count.

### 2026-09-21f — Product titles anchored beside vendor selector

Changed the compact topbar from a wrapping flex row to a three-column grid: vendor,
product title, and status. Below 900px the vendor and title stay together while the
status count moves to its own row; descriptors hide before they can displace the title.
The vendor pill and title typography scale down together on mobile.

Verification: all nine AMD, Intel, and NVIDIA product tabs keep the title on the same
row as the vendor selector at both 656px and 390px. The responsive layout audit reports
no overflow or clipped text, and the full browser smoke suite passes with zero
JavaScript errors.

### 2026-09-21e — Generation collapse animation streamlined

Replaced the shared generation disclosure's `max-height: 15000px` animation with a
natural-height grid transition. The old ceiling made closing look delayed because the
browser animated thousands of invisible pixels before reaching the visible content.
AMD, Intel, and NVIDIA now open and close as one 180ms movement, including the caret.

Verification: measured the first Intel Xeon group at 148px open and sampled its close
at 148px / 67px / 0px / 0px at 0 / 50 / 110 / 210ms. The declared duration is 180ms,
with no residual spacing. JavaScript syntax, the full cross-vendor browser smoke suite,
and the desktop/mobile layout audit all pass with zero JavaScript errors or overflow.

### 2026-09-21d — NVIDIA press-deck palette applied

Audited all 25 pages of `NDR_July2026_.pdf` as visual reference and replaced the
temporary NVIDIA styling with its consistent presentation system: near-black canvas,
charcoal surfaces, white headings, cool-gray supporting text, and NVIDIA green as the
primary interaction color. The deck's teal, blue, purple, orange, gray, and warm-gold
chart accents are reserved for categorical filter and architecture distinction. The
theme remains scoped to `body.nvidia-v2`, leaving AMD and Intel unchanged.

Verification: JavaScript syntax and data ordering checks pass; the full browser smoke
suite passes every AMD, Intel, and NVIDIA tab with zero JavaScript errors; all three
NVIDIA screenshots were inspected; the layout audit reports no overflow or clipped text.

### 2026-09-21c — NVIDIA implemented from the audited CSV catalog

Added NVIDIA as a third first-class vendor with Data Center, GeForce, and CPU sub-tabs.
The runtime dataset is generated by `tools/build-nvidia-data.py` from the three audited
source CSVs: 20 data-center GPUs, 47 GeForce variants, and 4 CPU/superchips. The renderer
derives groups and filter chips from the loaded records, keeps data center first, and
supports exact-SKU search, shareable state, source disclosure, row selection, and the
existing cross-vendor comparison dialog. `compare-details.json` now includes all 71
NVIDIA products and their complete non-empty source fields.

The NVIDIA palette is isolated in `body.nvidia-v2` variables plus `N2_TONES`.

Verification: data generator row-count and provenance guards pass; `check-order.py`
passes; the full browser smoke test passes all AMD, Intel, and NVIDIA tabs with zero
dead chips and zero JavaScript errors; NVIDIA screenshots were inspected; the repaired
layout audit reports no overflow, with the NVIDIA desktop view included.

### 2026-09-10b — Intel Graphics regrouped and given real spec depth

Daniel: "the Intel GPU section feels poorly organized, not a lot of specs per
table." Both halves of that were true and measurable.

**Nine of thirteen cards held a single model** — a full table header rendered
above one row, the least useful shape a spec table can take. Regrouped by
**architecture + brand line + segment** into eight families, every one with 2+
models: Data Center GPU Max 2 · Data Center Flex 3 · Arc Pro B-series 4 ·
Arc B-series 2 · Arc Pro A-series 5 · Arc A-series 6 · Mobile 7 · Embedded 6.
`family_of()` no longer mirrors the timeline's uneven granularity; the timeline
follows the data instead.

**Only 10 of ~30 populated ARK fields were used.** Added AI (Int8) TOPS — 30/35
filled and the number that actually comes up in AI conversations — plus memory
speed, bus width on the Max parts, and a physical column (slots / PSU / power
connectors) on Arc Pro. Consumer tables went 10 → 12 columns.

Three things worth keeping:
- **`Arc A-series Embedded` is a new segment**, and adding it without a matching
  filter chip would have been the exact recurring bug class in CLAUDE.md. The
  chip was added in the same change; verified 0 dead chips across 52.
- **ARK publishes a bare `Memory` field on newer Battlemage Pro parts** instead
  of `Memory Size` + `Memory Type`. Without that fallback the B70 and B65 render
  a blank VRAM cell while ARK plainly lists 32 GB GDDR6. Another fallback-chain
  case; assume every ARK field has at least two spellings.
- **Displays and Max Resolution were added, measured, and removed.** At 14
  columns they pushed PCIe off the right edge, and they are only 24/35 and 21/35
  filled. **11–12 columns is the practical ceiling at the 2-up card width** —
  anything new must displace something, not append to it. Graphics tables now
  overflow ~900px into an 822px column, in line with Xeon's 13-column tables
  which overflow to ~980px on 29 of 33 cards; horizontal scroll with styled
  scrollbars is the established pattern, not a defect.

Cache-buster bumped on **both** mechanisms this time (`20260910-gfx-regroup`).

**Verified:** 35/35 models place, **0 empty Graphics cards**, 0 dead chips,
0 JS errors, Xeon 553 and Client 340 unchanged. Screenshots read, not just counts.

**Files changed:** `tools/import-graphics-specs.py`, `js/intel-v2.js`,
`js/data/intel-graphics-specs.json`, `js/script.js`, `index.html`,
`tools/smoke-test.py`.

### 2026-09-10 — Intel Client + Graphics imported; all dead chips fixed

Cleared four of the five open items. The Intel framework accepted its data with
no structural change, which is the outcome the framework-first build was for.

**Client — 340 models, 24 codenames.** `tools/import-client-specs.py` joins the
raw ARK exports (which carry the per-core-type clocks the column set needs) to
`intel-master.csv` (which carries the researched codenames). Notes:

- Daniel supplied a second batch of client exports that **overlap** the first
  rather than replacing it: 84 products in both, 54 only in the new, 202 only in
  the old, union 340. Both batches are official ARK, so all seven files are in
  ARK_FILES and a (codename, name) dedupe keeps the first copy seen.
- The join needs normalising on both sides — the master writes
  `Core i9 processor 14900K`, ARK writes `i9-14900K`. Matching raw strings
  dropped 334 of 589 rows. `sku()` strips vendor words and separators.
- **`embedded` is in scope for the Client tab.** Excluding it lost 138 rows of
  client silicon (Raptor Lake-U/H/P, Bartlett Lake-S) that the Embedded filter
  chip openly advertises.
- 12th Gen is in the new exports but not in `intel-master.csv`, so it has no
  researched codename. Alder Lake is the one generation where the die variant is
  fully determined by the model suffix, so `alder_codename()` derives it. Safe
  here and nowhere else.
- Two families were missing from the timeline and were added: **Raptor Lake-E**
  (13th Gen, embedded E/TE) and **Bartlett Lake-S** (Series 2, P-core-only
  embedded rebrand).
- **Xe-cores and Execution Units are not the same unit.** ARK reports Xe-cores
  on Meteor Lake onward and raw EUs on everything older, so a plain fallback put
  UHD 770's `32` beside Arrow Lake's `4`. `xe_cores()` converts at the fixed 8
  EU per Xe-core ratio.
- Pre-2020 parts (Cherry Trail, SoFIA, Coffee Lake-H, Skylake-W W-3175X, 15
  models) are **deliberately excluded** — Daniel's call, matching the Xeon tab's
  Skylake-SP cutoff. They stay in the CSV; they just do not render.

**Graphics — 35 models, 13 families.** `tools/import-graphics-specs.py`. No
codename join needed: ARK publishes `Microarchitecture` directly. The mapping has
to follow the timeline's uneven granularity — Max, Flex and Battlemage get one
family per model, Alchemist collapses 19 A-series parts into three. Added blocks
for **Arc Pro B65 and B70**, which postdate the original scaffolding.
`V2_FIELDS.graphics` is keyed by brand line, mirroring `V2_COLUMNS.graphics`, so
`v2Rows()` now resolves fields through `v2Fields(tier)` exactly as `v2Columns()`
does — if those two ever disagree, values render under the wrong headers and it
looks like bad data rather than a bug.

**All 12 dead filter chips fixed — the set is now empty and enforced.** See
Suggested next steps §2 for the two causes and the two fixes (`genTag` on blocks;
`data-tiers` + `v2CardHasTier()` on cards).

**Housekeeping.** Deleted `js/amd-v2-data.js`, `intel-v2.html` and
`cpu-architecture-roadmap.html` and cleaned up the six doc references to them.
The long-standing note that the sandbox cannot delete on the mount was wrong —
it is a permission toggle, not a hard limit.

**Ryzen 7 4800HS TDP — closed, dashboard was right.** AMD's official CSV lists
45W nominal with a configurable 35–54W range. The agent research reported 35W,
the *bottom of the cTDP band*, and mistook it for the nominal figure; it was never
swapped with the non-HS part. `adjudication.md` and `corrections.csv` updated.

**Sticky header — decided: leave it scrolling, do not re-raise.** 167px pinned
would cost about a fifth of a laptop viewport; a condensed 56px variant was also
declined. The sidebar filters are sticky and that is what gets reached for
mid-scroll.

**Verified.** AMD build chain re-run and idempotent (`build-amd-data.py --check`
reports no drift). `node --check` clean on both renderers, all JSON parses.
Rendered counts after a full rebuild: Xeon 553, Client 340, Graphics 35, 0 dead
chips across 52.

**Post-import fixes, same day.** Reloading the page revealed three things the
counts could not see — a reminder that a passing count check is not a rendered
page:

- The **"Client and Graphics tables are empty pending import"** banner was still
  in `index.html`, hard-coded and now false. Removed, along with the two
  `v2NoData` toggles in `v2Activate()` / `v2Deactivate()`.
- **Data Center GPU Max 1350** rendered an "awaiting data" card. It is withdrawn
  and absent from ARK, so the block was removed rather than left permanently
  empty. Graphics is 13 cards, not 14.
- **The asset cache-buster in `index.html` was never bumped**, so browsers kept
  serving the *old* `intel-v2.js`. This is the one that actually made the page
  look wrong on Daniel's reload. `DATA_VERSION` in `script.js` and the three
  `?v=` query strings on the `<script>` tags are now all `20260910-intel-specs`.
  **Bump both — the JSON fetches and the script tags use different mechanisms.**

Remaining "No spec data yet" cards are legitimate: Xeon 4 (Diamond Rapids,
Diamond Rapids HBM, Sierra Forest AP, Sapphire Rapids HBM — all unannounced) and
Client 25 (11th Gen and older blocks, unreleased Nova Lake, and "Refresh"
variants ARK folds into their base SKUs). Note the master CSV's `Tiger Lake-H`
and `Comet Lake-H` rows are mobile **Xeon W** parts and belong to the Xeon tab,
not to the identically-named Client blocks.

**Files changed:** `index.html`, `js/script.js`, `js/intel-v2.js`,
`tools/import-client-specs.py` (new),
`tools/import-graphics-specs.py` (new), `js/data/intel-client-specs.json` (new),
`js/data/intel-graphics-specs.json` (new), `tools/smoke-test.py`, plus docs.

### 2026-08-27 — SESSION CLOSE SUMMARY

A large UI session. Seven pieces of work landed, each verified before the next.

1. **AMD restructured product-first** — EPYC / Ryzen / GPU sub-tabs, mirroring
   Intel. 640 CPU + 258 GPU models preserved exactly.
2. **Radeon launch years corrected** — 15 of 19 consumer families were wrong
   (HD 5000 said 2019, actual 2009).
3. **Filters moved to a left sidebar** with live per-option counts. Ryzen's bar
   was 278px tall; the rail costs zero vertical space.
4. **EPYC "Platform" filter replaced** — first with core bands, then a range
   slider on Daniel's preference.
5. **Core-range slider** on every tab with core data, snapping to real values.
6. **Header compacted** — 403px → 167px via a sliding vendor pill + product row.
7. **Era dividers added to AMD**, then a full layout audit that fixed five more
   alignment issues.

**Net effect on the thing Daniel actually complained about:** chrome above the
timeline went **403px → 167px**, and the Ryzen filter bar went **278px → 0**
vertical. Six EPYC series now sit above the fold where two did.

**What cost the most time, so the next session can skip it:**

- **Trusting arithmetic over measurement.** Both marker-centring bugs and the
  `::before` box-model mistake were only settled by reading `getComputedStyle`
  back. See CLAUDE.md §4b.
- **Trusting counts over screenshots.** Four separate defects passed every count
  assertion. See CLAUDE.md §5b.
- **Editing a generated file.** `js/amd-v2.js` is built by `tools/gen-amd-v2.py`;
  edits to it vanish on the next run. Edit the generator or the renderer half.
- **Ordering bugs in async activate paths.** `v2Activate()` built filters before
  awaiting the spec load, so Intel's slider rendered empty while `v2Switch()`
  worked. If a control is empty on first paint but fine after a tab switch, look
  at activate-vs-switch ordering first.
- **A stale `.git/index.lock`** from sandbox git commands blocked Daniel's commit.
  Don't run git from the sandbox.

**Three wrong turns worth remembering:**

- Ryzen era dividers were first labelled by *tier*, which put Threadripper 7000
  under "mainstream Ryzen" — Threadripper and Ryzen interleave chronologically.
  Re-labelled by naming scheme.
- The EPYC socket fallback guessed `SP5`, mislabelling three SP3 families. Now
  read from data, and it raises rather than guesses.
- The first era note claimed "12-channel DDR5, LGA 6096" from general knowledge.
  Cut back to what `mem` / `pcie` actually show.

**Verified at close:** smoke test PASS, zero JS errors, 162 / 478 / 258 / 553
models, 0.00px marker alignment across 6 sub-tabs × 5 widths, no overflow or
clipped text at three viewports.

### 2026-08-27f — Diamond centring fixed + layout audit

Daniel spotted the era diamonds sitting left of the timeline rail. Measuring
found **two** markers off, not one:

| Marker | Offset from rail | Cause |
|---|---|---|
| `.timeline-dot` | −3px | `left: -38px` hand-computed, never re-checked |
| `.v2-era::before` | −1px, then −4px | a `::before` does **not** inherit `box-sizing: border-box`, so `width:12px` + 2px borders = 16px actual |

**Root cause was hand-computed offsets.** Four breakpoints each restated
`left:` as a literal, and they had drifted apart. Replaced with variables on
`.timeline` — `--rail-pad`, `--rail-x`, `--rail-w`, `--rail-c` — so every
marker derives `left: calc(var(--rail-c) - var(--rail-pad) - size/2)` and a
breakpoint only restates the rail, never a marker position.

**One wrong assumption caught by measuring.** I first subtracted `.v2-era`'s
`padding-left` from the diamond's offset, reasoning the `::before` was placed
against the padding box. It is placed against the **border** box, so that term
put it 4px left. Fixed only after reading `getComputedStyle(el,'::before').left`
back — the arithmetic looked right on paper both times.

**Verified 0.00px offset** for every dot and diamond across 6 sub-tabs × 5
widths (1440 / 1024 / 640 / 390 / 360).

**Layout audit** — new `tools/audit-layout.py` measures shared left edges,
vertical rhythm, overflow, text clipping and touch-target sizes on every tab and
width. Five real issues found and fixed:

1. **Sidebar group labels sat 6px out** — `margin-left: 2px` against the chips'
   `padding-left: 8px`. Now both 8px, so "SERIES" starts on the same vertical as
   the options beneath it.
2. **Block rhythm read as 79 / 8px** — era margin vs sibling margin, nearly a
   10:1 ratio. Now 75 / 18, a legible 4:1.
3. **Era text was indented 4px, block titles 20px**, so headings hung 16px left
   of what they head. Era now pads 20px to match `.arch-header`. The diamond did
   not move — it keys off the border box.
4. **Intel's descriptor was being ellipsised** — "Server · workstation ·
   embedded" needs 236px, the 34ch clamp allowed 187px. Raised to 46ch, which
   fits all three current descriptors with room to spare.
5. **Small touch targets** — preset buttons 22px, search-clear 18px. Now 30px and
   26px; the slider knobs keep their 14px look but gained a 34px invisible grab
   area via `::after`.

**Verified:** zero overflow and zero clipped text at 1440 / 1024 / 390 on both
vendors. Smoke test PASS, zero JS errors, model counts unchanged.

### 2026-08-27e — Era dividers added to AMD EPYC and Ryzen

Daniel spotted that Intel's tabs carry a diamond + label divider and AMD's CPU
tabs do not. The GPU tab already had three (Instinct / Radeon PRO / Radeon);
EPYC and Ryzen had none, so they read as one long undivided list. The mechanism
and CSS already existed — only the entries were missing.

**EPYC: socket platform.** SP7/SP8 · SP5/SP6 · SP3. Sockets read from the `sk`
field, and each note states only what the spec data shows:

| Divider | Note (all verified from `mem` / `pcie`) |
|---|---|
| SP7 / SP8 platform | Zen 6 — up to 8000 MT/s, PCIe 6.0 |
| SP5 / SP6 platform | Zen 4 and Zen 5 — up to 6400 MT/s, PCIe 5.0 |
| SP3 platform | Zen through Zen 3 — up to 3200 MT/s, PCIe 3.0 / 4.0 |

A first draft said "12-channel DDR5, LGA 6096" from general knowledge; that is
golden rule #1 territory and was cut back to the data before shipping.

**Ryzen: naming scheme, NOT tier — and that distinction was a real bug.** The
first attempt used tier labels (Workstation · Threadripper, then Desktop and
mobile). The screenshot showed **Threadripper 7000 sitting under "mainstream
Ryzen"**, because Threadripper and mainstream Ryzen *interleave chronologically*
— TR9000, R9000, TR7000, R8000. Tier dividers cannot work without reordering the
tab, which was not asked for. Replaced with the boundaries the block order
genuinely follows: `Ryzen AI branding` → `Numbered series` → `Outside the
numbering`. Verified by reading the rendered sequence back and checking every
block belongs under its heading.

**Counts caught nothing here** — the dividers rendered, the counts were right,
and the grouping was still wrong. Same lesson as the sub-heading order bug on
2026-08-16b: read the screenshot.

**Dividers hide when everything under them is filtered out** — with core ≥ 128
the SP3 divider disappears, since no SP3 part reaches 128 cores. That behaviour
came free from the existing `v2Era` machinery.

**Verified:** EPYC 3 eras, Ryzen 3, GPU 3 unchanged, Intel 7 unchanged. Smoke
test PASS, zero JS errors, model counts unchanged (162 / 478 / 258 / 553).

### 2026-08-27d — Header compacted: sliding vendor pill + product row

Daniel: the layout and hierarchy are right, but the header eats the top of the
page. Measured before touching anything — **403px of chrome on a 1000px
viewport**, 40% of the screen:

| Element | Height |
|---|---|
| AMD / Intel tabs | 51px |
| "AMD EPYC" + subtitle | 55px |
| EPYC / RYZEN / GPU | 44px |
| search + toolbar + status | 93px |
| margins between four centred blocks | ~160px |

The margins cost more than any single element, and the title was the weakest
earner — "AMD EPYC" restated the two selectors directly above it.

Four options were mocked (`tools/mockups/header.html`). Daniel chose **C's
sliding pill with B's product row**.

**Result: 403px → 167px.** Six EPYC series now sit above the fold where two did.
Intel 246px (it carries the no-data notice). 1024px → 201px, 390px → 349px.

**Row 1** is the vendor pill plus the inline title. The pill's coloured thumb is a
single element translated between halves, so switching reads as one control
moving rather than two buttons lighting up; the thumb also recolours red→blue.
**Row 2** is the product line as a segmented control, search, and the
expand/collapse toolbar together.

**`stripVendor()` drops the vendor word from the title.** The data still carries
"AMD EPYC" / "Intel Xeon" because it is meaningful standalone, but the header now
renders beside a pill that already says which vendor — so the widest line on the
page was pure repetition. Titles read "EPYC", "Ryzen", "Graphics", "Xeon".

**Blurbs shortened at source.** They were written for a centred full-width line;
"Data center processors — ordered by EPYC series" duplicated the sub-tab and the
block headers. Now "Data center processors", "Desktop · mobile · workstation ·
handheld", and so on, with a `max-width: 34ch` ellipsis clamp as a backstop.

**Every id the renderers and smoke test depend on was preserved** —
tabAmd, tabIntel, pageHeader, a2Subtabs, v2Subtabs, searchInput, searchClear,
expandAllBtn, collapseAllBtn, clearSelectionsBtn, a2Status, v2Status, techTabs.
Verified by grepping all fourteen after the rewrite. The legacy `techTabs` div is
now `hidden` but still present, because `initDomCache()` holds a reference.

**Caught in review:** the search field clipped its placeholder — a flex child
without `min-width: 0` refuses to shrink below its content width. Fixed.

**Verified:** smoke test PASS, zero JS errors, all model counts unchanged
(162 / 478 / 258 / 553). Pill state and thumb transform read back from the DOM on
both vendors. Screenshots read at 1440 / 1024 / 390px.

### 2026-08-27c — Core-count bands replaced with a range slider

Daniel preferred a manual min/max control over fixed buckets. Three variants
were mocked (`tools/mockups/core-slider.html`); he chose slider **plus** typed
inputs, applied everywhere with core data — EPYC, Ryzen, Intel Xeon — but not GPU.

**The track snaps to real core counts, it is not linear.** EPYC ships 20 distinct
values between 8 and 256 and **12 of them are at or below 32C**. On a linear axis
those pile into the first quarter while a third of the track sits empty between
192C and 256C. Each real value now gets equal width, so every stop is reachable.
Tick dots mark the stops.

**Stops are derived from loaded data, never hardcoded.** A tab with fewer than two
distinct values renders no slider at all — which is why the GPU tabs have none and
Intel Client will grow one automatically when its spec import lands.

| Tab | Stops | Range |
|---|---|---|
| AMD EPYC | 20 | 8 – 256 |
| AMD Ryzen | 11 | 2 – 96 |
| Intel Xeon | 36 | 2 – 288 |
| GPU / Intel Client | none | no core data |

**Intel needed a real fix, not a copy.** Xeon stores **no total-core field** —
only `pc` and `ec`. Reading `c` reports all 553 models as having no core count,
so `coreTotal()` sums P+E. Verified against the data: Xeon 6990E+ reads 288.

**Two bugs caught in verification, neither visible in counts:**

1. **Intel's slider was empty.** `v2Activate()` built the filters *before*
   awaiting `v2LoadSpecs()`, so the stops were computed from nothing. Only
   `v2Switch()` had the right order. Fixed, and the smoke test now asserts
   `intel_core_stops: 36` so it cannot regress silently.
2. **Presets read "≤36 / 36–112 / 112+"** — real values, but not numbers anyone
   asks for, because they were sampled at fixed fractions of the track. Now
   snapped to conventional boundaries (32 / 64 / 128), filtered to those the tab
   actually spans — Ryzen correctly drops the 128 cut since it tops out at 96C.

**Verified against ground truth recomputed from JSON**, not read off the page:
EPYC min=96 → 7 codenames; Intel min=128 → exactly Clearwater Forest, Granite
Rapids AP, Sierra Forest SP (3, matching the JSON). Typed values snap to the
nearest real stop. Smoke test PASS, zero JS errors, all model counts unchanged
(162 / 478 / 258 / 553).

**Smoke test now covers the slider** — stop count, typed-input snapping, that a
min actually narrows, that the All preset restores, and that GPU has no slider.
Untested UI is how the 12 dead chips survived; this closes that gap for the
newest control.

**Core count is the FIRST group in the rail** (Daniel, 2026-08-27): it is the
filter most used in practice, so it leads ahead of the generation/series chips.
Order is now Core count → Series → Socket on EPYC, Core count → Series → Brand →
Segment on Ryzen, Core count → Generation → Tier → Segment on Xeon. GPU is
unaffected — no core data, no slider. Verified group order read back from the
rendered DOM on all four tabs.

### 2026-08-27b — EPYC "Platform" filter replaced with core-count bands

Daniel asked what Platform represented and whether it earned its place. It did not.

**What it was:** a hand-typed set literal in the generator — `DENSE = {Turin
Dense, Bergamo}`, `EDGE = {Siena}`, everything else "Performance". Two problems:
**9 of 12 codenames fell into one bucket**, so clicking it eliminated three cards
out of twelve; and it was **invented rather than derived**, the exact pattern
golden rule #1 warns about. It happened to be correct, but nothing enforced that
and a new dense SKU would have silently landed in "Performance".

**What replaced it:** core-count bands read from the `c` field of all 162 EPYC
models — the thing datacenter presales actually screens on.

| Band | Codenames | Models |
|---|---|---|
| 129C+ | 2 | 6 |
| 65–128C | 7 | 23 |
| 33–64C | 8 | 42 |
| ≤ 32C | 9 | 91 |

Bands sum to exactly 162. Boundaries sit between real AMD tiers rather than on
round numbers: 32C is the entry/edge ceiling (Naples, Siena), 64C the classic
mainstream flagship (Rome, Milan), 128C the dense ceiling before Venice and
Turin Dense go past it.

**A codename spans a range, so `tier` is now a LIST.** Turin ships 8C–128C and
belongs to three bands at once. `a2Tiers()` normalises single-string (Ryzen, GPU)
and array (EPYC) forms, cards stamp `data-tier` pipe-joined, and the filter does
an intersection test instead of equality. This is the same shape as the
multi-series insight behind the whole product-first restructure.

**Verified against ground truth recomputed from the JSON**, not from the page:
all four bands match on codename count exactly (2/7/8/9), OR-combining works
(129C+ plus ≤32C = 11 cards = 2 + 9), smoke test PASS, zero JS errors, zero dead
AMD chips.

### 2026-08-27 — Filters moved to a left sidebar (both vendors)

Daniel: the filter bar is big, cluttered, and the per-series buttons duplicate
how the page is already laid out.

**Measured before changing anything:** the Ryzen filter bar was **278px tall**,
pushing the timeline start to **681px** — two thirds of a 1000px viewport before
any content. EPYC 140px, Intel Xeon similar.

Four options were mocked at 1440px with the real design tokens and real data
(`tools/mockups/filters.html`); Daniel chose the sidebar, applied to both vendors.

**Result — vertical space reclaimed:**

| Tab | Timeline started | Now |
|---|---|---|
| AMD EPYC | 543px | **403px** |
| AMD Ryzen | 681px | **403px** |
| AMD GPU | 463px | **423px** |

Ryzen's bar no longer grows with the number of series at all — the rail is a
fixed 208px column and long groups (19 Ryzen series) scroll at 232px.

**Live counts are the real win.** Every option shows how many blocks it would
yield, counted against the *other* groups' current selections — so with
Brand=Ryzen AI selected, the Segment counts show what's reachable within that
brand. Verified: **18 spot-checked options across three tabs, zero mismatches**
between the displayed count and the actual filtered result.

**Options that would yield nothing are dimmed with no number.** This makes the
12 known-dead Intel chips *visibly* dead rather than silently dead — they now
read as greyed with a blank count instead of looking clickable. The underlying
tag/name mismatch is still unfixed and still tracked.

**One bug caught in verification.** Both renderers did `bar.className =
'filter-bar'`, which wiped the `controls` class the responsive rules key off, so
the sidebar would not collapse at 390px. Fixed in both, and the CSS now targets
`.sidebar > .controls` so it holds even if a renderer reassigns className again.

**Responsive:** two columns above 900px; below that the rail becomes a collapsed
"Filters" disclosure with a count badge, so content leads on a phone. Verified at
1440 / 1024 / 390px.

**Verified:** smoke test PASS, zero JS errors, all six sub-tabs walked,
screenshots read at three widths.

### 2026-08-26b — AMD restructured product-first (EPYC / Ryzen / GPU)

Daniel: give AMD the same sub-tab scheme as Intel, and organise by product name
rather than Zen generation.

**New `js/amd-v2.js`** — three sub-tabs, product-series blocks holding codename
cards, mirroring `js/intel-v2.js` exactly (same DOM contract, same render-once-
then-filter model, same card/brandline/era machinery).

| Sub-tab | Blocks | Cards | Models |
|---|---|---|---|
| EPYC | 6 series (9006 → 7001) | 12 | 162 |
| Ryzen | 19 series (AI 400 → 1000, Threadripper, Z-series) | 34 | 478 |
| GPU | 42 (Instinct → Radeon PRO → Radeon) | 42 | 258 |

**640 CPU + 258 GPU models render — identical to the old structure.** Nothing was
dropped; every codename in `amd-cpu-specs.json` is placed, and no block
references a missing spec key. The generator asserts both.

**Product-series-first is load-bearing, not cosmetic.** Several codenames span
two series — Phoenix is both Ryzen 7000 and 8000, Dragon Range likewise. Nesting
series → codename lets a codename appear under each series that sells it.
Codename-first could not express this.

**`js/amd-v2.js` is GENERATED by `tools/gen-amd-v2.py`.** Codenames, model
counts, sockets and GPU segments are read from `js/data/*.json`, so the taxonomy
cannot drift from the data. Series names come from AMD's published branding.

**Radeon launch years were wrong and are fixed.** 15 of 19 consumer families
carried invented-looking years — HD 5000 said 2019 (actual 2009), HD 7000 said
2023 (actual 2012), R9 200 said 2020 (actual 2013). Corrected from AMD/Wikipedia
launch dates. The diff is exactly 16 lines changed, no reformatting: the file is
**CRLF with `\uXXXX` escapes** and the writer had to match that, or all 42
families would have rewritten.

**A socket bug the chip check caught.** The generator originally fell back to
`SP5` when a subtitle named no socket, silently mislabelling Milan / Rome /
Naples (all SP3) and leaving the SP3 chip dead. Now read from `sk` in the spec
data, and the generator raises rather than guessing.

**A layout flaw the screenshots caught.** Every GPU block held one card whose
name simply restated the block header ("Instinct MI350 Series" → "MI300 Series
(CDNA 4)"). Cards now show the actual products — "MI355X · MI350X" — with a
separate `key` field carrying the join into the data. Counts never saw this;
reading the PNGs did.

**Smoke test updated.** AMD's CPU/GPU tech tabs are gone, so the old
`#techTabGpu` clicks hung the suite. Now walks all three AMD sub-tabs with
per-tab model-count assertions, which is the real guard against a future
restructure silently dropping data.

**Verified:** PASS, zero JS errors. 49 AMD chips exercised, **zero dead**. AMD →
Intel → AMD round trip clean, both sub-tab bars showing/hiding correctly.
Screenshots read on all three tabs.

**Open:** the Ryzen Series filter has 19 chips and wraps to four rows — it works
but is heavy; worth revisiting if it annoys in use. The 12 Intel dead chips are
unchanged.

### 2026-08-26 — Notes removed · filter-chip coverage · doc corrections

**Notes boxes deleted.** Daniel: no longer needed. Removed the `.notes-area` block from
both `render()` and `renderGpu()`, the `saveNotes()` / `loadNotes()` helpers, and all
`.notes-*` CSS including the 640px rules. Links sections untouched. This also closed
known issue #4 (the unescaped `${loadNotes(...)}` interpolation) by construction.
Existing `roadmap-notes-*` localStorage keys are now inert.

**`tools/smoke-test.py` now clicks every filter chip.** The suite counted rendered
elements but never exercised a filter, which is why ten dead chips shipped unnoticed —
the page renders correctly and only goes blank once a user clicks. 65 chips are now
exercised per run.

**It immediately found three more than I had spotted by inspection:** `Athlon`,
`Silver`, `Bronze`. Different cause from the other ten — see known issue #6. That is the
check earning its keep on the first run.

Known-dead chips are allowlisted in `KNOWN_DEAD_CHIPS` and printed every run rather than
silently skipped, so the suite stays green while the Intel framework is in flux but any
*new* breakage fails the build.

**Doc corrections:** `DATA-SCHEMA.md` header counts were stale (14 entries / 7 archs /
44 keys → 16 / 8 / 46). The `specKey` plan in Suggested next steps was superseded by the
Xeon import and has been rewritten. The Zen 6 process-node open item was already
resolved — `CHANGELOG.md` confirms Daniel supplied 2 nm; it was not inferred.

**Verified:** smoke test PASS from a fresh sandbox — AMD 8 groups / 46 SKUs / 47 tables
/ 42 GPU, Intel Xeon 11/33/**553 models**, Client 11/47, Graphics 4/12, zero JS errors.
Screenshots read at 1440px to confirm the notes boxes are gone and the links area still
sits correctly at the bottom of an expanded architecture.

**Environment note:** Playwright setup per `WORKFLOWS.md` Workflow 0 works, with one
addition — `libXdamage1` is missing from this image and needs the documented
`apt-get download` fallback. Background processes do not survive between sandbox calls,
so the smoke test must finish inside a single command.

**Next:** Daniel to decide on the 10 tag/name-mismatch chips (recommend a `genTag`
field per block). The two `check-order.py` violations are still open and still need his
call on Zen 4 Phoenix.

### 2026-08-16g — Xeon spec data imported (553 models)

The Xeon sub-tab now renders real data. Client and Graphics remain empty by design.

**Pipeline, all re-runnable:**

```
ARK exports  ->  tools/assign-xeon-codenames.py  ->  Xeon_Combined_With_Codenames.csv
             ->  tools/import-xeon-specs.py      ->  js/data/intel-xeon-specs.json
```

604 SKUs in, 553 stored across 29 codenames. 51 excluded by Daniel's decisions:
18 mobile Xeon W/E, 33 Broadwell-D. Zero unmapped.

**Codenames are derived, never guessed.** Every rule keys off an objectively
determined ARK field — socket, lithography, model number, launch quarter, vertical
segment. Socket alone resolves the W/E/D lines; two sockets host two generations each
(LGA2066 = W-21xx Skylake + W-22xx Cascade Lake; LGA1200 = W-12xx Comet + W-13xx
Rocket) and split on model number.

**P/E core counts are DERIVED from the product line.** ARK leaves
`# of Efficiency-cores` blank or `0` on every Xeon — including the 288-core 6990E+.
Reading it would report Sierra Forest and Clearwater Forest as zero-E-core parts.
Core type comes from the codename instead: Sierra Forest and Clearwater Forest are E,
everything else P.

**13-column Xeon table:** Model · P-cores · E-cores · Threads · Base · Boost · L3 ·
TDP · Sockets · Memory · Max Mem · PCIe · UPI. TDP renders `350W / 420W` where base and
turbo both exist. 1DPC/2DPC dropped — Daniel's call.

**Verified: 5,503 field comparisons, zero mismatches.** The checker re-parses the
source CSV independently of the importer. Plus cross-generation plausibility: flagship
cores 28→28→28→40→60→64→128 (monotonic), DDR4 through Ice Lake and DDR5 from Sapphire
Rapids, PCIe 3→4→5, socket limits matching known platforms.

**Three bugs the verification caught — none visible by eye:**

1. **Skylake-W reported the slowest memory speed.** ARK gives
   `DDR4 1600/1866/2133/2400/2666` as a slash list; the regex matched the first number,
   so all 8 W-21xx parts showed DDR4-1600 instead of DDR4-2666. Wrong by 40%.
2. **`Xeon 6516P-B` lost its PCIe lanes** — ARK publishes lanes but no revision, and the
   formatter returned a dash unless both existed.
3. **Bare `8800 MT/s`** with no DDR generation, because the MHz branch did not match
   MT/s strings.

ARK formats are inconsistent across ten years of exports — `Scalability` has 9 spellings
for 8 states, `Cache` had 143 non-standard forms including bare kilobyte integers. Every
normaliser passes unknown shapes through unchanged and `--audit` reports them; currently
zero fall through.

**Smoke test now asserts `intel_xeon_models: 553`**, so silent data loss fails the build.

**Four cards render "No spec data yet":** Diamond Rapids and Diamond Rapids HBM
(unreleased), Sierra Forest AP and Sapphire Rapids HBM (ARK pages not yet exported —
Xeon 6900E and Xeon Max 9400).

### 2026-08-16f — v2 promoted to the main Intel tab

The prototype is now the Intel tab. `intel-v2.html` was a redirect stub; deleted
2026-09-10.

**Two renderers now share one DOM.** `render()` draws AMD, `v2Render()` draws Intel,
both over `#timeline` / `#searchInput` / `#filterControls` / toolbar. `switchVendor()`
calls `v2Activate()` or `v2Deactivate()`; shared listeners early-return on
`v2IsActive()`. **Any new toolbar control must wire both paths** or it will silently do
nothing on one tab.

**Changes:**

- `css/styles.css` — v2 styles moved out of the standalone page; `.vendor-tab-wip`
  removed. New rules namespaced under `.intel-v2` or `.v2-*`.
- `js/intel-v2.js` — `DOMContentLoaded` replaced with `v2Activate` / `v2Deactivate` /
  `v2IsActive` / `v2SetSearch`. Uses `dom.*` from `script.js`; `escHtml()` is shared,
  local `slug()` renamed `v2Slug()` to avoid collision.
- `index.html` — WIP tab dropped, sub-tab bar + no-data notice + status line added,
  `intel-v2.js` loads before `script.js`.
- `js/script.js` — Intel branch in `switchVendor()`, four listeners route by renderer.

**Smoke test rewritten for Intel.** Old `intel_cpu_groups` / `intel_cpu_skus` replaced
with per-sub-tab counts (xeon 12/26, client 11/47, gfx 3/12 minimums). Model-count
checks dropped — there is no Intel spec data by design. Two new leak assertions: sub-tabs
visible on Intel, hidden on AMD, and AMD re-renders after returning.

**Verified:** AMD 8 groups / 46 SKUs / 47 tables / 42 GPU — unchanged. Intel 12/26,
11/47, 4/12. Round-trip AMD → Intel → AMD → GPU → Intel clean. Zero JS errors.
Screenshots read for both vendors.

**Next:** map the 275 existing Intel models onto the new SKU keys, then bulk import.
Also still open: the two `check-order.py` violations (Zen 4 Phoenix, Raptor Lake 14th
Gen Xeon E / Xeon W).

### 2026-08-16e — Prototype audited against the ordering rule

Applied golden rule #2 to all three sub-tabs. Audited every block rather than
spot-fixing; found violations on Xeon and Graphics, none on Client.

**Xeon — intra-tier performance order was wrong in four blocks.** Tier order was already
correct, so `check-order.py` would not have caught these; they need the domain knowledge
the script deliberately lacks.

| Block | Was | Now | Why |
|---|---|---|---|
| Xeon 6 | SP → AP | **AP → SP** | AP is max core count (6900P/6900E), SP is mainstream |
| Xeon 5 | XCC → MCC → SP | **XCC → SP → MCC** | MCC is the Gold tier, trails the Platinum entries |
| Xeon 2 | SP → AP | **AP → SP** | AP is Platinum 9200, up to 56C |
| Xeon W | W-2400 → W-3400 | **W-3400 → W-2400** | W-3400/3500 is the expert tier, up to 56C |

**Graphics — the top level violated the rule outright.** Blocks ran Xe2 → Xe-HPG →
Xe-HPC, so consumer Battlemage sat above datacenter Ponte Vecchio. Restructured into two
eras, reusing the divider mechanism from the Client tab:

```
◇ DATA CENTER              HPC, AI and media acceleration
    Xe-HPC — Ponte Vecchio    Max 1550 · 1350 · 1100
    Xe-HPG — Flex Series      Flex 170 · Flex 140

◇ WORKSTATION AND CONSUMER  Discrete Arc — newest architecture first
    Xe2 — Battlemage          Arc Pro B60 · B50  |  Arc B580 · B570
    Xe-HPG — Alchemist        Arc Pro A-series   |  Arc A-series · Mobile
```

**Flex split into its own block** as a consequence. It is Alchemist silicon, so it used
to sit inside the Alchemist block — good for showing the shared ACM-G10 dies, but it
forced datacenter parts under a consumer-led heading. The block note now carries the
relationship in words ("the same DG2 silicon as the Arc A-series", and Alchemist points
back with "Data Center Flex above is the same silicon"), which preserves the insight
without breaking the ordering rule. Architecture filter chips renamed to match.

**Client needed no changes** — desktop already led mobile, embedded already trailed, and
HX → H → P → U was already in performance order.

**Verified:** Xeon 12/26, Client 11/47, Graphics 4 blocks (was 3) / 12 families. Block
order read back from the rendered DOM, not just the source. Zero JS errors. Main smoke
test PASS.

### 2026-08-16d — Datacenter-first ordering is now a golden rule

Daniel: everything that enumerates parts should run **datacenter → client → desktop →
mobile**, and within a tier the highest-performing part leads (Strix Halo above Strix
Point). Rationale: the audience is datacenter presales, so a consumer part sitting above
an EPYC part is a defect, not a nitpick.

**Documented in four places**, each for a different moment:

| Where | Why there |
|---|---|
| `CLAUDE.md` golden rule #2 | Read before the first tool call; rules renumbered 3–6 |
| `CLAUDE.md` Data conventions | Where I look while editing a data file |
| `docs/DATA-SCHEMA.md` — new "SKU ordering" section | The full rank table + worked example |
| `docs/DESIGN-SYSTEM.md` | Visual rationale — the eye lands top-left |

**The rank:** 0 datacenter · 1 workstation/HEDT · 2 desktop · 3 mobile · 4 handheld ·
5 embedded. A multi-tag SKU takes its *strongest* tier, so `["desktop","pro"]` is
workstation, not desktop. Threadripper and Xeon W are workstation regardless of tags.

**New `tools/check-order.py`.** Enforces tier ordering across both data files; `--fix`
prints the corrected sequence without writing. Deliberately does **not** check intra-tier
performance order — knowing Strix Halo outranks Strix Point needs domain knowledge the
script lacks, so that stays a review-time judgement. The script says so in its output
rather than implying a clean run means fully-ordered data.

**Two real violations found, both still unfixed** (data changes, left for Daniel to
confirm):

- **Zen 4** — `Phoenix` (desktop+laptop+pro) sits after `Dragon Range` (laptop).
- **Raptor Lake (14th Gen)** — `Xeon E` and `Xeon W-2400/2500` are last in a list that
  opens with desktop parts. Worst instance in the dataset: two server lines below
  consumer silicon.

**Prototype brought into line.** The Graphics tab violated the rule I had just written —
Brand chips read `Arc · Arc Pro · Data Center` and Xe2/Xe-HPG blocks led with consumer
cards. Reordered chips to `Data Center · Arc Pro · Arc`, and the brand-line `order` array
so Data Center leads inside a block. Xeon and Client already complied.

**Verified:** Graphics now reports "2 Data Center · 1 Arc Pro · 2 Arc" for Alchemist.
All three tabs unchanged in counts. Zero JS errors. Main smoke test PASS.

### 2026-08-16c — Graphics tab built (generation-first, not ARK-first)

ARK organises GPU **segment-first**: Arc → Arc Pro → Data Center, then the letter.
The prototype deliberately inverts that to **architecture-first**, matching Xeon and
Client.

**Why invert it.** Data Center **Flex is Alchemist silicon** — ACM-G10 / ACM-G11, the
same DG2 dies as the Arc A-series. ARK files it three menus away, so the relationship is
invisible. Architecture-first puts Flex 170 / 140 in the same block as the A-series,
where the shared silicon shows. The letter already encodes the generation (B580 →
Battlemage), so segment-first would scatter one architecture across three entries.

```
Xe2 — Battlemage    2024–25   Arc: B580 · B570        Arc Pro: B60 · B50
Xe-HPG — Alchemist  2022–23   Arc: A-series ·  mobile  Arc Pro: A-series
                              Data Center: Flex 170 · Flex 140
Xe-HPC — Ponte Vecchio 2022–24 Data Center: Max 1550 · 1350 · 1100
```

**Graphics breaks the one-column-set-per-tab rule.** On Xeon and Client the spec-table
columns are a property of the tab — that is what removed the `_srv` bug. Consumer,
workstation and data-center GPU need genuinely different fields, so `V2_COLUMNS.graphics`
is an object keyed by brand line and `v2Columns(tier)` resolves per card:

| Brand line | Distinct columns |
|---|---|
| Arc | RT Units · XMX · Bus · PCIe |
| Arc Pro | ECC · Form Factor |
| Data Center | Xe Vector · Xe Matrix · Xe Link · Form Factor |

Other tabs pass a plain array and are unaffected. The alternative — splitting Graphics
into Client Graphics and Data Center sub-tabs — was rejected: four Intel sub-tabs for
12 families is heavy, and it would re-scatter the Flex/A-series silicon link.

**Also fixed:** a stray `.fgroup-sep` divider stranded at the end of a wrapped filter
row. The bar now stacks at >8 chips *or* >2 groups, rather than >10 chips.

**Two deliberate omissions.** No Xe3 / Celestial discrete block — Panther Lake ships Xe3
integrated, but a discrete card is unannounced, and golden rule #1 says leave it out.
No B770 either; Battlemage's high end went to Arc Pro B60, and the block note says so
to pre-empt "why is the flagship missing".

**Verified:** Graphics 3 architectures / 12 families, 5 brand sub-headings, all three
column sets resolving correctly per card. Xeon 12/26 and Client 11/47 unchanged. Zero JS
errors. Main smoke test PASS.

### 2026-08-16b — Series blocks renamed and brand lines surfaced

Follow-up to Daniel's review of the restructure. Two issues, both valid.

**1. Block labels said "Core Ultra Series N".** The blocks already held both brand
lines, but the label hid that — it read as if plain Core parts were missing. Renamed to
**`Core / Core Ultra Series N`**, matching how ARK lists them as two entries.

**2. Nova Lake was a floating block.** It is expected Series 4, so it now sits in a
`Core / Core Ultra Series 4` block. Every entry in the Series era is now a Series block —
no exceptions, which is what makes the era read cleanly.

**Brand lines are now visible inside each block.** Cards group under `CORE ULTRA` and
`CORE` sub-headings with a coloured rule, and the block header shows the mix
("7 Core Ultra · 2 Core · 52 models"). Opt-in via `brandGroups: true` on the client tab
only; Xeon and Graphics still render one flat grid.

**Bug caught by screenshot, not by counts.** Sub-headings rendered *below* their cards.
Cause: `.sku-card` uses `order: var(--card-order)` with card `i` at `i*2` and its spec
wrapper at `i*2+1`, so a heading had no free slot between groups. Widened the stride to
4 (`i*4` / `i*4+1`), leaving `start*4-2` for the heading. The counts passed the whole
time — this is the case `CLAUDE.md` warns about: read the PNGs, don't trust the numbers.

**Verified:** Client 11 gens / 47 codenames. 8 brand sub-headings; filtering to Core
Ultra correctly drops it to 3. Headers read "7 Core Ultra · 2 Core" (S2), "3 Core Ultra ·
1 Core" (S1). Xeon 12/26 and Graphics 4/7 unchanged. Zero JS errors. Main smoke test
PASS at baseline.

### 2026-08-16 — Client tab restructured around the branding change

Daniel pointed at ARK's Core listing: it shows **"Intel Core processors (Series 1/2/3)"**
— plain Core, no "Ultra". That exposed a real error in the prototype.

**What I had wrong.** I treated Series 1/2/3 as a single Core Ultra line. There are two
parallel lines per Series: **Core Ultra** = newest architecture, **plain Core** = rebadged
older silicon. Both ship simultaneously under the same Series number.

**Also corrected:** I previously told Daniel `Raptor Lake-U Refresh` (Core 5 220U /
Core 7 250U) was a Series 1 part filed under 14th Gen. Wrong twice — the **2xx** model
numbers make it Series **2**. The 1xx parts (Core 3 100U / 5 120U / 7 150U) are the
Series 1 ones. Both now have cards under the correct Series.

**The three eras, now explicit dividers in the timeline:**

| Era | Branding | Blocks |
|---|---|---|
| Series branding | No generation number | Nova Lake, Series 3 / 2 / 1 |
| Numbered generations | `Core i3/i5/i7/i9`, retired after 14th Gen | 14th → 10th Gen |
| Outside the scheme | Never followed mainstream numbering | Core X-series, Atom / N |

The 3→2→1→14th ordering Daniel flagged as incoherent was chronologically right but
visually unexplained. The divider now states *why* the numbering restarts.

**Two supporting changes:**

- **Every card carries a `silicon:` line.** Arrow Lake-U reads `Meteor Lake derived ·
  Intel 3` while its Series 2 siblings read `Arrow Lake · TSMC N3B`. Marketing names
  hide this; an FAE needs it. The line is searchable.
- **Brand chip split `Core Ultra` / `Core` / `Core i`.** Selecting `Core` isolates the
  4 rebadged parts across both eras — impossible before, since `Core` and `Core Ultra`
  were one tag.

**Renderer additions:** `v2Era()` emits the dividers; `applyFilters()` hides an era
heading whose generations are all filtered out, mirroring how the production page
handles orphan year separators.

**Verified:** Client 11 gens / 47 codenames (was 45). Brand=Core → 3 gens / 4 codenames,
1 era visible. Brand=Core i → 5 gens / 22 codenames, 1 era visible. Xeon and Graphics
unchanged. Zero JS errors. Main smoke test at baseline.

**Still open:** whether Cascade Lake-AP (Platinum 9200) deserves its own Xeon 2 block;
Core X-series spans four generations in one block; Graphics taxonomy is a first pass.

**Historical hosting note:** this was true on 2026-08-14 but is now superseded. The
canonical repository is `DborUS/hardware-dashboard`, and its Pages URL is
`https://dborus.github.io/hardware-dashboard/`. GitHub Free requires the repository to
be public for Pages to remain published; GitHub Pro or higher can publish a public Pages
site from a private repository.

### 2026-08-14 — Intel restructure prototype (`intel-v2.html`)

Structure-only preview of the proposed Intel reorganisation. **No spec data** — every
table renders its real column set with an empty body, deliberately, so the shape can be
judged before the bulk CSV import fills it.

**The proposal, in one line:** three sub-tabs (Xeon / Client / Graphics), each with
generation blocks holding codename cards. Tier is a filter chip, not a nesting level.

| Level | What it is | Example |
|---|---|---|
| Sub-tab | Product line — **also picks the spec-table columns** | Xeon |
| Generation | Timeline block | Xeon 6, 14th Gen |
| Codename | Today's SKU card | Granite Rapids AP |

Three points worth carrying forward:

- **Sub-tabs delete the `_srv` bug rather than fixing it.** Column layout becomes a
  property of the tab, so the per-SKU `_srv` flag — currently `true` on all 219 Intel
  parts, which is why the Core Ultra 9 285K renders server columns — stops existing.
- **Tier stays out of the DOM.** It is already in every model name and searchable;
  four sparse rows per generation reads worse than one chip. This is the one place the
  prototype departs from the generation → tier → codename plan in
  `docs/INTEL-RESTRUCTURE-PLAN.md`.
- **Core Ultra Series 1/2/3 are the generation sequence continuing.** Intel retired the
  numbered scheme after 14th Gen, so there is no "15th Gen". They sit at the top of the
  same timeline, subtitled with the equivalence.

**Files:** `intel-v2.html`, `js/intel-v2.js` (new, self-contained), plus a WIP vendor tab
in `index.html` and `.vendor-tab-wip` styling in `css/styles.css`. `js/script.js` and all
`js/data/*.json` are untouched — the prototype cannot destabilise `render()`, and deleting
the two new files plus the tab removes it cleanly.

**Verified:** Xeon 9 generations / 18 codenames · Client 11 / 45 · Graphics 4 / 7.
Filters compose correctly (Mobile → 27 cards; + Core Ultra → 9). Search "tiger" isolates
11th Gen. Spec tables open with the right column set and an empty body. Zero JS errors.
Main smoke test unchanged at baseline (amd 8/46, intel 20/47, gpu 42, tables 47).

**Fixed during review:** long codename titles ran under the SPECS toggle.

**Open for Daniel:** does `Raptor Lake-U Refresh` (Core 5 220U / Core 7 250U) belong
under 14th Gen — the silicon — or Core Ultra Series 1, which is how Intel sold it? The
prototype files it under 14th Gen. Also unresolved: Core X-series spans four generations
and 32→14 nm inside one block, and the Graphics tab taxonomy is a first pass only.

**Not started:** the data migration itself. Nothing in `js/data/` has changed.

### 2026-08-12 — SESSION CLOSE SUMMARY
Six pieces of work landed today, all verified, none committed:

1. **Project documentation + tooling** — `CLAUDE.md`, four `docs/*.md`, and
   `tools/smoke-test.py`. Established the read-first / verify-with-screenshots loop.
2. **GPU segment filters** — removed the broken PCIe/OAM form-factor buttons (they hid
   12 of 42 families), added `Mobile`, moved `Form` to column 2.
3. **Unified filter bar** — one multi-select bar on all three tabs, replacing a confusing
   two-row design where the rows had the same labels but different behaviour. Found and
   fixed three unreachable Intel brands. Net 215 lines deleted, 157 added.
4. **Search extended to spec fields** — `sp5` and similar returned nothing; now indexes
   socket, TDP, PCIe, memory and tray ID, with whole-row highlighting.
5. **CSV importer** — `tools/import-specs.py`, built because data imports recur.
6. **Zen 6 / EPYC 9006 "Venice"** — 31 models across SP7 (9) and SP8 (22), imported from
   AMD's CSV, every field verified against source.

Final state: 8 AMD architectures, 46 SKU cards, 47 spec tables, 42 GPU families,
19 Intel architectures, zero JS errors, smoke test passing.

**Late catch worth knowing:** the importer had written `amd-cpu-specs.json` with 2-space
indent and literal Unicode, reformatting every untouched record — a 1409-line diff for a
469-line addition. Rewritten to match the file's original 4-space / `\uXXXX` style, so the
diff is now a clean 469-line pure addition with zero deletions. The importer was fixed to
preserve formatting, and the rule is documented in `docs/DATA-SCHEMA.md`.

### 2026-08-12 — Zen 6 / EPYC 9006 "Venice" added (first real data import)
Daniel supplied AMD's full Server Processor Specifications CSV (240 rows). Filtered to
`Series=EPYC 9006 Series` → 31 models, split across two sockets.

Modelled as one architecture (`zen6`, 2026) with **two SKU cards split by socket** —
Venice SP7 (9 models) and Venice SP8 (22 models) — because the spec files are keyed by
SKU name and the two sockets have genuinely different PCIe configs (x96 vs x128).

First real exercise of `tools/import-specs.py`. It needed two additions the synthetic
test hadn't surfaced: `--filter COL=VALUE` to select rows from a multi-series CSV, and
`--transform FIELD:NAME` for value cleanup. Three transforms now exist: `strip-amd`
(`AMD EPYC™ 9996` → `EPYC 9996`, matching every existing row), `up-to`, `tight-watt`.

Also worth noting the CSV's `Default TDP` column is empty for this series — the real
value is in `Default CPU Power`. The importer doesn't guess at import time, so this was
caught by reading the inspect output rather than by trusting a guess.

**Found and fixed a latent bug this data exposed:** `applyFilters()` recovered the SKU
name by splitting rendered card text on `/\d+\sSKUs/`. "Venice SP7" renders as
`Venice SP79 SKUs`, so the regex ate the trailing `7` and yielded `Venice SP` — matching
no spec key. Searching `EPYC 9996` returned nothing while `EPYC 9755` worked, because
"Turin" doesn't end in a digit. Now the card carries `data-sku-name` and nothing parses
rendered text. **Any future SKU name ending in a digit would have hit this.**

Verified: all 31 models field-by-field against the source CSV (cores, threads, clocks,
cache, TDP, socket, socket count, PCIe, memory, tray ID — exact matches). Smoke test
7→8 groups, 44→46 cards, 45→47 tables, zero JS errors. Searches for `sp7`, `sp8`,
`EPYC 9996`, `PCIe® 6.0` and `12800` all resolve to Zen 6.

**Open item:** the Zen 6 subtitle omits the process node and the codename table shows
`—` for it. AMD's CSV has no process column, so nothing was invented. Once Daniel
confirms the node, prepend it to the subtitle (`TSMC 2 nm · EPYC 9006 (Venice) · SP7 /
SP8`) and set `process` in the `zen6` codename-table row in `script.js`.

Files changed: `js/data/amd-data.json`, `js/data/amd-cpu-specs.json`, `js/script.js`,
`css/styles.css`, `index.html`, `tools/import-specs.py`.

### 2026-08-12 — Search extended to spec fields
Daniel found that searching `sp5` returned nothing despite 51 AMD models having an SP5
socket. Cause: the search index only pulled the model name from each spec record. Socket,
TDP, PCIe, memory and product ID were never indexed on any CPU tab.

Fixed by indexing five fields (`sk`, `tdp`, `pcie`, `mem`, `tr`) via a shared
`CPU_SEARCH_FIELDS` list plus `cpuModelSearchText()` / `cpuModelMatches()` helpers —
previously three separate copies of `m.n.toLowerCase()` had to be kept in sync.

Deliberately excluded raw numerics (cores, threads, clocks, cache): a bare `128` would
match core counts, thread counts and cache sizes at once.

Intel came along free (same code path). GPU needed its own fix — `form`, `tbp`, `bw` and
`pcie` were unindexed, so `OAM` and `1400 W` found nothing; also deleted a dead
`specs.consumer || specs.workstation` branch there.

Row highlighting now matches the whole row instead of only the model-name cell, and
covers GPU tables.

Verified against the data: `sp5` → exactly the 5 codenames with SP5 parts, 51 highlighted
rows = 51 SP5 models. Smoke test at baseline, zero JS errors.

Files changed: `js/script.js`, `css/styles.css`, `index.html`.

### 2026-08-12 — Intel filter bar + legacy filter code removed
Flipped Intel to the unified bar, which turned out to be more than a one-line change.

**Found a real bug while checking Intel's data first:** `intel-data.json` uses 8 brands
but `VENDOR_CONFIG.intel.brandTags` declared only 5. `Xeon 6+`, `Xeon D` and `Atom` had
no chip, so Clearwater Forest, Xeon D Embedded and Atom Embedded were unreachable by
brand filter. Same class of bug as the GPU form-factor issue: data values with no
corresponding UI. Added all three; each narrows to its one architecture as expected.
AMD was checked the same way and is clean.

With both vendors on the new bar the entire legacy path became dead code, so it's gone:
5 functions, the dispatcher, the empty `#legendToggles` div, and 30 orphaned CSS rules.

Added a `.stacked` variant — Intel's 12 chips wrapped around the vertical divider and
looked broken. Bars with >10 chips across multiple groups now give each group its own
row. AMD CPU (9 chips) and GPU (4) stay inline.

Verified all three tabs after the cleanup with identical results to before it: Intel
segments 8/9/8/6 groups, the three new brands each → 1 group, desktop+mobile+Core
multi-select, Clear restores 19/44. AMD CPU and GPU unaffected. Smoke test at baseline,
zero JS errors.

**Filter rework totals: 215 lines removed, 157 added.** Every tab gained multi-select
while the codebase shrank.

Files changed: `js/script.js`, `css/styles.css`, `index.html`.

### 2026-08-12 — Unified filter bar extended to the AMD GPU tab
Applied the CPU tab's filter bar to the GPU tab. Rather than copy it, refactored
`buildUnifiedFilters()` into a generic `buildFilterBar(groups)` that both tabs call —
CPU passes Segment + Brand, GPU passes Segment alone.

**GPU has no clean second axis.** The obvious candidate was `gpuSpecs.arch`, but the
values are unusable as filter tags: 112 of 244 models are `N/A`, and the rest are split
across trademark variants (`RDNA 3` vs `AMD RDNA™ 3`). So the GPU bar is one group.
Normalising `arch` would make a Generation filter viable later.

Two things found while doing this: the GPU legend row was **decorative only** — no click
handler, despite looking identical to the interactive CPU legend. And GPU segments were
single-select by construction (`activeGpuSegment` was a string). Changed to a Set, so GPU
segments are now multi-select for the first time.

Verified each segment individually (7 / 9 / 22 / 4), multi-select arithmetic
(datacenter+mobile = 11, +workstation = 20), Clear = 42, search composes, CPU tab rebuilds
correctly on tab switch, Intel untouched (9 legend items, 5 buttons, 0 chips). Smoke test
at baseline, zero JS errors.

Net: `js/script.js` shrank despite gaining a feature.

Files changed: `js/script.js`, `index.html`.

### 2026-08-12 — Unified filter bar (AMD CPU tab)
Collapsed the duplicated two-row filter UI into one multi-select bar. Daniel spotted that
"desktop / laptop / handheld / server" appeared twice on the AMD CPU tab.

Investigation found they weren't duplicates so much as a capable control and a crippled
one stacked together: the legend row was multi-select, the button row single-select, same
labels, no visual cue. Two legend selections also blanked the button row's active state.
Brands (Ryzen, Epyc, …) only ever existed in the legend row.

Chose option 4 of five brainstormed layouts: one row, two labelled groups (Segment /
Brand), everything multi-select, colour dots retained, contextual Clear chip.

Gated behind `unifiedFilters: true` in `VENDOR_CONFIG` so it applies to AMD only —
**Intel still uses the legacy two-row layout and was verified unchanged** (9 legend items,
5 filter buttons, 0 chips). Rolling it out to Intel later is a one-line flag flip plus a
decision about the GPU tab, which has the same duplication at smaller scale.

Verified: Desktop+Laptop = 32 cards (OR within group), +Epyc = 0 visible groups (AND
across groups — correct, Epyc is server-only), Clear restores 44, search still composes
with filters, state resets on vendor switch. Smoke test at baseline, zero JS errors,
screenshots checked at 1440px and 390px.

Files changed: `js/script.js`, `css/styles.css`, `index.html`.

### 2026-08-12 — GPU segment filters (first feature change)
Reworked GPU filtering per Daniel's direction. Removed the PCIe/OAM form-factor buttons
and legend pills; added `Mobile` as a fifth segment. Filters are now
All / Datacenter / Workstation / Consumer / Mobile.

Introduced `GPU_SEGMENTS` (single source of truth for legend + buttons) and
`gpuSegmentOf()` (derives `mobile` from form factors at render time, so new mobile
families self-categorise). Moved `Form` to the second column of GPU spec tables, added
`.gpu-form-cell`, bumped the cache-buster.

Verified: segment counts 7 + 9 + 22 + 4 = 42 — every family reachable, which was the whole
point of the fix (previously 12 were unreachable). Smoke test passes at baseline, zero JS
errors, screenshots confirm layout. Checked search still works with filters removed.

Found while fixing: the consumer/workstation table layouts have never been reachable
(missing data flags) — see Known issue #2. Confirmed against the pre-change build so it's
not a regression. Daniel chose option A: leave the shared layout, `Form` shows on all
GPU tables.

Files changed: `js/script.js`, `css/styles.css`, `index.html`.

### 2026-08-12 — Onboarding infrastructure
Set up the documentation and verification system. Created `CLAUDE.md`, `docs/WORKFLOWS.md`,
`docs/DESIGN-SYSTEM.md`, `docs/DATA-SCHEMA.md`, this file, and `tools/smoke-test.py`.

Audited the codebase against `docs/AUDIT-2026-02-14.md` and found that doc **stale** — most
of its critical performance items were already fixed. Replaced its role with this document.

Verified the smoke test both passes on a clean tree *and* fails correctly when a
deliberate error is injected into `render()` (exit 1, caught 6 pageerrors, counts → 0);
file restored afterwards.

Discovered and documented three previously unrecorded bugs: the GPU form-factor filter
hiding 12 of 42 groups, all 219 Intel CPUs flagged `_srv`, and the CRLF diff noise.

**No application code was changed** — docs and tooling only.

Next: pick from Suggested next steps.
