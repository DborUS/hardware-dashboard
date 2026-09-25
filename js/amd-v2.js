// ═══════════════════════════════════════════════════════════════════════════
//  AMD v2 — product-first renderer            *** GENERATED FILE ***
//  ---------------------------------------------------------------------------
//  Regenerate with tools/gen-amd-v2.py. Hand edits will be overwritten.
//
//  Drives the AMD vendor tab, mirroring js/intel-v2.js:
//
//     SUB-TAB   (EPYC | Ryzen | GPU)     <- also picks the spec-table columns
//       SERIES     (EPYC 9005, Ryzen AI 400, Instinct MI350)   <- timeline block
//         CODENAME (Turin, Gorgon Point, MI355X)               <- SKU card
//           spec table
//
//  Organised by PRODUCT NAME, not by Zen generation. A customer asks for an
//  EPYC 9005 or a Ryzen AI 400, not for "a Zen 5 part" — and the Zen
//  generation is still on every card, so nothing is lost.
//
//  Why product-series-first is the correct nesting: several codenames span two
//  series. Phoenix ships as both Ryzen 7000 and Ryzen 8000; Dragon Range spans
//  7000 and 8000. Nesting series -> codename lets a codename appear under each
//  series that actually sells it, which codename-first cannot express.
//
//  Ordering follows golden rule #2: datacenter -> workstation -> desktop ->
//  mobile -> handheld, flagship first within a tier.
// ═══════════════════════════════════════════════════════════════════════════

'use strict';

const A2_COLUMNS = {
  epyc:  ['Model', 'Cores', 'Threads', 'Base', 'Boost', 'L3 Cache', 'TDP',
          'Socket', 'Sockets', 'PCIe', 'Memory', '1kU Price', 'Product ID'],
  ryzen: ['Model', 'Cores', 'Threads', 'Base', 'Boost', 'L3 Cache', 'TDP',
          'Socket', 'GPU Model', 'GPU CUs', 'GPU Freq', 'Product ID'],
  gpu:   ['Model', 'Form', 'Architecture', 'Process', 'CUs', 'Memory', 'Type',
          'Bandwidth', 'FP32', 'FP32 Matrix', 'PCIe', 'TBP']
};

const A2_FIELDS = {
  epyc:  ['n', 'c', 't', 'bas', 'bst', 'l3', 'tdp', 'sk', 'skc', 'pcie', 'mem', 'pr', 'tr'],
  ryzen: ['n', 'c', 't', 'bas', 'bst', 'l3', 'tdp', 'sk', 'gm', 'gc', 'gf', 'tr'],
  gpu:   ['name', 'form', 'arch', 'process', 'cu', 'mem', 'memType', 'bw',
          'fp32', 'fp32m', 'pcie', 'tbp']
};

