/* Intel Xeon 6 Architecture Field Guide. Drawings are functional schematics. */
const NS='http://www.w3.org/2000/svg';
const palette={bg:'#0d1723',board:'#122233',line:'#39576b',lineSoft:'#2b4356',text:'#ecf6fa',muted:'#9db4c1',quiet:'#7792a4',blue:'#57c8ff',cyan:'#64e1ea',violet:'#b499ff',amber:'#f2c984',mint:'#76d8ac',rose:'#ff8195',panel:'#1b3242'};
const CONCEPTS={
  pcore:{title:'Performance-core (P-core)',what:'A part of the CPU that runs instructions. Each Granite Rapids P-core has its own nearby L2 cache.',how:'Redwood Cove is the name of this core design. P-cores also include hardware for wide vector and matrix instructions, called AVX-512 and AMX. The drawn core count is illustrative.',ref:'BRIEF pp. 1–4; HPC pp. 9–10'},
  ecore:{title:'Efficient-core (E-core)',what:'A part of the CPU that runs instructions. Sierra Forest groups E-cores so nearby cores share an L2 cache.',how:'Crestmont is the name of this core design. A tile groups two or four single-threaded E-cores around 4 MB of shared L2. Intel lists AVX2 and VNNI instruction support for this design.',ref:'E-ARCH pp. 9, 11–12; BRIEF pp. 2–4; CORE_NAMES / Intel processor table'},
  redwoodCove:{title:'Redwood Cove · P-core design',what:'Intel’s name for the internal design of a Granite Rapids P-core, not a processor model or SKU.',how:'The naming chain is Xeon 6 with P-cores → Granite Rapids processor design → Redwood Cove core design. ChipIndex groups processor products under Granite Rapids; this atlas also identifies the core design.',ref:'HPC pp. 9–10; CORE_NAMES / Intel processor table'},
  crestmont:{title:'Crestmont · E-core design',what:'Intel’s name for the internal design of a Sierra Forest E-core, not a processor model or SKU.',how:'The naming chain is Xeon 6 with E-cores → Sierra Forest processor design → Crestmont core design. E-core modules group two or four such cores around shared L2 cache.',ref:'CORE_NAMES / Intel processor table; E-ARCH pp. 9, 11–12'},
  pProcessor:{title:'Xeon 6 P-core · Granite Rapids',what:'A CPU package whose compute dies contain P-cores.',how:'Granite Rapids-AP is the 6900P branch with three compute dies in the UCC layout. Granite Rapids-SP covers the 6700P/6500P branches with two-die XCC or one-die HCC/LCC layouts. AP and SP identify package/platform branches; they do not name the core type.',ref:'PLATFORM p. 6; ARCH pp. 5–7'},
  eProcessor:{title:'Xeon 6 E-core · Sierra Forest-SP',what:'A CPU package whose compute chiplets contain E-cores.',how:'The illustrated 6700E line is Sierra Forest-SP. E-cores are grouped into tiles with shared L2. The P-core and E-core builds use separate CPU packages; they are not mixed in one Xeon 6 processor.',ref:'SEPARATE / Intel architecture explanation; E-ARCH pp. 11–12'},
  familyRelation:{title:'Two separate processor builds',what:'Xeon 6 P-core and E-core processors are separate CPU packages. The two core types are not mixed in one Xeon 6 CPU.',how:'Each pictured processor contains compute and I/O silicon. They share some design elements, but a board must support its specific CPU model.',ref:'SEPARATE / Intel architecture explanation; COMPATIBILITY / Intel socket and pairing guidance'},
  cacheRoute:{title:'Possible request to board memory',what:'A route a core may use when the data it needs is absent from nearby cache.',how:'The request can travel over the on-chip mesh toward shared cache and, when DRAM is needed, through a compute-side memory controller to board DDR5. A cache hit ends earlier; the boxes do not claim a fixed sequence or a published link speed.',ref:'HPC pp. 9–10; E-ARCH pp. 11–12; FABRIC pp. 6–7'},
  board:{title:'Server board and socket',what:'The circuit board and connector that hold a CPU package, memory modules, and device connections.',how:'The board drawing shows one selected Xeon 6 processor type at a time. It is a containment diagram, not a wiring or socket-pin map.',ref:'ARCH p. 5'},
  computeChiplet:{title:'Compute chiplet',what:'A separate piece of silicon inside the CPU package containing processor cores and nearby cache.',how:'Granite Rapids-AP UCC uses three P-core compute dies; Granite Rapids-SP has two-die XCC and one-die HCC/LCC forms. Sierra Forest-SP 6700E contains E-core compute silicon. The P and E examples here show core/cache relationships, not the full core count.',ref:'ARCH pp. 5–7; E-ARCH p. 12; PLATFORM p. 6'},
  ioChiplet:{title:'I/O chiplet',what:'A separate piece of silicon inside the CPU package that connects it to external devices and other CPU sockets.',how:'Its links can serve PCIe or compatible CXL devices and UPI between supported CPUs. Board memory modules use the compute chiplets’ memory interfaces instead.',ref:'E-ARCH p. 12; HPC p. 9'},
  memoryInterface:{title:'Memory interface',what:'Circuits in a compute chiplet that connect the processor to memory channels on the server board.',how:'The Sierra Forest-SP 6700E schematic groups eight supported DDR5 channels into two four-channel sides. Those blocks do not specify the number or exact placement of physical controller circuits.',ref:'E-ARCH p. 12; E6700 / Intel 6780E specification'},
  eModule:{title:'E-core tile and shared L2',what:'A group of two or four E-cores that share a 4 MB L2 cache and one connection to the on-chip mesh.',how:'Each drawn tile uses four core symbols as an example. Intel specifies 64 bytes per cycle of bandwidth and 17 cycles of latency for this shared L2 cache. Those figures describe the tile cache, not the mesh between tiles.',ref:'E-ARCH pp. 9, 11–12'},
  eMesh:{title:'Mesh of E-core tiles',what:'On-chip paths that let E-core tiles exchange data with the larger shared cache and memory interface.',how:'Each tile has one mesh fabric interface. A request served by its shared L2 stays in the tile; other requests can travel through the mesh. Intel does not give a numeric Xeon 6 mesh-link rate in the cited architecture slides.',ref:'E-ARCH pp. 11–12; FABRIC pp. 6–7'},
  eLlc:{title:'Last-level cache (LLC) slice',what:'A portion of the processor’s larger shared cache that can hold data for its cores.',how:'Intel describes an LLC slice associated with E-core tiles and an LLC shared among all cores in a socket. One slice is drawn as a representative endpoint, not a count.',ref:'E-ARCH p. 11'},
  boardMemory:{title:'Board DDR5 channel group',what:'Board memory reached through a group of DDR5 channels from the CPU. The box stands for the attached DIMMs, not one memory module.',how:'The Sierra Forest-SP 6700E branch supports eight channels. Each pictured side summarizes four channels; the DIMM count and placement depend on the board.',ref:'E-ARCH p. 12; E6700 / Intel 6780E specification'},
  externalIo:{title:'External I/O device',what:'A board-connected device reached through the processor’s high-speed I/O links.',how:'PCIe and compatible CXL devices are examples. The drawn link is logical and does not specify a port or lane allocation for either processor type.',ref:'E-ARCH p. 12; BRIEF pp. 4–5'},
  cxlDevice:{title:'CXL memory device',what:'A device outside the CPU that adds compatible memory capacity to a server.',how:'The processor can reach such a device through a supported CXL connection from its I/O dies. The box is one possible device, not a claim that every CPU or board has this port.',ref:'BRIEF p. 5'},
  pcieDevice:{title:'PCIe board device',what:'An add-in device that gives the server a function such as networking or storage.',how:'It connects through a PCIe link provided by the processor’s I/O dies. The drawn device is an example, not a specific card or port assignment.',ref:'HPC p. 9; BRIEF p. 4'},
  package:{title:'Processor package',what:'The physical CPU assembly placed in a server socket, containing silicon dies and their connections.',how:'Granite Rapids-AP uses the three-compute-die UCC form. Granite Rapids-SP uses two-die XCC or one-die HCC/LCC forms. These P-core drawings also contain two I/O dies. Positions explain relationships rather than a literal floorplan.',ref:'PLATFORM p. 6; ARCH pp. 5–7'},
  packageFabric:{title:'EMIB die-to-die bridges',what:'Short silicon bridges inside the CPU package that connect neighboring compute and I/O dies.',how:'Intel’s Modular Mesh Fabric carries requests and data across these EMIB bridges so the dies work as one logical network. The bridge segments are drawn at die boundaries; they are not a continuous external cable. Intel does not give a numeric per-bridge transfer rate for these Xeon 6 designs in its public architecture slides.',ref:'FABRIC pp. 5–7; EMIB pp. 1–2'},
  computeDie:{title:'Compute die',what:'A separate piece of silicon inside the CPU package that holds cores, cache, and memory controllers.',how:'In Granite Rapids-AP UCC and Granite Rapids-SP XCC, each die attaches four memory channels. In the one-die SP forms, one die provides all eight channels. The HCC class supports up to 48 P-cores; the smaller LCC class supports up to 16. Those are class ceilings, not the active count of every model.',ref:'PLATFORM p. 6; HPC p. 9; SIZE / architecture reporting'},
  ioDie:{title:'I/O die',what:'A separate piece of silicon inside the CPU package that connects it to devices and other CPU sockets.',how:'The pictured Granite Rapids-AP and Granite Rapids-SP package classes have two I/O dies. Their links can serve PCIe or compatible CXL devices and connect sockets through UPI; this drawing does not map individual ports.',ref:'PLATFORM p. 6; HPC p. 9'},
  imc:{title:'Integrated memory controller (IMC)',what:'The circuits on a compute die that connect the CPU to its attached memory channels.',how:'UCC and XCC examples attach four DDR5 channels per die; one-die HCC and LCC examples attach eight channels to their die. The two side blocks in the one-die drawing group four channels each and do not claim one physical controller per block. Memory controllers also check data for certain errors (ECC).',ref:'HPC pp. 9, 11–12; CLASS / Intel-hosted package explanation; RAS pp. 9–11'},
  dram:{title:'DDR5 board memory',what:'Removable memory modules on the server board that hold data the CPU reads and writes.',how:'The modules are outside the CPU package and connect through memory controllers on its compute dies. Some P-core systems can also use higher-speed MRDIMMs; the exact type and speed depend on the processor and board.',ref:'HPC pp. 9, 11'},
  mesh:{title:'Modular Mesh Fabric · on die',what:'A network of short paths that carries requests among cores, shared cache, memory controllers, and connections to other dies.',how:'A private-cache hit can finish near the core. A miss can move through mesh routers toward shared L3, a memory controller, or another die across an EMIB bridge. The drawing shows possible routes, not exact wiring or a required sequence. Intel does not publish a numeric link rate for this mesh in the cited material.',ref:'HPC p. 10; FABRIC pp. 6–7'},
  core:{title:'Redwood Cove P-core',what:'A P-core that runs program instructions inside a Granite Rapids processor. Redwood Cove names the design of that core.',how:'Each P-core has a private 2 MB mid-level (L2) cache. The repeated blocks are illustrative, not the actual core count of one compute die.',ref:'HPC pp. 9–10'},
  l1l2:{title:'Private L1 and L2 cache',what:'Small, fast memory beside one core that holds instructions and data it is likely to need again.',how:'Each compute-die core has private L1 and L2 cache; the guide gives a 2 MB L2 capacity for the Redwood Cove core. A miss can travel through the mesh toward shared L3 or DRAM.',ref:'HPC pp. 9–10'},
  privateL2:{title:'Private P-core L2 cache',what:'Nearby cache that belongs to one P-core and holds instructions and data it may need again.',how:'Each pictured Redwood Cove P-core has its own 2 MB L2. Four cores are drawn as examples; they do not show a Xeon 6 model’s actual core count.',ref:'HPC pp. 9–10'},
  sharedTileL2:{title:'Shared E-core tile L2 cache',what:'Nearby cache used together by the E-cores in one tile.',how:'A Sierra Forest tile groups two or four Crestmont E-cores around one shared 4 MB L2. The four drawn cores are a tile example, not a processor core count.',ref:'E-ARCH pp. 9, 11–12'},
  llc:{title:'Shared L3 cache slice',what:'A portion of the processor’s larger cache that can serve data requested by cores.',how:'Each compute die contributes part of the processor’s L3 cache. The drawing pairs representative cache slices with mesh stops to teach the relationship, not the exact number or physical placement of slices.',ref:'HPC pp. 9–10'},
  snc:{title:'Sub-NUMA Clustering (SNC)',what:'A firmware setting that lets software see several memory-locality regions inside one CPU.',how:'The documented Granite Rapids-AP UCC example uses SNC3: three die-local nodes. The Granite Rapids-SP XCC example uses SNC2: two die-local nodes. SNC changes software-visible placement, not which memory a core is allowed to access. One-die models and E-core configurations should not inherit those node counts.',ref:'HPC pp. 11–12; PLATFORM p. 6'},
  numa:{title:'NUMA locality domain',what:'A software-visible group of CPU cores and memory that are relatively near each other.',how:'In documented SNC3 and SNC2 configurations, each domain corresponds to one compute die and its four attached DDR5 channels. With SNC off, one software domain can cover multiple dies. The boundary describes locality, not access control.',ref:'HPC pp. 11–12; NUMA / Intel NUMA white paper'},
  localityRegion:{title:'Physical compute-die locality region',what:'One compute die and the board memory channels wired to its controllers.',how:'This one-die package view has eight attached DDR5 channels. Firmware may expose a different software NUMA map, but that does not add a compute die or change these physical wires.',ref:'PLATFORM p. 6; NUMA / Intel NUMA white paper'},
  localMemory:{title:'Memory attached to this die',what:'Board memory reached through a compute die’s own memory controller.',how:'In AP UCC and SP XCC layouts, a compute die serves four DDR5 channels. A one-die Granite Rapids-SP HCC/LCC package serves all eight. Memory modules sit outside the CPU package.',ref:'HPC pp. 9, 11–12; PLATFORM p. 6'},
  remoteMemory:{title:'Remote NUMA memory request',what:'A request from a core to memory attached to a different compute die.',how:'The highlighted example travels through the processor fabric to the target die, then through that die’s memory controller to its DDR5 channels. The source die could address any other node; this one route is illustrative. SNC does not forbid remote access, but keeping data local can avoid that extra route.',ref:'HPC pp. 12, 28; FABRIC pp. 6–7'},
  socket:{title:'Processor socket',what:'The motherboard connector that holds one CPU package.',how:'The Granite Rapids-AP 6900P branch uses LGA7529-1. Granite Rapids-SP 6700P/6500P and Sierra Forest-SP 6700E use LGA4710-2. A specific processor and board determine supported socket count and wiring.',ref:'SOCKETS / Intel supported-socket series list; PLATFORM p. 7'},
  upi:{title:'CPU-to-CPU link (UPI 2.0)',what:'A high-speed connection between separate processor sockets.',how:'Granite Rapids-AP 6900P supports up to six links per CPU; Granite Rapids-SP 6700P/6500P and the pictured Sierra Forest-SP 6700E branch reach up to four, depending on model. Supported links run at up to 24 GT/s. UPI connects sockets; EMIB connects dies inside a package.',ref:'PLATFORM p. 7; E6700 / Intel 6780E specification'},
  pcie:{title:'PCI Express 5.0',what:'A connection for board devices such as network cards and storage controllers.',how:'PCIe 5.0 has a maximum signaling rate of 32 GT/s (billion transfers per second) per lane. This is a device-link rate, not an on-chip mesh rate. The drawing does not assign a lane count or port to a device.',ref:'HPC p. 9; PCI-SIG / PCIe 5.0 FAQ'},
  cxl:{title:'Compute Express Link (CXL) 2.0',what:'A way for compatible devices, including some memory expanders, to use the processor’s high-speed I/O lanes.',how:'Up to 64 of the supported PCIe 5.0 lanes may be CXL 2.0 capable; they are a possible role of those lanes, not 64 additional lanes. The interface can signal at up to 32 GT/s per lane. Availability depends on the processor and board.',ref:'PLATFORM p. 7; LANES sec. II.A; BRIEF p. 5'},
  ioLanes:{title:'PCIe 5.0 / CXL 2.0 lane bank',what:'The processor’s external high-speed wires for devices on the server board.',how:'I/O dies supply the lanes. Granite Rapids-AP 6900P reaches up to 96 PCIe 5.0 lanes per CPU; Granite Rapids-SP multi-socket forms and the Intel 6780E example list 88; selected one-socket Granite Rapids-SP models reach 136. Up to 64 supported lanes can serve CXL 2.0 within the PCIe total. Totals do not locate ports on an I/O die.',ref:'PLATFORM p. 7; E6700 / Intel 6780E specification; 6781P / Intel specification'},
};

