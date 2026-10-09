// Source-reviewed exterior drawings. See art-review-supermicro.json and physical-supermicro.json.
// The drawings show a documented front configuration; they are not a drive-option inventory.
function reviewedSupermicroArt(shape) {
 const models={
  'installed-supermicro-amdlegacy':'AS-2024US-TRT',
  'installed-supermicro-mi300x':'AS-8125GS-TNMR2',
  'installed-supermicro-h15hyper':'AS-2127H7-N'
 };
 if(!models[shape]) return '';
 const serial=(reviewedSupermicroArt.serial=(reviewedSupermicroArt.serial||0)+1);
 const uid='reviewed-sm-'+serial,metal=`url(#${uid}-metal)`,mesh=`url(#${uid}-mesh)`,darkmesh=`url(#${uid}-darkmesh)`;
 const rect=(x,y,w,h,fill='#1b2024',stroke='#859198',r=.7)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width=".65"/>`;
 const led=(x,y,color='#71cf97')=>`<circle cx="${x}" cy="${y}" r=".85" fill="${color}"/>`;
 const vent=(x,y,w,h,dark=false)=>rect(x,y,w,h,dark?darkmesh:mesh,dark?'#303940':'#91a1ac');
 const screw=(x,y)=>`<circle cx="${x}" cy="${y}" r="1.55" fill="#62747f" stroke="#c1ccd2" stroke-width=".6"/><path d="M${x-.8} ${y}h1.6" stroke="#263841" stroke-width=".65"/>`;
 const handle=(x,y,w,h)=>`<path d="M${x+w} ${y}H${x+3}q-3 0-3 3v${h-6}q0 3 3 3h${w-3}" fill="none" stroke="#b9c6ce" stroke-width="3" stroke-linecap="round"/>`;
 const shell=(x,y,w,h,dx=24,dy=18)=>`<path d="M${x} ${y}l${dx} -${dy}h${w}l-${dx} ${dy}z" fill="${metal}" stroke="#adbdc7" stroke-width=".65"/><path d="M${x+w} ${y}l${dx} -${dy}v${h}l-${dx} ${dy}z" fill="#72858f" stroke="#a8bac5" stroke-width=".65"/>`+rect(x,y,w,h,metal,'#c1cdd5',1)+rect(x+1.5,y+1.5,10,h-3,metal,'#899da9')+rect(x+w-11.5,y+1.5,10,h-3,metal,'#899da9')+led(x+6,y+7,'#bd5a60')+led(x+6,y+11)+screw(x+6,y+h-6)+screw(x+w-6,y+h-6);
 const lff=(x,y,w,h)=>rect(x,y,w,h,'#141b20','#6e7f89')+vent(x+2,y+2,w-4,h-4,true)+`<path d="M${x+4} ${y+h-4}Q${x+w*.5} ${y+h-.7} ${x+w-9} ${y+h-4}" fill="none" stroke="#46535c" stroke-width="2.9"/>`+rect(x+w-9,y+h-6,6,4.5,'#854c63','#a2677d',.7);
 const sff=(x,y,w,h,latch='#e4ad30')=>rect(x,y,w,h,'#182028','#6b7d86',.5)+rect(x+1,y+2,w-2,Math.max(3,h-9),'#27353e','#11191e',.4)+`<path d="M${x+w*.34} ${y+5}v${Math.max(1,h-14)}M${x+w*.65} ${y+5}v${Math.max(1,h-14)}" stroke="#0b1116" stroke-width="${Math.max(.8,w*.19)}"/>`+rect(x+1.5,y+h-6,w-3,4.3,latch,latch,.5);
 let b='',label='';
 if(shape==='installed-supermicro-amdlegacy') {
  const x=31,y=77,w=314,h=64,fx=x+17,fw=w-34;
  b=shell(x,y,w,h,24,18);
  for(let row=0;row<3;row++) for(let col=0;col<4;col++) b+=lff(fx+col*fw/4,y+3+row*19.5,fw/4-2,18.2);
  b+=handle(x+3,y+10,7,30)+handle(x+w-10,y+10,7,30);
  label='AS-2024US-TRT: 2U silver chassis, twelve horizontal LFF carriers in four columns and three rows, burgundy releases and side pull handles; cover closed for clarity';
 } else if(shape==='installed-supermicro-h15hyper') {
  const x=31,y=77,w=314,h=64,fx=x+17,fw=w-34,dw=fw/3;
  b=shell(x,y,w,h,24,18)+vent(fx,y+3,dw-2,h-6,true)+vent(fx+dw*2+1,y+3,dw-2,h-6,true);
  // The official front callout numbers these eight carriers 0-7. Other backplanes are alternatives.
  for(let col=0;col<8;col++) b+=sff(fx+dw+col*dw/8,y+3,dw/8-1.1,h-6);
  b+=rect(x+4,y+17,4,3,'#666f7e','#9eaeb8',.3)+`<path d="M${fx+3} ${y+20}h${dw-8}M${fx+3} ${y+42}h${dw-8}M${fx+dw*2+4} ${y+20}h${dw-8}M${fx+dw*2+4} ${y+42}h${dw-8}" stroke="#33424b" stroke-width="3"/>`;
  label='AS-2127H7-N: official 2U front configuration with eight central vertical SFF carriers, yellow releases, dark ventilated blanks on both sides and silver control ears';
 } else {
  const x=99,y=25,w=180,h=146,fx=x+13,fw=w-26;
  b=shell(x,y,w,h,22,14)+vent(fx,y+4,fw,65);
  // Five visible mid-front fan grilles. Ten fans in the specifications do not mean ten visible front modules.
  for(let col=0;col<5;col++) {
   const bx=fx+col*fw/5,by=y+72,bw=fw/5-1.3;
   b+=vent(bx,by,bw,32.5)+`<circle cx="${bx+bw/2}" cy="${by+16}" r="10.8" fill="none" stroke="#6d7f89" stroke-width="1.3"/><circle cx="${bx+bw/2}" cy="${by+16}" r="3.2" fill="#c4c9bf" stroke="#71848f" stroke-width=".7"/>`;
   b+=screw(bx+2.3,by+2.5)+screw(bx+bw-2.3,by+29.5)+rect(bx+bw-4,by+12,3,12,metal,'#bdc9cf',.6);
  }
  // The gallery's chassis face has carrier/blank positions beyond this model's supported drive options.
  for(let col=0;col<24;col++) b+=sff(fx+col*fw/24,y+108,fw/24-.7,33,col<16?'#e4ad30':'#805268');
  b+=handle(x+3,y+102,7,32)+handle(x+w-10,y+102,7,32)+handle(x+3,y+8,5,17)+handle(x+w-8,y+8,5,17);
  b+=rect(x+3,y+37,5,14,'#d5b640','#b29c43',.4)+rect(x+w-8,y+37,5,14,'#d5b640','#b29c43',.4);
  label='AS-8125GS-TNMR2: 8U silver chassis with broad upper mesh, five middle fan grilles and lower vertical carrier/blank positions matching the OEM photograph; pictured face is not a count of supported drives';
 }
 return `<svg viewBox="0 0 400 180" role="img" aria-label="${label}" data-reviewed-model="${models[shape]}"><defs><linearGradient id="${uid}-metal" x2=".3" y2="1"><stop stop-color="#dbe2e5"/><stop offset=".45" stop-color="#b2bfc7"/><stop offset="1" stop-color="#778b99"/></linearGradient><pattern id="${uid}-mesh" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#adbdc7"/><circle cx="2" cy="2" r="1.1" fill="#586c78"/></pattern><pattern id="${uid}-darkmesh" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#33454f"/><rect x="1" y=".8" width="2.1" height="2.4" rx=".5" fill="#121e26"/></pattern></defs>${b}</svg>`;
}
