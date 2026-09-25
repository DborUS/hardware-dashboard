#!/usr/bin/env python3
"""Build the lazy-loaded comparison dataset from every source CSV field.

The normal dashboard tables intentionally show a small, useful subset.  This
file preserves the full non-empty row for the comparison dialog, keyed by the
same cleaned product name used by the browser.  Intel ARK exports are
transposed (products in columns); AMD exports are conventional row CSVs.
"""

import csv
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPECS = ROOT / "docs" / "specs"
OUT = ROOT / "js" / "data" / "compare-details.json"


def read_text(path):
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            pass
    raise ValueError(f"could not decode {path}")


def clean(value):
    return str(value or "").replace("\ufffd", "").strip()


def model_key(value):
    # Strip trademark glyphs before NFKD: Unicode expands ™ to the letters
    # "TM", which would otherwise become part of the lookup key.
    value = re.sub(r"[®™©]", "", clean(value))
    value = unicodedata.normalize("NFKD", value)
    value = value.replace("+", " plus ")
    value = re.sub(r"\b(?:intel|amd|nvidia|processor|cpu|graphics)\b", "", value,
                   flags=re.I)
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def add_value(fields, label, value):
    label, value = clean(label).rstrip("‡").strip(), clean(value)
    if not label or not value or value in ("—", "-"):
        return
    old = fields.get(label)
    if not old:
        fields[label] = value
    elif value not in [part.strip() for part in old.split(" | ")]:
        fields[label] = f"{old} | {value}"


def store(data, vendor, model, fields, source):
    key = model_key(model)
    if not key:
        return
    record = data[vendor].setdefault(key, {"fields": {}, "sources": []})
    for label, value in fields.items():
        add_value(record["fields"], label, value)
    if source not in record["sources"]:
        record["sources"].append(source)


def read_common_specs(path, data, only_vendor=None, missing_only=False):
    """Attach the shared master schema, including newer Intel parts without ARK CSVs."""
    for row in csv.DictReader(read_text(path).splitlines()):
        vendor = clean(row.get("vendor")).lower()
        model = first(row, "model_full", "model")
        if vendor not in data or not model or (only_vendor and vendor != only_vendor):
            continue
        key = model_key(model)
        record = data[vendor].setdefault(key, {"fields": {}, "sources": []})
        if missing_only and record.get("common"):
            continue
        record["common"] = {label: clean(value) for label, value in row.items()
                            if label and clean(value)}
        if not record["sources"]:
            record["sources"].append(clean(row.get("source_url")) or path.name)


def read_intel_transposed(path, data):
    rows = list(csv.reader(read_text(path).splitlines()))
    header_index = next(i for i, row in enumerate(rows)
                        if len(row) > 1 and not clean(row[0]))
    names = [clean(value) for value in rows[header_index][1:]]
    products = [dict() for _ in names]
    for row in rows[header_index + 1:]:
        if not row or not clean(row[0]):
            continue
        label = clean(row[0]).rstrip("‡").strip()
        for index, value in enumerate(row[1:]):
            if index < len(products):
                add_value(products[index], label, value)
    for name, fields in zip(names, products):
        store(data, "intel", name, fields, path.name)


def first(row, *labels):
    for label in labels:
        if clean(row.get(label)):
            return clean(row[label])
    return ""


def read_amd_rows(path, data):
    rows = csv.DictReader(read_text(path).splitlines())
    for row in rows:
        model = first(row, "Name", "model_full", "model", "Product Name")
        if model:
            store(data, "amd", model, row, path.name)


def count_models(data):
    return sum(len(records) for records in data.values())


def main():
    data = {"intel": {}, "amd": {}, "nvidia": {}}
    for folder in (SPECS / "source-csv-intel", SPECS / "source-csv-intel-gpu"):
        for path in sorted(folder.glob("*.csv")):
            read_intel_transposed(path, data)
    for path in sorted((SPECS / "source-csv").glob("*.csv")):
        read_amd_rows(path, data)
    read_amd_rows(SPECS / "amd-master.csv", data)
    for path in sorted((SPECS / "source-csv-nvidia").glob("*.csv")):
        rows = csv.DictReader(read_text(path).splitlines())
        for row in rows:
            model = first(row, "Name", "model_full", "model", "Product Name")
            if model:
                store(data, "nvidia", model, row, path.name)
    rows = csv.DictReader(read_text(SPECS / "nvidia-master.csv").splitlines())
    for row in rows:
        model = first(row, "model_full", "model", "Name")
        if model:
            store(data, "nvidia", model, row, "nvidia-master.csv")

    # Vendor masters feed the visible tables. The older cross-vendor master can
    # disagree with them on newly added products, so it must not override them.
    for vendor in ("amd", "intel", "nvidia"):
        read_common_specs(SPECS / f"{vendor}-master.csv", data)
    # Intel's newest Xeon models are in the maintained cross-vendor master but
    # have not yet appeared in an ARK export or intel-master.csv.
    read_common_specs(SPECS / "hardware-specs-master.csv", data,
                      only_vendor="intel", missing_only=True)

    text = json.dumps(data, ensure_ascii=True, separators=(",", ":")) + "\n"
    OUT.write_text(text, encoding="utf-8", newline="")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(text):,} bytes)")
    print(f"Intel: {len(data['intel']):,} products; AMD: {len(data['amd']):,} products; "
          f"NVIDIA: {len(data['nvidia']):,} products")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
