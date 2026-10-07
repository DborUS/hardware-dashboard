# ChipIndex benchmark program

**Release candidate, October 7, 2026.** The first production review prioritizes
datacenter CPUs and accelerators, followed by client CPUs and graphics. Scores
are linked public results matched to exact ChipIndex products. The catalog
contains 2,393 product identities; the imported snapshots cover 697 of them.
The complete public benchmark universe is larger than these cohorts.

## Current release scope

| Hardware and workload | Results | Matched catalog products | Comparison boundary |
| --- | ---: | ---: | --- |
| Enterprise CPUs — SPEC CPU 2017 integer/floating-point rate | 3,287 | 513 | Same metric and 1-/2-CPU count; reviewed 1.0/1.1 patch compatibility |
| Enterprise CPUs — SPEC CPU 2026 integer/floating-point rate | 355 | 76 | Same metric, 1-/2-CPU count and test build |
| Datacenter accelerators — MLPerf® Inference v6.0 Llama 2 70B 99% | 46 | 7 | Closed/Available, one node, eight accelerators; Server and Offline separate |
| Client CPU / graphics — Blender Open Data 5.2.0 rendering | 174 | 174 | CPU and GPU separate; manufacturer form factor is metadata, not submitted chassis |
| **Total, counting distinct products across sources** | **3,862** | **697** | No cross-benchmark scores or ratios |

The four catalog product-type views show 516/918 enterprise CPUs, 7/53
datacenter accelerators, 129/1,076 client CPUs, and 45/352 graphics products
with at least one selected score. These are snapshot matches against all
indexed products in each type, not percentages of test-eligible hardware.
An absent result does not assign zero performance or prove no public score.

## Selection and score contract

SPEC's official rate-result indexes expose thousands of submitted systems.
The importer scans all available CPU2017 and CPU2026 integer/floating-point
rate indexes for exact catalog enterprise CPU matches. It includes every
qualified CPU2026 report in the current reviewed indexes. For CPU2017 it
retains the two newest reports per exact CPU model and CPU count plus all
previously verified report IDs. This yields archive-wide model discovery with
bounded system disclosures; the source review records excluded reports and
reasons. `--all-reports` is an explicit importer policy for full CPU2017
capture. A reported score is one tested system, not a CPU-only score. Catalog CPU
specifications shown beside model names come from the matching dashboard
product record. Core and clock figures describe that product model, not the
clock reached in the benchmark. SPEC enabled cores and CPU count describe the
submitted system; they can differ from nominal product specifications.
[SPEC confirms CPU2017 v1.0 and v1.1 comparability](https://www.spec.org/cpu2017/press/v1_1_release.html).
[SPEC confirms v1.1.9's comparable published performance](https://spec.org/pressreleases/20221201-academic-pricing/).
SPEC CPU2026 v0.902.0, v0.903.0, v1.0.0 and v1.0.1 stay in separate test-build
views. CPU2017 and CPU2026 also use separate metrics and score scales.
The [fair use policy](https://www.spec.org/products/fairuse/) governs
benchmark context and reporting.

The NVIDIA GB10 source is a SPEC CPU report for a DGX Spark system. The
reviewed alias additionally requires the source's 20 cores per chip, so the
score describes its CPU component. It says nothing about GPU or combined AI
performance. Ambiguous model names remain in the import review queue.

The selected MLPerf v6.0 workload fixes division, availability, quality target,
node count and accelerator count. Server measures request-stream throughput
under response-time limits; Offline measures batch throughput. Scores are
whole-system Tokens/s; host processors, power caps, weight precision and
software vary by submission. B300 remains in the source review because the
public source's 270 GB label and the catalog's 288 GB label have no verified
identity mapping. Use the [MLCommons messaging guidance](https://github.com/mlcommons/policies/blob/master/MLPerf_Results_Messaging_Guidelines.adoc)
for public result context.

Blender results are community medians with at least five submissions and
exact catalog matches. CPU and GPU, test version and compute grouping define
cohorts. The public grouped export is downloaded and hashed. A desktop/laptop
filter follows manufacturer form-factor specifications; dual-use AMD CPUs
appear in both. The score does not reveal the submitting system's cooling,
power limit or chassis.

## Sources outside this release

PassMark's [standard data restrictions](https://www.passmark.com/services/market-analysis.php)
exclude sites primarily presenting benchmark comparisons or rankings; the
owner confirmed no separate public-display permission. It remains a linked
source without imported scores. Phoronix Test Suite can export saved results,
but public OpenBenchmarking access returned 403 during this review and hosted
result reuse terms could not be verified. Import remains disconnected. The
runner's open-source license does not grant rights to republish third-party
hosted result data. Future new workload cohorts require their own matching,
units, version comparison rules, publication terms and source review.

## Data updates and release gate

`python tools/refresh-benchmarks.py --check` is an offline reproducibility
check for the retained SPEC source records, MLPerf summary and Blender export.
It validates all snapshot rows, the 2,393-product catalog and the generated
source registry. New results require an explicit network capture:
`python tools/refresh-benchmarks.py --refresh all --allow-network` (or choose a
single source). The importers retain source URLs, hashes, true capture dates,
selected score fields and exclusion reviews. Failed validation restores the
last validated published files. Large original SPEC HTML files form an
ignored, resumable local cache; the normalized retained source inputs and
hash manifest reproduce the committed snapshots without that cache or network.
The browser reads only dated local JSON.

The benchmark validation workflow runs on repository changes, performing
read-only importer checks, catalog and registry checks, source-specific tests,
benchmark browser smoke, full dashboard smoke and layout audit. The reviewer
then inspects representative desktop and 320–390px screenshots, verifies
original source links/attribution and reviews the pending visitor update.
The workflow does not fetch new source data or publish the site. The owner
handles the commit and release under the repository workflow.
