/* Fast entry controls. Clinical thresholds and source guidance are unchanged.
 * Keyboard entry is the default; the original ink sheet remains opt-in.
 * Keep observation values separate from NEWS completeness and UI focus state.
 */
const VITAL_ENTRY_KEYS=['gcs','rr','hr','spo2','sbp','dbp','temp','bgl','etco2','crt'];
let vitalEntryMode='keyboard',vitalFocusKey='gcs';
const comboHighlight=new Map();

function focusEntryField(kind){
 const field=document.querySelector(kind==='dose'?'#careModal [data-care-field="dose"]':kind==='name'?'#careModal [data-care-field="name"]':'#careModal [data-care-field="details"]');
 field?.focus();
}
function advanceSelectedEntry(){focusEntryField(eventDraft?.name?(eventDraft.kind==='drug'?'dose':'details'):'name');}

// One shared ARIA pattern for searchable drug and guideline dropdowns.
function comboFor(input){
 if(input?.id==='careDrugName')return {input,list:$('drugMatches'),render:renderDrugMatches};
 if(input?.id==='guidelineSearch')return {input,list:$('guidelineMatches'),render:renderGuidelineMatches};
 return null;
}
function comboItems(combo){return combo.list?[...combo.list.querySelectorAll('[role="option"]')]:[];}
function decorateCombo(combo){
 if(!combo?.list)return;
 comboHighlight.set(combo.input.id,-1);
 combo.input.removeAttribute('aria-activedescendant');
 comboItems(combo).forEach((option,i)=>{
  option.id=combo.input.id+'-option-'+i;
  option.dataset.keyboardActive='false';
 });
}
function highlightCombo(combo,index){
 const items=comboItems(combo);if(!items.length)return;
 const next=Math.max(0,Math.min(index,items.length-1));comboHighlight.set(combo.input.id,next);
 items.forEach((option,i)=>{option.dataset.keyboardActive=String(i===next);});
 combo.input.setAttribute('aria-activedescendant',items[next].id);
 items[next].scrollIntoView({block:'nearest'});
}
function closeCombo(combo){combo.list.hidden=true;combo.input.setAttribute('aria-expanded','false');combo.input.removeAttribute('aria-activedescendant');comboHighlight.set(combo.input.id,-1);}
function chooseCombo(combo,index){const option=comboItems(combo)[index];if(!option)return false;option.click();combo.input.removeAttribute('aria-activedescendant');comboHighlight.set(combo.input.id,-1);return true;}
const fastRenderDrugMatches=renderDrugMatches;
renderDrugMatches=function(){fastRenderDrugMatches();decorateCombo(comboFor($('careDrugName')));};
const fastRenderGuidelineMatches=renderGuidelineMatches;
renderGuidelineMatches=function(){fastRenderGuidelineMatches();decorateCombo(comboFor($('guidelineSearch')));};
const fastProcedureEntry=chooseProcedureEntry;
chooseProcedureEntry=function(kind,name=''){fastProcedureEntry(kind,name);advanceSelectedEntry();};

