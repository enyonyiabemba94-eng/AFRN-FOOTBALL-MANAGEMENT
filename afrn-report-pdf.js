(()=>{
'use strict';
if(window.__AFRN_REPORT_PDF__)return;
window.__AFRN_REPORT_PDF__=true;
function exportPDF(){
 const panel=document.getElementById('reportPanel');
 const root=document.querySelector('#reportContainer article.report')||document.querySelector('#reportContainer .report')||document.querySelector('#competitionReport .report')||document.querySelector('.report');
 if(!root||!panel||!root.textContent.trim()){alert('⚠️ Fungua ripoti kwanza, kisha ujaribu tena.');return}
 // Use the current page's native Android print preview. This avoids blank pop-up tabs,
 // blocked document.write calls, CDN dependencies, and cross-origin image canvas issues.
 const wasHidden=panel.classList.contains('hidden');
 panel.classList.remove('hidden');
 document.body.classList.add('afrn-print-mode');
 let style=document.getElementById('afrn-print-only-style');
 if(!style){
  style=document.createElement('style');style.id='afrn-print-only-style';
  style.textContent='@media print{html,body{background:#fff!important;margin:0!important;padding:0!important}body.afrn-print-mode>header,body.afrn-print-mode>nav,body.afrn-print-mode main>#status,body.afrn-print-mode main>.cards,body.afrn-print-mode main>.tabs,body.afrn-print-mode main>.panel:not(#reportPanel){display:none!important}body.afrn-print-mode main{display:block!important;max-width:none!important;margin:0!important;padding:0!important}body.afrn-print-mode #reportPanel{display:block!important;visibility:visible!important;margin:0!important;padding:0!important}body.afrn-print-mode #reportContainer,body.afrn-print-mode #reportContainer .report{display:block!important;visibility:visible!important;opacity:1!important;background:#fff!important;color:#172033!important;box-shadow:none!important;width:100%!important;max-width:none!important;margin:0!important;padding:8mm!important}body.afrn-print-mode .team-report-head{display:grid!important;grid-template-columns:76px 1fr 76px!important}body.afrn-print-mode .team-report-summary{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important}body.afrn-print-mode .team-match{display:grid!important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important;break-inside:avoid;page-break-inside:avoid}body.afrn-print-mode .team-match-side{display:flex!important;flex-direction:row!important}body.afrn-print-mode .signature{display:grid!important;grid-template-columns:1fr 1fr!important;break-inside:avoid}body.afrn-print-mode .section-title{background:#071a33!important;color:#fff!important}body.afrn-print-mode img{display:inline-block!important;max-width:100%!important;object-fit:contain!important}body.afrn-print-mode .actions,body.afrn-print-mode button{display:none!important}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{size:A4;margin:10mm}}';
  document.head.appendChild(style);
 }
 const cleanup=()=>{document.body.classList.remove('afrn-print-mode');if(wasHidden)panel.classList.add('hidden');window.removeEventListener('afterprint',cleanup)};
 window.addEventListener('afterprint',cleanup);
 // Small delay lets Android apply the print-only stylesheet before opening its preview.
 setTimeout(()=>{try{window.print()}catch(e){cleanup();alert('Imeshindwa kufungua Print Preview: '+e.message)}},250);
}
window.exportAFRNReportPDF=exportPDF;
const wire=()=>document.querySelectorAll('[data-afrn-pdf]').forEach(b=>{if(b.dataset.pdfWired)return;b.dataset.pdfWired='1';b.addEventListener('click',exportPDF)});
if(document.body)new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();