(()=>{
'use strict';
if(window.__AFRN_REPORT_PDF__)return;
window.__AFRN_REPORT_PDF__=true;
const getRoot=()=>document.querySelector('#reportContainer article.report')||document.querySelector('#reportContainer .report')||document.querySelector('#competitionReport .report')||document.querySelector('.report');
const safeName=v=>String(v||'AFRN-Official-Report').replace(/[^a-z0-9_-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
async function exportPDF(){
 const root=getRoot();
 if(!root){alert('⚠️ Fungua ripoti kwanza.');return}
 let preview=null,btn=document.activeElement,oldText=btn?.textContent;
 try{
  preview=window.open('about:blank','_blank');
  if(!preview){alert('Kivinjari kimezuia dirisha jipya. Ruhusu pop-ups kwa tovuti ya AFRN.');return}
  if(btn){btn.disabled=true;btn.textContent='⏳ Inafungua ripoti...'}
  const clone=root.cloneNode(true);
  clone.classList.remove('hidden');
  clone.style.cssText+=';display:block!important;visibility:visible!important;opacity:1!important;background:#fff;color:#172033;width:100%;max-width:100%;box-shadow:none;margin:0;padding:16px';
  clone.querySelectorAll('.toolbar,.actions,button').forEach(x=>x.remove());
  clone.querySelectorAll('[style]').forEach(el=>{el.style.visibility='visible';el.style.opacity='1'});
  clone.querySelectorAll('img').forEach(img=>{
   const src=img.getAttribute('src');
   if(src){try{img.setAttribute('src',new URL(src,document.baseURI).href)}catch(e){}}
   img.style.display='inline-block';
  });
  const style=[...document.querySelectorAll('style')].map(x=>x.textContent).join('\n');
  const title=safeName('AFRN-'+(root.querySelector('.team-report-name')?.textContent||'Official-Report')+'-'+new Date().getFullYear());
  const html='<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>'+style+'\n'+
   'html,body{background:#fff!important;color:#172033!important;margin:0!important;padding:0!important;font-family:Arial,Helvetica,sans-serif!important}body{padding:12px!important}.report{display:block!important;visibility:visible!important;opacity:1!important;background:#fff!important;color:#172033!important;width:100%!important;max-width:100%!important;box-shadow:none!important;margin:0 auto!important;padding:16px!important}.hidden{display:none!important}.team-report-head,.team-report-name,.team-report-summary,.team-match,.section,.signature{display:grid!important;visibility:visible!important}.team-report-name{display:block!important}.team-report-head{grid-template-columns:76px 1fr 76px!important}.team-report-summary{grid-template-columns:repeat(4,minmax(0,1fr))!important}.team-match{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important}.team-match-side{display:flex!important;flex-direction:row!important}.team-match-meta{grid-column:1/-1!important}.section-title{display:block!important;background:#071a33!important;color:white!important;padding:10px!important}.signature{grid-template-columns:1fr 1fr!important;gap:25px!important;margin-top:35px!important}.kpi{display:block!important;background:#f6f8fb!important;padding:10px!important}img{max-width:100%;object-fit:contain}@media(max-width:520px){.team-report-head{grid-template-columns:48px 1fr 48px!important}.team-report-head img{width:44px!important;height:44px!important}.team-report-summary{grid-template-columns:1fr 1fr!important}.team-match-side{flex-direction:column!important}.team-match{gap:5px!important}}.preview-tools{position:sticky;top:0;background:#071a33;color:#fff;padding:10px;text-align:center;z-index:999}.preview-tools button{background:#f5b400;color:#111;padding:12px 20px;border:0;border-radius:8px;font-weight:bold}@page{size:A4;margin:12mm}@media print{body{padding:0!important}.preview-tools{display:none!important}.report{padding:0!important}.team-match,.kpi,.signature{break-inside:avoid;page-break-inside:avoid}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'+
   '</style></head><body><div class="preview-tools"><button onclick="window.print()">🖨️ CHAPISHA / HIFADHI KAMA PDF</button><div style="font-size:12px;margin-top:6px">Kagua ripoti kwanza; kuhifadhi ni hiari.</div></div>'+clone.outerHTML+'</body></html>';
  preview.document.open();preview.document.write(html);preview.document.close();
  preview.focus();
  if(btn){btn.disabled=false;btn.textContent=oldText||'📥 PDF Halisi'}
 }catch(e){
  console.error('AFRN PDF preview error',e);
  try{if(preview&&!preview.closed)preview.close()}catch(_){}
  alert('Imeshindwa kufungua ripoti: '+(e?.message||e));
  if(btn){btn.disabled=false;btn.textContent=oldText||'📥 PDF Halisi'}
 }
}
window.exportAFRNReportPDF=exportPDF;
const wire=()=>document.querySelectorAll('[data-afrn-pdf]').forEach(b=>{if(b.dataset.pdfWired)return;b.dataset.pdfWired='1';b.addEventListener('click',exportPDF)});
if(document.body)new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();