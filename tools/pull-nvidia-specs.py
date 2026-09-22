#!/usr/bin/env python3
"""Pull the first NVIDIA CPU/GPU CSV set used by the hardware dashboard.

The GeForce file is refreshed from NVIDIA's official comparison tables.  The
data-center and CPU seed tables use the same official product pages and
datasheets, but stay explicit here because NVIDIA does not publish a single
catalog API for those product lines.

Outputs:
    docs/specs/source-csv-nvidia/NVIDIA GeForce GPUs.csv
    docs/specs/source-csv-nvidia/NVIDIA Data Center GPUs.csv
    docs/specs/source-csv-nvidia/NVIDIA CPUs.csv
    docs/specs/nvidia-master.csv
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "specs" / "source-csv-nvidia"
MASTER = ROOT / "docs" / "specs" / "nvidia-master.csv"

GEFORCE_URL = "https://www.nvidia.com/en-us/geforce/graphics-cards/compare/"

MASTER_HEADER = (
    "vendor,kind,gpu_family_id,family,series,segment,codename,arch,model,model_full,"
    "cores,p_cores,e_cores,threads,base_clock,boost_clock,all_core_boost,l2_cache,"
    "l3_cache,tdp,tdp_config_up,process,socket,socket_count,pcie_gen,pcie_lanes,"
    "mem_type,mem_channels,mem_speed,mem_max_capacity,ecc,cxl,upi_links,igpu_model,"
    "igpu_cores,igpu_clock,npu_tops,launch_date,launch_price_usd,part_number,"
    "source_url,source_tier,confidence,notes"
).split(",")


def clean(value) -> str:
    if pd.isna(value):
        return ""
    text = (str(value).replace("\ufffd", "").replace("\u00ae", "")
            .replace("\u2122", "").replace("\u00a0", " "))
    return re.sub(r"\s+", " ", text).strip()


def find_value(mapping: dict[str, str], *labels: str) -> str:
    for label in labels:
        if label in mapping and mapping[label]:
            return mapping[label]
    return ""


def parse_memory_variants(value: str) -> list[tuple[str, str]]:
    variants = []
    shared_kind = re.search(r"\b(GDDR\dX?|HBM\d*e?)\b", value, re.I)
    for part in re.split(r"\s*(?:/|\bor\b)\s*", value, flags=re.I):
        size = re.search(r"(\d+(?:\.\d+)?)\s*GB", part, re.I)
        kind = re.search(r"\b(GDDR\dX?|HBM\d*e?)\b", part, re.I)
        if size:
            variants.append((size.group(1) + " GB", kind.group(1) if kind else shared_kind.group(1) if shared_kind else ""))
    return variants or [(value, "")]


def variant_value(value: str, index: int, count: int) -> str:
    parts = [part.strip() for part in re.split(r"\s*/\s*", value)]
    return parts[index] if count > 1 and len(parts) == count else value


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def pull_geforce() -> list[dict]:
    tables = pd.read_html(GEFORCE_URL)
    if len(tables) < 6:
        raise RuntimeError(f"expected at least 6 NVIDIA comparison tables, got {len(tables)}")

    series_meta = [
        (tables[1], "GeForce RTX 50 Series", "Blackwell", "2025", "5.0"),
        (tables[2], "GeForce RTX 40 Series", "Ada Lovelace", "2022", "4.0"),
        (tables[3], "GeForce RTX 30 Series", "Ampere", "2020", "4.0"),
        (tables[4], "GeForce RTX 20 Series", "Turing", "2018", "3.0"),
        (tables[5], "GeForce GTX 16 Series", "Turing", "2019", "3.0"),
    ]
    rows = []
    for table, series, arch, family_year, default_pcie in series_meta:
        label_col = table.columns[0]
        labels = [clean(v) for v in table[label_col].tolist()]
        for model_col in table.columns[1:]:
            model = clean(model_col)
            if not model or model.lower().startswith("unnamed"):
                continue
            values = {label: clean(value) for label, value in zip(labels, table[model_col].tolist()) if label}
            memory_config = find_value(values, "Standard Memory Config")
            memory_variants = parse_memory_variants(memory_config)
            power = find_value(values, "Total Graphics Power (W)", "Graphics Card Power (W)")
            variant_power = {
                "GeForce RTX 5060 Ti": {"16 GB": "180 W", "8 GB": "180 W"},
                "GeForce RTX 4060 Ti": {"16 GB": "165 W", "8 GB": "160 W"},
                "GeForce RTX 3060": {"12 GB": "170 W", "8 GB": "170 W"},
            }
            distinct_sizes = len({item[0] for item in memory_variants}) == len(memory_variants)
            for index, (memory, memory_type) in enumerate(memory_variants):
                if len(memory_variants) == 1:
                    variant_name = model
                elif distinct_sizes:
                    variant_name = f"{model} {memory}"
                else:
                    variant_name = f"{model} {memory_type}"
                variant_power_value = variant_power.get(model, {}).get(
                    memory, variant_value(power, index, len(memory_variants)))
                if variant_power_value and re.fullmatch(r"\d+(?:\.\d+)?", variant_power_value):
                    variant_power_value += " W"
                rows.append({
                "Name": variant_name,
                "Series": series,
                "Segment": "desktop",
                "Architecture": arch,
                "Family Year": family_year,
                "CUDA Cores": variant_value(find_value(values, "NVIDIA CUDA Cores"), index, len(memory_variants)),
                "Base Clock": variant_value(find_value(values, "Base Clock (GHz)", "Base Clock (MHz)"), index, len(memory_variants)),
                "Boost Clock": variant_value(find_value(values, "Boost Clock (GHz)", "Boost Clock (MHz)"), index, len(memory_variants)),
                "Memory Configuration": memory_config,
                "Memory Size": memory,
                "Memory Type": memory_type,
                "Memory Interface Width": variant_value(find_value(values, "Memory Interface Width"), index, len(memory_variants)),
                "Memory Bandwidth": find_value(values, "Memory Bandwidth"),
                "PCIe Generation": default_pcie,
                "CUDA Capability": find_value(values, "CUDA Capability") or ("7.5" if arch == "Turing" else ""),
                "Board Power": variant_power_value,
                "Length": find_value(values, "Length"),
                "Width": find_value(values, "Width"),
                "Slot": find_value(values, "Slot"),
                "Source URL": GEFORCE_URL,
                "Source Tier": "1",
                "Notes": "NVIDIA reference/Founders Edition specifications; partner boards may differ."
                         + (" Split from a combined NVIDIA memory-variant column." if len(memory_variants) > 1 else ""),
            })
    return rows


def datacenter_rows() -> list[dict]:
    # One row per dashboard-relevant accelerator/variant, 2017 onward.
    # Values are transcribed from the linked NVIDIA specification page/datasheet.
    return [
        {"Name":"Tesla V100 PCIe 32GB","Series":"V-Series","Architecture":"Volta","Launch Year":"2017","CUDA Cores":"5120","Memory Size":"32 GB","Memory Type":"HBM2","Memory Bandwidth":"900 GB/s","FP32":"14 TFLOPS","PCIe Generation":"3.0","PCIe Lanes":"16","Form Factor":"PCIe","Board Power":"250 W","CUDA Capability":"7.0","Source URL":"https://www.nvidia.com/en-sg/data-center/v100/","Source Tier":"1","Notes":"PCIe variant."},
        {"Name":"Tesla V100 SXM2 32GB","Series":"V-Series","Architecture":"Volta","Launch Year":"2017","CUDA Cores":"5120","Memory Size":"32 GB","Memory Type":"HBM2","Memory Bandwidth":"900 GB/s","FP32":"15.7 TFLOPS","PCIe Generation":"3.0","Form Factor":"SXM2","Board Power":"300 W","CUDA Capability":"7.0","Source URL":"https://www.nvidia.com/en-sg/data-center/v100/","Source Tier":"1","Notes":"NVLink variant."},
        {"Name":"Tesla V100S PCIe 32GB","Series":"V-Series","Architecture":"Volta","Launch Year":"2019","CUDA Cores":"5120","Memory Size":"32 GB","Memory Type":"HBM2","Memory Bandwidth":"1134 GB/s","FP32":"16.4 TFLOPS","PCIe Generation":"3.0","PCIe Lanes":"16","Form Factor":"PCIe","Board Power":"250 W","CUDA Capability":"7.0","Source URL":"https://www.nvidia.com/en-sg/data-center/v100/","Source Tier":"1","Notes":"Higher-clocked PCIe variant."},
        {"Name":"T4","Series":"T-Series","Architecture":"Turing","Launch Year":"2018","CUDA Cores":"2560","Memory Size":"16 GB","Memory Type":"GDDR6","Memory Bandwidth":"300 GB/s","FP32":"8.1 TFLOPS","PCIe Generation":"3.0","PCIe Lanes":"16","Form Factor":"Low-profile PCIe","Board Power":"70 W","CUDA Capability":"7.5","Source URL":"https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/tesla-t4/t4-tensor-core-datasheet-951643.pdf","Source Tier":"1","Notes":"Passive low-profile accelerator."},
        {"Name":"A2","Series":"A-Series","Architecture":"Ampere","Launch Year":"2021","Memory Size":"16 GB","Memory Type":"GDDR6","Memory Bandwidth":"200 GB/s","FP32":"4.5 TFLOPS","PCIe Generation":"4.0","PCIe Lanes":"8","Form Factor":"Low-profile PCIe","Board Power":"40-60 W","CUDA Capability":"8.6","Source URL":"https://www.nvidia.com/en-us/data-center/products/a2/","Source Tier":"1","Notes":"Configurable TDP."},
        {"Name":"A10","Series":"A-Series","Architecture":"Ampere","Launch Year":"2021","Memory Size":"24 GB","Memory Type":"GDDR6","Memory Bandwidth":"600 GB/s","FP32":"31.2 TFLOPS","PCIe Generation":"4.0","PCIe Lanes":"16","Form Factor":"Single-slot FHFL PCIe","Board Power":"150 W","CUDA Capability":"8.6","Source URL":"https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a10/pdf/a10-datasheet.pdf","Source Tier":"1","Notes":"Graphics, video, inference and vGPU."},
        {"Name":"A16","Series":"A-Series","Architecture":"Ampere","Launch Year":"2021","Memory Size":"64 GB","Memory Type":"GDDR6","Memory Bandwidth":"4x 200 GB/s","PCIe Generation":"4.0","PCIe Lanes":"16","Form Factor":"Dual-slot FHFL PCIe","Board Power":"250 W","CUDA Capability":"8.6","Source URL":"https://www.nvidia.com/en-au/data-center/products/a16-gpu/","Source Tier":"1","Notes":"Four GPUs per board; 16 GB per GPU."},
        {"Name":"A30","Series":"A-Series","Architecture":"Ampere","Launch Year":"2021","Memory Size":"24 GB","Memory Type":"HBM2","Memory Bandwidth":"933 GB/s","FP32":"10.3 TFLOPS","PCIe Generation":"4.0","PCIe Lanes":"16","Form Factor":"Dual-slot FHFL PCIe","Board Power":"165 W","CUDA Capability":"8.0","Source URL":"https://www.nvidia.com/en-us/data-center/products/a30-gpu/","Source Tier":"1","Notes":"MIG and NVLink supported."},
        {"Name":"A40","Series":"A-Series","Architecture":"Ampere","Launch Year":"2020","CUDA Cores":"10752","Memory Size":"48 GB","Memory Type":"GDDR6 ECC","Memory Bandwidth":"696 GB/s","FP32":"37.4 TFLOPS","PCIe Generation":"4.0","PCIe Lanes":"16","Form Factor":"Dual-slot FHFL PCIe","Board Power":"300 W","CUDA Capability":"8.6","Source URL":"https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a40/proviz-print-nvidia-a40-datasheet-us-nvidia-1469711-r8-web.pdf","Source Tier":"1","Notes":"Visualization and compute accelerator."},
        {"Name":"A100 80GB PCIe","Series":"A-Series","Architecture":"Ampere","Launch Year":"2021","Memory Size":"80 GB","Memory Type":"HBM2e","Memory Bandwidth":"1935 GB/s","FP32":"19.5 TFLOPS","PCIe Generation":"4.0","PCIe Lanes":"16","Form Factor":"PCIe","Board Power":"300 W","CUDA Capability":"8.0","Source URL":"https://www.nvidia.com/en-us/data-center/a100/","Source Tier":"1","Notes":"Dual-slot air-cooled or single-slot liquid-cooled."},
        {"Name":"A100 80GB SXM","Series":"A-Series","Architecture":"Ampere","Launch Year":"2021","Memory Size":"80 GB","Memory Type":"HBM2e","Memory Bandwidth":"2039 GB/s","FP32":"19.5 TFLOPS","PCIe Generation":"4.0","Form Factor":"SXM4","Board Power":"400 W","CUDA Capability":"8.0","Source URL":"https://www.nvidia.com/en-us/data-center/a100/","Source Tier":"1","Notes":"HGX/DGX SXM variant."},
        {"Name":"L4","Series":"L-Series","Architecture":"Ada Lovelace","Launch Year":"2023","CUDA Cores":"7424","Memory Size":"24 GB","Memory Type":"GDDR6","Memory Bandwidth":"300 GB/s","FP32":"30.3 TFLOPS","PCIe Generation":"4.0","PCIe Lanes":"16","Form Factor":"Low-profile PCIe","Board Power":"72 W","CUDA Capability":"8.9","Source URL":"https://images.nvidia.com/aem-dam/Solutions/geforce/ada/nvidia-ada-gpu-architecture.pdf","Source Tier":"1","Notes":"Single-slot universal inference and video accelerator."},
        {"Name":"L40S","Series":"L-Series","Architecture":"Ada Lovelace","Launch Year":"2023","CUDA Cores":"18176","Memory Size":"48 GB","Memory Type":"GDDR6 ECC","Memory Bandwidth":"864 GB/s","FP32":"91.6 TFLOPS","PCIe Generation":"4.0","PCIe Lanes":"16","Form Factor":"Dual-slot PCIe","Board Power":"350 W","CUDA Capability":"8.9","Source URL":"https://www.nvidia.com/en-us/data-center/l40s/","Source Tier":"1","Notes":"Passive universal data-center GPU."},
        {"Name":"H100 SXM","Series":"H-Series","Architecture":"Hopper","Launch Year":"2022","Memory Size":"80 GB","Memory Type":"HBM3","Memory Bandwidth":"3.35 TB/s","FP32":"67 TFLOPS","PCIe Generation":"5.0","Form Factor":"SXM5","Board Power":"700 W","CUDA Capability":"9.0","Source URL":"https://www.nvidia.com/en-us/data-center/h100/","Source Tier":"1","Notes":"Maximum configurable TDP."},
        {"Name":"H100 NVL","Series":"H-Series","Architecture":"Hopper","Launch Year":"2023","Memory Size":"94 GB","Memory Type":"HBM3","Memory Bandwidth":"3.9 TB/s","FP32":"60 TFLOPS","PCIe Generation":"5.0","PCIe Lanes":"16","Form Factor":"Dual-slot PCIe","Board Power":"350-400 W","CUDA Capability":"9.0","Source URL":"https://www.nvidia.com/en-us/data-center/h100/","Source Tier":"1","Notes":"NVLink-bridged PCIe variant."},
        {"Name":"H200 SXM","Series":"H-Series","Architecture":"Hopper","Launch Year":"2024","Memory Size":"141 GB","Memory Type":"HBM3e","Memory Bandwidth":"4.8 TB/s","FP32":"67 TFLOPS","PCIe Generation":"5.0","Form Factor":"SXM5","Board Power":"700 W","CUDA Capability":"9.0","Source URL":"https://www.nvidia.com/en-us/data-center/h200/","Source Tier":"1","Notes":"Maximum configurable TDP."},
        {"Name":"H200 NVL","Series":"H-Series","Architecture":"Hopper","Launch Year":"2024","Memory Size":"141 GB","Memory Type":"HBM3e","Memory Bandwidth":"4.8 TB/s","FP32":"60 TFLOPS","PCIe Generation":"5.0","PCIe Lanes":"16","Form Factor":"Dual-slot PCIe","Board Power":"600 W","CUDA Capability":"9.0","Source URL":"https://www.nvidia.com/en-us/data-center/h200/","Source Tier":"1","Notes":"Maximum configurable TDP."},
        {"Name":"B200 SXM","Series":"B-Series","Architecture":"Blackwell","Launch Year":"2024","Memory Size":"180 GB","Memory Type":"HBM3e","Memory Bandwidth":"8 TB/s","Form Factor":"SXM","Board Power":"1000 W","CUDA Capability":"10.0","Source URL":"https://docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory-h100-h200-b200/latest/components.html","Source Tier":"1","Notes":"Per-GPU HGX B200 specification; power configurable up to 1 kW."},
        {"Name":"B300 SXM","Series":"B-Series","Architecture":"Blackwell Ultra","Launch Year":"2025","Memory Size":"288 GB","Memory Type":"HBM3e","Memory Bandwidth":"8 TB/s","Form Factor":"SXM","CUDA Capability":"10.3","Source URL":"https://docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory/latest/components.html","Source Tier":"1","Notes":"Per-GPU HGX B300 memory specification."},
        {"Name":"RTX PRO 6000 Blackwell Server Edition","Series":"RTX PRO Server","Architecture":"Blackwell","Launch Year":"2025","CUDA Cores":"24064","Memory Size":"96 GB","Memory Type":"GDDR7 ECC","Memory Bandwidth":"1792 GB/s","PCIe Generation":"5.0","PCIe Lanes":"16","Form Factor":"Dual-slot PCIe","Board Power":"600 W","CUDA Capability":"12.0","Source URL":"https://www.nvidia.com/content/dam/en-zz/Solutions/design-visualization/quadro-product-literature/NVIDIA-RTX-Blackwell-PRO-GPU-Architecture-v1.0.pdf","Source Tier":"1","Notes":"Server-edition multi-workload GPU."},
    ]


def cpu_rows() -> list[dict]:
    return [
        {"Name":"Grace CPU C1","Series":"Grace CPU","Segment":"datacenter","Architecture":"Armv9-A Neoverse V2","Launch Year":"2023","CPU Cores":"72","Threads":"72","L2 Cache":"72 MB","L3 Cache":"117 MB","Memory Size":"Up to 480 GB","Memory Type":"LPDDR5X ECC","Memory Bandwidth":"Up to 500 GB/s","PCIe Generation":"5.0","PCIe Lanes":"64","Socket Count":"","TDP":"","Source URL":"https://www.nvidia.com/en-eu/data-center/grace-cpu-superchip/","Source Tier":"1","Notes":"Single Grace CPU. NVIDIA's 2025 technical blog reports 114 MB L3 while the performance guide reports 117 MB; retained the formal guide value."},
        {"Name":"Grace CPU Superchip","Series":"Grace CPU","Segment":"datacenter","Architecture":"Armv9-A Neoverse V2","Launch Year":"2023","CPU Cores":"144","Threads":"144","L2 Cache":"144 MB","L3 Cache":"234 MB","Memory Size":"Up to 960 GB","Memory Type":"LPDDR5X ECC","Memory Bandwidth":"Up to 1 TB/s","PCIe Generation":"5.0","PCIe Lanes":"128","Socket Count":"","TDP":"500 W","Source URL":"https://docs.nvidia.com/grace-performance-tuning-guide.pdf","Source Tier":"1","Notes":"Two Grace CPU dies connected by 900 GB/s NVLink-C2C in one module; TDP includes memory. Current NVIDIA material creates a 234 MB versus 228 MB L3 conflict."},
        {"Name":"GH200 Grace Hopper Superchip","Series":"Grace Hopper","Segment":"datacenter","Architecture":"Armv9-A Neoverse V2 + Hopper","Launch Year":"2023","CPU Cores":"72","Threads":"72","L2 Cache":"72 MB","L3 Cache":"117 MB","Memory Size":"Up to 480 GB CPU + 144 GB HBM3e","Memory Type":"LPDDR5X ECC + HBM3/HBM3e","Memory Bandwidth":"Up to 500 GB/s CPU + 4.9 TB/s GPU","PCIe Generation":"5.0","PCIe Lanes":"64","Socket Count":"","TDP":"","Source URL":"https://docs.nvidia.com/grace-performance-tuning-guide.pdf","Source Tier":"1","Notes":"CPU+GPU superchip. NVIDIA's 2025 Grace blog reports 114 MB L3 while the formal performance guide reports 117 MB."},
        {"Name":"GB10 Grace Blackwell Superchip","Series":"Grace Blackwell","Segment":"workstation","Architecture":"Arm + Blackwell","Launch Year":"2025","CPU Cores":"20","Threads":"20","Memory Size":"128 GB unified","Memory Type":"LPDDR5X","Memory Bandwidth":"273 GB/s","PCIe Generation":"","PCIe Lanes":"","Socket Count":"","TDP":"140 W","Source URL":"https://www.nvidia.com/en-us/products/workstations/dgx-spark/","Source Tier":"1","Notes":"DGX Spark superchip; TDP covers CPU and GPU."},
    ]


def master_rows(geforce: list[dict], dc: list[dict], cpus: list[dict]) -> list[dict]:
    out = []
    for row in geforce:
        out.append({
            "vendor":"NVIDIA", "kind":"gpu", "gpu_family_id":re.sub(r"[^a-z0-9]+", "-", row["Series"].lower()).strip("-"),
            "family":"GeForce", "series":row["Series"], "segment":"desktop", "arch":row["Architecture"],
            "model":row["Name"].removeprefix("GeForce "), "model_full":row["Name"], "cores":row["CUDA Cores"],
            "base_clock":(row["Base Clock"] + (" GHz" if row["Base Clock"] and "GTX 16" not in row["Series"] else " MHz" if row["Base Clock"] else "")),
            "boost_clock":(row["Boost Clock"] + (" GHz" if row["Boost Clock"] and "GTX 16" not in row["Series"] else " MHz" if row["Boost Clock"] else "")),
            "tdp":row["Board Power"], "pcie_gen":row["PCIe Generation"], "mem_type":row["Memory Type"],
            "mem_speed":row["Memory Bandwidth"], "mem_max_capacity":row["Memory Size"], "launch_date":"",
            "source_url":row["Source URL"], "source_tier":"1", "confidence":"high", "notes":row["Notes"],
        })
    for row in dc:
        out.append({
            "vendor":"NVIDIA", "kind":"gpu", "gpu_family_id":"nvidia-" + row["Series"].lower().replace(" ", "-"),
            "family":"Data Center GPU", "series":row["Series"], "segment":"datacenter", "arch":row["Architecture"],
            "model":row["Name"], "model_full":"NVIDIA " + row["Name"], "cores":row.get("CUDA Cores", ""),
            "tdp":row.get("Board Power", ""), "pcie_gen":row.get("PCIe Generation", ""), "pcie_lanes":row.get("PCIe Lanes", ""),
            "mem_type":row.get("Memory Type", ""), "mem_speed":row.get("Memory Bandwidth", ""), "mem_max_capacity":row.get("Memory Size", ""),
            "ecc":"yes" if "ECC" in row.get("Memory Type", "") else "",
            "launch_date":"", "source_url":row["Source URL"], "source_tier":"1", "confidence":"high", "notes":row["Notes"],
        })
    for row in cpus:
        out.append({
            "vendor":"NVIDIA", "kind":"cpu", "family":row["Series"], "series":row["Series"], "segment":row["Segment"],
            "arch":row["Architecture"], "model":row["Name"], "model_full":"NVIDIA " + row["Name"], "cores":row["CPU Cores"],
            "threads":row["Threads"], "l2_cache":row.get("L2 Cache", ""), "l3_cache":row.get("L3 Cache", ""), "tdp":row.get("TDP", ""),
            "socket_count":row.get("Socket Count", ""), "pcie_gen":row.get("PCIe Generation", ""), "pcie_lanes":row.get("PCIe Lanes", ""),
            "mem_type":row.get("Memory Type", ""), "mem_speed":row.get("Memory Bandwidth", ""), "mem_max_capacity":row.get("Memory Size", ""),
            "ecc":"yes" if "ECC" in row.get("Memory Type", "") else "", "launch_date":"", "source_url":row["Source URL"], "source_tier":"1", "confidence":"medium" if "conflict" in row["Notes"] else "high", "notes":row["Notes"],
        })
    return [{key: row.get(key, "") for key in MASTER_HEADER} for row in out]


def main() -> int:
    geforce = pull_geforce()
    dc = datacenter_rows()
    cpus = cpu_rows()

    geforce_fields = ["Name","Series","Segment","Architecture","Family Year","CUDA Cores","Base Clock","Boost Clock","Memory Configuration","Memory Size","Memory Type","Memory Interface Width","Memory Bandwidth","PCIe Generation","CUDA Capability","Board Power","Length","Width","Slot","Source URL","Source Tier","Notes"]
    dc_fields = ["Name","Series","Architecture","Launch Year","CUDA Cores","Memory Size","Memory Type","Memory Bandwidth","FP32","PCIe Generation","PCIe Lanes","Form Factor","Board Power","CUDA Capability","Source URL","Source Tier","Notes"]
    cpu_fields = ["Name","Series","Segment","Architecture","Launch Year","CPU Cores","Threads","L2 Cache","L3 Cache","Memory Size","Memory Type","Memory Bandwidth","PCIe Generation","PCIe Lanes","Socket Count","TDP","Source URL","Source Tier","Notes"]

    write_csv(OUT / "NVIDIA GeForce GPUs.csv", geforce, geforce_fields)
    write_csv(OUT / "NVIDIA Data Center GPUs.csv", dc, dc_fields)
    write_csv(OUT / "NVIDIA CPUs.csv", cpus, cpu_fields)
    write_csv(MASTER, master_rows(geforce, dc, cpus), MASTER_HEADER)

    print(f"GeForce: {len(geforce)}")
    print(f"Data center GPUs: {len(dc)}")
    print(f"CPUs/superchips: {len(cpus)}")
    print(f"Master rows: {len(geforce) + len(dc) + len(cpus)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
