/* AFRN: Ongeza Klabu shortcut for clubs/divisions page. Non-destructive. */
(function(){
  function addButton(){
    if(!location.pathname.endsWith('clubs.html') && !location.pathname.endsWith('divisions.html')) return;
    if(document.getElementById('afrnAddClubShortcut')) return;
    const toolbar=document.querySelector('.toolbar');
    if(!toolbar) return;
    const a=document.createElement('a');
    a.id='afrnAddClubShortcut';
    a.className='btn';
    a.href='add-club.html';
    a.textContent='➕ Ongeza Klabu';
    a.style.cssText='text-decoration:none;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;';
    toolbar.appendChild(a);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addButton);
  else addButton();
})();
