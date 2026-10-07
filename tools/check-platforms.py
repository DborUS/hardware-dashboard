#!/usr/bin/env python3
"""Validate the source-backed CPU-to-OEM-platform snapshot.

Offline and read-only. Checks identity joins and structural/source guardrails;
reviewers must still confirm that each cited OEM document names the exact SKU.
Run from any directory: python tools/check-platforms.py
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "js" / "data"
DEFAULT_SNAPSHOT = DATA / "platform-compatibility.json"
DEFAULT_CATALOG = DATA / "benchmark-catalog.json"

CPU_TABS = {
    "amd/epyc", "amd/ryzen", "intel/xeon", "intel/client",
    "ampere/processors", "nvidia/cpu",
}
SERVER_CATEGORIES = {
    "rack_server", "gpu_server", "blade", "multi_node", "tower_server", "edge_server",
}
EDGE_EVIDENCE_TYPES = {
    "supported_processor_table", "thermal_qualification_table",
    "qualified_vendor_list", "fixed_configuration",
}

# New manufacturers must be reviewed and added deliberately. A suffix match
# accepts regional/subdomain variants without accepting lookalike domains.
OEM_DOMAINS = {
    "lenovo": ("lenovo.com",),
    "hpe": ("hpe.com",),
    "hp": ("hp.com",),
    "dell": ("dell.com", "delltechnologies.com"),
    "cisco": ("cisco.com",),
    "gigabyte": ("gigabyte.com",),
    "supermicro": ("supermicro.com",),
    "asus": ("asus.com",),
    "asrock rack": ("asrockrack.com",),
    "ampere": ("amperecomputing.com",),
    "nvidia": ("nvidia.com",),
    "jabil": ("jabil.com",),
    "system76": ("system76.com",),
}


def load_json(path: Path, label: str, errors: list[str]) -> object:
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        errors.append(f"{label}: cannot load {path}: {exc}")
        return None


def obj(value: object, where: str, errors: list[str]) -> dict:
    if not isinstance(value, dict):
        errors.append(f"{where}: expected an object")
        return {}
    return value


def records(value: object, where: str, errors: list[str]) -> list[dict]:
    if not isinstance(value, list):
        errors.append(f"{where}: expected an array")
        return []
    output = []
    for index, item in enumerate(value):
        if isinstance(item, dict):
            output.append(item)
        else:
            errors.append(f"{where}[{index}]: expected an object")
    return output


def text(record: dict, field: str, where: str, errors: list[str]) -> str:
    value = record.get(field)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{where}: {field} must be nonempty text")
        return ""
    if value != value.strip():
        errors.append(f"{where}: {field} has surrounding whitespace")
    return value.strip()


def count(
    record: dict, field: str, where: str, errors: list[str],
    low: int, high: int, required: bool = False,
) -> int | None:
    value = record.get(field)
    if value is None and not required:
        return None
    if type(value) is not int or not low <= value <= high:
        errors.append(f"{where}: {field} must be an integer from {low} to {high}")
        return None
    return value


def iso_date(value: object, where: str, errors: list[str]) -> date | None:
    if not isinstance(value, str):
        errors.append(f"{where}: expected an ISO date (YYYY-MM-DD)")
        return None
    try:
        parsed = date.fromisoformat(value)
    except ValueError:
        errors.append(f"{where}: invalid ISO date {value!r}")
        return None
    if parsed.isoformat() != value:
        errors.append(f"{where}: use YYYY-MM-DD")
        return None
    return parsed


def id_list(record: dict, field: str, where: str, errors: list[str]) -> list[str]:
    value = record.get(field)
    if not isinstance(value, list) or not value:
        errors.append(f"{where}: {field} must be a nonempty array")
        return []
    found = []
    for index, item in enumerate(value):
        if not isinstance(item, str) or not item.strip():
            errors.append(f"{where}: {field}[{index}] must be a nonempty ID")
            continue
        if item != item.strip():
            errors.append(f"{where}: {field}[{index}] has surrounding whitespace")
        found.append(item.strip())
    if len(found) != len(set(found)):
        errors.append(f"{where}: duplicate values in {field}")
    return found


def official_host(url: str, oem: str) -> bool:
    try:
        parsed = urlparse(url)
        host = parsed.hostname
    except ValueError:
        return False
    if parsed.scheme != "https" or not host or parsed.username or parsed.password:
        return False
    domains = OEM_DOMAINS.get(oem.casefold(), ())
    host = host.lower().rstrip(".")
    return any(host == domain or host.endswith("." + domain) for domain in domains)


def validate(snapshot: object, catalog: object) -> tuple[list[str], dict[str, int]]:
    errors: list[str] = []
    snapshot = obj(snapshot, "snapshot", errors)
    catalog = obj(catalog, "catalog", errors)
    if type(snapshot.get("schemaVersion")) is not int or snapshot.get("schemaVersion") != 1:
        errors.append("snapshot: schemaVersion must be 1")
    snapshot_date = iso_date(snapshot.get("snapshotDate"), "snapshot.snapshotDate", errors)

    catalog_rows = records(catalog.get("products"), "catalog.products", errors)
    catalog_by_id = {}
    catalog_names = Counter()
    catalog_parts = Counter()
    for index, product in enumerate(catalog_rows):
        product_id = product.get("id")
        if not isinstance(product_id, str) or not product_id:
            errors.append(f"catalog.products[{index}]: missing id")
        elif product_id in catalog_by_id:
            errors.append(f"catalog.products[{index}]: duplicate catalog id {product_id}")
        else:
            catalog_by_id[product_id] = product
        for tab in product.get("dashboardTabs", []):
            catalog_names[(tab, product.get("model"))] += 1
            catalog_parts[(tab, product.get("model"), product.get("productId"))] += 1

    products = records(snapshot.get("products"), "snapshot.products", errors)
    platforms = records(snapshot.get("platforms"), "snapshot.platforms", errors)
    edges = records(snapshot.get("compatibility"), "snapshot.compatibility", errors)
    sources = records(snapshot.get("sources"), "snapshot.sources", errors)
    for field, entries in (("products", products), ("platforms", platforms),
                           ("compatibility", edges), ("sources", sources)):
        if not entries:
            errors.append(f"snapshot.{field}: at least one record is required")

    product_by_id = {}
    for index, product in enumerate(products):
        where = f"products[{index}]"
        ident = text(product, "catalogId", where, errors)
        vendor = text(product, "vendor", where, errors)
        tab = text(product, "dashboardTab", where, errors)
        model = text(product, "model", where, errors)
        if ident in product_by_id:
            errors.append(f"{where}: duplicate catalogId {ident}")
        elif ident:
            product_by_id[ident] = product
        reference = catalog_by_id.get(ident)
        if not reference:
            errors.append(f"{where}: catalogId {ident!r} is absent from benchmark-catalog")
            continue
        if vendor != reference.get("vendor"):
            errors.append(f"{where}: vendor {vendor!r} differs from catalog {reference.get('vendor')!r}")
        if model != reference.get("model"):
            errors.append(f"{where}: model {model!r} differs from catalog {reference.get('model')!r}")
        if tab not in reference.get("dashboardTabs", []):
            errors.append(f"{where}: dashboardTab {tab!r} is not a catalog placement")
        if tab not in CPU_TABS:
            errors.append(f"{where}: {tab!r} is not a CPU tab")
        expected_part = reference.get("productId")
        actual_part = product.get("productId")
        if expected_part != actual_part:
            errors.append(f"{where}: productId {actual_part!r} differs from catalog {expected_part!r}")
        if "productId" in product and (not isinstance(actual_part, str) or not actual_part.strip()):
            errors.append(f"{where}: productId must be nonempty text when present")
        if actual_part is None and catalog_names[(tab, model)] != 1:
            errors.append(f"{where}: ({tab!r}, {model!r}) is not unique in the full catalog; "
                          "a model-only platform row could join the wrong product")
        elif actual_part is not None and catalog_parts[(tab, model, actual_part)] != 1:
            errors.append(f"{where}: ({tab!r}, {model!r}, {actual_part!r}) is not unique "
                          "in the full catalog")

    platform_by_id = {}
    for index, platform in enumerate(platforms):
        where = f"platforms[{index}]"
        ident = text(platform, "id", where, errors)
        oem = text(platform, "oem", where, errors)
        text(platform, "model", where, errors)
        category = text(platform, "category", where, errors)
        text(platform, "formFactor", where, errors)
        if ident in platform_by_id:
            errors.append(f"{where}: duplicate platform id {ident}")
        elif ident:
            platform_by_id[ident] = platform
        if oem and oem.casefold() not in OEM_DOMAINS:
            errors.append(f"{where}: OEM {oem!r} needs a reviewed official-domain mapping")
        socket_count = count(platform, "socketCount", where, errors, 1, 8,
                             required=category in SERVER_CATEGORIES)
        channels = count(platform, "memoryChannelsPerSocket", where, errors, 1, 32)
        count(platform, "dimmSlots", where, errors, 1, 256)
        count(platform, "rackUnits", where, errors, 1, 48)
        if channels is not None and socket_count is None and category in SERVER_CATEGORIES:
            errors.append(f"{where}: memory channels need a valid socketCount")
        for field, upper in (("displaySizeInches", 100), ("volumeLiters", 1000)):
            value = platform.get(field)
            if value is not None and (type(value) not in (int, float) or not 0 < value <= upper):
                errors.append(f"{where}: {field} must be a positive number at most {upper}")
        if "dimensions" in platform:
            text(platform, "dimensions", where, errors)
        id_list(platform, "sourceIds", where, errors)

    source_by_id = {}
    for index, source in enumerate(sources):
        where = f"sources[{index}]"
        ident = text(source, "id", where, errors)
        text(source, "publisher", where, errors)
        text(source, "title", where, errors)
        text(source, "locator", where, errors)
        url = text(source, "url", where, errors)
        retrieved = iso_date(source.get("retrievedAt"), f"{where}.retrievedAt", errors)
        if retrieved and snapshot_date and retrieved > snapshot_date:
            errors.append(f"{where}: retrievedAt is after snapshotDate")
        if ident in source_by_id:
            errors.append(f"{where}: duplicate source id {ident}")
        elif ident:
            source_by_id[ident] = source
        try:
            parsed = urlparse(url)
            valid_url = (parsed.scheme == "https" and bool(parsed.hostname)
                         and not parsed.username and not parsed.password)
        except ValueError:
            valid_url = False
        if not valid_url:
            errors.append(f"{where}: source URL must be an absolute HTTPS URL without credentials")

    used_sources = set()
    for index, platform in enumerate(platforms):
        oem = str(platform.get("oem") or "")
        for ident in id_list(platform, "sourceIds", f"platforms[{index}]", []):
            source = source_by_id.get(ident)
            if source is None:
                errors.append(f"platforms[{index}]: unknown sourceId {ident}")
            elif not official_host(str(source.get("url") or ""), oem):
                errors.append(f"platforms[{index}]: source {ident} is not on an official {oem} HTTPS domain")
            else:
                used_sources.add(ident)

    used_products = set()
    used_platforms = set()
    seen_edges = set()
    for index, edge in enumerate(edges):
        where = f"compatibility[{index}]"
        product_id = text(edge, "catalogId", where, errors)
        platform_id = text(edge, "platformId", where, errors)
        if product_id not in product_by_id:
            errors.append(f"{where}: unknown product catalogId {product_id}")
        else:
            used_products.add(product_id)
        platform = platform_by_id.get(platform_id)
        if platform is None:
            errors.append(f"{where}: unknown platformId {platform_id}")
        else:
            used_platforms.add(platform_id)
        pair = (product_id, platform_id)
        if pair in seen_edges:
            errors.append(f"{where}: duplicate product/platform edge {product_id} -> {platform_id}")
        seen_edges.add(pair)
        if edge.get("supportLevel") != "confirmed":
            errors.append(f"{where}: v1 contains only confirmed exact-SKU edges")
        if edge.get("evidenceType") not in EDGE_EVIDENCE_TYPES:
            errors.append(f"{where}: unknown evidenceType {edge.get('evidenceType')!r}")
        if "oemOptionCode" in edge:
            text(edge, "oemOptionCode", where, errors)
        quantities = edge.get("supportedCpuQuantities")
        if quantities is not None:
            if not isinstance(quantities, list) or not quantities:
                errors.append(f"{where}: supportedCpuQuantities must be a nonempty array")
            else:
                if len(quantities) != len(set(map(str, quantities))):
                    errors.append(f"{where}: duplicate supportedCpuQuantities")
                sockets = platform.get("socketCount") if platform else None
                for quantity in quantities:
                    if type(quantity) is not int or not 1 <= quantity <= 8:
                        errors.append(f"{where}: implausible CPU quantity {quantity!r}")
                    elif type(sockets) is int and quantity > sockets:
                        errors.append(f"{where}: CPU quantity {quantity} exceeds {sockets} platform sockets")
        for ident in id_list(edge, "sourceIds", where, errors):
            source = source_by_id.get(ident)
            if source is None:
                errors.append(f"{where}: unknown sourceId {ident}")
            elif platform and not official_host(str(source.get("url") or ""), str(platform.get("oem") or "")):
                errors.append(f"{where}: source {ident} is not on an official {platform.get('oem')} HTTPS domain")
            else:
                used_sources.add(ident)

    for ident in sorted(product_by_id.keys() - used_products):
        errors.append(f"products: orphan product {ident} has no compatibility edge")
    for ident in sorted(platform_by_id.keys() - used_platforms):
        errors.append(f"platforms: orphan platform {ident} has no compatibility edge")
    for ident in sorted(source_by_id.keys() - used_sources):
        errors.append(f"sources: orphan source {ident} is not used by a platform or edge")

    summary = {
        "products": len(products), "platforms": len(platforms),
        "edges": len(edges), "sources": len(sources),
        "oems": len({str(p.get("oem") or "") for p in platforms}),
    }
    return errors, summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_SNAPSHOT,
                        help="platform compatibility JSON (default: site snapshot)")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG,
                        help="generated benchmark catalog JSON")
    args = parser.parse_args()
    load_errors: list[str] = []
    snapshot = load_json(args.data, "snapshot", load_errors)
    catalog = load_json(args.catalog, "catalog", load_errors)
    if load_errors:
        for error in load_errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    errors, summary = validate(snapshot, catalog)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        print(f"Platform validation failed: {len(errors)} error(s).", file=sys.stderr)
        return 1
    print("Platform validation passed: " + ", ".join(
        f"{summary[field]} {field}" for field in
        ("products", "platforms", "edges", "sources", "oems")) + ".")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
