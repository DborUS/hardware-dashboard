# CLAUDE.md — Hardware Portal

Instructions for Claude when working on this repo. Read this first, every session.

---

## What this is

A static, zero-dependency dashboard visualising AMD and Intel CPU/GPU architectures on a
timeline. No build step, no framework, no package manager. Open `index.html` through a
local web server and it runs.

**Owner:** Daniel Bor (AMD FAE / Solutions Architect). Audience is technical — engineers
and customers who want to find a part and compare specs quickly.

**Live:** https://danchuborchik.github.io/hardware-dashboard/

---

## Golden rules

1. **Never invent hardware data.** Core counts, clocks, TDP, PCIe lanes, memory speeds and
   product IDs must come from a source Daniel provides or an official vendor page. If a
   value is unknown, leave the field out or ask — do not guess a plausible number. A wrong
   spec in front of a customer is the worst possible failure for this project.
2. **Datacenter first, always.** Every SKU list, table and summary runs datacenter →
   client → desktop → mobile, with the highest-performing part first inside a tier
   (Strix Halo above Strix Point). This dashboard exists for datacenter presales — a
   consumer part sitting above an EPYC part is a real defect, not a nitpick. Verify with
   `python3 tools/check-order.py`.
3. **Run the smoke test after every change.** `python3 tools/smoke-test.py` — see
   [Verifying your work](#verifying-your-work). No exceptions for "small" edits.
4. **Never commit or push.** Daniel runs all git commands. Make the edits, then give him
   the exact commands. See [Handing off](#handing-off).
5. **Match the existing style.** This project has a strong, consistent visual identity.
   New UI must look like it was always there. See `docs/DESIGN-SYSTEM.md`.
6. **Update `docs/PROJECT-STATE.md`** at the end of any working session, so the next
   session can pick up cleanly.

---

## Working efficiently here — read this before your first tool call

Lessons from the 2026-08-12 session. Each of these cost real time; none are obvious from
reading the code.

### 1. The sandbox's view of these files is UNRELIABLE. Windows is the authority.

The repo lives on a mounted Windows share. Reads through it can be **stale**, and writes
can **silently truncate or not land at all**.

Observed in one session: three docs were cut off mid-sentence by the `Edit` tool while
reporting success; a `.gitignore` append looked absent to the sandbox but was actually
present; `.git/config` appeared corrupted with null bytes but git on Windows parsed it
fine; a stale `.git/index.lock` was left behind and could not be deleted
(`Operation not permitted`).

**Rules that follow:**

- Write via `python3` in bash with an explicit read-back assertion, not the `Edit` tool:
  ```python
  open(p,'w',encoding='utf-8',newline='').write(out)
  assert open(p,'r',encoding='utf-8',newline='').read() == out
  ```
- After any edit, sanity-check with `wc -l` and `tail -1` — truncation cuts the tail.
- **When Daniel's terminal output contradicts your file reads, believe his terminal.**
  Do not send him on a repair errand for a problem that only exists in your view. This
  happened; he correctly called it out.
- Never leave a `.git/*.lock` behind. If a git command from the sandbox fails midway,
  tell Daniel immediately so he can remove it — you cannot.

### 2. Don't run git from the sandbox at all.

It fails on the mount and can leave locks. Make the edits; hand Daniel the commands.
He runs every git operation.

### 3. Match a data file's existing formatting exactly.

`js/data/*.json` are **4-space indent, `ensure_ascii=True`** (`\uXXXX` escapes). Writing
2-space or literal Unicode reformats every untouched record — a 469-line addition became
a 1409-line diff. `tools/import-specs.py` handles this; hand edits must too.

### 4. The recurring bug class: data values with no UI chip.

A tag present in the data but missing from `VENDOR_CONFIG` is **silently unreachable by
filter**. Hit three times (GPU form factors, then Intel `Xeon 6+` / `Xeon D` / `Atom`).
Check after any data change:

```bash
python3 - <<'EOF'
import json, re
d = json.load(open('js/data/intel-data.json'))
data = {s.get('brand') for a in d if 'era' not in a for s in a['skus'] if s.get('brand')}
cfg  = set(re.findall(r"tag: '([^']+)'", open('js/script.js').read()))
print("brands with no chip:", data - cfg or "none")
EOF
```

Corollary: **segment counts must sum to the total.** GPU 7+9+22+4 = 42. If they don't,
something is unreachable.

### 4b. Layout numbers: measure in the browser, never compute on paper.

Two separate bugs this session came from arithmetic that looked right:

- **Era diamonds sat off the timeline rail.** `left:` was hand-computed at four
  breakpoints and had drifted. Worse, a `::before` does **not** inherit the
  global `box-sizing: border-box`, so `width: 12px` + 2px borders was 16px.
- **Fixing it, I subtracted the parent's `padding-left`** — reasoning that an
  absolutely-positioned `::before` offsets from the padding box. It offsets from
  the **border** box. That put the diamond 4px the other way.

Both were only settled by reading the value back:

```js
getComputedStyle(el, '::before').left   // the truth
```

The rail geometry is now CSS variables on `.timeline` (`--rail-pad`, `--rail-x`,
`--rail-w`, `--rail-c`) and every marker derives
`left: calc(var(--rail-c) - var(--rail-pad) - size/2)`. **A breakpoint should
restate the rail, never a marker's position.** If you find yourself typing a
literal `left: -38px`, that is the bug returning.

`python3 tools/audit-layout.py` measures shared left edges, vertical rhythm,
overflow, clipped text and touch-target sizes on every tab and width. Run it
after any layout change — it found five real issues the eye had passed over.

### 5. Verify against the source data, not against the rendered page.

The page happily renders wrong data. After an import, diff every field back against the
CSV. After a filter change, check the arithmetic (does datacenter+mobile really equal
11?). "It looks right" is not verification.

### 5b. Counts pass while the layout is wrong. Read the screenshot.

This has now bitten four times, and every time the numbers were green:

| Symptom | Counts said | Screenshot showed |
|---|---|---|
| Brand sub-headings rendered *below* their cards | correct | wrong order |
| GPU cards restated their block header verbatim | correct | redundant |
| Ryzen era dividers labelled by tier | 3 eras, correct | Threadripper 7000 under "mainstream Ryzen" |
| Era diamonds off the rail | n/a | visibly misaligned |

`--shots` then actually open the PNGs. A passing count means the data flowed, not
that the page reads correctly.

### 6. Check whether a "bug" is cosmetic or a correctness problem — say which.

Daniel triages on this distinction. The GPU table-layout issue was cosmetic (all values
accurate, columns merely generic) and he closed it in one message. Intel `_srv` was a
correctness issue and stayed open. Lead with that classification.

### 7. Bump the cache-buster after any JS/CSS change.

`index.html` has `js/script.js?v=YYYYMMDD-tag`. Without bumping it Daniel hard-refreshes
and sees nothing change. It also doubles as a diagnostic: if view-source shows an old
version string, he's loading a different directory than you edited.

### 7b. Derive taxonomy from data; a hand-typed grouping will rot.

The EPYC "Platform" filter grouped codenames via a literal
`DENSE = {'Turin Dense', 'Bergamo'}` in the generator. It was *correct*, which is
what made it dangerous — nothing enforced it, 9 of 12 codenames fell into the
catch-all, and a new dense SKU would have landed silently in the wrong bucket.
Daniel asked what it represented and it did not survive the question.

Same class of bug, same session: `socket_of()` fell back to `'SP5'` when a
subtitle named no socket, silently mislabelling Milan / Rome / Naples (all SP3)
and leaving the SP3 chip dead. Both now read the spec data, and `socket_of()`
raises rather than guessing.

**Rule:** if a grouping can be computed from `js/data/*.json`, compute it. If it
cannot, ask. A literal in the generator is a claim you are making without a
source — see golden rule #1.

### 8. Ask before inventing a value, always.

The Zen 6 process node wasn't in AMD's CSV. Putting "2 nm" in from general knowledge
violated golden rule #1; it was removed and left blank until Daniel confirmed it. Blank
is fine. Wrong is not.

---

## Architecture in one pass

Three files do everything:

| File | Lines | Role |
|---|---|---|
| `index.html` | ~96 | Static shell — empty containers that JS fills |
| `css/styles.css` | ~840 | All styling, tokens, animations, responsive rules |
| `js/script.js` | ~1600 | Bootstrap, data loading, vendor switching, shared helpers |
| `js/intel-v2.js` | ~870 | Intel — generation-first renderer |
| `js/amd-v2.js` | ~935 | AMD — product-first renderer. **GENERATED**, see below |

Shared helpers live in `js/script.js` because it loads last and both renderers
see it: `escHtml()`, `stripVendor()`, and the whole core-range slider
(`coreTotal`, `coreStops`, `coreRangeInit/Match/Html/Paint/Wire`).

> **`js/amd-v2.js` is generated by `tools/gen-amd-v2.py`.** Its taxonomy is
> derived from `js/data/*.json`, so codenames, model counts and sockets are read
> from the data rather than typed by hand. Edit the generator and re-run it;
> hand edits to the `A2_DATA` half of the file will be overwritten. The renderer
> half below `A2_DATA` is hand-written and is concatenated in by the generator.

Data lives in `js/data/*.json` and is fetched at runtime. See `docs/DATA-SCHEMA.md`.

`cpu-architecture-roadmap.html` (279 KB) is a **dead file** — the original single-file
version, kept as history. Nothing links to it. Don't edit it; don't let its existence
confuse you.

### Two product-first renderers, one DOM

**Both vendors are now product-first**, each with three sub-tabs:

| Vendor | Renderer | Sub-tabs | Block level |
|---|---|---|---|
| AMD | `a2Render()` in `js/amd-v2.js` | EPYC · Ryzen · GPU | product series |
| Intel | `v2Render()` in `js/intel-v2.js` | Xeon · Client · Graphics | generation |

They share the same DOM nodes — `#timeline`, `#searchInput`, `#filterControls`,
the toolbar — and exactly one owns them at a time.

```
switchVendor('intel')  ->  a2Deactivate(); v2Activate()   adds .intel-v2 to <body>
switchVendor('amd')    ->  v2Deactivate(); a2Activate()   adds .amd-v2 to <body>
```

**AMD is organised by product name, not by Zen generation** (changed 2026-08-26).
A customer asks for an EPYC 9005 or a Ryzen AI 400, not for "a Zen 5 part". The
Zen generation is still on every card, so nothing is lost.

Why product-series-first is the correct nesting: **several codenames span two
series.** Phoenix ships as both Ryzen 7000 and Ryzen 8000; Dragon Range spans
7000 and 8000. Series -> codename lets a codename appear under each series that
actually sells it, which codename-first cannot express.

> **`render()` and `renderGpu()` in `script.js` are now dead for normal
> navigation.** They are retained (along with `applyFilters()`, the codename
> table and the legacy filter bar) but nothing routes to them. Treat them as
> legacy; don't build on them.

The shared listeners in `script.js` check `v2IsActive()` and early-return:

```js
if (typeof v2IsActive === 'function' && v2IsActive()) { v2ExpandAll(true); return; }
```

> **Adding a toolbar control? Wire both paths.** A button that only calls the AMD
> function will silently do nothing on the Intel tab.

Why two renderers: Intel needs generation → codename nesting with per-tab column sets
and brand-line sub-headings. AMD's Zen generations map 1:1 to codenames and need none
of it. Forcing both through one function meant flags everywhere — the P-core/E-core
columns leaking onto AMD tables was exactly that failure.

**Intel currently has no spec data.** Tables render their real column set with an empty
body, pending the bulk CSV import. `js/data/intel-*.json` still hold 275 models and are
not yet wired to the new structure.

---

### The one mental model that matters

**Render once, then filter with CSS classes.** This is the single most important
convention in the codebase, and it is load-bearing for performance.

- `render()` builds the *entire* DOM for the active vendor/tab — every architecture,
  every SKU card, unconditionally. It does not know about filters.
- `applyFilters()` then toggles a `.hidden` class on elements that shouldn't show.
- Search, segment filters and brand filters all route through `applyFilters()` — they
  **never** re-render.

This was a deliberate rewrite (v0.3.0) that cut filter time from ~300–500 ms to under
5 ms. If you add a feature that calls `render()` on every keystroke, you have undone it.

**How filtering knows what to hide:** `render()` stamps metadata onto each `.arch-group`
as data attributes, and `applyFilters()` reads only those attributes:

```js
group.dataset.segments   = "desktop,server"     // union of SKU tags
group.dataset.brands     = "Ryzen,Epyc"         // union of SKU brands
group.dataset.searchText = "zen 5|turin|..."    // pre-lowercased haystack
group.dataset.gpuSegment = "consumer"           // GPU only (see gpuSegmentOf)
```

> **If you add a new filter dimension, you must do both halves:** stamp the attribute in
> `render()` / `renderGpu()`, and read it in `applyFilters()`. Doing only one is the most
> likely bug in this codebase.

### Execution flow

```
script.js loads (bottom of file, lines ~1202+)
  initDomCache()              cache element refs into `dom`
  setupRowSelectionHandlers() one delegated click listener for spec-table rows
  wire search / expand / collapse / clear buttons
  switchVendor('amd')         ← entry point

switchVendor(v)
  reset state, fetch JSON (cached in dataCache), build chrome, render()

render()
  timeline.innerHTML = ''     ← the ONLY full teardown
  build every .arch-group, stamp data attributes
  applyFilters()              ← always called at the end
```

### State

Module-level globals near the top of `script.js`:

```js
let currentVendor  = 'intel';   // 'intel' | 'amd'   (init overrides to 'amd')
let currentTechTab = 'cpu';     // 'cpu' | 'gpu'
let expandedGroups = new Set(); // arch ids currently open
let activeSegmentTags = new Set();   // CPU segment chips
let activeBrandTags   = new Set();   // CPU brand chips
let activeGpuSegments = new Set();   // GPU segment chips — empty means "show all"
let filterBarGroups   = [];          // group descriptors for the active unified bar
```

**Filter UI:** every tab uses one multi-select bar built by `buildFilterBar(groups)` —
CPU tabs pass Segment + Brand, the GPU tab passes Segment. Within a group tags are OR'd;
groups are AND'd. An empty set means no constraint, so there is no All button; a
`Clear filters` chip appears once anything is selected. Bars with >10 chips across
multiple groups get a `.stacked` class (one row per group) — Intel has 12.

> **When adding a tag to the data, add its chip to `VENDOR_CONFIG` too.** Values with no
> chip are unreachable by filter. This has bitten the project twice: GPU form factors and
> three Intel brands (`Xeon 6+`, `Xeon D`, `Atom`). Check with:
> `set(brands in data) - set(brands in VENDOR_CONFIG)` — it should be empty.

`expandedGroups` survives re-render (it's read during render); everything visual does not.

### Persistence

User links go to `localStorage`, keyed by vendor + arch id:

- `roadmap-links-{vendor}-{archId}` — JSON array of `{label, url}`

Per-architecture notes were removed on 2026-08-26 at Daniel's request. Any
`roadmap-notes-*` keys left in a browser are inert.

Defaults come from `arch.defaultLinks` when nothing is stored. Note this means **a user's
saved links shadow the defaults permanently** for that arch — editing `defaultLinks` in
JSON won't show up for anyone who has already customised that architecture.

---

## Verifying your work

You cannot see the browser. Run this instead — it loads the real page, clicks through
every tab, and reports counts plus JS errors:

```bash
python3 tools/check-order.py           # datacenter-first SKU ordering
python3 tools/smoke-test.py            # pass/fail, exit code 0/1
python3 tools/smoke-test.py --shots    # also writes tools/screenshots/*.png
```

With `--shots`, **read the PNGs** to confirm layout actually looks right. Counts passing
does not mean the page looks correct.

First-time setup in a fresh sandbox (see `docs/WORKFLOWS.md` for the corporate-proxy
specifics, which are fiddly):

```bash
pip install playwright
export NODE_OPTIONS="--use-system-ca"          # required behind Zscaler
python3 -m playwright install chromium-headless-shell
```

Expected baseline on a clean tree:

```
amd_cpu_groups 7 · amd_cpu_skus 44 · amd_gpu_groups 42
intel_cpu_groups 19 · intel_cpu_skus 44 · spec_tables 45 · JS errors none
```

---

## Handing off

Git commands fail from the sandbox on Daniel's mounted Windows folder, and he prefers to
review before anything lands. So: **edit files, then hand over commands.**

````
Changes are in. To review and commit:

```powershell
cd C:\Users\dbor\dev\hardware-dashboard
git diff
git add -A
git commit -m "Add Zen 6 architecture entry"
```
````

Only mention `git push` when he's ready to publish — push updates the live site.

### CRLF warning

The working tree is CRLF; the repo stores LF. **A fresh clone can show every file as
modified when nothing changed.** Verify real changes with:

```powershell
git diff --stat --ignore-all-space
```

If that reports nothing, the diff is pure line-endings — don't commit it. A permanent fix
is `git config core.autocrlf true`, but confirm with Daniel before changing his git config.

---

## Conventions to follow

**JavaScript**
- Vanilla ES6+, no imports, no build. Everything is global by design.
- Template literals build HTML; `innerHTML` assigns it. That's the established pattern —
  match it rather than introducing `createElement` chains in the middle of it.
- Inline `onclick="..."` handlers are the norm here (16 of them). Keep them consistent
  rather than mixing paradigms, *unless* you're deliberately refactoring that whole area.
- Escape any user-controlled string with `escHtml()` before interpolating.
- Section headers use the `// ═══` banner style. Keep it.
- JSDoc on new non-trivial functions.

**CSS**
- Six tokens in `:root` (see `docs/DESIGN-SYSTEM.md`). Use them; don't hardcode greys.
- Per-architecture accent colour arrives as `--arch-color`, set inline by JS.
- Animate `opacity` and `transform`. Avoid animating `max-height` — the audit flagged it
  as a reflow trigger and it's still true.
- Three breakpoints exist: 768 / 640 / 375 px. Add to them, don't invent a fourth.

**Data**
- 2-space indent, matching existing files.
- **Order SKUs datacenter → client → desktop → mobile, flagship first within a tier.**
  Daniel's audience is datacenter presales; server parts lead every list. Arrays render
  in file order — there is no sort in `render()`, so file order is the contract.
  Check with `python3 tools/check-order.py`. See `docs/DATA-SCHEMA.md`.
- Validate before handing off: `python3 -m json.tool js/data/<file>.json > /dev/null`

---

## Known issues

Verified against the current code on 2026-08-27.

**12 dead Intel filter chips.** Tracked in `KNOWN_DEAD_CHIPS` in the smoke test,
so they report but don't fail. Two causes: 7 Xeon chips (`Xeon 5`, `Xeon 4`,
`Xeon 3`, `Xeon 2`, `Xeon 1`, `Silver`, `Bronze`) and 5 Client chips
(`Series 3/2/1`, `Core X`, `Atom / N`) whose chip label doesn't string-match the
block's `name`. E.g. the chip says `Xeon 5`, the block is named
`Xeon 5 (5th Gen Scalable)`, and the filter does an exact match. **The sidebar
now makes these self-evident** — they render dimmed with a blank count instead of
looking clickable. Awaiting Daniel's call on whether to rename chips or blocks.

**`check-order.py` fails on two architectures, and both are invisible.** Zen 4
Phoenix and Raptor Lake 14th Gen Xeon E / W-2400. Since the v2 renderers took
over, neither `amd-data.json` nor `intel-data.json` supplies SKU *order* to the
page — see the scope note at the top of the script. Treat as data hygiene, not a
rendering defect.

**Intel Client and Graphics have no spec data.** Deliberate — Daniel is building
the framework first. `intel-cpu-specs.json` still holds 275 models under the old
SKU keys. The core-range slider correctly renders nothing on those tabs and will
appear on its own when the data lands.

**GPU consumer/workstation table layouts — WON'T FIX, don't re-raise.** Cosmetic
only; every displayed value is accurate. Reviewed and closed 2026-08-12.

**`getLinks()` doesn't validate parsed JSON** (`JSON.parse` returned unchecked).
Low severity, self-inflicted only.

**Dead files** the sandbox cannot delete on the mount — hand these to Daniel:
`js/amd-v2-data.js` (stale build intermediate), `intel-v2.html` (redirect stub),
`cpu-architecture-roadmap.html` (279 KB original single-file version).

**Legacy code retained but unreachable:** `render()`, `renderGpu()`,
`applyFilters()`, `buildFilterBar()`, `buildCodenameTable()` and the tech-tab
switcher in `js/script.js`. Nothing routes to them. Don't build on them; don't
be misled by them when reading the file.

`docs/AUDIT-2026-02-14.md` is **stale** — read `docs/PROJECT-STATE.md` instead.

## Working with Daniel

- Concise, technical, bullet-heavy. He knows the hardware domain deeply — don't explain
  what an EPYC part is. He's newer to git, so spell those steps out.
- Accuracy over speed. Verify rather than assert.
- Say what changed and what you verified; skip the preamble.
- Flag uncertainty explicitly rather than presenting a guess as fact.

---

## Doc map

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file — start here |
| `docs/PROJECT-STATE.md` | Living status + session log. **Read second, update last.** |
| `docs/WORKFLOWS.md` | Step-by-step recipes for common tasks |
| `docs/DESIGN-SYSTEM.md` | Colours, type, spacing, component patterns |
| `docs/DATA-SCHEMA.md` | JSON contracts + **SKU ordering rule** for every data file |
| `docs/MOBILE-TESTING.md` | Existing mobile test notes |
| `docs/AUDIT-2026-02-14.md` | Historical audit — largely superseded |

### Tooling

| Tool | Purpose |
|---|---|
| `tools/smoke-test.py` | The gate. Counts, chip health, core slider, JS errors. `--shots` for PNGs |
| `tools/audit-layout.py` | Alignment, rhythm, overflow, clipped text, touch targets |
| `tools/gen-amd-v2.py` | **Generates `js/amd-v2.js`** from the data + `tools/amd-v2-renderer.js` |
| `tools/check-order.py` | Datacenter-first ordering. **Read its scope note** — it audits files that no longer render |
| `tools/import-specs.py` | AMD CSV → specs JSON, format-preserving |
| `tools/import-xeon-specs.py` · `assign-xeon-codenames.py` | The Xeon ARK pipeline |
| `tools/mockups/*.html` | Rejected design options, kept for reference |

> **`js/amd-v2.js` is generated.** Edit `tools/gen-amd-v2.py` (the `A2_DATA`
> taxonomy) or `tools/amd-v2-renderer.js` (the renderer half), then re-run
> `python3 tools/gen-amd-v2.py`. Hand edits to `js/amd-v2.js` are lost.
