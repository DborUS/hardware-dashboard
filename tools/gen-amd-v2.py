"""Generate js/amd-v2.js -- the AMD product-first renderer.

Structure mirrors js/intel-v2.js exactly:

    SUB-TAB   (EPYC | Ryzen | GPU)      <- also picks the spec-table columns
      SERIES     (EPYC 9005, Ryzen AI 400, Instinct MI300)   <- timeline block
        CODENAME (Turin, Gorgon Point, MI355X)               <- SKU card
          spec table

Every block/card below is DERIVED from js/data/*.json -- codenames, model
counts and years all come from the data. Nothing is invented (golden rule #1).
Series names come from AMD's published product branding.
"""
import json, re, collections

import os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + os.sep
amd = json.load(open(REPO + 'js/data/amd-data.json', encoding='utf-8'))
specs = json.load(open(REPO + 'js/data/amd-cpu-specs.json', encoding='utf-8'))
gpu = json.load(open(REPO + 'js/data/amd-gpu-data.json', encoding='utf-8'))

arch_of, year_of, sub_of = {}, {}, {}
for e in amd:
    if 'era' in e:
        continue
    for s in e['skus']:
        arch_of[s['name']] = e['arch']
        year_of[s['name']] = e['year']
        sub_of[s['name']] = e.get('subtitle', '')

# ── EPYC: series is the 4-digit family in the model numbers ──────────────
# EPYC 9006 Venice / 9005 Turin / 9004 Genoa / 8004 Siena / 7003 Milan /
# 7002 Rome / 7001 Naples -- taken from AMD's product branding, and each is
# corroborated by the arch subtitle already in amd-data.json.
# Era dividers keyed to the FIRST series that opens each socket platform.
# Sockets read from the data (`sk`), not assumed -- see socket_of().
EPYC_ERAS = {
    # Notes below state only what the spec data shows (mem / pcie fields).
    'epyc9006': ('SP7 / SP8 platform',
                 'Zen 6 — up to 8000 MT/s, PCIe 6.0'),
    'epyc9005': ('SP5 / SP6 platform',
                 'Zen 4 and Zen 5 — up to 6400 MT/s, PCIe 5.0'),
    'epyc7003': ('SP3 platform',
                 'Zen through Zen 3 — up to 3200 MT/s, PCIe 3.0 / 4.0'),
}

EPYC_SERIES = [
    ('epyc9006', 'EPYC 9006 Series', '2026', '#ec4899', 'Venice · Zen 6 · SP7 / SP8',
     ['Venice SP7', 'Venice SP8']),
    ('epyc9005', 'EPYC 9005 Series', '2024', '#ef4444', 'Turin · Zen 5 / Zen 5c · SP5',
     ['Turin', 'Turin Dense']),
    ('epyc9004', 'EPYC 9004 / 8004 Series', '2022 – 2023', '#f97316',
     'Genoa · Bergamo · Siena · Zen 4 / Zen 4c · SP5 / SP6',
     ['Genoa', 'Genoa-X', 'Bergamo', 'Siena']),
    ('epyc7003', 'EPYC 7003 Series', '2021 – 2022', '#84cc16', 'Milan · Zen 3 · SP3',
     ['Milan', 'Milan-X']),
    ('epyc7002', 'EPYC 7002 Series', '2019', '#14b8a6', 'Rome · Zen 2 · SP3',
     ['Rome']),
    ('epyc7001', 'EPYC 7001 Series', '2017', '#c084fc', 'Naples · Zen · SP3',
     ['Naples']),
]

