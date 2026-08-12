#!/usr/bin/env python3
"""
Import CPU/GPU specs from a vendor CSV into the dashboard's JSON data files.

Every silent failure this project has hit is checked here:
  - SKU key not matching any architecture entry -> table never renders
  - brand/tag values with no chip in VENDOR_CONFIG -> unreachable by filter
  - _srv set wrongly -> desktop parts render server columns
  - unit phrasing drifting from neighbouring rows -> looks inconsistent

Usage
-----
  # 1. See what's in the CSV
  python3 tools/import-specs.py inspect downloads/epyc-9006.csv

  # 2. Dry run: show exactly what would change, touch nothing
  python3 tools/import-specs.py import downloads/epyc-9006.csv \
      --target amd-cpu --sku "Verano" --map map.json --server

  # 3. Same command with --write to actually apply it
  python3 tools/import-specs.py import ... --write

  # 4. Round-trip check: dump existing JSON back out as CSV
  python3 tools/import-specs.py export --target amd-cpu --sku Turin

A mapping file is JSON: {"csv column name": "schema field"}. Run `inspect` first --
it prints a starter mapping with its best guesses, which you then correct by hand.
Guessing is only ever a starting point; the importer never guesses at import time.
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "js" / "data"

TARGETS = {
    "amd-cpu": {"specs": "amd-cpu-specs.json", "arch": "amd-data.json", "kind": "cpu"},
    "intel-cpu": {"specs": "intel-cpu-specs.json", "arch": "intel-data.json", "kind": "cpu"},
    "amd-gpu": {"specs": None, "arch": "amd-gpu-data.json", "kind": "gpu"},
}

# schema field -> human label, used for the inspect-mode guesses
CPU_FIELDS = {
    "n": "model name", "c": "cores", "t": "threads",
    "bst": "boost clock", "bas": "base clock", "l3": "L3 cache",
    "tdp": "TDP", "sk": "socket", "tr": "tray product ID",
    "skc": "socket count (server)", "pcie": "PCIe (server)", "mem": "memory (server)",
    "gm": "iGPU model (client)", "gc": "iGPU CUs (client)", "gf": "iGPU freq (client)",
}
GPU_FIELDS = {
    "name": "model name", "arch": "architecture", "process": "process node",
    "cu": "compute units", "mem": "memory", "memType": "memory type",
    "bw": "bandwidth", "fp32": "FP32", "fp32m": "FP32 matrix",
    "pcie": "PCIe", "form": "form factor", "tbp": "TBP",
}

# substrings -> schema field, for inspect-mode guessing only
GUESS = [
    (("model", "name", "processor", "product name"), "n"),
    (("# of cpu cores", "cores", "core count"), "c"),
    (("# of threads", "threads", "thread count"), "t"),
    (("max. boost", "boost", "turbo", "max frequency"), "bst"),
    (("base clock", "base frequency", "base freq"), "bas"),
    (("l3 cache", "total l3", "cache"), "l3"),
    (("default tdp", "tdp", "thermal design"), "tdp"),
    (("socket count", "cpu count", "sockets supported"), "skc"),
    (("socket", "package"), "sk"),
    (("pci express", "pcie", "pci-e"), "pcie"),
    (("system memory", "memory speed", "max memory", "memory"), "mem"),
    (("tray", "opn tray", "product id"), "tr"),
]


def norm(s):
    return re.sub(r"\s+", " ", (s or "").strip())


# Value transforms applied after mapping. Vendor CSVs carry marketing formatting that
# the dashboard stores plainly; these keep new rows consistent with existing ones.
TRANSFORMS = {
    # "AMD EPYC(tm) 9996" -> "EPYC 9996", matching every existing row in the file
    "strip-amd": lambda v: re.sub(r"^AMD\s+", "", v).replace("\u2122", "").strip(),
    # "8000 MT/s / 12800 MT/s" -> "Up to 8000 MT/s / 12800 MT/s"
    "up-to": lambda v: v if v.lower().startswith("up to") else f"Up to {v}",
    # "600 W" -> "600W", matching existing TDP style
    "tight-watt": lambda v: re.sub(r"(\d)\s+W\b", r"\1W", v),
}


def apply_transforms(value, names):
    for t in names:
        fn = TRANSFORMS.get(t)
        if not fn:
            die(f"unknown transform {t!r}; known: {', '.join(TRANSFORMS)}")
        value = fn(value)
    return value


def guess_field(col, kind):
    c = col.lower().strip()
    if kind == "gpu":
        for f in GPU_FIELDS:
            if f.lower() in c:
                return f
        return None
    for keys, field in GUESS:
        if any(k in c for k in keys):
            return field
    return None


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def read_csv(path):
    raw = Path(path).read_bytes()
    # vendor exports are frequently UTF-8 BOM or cp1252
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        die(f"could not decode {path}")
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    rows = list(csv.DictReader(text.splitlines(), dialect=dialect))
    if not rows:
        die("CSV has no data rows")
    return rows


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


# ── inspect ──────────────────────────────────────────────────────────────
def cmd_inspect(args):
    rows = read_csv(args.csv)
    cols = list(rows[0].keys())
    kind = "gpu" if args.target and "gpu" in args.target else "cpu"

    print(f"{len(rows)} rows, {len(cols)} columns\n")
    print(f"{'CSV COLUMN':<42} {'GUESS':<8} SAMPLE")
    print("-" * 96)
    mapping = {}
    for col in cols:
        g = guess_field(col, kind)
        sample = norm(rows[0].get(col, ""))[:36]
        if g and g not in mapping.values():
            mapping[col] = g
        print(f"{norm(col)[:42]:<42} {g or '-':<8} {sample}")

    fields = GPU_FIELDS if kind == "gpu" else CPU_FIELDS
    unmapped = [f for f in fields if f not in mapping.values()]
    print("\nStarter mapping (CHECK THESE — guesses are often wrong):")
    print(json.dumps(mapping, indent=2))
    if unmapped:
        print(f"\nSchema fields with no column mapped: {', '.join(unmapped)}")
        print("Leave them out if the CSV genuinely lacks them — omitted is better than wrong.")
    print("\nSave the mapping to a file, correct it, then run `import ... --map <file>`.")
    return 0


# ── export (round-trip / inspection of existing data) ────────────────────
def cmd_export(args):
    t = TARGETS[args.target]
    if not t["specs"]:
        die("export currently supports CPU targets only")
    specs = load_json(DATA / t["specs"])
    if args.sku not in specs:
        die(f"SKU {args.sku!r} not found. Available: {', '.join(sorted(specs)[:12])} ...")
    models = specs[args.sku]
    cols = list(dict.fromkeys(k for m in models for k in m if not k.startswith("_")))
    w = csv.DictWriter(sys.stdout, fieldnames=cols, extrasaction="ignore")
    w.writeheader()
    for m in models:
        w.writerow(m)
    return 0


# ── import ───────────────────────────────────────────────────────────────
def cmd_import(args):
    t = TARGETS[args.target]
    if t["kind"] == "gpu":
        die("GPU import not implemented yet — GPU specs are nested inside the "
            "architecture entry, so add them via docs/WORKFLOWS.md Workflow 1 for now.")

    rows = read_csv(args.csv)
    mapping = load_json(args.map) if args.map else {}
    if not mapping:
        die("--map is required for import. Run `inspect` first to generate a starter.")

    inv = {}
    for col, field in mapping.items():
        if col not in rows[0]:
            die(f"mapping references column {col!r} which is not in the CSV")
        inv[field] = col
    if "n" not in inv:
        die("mapping must include the model-name column -> 'n'")

    # row filters (e.g. --filter "Series=EPYC 9006 Series")
    for spec in args.filter:
        if "=" not in spec:
            die(f"--filter must be COL=VALUE, got {spec!r}")
        col, val = spec.split("=", 1)
        if col not in rows[0]:
            die(f"--filter column {col!r} not in CSV")
        before = len(rows)
        rows = [r for r in rows if norm(r.get(col, "")) == val.strip()]
        print(f"filter {col}={val.strip()!r}: {before} -> {len(rows)} rows")
        if not rows:
            die("filter removed every row")

    # per-field transforms (e.g. --transform n:strip-amd)
    tmap = {}
    for spec in args.transform:
        if ":" not in spec:
            die(f"--transform must be FIELD:NAME, got {spec!r}")
        field, name = spec.split(":", 1)
        tmap.setdefault(field, []).append(name)

    # build records
    records = []
    for r in rows:
        rec = {}
        for field, col in inv.items():
            v = norm(r.get(col, ""))
            if field in tmap:
                v = apply_transforms(v, tmap[field])
            if v and v not in {"-", "—", "N/A", "NA"}:
                rec[field] = v
        if not rec.get("n"):
            continue
        if args.server:
            rec["_srv"] = True
        records.append(rec)

    if not records:
        die("no usable rows (every row lacked a model name)")

    specs_path = DATA / t["specs"]
    specs = load_json(specs_path)
    arch_data = load_json(DATA / t["arch"])

    problems, warnings = [], []

    # 1. does the SKU key exist in the architecture file?
    sku_names = {s["name"] for a in arch_data if "era" not in a for s in a.get("skus", [])}
    if args.sku not in sku_names:
        close = [s for s in sku_names if args.sku.lower() in s.lower() or s.lower() in args.sku.lower()]
        problems.append(
            f"SKU key {args.sku!r} does not match any skus[].name in {t['arch']}. "
            f"The spec table will NEVER render.\n"
            f"      {'Did you mean: ' + ', '.join(sorted(close)) if close else 'Add the architecture entry first (WORKFLOWS.md Workflow 1).'}")

    # 2. server/client field consistency
    srv_fields = {"skc", "pcie", "mem"}
    cli_fields = {"gm", "gc", "gf"}
    have_srv = srv_fields & set(inv)
    have_cli = cli_fields & set(inv)
    if args.server and have_cli:
        warnings.append(f"--server set but client fields mapped: {', '.join(sorted(have_cli))}")
    if not args.server and have_srv:
        warnings.append(
            f"client import but server fields mapped ({', '.join(sorted(have_srv))}). "
            f"Without --server these columns will not render.")
    if args.server and not have_srv:
        warnings.append("--server set but none of skc/pcie/mem mapped — those columns will be blank.")

    # 3. unit phrasing vs existing rows in the same file
    existing = [m for v in specs.values() for m in v]
    for field, label in (("tdp", "TDP"), ("bst", "boost"), ("mem", "memory")):
        if field not in inv or not existing:
            continue
        new_vals = {r[field] for r in records if field in r}
        old_vals = {m[field] for m in existing if field in m}
        if not old_vals or not new_vals:
            continue
        old_has_upto = any(v.lower().startswith("up to") for v in old_vals)
        new_has_upto = any(v.lower().startswith("up to") for v in new_vals)
        if old_has_upto and not new_has_upto:
            warnings.append(
                f"{label}: existing rows use 'Up to X' phrasing, new rows don't "
                f"(e.g. {sorted(new_vals)[0]!r}). Values render verbatim.")
        if field == "tdp":
            if any(re.search(r"\d\s+W", v) for v in new_vals) and not any(re.search(r"\d\s+W", v) for v in old_vals):
                warnings.append("TDP: new rows use '500 W' but existing use '500W' (no space).")

    # 4. duplicates
    names = [r["n"] for r in records]
    dupes = {n for n in names if names.count(n) > 1}
    if dupes:
        warnings.append(f"duplicate model names in CSV: {', '.join(sorted(dupes))}")

    replacing = args.sku in specs
    old_count = len(specs.get(args.sku, []))

    # ── report ──
    print("=" * 72)
    print(f"  IMPORT {'(DRY RUN — nothing written)' if not args.write else '(WRITING)'}")
    print("=" * 72)
    print(f"  source     {args.csv}")
    print(f"  target     {t['specs']}  key={args.sku!r}")
    print(f"  layout     {'SERVER (Sockets/PCIe/Memory)' if args.server else 'CLIENT (GPU Model/CUs/Freq)'}")
    print(f"  rows       {len(records)} models"
          + (f"   (REPLACES existing {old_count})" if replacing else "   (new key)"))
    print(f"  fields     {', '.join(sorted(inv))}")
    print("-" * 72)
    print("  First row as it will be stored:")
    print("   ", json.dumps(records[0], ensure_ascii=False))
    if len(records) > 1:
        print("  Last row:")
        print("   ", json.dumps(records[-1], ensure_ascii=False))
    print("-" * 72)

    if problems:
        print(f"  BLOCKING ({len(problems)}):")
        for p in problems:
            print(f"    ✗ {p}")
    if warnings:
        print(f"  WARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"    ! {w}")
    if not problems and not warnings:
        print("  No problems found.")
    print("=" * 72)

    if problems:
        print("\nRefusing to write while blocking problems exist.")
        return 1
    if not args.write:
        print("\nDry run. Re-run with --write to apply.")
        return 0

    specs[args.sku] = records
    # Match the target file's existing formatting exactly, or every untouched record
    # reformats and the diff becomes unreviewable (bit us on the 9006 import: a 1409-line
    # diff for a 469-line addition). These files are 4-space indent with \uXXXX escapes.
    with open(specs_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(specs, f, indent=4, ensure_ascii=True)
        f.write("\n")
    # verify round-trip
    back = load_json(specs_path)
    assert back[args.sku] == records, "write verification failed"
    print(f"\nWrote {len(records)} models to {t['specs']} under {args.sku!r}.")
    print("Next: python3 tools/smoke-test.py --shots")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("inspect", help="show CSV columns and a starter mapping")
    p.add_argument("csv")
    p.add_argument("--target", choices=TARGETS)
    p.set_defaults(func=cmd_inspect)

    p = sub.add_parser("export", help="dump existing JSON specs as CSV")
    p.add_argument("--target", required=True, choices=TARGETS)
    p.add_argument("--sku", required=True)
    p.set_defaults(func=cmd_export)

    p = sub.add_parser("import", help="import a CSV into the spec JSON")
    p.add_argument("csv")
    p.add_argument("--target", required=True, choices=TARGETS)
    p.add_argument("--sku", required=True, help="SKU key; must match skus[].name exactly")
    p.add_argument("--map", required=True, help="JSON file of {csv column: schema field}")
    p.add_argument("--server", action="store_true", help="set _srv:true (server column layout)")
    p.add_argument("--filter", action="append", default=[], metavar="COL=VALUE",
                   help="keep only rows where COL equals VALUE (repeatable)")
    p.add_argument("--transform", action="append", default=[], metavar="FIELD:NAME",
                   help="apply a value transform, e.g. n:strip-amd (repeatable)")
    p.add_argument("--write", action="store_true", help="actually write (default is dry run)")
    p.set_defaults(func=cmd_import)

    args = ap.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
