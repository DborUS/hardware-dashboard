# Client and workstation expansion candidates

Research snapshot: 2026-09-30. The companion [candidate JSON](client-expansion-candidates.json) is a review set only. It contains **9 named OEM systems**, **24 exact CPU-to-system links**, **16 catalog CPUs**, and **16 official source records**. Each of Lenovo, HP, and Dell contributes a laptop, desktop, and workstation. AMD and Intel are both represented.

## Evidence and promotion rules

- A `supported_processor_table` row means an exact CPU SKU appears in the named system's OEM processor table. It proves an OEM-documented option for that system family, without establishing an installed CPU for every machine type or current regional orderability. The eight Lenovo and ten Dell links use this standard.
- A `fixed_configuration` row means an HP product-code page names both the exact CPU and system. These six links carry the product code and country in `oemOptionCode` and `market`. The codes identify published configurations, not present inventory or universal upgrade support.
- The `catalogId` is the join key to `js/data/benchmark-catalog.json`. The 16 projections were checked against the catalog's exact IDs, model strings, vendors, and dashboard tabs on this snapshot date. Two CPUs (Ryzen AI 7 PRO 350 and Core Ultra 7 265) also have different platforms in the existing live seed; do not duplicate their product projection when merging.
- Chassis dimensions are transcribed from OEM mechanical/specification sections. The ThinkPad T14 Gen 6 maximum height differs slightly for WWAN versus non-WWAN. Lenovo notes that ThinkCentre dimensions can vary by configuration. HP EliteBook dimensions are tied to the two cited US product codes. **EliteDesk dimensions are held:** HP's Irish 99M73ET page prints W × D × H as 33.7 × 30.8 × 15.5 cm, while [HP Support's physical specifications](https://support.hp.com/in-en/document/ish_12140220-12140312-16) list 15.5 × 30.8 × 33.7 cm for the G1i/G1i E family. The CPU and tower form-factor claims are unaffected. Dell Precision dimensions exclude protruding feet and lock hardware. Keep these qualifiers visible if showing a dimension.
- Only the ThinkStation P8 carries `socketCount` and `memoryChannelsPerSocket` because its PSREF explicitly says one sTR5 socket and eight-channel-capable DIMM slots. Do not infer those fields for other workstation families or treat two client DIMM slots as two CPU sockets.
- An absent CPU/system link means **unresearched**, never unsupported. Recheck the linked source for a customer quote, firmware conditions, regional orderability, and configuration restrictions.
- Every candidate edge has `reviewStatus: source_row_verified` and a `restrictionNote`. This means its exact OEM CPU row was checked, not that every possible system configuration is cleared for publication or quoting.

## Review inventory

| OEM | Laptop | Desktop | Workstation | CPU links |
| --- | --- | --- | --- | ---: |
| Lenovo | ThinkPad T14 Gen 6 (AMD) | ThinkCentre M75t Gen 5 | ThinkStation P8 | 8 |
| HP | EliteBook 8 G1i 14 (US product codes) | EliteDesk 8 Tower G1i (Irish product code) | Z6 G5 A (Thai and Indian product codes) | 6 |
| Dell | Dell 16 Plus 2-in-1 DB06250 | Dell Pro Slim QCS1250 | Precision 7875 Tower | 10 |

The [Lenovo PSREF PDFs](https://psref.lenovo.com), [HP product specifications](https://www.hp.com), and [Dell owner's manuals](https://www.dell.com/support/manuals) are linked individually with exact locators and retrieval dates in the JSON `sources[]` ledger. The Lenovo P8 and Dell Precision 7875 processor tables include both Threadripper PRO 7000 and 9000 series parts; no socket-only inference was used.

## Held from this candidate

Generic OEM marketing phrases such as “up to Core Ultra 7,” a processor-family banner, a socket/chipset match, and mixed-model tables for HP EliteDesk 8 Tower G1i **and** G1i E did not create links. A search result, reseller configuration, and product selector choice alone also did not create a link. These can be revisited when an exact product-number page or an unambiguous model-specific processor table is available.

## Suggested pilot

A small public pilot could promote the ThinkPad T14 Gen 6 (AMD), Dell Pro Slim QCS1250, and HP Z6 G5 A records first. Together they show the option-versus-configuration distinction, one laptop, one desktop, one workstation, both CPU vendors, and the need for region labels. Keep the remaining candidate records in this review file until the display of evidence labels and dimensional qualifiers is checked.
