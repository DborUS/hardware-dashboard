#!/usr/bin/env python3
"""Offline SPEC importer regression tests; stdlib only, no external cache required.

The three complete official report fixtures cover legacy CPU2017 HTML, current
CPU2026 HTML, and GB10's heterogeneous 20-core CPU disclosure. Index fixtures
are labeled excerpts. Expected factual values are retained for parser regression.
"""
import copy
import csv
import io
import re
import gzip
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("spec_importer", ROOT / "tools/import-spec-benchmarks.py")
IMPORTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(IMPORTER)
FIXTURES = ROOT / "tools/spec-import-fixtures"
TEMP_ROOT = ROOT / "tmp"
TEMP_ROOT.mkdir(exist_ok=True)


class SpecImporterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixtures = json.loads((FIXTURES / "manifest.json").read_text(encoding="utf-8"))["records"]
        cls.aliases = IMPORTER.load_aliases()

    def test_official_disclosures_match_retained_facts(self):
        for fixture in self.fixtures:
            with self.subTest(model=fixture["expected"]["model"]):
                raw = gzip.decompress((FIXTURES / fixture["sourceFile"]).read_bytes())
                self.assertEqual(sha256(raw).hexdigest(), fixture["evidence"]["sha256"])
                result = IMPORTER.extract(fixture["candidate"], fixture["suite"], fixture["metric"],
                                          raw.decode("utf-8"), fixture["evidence"], self.aliases)
                self.assertEqual(result, fixture["expected"])
                fields = IMPORTER.disclosure_fields(raw.decode("utf-8"), fixture["suite"], fixture["metric"])
                replayed = IMPORTER.extract(fixture["candidate"], fixture["suite"], fixture["metric"],
                                            fields, fixture["evidence"], self.aliases)
                self.assertEqual(replayed, result)

    def test_scores_counts_and_cpu_identity_agree_with_official_csv(self):
        # SPEC HTML/index summaries publish three significant digits; the CSV
        # retains more precision. Check independently of the HTML parser.
        for fixture in self.fixtures:
            evidence = fixture["csvEvidence"]
            raw = (FIXTURES / evidence["file"]).read_bytes()
            self.assertEqual(sha256(raw).hexdigest(), evidence["sha256"])
            rows = list(csv.reader(io.StringIO(raw.decode("utf-8"))))
            source_score = next(row[1] for row in rows if row and row[0] == fixture["metric"])
            self.assertEqual(float(format(float(source_score), ".3g")), fixture["expected"]["score"])
            source_cpu = next(row[1] for row in rows if row and row[0] == "CPU Name")
            self.assertEqual(source_cpu, fixture["expected"]["sourceCpuName"])
            enabled = next(row[1] for row in rows if row and row[0] == "Enabled")
            self.assertEqual(int(re.match(r"(\d+)", enabled).group(1)), fixture["expected"]["enabledCores"])
            self.assertEqual(int(re.search(r"(\d+) chips?", enabled).group(1)), fixture["expected"]["cpuCount"])
            copies = {int(row[1]) for row in rows if len(row) > 1 and re.match(r"^\d{3}\.", row[0]) and row[1].isdigit()}
            self.assertEqual(copies, {fixture["expected"]["baseCopies"]})

    def test_official_index_rows_match_disclosure_candidates(self):
        for fixture in self.fixtures:
            raw = (FIXTURES / fixture["indexRowFile"]).read_text(encoding="utf-8")
            expected = fixture["candidate"]
            catalog = [(expected["vendor"], expected["model"])]
            candidates, review, summary = IMPORTER.index_candidates(raw, fixture["indexUrl"], fixture["suite"], catalog, self.aliases)
            self.assertEqual(candidates, [expected])
            self.assertEqual(review, [])
            self.assertEqual(summary["sourceIndexRows"], 1)
            self.assertEqual(summary["uniqueIndexReports"], 1)

    def test_gb10_maps_only_the_reviewed_cpu_component(self):
        fixture = self.fixtures[0]
        self.assertEqual(fixture["expected"]["testedComponent"], "CPU")
        self.assertEqual(fixture["expected"]["enabledCores"], 20)
        self.assertEqual(fixture["expected"]["cpuCount"], 1)
        catalog = [("NVIDIA", "GB10 Grace Blackwell Superchip"), ("NVIDIA", "Grace CPU Superchip")]
        self.assertEqual(IMPORTER.matches("Unknown system NVIDIA GB10 CPU", "cpu2026", catalog, self.aliases), [])
        self.assertEqual(IMPORTER.matches("NVIDIA DGX Spark NVIDIA GB10 CPU", "cpu2017", catalog, self.aliases), [])
        raw = gzip.decompress((FIXTURES / fixture["sourceFile"]).read_bytes()).decode("utf-8")
        fields = IMPORTER.disclosure_fields(raw, fixture["suite"], fixture["metric"])
        fields["enabledDescription"] = "72 cores, 1 chip"
        with self.assertRaisesRegex(ValueError, "counts differ"):
            IMPORTER.extract(fixture["candidate"], fixture["suite"], fixture["metric"], fields, fixture["evidence"], self.aliases)

    def test_exact_model_suffixes_are_preserved(self):
        catalog = [("AMD", "EPYC 9654"), ("AMD", "EPYC 9654P"), ("Intel", "Xeon Gold 6338"), ("Intel", "Xeon Gold 6338N")]
        self.assertEqual(IMPORTER.matches("Server AMD EPYC 9654P", "cpu2017", catalog, {}), [("AMD", "EPYC 9654P")])
        self.assertEqual(IMPORTER.matches("Server Intel Xeon Gold 6338N", "cpu2017", catalog, {}), [("Intel", "Xeon Gold 6338N")])

    def test_conflicting_duplicate_index_links_fail(self):
        fixture = self.fixtures[1]
        fields = IMPORTER.index_fields((FIXTURES / fixture["indexRowFile"]).read_text(encoding="utf-8"))
        fields["rows"].append(copy.deepcopy(fields["rows"][0]))
        catalog = [(fixture["candidate"]["vendor"], fixture["candidate"]["model"])]
        candidates, _, summary = IMPORTER.index_candidates(fields, fixture["indexUrl"], fixture["suite"], catalog, self.aliases)
        self.assertEqual(len(candidates), 1)
        self.assertEqual(summary["duplicateIndexRows"], 1)
        fields["rows"][1]["indexBaseScore"] = "1"
        with self.assertRaisesRegex(ValueError, "Conflicting duplicate"):
            IMPORTER.index_candidates(fields, fixture["indexUrl"], fixture["suite"], catalog, self.aliases)

    def test_selection_is_submission_based_and_retains_old_ids(self):
        original = self.fixtures[2]["candidate"]
        candidates = []
        for serial, score in ((1, "9999"), (2, "8000"), (3, "100"), (4, "80")):
            item = {**original, "sourceUrl": f"https://www.spec.org/cpu2017/results/res2025q1/cpu2017-2025010{serial}-0000{serial}.html", "indexBaseScore": score}
            candidates.append(item)
        selected, deferred = IMPORTER.select_candidates(candidates, "cpu2017", [candidates[0]["sourceUrl"]])
        self.assertEqual({c["sourceUrl"] for c in selected}, {candidates[i]["sourceUrl"] for i in (0,2,3)})
        self.assertEqual(len(deferred), 1)
        self.assertEqual(IMPORTER.select_candidates(candidates, "cpu2017", [], all_reports=True)[0], candidates)
        with self.assertRaisesRegex(ValueError, "disappeared"):
            IMPORTER.select_candidates(candidates, "cpu2017", ["https://www.spec.org/missing-report"])

    def test_contradictory_disclosures_never_become_outputs(self):
        fixture = self.fixtures[1]
        raw = gzip.decompress((FIXTURES / fixture["sourceFile"]).read_bytes()).decode("utf-8")
        source = IMPORTER.disclosure_fields(raw, fixture["suite"], fixture["metric"])
        for field, bad_value in (("metric", "SPECrate2026_fp_base"), ("baseScore", "1"),
                                 ("baseScore", "NaN"), ("sourceCpuName", "AMD EPYC 9965P"),
                                 ("enabledDescription", "1 cores, 2 chips"), ("publishedDate", "2099-01-01"),
                                 ("compiler", ""), ("benchmarkBuild", "v1")):
            with self.subTest(field=field, value=bad_value):
                changed = {**source, field: bad_value}
                with self.assertRaises(ValueError):
                    IMPORTER.extract(fixture["candidate"], fixture["suite"], fixture["metric"], changed, fixture["evidence"], self.aliases)

    def test_retained_fields_replay_without_raw_files_or_network(self):
        fixture = self.fixtures[0]
        url = fixture["candidate"]["sourceUrl"]
        raw = gzip.decompress((FIXTURES / fixture["sourceFile"]).read_bytes()).decode("utf-8")
        fields = IMPORTER.disclosure_fields(raw, fixture["suite"], fixture["metric"])
        evidence = {**fixture["evidence"], "normalizedSha256": sha256(IMPORTER.formatted(fields).encode()).hexdigest()}
        with tempfile.TemporaryDirectory(dir=TEMP_ROOT,prefix="spec-import-tests-") as directory:
            root = Path(directory)
            (root/"manifest.json").write_text(IMPORTER.formatted({"schemaVersion":1,"resources":{url:evidence}}),encoding="utf-8")
            facts_path = root/"facts.json"
            facts_path.write_text(IMPORTER.formatted({"schemaVersion":1,"normalizationVersion":1,"resources":{url:{"kind":fixture["metric"],"sourceSha256":evidence["sha256"],"fields":fields}}}),encoding="utf-8")
            before = {p.name:p.read_bytes() for p in root.iterdir()}
            cache = IMPORTER.SourceCache(root,records_path=facts_path,opener=lambda *a,**k:self.fail("network used"))
            with patch.object(cache,"get",side_effect=AssertionError("raw cache used")):
                actual, _ = cache.facts(url,fixture["metric"],lambda raw:self.fail("raw parse used"))
                self.assertEqual(actual,fields)
                cache.save()
            self.assertEqual(before,{p.name:p.read_bytes() for p in root.iterdir()})
            cache.records["resources"][url]["fields"]["baseScore"] = "999"
            with self.assertRaisesRegex(ValueError,"evidence mismatch"):
                cache.facts(url,fixture["metric"],lambda raw:None)

    def test_offline_replay_keeps_saved_all_reports_selection(self):
        with tempfile.TemporaryDirectory(dir=TEMP_ROOT,prefix="spec-import-tests-") as directory:
            path = Path(directory) / "review.json"
            self.assertFalse(IMPORTER.selected_policy(None, path))
            path.write_text('{"selectionPolicy":"all-reports"}',encoding="utf-8")
            self.assertTrue(IMPORTER.selected_policy(None, path))
            self.assertFalse(IMPORTER.selected_policy(False, path))
            path.write_text('{"selectionPolicy":"archive-wide-model-coverage"}',encoding="utf-8")
            self.assertFalse(IMPORTER.selected_policy(None, path))
            self.assertTrue(IMPORTER.selected_policy(True, path))

    def test_fetch_failures_are_bounded_and_do_not_publish_cache_entries(self):
        fixture = self.fixtures[0]
        calls=[]
        def unavailable(*args,**kwargs):
            calls.append(1)
            raise OSError("source unavailable")
        with tempfile.TemporaryDirectory(dir=TEMP_ROOT,prefix="spec-import-tests-") as directory, patch.object(IMPORTER.time,"sleep"):
            root=Path(directory)
            cache=IMPORTER.SourceCache(root,network=True,opener=unavailable,records_path=root/"facts.json")
            with self.assertRaisesRegex(RuntimeError,"after 3 attempts"):
                cache.get(fixture["candidate"]["sourceUrl"])
            self.assertEqual(len(calls),3)
            self.assertEqual(cache.manifest["resources"],{})
            self.assertFalse((root/"manifest.json").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
