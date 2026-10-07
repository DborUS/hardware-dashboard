#!/usr/bin/env python3
"""Validate or refresh ChipIndex's published benchmark snapshots.

Default is read-only status. --refresh SOURCE replays retained source captures.
--refresh SOURCE --allow-network explicitly captures current supported sources.
No command publishes the site. Successful imports must pass catalog/data checks;
failed imports restore prior snapshots, evidence, catalog, source registry and product index.

Examples:
    python tools/refresh-benchmarks.py --check
    python tools/refresh-benchmarks.py --refresh all --allow-network
    python tools/refresh-benchmarks.py --refresh mlperf
"""
from __future__ import annotations

import argparse
from copy import deepcopy
from contextlib import contextmanager
import os
from hashlib import sha256
from datetime import date
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "js" / "data"
REGISTRY = DATA / "benchmark-sources.json"

# Editorial descriptions belong here; coverage and dates are derived below.
SOURCES = (
    {
        "id": "spec", "name": "SPEC CPU", "status": "available",
        "label": "Imported snapshot",
        "description": "Published server CPU results for integer and floating-point throughput.",
        "workloads": ["Server throughput", "Scientific computing"],
        "homepage": "https://www.spec.org/cpu2017/results/",
        "accessMethod": "Official result indexes and full system disclosures; the importer scans available rate-result archives and retains a disclosed selection of exact catalog matches.",
        "limitations": [
            "Scores describe a complete submitted system, including its CPU count, memory, compiler and operating system.",
            "CPU2017 and CPU2026 use separate scales. Compare the same suite, metric, base result and CPU count.",
            "Archive indexes are scanned for catalog matches. CPU2017 retains the latest two reports per model and CPU count plus previously verified reports; this is not every system submission. CPU2026 test builds stay separate."
        ],
        "rightsNote": "Retain the full result link, exact metric and system context; follow SPEC's fair-use and reporting rules.",
        "references": [
            {"label": "CPU2017 results", "url": "https://www.spec.org/cpu2017/results/"},
            {"label": "CPU2026 results", "url": "https://www.spec.org/cpu2026/results/"},
            {"label": "Result-use rules", "url": "https://www.spec.org/products/fairuse/"}
        ],
        "refresh": {
            "mode": "reviewed-online-import",
            "command": "python tools/refresh-benchmarks.py --refresh spec --allow-network",
            "note": "Replays retained source captures. Add --allow-network for live archive discovery and report retrieval; full report capture is an explicit importer option."
        }
    },
    {
        "id": "mlperf", "name": "MLPerf Inference", "status": "available",
        "label": "Imported snapshot",
        "description": "AI inference throughput from submitted datacenter systems running Llama 2 70B.",
        "workloads": ["Interactive AI serving", "Batch AI inference"],
        "homepage": "https://github.com/mlcommons/inference_results_v6.0",
        "accessMethod": "Official MLCommons summary JSON retained with its revision, capture timestamp and content hash. The importer accounts for every source row and keeps the selected comparison cohort.",
        "limitations": [
            "Results describe a whole system with eight accelerators, not one accelerator.",
            "Server measures throughput under response-time constraints; Offline measures batch throughput. Keep their charts separate.",
            "The selection is v6.0, Closed, Available, Llama 2 70B 99%, one node. Software, host CPUs and precision can differ.",
            "Hardware identities that cannot be resolved to one catalog product remain in the exclusion review."
        ],
        "rightsNote": "Preserve submission context and follow MLCommons result messaging and trademark guidance.",
        "references": [
            {"label": "Official summary JSON", "url": "https://github.com/mlcommons/inference_results_v6.0/blob/main/summary_results.json"},
            {"label": "Result messaging guidance", "url": "https://github.com/mlcommons/policies/blob/master/MLPerf_Results_Messaging_Guidelines.adoc"}
        ],
        "refresh": {
            "mode": "reviewed-online-import",
            "command": "python tools/refresh-benchmarks.py --refresh mlperf --allow-network",
            "note": "Captures the official v6.0 summary and rebuilds both scenarios with validation. Offline replay retains the original capture date."
        }
    },
    {
        "id": "blender", "name": "Blender Open Data", "status": "available",
        "label": "Imported snapshot",
        "description": "CPU and GPU rendering speed in Blender's Cycles renderer, summarized by device model.",
        "workloads": ["CPU rendering", "GPU rendering"],
        "homepage": "https://opendata.blender.org/",
        "accessMethod": "Official grouped JSON export retained with a content hash. Blender also publishes downloadable daily raw snapshots under CC0.",
        "limitations": [
            "These are Blender 5.2.0 device medians with at least five submissions, across mixed operating systems and compute backends.",
            "The score is rendering samples per minute; it does not measure gaming, general responsiveness or AI performance.",
            "Only unique exact catalog models are matched. Unspecified memory variants and unmatched laptop GPUs stay excluded."
        ],
        "rightsNote": "Blender's downloadable raw dataset is CC0. Retain source links and aggregation context.",
        "references": [
            {"label": "How the benchmark works", "url": "https://opendata.blender.org/about/"},
            {"label": "Download public data", "url": "https://opendata.blender.org/download/"}
        ],
        "refresh": {
            "mode": "reviewed-online-import",
            "command": "python tools/refresh-benchmarks.py --refresh blender --allow-network",
            "note": "Captures Blender's official grouped export, records its hash and capture time, and rebuilds exact catalog matches. Offline replay retains that capture date."
        }
    },
    {
        "id": "openbenchmarking", "name": "Phoronix / OpenBenchmarking", "status": "planned",
        "label": "Not connected",
        "description": "Application-specific tests such as compilation, compression, databases and scientific computing.",
        "workloads": ["Compilation", "Compression", "Databases", "Scientific computing"],
        "homepage": "https://openbenchmarking.org/",
        "accessMethod": "Phoronix Test Suite provides saved result exports, including JSON and CSV. No ChipIndex importer is connected.",
        "limitations": [
            "Phoronix Test Suite runs many independent test profiles; there is no single Phoronix score.",
            "An import needs the exact test profile version, options, units, score direction and system configuration.",
            "Public result access and an open-source test runner do not establish permission to republish every hosted result."
        ],
        "rightsNote": "Review hosted-result terms and the chosen export's permitted use before importing.",
        "references": [
            {"label": "Test profiles", "url": "https://openbenchmarking.org/tests"},
            {"label": "Result export documentation", "url": "https://github.com/phoronix-test-suite/phoronix-test-suite/blob/master/documentation/phoronix-test-suite.md"},
            {"label": "Site terms", "url": "https://openbenchmarking.org/legal"}
        ],
        "refresh": {"mode": "not-connected", "command": None, "note": "No imported results. Export selection and a compatible result adapter are required."}
    },
    {
        "id": "passmark", "name": "PassMark", "status": "license-required",
        "label": "Not connected",
        "description": "Broad CPU and graphics comparisons from PerformanceTest submissions.",
        "workloads": ["General CPU performance", "Single-thread performance", "Graphics"],
        "homepage": "https://www.cpubenchmark.net/",
        "accessMethod": "PassMark offers licensed CPU and GPU CSV data downloads. A licensed feed and a ChipIndex adapter are not connected.",
        "limitations": [
            "The published data-licensing terms restrict redistribution and reproduction of PassMark's benchmark charts.",
            "Permission for this site's intended public display must be established with PassMark before a feed is imported.",
            "A public score page or PerformanceTest upload API key is not a licensed data feed."
        ],
        "rightsNote": "Data access and permitted public display depend on the licensing agreement.",
        "references": [
            {"label": "Data licensing and restrictions", "url": "https://www.passmark.com/services/market-analysis.php"},
            {"label": "How scores are collected", "url": "https://www.cpubenchmark.net/graph_notes.html"}
        ],
        "refresh": {"mode": "license-required", "command": None, "note": "No imported results. The standard subscription excludes public ranking sites. No import is planned without a specific written grant."}
    }
)

