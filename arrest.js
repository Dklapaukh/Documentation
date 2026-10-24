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
function emptyArrestState(){return {id:null,phase:'Ready',startedAt:null,endedAt:null,deadline:null,remainingMs:120000,cycles:0,rhythm:'Not set',priorShocks:0,priorAmiodarone:0,group:'Adult',weight:'',special:false};}
function arrestTiming(a,now=Date.now()){
 const remainingMs=a.deadline===null?a.remainingMs:Math.max(0,a.deadline-now),seconds=Math.ceil(remainingMs/1000),active=a.phase==='Active';
 return {remainingMs,seconds,elapsed:a.startedAt===null?0:Math.max(0,(a.endedAt??now)-a.startedAt),running:active&&a.deadline!==null&&seconds>0,expired:active&&a.deadline!==null&&seconds===0,charge:active&&!a.special&&a.deadline!==null&&seconds>0&&seconds<=15};
}
function arrestCaseEvents(a,events){return events.filter(e=>e.arrestId===a.id&&a.id);}
function arrestShockCount(a,events){return a.priorShocks+arrestCaseEvents(a,events).filter(e=>e.arrestAction==='shock'&&e.name==='Defibrillation').length;}
function arrestReminders(a,events,now=Date.now()){
 const caseEvents=arrestCaseEvents(a,events),adrenaline=caseEvents.filter(e=>e.arrestAction==='adrenaline'&&e.name.toLowerCase()==='adrenaline').sort((x,y)=>new Date(x.at)-new Date(y.at)),last=adrenaline.at(-1),amiodarone=a.priorAmiodarone+caseEvents.filter(e=>e.arrestAction==='amiodarone'&&e.name.toLowerCase()==='amiodarone').length,shocks=arrestShockCount(a,events),enabled=a.phase==='Active'&&!a.special;
 const remaining=last?new Date(last.at).getTime()+ARREST_CONFIG.adrenalineMs-now:null;
 return {enabled,adrenalineRemaining:remaining,adrenalineDue:enabled&&remaining!==null&&remaining<=0,futureDrugTime:!!last&&new Date(last.at).getTime()>now,amiodaroneDue:enabled&&a.rhythm==='VF / pulseless VT'&&((shocks>=3&&amiodarone===0)||(shocks>=6&&amiodarone===1)),amiodaroneDoseNumber:amiodarone===0?1:2,amiodaroneCount:amiodarone,shocks};
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
 if(a.deadline!==null){a.remainingMs=arrestTiming(a,now).remainingMs;a.deadline=null;}else if(a.remainingMs>0)a.deadline=now+a.remainingMs;
 updateArrestClock();
}
function stopArrest(phase,now=Date.now()){
 const a=state.arrest;a.remainingMs=arrestTiming(a,now).remainingMs;a.deadline=null;a.phase=phase;a.endedAt=now;arrestStamp(phase==='ROSC'?'rosc':'ended',now);if(phase==='ROSC')showArrestReference('cpg-post-rosc.pdf#page=2','Post ROSC checklist');updateArrestClock();
}
function openArrest(){
 if($('careModal').open)stashCareDraft();if($('wheelModal').open)$('wheelModal').close();renderArrest();$('arrestModal').showModal();
 if(arrestInterval===null)arrestInterval=setInterval(()=>{if(typeof state==='undefined')return;if($('arrestModal').open)updateArrestClock();const badge=$('arrestBadge');if(badge)badge.textContent=state.arrest.phase==='Active'?clockText(arrestTiming(state.arrest).remainingMs):'';const attention=arrestReminders(state.arrest,state.careEvents);$('arrestButton').classList.toggle('arrest-attention',state.arrest.phase==='Active'&&(arrestTiming(state.arrest).expired||attention.adrenalineDue||attention.amiodaroneDue));},250);
}
function renderArrest(){
 const a=state.arrest;
 $('arrestModal').innerHTML=`<div class="arrest-shell"><div class="arrest-header"><div><b>Cardiac arrest <small id="arrestMiniClock"></small></b><span>PROOF OF CONCEPT · standard non-traumatic CPG</span></div><div><button class="quiet" data-arrest-weight>Patient weight / doses</button><button class="quiet" data-arrest-close>Notes ↗</button></div></div><div class="arrest-body"><section class="arrest-instrument"><div class="arrest-status"><span id="arrestCycleLabel"></span><span id="arrestElapsed"></span><span id="arrestShockCount"></span></div><div class="arrest-dial" id="arrestDial"><svg viewBox="0 0 220 220" aria-hidden="true"><circle class="dial-track" cx="110" cy="110" r="96"/><circle id="arrestArc" class="dial-progress" cx="110" cy="110" r="96"/></svg><div><strong id="arrestCountdown" role="timer" aria-label="Two minute cycle countdown">02:00</strong><span id="arrestPhase">Ready</span></div></div><div id="arrestCharge"></div><span id="arrestAlert" class="sr-only" role="status" aria-live="polite"></span><div class="arrest-cycle-controls"><button data-arrest-start id="arrestStart">Start 2 minutes</button><button class="quiet" data-arrest-pause id="arrestPause">Pause cycle</button><button class="quiet" data-arrest-rosc>ROSC</button><button class="quiet" data-arrest-end>End session</button></div><div class="arrest-rhythm"><label>Rhythm<select data-arrest-rhythm>${options(['VF / pulseless VT','PEA','Asystole','Torsades','Not set'],a.rhythm,'Choose rhythm')}</select></label><label class="check"><input type="checkbox" data-arrest-special ${a.special?'checked':''}>Special situation · manual review</label></div><div class="arrest-drug-row"><section><h3>Adrenaline</h3><p id="adrenalineDue" aria-live="off"></p><button class="arrest-stamp" data-arrest-stamp="adrenaline">+ Time given</button></section><section><h3>Amiodarone</h3><p id="amiodaroneDue" aria-live="off"></p><button class="arrest-stamp" data-arrest-stamp="amiodarone">+ Time given</button></section></div><div class="arrest-events-bar"><button data-arrest-stamp="shock">Shock delivered + time</button><button class="quiet" data-arrest-other>Other drug / action ↗</button><button class="quiet" data-arrest-undo>Undo last log</button></div><p class="arrest-note">Timestamps record the action only. Enter actual dose / energy using Edit. The 15-second charge cue is preparation only; shock only when indicated. Pausing the cycle does not pause medicine intervals.</p><div class="arrest-links">${ARREST_CONFIG.references.map(r=>`<button class="quiet" data-arrest-ref="${r.pdf}">${r.label} ↗</button>`).join('')}</div></section><aside class="arrest-side"><div class="arrest-weight-panel" id="arrestWeightPanel" hidden><h3>Reference doses · not an administration</h3><div class="grid"><label>Patient group<select data-arrest-group>${options(['Adult','Child'],a.group,'Choose group')}</select></label><label>Weight (kg)<input data-arrest-weight-value type="text" inputmode="decimal" placeholder="Measured / estimated" value="${esc(a.weight)}"></label><label>Prior shocks<input data-arrest-prior-shocks type="number" min="0" step="1" value="${a.priorShocks}"></label><label>Prior amiodarone doses<select data-arrest-prior-amio>${[0,1,2].map(n=>`<option ${a.priorAmiodarone===n?'selected':''}>${n}</option>`).join('')}</select></label></div><div id="arrestDoses"></div><p class="subtle">Child values use the 5/10/20/30/40 kg CPG tables. For weight over 40 kg, newborns or special situations, use the full CPG. Prior counts default to zero; confirm the history.</p><a href="${ARREST_CONFIG.source}" target="_blank" rel="noopener noreferrer">NZCPG EAS 3.14 ↗</a></div><section id="arrestPdfPanel" hidden><div class="rowhead"><h3 id="arrestPdfTitle">Checklist</h3><button class="quiet" data-arrest-close-ref>×</button></div><object id="arrestPdf" type="application/pdf" title="Arrest checklist"></object><a id="arrestPdfExternal" target="_blank" rel="noopener noreferrer">Open checklist separately ↗</a></section><section class="arrest-log"><h3>Event log</h3><div id="arrestLog"></div></section></aside></div><div class="arrest-bottom"><span>Draft in this tab · visual reminders · no device control.</span><button class="quiet" data-arrest-close>Return to notes</button></div></div>`;
 renderArrestDoses();renderArrestLog();updateArrestClock();
 if(arrestReference)showArrestReference(arrestReference,'Checklist');
}
function renderArrestDoses(){const a=state.arrest,r=arrestDoseReference(a.group,a.weight);$('arrestDoses').innerHTML=r?`<p><b>${r.label}</b></p><dl><dt>Defibrillation · VF/VT</dt><dd>${r.shock}</dd><dt>Adrenaline · 4-minute interval</dt><dd>${r.adrenaline}</dd><dt>Amiodarone · after 3 shocks, persistent VF/VT</dt><dd>${r.amiodarone1}</dd><dt>Second amiodarone · after 6 shocks</dt><dd>${r.amiodarone2}</dd></dl><p class="subtle">No amiodarone prompt for torsades. Special-cause regimens are not calculated here.</p>`:'<p>Enter a child weight up to 40 kg for a table reference. Other patients: use the full CPG.</p>';}
function arrestSetText(id,value){const el=$(id);if(el&&el.textContent!==value)el.textContent=value;}
function updateArrestClock(now=Date.now()){
 const a=state.arrest,t=arrestTiming(a,now),rem=arrestReminders(a,state.careEvents,now),arc=$('arrestArc');if(!arc)return;
 $('arrestCountdown').textContent=clockText(t.remainingMs);arrestSetText('arrestMiniClock',clockText(t.remainingMs));$('arrestPhase').textContent=a.phase==='Active'?(t.expired?'Rhythm check':a.deadline===null?'Cycle paused':'CPR cycle'):a.phase;
 arc.style.strokeDasharray=String(2*Math.PI*96);arc.style.strokeDashoffset=String(2*Math.PI*96*(1-Math.min(1,t.remainingMs/ARREST_CONFIG.cycleMs)));$('arrestDial').classList.toggle('last-seconds',t.seconds<=15&&t.running);
 $('arrestCycleLabel').textContent='Cycle starts: '+a.cycles;$('arrestElapsed').textContent='Session elapsed '+clockText(t.elapsed);$('arrestShockCount').textContent='Shocks '+rem.shocks+' (prior '+a.priorShocks+')';
 arrestSetText('arrestCharge',t.charge?'CHARGE DEFIB':t.expired?'RHYTHM CHECK · CHANGE COMPRESSOR':a.phase==='Active'&&a.deadline!==null&&t.seconds<=15?'PREPARE RHYTHM CHECK':'');$('arrestCharge').classList.toggle('charge-flash',t.charge);
 $('arrestStart').textContent=a.cycles?'New 2-minute cycle':'Start 2 minutes';$('arrestPause').disabled=a.phase!=='Active'||t.expired;$('arrestPause').textContent=a.deadline===null?'Resume cycle':'Pause cycle';
 const adr=$('adrenalineDue'),ami=$('amiodaroneDue');adr.classList.toggle('drug-due',rem.adrenalineDue);ami.classList.toggle('drug-due',rem.amiodaroneDue);
 arrestSetText('adrenalineDue',!rem.enabled?'Arrest reminder inactive':rem.futureDrugTime?'Check future adrenaline timestamp':rem.adrenalineRemaining===null?'No dose timestamp · review CPG':rem.adrenalineDue?'REVIEW DOSE · due / overdue '+clockText(-rem.adrenalineRemaining):'Next review in '+clockText(rem.adrenalineRemaining));
 arrestSetText('amiodaroneDue',!rem.enabled?'Arrest reminder inactive':a.rhythm==='Torsades'?'Withhold amiodarone · see CPG':rem.amiodaroneDue?'REVIEW '+(rem.amiodaroneDoseNumber===1?'FIRST':'SECOND')+' DOSE · shock threshold reached':a.rhythm==='VF / pulseless VT'&&rem.amiodaroneCount>=2?'Two doses logged · further review is clinical':a.rhythm==='VF / pulseless VT'?'Review after '+(rem.amiodaroneCount?'6':'3')+' shocks · doses logged '+rem.amiodaroneCount:'VF/VT required · no dose prompt');
 arrestSetText('arrestAlert',[t.charge?'Charge defib':t.expired?'Rhythm check due':'',rem.adrenalineDue?'Review adrenaline dose':'',rem.amiodaroneDue?'Review amiodarone dose':''].filter(Boolean).join('. '));
}
function renderArrestLog(){const events=arrestCaseEvents(state.arrest,state.careEvents).map(e=>({e,index:state.careEvents.indexOf(e)})).sort((a,b)=>new Date(b.e.at)-new Date(a.e.at));$('arrestLog').innerHTML=events.length?events.map(({e,index})=>`<div class="arrest-log-row"><time>${esc(eventTime(e))}</time><strong>${esc(e.name)}</strong><span>${esc(e.kind==='drug'?drugDetails(e):e.details)}</span><button class="quiet" data-arrest-edit="${index}">Edit</button></div>`).join(''):'<p class="subtle">No actions logged.</p>';}
function showArrestReference(pdf,label){arrestReference=pdf;$('arrestPdfPanel').hidden=false;$('arrestPdf').data=pdf;$('arrestPdf').title=label;$('arrestPdfTitle').textContent=label;$('arrestPdfExternal').href=pdf;if(window.innerWidth<=600)$('arrestPdfPanel').scrollIntoView({block:'start',behavior:'instant'});}
document.getElementById('arrestButton').addEventListener('click',openArrest);
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.arrestClose!==undefined){$('arrestModal').close();render();}
 if(b.dataset.arrestStart!==undefined)startArrestCycle();
 if(b.dataset.arrestPause!==undefined)pauseArrestCycle();
 if(b.dataset.arrestRosc!==undefined)stopArrest('ROSC');
 if(b.dataset.arrestEnd!==undefined)stopArrest('Ended');
 if(b.dataset.arrestStamp)arrestStamp(b.dataset.arrestStamp);
 if(b.dataset.arrestWeight!==undefined){$('arrestWeightPanel').hidden=!$('arrestWeightPanel').hidden;if(window.innerWidth<=600){if(!$('arrestWeightPanel').hidden)$('arrestWeightPanel').scrollIntoView({block:'start',behavior:'instant'});else document.querySelector('.arrest-body').scrollTop=0;}}
 if(b.dataset.arrestRef)showArrestReference(b.dataset.arrestRef,b.textContent.replace(' ↗',''));
 if(b.dataset.arrestCloseRef!==undefined){arrestReference='';$('arrestPdfPanel').hidden=true;}
 if(b.dataset.arrestUndo!==undefined){const last=state.careEvents.map((e,i)=>({e,i})).filter(x=>x.e.arrestId===state.arrest.id).at(-1);if(last){state.careEvents.splice(last.i,1);changed();renderArrestLog();render();updateArrestClock();}}
 if(b.dataset.arrestEdit!==undefined){const index=+b.dataset.arrestEdit;$('arrestModal').close();openCare(state.careEvents[index].kind,index);}
 if(b.dataset.arrestOther!==undefined){$('arrestModal').close();openCare('drug');}
});
document.addEventListener('change',e=>{const t=e.target,a=state.arrest;
 if(t.dataset.arrestRhythm!==undefined){a.rhythm=t.value;arrestStamp('rhythm');}
 if(t.dataset.arrestSpecial!==undefined)a.special=t.checked;
 if(t.dataset.arrestGroup!==undefined){a.group=t.value;renderArrestDoses();}
 if(t.dataset.arrestPriorAmio!==undefined)a.priorAmiodarone=Number(t.value);
 if(t.dataset.arrestPriorShocks!==undefined){const n=Number(t.value);if(Number.isInteger(n)&&n>=0&&n<=100)a.priorShocks=n;else t.value=a.priorShocks;}
 if($('arrestModal').open)updateArrestClock();
});
document.addEventListener('input',e=>{if(e.target.dataset.arrestWeightValue!==undefined){state.arrest.weight=e.target.value;renderArrestDoses();}});
