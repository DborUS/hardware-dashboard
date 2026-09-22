# Hardware Spec Conflict Adjudication

106 conflicts reviewed across tdp (44), boost (21), base (19), l3 (16), threads (4), cores (2).

## Verdict summary

| Verdict | Count |
|---|---|
| OLD correct (dashboard right, NEW dataset wrong) | 54 |
| NEW correct (dashboard has a latent bug) | 1 |
| BOTH-DEFENSIBLE (convention/rounding difference) | 51 |
| UNRESOLVED | 0 |
| **Total** | **106** |

Breakdown by field:
- cores (2): 2 old_correct
- threads (4): 4 old_correct
- l3 (16): 13 old_correct, 3 both_defensible
- tdp (44): 17 old_correct, 1 new_correct, 26 both_defensible
- boost (21): 5 old_correct, 16 both_defensible
- base (19): 13 old_correct, 6 both_defensible

---

## NEW CSV IS WRONG — must fix before use

These are the highest-severity findings: the research agent's "new" dataset contains a factual error. Full list also in `corrections.csv` (verdict = new_wrong).

### Cores / threads (all 6 conflicts — 100% new dataset wrong)

| model | field | wrong (new) value | correct value | source |
|---|---|---|---|---|
| AMD Ryzen 7 7445HS | cores | 8 | 6 | amd.com/en/products/processors/laptop/ryzen/7000-series/amd-ryzen-7-7445hs.html |
| AMD Ryzen 7 7445HS | threads | 16 | 12 | same |
| Xeon Gold 5411N | cores | 28 | 24 | ark.intel.com/content/www/us/en/ark/products/232393/intel-xeon-gold-5411n-processor-45m-cache-1-90-ghz.html |
| Xeon Gold 5411N | threads | 56 | 48 | same |
| Xeon Bronze 3508U | threads | 16 | 8 (no Hyper-Threading) | intel.com/content/www/us/en/products/sku/236639/intel-xeon-bronze-3508u-processor-22-5m-cache-2-10-ghz/specifications.html |
| Xeon 6315P | threads | 8 | 4 (no Hyper-Threading) | intel.com/content/www/us/en/products/sku/241603/intel-xeon-6315p-processor-12m-cache-2-80-ghz/specifications.html |

Pattern: the research agent appears to assume SMT/Hyper-Threading doubling on parts that don't have it (Xeon Bronze/6315P are non-HT), and mismatched adjacent SKU core counts for the 7445HS and 5411N.

### L3 cache (13 of 16 conflicts wrong in new dataset)

