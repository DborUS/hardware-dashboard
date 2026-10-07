#!/usr/bin/env python3
"""Build the reviewed CPU eligibility and OEM-platform coverage snapshot.

The inclusion rules are explicit generation groups, not a socket-fit inference.
An eligible CPU with no approved edge is "not yet verified", never unsupported.
Run: python tools/build-platform-coverage.py [--check]
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "js/data/benchmark-catalog.json"
PLATFORMS = ROOT / "js/data/platform-compatibility.json"
OUTPUT_JSON = ROOT / "docs/platforms/ELIGIBILITY.json"
OUTPUT_MD = ROOT / "docs/platforms/COVERAGE.md"

# These source labels are the reviewed program boundary. The newer 9006 and
# Clearwater Forest lines have official product pages; an OEM edge still needs
# its own exact system support document. No embedded or workstation line is
# silently folded into the mainstream server denominator.
LANES = (
    {
        "id": "amd_epyc_server",
        "label": "AMD EPYC server",
        "tab": "amd/epyc",
        "field": "sourceSeries",
        "families": (
            "EPYC 4004 Series", "EPYC 4005 Series",
            "EPYC 8004 Series", "EPYC 8005 Series",
            "EPYC 9004 Series", "EPYC 9005 Series", "EPYC 9006 Series",
        ),
    },
    {
        "id": "intel_xeon_server",
        "label": "Intel Xeon server",
        "tab": "intel/xeon",
        "field": "sourceGroup",
        "families": (
            "Sapphire Rapids SP", "Emerald Rapids SP",
            "Sierra Forest SP", "Granite Rapids SP", "Granite Rapids AP",
            "Clearwater Forest",
        ),
    },
    {
        "id": "ampereone_server",
        "label": "AmpereOne server",
        "tab": "ampere/processors",
        "field": "sourceSeries",
        "families": ("AmpereOne", "AmpereOne M"),
    },
    {
        "id": "nvidia_cpu_modules",
        "label": "NVIDIA CPU modules",
        "tab": "nvidia/cpu",
        "field": "sourceSeries",
        "families": ("Grace CPU", "Grace Hopper", "Grace Blackwell"),
    },
)

DEFERRED = (
    ("AMD embedded and adjacent EPYC", "amd/epyc", "sourceSeries", (
        "EPYC Embedded 4005 Series", "EPYC Embedded 8004 Series",
        "EPYC Embedded 9004 Series", "EPYC Embedded 9005 Series",
    )),
    ("Intel Xeon D edge systems", "intel/xeon", "sourceGroup", (
        "Granite Rapids D",
    )),
    ("Intel Xeon W workstation", "intel/xeon", "sourceGroup", (
        "Sapphire Rapids WS-2400/2500", "Sapphire Rapids WS-3400/3500",
        "Granite Rapids WS",
    )),
    ("AMD client and workstation catalog", "amd/ryzen", "all", ()),
    ("Intel client catalog", "intel/client", "all", ()),
)


def load(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def source_group(product: dict, tab: str) -> str | None:
    placements = [place for place in product.get("placements", [])
                  if place.get("dashboardTab") == tab]
    if len(placements) != 1:
        raise ValueError(f"{product.get('id')}: expected one {tab} placement, got {len(placements)}")
    return placements[0].get("sourceGroup")


def family_value(product: dict, tab: str, field: str) -> str | None:
    return source_group(product, tab) if field == "sourceGroup" else product.get(field)


def build(catalog: dict, snapshot: dict) -> dict:
    products = catalog["products"]
    catalog_by_id = {product["id"]: product for product in products}
    if len(catalog_by_id) != len(products):
        raise ValueError("catalog IDs are not unique")
    platform_by_id = {platform["id"]: platform for platform in snapshot["platforms"]}
    platform_ids = set(platform_by_id)
    mapped: dict[str, set[str]] = defaultdict(set)
    for edge in snapshot["compatibility"]:
        if edge["supportLevel"] != "confirmed":
            continue
        if edge["catalogId"] not in catalog_by_id or edge["platformId"] not in platform_ids:
            raise ValueError(f"unresolved exact edge: {edge}")
        mapped[edge["catalogId"]].add(edge["platformId"])

    lanes = []
    eligible_ids = set()
    for rule in LANES:
        tab = rule["tab"]
        families = set(rule["families"])
        rows = []
        for product in products:
            if tab not in product.get("dashboardTabs", []):
                continue
            family = family_value(product, tab, rule["field"])
            if family not in families:
                continue
            ident = product["id"]
            if ident in eligible_ids:
                raise ValueError(f"eligible product appears in two lanes: {ident}")
            eligible_ids.add(ident)
            platforms = sorted(mapped.get(ident, set()))
            rows.append({
                "catalogId": ident,
                "model": product["model"],
                "productId": product.get("productId"),
                "sourceFamily": family,
                "platformCount": len(platforms),
                "state": "mapped_exact" if platforms else "not_yet_verified",
            })
        rows.sort(key=lambda row: (row["sourceFamily"], row["model"], row["catalogId"]))
        if not rows:
            raise ValueError(f"eligible lane is empty: {rule['id']}")
        linked_ids = {platform_id for row in rows
                      for platform_id in mapped.get(row["catalogId"], set())}
        lanes.append({
            "id": rule["id"],
            "label": rule["label"],
            "dashboardTab": tab,
            "sourceField": rule["field"],
            "includedFamilies": list(rule["families"]),
            "eligibleCount": len(rows),
            "mappedCount": sum(row["state"] == "mapped_exact" for row in rows),
            "exactLinkCount": sum(row["platformCount"] for row in rows),
            "platformModelCount": len(linked_ids),
            "oems": sorted({platform_by_id[ident]["oem"] for ident in linked_ids}),
            "products": rows,
        })

    deferred = []
    for label, tab, field, families in DEFERRED:
        rows = [product for product in products
                if tab in product.get("dashboardTabs", [])
                and product["id"] not in eligible_ids
                and (field == "all" or family_value(product, tab, field) in set(families))]
        deferred.append({
            "label": label,
            "dashboardTab": tab,
            "sourceFamilies": list(families),
            "catalogCount": len(rows),
            "mappedPilotCount": sum(bool(mapped.get(product["id"])) for product in rows),
            "state": "eligibility_review_pending",
        })

    outside_eligible = set(mapped) - eligible_ids
    # The current pilot has two client matches. They stay visible, but cannot
    # inflate a server coverage ratio or create a client denominator by fiat.
    for ident in outside_eligible:
        if not any(ident in {product["id"] for product in products
                             if queue["dashboardTab"] in product.get("dashboardTabs", [])}
                   for queue in deferred):
            raise ValueError(f"mapped product has no eligible or deferred lane: {ident}")

    return {
        "schemaVersion": 1,
        "snapshotDate": snapshot["snapshotDate"],
        "catalogSource": "js/data/benchmark-catalog.json",
        "platformSource": "js/data/platform-compatibility.json",
        "meaning": "An eligible CPU with zero exact OEM edges is not yet verified, never unsupported.",
        "eligibleCount": sum(lane["eligibleCount"] for lane in lanes),
        "mappedEligibleCount": sum(lane["mappedCount"] for lane in lanes),
        "exactEligibleLinkCount": sum(lane["exactLinkCount"] for lane in lanes),
        "totalExactLinkCount": sum(len(platforms) for platforms in mapped.values()),
        "platformModelCount": len(platform_by_id),
        "oems": sorted({platform["oem"] for platform in platform_by_id.values()}),
        "lanes": lanes,
        "deferredQueues": deferred,
    }


def report(data: dict) -> str:
    lines = [
        "# CPU-to-OEM platform coverage",
        "",
        f"Snapshot: {data['snapshotDate']}. Generated by `tools/build-platform-coverage.py`",
        "from the exact ChipIndex product identities and the current approved platform edges.",
        "The full per-CPU inventory is in [`ELIGIBILITY.json`](ELIGIBILITY.json).",
        "",
        "**No exact platform entry means not yet verified, never unsupported.**",
        "An exact edge requires an OEM source naming the CPU in the named system.",
        "A family, socket, power, or memory match does not create an edge.",
        "",
        "## Reviewed CPU denominator",
        "",
        "| Lane | Eligible CPU identities | With an exact OEM platform | Mapping rate | Awaiting verification |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for lane in data["lanes"]:
        rate = lane["mappedCount"] / lane["eligibleCount"]
        lines.append(f"| {lane['label']} | {lane['eligibleCount']} | "
                     f"{lane['mappedCount']} | {rate:.1%} | "
                     f"{lane['eligibleCount'] - lane['mappedCount']} |")
    lines.extend([
        # The total is a progress measure against this reviewed catalog set.
        f"| **Total** | **{data['eligibleCount']}** | **{data['mappedEligibleCount']}** | "
        f"**{data['mappedEligibleCount'] / data['eligibleCount']:.1%}** | "
        f"**{data['eligibleCount'] - data['mappedEligibleCount']}** |",
        "",
        "This is a catalog coverage measure, not an assertion about OEM support,",
        "commercial availability, or the number of systems in the market.",
        f"The {data['mappedEligibleCount']} mapped CPUs have "
        f"{data['exactEligibleLinkCount']} exact CPU-to-system links in this snapshot.",
        f"Across all lanes, the snapshot has {data['totalExactLinkCount']} exact links to "
        f"{data['platformModelCount']} named platforms from {len(data['oems'])} OEMs.",
        "AMD EPYC 9006 and Intel Xeon 6+ are in the eligible inventory because",
        "their makers publish exact products. Each model still needs its own",
        "exact OEM system listing before a platform edge is shown.",
        "[AMD EPYC 9006 portfolio](https://www.amd.com/en/products/processors/server/epyc/9006-series.html)",
        "and [Intel Xeon 6+ product listing](https://www.intel.com/content/www/us/en/products/sku/246074/intel-xeon-6990e-processor-576m-cache-2-20-ghz/specifications.html)",
        "anchor that inclusion decision.",
        "",
        "## Generation boundary",
        "",
    ])
    for lane in data["lanes"]:
        lines.append(f"- **{lane['label']}:** " + ", ".join(lane["includedFamilies"]) + ".")
    lines.extend([
        "- Older EPYC 7003/earlier, pre-4th-Gen Xeon Scalable, Altra, and eMAG are outside this pass.",
        "- Each catalog ID is counted once; duplicate display placements do not add CPUs.",
        "",
        "## Queues without a reviewed denominator",
        "",
        "| Queue | Catalog identities to review | With an exact entry |",
        "| --- | ---: | ---: |",
    ])
    for queue in data["deferredQueues"]:
        lines.append(f"| {queue['label']} | {queue['catalogCount']} | "
                     f"{queue['mappedPilotCount']} |")
    lines.extend([
        "",
        "Embedded, edge, workstation, and client eligibility depends on an OEM",
        "system inventory and current documentation review. These queue counts",
        "are **not coverage denominators**. An exact entry in these queues",
        "does not imply broad client or workstation coverage.",
        "",
        "## Continuing OEM review",
        "",
        "Continue system-by-system processor-option reviews, retain option and",
        "configuration limits, and second-review each publication batch. A missing",
        "edge remains unverified. The seven Gigabyte AmpereOne X rows were directly",
        "verified in the rendered QVL on 2026-09-30; repeat that rendered-table",
        "check for future Gigabyte systems.",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if generated files differ")
    args = parser.parse_args()
    data = build(load(CATALOG), load(PLATFORMS))
    outputs = {
        OUTPUT_JSON: json.dumps(data, indent=4, ensure_ascii=True) + "\n",
        OUTPUT_MD: report(data),
    }
    for path, content in outputs.items():
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                raise SystemExit(f"out of date: {path}")
        else:
            path.write_text(content, encoding="utf-8", newline="")
            assert path.read_text(encoding="utf-8") == content
    print(f"Platform coverage: {data['mappedEligibleCount']}/{data['eligibleCount']} "
          "eligible CPUs have an exact OEM edge; "
          f"{len(data['deferredQueues'])} deferred queues."
          + (" Checked." if args.check else " Written."))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
