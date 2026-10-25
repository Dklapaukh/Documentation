/* Checklist wording transcribed from the packaged NZCPG PDFs (24 September 2026 exports).
 * A tick records only review/completion of that checklist item, never an actual dose,
 * intervention, shock, physiological finding or eligibility decision.
 * Stable item indexes are record identifiers: append new items rather than reorder them.
 */
const ARREST_CHECKLISTS=[
 {id:'arrest',label:'Arrest checklist',code:'EAS 3.14',pdf:'cpg-cardiac-arrest.pdf#page=2',items:[
 'Team leader identified.','Roles allocated and confirmed.','CPR feedback device and metronome on if available.','Defibrillator screen visible to the team leader.','Airway adjunct or ETT in place and ventilation adequate.','ETCO2 attached and waveform visible.','Oxygen flow and supply adequate.','IV/IO access secure, two sites if possible.','Consider underlying and reversible causes.','Appropriate medicines administered.','Initiate documentation.','Communication with family/bystanders.']},
 {id:'postrosc',label:'Post ROSC checklist',code:'EAS 3.15',pdf:'cpg-post-rosc.pdf#page=2',items:[
 'Airway and ventilation are adequate/secure.','Vital signs, including blood glucose level.','Backup for RSI called for if indicated.','IV access secure.','ETCO2 35–45 mmHg if ventilated.','Sedation and neuromuscular blockade if indicated.','BP above target.','12 lead ECG.','Confirm appropriate transport destination.']},
 {id:'preparation',label:'Preparation for RSI',code:'EAS 9.2 · Airway Backup Checklist',pdf:'cpg-preparation-rsi.pdf',intro:'Prepare for RSI while awaiting CCP backup.',items:[
 'Pre-oxygenate by mask.','Attach monitor, including ETCO2.','Gain IV access, preferably in two sites.','Prepare a running line of 0.9% sodium chloride.','Position the patient for optimal airway control.','Place an ETT holder under the patient’s head.','Ensure suction is working and turn it off.','Prepare a manual ventilation bag with PEEP valve.','Maximise space and clear away unnecessary equipment.','Consider travelling toward backup.']},
 {id:'rsi',label:'RSI checklist',code:'EAS 9.4',pdf:'cpg-rsi-checklist.pdf',items:[
 'Roles assigned — Team leader.','Roles assigned — Airway.','Roles assigned — Airway assistant.','Roles assigned — Drugs and monitoring.',
 'Patient prepared — Check oxygen supply and pre-oxygenate.','Patient prepared — Consider nasal prongs.','Patient prepared — Position optimised.','Patient prepared — IV access patent. Running line attached.','Patient prepared — Consider marking surgical airway landmarks.',
 'Monitoring attached and visible — Baseline vital signs.','Monitoring attached and visible — Pulse oximetry, capnography, and cycling BP.',
 'Equipment checked and ready — PPE.','Equipment checked and ready — Manual ventilation bag with PEEP valve set to 5 cmH2O.','Equipment checked and ready — OPA, SGA, and surgical airway equipment.','Equipment checked and ready — Laryngoscope.','Equipment checked and ready — ETT and 10 ml cuff syringe.','Equipment checked and ready — ETT holder in place.','Equipment checked and ready — Suction.','Equipment checked and ready — Bougie and stylet.',
 'Medicines drawn up, labelled and doses confirmed — Fentanyl (if indicated).','Medicines drawn up, labelled and doses confirmed — Ketamine.','Medicines drawn up, labelled and doses confirmed — Neuromuscular blocker.','Medicines drawn up, labelled and doses confirmed — Post intubation sedation.','Medicines drawn up, labelled and doses confirmed — Metaraminol.',
 'Team briefing — Airway plan, including failed intubation.','Team briefing — Medication plan.','Team briefing — Anticipated complications.','Team briefing — Any concerns before proceeding?']}
];
function arrestChecklistItem(key){
 const [id,index]=String(key).split(':'),list=ARREST_CHECKLISTS.find(x=>x.id===id);
 return list&&/^\d+$/.test(index)&&list.items[Number(index)]?{list,index:Number(index),text:list.items[Number(index)]}:null;
}
function arrestChecklistStatus(key){
 return arrestCaseEvents(state.arrest,state.careEvents).filter(e=>e.arrestChecklistItem===key).at(-1)||null;
}
function toggleArrestChecklistItem(key,checked,now=Date.now()){
 const item=arrestChecklistItem(key);if(!item||!Number.isFinite(now))return false;
 if(!!arrestChecklistStatus(key)?.checklistChecked===checked)return false;
 ensureArrestId();const date=new Date(now),entry={at:date.toISOString(),local:localDateTime(date),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,kind:'intervention',name:'Checklist · '+item.list.label,details:(checked?'Checked: ':'Unmarked: ')+item.text,arrestId:state.arrest.id,arrestAction:'checklist',arrestChecklistItem:key,checklistChecked:checked};
 state.careEvents.push(entry);changed();return entry;
}
function renderArrestChecklists(){
 const root=$('arrestSideContent'),list=ARREST_CHECKLISTS.find(x=>x.id===state.arrest.checklist)||ARREST_CHECKLISTS[0];
 root.innerHTML=`<div class="arrest-checklist-choices">${ARREST_CHECKLISTS.map(x=>`<button class="quiet" data-arrest-checklist="${x.id}" aria-pressed="${x.id===list.id}">${x.label}</button>`).join('')}</div><h3>${list.label}</h3><p class="subtle">${list.code} · Tick to timestamp checklist review.${list.intro?' '+list.intro:''}</p><div class="arrest-checklist-items">${list.items.map((text,i)=>{const key=list.id+':'+i,e=arrestChecklistStatus(key),checked=!!e?.checklistChecked;return `<label><input type="checkbox" aria-label="${esc(text)}" data-arrest-checklist-item="${key}" ${checked?'checked':''}><span>${esc(text)}${checked?`<time datetime="${e.at}">${esc(eventTime(e))}</time>`:''}</span></label>`;}).join('')}</div><a href="${list.pdf}" target="_blank" rel="noopener noreferrer">Original checklist ↗</a>`;
}
function arrestRsiGuidance(){
 const a=state.arrest,r=rsiReference(a.weight,a.group,a.age);
 return `<section class="arrest-rsi-doses"><h3>RSI drugs · reference</h3><p class="subtle">${a.weight?esc(a.weight+' kg · '+a.group):'Enter pt weight for calculated references.'}</p>${r?rsiDoseMarkup(r).replace(/<p>ETT:[\s\S]*?<\/p>/,''):'<dl class="arrest-rsi-formulas"><dt>Fentanyl</dt><dd>2 mcg/kg IV · max 200 mcg · only when indicated; withhold with shock.</dd><dt>Ketamine</dt><dd>2 mg/kg IV · max 200 mg. Consider 1 mg/kg with shock / prior sedation; do not reduce for prolonged seizures.</dd><dt>Rocuronium or suxamethonium</dt><dd>2 mg/kg IV · max 200 mg. Adult dose usually rounded to nearest 50 mg. Alternatives, not both.</dd></dl><p class="subtle">Fentanyl indications: TBI, suspected intracranial pathology or hypertension. Verify the full CPG.</p>'}<a href="cpg-rsi.pdf" target="_blank" rel="noopener noreferrer">Full RSI CPG · EAS 9.3 ↗</a><p class="subtle">Defibrillation: 4 J/kg calculation is capped at 200 J here. Adult arrest CPG specifies the maximum setting on the defibrillator; verify the device and CPG.</p></section>`;
}
function renderArrestMedicineClocks(rem,now){
 const events=arrestCaseEvents(state.arrest,state.careEvents),amio=events.filter(e=>e.arrestAction==='amiodarone'&&e.name.toLowerCase()==='amiodarone').sort((a,b)=>new Date(a.at)-new Date(b.at)).at(-1);
 arrestSetText('adrenalineClock',rem.adrenalineRemaining===null?'—':rem.futureDrugTime?'Check time':(rem.adrenalineRemaining<0?'+':'')+clockText(Math.abs(rem.adrenalineRemaining)));
 // Amiodarone is shock-count based: show elapsed time, not an invented repeat interval.
 arrestSetText('amiodaroneClock',amio?(new Date(amio.at).getTime()>now?'Check time':clockText(now-new Date(amio.at).getTime())):'—');
 if($('amiodaroneClock'))$('amiodaroneClock').setAttribute('aria-label','Time since last amiodarone administration');
}
