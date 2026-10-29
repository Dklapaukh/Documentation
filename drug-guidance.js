/* Contextual references and opt-in, one-shot repeat notifications.
 * Never infer allergies, actual administration, eligibility or a repeat dose.
 * Timing uses the recorded administration time, including retrospective entries.
 */
function drugReferenceName(name){return Object.keys(DRUG_GUIDELINES).find(n=>n.toLowerCase()===String(name||'').trim().toLowerCase())||'';}
function repeatOptions(name,route){return (DRUG_REPEAT_OPTIONS[drugReferenceName(name)]||[]).filter(o=>o.routes.includes(route));}
function repeatIcon(){return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></svg>';}
function repeatContextKey(name,route){return drugReferenceName(name)+'|'+route;}
function repeatBaseChoice(name,route,choice){
 if(!choice)return null;
 return repeatOptions(name,route).find(o=>o.source===choice.source&&o.label===choice.label&&JSON.stringify(o.routes)===JSON.stringify(choice.routes)&&o.minutes===(choice.guidelineMinutes??choice.minutes))||null;
}
function repeatPreset(){
 const choices=repeatOptions(eventDraft.name,eventDraft.route),context=repeatContextKey(eventDraft.name,eventDraft.route);
 if(eventDraft.repeatContext!==context){const previous=repeatBaseChoice(eventDraft.name,eventDraft.route,eventDraft.repeatReminder);eventDraft.repeatContext=context;eventDraft.repeatChoiceIndex=previous?choices.indexOf(previous):0;eventDraft.repeatMinutes=previous?eventDraft.repeatReminder.minutes:choices[0]?.minutes;if(!previous){delete eventDraft.repeatReminder;delete eventDraft.repeatDismissed;}}
 if(!choices[eventDraft.repeatChoiceIndex])eventDraft.repeatChoiceIndex=0;
 const base=choices[eventDraft.repeatChoiceIndex];
 if(base&&(!Number.isInteger(eventDraft.repeatMinutes)||eventDraft.repeatMinutes<1||eventDraft.repeatMinutes>1439))eventDraft.repeatMinutes=base.minutes;
 return base||null;
}
function repeatControl(){return '<section class="repeat-notification" id="repeatOptions"></section>';}
function updateRepeatControl(){
 if(careView!=='drug'||!$('repeatOptions'))return;
 const choices=repeatOptions(eventDraft.name,eventDraft.route),base=repeatPreset(),active=!!eventDraft.repeatReminder;
 $('repeatOptions').innerHTML=`<h3>Repeat notification</h3>${base?`${choices.length>1?`<label>Guideline context<select data-repeat-choice>${choices.map((o,i)=>`<option value="${i}" ${i===eventDraft.repeatChoiceIndex?'selected':''}>${esc(o.label)} · ${o.minutes} min</option>`).join('')}</select></label>`:`<p class="repeat-context">${esc(base.label)} · EAS ${base.source}</p>`}<div class="repeat-time-row"><button type="button" class="repeat-time-button" data-repeat-wheel aria-label="Repeat notification time, ${eventDraft.repeatMinutes} minutes"><span>${repeatIcon()} <b>${eventDraft.repeatMinutes} min</b></span><small>${eventDraft.repeatMinutes!==base.minutes?'Custom time · guideline '+base.minutes+' min':'Guideline time'} <span aria-hidden="true">⌃⌄</span></small></button><button type="button" class="quiet repeat-enable" data-repeat-enable aria-pressed="${active}" aria-label="${active?'Disable':'Enable'} repeat notification">${active?'On':'Off'}</button></div><p class="repeat-guideline-wording">${esc(base.wording)}</p>`:`<p class="repeat-context">${eventDraft.route?'No fixed repeat time configured for this drug / route.':'Select the route to show its guideline repeat time.'}</p>`}`;
}
function setRepeatNotification(enabled){
 const base=repeatPreset();if(enabled&&base){eventDraft.repeatReminder={...base,minutes:eventDraft.repeatMinutes,guidelineMinutes:base.minutes};delete eventDraft.repeatDismissed;}else delete eventDraft.repeatReminder;
 updateRepeatControl();
}
let repeatWheelDraft=null;
function repeatWheelValue(hours,minutes){return Number.isInteger(hours)&&Number.isInteger(minutes)&&hours>=0&&hours<=23&&minutes>=0&&minutes<=59?hours*60+minutes:null;}
function openRepeatWheel(){
 const base=repeatPreset();if(!base)return;
 repeatWheelDraft={hours:Math.floor(eventDraft.repeatMinutes/60),minutes:eventDraft.repeatMinutes%60};
 const column=(key,max,label)=>`<section class="repeat-wheel-unit"><h3>${label}</h3><div class="repeat-wheel-column" data-repeat-column="${key}" role="listbox" tabindex="0" aria-label="Notification ${label.toLowerCase()}">${Array.from({length:max+1},(_,value)=>`<button type="button" role="option" aria-selected="${repeatWheelDraft[key]===value}" data-repeat-wheel-key="${key}" data-repeat-wheel-value="${value}">${String(value).padStart(2,'0')}</button>`).join('')}</div></section>`;
 $('repeatWheelModal').innerHTML=`<div class="repeat-wheel-top"><button class="quiet" data-repeat-wheel-cancel>Cancel</button><h2>Repeat notification</h2><button class="quiet" data-repeat-wheel-done>Done</button></div><div class="repeat-wheel-picker">${column('hours',23,'Hours')}${column('minutes',59,'Minutes')}<div class="repeat-wheel-focus" aria-hidden="true"></div></div><p id="repeatWheelReading"></p><p class="repeat-wheel-source">${esc(base.wording)}</p><p class="repeat-wheel-error" id="repeatWheelError" role="alert" hidden></p>`;
 $('repeatWheelModal').showModal();
 requestAnimationFrame(()=>{document.querySelectorAll('[data-repeat-column]').forEach(col=>{col.scrollTop=repeatWheelDraft[col.dataset.repeatColumn]*44;col.addEventListener('scroll',()=>{setRepeatWheelValue(col.dataset.repeatColumn,Math.round(col.scrollTop/44));},{passive:true});});updateRepeatWheelReading();});
}
function setRepeatWheelValue(key,value){
 if(!repeatWheelDraft||!['hours','minutes'].includes(key))return;
 repeatWheelDraft[key]=Math.max(0,Math.min(key==='hours'?23:59,value));
 document.querySelectorAll('[data-repeat-wheel-key="'+key+'"]').forEach(el=>el.setAttribute('aria-selected',String(Number(el.dataset.repeatWheelValue)===repeatWheelDraft[key])));updateRepeatWheelReading();
}
function updateRepeatWheelReading(){if(repeatWheelDraft)$('repeatWheelReading').textContent=repeatWheelValue(repeatWheelDraft.hours,repeatWheelDraft.minutes)+' min';}
function acceptRepeatWheel(){
 const minutes=repeatWheelValue(repeatWheelDraft?.hours,repeatWheelDraft?.minutes);
 if(!minutes){$('repeatWheelError').hidden=false;$('repeatWheelError').textContent='Choose at least one minute.';return false;}
 eventDraft.repeatMinutes=minutes;setRepeatNotification(true);$('repeatWheelModal').close();repeatWheelDraft=null;return true;
}
function dosePadMarkup(){return `<div class="dose-entry-pad"><label>Dose<input type="text" inputmode="decimal" data-care-field="dose" value="${esc(eventDraft.dose)}" placeholder="Actual dose"></label><div class="dose-number-pad" role="group" aria-label="Actual dose number pad">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>`<button type="button" class="quiet" data-dose-key="${k}" aria-label="${k==='⌫'?'Delete last dose digit':k==='.'?'Dose decimal point':'Dose digit '+k}">${k}</button>`).join('')}<button type="button" class="quiet dose-clear" data-dose-key="clear">Clear</button></div></div>`;}
function enterDoseKey(key){
 let value=String(eventDraft.dose||'');
 if(key==='clear')value='';else if(key==='⌫')value=value.slice(0,-1);else if(key==='.'&&!value.includes('.'))value=value?value+'.':'0.';else if(/^\d$/.test(key))value=(value==='0'?'':value)+key;
 eventDraft.dose=value;const input=document.querySelector('[data-care-field="dose"]');if(input)input.value=value;
}
function drugSidebar(){return `<div class="drug-entry-shell"><section class="drug-entry-work">${eventEntryMarkup()}</section><aside class="drug-reference" aria-label="Drug guideline and patient allergies" hidden><div id="drugGuidanceContent"></div></aside></div>`;}
function drugSectionMarkup(ref){
 const sections=DRUG_GUIDELINE_CONTENT[ref.pdf]||[];
 const priority=t=>/^contraindications$/i.test(t)?0:/^(dose|dosage)( \/ treatment)?$/i.test(t)?1:2;
 const sorted=sections.map((s,i)=>({...s,order:i})).sort((a,b)=>priority(a.title)-priority(b.title)||a.order-b.order);
 return sorted.map(section=>`<details class="drug-guideline-section ${priority(section.title)===0?'contraindications':priority(section.title)===1?'dose-reference':''}" ${priority(section.title)<2?'open':''}><summary>${esc(/^dosage$/i.test(section.title)?'Dose':section.title)}</summary><div>${section.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div></details>`).join('');
}
function updateDrugGuidance(force=false){
 if(!['drug','procedure'].includes(careView)||eventDraft?.kind!=='drug'||!$('drugGuidanceContent'))return;
 const root=$('drugGuidanceContent'),raw=eventDraft.name.trim(),name=drugReferenceName(raw);
 const shell=document.querySelector('.drug-entry-shell'),aside=document.querySelector('.drug-reference');
 const selected=!!name&&eventDraft.drugSelected!==false;shell?.classList.toggle('has-drug-reference',selected);if(aside)aside.hidden=!selected;
 if(!force&&root.dataset.drug===raw&&root.dataset.selected===String(selected))return;root.dataset.selected=String(selected);
 root.dataset.drug=raw;
 if(!selected){root.innerHTML='';return;}
 const refs=DRUG_GUIDELINES[name]||[];
 root.innerHTML=`<section class="drug-cpg"><h3>${esc(name||raw)}</h3>${refs.length?`${refs.length>1?`<label>Guideline<select data-drug-reference>${refs.map((r,i)=>`<option value="${i}">${esc(r.title)}</option>`).join('')}</select></label>`:''}<p id="drugReferenceTitle" class="subtle">${esc(refs[0].title)}</p><div id="drugSections">${drugSectionMarkup(refs[0])}</div><a id="drugCpgOnline" href="${refs[0].url}" target="_blank" rel="noopener noreferrer">${esc(refs[0].code)} · NZCPG source ↗</a>`:'<p>No matching NZCPG for this name. Choose a listed drug.</p>'}</section><details class="drug-guideline-section drug-allergies"><summary>Patient allergies</summary><p>Not separately recorded · verify with the patient / clinical record.</p>${v('background').trim()?`<p class="recorded-background">${esc(v('background'))}</p>`:''}</details>`;
}
function repeatDue(record,now=Date.now()){
 const choice=record.repeatReminder,at=Date.parse(record.at),base=repeatBaseChoice(record.name,record.route,choice);
 if(record.kind!=='drug'||!choice||record.repeatDismissed||!Number.isFinite(at)||!base||!Number.isInteger(choice.minutes)||choice.minutes<1||choice.minutes>1439)return null;
 const due=at+choice.minutes*60000;
 return {due,overdue:now>=due,name:record.name,label:choice.label};
}
function updateRepeatNotifications(now=Date.now()){
 const bar=$('repeatNotifications');if(!bar)return;
 const due=state.careEvents.map((e,i)=>({i,...repeatDue(e,now)})).filter(x=>x.overdue);
 bar.hidden=!due.length;
 const signature=JSON.stringify(due.map(x=>[x.i,x.due,x.name,x.label]));if(bar.dataset.signature===signature)return;bar.dataset.signature=signature;
 bar.innerHTML=due.map(x=>`<div><span><b>${esc(x.name)} · repeat notification</b> ${esc(new Date(x.due).toLocaleTimeString('en-NZ',{hour:'2-digit',minute:'2-digit'}))} · ${esc(x.label)}. Reassess / check CPG.</span><button class="quiet" data-repeat-dismiss="${x.i}" aria-label="Dismiss ${esc(x.name)} repeat notification">×</button></div>`).join('');
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.doseKey!==undefined)enterDoseKey(b.dataset.doseKey);
 if(b.dataset.repeatWheel!==undefined)openRepeatWheel();
 if(b.dataset.repeatEnable!==undefined)setRepeatNotification(!eventDraft.repeatReminder);
 if(b.dataset.repeatWheelCancel!==undefined){$('repeatWheelModal').close();repeatWheelDraft=null;}
 if(b.dataset.repeatWheelDone!==undefined)acceptRepeatWheel();
 if(b.dataset.repeatWheelValue!==undefined){setRepeatWheelValue(b.dataset.repeatWheelKey,+b.dataset.repeatWheelValue);const col=document.querySelector('[data-repeat-column="'+b.dataset.repeatWheelKey+'"]');if(col)col.scrollTop=+b.dataset.repeatWheelValue*44;}
 if(b.dataset.repeatDismiss!==undefined){const record=state.careEvents[+b.dataset.repeatDismiss];if(record){record.repeatDismissed=true;updateRepeatNotifications();}}
});
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.repeatChoice!==undefined){const choices=repeatOptions(eventDraft.name,eventDraft.route),base=choices[+t.value];if(base){eventDraft.repeatChoiceIndex=+t.value;eventDraft.repeatMinutes=base.minutes;const active=!!eventDraft.repeatReminder;delete eventDraft.repeatDismissed;setRepeatNotification(active);}}
 if(t.dataset.drugReference!==undefined){const ref=DRUG_GUIDELINES[drugReferenceName(eventDraft.name)]?.[+t.value];if(ref){$('drugReferenceTitle').textContent=ref.title;$('drugSections').innerHTML=drugSectionMarkup(ref);$('drugCpgOnline').href=ref.url;$('drugCpgOnline').textContent=ref.code+' · NZCPG source ↗';}}
});
setInterval(()=>updateRepeatNotifications(),1000);

// Checklist text follows the specifically requested NZCPG checklist page, not the EAS 1.6 PDF.
let nonTransportChecks=[];
function openNonTransportChecklist(){
 const g=NON_TRANSPORT_CHECKLIST;
 $('nonTransportPane').innerHTML=`<h3>Non-transport pause and checklist</h3><p>${esc(g.intro)}</p><p><b>${esc(g.instruction)}</b></p>${g.items.map((text,i)=>`<label class="check nontransport-item"><input type="checkbox" data-nontransport-check="${i}" ${nonTransportChecks[i]?'checked':''}>${esc(text)}</label>`).join('')}<p class="subtle">Reference checklist · selections are not added to the clinical narrative.</p><a href="${g.url}" target="_blank" rel="noopener noreferrer">NZCPG source ↗</a>`;
 openReference('nontransport');
}
document.addEventListener('change',e=>{if(e.target.dataset.nontransportCheck!==undefined)nonTransportChecks[+e.target.dataset.nontransportCheck]=e.target.checked;});

document.getElementById('repeatWheelModal').addEventListener('cancel',()=>{repeatWheelDraft=null;});
