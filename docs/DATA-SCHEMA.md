# Data Schema

Contracts for every file in `js/data/`. Verified against the actual data — counts and
field names here are real, not aspirational.

| File | Shape | Size | Contents |
|---|---|---|---|
| `amd-data.json` | array | 16 entries | 8 architectures + 8 era separators |
| `intel-data.json` | array | — | 20 architectures. **Not currently rendered** — see note below |
| `amd-gpu-data.json` | array | 49 entries | 42 GPU families + era separators |
| `amd-cpu-specs.json` | object | 46 keys | SKU name → CPU model array |
| `intel-cpu-specs.json` | object | 31 keys | 275 models. **Not currently rendered** — old SKU keys |
| `intel-xeon-specs.json` | object | 30 keys | **553 Xeon models — live on the Xeon sub-tab** |
| `nvidia-data.json` | object | 3 product-line keys | **71 audited models — 20 data center, 47 GeForce, 4 CPU/superchips** |
| `compare-details.json` | object | 3 vendor keys | Full non-empty source-CSV fields plus shared master specifications, keyed by normalized product name and loaded only when Compare opens |
| `benchmark-sample.json` | object | 174 results | Dated Blender Open Data snapshot; exact ChipIndex model names, grouped median scores, submission counts, and filtered source URLs |
| `enterprise-benchmark-sample.json` | object | 1,658 results | Dated SPEC CPU 2017 integer-rate system results for ChipIndex enterprise CPUs, with original result links and test configuration |
| `enterprise-benchmark-fp-sample.json` | object | 1,629 results | Dated SPEC CPU 2017 floating-point-rate system results with the same disclosure and configuration fields |
| `enterprise-benchmark-2026-int-sample.json` | object | 178 results | Dated SPEC CPU 2026 integer base-rate disclosures, separated by test build |
| `enterprise-benchmark-2026-fp-sample.json` | object | 177 results | Dated SPEC CPU 2026 floating-point base-rate disclosures, separated by test build |
| `enterprise-benchmark-mlperf-v6-server-sample.json` | object | 23 results | Official MLPerf® Inference v6.0 Closed/Available Server results for one-node, eight-accelerator Llama 2 70B 99% systems |
| `enterprise-benchmark-mlperf-v6-offline-sample.json` | object | 23 results | The matching Offline scenario as a separate score scale and result snapshot |
| `benchmark-catalog.json` | object | 2,393 products, 2,414 display placements | Generated identity index of every displayed non-roadmap specification row, with exact snapshot metric matches and explicit unverified release status |
| `benchmark-table-index.js` | JavaScript object | 645 scored CPU models | Generated compact lookup for one source-linked SPEC system score or Blender CPU median per model, keyed by exact catalog vendor/model |

The product catalog files are loaded at runtime by `loadVendorData()` and cached
in `dataCache`. Their filenames follow `js/data/{vendor}-data.json`, where vendor
is `amd`, `intel`, `amd-gpu`, or `nvidia`. Benchmark JSON snapshots are
fetched by `benchmarks/`; the compact `benchmark-table-index.js` is loaded by
the product dashboard.

`compare-details.json` is also loaded on demand: `dashboardRenderComparison()` loads it on
demand so the normal dashboard stays light. Regenerate it with
`python3 tools/build-compare-details.py`; never hand-edit it.

## Benchmark snapshots and provenance

The seven dated files below are fetched by `benchmarks/`. Every score links to
an official source. The October 7, 2026 reviewed captures contain:

| File | Rows | Scope |
| --- | ---: | --- |
| `enterprise-benchmark-sample.json` | 1,658 | SPEC CPU 2017 integer base rate |
| `enterprise-benchmark-fp-sample.json` | 1,629 | SPEC CPU 2017 floating-point base rate |
| `enterprise-benchmark-2026-int-sample.json` | 178 | SPEC CPU 2026 integer base rate, four test builds |
| `enterprise-benchmark-2026-fp-sample.json` | 177 | SPEC CPU 2026 floating-point base rate, four test builds |
| `enterprise-benchmark-mlperf-v6-server-sample.json` | 23 | MLPerf® Inference v6.0 Llama 2 70B 99% Server |
| `enterprise-benchmark-mlperf-v6-offline-sample.json` | 23 | Matching Offline scenario |
| `benchmark-sample.json` | 174 | Blender 5.2.0 medians: 129 client CPUs, 45 GPUs |

SPEC rows retain exact catalog identity, numeric base-rate score, suite,
`benchmarkVersion`, full system URL, tested CPU count, enabled cores,
`baseCopies`, sponsor, system and compiler details, publication/retrieval dates,
and `sourceDocumentSha256`. NVIDIA's GB10 alias requires an exact DGX Spark
system and 20 cores per chip; `testedComponent: CPU` distinguishes its CPU
benchmark from GPU or combined superchip performance. CPU 2026 builds are
separate cohorts; CPU 2017 versions use SPEC's reviewed compatibility rules.
The bounded 2017 selection is recorded in `spec-import-review.json` and the
retained indexed source records; source HTML cache can be recreated locally.

MLPerf rows keep the official scenario and workload, submitter, SUT, eight-chip
count, result ID, whole-system Tokens/s, performance source URL and original
accelerator name. `tools/fixtures/mlperf-v6.0/` retains the official summary
JSON, revision, hash and exclusion review. Server and Offline are separate
comparison scales. Unresolved B300 identities remain in the review.

