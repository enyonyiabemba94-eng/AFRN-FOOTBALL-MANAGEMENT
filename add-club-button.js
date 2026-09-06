/* AFRN trophy history: legacy trophies become individual editable records. */
(function(){
  const db=()=>window.afrnSupabase||window.supabaseClient||window.sb||window.supabase;
  const oldCount=c=>Math.max(0,Number(c&&c.trophy_legacy_count||0));
  const hist=c=>Array.isArray(c&&c.trophy_history)?c.trophy_history:[];
  async function migrate(c){
    if(!c||oldCount(c)<=0||hist(c).length)return;
    const n=oldCount(c);
    const h=Array.from({length:n},(_,i)=>({name:'Taji la Zamani #'+(i+1),date:'',stadium:'',competition:'',position:1,legacy_placeholder:true}));
    const r=await db().from('clubs').update({trophy_history:h,trophy_legacy_count:0,trophies:h.length}).eq('id',c.id);
    if(!r.error){c.trophy_history=h;c.trophy_legacy_count=0;c.trophies=h.length;}
  }
  function addFields(){
    if(document.getElementById('afrnTrophyDate'))return;
    const name=document.getElementById('afrnTrophyName');
    if(!name)return;
    const box=name.parentElement&&name.parentElement.parentElement;
    if(!box)return;
    const d=document.createElement('div');d.className='afrn-field';
    d.innerHTML='<label>Tarehe ya kubeba kombe *</label><input id="afrnTrophyDate" type="date">';
    const st=document.createElement('div');st.className='afrn-field';
    st.innerHTML='<label>Uwanja *</label><input id="afrnTrophyStadium" maxlength="160" placeholder="Mfano: Uwanja wa Nyarugusu">';
    box.insertBefore(d,name.parentElement.nextSibling);box.insertBefore(st,d.nextSibling);
  }
  function hook(){
    if(typeof window.renderClubProfile!=='function'||window._afrnLegacyTrophyHook)return;
    const original=window.renderClubProfile;
    window.renderClubProfile=async function(c,p){
      original(c,p);await migrate(c);addFields();
      const section=document.getElementById('afrnTrophies');
      if(section){section.querySelectorAll('[data-edit]').forEach(x=>x.title='Hariri historia ya kombe');}
    };
    window._afrnLegacyTrophyHook=true;
  }
  function run(){hook();setTimeout(hook,500);setTimeout(hook,1500);setTimeout(addFields,1800);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
