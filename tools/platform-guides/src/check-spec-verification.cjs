// Completeness / integration gate for human-readable agent source reviews.
// This checks review coverage and preserved caveats, not truth by JSON alone.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const read=f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8').replace(/^\uFEFF/,''));
const ch=read('verification-review-supermicro.json'),dl=read('verification-review-cisco-hpe.json'),sm=read('verification-review-dell-lenovo.json'),catalog=read('../outputs/platform-catalog.json');
const good=x=>/^pass/i.test(x.status||x.result||''),results=[];
function test(name,fn){try{fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',message:e.message});}}
test('Each of 22 Cisco/HPE correction groups has an independent source review',()=>{const claims=read('verified-fixes-cisco-hpe.json').claims;assert.equal(claims.length,22);for(const c of claims){const r=ch.claims.find(r=>r.id===c.id);assert(r&&good(r),c.id);assert(r.urls.length,c.id);}});
test('Every Dell/Lenovo logged correction is independently covered',()=>{const changes=read('verified-fixes-dell-lenovo.json').changes;const indices=new Set(dl.results.filter(good).flatMap(r=>r.changeIndices||[]));assert.equal(dl.blockingUnverifiedClaims.length,0);for(let i=0;i<changes.length;i++)assert(indices.has(i),'Unreviewed change '+i);});
test('Each of nine Supermicro correction groups has an independent source review',()=>{for(const c of read('verified-fixes-supermicro.json').claims){const r=sm.fixClaims.find(r=>r.id===c.id);assert(r&&good(r),c.id);assert(r.sourceUrl&&r.locator,c.id);}});
test('All ten added platform profiles have independent coverage review',()=>{
 for(const id of ['ucs-c225m6','hpe-dl325g11','hpe-dl345g11','hpe-dl385g10pv2','hpe-xd675'])assert(ch.coverageReview.models.some(r=>r.model===id&&good(r)),id);
 for(const id of ['dell:r7515','dell:r7525'])assert(dl.coverageReview.some(r=>r.model===id&&good(r)),id);
 for(const id of ['amdlegacy','mi300x','h15hyper'])assert(sm.coverageClaims.some(r=>r.id===id+'-core'&&good(r)),id);
 assert(sm.coverageClaims.every(good));
});
test('Peer-review corrections survive into the catalog',()=>{
 const model=id=>catalog.models.find(m=>m.id===id);
 for(const id of ['lenovo:sr630','lenovo:sr650']){const p=model(id).computeMemory.memoryConfigurations.find(p=>p.id==='neptune-compute');assert.equal(p.gpuSupport,'unsupported');assert(!/MRDIMM and this memory-cooled layout require/.test(p.note));}
 assert(/conflict|inconsistent|contradict/i.test(JSON.stringify(model('lenovo:st650').computeMemory)));
 assert(/conflict/i.test(JSON.stringify(model('ucs:c225m6').restrictions)));
 const x=model('hpe:xd675');assert.equal(x.computeMemory.channelsPerCpu,null);assert.deepEqual(x.computeMemory.dpc,[]);assert(x.computeMemory.sources.some(s=>s.url.includes('ZAEN')));
 assert(!/do not mix types/.test(model('supermicro:h15hyper').computeMemory.note));
 for(const id of ['hpe:dl365','hpe:dl385','hpe:dl380'])assert.deepEqual(model(id).computeMemory.memoryConfigurations.find(p=>p.supportedCooling.includes('Liquid')).installedCPUCounts,[2]);
});
const report={passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,results,scope:'Review completeness and integrated caveats; source-review methods and limitations remain in the peer logs.'};console.log(JSON.stringify(report,null,2));process.exitCode=report.failed?1:0;
