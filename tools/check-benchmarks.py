#!/usr/bin/env python3
"""Validate the published benchmark snapshots and report their visible coverage.

This is an offline, read-only gate. It never fetches or rewrites source data.
Run from any directory: python tools/check-benchmarks.py
"""

from __future__ import annotations

import json
import math
import re
import runpy
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
from urllib.parse import parse_qs, parse_qsl, urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "js" / "data"
# SPEC confirms that v1.1.9's changes did not affect benchmark performance and
# that its reportable runs remain comparable to published CPU2017 results:
# https://spec.org/pressreleases/20221201-academic-pricing/
CPU2017_COMPATIBLE_VERSIONS = tuple("SPEC CPU2017 v" + version for version in ("1.0.0", "1.0.1", "1.0.2", "1.0.5", "1.1.0", "1.1.5", "1.1.7", "1.1.8", "1.1.9"))
CPU2026_REVIEWED_BUILDS = tuple("SPEC CPU2026 v" + version for version in ("0.902.0", "0.903.0", "1.0.0", "1.0.1"))

SNAPSHOTS = (
    {"filename": "enterprise-benchmark-sample.json", "kind": "spec",
     "suite": "CPU2017", "metric": "SPECrate2017_int_base",
     "resultPath": "/cpu2017/results/",
     "compatibleVersions": CPU2017_COMPATIBLE_VERSIONS},
    {"filename": "enterprise-benchmark-fp-sample.json", "kind": "spec",
     "suite": "CPU2017", "metric": "SPECrate2017_fp_base",
     "resultPath": "/cpu2017/results/",
     "compatibleVersions": CPU2017_COMPATIBLE_VERSIONS},
    {"filename": "enterprise-benchmark-2026-int-sample.json", "kind": "spec",
     "suite": "CPU2026", "metric": "SPECrate2026_int_base",
     "resultPath": "/cpu2026/results/", "reviewedBuilds": CPU2026_REVIEWED_BUILDS,
     "requiredMeta": ("sourceLimitations",)},
    {"filename": "enterprise-benchmark-2026-fp-sample.json", "kind": "spec",
     "suite": "CPU2026", "metric": "SPECrate2026_fp_base",
     "resultPath": "/cpu2026/results/", "reviewedBuilds": CPU2026_REVIEWED_BUILDS,
     "requiredMeta": ("sourceLimitations",)},
    {"filename": "enterprise-benchmark-mlperf-v6-server-sample.json",
     "kind": "mlperf", "suite": "MLPerf Inference v6.0", "scenario": "Server",
     "units": "Tokens/s",
     "metric": "MLPerf_Inference_v6.0_llama2-70b-99_Server_Tokens_per_second"},
    {"filename": "enterprise-benchmark-mlperf-v6-offline-sample.json",
     "kind": "mlperf", "suite": "MLPerf Inference v6.0", "scenario": "Offline",
     "units": "Tokens/s",
     "metric": "MLPerf_Inference_v6.0_llama2-70b-99_Offline_Tokens_per_second"},
    {"filename": "benchmark-sample.json", "kind": "blender",
     "suite": "Blender 5.2", "metric": "median samples per minute"},
)
SPEC_FIELDS = (
    "model", "vendor", "productLine", "metric", "benchmarkVersion",
    "sourceUrl", "sourceCpuName", "systemName", "memory",
    "operatingSystem", "compiler", "testSponsor", "testedBy", "testDate",
    "publishedDate",
)
BLENDER_FIELDS = (
    "model", "vendor", "productLine", "deviceType", "blenderVersion",
    "computeType", "sourceDeviceName", "sourceUrl",
)
MLPERF_FIELDS = (
    "model", "vendor", "productLine", "metric", "benchmarkVersion",
    "resultId", "submitter", "systemName", "platform", "sourceAcceleratorName",
    "units", "division", "availability", "workload", "scenario",
    "sourceUrl", "summaryUrl", "sourceLocation", "retrievedDate",
)
MLPERF_SHARED_COHORT = {
    "benchmarkVersion": "MLPerf Inference v6.0",
    "division": "closed", "availability": "available",
    "workload": "llama2-70b-99", "acceleratorCount": 8, "nodes": 1,
}
MLPERF_REPO = "/mlcommons/inference_results_v6.0/"
MLPERF_SUMMARY = MLPERF_REPO + "blob/main/summary_results.json"
CATALOG_CPU_TABS = {
    "amd/epyc", "amd/ryzen", "intel/xeon", "intel/client",
    "nvidia/cpu", "ampere/processors",
}
CATALOG_SPEC_FIELDS = {"coreLabel", "clockLabel", "powerLabel"}