// Optional readings: validate supplied numbers and compare BP only if both exist.
vitalErrors=function(d){
 const errors=[];
 for(const key of Object.keys(CARE_CONFIG.vitals))if(Number.isNaN(numericVital(d.values[key],key)))errors.push(CARE_CONFIG.vitals[key].label+': enter a valid '+(CARE_CONFIG.vitals[key].step===1?'whole number':'number (one decimal maximum)')+'.');
 const s=numericVital(d.values.sbp,'sbp'),b=numericVital(d.values.dbp,'dbp');
 if(vitalIsPalpated(d)&&!Number.isFinite(s))errors.push('Enter systolic BP for a palpated reading.');
 if(Number.isFinite(s)&&Number.isFinite(b)&&s<b)errors.push('Systolic BP cannot be lower than diastolic BP.');
 return errors;
};
const paperVitalsEditor=vitalsEditor;
vitalsEditor=function(){
 const paper=paperVitalsEditor();
 if(vitalEntryMode==='touch')return '<div class="vitals-mode-toolbar"><h2>Vitals</h2><button class="quiet" data-vitals-mode="keyboard">Keyboard mode</button></div>'+paper;
 const context=paper.slice(paper.indexOf('<details class="prototype-context">'));
 return `<div class="vitals-mode-toolbar"><h2>Vitals</h2><button class="quiet" data-vitals-mode="touch">Touch-screen mode</button></div><div class="vitals-entry-layout">${gcsQuickEntry()}<table class="vitals-entry-table"><thead><tr><th>Vital</th><th>Reading</th><th>Unit</th><th><span class="sr-only">GCS components</span></th></tr></thead><tbody>${VITAL_ENTRY_KEYS.map(key=>{
  if(key==='gcs')return '';
  const meta=CARE_CONFIG.vitals[key];
  const palpated=key==='dbp'&&vitalIsPalpated(vitalDraft);
  return `<tr data-keyboard-vital="${key}"><th scope="row"><label for="vital-entry-${key}">${meta.label}</label></th><td><div class="vital-reading-pair"><input id="vital-entry-${key}" type="text" inputmode="${meta.step===.1?'decimal':'numeric'}" autocomplete="off" enterkeyhint="next" data-vital="${key}" aria-label="${meta.label}" value="${esc(palpated?'palpated':vitalDraft.values[key]??'')}" ${palpated?'readonly':''} placeholder="—">${key==='spo2'?vitalOxygenFlowInput():''}${vitalLimitControls(key)}</div></td><td>${meta.unit}</td><td class="vital-context-cell">${vitalContextControls(key)}</td></tr>`;
 }).join('')}</tbody></table><div id="newsResult" class="keyboard-news-result" aria-live="polite"></div>${context}`;
};
const fastNewsDisplay=updateNewsDisplay;
updateNewsDisplay=function(){
 fastNewsDisplay();
 if(vitalEntryMode!=='keyboard')return;
 const n=news2(vitalDraft);
 for(const key of VITAL_ENTRY_KEYS){const row=document.querySelector('[data-keyboard-vital="'+key+'"]');if(row)row.className='neutral-vital';}
 $('newsResult').innerHTML=`<p class="news-total news-${n.band}">${newsLabel(n)}</p>${n.total===null?'<span class="subtle">Missing readings remain unrecorded.</span>':''}`;
};
const fastInkInit=initInkFields;
initInkFields=function(){if(vitalEntryMode==='touch')fastInkInit();};
const fastCareRender=renderCare;
renderCare=function(keepScroll=false){
 fastCareRender(keepScroll);
 $('careModal').classList.toggle('keyboard-vitals',careView==='vitals'&&vitalEntryMode==='keyboard');
 if(careView!=='vitals')return;
 const mode=$('careModal').querySelector('.entry-mode');if(mode)mode.textContent='VITALS';
 if(vitalEntryMode==='keyboard')requestAnimationFrame(()=>{
  if(careView==='vitals'&&$('careModal').open&&!document.activeElement?.matches?.('[data-gcs-word]'))$('vital-entry-'+vitalFocusKey)?.focus();
 });
};

