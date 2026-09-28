# Manufacturer roadmap sources

Reviewed 2026-09-26. `js/roadmap.js` contains the visitor-facing summaries.
These are manufacturer announcements for products or architectures without
released model rows in this dashboard. Timing is a vendor plan, not a release
guarantee. Roadmap cards are excluded from specification filters and comparison.

| Dashboard tab | Roadmap item | Supported claim | Manufacturer collateral |
|---|---|---|---|
| AMD EPYC | Verano | 6th Gen EPYC variant with LPDDR5X SOCAMM2 support, available in 2027 | [AMD server memory roadmap](https://www.amd.com/en/blogs/2026/a-look-ahead--extending-server-energy-efficiency-with-lpddr5x-me.html) |
| AMD EPYC | Florence, Ferrara, Fidenza | Zen 7 EPYC codenames coming in 2028; Ferrara is named for Helios 600 | [AMD Advancing AI 2026](https://ir.amd.com/news-events/press-releases/detail/1294/aai-2026-amd-delivers-full-stack-compute-for-the-agentic-ai-era) |
| AMD EPYC | Ravenna | Zen 8 server CPU named for 2030 | [AMD Advancing AI 2026](https://ir.amd.com/news-events/press-releases/detail/1294/aai-2026-amd-delivers-full-stack-compute-for-the-agentic-ai-era) |
| AMD Ryzen | Ryzen AI Medusa | Upcoming Ryzen AI family in 2027 | [AMD AI PC roadmap](https://www.amd.com/en/blogs/2025/from-momentum-to-market-leadership.html) |
| AMD GPU | Instinct MI430X | HPC and sovereign AI accelerator expected to be available in 2027 | [AMD MI430X product page](https://www.amd.com/en/products/accelerators/instinct/mi400/mi430x.html) |
| AMD GPU | Instinct MI440X | Introduced for enterprise AI; no availability date stated | [AMD CES 2026 announcement](https://ir.amd.com/news-events/press-releases/detail/1272/amd-and-its-partners-share-their-vision-for-ai-everywhere-for-everyone-at-ces-2026) |
| AMD GPU | Instinct MI500, MI600 Series | Series roadmaps for 2027 and 2028 respectively | [AMD Advancing AI 2026](https://ir.amd.com/news-events/press-releases/detail/1294/aai-2026-amd-delivers-full-stack-compute-for-the-agentic-ai-era) |
| Intel Xeon | Diamond Rapids | Next Xeon, Intel 18A-P, up to 256 cores | [Intel Hot Chips 2026](https://www.intel.com/content/www/us/en/newsroom/news/client-computing/intel-outlines-architectures-for-agentic-ai-at-hot-chips-2026.html) |
| Intel Xeon | Coral Rapids | Intel says the later server roadmap will reintroduce multithreading; no availability date stated | [Intel 4Q25 earnings remarks](https://download.intel.com/newsroom/2026/earnings/Intel-4Q2025-Earnings-Call.pdf) |
| Intel Client | Nova Lake | Next client family projected for late 2026 | [Intel 4Q25 earnings remarks](https://download.intel.com/newsroom/2026/earnings/Intel-4Q2025-Earnings-Call.pdf) |
| Intel Graphics | Crescent Island | Data center inference GPU; latest Intel disclosure states Xe3P and up to 480 GB LPDDR5X | [Intel Hot Chips 2026](https://www.intel.com/content/www/us/en/newsroom/news/client-computing/intel-outlines-architectures-for-agentic-ai-at-hot-chips-2026.html) |
| Intel Graphics | Crescent Island sampling | Customer sampling planned in the second half of 2026; this is not a product release date | [Intel GPU announcement](https://www.intel.com/content/www/us/en/newsroom/news/artificial-intelligence/intel-to-expand-ai-accelerator-portfolio-with-new-gpu.html) |
| NVIDIA Data Center | Rubin CPX | Massive-context inference GPU expected at the end of 2026 | [NVIDIA Rubin CPX announcement](https://nvidianews.nvidia.com/news/nvidia-unveils-rubin-cpx-a-new-class-of-gpu-designed-for-massive-context-inference) |
| NVIDIA Data Center | Rubin Ultra | Systems built on Rubin Ultra planned for the second half of 2027 | [NVIDIA GTC 2025](https://blogs.nvidia.com/blog/nvidia-keynote-at-gtc-2025-ai-news-live-updates/) |
| NVIDIA Data Center | Feynman | Future architecture announced after Vera Rubin; 2028 roadmap placement | [NVIDIA GTC 2026 recap](https://blogs.nvidia.com/blog/gtc-2026-news/), [roadmap slides](https://images.nvidia.com/nvimages/gtc/pdf/GTC26_SanJose_Highlights_Final.pdf) |
| NVIDIA CPU | Rosa | New CPU announced for the Feynman generation; 2028 roadmap placement | [NVIDIA GTC 2026 recap](https://blogs.nvidia.com/blog/gtc-2026-news/), [roadmap slides](https://images.nvidia.com/nvimages/gtc/pdf/GTC26_SanJose_Highlights_Final.pdf) |

## Exclusions and corrections

- AMD EPYC Venice, Ryzen AI Gorgon Point and Instinct MI455X already have
  released model rows in the dashboard. MI430X remains a roadmap card because
  AMD says availability is expected in 2027, despite publishing an overview.
- Intel's prior “Xeon 7” and “Core / Core Ultra Series 4” roadmap labels and the
  separate “Diamond Rapids HBM” variant were not supported by the current
  manufacturer collateral. The Intel cards now use the announced codenames.
- NVIDIA Vera CPU and base Rubin GPU had entered production shipments by
  August 2026, so absence from the local model inventory does not make them
  unreleased roadmap products. See [NVIDIA Q2 FY27 earnings transcript](https://investor.nvidia.com/files/content_files/TRANSCRIPT_-NVIDIA-Corp-NVDA-US-Q2-2027-Earnings-Call-26-August-2026-5_00-PM-ET.pdf).
- No manufacturer-announced future Radeon, GeForce or Threadripper product
  family was sufficiently identified for a card at this review date.
