#!/usr/bin/env python3
"""Build the benchmark catalog from exact dashboard spec rows.

The dashboard renderer decides which source records appear on each tab. This
tool reads those records in a local browser, checks every rendered table row
against its source record, and refuses count or identity drift. It never
infers commercial release status from a displayed specification row.

Run: python tools/build-benchmark-catalog.py --check
     python tools/build-benchmark-catalog.py --write
"""

from __future__ import annotations

import argparse
import functools
import hashlib
import http.server
import json
import re
import socketserver
import threading
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import quote, unquote

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "js" / "data"
OUTPUT = DATA / "benchmark-catalog.json"
ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
TAB_COUNTS = {
    "amd/epyc": 350,
    "amd/ryzen": 774,
    "amd/gpu": 303,
    "intel/xeon": 553,
    "intel/client": 340,
    "intel/graphics": 35,
    "nvidia/datacenter": 20,
    "nvidia/geforce": 47,
    "nvidia/cpu": 4,
    "ampere/processors": 26,
}
SNAPSHOTS = (
    "enterprise-benchmark-sample.json",
    "enterprise-benchmark-fp-sample.json",
    "enterprise-benchmark-2026-int-sample.json",
    "enterprise-benchmark-2026-fp-sample.json",
    "enterprise-benchmark-mlperf-v6-server-sample.json",
    "enterprise-benchmark-mlperf-v6-offline-sample.json",
    "benchmark-sample.json",
)
AMD_SOURCE_ROWS = r"""() => {
  const tab = a2Tab;
  const dataFile = tab === 'gpu' ? 'amd-gpu-data.json' : 'amd-cpu-specs.json';
  return A2_DATA[tab].gens.filter(group => !group.era).flatMap(group =>
    (group.families || []).flatMap(family => {
      const key = a2Key(family);
      const sourceGroup = tab === 'gpu'
        ? (a2Specs.gpu || []).find(item => item.arch === key)
        : (a2Specs.cpu || {})[key];
      const rawRows = tab === 'gpu'
        ? (sourceGroup?.gpuSpecs?.models || []) : (sourceGroup || []);
      return a2Models(family).map(record => {
        const sourceIndex = rawRows.indexOf(record);
        if (sourceIndex < 0) throw new Error('AMD renderer row lacks a source record');
        const groupIndex = tab === 'gpu' ? (a2Specs.gpu || []).indexOf(sourceGroup) : -1;
        if (tab === 'gpu' && groupIndex < 0) throw new Error('AMD GPU source group is absent');
        const pointerKey = key.replace(/~/g, '~0').replace(/\//g, '~1');
        const sourcePointer = tab === 'gpu'
          ? `/${groupIndex}/gpuSpecs/models/${sourceIndex}`
          : `/${pointerKey}/${sourceIndex}`;
        return {
          model: String(record.n || record.name || '').trim(),
          productId: tab === 'gpu' ? null : (record.tr || null),
          sourceRecordRef: `${dataFile}#${sourcePointer}`,
          sourceGroup: key,
          displayGroup: group.name,
          sourceSeries: record._series || null,
          sourceSegment: tab === 'gpu' ? (sourceGroup.segment || null) : null,
        };
      });
    }));
}"""
DOM_ROWS = r"""selector => [...document.querySelectorAll(selector)].map(row => {
  const cells = [...row.cells];
  const productHeader = [...row.closest('table').querySelectorAll('thead th')]
    .find(header => ['Product ID', 'Part Number'].includes(header.textContent.trim()));
  const productId = productHeader ? cells[productHeader.cellIndex]?.textContent.trim() : null;
  return {
    model: cells[0].textContent.trim(),
    productId: productId && productId !== '—' ? productId : null,
  };
})"""


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class LocalServer(socketserver.ThreadingTCPServer):
    daemon_threads = True
    request_queue_size = 64
    allow_reuse_address = True


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def normalize_id(value):
    if value is None or str(value).strip() in ("", "—"):
        return None
    return str(value).strip()


