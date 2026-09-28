#!/usr/bin/env python3
"""Build the Ampere tab's runtime data from source-backed product records.

Edit docs/specs/ampere-master.csv for SKU specifications or
docs/specs/ampere-roadmap.json for announced, non-SKU roadmap products.
The output js/data/ampere-data.json is generated; do not edit it directly.

Usage:
    python tools/build-ampere-data.py
    python tools/build-ampere-data.py --check
"""

import argparse
import collections
import csv
import json
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "docs/specs/ampere-master.csv"
ROADMAP = ROOT / "docs/specs/ampere-roadmap.json"
OUTPUT = ROOT / "js/data/ampere-data.json"
SERIES_ORDER = ("AmpereOne M", "AmpereOne", "Altra Max", "Altra", "eMAG")
EXPECTED_COUNTS = {"AmpereOne M": 6, "AmpereOne": 7, "Altra Max": 5, "Altra": 7, "eMAG": 1}

FIELDS = (
    "vendor", "model_full", "series", "year", "arch", "cores", "threads",
    "frequency", "frequency_type", "usage_power", "tdp", "l2_cache",
    "system_level_cache", "l3_cache", "mem_type", "mem_channels", "mem_max",
    "pcie_gen", "pcie_lanes", "part_number", "process_node", "source_url", "notes",
)


def optional_int(value):
    return int(value) if value else None


def optional_float(value):
    return float(value) if value else None


def optional_text(value):
    return value or None


def official_url(value):
    host = urlparse(value).netloc.lower()
    if host not in {"amperecomputing.com", "www.amperecomputing.com", "connect-admin.amperecomputing.com"}:
        raise ValueError(f"expected official Ampere source URL: {value!r}")
    return value


def read_skus():
    with MASTER.open(newline="", encoding="utf-8-sig") as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != list(FIELDS):
            raise ValueError("Ampere master columns differ from build schema")
        rows = [{key: (value or "").strip() for key, value in row.items()} for row in reader]

    if len(rows) != 26:
        raise ValueError(f"expected 26 Ampere SKU records, found {len(rows)}")
    counts = collections.Counter(row["series"] for row in rows)
    if counts != EXPECTED_COUNTS:
        raise ValueError(f"unexpected Ampere family counts: {dict(counts)}")
    if len({row["model_full"] for row in rows}) != len(rows):
        raise ValueError("duplicate Ampere model name")
    part_numbers = [row["part_number"] for row in rows if row["part_number"]]
    if len(set(part_numbers)) != len(part_numbers):
        raise ValueError("duplicate Ampere ordering part number")

    processors = []
    previous = None
    for row in rows:
        if row["vendor"] != "Ampere Computing":
            raise ValueError(f"not an Ampere product: {row['model_full']}")
        if not row["model_full"] or not row["arch"]:
            raise ValueError("every Ampere SKU needs a model name and ISA")
        if not row["frequency"] or not row["frequency_type"]:
            raise ValueError(f"missing published clock: {row['model_full']}")
        if bool(row["usage_power"]) == bool(row["tdp"]):
            raise ValueError(f"usage power and TDP must remain distinct: {row['model_full']}")

        group = SERIES_ORDER.index(row["series"])
        cores = int(row["cores"])
        position = (group, -cores, -float(row["frequency"]))
        if previous is not None and position < previous:
            raise ValueError(f"Ampere models must be family-first, highest-core first: {row['model_full']}")
        previous = position

        record = {
            "n": row["model_full"],
            "series": row["series"],
            "year": int(row["year"]),
            "arch": row["arch"],
            "cores": cores,
            "threads": optional_int(row["threads"]),
            "frequency": float(row["frequency"]),
            "frequencyType": row["frequency_type"],
            "usagePower": optional_int(row["usage_power"]),
            "tdp": optional_int(row["tdp"]),
            "l2": optional_text(row["l2_cache"]),
            "slc": optional_text(row["system_level_cache"]),
            "l3": optional_text(row["l3_cache"]),
            "memType": optional_text(row["mem_type"]),
            "memChannels": optional_int(row["mem_channels"]),
            "memMax": optional_text(row["mem_max"]),
            "pcie": f"PCIe {row['pcie_gen']}" if row["pcie_gen"] else None,
            "lanes": optional_int(row["pcie_lanes"]),
            "partNumber": optional_text(row["part_number"]),
            "process": optional_text(row["process_node"]),
            "source": official_url(row["source_url"]),
            "notes": optional_text(row["notes"]),
        }
        processors.append(record)
    return processors


def read_roadmap():
    roadmap = json.loads(ROADMAP.read_text(encoding="utf-8"))
    if not isinstance(roadmap, list):
        raise ValueError("Ampere roadmap must be an array")
    for entry in roadmap:
        if entry.get("status") != "Announced roadmap" or not entry.get("n"):
            raise ValueError("roadmap entries must be named and visibly marked")
        if "cores" in entry or "partNumber" in entry:
            raise ValueError("roadmap entries are not model-level SKUs")
        official_url(entry.get("source", ""))
    return roadmap


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify output matches sources")
    args = parser.parse_args()
    output = {"processors": read_skus(), "roadmap": read_roadmap()}
    serialized = json.dumps(output, indent=4, ensure_ascii=True) + "\n"

    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != serialized:
            raise SystemExit("Ampere runtime JSON has drifted; run tools/build-ampere-data.py")
        print(f"Ampere data current: {len(output['processors'])} SKUs, {len(output['roadmap'])} roadmap entries")
    else:
        OUTPUT.write_text(serialized, encoding="utf-8", newline="\n")
        if OUTPUT.read_text(encoding="utf-8") != serialized:
            raise IOError("Ampere data write did not survive read-back")
        print(f"Built Ampere data: {len(output['processors'])} SKUs, {len(output['roadmap'])} roadmap entries")


if __name__ == "__main__":
    main()
