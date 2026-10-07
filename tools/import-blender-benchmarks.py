#!/usr/bin/env python3
"""Fetch or replay the exact-model Blender Open Data 5.2.0 benchmark snapshot.

The retained export is the official query grouped by device name with all
operating systems and compute types selected. Blender reports device labels,
not ChipIndex product IDs. This importer accepts only an exact, unique catalog
model after removing vendor prefixes and a few documented CPU/Arc descriptors.
It never assigns an unspecified memory variant or laptop GPU to a desktop SKU.

Run: python tools/import-blender-benchmarks.py --fetch  # fetch + validate + retain
     python tools/import-blender-benchmarks.py          # offline retained replay
     python tools/import-blender-benchmarks.py --check  # verify retained outputs
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from hashlib import sha256
import json
import math
import os
from pathlib import Path
import re
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, unquote, urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "js" / "data"
EXPORT = ROOT / "tools" / "blender-5.2.0-grouped-export.json"
OUTPUT = DATA / "benchmark-sample.json"
REVIEW = ROOT / "tools" / "blender-import-review.json"
MANIFEST = EXPORT.with_suffix(".manifest.json")
MAX_EXPORT_BYTES = 10 * 1024 * 1024
MINIMUM_EXPORT_ROWS = 100
EXPORT_HEADER = ["Device Name", "Median Score", "Number of Benchmarks"]
VERSION = "5.2.0"
MINIMUM_SAMPLES = 5
QUERY = "https://opendata.blender.org/benchmarks/query/?group_by=device_name&blender_version=5.2.0"
API_QUERY = "https://opendata.blender.org/benchmarks/query/?blender_version=5.2.0&group_by=device_name&response_type=datatables"
DATA_POLICY_URL = "https://opendata.blender.org/about/"
DATA_LICENSE_URL = "https://opendata.blender.org/download/"
CLIENT_TABS = {"amd/ryzen", "intel/client"}
GRAPHICS_TABS = {"amd/gpu", "intel/graphics", "nvidia/geforce", "nvidia/datacenter"}
VENDORS = {"AMD": "AMD", "INTEL": "Intel", "NVIDIA": "NVIDIA"}
CORE_SUFFIX = re.compile(r" (?P<count>\d+|dual|quad|six|eight|twelve)-cores?(?: processor)?$", re.I)
CORE_WORDS = {"dual": 2, "quad": 4, "six": 6, "eight": 8, "twelve": 12}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def formatted(value):
    return json.dumps(value, indent=4, ensure_ascii=True) + "\n"


def plain(value: str):
    """Normalize typography only; preserve variant-distinguishing tokens."""
    value = re.sub(r"\((?:R|TM)\)|[®™]", "", value, flags=re.I)
    return " ".join(value.split()).casefold()


def catalog_key(model: str):
    # AMD's M suffix is an explicit mobile SKU; the parenthetical is a catalog
    # descriptor, not an additional model variant.
    model = re.sub(r"(?<=M) \(Mobile\)$", "", model, flags=re.I)
    return normalize_cpu_typography(plain(model))


def normalize_cpu_typography(value: str):
    # Intel writes the same Core i-series token as both "i9-14900K" and
    # "i9 14900K" in official names; no SKU character is removed.
    return re.sub(r"\b(core i[3579])-([0-9])", r"\1 \2", value)


def source_keys(device_name: str):
    """Return CPU/GPU lookup keys for a source label, or no keys if unsupported."""
    value = plain(device_name)
    value = re.sub(r"^\d+(?:st|nd|rd|th) gen ", "", value)
    match = re.match(r"^(amd|intel|nvidia) (.+)$", value)
    if not match:
        return None, {}
    vendor = VENDORS[match.group(1).upper()]
    model = match.group(2)
    cpu = CORE_SUFFIX.sub("", model)
    cpu = re.sub(r" (?:cpu )?@ \d+(?:\.\d+)?\s*ghz$", "", cpu)
    cpu = normalize_cpu_typography(cpu)
    gpu = model
    if vendor == "Intel" and gpu.startswith("arc "):
        gpu = re.sub(r" graphics$", "", gpu)
    return vendor, {"CPU": cpu, "GPU": gpu}


def memory_family(key: str):
    """Identify catalog variants whose memory distinction the source omits."""
    return re.sub(r"(?: \(\d+\s*gb\)| \d+\s*gb| gddr6x?| \(g[56]\))$", "", key)


def source_record(reference: str, cache: dict):
    filename, marker, pointer = reference.partition("#")
    if marker != "#" or not pointer.startswith("/"):
        raise ValueError(f"Invalid catalog source pointer: {reference}")
    if filename not in cache:
        cache[filename] = load_json(DATA / filename)
    record = cache[filename]
    for escaped in unquote(pointer).split("/")[1:]:
        token = escaped.replace("~1", "/").replace("~0", "~")
        record = record[int(token)] if isinstance(record, list) else record[token]
    return record


def official_model_key(model: str):
    """Match an exact official model, changing typography rather than SKU tokens."""
    value = model.replace("\ufffd", "").replace("\u2122", "").replace("\u00ae", "")
    value = re.sub(r"\b(?:amd|intel|processors?)\b", "", value, flags=re.I)
    return re.sub(r"[^a-z0-9]+", "", value.casefold())


def client_segment_index():
    """Read vendor form factors; a CPU can officially support both device types.

    AMD's desktop/laptop export includes dual-use CPUs. Keep both form factors
    instead of inferring a single market from the model suffix or test score.
    Intel's transposed ARK exports provide the explicit Vertical Segment field.
    """
    index = defaultdict(list)
    amd_path = ROOT / "docs/specs/source-csv/AMD desktop laptop workstation.csv"
    with amd_path.open(encoding="utf-8-sig", newline="") as handle:
        for record in csv.DictReader(handle):
            index[("AMD", official_model_key(record["Name"]))].append({
                "field": "Form Factor", "value": record["Form Factor"],
                "sourceFile": amd_path.relative_to(ROOT).as_posix(),
                "sourceProductName": record["Name"],
            })
    for path in sorted((ROOT / "docs/specs/source-csv-intel").glob("*.csv")):
        raw = path.read_bytes()
        for encoding in ("utf-8-sig", "cp1252", "latin-1"):
            try:
                text = raw.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        rows = list(csv.reader(text.splitlines()))
        header_index = next(i for i, row in enumerate(rows)
                            if len(row) > 1 and not row[0].strip())
        names = rows[header_index][1:]
        segment_row = next((row[1:] for row in rows[header_index + 1:]
                            if row and row[0].strip().rstrip("\u2021").strip() == "Vertical Segment"), [])
        for name, segment in zip(names, segment_row):
            index[("Intel", official_model_key(name))].append({
                "field": "Vertical Segment", "value": segment.strip(),
                "sourceFile": path.relative_to(ROOT).as_posix(),
                "sourceProductName": name.strip(),
            })
    return index


def exact_device_segments(product: dict, index: dict):
    matches = index[(VENDORS[product["vendor"]], official_model_key(product["model"]))]
    segments = set()
    for source in matches:
        values = {value.strip().casefold() for value in source["value"].split(",")}
        device_types = tuple(segment for segment, aliases in (
            ("desktop", {"desktop", "desktops"}),
            ("laptop", {"mobile", "laptops"}),
        ) if values & aliases)
        segments.add(device_types)
    if len(segments) != 1 or not next(iter(segments), ()):
        # Preserve a scored model under All CPUs when its official device type
        # is missing or conflicting. Never guess it or drop its score.
        return [], {"status": "unavailable",
                    "reason": "No unambiguous exact-model official form factor"}
    return list(next(iter(segments))), matches[0]


def exact_core_count(product: dict, cache: dict):
    record = source_record(product["sourceRecordRef"], cache)
    try:
        if product["vendor"] == "AMD":
            count = int(record["c"])
        else:
            count = int(record.get("pc") or 0) + int(record.get("ec") or 0)
            count = count or int(record["c"])
    except (KeyError, TypeError, ValueError):
        return None
    return count if count > 0 else None


def product_line(vendor: str, model: str):
    if vendor == "AMD":
        if model.startswith("Radeon"):
            return "Radeon"
        return "Ryzen Threadripper" if "Threadripper" in model else "Ryzen"
    if vendor == "Intel":
        if model.startswith("Arc"):
            return "Arc"
        return "Core Ultra" if model.startswith("Core Ultra") else "Core"
    return "GeForce" if model.startswith("GeForce") else "NVIDIA"


def catalog_index():
    products = load_json(DATA / "benchmark-catalog.json")["products"]
    index = defaultdict(list)
    families = defaultdict(set)
    for product in products:
        tabs = set(product["dashboardTabs"])
        kind = "CPU" if tabs & CLIENT_TABS else "GPU" if tabs & GRAPHICS_TABS else None
        if not kind or product["vendor"] not in VENDORS:
            continue
        vendor = VENDORS[product["vendor"]]
        key = catalog_key(product["model"])
        index[(kind, vendor, key)].append(product)
        if kind == "GPU":
            families[(vendor, memory_family(key))].add(key)
    return index, families


def parse_official_rows(raw: bytes):
    """Accept Blender's complete query JSON or its browser table export."""
    if len(raw) > MAX_EXPORT_BYTES:
        raise ValueError("Blender export exceeds the 10 MiB safety limit")
    export = json.loads(raw)
    if not isinstance(export, dict):
        raise ValueError("Blender export must be a JSON object")
    if "columns" in export:
        columns = export.get("columns")
        if (not isinstance(columns, list) or any(not isinstance(item, dict) for item in columns)
                or [item.get("display_name") for item in columns] != EXPORT_HEADER):
            raise ValueError("The API response is not Blender's grouped device-name score table")
        rows = export.get("rows")
    else:
        if export.get("header") != EXPORT_HEADER:
            raise ValueError("The export is not Blender's grouped device-name score table")
        rows = export.get("body")
    if not isinstance(rows, list) or len(rows) < MINIMUM_EXPORT_ROWS:
        raise ValueError("The grouped export is incomplete")
    names = set()
    for row in rows:
        if (not isinstance(row, list) or len(row) != 3 or
                not isinstance(row[0], str) or not row[0].strip() or
                type(row[1]) not in (int, float) or not math.isfinite(row[1]) or row[1] <= 0 or
                type(row[2]) is not int or row[2] <= 0):
            raise ValueError(f"Invalid official export row: {row!r}")
        if row[0] in names:
            raise ValueError(f"Duplicate device name in grouped export: {row[0]}")
        names.add(row[0])
    return rows


