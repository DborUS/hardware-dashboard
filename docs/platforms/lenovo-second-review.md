# Lenovo expansion: independent second review

Reviewed 2026-09-30 against current Lenovo Press product guides. **Status: approved for exact CPU-to-system edges, with 182 Intel socket-population claims withheld.** The first-pass candidate was corrected before this approval. Its `quantityAsPrinted` value remains in the research artifact, while the public snapshot omits `supportedCpuQuantities` for the 182 ambiguous rows and shows a configuration note.

The second reviewer checked one seeded row in every one of the eleven product guides, including the SKU and option/feature code. All eleven exact CPU/system rows were present:

| System | Sample exact option | Result |
| --- | --- | --- |
| [ThinkEdge SE455 V3](https://lenovopress.lenovo.com/lp1724-thinkedge-se455-v3-server) | EPYC 8124PN, BY8Z | Exact row and one-CPU quantity confirmed. |
| [ThinkSystem SD535 V3](https://lenovopress.lenovo.com/lp1892-thinksystem-sd535-v3-server) | EPYC 9124, BREE | Exact node row confirmed; this is a multi-node system, not a blade. |
| [ThinkSystem SR630 V3](https://lenovopress.lenovo.com/lp1600-thinksystem-sr630-v3-server) | Xeon Silver 4510, 4XG7A91483 | Exact row confirmed; quantity interpretation withheld. |
| [ThinkSystem SR630 V4](https://lenovopress.lenovo.com/lp1971-thinksystem-sr630-v4-server) | Xeon 6527P, 4XG7B04160 | Exact row confirmed; quantity interpretation withheld. |
| [ThinkSystem SR635 V3](https://lenovopress.lenovo.com/lp1609-thinksystem-sr635-v3-server) | EPYC 9734, BW9S | Exact row and one-CPU quantity confirmed. |
| [ThinkSystem SR645 V3](https://lenovopress.lenovo.com/lp1607-thinksystem-sr645-v3-server) | EPYC 9455, 4XG7B02708 | Exact row and one-or-two quantity confirmed. |
| [ThinkSystem SR650 V3](https://lenovopress.lenovo.com/lp1601-thinksystem-sr650-v3-server) | Xeon Platinum 8470Q, BN0P | Exact row confirmed; quantity interpretation withheld. |
| [ThinkSystem SR650 V4](https://lenovopress.lenovo.com/lp2127-thinksystem-sr650-v4-server) | Xeon 6787P, 4XG7B03694 | Exact row confirmed; quantity interpretation withheld. |
| [ThinkSystem SR655 V3](https://lenovopress.lenovo.com/lp1610-thinksystem-sr655-v3-server) | EPYC 9354P, BREG | Exact row and one-CPU quantity confirmed. |
| [ThinkSystem SR665 V3](https://lenovopress.lenovo.com/lp1608-thinksystem-sr665-v3-server) | EPYC 9124, 4XG7A85822 | Exact row and one-or-two quantity confirmed. |
| [ThinkSystem ST45 V3](https://lenovopress.lenovo.com/lp1994-thinksystem-st45-v3-server) | EPYC 4464P, C1G9 | Exact CTO row and one-CPU quantity confirmed. |

The Intel guides label a table column `Quantity supported` and print `2` for many SKUs, while related one-processor configuration sections and local option notes need a more specific interpretation. This affects 182 candidate edges. Publishing the exact processor/system pairing is supported by the option row; publishing an allowed one- or two-CPU build for those edges is deferred. The 80 affected 4th Gen Xeon rows in the two V3 guides additionally retain the adjacent “single-processor configurations are not supported” wording for follow-up. Exact `1*` rows and AMD `1` / `1 or 2` rows keep their unambiguous quantities. See the candidate's per-edge notes and [Lenovo research handoff](lenovo-expansion-notes.md) for cooling, CTO, node, and DIMM configuration conditions.

This review is a sampled release gate, not an audit of every possible OEM build. The CPU/system inventory remains incomplete beyond these eleven guides.
