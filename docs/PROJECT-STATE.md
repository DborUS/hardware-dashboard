# Project State

**Living document.** Read after `CLAUDE.md`; update at the end of every working session.
This is how a new session picks up without re-deriving everything.

**Last updated:** 2026-08-27 (session close — UI overhaul)
**Current version:** 0.4.0 — both vendors product-first, sidebar filters, compact header
**Health:** Good — all six sub-tabs render, zero JS errors, smoke test PASS
**Committed:** through `4002201`. Confirm with Daniel that anything after the
marker-centring commit has landed before building on top.

> **A stale `.git/index.lock` blocked Daniel's commit this session.** It came from
> git commands I ran in the sandbox, which `CLAUDE.md` forbids for exactly this
> reason. If a commit fails with *"Unable to create index.lock: File exists"*, the
> fix is `Remove-Item .git\index.lock` after confirming no git is running. **Don't
> run git from the sandbox at all** — read the repo with `ls` / `cat` instead.

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

Measured 2026-08-27 by `tools/smoke-test.py`. **Model counts are the load-bearing
assertions** — they are what catches a restructure silently dropping data.

| Check | Value |
|---|---|
| AMD EPYC series / cards / models | 6 · 12 · **162** |
| AMD Ryzen series / cards / models | 19 · 34 · **478** |
| AMD GPU series / cards / models | 42 · 42 · **258** |
| Intel Xeon generations / cards / models | 11 · 33 · **553** |
| Intel Client generations / cards | 11 / 47 (no spec data by design) |
| Intel Graphics generations / cards | 4 / 12 (no spec data by design) |
| Core-slider stops — AMD EPYC / Intel Xeon | 20 / 36 |
| Filter chips exercised | 92 across six sub-tabs |
| Known-dead chips (tracked, non-failing) | 12, all Intel |
| JS errors | none |

**Layout invariants** (`python3 tools/audit-layout.py`):

| Check | Value |
|---|---|
| Timeline dot offset from rail | 0.00px, all tabs, 5 widths |
| Era diamond offset from rail | 0.00px, all tabs, 5 widths |
| Horizontal overflow | none at 1440 / 1024 / 390 |
| Clipped text | none |
| Chrome above the timeline | 167px AMD (was 403px) |

Also verified working: search narrows correctly (`9575F` → 1 group, so SKU-level search
reaches into spec tables), expand/collapse, vendor and tech tab switching, row selection.

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

### 8. Dead file
`cpu-architecture-roadmap.html` (279 KB) — the original single-file version. Nothing links
to it. Delete or move to `archive/` when convenient.

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

**Repo moved 2026-08-12.** Origin is now Daniel's AMD EMU account:
`https://github.com/DborUS/hardware-dashboard.git` (private). The old personal repo
`DanchuBorchik/hardware-dashboard` still holds the pre-2026-08-12 history and is the
rollback safety net — don't delete it. Local `user.email` is set to `Daniel.Bor@amd.com`
for this repo; the 29 pre-existing commits still carry the old personal Gmail, which was
accepted rather than rewritten.

**Credential gotcha:** pushing may fail with 403 if Windows hands over a cached
`DanchuBorchik` credential. Fix is Credential Manager → Windows Credentials →
`git:https://github.com` → Remove, then push and sign in as `DborUS`.

---

## Suggested next steps

Ordered by value, with the blocking question named.

### 1. Intel Client + Graphics spec data — the one real blocker

Both tabs render their real column sets with empty bodies, by design. Daniel is
preparing the data separately. `intel-cpu-specs.json` holds 275 models under the
*old* codename keys; `V2_SPECS` is keyed by the `name` in `V2_DATA`. When the data
lands, `v2LoadSpecs()` picks it up from `js/data/intel-<tab>-specs.json` with no
code change, and the core-range slider appears on its own.

### 2. The 12 dead Intel chips — needs Daniel's call

Chip label vs block `name` mismatch, e.g. chip `Xeon 5` vs block
`Xeon 5 (5th Gen Scalable)`. Two fixes: shorten the block names, or make the chips
match the full names. Both are mechanical; the choice is editorial. The sidebar
already shows them dimmed with a blank count, so they no longer mislead.

### 3. Housekeeping Daniel must do (sandbox can't delete on the mount)

```powershell
Remove-Item js\amd-v2-data.js      # stale build intermediate
git rm intel-v2.html               # redirect stub
git rm cpu-architecture-roadmap.html   # 279 KB dead original
```

### 4. Optional polish

- **Sticky header** — never answered. At 167px it is cheap to pin, and navigation
  would stay reachable deep in a long timeline.
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

The prototype is now the Intel tab. `intel-v2.html` is a redirect stub (sandbox cannot
delete on the mount — **run `git rm intel-v2.html`**).

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

**Hosting note:** `danchuborchik.github.io` still serves a **February** build
(`v=20260215-2125`). The AMD repo `DborUS/hardware-dashboard` has no Pages site — 404.
No live URL reflects current work, and nothing since 2026-08-13 is committed.

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
