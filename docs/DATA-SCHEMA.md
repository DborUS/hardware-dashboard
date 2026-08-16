# Data Schema

Contracts for every file in `js/data/`. Verified against the actual data — counts and
field names here are real, not aspirational.

| File | Shape | Size | Contents |
|---|---|---|---|
| `amd-data.json` | array | 14 entries | 7 architectures + 7 era separators |
| `intel-data.json` | array | — | 20 architectures. **Not currently rendered** — see note below |
| `amd-gpu-data.json` | array | 49 entries | 42 GPU families + era separators |
| `amd-cpu-specs.json` | object | 44 keys | SKU name → CPU model array |
| `intel-cpu-specs.json` | object | 31 keys | 275 models. **Not currently rendered** — old SKU keys |
| `intel-xeon-specs.json` | object | 29 keys | **553 Xeon models — live on the Xeon sub-tab** |

Loaded at runtime by `loadVendorData()` and cached in `dataCache`. Filenames follow
`js/data/{vendor}-data.json`, where vendor is `amd`, `intel`, or `amd-gpu`.

> **Intel moved to a hardcoded taxonomy (2026-08-16).** The Intel tab is drawn by
> `v2Render()` in `js/intel-v2.js` from the `V2_DATA` object, not from these JSON files.
> The two Intel files above are still valid and still fetched, but nothing displays them.
> They hold 275 verified models keyed by the *old* codename SKU keys; the new structure
> uses generation → codename keys. **Reconnecting them is the next piece of work** —
> until then, editing `intel-cpu-specs.json` has no visible effect.
>
> Everything in this document describes the AMD path unless stated otherwise.
>
> **`intel-xeon-specs.json` is the exception** — it is live. Keyed by codename, which
> must match a `V2_DATA.xeon` family `name` exactly. Fields: `n pc ec t bas bst l3 tdp
> skc mem cap pcie upi`, rendered in the order set by `V2_FIELDS.xeon`. Regenerate with
> `tools/import-xeon-specs.py`; never hand-edit.

---

## Architecture files

`amd-data.json` and `intel-data.json` are **ordered arrays** mixing two entry types.
Order is what you see on screen: newest first.

### Era separator

```json
{ "era": "2022 – 2023" }
```

Just a visual divider. Rendered as a label + line, and auto-hidden when everything beneath
it is filtered out. Note the en-dash `–` with spaces, not a hyphen.

### Architecture entry

```json
{
  "id": "zen5",
  "arch": "Zen 5",
  "color": "#ef4444",
  "year": "2024",
  "segment": "client",
  "subtitle": "TSMC 4 nm / 3 nm · Ryzen 9000 · Ryzen AI 300/400 · AI Max 300 · EPYC 9005",
  "defaultLinks": [{ "label": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Zen_5" }],
  "skus": [ /* see below */ ]
}
```

| Field | Req | Notes |
|---|---|---|
| `id` | yes | Unique, URL-safe. Used in DOM ids, localStorage keys, codename-table jumps. **Changing it orphans a user's saved notes/links.** |
| `arch` | yes | Display name |
| `color` | yes | Hex accent — see `docs/DESIGN-SYSTEM.md` for the progression |
| `year` | yes | String, not number. Shown in the year pill |
| `segment` | no | `client` / `server` — informational; badges are derived from SKU tags |
| `subtitle` | no | ` · `-separated; the separator is styled specially. **Convention: process node first, then product families** — e.g. `TSMC 5 nm · Ryzen 7000/8000 · Threadripper 7000 · EPYC 9004`. Don't append platform details (PCIe gen, memory type); those belong in the spec table |
| `unreleased` | no | `true` → diagonal stripes + "Unreleased" badge |
| `defaultLinks` | no | Seed links. **Shadowed permanently** once a user saves their own |
| `skus` | yes | Array, see below |

### SKU entry

```json
{
  "name": "Turin",
  "desc": "EPYC 9005 series — server processors",
  "tags": ["server"],
  "brand": "Epyc"
}
```

| Field | Req | Notes |
|---|---|---|
| `name` | yes | **Join key** into the specs files. Must match exactly |
| `desc` | yes | One-line description. Em-dash `—` is the house style |
| `tags` | yes | Segment tags — drives filtering and badges |
| `brand` | no | Must match a `VENDOR_CONFIG` brand **exactly**, including case/spaces |

**Valid tags** — anything else is unreachable by the filter buttons:

- AMD: `desktop`, `laptop`, `handheld`, `server`
- Intel: `desktop`, `mobile`, `server`, `embedded`

**Valid brands** — exact strings:

