# ChipIndex Platform Compatibility Program

**Working plan — 2026-09-30. The expanded compatibility snapshot is local and pending publication.**

**Current local revision:** 224 distinct CPU identities, 43 named OEM systems,
749 exact CPU-to-system links, and 68 official source records across six OEMs.
The 9575F search-to-detail path, compact table icon, named-platform view,
source and identity validation, independent review files, and an explicit
unresearched state are implemented. The [coverage report](platforms/COVERAGE.md)
reviews 272 contemporary server CPU identities; 208 have at least one exact
OEM platform entry in this selected snapshot. The remaining 64 are research
gaps, not unsupported products. Client and workstation queues do not yet have
a defensible eligible-product denominator.

**Next execution pass:** Expand exact OEM evidence for unmapped server IDs,
adjudicate held Dell thermal rows and Lenovo Intel CPU-count limits, then
inventory more current client/workstation systems. Begin a dated source-refresh
cycle before describing the index as maintained. None of the local changes
has been committed or published.

## Outcome

From an exact CPU model in ChipIndex, a customer should be able to see which OEM
systems have documented support, then open each system for its name, product
type, socket count, memory-channel information, form factor, physical size,
important configuration restrictions, and the original source. Searching
`EPYC 9575F` should reach the CPU row and its platform view without turning a
search match into a guessed compatibility claim.

This is designed as a maintained **CPU-to-platform evidence index**. It is not a universal
socket-fit matrix, a live configurator, or a promise that a particular system
can be ordered in every region today. A CPU can fit the socket but be barred
by firmware, power delivery, cooling, chassis, GPU, or OEM ordering rules.
Missing evidence means **not yet verified**, never **unsupported**.

The current [catalog identity index](../js/data/benchmark-catalog.json) has
2,393 distinct product identities across 2,414 displayed specification rows.
That all-product count is not this program's coverage denominator: it includes
older CPUs and GPUs. The current [eligibility inventory](platforms/ELIGIBILITY.json)
derives a smaller, explicit contemporary server set. Keep duplicate placements
of one product separate from genuinely different same-name variants.

## Scope and order

| Lane | First-pass inclusion | Deliberate boundary |
| --- | --- | --- |
| AMD servers | EPYC 9004 (Genoa, Genoa-X, Bergamo), 9005 (Turin), and officially listed 9006 (Venice); contemporary EPYC 8004/8005 and 4004/4005 systems | EPYC 7003 and earlier are outside the server pass. A CPU may enter the eligible inventory from an official exact product listing; its platform edge still requires separate exact OEM evidence. |
| Intel servers | 4th and 5th Gen Xeon Scalable, Xeon 6 and 6+ models represented in ChipIndex | Xeon 3 and earlier are outside the server pass. Xeon D and embedded lines need a separate contemporary-family review, not a broad date guess. |
| Ampere servers | AmpereOne and AmpereOne M exact SKUs where OEM evidence exists | Altra and eMAG are outside the initial server pass even if still deployed. |
| NVIDIA CPU systems | Current Grace CPU, Grace Hopper, and Grace Blackwell CPU-bearing modules represented on the NVIDIA CPU tab | Record module/system validation. Do not describe an integrated superchip as a field-installable socket CPU. GPU-only tab coverage is a later linked lane. |
| Client and workstation | Current OEM desktop, laptop, mobile workstation, and tower workstation models with a named CPU option; prioritize current Ryzen, Ryzen AI, Threadripper PRO, Core Ultra, and contemporary Xeon W lines | No attempt to map every historical client SKU. An older CPU can be included if a currently documented OEM platform still offers it; launch year alone neither includes nor excludes it. |
| GPU chassis and blades | CPU-bearing GPU servers, blades, and modular nodes within the server generation boundary | Preserve the CPU-to-system edge and add a separate GPU-to-system edge later. Do not infer GPU support from available PCIe slots. |

Start the server pass with EPYC 9004/Genoa generation, then apply the comparable
generation boundary to the other CPU vendors. For client, “current” is an OEM
catalog and documentation review state, not a fixed two-year cutoff. Record
withdrawn or end-of-sale evidence when found; do not derive it from age. Keep
HPE server systems and HP Inc. client systems as separate manufacturers.

## Evidence vocabulary shown to the visitor

