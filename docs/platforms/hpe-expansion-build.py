#!/usr/bin/env python3
"""Build the review-only HPE candidate snapshot from transcribed QuickSpecs rows."""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CSV = HERE / "hpe-expansion-candidates.csv"
OUTPUT = HERE / "hpe-expansion-candidates.json"
CATALOG = ROOT / "js/data/benchmark-catalog.json"
SITE = ROOT / "js/data/platform-compatibility.json"

VERSIONED_PDF_BASE = "https://www.hpe.com/psnow/downloadDoc/"
PDF_QUERY = (
    "?contentDisposition=attachment&deepLink=&form=false&hf=regular&"
    "id={document}.pdf&isFutureVersion=false&isLinearized=false&"
    "originalObjectName=&prelaunchSection=&preview=false&print=&r=&section=&"
    "softrollSection=&utm_campaign=&utm_content=&utm_medium=&utm_source=&"
    "utm_term=&ver={version}"
)


def pdf_url(title: str, document: str, version: int) -> str:
    filename = title.replace(" ", "%20") + "-" + document + ".pdf"
    return VERSIONED_PDF_BASE + filename + PDF_QUERY.format(document=document, version=version)


SOURCES = [
    {
        "id": "hpe-dl145-gen11",
        "publisher": "HPE",
        "title": "HPE ProLiant DL145 Gen11 QuickSpecs, Version 22 (8 September 2026)",
        "url": pdf_url("HPE ProLiant DL145 Gen11 QuickSpecs", "a50009217enw", 22),
        "locator": "PDF pp. 1, 8-10, 70, 87: 2U/1P, processor tables, Core Options processor kits, dimensions; configuration/cooling matrices pp. 21 and 32-51",
        "retrievedAt": "2026-09-30",
    },
    {
        "id": "hpe-dl325-gen11",
        "publisher": "HPE",
        "title": "HPE ProLiant DL325 Gen11 QuickSpecs, Version 40 (3 August 2026)",
        "url": pdf_url("HPE ProLiant DL325 Gen11 QuickSpecs", "a50004297enw", 40),
        "locator": "PDF pp. 1, 5, 8, 24-25, 53: 1U/1P, memory, Core Options processor kits, cooling notes, chassis dimensions",
        "retrievedAt": "2026-09-30",
    },
    {
        "id": "hpe-dl345-gen11",
        "publisher": "HPE",
        "title": "HPE ProLiant DL345 Gen11 QuickSpecs, Version 40 (3 August 2026)",
        "url": pdf_url("HPE ProLiant DL345 Gen11 QuickSpecs", "a50004298enw", 40),
        "locator": "PDF pp. 1, 5, 8, 28-29, 63: 2U/1P, memory, Core Options processor kits, cooling notes, chassis dimensions",
        "retrievedAt": "2026-09-30",
    },
    {
        "id": "hpe-dl365-gen11",
        "publisher": "HPE",
        "title": "HPE ProLiant DL365 Gen11 QuickSpecs, Version 45 (8 September 2026)",
        "url": "https://www.hpe.com/us/en/collaterals/collateral.a50004299enw.html",
        "locator": "Overview; Standard Features > Memory; Configuration Information > Processor Options; Technical Specifications > System Unit; Summary of Changes",
        "retrievedAt": "2026-09-30",
    },
    {
        "id": "hpe-dl320-gen12",
        "publisher": "HPE",
        "title": "HPE ProLiant Compute DL320 Gen12 QuickSpecs, Version 20 (8 September 2026)",
        "url": "https://www.hpe.com/fi/en/collaterals/collateral.a50004283enw.html",
        "locator": "Overview; Standard Features > Memory; Core Options > Processor; Technical Specifications > System Unit; Summary of Changes",
        "retrievedAt": "2026-09-30",
    },
    {
        "id": "hpe-dl380-gen12",
        "publisher": "HPE",
        "title": "HPE ProLiant Compute DL380 Gen12 QuickSpecs, Version 19 (8 September 2026)",
        "url": "https://www.hpe.com/nl/en/collaterals/collateral.a00073551enw.html",
        "locator": "Overview; Standard Features > Memory; Core Options > Processor; Technical Specifications > System Unit",
        "retrievedAt": "2026-09-30",
    },
]