const VIEWS=[
  {id:'family',name:'Two processor designs',subtitle:'P-core cache belongs to one core; E-core tile cache is shared',refs:'BRIEF pp. 1–4 · HPC pp. 9–10 · E-ARCH pp. 9, 11–12 · 6781P · E6700',intro:'Xeon 6 is a product generation with separate Granite Rapids P-core and Sierra Forest E-core packages. Redwood Cove names the P-core design; Crestmont names the E-core design. AP and SP are platform branches, not names for core types.',points:['Each pictured Granite Rapids P-core connects to its own 2 MB L2 cache.','Two or four Sierra Forest E-cores form a tile around one shared 4 MB L2 cache; four are drawn here.','Named examples show thread scale: Xeon 6781P has 80 cores / 160 threads; Xeon 6780E has 144 cores / 144 threads. The four drawn cores are illustrative.'],modes:[],draw:'drawFamily'},
  {id:'package',name:'Package and board',subtitle:'Compare family package branches and the memory attached to their compute silicon',refs:'PLATFORM pp. 6–7 · HPC p. 9 · ARCH pp. 5–7 · E-ARCH p. 12',intro:'Follow board → socket → CPU package. Granite Rapids-AP and Granite Rapids-SP use different compute-die classes; Sierra Forest-SP contains E-core compute silicon. Memory modules sit on the board and connect to compute-side controllers. I/O dies serve device and socket links.',points:['Granite Rapids-AP / 6900P uses UCC: three compute dies, two I/O dies, and 12 DDR5 channels.','Granite Rapids-SP XCC uses two compute dies. HCC and LCC each use one compute die and two I/O dies; HCC reaches up to 48 P-cores, while LCC reaches up to 16. Both one-die classes support eight DDR5 channels.','Sierra Forest-SP / 6700E is the E-core branch with eight DDR5 channels. Its arrangement is drawn schematically from Intel architecture figures and public product data.'],modes:[['6900','GRANITE RAPIDS-AP · UCC'],['6787','GRANITE RAPIDS-SP · XCC'],['6736','GRANITE RAPIDS-SP · HCC · ≤48 P-CORES'],['6507','GRANITE RAPIDS-SP · LCC · ≤16 P-CORES'],['6700E','SIERRA FOREST-SP · E-CORE']],defaultMode:'6900',variants:{'6700E':{subtitle:'Sierra Forest-SP · E-core compute and I/O chiplets within the 6700E branch',refs:'E-ARCH p. 12 · ARCH p. 5 · E6700 · ELAUNCH',intro:'Intel’s published architecture figures show the E-core chiplet roles; launch reporting identifies the 6700E SP form as one compute die with two I/O dies. The drawing combines those sources with Intel’s board-connection data as a schematic.',points:['The E-core compute region contains tiles with shared L2 and connects to eight board DDR5 channels.','I/O chiplets lead to PCIe/CXL devices and, on supported systems, UPI links to another CPU.','The block positions and port routing are not a measured silicon floorplan.']}},draw:'drawPackage'},
  {id:'snc',name:'NUMA and memory locality',subtitle:'What memory is physically nearby, and what software sees',refs:'HPC pp. 9, 11–12, 28 · PLATFORM p. 6 · NUMA / Intel NUMA white paper',intro:'NUMA is a proximity map, not a wall. With SNC off, software can see one domain even though dies still have attached channels. Where SNC is supported and enabled, software can place work near the memory attached to each compute die. Other nodes’ memory remains addressable.',points:['Granite Rapids-AP UCC can expose three SNC nodes; Granite Rapids-SP XCC can expose two. Each documented die-local node has four attached DDR5 channels.','One-die Granite Rapids-SP HCC/LCC and Sierra Forest-SP 6700E have one physical compute-die locality region in these schematics. VirtualNUMA can subdivide the E-core software view without moving memory wires.','Solid amber lines show attached-memory paths. In the SNC3/SNC2 views, one violet dashed path shows a possible remote request; any node can address another node’s memory.'],modes:[['unified','SNC OFF · UNIFIED'],['6900-local','GRANITE RAPIDS-AP · SNC3'],['6700-local','GRANITE RAPIDS-SP · SNC2'],['single','GRANITE RAPIDS-SP · 1 DIE'],['6700E-local','SIERRA FOREST-SP · E-CORE']],defaultMode:'unified',draw:'drawSNC'},
  {id:'io',name:'Server platform links',subtitle:'Memory, device lanes, and socket-to-socket links by Xeon 6 platform branch',refs:'PLATFORM pp. 6–7 · SOCKETS · E6700 / Intel 6780E specification',intro:'Each view holds the same physical connection types: compute-side controllers reach board DDR5; package I/O dies provide PCIe/CXL lanes; UPI joins compatible CPU sockets. AP and SP name package/platform branches. Totals are platform maxima unless a named product is identified.',points:['Granite Rapids-AP 6900P: 12 DDR5 channels, up to 96 PCIe 5.0 lanes, and up to six UPI 2.0 links per CPU.','Granite Rapids-SP 6700P/6500P: up to eight DDR5 channels, 88 PCIe lanes, and up to four UPI links; selected one-socket models expose up to 136 PCIe lanes.','Sierra Forest-SP 6700E: an Intel 6780E specification lists eight DDR5 channels, 88 PCIe lanes, and four UPI links. CXL-capable lanes are included within PCIe lane totals.'],modes:[['6900-2S','GRANITE RAPIDS-AP · 2 SOCKETS'],['6700-2S','GRANITE RAPIDS-SP · 2 SOCKETS'],['6781-1S','GRANITE RAPIDS-SP · 1 SOCKET'],['6700E-2S','SIERRA FOREST-SP · 2 SOCKETS']],defaultMode:'6900-2S',draw:'drawIO'}
];

