# Client and workstation expansion: independent second review

Reviewed 2026-09-30 against the OEM sources linked below. Snapshot: `client-expansion-candidates.json` SHA-256 `05d8443c596f8f23782cb66e9324993e09e430b7d50f3291b136a728551af8b0` (16 products, 9 platforms, 24 edges). A reproducible sample used `random.Random(20260930).choice` once from each platform's candidate-order edges, visiting platform IDs in sorted order. This gave one exact processor link per platform. I also checked the three unsampled HP fixed product-code pages because their regional identity is important to the evidence class. The integration editor added the already-reviewed P8 optional 4U rack-kit fact as `platformNote` after the sample; CPU edges and source IDs are unchanged.

**Result:** 9/9 sampled CPU-to-named-product links match their OEM source; 9/9 form factors match; 8/8 populated representative sizes match. The ninth size, HP EliteDesk 8 Tower G1i, is correctly omitted from the candidate because official HP pages conflict on dimension order. `python tools/check-platforms.py --data docs/platforms/client-expansion-candidates.json` passed (16 products, 9 platforms, 24 edges, 16 sources, 3 OEMs). This source sample does not certify every unsampled Lenovo or Dell edge.

## Exact sampled rows and chassis check

| Named platform | CPU and evidence locator | Form factor and size check | Disposition |
| --- | --- | --- | --- |
| Dell 16 Plus 2-in-1 DB06250 | Core Ultra 7 258V, [Dell processor table 1][db-proc], option 3 | Convertible modes in [Dell Modes][db-modes]; 16-inch [display][db-display]; 356.78 x 250.60 x 14.13/15.57 mm [dimensions][db-size] | Pass: family option |
| Dell Precision 7875 Tower | Ryzen Threadripper PRO 7975WX, [Dell processor table 2][p7875-proc], option 9 | Tower; 172.60 x 465.00 x 442.70 mm [base dimensions][p7875-size], excluding feet/lock protrusions | Pass: family option |
| Dell Pro Slim QCS1250 | Core Ultra 7 265, [Dell processor table 2][qcs-proc], option 8 | Slim desktop; 95 x 293 x 303.50 mm [dimensions][qcs-size] | Pass: family option |
| HP EliteBook 8 G1i 14 | Core Ultra 7 265H, US product `D6DG0UA#ABA` and [Technical Specs][eb-265] | Notebook, 14-inch; 12.43 x 8.74 x 0.46/0.61 in, front/rear, on cited US SKU page | Pass: fixed US product code |
| HP EliteDesk 8 Tower G1i | Core Ultra 7 265, Irish product `99M73ET` in [all tech specs][ed-265] | Tower; **size held** due to conflicting HP dimension order (see below) | Pass CPU/form factor; hold size |
| HP Z6 G5 A Workstation | Ryzen Threadripper PRO 9995WX, Indian product `DC2V2PA` in [all tech specs][z6-9995] | Tower; 16.9 x 46.5 x 44.5 cm, W x D x H; page also states 4U rack dimension | Pass: fixed Indian product code |
| Lenovo ThinkCentre M75t Gen 5 | Ryzen 7 PRO 8700G, [PSREF][m75t] p. 2 processor table | 13.6L tower; 145 x 296 x 346 mm, W x D x H, p. 4; Lenovo says size may vary by configuration | Pass: family option |
| Lenovo ThinkPad T14 Gen 6 (AMD) | Ryzen AI 7 PRO 350, [PSREF][t14] p. 2 processor table | 14-inch notebook; 315.9 x 223.7 mm footprint and front/rear heights 10.9/16.13 mm; maximum height differs for WWAN vs non-WWAN, pp. 4-5 | Pass: family option |
| Lenovo ThinkStation P8 | Ryzen Threadripper PRO 7985WX, [PSREF][p8] p. 2 processor table | 39L tower or optional 4U rack with rail kit; 175 x 508 x 434.4 mm, W x D x H with feet, p. 5 | Pass: family option |

## Evidence classes and visibility requirements

**Selectable system-family options:** Lenovo PSREF and Dell owner's manuals explicitly list several supported processor choices for the named model. The six sampled Lenovo/Dell edges belong to this class. The source proves an OEM-documented model option; it does not prove current regional stock, a compatible field upgrade, or that an individual unit contains the processor. Dell's DB06250 manual explicitly shows notebook, tablet, stand and tent modes; Lenovo's P8 PSREF additionally offers a 4U rack mounting kit. Those details should remain visible when the platform is expanded.

