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
          'Socket', 'Sockets', 'PCIe', 'Memory', 'Product ID'],
  ryzen: ['Model', 'Cores', 'Threads', 'Base', 'Boost', 'L3 Cache', 'TDP',
          'Socket', 'GPU Model', 'GPU CUs', 'GPU Freq', 'Product ID'],
  gpu:   ['Model', 'Form', 'Architecture', 'Process', 'CUs', 'Memory', 'Type',
          'Bandwidth', 'FP32', 'FP32 Matrix', 'PCIe', 'TBP']
};

const A2_FIELDS = {
  epyc:  ['n', 'c', 't', 'bas', 'bst', 'l3', 'tdp', 'sk', 'skc', 'pcie', 'mem', 'tr'],
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
        { name: "Turin", desc: "Zen 5 — 22 models", seg: 'SP5', si: "Zen 5", n: 22, cmin: 8, cmax: 128 },
        { name: "Turin Dense", desc: "Zen 5 — 5 models", seg: 'SP5', si: "Zen 5", n: 5, cmin: 96, cmax: 192 },
      ]},
      { id: 'epyc9004', name: "EPYC 9004 / 8004 Series", years: '2022 – 2023', color: '#f97316',
        note: "Genoa · Bergamo · Siena · Zen 4 / Zen 4c · SP5 / SP6", families: [
        { name: "Genoa", desc: "Zen 4 — 18 models", seg: 'SP5', si: "Zen 4", n: 18, cmin: 16, cmax: 96 },
        { name: "Genoa-X", desc: "Zen 4 — 3 models", seg: 'SP5', si: "Zen 4", n: 3, cmin: 16, cmax: 96 },
        { name: "Bergamo", desc: "Zen 4 — 3 models", seg: 'SP5', si: "Zen 4", n: 3, cmin: 112, cmax: 128 },
        { name: "Siena", desc: "Zen 4 — 12 models", seg: 'SP6', si: "Zen 4", n: 12, cmin: 8, cmax: 64 },
      ]},
      { era: "SP3 platform", eraNote: "Zen through Zen 3 — up to 3200 MT/s, PCIe 3.0 / 4.0" },
      { id: 'epyc7003', name: "EPYC 7003 Series", years: '2021 – 2022', color: '#84cc16',
        note: "Milan · Zen 3 · SP3", families: [
        { name: "Milan", desc: "Zen 3 — 25 models", seg: 'SP3', si: "Zen 3", n: 25, cmin: 8, cmax: 64 },
        { name: "Milan-X", desc: "Zen 3 — 4 models", seg: 'SP3', si: "Zen 3", n: 4, cmin: 16, cmax: 64 },
      ]},
      { id: 'epyc7002', name: "EPYC 7002 Series", years: '2019', color: '#14b8a6',
        note: "Rome · Zen 2 · SP3", families: [
        { name: "Rome", desc: "Zen 2 — 25 models", seg: 'SP3', si: "Zen 2", n: 25, cmin: 8, cmax: 64 },
      ]},
      { id: 'epyc7001', name: "EPYC 7001 Series", years: '2017', color: '#c084fc',
        note: "Naples · Zen · SP3", families: [
        { name: "Naples", desc: "Zen — 14 models", seg: 'SP3', si: "Zen", n: 14, cmin: 8, cmax: 32 },
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
        { name: "Gorgon Point", desc: "Zen 5 — 13 models", tier: 'Ryzen AI', seg: 'Mobile', si: "Zen 5", n: 13, cmin: 4, cmax: 12 },
      ]},
      { id: 'rai300', name: "Ryzen AI 300 / Max 300 Series", years: '2024 – 2025', color: '#ef4444',
        note: "Strix Point · Strix Halo · Kraken Point · Zen 5 + XDNA 2", families: [
        { name: "Strix Halo", desc: "Zen 5 — 9 models", tier: 'Ryzen AI Max', seg: 'Mobile', si: "Zen 5", n: 9, cmin: 6, cmax: 16 },
        { name: "Strix Point", desc: "Zen 5 — 6 models", tier: 'Ryzen AI', seg: 'Mobile', si: "Zen 5", n: 6, cmin: 8, cmax: 12 },
        { name: "Kraken Point", desc: "Zen 5 — 5 models", tier: 'Ryzen AI', seg: 'Mobile', si: "Zen 5", n: 5, cmin: 4, cmax: 8 },
      ]},
      { era: "Numbered series", eraNote: "Ryzen 1000 through 9000 and the matching Threadripper lines" },
      { id: 'tr9000', name: "Ryzen Threadripper 9000 Series", years: '2025', color: '#f59e0b',
        note: "Shimada Peak · Zen 5 · sTR5", families: [
        { name: "Shimada Peak", desc: "Zen 5 — 9 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 5", n: 9, cmin: 12, cmax: 96 },
      ]},
      { id: 'r9000', name: "Ryzen 9000 Series", years: '2024 – 2025', color: '#f97316',
        note: "Granite Ridge · Fire Range · Zen 5 · AM5 / FL1", families: [
        { name: "Granite Ridge", desc: "Zen 5 — 14 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 5", n: 14, cmin: 6, cmax: 16 },
        { name: "Fire Range", desc: "Zen 5 — 3 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 5", n: 3, cmin: 12, cmax: 16 },
      ]},
      { id: 'tr7000', name: "Ryzen Threadripper 7000 Series", years: '2023', color: '#fbbf24',
        note: "Storm Peak · Zen 4 · sTR5", families: [
        { name: "Storm Peak", desc: "Zen 4 — 9 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 4", n: 9, cmin: 12, cmax: 96 },
      ]},
      { id: 'r8000', name: "Ryzen 8000 Series", years: '2023 – 2024', color: '#eab308',
        note: "Phoenix · Hawk Point · Dragon Range · Zen 4 · AM5 / FP8", families: [
        { name: "Phoenix", desc: "Zen 4 — 47 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 4", n: 47, cmin: 4, cmax: 8 },
        { name: "Hawk Point", desc: "Zen 4 — 17 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 4", n: 17, cmin: 4, cmax: 8 },
        { name: "Dragon Range", desc: "Zen 4 — 11 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 4", n: 11, cmin: 6, cmax: 16 },
      ]},
      { id: 'r7000', name: "Ryzen 7000 Series", years: '2022 – 2023', color: '#a3e635',
        note: "Raphael · Dragon Range · Phoenix · Rembrandt-R · Barceló-R · Zen 4 / Zen 3+", families: [
        { name: "Raphael", desc: "Zen 4 — 19 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 4", n: 19, cmin: 6, cmax: 16 },
        { name: "Rembrandt-R", desc: "Zen 3+ — 11 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 3+", n: 11, cmin: 4, cmax: 8 },
        { name: "Barceló-R", desc: "Zen 3 — 7 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 3", n: 7, cmin: 4, cmax: 8 },
      ]},
      { id: 'r6000', name: "Ryzen 6000 Series", years: '2022', color: '#84cc16',
        note: "Rembrandt · Zen 3+ · RDNA 2 iGPU · FP7", families: [
        { name: "Rembrandt", desc: "Zen 3+ — 19 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 3+", n: 19, cmin: 6, cmax: 8 },
      ]},
      { id: 'tr5000', name: "Ryzen Threadripper 5000 Series", years: '2022', color: '#22c55e',
        note: "Chagall · Zen 3 · sWRX8", families: [
        { name: "Chagall", desc: "Zen 3 — 5 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 3", n: 5, cmin: 12, cmax: 64 },
      ]},
      { id: 'r5000', name: "Ryzen 5000 Series", years: '2020 – 2022', color: '#14b8a6',
        note: "Vermeer · Cezanne · Barceló · Lucienne · Zen 3 · AM4", families: [
        { name: "Vermeer", desc: "Zen 3 — 22 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 3", n: 22, cmin: 6, cmax: 16 },
        { name: "Cezanne", desc: "Zen 3 — 42 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 3", n: 42, cmin: 4, cmax: 8 },
        { name: "Barceló", desc: "Zen 3 — 10 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 3", n: 10, cmin: 2, cmax: 8 },
        { name: "Lucienne", desc: "Zen 2 — 3 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 2", n: 3, cmin: 4, cmax: 8 },
      ]},
      { id: 'tr3000', name: "Ryzen Threadripper 3000 Series", years: '2019 – 2020', color: '#06b6d4',
        note: "Castle Peak · Zen 2 · sTRX4 / sWRX8", families: [
        { name: "Castle Peak", desc: "Zen 2 — 7 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 2", n: 7, cmin: 12, cmax: 64 },
      ]},
      { id: 'r4000', name: "Ryzen 4000 Series", years: '2020', color: '#0ea5e9',
        note: "Renoir · Zen 2 · AM4 / FP6", families: [
        { name: "Renoir", desc: "Zen 2 — 33 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 2", n: 33, cmin: 4, cmax: 8 },
      ]},
      { id: 'r3000', name: "Ryzen 3000 Series", years: '2019', color: '#6366f1',
        note: "Matisse · Picasso · Dalí · Zen 2 / Zen+ · AM4", families: [
        { name: "Matisse", desc: "Zen 2 — 16 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 2", n: 16, cmin: 4, cmax: 16 },
        { name: "Picasso", desc: "Zen+ — 34 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen+", n: 34, cmin: 2, cmax: 4 },
        { name: "Dalí", desc: "Zen — 10 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen", n: 10, cmin: 2, cmax: 2 },
      ]},
      { id: 'tr2000', name: "Ryzen Threadripper 2000 Series", years: '2018', color: '#818cf8',
        note: "Colfax · Zen+ · TR4", families: [
        { name: "Colfax", desc: "Zen+ — 4 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen+", n: 4, cmin: 12, cmax: 32 },
      ]},
      { id: 'r2000', name: "Ryzen 2000 Series", years: '2018', color: '#a78bfa',
        note: "Pinnacle Ridge · Raven Ridge · Zen+ / Zen · AM4", families: [
        { name: "Pinnacle Ridge", desc: "Zen+ — 11 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen+", n: 11, cmin: 4, cmax: 8 },
        { name: "Raven Ridge", desc: "Zen — 27 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen", n: 27, cmin: 2, cmax: 4 },
      ]},
      { id: 'tr1000', name: "Ryzen Threadripper 1000 Series", years: '2017', color: '#c084fc',
        note: "Whitehaven · Zen · TR4", families: [
        { name: "Whitehaven", desc: "Zen — 3 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen", n: 3, cmin: 8, cmax: 16 },
      ]},
      { id: 'r1000', name: "Ryzen 1000 Series", years: '2017', color: '#d8b4fe',
        note: "Summit Ridge · Zen · AM4 · the first Ryzen", families: [
        { name: "Summit Ridge", desc: "Zen — 16 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen", n: 16, cmin: 4, cmax: 8 },
      ]},
      { era: "Outside the numbering", eraNote: "Z-series handhelds and the 200 / 100 entry refresh" },
      { id: 'rzseries', name: "Ryzen Z-Series (Handheld)", years: '2023 – 2025', color: '#22d3ee',
        note: "Z1 · Z2 · handheld gaming APUs", families: [
        { name: "Z2", desc: "Zen 5 — 5 models", tier: 'Z-Series', seg: 'Handheld', si: "Zen 5", n: 5, cmin: 4, cmax: 8 },
        { name: "Z1", desc: "Zen 4 — 2 models", tier: 'Z-Series', seg: 'Handheld', si: "Zen 4", n: 2, cmin: 6, cmax: 8 },
      ]},
      { id: 'r200', name: "Ryzen 200 / 100 Series", years: '2024 – 2025', color: '#94a3b8',
        note: "Hawk Point Refresh · Mendocino · entry mobile", families: [
        { name: "Hawk Point Refresh", desc: "Zen 4 — 12 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 4", n: 12, cmin: 4, cmax: 8 },
        { name: "Mendocino", desc: "Zen 2 — 17 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 2", n: 17, cmin: 2, cmax: 8 },
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
        ['Instinct', '#ef4444'], ['Radeon PRO', '#818cf8'], ['Radeon', '#10b981']
      ]},
      { label: 'Segment', key: 'seg', tags: [
        ['Data Center', '#ef4444'], ['Workstation', '#818cf8'],
        ['Consumer', '#10b981'], ['Mobile', '#22d3ee']
      ]}
    ],
    gens: [
      { era: 'Instinct — data center', eraNote: 'CDNA accelerators for AI and HPC' },
      { id: 'gpu-mi300-series-cdna-4', name: "Instinct MI350 Series", years: "2025", color: '#ef4444',
        note: "MI355X · MI350X · CDNA 4 · HBM3E", families: [
        { name: "MI355X · MI350X", key: "MI300 Series (CDNA 4)", desc: "2 models", tier: 'Instinct', seg: 'Data Center', si: "CDNA 4", n: 2 },
      ]},
      { id: 'gpu-mi300-series-cdna-3', name: "Instinct MI300 Series", years: "2023–2024", color: '#f97316',
        note: "MI325X · MI300X · MI300A · CDNA 3", families: [
        { name: "MI325X · MI300X · MI300A", key: "MI300 Series (CDNA 3)", desc: "3 models", tier: 'Instinct', seg: 'Data Center', si: "CDNA 3", n: 3 },
      ]},
      { id: 'gpu-mi200-series-cdna-2', name: "Instinct MI200 Series", years: "2021–2022", color: '#f59e0b',
        note: "MI250X · MI250 · MI210 · CDNA 2", families: [
        { name: "MI250X · MI250 · MI210", key: "MI200 Series (CDNA 2)", desc: "3 models", tier: 'Instinct', seg: 'Data Center', si: "CDNA 2", n: 3 },
      ]},
      { id: 'gpu-mi100-cdna', name: "Instinct MI100 Series", years: "2020", color: '#84cc16',
        note: "MI100 · first CDNA part", families: [
        { name: "MI100", key: "MI100 (CDNA)", desc: "1 models", tier: 'Instinct', seg: 'Data Center', si: "CDNA", n: 1 },
      ]},
      { id: 'gpu-mi50-mi60-vega-7nm', name: "Instinct MI50 / MI60", years: "2018–2020", color: '#14b8a6',
        note: "Vega 7 nm", families: [
        { name: "MI60 · MI50", key: "MI50/MI60 (Vega 7nm)", desc: "2 models", tier: 'Instinct', seg: 'Data Center', si: "Vega 7nm", n: 2 },
      ]},
      { id: 'gpu-mi25-vega-14nm', name: "Instinct MI25", years: "2017", color: '#818cf8',
        note: "Vega 14 nm", families: [
        { name: "MI25", key: "MI25 (Vega 14nm)", desc: "1 models", tier: 'Instinct', seg: 'Data Center', si: "Vega 14nm", n: 1 },
      ]},
      { id: 'gpu-mi8-mi6-fiji-polaris', name: "Instinct MI8 / MI6", years: "2016", color: '#c084fc',
        note: "Fiji · Polaris", families: [
        { name: "MI8 · MI6", key: "MI8/MI6 (Fiji/Polaris)", desc: "2 models", tier: 'Instinct', seg: 'Data Center', si: "Fiji/Polaris", n: 2 },
      ]},

      { era: 'Radeon PRO — workstation', eraNote: 'Professional visualisation and workstation graphics' },
      { id: 'gpu-ai-pro-r9000-series', name: "Radeon AI PRO R9000 Series", years: "2025", color: '#ef4444',
        note: "3 nm · RDNA 4 · GDDR6 · Up to 32 GB", families: [
        { name: "AI PRO R9700 · AI PRO R9700S · AI PRO R9600D", key: "AI PRO R9000 Series", desc: "3 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA 4", n: 3 },
      ]},
      { id: 'gpu-pro-v-series', name: "Radeon PRO V Series", years: "2024", color: '#ef4444',
        note: "TSMC 5nm | 6nm FinFET · RDNA · GDDR6 · Up to 32 GB", families: [
        { name: "PRO V710 · PRO V620 · PRO V520", key: "PRO V Series", desc: "3 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA", n: 3 },
      ]},
      { id: 'gpu-pro-w7000-series', name: "Radeon PRO W7000 Series", years: "2023", color: '#f97316',
        note: "TSMC 5nm GCD 6nm MCD · RDNA 3 · GDDR6 · Up to 48 GB", families: [
        { name: "PRO W7900 Dual Slot · PRO W7900 · PRO W7800 48GB · PRO W7800 · +4 more", key: "PRO W7000 Series", desc: "8 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA 3", n: 8 },
      ]},
      { id: 'gpu-pro-w6000-series', name: "Radeon PRO W6000 Series", years: "2021", color: '#eab308',
        note: "TSMC 7nm FinFET · RDNA 2 · GDDR6 · Up to 32 GB", families: [
        { name: "PRO W6800 · PRO W6600 · PRO W6400", key: "PRO W6000 Series", desc: "3 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA 2", n: 3 },
      ]},
      { id: 'gpu-pro-w6000-mobile-series', name: "Radeon PRO W6000 Mobile Series", years: "2021", color: '#84cc16',
        note: "TSMC 7nm FinFET · RDNA 2 · GDDR6 · Up to 8 GB", families: [
        { name: "PRO W6600M · PRO W6500M · PRO W6300M", key: "PRO W6000 Mobile Series", desc: "3 models", tier: 'Radeon PRO', seg: 'Mobile', si: "RDNA 2", n: 3 },
      ]},
      { id: 'gpu-pro-vii-series', name: "Radeon PRO VII Series", years: "2020", color: '#3b82f6',
        note: "TSMC 7nm FinFET · RDNA · HBM2 · Up to 16 GB", families: [
        { name: "Pro VII", key: "PRO VII Series", desc: "1 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA", n: 1 },
      ]},
      { id: 'gpu-pro-w5000-series', name: "Radeon PRO W5000 Series", years: "2019", color: '#8b5cf6',
        note: "TSMC 7nm FinFET · RDNA · GDDR6 · Up to 8 GB", families: [
        { name: "Pro W5700 · Pro W5500", key: "PRO W5000 Series", desc: "2 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA", n: 2 },
      ]},
      { id: 'gpu-pro-w5000-mobile-series', name: "Radeon PRO W5000 Mobile Series", years: "2019", color: '#8b5cf6',
        note: "TSMC 7nm FinFET · RDNA · GDDR6 · Up to 4 GB", families: [
        { name: "PRO W5500M (Mobile)", key: "PRO W5000 Mobile Series", desc: "1 models", tier: 'Radeon PRO', seg: 'Mobile', si: "RDNA", n: 1 },
      ]},
      { id: 'gpu-pro-wx-x200-series', name: "Radeon PRO WX x200 Series", years: "2018", color: '#ef4444',
        note: "14nm FinFET · RDNA · HBM2 · Up to 8 GB", families: [
        { name: "Pro WX 8200 · Pro WX 3200", key: "PRO WX x200 Series", desc: "2 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA", n: 2 },
      ]},
      { id: 'gpu-pro-series', name: "Radeon PRO Series", years: "2017", color: '#f59e0b',
        note: "14nm FinFET · RDNA · HBM2 · Up to 32 GB", families: [
        { name: "Pro SSG · Vega Frontier Edition (Liquid-cooled) · Vega Frontier Edition (Air-cooled) · Pro Duo", key: "PRO Series", desc: "4 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA", n: 4 },
      ]},
      { id: 'gpu-pro-wx-x100-series', name: "Radeon PRO WX x100 Series", years: "2017", color: '#f97316',
        note: "14nm FinFET · RDNA · HBM2 · Up to 16 GB", families: [
        { name: "Pro WX 9100 · Pro WX 7100 · Pro WX 5100 · Pro WX 4100 · +2 more", key: "PRO WX x100 Series", desc: "6 models", tier: 'Radeon PRO', seg: 'Workstation', si: "RDNA", n: 6 },
      ]},
      { id: 'gpu-pro-wx-x100-mobile-series', name: "Radeon PRO WX X100 Mobile Series", years: "2017", color: '#f59e0b',
        note: "14nm FinFET · RDNA · GDDR5 · Up to 8 GB", families: [
        { name: "PRO WX 7100 (Mobile) · PRO WX 4170 (Mobile) · PRO WX 4150 (Mobile) · PRO WX 4130 (Mobile) · +2 more", key: "PRO WX X100 Mobile Series", desc: "6 models", tier: 'Radeon PRO', seg: 'Mobile', si: "RDNA", n: 6 },
      ]},
      { id: 'gpu-pro-wx-x200-mobile-series', name: "Radeon PRO WX X200 Mobile Series", years: "2017", color: '#f97316',
        note: "14nm FinFET · RDNA · GDDR5 · Up to 4 GB", families: [
        { name: "PRO WX 3200 (Mobile)", key: "PRO WX X200 Mobile Series", desc: "1 models", tier: 'Radeon PRO', seg: 'Mobile', si: "RDNA", n: 1 },
      ]},

      { era: 'Radeon — consumer', eraNote: 'Discrete gaming graphics, newest series first' },
      { id: 'gpu-rx-9000-series', name: "Radeon RX 9000 Series", years: "2025", color: '#ef4444',
        note: "3 nm · RDNA 4 · GDDR6 · Up to 16 GB", families: [
        { name: "RX 9070 XT · RX 9070 · RX 9060 XT · RX 9060 XT (8GB) · +2 more", key: "RX 9000 Series", desc: "6 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA 4", n: 6 },
      ]},
      { id: 'gpu-rx-7000-series', name: "Radeon RX 7000 Series", years: "2022", color: '#f59e0b',
        note: "5/6 nm · RDNA 3 · GDDR6 · Up to 24 GB", families: [
        { name: "RX 7900 XTX · RX 7900 XT · RX 7900 GRE · RX 7800 XT · +11 more", key: "RX 7000 Series", desc: "15 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA 3", n: 15 },
      ]},
      { id: 'gpu-rx-6000-series', name: "Radeon RX 6000 Series", years: "2020", color: '#eab308',
        note: "7 nm · RDNA 2 · GDDR6 · Up to 16 GB", families: [
        { name: "RX 6950 XT · RX 6900 XT · RX 6800 XT Midnight Black · RX 6800 XT · +24 more", key: "RX 6000 Series", desc: "28 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA 2", n: 28 },
      ]},
      { id: 'gpu-rx-5000-series', name: "Radeon RX 5000 Series", years: "2019", color: '#6366f1',
        note: "7 nm · RDNA · GDDR6 · Up to 8 GB", families: [
        { name: "RX 5700 XT 50th Anniversary · RX 5700 XT · RX 5700 · RX 5600 XT · +8 more", key: "RX 5000 Series", desc: "12 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 12 },
      ]},
      { id: 'gpu-600-series', name: "Radeon 600 Series", years: "2019", color: '#a855f7',
        note: "N/A · RDNA · GDDR5 · Up to 4 GB", families: [
        { name: "RX 640 · 630 · 625 · 620 · +1 more", key: "600 Series", desc: "5 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 5 },
      ]},
      { id: 'gpu-rx-500x-series', name: "Radeon RX 500X Series", years: "2018", color: '#c084fc',
        note: "N/A · RDNA · GDDR5 · Up to 8 GB", families: [
        { name: "RX 580X · RX 570X · RX 560X · RX 550X · +1 more", key: "RX 500X Series", desc: "5 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 5 },
      ]},
      { id: 'gpu-500x-series', name: "Radeon 500X Series", years: "2018", color: '#ef4444',
        note: "N/A · RDNA · GDDR5 · Up to 4 GB", families: [
        { name: "550X · 540X", key: "500X Series", desc: "2 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 2 },
      ]},
      { id: 'gpu-500-series', name: "Radeon 500 Series", years: "2017", color: '#3b82f6',
        note: "N/A · RDNA · GDDR5 · Up to 4 GB", families: [
        { name: "540 · 535 · 530 · 520", key: "500 Series", desc: "4 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 4 },
      ]},
      { id: 'gpu-rx-vega-series', name: "Radeon RX Vega Series", years: "2017", color: '#6366f1',
        note: "N/A · RDNA · HBM2 · Up to 16 GB", families: [
        { name: "VII · RX Vega 64 Liquid Cooled · RX Vega 64 · RX Vega 56", key: "RX Vega Series", desc: "4 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 4 },
      ]},
      { id: 'gpu-rx-500-series', name: "Radeon RX 500 Series", years: "2017", color: '#c084fc',
        note: "N/A · RDNA · GDDR5 · Up to 8 GB", families: [
        { name: "RX 590 · RX 580 · RX 580 (OEM) · RX 570 (OEM) · +5 more", key: "RX 500 Series", desc: "9 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 9 },
      ]},
      { id: 'gpu-rx-400-series', name: "Radeon RX 400 Series", years: "2016", color: '#22c55e',
        note: "N/A · RDNA · GDDR5 · Up to 4 GB", families: [
        { name: "RX 480 · RX 470 · RX 460", key: "RX 400 Series", desc: "3 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 3 },
      ]},
      { id: 'gpu-r9-fury-series', name: "Radeon R9 Fury Series", years: "2015", color: '#22c55e',
        note: "N/A · RDNA · High Bandwidth Memory (HBM) · Up to 4 GB", families: [
        { name: "R9 Fury X · R9 Fury · R9 Nano", key: "R9 Fury Series", desc: "3 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 3 },
      ]},
      { id: 'gpu-r9-300-series', name: "Radeon R9 300 Series", years: "2015", color: '#14b8a6',
        note: "N/A · RDNA · GDDR5 · Up to 8 GB", families: [
        { name: "R9 390X · R9 390 · R9 380X · R9 380 · +11 more", key: "R9 300 Series", desc: "15 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 15 },
      ]},
      { id: 'gpu-r7-300-series', name: "Radeon R7 300 Series", years: "2015", color: '#06b6d4',
        note: "N/A · RDNA · GDDR5 · Up to 4 GB", families: [
        { name: "R7 370 · R7 360 · R7 M380 · R7 M375 · +6 more", key: "R7 300 Series", desc: "10 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 10 },
      ]},
      { id: 'gpu-r5-300-series', name: "Radeon R5 300 Series", years: "2015", color: '#0ea5e9',
        note: "N/A · RDNA · DDR3 · Up to 4 GB", families: [
        { name: "R5 M335X · R5 M335 · R5 M330 · R5 M320 · +1 more", key: "R5 300 Series", desc: "5 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 5 },
      ]},
      { id: 'gpu-r5-200-series', name: "Radeon R5 200 Series", years: "2014", color: '#0ea5e9',
        note: "N/A · RDNA · None · Up to 4 GB", families: [
        { name: "R5 235 · R5 230 · R5 M255X · R5 M255 · +3 more", key: "R5 200 Series", desc: "7 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 7 },
      ]},
      { id: 'gpu-hd-8000m-series', name: "Radeon HD 8000M Series", years: "2013", color: '#f97316',
        note: "N/A · RDNA · GDDR5 · Up to 4 GB", families: [
        { name: "HD 8970M Series GPU · HD 8870M Series GPU · HD 8850M Series GPU · HD 8830M Series GPU · +8 more", key: "HD 8000M Series", desc: "12 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 12 },
      ]},
      { id: 'gpu-r9-200-series', name: "Radeon R9 200 Series", years: "2013 – 2014", color: '#14b8a6',
        note: "N/A · RDNA · None · Up to 8 GB", families: [
        { name: "R9 295X2 · R9 290X · R9 290 · R9 285 · +12 more", key: "R9 200 Series", desc: "16 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 16 },
      ]},
      { id: 'gpu-r7-200-series', name: "Radeon R7 200 Series", years: "2013 – 2014", color: '#06b6d4',
        note: "N/A · RDNA · None · Up to 4 GB", families: [
        { name: "R7 265 · R7 260X · R7 260 · R7 250X · +8 more", key: "R7 200 Series", desc: "12 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 12 },
      ]},
      { id: 'gpu-hd-7000-series', name: "Radeon HD 7000 Series", years: "2012", color: '#f59e0b',
        note: "5/6 nm · RDNA 3 · None · Up to 3 GB", families: [
        { name: "HD 7990 · HD 7970 GHz Edition · HD 7970 · HD 7950 · +6 more", key: "HD 7000 Series", desc: "10 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA 3", n: 10 },
      ]},
      { id: 'gpu-hd-6000-series', name: "Radeon HD 6000 Series", years: "2010 – 2011", color: '#84cc16',
        note: "7 nm · RDNA 2 · None · Up to 2 GB", families: [
        { name: "HD 6970 · HD 6950 · HD 6870 · HD 6850 · +5 more", key: "HD 6000 Series", desc: "9 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA 2", n: 9 },
      ]},
      { id: 'gpu-hd-5000-series', name: "Radeon HD 5000 Series", years: "2009", color: '#a855f7',
        note: "7 nm · RDNA · None · Up to 2 GB", families: [
        { name: "ATI HD 5970 · ATI HD 5870 · ATI HD 5850 · ATI HD 5830 · +5 more", key: "HD 5000 Series", desc: "9 models", tier: 'Radeon', seg: 'Consumer', si: "RDNA", n: 9 },
      ]},
    ]
  }
};

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
 * CPU tabs read amd-cpu-specs.json keyed by codename; the GPU tab reads the
 * models array out of amd-gpu-data.json. Both are already loaded by
 * script.js — this reuses them rather than re-fetching.
 */
function a2Models(name) {
  if (a2Tab === 'gpu') {
    const fam = (a2Specs.gpu || []).find(e => e.arch === name);
    return (fam && fam.gpuSpecs && fam.gpuSpecs.models) || [];
  }
  return (a2Specs.cpu && a2Specs.cpu[name]) || [];
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

function a2Count(name) {
  const n = a2Models(name).length;
  return n ? `${n} model${n === 1 ? '' : 's'}` : 'awaiting data';
}

function a2Rows(name, colspan) {
  const models = a2Models(name);
  const fields = A2_FIELDS[a2Tab];
  if (!models.length || !fields) {
    return `<tr class="v2-empty-row"><td colspan="${colspan}">No spec data yet</td></tr>`;
  }
  return models.map(m => '<tr>' + fields.map((f, i) =>
    `<td class="${i === 0 ? 'cpu-model-name' : ''}">${escHtml(m[f] ?? '—')}</td>`
  ).join('') + '</tr>').join('');
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
  const bar = dom.filterControls;

  // Keep `controls` -- the responsive collapse rules target it. Assigning
  // className alone would drop it and break the narrow-screen disclosure.
  bar.className = 'controls filter-bar';
  // Core count leads: it is the filter most used in practice, so it gets
  // the top of the rail ahead of the generation/series chips.
  bar.innerHTML = coreRangeHtml('a2core', a2Core) + cfg.filters.map(g => {
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
    models.push(...a2Models(a2Key(f)))));
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
  const tiers = key === 'tier' ? new Set([tag]) : (a2Active.tier || new Set());
  const segs  = key === 'seg'  ? new Set([tag]) : (a2Active.seg  || new Set());
  const q = a2Search.trim().toLowerCase();
  let n = 0;
  document.querySelectorAll('.arch-group').forEach(group => {
    if (gens.size && !gens.has(group.dataset.gen)) return;
    const hit = [...group.querySelectorAll('.sku-card')].some(card =>
      a2CoreOk(card) &&
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
  const hay   = [g.name, g.note, ...g.families.flatMap(
                    f => [f.name, f.key || '', f.desc, f.si || ''])]
                  .join(' ').toLowerCase();

  // Brand-line display order. Datacenter-leaning tiers lead, per golden rule #2.
  const order = ['Instinct', 'Radeon PRO', 'Radeon',
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

  const total = g.families.reduce((s, f) => s + (a2Models(a2Key(f)).length || f.n), 0);
  const mix = groupBy.length > 1
    ? groupBy.map(t => `${g.families.filter(f => a2Tiers(f).includes(t)).length} ${t}`).join(' · ')
    : `${g.families.length} codename${g.families.length === 1 ? '' : 's'}`;

  return `
  <div class="arch-group" id="a2-${g.id}" style="--arch-color:${g.color}"
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

/** One codename card plus its spec table. */
function a2Card(f, g, i, cfg) {
  const id = `a2t-${g.id}-${a2Slug(f.name)}`;
  const cols = A2_COLUMNS[a2Tab];
  const tags = [...a2Tiers(f), f.seg].filter(Boolean).map(t =>
    `<span class="sku-tag">${escHtml(t)}</span>`).join('');

  return `
    <div class="sku-card has-specs" style="--card-order:${i * 4}"
         data-target="${id}" data-tier="${escHtml(a2Tiers(f).join('|'))}" data-seg="${escHtml(f.seg)}"
         data-cmin="${f.cmin ?? ''}" data-cmax="${f.cmax ?? ''}"
         data-search="${escHtml((f.name + ' ' + (f.key || '') + ' ' + f.desc + ' ' + (f.si || '')).toLowerCase())}"
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
          <span class="cpu-spec-header-title v2-await">${a2Count(a2Key(f))}</span>
        </div>
        <table class="cpu-spec-table">
          <thead><tr>${cols.map(c => `<th>${escHtml(c)}</th>`).join('')}</tr></thead>
          <tbody>${a2Rows(a2Key(f), cols.length)}</tbody>
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
  const gens = sel('gen'), tiers = sel('tier'), segs = sel('seg');
  const q = a2Search.trim().toLowerCase();
  const any = gens.size || tiers.size || segs.size || !coreRangeIsAll(a2Core);

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
    const total = gens.size + tiers.size + segs.size + (coreRangeIsAll(a2Core) ? 0 : 1);
    badge.textContent = total;
    badge.hidden = total === 0;
  }

  let shownGens = 0, shownCards = 0;

  document.querySelectorAll('.arch-group').forEach(group => {
    const genOk = !gens.size || gens.has(group.dataset.gen);
    let visible = 0;

    group.querySelectorAll('.sku-card').forEach(card => {
      const ok = genOk
        && a2CoreOk(card)
        && (!tiers.size || a2CardTiers(card).some(t => tiers.has(t)))
        && (!segs.size  || segs.has(card.dataset.seg))
        && (!q || card.dataset.search.includes(q) || group.dataset.search.includes(q)
             || a2SpecMatch(card.dataset.target, q));
      card.classList.toggle('hidden', !ok);
      const w = document.getElementById(card.dataset.target);
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

  a2Highlight(q);

  const st = document.getElementById('a2Status');
  if (st) st.textContent =
    `${shownGens} series · ${shownCards} codename${shownCards === 1 ? '' : 's'}`;
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
  a2Tab = tab;
  a2Expanded.clear();
  a2Search = '';
  dom.searchInput.value = '';
  for (const k of Object.keys(a2Active)) delete a2Active[k];

  document.querySelectorAll('.a2-subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));

  a2BuildCoreRange();
  a2BuildFilters();
  a2Render();
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