CATALOG_TAB_ROWS = {
    "amd/epyc": 350, "amd/ryzen": 736, "amd/gpu": 303,
    "intel/xeon": 553, "intel/client": 340, "intel/graphics": 35,
    "nvidia/datacenter": 20, "nvidia/geforce": 47, "nvidia/cpu": 4,
    "ampere/processors": 26,
}
# SPEC's published name for this exact catalog SKU includes an M suffix in the
# family name. Keep the exception explicit so unrelated SKUs cannot fuzzy-match.
SOURCE_CPU_ALIASES = json.loads((ROOT / "tools/spec-model-aliases.json").read_text(encoding="utf-8"))["aliases"]


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def catalog_models():
    """Read exact display names from the same product datasets the site uses."""
    amd_cpus = [item for group in load_json(DATA / "amd-cpu-specs.json").values() for item in group]
    amd_gpus = [model for group in load_json(DATA / "amd-gpu-data.json")
                if "gpuSpecs" in group for model in group["gpuSpecs"]["models"]]
    intel_xeon = [item for group in load_json(DATA / "intel-xeon-specs.json").values() for item in group]
    intel_client = [item for group in load_json(DATA / "intel-client-specs.json").values() for item in group]
    intel_graphics = [item for group in load_json(DATA / "intel-graphics-specs.json").values() for item in group]
    nvidia = load_json(DATA / "nvidia-data.json")
    ampere = load_json(DATA / "ampere-data.json")
    names = lambda rows, key="n": {item[key] for item in rows}
    client_core_counts = defaultdict(set)
    for item in amd_cpus:
        if item.get("_family", "").startswith("EPYC"):
            continue
        try:
            cores = int(item.get("c", ""))
        except (TypeError, ValueError):
            continue
        if cores > 0:
            client_core_counts[("AMD", item["n"])].add(cores)
    for item in intel_client:
        try:
            p_cores = int(item.get("pc") or 0)
            e_cores = int(item.get("ec") or 0)
            cores = p_cores + e_cores or int(item.get("c") or 0)
        except (TypeError, ValueError):
            continue
        if cores > 0:
            client_core_counts[("Intel", item["n"])].add(cores)
    # Re-read the retained official AMD / Intel fields so valid-looking segment
    # labels cannot drift away from the exact model's sourced form factors.
    blender_importer = runpy.run_path(str(ROOT / "tools/import-blender-benchmarks.py"))
    segment_sources = blender_importer["client_segment_index"]()
    client_device_segments = {}
    for vendor, records in (("AMD", amd_cpus), ("Intel", intel_client)):
        for item in records:
            if vendor == "AMD" and item.get("_family", "").startswith("EPYC"):
                continue
            client_device_segments[(vendor, item["n"])] = blender_importer["exact_device_segments"](
                {"vendor": vendor.upper(), "model": item["n"]}, segment_sources)
    return {
        "clientCoreCounts": client_core_counts,
        "clientDeviceSegments": client_device_segments,
        "enterprise": {
            "AMD": names(item for item in amd_cpus if item.get("_family", "").startswith("EPYC")),
            "Intel": names(intel_xeon),
            "Ampere": names(ampere["processors"]),
            "NVIDIA": names(nvidia["cpu"]),
        },
        "client": {
            "AMD": names(item for item in amd_cpus if not item.get("_family", "").startswith("EPYC")),
            "Intel": names(intel_client),
        },
        "graphics": {
            "AMD": names(amd_gpus, "name"),
            "Intel": names(intel_graphics),
            "NVIDIA": names(nvidia["datacenter"] + nvidia["geforce"]),
        },
        "accelerator": {
            "AMD": names((model for group in load_json(DATA / "amd-gpu-data.json")
                          if group.get("segment") == "datacenter" and "gpuSpecs" in group
                          for model in group["gpuSpecs"]["models"]), "name"),
            "NVIDIA": names(nvidia["datacenter"]),
        },
    }


