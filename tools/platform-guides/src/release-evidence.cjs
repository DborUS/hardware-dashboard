// Keep document dates separate from our review date. Bare dates remain original text.
const crypto=require('node:crypto');
const months={jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
function explicitDate(value){
 if(!value)return null;
 const s=String(value).trim();
 if(/^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(s))return s;
 let m=s.match(/^(\d{1,2})[ -]([A-Za-z]+)[ ,.-]+(\d{4})$/);
 if(m&&months[m[2].slice(0,3).toLowerCase()])return `${m[3]}-${months[m[2].slice(0,3).toLowerCase()]}-${m[1].padStart(2,'0')}`;
 m=s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
 if(m&&months[m[1].slice(0,3).toLowerCase()])return `${m[3]}-${months[m[1].slice(0,3).toLowerCase()]}-${m[2].padStart(2,'0')}`;
 m=s.match(/^([A-Za-z]+)\s+(\d{4})$/);
 if(m&&months[m[1].slice(0,3).toLowerCase()])return `${m[2]}-${months[m[1].slice(0,3).toLowerCase()]}`;
 return null;
}
function labeledDate(text,label){const m=String(text||'').match(new RegExp('(?:^|[;·])\\s*'+label+'\\s*[:·]?\\s*([^;·]+)','i'));return m?explicitDate(m[1]):null;}
function normalizeSource(source,defaults={}){
 const originalDate=source.date??null;
 return {...source,
  loc:source.loc??defaults.loc??null,
  scope:source.scope??defaults.scope??null,
  date:originalDate,
  reviewedAt:explicitDate(source.reviewedAt||source.reviewed||source.verified)||labeledDate(originalDate,'reviewed')||explicitDate(defaults.reviewedAt),
  publishedAt:explicitDate(source.publishedAt||source.publicationDate)||labeledDate(originalDate,'published'),
  revision:source.revision??source.version??null,
  revisedAt:explicitDate(source.revisedAt||source.updatedAt)||labeledDate(originalDate,'updated')
 };
}
function memorySource(source,memory){
 // Existing titles often include the exact table/section; preserve that locator verbatim.
 const titleLocator=String(source.title||'').split(/\s+[—–]\s+/).slice(1).join(' — ')||null;
 return normalizeSource(source,{loc:titleLocator,scope:memory.note,reviewedAt:memory.verified});
}
function coverage(models,vendors,aliases){
 const cpuFamilies=[...new Set([...Object.keys(aliases),...models.flatMap(m=>m.cpuFamilies.filter(f=>f.startsWith('EPYC ')))])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const oems=Object.fromEntries(Object.keys(vendors).map(vendor=>[vendor,Object.fromEntries(cpuFamilies.map(family=>{const modelIds=models.filter(m=>m.oem===vendor&&m.cpuFamilies.includes(family)).map(m=>m.id);return [family,{status:modelIds.length?'partial':'not-researched',count:modelIds.length,modelIds}];}))]));
 return {scope:'Curated research coverage. A populated cell contains selected profiles, not the complete OEM offering. An empty cell means no profile researched here; it is not an incompatibility claim.',cpuFamilies,oems};
}
function manifest(catalog,release){
 const sources=Object.values(catalog.sources);
 return {version:release.version,builtAt:'2026-10-09T18:20:55.503Z',reviewedAt:release.snapshotDate,scope:release.scope,modelCount:catalog.models.length,claimRecordCount:sources.length,uniqueSourceCount:new Set(sources.map(s=>s.url).filter(Boolean)).size,oemCounts:Object.fromEntries(Object.keys(catalog.vendors).map(v=>[v,catalog.models.filter(m=>m.oem===v).length])),contentHash:crypto.createHash('sha256').update(JSON.stringify(catalog)).digest('hex')};
}
module.exports={explicitDate,normalizeSource,memorySource,coverage,manifest};
