# Dashboard update queue

Use this file to collect visitor-facing changes across work sessions. Each
pending entry is a candidate for the next **New update** block. Keep the copy
short and plain; the technical details belong in `CHANGELOG.md`.

## Pending publication

### Compare NPU capabilities across AMD and Intel
- Changed: 2026-10-07
- Live: Pending
- Update: NPU TOPS is now standard before L3 Cache wherever ratings are available, covering 126 AMD and 84 Intel processors. Select a value to view its official specification source. Compare keeps NPU and overall AI performance separate and includes the full hardware details. Coverage includes desktop, mobile, PRO, embedded and handheld parts, with previously hidden mobile and embedded models restored to their families. Comparable AMD models also list higher model numbers first within their segment and core-count tier.

### Find architecture guides from any product line
- Changed: 2026-10-05
- Live: Pending
- Update: Architecture guides stay visible across AMD, Intel, and NVIDIA product tabs. Open the EPYC 9005, selected Xeon 6, or GH200 guide while browsing another product line; ChipIndex switches to the relevant section and opens the diagrams. Ampere now has an architecture tab with a clearly marked coming-soon page while its sourced diagrams are prepared.

### Browse earlier public beta upgrades
- Changed: 2026-09-30
- Live: Pending
- Update: The What's new panel now leads with the October 7 benchmark update and keeps dated summaries of public beta 0.0.1 through 0.0.4 below it, so visitors can see what each upgrade added.

### Find OEM platforms from a CPU
- Changed: 2026-09-30
- Live: Pending
- Update: Select the small server icon beside a CPU to see named OEM systems, their socket and memory layout, form factor, size, important configuration limits, and official sources. The expanded source-backed index covers recent EPYC, Xeon, and AmpereOne servers alongside selected Lenovo, Dell, and HP laptops, desktops, and workstations. Fixed regional client models keep their product codes. An empty view clearly means ChipIndex has not verified a platform for that part yet.

### Understand the Grace Hopper architecture
- Changed: 2026-09-30
- Live: Pending
- Update: Open the NVIDIA CPU architecture guide for three GH200 diagrams showing where Grace, Hopper, their memory, and their chip-to-chip link sit. Cleaner CPU and GPU layouts and expanded component definitions trace how requests move through cache, memory, and the interconnect, while distinguishing the full GH100 blueprint from enabled products. Underlined terms in the explanations open short definitions without leaving the diagram.

### Explore public benchmark results
- Changed: 2026-10-07
- Live: Pending
- Update: Compare dated public results by workload in the dark red and black Benchmarks explorer. Expanded SPEC CPU, MLPerf and Blender imports now link 3,862 results to 697 catalog products; source dates and coverage limits appear beside scores. SPEC CPU 2026 test builds, server CPU counts and AI scenarios have separate scales. Clear Rate labels distinguish throughput scores from separate SPEC Speed results. Enterprise charts now identify their model order as a ChipIndex selection of linked server reports, and the report list as an imported subset. Browse client Desktop or Laptop CPUs, see catalog CPU cores and clock speeds beside CPU scores, search, filter, open original reports, and compare up to three results. The source directory explains what is imported and why other public scores may be absent. Benchmarks now sits beside Products and Architecture on each vendor page; those tabs open All manufacturers. CPU specification tables retain their original compact columns and row height, with just one Benchmark column at the far right. It shows a short test name beside a sourced score rather than a report count; select it to open that model and test in Benchmarks. The benchmark page links back to the relevant specs. Products and Benchmarks now share the ChipIndex header, section navigation, and What's new history, so moving between specifications and scores feels like one site. The page switch stays aligned with each page's content. Returning from Benchmarks now opens the current Products page with its Benchmarks tab.

### Public beta 0.0.3 and What's new
- Changed: 2026-09-28
- Live: Pending
- Update: The header now shows public beta 0.0.3. What's new covers the selected Xeon 6 architecture guide and the revised EPYC 9005 architecture guide since 0.0.2.

### Explore selected Xeon 6 architectures
- Changed: 2026-09-28
- Live: Pending
- Update: The Intel Xeon tab now includes interactive diagrams for selected Granite Rapids and Sierra Forest designs. Trace P-core and E-core layouts, package dies, memory locality, and platform links; select parts for sourced technical explanations.

### Public beta 0.0.2 and What's new
- Changed: 2026-09-28
- Live: Pending
- Update: The header now shows public beta 0.0.2. What's new summarizes the Ampere tab, announced roadmaps, Xeon 6 family corrections, and EPYC 9005 socket guide refinements since 0.0.1.