def check_text(record, key, where, errors):
    value = record.get(key)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{where}: {key} must be nonempty text")
        return ""
    return value.strip()


def check_positive_number(record, key, where, errors, integer=False):
    value = record.get(key)
    valid_type = type(value) is int if integer else type(value) in (int, float)
    try:
        valid_value = valid_type and math.isfinite(value) and value > 0
    except OverflowError:
        valid_value = False
    if not valid_value:
        errors.append(f"{where}: {key} must be a positive {'integer' if integer else 'number'}")
        return None
    return value


def check_date(record, key, where, errors):
    value = check_text(record, key, where, errors)
    if not value:
        return None
    try:
        parsed = date.fromisoformat(value)
        if parsed.isoformat() != value:
            raise ValueError("noncanonical date")
        return parsed
    except ValueError:
        errors.append(f"{where}: {key} must be a real YYYY-MM-DD date")
        return None


def check_url(record, key, where, errors, hostname=None):
    value = check_text(record, key, where, errors)
    if not value:
        return None
    try:
        parsed = urlparse(value)
        actual_host = parsed.hostname
    except ValueError:
        parsed, actual_host = None, None
    if parsed is None or parsed.scheme != "https" or not actual_host or parsed.username or parsed.password:
        errors.append(f"{where}: {key} must be an HTTPS URL")
        return None
    if hostname and parsed.hostname != hostname:
        errors.append(f"{where}: {key} must link to {hostname}")
        return None
    return parsed


def validate_spec(row, where, spec, snapshot, catalog, source_urls, errors):
    for key in SPEC_FIELDS:
        check_text(row, key, where, errors)
    check_positive_number(row, "score", where, errors)
    cpu_count = check_positive_number(row, "cpuCount", where, errors, integer=True)
    enabled_cores = check_positive_number(row, "enabledCores", where, errors, integer=True)
    if cpu_count and enabled_cores and enabled_cores % cpu_count:
        errors.append(f"{where}: enabledCores must divide evenly across tested CPUs")
    if row.get("metric") != spec["metric"]:
        errors.append(f"{where}: metric does not match {spec['metric']}")
    model, vendor, source_cpu = row.get("model"), row.get("vendor"), row.get("sourceCpuName")
    expected_cpu = None
    alias = next((entry for entry in SOURCE_CPU_ALIASES if entry["vendor"] == vendor and entry["model"] == model and spec["suite"].lower() in entry["suites"]), None)
    if isinstance(model, str) and isinstance(vendor, str):
        expected_cpu = alias["sourceCpuName"] if alias else model
    if alias:
        if alias.get("systemNameMustContain") and alias["systemNameMustContain"].casefold() not in str(row.get("systemName", "")).casefold():
            errors.append(f"{where}: source alias system constraint failed")
        if alias.get("coresPerChip") and (not cpu_count or enabled_cores != cpu_count * alias["coresPerChip"]):
            errors.append(f"{where}: source alias CPU core count constraint failed")
        if alias.get("testedComponent") and row.get("testedComponent") != alias["testedComponent"]:
            errors.append(f"{where}: source alias must identify the tested CPU component")
    if isinstance(expected_cpu, str) and isinstance(source_cpu, str) and expected_cpu.casefold() not in source_cpu.casefold():
        errors.append(f"{where}: sourceCpuName does not identify the catalog model or approved alias")
    version = row.get("benchmarkVersion")
    if isinstance(version, str):
        if spec["suite"] not in version:
            errors.append(f"{where}: benchmarkVersion does not match {spec['suite']}")
        if spec.get("reviewedBuilds") and version not in spec["reviewedBuilds"]:
            errors.append(f"{where}: benchmarkVersion is not a reviewed build; keep new test builds isolated before import")
        if spec.get("compatibleVersions") and version not in spec["compatibleVersions"]:
            errors.append(f"{where}: benchmarkVersion is outside the reviewed {spec['suite']} compatibility allowance")
    try:
        datetime.strptime(row.get("testDate", ""), "%b-%Y")
    except (ValueError, TypeError):
        errors.append(f"{where}: testDate must use Mon-YYYY")
    retrieved = check_date(row, "retrievedDate", where, errors)
    if snapshot and retrieved and retrieved > snapshot:
        errors.append(f"{where}: retrievedDate is later than snapshotDate")
    digest = row.get("sourceDocumentSha256", "")
    if not isinstance(digest, str) or not re.fullmatch(r"[a-f0-9]{64}", digest):
        errors.append(f"{where}: valid source document SHA256 is required")
    check_positive_number(row, "baseCopies", where, errors, integer=True)
    published = check_date(row, "publishedDate", where, errors)
    if snapshot and published and published > snapshot:
        errors.append(f"{where}: publishedDate is later than snapshotDate")
    parsed = check_url(row, "sourceUrl", where, errors, "www.spec.org")
    if parsed and not parsed.path.startswith(spec["resultPath"]):
        errors.append(f"{where}: sourceUrl must be a SPEC {spec['suite']} result page")
    check_catalog_match(row, "enterprise", where, catalog, errors)
    add_source_identity(row, where, source_urls, errors)


