#!/usr/bin/env python3
"""Offline failure and reproduction checks for the MLPerf import boundary."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import URLError

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location('mlperf_import', ROOT / 'tools' / 'import-mlperf-benchmarks.py')
imp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(imp)


class MLPerfImportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = (imp.EVIDENCE / 'summary_results.json').read_bytes()
        cls.provenance = imp.load_json(imp.EVIDENCE / 'provenance.json')
        cls.source = imp.parse_summary(cls.raw)
        cls.catalog = imp.load_json(imp.DATA / 'benchmark-catalog.json')
        cls.candidate = next(row for row in cls.source if imp.exclusion_reason(row) is None
                             and row['Accelerator'] == 'AMD Instinct MI355X 288GB HBM3e'
                             and row['Scenario'] == 'Server')

    def build(self, rows=None, catalog=None):
        raw = self.raw if rows is None else imp.json_bytes(rows)
        provenance = {**self.provenance, 'sha256': hashlib.sha256(raw).hexdigest()}
        return imp.build_outputs(raw, provenance, catalog or self.catalog)

    def test_retained_capture_replays_exact_scores_and_sources(self):
        outputs, review = self.build()
        source = {(row['ID'], row['Scenario'], row['UsedModel']): row for row in self.source}
        self.assertEqual(review['sourceRows'], 520)
        self.assertEqual(review['importedCounts'], {'Server': 23, 'Offline': 23})
        self.assertEqual(len(review['unmatchedCandidates']), 10)
        for scenario, (filename, metric) in imp.COHORTS.items():
            payload = outputs[filename]
            self.assertEqual(imp.json_bytes(payload), (imp.DATA / filename).read_bytes())
            self.assertEqual(len({(r['vendor'], r['model']) for r in payload['results']}), 7)
            for row in payload['results']:
                official = source[(row['resultId'], scenario, row['workload'])]
                for field, source_field in imp.SOURCE_FIELD_MAP.items():
                    self.assertEqual(row[field], official[source_field])
                self.assertEqual(row['metric'], metric)
                self.assertEqual(row['retrievedDate'], self.provenance['snapshotDate'])
            self.assertEqual(sum('Power Cap 1000 W' in r['sourceAcceleratorName'] for r in payload['results']), 1)
            self.assertEqual(sum(r['model'] == 'RTX PRO 6000 Blackwell Server Edition' for r in payload['results']), 6)
            self.assertNotIn('B300 SXM', {r['model'] for r in payload['results']})
        self.assertEqual(imp.json_bytes(review), (imp.EVIDENCE / 'review.json').read_bytes())

    def test_different_cohorts_cannot_enter_existing_charts(self):
        mutations = {'version': 'v6.1', 'Suite': 'edge', 'Category': 'open',
                     'Availability': 'preview', 'UsedModel': 'llama2-70b-99.9',
                     'Scenario': 'Interactive', 'Nodes': 2, 'a#': 4,
                     'Total Accelerators': 4, 'errors': 1, 'inferred': 1,
                     'compliance': 'open', 'Performance_Units': 'Samples/s'}
        for field, value in mutations.items():
            with self.subTest(field=field):
                candidate = {**self.candidate, field: value}
                _, review = self.build(self.source + [candidate])
                self.assertEqual(review['importedCounts'], {'Server': 23, 'Offline': 23})
        # Python considers False == 0, but the source status must be an integer.
        _, review = self.build(self.source + [{**self.candidate, 'errors': False}])
        self.assertEqual(review['importedCounts']['Server'], 23)

    def test_malformed_candidate_aborts_import(self):
        for score in (-1, 0, float('nan'), float('inf'), True, '123'):
            with self.subTest(score=score), self.assertRaises(ValueError):
                rows = deepcopy(self.source)
                index = rows.index(self.candidate)
                rows[index]['Performance_Result'] = score
                # Decode accepts nonfinite input but candidate validation must not.
                raw = json.dumps(rows).encode()
                provenance = {**self.provenance, 'sha256': hashlib.sha256(raw).hexdigest()}
                imp.build_outputs(raw, provenance, self.catalog)
        for field in ('ID', 'Platform', 'Location', 'Accelerator', 'Submitter'):
            with self.subTest(field=field), self.assertRaises(ValueError):
                rows = deepcopy(self.source)
                rows[rows.index(self.candidate)][field] = ''
                self.build(rows)

    def test_duplicate_result_identity_aborts_import(self):
        with self.assertRaisesRegex(ValueError, 'duplicate candidate'):
            self.build(self.source + [deepcopy(self.candidate)])

    def test_source_links_cannot_point_outside_the_submitted_system(self):
        for location in ('./closed/AMD/results/../../outside',
                         self.candidate['Location'].replace('/Server/', '/Offline/'),
                         self.candidate['Location'].replace('/AMD/', '/OTHER/'),
                         self.candidate['Location'] + '?redirect=elsewhere'):
            with self.subTest(location=location), self.assertRaises(ValueError):
                rows = deepcopy(self.source)
                rows[rows.index(self.candidate)]['Location'] = location
                self.build(rows)

    def test_unknown_variant_stays_in_review_without_fuzzy_matching(self):
        rows = deepcopy(self.source)
        rows[rows.index(self.candidate)]['Accelerator'] = 'AMD Instinct MI355X 288GB HBM3e Super'
        outputs, review = self.build(rows)
        self.assertEqual(review['importedCounts']['Server'], 22)
        self.assertEqual(len(review['unmatchedCandidates']), 11)
        self.assertFalse(any(r['sourceAcceleratorName'].endswith(' Super') for payload in outputs.values() for r in payload['results']))

    def test_alias_must_still_resolve_to_one_catalog_identity(self):
        catalog = deepcopy(self.catalog)
        catalog['products'] = [p for p in catalog['products'] if p['model'] != 'Instinct MI355X']
        with self.assertRaisesRegex(ValueError, 'no longer resolves'):
            self.build(catalog=catalog)

    def test_empty_or_tampered_capture_cannot_replace_snapshot(self):
        with self.assertRaisesRegex(ValueError, 'SHA-256'):
            imp.build_outputs(self.raw + b' ', self.provenance, self.catalog)
        with self.assertRaises(ValueError):
            self.build([])
        with self.assertRaisesRegex(ValueError, 'empty cohort'):
            self.build([row for row in self.source if row.get('Scenario') != 'Server'])
        provenance = {**self.provenance, 'retrievedAt': '2999-01-01T00:00:00Z', 'snapshotDate': '2999-01-01'}
        with self.assertRaisesRegex(ValueError, 'future'):
            imp.build_outputs(self.raw, provenance, self.catalog)

    def test_offline_cli_never_fetches_and_preserves_capture_date(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            self.assertTrue(Path(directory).resolve().is_relative_to(ROOT.resolve()))
            target = Path(directory)
            args = ['--summary', str(imp.EVIDENCE / 'summary_results.json'),
                    '--retrieved-date', self.provenance['snapshotDate'],
                    '--output-dir', str(target / 'data'), '--evidence-dir', str(target / 'evidence')]
            with patch.object(imp, 'fetch_capture', side_effect=AssertionError('offline path fetched')):
                self.assertEqual(imp.main(args), 0)
                self.assertEqual(imp.main(['--check', '--output-dir', str(target / 'data'),
                                           '--evidence-dir', str(target / 'evidence')]), 0)
            for filename, _ in imp.COHORTS.values():
                self.assertEqual(imp.load_json(target / 'data' / filename)['meta']['snapshotDate'], self.provenance['snapshotDate'])
            before = {p: p.read_bytes() for p in (target / 'data').glob('*.json')}
            bad = target / 'bad-summary.json'
            bad.write_text('[]', encoding='utf-8')
            args[1] = str(bad)
            with patch('sys.stderr', new=io.StringIO()):
                self.assertEqual(imp.main(args), 1)
            self.assertTrue(all(p.read_bytes() == content for p, content in before.items()))

    def test_atomic_failure_restores_prior_files(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            self.assertTrue(Path(directory).resolve().is_relative_to(ROOT.resolve()))
            one, two = Path(directory) / 'one.json', Path(directory) / 'two.json'
            one.write_bytes(b'old one')
            two.write_bytes(b'old two')
            original_replace = imp.os.replace
            calls = []
            def fail_second(source, target):
                calls.append(str(target))
                if len(calls) == 2:
                    raise OSError('simulated disk failure')
                return original_replace(source, target)
            with patch.object(imp.os, 'replace', side_effect=fail_second), self.assertRaises(OSError):
                imp.atomic_write_bundle({one: b'new one', two: b'new two'})
            self.assertEqual(one.read_bytes(), b'old one')
            self.assertEqual(two.read_bytes(), b'old two')
            self.assertEqual(sorted(p.name for p in Path(directory).iterdir()), ['one.json', 'two.json'])

    def test_network_retries_and_response_size_are_bounded(self):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = 200
        response.read.return_value = b'[]'
        with patch.object(imp, 'urlopen', side_effect=[URLError('temporary'), URLError('temporary'), response]) as fetch, patch.object(imp.time, 'sleep') as sleep:
            self.assertEqual(imp.fetch_bytes('https://example.test/fixture'), b'[]')
            self.assertEqual(fetch.call_count, 3)
            self.assertEqual(sleep.call_count, 2)
            self.assertTrue(all(call.kwargs['timeout'] == 25 for call in fetch.call_args_list))
        response.read.return_value = b'x' * (imp.MAX_DOWNLOAD_BYTES + 1)
        with patch.object(imp, 'urlopen', return_value=response), self.assertRaisesRegex(ValueError, 'size limit'):
            imp.fetch_bytes('https://example.test/fixture')

    def test_fetch_pins_revision_and_records_actual_capture_time(self):
        revision = 'a' * 40
        before = datetime.now(timezone.utc).replace(microsecond=0)
        with patch.object(imp, 'fetch_bytes', side_effect=[json.dumps({'sha': revision}).encode(), self.raw]) as fetch:
            raw, provenance = imp.fetch_capture()
        captured = datetime.fromisoformat(provenance['retrievedAt'].replace('Z', '+00:00'))
        self.assertLessEqual(before, captured)
        self.assertLessEqual(captured, datetime.now(timezone.utc))
        self.assertEqual(raw, self.raw)
        self.assertEqual(provenance['revision'], revision)
        self.assertIn('/' + revision + '/summary_results.json', fetch.call_args_list[1].args[0])
        self.assertEqual(provenance['sha256'], hashlib.sha256(raw).hexdigest())


if __name__ == '__main__':
    unittest.main(verbosity=2)
