#!/usr/bin/env python3
"""
Convert an Intel ARK "Compare Products" CSV export into rows for tools/import-specs.py.

This is the reliable way to get Intel specs. ARK has no bulk CSV export, but its
Compare Products page (up to 4 SKUs at a time) has an "Export comparison" link that
produces official, structured data covering every field the dashboard needs -- no
scraping, no OCR, no transcription.

The export is TRANSPOSED relative to what the importer wants: fields run down the rows
and SKUs across the columns, with blank-line-separated section headers. This flips it.

Usage
-----
    # See what's in an export
    python3 tools/ark-compare.py inspect export1.csv

    # Convert one or more exports into a single importer-ready CSV
    python3 tools/ark-compare.py convert export1.csv export2.csv \\
        --family "Clearwater Forest" -o /tmp/clearwater.csv

    # Mobile parts: keeps P/E core counts and per-type clocks, drops socket
    python3 tools/ark-compare.py convert pantherlake*.csv \\
        --family "Panther Lake" --mobile -o /tmp/panther.csv

Then the normal path:
    python3 tools/import-specs.py inspect /tmp/clearwater.csv --target intel-cpu
    python3 tools/import-specs.py import /tmp/clearwater.csv --target intel-cpu \\
        --sku "Clearwater Forest" --map map.json --server --write
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path

# ARK label -> our CSV column. Only fields the dashboard actually renders.
FIELD_MAP = {
    "Processor Number": "Number",
    "Total Cores": "Cores",
    "# of Performance-cores": "PCores",
    "# of Efficient-cores": "ECores",
    "Total Threads": "Threads",
    "Max Turbo Frequency": "Boost",
    "Processor Base Frequency": "Base",
    "Performance-core Max Turbo Frequency": "PBoost",
    "Performance-core Base Frequency": "PBase",
    "Efficient-core Max Turbo Frequency": "EBoost",
    "Efficient-core Base Frequency": "EBase",
    "Cache": "Cache",
    "Total L3 Cache": "Cache",
    "TDP": "TDP",
    "Processor Base Power": "TDPBase",
    "Maximum Turbo Power": "TDPTurbo",
    "Sockets Supported": "Socket",
    "Scalability": "SocketCount",
    "PCI Express Revision": "PCIeRev",
    "Max # of PCI Express Lanes": "PCIeLanes",
    "Maximum Memory Speed": "MemSpeed",
    "Max # of Memory Channels": "MemChannels",
    "Memory Types": "MemTypes",
    "Launch Date": "Launch",
    "Lithography": "Process",
    "GPU Name": "iGPU",
    "GPU Name\u2021": "iGPU",
    "Graphics Max Dynamic Frequency": "iGPU_Freq",
    "Xe-cores": "iGPU_Cores",
}


def read_export(path):
    """
    Parse one ARK comparison export.

    Returns (sku_names, {ark_label: [value_per_sku]}). Section headers are single-cell
    rows and are skipped; the SKU header row is the first row whose first cell is blank.
    """
    raw = Path(path).read_bytes()
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        sys.exit(f"could not decode {path}")

    rows = list(csv.reader(text.splitlines()))
    skus, fields = None, {}
    for row in rows:
        if not row or not any(c.strip() for c in row):
            continue
        label = row[0].strip()
        values = [c.strip() for c in row[1:]]
        # header row: empty first cell, product names across
        if not label and any(values):
            skus = [clean_name(v) for v in values if v]
            continue
        if skus is None:
            continue           # title / timestamp lines before the header
        if not values or not any(values):
            continue           # section header
        fields[label] = values
    if not skus:
        sys.exit(f"{path}: no SKU header row found — is this an ARK comparison export?")
    return skus, fields


def clean_name(s):
    """'Intel® Xeon® 6990E+ processor ' -> 'Xeon 6990E+'"""
    s = s.replace("®", "").replace("™", "")
    s = re.sub(r"\bIntel\b", "", s)
    s = re.sub(r"\bprocessor\b", "", s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip()


def tidy(field, value):
    """Normalise to the house style used by existing rows."""
    if not value:
        return ""
    if field in ("TDP", "TDPBase", "TDPTurbo"):
        return re.sub(r"(\d)\s*W\b", r"\1W", value)      # '450 W' -> '450W'
    if field == "Cache":
        # '18 MB Intel(R) Smart Cache' -> '18 MB', matching existing rows
        m = re.match(r"([\d.]+\s*[KMG]B)", value)
        if m:
            return m.group(1)
    if field == "MemSpeed":
        # ARK reports memory speed in MHz; the dashboard's existing rows use MT/s
        m = re.match(r"([\d.]+)\s*MHz", value)
        if m:
            return f"Up to {m.group(1)} MT/s"
    return value


def classify(name, collection, launch, rules):
    """
    Pick a SKU key for one row.

    ARK groups by marketing collection ("Core Ultra processors (Series 1)"), but the
    dashboard keys on codename+segment ("Meteor Lake-H"). Rules are matched in order on
    "collection-substring|launch|suffix", where launch and suffix may be "*".
    """
    suffix = ""
    m = re.search(r"\b[A-Z]*\d{3,4}([A-Z]{0,3})\b", name)
    if m:
        suffix = m.group(1).upper()
    if re.search(r"\bPlus\b", name, re.I):
        suffix += "PLUS"        # '270K Plus' -> KPLUS, '290HX Plus' -> HXPLUS
    for key, sku in rules.items():
        parts = (key.split("|") + ["*", "*", "*"])[:4]
        coll_pat, launch_pat, suf_pat, name_pat = parts
        if coll_pat not in collection:
            continue
        if launch_pat not in ("*", launch):
            continue
        if not (suf_pat == "*" or suf_pat == suffix or suffix in suf_pat.split(",")):
            continue
        # 4th component matches against the model name, for cases the collection
        # doesn't distinguish (e.g. Ice Lake i3-1005G1 sits in the 10th-gen collection)
        if name_pat != "*" and name_pat not in name:
            continue
        return sku
    return None


def tidy_memtypes(v):
    """
    Normalise ARK's two "Memory Types" formats to 'TYPE-SPEED / TYPE-SPEED'.

    Newer parts run the variants together with no separator:
        'Up to LPDDR5/X 7467 MT/sUp to DDR5 5600 MT/s' -> 'LPDDR5/X-7467 / DDR5-5600'
    Older parts use pipes and are already in TYPE-SPEED form:
        'DDR4-2666 |  LPDDR3-2133 |  LPDDR4-2933'     -> 'DDR4-2666 / LPDDR3-2133 / ...'
    """
    if not v:
        return ""
    if "|" in v:
        return " / ".join(p.strip() for p in v.split("|") if p.strip())
    parts = [p.strip() for p in re.split(r"(?=Up to)", v) if p.strip()]
    out = []
    for p in parts:
        m = re.match(r"Up to\s+(.+?)\s+([\d.]+)\s*MT/s", p)
        out.append(f"{m.group(1)}-{m.group(2)}" if m else p)
    return " / ".join(out)


def build_rows(paths, family, mobile, rules=None):
    out = []
    for p in paths:
        skus, fields = read_export(p)
        print(f"  {Path(p).name}: {len(skus)} SKUs, {len(fields)} fields", file=sys.stderr)
        colls = fields.get("Product Collection", [])
        launches = fields.get("Launch Date", [])
        for i, sku in enumerate(skus):
            fam = family
            if rules is not None:
                fam = classify(sku,
                               colls[i] if i < len(colls) else "",
                               launches[i] if i < len(launches) else "",
                               rules)
                if fam is None:
                    continue      # not part of this import
            rec = {"Family": fam, "Name": sku}
            for ark_label, col in FIELD_MAP.items():
                vals = fields.get(ark_label)
                if not vals or i >= len(vals):
                    continue
                v = tidy(col, vals[i])
                if v and not rec.get(col):
                    rec[col] = v
            # Compose the fields the dashboard stores as one string
            if rec.get("PCIeRev") and rec.get("PCIeLanes"):
                rec["PCIe"] = f"PCIe {rec['PCIeRev'].replace('Gen', '')}.0 x{rec['PCIeLanes']}"
            elif rec.get("PCIeRev"):
                rec["PCIe"] = rec["PCIeRev"]
            # Mobile parts leave "Processor Base Frequency" blank and give per-core-type
            # figures instead. Use the P-core base as the headline, matching how Intel
            # markets these ("up to 5.1 GHz" is likewise the P-core turbo).
            if not rec.get("Base") and rec.get("PBase"):
                rec["Base"] = rec["PBase"]
            if not rec.get("Boost") and rec.get("PBoost"):
                rec["Boost"] = rec["PBoost"]
            # Server parts report "Maximum Memory Speed"; mobile parts leave that blank
            # and put the detail in "Memory Types" instead. Prefer the explicit speed.
            mem = rec.get("MemSpeed") or tidy_memtypes(rec.get("MemTypes", ""))
            if mem:
                # Channel count matters as much as speed, so carry it in the same
                # column: "Up to 8000 MT/s / 12ch"
                rec["Memory"] = mem
                if rec.get("MemChannels"):
                    rec["Memory"] += f" / {rec['MemChannels']}ch"
            # base/turbo TDP as one column, per Daniel's request
            if rec.get("TDPBase") and rec.get("TDPTurbo"):
                rec["TDP"] = f"{rec['TDPBase']}/{rec['TDPTurbo']}"
            if mobile:
                rec.pop("Socket", None)          # laptop parts are soldered; no socket
                rec.pop("SocketCount", None)
            out.append(rec)
    return out


COLUMNS = ["Family", "Name", "Cores", "PCores", "ECores", "Threads",
           "Base", "Boost", "PBase", "PBoost", "EBase", "EBoost",
           "Cache", "TDP", "Socket", "SocketCount", "PCIe", "Memory", "MemChannels",
           "iGPU", "iGPU_Cores", "iGPU_Freq", "Process", "Launch"]


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("inspect", help="list SKUs and ARK labels in an export")
    p.add_argument("csv")

    p = sub.add_parser("convert", help="transpose export(s) into importer rows")
    p.add_argument("csvs", nargs="+")
    p.add_argument("--family", help="SKU key for every row (single-family export)")
    p.add_argument("--split", metavar="RULES.json",
                   help="classify rows into families instead of using one --family. "
                        "JSON: {\"collection substring|launch|suffix\": \"SKU key\"}")
    p.add_argument("--mobile", action="store_true", help="drop socket columns")
    p.add_argument("-o", "--out", help="write CSV (default: print)")

    args = ap.parse_args()

    if args.cmd == "inspect":
        skus, fields = read_export(args.csv)
        print(f"{len(skus)} SKUs: {', '.join(skus)}\n")
        print(f"{len(fields)} fields. Ones we map:\n")
        for label, vals in fields.items():
            if label in FIELD_MAP:
                print(f"  {label:<42} -> {FIELD_MAP[label]:<12} {vals[0][:28]}")
        unmapped = [l for l in fields if l not in FIELD_MAP]
        print(f"\n{len(unmapped)} unmapped ARK fields (ignored).")
        return 0

    if not args.family and not args.split:
        sys.exit("need --family or --split")
    rules = None
    if args.split:
        with open(args.split, encoding="utf-8") as f:
            rules = json.load(f)
    rows = build_rows(args.csvs, args.family, args.mobile, rules)
    # de-duplicate: ARK compare lists are cumulative, so the same SKU often appears
    # in several exports. First occurrence wins.
    seen, uniq = set(), []
    for r in rows:
        k = (r["Family"], r["Name"])
        if k in seen:
            continue
        seen.add(k)
        uniq.append(r)
    if len(uniq) != len(rows):
        print(f"  de-duplicated {len(rows)-len(uniq)} repeated SKUs", file=sys.stderr)
    rows = uniq
    cols = [c for c in COLUMNS if any(r.get(c) for r in rows)]
    if args.out:
        with open(args.out, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
            w.writeheader()
            w.writerows(rows)
        print(f"\nwrote {len(rows)} rows to {args.out}")
        print(f"columns: {', '.join(cols)}")
    else:
        w = csv.DictWriter(sys.stdout, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    return 0


if __name__ == "__main__":
    sys.exit(main())