def validate_client_device_segments(row, where, catalog, errors):
    segments = row.get("deviceSegments")
    if not isinstance(segments, list) or any(
            not isinstance(value, str) or value not in ("desktop", "laptop")
            for value in segments):
        errors.append(f"{where}: deviceSegments must be an array of desktop/laptop values")
        return
    if len(set(segments)) != len(segments):
        errors.append(f"{where}: deviceSegments must not contain duplicates")
    source = row.get("deviceSegmentSource")
    if not isinstance(source, dict):
        errors.append(f"{where}: deviceSegmentSource must document the official form factor or its unavailability")
        return
    if not segments:
        if source.get("status") != "unavailable":
            errors.append(f"{where}: empty deviceSegments requires explicit unavailable status")
        check_text(source, "reason", f"{where}.deviceSegmentSource", errors)
    else:
        for key in ("field", "value", "sourceFile", "sourceProductName"):
            check_text(source, key, f"{where}.deviceSegmentSource", errors)
    vendor, model = row.get("vendor"), row.get("model")
    if not isinstance(vendor, str) or not isinstance(model, str):
        return  # The normal catalog identity validator reports this separately.
    expected = catalog["clientDeviceSegments"].get((vendor, model))
    if expected is not None:
        expected_segments, expected_source = expected
        if segments != expected_segments:
            errors.append(f"{where}: deviceSegments disagree with the exact official model's form factors")
        if segments and source != expected_source:
            errors.append(f"{where}: deviceSegmentSource does not match the retained official source record")


def validate_blender(row, where, snapshot, meta, catalog, source_urls, errors):
    for key in BLENDER_FIELDS:
        check_text(row, key, where, errors)
    check_positive_number(row, "score", where, errors)
    samples = check_positive_number(row, "samples", where, errors, integer=True)
    minimum = meta.get("minimumSamples")
    if samples is not None and type(minimum) is int and minimum > 0 and samples < minimum:
        errors.append(f"{where}: samples is below minimumSamples")
    device = row.get("deviceType")
    if device not in ("CPU", "GPU"):
        errors.append(f"{where}: deviceType must be CPU or GPU")
    category = "client" if device == "CPU" else "graphics"
    check_catalog_match(row, category, where, catalog, errors)
    if device == "CPU":
        validate_client_device_segments(row, where, catalog, errors)
        core_count = check_positive_number(row, "coreCount", where, errors, integer=True)
        expected = catalog["clientCoreCounts"].get((row.get("vendor"), row.get("model")), set())
        if core_count and expected != {core_count}:
            errors.append(f"{where}: coreCount does not uniquely match the exact dashboard product specification")
    elif "coreCount" in row:
        errors.append(f"{where}: graphics results must not have a CPU coreCount")
    parsed = check_url(row, "sourceUrl", where, errors, "opendata.blender.org")
    if parsed:
        query = parse_qs(parsed.query)
        if query.get("blender_version") != [row.get("blenderVersion")]:
            errors.append(f"{where}: sourceUrl Blender version does not match result")
        if query.get("device_name") != [row.get("sourceDeviceName")]:
            errors.append(f"{where}: sourceUrl device name does not match result")
    if snapshot is None:
        errors.append(f"{where}: parent snapshotDate is invalid")
    add_source_identity(row, where, source_urls, errors)



