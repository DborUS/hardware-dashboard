// Behavioral fixtures derived from the broad audit and separately checked OEM evidence.
// Executed inside check-finder's context, against the actual application functions.
test('Recognized accelerator text and selector expose identical evidence gaps',()=>{
 for(const name of ['MI355X','MI210','MI300X'])assert.deepEqual(filter({q:name,gaps:'1'}).sort(),filter({gpu:'Instinct '+name,gaps:'1'}).sort(),name);
 assert.deepEqual(filter({q:'Cisco MI210',gaps:'1'}).sort(),filter({q:'Cisco',gpu:'Instinct MI210',gaps:'1'}).sort());
 assert.equal(run("selectedGPU(new URLSearchParams({q:'MI210',gpu:'Instinct MI355X'}))"),'Instinct MI355X');
});
test('Cisco MI210 paths retain chassis and paired-CPU restrictions',()=>{
 for(const id of ['ucs:c245','ucs:x215']){const o=catalog.models.find(m=>m.id===id).gpuOptions.find(g=>g.product==='Instinct MI210');assert(o,id);assert(o.sourceIds.length);assert(/riser|X440p/i.test(o.conditions),id);}
 assert.notEqual(relation('ucs:x215',{cpu:'EPYC 9005',gpu:'Instinct MI210'}).status,'qualified');
});
test('Verified cooling additions are discoverable without inventing GPU joint qualification',()=>{
 const ids=filter({cooling:'Liquid'});
 for(const id of ['hpe:dl320','hpe:dl325','hpe:dl340','hpe:dl345','hpe:dl360','hpe:dl365','hpe:dl380','hpe:dl385','hpe:dl580','hpe:dl380a','hpe:xd685','hpe:dl525','lenovo:sr645','lenovo:sr665','lenovo:sr630','lenovo:sr650','supermicro:intelhyper','supermicro:blade','supermicro:amdblade'])assert(ids.includes(id),id);
 assert.notEqual(relation('supermicro:intelhyper',{gpu:'NVIDIA H100 NVL',cooling:'Liquid'}).status,'qualified');
});
test('One-CPU support is recorded only where the model documentation establishes it',()=>{
 const ids=filter({processors:'1'});
 for(const id of ['hpe:dl365','hpe:dl385','hpe:dl380','hpe:sy480','lenovo:se455','lenovo:sr675','lenovo:sr630','lenovo:sr650','lenovo:sr650a','lenovo:st650','dell:t560','dell:mx760'])assert(ids.includes(id),id);
});
test('Cooling, processors, DIMMs and DPC match one documented layout together',()=>{
 for(const id of ['lenovo:sr630','lenovo:sr650']){
  assert(filter({processors:'2',dimms:'16',dpc:'1',cooling:'Liquid'}).includes(id));
  for(const q of [{processors:'1',dimms:'16'},{dimms:'16',dpc:'2'},{dimms:'16',cooling:'Air'}])assert(!filter(q).includes(id),id+' '+JSON.stringify(q));
  assert(filter({processors:'1',dimms:'32',dpc:'2',cooling:'Air'}).includes(id));
 }
 for(const id of ['lenovo:sr645','lenovo:sr665','hpe:dl365','hpe:dl385','hpe:dl380']){
  assert(!filter({processors:'1',cooling:'Liquid'}).includes(id),id+' impossible one CPU liquid');
  assert(filter({processors:'2',cooling:'Liquid'}).includes(id),id+' two CPU liquid missing');
  assert(filter({processors:'1',cooling:'Air'}).includes(id),id+' one CPU air missing');
 }
});
test('General GPU prohibitions apply to NVIDIA as well as AMD',()=>{
 for(const id of ['lenovo:st45','lenovo:sd665'])for(const product of ['NVIDIA L4','Instinct MI210'])assert.equal(relation(id,{gpu:product}).status,'unsupported',id+' '+product);
 for(const id of ['lenovo:sr630','lenovo:sr650']){
  assert.equal(relation(id,{gpu:'NVIDIA L4',dimms:'16'}).status,'unsupported');
  assert.notEqual(relation(id,{gpu:'NVIDIA L4'}).status,'unsupported');
 }
});
test('Model dates show evidence type rather than claiming a launch from any dated document',()=>{
 const m=catalog.models.find(m=>m.id==='supermicro:amdentry');
 assert.equal(m.generation.modelYear,2024);assert(/documented by/i.test(m.generation.modelDateKind));
 assert(context.card(m).includes('Documented by 2024'));
 assert(m.events.some(e=>e.year===2025&&e.type==='refresh'));
});
test('Installed-base AMD coverage spans every OEM without masking unknown dates',()=>{
 for(const oem of Object.keys(catalog.vendors))assert(filter({oem,cpu:'EPYC 7003'}).length,oem+' legacy gap');
 for(const id of ['ucs:c225m6','hpe:dl325g11','hpe:dl345g11','hpe:dl385g10pv2','hpe:xd675','dell:r7515','dell:r7525','supermicro:amdlegacy','supermicro:mi300x','supermicro:h15hyper']){
  const m=catalog.models.find(m=>m.id===id);assert(m,id);assert(m.computeMemory.sources.length,id);assert(m.illustration.reviewStatus==='verified',id);assert(m.illustration.reviewMethod&&m.illustration.locator&&m.illustration.reviewedAt,id+' missing physical review');
  assert(m.sourceIds.every(id=>catalog.sources[id]));
  if(!m.generation.modelYear)assert(context.card(m).includes('Model date unconfirmed'));
 }
});
test('Conflicting HPE XD675 topology remains unknown and retired GPUs remain historical',()=>{
 const m=catalog.models.find(m=>m.id==='hpe:xd675');assert.equal(m.computeMemory.maxProcessors,2);assert.equal(m.computeMemory.dimmSlots,24);assert.equal(m.computeMemory.channelsPerCpu,null);assert.deepEqual(m.computeMemory.dpc,[]);
 assert.equal(relation(m.id,{gpu:'Instinct MI300X'}).status,'historical');
 assert(!filter({oem:'hpe',q:'XD675',dpc:'1'}).length);assert(!filter({oem:'hpe',q:'XD675',dpc:'2'}).length);
});
test('Announced Gen13 options remain announced and do not imply AMD GPU support',()=>{
 const m=catalog.models.find(m=>m.id==='hpe:dl585a');assert(m.gpuV.includes('NVIDIA'));assert(m.gpuOptions.filter(g=>g.product.startsWith('NVIDIA')).length>=2);assert(m.gpuOptions.every(g=>g.status==='announced'));assert.equal(relation(m.id,{gpu:'Instinct MI355X'}).status,'not-established');
 for(const id of ['hpe:xd245','hpe:xd285']){const p=catalog.models.find(m=>m.id===id).computeMemory;assert(p.memoryTypes.some(t=>t.includes('MRDIMM')));assert.equal(p.dimmSlots,null);assert.deepEqual(p.dpc,[]);}
});
