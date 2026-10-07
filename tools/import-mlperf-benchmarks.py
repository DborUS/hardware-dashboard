#!/usr/bin/env python3
"""Refresh the reviewed MLPerf Inference v6.0 eight-accelerator cohorts.

Default: replay the retained official JSON and its original retrieval timestamp.
--check: verify reproducible outputs without writing or accessing the network.
--fetch: explicitly download a commit-pinned official summary and record UTC time.
--summary PATH --retrieved-date YYYY-MM-DD: import a separately captured summary.

Only Closed/Available, datacenter, Llama 2 70B 99%, Server/Offline, one-node,
eight-accelerator, zero-error, non-inferred results enter the existing charts.
Unknown accelerator names remain in review; scores are never normalized.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date, datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sys
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'js' / 'data'
EVIDENCE = ROOT / 'tools' / 'fixtures' / 'mlperf-v6.0'
SUMMARY_URL = 'https://github.com/mlcommons/inference_results_v6.0/blob/main/summary_results.json'
REPOSITORY = 'mlcommons/inference_results_v6.0'
GUIDELINES_URL = 'https://github.com/mlcommons/policies/blob/master/MLPerf_Results_Messaging_Guidelines.adoc'
VERSION = 'MLPerf Inference v6.0'
WORKLOAD = 'llama2-70b-99'
MAX_DOWNLOAD_BYTES = 16 * 1024 * 1024
COHORTS = {
    'Server': ('enterprise-benchmark-mlperf-v6-server-sample.json', 'MLPerf_Inference_v6.0_llama2-70b-99_Server_Tokens_per_second'),
    'Offline': ('enterprise-benchmark-mlperf-v6-offline-sample.json', 'MLPerf_Inference_v6.0_llama2-70b-99_Offline_Tokens_per_second'),
}
# These are exact source names, not substring or fuzzy matching rules. All targets
# must also resolve to exactly one current catalog accelerator identity.
CATALOG_MATCHES = {
    'AMD Instinct MI300X 192GB HBM3': ('Instinct MI300X', 'AMD', 'Instinct'),
    'AMD Instinct MI325X 256GB HBM3e': ('Instinct MI325X', 'AMD', 'Instinct'),
    'AMD Instinct MI350X 288GB HBM3e': ('Instinct MI350X', 'AMD', 'Instinct'),
    'AMD Instinct MI355X 288GB HBM3e': ('Instinct MI355X', 'AMD', 'Instinct'),
    'AMD Instinct MI355X 288GB HBM3e (Power Cap 1000 W)': ('Instinct MI355X', 'AMD', 'Instinct'),
    'NVIDIA H200-NVL-141GB': ('H200 NVL', 'NVIDIA', 'H-Series'),
    'NVIDIA B200-SXM-180GB': ('B200 SXM', 'NVIDIA', 'B-Series'),
    'NVIDIA RTX PRO 6000 Blackwell Server Edition': ('RTX PRO 6000 Blackwell Server Edition', 'NVIDIA', 'RTX PRO Server'),
}
SOURCE_FIELD_MAP = {
    'resultId': 'ID', 'submitter': 'Submitter', 'systemName': 'System',
    'platform': 'Platform', 'sourceAcceleratorName': 'Accelerator',
    'score': 'Performance_Result', 'sourceLocation': 'Location',
    'acceleratorCount': 'Total Accelerators', 'nodes': 'Nodes',
    'units': 'Performance_Units', 'division': 'Category',
    'availability': 'Availability', 'workload': 'UsedModel', 'scenario': 'Scenario',
    'precision': 'weight_data_types', 'hostProcessor': 'Processor',
    'operatingSystem': 'operating_system', 'software': 'Software',
    'errors': 'errors', 'inferred': 'inferred', 'compliance': 'compliance',
}
COHORT_FIELDS = {
    'version': 'v6.0', 'Suite': 'datacenter', 'Category': 'closed',
    'Availability': 'available', 'UsedModel': WORKLOAD, 'Nodes': 1,
    'a#': 8, 'Total Accelerators': 8, 'errors': 0, 'inferred': 0,
    'compliance': 'closed', 'Performance_Units': 'Tokens/s',
}
TRADEMARK_NOTICE = ('The MLPerf name and logo are registered and unregistered trademarks '
    'of MLCommons Association in the United States and other countries. All rights reserved. '
    'Unauthorized use strictly prohibited. See https://www.mlcommons.org for more information.')
B300_REVIEW = {
    'sourceAcceleratorName': 'NVIDIA B300-SXM-270GB',
    'candidateCatalogModel': 'B300 SXM',
    'reason': 'Catalog memory is 288 GB; summary names 270GB. The official sources do not explicitly reconcile these figures, so the alias remains unapproved.',
    'references': [
        'https://docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory/latest/components.html',
        'https://resources.nvidia.com/en-us-gpu-resources/blackwell-ultra-datasheet',
    ],
}


def json_bytes(value):
    return (json.dumps(value, indent=4, ensure_ascii=True, allow_nan=False) + '\n').encode('utf-8')


def load_json(path):
    return json.loads(Path(path).read_bytes())


def parse_summary(raw):
    rows = json.loads(raw)
    if not isinstance(rows, list) or not rows or any(not isinstance(row, dict) for row in rows):
        raise ValueError('official summary must be a nonempty JSON array of result objects')
    return rows


def source_key(row):
    return row.get('ID'), row.get('Scenario'), row.get('UsedModel')


def exclusion_reason(row):
    for field, expected in COHORT_FIELDS.items():
        value = row.get(field)
        if value != expected or (type(expected) is int and type(value) is not int):
            return 'outside cohort: ' + field
    if row.get('Scenario') not in COHORTS:
        return 'outside cohort: Scenario'
    return None


def catalog_accelerators(catalog):
    result = {}
    for product in catalog['products']:
        tabs = product.get('dashboardTabs', [])
        if ('nvidia/datacenter' not in tabs and not
                ('amd/gpu' in tabs and product.get('sourceSegment') == 'datacenter')):
            continue
        identity = product['vendor'].upper(), product['model']
        if identity in result:
            raise ValueError(f'ambiguous catalog accelerator: {identity}')
        result[identity] = product
    return result


def match_accelerator(name, catalog):
    if not isinstance(name, str) or not name:
        raise ValueError('candidate lacks its source accelerator name')
    mapped = CATALOG_MATCHES.get(name)
    if mapped:
        model, vendor, line = mapped
        if (vendor.upper(), model) not in catalog:
            raise ValueError(f'reviewed alias no longer resolves to the catalog: {name}')
        return mapped
    # Only literal vendor + complete catalog model is eligible without an alias.
    matches = [product for (vendor, model), product in catalog.items()
               if name.casefold() == f'{vendor} {model}'.casefold()]
    if len(matches) > 1:
        raise ValueError(f'ambiguous exact catalog match: {name}')
    if matches:
        product = matches[0]
        return product['model'], product['vendor'], product.get('sourceSeries') or 'Instinct'
    return None


def expected_sut_url(location):
    if not isinstance(location, str) or not location.startswith('./closed/'):
        raise ValueError('source Location must identify a Closed result directory')
    parts = location[2:].split('/')
    if (len(parts) != 8 or any(not part or part in ('.', '..') or any(c in part for c in '\\?#') for part in parts)
            or parts[2] != 'results' or parts[4] != WORKLOAD or parts[5] not in COHORTS
            or parts[6:] != ['performance', 'run_1']):
        raise ValueError(f'invalid source result location: {location}')
    return 'https://github.com/' + REPOSITORY + '/tree/main/' + '/'.join(quote(part, safe='-_.') for part in parts[:4])


def validate_candidate(row):
    for target, field in SOURCE_FIELD_MAP.items():
        if target in ('score', 'acceleratorCount', 'nodes', 'errors', 'inferred'):
            continue
        if not isinstance(row.get(field), str) or (field != 'Software' and not row[field].strip()):
            raise ValueError(f'{source_key(row)}: missing or invalid {field}')
    if not re.fullmatch(r'6\.0-\d{4}', row['ID']):
        raise ValueError(f'invalid MLPerf result ID: {row["ID"]}')
    score = row.get('Performance_Result')
    if type(score) not in (int, float) or not math.isfinite(score) or score <= 0:
        raise ValueError(f'{source_key(row)}: score must be positive and finite')
    location = row['Location'].removeprefix('./').split('/')
    expected_sut_url(row['Location'])
    if location[1] != row['Submitter'] or location[3] != row['Platform'] or location[5] != row['Scenario']:
        raise ValueError(f'{source_key(row)}: source location contradicts submitted-system fields')


def validate_provenance(raw, provenance):
    if provenance.get('sourceUrl') != SUMMARY_URL:
        raise ValueError('provenance does not identify the official v6.0 summary')
    if provenance.get('sha256') != hashlib.sha256(raw).hexdigest():
        raise ValueError('source file SHA-256 disagrees with provenance')
    captured = datetime.fromisoformat(provenance['retrievedAt'].replace('Z', '+00:00'))
    if captured.tzinfo is None or captured.date() > datetime.now(timezone.utc).date():
        raise ValueError('retrieval timestamp needs a timezone and cannot be in the future')
    if provenance.get('snapshotDate') != captured.date().isoformat():
        raise ValueError('snapshot date disagrees with retrieval timestamp')
    return captured.date().isoformat()


def build_outputs(raw, provenance, catalog):
    captured_date = validate_provenance(raw, provenance)
    source_rows = parse_summary(raw)
    catalog = catalog_accelerators(catalog)
    imported = {scenario: [] for scenario in COHORTS}
    rejected = []
    outside = Counter()
    identities = set()
    for source in source_rows:
        reason = exclusion_reason(source)
        if reason:
            outside[reason] += 1
            continue
        validate_candidate(source)
        key = source_key(source)
        if key in identities:
            raise ValueError(f'duplicate candidate result ID/scenario/workload: {key}')
        identities.add(key)
        identity = match_accelerator(source['Accelerator'], catalog)
        if identity is None:
            rejected.append({'resultId': source['ID'], 'scenario': source['Scenario'],
                             'sourceAcceleratorName': source['Accelerator'],
                             'sourceUrl': expected_sut_url(source['Location']),
                             'reason': 'no reviewed exact catalog identity'})
            continue
        model, vendor, line = identity
        row = {'model': model, 'vendor': vendor, 'productLine': line,
               'score': source['Performance_Result'], 'metric': COHORTS[source['Scenario']][1],
               'benchmarkVersion': VERSION}
        row.update({field: source[source_field] for field, source_field in SOURCE_FIELD_MAP.items()
                    if field != 'score'})
        row.update(sourceUrl=expected_sut_url(source['Location']), summaryUrl=SUMMARY_URL,
                   retrievedDate=captured_date)
        imported[source['Scenario']].append(row)
    outputs = {}
    for scenario, (filename, metric) in COHORTS.items():
        rows = sorted(imported[scenario], key=lambda row: (-row['score'], row['resultId'], row['sourceUrl']))
        if not rows:
            raise ValueError(f'refusing to replace the {scenario} snapshot with an empty cohort')
        model_count = len({(row['vendor'], row['model']) for row in rows})
        meta = {
            'snapshotDate': captured_date, 'retrievedAt': provenance['retrievedAt'],
            'source': 'MLCommons MLPerf Inference v6.0 official summary results',
            'sourceUrl': SUMMARY_URL, 'sourceSha256': provenance['sha256'],
            'sourceRevision': provenance.get('revision'),
            'messagingGuidelinesUrl': GUIDELINES_URL,
            'metric': metric, 'metricLabel': f'Llama 2 70B {scenario} throughput',
            'benchmarkVersion': VERSION, 'suite': 'datacenter', 'division': 'closed',
            'availability': 'available', 'workload': WORKLOAD, 'scenario': scenario,
            'qualityTarget': '99%', 'acceleratorCount': 8, 'units': 'Tokens/s',
            'scope': f'Published whole-system {scenario} throughput for one-node systems with exactly eight accelerators.',
            'selectionBasis': f'All {len(rows)} official summary rows matching {model_count} exact reviewed catalog identities and the datacenter, Closed, Available, Llama 2 70B 99%, {scenario}, one-node, eight-accelerator, zero-error, non-inferred cohort. Each row is a published submitted system. No best-result selection, per-accelerator normalization, or score interpolation.',
            'sourceLimitations': 'Whole-system results include different host CPUs, software, weight precision and power settings. Raw accelerator names retain configuration details, including the MI355X 1000 W power cap. B300-SXM-270GB remains excluded pending reconciliation with the catalog\'s 288 GB specification. The summary Accuracy string is omitted because a previously checked value disagreed with its SUT table; this import uses the published throughput metric only. Source platform and accelerator strings are preserved even when their memory labels differ.',
            'trademarkNotice': TRADEMARK_NOTICE,
            'sourceStatusFields': 'Official errors=0, inferred=0 and compliance=closed are required and retained for every result.',
        }
        outputs[filename] = {'meta': meta, 'results': rows}
    review = {
        'sourceUrl': SUMMARY_URL, 'sourceSha256': provenance['sha256'],
        'retrievedAt': provenance['retrievedAt'], 'sourceRows': len(source_rows),
        'importedCounts': {scenario: len(rows) for scenario, rows in imported.items()},
        'importedModels': {scenario: sorted({f"{r['vendor']} {r['model']}" for r in rows}) for scenario, rows in imported.items()},
        'excludedByCohort': dict(sorted(outside.items())),
        'unmatchedCandidates': sorted(rejected, key=lambda row: (row['resultId'], row['scenario'])),
        'pendingAliases': [B300_REVIEW] if any(row['sourceAcceleratorName'] == B300_REVIEW['sourceAcceleratorName'] for row in rejected) else [],
        'identityNotes': [
            {'sourceAcceleratorName': 'AMD Instinct MI355X 288GB HBM3e (Power Cap 1000 W)',
             'model': 'Instinct MI355X', 'reason': 'The complete model name is unchanged; the source explicitly describes the power cap as a submitted-system setting. Preserve this raw name on each distinct SUT result.'},
            {'sourceAcceleratorName': 'NVIDIA RTX PRO 6000 Blackwell Server Edition',
             'model': 'RTX PRO 6000 Blackwell Server Edition', 'reason': 'Exact official product name including Server Edition; no workstation or mobile variants are merged.',
             'reference': 'https://www.nvidia.com/en-us/data-center/rtx-pro-6000-blackwell-server-edition/'},
        ],
        'reportingGuidance': {'source': GUIDELINES_URL, 'requiredContext': ['submitter', 'benchmark version and division', 'system under test', 'workload and scenario', 'accelerator count', 'retrieval date and source', 'result ID', 'trademark legend'],
            'restriction': 'Preserve official context and scenario; do not use proxy power or normalize these whole-system scores.'},
    }
    return outputs, review


def fetch_bytes(url, attempts=3, timeout=25):
    for attempt in range(attempts):
        try:
            request = Request(url, headers={'User-Agent': 'ChipIndex-benchmark-import/1.0', 'Accept': 'application/json'})
            with urlopen(request, timeout=timeout) as response:
                if response.status != 200:
                    raise ValueError(f'HTTP {response.status} from official source')
                body = response.read(MAX_DOWNLOAD_BYTES + 1)
            if len(body) > MAX_DOWNLOAD_BYTES:
                raise ValueError('official source exceeds the download size limit')
            return body
        except (HTTPError, URLError, TimeoutError, OSError):
            if attempt + 1 == attempts:
                raise
            time.sleep(attempt + 1)
    raise RuntimeError('unreachable fetch state')


def fetch_capture():
    commit = json.loads(fetch_bytes(f'https://api.github.com/repos/{REPOSITORY}/commits/main'))
    revision = commit.get('sha', '')
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('GitHub did not return a valid official repository revision')
    url = f'https://raw.githubusercontent.com/{REPOSITORY}/{revision}/summary_results.json'
    raw = fetch_bytes(url)
    timestamp = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    return raw, {'sourceUrl': SUMMARY_URL, 'downloadUrl': url, 'revision': revision,
                 'retrievedAt': timestamp, 'snapshotDate': timestamp[:10],
                 'sha256': hashlib.sha256(raw).hexdigest(), 'captureMethod': 'official-commit-pinned-download'}


def atomic_write_bundle(files):
    """Validate first, stage siblings, then replace; restore old files on failure."""
    staged = {}
    originals = {}
    replaced = []
    try:
        for path, body in files.items():
            path = Path(path)
            path.parent.mkdir(parents=True, exist_ok=True)
            originals[path] = path.read_bytes() if path.exists() else None
            with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.' + path.name + '.', suffix='.tmp', delete=False) as handle:
                staged[path] = Path(handle.name)
                handle.write(body)
                handle.flush()
                os.fsync(handle.fileno())
        for path, temporary in staged.items():
            os.replace(temporary, path)
            replaced.append(path)
            if path.read_bytes() != files[path]:
                raise OSError(f'write verification failed for {path}')
    except BaseException:
        for path in reversed(replaced):
            previous = originals[path]
            if previous is None:
                path.unlink(missing_ok=True)
            else:
                with tempfile.NamedTemporaryFile(dir=path.parent, suffix='.rollback', delete=False) as handle:
                    handle.write(previous)
                    handle.flush()
                    os.fsync(handle.fileno())
                    restore = Path(handle.name)
                os.replace(restore, path)
        raise
    finally:
        for temporary in staged.values():
            temporary.unlink(missing_ok=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group()
    source.add_argument('--fetch', action='store_true', help='download official current v6.0 summary and record actual UTC retrieval time')
    source.add_argument('--summary', type=Path, help='separately downloaded official summary JSON')
    parser.add_argument('--retrieved-date', type=date.fromisoformat, help='actual capture date of a supplied --summary')
    parser.add_argument('--check', action='store_true', help='read-only reproduction check; never fetches')
    parser.add_argument('--output-dir', type=Path, default=DATA)
    parser.add_argument('--evidence-dir', type=Path, default=EVIDENCE)
    parser.add_argument('--catalog', type=Path, default=DATA / 'benchmark-catalog.json')
    args = parser.parse_args(argv)
    if args.fetch and args.check:
        parser.error('--fetch and --check cannot be combined; capture first, then verify offline')
    if bool(args.summary) != bool(args.retrieved_date):
        parser.error('--summary and --retrieved-date must be supplied together')
    try:
        if args.fetch:
            raw, provenance = fetch_capture()
        elif args.summary:
            raw = args.summary.read_bytes()
            stamp = args.retrieved_date.isoformat()
            provenance = {'sourceUrl': SUMMARY_URL, 'downloadUrl': None, 'revision': None,
                          'retrievedAt': stamp + 'T00:00:00Z', 'snapshotDate': stamp,
                          'sha256': hashlib.sha256(raw).hexdigest(), 'captureMethod': 'supplied-local-file',
                          'timestampPrecision': 'date', 'sourcePath': str(args.summary.resolve())}
        else:
            raw = (args.evidence_dir / 'summary_results.json').read_bytes()
            provenance = load_json(args.evidence_dir / 'provenance.json')
        outputs, review = build_outputs(raw, provenance, load_json(args.catalog))
        files = {args.output_dir / filename: json_bytes(payload) for filename, payload in outputs.items()}
        files[args.evidence_dir / 'review.json'] = json_bytes(review)
        if args.check:
            changed = [str(path) for path, content in files.items() if not path.exists() or path.read_bytes() != content]
            if changed:
                raise ValueError('replay differs from saved output: ' + ', '.join(changed))
        else:
            files[args.evidence_dir / 'summary_results.json'] = raw
            files[args.evidence_dir / 'provenance.json'] = json_bytes(provenance)
            atomic_write_bundle(files)
        for scenario, (filename, _) in COHORTS.items():
            rows = outputs[filename]['results']
            print(f"{'CHECK' if args.check else 'IMPORTED'} {scenario}: {len(rows)} results / {len({(r['vendor'], r['model']) for r in rows})} models; captured {provenance['snapshotDate']}")
        print(f"Review: {len(review['unmatchedCandidates'])} eligible records await exact catalog identity review")
        return 0
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f'MLPerf import failed; previous snapshots retained: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