**Fixed regional product codes:** HP's product pages identify exact shipped/cataloged configurations by code. All six HP candidate claims can be tied to an official page: US EliteBook `D6DG0UA#ABA` / Core Ultra 7 265H ([page][eb-265]), US EliteBook `D6DF8UA#ABA` / Core Ultra 7 255H ([page][eb-255]); Irish EliteDesk `99M73ET` / Core Ultra 7 265 ([page][ed-265]); Thai Z6 `AQ1Z4PA` / Threadripper PRO 7985WX ([page][z6-7985]); Indian Z6 `DZ5A1PA` / Threadripper PRO 9985WX ([page][z6-9985]); Indian Z6 `DC2V2PA` / Threadripper PRO 9995WX ([page][z6-9995]). The HP EliteBook US pages include a “Your Configuration” selector with other CPU choices, but each page's product number and Technical Specs section name the asserted CPU. Present the code and market with each HP result. Do not represent the code as general CPU upgradeability or global orderability.

**Size hold:** HP's Irish `99M73ET` page labels 33.7 x 30.8 x 15.5 cm as W x D x H, while [HP Support's G1i/G1i E physical specification][ed-support] lists system dimensions as 15.5 x 30.8 x 33.7 cm. The candidate omits platform-level `dimensions`, which is the correct publication choice until HP's dimension orientation is reconciled. CPU identity and tower form factor are independently confirmed on `99M73ET`.

**Publication handoff:** No sampled CPU/platform edge needs removal. Retain `evidenceType` and HP `oemOptionCode`/`market` in the visible detail. Hold only the EliteDesk size. Label Lenovo P8 as tower with optional 4U rack, and preserve dimensional qualifiers (ThinkPad WWAN, HP EliteBook US SKUs, Dell Precision protrusions).

[t14]: https://psref.lenovo.com/syspool/Sys/PDF/ThinkPad/ThinkPad_T14_Gen_6_AMD/ThinkPad_T14_Gen_6_AMD_Spec.PDF
[m75t]: https://psref.lenovo.com/syspool/Sys/PDF/ThinkCentre/ThinkCentre_M75t_Gen_5/ThinkCentre_M75t_Gen_5_Spec.PDF
[p8]: https://psref.lenovo.com/syspool/Sys/PDF/ThinkStation/ThinkStation_P8/ThinkStation_P8_Spec.pdf
[eb-265]: https://www.hp.com/us-en/shop/pdp/hp-elitebook-8-g1i-14-inch-notebook-ai-pc-wolf-pro-security-edition-d6dg0ua-aba
[eb-255]: https://www.hp.com/us-en/shop/pdp/hp-elitebook-8-g1i-14-inch-notebook-ai-pc-wolf-pro-security-edition-p-d6df8ua-aba-1
[ed-265]: https://www.hp.com/ie-en/products/desktops/product-details/product-specifications/2103084582
[ed-support]: https://support.hp.com/in-en/document/ish_12140220-12140312-16
[z6-7985]: https://www.hp.com/th-en/products/workstations/product-details/product-specifications/2102619394
[z6-9985]: https://www.hp.com/in-en/products/workstations/product-details/product-specifications/2104039734
[z6-9995]: https://www.hp.com/in-en/products/workstations/product-details/product-specifications/2104023921
[db-proc]: https://www.dell.com/support/manuals/en-us/dell-db06250-2-in-1-laptop/dell_16_plus_2n1_db06250_om/processor?guid=guid-b67a387f-2bea-450b-b3c0-dd25a6eb8d8e&lang=en-us
[db-size]: https://www.dell.com/support/manuals/en-us/dell-db06250-2-in-1-laptop/dell_16_plus_2n1_db06250_om/dimensions-and-weight?guid=guid-362133ff-c5e8-4acd-a164-4ce876572659&lang=en-us
[db-display]: https://www.dell.com/support/manuals/en-us/dell-db06250-2-in-1-laptop/dell_16_plus_2n1_db06250_om/display?guid=guid-73e1ca36-2dcd-41d4-b0bd-abbae75a1deb&lang=en-us
[db-modes]: https://www.dell.com/support/manuals/en-us/dell-db06250-2-in-1-laptop/dell_16_plus_2n1_db06250_om/modes?guid=guid-743c65d6-8689-48a9-91bb-c9cf428c6669&lang=en-us
[qcs-proc]: https://www.dell.com/support/manuals/en-us/dell-pro-qcs1250-slim-desktop/dell-pro-slim-qcs1250_om/processor?guid=guid-9624579f-1c61-4cc1-8d36-b274a69d55a2&lang=en-us
[qcs-size]: https://www.dell.com/support/manuals/en-us/dell-pro-qcs1250-slim-desktop/dell-pro-slim-qcs1250_om/dimensions-and-weight?guid=guid-362133ff-c5e8-4acd-a164-4ce876572659&lang=en-us
[p7875-proc]: https://www.dell.com/support/manuals/en-us/precision-t7875-workstation/precision_7875_tower_om/processor?guid=guid-fc16090c-53af-40bd-98c0-91a0c4539e77&lang=en-us
[p7875-size]: https://www.dell.com/support/manuals/en-us/precision-t7875-workstation/precision_7875_tower_om/dimensions-and-weight?guid=guid-476edaac-b30e-4ef6-b273-319a3db074b1&lang=en-us
