#!/usr/bin/env python3
"""
Check that SKUs within each architecture run datacenter -> client -> desktop -> mobile.

The dashboard's audience is datacenter presales, so server parts must lead every SKU
list and consumer silicon must not sit above them.

*** SCOPE CHANGED 2026-08-27 -- READ THIS BEFORE ACTING ON A FAILURE. ***

Both vendors are now product-first (js/amd-v2.js, js/intel-v2.js) and neither
reads SKU order out of these JSON files any more:

  * js/data/intel-data.json  -- rendered by NOTHING. Legacy.
  * js/data/amd-data.json    -- still read by tools/gen-amd-v2.py, but only for
                                arch / year / subtitle lookups keyed by name.
                                Block and card order come from EPYC_SERIES and
                                RYZEN_SERIES in the generator.

So a failure here is a DATA-HYGIENE warning, not a user-visible defect. The two
long-standing violations (Zen 4 Phoenix, Raptor Lake 14th Gen Xeon E / W-2400)
are invisible on the rendered page. Fix them for tidiness, or leave them; do not
report them to Daniel as rendering bugs.

**What actually governs the rendered order now** is the ordering of EPYC_SERIES /
RYZEN_SERIES / gpu_blocks in tools/gen-amd-v2.py and of the `gens` arrays in
js/intel-v2.js. Those are hand-ordered and are NOT checked by this script.

What it CANNOT check: ordering *within* a tier. "Strix Halo before Strix Point" needs
to know Halo is the bigger part; that stays a review-time judgement. See the
"SKU ordering within an architecture" section of docs/DATA-SCHEMA.md.

Usage
-----
    python3 tools/check-order.py           # all data files; exit 1 on violation
    python3 tools/check-order.py --fix     # print corrected order (does NOT write)
    python3 tools/check-order.py js/data/amd-data.json
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_FILES = ["js/data/amd-data.json", "js/data/intel-data.json"]

# Lower rank sorts first. Mirrors the table in docs/DATA-SCHEMA.md.
TIER = {
    "server": 0,
    "workstation": 1,
    "desktop": 2,
    "laptop": 3, "mobile": 3,
    "handheld": 4,
    "embedded": 5, "iot": 5,
}
TIER_NAME = {0: "datacenter", 1: "workstation", 2: "desktop",
             3: "mobile", 4: "handheld", 5: "embedded"}

# Brands that imply a tier regardless of tags. Threadripper and Xeon W are
# workstation parts that carry a plain "desktop" tag.
BRAND_TIER = {"Threadripper": 1}
WORKSTATION_HINTS = ("Xeon W", "Xeon E")


def rank(sku):
    """Strongest (lowest) tier implied by a SKU's brand and tags."""
    brand = sku.get("brand") or ""
    if brand in BRAND_TIER:
        return BRAND_TIER[brand]
    tags = sku.get("tags") or []
    # "desktop" + "pro" together means a workstation part, not a consumer one.
    if "pro" in tags and "desktop" in tags and "laptop" not in tags:
        return 1
    if any(h in (sku.get("name") or "") for h in WORKSTATION_HINTS):
        return 1
    ranks = [TIER[t] for t in tags if t in TIER]
    return min(ranks) if ranks else 9


def check(path, show_fix=False):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    problems = 0

    for arch in data:
        if "era" in arch:
            continue
        skus = arch.get("skus") or []
        ranks = [rank(s) for s in skus]

        bad = [i for i in range(len(ranks) - 1) if ranks[i] > ranks[i + 1]]
        if not bad:
            continue

        problems += 1
        print(f"\n  {arch.get('arch', arch.get('id'))}")
        for i, (r, s) in enumerate(zip(ranks, skus)):
            flag = "  <-- should come earlier" if i - 1 in bad else ""
            label = TIER_NAME.get(r, "unknown")
            print(f"      [{r}] {label:<12} {s.get('name','?')}{flag}")

        if show_fix:
            # Stable sort keeps hand-tuned intra-tier order intact.
            fixed = sorted(range(len(skus)), key=lambda i: ranks[i])
            print("      suggested order:")
            for i in fixed:
                print(f"        {skus[i].get('name','?')}")

    return problems


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="*", default=None)
    ap.add_argument("--fix", action="store_true",
                    help="print the corrected order (does not modify files)")
    args = ap.parse_args()

    files = args.files or DEFAULT_FILES
    total = 0
    for f in files:
        p = ROOT / f if not Path(f).is_absolute() else Path(f)
        if not p.exists():
            print(f"SKIP {f} (not found)")
            continue
        print(f"{f}:", end="")
        n = check(p, args.fix)
        print("  ok" if n == 0 else f"\n  {n} architecture(s) out of order")
        total += n

    print()
    if total:
        print(f"FAIL — {total} architecture(s) violate datacenter-first ordering.")
        print("Reorder the SKU arrays; see docs/DATA-SCHEMA.md 'SKU ordering'.")
        return 1
    print("PASS — all SKU lists run datacenter -> client -> desktop -> mobile.")
    print("Note: intra-tier performance order is not machine-checkable; review by eye.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
