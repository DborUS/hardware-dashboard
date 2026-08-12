# Workflows

Step-by-step recipes for common tasks. Each is written so Claude can follow it without
re-deriving the codebase, and so Daniel can see what's about to happen.

---

## The standard loop

Every task, regardless of size:

```
1. Read CLAUDE.md + docs/PROJECT-STATE.md
2. Set up verification (once per session)   → Workflow 0
3. Make the change
4. python3 tools/smoke-test.py --shots
5. Read the screenshots — do they look right?
6. Update docs/PROJECT-STATE.md + CHANGELOG.md
7. Hand Daniel the git commands
```

Step 5 is the one that gets skipped and shouldn't. Passing counts prove nothing rendered
an error; they don't prove the layout isn't mangled.

---

## Workflow 0 — Session setup

Run once at the start of a session. Takes ~3 minutes; the sandbox resets between sessions.

```bash
pip install playwright
export NODE_OPTIONS="--use-system-ca"
python3 -m playwright install chromium-headless-shell
```

`NODE_OPTIONS="--use-system-ca"` is **required** on the AMD network. Zscaler re-signs TLS,
and Node ignores the system CA store by default → `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`.
`NODE_EXTRA_CA_CERTS` is *not* sufficient on Node 22.

If Chromium won't launch with a missing-library error:

```bash
cd /tmp && apt-get download libxdamage1 && dpkg -x libxdamage1*.deb ext
mkdir -p ~/lib && cp ext/usr/lib/x86_64-linux-gnu/libXdamage.so.1* ~/lib/
export LD_LIBRARY_PATH=$HOME/lib
```

If you see `FATAL: Error loading V8 startup snapshot file`, the browser was installed to a
network-mounted path that silently dropped files. Reinstall to native disk:

```bash
export PLAYWRIGHT_BROWSERS_PATH=/tmp/pwb
python3 -m playwright install chromium-headless-shell
```

Confirm the baseline before changing anything:

```bash
python3 tools/smoke-test.py
```

---

## Workflow 1 — Add a new architecture

Example: a new Zen generation.

**1. Get the data from Daniel.** Do not source specs yourself. You need: architecture
name, year, process node, product families, and the SKU table if it exists.

**2. Add the architecture entry** to `js/data/amd-data.json` (or `intel-data.json`).
Insert in reverse-chronological position — newest first. If it starts a new year, add an
era separator `{"era": "2026"}` before it.

```json
{
  "id": "zen6",
  "arch": "Zen 6",
  "color": "#ec4899",
  "year": "2026",
  "segment": "client",
  "subtitle": "TSMC 2 nm · Ryzen 10000 · EPYC 9006",
  "defaultLinks": [{ "label": "Wikipedia", "url": "https://en.wikipedia.org/wiki/Zen_6" }],
  "skus": [
    {
      "name": "Olympic Ridge",
      "desc": "Ryzen 10000 series — desktop processors",
      "tags": ["desktop"],
      "brand": "Ryzen"
    }
  ]
}
```

Constraints that will bite you if ignored:

- `id` must be unique and URL-safe — it's used in DOM ids and localStorage keys.
- `color` must be visually distinct from neighbours; follow the warm→cool progression
  described in `docs/DESIGN-SYSTEM.md`.
- `tags` must be values the vendor's filter buttons know about, or the entry becomes
  unreachable by filter. AMD: `desktop`, `laptop`, `handheld`, `server`. Intel: `desktop`,
  `mobile`, `server`, `embedded`.
- `brand` must match a `brandTags` entry in `VENDOR_CONFIG` **exactly**, including case
  and spaces (`"Ryzen AI"`, not `"ryzen ai"`), or brand filtering silently drops it.
- Mark future parts with `"unreleased": true` for the diagonal-stripe treatment.

**3. If it's AMD, add a codename table row** in `VENDOR_CONFIG.amd.codenameTable`
(`script.js` ~line 121). This is hardcoded, not JSON — easy to forget. `id` must match the
architecture `id` so click-to-jump works.

**4. Add SKU specs** if you have them — see Workflow 2.

**5. Verify.**

```bash
python3 -m json.tool js/data/amd-data.json > /dev/null   # valid JSON?
python3 tools/smoke-test.py --shots
```

`amd_cpu_groups` should increase by one. Read the screenshot and confirm the new entry
sits in the right year with the right accent colour.

---

## Workflow 2 — Add SKU specs to a spec table

Specs live in `amd-cpu-specs.json` / `intel-cpu-specs.json`, keyed by **SKU name** — the
`name` field from the architecture's `skus` array. The key must match character-for-
character or the table simply won't appear (no error, no warning).

Client/consumer record — note the terse field names:

```json
"Granite Ridge": [
  {
    "n": "Ryzen 9 9950X", "c": "16", "t": "32",
    "bst": "Up to 5.7 GHz", "bas": "4.3 GHz",
    "l3": "64 MB", "tdp": "170W", "sk": "AM5",
    "gm": "AMD Radeon Graphics", "gc": "2", "gf": "2200 MHz",
    "tr": "100-000001277"
  }
]
```

