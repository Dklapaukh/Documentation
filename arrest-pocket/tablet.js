/* Tablet adapter: Pocket Resus engine/forms stay intact; contextual content lives
 * beside the persistent Live dashboard. All CSS and globals are isolated in frame.
 */
let railOpen=true,railTab='guidance',railDetail=null;
const originalRender=render,originalSheet=sheet;
const rail=document.createElement('aside');rail.id='contextRail';rail.setAttribute('aria-label','Arrest sidebar');document.body.insertBefore(rail,document.querySelector('.bottom-nav'));
const notes=document.createElement('button');notes.id='returnNotes';notes.textContent='Notes ↗';notes.onclick=()=>parent.postMessage({type:'notes-arrest-close'},location.origin);document.querySelector('.top-actions').append(notes);
const arrow=document.createElement('button');arrow.id='railToggle';arrow.textContent='›';arrow.setAttribute('aria-label','Close arrest sidebar');arrow.onclick=()=>{railOpen=!railOpen;renderRail();};document.querySelector('.top-actions').prepend(arrow);
function showRail(tab,detail=null){railTab=tab;railDetail=detail;railOpen=true;renderRail();}
function renderRail(){
 document.body.classList.toggle('rail-open',railOpen);rail.hidden=!railOpen;arrow.textContent=railOpen?'›':'‹';arrow.setAttribute('aria-label',(railOpen?'Close':'Open')+' arrest sidebar');arrow.setAttribute('aria-expanded',String(railOpen));
 const nav=`<nav aria-label="Arrest reference sections">${[['guidance','Guidance'],['log','Action log'],['guidelines','Guidelines'],['checks','Checklists']].map(([id,label])=>`<button data-rail-tab="${id}" aria-pressed="${id===railTab}">${label}</button>`).join('')}</nav>`;
 let content=railDetail?`<button data-rail-back>← Back</button><h2>${esc(railDetail.title)}</h2>${railDetail.content}`:railTab==='log'?logView():railTab==='checks'?`<div class="rail-checklists">${ARREST_CHECKLISTS.map(x=>`<button data-open-check="${x.id}">${x.label}</button>`).join('')}</div>${checksView()}`:railTab==='guidelines'?`<h2>Guidelines</h2><button class="primary" data-reference="rsi">RSI drug doses · ${esc(s.weight||'enter')} kg</button>${[['Cardiac arrest','../cpg-cardiac-arrest.pdf'],['Post ROSC','../cpg-post-rosc.pdf'],['Adrenaline','../cpg-drugs/eas-14-3.pdf'],['Amiodarone','../cpg-drugs/eas-14-4.pdf'],['Paediatric equipment & doses','../cpg-paediatric-equipment.pdf'],['RSI','../cpg-rsi.pdf']].map(([label,pdf])=>`<button data-rail-pdf="${pdf}" data-title="${label}">${label}</button>`).join('')}`:guidanceGrid();
 rail.innerHTML=nav+`<div class="rail-content">${content}<p id="railError" class="error" role="alert" hidden></p></div>`;
}
render=function(){
 if(tab!=='live'){railTab=tab;railDetail=null;railOpen=true;}
 tab='live';originalRender();renderRail();
};
sheet=function(title,content,context=null){
 const reference=/reference|Tube sizes|Guidance|Cycle log/i.test(title)||CAUSES.some(c=>c.name===title);
 if(reference){sheetContext=context;showRail(/Cycle log/i.test(title)?'log':/RSI|Tube sizes/i.test(title)?'guidelines':'guidance',{title,content});return;}
 originalSheet(title,content,context);
};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.railTab)showRail(b.dataset.railTab);if(b.hasAttribute('data-rail-back')){railDetail=null;renderRail();}if(b.dataset.railPdf)showRail('guidelines',{title:b.dataset.title,content:`<object class="rail-pdf" type="application/pdf" data="${b.dataset.railPdf}"></object><a target="_blank" rel="noopener" href="${b.dataset.railPdf}">Open separately ↗</a>`});},true);
window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='notes-arrest-init')return;s=e.data.session||R.fresh();window.notesArrestReady=true;tab='live';closeSheet();save();render();});
parent.postMessage({type:'notes-arrest-ready'},location.origin);
render();

error=function(message){const el=$('sheet').open?$('sheetError'):$('railError');if(el){el.hidden=false;el.textContent=message;}};
