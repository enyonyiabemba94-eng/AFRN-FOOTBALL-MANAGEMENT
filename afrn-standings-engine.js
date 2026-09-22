/* AFRN Competition/League standings engine — one rule everywhere */
(function(){
  const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,'_');
  function playedStatus(s){ return ['completed','finished','played','full_time','ft'].includes(norm(s)); }
  function buildStandings({teams=[],matches=[],events=[],clubName=()=>'',groupFilter=null}={}){
    const rows=teams.filter(t=>!groupFilter||String(t.group_name||'')===String(groupFilter)).map(t=>({
      club_id:t.club_id, group:t.group_name||'', name:clubName(t.club_id),
      P:0,W:0,D:0,L:0,GF:0,GA:0,PTS:0,RC:0,YC:0,
      coin_toss_rank:Number(t.coin_toss_rank)||2147483647
    }));
    const map=new Map(rows.map(r=>[String(r.club_id),r]));
    for(const m of matches){
      if(!playedStatus(m.status)) continue;
      const h=map.get(String(m.home_team_id)), a=map.get(String(m.away_team_id));
      if(!h||!a) continue;
      const hs=Number(m.home_score)||0, as=Number(m.away_score)||0;
      h.P++;a.P++;h.GF+=hs;h.GA+=as;a.GF+=as;a.GA+=hs;
      if(hs>as){h.W++;a.L++;h.PTS+=3}
      else if(hs<as){a.W++;h.L++;a.PTS+=3}
      else {h.D++;a.D++;h.PTS++;a.PTS++}
    }
    const eventMap=new Map();
    for(const e of events){
      const r=eventMap.get(String(e.match_id))||[];r.push(e);eventMap.set(String(e.match_id),r);
    }
    for(const m of matches){
      if(!playedStatus(m.status)) continue;
      for(const e of (eventMap.get(String(m.id))||[])){
        const row=map.get(String(e.club_id)); if(!row) continue;
        const t=norm(e.event_type);
        if(['yellow_card','yellow','yc','second_yellow','secondyellow'].includes(t)) row.YC++;
        if(['red_card','red','rc','second_yellow','secondyellow'].includes(t)) row.RC++;
      }
    }
    rows.sort((a,b)=>
      (b.PTS-a.PTS) ||
      (b.GF-a.GF) ||
      (a.GA-b.GA) ||
      (a.RC-b.RC) ||
      (a.YC-b.YC) ||
      (a.coin_toss_rank-b.coin_toss_rank)
    );
    return rows;
  }
  window.AFRNStandings={buildStandings,playedStatus};
})();