# Intel Tab Audit — 2026-08-13

Review of the Intel data against current public information. Every dashboard-side claim
below was read out of `js/data/intel-data.json` and `intel-cpu-specs.json`; every
real-world claim is sourced at the bottom.

**Headline:** the Intel data was built around **February 2026** and has not been updated
since. Three families the dashboard shows as *Unreleased* have shipped, one has slipped a
year, and **four families released in 2026 are missing entirely**. Separately, 19 of 44
SKU cards carry no spec data at all.

---

## 1. Release-status errors (the red "Unreleased" boxes)

Daniel's instinct was right. Of the four architectures flagged `unreleased: true`:

| Architecture | Dashboard says | Reality | Verdict |
|---|---|---|---|
| **Panther Lake** | Unreleased, 2026 | **Launched CES, 5 Jan 2026.** Core Ultra Series 3, first on Intel 18A. Retail from 27 Jan; 14 SKUs | ❌ Remove flag |
| **Clearwater Forest** | Unreleased, 2025–2026 | **Launched Computex, 2 Jun 2026.** Xeon 6+, up to 288 E-cores. Systems shipping from Dell/HPE/Lenovo/Supermicro | ❌ Remove flag |
| **Diamond Rapids** | Unreleased, 2025–2026 | **Slipped to 2027.** Confirmed by Intel at Computex 2026 on 18A-P | ⚠️ Keep flag, fix year to 2027 |
| **Nova Lake** | Unreleased, 2026 | Still unreleased. Staggered rollout now expected **2027**, flagship possibly late 2027 | ⚠️ Keep flag, fix year |

Two of the four are wrong in the "shows as future when it shipped" direction, which is the
more damaging error in front of a customer.

Note the Diamond Rapids spec table currently holds **8 models** — these are pre-launch
figures for a part that is now a year out. Worth reviewing whether they still match
Intel's public guidance (~192 cores, 16-channel memory, PCIe 6.0).

---

## 2. Missing families (released, absent from the dashboard)

Four families shipped in 2026 and appear nowhere in the data. Verified: zero models
matching "Plus", "6990E", "Core 3 30x" or the Core Ultra 300 series exist in
`intel-cpu-specs.json`.

### 2.1 Arrow Lake Refresh — Core Ultra 200S/HX Plus (March 2026)
Desktop refresh on the existing LGA 1851 socket. Three desktop SKUs plus mobile HX parts.

| Model | Cores | Notes |
|---|---|---|
| Core Ultra 7 270K Plus | 8P + 16E = 24 | $299 at launch |
| Core Ultra 5 250K Plus | 6P + 12E = 18 | $199 at launch |
| Core Ultra 5 250KF Plus | 6P + 12E = 18 | no iGPU |
| Core Ultra 9 290HX Plus | — | mobile, ~8% over 285HX |

No Core Ultra 9 desktop refresh — reportedly cancelled, since the 285K is already 24 cores.
Adds DDR5-7200 support and a faster chiplet interconnect.

*Scope: small — one architecture entry, ~4 models.*

### 2.2 Wildcat Lake — Core Series 3 (April 2026)
Entry-level 18A part, positioned below Panther Lake. **Drops the "Ultra" branding.** Six
SKUs, all 15 W PBP / 35 W MTP, up to 6 cores (2 Cougar Cove P + 4 Darkmont LP-E).

Succeeds Alder Lake-N and Twin Lake, both of which the dashboard already carries — so this
is a live gap in an existing product line, not a new segment.

Known SKUs: Core 3 304, Core 3 305, Core 5 305 (no NPU, edge-only), Core 5 320,
Core 7 350, Core 7 360.

*Scope: small — one architecture entry, 6 models.*

### 2.3 Clearwater Forest / Xeon 6+ SKUs (June 2026)
The architecture entry exists but is mis-flagged, and its 5 spec models are pre-launch
estimates. Actual launch lineup is **four SKUs across six configurations**, 144–288 cores:

- Xeon 6990E+ — 288 cores
- Xeon 6960E+ — 144 cores
- (two further SKUs, six configurations total)

