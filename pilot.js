/* Limited, verbatim NZCPG pilot. Reference navigation never records care. */
const PILOT_REFS=new Map(CPG_PILOT.references.map(r=>[r.id,r]));
const PILOT_PDFS={'cpg-eas-3-2':'myocardial-ischaemia.pdf','cpg-eas-13-3':'falls.pdf','cpg-eas-14-6':'aspirin.pdf','cpg-eas-14-17':'gtn.pdf','cpg-eas-3-16':'stemi-pci.pdf','cpg-eas-3-4':'stemi-fibrinolysis.pdf','source-62666fd7-01fd-453e-8375-336745bda4ef':'cardiac-arrest-checklist-source-pages.pdf','source-094acbd5-060e-46e8-8360-be6f86353f5d':'stemi-fibrinolysis.pdf'};
const PILOT_LABELS={'cpg-eas-3-2':'Myocardial ischaemia','cpg-eas-13-3':'Falls'};
let pilotView={id:'',query:'',scope:'all',scroll:0,expanded:[],kind:'guideline'},pilotHistory=[];
function pilotRef(value){return PILOT_REFS.get(value)||CPG_PILOT.references.find(r=>(PILOT_LABELS[r.id]||r.title)===value||r.title===value);}
function pilotLabel(r){return PILOT_LABELS[r.id]||r.title;}
const pilotLegacySelected=selectedGuidelines;
selectedGuidelines=function(){return [...new Set([...(state.guidelines||[]),v('guidelineUsed')].map(x=>{const r=pilotRef(x);return r?.kind==='guideline'?pilotLabel(r):x;}))].filter(n=>n==='Ankle Injury'||CPG_PILOT.references.some(r=>r.kind==='guideline'&&pilotLabel(r)===n));};
ensureGuideline=function(value){const r=pilotRef(value);if(r&&r.kind!=='guideline')return;if(!r&&value!=='Ankle Injury')return;const name=r?pilotLabel(r):value;state.guidelines=selectedGuidelines();if(!state.guidelines.includes(name))state.guidelines.push(name);state.activeGuideline=name;state.fields.guidelineUsed='';};
activeGuidelineName=function(){const r=pilotRef(state.activeGuideline),name=r?pilotLabel(r):state.activeGuideline;return selectedGuidelines().includes(name)?name:selectedGuidelines()[0]||'';};
matchingGuidelines=function(q=''){q=q.toLowerCase().trim();return CPG_PILOT.references.filter(r=>r.kind==='guideline'&&(!q||(r.title+' '+r.number+(r.id==='cpg-eas-3-2'?' mi acs':'')).toLowerCase().includes(q))).map(pilotLabel).concat('Ankle Injury'.toLowerCase().includes(q)?['Ankle Injury']:[]);};
GUIDELINE_TITLES.splice(0,GUIDELINE_TITLES.length,...matchingGuidelines());
function pilotCapture(){const pane=referencePane==='drug'?$('drugPane'):$('diagnosisPane');const source=pane.querySelector('[data-pilot-source]'),legacyDrug=referencePane==='drug'&&!source,id=source?.dataset.pilotSource||(legacyDrug?'':pilotView.id);return {...pilotView,id,pane:referencePane==='drug'?'drug':'clinical',kind:legacyDrug?'medicine':(PILOT_REFS.get(id)||CPG_PILOT.referenceGroups?.[id])?.kind||pilotView.kind,scroll:pane.scrollTop,expanded:[...pane.querySelectorAll('details[data-pilot-section][open]')].map(x=>x.dataset.pilotSection)};}
function pilotIcon(name){return name==='clock'?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>':name==='back'?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M6 9v12h12V9M10 21v-7h4v7"/></svg>';}
function pilotTabIcon(kind){const paths={guideline:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',medicine:'<g transform="rotate(45 12 12)"><path d="M9 7h6v11H9zM12 3v4M8 3h8M7 7h10M12 18v4M9 11h3M9 14h3"/></g>',checklist:'<path d="m3 6 1.5 1.5L7 4m3 2h11M3 13l1.5 1.5L7 11m3 2h11M3 20l1.5 1.5L7 18m3 2h11"/>'};return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[kind]}</svg>`;}
function pilotToolbar(ref=pilotRef(pilotView.id)){return `<div class="pilot-app-header"><div class="pilot-app-bar"><button class="quiet pilot-brand" data-pilot-home aria-label="Browse NZCPGs">NZCPGs <span>Reference</span></button><span class="pilot-coverage">${CPG_PILOT.references.length}-reference pilot</span></div><div class="pilot-search"><input type="search" data-pilot-search aria-label="Search pilot references" placeholder="Search NZCPGs…" value="${esc(pilotView.query)}">${ref?`<select data-pilot-scope aria-label="Search scope"><option value="all">All references</option><option value="current" ${pilotView.scope==='current'?'selected':''}>This page</option></select>`:''}</div><div class="pilot-back-row"><button class="quiet pilot-labelled-back" data-pilot-back aria-label="Back" ${pilotHistory.length?'':'disabled'}>${pilotIcon('back')}<span>Back</span></button></div><div data-pilot-results></div></div>`;}
function pilotReferenceGroup(group){return `<section class="pilot-browser" data-pilot-source="${group.id}"><h2>${esc(group.title)}</h2><p class="subtle">Choose the pathway to read.</p>${group.references.map(id=>{const r=PILOT_REFS.get(id);return `<button class="quiet pilot-reference-row" data-pilot-ref="${id}"><span><strong>${esc(r.title.replace(/ - EAS$/,''))}</strong><small>${esc(r.number)}</small></span><span aria-hidden="true">›</span></button>`;}).join('')}</section>`;}

function pilotHome(){const kind=pilotView.kind||'guideline';const refs=CPG_PILOT.references.filter(r=>r.kind===kind).sort((a,b)=>kind==='medicine'?(a.browseOrder??0)-(b.browseOrder??0):0);return `<div class="pilot-browser"><p class="pilot-browser-hint">${kind==='guideline'?'Browse guidance or search the full text.':kind==='medicine'?'Open a medicine reference.': 'Standalone procedural checklists.'}</p>${[...new Set(refs.map(r=>r.category))].map(cat=>`<section class="pilot-category"><h2>${esc(cat)}</h2>${refs.filter(r=>r.category===cat).map(r=>`<button class="quiet pilot-reference-row" data-pilot-ref="${r.id}"><span><strong>${esc(r.title.replace(/ - EAS$/,''))}</strong><small>${esc(r.number||'Procedural checklist')}</small></span><span aria-hidden="true">›</span></button>`).join('')}</section>`).join('')}<p class="subtle pilot-coverage-note">Limited pilot collection · official source links remain available.</p></div>`;}
function pilotSearch(query,within=''){const q=query.toLowerCase().trim();if(!q)return [];const found=[];for(const r of PILOT_REFS.values()){if(within&&r.id!==within)continue;const title=(r.title+' '+r.number+' '+(r.medicineNames||[]).join(' ')).toLowerCase();if(title.includes(q))found.push({id:r.id,title:r.title,text:r.number,score:100,section:''});for(const p of r.pages){for(const x of p.passages||[]){if(x.text.toLowerCase().includes(q))found.push({id:r.id,title:r.title,text:x.text,score:1,section:p.id,passage:x.id});}}}return found.sort((a,b)=>b.score-a.score).slice(0,60);}
function pilotHighlight(text,q){const i=text.toLowerCase().indexOf(q.toLowerCase());return i<0?esc(text):esc(text.slice(0,i))+'<mark>'+esc(text.slice(i,i+q.length))+'</mark>'+esc(text.slice(i+q.length));}
function pilotResults(root=referencePane==='drug'?$('drugGuidanceContent'):$('diagnosisPane')){const slot=root.querySelector('[data-pilot-results]');if(!slot)return;slot.innerHTML=pilotSearch(pilotView.query,pilotView.scope==='current'?pilotView.id:'').map(x=>{const r=PILOT_REFS.get(x.id),i=x.text.toLowerCase().indexOf(pilotView.query.toLowerCase());return `<button class="library-result" data-pilot-ref="${r.id}" data-pilot-hit="${x.passage||''}" data-pilot-hit-section="${x.section}"><small>${esc(r.kind)} · ${esc(r.number)}</small><b>${esc(r.title)}</b><span>${pilotHighlight(x.text.slice(Math.max(0,i-45),Math.max(0,i-45)+220),pilotView.query)}</span></button>`;}).join('')||(pilotView.query.trim()?'<p class="pilot-empty">No matches. Try a medicine name, guideline number or shorter phrase.</p>':'');}
function pilotSection(r,p,i,medicineEntry=false){
 const f=r.flagSections?.[p.id];
 if(f)return `<section class="falls-table ${f.colour} pilot-flat-flags" data-pilot-section="${p.id}"><h3>${esc(f.title)}</h3><p>${esc(f.context)}</p><div class="pilot-literal">${f.items.map((item,j)=>{const key=DIAGNOSIS.falls[f.colour][j]?.id||item.id;return `<label class="flag-check" data-passage="${item.id}"><input type="checkbox" data-pilot-flag="${key}" ${state.fallsFlags.includes(key)?'checked':''}><span>${item.html}</span></label>`;}).join('')}</div></section>`;
 const binding=CPG_PILOT.checklistBindings?.[r.id+'|'+p.id];
 if(r.kind==='checklist'||binding)return `<section class="pilot-flat-checklist" data-pilot-section="${p.id}"><div class="pilot-literal">${p.html}</div></section>`;
 const open=medicineEntry&&r.kind==='medicine'?['Indications','Contraindications','Dosage','Dose'].includes(p.title):i===0;
 return `<details data-pilot-section="${p.id}" data-pilot-section-title="${esc(p.title)}" ${open?'open':''}><summary>${esc(p.title)}</summary><div class="pilot-literal">${p.html}</div></details>`;
}
// Reorder presentation only; the immutable source pages retain published order.
function pilotReadingPages(r){
 const pages=[...r.pages];if(r.kind!=='medicine')return pages;
 const dose=pages.findIndex(p=>/^(Dosage|Dose)$/.test(p.title));
 if(dose<0||!pages.some(p=>p.title==='Contraindications'))return pages;
 const [page]=pages.splice(dose,1);pages.splice(pages.findIndex(p=>p.title==='Contraindications')+1,0,page);return pages;
}
function pilotPage(r,medicineEntry=false){const selected=selectedGuidelines().includes(pilotLabel(r));const pdfLabel=r.id==='source-094acbd5-060e-46e8-8360-be6f86353f5d'?'Source guideline PDF':r.kind==='checklist'?'Original PDF · source pages':'Original PDF';return `<article class="pilot-source" data-pilot-source="${r.id}"><div class="rowhead"><h2>${esc(r.title)}</h2>${r.kind==='guideline'?`<button class="quiet" data-pilot-add="${r.id}" ${selected?'disabled':''}>${selected?'In guidelines used':'Add to guidelines used'}</button>`:''}</div><p class="pilot-breadcrumb">${esc(r.category)}${r.number?' / '+esc(r.number):''}</p><div class="pilot-source-links"><a class="source" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Official source ↗</a> · <a class="source" href="pilot-sources/${PILOT_PDFS[r.id]||r.sourcePdf}" target="_blank" rel="noopener">${PILOT_PDFS[r.id]?pdfLabel:'Source PDF pages'} ↗</a></div>${pilotReadingPages(r).map((p,i)=>pilotSection(r,p,i,medicineEntry)).join('')}<details class="pilot-source-info"><summary>About this source</summary><p class="subtle">${esc(r.version||"Web snapshot")} · ${esc(r.clinicalVersionDate||r.sourceDate)}<br>Retrieved ${CPG_PILOT.snapshot}</p>${r.printSourceNotice?`<p class="subtle">${esc(r.printSourceNotice)}</p>`:''}${(r.sourceHistory||[]).map(h=>`<p><strong>${esc(h.date||"")} · ${esc(h.app_version||"")}</strong><br>${esc(h.details||"")}</p>`).join("")}</details></article>`;}
function pilotLinkTargets(targets,selfId){const r=PILOT_REFS.get(selfId),ownNames=new Set((r?.medicineNames||[]).map(x=>x.toLowerCase()));return Object.fromEntries(Object.entries(targets).filter(([name,id])=>id!==selfId&&id!==r?.sourceReferenceId&&!ownNames.has(name.toLowerCase())));}
function pilotLegacyMedicineId(){const name=drugReferenceName(eventDraft?.name||''),index=Number($('drugGuidanceContent')?.querySelector('[data-drug-reference]')?.value||0),code=DRUG_GUIDELINES[name]?.[index]?.code||'',m=/\b(EAS|ECP)\s+(\d+)\.(\d+)\b/i.exec(code);return m?'cpg-'+m[1].toLowerCase()+'-'+m[2]+'-'+m[3]:'';}
function pilotLinkNames(article,linkTargets,literalSelector='.pilot-literal',selfId=''){
 linkTargets=pilotLinkTargets(linkTargets,selfId);
 const names=Object.keys(linkTargets).sort((a,b)=>b.length-a.length);if(!names.length)return;
 const pattern=names.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
 const re=new RegExp('(?<!\\w)('+pattern+')(?!\\w)','gi');
 const walker=document.createTreeWalker(article,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode()){const n=walker.currentNode;if(n.parentElement.closest(literalSelector)&&!n.parentElement.closest('a,button,script,style'))nodes.push(n);}
 for(const n of nodes){
  re.lastIndex=0;if(!re.test(n.textContent))continue;
  const frag=document.createDocumentFragment();let pos=0,m;re.lastIndex=0;
  while((m=re.exec(n.textContent))){
   if(m[0].toLowerCase()==='oxygen'&&/^\s+(demand|saturation|supply|consumption|carrying)\b/i.test(n.textContent.slice(m.index+m[0].length))){frag.append(n.textContent.slice(pos,m.index+m[0].length));pos=m.index+m[0].length;continue;}
   frag.append(n.textContent.slice(pos,m.index));const a=document.createElement('a');
   const key=names.find(x=>x.toLowerCase()===m[0].toLowerCase()),id=linkTargets[key];a.href='#';
   if(PILOT_REFS.has(id)||CPG_PILOT.referenceGroups?.[id])a.dataset.pilotRef=id;
   else if(CPG_PILOT.destinations[id]){a.href=CPG_PILOT.destinations[id].url;a.target='_blank';a.rel='noopener noreferrer';a.title='Outside pilot · official source';}
   else{a.removeAttribute('href');a.title='Reference destination unresolved';}
   a.textContent=m[0];frag.append(a);pos=m.index+m[0].length;
  }
  frag.append(n.textContent.slice(pos));n.replaceWith(frag);
 }
}

function pilotHydrate(root){for(const article of root.querySelectorAll('[data-pilot-source]')){const r=PILOT_REFS.get(article.dataset.pilotSource);if(!r)continue;
 // The accordion already displays this heading. Keep its source/search anchor
 // intact while hiding only the exact repeated heading in the reading view.
 for(const section of article.querySelectorAll('details[data-pilot-section]')){
  const page=r.pages.find(p=>p.id===section.dataset.pilotSection);if(!page)continue;
  for(const heading of section.querySelectorAll('.pilot-literal h1,.pilot-literal h2,.pilot-literal h3,.pilot-literal h4,.pilot-literal h5,.pilot-literal h6'))if(heading.textContent.trim().replace(/\s+/g,' ')===page.title.trim().replace(/\s+/g,' '))heading.dataset.pilotRepeatedHeading='';
 }
 for(const link of article.querySelectorAll('[data-reference]')){const id=CPG_PILOT.sourceReferenceLinks?.[link.dataset.reference]||link.dataset.reference;if(id===r.id||id===r.sourceReferenceId){link.replaceWith(...link.childNodes);continue;}if(PILOT_REFS.has(id)){link.dataset.pilotRef=id;link.href='#';}else{const dest=CPG_PILOT.destinations[id];if(dest){link.href=dest.url;link.target='_blank';link.rel='noopener noreferrer';link.title='Outside pilot · official source';}else{link.removeAttribute('href');link.title='Reference destination unresolved';}}link.removeAttribute('data-reference');}
 // Wrap exact names in links; keep all displayed source wording unchanged.
 const linkTargets={...CPG_PILOT.medicineLinks,...(r.kind==='medicine'?CPG_PILOT.guidelineLinks:{}),...(CPG_PILOT.checklistLinks?.[r.id]||{})};
 if(r.kind==='guideline'){
  for(const c of PILOT_REFS.values())if(c.kind==='checklist')linkTargets[c.title]=c.id;
  const targets=[...new Set(Object.values(CPG_PILOT.checklistLinks?.[r.id]||{}))];if(targets.length===1)linkTargets.checklist=targets[0];
 }
 pilotLinkNames(article,linkTargets,'.pilot-literal',r.id);

 for(const a of r.administrations){const node=article.querySelector('[data-passage="'+a.passageId+'"]');if(node){const b=document.createElement('button');b.className='quiet pilot-admin';b.dataset.pilotAdmin=a.id;b.dataset.pilotOwner=r.id;b.innerHTML=pilotIcon('clock');b.title='Record administration time';b.setAttribute('aria-label','Record administration: '+a.label);node.append(b);}}
 for(const section of article.querySelectorAll('[data-pilot-section]')){
  const binding=CPG_PILOT.checklistBindings?.[r.id+'|'+section.dataset.pilotSection];if(!binding)continue;
  for(const [passage,key] of Object.entries(binding.items)){
   const item=section.querySelector('[data-passage="'+passage+'"]');if(!item)continue;
   const label=document.createElement('label');label.className='flag-check';const wording=document.createElement('span');while(item.firstChild)wording.append(item.firstChild);
   const cb=document.createElement('input');cb.type='checkbox';cb.dataset.pilotChecklist=binding.id+'|'+key;cb.setAttribute('aria-label',wording.textContent.trim());label.append(cb,wording);item.append(label);item.classList.add('pilot-check-row');pilotUpdateChecklistInput(cb);
  }
 }
 }}

function pilotShow(id='',{restore=null,hit='',section='',back=false}={}){const prior=referencePane==='drug'?$('drugGuidanceContent'):referencePane==='clinical'?$('diagnosisPane'):null;if(!back&&prior?.querySelector('[data-pilot-source], [data-pilot-home], .drug-cpg'))pilotHistory.push(pilotCapture());if(restore?.pane==='drug'){pilotView=restore;openReference('drug');$('drugPane').scrollTop=restore.scroll;return;}pilotView=restore||{...pilotView,id,scroll:0,expanded:[]};pilotView.id=id;const r=PILOT_REFS.get(id),group=CPG_PILOT.referenceGroups?.[id];if(r||group)pilotView.kind=(r||group).kind;const pane=$('diagnosisPane');pane.innerHTML=pilotToolbar(r)+(r?pilotPage(r):group?pilotReferenceGroup({...group,id}):pilotHome());pilotHydrate(pane);pilotResults(pane);openReference('clinical');if(restore){for(const d of pane.querySelectorAll('details[data-pilot-section]'))d.open=restore.expanded.includes(d.dataset.pilotSection);pane.scrollTop=restore.scroll;}if(section){const d=pane.querySelector('[data-pilot-section="'+section+'"]');if(d)d.open=true;}if(hit){const p=pane.querySelector('[data-passage="'+hit+'"]');if(p){const target=p.hasAttribute('data-pilot-repeated-heading')?p.closest('details[data-pilot-section]')?.querySelector('summary')||p:p;target.classList.add('pilot-match');target.scrollIntoView({block:'center'});}}}
const pilotBasePanels=selectedGuidelinePanels;
selectedGuidelinePanels=function(){const active=activeGuidelineName(),r=pilotRef(active);if(!r)return pilotBasePanels();return `<nav class="guideline-cards">${selectedGuidelines().map(n=>`<button data-guideline-tab="${esc(n)}" aria-pressed="${n===active}">${esc(n)}</button>`).join('')}</nav>`+pilotToolbar(r)+pilotPage(r)+(r.id==='cpg-eas-13-3'?'<section class="pilot-documentation"><h3>Documentation tools</h3>'+fallsAssessmentControls()+'</section>':'');};
const pilotBaseRender=renderClinicalPane;
renderClinicalPane=function(){pilotBaseRender();const r=pilotRef(activeGuidelineName());if(r)pilotView.id=r.id;pilotHydrate($('diagnosisPane'));pilotResults($('diagnosisPane'));};
openCompactGuidance=function(){pilotShow();};
const pilotBaseDrug=updateDrugGuidance;
function pilotMedicineChoices(name,id){const ids=CPG_PILOT.medicineReferences?.[name]||[];return ids.length>1?`<label class="pilot-medicine-choice">Reference<select data-medicine-reference aria-label="Medicine reference">${ids.map(value=>`<option value="${value}" ${value===id?'selected':''}>${esc(PILOT_REFS.get(value).title)} · ${esc(PILOT_REFS.get(value).number)}</option>`).join('')}</select></label>`:'';}
function pilotRenderMedicine(name,id){
 const r=PILOT_REFS.get(id),root=$('drugGuidanceContent');if(!r||!root)return;
 pilotView={...pilotView,id,kind:r.kind,query:'',scope:'all',scroll:0,expanded:[]};
 root.dataset.nativeMedicine=name;root.dataset.nativeReference=id;
 root.innerHTML=pilotToolbar(r)+pilotMedicineChoices(name,id)+pilotPage(r,true)+`<details class="drug-guideline-section drug-allergies"><summary>Patient allergies</summary><p>Not separately recorded · verify with the patient / clinical record.</p>${v('background').trim()?`<p class="recorded-background">${esc(v('background'))}</p>`:''}</details>`;
 pilotHydrate(root);pilotResults(root);if(typeof sidebarSync==='function')sidebarSync();
}
updateDrugGuidance=function(force=false){
 const name=drugReferenceName(eventDraft?.name||''),ids=CPG_PILOT.medicineReferences?.[name]||[],root=$('drugGuidanceContent');
 const selected=['drug','procedure'].includes(careView)&&eventDraft?.kind==='drug'&&eventDraft.drugSelected!==false&&ids.length;
 if(!selected){if(root){delete root.dataset.nativeMedicine;delete root.dataset.nativeReference;}pilotBaseDrug(force);return;}
 if(!force&&root?.dataset.nativeMedicine===name&&root.querySelector('[data-pilot-source]'))return;
 const id=root?.dataset.nativeMedicine===name&&ids.includes(root.dataset.nativeReference)?root.dataset.nativeReference:ids[0];
 pilotBaseDrug(force);pilotRenderMedicine(name,id);
};
document.addEventListener('change',e=>{if(e.target.dataset.medicineReference!==undefined){const name=drugReferenceName(eventDraft?.name||'');if(CPG_PILOT.medicineReferences?.[name]?.includes(e.target.value))pilotRenderMedicine(name,e.target.value);}});
const pilotBaseKey=currentCareKey;
currentCareKey=function(){return eventDraft?.sourceDraft&&eventDraft.index===null?'source:'+eventDraft.source.actionId:pilotBaseKey();};
function pilotEventSource(r,a){return {referenceId:r.id,number:r.number,title:r.title,url:r.url,version:r.version,sourceDate:r.sourceDate,sourceHash:r.sourceHash,actionId:a.id,wording:a.wording,context:a.context,sectionId:a.sectionId,passageId:a.passageId};}
function pilotRecordLabel(e){return e.name+(e.dose?' '+e.dose+' '+e.unit:'')+(e.route?' '+e.route:'');}
function pilotStart(referenceId,actionId){
 const r=PILOT_REFS.get(referenceId),a=r?.administrations.find(x=>x.id===actionId);if(!a)return null;
 const q=a.quickLog;const record={...freshCareTime(),...q,details:q.kind==='intervention'?'':q.details,id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'event-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),enteredAt:new Date().toISOString(),source:pilotEventSource(r,a),recordedFromGuideline:true};
 state.careEvents.push(record);changed();pilotRefreshLogFeedback(record);toast('Logged '+pilotRecordLabel(record));return record;
}
function pilotLogFeedbackMarkup(record){return `<span role="status">${esc(compactActionTime(record))} · ${esc(pilotRecordLabel(record))} · logged</span><div><button class="quiet" data-pilot-edit="${record.id}">Edit</button><button class="quiet" data-pilot-undo="${record.id}">Undo</button></div>`;}
const pilotFeedbackTimers=new WeakMap();
function pilotCancelFeedbackFade(slot){if(!slot)return;const timer=pilotFeedbackTimers.get(slot);if(timer!==undefined&&typeof clearTimeout==='function')clearTimeout(timer);pilotFeedbackTimers.delete(slot);slot.classList.remove('pilot-feedback-fading');}
function pilotScheduleFeedbackFade(slot){
 pilotCancelFeedbackFade(slot);
 pilotFeedbackTimers.set(slot,setTimeout(()=>{
  if(slot.querySelector('[data-pilot-editor]')||slot.contains(document.activeElement))return;
  slot.classList.add('pilot-feedback-fading');pilotFeedbackTimers.set(slot,setTimeout(()=>{slot.remove();pilotFeedbackTimers.delete(slot);},200));
 },2000));
}
function pilotRefreshLogFeedback(record){
 for(const root of [$('diagnosisPane'),$('drugGuidanceContent')]){
  if(!root)continue;for(const b of root.querySelectorAll('[data-pilot-admin]')){
   const events=state.careEvents.filter(e=>e.source?.actionId===b.dataset.pilotAdmin),count=events.length;b.title='Record administration time'+(count?' · '+count+' recorded':'');b.setAttribute('data-recorded-count',String(count));
   let slot=b.parentElement.querySelector(':scope > [data-pilot-log-feedback]'),shown=record?.source?.actionId===b.dataset.pilotAdmin?record:null;
   if(!shown&&slot?.dataset.pilotLogId&&!events.some(e=>e.id===slot.dataset.pilotLogId)){shown=events.at(-1);if(!shown){slot.remove();slot=null;}}
   if(shown){if(!slot){slot=document.createElement('div');slot.dataset.pilotLogFeedback='';slot.className='pilot-log-feedback';b.parentElement.append(slot);}slot.dataset.pilotLogId=shown.id;slot.innerHTML=pilotLogFeedbackMarkup(shown);pilotScheduleFeedbackFade(slot);}
  }
 }
 // Update an already-rendered log without opening it or changing the current page.
 if($('recordsPane')?.innerHTML)$('recordsPane').innerHTML=recordedTables();
 const launch=document.querySelector('[data-records-open]');if(launch)launch.textContent='Entries · '+((state.vitalSets||[]).length+combinedClinicalEvents().length);
 const notes=outputNotes();for(const field of document.querySelectorAll('[data-output]'))if(Object.hasOwn(notes,field.dataset.output))field.value=notes[field.dataset.output];
}
function pilotEditMarkup(e){return `<form class="pilot-inline-log-editor" data-pilot-editor="${e.id}"><label>Time<input type="datetime-local" name="local" aria-label="Logged action time" value="${esc(e.local)}"></label><label>Drug / action<input name="name" aria-label="Logged drug or action" value="${esc(e.name)}"></label>${e.kind==='drug'?`<div class="pilot-inline-dose"><label>Dose<input name="dose" inputmode="decimal" aria-label="Logged dose" value="${esc(e.dose)}"></label><label>Unit<input name="unit" aria-label="Logged unit" value="${esc(e.unit)}"></label><label>Route<input name="route" aria-label="Logged route" value="${esc(e.route)}"></label></div>`:''}<label>Notes<input name="details" aria-label="Logged action notes" value="${esc(e.details||'')}"></label><p class="error" data-pilot-edit-error hidden></p><div><button type="button" class="quiet" data-pilot-edit-cancel="${e.id}">Cancel</button><button type="submit">Save changes</button></div></form>`;}
function pilotSaveInline(recordId,fields){const e=state.careEvents.find(x=>x.id===recordId);if(!e)return 'Entry no longer exists.';const next={...e,...fields};const stamp=stampCare(next);if(!stamp||!next.name.trim())return 'Enter a valid time and action.';if(next.kind==='drug'&&next.dose&&(!/^\d+(\.\d+)?$/.test(next.dose)||Number(next.dose)<=0||!next.unit.trim()))return 'Enter a positive dose and unit, or leave the dose blank.';Object.assign(e,stamp,{modifiedAt:new Date().toISOString()});changed();pilotRefreshLogFeedback(e);return '';}
function pilotUndo(recordId){const count=state.careEvents.length;state.careEvents=state.careEvents.filter(x=>x.id!==recordId);if(count===state.careEvents.length)return false;changed();pilotRefreshLogFeedback();return true;}
function pilotChecklistItem(value){const [id,key]=String(value).split('|'),r=PILOT_REFS.get(id);if(r?.kind!=='checklist')return null;for(const p of r.pages){const passage=p.passages.find(x=>x.id===key);if(passage&&CPG_PILOT.checklistBindings[r.id+'|'+p.id]?.items[key])return {r,p,passage,id,key};}return null;}
function pilotChecklistStatus(value){return state.careEvents.filter(e=>e.pilotChecklistKey===value).at(-1)||null;}
function pilotChecklistChecked(value){const e=pilotChecklistStatus(value);if(e)return !!e.checklistChecked;const [id,key]=value.split('|'),base=state.pilotCheckBaseline?.[id];return base&&Object.hasOwn(base,key)?base[key]:!!state.pilotChecks?.[id]?.[key];}
function pilotUpdateChecklistInput(cb){
 const value=cb.dataset.pilotChecklist,e=pilotChecklistStatus(value);cb.checked=pilotChecklistChecked(value);
 const label=cb.closest('label');if(!label)return;let time=label.querySelector('[data-pilot-check-time]');
 if(!e){time?.remove();return;}if(!time){time=document.createElement('time');time.dataset.pilotCheckTime='';time.className='pilot-check-time';label.append(time);}
 time.dateTime=e.at;time.textContent=(e.checklistChecked?'':'Unmarked ')+compactActionTime(e);time.title='Checklist '+(e.checklistChecked?'checked':'unmarked')+' at '+new Date(e.at).toLocaleString('en-NZ');
}
function pilotSyncChecklists(){
 for(const binding of Object.values(CPG_PILOT.checklistBindings)){state.pilotChecks=state.pilotChecks||{};state.pilotChecks[binding.id]=state.pilotChecks[binding.id]||{};for(const key of Object.values(binding.items))state.pilotChecks[binding.id][key]=pilotChecklistChecked(binding.id+'|'+key);}
 for(const cb of document.querySelectorAll('[data-pilot-checklist]'))pilotUpdateChecklistInput(cb);
}
function pilotSetChecklist(value,checked,now=Date.now()){
 const item=pilotChecklistItem(value);if(!item||!Number.isFinite(now)||pilotChecklistChecked(value)===checked)return false;
 const {r,p,passage,id,key}=item;state.pilotCheckBaseline=state.pilotCheckBaseline||{};state.pilotCheckBaseline[id]=state.pilotCheckBaseline[id]||{};
 if(!Object.hasOwn(state.pilotCheckBaseline[id],key))state.pilotCheckBaseline[id][key]=pilotChecklistChecked(value);
 const date=new Date(now),record={at:date.toISOString(),local:localDateTime(date),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'event-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),enteredAt:new Date().toISOString(),kind:'intervention',recordType:'checklist',name:'Checklist · '+r.title,details:(checked?'Checked: ':'Unmarked: ')+passage.text,pilotChecklistKey:value,checklistChecked:checked,source:pilotEventSource(r,{id:'checklist:'+value,wording:passage.text,context:r.title,sectionId:p.id,passageId:key})};
 state.careEvents.push(record);changed();pilotSyncChecklists();pilotRefreshLogFeedback();return record;
}
document.addEventListener('submit',e=>{const form=e.target;if(!form.dataset.pilotEditor)return;e.preventDefault();const fields=Object.fromEntries([...form.querySelectorAll('input[name]')].map(n=>[n.name,n.value]));const error=pilotSaveInline(form.dataset.pilotEditor,fields);if(error){const box=form.querySelector('[data-pilot-edit-error]');box.textContent=error;box.hidden=false;}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-pilot-edit],[data-pilot-undo],[data-pilot-edit-cancel]');if(!b)return;e.preventDefault();const id=b.dataset.pilotEdit||b.dataset.pilotUndo||b.dataset.pilotEditCancel;const record=state.careEvents.find(x=>x.id===id);if(!record)return;if(b.dataset.pilotEdit){const slot=b.closest('[data-pilot-log-feedback]');pilotCancelFeedbackFade(slot);slot.innerHTML=pilotEditMarkup(record);}else if(b.dataset.pilotUndo){pilotUndo(id);toast('Entry removed');}else{pilotRefreshLogFeedback(record);}});
document.addEventListener('focusin',e=>{const slot=e.target.closest('[data-pilot-log-feedback]');if(slot)pilotCancelFeedbackFade(slot);});
document.addEventListener('focusout',e=>{const slot=e.target.closest('[data-pilot-log-feedback]');if(slot&&!slot.querySelector('[data-pilot-editor]'))pilotScheduleFeedbackFade(slot);});
document.addEventListener('click',e=>{const b=e.target.closest('[data-pilot-home],[data-pilot-ref],[data-pilot-back],[data-pilot-add],[data-pilot-admin],[data-pilot-kind]');if(!b)return;e.preventDefault();if(b.dataset.pilotRef)pilotShow(b.dataset.pilotRef,{hit:b.dataset.pilotHit,section:b.dataset.pilotHitSection});else if(b.hasAttribute('data-pilot-home')||b.dataset.pilotKind){const prev=pilotCapture();pilotHistory.push(prev);pilotView={...pilotView,id:'',query:'',scope:'all',kind:b.dataset.pilotKind||prev.kind||'guideline',expanded:[],scroll:0};pilotShow('',{back:true});}else if(b.hasAttribute('data-pilot-back')){const prev=pilotHistory.pop();if(prev)pilotShow(prev.id,{restore:prev,back:true});}else if(b.dataset.pilotAdd){ensureGuideline(b.dataset.pilotAdd);changed();render();pilotShow(b.dataset.pilotAdd,{back:true});}else if(b.dataset.pilotAdmin)pilotStart(b.dataset.pilotOwner,b.dataset.pilotAdmin);});
document.addEventListener('input',e=>{if(e.target.hasAttribute('data-pilot-search')){pilotView.query=e.target.value;pilotResults();}});
document.addEventListener('change',e=>{const t=e.target;if(t.hasAttribute('data-pilot-scope')){pilotView.scope=t.value;pilotResults();}if(t.dataset.pilotChecklist){pilotSetChecklist(t.dataset.pilotChecklist,t.checked);}if(t.dataset.pilotFlag){state.fallsFlags=state.fallsFlags.filter(x=>x!==t.dataset.pilotFlag);if(t.checked)state.fallsFlags.push(t.dataset.pilotFlag);changed();}});
const pilotLaunch=document.querySelector('[data-open-compact-guidance]');if(pilotLaunch)pilotLaunch.textContent='NZCPG pilot';

document.addEventListener('change',e=>{if(e.target.dataset.drugReference!==undefined&&$('drugSections'))pilotLinkNames($('drugSections'),CPG_PILOT.guidelineLinks,'.drug-guideline-section',pilotLegacyMedicineId());});