def pointer_token(value):
    return str(value).replace("~", "~0").replace("/", "~1")


def normalize_ref(reference):
    filename, marker, pointer = reference.partition("#")
    require(marker == "#" and pointer.startswith("/"),
            f"source reference is not a JSON pointer: {reference}")
    # RFC 6901 URI-fragment form: escape JSON Pointer tokens first, then
    # percent-encode the complete pointer while retaining separator slashes.
    return filename + "#" + quote(pointer, safe="/~")


SOURCE_CACHE = {}


def source_record(reference):
    filename, marker, pointer = reference.partition("#")
    require(marker == "#" and filename in {
        "amd-cpu-specs.json", "amd-gpu-data.json", "intel-xeon-specs.json",
        "intel-client-specs.json", "intel-graphics-specs.json",
        "nvidia-data.json", "ampere-data.json",
    }, f"invalid source record reference: {reference}")
    require(pointer.startswith("/") and quote(unquote(pointer), safe="/~") == pointer,
            f"not a canonical JSON Pointer URI fragment: {reference}")
    decoded_pointer = unquote(pointer)
    if filename not in SOURCE_CACHE:
        SOURCE_CACHE[filename] = load_json(DATA / filename)
    record = SOURCE_CACHE[filename]
    try:
        for raw_token in decoded_pointer.split("/")[1:]:
            require(not re.search(r"~(?![01])", raw_token),
                    f"invalid JSON Pointer token in {reference}")
            token = raw_token.replace("~1", "/").replace("~0", "~")
            record = record[int(token)] if isinstance(record, list) else record[token]
    except (IndexError, KeyError, TypeError, ValueError) as exc:
        raise AssertionError(f"source record reference does not resolve: {reference}") from exc
    require(isinstance(record, dict), f"source record is not an object: {reference}")
    return record



CPU_SPEC_FILES = {
    "amd-cpu-specs.json", "intel-xeon-specs.json",
    "intel-client-specs.json", "nvidia-data.json", "ampere-data.json",
}
MISSING_SPEC_TEXT = {"", "-", "—", "�", "N/A", "NA"}


def spec_text(record, key):
    value = record.get(key)
    if value is None:
        return None
    text = str(value).strip()
    return text if text not in MISSING_SPEC_TEXT else None


def spec_integer(record, key, reference):
    value = spec_text(record, key)
    if value is None:
        return None
    require(value.isdecimal(), f"{reference}: {key} is not an integer specification")
    return int(value)


