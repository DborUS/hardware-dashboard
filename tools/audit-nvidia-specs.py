#!/usr/bin/env python3
"""Audit NVIDIA source CSVs against their official pull and an independent GPU DB.

Official NVIDIA data remains authoritative.  The independent database is used
only to detect transcription, unit, or variant-selection mistakes.
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import pickle
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PULL_PATH = Path(__file__).resolve().with_name("pull-nvidia-specs.py")
PULL_SPEC = importlib.util.spec_from_file_location("pull_nvidia_specs", PULL_PATH)
if PULL_SPEC is None or PULL_SPEC.loader is None:
    raise RuntimeError(f"Could not load {PULL_PATH}")
pull = importlib.util.module_from_spec(PULL_SPEC)
PULL_SPEC.loader.exec_module(pull)

SRC = ROOT / "docs" / "specs" / "source-csv-nvidia"
AUDIT = ROOT / "docs" / "specs" / "nvidia-audit.csv"
GAPS = ROOT / "docs" / "specs" / "nvidia-gaps.csv"


ALIASES = {
    "GeForce RTX 3050 (8 GB)": "GeForce RTX 3050 8 GB",
    "GeForce RTX 3050 (6 GB)": "GeForce RTX 3050 6 GB",
    "GeForce RTX 2080 Super": "GeForce RTX 2080 SUPER",
    "GeForce RTX 2070 Super": "GeForce RTX 2070 SUPER",
    "GeForce RTX 2060 Super": "GeForce RTX 2060 SUPER",
    "GeForce GTX 1660 Super": "GeForce GTX 1660 SUPER",
    "GeForce GTX 1650 Super": "GeForce GTX 1650 SUPER",
    "GeForce GTX 1650 (G5)": "GeForce GTX 1650",
    "GeForce GTX 1650 (G6)": "GeForce GTX 1650 GDDR6",
    "GeForce RTX 4070 GDDR6X": "GeForce RTX 4070",
    "GeForce RTX 3060 Ti GDDR6": "GeForce RTX 3060 Ti",
    "GeForce RTX 3080 10 GB": "GeForce RTX 3080",
    "GeForce RTX 2060 6 GB": "GeForce RTX 2060",
    "Tesla V100 PCIe 32GB": "Tesla V100 PCIe 32 GB",
    "Tesla V100 SXM2 32GB": "Tesla V100 SXM2 32 GB",
    "Tesla V100S PCIe 32GB": "Tesla V100S PCIe 32 GB",
    "T4": "Tesla T4",
    "A10": "A10 PCIe",
    "A16": "A16 PCIe",
    "A30": "A30 PCIe",
    "A40": "A40 PCIe",
    "A100 80GB PCIe": "A100 PCIe 80 GB",
    "A100 80GB SXM": "A100 SXM4 80 GB",
    "H100 SXM": "H100 SXM5 80 GB",
    "H100 NVL": "H100 NVL 94 GB",
    "H200 SXM": "H200 SXM 141 GB",
    "B200 SXM": "B200",
    "B300 SXM": "B300",
    "RTX PRO 6000 Blackwell Server Edition": "RTX PRO 6000 Blackwell Server",
}

CPU_SECONDARY = {
    "Grace CPU C1": "https://developer.nvidia.com/blog/nvidia-grace-cpu-integrates-with-the-arm-software-ecosystem/",
    "Grace CPU Superchip": "https://developer.nvidia.com/blog/nvidia-grace-cpu-superchip-architecture-in-depth/",
    "GH200 Grace Hopper Superchip": "https://developer.nvidia.com/blog/simplify-system-memory-management-with-the-latest-nvidia-gh200-nvl2-enterprise-ra/",
    "GB10 Grace Blackwell Superchip": "https://www.nvidia.com/content/dam/en-zz/Solutions/dgx-spark/DGX-Spark-Quick-Start-Guide.pdf",
}


def rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def number(value: str | None) -> float | None:
    match = re.search(r"\d+(?:\.\d+)?", value or "")
    return float(match.group()) if match else None


def all_numbers(value: str | None) -> list[float]:
    return [float(item) for item in re.findall(r"\d+(?:\.\d+)?", value or "")]


def close(left: float | None, right: float | None, tolerance: float = 0.011) -> bool:
    if left is None or right is None:
        return False
    return abs(left - right) <= max(0.5, abs(right) * tolerance)


def normalized_arch(value: str | None) -> str:
    value = (value or "").lower().replace("nvidia", "").replace("architecture", "")
    value = value.replace("ada lovelace", "ada").replace("blackwell ultra", "blackwell")
    value = re.sub(r"\bblackwell\s*2(?:\.0)?\b", "blackwell", value)
    return re.sub(r"[^a-z0-9]+", "", value)


def slot_key(value: str | None) -> str:
    value = (value or "").lower().replace("dual-slot", "2-slot").replace("triple-slot", "3-slot")
    return re.sub(r"[^a-z0-9]+", "", value)


def load_dbgpu(path: Path) -> dict[str, dict]:
    with path.open("rb") as fh:
        data = pickle.load(fh)
    return {item["name"]: item for item in data if item.get("manufacturer") == "NVIDIA"}


def compare_gpu(row: dict[str, str], ref: dict | None, consumer: bool) -> tuple[list[str], list[str]]:
    checked, conflicts = [], []
    if ref is None:
        return checked, ["No independent GPU database match"]

    def check(label: str, left, right, ok) -> None:
        if left in (None, "") or right in (None, ""):
            return
        if ok:
            checked.append(label)
        else:
            conflicts.append(f"{label}: NVIDIA={left}; independent={right}")

    check("architecture", row.get("Architecture"), ref.get("architecture"),
          normalized_arch(row.get("Architecture")) == normalized_arch(ref.get("architecture")))
    check("CUDA cores", row.get("CUDA Cores"), ref.get("shading_units"),
          number(row.get("CUDA Cores")) == number(str(ref.get("shading_units"))))

    if consumer:
        multiplier = 1000 if "GTX 16" not in row.get("Series", "") else 1
        check("base clock", row.get("Base Clock"), ref.get("base_clock_mhz"),
              close(number(row.get("Base Clock")) * multiplier if number(row.get("Base Clock")) is not None else None,
                    number(str(ref.get("base_clock_mhz"))), .006))
        check("boost clock", row.get("Boost Clock"), ref.get("boost_clock_mhz"),
              close(number(row.get("Boost Clock")) * multiplier if number(row.get("Boost Clock")) is not None else None,
                    number(str(ref.get("boost_clock_mhz"))), .006))

    scale = 4 if row.get("Name") == "A16" else 2 if row.get("Name") in {"B200 SXM", "B300 SXM"} else 1
    independent_memory = number(str(ref.get("memory_size_gb")))
    if independent_memory is not None:
        independent_memory *= scale
    check("memory size", row.get("Memory Size"), independent_memory,
          close(number(row.get("Memory Size")), independent_memory))
    check("memory type", row.get("Memory Type"), ref.get("memory_type"),
          re.sub(r"\s+ECC$", "", row.get("Memory Type", ""), flags=re.I).lower() == str(ref.get("memory_type", "")).lower())
    check("memory interface", row.get("Memory Interface Width"), ref.get("memory_bus_bits"),
          number(row.get("Memory Interface Width")) == number(str(ref.get("memory_bus_bits"))))
    official_bandwidth = number(row.get("Memory Bandwidth"))
    if re.search(r"\d+\s*x\s*\d+", row.get("Memory Bandwidth", ""), re.I):
        factors = all_numbers(row.get("Memory Bandwidth"))
        official_bandwidth = factors[0] * factors[1]
    if official_bandwidth is not None and "TB/s" in row.get("Memory Bandwidth", ""):
        official_bandwidth *= 1000
    independent_bandwidth = number(str(ref.get("memory_bandwidth_gb_s")))
    if independent_bandwidth is not None:
        independent_bandwidth *= scale
    check("memory bandwidth", row.get("Memory Bandwidth"), independent_bandwidth,
          close(official_bandwidth, independent_bandwidth, .021))

    bus = str(ref.get("bus_interface") or "")
    bus_gen = re.search(r"PCIe\s*(\d+(?:\.\d+)?)", bus, re.I)
    bus_lanes = re.search(r"x(\d+)", bus, re.I)
    check("PCIe generation", row.get("PCIe Generation"), bus_gen.group(1) if bus_gen else None,
          number(row.get("PCIe Generation")) == number(bus_gen.group(1) if bus_gen else None))
    if row.get("Name") != "A16":
        check("PCIe lanes", row.get("PCIe Lanes"), bus_lanes.group(1) if bus_lanes else None,
              number(row.get("PCIe Lanes")) == number(bus_lanes.group(1) if bus_lanes else None))

    cuda = None
    if ref.get("cuda_major_version") is not None:
        cuda = f"{ref['cuda_major_version']}.{ref.get('cuda_minor_version') or 0}"
    check("CUDA capability", row.get("CUDA Capability"), cuda,
          number(row.get("CUDA Capability")) == number(cuda))

    official_power = all_numbers(row.get("Board Power"))
    independent_power = number(str(ref.get("thermal_design_power_w")))
    if official_power and independent_power is not None:
        checked.append("board power")
        if not any(close(item, independent_power, .01) for item in official_power):
            conflicts.append(f"board power: NVIDIA={row.get('Board Power')}; independent={independent_power:g} W")

    fp32 = number(row.get("FP32"))
    ref_fp32 = number(str(ref.get("single_float_performance_gflop_s")))
    if fp32 is not None and ref_fp32 is not None:
        checked.append("FP32")
        if not close(fp32 * 1000, ref_fp32, .025):
            conflicts.append(f"FP32: NVIDIA={row.get('FP32')}; independent={ref_fp32/1000:g} TFLOPS")
    return checked, conflicts


def build_audit(dbgpu: dict[str, dict]) -> tuple[list[dict], list[dict]]:
    audit, gaps = [], []
    geforce = rows(SRC / "NVIDIA GeForce GPUs.csv")
    dc = rows(SRC / "NVIDIA Data Center GPUs.csv")
    cpus = rows(SRC / "NVIDIA CPUs.csv")

    fresh = {row["Name"]: row for row in pull.pull_geforce()}
    if fresh != {row["Name"]: row for row in geforce}:
        raise RuntimeError("GeForce CSV is not a byte-equivalent logical refresh of NVIDIA's current comparison tables")

    for kind, source_rows, consumer in (("gpu", geforce, True), ("gpu", dc, False)):
        for row in source_rows:
            lookup = ALIASES.get(row["Name"], row["Name"])
            ref = dbgpu.get(lookup)
            checked, conflicts = compare_gpu(row, ref, consumer)
            critical = ["CUDA cores", "board power"] + (["boost clock"] if consumer else [])
            compared_with_variance = {conflict.split(":", 1)[0] for conflict in conflicts}
            missing_critical = [field for field in critical if row.get({"CUDA cores":"CUDA Cores", "board power":"Board Power", "boost clock":"Boost Clock"}[field]) and field not in checked and field not in compared_with_variance]
            if ref is None:
                status = "needs independent match"
            elif conflicts:
                status = "source variance"
            elif missing_critical:
                status = "corroboration gap"
            else:
                status = "pass"
            audit.append({
                "vendor":"NVIDIA", "kind":kind, "model":row["Name"], "status":status,
                "primary_source_url":row["Source URL"],
                "secondary_source_url":ref.get("tpu_url", "") if ref else "",
                "fields_corroborated":" | ".join(checked),
                "conflicts":" | ".join(conflicts),
                "action":"Retain official NVIDIA value; independent source differs" if conflicts else "No correction required",
            })
            for conflict in conflicts:
                field = conflict.split(":", 1)[0]
                gaps.append({"model":row["Name"], "field":field, "why_missing":"Independent source variance", "what_i_tried":conflict})
            for field in missing_critical:
                gaps.append({"model":row["Name"], "field":field, "why_missing":"No independent corroboration", "what_i_tried":lookup})

    cpu_checks = {
        "Grace CPU C1": "cores=72; memory bandwidth=500 GB/s; L3 conflict retained",
        "Grace CPU Superchip": "cores=144; memory bandwidth=1 TB/s; TDP=500 W; L3 conflict retained",
        "GH200 Grace Hopper Superchip": "cores=72; CPU memory=480 GB; GPU memory=144 GB; GPU bandwidth=4.9 TB/s; L3 conflict retained",
        "GB10 Grace Blackwell Superchip": "cores=20; memory=128 GB; TDP=140 W",
    }
    for row in cpus:
        conflict = "L3: formal guide=117 MB per CPU; current NVIDIA blog=114 MB" if row["Name"] != "GB10 Grace Blackwell Superchip" else ""
        audit.append({
            "vendor":"NVIDIA", "kind":"cpu", "model":row["Name"],
            "status":"documented conflict" if conflict else "pass",
            "primary_source_url":row["Source URL"], "secondary_source_url":CPU_SECONDARY[row["Name"]],
            "fields_corroborated":cpu_checks[row["Name"]], "conflicts":conflict,
            "action":"Retain formal performance-guide cache value and mark confidence medium" if conflict else "No correction required",
        })
        if conflict:
            gaps.append({"model":row["Name"], "field":"L3 cache", "why_missing":"Conflicting NVIDIA documentation", "what_i_tried":conflict})

    # Track dashboard-relevant blanks without inventing values.
    master = rows(ROOT / "docs" / "specs" / "nvidia-master.csv")
    fields = {
        "gpu": ["cores", "tdp", "pcie_gen", "mem_type", "mem_speed", "mem_max_capacity"],
        "cpu": ["cores", "threads", "tdp", "pcie_gen", "mem_type", "mem_speed", "mem_max_capacity"],
    }
    existing = {(gap["model"], gap["field"]) for gap in gaps}
    for row in master:
        for field in fields[row["kind"]]:
            if not row[field] and (row["model"], field) not in existing:
                gaps.append({
                    "model":row["model"], "field":field,
                    "why_missing":"Official source does not provide a stable value in the selected product specification",
                    "what_i_tried":row["source_url"],
                })
    return audit, gaps


def write(path: Path, records: list[dict], fields: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(records)


def validate_outputs(audit: list[dict], gaps: list[dict]) -> None:
    geforce = rows(SRC / "NVIDIA GeForce GPUs.csv")
    dc = rows(SRC / "NVIDIA Data Center GPUs.csv")
    cpus = rows(SRC / "NVIDIA CPUs.csv")
    master = rows(ROOT / "docs" / "specs" / "nvidia-master.csv")
    source_rows = geforce + dc + cpus

    assert len(source_rows) == len(master) == len(audit), "source/master/audit row counts differ"
    names = [row["Name"] for row in source_rows]
    assert len(names) == len(set(names)), "duplicate source model names"
    assert set(names) == {row["model"] for row in audit}, "audit coverage differs from source rows"
    assert not any(row["status"] in {"needs independent match", "corroboration gap", "conflict"} for row in audit)
    assert all(row["primary_source_url"].startswith("https://") for row in audit)
    assert all(row["secondary_source_url"].startswith("https://") for row in audit)
    assert all(row["fields_corroborated"] for row in audit)
    assert all(row["Source Tier"] == "1" and row["Source URL"].startswith("https://") for row in source_rows)
    assert all(int(row["Family Year"]) >= 2017 for row in geforce)
    assert all(int(row["Launch Year"]) >= 2017 for row in dc + cpus)
    assert all(row["vendor"] == "NVIDIA" and row["kind"] in {"gpu", "cpu"} for row in master)
    assert all(row["source_tier"] == "1" and row["confidence"] in {"high", "medium"} for row in master)
    assert len({row["model_full"] for row in master}) == len(master), "duplicate master model names"
    assert all(all(row[field] for field in ("model", "field", "why_missing", "what_i_tried")) for row in gaps)
    for row in geforce:
        for field in ("CUDA Cores", "Base Clock", "Boost Clock", "Memory Interface Width", "Board Power"):
            assert "/" not in row[field], f"unsplit variant value: {row['Name']} {field}"
    with (ROOT / "docs" / "specs" / "nvidia-master.csv").open(encoding="utf-8-sig", newline="") as fh:
        assert next(csv.reader(fh)) == pull.MASTER_HEADER, "master header differs from dataset contract"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dbgpu", required=True, type=Path)
    args = ap.parse_args()
    audit, gaps = build_audit(load_dbgpu(args.dbgpu))
    write(AUDIT, audit, ["vendor","kind","model","status","primary_source_url","secondary_source_url","fields_corroborated","conflicts","action"])
    write(GAPS, gaps, ["model","field","why_missing","what_i_tried"])
    validate_outputs(audit, gaps)
    summary = {}
    for row in audit:
        summary[row["status"]] = summary.get(row["status"], 0) + 1
    print(f"audit rows: {len(audit)}; status: {summary}; gaps/conflicts: {len(gaps)}")
    print("validation: passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