Server record — add `_srv: true` and swap the last three fields:

```json
{
  "n": "EPYC 9755", "c": "128", "t": "256",
  "bst": "Up to 4.1 GHz", "bas": "2.7 GHz",
  "l3": "512 MB", "tdp": "500W", "sk": "SP5",
  "skc": "1P / 2P", "pcie": "PCIe® 5.0 x128", "mem": "Up to 6400 MT/s",
  "tr": "100-000001443", "_srv": true
}
```

**`_srv` selects the table layout**, not just a label. With it: Sockets / PCIe / Memory
columns. Without it: GPU Model / GPU CUs / GPU Freq. Set it wrongly and a desktop chip
renders server columns — which is exactly the current Intel bug (all 219 Intel records are
flagged `_srv`, including desktop parts).

Keep units and phrasing consistent with neighbouring rows (`"170W"` not `"170 W"`;
`"Up to 5.7 GHz"` where siblings use that form). These strings are rendered verbatim.

After editing: validate JSON, run the smoke test, and confirm `spec_tables` went up.

---

## Workflow 2b — Import specs from a vendor CSV (the usual case)

New silicon usually arrives as a CSV export from a vendor specifications page. Use
`tools/import-specs.py` rather than hand-editing JSON — it checks every silent failure
this project has hit.

**Step 1 — does the architecture entry exist?**

The spec file is keyed by `skus[].name` from the architecture file. If the codename is
new (e.g. EPYC 9006 "Verano"), do Workflow 1 first. The importer will refuse to write
otherwise, because a mismatched key means the table silently never renders.

**Step 2 — inspect the CSV.**

```bash
python3 tools/import-specs.py inspect ~/Downloads/epyc-9006.csv --target amd-cpu
```

Prints every column, a guessed schema field, a sample value, and a starter mapping.
Save that mapping to a file and **correct it by hand** — the guesses are a starting
point, not an answer. Fields the CSV genuinely lacks should be left out; an omitted
field renders as blank, a wrong one renders as a lie.

**Step 3 — dry run.**

```bash
python3 tools/import-specs.py import ~/Downloads/epyc-9006.csv \
    --target amd-cpu --sku "Verano" --map map.json --server
```

Writes nothing. Shows the first and last record exactly as they'd be stored, plus:

- **Blocking** — SKU key doesn't match any architecture entry. Refuses to write.
- **Warnings** — `--server` set but no server fields mapped (or vice versa); TDP/boost/
  memory phrasing drifting from existing rows (`"600 W"` vs `"600W"`); duplicate model
  names.

`--server` is not cosmetic: it sets `_srv: true`, which picks the Sockets/PCIe/Memory
column layout instead of the iGPU one. Get it wrong and the table shows the wrong columns.

**Step 4 — write, then verify.**

```bash
python3 tools/import-specs.py import ... --write
python3 tools/smoke-test.py --shots
```

Importing an existing key **replaces** all its models — that's how you refresh a series
after a vendor spec update. The dry run tells you how many rows you're replacing.

**Step 5 — check the new tags reach a filter chip.**

If the import introduced a new brand or segment tag, add it to `VENDOR_CONFIG` too.
Values with no chip are unreachable. This has bitten the project three times:

```bash
python3 - <<'EOF'
import json, re
d = json.load(open('js/data/amd-data.json'))
data = {s.get('brand') for a in d if 'era' not in a for s in a['skus'] if s.get('brand')}
cfg = set(re.findall(r"tag: '([^']+)'", open('js/script.js').read()))
print("brands with no chip:", data - cfg or "none")
EOF
```

**Round-tripping.** To see existing data as CSV (useful for diffing against a vendor
update):

```bash
python3 tools/import-specs.py export --target amd-cpu --sku Turin
```

**GPUs** aren't supported by the importer yet — GPU specs are nested inside the
architecture entry rather than living in a separate keyed file, so add those via
Workflow 1. Worth extending the tool when the next Instinct series lands.

**Never let the importer invent data.** It only maps columns you point at. If a vendor
CSV lacks a field, leave it unmapped.

---

## Workflow 3 — Add a column to spec tables

Two edits, and they must agree — a header/cell count mismatch shifts every column right.

**1. Header** — `script.js` ~line 621:

```js
<th>Name</th><th>Cores</th>...<th>Socket</th>${cpuSpecs[0]._srv
  ? '<th>Sockets</th><th>PCIe</th><th>Memory</th>'
  : '<th>GPU Model</th><th>GPU CUs</th><th>GPU Freq</th>'}<th>Product ID Tray</th>
```

**2. Cells** — `script.js` ~line 625, same conditional shape:

```js
<td>${m.sk}</td>${m._srv
  ? `<td>${m.skc}</td><td>${m.pcie}</td><td>${m.mem}</td>`
  : `<td class="cpu-val-gpu">${m.gm}</td><td>${m.gc}</td><td>${m.gf}</td>`}
<td>${m.tr}</td>
```