def validate_mlperf(row, where, spec, snapshot, meta, catalog, source_urls, errors):
    for key in MLPERF_FIELDS:
        check_text(row, key, where, errors)
    check_positive_number(row, "score", where, errors)
    check_positive_number(row, "acceleratorCount", where, errors, integer=True)
    check_positive_number(row, "nodes", where, errors, integer=True)
    for key in ("errors", "inferred"):
        if type(row.get(key)) is not int or row[key] != 0:
            errors.append(f"{where}: {key} must be the official zero-error, non-inferred filter value")
    if row.get("compliance") != "closed":
        errors.append(f"{where}: compliance must be 'closed'")
    expected = {**MLPERF_SHARED_COHORT, "metric": spec["metric"],
                "scenario": spec["scenario"], "units": spec["units"]}
    for key, value in expected.items():
        if row.get(key) != value:
            errors.append(f"{where}: {key} must be {value!r}")
    check_catalog_match(row, "accelerator", where, catalog, errors)
    result_id = row.get("resultId")
    if isinstance(result_id, str) and not re.fullmatch(r"6\.0-\d{4}", result_id):
        errors.append(f"{where}: resultId must use the official 6.0-NNNN form")
    retrieved = check_date(row, "retrievedDate", where, errors)
    if snapshot and retrieved and retrieved > snapshot:
        errors.append(f"{where}: retrievedDate is later than snapshotDate")
    source = check_url(row, "sourceUrl", where, errors, "github.com")
    expected_prefix = MLPERF_REPO + "tree/main/closed/"
    if source and not source.path.startswith(expected_prefix):
        errors.append(f"{where}: sourceUrl must point to an official v6.0 closed submission")
    summary = check_url(row, "summaryUrl", where, errors, "github.com")
    if summary and summary.path != MLPERF_SUMMARY:
        errors.append(f"{where}: summaryUrl must point to the official v6.0 summary")
    if isinstance(row.get("summaryUrl"), str) and row["summaryUrl"] != meta.get("sourceUrl"):
        errors.append(f"{where}: summaryUrl must match the snapshot sourceUrl")
    location = row.get("sourceLocation")
    if source and isinstance(location, str):
        submission = source.path.removeprefix(MLPERF_REPO + "tree/main/")
        expected = ("./" + submission + "/" + MLPERF_SHARED_COHORT["workload"]
                    + "/" + spec["scenario"] + "/performance/")
        if not location.startswith(expected):
            errors.append(f"{where}: sourceLocation must identify the same SUT and {spec['scenario']} workload")
    if all(isinstance(row.get(key), str) for key in ("resultId", "workload", "scenario")):
        identity = ("mlperf", row["resultId"], row["workload"], row["scenario"])
        if identity in source_urls:
            errors.append(f"{where}: resultId/workload/scenario duplicates {source_urls[identity]}")
        else:
            source_urls[identity] = where

def check_catalog_match(row, category, where, catalog, errors):
    vendor, model = row.get("vendor"), row.get("model")
    if not isinstance(vendor, str) or not isinstance(model, str):
        return
    vendor_names = catalog[category].get(vendor)
    if vendor_names is None:
        errors.append(f"{where}: {vendor!r} is not a catalog vendor for {category}")
    elif model not in vendor_names:
        errors.append(f"{where}: {vendor} {model!r} is not an exact {category} catalog model")


def add_source_identity(row, where, source_urls, errors):
    # Public result/query URL is the stable identity in today's snapshots; array
    # positions and display names are not stable source record identifiers.
    url = row.get("sourceUrl")
    if not isinstance(url, str) or not url.strip():
        return
    try:
        parsed = urlparse(url)
        identity = (parsed.hostname, parsed.path.rstrip("/"),
                    tuple(sorted(parse_qsl(parsed.query, keep_blank_values=True))))
    except ValueError:
        return  # check_url already reports the malformed address
    if identity in source_urls:
        errors.append(f"{where}: sourceUrl duplicates {source_urls[identity]}")
    else:
        source_urls[identity] = where


