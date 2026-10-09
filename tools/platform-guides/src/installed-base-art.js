// Honest form-factor schematic for profiles whose model-specific exterior has not been illustrated.
// Existing per-model artwork is untouched; each new card links to the OEM's actual views.
function installedBaseArt(shape){
 for(const renderer of [reviewedHpeArt,reviewedCiscoDellArt,reviewedSupermicroArt,reviewedLenovoArt]){const art=renderer(shape);if(art)return art;}
 const definitions={
  'installed-r7625':['PowerEdge R7625','#5ca5c9','DELL'],
  'installed-r7615':['PowerEdge R7615','#5ca5c9','DELL'],
  'installed-c245m6':['Cisco UCS C245 M6','#63bfdd','CISCO'],
  'installed-sr665original':['ThinkSystem SR665 (original)','#d95a64','LENOVO']
 };
 const spec=definitions[shape];if(!spec)return coverageSchematic(shape);
 const [name,accent,brand]=spec;
 return `<svg class="hardware-art installed-base-art" viewBox="0 0 400 180" role="img" aria-label="${name}: 2U rack form-factor schematic, not a model-specific exterior"><title>${name}: generic 2U rack schematic; refer to the OEM illustration</title><path d="M39 83 L98 46 H347 L300 83 Z" fill="#727d85" stroke="#a7b3b9" stroke-width="1.2"/><path d="M300 83 L347 46 V103 L300 139 Z" fill="#3d474f" stroke="#7e8d94" stroke-width="1.2"/><rect x="39" y="83" width="261" height="56" rx="2" fill="#272f37" stroke="#93a1ab" stroke-width="1.2"/><rect x="27" y="86" width="12" height="50" rx="2" fill="#9aa7ad"/><rect x="300" y="86" width="12" height="50" rx="2" fill="#9aa7ad"/><path d="M31 94h4m-4 35h4m269-35h4m-4 35h4" stroke="#38424b" stroke-width="3"/><rect x="49" y="93" width="5" height="35" fill="${accent}"/><text x="67" y="108" fill="#d5dfe4" font-family="system-ui,sans-serif" font-size="11" font-weight="600">${brand} · 2U RACK</text><text x="67" y="124" fill="#9daeb9" font-family="system-ui,sans-serif" font-size="9">FORM-FACTOR SCHEMATIC</text><text x="195" y="160" text-anchor="middle" fill="#8e9fab" font-family="system-ui,sans-serif" font-size="9">Drive layout and controls intentionally not depicted</text></svg>`;
}
// BEGIN AUDITED COVERAGE SCHEMATICS
const coverageIllustrationSpecs={"installed-ucs-c225m6":{"name":"C225 M6","oem":"ucs","units":1},"installed-hpe-dl325g11":{"name":"DL325 Gen11","oem":"hpe","units":1},"installed-hpe-dl345g11":{"name":"DL345 Gen11","oem":"hpe","units":2},"installed-hpe-dl385g10pv2":{"name":"DL385 Gen10 Plus v2","oem":"hpe","units":2},"installed-hpe-xd675":{"name":"Cray XD675","oem":"hpe","units":8},"installed-dell-r7515":{"name":"PowerEdge R7515","oem":"dell","units":2},"installed-dell-r7525":{"name":"PowerEdge R7525","oem":"dell","units":2},"installed-supermicro-amdlegacy":{"name":"AS-2024US-TRT","oem":"supermicro","units":2},"installed-supermicro-mi300x":{"name":"AS-8125GS-TNMR2","oem":"supermicro","units":8},"installed-supermicro-h15hyper":{"name":"AS-2127H7-N","oem":"supermicro","units":2}};
function coverageSchematic(shape){
 const s=coverageIllustrationSpecs[shape];if(!s)return '';
 const colors={ucs:'#63bfdd',hpe:'#54ccaf',dell:'#5ca5c9',supermicro:'#74bb95'},accent=colors[s.oem];
 const height=Math.min(96,30+s.units*7),top=131-height;
 return `<svg class="hardware-art installed-base-art" viewBox="0 0 400 180" role="img" aria-label="${s.name}: generic ${s.units}U form-factor schematic"><title>${s.name}: generic ${s.units}U rack schematic; not a model-specific exterior</title><path d="M52 ${top} L107 ${top-26} H342 L294 ${top} Z" fill="#727d85" stroke="#a7b3b9"/><path d="M294 ${top} L342 ${top-26} V105 L294 131 Z" fill="#3d474f" stroke="#7e8d94"/><rect x="52" y="${top}" width="242" height="${height}" rx="2" fill="#272f37" stroke="#93a1ab"/><rect x="61" y="${top+8}" width="4" height="${height-16}" fill="${accent}"/><text x="79" y="${top+height/2-1}" fill="#d5dfe4" font-family="system-ui,sans-serif" font-size="12" font-weight="600">${s.oem==='ucs'?'CISCO':s.oem.toUpperCase()} · ${s.units}U RACK</text><text x="79" y="${top+height/2+14}" fill="#9daeb9" font-family="system-ui,sans-serif" font-size="9">FORM-FACTOR SCHEMATIC</text><text x="200" y="158" text-anchor="middle" fill="#9daeb9" font-family="system-ui,sans-serif" font-size="9">Refer to the linked OEM photos for the actual exterior</text></svg>`;
}
