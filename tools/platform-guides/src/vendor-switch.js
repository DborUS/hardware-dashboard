// Native disclosures keep the same OEM navigation available throughout Platforms.
document.querySelectorAll('.learn-menu').forEach(menu=>{
  const trigger=menu.querySelector('summary');
  const close=(returnFocus=false)=>{menu.open=false;if(returnFocus)trigger.focus();};
  document.addEventListener('click',e=>{if(!menu.contains(e.target))close();});
  menu.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){e.preventDefault();close(true);}});
  menu.addEventListener('focusout',e=>{if(!menu.contains(e.relatedTarget))close();});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    const section=location.hash.slice(1).split('/')[0];
    if(document.body.classList.contains('platform-guide')&&['overview','lineup','platforms','components','quiz','sources'].includes(section))a.href=a.getAttribute('href').split('#')[0]+'#'+section;
  }));
});
