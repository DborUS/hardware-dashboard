# HPE server platform research — candidate expansion

Retrieved 2026-09-30. This is a source-backed review candidate, not a published compatibility claim. The machine-readable candidate is [`hpe-expansion-candidates.json`](hpe-expansion-candidates.json); the transcribed processor-option inventory is [`hpe-expansion-candidates.csv`](hpe-expansion-candidates.csv). Run `python docs/platforms/hpe-expansion-build.py` to regenerate the JSON, then `python tools/check-platforms.py --data docs/platforms/hpe-expansion-candidates.json` to validate identities and structure. A second source-row review is still appropriate before merging it into the site snapshot.

## Reviewed systems

| HPE platform | Official QuickSpecs revision | CPU option rows | New ChipIndex edges | High-level configuration |
| --- | --- | ---: | ---: | --- |
| [ProLiant DL145 Gen11](https://www.hpe.com/psnow/doc/a50009217enw.pdf) | V22, 2026-09-08 | 19 | 19 | EPYC 8004/8005, 2U edge/rack, 1 socket, 6 channels, 6 DIMMs; compact wall/desk mounting also supported. |
| [ProLiant DL325 Gen11](https://www.hpe.com/psnow/doc/a50004297enw.pdf) | V40, 2026-08-03 | 39 | 39 | EPYC 9004/9005, 1U rack, 1 socket, 12 channels, 12 DIMMs. |
| [ProLiant DL345 Gen11](https://www.hpe.com/psnow/doc/a50004298enw.pdf) | V40, 2026-08-03 | 39 | 39 | EPYC 9004/9005, 2U rack, 1 socket, 12 channels, 12 DIMMs. |
| [ProLiant DL365 Gen11](https://www.hpe.com/us/en/collaterals/collateral.a50004299enw.html) | V45, 2026-09-08 | 39 | 39 | EPYC 9004/9005, 1U rack, up to 2 sockets, 12 channels per CPU, 24 DIMMs when 2 CPUs installed. |
| [ProLiant Compute DL320 Gen12](https://www.hpe.com/fi/en/collaterals/collateral.a50004283enw.html) | V20, 2026-09-08 | 32 | 32 | Xeon 6, 1U rack, 1 socket, 8 channels, 16 DIMMs. |
| [ProLiant Compute DL380 Gen12](https://www.hpe.com/nl/en/collaterals/collateral.a00073551enw.html) | V19, 2026-09-08 | 34 | 32 | Xeon 6, 2U rack, up to 2 sockets, 8 channels per CPU, 32 DIMMs. |

The 202 official option rows yield **200 new exact model-to-platform edges** for **105 distinct catalog CPUs**. DL380 Gen12 ↔ Xeon 6787P already exists in the site snapshot. HPE also lists Xeon 6762P (P90157-B21) in DL380 Gen12, but that exact processor is absent from the current ChipIndex catalog; it is recorded under `unmatchedCatalogRows`, not as a compatibility edge.

The user's example, **EPYC 9575F**, has exact HPE processor options in DL325 Gen11, DL345 Gen11 and DL365 Gen11. The single-socket systems use HPE option P72758-B21; DL365 Gen11 also lists that kit in its processor options. The pre-existing Gen12 HPE pilot has two other 9575F edges. Source-row kit codes are kept on every candidate edge.

## Interpretation and configuration limits

The processor-option tables establish that HPE offers the named CPU in that platform. They do not imply that every chassis, cooling, ambient, memory, drive, GPU, or socket population works with that CPU. `supportedCpuQuantities` is recorded only for the one-socket systems. DL365 Gen11 says to select one processor, then select the same model for a second processor, but its option rows do not carry per-SKU 1P/2P counts; EDSFF CTO specifically requires 2 CPUs. DL380 Gen12 likewise allows platform-level one/two-CPU layouts but its processor option rows have no per-SKU quantity field. The candidate therefore leaves `supportedCpuQuantities` absent on both two-socket systems. It records HPE's configuration conditions in each edge's research-only `restrictionNote`.

The DL145 QuickSpecs' optimized-acoustics and 1U-heatsink matrices mark some combinations as “No support”; the same CPUs remain in the main processor Core Options list. Treat those entries as *configuration restrictions*, not global CPU incompatibility. EPYC 8004 requires DDR5-4800 options, while EPYC 8005 requires DDR5-6400 options. On DL325 Gen11, EPYC 9254 and 9384X have 25°C ambient limits, and 9384X is not listed for the EDSFF CTO chassis. DL325 and DL345 processor wattage changes the required heatsink and fan configuration. On DL380 Gen12, the 4LFF midplane cage is limited to CPUs at or below 225W, and Xeon 6731E has UPI 0 in HPE's processor table; its supported socket population merits a dedicated review.

All platforms have chassis-size variants. The candidate `platforms[].dimensions` gives a clearly labeled representative chassis size in H × W × D centimeters. `platformDetails[platformId].chassisVariants` preserves the alternate chassis dimensions and notable restrictions for a future detailed view. For example, DL325 Gen11 ranges from 64.94 cm depth in the 8SFF chassis to 81.84 cm in the GPU CTO chassis. The 12LFF DL320 Gen12 extends to 99.74 cm depth and requires a 1200 mm rack.

## Reproducible QA

1. The build checks the 202 unique `(platform, processor model)` source rows against expected system counts. It requires each linked `catalog_id` to have the same exact model and an AMD or Intel server-tab placement in `benchmark-catalog.json`.
2. It excludes the one already published DL380 Gen12/6787P edge and moves the catalog-missing DL380 Gen12/6762P source row to `unmatchedCatalogRows`. No inferred edge is emitted for it.
3. Every emitted edge is marked `reviewStatus: source_row_verified`, retains the HPE option code and option-table locator under `evidence`, and has an OEM configuration `restrictionNote`. Dual-socket edges make no SKU-specific CPU-count claim.
4. Running `python docs/platforms/hpe-expansion-build.py` produced **105 products, 6 reviewed systems, 200 new edges, 6 HPE sources**. Running `python tools/check-platforms.py --data docs/platforms/hpe-expansion-candidates.json` passed identity, source-domain, schema, duplicate-edge, and source-link checks for that candidate snapshot.

This structural QA does not independently verify every line of the 202-row transcription. The current QuickSpecs option lists were inspected system by system; a second reviewer should spot-check the extracted model/kit pairs against the linked revisions before site publication.

## Inventory still to research

- HPE ProLiant DL385 Gen11 and other two-socket EPYC 9004/9005 systems; DL365 Gen11 provides initial dual-socket coverage but is not the entire portfolio.
- HPE ProLiant DL360 Gen11, DL380 Gen11, and other Intel 4th/5th Gen Xeon Scalable platforms; this candidate pass currently covers Intel Xeon 6 only.
- HPE blades, multi-node, GPU-heavy, and Cray systems where a distinct HPE platform name and exact processor option table can be verified.
- HPE systems with EPYC 9006 or Intel Xeon 6+ options, if current HPE documents publish exact models. None of the six reviewed processor-option lists names those newer families; this is a scope gap, not evidence of incompatibility.

The candidate records use HPE QuickSpecs as the support authority and the ChipIndex benchmark catalog only for the identity join. No vendor generation, socket, or family inference was used to create an edge.
