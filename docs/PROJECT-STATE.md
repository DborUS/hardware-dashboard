# Project State

**Living document.** Read after `CLAUDE.md`; update at the end of every working session.
This is how a new session picks up without re-deriving everything.

**Last updated:** 2026-08-12 (session closed)
**Current version:** 0.3.0 + unreleased work
**Health:** Good — all tabs render, zero JS errors, smoke test passes
**Committed:** yes — 2026-08-12's work landed as `104c4bd` (day's work) and `e45f93a`
(ignore bytecode), plus a `.gitignore` commit. Remote moved to `DborUS/hardware-dashboard`.
Confirm with Daniel that the push to the new remote succeeded before building on top.

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

Measured 2026-08-12 by `tools/smoke-test.py` against a clean tree:

| Check | Value |
|---|---|
| AMD CPU architectures | 8 |
| AMD CPU SKU cards | 46 |
| AMD GPU families | 42 (consumer 22 · workstation 9 · datacenter 7 · mobile 4) |
| Intel CPU architectures | 19 |
| Intel CPU SKU cards | 44 |
| Spec tables after Expand All | 47 |
| JS errors | none |

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

### 4. Notes textarea not escaped
`script.js:664` interpolates `${loadNotes(arch.id)}` raw. A note containing `</textarea>`
breaks the markup. Self-inflicted only. One-line fix with `escHtml()`.

### 5. `getLinks()` doesn't validate parsed JSON
`script.js:1174` returns `JSON.parse` output unchecked. Low severity, self-inflicted only.

### 6. Content gap — AMD CPU coverage
8 AMD architectures vs 19 Intel (Zen 6 added 2026-08-12). Still thinner than Intel, though
AMD now has 46 SKU cards vs Intel's 44.

### 7. Dead file
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

### 1. Reconnect Intel spec data — the blocker

The Intel tab renders structure with **empty tables by design**. `intel-cpu-specs.json`
holds 275 verified models under the *old* codename SKU keys; `V2_DATA` in
`js/intel-v2.js` uses new generation→codename keys. Nothing bridges them.

Daniel is preparing the data separately. When it arrives:

1. Add a `specKey` to each family in `V2_DATA` naming its entry in the specs JSON.
2. Teach `v2Card()` to read `INTEL_CPU_SPECS[specKey]` and emit rows instead of the
   `.v2-empty-row` placeholder. The column sets already exist in `V2_COLUMNS`.
3. Mind the Graphics tab — its columns resolve per brand line via `v2Columns(tier)`,
   so the row builder must too.
4. Restore a model-count assertion in `tools/smoke-test.py` once data flows.

Mapping notes for the existing 275: several old keys split across new blocks. Known
cases are `Raptor Lake-U Refresh` (2xx parts → Series 2, 1xx → Series 1) and the Xeon W
entries, which move out of `Raptor Lake (14th Gen)` into the `Xeon W` block.

### 2. Two ordering violations in AMD data

`python3 tools/check-order.py` fails on:

- **Zen 4** — `Phoenix` (desktop+laptop+pro) sits after `Dragon Range` (laptop).
  Arguable: tagged desktop but really a mobile-first part. Needs Daniel's call.
- **Raptor Lake (14th Gen)** — `Xeon E` and `Xeon W-2400/2500` are last, below consumer
  parts. Clear violation. Likely resolves itself during the Intel data migration, since
  those move to the Xeon sub-tab.

### 3. Known small fixes

- Escape the notes textarea (`script.js`) — a note containing `</textarea>` breaks markup.
- Validate `getLinks()` JSON.parse output.
- `git rm intel-v2.html` — redirect stub, sandbox cannot delete on the mount.
- `cpu-architecture-roadmap.html` (279 KB) is dead; nothing links to it.

### 4. Accessibility

Arch headers and SKU cards are keyboard-operable with focus-visible styles. Untested
with a real screen reader, and the new Intel sub-tabs use `role="tablist"` without
arrow-key navigation.

### 5. Content and hosting

- **AMD coverage is thin** — 8 architectures. Needs Daniel's source data.
- **No live site reflects current work.** `danchuborchik.github.io` serves a February
  build; `DborUS/hardware-dashboard` has no Pages site (404). Enabling Pages on the AMD
  repo is ~2 minutes in Settings, if EMU policy allows it.
- `README.md` still cites the old repo URL and old live site.
- Decide what happens to the old public repo — archiving keeps history, read-only.

---

## Session log

Newest first. One short entry per session — what changed, what was verified, what's next.

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
