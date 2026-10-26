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
  const at=new Date(row.at).getTime();if(Number.isFinite(at))e.at=at;e.title=row.name;e.details=row.details||'';
  if(['adrenaline','amiodarone','medicine'].includes(e.type)){e.dose=row.dose;e.unit=row.unit;e.route=row.route;e.notes=row.details||'';e.details=[row.dose,row.unit,row.route].filter(Boolean).join(' ')+(row.details?' · '+row.details:'');}
 }
 return session;
}
function pocketEvent(e,session){
 const at=new Date(e.at),drug=['adrenaline','amiodarone','medicine'].includes(e.type);
 return {at:at.toISOString(),local:localDateTime(at),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,kind:drug?'drug':'intervention',name:e.title,details:drug?(e.notes||''):(e.details||''),dose:drug?String(e.dose??''):undefined,unit:drug?e.unit||'mg':undefined,route:drug?e.route||'':undefined,arrestId:session.id,arrestAction:e.type,arrestPocket:true,arrestPocketEventId:e.id,arrestPocketAudit:e.audit||[],arrestPocketEquipment:e.equipment,arrestPocketChecklist:e.key};
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
