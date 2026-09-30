(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.querySelector('#diagram');
  const stage = document.querySelector('#stage');
  const tip = document.querySelector('#hoverTip');
  const nav = document.querySelector('#viewNav');
  const C = { bg:'#0b1420', panel:'#142839', inner:'#1b394b', edge:'#4b7085', text:'#edf7fb', muted:'#a1bccc', compute:'#53c7f4', fabric:'#aa93ff', memory:'#efc77e', green:'#85dc70' };
  const SRC = {
    gh:{label:'GH200 architecture · Figure 2',url:'https://developer.nvidia.com/blog/nvidia-grace-hopper-superchip-architecture-in-depth/'},
    gr:{label:'Grace whitepaper v1.1 · pp. 5–7, Table 1 and Figure 2',url:'https://dam-cdn.nvd.orangelogic.com/AssetLink/0ins1m74kwu3uc06dyow18b1s1v654m2.pdf'},
    grmem:{label:'Grace CPU architecture · LPDDR5X interface',url:'https://developer.nvidia.com/blog/inside-nvidia-grace-cpu-nvidia-amps-up-superchip-engineering-for-hpc-and-ai/'},
    h100:{label:'H100 whitepaper v1.04 · pp. 18–21, 47; Figures 6–7',url:'https://dam-cdn.nvd.orangelogic.com/AssetLink/705n6ur546g0uk43w0117r17n8042d73.pdf'},
    cfg:{label:'Grace Performance Tuning Guide · GH200 configuration',url:'https://docs.nvidia.com/dccpu/grace-perf-tuning-guide/index.html'}
  };
  const PARTS = {
    grace:{what:'Grace is the CPU die in GH200. It runs general-purpose instructions and connects those cores to memory and system I/O.',design:'One GH200 has one Grace system-on-chip with 72 Arm Neoverse V2 cores. Its Scalable Coherency Fabric links the cores to distributed L3 cache, LPDDR5X memory interfaces, PCIe system I/O, and the Hopper link. The LPDDR5X packages are beside the CPU silicon die on the module. The two-Grace Grace CPU Superchip is a separate product.',source:'gh'},
    hopper:{what:'Hopper is the GPU die in GH200. Its repeated processing units run many groups of threads in parallel.',design:'One GH200 pairs one Hopper GPU with one Grace CPU over NVLink-C2C. Inside Hopper, GPCs contain TPCs, which contain the SMs that execute GPU work. Memory requests can be served by on-die L2 cache or continue through GPU memory controllers to attached HBM. The detailed view is the full GH100 blueprint, not an inventory of units enabled in a particular GH200.',source:['gh','h100']},
    lpddr:{what:'LPDDR5X is Grace’s main memory. These off-die DRAM packages hold instructions and data while CPU programs run.',design:'Grace memory controllers connect the CPU fabric to LPDDR5X packages on the GH200 module. LPDDR5X is a separate physical memory pool from Hopper HBM, but the coherent NVLink-C2C path lets the GPU access CPU-resident data. Capacity and bandwidth vary across GH200 configurations; the three drawn packages do not specify an actual package count.',source:'gh'},
    hbm:{what:'High Bandwidth Memory (HBM) is stacked DRAM placed next to a GPU die to supply data to its many processing units.',design:'When requested data is not in GPU cache, Hopper reaches its attached HBM through on-die memory controllers. HBM remains physically distinct from Grace LPDDR5X, although the CPU can access GPU-resident memory across NVLink-C2C. GH200 configurations use HBM3 or HBM3e; the six positions in the full GH100 blueprint are not a stack count for every GH200 product.',source:['h100','cfg']},
    c2c:{what:'NVLink-C2C is the direct link between the Grace CPU and Hopper GPU that lets them access each other’s memory coherently.',design:'In one GH200, it joins the two processor dies and carries up to 900 GB/s total bidirectional bandwidth, up to 450 GB/s each way. Hardware coherence supports fine-grained access to memory on the other die and synchronization through atomic operations. This on-module CPU-to-GPU path is separate from Grace PCIe device links and Hopper fourth-generation NVLink links to peer GPUs.',source:'gh'},
    core:{what:'An Arm Neoverse V2 CPU core executes instructions for a software thread. Small private caches keep frequently used instructions and data close to it.',design:'One GH200 Grace CPU has 72 such cores. Each core has private L1 and L2 caches; a request not served there can reach shared L3 through the SCF or continue toward LPDDR5X. The drawn core regions stand for the repeated architecture, not the number or precise placement of physical cores.',source:'gr'},
    scf:{what:'The Scalable Coherency Fabric (SCF) is Grace’s internal mesh for moving requests among cores, cache, memory interfaces, I/O, and NVLink-C2C while keeping cached data consistent.',design:'Cache Switch Nodes route traffic through the mesh, and distributed cache partitions provide shared L3 storage. A core request can be served by cache or travel across the fabric to a memory or I/O endpoint. NVIDIA cites over 3.2 TB/s of SCF bisection bandwidth, an internal fabric measure rather than the rate of LPDDR5X. Grid spacing and node count here are illustrative.',source:['gr','gh']},
    csn:{what:'A Cache Switch Node (CSN) is a routing point in Grace’s coherency mesh. It forwards traffic rather than storing the cached data itself.',design:'CSNs serve as interfaces among CPU cores, SCF cache partitions, memory, and system I/O. A request can pass through one or more nodes on its way to the appropriate cache or external interface, with responses returning through the fabric. The selected node is one representative example; its drawn position and the number of symbols are not a floorplan.',source:'gr'},
    l3:{what:'Level-three (L3) cache is a larger store shared by Grace CPU cores. Reusing data there avoids some trips to external LPDDR5X memory.',design:'Grace spreads its L3 storage among SCF cache partitions instead of putting one L3 block beside every core. Core-private L1 and L2 caches handle nearby hits first; other requests can reach these shared partitions through the fabric. Each drawn tile represents the role of a partition, not a physical count or a capacity claim for a GH200 configuration.',source:'gr'},
    memctrl:{what:'A memory controller turns CPU reads and writes into commands for the attached LPDDR5X memory packages.',design:'Grace memory interfaces sit between its SCF and off-die LPDDR5X. A request that must reach main memory leaves the CPU die through this interface, and returned data travels back toward the requesting core. NVIDIA describes a 32-channel LPDDR5X interface for Grace; the single drawn controller bar represents that interface group, not one channel or a measured die edge.',source:['gr','grmem']},
    pcie:{what:'PCI Express (PCIe) Gen 5 is a high-speed connection from Grace to board devices such as network adapters and storage controllers.',design:'Grace system I/O carries device traffic between its internal fabric and external PCIe links. NVIDIA’s GH200 architecture overview lists up to 64 PCIe Gen 5 lanes for its Grace CPU; actual devices and wiring depend on the server board. The drawn endpoint is a logical example. PCIe is distinct from the on-module coherent NVLink-C2C bridge to Hopper.',source:'gh'},
    gpc:{what:'A GPU Processing Cluster (GPC) is a large repeated compute grouping inside GH100. It gathers nearby TPCs and SMs so GPU work can run across many units.',design:'The full GH100 blueprint contains eight GPCs. Each full GPC has nine TPC positions, and each TPC contains two SMs, yielding 18 SM positions per GPC. The selected group is one of those eight blueprint positions; the exact number of active units in a shipping Hopper GPU can be lower.',source:'h100'},
    tpc:{what:'A Texture Processing Cluster (TPC) is a subdivision of a GPU Processing Cluster that groups two streaming multiprocessors. It is an on-die grouping, not another chip.',design:'The full GH100 blueprint has nine TPC positions in each of eight GPCs, for 72 total. Both SMs in a TPC execute GPU threads, including general compute work; the historical “Texture” name does not limit the unit to graphics. The selected TPC is one repeated example, and shipping products may enable fewer.',source:'h100'},
    sm:{what:'A streaming multiprocessor (SM) is a GPU work engine that executes groups of parallel threads. It contains arithmetic hardware and fast local storage.',design:'Each TPC in the full GH100 blueprint contains two SMs. Hopper SMs include CUDA arithmetic units, fourth-generation Tensor Cores for matrix math, and shared memory/L1 cache for nearby data. The full die has 144 SM positions, but enabled counts vary by product; the two enlarged symbols explain a TPC, not the active SM count of a GH200.',source:'h100'},
    gpuL2:{what:'Level-two (L2) cache is on-die memory shared across the GPU. It keeps recently used data close to SMs and reduces transfers to HBM.',design:'Memory requests from GPCs can be served by L2; misses continue through memory controllers to HBM. The full GH100 design lists 60 MB of L2, while the separate H100 SXM5 configuration enables 50 MB. One horizontal band represents the partitioned cache logically, not its literal die shape or the enabled capacity of a particular GH200.',source:'h100'},
    gpuMC:{what:'A GPU memory controller turns GPU read and write requests into transfers to an attached HBM stack.',design:'In the full GH100 blueprint, twelve 512-bit controllers serve six HBM stack positions, represented here as six pairs. An L2 miss can proceed through a controller to HBM before the requested data returns to the GPU. These are blueprint maxima; active memory interfaces and stack counts vary by product, and the drawn edge positions are schematic.',source:'h100'},
    nvlink4:{what:'Fourth-generation NVLink is Hopper’s high-speed connection for exchanging data with other GPUs.',design:'When a GH200 system provides peer GPU links or an NVSwitch fabric, Hopper can use this interface for GPU-to-GPU memory traffic. The H100 whitepaper describes 18 fourth-generation links and 900 GB/s total multi-GPU bandwidth for its H100 example; those figures are not a guaranteed GH200 port count or server topology. This peer-GPU interface is separate from NVLink-C2C between Hopper and Grace.',source:'h100'}
  };
  const TERMS = {
    GH200:'NVIDIA product name for a Grace CPU plus a Hopper GPU joined by NVLink-C2C in one superchip.',
    GH100:'The Hopper GPU silicon design shown as a full architectural blueprint here; an actual product may enable fewer units.',
    H100:'An NVIDIA GPU product based on GH100 silicon. Its enabled units and memory configuration can differ from the full die blueprint.',
    CPU:'Central processing unit: the general-purpose processor that runs software instructions. Grace is the CPU in GH200.',
    GPU:'Graphics processing unit: a processor with many parallel work engines. Hopper is the GPU in GH200.',
    SoC:'System-on-chip: a processor die that includes cores and supporting fabric, memory, and I/O logic.',
    'Neoverse V2':'The Arm CPU core design used by Grace. One GH200 Grace CPU contains 72 of these cores.',
    SCF:'Scalable Coherency Fabric: Grace’s mesh connecting cores, distributed cache, memory, and I/O.',
    CSN:'Cache Switch Node: a routing point in the Grace coherency fabric.',
    L1:'Level-one cache: a small, fast store closest to a CPU core or GPU work engine.',
    L2:'Level-two cache: storage beyond L1. Grace cores have private L2 caches; Hopper has a larger L2 shared across the GPU.',
    L3:'Level-three cache: a larger store shared by Grace CPU cores through the Scalable Coherency Fabric.',
    GPC:'GPU Processing Cluster: a large repeated grouping of TPCs inside GH100.',
    TPC:'Texture Processing Cluster: a GPU block with two streaming multiprocessors.',
    SM:'Streaming Multiprocessor: the Hopper GPU work engine that executes groups of threads.',
    HBM:'High Bandwidth Memory: stacked memory located beside, not inside, the GPU silicon die.',
    HBM3:'Third-generation High Bandwidth Memory used in some GH200 configurations; its capacity and bandwidth depend on the product.',
    HBM3e:'An enhanced HBM3 memory variant used in some GH200 configurations. It is a GPU memory type, separate from Grace LPDDR5X.',
    LPDDR5X:'Low Power Double Data Rate 5X: memory attached to the Grace CPU.',
    DRAM:'Dynamic random-access memory: the working memory in packages outside the processor dies. Grace LPDDR5X and Hopper HBM are different DRAM pools.',
    NVLink:'NVIDIA’s high-speed link family. NVLink-C2C joins Grace to Hopper inside GH200; fourth-generation NVLink may join Hopper to peer GPUs in a configured system.',
    'NVLink-C2C':'NVLink Chip-to-Chip: the coherent Grace-to-Hopper link within GH200.',
    'NVLink 4':'Fourth-generation NVLink: an external link from Hopper to peer GPUs; it is distinct from Grace-to-Hopper NVLink-C2C.',
    NVSwitch:'A switch that connects multiple GPUs over NVLink in supported systems. It does not replace the Grace-to-Hopper NVLink-C2C link inside GH200.',
    'Tensor Core':'Specialized arithmetic hardware inside a Hopper SM for supported matrix calculations.',
    CUDA:'NVIDIA’s GPU programming system for running general-purpose parallel work on streaming multiprocessors.',
    PCIe:'PCI Express: the standard interface for attaching external devices.',
    'Cache coherence':'Hardware coordination that keeps shared data consistent when different processors or caches read and update it.',
    'Atomic operation':'An indivisible update to shared data that helps CPU and GPU work coordinate safely.'
  };
  const TERM_ALIASES = {
    CPUs:'CPU',GPUs:'GPU',CSNs:'CSN',GPCs:'GPC',TPCs:'TPC',SMs:'SM',
    'Neoverse V2 cores':'Neoverse V2','Tensor Cores':'Tensor Core',
    'Scalable Coherency Fabric':'SCF','Cache Switch Nodes':'CSN','Cache Switch Node':'CSN',
    'coherent':'Cache coherence','coherently':'Cache coherence','coherence':'Cache coherence',
    'atomic operations':'Atomic operation','fourth-generation NVLink':'NVLink 4',C2C:'NVLink-C2C'
  };
  const TERM_INDEX = new Map(Object.keys(TERMS).map(term=>[term.toLowerCase(),term]));
  const TERM_ALIAS_INDEX = new Map(Object.entries(TERM_ALIASES).map(([label,term])=>[label.toLowerCase(),term]));
  const TERM_PATTERN = new RegExp([...Object.keys(TERMS),...Object.keys(TERM_ALIASES)]
    .sort((a,b)=>b.length-a.length)
    .map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'gi');
  const VIEWS = [
    {id:'superchip',number:'01',name:'GH200 at a glance',kicker:'SUPERCHIP MAP',scope:'ONE GRACE CPU + ONE HOPPER GPU',title:'Where the two processors live',subtitle:'The simple physical relationship before opening either chip.',notes:'Follow the two attached memory pools and the one coherent chip-to-chip link between processors.',points:['Grace owns its LPDDR5X connection.','Hopper owns its HBM connection.','NVLink-C2C joins the two processors.'],limit:'This is a module-level relationship diagram, not a scaled package outline. Memory packages are beside their respective processor dies. The small internal blocks and drawn memory packages are representative symbols, not physical unit counts; capacities and placement vary.',path:'LPDDR5X ⇄ Grace CPU ⇄ NVLink-C2C ⇄ Hopper GPU ⇄ HBM',refs:['gh','cfg'],terms:['GH200','CPU','GPU','SoC','LPDDR5X','HBM','NVLink-C2C','Cache coherence'],draw:drawSuperchip},
    {id:'grace',number:'02',name:'Inside the Grace CPU',kicker:'CPU SOC',scope:'ONE GRACE DIE / GH200',title:'Cores and cache on a coherent mesh',subtitle:'A source-based map of the CPU’s internal roles and interfaces.',notes:'Grace connects Arm CPU cores and distributed L3 cache partitions through its Scalable Coherency Fabric. Cache Switch Nodes route among them, memory, and I/O.',points:['72 Neoverse V2 cores in one GH200 Grace CPU.','SCF mesh links compute, cache, LPDDR5X, and I/O.','NVLink-C2C leaves Grace for the Hopper GPU.'],limit:'Repeated core, cache, and switch glyphs are representative only. Their drawn count and positions are not die-floorplan claims. The Grace whitepaper’s 144-core totals describe two Grace CPUs.',path:'Core ⇄ SCF / distributed L3 ⇄ memory interface ⇄ LPDDR5X; SCF ⇄ NVLink-C2C',refs:['gr','gh'],terms:['GH200','SoC','Neoverse V2','SCF','CSN','L1','L2','L3','LPDDR5X','DRAM','PCIe','NVLink-C2C'],draw:drawGraceGrid},
    {id:'hopper',number:'03',name:'Inside the Hopper GPU',kicker:'GPU DIE',scope:'FULL GH100 BLUEPRINT',title:'The repeated GPU hierarchy',subtitle:'A chip-like schematic based on NVIDIA’s full GH100 block diagram.',notes:'The full GH100 design nests two SMs in each TPC, nine TPCs in each GPC, and eight GPCs on the die. The GPU’s L2 cache and memory controllers sit between compute and HBM.',points:['8 GPC × 9 TPC × 2 SM = 144 SM positions in the full blueprint.','Six HBM stack positions and twelve controllers are full-die maxima.','Shipping H100 and GH200 configurations enable fewer units.'],limit:'This is the full GH100 architectural blueprint from the H100 whitepaper, not an enabled-unit map of a particular GH200. The grid, L2 band, interface positions, and short vertical traces are schematic; all eight GPCs use the L2/memory system. The edge labels distinguish on-module C2C from external GPU NVLink.',path:'GPC → TPC → SM for compute hierarchy; SM ⇄ L2 ⇄ memory controllers ⇄ HBM',refs:['h100','cfg'],terms:['GH100','H100','GPC','TPC','SM','L1','L2','HBM','HBM3','HBM3e','Tensor Core','CUDA','NVLink','NVLink-C2C','NVLink 4','NVSwitch'],draw:drawHopperGrid}
  ];
  let viewId = new URLSearchParams(location.search).get('view');
  if (!VIEWS.some(v=>v.id===viewId)) viewId='superchip';
  let selected = null, timerSeq=0;
  const atlasEmbedded = new URLSearchParams(location.search).get('embedded')==='1'&&window.parent!==window;
  const atlasParentOrigin = location.protocol==='file:'?'*':location.origin;
  const atlasShell = document.querySelector('.shell');
  let atlasParentReady=false,lastAtlasHeight=-1,lastAtlasView='';
  function atlasHeight(){return Math.ceil(atlasShell.getBoundingClientRect().height)+2;}
  function tellAtlasParent(type,fields={}){if(atlasEmbedded)window.parent.postMessage({type,...fields},atlasParentOrigin);}
  function reportAtlasHeight(){
    if(!atlasParentReady)return;
    const height=atlasHeight();
    if(height===lastAtlasHeight)return;
    lastAtlasHeight=height;
    tellAtlasParent('gh200-atlas:height',{view:viewId,height});
  }
  function reportAtlasView(){
    if(!atlasParentReady||viewId===lastAtlasView)return;
    lastAtlasView=viewId;
    tellAtlasParent('gh200-atlas:view',{view:viewId,height:atlasHeight()});
    reportAtlasHeight();
  }

  function S(tag,attrs={},parent=svg,value){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(value!==undefined)el.textContent=value;parent.append(el);return el;}
  function rect(p,x,y,w,h,fill,stroke='none',r=0,cls=''){return S('rect',{x,y,width:w,height:h,rx:r,fill,stroke,class:cls},p);}
  function line(p,x1,y1,x2,y2,cls=''){return S('line',{x1,y1,x2,y2,class:'trace '+cls},p);}
  function path(p,d,cls=''){return S('path',{d,class:'trace '+cls},p);}
  function txt(p,x,y,value,size=13,fill=C.text,weight=600,anchor='start',cls=''){return S('text',{x,y,fill,'font-size':size,'font-weight':weight,'text-anchor':anchor,class:cls},p,value);}
  function part(p,id,name){if(!PARTS[id])throw Error('Missing definition: '+id);return S('g',{class:'part',role:'button',tabindex:0,'aria-label':name,'aria-controls':'featureDetail','aria-pressed':'false','data-id':id,'data-name':name},p);}
  function surface(p,x,y,w,h,fill=C.panel,stroke=C.edge,r=10){return rect(p,x,y,w,h,fill,stroke,r,'surface');}
  function cap(p,x,y,label,color=C.muted){return txt(p,x,y,label,11,color,700,'start','mono');}
  function title(p,x,y,value,size=20){return txt(p,x,y,value,size,C.text,800);}
  function defs(){const d=S('defs');const pattern=S('pattern',{id:'grid',width:27,height:27,patternUnits:'userSpaceOnUse'},d);path(pattern,'M 27 0 H 0 V 27','grid-line');const board=S('linearGradient',{id:'board',x1:'0%',y1:'0%',x2:'100%',y2:'100%'},d);S('stop',{offset:'0%','stop-color':'#102538'},board);S('stop',{offset:'100%','stop-color':'#0b1929'},board);const arrow=S('marker',{id:'duplex',viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:8,markerHeight:8,orient:'auto-start-reverse'},d);path(arrow,'M 1 1 L 7 4 L 1 7','arrow-head');}
  function base(titleText,subtitle,metrics=[]){svg.replaceChildren();defs();rect(svg,0,0,1200,690,C.bg);rect(svg,18,18,1164,654,'url(#board)','#355265',15);rect(svg,18,18,1164,654,'url(#grid)','none',15);rect(svg,35,36,4,34,C.green,'none',2);title(svg,53,56,titleText,18);cap(svg,53,75,subtitle,C.muted);let cursor=1160;for(const [main,small,width] of metrics.slice().reverse()){cursor-=width;rect(svg,cursor,34,width-8,44,'#183143','#44677a',7);txt(svg,cursor+12,53,main,15,C.green,800);cap(svg,cursor+12,68,small,C.muted);}}
  function dieLabel(p,x,y,kicker,name,meta,color=C.compute){rect(p,x,y-17,3,34,color,'none',1);cap(p,x+12,y-3,kicker,color);txt(p,x+12,y+21,name,21,C.text,800);cap(p,x+12,y+40,meta,C.muted);}
  function drawSuperchip(){
    base('GH200 / ONE CPU + ONE GPU','TWO PROCESSOR DIES · TWO ATTACHED MEMORY POOLS · ONE COHERENT BRIDGE', [['1 CPU','GRACE',86],['1 GPU','HOPPER',87],['900 GB/s','C2C TOTAL',115]]);
    rect(svg,57,108,1086,539,'#0c1b29','#4b7185',12);
    cap(svg,78,136,'GH200 ASSEMBLY / SYSTEM RELATIONSHIP',C.green);
    cap(svg,958,136,'NOT TO SCALE',C.muted);
    rect(svg,78,154,1044,448,'#102331','#587a8c',7);
    rect(svg,86,162,1028,432,'none','#2b4758',4);
    cap(svg,100,184,'GH200 MODULE BOUNDARY',C.muted);
    txt(svg,1101,184,'COMPONENT POSITIONS SCHEMATIC',11,C.muted,700,'end','mono');

    line(svg,226,388,254,388,'memory-route');
    line(svg,946,388,974,388,'memory-route');
    for(const x of [241,960])S('circle',{cx:x,cy:388,r:3,fill:C.memory,stroke:'#f6dfaa','stroke-width':.7});

    const lp=part(svg,'lpddr','LPDDR5X packages beside the Grace CPU');
    surface(lp,103,253,123,269,'#34362e','#c7ae79',5);
    rect(lp,114,265,33,3,C.memory,'none',1);
    cap(lp,115,289,'CPU MEMORY',C.memory);
    txt(lp,115,315,'LPDDR5X',17,C.text,800);
    for(let i=0;i<3;i++){
      const y=335+i*53;
      rect(lp,119,y+5,91,35,'#645439','#a98c5e',2);
      rect(lp,114,y,91,35,'#745d3b','#d0b47a',2);
      for(let j=0;j<6;j++)rect(lp,120+j*14,y+31,7,5,'#e4c88b','none',1);
    }
    cap(lp,115,503,'PACKAGES / OFF-DIE',C.muted);

    const grace=part(svg,'grace','Grace CPU silicon die / 72 cores');
    surface(grace,254,223,270,322,'#173d51','#70abc2',5);
    rect(grace,263,232,252,304,'none','#426b7f',2);
    rect(grace,272,244,39,3,C.compute,'none',1);
    cap(grace,274,267,'CPU SILICON DIE',C.compute);
    title(grace,274,299,'GRACE',26);
    cap(grace,274,321,'72 ARM NEOVERSE V2 CORES',C.muted);
    for(let r=0;r<2;r++)for(let c=0;c<4;c++){
      const x=274+c*59,y=343+r*43;
      rect(grace,x,y,48,30,'#245b72','#69b8d6',2);
      rect(grace,x+8,y+7,31,3,C.compute,'none',1);
      rect(grace,x+8,y+15,31,7,'#3b8ba8','none',1);
    }
    rect(grace,273,445,232,64,'#243653','#837fd0',3);
    cap(grace,286,468,'SCF MESH + DISTRIBUTED L3',C.fabric);
    for(let i=0;i<8;i++)rect(grace,287+i*25,480,14,13,'#485983','#a798e3',1);
    rect(grace,510,356,14,64,'#544477','#ae99e8',1);
    rect(grace,254,356,13,64,'#62543a','#d5b77c',1);

    const hopper=part(svg,'hopper','Hopper GPU silicon die');
    surface(hopper,676,223,270,322,'#1b3c42','#87c779',5);
    rect(hopper,685,232,252,304,'none','#4f786b',2);
    rect(hopper,694,244,39,3,C.green,'none',1);
    cap(hopper,696,267,'GPU SILICON DIE',C.green);
    title(hopper,696,299,'HOPPER',26);
    cap(hopper,696,321,'GH100 ARCHITECTURE',C.muted);
    for(let r=0;r<2;r++)for(let c=0;c<2;c++){
      const x=695+c*119,y=340+r*54;
      rect(hopper,x,y,109,43,'#28545a','#78b99b',2);
      for(let j=0;j<5;j++)rect(hopper,x+10+j*19,y+10,12,22,'#398272','#7ac7a0',1);
    }
    rect(hopper,695,459,232,50,'#4c4733','#d0b67e',3);
    cap(hopper,709,480,'L2 + HBM CONTROLLERS',C.memory);
    for(let i=0;i<6;i++)rect(hopper,708+i*36,488,24,8,'#8f7850','#e1c890',1);
    rect(hopper,676,356,14,64,'#544477','#ae99e8',1);
    rect(hopper,933,356,13,64,'#62543a','#d5b77c',1);

    const hb=part(svg,'hbm','HBM packages beside the Hopper GPU');
    surface(hb,974,253,123,269,'#3b382d','#c7ae79',5);
    rect(hb,985,265,33,3,C.memory,'none',1);
    cap(hb,986,289,'GPU MEMORY',C.memory);
    title(hb,986,315,'HBM',20);
    for(let i=0;i<3;i++){
      const y=337+i*53;
      rect(hb,993,y-6,90,35,'#584a32','#ad9566',2);
      rect(hb,989,y-2,90,35,'#675235','#c9aa73',2);
      rect(hb,985,y+2,90,35,'#765c37','#debe80',2);
    }
    cap(hb,986,503,'STACKS / OFF-DIE',C.muted);

    const bridge=part(svg,'c2c','NVLink-C2C coherent bridge between Grace and Hopper');
    surface(bridge,533,334,134,111,'#292840','#aa93df',4);
    cap(bridge,545,358,'NVLINK-C2C',C.fabric);
    for(let i=0;i<6;i++){
      const y=375+i*9;
      line(bridge,524,y,676,y,'c2c-route');
      for(const x of [530,670])S('circle',{cx:x,cy:y,r:2,fill:C.fabric},bridge);
    }
    cap(bridge,545,438,'900 GB/s TOTAL',C.fabric);
    txt(svg,600,473,'450 GB/s EACH DIRECTION',11,C.muted,700,'middle','mono');
    txt(svg,600,577,'COHERENT ACCESS DOES NOT MERGE THE TWO PHYSICAL MEMORY POOLS',11,C.muted,700,'middle','mono');
    txt(svg,600,628,'INTERNAL BLOCK GLYPHS ARE EXAMPLES · THEIR DRAWN NUMBER IS NOT A UNIT COUNT',11,C.muted,700,'middle','mono');
  }

  function drawGraceGrid(){
    base('GRACE / ONE CPU SOC','72 CORES CONNECT THROUGH SCF TO CACHE, MEMORY AND I/O', [['72','CPU CORES',93],['SCF','COHERENT MESH',125],['LPDDR5X','CPU MEMORY',112]]);
    rect(svg,57,109,1086,538,'#0c1b29','#4b7185',12);
    cap(svg,78,136,'GH200 CPU-SIDE ASSEMBLY / ONE GRACE SOC',C.green);
    txt(svg,1121,136,'NOT A DIE FLOORPLAN',11,C.muted,700,'end','mono');
    rect(svg,230,171,746,415,'#102d3c','#6aa1ba',6);
    rect(svg,238,179,730,399,'none','#3a667b',3);
    cap(svg,251,201,'GRACE CPU SILICON DIE',C.compute);
    txt(svg,251,222,'72 ARM NEOVERSE V2 CORES',16,C.text,800);
    txt(svg,939,201,'SCHEMATIC CORE / CACHE SYMBOLS',10,C.muted,700,'end','mono');

    const mesh=part(svg,'scf','Scalable Coherency Fabric mesh inside Grace');
    surface(mesh,330,312,540,190,'#172d47','#837fbf',3);
    txt(mesh,600,332,'SCF / COHERENT MESH',11,C.fabric,700,'middle','mono');

    const coreCols=[396,532,668,804];
    for(const x of coreCols){
      line(svg,x,282,x,349,'core-tap');
      line(svg,x,467,x,529,'core-tap');
      line(svg,x,381,x,435,'mesh-route');
    }
    for(const y of [365,451]){
      for(const [a,b] of [[446,482],[582,618],[718,754]])line(svg,a,y,b,y,'mesh-route');
    }
    line(svg,330,408,870,408,'mesh-route');
    line(svg,207,408,245,408,'memory-route');
    line(svg,304,408,330,408,'memory-route');
    line(svg,870,408,895,408,'c2c-route');
    line(svg,953,408,1005,408,'c2c-route');
    path(svg,'M870 408 H882 V515 H895','pcie-route');
    line(svg,953,515,1005,515,'pcie-route');

    const lp=part(svg,'lpddr','Grace-attached LPDDR5X packages outside the CPU die');
    surface(lp,84,287,123,229,'#3e392c','#c5aa77',4);
    rect(lp,96,299,29,3,C.memory,'none',1);
    cap(lp,97,319,'CPU MEMORY',C.memory);
    title(lp,97,343,'LPDDR5X',17);
    for(let i=0;i<3;i++){
      const y=356+i*42;
      rect(lp,97,y,97,30,'#715a39','#d5b47b',2);
      rect(lp,106,y+10,79,5,'#97774c','none',1);
      for(let j=0;j<6;j++)rect(lp,104+j*14,y+24,7,3,'#dcc185','none',1);
    }
    cap(lp,97,500,'OFF-DIE MEMORY',C.muted);

    const mc=part(svg,'memctrl','Grace memory interface to LPDDR5X');
    surface(mc,245,366,59,84,'#4b4534','#c9ae76',3);
    cap(mc,254,389,'MEM',C.memory);
    cap(mc,254,407,'CTRL',C.text);
    for(let i=0;i<4;i++)rect(mc,254+i*11,425,7,16,'#8e764d','#d9ba78',1);

    for(let row=0;row<2;row++)for(let col=0;col<4;col++){
      const n=row*4+col+1,cx=coreCols[col],y=row?529:240;
      const core=part(svg,'core',`Representative Neoverse V2 core region ${n}`);
      surface(core,cx-45,y,90,42,'#20536a','#70b7d1',2);
      rect(core,cx-37,y+7,24,2,C.compute,'none',1);
      txt(core,cx-37,y+22,`SAMPLE ${String(n).padStart(2,'0')}`,10,C.text,750);
      for(let i=0;i<4;i++)rect(core,cx-37+i*21,y+28,12,6,'#3988a3','#6dc7e3',1);
    }

    for(const [row,y] of [[0,349],[1,435]]){
      for(let col=0;col<4;col++){
        const cx=coreCols[col],x=cx-50,isNode=col===0||col===3;
        const id=isNode?'csn':'l3';
        const name=isNode?`Representative Cache Switch Node ${row*2+(col===0?1:2)}`:`Representative L3 cache partition ${row*2+col}`;
        const item=part(svg,id,name);
        surface(item,x,y,100,32,isNode?'#44426e':'#514835',isNode?'#b7a8f0':'#d2b37a',2);
        if(isNode){
          S('circle',{cx:x+17,cy:y+16,r:6,fill:'#8e81ca',stroke:'#c3b5f3','stroke-width':1},item);
          txt(item,x+35,y+20,'CSN',10,C.text,800,'start','mono');
        }else{
          txt(item,cx,y+20,'L3 CACHE',10,C.text,760,'middle','mono');
        }
      }
    }
    for(const x of coreCols)for(const y of [282,349,467,529])S('circle',{cx:x,cy:y,r:2.6,fill:C.compute,'pointer-events':'none'});
    for(const x of [207,245,304,330])S('circle',{cx:x,cy:408,r:2.7,fill:C.memory,'pointer-events':'none'});

    const c2c=part(svg,'c2c','Grace NVLink-C2C interface toward Hopper');
    surface(c2c,895,369,58,78,'#302e52','#a995e1',3);
    cap(c2c,904,391,'C2C',C.fabric);
    cap(c2c,904,409,'LINK',C.text);
    for(let i=0;i<4;i++)rect(c2c,904+i*11,424,7,12,'#8b78c7','#b9a7e8',1);
    const pcie=part(svg,'pcie','Grace PCIe Gen 5 system I/O interface');
    surface(pcie,895,477,58,78,'#244357','#7ca4b7',3);
    cap(pcie,904,499,'PCIe',C.compute);
    cap(pcie,904,517,'GEN 5',C.text);
    for(let i=0;i<4;i++)rect(pcie,904+i*11,534,7,11,'#426a81','#8eb2c4',1);
    const gpu=part(svg,'hopper','Hopper GPU across the on-module C2C link');
    surface(gpu,1005,340,112,130,'#1d3c43','#86c478',4);
    rect(gpu,1016,352,31,3,C.green,'none',1);
    cap(gpu,1017,376,'ON MODULE',C.green);
    title(gpu,1017,404,'HOPPER',17);
    cap(gpu,1017,423,'GPU DIE',C.muted);
    for(let i=0;i<4;i++)rect(gpu,1018+i*22,441,14,15,'#3c8075','#8acc9b',1);
    const platform=part(svg,'pcie','Board-side system I/O through PCIe Gen 5');
    surface(platform,1005,484,112,66,'#213747','#7092a5',3);
    cap(platform,1017,506,'SYSTEM I/O',C.compute);
    cap(platform,1017,530,'PCIe GEN 5',C.muted);
    txt(svg,600,626,'CORE / CSN / L3 SYMBOLS ARE REPRESENTATIVE · 72 CORES DOCUMENTED · ROUTES SCHEMATIC',11,C.muted,700,'middle','mono');
  }

  function drawHopperGrid(){
    base('GH100 / FULL-DIE BLUEPRINT','8 GPCS · REPEATED TPC / SM HIERARCHY · SHARED MEMORY SYSTEM', [['8','GPC',65],['72','TPC',65],['144','SM POSITIONS',113]]);
    rect(svg,57,108,1086,554,'#0c1b29','#4b7185',11);
    cap(svg,78,135,'HOPPER ASSEMBLY / GPU SILICON + ADJACENT HBM',C.green);
    txt(svg,1121,135,'LOGICAL SCHEMATIC',11,C.muted,700,'end','mono');
    rect(svg,196,163,808,402,'#0d2635','#70a1b9',5);
    rect(svg,204,171,792,386,'none','#325366',3);
    cap(svg,216,192,'GH100 GPU SILICON DIE',C.compute);
    txt(svg,984,192,'FULL DESIGN / NOT ENABLED-UNIT MAP',10,C.muted,700,'end','mono');

    const gpcX=[239,423,607,791],gpcY=[216,337],gpcW=170,gpcH=95;
    line(svg,324,324,876,324,'gpu-fabric');
    line(svg,600,324,600,460,'gpu-fabric');
    for(const x of [324,508,692,876]){
      line(svg,x,311,x,324,'gpu-fabric');
      line(svg,x,324,x,337,'gpu-fabric');
      for(const y of [311,337])S('circle',{cx:x,cy:y,r:2.4,fill:C.compute,'pointer-events':'none'});
    }
    S('circle',{cx:600,cy:324,r:3.3,fill:C.compute,'pointer-events':'none'});
    line(svg,183,300,204,300,'c2c-route');
    line(svg,996,300,1017,300,'c2c-route');
    line(svg,223,324,324,324,'gpu-fabric');
    line(svg,876,324,977,324,'gpu-fabric');
    for(const x of [223,977])S('circle',{cx:x,cy:324,r:2.8,fill:C.fabric,'pointer-events':'none'});

    for(let row=0;row<2;row++)for(let col=0;col<4;col++){
      const n=row*4+col+1,x=gpcX[col],y=gpcY[row];
      const g=part(svg,'gpc',`GPC ${String(n).padStart(2,'0')} of 8`);
      surface(g,x,y,gpcW,gpcH,'#173b50','#6d9db2',3);
      rect(g,x+9,y+8,26,2,C.compute,'none',1);
      txt(g,x+10,y+24,`GPC ${String(n).padStart(2,'0')}`,11,C.text,800);
      txt(g,x+160,y+24,'9 TPC',10,C.muted,700,'end','mono');
      for(let r=0;r<3;r++)for(let c=0;c<3;c++){
        const bx=x+13+c*49,by=y+31+r*21;
        rect(g,bx,by,44,17,'#28596e','#618fa3',2);
        rect(g,bx+5,by+5,14,7,'#6ac6e7','none',1);
        rect(g,bx+25,by+5,14,7,'#6ac6e7','none',1);
      }
    }

    const c2c=part(svg,'c2c','GH200 NVLink-C2C interface toward Grace');
    surface(c2c,78,261,105,79,'#292840','#aa93df',3);
    cap(c2c,89,281,'ON MODULE',C.fabric);
    cap(c2c,89,302,'NVLINK-C2C',C.text);
    cap(c2c,89,322,'GRACE CPU',C.muted);
    surface(c2c,204,263,19,74,'#332d52','#aa93df',2);
    for(let i=0;i<4;i++)rect(c2c,210,273+i*14,7,6,'#ad9ae8','none',1);
    const nv=part(svg,'nvlink4','Fourth-generation NVLink toward peer GPUs when connected');
    surface(nv,1017,261,105,79,'#292840','#aa93df',3);
    cap(nv,1028,281,'EXTERNAL',C.fabric);
    cap(nv,1028,302,'NVLINK 4',C.text);
    cap(nv,1028,322,'PEER GPU*',C.muted);
    surface(nv,977,263,19,74,'#332d52','#aa93df',2);
    for(let i=0;i<4;i++)rect(nv,983,273+i*14,7,6,'#ad9ae8','none',1);
    cap(svg,1018,358,'* IF CONNECTED',C.muted);

    const l2=part(svg,'gpuL2','Full GH100 shared L2 cache / 60 MB');
    surface(l2,239,460,722,40,'#3b3b36','#d1b679',3);
    rect(l2,252,470,28,3,C.memory,'none',1);
    txt(l2,291,484,'L2 CACHE',14,C.text,800);
    txt(l2,945,484,'60 MB / FULL GH100',10,C.memory,700,'end','mono');

    const memX=Array.from({length:6},(_,i)=>262+i*116);
    for(const x of memX){
      const cx=x+48;
      line(svg,cx,500,cx,514,'memory-route');
      line(svg,cx,548,cx,596,'memory-route');
      S('circle',{cx,cy:565,r:2.8,fill:C.memory,'pointer-events':'none'});
    }
    memX.forEach((x,i)=>{
      const m=part(svg,'gpuMC',`HBM controller pair ${i+1} of 6 / full GH100`);
      surface(m,x,514,96,34,'#3c403a','#c8ad78',3);
      txt(m,x+48,529,`PAIR ${i+1}`,10,C.memory,800,'middle','mono');
      txt(m,x+48,541,'2 × 512-bit',9,C.text,700,'middle','mono');
    });
    memX.forEach((x,i)=>{
      const h=part(svg,'hbm',`HBM stack position ${i+1} of 6 / full GH100`);
      surface(h,x,596,96,37,'#6a5332','#dabb79',3);
      for(let j=0;j<3;j++)rect(h,x+10,602+j*5,76,3,'#a18455','none',1);
      txt(h,x+48,625,`HBM ${i+1}`,11,C.text,800,'middle','mono');
    });

    rect(svg,252,368,44,17,'none','#669bb1',2);
    path(svg,'M252 376 H190 V565 H158','inset-leader');
    for(const [x,y] of [[252,376],[158,565]])S('circle',{cx:x,cy:y,r:2.5,fill:'#9ed5e8','pointer-events':'none'});
    const zoomGPC=part(svg,'gpc','Enlarged GPC 05 / one TPC example');
    surface(zoomGPC,79,541,159,91,'#173b50','#76a8bd',3);
    cap(zoomGPC,90,557,'GPC 05 / DETAIL',C.compute);
    const zoomTPC=part(svg,'tpc','TPC 01 in GPC 05 / two SMs');
    surface(zoomTPC,89,564,139,64,'#295c70','#a1c7d5',2);
    cap(zoomTPC,98,578,'TPC 01',C.text);
    for(let i=0;i<2;i++){
      const x=99+i*63;
      const sm=part(svg,'sm',`SM ${i+1} in TPC 01 / GPC 05`);
      surface(sm,x,581,56,44,'#55bde2','#79d9f4',2);
      txt(sm,x+28,607,`SM ${i+1}`,10,'#071c29',800,'middle','mono');
    }
    txt(svg,600,648,'FULL GH100 MAXIMUM · H100 SXM5 ENABLES 132 SMS, 50 MB L2 AND 5 HBM STACKS',11,C.muted,700,'middle','mono');
  }

  function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function refsHTML(ids){return ids.map(id=>`<a href="${SRC[id].url}" target="_blank" rel="noopener noreferrer">${escapeHTML(SRC[id].label)} ↗</a>`).join('');}
  function makeTermButton(term,label=term){
    const button=document.createElement('button');
    button.type='button';button.className='term-link';button.dataset.term=term;
    button.setAttribute('aria-controls','termNotices');button.setAttribute('aria-label',`Define ${label}`);
    button.textContent=label;return button;
  }
  function linkTerms(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      if(node.parentElement?.closest('a,button,summary,script,style,svg,.term-notice'))continue;
      TERM_PATTERN.lastIndex=0;if(TERM_PATTERN.test(node.nodeValue))nodes.push(node);
    }
    for(const node of nodes){
      const value=node.nodeValue,fragment=document.createDocumentFragment();let cursor=0,match;
      TERM_PATTERN.lastIndex=0;
      while((match=TERM_PATTERN.exec(value))){
        const start=match.index,end=start+match[0].length;
        if((start&&/[A-Za-z0-9]/.test(value[start-1]))||(end<value.length&&/[A-Za-z0-9]/.test(value[end])))continue;
        const term=TERM_ALIAS_INDEX.get(match[0].toLowerCase())||TERM_INDEX.get(match[0].toLowerCase());
        if(!term)continue;
        fragment.append(document.createTextNode(value.slice(cursor,start)),makeTermButton(term,match[0]));cursor=end;
      }
      if(cursor){fragment.append(document.createTextNode(value.slice(cursor)));node.replaceWith(fragment);}
    }
  }
  function linkViewText(){for(const selector of ['#viewIntro','#viewPoints','#viewLimit','#viewPath'])linkTerms(document.querySelector(selector));}
  function render(){const v=VIEWS.find(x=>x.id===viewId),restoreNavFocus=nav.contains(document.activeElement);nav.innerHTML=VIEWS.map(x=>`<button type="button" data-view="${x.id}" aria-current="${x.id===viewId?'page':'false'}"><small>${x.number} / ${x.kicker}</small><strong>${x.name}</strong></button>`).join('');if(restoreNavFocus)nav.querySelector('[aria-current="page"]').focus({preventScroll:true});
    document.querySelector('#viewKicker').textContent=`${v.number} / ${v.kicker}`;document.querySelector('#viewScope').textContent=v.scope;document.querySelector('#viewTitle').textContent=v.title;document.querySelector('#viewSubtitle').textContent=v.subtitle;document.querySelector('#viewRef').innerHTML=refsHTML(v.refs.slice(0,1));document.querySelector('#notesTitle').textContent=v.name;document.querySelector('#viewIntro').textContent=v.notes;document.querySelector('#viewPoints').innerHTML=v.points.map(x=>`<li>${escapeHTML(x)}</li>`).join('');document.querySelector('#viewLimit').textContent=v.limit;document.querySelector('#viewPath').textContent=v.path;document.querySelector('#glossaryCount').textContent=`${v.terms.length} TERMS`;document.querySelector('#glossaryTerms').replaceChildren(...v.terms.map(term=>makeTermButton(term)));
    linkViewText();v.draw();selected=null;tip.hidden=true;resetDetail();document.querySelector('#stageScroller').scrollLeft=0;history.replaceState(null,'',`${location.pathname}?${new URLSearchParams({...Object.fromEntries(new URLSearchParams(location.search)),view:viewId})}${location.hash}`);
    reportAtlasView();
  }
  function resetDetail(){const panel=document.querySelector('#featureDetail');panel.dataset.active='false';document.querySelector('#detailKicker').textContent='FIELD NOTES / SELECT A PART';document.querySelector('#detailTitle').textContent='Explore the diagram';document.querySelector('#detailWhat').textContent='Hover over a part to see its name. Select it to read an explanation.';document.querySelector('#detailDesign').textContent='The model notes above explain how the selected drawing is scoped.';document.querySelector('#detailSource').replaceChildren();}
  function select(g,focusDetail=false){if(!g)return;if(selected){selected.classList.remove('selected');selected.setAttribute('aria-pressed','false');}selected=g;g.classList.add('selected');g.setAttribute('aria-pressed','true');tip.hidden=true;const data=PARTS[g.dataset.id];if(!data)throw Error('Missing selected definition: '+g.dataset.id);document.querySelector('#featureDetail').dataset.active='true';document.querySelector('#detailKicker').textContent='COMPONENT / SELECTED';document.querySelector('#detailTitle').textContent=g.dataset.name;document.querySelector('#detailWhat').textContent=data.what;document.querySelector('#detailDesign').textContent=data.design;document.querySelector('#detailSource').innerHTML=refsHTML(Array.isArray(data.source)?data.source:[data.source]);linkTerms(document.querySelector('#detailWhat'));linkTerms(document.querySelector('#detailDesign'));if(focusDetail)document.querySelector('#featureDetail').focus();}
  function showTip(g,event){if(!g||selected===g){tip.hidden=true;return;}tip.textContent=g.dataset.name;tip.hidden=false;const area=stage.getBoundingClientRect(),scroller=document.querySelector('#stageScroller');let x,y;if(event&&event.clientX){x=event.clientX-area.left+14;y=event.clientY-area.top+14;}else{const r=g.getBoundingClientRect();x=r.left-area.left+r.width/2;y=r.top-area.top-36;}const minX=scroller.scrollLeft+8,maxX=Math.max(minX,scroller.scrollLeft+scroller.clientWidth-tip.offsetWidth-10);tip.style.left=Math.max(minX,Math.min(x,maxX))+'px';tip.style.top=Math.max(8,Math.min(y,area.height-tip.offsetHeight-10))+'px';}
  nav.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;viewId=b.dataset.view;render();});
  svg.addEventListener('pointerover',e=>{const g=e.target.closest('g.part');if(g)showTip(g,e);});
  svg.addEventListener('pointermove',e=>{const g=e.target.closest('g.part');if(g&&!tip.hidden)showTip(g,e);});
  svg.addEventListener('pointerout',e=>{if(!e.relatedTarget||!e.relatedTarget.closest||!e.relatedTarget.closest('g.part'))tip.hidden=true;});
  svg.addEventListener('focusin',e=>{const g=e.target.closest('g.part');if(g)showTip(g);});
  svg.addEventListener('focusout',()=>{tip.hidden=true;});
  svg.addEventListener('click',e=>select(e.target.closest('g.part')));
  svg.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('g.part')){e.preventDefault();select(e.target,true);}});
  const noticeStack=document.querySelector('#termNotices'),earlierNotice=document.querySelector('#termEarlier');
  const embeddedNotices=atlasEmbedded;
  function positionEmbeddedNotices(){
    if(!embeddedNotices||!noticeStack.querySelector('.term-notice'))return;
    try{
      const frame=window.frameElement,rect=frame?.getBoundingClientRect();if(!rect)return;
      const visibleTop=Math.max(0,-rect.top),visibleBottom=Math.min(rect.height,window.parent.innerHeight-rect.top);
      if(visibleBottom<=visibleTop)return;
      const inset=window.parent.innerWidth<=480?10:16,top=visibleTop+inset;
      noticeStack.style.top=`${top}px`;
      noticeStack.style.maxHeight=`${Math.max(0,visibleBottom-top-inset)}px`;
    }catch{}
  }
  function refreshNotices(){
    const cards=[...noticeStack.querySelectorAll('.term-notice')];
    const focused=cards.find(card=>card.contains(document.activeElement));
    const visibleLimit=window.matchMedia('(max-width:390px), (max-height:600px)').matches?2:3;
    cards.forEach((card,index)=>{
      card.hidden=index>=visibleLimit;
      card.classList.toggle('is-compact',index!==0);
      card.querySelector('.notice-copy').hidden=index!==0;
      card.querySelector('.notice-reopen').hidden=index===0;
    });
    const hiddenCount=Math.max(0,cards.length-visibleLimit);
    earlierNotice.hidden=hiddenCount===0;
    earlierNotice.textContent=`+${hiddenCount} earlier term${hiddenCount===1?'':'s'} · show one`;
    if(focused?.hidden)cards[0]?.querySelector('.notice-close')?.focus();
    positionEmbeddedNotices();
  }
  function notice(term,trigger){
    if(!TERMS[term])return;
    const card=document.createElement('aside');card.className='term-notice';card.dataset.seq=++timerSeq;
    card.setAttribute('role','status');card.setAttribute('aria-label',`Definition of ${term}`);
    card.innerHTML=`<div class="notice-copy"><small>TERM DEFINITION</small><h3>${escapeHTML(term)}</h3><p>${escapeHTML(TERMS[term])}</p></div><button class="notice-reopen" type="button" aria-label="Show definition of ${escapeHTML(term)}" hidden>${escapeHTML(term)}</button><div class="notice-controls"><button class="notice-close" type="button" aria-label="Close ${escapeHTML(term)} definition; otherwise closes after 15 seconds"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" class="notice-track"/><circle cx="20" cy="20" r="16" class="notice-progress"/></svg><span aria-hidden="true">×</span></button><span class="notice-countdown" aria-hidden="true">15s</span></div>`;
    const closeButton=card.querySelector('.notice-close'),countdown=card.querySelector('.notice-countdown'),progress=card.querySelector('.notice-progress');
    const started=performance.now(),duration=15000,circumference=2*Math.PI*16;
    let timer;
    function close(){
      const hadFocus=card.contains(document.activeElement);
      clearInterval(timer);card.remove();refreshNotices();
      if(hadFocus){if(trigger?.isConnected)trigger.focus();else noticeStack.querySelector('.term-notice:not([hidden]) .notice-close')?.focus();}
    }
    function update(){
      const remaining=Math.max(0,duration-(performance.now()-started));
      countdown.textContent=`${Math.ceil(remaining/1000)}s`;
      progress.style.strokeDashoffset=String(circumference*(1-remaining/duration));
      if(remaining===0)close();
    }
    closeButton.addEventListener('click',close);
    card.querySelector('.notice-reopen').addEventListener('click',()=>{noticeStack.prepend(card);refreshNotices();closeButton.focus();});
    noticeStack.prepend(card);noticeStack.scrollTop=0;refreshNotices();update();timer=setInterval(update,100);
  }
  document.addEventListener('click',e=>{const b=e.target.closest?.('.term-link[data-term]');if(b){e.stopPropagation();notice(b.dataset.term,b);}});
  earlierNotice.addEventListener('click',()=>{const card=[...noticeStack.querySelectorAll('.term-notice[hidden]')].at(-1);if(card){noticeStack.prepend(card);noticeStack.scrollTop=0;refreshNotices();card.querySelector('.notice-close').focus();}});
  window.addEventListener('resize',refreshNotices);
  if(embeddedNotices)try{window.parent.addEventListener('scroll',positionEmbeddedNotices,{passive:true});window.parent.addEventListener('resize',positionEmbeddedNotices);window.addEventListener('pagehide',()=>{window.parent.removeEventListener('scroll',positionEmbeddedNotices);window.parent.removeEventListener('resize',positionEmbeddedNotices);});}catch{}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const card=document.activeElement?.closest?.('.term-notice')||noticeStack.querySelector('.term-notice:not([hidden])');if(card){e.preventDefault();card.querySelector('.notice-close').click();}}});
  for(const selector of ['.hero p','.scope-lead p','.scope-caveat','.glossary-content p','.sources>p','.source-list article p'])for(const element of document.querySelectorAll(selector))linkTerms(element);
  render();
  if(atlasEmbedded){
    const height=atlasHeight();
    atlasParentReady=true;lastAtlasHeight=height;lastAtlasView=viewId;
    tellAtlasParent('gh200-atlas:ready',{view:viewId,height});
    if('ResizeObserver'in window)new ResizeObserver(reportAtlasHeight).observe(atlasShell);
    window.addEventListener('load',reportAtlasHeight);
    document.fonts?.ready.then(reportAtlasHeight);
  }
})();
