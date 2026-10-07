#!/usr/bin/env python3
"""Build the reviewed platform snapshot from a fixed seed and approved OEM candidates.

Candidate files are research artifacts, not automatic publication inputs. The
approval manifest pins their hashes and selection rules so a later research edit
cannot silently change the site. Run --check to detect snapshot drift.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import OrderedDict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLATFORMS = ROOT / "docs" / "platforms"
SEED = PLATFORMS / "pilot-seed.json"
APPROVALS = PLATFORMS / "PUBLICATION-MANIFEST.json"
CATALOG = ROOT / "js" / "data" / "benchmark-catalog.json"
OUTPUT = ROOT / "js" / "data" / "platform-compatibility.json"

PLATFORM_FIELDS = (
    "id", "oem", "model", "category", "formFactor", "rackUnits",
    "socketCount", "memoryChannelsPerSocket", "dimmSlots", "dimensions",
    "volumeLiters", "displaySizeInches", "platformNote", "sourceIds",
)
EDGE_FIELDS = (
    "catalogId", "platformId", "supportLevel", "evidenceType",
    "supportedCpuQuantities", "oemOptionCode", "market", "restrictionNote", "sourceIds",
)
SOURCE_FIELDS = (
    "id", "publisher", "title", "url", "locator", "retrievedAt",
    "documentUpdated", "revision",
)


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def project(record: dict, fields: tuple[str, ...]) -> dict:
    return {key: record[key] for key in fields if key in record and record[key] is not None}


def merge_platform(current: dict, incoming: dict) -> dict:
    merged = dict(current)
    for key, value in incoming.items():
        if key == "sourceIds":
            merged[key] = list(dict.fromkeys([*merged.get(key, []), *value]))
        elif key in merged and merged[key] != value:
            raise ValueError(f"Conflicting {current['id']} platform {key}: {merged[key]!r} vs {value!r}")
        else:
            merged[key] = value
    return merged


def load_approved_candidates(manifest: dict) -> list[tuple[str, dict, list[dict]]]:
    result = []
    for name, rule in manifest["reviews"].items():
        review_file = PLATFORMS / rule["reviewFile"]
        if not review_file.is_file():
            raise ValueError(f"{name}: missing second-review record {review_file}")
        path = PLATFORMS / rule["candidateFile"]
        raw = path.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if digest != rule["sha256"]:
            raise ValueError(f"{name} candidate changed after approval: {path}")
        candidate = json.loads(raw)
        edges = candidate["compatibility"]
        if rule.get("usePublishRecommendation"):
            recommended = {
                (edge["catalogId"], edge["platformId"])
                for edge in candidate["publishRecommendation"]["edges"]
            }
            edges = [edge for edge in edges if
                     (edge["catalogId"], edge["platformId"]) in recommended]
            if len(edges) != len(recommended):
                raise ValueError(f"{name}: publication recommendation has missing or duplicate edges")
        else:
            statuses = set(rule["approvedStatuses"])
            edges = [edge for edge in edges if edge.get("reviewStatus") in statuses]
        excluded = {tuple(pair) for pair in rule.get("excludedEdges", [])}
        edges = [edge for edge in edges if
                 (edge["catalogId"], edge["platformId"]) not in excluded]
        if len(edges) != rule["approvedEdgeCount"]:
            raise ValueError(f"{name}: approved edge count changed: {len(edges)}")
        result.append((name, candidate, edges))
    return result


def build() -> dict:
    manifest = read_json(APPROVALS)
    seed = read_json(SEED)
    catalog = {product["id"]: product for product in read_json(CATALOG)["products"]}
    platforms = OrderedDict((platform["id"], platform) for platform in seed["platforms"])
    sources = OrderedDict((source["id"], source) for source in seed["sources"])
    edges = OrderedDict(((edge["catalogId"], edge["platformId"]), edge)
                        for edge in seed["compatibility"])

    for name, candidate, approved in load_approved_candidates(manifest):
        candidate_platforms = {platform["id"]: platform for platform in candidate["platforms"]}
        candidate_sources = {source["id"]: source for source in candidate["sources"]}
        candidate_products = {product["catalogId"]: product
                              for product in candidate.get("products", [])}
        for raw_edge in approved:
            edge = project(raw_edge, EDGE_FIELDS)
            edge["supportLevel"] = "confirmed"
            if name == "dell" and raw_edge.get("sourceWordingKind") == "thermal_restriction_table":
                edge["evidenceType"] = "thermal_qualification_table"
            identity = catalog.get(edge["catalogId"])
            if identity is None:
                raise ValueError(f"{name}: unknown catalog ID {edge['catalogId']}")
            if edge["platformId"] not in candidate_platforms:
                raise ValueError(f"{name}: unknown platform {edge['platformId']}")
            if name == "lenovo":
                evidence = raw_edge["evidence"]
                if not identity["model"].endswith(evidence["sku"]):
                    raise ValueError(f"{name}: source SKU mismatch for {identity['model']}")
                part_number = evidence.get("partNumber")
                expected_option = (part_number if isinstance(part_number, str) and
                                   part_number.startswith("4X") else evidence["featureCode"])
                if edge.get("oemOptionCode") != expected_option:
                    raise ValueError(f"{name}: option code mismatch for {identity['model']}")
                printed = evidence.get("quantityAsPrinted")
                expected = {"1": [1], "1*": [1], "2": [2], "1 or 2": [1, 2]}.get(printed)
                if expected is None:
                    raise ValueError(f"{name}: unfamiliar quantity notation {printed!r}")
                if raw_edge.get("reviewStatus") == "source_row_verified_quantity_pending":
                    if printed != "2" or "supportedCpuQuantities" in edge:
                        raise ValueError(f"{name}: unresolved quantity exposed for {identity['model']}")
                elif edge.get("supportedCpuQuantities") != expected:
                    raise ValueError(f"{name}: quantity mismatch for {identity['model']}")
            if name == "hpe":
                evidence = raw_edge["evidence"]
                if identity["model"] != evidence["normalizedProcessorModel"]:
                    raise ValueError(f"{name}: source model mismatch for {identity['model']}")
                if edge.get("oemOptionCode") != evidence["oemOptionCodeAsPrinted"]:
                    raise ValueError(f"{name}: kit code mismatch for {identity['model']}")
            if name == "dell" and identity["model"] != raw_edge["matchedModel"]:
                raise ValueError(f"{name}: source model mismatch for {identity['model']}")
            if name == "client":
                projection = candidate_products.get(edge["catalogId"])
                if projection is None or identity["model"] != projection["model"] or \
                        identity["vendor"] != projection["vendor"] or \
                        projection["dashboardTab"] not in identity.get("dashboardTabs", []):
                    raise ValueError(f"{name}: catalog projection mismatch for {edge['catalogId']}")
                if raw_edge["evidenceType"] == "fixed_configuration" and \
                        (not raw_edge.get("oemOptionCode") or not raw_edge.get("market")):
                    raise ValueError(f"{name}: fixed configuration lacks code/market")
            platform = project(candidate_platforms[edge["platformId"]], PLATFORM_FIELDS)
            platforms[platform["id"]] = (merge_platform(platforms[platform["id"]], platform)
                                          if platform["id"] in platforms else platform)
            for source_id in [*edge.get("sourceIds", []), *platform.get("sourceIds", [])]:
                if source_id not in candidate_sources:
                    if source_id not in sources:
                        raise ValueError(f"{name}: missing source {source_id}")
                    continue
                if name == "dell" and candidate_sources[source_id].get("accessMode") != "direct_html":
                    raise ValueError(f"{name}: unverified direct source {source_id} on approved edge")
                source = project(candidate_sources[source_id], SOURCE_FIELDS)
                if source_id in sources:
                    old = sources[source_id]
                    if old["url"].split("?")[0] != source["url"].split("?")[0]:
                        raise ValueError(f"{name}: conflicting source URL {source_id}")
                    sources[source_id] = {**old, **source}
                else:
                    sources[source_id] = source
            edges[(edge["catalogId"], edge["platformId"])] = edge

    # The compact browser projection is generated from catalog identities.
    used_catalog_ids = {catalog_id for catalog_id, _ in edges}
    products = []
    for catalog_id in sorted(used_catalog_ids, key=lambda item:
                             (catalog[item]["vendor"], catalog[item]["model"], item)):
        source = catalog[catalog_id]
        tabs = source.get("dashboardTabs") or []
        if len(tabs) != 1:
            raise ValueError(f"Ambiguous dashboard placement for {catalog_id}: {tabs}")
        product = {"catalogId": catalog_id, "vendor": source["vendor"],
                   "dashboardTab": tabs[0], "model": source["model"]}
        if source.get("productId"):
            product["productId"] = source["productId"]
        products.append(product)

    used_platform_ids = {platform_id for _, platform_id in edges}
    used_source_ids = {
        source_id for edge in edges.values() for source_id in edge.get("sourceIds", [])
    } | {
        source_id for platform in platforms.values() if platform["id"] in used_platform_ids
        for source_id in platform.get("sourceIds", [])
    }
    return {
        "schemaVersion": 1,
        "snapshotDate": manifest["snapshotDate"],
        "products": products,
        "platforms": [platform for platform in platforms.values() if platform["id"] in used_platform_ids],
        "compatibility": list(edges.values()),
        "sources": [source for source in sources.values() if source["id"] in used_source_ids],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if the site snapshot differs")
    args = parser.parse_args()
    output = json.dumps(build(), indent=4, ensure_ascii=True) + "\n"
    if args.check:
        if OUTPUT.read_text(encoding="utf-8") != output:
            raise SystemExit("Platform snapshot differs from approved research inputs")
        print("Platform snapshot matches approved research inputs")
    else:
        OUTPUT.write_text(output, encoding="utf-8", newline="")
        assert OUTPUT.read_text(encoding="utf-8") == output
        snapshot = json.loads(output)
        print("Wrote platform snapshot: " + ", ".join(
            f"{key}={len(snapshot[key])}" for key in
            ("products", "platforms", "compatibility", "sources")))


if __name__ == "__main__":
    main()