// A column per observation set; all vital signs stay visible as readable rows.
recordedVitalsTable=function(){
 const sets=(state.vitalSets||[]).map((e,i)=>({e,i})).sort((a,b)=>new Date(a.e.at)-new Date(b.e.at));
 const rows=[['gcs','GCS','/15'],['rr','RR','/min'],['hr','HR','/min'],['spo2','SpO₂','%'],['bp','BP','mmHg'],['temp','Temp','°C'],['bgl','BGL','mmol/L'],['etco2','EtCO₂','mmHg'],['crt','CRT','s'],['news','NEWS2','']];
 const reading=v=>v==null||String(v).trim()===''?'—':v;
 const value=(e,key)=>{
  if(key==='gcs')return gcsTotal(e.gcs||{})??(reading(e.values?.gcs)!=='—'?e.values.gcs:Object.values(e.gcs||{}).includes('NT')?'NT':'—');
  if(key==='bp'){const systolic=reading(e.values?.sbp),diastolic=reading(e.values?.dbp);return systolic==='—'&&diastolic==='—'?'—':systolic+' / '+diastolic;}
  if(key==='news')return news2(e).total??'—';
  return reading(e.values?.[key]);
 };
 const context=(e,key)=>key==='gcs'?(Object.keys(e.gcs||{}).length?['eye','verbal','motor'].map((k,i)=>'EVM'[i]+(e.gcs[k]??'—')).join(' '):String(e.values?.gcs??'').trim()?'Breakdown not recorded':''):key==='spo2'?(e.oxygen==='Air'?'RA':e.oxygen==='Oxygen'?'On O₂'+(e.values?.o2flow!==undefined?' · '+e.values.o2flow+' L/min':''):''):key==='etco2'&&e.values?.etco2!==undefined?e.etco2Method||'':key==='crt'&&e.values?.crt!==undefined?e.crtSite||'':'';
 return `<section class="record-table-section vitals-matrix-section"><h2>Vitals</h2>${sets.length?`<div class="table-scroll"><table class="clinical-table vitals-matrix" style="min-width:${90+sets.length*96}px"><thead><tr><th scope="col">Vital</th>${sets.map(({e})=>`<th scope="col">${esc(compactActionTime(e))}</th>`).join('')}</tr></thead><tbody>${rows.map(([key,label,unit])=>`<tr><th scope="row">${label}<small>${unit}</small></th>${sets.map(({e,i})=>{const n=news2(e),point=n.points[key==='bp'?'sbp':key==='gcs'?'consciousness':key];return `<td data-vitals-column="${i}" data-vitals-key="${key}" tabindex="0" aria-label="${esc(label)} ${esc(value(e,key))} ${esc(context(e,key))}, ${esc(compactActionTime(e))}. Double-tap to edit observation set." class="${key==='news'?'news-'+n.band:'vital-reading'}" ${key==='news'?`title="${esc(newsLabel(n))}"`:''}>${esc(value(e,key))}${context(e,key)?`<small class="vital-record-context">${esc(context(e,key))}</small>`:''}</td>`;}).join('')}</tr>`).join('')}</tbody><tfoot><tr><th scope="row"><span class="sr-only">Edit observation set</span></th>${sets.map(({e,i})=>`<td><button class="quiet" data-care-edit="vitals" data-index="${i}" aria-label="Edit vitals at ${esc(compactActionTime(e))}">Edit</button><button class="quiet" data-care-remove="vitals" data-index="${i}" aria-label="Remove vitals at ${esc(compactActionTime(e))}">×</button></td>`).join('')}</tr></tfoot></table></div>`:'<p class="subtle">No readings</p>'}</section>`;
};
recordedTables=function(){return recordRemovalMarkup()+recordedVitalsTable()+recordedActionTable();};
const fastCareScreen=careScreen;
careScreen=function(){return fastCareScreen().replace('Recorded care ·','Entries ·');};

// Record tables have no extra header; the global Guidance toggle stays available.
const fastOpenReference=openReference;
openReference=function(pane){fastOpenReference(pane);$('referenceDock').dataset.pane=pane;};

