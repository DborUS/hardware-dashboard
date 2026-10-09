# Platform guides: integration and maintenance

The Platforms section is part of this repository at `platforms/index.html`.
Its public path after publication is `/hardware-dashboard/platforms/`.
GitHub Pages serves the generated files directly; no server-side build is required.
The original `oem-field-guides` project remains a reference, not a build dependency.

## What is included

- The 102-profile AMD Platform Finder and five OEM learning guides.
- Generation timelines, model decoding, comparison, processor/memory filters,
  support evidence, configuration restrictions and server illustrations.
- Source-verification ledgers and independent peer-review records.
- Portable source inputs and a reproducible generator inside this repository.

The integration preserves the verified upstream hardware facts. Fourteen formerly
generic server drawings have since been replaced with illustrations based on
visually inspected official OEM references: all ten recently added models and
four older installed-base profiles. HPE QuickSpecs remain the preferred
configuration source. Source uncertainty, retired/announced status and exact-build
restrictions must not be flattened into unqualified support claims.

## Server illustration review

`platforms/illustration-review.html` shows the fourteen revised illustrations with
their official references and the depicted configuration. The review checks the
physical front, drive arrangement, control locations and chassis form; it does not
turn a simplified drawing into a photograph or certify every build option. Bay
counts in a picture describe that illustrated configuration, not a platform maximum.

The review also carries forward earlier presentation requirements: clear blade,
sled, rack and tower distinctions, joined chassis geometry, no tower feet, OEM
styling, and accessible image descriptions. Processor count, DIMM slots and DPC
remain prominent on the cards, and generation/date context remains available.

Three older contextual drawings remain explicitly labeled as schematics:
HPE Cray XD245, HPE Cray XD285 and Supermicro SBA-817V7-1N. Their labels must not
imply a model-specific exterior review.

All 102 profiles retain their hardware, support, processor/memory and date facts.
The artwork changes are bounded by `tools/platform-guides/art-review-baseline.json`
and checked by `tools/platform-guides/art_revision.py`; reviewed drawing and
illustration-evidence hashes are recorded in
`tools/platform-guides/src/approved-art-revision.json`. The original
`tools/platform-guides/import-provenance.json` is retained unchanged.

## Two complementary platform views

The Products page's server icon uses the existing exact-CPU-to-system compatibility
snapshot. The new Platforms section uses broader OEM model and CPU/GPU-family
profiles. The dialog links to the learning guide without manufacturing a new
exact-CPU qualification relationship. Their datasets and confidence scopes remain
separate.

## Editing and rebuilding

Edit maintained inputs in `tools/platform-guides/src/`, then run from the repo root:

```powershell
python tools/build-platform-guides.py
python tools/build-platform-guides.py --check
python tools/check-platform-guides-integration.py
```

The generator requires Python and Node.js. Static hosting does not. Edit source
inputs instead of the generated HTML. Preserve primary source URLs, document
revisions, review dates and recorded uncertainty when updating specifications.

Typical inputs include `fae-<oem>.json` for support evidence, `memory-<oem>.json`
for processor/memory topology, `<oem>-generation-data.json` for chronology and
`physical-<oem>.json` plus illustration code for artwork provenance.

The legacy `amd-platform-finder.html` address remains a redirect to `index.html`
that retains search/query/hash state. Links to Products and Benchmarks are relative,
so the package works under the GitHub Pages repository prefix and local previews.

## Validation and review

```powershell
python tools/validate-release.py
```

This retains the product and benchmark regression checks and adds package freshness,
protected hardware-data preservation, approved artwork revisions, static link/subpath
checks and browser navigation into the Platform Finder. Also inspect desktop and
mobile previews after presentation changes.

The prior standalone release's browser review is historical evidence. A current
integration browser report must match the integrated build and catalog hashes before
its evaluation is considered current. Do not carry an old PASS forward after changes.

## Review status after artwork changes

The October 9 integration review passed thirteen browser checks and the full
thirteen-stage release command before this artwork revision. Those results are
historical for the earlier UI/catalog hashes; they do not establish a current
PASS for the revised drawings.

The revised build now has fourteen current browser checks in
`platforms/integration-browser-results.json`: all fourteen new drawings and the
six earlier formatting examples were visually inspected; all 102 Finder and
gallery cards were checked for containment at desktop and 320px. Source
references, five OEM guide deep links, comparison reloads and legacy redirects
also passed. The five automated platform suites pass, including 50 Finder
workflow checks. Independent checks confirmed identical art in both surfaces,
88 unchanged illustrations, and rejection of seven invalid data/art mutations.
`platforms/implementation-review.html` reflects this current evidence;
`platforms/spec-verification.html` retains the separate hardware/source-review
scope. See `docs/PROJECT-STATE.md` for the broader project validation result.
Publication and hosted verification remain pending.

Generated review notes use explicit LF endings to keep Windows and Linux checkouts
consistent. Build checks and reference-based illustrations do not certify every
possible OEM configuration.

## Publication handoff

Integration is local until the owner reviews and publishes it. The visitor-facing
entry stays under Pending publication in `docs/UPDATE-QUEUE.md`; a push is not by
itself confirmation that the new page is live.

To inspect and commit after review:

```powershell
cd C:\Users\dbor\dev\hardware-dashboard
git diff
git status --short
git add -A
git commit -m "Integrate OEM platform guides into ChipIndex"
```

Publication is a separate owner decision. Verify both hosted validation and the
actual Platforms page after publishing, including a model deep link and return
navigation to Products and Benchmarks.