DATASETS = (
    ("spec", "spec2017-int", "enterprise-benchmark-sample.json", "Integer throughput · CPU2017"),
    ("spec", "spec2017-fp", "enterprise-benchmark-fp-sample.json", "Floating-point throughput · CPU2017"),
    ("spec", "spec2026-int", "enterprise-benchmark-2026-int-sample.json", "Integer throughput · CPU2026"),
    ("spec", "spec2026-fp", "enterprise-benchmark-2026-fp-sample.json", "Floating-point throughput · CPU2026"),
    ("mlperf", "mlperf-server", "enterprise-benchmark-mlperf-v6-server-sample.json", "AI serving · Llama 2 70B Server"),
    ("mlperf", "mlperf-offline", "enterprise-benchmark-mlperf-v6-offline-sample.json", "Batch inference · Llama 2 70B Offline"),
    ("blender", "blender-rendering", "benchmark-sample.json", "CPU and GPU rendering · Blender 5.2.0")
)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def formatted(value):
    return json.dumps(value, indent=4, ensure_ascii=True) + "\n"


def write_checked(path, value):
    body = formatted(value)
    path.write_text(body, encoding="utf-8", newline="")
    if path.read_text(encoding="utf-8") != body:
        raise OSError(f"Write verification failed: {path}")


