const C='https://www.cisco.com/c/en/us/products/collateral/';
const R=C+'servers-unified-computing/ucs-c-series-rack-servers/';
const X=C+'servers-unified-computing/ucs-x-series-modular-system/';
const sources={
 catalog:{title:'Cisco UCS C-Series Rack Servers',url:'https://www.cisco.com/site/us/en/products/computing/servers-unified-computing-systems/ucs-c-series-rack-servers/index.html',date:'Reviewed 7 Oct 2026',scope:'Family overview and rack deployment choices',loc:'Models; Frequently asked questions'},
 c220:{title:'Cisco UCS C220 M8 Rack Server Data Sheet',url:R+'ucs-c220-m8-rack-server-ds.html',date:'4 Jun 2026',scope:'Intel 1U server, processors, drives and expansion',loc:'Table 2 · Product specifications'},
 c240:{title:'Cisco UCS C240 M8 Rack Server Data Sheet',url:R+'ucs-c240-m8-rack-server-ds.html',date:'4 Jun 2026',scope:'Intel 2U server, backplanes and GPU limits',loc:'Table 2 · Product specifications'},
 c225:{title:'Cisco UCS C225 M8 Rack Server Data Sheet',url:R+'ucs-c225-m8-rack-server-ds.html',date:'4 Jun 2026',scope:'Single-socket AMD rack platform',loc:'Product overview; Product specifications'},
 c245:{title:'Cisco UCS C245 M8 Rack Server Data Sheet',url:R+'ucs-c245-m8-rack-server-ds.html',date:'16 Mar 2026',scope:'AMD 2U platform and expansion options',loc:'Product overview; Table 1'},
 c845:{title:'Cisco UCS C845A M8 Rack Server Data Sheet',url:R+'ucs-c845a-m8-rack-server-ds.html',date:'24 Aug 2026',scope:'AMD EPYC host CPUs; AMD and NVIDIA PCIe GPUs',loc:'Product overview; Product specifications'},
 c845hw:{title:'Cisco UCS C845A M8 Rack Server Installation and Service Guide — Overview',url:'https://www.cisco.com/c/en/us/td/docs/unified_computing/ucs/c/hw/c845am8/install/b-c845A-m8-hig/m-overview.html',date:'Reviewed 7 Oct 2026',scope:'GPU options and E1.S storage',loc:'Summary of Features'},
 c880:{title:'Cisco UCS C880A M8 Rack Server Data Sheet',url:R+'ucs-c880a-m8-rack-server-ds.html',date:'13 Aug 2026',scope:'Intel Xeon host CPUs with eight NVIDIA B300 GPUs',loc:'Specifications'},
 c885:{title:'Cisco UCS C885A M8 Rack Server Data Sheet',url:R+'ucs-c885a-m8-ds.html',date:'Reviewed 7 Oct 2026',scope:'Dense AI server architecture; apply lifecycle notices separately',loc:'Product specifications'},
 c220gpu:{title:'Cisco UCS C220 M8 Server Installation and Service Guide — GPU Card Installation',url:'https://www.cisco.com/c/en/us/td/docs/unified_computing/ucs/c/hw/c220m8/install/b-cisco-ucs-c220-m8-install/m-gpu-installation.html',date:'1 Sep 2026',scope:'GPU population rules; conflicting Flex 140 reference',loc:'Server Firmware Requirements; GPU Card Configuration Rules'},
 c225gpu:{title:'Cisco UCS C225 M8 Server Installation and Service Guide — GPU Installation',url:'https://www.cisco.com/c/en/us/td/docs/unified_computing/ucs/c/hw/c225m8/install/b-cisco-ucs-c225-m8/m_gpu-installation.html',date:'5 Mar 2026',scope:'NVIDIA L4 qualification and GPU restrictions',loc:'GPU Card Configuration Rules'},
 c885eol:{title:'End-of-Sale and End-of-Life Announcement for the Cisco UCS C885A M8 Rack Servers with AMD MI350X GPUs',url:R+'ucs-c885a-m8-rs-amd-mi350x-gpus-eol.html',date:'20 Aug 2026',scope:'Affected MI350X part numbers; last order 15 Oct 2026',loc:'Tables 1–2 · EOL15967'},
 c885old:{title:'End-of-Sale and End-of-Life Announcement for the Cisco UCS C885A M8 Rack Servers with AMD MI300X and NVIDIA HGX H200 GPUs',url:R+'ucs-c885a-m8-rs-nvidia-hgx-h200-gpus-eol.html',date:'3 Jun 2026',scope:'Affected MI300X and H200 configurations; last order 25 Jun 2026',loc:'Tables 1–2 · EOL15913'},
 x210:{title:'Cisco UCS X210c M8 Compute Node Data Sheet',url:X+'ucs-x210c-m8-compute-node-ds.html',date:'4 Jun 2026',scope:'Intel two-socket modular compute and front-module options',loc:'Main features; Tables 1–2'},
 x215:{title:'Cisco UCS X215c M8 Compute Node Data Sheet',url:X+'ucs-x215c-m8-compute-node-ds.html',date:'12 Oct 2024',scope:'AMD modular compute; fourth and fifth generation EPYC',loc:'Main features; Table 1'},
 x410:{title:'Cisco UCS X410c M8 Compute Node Data Sheet',url:X+'ucs-x410c-m8-compute-node-ds.html',date:'4 Dec 2025',scope:'Four-socket Intel node and memory capacity',loc:'Main features; Tables 1–2'},
 chassis:{title:'Cisco UCS X9508 Chassis Data Sheet',url:X+'datasheet-c78-2472574.html',date:'5 Jan 2026',scope:'7U enclosure, eight slots, IFMs, power and cooling',loc:'Figures 1–2; Table 1'},
 chassisSpec:{title:'Cisco UCS X9508 Chassis Spec Sheet',url:'https://www.cisco.com/c/dam/en/us/products/collateral/servers-unified-computing/ucs-x-series-modular-system/x9508-specsheet.pdf',date:'Reviewed 7 Oct 2026',scope:'IFM versus FI; network connectivity',loc:'Overview · Intelligent Fabric Modules'},
 direct:{title:'Cisco UCS X-Series Direct Data Sheet',url:X+'ucs-x-series-direct-ds.html',date:'10 Jul 2025',scope:'Fabric interconnects inside X9508; supported expansion',loc:'Figure 1; Tables 2, 4'},
 x580:{title:'Cisco UCS X580p PCIe Node Data Sheet',url:X+'ucs-x580p-pcie-node-ds.html',date:'16 Mar 2026',scope:'GPU expansion for X210c M8 or X215c M8; X9516 required',loc:'Product overview; Tables 1–2'},
 xe130:{title:'Cisco UCS XE130c M8 Compute Node',url:'https://www.cisco.com/site/us/en/products/collateral/computing/unified-edge/ucs-xe130c-m8-compute-node-ds.html',date:'3 Nov 2025',scope:'Compact Intel edge node and dedicated L4-class GPU slot',loc:'Models and specifications · Table 1'},
 xe150:{title:'Cisco UCS XE150c M8 Compute Node',url:'https://www.cisco.com/site/us/en/products/collateral/computing/unified-edge/ucs-xe150c-m8-compute-node-ds.html',date:'16 Mar 2026',scope:'Larger edge GPU node in XE9305',loc:'Models and specifications · Table 1'},
 bladeEol:{title:'End-of-Sale and End-of-Life Announcement for the Cisco UCS B200 M6 Blade Server and UCS 5108 Blade Server Chassis',url:C+'servers-unified-computing/ucs-b-series-blade-servers/ucs-b200-m6-5108-blade-server-chassis-eol.html',date:'12 Oct 2025',scope:'Classic blades: last order 31 Dec 2025',loc:'Tables 1–2 · EOL15630'},
 storageEol:{title:'End-of-Sale and End-of-Life Announcement for the Cisco UCS S3260 Storage Server',url:C+'servers-unified-computing/ucs-s-series-storage-servers/ucs-s3260-storage-server-eol.html',date:'20 Aug 2025',scope:'Storage-centric S-Series: last order 3 Feb 2025',loc:'Tables 1–2 · EOL15459'},
 hcl:{title:'Cisco Unified Computing System — Technical References',url:'https://www.cisco.com/c/en/us/support/servers-unified-computing/unified-computing-system/products-technical-reference-list.html',date:'Reviewed 7 Oct 2026',scope:'Hardware/software interoperability and qualification references',loc:'Interoperability documentation'},
 nutanix:{title:'Cisco Compute Hyperconverged with Nutanix — Data Sheets',url:'https://www.cisco.com/c/en/us/products/hyperconverged-infrastructure/compute-hyperconverged/datasheet-listing.html',date:'Reviewed 7 Oct 2026',scope:'Validated Nutanix offerings and compute-only nodes',loc:'Server Data Sheets'}
};
sources.x440={title:'Cisco UCS X440p PCle Node Data Sheet',url:X+'ucs-x440p-pcle-node-ds.html',date:'4 Sep 2024',scope:'PCIe Gen4 expansion, NVIDIA and Intel Flex GPU examples',loc:'Tables 1–2; Product overview'};
sources.policies={title:'Cisco Intersight Policies Solution Overview',url:C+'cloud-systems-management/intersight/intersight-policies-so.html',date:'23 Sep 2025',scope:'Server policies, profiles and management modes',loc:'Executive summary; Policy definitions'};
const models=[
 {id:'c220',name:'C220 M8',family:'Rack',vendor:'Intel',shape:'rack1',tag:'Compact general purpose',cpu:'1 or 2 × Intel Xeon 6',cpuDetail:'Qualified 6500P / 6700P processors',sockets:2,memory:'32 DDR5 DIMM slots',storage:'Up to 10 SFF or 16 E3.S NVMe',drive:['SAS','SATA','NVMe','E3.S'],gpu:'Up to 3 single-wide GPUs; e.g. L4',gpuV:['NVIDIA'],form:'1U rack',job:'A compact server for virtual machines, applications and infrastructure.',note:'SFF and E3.S are different chassis/backplane choices. Slots, drives and GPU maxima are not a single guaranteed configuration.',management:'Cisco IMC and Intersight; validate fabric integration for the chosen release.',sources:['c220'],use:['Virtualization','General compute']},
 {id:'c240',name:'C240 M8',family:'Rack',vendor:'Intel',shape:'rack2',tag:'Storage & expansion',cpu:'1 or 2 × Intel Xeon 6',cpuDetail:'Qualified 6500P / 6700P processors',sockets:2,memory:'32 DDR5 DIMM slots · up to 8 TB',storage:'Up to 28 SFF or 36 E3.S; LFF option',drive:['SAS','SATA','NVMe','E3.S','LFF'],gpu:'Up to 3 double-wide or 8 single-wide',gpuV:['NVIDIA'],form:'2U rack',job:'More room for local drives and expansion cards in a familiar rack server.',note:'RTX PRO 4500 / 6000 Blackwell options are listed; the RTX PRO configuration supports up to three, with the documented power limit. LFF option: up to 16 large drives plus four rear SFF.',management:'Cisco IMC and Intersight; validate fabric integration for the chosen release.',sources:['c240'],use:['Virtualization','Storage','AI inference']},
 {id:'c225',name:'C225 M8',family:'Rack',vendor:'AMD',shape:'rack1',tag:'One socket, dense compute',cpu:'1 × AMD EPYC 9004 / 9005',cpuDetail:'Qualified 4th / 5th Gen EPYC · up to 160 cores',sockets:1,memory:'12 DDR5 DIMM slots · up to 3 TB',storage:'Up to 10 SFF drives',drive:['SAS','SATA','NVMe'],gpu:'Up to 3 NVIDIA L4 GPUs',gpuV:['NVIDIA'],form:'1U rack',job:'A single-socket approach to general-purpose compute and consolidation.',note:'M8S offers SAS/SATA/NVMe choices; M8N is an all-NVMe variant. The older C225 M6 has a different socket design—model generation matters.',management:'Standalone IMC, Intersight or supported UCS Manager deployment.',sources:['c225'],use:['Virtualization','General compute']},
 {id:'c245',name:'C245 M8',family:'Rack',vendor:'AMD',shape:'rack2',tag:'Expandable AMD compute',cpu:'1 or 2 × AMD EPYC 9004 / 9005',cpuDetail:'Qualified 4th / 5th Gen EPYC · up to 160 cores/socket',sockets:2,memory:'24 DDR5 DIMM slots · up to 6 TB',storage:'Up to 28 SFF SAS/SATA/NVMe; up to 8 direct-attached NVMe',drive:['SAS','SATA','NVMe'],gpu:'Up to 8 GPUs, configuration dependent',gpuV:['NVIDIA'],form:'2U rack',job:'Combines two-socket compute with room for drives and accelerator cards.',note:'The data sheet separately lists up to three NVIDIA RTX PRO 4500 Blackwell GPUs. Do not read the eight-GPU ceiling as eight of every supported GPU.',management:'Standalone IMC, Intersight or supported UCS Manager deployment.',sources:['c245'],use:['Virtualization','Storage','AI inference']},
 {id:'c845',name:'C845A M8',family:'AI',vendor:'AMD',shape:'rack4',tag:'Flexible PCIe GPU server',cpu:'2 × AMD EPYC 9005',cpuDetail:'Qualified 5th Gen EPYC',sockets:2,memory:'32 DDR5 DIMM slots · 1DPC / 2DPC',storage:'Up to 20 E1.S NVMe SSDs',drive:['NVMe','E1.S'],gpu:'2, 4, 6 or 8 PCIe GPUs',gpuV:['AMD','NVIDIA'],form:'4U rack',job:'A dedicated accelerator platform with multiple qualified GPU choices.',note:'Examples: AMD Instinct MI210 / MI350P; NVIDIA H200 NVL, L40S and RTX PRO Blackwell. These are alternative qualified configurations, not permission to mix GPU models or vendors.',management:'Intersight integration and onboard BMC; AI networking differs from a standard UCS fabric deployment.',sources:['c845','c845hw'],use:['AI inference','AI training']},
 {id:'c880',name:'C880A M8',family:'AI',vendor:'Intel',shape:'rack10',tag:'Dense HGX B300 system',cpu:'2 × Intel Xeon 6',cpuDetail:'Xeon 6776P or 6767P in the cited specification',sockets:2,memory:'32 DDR5 DIMM slots',storage:'Up to 8 E1.S NVMe SSDs',drive:['NVMe','E1.S'],gpu:'8 × NVIDIA HGX B300 (SXM)',gpuV:['NVIDIA'],form:'10U rack',job:'An integrated eight-GPU platform for large AI workloads.',note:'HGX uses a purpose-built GPU baseboard and high-speed GPU links. Its B300 modules are not ordinary plug-in PCIe GPU cards.',management:'Dedicated AI platform; consult its management and deployment documentation.',sources:['c880'],use:['AI training','AI inference']},
 {id:'c885',name:'C885A M8',family:'AI',vendor:'AMD',shape:'rack8',tag:'Dense AI · lifecycle matters',cpu:'2 × AMD EPYC',cpuDetail:'Qualified processors depend on GPU configuration',sockets:2,memory:'DDR5 · check the exact configuration',storage:'NVMe data and boot storage',drive:['NVMe'],gpu:'8 × MI350X, MI300X or HGX H200; separate variants and lifecycle dates',gpuV:['AMD','NVIDIA'],form:'8U rack',job:'An important dense-AI UCS model to recognize in existing designs.',note:'As of 9 Oct 2026, affected MI350X variants approach their 15 Oct 2026 last-order date; last support is 31 Oct 2029 under the notice terms. Affected MI300X / HGX H200 variants passed last order on 25 Jun 2026. These dates apply to listed part numbers, not every C885A configuration.',management:'Validate model, accelerator, firmware and software as a complete system.',sources:['c885','c885eol','c885old'],use:['AI training'],lifecycle:true},
 {id:'x210',name:'X210c M8',family:'Modular',vendor:'Intel',shape:'node',tag:'Intel modular compute',cpu:'1 or 2 × Intel Xeon 6',cpuDetail:'Up to 86 cores per processor in the data sheet',sockets:2,memory:'32 DDR5 DIMM slots · up to 8 TB',storage:'Up to 6 SFF or 9 E3.S NVMe',drive:['SAS','SATA','NVMe','E3.S'],gpu:'Optional front GPUs or a PCIe node',gpuV:['NVIDIA'],form:'1 slot in X9508',job:'A compute sled that shares chassis power, cooling and fabric connections.',note:'Front GPU module uses a different drive layout: up to two GPUs plus two NVMe drives. X580p expansion requires X9516 X-Fabric modules and a supported pairing.',management:'Intersight Managed Mode; chassis and fabric infrastructure required.',sources:['x210','x580'],use:['Virtualization','General compute','AI inference']},
 {id:'x215',name:'X215c M8',family:'Modular',vendor:'AMD',shape:'node',tag:'AMD modular compute',cpu:'1 or 2 × AMD EPYC 9004 / 9005',cpuDetail:'Qualified 4th / 5th Gen EPYC · up to 160 cores/socket',sockets:2,memory:'24 DDR5 DIMM slots · up to 6 TB',storage:'Up to 6 SFF SAS/SATA/NVMe SSDs',drive:['SAS','SATA','NVMe'],gpu:'Optional front GPUs or a PCIe node',gpuV:['NVIDIA'],form:'1 slot in X9508',job:'Brings AMD processors to the same X-Series chassis family.',note:'Front GPU option changes the storage layout. X580p supports a qualified pairing with this node; AMD CPU support does not imply AMD GPU support in the X580p.',management:'Intersight; other management support depends on firmware and the exact platform combination.',sources:['x215','x580'],use:['Virtualization','General compute','AI inference']},
 {id:'x410',name:'X410c M8',family:'Modular',vendor:'Intel',shape:'wideNode',tag:'Four-socket scale-up',cpu:'4 × Intel Xeon 6',cpuDetail:'Up to 86 cores per processor in the data sheet',sockets:4,memory:'64 DDR5 DIMM slots · up to 16 TB',storage:'Up to 6 SFF or 9 E3.S NVMe',drive:['SAS','SATA','NVMe','E3.S'],gpu:'No GPU claim made in this guide',gpuV:[],form:'2 slots in X9508',job:'A larger shared-memory server for demanding enterprise applications.',note:'Up to four nodes per X9508 chassis. Four CPU sockets belong to one server; they are not four separate servers.',management:'Intersight; verify supported management mode and fabric release.',sources:['x410'],use:['Scale-up databases']},
 {id:'xe130',name:'XE130c M8',family:'Edge',vendor:'Intel',shape:'edge',tag:'Compact edge compute',cpu:'1 × Intel Xeon 6 SoC',cpuDetail:'12, 20 or 32 P-cores',sockets:1,memory:'8 DDR5 DIMM slots',storage:'3 or 4 E3.S NVMe + M.2 boot',drive:['NVMe','E3.S'],gpu:'1 × 75W GPU, such as NVIDIA L4',gpuV:['NVIDIA'],form:'1U half-width node',job:'Compute close to users, devices and data in a short-depth edge chassis.',note:'Lives in the 3U XE9305, which holds up to five XE130c nodes. Storage-optimized and I/O-optimized layouts have different drive counts.',management:'Cisco Intersight; use Unified Edge documentation for release support.',sources:['xe130'],use:['Edge','AI inference']},
 {id:'xe150',name:'XE150c M8',family:'Edge',vendor:'Intel',shape:'edge2',tag:'Edge GPU expansion',cpu:'1 × Intel Xeon 6 SoC',cpuDetail:'20 or 32 P-cores',sockets:1,memory:'8 DDR5 DIMM slots · up to 1 TB',storage:'3 or 4 E3.S NVMe + M.2 boot',drive:['NVMe','E3.S'],gpu:'1 full-height/full-length accelerator',gpuV:['NVIDIA'],form:'2U half-width node',job:'Adds space for larger accelerator cards in the Unified Edge family.',note:'Examples: NVIDIA L40S or RTX PRO 4500 / 6000 Blackwell; RTX PRO 6000 is capped at 450W. Up to two XE150c nodes fit in XE9305.',management:'Cisco Intersight; use Unified Edge documentation for release support.',sources:['xe150'],use:['Edge','AI inference']}
];
models.find(m=>m.id==='c220').sources.push('c220gpu');
models.find(m=>m.id==='c225').sources.push('c225gpu');
models.forEach(m=>m.shape='ucs-'+m.id);
const concepts={
 intersight:{name:'Cisco Intersight',what:'The operations software that inventories equipment and helps apply configurations, updates and policies across servers.',design:'Shown above the hardware because it is a management layer. The dashed line represents management communication, not the path your application data must take.',src:'direct'},
 upstream:{name:'Upstream network',what:'The data-center network connects applications to users, other servers and storage services.',design:'The drawing ends here. Ethernet and optional storage-network connections continue into the wider environment; external storage is not contained in the server chassis.',src:'direct'},
 fi:{name:'Fabric interconnect',what:'A shared network and control point that connects supported UCS servers to the wider network.',design:'A redundant A/B pair is shown. Standard X-Series uses external fabric interconnects. X-Series Direct places this role in the chassis. This is a network role, not a CPU vendor choice.',src:'direct'},
 ifm:{name:'Intelligent Fabric Module (IFM)',what:'A chassis networking module that carries server traffic toward an external fabric interconnect.',design:'Standard X-Series has an A/B pair in the rear of X9508. The IFM and fabric interconnect are different components; an IFM is not the embedded FI used by X-Series Direct.',src:'chassisSpec'},
 chassis:{name:'X9508 chassis',what:'The shared enclosure that holds compute and expansion nodes, supplies power and provides cooling.',design:'This 7U chassis has eight front-facing node slots. The front-like view and networking layer are combined here to show relationships, not exact physical placement.',src:'chassis'},
 compute:{name:'Compute node',what:'A server sled containing processors, memory and local storage. It runs an operating system or hypervisor.',design:'X210c M8 uses Intel CPUs; X215c M8 uses AMD CPUs. Each occupies one X9508 slot. Actual supported combinations depend on fabric modules, firmware, power and cooling.',src:'x215'},
 power:{name:'Shared power and cooling',what:'Power supplies and fans keep the equipment running and within its operating temperature range.',design:'X9508 shares these resources across its nodes. Empty slots, power redundancy, GPU power and cooling requirements all affect a valid configuration.',src:'chassis'},
 xfabric:{name:'X-Fabric',what:'An internal PCIe connection system that links a compute node to a supported expansion node.',design:'Optional GPU expansion is distinct from the Ethernet network fabric. X580p requires X9516 X-Fabric modules and a qualified compute-node pairing.',src:'x580'},
 gpuNode:{name:'PCIe expansion node',what:'A module that holds accelerator cards for a connected compute node; it does not replace the host server.',design:'X580p supports up to four qualified NVIDIA PCIe GPUs and can pair with X210c M8 or X215c M8. Placement and population rules are not shown in this conceptual diagram.',src:'x580'},
 imc:{name:'Server management controller',what:'A small controller that lets an administrator inspect and manage a server even when its operating system is not running.',design:'Standalone C-Series uses Cisco IMC on supported models. Some dedicated AI systems have a different BMC implementation. Check the selected model’s management documentation.',src:'c220'},
 cpu:{name:'CPU sockets',what:'A CPU runs general-purpose instructions and coordinates the server. A socket is the physical position for one processor.',design:'Two possible CPU positions represent a C240 M8-style server. This is a logical component layout, not a motherboard floorplan; one-CPU configurations have population restrictions.',src:'c240'},
 memory:{name:'System memory (DDR5)',what:'Memory holds the data and instructions the processors are actively using. It is separate from permanent storage and GPU memory.',design:'Memory is installed in DIMM slots associated with the processors. CPU population and approved DIMM combinations determine capacity and speed.',src:'c240'},
 drives:{name:'Local drives',what:'Drives retain the operating system, applications and data when the server is powered off.',design:'The C240 M8 family offers alternative SFF, LFF and E3.S layouts. Front bays, rear drives and boot modules have different roles; the drawing does not imply one universal backplane.',src:'c240'},
 vic:{name:'Network adapter / VIC',what:'A network adapter gives the server its network connections. A Cisco Virtual Interface Card can present multiple virtual interfaces through shared physical links.',design:'A supported standalone rack server can connect to ordinary network switches. Integration into a UCS domain requires qualified adapters, fabric hardware and firmware.',src:'catalog'},
 pcie:{name:'PCIe expansion',what:'PCI Express is the connection used by many GPUs, network cards, storage controllers and other add-in devices.',design:'Available slots and bandwidth depend on the server, risers, CPUs and other installed options. A card physically fitting a slot does not establish Cisco support.',src:'c240'}
};
const glossary={
 'UCS':'Unified Computing System: Cisco’s server platform and its associated networking and management ecosystem.',
 'U / RU':'Rack unit: a unit of equipment height, about 1.75 inches (44.45 mm). A 2U server occupies twice the vertical rack space of a 1U server.',
 'CPU / socket':'A CPU executes general-purpose instructions. A socket holds one CPU package; cores are execution resources within that processor.',
 'DIMM':'Dual in-line memory module: a replaceable system-memory module. Slot count and memory channel count are different quantities.',
 'SoC':'System on a chip: a processor integrating additional system functions, such as some network connectivity.',
 'GPU':'Graphics processing unit: a parallel accelerator used for graphics, AI and other workloads. Its own memory is distinct from CPU system memory.',
 'PCIe':'PCI Express: the expansion connection used by many GPUs, network adapters and storage devices. Generation and lane width affect the link.',
 'NVMe':'Non-Volatile Memory Express: a storage protocol commonly used by SSDs connected over PCIe. It is not a drive shape.',
 'SAS / SATA':'Storage interfaces used by hard drives and SSDs. The drive, controller and backplane must be compatible.',
 'SFF / LFF':'Small / Large Form Factor: in these servers, typically 2.5-inch and 3.5-inch drive formats.',
 'E1.S / E3.S':'Different enterprise SSD form factors in the EDSFF family. They are not physically interchangeable just because both can use NVMe.',
 'M.2':'A compact card form factor often used for boot drives. It can carry SATA or NVMe, depending on the device and platform.',
 'RAID / HBA':'RAID combines drives into an array for selected protection or performance goals. A host bus adapter provides drive connectivity; passthrough lets software manage individual drives. RAID is not a backup.',
 'FI / IFM':'Fabric interconnect / Intelligent Fabric Module. An IFM connects chassis servers toward external FIs. X-Series Direct instead uses embedded FIs.',
 'VIC':'Virtual Interface Card: a Cisco adapter that provides programmable network and storage interfaces over physical connections.',
 'BMC / IMC':'Baseboard management controller / Cisco Integrated Management Controller: out-of-band server administration, separate from the application operating system.',
 'IMM / UCSM':'Intersight Managed Mode / UCS Manager. These are management approaches; support depends on the hardware and software release.',
 'SXM / OAM':'Module formats used in selected dense GPU systems. These are not interchangeable with ordinary PCIe add-in cards.',
 'HGX / MGX':'NVIDIA platform designs. HGX provides an integrated multi-GPU platform; MGX is a modular server design framework. Neither is a CPU brand.',
 'HCI':'Hyperconverged infrastructure: software combines server compute and local storage into a managed cluster. A validated solution has its own compatibility rules.',
 'End of sale':'The last-order milestone for affected part numbers. Support can continue afterward under the published lifecycle and contract terms.'
};
const quiz=[
 {q:'You see “AMD EPYC” on a UCS server. What does that tell you?',options:['It must use AMD GPUs.','Its host processors are AMD; GPU choices are model-specific.','It cannot use a Cisco fabric interconnect.'],answer:1,why:'CPU vendor and accelerator vendor are separate axes. C845A M8 is one documented AMD-CPU platform with both AMD and NVIDIA GPU options.',src:'c845'},
 {q:'What is the X9508?',options:['A processor generation','An eight-GPU accelerator','A 7U chassis that holds modular nodes'],answer:2,why:'X9508 is the enclosure. X210c, X215c and X410c are compute-node models installed in it.',src:'chassis'},
 {q:'Which M8 model is the single-socket AMD rack server?',options:['C225 M8','C220 M8','X410c M8'],answer:0,why:'C225 M8 has one AMD EPYC socket in 1U. Socket count must be checked for the exact model and generation.',src:'c225'},
 {q:'“E3.S NVMe” describes which two things?',options:['CPU vendor and clock speed','Drive shape and storage protocol','RAID level and usable capacity'],answer:1,why:'E3.S describes a drive form factor. NVMe describes the storage protocol. You still need the appropriate backplane and configuration.',src:'c220'},
 {q:'What changes with X-Series Direct?',options:['Every node gets a different CPU architecture.','The chassis no longer needs networking.','The fabric interconnect role moves into the chassis.'],answer:2,why:'Embedded 9108 100G fabric interconnects provide the network/control role in X-Series Direct. Standard X-Series uses IFMs and external FIs.',src:'direct'},
 {q:'A data sheet lists “up to eight GPUs.” What can you conclude?',options:['Eight of any GPU can be installed.','Some qualified configuration reaches that ceiling; exact GPU rules still apply.','The server includes eight GPUs by default.'],answer:1,why:'Power, card width, risers, airflow, CPU population and storage choices can change what is supported. Independent maxima may not coexist.',src:'c245'},
 {q:'Is Intersight the hypervisor that runs virtual machines?',options:['No. It manages infrastructure; the operating system or hypervisor runs workloads.','Yes, on all X-Series nodes.','Only on AMD servers.'],answer:0,why:'Separate the operations layer from the workload software. Hardware compatibility must be checked for the exact OS or hypervisor release.',src:'direct'},
 {q:'What does an end-of-sale notice mean?',options:['The hardware immediately stops working.','Every model in that family has lost support.','Affected part numbers have a last-order date; support has separate milestones.'],answer:2,why:'Read both the affected-product table and lifecycle milestones. For example, the C885A MI350X notice separates its October 2026 order deadline from later support dates.',src:'c885eol'}
];

