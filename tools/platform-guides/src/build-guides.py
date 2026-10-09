from pathlib import Path
import re
import json
import hashlib
root=Path(__file__).resolve().parent
release=json.loads((root/'release-metadata.json').read_text(encoding='utf-8'))
cpu_aliases=json.loads((root/'cpu-aliases.json').read_text(encoding='utf-8'))
css=(root/'styles.css').read_text(encoding='utf-8')+'\n'+(root/'vendor-switch.css').read_text(encoding='utf-8')
css=re.sub(r"^@import url\([^;]+;\s*",'',css,count=1)
switch=(root/'vendor-switch.js').read_text(encoding='utf-8')
original=(root/'app.js').read_text(encoding='utf-8')
template=(root/'template.html').read_text(encoding='utf-8')
generation_ui=(root/'generation-ui.js').read_text(encoding='utf-8').replace("const generationAsOfLabel='8 Oct 2026';", "const generationAsOfLabel=generationData.reviewed;")
generation_css=(root/'generation-styles.css').read_text(encoding='utf-8')
fae_ui=(root/'fae-guide-ui.js').read_text(encoding='utf-8-sig')
fae_css=(root/'fae-guide.css').read_text(encoding='utf-8-sig')
chipindex_css=(root/'chip-index-guides.css').read_text(encoding='utf-8')
memory_ui=(root/'memory-ui.js').read_text(encoding='utf-8')
memory_css=(root/'memory-ui.css').read_text(encoding='utf-8')
shell_css=(root/'platforms-shell.css').read_text(encoding='utf-8')

def add_generation_context(app):
    changes=[
        ("$('#main').innerHTML=page==='overview'?overview():views[page]();", "$('#main').innerHTML=withGenerationContext(page,page==='overview'?overview():views[page]());"),
        ('<span class="tag">${m.tag}</span>', '<span class="tag">${m.tag}</span>${modelGenerationBadge(m)}'),
        ('<p class="dialog-intro">${m.job}</p>', '<p class="dialog-intro">${m.job}</p>${modelGenerationDetail(m)}'),
        ('<tbody>${rows.map(([l,k])', '<tbody>${generationCompareRows(list)}${rows.map(([l,k])'),
        ("return models.filter(m=>(f.family", "return models.filter(m=>(!f.generation||f.generation==='All'||generationData.models[m.id].generationId===f.generation)&&(f.family"),
        ("...m.drive].join(' ')", "...m.drive,...generationSearchTerms(m)].join(' ')"),
        ("function afterRender(page,sub){", "function afterRender(page,sub){renderGenerationDetail();"),
        ('\nrender();', '\n'+generation_ui+'\nrender();')
    ]
    for old,new in changes:
        if app.count(old)!=1:
            raise ValueError(f'Expected one shared generation hook: {old[:80]} (got {app.count(old)})')
        app=app.replace(old,new,1)
    return app
def add_fae_context(app):
    changes=[
        ("[m.name,m.cpu,m.cpuDetail,m.storage,m.gpu,m.tag,m.family,m.vendor,...m.drive,...generationSearchTerms(m)].join(' ').toLowerCase().includes(q)", "faeMatchesSearch(m,q)"),
        ('</dl><div class="${m.lifecycle?', '</dl>${faeModelDetail(m)}<div class="${m.lifecycle?'),
        ('${generationCompareRows(list)}', '${memoryCompareRows(list)}${generationCompareRows(list)}${faeCompareRows(list)}'),
        ("if(page==='lineup')renderModels();", "if(page==='lineup')renderModels();faeAfterRender(page,sub);"),
        ("$('#modelDialog').showModal();", "if(!$('#modelDialog').open)$('#modelDialog').showModal();"),
        ('Object.entries(sources).map(([id,s])', 'faeSourceEntries().map(([id,s])'),
        ('\nrender();', '\n'+fae_ui+'\nrender();')
    ]
    for old,new in changes:
        if app.count(old)!=1:
            raise ValueError(f'Expected one FAE hook: {old[:80]} (got {app.count(old)})')
        app=app.replace(old,new,1)
    return app

