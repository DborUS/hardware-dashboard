#!/usr/bin/env python3
"""
Scrape an Intel ARK product-series page into a CSV that tools/import-specs.py can read.

Intel offers no CSV export, so the alternative is transcribing spec tables by hand --
error-prone and slow. ARK series pages render a real <table> of SKUs, which this parses
directly. The output goes through the normal importer, so the same verification and
guard-rails apply.

Usage
-----
    # Print the table so you can eyeball it before committing to anything
    python3 tools/scrape-ark.py https://www.intel.com/.../245944/....html

    # Write a CSV for the importer
    python3 tools/scrape-ark.py <url> -o /tmp/xeon6plus.csv

    # Some series split across several pages; pass more than one URL
    python3 tools/scrape-ark.py <url1> <url2> -o /tmp/combined.csv

Then:
    python3 tools/import-specs.py inspect /tmp/xeon6plus.csv --target intel-cpu
    python3 tools/import-specs.py import /tmp/xeon6plus.csv --target intel-cpu \
        --sku "Clearwater Forest" --map map.json --server

Notes
-----
ARK series pages carry only the headline columns (cores, clocks, cache, TDP). Fields the
dashboard also shows -- socket, PCIe, memory, tray ID -- live on the individual product
pages, not the series table. Use --detail to follow those links, at the cost of one
request per SKU.
"""

import argparse
import csv
import html
import re
import sys
import time
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " \
     "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"


def fetch(url, timeout=45):
    """
    Read a previously-saved ARK page from disk.

    This script does NOT make network requests. Intel blocks direct programmatic
    access, and fetching around that restriction isn't appropriate -- so pages are
    retrieved with the environment's own web-fetch tooling and saved locally, then
    parsed here. Pass a file path, or a URL plus --cache-dir holding the saved HTML.
    """
    path = Path(url)
    if path.exists():
        return path.read_text(encoding="utf-8", errors="replace")
    raise SystemExit(
        f"Not a local file: {url}\n"
        "This parser reads saved HTML, it does not fetch. Save the ARK page first, "
        "then pass the file path."
    )


def clean(fragment):
    """Strip tags and normalise whitespace/entities from one table cell."""
    txt = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(txt)).strip()


def parse_series(page):
    """
    Pull every <table> that looks like a SKU list and return (headers, rows).

    ARK renders several tables per page; the SKU table is the one whose first column
    header is 'Product Name'. Matching on that rather than position keeps this working
    if Intel reorders the page.
    """
    out_hdrs, out_rows = None, []
    for tbl in re.findall(r"<table[^>]*>.*?</table>", page, re.S | re.I):
        hdrs = [clean(h) for h in re.findall(r"<th[^>]*>(.*?)</th>", tbl, re.S | re.I)]
        hdrs = [h for h in hdrs if h]
        if not hdrs or "product name" not in hdrs[0].lower():
            continue
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", tbl, re.S | re.I):
            cells = [clean(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S | re.I)]
            cells = [c for c in cells if c]
            if not cells or cells[0].lower() == "product name":
                continue
            if len(cells) < 2:
                continue
            out_rows.append(cells)
        out_hdrs = out_hdrs or hdrs
    return out_hdrs, out_rows


def product_links(page):
    """Product-detail URLs from a series page, in table order, de-duplicated."""
    links = re.findall(r'href="(/content/www/us/en/products/sku/\d+/[^"]+)"', page)
    seen, out = set(), []
    for l in links:
        if l not in seen:
            seen.add(l)
            out.append("https://www.intel.com" + l)
    return out


# Fields on an ARK product page worth having, mapped to the dashboard's schema names.
DETAIL_FIELDS = {
    "Sockets Supported": "sk",
    "Max # of PCI Express Lanes": "pcie_lanes",
    "PCI Express Revision": "pcie_rev",
    "Max Memory Speed": "mem",
    "Memory Types": "mem_types",
    "Max # of UPI Links": "upi",
    "Total Threads": "t",
    "# of Performance-cores": "pcores",
    "# of Efficient-cores": "ecores",
    "Processor Base Power": "tdp_base",
    "Maximum Turbo Power": "tdp_max",
}


def parse_detail(page):
    """Scrape label/value pairs from a single ARK product page."""
    found = {}
    for label, key in DETAIL_FIELDS.items():
        m = re.search(
            re.escape(label) + r"\s*</span>.*?<span[^>]*>(.*?)</span>",
            page, re.S | re.I)
        if m:
            v = clean(m.group(1))
            if v and v not in {"-", "N/A"}:
                found[key] = v
    return found


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("urls", nargs="+", help="path(s) to saved ARK series page HTML")
    ap.add_argument("-o", "--out", help="write CSV here (default: print a preview)")
    ap.add_argument("--detail", action="store_true",
                    help="also fetch each product page for socket/PCIe/memory (slow)")
    ap.add_argument("--delay", type=float, default=1.0,
                    help="seconds between requests when using --detail (default 1.0)")
    args = ap.parse_args()

    headers, rows, details = None, [], []
    for url in args.urls:
        print(f"fetching {url}", file=sys.stderr)
        page = fetch(url)
        h, r = parse_series(page)
        if not r:
            print(f"  WARNING: no SKU table found on {url}", file=sys.stderr)
            continue
        headers = headers or h
        rows.extend(r)
        print(f"  {len(r)} SKUs", file=sys.stderr)

        if args.detail:
            links = product_links(page)
            print(f"  fetching {len(links)} product pages...", file=sys.stderr)
            for i, link in enumerate(links, 1):
                try:
                    details.append(parse_detail(fetch(link)))
                except Exception as e:
                    print(f"    {i}: FAILED {e}", file=sys.stderr)
                    details.append({})
                time.sleep(args.delay)

    if not rows:
        print("ERROR: nothing scraped", file=sys.stderr)
        return 1

    # widen the header if any row has extra cells
    width = max(len(r) for r in rows)
    while len(headers) < width:
        headers.append(f"col{len(headers)+1}")

    extra = sorted({k for d in details for k in d})
    out_headers = headers + extra

    def row_dict(i, r):
        d = dict(zip(headers, r))
        if i < len(details):
            d.update(details[i])
        return d

    records = [row_dict(i, r) for i, r in enumerate(rows)]

    if args.out:
        with open(args.out, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=out_headers, extrasaction="ignore")
            w.writeheader()
            w.writerows(records)
        print(f"\nwrote {len(records)} rows to {args.out}")
        print(f"columns: {', '.join(out_headers)}")
    else:
        print("\n" + " | ".join(out_headers))
        print("-" * 100)
        for d in records:
            print(" | ".join(str(d.get(h, "")) for h in out_headers))
        print(f"\n{len(records)} SKUs. Re-run with -o FILE to write a CSV.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
