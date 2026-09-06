(()=>{'use strict';
const db=window.supabaseClient||window.db;if(!db||!location.pathname.endsWith('matches.html'))return;
const LINEUP_TYPES=['lineup_starting','lineup_substitute'];let original=null;
async function protect(){
 if(typeof window.saveLineups!=='function'||window.saveLineups.__afrnProtected)return;
 original=window.saveLineups;
 const wrapped=async function(){
  const matchId=window.currentMatchId||document.getElementById('editMatchId')?.value;
  if(!matchId)return original.apply(this,arguments);
  const {data:events,error}=await db.from('match_events').select('match_id,player_id,event_type,minute,description,created_at').eq('match_id',matchId);
  if(error){console.warn('AFRN lineup protection read:',error.message);return original.apply(this,arguments)}
  const preserve=(events||[]).filter(e=>!LINEUP_TYPES.includes(String(e.event_type||'').toLowerCase()));
  const result=await original.apply(this,arguments);
  if(preserve.length){
   const {error:restoreError}=await db.from('match_events').insert(preserve.map(e=>({match_id:e.match_id,player_id:e.player_id,event_type:e.event_type,minute:e.minute,description:e.description})));
   if(restoreError)console.error('AFRN event restore failed:',restoreError.message);
  }
  return result;
 };
 wrapped.__afrnProtected=true;window.saveLineups=wrapped;
}
let tries=0;const timer=setInterval(()=>{protect();if(++tries>40)clearInterval(timer)},250);
})();