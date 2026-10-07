#!/usr/bin/env python3
"""Offline transaction, lock, and network-dispatch checks for benchmark refresh.

Every test uses an isolated temporary project and mocked subprocess execution.
No source endpoint is contacted and no real dashboard artifact is modified.
Run: python tools/test-benchmark-refresh.py
"""
from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("benchmark_refresh", ROOT / "tools/refresh-benchmarks.py")
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)


class RefreshTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(dir=ROOT / "tools", prefix=".refresh-test-")
        self.project = Path(self.temporary.name)
        self.assertTrue(self.project.resolve().is_relative_to((ROOT / "tools").resolve()))
        self.addCleanup(self.temporary.cleanup)
        self.data = self.project / "js/data"
        self.registry = self.data / "benchmark-sources.json"
        self.lock = self.project / "tmp/benchmark-refresh.lock"
        self.global_patch = patch.multiple(refresh, ROOT=self.project, DATA=self.data,
                                           REGISTRY=self.registry, LOCK=self.lock)
        self.global_patch.start()
        self.addCleanup(self.global_patch.stop)
        for source, key, filename, _ in refresh.DATASETS:
            self.save("js/data/" + filename, {
                "meta": {"snapshotDate": "2026-09-30", "metric": key,
                         "sourceUrl": "https://example.org/" + source, "scope": "fixture"},
                "results": [{"vendor": "Fixture", "model": key, "benchmarkVersion": "fixture-v1"}],
            })
        self.save("js/data/benchmark-catalog.json", {
            "meta": {"productsInCurrentSnapshots": 7, "uniqueCatalogProducts": 9}, "products": []})
        self.save("js/data/benchmark-sources.json", {"previousRegistry": "must be restored byte-for-byte"})
        self.save("js/data/benchmark-table-index.js", {"previousIndex": "must be restored byte-for-byte"})
        for relative in ("tools/spec-source-records.json", "tools/spec-import-review.json",
                         "tools/spec-source-cache/manifest.json", "tools/blender-import-review.json",
                         "tools/blender-5.2.0-grouped-export.json",
                         "tools/blender-5.2.0-grouped-export.manifest.json",
                         "tools/fixtures/mlperf-v6.0/summary_results.json",
                         "tools/fixtures/mlperf-v6.0/provenance.json",
                         "tools/fixtures/mlperf-v6.0/review.json"):
            self.save(relative, {"previousCapture": "2026-09-30", "path": relative})
        self.before = self.files()

    def save(self, relative, value):
        path = self.project / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value) + "\n", encoding="utf-8", newline="")
        return path

    def files(self):
        return {path.relative_to(self.project).as_posix(): path.read_bytes()
                for path in self.project.rglob("*") if path.is_file()}

    @staticmethod
    def command(mock_call):
        args = mock_call.args[0]
        return Path(args[1]).name, tuple(args[2:])

    def run_refresh(self, source="all", network=False, side_effect=None):
        with patch.object(refresh.subprocess, "run", side_effect=side_effect) as process:
            with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                refresh.refresh(source, allow_network=network)
        return process

    def mutate_evidence(self):
        for relative in self.before:
            if relative.startswith("tools/") or relative.endswith("benchmark-catalog.json"):
                self.save(relative, {"newCapture": "2026-10-07"})
        payload = json.loads((self.data / "benchmark-sample.json").read_text())
        payload["meta"]["snapshotDate"] = "2026-10-07"
        self.save("js/data/benchmark-sample.json", payload)
        self.save("tools/spec-new-normalized-source.json", {"unvalidated": True})
        self.save("tools/blender-new-capture.json", {"unvalidated": True})
        self.save("tools/fixtures/mlperf-v6.0/new-source.json", {"unvalidated": True})

    def test_validation_failure_restores_every_artifact_and_removes_new_evidence(self):
        def execute(args, **kwargs):
            name = Path(args[1]).name
            if name == "import-blender-benchmarks.py":
                self.mutate_evidence()
            if name == "check-benchmarks.py":
                raise subprocess.CalledProcessError(1, args)
        with self.assertRaises(subprocess.CalledProcessError):
            self.run_refresh(network=True, side_effect=execute)
        self.assertEqual(self.files(), self.before)
        self.assertFalse(self.lock.exists())

    def test_import_failure_restores_removed_file_and_releases_lock(self):
        def execute(args, **kwargs):
            (self.project / "tools/spec-source-records.json").unlink()
            self.save("tools/spec-unvalidated-new.json", {"partial": True})
            raise subprocess.CalledProcessError(1, args)
        with self.assertRaises(subprocess.CalledProcessError):
            self.run_refresh("spec", side_effect=execute)
        self.assertEqual(self.files(), self.before)
        self.assertFalse(self.lock.exists())

    def test_registry_reconciliation_failure_rolls_back_written_registry(self):
        with patch.object(refresh, "check_registry", side_effect=ValueError("registry failure")):
            with self.assertRaisesRegex(ValueError, "registry failure"):
                self.run_refresh("blender")
        self.assertEqual(self.files(), self.before)
        self.assertFalse(self.lock.exists())

    def test_index_check_failure_restores_prior_index_and_all_outputs(self):
        def execute(args, **kwargs):
            name = Path(args[1]).name
            if name == "build-product-benchmark-index.py" and "--check" not in args:
                self.save("js/data/benchmark-table-index.js", {"partialIndex": True})
            if name == "build-product-benchmark-index.py" and "--check" in args:
                raise subprocess.CalledProcessError(1, args)
        with self.assertRaises(subprocess.CalledProcessError):
            self.run_refresh("blender", side_effect=execute)
        self.assertEqual(self.files(), self.before)
        self.assertFalse(self.lock.exists())

    def test_keyboard_interrupt_restores_outputs_and_releases_lock(self):
        def execute(args, **kwargs):
            self.mutate_evidence()
            raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):
            self.run_refresh("all", side_effect=execute)
        self.assertEqual(self.files(), self.before)
        self.assertFalse(self.lock.exists())

    def test_success_retains_changes_and_reconciles_registry(self):
        def execute(args, **kwargs):
            if Path(args[1]).name == "import-blender-benchmarks.py":
                payload = json.loads((self.data / "benchmark-sample.json").read_text())
                payload["meta"]["snapshotDate"] = "2026-10-07"
                self.save("js/data/benchmark-sample.json", payload)
            if Path(args[1]).name == "build-product-benchmark-index.py" and "--check" not in args:
                self.save("js/data/benchmark-table-index.js", {"generatedIndex": "2026-10-07"})
        self.run_refresh("blender", side_effect=execute)
        registry = json.loads(self.registry.read_text())
        blender = next(item for item in registry["sources"] if item["id"] == "blender")
        self.assertEqual(blender["lastRetrievedDate"], "2026-10-07")
        self.assertEqual(blender["recordCount"], 1)
        self.assertEqual(registry["totalRecords"], 7)
        self.assertEqual(json.loads((self.data / "benchmark-table-index.js").read_text()), {"generatedIndex": "2026-10-07"})
        self.assertFalse(self.lock.exists())

    def test_active_lock_blocks_second_refresh_without_removing_owner_lock(self):
        with refresh.refresh_lock():
            original_lock = self.lock.read_bytes()
            with patch.object(refresh.subprocess, "run") as process:
                with self.assertRaisesRegex(ValueError, "Another benchmark refresh"):
                    refresh.refresh("blender", allow_network=True)
                process.assert_not_called()
            self.assertEqual(self.lock.read_bytes(), original_lock)
        self.assertFalse(self.lock.exists())

    def test_lock_is_released_when_body_raises(self):
        with self.assertRaisesRegex(RuntimeError, "body failure"):
            with refresh.refresh_lock():
                raise RuntimeError("body failure")
        self.assertFalse(self.lock.exists())
        with refresh.refresh_lock():
            self.assertTrue(self.lock.exists())
        self.assertFalse(self.lock.exists())

    def test_offline_dispatch_never_adds_fetch_for_any_source(self):
        for selection in (*refresh.IMPORTERS, "all"):
            with self.subTest(selection=selection):
                process = self.run_refresh(selection)
                calls = [self.command(call) for call in process.call_args_list]
                names = list(refresh.IMPORTERS.values()) if selection == "all" else [refresh.IMPORTERS[selection]]
                self.assertEqual(calls[:len(names)], [(name, ()) for name in names])
                self.assertEqual(calls[len(names):], [("build-benchmark-catalog.py", ("--write",)),
                                                      ("check-benchmarks.py", ()),
                                                      ("build-product-benchmark-index.py", ()),
                                                      ("build-product-benchmark-index.py", ("--check",))])
                self.assertFalse(any("--fetch" in args for _, args in calls))
                self.assertFalse(self.lock.exists())

    def test_live_dispatch_adds_fetch_only_to_requested_importers(self):
        for selection in (*refresh.IMPORTERS, "all"):
            with self.subTest(selection=selection):
                process = self.run_refresh(selection, network=True)
                calls = [self.command(call) for call in process.call_args_list]
                names = list(refresh.IMPORTERS.values()) if selection == "all" else [refresh.IMPORTERS[selection]]
                self.assertEqual(calls[:len(names)], [(name, ("--fetch",)) for name in names])
                self.assertEqual(calls[len(names):], [("build-benchmark-catalog.py", ("--write",)),
                                                      ("check-benchmarks.py", ()),
                                                      ("build-product-benchmark-index.py", ()),
                                                      ("build-product-benchmark-index.py", ("--check",))])
                for call in process.call_args_list:
                    self.assertEqual(call.kwargs["cwd"], self.project)
                    self.assertTrue(call.kwargs["check"])
                    self.assertGreater(call.kwargs["timeout"], 0)

    def test_cli_requires_explicit_refresh_for_network(self):
        with patch.object(refresh.subprocess, "run") as process, redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as raised:
                refresh.main(["--allow-network"])
        self.assertEqual(raised.exception.code, 2)
        process.assert_not_called()
        self.assertEqual(self.files(), self.before)

    def test_cli_offline_check_dispatch_is_read_only(self):
        with patch.object(refresh.subprocess, "run") as process, patch.object(refresh, "check_registry"):
            refresh.main(["--check"])
        calls = [self.command(call) for call in process.call_args_list]
        expected = [("check-benchmarks.py", ())]
        expected.extend((name, ("--check",)) for name in refresh.IMPORTERS.values())
        expected.append(("build-benchmark-catalog.py", ("--check",)))
        expected.append(("build-product-benchmark-index.py", ("--check",)))
        self.assertEqual(calls, expected)
        self.assertEqual(self.files(), self.before)
        self.assertFalse(self.lock.exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