PLATFORMS = [
    {
        "id": "hpe-proliant-dl145-gen11",
        "oem": "HPE",
        "model": "ProLiant DL145 Gen11",
        "category": "edge_server",
        "formFactor": "rack",
        "rackUnits": 2,
        "socketCount": 1,
        "memoryChannelsPerSocket": 6,
        "dimmSlots": 6,
        "dimensions": "8.75 × 35.94 × 40.66 cm (H × W × D; without bezel/filter)",
        "sourceIds": ["hpe-dl145-gen11"],
    },
    {
        "id": "hpe-proliant-dl325-gen11",
        "oem": "HPE",
        "model": "ProLiant DL325 Gen11",
        "category": "rack_server",
        "formFactor": "rack",
        "rackUnits": 1,
        "socketCount": 1,
        "memoryChannelsPerSocket": 12,
        "dimmSlots": 12,
        "dimensions": "4.29 × 43.46 × 64.94 cm (H × W × D; 8SFF chassis)",
        "sourceIds": ["hpe-dl325-gen11"],
    },
    {
        "id": "hpe-proliant-dl345-gen11",
        "oem": "HPE",
        "model": "ProLiant DL345 Gen11",
        "category": "rack_server",
        "formFactor": "rack",
        "rackUnits": 2,
        "socketCount": 1,
        "memoryChannelsPerSocket": 12,
        "dimmSlots": 12,
        "dimensions": "8.75 × 44.8 × 64.6 cm (H × W × D; 8SFF/24SFF/EDSFF chassis)",
        "sourceIds": ["hpe-dl345-gen11"],
    },
    {
        "id": "hpe-proliant-dl365-gen11",
        "oem": "HPE",
        "model": "ProLiant DL365 Gen11",
        "category": "rack_server",
        "formFactor": "rack",
        "rackUnits": 1,
        "socketCount": 2,
        "memoryChannelsPerSocket": 12,
        "dimmSlots": 24,
        "dimensions": "4.29 × 43.46 × 64.94 cm (H × W × D; SFF chassis)",
        "sourceIds": ["hpe-dl365-gen11"],
    },
    {
        "id": "hpe-proliant-compute-dl320-gen12",
        "oem": "HPE",
        "model": "ProLiant Compute DL320 Gen12",
        "category": "rack_server",
        "formFactor": "rack",
        "rackUnits": 1,
        "socketCount": 1,
        "memoryChannelsPerSocket": 8,
        "dimmSlots": 16,
        "dimensions": "4.28 × 43.46 × 60.75 cm (H × W × D; SFF chassis)",
        "sourceIds": ["hpe-dl320-gen12"],
    },
    {
        "id": "hpe-proliant-compute-dl380-gen12",
        "oem": "HPE",
        "model": "ProLiant Compute DL380 Gen12",
        "category": "rack_server",
        "formFactor": "rack",
        "rackUnits": 2,
        "socketCount": 2,
        "memoryChannelsPerSocket": 8,
        "dimmSlots": 32,
        "dimensions": "8.75 × 44.8 × 72.70 cm (H × W × D; SFF/EDSFF chassis)",
        "sourceIds": ["hpe-dl380-gen12"],
    },
]

