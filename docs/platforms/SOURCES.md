# Platform compatibility: sourced snapshot

Snapshot: 2026-09-30. The companion data file is `js/data/platform-compatibility.json`.
The current local snapshot joins 224 distinct catalog CPU identities to 43 named
platforms through 749 exact CPU-to-system edges from 68 official source records.
It is a reviewed sample across six OEMs, not an exhaustive market matrix. An absent
edge means **not yet verified**, never unsupported. The [coverage report](COVERAGE.md)
sets out the generation boundary and mapped CPU denominator.

This page preserves the original source examples and evidence rules. The complete
dated source ledger lives in the snapshot's `sources[]` records. Expansion candidates,
their independent reviews, and publication decisions are retained in the
[manifest](PUBLICATION-MANIFEST.json) and adjacent research files. Candidate rows
outside that manifest do not appear in the dashboard.

## Evidence standard

- Each displayed `compatibility` edge has an exact CPU SKU named for that exact OEM
  platform in an OEM processor-support table, ordering list, or fixed configuration.
  A processor family, socket match, TDP fit, reseller listing, or benchmark alone does
  not prove OEM support.
- `catalogId` joins the dashboard's generated `benchmark-catalog.json` identity. The
  small `products[]` projection lets the browser render the feature without loading
  that full catalog. Model names are display text, not the join key.
- `socketCount` is the platform's physical CPU capacity. `supportedCpuQuantities`,
  where present, describes the exact CPU row. `memoryChannelsPerSocket` is distinct
  from `dimmSlots` and from the number of channels populated in any one system.
  `dimmSlots` is the stated platform maximum; particular configurations may expose
  fewer slots (for example, SR650 V4 machine type 7DK2 has 16 instead of 32).
- `supportLevel: confirmed` means OEM documentation explicitly names the SKU and
  platform. It is not a promise that every storage, GPU, fan, firmware, memory, ambient
  temperature, or regional order configuration is valid. Follow the linked OEM guide
  for a quote or build.
- The Cisco C885A M8 edge is a **fixed** 9575F configuration. It must not be shown as
  an open-ended CPU upgrade path. The SR675i V3 fixed inference model in the shared
  Lenovo guide uses EPYC 9535; the 9575F edge is only for **SR675 V3**.
- OEM documents change. Store retrieval dates and review these links again before
  making availability claims. HPE PDF links and Dell regional guide links may resolve
  to later revisions while retaining the same URL.

## Original official source examples