def official_rows(path: Path):
    raw = path.read_bytes()
    return parse_official_rows(raw), sha256(raw).hexdigest()


def verify_query_url(url: str):
    """The live acquisition cannot change version, filters, host, or grouping."""
    parsed = urlsplit(url)
    if (parsed.scheme != "https" or parsed.hostname != "opendata.blender.org" or
            parsed.port not in (None, 443) or parsed.username or parsed.password or
            parsed.path != "/benchmarks/query/" or parsed.fragment or
            parse_qs(parsed.query) != {"blender_version": [VERSION],
                                      "group_by": ["device_name"],
                                      "response_type": ["datatables"]}):
        raise ValueError("Unexpected Blender API destination or benchmark scope")


class OfficialRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        verify_query_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def capture_manifest(raw: bytes, path: Path, *, captured_at: datetime,
                     response_url: str, headers: dict):
    rows = parse_official_rows(raw)
    verify_query_url(response_url)
    return {
        "schemaVersion": 1,
        "source": "Blender Open Data",
        "captureMethod": "official-public-query-json",
        "captureDate": captured_at.date().isoformat(),
        "retrievedAt": captured_at.isoformat(timespec="seconds").replace("+00:00", "Z"),
        "sourceQueryUrl": QUERY,
        "requestUrl": API_QUERY,
        "responseUrl": response_url,
        "httpStatus": 200,
        "httpDate": headers.get("Date"),
        "contentType": headers.get("Content-Type"),
        "etag": headers.get("ETag"),
        "lastModified": headers.get("Last-Modified"),
        "sourceExportFile": path.name,
        "sourceExportSha256": sha256(raw).hexdigest(),
        "sourceExportBytes": len(raw),
        "blenderVersion": VERSION,
        "groupBy": ["device_name"],
        "operatingSystems": "all",
        "computeTypes": "all",
        "sourceRows": len(rows),
        "minimumSamples": MINIMUM_SAMPLES,
        "scorePrecision": "Raw API medians retained; imported scores rounded to two decimals, matching Blender's public table.",
        "dataPolicyUrl": DATA_POLICY_URL,
        "archiveLicense": "CC0-1.0",
        "archiveLicenseUrl": DATA_LICENSE_URL,
    }


