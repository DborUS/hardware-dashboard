#!/usr/bin/env python3
"""Build portable ChipIndex Platforms artifacts with Python and Node; --check detects drift."""
from __future__ import annotations
import argparse
import hashlib
import html
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import uuid
from contextlib import contextmanager

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'tools' / 'platform-guides'
SOURCE = PACKAGE / 'src'
DESTINATION = ROOT / 'platforms'
sys.path.insert(0, str(PACKAGE))
from art_revision import validate_art_revision
VENDORS = ('ucs', 'hpe', 'dell', 'lenovo', 'supermicro')
PAGES = ['index.html', *[f'{v}-field-guide.html' for v in VENDORS]]
SUITES = [
    ('Finder workflows', 'acceptance-results.json'),
    ('Generation chronology', 'generation-results.json'),
    ('Illustration structure', 'physical-design-results.json'),
    ('Release integrity', 'release-quality-results.json'),
    ('Independent specification review', 'spec-verification-results.json'),
]

def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write_bytes(path: Path, value: bytes):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(value)
    assert path.read_bytes() == value, f'Write verification failed: {path}'

def write_text(path: Path, value: str):
    write_bytes(path, value.encode('utf-8'))

def write_json(path: Path, value):
    write_text(path, json.dumps(value, indent=2, ensure_ascii=False) + '\n')

def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()

def run(args: list[str], cwd: Path):
    result = subprocess.run(args, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, encoding='utf-8', errors='replace')
    if result.stdout:
        print(result.stdout.rstrip())
    if result.returncode:
        raise RuntimeError(f'Build command failed ({result.returncode}): {Path(args[0]).name} {Path(args[-1]).name}')

def render_evaluation(out: Path, manifest: dict):
    suites = []
    for name, filename in SUITES:
        report = read_json(out / filename)
        passed = not report.get('failed') and not report.get('exitCode')
        current = report.get('buildHash') == manifest['buildHash'] and report.get('catalogHash') == manifest['contentHash']
        suites.append({'name': name, 'file': filename, 'status': 'PASS' if passed and current else 'FAIL', 'passed': report.get('passed')})
    browser_path = DESTINATION / 'integration-browser-results.json'
    browser = read_json(browser_path) if browser_path.exists() else None
    browser_current = bool(browser and browser.get('buildHash') == manifest['buildHash'] and browser.get('catalogHash') == manifest['contentHash'] and all(Path(name).name == name and (out / name).is_file() and sha((out / name).read_bytes()) == expected for name, expected in browser.get('reviewedPageHashes', {}).items()))
    browser_pass = bool(browser_current and browser.get('failed') == 0 and not browser.get('exitCode'))
    browser_status = 'PASS' if browser_pass else ('FAIL' if browser_current else ('STALE' if browser else 'NOT RUN'))
    suites.append({'name': 'Integrated browser review', 'file': 'integration-browser-results.json' if browser else None, 'status': browser_status, 'passed': browser.get('passed') if browser else None})
    status = 'PASS' if all(s['status'] == 'PASS' for s in suites) else ('FAIL' if any(s['status'] == 'FAIL' for s in suites) else 'INCOMPLETE')
    evaluation = browser.get('evaluation', {}) if browser_pass else {}
    report = {
        'version': manifest['version'], 'integrationAsOf': manifest['integrationAsOf'],
        'catalogHash': manifest['contentHash'], 'buildHash': manifest['buildHash'], 'status': status,
        'verdict': evaluation.get('verdict', 'Integrated release verified' if status == 'PASS' else 'Integration browser review pending'),
        'summary': evaluation.get('summary', 'The verified platform release is integrated into ChipIndex. Retained workflow, chronology, illustration and evidence checks run against these generated pages. A current browser review is required before this evaluation passes.'),
        'strengths': evaluation.get('strengths', ['All 102 hardware profiles are preserved; source-inspected artwork changes have an explicit review record.', 'Navigation and supporting evidence use portable local routes.', 'The five OEM learning guides and platform finder regenerate from retained local source.']),
        'limitations': evaluation.get('limitations', ['Curated coverage is partial; missing profiles do not establish incompatibility.', 'Exact configured systems still require OEM qualification. HPE QuickSpecs remain the primary HPE configuration source.', 'The October 9 source review verifies changed claim groups and new-profile evidence, not every possible hardware combination.']),
        'suites': suites,
        'upstream': {'version': manifest['version'], 'catalogBuildDate': manifest['upstreamBuiltAt'], 'buildHash': manifest['integration']['upstreamBuildHash'], 'scope': 'The prior browser results apply to the separate v1.2 source release. They are retained in the build inputs and are not evidence of this integrated interface.'},
    }
    write_json(out / 'implementation-evaluation.json', report)
    esc = lambda value: html.escape(str(value))
    cards = ''.join(f'<article><span class="status {esc(s["status"])}">{esc(s["status"])}</span><h3>{esc(s["name"])}</h3><p>{str(s["passed"])+" checks passed" if s.get("passed") is not None else "See the recorded scope and result."}</p>' + (f'<a href="{esc(s["file"])}">Read results</a>' if s.get('file') else '<p>No integrated browser report is recorded.</p>') + '</article>' for s in suites)
    strengths = ''.join(f'<li>{esc(item)}</li>' for item in report['strengths'])
    limits = ''.join(f'<li>{esc(item)}</li>' for item in report['limitations'])
    page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Platforms · Integration evaluation</title><style>