def product_keys(rows):
    return {(row["vendor"].casefold(), row["model"].casefold()) for row in rows}


def build_registry():
    sources = deepcopy(SOURCES)
    by_id = {source["id"]: source for source in sources}
    keys = {source["id"]: set() for source in sources}
    for source in sources:
        source.update(datasets=[], recordCount=0, productCount=0,
                      lastRetrievedDate=None, oldestSnapshotDate=None)
    for source_id, dataset_id, filename, label in DATASETS:
        payload = read_json(DATA / filename)
        meta, rows = payload["meta"], payload["results"]
        captured = meta["snapshotDate"]
        date.fromisoformat(captured)
        source = by_id[source_id]
        source["datasets"].append({
            "id": dataset_id, "filename": filename,
            "path": "js/data/" + filename, "label": label,
            "metric": meta["metric"], "recordCount": len(rows),
            "productCount": len(product_keys(rows)), "snapshotDate": captured,
            "sourceUrl": meta["sourceUrl"], "scope": meta["scope"],
            "sha256": sha256((DATA / filename).read_bytes()).hexdigest(),
            "byteSize": (DATA / filename).stat().st_size,
            "benchmarkVersions": sorted({row.get("benchmarkVersion", row.get("blenderVersion", "")) for row in rows})
        })
        source["recordCount"] += len(rows)
        keys[source_id].update(product_keys(rows))
    for source in sources:
        dates = [dataset["snapshotDate"] for dataset in source["datasets"]]
        source["lastRetrievedDate"] = max(dates) if dates else None
        source["oldestSnapshotDate"] = min(dates) if dates else None
        source["productCount"] = len(keys[source["id"]])
    catalog = read_json(DATA / "benchmark-catalog.json")
    return {
        "schemaVersion": 1,
        "mode": "reviewed-snapshots",
        "dateMeaning": "Dates identify source snapshot capture, not this page visit or registry rebuild. Different tests may have different capture dates.",
        "coverageMeaning": "Counts describe results imported into ChipIndex. They do not measure the size or complete coverage of an external benchmark archive.",
        "totalRecords": sum(source["recordCount"] for source in sources),
        "productsWithResults": catalog["meta"]["productsInCurrentSnapshots"],
        "catalogProducts": catalog["meta"]["uniqueCatalogProducts"],
        "sources": sources
    }


def run_tool(name, *args):
    subprocess.run([sys.executable, str(ROOT / "tools" / name), *map(str, args)],
                   cwd=ROOT, check=True, timeout=3600)


def check_registry():
    expected = formatted(build_registry())
    if not REGISTRY.exists() or REGISTRY.read_text(encoding="utf-8") != expected:
        raise ValueError("Source registry differs from the current snapshots. Run --write-registry.")
    print("Benchmark source registry PASS: coverage and capture dates match saved snapshots.")


IMPORTERS = {"spec": "import-spec-benchmarks.py", "mlperf": "import-mlperf-benchmarks.py", "blender": "import-blender-benchmarks.py"}
LOCK = ROOT / "tmp" / "benchmark-refresh.lock"


