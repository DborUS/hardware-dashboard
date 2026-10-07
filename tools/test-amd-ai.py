#!/usr/bin/env python3
"""Regression checks for AMD product order and sourced AI ratings."""
import csv
import json
import runpy
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = runpy.run_path(str(ROOT / 'tools/build-amd-data.py'))
ROWS = BUILD['load_rows']()
EXPECTED = {
    'Ryzen AI 9 HX 475': ('Up to 60 TOPS', 'Up to 91 TOPS'),
    'Ryzen AI 9 HX 470': ('Up to 55 TOPS', 'Up to 86 TOPS'),
    'Ryzen AI 9 HX 375': ('Up to 55 TOPS', 'Up to 85 TOPS'),
    'Ryzen AI 9 HX 370': ('Up to 50 TOPS', 'Up to 80 TOPS'),
}


class AmdAiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cpu = BUILD['build_cpu'](ROWS)
        cls.by_name = {m['n']: m for group in cls.cpu.values() for m in group}
        cls.compare = json.loads((ROOT / 'js/data/compare-details.json').read_text(encoding='utf-8'))['amd']
        cls.compare_key = staticmethod(runpy.run_path(str(ROOT / 'tools/build-compare-details.py'))['model_key'])

    def test_higher_number_first_for_equal_core_parts(self):
        for family, higher, lower in [
            ('Gorgon Point', 'Ryzen AI 9 HX 475', 'Ryzen AI 9 HX 470'),
            ('Gorgon Point', 'Ryzen AI 9 HX PRO 475', 'Ryzen AI 9 HX PRO 470'),
            ('Gorgon Point', 'Ryzen AI 7 445', 'Ryzen AI 5 435'),
            ('Strix Point', 'Ryzen AI 9 HX 375', 'Ryzen AI 9 HX 370'),
            ('Strix Point', 'Ryzen AI 9 HX PRO 375', 'Ryzen AI 9 HX PRO 370'),
        ]:
            names = [m['n'] for m in self.cpu[family]]
            self.assertLess(names.index(higher), names.index(lower), family)

    def test_segment_and_core_priority_survives(self):
        # Deliberately give lower-priority segments larger model/core numbers.
        specs = [('Server 100', 'datacenter', '16'), ('Server 900', 'datacenter', '8'),
                 ('Workstation 990', 'workstation', '32'),
                 ('Desktop 995', 'desktop', '64'), ('Mobile 999', 'mobile', '96')]
        rows = [dict(ROWS[0], model=name, segment=segment, cores=cores,
                     codename='Order regression') for name, segment, cores in reversed(specs)]
        built = BUILD['build_cpu'](rows)['Order regression']
        self.assertEqual([m['n'] for m in built], [name for name, _, _ in specs])
        self.assertEqual(sum(map(len, self.cpu.values())), 1177)

    def test_verified_pair_ratings_and_pro_variants(self):
        for model, (npu, overall) in EXPECTED.items():
            for name in (model, model.replace('HX ', 'HX PRO ')):
                with self.subTest(model=name):
                    m = self.by_name[name]
                    self.assertEqual((m['npu'], m['aiTotal']), (npu, overall))
                    comparison = self.compare[self.compare_key(name)]
                    self.assertEqual(comparison['common']['npu_tops'], npu)
                    self.assertEqual(comparison['common']['overall_tops'], overall)
                    self.assertIn(m['npuSource'], comparison['sources'])

    def test_all_known_npu_values_survive_and_unknowns_stay_blank(self):
        client_count = 0
        for r in ROWS:
            if r['model'] not in self.by_name:
                continue
            m = self.by_name[r['model']]
            self.assertEqual(m.get('npu', ''), r['npu_tops'], r['model'])
            if r.get('overall_tops'):
                client_count += 1
                self.assertTrue(m['npuSource'].startswith('https://www.amd.com/en/products/processors/'))
                comparison = self.compare[self.compare_key(r['model'])]
                self.assertEqual(comparison['common']['overall_tops'], r['overall_tops'])
        self.assertEqual(client_count, 60)
        self.assertEqual(sum(bool(m.get('npu')) for m in self.by_name.values()), 126)


    def test_new_ratings_match_exact_official_models(self):
        import re
        evidence = json.loads((ROOT / 'docs/specs/amd-ai-verification.json').read_text())
        normalize = lambda name: re.sub(r'[^a-z0-9+]', '', name.lower().removeprefix('amd '))
        self.assertEqual(len(evidence['products']), 79)
        for row in evidence['products']:
            self.assertEqual(normalize(row['model']), normalize(row['source_name']))
            model = self.by_name[row['model']]
            self.assertEqual(model['npu'], row['npu_tops'])
            self.assertEqual(model['npuSource'], row['source_url'])
            self.assertEqual(model.get('aiTotal', ''), row.get('overall_tops', ''))
            self.assertTrue(row['source_url'].startswith('https://www.amd.com/'))
            self.assertIn(row['source_url'], self.compare[self.compare_key(row['model'])]['sources'])
        for name in ['Ryzen 5 8500G', 'Ryzen 5 7540U', 'Ryzen 5 8540U',
                     'Ryzen 5 PRO 220', 'Ryzen 7 449']:
            self.assertNotIn('npu', self.by_name[name], name)


if __name__ == '__main__':
    unittest.main()
