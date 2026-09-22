#!/usr/bin/env python3
"""
Compile the AMD spec master + editorial layer into the runtime JSON the page fetches.

    docs/specs/amd-master.csv     normalized product identity and CPU fields
    docs/specs/source-csv/AMD*.csv
                                  AMD's original GPU specification exports
    js/data/amd-presentation.json hand-curated EDITORIAL data (colour, subtitle, era, links)
        |
        v  tools/build-amd-data.py
    js/data/amd-cpu-specs.json    spec tables, keyed by codename
    js/data/amd-gpu-data.json     GPU families + era markers

Never hand-edit the two outputs — changes are overwritten. Edit the CSV (facts) or
the presentation file (display), then re-run this script.

Formatting contracts are per-file and load-bearing; mismatching them reformats every
record and turns a small change into a whole-file diff:
    amd-cpu-specs.json   4-space indent, LF,   ensure_ascii=True
    amd-gpu-data.json    2-space indent, CRLF, ensure_ascii=True

Usage:
    python3 tools/build-amd-data.py            # write the files
    python3 tools/build-amd-data.py --check    # verify only, non-zero exit on drift
"""
import csv, json, re, sys, os, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV  = os.path.join(ROOT, 'docs/specs/amd-master.csv')
PRES = os.path.join(ROOT, 'js/data/amd-presentation.json')
CPU  = os.path.join(ROOT, 'js/data/amd-cpu-specs.json')
GPU  = os.path.join(ROOT, 'js/data/amd-gpu-data.json')
GPU_SOURCES = [
    os.path.join(ROOT, 'docs/specs/source-csv/AMD Accelerator.csv'),
    os.path.join(ROOT, 'docs/specs/source-csv/AMD Workstation and professional graphics.csv'),
    os.path.join(ROOT, 'docs/specs/source-csv/AMD desktop and laptop graphics.csv'),
]

# Datacenter first, always — this is the render order contract (see CLAUDE.md).
SEG_ORDER = {'datacenter':0,'workstation':1,'desktop':2,'mobile':3,'handheld':4,'embedded':5}

def clean(s): return re.sub(r'\s+',' ',(s or '')).strip()

def clean_official(s):
    """Remove broken trademark glyphs present in AMD's exported CSV files."""
    return clean(s).replace('\ufffd', '').replace('\u2122', '').replace('\u00ae', '')

def model_key(s):
    """Stable join key for names such as 'AMD Radeon RX 9070 XT'."""
    s = re.sub(r'^amd\s+', '', clean_official(s).lower())
    return re.sub(r'[^a-z0-9]+', '', s)

def first_value(row, *fields):
    """Return the first populated official AMD field from a schema variant."""
    for field in fields:
        value = clean_official(row.get(field, ''))
        if value:
            return value
    return ''

def upto(v):
    """Boost clocks render as 'Up to X GHz' in the dashboard."""
    v = clean(v)
    return f"Up to {v}" if v and not v.lower().startswith('up to') else v

def is_gpu(r):
    """The master CSV classifies every row explicitly; never infer."""
    return clean(r['kind']) == 'gpu'

def load_rows():
    with open(CSV, encoding='utf-8') as fh:
        return [r for r in csv.DictReader(fh)]

def load_gpu_source_rows():
    """Join the three official AMD GPU exports into one model-keyed lookup."""
    out = {}
    for path in GPU_SOURCES:
        with open(path, encoding='utf-8-sig', newline='') as fh:
            for row in csv.DictReader(fh):
                key = model_key(row.get('Name', ''))
                if not key:
                    continue
                if key in out:
                    raise ValueError(f"duplicate AMD GPU model in source CSVs: {row['Name']}")
                out[key] = row
    return out

def validate_gpu_presentation(pres):
    """Reject architecture labels that predate the architecture itself."""
    rdna_start = {'RDNA': 2019, 'RDNA 2': 2020, 'RDNA 3': 2022, 'RDNA 4': 2025}
    for fid, family in pres['gpu_families'].items():
        label = clean(family.get('gpuSpecs_family', ''))
        match = re.search(r'\d{4}', clean(family.get('year', '')))
        if label in rdna_start and match and int(match.group()) < rdna_start[label]:
            raise ValueError(
                f"impossible AMD GPU architecture: {fid} is dated {match.group()} "
                f"but labeled {label}"
            )

def build_cpu(rows):
    """dict keyed by codename -> list of spec records, in datacenter-first order."""
    by = collections.defaultdict(list)
    for r in rows:
        if is_gpu(r) or not clean(r['codename']):
            continue
        rec = {'n': clean(r['model']),
               '_family': clean(r['family']),
               '_series': clean(r['series']),
               'c': clean(r['cores']),
               't': clean(r['threads']),
               'bst': upto(r['boost_clock']),
               'bas': clean(r['base_clock']),
               'l3': clean(r['l3_cache']),
               'tdp': clean(r['tdp']),
               'sk': clean(r['socket'])}
        if clean(r['igpu_model']):
            rec['gm'] = clean(r['igpu_model'])
            rec['gc'] = clean(r['igpu_cores'])
            rec['gf'] = clean(r['igpu_clock'])
        if r['segment'] == 'datacenter':
            rec['skc']  = clean(r['socket_count'])
            rec['pcie'] = clean(r['pcie_gen'])
            rec['mem']  = clean(r['mem_speed'])
            rec['_srv'] = '1'
        if clean(r['part_number']):
            rec['tr'] = clean(r['part_number'])
        by[clean(r['codename'])].append((r, rec))
    out = {}
    for cn, pairs in by.items():
        pairs.sort(key=lambda p: (SEG_ORDER.get(p[0]['segment'], 9),
                                  -(int(p[0]['cores']) if p[0]['cores'].isdigit() else 0),
                                  p[0]['model']))
        out[cn] = [rec for _, rec in pairs]
    return out

