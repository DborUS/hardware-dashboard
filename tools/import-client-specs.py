#!/usr/bin/env python3
"""
Build js/data/intel-client-specs.json from the Intel ARK client exports.

Output is keyed by codename so it drops straight into the Client sub-tab's
cards -- same contract as tools/import-xeon-specs.py.

Two inputs, joined on the ARK 'Processor Number' field:

  1. docs/specs/source-csv-intel/*.csv -- the raw ARK comparison exports, which
     are TRANSPOSED (attributes as rows, products as columns) with a two-line
     preamble. These carry the per-core-type clocks the Client column set needs
     and that intel-master.csv does not.
  2. docs/specs/intel-master.csv -- supplies the CODENAME. ARK has no Code Name
     column; the master CSV's codenames were researched and verified.

Anything the master CSV does not carry a codename for is dropped and reported,
so a row can never render under the wrong block.

SCOPE: the Client timeline starts at 10th Gen / 2020. Pre-2020 codenames are
excluded by PRE2020_CODENAMES below -- Daniel's call, 2026-09-10. They stay in
intel-master.csv; they just do not render.

Client column set (V2_COLUMNS.client in js/intel-v2.js):
    Model | P-cores | E-cores | Threads | P Base/Boost | E Base/Boost |
    L3 Cache | TDP (base/turbo) | iGPU | Xe-cores | Memory

LP E-cores are the trap. ARK is inconsistent about whether they are already
counted in Total Cores:
    Meteor Lake 155H  = 16 total = 6P + 8E + 2 LP-E   (LP is EXTRA)
    Arrow Lake 235UA  = 10 total = 2P + 8E            (2 of the 8 ARE LP)
So the E-core figure is DERIVED from ARK's own Total Cores minus P-cores, never
by adding the LP column. Assuming either rule directly breaks the other.

Usage
-----
    python3 tools/import-client-specs.py --audit
    python3 tools/import-client-specs.py -o js/data/intel-client-specs.json
"""
import argparse, csv, json, re, sys, collections
from pathlib import Path

DASH = "—"

REPO = Path(__file__).resolve().parent.parent
ARK_DIR = REPO / "docs" / "specs" / "source-csv-intel"
MASTER = REPO / "docs" / "specs" / "intel-master.csv"

# Client sub-tab scope. Xeon/Atom-server exports live in the same directory and
# are handled by import-xeon-specs.py; naming them here keeps the two importers
# from silently claiming each other's rows.
ARK_FILES = [
    "Intel Core Ultra CSV.csv",
    "Intel core 14th to modern gen.csv",
    "Intel Core 10th to 13th gen.csv",
    "Intel 'processor' org unkown.csv",
    # Second batch, 2026-09-10. These OVERLAP the four above rather than
    # replacing them: 84 products in both, 54 only here, 202 only there.
    # Union is 340. Both batches are official ARK, so all of it is in scope
    # and the (codename, name) dedupe below keeps the first copy seen.
    "Intel Client 1 Core ultra to 13th gen.csv",
    "Intel Client 12th gen to 10th gen.csv",
    "Intel Client table 3.csv",
]

# Pre-2020 parts, excluded per Daniel 2026-09-10. The Client timeline starts at
# 10th Gen, matching the Xeon tab's Skylake-SP cutoff.
PRE2020_CODENAMES = {
    "Cherry Trail",            # 2015 Atom tablet SoC
    "SoFIA",                   # 2015 phone SoC
    "Coffee Lake-H",           # 2018
    "Coffee Lake-H Refresh",   # 2018
    "Skylake-W (W-3175X)",     # 2019 HEDT, one part
    "Ice Lake-D (D-27xx)",     # server-adjacent, belongs to Xeon D if anywhere
}

# Master-CSV codename -> V2_DATA.client family name. Same silicon, different
# spelling; without this the models load but render nowhere.
CODENAME_ALIASES = {
    "Panther Lake":            "Panther Lake-U",
    "Panther Lake High Power": "Panther Lake-H",
}