def vendor_menu(vendor):
    ucs='<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>'
    hpe='<span class="hpe-mark" aria-hidden="true"></span>'
    lenovo='<span class="lenovo-mark" aria-hidden="true">Lenovo</span>'
    supermicro='<span class="supermicro-mark" aria-hidden="true"><svg viewBox="0 0 42 32"><ellipse cx="20" cy="16" rx="18" ry="11" transform="rotate(-24 20 16)" fill="none" stroke="#62be83" stroke-width="2"/><path d="M13 11h12l-4 5h-8l-3 5h13" fill="none" stroke="#c9e6f1" stroke-width="2"/><circle cx="37" cy="9" r="2.6" fill="#ec4650"/></svg></span>'
    dell='<span class="dell-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="2"/><text x="20" y="24" text-anchor="middle" fill="currentColor" font-family="Arial,sans-serif" font-size="11" font-weight="700" font-style="italic">DELL</text></svg></span>'
    opts=''
    for ident,label,sub,mark in [('UCS','Cisco UCS','Unified computing',ucs),('HPE','HPE','ProLiant, Synergy & AI',hpe),('Dell','Dell Technologies','PowerEdge, MX & AI',dell),('Lenovo','Lenovo','ThinkSystem, edge & Neptune',lenovo),('Supermicro','Supermicro','Hyper, Twin, SuperBlade & AI',supermicro)]:
        active=ident==vendor
        opts+=f'<a class="vendor-option" href="{ident.lower()}-field-guide.html#overview"'+(' aria-current="page"' if active else '')+f'>{mark}<span>{label}<small>{sub}</small></span>'+('<span class="current-check" aria-hidden="true">✓</span>' if active else '')+'</a>'
    mark={'UCS':ucs,'HPE':hpe,'Dell':dell,'Lenovo':lenovo,'Supermicro':supermicro}[vendor]
    brand=f'{mark}<span>{vendor}<span class="brand-sub">FIELD GUIDE</span></span>'
    if vendor=='Lenovo':
        brand=f'<span class="lenovo-brand">{mark}<span class="brand-sub">FIELD GUIDE</span></span>'
    if vendor=='Supermicro':
        brand='<span class="supermicro-brand"><span class="supermicro-wordmark">SUPERMICRO<i></i></span><span class="brand-sub">FIELD GUIDE</span></span>'
    menu=f'<details class="learn-menu is-current"><summary>OEM guides <span aria-hidden="true">⌄</span></summary><div class="learn-menu-options"><span class="learn-menu-label">LEARN AN OEM LINEUP</span>{opts}</div></details>'
    return menu,brand