- AMD: `Ryzen`, `Ryzen AI`, `Threadripper`, `Epyc`, `Athlon`
- Intel: `Core Ultra`, `Core`, `Xeon`, `Xeon 6 P`, `Xeon 6 E`

Client/server badges are computed, not declared: if every SKU has the `server` tag →
Server badge only; if none do → Client only; mixed → both.

---

## CPU spec files

`amd-cpu-specs.json` / `intel-cpu-specs.json` are **objects keyed by SKU name**:

```json
{
  "Granite Ridge": [ { /* model */ }, { /* model */ } ],
  "Turin":         [ { /* model */ } ]
}
```

The key must match a `skus[].name` character-for-character. No match → no spec table, no
error, no warning. This is the most common silent failure when adding data.

Field names are abbreviated to keep these files small (`amd-cpu-specs.json` is ~250 KB).

**Formatting matters for reviewable diffs.** These files use **4-space indent** and
`\uXXXX` escapes for non-ASCII (`ensure_ascii=True`). Writing them any other way
reformats every untouched record — on the 9006 import that turned a 469-line addition
into a 1409-line diff. `tools/import-specs.py` preserves this; if you write these files
by hand, use `json.dump(d, f, indent=4, ensure_ascii=True)`.

### Shared fields

| Key | Meaning | Example |
|---|---|---|
| `n` | Model name | `"Ryzen 9 9950X"` |
| `c` | Cores | `"16"` |
| `t` | Threads | `"32"` |
| `bst` | Boost clock | `"Up to 5.7 GHz"` |
| `bas` | Base clock | `"4.3 GHz"` |
| `l3` | L3 cache | `"64 MB"` |
| `tdp` | TDP | `"170W"` |
| `sk` | Socket | `"AM5"` |
| `tr` | Tray product ID | `"100-000001277"` |

All values are **strings**, rendered verbatim. Match the phrasing of neighbouring rows —
`"170W"` not `"170 W"`, `"Up to 5.7 GHz"` where siblings use that form.

**Searchable fields:** the model name plus `CPU_SEARCH_FIELDS` in `script.js` —
`sk`, `tdp`, `pcie`, `mem`, `tr`. Because values are matched as raw strings, phrasing
affects searchability: a socket stored as `"SP5"` is found by `sp5`, but `"Socket SP5"`
would also match a search for `socket`. Cores, threads, clocks and cache are intentionally
not indexed. Add a field to that array to make it searchable.

### Client-only fields (when `_srv` absent)

| Key | Meaning |
|---|---|
| `gm` | Integrated GPU model |
| `gc` | GPU compute units |
| `gf` | GPU frequency |

### Server fields (when `_srv: true`)

| Key | Meaning |
|---|---|
| `skc` | Socket count (`"1P / 2P"`) |
| `pcie` | PCIe config (`"PCIe® 5.0 x128"`) |
| `mem` | Memory support (`"Up to 6400 MT/s"`) |

### `_srv` selects the table layout

This is not a label — it picks which three columns render:

```
_srv: true  → … Socket │ Sockets │ PCIe │ Memory │ Product ID
_srv absent → … Socket │ GPU Model │ GPU CUs │ GPU Freq │ Product ID
```

> **AMD only.** Intel no longer uses `_srv`: its column set is a property of the sub-tab
> (`V2_COLUMNS` in `intel-v2.js`), which resolved the long-standing bug where all 219
> Intel records were flagged `_srv` and desktop parts like the Core Ultra 9 285K rendered
> server columns. When Intel spec data is reconnected, `_srv` can be dropped from those
> records entirely.

---

## GPU data file

`amd-gpu-data.json` — 42 families across three segments: consumer 22, workstation 13,
datacenter 7.

Same architecture-entry shape, plus a `gpuSpecs` object:

```json
{
  "id": "cdna4",
  "arch": "CDNA 4",
  "color": "#ef4444",
  "year": "2025",
  "segment": "datacenter",
  "subtitle": "…",
  "defaultLinks": [],
  "skus": [],
  "gpuSpecs": {
    "family": "Instinct MI350",
    "desc": "…",
    "models": [ /* see below */ ]
  }
}
```

`segment` must be `datacenter`, `workstation`, or `consumer`. Note there is a fourth
*derived* segment, `mobile`: `gpuSegmentOf()` overrides the stored value when every model
in the family has a mobile form factor. Don't set `"segment": "mobile"` in the data —
it's computed.

### GPU model

