"""Build the small, exact-match benchmark lookup used by product spec tables.

The source snapshots and benchmark catalog remain authoritative. This generated
file records SPEC report availability and one selected published system report
per CPU model. The featured score is never a computed or intrinsic CPU score.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "js" / "data"
OUTPUT = DATA / "benchmark-table-index.js"
SPEC_FILES = {
    ("integer", "2017"): "enterprise-benchmark-sample.json",
    ("floating", "2017"): "enterprise-benchmark-fp-sample.json",
    ("integer", "2026"): "enterprise-benchmark-2026-int-sample.json",
    ("floating", "2026"): "enterprise-benchmark-2026-fp-sample.json",
}


def load_json(filename: str) -> dict:
    return json.loads((DATA / filename).read_text(encoding="utf-8"))


def key(vendor: str, model: str) -> str:
    return json.dumps([vendor.strip().lower(), model.strip().lower()], ensure_ascii=True, separators=(",", ":"))


def build() -> dict:
    catalog = load_json("benchmark-catalog.json")
    products = {key(row["vendor"], row["model"]): row for row in catalog["products"]}
    index: dict[str, dict] = {}
    dates: dict[str, str] = {}
    featured_cohorts: dict[str, dict[tuple[str, str, str, int], list[dict]]] = defaultdict(
        lambda: defaultdict(list)
    )

    for (metric, suite), filename in SPEC_FILES.items():
        payload = load_json(filename)
        dates[filename] = payload["meta"]["snapshotDate"]
        groups: dict[str, dict[tuple[str, int], int]] = defaultdict(lambda: defaultdict(int))
        for row in payload["results"]:
            product_key = key(row["vendor"], row["model"])
            product = products.get(product_key)
            if not product or payload["meta"]["metric"] not in product["snapshotMetrics"]:
                raise ValueError(f"Unmatched SPEC report: {filename}: {product_key}")
            if row["metric"] != payload["meta"]["metric"] or not row["benchmarkVersion"].startswith(f"SPEC CPU{suite} v"):
                raise ValueError(f"Unexpected SPEC metric/build: {filename}: {product_key}")
            if not isinstance(row["score"], (float, int)) or row["score"] <= 0:
                raise ValueError(f"Invalid SPEC score: {filename}: {product_key}")
            count = row["cpuCount"]
            if count not in (1, 2) or not row["sourceUrl"].startswith("https://www.spec.org/"):
                raise ValueError(f"Unexpected SPEC system: {filename}: {product_key}")
            build_name = row["benchmarkVersion"]
            groups[product_key][(build_name, count)] += 1
            featured_cohorts[product_key][(suite, metric, build_name, count)].append(row)
        for product_key, cohorts in groups.items():
            result = index.setdefault(product_key, {})
            result.setdefault(metric, {})[suite] = [
                [build_name.replace(f"SPEC CPU{suite} ", ""), count, report_count]
                for (build_name, count), report_count in sorted(cohorts.items())
            ]

    def cohort_priority(cohort: tuple[str, str, str, int]) -> tuple:
        suite, metric, build_name, cpus = cohort
        version = re.fullmatch(rf"SPEC CPU{suite} v(\d+(?:\.\d+)*)", build_name)
        if not version:
            raise ValueError(f"Unexpected SPEC build: {build_name}")
        return (int(suite), cpus == 1, metric == "integer",
                tuple(int(part) for part in version.group(1).split(".")))

    for product_key, cohorts in featured_cohorts.items():
        suite, metric, build_name, cpus = max(cohorts, key=cohort_priority)
        reports = sorted(cohorts[(suite, metric, build_name, cpus)],
                         key=lambda row: (row["score"], row["sourceUrl"]))
        # Match the explorer's lower-middle disclosed system report, not an average.
        featured = reports[(len(reports) - 1) // 2]
        index[product_key]["featuredSpec"] = {
            "suite": suite,
            "metric": metric,
            "build": build_name,
            "cpus": cpus,
            "score": featured["score"],
            "sourceUrl": featured["sourceUrl"],
            "reports": len(reports),
        }

    blender = load_json("benchmark-sample.json")
    dates["benchmark-sample.json"] = blender["meta"]["snapshotDate"]
    for row in blender["results"]:
        if row["deviceType"] != "CPU":
            continue
        product_key = key(row["vendor"], row["model"])
        product = products.get(product_key)
        if not product or blender["meta"]["metric"] not in product["snapshotMetrics"]:
            raise ValueError(f"Unmatched Blender CPU: {product_key}")
        if row["blenderVersion"] != "5.2.0" or row["computeType"] != "mixed":
            raise ValueError(f"Unexpected Blender cohort: {product_key}")
        url = urlparse(row["sourceUrl"])
        if url.scheme != "https" or url.hostname != "opendata.blender.org":
            raise ValueError(f"Unexpected Blender source: {product_key}")
        score = row["score"]
        if not isinstance(score, (float, int)) or score <= 0:
            raise ValueError(f"Invalid Blender score: {product_key}")
        result = index.setdefault(product_key, {})
        if "render" in result:
            raise ValueError(f"Duplicate Blender CPU: {product_key}")
        result["render"] = [score, row["samples"], row["sourceUrl"]]

    return {"snapshotDates": dict(sorted(dates.items())), "products": dict(sorted(index.items()))}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if the generated lookup is stale")
    args = parser.parse_args()
    output = "// Generated by tools/build-product-benchmark-index.py; do not edit by hand.\n"
    output += "var BENCHMARK_TABLE_INDEX = " + json.dumps(build(), ensure_ascii=True, separators=(",", ":")) + ";\n"
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != output:
            raise SystemExit("Benchmark product-table index is stale; rebuild it")
        print("Benchmark product-table index matches retained snapshots")
    else:
        OUTPUT.write_text(output, encoding="utf-8", newline="")
        assert OUTPUT.read_text(encoding="utf-8") == output
        print(f"Wrote {OUTPUT.relative_to(ROOT)} ({len(output)} bytes)")


if __name__ == "__main__":
    main()