| Source IDs | Exact evidence used |
| --- | --- |
| [lenovo-sr655-v3](https://lenovopress.lenovo.com/lp1610-thinksystem-sr655-v3-server) | SR655 V3 overview, 9575F row in 5th Gen processor support, and memory options: 1 socket, 2U, 12 channels and DIMM slots. |
| [lenovo-sr665-v3](https://lenovopress.lenovo.com/lp1608-thinksystem-sr665-v3-server) | SR665 V3 overview; Tables 14 and 15 name 9575F and 9554 with 1-or-2 CPU quantities; memory options provide 12 channels per socket and 24 DIMM slots. |
| [lenovo-sr675-v3](https://lenovopress.lenovo.com/lp1611-thinksystem-sr675-v3-server) | SR675 V3 introduction; Tables 10 and 11 name 9575F and 9554 with 1-or-2 CPU quantities; memory section gives 12 channels per socket and 24 DIMM slots. |
| [hpe-dl325-gen12](https://www.hpe.com/psnow/downloadDoc/HPE%20ProLiant%20Compute%20DL325%20Gen12%20QuickSpecs-a50009232enw.pdf?contentDisposition=attachment&form=false&hf=regular&id=a50009232enw.pdf&isFutureVersion=true&isLinearized=false&preview=false&ver=2) | QuickSpecs pp. 1, 10-11: 1U single-socket design, explicit 9575F row, 12 channels and 24 DIMM slots. |
| [hpe-dl345-gen12](https://www.hpe.com/psnow/downloadDoc/HPE%20ProLiant%20Compute%20DL345%20Gen12%20QuickSpecs-a50009233enw.pdf?contentDisposition=attachment&form=false&hf=regular&id=a50009233enw.pdf&isFutureVersion=true&isLinearized=false&preview=false&ver=1) | QuickSpecs pp. 1, 5-6: 2U 1P design, explicit 9575F row, 12 channels and 24 DIMM slots. |
| [dell-r6715-guide](https://www.delltechnologies.com/asset/en-us/products/servers/technical-support/poweredge-r6715-technical-guide.pdf) | R6715 product comparison, processor features and supported-processor table explicitly list 9575F; 1U, one socket, 12 channels. |
| [dell-r7725-guide](https://www.delltechnologies.com/asset/en-in/products/servers/technical-support/poweredge-r7725-technical-guide.pdf), [dell-r7725-spec](https://www.delltechnologies.com/asset/en-us/products/servers/technical-support/poweredge-r7725-spec-sheet.pdf) | R7725 supported-processor table explicitly lists 9575F and processor features give 12 channels; specification sheet confirms two-socket 2U chassis. |
| [cisco-c885a-datasheet](https://www.cisco.com/c/en/us/products/collateral/servers-unified-computing/ucs-c-series-rack-servers/ucs-c885a-m8-ds.pdf), [cisco-c885a-service](https://www.cisco.com/c/en/us/td/docs/unified_computing/ucs/c/hw/c885A/install/b_c885a-m8-server-hig/m_overview.html) | Data sheet pp. 4-5: 8RU, two 9575F CPUs, fixed configuration PID UCSC-885A-M8-M352; service guide DIMM locations: 12 channels and DIMMs per CPU. |
| [lenovo-sr650-v4](https://lenovopress.lenovo.com/lp2127-thinksystem-sr650-v4-server) | SR650 V4 standard specifications (2U, up to two sockets, 8 channels per socket, 32 DIMMs) and explicit Xeon 6787P option row. |
| [hpe-dl380-gen12](https://www.hpe.com/nl/en/collaterals/collateral.a00073551enw.html) | DL380 Gen12 QuickSpecs: 2U, up to two sockets, 8 channels per socket, 32 DIMMs; Xeon 6787P processor and HPE option P73837-B21. |
| [dell-r770-guide](https://www.delltechnologies.com/asset/en-us/products/servers/technical-support/poweredge-r770-technical-guide.pdf) | R770 product comparison and supported Xeon 6 P-core table explicitly list 6787P; 2U, two sockets, 8 channels per socket, 32 DIMM slots. |
| [gigabyte-r163-p32-product](https://www.gigabyte.com/ie/Enterprise/Rack-Server/R163-P32-AAH1), [gigabyte-r163-p32-qvl](https://www.gigabyte.com/ie/Enterprise/Rack-Server/R163-P32-AAH1/Support-QVL) | Product specifications identify 1U, one socket, 8 channels and 16 DIMM slots. The Ireland QVL CPU table names seven exact AmpereOne X SKUs; see the [Ampere research note](AMPERE-RESEARCH.md) for the complete list and extraction details. |

## Original client source examples

| Source ID | Exact evidence used |
| --- | --- |
| [hp-elitebook-8-g1a-14-d6cv5ua](https://www.hp.com/us-en/shop/pdp/hp-elitebook-8-g1a-14-inch-notebook-next-gen-ai-pc-wolf-pro-security-edition-p-d6cv5ua-aba-1) | HP product `D6CV5UA#ABA` is a fixed published EliteBook 8 G1a 14 configuration with Ryzen AI 7 PRO 350. Its Technical Specs give the 14-inch display and chassis dimensions: 12.43 × 8.74 × 0.46 inches at front, 0.61 inches at rear. This does not establish live inventory. |
| [lenovo-m90q-gen-6](https://psref.lenovo.com/syspool/Sys/PDF/ThinkCentre/ThinkCentre_M90q_Gen_6/ThinkCentre_M90q_Gen_6_Spec.PDF) | ThinkCentre M90q Gen 6 PSREF processor table names Core Ultra 7 265. Its Mechanical section gives Tiny (1 L) and 179 × 182.9 × 36.5 mm dimensions. This is an OEM-documented processor option, not proof of every regional configuration. |

## Next research pass

Continue OEM by OEM, using exact CPU option lists as the unit of work. The
current [coverage report](COVERAGE.md) shows 208 of 272 reviewed contemporary
server identities with at least one exact OEM platform entry in this selected
snapshot. This is a research-progress measure, not an OEM support percentage.
Prioritize the 64 unmapped eligible server identities, NVIDIA CPU modules,
other system builders, and deeper client/workstation inventories. Hold complex
Dell cooling cases and Lenovo Intel quantity claims until their configuration
limits can be resolved. Ampere's [platform directory](https://amperecomputing.com/en/products/platforms)
  identifies systems by **processor family**, while Gigabyte's R163-P32-AAH1 QVL provides one exact-SKU Ampere seed. The seven QVL CPU rows were directly verified in an interactive browser on 2026-09-30; a static text extraction still sees only the page shell. Future Gigabyte passes need the same rendered-table check. Other family-level platform listings alone do not establish support for a particular SKU.
For client PCs, capture exact marketed device variants and regional configurations
rather than mapping every CPU to a whole product family. Add chassis dimensions only
when OEM documentation gives a stable measurement and its bezel/drive configuration.