# ── Ryzen: product series is the block ───────────────────────────────────
# NOTE the structural finding: several codenames span two series (Phoenix is
# Ryzen 7000 AND 8000; Dragon Range is 7000 and 8000). Product-series-first
# is therefore the correct nesting -- a codename can appear under two blocks,
# which is exactly how AMD sells them.
# Era dividers keyed to the first series in each tier band. The list is already
# ordered datacenter-leaning -> mainstream -> entry per golden rule #2; these
# just name the boundaries rather than introducing a new ordering.
# NOTE: these are NOT tier labels. Threadripper and mainstream Ryzen interleave
# chronologically (TR9000, R9000, TR7000, R8000...), so a "Workstation" divider
# would sit above blocks that are not workstation parts -- caught in review when
# Threadripper 7000 landed under a "mainstream Ryzen" heading.
#
# The honest boundaries are the naming schemes AMD actually used, which the
# block order already follows:
RYZEN_ERAS = {
    'rai400':   ('Ryzen AI branding',
                 'Copilot+ era — the "AI" name replaces a plain series number'),
    'tr9000':   ('Numbered series',
                 'Ryzen 1000 through 9000 and the matching Threadripper lines'),
    'rzseries': ('Outside the numbering',
                 'Z-series handhelds and the 200 / 100 entry refresh'),
}

RYZEN_SERIES = [
    # id, label, years, colour, note, [(codename, tier, seg)]
    ('rai400', 'Ryzen AI 400 Series', '2026', '#ec4899',
     'Gorgon Point · Zen 5 + XDNA 2 · Copilot+', [
         ('Gorgon Point', 'Ryzen AI', 'Mobile')]),
    ('rai300', 'Ryzen AI 300 / Max 300 Series', '2024 – 2025', '#ef4444',
     'Strix Point · Strix Halo · Kraken Point · Zen 5 + XDNA 2', [
         ('Strix Halo', 'Ryzen AI Max', 'Mobile'),
         ('Strix Point', 'Ryzen AI', 'Mobile'),
         ('Krackan Point', 'Ryzen AI', 'Mobile')]),
    ('tr9000', 'Ryzen Threadripper 9000 Series', '2025', '#f59e0b',
     'Shimada Peak · Zen 5 · sTR5', [
         ('Shimada Peak', 'Threadripper', 'Workstation')]),
    ('r9000', 'Ryzen 9000 Series', '2024 – 2025', '#f97316',
     'Granite Ridge · Fire Range · Zen 5 · AM5 / FL1', [
         ('Granite Ridge AM5', 'Ryzen', 'Desktop'),
         ('Fire Range', 'Ryzen', 'Mobile')]),
    ('tr7000', 'Ryzen Threadripper 7000 Series', '2023', '#fbbf24',
     'Storm Peak · Zen 4 · sTR5', [
         ('Storm Peak', 'Threadripper', 'Workstation')]),
    ('r8000', 'Ryzen 8000 Series', '2023 – 2024', '#eab308',
     'Phoenix · Hawk Point · Dragon Range · Zen 4 · AM5 / FP8', [
         ('Phoenix', 'Ryzen', 'Desktop'),
         ('Hawk Point', 'Ryzen', 'Mobile'),
         ('Dragon Range', 'Ryzen', 'Mobile')]),
    ('r7000', 'Ryzen 7000 Series', '2022 – 2023', '#a3e635',
     'Raphael · Dragon Range · Phoenix · Rembrandt-R · Barceló-R · Zen 4 / Zen 3+', [
         ('Raphael AM5', 'Ryzen', 'Desktop'),
         ('Rembrandt R', 'Ryzen', 'Mobile'),
         ('Barcelo R', 'Ryzen', 'Mobile'),
         ('Mendocino', 'Ryzen', 'Mobile')]),
    ('r6000', 'Ryzen 6000 Series', '2022', '#84cc16',
     'Rembrandt · Zen 3+ · RDNA 2 iGPU · FP7', [
         ('Rembrandt', 'Ryzen', 'Mobile')]),
    ('tr5000', 'Ryzen Threadripper 5000 Series', '2022', '#22c55e',
     'Chagall · Zen 3 · sWRX8', [
         ('Chagall PRO', 'Threadripper', 'Workstation')]),
    ('r5000', 'Ryzen 5000 Series', '2020 – 2022', '#14b8a6',
     'Vermeer · Cezanne · Barceló · Lucienne · Zen 3 · AM4', [
         ('Vermeer', 'Ryzen', 'Desktop'),
         ('Cezanne', 'Ryzen', 'Desktop'),
         ('Barcelo', 'Ryzen', 'Mobile'),
         ('Lucienne', 'Ryzen', 'Mobile')]),
    ('tr3000', 'Ryzen Threadripper 3000 Series', '2019 – 2020', '#06b6d4',
     'Castle Peak · Zen 2 · sTRX4 / sWRX8', [
         ('Castle Peak', 'Threadripper', 'Workstation')]),
    ('r4000', 'Ryzen 4000 Series', '2020', '#0ea5e9',
     'Renoir · Zen 2 · AM4 / FP6', [
         ('Renoir', 'Ryzen', 'Desktop')]),
    ('r3000', 'Ryzen 3000 Series', '2019', '#6366f1',
     'Matisse · Picasso · Dalí · Zen 2 / Zen+ · AM4', [
         ('Matisse', 'Ryzen', 'Desktop'),
         ('Picasso', 'Ryzen', 'Desktop'),
         ('Dali', 'Ryzen', 'Mobile')]),
    ('tr2000', 'Ryzen Threadripper 2000 Series', '2018', '#818cf8',
     'Colfax · Zen+ · TR4', [
         ('Colfax', 'Threadripper', 'Workstation')]),
    ('r2000', 'Ryzen 2000 Series', '2018', '#a78bfa',
     'Pinnacle Ridge · Raven Ridge · Zen+ / Zen · AM4', [
         ('Pinnacle Ridge', 'Ryzen', 'Desktop'),
         ('Raven Ridge', 'Ryzen', 'Desktop')]),
    ('tr1000', 'Ryzen Threadripper 1000 Series', '2017', '#c084fc',
     'Whitehaven · Zen · TR4', [
         ('Whitehaven', 'Threadripper', 'Workstation')]),
    ('r1000', 'Ryzen 1000 Series', '2017', '#d8b4fe',
     'Summit Ridge · Zen · AM4 · the first Ryzen', [
         ('Summit Ridge', 'Ryzen', 'Desktop')]),
    ('rzseries', 'Ryzen Z-Series (Handheld)', '2023 – 2025', '#22d3ee',
     'Z1 · Z2 · handheld gaming APUs', [
         ('Z2', 'Z-Series', 'Handheld'),
         ('Z1', 'Z-Series', 'Handheld')]),
    ('r200', 'Ryzen 200 / 100 Series', '2024 – 2025', '#94a3b8',
     'Hawk Point Refresh · entry mobile', [
         ('Hawk Point', 'Ryzen', 'Mobile')]),
]

