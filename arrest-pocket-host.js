/* Isolated Pocket Resus UI. Only cardiac-arrest events are mirrored into notes.
 * Keep one in-memory session: closing/reopening does not restart clocks; New patient
 * in Notes resets the arrest frame. No separate stored patient record is created.
 */
let pocketFrame=null,pocketBoundState=null;
function openPocketArrest(){
 if(!pocketFrame){const frame=document.createElement('iframe');frame.title='Cardiac arrest workspace';frame.src='arrest-pocket/index.html';frame.style.cssText='width:100%;height:100dvh;border:0;display:block';frame.allow='clipboard-write; screen-wake-lock';$('arrestModal').replaceChildren(frame);pocketFrame=frame;pocketBoundState=state;}
 if(pocketBoundState!==state){pocketBoundState=state;pocketFrame.contentWindow.postMessage({type:'notes-arrest-init',session:state.arrest.pocketSession||null},location.origin);}
 if(state.arrest.pocketSession&&pocketBoundState===state){reconcilePocketNotes(state.arrest.pocketSession,state.careEvents);pocketFrame.contentWindow.postMessage({type:'notes-arrest-init',session:state.arrest.pocketSession},location.origin);}
 if(!$('arrestModal').open)$('arrestModal').showModal();
}
// Respect corrections/removals made through the existing Notes event editor.
function reconcilePocketNotes(session,rows){
 for(const e of session.events){if(e.voided)continue;const row=rows.find(x=>x.arrestPocketEventId===e.id);
  if(!row){e.voided=true;continue;}
  const at=new Date(row.at).getTime();if(Number.isFinite(at)){if(e.timeUnknown&&at!==e.at){delete e.timeUnknown;e.needsReview=false;}e.at=at;}e.title=row.name;e.details=row.details||'';
  if(['adrenaline','amiodarone','magnesium','fluids','medicine'].includes(e.type)){e.dose=row.dose;e.unit=row.unit;e.route=row.route;e.notes=row.details||'';e.details=[row.dose,row.unit,row.route].filter(Boolean).join(' ')+(row.details?' · '+row.details:'');}
 }
 return session;
}
function pocketEvent(e,session){
 const at=new Date(e.at),drug=['adrenaline','amiodarone','magnesium','fluids','medicine'].includes(e.type);
 return {at:at.toISOString(),local:localDateTime(at),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,kind:drug?'drug':'intervention',name:e.title,details:drug?(e.notes||''):(e.details||''),dose:drug?String(e.dose??''):undefined,unit:drug?e.unit||'mg':undefined,route:drug?e.route||'':undefined,arrestId:session.id,arrestAction:e.type,arrestPocket:true,arrestPocketEventId:e.id,arrestPocketAudit:e.audit||[],arrestPocketEquipment:e.equipment,arrestPocketChecklist:e.key,timeUnknown:e.timeUnknown,preApp:e.preApp,needsReview:e.needsReview};
}
window.addEventListener('message',e=>{
 if(!pocketFrame||e.origin!==location.origin||e.source!==pocketFrame.contentWindow)return;
 if(e.data?.type==='notes-arrest-ready')pocketFrame.contentWindow.postMessage({type:'notes-arrest-init',session:state.arrest.pocketSession||null},location.origin);
 if(e.data?.type==='notes-arrest-close'){$('arrestModal').close();render();}
 if(e.data?.type==='notes-arrest-state'){
  if(pocketBoundState!==state)return;
  const s=e.data.session;if(!s||s.version!==1||!Array.isArray(s.events))return;
  // Replace only this integration's mirrored rows. Corrections/voids are authoritative.
  state.careEvents=state.careEvents.filter(x=>!x.arrestPocket).concat(s.events.filter(x=>!x.voided).map(x=>pocketEvent(x,s)));
  state.arrest.pocketSession=s;state.arrest.id=s.id;state.arrest.phase=s.phase;state.arrest.deadline=s.deadline;state.arrest.remainingMs=s.remaining;state.arrest.weight=s.weight;state.arrest.rhythm=s.rhythm;changed();if(!$('arrestModal').open)render();
 }
});
setInterval(()=>{
 if(!pocketFrame)return;
 if(pocketBoundState!==state){pocketBoundState=state;pocketFrame.contentWindow.postMessage({type:'notes-arrest-init',session:state.arrest.pocketSession||null},location.origin);}
 const a=state.arrest,s=a.pocketSession;if(!s)return;const left=s.deadline===null?s.remaining:Math.max(0,s.deadline-Date.now());$('arrestBadge').textContent=s.phase==='Active'?clockText(left):'';$('arrestButton').classList.toggle('arrest-attention',s.phase==='Active'&&left===0);
},250);
let notesEquipmentFrame=null,notesEquipmentIndex=null,notesEquipmentLoaded=false,notesEquipmentActive=false,notesEquipmentRequest=null;
function prepareNotesEquipment(){
 if(notesEquipmentFrame)return;let modal=$('notesEquipmentModal');if(!modal){modal=document.createElement('dialog');modal.id='notesEquipmentModal';modal.setAttribute('aria-label','Airway and access entry');const host=$('inlineCareHost');(host||document.body).append(modal);}
 const frame=document.createElement('iframe');frame.title='Airway and access entry';frame.src='arrest-pocket/index.html?equipment=1';modal.append(frame);notesEquipmentFrame=frame;
 frame.addEventListener('load',()=>{notesEquipmentLoaded=true;if(notesEquipmentActive&&notesEquipmentRequest)frame.contentWindow.postMessage(notesEquipmentRequest,location.origin);});
}
function openNotesEquipment(group,index=null){
 prepareNotesEquipment();notesEquipmentIndex=index;notesEquipmentActive=true;const entry=index===null?null:state.careEvents[index];
 notesEquipmentRequest={type:'notes-equipment-init',group,entry:entry?{procedure:entry.pocketProcedure,equipment:entry.pocketEquipment,at:entry.at}:null};
 const inline=typeof mountInlineEquipment==='function'&&mountInlineEquipment();
 if(!$('notesEquipmentModal').open){if(inline)$('notesEquipmentModal').show();else $('notesEquipmentModal').showModal();}
 if(notesEquipmentLoaded)notesEquipmentFrame.contentWindow.postMessage(notesEquipmentRequest,location.origin);
}
// Warm this small local frame once, after the initial notes UI has rendered.
function warmNotesEquipment(){if(typeof requestIdleCallback==='function')requestIdleCallback(prepareNotesEquipment,{timeout:1500});else setTimeout(prepareNotesEquipment,0);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',warmNotesEquipment,{once:true});else warmNotesEquipment();
window.addEventListener('message',e=>{
 if(!notesEquipmentFrame||e.source!==notesEquipmentFrame.contentWindow||e.origin!==location.origin)return;
 if(!notesEquipmentActive)return;
 if(e.data?.type==='notes-equipment-state'){
  const event=e.data.session?.events?.filter(x=>x.type==='equipment').at(-1);if(!event)return;
  const previous=notesEquipmentIndex===null?{}:state.careEvents[notesEquipmentIndex];
  const row={...previous,at:new Date(event.at).toISOString(),local:localDateTime(new Date(event.at)),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,kind:'intervention',name:event.title,details:event.details,pocketProcedure:event.procedure,pocketEquipment:event.equipment,
   id:previous.id||(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'event-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),enteredAt:previous.enteredAt||(notesEquipmentIndex===null?new Date().toISOString():null),...(notesEquipmentIndex!==null?{modifiedAt:new Date().toISOString()}:{})};
  if(notesEquipmentIndex===null)state.careEvents.push(row);else state.careEvents[notesEquipmentIndex]=row;changed();render();$('notesEquipmentModal').close();notesEquipmentActive=false;notesEquipmentRequest=null;if(document.dispatchEvent)document.dispatchEvent(new Event('care-recorded'));
 }
 if(e.data?.type==='notes-equipment-close'){$('notesEquipmentModal').close();notesEquipmentActive=false;notesEquipmentRequest=null;}
});
// Capture existing timeline Edit only for structured non-arrest equipment records.
document.addEventListener('click',e=>{const b=e.target.closest('[data-care-edit="event"]');if(!b)return;const index=+b.dataset.index,row=state.careEvents[index];if(row?.pocketProcedure){e.stopImmediatePropagation();openNotesEquipment('',index);}},true);