const LESSONS={
  family:{scope:'START HERE · TWO SEPARATE XEON 6 PROCESSOR BUILDS',path:'Compare the four P-core caches at left with one E-core tile cache at right. Thin lines connect each core to the cache it uses; the lower path shows one possible request for board memory after cache misses.',summary:'A Redwood Cove P-core has a private 2 MB L2; a Sierra Forest tile shares one 4 MB L2 among two or four Crestmont E-cores.',limits:'Core symbols and package outlines teach relationships, not total cores, die layout, or package dimensions. The lower request path is schematic, not a required sequence for every access.'},
  package:{
    '6900':{scope:'GRANITE RAPIDS-AP · XEON 6900P · UCC',path:'Read board → socket → package: three compute dies, two I/O dies, and short EMIB bridges. Board DIMMs remain outside the CPU.',summary:'The Granite Rapids-AP UCC branch has three P-core compute dies and 12 memory channels.',limits:'The die relationships and counts are sourced; positions, cores, and bridges are schematic.'},
    '6787':{scope:'GRANITE RAPIDS-SP · XEON 6700P · XCC',path:'Read board → socket → package: two compute dies, four DDR5 channels each, and two I/O dies.',summary:'The XCC package form has two P-core compute dies and eight attached memory channels.',limits:'Granite Rapids-SP also includes one-die HCC/LCC forms. The series number alone does not identify a die count.'},
    '6736':{scope:'GRANITE RAPIDS-SP · HCC · UP TO 48 P-CORES',path:'One HCC compute die connects to eight DDR5 channels and two I/O dies. Compare the LCC mode: same die count and channels, lower core ceiling.',summary:'HCC supports up to 48 P-cores in its one compute die; the selected SKU may enable fewer.',limits:'The drawn die width and core icons are schematic, not a measured floorplan or a SKU core count.'},
    '6507':{scope:'GRANITE RAPIDS-SP · LCC · UP TO 16 P-CORES',path:'One LCC compute die connects to eight DDR5 channels and two I/O dies. Compare the HCC mode: same die count and channels, higher core ceiling.',summary:'LCC uses a smaller compute die and supports up to 16 P-cores; the selected SKU may enable fewer.',limits:'The drawn die width and core icons are schematic, not a measured floorplan or a SKU core count.'},
    '6700E':{scope:'SIERRA FOREST-SP · XEON 6700E · E-CORE',path:'Follow board → package → E-core tile. Board DDR5 reaches compute-side memory interfaces; I/O chiplets reach devices and supported socket links.',summary:'Sierra Forest-SP uses E-core tiles; the illustrated 6700E branch has eight DDR5 channels.',limits:'One compute die and two I/O dies are identified in launch reporting; Intel’s public architecture figures show roles but do not expressly map that count to 6700E. Positions remain schematic.'}},
  snc:{
    unified:{scope:'SNC OFF · ONE SOFTWARE MEMORY DOMAIN',path:'Follow solid lines from each compute die to its physically attached DDR5. Software sees one CPU-wide memory domain when SNC is off.',summary:'Disabling SNC changes the software locality map; it does not reroute the memory channels.',limits:'A unified OS domain can still contain different physical paths. Memory interleaving and reported NUMA nodes depend on firmware and system configuration.'},
    '6900-local':{scope:'GRANITE RAPIDS-AP · UCC · SNC3',path:'Read each dashed region vertically: one compute die and four attached DDR5 channels. The violet route is one example of remote access.',summary:'SNC3 exposes three die-local memory regions in the documented Granite Rapids-AP UCC example.',limits:'All three dies can address all memory. Dashed borders mark proximity, not protection.'},
    '6700-local':{scope:'GRANITE RAPIDS-SP · XCC · SNC2',path:'Read both dashed regions: one compute die and four attached DDR5 channels per node. The violet route illustrates remote access.',summary:'SNC2 exposes two die-local memory regions in the documented Granite Rapids-SP XCC example.',limits:'Other Granite Rapids-SP die classes do not automatically have the same SNC configuration.'},
    single:{scope:'GRANITE RAPIDS-SP · HCC/LCC · ONE COMPUTE DIE',path:'One compute die reaches all eight DDR5 channels. No second physical compute-die locality region is present in this view.',summary:'A one-die Granite Rapids-SP HCC/LCC package has one physical compute-die locality region.',limits:'This is a physical topology view, not a promise of an OS node count. BIOS settings determine the software-visible map.'},
    '6700E-local':{scope:'SIERRA FOREST-SP · 6700E · E-CORE',path:'Follow the E-core compute die to its eight board DDR5 channels. VirtualNUMA may subdivide the software-visible map without changing this physical connection.',summary:'The 6700E example has one physical compute-die locality region in this schematic; a configured VirtualNUMA map is a software view.',limits:'The die arrangement is schematic, based on Intel package figures and independent launch reporting. VirtualNUMA domain count depends on firmware and platform settings.'}},
  io:{
    '6900-2S':{scope:'GRANITE RAPIDS-AP · 6900P · TWO SOCKETS',path:'Follow DDR5 to compute-side controllers, PCIe/CXL through I/O dies, and UPI between CPU sockets.',summary:'Per 6900P CPU: three compute dies, up to 12 DDR5 channels, 96 PCIe 5.0 lanes, and six UPI 2.0 links.',limits:'Maxima are platform capabilities. Lane drawing is a logical group, not individual ports or motherboard routing.'},
    '6700-2S':{scope:'GRANITE RAPIDS-SP · 6700P/6500P · TWO SOCKETS',path:'Compare the SP socket and smaller memory/device connection budgets with AP. The package may contain one or two compute dies.',summary:'Per SP CPU: up to eight DDR5 channels, 88 PCIe lanes, and four UPI links, depending on model.',limits:'The pictured XCC form has two compute dies. HCC/LCC use one; specific SKU and board determine active links.'},
    '6781-1S':{scope:'GRANITE RAPIDS-SP · XEON 6781P LANE EXAMPLE',path:'The one-socket platform omits the inter-socket UPI path and can direct more external lanes to devices.',summary:'Intel lists 136 PCIe 5.0 lanes for the one-socket Xeon 6781P.',limits:'136 lanes is this model’s specification, not a guarantee across Granite Rapids-SP. The two-die XCC form is illustrative rather than a published floorplan for 6781P.'},
    '6700E-2S':{scope:'SIERRA FOREST-SP · 6700E · TWO SOCKETS',path:'Follow board DDR5 to E-core compute silicon, and PCIe/CXL and UPI from the I/O dies to devices and a peer socket.',summary:'The Intel 6780E lists eight DDR5 channels, 88 PCIe lanes, and four UPI links per CPU.',limits:'These are a named 6700E model’s values. The simplified compute region does not claim exact 6700E die placement.'}}
};

const KEY_TERMS={
  CPU:'Central processing unit · the processor package placed in a server socket.',
  'P-core':'Performance-core · the core type in these Granite Rapids CPUs.',
  'E-core':'Efficient-core · the core type in these Sierra Forest CPUs.',
  'I/O':'Input/output · connections for devices and other CPU sockets.',
  SKU:'Stock keeping unit · an individual processor model, such as Xeon 6787P.',
  SoC:'System on chip · a processor design combining compute and other system functions.',
  AP:'Intel’s larger Xeon 6 package/platform branch in this atlas. Granite Rapids-AP maps to the 6900P UCC form with three compute dies, 12 DDR5 channels, and LGA7529-1. Intel’s cited public sources use AP as a branch label without expanding its initials.',
  SP:'Intel’s Xeon 6 package/platform branch used here for Granite Rapids 6700P/6500P and Sierra Forest 6700E on LGA4710-2. It is separate from whether the cores are P or E. Intel’s cited public sources use SP as a branch label without expanding its initials.',
  UCC:'Intel package-class code · Granite Rapids-AP 6900P form with three compute dies and 12 DDR5 channels.',
  XCC:'Intel package-class code · Granite Rapids-SP two-compute-die form with eight DDR5 channels.',
  HCC:'Granite Rapids-SP package class with one compute die, two I/O dies, and up to 48 P-cores. Like LCC, it supports eight DDR5 channels; a specific CPU model may enable fewer cores.',
  LCC:'Granite Rapids-SP package class with a smaller single compute die, two I/O dies, and up to 16 P-cores. Like HCC, it supports eight DDR5 channels; a specific CPU model may enable fewer cores.',
  DDR5:'Fifth-generation double-data-rate memory · the board memory type shown.',
  DRAM:'Dynamic random-access memory · the chips on the board memory modules.',
  DIMM:'Dual in-line memory module · a removable board memory module.',
  MRDIMM:'Multiplexed-rank DIMM · a supported high-speed memory-module type on some models.',
  IMC:'Integrated memory controller · a die’s circuits for attached memory channels.',
  CH:'Channel · an independent path from a controller to board memory.',
  L1:'Level 1 cache · the smallest, nearest cache to a core.',
  L2:'Level 2 cache · nearby cache, private to a P-core or shared within an E-core tile.',
  L3:'Level 3 cache · a larger cache shared beyond one core.',
  LLC:'Last-level cache · the outer shared cache level; L3 in this P-core drawing.',
  MB:'Megabytes · a measure of cache capacity.',
  'B/cycle':'Bytes per processor cycle · the cited E-core tile L2 transfer measure.',
  EMIB:'Embedded Multi-die Interconnect Bridge · a short bridge between dies inside a package.',
  UPI:'Ultra Path Interconnect · a link between separate CPU sockets.',
  PCIe:'Peripheral Component Interconnect Express · high-speed lanes for board devices.',
  CXL:'Compute Express Link · a device protocol on supported PCIe-capable lanes.',
  'GT/s':'Billions of transfers per second · link signaling rate, not application throughput.',
  LGA:'Land grid array · the named socket connector format.',
  '1S/2S':'One socket / two sockets · the number of CPUs on the shown server platform.',
  NUMA:'Non-uniform memory access · memory may be nearer to one group of cores than another.',
  SNC:'Sub-NUMA Clustering · a setting that exposes die-local memory regions to software.',
  VirtualNUMA:'A software-visible subdivision of processor resources; it does not by itself create separate physical compute dies or memory wiring.',
  OS:'Operating system · software that sees the NUMA regions.',
  LOCAL:'A core accesses DDR5 attached to its own compute die.',
  REMOTE:'A core accesses DDR5 attached to another die in the same CPU package.',
  'AVX-512':'Advanced Vector Extensions 512 · instructions that process wide groups of values.',
  AMX:'Advanced Matrix Extensions · instructions for matrix calculations.',
  AVX2:'Advanced Vector Extensions 2 · vector instructions supported by the E-core design.',
  VNNI:'Vector Neural Network Instructions · vector instructions for integer dot products.',
  ECC:'Error-correcting code · checks and can correct certain memory-data errors.',
  HPC:'High-performance computing · the subject of the cited Intel tuning guide.',
  RAS:'Reliability, availability, and serviceability · the subject of the cited Intel paper.'
};
const VIEW_KEYS={
  family:{intro:'AP/SP are package/platform branches. P-core/E-core are compute-design types; the diagrams keep those two naming axes separate.',terms:['AP','SP','CPU','P-core','E-core','I/O','L2','UCC','XCC','HCC','LCC','AVX-512','AMX','AVX2','VNNI']},
  package:{intro:'HCC and LCC have the same one-compute-die topology, but different P-core ceilings: up to 48 versus up to 16.',terms:['AP','SP','UCC','XCC','HCC','LCC','CPU','P-core','E-core','DDR5','DIMM','I/O','IMC','CH','EMIB','PCIe','CXL','UPI','LGA']},
  'package:6700E':{intro:'Sierra Forest-SP is the E-core 6700E branch. The view draws physical roles and board links schematically.',terms:['SP','CPU','E-core','I/O','L2','DDR5','DIMM','PCIe','CXL','UPI','LGA']},
  snc:{intro:'NUMA marks near and far memory paths, not ownership or isolation. Firmware settings affect the software-visible map.',terms:['AP','SP','UCC','XCC','HCC','LCC','CPU','NUMA','SNC','VirtualNUMA','OS','IMC','DDR5','DRAM','DIMM','CH','LOCAL','REMOTE']},
  io:{intro:'UPI joins CPU sockets; EMIB joins dies inside a package; PCIe/CXL lanes connect board devices.',terms:['AP','SP','UCC','XCC','HCC','LCC','CPU','P-core','E-core','1S/2S','DDR5','DIMM','CH','I/O','IMC','EMIB','UPI','PCIe','CXL','GT/s','LGA']}
};
const TERM_ALIASES={'p-cores':'P-core','e-cores':'E-core',cpus:'CPU',dimms:'DIMM',skus:'SKU',imcs:'IMC'};
const TERM_INDEX=new Map(Object.keys(KEY_TERMS).map(term=>[term.toLowerCase(),term]));
const TERM_PATTERN=new RegExp([...Object.keys(KEY_TERMS),...Object.keys(TERM_ALIASES)].sort((a,b)=>b.length-a.length).map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'gi');

const svg=document.getElementById('diagram'),tip=document.getElementById('hoverTip'),stage=document.getElementById('stage');
const params=new URLSearchParams(location.search);const requestedView=params.get('view');let active=requestedView==='hierarchy'?'package':VIEWS.some(v=>v.id===requestedView)?requestedView:'family';let modeByView={package:requestedView==='hierarchy'?'6700E':'6900',snc:'unified',io:'6900-2S'};const urlMode=params.get('mode');if(requestedView==='hierarchy'&&urlMode==='P')modeByView.package='6900';else if(active==='package'&&urlMode==='6700')modeByView.package='6787';else if(active==='package'&&urlMode==='6507')modeByView.package='6507';else if(active==='snc'&&['6900','6700'].includes(urlMode))modeByView.snc=`${urlMode}-local`;else if(active==='snc'&&urlMode?.endsWith('-remote'))modeByView.snc=urlMode.startsWith('6900')?'6900-local':'6700-local';else if(active==='io'&&urlMode==='1S')modeByView.io='6781-1S';else if(active==='io'&&urlMode==='2S')modeByView.io='6900-2S';else if(active==='io'&&['6736-2S','6507-2S'].includes(urlMode))modeByView.io='6700-2S';else if(urlMode&&VIEWS.find(v=>v.id===active)?.modes.some(m=>m[0]===urlMode))modeByView[active]=urlMode;
let selected=null,hovered=null;
function E(parent,tag,attrs={},value){const e=document.createElementNS(NS,tag);for(const [key,val] of Object.entries(attrs))e.setAttribute(key,String(val));if(value!==undefined)e.textContent=value;parent.append(e);return e}
function R(p,x,y,w,h,fill,stroke='none',radius=0,sw=1,cls=''){return E(p,'rect',{x,y,width:w,height:h,rx:radius,fill,stroke,'stroke-width':sw,class:cls})}
function T(p,x,y,value,size=12,fill=palette.text,weight=600,anchor='start',cls=''){const readableSize=size<=11?Math.round(size*11.5)/10:size;return E(p,'text',{x,y,fill,'font-size':readableSize,'font-weight':weight,'text-anchor':anchor,class:cls},value)}
function P(p,d,kind=''){return E(p,'path',{d,class:`trace ${kind}`.trim()})}
function C(p,x,y,r,fill,stroke='none'){return E(p,'circle',{cx:x,cy:y,r,fill,stroke})}
function H(id,label,parent=svg,meta={}){if(!CONCEPTS[id])throw Error(`Missing definition: ${id}`);const hit=E(parent,'g',{class:'hit',role:'button',tabindex:0,'aria-label':label,'aria-pressed':'false','aria-controls':'featureDetail','data-id':id,'data-label':label});for(const [key,value] of Object.entries(meta))hit.dataset[key]=String(value);return hit}
function hitRect(id,label,x,y,w,h,fill='#1b3545',accent=palette.blue,subtitle='',parent=svg){const g=H(id,label,parent);R(g,x,y,w,h,fill,'#52748a',8,1.4,'surface');R(g,x+12,y+12,36,3,accent,'none',2);T(g,x+14,y+38,label,Math.min(17,w<150?12:15),palette.text,750);if(subtitle)T(g,x+14,y+h-14,subtitle,Math.min(11,w<155?9:10),palette.muted,550,'start','mono');return g}
function small(p,x,y,value,color=palette.quiet,anchor='start'){return T(p,x,y,value,10,color,700,anchor,'mono')}
function port(p,x,y,color=palette.cyan){C(p,x,y,4,color,'#d9f9ff')}
function defs(){const d=E(svg,'defs');let pat=E(d,'pattern',{id:'grid',width:25,height:25,patternUnits:'userSpaceOnUse'});E(pat,'path',{d:'M25 0H0V25',fill:'none',stroke:'#9bc9dd','stroke-width':.5,opacity:.11});let grad=E(d,'linearGradient',{id:'boardGrad',x1:0,y1:0,x2:1,y2:1});E(grad,'stop',{offset:'0%','stop-color':'#142638'});E(grad,'stop',{offset:'100%','stop-color':'#0d1824'});for(const [id,color] of [['arrowBlue',palette.blue],['arrowAmber',palette.amber],['arrowRose',palette.rose],['arrowViolet',palette.violet]]){const m=E(d,'marker',{id,viewBox:'0 0 10 10',refX:8.5,refY:5,markerWidth:8,markerHeight:8,markerUnits:'userSpaceOnUse',orient:'auto-start-reverse'});E(m,'path',{d:'M1 1L8.5 5L1 9',fill:'none',stroke:color,'stroke-width':1.6,'stroke-linejoin':'round','stroke-linecap':'round'})}}
function base(title,subtitle,metrics=[]){svg.replaceChildren();defs();R(svg,0,0,1200,650,palette.bg);R(svg,19,18,1162,614,'url(#boardGrad)','#36546a',13,1.3);R(svg,19,18,1162,614,'url(#grid)','none',13);R(svg,34,32,3,35,palette.blue,'none',2);T(svg,49,48,title,18,palette.text,800);T(svg,49,66,subtitle,11,palette.muted,500);let x=1164;for(let i=metrics.length-1;i>=0;i--){let m=metrics[i],w=m[2]||115;x-=w;R(svg,x,29,w,42,'#1b3040','#3b5a71',6,1);T(svg,x+10,47,m[0],14,palette.cyan,800);T(svg,x+10,62,m[1],9,palette.muted,650,'start','mono');x-=8}return svg}
function bracket(p,x1,y1,x2,y2,color=palette.line){P(p,`M${x1} ${y1}H${x2}V${y2}`,'light').setAttribute('stroke',color)}