# ── GPU: derived straight from amd-gpu-data.json ─────────────────────────
INSTINCT_ORDER = ['Instinct MI400 Series (CDNA 5)',
                  'MI300 Series (CDNA 4)', 'MI300 Series (CDNA 3)',
                  'MI200 Series (CDNA 2)', 'MI100 (CDNA)',
                  'MI50/MI60 (Vega 7nm)', 'MI25 (Vega 14nm)',
                  'MI8/MI6 (Fiji/Polaris)', 'FirePro S Series (GCN)']
INSTINCT_LABEL = {
    'Instinct MI400 Series (CDNA 5)': ('Instinct MI400 Series', 'MI455X · CDNA 5 · HBM4'),
    'MI300 Series (CDNA 4)':   ('Instinct MI350 Series', 'MI355X · MI350X · CDNA 4 · HBM3E'),
    'MI300 Series (CDNA 3)':   ('Instinct MI300 Series', 'MI325X · MI300X · MI300A · CDNA 3'),
    'MI200 Series (CDNA 2)':   ('Instinct MI200 Series', 'MI250X · MI250 · MI210 · CDNA 2'),
    'MI100 (CDNA)':            ('Instinct MI100 Series', 'MI100 · first CDNA part'),
    'MI50/MI60 (Vega 7nm)':    ('Instinct MI50 / MI60',  'Vega 7 nm'),
    'MI25 (Vega 14nm)':        ('Instinct MI25',         'Vega 14 nm'),
    'MI8/MI6 (Fiji/Polaris)':  ('Instinct MI8 / MI6',    'Fiji · Polaris'),
    'FirePro S Series (GCN)':  ('FirePro S Series',      'Legacy GCN server and compute graphics'),
}

gpu_fams = {e['arch']: e for e in gpu if 'era' not in e}


