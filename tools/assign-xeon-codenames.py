#!/usr/bin/env python3
"""
Add a Codename column to the combined Intel ARK Xeon export.

Every rule keys off an ARK field that is objectively determined -- socket,
lithography, model number, launch quarter, vertical segment -- never off a
guess. A SKU no rule can place is written as UNMAPPED and reported, rather
than being given a plausible-looking value (golden rule #1).

Out of scope per Daniel (2026-08-16), tagged and excluded by default:
  * mobile Xeon W / E (BGA1787, BGA1440) -- laptop workstation parts
  * Broadwell-D (BGA1667) -- cutoff drawn at the family boundary, not a year,
    because Broadwell-D spans Q1'15 to Q2'19 and a year cutoff would split it

Usage
-----
    python3 tools/assign-xeon-codenames.py IN.csv -o OUT.csv
    python3 tools/assign-xeon-codenames.py IN.csv --report      # no write
    python3 tools/assign-xeon-codenames.py IN.csv -o OUT.csv --keep-excluded
"""
import argparse, csv, collections, sys
from pathlib import Path

# Codename -> core type. Xeon never publishes an E-core count, so type is a
# property of the product line: Sierra Forest and Clearwater Forest are E-core,
# everything else is P-core. Deriving it this way is the only correct route --
# ARK's "# of Efficiency-cores" is blank or 0 even for the 288-core 6990E+.
CORE_TYPE = {"Clearwater Forest": "E", "Sierra Forest AP": "E", "Sierra Forest SP": "E"}

EXCLUDED = {"DROP-mobile", "DROP-broadwell"}


