/* Cardiac arrest proof-of-concept. CPG EAS 3.14 + 7.2, checked 25 Oct 2026.
 * Standard non-traumatic arrest only. Timers never operate a defibrillator or
 * record a medicine/energy automatically. Epoch deadlines prevent interval drift.
 */
const ARREST_CONFIG={cycleMs:120000,adrenalineMs:240000,chargeSeconds:15,
 source:'https://cpg.stjohn.org.nz/tabs/guidelines/cardiac-eas/page/cardiac-arrest-eas',
 references:[
  {label:'Arrest checklist',pdf:'cpg-cardiac-arrest.pdf#page=2'},
  {label:'Post ROSC checklist',pdf:'cpg-post-rosc.pdf#page=2'},
  {label:'Preparation for RSI',pdf:'cpg-preparation-rsi.pdf'},
  {label:'RSI checklist',pdf:'cpg-rsi-checklist.pdf'},
  {label:'Cardiac arrest CPG',pdf:'cpg-cardiac-arrest.pdf'}
 ]};
let arrestInterval=null,arrestReference='';
function arrestIsVfVt(rhythm){return ['VF','VT','VF / pulseless VT'].includes(rhythm);}
function arrestJoules(weight){const w=validArrestWeight(weight);return w===null?null:Math.min(Math.round(w*4*10)/10,200);}
function emptyArrestState(){return {id:null,phase:'Ready',startedAt:null,endedAt:null,deadline:null,remainingMs:120000,cycles:0,rhythm:'Not set',priorShocks:0,priorAmiodarone:0,group:'Adult',weight:'',weightSource:'Entered',age:'',adultDoseConfirmed:false,sidebarOpen:false,sidebarTab:'guidance',guidanceTopic:'overview',special:false};}
function arrestTiming(a,now=Date.now()){
 const remainingMs=a.deadline===null?a.remainingMs:Math.max(0,a.deadline-now),seconds=Math.ceil(remainingMs/1000),active=a.phase==='Active';
 return {remainingMs,seconds,elapsed:a.startedAt===null?0:Math.max(0,(a.endedAt??now)-a.startedAt),running:active&&a.deadline!==null&&seconds>0,expired:active&&a.deadline!==null&&seconds===0,charge:active&&!a.special&&a.deadline!==null&&seconds>0&&seconds<=15};
}
function arrestCaseEvents(a,events){return events.filter(e=>e.arrestId===a.id&&a.id);}
function arrestShockCount(a,events){return a.priorShocks+arrestCaseEvents(a,events).filter(e=>e.arrestAction==='shock'&&e.name==='Defibrillation').length;}
function arrestReminders(a,events,now=Date.now()){
 const caseEvents=arrestCaseEvents(a,events),adrenaline=caseEvents.filter(e=>e.arrestAction==='adrenaline'&&e.name.toLowerCase()==='adrenaline').sort((x,y)=>new Date(x.at)-new Date(y.at)),last=adrenaline.at(-1),amiodarone=a.priorAmiodarone+caseEvents.filter(e=>e.arrestAction==='amiodarone'&&e.name.toLowerCase()==='amiodarone').length,shocks=arrestShockCount(a,events),enabled=a.phase==='Active'&&!a.special;
 const remaining=last?new Date(last.at).getTime()+ARREST_CONFIG.adrenalineMs-now:null;
 return {enabled,adrenalineRemaining:remaining,adrenalineDue:enabled&&remaining!==null&&remaining<=0,futureDrugTime:!!last&&new Date(last.at).getTime()>now,amiodaroneDue:enabled&&arrestIsVfVt(a.rhythm)&&((shocks>=3&&amiodarone===0)||(shocks>=6&&amiodarone===1)),amiodaroneDoseNumber:amiodarone===0?1:2,amiodaroneCount:amiodarone,shocks};
}
function arrestDoseReference(group,weight){
 if(group==='Adult')return {label:'Adult reference',shock:'Maximum setting on the defibrillator',adrenaline:'1 mg IV',amiodarone1:'300 mg IV',amiodarone2:'150 mg IV'};
 const w=Number(String(weight).replace(',','.'));if(!String(weight).trim()||!Number.isFinite(w)||w<=0||w>40)return null;
 const band=[5,10,20,30,40].find(x=>w<=x),joules={5:'20–25 J',10:'40–50 J',20:'80–100 J',30:'120–150 J',40:'160–200 J'}[band];
 return {label:'Child · CPG '+band+' kg table (weight rounded up)',shock:joules,adrenaline:(band/100)+' mg IV',amiodarone1:(band*5)+' mg IV',amiodarone2:(band*2.5)+' mg IV'};
}
function clockText(ms){const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60).toString().padStart(2,'0')+':'+(s%60).toString().padStart(2,'0');}
function ensureArrestId(){if(!state.arrest.id)state.arrest.id='arrest-'+Date.now();}
function arrestStamp(action,now=Date.now()){
 ensureArrestId();const date=new Date(now),names={cycle:'CPR cycle timer started',shock:'Defibrillation',adrenaline:'Adrenaline',amiodarone:'Amiodarone',rosc:'ROSC recorded',ended:'Arrest workspace ended',rhythm:'Rhythm recorded'};
 const drug=['adrenaline','amiodarone'].includes(action),entry={at:date.toISOString(),local:localDateTime(date),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,kind:drug?'drug':'intervention',name:names[action]||action,dose:'',unit:'',route:'',details:action==='shock'?'Energy not recorded':action==='rhythm'?state.arrest.rhythm:'',arrestId:state.arrest.id,arrestAction:action};
 state.careEvents.push(entry);changed();if($('arrestModal').open){renderArrestLog();updateArrestClock(now);}render();return entry;
}
function startArrestCycle(now=Date.now()){
 const a=state.arrest;ensureArrestId();if(a.startedAt===null)a.startedAt=now;a.endedAt=null;a.phase='Active';a.deadline=now+ARREST_CONFIG.cycleMs;a.remainingMs=ARREST_CONFIG.cycleMs;a.cycles++;arrestStamp('cycle',now);updateArrestClock();
}
function pauseArrestCycle(now=Date.now()){
 const a=state.arrest;if(a.phase!=='Active')return;
 if(a.deadline!==null){const remaining=arrestTiming(a,now).remainingMs;if(remaining===0){updateArrestClock(now);return;}a.remainingMs=remaining;a.deadline=null;}else if(a.remainingMs>0)a.deadline=now+a.remainingMs;
 updateArrestClock();
}
function stopArrest(phase,now=Date.now()){
 const a=state.arrest;a.remainingMs=arrestTiming(a,now).remainingMs;a.deadline=null;a.phase=phase;a.endedAt=now;arrestStamp(phase==='ROSC'?'rosc':'ended',now);updateArrestClock();
}
function openArrest(){
 if($('careModal').open)stashCareDraft();if($('wheelModal').open)$('wheelModal').close();
 openPocketArrest();
}