Blender rows keep version, CPU/GPU type, official source query, device name,
score, submissions and compute group. CPU rows also have `deviceSegments` and
`deviceSegmentSource` derived from AMD Form Factor or Intel ARK Vertical
Segment. The live grouped export and capture manifest are retained in `tools/`;
`tools/blender-import-review.json` accounts for every source label. Median
scores are community summaries across submitted hardware and software setups.

`benchmark-catalog.json` is generated from 2,414 dashboard placements and
2,393 distinct product identities. `snapshotMetrics` means an exact result
in the checked snapshots. It does not establish product eligibility, release
status or absence from public sources. CPU `productSpecs` are display-ready
`coreLabel`, `clockLabel` and `powerLabel` values derived from each exact
`sourceRecordRef`; unavailable or inapplicable fields are omitted. They describe
the catalog CPU model and stay separate from SPEC tested-system CPU count,
enabled cores and observed performance. The generated
`benchmark-table-index.js` projects 645 scored CPU models into product tables.
SPEC entries retain suite, build, and one- or two-CPU report counts plus a
featured published system result selected from one cohort. The table shows that
result's test, build, CPU count and score in one end column; its link opens the
same model and cohort in the benchmark explorer. It does not assign an intrinsic
score to a CPU. Blender entries retain the 5.2.0 mixed-compute CPU median,
submission count, and official source link. Run `python tools/build-product-benchmark-index.py`
after a reviewed snapshot update, or `--check` to detect drift; the refresh
transaction regenerates and rolls back this file with its source snapshots.
The generated `benchmark-sources.json` lists source access, each dataset's
metric/scope/count, actual capture date, bytes and SHA-256. Its counts are checked against snapshot
and catalog files before release. The browser never fetches third-party data
on a page visit.

Use `python tools/refresh-benchmarks.py --check` to replay all retained inputs
and validate identity, source URLs, metadata, catalog, registry and the
product-table index. An explicit
`--refresh SOURCE --allow-network` downloads a new supported capture, validates
it, and rolls back published files if any stage fails. The importers accept
`--check` individually for source-specific audits. The browser smoke checks
all workload switches and score/source identity after a data change.

`nvidia-data.json` is generated from the three audited CSVs in
`docs/specs/source-csv-nvidia/`. Regenerate it with
`python3 tools/build-nvidia-data.py`; never hand-edit it. Its top-level keys are
`datacenter`, `geforce`, and `cpu`, each containing flat product records. The NVIDIA
renderer derives launch-year groups, product-line cards, and filter values from those
records so new series cannot become unreachable through a stale hand-written taxonomy.

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
| `id` | yes | Unique, URL-safe. Used in DOM ids, localStorage keys, codename-table jumps. **Changing it orphans a user's saved links.** |
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
| `pr` | Published launch price in USD, formatted for display | `"$14,904"` |

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
_srv: true  → … Socket │ Sockets │ PCIe │ Memory │ 1kU Price │ Product ID
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

## OEM platform compatibility

`js/data/platform-compatibility.json` is a dated, manually reviewed snapshot of
CPU-to-OEM-system evidence. It is separate from the CPU specification exports and
does not infer support from a shared socket, processor family, power limit, or
benchmark result. An absent link means research is incomplete, not that the
system is incompatible.

| Array | Identity and purpose |
| --- | --- |
| `products[]` | Small projection of catalog `id`, vendor, `dashboardTab`, exact `model`, and optional `productId`; lets the page join the visible row without downloading the full catalog. |
| `platforms[]` | One canonical OEM model/revision, with `category`, `formFactor`, optional `rackUnits` or `dimensions`, `socketCount`, `memoryChannelsPerSocket`, maximum `dimmSlots`, optional `platformNote` for chassis/node distinctions, and source IDs. Client dimensions and display or volume fields are included only when the OEM provides them. |
| `compatibility[]` | Exact `catalogId` → `platformId` edge, `supportLevel`, `evidenceType`, edge-level source IDs, optional `supportedCpuQuantities`, OEM option code, documented `market`, and `restrictionNote`. The note is shown inside the platform detail when cooling, chassis, CTO, memory, or quantity limits matter. Omit `supportedCpuQuantities` when the OEM source does not establish the precise allowed socket population. `fixed_configuration` describes an OEM-published CPU/system pairing, not an interchangeable processor option. |
| `sources[]` | Official publisher, title, HTTPS URL, table/page `locator`, and `retrievedAt` date. The CPU option source and the chassis-specification source may differ. |

`catalogId` must match a product in generated `benchmark-catalog.json` with the
same vendor, model, tab, and product ID when available. Run
`python tools/check-platforms.py` after any edit; the validator checks these
joins, references, duplicate edges, source hosts, and hardware-value
plausibility. Researchers must also inspect the exact OEM source rows and
configuration limits. See `docs/platforms/SOURCES.md` for the current evidence
ledger and `docs/PLATFORM-COMPATIBILITY-PLAN.md` for the staged research scope.
The public snapshot is generated from `docs/platforms/pilot-seed.json` and
candidate research files pinned in `docs/platforms/PUBLICATION-MANIFEST.json`.
Run `python tools/build-platform-snapshot.py --check` to detect candidate or
snapshot drift. Changing a candidate file requires another review and an
updated approval hash before rebuilding the site snapshot.

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
