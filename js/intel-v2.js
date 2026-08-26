// ═══════════════════════════════════════════════════════════════════════════
//  INTEL v2 — generation-first renderer
//  ---------------------------------------------------------------------------
//  Drives the Intel vendor tab. AMD still uses render() in script.js; this file
//  takes over the same DOM (#timeline, #searchInput, #filterControls, toolbar)
//  when switchVendor('intel') runs, and hands it back on switchVendor('amd').
//
//  Structure:
//     SUB-TAB   (Xeon | Client | Graphics)   <- also picks the spec-table columns
//       GENERATION  (Xeon 6, 14th Gen, ...)  <- the timeline block
//         CODENAME  (Granite Rapids AP, ...) <- SKU card
//           spec table
//
//  Tier (Core Ultra / Xeon Gold / ...) is a FILTER CHIP, not a nesting level —
//  it is already in every model name, and four sparse rows per generation reads
//  worse than one chip.
//
//  Ordering follows golden rule #2 in CLAUDE.md: datacenter -> client -> desktop
//  -> mobile, flagship first within a tier.
//
//  NO SPEC DATA YET. Tables render their real column set with an empty body;
//  models arrive via the bulk CSV import. See docs/PROJECT-STATE.md.
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
//  COLUMN SETS — the payoff of splitting the tabs
// ═══════════════════════════════════════════════════════════════════════════
// Column layout becomes a property of the TAB rather than a per-SKU `_srv`
// flag. That flag is currently true on all 219 Intel parts, which is why the
// Core Ultra 9 285K renders Sockets/PCIe/Memory today. Sub-tabs delete the bug
// rather than fixing it.

const V2_COLUMNS = {
  xeon: ['Model', 'P-cores', 'E-cores', 'Threads', 'Base', 'Boost', 'L3 Cache',
         'TDP', 'Sockets', 'Memory', 'Max Mem', 'PCIe', 'UPI'],
  client: ['Model', 'P-cores', 'E-cores', 'Threads', 'P Base / Boost',
           'E Base / Boost', 'L3 Cache', 'TDP (base/turbo)', 'iGPU',
           'Xe-cores', 'Memory'],
  // Graphics is the one tab where the column set is NOT a property of the tab.
  // Consumer, workstation and data-center parts need genuinely different fields,
  // so the set is keyed by brand line and resolved per card by v2Columns().
  graphics: {
    'Arc':         ['Model', 'Xe-cores', 'RT Units', 'XMX', 'Clock', 'VRAM', 'Bus',
                    'Bandwidth', 'TBP', 'PCIe'],
    'Arc Pro':     ['Model', 'Xe-cores', 'RT Units', 'XMX', 'Clock', 'VRAM', 'ECC',
                    'Bandwidth', 'TBP', 'Form Factor'],
    'Data Center': ['Model', 'Xe-cores', 'Xe Vector', 'Xe Matrix', 'Clock', 'Memory',
                    'Bandwidth', 'TBP', 'Form Factor', 'Xe Link']
  }
};

/**
 * Column set for one card. Every tab but Graphics uses a single flat list;
 * Graphics resolves by brand line, falling back to the first set defined.
 */
// Loaded from js/data/intel-*-specs.json by v2LoadSpecs(). Keyed by the card
// name, which is why V2_DATA family names and spec keys must stay identical.
let V2_SPECS = {};

// Field order per tab, parallel to V2_COLUMNS. Graphics has no data yet.
const V2_FIELDS = {
  xeon: ['n', 'pc', 'ec', 't', 'bas', 'bst', 'l3', 'tdp', 'skc', 'mem', 'cap', 'pcie', 'upi']
};

/**
 * Fetch the spec file for a sub-tab. Cached; a missing file is not an error —
 * Client and Graphics have no data yet and render empty column sets by design.
 */
async function v2LoadSpecs(tab) {
  if (V2_SPECS[tab] !== undefined) return;
  V2_SPECS[tab] = {};
  if (!V2_FIELDS[tab]) return;
  try {
    const v = (typeof DATA_VERSION !== 'undefined') ? DATA_VERSION : Date.now();
    const res = await fetch(`js/data/intel-${tab}-specs.json?v=${v}`);
    if (res.ok) {
      V2_SPECS[tab] = await res.json();
      console.log(`V2_SPECS.${tab}:`, Object.keys(V2_SPECS[tab]).length, 'codenames');
    }
  } catch (err) {
    console.warn(`could not load ${tab} specs:`, err);
  }
}

function v2Columns(tier) {
  const c = V2_COLUMNS[v2Tab];
  return Array.isArray(c) ? c : (c[tier] || Object.values(c)[0]);
}

// ═══════════════════════════════════════════════════════════════════════════
//  TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════
// `tier` and `seg` on each family drive the filter chips. `n` is the model count
// carried over from the current data purely so the blocks aren't all identical
// in size — it is NOT spec data and nothing reads it but the card label.