def display_codename(codename, product, name, number):
    """Split one silicon codename across the product generations Intel sells.

    Raptor Lake is the clearest example: Intel ARK calls both 13th Gen and
    14th Gen parts Raptor Lake, while the dashboard has separate generation
    blocks. Product Collection is the official ARK field that supplies that
    missing sales-generation identity.
    """
    collection = get(product, "Product Collection").lower()
    segment = get(product, "Vertical Segment").lower()
    model = f"{name} {number}".lower()

    if "14th gen" in collection or "14th generation" in collection:
        if codename in ("Raptor Lake-S", "Raptor Lake-E"):
            return "Raptor Lake-E Refresh" if segment == "embedded" else "Raptor Lake-S Refresh"
        if codename == "Raptor Lake-HX":
            return "Raptor Lake-HX Refresh"

    if "series 1" in collection:
        if codename == "Raptor Lake-H":
            return "Raptor Lake-H Refresh (1xx)"
        if codename == "Raptor Lake-U":
            return "Raptor Lake-U Refresh (1xx)"

    if "series 2" in collection:
        if codename == "Raptor Lake-H":
            return "Raptor Lake-H Refresh"
        if codename == "Raptor Lake-U":
            return "Raptor Lake-U Refresh"

    # Intel's 2026 refresh keeps the Arrow Lake codename and adds "Plus" to
    # the retail name. Keep it in a separate Series 2 card.
    if "plus" in model:
        if codename == "Arrow Lake-S":
            return "Arrow Lake-S Refresh"
        if codename == "Arrow Lake-HX":
            return "Arrow Lake-HX Refresh"

    return codename


# -- normalisers ------------------------------------------------------------