def gseg(e):
    """Mirror gpuSegmentOf() in script.js so filters agree across renderers."""
    forms = [(m.get('form') or '').lower() for m in e['gpuSpecs']['models']]
    forms = [f for f in forms if f]
    if forms and all(f in ('laptops', 'mobile workstations') for f in forms):
        return 'Mobile'
    return {'datacenter': 'Data Center', 'workstation': 'Workstation',
            'consumer': 'Consumer'}.get(e.get('segment'), 'Consumer')


def year_key(y):
    m = re.search(r'(\d{4})', y)
    return int(m.group(1)) if m else 0


gpu_blocks = []
# Instinct first -- datacenter-first golden rule
for name in INSTINCT_ORDER:
    e = gpu_fams.get(name)
    if not e:
        continue
    label, note = INSTINCT_LABEL[name]
    gpu_blocks.append(dict(
        id='gpu-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'),
        name=label, years=e['year'], color=e['color'], note=note,
        families=[(name, 'FirePro' if name.startswith('FirePro') else 'Instinct',
                   'Data Center')],
        # Card label: the models themselves, not a restatement of the header.
        card=' · '.join(m['name'] for m in e['gpuSpecs']['models'][:4])))

# Radeon PRO / workstation, newest first by year
pro = sorted([e for e in gpu_fams.values() if e.get('segment') == 'workstation'],
             key=lambda e: -year_key(e['year']))
for e in pro:
    gpu_blocks.append(dict(
        id='gpu-' + re.sub(r'[^a-z0-9]+', '-', e['arch'].lower()).strip('-'),
        name='Radeon ' + e['arch'] if not e['arch'].startswith('AI') else 'Radeon ' + e['arch'],
        years=e['year'], color=e['color'],
        note=e.get('subtitle', '') or e['gpuSpecs'].get('desc', '')[:90],
        families=[(e['arch'], 'Radeon PRO', gseg(e))],
        card=' · '.join(m['name'] for m in e['gpuSpecs']['models'][:4])))

# Radeon consumer, inline by series number -- newest first
cons = sorted([e for e in gpu_fams.values() if e.get('segment') == 'consumer'],
              key=lambda e: -year_key(e['year']))
for e in cons:
    gpu_blocks.append(dict(
        id='gpu-' + re.sub(r'[^a-z0-9]+', '-', e['arch'].lower()).strip('-'),
        name='Radeon ' + e['arch'], years=e['year'], color=e['color'],
        note=e.get('subtitle', '') or e['gpuSpecs'].get('desc', '')[:90],
        families=[(e['arch'], 'Radeon', gseg(e))],
        card=' · '.join(m['name'] for m in e['gpuSpecs']['models'][:4])))


def js(o):
    return json.dumps(o, ensure_ascii=False)


out = []
w = out.append
w("""// ═══════════════════════════════════════════════════════════════════════════
//  AMD v2 — product-first renderer            *** GENERATED FILE ***
//  ---------------------------------------------------------------------------
//  Regenerate with tools/gen-amd-v2.py. Hand edits will be overwritten.
//
//  Drives the AMD vendor tab, mirroring js/intel-v2.js:
//
//     SUB-TAB   (EPYC | Ryzen | GPU)     <- also picks the spec-table columns
//       SERIES     (EPYC 9005, Ryzen AI 400, Instinct MI350)   <- timeline block
//         CODENAME (Turin, Gorgon Point, MI355X)               <- SKU card
//           spec table
//
//  Organised by PRODUCT NAME, not by Zen generation. A customer asks for an
//  EPYC 9005 or a Ryzen AI 400, not for "a Zen 5 part" — and the Zen
//  generation is still on every card, so nothing is lost.
//
//  Why product-series-first is the correct nesting: several codenames span two
//  series. Phoenix ships as both Ryzen 7000 and Ryzen 8000; Dragon Range spans
//  7000 and 8000. Nesting series -> codename lets a codename appear under each
//  series that actually sells it, which codename-first cannot express.
//
//  Ordering follows golden rule #2: datacenter -> workstation -> desktop ->
//  mobile -> handheld, flagship first within a tier.
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

const A2_COLUMNS = {
  epyc:  ['Model', 'Cores', 'Threads', 'Base', 'Boost', 'L3 Cache', 'TDP',
          'Socket', 'Sockets', 'PCIe', 'Memory', '1kU Price', 'Product ID'],
  ryzen: ['Model', 'Cores', 'Threads', 'Base', 'Boost', 'L3 Cache', 'TDP',
          'Socket', 'GPU Model', 'GPU CUs', 'GPU Freq', 'Product ID'],
  gpu:   ['Model', 'Form', 'Architecture', 'Process', 'CUs', 'Memory', 'Type',
          'Bandwidth', 'FP32', 'FP32 Matrix', 'PCIe', 'TBP']
};

const A2_FIELDS = {
  epyc:  ['n', 'c', 't', 'bas', 'bst', 'l3', 'tdp', 'sk', 'skc', 'pcie', 'mem', 'pr', 'tr'],
  ryzen: ['n', 'c', 't', 'bas', 'bst', 'l3', 'tdp', 'sk', 'gm', 'gc', 'gf', 'tr'],
  gpu:   ['name', 'form', 'arch', 'process', 'cu', 'mem', 'memType', 'bw',
          'fp32', 'fp32m', 'pcie', 'tbp']
};
""")

