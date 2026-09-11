/* AFRN Extra Time Setting v1
   Stores whether a competition uses extra time before penalties.
*/
(function(){
'use strict';
if(window.__AFRN_EXTRA_TIME_SETTING_V1__) return;
window.__AFRN_EXTRA_TIME_SETTING_V1__=true;
const URL='https://jjqhvruppafpumcthmwe.supabase.co';
const KEY='sb_publishable_02hhRG8bgDOqSFxva8IMvQ_zWTLMa3G';
const $=(s,r=document)=>r.querySelector(s);
function client(){return window.supabaseClient||(window.supabase&&window.supabase.createClient(URL,KEY));}
function cid(){return $('#teamCompetitionId')?.value||$('#generatorCompetitionId')?.value||[...document.querySelectorAll('option')].find(o=>/UPENDO WA WAKIMBIZI/i.test(o.textContent||''))?.value||null;}
let db,compId,enabled=false;
async function load(){compId=cid();if(!compId)return false;db=client();const r=await db.from('competitions').select('id,name,knockout_extra_time').eq('id',compId).maybeSingle();if(r.error)throw r.error;enabled=!!r.data?.knockout_extra_time;window.__AFRN_EXTRA_TIME_ENABLED__=enabled;return true;}
function apply(){const panel=$('#afrnPenaltyPanel');if(!panel)return;panel.querySelectorAll('[data-extra]').forEach(b=>b.style.display=enabled?'inline-block':'none');panel.querySelectorAll('[data-pen]').forEach(b=>{const row=b.closest('div[style*="border-top"]');const tied=!!row?.querySelector('[data-extra]');if(enabled&&tied)b.style.display='none';else b.style.display='inline-block';});let box=$('#afrnExtraTimeSetting');if(!box){box=document.createElement('div');box.id='afrnExtraTimeSetting';box.className='ce-card';panel.parentNode.insertBefore(box,panel);}box.innerHTML=`<h3>⏱️ SHERIA YA EXTRA TIME</h3><label style="display:flex;gap:8px;align-items:center;font-weight:bold"><input type="checkbox" id="afrnETToggle" ${enabled?'checked':''}> Competition hii itumie Extra Time baada ya dakika 90 ikiwa sare</label><p class="ce-muted">Ikiwa imewashwa: 90′ → Extra Time (hadi 120′) → Penalty ikiwa bado sare. Ikiwa imezimwa: 90′ → Penalty.</p>`;$('#afrnETToggle',box).onchange=async e=>{const v=!!e.target.checked;const r=await db.from('competitions').update({knockout_extra_time:v}).eq('id',compId);if(r.error){e.target.checked=enabled;return alert('❌ '+r.error.message);}enabled=v;window.__AFRN_EXTRA_TIME_ENABLED__=v;apply();};}
async function run(){try{if(await load())apply();}catch(e){console.error('AFRN extra time setting',e);}}
let timer=0;const boot=()=>{clearTimeout(timer);timer=setTimeout(run,900);};new MutationObserver(()=>{if($('#afrnPenaltyPanel'))apply();}).observe(document.body,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();