def clean_name(s):
    """'Intel(R) Core(TM) Ultra 7 Processor 155H' -> 'Core Ultra 7 155H'"""
    s = s.replace("®", "").replace("™", "")
    s = re.sub(r"\bIntel\b", "", s)
    s = re.sub(r"\bprocessors?\b", "", s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip()


def ghz(v):
    """'3.20 GHz' -> '3.2 GHz'. Trailing zeros differ across export vintages."""
    if not v:
        return ""
    m = re.match(r"^([\d.]+)\s*GHz$", v)
    return f"{float(m.group(1)):g} GHz" if m else v


def watts(v):
    """'105 W' -> '105W', matching the house style used by the Xeon rows."""
    if not v:
        return ""
    m = re.match(r"^([\d.]+)\s*W$", v)
    return f"{m.group(1)}W" if m else v


def clock_pair(base, boost):
    """'2.4 / 4.8 GHz' -- one column for a core type's base and boost."""
    b, t = ghz(base), ghz(boost)
    if b and t:
        return f"{b.replace(' GHz', '')} / {t}"
    return b or t or DASH


def tdp(base_power, turbo_power, plain_tdp):
    """Base and turbo in one column: '28W / 115W', or a plain '65W'."""
    b, t = watts(base_power), watts(turbo_power)
    if b and t:
        return f"{b} / {t}"
    return b or watts(plain_tdp) or DASH


def cache(v):
    """'24 MB Intel(R) Smart Cache' -> '24 MB'; bare KB integers -> MB."""
    if not v:
        return ""
    m = re.match(r"^([\d.]+)\s*([KMG]B)", v)
    if m:
        return f"{float(m.group(1)):g} {m.group(2)}"
    if v.isdigit():
        return f"{int(v) / 1024:g} MB"
    return v


def igpu(v):
    """
    'Intel(R) Arc(TM) 140V GPU' -> 'Arc 140V'. Blank means no iGPU (F-SKU).

    'graphics' is only stripped when something else survives: ARK writes bare
    'Intel Arc graphics' and 'Intel Graphics' for parts with no model number,
    and removing the word there leaves an empty cell on 100+ rows.
    """
    if not v:
        return DASH
    s = v.replace("®", "").replace("™", "")
    s = re.sub(r"\bIntel\b", "", s)
    s = re.sub(r"\bGPU\b", "", s)
    stripped = re.sub(r"\s+", " ", re.sub(r"\bgraphics\b", "", s, flags=re.I)).strip()
    # Keep 'graphics' unless dropping it still leaves a model identifier.
    if stripped and re.search(r"\d", stripped):
        return stripped
    return re.sub(r"\s+", " ", s).strip() or DASH


def xe_cores(xe, eus):
    """
    One column, one unit. ARK reports Xe-cores on Meteor Lake onward and raw
    Execution Units on everything older, so a straight fallback puts '4' next
    to '32' for GPUs of comparable size. EUs convert at the fixed architectural
    ratio of 8 per Xe-core (UHD 770 = 32 EU = 4 Xe-cores).
    """
    if xe and xe.strip().isdigit():
        return xe.strip()
    if eus and eus.strip().isdigit():
        n = int(eus.strip())
        return str(n // 8) if n >= 8 and n % 8 == 0 else f"{n} EU"
    return DASH


def memory(max_speed, mem_types):
    """
    'DDR5-5600' -- the headline speed. Client parts are 2-channel almost
    without exception, so the channel count that the Xeon column carries is
    dropped here in favour of the memory generation, which actually varies.
    """
    if max_speed:
        m = re.match(r"^([\d.]+)\s*(MHz|MT/s)$", max_speed, re.I)
        if m:
            t = re.match(r"^\s*(DDR\d|LPDDR\d)", mem_types or "", re.I)
            n = int(float(m.group(1)))
            return f"{t.group(1).upper()}-{n}" if t else f"{n} MT/s"
        return max_speed

    if not mem_types:
        return DASH

    # 'DDR4 2666/2933' -- take the highest, which is how Intel markets it.
    m = re.match(r"^(DDR\d|LPDDR\d)\s+([\d/]+)\s*$", mem_types.strip(), re.I)
    if m:
        return f"{m.group(1).upper()}-{max(int(x) for x in m.group(2).split('/') if x)}"

    best, kind = 0, ""
    for m in re.finditer(r"(DDR\d|LPDDR\d)[^\d]{0,12}(\d{3,5})", mem_types, re.I):
        n = int(m.group(2))
        if 800 <= n <= 20000 and n > best:
            best, kind = n, m.group(1).upper()
    return f"{kind}-{best}" if best else DASH


def cores(total, p, e):
    """
    (P, E) as strings. E is DERIVED as total - P, never read directly and never
    summed with the LP-E column -- see the module docstring for why both of
    those approaches produce wrong answers on real parts.
    """
    def i(v):
        return int(v) if v and v.strip().isdigit() else None

    t, pc, ec = i(total), i(p), i(e)
    if pc is None:
        # No P/E split published: a pre-hybrid part. All cores are P-cores.
        return (str(t) if t is not None else DASH), "0"
    if t is not None:
        return str(pc), str(max(t - pc, 0))
    return str(pc), str(ec if ec is not None else 0)


# -- ARK parsing ------------------------------------------------------------

def read_ark(path):
    """
    Transposed ARK export -> [{attribute: value}, ...], one dict per product.

    Two quirks worth knowing: the file opens with a two-line preamble (title,
    timestamp) before the product-name row, and some attribute rows repeat
    (Memory Types appears once per supported speed). First value wins, which is
    the headline figure.
    """
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        sys.exit(f"could not decode {path}")

    rows = list(csv.reader(text.splitlines()))

    # The product-name row is the first with a blank first cell and >1 column.
    hdr_i = next(i for i, r in enumerate(rows)
                 if len(r) > 1 and not r[0].strip())
    names = [c.strip() for c in rows[hdr_i][1:]]
    products = [{"__name": n} for n in names]

    for r in rows[hdr_i + 1:]:
        if not r or not r[0].strip():
            continue
        attr = r[0].strip().rstrip("‡").strip()
        for i, val in enumerate(r[1:]):
            if i < len(products) and attr not in products[i]:
                products[i][attr] = val.strip()
    return products


def get(p, *keys):
    """First non-empty value among key variants. ARK renames fields by
    generation -- 'TDP' vs 'Processor Base Power', 'Lithography' vs
    'CPU Lithography' -- so every read goes through a fallback chain."""
    for k in keys:
        v = p.get(k, "")
        if v:
            return v
    return ""


def sku(s):
    """
    Reduce a model name to a join token. The master CSV writes
    'Core i9 processor 14900K' where ARK writes 'i9-14900K' -- same part, and
    matching on the raw strings silently drops 334 of 589 rows.
    """
    s = s.replace("\u00ae", "").replace("\u2122", "")
    s = re.sub(r"\bIntel\b|\bprocessors?\b|\bCPU\b", "", s, flags=re.I)
    return re.sub(r"[\s\-_]+", "", s).lower()


# 12th Gen Alder Lake is in the new ARK exports but not in intel-master.csv, so
# it has no researched codename to join to. Alder Lake is the one generation
# where the die variant is fully determined by the model suffix, so deriving it
# is safe here and nowhere else. Verified against the existing V2_DATA block
# names, which already carry all five variants.
ALDER_SUFFIX = [
    ("HX", "Alder Lake-HX"),
    ("HK", "Alder Lake-H"),
    ("H",  "Alder Lake-H"),
    ("PE", "Alder Lake-P"),
    ("P",  "Alder Lake-P"),
    ("UL", "Alder Lake-U"),
    ("U",  "Alder Lake-U"),
]


def alder_codename(num):
    """'i7-1270PE' -> 'Alder Lake-P'. Returns None if not a 12th Gen part."""
    m = re.search(r"\b(?:i[3579]-)?(12\d{2,3})([A-Z]*)\b", num or "")
    if not m:
        return None
    suffix = m.group(2).upper()
    for tag, cn in ALDER_SUFFIX:
        if suffix.startswith(tag):
            return cn
    # No mobile suffix: desktop silicon. Covers plain, K, KF, F, T, E, TE.
    return "Alder Lake-S"


# -- build ------------------------------------------------------------------

def build():
    # Codename lookup, keyed by the ARK Processor Number (e.g. 'i9-14900HX',
    # 'Ultra 7 155H'). Derived from model, which the master CSV writes as
    # 'Core i9-14900HX' / 'Core Ultra 7 155H'.
    codenames = {}
    for r in csv.DictReader(open(MASTER, encoding="utf-8")):
        # 'embedded' is IN scope: the Client tab has an Embedded filter chip and
        # 138 embedded rows are client silicon (Raptor Lake-U/H/P, Bartlett
        # Lake-S). Excluding them drops parts the sidebar advertises.
        if r["segment"] not in ("desktop", "mobile", "embedded"):
            continue
        codenames[sku(r["model"])] = r["codename"]

    out = collections.OrderedDict()
    stats = collections.Counter()
    unmatched, dropped_pre2020 = [], collections.Counter()
    seen = set()

    for fname in ARK_FILES:
        path = ARK_DIR / fname
        if not path.exists():
            print(f"  skip (missing): {fname}")
            continue
        products = read_ark(path)
        stats["ark_rows"] += len(products)

        for p in products:
            num = get(p, "Processor Number")
            name = clean_name(p["__name"])

            # Try the full product name first, then the bare Processor Number.
            # Neither alone covers everything: Atom/N parts omit the number in
            # some exports, and some names carry a parenthetical the number does
            # not ('A770 Graphics (16GB)').
            cn = None
            for cand in (sku(name), sku(num) if num else None):
                if cand and cand in codenames:
                    cn = codenames[cand]
                    break
            if cn is None:
                cn = alder_codename(num) or alder_codename(name)
                if cn:
                    stats["alder_derived"] += 1
            if cn is None:
                unmatched.append(f"{fname}: {name} ({num})")
                stats["no_codename"] += 1
                continue

            if cn in PRE2020_CODENAMES:
                dropped_pre2020[cn] += 1
                continue

            cn = CODENAME_ALIASES.get(cn, cn)
            cn = display_codename(cn, p, name, num)

            if (cn, name) in seen:      # same part in two exports
                stats["dupe"] += 1
                continue
            seen.add((cn, name))

            pc, ec = cores(get(p, "Total Cores"),
                           get(p, "# of Performance-cores"),
                           get(p, "# of Efficient-cores", "# of Efficiency-cores"))

            rec = {
                "n":   name,
                "pc":  pc,
                "ec":  ec,
                "t":   get(p, "Total Threads") or DASH,
                "pcl": clock_pair(
                           get(p, "Performance-core Base Frequency",
                                  "P-core Base Frequency",
                                  "Processor Base Frequency"),
                           get(p, "Performance-core Max Turbo Frequency",
                                  "Max Turbo Frequency")),
                "ecl": clock_pair(
                           get(p, "Efficient-core Base Frequency",
                                  "E-core Base Frequency"),
                           get(p, "Efficient-core Max Turbo Frequency")),
                "l3":  cache(get(p, "Cache")) or DASH,
                "tdp": tdp(get(p, "Processor Base Power"),
                           get(p, "Maximum Turbo Power"),
                           get(p, "TDP")),
                "gpu": igpu(get(p, "GPU Name", "Graphics")),
                "xe":  xe_cores(get(p, "Xe-cores"), get(p, "Execution Units")),
                "mem": memory(get(p, "Maximum Memory Speed"),
                              get(p, "Memory Types")),
            }
            out.setdefault(cn, []).append(rec)
            stats["kept"] += 1

    # Flagship first within a card: most cores, then highest boost.
    def sortkey(m):
        n = 0
        for f in ("pc", "ec"):
            if m[f].isdigit():
                n += int(m[f])
        g = re.search(r"([\d.]+) GHz", m["pcl"])
        return (-n, -(float(g.group(1)) if g else 0))

    for k in out:
        out[k].sort(key=sortkey)

    return out, stats, unmatched, dropped_pre2020


def main():
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-o", "--out")
    ap.add_argument("--audit", action="store_true",
                    help="list ARK rows that matched no codename")
    args = ap.parse_args()

    data, stats, unmatched, pre2020 = build()
    total = sum(len(v) for v in data.values())
    print(f"\n{len(data)} codenames, {total} models "
          f"(from {stats['ark_rows']} ARK rows)\n")
    for k, v in sorted(data.items(), key=lambda x: -len(x[1])):
        print(f"  {k:<32} {len(v):>4}")

    if pre2020:
        print(f"\ndropped, pre-2020 scope cutoff ({sum(pre2020.values())}):")
        for k, n in sorted(pre2020.items()):
            print(f"  {k:<32} {n:>4}")

    if stats["no_codename"]:
        print(f"\n{stats['no_codename']} ARK rows matched no master-CSV "
              f"codename and were dropped")
        if args.audit:
            for s in unmatched[:40]:
                print("   ", s[:88])


    if args.out:
        # 4-space indent + ensure_ascii, matching the existing data files
        txt = json.dumps(data, indent=4, ensure_ascii=True) + "\n"
        with open(args.out, "w", encoding="utf-8", newline="") as f:
            f.write(txt)
        with open(args.out, "r", encoding="utf-8", newline="") as f:
            assert f.read() == txt, "write-back verification failed"
        print(f"\nwrote {args.out}  ({len(txt):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