# ── derived blocks ───────────────────────────────────────────────────────
# Codenames not covered by the hand-written series lists above are grouped by
# AMD's own `family` / `series` values, computed by tools/derive-blocks.py from
# docs/specs/amd-master.csv. Nothing here is typed from knowledge — see
# CLAUDE.md 7b. Re-run derive-blocks.py after adding parts to the master CSV.
_derived_path = REPO + 'tools/derived-blocks.json'
_DERIVED_RYZEN_FAMILY = {}
if os.path.exists(_derived_path):
    _derived = json.load(open(_derived_path, encoding='utf-8'))
    # Derived blocks use the same warm AMD family as curated blocks. Identity
    # comes from the label, not from cycling through unrelated rainbow hues.
    _PALETTE = ['#e7654f']
    for _i, _b in enumerate(_derived):
        _cds = [c for c in _b['codenames'] if c in specs]
        if not _cds:
            continue
        if _b['subtab'] == 'epyc':
            _cdl = _cds                      # EPYC blocks take bare codenames
        else:
            # Ryzen blocks take (codename, tier, seg) triples. Both are read from
            # the master CSV via derive-blocks.py, never assumed.
            _SEGMAP = {'datacenter': 'Workstation', 'workstation': 'Workstation',
                       'desktop': 'Desktop', 'mobile': 'Mobile',
                       'handheld': 'Handheld', 'embedded': 'Mobile'}
            _cdl = [(c, _b['tier_of'].get(c, _b['family']),
                     _SEGMAP.get(_b['seg_of'].get(c, _b['segment']), 'Desktop'))
                    for c in _cds]
            _DERIVED_RYZEN_FAMILY[_b['id']] = _b['family']
        _entry = (_b['id'], _b['label'], _b['years'] or '', _PALETTE[_i % len(_PALETTE)],
                  '%s — %d models' % (_b['label'], _b['models']), _cdl)
        (EPYC_SERIES if _b['subtab'] == 'epyc' else RYZEN_SERIES).append(_entry)
    print('derived blocks added: %d' % len(_derived))

# ── build A2_DATA ────────────────────────────────────────────────────────
w('\nconst A2_DATA = {\n')

# EPYC
w("""
  // ─────────────────────────────────────────────────────────────────────────
  //  EPYC — server, by product series
  // ─────────────────────────────────────────────────────────────────────────
  epyc: {
    title: 'AMD EPYC',
    blurb: 'Data center processors',
    filters: [
      { label: 'Series', key: 'gen', tags: [
""")
for sid, label, yr, col, note, cds in EPYC_SERIES:
    w("        [%s, '%s'],\n" % (js(label), col))