def product_specs(reference):
    """Display labels from one exact dashboard product row, not benchmark SUT data."""
    filename, _, pointer = reference.partition("#")
    if filename not in CPU_SPEC_FILES or (
            filename == "nvidia-data.json" and not pointer.startswith("/cpu/")):
        return None
    record = source_record(reference)
    model = record["n"]
    cores = None
    core_label = None
    clock_label = None
    power_label = None

    if filename == "amd-cpu-specs.json":
        cores = spec_integer(record, "c", reference)
        if cores:
            unit = " / CPU" if str(record.get("_family", "")).startswith("EPYC") else ""
            core_label = f"{cores} {'core' if cores == 1 else 'cores'}{unit}"
        base, boost = spec_text(record, "bas"), spec_text(record, "bst")
        if base or boost:
            pieces = []
            if base:
                pieces.append(f"{base} base")
            if boost:
                boost = "up to " + boost[6:] if boost.startswith("Up to ") else boost
                pieces.append(f"{boost} boost")
            clock_label = " · ".join(pieces)
        power = spec_text(record, "tdp")
        if power:
            power_label = f"{power} TDP"

    elif filename in {"intel-xeon-specs.json", "intel-client-specs.json"}:
        p_cores = spec_integer(record, "pc", reference) or 0
        e_cores = spec_integer(record, "ec", reference) or 0
        cores = p_cores + e_cores
        if cores:
            if p_cores and e_cores:
                core_label = f"{cores} cores ({p_cores} P + {e_cores} E)"
            elif e_cores:
                core_label = f"{e_cores} {'E-core' if e_cores == 1 else 'E-cores'}"
            elif filename == "intel-client-specs.json":
                core_label = f"{p_cores} {'P-core' if p_cores == 1 else 'P-cores'}"
            else:
                core_label = f"{p_cores} {'core' if p_cores == 1 else 'cores'}"
            if filename == "intel-xeon-specs.json":
                core_label += " / CPU"
        if filename == "intel-xeon-specs.json":
            base, boost = spec_text(record, "bas"), spec_text(record, "bst")
            clock_label = " · ".join(part for part in (
                f"{base} base" if base else None,
                f"{boost} max turbo" if boost else None,
            ) if part) or None
        else:
            clock_parts = []
            for kind, key, count in (("P", "pcl", p_cores), ("E", "ecl", e_cores)):
                clock = spec_text(record, key)
                if clock and count:
                    qualifier = " (base / max turbo)" if " / " in clock else ""
                    clock_parts.append(f"{kind}-core {clock}{qualifier}"
                                       if qualifier else f"{kind}-core clock {clock}")
            clock_label = " · ".join(clock_parts) or None
        power = spec_text(record, "tdp")
        if power:
            if " / " in power:
                parts = [part.strip() for part in power.split(" / ")]
                require(len(parts) == 2 and all(re.fullmatch(r"\d+(?:\.\d+)?W", part)
                                                for part in parts),
                        f"{reference}: ambiguous Intel base/max power pair")
                power_label = f"{parts[0]} base / {parts[1]} max turbo power"
            else:
                power_label = (f"{power} TDP" if filename == "intel-xeon-specs.json"
                               else f"{power} power rating")

    elif filename == "ampere-data.json":
        cores = spec_integer(record, "cores", reference)
        if cores:
            core_label = f"{cores} {'core' if cores == 1 else 'cores'} / CPU"
        frequency = record.get("frequency")
        frequency_type = spec_text(record, "frequencyType")
        if frequency is not None:
            require(type(frequency) in (int, float) and frequency > 0,
                    f"{reference}: invalid Ampere frequency")
            ghz = f"{frequency:g} GHz"
            clock_labels = {
                "Published frequency": f"{ghz} published frequency",
                "Sustained": f"{ghz} sustained frequency",
                "Up to with Turbo": f"up to {ghz} turbo",
            }
            require(frequency_type in clock_labels,
                    f"{reference}: unreviewed Ampere frequency qualifier")
            clock_label = clock_labels[frequency_type]
        # Most Ampere watt figures are measured usage power, not TDP.
        tdp = record.get("tdp")
        if tdp is not None:
            require(type(tdp) in (int, float) and tdp > 0,
                    f"{reference}: invalid Ampere TDP")
            power_label = f"{tdp:g}W TDP"

    else:  # NVIDIA CPU or CPU component of a superchip.
        cores = spec_integer(record, "cores", reference)
        if cores:
            if "Superchip" in model:
                core_label = f"{cores} CPU {'core' if cores == 1 else 'cores'} / superchip"
            else:
                core_label = f"{cores} {'core' if cores == 1 else 'cores'} / CPU"
        # NVIDIA's listed superchip power may include memory and/or GPU. Do
        # not present it as CPU power, and no CPU clock is supplied.

    threads = spec_integer(record, "t" if filename in {
        "amd-cpu-specs.json", "intel-xeon-specs.json", "intel-client-specs.json",
    } else "threads", reference)
    if core_label and threads:
        require(cores is not None and threads >= cores,
                f"{reference}: source threads are fewer than source cores")
        thread_unit = " / CPU" if core_label.endswith("/ CPU") else ""
        core_label += f" · {threads} {'thread' if threads == 1 else 'threads'}{thread_unit}"

    fields = {"coreLabel": core_label, "clockLabel": clock_label,
              "powerLabel": power_label}
    result = {key: value for key, value in fields.items() if value}
    require(result, f"{reference}: CPU product has no reviewed specification")
    return result


