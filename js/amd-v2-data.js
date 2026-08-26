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
    blurb: 'Data center processors — ordered by EPYC series',
    filters: [
      { label: 'Series', key: 'gen', tags: [
        ["EPYC 9006 Series", '#ec4899'],
        ["EPYC 9005 Series", '#ef4444'],
        ["EPYC 9004 / 8004 Series", '#f97316'],
        ["EPYC 7003 Series", '#84cc16'],
        ["EPYC 7002 Series", '#14b8a6'],
        ["EPYC 7001 Series", '#c084fc'],
      ]},
      { label: 'Platform', key: 'tier', tags: [
        ['Performance', '#ef4444'], ['Density', '#14b8a6'], ['Edge', '#c084fc']
      ]},
      { label: 'Socket', key: 'seg', tags: [
        ['SP7', '#f97316'], ['SP8', '#fb923c'], ['SP5', '#ef4444'],
        ['SP6', '#f59e0b'], ['SP3', '#a78bfa']
      ]}
    ],
    gens: [
      { id: 'epyc9006', name: "EPYC 9006 Series", years: '2026', color: '#ec4899',
        note: "Venice · Zen 6 · SP7 / SP8", families: [
        { name: "Venice SP7", desc: "Zen 6 — 9 models", tier: 'Performance', seg: 'SP7', si: "Zen 6", n: 9 },
        { name: "Venice SP8", desc: "Zen 6 — 22 models", tier: 'Performance', seg: 'SP8', si: "Zen 6", n: 22 },
      ]},
      { id: 'epyc9005', name: "EPYC 9005 Series", years: '2024', color: '#ef4444',
        note: "Turin · Zen 5 / Zen 5c · SP5", families: [
        { name: "Turin", desc: "Zen 5 — 22 models", tier: 'Performance', seg: 'SP5', si: "Zen 5", n: 22 },
        { name: "Turin Dense", desc: "Zen 5 — 5 models", tier: 'Density', seg: 'SP5', si: "Zen 5", n: 5 },
      ]},
      { id: 'epyc9004', name: "EPYC 9004 / 8004 Series", years: '2022 – 2023', color: '#f97316',
        note: "Genoa · Bergamo · Siena · Zen 4 / Zen 4c · SP5 / SP6", families: [
        { name: "Genoa", desc: "Zen 4 — 18 models", tier: 'Performance', seg: 'SP5', si: "Zen 4", n: 18 },
        { name: "Genoa-X", desc: "Zen 4 — 3 models", tier: 'Performance', seg: 'SP5', si: "Zen 4", n: 3 },
        { name: "Bergamo", desc: "Zen 4 — 3 models", tier: 'Density', seg: 'SP5', si: "Zen 4", n: 3 },
        { name: "Siena", desc: "Zen 4 — 12 models", tier: 'Edge', seg: 'SP6', si: "Zen 4", n: 12 },
      ]},
      { id: 'epyc7003', name: "EPYC 7003 Series", years: '2021 – 2022', color: '#84cc16',
        note: "Milan · Zen 3 · SP3", families: [
        { name: "Milan", desc: "Zen 3 — 25 models", tier: 'Performance', seg: 'SP3', si: "Zen 3", n: 25 },
        { name: "Milan-X", desc: "Zen 3 — 4 models", tier: 'Performance', seg: 'SP3', si: "Zen 3", n: 4 },
      ]},
      { id: 'epyc7002', name: "EPYC 7002 Series", years: '2019', color: '#14b8a6',
        note: "Rome · Zen 2 · SP3", families: [
        { name: "Rome", desc: "Zen 2 — 25 models", tier: 'Performance', seg: 'SP3', si: "Zen 2", n: 25 },
      ]},
      { id: 'epyc7001', name: "EPYC 7001 Series", years: '2017', color: '#c084fc',
        note: "Naples · Zen · SP3", families: [
        { name: "Naples", desc: "Zen — 14 models", tier: 'Performance', seg: 'SP3', si: "Zen", n: 14 },
      ]},
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  //  RYZEN — client, by product series
  // ─────────────────────────────────────────────────────────────────────────
  ryzen: {
    title: 'AMD Ryzen',
    blurb: 'Desktop, mobile, workstation and handheld — ordered by Ryzen series',
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
      { id: 'rai400', name: "Ryzen AI 400 Series", years: '2026', color: '#ec4899',
        note: "Gorgon Point · Zen 5 + XDNA 2 · Copilot+", families: [
        { name: "Gorgon Point", desc: "Zen 5 — 13 models", tier: 'Ryzen AI', seg: 'Mobile', si: "Zen 5", n: 13 },
      ]},
      { id: 'rai300', name: "Ryzen AI 300 / Max 300 Series", years: '2024 – 2025', color: '#ef4444',
        note: "Strix Point · Strix Halo · Kraken Point · Zen 5 + XDNA 2", families: [
        { name: "Strix Halo", desc: "Zen 5 — 9 models", tier: 'Ryzen AI Max', seg: 'Mobile', si: "Zen 5", n: 9 },
        { name: "Strix Point", desc: "Zen 5 — 6 models", tier: 'Ryzen AI', seg: 'Mobile', si: "Zen 5", n: 6 },
        { name: "Kraken Point", desc: "Zen 5 — 5 models", tier: 'Ryzen AI', seg: 'Mobile', si: "Zen 5", n: 5 },
      ]},
      { id: 'tr9000', name: "Ryzen Threadripper 9000 Series", years: '2025', color: '#f59e0b',
        note: "Shimada Peak · Zen 5 · sTR5", families: [
        { name: "Shimada Peak", desc: "Zen 5 — 9 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 5", n: 9 },
      ]},
      { id: 'r9000', name: "Ryzen 9000 Series", years: '2024 – 2025', color: '#f97316',
        note: "Granite Ridge · Fire Range · Zen 5 · AM5 / FL1", families: [
        { name: "Granite Ridge", desc: "Zen 5 — 14 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 5", n: 14 },
        { name: "Fire Range", desc: "Zen 5 — 3 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 5", n: 3 },
      ]},
      { id: 'tr7000', name: "Ryzen Threadripper 7000 Series", years: '2023', color: '#fbbf24',
        note: "Storm Peak · Zen 4 · sTR5", families: [
        { name: "Storm Peak", desc: "Zen 4 — 9 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 4", n: 9 },
      ]},
      { id: 'r8000', name: "Ryzen 8000 Series", years: '2023 – 2024', color: '#eab308',
        note: "Phoenix · Hawk Point · Dragon Range · Zen 4 · AM5 / FP8", families: [
        { name: "Phoenix", desc: "Zen 4 — 47 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 4", n: 47 },
        { name: "Hawk Point", desc: "Zen 4 — 17 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 4", n: 17 },
        { name: "Dragon Range", desc: "Zen 4 — 11 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 4", n: 11 },
      ]},
      { id: 'r7000', name: "Ryzen 7000 Series", years: '2022 – 2023', color: '#a3e635',
        note: "Raphael · Dragon Range · Phoenix · Rembrandt-R · Barceló-R · Zen 4 / Zen 3+", families: [
        { name: "Raphael", desc: "Zen 4 — 19 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 4", n: 19 },
        { name: "Rembrandt-R", desc: "Zen 3+ — 11 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 3+", n: 11 },
        { name: "Barceló-R", desc: "Zen 3 — 7 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 3", n: 7 },
      ]},
      { id: 'r6000', name: "Ryzen 6000 Series", years: '2022', color: '#84cc16',
        note: "Rembrandt · Zen 3+ · RDNA 2 iGPU · FP7", families: [
        { name: "Rembrandt", desc: "Zen 3+ — 19 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 3+", n: 19 },
      ]},
      { id: 'tr5000', name: "Ryzen Threadripper 5000 Series", years: '2022', color: '#22c55e',
        note: "Chagall · Zen 3 · sWRX8", families: [
        { name: "Chagall", desc: "Zen 3 — 5 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 3", n: 5 },
      ]},
      { id: 'r5000', name: "Ryzen 5000 Series", years: '2020 – 2022', color: '#14b8a6',
        note: "Vermeer · Cezanne · Barceló · Lucienne · Zen 3 · AM4", families: [
        { name: "Vermeer", desc: "Zen 3 — 22 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 3", n: 22 },
        { name: "Cezanne", desc: "Zen 3 — 42 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 3", n: 42 },
        { name: "Barceló", desc: "Zen 3 — 10 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 3", n: 10 },
        { name: "Lucienne", desc: "Zen 2 — 3 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 2", n: 3 },
      ]},
      { id: 'tr3000', name: "Ryzen Threadripper 3000 Series", years: '2019 – 2020', color: '#06b6d4',
        note: "Castle Peak · Zen 2 · sTRX4 / sWRX8", families: [
        { name: "Castle Peak", desc: "Zen 2 — 7 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen 2", n: 7 },
      ]},
      { id: 'r4000', name: "Ryzen 4000 Series", years: '2020', color: '#0ea5e9',
        note: "Renoir · Zen 2 · AM4 / FP6", families: [
        { name: "Renoir", desc: "Zen 2 — 33 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 2", n: 33 },
      ]},
      { id: 'r3000', name: "Ryzen 3000 Series", years: '2019', color: '#6366f1',
        note: "Matisse · Picasso · Dalí · Zen 2 / Zen+ · AM4", families: [
        { name: "Matisse", desc: "Zen 2 — 16 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen 2", n: 16 },
        { name: "Picasso", desc: "Zen+ — 34 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen+", n: 34 },
        { name: "Dalí", desc: "Zen — 10 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen", n: 10 },
      ]},
      { id: 'tr2000', name: "Ryzen Threadripper 2000 Series", years: '2018', color: '#818cf8',
        note: "Colfax · Zen+ · TR4", families: [
        { name: "Colfax", desc: "Zen+ — 4 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen+", n: 4 },
      ]},
      { id: 'r2000', name: "Ryzen 2000 Series", years: '2018', color: '#a78bfa',
        note: "Pinnacle Ridge · Raven Ridge · Zen+ / Zen · AM4", families: [
        { name: "Pinnacle Ridge", desc: "Zen+ — 11 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen+", n: 11 },
        { name: "Raven Ridge", desc: "Zen — 27 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen", n: 27 },
      ]},
      { id: 'tr1000', name: "Ryzen Threadripper 1000 Series", years: '2017', color: '#c084fc',
        note: "Whitehaven · Zen · TR4", families: [
        { name: "Whitehaven", desc: "Zen — 3 models", tier: 'Threadripper', seg: 'Workstation', si: "Zen", n: 3 },
      ]},
      { id: 'r1000', name: "Ryzen 1000 Series", years: '2017', color: '#d8b4fe',
        note: "Summit Ridge · Zen · AM4 · the first Ryzen", families: [
        { name: "Summit Ridge", desc: "Zen — 16 models", tier: 'Ryzen', seg: 'Desktop', si: "Zen", n: 16 },
      ]},
      { id: 'rzseries', name: "Ryzen Z-Series (Handheld)", years: '2023 – 2025', color: '#22d3ee',
        note: "Z1 · Z2 · handheld gaming APUs", families: [
        { name: "Z2", desc: "Zen 5 — 5 models", tier: 'Z-Series', seg: 'Handheld', si: "Zen 5", n: 5 },
        { name: "Z1", desc: "Zen 4 — 2 models", tier: 'Z-Series', seg: 'Handheld', si: "Zen 4", n: 2 },
      ]},
      { id: 'r200', name: "Ryzen 200 / 100 Series", years: '2024 – 2025', color: '#94a3b8',
        note: "Hawk Point Refresh · Mendocino · entry mobile", families: [
        { name: "Hawk Point Refresh", desc: "Zen 4 — 12 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 4", n: 12 },
        { name: "Mendocino", desc: "Zen 2 — 17 models", tier: 'Ryzen', seg: 'Mobile', si: "Zen 2", n: 17 },
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
    blurb: 'Instinct, Radeon PRO and Radeon — ordered by product series',
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
