# HPE platform expansion: independent second review

Reviewed 2026-09-30 against HPE QuickSpecs versions linked below. The review tested the research candidate, not the published site. A fixed sample selected one edge from each of six platforms, then four more from the remaining edges: `random.Random(20260930)`, `choice` from each sorted platform group in candidate order, followed by `sample(..., 4)` from the unsampled candidate list. This makes the same ten rows reproducible from the 200-edge JSON.

**Result: 10/10 exact CPU model and HPE processor-kit codes match an official option row; 6/6 platform chassis, socket, channel and representative size records match official HPE specifications.** No sampled edge needs removal. The three incomplete restriction notes found during review were corrected in the candidate and its generator. Publish processor-specific restrictions wherever an edge is shown; an unqualified compatibility badge would overstate the configurations below.

## Sampled option rows

| Platform | Exact processor | HPE kit | Official row locator | Identity |
| --- | --- | --- | --- | --- |
| DL320 Gen12 | Xeon 6741P | `P73830-B21` | [DL320] Core Options > Processor, Single Socket Processors (Rich I/O) | Pass |
| DL380 Gen12 | Xeon 6714P | `P74508-B21` | [DL380] Core Options > Processor, Mainline Processors | Pass |
| DL145 Gen11 | EPYC 8434PN | `P71871-B21` | [DL145] PDF p. 70, Core Options > Processor; also p. 32 thermal table | Pass |
| DL325 Gen11 | EPYC 9175F | `P72669-B21` | [DL325] PDF p. 24, Core Options > Processor | Pass |
| DL345 Gen11 | EPYC 9384X | `P63492-B21` | [DL345] PDF p. 28, Core Options > Processor | Pass |
| DL365 Gen11 | EPYC 9534 | `P53699-B21` | [DL365] Core Options > Processor Option Kits | Pass |
| DL145 Gen11 | EPYC 8024P | `P69258-B21` | [DL145] PDF p. 70, Core Options > Processor; also p. 32 thermal table | Pass |
| DL145 Gen11 | EPYC 8535P | `P88842-B21` | [DL145] PDF p. 70, Core Options > Processor; also pp. 21, 32, 51 configuration tables | Pass |
| DL380 Gen12 | Xeon 6515P | `P74506-B21` | [DL380] Core Options > Processor, Mainline Processors | Pass |
| DL365 Gen11 | EPYC 9554 | `P53700-B21` | [DL365] Core Options > Processor Option Kits | Pass |

## Platform specification check

Sizes are height × width × depth for the specified chassis variant, not a universal dimension for every drive/GPU option.

| Platform | Chassis and sockets | Channels per CPU / DIMM slots | Representative dimensions | Official locator |
| --- | --- | --- | --- | --- |
| DL145 Gen11 | 2U edge server; 1 socket; rack, wall or desk mount | 6 / 6 | 8.75 × 35.94 × 40.66 cm, without bezel/filter | [DL145] pp. 1–2, 10, 87 |
| DL325 Gen11 | 1U rack; 1 socket | 12 / 12 | 4.29 × 43.46 × 64.94 cm, 8SFF | [DL325] pp. 1, 8, 53 |
| DL345 Gen11 | 2U rack; 1 socket | 12 / 12 | 8.75 × 44.8 × 64.6 cm, SFF/EDSFF | [DL345] pp. 1, 8, 63 |
| DL365 Gen11 | 1U rack; up to 2 sockets | 12 / 24 total | 4.29 × 43.46 × 64.94 cm, SFF | [DL365] Overview, Memory, System Unit |
| DL320 Gen12 | 1U rack; 1 socket | 8 / 16 | 4.28 × 43.46 × 60.75 cm, SFF | [DL320] Overview, Memory, System Unit |
| DL380 Gen12 | 2U rack; up to 2 sockets | 8 / 32 total | 8.75 × 44.80 × 72.70 cm, SFF/EDSFF | [DL380] Overview, Memory, System Unit |

## Configuration findings and publication disposition

