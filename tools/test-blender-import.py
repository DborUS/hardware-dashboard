#!/usr/bin/env python3
"""Blender ingestion regression tests: provenance, exact identities, and rollback.

Run: python tools/test-blender-import.py
These tests replay retained source fixtures and never call a public endpoint.
"""
from __future__ import annotations

import copy
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("blender_import", ROOT / "tools/import-blender-benchmarks.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)
FIXTURE = ROOT / "tools/fixtures/blender/2026-09-30-grouped-export.json"


class Response:
    def __init__(self, raw, content_type="application/json", url=importer.API_QUERY):
        self.raw = raw
        self.status = 200
        self.url = url
        self.headers = {"Content-Type": content_type, "Content-Length": str(len(raw)),
                        "Date": "Wed, 07 Oct 2026 16:00:00 GMT"}
    def read(self, limit):
        return self.raw[:limit]
    def __enter__(self):
        return self
    def __exit__(self, *_):
        return False


class Opener:
    def __init__(self, response):
        self.response = response
    def open(self, request, timeout):
        return self.response


class BlenderImportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.legacy_raw = FIXTURE.read_bytes()
        cls.legacy_capture = importer.load_json(FIXTURE.with_suffix(".manifest.json"))
        cls.live_raw = importer.EXPORT.read_bytes()
        cls.live_capture = importer.load_json(importer.MANIFEST)

    def test_retained_fixture_replays_original_date(self):
        snapshot, review = importer.build(FIXTURE)
        self.assertEqual(snapshot["meta"]["snapshotDate"], "2026-09-30")
        self.assertIsNone(snapshot["meta"]["retrievedAt"])
        self.assertEqual(review["meta"]["sourceRows"], 858)
        self.assertEqual(len(review["accepted"]) + len(review["excluded"]), 858)

    def test_live_source_every_row_accounted_for(self):
        snapshot, review = importer.build(importer.EXPORT)
        names = [row[0] for row in importer.parse_official_rows(self.live_raw)]
        imported = [row["sourceDeviceName"] for row in review["accepted"]]
        excluded = [row["sourceDeviceName"] for row in review["excluded"]]
        self.assertCountEqual(names, imported + excluded)
        self.assertFalse(set(imported) & set(excluded))
        self.assertTrue(all(row["samples"] >= 5 for row in snapshot["results"]))
        self.assertTrue(all(row.get("deviceSegments") and row.get("deviceSegmentSource")
                            for row in snapshot["results"] if row["deviceType"] == "CPU"))

    def test_core_i_series_typography_preserves_sku(self):
        self.assertEqual(importer.source_keys("Intel Core i9-14900K")[1]["CPU"],
                         importer.catalog_key("Core i9 14900K"))
        self.assertNotEqual(importer.source_keys("Intel Core i9-14900KF")[1]["CPU"],
                            importer.catalog_key("Core i9 14900K"))
        snapshot, _ = importer.build(importer.EXPORT)
        matched = next(row for row in snapshot["results"] if row["model"] == "Core i9 14900K")
        source = next(row for row in importer.parse_official_rows(self.live_raw)
                      if row[0] == matched["sourceDeviceName"])
        self.assertEqual(matched["samples"], source[2])
        self.assertAlmostEqual(matched["score"], source[1], places=2)

    def test_memory_variants_and_laptop_gpus_stay_excluded(self):
        _, review = importer.build(FIXTURE)
        excluded = {row["sourceDeviceName"]: row["reason"] for row in review["excluded"]}
        self.assertEqual(excluded["NVIDIA GeForce RTX 3060"], "unspecified-memory-variant")
        self.assertEqual(excluded["NVIDIA GeForce RTX 4090 Laptop GPU"], "laptop-gpu-not-in-catalog")

    def test_changed_source_fails_hash(self):
        with self.assertRaisesRegex(ValueError, "sourceExportSha256"):
            importer.verify_capture(self.live_raw + b" ", self.live_capture, importer.EXPORT)

    def test_changed_scope_fails_replay(self):
        capture = copy.deepcopy(self.live_capture)
        capture["blenderVersion"] = "4.3.0"
        with self.assertRaisesRegex(ValueError, "blenderVersion"):
            importer.verify_capture(self.live_raw, capture, importer.EXPORT)

    def test_date_cannot_be_restamped_on_replay(self):
        capture = copy.deepcopy(self.live_capture)
        capture["captureDate"] = "2026-09-30"
        with self.assertRaisesRegex(ValueError, "timestamp"):
            importer.verify_capture(self.live_raw, capture, importer.EXPORT)

    def test_live_timestamp_comes_from_completed_fetch(self):
        when = datetime(2026, 10, 7, 16, 1, 2, tzinfo=timezone.utc)
        raw, capture = importer.fetch_official_export(importer.EXPORT,
            opener=Opener(Response(self.live_raw)), now=lambda: when)
        self.assertEqual(raw, self.live_raw)
        self.assertEqual(capture["captureDate"], "2026-10-07")
        self.assertEqual(capture["retrievedAt"], "2026-10-07T16:01:02Z")
        self.assertEqual(capture["sourceRows"], len(importer.parse_official_rows(self.live_raw)))

    def test_html_challenge_is_not_a_successful_refresh(self):
        with self.assertRaisesRegex(ValueError, "non-JSON"):
            importer.fetch_official_export(importer.EXPORT,
                opener=Opener(Response(b"<html>Not a benchmark</html>", content_type="text/html")))

    def test_redirect_cannot_change_host_or_filters(self):
        for url in ("https://example.com/benchmarks/query/", importer.API_QUERY + "&compute_type=CUDA",
                    importer.API_QUERY.replace("5.2.0", "4.3.0")):
            with self.subTest(url=url), self.assertRaises(ValueError):
                importer.verify_query_url(url)

    def test_malformed_or_partial_rows_fail_before_writes(self):
        payload = json.loads(self.legacy_raw)
        for change in ("short", "duplicate", "nan", "bool", "zero"):
            broken = copy.deepcopy(payload)
            if change == "short":
                broken["body"] = broken["body"][:5]
            elif change == "duplicate":
                broken["body"].append(broken["body"][0])
            elif change == "nan":
                broken["body"][0][1] = float("nan")
            elif change == "bool":
                broken["body"][0][2] = True
            else:
                broken["body"][0][1] = 0
            with self.subTest(change=change), self.assertRaises(ValueError):
                importer.parse_official_rows(json.dumps(broken).encode())

    def test_multi_artifact_write_failure_restores_previous_bytes(self):
        with tempfile.TemporaryDirectory(dir=ROOT / "tools", prefix=".blender-import-test-") as directory:
            self.assertTrue(Path(directory).resolve().is_relative_to((ROOT / "tools").resolve()))
            paths = [Path(directory) / name for name in ("source.json", "manifest.json", "snapshot.json")]
            for path in paths:
                path.write_bytes(b"previous " + path.name.encode())
            previous = {path: path.read_bytes() for path in paths}
            actual_replace = importer.os.replace
            calls = 0
            def fail_second(source, destination):
                nonlocal calls
                calls += 1
                if calls == 2:
                    raise OSError("simulated disk failure")
                actual_replace(source, destination)
            with patch.object(importer.os, "replace", side_effect=fail_second):
                with self.assertRaisesRegex(OSError, "simulated"):
                    importer.write_bundle({path: b"new data" for path in paths})
            self.assertEqual({path: path.read_bytes() for path in paths}, previous)
            self.assertEqual(sorted(path.name for path in Path(directory).iterdir()),
                             sorted(path.name for path in paths))


if __name__ == "__main__":
    unittest.main(verbosity=2)
