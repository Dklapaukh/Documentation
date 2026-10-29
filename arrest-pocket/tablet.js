/* Tablet adapter: Pocket Resus engine/forms stay intact; contextual content lives
 * beside the persistent Live dashboard. All CSS and globals are isolated in frame.
 */
let railOpen=true,railFull=false,railTab='guidance',railDetail=null,parkedEntry=false;
const originalRender=render,originalSheet=sheet;
const rail=document.createElement('aside');rail.id='contextRail';rail.setAttribute('aria-label','Arrest sidebar');document.body.insertBefore(rail,document.querySelector('.bottom-nav'));
const notes=document.createElement('button');notes.id='returnNotes';notes.textContent='Notes ↗';notes.onclick=()=>parent.postMessage({type:'notes-arrest-close'},location.origin);document.querySelector('.top-actions').append(notes);
const arrow=document.createElement('button');arrow.id='railToggle';arrow.textContent='›';arrow.setAttribute('aria-label','Close arrest sidebar');arrow.onclick=()=>{railOpen=!railOpen;if(!railOpen){railFull=false;restoreParkedEntry();}renderRail();};document.querySelector('.top-actions').prepend(arrow);
function showRail(tab,detail=null){railTab=tab;railDetail=detail;railOpen=true;renderRail();}
function restoreParkedEntry(){if(parkedEntry){parkedEntry=false;if(!$('sheet').open)$('sheet').showModal();}}
function renderRail(){
 document.body.classList.toggle('rail-full',railOpen&&railFull);
 document.body.classList.toggle('rail-open',railOpen);rail.hidden=!railOpen;arrow.textContent=railOpen?'›':'‹';arrow.setAttribute('aria-label',(railOpen?'Close':'Open')+' arrest sidebar');arrow.setAttribute('aria-expanded',String(railOpen));
 const nav=`<nav aria-label="Arrest reference sections">${[['guidance','Guidance'],['log','Action log'],['guidelines','Guidelines'],['checks','Checklists']].map(([id,label])=>`<button data-rail-tab="${id}" aria-pressed="${id===railTab}">${label}</button>`).join('')}</nav>`;
 let content=railDetail?`<button data-rail-back>← Back</button><h2>${esc(railDetail.title)}</h2>${railDetail.content}`:railTab==='log'?logView():railTab==='checks'?`<div class="rail-checklists">${ARREST_CHECKLISTS.map(x=>`<button data-open-check="${x.id}">${x.label}</button>`).join('')}</div>${checksView()}`:railTab==='guidelines'?`<h2>Guidelines</h2><button class="primary" data-reference="rsi">RSI drug doses · ${esc(s.weight||'enter')} kg</button>${[['Cardiac arrest','https://cpg.stjohn.org.nz/tabs/guidelines/cardiac-eas/page/cardiac-arrest-eas'],['Post ROSC','https://cpg.stjohn.org.nz/tabs/guidelines/cardiac-eas/page/treatment-following-rosc-eas'],['Adrenaline','https://cpg.stjohn.org.nz/tabs/medicines/page/adrenaline-eas'],['Amiodarone','https://cpg.stjohn.org.nz/tabs/medicines/page/amiodarone-eas'],['Paediatric equipment & doses','https://cpg.stjohn.org.nz/tabs/guidelines/paediatrics-eas/page/paediatric-equipment-and-drug-doses-eas'],['RSI','https://cpg.stjohn.org.nz/tabs/guidelines/intubation-and-ventilation/page/rsi-rapid-sequence-intubation-eas']].map(([label,pdf])=>`<button data-rail-pdf="${pdf}" data-title="${label}">${label}</button>`).join('')}`:guidanceGrid();
 rail.innerHTML=`<button class="rail-expand" data-rail-expand aria-label="${railFull?'Restore arrest sidebar':'Expand arrest sidebar to full screen'}" aria-expanded="${railFull}">${railFull?'→':'←'}</button>`+nav+`<div class="rail-content">${content}<p id="railError" class="error" role="alert" hidden></p></div>`;
 normalizeGuidelineReferences(rail);
 rail.querySelector('[data-rail-tab=checks]')?.classList.toggle('checklist-attention',R.checklistPrompt(s));
}
render=function(){
 if(tab!=='live'){railTab=tab;railDetail=null;railOpen=true;}
 tab='live';originalRender();renderRail();
};
sheet=function(title,content,context=null){
 const reference=/reference|Tube sizes|Guidance|Cycle log|administration/i.test(title)||CAUSES.some(c=>c.name===title);
 if(reference){if(!parkedEntry)sheetContext=context;showRail(/Cycle log/i.test(title)?'log':/RSI|Tube sizes/i.test(title)?'guidelines':'guidance',{title,content});return;}
 parkedEntry=false;originalSheet(title,content,context);
 if(!window.notesEquipmentMode)$('sheet').querySelector('.sheet-heading').insertAdjacentHTML('afterbegin','<button class="sheet-sidebar-arrow" data-sheet-sidebar aria-label="Open arrest sidebar">‹</button>');
};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-rail-expand')){railFull=!railFull;renderRail();return;}if(b.hasAttribute('data-sheet-sidebar')){parkedEntry=$('sheet').open;if(parkedEntry)$('sheet').close();railOpen=true;renderRail();return;}if(b.dataset.railTab)showRail(b.dataset.railTab);if(b.hasAttribute('data-rail-back')){railDetail=null;renderRail();}if(b.dataset.railPdf)showRail('guidelines',{title:b.dataset.title,content:`<object class="rail-pdf" type="application/pdf" data="${b.dataset.railPdf}"></object><a target="_blank" rel="noopener" href="${b.dataset.railPdf}">Open separately ↗</a>`});},true);
window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='notes-arrest-init')return;s=e.data.session||R.fresh();window.notesArrestReady=true;tab='live';parkedEntry=false;closeSheet();save();render();if(s.pendingRhythm)openRhythm(s.pendingRhythm.outcome);});
parent.postMessage({type:'notes-arrest-ready'},location.origin);
render();

