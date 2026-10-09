// Independent release gates: existing artwork preservation and honest new coverage.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(path.join(__dirname,p),'utf8').replace(/^\uFEFF/,''));
const before=read('preservation-baseline.json');
const artReview=read('approved-art-revision.json');
const crypto=require('node:crypto');
const after=read('../outputs/platform-catalog.json');
const models=new Map(after.models.map(m=>[m.id,m]));
const results=[];
function test(name,fn){try{fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});}}
test('Original models keep their art unless a source-inspected revision is recorded',()=>{
 for(const old of before.models){const current=models.get(old.id);assert(current,'Lost '+old.id);assert.equal(current.shape,old.shape,old.id+' changed silhouette');assert.equal(crypto.createHash('sha256').update(current.art).digest('hex'),artReview.changes[old.id]?.artSha256||old.artSha256,old.id+' changed artwork');}
});
test('Installed-base additions have complete evidence without replacing existing models',()=>{
 const added=['ucs:c225m6','hpe:dl325g11','hpe:dl345g11','hpe:dl385g10pv2','hpe:xd675','dell:r7515','dell:r7525','supermicro:amdlegacy','supermicro:mi300x','supermicro:h15hyper'];
 assert.equal(after.models.length,before.models.length+added.length);
 for(const id of added){const m=models.get(id);assert(m,id);assert(m.cpuFamilies.length,id+' CPU families');assert(m.computeMemory?.sources?.length,id+' memory evidence');assert(m.decoder.length,id+' naming evidence');assert(m.sourceIds.length,id+' claim evidence');assert(m.generation.modelYear?m.generation.modelDateKind:m.generation.note,id+' date scope');assert(m.illustration.reviewStatus==='verified',id+' needs a source-inspected exterior');assert(artReview.changes[id],id+' requires a recorded art revision');assert(m.illustration.reviewMethod&&m.illustration.locator,id+' visual evidence missing');assert(m.lifecycle.note,id+' lifecycle scope');}
 assert(models.get('lenovo:sr665').name.includes('V3'),'Original SR665 replaced V3');
});
test('Unknown announced memory remains explicitly unconfirmed',()=>{
 for(const id of ['hpe:xd245','hpe:xd285']){const p=models.get(id).computeMemory;assert.equal(p.dimmSlots,null,id);assert.equal(p.dpc.length,0,id);}
});
test('Every represented source resolves and dates retain their meanings',()=>{
 for(const m of after.models){for(const id of m.sourceIds)assert(after.sources[id],m.id+' missing '+id);for(const e of m.events)for(const id of e.sourceIds||[])assert(after.sources[id],m.id+' event source');for(const o of m.gpuOptions)for(const id of o.sourceIds)assert(after.sources[id],m.id+' GPU source');}
 for(const [id,s] of Object.entries(after.sources)){assert(s.title&&s.url);const old=before.sources[id];if(old?.loc&&!id.includes(':memory_'))assert(s.loc,'Lost exact source locator: '+s.title);if(old?.loc&&s.loc!==old.loc&&!id.includes(':memory_'))assert(['dell:generation_ageDell17Intel','dell:generation_ageDell17CSP','dell:generation_ageDellXE9785','supermicro:genSm4004','supermicro:generation_genSm4004'].includes(id),'Unreviewed source locator change: '+id);if(s.reviewedAt)assert(/^\d{4}-\d{2}-\d{2}$/.test(s.reviewedAt),s.title+' invalid reviewedAt');}
});
test('Newer memory facts replace stale omission prose',()=>{
 const p=models.get('supermicro:petascale');assert.equal(p.computeMemory.channelsPerCpu,8);assert(!/channel.*intentionally omitted|intentionally omitted.*channel/i.test(p.note),p.note);
});
test('All generated OEM guides have valid scripts and evidence surfaces',()=>{
 const vm=require('vm');
 for(const oem of Object.keys(after.vendors)){
  const html=fs.readFileSync(path.join(__dirname,'../outputs',oem+'-field-guide.html'),'utf8');
  for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1],{filename:oem+' guide'});
  assert(html.includes('memoryInstalledProcessors'),oem+' missing installed-CPU detail');
  assert(html.includes('index.html'),oem+' missing finder route');
 }
});
const report={models:after.models.length,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,results};
fs.writeFileSync(path.join(__dirname,'../outputs/release-quality-results.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));process.exitCode=report.failed?1:0;
