/* Explicitly source-bound pilot adult doses. No infusion/paediatric engine.
 * Source bodies and existing care drafts are never edited by this module. */
const dosePilotRules=new Map([...DOSE_PILOT.rules,...DOSE_PILOT.dosageClocks].map(r=>[r.id,r]));
const dosePilotDrafts=new Map();
function dosePilotRule(id){
 const rule=dosePilotRules.get(id),ref=rule&&PILOT_REFS.get(rule.referenceId);
 if(!ref||rule.schemaVersion!==3||ref.sourceHash!==rule.sourceHash)return null;
 const passages=new Map(ref.pages.flatMap(s=>s.passages.map(p=>({...p,sectionId:s.id}))).map(p=>[p.id,p]));
 if(passages.get(rule.passageId)?.text!==rule.wording||!rule.dosingRules?.length)return null;
 const dosingSections=new Set(ref.pages.filter(p=>['Dosage','Additional information'].includes(p.title)).map(p=>p.id));
 if(rule.dosingRules.some(p=>!dosingSections.has(p.sectionId)||passages.get(p.id)?.text!==p.text||passages.get(p.id)?.sectionId!==p.sectionId))return null;
 for(const [title,key] of [['Contraindications','contraindications'],['Cautions','cautions']]){
  const sections=ref.pages.filter(p=>p.title===title),expected=sections.flatMap(s=>s.passages.filter(p=>p.text!==title).map(p=>({...p,sectionId:s.id})));
  if(!sections.length||!Array.isArray(rule[key])||rule[key].length!==expected.length||expected.some((p,i)=>p.id!==rule[key][i].id||p.text!==rule[key][i].text||p.sectionId!==rule[key][i].sectionId))return null;
 }
 return rule;
}
function dosePilotNumber(value){const s=String(value??'').trim();return /^\d+(?:\.\d+)?$/.test(s)&&Number(s)>0&&Number.isFinite(Number(s))?Number(s):null;}
function dosePilotCalculate(rule,inputs){
 if(!rule)return {error:'Source rule is unavailable.'};
 if(rule.mode==='fixed')return {dose:rule.dose,method:'fixed',description:rule.label};
 const weight=dosePilotNumber(inputs.weight);
 if(weight===null)return {error:'Enter a positive weight in kg, or use manual dose entry.'};
 if(rule.mode==='weight'){
  const roundedWeight=Math.ceil(weight/rule.roundWeightUp)*rule.roundWeightUp,uncapped=Number((roundedWeight*rule.factor).toFixed(8)),roundedDose=rule.roundDoseTo?Math.round(uncapped/rule.roundDoseTo)*rule.roundDoseTo:uncapped,dose=Math.min(roundedDose,rule.maximum);
  const description=`${weight} kg → round up to ${roundedWeight} kg; ${roundedWeight} × ${rule.factor} mg/kg = ${uncapped} mg${rule.roundDoseTo?`; round to nearest ${rule.roundDoseTo} mg = ${roundedDose} mg`:''}; maximum ${rule.maximum} mg → ${dose} mg.`;
  return {dose,method:'formula',weight,roundedWeight,uncapped,roundedDose,maximum:rule.maximum,description,...(rule.cautionFactor?{cautionDose:dose*rule.cautionFactor,cautionDescription:`If a caution is present: ${dose} mg × ${rule.cautionFactor} = ${dose*rule.cautionFactor} mg.`}:{})};
 }
 return {error:'No calculation is configured for this instruction.'};
}
function dosePilotRememberedWeight(){
 if(state.dosingWeight?.kg)return {weight:String(state.dosingWeight.kg)};
 if(procedureDraft?.weight)return {weight:String(procedureDraft.weight)};
 if(state.arrest?.weight)return {weight:String(state.arrest.weight)};
 return {weight:''};
}
function dosePilotSelectedMedicine(rule){
 if(!rule.medicineNames)return rule.name;
 const name=drugReferenceName(eventDraft?.name||'');
 return $('careModal').open&&['drug','procedure'].includes(careView)&&eventDraft?.kind==='drug'&&eventDraft.drugSelected!==false&&rule.medicineNames.includes(name)?name:'';
}
function dosePilotBegin(ruleId){
 const rule=dosePilotRule(ruleId);if(!rule)return null;
 if(rule.interaction!=='clock')return null;
 if(rule.mode==='fixed'&&!rule.routeRequired){
  const actualName=dosePilotSelectedMedicine(rule);
  if(actualName)return dosePilotRecord(rule,{...freshCareTime(),actualName,actualDose:String(rule.dose),notes:''},dosePilotCalculate(rule,{}));
  if(!dosePilotDrafts.has(ruleId))dosePilotDrafts.set(ruleId,{ruleId,...freshCareTime(),stage:'medicine',actualDose:String(rule.dose),notes:''});
  dosePilotRefresh(ruleId);return null;
 }
 if(!dosePilotDrafts.has(ruleId)){
  dosePilotDrafts.set(ruleId,{ruleId,...freshCareTime(),...dosePilotRememberedWeight(),stage:'inputs',manual:false,actualDose:'',actualRoute:rule.route,variant:'standard',notes:'',error:''});
  if(rule.mode==='manual'||(rule.mode==='fixed'&&rule.routeRequired))dosePilotReview(ruleId,rule.mode==='manual');
 }
 dosePilotRefresh(ruleId);return null;
}
function dosePilotChooseMedicine(ruleId,name){
 const rule=dosePilotRule(ruleId),draft=dosePilotDrafts.get(ruleId);
 if(!rule||rule.mode!=='fixed'||draft?.stage!=='medicine'||!rule.medicineNames?.includes(name))return null;
 dosePilotDrafts.delete(ruleId);dosePilotRefresh(ruleId);
 return dosePilotRecord(rule,{...draft,actualName:name},dosePilotCalculate(rule,{}));
}
function dosePilotReview(ruleId,manual=false){
 const rule=dosePilotRule(ruleId),draft=dosePilotDrafts.get(ruleId);if(!rule||!draft)return false;
 if(rule.interaction!=='clock')return false;
 const recommendation=manual?{method:'manual',description:'Manual actual dose · no calculated or table-selected dose.'}:dosePilotCalculate(rule,draft);
 if(recommendation.error){draft.error=recommendation.error;return false;}
 draft.manual=manual;draft.recommendation=recommendation;draft.actualDose=manual?'':String(recommendation.dose);draft.variant='standard';draft.stage='confirm';draft.error='';return true;
}
function dosePilotChooseVariant(ruleId,variant){
 const rule=dosePilotRule(ruleId),draft=dosePilotDrafts.get(ruleId);if(!rule||!draft||draft.stage!=='confirm'||draft.manual||!['standard','caution'].includes(variant))return false;
 const result=dosePilotCalculate(rule,draft),dose=variant==='caution'?result.cautionDose:result.dose;if(result.error||dose===undefined)return false;
 draft.variant=variant;draft.actualDose=String(dose);return true;
}
function dosePilotRecord(rule,draft,recommendation){
 const dose=dosePilotNumber(draft.actualDose),stamp=stampCare({local:draft.local});
 if(dose===null||!stamp)return null;
 const route=rule.route||draft.actualRoute||'',referenceDose=draft.variant==='caution'?recommendation.cautionDose:recommendation.dose,name=rule.medicineNames?draft.actualName:rule.name;
 if(rule.medicineNames&&!rule.medicineNames.includes(name))return null;
 if(rule.routeRequired&&!(rule.routes||['IV','IO','IM','IN','PO','SL','SC','Nebulised','Inhaled','Topical','Other']).includes(route))return null;
 const ref=PILOT_REFS.get(rule.referenceId),time=new Date().toISOString();
 const context=rule.legacyPlacement?'':rule.sourceBatch==='Remaining EAS medicines'?'Adult · '+route:rule.mode==='fixed'?'Adult · '+rule.route:rule.label;
 const record={...stamp,kind:'drug',name,dose:String(dose),unit:rule.unit,route,details:context+(draft.notes?' · '+draft.notes:''),id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'event-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),enteredAt:time,recordedFromGuideline:true,
  source:pilotEventSource(ref,{id:rule.id,wording:rule.wording,context:rule.dosingRules.map(p=>p.text).join('\n'),sectionId:rule.sectionId,passageId:rule.passageId}),
  doseCalculation:{schemaVersion:3,ruleId:rule.id,ruleHash:rule.ruleHash,...recommendation,selectedVariant:draft.variant||'standard',selectedReferenceDose:referenceDose,initialConfirmedDose:dose,overridden:referenceDose!==undefined&&dose!==referenceDose,ruleSnapshot:cloneCare(rule)}};
 if(recommendation.weight)state.dosingWeight={kg:recommendation.weight,confirmedAt:time};
 state.careEvents.push(record);changed();pilotRefreshLogFeedback(record);toast('Logged '+pilotRecordLabel(record));return record;
}
function dosePilotConfirm(ruleId){
 const rule=dosePilotRule(ruleId),draft=dosePilotDrafts.get(ruleId);if(!rule||!draft||draft.stage!=='confirm')return null;
 if(rule.interaction!=='clock')return null;
 const recommendation=draft.manual?{method:'manual',description:'Manual actual dose · no calculated or table-selected dose.'}:dosePilotCalculate(rule,draft);
 if(recommendation.error){draft.error=recommendation.error;return null;}
 if(dosePilotNumber(draft.actualDose)===null){draft.error='Enter the actual positive dose in '+rule.unit+'.';return null;}
 if(!stampCare({local:draft.local})){draft.error='Enter a valid administration time.';return null;}
 if(rule.routeRequired&&!(rule.routes||['IV','IO','IM','IN','PO','SL','SC','Nebulised','Inhaled','Topical','Other']).includes(draft.actualRoute)){draft.error='Select the actual administration route.';return null;}
 // Consume this confirmation before writing, so a duplicate submit cannot log twice.
 dosePilotDrafts.delete(ruleId);dosePilotRefresh(ruleId);
 return dosePilotRecord(rule,draft,recommendation);
}
function dosePilotEvidence(rule){return `<details class="dose-pilot-evidence"><summary>Published dosing rules, contraindications and cautions</summary>${[['Dosing rules','dosingRules'],['Contraindications','contraindications'],['Cautions','cautions']].map(([title,key])=>`<section data-dose-pilot-evidence="${key}"><h4>${title}</h4>${rule[key].map(p=>`<p>${esc(p.text)}</p>`).join('')}</section>`).join('')}<p class="subtle">Reference only · no contraindication check is recorded.</p></details>`;}
function dosePilotForm(rule,draft){
 if(draft.stage==='medicine')return `<div class="dose-pilot-form"><p class="dose-pilot-title">${esc(rule.label)} · choose medicine to record</p><div class="dose-pilot-actions"><button type="button" class="quiet" data-dose-pilot-cancel="${rule.id}">Cancel</button>${rule.medicineNames.map(name=>`<button type="button" data-dose-pilot-medicine="${esc(name)}" data-dose-pilot-owner="${rule.id}" aria-label="Record ${esc(name)} ${rule.dose} ${esc(rule.unit)} ${esc(rule.route)}">${esc(name)}</button>`).join('')}</div></div>`;
 const field=(key,label,mode='decimal')=>`<label>${label}<input data-dose-pilot-field="${key}" inputmode="${mode}" value="${esc(draft[key])}" autocomplete="off"></label>`;
 const inputs=`<div class="dose-pilot-fields"><span class="dose-pilot-wide">${field('weight','Weight (kg)')}</span></div>`;
 const result=draft.recommendation||{},caution=result.cautionDose!==undefined&&!draft.manual;
 const choices=caution?`<div class="dose-pilot-variants" role="group" aria-label="Reference dose options"><button type="button" class="quiet" data-dose-pilot-variant="standard" data-dose-pilot-owner="${rule.id}" aria-pressed="${draft.variant!=='caution'}">Use ${esc(result.dose)} ${esc(rule.unit)}</button><button type="button" class="quiet" data-dose-pilot-variant="caution" data-dose-pilot-owner="${rule.id}" aria-pressed="${draft.variant==='caution'}">Use ${esc(result.cautionDose)} ${esc(rule.unit)} if caution applies</button></div><p class="dose-pilot-working">${esc(result.cautionDescription)}</p>`:'';
 const route=rule.route?`<input value="${esc(rule.route)}" readonly aria-label="Dose pilot route">`:`<select data-dose-pilot-field="actualRoute">${options(rule.routes||['IV','IO','IM','IN','PO','SL','SC','Nebulised','Inhaled','Topical','Other'],draft.actualRoute,'Select actual route…')}</select>`;
 const confirmation=`<p class="dose-pilot-result">${draft.manual?'Actual dose entry':`${rule.mode==='fixed'?'Published dose':'Calculated dose'}: <strong>${esc(result.dose)} ${esc(rule.unit)}${rule.route?' '+esc(rule.route):''}</strong>`}</p><p class="dose-pilot-working">${esc(result.description)}</p>${choices}<div class="dose-pilot-fields">${field('actualDose','Actual dose ('+esc(rule.unit)+')')}<label>Route${route}</label><label class="dose-pilot-wide">Administration time<input type="datetime-local" data-dose-pilot-field="local" value="${esc(draft.local)}"></label><label class="dose-pilot-wide">Details<input data-dose-pilot-field="notes" value="${esc(draft.notes)}" autocomplete="off"></label></div>`;
 return `<form class="dose-pilot-form" data-dose-pilot-form="${rule.id}"><p class="dose-pilot-title">${esc(rule.name)} · ${esc(rule.label)}</p><p class="subtle">Adult dosing pilot · reference until confirmed</p>${dosePilotEvidence(rule)}${draft.stage==='confirm'?confirmation:inputs}<p class="error" data-dose-pilot-error role="alert" ${draft.error?'':'hidden'}>${esc(draft.error)}</p><div class="dose-pilot-actions"><button type="button" class="quiet" data-dose-pilot-cancel="${rule.id}">Cancel</button>${draft.stage==='confirm'?`${rule.mode==='weight'?`<button type="button" class="quiet" data-dose-pilot-change="${rule.id}">Change inputs</button>`:''}<button type="submit">Confirm & record</button>`:`<button type="button" class="quiet" data-dose-pilot-manual="${rule.id}">Manual dose</button><button type="submit">Review dose</button>`}</div></form>`;
}
function dosePilotRefresh(ruleId){
 for(const root of [$('diagnosisPane'),$('drugGuidanceContent')])for(const slot of root?.querySelectorAll('[data-dose-pilot-slot]')||[]){
  if(slot.dataset.dosePilotSlot!==ruleId)continue;
  const draft=dosePilotDrafts.get(ruleId),rule=dosePilotRule(ruleId);slot.innerHTML=draft&&rule?dosePilotForm(rule,draft):'';
 }
}
function dosePilotTableChoice(ruleId,bandIndex,column){
 const rule=dosePilotRule(ruleId),band=rule?.bands?.[bandIndex];
 if(rule?.interaction!=='table-pick'||!Number.isInteger(bandIndex)||!band||!['younger','older'].includes(column))return null;
 return {rule,band,dose:band[column+'Dose'],publishedVolume:band[column+'Volume'],ageColumn:column==='older'?'Age 75 years or older':'Age less than 75 years'};
}
function dosePilotTableBinding(index){
 const binding=DOSE_PILOT.tableBindings[index],ref=binding&&PILOT_REFS.get(binding.referenceId);
 if(!Number.isInteger(index)||!ref||ref.sourceHash!==binding.sourceHash||!dosePilotTableChoice(binding.ruleId,binding.bandIndex,binding.column))return null;
 const page=ref.pages.find(p=>p.id===binding.sectionId);
 return page?.passages.some(p=>p.id===binding.passageId)?binding:null;
}
function dosePilotSelectTableDose(ruleId,bandIndex,column,bindingIndex=null){
 const choice=dosePilotTableChoice(ruleId,bandIndex,column);if(!choice)return false;
 if(bindingIndex===null)bindingIndex=DOSE_PILOT.tableBindings.findIndex(b=>b.ruleId===ruleId&&b.referenceId===choice.rule.referenceId&&b.bandIndex===bandIndex&&b.column===column);
 const binding=dosePilotTableBinding(bindingIndex);if(!binding||binding.ruleId!==ruleId||binding.bandIndex!==bandIndex||binding.column!==column)return false;
 const {rule,band,dose,publishedVolume,ageColumn}=choice,ref=PILOT_REFS.get(binding.referenceId);
 const sameEntry=$('careModal').open&&careView==='drug'&&eventDraft?.kind==='drug'&&eventDraft.index===null&&drugReferenceName(eventDraft.name)===rule.name;
 const origin=sameEntry?null:pilotCapture();
 if(!sameEntry){
  if($('careModal').open)stashCareDraft();
  const sourceKey='source:'+rule.id,normalKey=careDraftKey('drug',null);
  const saved=pendingCare[sourceKey]||pendingCare[normalKey];
  const resume=saved?.view==='drug'&&saved.eventDraft?.index===null&&drugReferenceName(saved.eventDraft.name)===rule.name;
  eventDraft=resume?cloneCare(saved.eventDraft):{...freshCareTime(),name:rule.name,kind:'drug',index:null,dose:'',unit:'',route:'',details:'',sourceDraft:true};
  careView='drug';
 }
 Object.assign(eventDraft,{name:rule.name,drugSelected:true,dose:String(dose),unit:rule.unit,route:rule.route,
  source:pilotEventSource(ref,{id:rule.id,wording:binding.wording,context:band.label+' · '+ageColumn,sectionId:binding.sectionId,passageId:binding.passageId}),
  doseTableSelection:{schemaVersion:1,selectedName:rule.name,ruleId:rule.id,ruleHash:rule.ruleHash,selectedDose:dose,unit:rule.unit,route:rule.route,band:band.label,ageColumn,publishedVolume,binding:cloneCare(binding),selectedAt:new Date().toISOString(),ruleSnapshot:cloneCare(rule)}});
 if(sameEntry){
  for(const key of ['name','dose','unit','route']){const field=$('careModal').querySelector('[data-care-field="'+key+'"]');if(field)field.value=eventDraft[key];}
 }else{
  renderCare();$('careModal').show();
  // Keep the selected table, its expanded sections and reading position visible.
  if(origin?.pane==='clinical')pilotShow(origin.id,{restore:origin,back:true});
  else{for(const d of $('drugGuidanceContent').querySelectorAll('details[data-pilot-section]'))d.open=origin.expanded.includes(d.dataset.pilotSection);$('drugPane').scrollTop=origin.scroll;}
 }
 setReferenceExpanded(false);toast('Dose added to Add Drug · not recorded');return true;
}
function dosePilotHydrateTable(article){
 const tables=new Set();
 DOSE_PILOT.tableBindings.forEach((candidate,index)=>{
  if(candidate.referenceId!==article.dataset.pilotSource)return;
  const binding=dosePilotTableBinding(index);if(!binding)return;
  const row=article.querySelector('[data-passage="'+binding.passageId+'"]'),cell=row?.children[binding.cellIndex];
  if(!cell||cell.textContent.trim().replace(/\s+/g,' ')!==binding.wording||cell.querySelector('[data-dose-pilot-table]'))return;
  const choice=dosePilotTableChoice(binding.ruleId,binding.bandIndex,binding.column);
  const button=document.createElement('button');button.type='button';button.className='dose-table-pick';button.dataset.dosePilotTable=binding.ruleId;button.dataset.dosePilotBand=String(binding.bandIndex);button.dataset.dosePilotColumn=binding.column;button.dataset.dosePilotBinding=String(index);
  button.setAttribute('aria-label','Use '+choice.dose+' '+choice.rule.unit+' '+choice.rule.route+' · '+choice.band.label+' · '+choice.ageColumn+' in Add Drug');
  button.title='Fill Add Drug · does not record administration';while(cell.firstChild)button.append(cell.firstChild);cell.append(button);tables.add(row.closest('table'));
 });
 for(const table of tables){if(!table)continue;table.classList.add('dose-pilot-table');if(!table.previousElementSibling?.classList.contains('dose-table-hint')){const hint=document.createElement('p');hint.className='dose-table-hint';hint.textContent='Tap a dose to fill Add Drug. Record confirms administration.';table.insertAdjacentElement('beforebegin',hint);}}
}
const dosePilotBaseHydrate=pilotHydrate;
pilotHydrate=function(root){
 dosePilotBaseHydrate(root);
 for(const article of root.querySelectorAll('[data-pilot-source]')){
  const ref=PILOT_REFS.get(article.dataset.pilotSource);
  for(const button of article.querySelectorAll('[data-pilot-admin]'))if(ref?.administrations.find(a=>a.id===button.dataset.pilotAdmin)?.quickLog?.name==='Tenecteplase'){
   delete button.dataset.pilotAdmin;delete button.dataset.pilotOwner;button.classList.remove('pilot-admin');button.textContent='Choose dose';button.setAttribute('aria-label','Choose tenecteplase dose');button.title='Open tenecteplase dosing table';button.dataset.pilotRef='cpg-eas-14-45';button.dataset.pilotHitSection=dosePilotRules.get('dose-pilot:tenecteplase-adult-stemi-iv-v1').sectionId;
  }
  dosePilotHydrateTable(article);
  for(const candidate of dosePilotRules.values()){
  if(candidate.referenceId!==article.dataset.pilotSource)continue;
  if(candidate.legacyPlacement)for(const old of article.querySelectorAll('[data-pilot-admin]'))if(old.dataset.pilotAdmin===candidate.id&&!old.dataset.dosePilotRule)old.remove();
  const rule=dosePilotRule(candidate.id),node=article.querySelector('[data-passage="'+candidate.passageId+'"]');if(!node||!rule||node.querySelector('[data-dose-pilot-rule]'))continue;
  if(rule.interaction==='table-pick')continue;
  const actionName=dosePilotSelectedMedicine(rule)||rule.name;
  const controls=document.createElement('div');controls.className='dose-pilot-controls';controls.innerHTML=`<span class="dose-pilot-label">${esc(rule.label)}</span><button type="button" class="quiet pilot-admin" data-pilot-admin="${rule.id}" data-pilot-owner="${rule.referenceId}" data-dose-pilot-rule="${rule.id}" title="${rule.mode==='fixed'?'Record adult dose':'Review adult dose'}" aria-label="${rule.mode==='fixed'?'Record':'Review'} ${esc(actionName)} ${esc(rule.label)}">${pilotIcon('clock')}</button><div class="dose-pilot-slot" data-dose-pilot-slot="${rule.id}"></div>`;node.append(controls);
  // Keep the final word and clock together so the icon cannot occupy a row.
  const tail=controls.previousSibling,match=tail?.nodeType===3&&/\S+\s*$/.exec(tail.textContent);
  if(match){const inline=document.createElement('span');inline.className='dose-pilot-inline';inline.append(tail.textContent.slice(match.index),controls.querySelector('[data-dose-pilot-rule]'));tail.textContent=tail.textContent.slice(0,match.index);controls.before(inline);}
  dosePilotRefresh(rule.id);
  }
 }
};
const dosePilotBaseStart=pilotStart;
pilotStart=function(referenceId,actionId){if(PILOT_REFS.get(referenceId)?.administrations.find(a=>a.id===actionId)?.quickLog?.name==='Tenecteplase')return null;const candidate=dosePilotRules.get(actionId);if(!candidate)return dosePilotBaseStart(referenceId,actionId);return candidate.referenceId===referenceId?dosePilotBegin(actionId):null;};
document.addEventListener('input',e=>{
 const key=e.target.dataset.dosePilotField,form=e.target.closest('[data-dose-pilot-form]'),draft=form&&dosePilotDrafts.get(form.dataset.dosePilotForm);if(!key||!draft)return;
 if(['weight','actualDose','actualRoute','local','notes'].includes(key))draft[key]=e.target.value;
});
// Selects use change on tablet browsers; inputs are retained without rerendering.
document.addEventListener('change',e=>{if(e.target.tagName==='SELECT'&&e.target.dataset.dosePilotField){const form=e.target.closest('[data-dose-pilot-form]'),draft=form&&dosePilotDrafts.get(form.dataset.dosePilotForm);if(draft)draft[e.target.dataset.dosePilotField]=e.target.value;}});
document.addEventListener('submit',e=>{
 const id=e.target.dataset.dosePilotForm,draft=dosePilotDrafts.get(id);if(!id||!draft)return;e.preventDefault();
 if(draft.stage==='confirm')dosePilotConfirm(id);else dosePilotReview(id);dosePilotRefresh(id);
});
document.addEventListener('click',e=>{
 const medicine=e.target.closest('[data-dose-pilot-medicine]');if(medicine){e.preventDefault();dosePilotChooseMedicine(medicine.dataset.dosePilotOwner,medicine.dataset.dosePilotMedicine);return;}
 const table=e.target.closest('[data-dose-pilot-table]');if(table){e.preventDefault();dosePilotSelectTableDose(table.dataset.dosePilotTable,Number(table.dataset.dosePilotBand),table.dataset.dosePilotColumn,Number(table.dataset.dosePilotBinding));return;}
 const variant=e.target.closest('[data-dose-pilot-variant]');if(variant){e.preventDefault();dosePilotChooseVariant(variant.dataset.dosePilotOwner,variant.dataset.dosePilotVariant);dosePilotRefresh(variant.dataset.dosePilotOwner);return;}
 const b=e.target.closest('[data-dose-pilot-cancel],[data-dose-pilot-manual],[data-dose-pilot-change]');if(!b)return;e.preventDefault();
 const id=b.dataset.dosePilotCancel||b.dataset.dosePilotManual||b.dataset.dosePilotChange;
 if(b.dataset.dosePilotCancel)dosePilotDrafts.delete(id);
 else if(b.dataset.dosePilotManual)dosePilotReview(id,true);
 else{const draft=dosePilotDrafts.get(id);if(draft){draft.stage='inputs';draft.error='';}}
 dosePilotRefresh(id);
});
function dosePilotClearChangedTableDrug(){
 if(!eventDraft?.doseTableSelection||drugReferenceName(eventDraft.name)===(eventDraft.doseTableSelection.selectedName||'Tenecteplase'))return;
 if(eventDraft.sourceDraft)delete pendingCare['source:'+eventDraft.source.actionId];
 delete eventDraft.doseTableSelection;delete eventDraft.source;delete eventDraft.sourceDraft;
}
for(const type of ['input','change','click'])document.addEventListener(type,dosePilotClearChangedTableDrug);
const dosePilotBaseClear=clearCareDrafts;
clearCareDrafts=function(){const ids=[...dosePilotDrafts.keys()];dosePilotDrafts.clear();for(const id of ids)dosePilotRefresh(id);dosePilotBaseClear();};
