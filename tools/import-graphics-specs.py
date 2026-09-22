#!/usr/bin/env python3
"""
Build js/data/intel-graphics-specs.json from the Intel ARK discrete-GPU export.

Output is keyed by the V2_DATA.graphics family name, so it drops straight into
the Graphics sub-tab's cards -- same contract as the Xeon and Client importers.

Input: docs/specs/source-csv-intel-gpu/Intel GPU.csv -- 35 discrete parts
covering Alchemist, Battlemage, Flex and Max. Transposed like every ARK export
(attributes as rows, products as columns, two-line preamble).

Unlike the CPU importers this one needs no codename join: ARK publishes
'Microarchitecture' directly (Xe HPG / Xe2 HPG / Xe HPC), and the family name
is derived from the product name plus that architecture.

The Graphics tab is the one place where the column set is per-BRAND rather than
per-tab -- Arc, Arc Pro and Data Center parts need genuinely different fields
(see V2_COLUMNS.graphics). So this writes three different record shapes and
V2_FIELDS.graphics is keyed the same way.

Usage
-----
    python3 tools/import-graphics-specs.py --audit
    python3 tools/import-graphics-specs.py -o js/data/intel-graphics-specs.json
"""
import argparse, csv, json, re, sys, collections
from pathlib import Path

DASH = "—"

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "docs" / "specs" / "source-csv-intel-gpu" / "Intel GPU.csv"

# Product name -> V2_DATA.graphics family name. ARK's own 'Microarchitecture'
# field decides the block; the name only has to pick the right one of the four.
#
# The non-obvious one: Flex 140/170 are Xe-HPG Alchemist silicon (the same
# ACM-G10/G11 dies as the A-series), NOT a data-center architecture. ARK files
# them under a separate top-level menu, which hides that relationship. The
# timeline keeps them in their own block for the same reason -- they are sold
# as data-center parts -- but the architecture label stays honest.
def family_of(name, arch, segment):
    """
    Map an ARK product onto a V2_DATA.graphics family name.

    Grouped by **architecture + brand line + segment**, deliberately, so every
    card holds several comparable parts. The previous mapping followed the
    timeline's uneven granularity and produced nine single-model cards -- a full
    table header rendered above one row, which is the least useful shape a spec
    table can take. A table earns its header by letting you compare.

    Eight families, all with 2+ models:
        Data Center GPU Max      2   Arc Pro A-series      5
        Data Center Flex         3   Arc A-series          6  (desktop)
        Arc Pro B-series         4   Arc A-series Mobile   7
        Arc B-series             2   Arc A-series Embedded 6

    The non-obvious one: Flex 140/170 are Xe-HPG Alchemist silicon (the same
    ACM-G10/G11 dies as the A-series). ARK files them under a separate top-level
    menu, which hides that. They keep their own card because they are sold as
    data-center parts, but the architecture label stays honest.
    """
    n = name.lower()

    if "gpu max" in n:
        return "Data Center GPU Max"
    if "flex" in n:
        return "Data Center Flex"

    if is_battlemage(name, arch):
        return "Arc Pro B-series" if "pro" in n else "Arc B-series"

    # Alchemist. ARK's own Vertical Segment separates mobile and embedded; the
    # 'M' and 'E' model suffixes agree with it and cover the rows it leaves blank.
    if "pro" in n:
        return "Arc Pro A-series"
    seg = (segment or "").strip().lower()
    if seg == "mobile" or re.search(r"A\d{3}M\b", name):
        return "Arc A-series Mobile"
    if seg == "embedded" or re.search(r"A\d{3}E\b", name):
        return "Arc A-series Embedded"
    return "Arc A-series"


def is_battlemage(name, arch):
    """Xe2 parts. ARK writes 'Xe2 HPG'; the B-prefix model number agrees."""
    if arch and "xe2" in arch.lower().replace("-", "").replace(" ", ""):
        return True
    return bool(re.search(r"\bB\d{2,3}\b", name))


# -- normalisers ------------------------------------------------------------

