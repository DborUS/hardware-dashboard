# Ampere data provenance

The Ampere tab uses only Ampere Computing product records. The master CSV is the
SKU-level source of truth; `tools/build-ampere-data.py` writes the runtime JSON.
The 26 rows reproduce the currently published model tables in these official
sources (checked 2026-09-26):

| Family | SKU rows | Specification source | Year used for timeline |
| --- | ---: | --- | --- |
| AmpereOne M | 6 | [AmpereOne M Product Brief](https://amperecomputing.com/briefs/ampereone-m-product-brief) | 2024: [Ampere says the 12-channel CPU is shipping](https://amperecomputing.com/blogs/12-channel-memory) |
| AmpereOne | 7 | [AmpereOne Product Brief](https://amperecomputing.com/briefs/ampereone-family-product-brief) | 2023: [family announcement](https://amperecomputing.com/press/ampere-unveils-processor-ampereone-192-cores) |
| Altra Max | 5 | [Altra family product brief](https://amperecomputing.com/briefs/ampere-altra-family-product-brief) | 2021: [Ampere says Altra Max joined the line-up](https://amperecomputing.com/en/blogs/a-banner-year-of-innovation-and-execution) |
| Altra | 7 | [Altra family product brief](https://amperecomputing.com/briefs/ampere-altra-family-product-brief) | 2020: [Altra launch](https://amperecomputing.com/press/ampere-altra-industrys-first-80-core-server-processor-unveiled) |
| eMAG 8180 | 1 | [eMAG 8180 product brief](https://amperecomputing.com/customer-connect/products/emag-device-documentation) | 2018: [eMAG 8180 evaluation kit brief](https://amperecomputing.com/customer-connect/products/emag-8180-evaluation-kit-%28evk%29) |

The timeline year is a family milestone, **not** a claimed release date for
every individual SKU. The master records the frequency exactly according to
each source's qualifier: Altra uses sustained frequency, AmpereOne and
AmpereOne M use published frequency, and eMAG's 3.3 GHz is an up-to Turbo
frequency. Numeric `frequency` values are GHz; `usage_power` and `tdp` are W.
`pcie_lanes`, `mem_channels`, `cores`, and `threads` are counts.

`usage_power` and `tdp` are different measurements. AmpereOne and AmpereOne M
define usage power as average power during SPECrate 2017 int_base. The Altra
product table also labels its watt figures Usage Power; the [Altra datasheet](https://amperecomputing.com/assets/Altra_Rev_A1_DS_v1_30_20220728_8170025756.pdf)
explains this is average power over a workload. Only the eMAG brief gives a
SKU-specific TDP (125 W). The family TDP ranges on Ampere's overview are not
assigned to individual SKUs.

Two separate entries in `ampere-roadmap.json` describe announced future
products, never SKU rows: [AmpereOne MX](https://amperecomputing.com/assets/AmpereOne_Efficiency_White_Paper_3bc51280f9.pdf)
and [AmpereOne Aurora](https://www.amperecomputing.com/blogs/introducing-ampereone-aurora).
Their announced maximum core counts are not treated as shipping model specs.
