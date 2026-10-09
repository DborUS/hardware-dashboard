# ChipIndex Platforms source package

This directory contains the portable v1.2.0 OEM platform catalog, its reviewed
illustration revisions, and the guide templates integrated into ChipIndex public
beta 0.0.5. The site version and catalog version describe different releases.
It has no runtime dependency on the original `oem-field-guides` directory or a
local server; the generated pages use this repository's shared site assets.

## Build and check

From the repository root, with Python 3 and Node.js on PATH:

```text
python tools/build-platform-guides.py
python tools/build-platform-guides.py --check
python tools/check-platform-guides-integration.py
```

No npm packages, Python packages, network access, or framework are needed for this
build. Use `--node PATH` or the `NODE` environment variable to select Node.
Serve the generated `platforms/` files together with the referenced shared
`css/site-shell.css` and `js/site-updates.js` assets from the site root.

The builder uses an isolated directory under the repository's ignored `tmp/`,
checks writes, normalizes source newlines, and removes the stage after validating
its resolved path. It never reads the sibling source project.

## Ownership

- `src/`: source data, illustrations, shared renderers, five OEM learning guides,
  generation/memory/support evidence, build scripts, and retained regression checks.
- `import-provenance.json`: unchanged historical fingerprints of the 102 imported
  model records, illustrations, exact catalog bytes, and source release manifest.
- `art-review-baseline.json`: the catalog before the authorized illustration review,
  including protected non-art data and per-model drawing/evidence fingerprints.
- `art_revision.py`: enforces the protected hardware/support/memory/date data and
  rejects artwork or illustration-evidence changes without a matching review.
- `src/approved-art-revision.json`: the fourteen approved replacements and their
  before/after drawing and evidence hashes, with official visual-review provenance.
- `src/art-review-*.json` and `src/physical-*.json`: the actual OEM image/document
  locators, inspected features, illustrated configuration and limitations.
- `src/preservation-baseline.json`: compact fingerprints for the earlier 92 model
  illustrations and source locators. This replaces a large duplicate baseline catalog.
- `reviews/upstream-v1.2/`: the prior standalone release's browser/evaluation records.
  They apply to that release only and are not published as an integrated-browser PASS.
- `reviews/preceding-audit/`: the historical broad audit linked from the current
  specification review. The generated page has an explicit historical banner.
- `platforms/integration-browser-results.json`: a separately recorded review of the
  integrated UI. It is a manual review input, not invented by the build.

All generated HTML, catalog, current evidence reports, and test reports live under
`platforms/`, including the fourteen-model `illustration-review.html` gallery.
The `package-manifest.json` records generated-file hashes.
Do not hand-edit the generated pages: edit `src/` or the wrapper and regenerate.

## Routes and navigation

`platforms/index.html#finder` is canonical. The old
`platforms/amd-platform-finder.html` redirects to it while preserving both the
query string and fragment. Five `*-field-guide.html` pages remain directly
addressable. Products, Benchmarks, Platforms, OEM guide menus, and evidence links
use relative routes and work under a GitHub Pages project prefix or another local
subpath. No deployment domain or localhost address is needed by runtime navigation.

## Shared site shell and releases

All eight main surfaces — Products, Benchmarks, the Finder and five OEM guides —
use the same `.chipindex-site-header`, top-level navigation, version display and
What's new dialog. The Finder/OEM selectors and each guide's lessons are secondary
navigation inside Platforms. OEM marks and colors remain learning context, and
existing direct guide/model routes continue to work.

`css/site-shell.css` styles the common header and dialog without loading the
Products layout into a guide. `js/site-updates.js` provides the frozen
`ChipIndexRelease` metadata, header-label synchronization and shared dated release
history. `src/template.html` and `src/finder-template.html` provide matching static
fallbacks; `src/platforms-shell.css` controls the local guide navigation. Preserve
this hierarchy when adding another view rather than replacing What's new with a
section-specific action.

The integrated manifest records `siteVersion` separately from catalog `version`.
It hashes `../css/site-shell.css` and `../js/site-updates.js` in `sharedAssetHashes`
and includes those entries in `buildHash`. Changing shared shell styling or release
content therefore invalidates an older browser review, just as changing a generated
page does. Bump the appropriate asset cache revisions in all eight surfaces and
rebuild after shared asset changes.

## Data integrity and review scope

The original integration preserved all imported facts and artwork. The subsequent
artwork review replaces fourteen generic illustrations: the ten newly added servers
and four older installed-base profiles. Each replacement follows a visually
inspected official OEM image or front-panel diagram. Shared cosmetic layouts stay
shared where the references show the same exterior; internal capabilities are not
inferred from the picture.

Every non-art field in all 102 profiles remains unchanged, including hardware,
support, memory topology, generation dates and source evidence. The drawing and
illustration metadata are the only allowed model changes, and must match the
approved revision. The original import provenance is not rewritten to conceal the
artwork change. `art-review-baseline.json`, `art_revision.py` and
`src/approved-art-revision.json` enforce this distinction during regeneration and
integration checks.

HPE Cray XD245, HPE Cray XD285 and Supermicro SBA-817V7-1N retain their explicitly
labeled contextual schematics. Reference-reviewed exteriors are still simplified
illustrations of a named configuration; they are not photographs, exact bills of
materials, or statements of maximum drive population.

For a deliberate future specification update, first capture primary OEM evidence,
update the relevant claims and peer-review record, and review changed model
records separately from artwork. HPE QuickSpecs are the primary source for HPE
configuration details. Retain the previous release provenance and document the
new reviewed baseline; never refresh fingerprints merely to silence an unexpected
mismatch. Unknowns, conflicting documentation, exact configuration restrictions,
and schematic illustration labels remain explicit.

The deterministic UI manifest distinguishes `upstreamBuiltAt` from
`integrationAsOf`; neither is a new review date for all hardware specifications.
The catalog manifest is recomputed for reviewed artwork changes; this does not
change the original specification evidence or its review dates.

The published implementation evaluation requires five current automated suite
reports plus a current integrated browser report. Both `catalogHash` and
`buildHash` must match; the latter includes the shared shell and release assets.
Supplemental pages such as the illustration gallery also
carry an exact file hash in the browser report's `reviewedPageHashes`; editing
one makes that recorded browser review stale. A missing or stale browser report produces INCOMPLETE;
the old source-release PASS is never substituted.

Browser review input schema:

```json
{
  "version": "1.2.0",
  "catalogHash": "<platforms/build-manifest.json contentHash>",
  "buildHash": "<platforms/build-manifest.json buildHash>",
  "passed": 1,
  "failed": 0,
  "results": [{"name": "Real reviewed scenario", "status": "PASS"}],
  "evaluation": {
    "verdict": "A measured implementation judgment",
    "summary": "What was actually exercised.",
    "strengths": ["Observed strength"],
    "limitations": ["Remaining scope limit"]
  }
}
```

Prior integration and artwork browser reviews remain historical for their recorded
hashes. The cohesive-header revision needs its own actual browser review, including
all eight headers, What's new history, OEM lesson navigation and responsive layouts.
Hardware and physical-reference evidence remain separate from this presentation
review; the implementation report must not inherit an earlier UI PASS.

After recording an actual browser review, rerun the build to regenerate the
evaluation. A repeated build with the same inputs is byte-for-byte deterministic.
