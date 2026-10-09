const fs=require('fs'),vm=require('vm'),path=require('path');
const summaries=[],failures=[];
for(const vendor of ['ucs','hpe','dell','lenovo','supermicro']){
 const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,vendor==='ucs'?'data.js':vendor+'-data.js'),'utf8')+';this.models=models;',ctx);
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,vendor+'-generation-data.json'),'utf8').replace(/^\uFEFF/,''));
 const gs=new Map(data.generations.map(g=>[g.id,g]));
 const refs=(ids,where)=>{if(!ids?.length)failures.push(vendor+': missing evidence '+where);for(const id of ids||[])if(!data.sources[id])failures.push(vendor+': missing source '+id+' in '+where);};
 for(const g of data.generations){if(!Number.isInteger(g.year)||g.year<1990||g.year>2026||!g.label||!g.summary)failures.push(vendor+': invalid milestone '+g.id);refs(g.sourceIds,g.id);}
 for(const m of ctx.models){const d=data.models[m.id],g=d&&gs.get(d.generationId);if(!g){failures.push(vendor+': missing model '+m.id);continue;}if(d.modelYear&&(!Number.isInteger(d.modelYear)||d.modelYear<g.year||d.modelYear>2026||!d.modelDateKind))failures.push(vendor+': invalid model date '+m.id);if(d.modelYear)refs(d.sourceIds,m.id);if(!d.note)failures.push(vendor+': missing timing scope '+m.id);}
 for(const [id,s] of Object.entries(data.sources))if(!/^https:\/\//.test(s.url)||!s.title||!s.loc||!s.date||!s.scope)failures.push(vendor+': invalid source '+id);
 const html=fs.readFileSync(path.join(__dirname,'../outputs',vendor+'-field-guide.html'),'utf8');for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:vendor+' inline script'});
 for(const feature of ['generationData','modelGenerationBadge(m)','generationCompareRows(list)','id="generationFilter"','When did these generations begin?'])if(!html.includes(feature))failures.push(vendor+': missing UI feature '+feature);
 summaries.push({vendor,models:ctx.models.length,generations:data.generations.length,dateSources:Object.keys(data.sources).length,modelDates:Object.values(data.models).filter(d=>d.modelYear).length});
}
console.log(JSON.stringify({summaries,failures},null,2));process.exitCode=failures.length?1:0;
