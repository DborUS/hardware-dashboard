#!/usr/bin/env python3
"""
Build js/data/intel-xeon-specs.json from the codename-tagged ARK export.

Input is the output of tools/assign-xeon-codenames.py -- the combined Xeon
export with Codename and CoreType prepended. Output is keyed by codename, so
it drops straight into the Xeon sub-tab's cards.

ARK's field formats are inconsistent across ten years of exports, so every
value goes through a normaliser. Each one is conservative: if a string does not
match a known shape it is passed through unchanged rather than mangled, and the
--audit flag lists everything that fell through so nothing rots silently.

P-core / E-core counts are DERIVED from CoreType, not read from ARK. ARK leaves
"# of Efficiency-cores" blank or 0 even for the 288-core 6990E+, so trusting it
would report Sierra Forest and Clearwater Forest as zero-E-core parts.

Usage
-----
    python3 tools/import-xeon-specs.py IN.csv --audit          # inspect, no write
    python3 tools/import-xeon-specs.py IN.csv -o js/data/intel-xeon-specs.json
"""
import argparse, csv, json, re, sys, collections
from pathlib import Path

DASH = "—"


# ── normalisers ────────────────────────────────────────────────────────────

def clean_name(s):
    """'Intel® Xeon® Gold 5118 Processor' -> 'Xeon Gold 5118'"""
    s = s.replace("®", "").replace("™", "")
    s = re.sub(r"\bIntel\b", "", s)
    s = re.sub(r"\bprocessor\b", "", s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip()


def ghz(v):
    """'3.20 GHz' -> '3.2 GHz'. Trailing zeros differ across export vintages."""
    if not v:
        return ""
    m = re.match(r"^([\d.]+)\s*GHz$", v)
    if not m:
        return v
    return f"{float(m.group(1)):g} GHz"


def watts(v):
    """'105 W' -> '105W', matching the house style used by AMD rows."""
    if not v:
        return ""
    m = re.match(r"^([\d.]+)\s*W$", v)
    return f"{m.group(1)}W" if m else v


def tdp(base_power, turbo_power, plain_tdp):
    """
    One TDP column. Newer parts publish base and turbo separately; everything
    older has a single figure. Render '350W / 420W' or plain '205W'.
    """
    b, t = watts(base_power), watts(turbo_power)
    if b and t:
        return f"{b} / {t}"
    return b or watts(plain_tdp)


def cache(v):
    """
    '105 MB Intel® Smart Cache' -> '105 MB'. Also handles bare KB integers
    ('10240' -> '10 MB') seen in the oldest Xeon D exports.
    """
    if not v:
        return ""
    m = re.match(r"^([\d.]+)\s*([KMG]B)", v)
    if m:
        return f"{float(m.group(1)):g} {m.group(2)}"
    if v.isdigit():                       # bare kilobytes
        return f"{int(v) / 1024:g} MB"
    return v


def sockets(v):
    """
    Scalability -> socket capability. ARK uses nine spellings for eight states:
    '1S Only', 'S2S', '4S_8S', 'S8S' ... all mean a max socket count.
    """
    if not v:
        return DASH
    s = v.upper().replace("_", " ").replace("ONLY", "").strip()
    nums = re.findall(r"(\d+)\s*S", s)
    if not nums:
        return v
    hi = max(int(n) for n in nums)
    return "1S" if hi == 1 else f"Up to {hi}S"


def pcie(rev, lanes):
    """'5.0' + '128' -> 'PCIe 5.0 x128'. Handles 'Gen 4 | Gen 5' dual-rev parts."""
    if not rev:
        # A few ARK rows publish the lane count but not the revision
        return f"x{lanes}" if lanes else DASH
    r = rev.replace("Gen", "").replace("|", "/").strip()
    r = re.sub(r"\s+", " ", r)
    nums = re.findall(r"[\d.]+", r)
    if nums:
        r = " / ".join(f"{float(n):g}.0" if "." not in n else n for n in nums)
    return f"PCIe {r} x{lanes}" if lanes else f"PCIe {r}"


def mem_speed_from_types(v):
    """
    Pull a headline speed out of the free-text Memory Types field, which ARK
    uses instead of Maximum Memory Speed on 158 of these rows. Formats seen:
        'DDR5(6400MT/s) MRDIMM(8800MT/s)'
        'Up to DDR5 4800 MT/s 1DPC  Up to DDR5 4400 MT/s 2DPC'
        'DDR4 1600/1866/2133/2400/2666'
        'DDR5-4800'
    Takes the highest DDR figure -- the 1DPC / peak number, which is how Intel
    markets these and how the AMD rows read.
    """
    if not v:
        return ""
    # Slash-separated speed list, e.g. 'DDR4 1600/1866/2133/2400/2666'. Must be
    # tried FIRST: the generic scan below would stop at 1600 and report the
    # slowest supported speed as the headline figure.
    m = re.match(r"^(DDR\d|LPDDR\d)\s+([\d/]+)\s*$", v.strip(), re.I)
    if m:
        return f"{m.group(1).upper()}-{max(int(x) for x in m.group(2).split('/') if x)}"

    best, kind = 0, ""
    for m in re.finditer(r"(DDR\d|MRDIMM|LPDDR\d)[^\d]{0,12}(\d{3,5})", v, re.I):
        n = int(m.group(2))
        if 800 <= n <= 20000 and n > best:
            best, kind = n, m.group(1).upper()
    if best:
        return f"{kind}-{best}"
    return ""


def memory(max_speed, mem_types, channels):
    """'DDR5-5600 / 8ch' -- speed and channel count in one column."""
    spd = ""
    if max_speed:
        # ARK writes this as MHz on older parts and MT/s on newer ones; both mean
        # MT/s. Pair the number with the DDR generation from Memory Types so the
        # column reads 'DDR5-8800' rather than a bare '8800 MT/s'.
        m = re.match(r"^([\d.]+)\s*(MHz|MT/s)$", max_speed, re.I)
        if m:
            t = re.match(r"^\s*(DDR\d|LPDDR\d|MRDIMM)", mem_types, re.I)
            n = int(float(m.group(1)))
            spd = f"{t.group(1).upper()}-{n}" if t else f"{n} MT/s"
        else:
            spd = max_speed
    if not spd:
        spd = mem_speed_from_types(mem_types)
    if not spd:
        return DASH
    return f"{spd} / {channels}ch" if channels else spd


def upi(links, speed):
    """'4 x 20 GT/s'. Both fields are sparse; show whichever exists."""
    l = links if links and links != "0" else ""
    s = speed if speed and not speed.startswith("0") else ""
    if l and s:
        return f"{l} x {s}"
    if l:
        return f"{l} links"        # speed unpublished on older parts
    return s or DASH


def capacity(v):
    """'1.12 TB' passes through; blanks become an em dash."""
    return v or DASH


# ── build ──────────────────────────────────────────────────────────────────

def build(path, audit=False):
    raw = Path(path).read_bytes()
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc); break
        except UnicodeDecodeError:
            continue
    else:
        sys.exit(f"could not decode {path}")

    rows = list(csv.reader(text.splitlines()))
    hdr_i = 1 if rows[0][0].strip() == "" else 0
    hdr, data = rows[hdr_i], rows[hdr_i + 1:]
    idx = {h.strip(): i for i, h in enumerate(hdr)}
    if "Codename" not in idx:
        sys.exit("no Codename column -- run tools/assign-xeon-codenames.py first")

    out = collections.OrderedDict()
    fell_through = collections.defaultdict(set)

    for r in data:
        def g(k):
            i = idx.get(k)
            return r[i].strip() if i is not None and i < len(r) else ""

        cn, ct = g("Codename"), g("CoreType")
        total = g("Total Cores")

        # P/E split derived from the product line -- see module docstring
        rec = {
            "n":    clean_name(g("Processor Name")),
            "pc":   total if ct == "P" else "0",
            "ec":   total if ct == "E" else "0",
            "t":    g("Total Threads") or DASH,
            "bas":  ghz(g("Processor Base Frequency")) or DASH,
            "bst":  ghz(g("Max Turbo Frequency")) or DASH,
            "l3":   cache(g("Cache")) or DASH,
            "tdp":  tdp(g("Processor Base Power"), g("Maximum Turbo Power"), g("TDP")) or DASH,
            "skc":  sockets(g("Scalability")),
            "mem":  memory(g("Maximum Memory Speed"), g("Memory Types"),
                           g("Max # of Memory Channels")),
            "cap":  capacity(g("Max Memory Size (dependent on memory type)")),
            "pcie": pcie(g("PCI Express Revision"), g("Max # of PCI Express Lanes")),
            "upi":  upi(g("Max # of UPI Links"), g("Intel® UPI Speed")),
        }
        out.setdefault(cn, []).append(rec)

        if audit:
            if not re.match(r"^[\d.]+ (MB|KB|GB)$", rec["l3"]):
                fell_through["l3"].add(f'{rec["n"]}: {rec["l3"]}')
            if rec["mem"] == DASH:
                fell_through["mem"].add(rec["n"])
            if not re.match(r"^(1S|Up to \dS|—)$", rec["skc"]):
                fell_through["skc"].add(f'{rec["n"]}: {rec["skc"]}')
            if rec["pcie"] != DASH and not re.match(r"^PCIe [\d./ ]+( x\d+)?$", rec["pcie"]):
                fell_through["pcie"].add(f'{rec["n"]}: {rec["pcie"]}')

    # datacenter-first: order SKUs within a card by core count, flagship first
    for k in out:
        out[k].sort(key=lambda m: -int(m["pc"] if m["pc"] != "0" else m["ec"] or 0)
                    if (m["pc"] + m["ec"]).isdigit() else 0)
    return out, fell_through


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv")
    ap.add_argument("-o", "--out")
    ap.add_argument("--audit", action="store_true",
                    help="report values that did not match a known format")
    args = ap.parse_args()

    data, odd = build(args.csv, audit=True)
    total = sum(len(v) for v in data.values())
    print(f"{len(data)} codenames, {total} models\n")
    for k, v in sorted(data.items(), key=lambda x: -len(x[1])):
        print(f"  {k:<32} {len(v):>4}")

    if args.audit:
        print("\n--- values that fell through a normaliser ---")
        for field, items in sorted(odd.items()):
            print(f"\n{field}: {len(items)}")
            for s in sorted(items)[:12]:
                print("   ", s[:88])

    if args.out:
        # 4-space indent + ensure_ascii, matching the existing data files exactly
        txt = json.dumps(data, indent=4, ensure_ascii=True) + "\n"
        with open(args.out, "w", encoding="utf-8", newline="") as f:
            f.write(txt)
        with open(args.out, "r", encoding="utf-8", newline="") as f:
            assert f.read() == txt, "write-back verification failed"
        print(f"\nwrote {args.out}  ({len(txt):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