function drawFamily(){
  base('XEON 6 / TWO PROCESSOR BUILDS','Compare cache ownership in separate P-core and E-core CPU packages.',[['P OR E','ONE CORE TYPE / CPU',162]]);
  const cards=[
    {x:61,w:505,id:'pProcessor',core:'pcore',designId:'redwoodCove',tag:'XEON 6 WITH P-CORES',name:'GRANITE RAPIDS · 6900P / 6700P / 6500P',design:'REDWOOD COVE',letter:'P',accent:palette.blue,fill:'#1b516d',cacheId:'privateL2'},
    {x:634,w:505,id:'eProcessor',core:'ecore',designId:'crestmont',tag:'XEON 6 WITH E-CORES',name:'SIERRA FOREST · 6700E',design:'CRESTMONT',letter:'E',accent:palette.mint,fill:'#24574f',cacheId:'sharedTileL2'}
  ];
  cards.forEach(c=>{
    const pkg=H(c.id,`${c.tag} processor package`);R(pkg,c.x,130,c.w,365,'#142a3a','#5d8194',12,1.5,'surface');R(pkg,c.x+17,147,4,29,c.accent,'none',2);small(pkg,c.x+32,155,'ONE CPU PACKAGE / ONE PROCESSOR MODEL',palette.muted);T(pkg,c.x+32,187,c.tag,21,palette.text,800);small(pkg,c.x+32,210,`PROCESSOR DESIGN · ${c.name}`,c.accent);
    const die=H('computeChiplet',`${c.name} compute chiplet region`);R(die,c.x+28,226,c.w-56,188,'#173447','#5e91a8',8,1.2,'surface');R(die,c.x+42,240,38,3,c.accent,'none',2);small(die,c.x+45,259,'COMPUTE CHIPLET(S) · FOUR CORES SHOWN AS EXAMPLES',c.accent);
    for(let i=0;i<4;i++){
      const x=c.x+52+i*100,cx=x+39;
      P(svg,`M${cx} 321V335`,'light');
      const core=H(c.core,`${c.letter}-core ${i+1} · ${c.design}`);R(core,x,273,78,48,c.fill,c.accent,6,1.1,'surface');R(core,x+10,283,58,3,c.accent,'none',2);T(core,cx,310,c.letter,21,palette.text,800,'middle','mono');
      if(c.letter==='P'){const cache=H(c.cacheId,`Private 2 MB L2 for P-core ${i+1}`);R(cache,x,335,78,30,'#374247','#b8aa7d',5,1.1,'surface');small(cache,cx,355,'2 MB L2',palette.amber,'middle')}
    }
    if(c.letter==='E'){const cache=H(c.cacheId,'One shared 4 MB L2 for the four pictured E-cores');R(cache,c.x+52,335,378,30,'#37483e','#a8bd83',5,1.1,'surface');small(cache,c.x+241,355,'ONE SHARED 4 MB L2 / E-CORE TILE',palette.amber,'middle')}
    const design=H(c.designId,`${c.design} ${c.letter}-core design`);R(design,c.x+42,376,c.w-84,31,'#1a3344','#45677b',5,1,'surface');small(design,c.x+54,396,`${c.letter}-CORE DESIGN · ${c.design}`,c.accent);
    P(svg,`M${c.x+c.w/2} 414V430`,'violet duplex');
    const io=H('ioChiplet',`${c.name} I/O chiplet function`);R(io,c.x+28,430,c.w-56,48,'#302f47','#968ac0',7,1.2,'surface');R(io,c.x+42,440,37,3,palette.violet,'none',2);T(io,c.x+47,462,'I/O CHIPLET FUNCTION',14,palette.text,750);small(io,c.x+c.w-44,461,'DEVICE / SOCKET LINKS',palette.violet,'end');
  });
  const shared=H('familyRelation','Two separate Xeon 6 CPU packages');R(shared,61,514,1078,98,'#1c3040','#547d93',10,1.2,'surface');R(shared,80,533,37,3,palette.cyan,'none',2);small(shared,82,551,'PHYSICAL RELATIONSHIP',palette.cyan);small(shared,1117,551,'POSSIBLE BOARD-MEMORY REQUEST AFTER CACHE MISSES',palette.amber,'end');T(shared,82,570,'P-CORE AND E-CORE XEON 6 ARE SEPARATE CPU PACKAGES',15,palette.text,750);
  const steps=[['CORE + L2',82],['ON-CHIP MESH / SHARED CACHE',349],['COMPUTE-SIDE IMC',616],['BOARD DDR5',883]],route=H('cacheRoute','Possible board-memory request after cache misses');
  steps.forEach(([label,x],i)=>{R(route,x,583,234,23,'#183746','#5e8192',5,1,'surface');small(route,x+117,599,label,i===3?palette.amber:palette.cyan,'middle');if(i<steps.length-1)P(route,`M${x+238} 594H${steps[i+1][1]-5}`,'light flow')});
}

function drawPackage(){
  const mode=modeByView.package||'6900';
  if(mode==='6700E'){drawEPackage();return}
  const forms={
    '6900':{model:'6 6900P family',branch:'Granite Rapids-AP',form:'UCC',n:3,channels:12},
    '6787':{model:'6 6700P family',branch:'Granite Rapids-SP',form:'XCC',n:2,channels:8},
    '6736':{model:'6 6700P/6500P family',branch:'Granite Rapids-SP',form:'HCC',n:1,channels:8,maxCores:48,dieW:622,exampleCores:6},
    '6507':{model:'6 6700P/6500P family',branch:'Granite Rapids-SP',form:'LCC',n:1,channels:8,maxCores:16,dieW:480,exampleCores:2}
  },{model,branch,form,n,channels,maxCores,dieW=622,exampleCores=4}=forms[mode];
  const ys=n===3?[214,332,450]:n===2?[260,405]:[305],dieH=n===3?76:n===2?90:110,socketName=n===3?'LGA7529-1':'LGA4710-2',channelsPerSide=n===1?4:2,dieX=(1200-dieW)/2,dieRight=dieX+dieW;
  const metrics=[[`${n}`,n===1?'COMPUTE DIE':'COMPUTE DIES',114],[`${channels}`,'DDR CHANNELS',126],['2','I/O DIES',95]];
  if(n===1)metrics.push([`≤${maxCores}`,'MAX P-CORES',123]);
  base('XEON 6 / PACKAGE AND BOARD',`${branch} · ${form} package class · die-to-board paths.`,metrics);
  const board=H('board','Server board');R(board,68,100,1064,518,'#102234','#42637a',12,1.2,'surface');small(board,87,126,'SERVER BOARD',palette.cyan);
  const socket=H('socket',`${socketName} processor socket`,svg,{model,branch,form,socketName});R(socket,240,116,720,486,'#1b3446','#5f7d90',14,1.3,'surface');small(socket,600,134,`SOCKET ${socketName}`,palette.cyan,'middle');
  const pkg=H('package',`Xeon ${model} ${branch} ${form} processor package`,svg,{model,branch,form,total:n,channels});R(pkg,252,141,696,455,'#112330','#59798d',12,1.5,'surface');R(pkg,261,150,678,436,'url(#grid)','none',10);
  const device=H('externalIo','Board device outside the CPU package');R(device,982,148,137,56,'#2b3348','#a098c4',7,1.2,'surface');T(device,1050.5,173,'PCIe / CXL',12,palette.text,750,'middle');small(device,1050.5,191,'BOARD DEVICE',palette.violet,'middle');P(svg,'M894 176H982','violet duplex');
  small(svg,117,579,'BOARD DIMMS',palette.amber);small(svg,117,595,'OFF PACKAGE',palette.muted);small(svg,1083,579,'BOARD DIMMS',palette.amber,'end');small(svg,1083,595,'OFF PACKAGE',palette.muted,'end');
  const bridgeGaps=[[198,ys[0]],...ys.slice(0,-1).map((y,i)=>[y+dieH,ys[i+1]]),[ys.at(-1)+dieH,543]];
  bridgeGaps.forEach(([from,to],i)=>{for(const x of [384,802]){const h=Math.min(14,to-from-2),y=(from+to-h)/2;P(svg,`M${x+7} ${from}V${to}`,'light violet');const bridge=H('packageFabric',`EMIB bridge at die boundary ${i+1}`);E(bridge,'rect',{x:x-6,y,width:26,height:h,fill:'transparent','pointer-events':'all'});R(bridge,x,y,14,h,'#235774','#4b9cbb',3,1,'surface');R(bridge,x+6,y+2,2,Math.max(2,h-4),palette.cyan,'none',1)}});
  for(const [y,label,index] of [[155,'I/O DIE 1',1],[543,'I/O DIE 2',2]]){const g=H('ioDie',label,svg,{model,branch,form,index,total:2});R(g,306,y,588,43,'#313049','#8776aa',7,1.4,'surface');R(g,322,y+9,37,3,palette.violet,'none',2);T(g,339,y+29,label,15,palette.text,750);small(g,878,y+27,'DEVICE LANES · UPI SOCKET LINKS',palette.muted,'end')}
  ys.forEach((y,i)=>{
    const cy=y+dieH/2,memY=y+(dieH-65)/2;
    P(svg,`M230 ${cy}H${dieX}`,'memory duplex');P(svg,`M${dieRight} ${cy}H970`,'memory duplex');
    const d=H('computeDie',`Compute die ${i+1} · ${form} class · P-cores, cache, and mesh`,svg,{model,branch,form,index:i+1,total:n,channelsPerDie:channels/n,maxCores:maxCores||''});R(d,dieX,y,dieW,dieH,'#1c4560','#5e95b3',8,1.4,'surface');R(d,dieX+77,y+8,dieW-154,dieH-16,'#17344a','#416f87',5,.9);T(d,600,y+24,`COMPUTE DIE ${String(i+1).padStart(2,'0')}${n===1?` · ${form}`:''}`,14,palette.text,800,'middle');small(d,n===1?600:704,y+53,'P-CORES  ·  L3  ·  MESH',palette.muted,'middle');
    const coreStart=n===1?600-(exampleCores*30+(exampleCores-1)*9)/2:400,coreY=y+(n===1?64:36);
    for(let j=0;j<exampleCores;j++){const x=coreStart+j*39,c=H('core',`Example P-core ${j+1} in compute die ${i+1}`);R(c,x,coreY,30,27,'#245c7a',palette.blue,4,1,'surface');T(c,x+15,coreY+19,'P',13,palette.text,800,'middle','mono')}
    for(const [x,side] of [[dieX+10,'A'],[dieRight-73,'B']]){const im=H('imc',`Memory-controller group ${i+1}${side} · ${channelsPerSide} channels`,svg,{model,branch,form,dieIndex:i+1,total:n,channels:channelsPerSide});R(im,x,y+7,63,dieH-14,'#1b6270','#74cfdd',5,1.1,'surface');T(im,x+31.5,y+32,'IMC',12,palette.text,800,'middle');small(im,x+31.5,y+51,`${channelsPerSide} CH`,palette.cyan,'middle')}
    for(const [x,side] of [[116,'L'],[970,'R']]){const mem=H('dram',`DDR5 board memory group · ${channelsPerSide} channels attached to die ${i+1} ${side}`,svg,{model,branch,form,dieIndex:i+1,total:n,channels:channelsPerSide});R(mem,x,memY,114,65,'#3d3b30','#bea777',6,1.1,'surface');for(const dx of [11,16,21])R(mem,x+dx,memY+11,2,43,palette.amber,'none',1);T(mem,x+30,memY+30,'DDR5',13,palette.text,750);small(mem,x+30,memY+50,`${channelsPerSide} CH GROUP`,palette.amber)}
    port(svg,dieX,cy,palette.amber);port(svg,dieRight,cy,palette.amber);
  });
  const gapTop=n===1?198:ys[0]+dieH,gapBottom=n===1?ys[0]:ys[1],plateH=n===3?23:39,plateY=(gapTop+gapBottom-plateH)/2,tag=H('packageFabric','EMIB bridges carrying Modular Mesh Fabric between dies');R(tag,437,plateY,326,plateH,'#193647','#5a9fba',5,1.1,'surface');if(n===3)small(tag,600,plateY+16,'EMIB BRIDGES · MODULAR MESH FABRIC',palette.cyan,'middle');else{small(tag,600,plateY+17,'EMIB BRIDGES · MODULAR MESH FABRIC',palette.cyan,'middle');small(tag,600,plateY+33,'LINK RATE NOT PUBLISHED',palette.muted,'middle')}
  if(n===1){
    small(svg,600,450,'ALTERNATE ONE-DIE CLASSES · SIZE / ICONS SCHEMATIC',palette.muted,'middle');
    for(const [name,limit,x] of [['HCC',48,430],['LCC',16,610]]){
      const activeClass=form===name;
      R(svg,x,462,160,52,activeClass?'#1f5068':'#1a3444',activeClass?palette.cyan:'#557789',6,activeClass?1.7:1);
      T(svg,x+13,484,name,15,activeClass?palette.cyan:palette.muted,800);
      small(svg,x+13,501,`UP TO ${limit} P-CORES`,activeClass?palette.text:palette.muted);
    }
  }
}

