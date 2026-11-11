(()=>{
'use strict';
if(window.__AFRN_REPORT_PDF__)return;
window.__AFRN_REPORT_PDF__=true;
const getRoot=()=>document.querySelector('#reportContainer .report')||document.querySelector('#competitionReport .report')||document.querySelector('.report');
const safeName=v=>String(v||'AFRN-Official-Report').replace(/[^a-z0-9_-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
const documentName=()=>{
 const team=document.querySelector('#reportContainer .team-report-name')?.textContent;
 const heading=document.querySelector('#reportContainer .report h2,#competitionReport .report h2')?.textContent;
 return safeName('AFRN-'+(team||heading||'Official-Report')+'-'+new Date().getFullYear());
};
async function exportPDF(){
 const root=getRoot();
 if(!root){alert('⚠️ Fungua ripoti kwanza.');return}
 let preview=null;
 try{
  // Open synchronously from the user's tap; no external PDF libraries or network downloads are needed.
  preview=window.open('about:blank','_blank');
  if(!preview){alert('Kivinjari kimezuia dirisha jipya. Ruhusu pop-ups kwa tovuti ya AFRN kisha ujaribu tena.');return}
  const btn=document.activeElement,oldText=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent='⏳ Inaandaa PDF...'}
  const clone=root.cloneNode(true);
  clone.querySelectorAll('.toolbar,.actions,button').forEach(x=>x.remove());
  clone.querySelectorAll('img').forEach(img=>{
   const src=img.getAttribute('src');
   if(src){try{img.src=new URL(src,document.baseURI).href}catch(e){}}
  });
  const styles=[...document.querySelectorAll('style')].map(s=>s.innerHTML).join('\n');
  const title=documentName();
  preview.document.open();
  preview.document.write('<!doctype html><html lang="sw"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>'+styles+'\n'+
   'body{background:#fff!important;margin:0;padding:12px!important}.report{display:block!important;max-width:100%!important;width:100%!important;margin:0 auto!important;box-shadow:none!important;padding:14px!important}.hidden{display:none!important}header,nav,.status,.toolbar,.tabs,.cards,.actions{display:none!important}@page{size:A4;margin:12mm}@media print{body{padding:0!important}.report{padding:0!important}.team-match,.kpi,.signature{break-inside:avoid;page-break-inside:avoid}img{max-width:100%;-webkit-print-color-adjust:exact;print-color-adjust:exact}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'+
   '</style></head><body>'+clone.outerHTML+'</body></html>');
  preview.document.close();
  const images=[...preview.document.images];
  await Promise.race([
   Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve}))),
   new Promise(resolve=>setTimeout(resolve,5000))
  ]);
  if(btn){btn.disabled=false;btn.textContent=oldText||'📥 PDF Halisi'}
  preview.focus();
  setTimeout(()=>{try{preview.print()}catch(e){console.warn('Print preview',e)}},500);
 }catch(e){
  console.error('AFRN PDF preview error',e);
  try{if(preview&&!preview.closed)preview.close()}catch(_){}
  alert('Imeshindwa kufungua PDF/Print Preview: '+(e?.message||e));
  const btn=document.activeElement;if(btn)btn.disabled=false;
 }
}
window.exportAFRNReportPDF=exportPDF;
const wire=()=>document.querySelectorAll('[data-afrn-pdf]').forEach(b=>{
 if(b.dataset.pdfWired)return;
 b.dataset.pdfWired='1';b.addEventListener('click',exportPDF);
});
if(document.body)new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();