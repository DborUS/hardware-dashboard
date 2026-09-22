#!/usr/bin/env python3
"""Compile audited NVIDIA source CSVs into the dashboard's runtime JSON.

The CSVs remain the factual source of truth.  This file only reshapes their
fields for presentation; blank source values remain blank.
"""

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "specs" / "source-csv-nvidia"
OUT = ROOT / "js" / "data" / "nvidia-data.json"


def read(name):
    with (SOURCE / name).open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def value(row, key):
    return (row.get(key) or "").strip()


def gpu_record(row, product_line):
    year = value(row, "Family Year") or value(row, "Launch Year")
    return {
        "n": value(row, "Name"),
        "series": value(row, "Series"),
        "segment": value(row, "Segment") or ("desktop" if product_line == "geforce" else "datacenter"),
        "arch": value(row, "Architecture"),
        "year": year,
        "cores": value(row, "CUDA Cores"),
        "bas": value(row, "Base Clock"),
        "bst": value(row, "Boost Clock"),
        "mem": value(row, "Memory Size"),
        "memType": value(row, "Memory Type"),
        "bus": value(row, "Memory Interface Width"),
        "bw": value(row, "Memory Bandwidth"),
        "pcie": value(row, "PCIe Generation"),
        "lanes": value(row, "PCIe Lanes"),
        "power": value(row, "Board Power"),
        "fp32": value(row, "FP32"),
        "form": value(row, "Form Factor") or value(row, "Slot"),
        "source": value(row, "Source URL"),
        "confidence": "high",
        "notes": value(row, "Notes"),
    }


def cpu_record(row):
    return {
        "n": value(row, "Name"),
        "series": value(row, "Series"),
        "segment": value(row, "Segment"),
        "arch": value(row, "Architecture"),
        "year": value(row, "Launch Year"),
        "cores": value(row, "CPU Cores"),
        "threads": value(row, "Threads"),
        "l2": value(row, "L2 Cache"),
        "l3": value(row, "L3 Cache"),
        "mem": value(row, "Memory Size"),
        "memType": value(row, "Memory Type"),
        "bw": value(row, "Memory Bandwidth"),
        "pcie": value(row, "PCIe Generation"),
        "lanes": value(row, "PCIe Lanes"),
        "tdp": value(row, "TDP"),
        "source": value(row, "Source URL"),
        "confidence": "medium" if "conflict" in value(row, "Notes").lower() else "high",
        "notes": value(row, "Notes"),
    }


def main():
    geforce = [gpu_record(row, "geforce") for row in read("NVIDIA GeForce GPUs.csv")]
    datacenter = [gpu_record(row, "datacenter") for row in read("NVIDIA Data Center GPUs.csv")]
    cpus = [cpu_record(row) for row in read("NVIDIA CPUs.csv")]
    data = {"datacenter": datacenter, "geforce": geforce, "cpu": cpus}

    expected = {"datacenter": 20, "geforce": 47, "cpu": 4}
    actual = {key: len(rows) for key, rows in data.items()}
    if actual != expected:
        raise RuntimeError(f"NVIDIA row-count guard failed: expected {expected}, got {actual}")
    for tab, records in data.items():
        names = [record["n"] for record in records]
        if len(names) != len(set(names)):
            raise RuntimeError(f"duplicate NVIDIA names in {tab}")
        if any(not record["source"].startswith("https://") for record in records):
            raise RuntimeError(f"missing official NVIDIA source in {tab}")

    text = json.dumps(data, indent=4, ensure_ascii=True) + "\n"
    OUT.write_text(text, encoding="utf-8", newline="")
    if OUT.read_text(encoding="utf-8") != text:
        raise RuntimeError("NVIDIA runtime JSON write verification failed")
    print(f"wrote {OUT.relative_to(ROOT)}: {actual}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