PLATFORM_DETAILS = {
    "hpe-proliant-dl145-gen11": {
        "mounting": ["2U rack", "wall", "desk"],
        "chassisVariants": [
            {"name": "without bezel/filter", "heightCm": 8.75, "widthCm": 35.94, "depthCm": 40.66},
            {"name": "with bezel/filter", "heightCm": 8.75, "widthCm": 38.44, "depthCm": 50.74},
        ],
        "configurationNotes": [
            "EPYC 8004 processor kits require DDR5-4800 memory; EPYC 8005 kits require DDR5-6400 memory.",
            "Cooling, ambient temperature and optimized acoustics vary by CPU and heatsink; an acoustics-table 'No support' does not mean the CPU is unsupported in the system.",
        ],
    },
    "hpe-proliant-dl325-gen11": {
        "chassisVariants": [
            {"name": "8SFF", "heightCm": 4.29, "widthCm": 43.46, "depthCm": 64.94},
            {"name": "4LFF or EDSFF", "heightCm": 4.29, "widthCm": 43.46, "depthCm": 70.89},
            {"name": "GPU CTO", "heightCm": 4.29, "widthCm": 43.46, "depthCm": 81.84},
        ],
        "configurationNotes": [
            "HPE requires a standard heatsink at <=240W, performance heatsink above 240W through 300W, and closed-loop liquid cooling at >=320W.",
            "EPYC 9254 and 9384X have a 25°C supported ambient limit; EPYC 9384X is excluded from the EDSFF CTO chassis.",
        ],
    },
    "hpe-proliant-dl345-gen11": {
        "chassisVariants": [
            {"name": "8SFF, 24SFF or EDSFF", "heightCm": 8.75, "widthCm": 44.8, "depthCm": 64.6},
            {"name": "8LFF", "heightCm": 8.75, "widthCm": 44.8, "depthCm": 66.3},
            {"name": "GPU CTO", "heightCm": 8.75, "widthCm": 44.8, "depthCm": 79.87},
        ],
        "configurationNotes": [
            "HPE requires standard heatsink/fans at <=240W and a performance heatsink at >=260W.",
            "For <=300W CPUs with 4LFF or 8SFF mid-tray drives, HPE requires the 1U performance heatsink and performance fans.",
        ],
    },
    "hpe-proliant-dl365-gen11": {
        "chassisVariants": [
            {"name": "SFF", "heightCm": 4.29, "widthCm": 43.46, "depthCm": 64.94},
            {"name": "EDSFF", "heightCm": 4.29, "widthCm": 43.46, "depthCm": 70.89},
            {"name": "GPU CTO", "heightCm": 4.29, "widthCm": 43.46, "depthCm": 81.84},
        ],
        "configurationNotes": [
            "The platform has up to 2 processors and 12 memory channels per installed processor; 24 DIMM slots require 2 CPUs.",
            "EDSFF chassis require 2 CPUs plus performance heatsink or direct liquid cooling and performance fans.",
            "The processor option list confirms model eligibility but does not by itself prove both 1P and 2P configurations for every listed SKU.",
        ],
    },
    "hpe-proliant-compute-dl320-gen12": {
        "chassisVariants": [
            {"name": "SFF", "heightCm": 4.28, "widthCm": 43.46, "depthCm": 60.75},
            {"name": "SFF/EDSFF or 4LFF", "heightCm": 4.28, "widthCm": 43.46, "depthCm": 66.70},
            {"name": "12LFF", "heightCm": 4.28, "widthCm": 43.46, "depthCm": 99.74},
            {"name": "GPU CTO", "heightCm": 4.28, "widthCm": 43.46, "depthCm": 82.18},
        ],
        "configurationNotes": [
            "CPU TDP above 185W requires high-performance heatsink and seven fan kits; above 270W requires closed-loop liquid cooling and matching fans.",
            "12LFF chassis requires a rack at least 1200 mm deep.",
        ],
    },
    "hpe-proliant-compute-dl380-gen12": {
        "chassisVariants": [
            {"name": "SFF or EDSFF", "heightCm": 8.75, "widthCm": 44.8, "depthCm": 72.70},
            {"name": "LFF", "heightCm": 8.75, "widthCm": 44.8, "depthCm": 73.25},
        ],
        "configurationNotes": [
            "In a 2P build, the two CPU models must match.",
            "The 4LFF midplane cage is limited to processors <=225W.",
            "The processor option list confirms model eligibility but does not prove both 1P and 2P configurations for each SKU; Xeon 6731E is listed with UPI 0.",
        ],
    },
}

OPTION_LOCATORS = {
    "hpe-proliant-dl145-gen11": "PDF p. 70, Core Options > Processor",
    "hpe-proliant-dl325-gen11": "PDF pp. 24-25, Core Options > Processor",
    "hpe-proliant-dl345-gen11": "PDF pp. 28-29, Core Options > Processor",
    "hpe-proliant-dl365-gen11": "Core Options > Processor Option Kits",
    "hpe-proliant-compute-dl320-gen12": "Core Options > Processor",
    "hpe-proliant-compute-dl380-gen12": "Core Options > Processor",
}

