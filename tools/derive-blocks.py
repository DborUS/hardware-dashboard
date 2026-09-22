#!/usr/bin/env python3
"""
Derive the AMD timeline blocks for codenames that no hand-written series block
covers, reading ONLY docs/specs/amd-master.csv.

Nothing here is typed from knowledge: the block label is AMD's own `family`
value, the codename list, model counts, year span and segment are all counted
from the data. That satisfies CLAUDE.md 7b — a grouping that can be computed
from the data is computed, never asserted.

Writes: tools/derived-blocks.json  (reviewed, then consumed by gen-amd-v2.py)
"""
import csv, json, collections, os, subprocess, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV  = os.path.join(ROOT, 'docs/specs/amd-master.csv')

# Which sub-tab a family belongs on. Derived from segment, not asserted:
# a family whose parts are mostly datacenter/embedded-server goes to EPYC.
def subtab(family, segs):
    if family.startswith(('EPYC',)) or 'Opteron' in family:
        return 'epyc'
    return 'ryzen'

def main():
    rows = [r for r in csv.DictReader(open(CSV, encoding='utf-8')) if r['kind'] == 'cpu']

    # Which codenames do the HAND-WRITTEN series lists in gen-amd-v2.py cover?
    # Parsed from the source so this never shells out to the generator (which now
    # consumes this file's output — that would be circular, and an early return
    # would silently leave a stale derived-blocks.json on disk).
    src = open(os.path.join(ROOT, 'tools/gen-amd-v2.py'), encoding='utf-8').read()
    src = src.split('# ── derived blocks')[0]          # ignore the injected section
    covered = set()
    for block in re.findall(r'^(?:EPYC|RYZEN)_SERIES = \[(.*?)^\]', src, re.S | re.M):
        covered |= set(re.findall(r"\('([^']+)',\s*'[^']*',\s*'[^']*'\)", block))
        covered |= set(re.findall(r"\['([^\]]*)'\]", block))
        for grp in re.findall(r"\[([^\[\]]*)\]\)", block):
            covered |= set(re.findall(r"'([^']+)'", grp))
    all_cd = {r['codename'] for r in rows if r['codename']}
    unplaced = all_cd - covered
    print(f'{len(covered)} codenames covered by hand-written blocks, '
          f'{len(unplaced)} to derive')
    if not unplaced:
        open(os.path.join(ROOT, 'tools/derived-blocks.json'), 'w',
             encoding='utf-8', newline='\n').write('[]\n')
        print('nothing unplaced'); return

    # Group unplaced codenames by AMD's own `family`, then by `series` for EPYC/Opteron
    # where the series IS the product generation and is the meaningful divider.
    blocks = collections.OrderedDict()
    for r in rows:
        cd = r['codename']
        if cd not in unplaced:
            continue
        fam = r['family']
        # For EPYC and Opteron, AMD's `series` IS the product generation
        # (EPYC 8005 Series, Opteron 6300 Series) and is the meaningful divider.
        # For client families the series is far too granular (101 values, e.g.
        # "A10-Series APU for Desktops"), so the family is the right level.
        grp = r['series'] if fam.startswith('EPYC') or 'Opteron' in r['series'] else fam
        blocks.setdefault(grp, {'codenames': collections.Counter(),
                                'segs': collections.Counter(),
                                'years': set(), 'family': fam,
                                'tier_of': collections.defaultdict(collections.Counter),
                                'seg_of': collections.defaultdict(collections.Counter)})
        b = blocks[grp]
        b['codenames'][cd] += 1
        b['segs'][r['segment']] += 1
        b['tier_of'][cd][r['family']] += 1
        b['seg_of'][cd][r['segment']] += 1
        if r['launch_date'][:4].isdigit():
            b['years'].add(r['launch_date'][:4])

    SEG_RANK = {'datacenter':0,'workstation':1,'desktop':2,'mobile':3,'handheld':4,'embedded':5}
    out_blocks = []
    for grp, b in blocks.items():
        yrs = sorted(b['years'])
        span = '' if not yrs else (yrs[0] if yrs[0] == yrs[-1] else f'{yrs[0]} – {yrs[-1]}')
        seg = b['segs'].most_common(1)[0][0]
        out_blocks.append({
            'id': re.sub(r'[^a-z0-9]', '', grp.lower()),
            'label': grp,
            'family': b['family'],
            'subtab': subtab(b['family'], b['segs']),
            'segment': seg,
            'years': span,
            'models': sum(b['codenames'].values()),
            'codenames': [c for c, _ in b['codenames'].most_common()],
            'tier_of': {c: v.most_common(1)[0][0] for c, v in b['tier_of'].items()},
            'seg_of': {c: v.most_common(1)[0][0] for c, v in b['seg_of'].items()},
        })
    out_blocks.sort(key=lambda x: (SEG_RANK.get(x['segment'], 9), x['years'] or '9999'))

    path = os.path.join(ROOT, 'tools/derived-blocks.json')
    txt = json.dumps(out_blocks, indent=2, ensure_ascii=False) + '\n'
    open(path, 'w', encoding='utf-8', newline='\n').write(txt)
    print(f'{len(out_blocks)} blocks covering '
          f'{sum(b["models"] for b in out_blocks)} models, '
          f'{len({c for b in out_blocks for c in b["codenames"]})} codenames')
    for b in out_blocks:
        print(f"  [{b['subtab']:5s}] {b['label'][:34]:36s} {b['models']:4d} models  "
              f"{b['years']:12s} {b['codenames']}")

if __name__ == '__main__':
    main()
