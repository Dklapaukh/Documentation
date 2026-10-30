/* Inline source-table reading and explicit Add Drug selection, never administration. */
const paediatricRows=new Map(PAEDIATRIC_TABLES.rows.map(r=>[r.id,r]));
const paediatricBindings=new Map(PAEDIATRIC_TABLES.bindings.map(b=>[b.id,b]));
const paediatricOpen=new Set();
function paediatricBinding(id){
 const b=paediatricBindings.get(id),ref=b&&PILOT_REFS.get(b.referenceId);
 if(!b||ref?.sourceHash!==b.sourceHash)return null;
 const p=ref.pages.find(s=>s.id===b.sectionId)?.passages.find(p=>p.id===b.passageId);
 return p?.text===b.wording&&b.rows.every(id=>paediatricRows.has(id))?b:null;
}
function paediatricChoice(bindingId,rowId){
 const b=paediatricBinding(bindingId),row=paediatricRows.get(rowId);
 return b?.rows.includes(rowId)&&row?.value?{binding:b,row}:null;
}
function paediatricRouteClass(row){
 // Mixed source routes retain both labels; colour never selects an actual route.
 return row.routes.includes('IV')?'paediatric-route-iv':row.routes.includes('IM')?'paediatric-route-im':'paediatric-route-other';
}
function paediatricTableMarkup(bindingId){
 const b=paediatricBinding(bindingId);if(!b)return '';
 const rows=b.rows.map(id=>paediatricRows.get(id));
 return `<p class="dose-table-hint">Tap a dose to fill Add Drug. Record confirms administration.</p>${[...new Set(rows.map(r=>r.label))].map(label=>`<section class="paediatric-band ${paediatricRouteClass(rows.find(r=>r.label===label))}"><h4>${esc(label)}</h4><div class="paediatric-table-scroll"><table><thead><tr><th>Weight / age</th><th>Dose</th><th>Volume</th><th>Dilution number</th></tr></thead><tbody>${rows.filter(r=>r.label===label).map(r=>`<tr><td>${esc(r.band)}</td><td>${r.value?`<button class="dose-table-pick" type="button" data-paediatric-dose="${r.id}" data-paediatric-owner="${esc(b.id)}" aria-label="Use ${esc(r.dose)} · ${esc(r.label)} · ${esc(r.band)} in Add Drug">${esc(r.dose)}</button>`:esc(r.dose)}</td><td>${esc(r.volume)}</td><td>${esc(r.dilution)}</td></tr>`).join('')}</tbody></table></div></section>`).join('')}<div data-paediatric-review-slot></div><details class="paediatric-source-guidance"><summary>Published table guidance & dilution instructions</summary>${PAEDIATRIC_TABLES.support.map(s=>`<section>${s.html}</section>`).join('')}</details><p class="subtle"><a href="${esc(PAEDIATRIC_TABLES.source.url)}" target="_blank" rel="noopener">${esc(PAEDIATRIC_TABLES.source.number)} · official source ↗</a> · ${esc(PAEDIATRIC_TABLES.source.version)} · snapshot ${esc(PAEDIATRIC_TABLES.source.sourceDate)}</p>`;
}
function paediatricHydrate(root){
 for(const article of root.querySelectorAll('[data-pilot-source]'))for(const b of paediatricBindings.values()){
  if(b.referenceId!==article.dataset.pilotSource||!paediatricBinding(b.id))continue;
  const passage=article.querySelector('[data-passage="'+b.passageId+'"]');if(!passage||passage.querySelector('[data-paediatric-link]'))continue;
  const walker=document.createTreeWalker(passage,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())if(!walker.currentNode.parentElement.closest('button'))nodes.push(walker.currentNode);
  let linked=false;
  for(const n of nodes){const m=/paediatric drug dose tables?/i.exec(n.textContent);if(!m)continue;
   const link=document.createElement('a');link.href='#';link.className='paediatric-inline-link';link.dataset.paediatricLink=b.id;link.textContent=m[0];link.setAttribute('aria-expanded',String(paediatricOpen.has(b.id)));
   const panelId='paediatric-'+root.id+'-'+b.passageId;link.setAttribute('aria-controls',panelId);
   const parent=n.parentElement.closest('a');
   if(parent&&parent.textContent.trim()===m[0])parent.replaceWith(link);
   else{const frag=document.createDocumentFragment();frag.append(n.textContent.slice(0,m.index),link,n.textContent.slice(m.index+m[0].length));n.replaceWith(frag);}
   linked=true;break;
  }
  if(!linked)continue;
  const panel=document.createElement('div');panel.className='paediatric-inline-table';panel.dataset.paediatricPanel=b.id;panel.id='paediatric-'+root.id+'-'+b.passageId;panel.hidden=!paediatricOpen.has(b.id);if(!panel.hidden)panel.innerHTML=paediatricTableMarkup(b.id);
  // A block under the full source instruction, without rewriting the instruction.
  if(passage.tagName==='P')passage.insertAdjacentElement('afterend',panel);else passage.append(panel);
 }
}
function paediatricFill(bindingId,rowId,actualDose=null,actualRoute=null){
 const choice=paediatricChoice(bindingId,rowId);if(!choice)return false;
 const {row,binding}=choice,dose=actualDose===null?(row.range?'':row.value):String(actualDose),route=actualRoute|| (row.routes.length===1?row.routes[0]:'');
 if(!/^\d+(\.\d+)?$/.test(dose)||Number(dose)<=0||!row.routes.includes(route))return false;
 if(row.range){const [low,high]=row.value.split('-').map(Number);if(Number(dose)<low||Number(dose)>high)return false;}
 const sameEntry=$('careModal').open&&careView==='drug'&&eventDraft?.kind==='drug'&&eventDraft.index===null&&drugReferenceName(eventDraft.name)===row.name;
 const origin=sameEntry?null:pilotCapture(),actionId='paediatric:'+row.id;
 if(!sameEntry){
  if($('careModal').open)stashCareDraft();
  const saved=pendingCare['source:'+actionId]||pendingCare[careDraftKey('drug',null)];
  eventDraft=saved?.view==='drug'&&saved.eventDraft?.index===null&&drugReferenceName(saved.eventDraft.name)===row.name?cloneCare(saved.eventDraft):{...freshCareTime(),name:row.name,kind:'drug',index:null,dose:'',unit:'',route:'',details:'',sourceDraft:true};
  careView='drug';
 }
 Object.assign(eventDraft,{name:row.name,drugSelected:true,dose,unit:row.unit,route,
  source:{referenceId:PAEDIATRIC_TABLES.source.id,title:PAEDIATRIC_TABLES.source.title,number:PAEDIATRIC_TABLES.source.number,url:PAEDIATRIC_TABLES.source.url,version:PAEDIATRIC_TABLES.source.version,sourceHash:PAEDIATRIC_TABLES.source.sourceHash,sourceDate:PAEDIATRIC_TABLES.source.sourceDate,actionId,wording:[row.band,row.label,row.dose,row.volume,row.dilution].join(' · '),context:binding.wording,sectionId:row.sectionId,passageId:row.id},
  doseTableSelection:{schemaVersion:1,kind:'paediatric-source-table',selectedName:row.name,selectedDose:dose,unit:row.unit,route,band:row.band,publishedDose:row.dose,publishedVolume:row.volume,dilution:row.dilution,selectedAt:new Date().toISOString(),rowSnapshot:cloneCare(row),sourceSnapshot:cloneCare(PAEDIATRIC_TABLES.source),linkSnapshot:cloneCare(binding)}});
 delete eventDraft.doseCalculation;
 if(sameEntry){for(const key of ['name','dose','unit','route']){const field=$('careModal').querySelector('[data-care-field="'+key+'"]');if(field)field.value=eventDraft[key];}updateRepeatControl();}
 else{
  renderCare();$('careModal').show();
  if(origin?.pane==='clinical')pilotShow(origin.id,{restore:origin,back:true});
  else{for(const d of $('drugGuidanceContent').querySelectorAll('details[data-pilot-section]'))d.open=origin.expanded.includes(d.dataset.pilotSection);$('drugPane').scrollTop=origin.scroll;}
 }
 setReferenceExpanded(false);toast('Dose added to Add Drug · not recorded');return true;
}
function paediatricReviewMarkup(bindingId,rowId){
 const c=paediatricChoice(bindingId,rowId);if(!c)return '';const r=c.row;
 return `<form class="dose-pilot-form" data-paediatric-review="${r.id}" data-paediatric-owner="${esc(bindingId)}"><p>${esc(r.label)} · ${esc(r.band)} · ${esc(r.dose)}</p>${r.range?`<label>Actual dose (${esc(r.unit)})<input name="dose" type="text" inputmode="decimal" autocomplete="off" required aria-label="Actual paediatric dose"></label>`:`<input name="dose" type="hidden" value="${esc(r.value)}">`}${r.routes.length>1?`<label>Route<select name="route" required><option value="">Select actual route…</option>${r.routes.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label>`:`<input name="route" type="hidden" value="${esc(r.routes[0])}">`}<p data-paediatric-error class="error" role="alert" hidden></p><div class="dose-pilot-actions"><button type="button" class="quiet" data-paediatric-cancel>Cancel</button><button type="submit">Fill Add Drug</button></div></form>`;
}
const paediatricBaseHydrate=pilotHydrate;
pilotHydrate=function(root){paediatricBaseHydrate(root);paediatricHydrate(root);};
document.addEventListener('click',e=>{
 const link=e.target.closest('[data-paediatric-link]');if(link){e.preventDefault();e.stopImmediatePropagation();const id=link.dataset.paediatricLink;if(!paediatricBinding(id))return;const panel=link.closest('[data-pilot-source]').querySelector('[data-paediatric-panel="'+id+'"]');if(!panel)return;const open=panel.hidden;panel.hidden=!open;link.setAttribute('aria-expanded',String(open));if(open){paediatricOpen.add(id);panel.innerHTML=paediatricTableMarkup(id);}else paediatricOpen.delete(id);return;}
 const button=e.target.closest('[data-paediatric-dose]');if(button){e.preventDefault();const id=button.dataset.paediatricOwner,rowId=button.dataset.paediatricDose,c=paediatricChoice(id,rowId);if(!c)return;const slot=button.closest('[data-paediatric-panel]').querySelector('[data-paediatric-review-slot]');if(c.row.range||c.row.routes.length>1){slot.innerHTML=paediatricReviewMarkup(id,rowId);slot.querySelector('input:not([type="hidden"]),select')?.focus();slot.scrollIntoView({block:'nearest'});}else paediatricFill(id,rowId);return;}
 const cancel=e.target.closest('[data-paediatric-cancel]');if(cancel){e.preventDefault();cancel.closest('[data-paediatric-review-slot]').innerHTML='';}
});
document.addEventListener('submit',e=>{const form=e.target.closest('[data-paediatric-review]');if(!form)return;e.preventDefault();const dose=form.querySelector('[name="dose"]').value,route=form.querySelector('[name="route"]').value;
 if(paediatricFill(form.dataset.paediatricOwner,form.dataset.paediatricReview,dose,route)){form.closest('[data-paediatric-review-slot]').innerHTML='';}
 else{const error=form.querySelector('[data-paediatric-error]');error.textContent='Enter a positive actual dose within the published range and select a route.';error.hidden=false;}
});
