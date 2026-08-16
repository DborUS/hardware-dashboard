# Intel Data Request — what to put in the table

Companion to `docs/INTEL-AUDIT-2026-08-13.md`. This is the list of families that need
spec rows, and the exact format to supply them in.

---

## The one column format for everything

One table, one row per CPU model, with a `Family` column telling me which SKU card each
row belongs to. That's easier than making a table per family, and I split it on import.

| Column | Required | Example | Notes |
|---|---|---|---|
| `Family` | **yes** | `Clearwater Forest` | Must be one of the keys in the lists below, exactly |
| `Name` | **yes** | `Xeon 6990E+` | Drop the "Intel®" prefix; I can strip it if it's there |
| `Cores` | yes | `288` | |
| `Threads` | yes | `288` | |
| `Boost` | yes | `3.2 GHz` | |
| `Base` | yes | `2.2 GHz` | |
| `Cache` | yes | `576 MB` | L3 |
| `TDP` | yes | `450W` | No space before W, to match existing rows |
| `Socket` | yes | `LGA 4710` / `LGA1851` / `BGA2049` | |
| `SocketCount` | server only | `1P / 2P` | Leave blank on client parts |
| `PCIe` | server only | `PCIe 5.0 x96` | Leave blank on client parts |
| `Memory` | server only | `Up to 8000 MT/s` | Leave blank on client parts |
| `iGPU` | client only | `Intel Arc 140T` | Leave blank on server parts |
| `iGPU_Cores` | client only | `12` | Xe-core count |
| `iGPU_Freq` | client only | `2.0 GHz` | |
| `TrayID` | optional | `CM8071505093102` | Nice to have, not essential |

**Blank is fine.** An omitted field renders blank; a wrong one renders a wrong spec.
Leave anything you can't source empty rather than estimating.

CSV, XLSX or a pasted markdown table all work.

---

## Priority 1 — wrong or missing right now (~30 rows)

These are the ones that actively misrepresent the current lineup.

### 1. Clearwater Forest — REPLACE existing data
`Family` = **`Clearwater Forest`**

Currently holds 5 pre-launch estimate rows. The shipped lineup is 4 SKUs. I already
scraped the headline figures from ARK and they're confirmed:

| Name | Cores | Boost | Base | Cache | TDP |
|---|---|---|---|---|---|
| Xeon 6960E+ | 144 | 3.2 GHz | 2.4 GHz | 432 MB | 330 W |
| Xeon 6970E+ | 192 | 3.2 GHz | 2.3 GHz | 480 MB | 400 W |
| Xeon 6980E+ | 264 | 3.2 GHz | 2.1 GHz | 528 MB | 400 W |
| Xeon 6990E+ | 288 | 3.2 GHz | 2.2 GHz | 576 MB | 450 W |

**Still needed:** Threads, Socket, SocketCount, PCIe, Memory, TrayID for these 4.
Source: <https://www.intel.com/content/www/us/en/ark/products/series/245944/intel-xeon-6-processors.html>

### 2. Arrow Lake Refresh — NEW architecture (~4 rows)
`Family` = **`Arrow Lake-S Refresh`** (new key — I'll create the SKU card)

Core Ultra 200S Plus, launched March 2026, LGA 1851. Known parts: Core Ultra 7 270K Plus,
Core Ultra 5 250K Plus, Core Ultra 5 250KF Plus. Plus the mobile Core Ultra 9 290HX Plus
if you want it — if so use `Family` = `Arrow Lake-HX Refresh`.

These are **client** parts: fill iGPU columns, leave the server ones blank.

### 3. Wildcat Lake — NEW architecture (6 rows)
`Family` = **`Wildcat Lake`** (new key)

Core Series 3, April 2026, entry-level 18A. Note it drops the "Ultra" branding.
Known SKUs: Core 3 304, Core 3 305, Core 5 305, Core 5 320, Core 7 350, Core 7 360.
All 15 W PBP / 35 W MTP. Client parts.

### 4. Panther Lake — EXPAND existing (3 → ~14 rows)
`Family` = **`Panther Lake`** for standard parts
`Family` = **`Panther Lake High Power`** for the H/HX tier (card exists, currently empty)

Launch was 14 SKUs across Core Ultra 5/7/9 plus the new **Core Ultra X7 / X9** tiers.
Client parts. If you want the later additions (Core Ultra X9 378H, April 2026) include
them too.

---

## Priority 2 — empty cards on shipping silicon (~45 rows)

Cards exist and render "No specs yet". Not unreleased — just missing data.

| `Family` value | What it is | Rough SKU count |
|---|---|---|
| `Granite Rapids AP` | Xeon 6900P — 6980P/6979P/6972P/6952P/6960P | 5 |
| `Granite Rapids D` | Xeon 6 SoC, edge/networking, 12–72 P-cores | ~20 |
| `Sierra Forest AP` | Xeon 6900E, up to 288 E-cores | ~3 |
| `Emerald Rapids MCC` | Emerald Rapids mid-core-count | ~10 |
| `Emerald Rapids XCC` | Emerald Rapids extreme-core-count | ~10 |
| `Sapphire Rapids HBM` | Xeon Max, HBM2e on package | ~5 |

All **server** parts: fill SocketCount / PCIe / Memory, leave iGPU blank.

---

## Priority 3 — Meteor Lake and Raptor Lake mobile (~60 rows)

The largest hole. Meteor Lake in particular is a whole shipping generation with zero data
across all three cards.

| `Family` value | What it is |
|---|---|
| `Meteor Lake-H` | Core Ultra 100H, 2023 |
| `Meteor Lake-U` | Core Ultra 100U |
| `Meteor Lake-PS` | Meteor Lake PS/embedded |
| `Raptor Lake-HX` | 13th-gen mobile HX |
| `Raptor Lake-H` | 13th-gen mobile H |
| `Raptor Lake-P` | 13th-gen mobile P |
| `Raptor Lake-U` | 13th-gen mobile U |
| `Raptor Lake-PX` | 13th-gen PX |
| `Raptor Lake-HX (14th)` | 14th-gen mobile HX — note the exact spacing |
| `Xeon E` | Xeon E-2400 workstation/entry server |

All **client** parts except `Xeon E`.

---

## Do NOT fill in

- **`Nova Lake`** and **`Diamond Rapids HBM`** — genuinely unreleased. Leave empty; the
  card correctly shows "No specs yet".
- **`Diamond Rapids`** — currently holds 8 pre-launch rows for a part that slipped to
  2027. Worth deciding separately whether to keep estimates or clear them; don't spend
  effort sourcing until it's closer.

---

## Suggested order

Start with **Priority 1** — around 30 rows, and it fixes what's actively wrong. I'll
import and verify that batch, you check the result in the dashboard, and then we decide
whether Priority 2 and 3 are worth the effort.

No need to do it in one go. Each family imports independently.

---

## What I'll do on receipt

1. `tools/import-specs.py inspect` to map your columns to the schema
2. Dry run — shows every row exactly as it would be stored, blocks on a bad SKU key
3. Import, then diff every field back against your table
4. Smoke test + screenshot
5. For the two new families, create the architecture entries and filter chips first,
   since a SKU key with no card renders nothing
