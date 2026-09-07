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

const getRoot=()=>document.querySelector('#reportContainer .report')||document.querySelector('#competitionReport .report')||document.querySelector('#reportPanel .report')||document.querySelector('.report');

const documentNo=()=>{
 const meta=[...document.querySelectorAll('#reportContainer .official-meta div,#competitionReport .official-meta div')].map(x=>x.textContent.trim()).join(' ');
 const m=meta.match(/DOCUMENT NO\.\s*([^ ]+)/i);
 if(m)return m[1];
 const heading=document.querySelector('#reportContainer .report h2,#competitionReport .report h2');
 const name=heading?.textContent||'';
 return name?`AFRN-${name}-${new Date().getFullYear()}`:`AFRN-Official-Report-${new Date().getFullYear()}`;
};

const waitForImages=async root=>{
 const imgs=[...root.querySelectorAll('img')];
 await Promise.all(imgs.map(img=>new Promise(resolve=>{
  if(img.complete)return resolve();
  img.addEventListener('load',resolve,{once:true});
  img.addEventListener('error',resolve,{once:true});
  setTimeout(resolve,2500);
 })));
};

async function exportPDF(){
 let root=getRoot();
 if(!root){alert('⚠️ Fungua ripoti kwanza.');return}
 const btn=document.activeElement;
 if(btn)btn.disabled=true;
 let clone=null;
 try{
  if(!window.html2canvas){
   await loadAny([
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
   ]);
  }
  if(!window.jspdf){
   await loadAny([
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
    'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
   ]);
  }

  clone=root.cloneNode(true);
  clone.querySelectorAll('.toolbar,.actions,button').forEach(x=>x.remove());
  clone.style.background='#fff';
  clone.style.padding='24px';
  clone.style.display='block';
  clone.style.position='absolute';
  clone.style.left='-100000px';
  clone.style.top='0';
  clone.style.width='900px';
  clone.style.maxWidth='900px';
  clone.style.boxShadow='none';
  document.body.appendChild(clone);
  await waitForImages(clone);

  const canvas=await html2canvas(clone,{
   scale:2,
   useCORS:true,
   allowTaint:false,
   backgroundColor:'#ffffff',
   logging:false,
   imageTimeout:10000
  });

  const jspdfNS=window.jspdf;
  if(!jspdfNS||!jspdfNS.jsPDF)throw new Error('jsPDF haijapatikana');
  const {jsPDF}=jspdfNS;
  const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const pageW=210,pageH=297,margin=10,usableW=pageW-margin*2;
  const pxPerMm=canvas.width/usableW;
  const pagePx=Math.floor((pageH-margin*2)*pxPerMm);
  let y=0,page=0;

  while(y<canvas.height){
   if(page>0)pdf.addPage();
   const h=Math.min(pagePx,canvas.height-y);
   const slice=document.createElement('canvas');
   slice.width=canvas.width;slice.height=h;
   const ctx=slice.getContext('2d');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,slice.width,slice.height);
   ctx.drawImage(canvas,0,y,canvas.width,h,0,0,canvas.width,h);
   pdf.addImage(slice.toDataURL('image/jpeg',0.94),'JPEG',margin,margin,usableW,h/pxPerMm);
   y+=h;page++;
  }

  // Official AFRN footer on every generated PDF page.
  const total=pdf.getNumberOfPages();
  for(let p=1;p<=total;p++){
   pdf.setPage(p);
   pdf.setFontSize(7);
   pdf.setTextColor(100);
   pdf.text(`AFRN FOOTBALL MANAGEMENT — Official Document • Page ${p}/${total}`,105,291,{align:'center'});
  }

  pdf.save(`${safeName(documentNo())}.pdf`);
 }catch(e){
  console.error('AFRN PDF error',e);
  alert('❌ PDF Halisi imeshindwa kutengenezwa. Hakikisha internet ipo, kisha jaribu tena.');
 }finally{
  if(clone)clone.remove();
  if(btn)btn.disabled=false;
 }
}

window.exportAFRNReportPDF=exportPDF;

const wire=()=>document.querySelectorAll('[data-afrn-pdf]').forEach(b=>{
 if(b.dataset.pdfWired)return;
 b.dataset.pdfWired='1';
 b.addEventListener('click',exportPDF);
});

if(document.body)new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