def clean_name(s):
    """'Intel(R) Arc(TM) A770 Graphics (16GB)' -> 'Arc A770 (16GB)'"""
    s = s.replace("®", "").replace("™", "")
    s = re.sub(r"\bIntel\b", "", s)
    s = re.sub(r"\bGraphics\b", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    # ARK writes 'Arc ™ A380E' on some rows -- the stray space survives the
    # trademark strip and would sort/display wrong.
    return re.sub(r"\bArc\s+", "Arc ", s)


def mhz(v):
    """'2050 MHz' -> '2.05 GHz'. GHz reads better beside the CPU tabs."""
    if not v:
        return DASH
    m = re.match(r"^([\d.]+)\s*MHz$", v.strip())
    if m:
        return f"{float(m.group(1)) / 1000:g} GHz"
    m = re.match(r"^([\d.]+)\s*GHz$", v.strip())
    return f"{float(m.group(1)):g} GHz" if m else v


def watts(tbp, tgp, tdp):
    """
    One power column. ARK populates exactly one of TBP / TGP / TDP depending on
    the product line, and TGP is sometimes a range ('35W - 50W').
    """
    v = (tbp or tgp or tdp or "").strip()
    if not v:
        return DASH
    v = re.sub(r"\s*-\s*", " – ", v)
    return re.sub(r"\s*W\b", "W", v)


def mem(size, mtype, combined=""):
    """
    '16 GB GDDR6'. Built from Memory Size + Memory Type, falling back to ARK's
    single 'Memory' field -- newer Battlemage Pro parts publish only the latter,
    so without this fallback the B70 and B65 render a blank VRAM cell despite
    ARK listing 32 GB GDDR6.
    """
    s, t = (size or "").strip(), (mtype or "").strip()
    if s and t:
        return f"{s} {t}"
    return s or t or (combined or "").strip() or DASH


def bus(v):
    """'256 bit' -> '256-bit'."""
    if not v:
        return DASH
    m = re.match(r"^(\d+)\s*bits?$", v.strip(), re.I)
    return f"{m.group(1)}-bit" if m else v


def bandwidth(v):
    """'512 GB/s' passes through; blank becomes an em dash."""
    return (v or "").strip() or DASH


def pcie(v):
    """'Up to PCI Express 4.0 x16' -> 'PCIe 4.0 x16'."""
    if not v:
        return DASH
    s = re.sub(r"^\s*Up to\s*", "", v.strip(), flags=re.I)
    s = s.replace("PCI Express", "PCIe")
    # Drop the parenthetical caveat ('(x16 slot required)') -- true but too
    # long for a table cell, and it is on the ARK page for anyone who needs it.
    s = re.sub(r"\s*\(.*\)\s*$", "", s)
    return re.sub(r"\s+", " ", s).strip()


def yesno(v):
    """ECC and similar. ARK leaves these blank rather than writing 'No'."""
    v = (v or "").strip()
    if not v:
        return DASH
    return "Yes" if v.lower().startswith("yes") else v


def num(v):
    """A bare integer field; blank becomes an em dash."""
    v = (v or "").strip()
    return v if v else DASH


def tops(v):
    """'229' -> '229 TOPS'. ARK's Int8 figure -- the AI headline number."""
    v = (v or "").strip()
    if not v:
        return DASH
    return f"{v} TOPS" if re.match(r"^[\d.]+$", v) else v


def tflops(v):
    """'19.66' -> '19.7 TF'. FP32; ARK fills it on only a handful of parts."""
    v = (v or "").strip()
    if not v:
        return DASH
    m = re.match(r"^([\d.]+)", v)
    return f"{float(m.group(1)):.4g} TF" if m else v


def gbps(v):
    """'17.5 Gbps' passes through, normalised."""
    v = (v or "").strip()
    if not v:
        return DASH
    m = re.match(r"^([\d.]+)\s*Gbps$", v, re.I)
    return f"{float(m.group(1)):g} Gbps" if m else v


def physical(slots, psu, conn):
    """
    'Dual-slot · 600 W PSU'. ARK fills these on only 2-3 boards, so this is
    usually an em dash -- included because when it IS present it answers a
    rack-fit question that nothing else on the page does.
    """
    bits = []
    s = (slots or "").strip()
    if s:
        bits.append({"1": "Single-slot", "2": "Dual-slot",
                     "3": "Triple-slot"}.get(s, f"{s}-slot"))
    p = (psu or "").strip()
    if p:
        bits.append(f"{re.sub(r's*W$', 'W', p)} PSU")
    c = (conn or "").strip()
    if c and c.lower() not in ("none",):
        bits.append(c)
    return " · ".join(bits) if bits else DASH


def form_factor(name, segment):
    """
    ARK has no form-factor column. OAM vs PCIe is only published for the Max
    parts, where it is part of the product identity (1550 is OAM, 1100 is PCIe
    -- the 'M' models are mobile). Everything else is a board.
    """
    n = name.lower()
    if "max 1550" in n or "max 1350" in n:
        return "OAM"
    if "max" in n or "flex" in n:
        return "PCIe"
    if (segment or "").strip().lower() == "mobile" or re.search(r"\d+M\b", name):
        return "Mobile"
    return "PCIe"


# -- ARK parsing ------------------------------------------------------------

def read_ark(path):
    """Transposed ARK export -> [{attribute: value}, ...], one per product."""
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
    hdr_i = next(i for i, r in enumerate(rows) if len(r) > 1 and not r[0].strip())
    names = [c.strip() for c in rows[hdr_i][1:]]
    products = [{"__name": n} for n in names]

    for r in rows[hdr_i + 1:]:
        if not r or not r[0].strip():
            continue
        attr = r[0].strip().rstrip("‡").strip()
        for i, val in enumerate(r[1:]):
            if i < len(products) and attr not in products[i]:
                products[i][attr] = val.strip()
    return [p for p in products if p["__name"]]


def get(p, *keys):
    """First non-empty value among key variants."""
    for k in keys:
        v = p.get(k, "")
        if v:
            return v
    return ""


# -- build ------------------------------------------------------------------

def build():
    products = read_ark(SRC)
    out = collections.OrderedDict()
    stats = collections.Counter(ark_rows=len(products))

    for p in products:
        name = clean_name(p["__name"])
        arch = get(p, "Microarchitecture")
        seg = get(p, "Vertical Segment")
        fam = family_of(name, arch, seg)

        xe = num(get(p, "Xe-cores"))
        clock = mhz(get(p, "Graphics Clock", "Graphics Max Dynamic Frequency"))
        power = watts(get(p, "TBP"), get(p, "TGP"), get(p, "TDP"))
        memory = mem(get(p, "Memory Size"), get(p, "Memory Type"),
                     get(p, "Memory"))
        bw = bandwidth(get(p, "Graphics Memory Bandwidth"))
        xmx = num(get(p, "Intel\u00ae Xe Matrix Extensions (Intel\u00ae XMX) Engines"))
        ai = tops(get(p, "GPU Peak TOPS (Int8)"))
        phys = physical(get(p, "Slots"), get(p, "Minimum Power Supply Unit"),
                        get(p, "Power Connectors"))

        if fam == "Data Center GPU Max":
            # Max parts publish Vector and Matrix engine counts separately;
            # they are the headline figures for HPC/AI buyers. No TOPS in ARK
            # for these, so FP32 TFLOPS carries the compute column instead.
            rec = {
                "n":   name,
                "xe":  xe,
                "vec": num(get(p, "Xe Vector Engines")),
                "mat": xmx,
                "bus": bus(get(p, "Graphics Memory Interface")),
                "clk": clock,
                "mem": memory,
                "bw":  bw,
                "tbp": power,
                "ff":  form_factor(name, seg),
                "lnk": num(get(p, "Intel\u00ae Xe Link Maximum Frequency")),
            }
        elif fam.startswith("Arc Pro"):
            # Workstation: ECC and physical fit matter more than PCIe width.
            rec = {
                "n":    name,
                "xe":   xe,
                "rt":   num(get(p, "Ray Tracing Units")),
                "xmx":  xmx,
                "ai":   ai,
                "clk":  clock,
                "vram": memory,
                "spd":  gbps(get(p, "Graphics Memory Speed")),
                "bw":   bw,
                "ecc":  yesno(get(p, "ECC Memory Supported")),
                "tbp":  power,
                "phys": phys,
            }
        else:
            # Arc consumer, mobile, embedded and Flex share the board-level set.
            rec = {
                "n":    name,
                "xe":   xe,
                "rt":   num(get(p, "Ray Tracing Units")),
                "xmx":  xmx,
                "ai":   ai,
                "clk":  clock,
                "vram": memory,
                "spd":  gbps(get(p, "Graphics Memory Speed")),
                "bus":  bus(get(p, "Graphics Memory Interface")),
                "bw":   bw,
                "tbp":  power,
                "pcie": pcie(get(p, "PCI Express Configurations")),
            }

        out.setdefault(fam, []).append(rec)
        stats["kept"] += 1

    # Flagship first: most Xe-cores, then highest memory bandwidth.
    def sortkey(m):
        xe = int(m["xe"]) if m["xe"].isdigit() else 0
        g = re.match(r"([\d.]+)", m.get("bw", ""))
        return (-xe, -(float(g.group(1)) if g else 0))

    for k in out:
        out[k].sort(key=sortkey)
    return out, stats


def main():
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-o", "--out")
    ap.add_argument("--audit", action="store_true",
                    help="print every record, not just the family counts")
    args = ap.parse_args()

    data, stats = build()
    total = sum(len(v) for v in data.values())
    print(f"\n{len(data)} families, {total} models "
          f"(from {stats['ark_rows']} ARK rows)\n")
    for k, v in sorted(data.items(), key=lambda x: -len(x[1])):
        print(f"  {k:<28} {len(v):>4}")

    if args.audit:
        for k, v in data.items():
            print(f"\n{k}")
            for m in v:
                print("   ", " | ".join(str(x) for x in m.values()))

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
