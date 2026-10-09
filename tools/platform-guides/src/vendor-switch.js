const vendorTrigger=document.getElementById('vendorTrigger'),vendorMenu=document.getElementById('vendorMenu');
function closeVendorMenu(returnFocus=false){vendorMenu.hidden=true;vendorTrigger.setAttribute('aria-expanded','false');if(returnFocus)vendorTrigger.focus();}
vendorTrigger.addEventListener('click',()=>{const open=vendorMenu.hidden;vendorMenu.hidden=!open;vendorTrigger.setAttribute('aria-expanded',String(open));});
vendorTrigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();vendorMenu.hidden=false;vendorTrigger.setAttribute('aria-expanded','true');vendorMenu.querySelector('a').focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.vendor-switch'))closeVendorMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!vendorMenu.hidden){e.preventDefault();closeVendorMenu(true);}});
document.querySelector('.vendor-switch').addEventListener('focusout',e=>{if(!e.currentTarget.contains(e.relatedTarget))closeVendorMenu();});
vendorMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{const section=location.hash.slice(1).split('/')[0];if(['overview','lineup','platforms','components','quiz','sources'].includes(section))a.href=a.getAttribute('href').split('#')[0]+'#'+section;}));