```json
{
  "name": "MI355X",
  "arch": "CDNA 4",
  "process": "3 nm",
  "cu": "256",
  "mem": "288 GB",
  "memType": "HBM3E",
  "bw": "8000 GB/s",
  "fp32": "157.3 TFLOPS",
  "fp32m": "157.3 TFLOPS",
  "pcie": "5.0",
  "form": "OAM",
  "tbp": "1400 W (TBP)"
}
```

All strings. `fp32m` is the matrix/peak variant; often equal to `fp32`.

### The `form` field is messy

Eight distinct values in the data:

| Value | Count |
|---|---|
| `PCIe` | 212 |
| `Desktops` | 16 |
| `Workstations` | 9 |
| `Laptops` | 9 |
| `OAM` | 6 |
| `Servers` | 3 |
| `Mobile Workstations` | 2 |
| `APU (SH5)` | 1 |

As of 2026-08-12 `form` is **display data plus a segmentation hint** — it is no longer a
filter input. It renders as the second column of every GPU spec table, and
`gpuSegmentOf()` reads it to decide whether a family belongs in the `mobile` segment (true
when *every* model is `Laptops` or `Mobile Workstations`).

The inconsistent values are therefore tolerable, but if you normalise them, update
`MOBILE_FORMS` in `script.js` to match.

Field naming is inconsistent between segments too — `pcie` holds `"5.0"` for datacenter
parts but `"PCIe 3.0"` for some workstation parts. Worth normalising if you touch this file.

---

## SKU ordering within an architecture

**Order every SKU list datacenter → client → desktop → mobile, and within a tier put the
highest-performing part first.** This is a hard rule, not a preference — the dashboard's
primary audience is datacenter presales, so the parts that matter most must not be
buried below consumer silicon.

Arrays render in file order. There is no sort in `render()`, deliberately — sorting would
need a per-SKU rank field that duplicates what `tags` already says, and it would fight the
hand-tuned ordering inside a tier. **File order is the contract.**

### The rank

| Rank | Tier | `tags` value | Example |
|---|---|---|---|
| 0 | Datacenter | `server` | Turin, Granite Rapids SP |
| 1 | Workstation / HEDT | `desktop` + `pro`, Threadripper / Xeon W | Shimada Peak, Xeon W-2400 |
| 2 | Desktop | `desktop` | Granite Ridge, Raptor Lake-S |
| 3 | Mobile | `laptop` / `mobile` | Fire Range, Meteor Lake-H |
| 4 | Handheld | `handheld` | Z2, Z1 |
| 5 | Embedded / IoT | `embedded`, `iot` | Atom Embedded, Raptor Lake-E |

A SKU carrying several tags takes its **strongest** tier — `["desktop","laptop","pro"]`
ranks as workstation, not mobile.

### Within a tier, highest performance first

Rank alone is not enough. Inside a tier, order by relative performance so the flagship
reads first:

```
Zen 5 mobile:  Strix Halo  →  Strix Point  →  Kraken Point  →  Gorgon Point
               (40 CU,          (16 CU,         (cut-down)       (refresh)
                halo part)       mainstream)
```

`Strix Halo` is the highest-performing Strix part, so it leads the mobile group even
though all four share a tag. Same logic puts `Turin` before `Turin Dense`, and
`Granite Rapids AP` before `Granite Rapids SP`.

Where performance ordering is genuinely ambiguous — two parts aimed at different
workloads rather than different performance points — fall back to core count, then
launch date. Do not guess a ranking to satisfy the rule; ask.

### Checking it

```bash
python3 tools/check-order.py            # all data files, exit 1 on violation
python3 tools/check-order.py --fix      # print the corrected order (does not write)
```

Tier ordering is machine-checkable and the script enforces it. **Intra-tier performance
ordering is not** — it needs domain knowledge the script does not have, so it stays a
review-time judgement.

---

## Adding data — checklist

1. Insert in the right chronological position (newest first); add an era separator if it
   starts a new year.
2. `id` unique and URL-safe.
3. `tags` and `brand` use exact known values.
3a. **Position by tier: datacenter → workstation → desktop → mobile → handheld →
    embedded; highest-performing part first within a tier.** See *SKU ordering* above.
    Verify with `python3 tools/check-order.py`.
4. SKU `name` matches the specs-file key character-for-character.
5. `_srv` set correctly — it picks the column layout.
6. Units and phrasing match neighbouring rows.
7. Validate: `python3 -m json.tool js/data/<file>.json > /dev/null`
8. Verify: `python3 tools/smoke-test.py --shots`, then read the screenshot.

**Never invent specifications.** Every number must come from Daniel or an official vendor
source. Omit unknown fields rather than guessing.
