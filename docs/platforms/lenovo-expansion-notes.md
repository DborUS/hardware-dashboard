# Lenovo server platform expansion — research handoff

Reviewed 2026-09-30. This is **candidate data**, pending a second reviewer and
integration into `js/data/platform-compatibility.json`. The machine-readable
source rows and exact catalog joins are in
[`lenovo-expansion-candidates.json`](lenovo-expansion-candidates.json).
An unlisted CPU/system pair is unverified, not unsupported or unavailable.

## Reviewed systems

| Lenovo system | Type and size | Sockets | Channels per CPU | DIMM slots | Exact source rows | ChipIndex joins | Official guide |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| ThinkSystem SR635 V3 | 1U rack | 1 | 12 | 12 | 45 | 45 | [LP1609](https://lenovopress.lenovo.com/lp1609-thinksystem-sr635-v3-server), Tables 13–14 |
| ThinkSystem SR645 V3 | 1U rack | 2 | 12 | 24 | 46 | 46 | [LP1607](https://lenovopress.lenovo.com/lp1607-thinksystem-sr645-v3-server), Tables 15–16 |
| ThinkSystem SR655 V3 | 2U rack | 1 | 12 | 12 | 45 | 45 | [LP1610](https://lenovopress.lenovo.com/lp1610-thinksystem-sr655-v3-server), Tables 12–13 |
| ThinkSystem SR665 V3 | 2U rack | 2 | 12 | 24 | 48 | 48 | [LP1608](https://lenovopress.lenovo.com/lp1608-thinksystem-sr665-v3-server), Tables 14–15 |
| ThinkSystem ST45 V3 | Tower | 1 | 2 | 2 | 8 | 8 | [LP1994](https://lenovopress.lenovo.com/lp1994-thinksystem-st45-v3-server), Table 14 |
| ThinkEdge SE455 V3 | 2U short-depth rack | 1 | 6 | 6 | 12 | 12 | [LP1724](https://lenovopress.lenovo.com/lp1724-thinkedge-se455-v3-server), Table 11 |
| ThinkSystem SD535 V3 | Half-width 1U node in 2U D3 chassis | 1/node | 12 | 12/node | 50 | 50 | [LP1892](https://lenovopress.lenovo.com/lp1892-thinksystem-sd535-v3-server), Tables 7–8 |
| ThinkSystem SR630 V3 | 1U rack | 2 | 8 | 32 | 86 | 85 | [LP1600](https://lenovopress.lenovo.com/lp1600-thinksystem-sr630-v3-server), Tables 13–14 |
| ThinkSystem SR650 V3 | 2U rack | 2 | 8 | 32 | 86 | 85 | [LP1601](https://lenovopress.lenovo.com/lp1601-thinksystem-sr650-v3-server), Tables 18–19 |
| ThinkSystem SR630 V4 | 1U rack | 2 | 8 | 32 | 34 | 34 | [LP1971](https://lenovopress.lenovo.com/lp1971-thinksystem-sr630-v4-server), Tables 15–16 |
| ThinkSystem SR650 V4 | 2U rack | 2 | 8 | 32 maximum | 27 | 27 | [LP2127](https://lenovopress.lenovo.com/lp2127-thinksystem-sr650-v4-server), Table 13 |

**Result:** 487 exact processor-option rows, 485 joins to 189 distinct ChipIndex CPU
identities. Two rows for Intel Xeon Platinum **8480CL** (SR630 V3 and SR650 V3)
have no catalog identity and are held in `unmappedRows`. The Lenovo source names
them; do not substitute a similar 8480 model.

## Configuration qualifiers to preserve

- SR645 V3: 4th Gen EPYC at 320 W or higher requires liquid cooling, both
  processors, configure-to-order assembly, and no field CPU upgrade. Its F and
  X rows generally show a two-CPU quantity; several 5th Gen F rows are also
  CTO only. P-suffix EPYC options are single socket and have no field option
  part number. The candidate retains each row's printed quantity and part.
- SR665 V3: P-suffix EPYC options are single socket and CTO/preconfigured only.
  Other rows may permit one or two processors, as the table states.
- SR630/SR650 V3: `1*` Intel rows are single-socket-capable options available
  only in CTO or preconfigured builds, not field processor kits. The processor
  tables print `2` for many other rows. Their surrounding guidance includes
  both a general one-processor section and an adjacent 4th Gen note saying
  single-processor configurations are unsupported. The candidate leaves exact
  CPU quantity blank for those `2` rows until the configuration scope is
  adjudicated; it still records the exact CPU/system pairing.
- SR630/SR650 V4: `1*` Intel P-core rows are single socket and CTO only, with
  no field upgrade, and are excluded from the Compute Complex Neptune Core
  liquid-cooled machine types 7DK1/7DK2 respectively. SR630 V4 Xeon 6731E
  has its own one-socket CTO/no-field-upgrade note. The two replaced SR630 V4
  option part numbers are represented by their current v2 numbers in the
  candidate. Rows printed `2` also leave exact CPU quantity blank pending
  a Lenovo configuration review.
- SR650 V4: 32 DIMM slots is the standard maximum; Compute Complex Neptune
  Core machine type 7DK2 has 16 slots. Keep this configuration distinction
  visible rather than making 32 universal.
- SE455 V3: the EPYC 8004 table lists single-CPU CTO choices with no field
  processor upgrades. PN suffix options are the NEBS Level 3 choices. The
  separate SE455i V3 inference model needs its own fixed-config review.
- SD535 V3: the platform is a half-width node, not a blade. The D3 enclosure
  holds up to four nodes in 2U. With air cooling, EPYC 9755 or 9965 requires
  high-performance air-cooled node base C63Y.
- ST45 V3: all eight EPYC 4004/4005 rows are CTO or preconfigured choices,
  not field option parts.

## Scope and remaining queue

These eleven guides explicitly cover EPYC 4004/4005, 8004, 9004/9005,
Intel 4th/5th Gen Xeon Scalable, and Xeon 6 P/E models. They do **not** provide
an exact EPYC 8005, EPYC 9006, or Xeon 6+ option row. This is a status of
the reviewed guides, not a Lenovo-wide exclusion. Lenovo's comparison references
are useful for finding other systems, but product-specific processor tables
remain the publishable evidence for an exact pair.

Next Lenovo passes should review [SR675 V3](https://lenovopress.lenovo.com/lp1611-thinksystem-sr675-v3-server),
[SR685a V3](https://lenovopress.lenovo.com/servers/thinksystem-v3/sr685a-v3),
[SR650a/SR650i V4](https://lenovopress.lenovo.com/lp2128-thinksystem-sr650a-v4-server),
[SR680a V4](https://lenovopress.lenovo.com/lp2264-thinksystem-sr680a-v4-server),
[SR850/SR860 V4](https://lenovopress.lenovo.com/lp2230-thinksystem-sr850-v4-server),
and [ST650 V3](https://lenovopress.lenovo.com/lp1604-thinksystem-st650-v3-server),
plus the other SD and ThinkAgile variants. These are **pending**, with no new
edge inferred from a shared socket or family description.

## Verification performed

The candidate export was checked against unique catalog suffixes, source row
SKU text, catalog IDs, platform/socket constraints, source IDs, duplicate
CPU/platform pairs, and a seeded sample of twelve source rows. For 182 Intel
edges whose row prints `2`, `supportedCpuQuantities` is deliberately omitted:
the table establishes the CPU/system pair, while the one-versus-two-CPU build
rule needs its own review. Explicit `1*`, `1`, and AMD `1 or 2`/`2` quantities
are retained. Integration
should review ten random edges plus all exceptional rows directly in Lenovo
Press, then run the site validator and browser smoke. The source pages are
live documents; `documentUpdated` and `retrievedAt` in the candidate record
the revision seen during this pass.