function drawEPackage(){
  base('XEON 6 / E-CORE PACKAGE','Sierra Forest-SP · 6700E branch · schematic chiplet arrangement.',[['1','COMPUTE DIE',119],['8','DDR CHANNELS',135],['2','I/O DIES',95]]);
  const board=H('board','Server board');R(board,68,101,1064,516,'#102234','#42637a',12,1.2,'surface');small(board,87,130,'SERVER BOARD',palette.cyan);
  const socket=H('socket','Sierra Forest-SP 6700E processor socket',svg,{model:'6 6700E family',socketName:'LGA4710-2'});R(socket,239,125,722,467,'#1b3446','#5f7d90',13,1.3,'surface');small(socket,600,145,'SOCKET LGA4710-2',palette.cyan,'middle');
  const pkg=H('eProcessor','Sierra Forest-SP 6700E processor package');R(pkg,252,159,696,418,'#132c39','#608595',11,1.4,'surface');small(pkg,275,183,'XEON 6 / SIERRA FOREST-SP / 6700E',palette.mint);small(pkg,924,183,'PACKAGE BOUNDARY',palette.quiet,'end');
  for(const y of [252,490]){P(svg,`M600 ${y}V${y+24}`,'violet duplex')}
  P(svg,'M891 386H981','memory duplex');P(svg,'M309 386H221','memory duplex');P(svg,'M867 222H981','violet duplex');P(svg,'M867 530H981','violet duplex');
  for(const [i,y] of [197,514].entries()){const label=`I/O DIE ${i+1}`,io=H('ioDie',`${label} · Sierra Forest-SP schematic`,svg,{model:'6 6700E',form:'Sierra Forest-SP / E-core',index:i+1,total:2});R(io,332,y,536,55,'#313049','#9587bc',7,1.2,'surface');T(io,600,y+26,label,15,palette.text,800,'middle');small(io,600,y+43,'PCIe / CXL DEVICE LANES · UPI SOCKET LINKS',palette.violet,'middle')}
  const comp=H('computeDie','E-core compute die in the Sierra Forest-SP schematic',svg,{model:'6 6700E',form:'Sierra Forest-SP / E-core',index:1,total:1,channelsPerDie:8});R(comp,309,276,582,214,'#174439','#66b89d',8,1.3,'surface');small(comp,327,299,'E-CORE COMPUTE DIE · SIERRA FOREST-SP',palette.mint);small(comp,873,299,'TILES + MEMORY INTERFACES',palette.quiet,'end');
  const tile=H('eModule','Representative E-core tile with shared L2');R(tile,420,327,360,128,'#235047','#78bda9',7,1.1,'surface');small(tile,438,347,'ONE EXAMPLE TILE · 2 OR 4 E-CORES',palette.mint);for(let i=0;i<4;i++){const x=442+i*79,c=H('ecore',`Example E-core ${i+1} in tile`);R(c,x,359,59,44,'#29635a',palette.mint,5,1,'surface');T(c,x+29.5,389,'E',17,palette.text,800,'middle','mono')}small(tile,600,431,'4 MB L2 SHARED WITHIN TILE',palette.amber,'middle');
  for(const [x,side] of [[322,'LEFT'],[805,'RIGHT']]){const im=H('memoryInterface',`${side.toLowerCase()} DDR5 memory interface · four channels`);R(im,x,345,73,85,'#1d6070','#77c7d3',5,1.1,'surface');T(im,x+36.5,377,'DDR5',12,palette.text,800,'middle');small(im,x+36.5,399,'4 CH',palette.cyan,'middle')}
  for(const [x,label] of [[89,'LEFT'],[981,'RIGHT']]){const mem=H('boardMemory',`${label.toLowerCase()} board DDR5 four-channel group`);R(mem,x,351,132,74,'#423e33','#bfa97a',7,1.2,'surface');for(const dx of [12,18,24])R(mem,x+dx,363,2,50,palette.amber,'none',1);T(mem,x+78,382,'DDR5',14,palette.text,800,'middle');small(mem,x+78,404,'4 CH GROUP',palette.amber,'middle')}
  const dev=H('externalIo','Board device reached from package I/O');R(dev,981,190,132,65,'#2b3348','#a098c4',7,1.2,'surface');T(dev,1047,219,'PCIe / CXL',12,palette.text,750,'middle');small(dev,1047,239,'BOARD DEVICE',palette.violet,'middle');
  const peer=H('upi','UPI link toward another compatible CPU socket');R(peer,981,500,132,64,'#2b3348','#a098c4',7,1.2,'surface');T(peer,1047,529,'UPI 2.0',12,palette.text,750,'middle');small(peer,1047,548,'TO PEER SOCKET',palette.violet,'middle');
  small(svg,600,606,'CHIPLET COUNTS ARE A PACKAGE SCHEMATIC · BLOCK POSITIONS ARE NOT A DIE FLOORPLAN',palette.mint,'middle');
}

function drawSNC(){
  const mode=modeByView.snc||'unified';
  const config={
    unified:{branch:'Granite Rapids-AP / UCC',n:3,channels:12,regions:1,showNodes:false,note:'SNC OFF · ONE OS DOMAIN ACROSS THE SOCKET',model:'6 6900P family',form:'Granite Rapids-AP / UCC',core:'P'},
    '6900-local':{branch:'Granite Rapids-AP / UCC',n:3,channels:12,regions:3,showNodes:true,note:'SNC3 · THREE DIE-LOCAL OS DOMAINS',model:'6 6900P family',form:'Granite Rapids-AP / UCC',core:'P'},
    '6700-local':{branch:'Granite Rapids-SP / XCC',n:2,channels:8,regions:2,showNodes:true,note:'SNC2 · TWO DIE-LOCAL OS DOMAINS',model:'6 6700P family',form:'Granite Rapids-SP / XCC',core:'P'},
    single:{branch:'Granite Rapids-SP / HCC-LCC',n:1,channels:8,regions:1,showNodes:false,note:'ONE COMPUTE DIE · ONE PHYSICAL DIE-LOCAL REGION',model:'6 6700P/6500P family',form:'Granite Rapids-SP / HCC-LCC',core:'P'},
    '6700E-local':{branch:'Sierra Forest-SP / 6700E',n:1,channels:8,regions:1,showNodes:false,note:'ONE PHYSICAL DIE · VIRTUALNUMA CAN CHANGE THE OS VIEW',model:'6 6700E',form:'Sierra Forest-SP / E-core',core:'E'}
  }[mode];
  const {branch,n,channels,regions,showNodes,note,model,form,core}=config;
  const w=n===3?310:n===2?458:690,gap=n===3?20:n===2?22:0,start=n===3?115:n===2?131:255;
  const domains=Array.from({length:n},(_,i)=>{const x=start+i*(w+gap);return {x,cx:x+w/2,imcCx:x+w-76}});
  base('NUMA / MEMORY LOCALITY',`${branch} · attached memory remains reachable from every compute die.`,[[String(regions),showNodes?'SNC NODES / CPU':mode==='unified'?'OS NUMA DOMAIN':'PHYSICAL DIE REGION',150],[String(channels),'DDR CHANNELS / CPU',150]]);
  const board=H('board','Server board with CPU and DDR5 modules');R(board,70,101,1060,517,'#102234','#42637a',12,1.2,'surface');small(board,90,128,'ONE CPU PACKAGE + BOARD DIMMS',palette.cyan);small(board,1110,128,note,palette.muted,'end');
  if(!showNodes){const all=H(mode==='unified'?'numa':'localityRegion',mode==='unified'?'One software-visible memory domain when SNC is off':'One physical compute-die memory region',svg,{model,form,channels});const x=n===1?235:100,width=n===1?730:1000;const box=R(all,x,158,width,383,'#245171','#76adca',10,1.3,'surface');box.setAttribute('fill-opacity','.06');box.setAttribute('stroke-dasharray',mode==='unified'?'7 7':'0');small(all,x+20,182,mode==='unified'?'ONE SOFTWARE-VISIBLE NUMA DOMAIN':'ONE PHYSICAL COMPUTE-DIE REGION',palette.cyan);if(mode==='6700E-local')small(all,x+20,204,'VIRTUALNUMA: OPTIONAL SOFTWARE MAP; PHYSICAL PATH UNCHANGED',palette.mint)}
  const pkg=H('package',`${branch} CPU package with ${n} compute die${n===1?'':'s'}`,svg,{model,form,total:n,channels});R(pkg,91,275,1018,133,'#142b3b','#587c91',12,1.3,'surface');small(pkg,111,291,'ONE CPU PACKAGE · COMPUTE DIES SHARE A FABRIC',palette.muted);small(pkg,1088,291,'PACKAGE BOUNDARY',palette.quiet,'end');
  if(showNodes){for(let i=0;i<n;i++){const {x}=domains[i],region=H('numa',`NUMA node ${i} · compute die and four attached DDR5 channels`,svg,{model,form,node:i,total:n,channels:4});const outline=R(region,x,158,w,383,'#245171','#76adca',10,1.3,'surface');outline.setAttribute('fill-opacity','.07');outline.setAttribute('stroke-dasharray','7 7');R(region,x+14,173,3,25,palette.blue,'none',2);T(region,x+27,191,`NUMA NODE ${i}`,15,palette.text,800);small(region,x+w-16,191,'SNC LOCALITY',palette.cyan,'end')}}
  domains.forEach(({x,cx,imcCx},i)=>{
    const groupChannels=n===1?8:4,memY=452,dieY=318;
    P(svg,`M${imcCx} 379V433H${cx}V${memY}`,'memory flow-memory');
    const die=H('computeDie',`Compute die ${i+1} · ${groupChannels} attached DDR5 channels`,svg,{model,form,index:i+1,total:n,channelsPerDie:groupChannels});R(die,x+25,dieY,w-50,82,'#1d4d67','#72a9c4',8,1.2,'surface');R(die,x+37,330,31,3,palette.blue,'none',2);T(die,x+40,351,`COMPUTE DIE ${i+1}`,14,palette.text,800);small(die,x+41,376,`${core}-CORES + CACHE`,palette.muted);
    const imc=H('imc',`Memory controller · ${groupChannels} channels on die ${i+1}`,svg,{model,form,dieIndex:i+1,total:n,channels:groupChannels});R(imc,imcCx-42,333,84,48,'#1b6270','#74cfdd',5,1.1,'surface');T(imc,imcCx,353,'IMC',12,palette.text,800,'middle');small(imc,imcCx,369,`${groupChannels} CH`,palette.cyan,'middle');
    const mem=H('localMemory',`${groupChannels} board DDR5 channels attached to die ${i+1}`,svg,{model,form,dieIndex:i+1,total:n,channels:groupChannels});R(mem,x+25,memY,w-50,66,'#423e32','#bca477',7,1.2,'surface');R(mem,x+37,memY+11,34,3,palette.amber,'none',2);T(mem,x+41,memY+35,'BOARD DDR5 CHANNEL GROUP',13,palette.text,750);small(mem,x+w-39,memY+51,`${groupChannels} CH · ATTACHED`,palette.amber,'end');port(svg,cx,memY,palette.amber);
  });
  if(showNodes&&n>1){
    const a=domains[0],b=domains[n-1],route=`M${a.x+82} 318V307H${b.imcCx}V333`,toMemory=`M${b.imcCx+10} 381V443H${b.cx+10}V452`;
    const remote=H('remoteMemory',`Example remote request · node 0 to node ${n-1} DDR5`,svg,{model,form,source:0,target:n-1,total:n});
    for(const d of [route,toMemory]){P(remote,d,'dashed violet surface').setAttribute('marker-end','url(#arrowViolet)');E(remote,'path',{d,fill:'none',stroke:'#ffffff','stroke-opacity':.001,'stroke-width':16,'pointer-events':'stroke'})}
    small(svg,600,239,`EXAMPLE REMOTE REQUEST · NODE 0 → NODE ${n-1} DDR5`,palette.violet,'middle');
  }
  const footerText=n===1?'ONE DIE → ALL EIGHT CHANNELS · OS NODES DEPEND ON CONFIGURATION':showNodes?'AMBER = ATTACHED DDR5 · VIOLET DASHES = REMOTE REQUEST · DASHED OUTLINES = SNC NODES':'DASHED OUTLINE = ONE OS DOMAIN · SOLID AMBER = PHYSICALLY ATTACHED DDR5';
  const footer=H(n===1?'localityRegion':'numa','NUMA describes locality, not memory isolation');R(footer,171,559,858,43,'#1b3444','#5e849a',6,1.1,'surface');T(footer,600,585,footerText,11,palette.text,750,'middle','mono');
}

