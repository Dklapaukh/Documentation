/* Inline treatment entry and tabular records.
 * Vitals keep the paper-entry window. Drugs, procedures, airway and access use
 * the space below the action cards. Existing forms, validation and state remain.
 */
let inlineCareEntry=false,recordsLastStep=-1;
function compactActionTime(event){
 if(event.timeUnknown)return 'Before app · time not set';
 const at=new Date(event.at);if(!Number.isFinite(at.getTime()))return 'Time incomplete';
 const zone=event.timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone;
 const date=d=>new Intl.DateTimeFormat('en-NZ',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:zone}).format(d);
 const time=new Intl.DateTimeFormat('en-NZ',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:zone}).format(at);
 return date(at)===date(new Date())?time:date(at)+' '+time;
}
// Keep timezone in exported data; omit it from the working view and copied note.
eventTime=compactActionTime;
function recordedActionTable(){
 const rows=combinedClinicalEvents();
 return `<section class="record-table-section"><h3>Interventions <span>${rows.length}</span></h3><div class="table-scroll"><table class="clinical-table"><thead><tr><th>Time</th><th>Action</th><th>Dose / route</th><th>Notes</th><th><span class="sr-only">Edit</span></th></tr></thead><tbody>${rows.map(({e,i,store})=>`<tr><th scope="row">${esc(compactActionTime(e))}</th><td>${esc((e.procedure?e.procedure+' · ':'')+e.name)}${e.source?`<button class="table-source" data-reference="${e.source.referenceId}">${esc(e.source.number)}</button>`:''}</td><td>${e.kind==='drug'?esc([e.dose?e.dose+' '+(e.unit||''):'—',e.route].filter(Boolean).join(' · ')):'—'}</td><td>${esc(e.details||'—')}</td><td class="table-actions"><button class="quiet" data-unified-edit="${store}" data-unified-index="${i}" aria-label="Edit ${esc(e.name)} at ${esc(compactActionTime(e))}">Edit</button><button class="quiet" data-unified-remove="${store}" data-unified-index="${i}" aria-label="Remove ${esc(e.name)}">×</button></td></tr>`).join('')||'<tr><td colspan="5">No entries</td></tr>'}</tbody></table></div></section>`;
}
function recordedVitalsTable(){
 const rows=(state.vitalSets||[]).map((e,i)=>({e,i})).sort((a,b)=>new Date(a.e.at)-new Date(b.e.at));
 const reading=(e,key)=>e.values?.[key]??'—';
 return `<section class="record-table-section"><h3>Vitals <span>${rows.length}</span></h3><div class="table-scroll"><table class="clinical-table vitals-table"><thead><tr>${['Time','GCS','RR','SpO₂','HR','BP','Temp','BGL','NEWS',''].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(({e,i})=>{const n=news2(e);return `<tr><th scope="row">${esc(compactActionTime(e))}</th><td>${esc(gcsTotal(e.gcs||{})??reading(e,'gcs'))}</td>${['rr','spo2','hr'].map(k=>`<td class="point-${n.points[k]??'none'}">${esc(reading(e,k))}</td>`).join('')}<td class="point-${n.points.sbp??'none'}">${esc(reading(e,'sbp'))}/${esc(reading(e,'dbp'))}</td><td class="point-${n.points.temp??'none'}">${esc(reading(e,'temp'))}</td><td>${esc(reading(e,'bgl'))}</td><td class="news-${n.band}">${n.total??'—'}</td><td class="table-actions"><button class="quiet" data-care-edit="vitals" data-index="${i}" aria-label="Edit vitals at ${esc(compactActionTime(e))}">Edit</button><button class="quiet" data-care-remove="vitals" data-index="${i}" aria-label="Remove vitals">×</button></td></tr>`;}).join('')||'<tr><td colspan="10">No entries</td></tr>'}</tbody></table></div></section>`;
}
function recordedTables(){return `<div class="records-heading"><h2>Recorded care</h2></div>${recordedVitalsTable()+recordedActionTable()}`;}
function showRecordedEntries(){const pane=$('recordsPane');if(!pane)return;pane.innerHTML=recordedTables();openReference('records');}
careTimeline=function(){return recordedTables();};
careScreen=function(){return `<div class="toolbar"><h1>Vitals &amp; Interventions</h1></div><div class="care-actions inline-care-cards"><button class="iv-access-card" data-notes-equipment="iv">+ Add IV access</button><button data-care-open="drug">+ Add drug</button><button data-care-open="intervention">+ Add intervention</button><button data-care-open="procedure">+ Add procedure</button></div><button class="quiet records-launch" data-records-open>Recorded care · ${(state.vitalSets||[]).length+combinedClinicalEvents().length}</button>`;};
const careLayoutOpenReference=openReference;
openReference=function(pane){careLayoutOpenReference(pane);if($('recordsPane'))$('recordsPane').hidden=pane!=='records';if($('drugPane'))$('drugPane').hidden=pane!=='drug';};
function positionCareEditor(kind){
 const modal=$('careModal'),host=$('inlineCareHost');
 inlineCareEntry=!['vitals','gcs'].includes(kind);
 if(inlineCareEntry){if(step!==3)navigate(3);host.hidden=false;host.append(modal);modal.classList.add('inline-care-editor');}
 else{document.body.append(modal);modal.classList.remove('inline-care-editor');if(host)host.hidden=true;}
}
const careLayoutOpen=openCare;
openCare=function(kind,index=null){if($('careModal').open)stashCareDraft();if($('notesEquipmentModal')?.open){$('notesEquipmentModal').close();notesEquipmentActive=false;notesEquipmentRequest=null;}positionCareEditor(kind);careLayoutOpen(kind,index);if(inlineCareEntry&&kind!=='drug')showRecordedEntries();};
const careLayoutRenderCare=renderCare;
renderCare=function(keepScroll=false){
 positionCareEditor(careView);careLayoutRenderCare(keepScroll);
 if(!inlineCareEntry)return;
 const shell=$('careModal').querySelector('.care-modal-shell'),bottom=shell.querySelector('.care-modal-bottom'),body=shell.querySelector('.care-modal-body');
 if(bottom){bottom.className='inline-record-actions';body.append(bottom);}
};
careTimeEditor=function(d){return `<div class="care-time"><label>Time<input type="datetime-local" data-care-time value="${esc(d.local||localDateTime(new Date(d.at)))}" aria-label="Action date and time"></label><button class="quiet" data-care-now>Now</button></div>`;};
// inputmode requests the device's native decimal keypad, without a custom pad.
dosePadMarkup=function(){return `<label class="native-dose">Dose<input type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" data-care-field="dose" value="${esc(eventDraft.dose||'')}" placeholder="Actual dose"></label>`;};
drugSidebar=function(){return `<section class="inline-drug-work">${eventEntryMarkup()}</section>`;};
const careLayoutDrugGuidance=updateDrugGuidance;
updateDrugGuidance=function(force=false){
 if(careView!=='drug')return;
 const selected=!!drugReferenceName(eventDraft?.name)&&eventDraft.drugSelected!==false;
 if(selected){careLayoutDrugGuidance(force);openReference('drug');}else{if($('drugGuidanceContent'))$('drugGuidanceContent').innerHTML='';showRecordedEntries();}
};
const careLayoutRender=render;
render=function(){
 const entering=step===3&&recordsLastStep!==3;
 careLayoutRender();const host=$('inlineCareHost');if(host)host.hidden=step!==3;
 recordsLastStep=step;
 if(referencePane==='records'&&$('recordsPane'))$('recordsPane').innerHTML=recordedTables();
 if(entering)showRecordedEntries();
};
const careLayoutSave=saveCareEvent;
saveCareEvent=function(keepOpen=false){const result=careLayoutSave(keepOpen);if(result)showRecordedEntries();return result;};
const careLayoutSaveVitals=saveVitalSet;
saveVitalSet=function(){const result=careLayoutSaveVitals();if(result)showRecordedEntries();return result;};
refreshRecordedSourceCounts=function(){showRecordedEntries();};
// The existing equipment frame is reused inline; cardiac arrest stays isolated.
function mountInlineEquipment(){
 if($('careModal').open)stashCareDraft();if(step!==3)navigate(3);
 const host=$('inlineCareHost');host.hidden=false;if($('notesEquipmentModal').parentNode!==host)host.append($('notesEquipmentModal'));$('notesEquipmentModal').classList.add('inline-equipment-editor');showRecordedEntries();return true;
}
document.addEventListener('click',e=>{if(e.target.closest('[data-records-open]'))showRecordedEntries();});
document.addEventListener('care-recorded',showRecordedEntries);
