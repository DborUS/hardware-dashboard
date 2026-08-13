# Design System

Extracted from the actual CSS and data files. Follow this so new UI looks like it was
always part of the dashboard.

**Overall character:** dark technical dashboard. Near-black navy background, monospace for
anything data-like, one saturated accent colour per architecture, restrained motion.
Reads like an instrument panel, not a marketing page.

---

## Colour

### Base tokens

The only six global colours, in `css/styles.css` `:root`. Use these — never hardcode a grey.

| Token | Value | Use |
|---|---|---|
| `--bg-primary` | `#0a0e1a` | Page background (near-black navy) |
| `--bg-card` | `#1a2236` | Cards, inputs, buttons |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Nearly all borders |
| `--text-primary` | `#e8ecf4` | Headings, primary values |
| `--text-secondary` | `#8892a8` | Descriptions, secondary text |
| `--text-muted` | `#5a6478` | Labels, years, de-emphasised |

Three-level text hierarchy is deliberate — respect it rather than adding a fourth grey.

### Architecture accent colours

Each architecture carries its own `color`, injected by JS as `--arch-color` and used for
the timeline dot, name, and left border.

**AMD follows a strict newest-warm → oldest-cool progression.** Preserve it when adding
generations — it encodes recency visually:

| Gen | Hex | |
|---|---|---|
| Zen 5 | `#ef4444` | red |
| Zen 4 | `#f97316` | orange |
| Zen 3+ | `#f59e0b` | amber |
| Zen 3 | `#84cc16` | lime |
| Zen 2 | `#14b8a6` | teal |
| Zen+ | `#818cf8` | indigo |
| Zen | `#c084fc` | purple |

A new Zen 6 should extend the warm end — magenta/pink (`#ec4899`) works and stays distinct.

Intel uses the same palette family but assigns by product line rather than recency, so
neighbouring entries just need to be visually distinct.

All accents are Tailwind-500/400 family values. Staying inside that palette keeps
saturation and perceived brightness consistent — pick from it rather than inventing hexes.

### Semantic colours

| Meaning | Colour |
|---|---|
| Search match | amber `rgba(251,191,36,…)` |
| Manual row selection | green |
| Unreleased | red diagonal stripe + red italic label |
| Client badge | blue-ish |
| Server badge | amber |
| Workstation badge | indigo |

Amber = "found by search", green = "I chose this". They coexist; don't overload either.

### Segment / brand tag colours

Defined per vendor in `VENDOR_CONFIG` (`script.js` ~line 82), not CSS.

AMD segments: desktop `#4ade80`, laptop `#f472b6`, handheld `#22d3ee`, server `#fbbf24`.
AMD brands: Ryzen `#f97316`, Ryzen AI `#06b6d4`, Threadripper `#f59e0b`, Epyc `#10b981`,
Athlon `#8b5cf6`.

Intel segments: desktop `#4ade80`, mobile `#f472b6`, server `#fbbf24`, embedded `#c084fc`.
Intel brands: Core Ultra `#38bdf8`, Core `#fb923c`, Xeon `#a78bfa`, Xeon 6 P `#ef4444`,
Xeon 6 E `#14b8a6`.

Note `desktop`, `mobile`/`laptop` and `server` share colours across vendors — intentional
consistency. Keep it.

---

## Typography

Two families, loaded from Google Fonts with `display=swap`:

- **DM Sans** — body copy, descriptions, prose
- **JetBrains Mono** — everything data-like: headings, architecture names, years, badges,
  buttons, table content, search input

> The monospace-for-data rule is the strongest single style signal in this project. A new
> control that uses the sans font will look wrong immediately.

| Element | Size | Weight | Notes |
|---|---|---|---|
| `header h1` | 1.8rem | 600 | mono, `letter-spacing: -0.5px` |
| `header p` | 0.85rem | — | uppercase, `letter-spacing: 2px` |
| `.arch-name` | 1.15rem | 600 | mono, `-0.3px` |
| `.vendor-tab` | 1.3rem | 700 | mono |
| `.arch-year` | 0.75rem | — | mono, muted, pill background |
| `.filter-btn` | 0.75rem | 500 | mono, `letter-spacing: 0.5px` |
| `.legend-item` | 0.75rem | — | mono |
| `.expand-all-btn` | 0.7rem | — | mono |
| `.era-label` | 0.65rem | — | uppercase, `letter-spacing: 2.5px` |
| `.arch-segment-badge` | 0.6rem | 600 | uppercase, `letter-spacing: 1.5px` |