function drawIO(){
  const mode=modeByView.io||'6900-2S',single=mode==='6781-1S';
  const platforms={
    '6900-2S':{model:'6 6900P',branch:'Granite Rapids-AP',form:'UCC',n:3,channels:12,lanes:96,upiLinks:6,socketName:'LGA7529-1',core:'P'},
    '6700-2S':{model:'6 6700P',branch:'Granite Rapids-SP',form:'XCC',n:2,channels:8,lanes:88,upiLinks:4,socketName:'LGA4710-2',core:'P'},
    '6781-1S':{model:'6 6700P',branch:'Granite Rapids-SP · selected 1S',form:'XCC',n:2,channels:8,lanes:136,upiLinks:0,socketName:'LGA4710-2',core:'P'},
    '6700E-2S':{model:'6 6700E',branch:'Sierra Forest-SP · 6780E example',form:'E-core',n:1,channels:8,lanes:88,upiLinks:4,socketName:'LGA4710-2',core:'E'}
  },{model,branch,form,n,channels,lanes,upiLinks,socketName,core}=platforms[mode];
  base('XEON 6 / SERVER PLATFORM LINKS',single?'Granite Rapids-SP · Xeon 6781P lane example · XCC layout schematic.':`${branch} · DDR5, PCIe/CXL, and UPI links.`,[[single?'1':'2','CPU SOCKETS',110],[`${lanes}`,'PCIe LANES / CPU · UP TO',189],[`${channels}`,'DDR CHANNELS / CPU',156]]);
  const board=H('board','Server board with processor sockets and device links');R(board,48,103,1104,515,'#102234','#42637a',12,1.2,'surface');small(board,68,129,'SERVER BOARD · LOGICAL CONNECTION PLACEMENT',palette.cyan);small(board,1132,129,single?'XCC LAYOUT ILLUSTRATIVE · 136 LANES: XEON 6781P':'PORT LOCATIONS AND DEVICE COUNT NOT SPECIFIED',palette.muted,'end');
  const positions=single?[{x:421,w:358,memX:325,side:'left',index:0}]:[{x:174,w:342,memX:77,side:'left',index:0},{x:684,w:342,memX:1039,side:'right',index:1}];
  positions.forEach(({x,w,memX,side,index})=>{
    const cx=x+w/2,cdYs=n===3?[283,326,369]:n===2?[292,353]:[297],cdH=n===3?34:n===2?50:106,dieEdge=side==='left'?x+41:x+w-41,memEdge=side==='left'?memX+84:memX;
    const memoryPaths=n===1?[318,382]:cdYs.map(y=>y+cdH/2);
    small(svg,memX+42,268,'BOARD DIMMS',palette.amber,'middle');
    const sock=H('socket',`Socket ${index} · ${socketName}`,svg,{model,branch,form,socket:index,socketName});R(sock,x,200,w,284,'#1a3445','#65889a',11,1.3,'surface');small(sock,x+18,222,`SOCKET ${index} · ${socketName}`,palette.cyan);small(sock,x+w-18,222,`XEON ${model} CPU`,palette.muted,'end');
    const pkg=H('package',`${model} CPU package in socket ${index}`,svg,{model,branch,form,total:n,channels,socket:index});R(pkg,x+13,230,w-26,232,'#102a3a','#5b7d91',8,1.2,'surface');
    for(const y of memoryPaths)P(svg,`M${memEdge} ${y}H${dieEdge}`,'memory duplex');
    for(const [y,label,dieNumber] of [[243,'I/O DIE 1',1],[414,'I/O DIE 2',2]]){const iod=H('ioDie',`${label} in CPU ${index}`,svg,{model,branch,form,index:dieNumber,total:2,socket:index});R(iod,x+41,y,w-82,33,'#312f49','#9384bb',5,1.1,'surface');T(iod,cx,y+22,label,13,palette.text,800,'middle')}
    cdYs.forEach((y,i)=>{const die=H('computeDie',`Compute die ${i+1} in ${model} ${form} CPU ${index}`,svg,{model,branch,form,index:i+1,total:n,channelsPerDie:channels/n,socket:index});R(die,x+41,y,w-82,cdH,'#1c4d69','#6ca8c5',5,1.1,'surface');T(die,x+60,y+cdH/2+5,`COMPUTE DIE ${String(i+1).padStart(2,'0')}`,12,palette.text,800);small(die,x+w-58,y+cdH/2+4,`${core}-CORES · IMC`,palette.cyan,'end')});
    memoryPaths.forEach((y,i)=>{const dieNumber=n===1?1:i+1,mem=H('dram',`Four-channel board DDR5 group attached to compute die ${dieNumber} in CPU ${index}`,svg,{model,branch,form,dieIndex:dieNumber,total:n,channels:4,socket:index});R(mem,memX,y-17,84,34,'#403d32','#bca477',5,1.1,'surface');T(mem,memX+42,y-2,'DDR5',11,palette.text,800,'middle');small(mem,memX+42,y+12,'4 CH GROUP',palette.amber,'middle');port(svg,memEdge,y,palette.amber);port(svg,dieEdge,y,palette.amber)});
    for(const [from,to] of [[276,cdYs[0]],...[...Array(n-1)].map((_,i)=>[cdYs[i]+cdH,cdYs[i+1]]),[cdYs.at(-1)+cdH,414]]){if(to-from<7)continue;for(const bx of [x+100,x+w-111]){const bridge=H('packageFabric',`EMIB bridge within CPU ${index}`);E(bridge,'rect',{x:bx-7,y:from,width:25,height:to-from,fill:'transparent','pointer-events':'all'});R(bridge,bx,from,11,to-from,'#235774','#4b9cbb',2,1,'surface')}}
    const groupX=single||index===0?x+w-22:x+22,ioEdge=single||index===0?x+w-41:x+41,pair=H('ioDie',`I/O die pair in CPU ${index} · external port locations not mapped`);P(pair,`M${ioEdge} 259H${groupX}V430H${ioEdge}`,'violet surface');E(pair,'path',{d:`M${groupX} 259V430`,fill:'none',stroke:'#ffffff','stroke-opacity':.001,'stroke-width':13,'pointer-events':'stroke'});
    const lane=H('ioLanes',`${model} external PCIe / CXL lane bank for CPU ${index}`,svg,{model,branch,form,lanes,socket:index});R(lane,x+9,499,w-18,54,'#26394c','#8a9ec0',6,1.1,'surface');T(lane,cx,520,single?'XEON 6781P · 136 PCIe 5.0 LANES':`UP TO ${lanes} PCIe 5.0 LANES`,12,palette.text,800,'middle');small(lane,cx,540,'32 GT/S PER LANE · UP TO 64 CXL-CAPABLE',palette.violet,'middle');
    const device=H('externalIo',`Board devices reached from CPU ${index}`);R(device,x+34,571,w-68,35,'#243a4b','#7199b0',5,1.1,'surface');T(device,cx,594,'BOARD PCIe / CXL DEVICES',11,palette.text,750,'middle');
    P(svg,`M${groupX} 430V481H${cx}V499`,'violet duplex');P(svg,`M${cx} 553V571`,'violet duplex');port(svg,groupX,430,palette.violet);
  });
  if(!single){
    const upi=H('upi',`UPI 2.0 socket link group · up to ${upiLinks} links per CPU`,svg,{model,branch,form,links:upiLinks});P(upi,'M494 259H706','violet duplex surface');E(upi,'path',{d:'M494 259H706',fill:'none',stroke:'#ffffff','stroke-opacity':.001,'stroke-width':17,'pointer-events':'stroke'});R(upi,525,229,150,66,'#302b47','#a68cdb',7,1.3,'surface');T(upi,600,252,'UPI 2.0',13,palette.text,800,'middle');small(upi,600,269,`UP TO ${upiLinks} LINKS / CPU`,palette.violet,'middle');small(upi,600,285,'UP TO 24 GT/S',palette.muted,'middle');port(svg,494,259,palette.violet);port(svg,706,259,palette.violet);
  }else{
    const note=H('socket','Selected Granite Rapids-SP one-socket platform');R(note,87,282,230,75,'#1a3445','#65889a',7,1.1,'surface');T(note,202,312,'ONE CPU SOCKET',14,palette.text,800,'middle');small(note,202,337,'NO INTER-SOCKET UPI PATH',palette.muted,'middle');
  }
}

