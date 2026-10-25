/* Arrest entries are explicit clinician records. Reference values never fill actual doses,
 * equipment sizes or confirmation fields. Age estimates follow NZCPG EAS 7.2.
 */
const ARREST_EQUIPMENT={
 iv:{name:'IV cannulation',sizes:['24','22','20','18','16']},
 io:{name:'IO access',sizes:['Large','Medium','Small']},
 opa:{name:'OPA',sizes:['000','00','0','1','2','3','4','5']},
 npa:{name:'NPA',sizes:['3 mm','3.5 mm','4 mm','4.5 mm','5 mm','5.5 mm','6 mm','6.5 mm','7 mm','7.5 mm','8 mm','8.5 mm','9 mm','12 Fr','14 Fr','16 Fr','18 Fr','20 Fr','22 Fr','24 Fr','26 Fr','28 Fr','30 Fr','32 Fr','34 Fr','36 Fr']},
 igel:{name:'iGel',sizes:['1','1.5','2','2.5','3','4','5']},
 laryngoscopy:{name:'Laryngoscopy',sizes:['00','0','1','2','3','4','5']},
 intubation:{name:'Intubation',sizes:['2.0','2.5','3.0','3.5','4.0','4.5','5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0']}
};
const ARREST_RHYTHMS=['VF','VT','Torsades','PEA','Asystole','Sinus rhythm','Organised rhythm','AF','Unknown','Other'];
function arrestRhythmOptions(outcome){
 if(outcome==='Shock')return ['VF','VT','Torsades'];
 if(outcome==='ROSC')return ARREST_RHYTHMS.filter(x=>!['VF','VT','Torsades','Asystole','PEA'].includes(x));
 return ARREST_RHYTHMS;
}
// Weight is a UI default, not a determination of age. Manual group selection remains available.
function autoArrestWeightGroup(d){const w=validArrestWeight(d.weight);if(w!==null)d.group=w<=40?'Child':'Adult';return d.group;}
function syncArrestWeightGroup(){
 const input=document.querySelector('[data-arrest-weight-field="group"]');if(input)input.value=arrestEntry.group;
 const c=document.querySelector('[data-arrest-weight-confirm]');if(c){c.checked=!!arrestEntry.adultDoseConfirmed;c.parentElement.hidden=!(arrestEntry.group==='Child'&&Number(arrestEntry.weight)>40);}
}