- **DL145 / EPYC 8535P:** The QuickSpecs marks `P88842-B21` **“Not support” only in the Optimized Acoustics table** (p. 21). Its standard 2U heatsink thermal table supports the processor at the listed ambient points through 55°C (p. 32), while the 1U heatsink table lists support through 45°C (p. 51). The candidate now names the Optimized Acoustics FIO incompatibility explicitly and retains the DDR5-6400 requirement (p. 70). Display that note with the edge. This is not a failed CPU/platform match.
- **DL325 / EPYC 9175F:** At 320W, `P72669-B21` requires closed-loop liquid-cooling heatsink `P58463-B21` and liquid-cooling fans `P59668-B21` ([DL325] pp. 25, 43–44). The >300W matrix varies supported backplanes, ambient limits, high-capacity DIMMs and boot-device options by chassis. The candidate now points to those configuration limits. Display the note; do not imply that every DL325 drive layout works.
- **DL345 / EPYC 9384X:** At 320W, `P63492-B21` requires performance heatsink `P58459-B21` and performance fans `P58465-B21` ([DL345] pp. 28–29, 53). The 4LFF mid-tray cage expressly requires a CPU at or below 300W (p. 33); the cooling summary lists 4LFF/8SFF mid-tray layouts only through 300W (p. 53). The candidate now names this limit. Display the note; do not advertise the full mid-tray capacity for this CPU.
- **DL320 / Xeon 6741P:** Its 300W option requires closed-loop liquid-cooling heatsink `P76605-B21` and seven matching fan kits `P76603-B21` ([DL320] Core Options > Processor and Cooling). The existing candidate restriction note already states the >270W rule; make it visible in the UI.
- **DL365 / EPYC 9534 and 9554:** HPE requires matching models in a 2P build and two CPUs for an EDSFF CTO configuration. Both sampled CPUs exceed 240W, so performance cooling is required. The 360W 9554 also invokes the >=320W drive-count limits ([DL365] Configuration Information > Step 2). The candidate note already covers these rules; make it visible in the UI.
- **DL380 / Xeon 6714P and 6515P:** HPE requires matching models in a 2P build; both sampled options are <=225W and therefore meet the 4LFF midplane CPU-power condition ([DL380] Configuration Information > Step 1). HPE's overview table gives 6714P as 195W, while its exact processor option row and [Intel's specification][Intel6714P] give 165W. Treat the overview value as an internal QuickSpecs discrepancy; the model-to-kit identity is unaffected. Do not infer per-SKU 1P/2P support solely from the two-socket chassis description.

**Handoff:** The ten sampled edges pass source-row identity review. The corrected DL145 8535P, DL325 9175F and DL345 9384X rows should be held from publication if their `restrictionNote` cannot be shown with the compatibility result. The same visibility requirement applies to DL320 6741P and DL365 9534/9554. This sample does not certify all 200 candidate edges.

[DL145]: https://www.hpe.com/psnow/downloadDoc/HPE%20ProLiant%20DL145%20Gen11%20QuickSpecs-a50009217enw.pdf?contentDisposition=attachment&deepLink=&form=false&hf=regular&id=a50009217enw.pdf&isFutureVersion=false&isLinearized=false&originalObjectName=&prelaunchSection=&preview=false&print=&r=&section=&softrollSection=&utm_campaign=&utm_content=&utm_medium=&utm_source=&utm_term=&ver=22 "HPE ProLiant DL145 Gen11 QuickSpecs, v22"
[DL325]: https://www.hpe.com/psnow/downloadDoc/HPE%20ProLiant%20DL325%20Gen11%20QuickSpecs-a50004297enw.pdf?contentDisposition=attachment&deepLink=&form=false&hf=regular&id=a50004297enw.pdf&isFutureVersion=false&isLinearized=false&originalObjectName=&prelaunchSection=&preview=false&print=&r=&section=&softrollSection=&utm_campaign=&utm_content=&utm_medium=&utm_source=&utm_term=&ver=40 "HPE ProLiant DL325 Gen11 QuickSpecs, v40"
[DL345]: https://www.hpe.com/psnow/downloadDoc/HPE%20ProLiant%20DL345%20Gen11%20QuickSpecs-a50004298enw.pdf?contentDisposition=attachment&deepLink=&form=false&hf=regular&id=a50004298enw.pdf&isFutureVersion=false&isLinearized=false&originalObjectName=&prelaunchSection=&preview=false&print=&r=&section=&softrollSection=&utm_campaign=&utm_content=&utm_medium=&utm_source=&utm_term=&ver=40 "HPE ProLiant DL345 Gen11 QuickSpecs, v40"
[DL365]: https://www.hpe.com/us/en/collaterals/collateral.a50004299enw.html "HPE ProLiant DL365 Gen11 QuickSpecs, v45"
[DL320]: https://www.hpe.com/fi/en/collaterals/collateral.a50004283enw.html "HPE ProLiant Compute DL320 Gen12 QuickSpecs, v20"
[DL380]: https://www.hpe.com/nl/en/collaterals/collateral.a00073551enw.html "HPE ProLiant Compute DL380 Gen12 QuickSpecs, v19"
[Intel6714P]: https://www.intel.com/content/www/us/en/products/sku/242671/intel-xeon-6714p-processor-48m-cache-4-00-ghz/specifications.html "Intel Xeon 6714P specifications"