Up to 576 MB L3, 12-channel DDR5-8000 MRDIMM, 96 lanes PCIe 5.0, TDP to 450 W.

*Scope: small — replace 5 estimated models with the real lineup.*

### 2.4 Panther Lake retail SKUs (Jan 2026 onward)
The entry exists with only **3 models**; the launch was 14 SKUs, and more shipped after:

- Core Ultra 5 / 7 / 9 tiers, plus new **Core Ultra X7 / X9** with Arc Xe3 graphics
- Core Ultra X9 378H — launched separately, April 2026
- Arc G3 series (28 May 2026) — handheld/portable variant
- Starfire (July 2026) — spacecraft variant, −55 °C to 125 °C

*Scope: medium — expand 3 models to the full retail lineup.*

---

## 3. Empty SKU cards — 19 of 44

Nearly half the Intel SKU cards render with no spec table. These aren't unreleased parts;
most are shipping silicon with no data behind the card.

**Server / embedded (7):**
`Granite Rapids D`, `Granite Rapids AP`, `Sierra Forest AP`, `Emerald Rapids MCC`,
`Emerald Rapids XCC`, `Sapphire Rapids HBM`, `Diamond Rapids HBM`

Granite Rapids-D shipped Q1 2025 (Xeon 6 SoC, 12–72 P-cores). Granite Rapids-AP is the
Xeon 6900P series — five SKUs, 72–128 cores, launched Sept 2024. Both are well-documented
and long shipping.

**Client (9):**
`Meteor Lake-H`, `Meteor Lake-U`, `Meteor Lake-PS`, `Raptor Lake-HX`, `Raptor Lake-H`,
`Raptor Lake-PX`, `Raptor Lake-P`, `Raptor Lake-U`, `Raptor Lake-HX (14th)`

**Meteor Lake has zero spec data across all three cards** despite being a shipping 2023
generation — the largest single hole in the Intel dataset.

**Other (3):** `Xeon E`, `Nova Lake`, `Panther Lake High Power`

The last two are legitimately empty (unreleased). The rest are not.

---

## 4. Structural issues

**Twin Lake is in the wrong era.** Listed under the `2021 – 2022` separator but carries
`year: 2024`. It renders between Alder Lake and Rocket Lake, out of chronological order.

**Atom (Embedded) spans 2017–2024** but sits under the `2020` separator. Arguably fine as
a catch-all, but it's the only entry whose year range doesn't fit its era.

**Era coverage stops at 2026.** Diamond Rapids and Nova Lake both need 2027 placement,
which means a new era separator.

**Xeon 6 naming is inconsistent.** The dashboard uses internal codenames (`Granite Rapids
AP`, `Granite Rapids SP`) where Intel's public branding is Xeon 6900P / 6700P / 6500P.
AMD entries use codenames too, so this is defensible — but a customer searching "6980P"
finds nothing today.

---

## 5. Recommended priority

**P0 — factually wrong, visible to customers**
1. Remove `unreleased` from Panther Lake and Clearwater Forest (shipped 5+ months ago)
2. Move Diamond Rapids to 2027; add a 2027 era separator
3. Move Nova Lake to 2027

**P1 — missing shipping products**
4. Add Arrow Lake Refresh (Core Ultra 200S/HX Plus) — small, high visibility
5. Add Wildcat Lake (Core Series 3) — small, fills the Alder Lake-N / Twin Lake line
6. Replace Clearwater Forest's estimated models with the shipped 4-SKU lineup
7. Expand Panther Lake from 3 to the full retail lineup

**P2 — fill the empty cards**
8. Granite Rapids-D and Granite Rapids-AP (Xeon 6900P) — both long shipping, well documented
9. Meteor Lake — three empty cards on a whole shipping generation
10. Raptor Lake mobile variants — six empty cards

**P3 — housekeeping**
11. Fix Twin Lake's era placement
12. Consider adding Xeon 6 marketing names to the searchable text

---

## 6. How to source the data

Per the project's first golden rule, **none of the specs above should be typed in from
this report.** The numbers here are for scoping, not for import.

