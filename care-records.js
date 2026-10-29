/* Shared recording adapter, independent of the source-only NZCPG library.
 * Keep old events in their original arrays; never merge events by name.
 */
function clinicalEventTime(e){return Number.isFinite(Date.parse(e.at))?eventTime(e):'Time incomplete';}
function clinicalEventOrder(a,b){const x=Date.parse(a.e.at),y=Date.parse(b.e.at);return (Number.isFinite(x)?x:Infinity)-(Number.isFinite(y)?y:Infinity);}
function combinedClinicalEvents(){return [...(state.careEvents||[]).map((e,i)=>({e,i,store:'careEvents'})),...(state.treatmentEvents||[]).map((legacy,i)=>({e:{...legacy,kind:'intervention',name:guidelineAction(legacy.treatmentId).action,details:legacy.detail||(guidelineAction(legacy.treatmentId).medication?'Dose not recorded':''),legacyTreatment:true},i,store:'treatmentEvents'}))].sort(clinicalEventOrder);}
function eventSourceNote(e){return e.source?' ['+e.source.number+'; '+(e.source.version||'source snapshot')+']':'';}
function unifiedEventLine(e){return clinicalEventTime(e)+' — '+(e.procedure?e.procedure+' · ':'')+e.name+(e.kind==='drug'?' — '+drugDetails(e):e.details?' — '+e.details:'')+eventSourceNote(e);}
careEventsNote=function(){return combinedClinicalEvents().map(x=>unifiedEventLine(x.e)).join('\n');};
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
eventEntryMarkup=function(){const source=eventDraft?.source;return (source?`<details class="entry-source"><summary>Recorded source · ${esc(source.number)}</summary><p>${esc(source.wording)}</p></details>`:'')+recordsEntryMarkup();};
function refreshRecordedSourceCounts(){if(typeof showRecordedEntries==='function')showRecordedEntries();}
// Existing source snapshots remain readable even though the corpus is not deployed.
function showRecordedSource(id){const source=state.careEvents.find(e=>e.source?.referenceId===id)?.source;if(!source)return;const pane=$('diagnosisPane');pane.innerHTML=`<h2>${esc(source.title)}</h2><p>${esc(source.number)} · ${esc(source.version)}</p><p>${esc(source.wording).replace(/\n/g,'<br>')}</p>${source.url?`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Official source ↗</a>`:''}`;openReference('clinical');}
document.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.unifiedEdit)editUnifiedEvent(button.dataset.unifiedEdit,+button.dataset.unifiedIndex);
 if(button.dataset.unifiedRemove&&confirm('Remove this recorded entry?')){state[button.dataset.unifiedRemove].splice(+button.dataset.unifiedIndex,1);changed();render();refreshRecordedSourceCounts();}
 if(button.dataset.reference)showRecordedSource(button.dataset.reference);
});
