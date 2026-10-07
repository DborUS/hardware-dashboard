# Gigabyte AmpereOne SKU research

Checked 2026-09-30 for `R163-P32-AAH1`.

## Primary OEM pages

- [Gigabyte R163-P32-AAH1 product specifications](https://www.gigabyte.com/ie/Enterprise/Rack-Server/R163-P32-AAH1): the static product page identifies a 1U rack server with one AmpereOne socket, eight DDR5 memory channels per processor, 16 DIMM slots, and dimensions 438 x 43.5 x 710 mm.
- [Gigabyte R163-P32-AAH1 QVL Support List](https://www.gigabyte.com/ie/Enterprise/Rack-Server/R163-P32-AAH1/Support-QVL): the rendered Ireland QVL page has a CPU table under the `AmpereOne` section, last updated June 28, 2026. The exact listed models are A192-32X, A192-26X, A160-28X, A144-27X, A144-24X, A128-34X, and A96-36X. Each resolves exactly to an existing ChipIndex catalog model.

## Direct browser verification

On 2026-09-30, an interactive browser loaded the official `/ie/` page and its dynamically rendered CPU table. The visible table and accessibility tree both listed the seven exact models above, each as an `AmpereOne X` CPU row. The page itself showed `Last Update: Jun 28, 2026`; an earlier web-search snippet had said June 29, so the source locator was corrected to the page's displayed date. A text-only extractor still returns only the page shell. Future bulk extraction must render the QVL and verify its exact rows rather than treating a static fetch or family label as support. Retain the `/ie/` locale used for this check.

A [Gigabyte server manual](https://download.gigabyte.com/FileList/Manual/server_manual_e_E163-P30_v1.0.pdf?v=6e0db4973871e5372ad6559a4d078eba) has a BIOS screenshot identifying an A192-32X in an R163-P32-series system. It corroborates that one processor family pairing but is not the exact AAH1 QVL and is not used for the seven support claims. A third-party seller configurator also offers four of the seven SKUs for this server, but it is not used as primary evidence.

## Catalog identities

| ChipIndex model | Catalog ID |
| --- | --- |
| AmpereOne A192-32X | `ampere-ddf09a7adf702bfc4c68` |
| AmpereOne A192-26X | `ampere-9840699508ffbcc657e0` |
| AmpereOne A160-28X | `ampere-7d98b6fff1222bf00733` |
| AmpereOne A144-27X | `ampere-ead3f5a16b87d50f6803` |
| AmpereOne A144-24X | `ampere-e1e0dc8d96e011c5cda9` |
| AmpereOne A128-34X | `ampere-0c9f76a894454d335f9d` |
| AmpereOne A96-36X | `ampere-36433c5a0850d9a2d94c` |