// Installed-base profiles added after the October 2026 FAE audit.
models.push(...[
  {
    "id": "c245m6",
    "name": "C245 M6",
    "family": "Rack",
    "vendor": "AMD",
    "shape": "installed-c245m6",
    "tag": "M6 · EPYC 7002 / 7003 installed base",
    "cpu": "1 or 2 × AMD EPYC 7002 / 7003",
    "cpuDetail": "Qualified Rome, Milan and Milan-X SKUs; P-suffix parts are single-socket only.",
    "sockets": 2,
    "memory": "32 DDR4 RDIMM / LRDIMM slots · 8 channels per CPU",
    "storage": "24 front SFF SAS/SATA bays; selected front and rear NVMe configurations.",
    "drive": [
      "SAS",
      "SATA",
      "NVMe",
      "M.2"
    ],
    "gpu": "Model-qualified PCIe GPU options; AMD accelerator qualification not recorded.",
    "gpuV": [
      "NVIDIA"
    ],
    "form": "2U rack",
    "job": "DDR4-era UCS reference for installed-base modernization.",
    "note": "With one CPU, only its 16 DIMM slots and attached I/O are usable. Two CPUs must be identical; P-suffix CPUs cannot form a dual-CPU system.",
    "management": "Cisco IMC; Intersight; supported UCS Manager integration",
    "sources": [
      "auditC245M6",
      "auditC245M6EOS"
    ],
    "use": [
      "Virtualization",
      "Storage",
      "General compute"
    ]
  }
]);
Object.assign(sources,{
  "auditC245M6": {
    "title": "Cisco UCS C245 M6 SFF Spec Sheet",
    "url": "https://www.cisco.com/c/dam/en/us/products/collateral/servers-unified-computing/ucs-c-series-rack-servers/c245m6-sff-specsheet.pdf",
    "loc": "Table 5 pp16–17; approved CPU configurations p18; memory pp19–23; front view p7",
    "scope": "EPYC Rome/Milan/Milan-X CPU choices, 1/2 CPU configurations, 32 DDR4 DIMM slots and chassis shape.",
    "date": "Rev A.67 · 29 Sep 2026",
    "publicationDate": "2026-09-29",
    "reviewed": "2026-10-09",
    "revision": "Rev A.67 · 29 Sep 2026"
  },
  "auditC245M6EOS": {
    "title": "Cisco C225 M6 / C245 M6 lifecycle notice",
    "url": "https://www.cisco.com/c/en/us/products/collateral/servers-unified-computing/ucs-c-series-rack-servers/ucs-c225m6-c245m6-rack-servers-eol.html",
    "loc": "Table 1 milestones; Table 2 C245-M6SX PIDs",
    "scope": "Last-order and entitled-support dates for the affected C245 M6 hardware.",
    "date": "2025-12-18",
    "publicationDate": "2025-12-18",
    "reviewed": "2026-10-09"
  }
});
// BEGIN AUDITED COVERAGE ADDITIONS
Object.assign(sources,{"verifyC225M6":{"title":"Cisco UCS C225 M6 SFF Rack Server Spec Sheet","url":"https://www.cisco.com/c/dam/en/us/products/collateral/servers-unified-computing/ucs-c-series-rack-servers/c225-m6-sff-specsheet.pdf","loc":"Overview p5; CPU tables pp18–20; memory pp21–25; GPU Table15 p38; management p46","revision":"Rev A.61 · 7 May 2026","date":"Rev A.61 · 7 May 2026","publicationDate":"2026-05-07","reviewed":"2026-10-09","scope":"Exact model hardware/configuration evidence; availability is separate."},"verifyC225M6EOS":{"title":"Cisco UCS C225 M6 / C245 M6 end-of-sale and end-of-life announcement","url":"https://www.cisco.com/c/en/us/products/collateral/servers-unified-computing/ucs-c-series-rack-servers/ucs-c225m6-c245m6-rack-servers-eol.html","loc":"Table1 milestones; Table2 affected C225 M6 products","revision":"Updated 18 December 2025","date":"Updated 18 December 2025","publicationDate":"2025-12-18","reviewed":"2026-10-09","scope":"Exact model hardware/configuration evidence; availability is separate."},"verifyC225M6Launch":{"title":"Cisco and AMD help businesses improve performance, security and hybrid cloud operations","url":"https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2021/m03/cisco-and-amd-extend-partnership-to-improve-performance-security-and-hybrid-cloud-operations.html","loc":"Opening announcement names C225 M6 and C245 M6","revision":"15 March 2021","date":"15 March 2021","publicationDate":"2021-03-15","reviewed":"2026-10-09","scope":"Exact model announcement, not a current shipping claim."}});
models.push(...[{"id":"c225m6","name":"C225 M6","family":"Rack","vendor":"AMD","shape":"installed-ucs-c225m6","tag":"Installed base · one or two sockets","cpu":"1 or 2 × AMD EPYC 7002 / 7003","cpuDetail":"Only processors in the exact model qualification are covered.","sockets":2,"memory":"32 DDR4 DIMM slots","storage":"Up to 10 SFF SAS/SATA/NVMe; backplane dependent","drive":["SAS","SATA","NVMe","M.2"],"gpu":"Up to 3 NVIDIA T4 (Cisco PID UCSC-GPU-T4-16)","gpuV":["NVIDIA"],"form":"1U rack","job":"An older DDR4 rack platform useful for Rome/Milan installed-base comparisons.","note":"Unlike C225 M8, C225 M6 supports one or two CPUs. End of sale does not mean support has ended.","management":"Cisco IMC; supported UCS Manager / Intersight modes","sources":["verifyC225M6"],"use":["Virtualization","General compute"]}]);