| State | Minimum evidence | May count as an exact supported platform? |
| --- | --- | --- |
| **Exact SKU listed** | OEM processor-option table, compatibility list, configurator, or model specification names the CPU in the named system. Capture applicable conditions. | **Yes**, with the source and conditions visible. |
| **OEM fixed configuration** | An OEM product page or order code names both this CPU and this exact system configuration. | **Yes**, as an exact pairing; never present it as a freely interchangeable processor option. |
| **Family documented** | OEM names a CPU series or platform family, but not this exact model. | **No**. Show “family listed; exact SKU unverified” only if useful. |
| **Configuration observed** | Case study, certification, or independent published system disclosure identifies the exact CPU and system without an OEM ordering record. | **No** as a general support claim. Show it as a documented configuration. |
| **Explicit exclusion** | OEM states that the exact CPU or configuration is unavailable or incompatible. | **No**. Record the restriction and its effective document/version. |
| **Not reviewed / no verified match** | No qualifying source has been recorded, or a scheduled OEM pass found no match. | **No**. Never render this as “unsupported.” |

Where a source lists only `EPYC 9005` or `AmpereOne M`, treat it as family
evidence even if the CPU package, TDP, and memory channels appear to fit. A
platform's maximum socket count is not proof that every CPU option permits
that count. “1P / 2P” is a CPU capability; a particular OEM platform may have
stricter rules. Product pages, QuickSpecs, processor option tables, service
manuals, and support matrices take precedence over partner marketing lists.

### Small official-source starting set

These links establish research patterns, not comprehensive OEM coverage:

