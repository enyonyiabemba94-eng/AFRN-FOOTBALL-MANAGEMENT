/* AFRN: Ongeza Klabu + Hariri shortcuts for clubs/divisions page. */
(function(){
  const isClubs=()=>/\/(clubs|divisions)\.html$/i.test(location.pathname);
  function addButton(){
    if(!isClubs()) return;
    const toolbar=document.querySelector('.toolbar');
    if(toolbar&&!document.getElementById('afrnAddClubShortcut')){
      const a=document.createElement('a');a.id='afrnAddClubShortcut';a.className='btn';a.href='add-club.html';a.textContent='➕ Ongeza Klabu';a.style.cssText='text-decoration:none;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;';toolbar.appendChild(a);
    }
    addEditButtons();
  }
  function addEditButtons(){
    document.querySelectorAll('.club-card').forEach(card=>{
      if(card.querySelector('.afrn-edit-club')) return;
      const title=card.querySelector('h4');
      if(!title) return;
      const id=card.getAttribute('onclick')?.match(/openClub\(['"]([^'"]+)['"]\)/)?.[1];
      if(!id) return;
      const name=(title.textContent||'').replace(/^\s*\d+\.\s*/,'').trim();
      const btn=document.createElement('button');btn.type='button';btn.className='afrn-edit-club';btn.textContent='✏️ Hariri';
      btn.style.cssText='margin-left:auto;flex-shrink:0;border:1px solid #d9e1ec;background:#eef2f6;color:#071a33;border-radius:9px;padding:8px 10px;font-size:12px;font-weight:800;cursor:pointer;';
      btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();location.href='add-club.html?edit='+encodeURIComponent(id)+'&editName='+encodeURIComponent(name);});
      card.appendChild(btn);
    });
  }
  function run(){addButton();setTimeout(addButton,300);setTimeout(addButton,1000);setTimeout(addButton,2000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  new MutationObserver(addEditButtons).observe(document.body,{childList:true,subtree:true});
})();