error=function(message){const el=$('sheet').open?$('sheetError'):$('railError');if(el){el.hidden=false;el.textContent=message;}};
// The same equipment inputs can be used from Notes without starting an arrest.
const notesCloseSheet=closeSheet;
closeSheet=function(){const equipment=window.notesEquipmentMode;notesCloseSheet();if(equipment)parent.postMessage({type:'notes-equipment-close'},location.origin);};
window.addEventListener('message',e=>{
 if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='notes-equipment-init')return;
 window.notesEquipmentMode=true;window.notesArrestReady=false;s=R.fresh();document.body.classList.add('equipment-only');
 const entry=e.data.entry;
 if(entry){openEquipment(entry.procedure);sheetContext.at=Date.parse(entry.at);const form=$('equipmentForm'),data={...(entry.equipment||{})};if(data.side&&data.site)data.site=data.site.replace(/^(Left|Right) /,'');
  if(entry.procedure==='laryngoscopy'&&data.method){const method=form.querySelector('[name="method"][value="'+data.method+'"]');if(method){method.checked=true;method.dispatchEvent(new Event('change',{bubbles:true}));}}
  form.querySelectorAll('[name]').forEach(el=>{if(el.name==='at'){el.value=local(sheetContext.at).slice(11);return;}const value=data[el.name];if(['checkbox','radio'].includes(el.type))el.checked=Array.isArray(value)?value.includes(el.value):value===el.value;else if(value!==undefined)el.value=value;});
 }else if(e.data.group==='iv')openEquipment('iv');else openInterventions(e.data.group);
});
$('sheet').addEventListener('cancel',()=>{if(window.notesEquipmentMode)parent.postMessage({type:'notes-equipment-close'},location.origin);});

// Keep the tablet checklist tab in step with the live engine's amber prompt.
const tabletTick=tick;
tick=function(){tabletTick();rail.querySelector('[data-rail-tab=checks]')?.classList.toggle('checklist-attention',R.checklistPrompt(s));};

// One shared tutorial covers Notes and the distinct Pocket Resus workflows.
// Closing it returns to the live session; no timer or event is changed.
openExplainMe=function(){closeSheet();parent.postMessage({type:'notes-tutorial-open'},location.origin);};