Intel publishes full specification tables on ARK, exportable as CSV. That's the same path
used for the EPYC 9006 import — `tools/import-specs.py` handles the mapping, and the
per-model verification step catches transcription errors.

The importer's column guesser is tuned to AMD's CSV headers; the first Intel import will
need manual mapping corrections, which can then be folded into `GUESS`.

---

## Sources

- [Panther Lake — Intel Newsroom, CES 2026](https://newsroom.intel.com/client-computing/ces-2026-intel-core-ultra-series-3-debut-first-built-on-intel-18a)
- [Panther Lake — Wikipedia](https://en.wikipedia.org/wiki/Panther_Lake_(microprocessor))
- [Panther Lake launch — ServeTheHome](https://www.servethehome.com/intel-launches-core-ultra-series-3-mobile-processors-panther-lake-roars-to-life/)
- [Clearwater Forest launch — ServeTheHome](https://www.servethehome.com/intel-xeon-6-clearwater-forest-is-out/)
- [Clearwater Forest 288 cores — The Register](https://www.theregister.com/systems/2026/06/01/intel-launches-288-core-clearwater-forest-xeon-6-on-18a-process/5248150)
- [Diamond Rapids 2027 — Tom's Hardware](https://www.tomshardware.com/pc-components/cpus/intel-xeon-7-diamond-rapids-cpus-officially-launching-in-2027-on-intel-18a-p-next-gen-p-core-xeon-features-pcie-6-0-50-percent-higher-core-counts-and-twice-the-memory-bandwidth)
- [Diamond Rapids 2027 — ServeTheHome](https://www.servethehome.com/intel-xeon-7-diamond-rapids-now-slated-for-2027/)
- [Nova Lake 2027 rollout — Tom's Hardware](https://www.tomshardware.com/pc-components/cpus/intel-nova-lake-leak-points-to-core-ultra-series-400-branding-staggered-release-next-year-hotly-anticipated-flagship-52-core-desktop-cpu-might-not-arrive-until-late-2027)
- [Nova Lake — Wikipedia](https://en.wikipedia.org/wiki/Nova_Lake_(microprocessor))
- [Arrow Lake Refresh launch — Tom's Hardware](https://www.tomshardware.com/pc-components/cpus/intel-confirms-arrow-lake-refresh-set-for-2026-nova-lake-later-that-year-company-admits-there-are-holes-to-fill-on-the-desktop-front-says-it-is-confident-in-the-roadmap)
- [Core Ultra 200S Plus reviews — The FPS Review](https://www.thefpsreview.com/2026/03/24/intel-core-ultra-200s-plus-reviews-are-in-arrow-lake-gets-its-redemption-arc/)
- [Core Ultra 200S Plus product brief — Intel](https://www.intel.com/content/www/us/en/content-details/874111/intel-core-ultra-200s-plus-series-processors-product-brief.html)
- [Wildcat Lake launch — Tom's Hardware](https://www.tomshardware.com/tech-industry/intel-launches-wildcat-lake-as-core-series-3)
- [Wildcat Lake edge overview — Intel](https://www.intel.com/content/www/us/en/content-details/917657/intel-core-series-3-processors-for-the-edge-codenamed-wildcat-lake-overview.html)
- [Wildcat Lake SKUs — CNX Software](https://www.cnx-software.com/2026/04/17/intel-core-series-3-wildcat-lake-processor-family-launched-for-entry-level-laptops-and-edge-ai-systems/)
- [Granite Rapids-D Xeon 6 SoC — ServeTheHome](https://www.servethehome.com/intel-xeon-6-soc-is-here-granite-rapids-d-is-huge/)
- [Xeon 6900P launch — Tom's Hardware](https://www.tomshardware.com/pc-components/cpus/intel-launches-granite-rapids-xeon-6900p-series-with-120-cores-matches-amd-epycs-core-counts-for-the-first-time-since-2017)
- [Xeon 6 product brief — Intel](https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2025-02/xeon-6-granite-rapids-product-brief.pdf)
