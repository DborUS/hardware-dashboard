# Hardware Spec CSV — Agent Contract v1

Goal: one verified row per shipping CPU/GPU model across AMD + Intel,
covering every field the Hardware Dashboard renders plus presales extras.

## Output files (per shard)
- `shards/<shard-id>.csv`      — one row per model, EXACT header below
- `shards/<shard-id>.gaps.csv` — one row per unfilled field
- `shards/<shard-id>.notes.md` — conflicts found, sources ranked, judgement calls

## HEADER — copy verbatim, do not reorder, do not add columns

vendor,kind,gpu_family_id,family,series,segment,codename,arch,model,model_full,cores,p_cores,e_cores,threads,base_clock,boost_clock,all_core_boost,l2_cache,l3_cache,tdp,tdp_config_up,process,socket,socket_count,pcie_gen,pcie_lanes,mem_type,mem_channels,mem_speed,mem_max_capacity,ecc,cxl,upi_links,igpu_model,igpu_cores,igpu_clock,npu_tops,launch_date,launch_price_usd,part_number,source_url,source_tier,confidence,notes

## Column rules

- `vendor`  = AMD | Intel
- `segment` = datacenter | workstation | desktop | mobile | handheld | embedded
              (this drives dashboard ordering — datacenter first, always)
- `model`   = short name as the dashboard shows it, e.g. "EPYC 9755", "Xeon 6980P"
- `model_full` = full marketing name incl. brand/trademark wording
- `cores`   = TOTAL cores. For hybrid Intel parts ALSO fill p_cores + e_cores,
              and cores MUST equal p_cores + e_cores. For non-hybrid leave p/e blank.
- clocks    = bare value + unit, e.g. "4.3 GHz". No "Up to" prefix in this CSV.
- caches    = value + unit, e.g. "64 MB"
- `tdp`     = default/base TDP with unit, e.g. "170W". Configurable range goes in
              tdp_config_up, e.g. "230W".
- `pcie_gen`= "5.0" ; `pcie_lanes` = integer only, e.g. "128"
- `mem_speed` = e.g. "DDR5-6400" ; `mem_channels` = integer ; `mem_max_capacity` = "3 TB"
- `ecc`, `cxl` = yes | no | blank-if-unknown
- `launch_date` = YYYY-QN (e.g. 2024-Q3) or YYYY-MM-DD if known exactly
- `launch_price_usd` = digits only, no $ or commas. Blank if never published.

## GPU rows
The normalized master keeps GPU identity and grouping, but the dashboard's GPU
table fields come directly from AMD's original exports in `source-csv/`.
`tools/build-amd-data.py` explicitly maps Compute Units, GPU Architecture,
Lithography, memory, bandwidth, vector/matrix FP32, Bus Type, GPU Form Factor,
and board power. Do not pack FP32 or form factor into `notes`; those are separate
source fields and combining them is how values previously landed in the wrong
dashboard columns.

## SOURCING — the rule that matters most

NEVER invent a value. Blank is fine; wrong is unacceptable. A wrong spec in
front of a customer is the worst possible failure for this project.

source_tier:
  1 = official vendor spec page (Intel ARK, amd.com product page, vendor datasheet PDF)
  2 = vendor press release / launch deck / official product brief
  3 = reputable secondary (TechPowerUp, WikiChip, AnandTech, ServeTheHome)

Tier 1 is required for: cores, threads, tdp, base/boost clock, socket.
If you cannot reach tier 1 for one of those, LEAVE IT BLANK and log a gap row.
Tier 3 is acceptable for: process, launch_price, npu_tops, cxl, all_core_boost.

confidence = high | medium | low
  high   = tier 1, unambiguous
  medium = tier 2, or tier 1 with a formatting judgement call
  low    = tier 3 only, or sources disagreed and you picked one

CROSS-CHECK: for every model, corroborate cores/TDP/boost against a SECOND
independent source. When two sources disagree, trust the vendor page, record the
disagreement in notes.md, and set confidence=medium. This catches real errors —
a prior import found a memory speed that was 40% wrong.

source_url = the specific URL that confirms the row (deep link, not a family page).

## gaps.csv format
model,field,why_missing,what_i_tried

## Method notes
- Prefer WebSearch first: fetching vendor product pages directly often overflows.
  Search "<model> ARK specifications" or "<model> site:amd.com specs", read the
  result summary, then fetch a specific deep link only if needed.
- Work in batches of ~15 models: research, then APPEND to your CSV immediately.
  Never hold more than a batch in your head — if you run out of room, the rows
  you already wrote to disk survive.
- Write the header first, then append. Verify with `wc -l` after each batch.
- Quote any field containing a comma.
