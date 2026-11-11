(()=>{
'use strict';
if(window.__AFRN_REPORT_PDF__)return;
window.__AFRN_REPORT_PDF__=true;

const loadScript=src=>new Promise((resolve,reject)=>{
 const s=document.createElement('script');
 s.src=src;s.async=true;
 s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load '+src));
 document.head.appendChild(s);
});
const loadAny=async urls=>{
 for(const u of urls){try{await loadScript(u);return}catch(e){console.warn(e)}}
 throw new Error('PDF libraries could not be loaded');
};
const safeName=v=>String(v||'AFRN-Official-Report').replace(/[^a-z0-9_-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
const getRoot=()=>document.querySelector('#reportContainer .report')||document.querySelector('#competitionReport .report')||document.querySelector('.report');
const documentNo=()=>{
 const heading=document.querySelector('#reportContainer .report h2,#competitionReport .report h2');
 const name=heading?.textContent||document.querySelector('#reportContainer .report .team-report-name')?.textContent||'AFRN-Official-Report';
 return safeName('AFRN-'+name+'-'+new Date().getFullYear());
};
const waitForImages=async root=>{
 const imgs=[...root.querySelectorAll('img')];
 await Promise.all(imgs.map(img=>new Promise(resolve=>{
  if(img.complete)return resolve();
  img.addEventListener('load',resolve,{once:true});
  img.addEventListener('error',resolve,{once:true});
  setTimeout(resolve,4000);
 })));
};

async function exportPDF(){
 const root=getRoot();
 if(!root){alert('⚠️ Fungua ripoti kwanza.');return}
 // Open a tab immediately during the user's tap so Android/Chrome does not block the PDF preview.
 let preview=null;
 try{preview=window.open('about:blank','_blank');if(preview)preview.document.write('<title>AFRN PDF</title><p style="font-family:Arial;padding:24px">Inaandaa PDF ya AFRN, tafadhali subiri...</p>')}catch(e){preview=null}
 const btn=document.activeElement;
 const oldText=btn?.textContent;
 if(btn){btn.disabled=true;btn.textContent='⏳ Inaandaa PDF...'}
 let clone=null;
 try{
  if(!window.html2canvas)await loadAny([
   'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
   'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
  ]);
  if(!window.jspdf)await loadAny([
   'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
   'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
  ]);
  clone=root.cloneNode(true);
  clone.querySelectorAll('.toolbar,.actions,button').forEach(x=>x.remove());
  Object.assign(clone.style,{background:'#fff',padding:'24px',display:'block',position:'absolute',left:'-100000px',top:'0',width:'900px',maxWidth:'900px',boxShadow:'none'});
  document.body.appendChild(clone);
  await waitForImages(clone);
  const canvas=await window.html2canvas(clone,{scale:2,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false,imageTimeout:10000});
  const jsPDF=window.jspdf?.jsPDF;
  if(!jsPDF)throw new Error('Maktaba ya jsPDF haijapatikana');
  const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const margin=10,usableW=190,pxPerMm=canvas.width/usableW,pagePx=Math.floor(277*pxPerMm);
  let y=0,page=0;
  while(y<canvas.height){
   if(page>0)pdf.addPage();
   const h=Math.min(pagePx,canvas.height-y),slice=document.createElement('canvas');
   slice.width=canvas.width;slice.height=h;
   const ctx=slice.getContext('2d');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,slice.width,slice.height);
   ctx.drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);
   pdf.addImage(slice.toDataURL('image/jpeg',0.94),'JPEG',margin,margin,usableW,h/pxPerMm);
   y+=h;page++;
  }
  const total=pdf.getNumberOfPages();
  for(let p=1;p<=total;p++){
   pdf.setPage(p);pdf.setFontSize(7);pdf.setTextColor(100);
   pdf.text('AFRN FOOTBALL MANAGEMENT — Official Document • Page '+p+'/'+total,105,291,{align:'center'});
  }
  const blob=pdf.output('blob');
  const url=URL.createObjectURL(blob);
  if(preview&&!preview.closed){
   preview.location.href=url;
   // The PDF viewer provides the user's own Save/Download control.
  }else{
   const a=document.createElement('a');a.href=url;a.download=documentNo()+'.pdf';
   document.body.appendChild(a);a.click();a.remove();
   alert('PDF imetengenezwa. Kichupo cha kuonyesha PDF kimezuiwa na kivinjari, hivyo faili limepelekwa kwenye vipakuliwa.');
  }
 }catch(e){
  console.error('AFRN PDF error',e);
  try{if(preview&&!preview.closed)preview.close()}catch(_){}
  alert('PDF haikuweza kutengenezwa: '+(e?.message||e)+'. Angalia intaneti kisha jaribu tena.');
 }finally{
  if(clone)clone.remove();
  if(btn){btn.disabled=false;btn.textContent=oldText||'📥 PDF Halisi'}
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