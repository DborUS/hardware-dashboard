# Intel Tab Restructure — Plan

Daniel's proposal (2026-08-14): stop using codename as the top-level block. Organise by
**generation → core tier → codename**.

Status: **planning only, nothing built.** Decisions still open at the bottom.

---

## Why the current structure is failing

The Intel tab has 20 top-level entries that mix four incompatible concepts:

| Concept | Count | Examples |
|---|---|---|
| Generation | 5 | `Raptor Lake (14th Gen)`, `Comet Lake (10th Gen)` |
| Codename | 13 | `Meteor Lake`, `Granite Rapids`, `Lunar Lake` |
| Brand line | 2 | `Xeon D (Embedded)`, `Atom (Embedded)` |

That inconsistency is why the last two imports needed judgement calls:

- **Tiger Lake has nowhere to go.** 37 of the new 11th-gen parts are 10 nm SuperFin
  mobile — Tiger Lake — but the dashboard only has `Rocket Lake (11th Gen)`, which is the
  14 nm desktop side. Two codenames, one generation, one slot.
- **Core X-series (38 SKUs) has nowhere to go.** It spans 32 nm to 14 nm across four
  HEDT generations and doesn't fit a codename block or a generation block.
- **Ice Lake needed a card invented** for a single i3-1005G1 that lives inside ARK's
  "10th Generation" collection but is 10 nm, not 14 nm.
- **`Arrow Lake` and `Arrow Lake Refresh`** are separate top-level entries for what is
  one generation.

Every new export creates another of these. The structure doesn't scale.

---

## What the data actually supports

Measured across all current exports — **251 distinct SKUs**:

| Generation | SKUs | Tiers present |
|---|---|---|
| Core Ultra Series 2 | 50 | Core Ultra |
| Core Ultra Series 1 | 40 | Core Ultra |
| Core X-series | 38 | Core X |
| Core Ultra Series 3 | 30 | Core Ultra |
| 10th Gen | 68 | i3, i5, i7, i9 |
| 11th Gen | 56 | i3, i5, i7, i9 |
| Xeon 6+ | 8 | Xeon |

**ARK's `Product Collection` field already encodes generation + tier**
("11th Generation Core i5 Processors"), so the grouping can be derived from the source
data rather than hand-maintained. That's the strongest argument for this model: the
import stops needing a hand-written rules file.

---

## Proposed structure

Three levels instead of two.

```
GENERATION            (timeline block, replaces today's "architecture")
  └─ TIER             (new grouping row: Core i3/i5/i7/i9, Core Ultra, Xeon, Atom)
       └─ CODENAME    (today's SKU card — Rocket Lake-S, Tiger Lake-H, …)
            └─ spec table
```

Worked example:

```
11th Gen  (2020–2021)
  ├─ Core i9  →  Rocket Lake-S (5)      Tiger Lake-H (3)
  ├─ Core i7  →  Rocket Lake-S (5)      Tiger Lake-H (9)   Tiger Lake-U (5)
  ├─ Core i5  →  Rocket Lake-S (9)      Tiger Lake-H (7)   Tiger Lake-U (6)
  └─ Core i3  →  Tiger Lake-U (7)
```

Both Rocket Lake and Tiger Lake sit under 11th Gen without either being subordinate to
the other — which is the thing that can't be expressed today.

### What this fixes

- Tiger Lake and Core X-series get a home without inventing a parallel hierarchy.
- Generation is how customers actually ask ("what's the 13th gen equivalent?").
- Tier is how they narrow ("the i7 part").
- Codename survives where it's genuinely useful — on the card and in search.
- Import rules become mostly derivable from `Product Collection`.

### What it costs

- **`renderIntel()` needs a third nesting level.** Today `render()` does
  architecture → SKU card → table. This adds a tier row between.
- **Divergence from AMD.** AMD's Zen generations map cleanly to codenames, so it doesn't
  need this. The two vendors would render differently — acceptable if `render()` stays
  shared and the extra level is opt-in per vendor, the way `unifiedFilters` is.
- **Server parts don't have generations in the same sense.** Granite Rapids, Sierra
  Forest, Emerald Rapids and Sapphire Rapids are Xeon 6 / Xeon 5 / Xeon 4 — a parallel
  numbering. They'd group under a `Xeon` tier by Xeon generation, not Core generation.
- **`localStorage` keys are `roadmap-notes-{vendor}-{archId}`.** Changing arch IDs
  orphans any notes or links saved against the old ones.

---

## Three ways to implement

### Option A — Restructure the data, keep the renderer
Rewrite `intel-data.json` so each generation is one architecture entry and each
tier+codename pair is a SKU card (`Core i7 — Tiger Lake-H`). No JS changes at all.

- **Pro:** zero renderer risk; ships today; reversible.
- **Con:** tier is only a naming convention, not a real grouping — no per-tier collapse,
  and the SKU grid gets long (11th Gen would have ~10 cards).

### Option B — Add a real tier level to the renderer
Data gains a `tiers` array; `render()` gains a nesting level, gated per vendor.

- **Pro:** the structure Daniel described, properly. Collapsible tiers, cleaner filtering.
- **Con:** touches the most load-bearing function in the codebase. Needs care with the
  render-once/filter-with-CSS model — `applyFilters()` would need to hide empty tiers the
  way it already handles orphan era separators.

### Option C — Keep codename blocks, add a generation filter chip
Leave the timeline alone; add a `Generation` filter group (10th, 11th, 12th…).

- **Pro:** smallest change; the filter bar already supports multiple groups.
- **Con:** doesn't fix the actual problem — Tiger Lake still has no block to live in.

**Recommendation: A first, then B if it proves out.** Option A gets Tiger Lake and Core
X-series imported this week and lets Daniel judge the generation-first layout against
real data. If it reads well, B is a contained follow-up that upgrades the same data
model. Doing B first risks a large renderer change based on a structure nobody has used
yet.

---

## Open questions

1. **Where do server parts sit?** Granite Rapids et al. don't have a Core generation.
   Suggest a `Xeon` top-level group ordered by Xeon generation (Xeon 6+, Xeon 6, Xeon 5,
   Xeon 4), parallel to the Core generations rather than mixed in.

2. **How far back?** Exports currently reach 10th Gen. Do older generations get added, or
   is 10th Gen the floor?

3. **Core X-series** — one block, or split by underlying generation? It spans 32–14 nm.

4. **Tier granularity.** Separate i3/i5/i7/i9, or one "Core" tier with the distinction
   left to the model name? Four tiers × several codenames could get sparse.

5. **Do saved notes matter?** Restructuring changes arch IDs. If any notes or links have
   been saved against Intel entries, they'd be orphaned. A migration is possible but
   only worth it if anything's actually stored.

---

## Suggested sequence

1. Agree the answers above.
2. Build the new `intel-data.json` shape for **one generation** (11th Gen — it has the
   Tiger/Rocket split that motivates this) and look at it rendered.
3. If it reads well, convert the rest and import the backlog: 68 × 10th Gen,
   56 × 11th Gen, 38 × Core X.
4. Revisit Option B once there's real data to judge it against.
