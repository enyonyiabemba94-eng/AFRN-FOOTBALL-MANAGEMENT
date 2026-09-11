/* AFRN Period Breakdown v1 */
(function(){
'use strict';
if(window.__AFRN_PERIOD_BREAKDOWN_V1__) return;
window.__AFRN_PERIOD_BREAKDOWN_V1__=true;
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const $=(s,r=document)=>r.querySelector(s);
function client(){return window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));}
async function run(){const panel=$('#afrnPenaltyPanel');if(!panel)return;const ids=[...panel.querySelectorAll('[data-period],[data-extra],[data-pen]')].map(x=>x.dataset.period||x.dataset.extra||x.dataset.pen).filter(Boolean);if(!ids.length)return;const db=client();const r=await db.from('matches').select('id,first_half_home,first_half_away,second_half_home,second_half_away,home_score,away_score,extra_time_home,extra_time_away,home_penalties,away_penalties').in('id',ids);if(r.error)return;for(const m of r.data||[]){const b=panel.querySelector(`[data-period="${m.id}"],[data-extra="${m.id}"],[data-pen="${m.id}"]`);const row=b?.closest('div[style*="border-top"]');const out=row?.querySelector('.ce-muted');if(!out)continue;let text=`Kipindi cha 1: ${m.first_half_home??'—'}–${m.first_half_away??'—'} | Kipindi cha 2: ${m.second_half_home??'—'}–${m.second_half_away??'—'} | Dakika 90: ${m.home_score??'—'}–${m.away_score??'—'}`;if(m.extra_time_home!=null)text+=` | Extra Time: ${m.extra_time_home}–${m.extra_time_away}`;if(m.home_penalties!=null)text+=` | Penalty: ${m.home_penalties}–${m.away_penalties}`;out.textContent=text;}}
let t;const boot=()=>{clearTimeout(t);t=setTimeout(run,1200)};new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();