const DRAW={drawFamily,drawPackage,drawSNC,drawIO};
const nav=document.getElementById('viewNav');const controls=document.getElementById('modeControls');const detail=document.getElementById('featureDetail');
document.querySelector('.diagram-orientation a[href="#featureDetail"]').addEventListener('click',event=>{event.preventDefault();detail.focus()});
const SOURCE_URLS={BRIEF:'https://www.intel.com/content/www/us/en/products/docs/xeon-6-product-brief.html',HPC:'https://www.intel.com/content/www/us/en/content-details/858491/intel-xeon-6-with-p-cores-configuration-and-tuning-guide-for-hpc-applications.html',RAS:'https://cdrdv2-public.intel.com/848948/Intel%C2%AE%20Xeon%C2%AE%206%20Processors%20with%20P-cores%20Reliability%20Availability%20and%20Serviceability.pdf',ARCH:'https://download.intel.com/newsroom/2023/data-center-hpc/Hot_Chips_23_Granite_Rapids_Sierra_Forest_Xeon_Press_Briefing.pdf','E-ARCH':'https://hc2023.hotchips.org/assets/program/conference/day1/CPU2/HC2023.Intel.Soltis.FINAL.pdf',FABRIC:'https://hc2023.hotchips.org/assets/program/conference/day1/Platforms/HC2023.Intel.Gianos.v7.pdf',EMIB:'https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2025-07/emib-product-brief.pdf','PCI-SIG':'https://pcisig.com/what-bit-rates-does-pcie-50-specification-support-and-how-does-it-compare-prior-pcie-generations',PLATFORM:'https://cdrdv2-public.intel.com/852810/HPC-and-AI-Workloads-with-Intel-Xeon-6-Processors.pdf',LANES:'https://cdrdv2-public.intel.com/842211/White-Paper-Micron-Intel-HPC-AI-Workloads.pdf',SOCKETS:'https://www.intel.com/content/www/us/en/support/articles/000055173/processors/intel-xeon-processors.html','6781P':'https://www.intel.com/content/www/us/en/products/sku/241834/intel-xeon-6781p-processor-336m-cache-2-00-ghz/specifications.html',SEPARATE:'https://www.intel.com/content/www/us/en/newsroom/news/tackling-throughput-computing-sierra-forest.html',COMPATIBILITY:'https://www.intel.com/content/www/us/en/support/articles/000029316/processors/intel-xeon-processors.html',CORE_NAMES:'https://www.intel.com/content/www/us/en/developer/topic-technology/software-security-guidance/processors-affected-consolidated-product-cpu-model.html',CATALOG:'https://www.intel.com/content/www/us/en/products/details/processors/xeon/6-e-core-series.html',XEON_PLUS:'https://www.intel.com/content/www/us/en/products/sku/246074/intel-xeon-6990e-processor-576m-cache-2-20-ghz/specifications.html',CXL:'https://community.intel.com/t5/Blogs/Tech-Innovation/Data-Center/Breaking-the-Memory-Wall-with-Compute-Express-Link-CXL/post/1594848'};
Object.assign(SOURCE_URLS,{
  SIZE:'https://www.nextplatform.com/compute/2024/09/24/intel-shoots-granite-rapids-xeon-6-into-the-datacenter/1650836',
  E6700:'https://www.intel.com/content/www/us/en/products/sku/240362/intel-xeon-6780e-processor-108m-cache-2-20-ghz/specifications.html',
  ELAUNCH:'https://www.computerbase.de/artikel/prozessoren/intel-xeon-6700e-sierra-forest-details.88231/',
  NUMA:'https://cdrdv2-public.intel.com/845720/845720_1p0.pdf',
  CLASS:'https://www.intel.cn/content/www/cn/zh/artificial-intelligence/new-xeon-6-products-cure-choice-difficulties.html',
  '6787P':'https://www.intel.com/content/www/us/en/products/sku/241844/intel-xeon-6787p-processor-336m-cache-2-00-ghz/specifications.html',
  '6736P':'https://www.intel.com/content/www/us/en/products/sku/242638/intel-xeon-6736p-processor-144m-cache-2-00-ghz/specifications.html',
  '6507P':'https://www.intel.com/content/www/us/en/products/sku/242668/intel-xeon-6507p-processor-48m-cache-3-50-ghz/specifications.html'
});
function sourceURL(ref){if(ref.includes('6990E+ specification'))return SOURCE_URLS.XEON_PLUS;return SOURCE_URLS[ref.trim().split(/\s|\//)[0]]||SOURCE_URLS.BRIEF}
function current(){return VIEWS.find(v=>v.id===active)||VIEWS[0]}
function syncURL(push=false){try{let u=new URL(location.href);u.searchParams.set('view',active);const v=current();if(v.modes.length)u.searchParams.set('mode',modeByView[active]||v.defaultMode);else u.searchParams.delete('mode');if(u.href!==location.href)history[push?'pushState':'replaceState'](null,'',u.href)}catch{}reportAtlasView();reportAtlasHeight()}
function clearSelection(){for(const el of svg.querySelectorAll('.hit.is-selected')){el.classList.remove('is-selected');el.setAttribute('aria-pressed','false')}selected=null;detail.dataset.active='false';document.getElementById('detailEyebrow').textContent='FIELD NOTES / SELECT A PART';document.getElementById('detailTitle').textContent='Explore the diagram';document.getElementById('detailDefinition').textContent='Hover over a part to see its name. Select it to read a short explanation.';document.getElementById('detailExplanation').textContent='The model notes above the diagram explain the relationships and configurations shown.';const context=document.getElementById('detailContext');context.textContent='';context.hidden=true;document.getElementById('detailSource').replaceChildren();const jump=document.getElementById('detailJump');jump.textContent='READ DEFINITION ↓';jump.removeAttribute('aria-label');jump.dataset.active='false'}
function hideTip(){tip.hidden=true;hovered=null}
function showTip(el){hovered=el;tip.textContent=el.dataset.label;tip.hidden=false;const a=el.getBoundingClientRect(),b=stage.getBoundingClientRect(),scroller=document.getElementById('stageScroller');let x=a.left-b.left+a.width/2-tip.offsetWidth/2;let y=a.top-b.top-tip.offsetHeight-9;if(y<8)y=a.bottom-b.top+8;const minX=scroller.scrollLeft+8,maxX=scroller.scrollLeft+scroller.clientWidth-tip.offsetWidth-8;tip.style.left=`${Math.max(minX,Math.min(x,Math.max(minX,maxX)))}px`;tip.style.top=`${Math.max(8,Math.min(y,b.height-tip.offsetHeight-8))}px`}
function selectedCopy(el){
  const item=CONCEPTS[el.dataset.id],d=el.dataset;
  const formName=d.branch?`${d.branch} / ${d.form}`:d.form;
  let title=item.title,what=item.what,how=item.how;
  const socket=d.socket===undefined?'':` in socket ${d.socket}`;
  if(d.model&&el.dataset.id==='computeDie'&&d.total){
    title=`Compute die ${d.index} · Xeon ${d.model} ${formName}`;
    what=`Compute die ${d.index}, ${Number(d.total)===1?'the single compute die':`one of ${d.total} compute dies`} in this Xeon ${d.model} (${formName}) CPU${socket}. It is a separate piece of silicon inside the package that holds cores, cache, and memory controllers.`;
    how=`This die connects to ${d.channelsPerDie} DDR5 memory channels on the board. The ${d.total} compute ${Number(d.total)===1?'die provides':'dies provide'} ${Number(d.total)*Number(d.channelsPerDie)} channels per CPU in this pictured configuration.${d.model.includes('6700E')?' The die arrangement is a schematic reading of Intel architecture figures, not a measured floorplan.':''}`;
    if(d.maxCores)how+=` ${d.form} supports up to ${d.maxCores} P-cores; ${d.form==='HCC'?'LCC uses a smaller one-die design with a 16-core ceiling.':'HCC uses a larger one-die design with a 48-core ceiling.'} These are class ceilings, not the active core count of every model.`;
  }else if(d.model&&el.dataset.id==='ioDie'&&d.index){
    title=`I/O die ${d.index} · Xeon ${d.model} ${formName}`;
    what=`I/O die ${d.index}, one of two in this Xeon ${d.model} (${formName}) CPU${socket}. It is a separate piece of silicon that connects the package to board devices and, in supported systems, another CPU socket.`;
    how=`The two I/O dies provide the external PCIe/CXL and supported UPI links. The drawing does not assign individual ports to either die.${d.model.includes('6700E')?' Their arrangement is schematic.':''}`;
  }else if(d.model&&el.dataset.id==='package'&&d.total){
    title=`Xeon ${d.model} · ${formName} CPU package`;
    what=`The physical Xeon ${d.model} CPU assembly${socket}. Its ${formName} layout contains ${d.total} compute ${Number(d.total)===1?'die':'dies'} and two I/O dies inside one package.`;
    how=`The compute ${Number(d.total)===1?'die connects':'dies connect'} to ${d.channels} DDR5 channels on the server board. The diagram shows functional relationships rather than an exact silicon floorplan.`;
    if(d.form==='HCC'||d.form==='LCC')how+=` This ${d.form} class supports up to ${d.form==='HCC'?48:16} P-cores; both HCC and LCC use one compute die, two I/O dies, and eight DDR5 channels.`;
  }else if(d.model&&el.dataset.id==='socket'&&d.socketName){
    title=`${d.socketName} socket · Xeon ${d.model}`;
    what=`The motherboard connector that holds this Xeon ${d.model} CPU package${socket}. ${d.socketName} is the socket type shown for this processor series.`;
    how='The processor model and board determine supported socket count and connection wiring. The diagram does not map individual socket pins.';
  }else if(d.model&&el.dataset.id==='imc'&&d.channels){
    title=`Memory controller · Xeon ${d.model} ${formName}`;
    what=`Circuits on compute die ${d.dieIndex} that connect this Xeon ${d.model} CPU to board memory. This drawn controller group serves ${d.channels} DDR5 channels.`;
    how=Number(d.total)===1?(Number(d.channels)===8?'This view groups all eight channels in one symbol; it does not claim one physical controller block.':'The one compute die serves eight channels in total. Its two drawn four-channel groups do not assert a count of physical controller blocks.'):'Each compute die serves four channels in total. The drawing groups them by memory-side connection.';
  }else if(d.model&&el.dataset.id==='dram'&&d.channels){
    title=`DDR5 board memory · Xeon ${d.model} ${formName}`;
    what=`Board memory holds data the CPU reads and writes. This symbol groups ${d.channels} DDR5 channels attached to compute die ${d.dieIndex}${socket}; it does not mean one DIMM.`;
    how=`The ${formName} CPU has ${d.total} compute ${Number(d.total)===1?'die':'dies'}; each drawn memory group follows a solid path to its attached die. Those paths are schematic, not motherboard traces.`;
  }else if(d.model&&el.dataset.id==='numa'&&d.node!==undefined){
    title=`NUMA node ${d.node} · Xeon ${d.model} ${formName}`;
    what=`One of ${d.total} software-visible memory-locality regions in this SNC-enabled Xeon ${d.model} CPU. It groups compute die ${Number(d.node)+1} with its ${d.channels} attached DDR5 channels.`;
    how='A core can also address another node’s memory through the package fabric. The dashed boundary marks locality, not a private memory partition.';
  }else if(d.model&&el.dataset.id==='localMemory'){
    title=`Local memory for die ${d.dieIndex} · Xeon ${d.model}`;
    what=`Board DDR5 memory attached to compute die ${d.dieIndex} in this Xeon ${d.model} (${formName}) CPU. This group represents ${d.channels} memory channels.`;
    how=Number(d.total)===1?'For cores on this one compute die, these are the physically attached memory channels. The software NUMA map depends on firmware configuration.':'For cores on that die, this is the local path. Cores on other dies can still reach these channels by crossing the package fabric.';
  }else if(d.model&&el.dataset.id==='remoteMemory'){
    title=`Remote request · Xeon ${d.model} ${formName}`;
    what=`A memory request from a core in NUMA node ${d.source} (compute die ${Number(d.source)+1}) to DDR5 attached to node ${d.target} (compute die ${Number(d.target)+1}) in the same CPU package.`;
    how=`This ${d.total}-die ${formName} example shows one possible cross-node route. Any source die may request another node’s memory; SNC does not restrict access.`;
  }else if(d.model&&el.dataset.id==='ioLanes'){
    title=`Device lanes · Xeon ${d.model} ${formName}`;
    what=`External high-speed wires from the I/O dies of this Xeon ${d.model} CPU${socket} to devices on the board.`;
    how=d.lanes==='136'?'Intel lists 136 PCIe 5.0 lanes for the one-socket Xeon 6781P. The pictured XCC-style die arrangement is illustrative; the lane count belongs to this named model. Up to 64 supported lanes may carry CXL 2.0 within that total.':`${d.model.includes('6700E')?'The pictured 6780E specification lists':`This pictured platform branch reaches up to`} ${d.lanes} PCIe 5.0 lanes per CPU. Up to 64 supported lanes may carry CXL 2.0; those are part of the PCIe lane total.`;
  }else if(d.model&&el.dataset.id==='upi'){
    title=`CPU-to-CPU links · Xeon ${d.model} ${formName}`;
    what=`Ultra Path Interconnect links between separate Xeon ${d.model} CPU sockets, not between dies inside one CPU package.`;
    how=`${d.model.includes('6700E')?'The pictured 6780E specification lists':'This branch reaches up to'} ${d.links} UPI 2.0 links per CPU at up to 24 billion transfers per second. The line summarizes the link group, not its board wiring.`;
  }
  return {title,what,how};
}
function selectHit(el,focusDetail=false){
  if(selected)selected.classList.remove('is-selected');
  for(const h of svg.querySelectorAll('.hit[aria-pressed="true"]'))h.setAttribute('aria-pressed','false');
  selected=el;el.classList.add('is-selected');el.setAttribute('aria-pressed','true');hideTip();
  const item=CONCEPTS[el.dataset.id];if(!item)throw Error(`Undefined selectable concept: ${el.dataset.id}`);
  const copy=selectedCopy(el),v=current(),lesson=LESSONS[v.id]?.[modeByView[v.id]]||LESSONS[v.id];
  detail.dataset.active='true';document.getElementById('detailEyebrow').textContent='COMPONENT / SELECTED';
  document.getElementById('detailTitle').textContent=copy.title;
  document.getElementById('detailDefinition').textContent=copy.what;
  document.getElementById('detailExplanation').textContent=copy.how;
  const context=document.getElementById('detailContext');context.textContent=`SHOWN IN THIS MODEL · ${lesson.scope}`;context.hidden=false;
  const eRefs={computeDie:'E-ARCH p. 12; ELAUNCH / ComputerBase launch reporting',ioDie:'E-ARCH p. 12; ELAUNCH / ComputerBase launch reporting',dram:'E-ARCH p. 12; E6700 / Intel 6780E specification',imc:'E-ARCH p. 12; E6700 / Intel 6780E specification',ioLanes:'E6700 / Intel 6780E specification',upi:'E6700 / Intel 6780E specification',socket:'SOCKETS / Intel supported-socket series list; E6700 / Intel 6780E specification',package:'E-ARCH p. 12; ELAUNCH / ComputerBase launch reporting',localMemory:'E-ARCH p. 12; E6700 / Intel 6780E specification',localityRegion:'NUMA / Intel NUMA white paper; E6700 / Intel 6780E specification'};
  const src=document.getElementById('detailSource');src.replaceChildren();const refs=el.dataset.model?.includes('6700E')&&eRefs[el.dataset.id]||item.ref;for(const ref of refs.split(';').map(s=>s.trim()).filter(Boolean)){const link=document.createElement('a');link.href=sourceURL(ref);link.target='_blank';link.rel='noopener noreferrer';link.textContent=`${ref} ↗`;src.append(link)}
  const jump=document.getElementById('detailJump');jump.textContent='READ SELECTED DEFINITION ↓';jump.setAttribute('aria-label',`Read definition for ${el.dataset.label}`);jump.dataset.active='true';
  for(const id of ['detailDefinition','detailExplanation','detailContext'])linkTerms(document.getElementById(id));
  if(focusDetail)detail.focus();
}
function bindHits(){for(const el of svg.querySelectorAll('.hit')){el.addEventListener('mouseenter',()=>showTip(el));el.addEventListener('mouseleave',()=>{if(hovered===el)hideTip()});el.addEventListener('focus',()=>showTip(el));el.addEventListener('blur',()=>{if(hovered===el)hideTip()});el.addEventListener('click',ev=>{ev.stopPropagation();selectHit(el)});el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();ev.stopPropagation();selectHit(el,true)}})}}
function makeNav(){nav.replaceChildren();VIEWS.forEach((v,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='view-btn';if(v.id===active)btn.setAttribute('aria-current','page');const number=document.createElement('span');number.className='view-number';number.textContent=String(i+1).padStart(2,'0')+' / MODEL';const label=document.createElement('span');label.className='view-label';label.textContent=v.name;btn.append(number,label);btn.addEventListener('click',ev=>{if(active===v.id)return;const keyboard=ev.detail===0;active=v.id;render(true,true);if(keyboard)nav.querySelector('[aria-current="page"]')?.focus()});nav.append(btn)})}
function makeModes(v){controls.replaceChildren();controls.dataset.count=String(v.modes.length);for(const [value,label] of v.modes){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String((modeByView[v.id]||v.defaultMode)===value));b.addEventListener('click',ev=>{if(modeByView[v.id]===value)return;const keyboard=ev.detail===0;modeByView[v.id]=value;render(false,true);if(keyboard)controls.querySelector('[aria-pressed="true"]')?.focus()});controls.append(b)}}
function makeTermButton(term,label=term){const button=document.createElement('button');button.type='button';button.className='term-link';button.dataset.term=term;button.setAttribute('aria-controls','termToastStack');button.setAttribute('aria-label',`Define ${label}`);button.textContent=label;return button}
function linkTerms(root){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
  for(let node=walker.nextNode();node;node=walker.nextNode()){
    if(node.parentElement?.closest('a,button,summary,script,style,svg,.term-toast'))continue;
    TERM_PATTERN.lastIndex=0;if(TERM_PATTERN.test(node.nodeValue))nodes.push(node);
  }
  for(const node of nodes){
    const value=node.nodeValue,fragment=document.createDocumentFragment();let last=0,match;
    TERM_PATTERN.lastIndex=0;
    while((match=TERM_PATTERN.exec(value))){
      const start=match.index,end=start+match[0].length;
      if((start&&/[A-Za-z0-9]/.test(value[start-1]))||(end<value.length&&/[A-Za-z0-9]/.test(value[end])))continue;
      const term=TERM_ALIASES[match[0].toLowerCase()]||TERM_INDEX.get(match[0].toLowerCase());
      if(!term)continue;
      fragment.append(document.createTextNode(value.slice(last,start)),makeTermButton(term,match[0]));last=end;
    }
    if(last){fragment.append(document.createTextNode(value.slice(last)));node.replaceWith(fragment)}
  }
}
function linkDynamicText(){for(const selector of ['#viewIntro','#viewPoints','#viewSummary','#viewLimits','#viewPath','#detailDefinition','#detailExplanation','#detailContext','#glossaryIntro','.scope-primary p','.scope-grammar span','.scope-context-items b','.scope-context-items span','.scope-context-items small','.scope-exclusions'])for(const el of document.querySelectorAll(selector))linkTerms(el)}
function makeKey(v,mode){const target=document.getElementById('diagramKey'),info=VIEW_KEYS[`${v.id}:${mode}`]||VIEW_KEYS[v.id],section=document.getElementById('diagramGlossary');target.replaceChildren();section.hidden=!info;if(!info)return;document.getElementById('glossaryCount').textContent=`${info.terms.length} TERMS · SELECT TO DEFINE`;document.getElementById('glossaryIntro').textContent=info.intro;for(const term of info.terms)target.append(makeTermButton(term))}
function render(resetScroll=false,pushHistory=false){const v=current(),mode=modeByView[v.id]||v.defaultMode,display=v.variants?.[mode]||v,lesson=LESSONS[v.id]?.[mode]||LESSONS[v.id];hideTip();makeNav();makeModes(v);makeKey(v,mode);document.getElementById('viewKicker').textContent=`MODEL ${String(VIEWS.indexOf(v)+1).padStart(2,'0')} / ${String(VIEWS.length).padStart(2,'0')}`;document.getElementById('viewScope').textContent=lesson.scope;document.getElementById('viewTitle').textContent=v.name;document.getElementById('viewSubtitle').textContent=display.subtitle;document.getElementById('viewRefs').textContent=display.refs;document.getElementById('viewPath').textContent=lesson.path;document.getElementById('readingTitle').textContent=display.subtitle;document.getElementById('viewIntro').textContent=display.intro;document.getElementById('viewSummary').textContent=lesson.summary;document.getElementById('viewLimits').textContent=lesson.limits;const list=document.getElementById('viewPoints');list.replaceChildren();for(const p of display.points){const li=document.createElement('li');li.textContent=p;list.append(li)}DRAW[v.draw]();clearSelection();bindHits();linkDynamicText();if(resetScroll)document.getElementById('stageScroller').scrollLeft=0;syncURL(pushHistory)}
window.addEventListener('resize',()=>{if(hovered)showTip(hovered)});
document.getElementById('stageScroller').addEventListener('scroll',()=>{if(hovered)showTip(hovered)});
window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search),id=p.get('view'),m=p.get('mode');active=id==='hierarchy'?'package':VIEWS.some(v=>v.id===id)?id:'family';if(current().modes.length&&!current().modes.some(x=>x[0]===m))modeByView[active]=current().defaultMode;if(id==='hierarchy')modeByView.package=m==='P'?'6900':'6700E';else if(active==='package'&&m==='6700')modeByView.package='6787';else if(active==='package'&&m==='6507')modeByView.package='6507';else if(active==='snc'&&['6900','6700'].includes(m))modeByView.snc=`${m}-local`;else if(active==='snc'&&m?.endsWith('-remote'))modeByView.snc=m.startsWith('6900')?'6900-local':'6700-local';else if(active==='io'&&['1S','2S'].includes(m))modeByView.io=m==='1S'?'6781-1S':'6900-2S';else if(active==='io'&&['6736-2S','6507-2S'].includes(m))modeByView.io='6700-2S';else if(current().modes.some(x=>x[0]===m))modeByView[active]=m;render(false)});
const termToastStack=document.getElementById('termToastStack'),termToastTemplate=document.getElementById('termToastTemplate');
const TERM_TOAST_DURATION=15000,TERM_TOAST_CIRCUMFERENCE=2*Math.PI*15;
const openTermToasts=new Map();
let termToastInterval=0;
function closeTermToast(toast){
  const state=openTermToasts.get(toast);if(!state)return;
  const returnFocus=document.activeElement===state.closeButton;
  openTermToasts.delete(toast);toast.remove();
  if(!openTermToasts.size){clearInterval(termToastInterval);termToastInterval=0}
  if(returnFocus&&state.trigger?.isConnected)state.trigger.focus();
}
function updateTermToastTimers(){
  const now=performance.now();
  for(const [toast,state] of openTermToasts){
    const remaining=Math.max(0,state.deadline-now);
    state.progress.style.strokeDashoffset=String(TERM_TOAST_CIRCUMFERENCE*(1-remaining/TERM_TOAST_DURATION));
    state.countdown.textContent=`${Math.ceil(remaining/1000)}s`;
    if(remaining<=0)closeTermToast(toast);
  }
}
function showTermToast(term,trigger){
  const toast=termToastTemplate.content.firstElementChild.cloneNode(true);
  const closeButton=toast.querySelector('.term-toast-timer button');
  toast.setAttribute('aria-label',`Definition of ${term}`);
  toast.querySelector('.term-toast-title').textContent=term;
  toast.querySelector('.term-toast-definition').textContent=KEY_TERMS[term];
  closeButton.setAttribute('aria-label',`Close ${term} definition; otherwise closes automatically after 15 seconds`);
  openTermToasts.set(toast,{trigger,closeButton,progress:toast.querySelector('.term-timer-progress'),countdown:toast.querySelector('.term-toast-countdown'),deadline:performance.now()+TERM_TOAST_DURATION});
  termToastStack.prepend(toast);
  positionEmbeddedTermToasts();
  closeButton.addEventListener('click',()=>closeTermToast(toast));
  updateTermToastTimers();
  if(!termToastInterval){
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    termToastInterval=setInterval(updateTermToastTimers,reducedMotion?1000:50);
  }
}
document.addEventListener('click',event=>{
  const trigger=event.target.closest?.('.term-link[data-term]');if(!trigger)return;
  event.stopPropagation();const term=trigger.dataset.term;if(!KEY_TERMS[term])return;
  showTermToast(term,trigger);
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&openTermToasts.size){event.preventDefault();closeTermToast(document.activeElement?.closest?.('.term-toast')||termToastStack.firstElementChild)}});