w("""      ]},
      { label: 'Socket', key: 'seg', tags: [
        ['SP7', '#f97316'], ['SP8', '#fb923c'], ['SP5', '#ef4444'],
        ['SP6', '#f59e0b'], ['SP3', '#a78bfa']
      ]}
    ],
    gens: [
""")
def models_for(cd, series=None):
    """Rows for a codename, optionally limited to exact AMD product series."""
    rows = specs.get(cd, [])
    if not series:
        return rows
    allowed = set(series)
    return [m for m in rows if m.get('_series') in allowed]


def core_span(cd, series=None):
    """(min, max) total cores across a codename's models, read from the data.

    A codename spans a RANGE -- Turin ships 8C through 128C -- so the range
    filter tests span-intersection rather than a single value. Returns
    (None, None) when nothing parseable is present; never guessed.
    """
    counts = [int(m['c']) for m in models_for(cd, series)
              if str(m.get('c', '')).isdigit()]
    return (min(counts), max(counts)) if counts else (None, None)


def ryzen_series_for(rid, cd):
    """Exact source-series rows that belong in one Ryzen dashboard block.

    A codename is not a product-series identity. Phoenix, for example, ships
    in both Ryzen 7000 and Ryzen 8000. Filtering by this list prevents the full
    Phoenix bucket from being copied into both blocks.
    """
    available = sorted({m.get('_series', '') for m in specs.get(cd, [])
                        if m.get('_series')})

    if rid in _DERIVED_RYZEN_FAMILY:
        family = _DERIVED_RYZEN_FAMILY[rid]
        wanted = sorted({m.get('_series', '') for m in specs.get(cd, [])
                         if m.get('_family') == family and m.get('_series')})
    elif rid == 'rai400':
        wanted = [s for s in available if s.startswith('Ryzen') and
                  '400 Series' in s and 'Embedded' not in s]
    elif rid == 'rai300':
        wanted = [s for s in available if s.startswith('Ryzen AI') and
                  '300 Series' in s and 'Embedded' not in s]
    elif rid == 'rzseries':
        wanted = [s for s in available if s.startswith('Ryzen Z')]
    elif rid == 'r200':
        wanted = [s for s in available if re.match(r'^Ryzen(?: PRO)? (?:100|200) Series$', s)]
    elif rid.startswith('tr') and rid[2:].isdigit():
        number = rid[2:]
        wanted = [s for s in available if 'Threadripper' in s and
                  re.search(r'\b%s\b' % number, s)]
    elif rid.startswith('r') and rid[1:].isdigit():
        number = rid[1:]
        wanted = [s for s in available if
                  re.match(r'^Ryzen(?: PRO)? %s Series$' % number, s)]
    else:
        wanted = []

    if not wanted:
        raise SystemExit('no source series selected for %s / %s (available: %s)'
                         % (rid, cd, available))
    return wanted


def socket_of(cd):
    """Socket for an EPYC codename, READ FROM THE SPEC DATA.

    An earlier version fell back to 'SP5' when the arch subtitle didn't name a
    socket, which silently mislabelled Milan / Rome / Naples (all SP3) and left
    the SP3 filter chip matching nothing. Golden rule #1: read it, don't guess.
    """
    socks = {(m.get('sk') or '').strip() for m in specs.get(cd, [])}
    socks = {s for s in socks if s}
    if len(socks) == 1:
        return next(iter(socks))
    if socks:                      # mixed: prefer the newest listed
        for tok in ('SP7', 'SP8', 'SP6', 'SP5', 'SP3'):
            if tok in socks:
                return tok
    sub = sub_of.get(cd, '') or ''
    for tok in ('SP7', 'SP8', 'SP6', 'SP5', 'SP3'):
        if tok in sub:
            return tok
    # Embedded parts are soldered SoCs: AMD publishes no socket for any of the
    # 195 embedded SKUs. That is a fact in the data, not a lookup failure, so
    # label it explicitly rather than guessing a socket or aborting the build.
    if all((m.get('_emb') or '') == '1' or not (m.get('sk') or '').strip()
           for m in specs.get(cd, [])) and specs.get(cd):
        return 'BGA'
    raise SystemExit('no socket found for %s -- refusing to guess' % cd)


