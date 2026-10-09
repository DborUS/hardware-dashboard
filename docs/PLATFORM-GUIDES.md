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

## Shared ChipIndex navigation and releases

The local site version is **Public beta 0.0.5**. The platform catalog's **1.2.0**
release identifies its separate hardware dataset; neither number implies a new
review date for every source or a confirmed public deployment.

Products, Benchmarks, the Platform Finder and all five OEM guides use one global
ChipIndex header: Products / Benchmarks / Platforms, the site version, and
**What's new**. OEM guides no longer occupy the release button's place. Within
Platforms, secondary navigation contains the finder views and the OEM guide
selector. Each guide retains its OEM identity and lesson navigation below that
shared header, with a clear route back to the finder. Existing guide and model
deep links remain directly addressable.

`css/site-shell.css` owns the shared header and release-dialog presentation.
`js/site-updates.js` owns the current site version and dated release history;
its `ChipIndexRelease` export synchronizes the header version and accessible
label. Static page fallbacks must agree with it. The October 9 entry is first,
while all earlier release entries remain available.

The platform build records the site version as `siteVersion` and the shared
stylesheet/script fingerprints as `sharedAssetHashes`. Those hashes contribute
to `buildHash`, so changing either shared file requires a fresh integrated browser
review. Keep the CSS/script cache revisions consistent across all eight pages.

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
inputs instead of the generated HTML. Shared shell changes belong in
`css/site-shell.css` and `js/site-updates.js`; guide-specific navigation and layout
belong in the maintained templates and `src/platforms-shell.css`. Preserve primary
source URLs, document revisions, review dates and recorded uncertainty when
updating specifications.

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

## Review evidence and current status

The initial October 9 integration review and the later artwork review are
historical evidence for their recorded hashes. The artwork review recorded fourteen
browser checks, including the fourteen replacement drawings, six earlier formatting
examples, all-card containment, source references, OEM deep links, comparison
reloads and legacy redirects. Independent checks also protected all 102 hardware
records, the other 88 illustrations and the approved artwork boundary.

The subsequent cohesive-header revision has thirteen fresh browser checks and a
passing full thirteen-stage release validation. The browser review covers eight
main headers and release dialogs, all 102 OEM lineup cards at mobile/desktop
widths, lesson navigation, comparisons and model deep links. Independent source
review found no remaining integration defect. The Products layout audit retains
its earlier small-control and clipped sidebar-label observations; revised
Platforms checks found no page/card overflow.

Read `platforms/implementation-review.html`, the matching
`platforms/integration-browser-results.json` and `docs/PROJECT-STATE.md` for the
recorded scope and current hashes. `platforms/spec-verification.html` retains the
separate hardware/source-review scope. Publication and hosted verification remain
unconfirmed; an older passing report never certifies changed files.

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
git --no-pager diff
git status --short
git add -A
git commit -m "Unify ChipIndex navigation and release public beta 0.0.5"
```

Publication is a separate owner decision. Verify both hosted validation and the
actual Platforms page after publishing, including a model deep link and return
navigation to Products and Benchmarks.