| model | field | wrong (new) value | correct value | source |
|---|---|---|---|---|
| Ryzen 3 8300G | l3 | 12 MB | 8 MB | amd.com/en/products/processors/desktops/ryzen/8000-series/amd-ryzen-3-8300g.html |
| Ryzen 3 PRO 8300G | l3 | 12 MB | 8 MB | amd.com/en/products/processors/desktops/ryzen-pro/8000-series/amd-ryzen-3-pro-8300g.html |
| Ryzen 5 7235HS | l3 | 16 MB | 8 MB | amd.com/en/products/processors/laptop/ryzen/7000-series/amd-ryzen-5-7235hs.html |
| Ryzen 5 5600U | l3 | 12 MB | 16 MB | AMD-sourced spec, corroborated cpu-monkey/askgeek |
| Athlon Gold 7220C | l3 | 4 MB | 2 MB | cpu-monkey / eatyourbytes (4 MB is the 7220U's figure) |
| Ryzen 5 3500C | l3 | 6 MB | 4 MB | cpu-monkey |
| Ryzen 7 3700C | l3 | 6 MB | 4 MB | cpu-monkey |
| EPYC 9755 | l3 | 384 MB | 512 MB (32 MB x 16 CCDs) | amd.com/en/products/processors/server/epyc/9005-series/amd-epyc-9755.html — verified per Daniel's request, no ambiguity found |
| EPYC 7642 | l3 | 192 MB | 256 MB | AMD driver/support page + ServeTheHome |
| Xeon Gold 6212U | l3 | 36 MB | 35.75 MB | intel.com/content/www/us/en/products/sku/192453/intel-xeon-gold-6212u-processor-35-75m-cache-2-40-ghz/specifications.html |
| Xeon Platinum 8380 | l3 | 6 MB | 60 MB | intel.com/content/www/us/en/products/sku/212287/intel-xeon-platinum-8380-processor-60m-cache-2-30-ghz/specifications.html — off by 10x |
| Xeon Silver 4316 | l3 | 3 MB | 30 MB | ark.intel.com/content/www/us/en/ark/products/215270/intel-xeon-silver-4316-processor-30m-cache-2-30-ghz.html — off by 10x |
| Xeon Gold 5320T | l3 | 3 MB | 30 MB | ark.intel.com/content/www/us/en/ark/products/215284/intel-xeon-gold-5320t-processor-30m-cache-2-30-ghz.html — off by 10x |

Note the 8380/4316/5320T trio all show the new dataset off by exactly 10x — looks like a systematic decimal-shift bug for high-core-count Xeon L3 values, worth auditing upstream.

### TDP (17 of 44 conflicts wrong in new dataset)

| model | field | wrong (new) value | correct value | source |
|---|---|---|---|---|
| Ryzen 5 7500X3D | tdp | 120W | 65W | amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7500x3d.html |
| Ryzen 5 7600X3D | tdp | 120W | 65W | amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-5-7600x3d.html |
| Ryzen 7 PRO 2700X | tdp | 105W | 95W (105W is the non-PRO 2700X) | amd.com/en/products/cpu/amd-ryzen-7-pro-2700x |
| EPYC 9755 | tdp | 400W | 500W (Default TDP; cTDP range 450-500W) | amd.com/en/products/processors/server/epyc/9005-series/amd-epyc-9755.html |
| EPYC 7371 | tdp | 170W | 200W | AMD support page |
| EPYC 9734 | tdp | 320W | 340W (Default TDP) | amd.com/en/products/processors/server/epyc/4th-generation-9004-and-8004-series/amd-epyc-9734.html |
| Xeon Gold 6148F | tdp | 150W | 160W (150W is the non-F 6148) | intel.com/content/www/us/en/products/sku/123690/intel-xeon-gold-6148f-processor-27-5m-cache-2-40-ghz/specifications.html |
| Xeon Gold 5218N | tdp | 125W | 110W | intel.com/content/www/us/en/products/sku/193397/intel-xeon-gold-5218n-processor-22m-cache-2-30-ghz/specifications.html |
| Xeon Gold 6426Y | tdp | 205W | 185W | intel.com/content/www/us/en/products/sku/232377/intel-xeon-gold-6426y-processor-37-5m-cache-2-50-ghz/specifications.html |
| Xeon Gold 5416S | tdp | 165W | 150W | intel.com/content/www/us/en/products/sku/232396/intel-xeon-gold-5416s-processor-30m-cache-2-00-ghz/specifications.html |
| Xeon 6747P | tdp | 350W | 330W | intel.com/content/www/us/en/products/sku/241825/intel-xeon-6747p-processor-288m-cache-2-70-ghz/specifications.html |
| Xeon 6527P | tdp | 250W | 255W | intel.com/content/www/us/en/products/sku/242642/intel-xeon-6527p-processor-144m-cache-3-00-ghz/specifications.html |
| Xeon 6776P-B | tdp | 330W | 325W | intel.com/content/www/us/en/products/sku/245154/intel-xeon-6776pb-processor-288m-cache-2-30-ghz/specifications.html |
| Xeon 6768P-B | tdp | 330W | 325W | intel.com/content/www/us/en/products/sku/245739/intel-xeon-6768pb-processor-256m-cache-2-20-ghz/specifications.html |
| Xeon 6543P-B | tdp | 170W | 160W | intel.com/content/www/us/en/products/sku/242903/intel-xeon-6543pb-processor-128m-cache-2-00-ghz/specifications.html |
| Xeon 6523P-B | tdp | 165W | 175W | intel.com/content/www/us/en/products/sku/242901/intel-xeon-6523pb-processor-96m-cache-2-50-ghz/specifications.html |
| Xeon 6513P-B | tdp | 145W | 130W | intel.com/content/www/us/en/products/sku/242909/intel-xeon-6513pb-processor-80m-cache-2-00-ghz/specifications.html |

Notable: every one of the 11 Xeon TDP conflicts resolved to "new dataset wrong," several by exactly the TDP of an adjacent/similarly-named SKU (6148F vs 6148, 6523P-B vs 6513P-B pattern) — worth auditing whether the research agent's SKU-matching logic confuses suffix variants across the whole Xeon 6 -B family, not just these 5.

### Boost / base clocks (18 of 40 conflicts wrong in new dataset)

| model | field | wrong (new) value | correct value | source |
|---|---|---|---|---|
| Ryzen 7 PRO 2700X | boost | 4.30 GHz | 4.1 GHz (PRO variant; 4.3/3.7 is the non-PRO 2700X) | amd.com/en/support/downloads/drivers.html/processors/ryzen-pro/ryzen-pro-2000-series/amd-ryzen-7-pro-2700x.html |
| Ryzen 7 PRO 2700X | base | 3.70 GHz | 3.6 GHz | same |
| Ryzen 5 2500X | boost | 4.20 GHz | 4.0 GHz | amd.com/en/products/cpu/amd-ryzen-5-2500x |
| Xeon Gold 6426Y | boost | 3.70 GHz | 4.10 GHz | intel.com/content/www/us/en/products/sku/232377/intel-xeon-gold-6426y-processor-37-5m-cache-2-50-ghz/specifications.html |
| Xeon Gold 5416S | boost | 3.80 GHz | 4.00 GHz | intel.com/content/www/us/en/products/sku/232396/intel-xeon-gold-5416s-processor-30m-cache-2-00-ghz/specifications.html |
| Ryzen 9 7945HX3D | base | 2.50 GHz | 2.3 GHz (reduced from non-3D 7945HX for V-Cache thermals) | notebookcheck.net/AMD-Ryzen-9-7945HX3D-Processor-Benchmarks-and-Specs.738915.0.html |
| Ryzen 5 8640HS | base | 4.30 GHz | 3.5 GHz | amd.com/en/products/processors/laptop/ryzen/8000-series/amd-ryzen-5-8640hs.html |
| Ryzen 5 PRO 8640HS | base | 4.30 GHz | 3.5 GHz | amd.com/en/products/processors/laptop/ryzen-pro/8000-series/amd-ryzen-5-pro-8640hs.html |
| Ryzen 5 PRO 8600GE | base | 3.60 GHz | 3.9 GHz | amd.com/en/products/processors/desktops/ryzen-pro/8000-series/amd-ryzen-5-pro-8600ge.html |
| Ryzen 5 PRO 8605GE | base | 3.60 GHz | 3.9 GHz | amd.com/en/products/processors/desktops/ryzen-pro/8000-series/amd-ryzen-5-pro-8605ge.html |
| Ryzen 5 PRO 220 | base | 3.00 GHz | 3.2 GHz (headline field; 3.0 is the Zen4c-core sub-clock) | amd.com/en/products/processors/laptop/ryzen-pro/200-series/amd-ryzen-5-pro-220.html |
| Ryzen 3 210 | base | 2.80 GHz | 3.0 GHz (headline field; 2.8 is the Zen4c-core sub-clock) | amd.com/en/products/processors/laptop/ryzen/200-series/amd-ryzen-3-210.html |
| Ryzen Z1 | base | 3.70 GHz | 3.2 GHz (headline field; 3.7 is the Zen4-core sub-clock) | amd.com/en/products/processors/handhelds/ryzen-z-series/z1-series/z1.html |
| Athlon 320GE | base | 3.80 GHz | 3.5 GHz (fixed, no boost) | cpu-world.com |
| EPYC 7282 | base | 2.40 GHz | 2.8 GHz | AMD EPYC 7002 datasheet |
| EPYC 7302 | base | 2.80 GHz | 3.0 GHz | amd.com/en/products/cpu/amd-epyc-7302 |
| EPYC 7272 | base | 2.60 GHz | 2.9 GHz | AMD support page |
| EPYC 7252 | base | 2.80 GHz | 3.1 GHz | AMD support page |

Notable pattern: the hybrid-core Ryzen 200-series parts (PRO 220, 210, Z1) all show the new dataset grabbing the Zen4c- or Zen4-specific sub-clock instead of AMD's headline "Base Clock" field — check whether the research agent's extraction logic systematically mis-selects for this whole hybrid-core family, not just these three.

---

## DASHBOARD IS WRONG — latent production bug

| model | field | wrong value (dashboard/old) | correct value | source |
|---|---|---|---|---|
| Ryzen 7 4800HS | tdp | 45W | 35W | **RULED 2026-09-10: 45W stands, dashboard was right.** AMD's official CSV (`source-csv/AMD desktop laptop workstation.csv`) lists 45W nominal with a configurable 35–54W range. The third-party sources quoted 35W, the *bottom of the cTDP band*, and mistook it for the nominal figure — this was never a swap with the non-HS part. Daniel confirmed against amd.com. No change made. |

This is the only case in the entire 106-conflict set where the new research agent caught a genuine production error.

---

## BOTH DEFENSIBLE — convention difference

### 1. AMD mobile U/Z-series configurable TDP cluster (15 SKUs, TDP field)
Ryzen AI 5 330, Ryzen AI 5 430, Ryzen Z2 Go, Ryzen 7 7840U, Ryzen 5 7540U, Ryzen 5 7545U, Ryzen 5 7640U, Ryzen 3 7440U, Ryzen 7 8840U, Ryzen 7 PRO 8840U, Ryzen 5 8540U, Ryzen 5 8640U, Ryzen 5 PRO 8540U, Ryzen 5 PRO 8640U, Ryzen 3 8440U — old=28W, new=15W for all.

Confirmed on AMD's official product pages (spot-checked Ryzen AI 5 330, Ryzen 7 7840U, Ryzen Z2 Go): AMD publishes two figures — "Default TDP" (28W) and "cTDP" range (15-30W). Both 28W and 15W appear verbatim on AMD's own site; this is not an error on either side, just two different fields of the same spec sheet.

Recommendation: standardize on 28W ("Default TDP") as the dashboard's single TDP value, since AMD treats that as the primary spec — optionally annotate as "28W (15-30W cTDP)" if the schema supports a range/footnote.

### 2. AMD EPYC 7001-series dual-rated TDP (8 SKUs)
EPYC 7501, 7401, 7401P, 7281, 7301, 7351, 7351P, 7261 — old="155W / 170W", new="170W".

AMD's own product/support pages literally list "Default TDP: 155W / 170W" as a dual-rated field for these Naples-generation parts (155W nominal, 170W cTDP-max). The old dashboard value preserves both numbers; new collapses to the upper bound only.

Recommendation: keep the dual value "155W / 170W" (old) since it's literally what AMD publishes and is more informative than a single number.

### 3. EPYC 9384X (TDP)
Old=320W (Default TDP), new=400W (cTDP max, per AMD's 320-400W range). Same convention as cluster #1.
Recommendation: 320W (Default TDP), for consistency with the mobile cluster's recommendation.

### 4. Ryzen 9 4900H (TDP)
Old="35-54W" (AMD's literal "Default TDP" range field), new="45W" (a commonly-cited nominal midpoint, not an AMD-published field).
Recommendation: keep old (35-54W) as it matches AMD's own page verbatim.

### 5. Athlon Gold 7220U (TDP)
Old=15W (AMD "Default TDP"), new="8-15W" (cTDP range per Notebookcheck/laptopmedia/cpu-monkey).
Recommendation: 15W (Default TDP), consistent with cluster #1's convention.

### 6. Intel small-decimal L3 cache rounding (3 SKUs)
Xeon D-2163IT (old 17 MB / new 16.5 MB), Xeon D-2166NT (old 17 MB / new 16.5 MB), Xeon W-2175 (old 19 MB / new 19.25 MB).

Intel's own ARK page for each of these SKUs embeds the precise cache size in the product title (e.g. "16.5M Cache", "19.25M Cache") while the spec table on the same page rounds to a whole MB. Neither dataset is factually wrong — they reflect two numbers Intel itself publishes for the identical SKU.

Recommendation: standardize on the precise value (16.5 MB / 16.5 MB / 19.25 MB — i.e. "new") for consistency with Xeon Gold 6212U's 35.75 MB precision already used elsewhere in the dashboard.

### 7. Boost/base clock rounding — "Up to X GHz" marketing vs precise spec-table value (21 conflicts, delta <= 0.15 GHz)
Boost: Ryzen AI 9 HX 470 / HX PRO 470 (5.2 vs 5.25), Ryzen AI 7 450 / PRO 450 (5.1 vs 5.20), Ryzen 5 7500X3D (4.5 vs 4.60), Ryzen TR PRO 7955WX / 7945WX (5.3 vs 5.35), Ryzen 5 8640HS / PRO 8640HS boost (4.9 vs 5.00), Ryzen 5 PRO 6650U (4.5 vs 4.40), Ryzen 5 PRO 5645 (4.6 vs 4.50), EPYC 8434P (3.1 vs 3.00), EPYC 7662 / 7552 (3.3 vs 3.35), EPYC 7642 boost (3.3 vs 3.40), Xeon Gold 6438N (3.6 vs 3.70).
Base: Ryzen 5 8600G / PRO 8600G (4.3 vs 4.35), EPYC 9255 (3.2 vs 3.25), EPYC 7642 base (2.3 vs 2.40), Xeon Gold 6443N (2 vs 1.90).

These are marketing "Up to X GHz" copy vs. the precise decimal from the vendor's own detailed spec table — not factual disagreements.

Recommendation: standardize dashboard-wide on the precise decimal spec-table value (generally the "new" figure) rather than rounded marketing copy, for consistency.

### 8. Xeon W-3175X boost clock — Intel self-contradicts
Old=3.8 GHz, new=4.30 GHz. Intel's ARK spec table lists Max Turbo Frequency as 3.80 GHz, but Intel's own 2019 launch newsroom materials state single/dual-core Turbo Boost 2.0 up to 4.3 GHz for this part. This is a genuine case of two official Intel sources disagreeing, not a research error on either side.

Recommendation: flag to Daniel for a policy call — does the dashboard follow ARK's literal turbo field (3.8) or the vendor's peak-boost marketing figure (4.3), consistent with how "Up to X GHz" AMD fields are handled elsewhere?

---

## UNRESOLVED

None. All 106 conflicts were adjudicated with a definitive verdict (old_correct / new_correct / both_defensible).