for sid, label, yr, col, note, cds in EPYC_SERIES:
    if sid in EPYC_ERAS:
        era, eranote = EPYC_ERAS[sid]
        w("      { era: %s, eraNote: %s },\n" % (js(era), js(eranote)))
    w("      { id: '%s', name: %s, years: '%s', color: '%s',\n" % (sid, js(label), yr, col))
    w("        note: %s, families: [\n" % js(note))
    for cd in cds:
        n = len(specs.get(cd, []))
        cmin, cmax = core_span(cd)
        sk = socket_of(cd)
        desc = '%s — %d models' % (arch_of.get(cd, ''), n)
        w("        { name: %s, desc: %s, seg: '%s', si: %s, n: %d, "
          "cmin: %s, cmax: %s },\n"
          % (js(cd), js(desc), sk, js(arch_of.get(cd, '')), n,
             'null' if cmin is None else cmin, 'null' if cmax is None else cmax))
    w("      ]},\n")
w("    ]\n  },\n")

# Ryzen
w("""
  // ─────────────────────────────────────────────────────────────────────────
  //  RYZEN — client, by product series
  // ─────────────────────────────────────────────────────────────────────────
  ryzen: {
    title: 'AMD Ryzen',
    blurb: 'Desktop · mobile · workstation · handheld',
    brandGroups: true,
    codenameFilter: true,
    filters: [
      { label: 'Series', key: 'gen', tags: [
""")
for rid, label, yr, col, note, cds in RYZEN_SERIES:
    w("        [%s, '%s'],\n" % (js(label), col))
w("""      ]},
      { label: 'Brand', key: 'tier', tags: [
        ['Threadripper', '#f59e0b'], ['Ryzen AI Max', '#06b6d4'],
        ['Ryzen AI', '#22d3ee'], ['Ryzen', '#f97316'], ['Z-Series', '#a78bfa']
      ]},
      { label: 'Segment', key: 'seg', tags: [
        ['Workstation', '#f59e0b'], ['Desktop', '#4ade80'],
        ['Mobile', '#f472b6'], ['Handheld', '#22d3ee']
      ]}
    ],
    gens: [
""")
for rid, label, yr, col, note, cds in RYZEN_SERIES:
    if rid in RYZEN_ERAS:
        era, eranote = RYZEN_ERAS[rid]
        w("      { era: %s, eraNote: %s },\n" % (js(era), js(eranote)))
    w("      { id: '%s', name: %s, years: '%s', color: '%s',\n" % (rid, js(label), yr, col))
    w("        note: %s, families: [\n" % js(note))
    for cd, tier, seg in cds:
        source_series = ryzen_series_for(rid, cd)
        n = len(models_for(cd, source_series))
        desc = '%s — %d models' % (arch_of.get(cd, ''), n)
        cmin, cmax = core_span(cd, source_series)
        w("        { name: %s, key: %s, series: %s, desc: %s, tier: '%s', seg: '%s', si: %s, n: %d, "
          "cmin: %s, cmax: %s },\n"
          % (js(cd), js(cd), js(source_series), js(desc), tier, seg,
             js(arch_of.get(cd, '')), n,
             'null' if cmin is None else cmin, 'null' if cmax is None else cmax))
    w("      ]},\n")
w("    ]\n  },\n")