EXPECTED_SOURCE_ROWS = {
    "hpe-proliant-dl145-gen11": 19,
    "hpe-proliant-dl325-gen11": 39,
    "hpe-proliant-dl345-gen11": 39,
    "hpe-proliant-dl365-gen11": 39,
    "hpe-proliant-compute-dl320-gen12": 32,
    "hpe-proliant-compute-dl380-gen12": 34,
}


def restriction_note(platform_id: str, model: str) -> str:
    if platform_id == "hpe-proliant-dl145-gen11":
        memory = "DDR5-6400" if model.endswith("5P") else "DDR5-4800"
        if model == "EPYC 8535P":
            return ("Requires DDR5-6400 memory options. HPE does not support this CPU with "
                    "Optimized Acoustics FIO configuration P73006-B21; supported ambient "
                    "temperature depends on the selected heatsink and high-temperature configuration.")
        return (f"Requires {memory} memory options. Cooling, ambient and optimized-acoustics "
                "support depend on the selected CPU and heatsink.")
    if platform_id == "hpe-proliant-dl325-gen11":
        base = ("Heatsink selection depends on TDP: standard at <=240W, performance above "
                "240W through 300W, closed-loop liquid cooling at >=320W.")
        if model == "EPYC 9254":
            return base + " This CPU is limited to 25°C supported ambient."
        if model == "EPYC 9384X":
            return base + " This CPU is limited to 25°C supported ambient and excludes EDSFF CTO."
        if model == "EPYC 9175F":
            return ("320W CPU requires closed-loop liquid-cooling heatsink P58463-B21 and "
                    "liquid-cooling fans P59668-B21. HPE's >300W cooling matrix lists "
                    "supported drive/backplane layouts and temperature/memory-option limits by chassis.")
        return base
    if platform_id == "hpe-proliant-dl345-gen11":
        if model == "EPYC 9384X":
            return ("320W CPU requires performance heatsink P58459-B21 and performance "
                    "fans P58465-B21. The 4LFF mid-tray cage requires a CPU <=300W; "
                    "HPE's cooling matrix lists 4LFF/8SFF mid-tray layouts only through 300W.")
        return ("Heatsink/fans depend on TDP and drive layout; <=240W uses standard cooling, "
                ">=260W requires performance heatsink, and some mid-tray layouts need 1U "
                "performance heatsink/fans.")
    if platform_id == "hpe-proliant-dl365-gen11":
        return ("A 2P build requires two of the same processor model. EDSFF CTO requires "
                "2 CPUs; >240W requires performance cooling; >=320W limits drive count.")
    if platform_id == "hpe-proliant-compute-dl320-gen12":
        return ("Processors >185W require high-performance heatsink and seven matching fans; "
                ">270W requires closed-loop liquid cooling and seven matching fans.")
    if platform_id == "hpe-proliant-compute-dl380-gen12":
        base = ("A 2P build requires matching processor models; the 4LFF midplane cage "
                "supports CPUs <=225W only.")
        if model == "Xeon 6731E":
            return base + " HPE lists UPI 0; do not assert 2P support without a per-SKU check."
        return base
    raise ValueError(f"unreviewed platform {platform_id}")