function moveVitalFocus(input,direction){
 const keys=VITAL_ENTRY_KEYS.flatMap(key=>key==='spo2'&&vitalDraft?.oxygen==='Oxygen'?[key,'o2flow']:[key]);
 const fields=keys.map(key=>$('vital-entry-'+key)).filter(field=>field&&!field.readOnly&&!field.disabled),index=fields.indexOf(input),next=fields[index+direction];
 if(next){next.focus();next.select?.();return true;}
 if(direction>0){$('careModal').querySelector('[data-care-save]')?.focus();return true;}
 return false;
}
// Keep focus changes synchronous with the tap/key so mobile keyboards can open.
function focusGcsColumn(key){
 const root=$('careModal');
 const button=root.querySelector('[data-gcs-word="'+key+'"][aria-pressed="true"]')||root.querySelector('[data-gcs-word="'+key+'"]');
 vitalFocusKey='gcs';button?.focus();
}
function chooseGcsResponse(key,value){
 if(!setQuickGcs(key,value))return false;
 if(gcsComplete(vitalDraft.gcs)){
  vitalFocusKey='rr';
  const next=$('careModal').querySelector('[data-vital="rr"]');
  next?.focus();next?.select?.();
 }else{
  const next=['motor','verbal','eye'].find(k=>!CARE_CONFIG.gcs[k].options.some(x=>x[0]===vitalDraft.gcs?.[k]));
  focusGcsColumn(next);
 }
 return true;
}
function openVitalsShortcut(){
 if(typeof notesTutorialDialog!=='undefined'&&notesTutorialDialog?.open)closeNotesTutorial();
 for(const id of ['wheelModal','repeatWheelModal'])if($(id)?.open)$(id).close();
 if(careView!=='vitals'||!$('careModal').open)openCare('vitals');
 const next=['motor','verbal','eye'].find(k=>!CARE_CONFIG.gcs[k].options.some(x=>x[0]===vitalDraft.gcs?.[k]));
 if(next)focusGcsColumn(next);else{vitalFocusKey='rr';$('careModal').querySelector('[data-vital="rr"]')?.focus();}
}
document.addEventListener('focusin',e=>{if(e.target.dataset?.vital)vitalFocusKey=e.target.dataset.vital;else if(e.target.dataset?.gcsWord)vitalFocusKey='gcs';});
document.addEventListener('keydown',e=>{
 if(e.isComposing){if(comboFor(e.target))e.stopImmediatePropagation();return;}
 if(e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.shiftKey&&String(e.key).toLowerCase()==='v'){
  e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)openVitalsShortcut();return;
 }
 const input=e.target,combo=comboFor(input);
 const gcsButton=input.closest?.('[data-gcs-word]');
 if(careView==='vitals'&&$('careModal').open&&gcsButton&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&/^[0-9]$/.test(e.key)){
  e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)chooseGcsResponse(gcsButton.dataset.gcsWord,e.key);return;
 }
 if(combo){
  if(['ArrowDown','ArrowUp'].includes(e.key)){
   e.preventDefault();e.stopImmediatePropagation();
   const wasClosed=combo.list.hidden;if(wasClosed)combo.render();
   const index=comboHighlight.get(input.id)??-1;
   highlightCombo(combo,wasClosed||index<0?(e.key==='ArrowUp'?comboItems(combo).length-1:0):index+(e.key==='ArrowUp'?-1:1));return;
  }
  if(e.key==='Escape'&&!combo.list.hidden){e.preventDefault();e.stopImmediatePropagation();closeCombo(combo);return;}
  if(e.key==='Enter'||e.key==='Tab'&&!e.shiftKey){
   const items=comboItems(combo),active=combo.list.hidden?-1:(comboHighlight.get(input.id)??-1);
   const exact=items.findIndex(option=>(option.dataset.drugChoice||option.dataset.guidelinePick||option.textContent).trim().toLowerCase()===input.value.trim().toLowerCase());
   const index=active>=0?active:exact>=0?exact:e.key==='Enter'&&!combo.list.hidden?0:-1;
   if(index>=0){e.preventDefault();e.stopImmediatePropagation();chooseCombo(combo,index);return;}
   if(input.id==='careDrugName'&&input.value.trim()){e.preventDefault();e.stopImmediatePropagation();closeCombo(combo);focusEntryField('dose');return;}
  }
 }
 if(careView==='vitals'&&vitalEntryMode==='keyboard'&&input.matches?.('.vitals-entry-table [data-vital]')){
  if(['Enter','Tab','ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)){
   const direction=['ArrowUp','ArrowLeft'].includes(e.key)||e.shiftKey?-1:1;
   if(moveVitalFocus(input,direction)){e.preventDefault();e.stopImmediatePropagation();}return;
  }
 }
 if(input.matches?.('#careModal input[data-care-field]')&&['Enter','ArrowDown'].includes(e.key)){
  const fields=[...$('careModal').querySelectorAll('[data-care-field]')],next=fields[fields.indexOf(input)+1];
  if(next){e.preventDefault();e.stopImmediatePropagation();next.focus();}
 }
},true);
document.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.drugChoice){$('careDrugName')?.removeAttribute('aria-activedescendant');advanceSelectedEntry();}
 if(button.dataset.vitalsMode){vitalEntryMode=button.dataset.vitalsMode;renderCare();}
});
// The existing walkthrough now describes the keyboard table and optional sheet.
const keyboardTour=APP_TOUR.find(s=>s.short==='Vitals');if(keyboardTour)Object.assign(keyboardTour,{left:['Keyboard table by default','Enter / Tab / arrows → next','Touch-screen mode → handwriting'],right:['Any vital can be blank','Review values before Save','NEWS incomplete if readings missing'],description:'Use the keyboard table to record any available vital signs. Enter, Tab or arrow keys move between readings. No individual reading, including either BP value, is mandatory. NEWS remains incomplete without its scoring inputs. Touch-screen mode opens the existing handwriting sheet; review recognised values before saving. Recorded vitals are shown in rows, with observation times in columns and interventions below.'});