// The console is fixed to the viewport; only the contextual sidebar scrolls.
function renderArrest(){
 const a=state.arrest;
 $('arrestModal').innerHTML=`<div class="arrest-shell arrest-v2 ${a.sidebarOpen?'side-open':''}"><div class="arrest-header"><div class="arrest-weight-stack"><button class="arrest-weight-button" data-arrest-weight><span>Pt weight</span><b id="arrestWeightLabel">${esc(a.weight?a.weight+' kg':'Enter kg')}</b></button><span id="arrestWeightJoules" class="arrest-weight-joules"></span></div><div class="arrest-heading"><b>Cardiac arrest <small id="arrestMiniClock"></small></b><span>Standard non-traumatic CPG</span></div><div class="arrest-header-actions"><button class="quiet arrest-sidebar-arrow" data-arrest-sidebar aria-label="${a.sidebarOpen?'Close':'Open'} arrest sidebar" aria-expanded="${!!a.sidebarOpen}">${a.sidebarOpen?'›':'‹'}</button><button class="quiet" data-arrest-tab="checklists">Checklists</button><button class="quiet" data-arrest-close>Notes ↗</button></div></div><div class="arrest-status"><span id="arrestCycleLabel"></span><span id="arrestElapsed"></span><span id="arrestShockCount"></span><span id="arrestManualLabel"></span></div><div class="arrest-body arrest-body-v2"><main class="arrest-console"><section class="arrest-timer-zone"><div class="arrest-dial" id="arrestDial"><svg viewBox="0 0 220 220" aria-hidden="true"><circle class="dial-track" cx="110" cy="110" r="96"/><circle id="arrestArc" class="dial-progress" cx="110" cy="110" r="96"/><g class="arrest-dial-marks"><line x1="14" y1="110" x2="26" y2="110"/><text x="24" y="145">30s</text><line x1="42.1" y1="42.1" x2="51" y2="51"/><text x="52" y="43">15s</text></g></svg><div><strong id="arrestCountdown" role="timer" aria-label="Two minute cycle countdown">02:00</strong><span id="arrestPhase">Ready</span></div></div><div id="arrestCharge"></div><span id="arrestAlert" class="sr-only" role="status" aria-live="polite"></span><div class="arrest-timer-actions"><button data-arrest-start id="arrestStart">Start 2 minutes</button><button id="arrestRhythmCheck" class="quiet" data-arrest-rhythm-check>Rhythm check</button><button class="quiet" data-arrest-pause id="arrestPause">Pause cycle</button></div><p id="arrestCurrentRhythm" class="arrest-current-rhythm"></p><p id="arrestDefibReference" class="arrest-defib-reference"></p></section><div class="arrest-control-grid"><section class="arrest-control-card" id="arrestAdrenalineCard"><div class="arrest-card-title"><h3>Adrenaline</h3><button class="text-control" data-arrest-administration="adrenaline">Administration</button></div><div id="arrestAdrenalineDose" class="arrest-dose-reference"></div><strong id="adrenalineClock" class="arrest-medicine-clock"></strong><p id="adrenalineDue" class="arrest-drug-review"></p><button class="arrest-stamp" data-arrest-stamp="adrenaline">Time administered</button></section><section class="arrest-control-card" id="arrestAmiodaroneCard"><div class="arrest-card-title"><h3>Amiodarone</h3><button class="text-control" data-arrest-administration="amiodarone">Administration</button></div><div id="arrestAmiodaroneDose" class="arrest-dose-reference"></div><strong id="amiodaroneClock" class="arrest-medicine-clock"></strong><small class="arrest-clock-caption">Since dose</small><p id="amiodaroneDue" class="arrest-drug-review"></p><button class="arrest-stamp" data-arrest-stamp="amiodarone">Time administered</button></section><section class="arrest-control-card arrest-equipment-card"><h3>IV access</h3><div class="arrest-access-actions"><button class="quiet" data-arrest-intervention="iv">IV cannulation</button><button class="quiet" data-arrest-intervention="io">IO</button></div><p id="arrestAccessSummary" class="arrest-latest-entry"></p></section><section class="arrest-control-card arrest-equipment-card"><h3>Airway interventions</h3><div class="arrest-airway-actions">${[['opa','OPA'],['npa','NPA'],['igel','iGel'],['laryngoscopy','Laryngoscopy'],['intubation','Intubation']].map(([id,label])=>`<button class="quiet" data-arrest-intervention="${id}">${label}</button>`).join('')}</div><p id="arrestAirwaySummary" class="arrest-latest-entry"></p></section></div></main><aside class="arrest-sidebar" aria-label="Arrest sidebar" ${a.sidebarOpen?'':'hidden'}><nav class="arrest-side-tabs" aria-label="Arrest reference sections">${[['guidance','Guidance'],['log','Action log'],['guidelines','Guidelines'],['checklists','Checklists']].map(([id,label])=>`<button data-arrest-tab="${id}" aria-pressed="${a.sidebarTab===id}">${label}</button>`).join('')}</nav><div id="arrestSideContent" class="arrest-side-content"></div></aside></div><div class="arrest-bottom"><span>Reference ≠ given dose · Edit actuals in action log.</span><div><button class="quiet" data-arrest-other>Other drug / action</button><button class="quiet" data-arrest-end>End session</button></div></div></div>`;
 renderArrestSide();renderArrestDoses();updateArrestClock();
}
function toggleArrestSidebar(force){
 state.arrest.sidebarOpen=force===undefined?!state.arrest.sidebarOpen:force;
 const open=state.arrest.sidebarOpen;document.querySelector('.arrest-v2')?.classList.toggle('side-open',open);const side=document.querySelector('.arrest-sidebar');if(side)side.hidden=!open;
 const arrow=document.querySelector('[data-arrest-sidebar]');if(arrow){arrow.textContent=open?'›':'‹';arrow.setAttribute('aria-label',(open?'Close':'Open')+' arrest sidebar');arrow.setAttribute('aria-expanded',String(open));}
}
function openArrestTab(tab){state.arrest.sidebarTab=tab;toggleArrestSidebar(true);renderArrestSide();}
function renderArrestSide(){
 const a=state.arrest,root=$('arrestSideContent');if(!root)return;
 document.querySelectorAll('[data-arrest-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.arrestTab===a.sidebarTab)));
 if(a.sidebarTab==='log'){root.innerHTML='<div class="rowhead"><h3>Action log</h3><button class="quiet" data-arrest-undo>Undo last log</button></div><div id="arrestLog"></div>';renderArrestLog();return;}
 if(a.sidebarTab==='checklists'){renderArrestChecklists();return;}
 if(a.sidebarTab==='guidelines'){
  const refs=a.sidebarTab==='checklists'?ARREST_CONFIG.references.slice(0,4):[{label:'Cardiac arrest CPG',pdf:'cpg-cardiac-arrest.pdf'},{label:'Adrenaline',pdf:'cpg-drugs/eas-14-3.pdf'},{label:'Amiodarone',pdf:'cpg-drugs/eas-14-4.pdf'},{label:'Paediatric equipment / doses',pdf:'cpg-paediatric-equipment.pdf'}];
  root.innerHTML=`${arrestRsiGuidance()}<div class="arrest-reference-buttons">${refs.map(r=>`<button class="quiet" data-arrest-ref="${r.pdf}">${r.label}</button>`).join('')}</div><section id="arrestPdfPanel" ${arrestReference?'':'hidden'}><h3 id="arrestPdfTitle">${esc(a.referenceLabel||'Reference')}</h3><object id="arrestPdf" type="application/pdf" data="${esc(arrestReference)}" title="${esc(a.referenceLabel||'Reference')}"><p>Use the separate viewer if this device cannot display the PDF.</p></object><a id="arrestPdfExternal" href="${esc(arrestReference)}" target="_blank" rel="noopener noreferrer">Open separately ↗</a></section>`;return;
 }
 const title=a.guidanceTopic==='adrenaline'?'Adrenaline · administration':a.guidanceTopic==='amiodarone'?'Amiodarone · administration':'Arrest guidance';
 const body=a.guidanceTopic==='adrenaline'?'<p>Cardiac arrest: adults and children whose weight has been rounded to 50 kg or more — administer undiluted as an IV bolus.</p><p>Children whose weight has been rounded to 40 kg or less — dilute 1 mg to a total of 10 ml using 0.9% sodium chloride. This is 1:10,000 (0.1 mg/ml). Draw up the dose from this solution and administer as an IV bolus.</p><p>Source: CPG EAS 14.3. Use the full CPG for other indications.</p>':a.guidanceTopic==='amiodarone'?'<p>Cardiac arrest: administer IV undiluted as a bolus.</p><p>Standard VF / pulseless VT: first dose after three shocks; second after six shocks. Withhold amiodarone for torsades. Reference doses are shown on the card; actual administration is recorded separately.</p><p>Source: CPG EAS 3.14 and 14.4.</p>':'<p>Two-minute cycle timer. The final 15-second charge cue is preparation only; shock only when indicated.</p><p>Rhythm check records Shock, No shock or ROSC, then the observed rhythm. Shock / no-shock confirmation starts the next timer; ROSC pauses it and offers the checklist.</p><p>Adrenaline review: four minutes from the last logged administration. Amiodarone reviews use VF/VT, shock count and prior doses. Special situations require manual review.</p>';
 root.innerHTML=`<h3>${title}</h3>${body}<hr><h3>Context</h3><label class="check"><input type="checkbox" data-arrest-special ${a.special?'checked':''}>Special situation · manual review</label><label>Prior shocks<input data-arrest-prior-shocks type="number" min="0" max="100" step="1" value="${a.priorShocks}"></label><label>Prior amiodarone doses<select data-arrest-prior-amio>${[0,1,2].map(n=>`<option ${n===a.priorAmiodarone?'selected':''}>${n}</option>`).join('')}</select></label><p class="subtle">Prior counts default to zero. Confirm the history. Weight references use the 5/10/20/30/40 kg CPG bands. Age-based weights are estimates, not measurements.</p><button class="quiet" data-arrest-ref="cpg-paediatric-equipment.pdf">Paediatric dose reference</button>`;
}
function showArrestReference(pdf,label){
 arrestReference=pdf;state.arrest.referenceLabel=label;const checklist=ARREST_CHECKLISTS.find(x=>x.pdf===pdf);if(checklist)state.arrest.checklist=checklist.id;const isChecklist=ARREST_CONFIG.references.slice(0,4).some(r=>r.pdf===pdf);openArrestTab(isChecklist?'checklists':'guidelines');
}
function renderArrestDoses(){
 const a=state.arrest,r=currentArrestDoseReference(a),paed=a.group==='Child',basis=a.weight?`${a.weight} kg · ${a.weightSource?.startsWith('Estimated')?'estimated':'entered'}${paed?' · paediatric':''}`:'Weight not recorded';
 for(const id of ['arrestAdrenalineCard','arrestAmiodaroneCard'])$(id)?.classList.toggle('paediatric-reference',paed&&!!a.weight);
 if($('arrestAdrenalineDose'))$('arrestAdrenalineDose').innerHTML=`<small>${esc(basis)}</small>${r?`<b class="${paed?'paediatric-dose':''}">${r.adrenaline}</b><small>Reference · ${esc(r.label)}</small>`:`<span>${a.weight?'Confirm dosing reference':'Enter pt weight'}</span>`}`;
 if($('arrestAmiodaroneDose'))$('arrestAmiodaroneDose').innerHTML=`<small>${esc(basis)}</small>${r?`<div><b class="${paed?'paediatric-dose':''}">1st ${r.amiodarone1}</b><b class="${paed?'paediatric-dose':''}">2nd ${r.amiodarone2}</b></div><small>Reference · ${esc(r.label)}</small>`:`<span>${a.weight?'Confirm dosing reference':'Enter pt weight'}</span>`}`;
 arrestSetText('arrestWeightLabel',a.weight?a.weight+' kg':'Enter kg');arrestSetText('arrestWeightJoules',a.weight?arrestJoules(a.weight)+' J · 4 J/kg\nMax 200 J':'');arrestSetText('arrestDefibReference',a.weight?(a.group==='Child'?'4 J/kg calculation shown under weight':'Adult CPG: maximum device setting'):'');
}
function arrestSetText(id,value){const el=$(id);if(el&&el.textContent!==value)el.textContent=value;}
function updateArrestClock(now=Date.now()){
 const a=state.arrest,t=arrestTiming(a,now),rem=arrestReminders(a,state.careEvents,now),arc=$('arrestArc');if(!arc)return;
 arrestSetText('arrestCountdown',clockText(t.remainingMs));arrestSetText('arrestMiniClock',clockText(t.remainingMs));arrestSetText('arrestPhase',a.phase==='Active'?(t.expired?'Rhythm check':a.deadline===null?'Paused':'CPR cycle'):a.phase);
 arc.style.strokeDasharray=String(2*Math.PI*96);arc.style.strokeDashoffset=String(2*Math.PI*96*(1-Math.min(1,t.remainingMs/ARREST_CONFIG.cycleMs)));$('arrestDial').classList.toggle('last-seconds',t.seconds<=15&&t.running);
 arrestSetText('arrestCycleLabel','Cycle '+a.cycles);arrestSetText('arrestElapsed','Elapsed '+clockText(t.elapsed));arrestSetText('arrestShockCount','Shocks '+rem.shocks);arrestSetText('arrestManualLabel',a.special?'Special / manual':'');
 arrestSetText('arrestCharge',t.charge?'CHARGE DEFIB':t.expired?'RHYTHM CHECK':'');$('arrestCharge').classList.toggle('charge-flash',t.charge);
 if($('arrestStart')){$('arrestStart').hidden=a.phase==='Active';$('arrestStart').textContent=a.cycles?'Start 2 minutes':'Start 2 minutes';}
 if($('arrestRhythmCheck')){$('arrestRhythmCheck').classList.toggle('rhythm-due',t.expired);$('arrestRhythmCheck').textContent=t.expired?'Rhythm check · due':'Rhythm check';}
 if($('arrestPause')){$('arrestPause').disabled=a.phase!=='Active'||t.expired;$('arrestPause').textContent=a.deadline===null?'Resume cycle':'Pause cycle';}
 $('adrenalineDue')?.classList.toggle('drug-due',rem.adrenalineDue);$('amiodaroneDue')?.classList.toggle('drug-due',rem.amiodaroneDue);
 renderArrestMedicineClocks(rem,now);
 arrestSetText('adrenalineDue',!rem.enabled?'Reminder inactive':rem.futureDrugTime?'Check future timestamp':rem.adrenalineRemaining===null?'No dose timestamp':rem.adrenalineDue?'REVIEW DOSE · overdue':'Next review');
 arrestSetText('amiodaroneDue',!rem.enabled?'Reminder inactive':a.rhythm==='Torsades'?'Withhold · torsades':rem.amiodaroneDue?'REVIEW '+(rem.amiodaroneDoseNumber===1?'FIRST':'SECOND')+' DOSE':arrestIsVfVt(a.rhythm)&&rem.amiodaroneCount>=2?'Two doses logged':arrestIsVfVt(a.rhythm)?'Review after '+(rem.amiodaroneCount?'6':'3')+' shocks':'VF/VT required · no prompt');
 arrestSetText('arrestCurrentRhythm','Rhythm: '+a.rhythm);
 for(const [id,types] of [['arrestAccessSummary',['iv','io']],['arrestAirwaySummary',['opa','npa','igel','laryngoscopy','intubation']]]){const last=arrestCaseEvents(a,state.careEvents).filter(e=>types.includes(e.arrestProcedure)).at(-1);arrestSetText(id,last?last.name+' · '+(last.arrestDetails?.size||'size not recorded'):'No entry');}
 arrestSetText('arrestAlert',[t.charge?'Charge defib':t.expired?'Rhythm check due':'',rem.adrenalineDue?'Review adrenaline dose':'',rem.amiodaroneDue?'Review amiodarone dose':''].filter(Boolean).join('. '));
}
function renderArrestLog(){
 const root=$('arrestLog');if(!root)return;const events=arrestCaseEvents(state.arrest,state.careEvents).map(e=>({e,index:state.careEvents.indexOf(e)})).sort((a,b)=>new Date(b.e.at)-new Date(a.e.at));
 root.innerHTML=events.length?events.map(({e,index})=>`<div class="arrest-log-row"><time>${esc(eventTime(e))}</time><strong>${esc(e.name)}</strong><span>${esc(e.kind==='drug'?drugDetails(e):e.details)}</span><button class="quiet" data-arrest-edit="${index}">Edit</button></div>`).join(''):'<p class="subtle">No actions logged.</p>';
}
function setArrestGauge(index){const size=ARREST_EQUIPMENT.iv.sizes[Number(index)];if(!size)return;const input=document.querySelector('#arrestInterventionForm [name="size"]');if(input)input.value=size;arrestSetText('ivGaugeReading',size+'G');}
function saveArrestInterventionForm(){
 const form=$('arrestInterventionForm'),data={confirmation:[]};new FormData(form).forEach((value,key)=>{if(key==='confirmation')data.confirmation.push(value);else data[key]=String(value).trim();});
 const local=data.local;delete data.local;const result=recordArrestIntervention(arrestEntry.type,data,local,arrestEntry.index,local===arrestEntry.initialLocal?arrestEntry.initialAt:null);
 if(result.errors){arrestEntryError(result.errors.join(' '));return;}arrestEntry=null;$('arrestEntryModal').close();renderArrestLog();updateArrestClock();render();
}
document.getElementById('arrestButton').addEventListener('click',openArrest);
document.addEventListener('click',e=>{
 if(e.target.dataset.arrestSizeSlider!==undefined)setArrestSizeSlider(e.target.dataset.arrestSizeSlider,e.target.value);
 if(e.target.dataset.arrestIvGauge!==undefined)setArrestGauge(e.target.value);
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.arrestClose!==undefined){$('arrestModal').close();render();}
 if(b.dataset.arrestSidebar!==undefined)toggleArrestSidebar();
 if(b.dataset.arrestTab)openArrestTab(b.dataset.arrestTab);
 if(b.dataset.arrestStart!==undefined)startArrestCycle();
 if(b.dataset.arrestPause!==undefined)pauseArrestCycle();
 if(b.dataset.arrestRhythmCheck!==undefined)openArrestRhythmCheck();
 if(b.dataset.arrestEnd!==undefined)stopArrest('Ended');
 if(b.dataset.arrestStamp)arrestStamp(b.dataset.arrestStamp);
 if(b.dataset.arrestWeight!==undefined)openArrestWeight();
 if(b.dataset.arrestWeightKey!==undefined)enterArrestWeightKey(b.dataset.arrestWeightKey);
 if(b.dataset.arrestEstimate!==undefined)useArrestAgeEstimate();
 if(b.dataset.arrestWeightSave!==undefined){if(!commitArrestWeight())arrestEntryError('Enter weight above zero and no more than 500 kg.');else {$('arrestEntryModal').close();arrestEntry=null;renderArrestDoses();}}
 if(b.dataset.arrestAdministration){state.arrest.guidanceTopic=b.dataset.arrestAdministration;openArrestTab('guidance');}
 if(b.dataset.arrestRef)showArrestReference(b.dataset.arrestRef,b.textContent.replace(' ↗',''));
 if(b.dataset.arrestIntervention)openArrestIntervention(b.dataset.arrestIntervention);
 if(b.dataset.arrestInterventionSave!==undefined)saveArrestInterventionForm();
 if(b.dataset.arrestEntryCancel!==undefined){arrestEntry=null;$('arrestEntryModal').close();}
 if(b.dataset.arrestChecklist) {state.arrest.checklist=b.dataset.arrestChecklist;renderArrestChecklists();}
 if(b.dataset.arrestOutcome){arrestEntry.rhythm='';arrestEntry.other='';arrestEntry.outcome=b.dataset.arrestOutcome;arrestEntry.at=Date.now();renderArrestRhythmEntry();}
 if(b.dataset.arrestOutcomeBack!==undefined){arrestEntry.outcome=null;renderArrestRhythmEntry();}
 if(b.dataset.arrestRhythmSave!==undefined){const outcome=arrestEntry.outcome;if(!completeArrestRhythmCheck(arrestEntry))arrestEntryError('Choose the observed rhythm. Describe Other if selected.');else if(outcome==='ROSC')askPostRoscChecklist();else {arrestEntry=null;$('arrestEntryModal').close();}}
 if(b.dataset.arrestPostrosc){$('arrestEntryModal').close();arrestEntry=null;if(b.dataset.arrestPostrosc==='yes')showArrestReference('cpg-post-rosc.pdf#page=2','Post ROSC checklist');}
 if(b.dataset.arrestUndo!==undefined){const last=state.careEvents.map((e,i)=>({e,i})).filter(x=>x.e.arrestId===state.arrest.id).at(-1);if(last){state.careEvents.splice(last.i,1);changed();renderArrestLog();render();updateArrestClock();}}
 if(b.dataset.arrestEdit!==undefined){const index=+b.dataset.arrestEdit,entry=state.careEvents[index];if(entry.arrestProcedure)openArrestIntervention(entry.arrestProcedure,index);else {$('arrestModal').close();openCare(entry.kind,index);}}
 if(b.dataset.arrestOther!==undefined){ensureArrestId();$('arrestModal').close();openCare('drug');eventDraft.arrestId=state.arrest.id;eventDraft.arrestAction='arrest_other';}
});
document.addEventListener('change',e=>{const t=e.target,a=state.arrest;
 if(t.dataset.arrestChecklistItem!==undefined){toggleArrestChecklistItem(t.dataset.arrestChecklistItem,t.checked);renderArrestChecklists();renderArrestLog();render();}
 if(t.name==='sizeUnit')changeArrestSizeUnit();
 if(t.dataset.arrestWeightField==='group'&&arrestEntry?.kind==='weight'){arrestEntry.group=t.value;syncArrestWeightGroup();}
 if(t.dataset.arrestSpecial!==undefined)a.special=t.checked;
 if(t.dataset.arrestPriorAmio!==undefined)a.priorAmiodarone=Number(t.value);
 if(t.dataset.arrestPriorShocks!==undefined){const n=Number(t.value);if(Number.isInteger(n)&&n>=0&&n<=100)a.priorShocks=n;else t.value=a.priorShocks;}
 if(t.dataset.arrestWeightField!==undefined&&arrestEntry?.kind==='weight'){arrestEntry[t.dataset.arrestWeightField]=t.value;if(t.dataset.arrestWeightField==='group')arrestEntry.adultDoseConfirmed=false;}
 if(t.dataset.arrestWeightConfirm!==undefined&&arrestEntry?.kind==='weight')arrestEntry.adultDoseConfirmed=t.checked;
 if(t.dataset.arrestCheckRhythm!==undefined&&arrestEntry?.kind==='rhythm')arrestEntry.rhythm=t.value;
 if($('arrestModal').open)updateArrestClock();
});
document.addEventListener('input',e=>{const t=e.target;
 if(t.dataset.arrestWeightField!==undefined&&arrestEntry?.kind==='weight'){arrestEntry[t.dataset.arrestWeightField]=t.value;if(t.dataset.arrestWeightField==='weight'){arrestEntry.source='Entered';arrestEntry.adultDoseConfirmed=false;arrestSetText('weightEstimateLabel','Entered');autoArrestWeightGroup(arrestEntry);syncArrestWeightGroup();const c=document.querySelector('[data-arrest-weight-confirm]');if(c)c.checked=false;}}
 if(t.dataset.arrestSizeSlider!==undefined)setArrestSizeSlider(t.dataset.arrestSizeSlider,t.value);
 if(t.name==='size'&&t.type==='text')arrestSetText('arrestSizeReading',t.value||'Not recorded');
 if(t.dataset.arrestIvGauge!==undefined)setArrestGauge(t.value);
 if(t.dataset.arrestCheckOther!==undefined&&arrestEntry?.kind==='rhythm')arrestEntry.other=t.value;
});
document.addEventListener('focusin',e=>{if(arrestEntry?.kind==='weight'&&['weight','age'].includes(e.target.dataset.arrestWeightField))arrestEntry.padTarget=e.target.dataset.arrestWeightField;});
document.addEventListener('submit',e=>{if(e.target.id==='arrestInterventionForm')e.preventDefault();});
document.getElementById('arrestEntryModal').addEventListener('cancel',()=>{arrestEntry=null;});
