/* Interventions — plain JavaScript, no dependencies.
 * Reference calculations are pure functions. Only explicit Save / Record actions
 * write patient entries. Draft modal values never enter generated notes.
 */
let careView='',vitalDraft=null,gcsDraft=null,wheelDraft=null,eventDraft=null,procedureDraft=null;
let pendingCare={};
let learningEmailRequested=false; // UI placeholder only: excluded from notes/JSON/network.
const cloneCare=x=>JSON.parse(JSON.stringify(x));
// Device limit readings are labels, never numeric estimates.
function vitalLimitValue(raw,key){const s=String(raw??'').trim().toLowerCase();return ['temp','bgl'].includes(key)?(s==='hi'?'Hi':s==='low'?'Low':''):'';}
function vitalLimitControls(key){return ['temp','bgl'].includes(key)?`<span class="vital-limit-controls" role="group" aria-label="${CARE_CONFIG.vitals[key].label} device reading">${['Hi','Low'].map(value=>`<button type="button" class="quiet" data-vital-limit="${key}" data-limit-value="${value}" aria-pressed="${vitalLimitValue(vitalDraft.values[key],key)===value}">${value}</button>`).join('')}</span>`:'';}
function numericVital(raw,key){
 if(vitalLimitValue(raw,key))return null;
 const s=String(raw??'').trim().replace(',','.');
 if(key==='dbp'&&s.toLowerCase()==='palpated')return null;
 if(!s)return null;
 const meta=CARE_CONFIG.vitals[key];
 if(!meta||!/^\d+(\.\d+)?$/.test(s))return NaN;
 const n=Number(s),decimals=(s.split('.')[1]||'').length;
 return n<meta.min||n>meta.max||(meta.step===1&&!Number.isInteger(n))||(meta.step===.1&&decimals>1)?NaN:n;
}
function gcsTotal(g){return ['eye','verbal','motor'].every(k=>Number.isInteger(g[k])&&CARE_CONFIG.gcs[k].options.some(x=>x[0]===g[k]))?g.eye+g.verbal+g.motor:null;}
function gcsText(g){const total=gcsTotal(g),components=['eye','verbal','motor'].map((k,i)=>'EVM'[i]+(g[k]??'not assessed')).join(' ');return Object.keys(g).length?(total===null?'GCS '+components:'GCS '+total+' ('+components+')'):'';}
function gcsComplete(g={}){return ['eye','verbal','motor'].every(k=>CARE_CONFIG.gcs[k].options.some(x=>x[0]===g[k]));}
function gcsEntryErrors(d){return (Object.keys(d.gcs||{}).length||String(d.values.gcs??'').trim())&&!gcsComplete(d.gcs)?['GCS: select Motor, Voice and Eyes.']:[];}
// Short display labels annotate the existing response scores/criteria.
const GCS_WORDS={motor:['Obeys','Localises','Normal','Abnormal','Extends','None'],verbal:['Orientated','Confused','Words','Sounds','None'],eye:['Spontaneous','Sound','Pressure','None']};
function gcsQuickEntry(){return `<div class="gcs-quick"><div class="gcs-quick-heading"><b>GCS <span id="gcsQuickTotal">${gcsTotal(vitalDraft.gcs||{})??'—'}</span></b><button type="button" class="quiet" data-gcs-clear>Clear GCS</button></div><div class="gcs-word-columns">${['motor','verbal','eye'].map((key,i)=>{const g=CARE_CONFIG.gcs[key],label=['Motor','Voice','Eyes'][i];return `<fieldset class="native-iv-choices gcs-word-choices"><legend>${label}</legend>${g.options.map(([score,title,description],j)=>`<button type="button" class="quiet" ${i===0&&j===0?'id="vital-entry-gcs"':''} data-gcs-word="${key}" data-gcs-score="${score}" aria-label="${label} ${score} · ${esc(title)}" aria-pressed="${vitalDraft.gcs?.[key]===score}" title="${esc(description)}"><span class="gcs-choice-score" aria-hidden="true">${score}</span><span>${GCS_WORDS[key][j]}</span></button>`).join('')}<small id="gcs-hint-${key}">${esc(g.options.find(x=>x[0]===vitalDraft.gcs?.[key])?.[2]||(key==='motor'?'Normal / abnormal refer to flexion':'Best observed response'))}</small></fieldset>`;}).join('')}</div></div>`;}
function setQuickGcs(key,value){
 if(!vitalDraft||!CARE_CONFIG.gcs[key]||!(value===''||CARE_CONFIG.gcs[key].options.some(x=>String(x[0])===value)))return false;
 vitalDraft.gcs??={};if(value==='')delete vitalDraft.gcs[key];else vitalDraft.gcs[key]=Number(value);
 vitalDraft.values.gcs=gcsTotal(vitalDraft.gcs)??'';
 if(vitalDraft.ink){vitalDraft.inkPending??={};vitalDraft.inkRevision??={};vitalDraft.ink.gcs=[];vitalDraft.inkPending.gcs=false;vitalDraft.inkRevision.gcs=(vitalDraft.inkRevision.gcs||0)+1;}
 const hint=$('gcs-hint-'+key);if(hint)hint.textContent=CARE_CONFIG.gcs[key].options.find(x=>x[0]===Number(value))?.[2]||(key==='motor'?'Normal / abnormal refer to flexion':'Best observed response');
 document.querySelectorAll('[data-gcs-word="'+key+'"]').forEach(button=>button.setAttribute('aria-pressed',String(vitalDraft.gcs[key]===Number(button.dataset.gcsScore))));
 if($('gcsQuickTotal'))$('gcsQuickTotal').textContent=gcsTotal(vitalDraft.gcs)??'—';updateNewsDisplay();return true;
}
function vitalIsPalpated(d){return d.bpPalpated===true||String(d.values?.dbp||'').toLowerCase()==='palpated';}
function vitalChoiceButtons(key,choices,current){return `<div class="vital-context-toggle" role="group" aria-label="${key==='oxygen'?'Air or oxygen':key==='etco2Method'?'EtCO₂ measurement method':'CRT site'}">${choices.map(([value,label])=>`<button type="button" class="quiet" data-vital-context="${key}" data-context-value="${value}" aria-pressed="${current===value}">${label}</button>`).join('')}</div>`;}
function vitalPalpatedControl(){return `<label class="palpated-toggle"><input type="checkbox" data-vital-palpated ${vitalIsPalpated(vitalDraft)?'checked':''}>Palpated</label>`;}
function vitalContextControls(key){
 if(key==='spo2')return vitalChoiceButtons('oxygen',[['Air','RA'],['Oxygen','On O₂']],vitalDraft.oxygen);
 if(key==='sbp')return vitalPalpatedControl();
 if(key==='etco2')return vitalChoiceButtons('etco2Method',[['Nasal','Nasal'],['Inline','Inline']],vitalDraft.etco2Method);
 if(key==='crt')return vitalChoiceButtons('crtSite',[['Peripheral','Peripheral'],['Central','Central']],vitalDraft.crtSite);
 return '';
}
function vitalOxygenFlowInput(){return vitalDraft.oxygen==='Oxygen'?`<label class="oxygen-flow-input">O₂ L/min<input id="vital-entry-o2flow" type="text" inputmode="decimal" autocomplete="off" data-vital="o2flow" aria-label="Oxygen flow L/min" value="${esc(vitalDraft.values.o2flow??'')}" placeholder="—"></label>`:'';}
function setVitalContext(key,value){
 const allowed={oxygen:['Air','Oxygen'],etco2Method:['Nasal','Inline'],crtSite:['Peripheral','Central']};if(!vitalDraft||!allowed[key]?.includes(value))return false;
 if(key==='oxygen'){
  if(value==='Air'){vitalDraft.oxygenFlowDraft=vitalDraft.values.o2flow;delete vitalDraft.values.o2flow;}
  else if(vitalDraft.values.o2flow===undefined&&vitalDraft.oxygenFlowDraft!==undefined)vitalDraft.values.o2flow=vitalDraft.oxygenFlowDraft;
  vitalDraft.assumptions=(vitalDraft.assumptions||[]).filter(x=>x!=='Room air');
 }
 vitalDraft[key]=value;renderCare(true);if(key==='oxygen'&&value==='Oxygen')requestAnimationFrame(()=>$('vital-entry-o2flow')?.focus());return true;
}
function setVitalPalpated(checked){
 if(!vitalDraft)return;vitalDraft.bpPalpated=checked;vitalDraft.values.dbp=checked?'palpated':'';
 if(vitalDraft.ink){vitalDraft.inkPending??={};vitalDraft.inkSource??={};vitalDraft.inkRevision??={};vitalDraft.ink.dbp=[];vitalDraft.inkPending.dbp=false;vitalDraft.inkSource.dbp='corrected';vitalDraft.inkRevision.dbp=(vitalDraft.inkRevision.dbp||0)+1;}
 renderCare(true);
}
function vitalRecordedParts(e){return Object.entries(CARE_CONFIG.vitals).filter(([k])=>String(e.values[k]??'').trim()&&!(k==='gcs'&&Object.keys(e.gcs||{}).length)&&!(k==='dbp'&&vitalIsPalpated(e))&&!(k==='o2flow'&&e.oxygen!=='Oxygen')).map(([k,m])=>m.label+' '+e.values[k]+' '+m.unit+(k==='sbp'&&vitalIsPalpated(e)?' (palpated)':k==='etco2'&&e.etco2Method?' ('+e.etco2Method.toLowerCase()+')':k==='crt'&&e.crtSite?' ('+e.crtSite.toLowerCase()+')':''));}
function vitalErrors(d){
 const errors=[];
 for(const key of Object.keys(CARE_CONFIG.vitals))if(Number.isNaN(numericVital(d.values[key],key)))errors.push(CARE_CONFIG.vitals[key].label+': enter a valid '+(CARE_CONFIG.vitals[key].step===1?'whole number':'number (one decimal maximum)')+'.');
 const s=numericVital(d.values.sbp,'sbp'),b=numericVital(d.values.dbp,'dbp');
 if(vitalIsPalpated(d)&&!Number.isFinite(s))errors.push('Enter systolic BP for a palpated reading.');
 if(!vitalIsPalpated(d)&&(s===null)!==(b===null))errors.push('Enter both systolic and diastolic BP.');
 if(Number.isFinite(s)&&Number.isFinite(b)&&s<b)errors.push('Systolic BP cannot be lower than diastolic BP.');
 return errors;
}
// NEWS2 thresholds match the RCP chart. GCS, BGL and diastolic BP do not score.
function news2(d){
 const val=k=>numericVital(d.values[k],k),p={};
 const score=(key,fn)=>{const n=val(key);p[key]=Number.isFinite(n)?fn(n):null;};
 score('rr',n=>n<=8?3:n<=11?1:n<=20?0:n<=24?2:3);
 score('hr',n=>n<=40?3:n<=50?1:n<=90?0:n<=110?1:n<=130?2:3);
 score('sbp',n=>n<=90?3:n<=100?2:n<=110?1:n<=219?0:3);
 score('temp',n=>n<=35?3:n<=36?1:n<=38?0:n<=39?1:2);
 p.oxygen=d.oxygen==='Oxygen'?2:d.oxygen==='Air'?0:null;
 const observedGcs=Object.keys(d.gcs||{}).length?gcsTotal(d.gcs):numericVital(d.values.gcs,'gcs');
 p.consciousness=d.consciousness==='From GCS'?(Number.isFinite(observedGcs)?(observedGcs===15?0:3):null):['Alert','New confusion','Voice','Pain','Unresponsive'].includes(d.consciousness)?(d.consciousness==='Alert'?0:3):null;
 score('spo2',n=>d.scale==='2'?(n<=83?3:n<=85?2:n<=87?1:n<=92?0:d.oxygen==='Air'?0:n<=94?1:n<=96?2:3):(n<=91?3:n<=93?2:n<=95?1:0));
 if(d.scale==='2'&&(!d.scale2Confirmed||p.oxygen===null))p.spo2=null;
 const missing=Object.keys(p).filter(k=>p[k]===null),eligible=d.eligibility==='Adult ≥16, not pregnant';
 const complete=eligible&&!missing.length&&!vitalErrors(d).length;
 const total=complete?Object.values(p).reduce((a,b)=>a+b,0):null;
 const singleThree=Object.values(p).includes(3);
 return {points:p,total,consciousnessInferred:d.consciousness==='From GCS',gcsBasis:observedGcs,missing,singleThree,eligible,applicability:d.eligibility,band:total===null?'incomplete':total>=7?'high':total>=5?'medium':singleThree?'single':'low'};
}
function newsLabel(n){return n.total===null?(n.eligible?'NEWS2 incomplete':n.applicability==='Not applicable'?'NEWS2 not applicable':'NEWS2 — applicability not confirmed'): `NEWS2 ${n.total} · ${n.band==='high'?'high':n.band==='medium'?'medium':n.band==='single'?'single parameter 3':'low'}`;}
function priorityDrugs(query='',procedure=''){
 const preferred=procedure==='RSI'?CARE_CONFIG.rsiDrugs:selectedGuidelines().flatMap(n=>GUIDELINES_USED[n]?.drugs||[]);
 return DRUG_NAMES.filter(n=>n.toLowerCase().includes(query.toLowerCase().trim())).sort((a,b)=>(Number(preferred.includes(b))-Number(preferred.includes(a)))||a.localeCompare(b,'en',{sensitivity:'base'}));
}
// RSI CPG 9.3: weight-derived reference, never a recorded dose. Do not infer context.
function rsiReference(weight,category,age){
 const w=Number(weight),a=age===''||age==null?null:Number(age);
 if(!String(weight).trim()||!Number.isFinite(w)||w<=0||w>500||!['Adult','Child'].includes(category)||(category==='Adult'&&w<25))return null;
 const exact=Math.min(w*2,200),block=category==='Adult'?Math.min(Math.round(exact/50)*50,200):exact;
 return {fentanyl:Math.min(w*2,200),ketamine:Math.min(w*2,200),ketamineReduced:Math.min(w,200),block,
  tube:category==='Child'&&a!==null&&Number.isFinite(a)&&a>=0&&a<=14?(a<1?'3–4 mm cuffed':((a/4)+3.5).toFixed(2).replace(/0+$/,'').replace(/\.$/,'')+' mm cuffed (formula estimate)'):category==='Child'?'Enter child age (0–14 years) for ETT estimate':'Clinician selection — no weight-only adult ETT estimate'};
}
function legacyGuidelineUsedPanel(){
 const g=GUIDELINES_USED[v('guidelineUsed')];if(!g)return '';
 return `<section class="diagnosis-panel guideline-treatment"><div class="rowhead"><h3>${esc(v('guidelineUsed'))} · Treatment</h3><a href="${g.url}" target="_blank" rel="noopener noreferrer">${g.code} ↗</a></div><ul>${g.treatment.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="subtle">Source checked 25 Oct 2026 · reference only.</p></section>`;
}
function careScreen(){
 return `<div class="toolbar"><h1>Interventions</h1></div><div class="care-actions"><button class="iv-access-card" data-notes-equipment="iv">+ Add IV access</button><button data-care-open="drug">+ Add drug</button><button data-care-open="intervention">+ Add intervention</button><button data-care-open="procedure">+ Add procedure</button></div>${careTimeline()}`;
}
function careTimeline(){
 const entries=[...state.vitalSets.map((e,i)=>({e,i,kind:'vitals'})),...state.careEvents.map((e,i)=>({e,i,kind:e.kind}))].sort((a,b)=>new Date(a.e.at)-new Date(b.e.at));
 return entries.length?`<div class="care-timeline">${entries.map(({e,i,kind})=>`<section class="care-record"><div class="rowhead"><h3>${esc(eventTime(e))} · ${kind==='vitals'?'Vitals':esc(e.procedure?e.procedure+' · '+e.name:e.name)}</h3><div><button class="quiet" data-care-edit="${kind==='vitals'?'vitals':'event'}" data-index="${i}">Edit</button><button class="quiet" data-care-remove="${kind==='vitals'?'vitals':'event'}" data-index="${i}" aria-label="Remove ${kind==='vitals'?'vitals':esc(e.name)}">✕</button></div></div>${kind==='vitals'?vitalSummary(e):`<p>${esc(drugDetails(e))}</p>`}</section>`).join('')}</div>`:'<p class="subtle">No entries.</p>';
}
function drugDetails(e){return e.kind==='drug'?`${e.dose.trim()?e.dose+' '+e.unit:'Dose not recorded'} · ${e.route||'route not recorded'}${e.details?' · '+e.details:''}`:(e.details||'');}
function vitalSummary(e){const n=news2(e);return `<div class="vital-summary">${gcsText(e.gcs)?`<span>${esc(gcsText(e.gcs))}</span>`:''}${vitalRecordedParts(e).map(text=>`<span class="vital-reading">${esc(text)}</span>`).join('')}<span class="news-total news-${n.band}">${newsLabel(n)}</span></div>`;}
function vitalsNote(){return state.vitalSets.slice().sort((a,b)=>new Date(a.at)-new Date(b.at)).map(e=>{
 const parts=[gcsText(e.gcs||{}),...vitalRecordedParts(e),e.consciousness==='From GCS'?'NEWS consciousness: inferred from GCS '+(news2(e).gcsBasis??'not recorded')+' (prototype proxy)':e.consciousness?'ACVPU: '+e.consciousness:'',e.oxygen?'Air/oxygen: '+e.oxygen:'','SpO₂ scale '+e.scale+(e.scale==='2'?(e.scale2Confirmed?' (clinician confirmed)':' (authorisation not confirmed)'):''),newsLabel(news2(e)),e.assumptions?.length?'Assumed context: '+e.assumptions.join(', '):''];
 return eventTime(e)+' — '+parts.filter(Boolean).join('; ');
 }).join('\n');}