def source_rows(tab):
    vendor, subtab = tab.split("/")
    if vendor == "amd":
        raise AssertionError("AMD source rows must come from the live renderer mapping")
    if vendor == "intel":
        filename = f"intel-{subtab}-specs.json"
        groups = load_json(DATA / filename)
        return [
            {"model": record["n"], "productId": None,
             "sourceRecordRef": f"{filename}#/{pointer_token(group)}/{index}",
             "sourceGroup": group, "displayGroup": None,
             "sourceSeries": None, "sourceSegment": None}
            for group, records in groups.items()
            for index, record in enumerate(records)
        ]
    if vendor == "nvidia":
        filename = "nvidia-data.json"
        records = load_json(DATA / filename)[subtab]
        return [
            {"model": record["n"], "productId": None,
             "sourceRecordRef": f"{filename}#/{subtab}/{index}",
             "sourceGroup": record.get("series"), "displayGroup": None,
             "sourceSeries": record.get("series"),
             "sourceSegment": record.get("segment")}
            for index, record in enumerate(records)
        ]
    filename = "ampere-data.json"
    records = load_json(DATA / filename)["processors"]
    return [
        {"model": record["n"], "productId": normalize_id(record.get("partNumber")),
         "sourceRecordRef": f"{filename}#/processors/{index}",
         "sourceGroup": record.get("series"), "displayGroup": None,
         "sourceSeries": record.get("series"), "sourceSegment": None}
        for index, record in enumerate(records)
    ]


def rendered_rows(page, tab):
    vendor, subtab = tab.split("/")
    if vendor == "amd":
        page.locator("#tabAmd").click()
        page.locator(f'.a2-subtab[data-tab="{subtab}"]').click()
    else:
        page.locator(f"#tab{vendor.capitalize()}").click()
        if vendor in ("intel", "nvidia"):
            cls = "v2" if vendor == "intel" else "n2"
            page.locator(f'.{cls}-subtab[data-tab="{subtab}"]').click()
    page.locator("#expandAllBtn").click()
    selector = ".arch-group:not(.dashboard-roadmap):not(.p2-roadmap) .cpu-spec-table tbody tr[data-search]"
    page.wait_for_function(
        "([selector, count]) => document.querySelectorAll(selector).length === count",
        arg=[selector, TAB_COUNTS[tab]],
    )
    dom = page.evaluate(DOM_ROWS, selector)
    rows = page.evaluate(AMD_SOURCE_ROWS) if vendor == "amd" else source_rows(tab)
    require(len(rows) == TAB_COUNTS[tab],
            f"{tab}: source mapping has {len(rows)} rows; expected {TAB_COUNTS[tab]}")
    expected = Counter((row["model"], normalize_id(row["productId"])) for row in rows)
    actual = Counter((row["model"], normalize_id(row["productId"])) for row in dom)
    require(actual == expected,
            f"{tab}: rendered model/product IDs differ from source records; "
            f"missing {list((expected - actual).items())[:3]}, "
            f"extra {list((actual - expected).items())[:3]}")
    for row in rows:
        row["sourceRecordRef"] = normalize_ref(row["sourceRecordRef"])
        require(isinstance(row["model"], str) and row["model"].strip(),
                f"{tab}: blank model name in {row['sourceRecordRef']}")
        require(isinstance(row["sourceRecordRef"], str) and row["sourceRecordRef"],
                f"{tab}: missing source record reference")
        record = source_record(row["sourceRecordRef"])
        require(record.get("n", record.get("name")) == row["model"],
                f"{tab}: source pointer resolves to another model: {row['sourceRecordRef']}")
        require(normalize_id(record.get("tr", record.get("partNumber")))
                == normalize_id(row["productId"]),
                f"{tab}: source pointer resolves to another product ID: {row['sourceRecordRef']}")
    return rows


def eligible_tabs(row):
    metric = row.get("metric", "")
    if metric.startswith("SPECrate"):
        return {"amd/epyc", "intel/xeon", "nvidia/cpu", "ampere/processors"}
    if metric.startswith("MLPerf_Inference"):
        return {"amd/gpu", "nvidia/datacenter"}
    if row.get("deviceType") == "CPU":
        return {"amd/ryzen", "intel/client"}
    return {"amd/gpu", "intel/graphics", "nvidia/datacenter", "nvidia/geforce"}