### Find Xeon 6 families and core designs
- Changed: 2026-09-28
- Live: Pending
- Update: Xeon 6300P entry-server parts now have their own Raptor Lake-E Refresh card, with the correct Intel 7 and FCLGA1700 platform. Granite Rapids SP shows only its Intel 3 parts. Search Redwood Cove or Crestmont to find the matching Granite Rapids or Sierra Forest core designs; an outdated Sierra Forest placeholder is also gone.

### Manufacturer roadmaps with official sources
- Changed: 2026-09-26
- Live: Pending
- Update: Announced products now lead the relevant AMD, Intel, and NVIDIA product timelines. Each roadmap card links to the manufacturer's own announcement or product material and stays separate from released model counts and comparisons.

### Announced Ampere roadmap
- Changed: 2026-09-26
- Live: Pending
- Update: The announced AmpereOne MX and Aurora products now lead the Ampere timeline in an expandable roadmap section, with a link to official collateral for each.

### Ampere tab readability
- Changed: 2026-09-26
- Live: Pending
- Update: The Ampere header and four-way vendor switcher now fit narrow views cleanly, using Ampere's specified red. Product cards identify a model, specification notes are easier to read, and wider tables and phone comparisons show where to scroll.

### Explore Ampere Computing processors
- Changed: 2026-09-26
- Live: Pending
- Update: Browse Ampere Computing's eMAG, Altra, Altra Max, AmpereOne, and AmpereOne M processors in a new tab. Filter 26 published models by family, memory, and core count; inspect sourced specifications and compare them with other manufacturers. Announced products appear separately on the timeline.

### Public beta 0.0.1 and What's new
- Changed: 2026-09-25
- Live: Pending
- Update: The header now shows public beta 0.0.1. A What's new button opens a short summary of the dashboard improvements made since Tuesday, September 22.

### Explore the EPYC 9005 architecture
- Changed: 2026-09-28
- Live: Pending
- Update: Explore sourced EPYC 9005 diagrams of chiplets, cores, memory, I/O, sockets, and protection. The guide now explains each model before its diagram, distinguishes Zen 5 and Zen 5c NUMA layouts, and includes an acronym key and source library. Select components for plain-language definitions; optional terms open in brief corner notices.

### Clearer comparisons across manufacturers
- Changed: 2026-09-23
- Live: Pending
- Update: Comparisons now line up shared specifications across manufacturers, including newer products, so core counts, clocks, memory, and power appear side by side. Extra vendor details remain available below.

<!-- Add the newest entry first. Example:
### Short title
- Changed: 2026-09-23
- Live: Pending
- Update: You can now ...
-->

### Clearer product comparisons
- Changed: 2026-09-23
- Live: Pending
- Update: Comparison specifications now stay in their own columns, with long values wrapping cleanly and no text spilling beside the row labels when you scroll.

### Easier-to-read text and tables
- Changed: 2026-09-23
- Live: Pending
- Update: Smaller labels and details throughout the dashboard are larger, with extra emphasis on product cards, spec table text, and the labels above tables. Tables have more room between values, and phone controls have more space for their labels.

### Intel dark theme
- Changed: 2026-09-23
- Live: Pending
- Update: Intel now uses a dark dashboard theme with clearer blue and cyan accents across its tabs, filters, product cards, and comparison views. Its Clear Selections button is also available when comparing products.

### Search across every vendor
- Changed: 2026-09-23
- Live: Pending
- Update: Search now finds parts across AMD, Intel, and NVIDIA. Subtle markers show which other tabs have matches, and you can jump there without typing the search again. Part numbers now match only actual products, so a search like B300 points to the NVIDIA GPU without lighting up unrelated tabs.

### EPYC pricing in spec tables
- Changed: 2026-09-23
- Live: Pending
- Update: EPYC specification tables now show AMD's published 1,000-unit price beside each available model, making it easier to compare options without leaving the dashboard.

## Published

<!-- Move an entry here only after confirming its New update block has been
posted (or the owner says no block is needed). Add:
- Posted: YYYY-MM-DD (or Not needed)
-->

_None yet._

## New update block format

Use live pending entries to draft a block like this:

> **New update** · YYYY-MM-DD<br>
> **Short title** — What changed and why it helps visitors.<br>
> **Short title** — What changed and why it helps visitors.

Combine related entries when that makes the announcement easier to scan.
