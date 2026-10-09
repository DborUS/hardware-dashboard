// Run after building Finder and guides. Reports describe this exact catalog hash.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const root=__dirname,out=path.join(root,'../outputs');
const history=path.join(out,'history');fs.mkdirSync(history,{recursive:true});
const oldAcceptance=path.join(out,'acceptance-results.json'),archive=path.join(history,'acceptance-results-v1.0.json');
if(fs.existsSync(oldAcceptance)&&!fs.existsSync(archive)){const prior=JSON.parse(fs.readFileSync(oldAcceptance,'utf8'));if(!prior.version||prior.version==='1.0')fs.copyFileSync(oldAcceptance,archive);}
const manifest=JSON.parse(fs.readFileSync(path.join(out,'build-manifest.json'),'utf8'));
const checks=[['check-finder.cjs','acceptance-results.json'],['check-generations.cjs','generation-results.json'],['check-physical-design.cjs','physical-design-results.json'],['check-release-quality.cjs','release-quality-results.json'],['check-spec-verification.cjs','spec-verification-results.json']];
let failed=false;
for(const [script,file] of checks){
 const scriptPath=path.join(root,script),logs=[],testProcess={...process,argv:[process.execPath,scriptPath],exitCode:0};
 let error='';
 try{const run=new vm.Script('(function(require,module,exports,__filename,__dirname){'+fs.readFileSync(scriptPath,'utf8')+'\n})',{filename:scriptPath}).runInNewContext({console:{log:(...args)=>logs.push(args.join(' ')),error:(...args)=>logs.push(args.join(' '))},process:testProcess,Buffer,URL,URLSearchParams,setTimeout,clearTimeout});const module={exports:{}};run(createRequire(scriptPath),module,module.exports,scriptPath,root);}catch(e){error=e.stack||e.message;testProcess.exitCode=1;}
 let report;
 try{report=JSON.parse(logs.join('\n'));}catch{report={failed:1,results:[{name:script,status:'FAIL',message:error||logs.join('\n')||'No test output'}]};}
 let errors=report.failed??report.failures?.length??(report.result==='PASS'?0:testProcess.exitCode===0?0:1);
 if(report.catalogHash&&report.catalogHash!==manifest.contentHash){errors++;report.results??=[];report.results.push({name:'Built catalog matches tested inputs',status:'FAIL',message:'Rebuild the dashboard before running release checks.'});}
 report={...report,version:manifest.version,catalogHash:manifest.contentHash,buildHash:manifest.buildHash,generatedBy:'tools/build-platform-guides.py',exitCode:testProcess.exitCode||0,failed:errors};
 if(testProcess.exitCode||errors)failed=true;
 fs.writeFileSync(path.join(out,file),JSON.stringify(report,null,2));
 console.log(`${script}: ${!testProcess.exitCode&&!errors?'PASS':'FAIL'}${report.passed!==undefined?' ('+report.passed+' passed)':''}`);
 if(testProcess.exitCode||errors)console.log(JSON.stringify(report,null,2));
}
process.exitCode=failed?1:0;
