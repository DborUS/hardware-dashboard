// Coverage and structural checks complement the manual OEM-photo comparison.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../outputs/platform-catalog.json'),'utf8'));
const hosts={ucs:/\.cisco\.com$/,hpe:/\.hpe\.com$/,dell:/\.dell\.com$/,lenovo:/\.lenovo\.com$/,supermicro:/\.supermicro\.com$/};
const coverage={};
assert.equal(catalog.models.length,102);
for(const m of catalog.models){
 const p=m.illustration;assert(p,m.id+' missing physical evidence');assert.equal(p.id,m.localId);assert.equal(p.shape,m.shape);
 for(const key of ['view','sourceUrl','sourceTitle','locator','caveat'])assert(p[key]?.trim(),m.id+' missing '+key);
 assert(p.features.length,m.id+' needs identified visual features');assert(['verified','schematic'].includes(p.reviewStatus));
 assert(hosts[m.oem].test('.'+new URL(p.sourceUrl).hostname),m.id+' requires an OEM source');
 assert(m.art.includes('<title>')||m.art.includes('aria-label='),m.id+' missing accessible description');
 assert(!/undefined|NaN/.test(m.art),m.id+' invalid SVG values');
 for(const r of m.art.matchAll(/<(?:rect|pattern|svg)\b[^>]*>/g))for(const d of r[0].matchAll(/(?:width|height)="(-?[\d.]+)"/g))assert(Number(d[1])>=0,m.id+' negative SVG dimension');
 const ids=[...m.art.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,m.id+' duplicate local SVG ids');
 for(const ref of m.art.matchAll(/url\(#([^)]+)\)/g))assert(ids.includes(ref[1]),m.id+' unresolved SVG paint');
 const guide=fs.readFileSync(path.join(__dirname,`../outputs/${m.oem}-field-guide.html`),'utf8');assert(guide.includes(p.sourceUrl),m.id+' reference missing from guide');
 coverage[m.oem]??={total:0,verified:0,schematic:0};coverage[m.oem].total++;coverage[m.oem][p.reviewStatus]++;
}
console.log(JSON.stringify({models:catalog.models.length,result:'PASS',coverage},null,2));
