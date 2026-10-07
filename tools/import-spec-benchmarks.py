#!/usr/bin/env python3
"""Import source-audited SPEC base-rate results from the full official indexes.

Default selection: all matching CPU2026 reports, and the two newest submission
IDs per exact CPU model / CPU count for CPU2017, plus previously verified source
IDs. This is archive-wide model coverage, not every published system result.

    python tools/import-spec-benchmarks.py --refresh     # fetch missing inputs
    python tools/import-spec-benchmarks.py --check       # read-only offline replay
    python tools/import-spec-benchmarks.py --discover    # cached index coverage
    python tools/import-spec-benchmarks.py --refresh --all-reports

--refresh re-fetches indexes, then resumes verified report cache entries. Use
--revalidate-reports as well to re-fetch all selected disclosures. The saved
selection policy is replayed by default; --latest-two explicitly returns to the
bounded policy after an --all-reports import. No network,
cache writes, snapshot writes, or clock-dependent changes occur in --check.
--check uses retained normalized official fields and their integrity hashes. It
requires no raw HTML cache. --verify-cache additionally reparses original cached
HTML; it does not fetch anything or claim live-source freshness. A failed or
contradictory selected disclosure aborts publication of all outputs.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timezone
import gzip
from hashlib import sha256
import html
import json
import math
from pathlib import Path
import re
import threading
import time
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "js" / "data"
BASE = "https://www.spec.org"
CACHE = ROOT / "tools" / "spec-source-cache"
REVIEW = ROOT / "tools" / "spec-import-review.json"
SOURCE_RECORDS = ROOT / "tools" / "spec-source-records.json"
NORMALIZATION_VERSION = 1
ALIASES_PATH = ROOT / "tools" / "spec-model-aliases.json"
RETAINED_PATH = ROOT / "tools" / "spec-retained-reports.json"
CONFIGS = (
    ("cpu2026", "rint2026", "enterprise-benchmark-2026-int-sample.json", "SPECrate2026_int_base"),
    ("cpu2026", "rfp2026", "enterprise-benchmark-2026-fp-sample.json", "SPECrate2026_fp_base"),
    ("cpu2017", "rint2017", "enterprise-benchmark-sample.json", "SPECrate2017_int_base"),
    ("cpu2017", "rfp2017", "enterprise-benchmark-fp-sample.json", "SPECrate2017_fp_base"),
)
VENDORS = {"AMD": "AMD", "INTEL": "Intel", "AMPERE": "Ampere", "NVIDIA": "NVIDIA"}
CATALOG_TABS = {"amd/epyc", "intel/xeon", "ampere/processors", "nvidia/cpu"}
CPU2017_VERSIONS = {"1.0.0", "1.0.1", "1.0.2", "1.0.5", "1.1.0", "1.1.5", "1.1.7", "1.1.8", "1.1.9"}
COMPATIBILITY_REFERENCES = [
    "https://www.spec.org/cpu2017/press/v1_1_release.html",
    "https://spec.org/pressreleases/20221201-academic-pricing/",
    "https://www.spec.org/cpu2017/releases/",
]
REPORT_RETRIES = 3


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def formatted(value):
    return json.dumps(value, indent=4, ensure_ascii=True) + "\n"


def write_checked(path, body):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".partial")
    temporary.write_text(body, encoding="utf-8", newline="")
    if temporary.read_text(encoding="utf-8") != body:
        raise IOError(f"Read-back failed for {path}")
    temporary.replace(path)


class SourceCache:
    """Content-checked compressed source evidence with resumable bounded fetching."""
    def __init__(self, root=CACHE, network=False, opener=urlopen, records_path=SOURCE_RECORDS, verify_cache=False):
        self.root = Path(root)
        self.path = self.root / "manifest.json"
        self.manifest = load_json(self.path) if self.path.exists() else {"schemaVersion": 1, "resources": {}}
        if self.manifest.get("schemaVersion") != 1 or not isinstance(self.manifest.get("resources"), dict):
            raise ValueError("Unsupported SPEC source cache manifest")
        self.records_path = Path(records_path)
        self.records = load_json(self.records_path) if self.records_path.exists() else {"schemaVersion": 1, "normalizationVersion": NORMALIZATION_VERSION, "resources": {}}
        if self.records.get("normalizationVersion") != NORMALIZATION_VERSION:
            raise ValueError("Unsupported normalized SPEC input version")
        self.verify_cache = verify_cache
        self.records_dirty = False
        self.network = network
        self.opener = opener
        self.lock = threading.Lock()
        self.dirty = False

    def get(self, url, refresh=False):
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.netloc != "www.spec.org" or not re.match(r"/cpu(?:2017|2026)/results/", parsed.path):
            raise ValueError(f"Unexpected SPEC source URL: {url}")
        record = self.manifest["resources"].get(url)
        if record is not None and not refresh:
            expected_file = sha256(url.encode()).hexdigest() + ".html.gz"
            if record.get("file") != expected_file or record.get("url") != url:
                raise ValueError(f"Invalid SPEC source cache identity: {url}")
            raw = gzip.decompress((self.root / expected_file).read_bytes())
            if sha256(raw).hexdigest() != record.get("sha256") or len(raw) != record.get("bytes"):
                raise ValueError(f"SPEC source cache checksum mismatch: {url}")
            if record.get("httpStatus") != 200:
                raise ValueError(f"SPEC source cache is not an HTTP 200 response: {url}")
            datetime.fromisoformat(record["fetchedAt"])
            return raw.decode("utf-8", errors="replace"), record
        if not self.network:
            raise FileNotFoundError(f"Missing cached SPEC input: {url}; run --refresh to fetch it")
        last = None
        for attempt in range(REPORT_RETRIES):
            try:
                request = Request(url, headers={"User-Agent": "ChipIndex-benchmark-import/1.0 (source-linked research snapshot)"})
                with self.opener(request, timeout=45) as reply:
                    if reply.status != 200:
                        raise ValueError(f"HTTP {reply.status}")
                    resolved = urlparse(reply.url)
                    if resolved.scheme != "https" or resolved.netloc not in ("www.spec.org", "spec.org", "ftp.spec.org"):
                        raise ValueError(f"Unexpected result redirect: {reply.url}")
                    raw = reply.read()
                    if b"<html" not in raw.lower() or b"SPEC" not in raw:
                        raise ValueError("Source is not a SPEC HTML document")
                    record = {"url": url, "fetchedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                              "sha256": sha256(raw).hexdigest(), "httpStatus": reply.status,
                              "resolvedUrl": reply.url, "contentType": reply.headers.get("Content-Type"),
                              "bytes": len(raw), "file": sha256(url.encode()).hexdigest() + ".html.gz"}
                self.root.mkdir(parents=True, exist_ok=True)
                target = self.root / record["file"]
                target.write_bytes(gzip.compress(raw, mtime=0))
                if gzip.decompress(target.read_bytes()) != raw:
                    raise IOError(f"Failed cache read-back: {url}")
                with self.lock:
                    self.manifest["resources"][url] = record
                    self.dirty = True
                return raw.decode("utf-8", errors="replace"), record
            except Exception as exc:
                last = exc
                if attempt + 1 < REPORT_RETRIES:
                    time.sleep(2 ** attempt)
        raise RuntimeError(f"Could not retrieve {url} after {REPORT_RETRIES} attempts: {last}")

    def facts(self, url, kind, normalize, refresh=False):
        """Replay retained source fields; raw original HTML verification is opt-in.

        The raw-source and normalized-field digests have different meanings.
        Never label normalized fields as the complete raw source document.
        """
        retained = self.records["resources"].get(url)
        evidence = self.manifest["resources"].get(url)
        if retained is not None and evidence is not None and not refresh:
            if (retained.get("kind") != kind or retained.get("sourceSha256") != evidence.get("sha256")
                    or sha256(formatted(retained.get("fields")).encode()).hexdigest() != evidence.get("normalizedSha256")):
                raise ValueError(f"Normalized SPEC source evidence mismatch: {url}")
            datetime.fromisoformat(evidence["fetchedAt"])
            if self.verify_cache:
                raw, _ = self.get(url)
                if normalize(raw) != retained["fields"]:
                    raise ValueError(f"Retained SPEC fields differ from raw source: {url}")
            return retained["fields"], evidence
        raw, evidence = self.get(url, refresh=refresh)
        fields = normalize(raw)
        normalized_digest = sha256(formatted(fields).encode()).hexdigest()
        # Cache conversion is an explicit input operation, never done by
        # --check. Network refresh records both source and normalization hashes.
        if not self.network:
            raise FileNotFoundError(f"Missing retained normalized SPEC input: {url}; run --fetch to prepare it")
        with self.lock:
            evidence["normalizedSha256"] = normalized_digest
            self.records["resources"][url] = {"kind": kind, "sourceSha256": evidence["sha256"], "fields": fields}
            self.records_dirty = True
            self.dirty = True
        return fields, evidence

    def save(self):
        if not self.network or not self.dirty:
            return
        with self.lock:
            self.manifest["resources"] = dict(sorted(self.manifest["resources"].items()))
            write_checked(self.path, formatted(self.manifest))
            self.dirty = False
            if self.records_dirty:
                self.records["resources"] = dict(sorted(self.records["resources"].items()))
                write_checked(self.records_path, formatted(self.records))
                self.records_dirty = False


def clean(markup):
    return " ".join(html.unescape(re.sub(r"<[^>]*>", " ", markup)).split())


def cell(row, class_name):
    found = re.search(rf'<td\s+class="{re.escape(class_name)}"[^>]*>(.*?)</td>', row, re.I | re.S)
    return clean(found.group(1)) if found else ""


def field(report, anchor):
    found = re.search(rf'#{re.escape(anchor)}">.*?</th>\s*<td[^>]*>(.*?)</td>', report, re.I | re.S)
    return clean(found.group(1)) if found else ""


def id_field(report, id_name):
    found = re.search(rf'<td\s+id="{re.escape(id_name)}"[^>]*>(.*?)</td>', report, re.I | re.S)
    return clean(found.group(1)) if found else ""


def score_number(value):
    number = float(value.replace(",", ""))
    if not math.isfinite(number) or number <= 0:
        raise ValueError("base score must be finite and positive")
    return int(number) if number.is_integer() else number


def load_catalog():
    catalog = load_json(DATA / "benchmark-catalog.json")
    return sorted({(VENDORS[p["vendor"]], p["model"])
                   for p in catalog["products"] if set(p["dashboardTabs"]) & CATALOG_TABS},
                  key=lambda pair: (-len(pair[1]), pair))


def load_aliases():
    aliases = load_json(ALIASES_PATH)["aliases"]
    result = {}
    for alias in aliases:
        if not alias.get("evidenceUrls") or not alias.get("reason"):
            raise ValueError("A SPEC model alias must include official identity evidence")
        for suite in alias["suites"]:
            key = (suite, alias["vendor"], alias["model"])
            if key in result:
                raise ValueError(f"Duplicate SPEC alias: {key}")
            result[key] = alias
    return result


def has_exact_name(text, name):
    return bool(re.search(r"(?<![A-Za-z0-9])" + re.escape(name) + r"(?![A-Za-z0-9])", text, re.I))


def matches(system_name, suite, catalog, aliases):
    lower = system_name.casefold()
    hits = []
    for vendor, model in catalog:
        alias = aliases.get((suite, vendor, model), {})
        source_name = alias.get("sourceCpuName", model)
        if source_name.casefold() not in lower or not has_exact_name(system_name, source_name):
            continue
        if alias.get("systemNameMustContain", "").casefold() not in lower:
            continue
        hits.append((vendor, model))
    return hits


def index_fields(index):
    """Retain official table cells without assigning catalog identity or scores."""
    rows = []
    for markup in re.findall(r"<tr\b[^>]*>.*?</tr>", index, re.I | re.S):
        name_cell = re.search(r'<td\s+class="hw_model"[^>]*>(.*?)</td>', markup, re.I | re.S)
        if not name_cell:
            continue
        source = re.search(r'href="([^\"]+\.html)"', name_cell.group(1), re.I)
        if not source:
            raise ValueError(f"Official index row {len(rows)+1} has no disclosure URL")
        name = clean(re.split(r'<span\s+class="disclosures"', name_cell.group(1), flags=re.I)[0])
        rows.append({"sourceUrl": urljoin(BASE, source.group(1)), "systemName": name,
                     "indexCpuCount": cell(markup, "hw_nchips"),
                     "indexEnabledCores": cell(markup, "hw_ncores"),
                     "indexBaseScore": cell(markup, "basemean"),
                     "indexBaseCopies": cell(markup, "base_copies")})
    if not rows:
        raise ValueError("Official index contains no report rows")
    return {"rows": rows}


def index_candidates(index, index_url, suite, catalog, aliases):
    """Account for every retained official row before selecting disclosures."""
    if isinstance(index, str):
        index = index_fields(index)
    candidates, review, identities = [], [], {}
    rows_seen = len(index["rows"])
    for original in index["rows"]:
        candidate = dict(original)
        url, name = candidate["sourceUrl"], candidate["systemName"]
        if not re.fullmatch(rf"https://www\.spec\.org/{suite}/results/res\d{{4}}q[1-4]/{suite}-\d{{8}}-\d+\.html", url):
            raise ValueError(f"Invalid official disclosure path: {url}")
        if url in identities:
            if identities[url] != original:
                raise ValueError(f"Conflicting duplicate result in {index_url}: {url}")
            continue
        identities[url] = original
        hits = matches(name, suite, catalog, aliases)
        candidate["catalogMatches"] = [f"{vendor} {model}" for vendor, model in hits]
        if not hits:
            reason = "no-exact-catalog-match"
        elif len(hits) != 1:
            reason = "ambiguous-catalog-match"
        elif candidate["indexCpuCount"] not in ("1", "2"):
            reason = "outside-1-or-2-cpu-cohorts"
        elif not re.fullmatch(r"[\d,.]+", candidate["indexBaseScore"]):
            reason = "no-numeric-published-base-score"
        else:
            candidate["vendor"], candidate["model"] = hits[0]
            candidates.append(candidate)
            continue
        review.append({**candidate, "reason": reason})
    summary = {"sourceIndexRows": rows_seen, "uniqueIndexReports": len(identities),
               "duplicateIndexRows": rows_seen - len(identities),
               "eligibleExactReports": len(candidates),
               "eligibleExactModels": len({(r["vendor"], r["model"]) for r in candidates}),
               "excludedByReason": dict(sorted(Counter(r["reason"] for r in review).items()))}
    if len(candidates) + len(review) != len(identities):
        raise AssertionError("Official index accounting mismatch")
    return candidates, review, summary


def submission_sort_key(candidate):
    # The official report ID carries submission date and sequence. The index
    # does not expose original publication dates; do not claim this sorts them.
    return Path(urlparse(candidate["sourceUrl"]).path).name


def select_candidates(candidates, suite, retained, all_reports=False):
    retained = set(retained)
    available = {r["sourceUrl"] for r in candidates}
    if retained - available:
        raise ValueError("Previously verified reports disappeared or became ineligible; review before changing snapshots: "
                         + ", ".join(sorted(retained - available)))
    if suite == "cpu2026" or all_reports:
        return candidates, []
    by_model = defaultdict(list)
    for candidate in candidates:
        by_model[(candidate["vendor"], candidate["model"], candidate["indexCpuCount"])].append(candidate)
    selected_urls = set(retained)
    for cohort in by_model.values():
        selected_urls.update(r["sourceUrl"] for r in sorted(cohort, key=submission_sort_key, reverse=True)[:2])
    selected, deferred = [], []
    for candidate in candidates:
        if candidate["sourceUrl"] in selected_urls:
            selected.append(candidate)
        else:
            deferred.append({**candidate, "reason": "deferred-by-latest-two-submission-policy"})
    return selected, deferred


def disclosure_fields(report, suite, metric):
    """Retain reported fields, preserving raw numeric/date strings for validation."""
    visible = clean(report)
    if metric not in visible.replace("\u00ae", ""):
        raise ValueError("report does not name expected metric")
    version_match = re.search(rf"Tested with SPEC CPU[\u00ae ]*{suite[-4:]} (v[\d.]+)", visible)
    published = re.search(r"Originally published on (\d{4}-\d{2}-\d{2})", visible)
    metric_html = metric.replace("SPECrate", "SPECrate(?:&reg;|\u00ae)?")
    value_match = re.search(metric_html + r'.*?<span\s+class="value">([\d,.]+)', report, re.I | re.S)
    if not version_match or not published or not value_match:
        raise ValueError("missing disclosed metric, benchmark build, publication date or base score")
    return {"metric": metric, "benchmarkBuild": version_match.group(1),
            "publishedDate": published.group(1), "baseScore": value_match.group(1),
            "sourceCpuName": field(report, "CPUName"), "enabledDescription": field(report, "Enabled"),
            "memory": field(report, "Memory"), "operatingSystem": field(report, "OS"),
            "compiler": field(report, "Compiler"), "testSponsor": id_field(report, "test_sponsor_val"),
            "testedBy": id_field(report, "tester_val"), "testDate": id_field(report, "test_date_val")}


def extract(candidate, suite, metric, report, evidence, aliases):
    source = disclosure_fields(report, suite, metric) if isinstance(report, str) else report
    if source["metric"] != metric:
        raise ValueError("retained disclosure does not name expected metric")
    short_version = source["benchmarkBuild"]
    if not re.fullmatch(r"v\d+\.\d+\.\d+", short_version):
        raise ValueError("invalid disclosed benchmark build")
    if suite == "cpu2017" and short_version[1:] not in CPU2017_VERSIONS:
        raise ValueError(f"Unreviewed CPU2017 build: {short_version}")
    version = f"SPEC CPU{suite[-4:]} {short_version}"
    published_date = source["publishedDate"]
    retrieved_date = datetime.fromisoformat(evidence["fetchedAt"]).date()
    if date.fromisoformat(published_date) > retrieved_date:
        raise ValueError("report published after actual retrieval date")
    score = score_number(source["baseScore"])
    if score != score_number(candidate["indexBaseScore"]):
        raise ValueError("index and disclosure base scores differ")
    alias = aliases.get((suite, candidate["vendor"], candidate["model"]), {})
    source_name = alias.get("sourceCpuName", candidate["model"])
    source_cpu = source["sourceCpuName"]
    if not source_cpu or not has_exact_name(source_cpu, source_name):
        raise ValueError(f"report CPU name does not exactly identify {candidate['model']}: {source_cpu}")
    enabled = source["enabledDescription"]
    count_match = re.fullmatch(r"(\d+)(?:\s*\([^)]*\))? cores?,\s*(\d+) chips?(?:.*)?", enabled, re.I)
    if not count_match:
        raise ValueError(f"unreadable enabled CPU/core disclosure: {enabled}")
    cores, chips = map(int, count_match.groups())
    if chips not in (1, 2) or cores <= 0 or cores % chips:
        raise ValueError("enabled cores and CPU count do not define a supported cohort")
    if chips != int(candidate["indexCpuCount"]) or cores != int(candidate["indexEnabledCores"].split()[0]):
        raise ValueError("index and report enabled CPU/core counts differ")
    if alias.get("coresPerChip") and cores != chips * alias["coresPerChip"]:
        raise ValueError("enabled cores disagree with reviewed component identity")
    if alias.get("systemNameMustContain", "").casefold() not in candidate["systemName"].casefold():
        raise ValueError("system name does not satisfy reviewed component identity")
    copies_text = candidate["indexBaseCopies"]
    if not copies_text.isdigit() or int(copies_text) <= 0:
        raise ValueError("missing positive integer base copy count")
    fields = ("memory", "operatingSystem", "compiler", "testSponsor", "testedBy", "testDate")
    values = {key: source[key] for key in fields}
    if any(not value for value in values.values()):
        raise ValueError("one or more required report metadata fields are blank")
    if not re.fullmatch(r"[A-Z][a-z]{2}-\d{4}", values["testDate"]):
        raise ValueError(f"unrecognized test date: {values['testDate']}")
    model = candidate["model"]
    product_line = ("EPYC" if model.startswith("EPYC") else "Xeon" if model.startswith("Xeon")
                    else "AmpereOne" if model.startswith("AmpereOne") else "Altra" if "Altra" in model
                    else "Grace Blackwell" if model.startswith("GB10") else model.split()[0])
    result = {"model": model, "vendor": candidate["vendor"], "productLine": product_line,
              "score": score, "metric": metric, "benchmarkVersion": version,
              "sourceUrl": candidate["sourceUrl"], "sourceCpuName": source_cpu,
              "systemName": candidate["systemName"], "cpuCount": chips, "enabledCores": cores,
              "baseCopies": int(copies_text), **values, "publishedDate": published_date,
              "retrievedDate": retrieved_date.isoformat(), "sourceDocumentSha256": evidence["sha256"]}
    if alias.get("testedComponent"):
        result["testedComponent"] = alias["testedComponent"]
        result["identityEvidenceUrls"] = alias["evidenceUrls"]
    return result


def build_snapshots(cache, all_reports=False, refresh_indexes=False, revalidate_reports=False, workers=6, discover=False):
    catalog, aliases = load_catalog(), load_aliases()
    retained = load_json(RETAINED_PATH)["reportsByMetric"]
    updates, reviews, summaries = [], [], []
    failures = []
    for suite, result_list, filename, metric in CONFIGS:
        index_url = f"{BASE}/{suite}/results/{result_list}/"
        index, index_evidence = cache.facts(index_url, "index", index_fields, refresh=refresh_indexes)
        candidates, excluded, summary = index_candidates(index, index_url, suite, catalog, aliases)
        selected, deferred = select_candidates(candidates, suite, retained.get(metric, []), all_reports)
        summary.update(metric=metric, sourceUrl=index_url, indexRetrievedAt=index_evidence["fetchedAt"],
                       sourceIndexSha256=index_evidence["sha256"], selectedReports=len(selected),
                       deferredReports=len(deferred))
        print(f"{metric}: {summary['uniqueIndexReports']} indexed / {len(candidates)} eligible exact reports / "
              f"{summary['eligibleExactModels']} models / {len(selected)} selected", flush=True)
        if discover:
            summaries.append(summary)
            continue
        rows = []
        def retrieve(candidate):
            report, evidence = cache.facts(candidate["sourceUrl"], metric,
                                           lambda raw: disclosure_fields(raw, suite, metric),
                                           refresh=revalidate_reports)
            return extract(candidate, suite, metric, report, evidence, aliases)
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(retrieve, candidate): candidate for candidate in selected}
            for completed, future in enumerate(as_completed(futures), 1):
                candidate = futures[future]
                try:
                    rows.append(future.result())
                except Exception as exc:
                    failures.append({"metric": metric, **candidate, "reason": str(exc)})
                if completed % 100 == 0 or completed == len(futures):
                    print(f"  verified {completed}/{len(futures)} disclosures; failures {len(failures)}", flush=True)
                    cache.save()
        if failures:
            continue
        rows.sort(key=lambda r: (r["benchmarkVersion"], r["cpuCount"], -r["score"], r["model"], r["sourceUrl"]))
        existing_meta = load_json(DATA / filename)["meta"]
        all_selected = suite == "cpu2026" or all_reports
        selection = ("Every unique exact-model one- or two-CPU candidate in the complete official rate index is included."
                     if all_selected else
                     "The two newest official submission IDs per exact CPU model and CPU count across all indexed quarters, "
                     "plus the fixed list of previously verified reports. Submission ID order is not publication-date order. "
                     "This selection broadens model coverage without importing every system disclosure; no score-based selection.")
        snapshot_date = datetime.fromisoformat(index_evidence["fetchedAt"]).date().isoformat()
        summary.update(acceptedReports=len(rows), acceptedModels=len({(r["vendor"],r["model"]) for r in rows}),
                       versions=dict(sorted(Counter(r["benchmarkVersion"] for r in rows).items())),
                       cpuCounts=dict(sorted(Counter(str(r["cpuCount"]) for r in rows).items())))
        meta = {"snapshotDate": snapshot_date, "source": existing_meta["source"], "sourceUrl": index_url,
                "metric": metric, "scope": f"Archive-wide exact enterprise CPU matches; 1/2 CPUs; {result_list} base rate",
                "selectionBasis": selection,
                "sourceLimitations": ("Published scores describe the tested CPU, memory, OS, compiler and tuning. "
                    "CPU2017 and CPU2026 scales are separate. CPU2026 test builds must remain separate comparison cohorts. "
                    "Index coverage does not mean every catalog CPU has a public result. "
                    + ("All matching reports in this index were checked." if all_selected else
                       "CPU2017 system reports are sampled by submission recency; use --all-reports for an exhaustive import.")),
                "trademarkNotice": existing_meta["trademarkNotice"], "fairUseUrl": existing_meta["fairUseUrl"],
                "indexRetrievedAt": index_evidence["fetchedAt"], "sourceIndexSha256": index_evidence["sha256"],
                "retrievalDateMeaning": "snapshotDate is index discovery date; each row's retrievedDate is its actual disclosure fetch date. Offline replay never changes either date.",
                "comparisonVersions": sorted(summary["versions"], key=lambda value: tuple(map(int,value.rsplit('v',1)[1].split('.')))),
                "selectionPolicy": "all-exact-reports" if all_selected else "latest-two-submission-ids-per-model-cpu-count-plus-retained",
                "coverage": {key: summary[key] for key in ("sourceIndexRows", "uniqueIndexReports", "duplicateIndexRows", "eligibleExactReports", "eligibleExactModels", "selectedReports", "deferredReports", "acceptedReports", "acceptedModels")}}
        if suite == "cpu2017":
            meta["versionCompatibilitySources"] = COMPATIBILITY_REFERENCES
        updates.append((DATA / filename, {"meta": meta, "results": rows}))
        summaries.append(summary)
        for item in excluded + deferred:
            reviews.append({"metric": metric, **item})
        print(f"  accepted {len(rows)} / {summary['acceptedModels']} models / versions {summary['versions']}", flush=True)
    cache.save()
    if failures:
        if cache.network:
            write_checked(ROOT / "tools/spec-import-failures.json", formatted({"failedSelectedReports": failures}))
        raise RuntimeError(f"{len(failures)} selected disclosures failed; no snapshot/review outputs changed. "
                           + ("See tools/spec-import-failures.json" if cache.network else str(failures[:3])))
    review = {"schemaVersion": 2, "selectionPolicy": "all-reports" if all_reports else "archive-wide-model-coverage",
              "snapshots": summaries, "reviewedAliasesFile": "tools/spec-model-aliases.json",
              "retainedReportsFile": "tools/spec-retained-reports.json",
              "excludedOrDeferredReports": sorted(reviews, key=lambda r: (r["metric"], r["sourceUrl"]))}
    return updates, review


def selected_policy(requested, review_path=REVIEW):
    """Replay the saved policy unless the maintainer explicitly chooses another."""
    if requested is not None:
        return requested
    path = Path(review_path)
    return path.exists() and load_json(path).get("selectionPolicy") == "all-reports"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    actions = parser.add_mutually_exclusive_group()
    actions.add_argument("--check", action="store_true", help="read-only offline replay against saved source evidence")
    actions.add_argument("--refresh", "--fetch", action="store_true", help="refresh official indexes and fetch missing selected disclosures")
    selection = parser.add_mutually_exclusive_group()
    selection.add_argument("--all-reports", dest="all_reports", action="store_true", default=None,
                           help="retrieve all eligible CPU2017 reports instead of two per model/CPU count")
    selection.add_argument("--latest-two", dest="all_reports", action="store_false",
                           help="explicitly select the bounded two-per-model/CPU-count policy")
    parser.add_argument("--discover", action="store_true", help="only report index coverage and selection, without publishing snapshots")
    parser.add_argument("--revalidate-reports", action="store_true", help="with --refresh, re-fetch already cached selected reports")
    parser.add_argument("--workers", type=int, choices=range(1,7), default=6, help="maximum simultaneous requests (1-6)")
    parser.add_argument("--cache-dir", type=Path, default=CACHE)
    parser.add_argument("--verify-cache", action="store_true", help="also reparse original cached HTML and compare it to retained fields")
    args = parser.parse_args()
    if args.revalidate_reports and not args.refresh:
        parser.error("--revalidate-reports requires --refresh")
    args.all_reports = selected_policy(args.all_reports)
    cache = SourceCache(args.cache_dir, network=args.refresh, verify_cache=args.verify_cache)
    updates, review = build_snapshots(cache, all_reports=args.all_reports, refresh_indexes=args.refresh,
                                     revalidate_reports=args.revalidate_reports, workers=args.workers, discover=args.discover)
    if args.discover:
        return
    outputs = updates + [(REVIEW, review)]
    if args.check:
        for path, payload in outputs:
            if not path.exists() or path.read_text(encoding="utf-8") != formatted(payload):
                raise ValueError(f"{path} differs from retained official-source replay")
        print("SPEC offline replay PASS; normalized input hashes, snapshots, selection and review queue match", flush=True)
        return
    # Nothing is published until every selected source has passed. Restore the
    # previous files if any write/read-back fails during the final publication.
    before = {path: path.read_bytes() if path.exists() else None for path, _ in outputs}
    try:
        for path, payload in outputs:
            write_checked(path, formatted(payload))
    except Exception:
        for path, body in before.items():
            if body is not None:
                path.write_bytes(body)
            elif path.exists():
                path.unlink()
        raise
    print("SPEC import written: " + str(sum(len(payload['results']) for _,payload in updates)) + " verified reports", flush=True)


if __name__ == "__main__":
    main()