def build_gpu(rows, pres, gpu_source_rows):
    """era markers + family objects, preserving the editorial layer."""
    fams = pres['gpu_families']
    # map every GPU row to a family id via its arch/family text
    by = collections.defaultdict(list)
    unassigned = []
    for r in rows:
        if not is_gpu(r):
            continue
        fid = clean(r.get('gpu_family_id',''))
        if fid and fid in fams:
            by[fid].append(r)
        else:
            unassigned.append(clean(r['model']))
    out = []
    for era in pres['gpu_eras']:
        out.append({'era': era})
    for fid, e in fams.items():
        models = []
        for r in sorted(by.get(fid, []), key=lambda x: -(int(x['cores']) if x['cores'].isdigit() else 0)):
            source = gpu_source_rows.get(model_key(r['model_full']))
            if source is None:
                raise ValueError(f"AMD GPU is missing from the official source CSVs: {r['model_full']}")

            # AMD's GPU exports use three related schemas. Map the named fields
            # explicitly; do not overload CPU columns or parse the free-text notes.
            m = {
                'name': clean(r['model']),
                'arch': first_value(source, 'GPU Architecture') or clean(r['arch']),
                'process': first_value(source, 'Lithography') or clean(r['process']),
                'cu': first_value(source, 'Compute Units') or clean(r['cores']),
                'mem': first_value(source, 'Dedicated Memory Size', 'Max Memory Size') or clean(r['mem_max_capacity']),
                'memType': first_value(source, 'Dedicated Memory Type', 'Memory Type') or clean(r['mem_type']),
                'bw': first_value(source, 'Peak Memory Bandwidth', 'Memory Bandwidth') or clean(r['mem_speed']),
                'fp32': first_value(
                    source,
                    'Peak Single Precision (FP32 Vector) Performance',
                    'Peak Single Precision (FP32) Performance',
                    'Peak Vector FP32 Performance',
                ),
                'fp32m': first_value(
                    source,
                    'Peak Single Precision Matrix (FP32) Performance',
                    'Peak Matrix FP32 Performance',
                ),
                'pcie': first_value(source, 'Bus Type') or clean(r['pcie_gen']),
                'form': first_value(source, 'GPU Form Factor', 'Board Type', 'Form Factor'),
                'tbp': first_value(
                    source,
                    'Typical Board Power (TBP)',
                    'Total Board Power (TBP)',
                    'Typical Board Power (Desktop)',
                    'GPU Power',
                ) or clean(r['tdp']),
            }
            models.append(m)
        fam = {'id': fid, 'arch': e['arch'], 'color': e['color'], 'year': e['year'],
               'segment': e['segment'], 'subtitle': e['subtitle']}
        if e.get('defaultLinks'):
            fam['defaultLinks'] = e['defaultLinks']
        fam['gpuSpecs'] = {'family': e.get('gpuSpecs_family',''),
                           'desc': e.get('gpuSpecs_desc',''), 'models': models}
        out.append(fam)
    return out, unassigned

def dump(obj, indent, newline):
    return json.dumps(obj, indent=indent, ensure_ascii=True).replace('\n', newline) + newline

def write(path, text):
    with open(path, 'w', encoding='utf-8', newline='') as fh:
        fh.write(text)
    with open(path, encoding='utf-8', newline='') as fh:
        assert fh.read() == text, f"read-back mismatch: {path}"

def main():
    check = '--check' in sys.argv
    rows = load_rows()
    gpu_source_rows = load_gpu_source_rows()
    pres = json.load(open(PRES, encoding='utf-8'))
    validate_gpu_presentation(pres)
    cpu = build_cpu(rows)
    gpu, unassigned = build_gpu(rows, pres, gpu_source_rows)

    cpu_txt = dump(cpu, 4, '\n')
    gpu_txt = dump(gpu, 2, '\r\n')

    n_cpu = sum(len(v) for v in cpu.values())
    n_gpu = sum(len(f['gpuSpecs']['models']) for f in gpu if 'gpuSpecs' in f)
    print(f"CPU: {n_cpu} models / {len(cpu)} codenames")
    print(f"GPU: {n_gpu} models / {len([f for f in gpu if 'gpuSpecs' in f])} families")
    if unassigned:
        print(f"WARNING: {len(unassigned)} GPU rows have no family id: {unassigned[:8]}")

    if check:
        drift = False
        for path, txt in ((CPU, cpu_txt), (GPU, gpu_txt)):
            cur = open(path, encoding='utf-8', newline='').read()
            if cur != txt:
                drift = True
                print(f"DRIFT: {os.path.basename(path)} differs from a fresh build")
        sys.exit(1 if drift else 0)

    write(CPU, cpu_txt)
    write(GPU, gpu_txt)
    print("wrote", os.path.basename(CPU), "and", os.path.basename(GPU))

if __name__ == '__main__':
    main()