def classify(get):
    """Return a dashboard codename for one SKU, or None if no rule applies."""
    fam    = get("Family/Generation")
    num    = get("Processor Number")
    sock   = get("Sockets Supported")
    lith   = get("Lithography")
    launch = get("Launch Date")
    seg    = get("Vertical Segment")
    try:
        cores = int(get("Total Cores"))
    except ValueError:
        cores = 0

    if fam == "Xeon 6+":
        return "Clearwater Forest"

    if fam == "Xeon 6":
        # Q1'26 workstation parts have no P/E suffix and sit on LGA4710
        if seg == "Workstation":
            return "Granite Rapids WS"
        if num.endswith("E"):
            return "Sierra Forest AP" if sock == "FCLGA7529" else "Sierra Forest SP"
        # -B suffix / BGA package = edge SoC
        if num.endswith("-B") or sock.startswith("FCBGA"):
            return "Granite Rapids D"
        if sock == "FCLGA7529":
            return "Granite Rapids AP"
        # LGA4710 mainstream and LGA1700 entry both fold into SP
        return "Granite Rapids SP"

    if fam.startswith("5th Gen"):
        return "Emerald Rapids SP"

    if fam.startswith("4th Gen"):
        # Xeon Max 94xx carries HBM2e on package
        return "Sapphire Rapids HBM" if num.startswith("94") and cores >= 32 \
               else "Sapphire Rapids SP"

    if fam.startswith("3rd Gen"):
        # One marketing name, two incompatible platforms
        return "Cooper Lake" if lith.startswith("14") else "Ice Lake-SP"

    if fam.startswith("2nd Gen"):
        if num.startswith("92"):
            return "Cascade Lake-AP"
        if launch == "Q1'20":
            return "Cascade Lake Refresh"
        return "Cascade Lake-SP"

    if fam.startswith("1st Gen"):
        return "Skylake-SP"

    if fam == "Xeon W":
        if sock in ("FCBGA1787", "FCBGA1440"):
            return "DROP-mobile"
        if sock == "FCLGA4677":
            series = num.split("-")[1][:1] if "-" in num else ""
            return "Sapphire Rapids WS-3400/3500" if series == "3" \
                   else "Sapphire Rapids WS-2400/2500"
        if sock == "FCLGA4189":
            return "Ice Lake-W (W-33xx)"
        if sock == "FCLGA3647":
            # W-3175X is Skylake; W-32xx is Cascade Lake. Same socket.
            return "Skylake-W (W-3175X)" if num.startswith("W-3175") \
                   else "Cascade Lake-W (W-32xx)"
        if sock == "FCLGA2066":
            # W-21xx Q3'17 Skylake; W-22xx Q4'19 Cascade Lake. Same socket.
            return "Cascade Lake-W (W-22xx)" if num.startswith("W-22") \
                   else "Skylake-W (W-21xx)"
        if sock == "FCLGA1200":
            return "Rocket Lake-W (W-13xx)" if num.startswith("W-13") \
                   else "Comet Lake-W (W-12xx)"
        return None

    if fam == "Xeon E":
        return {"FCLGA1700": "Raptor Lake-E (E-24xx)",
                "FCLGA1200": "Rocket Lake-E (E-23xx)",
                "FCLGA1151": "Coffee Lake-E (E-21xx)",
                "FCBGA1440": "DROP-mobile"}.get(sock)

    if fam == "Xeon D":
        return {"FCBGA2579": "Ice Lake-D (D-27xx)",
                "FCBGA2227": "Ice Lake-D (D-17xx)",
                "FCBGA2518": "Skylake-D (D-21xx)",
                "FCBGA1667": "DROP-broadwell"}.get(sock)

    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv")
    ap.add_argument("-o", "--out")
    ap.add_argument("--report", action="store_true", help="summarise, write nothing")
    ap.add_argument("--keep-excluded", action="store_true",
                    help="keep mobile and Broadwell-D rows, tagged rather than dropped")
    args = ap.parse_args()

    raw = Path(args.csv).read_bytes()
    for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc); break
        except UnicodeDecodeError:
            continue
    else:
        sys.exit(f"could not decode {args.csv}")

    rows = list(csv.reader(text.splitlines()))
    # ARK exports carry a section-name row above the real header
    hdr_i = 1 if rows[0][0].strip() == "" else 0
    section, hdr, data = (rows[0] if hdr_i else None), rows[hdr_i], rows[hdr_i + 1:]
    idx = {h.strip(): i for i, h in enumerate(hdr)}

    counts, out, unmapped, dropped = collections.Counter(), [], [], 0
    for r in data:
        get = lambda k: (r[idx[k]].strip() if k in idx and idx[k] < len(r) else "")
        cn = classify(get)
        if cn is None:
            unmapped.append((get("Family/Generation"), get("Processor Number"),
                             get("Sockets Supported"), get("Lithography")))
            cn = "UNMAPPED"
        if cn in EXCLUDED and not args.keep_excluded:
            dropped += 1
            continue
        counts[cn] += 1
        out.append([cn, CORE_TYPE.get(cn, "P")] + r)

    print(f"{len(data)} SKUs read")
    print(f"  assigned: {sum(v for k, v in counts.items() if k != 'UNMAPPED')}")
    print(f"  excluded: {dropped}")
    print(f"  UNMAPPED: {len(unmapped)}\n")
    print(f"{'codename':<32} {'type':>4} {'n':>5}")
    print("-" * 44)
    for cn, n in sorted(counts.items(), key=lambda x: (-x[1], x[0])):
        print(f"{cn:<32} {CORE_TYPE.get(cn, 'P'):>4} {n:>5}")

    if unmapped:
        print(f"\n!!! {len(unmapped)} UNMAPPED — no rule matched:")
        for u in unmapped[:25]:
            print(f"   {u[0]:<32} {u[1]:<10} sock={u[2]:<12} lith={u[3]}")

    if args.report or not args.out:
        return 1 if unmapped else 0

    with open(args.out, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        if section:
            w.writerow(["", ""] + section)
        w.writerow(["Codename", "CoreType"] + hdr)
        w.writerows(out)
    print(f"\nwrote {len(out)} rows to {args.out}")
    return 1 if unmapped else 0


if __name__ == "__main__":
    sys.exit(main())
