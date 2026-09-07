(()=>{
'use strict';
if(window.__AFRN_REPORT_PDF__)return;
window.__AFRN_REPORT_PDF__=true;
const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
const safeName=v=>String(v||'AFRN-Official-Report').replace(/[^a-z0-9_-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
const getRoot=()=>document.querySelector('#reportContainer .report')||document.querySelector('#transferPanel');
const documentNo=()=>{const meta=[...document.querySelectorAll('#reportContainer .official-meta div')].map(x=>x.textContent.trim()).join(' ');const m=meta.match(/DOCUMENT NO\.\s*([^ ]+)/);if(m)return m[1];const rows=document.querySelectorAll('#transferTable tr');return rows.length?`TR-${new Date().getFullYear()}-REPORT`:'AFRN-Official-Report'};
async function exportPDF(){
 let root=getRoot();
 if(!root){alert('⚠️ Fungua ripoti kwanza.');return}
 const btn=document.activeElement;if(btn)btn.disabled=true;let clone=null;
 try{
  if(!window.html2canvas)await load('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  if(!window.jspdf)await load('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
  if(root.id==='transferPanel'){
   clone=root.cloneNode(true);clone.querySelectorAll('.toolbar').forEach(x=>x.remove());clone.style.background='#fff';clone.style.padding='20px';clone.style.display='block';clone.style.position='absolute';clone.style.left='-100000px';clone.style.top='0';clone.style.width='1100px';document.body.appendChild(clone);root=clone;
  }
  const canvas=await html2canvas(root,{scale:2,useCORS:true,backgroundColor:'#ffffff',logging:false});
  const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});const pageW=210,pageH=297,margin=10,usableW=pageW-margin*2,pxPerMm=canvas.width/usableW,pagePx=Math.floor((pageH-margin*2)*pxPerMm);let y=0,page=0;
  while(y<canvas.height){if(page>0)pdf.addPage();const h=Math.min(pagePx,canvas.height-y);const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=h;slice.getContext('2d').drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);pdf.addImage(slice.toDataURL('image/jpeg',0.94),'JPEG',margin,margin,usableW,h/pxPerMm);y+=h;page++;}
  pdf.save(`${safeName(documentNo())}.pdf`);
 }catch(e){console.error(e);alert('❌ PDF haikuweza kutengenezwa. Jaribu tena.')}finally{if(clone)clone.remove();if(btn)btn.disabled=false}
}
window.exportAFRNReportPDF=exportPDF;
const wire=()=>document.querySelectorAll('[data-afrn-pdf]').forEach(b=>{if(b.dataset.pdfWired)return;b.dataset.pdfWired='1';b.addEventListener('click',exportPDF)});
new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});wire();
})();