@contextmanager
def refresh_lock():
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    try:
        descriptor = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError as exc:
        raise ValueError("Another benchmark refresh holds tmp/benchmark-refresh.lock. If an earlier run was interrupted, confirm it stopped before removing that lock.") from exc
    try:
        with os.fdopen(descriptor, "w") as handle:
            handle.write(str(os.getpid()))
        yield
    finally:
        LOCK.unlink(missing_ok=True)


def managed_outputs():
    paths = {DATA / item[2] for item in DATASETS} | {DATA / "benchmark-catalog.json", DATA / "benchmark-table-index.js", REGISTRY}
    for pattern in ("spec-*.json", "blender-*.json"):
        paths.update((ROOT / "tools").glob(pattern))
    paths.add(ROOT / "tools/spec-source-cache/manifest.json")
    for folder in (ROOT / "tools/fixtures/mlperf-v6.0",):
        if folder.exists():
            paths.update(path for path in folder.rglob("*") if path.is_file())
    return paths


def refresh(source_id, allow_network=False):
    """One local transaction, including provenance; nothing is published."""
    with refresh_lock():
        before = {path: path.read_bytes() if path.exists() else None for path in managed_outputs()}
        try:
            for source in IMPORTERS if source_id == "all" else (source_id,):
                run_tool(IMPORTERS[source], *(["--fetch"] if allow_network else []))
            run_tool("build-benchmark-catalog.py", "--write")
            run_tool("check-benchmarks.py")
            write_checked(REGISTRY, build_registry())
            check_registry()
            run_tool("build-product-benchmark-index.py")
            run_tool("build-product-benchmark-index.py", "--check")
        except BaseException:
            for path in managed_outputs() | set(before):
                path.resolve().relative_to(ROOT.resolve())  # Never restore outside this workspace.
                content = before.get(path)
                if content is None:
                    path.unlink(missing_ok=True)
                else:
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_bytes(content)
                    if path.read_bytes() != content:
                        raise OSError(f"Could not restore adapter output: {path}")
            print("Refresh failed; previous published files and source evidence restored.", file=sys.stderr)
            raise
    print("Refresh validated locally. Review coverage changes and run browser checks before publication.")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--check", action="store_true", help="offline snapshot, retained export, catalog, registry and product index validation")
    action.add_argument("--write-registry", action="store_true", help="regenerate source metadata from saved snapshots")
    action.add_argument("--refresh", choices=("spec", "mlperf", "blender", "all"), help="replay a supported reviewed source importer, rebuild the catalog and product index, validate and update registry")
    action.add_argument("--audit-mlperf", type=Path, metavar="SUMMARY_JSON", help="read-only audit against a locally supplied official summary")
    parser.add_argument("--allow-network", action="store_true", help="capture live official sources instead of replaying retained inputs")
    parser.add_argument("--json", action="store_true", help="print source status as JSON (status mode only)")
    args = parser.parse_args(argv)
    if args.allow_network and not args.refresh:
        parser.error("--allow-network requires --refresh")
    if args.json and (args.check or args.write_registry or args.refresh or args.audit_mlperf):
        parser.error("--json is only used with the default status command")
    if args.check:
        run_tool("check-benchmarks.py")
        for importer in IMPORTERS.values():
            run_tool(importer, "--check")
        run_tool("build-benchmark-catalog.py", "--check")
        check_registry()
        run_tool("build-product-benchmark-index.py", "--check")
    elif args.write_registry:
        run_tool("check-benchmarks.py")
        write_checked(REGISTRY, build_registry())
        check_registry()
    elif args.refresh:
        refresh(args.refresh, args.allow_network)
    elif args.audit_mlperf:
        run_tool("audit-mlperf-snapshots.py", args.audit_mlperf.resolve())
    else:
        registry = build_registry()
        if args.json:
            print(formatted(registry), end="")
        else:
            print("ChipIndex benchmark sources: reviewed snapshots, no automatic live feed\n")
            for source in registry["sources"]:
                captured = source["lastRetrievedDate"] or "not imported"
                print(f"{source['name']}: {source['label']} | {source['recordCount']} records | "
                      f"{source['productCount']} models | {captured}")
                print("  " + source["refresh"]["note"])
            print("\nUse --help for supported import and validation commands.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise SystemExit(f"Benchmark refresh failed: {exc}") from exc