Pattern: **smaller text gets more letter-spacing.** Below ~0.8rem, add tracking.

---

## Shape and spacing

Border radius by element size — small elements get tighter corners:

| Radius | Used on |
|---|---|
| 3–4px | badges, year pills, small tags |
| 5–6px | buttons, filter buttons |
| 8px | search input, cards |
| 10px | larger panels |
| 20px | legend pills (fully rounded) |

Touch targets: `min-height: 40px` on legend items, `44px` on buttons — WCAG compliance,
already done deliberately. **Don't reduce these.**

---

## Motion

Restrained and quick. Standard durations:

| Duration | Use |
|---|---|
| 0.15s | background hover on table rows |
| 0.2s | most hovers, opacity fades |
| 0.25s | buttons, legend items (`all`) |
| 0.3s | transforms, larger transitions |

Keyframes that exist — reuse rather than adding near-duplicates:

- `slideUp` — entry animation, `opacity` + `translateY(20px)`
- `fadeSlide` — smaller entry, `translateY(-6px)`
- `highlightPulse` — search-match amber settle

**Staggering:** architecture groups animate in sequence via
`animationDelay = index * 0.04s`. Keep the same cadence for any new list.

**Animate `opacity` and `transform` only.** `max-height` triggers layout reflow — the Feb
audit flagged it and it's still true.

---

## Component patterns

**Architecture group** — left border in `--arch-color`, timeline dot, name + year pill +
segment badges, expand chevron. Body reveals SKU grid, links area, notes area.

**SKU card** — name (+ spec count), description, tag row, specs toggle. `.has-specs` makes
it clickable; `.selected` when its table is open; `.unreleased-sku` for future parts.

**Spec table** — sticky-feeling header row, monospace, horizontally scrollable on mobile
with `-webkit-overflow-scrolling: touch`. `.cpu-val-highlight` for headline numbers
(cores, boost), `.cpu-val-gpu` for GPU fields, `.cpu-model-name` for the first column.

**Filter button** — mono, uppercase-ish, `.active` state. Pattern:
`data-filter-type` + `data-filter` attributes, wired by `addEventListener` in
`buildFilters()`.

**Legend pill** — fully rounded, coloured dot + label, `.active` and `.inactive` (dimmed
when other tags are selected).

**Grid ordering trick:** SKU cards and their spec tables live in one CSS grid. Cards get
`--card-order: i*2`, spec wrappers `--spec-order: i*2+1`. When a table opens,
`toggleCpuSpecs()` recalculates order so the table lands at the end of its visual row.
If you change the grid layout, that calculation needs revisiting.

---

## Responsive

Three breakpoints. **Don't add a fourth** — it fragments the logic.

| Width | Changes |
|---|---|
| ≤768px | single-column SKU grid, smaller dots, segment badges hidden |
| ≤640px | further size/padding reduction |
| ≤375px | smallest phones |

Tables scroll horizontally rather than wrapping — 8px scrollbars for touch. See
`docs/MOBILE-TESTING.md`.

---

## Accessibility — current state

Substantially addressed on 2026-08-13.

**In place:** 44×44px touch targets; sufficient contrast on the dark theme; every
interactive element reachable by Tab and activatable with Enter/Space; `role="button"`,
`aria-expanded` and `aria-label` on architecture headers and SKU cards; `aria-pressed`
on filter chips; `:focus-visible` rings; a polite live region (`#filterStatus`)
announcing result counts.

**Patterns to follow when adding UI:**

- Prefer a real `<button>`. It gets keyboard access, focus and semantics for free — the
  filter chips are buttons for exactly this reason. Reset its default chrome with
  `background: none; border: 0; padding: 0; font-family: inherit`.
- If a `<div>` must be clickable, it needs `role="button"`, `tabindex="0"`, an
  `aria-label`, and `aria-expanded` when it toggles something. Activation is already
  handled — `setupKeyboardHandlers()` catches Enter/Space on any `[role="button"][tabindex]`
  via one delegated listener, so don't add per-element key handlers.
- Use `:focus-visible`, never `:focus` — the latter shows an outline on mouse clicks too.
  Use `var(--arch-color)` inside an architecture, `#60a5fa` for global chrome.
- `.sr-only` hides content visually while leaving it available to screen readers.

**Still open:** spec-table rows aren't keyboard-reachable (640 of them; needs a roving
tabindex), there's no skip-link, the codename table's click-to-jump rows are mouse-only,
and none of it has been tested with a real screen reader.