const fastOpenCare=openCare;
openCare=function(kind,index=null){fastOpenCare(kind,index);if(['drug','intervention'].includes(kind))advanceSelectedEntry();};

/* Local entry refinements. These preferences never imply treatment occurred. */
const DEFAULT_TOP_DRUGS=['Fentanyl','Ondansetron','0.9% sodium chloride','Adrenaline','Midazolam','Paracetamol','Ibuprofen','Aspirin'];
const entryPriorityDrugs=priorityDrugs;
priorityDrugs=function(query='',procedure=''){
 const matches=entryPriorityDrugs(query,procedure);
 if(procedure==='RSI'||selectedGuidelines().length)return matches;
 const rank=name=>{const i=DEFAULT_TOP_DRUGS.indexOf(name);return i<0?Infinity:i;};
 return matches.sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b,'en',{sensitivity:'base'}));
};

// IV uses the same native inline care editor and saved equipment schema.
// Airway / IO and the cardiac arrest workspace retain their existing controls.
const IV_ENTRY_SIZES=['24','22','20','18','16'];
const IV_ENTRY_COLOURS=['#f4cc28','#439be0','#ef99ba','#68b88b','#aeb2b3'];
function ivEntryChoices(key,label,values){
 const data=eventDraft.pocketEquipment||{};
 return `<fieldset class="native-iv-choices"><legend>${label}</legend>${values.map((value,i)=>`<button type="button" class="quiet" data-iv-field="${key}" data-iv-value="${value}" aria-pressed="${data[key]===value}" ${key==='size'?`style="--iv-colour:${IV_ENTRY_COLOURS[i]}"`:''}>${value}${key==='size'?'G':''}</button>`).join('')}</fieldset>`;
}
function nativeIvEditor(){return `<section class="native-iv-entry"><h3>IV cannulation</h3>${ivEntryChoices('size','Cannula size',IV_ENTRY_SIZES)}${ivEntryChoices('side','Side',['Left','Right'])}${ivEntryChoices('site','Location',['ACF','Forearm','Hand','Foot','EJ'])}${ivEntryChoices('outcome','Outcome',['Successful','Unsuccessful'])}<label>Notes<textarea rows="1" data-care-field="details" placeholder="Notes…">${esc(eventDraft.details||'')}</textarea></label></section>`;}
const nativeEventEditor=eventEditor;
eventEditor=function(procedure=false){return !procedure&&eventDraft?.pocketProcedure==='iv'?nativeIvEditor():nativeEventEditor(procedure);};
const framedNotesEquipment=openNotesEquipment;
openNotesEquipment=function(group,index=null){
 const row=index===null?null:state.careEvents[index];
 if(group!=='iv'&&row?.pocketProcedure!=='iv')return framedNotesEquipment(group,index);
 openCare('intervention',index);
 eventDraft.name='IV cannulation';eventDraft.pocketProcedure='iv';
 eventDraft.pocketEquipment={...(eventDraft.pocketEquipment||{})};
 // Older frame records stored both side and location in `site`.
 const data=eventDraft.pocketEquipment;
 if(data.side&&data.site)data.site=data.site.replace(/^(Left|Right) /,'');
 if(index!==null)eventDraft.details=data.notes||'';
 renderCare();showRecordedEntries();
};
function ivEntryDetails(d){
 const data=d.pocketEquipment,site=[data.side,data.site].filter(Boolean).join(' ');
 return [data.size?'size: '+data.size:'Size not recorded',site?'site: '+site:'',data.outcome?'outcome: '+data.outcome:'',d.details?'notes: '+d.details:''].filter(Boolean).join(' · ');
}
const nativeEntrySave=saveCareEvent;
saveCareEvent=function(keepOpen=false){
 if(eventDraft?.pocketProcedure==='iv'){
  const notes=eventDraft.details||'';
  eventDraft.pocketEquipment={...eventDraft.pocketEquipment,notes,at:eventDraft.local.slice(11,16),confirmation:[]};
  eventDraft.details=ivEntryDetails(eventDraft);
  const saved=nativeEntrySave(keepOpen);
  if(!saved)eventDraft.details=notes;
  return saved;
 }
 return nativeEntrySave(keepOpen);
};

