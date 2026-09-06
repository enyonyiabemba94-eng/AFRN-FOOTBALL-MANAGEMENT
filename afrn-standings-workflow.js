(()=>{
'use strict';
if(window.__AFRN_STANDINGS_WORKFLOW__)return;
window.__AFRN_STANDINGS_WORKFLOW__=true;
const db=window.supabaseClient;
if(!db||typeof db.from!=='function')return;

const FINAL=['finished','completed','full time','ft'];
const norm=v=>String(v||'').trim().toLowerCase();
const isFinal=v=>FINAL.includes(norm(v));

async function syncCompetition(competitionId){
  if(!competitionId)return;
  try{
    const [{data:teams,error:te}, {data:games,error:me}]=await Promise.all([
      db.from('competition_teams').select('club_id,group_name').eq('competition_id',competitionId),
      db.from('matches').select('id,home_team_id,away_team_id,home_score,away_score,status').eq('competition_id',competitionId)
    ]);
    if(te)throw te;if(me)throw me;
    const rows=teams||[];
    const finalGames=(games||[]).filter(m=>isFinal(m.status)&&m.home_team_id&&m.away_team_id&&m.home_score!=null&&m.away_score!=null);
    const stats=new Map();
    rows.forEach(t=>stats.set(String(t.club_id),{club_id:t.club_id,group_name:t.group_name||null,played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,points:0}));
    finalGames.forEach(m=>{
      const h=String(m.home_team_id),a=String(m.away_team_id),hs=Number(m.home_score)||0,as=Number(m.away_score)||0;
      if(!stats.has(h))stats.set(h,{club_id:m.home_team_id,group_name:null,played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,points:0});
      if(!stats.has(a))stats.set(a,{club_id:m.away_team_id,group_name:null,played:0,wins:0,draws:0,losses:0,goals_for:0,goals_against:0,points:0});
      const H=stats.get(h),A=stats.get(a);
      H.played++;A.played++;H.goals_for+=hs;H.goals_against+=as;A.goals_for+=as;A.goals_against+=hs;
      if(hs>as){H.wins++;H.points+=3;A.losses++;}else if(hs<as){A.wins++;A.points+=3;H.losses++;}else{H.draws++;A.draws++;H.points++;A.points++;}
    });

    // Preserve existing standings row IDs; update existing rows and insert only missing club rows.
    const {data:existing,error:ee}=await db.from('standings').select('id,club_id,competition_id').eq('competition_id',competitionId);
    if(ee)throw ee;
    const existingByClub=new Map((existing||[]).map(r=>[String(r.club_id),r]));
    for(const s of stats.values()){
      const payload={group_name:s.group_name,played:s.played,wins:s.wins,draws:s.draws,losses:s.losses,goals_for:s.goals_for,goals_against:s.goals_against,points:s.points};
      const old=existingByClub.get(String(s.club_id));
      const result=old
        ? await db.from('standings').update(payload).eq('id',old.id)
        : await db.from('standings').insert({...payload,competition_id:competitionId,club_id:s.club_id});
      if(result.error)throw result.error;
    }
    return true;
  }catch(e){console.warn('AFRN standings sync:',e.message);return false;}
}

async function syncFromMatch(match){
  if(match&&match.competition_id)await syncCompetition(match.competition_id);
}

window.AFRNStandings={syncCompetition,syncFromMatch};

function hook(){
  if(!location.pathname.toLowerCase().endsWith('/matches.html')&&!location.pathname.toLowerCase().endsWith('matches.html'))return;
  const original=window.saveMatch;
  if(typeof original==='function'&& !original.__afrnWrapped){
    const wrapped=async function(){
      const before=window.currentMatchId;
      const result=await original.apply(this,arguments);
      const id=window.currentMatchId||before;
      const match=(window.matches||[]).find(m=>String(m.id)===String(id));
      if(match&&isFinal(match.status))await syncFromMatch(match);
      else if(id){const {data}=await db.from('matches').select('competition_id,status').eq('id',id).maybeSingle();if(data&&isFinal(data.status))await syncFromMatch(data);}
      return result;
    };
    wrapped.__afrnWrapped=true;window.saveMatch=wrapped;
  }
}
setTimeout(hook,0);setTimeout(hook,800);setTimeout(hook,2000);
const channel=db.channel('afrn-standings-sync').on('postgres_changes',{event:'*',schema:'public',table:'matches'},payload=>{if(payload.new&&payload.new.competition_id)syncFromMatch(payload.new);});channel.subscribe();
})();