:root{{color-scheme:dark;font-family:system-ui,sans-serif;background:#0a0e1a;color:#e8ecf4}}body{{max-width:1120px;margin:auto;padding:36px 24px}}a{{color:#fbbf24}}h1,h2,h3,.eyebrow,.status{{font-family:ui-monospace,monospace}}h1{{font-size:clamp(26px,5vw,44px);line-height:1.15}}h2{{margin-top:34px}}p,li{{line-height:1.65;color:#aab6ca}}.eyebrow{{font-size:12px;letter-spacing:.1em}}.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}}article{{padding:22px;border:1px solid #344050;border-radius:10px;background:#1a2236}}article h3{{font-size:16px}}.status{{font-size:12px;color:#fbbf24}}.PASS{{color:#86d9ad}}.FAIL{{color:#fca5a5}}code{{overflow-wrap:anywhere;font-size:11px;color:#8892a8}}footer{{border-top:1px solid #344050;margin-top:32px;padding-top:18px;font-size:13px}}.links{{display:flex;gap:20px;flex-wrap:wrap}}@media(max-width:640px){{body{{padding:24px 16px}}}}</style></head><body>
<nav class="links" aria-label="ChipIndex sections"><a href="../">Products</a><a href="../benchmarks/">Benchmarks</a><a href="./#finder">Platforms</a></nav><p class="eyebrow">CHIPINDEX INTEGRATION · SOURCE RELEASE {esc(manifest['version'])}</p><span class="status {status}">{status}</span><h1>{esc(report['verdict'])}</h1><p>{esc(report['summary'])}</p><p><a href="index.html#finder">Open the platform finder →</a> · <a href="spec-verification.html">Verified specifications and source-review scope</a></p><div class="cards">{cards}</div><h2>What was verified</h2><ul>{strengths}</ul><h2>Scope and limits</h2><ul>{limits}</ul><footer>Source catalog built {esc(manifest['upstreamBuiltAt'])}. Integration recorded {esc(manifest['integrationAsOf'])}. These dates are not new hardware-specification review dates.<br>The prior standalone release's browser PASS is not reused as an integrated-browser PASS.<br><a href="implementation-evaluation.json">Evaluation data</a> · <a href="build-manifest.json">Current build manifest</a><br><code>Catalog {esc(manifest['contentHash'])}<br>Integrated UI {esc(manifest['buildHash'])}</code></footer></body></html>'''
    write_text(out / 'implementation-review.html', page)

def build(stage: Path, node: str) -> Path:
    work, out = stage / 'work', stage / 'outputs'
    work.mkdir(); out.mkdir()
    for path in sorted(SOURCE.rglob('*')):
        if path.is_file():
            write_bytes(work / path.relative_to(SOURCE), path.read_bytes().replace(b'\r\n', b'\n'))
    run([node, str(work / 'build-finder.cjs')], work)
    run([sys.executable, str(work / 'build-guides.py')], work)
    provenance = read_json(PACKAGE / 'import-provenance.json')
    catalog_bytes = (out / 'platform-catalog.json').read_bytes()
    catalog = read_json(out / 'platform-catalog.json')
    art_review = validate_art_revision(catalog, PACKAGE)
    manifest = read_json(out / 'build-manifest.json')
    redirect = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Platforms · ChipIndex</title>
<script>location.replace('index.html'+location.search+location.hash);</script>
</head><body><p>The platform finder is now part of ChipIndex. <a href="index.html#finder">Open Platforms</a>.</p></body></html>
'''
    write_text(out / 'amd-platform-finder.html', redirect)
    manifest.pop('builtAt', None)
    manifest['upstreamBuiltAt'] = provenance['sourceRelease']['builtAt']
    manifest['integrationAsOf'] = '2026-10-09'
    manifest['integration'] = {
        'revision': 'chipindex-cohesive-shell-3', 'canonicalRoute': 'platforms/index.html',
        'upstreamBuildHash': provenance['sourceRelease']['buildHash'],
        'upstreamCatalogHash': provenance['sourceRelease']['contentHash'],
        'catalogFileSha256': sha(catalog_bytes),
        'upstreamCatalogFileSha256': provenance['catalogFileSha256'],
        'reviewedArtChanges': len(art_review['changes']),
        'scope': 'Reviewed exterior illustrations updated. All hardware, memory, support, generation and lifecycle fields are unchanged.',
    }
    manifest['pageHashes'] = {name: sha((out / name).read_bytes()) for name in PAGES}
    manifest['siteVersion'] = '0.0.5'
    manifest['sharedAssetHashes'] = {name: sha((DESTINATION / name).resolve().read_bytes()) for name in ('../css/site-shell.css', '../js/site-updates.js')}
    manifest['buildHash'] = sha('\n'.join(name + '\0' + digest for name, digest in [*manifest['pageHashes'].items(), *manifest['sharedAssetHashes'].items()]).encode('utf-8'))
    write_json(out / 'build-manifest.json', manifest)
    run([node, str(work / 'run-release-checks.cjs')], work)
    run([node, str(work / 'build-spec-verification.cjs')], work)
    # Retain only the audit linked from the current source review, labeled historical.
    for path in sorted((PACKAGE / 'reviews' / 'preceding-audit').iterdir()):
        content = path.read_bytes().replace(b'\r\n', b'\n')
        if path.suffix == '.html':
            text = content.decode('utf-8').replace('amd-platform-finder.html', 'index.html')
            banner = '<aside style="padding:18px;border:1px solid #8c6a2b;border-radius:8px;margin-bottom:24px;background:#302619;color:#f4dcac">Historical audit of the earlier 92-profile v1.1 release. Its findings led to the corrections documented in <a href="spec-verification.html">the current 102-profile source review</a>.</aside>'
            content = text.replace('<body>', '<body>' + banner, 1).encode('utf-8')
        write_bytes(out / path.name, content)
    from build_illustration_review import render_illustration_review
    render_illustration_review(out, catalog, manifest, art_review, SOURCE)
    render_evaluation(out, manifest)
    return out

@contextmanager
def build_directory():
    # tempfile uses owner-only Windows ACLs that some managed workspaces cannot reopen.
    # Ordinary inherited workspace permissions work on Windows and Linux alike.
    parent = (ROOT / 'tmp').resolve()
    parent.mkdir(exist_ok=True)
    stage = parent / ('chipindex-platforms-' + uuid.uuid4().hex)
    stage.mkdir()
    try:
        yield stage
    finally:
        resolved = stage.resolve()
        if not resolved.is_relative_to(parent) or resolved == parent:
            raise RuntimeError('Refusing to clean a staging path outside the workspace tmp directory.')
        shutil.rmtree(resolved)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if generated files differ; do not modify the published section.')
    parser.add_argument('--node', default=os.environ.get('NODE', 'node'), help='Node executable (default: NODE environment variable or node on PATH)')
    args = parser.parse_args()
    node = shutil.which(args.node)
    if not node:
        parser.error('Node.js is required; install Node or pass --node PATH.')
    with build_directory() as temp:
        out = build(Path(temp), node)
        generated = {p.name: p.read_bytes() for p in sorted(out.iterdir()) if p.is_file()}
        manifest = read_json(out / 'build-manifest.json')
        package_manifest = {'schemaVersion': 1, 'catalogHash': manifest['contentHash'], 'buildHash': manifest['buildHash'], 'generator': 'tools/build-platform-guides.py', 'generatedFiles': {name: sha(data) for name, data in generated.items()}, 'manualReviewInput': 'integration-browser-results.json (optional; used only when both hashes match)'}
        generated['package-manifest.json'] = (json.dumps(package_manifest, indent=2) + '\n').encode('utf-8')
        stale = [name for name, data in generated.items() if not (DESTINATION / name).exists() or (DESTINATION / name).read_bytes() != data]
        if args.check:
            if stale:
                print('STALE platform outputs: ' + ', '.join(stale))
                print('Run python tools/build-platform-guides.py after reviewing the source changes.')
                return 1
            print(f'PASS: {len(generated)} platform artifacts regenerate exactly; all 102 hardware profiles are preserved and artwork revisions are verified.')
        else:
            for name, data in generated.items():
                write_bytes(DESTINATION / name, data)
            print(f'Built {len(generated)} platform artifacts in platforms/. Hardware facts are unchanged; reviewed artwork revisions are recorded.')
        print('Integrated build: ' + manifest['buildHash'])
    return 0

if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (RuntimeError, OSError, ValueError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        raise SystemExit(1)