// A clear return control always remains visible; a new complete E/V/M selection
// returns automatically. Editing an already-complete score stays open for review.
let gcsAutoReturn=false;
const entryCareRender=renderCare;
renderCare=function(keepScroll=false){
 entryCareRender(keepScroll);
 $('careModal').classList.toggle('iv-entry',careView==='intervention'&&eventDraft?.pocketProcedure==='iv');
 if(careView==='gcs'){
  gcsAutoReturn=!['eye','verbal','motor'].every(key=>gcsDraft[key]!==undefined);
  const top=$('careModal').querySelector('.care-modal-top');
  if(top)top.insertAdjacentHTML('afterbegin','<button type="button" class="quiet gcs-back" data-gcs-back>← Back to vitals</button>');
 }
 if(eventDraft?.pocketProcedure==='iv'&&careView==='intervention'){
  const mode=$('careModal').querySelector('.entry-mode');if(mode)mode.textContent='IV ACCESS';
 }
};
function acceptGcsAndReturn(){
 vitalDraft.gcs=cloneCare(gcsDraft);vitalDraft.values.gcs=gcsTotal(gcsDraft)??'';
 if(vitalDraft.ink){vitalDraft.inkSource??={};vitalDraft.inkPending??={};vitalDraft.ink.gcs=[];vitalDraft.inkSource.gcs='components';vitalDraft.inkPending.gcs=false;}
 careView='vitals';vitalFocusKey='gcs';renderCare();
}
document.addEventListener('change',e=>{
 if(e.target.dataset.gcs&&careView==='gcs'&&gcsAutoReturn&&['eye','verbal','motor'].every(key=>gcsDraft[key]!==undefined))acceptGcsAndReturn();
});
document.addEventListener('input',e=>{
 const key=e.target.dataset.vital;if(!['temp','bgl'].includes(key))return;
 document.querySelectorAll('[data-vital-limit="'+key+'"]').forEach(button=>button.setAttribute('aria-pressed',String(vitalLimitValue(e.target.value,key)===button.dataset.limitValue)));
});

function setVitalLimit(key,value){
 vitalDraft.values[key]=vitalLimitValue(vitalDraft.values[key],key)===value?'':value;
 // Explicit limit selection supersedes ink and prevents a pending recogniser
 // from silently replacing the clinician's chosen device label.
 if(vitalDraft.ink){vitalDraft.inkPending??={};vitalDraft.inkRevision??={};vitalDraft.inkSource??={};vitalDraft.ink[key]=[];vitalDraft.inkPending[key]=false;vitalDraft.inkRevision[key]=(vitalDraft.inkRevision[key]||0)+1;vitalDraft.inkSource[key]='corrected';}
 vitalFocusKey=key;renderCare();
}
function editVitalsColumn(cell){
 const index=Number(cell.dataset.vitalsColumn);if(!state.vitalSets[index])return;
 const key=cell.dataset.vitalsKey;vitalFocusKey=key==='bp'?'sbp':key==='news'?'gcs':key;
 openCare('vitals',index);
}
document.addEventListener('dblclick',e=>{const cell=e.target.closest('[data-vitals-column]');if(cell)editVitalsColumn(cell);});
// Support touch screens that do not synthesise dblclick after a double tap.
let lastVitalTap=null;
document.addEventListener('pointerup',e=>{
 if(e.pointerType!=='touch')return;const cell=e.target.closest('[data-vitals-column]');
 if(!cell){lastVitalTap=null;return;}
 const now=Date.now();
 if(lastVitalTap?.cell===cell&&now-lastVitalTap.at<450){lastVitalTap=null;editVitalsColumn(cell);}else lastVitalTap={cell,at:now};
});
document.addEventListener('keydown',e=>{const cell=e.target.closest?.('[data-vitals-column]');if(cell&&['Enter',' '].includes(e.key)){e.preventDefault();editVitalsColumn(cell);}});

