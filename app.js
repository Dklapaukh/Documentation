/* Plain JavaScript. No build step, database, patient-data network requests or storage.
 * LOCAL in config.js controls options, stable tags, CPG links and prompts.
 * buildNotes() is the only source-to-note mapping. It never invents findings.
 */
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections=['History','Assessment','Impression','Disposition','Output'];
const emptyState=()=>({fields:{},social:[],frailty:null,findings:[],differentials:[],pathways:[],referrals:[],flags:{},edits:{}});
let state=emptyState(),step=0;
const v=k=>state.fields[k]||'';
function text(key,label,{short=false,placeholder='',required=false}={}){
 return `<label>${label}${short?`<input data-field="${key}" value="${esc(v(key))}" ${required?'required':''}>`:`<textarea data-field="${key}" placeholder="${esc(placeholder)}" ${required?'required':''}>${esc(v(key))}</textarea>`}</label>`;
}
function options(items,current,blank='—'){return `<option value="">${blank}</option>`+items.map(x=>`<option value="${esc(x)}" ${current===x?'selected':''}>${esc(x)}</option>`).join('');}
function select(key,label,items){return `<label>${label}<select data-field="${key}">${options(items,v(key))}</select></label>`;}
function checks(items,selected,kind){return `<div class="checks">${items.map(x=>{const id=x.id||x,label=x.label||x;return `<label class="check"><input type="checkbox" data-check="${kind}" value="${esc(id)}" ${selected.includes(id)?'checked':''}>${esc(label)}</label>`;}).join('')}</div>`;}
function card(title,body,help=''){return `<section class="card"><div class="cardhead"><h2>${title}</h2>${help?`<button class="quiet" data-help="${esc(help)}" aria-label="${esc(title)} guidance">?</button>`:''}</div>${body}</section>`;}
function isNonTransport(){return ['Not transported — agreed plan','Declined recommended transport'].includes(v('disposition'));}
function changed(){state.edits={};}
function scale(){
 const n=state.frailty??1, data=LOCAL.frailty[n-1];
 return `<div class="scalehead"><span id="score" class="score">${state.frailty===null?'Not recorded':`${n} · ${data[0]}`}</span><div><button id="clearFrailty" class="quiet">Clear</button> <button id="openPdf" class="quiet">NHS PDF</button></div></div><input id="frailty" type="range" min="1" max="9" step="1" value="${n}" aria-label="Rockwood frailty score" aria-valuetext="${state.frailty===null?'Not recorded':`${n} ${data[0]}`}"><div class="ticks">${Array.from({length:9},(_,i)=>`<span>${i+1}</span>`).join('')}</div><p class="scale-description" id="scaleDescription">${state.frailty===null?'Move slider to record a score.':esc(data[1])}</p>`;
}
function assessment(mode){
 const topics=Object.keys(GUIDANCE).filter(k=>k.startsWith(mode+'|')).map(k=>k.split('|')[1]);
 const title=mode==='SUBJECTIVE'?'Subjective':'Objective',key=mode==='SUBJECTIVE'?'subjective':'objective';
 const rows=state.findings.map((f,i)=>({f,i})).filter(({f})=>f.mode===mode);
 return card(title,`<textarea class="narrative" data-field="${key}" aria-label="${title}" placeholder="${mode==='SUBJECTIVE'?'Reported symptoms…':'Observed findings…'}">${esc(v(key))}</textarea><details ${rows.length?'open':''}><summary>Structured findings${rows.length?` (${rows.length})`:''}</summary>${rows.map(({f,i})=>findingRow(f,i,topics)).join('')}<button class="quiet" data-add-finding="${mode}">+ Finding</button></details><div class="guidance-pick"><select data-guidance-mode="${mode}" aria-label="${title} guidance topic">${options(topics,'','Guidance…')}</select></div>`);
}
function findingRow(f,i,topics){
 const labels=(GUIDANCE[f.mode+'|'+f.topic]||[]).map(l=>l.split(':')[0]);
 const statuses=f.mode==='SUBJECTIVE'?['Reported','Denied','Not asked','Unable to obtain']:['Observed','Not assessed','Unable to assess'];
 return `<div class="finding"><button class="quiet remove" data-remove-finding="${i}" aria-label="Remove finding ${i+1}">✕</button><div class="grid"><label>System<select data-finding="${i}" data-part="topic">${options(topics,f.topic)}</select></label><label>Finding<select data-finding="${i}" data-part="label">${options(labels,f.label)}</select></label></div><label>Status<select data-finding="${i}" data-part="status">${options(statuses,f.status)}</select></label><input data-finding="${i}" data-part="detail" aria-label="Finding ${i+1} details" value="${esc(f.detail)}" placeholder="Details">${f.topic?`<button class="linkbutton" data-help="${esc(f.mode+'|'+f.topic)}">? ${esc(f.label||f.topic)}</button>`:''}</div>`;
}
function differentialRow(d,i){return `<div class="differential"><div class="rowhead"><h3>Differential ${i+1}</h3><button class="quiet" data-remove-diff="${i}" aria-label="Remove differential ${i+1}">✕</button></div><div class="grid"><label>Diagnosis<input data-diff="${i}" data-part="diagnosis" value="${esc(d.diagnosis)}" required></label><label>Clinical reasoning<textarea data-diff="${i}" data-part="reasoning" placeholder="Evidence for / against" required>${esc(d.reasoning)}</textarea></label></div><div id="diff-cpg-${i}">${cpgSuggestions(d.diagnosis)}</div></div>`;}
function matchingCpgs(text){const words=text.toLowerCase();return LOCAL.cpgs.filter(c=>c.words.some(w=>new RegExp('(^|[^a-z])'+w+'([^a-z]|$)','i').test(words)));}
function cpgSuggestions(text){
 const matches=matchingCpgs(text);if(!matches.length)return '';
 return `<details class="cpg"><summary>NZ CPGs · ${matches.map(c=>esc(c.title)).join(', ')}</summary><p>Suggested references · confirm relevance. Selected prompts only.</p>${matches.map(c=>`<div class="cpg-item"><a href="${c.url}" target="_blank" rel="noopener noreferrer">${esc(c.title)} ↗</a>${c.note?`<p>${esc(c.note)}</p>`:''}${c.prompts.map((p,i)=>`<label>${esc(p)}<select data-flag="${c.id}|${i}" aria-label="${esc(c.title+' — '+p)}">${options(['Present','Absent','Not assessed'],state.flags[c.id+'|'+i]||'')}</select></label>`).join('')}${!c.prompts.length?'<p>See guideline for red flags and documentation criteria.</p>':''}</div>`).join('')}</details>`;
}
function render(){
 $('navigation').innerHTML=sections.map((s,i)=>`<button data-step="${i}" class="${step===i?'active':''}" ${step===i?'aria-current="page"':''}>${s}</button>`).join('');
 $('back').disabled=step===0;$('next').disabled=step===4;
 let html='';
 if(step===0)html=card('History',text('hpc','History of presenting complaint')+`<div id="historyCpg">${cpgSuggestions(v('hpc'))}</div><div class="grid">${select('source','Source',CONFIG.historySources)}${text('sourceDetails','Limitations / source details',{short:true})}</div><details><summary>OPQRST</summary><div class="grid">${text('onset','Onset / last known well',{short:true})}${text('provocation','Provoking / relieving',{short:true})}${text('quality','Quality',{short:true})}${text('radiation','Location / radiation',{short:true})}${text('severity','Severity / function',{short:true})}${text('timing','Timing',{short:true})}</div></details>`,'History of Incident')+card('Background',text('background','Medical history / medication / allergies'))+card('Rockwood frailty',scale())+card('Social history',checks(LOCAL.social,state.social,'social')+text('socialDetails','Details'));
 if(step===1)html=`<div class="assessment">${assessment('SUBJECTIVE')}${assessment('OBJECTIVE')}</div>`;
 if(step===2)html=card('Provisional diagnosis',text('diagnosis','Diagnosis',{short:true,required:true})+text('diagnosisReason','Clinical reasoning',{placeholder:'Supporting evidence / uncertainty',required:true})+`<div id="diagnosisCpg">${cpgSuggestions(v('diagnosis'))}</div>`,'Clinical Impression')+card('Differential diagnoses',state.differentials.map(differentialRow).join('')+'<button class="quiet" id="addDiff">+ Differential</button>')+card('Pathway / research assessment',checks(LOCAL.pathways,state.pathways,'pathways')+(state.pathways.length?text('pathwayDetails','Findings / scores'):''));
 if(step===3){
  html=card('Treatment',text('treatment','Intervention / rationale')+text('response','Response / reassessment')+text('enroute','En route'))+card('Disposition',select('disposition','Outcome',CONFIG.dispositions)+text('handover','Handover / onward plan'),'Disposition Tab - Screen 1');
  if(isNonTransport())html+=card('Non-transport',text('nontransportReason','Rationale')+text('capacity','Capacity / understanding')+(v('disposition')==='Declined recommended transport'?text('refusal','Refusal · recommendation / risks / patient’s reasons'):'')+text('safety','Safety-netting · trigger / action / who / when')+text('followup','Follow-up / supports')+`<div class="grid">${select('competency','Competency checklist',['Completed','Not completed','Not applicable'])}${select('acs','ACS / signatures',['Completed','Not completed','Not applicable'])}</div>`,'Non-transporting');
  html+=card('Referrals',checks(LOCAL.referrals,state.referrals,'referrals')+(state.referrals.length?'<p class="subtle">Tick only referrals made.</p>'+text('referralDetails','Referral details'):''));
 }
 if(step===4){
  const missing=reasoningErrors();
  html='<div class="toolbar"><h1>Output</h1><span class="spacer"></span><button id="copyAll">Copy all</button><button id="exportJson" class="quiet">JSON</button></div>';
  if(missing.length)html+=`<div class="missing"><ul>${missing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;
  const notes=outputNotes();html+=Object.entries(notes).filter(([,t])=>t.trim()).map(([title,note])=>`<section class="card"><div class="cardhead"><h2>${title}</h2><div class="output-actions"><button class="quiet" data-restore="${title}">↺</button><button data-copy="${title}">Copy</button></div></div><textarea class="output" data-output="${title}" aria-label="${title} output">${esc(note)}</textarea></section>`).join('');
  if(!Object.values(notes).some(x=>x.trim()))html+='<p class="subtle">No entries.</p>';
 }
 $('content').innerHTML=html;
 // Let the whole note remain visible when reviewing, including on tablets.
 document.querySelectorAll('textarea.output').forEach(t=>{t.style.height='auto';t.style.height=(t.scrollHeight+2)+'px';});
}
function join(parts,separator='\n'){return parts.filter(x=>x?.trim()).join(separator);}
function line(label,value){return value?.trim()?`${label}: ${value.trim()}`:'';}
function findingText(mode){
 return state.findings.filter(f=>f.mode===mode&&f.label&&(f.status||f.detail.trim())).map(f=>{
  const detail=f.detail.trim(),label=f.label;
  let content='';
  if(f.status==='Denied')content=`Denies ${label.toLowerCase()}${detail?` (${detail})`:''}.`;
  else if(f.status==='Not asked')content=`${label} not asked${detail?`: ${detail}`:'.'}`;
  else if(f.status==='Not assessed')content=`${label} not assessed${detail?`: ${detail}`:'.'}`;
  else if(f.status==='Unable to obtain'||f.status==='Unable to assess')content=`${label}: ${f.status.toLowerCase()}${detail?` — ${detail}`:'.'}`;
  else content=`${label}: ${detail|| (f.status==='Reported'?'reported; details not recorded':'observed; details not recorded')}`;
  return `${f.topic} — ${content}`;
 }).join('\n');
}
function buildNotes(){
 const source=join([v('source'),v('sourceDetails')],' — ');
 const frailty=state.frailty===null?'':`Rockwood CFS ${state.frailty} — ${LOCAL.frailty[state.frailty-1][0]}.`;
 const social=join([state.social.map(id=>LOCAL.social.find(x=>x.id===id)?.label).filter(Boolean).join('; '),v('socialDetails')],'. ');
 const history=join([line('History source',source),v('hpc').trim(),...['onset','provocation','quality','radiation','severity','timing'].map((k,i)=>line(['Onset / last known well','Provoking / relieving','Quality','Location / radiation','Severity / function','Timing'][i],v(k))),line('Background',v('background')),frailty,line('Social history',social),join([v('subjective').trim(),findingText('SUBJECTIVE')])],'\n\n');
 const flags=Object.entries(state.flags).filter(([,s])=>s).map(([id,s])=>{const [c,i]=id.split('|'),g=LOCAL.cpgs.find(x=>x.id===c);return `${g.title} — ${g.prompts[+i]}: ${s.toLowerCase()}.`;});
 const diagnosis=join([v('diagnosis')?`Provisional diagnosis: ${v('diagnosis').trim()}`:'',v('diagnosisReason').trim()]);
 const differential=state.differentials.filter(d=>d.diagnosis.trim()||d.reasoning.trim()).map(d=>`• ${d.diagnosis.trim()||'Diagnosis not recorded'}${d.reasoning.trim()?` — ${d.reasoning.trim()}`:' — reasoning not recorded'}`).join('\n');
 const impression=join([join([v('objective').trim(),findingText('OBJECTIVE')]),diagnosis,differential?'Differentials\n'+differential:'',flags.length?'CPG documentation\n'+flags.join('\n'):'',state.pathways.length?'Pathway assessments: '+state.pathways.join(', ')+ (v('pathwayDetails').trim()?'\n'+v('pathwayDetails').trim():''):''],'\n\n');
 const referrals=state.referrals.map(id=>{const r=LOCAL.referrals.find(x=>x.id===id);return `${r.label} ${r.tag}`;}).join('; ');
 const disposition=join([line('Treatment',v('treatment')),line('Response',v('response')),line('En route',v('enroute')),v('disposition'),v('handover').trim(),isNonTransport()?join([line('Non-transport rationale',v('nontransportReason')),line('Capacity / understanding',v('capacity')),v('disposition')==='Declined recommended transport'?line('Refusal discussion',v('refusal')):'',line('Safety-netting',v('safety')),line('Follow-up',v('followup')),line('Competency checklist',v('competency')),line('ACS / signatures',v('acs'))],'\n\n'):'',referrals?'Referrals made: '+referrals+(v('referralDetails').trim()?'\n'+v('referralDetails').trim():''):''],'\n\n');
 return {'History of Incident':history,'Clinical Impression':impression,'Disposition':disposition};
}
function outputNotes(){return {...buildNotes(),...state.edits};}
function reasoningErrors(){const errors=[];state.findings.forEach((f,i)=>{if((f.status||f.detail.trim())&&(!f.topic||!f.label))errors.push(`Finding ${i+1}: choose system and finding.`);});if(v('diagnosis').trim()&&!v('diagnosisReason').trim())errors.push('Provisional diagnosis: add clinical reasoning.');state.differentials.forEach((d,i)=>{if(d.diagnosis.trim()&&!d.reasoning.trim())errors.push(`Differential ${i+1}: add clinical reasoning.`);if(d.reasoning.trim()&&!d.diagnosis.trim())errors.push(`Differential ${i+1}: add diagnosis.`);});return errors;}
function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',3000);}
function navigate(n){step=n;render();window.scrollTo({top:0,behavior:'smooth'});}
async function copy(note){if(!note.trim()){toast('No text.');return;}if(reasoningErrors().length){toast('Complete the highlighted documentation in Assessment / Impression.');return;}try{await navigator.clipboard.writeText(note);toast('Copied');}catch{const t=document.createElement('textarea');t.value=note;document.body.append(t);t.select();const copied=document.execCommand('copy');t.remove();toast(copied?'Copied':'Select text and copy manually.');}}
function showHelp(query=''){ $('helpSearch').value=query;searchHelp();$('helpDialog').showModal();}
function searchHelp(){const q=$('helpSearch').value.trim().toLowerCase();const results=Object.entries(GUIDANCE).filter(([k,p])=>(k+' '+p.join(' ')).toLowerCase().includes(q));$('helpResults').innerHTML='<p><a href="https://cpg.stjohn.org.nz/" target="_blank" rel="noopener noreferrer">All NZ CPGs ↗</a></p>'+LOCAL.cpgs.filter(c=>(c.title+' '+c.words.join(' ')).toLowerCase().includes(q)).map(c=>`<p><a href="${c.url}" target="_blank" rel="noopener noreferrer">${esc(c.title)} ↗</a></p>`).join('')+results.map(([key,p])=>`<section class="helpblock"><p class="subtle">${key.split('|')[0]}</p><h3>${esc(key.split('|')[1])}</h3>${p.map(x=>`<p>${esc(x)}</p>`).join('')}</section>`).join('')||'<p>No matches.</p>';}
// Inputs update state without re-rendering, preserving focus and tablet keyboard.
document.addEventListener('input',e=>{
 const t=e.target;
 if(t.dataset.output){state.edits[t.dataset.output]=t.value;t.style.height='auto';t.style.height=(t.scrollHeight+2)+'px';return;}
 if(t.id==='frailty'){
  state.frailty=+t.value;changed();const data=LOCAL.frailty[state.frailty-1];$('score').textContent=`${state.frailty} · ${data[0]}`;$('scaleDescription').textContent=data[1];t.setAttribute('aria-valuetext',`${state.frailty} ${data[0]}`);return;
 }
 if(t.dataset.field){state.fields[t.dataset.field]=t.value;changed();if(t.dataset.field==='hpc')$('historyCpg').innerHTML=cpgSuggestions(t.value);if(t.dataset.field==='diagnosis')$('diagnosisCpg').innerHTML=cpgSuggestions(t.value);}
 if(t.dataset.finding!==undefined){state.findings[+t.dataset.finding][t.dataset.part]=t.value;changed();}
 if(t.dataset.diff!==undefined){state.differentials[+t.dataset.diff][t.dataset.part]=t.value;changed();if(t.dataset.part==='diagnosis')$('diff-cpg-'+t.dataset.diff).innerHTML=cpgSuggestions(t.value);}
 if(t.dataset.flag){state.flags[t.dataset.flag]=t.value;changed();syncFlagInputs(t);}
});
function syncFlagInputs(source){document.querySelectorAll('[data-flag]').forEach(t=>{if(t!==source&&t.dataset.flag===source.dataset.flag)t.value=source.value;});}
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.dataset.check){const key=t.dataset.check,id=t.value;if(t.checked){state[key].push(id);if(key==='social'){const item=LOCAL.social.find(x=>x.id===id);if(item?.group)state.social=state.social.filter(x=>x===id||LOCAL.social.find(a=>a.id===x)?.group!==item.group);if(id==='independent_adls')state.social=state.social.filter(x=>x!=='help_with_adls');if(id==='help_with_adls')state.social=state.social.filter(x=>x!=='independent_adls');}}else state[key]=state[key].filter(x=>x!==id);changed();render();}
 if(t.dataset.field==='disposition')render();
 if(t.dataset.finding!==undefined&&['topic','label'].includes(t.dataset.part)){if(t.dataset.part==='topic')state.findings[+t.dataset.finding].label='';render();}
 if(t.dataset.guidanceMode&&t.value){showHelp(t.dataset.guidanceMode+'|'+t.value);t.value='';}
});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.step!==undefined)navigate(+b.dataset.step);
 if(b.dataset.help)showHelp(b.dataset.help);
 if(b.id==='clearFrailty'){state.frailty=null;changed();render();}
 if(b.id==='openPdf')$('pdfDialog').showModal();
 if(b.dataset.addFinding){state.findings.push({mode:b.dataset.addFinding,topic:'',label:'',status:'',detail:''});changed();const mode=b.dataset.addFinding;render();document.querySelectorAll('.assessment details').forEach((d,i)=>{if(i===(mode==='SUBJECTIVE'?0:1))d.open=true;});}
 if(b.dataset.removeFinding!==undefined){state.findings.splice(+b.dataset.removeFinding,1);changed();render();}
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
$('back').onclick=()=>navigate(Math.max(0,step-1));$('next').onclick=()=>navigate(Math.min(4,step+1));$('helpButton').onclick=()=>showHelp();$('helpButton').setAttribute('aria-label','Guidance');$('closeHelp').onclick=()=>$('helpDialog').close();$('helpSearch').oninput=searchHelp;$('closePdf').onclick=()=>$('pdfDialog').close();
$('reset').onclick=()=>{if(confirm('Clear draft?')){state=emptyState();navigate(0);toast('Cleared');}};
window.addEventListener('beforeunload',e=>{if(Object.values(outputNotes()).some(Boolean)){e.preventDefault();e.returnValue='';}});
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