def fetch_official_export(path: Path, *, opener=None, now=None):
    """Read and validate the entire source before mutating retained artifacts."""
    verify_query_url(API_QUERY)
    opener = opener or build_opener(OfficialRedirects())
    request = Request(API_QUERY, headers={"User-Agent": "ChipIndex benchmark importer/1.0",
                                         "Accept": "application/json"})
    for attempt in range(3):
        try:
            with opener.open(request, timeout=45) as response:
                if response.status != 200:
                    raise ValueError(f"Unexpected Blender HTTP status {response.status}")
                verify_query_url(response.url)
                content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip()
                if content_type != "application/json":
                    raise ValueError("Blender returned a non-JSON response; retained results unchanged")
                length = response.headers.get("Content-Length")
                if length and int(length) > MAX_EXPORT_BYTES:
                    raise ValueError("Blender export exceeds the 10 MiB safety limit")
                raw = response.read(MAX_EXPORT_BYTES + 1)
                if length and len(raw) != int(length):
                    raise ValueError("Incomplete Blender HTTP response")
                captured_at = (now or (lambda: datetime.now(timezone.utc)))()
                manifest = capture_manifest(raw, path, captured_at=captured_at,
                                            response_url=response.url, headers=response.headers)
                return raw, manifest
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
        except (URLError, TimeoutError):
            if attempt == 2:
                raise
        time.sleep(2 ** attempt)
    raise AssertionError("Unreachable retry state")


