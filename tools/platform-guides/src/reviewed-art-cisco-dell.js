// Model-specific exterior illustrations reviewed against the official front views.
// Source locators and illustrated configurations live in art-review-cisco-dell.json.
let reviewedCiscoDellSerial=0;
function reviewedCiscoDellArt(shape){
 const configs={
  'installed-ucs-c225m6':{name:'Cisco UCS C225 M6',kind:'cisco1',view:'1U ten-SFF front; five horizontal carriers in each of two rows, right control panel and KVM'},
  'installed-c245m6':{name:'Cisco UCS C245 M6',kind:'cisco2',view:'2U twenty-four-SFF front; vertical carriers, left control panel and right KVM'},
  'installed-dell-r7515':{name:'Dell PowerEdge R7515',kind:'dell12',view:'2U twelve-LFF front; four horizontal carriers in each of three rows, bezel removed'},
  'installed-dell-r7525':{name:'Dell PowerEdge R7525',kind:'dell24',view:'2U twenty-four-SFF front; vertical drive carriers, bezel removed'},
  'installed-r7615':{name:'Dell PowerEdge R7615',kind:'dell24',view:'2U twenty-four-SFF front; vertical drive carriers, bezel removed'},
  'installed-r7625':{name:'Dell PowerEdge R7625',kind:'dell16',view:'2U sixteen-SFF front; eight vertical carriers on each side of a central airflow blank, bezel removed'}
 };
 const s=configs[shape];if(!s)return '';
 const id='reviewed-cd-'+(++reviewedCiscoDellSerial),one=s.kind==='cisco1',cisco=s.kind.startsWith('cisco'),x=22,y=one?94:78,w=318,h=one?31:58;
 const r=(a,b,c,d,fill,stroke='#7c8b93',rx=.7)=>`<rect x="${a}" y="${b}" width="${c}" height="${d}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>`;
 const mesh=(a,b,c,d)=>r(a,b,c,d,`url(#${id}-mesh)`,'#46535b',.3);
 const circle=(a,b,rad,fill,stroke)=>`<circle cx="${a}" cy="${b}" r="${rad}" fill="${fill}" stroke="${stroke||fill}" stroke-width=".7"/>`;
 const vga=(a,b)=>`<path d="M${a} ${b}h4.2l1 1v8l-1 1h-4.2l-1-1v-8z" fill="#10212c" stroke="#99a7b0" stroke-width=".6"/>`+Array.from({length:4},(_,i)=>circle(a+1,b+2+i*2,.35,'#8496a2')).join('');
 const dellDrive=(a,b,c,d,vertical)=>{
  let out=r(a,b,c,d,'#161c21','#747f86',1)+r(a+.9,b+1,c-1.8,d-2,'#333e46','#11171c',.6);
  if(vertical){out+=r(a+1.2,b+2,c-2.4,6.5,'#1f282e','#647077',.5)+circle(a+c/2,b+5.3,1.6,'#151a1d','#b37339')+mesh(a+2,b+11,c-4,d-19)+r(a+2,b+d-6,c-4,3.8,'#5b646a','#262f35',.2)+`<path d="M${a+1.4} ${b+10}v${d-18}M${a+c-1.4} ${b+10}v${d-18}" stroke="#8b959b" stroke-width=".65"/>`+circle(a+2,b+1.5,.5,'#58a785');}
  else{out+=r(a+3,b+2,7,d-4,'#273138','#738087',.5)+circle(a+6.5,b+d/2,1.8,'#10181f','#bc793d')+mesh(a+14,b+2,c-22,d-5)+r(a+c-7,b+2,4,d-4,'#535f67','#27323a',.2)+`<path d="M${a+12} ${b+d-2}h${c-22}" stroke="#a5b0b7" stroke-width=".8"/>`+circle(a+1.2,b+4,.65,'#70b593');}
  return `<g data-art-part="drive-carrier">${out}</g>`;
 };
 const ciscoDrive=(a,b,c,d,vertical)=>{
  let out=r(a,b,c,d,'#202a30','#bcc7cc',.7)+r(a+1,b+1,c-2,d-2,'#303d44','#09131a',.4);
  if(vertical){out+=mesh(a+1.6,b+3,c-3.2,d-14)+r(a+1.8,b+d-8,c-3.6,5,'#aebbc0','#72838c',.7)+`<path d="M${a+1.1} ${b+7}h${c-2.2}" stroke="#cbd5d8" stroke-width="1"/>`+circle(a+c-2.3,b+2,.6,'#77c3a3');}
  else{out+=mesh(a+3,b+2,c-10,d-4)+r(a+c-6,b+1.5,4,d-3,'#adb8bc','#72838b',.6)+`<path d="M${a+2} ${b+d-2}h${c-10}" stroke="#d2d9da" stroke-width=".8"/>`+circle(a+c-4,b+3,.6,'#6bc39f');}
  return `<g data-art-part="drive-carrier">${out}</g>`;
 };
 let b=`<path d="M${x} ${y}l32 -26h${w}l-32 26z" fill="url(#${id}-top)" stroke="#a6b4bd" stroke-width=".8"/><path d="M${x+w} ${y}l32 -26v${h}l-32 26z" fill="#657681" stroke="#a7b3b9" stroke-width=".7"/>`;
 // The top, side and front meet at the same two shared edges; nothing extends below the base.
 b+=r(x,y,w,h,cisco?'#8f9da4':'#1c252d','#aebbc3',1.1)+`<path d="M${x+4} ${y+1}h${w-8}" stroke="#d1d9de" stroke-width=".75"/>`;
 if(cisco){
  b+=r(x+2,y+2,15,h-4,'#b9c4c8','#687984',2)+r(x+w-18,y+2,16,h-4,'#b9c4c8','#687984',2);
  if(one){
   for(let row=0;row<2;row++)for(let col=0;col<5;col++)b+=ciscoDrive(43+col*51.8,y+3+row*12.7,50.2,11.6,false);
   b+=r(304,y+2,17,h-4,'#aebdc4','#60727d',.4)+circle(308,y+6,1.9,'#203e35','#67c2a3')+circle(308,y+12,1.6,'#296f93','#6c94aa')+r(315,y+5,3.3,19,'#293b45','#d3dadd',.5);
   for(let i=0;i<5;i++)b+=circle(306.5+(i%2)*3,y+18+Math.floor(i/2)*3,.55,'#529c87');
   b+=r(26,y+7,10,17,'#dee4e4','#778b95',2)+`<text x="31" y="${y+17}" text-anchor="middle" font-family="Arial,sans-serif" font-size="3.8" fill="#344e5e">cisco</text>`+r(326,y+6,10,19,'#d8e0e2','#71858f',2);
  }else{
   for(let i=0;i<24;i++)b+=ciscoDrive(43+i*11.15,y+3,10.3,h-6,true);
   b+=circle(30,y+7,2.1,'#354e47','#d7e1e4')+circle(30,y+14,1.8,'#377d9e','#c2d1d8');
   for(let i=0;i<5;i++)b+=circle(30,y+21+i*3.2,.65,'#496e6d');
   b+=r(25,y+h-18,11,14,'#dce3e3','#758b95',2)+`<text x="30.5" y="${y+h-10}" text-anchor="middle" font-family="Arial,sans-serif" font-size="3.7" fill="#344e5e">cisco</text>`+r(323,y+8,4,23,'#283c49','#d5dee1',1)+r(321,y+h-18,14,14,'#dce3e3','#758b95',2);
  }
 }else{
  // Open-bezel front: status at left, power / USB / VGA / iDRAC at right.
  b+=r(x+1,y+1,18,h-2,'#303a42','#56636c',.6)+r(x+w-21,y+1,20,h-2,'#303a42','#56636c',.6)+r(x+1,y+h-24,9,21,'#111b23','#525e67',1.8)+r(x+w-10,y+h-24,9,21,'#111b23','#525e67',1.8);
  b+=r(35,y+8,1.5,8,'#238dc3','#238dc3',.4);
  for(let i=0;i<3;i++)b+=r(31.5,y+7+i*4,1.2,1.2,'#728b99','#728b99',.1);
  b+=circle(325,y+5.5,2,'#132a23','#69a989')+r(322.5,y+13,3,8,'#111b22','#9eadb8',.4)+vga(331,y+12)+r(324,y+43,1.7,5,'#0c1820','#9eadb8',.3);
  if(s.kind==='dell12'){
   for(let row=0;row<3;row++)for(let col=0;col<4;col++)b+=dellDrive(44+col*67.7,y+3+row*17.25,66.2,16.25,false);
  }else if(s.kind==='dell16'){
   for(let i=0;i<8;i++){b+=dellDrive(44+i*11.3,y+3,10.45,h-6,true);b+=dellDrive(226+i*11.3,y+3,10.45,h-6,true);}
   b+=r(136,y+3,87,h-6,'#242d32','#737e84',.9)+r(139,y+6,81,h-12,`url(#${id}-grid)`,'#151b20',.3);
  }else{
   for(let i=0;i<24;i++)b+=dellDrive(44+i*11.28,y+3,10.45,h-6,true);
  }
  b+=r(283,y+h-1.7,17,1.2,'#a9bac5','#546c7a',.2);
 }
 return `<svg class="hardware-art reviewed-server-art" viewBox="0 0 400 180" role="img" aria-label="${s.name}: ${s.view}; reference-based exterior illustration"><title>${s.name}: ${s.view}</title><defs><linearGradient id="${id}-top" x2=".35" y2="1"><stop stop-color="#c9d3d9"/><stop offset="1" stop-color="#83969f"/></linearGradient><pattern id="${id}-mesh" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#35434b"/><circle cx="1.5" cy="1.5" r=".93" fill="#101a22"/></pattern><pattern id="${id}-grid" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#18222a"/><path d="M0 0h4v4" stroke="#4d5e67" stroke-width=".7"/></pattern></defs>${b}</svg>`;
}