def validate_snapshot(spec, catalog, source_urls, errors):
    filename, metric = spec["filename"], spec["metric"]
    path = DATA / filename
    try:
        payload = load_json(path)
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"{filename}: cannot read JSON ({exc})")
        return [], None
    if not isinstance(payload, dict):
        errors.append(f"{filename}: root must be an object")
        return [], None
    meta, rows = payload.get("meta"), payload.get("results")
    if not isinstance(meta, dict):
        errors.append(f"{filename}: meta must be an object")
        meta = {}
    if not isinstance(rows, list):
        errors.append(f"{filename}: results must be an array")
        return [], None
    snapshot = check_date(meta, "snapshotDate", f"{filename}.meta", errors)
    for key in ("source", "scope"):
        check_text(meta, key, f"{filename}.meta", errors)
    if meta.get("metric") != metric:
        errors.append(f"{filename}.meta: metric must be {metric}")
    kind = spec["kind"]
    host = "www.spec.org" if kind == "spec" else "github.com" if kind == "mlperf" else "opendata.blender.org"
    meta_source = check_url(meta, "sourceUrl", f"{filename}.meta", errors, host)
    if kind == "spec":
        if meta_source and not meta_source.path.startswith(spec["resultPath"]):
            errors.append(f"{filename}.meta: sourceUrl must point to {spec['suite']} results")
        for key in ("selectionBasis", "trademarkNotice", *spec.get("requiredMeta", ())):
            check_text(meta, key, f"{filename}.meta", errors)
        check_url(meta, "fairUseUrl", f"{filename}.meta", errors, "www.spec.org")
    elif kind == "mlperf":
        for key in ("metricLabel", "scope", "selectionBasis", "sourceLimitations",
                    "sourceStatusFields", "trademarkNotice"):
            check_text(meta, key, f"{filename}.meta", errors)
        check_url(meta, "messagingGuidelinesUrl", f"{filename}.meta", errors, "github.com")
        if meta_source and meta_source.path != MLPERF_SUMMARY:
            errors.append(f"{filename}.meta: sourceUrl must point to the official v6.0 summary")
        expected = {**MLPERF_SHARED_COHORT, "scenario": spec["scenario"],
                    "units": spec["units"]}
        for key, value in expected.items():
            if key != "nodes" and meta.get(key) != value:
                errors.append(f"{filename}.meta: {key} must be {value!r}")
        if meta.get("suite") != "datacenter" or meta.get("qualityTarget") != "99%":
            errors.append(f"{filename}.meta: suite/qualityTarget must be datacenter/99%")
    else:
        check_positive_number(meta, "minimumSamples", f"{filename}.meta", errors, integer=True)
        check_text(meta, "coreCountSource", f"{filename}.meta", errors)
        check_text(meta, "deviceSegmentSource", f"{filename}.meta", errors)
        query = parse_qs(urlparse(str(meta.get("sourceUrl", ""))).query)
        version = query.get("blender_version", [None])[0]
        if not version:
            errors.append(f"{filename}.meta: sourceUrl must include blender_version")
    if not rows:
        errors.append(f"{filename}: results is empty")
    if kind == "spec" and not {1, 2}.issubset({row.get("cpuCount") for row in rows if isinstance(row, dict)}):
        errors.append(f"{filename}: both one- and two-CPU disclosures are required")
    for index, row in enumerate(rows, 1):
        where = f"{filename}.results[{index}]"
        if not isinstance(row, dict):
            errors.append(f"{where}: result must be an object")
            continue
        if kind == "spec":
            validate_spec(row, where, spec, snapshot, catalog, source_urls, errors)
        elif kind == "mlperf":
            validate_mlperf(row, where, spec, snapshot, meta, catalog, source_urls, errors)
        else:
            validate_blender(row, where, snapshot, meta, catalog, source_urls, errors)
            if row.get("blenderVersion") != version:
                errors.append(f"{where}: blenderVersion does not match snapshot source query")
    return rows, snapshot


def catalog_tabs_for_result(metric, row):
    if metric.startswith("SPECrate"):
        return {"amd/epyc", "intel/xeon", "nvidia/cpu", "ampere/processors"}
    if metric.startswith("MLPerf_Inference"):
        return {"amd/gpu", "nvidia/datacenter"}
    if row.get("deviceType") == "CPU":
        return {"amd/ryzen", "intel/client"}
    return {"amd/gpu", "intel/graphics", "nvidia/datacenter", "nvidia/geforce"}