function careEventsNote(){return state.careEvents.slice().sort((a,b)=>new Date(a.at)-new Date(b.at)).map(e=>eventTime(e)+' — '+(e.procedure?e.procedure+' · ':'')+e.name+(e.kind==='drug'?' — '+drugDetails(e):e.details?' — '+e.details:'')).join('\n');}
function freshCareTime(){const d=new Date();d.setSeconds(0,0);return {at:d.toISOString(),local:localDateTime(d),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone};}
function careError(message){$('careError').textContent=message;$('careError').hidden=!message;}
// Header navigation keeps unrecorded entry drafts; explicit Cancel discards them.
function careDraftKey(kind,index){return kind+':'+(index==null?'new':index);}
function currentCareKey(){const kind=careView==='gcs'?'vitals':careView;return careDraftKey(kind,kind==='vitals'?vitalDraft?.index:eventDraft?.index);}
function stashCareDraft(){
 if(!$('careModal').open)return;
 pendingCare[currentCareKey()]=cloneCare({view:careView,vitalDraft,gcsDraft,eventDraft,procedureDraft});$('careModal').close();
}
function clearCareDrafts(){pendingCare={};vitalDraft=null;gcsDraft=null;eventDraft=null;procedureDraft=null;if($('careModal').open)$('careModal').close();}
function hasUnsavedCare(){return Object.keys(pendingCare).length>0||($('careModal').open&&!!(careView==='vitals'||careView==='gcs'?Object.values(vitalDraft?.values||{}).some(x=>String(x).trim())||Object.keys(vitalDraft?.gcs||{}).length>0||Object.values(vitalDraft?.ink||{}).some(x=>x.length):eventDraft?.name?.trim()||eventDraft?.details?.trim()));}
function openCare(kind,index=null){
 const pending=pendingCare[careDraftKey(kind,index)];
 if(pending){({vitalDraft,gcsDraft,eventDraft,procedureDraft}=cloneCare(pending));careView=pending.view==='gcs'?'vitals':pending.view;renderCare();$('careModal').show();$('careModal').focus();return;}
 if(kind==='vitals')vitalDraft=index===null?{...freshCareTime(),values:{},gcs:{},oxygen:'Air',consciousness:'From GCS',scale:'1',scale2Confirmed:false,eligibility:'Adult ≥16, not pregnant',assumptions:['Adult ≥16, not pregnant','Room air','SpO₂ scale 1'],index:null}: {...cloneCare(state.vitalSets[index]),index};
 else if(kind==='procedure') {procedureDraft={procedure:'RSI',weight:'',category:'',age:''};eventDraft={...freshCareTime(),name:'',dose:'',unit:'',route:'',details:'',kind:'drug',index:null};}
 else eventDraft=index===null?{...freshCareTime(),name:'',dose:'',unit:'',route:'',details:'',kind:kind==='intervention'?'intervention':'drug',index:null}:{...cloneCare(state.careEvents[index]),index};
 careView=kind;renderCare();$('careModal').show();$('careModal').focus();
}
function careTimeEditor(d){return `<div class="care-time"><strong>${esc(d.local.slice(11,16))}</strong><label>Recorded at<input type="datetime-local" data-care-time value="${esc(d.local)}" aria-label="Recorded at"></label><button class="quiet" data-care-now>Now</button><span>${esc(d.timeZone)}</span></div>`;}
function renderCare(keepScroll=false){
 const scroll=keepScroll?(($('careModal').querySelector('.procedure-work')||$('careModal').querySelector('.care-modal-body'))?.scrollTop||0):0;
 const d=careView==='vitals'?vitalDraft:eventDraft;
 const actions=careView==='procedure'?`<span id="procedureRecorded" role="status"></span><button class="quiet" data-procedure-clear>Clear entry</button><button class="quiet" data-care-cancel>Cancel</button><button class="round-record" data-procedure-record aria-label="Record entry + continue"><span>Record</span><small>${eventDraft.kind==='drug'?'drug':'intervention'}</small></button><button class="quiet" data-care-save>Done</button>`:`<span class="entry-confirmation">${careView==='vitals'?'Save confirms the displayed readings and prototype context.':''}</span><button class="quiet" data-care-cancel>Cancel</button><button ${careView==='intervention'?'class="round-record"':''} data-care-save>${careView==='gcs'?'Accept GCS':careView==='vitals'?'Save readings':'Record'}</button>`;
 $('careModal').innerHTML=`<div class="care-modal-shell"><div class="care-modal-top">${careView==='gcs'?'<h2>GCS · best observed response</h2>':careTimeEditor(d)}<span class="entry-mode">${careView==='vitals'?'VITALS · PAPER ENTRY':careView==='procedure'?'PROCEDURE':careView.toUpperCase()}</span></div><p id="careError" class="care-error" role="alert" hidden></p><div class="care-modal-body">${careView==='vitals'?vitalsEditor():careView==='gcs'?gcsEditor():eventEditor(careView==='procedure')}</div><div class="care-modal-bottom">${actions}</div></div>`;
 if(careView==='vitals')updateNewsDisplay();
 const body=$('careModal').querySelector('.procedure-work')||$('careModal').querySelector('.care-modal-body');if(body)body.scrollTop=scroll;
 if(careView==='drug'||careView==='procedure'){updateDrugGuidance(true);if(careView==='drug')updateRepeatControl();}
 if(careView==='vitals')requestAnimationFrame(()=>{if($('careModal').open&&careView==='vitals')initInkFields();});
}
function vitalInput(key){const m=CARE_CONFIG.vitals[key];return `<label>${m.label} <small>${m.unit}</small><input type="text" inputmode="${m.step===1?'numeric':'decimal'}" autocomplete="off" data-vital="${key}" aria-label="${m.label}" placeholder="Type / tablet handwriting" value="${esc(vitalDraft.values[key]??'')}"></label>`;}
function vitalsEditor(){
 const tile=key=>{const m=CARE_CONFIG.vitals[key],extra=['etco2','crt'].includes(key);return `<section class="paper-vital" data-vital-tile="${key}"><div class="paper-label"><h3>${m.label}</h3><span>${m.unit}</span>${key==='gcs'?'<button class="quiet" data-care-gcs>E / V / M ↗</button>':extra?'':`<button class="quiet" data-care-wheel="${key}">Wheel ↗</button>`}</div>${vitalLimitControls(key)}${inkTile(key,m.label,m.unit)}<div class="paper-context-controls">${vitalContextControls(key)}${key==='spo2'?vitalOxygenFlowInput():''}</div></section>`;};
 return `<div class="paper-heading"><b>Write directly on the sheet</b><span>Review recognised readings before saving</span></div><div class="paper-vitals-grid"><section class="paper-vital paper-gcs">${gcsQuickEntry()}</section>${['rr','hr','spo2'].map(tile).join('')}<section class="paper-vital paper-bp" data-vital-tile="bp"><div class="paper-label"><h3>BP</h3><span>mmHg</span><button class="quiet" data-care-wheel="bp">Two wheels ↗</button></div><div class="paper-bp-halves"><div><div class="paper-bp-label">Systolic BP ${vitalPalpatedControl()}</div>${inkTile('sbp','Systolic BP')}</div><div><div class="paper-bp-label">Diastolic BP</div>${vitalIsPalpated(vitalDraft)?'<label class="palpated-reading">Diastolic BP<input type="text" data-vital="dbp" aria-label="Diastolic BP" value="palpated" readonly></label>':inkTile('dbp','Diastolic BP')}</div></div></section>${['temp','bgl','etco2','crt'].map(tile).join('')}</div><div id="newsResult" class="paper-news-result" aria-live="polite"></div><details class="prototype-context"><summary>NEWS context · review</summary><p>Defaults are assumptions, not observations. GCS 15 maps to NEWS consciousness 0; GCS 3–14 maps to 3. This is a prototype proxy, not an AVPU assessment.</p><div class="grid"><label>Applies to patient<select data-news="eligibility">${options(['Adult ≥16, not pregnant','Not applicable'],vitalDraft.eligibility,'Not confirmed')}</select></label><label>NEWS consciousness<select data-news="consciousness">${options(['From GCS','Alert','New confusion','Voice','Pain','Unresponsive'],vitalDraft.consciousness,'Not assessed')}</select></label><label>SpO₂ scale<select data-news="scale"><option value="1" ${vitalDraft.scale==='1'?'selected':''}>1 · standard</option><option value="2" ${vitalDraft.scale==='2'?'selected':''}>2 · authorised 88–92% target</option></select></label></div><label class="check" id="scale2Confirmation" ${vitalDraft.scale==='2'?'':'hidden'}><input type="checkbox" data-news-confirm ${vitalDraft.scale2Confirmed?'checked':''}>Scale 2 authorised for confirmed hypercapnic respiratory failure</label><a href="${CARE_CONFIG.newsChart}" target="_blank" rel="noopener noreferrer">RCP scoring chart ↗</a> · <a href="ink-model-LICENSE.txt" target="_blank" rel="noopener noreferrer">Local handwriting model / credits ↗</a><p>${CARE_CONFIG.newsCredit}</p></details>`;
}