const A2_DATA = {

  // ─────────────────────────────────────────────────────────────────────────
  //  EPYC — server, by product series
  // ─────────────────────────────────────────────────────────────────────────
  epyc: {
    title: 'AMD EPYC',
    blurb: 'Data center processors',
    filters: [
      { label: 'Series', key: 'gen', tags: [
        ["EPYC 9006 Series", '#ec4899'],
        ["EPYC 9005 Series", '#ef4444'],
        ["EPYC 9004 / 8004 Series", '#f97316'],
        ["EPYC 7003 Series", '#84cc16'],
        ["EPYC 7002 Series", '#14b8a6'],
        ["EPYC 7001 Series", '#c084fc'],
        ["EPYC 4005 Series", '#e7654f'],
        ["EPYC 8005 Series", '#e7654f'],
        ["EPYC 4004 Series", '#e7654f'],
        ["Opteron X2100 Series APU", '#e7654f'],
        ["Opteron X1100 Series", '#e7654f'],
        ["Opteron 6300 Series", '#e7654f'],
        ["Opteron 4300 Series", '#e7654f'],
        ["Opteron 3300 Series", '#e7654f'],
        ["Opteron 6200 Series", '#e7654f'],
        ["Opteron 4200 Series", '#e7654f'],
        ["Opteron 3200 Series", '#e7654f'],
        ["Opteron 6100 Series", '#e7654f'],
        ["EPYC Embedded 4005 Series", '#e7654f'],
        ["EPYC Embedded 3000 Series", '#e7654f'],
      ]},
      { label: 'Socket', key: 'seg', tags: [
        ['SP7', '#f97316'], ['SP8', '#fb923c'], ['SP5', '#ef4444'],
        ['SP6', '#f59e0b'], ['SP3', '#a78bfa']
      ]}
    ],
    gens: [
      { era: "SP7 / SP8 platform", eraNote: "Zen 6 — up to 8000 MT/s, PCIe 6.0" },
      { id: 'epyc9006', name: "EPYC 9006 Series", years: '2026', color: '#ec4899',
        note: "Venice · Zen 6 · SP7 / SP8", families: [
        { name: "Venice SP7", desc: "Zen 6 — 9 models", seg: 'SP7', si: "Zen 6", n: 9, cmin: 64, cmax: 256 },
        { name: "Venice SP8", desc: "Zen 6 — 22 models", seg: 'SP8', si: "Zen 6", n: 22, cmin: 8, cmax: 128 },
      ]},
      { era: "SP5 / SP6 platform", eraNote: "Zen 4 and Zen 5 — up to 6400 MT/s, PCIe 5.0" },
      { id: 'epyc9005', name: "EPYC 9005 Series", years: '2024', color: '#ef4444',
        note: "Turin · Zen 5 / Zen 5c · SP5", families: [
        { name: "Turin", desc: "Zen 5 — 39 models", seg: 'SP5', si: "Zen 5", n: 39, cmin: 8, cmax: 192 },
        { name: "Turin Dense", desc: "Zen 5 — 5 models", seg: 'SP5', si: "Zen 5", n: 5, cmin: 96, cmax: 192 },
      ]},
      { id: 'epyc9004', name: "EPYC 9004 / 8004 Series", years: '2022 – 2023', color: '#f97316',
        note: "Genoa · Bergamo · Siena · Zen 4 / Zen 4c · SP5 / SP6", families: [
        { name: "Genoa", desc: "Zen 4 — 29 models", seg: 'SP5', si: "Zen 4", n: 29, cmin: 16, cmax: 96 },
        { name: "Genoa-X", desc: "Zen 4 — 3 models", seg: 'SP5', si: "Zen 4", n: 3, cmin: 16, cmax: 96 },
        { name: "Bergamo", desc: "Zen 4 — 3 models", seg: 'SP5', si: "Zen 4", n: 3, cmin: 112, cmax: 128 },
        { name: "Siena", desc: "Zen 4 — 18 models", seg: 'SP6', si: "Zen 4", n: 18, cmin: 8, cmax: 64 },
      ]},
      { era: "SP3 platform", eraNote: "Zen through Zen 3 — up to 3200 MT/s, PCIe 3.0 / 4.0" },
      { id: 'epyc7003', name: "EPYC 7003 Series", years: '2021 – 2022', color: '#84cc16',
        note: "Milan · Zen 3 · SP3", families: [
        { name: "Milan", desc: "Zen 3 — 35 models", seg: 'SP3', si: "Zen 3", n: 35, cmin: 8, cmax: 64 },
        { name: "Milan-X", desc: "Zen 3 — 4 models", seg: 'SP3', si: "Zen 3", n: 4, cmin: 16, cmax: 64 },
      ]},
      { id: 'epyc7002', name: "EPYC 7002 Series", years: '2019', color: '#14b8a6',
        note: "Rome · Zen 2 · SP3", families: [
        { name: "Rome", desc: "Zen 2 — 43 models", seg: 'SP3', si: "Zen 2", n: 43, cmin: 8, cmax: 64 },
      ]},
      { id: 'epyc7001', name: "EPYC 7001 Series", years: '2017', color: '#c084fc',
        note: "Naples · Zen · SP3", families: [
        { name: "Naples", desc: "Zen — 28 models", seg: 'SP3', si: "Zen", n: 28, cmin: 8, cmax: 32 },
      ]},
      { id: 'epyc4005series', name: "EPYC 4005 Series", years: '2025', color: '#e7654f',
        note: "EPYC 4005 Series — 6 models", families: [
        { name: "Grado", desc: " — 12 models", seg: 'AM5', si: "", n: 12, cmin: 6, cmax: 16 },
      ]},
      { id: 'epyc8005series', name: "EPYC 8005 Series", years: '2026', color: '#e7654f',
        note: "EPYC 8005 Series — 7 models", families: [
        { name: "Sorano", desc: " — 7 models", seg: 'SP6', si: "", n: 7, cmin: 8, cmax: 84 },
      ]},
      { id: 'epyc4004series', name: "EPYC 4004 Series", years: '', color: '#e7654f',
        note: "EPYC 4004 Series — 8 models", families: [
        { name: "Raphael", desc: "Zen 4 — 14 models", seg: 'AM5', si: "Zen 4", n: 14, cmin: 4, cmax: 16 },
      ]},
      { id: 'opteronx2100seriesapu', name: "Opteron X2100 Series APU", years: '', color: '#e7654f',
        note: "Opteron X2100 Series APU — 2 models", families: [
        { name: "Kyoto", desc: " — 3 models", seg: 'FT3', si: "", n: 3, cmin: 4, cmax: 4 },
      ]},
      { id: 'opteronx1100series', name: "Opteron X1100 Series", years: '', color: '#e7654f',
        note: "Opteron X1100 Series — 1 models", families: [
        { name: "Kyoto", desc: " — 3 models", seg: 'FT3', si: "", n: 3, cmin: 4, cmax: 4 },
      ]},
      { id: 'opteron6300series', name: "Opteron 6300 Series", years: '', color: '#e7654f',
        note: "Opteron 6300 Series — 12 models", families: [
        { name: "Abu Dhabi", desc: " — 10 models", seg: 'G34', si: "", n: 10, cmin: 4, cmax: 16 },
        { name: "Warsaw", desc: " — 2 models", seg: 'G34', si: "", n: 2, cmin: 12, cmax: 16 },
      ]},
      { id: 'opteron4300series', name: "Opteron 4300 Series", years: '', color: '#e7654f',
        note: "Opteron 4300 Series — 7 models", families: [
        { name: "Seoul", desc: " — 7 models", seg: 'C32', si: "", n: 7, cmin: 6, cmax: 8 },
      ]},
      { id: 'opteron3300series', name: "Opteron 3300 Series", years: '', color: '#e7654f',
        note: "Opteron 3300 Series — 4 models", families: [
        { name: "Delhi", desc: " — 4 models", seg: 'AM3+', si: "", n: 4, cmin: 4, cmax: 8 },
      ]},
      { id: 'opteron6200series', name: "Opteron 6200 Series", years: '', color: '#e7654f',
        note: "Opteron 6200 Series — 12 models", families: [
        { name: "Interlagos", desc: " — 12 models", seg: 'G34', si: "", n: 12, cmin: 4, cmax: 16 },
      ]},
      { id: 'opteron4200series', name: "Opteron 4200 Series", years: '', color: '#e7654f',
        note: "Opteron 4200 Series — 11 models", families: [
        { name: "Valencia", desc: " — 11 models", seg: 'C32', si: "", n: 11, cmin: 6, cmax: 8 },
      ]},
      { id: 'opteron3200series', name: "Opteron 3200 Series", years: '', color: '#e7654f',
        note: "Opteron 3200 Series — 3 models", families: [
        { name: "Zurich", desc: " — 3 models", seg: 'AM3+', si: "", n: 3, cmin: 4, cmax: 8 },
      ]},
      { id: 'opteron6100series', name: "Opteron 6100 Series", years: '', color: '#e7654f',
        note: "Opteron 6100 Series — 5 models", families: [
        { name: "Magny-Cours", desc: " — 5 models", seg: 'G34', si: "", n: 5, cmin: 8, cmax: 12 },
      ]},
      { id: 'epycembedded4005series', name: "EPYC Embedded 4005 Series", years: '', color: '#e7654f',
        note: "EPYC Embedded 4005 Series — 6 models", families: [
        { name: "Grado", desc: " — 12 models", seg: 'AM5', si: "", n: 12, cmin: 6, cmax: 16 },
      ]},
      { id: 'epycembedded3000series', name: "EPYC Embedded 3000 Series", years: '', color: '#e7654f',
        note: "EPYC Embedded 3000 Series — 7 models", families: [
        { name: "Snowy Owl", desc: " — 7 models", seg: 'BGA', si: "", n: 7, cmin: 4, cmax: 16 },
      ]},
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  RYZEN — client, by product series
  // ─────────────────────────────────────────────────────────────────────────
  ryzen: {
    title: 'AMD Ryzen',
    blurb: 'Desktop · mobile · workstation · handheld',
    brandGroups: true,
    codenameFilter: true,
    filters: [
      { label: 'Series', key: 'gen', tags: [
        ["Ryzen AI 400 Series", '#ec4899'],
        ["Ryzen AI 300 / Max 300 Series", '#ef4444'],
        ["Ryzen Threadripper 9000 Series", '#f59e0b'],
        ["Ryzen 9000 Series", '#f97316'],
        ["Ryzen Threadripper 7000 Series", '#fbbf24'],
        ["Ryzen 8000 Series", '#eab308'],
        ["Ryzen 7000 Series", '#a3e635'],
        ["Ryzen 6000 Series", '#84cc16'],
        ["Ryzen Threadripper 5000 Series", '#22c55e'],
        ["Ryzen 5000 Series", '#14b8a6'],
        ["Ryzen Threadripper 3000 Series", '#06b6d4'],
        ["Ryzen 4000 Series", '#0ea5e9'],
        ["Ryzen 3000 Series", '#6366f1'],
        ["Ryzen Threadripper 2000 Series", '#818cf8'],
        ["Ryzen 2000 Series", '#a78bfa'],
        ["Ryzen Threadripper 1000 Series", '#c084fc'],
        ["Ryzen 1000 Series", '#d8b4fe'],
        ["Ryzen Z-Series (Handheld)", '#22d3ee'],
        ["Ryzen 200 / 100 Series", '#94a3b8'],
        ["A-Series", '#e7654f'],
        ["PRO A-Series", '#e7654f'],
        ["Athlon", '#e7654f'],
        ["Ryzen PRO", '#e7654f'],
        ["Ryzen", '#e7654f'],
        ["FX-Series", '#e7654f'],
        ["Sempron", '#e7654f'],
        ["Phenom", '#e7654f'],
        ["AMD", '#e7654f'],
        ["E-Series", '#e7654f'],
        ["Ryzen Embedded", '#e7654f'],
        ["Embedded R-Series", '#e7654f'],
        ["Embedded G-Series", '#e7654f'],
      ]},
      { label: 'Brand', key: 'tier', tags: [
        ['Threadripper', '#f59e0b'], ['Ryzen AI Max', '#06b6d4'],
        ['Ryzen AI', '#22d3ee'], ['Ryzen', '#f97316'], ['Z-Series', '#a78bfa']
      ]},
      { label: 'Segment', key: 'seg', tags: [
        ['Workstation', '#f59e0b'], ['Desktop', '#4ade80'],
        ['Mobile', '#f472b6'], ['Handheld', '#22d3ee']
      ]}
    ],
    gens: [
      { era: "Ryzen AI branding", eraNote: "Copilot+ era — the \"AI\" name replaces a plain series number" },
      { id: 'rai400', name: "Ryzen AI 400 Series", years: '2026', color: '#ec4899',
        note: "Gorgon Point · Zen 5 + XDNA 2 · Copilot+", families: [
        { name: "Gorgon Point", key: "Gorgon Point", series: ["Ryzen 400 Series", "Ryzen AI 400 Series", "Ryzen AI PRO 400 Series"], desc: "Zen 5 — 15 models", tier: 'Ryzen AI', seg: 'Mobile', si: "Zen 5", n: 15, cmin: 4, cmax: 12 },
      ]},
      { id: 'rai300', name: "Ryzen AI 300 / Max 300 Series", years: '2024 – 2025', color: '#ef4444',
        note: "Strix Point · Strix Halo · Kraken Point · Zen 5 + XDNA 2", families: [
        { name: "Strix Halo", key: "Strix Halo", series: ["Ryzen AI Max 300 Series", "Ryzen AI Max PRO 300 Series"], desc: "Zen 5 — 9 models", tier: 'Ryzen AI Max', seg: 'Mobile', si: "Zen 5", n: 9, cmin: 6, cmax: 16 },
        { name: "Strix Point", key: "Strix Point", series: ["Ryzen AI 300 Series", "Ryzen AI PRO 300 Series"], desc: "Zen 5 — 6 models", tier: 'Ryzen AI', seg: 'Mobile', si: "Zen 5", n: 6, cmin: 8, cmax: 12 },
        { name: "Krackan Point", key: "Krackan Point", series: ["Ryzen AI 300 Series", "Ryzen AI PRO 300 Series"], desc: " — 6 models", tier: 'Ryzen AI', seg: 'Mobile', si: "", n: 6, cmin: 4, cmax: 8 },
      ]},
      { era: "Numbered series", eraNote: "Ryzen 1000 through 9000 and the matching Threadripper lines" },
      { id: 'tr9000', name: "Ryzen Threadripper 9000 Series", years: '2025', color: '#f59e0b',
        note: "Shimada Peak · Zen 5 · sTR5", families: [
        { name: "Shimada Peak", key: "Shimada Peak", series: ["Ryzen Threadripper 9000 Series", "Ryzen Threadripper PRO 9000 WX-Series"], desc: "Zen 5 — 9 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 5", n: 9, cmin: 12, cmax: 96 },
      ]},
      { id: 'r9000', name: "Ryzen 9000 Series", years: '2024 – 2025', color: '#f97316',
        note: "Granite Ridge · Fire Range · Zen 5 · AM5 / FL1", families: [
        { name: "Granite Ridge AM5", key: "Granite Ridge AM5", series: ["Ryzen 9000 Series", "Ryzen PRO 9000 Series"], desc: " — 21 models", tier: 'Ryzen', seg: 'Desktop', si: "", n: 21, cmin: 6, cmax: 16 },
        { name: "Fire Range", key: "Fire Range", series: ["Ryzen 9000 Series"], desc: "Zen 5 — 3 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 5", n: 3, cmin: 12, cmax: 16 },
      ]},
      { id: 'tr7000', name: "Ryzen Threadripper 7000 Series", years: '2023', color: '#fbbf24',
        note: "Storm Peak · Zen 4 · sTR5", families: [
        { name: "Storm Peak", key: "Storm Peak", series: ["Ryzen Threadripper 7000 Series", "Ryzen Threadripper PRO 7000 WX-Series"], desc: "Zen 4 — 9 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 4", n: 9, cmin: 12, cmax: 96 },
      ]},
      { id: 'r8000', name: "Ryzen 8000 Series", years: '2023 – 2024', color: '#eab308',
        note: "Phoenix · Hawk Point · Dragon Range · Zen 4 · AM5 / FP8", families: [
        { name: "Phoenix", key: "Phoenix", series: ["Ryzen 8000 Series", "Ryzen PRO 8000 Series"], desc: "Zen 4 — 30 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 4", n: 30, cmin: 4, cmax: 8 },
        { name: "Hawk Point", key: "Hawk Point", series: ["Ryzen 8000 Series", "Ryzen PRO 8000 Series"], desc: "Zen 4 — 17 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 4", n: 17, cmin: 4, cmax: 8 },
        { name: "Dragon Range", key: "Dragon Range", series: ["Ryzen 8000 Series"], desc: "Zen 4 — 4 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 4", n: 4, cmin: 8, cmax: 16 },
      ]},
      { id: 'r7000', name: "Ryzen 7000 Series", years: '2022 – 2023', color: '#a3e635',
        note: "Raphael · Dragon Range · Phoenix · Rembrandt-R · Barceló-R · Zen 4 / Zen 3+", families: [
        { name: "Raphael AM5", key: "Raphael AM5", series: ["Ryzen 7000 Series", "Ryzen PRO 7000 Series"], desc: " — 17 models", tier: 'Ryzen', seg: 'Desktop', si: "", n: 17, cmin: 6, cmax: 16 },
        { name: "Rembrandt R", key: "Rembrandt R", series: ["Ryzen 7000 Series", "Ryzen PRO 7000 Series"], desc: " — 12 models", tier: 'Ryzen', seg: 'Mobile', si: "", n: 12, cmin: 4, cmax: 8 },
        { name: "Barcelo R", key: "Barcelo R", series: ["Ryzen 7000 Series", "Ryzen PRO 7000 Series"], desc: " — 7 models", tier: 'Ryzen', seg: 'Mobile', si: "", n: 7, cmin: 4, cmax: 8 },
        { name: "Mendocino", key: "Mendocino", series: ["Ryzen 7000 Series"], desc: "Zen 2 — 4 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 2", n: 4, cmin: 4, cmax: 4 },
      ]},
      { id: 'r6000', name: "Ryzen 6000 Series", years: '2022', color: '#84cc16',
        note: "Rembrandt · Zen 3+ · RDNA 2 iGPU · FP7", families: [
        { name: "Rembrandt", key: "Rembrandt", series: ["Ryzen 6000 Series", "Ryzen PRO 6000 Series"], desc: "Zen 3+ — 19 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 3+", n: 19, cmin: 6, cmax: 8 },
      ]},
      { id: 'tr5000', name: "Ryzen Threadripper 5000 Series", years: '2022', color: '#22c55e',
        note: "Chagall · Zen 3 · sWRX8", families: [
        { name: "Chagall PRO", key: "Chagall PRO", series: ["Ryzen Threadripper PRO 5000 WX-Series"], desc: " — 5 models", tier: 'Threadripper', seg: 'Workstation', si: "", n: 5, cmin: 12, cmax: 64 },
      ]},
      { id: 'r5000', name: "Ryzen 5000 Series", years: '2020 – 2022', color: '#14b8a6',
        note: "Vermeer · Cezanne · Barceló · Lucienne · Zen 3 · AM4", families: [
        { name: "Vermeer", key: "Vermeer", series: ["Ryzen 5000 Series", "Ryzen PRO 5000 Series"], desc: "Zen 3 — 20 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 3", n: 20, cmin: 6, cmax: 16 },
        { name: "Cezanne", key: "Cezanne", series: ["Ryzen 5000 Series", "Ryzen PRO 5000 Series"], desc: "Zen 3 — 44 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 3", n: 44, cmin: 4, cmax: 8 },
        { name: "Barcelo", key: "Barcelo", series: ["Ryzen 5000 Series", "Ryzen PRO 5000 Series"], desc: " — 10 models", tier: 'Ryzen', seg: 'Mobile', si: "", n: 10, cmin: 2, cmax: 8 },
        { name: "Lucienne", key: "Lucienne", series: ["Ryzen 5000 Series"], desc: "Zen 2 — 3 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 2", n: 3, cmin: 4, cmax: 8 },
      ]},
      { id: 'tr3000', name: "Ryzen Threadripper 3000 Series", years: '2019 – 2020', color: '#06b6d4',
        note: "Castle Peak · Zen 2 · sTRX4 / sWRX8", families: [
        { name: "Castle Peak", key: "Castle Peak", series: ["Ryzen Threadripper 3000 Series", "Ryzen Threadripper PRO 3000 WX-Series"], desc: "Zen 2 — 7 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 2", n: 7, cmin: 12, cmax: 64 },
      ]},
      { id: 'r4000', name: "Ryzen 4000 Series", years: '2020', color: '#0ea5e9',
        note: "Renoir · Zen 2 · AM4 / FP6", families: [
        { name: "Renoir", key: "Renoir", series: ["Ryzen 4000 Series", "Ryzen PRO 4000 Series"], desc: "Zen 2 — 34 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 2", n: 34, cmin: 4, cmax: 8 },
      ]},
      { id: 'r3000', name: "Ryzen 3000 Series", years: '2019', color: '#6366f1',
        note: "Matisse · Picasso · Dalí · Zen 2 / Zen+ · AM4", families: [
        { name: "Matisse", key: "Matisse", series: ["Ryzen 3000 Series", "Ryzen PRO 3000 Series"], desc: "Zen 2 — 16 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 2", n: 16, cmin: 4, cmax: 16 },
        { name: "Picasso", key: "Picasso", series: ["Ryzen 3000 Series", "Ryzen PRO 3000 Series"], desc: "Zen+ — 28 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen+", n: 28, cmin: 2, cmax: 4 },
        { name: "Dali", key: "Dali", series: ["Ryzen 3000 Series"], desc: " — 1 models", tier: 'Ryzen', seg: 'Mobile', si: "", n: 1, cmin: 2, cmax: 2 },
      ]},
      { id: 'tr2000', name: "Ryzen Threadripper 2000 Series", years: '2018', color: '#818cf8',
        note: "Colfax · Zen+ · TR4", families: [
        { name: "Colfax", key: "Colfax", series: ["Ryzen Threadripper 2000 Series"], desc: "Zen+ — 4 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen+", n: 4, cmin: 12, cmax: 32 },
      ]},
      { id: 'r2000', name: "Ryzen 2000 Series", years: '2018', color: '#a78bfa',
        note: "Pinnacle Ridge · Raven Ridge · Zen+ / Zen · AM4", families: [
        { name: "Pinnacle Ridge", key: "Pinnacle Ridge", series: ["Ryzen 2000 Series", "Ryzen PRO 2000 Series"], desc: "Zen+ — 11 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen+", n: 11, cmin: 4, cmax: 8 },
        { name: "Raven Ridge", key: "Raven Ridge", series: ["Ryzen 2000 Series", "Ryzen PRO 2000 Series"], desc: "Zen — 21 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen", n: 21, cmin: 2, cmax: 4 },
      ]},
      { id: 'tr1000', name: "Ryzen Threadripper 1000 Series", years: '2017', color: '#c084fc',
        note: "Whitehaven · Zen · TR4", families: [
        { name: "Whitehaven", key: "Whitehaven", series: ["Ryzen Threadripper 1000 Series"], desc: "Zen — 2 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen", n: 2, cmin: 12, cmax: 16 },
      ]},
      { id: 'r1000', name: "Ryzen 1000 Series", years: '2017', color: '#d8b4fe',
        note: "Summit Ridge · Zen · AM4 · the first Ryzen", families: [
        { name: "Summit Ridge", key: "Summit Ridge", series: ["Ryzen 1000 Series", "Ryzen PRO 1000 Series"], desc: "Zen — 14 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen", n: 14, cmin: 4, cmax: 8 },
      ]},
      { era: "Outside the numbering", eraNote: "Z-series handhelds and the 200 / 100 entry refresh" },
      { id: 'rzseries', name: "Ryzen Z-Series (Handheld)", years: '2023 – 2025', color: '#22d3ee',
        note: "Z1 · Z2 · handheld gaming APUs", families: [
        { name: "Z2", key: "Z2", series: ["Ryzen Z2"], desc: "Zen 5 — 5 models", tier: 'Z-Series', seg: 'Handheld', si: "Zen 5", n: 5, cmin: 4, cmax: 8 },
        { name: "Z1", key: "Z1", series: ["Ryzen Z1"], desc: "Zen 4 — 2 models", tier: 'Z-Series', seg: 'Handheld', si: "Zen 4", n: 2, cmin: 6, cmax: 8 },
      ]},
      { id: 'r200', name: "Ryzen 200 / 100 Series", years: '2024 – 2025', color: '#94a3b8',
        note: "Hawk Point Refresh · entry mobile", families: [
        { name: "Hawk Point", key: "Hawk Point", series: ["Ryzen 100 Series", "Ryzen 200 Series", "Ryzen PRO 200 Series"], desc: "Zen 4 — 30 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 4", n: 30, cmin: 4, cmax: 8 },
      ]},
      { id: 'aseries', name: "A-Series", years: '2016 – 2017', color: '#e7654f',
        note: "A-Series — 76 models", families: [
        { name: "Kaveri", key: "Kaveri", series: ["A10-Series APU for Desktops", "A10-Series APU for Laptops", "A4-Series APU for Desktops", "A6-Series APU for Desktops", "A6-Series APU for Laptops", "A8-Series APU for Desktops", "A8-Series APU for Laptops"], desc: " — 18 models", tier: 'A-Series', seg: 'Desktop', si: "", n: 18, cmin: 2, cmax: 4 },
        { name: "Richland", key: "Richland", series: ["A10-Series APU for Desktops", "A10-Series APU for Laptops", "A4-Series APU for Desktops", "A6-Series APU for Desktops", "A6-Series APU for Laptops", "A8-Series APU for Desktops", "Business Class - Dual-Core A6-Series APU for Desktops", "Business Class - Quad-Core A10-Series APU for Desktops", "Business Class - Quad-Core A8-Series APU for Desktops"], desc: " — 18 models", tier: 'A-Series', seg: 'Desktop', si: "", n: 18, cmin: 2, cmax: 4 },
        { name: "Bristol Ridge", key: "Bristol Ridge", series: ["A10-Series APU for Desktops", "A10-Series APU for Laptops", "A12-Series APU for Desktops", "A12-Series APU for Laptops", "A6-Series APU for Desktops", "A8-Series APU for Desktops"], desc: " — 12 models", tier: 'A-Series', seg: 'Desktop', si: "", n: 12, cmin: 2, cmax: 4 },
        { name: "Stoney Ridge", key: "Stoney Ridge", series: ["A4-Series APU for Laptops", "A6-Series APU for Laptops", "A9-Series APU for Laptops"], desc: " — 10 models", tier: 'A-Series', seg: 'Mobile', si: "", n: 10, cmin: 2, cmax: 2 },
        { name: "Carrizo", key: "Carrizo", series: ["A10-Series APU for AIOs", "A10-Series APU for Laptops", "A4-Series APU for Laptops", "A6-Series APU for Laptops", "A8-Series APU for AIOs", "A8-Series APU for Laptops"], desc: " — 8 models", tier: 'A-Series', seg: 'Mobile', si: "", n: 8, cmin: 2, cmax: 4 },
        { name: "Kabini", key: "Kabini", series: ["A4-Series APU for Laptops", "A6-Series APU for Desktops", "A6-Series APU for Laptops"], desc: " — 4 models", tier: 'A-Series', seg: 'Mobile', si: "", n: 4, cmin: 4, cmax: 4 },
        { name: "Beema", key: "Beema", series: ["A4-Series APU for Laptops", "A6-Series APU for Laptops", "A8-Series APU for Laptops"], desc: " — 3 models", tier: 'A-Series', seg: 'Mobile', si: "", n: 3, cmin: 4, cmax: 4 },
        { name: "Godavari", key: "Godavari", series: ["A6-Series APU for Desktops", "A8-Series APU for Desktops"], desc: " — 2 models", tier: 'A-Series', seg: 'Desktop', si: "", n: 2, cmin: 2, cmax: 4 },
        { name: "Mullins", key: "Mullins", series: ["A4-Series APU for Laptops"], desc: " — 1 models", tier: 'A-Series', seg: 'Mobile', si: "", n: 1, cmin: 4, cmax: 4 },
      ]},
      { id: 'proaseries', name: "PRO A-Series", years: '2016 – 2020', color: '#e7654f',
        note: "PRO A-Series — 47 models", families: [
        { name: "Bristol Ridge", key: "Bristol Ridge", series: ["PRO A-Series A10 APU for Desktops", "PRO A-Series A10 APU for Laptops", "PRO A-Series A12 APU for Desktops", "PRO A-Series A12 APU for Laptops", "PRO A-Series A6 APU for Desktops", "PRO A-Series A6 APU for Laptops", "PRO A-Series A8 APU for Desktops", "PRO A-Series A8 APU for Laptops"], desc: " — 15 models", tier: 'PRO A-Series', seg: 'Mobile', si: "", n: 15, cmin: 2, cmax: 4 },
        { name: "Carrizo", key: "Carrizo", series: ["PRO A-Series A10 APU for Desktops", "PRO A-Series A10 APU for Laptops", "PRO A-Series A12 APU for Desktops", "PRO A-Series A12 APU for Laptops", "PRO A-Series A4 APU for Laptops", "PRO A-Series A6 APU for Desktops", "PRO A-Series A6 APU for Laptops", "PRO A-Series A8 APU for Laptops"], desc: " — 14 models", tier: 'PRO A-Series', seg: 'Mobile', si: "", n: 14, cmin: 2, cmax: 4 },
        { name: "Kaveri", key: "Kaveri", series: ["PRO A-Series A10 APU for Desktops", "PRO A-Series A10 APU for Laptops", "PRO A-Series A4 APU for Desktops", "PRO A-Series A6 APU for Desktops", "PRO A-Series A6 APU for Laptops", "PRO A-Series A8 APU for Desktops", "PRO A-Series A8 APU for Laptops"], desc: " — 9 models", tier: 'PRO A-Series', seg: 'Desktop', si: "", n: 9, cmin: 2, cmax: 4 },
        { name: "Godavari", key: "Godavari", series: ["PRO A-Series A10 APU for Desktops", "PRO A-Series A4 APU for Desktops", "PRO A-Series A6 APU for Desktops", "PRO A-Series A8 APU for Desktops"], desc: " — 5 models", tier: 'PRO A-Series', seg: 'Desktop', si: "", n: 5, cmin: 2, cmax: 4 },
        { name: "Stoney Ridge", key: "Stoney Ridge", series: ["PRO A-Series A4 APU for Laptops", "PRO A-Series A6 APU for Laptops"], desc: " — 2 models", tier: 'PRO A-Series', seg: 'Mobile', si: "", n: 2, cmin: 2, cmax: 2 },
        { name: "Richland", key: "Richland", series: ["PRO A-Series A4 APU for Laptops"], desc: " — 1 models", tier: 'PRO A-Series', seg: 'Mobile', si: "", n: 1, cmin: 2, cmax: 2 },
        { name: "Kabini", key: "Kabini", series: ["PRO A-Series A4 APU for Laptops"], desc: " — 1 models", tier: 'PRO A-Series', seg: 'Mobile', si: "", n: 1, cmin: 4, cmax: 4 },
      ]},
      { id: 'athlon', name: "Athlon", years: '2017', color: '#e7654f',
        note: "Athlon — 22 models", families: [
        { name: "Athlon Legacy", key: "Athlon Legacy", series: ["Athlon II X2", "Athlon II X3", "Athlon II X4", "Athlon X4"], desc: " — 19 models", tier: 'Athlon', seg: 'Desktop', si: "", n: 19, cmin: 2, cmax: 4 },
        { name: "Kabini", key: "Kabini", series: ["Athlon 5000 Series"], desc: " — 3 models", tier: 'Athlon', seg: 'Desktop', si: "", n: 3, cmin: 4, cmax: 4 },
      ]},
      { id: 'ryzenpro', name: "Ryzen PRO", years: '2023 – 2026', color: '#e7654f',
        note: "Ryzen PRO — 12 models", families: [
        { name: "Gorgon Point AM5", key: "Gorgon Point AM5", series: ["Ryzen AI PRO 400 Series"], desc: " — 6 models", tier: 'Ryzen PRO', seg: 'Desktop', si: "", n: 6, cmin: 6, cmax: 8 },
        { name: "Gorgon Halo", key: "Gorgon Halo", series: ["Ryzen AI Max PRO 400 Series"], desc: " — 3 models", tier: 'Ryzen PRO', seg: 'Mobile', si: "", n: 3, cmin: 8, cmax: 16 },
        { name: "Raphael", key: "Raphael", series: ["Ryzen PRO 7000 Series"], desc: "Zen 4 — 3 models", tier: 'Ryzen PRO', seg: 'Desktop', si: "Zen 4", n: 3, cmin: 6, cmax: 12 },
      ]},
      { id: 'ryzen', name: "Ryzen", years: '', color: '#e7654f',
        note: "Ryzen — 7 models", families: [
        { name: "Gorgon Point AM5", key: "Gorgon Point AM5", series: ["Ryzen AI 400 Series"], desc: " — 6 models", tier: 'Ryzen', seg: 'Desktop', si: "", n: 6, cmin: 6, cmax: 8 },
        { name: "Barcelo-R", key: "Barcelo-R", series: ["Ryzen 7000 Series"], desc: " — 1 models", tier: 'Ryzen', seg: 'Mobile', si: "", n: 1, cmin: 4, cmax: 4 },
      ]},
      { id: 'fxseries', name: "FX-Series", years: '', color: '#e7654f',
        note: "FX-Series — 30 models", families: [
        { name: "Vishera", key: "Vishera", series: ["FX 4-Core Black Edition Processors", "FX 6-Core Black Edition Processors", "FX 8-Core Black Edition Processors"], desc: " — 17 models", tier: 'FX-Series', seg: 'Desktop', si: "", n: 17, cmin: 4, cmax: 8 },
        { name: "FX Legacy", key: "FX Legacy", series: ["FX 4-Core Black Edition Processors", "FX 6-Core Black Edition Processors", "FX 8-Core Black Edition Processors"], desc: " — 7 models", tier: 'FX-Series', seg: 'Desktop', si: "", n: 7, cmin: 4, cmax: 8 },
        { name: "Bristol Ridge", key: "Bristol Ridge", series: ["FX-Series Processors for Laptops"], desc: " — 2 models", tier: 'FX-Series', seg: 'Mobile', si: "", n: 2, cmin: 4, cmax: 4 },
        { name: "Carrizo", key: "Carrizo", series: ["FX-Series Processors for AIOs", "FX-Series Processors for Laptops"], desc: " — 2 models", tier: 'FX-Series', seg: 'Mobile', si: "", n: 2, cmin: 4, cmax: 4 },
        { name: "Kaveri", key: "Kaveri", series: ["FX-Series Processors for Laptops"], desc: " — 2 models", tier: 'FX-Series', seg: 'Mobile', si: "", n: 2, cmin: 4, cmax: 4 },
      ]},
      { id: 'sempron', name: "Sempron", years: '', color: '#e7654f',
        note: "Sempron — 2 models", families: [
        { name: "Sempron", key: "Sempron", series: ["Sempron Dual-Core APU", "Sempron Quad-Core APU"], desc: " — 2 models", tier: 'Sempron', seg: 'Desktop', si: "", n: 2, cmin: 2, cmax: 4 },
      ]},
      { id: 'phenom', name: "Phenom", years: '', color: '#e7654f',
        note: "Phenom — 27 models", families: [
        { name: "Phenom", key: "Phenom", series: ["Business Class - AMD Phenom X2 Dual-Core", "Business Class - AMD Phenom X3 Triple-Core", "Business Class - AMD Phenom X4 Quad-Core", "Phenom II Black Edition Quad-Core Mobile Processors", "Phenom II Dual-Core Mobile Processors", "Phenom II Quad-Core Mobile Processors", "Phenom II Triple-Core Mobile Processors", "Phenom II X2 Black", "Phenom II X4", "Phenom II X4 Black", "Phenom II X6"], desc: " — 27 models", tier: 'Phenom', seg: 'Desktop', si: "", n: 27, cmin: 2, cmax: 6 },
      ]},
      { id: 'amd', name: "AMD", years: '2020', color: '#e7654f',
        note: "AMD — 1 models", families: [
        { name: "Pollock", key: "Pollock", series: ["AMD 3000 Series"], desc: " — 1 models", tier: 'AMD', seg: 'Mobile', si: "", n: 1, cmin: 2, cmax: 2 },
      ]},
      { id: 'eseries', name: "E-Series", years: '', color: '#e7654f',
        note: "E-Series — 11 models", families: [
        { name: "Kabini", key: "Kabini", series: ["E1-Series APU for Laptops", "E2-Series APU for Laptops"], desc: " — 5 models", tier: 'E-Series', seg: 'Mobile', si: "", n: 5, cmin: 2, cmax: 4 },
        { name: "Beema", key: "Beema", series: ["E1-Series APU for Laptops", "E2-Series APU for Laptops"], desc: " — 2 models", tier: 'E-Series', seg: 'Mobile', si: "", n: 2, cmin: 2, cmax: 4 },
        { name: "Carrizo", key: "Carrizo", series: ["E1-Series APU for Laptops", "E2-Series APU for Laptops"], desc: " — 2 models", tier: 'E-Series', seg: 'Mobile', si: "", n: 2, cmin: 2, cmax: 4 },
        { name: "Stoney Ridge", key: "Stoney Ridge", series: ["E2-Series APU for Laptops"], desc: " — 1 models", tier: 'E-Series', seg: 'Mobile', si: "", n: 1, cmin: 2, cmax: 2 },
        { name: "Mullins", key: "Mullins", series: ["E1-Series APU for Laptops"], desc: " — 1 models", tier: 'E-Series', seg: 'Mobile', si: "", n: 1, cmin: 2, cmax: 2 },
      ]},
      { id: 'ryzenembedded', name: "Ryzen Embedded", years: '', color: '#e7654f',
        note: "Ryzen Embedded — 16 models", families: [
        { name: "Granite Ridge", key: "Granite Ridge", series: ["Ryzen Embedded 9000 Series"], desc: "Zen 5 — 7 models", tier: 'Ryzen Embedded', seg: 'Mobile', si: "Zen 5", n: 7, cmin: 6, cmax: 16 },
        { name: "Great Horned Owl", key: "Great Horned Owl", series: ["Ryzen Embedded V1000 Series"], desc: " — 6 models", tier: 'Ryzen Embedded', seg: 'Mobile', si: "", n: 6, cmin: 2, cmax: 4 },
        { name: "Raphael", key: "Raphael", series: ["Ryzen Embedded 7000 Series"], desc: "Zen 4 — 3 models", tier: 'Ryzen Embedded', seg: 'Mobile', si: "Zen 4", n: 3, cmin: 6, cmax: 12 },
      ]},
      { id: 'embeddedrseries', name: "Embedded R-Series", years: '', color: '#e7654f',
        note: "Embedded R-Series — 11 models", families: [
        { name: "Merlin Falcon", key: "Merlin Falcon", series: ["R-Series SOC"], desc: " — 6 models", tier: 'Embedded R-Series', seg: 'Mobile', si: "", n: 6, cmin: 2, cmax: 4 },
        { name: "Bald Eagle", key: "Bald Eagle", series: ["2nd Generation R-Series APU"], desc: " — 5 models", tier: 'Embedded R-Series', seg: 'Mobile', si: "", n: 5, cmin: 2, cmax: 4 },
      ]},
      { id: 'embeddedgseries', name: "Embedded G-Series", years: '', color: '#e7654f',
        note: "Embedded G-Series — 29 models", families: [
        { name: "G-Series (Jaguar)", key: "G-Series (Jaguar)", series: ["1st Generation G-Series SOC", "2nd Generation G-Series SOC", "3rd Generation G-Series SOC I Family", "3rd Generation G-Series SOC J Family", "G-Series LX SOC"], desc: " — 16 models", tier: 'Embedded G-Series', seg: 'Mobile', si: "", n: 16, cmin: 2, cmax: 4 },
        { name: "Steppe Eagle", key: "Steppe Eagle", series: ["1st Generation G-Series SOC", "2nd Generation G-Series SOC"], desc: " — 7 models", tier: 'Embedded G-Series', seg: 'Mobile', si: "", n: 7, cmin: 2, cmax: 4 },
        { name: "Kabini", key: "Kabini", series: ["1st Generation G-Series SOC", "2nd Generation G-Series SOC"], desc: " — 5 models", tier: 'Embedded G-Series', seg: 'Mobile', si: "", n: 5, cmin: 2, cmax: 4 },
        { name: "Puma", key: "Puma", series: ["2nd Generation G-Series SOC"], desc: " — 1 models", tier: 'Embedded G-Series', seg: 'Mobile', si: "", n: 1, cmin: 4, cmax: 4 },
      ]},
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  GPU — Instinct + Radeon PRO + Radeon, one timeline
  // ─────────────────────────────────────────────────────────────────────────
  // Instinct leads (datacenter-first), then Radeon PRO, then consumer Radeon
  // inline by series number.
  gpu: {
    title: 'AMD Graphics',
    blurb: 'Instinct · Radeon PRO · Radeon',
    brandGroups: true,
    filters: [
      { label: 'Brand', key: 'tier', tags: [
        ['Instinct', '#ef4444'], ['FirePro', '#64748b'],
        ['Radeon PRO', '#818cf8'], ['Radeon', '#10b981']
      ]},
      { label: 'Segment', key: 'seg', tags: [
        ['Data Center', '#ef4444'], ['Workstation', '#818cf8'],
        ['Consumer', '#10b981'], ['Mobile', '#22d3ee']
      ]}
    ],
    gens: [
      { era: 'Instinct — data center', eraNote: 'CDNA accelerators for AI and HPC' },
      { id: 'gpu-instinct-mi400-series-cdna-5', name: "Instinct MI400 Series", years: "2026", color: '#ef4444',
        note: "MI455X · CDNA 5 · HBM4", families: [
        { name: "Instinct MI455X", key: "Instinct MI400 Series (CDNA 5)", desc: "1 models", tier: 'Instinct', seg: 'Data Center', si: "Instinct MI400 Series", n: 1 },
      ]},
      { id: 'gpu-mi300-series-cdna-4', name: "Instinct MI350 Series", years: "2025", color: '#ef4444',
        note: "MI355X · MI350X · CDNA 4 · HBM3E", families: [
        { name: "Instinct MI355X · Instinct MI350X · Instinct MI350P", key: "MI300 Series (CDNA 4)", desc: "3 models", tier: 'Instinct', seg: 'Data Center', si: "CDNA 4", n: 3 },
      ]},
      { id: 'gpu-mi300-series-cdna-3', name: "Instinct MI300 Series", years: "2023–2024", color: '#f97316',
        note: "MI325X · MI300X · MI300A · CDNA 3", families: [
        { name: "Instinct MI325X · Instinct MI300X · Instinct MI300A", key: "MI300 Series (CDNA 3)", desc: "3 models", tier: 'Instinct', seg: 'Data Center', si: "CDNA 3", n: 3 },
      ]},
      { id: 'gpu-mi200-series-cdna-2', name: "Instinct MI200 Series", years: "2021–2022", color: '#f59e0b',
        note: "MI250X · MI250 · MI210 · CDNA 2", families: [
        { name: "Instinct MI250X · Instinct MI250 · Instinct MI210", key: "MI200 Series (CDNA 2)", desc: "3 models", tier: 'Instinct', seg: 'Data Center', si: "CDNA 2", n: 3 },
      ]},
      { id: 'gpu-mi100-cdna', name: "Instinct MI100 Series", years: "2020", color: '#84cc16',
        note: "MI100 · first CDNA part", families: [
        { name: "Instinct MI100", key: "MI100 (CDNA)", desc: "1 models", tier: 'Instinct', seg: 'Data Center', si: "CDNA", n: 1 },
      ]},
      { id: 'gpu-mi50-mi60-vega-7nm', name: "Instinct MI50 / MI60", years: "2018–2020", color: '#14b8a6',
        note: "Vega 7 nm", families: [
        { name: "Instinct MI60 · Instinct MI50 (32GB) · Instinct MI50 (16GB)", key: "MI50/MI60 (Vega 7nm)", desc: "3 models", tier: 'Instinct', seg: 'Data Center', si: "Vega 7nm", n: 3 },
      ]},
      { id: 'gpu-mi25-vega-14nm', name: "Instinct MI25", years: "2017", color: '#818cf8',
        note: "Vega 14 nm", families: [
        { name: "Instinct MI25", key: "MI25 (Vega 14nm)", desc: "1 models", tier: 'Instinct', seg: 'Data Center', si: "Vega 14nm", n: 1 },
      ]},
      { id: 'gpu-mi8-mi6-fiji-polaris', name: "Instinct MI8 / MI6", years: "2016", color: '#c084fc',
        note: "Fiji · Polaris", families: [
        { name: "Instinct MI8 · Instinct MI6", key: "MI8/MI6 (Fiji/Polaris)", desc: "2 models", tier: 'Instinct', seg: 'Data Center', si: "Fiji/Polaris", n: 2 },
      ]},
      { id: 'gpu-firepro-s-series-gcn', name: "FirePro S Series", years: "2012", color: '#64748b',
        note: "Legacy GCN server and compute graphics", families: [
        { name: "FirePro S10000 · FirePro S10000 (Active Cooling) · FirePro S10000 12GB Edition · FirePro S9300 X2 · +12 more", key: "FirePro S Series (GCN)", desc: "16 models", tier: 'FirePro', seg: 'Data Center', si: "FirePro S Series", n: 16 },
      ]},

      { era: 'Radeon PRO — workstation', eraNote: 'Professional visualisation and workstation graphics' },
      { id: 'gpu-ai-pro-r9000-series', name: "Radeon AI PRO R9000 Series", years: "2025", color: '#ef4444',
        note: "3 nm · RDNA 4 · GDDR6 · Up to 32 GB", families: [
        { name: "Radeon AI PRO R9700 · Radeon AI PRO R9700S · Radeon AI PRO R9600 · Radeon AI PRO R9600D", key: "AI PRO R9000 Series", desc: "4 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA 4", n: 4 },
      ]},
      { id: 'gpu-pro-v-series', name: "Radeon PRO V Series", years: "2024", color: '#ef4444',
        note: "TSMC 5nm | 6nm FinFET · RDNA · GDDR6 · Up to 32 GB", families: [
        { name: "Radeon PRO V620 · Radeon PRO V710 · Radeon PRO V520", key: "PRO V Series", desc: "3 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA", n: 3 },
      ]},
      { id: 'gpu-pro-w7000-series', name: "Radeon PRO W7000 Series", years: "2023", color: '#f97316',
        note: "TSMC 5nm GCD 6nm MCD · RDNA 3 · GDDR6 · Up to 48 GB", families: [
        { name: "Radeon PRO W7900 Dual Slot · Radeon PRO W7900 · Radeon PRO W7800 48GB · Radeon PRO W7800 · +5 more", key: "PRO W7000 Series", desc: "9 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA 3", n: 9 },
      ]},
      { id: 'gpu-pro-w6000-series', name: "Radeon PRO W6000 Series", years: "2021", color: '#eab308',
        note: "TSMC 7nm FinFET · RDNA 2 · GDDR6 · Up to 32 GB", families: [
        { name: "Radeon PRO W6800 · Radeon PRO W6600 · Radeon PRO W6400", key: "PRO W6000 Series", desc: "3 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA 2", n: 3 },
      ]},
      { id: 'gpu-pro-w6000-mobile-series', name: "Radeon PRO W6000 Mobile Series", years: "2021", color: '#84cc16',
        note: "TSMC 7nm FinFET · RDNA 2 · GDDR6 · Up to 8 GB", families: [
        { name: "Radeon PRO W6600M · Radeon PRO W6500M · Radeon PRO W6300M", key: "PRO W6000 Mobile Series", desc: "3 models", tier: 'Radeon PRO', seg: 'Mobile', si: "RDNA 2", n: 3 },
      ]},
      { id: 'gpu-pro-vii-series', name: "Radeon PRO VII Series", years: "2020", color: '#3b82f6',
        note: "TSMC 7nm FinFET · Vega 20 · HBM2 · Up to 16 GB", families: [
        { name: "Radeon VII · Radeon Pro VII", key: "PRO VII Series", desc: "2 models", tier: 'Radeon PRO', seg: 'Workstation', si: "Vega 20 (GCN 5th Gen)", n: 2 },
      ]},
      { id: 'gpu-pro-w5000-series', name: "Radeon PRO W5000 Series", years: "2019", color: '#8b5cf6',
        note: "TSMC 7nm FinFET · RDNA · GDDR6 · Up to 8 GB", families: [
        { name: "Radeon Pro W5700 · Radeon Pro W5500", key: "PRO W5000 Series", desc: "2 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA", n: 2 },
      ]},
      { id: 'gpu-pro-w5000-mobile-series', name: "Radeon PRO W5000 Mobile Series", years: "2019", color: '#8b5cf6',
        note: "TSMC 7nm FinFET · RDNA · GDDR6 · Up to 4 GB", families: [
        { name: "Radeon PRO W5500M (Mobile)", key: "PRO W5000 Mobile Series", desc: "1 models", tier: 'Radeon PRO', seg: 'Mobile', si: "RDNA", n: 1 },
      ]},
      { id: 'gpu-pro-wx-x200-series', name: "Radeon PRO WX x200 Series", years: "2018", color: '#ef4444',
        note: "Vega / Polaris · HBM2 / GDDR5 · Up to 8 GB", families: [
        { name: "Radeon Pro WX 8200 · Radeon Pro WX 3200", key: "PRO WX x200 Series", desc: "2 models", tier: 'Radeon PRO', seg: 'Workstation', si: "Vega / Polaris", n: 2 },
      ]},
      { id: 'gpu-pro-series', name: "Radeon PRO Series", years: "2017", color: '#f59e0b',
        note: "Vega / Polaris · Professional graphics · Up to 32 GB", families: [
        { name: "Radeon Pro Duo · Radeon Pro SSG · Radeon Vega Frontier Edition (Liquid-cooled) · Radeon Vega Frontier Edition (Air-cooled)", key: "PRO Series", desc: "4 models", tier: 'Radeon PRO', seg: 'Workstation', si: "Vega / Polaris", n: 4 },
      ]},
      { id: 'gpu-pro-wx-x100-series', name: "Radeon PRO WX x100 Series", years: "2017", color: '#f97316',
        note: "Vega / Polaris · Professional graphics · Up to 16 GB", families: [
        { name: "Radeon Pro WX 9100 · Radeon Pro WX 7100 · Radeon Pro WX 5100 · Radeon Pro WX 4100 · +2 more", key: "PRO WX x100 Series", desc: "6 models", tier: 'Radeon PRO', seg: 'Workstation', si: "Vega / Polaris", n: 6 },
      ]},
      { id: 'gpu-pro-wx-x100-mobile-series', name: "Radeon PRO WX X100 Mobile Series", years: "2017", color: '#f59e0b',
        note: "Polaris · Mobile professional graphics · Up to 8 GB", families: [
        { name: "Radeon PRO WX 4170 (Mobile) · Radeon PRO WX 4150 (Mobile) · Radeon PRO WX 4130 (Mobile) · Radeon PRO WX 3100 (Mobile) · +2 more", key: "PRO WX X100 Mobile Series", desc: "6 models", tier: 'Radeon PRO', seg: 'Mobile', si: "Polaris", n: 6 },
      ]},
      { id: 'gpu-pro-wx-x200-mobile-series', name: "Radeon PRO WX X200 Mobile Series", years: "2017", color: '#f97316',
        note: "Polaris · Mobile professional graphics · Up to 4 GB", families: [
        { name: "Radeon PRO WX 3200 (Mobile)", key: "PRO WX X200 Mobile Series", desc: "1 models", tier: 'Radeon PRO', seg: 'Mobile', si: "Polaris", n: 1 },
      ]},
      { id: 'gpu-firepro-w-series-gcn', name: "Radeon FirePro W Series (GCN)", years: "2012", color: '#64748b',
        note: "Graphics Core Next · legacy professional workstation graphics", families: [
        { name: "FirePro W9100 32GB · FirePro W9100 · FirePro W8100 · FirePro W7100 · +17 more", key: "FirePro W Series (GCN)", desc: "21 models", tier: 'Radeon PRO', seg: 'Workstation', si: "FirePro W Series", n: 21 },
      ]},

      { era: 'Radeon — consumer', eraNote: 'Discrete gaming graphics, newest series first' },
      { id: 'gpu-rx-9000-series', name: "Radeon RX 9000 Series", years: "2025", color: '#ef4444',
        note: "3 nm · RDNA 4 · GDDR6 · Up to 16 GB", families: [
        { name: "Radeon RX 9070 XT · Radeon RX 9070 · Radeon RX 9070 GRE · Radeon RX 9060 XT · +5 more", key: "RX 9000 Series", desc: "9 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA 4", n: 9 },
      ]},
      { id: 'gpu-rx-7000-series', name: "Radeon RX 7000 Series", years: "2022", color: '#f59e0b',
        note: "5/6 nm · RDNA 3 · GDDR6 · Up to 24 GB", families: [
        { name: "Radeon RX 7900 XTX · Radeon RX 7900 XT · Radeon RX 7900 GRE · Radeon RX 7900M · +11 more", key: "RX 7000 Series", desc: "15 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA 3", n: 15 },
      ]},
      { id: 'gpu-rx-6000-series', name: "Radeon RX 6000 Series", years: "2020", color: '#eab308',
        note: "7 nm · RDNA 2 · GDDR6 · Up to 16 GB", families: [
        { name: "Radeon RX 6950 XT · Radeon RX 6900 XT · Radeon RX 6800 XT Midnight Black · Radeon RX 6800 XT · +24 more", key: "RX 6000 Series", desc: "28 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA 2", n: 28 },
      ]},
      { id: 'gpu-rx-5000-series', name: "Radeon RX 5000 Series", years: "2019", color: '#6366f1',
        note: "7 nm · RDNA · GDDR6 · Up to 8 GB", families: [
        { name: "Radeon RX 5700 XT 50th Anniversary · Radeon RX 5700 XT · Radeon RX 5700 · Radeon RX 5600 XT · +8 more", key: "RX 5000 Series", desc: "12 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 12 },
      ]},
      { id: 'gpu-600-series', name: "Radeon 600 Series", years: "2019", color: '#a855f7',
        note: "Polaris / GCN · OEM and mobile graphics · Up to 4 GB", families: [
        { name: "Radeon RX 640 · Radeon 630 · Radeon 625 · Radeon 620 · +1 more", key: "600 Series", desc: "5 models", tier: 'Radeon', seg: 'Consumer', si: "Polaris / GCN", n: 5 },
      ]},
      { id: 'gpu-rx-500x-series', name: "Radeon RX 500X Series", years: "2018", color: '#c084fc',
        note: "Polaris · GCN 4th Gen · GDDR5 · Up to 8 GB", families: [
        { name: "Radeon RX 580X · Radeon RX 570X · Radeon RX 560X · Radeon RX 550X · +3 more", key: "RX 500X Series", desc: "7 models", tier: 'Radeon', seg: 'Consumer', si: "Polaris (GCN 4th Gen)", n: 7 },
      ]},
      { id: 'gpu-500x-series', name: "Radeon 500X Series", years: "2018", color: '#ef4444',
        note: "Polaris / GCN · OEM and mobile graphics · Up to 4 GB", families: [
        { name: "500X Series", key: "500X Series", desc: "0 models", tier: 'Radeon', seg: 'Consumer', si: "Polaris / GCN", n: 0 },
      ]},
      { id: 'gpu-500-series', name: "Radeon 500 Series", years: "2017", color: '#3b82f6',
        note: "Polaris / GCN · OEM and mobile graphics · Up to 4 GB", families: [
        { name: "Radeon RX 540 · Radeon 540 · Radeon 535 · Radeon 530 · +1 more", key: "500 Series", desc: "5 models", tier: 'Radeon', seg: 'Consumer', si: "Polaris / GCN", n: 5 },
      ]},
      { id: 'gpu-rx-vega-series', name: "Radeon RX Vega Series", years: "2017", color: '#6366f1',
        note: "Vega · GCN 5th Gen · HBM2 · Up to 8 GB", families: [
        { name: "Radeon RX Vega 64 Liquid Cooled · Radeon RX Vega 64 · Radeon RX Vega 56", key: "RX Vega Series", desc: "3 models", tier: 'Radeon', seg: 'Consumer', si: "Vega (GCN 5th Gen)", n: 3 },
      ]},
      { id: 'gpu-rx-500-series', name: "Radeon RX 500 Series", years: "2017", color: '#c084fc',
        note: "Polaris · GCN 4th Gen · GDDR5 · Up to 8 GB", families: [
        { name: "Radeon RX 590 · Radeon RX 580 · Radeon RX 580 (OEM) · Radeon RX 570 · +4 more", key: "RX 500 Series", desc: "8 models", tier: 'Radeon', seg: 'Consumer', si: "Polaris (GCN 4th Gen)", n: 8 },
      ]},
      { id: 'gpu-rx-400-series', name: "Radeon RX 400 Series", years: "2016", color: '#22c55e',
        note: "Polaris · GCN 4th Gen · GDDR5 · Up to 8 GB", families: [
        { name: "Radeon RX 480 · Radeon RX 470 · Radeon RX 460", key: "RX 400 Series", desc: "3 models", tier: 'Radeon', seg: 'Consumer', si: "Polaris (GCN 4th Gen)", n: 3 },
      ]},
      { id: 'gpu-r9-fury-series', name: "Radeon R9 Fury Series", years: "2015", color: '#22c55e',
        note: "Fiji · GCN 3rd Gen · HBM · Up to 4 GB", families: [
        { name: "Radeon R9 Fury X · Radeon R9 Nano · Radeon R9 Fury", key: "R9 Fury Series", desc: "3 models", tier: 'Radeon', seg: 'Consumer', si: "Fiji (GCN 3rd Gen)", n: 3 },
      ]},
      { id: 'gpu-r9-300-series', name: "Radeon R9 300 Series", years: "2015", color: '#14b8a6',
        note: "GCN 1st–3rd Gen · GDDR5 · Up to 8 GB", families: [
        { name: "Radeon R9 390X · Radeon R9 390 · Radeon R9 380X · Radeon R9 380 · +11 more", key: "R9 300 Series", desc: "15 models", tier: 'Radeon', seg: 'Consumer', si: "GCN 1st–3rd Gen", n: 15 },
      ]},
      { id: 'gpu-r7-300-series', name: "Radeon R7 300 Series", years: "2015", color: '#06b6d4',
        note: "GCN · Desktop and mobile graphics · Up to 4 GB", families: [
        { name: "Radeon R7 M380 · Radeon R7 M375 · Radeon R7 M365X · Radeon R7 M360 · +6 more", key: "R7 300 Series", desc: "10 models", tier: 'Radeon', seg: 'Consumer', si: "GCN", n: 10 },
      ]},
      { id: 'gpu-r5-300-series', name: "Radeon R5 300 Series", years: "2015", color: '#0ea5e9',
        note: "GCN · Mobile graphics · DDR3 · Up to 4 GB", families: [
        { name: "Radeon R5 M335X · Radeon R5 M335 · Radeon R5 M330 · Radeon R5 M320 · +1 more", key: "R5 300 Series", desc: "5 models", tier: 'Radeon', seg: 'Consumer', si: "GCN", n: 5 },
      ]},
      { id: 'gpu-r5-200-series', name: "Radeon R5 200 Series", years: "2014", color: '#0ea5e9',
        note: "GCN / TeraScale 2 · Entry graphics · Up to 4 GB", families: [
        { name: "Radeon R5 M255X · Radeon R5 M255 · Radeon R5 M230 · Radeon R5 235 · +3 more", key: "R5 200 Series", desc: "7 models", tier: 'Radeon', seg: 'Consumer', si: "GCN / TeraScale 2", n: 7 },
      ]},
      { id: 'gpu-hd-8000m-series', name: "Radeon HD 8000M Series", years: "2013", color: '#f97316',
        note: "GCN 1st / 2nd Gen · Mobile graphics · Up to 4 GB", families: [
        { name: "Radeon HD 8970M Series GPU · Radeon HD 8870M Series GPU · Radeon HD 8850M Series GPU · Radeon HD 8830M Series GPU · +8 more", key: "HD 8000M Series", desc: "12 models", tier: 'Radeon', seg: 'Consumer', si: "GCN 1st / 2nd Gen", n: 12 },
      ]},
      { id: 'gpu-r9-200-series', name: "Radeon R9 200 Series", years: "2013 – 2014", color: '#14b8a6',
        note: "GCN 1st–3rd Gen · Desktop and mobile graphics · Up to 8 GB", families: [
        { name: "Radeon R9 M290X · Radeon R9 M280 · Radeon R9 M275X · Radeon R9 M270X · +12 more", key: "R9 200 Series", desc: "16 models", tier: 'Radeon', seg: 'Consumer', si: "GCN 1st–3rd Gen", n: 16 },
      ]},
      { id: 'gpu-r7-200-series', name: "Radeon R7 200 Series", years: "2013 – 2014", color: '#06b6d4',
        note: "GCN · Desktop and mobile graphics · Up to 4 GB", families: [
        { name: "Radeon R7 M265 · Radeon R7 M260X · Radeon R7 M260 · Radeon R7 265 · +8 more", key: "R7 200 Series", desc: "12 models", tier: 'Radeon', seg: 'Consumer', si: "GCN", n: 12 },
      ]},
      { id: 'gpu-hd-7000-series', name: "Radeon HD 7000 Series", years: "2012", color: '#f59e0b',
        note: "GCN 1st / 2nd Gen · Desktop graphics · Up to 3 GB", families: [
        { name: "Radeon HD 7950 · Radeon HD 7990 · Radeon HD 7970 GHz Edition · Radeon HD 7970 · +6 more", key: "HD 7000 Series", desc: "10 models", tier: 'Radeon', seg: 'Consumer', si: "GCN 1st / 2nd Gen", n: 10 },
      ]},
      { id: 'gpu-hd-6000-series', name: "Radeon HD 6000 Series", years: "2010 – 2011", color: '#84cc16',
        note: "TeraScale 2 / 3 · Desktop graphics · Up to 2 GB", families: [
        { name: "Radeon HD 6970 · Radeon HD 6950 · Radeon HD 6870 · Radeon HD 6850 · +5 more", key: "HD 6000 Series", desc: "9 models", tier: 'Radeon', seg: 'Consumer', si: "TeraScale 2 / 3", n: 9 },
      ]},
      { id: 'gpu-hd-5000-series', name: "Radeon HD 5000 Series", years: "2009", color: '#a855f7',
        note: "TeraScale 2 · Desktop graphics · Up to 2 GB", families: [
        { name: "Radeon HD 5970 · Radeon HD 5870 · Radeon HD 5850 · Radeon HD 5830 · +5 more", key: "HD 5000 Series", desc: "9 models", tier: 'Radeon', seg: 'Consumer', si: "TeraScale 2", n: 9 },
      ]},
    ]
  }
};


// AMD corporate deck palette: red and orange for brand energy, gold for
// hierarchy, cyan for technical contrast, plus readable tints of each.
const A2_ACCENTS = { epyc: '#ED1C24', ryzen: '#ED1C24', gpu: '#ED1C24' };
const A2_TONES = ['#ED1C24', '#F26522', '#C1A968', '#00C2DE',
                  '#FF4B52', '#FF8A4C', '#D8C887', '#58D6E8',
                  '#C94A50', '#E58B52', '#AE9860', '#44AABD'];
Object.entries(A2_DATA).forEach(([tab, data]) => {
  const accent = A2_ACCENTS[tab];
  data.filters.forEach(group => group.tags.forEach((tag, index) => {
    tag[1] = group.key === 'gen' ? A2_TONES[index % A2_TONES.length] : accent;
  }));
  data.gens.filter(group => group.id).forEach((group, index) => {
    group.color = A2_TONES[index % A2_TONES.length];
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  RENDERER
// ═══════════════════════════════════════════════════════════════════════════
// Same contract as the Intel renderer and the production page: build the whole
// DOM once, stamp the filter dimensions as data attributes, then filter by
// toggling `.hidden`. Never re-render on a keystroke.

let a2Tab = 'epyc';
const a2Expanded = new Set();
const a2Active = {};             // { filterKey: Set(tag) } — empty set = no constraint
let a2Search = '';
let a2Specs = { cpu: null, gpu: null };
let a2Core = null;   // core-range state for the active tab, null on GPU

const a2Slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Spec rows for one card.
 *
 * CPU tabs read amd-cpu-specs.json keyed by codename; Ryzen cards then limit
 * that codename to the source product series assigned by the generator. The
 * GPU tab reads the models array out of amd-gpu-data.json. Both files are
 * already loaded by script.js — this reuses them rather than re-fetching.
 */
function a2Models(family) {
  const name = a2Key(family);
  if (a2Tab === 'gpu') {
    const fam = (a2Specs.gpu || []).find(e => e.arch === name);
    return (fam && fam.gpuSpecs && fam.gpuSpecs.models) || [];
  }
  const models = (a2Specs.cpu && a2Specs.cpu[name]) || [];
  if (!family.series || !family.series.length) return models;
  const allowed = new Set(family.series);
  return models.filter(m => allowed.has(m._series));
}

/**
 * Spec-lookup key for a family. GPU cards display the model list but join on
 * `key` (the amd-gpu-data.json `arch` value); CPU cards use the codename for
 * both. Keeping them separate is what lets the GPU card show something other
 * than a copy of its block header.
 */
function a2Key(f) { return f.key || f.name; }

/**
 * A family's tier values, always as an array.
 *
 * EPYC cards carry a LIST — core-count bands, and a codename spans a range
 * (Turin is 8C–128C, so it is in three bands at once). Ryzen and GPU carry a
 * single brand string. Normalising here keeps every caller uniform.
 */
function a2Tiers(f) {
  return Array.isArray(f.tier) ? f.tier : (f.tier ? [f.tier] : []);
}

function a2Count(family) {
  const n = a2Models(family).length;
  return n ? `${n} model${n === 1 ? '' : 's'}` : 'awaiting data';
}

function a2Rows(family, colspan) {
  const models = a2Models(family);
  const fields = A2_FIELDS[a2Tab];
  if (!models.length || !fields) {
    return `<tr class="v2-empty-row"><td colspan="${colspan}">No spec data yet</td></tr>`;
  }
  return models.map(m => `<tr data-search="${escHtml(Object.values(m).filter(v => v != null).join(' ').toLowerCase())}">` + fields.map((f, i) =>
    `<td class="${i === 0 ? 'cpu-model-name' : ''}">${escHtml(m[f] ?? '—')}</td>`
  ).join('') + '</tr>').join('');
}

/** Add one deduplicated codename filter for tabs that opt into it. */
function a2FilterGroups(cfg) {
  const groups = [...cfg.filters];
  if (!cfg.codenameFilter) return groups;

  const seen = new Set();
  const tags = [];
  cfg.gens.filter(g => !g.era).forEach(g => g.families.forEach(f => {
    if (!seen.has(f.name)) {
      seen.add(f.name);
      tags.push([f.name, g.color]);
    }
  }));
  tags.sort((a, b) => a[0].localeCompare(b[0]));
  groups.splice(1, 0, { label: 'Codename', key: 'code', tags });
  return groups;
}

/**
 * Build the filter sidebar for the active sub-tab.
 *
 * Vertical rail rather than a horizontal bar: the old chip bar cost 278px of
 * vertical space on the Ryzen tab (19 series chips over four rows) before any
 * content. Each option carries a live count, filled in by a2ApplyFilters().
 *
 * A group longer than 10 options scrolls instead of growing without bound.
 */
function a2BuildFilters() {
  const cfg = A2_DATA[a2Tab];
  const filterGroups = a2FilterGroups(cfg);
  const bar = dom.filterControls;

  // Keep `controls` -- the responsive collapse rules target it. Assigning
  // className alone would drop it and break the narrow-screen disclosure.
  bar.className = 'controls filter-bar';
  // Core count leads: it is the filter most used in practice, so it gets
  // the top of the rail ahead of the generation/series chips.
  bar.innerHTML = coreRangeHtml('a2core', a2Core) + filterGroups.map(g => {
    a2Active[g.key] = a2Active[g.key] || new Set();
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
    + `<button class="fclear" id="a2Clear" hidden>Clear filters</button>`;

  bar.querySelectorAll('.fchip').forEach(chip =>
    chip.addEventListener('click', () => {
      const set = a2Active[chip.dataset.key];
      set.has(chip.dataset.tag) ? set.delete(chip.dataset.tag) : set.add(chip.dataset.tag);
      a2ApplyFilters();
    }));
  coreRangeWire('a2core', a2Core, a2ApplyFilters);

  document.getElementById('a2Clear').addEventListener('click', () => {
    for (const k of Object.keys(a2Active)) a2Active[k].clear();
    if (a2Core) { a2Core.lo = 0; a2Core.hi = a2Core.stops.length - 1; }
    coreRangePaint('a2core', a2Core);
    a2ApplyFilters();
  });
}

/**
 * Rebuild the core-range stops for the active sub-tab.
 *
 * Derived from the models actually loaded, so a tab with no core data (GPU)
 * or fewer than two distinct values renders no slider at all.
 */
function a2BuildCoreRange() {
  if (a2Tab === 'gpu' || !a2Specs.cpu) { a2Core = null; return; }
  const models = [];
  A2_DATA[a2Tab].gens.forEach(g => (g.families || []).forEach(f =>
    models.push(...a2Models(f))));
  const stops = coreStops(models);
  a2Core = stops.length >= 2 ? coreRangeInit(stops) : null;
}

/**
 * How many blocks would match if `tag` were the only selection in its group?
 *
 * Counts against the OTHER groups' current selections, which is what makes the
 * numbers useful: with Brand=Ryzen AI chosen, the Segment counts show what is
 * reachable within that brand rather than the unfiltered totals.
 *
 * Reads the same data attributes as a2ApplyFilters() so the two cannot drift.
 */
function a2CountFor(key, tag) {
  const gens  = key === 'gen'  ? new Set([tag]) : (a2Active.gen  || new Set());
  const codes = key === 'code' ? new Set([tag]) : (a2Active.code || new Set());
  const tiers = key === 'tier' ? new Set([tag]) : (a2Active.tier || new Set());
  const segs  = key === 'seg'  ? new Set([tag]) : (a2Active.seg  || new Set());
  const q = a2Search.trim().toLowerCase();
  let n = 0;
  document.querySelectorAll('.arch-group').forEach(group => {
    if (gens.size && !gens.has(group.dataset.gen)) return;
    const hit = [...group.querySelectorAll('.sku-card')].some(card =>
      a2CoreOk(card) &&
      (!codes.size || codes.has(card.dataset.code)) &&
      (!tiers.size || a2CardTiers(card).some(t => tiers.has(t))) &&
      (!segs.size  || segs.has(card.dataset.seg))  &&
      (!q || card.dataset.search.includes(q) || group.dataset.search.includes(q)
          || a2SpecMatch(card.dataset.target, q)));
    if (hit) n++;
  });
  return n;
}

/** Era divider — same role as the Intel tab's branding separators. */
function a2Era(e) {
  return `
  <div class="v2-era" data-era="1">
    <div class="v2-era-label">${escHtml(e.era)}</div>
    <div class="v2-era-note">${escHtml(e.eraNote)}</div>
  </div>`;
}

/** One product-series block: header plus its grid of codename cards. */
function a2Gen(g, cfg) {
  const tiers = [...new Set(g.families.flatMap(a2Tiers))];
  const segs  = [...new Set(g.families.map(f => f.seg).filter(Boolean))];
  const codes = [...new Set(g.families.map(f => f.name).filter(Boolean))];
  const hay   = [g.name, g.note, ...g.families.flatMap(
                    f => [f.name, f.key || '', f.desc, f.si || ''])]
                  .join(' ').toLowerCase();

  // Brand-line display order. Datacenter-leaning tiers lead, per golden rule #2.
  const order = ['Instinct', 'FirePro', 'Radeon PRO', 'Radeon',
                 'Performance', 'Density', 'Edge',
                 'Threadripper', 'Ryzen AI Max', 'Ryzen AI', 'Ryzen', 'Z-Series'];
  const groupBy = cfg.brandGroups
    ? order.filter(t => g.families.some(f => a2Tiers(f).includes(t)))
    : [];
  let idx = 0;
  const cards = groupBy.length > 1
    ? groupBy.map(t => {
        const start = idx;
        const rows = g.families.filter(f => a2Tiers(f).includes(t))
                       .map(f => a2Card(f, g, idx++, cfg)).join('');
        return `<div class="v2-brandline" style="--card-order:${start * 4 - 2}">` +
               `<span class="v2-brandline-name">${escHtml(t)}</span>` +
               `<span class="v2-brandline-rule"></span></div>${rows}`;
      }).join('')
    : g.families.map((f, i) => a2Card(f, g, i, cfg)).join('');

  const total = g.families.reduce((s, f) => s + (a2Models(f).length || f.n), 0);
  const mix = groupBy.length > 1
    ? groupBy.map(t => `${g.families.filter(f => a2Tiers(f).includes(t)).length} ${t}`).join(' · ')
    : `${g.families.length} codename${g.families.length === 1 ? '' : 's'}`;

  return `
  <div class="arch-group" id="a2-${g.id}" style="--arch-color:${g.color}"
       data-gen="${escHtml(g.name)}" data-tiers="${escHtml(tiers.join('|'))}"
       data-segs="${escHtml(segs.join('|'))}" data-codes="${escHtml(codes.join('|'))}"
       data-search="${escHtml(hay)}">
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
    ${a2Tab === 'epyc' && g.id === 'epyc9005'
      ? '<button type="button" class="a2-architecture-link" data-architecture-guide="epyc-9005">Explore architecture <span aria-hidden="true">↗</span></button>'
      : ''}
    <div class="arch-body"><div class="arch-body-inner"><div class="skus-grid">${cards}</div></div></div>
  </div>`;
}

/** One codename card plus its spec table. */
function a2Card(f, g, i, cfg) {
  const id = `a2t-${g.id}-${a2Slug(f.name)}`;
  const cols = A2_COLUMNS[a2Tab];
  const tags = [...a2Tiers(f), f.seg].filter(Boolean).map(t =>
    `<span class="sku-tag">${escHtml(t)}</span>`).join('');
  const metaSearch = (f.name + ' ' + (f.key || '') + ' ' + f.desc + ' ' + (f.si || '')).toLowerCase();

  return `
    <div class="sku-card has-specs" style="--card-order:${i * 4}"
         data-target="${id}" data-tier="${escHtml(a2Tiers(f).join('|'))}" data-seg="${escHtml(f.seg)}"
         data-code="${escHtml(f.name)}"
         data-cmin="${f.cmin ?? ''}" data-cmax="${f.cmax ?? ''}"
         data-meta-search="${escHtml(metaSearch)}" data-search="${escHtml(metaSearch)}"
         role="button" tabindex="0" aria-expanded="false">
      <div class="sku-spec-toggle">specs ▾</div>
      <div class="sku-name">${escHtml(f.name)}</div>
      <div class="sku-desc">${escHtml(f.desc)}</div>
      ${f.si ? `<div class="v2-silicon">${escHtml(f.si)}</div>` : ''}
      <div class="search-summary" hidden></div>
      <div class="sku-tags">${tags}</div>
    </div>
    <div class="cpu-spec-wrapper" id="${id}" style="--spec-order:${i * 4 + 1}">
      <div class="cpu-spec-overflow">
        <div class="cpu-spec-header">
          <div>
            <span class="cpu-spec-header-title">${escHtml(f.name)}</span>
            <div class="identity-path">AMD › ${escHtml(stripVendor(cfg.title))} › ${escHtml(g.name)} › ${escHtml(f.name)}</div>
            <div class="source-line">Source: AMD official Product Specifications CSV</div>
          </div>
          <span class="cpu-spec-header-title v2-await">${a2Count(f)}</span>
        </div>
        <table class="cpu-spec-table">
          <thead><tr>${cols.map(c => `<th>${escHtml(c)}</th>`).join('')}</tr></thead>
          <tbody>${a2Rows(f, cols.length)}</tbody>
        </table>
      </div>
    </div>`;
}

function a2Render() {
  const cfg = A2_DATA[a2Tab];
  dom.pageHeader.innerHTML =
    `<h1 class="header-amd">${escHtml(stripVendor(cfg.title))}</h1>` +
    `<p>${escHtml(cfg.blurb)}</p>`;

  dom.timeline.innerHTML =
    cfg.gens.map(g => g.era ? a2Era(g) : a2Gen(g, cfg)).join('');

  document.querySelectorAll('.arch-header').forEach(h => {
    h.addEventListener('click', () => a2Toggle(h.dataset.gen));
    h.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a2Toggle(h.dataset.gen); }
    });
  });
  document.querySelectorAll('.sku-card.has-specs').forEach(c => {
    c.addEventListener('click', () => a2ToggleSpecs(c));
    c.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a2ToggleSpecs(c); }
    });
  });
  dom.timeline.querySelector('[data-architecture-guide="epyc-9005"]')
    ?.addEventListener('click', () => dashboardOpenEpycGuide());

  a2ApplyFilters();
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTERACTION
// ═══════════════════════════════════════════════════════════════════════════

function a2Toggle(id) {
  const el = document.getElementById(`a2-${id}`);
  if (!el) return;
  const open = el.classList.toggle('expanded');
  a2Expanded[open ? 'add' : 'delete'](id);
  el.querySelector('.arch-header').setAttribute('aria-expanded', String(open));
}

function a2ToggleSpecs(card) {
  const w = document.getElementById(card.dataset.target);
  const open = w.classList.toggle('open');
  card.classList.toggle('selected', open);
  card.setAttribute('aria-expanded', String(open));
}

function a2ExpandAll(open) {
  document.querySelectorAll('.arch-group').forEach(g => {
    g.classList.toggle('expanded', open);
    g.querySelector('.arch-header').setAttribute('aria-expanded', String(open));
  });
  a2Expanded.clear();
  if (open) A2_DATA[a2Tab].gens.filter(g => !g.era).forEach(g => a2Expanded.add(g.id));
}

// ═══════════════════════════════════════════════════════════════════════════
//  FILTER — reads only the data attributes stamped during render
// ═══════════════════════════════════════════════════════════════════════════

/** Does this card's core span intersect the selected range? */
function a2CoreOk(card) {
  if (coreRangeIsAll(a2Core)) return true;
  const lo = parseInt(card.dataset.cmin, 10);
  const hi = parseInt(card.dataset.cmax, 10);
  return coreRangeMatch(a2Core, Number.isFinite(lo) ? lo : null,
                                Number.isFinite(hi) ? hi : null);
}

/** Tier values stamped on a rendered card. Pipe-joined by a2Card(). */
function a2CardTiers(card) {
  return (card.dataset.tier || '').split('|').filter(Boolean);
}

function a2ApplyFilters() {
  const sel = k => a2Active[k] || new Set();
  const gens = sel('gen'), codes = sel('code'), tiers = sel('tier'), segs = sel('seg');
  const q = a2Search.trim().toLowerCase();
  const any = gens.size || codes.size || tiers.size || segs.size || !coreRangeIsAll(a2Core);

  document.querySelectorAll('.fchip').forEach(c => {
    const on = sel(c.dataset.key).has(c.dataset.tag);
    const n = a2CountFor(c.dataset.key, c.dataset.tag);
    c.classList.toggle('active', on);
    // Dim an option that would yield nothing given the other groups'
    // selections. Selected options never dim, or the bar flickers as the
    // user works through a combination.
    c.classList.toggle('inactive', !on && n === 0);
    c.setAttribute('aria-pressed', String(on));
    const slot = c.querySelector('.fchip-n');
    if (slot) slot.textContent = n || '';
    const label = (c.querySelector('.fchip-label') || {}).textContent || c.dataset.tag;
    c.setAttribute('aria-label', `${label}, ${n} series`);
  });
  const clear = document.getElementById('a2Clear');
  if (clear) clear.hidden = !any;

  // Narrow screens collapse the sidebar; surface the active count on the button.
  const badge = document.getElementById('sidebarCount');
  if (badge) {
    const total = gens.size + codes.size + tiers.size + segs.size +
                  (coreRangeIsAll(a2Core) ? 0 : 1);
    badge.textContent = total;
    badge.hidden = total === 0;
  }

  let shownGens = 0, shownCards = 0;
  const searchContext = dashboardSearchContext(q);

  document.querySelectorAll('.arch-group').forEach(group => {
    const genOk = !gens.size || gens.has(group.dataset.gen);
    let visible = 0;

    group.querySelectorAll('.sku-card').forEach(card => {
      const search = dashboardApplyCardSearch(card, group, searchContext);
      const ok = genOk
        && a2CoreOk(card)
        && (!codes.size || codes.has(card.dataset.code))
        && (!tiers.size || a2CardTiers(card).some(t => tiers.has(t)))
        && (!segs.size  || segs.has(card.dataset.seg))
        && search.matched;
      card.classList.toggle('hidden', !ok);
      const w = search.wrapper;
      if (!ok && w) { w.classList.remove('open'); card.classList.remove('selected'); }
      if (ok) visible++;
    });

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

  const st = document.getElementById('a2Status');
  if (st) st.textContent =
    `${shownGens} series · ${shownCards} codename${shownCards === 1 ? '' : 's'}`;
  if (typeof dashboardRestoreSelectedRows === 'function') dashboardRestoreSelectedRows();
  if (typeof dashboardStateChanged === 'function') dashboardStateChanged();
}

/**
 * Does any spec row under this card match the search term?
 *
 * Keeps parity with the production AMD path, where searching `sp5` or a model
 * number reaches into the spec tables rather than only matching card text.
 */
function a2SpecMatch(targetId, q) {
  if (!q) return false;
  const w = document.getElementById(targetId);
  if (!w) return false;
  return w.textContent.toLowerCase().includes(q);
}

/** Amber-highlight matching spec rows, matching the production behaviour. */
function a2Highlight(q) {
  document.querySelectorAll('.cpu-spec-table tbody tr').forEach(r =>
    r.classList.remove('search-match'));
  if (!q) return;
  document.querySelectorAll('.cpu-spec-table tbody tr').forEach(r => {
    if (r.textContent.toLowerCase().includes(q) && !r.classList.contains('row-selected')) {
      r.classList.add('search-match');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

let a2Wired = false;

/** Swap sub-tab: resets filters and rebuilds everything below the tab bar. */
function a2Switch(tab) {
  if (tab === a2Tab && typeof dashboardIsEpycGuideOpen === 'function'
      && dashboardIsEpycGuideOpen()) {
    dashboardCloseEpycGuide();
    return;
  }
  a2Tab = tab;
  a2Expanded.clear();
  a2Search = dashboardGlobalSearchQuery;
  dom.searchInput.value = a2Search;
  for (const k of Object.keys(a2Active)) delete a2Active[k];

  document.querySelectorAll('.a2-subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));

  a2BuildCoreRange();
  a2BuildFilters();
  a2Render();
  dashboardGlobalRender();
  if (typeof dashboardSyncEpycGuide === 'function') dashboardSyncEpycGuide();
}

/** Take over the shared DOM and render the AMD tab. */
function a2Activate(cpuSpecs, gpuData) {
  a2Specs.cpu = cpuSpecs || a2Specs.cpu;
  a2Specs.gpu = gpuData || a2Specs.gpu;

  document.body.classList.add('amd-v2');
  document.getElementById('a2Subtabs').classList.add('visible');
  document.getElementById('a2Status').hidden = false;
  dom.codenameTableWrap.innerHTML = '';
  dom.techTabs.classList.remove('visible');

  if (!a2Wired) {
    document.querySelectorAll('.a2-subtab').forEach(b =>
      b.addEventListener('click', () => a2Switch(b.dataset.tab)));
    a2Wired = true;
  }

  a2Tab = 'epyc';
  a2Expanded.clear();
  a2Search = '';
  for (const k of Object.keys(a2Active)) delete a2Active[k];
  document.querySelectorAll('.a2-subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === 'epyc'));

  a2BuildCoreRange();
  a2BuildFilters();
  a2Render();
}

/** Hand the shared DOM back. */
function a2Deactivate() {
  document.body.classList.remove('amd-v2');
  const st = document.getElementById('a2Subtabs');
  if (st) st.classList.remove('visible');
  const s = document.getElementById('a2Status');
  if (s) s.hidden = true;
}

function a2SetSearch(value) {
  a2Search = value;
  a2ApplyFilters();
}

/** True when the AMD v2 renderer currently owns the DOM. */
function a2IsActive() {
  return document.body.classList.contains('amd-v2');
}

function a2DashboardState() {
  return {
    tab: a2Tab,
    search: a2Search,
    filters: Object.fromEntries(Object.entries(a2Active).map(([k, v]) => [k, [...v]])),
    core: a2Core ? [a2Core.stops[a2Core.lo], a2Core.stops[a2Core.hi]] : null
  };
}

function a2ApplyDashboardState(state) {
  if (state.tab && A2_DATA[state.tab] && state.tab !== a2Tab) a2Switch(state.tab);
  Object.entries(state.filters || {}).forEach(([key, values]) => {
    if (a2Active[key]) {
      a2Active[key].clear();
      values.forEach(value => a2Active[key].add(value));
    }
  });
  if (state.core && a2Core) dashboardApplyCoreValues(a2Core, state.core);
  a2Search = state.search || '';
  dom.searchInput.value = a2Search;
  dom.searchClear.classList.toggle('visible', !!a2Search);
  coreRangePaint('a2core', a2Core);
  a2ApplyFilters();
}