def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    site = json.loads(SITE.read_text(encoding="utf-8"))
    catalog_by_id = {row["id"]: row for row in catalog["products"]}
    existing_pairs = {(row["catalogId"], row["platformId"]) for row in site["compatibility"]}
    existing_platforms = {row["id"] for row in site["platforms"]}
    existing_sources = {row["id"] for row in site["sources"]}
    platforms_by_id = {row["id"]: row for row in PLATFORMS}
    if set(platforms_by_id) != set(EXPECTED_SOURCE_ROWS):
        raise ValueError("platform inventory differs from expected source rows")

    with CSV.open(encoding="utf-8-sig", newline="") as handle:
        source_rows = list(csv.DictReader(handle))
    counts = Counter(row["platform_id"] for row in source_rows)
    if dict(counts) != EXPECTED_SOURCE_ROWS:
        raise ValueError(f"source row count mismatch: {counts}")
    if len({(r["platform_id"], r["model"]) for r in source_rows}) != len(source_rows):
        raise ValueError("duplicate platform/model source row")

    compatibility = []
    unmatched_catalog_rows = []
    already_in_site = []
    product_ids = set()
    per_platform_added = Counter()
    for row in source_rows:
        platform_id = row["platform_id"]
        source_id = platforms_by_id[platform_id]["sourceIds"][0]
        source_evidence = {
            "normalizedProcessorModel": row["model"],
            "oemOptionCodeAsPrinted": row["oem_option_code"],
            "optionTableLocator": OPTION_LOCATORS[platform_id],
        }
        catalog_id = row["catalog_id"]
        if not catalog_id:
            unmatched_catalog_rows.append({
                "platformId": platform_id,
                "model": row["model"],
                "oemOptionCode": row["oem_option_code"],
                "sourceIds": [source_id],
                "evidence": source_evidence,
                "reason": "Exact HPE option exists, but this CPU is absent from the ChipIndex catalog snapshot.",
            })
            continue
        product = catalog_by_id.get(catalog_id)
        if product is None or product["model"] != row["model"]:
            raise ValueError(f"catalog mismatch: {row}")
        if product["vendor"] not in {"AMD", "INTEL"}:
            raise ValueError(f"unexpected vendor: {row}")
        if (catalog_id, platform_id) in existing_pairs:
            already_in_site.append({
                "catalogId": catalog_id,
                "platformId": platform_id,
                "model": row["model"],
                "oemOptionCode": row["oem_option_code"],
            })
            continue
        edge = {
            "catalogId": catalog_id,
            "platformId": platform_id,
            "supportLevel": "confirmed",
            "evidenceType": "supported_processor_table",
            "oemOptionCode": row["oem_option_code"],
            "sourceIds": [source_id],
            "reviewStatus": "source_row_verified",
            "evidence": source_evidence,
            "restrictionNote": restriction_note(platform_id, row["model"]),
        }
        if platforms_by_id[platform_id]["socketCount"] == 1:
            edge["supportedCpuQuantities"] = [1]
        compatibility.append(edge)
        product_ids.add(catalog_id)
        per_platform_added[platform_id] += 1

    products = []
    for catalog_id in sorted(product_ids):
        catalog_product = catalog_by_id[catalog_id]
        dashboard_tab = "amd/epyc" if catalog_product["vendor"] == "AMD" else "intel/xeon"
        if dashboard_tab not in catalog_product["dashboardTabs"]:
            raise ValueError(f"unexpected tab for {catalog_id}")
        product = {
            "catalogId": catalog_id,
            "vendor": catalog_product["vendor"],
            "dashboardTab": dashboard_tab,
            "model": catalog_product["model"],
        }
        if catalog_product.get("productId"):
            product["productId"] = catalog_product["productId"]
        products.append(product)

    reviewed_systems = []
    for platform_id, source_count in EXPECTED_SOURCE_ROWS.items():
        reviewed_systems.append({
            "platformId": platform_id,
            "sourceId": platforms_by_id[platform_id]["sourceIds"][0],
            "reviewStatus": "source_row_verified",
            "oemProcessorOptionRows": source_count,
            "newCatalogEdges": per_platform_added[platform_id],
            "alreadyInSite": platform_id in existing_platforms,
            "sourceAlreadyInSite": platforms_by_id[platform_id]["sourceIds"][0] in existing_sources,
        })

    output = {
        "schemaVersion": 1,
        "snapshotDate": "2026-09-30",
        "researchStatus": "candidate_for_second_review",
        "products": products,
        "platforms": PLATFORMS,
        "compatibility": compatibility,
        "sources": SOURCES,
        "platformDetails": PLATFORM_DETAILS,
        "reviewedSystems": reviewed_systems,
        "unmatchedCatalogRows": unmatched_catalog_rows,
        "alreadyInSiteEdges": already_in_site,
        "uncertainSupportRows": [],
    }
    if len(source_rows) != 202 or len(compatibility) != 200 or len(unmatched_catalog_rows) != 1 or len(already_in_site) != 1:
        raise ValueError("expected 202 source rows, 200 new edges, one catalog gap and one existing edge")
    OUTPUT.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}: {len(products)} products, {len(PLATFORMS)} reviewed systems, "
          f"{len(compatibility)} new edges, {len(SOURCES)} sources")


if __name__ == "__main__":
    main()