def validate_catalog_index(coverage, errors):
    filename = "benchmark-catalog.json"
    try:
        payload = load_json(DATA / filename)
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"{filename}: cannot read JSON ({exc})")
        return
    if not isinstance(payload, dict):
        errors.append(f"{filename}: root must be an object")
        return
    meta, products = payload.get("meta"), payload.get("products")
    if not isinstance(meta, dict) or not isinstance(products, list):
        errors.append(f"{filename}: meta must be an object and products an array")
        return
    if len(products) != 2393 or meta.get("uniqueCatalogProducts") != 2393:
        errors.append(f"{filename}: expected exactly 2,393 unique catalog products")
    if meta.get("displayedPlacements") != 2414 or meta.get("dashboardTabRows") != CATALOG_TAB_ROWS:
        errors.append(f"{filename}: expected exactly 2,414 displayed rows with the reviewed tab counts")
    ids, tab_products = set(), Counter()
    placements = 0
    shared = 0
    actual_metrics = defaultdict(set)
    for index, product in enumerate(products, 1):
        where = f"{filename}.products[{index}]"
        if not isinstance(product, dict):
            errors.append(f"{where}: product must be an object")
            continue
        catalog_id = check_text(product, "id", where, errors)
        if catalog_id in ids:
            errors.append(f"{where}: duplicate catalog ID {catalog_id}")
        ids.add(catalog_id)
        for field in ("vendor", "model", "sourceRecordRef"):
            check_text(product, field, where, errors)
        if product.get("catalogEligibility") != "displayed-spec-row" or product.get("commercialReleaseStatus") != "unverified":
            errors.append(f"{where}: displayed eligibility and unverified release status are required")
        tabs, locations, metrics = (product.get("dashboardTabs"),
                                    product.get("placements"), product.get("snapshotMetrics"))
        if (not isinstance(tabs, list) or not tabs
                or any(not isinstance(tab, str) or tab not in CATALOG_TAB_ROWS for tab in tabs)
                or len(tabs) != len(set(tabs))):
            errors.append(f"{where}: dashboardTabs must contain unique known tabs")
            continue
        specs = product.get("productSpecs")
        if set(tabs) & CATALOG_CPU_TABS:
            if not isinstance(specs, dict) or not specs or set(specs) - CATALOG_SPEC_FIELDS:
                errors.append(f"{where}: CPU productSpecs must be a nonempty object of reviewed labels")
            elif any(not isinstance(value, str) or not value.strip()
                     for value in specs.values()):
                errors.append(f"{where}: productSpecs labels must be nonblank text")
        elif "productSpecs" in product:
            errors.append(f"{where}: non-CPU product cannot carry CPU productSpecs")
        if not isinstance(locations, list) or not locations or any(not isinstance(place, dict) or place.get("dashboardTab") not in tabs for place in locations):
            errors.append(f"{where}: placements must belong to dashboardTabs")
            continue
        if set(tabs) != {place["dashboardTab"] for place in locations}:
            errors.append(f"{where}: every dashboard tab needs a placement")
        if (not isinstance(metrics, list)
                or any(not isinstance(metric, str) or metric not in coverage for metric in metrics)
                or len(metrics) != len(set(metrics))):
            errors.append(f"{where}: snapshotMetrics contains an unknown or repeated metric")
            continue
        placements += len(locations)
        shared += len(tabs) > 1
        tab_products.update(tabs)
        actual_metrics[catalog_id] = set(metrics)
    if placements != 2414 or shared != 6:
        errors.append(f"{filename}: expected 2,414 placements and six cross-tab products; found {placements} and {shared}")
    expected_tab_products = meta.get("dashboardTabProducts")
    if expected_tab_products != dict(tab_products) or sum(tab_products.values()) != 2399:
        errors.append(f"{filename}: per-tab product counts are inconsistent with 2,399 tab identities")
    type_counts = Counter()
    for product in products:
        if not isinstance(product, dict) or not isinstance(product.get("dashboardTabs"), list):
            continue
        tabs = set(tab for tab in product["dashboardTabs"] if isinstance(tab, str))
        segment = product.get("sourceSegment")
        if tabs & {"amd/epyc", "intel/xeon", "nvidia/cpu", "ampere/processors"}:
            type_counts["enterprise"] += 1
        if tabs & {"amd/ryzen", "intel/client"}:
            type_counts["client"] += 1
        if "nvidia/datacenter" in tabs or ("amd/gpu" in tabs and segment == "datacenter"):
            type_counts["accelerator"] += 1
        if tabs & {"intel/graphics", "nvidia/geforce"} or ("amd/gpu" in tabs and segment != "datacenter"):
            type_counts["graphics"] += 1
    if dict(type_counts) != {"enterprise": 918, "accelerator": 53, "client": 1076, "graphics": 352}:
        errors.append(f"{filename}: product-type denominators changed: {dict(type_counts)}")

    expected_metrics = defaultdict(set)
    valid_products = [product for product in products if isinstance(product, dict)]
    for metric, (rows, _) in coverage.items():
        for index, row in enumerate(rows, 1):
            if not isinstance(row, dict):
                continue  # validate_snapshot has already reported this row
            tabs = catalog_tabs_for_result(metric, row)
            candidates = [product for product in valid_products
                          if product.get("vendor") == str(row.get("vendor", "")).upper()
                          and product.get("model") == row.get("model")
                          and isinstance(product.get("dashboardTabs"), list)
                          and any(tab in tabs for tab in product["dashboardTabs"])
                          and (not metric.startswith("MLPerf_Inference")
                               or product.get("sourceSegment") == "datacenter")]
            if len(candidates) != 1:
                errors.append(f"{filename}: {metric} result {index} resolves to {len(candidates)} catalog identities")
                continue
            expected_metrics[candidates[0].get("id", "")].add(metric)
    if {key: value for key, value in actual_metrics.items() if value} != dict(expected_metrics):
        errors.append(f"{filename}: per-product snapshotMetrics differ from the validated result snapshots")
    if meta.get("productsInCurrentSnapshots") != len(expected_metrics):
        errors.append(f"{filename}: scored-product count differs from validated snapshot identities")