def build_payload(page):
    page.goto(base_url, wait_until="networkidle")
    # AMD's sub-tabs become visible only after its specification fetch and
    # renderer finish; network idle alone can precede that asynchronous work.
    page.locator("#a2Subtabs.visible").wait_for(state="visible")
    require(page.locator("#searchInput").input_value() == "",
            "dashboard search must be clear when building the catalog")
    products_by_key = {}
    seen_ids = {}
    tab_products = defaultdict(set)
    for tab, count in TAB_COUNTS.items():
        vendor = tab.split("/")[0].upper()
        rows = rendered_rows(page, tab)
        for row in rows:
            model = row["model"].strip()
            product_id = normalize_id(row["productId"])
            # A source SKU can be placed on more than one dashboard tab. The
            # model and product ID form a stable key across those placements;
            # below we also require its source record to be identical.
            key = (vendor, model, product_id)
            source_specs = product_specs(row["sourceRecordRef"])
            if key not in products_by_key:
                canonical = json.dumps(key, ensure_ascii=True, separators=(",", ":"))
                digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:20]
                catalog_id = f"{vendor.lower()}-{digest}"
                require(catalog_id not in seen_ids or seen_ids[catalog_id] == key,
                        f"catalog ID collision for {key}")
                seen_ids[catalog_id] = key
                products_by_key[key] = {
                    "id": catalog_id,
                    "vendor": vendor,
                    "dashboardTabs": [],
                    "model": model,
                    "productId": product_id,
                    "sourceRecordRef": row["sourceRecordRef"],
                    "sourceSeries": row["sourceSeries"],
                    "sourceSegment": row["sourceSegment"],
                    "catalogEligibility": "displayed-spec-row",
                    "commercialReleaseStatus": "unverified",
                    "snapshotMetrics": [],
                    "placements": [],
                }
                if source_specs is not None:
                    products_by_key[key]["productSpecs"] = source_specs
            product = products_by_key[key]
            require(product.get("productSpecs") == source_specs,
                    f"{tab} {model}: conflicting product specifications across placements")
            require(product["sourceRecordRef"] == row["sourceRecordRef"],
                    f"{tab} {model}: one catalog identity maps to distinct source records")
            require(product["sourceSeries"] == row["sourceSeries"]
                    and product["sourceSegment"] == row["sourceSegment"],
                    f"{tab} {model}: one catalog identity has conflicting source categories")
            if tab not in product["dashboardTabs"]:
                product["dashboardTabs"].append(tab)
            product["placements"].append({
                "dashboardTab": tab,
                "displayGroup": row["displayGroup"],
                "sourceGroup": row["sourceGroup"],
            })
            tab_products[tab].add(key)
        require(len(rows) == count, f"{tab}: unexpected displayed row count")

    require(sum(TAB_COUNTS.values()) == 2452, "displayed row total drifted from 2,452")
    require(len(products_by_key) == 2431,
            f"catalog identity count {len(products_by_key)} differs from 2,431")
    require(sum(len(keys) for keys in tab_products.values()) == 2437,
            "the per-tab identities must total 2,437 before cross-tab deduplication")
    shared = [product for product in products_by_key.values()
              if len(product["dashboardTabs"]) > 1]
    require(len(shared) == 6 and all(product["dashboardTabs"] == ["amd/epyc", "amd/ryzen"]
                                     for product in shared),
            "the six reviewed AMD EPYC/Ryzen source overlaps changed")
    require(len(tab_products["amd/epyc"]) == 335,
            "the 15 repeated EPYC placements no longer resolve to 335 source SKUs")
    require(len(tab_products["amd/ryzen"]) == 774,
            "Ryzen identities must retain product-ID variants with the same name")
    name_groups = defaultdict(set)
    for vendor, model, product_id in products_by_key:
        name_groups[(vendor, model)].add(product_id)
    require(all(None not in ids for ids in name_groups.values() if len(ids) > 1),
            "a duplicate model name needs explicit product IDs to distinguish SKUs")

    # These are only matches to this site's checked snapshots. Absence means
    # "not in the current snapshot", never "no published result exists".
    matched = set()
    benchmark_snapshots = []
    for filename in SNAPSHOTS:
        payload = load_json(DATA / filename)
        metric = payload["meta"]["metric"]
        per_metric = set()
        for row in payload["results"]:
            tabs = eligible_tabs(row)
            candidates = [product for key, product in products_by_key.items()
                          if key[0] == row["vendor"].upper()
                          and key[1] == row["model"]
                          and any(tab in tabs for tab in product["dashboardTabs"])
                          and (not metric.startswith("MLPerf_Inference")
                               or product["sourceSegment"] == "datacenter")]
            require(len(candidates) == 1,
                    f"{filename}: {row['vendor']} {row['model']} resolves to "
                    f"{len(candidates)} catalog identities")
            product = candidates[0]
            if metric not in product["snapshotMetrics"]:
                product["snapshotMetrics"].append(metric)
            matched.add(product["id"])
            per_metric.add(product["id"])
        benchmark_snapshots.append({"filename": filename, "metric": metric,
                                    "coveredProducts": len(per_metric)})
    require(matched, "no benchmark snapshot products matched the catalog")

    products = sorted(products_by_key.values(), key=lambda p: (
        list(TAB_COUNTS).index(p["dashboardTabs"][0]), p["model"].casefold(), p["productId"] or ""))
    for product in products:
        product["snapshotMetrics"].sort()
    require(sum(len(product["placements"]) for product in products) == 2452,
            "catalog placements do not reproduce all displayed rows")
    return {
        "meta": {
            "schemaVersion": 1,
            "scope": "All model rows displayed in non-roadmap dashboard specification tables.",
            "catalogEligibilityMeaning": "displayed-spec-row records a model in a dashboard spec table; roadmap cards without model rows are excluded.",
            "commercialReleaseStatusMeaning": "unverified means the catalog data does not provide a consistent release or availability field across vendors.",
            "snapshotCoverageMeaning": "A metric in snapshotMetrics has a result in this site's fixed checked snapshot. An empty array does not establish that no public benchmark exists.",
            "displayedPlacements": 2452,
            "uniqueCatalogProducts": 2431,
            "perTabProductIdentities": 2437,
            "crossTabSharedProducts": 6,
            "productsInCurrentSnapshots": len(matched),
            "dashboardTabRows": TAB_COUNTS,
            "dashboardTabProducts": {tab: len(tab_products[tab]) for tab in TAB_COUNTS},
            "benchmarkSnapshots": benchmark_snapshots,
        },
        "products": products,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--check", action="store_true", help="Verify the checked-in catalog is current")
    action.add_argument("--write", action="store_true", help="Regenerate the checked-in catalog")
    options = parser.parse_args()
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = LocalServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base_url = f"http://127.0.0.1:{server.server_address[1]}/"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, args=ARGS)
            try:
                page = browser.new_page(viewport={"width": 1440, "height": 900})
                payload = build_payload(page)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
    output = json.dumps(payload, ensure_ascii=True, indent=4) + "\n"
    if options.write:
        OUTPUT.write_text(output, encoding="utf-8")
        require(OUTPUT.read_text(encoding="utf-8") == output,
                "catalog write/readback mismatch")
        print(f"Wrote {OUTPUT.relative_to(ROOT)}: {len(payload['products'])} products, "
              f"{payload['meta']['displayedPlacements']} placements")
    else:
        require(OUTPUT.read_text(encoding="utf-8") == output,
                "checked-in benchmark catalog differs from the current dashboard and snapshots")
        print(f"Benchmark catalog PASS: {len(payload['products'])} products, "
              f"{payload['meta']['displayedPlacements']} placements, "
              f"{payload['meta']['productsInCurrentSnapshots']} products in checked snapshots")