function setReferenceExpanded(expanded){
 $('appShell').classList.toggle('reference-expanded',expanded);
 const button=$('expandReference');if(!button)return;
 button.textContent=expanded?'→':'←';
 document.body.classList.toggle('notes-reference-expanded',expanded);button.setAttribute('aria-expanded',String(expanded));
 button.setAttribute('aria-label',expanded?'Restore reference sidebar':'Expand reference to full screen');
 button.title=expanded?'Restore sidebar':'Expand reference';
}
// Editors launched from an expanded record table must be visible immediately.
const sidebarEntryOpen=openCare;
openCare=function(kind,index=null){setReferenceExpanded(false);sidebarEntryOpen(kind,index);};
const entryCloseReference=closeReference;
closeReference=function(){setReferenceExpanded(false);entryCloseReference();};
$('closeReference').onclick=closeReference;
document.addEventListener('click',e=>{
 const combo=comboFor(e.target);if(combo){combo.render();return;}
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.ivField){
  const data=eventDraft.pocketEquipment,key=button.dataset.ivField,value=button.dataset.ivValue;
  data[key]=data[key]===value?'':value;renderCare();
 }
 if(button.dataset.gcsBack!==undefined)acceptGcsAndReturn();
 if(button.dataset.vitalLimit)setVitalLimit(button.dataset.vitalLimit,button.dataset.limitValue);
 if(button.id==='expandReference')setReferenceExpanded(button.getAttribute('aria-expanded')!=='true');
});


// The header arrow is available in every documentation and entry view.
function syncSidebarArrow(){
 const open=!!referencePane,button=$('toggleGuidance');
 document.body.classList.toggle('notes-reference-open',open);
 if(button){button.removeAttribute('aria-pressed');button.textContent=open?'›':'‹';button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Collapse sidebar':'Open sidebar');button.title=open?'Collapse sidebar':'Open sidebar';}
 const width=$('referenceDock')?.getBoundingClientRect?.().width;
 if(width>0&&document.body.style.setProperty)document.body.style.setProperty('--notes-reference-width',width+'px');
}
const universalOpenReference=openReference;
openReference=function(pane){universalOpenReference(pane);syncSidebarArrow();requestAnimationFrame(syncSidebarArrow);};
const universalCloseReference=closeReference;
closeReference=function(){universalCloseReference();syncSidebarArrow();};
$('closeReference').onclick=closeReference;
window.addEventListener('resize',()=>requestAnimationFrame(syncSidebarArrow));
const universalExpanded=setReferenceExpanded;
setReferenceExpanded=function(expanded){universalExpanded(expanded);syncSidebarArrow();requestAnimationFrame(syncSidebarArrow);};
syncSidebarArrow();

// Full-screen wheel pickers also expose the same sidebar arrow. Park their DOM
// and draft untouched; collapsing the sidebar resumes the picker.
let parkedNotesPicker='',parkedPickerDraft=null;
function pickerSidebarButton(id,selector){const bar=$(id)?.querySelector(selector);if(bar)bar.insertAdjacentHTML('afterbegin',`<button type="button" class="quiet" data-picker-sidebar="${id}" aria-label="Open sidebar">‹</button>`);}
const sidebarVitalWheel=wheelOpen;
wheelOpen=function(key){sidebarVitalWheel(key);pickerSidebarButton('wheelModal','.wheel-toolbar');};
const sidebarRepeatWheel=openRepeatWheel;
openRepeatWheel=function(){sidebarRepeatWheel();pickerSidebarButton('repeatWheelModal','.repeat-wheel-top');};
const pickerCloseReference=closeReference;
closeReference=function(){pickerCloseReference();if(parkedNotesPicker){const id=parkedNotesPicker,stillCurrent=parkedPickerDraft===(id==='wheelModal'?vitalDraft:eventDraft);parkedNotesPicker='';parkedPickerDraft=null;if(stillCurrent&&!$(id).open)$(id).showModal();}};
$('closeReference').onclick=closeReference;
document.addEventListener('click',e=>{const button=e.target.closest('[data-picker-sidebar]');if(!button)return;parkedNotesPicker=button.dataset.pickerSidebar;parkedPickerDraft=parkedNotesPicker==='wheelModal'?vitalDraft:eventDraft;$(parkedNotesPicker).close();if(!referencePane){searchHelp();openReference('guidance');}else openReference(referencePane);});