Add to **both** branches if the column applies to both. Use `${m.newField || '—'}` so rows
lacking the field degrade gracefully instead of printing `undefined`.

Highlight classes available: `.cpu-val-highlight` (cores/boost — the "headline" numbers),
`.cpu-val-gpu` (GPU fields), `.cpu-model-name` (first column; also the search-highlight
target).

Tables scroll horizontally on mobile, so extra columns are safe there — but each one
narrows the desktop view. Ask before adding more than one or two.

---

## Workflow 4 — Add a new filter

This is where the render/filter split matters most. **Both halves or it silently fails.**

**1. State** — add near line 137:
```js
let activeFoo = 'all';
```

**2. Stamp metadata in `render()`** (~line 578) *and* `renderGpu()` (~line 719) if it
applies to GPUs:
```js
group.dataset.foo = computeFooFrom(arch);
```

**3. Read it in `applyFilters()`** (~line 858):
```js
if (visible && activeFoo !== 'all' && group.dataset.foo !== activeFoo) visible = false;
```

**4. Build the button** in `buildFilters()` / `buildGpuFilters()`, following the existing
`data-filter-type` / `data-filter` attribute pattern.

**5. Call `applyFilters()` from the click handler — never `render()`.**

Test that the filter narrows *and* that clearing it restores the full set. A filter that
hides everything is easy to ship by accident; the GPU form-factor bug is exactly that.

---

## Workflow 5 — Change styling

All styling is in `css/styles.css`. Read `docs/DESIGN-SYSTEM.md` first.

- Use `:root` tokens rather than hardcoded colours.
- Per-architecture accent is `var(--arch-color)`, injected by JS.
- Animate `opacity` / `transform`. Not `max-height`, not `width`.
- Check all three breakpoints — 768 / 640 / 375 px.

Verify with screenshots at multiple widths:

```python
for w in (1440, 768, 375):
    page.set_viewport_size({"width": w, "height": 900})
    page.screenshot(path=f"/tmp/w{w}.png")
```

Then actually read the images.

---

## Workflow 6 — GPU segments (worked example, completed 2026-08-12)

Kept as a reference for how a filter change is done end to end.

**The bug:** PCIe/OAM form-factor buttons hid 12 of 42 families. The data has eight `form`
values but `applyFilters()` only matched the substrings `pcie` and `oam`, so workstation
cards labelled `Desktops` or `Laptops` silently vanished.

**The fix:** removed the form-factor buttons entirely and added `Mobile` as a fifth
segment, since form factor is only meaningful for datacenter parts (PCIe vs OAM) and that
is now shown as a table column instead of a filter.

What changed, as a template for similar work:

1. `GPU_SEGMENTS` const — single source of truth for legend *and* buttons, so the two
   can't drift apart.
2. `gpuSegmentOf(arch)` — derives `mobile` from a family's form factors at render time
   rather than storing it in the data, so new mobile families self-categorise.
3. `renderGpu()` stamps `dataset.gpuSegment` from that helper; the `gpuForms` stamp is gone.
4. `applyFilters()` reads only `gpuSegment` — the whole form-factor branch was deleted.
5. `buildGpuLegend()` / `buildGpuFilters()` both map over `GPU_SEGMENTS`.

**The check that mattered:** segment counts must sum to the total, or a family is
unreachable. 7 datacenter + 9 workstation + 22 consumer + 4 mobile = 42. Run that sum
after any change to segmentation.

---

## Workflow 7 — Handing off to Daniel

Summarise what changed, what you verified, then the commands:

````
Added Zen 6 to the AMD roadmap. Smoke test passes — amd_cpu_groups 7 → 8,
no JS errors. Screenshot confirms it renders under a new 2026 era header.

```powershell
cd C:\Users\dbor\dev\hardware-dashboard
git diff --stat --ignore-all-space
git add -A
git commit -m "Add Zen 6 architecture"
```
````

`--ignore-all-space` matters: a fresh clone shows all 14 files as modified due to CRLF vs
LF. If `--ignore-all-space` shows nothing, there are no real changes.

Mention `git push` only when he wants it live.

---

## Anti-patterns

Things that look reasonable and will damage the project:

| Don't | Why |
|---|---|
| Call `render()` from a filter or search handler | Undoes the v0.3.0 rewrite; back to 300–500 ms |
| Add a framework, bundler, or npm dependency | Zero-dependency is the point; GitHub Pages serves it as-is |
| Invent spec numbers to fill a gap | Wrong specs in front of a customer is the worst outcome |
| Edit `cpu-architecture-roadmap.html` | Dead file, nothing links to it |
| Commit without `--ignore-all-space` check | CRLF noise buries the real diff |
| Skip the smoke test on a "trivial" change | Trivial JSON typos take the whole page down |
| Interpolate user text without `escHtml()` | Breaks markup, and it's already a known bug |
| Add a fourth breakpoint | Three exist; adding more fragments the responsive logic |
