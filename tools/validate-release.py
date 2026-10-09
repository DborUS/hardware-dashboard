#!/usr/bin/env python3
"""Run the complete local and GitHub pre-publication validation, without fetching sources."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CHECKS = (
    ("build-amd-data.py", "--check"),
    ("check-order.py",),
    ("check-platform-guides-integration.py",),
    ("refresh-benchmarks.py", "--check"),
    ("test-spec-import.py",),
    ("test-mlperf-import.py",),
    ("test-blender-import.py",),
    ("test-benchmark-refresh.py",),
    ("test-amd-ai.py",),
    ("test-intel-npu.py",),
    ("smoke-benchmarks.py",),
    ("smoke-test.py",),
    ("audit-layout.py",),
)


def main():
    for number, (name, *args) in enumerate(CHECKS, 1):
        print(f"\n[{number}/{len(CHECKS)}] {name} {' '.join(args)}", flush=True)
        try:
            subprocess.run([sys.executable, str(ROOT / "tools" / name), *args],
                           cwd=ROOT, check=True, timeout=1800)
        except subprocess.CalledProcessError as exc:
            print(f"Release validation FAILED: {name} (exit {exc.returncode})", file=sys.stderr)
            return 1
        except (OSError, subprocess.TimeoutExpired) as exc:
            print(f"Release validation FAILED: {name}: {exc}", file=sys.stderr)
            return 1
    print("\nRelease validation PASS: all generated data, regressions and browser checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
