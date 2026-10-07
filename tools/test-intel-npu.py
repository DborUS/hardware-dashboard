#!/usr/bin/env python3
"""Source-to-runtime checks for every Intel NPU rating in the retained ARK exports."""
import json
import runpy
import unittest
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
IMPORTER = runpy.run_path(str(ROOT / 'tools/import-client-specs.py'))
KEY = runpy.run_path(str(ROOT / 'tools/build-compare-details.py'))['model_key']


class IntelNpuTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.runtime = json.loads((ROOT / 'js/data/intel-client-specs.json').read_text())
        cls.by_name = {r['n']: r for group in cls.runtime.values() for r in group}
        cls.compare = json.loads((ROOT / 'js/data/compare-details.json').read_text())['intel']
        cls.source = {}
        for filename in IMPORTER['ARK_FILES']:
            for row in IMPORTER['read_ark'](IMPORTER['ARK_DIR'] / filename):
                name = IMPORTER['clean_name'](row['__name'])
                if row.get('NPU Peak TOPS (Int8)'):
                    cls.source[name] = row

    def test_every_published_npu_survives_with_precision_and_source(self):
        self.assertEqual(len(self.source), 84)
        rated = {name for name, row in self.by_name.items() if row.get('npu')}
        self.assertEqual(rated, set(self.source))
        for name, source in self.source.items():
            row = self.by_name[name]
            self.assertEqual(row['npu'], source['NPU Peak TOPS (Int8)'], name)
            self.assertEqual(row['npuPrecision'], 'Int8')
            self.assertTrue((ROOT / unquote(row['npuSource'])).is_file())
            common = self.compare[KEY(name)]['common']
            self.assertEqual(common['npu_tops'], row['npu'], name)
            self.assertEqual(common['npu_precision'], 'Int8')

    def test_npu_and_overall_are_independent(self):
        row = self.by_name['Core Ultra 9 288V']
        self.assertEqual(row['npu'], '48')
        self.assertEqual(row['aiTotal'], '120')
        self.assertEqual(self.compare[KEY(row['n'])]['common']['overall_tops'], '120')
        self.assertNotIn('npu', self.by_name['Core i9 14900K'])

    def test_regeneration_is_lossless_and_does_not_change_product_scope(self):
        generated, _, _, _ = IMPORTER['build']()
        self.assertEqual(generated, self.runtime)
        self.assertEqual(len(self.by_name), 340)
        self.assertFalse(any(record.get('common') == {} for record in self.compare.values()))


if __name__ == '__main__':
    unittest.main()