function updateNewsDisplay(){
 const n=news2(vitalDraft);
 for(const key of ['gcs','rr','spo2','hr','bp','temp','bgl']){
  const points=n.points[key==='bp'?'sbp':key==='gcs'?'consciousness':key],tile=document.querySelector('[data-vital-tile="'+key+'"]'),label=document.querySelector('[data-vital-score="'+key+'"]');
  if(tile)tile.className='paper-vital '+(key==='bp'?'paper-bp ':'')+'neutral-vital';if(label)label.textContent=points==null?(key==='bgl'?'Not scored':'Not scored / not recorded'):(key==='gcs'?'NEWS consciousness: ':'NEWS2 component: ')+points;
 }
 $('newsResult').innerHTML=`<p class="news-total news-${n.band}">${newsLabel(n)}</p><p class="subtle">${n.total===null?'Complete the required observations, oxygen status, consciousness and applicability.':'RR '+n.points.rr+' · SpO₂ '+n.points.spo2+' · SBP '+n.points.sbp+' · HR '+n.points.hr+' · Temp '+n.points.temp+' · Consciousness '+n.points.consciousness+' · Oxygen '+n.points.oxygen}${n.singleThree?' · Single parameter scores 3.':''}${n.consciousnessInferred?' · LOC inferred from GCS '+(n.gcsBasis??'not recorded')+' (prototype).':''}${vitalDraft.assumptions?.length?' · Assumed context: '+esc(vitalDraft.assumptions.join('; ')):''}</p>`;
}
function gcsEditor(){return gcsQuickEntry();}
function wheelOpen(key){
 const keys=key==='bp'?(vitalIsPalpated(vitalDraft)?['sbp']:['sbp','dbp']):[key];wheelDraft={keys,values:Object.fromEntries(keys.map(k=>[k,vitalDraft.values[k]??'']))};
 const wheel=$('wheelModal');wheel.innerHTML=`<div class="wheel-background" data-wheel-accept><div class="wheel-toolbar"><h2>${key==='bp'?'Blood pressure':CARE_CONFIG.vitals[key].label}</h2><span>Scroll or tap a value. Tap outside the wheels to accept.</span><button class="quiet" data-wheel-cancel>Cancel</button><button data-wheel-accept>Accept</button></div><p id="wheelError" role="alert"></p><div class="wheel-layout">${keys.map(k=>{
 const m=CARE_CONFIG.vitals[k],values=Array.from({length:Math.round((m.max-m.min)/m.step)+1},(_,i)=>Math.round((m.min+i*m.step)*10)/10);
 return `<section class="wheel-unit"><h3>${m.label} <small>${m.unit}</small></h3><p data-wheel-reading="${k}">${esc(wheelDraft.values[k]===''?'Not selected':wheelDraft.values[k])}</p><div class="number-wheel" tabindex="0" role="listbox" aria-label="${m.label} wheel" data-wheel-column="${k}">${values.map(n=>`<button role="option" aria-selected="false" data-wheel-value="${n}" data-wheel-key="${k}">${m.step===.1?n.toFixed(1):n}</button>`).join('')}</div></section>`;
 }).join('')}</div><div class="wheel-footer" data-wheel-accept>Tap here to accept</div></div>`;
 wheel.showModal();keys.forEach(k=>{const col=document.querySelector('[data-wheel-column="'+k+'"]'),m=CARE_CONFIG.vitals[k],n=numericVital(wheelDraft.values[k],k);col.scrollTop=((Number.isFinite(n)?n:m.start)-m.min)/m.step*56;});
 // Initial centring is not a recorded value: attach scrolling after it has settled.
 requestAnimationFrame(()=>requestAnimationFrame(()=>keys.forEach(k=>{
  const col=document.querySelector('[data-wheel-column="'+k+'"]');if(!col)return;
  col.addEventListener('scroll',()=>{const m=CARE_CONFIG.vitals[k],n=Math.round((m.min+Math.round(col.scrollTop/56)*m.step)*10)/10;setWheelValue(k,n);},{passive:true});
 })));
}
function setWheelValue(key,value){wheelDraft.values[key]=String(value);const out=document.querySelector('[data-wheel-reading="'+key+'"]');if(out)out.textContent=value;document.querySelectorAll('[data-wheel-column="'+key+'"] [role="option"]').forEach(o=>o.setAttribute('aria-selected',String(o.dataset.wheelValue===String(value))));}
function acceptWheel(){const next={...vitalDraft.values,...wheelDraft.values},errors=vitalErrors({...vitalDraft,values:Object.fromEntries(wheelDraft.keys.map(k=>[k,next[k]]))});if(errors.length){$('wheelError').textContent=errors.join(' ');return;}vitalDraft.values=next;$('wheelModal').close();careView='vitals';renderCare();}
function drugPicker(){return `<label>Drug<input id="careDrugName" role="combobox" aria-autocomplete="list" aria-controls="drugMatches" aria-expanded="false" autocomplete="off" placeholder="Type a drug or open list…" data-care-field="name" value="${esc(eventDraft.name)}"></label><button class="quiet" data-drug-toggle aria-label="Show matching drugs">▾</button><div id="drugMatches" class="drug-matches" role="listbox" aria-label="Matching drugs" hidden></div>`;}
function renderDrugMatches(){const box=$('drugMatches');if(!box)return;box.innerHTML=priorityDrugs(eventDraft.name,careView==='procedure'?procedureDraft.procedure:'').map(name=>`<button role="option" data-drug-choice="${esc(name)}">${esc(name)}</button>`).join('')||'<p>No matches · custom drug name is allowed.</p>';box.hidden=false;$('careDrugName').setAttribute('aria-expanded','true');}
function rsiPanel(){
 const p=procedureDraft,r=rsiReference(p.weight,p.category,p.age);
 return `<section class="rsi-reference"><h3>RSI · reference only</h3><div class="grid"><label>Patient group<select data-procedure="category">${options(['Adult','Child'],p.category,'Select patient group')}</select></label><label>Weight (kg)<input type="text" inputmode="decimal" data-procedure="weight" value="${esc(p.weight)}" placeholder="Actual / estimated kg"></label><label>Age (years) · tube estimate<input type="text" inputmode="decimal" data-procedure="age" value="${esc(p.age)}" placeholder="Child age; under 1 as decimal"></label></div><div id="rsiDoses">${rsiDoseMarkup(r)}</div> </section>`;
}
function rsiDoseMarkup(r){return r?`<div class="rsi-dose-grid"><p>Fentanyl <b>${r.fentanyl} mcg IV</b> · conditional</p><p>Ketamine <b>${r.ketamine} mg IV</b> · usual reference</p><p>Ketamine <b>${r.ketamineReduced} mg IV</b> · reduced-dose reference</p><p>Rocuronium <b>${r.block} mg IV</b> <em>or</em> suxamethonium <b>${r.block} mg IV</b></p><p>ETT: <b>${esc(r.tube)}</b></p></div><p class="subtle">Fentanyl only for TBI, suspected intracranial pathology or hypertension; withhold with shock. Consider reduced ketamine with shock / prior sedation; do not reduce for prolonged seizures. NMB is an alternative, not both; adult dose rounded to nearest 50 mg, maximum 200 mg. Verify against the full CPG. Estimates never fill actual-dose fields.</p>`:'<p class="subtle">Enter weight and patient group for dose references. Adult references support 25–500 kg; use the full CPG outside that range. Child tube sizing also needs age. No actual dose is assumed.</p>';}
function rsiQuickControls(){return `<div class="procedure-picks"><section><h3>Drugs</h3>${CARE_CONFIG.rsiDrugs.map(n=>`<button class="quiet" data-procedure-drug="${n}" aria-pressed="${eventDraft.kind==='drug'&&eventDraft.name===n}">${n}</button>`).join('')}</section><section><h3>Interventions</h3>${CARE_CONFIG.rsiActions.map(n=>`<button class="quiet" data-procedure-action="${n}" aria-pressed="${eventDraft.kind==='intervention'&&eventDraft.name===n}">${n}</button>`).join('')}</section></div>`;}
function eventEntryMarkup(){return `<section class="event-entry"><h3>${careView==='procedure'?'Selected: '+esc(eventDraft.name||'choose an action'):eventDraft.kind==='drug'?'Drug administered':'Intervention performed'}</h3>${eventDraft.kind==='drug'?`<div class="drug-picker">${drugPicker()}</div><div class="grid ${careView==='drug'?'drug-administration-grid':''}">${careView==='drug'?dosePadMarkup():`<label>Actual dose<input type="text" inputmode="decimal" data-care-field="dose" value="${esc(eventDraft.dose)}" placeholder="Dose actually given"></label>`}<label>Unit<select data-care-field="unit">${options(['mg','mcg','g','ml','units','mmol','litres'],eventDraft.unit,'Not recorded')}</select></label><label>Route<select data-care-field="route">${options(['IV','IO','IM','IN','PO','SL','SC','Nebulised','Inhaled','Topical','Other'],eventDraft.route,'Not recorded')}</select></label></div>`:`<label>Intervention<input data-care-field="name" value="${esc(eventDraft.name)}" placeholder="Action actually performed…"></label>`}${careView==='drug'?repeatControl():''}<label>Notes<textarea rows="1" data-care-field="details" placeholder="Notes…">${esc(eventDraft.details)}</textarea></label></section>`;}
function eventEditor(procedure=false){return procedure?`<div class="procedure-shell"><section class="procedure-work"><div class="procedure-heading"><label>Choose procedure<select data-procedure="procedure"><option>RSI</option></select></label><button class="quiet" data-procedure-reference>Reference ↗</button></div>${rsiQuickControls()}<div class="care-actions"><button class="quiet" data-procedure-kind="drug" aria-pressed="${eventDraft.kind==='drug'}">Other drug</button><button class="quiet" data-procedure-kind="intervention" aria-pressed="${eventDraft.kind==='intervention'}">Other intervention</button></div>${eventEntryMarkup()}</section><aside class="procedure-reference" aria-label="Procedure reference"><div class="reference-banner">REFERENCE · NOT A RECORD</div>${rsiPanel()}</aside></div>`:careView==='drug'?drugSidebar():(careView==='intervention'?interventionPicker():'')+eventEntryMarkup();}
function chooseProcedureEntry(kind,name=''){
 if(eventDraft.kind===kind&&eventDraft.name===name)return;
 eventDraft={...eventDraft,kind,name,dose:'',unit:'',route:'',details:'',drugSelected:kind==='drug'&&!!drugReferenceName(name)};
 // Defaults describe the selected medicine; the administered dose stays blank.
 if(kind==='drug'&&eventDraft.drugSelected)applyDrugDefaults();
 renderCare(true);
}
function stampCare(d){const date=new Date(d.local);if(!d.local||Number.isNaN(date.getTime()))return null;return {...d,at:date.toISOString(),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone};}
function saveVitalSet(){if(gcsComplete(vitalDraft.gcs))vitalDraft.values.gcs=gcsTotal(vitalDraft.gcs)??'';const errors=[...vitalErrors(vitalDraft),...gcsEntryErrors(vitalDraft)],stamped=stampCare(vitalDraft);if(Object.values(vitalDraft.inkPending||{}).some(Boolean))errors.push('Wait for recognition or correct the displayed reading.');if(Object.entries(vitalDraft.ink||{}).some(([k,strokes])=>strokes.length&&!Number.isFinite(numericVital(vitalDraft.values[k],k))))errors.push('Review each handwritten reading, or clear unread ink.');if(!stamped)errors.push('Enter a valid observation date and time.');if(!Object.values(vitalDraft.values).some(x=>String(x).trim())&&!Object.keys(vitalDraft.gcs).length)errors.push('Record at least one vital sign.');if(errors.length){careError(errors.join(' '));return false;}const {index,...record}=stamped;for(const k of Object.keys(record.values)){if(k==='dbp'&&vitalIsPalpated(record)){record.values.dbp='palpated';continue;}if(k==='o2flow'&&record.oxygen!=='Oxygen'){delete record.values[k];continue;}const limit=vitalLimitValue(record.values[k],k);if(limit){record.values[k]=limit;continue;}const n=numericVital(record.values[k],k);if(n===null)delete record.values[k];else record.values[k]=n;}delete record.inkPending;delete record.inkRevision;delete record.oxygenFlowDraft;record.handwritingReviewed=Object.values(record.ink||{}).some(x=>x.length>0);record.news2=news2(record);if(index===null)state.vitalSets.push(record);else state.vitalSets[index]=record;changed();delete pendingCare[currentCareKey()];$('careModal').close();vitalDraft=null;render();return true;}
function saveCareEvent(keepOpen=false){
 const d=stampCare(eventDraft);if(!d){careError('Enter a valid action date and time.');return false;}
 if(!d.name.trim()){careError('Enter the drug or intervention performed.');return false;}
 if(d.kind==='drug'&&d.dose.trim()&&(!/^\d+(\.\d+)?$/.test(d.dose.trim())||Number(d.dose)<=0||!d.unit)){careError('Enter a positive actual dose and its unit, or leave dose blank if not recorded.');return false;}
 if(d.arrestId&&d.kind==='drug')d.arrestAction=['adrenaline','amiodarone'].includes(d.name.trim().toLowerCase())?d.name.trim().toLowerCase():'arrest_other';
 const {index,repeatPanel,repeatChoiceIndex,repeatContext,repeatMinutes,sourceDraft,...record}=d;
 record.id=record.id||(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'event-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
 record.enteredAt=record.enteredAt||(index===null?new Date().toISOString():null);
 if(index!==null)record.modifiedAt=new Date().toISOString();
 if(keepOpen){record.procedure=procedureDraft.procedure;record.referenceWeight=procedureDraft.weight;record.referenceAge=procedureDraft.age;record.patientGroup=procedureDraft.category;}
 if(index===null)state.careEvents.push(record);else state.careEvents[index]=record;delete pendingCare[currentCareKey()];changed();render();updateRepeatNotifications();
 if(!keepOpen){delete pendingCare[currentCareKey()];$('careModal').close();eventDraft=null;return true;}
 const preserve=eventDraft.retrospective?{local:eventDraft.local,retrospective:true}:{};eventDraft={...freshCareTime(),...preserve,name:'',dose:'',unit:'',route:'',details:'',kind:d.kind,index:null};renderCare(true);$('procedureRecorded').textContent='Recorded: '+record.name;return true;
}
// These handlers only recognise this module's data attributes.
document.addEventListener('input',e=>{const t=e.target;
 if(t.dataset.vital){const key=t.dataset.vital;if(['o2flow','etco2','crt'].includes(key)&&!/^\d*(?:[.,]\d?)?$/.test(t.value)){t.value=vitalDraft.values[key]??'';return;}vitalDraft.values[key]=t.value.replace?.(',','.')??t.value;if(key==='gcs')vitalDraft.gcs={};if(vitalDraft.inkSource){vitalDraft.inkSource[key]='corrected';vitalDraft.inkPending[key]=false;vitalDraft.inkRevision[key]=(vitalDraft.inkRevision[key]||0)+1;}updateNewsDisplay();}
 if(t.dataset.careTime!==undefined){const d=careView==='vitals'?vitalDraft:eventDraft;d.local=t.value;d.retrospective=true;const stamp=t.closest('.care-time')?.querySelector('strong');if(stamp)stamp.textContent=t.value.slice(11,16);}
 if(t.dataset.careField){if(careView==='procedure'&&t.dataset.careField==='name'&&t.value!==eventDraft.name){for(const k of ['dose','unit','route','details']){eventDraft[k]='';const input=document.querySelector('[data-care-field="'+k+'"]');if(input)input.value='';}}if(t.dataset.careField==='name')clearDrugForNameChange(t.value);eventDraft[t.dataset.careField]=t.value;if(t.dataset.careField==='name'&&eventDraft.kind==='drug'){eventDraft.drugSelected=false;renderDrugMatches();if(careView==='drug'||careView==='procedure'){delete eventDraft.repeatReminder;delete eventDraft.repeatDismissed;delete eventDraft.repeatContext;delete eventDraft.repeatMinutes;updateDrugGuidance();}}if(careView==='drug')updateRepeatControl();}
 if(t.dataset.procedure){procedureDraft[t.dataset.procedure]=t.value;$('rsiDoses').innerHTML=rsiDoseMarkup(rsiReference(procedureDraft.weight,procedureDraft.category,procedureDraft.age));}
});
document.addEventListener('change',e=>{const t=e.target;
 if(t.hasAttribute?.('data-vital-palpated'))setVitalPalpated(t.checked);
 if(t.dataset.news){vitalDraft[t.dataset.news]=t.value;if(vitalDraft.assumptions)vitalDraft.assumptions=vitalDraft.assumptions.filter(x=>!({eligibility:['Adult ≥16, not pregnant'],oxygen:['Room air'],scale:['SpO₂ scale 1']}[t.dataset.news]||[]).includes(x));if(t.dataset.news==='scale'){vitalDraft.scale2Confirmed=false;document.querySelector('[data-news-confirm]').checked=false;$('scale2Confirmation').hidden=t.value!=='2';}updateNewsDisplay();}
 if(t.dataset.newsConfirm!==undefined){vitalDraft.scale2Confirmed=t.checked;updateNewsDisplay();}
 if(t.dataset.gcs){gcsDraft[t.dataset.gcs]=t.checked?(t.value==='NT'?'NT':Number(t.value)):undefined;if(!t.checked)delete gcsDraft[t.dataset.gcs];document.querySelectorAll('[data-gcs="'+t.dataset.gcs+'"]').forEach(x=>x.checked=String(gcsDraft[t.dataset.gcs])===x.value);$('gcsResult').textContent=gcsText(gcsDraft)||'No components recorded';}
 if(careView==='drug'&&t.dataset.careField==='route')updateRepeatControl();
 if(t.id==='casCall'){state.casCall=t.checked;changed();}
 if(t.id==='learningEmail'){learningEmailRequested=t.checked;}
});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');
 if(e.target.closest('[data-wheel-accept]')&&!e.target.closest('.number-wheel')&&!e.target.closest('[data-wheel-cancel]')){if(wheelDraft&&$('wheelModal').open)acceptWheel();return;}
 if(!b)return;
 if(b.dataset.gcsWord)chooseGcsResponse(b.dataset.gcsWord,b.dataset.gcsScore);
 if(b.dataset.vitalContext)setVitalContext(b.dataset.vitalContext,b.dataset.contextValue);
 if(b.dataset.careOpen){if(b.id==='addVitals'&&$('careModal').open)stashCareDraft();openCare(b.dataset.careOpen);}
 if(b.dataset.careEdit)openCare(b.dataset.careEdit==='vitals'?'vitals':state.careEvents[+b.dataset.index].kind,+b.dataset.index);
 if(b.dataset.careRemove){const store=b.dataset.careRemove==='vitals'?'vitalSets':'careEvents';if(typeof removeRecordedEntry==='function')removeRecordedEntry(store,+b.dataset.index,b.dataset.recordedId||'');else if(confirm('Remove this recorded entry?')){state[store].splice(+b.dataset.index,1);changed();render();}}
 if(b.dataset.careCancel!==undefined){if(careView==='gcs'){careView='vitals';renderCare();}else {delete pendingCare[currentCareKey()];$('careModal').close();if(careView==='vitals')vitalDraft=null;else eventDraft=null;}}
 if(b.dataset.careSave!==undefined){if(careView==='gcs'){if(!gcsComplete(gcsDraft)){careError('Select Motor, Voice and Eyes.');return;}vitalDraft.gcs=cloneCare(gcsDraft);vitalDraft.values.gcs=gcsTotal(gcsDraft)??'';if(vitalDraft.ink){vitalDraft.inkSource??={};vitalDraft.inkPending??={};vitalDraft.ink.gcs=[];vitalDraft.inkSource.gcs='components';vitalDraft.inkPending.gcs=false;}careView='vitals';renderCare();}else if(careView==='vitals')saveVitalSet();else if(careView==='procedure'){
  if(eventDraft.name.trim()||eventDraft.dose.trim()||eventDraft.details.trim())careError('Record the current entry or clear it before Done.');else {delete pendingCare[currentCareKey()];$('careModal').close();}
 }else saveCareEvent();}
 if(b.dataset.gcsClear!==undefined){vitalDraft.gcs={};delete vitalDraft.values.gcs;if(vitalDraft.ink){vitalDraft.inkPending??={};vitalDraft.inkRevision??={};vitalDraft.ink.gcs=[];vitalDraft.inkPending.gcs=false;vitalDraft.inkRevision.gcs=(vitalDraft.inkRevision.gcs||0)+1;}renderCare(true);}
 if(b.dataset.careGcs!==undefined){gcsDraft=cloneCare(vitalDraft.gcs);careView='gcs';renderCare();}
 if(b.dataset.careWheel)wheelOpen(b.dataset.careWheel);
 if(b.dataset.wheelCancel!==undefined)$('wheelModal').close();
 if(b.dataset.wheelValue!==undefined){setWheelValue(b.dataset.wheelKey,b.dataset.wheelValue);const m=CARE_CONFIG.vitals[b.dataset.wheelKey];document.querySelector('[data-wheel-column="'+b.dataset.wheelKey+'"]').scrollTop=(Number(b.dataset.wheelValue)-m.min)/m.step*56;}
 if(b.dataset.drugToggle!==undefined){if(!$('drugMatches').hidden){$('drugMatches').hidden=true;$('careDrugName').setAttribute('aria-expanded','false');}else renderDrugMatches();}
 if(b.dataset.drugChoice){if(careView==='procedure'&&eventDraft.name!==b.dataset.drugChoice){chooseProcedureEntry('drug',b.dataset.drugChoice);return;}clearDrugForNameChange(b.dataset.drugChoice);eventDraft.name=b.dataset.drugChoice;eventDraft.drugSelected=true;applyDrugDefaults();$('careDrugName').value=eventDraft.name;$('drugMatches').hidden=true;$('careDrugName').setAttribute('aria-expanded','false');if(careView==='drug'||careView==='procedure'){delete eventDraft.repeatReminder;delete eventDraft.repeatDismissed;delete eventDraft.repeatContext;delete eventDraft.repeatMinutes;updateDrugGuidance();updateRepeatControl();}}
 if(b.dataset.procedureKind)chooseProcedureEntry(b.dataset.procedureKind);
 if(b.dataset.procedureDrug||b.dataset.procedureAction)chooseProcedureEntry(b.dataset.procedureDrug?'drug':'intervention',b.dataset.procedureDrug||b.dataset.procedureAction);
 if(b.dataset.procedureReference!==undefined){const shell=document.querySelector('.procedure-shell');shell.classList.toggle('show-procedure-reference');}
 if(b.dataset.procedureRecord!==undefined)saveCareEvent(true);
 if(b.dataset.procedureClear!==undefined){eventDraft={...eventDraft,name:'',dose:'',unit:'',route:'',details:''};renderCare(true);}
 if(b.dataset.careNow!==undefined){const d=careView==='vitals'?vitalDraft:eventDraft;Object.assign(d,freshCareTime());d.retrospective=false;renderCare();}
 if(b.dataset.carePdf){openDocument(b.dataset.carePdf,'NZCPG reference');if($('careModal').open){window.open(b.dataset.carePdf,'_blank','noopener,noreferrer');}}
});

document.getElementById('careModal').addEventListener('cancel',e=>{if(careView==='gcs'){e.preventDefault();careView='vitals';renderCare();}});

function syncEntryHeader(){const h=document.querySelector('body>header');if(h?.getBoundingClientRect)document.documentElement.style.setProperty('--entry-header-height',Math.ceil(h.getBoundingClientRect().height)+'px');}
window.addEventListener('resize',syncEntryHeader);
if(typeof ResizeObserver!=='undefined'){const header=document.querySelector('body>header');if(header)new ResizeObserver(syncEntryHeader).observe(header);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('careModal').open&&!$('wheelModal').open&&!$('repeatWheelModal').open){e.preventDefault();if(careView==='gcs'){careView='vitals';renderCare();}else stashCareDraft();}});