def main():
    errors = []
    try:
        catalog = catalog_models()
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print(f"Benchmark validation FAILED: cannot read catalog ({exc})")
        return 1
    source_urls = {}
    coverage = {}
    for spec in SNAPSHOTS:
        rows, snapshot = validate_snapshot(spec, catalog, source_urls, errors)
        coverage[spec["metric"]] = (rows, snapshot)
    validate_catalog_index(coverage, errors)
    print("Benchmark snapshot coverage")
    suite_models = defaultdict(dict)
    for spec in SNAPSHOTS:
        metric = spec["metric"]
        rows, snapshot = coverage[metric]
        named_rows = [row for row in rows if isinstance(row, dict)
                      and isinstance(row.get("vendor"), str) and isinstance(row.get("model"), str)]
        groups = Counter(("GPU" if spec["kind"] == "mlperf" else str(row.get("deviceType", "CPU")), row["vendor"])
                         for row in named_rows)
        detail = ", ".join(f"{vendor} {device}: {count}" for (device, vendor), count in sorted(groups.items()))
        models = {(row["vendor"], row["model"]) for row in named_rows}
        suite_models[spec["suite"]][metric] = models
        print(f"  {metric}: {len(rows)} records / {len(models)} models; {detail}; snapshot {snapshot or 'invalid'}")
    all_models = set().union(*(models for metrics in suite_models.values() for models in metrics.values()))
    print(f"  Unique scored catalog models: {len(all_models)}")
    suite_versions = defaultdict(set)
    for spec in SNAPSHOTS:
        if spec["kind"] == "spec":
            suite_versions[spec["suite"]].update(
                row.get("benchmarkVersion") for row in coverage[spec["metric"]][0]
                if isinstance(row, dict) and isinstance(row.get("benchmarkVersion"), str))
    for suite, versions in suite_versions.items():
        if suite == "CPU2017" and len(versions) > 1:
            print("  CPU2017 version allowance: " + ", ".join(sorted(versions))
                  + " (SPEC confirms v1.1.9 remains comparable)")
    for suite, metrics in suite_models.items():
        if len(metrics) == 2:
            (first_name, first), (second_name, second) = metrics.items()
            first_label = ("Server" if "_Server_" in first_name else
                           "integer" if "_int_" in first_name else first_name)
            second_label = ("Offline" if "_Offline_" in second_name else
                            "floating-point" if "_fp_" in second_name else second_name)
            print(f"  {suite}: {len(first & second)} models with both metrics; "
                  f"{len(first - second)} {first_label} only; "
                  f"{len(second - first)} {second_label} only")
    if errors:
        print(f"Benchmark validation FAILED ({len(errors)} issue{'s' if len(errors) != 1 else ''})")
        for error in errors:
            print(f"  - {error}")
        return 1
    print(f"Benchmark validation PASS: {len(source_urls)} unique source record identities with HTTPS links; all results match catalog names")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
