/* Plain JavaScript. No build step, database, patient-data network requests or storage.
 * LOCAL in config.js controls options, stable tags, CPG links and prompts.
 * buildNotes() is the only source-to-note mapping. It never invents findings.
 */
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections=['History','Assessment','Impression','Vitals & Interventions','Disposition','Output'];
const emptyState=()=>({fields:{},arrest:emptyArrestState(),vitalSets:[],careEvents:[],casCall:false,social:[],frailty:null,fallsAssessment:Object.fromEntries(FALLS_ASSESSMENT.items.map(f=>[f.id,'Not assessed'])),fallsAssessmentConfirmed:false,treatmentEvents:[],fallsFlags:[],differentials:[],pathways:[],referrals:[],flags:{},edits:{}});
let state=emptyState(),step=0;
let guidanceMode='';
let guidanceAssessment=false,referencePane='',tourStep=0;
const v=k=>state.fields[k]||'';
// Field labels remain accessible; instructional text lives inside empty inputs.
const FIELD_HINTS={hpc:'Onset, sequence, progression and relevant context…',sourceDetails:'Source, communication needs or limits to the history…',background:'Relevant medical history, current medicines and allergies…',socialDetails:'Baseline function, home environment, support and substance use…',diagnosisOther:'Enter provisional diagnosis…',diagnosisReason:'Supporting evidence, uncertainty and alternatives…',treatment:'Interventions performed and reasons for decisions…',response:'Response, timing and reassessment findings…',enroute:'Events or changes during transport…',handover:'Destination, receiving clinician, time and agreed plan…',nontransportReason:'Assessment findings and reasoning for non-transport…',capacity:'Capacity assessment, understanding and supporting evidence…',refusal:'Recommendation, risks, alternatives, patient’s reasons and understanding…',safety:'Triggers for action, what to do, who will act and when…',followup:'Person or service, timeframe and confirmed arrangements…',referralDetails:'Recipient, reason, actions taken and timing…',pathwayDetails:'Record findings and scores for selected assessments…'};
function text(key,label,{short=false,placeholder='',required=false}={}){
 const hint=placeholder||FIELD_HINTS[key]||label+'…';
 return `<label>${label}${short?`<input data-field="${key}" placeholder="${esc(hint)}" value="${esc(v(key))}" ${required?'required':''}>`:`<textarea data-field="${key}" placeholder="${esc(hint)}" ${required?'required':''}>${esc(v(key))}</textarea>`}</label>`;
}
function options(items,current,blank='—'){return `<option value="">${blank}</option>`+items.map(x=>`<option value="${esc(x)}" ${current===x?'selected':''}>${esc(x)}</option>`).join('');}
function select(key,label,items){return `<label>${label}<select data-field="${key}">${options(items,v(key))}</select></label>`;}
function checks(items,selected,kind){return `<div class="checks">${items.map(x=>{const id=x.id||x,label=x.label||x;return `<label class="check"><input type="checkbox" data-check="${kind}" value="${esc(id)}" ${selected.includes(id)?'checked':''}>${esc(label)}</label>`;}).join('')}</div>`;}
function card(title,body,help=''){return `<section class="card"><div class="cardhead"><h2>${title}</h2>${help?`<button class="quiet" data-help="${esc(help)}" aria-label="${esc(title)} guidance">?</button>`:''}</div>${body}</section>`;}
function isNonTransport(){return ['Not transported — agreed plan','Declined recommended transport'].includes(v('disposition'));}
function changed(){state.edits={};}
function scale(){
 const n=state.frailty??1, data=LOCAL.frailty[n-1];
 return `<div class="scalehead"><span id="score" class="score">${state.frailty===null?'Not recorded':`${n} · ${data[0]}`}</span><div><button id="clearFrailty" class="quiet">Clear</button> <button id="openPdf" class="quiet">NHS PDF</button></div></div><input id="frailty" type="range" min="1" max="9" step="1" value="${n}" aria-label="Rockwood frailty score" aria-valuetext="${state.frailty===null?'Not recorded':`${n} ${data[0]}`}"><div class="ticks">${Array.from({length:9},(_,i)=>`<span>${i+1}</span>`).join('')}</div><p class="scale-description" id="scaleDescription">${esc(data[1])}</p>`;
}
function assessment(mode){
 const topics=Object.keys(GUIDANCE).filter(k=>k.startsWith(mode+'|')).map(k=>k.split('|')[1]);
 const title=mode==='SUBJECTIVE'?'Subjective':'Objective',key=mode==='SUBJECTIVE'?'subjective':'objective';
 return card(title,`<textarea class="narrative" data-field="${key}" aria-label="${title}" placeholder="${mode==='SUBJECTIVE'?'Reported symptoms…':'Observed findings…'}">${esc(v(key))}</textarea><div class="guidance-pick"><select data-guidance-mode="${mode}" aria-label="${title} guidance topic">${options(topics,'','Guidance…')}</select></div>`);
}
function differentialRow(d,i){return `<div class="differential"><div class="rowhead"><h3>Differential ${i+1}</h3><button class="quiet" data-remove-diff="${i}" aria-label="Remove differential ${i+1}">✕</button></div><div class="grid"><label>Diagnosis<input data-diff="${i}" data-part="diagnosis" value="${esc(d.diagnosis)}" required></label><label>Clinical reasoning<textarea data-diff="${i}" data-part="reasoning" placeholder="Evidence for / against" required>${esc(d.reasoning)}</textarea></label></div><div id="diff-cpg-${i}">${cpgSuggestions(d.diagnosis)}</div></div>`;}
function matchingCpgs(text){const words=text.toLowerCase();return LOCAL.cpgs.filter(c=>c.words.some(w=>new RegExp('(^|[^a-z])'+w+'([^a-z]|$)','i').test(words)));}
function cpgSuggestions(text){
 const matches=matchingCpgs(text);if(!matches.length)return '';
 return `<details class="cpg"><summary>NZ CPGs · ${matches.map(c=>esc(c.title)).join(', ')}</summary><p>Suggested references · confirm relevance. Selected prompts only.</p>${matches.map(c=>`<div class="cpg-item"><a href="${c.url}" target="_blank" rel="noopener noreferrer">${esc(c.title)} ↗</a>${c.note?`<p>${esc(c.note)}</p>`:''}${c.prompts.map((p,i)=>`<label>${esc(p)}<select data-flag="${c.id}|${i}" aria-label="${esc(c.title+' — '+p)}">${options(['Present','Absent','Not assessed'],state.flags[c.id+'|'+i]||'')}</select></label>`).join('')}${!c.prompts.length?'<p>See guideline for red flags and documentation criteria.</p>':''}</div>`).join('')}</details>`;
}
function diagnosisName(){return (v('diagnosis')==='Other'?v('diagnosisOther'):v('diagnosis')).trim();}
// Deliberately conservative: exclude negated, historical, uncertain and question
// phrases. This is a keyword reminder, not validated NLP or a PE probability rule.
function peReminderMatches(){
 const phrases=[v('subjective'),v('objective')].flatMap(text=>text.toLowerCase().split(/[.!;\n]+/));
 const uncertain=/\b(no|not|without|denies|denied|absent|negative|nil|normal|resolved|previous|previously|historical|history of|possible|possibly|suspected|query|rule out|r\/o|if|risk of|assess for|check for)\b|\?/;
 const affirmed=phrases.filter(phrase=>!uncertain.test(phrase));
 return PE_REMINDER.terms.every(aliases=>affirmed.some(phrase=>aliases.some(term=>new RegExp('\\b'+term+'\\b','i').test(phrase))));
}
function peAlreadyRecorded(){return /^(pulmonary embolism( \(pe\))?|pe)$/i.test(diagnosisName())||state.differentials.some(d=>/^(pulmonary embolism( \(pe\))?|pe)$/i.test(d.diagnosis.trim()));}
function peReminderLauncher(){return peReminderMatches()?`<button class="quiet pe-reminder-launcher" data-review-pe="true">Consider PE · review differential ↗</button>`:'';}
function peReminderPanel(){
 if(!peReminderMatches())return '';
 return `<section class="diagnosis-panel pe-reminder"><h3>Suggested differential · PE</h3><p class="matched-terms">Tachycardia · hypotension · hypoxia</p><p>${esc(PE_REMINDER.explanation)}</p><p class="subtle">${esc(PE_REMINDER.limitation)}</p><div class="reminder-actions"><button class="quiet" data-add-pe="true" ${peAlreadyRecorded()?'disabled':''}>${peAlreadyRecorded()?'PE already recorded':'Add to differentials'}</button><button class="quiet" data-pe-resources="true">PE resources ↗</button></div><details><summary>About this prompt</summary><p>Matches words in the current Assessment fields, including hyootension / hyoxia. Obvious negation or uncertainty suppresses a phrase; language and timing can still be misread. No finding, diagnosis, reasoning or disposition is entered automatically.</p><a href="${PE_REMINDER.source.url}" target="_blank" rel="noopener noreferrer">${PE_REMINDER.source.label} ↗</a></details></section>`;
}
function updatePeReminder(){
 const previouslyVisible=!!$('peReminderNotice')?.innerHTML;
 if($('peReminderNotice'))$('peReminderNotice').innerHTML=peReminderLauncher();
 renderClinicalPane();
 // Do not replace a reference the clinician is already reading or re-render inputs.
 if(peReminderMatches()&&!previouslyVisible&&!referencePane)openReference('clinical');
}
function clinicalTopic(){return v('dispositionGuidance')||v('diagnosis');}
function diagnosisPanels(){
 let html=guidelineUsedPanel()+peReminderPanel();
 if(clinicalTopic()==='Myocardial ischaemia'||state.treatmentEvents.length)html+=myocardialPanel();
 if(clinicalTopic()==='Falls'||hasFallsAssessment()||state.fallsFlags.length)html+=fallsPanel();
 if(clinicalTopic()==='Pulmonary Embolism (PE)')html+=pePanel();
 if(clinicalTopic()==='Ankle Injury')html+=anklePanel();
 return html;
}
function hasFallsAssessment(){return state.fallsAssessmentConfirmed||FALLS_ASSESSMENT.items.some(f=>state.fallsAssessment[f.id]!=='Not assessed');}
function fallsCase(){return clinicalTopic()==='Falls'||v('diagnosis')==='Falls'||hasFallsAssessment()||state.fallsFlags.length>0;}
function diagnosisLauncher(){
 const names={'Myocardial ischaemia':'Treatment sidebar','Falls':'Falls sidebar','Pulmonary Embolism (PE)':'PE risk assessment sidebar','Ankle Injury':'Ottawa Ankle Rules sidebar'};
 return diagnosisPanels()?`<button class="quiet clinical-launcher" data-open-clinical="true">${names[clinicalTopic()]||(peReminderMatches()?'PE differential prompt':'Recorded treatments / flags')} ↗</button>`:'';
}
function dispositionGuidanceSelect(){
 return `<label>Clinical disposition guidance<select data-field="dispositionGuidance"><option value="">Use provisional diagnosis${v('diagnosis')?' — '+esc(v('diagnosis')):''}</option>${DIAGNOSIS.options.filter(x=>x!=='Other').map(x=>`<option value="${esc(x)}" ${v('dispositionGuidance')===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>`;
}
function renderClinicalPane(){
 const pane=$('diagnosisPane'),scroll=pane.scrollTop;
 pane.innerHTML=diagnosisPanels()||'<p class="subtle">Choose a clinical guidance topic in Impression or Disposition.</p>';
 pane.querySelectorAll('[data-falls-cycle]').forEach(input=>{input.indeterminate=state.fallsAssessment[input.dataset.fallsCycle]==='Not assessed';});
 pane.scrollTop=scroll;
}
function referralPrompt(){
 if(!fallsCase()||state.referrals.includes('falls'))return '';
 return state.fallsAssessment.recurrent_falls==='Yes'?'<div class="referral-prompt"><strong>Recurrent falls · review referral eligibility.</strong><button class="linkbutton" data-open-falls="true">View falls pathway criteria ↗</button></div>':'<p class="referral-prompt">Falls case · consider a falls prevention referral.</p>';
}
// Fall states are guidance inputs until a clinician explicitly includes them in the note.
function setFallsAssessment(id,next){
 if(!FALLS_ASSESSMENT.items.some(f=>f.id===id)||!FALLS_ASSESSMENT.states.includes(next))return;
 state.fallsAssessment[id]=next;state.fallsAssessmentConfirmed=false;changed();render();
}
function fallsAssessmentControls(){
 return `<section class="falls-assessment"><h3>Falls assessment</h3><p class="subtle">Yes / No / Not assessed. These states enter the note only after confirmation.</p>${FALLS_ASSESSMENT.items.map(f=>{
  const current=state.fallsAssessment[f.id];
  return `<div class="assessment-state-row"><label class="assessment-state-label"><input type="checkbox" data-falls-cycle="${f.id}" aria-label="${esc(f.label)}" aria-describedby="falls-state-${f.id}" ${current==='Yes'?'checked':''}>${esc(f.label)}</label><div class="state-options" role="group" aria-label="${esc(f.label)} state">${FALLS_ASSESSMENT.states.map(option=>`<button class="quiet" data-falls-state="${f.id}" data-value="${option}" aria-label="${esc(f.label+' — '+option)}" aria-pressed="${current===option}">${option}</button>`).join('')}</div><span class="sr-only" id="falls-state-${f.id}">Current state: ${current}. Checkbox cycles Yes, No, Not assessed.</span></div>`;
 }).join('')}<label class="confirmation-check"><input id="confirmFallsAssessment" type="checkbox" ${state.fallsAssessmentConfirmed?'checked':''}>Include these states in the note</label><div class="falls-warnings" aria-live="polite">${fallsAssessmentPrompts()}</div></section>`;
}
function fallsAssessmentPrompts(){
 return FALLS_ASSESSMENT.items.filter(f=>state.fallsAssessment[f.id]==='Yes').map(f=>`<section class="clinical-prompt ${f.level}"><h3>${esc(f.title)}</h3><p>${esc(f.prompt)}</p>${f.id==='recurrent_falls'?`<p>${esc(FALLS_ASSESSMENT.eligibility)}</p><a href="${DIAGNOSIS.falls.url}" target="_blank" rel="noopener noreferrer">Falls pathway · CPG EAS 13.3 ↗</a>`:''}</section>`).join('');
}
function confirmedFallsAssessmentNote(){
 if(!state.fallsAssessmentConfirmed)return '';
 return 'Falls assessment — clinician confirmed\n'+FALLS_ASSESSMENT.items.map(f=>`${f.label}: ${state.fallsAssessment[f.id]}`).join('\n');
}
function externalResource(resource){return `<a class="external-resource" href="${resource.url}" target="_blank" rel="noopener noreferrer">${esc(resource.label)} ↗<span class="sr-only"> (opens in a new tab)</span></a>`;}
function pePanel(){
 return `<section class="diagnosis-panel resource-panel"><h3>Pulmonary Embolism (PE)</h3><h4>Clinical risk assessment</h4>${DISPOSITION_RESOURCES.pe.tools.map(tool=>`<section class="resource-row">${externalResource(tool)}<p>${esc(tool.description)}</p></section>`).join('')}<p class="clinical-scope">External reference tools only. No score, PE rule-out result or disposition is calculated here.</p></section>`;
}
function anklePanel(){
 const ankle=DISPOSITION_RESOURCES.ankle;
 return `<section class="diagnosis-panel resource-panel"><h3>Ankle Injury</h3><h4>Ottawa Ankle Rules</h4><section class="resource-row">${externalResource(ankle.text)}</section><section class="resource-row">${externalResource(ankle.video)}<p>Dr Ian Stiell demonstrates ankle and foot assessment. If this page is unavailable, use the same video from EM Ottawa:</p>${externalResource(ankle.fallback)}</section>${ankle.criteria.map(c=>`<section class="resource-row"><h4>${esc(c.label)}</h4><p>${esc(c.description)}</p></section>`).join('')}<p class="clinical-scope">${esc(ankle.limitations)}</p></section>`;
}
function myocardialPanel(){
 return `<section class="diagnosis-panel"><div class="rowhead"><h3>Myocardial ischaemia · initial treatment</h3><a href="${DIAGNOSIS.myocardial.url}" target="_blank" rel="noopener noreferrer">CPG EAS 3.2 ↗</a></div><p class="subtle">${esc(DIAGNOSIS.myocardial.scope)}</p>${DIAGNOSIS.myocardial.treatments.map(t=>`<div class="treatment-row"><div class="treatment-heading"><span>${esc(t.prompt)}</span><button class="quiet" data-stamp="${t.id}" aria-label="Timestamp ${esc(t.action)}">+ Time</button></div>${state.treatmentEvents.map((e,i)=>({e,i})).filter(({e})=>e.treatmentId===t.id).map(({e,i})=>`<div class="time-entry"><input type="datetime-local" data-event="${i}" data-part="at" aria-label="${esc(t.action)} time ${i+1}" value="${esc(e.local)}"><input data-event="${i}" data-part="detail" aria-label="${esc(t.action)} details ${i+1}" value="${esc(e.detail)}" placeholder="${t.medication?'Actual dose / details':'Details'}"><button class="quiet" data-remove-event="${i}" aria-label="Remove ${esc(t.action)} time ${i+1}">✕</button></div>`).join('')}</div>`).join('')}</section>`;
}
function fallsPanel(){
 const table=(name,items,context)=>`<section class="falls-table ${name.toLowerCase()}"><h3>${name} flags</h3><p class="subtle">${context}</p>${items.map(f=>`<label class="flag-check"><input type="checkbox" data-check="fallsFlags" value="${f.id}" ${state.fallsFlags.includes(f.id)?'checked':''}>${esc(f.label)}</label>`).join('')}</section>`;
 return `<section class="diagnosis-panel"><div class="rowhead"><h3>Falls</h3><a href="${DIAGNOSIS.falls.url}" target="_blank" rel="noopener noreferrer">CPG EAS 13.3 ↗</a></div><p class="subtle">Red / orange flags: tick findings present. Unticked flags are not recorded as absent.</p>${fallsAssessmentControls()}<div class="grid">${table('Red',DIAGNOSIS.falls.red,'ED assessment, usually by ambulance')}${table('Orange',DIAGNOSIS.falls.orange,'Primary-care follow-up')}</div></section>`;
}
function localDateTime(date){const pad=n=>String(n).padStart(2,'0');return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;}
function addTreatmentEvent(id){
 const now=new Date();now.setSeconds(0,0);
 state.treatmentEvents.push({treatmentId:id,at:now.toISOString(),local:localDateTime(now),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,detail:''});
}
function updateTreatmentEvent(input){
 const event=state.treatmentEvents[+input.dataset.event];
 if(input.dataset.part==='detail'){event.detail=input.value;return;}
 event.local=input.value;
 const parsed=new Date(input.value);
 event.at=input.value&&!Number.isNaN(parsed.getTime())?parsed.toISOString():'';
 event.timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function eventTime(e){return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:e.timeZone}).format(new Date(e.at))+` (${e.timeZone})`;}
function treatmentNote(){
 const events=state.treatmentEvents.filter(e=>e.at).slice().sort((a,b)=>new Date(a.at)-new Date(b.at));
 if(!events.length)return '';
 return 'Treatment timeline\n'+events.map(e=>{const t=DIAGNOSIS.myocardial.treatments.find(t=>t.id===e.treatmentId);return `${eventTime(e)} — ${t.action}${e.detail.trim()?': '+e.detail.trim():t.medication?' — dose not recorded':''}`;}).join('\n');
}
function fallsNote(){
 if(!state.fallsFlags.length)return '';
 return ['red','orange'].map(group=>{const selected=DIAGNOSIS.falls[group].filter(f=>state.fallsFlags.includes(f.id));return selected.length?`Falls — ${group} flags present\n`+selected.map(f=>'• '+f.label).join('\n'):'';}).filter(Boolean).join('\n\n');
}
function render(){
 $('navigation').innerHTML=sections.map((s,i)=>`<button data-step="${i}" class="${step===i?'active':''}" ${step===i?'aria-current="page"':''}><span class="section-number">0${i+1}</span>${s}</button>`).join('');
 $('back').disabled=step===0;$('next').disabled=step===5;
 let html='';
 if(step===0)html=card('History',text('hpc','History of presenting complaint')+`<div id="historyCpg">${cpgSuggestions(v('hpc'))}</div><div class="grid">${select('source','Source',CONFIG.historySources)}${text('sourceDetails','Limitations / source details',{short:true})}</div><details><summary>OPQRST</summary><div class="grid">${text('onset','Onset / last known well',{short:true})}${text('provocation','Provoking / relieving',{short:true})}${text('quality','Quality',{short:true})}${text('radiation','Location / radiation',{short:true})}${text('severity','Severity / function',{short:true})}${text('timing','Timing',{short:true})}</div></details>`,'History of Incident')+card('Background',text('background','Medical history / medication / allergies'))+card('Rockwood frailty',scale())+card('Social history',checks(LOCAL.social,state.social,'social')+text('socialDetails','Details'));
 if(step===1)html=`<div class="assessment">${assessment('SUBJECTIVE')}${assessment('OBJECTIVE')}</div><div id="peReminderNotice" role="status">${peReminderLauncher()}</div>`;
 if(step===2)html=card('Provisional diagnosis',select('diagnosis','Diagnosis',DIAGNOSIS.options)+(v('diagnosis')==='Other'?text('diagnosisOther','Other diagnosis',{short:true,required:true}):'')+text('diagnosisReason','Clinical reasoning',{placeholder:'Supporting evidence / uncertainty',required:true})+`<div id="diagnosisCpg">${v('diagnosis')==='Other'?cpgSuggestions(v('diagnosisOther')):''}</div>`+diagnosisLauncher(),'Clinical Impression')+card('Guideline Used',select('guidelineUsed','Guideline Used',Object.keys(GUIDELINES_USED)))+card('Differential diagnoses',`<div id="peReminderNotice" role="status">${peReminderLauncher()}</div>`+state.differentials.map(differentialRow).join('')+'<button class="quiet" id="addDiff">+ Differential</button>')+card('Pathway / research assessment',checks(LOCAL.pathways,state.pathways,'pathways')+(state.pathways.length?text('pathwayDetails','Findings / scores'):''));
 if(step===3)html=careScreen();
 if(step===4){
  html=card('Treatment',text('treatment','Intervention / rationale')+text('response','Response / reassessment')+text('enroute','En route'))+card('Disposition',dispositionGuidanceSelect()+select('disposition','Outcome',CONFIG.dispositions)+text('handover','Handover / onward plan')+`<label class="check"><input id="casCall" type="checkbox" ${state.casCall?'checked':''}>CAS Call</label>`,'Disposition Tab - Screen 1');
  if(isNonTransport())html+=card('Non-transport',text('nontransportReason','Rationale')+text('capacity','Capacity / understanding')+(v('disposition')==='Declined recommended transport'?text('refusal','Refusal discussion'):'')+text('safety','Safety-netting')+text('followup','Follow-up / supports')+`<div class="grid">${select('competency','Competency checklist',['Completed','Not completed','Not applicable'])}${select('acs','ACS / signatures',['Completed','Not completed','Not applicable'])}</div>`,'Non-transporting');
  html+=card('Referrals made',referralPrompt()+checks(LOCAL.referrals,state.referrals,'referrals')+(state.referrals.length?''+text('referralDetails','Referral details'):''));
 }
 if(step===5){
  const missing=reasoningErrors();
  html='<div class="toolbar"><h1>Output</h1><span class="spacer"></span><button id="copyAll">Copy all</button><button id="exportJson" class="quiet">JSON</button></div>';
  if(missing.length)html+=`<div class="missing"><ul>${missing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;
  const notes=outputNotes();html+=Object.entries(notes).filter(([,t])=>t.trim()).map(([title,note])=>`<section class="card"><div class="cardhead"><h2>${title}</h2><div class="output-actions"><button class="quiet" data-restore="${title}">↺</button><button data-copy="${title}">Copy</button></div></div><textarea class="output" data-output="${title}" aria-label="${title} output">${esc(note)}</textarea></section>`).join('');
  if(!Object.values(notes).some(x=>x.trim()))html+='<p class="subtle">No entries.</p>';
  html+=`<label class="check learning-placeholder"><input id="learningEmail" type="checkbox" ${learningEmailRequested?'checked':''}>Send Learning Version to Author’s email</label><p class="subtle">Inactive · nothing is sent.</p>`;
 }
 $('content').innerHTML=html;
 renderClinicalPane();
 if(step===4&&fallsCase()){
  const referral=document.querySelector('[data-check="referrals"][value="falls"]');
  if(referral){referral.closest('label').classList.add('falls-referral-highlight');referral.setAttribute('aria-description','Falls case: review whether a falls prevention referral is appropriate.');}
 }
 document.querySelectorAll('.assessment .card').forEach(section=>{
  const guidance=section.querySelector('.guidance-pick');
  if(guidance)section.querySelector('.cardhead').append(guidance);
 });
 // Let the whole note remain visible when reviewing, including on tablets.
 document.querySelectorAll('textarea.output').forEach(t=>{t.style.height='auto';t.style.height=(t.scrollHeight+2)+'px';});
}
function join(parts,separator='\n'){return parts.filter(x=>x?.trim()).join(separator);}
function line(label,value){return value?.trim()?`${label}: ${value.trim()}`:'';}
function buildNotes(){
 const source=join([v('source'),v('sourceDetails')],' — ');
 const frailty=state.frailty===null?'':`Rockwood CFS ${state.frailty} — ${LOCAL.frailty[state.frailty-1][0]}.`;
 const social=join([state.social.map(id=>LOCAL.social.find(x=>x.id===id)?.label).filter(Boolean).join('; '),v('socialDetails')],'. ');
 const history=join([line('History source',source),v('hpc').trim(),...['onset','provocation','quality','radiation','severity','timing'].map((k,i)=>line(['Onset / last known well','Provoking / relieving','Quality','Location / radiation','Severity / function','Timing'][i],v(k))),line('Background',v('background')),frailty,line('Social history',social),v('subjective').trim()],'\n\n');
 const flags=Object.entries(state.flags).filter(([,s])=>s).map(([id,s])=>{const [c,i]=id.split('|'),g=LOCAL.cpgs.find(x=>x.id===c);return `${g.title} — ${g.prompts[+i]}: ${s.toLowerCase()}.`;});
 const diagnosis=join([diagnosisName()?`Provisional diagnosis: ${diagnosisName()}`:'',v('diagnosisReason').trim()]);
 const differential=state.differentials.filter(d=>d.diagnosis.trim()||d.reasoning.trim()).map(d=>`• ${d.diagnosis.trim()||'Diagnosis not recorded'}${d.reasoning.trim()?` — ${d.reasoning.trim()}`:' — reasoning not recorded'}`).join('\n');
 const impression=join([v('objective').trim(),state.vitalSets.length?'Vitals\n'+vitalsNote():'',diagnosis,line('Guideline used',v('guidelineUsed')),differential?'Differentials\n'+differential:'',flags.length?'CPG documentation\n'+flags.join('\n'):'',fallsNote(),confirmedFallsAssessmentNote(),state.pathways.length?'Pathway assessments: '+state.pathways.join(', ')+ (v('pathwayDetails').trim()?'\n'+v('pathwayDetails').trim():''):''],'\n\n');
 const referrals=state.referrals.map(id=>{const r=LOCAL.referrals.find(x=>x.id===id);return `${r.label} ${r.tag}`;}).join('; ');
 const disposition=join([treatmentNote(),state.careEvents.length?'Vitals & Interventions — actions\n'+careEventsNote():'',state.casCall?'CAS Call: Yes':'',line('Treatment',v('treatment')),line('Response',v('response')),line('En route',v('enroute')),v('disposition'),v('handover').trim(),isNonTransport()?join([line('Non-transport rationale',v('nontransportReason')),line('Capacity / understanding',v('capacity')),v('disposition')==='Declined recommended transport'?line('Refusal discussion',v('refusal')):'',line('Safety-netting',v('safety')),line('Follow-up',v('followup')),line('Competency checklist',v('competency')),line('ACS / signatures',v('acs'))],'\n\n'):'',referrals?'Referrals made: '+referrals+(v('referralDetails').trim()?'\n'+v('referralDetails').trim():''):''],'\n\n');
 return {'History of Incident':history,'Clinical Impression':impression,'Disposition':disposition};
}
function outputNotes(){return {...buildNotes(),...state.edits};}
function reasoningErrors(){const errors=[];
 if(v('diagnosis')==='Other'&&!v('diagnosisOther').trim())errors.push('Enter the other provisional diagnosis.');
 if(diagnosisName()&&!v('diagnosisReason').trim())errors.push('Provisional diagnosis: add clinical reasoning.');
 state.differentials.forEach((d,i)=>{if(d.diagnosis.trim()&&!d.reasoning.trim())errors.push(`Differential ${i+1}: add clinical reasoning.`);if(d.reasoning.trim()&&!d.diagnosis.trim())errors.push(`Differential ${i+1}: add diagnosis.`);});
 state.treatmentEvents.forEach(e=>{if(!e.at)errors.push('Complete or remove a blank treatment timestamp.');});
 return errors;}
function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',3000);}
function navigate(n){if($('wheelModal').open)$('wheelModal').close();if($('careModal').open)stashCareDraft();step=n;render();if(n===2&&diagnosisPanels())openReference('clinical');document.querySelector('main').scrollTop=0;window.scrollTo({top:0,behavior:'instant'});}
async function copy(note){if(!note.trim()){toast('No text.');return;}if(reasoningErrors().length){toast('Complete the highlighted documentation in Assessment / Impression.');return;}try{await navigator.clipboard.writeText(note);toast('Copied');}catch{const t=document.createElement('textarea');t.value=note;document.body.append(t);t.select();const copied=document.execCommand('copy');t.remove();toast(copied?'Copied':'Select text and copy manually.');}}
function showHelp(query=''){
 const parts=query.split('|');guidanceMode=parts.length>1?parts[0]:'';
 guidanceAssessment=['SUBJECTIVE','OBJECTIVE'].includes(guidanceMode);
 $('helpSearch').value=parts.length>1?parts[1]:query;searchHelp();openReference('guidance');
}
function searchHelp(){
 const q=$('helpSearch').value.trim().toLowerCase();
 const results=Object.entries(GUIDANCE).filter(([k,p])=>(!guidanceMode||k.startsWith(guidanceMode+'|'))&&(k+' '+p.join(' ')).toLowerCase().includes(q));
 const links=guidanceAssessment?'':'<p><a href="https://cpg.stjohn.org.nz/" target="_blank" rel="noopener noreferrer">All NZ CPGs ↗</a></p>'+LOCAL.cpgs.filter(c=>(c.title+' '+c.words.join(' ')).toLowerCase().includes(q)).map(c=>`<p><a href="${c.url}" target="_blank" rel="noopener noreferrer">${esc(c.title)} ↗</a></p>`).join('');
 const content=results.map(([key,p])=>`<section class="helpblock"><p class="subtle">${key.split('|')[0]}</p><h3>${esc(key.split('|')[1])}</h3>${p.map(x=>`<p>${esc(x)}</p>`).join('')}</section>`).join('');
 $('helpResults').innerHTML=links+(content||'<p>No matching guidance.</p>');
}
// Local animations use illustrative examples; they cannot access or edit state.
function renderTour(){
 const slide=APP_TOUR[tourStep],n=i=>String(i+1).padStart(2,'0');
 $('explainContent').innerHTML=`<div class="tour-heading"><span class="tour-index">${n(tourStep)} / ${APP_TOUR.length}</span><h2>${esc(slide.title)}</h2></div>${tourDemo(slide)}<div class="tour-playback"><span>Example · 5-second demo</span><button class="quiet" id="tourPause" aria-pressed="false">Pause</button><button class="quiet" id="tourReplay">Replay</button></div><p class="tour-caption">${esc(slide.description)}</p><div class="tour-controls"><button class="quiet" id="tourBack" ${tourStep===0?'disabled':''}>Previous</button><button id="tourNext">${tourStep===APP_TOUR.length-1?'Done':'Next'}</button></div><nav class="tour-steps" aria-label="Explain app topics">${APP_TOUR.map((s,i)=>`<button class="quiet ${i===tourStep?'active':''}" data-tour-step="${i}" aria-label="${esc(s.title)}" ${i===tourStep?'aria-current="step"':''}>${n(i)} ${esc(s.short)}</button>`).join('')}</nav><p class="subtle">Examples never change your draft. Reduced-motion preferences show a still demonstration.</p>`;
 $('explainPane').scrollTop=0;
}
function showTour(){if($('careModal').open)stashCareDraft();tourStep=0;renderTour();openReference('explain');}
// Inputs update state without re-rendering, preserving focus and tablet keyboard.
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.dataset.output){state.edits[t.dataset.output]=t.value;t.style.height='auto';t.style.height=(t.scrollHeight+2)+'px';return;}
 if(t.id==='frailty'){
  state.frailty=+t.value;changed();const data=LOCAL.frailty[state.frailty-1];$('score').textContent=`${state.frailty} · ${data[0]}`;$('scaleDescription').textContent=data[1];t.setAttribute('aria-valuetext',`${state.frailty} ${data[0]}`);return;
 }
 if(t.dataset.field){if(t.classList.contains('narrative')){t.style.height='auto';t.style.height=(t.scrollHeight+2)+'px';}state.fields[t.dataset.field]=t.value;changed();if(['subjective','objective'].includes(t.dataset.field))updatePeReminder();if(t.dataset.field==='hpc')$('historyCpg').innerHTML=cpgSuggestions(t.value);if(t.dataset.field==='diagnosisOther')$('diagnosisCpg').innerHTML=cpgSuggestions(t.value);}
 if(t.dataset.diff!==undefined){state.differentials[+t.dataset.diff][t.dataset.part]=t.value;changed();if(t.dataset.part==='diagnosis')$('diff-cpg-'+t.dataset.diff).innerHTML=cpgSuggestions(t.value);}
 if(t.dataset.event!==undefined){updateTreatmentEvent(t);changed();}
 if(t.dataset.flag){state.flags[t.dataset.flag]=t.value;changed();syncFlagInputs(t);}
});
function syncFlagInputs(source){document.querySelectorAll('[data-flag]').forEach(t=>{if(t!==source&&t.dataset.flag===source.dataset.flag)t.value=source.value;});}
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.id==='confirmFallsAssessment'){state.fallsAssessmentConfirmed=t.checked;changed();return;}
 if(t.dataset.check){const key=t.dataset.check,id=t.value;if(t.checked){state[key].push(id);if(key==='social'){const item=LOCAL.social.find(x=>x.id===id);if(item?.group)state.social=state.social.filter(x=>x===id||LOCAL.social.find(a=>a.id===x)?.group!==item.group);if(id==='independent_adls')state.social=state.social.filter(x=>x!=='help_with_adls');if(id==='help_with_adls')state.social=state.social.filter(x=>x!=='independent_adls');}}else state[key]=state[key].filter(x=>x!==id);changed();render();}
 if(['disposition','diagnosis','dispositionGuidance','guidelineUsed'].includes(t.dataset.field)){if(t.dataset.field==='diagnosis')state.fields.dispositionGuidance='';render();if(t.dataset.field!=='disposition'&&diagnosisPanels())openReference('clinical');}
 if(t.dataset.guidanceMode&&t.value){showHelp(t.dataset.guidanceMode+'|'+t.value);t.value='';}
});
document.addEventListener('click',e=>{
 const cycle=e.target.closest('[data-falls-cycle]');
 if(cycle){e.preventDefault();const id=cycle.dataset.fallsCycle;const sequence=['Not assessed','Yes','No'];setFallsAssessment(id,sequence[(sequence.indexOf(state.fallsAssessment[id])+1)%3]);return;}
 const anchor=e.target.closest('a');
 const references={
  [DIAGNOSIS.myocardial.url]:['cpg-myocardial.pdf','CPG EAS 3.2'],
  [DIAGNOSIS.falls.url]:['cpg-falls.pdf','CPG EAS 13.3']
 };
 if(anchor&&references[anchor.href]){e.preventDefault();openDocument(...references[anchor.href]);return;}
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.step!==undefined)navigate(+b.dataset.step);
 if(b.dataset.help)showHelp(b.dataset.help);
 if(b.dataset.openClinical)openReference('clinical');
 if(b.dataset.reviewPe){renderClinicalPane();openReference('clinical');}
 if(b.dataset.peResources){state.fields.dispositionGuidance='Pulmonary Embolism (PE)';render();openReference('clinical');}
 if(b.dataset.addPe&&peReminderMatches()&&!peAlreadyRecorded()){
  state.differentials.push({diagnosis:'Pulmonary Embolism (PE)',reasoning:''});changed();navigate(2);openReference('clinical');
 }
 if(b.id==='tourPause'){const demo=$('tourDemo'),paused=demo.classList.toggle('tour-paused');b.setAttribute('aria-pressed',String(paused));b.textContent=paused?'Play':'Pause';}
 if(b.id==='tourReplay')renderTour();
 if(b.dataset.fallsState){setFallsAssessment(b.dataset.fallsState,b.dataset.value);}
 if(b.dataset.openFalls){state.fields.dispositionGuidance='Falls';render();openReference('clinical');}
 if(b.id==='tourBack'){tourStep=Math.max(0,tourStep-1);renderTour();}
 if(b.id==='tourNext'){if(tourStep===APP_TOUR.length-1)closeReference();else{tourStep++;renderTour();}}
 if(b.dataset.tourStep!==undefined){tourStep=+b.dataset.tourStep;renderTour();}
 if(b.dataset.stamp){addTreatmentEvent(b.dataset.stamp);changed();render();}
 if(b.dataset.removeEvent!==undefined){state.treatmentEvents.splice(+b.dataset.removeEvent,1);changed();render();}
 if(b.id==='clearFrailty'){state.frailty=null;changed();render();}
 if(b.id==='openPdf')openDocument('rockwood-nhs.pdf','Rockwood · NHS');
 if(b.id==='addDiff'){state.differentials.push({diagnosis:'',reasoning:''});changed();render();}
 if(b.dataset.removeDiff!==undefined){state.differentials.splice(+b.dataset.removeDiff,1);changed();render();}
 if(b.dataset.copy)copy(outputNotes()[b.dataset.copy]||'');
 if(b.id==='copyAll')copy(Object.entries(outputNotes()).filter(([,s])=>s.trim()).map(([k,s])=>k.toUpperCase()+'\n'+s).join('\n\n'));
 if(b.dataset.restore){delete state.edits[b.dataset.restore];render();}
 if(b.id==='exportJson'){
  if(!confirm('Export patient data? Save only in an approved location.'))return;
  const payload={schemaVersion:LOCAL.schemaVersion,exportedAt:new Date().toISOString(),...state,generatedNotes:buildNotes(),finalNotes:outputNotes()};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='clinical-documentation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
});
$('back').onclick=()=>navigate(Math.max(0,step-1));$('next').onclick=()=>navigate(Math.min(sections.length-1,step+1));$('helpButton').onclick=showTour;$('helpButton').setAttribute('aria-label','Explain app');$('helpSearch').oninput=()=>{guidanceMode='';searchHelp();};
// References occupy their own layout track. They never trap focus or cover the editor.
function openReference(pane){
 referencePane=pane;
 $('referenceDock').hidden=false;$('appShell').classList.add('has-reference');
 $('guidancePane').hidden=pane!=='guidance';$('pdfPane').hidden=pane!=='pdf';$('diagnosisPane').hidden=pane!=='clinical';$('explainPane').hidden=pane!=='explain';
 $('showGuidance').setAttribute('aria-pressed',String(pane==='guidance'));$('showClinical').setAttribute('aria-pressed',String(pane==='clinical'));$('showExplain').setAttribute('aria-pressed',String(pane==='explain'));
 $('showReferencePdf').setAttribute('aria-pressed',String(pane==='pdf'));
}
function openDocument(url,title){
 $('referencePdf').data=url;$('referencePdf').title=title;$('referenceExternal').href=url;
 $('showReferencePdf').textContent=title;
 openReference('pdf');
}
function closeReference(){ referencePane='';$('referenceDock').hidden=true;$('appShell').classList.remove('has-reference'); }
$('closeReference').onclick=closeReference;$('showClinical').onclick=()=>{renderClinicalPane();openReference('clinical');};$('showExplain').onclick=showTour;$('showGuidance').onclick=()=>{if(!$('helpResults').innerHTML)searchHelp();openReference('guidance');};$('showReferencePdf').onclick=()=>openReference('pdf');
$('reset').onclick=()=>{if(confirm('Clear draft?')){clearCareDrafts();state=emptyState();learningEmailRequested=false;navigate(0);toast('Cleared');}};
window.addEventListener('beforeunload',e=>{if(Object.values(outputNotes()).some(Boolean)||hasUnsavedCare()){e.preventDefault();e.returnValue='';}});
render();

// A tap on the first slider position must explicitly record score 1 as well.
function recordCurrentSlider(e){
 const t=e.target;if(t.id!=='frailty')return;
 state.frailty=+t.value;changed();const data=LOCAL.frailty[state.frailty-1];
 $('score').textContent=`${state.frailty} · ${data[0]}`;
 $('scaleDescription').textContent=data[1];
 t.setAttribute('aria-valuetext',`${state.frailty} ${data[0]}`);
}
document.addEventListener('pointerup',recordCurrentSlider);
document.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Enter',' '].includes(e.key))recordCurrentSlider(e);});