| Source | What this first review establishes | Display treatment |
| --- | --- | --- |
| [Lenovo ThinkSystem SR665 V3 Product Guide](https://lenovopress.lenovo.com/lp1608-thinksystem-sr665-v3-server) | The processor options table names EPYC 9575F and says 1 or 2 processors; the guide describes SR665 V3 as a 2U system with 12 memory channels per processor. Its configuration sections also contain cooling and ambient-temperature qualifications to capture during extraction. | Candidate **exact SKU listed** edge after recording the relevant option row and restrictions. |
| [HPE ProLiant DL385 Gen11 QuickSpecs](https://www.hpe.com/fi/en/collaterals/collateral.a50004300enw.html) | The processor-option list names an EPYC 9575F kit for DL385 Gen11. | Candidate **exact SKU listed** edge; review the current QuickSpecs version and kit/configuration notes before publication. |
| [Lenovo ThinkSystem SR650 V4 Product Guide](https://lenovopress.lenovo.com/lp2127-thinksystem-sr650-v4-server) | Its processor-options section names individual Xeon 6 models and quantity limits. | Template for exact Intel SKU edges; never carry a limit across other SKUs. |
| [Ampere platforms](https://amperecomputing.com/en/products/platforms) and [GIGABYTE R1A3-T40](https://www.gigabyte.com/Enterprise/Rack-Server/R1A3-T40-AAV1) | These name an AmpereOne M 1U system with one socket and 12 DDR5 channels, but the cited system page does not identify an exact A-series CPU SKU. | **Family documented** only until an OEM CPU list names the exact SKU. |
| [Lenovo ThinkPad T14 Gen 6 (AMD) PSREF](https://psref.lenovo.com/syspool/Sys/PDF/ThinkPad/ThinkPad_T14_Gen_6_AMD/ThinkPad_T14_Gen_6_AMD_Spec.html) | The processor table names Ryzen AI 7 PRO 350 in this laptop family. | Candidate exact client model edge, with regional model/ordering detail checked separately. |
| [NVIDIA-Certified Systems](https://docs.nvidia.com/certification-programs/latest/nvidia-certified-systems.html) | Lists validated Grace and Grace Hopper partner systems/modules. | **Validated system** evidence; check the OEM's own system guide before saying an exact CPU/module is an OEM option. |

Source pages can change in place. Each extracted fact must retain the document
title, URL, revision or publication date where given, retrieval date, table or
section, and a short evidence excerpt or row identifier. The source link in
the product view must open the supporting page or document, not a generic OEM
home page. These examples require the normal extraction and review gates
before becoming site data.

## Data contract to build before bulk research

Maintain three related records and a research queue; generate a compact
read-only JSON snapshot for the static site.

1. **Product identity:** stable catalog ID, vendor, exact model, source product
   ID when available, display placements, and reviewed eligibility lane. Use
   the existing catalog IDs rather than joining solely on display name.
2. **Platform identity:** OEM, canonical product name, model/machine type and
   revision, system category (rack server, blade, GPU server, tower, desktop,
   laptop, workstation, integrated module), product URL, and regional or
   generation variant. Record chassis height in U and physical W × H × D in
   millimetres when sourced; leave either blank when absent. Store socket
   capacity, DIMM slots, and **platform-exposed channels per CPU** separately
   from the CPU's own memory-channel capability.
3. **Evidence edge:** product ID, platform ID, evidence state, exact source
   URL/document version, retrieved date, source location, source wording,
   reviewer, and any BIOS, heatsink, liquid-cooling, PSU, ambient-temperature,
   GPU, one/two-socket, or region qualifier. Multiple sources may support one
   edge; conflicting sources stay visible for adjudication rather than being
   overwritten.
4. **Research queue:** OEM/product line, candidate platform, eligible CPU
   family, search date, outcome (`unreviewed`, `matched`, `family-only`,
   `explicit exclusion`, `no qualifying source`, or `needs adjudication`),
   owner, and next check. This makes “not researched” distinct from “searched
   and not found.”

Normalize OEM model aliases and kit part numbers, but retain exact source
strings. A platform product family, a chassis revision, and an orderable
configuration may need distinct records. Do not use a benchmark result as a
substitute for an OEM option list. Store memory channels per CPU and per
system as separate fields and label the one actually shown. Field values
without a qualifying source remain blank, rather than being filled from the
CPU datasheet or a related chassis.

## OEM-by-OEM research pass

For each OEM, work **from the system to its supported CPUs**, then reverse the
approved edges for the CPU detail view. This prevents an open-ended web
search for every individual SKU.

1. Inventory current and recent in-scope system families from the OEM catalog.
   Record model/revision, server or client lane, and source document versions.
2. Fetch the OEM's processor option list, QuickSpecs, PSREF, compatibility
   page, configurator, or platform support PDF. Record each named CPU and
   qualification exactly. Family-only pages enter the queue without exact
   edges.
3. Extract the system's socket count, rack units or chassis dimensions,
   memory-channel layout, and form factor from the same guide or another
   official system document. Keep max capacity separate from an installed
   configuration.
4. Match each named CPU to one catalog product identity using product number,
   full model and vendor. Put ambiguous OEM suffixes, duplicate names, and
   module variants in adjudication. Never silently fuzzy-match them.
5. Have a second reviewer check exact SKU, system revision, source context,
   constraints, and link. Then publish only approved edges in the next dated
   snapshot.
6. Log the document version and recheck cadence. Re-review when an OEM guide
   changes, a SKU appears or is removed, or a customer flags a mismatch.

| OEM lane | First source path and special check |
| --- | --- |
| **Dell Technologies** | PowerEdge technical guides, processor specs, and service manuals; then Dell Pro/Precision model specifications. Separate a family-level PowerEdge claim from exact configured CPU options and review cooling/firmware dependencies. |
| **HPE** | ProLiant and HPE Cray QuickSpecs, option kits, and configuration notes. Check exact kit part numbers, socket limitations, and cooling. |
| **Lenovo** | ThinkSystem Product Guides and supported processor option tables; PSREF for ThinkPad/ThinkCentre/ThinkStation and regional machine types. Lenovo guides are strong candidates for a repeatable structured extraction pass. |
| **HP Inc.** | EliteBook, ProBook, EliteDesk, ZBook, and Z workstation QuickSpecs/model specifications. Keep it separate from HPE. |
| **Supermicro, GIGABYTE/Giga Computing, ASUS, ASRock Rack and similar system builders** | Begin with system CPU-support lists and revision-specific specifications. A motherboard support list does not automatically certify every chassis built around it. |
| **Ampere and NVIDIA ecosystem discovery** | Use [Ampere's platform directory](https://amperecomputing.com/en/products/platforms) and [NVIDIA-Certified Systems](https://docs.nvidia.com/certification-programs/latest/nvidia-certified-systems.html) to find OEM models, then check the OEM's own guide for exact SKU/module and system details. Distinguish certification from orderability. |

Add another OEM when its first system pass yields a maintained official source
and a reviewer can own updates. Track OEMs with no qualifying public source
without implying that they have no supported systems.

## Delivery phases and gates

### 0. Inventory and schema

- Derive the eligible CPU denominator by vendor/lane from the catalog, with a
  reviewed exception list for embedded and current-client cases. Record the
  count and cutoff rule with the generated snapshot.
- Define platform and evidence IDs, source requirements, link checks,
  duplicate/alias tests, and a manual adjudication file. Select a document
  revision policy for pages that update in place.
- Gate: every candidate edge has a stable exact CPU identity and a named
  platform; no platform row is created from a socket match alone.

### 1. Vertical pilot: 9575F plus cross-vendor cases

- Research EPYC 9575F across Lenovo, HPE, and Dell to demonstrate
  exact-list and fixed-configuration evidence; add one exact Intel Xeon 6
  case, one current AMD client laptop, one current Intel client desktop,
  and an exact AmpereOne X OEM QVL case. Add a Grace module/system case if the OEM
  source supports an unambiguous identity.
- Build the CPU detail interaction against this sparse reviewed dataset: a
  compact server icon beside the exact model, a summary by system
  category/OEM, and an expandable named-platform detail. Show evidence state,
  conditions, document date, and source link. An empty result says “No
  verified platform entries yet” with the checked scope/date where known.
- Gate: all public **exact** edges cite an exact OEM SKU option; the 9575F
  path works from search through the named platform detail; the platform
  action does not also select the CPU for comparison.

### 2. Server coverage by OEM

- Complete one OEM family at a time: Lenovo, HPE, Dell, then the system
  builders and Ampere/NVIDIA partners. Within each, cover EPYC 9004/9005,
  Xeon 4/5/6, AmpereOne+, and contemporary CPU-bearing modules where that
  OEM offers them. Reuse the same parser and review template, but do not
  publish newly parsed matches automatically.
- Add blades, multi-node systems, GPU servers, and liquid-cooled revisions as
  distinct configurations when the OEM treats them differently. Capture
  restrictions that change CPU availability.
- Gate: every published row has source-backed identity and category; absent
  high-level specs are blank; research outcomes are logged for every system
  in that OEM's enumerated source inventory.

### 3. Client and workstation coverage

- Inventory current laptop, desktop, mobile workstation, and workstation
  tower families at Lenovo, HP Inc., Dell, and other priority OEMs. Extract
  exact CPU options and model/chassis variants; check regional product pages
  before marking an option currently orderable.
- Gate: desktop/laptop/workstation labels come from the OEM system type;
  identical CPU names in distinct source products stay separate; the UX
  handles many notebook variants without burying the named product family.

### 4. Upkeep and adjacent GPU path

- Reconcile OEM document revisions on a scheduled cadence and on customer
  reports. Preserve historical evidence and withdrawal dates.
- Add accelerator-to-GPU-chassis relationships as a separate graph once the
  CPU path and its evidence rules are stable. A GPU server can then show both
  CPU and GPU evidence without implying every combination is supported.
- Gate: expired links, changed option tables, and explicit removals enter a
  review queue before the next public snapshot.

## Coverage and quality report

Publish a small dated coverage report with every data snapshot. Compute these
separately for AMD server, Intel server, Ampere server, NVIDIA CPU modules,
client laptops, client desktops, and workstations:

- **Eligible CPU identities:** reviewed count inside this program's scope,
  never the entire 2,393-product ChipIndex catalog.
- **Exact mapped CPUs:** unique eligible products with at least one approved
  exact OEM SKU/platform edge. Report both numerator and denominator.
- **Platform breadth:** distinct OEMs and canonical platform models with
  exact edges; count chassis revisions separately only when they change
  compatibility.
- **Evidence mix:** exact SKU, OEM fixed configuration, family-only, observed configuration, explicit
  exclusion, no qualifying source, and unreviewed counts. Do not add these
  into a single “supported” number.
- **OEM pass progress:** named systems inventoried, documents reviewed,
  pending adjudications, and last review date for each OEM/product line.
- **Detail completeness:** share of exact edges with sourced socket count,
  form factor, memory channels, physical dimensions or rack height, and
  configuration notes. “Unknown” is acceptable and visible.

Only calculate a coverage percentage against a reviewed eligible CPU set.
“Zero verified platforms” is a statement about the current snapshot, not a
statement that the CPU has zero compatible systems. Never infer worldwide
completeness from the OEMs researched so far.

## Verification before a site release

The data validator should reject broken URLs, missing retrieval dates, absent
catalog IDs, duplicate platform aliases, unapproved exact-SKU joins, and
unlabelled family-level claims. Review ten random approved edges per OEM pass
against their source rows, plus **all** exceptions, restrictions, and
same-name collisions. Reconcile each extracted field to the OEM document,
not to a rendered page or a third-party summary.

The browser check should cover exact search (`9575F`), vendor/tab navigation,
keyboard and touch operation, comparison-selection isolation, focus return
from the detail view, empty/family-only states, source links, and layout at
320px, 390px, tablet, and desktop widths. Follow the dashboard's
[design system](DESIGN-SYSTEM.md): dark surfaces, mono data labels, existing
vendor accents, restrained motion, and readable source hierarchy. Run the
existing dashboard smoke and layout audit after implementation, then inspect
screenshots. Keep the visitor-facing update in [UPDATE-QUEUE.md](UPDATE-QUEUE.md)
pending until the UI is published; this plan alone is not a site change.

## Working split

Use four coordinated lanes with one integration owner: (1) catalog and data
schema/validator, (2) server OEM evidence, (3) client/workstation OEM evidence,
and (4) UX/accessibility and browser QA. Researchers hand off source rows and
qualifiers, not prose-only assertions. The integration owner adjudicates
identity conflicts, controls the dated snapshot, and publishes a coverage
report alongside each release. A small pilot comes first so extraction and
display rules can be corrected before the OEM inventory becomes large.