for vendor in ['UCS','HPE','Dell','Lenovo','Supermicro']:
    menu,brand=vendor_menu(vendor)
    html=template.replace('<!--__OEM_MENU__-->',menu).replace('<!--__OEM_CONTEXT__-->',brand).replace('<!--__OEM_LABEL__-->','Cisco UCS' if vendor=='UCS' else vendor)
    html=html.replace('aria-label="UCS guide overview"',f'aria-label="{vendor} guide overview"')
    finder_link=f'index.html#finder?oem={vendor.lower()}'
    html=html.replace('<!--__FINDER_LINK__-->',f'<a class="fae-finder-nav" href="{finder_link}"><span>Find {vendor} platforms<small>Compare CPU, memory and support</small></span><span aria-hidden="true">→</span></a>')
    html=html.replace('Sources checked · 07 Oct 2026',f'Catalog snapshot · {release["snapshotDate"]}').replace('Snapshot: 07 Oct 2026',f'Catalog snapshot: {release["snapshotDate"]} · catalog v{release["version"]}')
    app=original
    vendor_css=css
    if vendor!='UCS':
        key=vendor.lower()
        html=html.replace('Cisco UCS servers',f'{vendor} servers').replace('UCS Field Guide',f'{vendor} Field Guide').replace('UCS FIELD GUIDE',f'{vendor.upper()} FIELD GUIDE').replace('Based on Cisco documentation',f'Based on {vendor} documentation')
        vendor_css+='\n'+(root/f'{key}-styles.css').read_text(encoding='utf-8')
        custom=(root/f'{key}-views.js').read_text(encoding='utf-8')
        ranges={'hardware':'function node','architecture':'function setConcept','overview':'function render','lineup':'function filteredModels','platforms':'const driveLessons','driveLessons':'function components','components':'function renderDrive','sourcesView':'const views'}
        for name,endmark in ranges.items():
            startmark=('const ' if name=='driveLessons' else 'function ')+name
            start=app.index(startmark)
            end=app.index(endmark,start+len(startmark))
            replacement=custom.split('// BEGIN '+name+'\n',1)[1].split('// END '+name,1)[0]
            app=app[:start]+replacement+app[end:]
        app=app.replace("mode:'standard',concept:'chassis'","mode:'rack',concept:'cpu'")
        modular={'HPE':'synergy','Dell':'mx','Lenovo':'dense','Supermicro':'blade'}[vendor]
        app=app.replace("['standard','direct','rack'].includes(hash[1])?hash[1]:'standard'",f"['rack','{modular}','ai'].includes(hash[1])?hash[1]:'rack'")
        app=app.replace('Cisco UCS ${m.name}',vendor+' ${m.name}').replace('selected UCS server models',f'selected {vendor} server models').replace("replace('Cisco UCS ','')",f"replace('{vendor} ','')").replace('In UCS:</b>',f'In {vendor}:</b>')
        if vendor=='Lenovo':
            app=app.replace('AFFECTED VARIANTS: EOS NOTICE','WITHDRAWN · 26 SEP 2026')
            app=app.replace("f.family==='Rack'&&m.family==='AI'","f.family==='Rack'&&['AI','Scale-up'].includes(m.family)")
    data=(root/('data.js' if vendor=='UCS' else f'{vendor.lower()}-data.js')).read_text(encoding='utf-8')
    data+='\nconst cpuAliases='+json.dumps(cpu_aliases['aliases'],ensure_ascii=False,separators=(',',':'))+';\n'
    chronology=json.loads((root/f'{vendor.lower()}-generation-data.json').read_text(encoding='utf-8-sig'))
    data+='\nconst generationData='+json.dumps(chronology,ensure_ascii=False,separators=(',',':'))+';\n'
    data+='Object.entries(generationData.sources).forEach(([id,source])=>{sources["generation_"+id]=source;if(!sources[id])sources[id]=source;});\n'
    fae=json.loads((root/f'fae-{vendor.lower()}.json').read_text(encoding='utf-8-sig'))
    physical=json.loads((root/f'physical-{vendor.lower()}.json').read_text(encoding='utf-8-sig'))
    data+='\nconst physicalData='+json.dumps({p['id']:p for p in physical},ensure_ascii=False,separators=(',',':'))+';\n'
    data+='\nconst faeData='+json.dumps(fae,ensure_ascii=False,separators=(',',':'))+';\n'
    data+='Object.assign(sources,faeData.sources);\n'
    memory=json.loads((root/f'memory-{vendor.lower()}.json').read_text(encoding='utf-8-sig'))
    data+='\nconst memoryData='+json.dumps(memory,ensure_ascii=False,separators=(',',':'))+';\n'
    data+='models.forEach(m=>{m.computeMemory=memoryData[m.id];if(!m.computeMemory)throw Error("Missing CPU/memory profile: "+m.id);});\n'
    app=re.sub(r'(function hardware\([^\n]*?\)\s*\{)',r"\1\n if(shape.startsWith('installed-'))return installedBaseArt(shape);",app,count=1)
    app=add_fae_context(add_generation_context(app))
    reviewed_art='\n'.join((root/f'reviewed-art-{name}.js').read_text(encoding='utf-8') for name in ('hpe','cisco-dell','supermicro','lenovo'))
    app=reviewed_art+'\n'+(root/'installed-base-art.js').read_text(encoding='utf-8')+'\n'+memory_ui+'\n'+app
    vendor_css+='\n'+generation_css+'\n'+fae_css+'\n'+chipindex_css+'\n'+memory_css+'\n'+shell_css
    (root/f'{vendor.lower()}-app.js').write_text(app,encoding='utf-8',newline='')
    html=html.replace('/*__CSS__*/',vendor_css).replace('/*__DATA__*/',data).replace('/*__APP__*/',app+'\n'+switch)
    out=root.parent/'outputs'/f'{vendor.lower()}-field-guide.html'
    out.write_text(html,encoding='utf-8',newline='')
    print(f'Built {out.name}: {out.stat().st_size:,} bytes')

# Record the exact generated UI as well as the catalog content. No child process is needed.
manifest_path=root.parent/'outputs'/'build-manifest.json'
if manifest_path.exists():
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    pages=['index.html']+[f'{vendor}-field-guide.html' for vendor in ['ucs','hpe','dell','lenovo','supermicro']]
    manifest['pageHashes']={name:hashlib.sha256((root.parent/'outputs'/name).read_bytes()).hexdigest() for name in pages}
    manifest['buildHash']=hashlib.sha256('\n'.join(name+'\0'+digest for name,digest in manifest['pageHashes'].items()).encode('utf-8')).hexdigest()
    manifest_path.write_text(json.dumps(manifest,indent=2),encoding='utf-8',newline='')
    print('Finalized build '+manifest['buildHash'])