def verify_capture(raw: bytes, capture: dict, path: Path):
    """Replay cannot stamp an old export with today's date or another scope."""
    rows = parse_official_rows(raw)
    try:
        captured = date.fromisoformat(capture["captureDate"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("A retained export needs a valid capture-date manifest") from exc
    if captured > datetime.now(timezone.utc).date():
        raise ValueError("Blender capture date is in the future")
    expected = {
        "schemaVersion": 1, "source": "Blender Open Data",
        "sourceExportFile": path.name, "sourceExportSha256": sha256(raw).hexdigest(),
        "sourceExportBytes": len(raw), "blenderVersion": VERSION,
        "sourceQueryUrl": QUERY, "groupBy": ["device_name"],
        "operatingSystems": "all", "computeTypes": "all", "sourceRows": len(rows),
        "minimumSamples": MINIMUM_SAMPLES,
    }
    for key, value in expected.items():
        if capture.get(key) != value:
            raise ValueError(f"Blender capture manifest mismatch: {key}")
    if capture.get("captureMethod") == "official-public-query-json":
        verify_query_url(capture.get("requestUrl", ""))
        verify_query_url(capture.get("responseUrl", ""))
        timestamp = datetime.fromisoformat(capture.get("retrievedAt", "").replace("Z", "+00:00"))
        if (timestamp.tzinfo is None or timestamp.astimezone(timezone.utc).date() != captured
                or timestamp > datetime.now(timezone.utc) or capture.get("httpStatus") != 200):
            raise ValueError("Invalid live Blender retrieval timestamp/status")
    elif capture.get("captureMethod") != "retained-browser-export":
        raise ValueError("Unrecognized Blender capture method")
    return rows, sha256(raw).hexdigest()


def write_bundle(contents: dict[Path, bytes]):
    """Stage all artifacts, then replace; restore prior bytes on any failure."""
    originals = {path: path.read_bytes() if path.exists() else None for path in contents}
    staged = {}
    replaced = []
    try:
        for path, raw in contents.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(prefix=path.name + ".", suffix=".tmp",
                                             dir=path.parent, delete=False) as handle:
                temporary = Path(handle.name)
                staged[path] = temporary
                handle.write(raw)
                handle.flush()
                os.fsync(handle.fileno())
            if temporary.read_bytes() != raw:
                raise IOError(f"Failed to stage {path}")
        for path, temporary in staged.items():
            os.replace(temporary, path)
            replaced.append(path)
            if path.read_bytes() != contents[path]:
                raise IOError(f"Failed to persist {path}")
    except BaseException:
        for path in reversed(replaced):
            if originals[path] is None:
                path.unlink(missing_ok=True)
            else:
                path.write_bytes(originals[path])
                if path.read_bytes() != originals[path]:
                    raise IOError(f"Failed to restore {path}")
        raise
    finally:
        for temporary in staged.values():
            temporary.unlink(missing_ok=True)


def build(path: Path, capture: dict | None = None, raw: bytes | None = None):
    raw = path.read_bytes() if raw is None else raw
    capture = load_json(path.with_suffix(".manifest.json")) if capture is None else capture
    rows, digest = verify_capture(raw, capture, path)
    index, families = catalog_index()
    core_cache = {}
    segment_index = client_segment_index()
    canonical_source_counts = Counter()
    for name, _, samples in rows:
        if samples < MINIMUM_SAMPLES:
            continue
        vendor, keys = source_keys(name)
        if vendor:
            for kind, key in keys.items():
                canonical_source_counts[(kind, vendor, key)] += 1

    accepted, excluded = [], []
    for name, source_score, samples in rows:
        score = float(Decimal(str(source_score)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        entry = {"sourceDeviceName": name, "score": score, "samples": samples}
        reason = None
        if samples < MINIMUM_SAMPLES:
            reason = "below-minimum-samples"
        else:
            vendor, keys = source_keys(name)
            if not vendor:
                reason = "unsupported-or-unidentified-vendor"
            else:
                hits = [(kind, index[(kind, vendor, key)]) for kind, key in keys.items()
                        if index[(kind, vendor, key)]]
                if not hits:
                    gpu_key = keys["GPU"]
                    if gpu_key.endswith(" laptop gpu"):
                        reason = "laptop-gpu-not-in-catalog"
                    elif (gpu_key == memory_family(gpu_key) and
                          len(families[(vendor, gpu_key)]) > 1):
                        reason = "unspecified-memory-variant"
                    else:
                        reason = "no-exact-catalog-model"
                elif len(hits) > 1 or len(hits[0][1]) > 1:
                    reason = "ambiguous-catalog-identity"
                else:
                    kind, matches = hits[0]
                    model_key = keys[kind]
                    product = matches[0]
                    if canonical_source_counts[(kind, vendor, model_key)] > 1:
                        reason = "multiple-source-labels-for-model"
                    elif (kind == "GPU" and
                          len(families[(vendor, memory_family(model_key))]) > 1 and
                          model_key == memory_family(model_key)):
                        reason = "unspecified-memory-variant"
                    else:
                        result = {
                            "model": product["model"],
                            "vendor": vendor,
                            "productLine": product_line(vendor, product["model"]),
                            "deviceType": kind,
                            "score": score,
                            "samples": samples,
                            "blenderVersion": VERSION,
                            "computeType": "mixed",
                            "sourceDeviceName": name,
                            "sourceUrl": "https://opendata.blender.org/benchmarks/query/?" +
                                         urlencode((("blender_version", VERSION),
                                                    ("device_name", name),
                                                    ("group_by", "device_name"))),
                        }
                        if kind == "CPU":
                            count = exact_core_count(product, core_cache)
                            if count is None:
                                reason = "missing-exact-product-core-count"
                            elif (reported := CORE_SUFFIX.search(name)) and (
                                    int(reported.group("count")) if reported.group("count").isdigit()
                                    else CORE_WORDS[reported.group("count").casefold()]) != count:
                                reason = "source-core-count-disagrees-with-catalog"
                            else:
                                result["coreCount"] = count
                                result["deviceSegments"], result["deviceSegmentSource"] = (
                                    exact_device_segments(product, segment_index))
                        if not reason:
                            accepted.append(result)
                            entry["matchedModel"] = product["model"]
                            entry["vendor"] = vendor
                            entry["deviceType"] = kind
        if reason:
            entry["reason"] = reason
            excluded.append(entry)

    accepted.sort(key=lambda row: (0 if row["deviceType"] == "CPU" else 1,
                                   -row["score"], row["vendor"], row["model"]))
    if len({(row["deviceType"], row["vendor"], row["model"]) for row in accepted}) != len(accepted):
        raise ValueError("Multiple grouped source rows map to one catalog model")

    snapshot = {
        "meta": {
            "snapshotDate": capture["captureDate"],
            "retrievedAt": capture.get("retrievedAt"),
            "sourceCaptureMethod": capture["captureMethod"],
            "sourceRows": len(rows),
            "importedRows": len(accepted),
            "excludedRows": len(excluded),
            "source": "Blender Open Data",
            "sourceUrl": QUERY,
            "metric": "median samples per minute",
            "scope": "Blender 5.2.0; all operating systems and compute types",
            "minimumSamples": MINIMUM_SAMPLES,
            "coreCountSource": "CPU core counts are product specifications from the exact ChipIndex dashboard spec rows, based on AMD official product data and Intel ARK exports. They are not measured or reported by Blender Open Data.",
            "deviceSegmentSource": "CPU device segments come from the exact official model in retained AMD Form Factor and Intel ARK Vertical Segment exports. AMD CPUs listed for both laptops and desktops appear in both filters. Blender medians pool systems and do not identify the tested chassis, power limit, or cooling.",
            "sourceExportSha256": digest,
        },
        "results": accepted,
    }
    review = {
        "meta": {
            "source": "Blender Open Data grouped device-name JSON export",
            "sourceQueryUrl": QUERY,
            "captureDate": capture["captureDate"],
            "retrievedAt": capture.get("retrievedAt"),
            "sourceCaptureMethod": capture["captureMethod"],
            "blenderVersion": VERSION,
            "sourceExportFile": path.name,
            "sourceExportSha256": digest,
            "sourceRows": len(rows),
            "minimumSamples": MINIMUM_SAMPLES,
            "acceptedRows": len(accepted),
            "excludedRows": len(excluded),
            "acceptedByDeviceType": dict(sorted(Counter(row["deviceType"] for row in accepted).items())),
            "acceptedByClientDeviceSegment": dict(sorted(Counter(
                segment for row in accepted for segment in row.get("deviceSegments", [])).items())),
            "dualUseClientModels": sum(len(row.get("deviceSegments", [])) > 1 for row in accepted),
            "unclassifiedClientModels": sum(row["deviceType"] == "CPU" and
                                             not row.get("deviceSegments") for row in accepted),
            "excludedByReason": dict(sorted(Counter(row["reason"] for row in excluded).items())),
            "matchingPolicy": "Exact unique catalog model after vendor prefix, CPU core-count/clock descriptor, Intel generation prefix, Intel Core i-series hyphen/space typography, Intel Arc Graphics suffix, or AMD M (Mobile) catalog descriptor removal. Memory variants and laptop GPUs are never merged with desktop labels.",
        },
        "accepted": [{"sourceDeviceName": row["sourceDeviceName"],
                      "model": row["model"], "vendor": row["vendor"],
                      "deviceType": row["deviceType"], "score": row["score"],
                      "samples": row["samples"],
                      **({"deviceSegments": row["deviceSegments"],
                          "deviceSegmentSource": row["deviceSegmentSource"]}
                         if row["deviceType"] == "CPU" else {})} for row in accepted],
        "excluded": excluded,
    }
    if len(accepted) + len(excluded) != len(rows):
        raise AssertionError("The review does not account for every exported row")
    return snapshot, review


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=EXPORT,
                        help="retained official grouped JSON export")
    parser.add_argument("--manifest", type=Path,
                        help="capture manifest; defaults to SOURCE.manifest.json")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--review", type=Path, default=REVIEW)
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--fetch", action="store_true", help="fetch the complete live 5.2.0 grouped query")
    action.add_argument("--check", action="store_true", help="verify retained source and committed outputs")
    args = parser.parse_args()
    manifest_path = args.manifest or args.source.with_suffix(".manifest.json")
    if len({path.resolve() for path in (args.source, manifest_path, args.output, args.review)}) != 4:
        parser.error("Source, manifest, output, and review paths must be distinct")
    if args.fetch:
        raw, capture = fetch_official_export(args.source)
        # A large loss in a pinned version usually means an incomplete source
        # response or query change. Preserve the last good capture for review.
        if args.source.exists():
            previous_rows = parse_official_rows(args.source.read_bytes())
            if capture["sourceRows"] < len(previous_rows) * .7:
                raise ValueError("Blender source lost over 30% of grouped rows; retained artifacts unchanged")
    else:
        raw = args.source.read_bytes()
        if not manifest_path.exists():
            raise ValueError(f"Missing source capture manifest: {manifest_path}; replay cannot infer a capture date")
        capture = load_json(manifest_path)
    snapshot, review = build(args.source, capture, raw)
    if not snapshot["results"]:
        raise ValueError("No Blender rows matched the catalog; retained artifacts unchanged")
    capture["importSummary"] = {key: review["meta"][key] for key in (
        "acceptedRows", "excludedRows", "acceptedByDeviceType", "acceptedByClientDeviceSegment",
        "dualUseClientModels", "unclassifiedClientModels", "excludedByReason", "matchingPolicy")}
    contents = {
        args.source: raw,
        manifest_path: formatted(capture).encode("utf-8"),
        args.output: formatted(snapshot).encode("utf-8"),
        args.review: formatted(review).encode("utf-8"),
    }
    if args.check:
        for path, expected in contents.items():
            if not path.exists() or path.read_bytes() != expected:
                raise SystemExit(f"Stale Blender import output: {path}")
    else:
        write_bundle(contents)
    print(f"Blender {'live refresh' if args.fetch else 'import check' if args.check else 'retained replay'} PASS: "
          f"{len(snapshot['results'])} matched catalog models "
          f"({review['meta']['acceptedByDeviceType']}), "
          f"{review['meta']['excludedRows']} exclusions from {review['meta']['sourceRows']} source rows")
    print("Capture:", capture["captureDate"], capture["captureMethod"], capture["sourceExportSha256"])
    print("Exclusion reasons:", review["meta"]["excludedByReason"])


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, HTTPError) as exc:
        raise SystemExit(f"Blender import failed; no successful refresh recorded: {exc}") from exc
