/* Shared recording adapter, independent of the source-only NZCPG library.
 * Keep old events in their original arrays; never merge events by name.
 */
function clinicalEventTime(e){return Number.isFinite(Date.parse(e.at))?eventTime(e):'Time incomplete';}
function clinicalEventOrder(a,b){const x=Date.parse(a.e.at),y=Date.parse(b.e.at);return (Number.isFinite(x)?x:Infinity)-(Number.isFinite(y)?y:Infinity);}
function isChecklistEvent(e){return e.recordType==='checklist'||e.arrestAction==='checklist'||!!e.arrestChecklistItem;}
let recordedActionFilter='interventions';
function recordedActionRows(){return combinedClinicalEvents().filter(({e})=>recordedActionFilter==='all'||(recordedActionFilter==='checklists'?isChecklistEvent(e):!isChecklistEvent(e)));}
function combinedClinicalEvents(){return [...(state.careEvents||[]).map((e,i)=>({e,i,store:'careEvents'})),...(state.treatmentEvents||[]).map((legacy,i)=>({e:{...legacy,kind:'intervention',name:guidelineAction(legacy.treatmentId).action,details:legacy.detail||(guidelineAction(legacy.treatmentId).medication?'Dose not recorded':''),legacyTreatment:true},i,store:'treatmentEvents'}))].sort(clinicalEventOrder);}
function eventSourceNote(e){return e.source?' ['+(e.source.number||e.source.title)+'; '+(e.source.version||'source snapshot')+']':'';}
function unifiedEventLine(e){return clinicalEventTime(e)+' — '+(e.procedure?e.procedure+' · ':'')+e.name+(e.kind==='drug'?' — '+drugDetails(e):e.details?' — '+e.details:'')+eventSourceNote(e);}
// Checklist review is retained in structured records, separate from treatments
// performed. The display filter never changes stored events or treatment prose.
careEventsNote=function(){return combinedClinicalEvents().filter(x=>!isChecklistEvent(x.e)).map(x=>unifiedEventLine(x.e)).join('\n');};
function editUnifiedEvent(store,index){
 if(store==='careEvents'){if($('careModal').open)stashCareDraft();const event=state.careEvents[index];if(event.pocketProcedure)openNotesEquipment('',index);else openCare(event.kind,index);return;}
 const e=state.treatmentEvents[index];if(!e)return;if($('careModal').open)stashCareDraft();
 eventDraft={...cloneCare(e),index:null,name:guidelineAction(e.treatmentId).action,dose:'',unit:'',route:'',details:e.detail||'',kind:'intervention',legacyTreatmentIndex:index};careView='intervention';renderCare();$('careModal').show();
}
const recordsBaseSave=saveCareEvent;
saveCareEvent=function(keepOpen=false){
 if(eventDraft?.legacyTreatmentIndex!==undefined){const stamped=stampCare(eventDraft);if(!stamped){careError('Enter a valid action date and time.');return false;}const i=eventDraft.legacyTreatmentIndex;Object.assign(state.treatmentEvents[i],{at:stamped.at,local:stamped.local,timeZone:stamped.timeZone,detail:eventDraft.details,modifiedAt:new Date().toISOString()});$('careModal').close();eventDraft=null;changed();render();return true;}
 return recordsBaseSave(keepOpen);
};
const recordsEntryMarkup=eventEntryMarkup;
eventEntryMarkup=function(){const source=eventDraft?.source;let entry=recordsEntryMarkup();if(eventDraft&&isChecklistEvent(eventDraft))entry=entry.replace('Intervention performed','Checklist activity').replace('<label>Intervention','<label>Checklist');return (source?`<details class="entry-source"><summary>Recorded source · ${esc(source.number||source.title)}</summary><p>${esc(source.wording)}</p></details>`:'')+entry;};
function refreshRecordedSourceCounts(){if(typeof showRecordedEntries==='function')showRecordedEntries();}
// Deletion is reversible inside the draft, so it does not depend on native
// confirm dialogs (which may be suppressed in an embedded/tablet browser).
let removedRecordedEntries=[];
function recordRemovalMarkup(){const last=removedRecordedEntries.at(-1);return last?`<div class="record-removal-notice"><span role="status">Removed ${esc(last.label)}.</span><button class="quiet" data-record-undo="${last.key}">Undo</button></div>`:'';}
function adjustRecordedDraftIndexes(store,index,delta){
 const adjust=(view,vd,ed)=>{
  const d=store==='vitalSets'?(['vitals','gcs'].includes(view)?vd:null):(!['vitals','gcs'].includes(view)?ed:null);
  const key=store==='treatmentEvents'?'legacyTreatmentIndex':'index';
  if(!d||(store==='careEvents'&&d.legacyTreatmentIndex!==undefined)||d[key]==null||!Number.isInteger(d[key]))return true;
  if(delta<0&&d[key]===index)return false;
  if(d[key]>index||(delta>0&&d[key]===index))d[key]+=delta;
  return true;
 };
 if(!adjust(careView,vitalDraft,eventDraft)){
  if($('careModal').open)$('careModal').close();
  if(store==='vitalSets')vitalDraft=null;else eventDraft=null;
 }
 const next={};for(const [key,p] of Object.entries(pendingCare)){
  if(!adjust(p.view,p.vitalDraft,p.eventDraft))continue;
  const kind=p.view==='gcs'?'vitals':p.view,d=kind==='vitals'?p.vitalDraft:p.eventDraft;
  next[key.startsWith('source:')?key:careDraftKey(kind,d?.index)]=p;
 }pendingCare=next;
}
function refreshRecordedViews(record){
 if(typeof pilotSyncChecklists==='function')pilotSyncChecklists();
 if(typeof pilotRefreshLogFeedback==='function')pilotRefreshLogFeedback(record);
 else if($('recordsPane'))$('recordsPane').innerHTML=recordedTables();
 if(typeof updateRepeatNotifications==='function')updateRepeatNotifications();
}
function removeRecordedEntry(store,index,id=''){
 if(!['careEvents','treatmentEvents','vitalSets'].includes(store)||!Array.isArray(state[store]))return false;
 if(id)index=state[store].findIndex(e=>e.id===id);
 if(!Number.isInteger(index)||index<0||index>=state[store].length)return false;
 const [entry]=state[store].splice(index,1);adjustRecordedDraftIndexes(store,index,-1);
 const label=store==='vitalSets'?'vitals at '+compactActionTime(entry):entry.name||guidelineAction(entry.treatmentId).action;
 removedRecordedEntries.push({entry,store,index,label,key:'removed-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)});
 changed();refreshRecordedViews();toast('Removed '+label+' · Undo is available in Records');return true;
}
function undoRecordedRemoval(key){
 const i=removedRecordedEntries.findIndex(x=>x.key===key);if(i<0)return false;
 const item=removedRecordedEntries[i];
 if(state[item.store].includes(item.entry)||(item.entry.id&&state[item.store].some(e=>e.id===item.entry.id)))return false;
 const index=Math.min(item.index,state[item.store].length);adjustRecordedDraftIndexes(item.store,index,1);
 state[item.store].splice(index,0,item.entry);removedRecordedEntries.splice(i,1);changed();refreshRecordedViews(item.entry);toast('Restored '+item.label);return true;
}
const removalBaseClearDrafts=clearCareDrafts;
clearCareDrafts=function(){removedRecordedEntries=[];recordedActionFilter='interventions';removalBaseClearDrafts();};
// Existing source snapshots remain readable even though the corpus is not deployed.
function showRecordedSource(id){const source=state.careEvents.find(e=>e.source?.referenceId===id)?.source;if(!source)return;const pane=$('diagnosisPane');pane.innerHTML=`<h2>${esc(source.title)}</h2><p>${esc(source.number)} · ${esc(source.version)}</p><p>${esc(source.wording).replace(/\n/g,'<br>')}</p>${source.url?`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Official source ↗</a>`:''}`;openReference('clinical');}
document.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.unifiedEdit)editUnifiedEvent(button.dataset.unifiedEdit,+button.dataset.unifiedIndex);
 if(button.dataset.unifiedRemove)removeRecordedEntry(button.dataset.unifiedRemove,+button.dataset.unifiedIndex,button.dataset.recordedId||'');
 if(button.dataset.recordUndo)undoRecordedRemoval(button.dataset.recordUndo);
 if(button.dataset.reference)showRecordedSource(button.dataset.reference);
});
document.addEventListener('change',e=>{if(!e.target.hasAttribute?.('data-recorded-filter'))return;const value=e.target.value;if(!['interventions','all','checklists'].includes(value))return;recordedActionFilter=value;refreshRecordedViews();document.querySelector('[data-recorded-filter]')?.focus();});