let arrestEntry=null;
function estimateArrestWeight(age){
 const n=Number(String(age).replace(',','.'));if(!String(age).trim()||!Number.isFinite(n)||n<=0)return null;
 if(n<1)return 5;if(!Number.isInteger(n))return null;
 return n<=10?(n+4)*2:n<=14?n*3:null;
}
function validArrestWeight(value){const s=String(value).trim().replace(',','.');return /^\d+(\.\d)?$/.test(s)&&Number(s)>0&&Number(s)<=500?Number(s):null;}
function currentArrestDoseReference(a=state.arrest){
 if(validArrestWeight(a.weight)===null)return null;
 if(a.group==='Child'&&Number(a.weight)>40)return a.adultDoseConfirmed?{...arrestDoseReference('Adult',a.weight),label:'Child >40 kg · adult doses confirmed'}:null;
 return arrestDoseReference(a.group,a.weight);
}
function arrestEntryFrame(title,body,actions){
 $('arrestEntryModal').innerHTML=`<div class="arrest-entry-shell"><div class="arrest-entry-heading"><h2>${esc(title)}</h2></div><div class="arrest-entry-content">${body}<p id="arrestEntryError" class="care-error" role="alert" hidden></p></div><div class="arrest-entry-footer">${actions}</div></div>`;
 if(!$('arrestEntryModal').open)$('arrestEntryModal').showModal();
}
function arrestEntryError(message){$('arrestEntryError').textContent=message;$('arrestEntryError').hidden=!message;}
function openArrestWeight(){
 const a=state.arrest;arrestEntry={kind:'weight',weight:String(a.weight),group:a.group,age:String(a.age||''),source:a.weightSource||'Entered',adultDoseConfirmed:!!a.adultDoseConfirmed,padTarget:'weight'};
 arrestEntryFrame('Pt weight',`<div class="arrest-weight-entry"><section><label>Patient group<select data-arrest-weight-field="group">${options(['Adult','Child'],arrestEntry.group,'Choose')}</select></label><label>Weight (kg)<input type="text" inputmode="decimal" data-arrest-weight-field="weight" value="${esc(arrestEntry.weight)}" placeholder="kg"></label><p class="subtle">≤40 kg defaults to Child. Override group if needed.</p><p id="weightEstimateLabel" class="subtle">${esc(arrestEntry.source)}</p><details class="arrest-age-estimate"><summary>Calculate weight from age</summary><label>Age (years)<input type="text" inputmode="decimal" data-arrest-weight-field="age" value="${esc(arrestEntry.age)}" placeholder="Whole years 1–14, or e.g. 0.5"></label><button class="quiet" data-arrest-estimate>Use age estimate</button><p class="subtle">CPG 7.2 · guide only; often underestimates weight. Not for newborn resuscitation.</p></details><label class="check arrest-adult-dose-confirm" ${arrestEntry.group==='Child'&&Number(arrestEntry.weight)>40?'':'hidden'}><input type="checkbox" data-arrest-weight-confirm ${arrestEntry.adultDoseConfirmed?'checked':''}>Use adult doses for child >40 kg · clinician confirmed</label></section><div class="arrest-weight-pad" role="group" aria-label="Patient weight number pad">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>`<button class="quiet" data-arrest-weight-key="${k}" aria-label="${k==='⌫'?'Delete weight digit':'Weight digit '+k}">${k}</button>`).join('')}<button class="quiet" data-arrest-weight-key="clear">Clear</button></div></div>`,`<button class="quiet" data-arrest-entry-cancel>Cancel</button><button data-arrest-weight-save>Use weight</button>`);
}
function enterArrestWeightKey(key){
 if(arrestEntry?.kind!=='weight')return;const field=arrestEntry.padTarget||'weight';let value=arrestEntry[field];
 if(key==='clear')value='';else if(key==='⌫')value=value.slice(0,-1);else if(key==='.'&&!value.includes('.'))value=value?value+'.':'0.';else if(/^\d$/.test(key))value=(value==='0'?'':value)+key;
 arrestEntry[field]=value;if(field==='weight'){arrestEntry.source='Entered';arrestEntry.adultDoseConfirmed=false;autoArrestWeightGroup(arrestEntry);syncArrestWeightGroup();}
 const input=document.querySelector('[data-arrest-weight-field="'+field+'"]');if(input)input.value=value;
 if($('weightEstimateLabel'))$('weightEstimateLabel').textContent=arrestEntry.source;
 const confirm=document.querySelector('[data-arrest-weight-confirm]');if(confirm){confirm.checked=arrestEntry.adultDoseConfirmed;confirm.parentElement.hidden=!(arrestEntry.group==='Child'&&Number(arrestEntry.weight)>40);}
}
function useArrestAgeEstimate(){
 const weight=estimateArrestWeight(arrestEntry.age);if(weight===null){arrestEntryError('Use whole years 1–14, or a fraction of a year for an infant.');return false;}
 arrestEntry.weight=String(weight);arrestEntry.group='Child';arrestEntry.source='Estimated from age '+arrestEntry.age+' years · CPG 7.2';arrestEntry.adultDoseConfirmed=false;arrestEntry.padTarget='weight';
 document.querySelector('[data-arrest-weight-field="weight"]').value=String(weight);document.querySelector('[data-arrest-weight-field="group"]').value='Child';document.querySelector('[data-arrest-weight-confirm]').checked=false;document.querySelector('[data-arrest-weight-confirm]').parentElement.hidden=!(weight>40);$('weightEstimateLabel').textContent=arrestEntry.source;arrestEntryError('');return true;
}
function commitArrestWeight(d=arrestEntry){
 const weight=validArrestWeight(d.weight);if(weight===null||!['Adult','Child'].includes(d.group))return false;
 Object.assign(state.arrest,{weight:String(weight),group:d.group,weightSource:d.source,age:d.age,adultDoseConfirmed:!!d.adultDoseConfirmed});changed();return true;
}
function arrestSelectField(name,label,values,value=''){return `<label>${label}<select name="${name}">${options(values,value,'Not recorded')}</select></label>`;}
// Native radio toggles and sliders are deliberately unselected until used.
function arrestToggleField(name,label,values,value=''){
 return `<fieldset class="arrest-toggles"><legend>${label}</legend>${values.map(x=>`<label><input type="radio" name="${name}" value="${esc(x)}" ${x===value?'checked':''}><span>${esc(x)}</span></label>`).join('')}</fieldset>`;
}
function arrestSizeField(type,value=''){
 const sizes=ARREST_EQUIPMENT[type].sizes,label=type==='intubation'?'Tube size (mm)':type==='laryngoscopy'?'Blade size':'Size';
 if(sizes.length<=8)return arrestToggleField('size',label,sizes,value);
 const unit=type==='npa'&&(value||'').endsWith('Fr')?'Fr':'mm',subset=type==='npa'?sizes.filter(x=>x.endsWith(unit)):sizes;
 return `<div class="arrest-size-slider">${type==='npa'?arrestToggleField('sizeUnit','Scale',['mm','Fr'],unit):''}<label>${label} <b id="arrestSizeReading">${esc(value||'Not recorded')}</b><input type="range" min="0" max="${subset.length-1}" step="1" value="${Math.max(0,subset.indexOf(value))}" data-arrest-size-slider="${type}" aria-label="${label}"></label><div class="arrest-size-ends"><span id="arrestSizeMin">${subset[0]}</span><span id="arrestSizeMax">${subset.at(-1)}</span></div><details><summary>Exact / other size</summary><label>Actual size<input name="size" value="${esc(value)}" placeholder="${type==='npa'?'Include mm or Fr':'Actual mm'}"></label></details></div>`;
}
function setArrestSizeSlider(type,index){
 const unit=document.querySelector('[name="sizeUnit"]:checked')?.value||'mm',sizes=ARREST_EQUIPMENT[type].sizes.filter(x=>type!=='npa'||x.endsWith(unit)),size=sizes[Number(index)];if(!size)return;
 const input=document.querySelector('#arrestInterventionForm [name="size"]');if(input)input.value=size;arrestSetText('arrestSizeReading',size);
}
function changeArrestSizeUnit(){
 const slider=document.querySelector('[data-arrest-size-slider="npa"]'),unit=document.querySelector('[name="sizeUnit"]:checked')?.value||'mm';if(!slider)return;
 const sizes=ARREST_EQUIPMENT.npa.sizes.filter(x=>x.endsWith(unit));slider.max=sizes.length-1;slider.value=0;
 // Switching units does not silently record the first size on the new scale.
 document.querySelector('#arrestInterventionForm [name="size"]').value='';arrestSetText('arrestSizeReading','Not recorded');arrestSetText('arrestSizeMin',sizes[0]);arrestSetText('arrestSizeMax',sizes.at(-1));
}
function openArrestIntervention(type,index=null){
 const e=index===null?null:state.careEvents[index],data=e?.arrestDetails||{},initialAt=e?.at||new Date().toISOString(),initialLocal=e?.local||localDateTime(new Date(initialAt));arrestEntry={kind:'intervention',type,index,initialAt,initialLocal};
 let fields='';
 if(type==='iv')fields=`<label>IV cannula size <b id="ivGaugeReading">${esc(data.size?data.size+'G':'Not recorded')}</b><input type="range" min="0" max="4" step="1" value="${Math.max(0,ARREST_EQUIPMENT.iv.sizes.indexOf(data.size))}" data-arrest-iv-gauge aria-label="IV cannula size"></label><div class="arrest-gauge-ticks">${ARREST_EQUIPMENT.iv.sizes.map(x=>`<span>${x}G</span>`).join('')}</div><input type="hidden" name="size" value="${esc(data.size||'')}">`;
 else if(type==='io')fields=arrestToggleField('size','IO size',ARREST_EQUIPMENT.io.sizes,data.size);
 else fields=arrestSizeField(type,data.size);
 if(type==='laryngoscopy')fields+=arrestToggleField('method','Laryngoscopy',['Video','Direct'],data.method)+arrestToggleField('blade','Blade type',['Macintosh','Miller','Other'],data.blade)+arrestToggleField('view','View achieved',['Grade I','Grade IIa','Grade IIb','Grade III','Grade IV','No view','Other'],data.view);
 if(type==='intubation')fields+=arrestToggleField('adjunct','Introducer',['Bougie','Stylet','Neither','Other'],data.adjunct)+`<label>Length at lips (cm)<input name="lips" type="text" inputmode="decimal" value="${esc(data.lips||'')}" placeholder="Actual length"></label><fieldset class="arrest-confirmation"><legend>Confirmed with</legend>${['Waveform capnography','Visualised through cords','Chest rise','Auscultation','Other'].map(x=>`<label class="check"><input type="checkbox" name="confirmation" value="${x}" ${(data.confirmation||[]).includes(x)?'checked':''}>${x}</label>`).join('')}</fieldset><label>Other confirmation / details<input name="confirmationOther" value="${esc(data.confirmationOther||'')}"></label>`;
 if(['iv','io'].includes(type))fields+=`<label>Site<input name="site" value="${esc(data.site||'')}" placeholder="Actual site"></label>`;
 fields+=arrestToggleField('outcome','Outcome',['Attempted','Placed','Unsuccessful','Removed'],data.outcome)+`<label>Notes<textarea name="notes" placeholder="Notes…">${esc(data.notes||'')}</textarea></label>`;
 arrestEntryFrame(ARREST_EQUIPMENT[type].name,`<form id="arrestInterventionForm"><label>Recorded at<input name="local" type="datetime-local" value="${esc(initialLocal)}"></label><div class="arrest-intervention-fields">${fields}</div></form>`,`<button class="quiet" data-arrest-entry-cancel>Cancel</button><button data-arrest-intervention-save>Record</button>`);
}
function arrestInterventionErrors(type,d){
 const errors=[];if(!ARREST_EQUIPMENT[type])errors.push('Choose an intervention.');
 if(type==='iv'&&d.size&&!ARREST_EQUIPMENT.iv.sizes.includes(d.size))errors.push('Choose a listed cannula size.');
 if(type==='io'&&d.size&&!ARREST_EQUIPMENT.io.sizes.includes(d.size))errors.push('Choose a listed IO size.');
 if(type==='intubation'&&d.size&&(!/^\d+(\.\d+)?$/.test(d.size)||Number(d.size)<=0||Number(d.size)>12))errors.push('Enter a valid tube size in mm.');
 if(d.lips&&(!/^\d+(\.\d+)?$/.test(d.lips)||Number(d.lips)<=0||Number(d.lips)>50))errors.push('Enter a valid length at lips in cm.');
 return errors;
}
function recordArrestIntervention(type,data,local,index=null,exactAt=null){
 // Keep seconds for unchanged real-time entries; edited retrospective times use the entered minute.
 const exact=new Date(exactAt),useExact=exactAt&&Number.isFinite(exact.getTime())&&localDateTime(exact)===local;
 const errors=arrestInterventionErrors(type,data),date=useExact?exact:new Date(local);if(!local||!Number.isFinite(date.getTime()))errors.push('Enter a valid date and time.');if(errors.length)return {errors};
 ensureArrestId();const labels={size:type==='iv'?'Cannula':type==='laryngoscopy'?'Blade size':type==='intubation'?'Tube size':'Size',method:'Laryngoscopy',blade:'Blade',view:'View',adjunct:'Introducer',lips:'Length at lips',site:'Site',outcome:'Outcome',notes:'Notes',confirmationOther:'Other confirmation'};
 const parts=Object.entries(labels).filter(([k])=>String(data[k]||'').trim()).map(([k,label])=>label+': '+data[k]+(k==='size'&&type==='iv'?'G':k==='size'&&type==='intubation'?' mm':k==='lips'?' cm':''));
 if(!data.size)parts.unshift('Size not recorded');if(type==='intubation')parts.push(data.confirmation?.length?'Confirmed with: '+data.confirmation.join(', '):'Confirmation not recorded');
 const old=index===null?null:state.careEvents[index],entry={...old,at:date.toISOString(),local,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,kind:'intervention',name:ARREST_EQUIPMENT[type].name,details:parts.join(' · '),arrestId:old?.arrestId||state.arrest.id,arrestAction:['iv','io'].includes(type)?'vascular_access':'airway',arrestProcedure:type,arrestDetails:{...data,confirmation:[...(data.confirmation||[])]}};
 if(index===null)state.careEvents.push(entry);else state.careEvents[index]=entry;changed();return {entry};
}
function openArrestRhythmCheck(outcome=null){
 arrestEntry={kind:'rhythm',outcome,at:Date.now(),rhythm:'',other:''};renderArrestRhythmEntry();
}
function renderArrestRhythmEntry(){
 const d=arrestEntry;
 if(!d.outcome){arrestEntryFrame('Rhythm check','<div class="arrest-outcome-options"><button data-arrest-outcome="Shock">Shock delivered</button><button class="quiet" data-arrest-outcome="No shock">No shock</button><button class="rosc-choice" data-arrest-outcome="ROSC">ROSC</button></div>', '<button class="quiet" data-arrest-entry-cancel>Cancel</button>');return;}
 arrestEntryFrame(d.outcome+' · enter rhythm',`<label>Rhythm<select data-arrest-check-rhythm>${options(arrestRhythmOptions(d.outcome),d.rhythm,'Choose rhythm')}</select></label><label>Other rhythm / details<input data-arrest-check-other value="${esc(d.other)}" placeholder="Required if Other"></label><p class="subtle">Records the selected action and observed rhythm. No shock or drug is inferred.</p>`,`<button class="quiet" data-arrest-outcome-back>Back</button><button data-arrest-rhythm-save>${d.outcome==='ROSC'?'Record rhythm':'Record & start 2 min'}</button>`);
}
function completeArrestRhythmCheck(d,now=Date.now()){
 if(!['Shock','No shock','ROSC'].includes(d.outcome)||!arrestRhythmOptions(d.outcome).includes(d.rhythm)||d.rhythm==='Other'&&!String(d.other||'').trim())return false;
 if(!Number.isFinite(d.at)||d.at>now)return false;
 state.arrest.rhythm=d.rhythm;const rhythm=arrestStamp('rhythm',d.at);rhythm.details=d.rhythm+(String(d.other||'').trim()?' · '+String(d.other).trim():'');rhythm.arrestOutcome=d.outcome;
 if(d.outcome==='Shock')arrestStamp('shock',d.at);else if(d.outcome==='No shock')arrestStamp('No shock recorded',d.at);
 if(d.outcome==='ROSC')stopArrest('ROSC',d.at);else startArrestCycle(now);
 return true;
}
function askPostRoscChecklist(){
 arrestEntry={kind:'postrosc'};arrestEntryFrame('Post ROSC checklist','<p>Display the Post ROSC checklist?</p>','<button class="quiet" data-arrest-postrosc="no">Not now</button><button data-arrest-postrosc="yes">Show checklist</button>');
}