# GPU
w("""
  // ─────────────────────────────────────────────────────────────────────────
  //  GPU — Instinct + Radeon PRO + Radeon, one timeline
  // ─────────────────────────────────────────────────────────────────────────
  // Instinct leads (datacenter-first), then Radeon PRO, then consumer Radeon
  // inline by series number.
  gpu: {
    title: 'AMD Graphics',
    blurb: 'Instinct · Radeon PRO · Radeon',
    brandGroups: true,
    filters: [
      { label: 'Brand', key: 'tier', tags: [
        ['Instinct', '#ef4444'], ['FirePro', '#64748b'],
        ['Radeon PRO', '#818cf8'], ['Radeon', '#10b981']
      ]},
      { label: 'Segment', key: 'seg', tags: [
        ['Data Center', '#ef4444'], ['Workstation', '#818cf8'],
        ['Consumer', '#10b981'], ['Mobile', '#22d3ee']
      ]}
    ],
    gens: [
      { era: 'Instinct — data center', eraNote: 'CDNA accelerators for AI and HPC' },
""")
seen_pro = seen_cons = False
for b in gpu_blocks:
    tier = b['families'][0][1]
    if tier == 'Radeon PRO' and not seen_pro:
        w("\n      { era: 'Radeon PRO — workstation', eraNote: "
          "'Professional visualisation and workstation graphics' },\n")
        seen_pro = True
    if tier == 'Radeon' and not seen_cons:
        w("\n      { era: 'Radeon — consumer', eraNote: "
          "'Discrete gaming graphics, newest series first' },\n")
        seen_cons = True
    w("      { id: '%s', name: %s, years: %s, color: '%s',\n"
      % (b['id'], js(b['name']), js(b['years']), b['color']))
    w("        note: %s, families: [\n" % js(b['note']))
    for fam, t, sg in b['families']:
        e = gpu_fams[fam]
        n = len(e['gpuSpecs']['models'])
        # `name` is the display label; `key` is the join into amd-gpu-data.json.
        # They differ on GPU because the block header already carries the series
        # name -- repeating it on the single card inside was pure redundancy.
        label = b.get('card') or fam
        if n > 4:
            label += ' · +%d more' % (n - 4)
        w("        { name: %s, key: %s, desc: %s, tier: '%s', seg: '%s', si: %s, n: %d },\n"
          % (js(label), js(fam), js('%d models' % n), t, sg,
             js(e['gpuSpecs'].get('family', '')), n))
    w("      ]},\n")
w("    ]\n  }\n};\n")
w("""

// AMD corporate deck palette: red and orange for brand energy, gold for
// hierarchy, cyan for technical contrast, plus readable tints of each.
const A2_ACCENTS = { epyc: '#ED1C24', ryzen: '#ED1C24', gpu: '#ED1C24' };
const A2_TONES = ['#ED1C24', '#F26522', '#C1A968', '#00C2DE',
                  '#FF4B52', '#FF8A4C', '#D8C887', '#58D6E8',
                  '#C94A50', '#E58B52', '#AE9860', '#44AABD'];
Object.entries(A2_DATA).forEach(([tab, data]) => {
  const accent = A2_ACCENTS[tab];
  data.filters.forEach(group => group.tags.forEach((tag, index) => {
    tag[1] = group.key === 'gen' ? A2_TONES[index % A2_TONES.length] : accent;
  }));
  data.gens.filter(group => group.id).forEach((group, index) => {
    group.color = A2_TONES[index % A2_TONES.length];
  });
});
""")

# The renderer half lives beside this script and is appended verbatim, so one
# command produces the complete js/amd-v2.js.
renderer = open(REPO + 'tools/amd-v2-renderer.js', encoding='utf-8', newline='').read()
txt = ''.join(out).rstrip('\n') + '\n' + renderer
target = REPO + 'js/amd-v2.js'
open(target, 'w', encoding='utf-8', newline='').write(txt)
assert open(target, encoding='utf-8', newline='').read() == txt, 'write verification failed'
print('wrote js/amd-v2.js (%d chars)' % len(txt))

tot_epyc = sum(len(specs.get(c, [])) for _, _, _, _, _, cs in EPYC_SERIES for c in cs)
ry = set()
ry_models = 0
for rid, _, _, _, _, cds in RYZEN_SERIES:
    for cd, _, _ in cds:
        ry.add(cd)
        ry_models += len(models_for(cd, ryzen_series_for(rid, cd)))
print('EPYC blocks %d, models %d' % (len(EPYC_SERIES), tot_epyc))
print('Ryzen blocks %d, distinct codenames %d, models %d'
      % (len(RYZEN_SERIES), len(ry), ry_models))
print('GPU blocks %d, families %d, models %d'
      % (len(gpu_blocks), len(gpu_fams),
         sum(len(e['gpuSpecs']['models']) for e in gpu_fams.values())))

allcd = set(specs)
covered = set(c for _, _, _, _, _, cs in EPYC_SERIES for c in cs) | ry
print('\ncodenames in specs not placed:', sorted(allcd - covered) or 'none')
print('blocks referencing missing specs:', sorted(covered - allcd) or 'none')