const atlasEmbedded=params.get('embedded')==='1'&&window.parent!==window;
const atlasParentOrigin=location.protocol==='file:'?'*':location.origin;
const atlasShell=document.querySelector('.app-shell');
let atlasParentReady=false,lastAtlasHeight=-1,lastAtlasView='',lastAtlasMode='';
function atlasHeight(){return Math.ceil(atlasShell.getBoundingClientRect().height)+2}
function tellAtlasParent(type,fields={}){if(atlasEmbedded)window.parent.postMessage({type,...fields},atlasParentOrigin)}
function positionEmbeddedTermToasts(){
  if(!atlasEmbedded||!openTermToasts.size)return;
  try{
    const frame=window.frameElement,rect=frame?.getBoundingClientRect();if(!rect)return;
    const visibleTop=Math.max(0,-rect.top),visibleBottom=Math.min(rect.height,window.parent.innerHeight-rect.top);
    if(visibleBottom<=visibleTop)return;
    const inset=window.parent.innerWidth<=480?10:18,top=visibleTop+inset;
    termToastStack.style.top=`${top}px`;
    termToastStack.style.maxHeight=`${Math.max(0,visibleBottom-top-inset)}px`;
  }catch{}
}
function reportAtlasHeight(){if(!atlasParentReady)return;const height=atlasHeight();if(height!==lastAtlasHeight){lastAtlasHeight=height;tellAtlasParent('xeon-atlas:height',{height})}}
function reportAtlasView(){
  if(!atlasParentReady)return;
  const view=active,mode=current().modes.length?modeByView[active]||current().defaultMode:null;
  if(view===lastAtlasView&&mode===lastAtlasMode)return;
  lastAtlasView=view;lastAtlasMode=mode;
  tellAtlasParent('xeon-atlas:view',{view,mode});
}
render();
for(const selector of ['.hero p','.scope-primary p','.scope-context-items b','.scope-context-items span','.scope-exclusions','.source-card>p','.additional-sources>p','.product-context p'])for(const el of document.querySelectorAll(selector))linkTerms(el);
if(atlasEmbedded){
  const view=active,mode=current().modes.length?modeByView[active]||current().defaultMode:null,height=atlasHeight();
  atlasParentReady=true;lastAtlasHeight=height;lastAtlasView=view;lastAtlasMode=mode;
  tellAtlasParent('xeon-atlas:ready',{view,mode,height});
  if('ResizeObserver'in window)new ResizeObserver(reportAtlasHeight).observe(atlasShell);
  window.addEventListener('load',reportAtlasHeight);
  document.fonts?.ready.then(reportAtlasHeight);
  try{window.parent.addEventListener('scroll',positionEmbeddedTermToasts,{passive:true});window.parent.addEventListener('resize',positionEmbeddedTermToasts)}catch{}
}
