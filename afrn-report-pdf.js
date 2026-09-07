(()=>{
'use strict';
if(window.__AFRN_REPORT_PDF__)return;
window.__AFRN_REPORT_PDF__=true;
const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
const safeName=v=>String(v||'AFRN-Official-Report').replace(/[^a-z0-9_-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
async function exportPDF(){
 const root=document.querySelector('#reportContainer .report');
 if(!root){alert('⚠️ Fungua ripoti kwanza.');return}
 const btn=document.activeElement; if(btn)btn.disabled=true;
 try{
  if(!window.html2canvas)await load('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  if(!window.jspdf)await load('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
  const canvas=await html2canvas(root,{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false});
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const pageW=210,pageH=297,margin=10;
  const usableW=pageW-margin*2;
  const pxPerMm=canvas.width/usableW;
  const pagePx=Math.floor((pageH-margin*2)*pxPerMm);
  let y=0,page=0;
  while(y<canvas.height){
   if(page>0)pdf.addPage();
   const h=Math.min(pagePx,canvas.height-y);
   const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=h;
   slice.getContext('2d').drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);
   const img=slice.toDataURL('image/jpeg',0.94);
   const imgH=h/pxPerMm;
   pdf.addImage(img,'JPEG',margin,margin,usableW,imgH);
   y+=h;page++;
  }
  const title=root.querySelector('.report-head h2')?.textContent||'AFRN Official Report';
  const meta=[...root.querySelectorAll('.official-meta div')].map(x=>x.textContent.trim()).join(' ');
  const match=(meta.match(/DOCUMENT NO\.\s*([^ ]+)/)||[])[1]||'';
  pdf.save(`${safeName(match||title)}.pdf`);
 }catch(e){console.error(e);alert('❌ PDF haikuweza kutengenezwa. Jaribu tena.')}finally{if(btn)btn.disabled=false}
}
window.exportAFRNReportPDF=exportPDF;
const wire=()=>document.querySelectorAll('[data-afrn-pdf]').forEach(b=>{if(b.dataset.pdfWired)return;b.dataset.pdfWired='1';b.addEventListener('click',exportPDF)});
new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
wire();
})();