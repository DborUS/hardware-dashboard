#!/usr/bin/env python3
"""Audit imported MLPerf Inference v6.0 snapshots against an official local summary.

Download summary_results.json separately from:
    https://github.com/mlcommons/inference_results_v6.0/blob/main/summary_results.json
Then run:
    python tools/audit-mlperf-snapshots.py PATH/TO/summary_results.json

This command only reads the supplied source and the two imported snapshots. It does
not fetch data or change files. Exit status 0 means both cohorts match; 1 reports
all found mismatches.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "js" / "data"
SUMMARY_URL = "https://github.com/mlcommons/inference_results_v6.0/blob/main/summary_results.json"
SUT_BASE_URL = "https://github.com/mlcommons/inference_results_v6.0/tree/main/"
VERSION = "MLPerf Inference v6.0"
WORKLOAD = "llama2-70b-99"
COHORTS = {
    "Server": (
        "enterprise-benchmark-mlperf-v6-server-sample.json",
        "MLPerf_Inference_v6.0_llama2-70b-99_Server_Tokens_per_second",
    ),
    "Offline": (
        "enterprise-benchmark-mlperf-v6-offline-sample.json",
        "MLPerf_Inference_v6.0_llama2-70b-99_Offline_Tokens_per_second",
    ),
}
# Import only the reviewed identity policy. Field-by-field comparisons below
# remain independent of the importer output builder.
_spec = importlib.util.spec_from_file_location("mlperf_import", Path(__file__).with_name("import-mlperf-benchmarks.py"))
_importer = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_importer)
CATALOG_MATCHES = _importer.CATALOG_MATCHES
CATALOG = _importer.catalog_accelerators(json.loads((DATA / "benchmark-catalog.json").read_text(encoding="utf-8")))

SOURCE_FIELD_MAP = {
    "resultId": "ID",
    "submitter": "Submitter",
    "systemName": "System",
    "platform": "Platform",
    "sourceAcceleratorName": "Accelerator",
    "score": "Performance_Result",
    "sourceLocation": "Location",
    "acceleratorCount": "Total Accelerators",
    "nodes": "Nodes",
    "units": "Performance_Units",
    "division": "Category",
    "availability": "Availability",
    "workload": "UsedModel",
    "scenario": "Scenario",
    "precision": "weight_data_types",
    "hostProcessor": "Processor",
    "operatingSystem": "operating_system",
    "software": "Software",
    "errors": "errors",
    "inferred": "inferred",
    "compliance": "compliance",
}
INTEGER_FIELDS = {"acceleratorCount", "nodes", "errors", "inferred"}


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def source_key(row):
    return row.get("ID"), row.get("Scenario"), row.get("UsedModel")


def is_eligible(row, scenario):
    """Apply the published eight-accelerator comparison key to source rows."""
    return (
        row.get("version") == "v6.0"
        and row.get("Suite") == "datacenter"
        and row.get("Category") == "closed"
        and row.get("Availability") == "available"
        and row.get("UsedModel") == WORKLOAD
        and row.get("Scenario") == scenario
        and row.get("compliance") == "closed"
        and type(row.get("Nodes")) is int and row["Nodes"] == 1
        and type(row.get("a#")) is int and row["a#"] == 8
        and type(row.get("Total Accelerators")) is int and row["Total Accelerators"] == 8
        and type(row.get("errors")) is int and row["errors"] == 0
        and type(row.get("inferred")) is int and row["inferred"] == 0
        and row.get("Performance_Units") == "Tokens/s"
        and _importer.match_accelerator(row.get("Accelerator"), CATALOG) is not None
    )


def expected_sut_url(location):
    if not isinstance(location, str):
        return None
    parts = location.removeprefix("./").split("/")
    if len(parts) < 8 or parts[0] != "closed" or parts[2] != "results":
        return None
    return SUT_BASE_URL + "/".join(parts[:4])


def compare(actual, expected, label, errors, integer=False):
    if actual != expected or (integer and type(actual) is not int):
        errors.append(f"{label}: snapshot {actual!r}; official summary {expected!r}")


def audit_cohort(scenario, filename, metric, source_rows, errors):
    path = DATA / filename
    try:
        snapshot = load_json(path)
    except (OSError, ValueError) as exc:
        errors.append(f"{filename}: cannot read snapshot: {exc}")
        return
    if not isinstance(snapshot, dict) or not isinstance(snapshot.get("meta"), dict) or not isinstance(snapshot.get("results"), list):
        errors.append(f"{filename}: expected an object with meta and results")
        return
    meta, rows = snapshot["meta"], snapshot["results"]
    expected_meta = {
        "sourceUrl": SUMMARY_URL,
        "metric": metric,
        "benchmarkVersion": VERSION,
        "suite": "datacenter",
        "division": "closed",
        "availability": "available",
        "workload": WORKLOAD,
        "scenario": scenario,
        "acceleratorCount": 8,
        "units": "Tokens/s",
    }
    for field, value in expected_meta.items():
        compare(meta.get(field), value, f"{filename} meta.{field}", errors,
                integer=(field == "acceleratorCount"))
    eligible = [row for row in source_rows if is_eligible(row, scenario)]
    if not eligible:
        errors.append(f"{scenario}: official source has no eligible results")
    if len(rows) != len(eligible):
        errors.append(f"{filename}: expected all {len(eligible)} eligible source rows; found {len(rows)}")
    source_by_key = {}
    for row in source_rows:
        if row.get("Scenario") == scenario:
            source_by_key.setdefault(source_key(row), []).append(row)
    expected_keys = {source_key(row) for row in eligible}
    actual_keys = set()
    for index, row in enumerate(rows, start=1):
        label = f"{filename} result {index}"
        if not isinstance(row, dict):
            errors.append(f"{label}: expected an object")
            continue
        key = row.get("resultId"), row.get("scenario"), row.get("workload")
        if key in actual_keys:
            errors.append(f"{label}: duplicate result ID/scenario/workload {key!r}")
        actual_keys.add(key)
        matches = source_by_key.get(key, [])
        if len(matches) != 1:
            errors.append(f"{label}: found {len(matches)} official rows for {key!r}; expected one")
            continue
        source = matches[0]
        if not is_eligible(source, scenario):
            errors.append(f"{label}: official row {key!r} fails the required comparison key")
        for field, source_field in SOURCE_FIELD_MAP.items():
            compare(row.get(field), source.get(source_field), f"{label}.{field}", errors,
                    integer=(field in INTEGER_FIELDS))
        compare(row.get("metric"), metric, f"{label}.metric", errors)
        compare(row.get("benchmarkVersion"), VERSION, f"{label}.benchmarkVersion", errors)
        compare(row.get("summaryUrl"), SUMMARY_URL, f"{label}.summaryUrl", errors)
        compare(row.get("retrievedDate"), meta.get("snapshotDate"), f"{label}.retrievedDate", errors)
        compare(row.get("sourceUrl"), expected_sut_url(source.get("Location")),
                f"{label}.sourceUrl", errors)
        expected_model = _importer.match_accelerator(source.get("Accelerator"), CATALOG)
        if expected_model:
            for field, value in zip(("model", "vendor", "productLine"), expected_model):
                compare(row.get(field), value, f"{label}.{field}", errors)
        score = row.get("score")
        if type(score) not in (int, float) or not math.isfinite(score) or score <= 0:
            errors.append(f"{label}.score: expected a positive finite number")
    for key in sorted(expected_keys - actual_keys, key=repr):
        errors.append(f"{filename}: missing eligible official result {key!r}")
    for key in sorted(actual_keys - expected_keys, key=repr):
        errors.append(f"{filename}: imported result is outside the official cohort {key!r}")
    if not any(filename in error or scenario in error for error in errors):
        print(f"PASS {scenario}: {len(rows)} imported results match the official summary")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("summary", type=Path, help="downloaded official summary_results.json")
    args = parser.parse_args()
    try:
        source_rows = load_json(args.summary)
    except (OSError, ValueError) as exc:
        print(f"FAIL: cannot read official summary: {exc}", file=sys.stderr)
        return 1
    if not isinstance(source_rows, list) or any(not isinstance(row, dict) for row in source_rows):
        print("FAIL: official summary must be a JSON array of result objects", file=sys.stderr)
        return 1
    errors = []
    for scenario, (filename, metric) in COHORTS.items():
        try:
            audit_cohort(scenario, filename, metric, source_rows, errors)
            captured_hash = load_json(DATA / filename)["meta"].get("sourceSha256")
            compare(captured_hash, hashlib.sha256(args.summary.read_bytes()).hexdigest(),
                    f"{filename} meta.sourceSha256", errors)
        except (OSError, ValueError, KeyError, TypeError) as exc:
            errors.append(f"{filename}: invalid source or snapshot: {exc}")
    if errors:
        for error in errors:
            print(f"FAIL {error}", file=sys.stderr)
        print(f"Audit failed: {len(errors)} mismatch(es)", file=sys.stderr)
        return 1
    total = sum(len(load_json(DATA / filename)["results"]) for filename, _ in COHORTS.values())
    print(f"MLPerf snapshot audit passed: {total} rows across {len(COHORTS)} separate scenario cohorts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