const V2_DATA = {

  // ─────────────────────────────────────────────────────────────────────────
  //  XEON — numbered by Xeon generation, which runs parallel to Core, not with it
  // ─────────────────────────────────────────────────────────────────────────
  xeon: {
    title: 'Intel Xeon',
    blurb: 'Server · workstation · embedded',
    filters: [
      { label: 'Generation', key: 'gen', tags: [
        ['Xeon 7',  '#f97316'], ['Xeon 6+', '#fb923c'], ['Xeon 6', '#ef4444'],
        ['Xeon 5',  '#a78bfa'], ['Xeon 4',  '#8b5cf6'], ['Xeon 3', '#7c3aed'],
        ['Xeon 2',  '#6366f1'], ['Xeon 1',  '#4f46e5'], ['Xeon W', '#34d399'],
        ['Xeon E',  '#22d3ee'], ['Xeon D',  '#14b8a6']
      ]},
      { label: 'Tier', key: 'tier', tags: [
        ['P-core', '#ef4444'], ['E-core', '#14b8a6'], ['Platinum', '#e2e8f0'],
        ['Gold', '#fbbf24'], ['Silver', '#94a3b8'], ['Bronze', '#b45309'],
        ['Workstation', '#34d399'],
        ['Embedded', '#c084fc']
      ]},
      { label: 'Segment', key: 'seg', tags: [
        ['1P', '#60a5fa'], ['2P', '#818cf8'], ['4P+', '#a78bfa'],
        ['Edge', '#f472b6']
      ]}
    ],
    gens: [
      // Ordering: golden rule #2 — datacenter first, then workstation / edge.
      // Codenames and SKU counts verified against the combined ARK export
      // (604 SKUs) on 2026-08-16. Mobile Xeon W/E and Broadwell-D are out of
      // scope per Daniel; the cutoff is drawn at the family boundary, so every
      // part here is Skylake-era (2017) or newer.
      { era: 'Xeon Scalable', eraNote: 'Socketed server — 1S through 8S' },

      { id: 'xeon7', name: 'Xeon 7', years: '2027', color: '#f97316',
        note: 'Unreleased — Diamond Rapids', unreleased: true, families: [
        { name: 'Diamond Rapids',     desc: 'Next-gen P-core Xeon, successor to Granite Rapids', tier: 'P-core', seg: '2P', si: 'Diamond Rapids · Intel 18A', n: 0 },
        { name: 'Diamond Rapids HBM', desc: 'High-bandwidth memory variant for AI / HPC',        tier: 'P-core', seg: '2P', si: 'Diamond Rapids · Intel 18A', n: 0 }
      ]},

      { id: 'xeon6p', name: 'Xeon 6+', years: '2026', color: '#fb923c',
        note: 'Refreshed E-core line on Intel 18A', families: [
        { name: 'Clearwater Forest', desc: 'Up to 288 E-cores, FCLGA7529', tier: 'E-core', seg: '2P', si: 'Clearwater Forest · Intel 18A', n: 4 }
      ]},

      { id: 'xeon6', name: 'Xeon 6', years: '2024 – 2026', color: '#ef4444',
        note: 'First split into P-core and E-core product lines', families: [
        { name: 'Granite Rapids AP', desc: 'Xeon 6900P — max core count, FCLGA7529',        tier: 'P-core', seg: '2P',   si: 'Granite Rapids · Intel 3', n: 8 },
        { name: 'Granite Rapids SP', desc: 'Xeon 6700P + 63xx entry parts, FCLGA4710 / 1700', tier: 'P-core', seg: '2P',   si: 'Granite Rapids · Intel 3', n: 43 },
        { name: 'Granite Rapids D',  desc: 'Xeon 6 SoC for edge and networking, BGA',        tier: 'P-core', seg: 'Edge', si: 'Granite Rapids · Intel 3', n: 22 },
        { name: 'Sierra Forest AP',  desc: 'Xeon 6900E — up to 288 E-cores, FCLGA7529',      tier: 'E-core', seg: '2P',   si: 'Sierra Forest · Intel 3', n: 0 },
        { name: 'Sierra Forest SP',  desc: 'Xeon 6700E — E-core density, FCLGA4710',         tier: 'E-core', seg: '2P',   si: 'Sierra Forest · Intel 3', n: 7 }
      ]},

      { id: 'xeon5', name: 'Xeon 5 (5th Gen Scalable)', years: '2023', color: '#a78bfa',
        note: 'Emerald Rapids — drop-in upgrade on LGA 4677', families: [
        { name: 'Emerald Rapids SP', desc: 'Xeon Platinum / Gold 8500 & 6500 series', tier: 'Platinum', seg: '2P', si: 'Emerald Rapids · Intel 7', n: 32 }
      ]},

      { id: 'xeon4', name: 'Xeon 4 (4th Gen Scalable)', years: '2023', color: '#8b5cf6',
        note: 'Sapphire Rapids — first DDR5 / PCIe 5.0 Xeon', families: [
        { name: 'Sapphire Rapids SP',  desc: 'Xeon Platinum / Gold / Silver 4th Gen', tier: 'Platinum', seg: '2P', si: 'Sapphire Rapids · Intel 7', n: 51 },
        { name: 'Sapphire Rapids HBM', desc: 'Xeon Max 94xx — 64 GB HBM2e on package', tier: 'Platinum', seg: '2P', si: 'Sapphire Rapids · Intel 7', n: 4 }
      ]},

      { id: 'xeon3', name: 'Xeon 3 (3rd Gen Scalable)', years: '2020 – 2021', color: '#7c3aed',
        note: 'Two incompatible families share this name — different platforms', families: [
        { name: 'Ice Lake-SP', desc: '10 nm, 1S / 2S, LGA 4189 (Whitley)',            tier: 'Platinum', seg: '2P',  si: 'Ice Lake · 10 nm', n: 38 },
        { name: 'Cooper Lake', desc: '14 nm, 4S / 8S, LGA 4189 (Cedar Island)',       tier: 'Platinum', seg: '4P+', si: 'Cooper Lake · 14 nm', n: 15 }
      ]},

      { id: 'xeon2', name: 'Xeon 2 (2nd Gen Scalable)', years: '2019 – 2020', color: '#6366f1',
        note: 'Cascade Lake — 14 nm, LGA 3647, up to 8 sockets', families: [
        { name: 'Cascade Lake-AP',      desc: 'Xeon Platinum 9200 — soldered, up to 56C',   tier: 'Platinum', seg: '2P', si: 'Cascade Lake · 14 nm', n: 4 },
        { name: 'Cascade Lake-SP',      desc: 'Xeon Platinum / Gold / Silver / Bronze',     tier: 'Platinum', seg: '2P', si: 'Cascade Lake · 14 nm', n: 53 },
        { name: 'Cascade Lake Refresh', desc: 'February 2020 SKU refresh',                  tier: 'Gold',     seg: '2P', si: 'Cascade Lake · 14 nm', n: 19 }
      ]},

      { id: 'xeon1', name: 'Xeon 1 (1st Gen Scalable)', years: '2017', color: '#4f46e5',
        note: 'Skylake-SP — the Platinum / Gold / Silver / Bronze naming starts here', families: [
        { name: 'Skylake-SP', desc: '14 nm, LGA 3647, mesh interconnect, UPI replaces QPI', tier: 'Platinum', seg: '2P', si: 'Skylake · 14 nm', n: 52 }
      ]},

      // ═══ Workstation and edge ════════════════════════════════════════════
      { era: 'Workstation and edge', eraNote: 'Single-socket workstation, entry server and embedded SoC' },

      { id: 'xeonw', name: 'Xeon W', years: '2017 – 2026', color: '#34d399',
        note: 'Single-socket workstation — split by socket generation', families: [
        { name: 'Granite Rapids WS',           desc: 'Xeon 6 workstation, FCLGA4710',   tier: 'Workstation', seg: '1P', si: 'Granite Rapids · Intel 3', n: 11 },
        { name: 'Sapphire Rapids WS-3400/3500', desc: 'w7 / w9 expert, up to 60C',      tier: 'Workstation', seg: '1P', si: 'Sapphire Rapids · Intel 7', n: 14 },
        { name: 'Sapphire Rapids WS-2400/2500', desc: 'w3 / w5 mainstream, LGA 4677',   tier: 'Workstation', seg: '1P', si: 'Sapphire Rapids · Intel 7', n: 15 },
        { name: 'Ice Lake-W (W-33xx)',         desc: '10 nm, LGA 4189',                 tier: 'Workstation', seg: '1P', si: 'Ice Lake · 10 nm', n: 5 },
        { name: 'Cascade Lake-W (W-32xx)',     desc: '14 nm, LGA 3647',                 tier: 'Workstation', seg: '1P', si: 'Cascade Lake · 14 nm', n: 9 },
        { name: 'Cascade Lake-W (W-22xx)',     desc: '14 nm, LGA 2066',                 tier: 'Workstation', seg: '1P', si: 'Cascade Lake · 14 nm', n: 8 },
        { name: 'Skylake-W (W-3175X)',         desc: '28C halo part, LGA 3647',         tier: 'Workstation', seg: '1P', si: 'Skylake · 14 nm', n: 1 },
        { name: 'Skylake-W (W-21xx)',          desc: 'First Xeon W generation, LGA 2066', tier: 'Workstation', seg: '1P', si: 'Skylake · 14 nm', n: 8 },
        { name: 'Rocket Lake-W (W-13xx)',      desc: '14 nm, LGA 1200',                 tier: 'Workstation', seg: '1P', si: 'Rocket Lake · 14 nm', n: 7 },
        { name: 'Comet Lake-W (W-12xx)',       desc: '14 nm, LGA 1200',                 tier: 'Workstation', seg: '1P', si: 'Comet Lake · 14 nm', n: 13 }
      ]},

      { id: 'xeone', name: 'Xeon E', years: '2017 – 2023', color: '#22d3ee',
        note: 'Entry 1-socket server and entry workstation', families: [
        { name: 'Raptor Lake-E (E-24xx)', desc: 'Intel 7, LGA 1700',  tier: 'Workstation', seg: '1P', si: 'Raptor Lake · Intel 7', n: 8 },
        { name: 'Rocket Lake-E (E-23xx)', desc: '14 nm, LGA 1200',    tier: 'Workstation', seg: '1P', si: 'Rocket Lake · 14 nm', n: 10 },
        { name: 'Coffee Lake-E (E-21xx)', desc: '14 nm, LGA 1151',    tier: 'Workstation', seg: '1P', si: 'Coffee Lake · 14 nm', n: 25 }
      ]},

      { id: 'xeond', name: 'Xeon D', years: '2018 – 2023', color: '#14b8a6',
        note: 'Integrated SoC for network and edge — BGA only', families: [
        { name: 'Ice Lake-D (D-27xx)', desc: 'Dense edge SoC, BGA 2579',        tier: 'Embedded', seg: 'Edge', si: 'Ice Lake · 10 nm', n: 27 },
        { name: 'Ice Lake-D (D-17xx)', desc: 'Compact edge SoC, BGA 2227',      tier: 'Embedded', seg: 'Edge', si: 'Ice Lake · 10 nm', n: 27 },
        { name: 'Skylake-D (D-21xx)',  desc: 'Networking and storage, BGA 2518', tier: 'Embedded', seg: 'Edge', si: 'Skylake · 14 nm', n: 13 }
      ]}
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  CLIENT — desktop + mobile, one timeline
  // ─────────────────────────────────────────────────────────────────────────
  // Core Ultra Series 1/2/3 ARE the generation sequence continuing: Intel retired
  // the numbered scheme after 14th Gen, so there is no "15th Gen". They sit at the
  // top of the same timeline, labelled with the equivalence to make that explicit.
  client: {
    title: 'Intel Client',
    blurb: 'Desktop · mobile',
    brandGroups: true,        // show Core Ultra / Core sub-headings inside a block
    filters: [
      { label: 'Series / Gen', key: 'gen', tags: [
        ['Series 3', '#38bdf8'], ['Series 2', '#0ea5e9'], ['Series 1', '#6366f1'],
        ['14th Gen', '#fb923c'], ['13th Gen', '#f59e0b'], ['12th Gen', '#eab308'],
        ['11th Gen', '#84cc16'], ['10th Gen', '#22c55e'],
        ['Core X',   '#f43f5e'], ['Atom / N', '#c084fc']
      ]},
      { label: 'Brand', key: 'tier', tags: [
        ['Core Ultra', '#38bdf8'], ['Core', '#fb923c'], ['Core i', '#f59e0b'],
        ['Core X', '#f43f5e'], ['Atom / N', '#c084fc']
      ]},
      { label: 'Segment', key: 'seg', tags: [
        ['Desktop', '#4ade80'], ['Mobile', '#f472b6'], ['Embedded', '#c084fc']
      ]}
    ],
    gens: [
      // ═══ ERA 1 — "Series" branding, Dec 2023 onward ═══════════════════════
      // Intel dropped the "i" and the generation number together. Within each
      // Series, "Ultra" means the newest architecture and plain "Core" means
      // rebadged older silicon — so both live in one block, distinguished by
      // the Brand chip rather than by being split across the timeline.
      { era: 'Series branding', eraNote: 'No generation number. "Ultra" = newest architecture · plain "Core" = rebadged older silicon' },

      { id: 's4', name: 'Core / Core Ultra Series 4', years: '2027', color: '#a855f7',
        note: 'Model numbers 4xx · unreleased', unreleased: true, families: [
        { name: 'Nova Lake', desc: 'Successor to Panther Lake', tier: 'Core Ultra', seg: 'Desktop', si: 'Nova Lake · TBD', n: 0 }
      ]},

      { id: 's3', name: 'Core / Core Ultra Series 3', years: '2026', color: '#38bdf8',
        note: 'Model numbers 3xx · Intel 18A', families: [
        { name: 'Panther Lake-H', desc: 'Core Ultra X7 / X9 — high-power mobile',    tier: 'Core Ultra', seg: 'Mobile', si: 'Panther Lake · Intel 18A', n: 9 },
        { name: 'Panther Lake-U', desc: 'Core Ultra 5 / 7 — thin-and-light',         tier: 'Core Ultra', seg: 'Mobile', si: 'Panther Lake · Intel 18A', n: 6 },
        { name: 'Wildcat Lake',   desc: 'Core 3 / 5 / 7 — entry tier, no "Ultra"',   tier: 'Core',       seg: 'Mobile', si: 'Wildcat Lake · Intel 18A', n: 0 }
      ]},

      { id: 's2', name: 'Core / Core Ultra Series 2', years: '2024 – 2025', color: '#0ea5e9',
        note: 'Model numbers 2xx · desktop makes the jump to Core Ultra here', families: [
        { name: 'Arrow Lake-S',          desc: 'Core Ultra 200S desktop, LGA 1851',   tier: 'Core Ultra', seg: 'Desktop', si: 'Arrow Lake · TSMC N3B', n: 20 },
        { name: 'Arrow Lake-S Refresh',  desc: 'Core Ultra 200S Plus, March 2026',    tier: 'Core Ultra', seg: 'Desktop', si: 'Arrow Lake · TSMC N3B', n: 3 },
        { name: 'Arrow Lake-HX',         desc: 'Core Ultra 200HX enthusiast mobile',  tier: 'Core Ultra', seg: 'Mobile',  si: 'Arrow Lake · TSMC N3B', n: 7 },
        { name: 'Arrow Lake-HX Refresh', desc: 'Core Ultra 200HX Plus',               tier: 'Core Ultra', seg: 'Mobile',  si: 'Arrow Lake · TSMC N3B', n: 2 },
        { name: 'Arrow Lake-H',          desc: 'Core Ultra 200H performance mobile',  tier: 'Core Ultra', seg: 'Mobile',  si: 'Arrow Lake · TSMC N3B', n: 5 },
        { name: 'Arrow Lake-U',          desc: 'Core Ultra 200U low-power mobile',    tier: 'Core Ultra', seg: 'Mobile',  si: 'Meteor Lake derived · Intel 3', n: 4 },
        { name: 'Lunar Lake',            desc: 'Core Ultra 200V — on-package LPDDR5X', tier: 'Core Ultra', seg: 'Mobile', si: 'Lunar Lake · TSMC N3B', n: 9 },
        { name: 'Raptor Lake-H Refresh', desc: 'Core 200H — no "Ultra", 45 W',        tier: 'Core',       seg: 'Mobile',  si: 'Raptor Lake · Intel 7', n: 0 },
        { name: 'Raptor Lake-U Refresh', desc: 'Core 200U — no "Ultra", 15 W',        tier: 'Core',       seg: 'Mobile',  si: 'Raptor Lake · Intel 7', n: 2 }
      ]},

      { id: 's1', name: 'Core / Core Ultra Series 1', years: '2023 – 2024', color: '#6366f1',
        note: 'Model numbers 1xx · first parts to drop the "i"', families: [
        { name: 'Meteor Lake-H',  desc: 'Core Ultra 100H — first chiplet client part', tier: 'Core Ultra', seg: 'Mobile',   si: 'Meteor Lake · Intel 4', n: 9 },
        { name: 'Meteor Lake-U',  desc: 'Core Ultra 100U low-power mobile',            tier: 'Core Ultra', seg: 'Mobile',   si: 'Meteor Lake · Intel 4', n: 11 },
        { name: 'Meteor Lake-PS', desc: 'Embedded / edge variant',                     tier: 'Core Ultra', seg: 'Embedded', si: 'Meteor Lake · Intel 4', n: 0 },

        { name: 'Raptor Lake-U Refresh (1xx)', desc: 'Core 3 100U / 5 120U / 7 150U — no "Ultra"', tier: 'Core', seg: 'Mobile', si: 'Raptor Lake · Intel 7', n: 0 }
      ]},

      // ═══ ERA 2 — numbered generations, ending at 14th Gen ═════════════════
      { era: 'Numbered generations', eraNote: '"Core i3 / i5 / i7 / i9" — retired after 14th Gen' },

      { id: 'g14', name: '14th Gen', years: '2023 – 2024', color: '#fb923c',
        note: 'Raptor Lake Refresh — the last "Core i" parts', families: [
        { name: 'Raptor Lake-S Refresh',  desc: 'Core i5 / i7 / i9 desktop, LGA 1700', tier: 'Core i', seg: 'Desktop', si: 'Raptor Lake · Intel 7', n: 23 },
        { name: 'Raptor Lake-HX Refresh', desc: 'Core i7 / i9 enthusiast mobile',      tier: 'Core i', seg: 'Mobile',  si: 'Raptor Lake · Intel 7', n: 0 }
      ]},
      { id: 'g13', name: '13th Gen', years: '2022 – 2023', color: '#f59e0b',
        note: 'Raptor Lake', families: [
        { name: 'Raptor Lake-S',  desc: 'Core i3 – i9 desktop, LGA 1700', tier: 'Core i', seg: 'Desktop',  si: 'Raptor Lake · Intel 7', n: 23 },
        { name: 'Raptor Lake-HX', desc: 'Enthusiast mobile, desktop die', tier: 'Core i', seg: 'Mobile',   si: 'Raptor Lake · Intel 7', n: 0 },
        { name: 'Raptor Lake-H',  desc: 'Performance mobile 45 W',        tier: 'Core i', seg: 'Mobile',   si: 'Raptor Lake · Intel 7', n: 0 },
        { name: 'Raptor Lake-P',  desc: 'Thin-and-light 28 W',            tier: 'Core i', seg: 'Mobile',   si: 'Raptor Lake · Intel 7', n: 0 },
        { name: 'Raptor Lake-U',  desc: 'Low-power mobile 15 W',          tier: 'Core i', seg: 'Mobile',   si: 'Raptor Lake · Intel 7', n: 0 },
        { name: 'Raptor Lake-PX', desc: 'Embedded / IoT variant',         tier: 'Core i', seg: 'Embedded', si: 'Raptor Lake · Intel 7', n: 0 }
      ]},
      { id: 'g12', name: '12th Gen', years: '2021 – 2022', color: '#eab308',
        note: 'Alder Lake — first hybrid P-core / E-core client part', families: [
        { name: 'Alder Lake-S',  desc: 'Core i3 – i9 desktop, LGA 1700', tier: 'Core i',   seg: 'Desktop',  si: 'Alder Lake · Intel 7', n: 5 },
        { name: 'Alder Lake-HX', desc: 'Enthusiast mobile',              tier: 'Core i',   seg: 'Mobile',   si: 'Alder Lake · Intel 7', n: 0 },
        { name: 'Alder Lake-H',  desc: 'Performance mobile 45 W',        tier: 'Core i',   seg: 'Mobile',   si: 'Alder Lake · Intel 7', n: 0 },
        { name: 'Alder Lake-P',  desc: 'Thin-and-light 28 W',            tier: 'Core i',   seg: 'Mobile',   si: 'Alder Lake · Intel 7', n: 0 },
        { name: 'Alder Lake-U',  desc: 'Low-power mobile 9 / 15 W',      tier: 'Core i',   seg: 'Mobile',   si: 'Alder Lake · Intel 7', n: 0 },
        { name: 'Alder Lake-N',  desc: 'E-core only entry parts',        tier: 'Atom / N', seg: 'Embedded', si: 'Alder Lake · Intel 7', n: 2 }
      ]},
      { id: 'g11', name: '11th Gen', years: '2020 – 2021', color: '#84cc16',
        note: 'Two codenames, one generation — the split the old layout could not express', families: [
        { name: 'Rocket Lake-S',  desc: 'Cypress Cove desktop, LGA 1200',   tier: 'Core i', seg: 'Desktop', si: 'Rocket Lake · 14 nm', n: 4 },
        { name: 'Tiger Lake-H',   desc: 'Willow Cove mobile 45 W',          tier: 'Core i', seg: 'Mobile',  si: 'Tiger Lake · 10 nm SuperFin', n: 0 },
        { name: 'Tiger Lake-H35', desc: 'Ultraportable gaming 35 W',        tier: 'Core i', seg: 'Mobile',  si: 'Tiger Lake · 10 nm SuperFin', n: 0 },
        { name: 'Tiger Lake-U',   desc: 'Thin-and-light 15 / 28 W',         tier: 'Core i', seg: 'Mobile',  si: 'Tiger Lake · 10 nm SuperFin', n: 0 }
      ]},
      { id: 'g10', name: '10th Gen', years: '2019 – 2020', color: '#22c55e',
        note: 'Comet Lake (14 nm) and Ice Lake (10 nm) shipped side by side', families: [
        { name: 'Comet Lake-S', desc: 'Core i3 – i9 desktop, LGA 1200', tier: 'Core i', seg: 'Desktop', si: 'Comet Lake · 14 nm', n: 17 },
        { name: 'Comet Lake-H', desc: 'Performance mobile 45 W',        tier: 'Core i', seg: 'Mobile',  si: 'Comet Lake · 14 nm', n: 0 },
        { name: 'Comet Lake-U', desc: 'Low-power mobile 15 W',          tier: 'Core i', seg: 'Mobile',  si: 'Comet Lake · 14 nm', n: 0 },
        { name: 'Ice Lake-U',   desc: 'Sunny Cove, Iris Plus graphics',  tier: 'Core i', seg: 'Mobile',  si: 'Ice Lake · 10 nm', n: 1 },
        { name: 'Ice Lake-Y',   desc: 'Sunny Cove, 9 W fanless',         tier: 'Core i', seg: 'Mobile',  si: 'Ice Lake · 10 nm', n: 0 }
      ]},

      // ═══ ERA 3 — lines that sit outside both schemes ══════════════════════
      { era: 'Outside the generation scheme', eraNote: 'HEDT and entry lines that never followed the mainstream numbering' },

      { id: 'corex', name: 'Core X-series (HEDT)', years: '2014 – 2019', color: '#f43f5e',
        note: 'Four generations in one block — no ARK codename field to split them', families: [
        { name: 'Cascade Lake-X', desc: 'Core i9-10900X series, X299',     tier: 'Core X', seg: 'Desktop', si: 'Cascade Lake · 14 nm', n: 0 },
        { name: 'Skylake-X',      desc: 'Core i7 / i9 7000 – 9000X, X299', tier: 'Core X', seg: 'Desktop', si: 'Skylake · 14 nm', n: 0 },
        { name: 'Broadwell-E',    desc: 'Core i7 6800K – 6950X, X99',      tier: 'Core X', seg: 'Desktop', si: 'Broadwell · 14 nm', n: 0 },
        { name: 'Haswell-E',      desc: 'Core i7 5820K – 5960X, X99',      tier: 'Core X', seg: 'Desktop', si: 'Haswell · 22 nm', n: 0 }
      ]},
      { id: 'atomn', name: 'Atom / N-series', years: '2017 – 2025', color: '#c084fc',
        note: 'Entry client and embedded', families: [
        { name: 'Twin Lake',   desc: 'N-series refresh, 2024',     tier: 'Atom / N', seg: 'Embedded', si: 'Alder Lake-N derived', n: 2 },
        { name: 'Jasper Lake', desc: 'Pentium Silver / Celeron N', tier: 'Atom / N', seg: 'Embedded', si: 'Tremont · 10 nm', n: 0 },
        { name: 'Gemini Lake', desc: 'Entry mobile and mini-PC',   tier: 'Atom / N', seg: 'Embedded', si: 'Goldmont Plus · 14 nm', n: 0 }
      ]}
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  GRAPHICS — placeholder, structure not agreed yet
  // ─────────────────────────────────────────────────────────────────────────
  graphics: {
    title: 'Intel Graphics',
    blurb: 'Discrete · workstation · data center',
    brandGroups: true,
    filters: [
      { label: 'Architecture', key: 'gen', tags: [
        ['Xe-HPC — Ponte Vecchio', '#fbbf24'], ['Xe-HPG — Flex Series', '#f59e0b'],
        ['Xe2 — Battlemage', '#38bdf8'], ['Xe-HPG — Alchemist', '#6366f1']
      ]},
      { label: 'Brand', key: 'tier', tags: [
        ['Data Center', '#fbbf24'], ['Arc Pro', '#34d399'], ['Arc', '#4ade80']
      ]},
      { label: 'Segment', key: 'seg', tags: [
        ['HPC / AI', '#fbbf24'], ['Media / VDI', '#f472b6'],
        ['Workstation', '#34d399'], ['Consumer', '#4ade80']
      ]}
    ],
    gens: [
      // Generation-first WITHIN an era, datacenter-first ACROSS eras. ARK groups
      // Arc / Arc Pro / Data Center as three top-level menus, which hides that Flex
      // is Alchemist silicon — the same ACM-G10 / G11 dies as the A-series. Ordering
      // by architecture inside each era keeps that relationship visible while still
      // honouring the datacenter-first golden rule at the top level.
      { era: 'Data center', eraNote: 'HPC, AI and media acceleration — the parts this dashboard exists for' },

      { id: 'xehpc', name: 'Xe-HPC — Ponte Vecchio', years: '2022 – 2024', color: '#fbbf24',
        note: 'Max Series · HBM2e · a separate architecture, not a variant of the gaming line', families: [
        { name: 'Data Center GPU Max 1550', desc: 'OAM — 128 Xe-cores, 128 GB HBM2e, 600 W', tier: 'Data Center', seg: 'HPC / AI', si: 'Ponte Vecchio · Intel 7 + TSMC', n: 0 },
        { name: 'Data Center GPU Max 1350', desc: 'OAM — 112 Xe-cores, 96 GB, 450 W (withdrawn)', tier: 'Data Center', seg: 'HPC / AI', si: 'Ponte Vecchio · Intel 7 + TSMC', n: 0 },
        { name: 'Data Center GPU Max 1100', desc: 'PCIe — 56 Xe-cores, 48 GB HBM2e, 300 W', tier: 'Data Center', seg: 'HPC / AI', si: 'Ponte Vecchio · Intel 7 + TSMC', n: 0 }
      ]},

      { id: 'flex', name: 'Xe-HPG — Flex Series', years: '2022 – 2023', color: '#f59e0b',
        note: 'Arctic Sound-M · media / VDI · the same DG2 silicon as the Arc A-series', families: [
        { name: 'Data Center Flex 170', desc: 'ATS-M150 — 32 Xe-cores, 16 GB, 150 W', tier: 'Data Center', seg: 'Media / VDI', si: 'ACM-G10 · TSMC N6', n: 0 },
        { name: 'Data Center Flex 140', desc: 'ATS-M75 — dual GPU, 75 W, AV1',        tier: 'Data Center', seg: 'Media / VDI', si: 'ACM-G11 ×2 · TSMC N6', n: 0 }
      ]},

      // ═══ Client and workstation discrete ═════════════════════════════════
      { era: 'Workstation and consumer', eraNote: 'Discrete Arc — newest architecture first' },

      { id: 'xe2', name: 'Xe2 — Battlemage', years: '2024 – 2025', color: '#38bdf8',
        note: 'B-series · TSMC N5 · no B770 — the high end went to Arc Pro B60', families: [
        { name: 'Arc Pro B60',  desc: '24 GB, PCIe 5.0 — dual-GPU 48 GB variant',  tier: 'Arc Pro', seg: 'Workstation', si: 'BMG-G21 · TSMC N5', n: 0 },
        { name: 'Arc Pro B50',  desc: '16 GB ECC, 70 W, low-profile',              tier: 'Arc Pro', seg: 'Workstation', si: 'BMG-G21 · TSMC N5', n: 0 },
        { name: 'Arc B580',     desc: '20 Xe-cores, 12 GB — $249 launch',          tier: 'Arc',     seg: 'Consumer',    si: 'BMG-G21 · TSMC N5', n: 0 },
        { name: 'Arc B570',     desc: '18 Xe-cores, 10 GB — $219 launch',          tier: 'Arc',     seg: 'Consumer',    si: 'BMG-G21 · TSMC N5', n: 0 }
      ]},

      { id: 'xehpg', name: 'Xe-HPG — Alchemist', years: '2022 – 2023', color: '#6366f1',
        note: 'A-series · TSMC N6 · Data Center Flex above is the same silicon', families: [
        { name: 'Arc Pro A-series',    desc: 'Pro A60 / A50 / A40 / A16 workstation', tier: 'Arc Pro', seg: 'Workstation', si: 'ACM-G10 / G11 · TSMC N6', n: 0 },
        { name: 'Arc A-series',        desc: 'A770 / A750 / A580 / A380 / A310',      tier: 'Arc',     seg: 'Consumer',    si: 'ACM-G10 / G11 · TSMC N6', n: 0 },
        { name: 'Arc A-series Mobile', desc: 'A770M / A730M / A550M / A370M',         tier: 'Arc',     seg: 'Consumer',    si: 'ACM-G10 / G11 · TSMC N6', n: 0 }
      ]}
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════════════════

let v2Tab = 'xeon';
const v2Expanded = new Set();       // generation ids currently open
const v2Active = {};                // { filterKey: Set(tag) } — empty set = no constraint
let v2Search = '';
let v2Core = null;   // core-range state for the active sub-tab

// escHtml() comes from script.js, which loads first. slug() is v2-only.
const v2Slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ═══════════════════════════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════════════════════════
// Same contract as the production page: build the whole DOM once, stamp the
// filter dimensions as data attributes, then filter by toggling `.hidden`.
// Never re-render on a keystroke.

/** Swap sub-tab: resets filters and rebuilds everything below the tab bar. */
async function v2Switch(tab) {
  v2Tab = tab;
  v2Expanded.clear();
  v2Search = '';
  dom.searchInput.value = '';
  for (const k of Object.keys(v2Active)) delete v2Active[k];

  document.querySelectorAll('.v2-subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));

  await v2LoadSpecs(tab);   // stops come from the specs, so load first
  v2BuildCoreRange();
  v2BuildFilters();
  v2Render();
}

/** Build the multi-select filter bar for the active sub-tab. */
function v2BuildFilters() {
  const cfg = V2_DATA[v2Tab];
  const bar = dom.filterControls;

  // Vertical rail, matching the AMD tab. Each option carries a live count
  // filled in by v2ApplyFilters(); groups over 10 options scroll.
  // Keep `controls` -- the responsive collapse rules target it. Assigning
  // className alone would drop it and break the narrow-screen disclosure.
  bar.className = 'controls filter-bar';
  // Core count leads: it is the filter most used in practice, so it gets
  // the top of the rail ahead of the generation/series chips.
  bar.innerHTML = coreRangeHtml('v2core', v2Core) + cfg.filters.map(g => {
    v2Active[g.key] = v2Active[g.key] || new Set();
    const chips = g.tags.map(([tag, color]) => `
      <button class="fchip" data-key="${g.key}" data-tag="${escHtml(tag)}"
              style="--tag-color:${color}" aria-pressed="false">
        <span class="fchip-dot" style="background:${color}"></span>
        <span class="fchip-label">${escHtml(tag)}</span>
        <span class="fchip-n" aria-hidden="true"></span>
      </button>`).join('');
    const scroll = g.tags.length > 10;
    return `<div class="fgroup">
        <span class="fgroup-label">${escHtml(g.label)}</span>
        <div class="${scroll ? 'fgroup-scroll' : ''}">${chips}</div>
      </div>`;
  }).join('')
    + `<button class="fclear" id="v2Clear" hidden>Clear filters</button>`;

  bar.querySelectorAll('.fchip').forEach(chip =>
    chip.addEventListener('click', () => {
      const set = v2Active[chip.dataset.key];
      set.has(chip.dataset.tag) ? set.delete(chip.dataset.tag) : set.add(chip.dataset.tag);
      v2ApplyFilters();
    }));
  coreRangeWire('v2core', v2Core, v2ApplyFilters);

  document.getElementById('v2Clear').addEventListener('click', () => {
    for (const k of Object.keys(v2Active)) v2Active[k].clear();
    if (v2Core) { v2Core.lo = 0; v2Core.hi = v2Core.stops.length - 1; }
    coreRangePaint('v2core', v2Core);
    v2ApplyFilters();
  });
}

/**
 * Core-range stops for the active Intel sub-tab, derived from loaded specs.
 *
 * Xeon stores no total-core field -- only pc/ec -- so coreTotal() sums them.
 * Client and Graphics have no spec data yet and therefore get no slider; it
 * appears on its own once their import lands.
 */
function v2BuildCoreRange() {
  const specs = V2_SPECS[v2Tab] || {};
  const models = [];
  Object.values(specs).forEach(list => models.push(...list));
  const stops = coreStops(models);
  v2Core = stops.length >= 2 ? coreRangeInit(stops) : null;
}

/** Does this card's core span intersect the selected range? */
function v2CoreOk(card) {
  if (coreRangeIsAll(v2Core)) return true;
  const lo = parseInt(card.dataset.cmin, 10);
  const hi = parseInt(card.dataset.cmax, 10);
  return coreRangeMatch(v2Core, Number.isFinite(lo) ? lo : null,
                                Number.isFinite(hi) ? hi : null);
}

/** Build every generation block and family card for the active sub-tab. */
function v2Render() {
  const cfg = V2_DATA[v2Tab];
  dom.pageHeader.innerHTML =
    `<h1 class="header-intel">${escHtml(stripVendor(cfg.title))}</h1>` +
    `<p>${escHtml(cfg.blurb)}</p>`;

  dom.timeline.innerHTML =
    cfg.gens.map(g => g.era ? v2Era(g) : v2Gen(g, cfg)).join('');

  document.querySelectorAll('.arch-header').forEach(h => {
    h.addEventListener('click', () => v2Toggle(h.dataset.gen));
    h.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v2Toggle(h.dataset.gen); }
    });
  });
  document.querySelectorAll('.sku-card.has-specs').forEach(c => {
    c.addEventListener('click', () => v2ToggleSpecs(c));
    c.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v2ToggleSpecs(c); }
    });
  });

  v2ApplyFilters();
}

/**
 * Branding-era separator. Intel changed naming schemes mid-timeline, so the
 * blocks below one of these are not directly comparable to those above it.
 * Hidden by applyFilters() when every generation it heads is filtered out.
 */
function v2Era(e) {
  return `
  <div class="v2-era" data-era="1">
    <div class="v2-era-label">${escHtml(e.era)}</div>
    <div class="v2-era-note">${escHtml(e.eraNote)}</div>
  </div>`;
}

/** One generation block: timeline dot, header, and its grid of codename cards. */
function v2Gen(g, cfg) {
  // Union the child dimensions onto the block so a block hides when nothing in
  // it survives the filter. This is the half that's easy to forget.
  const tiers = [...new Set(g.families.map(f => f.tier).filter(Boolean))];
  const segs  = [...new Set(g.families.map(f => f.seg).filter(Boolean))];
  const hay   = [g.name, g.note, ...g.families.flatMap(f => [f.name, f.desc, f.si || ''])]
                  .join(' ').toLowerCase();

  // Within a Series, Intel sells two brand lines at once — Core Ultra (newest
  // architecture) and plain Core (rebadged older silicon). Group them under
  // sub-headings so the split is visible in the block, not just in the tags.
  // Only the client tab needs this; Xeon and Graphics render one flat grid.
  // Datacenter-first, per the golden rule in CLAUDE.md — within a block the
  // server/HPC line leads, then workstation, then consumer.
  // Brand-line display order within a block. Datacenter-leaning tiers lead,
  // matching golden rule #2. A tier missing here renders no sub-heading.
  const order = ['P-core', 'E-core', 'Platinum', 'Gold', 'Silver', 'Bronze',
                 'Workstation', 'Embedded',
                 'Core Ultra', 'Core', 'Core i', 'Core X', 'Atom / N',
                 'Data Center', 'Arc Pro', 'Arc'];
  const groupBy = cfg.brandGroups
    ? order.filter(t => g.families.some(f => f.tier === t))
    : [];
  let idx = 0;
  const cards = groupBy.length > 1
    ? groupBy.map(t => {
        const start = idx;
        const rows = g.families.filter(f => f.tier === t)
                       .map(f => v2Card(f, g, idx++, cfg)).join('');
        return `<div class="v2-brandline" style="--card-order:${start * 4 - 2}">` +
               `<span class="v2-brandline-name">${escHtml(t)}</span>` +
               `<span class="v2-brandline-rule"></span></div>${rows}`;
      }).join('')
    : g.families.map((f, i) => v2Card(f, g, i, cfg)).join('');

  // Prefer the real model count once specs are loaded; fall back to the
  // indicative `n` for families still awaiting an ARK export.
  const specs = V2_SPECS[v2Tab] || {};
  const total = g.families.reduce(
    (sum, f) => sum + ((specs[f.name] || []).length || f.n), 0);
  // Header shows the brand mix so the split reads without expanding.
  const mix = groupBy.length > 1
    ? groupBy.map(t => `${g.families.filter(f => f.tier === t).length} ${t}`).join(' · ')
    : `${g.families.length} codename${g.families.length === 1 ? '' : 's'}`;

  return `
  <div class="arch-group" id="v2-${g.id}" style="--arch-color:${g.color}"
       data-gen="${escHtml(g.name)}" data-tiers="${escHtml(tiers.join('|'))}"
       data-segs="${escHtml(segs.join('|'))}" data-search="${escHtml(hay)}">
    <div class="arch-header${g.unreleased ? ' unreleased-arch' : ''}" data-gen="${g.id}"
         role="button" tabindex="0" aria-expanded="false">
      <div class="timeline-dot"></div>
      <div class="arch-name">${escHtml(g.name)}</div>
      <div class="arch-year">${escHtml(g.years)}</div>
      <div class="v2-count">${escHtml(mix)}
        <span class="v2-count-dim">· ${total} models</span></div>
      ${g.unreleased ? '<span class="unreleased-badge">unreleased</span>' : ''}
      <div class="expand-icon">⌄</div>
      <div class="arch-subtitle">${escHtml(g.note)}</div>
    </div>
    <div class="arch-body"><div class="skus-grid">${cards}</div></div>
  </div>`;
}

/** Row count label for a spec-table header. */
function v2Count(name) {
  const n = ((V2_SPECS[v2Tab] || {})[name] || []).length;
  return n ? `${n} model${n === 1 ? '' : 's'}` : 'awaiting data';
}

/**
 * Table body for one card. Falls back to a placeholder row when the codename
 * has no data — unreleased parts and families not yet exported from ARK.
 */
function v2Rows(name, colspan) {
  const models = (V2_SPECS[v2Tab] || {})[name];
  const fields = V2_FIELDS[v2Tab];
  if (!models || !models.length || !fields) {
    return `<tr class="v2-empty-row"><td colspan="${colspan}">` +
           'No spec data yet</td></tr>';
  }
  return models.map(m => '<tr>' + fields.map((f, i) =>
    `<td class="${i === 0 ? 'cpu-model-name' : ''}">${escHtml(m[f] ?? '\u2014')}</td>`
  ).join('') + '</tr>').join('');
}

/** One codename card plus its spec table. */
function v2Card(f, g, i, cfg) {
  const id = `v2t-${g.id}-${v2Slug(f.name)}`;
  const cols = v2Columns(f.tier);
  const tags = [f.tier, f.seg].filter(Boolean).map(t =>
    `<span class="sku-tag">${escHtml(t)}</span>`).join('');

  return `
    <div class="sku-card has-specs" style="--card-order:${i * 4}"
         data-target="${id}" data-tier="${escHtml(f.tier)}" data-seg="${escHtml(f.seg)}"
         data-search="${escHtml((f.name + ' ' + f.desc + ' ' + (f.si || '')).toLowerCase())}"
         data-cmin="${v2Span(f.name)[0] ?? ''}" data-cmax="${v2Span(f.name)[1] ?? ''}"
         role="button" tabindex="0" aria-expanded="false">
      <div class="sku-spec-toggle">specs ▾</div>
      <div class="sku-name">${escHtml(f.name)}</div>
      <div class="sku-desc">${escHtml(f.desc)}</div>
      ${f.si ? `<div class="v2-silicon">${escHtml(f.si)}</div>` : ''}
      <div class="sku-tags">${tags}</div>
    </div>
    <div class="cpu-spec-wrapper" id="${id}" style="--spec-order:${i * 4 + 1}">
      <div class="cpu-spec-overflow">
        <div class="cpu-spec-header">
          <span class="cpu-spec-header-title">${escHtml(f.name)}</span>
          <span class="cpu-spec-header-title v2-await">${v2Count(f.name)}</span>
        </div>
        <table class="cpu-spec-table">
          <thead><tr>${cols.map(c => `<th>${escHtml(c)}</th>`).join('')}</tr></thead>
          <tbody>${v2Rows(f.name, cols.length)}</tbody>
        </table>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTERACTION
// ═══════════════════════════════════════════════════════════════════════════

function v2Toggle(id) {
  const el = document.getElementById(`v2-${id}`);
  const open = el.classList.toggle('expanded');
  v2Expanded[open ? 'add' : 'delete'](id);
  el.querySelector('.arch-header').setAttribute('aria-expanded', String(open));
}

function v2ToggleSpecs(card) {
  const w = document.getElementById(card.dataset.target);
  const open = w.classList.toggle('open');
  card.classList.toggle('selected', open);
  card.setAttribute('aria-expanded', String(open));
}

function v2ExpandAll(open) {
  document.querySelectorAll('.arch-group').forEach(g => {
    g.classList.toggle('expanded', open);
    g.querySelector('.arch-header').setAttribute('aria-expanded', String(open));
  });
  v2Expanded.clear();
  if (open) V2_DATA[v2Tab].gens.filter(g => !g.era).forEach(g => v2Expanded.add(g.id));
}

// ═══════════════════════════════════════════════════════════════════════════
//  FILTER — reads only the data attributes stamped during render
// ═══════════════════════════════════════════════════════════════════════════

/**
 * How many generation blocks would match if `tag` were the only selection in
 * its group? Counted against the other groups' current selections, so the
 * numbers reflect what is actually reachable from here.
 */
/** (min,max) total cores for one Intel family, from its loaded spec rows. */
function v2Span(name) {
  const models = (V2_SPECS[v2Tab] || {})[name] || [];
  const t = coreStops(models);
  return t.length ? [t[0], t[t.length - 1]] : [null, null];
}

function v2CountFor(key, tag) {
  const gens  = key === 'gen'  ? new Set([tag]) : (v2Active.gen  || new Set());
  const tiers = key === 'tier' ? new Set([tag]) : (v2Active.tier || new Set());
  const segs  = key === 'seg'  ? new Set([tag]) : (v2Active.seg  || new Set());
  const q = v2Search.trim().toLowerCase();
  let n = 0;
  document.querySelectorAll('.arch-group').forEach(group => {
    if (gens.size && !gens.has(group.dataset.gen)) return;
    const hit = [...group.querySelectorAll('.sku-card')].some(card =>
      v2CoreOk(card) &&
      (!tiers.size || tiers.has(card.dataset.tier)) &&
      (!segs.size  || segs.has(card.dataset.seg))  &&
      (!q || card.dataset.search.includes(q) || group.dataset.search.includes(q)));
    if (hit) n++;
  });
  return n;
}

function v2ApplyFilters() {
  const sel = k => v2Active[k] || new Set();
  const gens = sel('gen'), tiers = sel('tier'), segs = sel('seg');
  const q = v2Search.trim().toLowerCase();
  const any = gens.size || tiers.size || segs.size || !coreRangeIsAll(v2Core);

  document.querySelectorAll('.fchip').forEach(c => {
    const on = sel(c.dataset.key).has(c.dataset.tag);
    const n = v2CountFor(c.dataset.key, c.dataset.tag);
    c.classList.toggle('active', on);
    // Dim options that would yield nothing given the other groups. Selected
    // options never dim. NOTE this also makes the 12 known-dead Intel chips
    // visibly dim with a 0 count, which is an improvement on silence.
    c.classList.toggle('inactive', !on && n === 0);
    c.setAttribute('aria-pressed', String(on));
    const slot = c.querySelector('.fchip-n');
    if (slot) slot.textContent = n || '';
    const label = (c.querySelector('.fchip-label') || {}).textContent || c.dataset.tag;
    c.setAttribute('aria-label', `${label}, ${n} generations`);
  });
  document.getElementById('v2Clear').hidden = !any;

  const badge = document.getElementById('sidebarCount');
  if (badge) {
    const total = gens.size + tiers.size + segs.size + (coreRangeIsAll(v2Core) ? 0 : 1);
    badge.textContent = total;
    badge.hidden = total === 0;
  }

  let shownGens = 0, shownCards = 0;

  document.querySelectorAll('.arch-group').forEach(group => {
    const genOk = !gens.size || gens.has(group.dataset.gen);
    let visible = 0;

    group.querySelectorAll('.sku-card').forEach(card => {
      const ok = genOk
        && v2CoreOk(card)
        && (!tiers.size || tiers.has(card.dataset.tier))
        && (!segs.size  || segs.has(card.dataset.seg))
        && (!q || card.dataset.search.includes(q) || group.dataset.search.includes(q));
      card.classList.toggle('hidden', !ok);
      // a hidden card must not leave its spec table dangling
      const w = document.getElementById(card.dataset.target);
      if (!ok && w) { w.classList.remove('open'); card.classList.remove('selected'); }
      if (ok) visible++;
    });

    // A brand sub-heading with no visible cards after it is an orphan.
    group.querySelectorAll('.v2-brandline').forEach(bl => {
      let live = false;
      for (let n = bl.nextElementSibling; n && !n.classList.contains('v2-brandline');
           n = n.nextElementSibling) {
        if (n.classList.contains('sku-card') && !n.classList.contains('hidden')) {
          live = true; break;
        }
      }
      bl.classList.toggle('hidden', !live);
    });

    group.classList.toggle('hidden', visible === 0);
    if (visible) { shownGens++; shownCards += visible; }
  });

  // An era heading with no surviving generations under it is an orphan; hide it.
  // Same problem the production page solves for its year separators.
  document.querySelectorAll('.v2-era').forEach(era => {
    let live = false;
    for (let n = era.nextElementSibling; n && !n.classList.contains('v2-era');
         n = n.nextElementSibling) {
      if (n.classList.contains('arch-group') && !n.classList.contains('hidden')) {
        live = true; break;
      }
    }
    era.classList.toggle('hidden', !live);
  });

  document.getElementById('v2Status').textContent =
    `${shownGens} generation${shownGens === 1 ? '' : 's'} · ${shownCards} codename${shownCards === 1 ? '' : 's'}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════
// switchVendor() in script.js calls v2Activate() when Intel is selected and
// v2Deactivate() when leaving. Both renderers share one set of DOM nodes, so
// exactly one must own them at a time.

let v2Wired = false;

/** Take over the shared DOM and render the Intel tab. */
function v2Activate() {
  document.body.classList.add('intel-v2');
  document.getElementById('v2Subtabs').classList.add('visible');
  document.getElementById('v2Status').hidden = false;
  document.getElementById('v2NoData').hidden = false;
  // AMD-only chrome that has no meaning here
  dom.codenameTableWrap.innerHTML = '';
  dom.techTabs.classList.remove('visible');
  dom.clearSelectionsBtn.hidden = true;

  if (!v2Wired) {
    document.querySelectorAll('.v2-subtab').forEach(b =>
      b.addEventListener('click', () => v2Switch(b.dataset.tab)));
    v2Wired = true;
  }

  v2Tab = 'xeon';
  v2Expanded.clear();
  v2Search = '';
  for (const k of Object.keys(v2Active)) delete v2Active[k];
  document.querySelectorAll('.v2-subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === 'xeon'));

  // Specs must load BEFORE the filters are built: the core-range stops are
  // derived from the loaded models, so building first yields an empty slider.
  v2LoadSpecs(v2Tab).then(() => {
    v2BuildCoreRange();
    v2BuildFilters();
    v2Render();
  });
}

/** Hand the shared DOM back to the AMD renderer. */
function v2Deactivate() {
  document.body.classList.remove('intel-v2');
  document.getElementById('v2Subtabs').classList.remove('visible');
  document.getElementById('v2Status').hidden = true;
  document.getElementById('v2NoData').hidden = true;
  dom.clearSelectionsBtn.hidden = false;
}

/** Search box handler — called by the shared input in script.js. */
function v2SetSearch(value) {
  v2Search = value;
  v2ApplyFilters();
}

/** True when the Intel renderer currently owns the DOM. */
function v2IsActive() {
  return document.body.classList.contains('intel-v2');
}
