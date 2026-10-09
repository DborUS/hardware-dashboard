// Original vector exteriors traced to inspected HPE QuickSpecs front photographs.
// Each image depicts one documented configuration, not every supported option.
// Evidence and explicit configuration limits: art-review-hpe.json / physical-hpe.json.
function reviewedHpeArt(shape) {
 const models={
  'installed-hpe-dl325g11':'HPE ProLiant DL325 Gen11',
  'installed-hpe-dl345g11':'HPE ProLiant DL345 Gen11',
  'installed-hpe-dl385g10pv2':'HPE ProLiant DL385 Gen10 Plus v2',
  'installed-hpe-xd675':'HPE Cray XD675'
 };
 if(!models[shape]) return '';
 const uid='reviewed-hpe-'+(reviewedHpeArt.serial=(reviewedHpeArt.serial||0)+1);
 const metal=`url(#${uid}-metal)`,mesh=`url(#${uid}-mesh)`,darkmesh=`url(#${uid}-darkmesh)`;
 const rect=(x,y,w,h,fill='#151b1e',stroke='#67757b',r=.7)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>`;
 const led=(x,y,c='#52c9a6',r=.8)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
 const logo=(x,y,w)=>`<rect x="${x}" y="${y}" width="${w}" height="${w*.35}" fill="none" stroke="#00b388" stroke-width="1"/>`;
 const screw=(x,y)=>`<circle cx="${x}" cy="${y}" r="1.8" fill="#6d7a7f" stroke="#bac5c6" stroke-width=".7"/><path d="M${x-1} ${y}h2" stroke="#243337" stroke-width=".7"/>`;
 const vent=(x,y,w,h)=>rect(x,y,w,h,darkmesh,'#4f6067',.3);
 const shell=(x,y,w,h,dx=27,dy=19)=>`<path d="M${x} ${y}l${dx} -${dy}h${w}l-${dx} ${dy}z" fill="${metal}" stroke="#afbbbb" stroke-width=".7"/><path d="M${x+w} ${y}l${dx} -${dy}v${h}l-${dx} ${dy}z" fill="#718188" stroke="#a9b6bb" stroke-width=".7"/>`+rect(x,y,w,h,'#2e393e','#a0afb4',1.2)+`<path d="M${x+7} ${y-3}l${dx-8} -${dy-5}h${w-13}" fill="none" stroke="#c2cbcd" stroke-width=".5"/>`;
 const hdrive=(x,y,w,h)=>rect(x,y,w,h,'#202a2e','#7e8a8f',.35)+rect(x+1.5,y+1.3,w-3,h-2.6,'#11181d','#293237',.3)+`<path d="M${x+4} ${y+3}h${w-13}v${Math.max(1,h-6)}H${x+4}" fill="#374249" stroke="#586970" stroke-width=".4"/>`+rect(x+w-8,y+2,3,h-4,'#554757','#252e33',.25)+led(x+w-2.6,y+h-2.7,'#4eb392',.55);
 const vdrive=(x,y,w,h)=>rect(x,y,w,h,'#263035','#737f86',.5)+rect(x+1,y+1,w-2,h-2,'#10171b','#222d32',.3)+`<path d="M${x+w*.3} ${y+5}v${h-13}h${w*.39}V${y+5}" fill="#344047" stroke="#5d6c72" stroke-width=".55"/>`+rect(x+1.2,y+h-10,w-2.4,5,'#4c414f','#31383d',.4)+led(x+w*.3,y+h-2.8,'#4eb392',.6)+led(x+w*.7,y+h-2.8,'#93afbd',.45);
 const vbank=(x,y,w,h,count=8)=>{let b='';for(let i=0;i<count;i++)b+=vdrive(x+i*w/count,y,w/count-1,h);return b;};
 const rackRail=(x,y,h,gen10=false)=>{
  let b=rect(x,y,16,h,'#151d21','#536168',1)+rect(x-9,y,8,h,'#1c2529','#485a61',.5);
  b+=vent(x-8,y+2,6,h-4)+logo(x+6,y+h-8,7);
  b+=led(x+5,y+5)+led(x+5,y+10)+led(x+5,y+15,'#58a3d0');
  if(h>35){b+=rect(x+3,y+h*.5,3.6,9,'#070e12','#a1aab0',.5)+rect(x+3,y+h*.73,3.6,7,'#070e12','#a1aab0',.4);}
  else {b+=rect(x+1,y+3,3.5,8,'#070e12','#899ba4',.5)+rect(x+1,y+h-11,3.5,8,'#070e12','#899ba4',.4);}
  return b;
 };
 let b='',label='';
 if(shape==='installed-hpe-dl325g11'){
  const x=28,y=88,w=320,h=30,fx=x+19,fw=w-49;
  b=shell(x,y,w,h)+rect(x+1,y+1,16,h-2,'#151e22','#66767d',1)+rect(x+3,y+5,10,h-10,'#202b31','#3b4b52')+rackRail(x+w-17,y+1,h-2);
  for(let row=0;row<2;row++)for(let col=0;col<5;col++)b+=hdrive(fx+col*fw/5,y+2+row*13,fw/5-1.5,12);
  b+=`<path d="M${fx+fw*.6-1} ${y+1}v28M${fx+fw*.8-1} ${y+1}v28" stroke="#a1adb0" stroke-width=".75"/>`;
  label='HPE ProLiant DL325 Gen11 1U: documented 8 SFF plus optional 2 SFF front, five pairs of horizontal carriers, controls on the right';
 }else if(shape==='installed-hpe-dl345g11'){
  const x=28,y=72,w=320,h=59,fx=x+18,fw=w-46;
  b=shell(x,y,w,h)+rect(x+1,y+1,15,h-2,'#151e22','#66767d',1)+rect(x+3,y+5,9,18,'#10191e','#3b4b52')+rect(x+3,y+h-20,9,16,'#202b31','#3b4b52')+rackRail(x+w-17,y+1,h-2);
  for(let c=0;c<3;c++){const bx=fx+c*fw/3;b+=rect(bx,y+2,fw/3-1,h-4,'#121a1e','#a0adb1',.6)+vbank(bx+2,y+4,fw/3-4,h-8);}
  label='HPE ProLiant DL345 Gen11 2U: documented 24 SFF front, three cages of eight upright carriers, right vent and control strip';
 }else if(shape==='installed-hpe-dl385g10pv2'){
  const x=28,y=72,w=320,h=59,fx=x+18,fw=w-45,cw=fw/3;
  b=shell(x,y,w,h)+rect(x+1,y+1,15,h-2,'#151e22','#66767d',1)+rect(x+3,y+h-18,9,12,'#202b31','#3b4b52')+rackRail(x+w-17,y+1,h-2,true);
  for(let c=0;c<2;c++) b+=rect(fx+c*cw,y+2,cw-1,h-4,'#3b454b','#9ca7ab',.7)+vent(fx+7+c*cw,y+9,cw-15,h-18);
  b+=rect(fx+2*cw,y+2,cw-1,h-4,'#121a1e','#a0adb1',.6)+vbank(fx+2*cw+2,y+4,cw-4,h-8);
  label='HPE ProLiant DL385 Gen10 Plus v2 2U: documented 8 SFF configuration, two blank mesh cages left and center, eight upright basic carriers on the right';
 }else{
  const x=96,y=31,w=182,h=134,fx=x+11,fw=w-23,fanH=31.8,fanW=fw/4;
  b=shell(x,y,w,h,29,19)+rect(x+1,y+1,9,h-2,metal,'#aebec3',.5)+rect(x+w-11,y+1,10,h-2,metal,'#aebec3',.5);
  for(let side of [x+5,x+w-6])for(let sy of [y+8,y+31,y+h-31,y+h-8])b+=screw(side,sy);
  for(let row=0;row<3;row++)for(let col=0;col<4;col++){
   const xx=fx+col*fanW,yy=y+1.5+row*fanH;
   b+=rect(xx,yy,fanW-1,fanH-1,'#202a2e','#77868c',.4)+rect(xx+7,yy+3,fanW-14,fanH-6,darkmesh,'#37484f',3)+`<circle cx="${xx+fanW*.5}" cy="${yy+fanH*.5}" r="${fanH*.31}" fill="none" stroke="#45565d" stroke-width=".55"/>`+rect(xx+fanW*.5-2.2,yy+1,4.4,fanH-3,'#37454c','#68767c',.4)+rect(xx+fanW*.5-1.2,yy+4,2.4,5,'#a9b4b8','#3a4c52',.3);
  }
  b+=`<path d="M${fx} ${y+97.3}h${fw}" stroke="#abb9be" stroke-width="1"/>`;
  const driveY=y+98,driveH=h-101,gw=fw/3;
  for(let c=0;c<3;c++){
   const xx=fx+c*gw;
   b+=rect(xx,driveY,gw-.8,driveH+1,'#192126','#6b7b83',.4);
   for(let i=0;i<8;i++){
    const dx=xx+1+i*(gw-2)/8,dw=(gw-2)/8-1;
    b+=rect(dx,driveY+1,dw,driveH-1,'#151d22','#6f7b83',.3)+led(dx+dw*.5,driveY+4,c===1?'#202c32':'#c0c9cc',Math.min(1.65,dw*.36))+`<path d="M${dx+dw*.5} ${driveY+8}v${driveH-11}" stroke="#5b6b72" stroke-width="1.1"/>`;
   }
  }
  b+=led(x+w-5.5,y+52,'#496069',1)+led(x+w-5.5,y+58,'#4c645c',1)+rect(x+w-8,y+64,5,2,'#0c171d','#60747e',.25)+rect(x+w-8,y+68,5,2,'#0c171d','#60747e',.25);
  label='HPE Cray XD675 8U front: twelve rectangular fan modules in four columns and three rows above three eight-drive SFF cages, with silver rack ears and right-side controls';
 }
 return `<svg class="hardware-art reviewed-hpe-art" viewBox="0 0 400 180" role="img" aria-label="${label}"><title>${label}</title><defs><linearGradient id="${uid}-metal" x2=".6" y2="1"><stop stop-color="#ced6d6"/><stop offset=".5" stop-color="#a1b0b5"/><stop offset="1" stop-color="#72868f"/></linearGradient><pattern id="${uid}-darkmesh" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><rect width="3.2" height="3.2" fill="#596a71"/><rect x=".45" y=".5" width="2.25" height="2.15" rx=".3" fill="#0d171c"/></pattern></defs>${b}</svg>`;
}
