/* Deterministic prototype tests. Fake clock exercises timing without real waits.
 * Digit fixtures are 100 isolated held-out MNIST examples; see model licence.
 * Passing these tests is not validation for clinical use or natural handwriting.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const assets=fs.existsSync(path.join(__dirname,'../dist/index.html'))?path.join(__dirname,'../dist'):path.join(__dirname,'..');
const elements={};function element(){const c=new Set();return {innerHTML:'',dataset:{},textContent:'',value:'',style:{},scrollTop:0,hidden:true,open:false,setAttribute(){},focus(){},querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},showModal(){this.open=true;},show(){this.open=true;},close(){this.open=false;},classList:{add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x),toggle(x,on){if(on===undefined)on=!c.has(x);on?c.add(x):c.delete(x);return on;}}};}
const document={getElementById:id=>elements[id]||(elements[id]=element()),querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){}};
const context=vm.createContext({document,window:{addEventListener(){},scrollTo(){}},console,requestAnimationFrame(){},setInterval:()=>1});
for(const file of ['config.js','tour.js','clinical-data.js','ink.js','arrest.js','arrest-entry.js','arrest-checklists.js','drug-guidance-data.js','drug-guidance-content.js','drug-guidance.js','care.js','app.js'])vm.runInContext(fs.readFileSync(path.join(assets,file),'utf8'),context);
const run=code=>vm.runInContext(code,context);let checks=0;function check(ok,msg){assert(ok,msg);checks++;}
// Independent expected age estimates from NZCPG EAS 7.2.
for(const [age,kg] of [[.1,5],[.5,5],[.99,5],[1,10],[2,12],[3,14],[4,16],[5,18],[6,20],[7,22],[8,24],[9,26],[10,28],[11,33],[12,36],[13,39],[14,42]])check(run(`estimateArrestWeight('${age}')`)===kg,'age estimate '+age);
for(const age of ['',0,-1,15,21,'bad',1.5,10.5])check(run(`estimateArrestWeight(${JSON.stringify(age)})`)===null,'no unsupported age extrapolation '+age);
for(const w of ['',0,-1,'abc','20kg',501,'1.55'])check(run(`validArrestWeight(${JSON.stringify(w)})`)===null,'reject weight '+w);
check(run('validArrestWeight("16,5")')===16.5,'decimal weight');
run('state=emptyState()');check(run('currentArrestDoseReference()')===null,'no recorded weight gives no card dose');
check(run('commitArrestWeight({weight:"16",group:"Child",source:"Estimated from age 4 years · CPG 7.2",age:"4"})'),'save explicit weight estimate');check(run('state.careEvents.length')===0,'weight reference does not imply treatment');check(run('state.arrest.weightSource.includes("Estimated")'),'estimate provenance retained');
check(run('currentArrestDoseReference().adrenaline')==='0.2 mg IV','16 kg uses 20 kg dose table');check(run('currentArrestDoseReference().amiodarone1')==='100 mg IV','16 kg first amiodarone');check(run('currentArrestDoseReference().amiodarone2')==='50 mg IV','16 kg second amiodarone');
run('commitArrestWeight({weight:"42",group:"Child",source:"Entered",age:"",adultDoseConfirmed:false})');check(run('currentArrestDoseReference()')===null,'child >40 requires confirmation');run('state.arrest.adultDoseConfirmed=true');check(run('currentArrestDoseReference().adrenaline')==='1 mg IV','explicit adult reference for >40 kg child');check(run('state.arrest.group')==='Child','adult reference does not relabel child');
run('commitArrestWeight({weight:"80",group:"Adult",source:"Entered",age:""})');check(run('currentArrestDoseReference().adrenaline')==='1 mg IV','adult reference');check(!run('commitArrestWeight({weight:"0",group:"Child"})'),'invalid weight cannot replace valid reference');check(run('state.arrest.weight')==='80','invalid entry leaves prior weight');
const date='2026-10-25T12:34';run('state=emptyState()');
function record(type,data,index=null){return run(`recordArrestIntervention(${JSON.stringify(type)},${JSON.stringify(data)},${JSON.stringify(date)},${index})`);}
for(const size of ['24','22','20','18','16']){const x=record('iv',{size,site:'Left AC',outcome:'Placed'});check(x.entry.details.includes(size+'G'),'IV gauge '+size);check(x.entry.arrestDetails.size===size,'structured IV gauge '+size);}
for(const size of ['Large','Medium','Small'])check(record('io',{size,outcome:'Placed'}).entry.details.includes(size),'IO size '+size);
for(const type of ['opa','npa','igel']){const size={opa:'00',npa:'7 mm',igel:'4'}[type],e=record(type,{size,outcome:'Placed'}).entry;check(e.arrestDetails.size===size,'actual airway size '+type);check(e.details.includes(size),'airway narrative '+type);}
for(const method of ['Video','Direct']){const e=record('laryngoscopy',{size:'3',method,blade:'Macintosh',view:'Grade IIb',outcome:'Attempted'}).entry;check(e.details.includes('Laryngoscopy: '+method),'laryngoscopy method '+method);check(e.details.includes('View: Grade IIb'),'actual view '+method);check(e.arrestDetails.blade==='Macintosh','structured blade '+method);}
const e=record('intubation',{size:'7.0',adjunct:'Bougie',lips:'22',confirmation:['Waveform capnography','Visualised through cords'],outcome:'Placed'}).entry;
for(const text of ['Tube size: 7.0 mm','Introducer: Bougie','Length at lips: 22 cm','Waveform capnography','Visualised through cords'])check(e.details.includes(text),'intubation actual '+text);
const missing=record('intubation',{}).entry;check(missing.details.includes('Size not recorded'),'size not assumed');check(missing.details.includes('Confirmation not recorded'),'confirmation not assumed');check(!missing.details.includes('Placed'),'successful placement not assumed');
const count=run('state.careEvents.length');for(const [type,data] of [['iv',{size:'14'}],['io',{size:'Huge'}],['intubation',{size:'0'}],['intubation',{size:'seven'}],['intubation',{size:'13'}],['intubation',{lips:'-2'}],['intubation',{lips:'0'}],['intubation',{lips:'22x'}],['unknown',{}]])check(record(type,data).errors?.length>0,'invalid actual entry '+type+JSON.stringify(data));check(run('state.careEvents.length')===count,'invalid entries do not log');
check(run('recordArrestIntervention("iv",{size:"18"},"invalid").errors.length>0'),'invalid timestamp not accepted');
const precisionAt='2026-10-25T12:34:56.789Z';
const priorEvents=run('JSON.stringify(state.careEvents)');
run('state=emptyState()');
const precise=run(`recordArrestIntervention('io',{size:'Small'},localDateTime(new Date('${precisionAt}')),null,'${precisionAt}')`).entry;
check(precise.at===precisionAt,'real-time seconds preserved');
const altered=run(`recordArrestIntervention('io',{size:'Medium'},localDateTime(new Date('2026-10-25T12:35:00Z')),0,'${precisionAt}')`).entry;
check(altered.at==='2026-10-25T12:35:00.000Z','edited retrospective minute overrides original seconds');
// Restore the prior fixture for existing edit assertions.
run('state.careEvents='+priorEvents);
const edited=record('iv',{size:'20',site:'Right hand',outcome:'Placed'},0).entry;check(run('state.careEvents.length')===count,'edit replaces one record');check(edited.details.includes('20G')&&edited.details.includes('Right hand'),'edit actual fields');check(run('careEventsNote().includes("Tube size: 7.0 mm")'),'structured intubation copied');
for(const outcome of ['Shock','No shock','ROSC']){
 run('state=emptyState();startArrestCycle(1000000)');
 const bad={outcome,rhythm:'',other:'',at:1120000};check(!run(`completeArrestRhythmCheck(${JSON.stringify(bad)},1125000)`),'rhythm required '+outcome);check(run('state.careEvents.length')===1,'no partial action before rhythm '+outcome);
 const rhythm=outcome==='Shock'?'VF':outcome==='No shock'?'Asystole':'Sinus rhythm';const d={outcome,rhythm,other:'',at:1120000};check(run(`completeArrestRhythmCheck(${JSON.stringify(d)},1125000)`),'commit '+outcome);check(run('state.arrest.rhythm')===rhythm,'rhythm saved '+outcome);
 check(run('arrestShockCount(state.arrest,state.careEvents)')===(outcome==='Shock'?1:0),'shock only if selected '+outcome);
 if(outcome==='ROSC'){check(run('state.arrest.phase')==='ROSC','ROSC phase');check(run('state.arrest.deadline')===null,'ROSC stops countdown');check(!run('arrestReminders(state.arrest,state.careEvents,1500000).adrenalineDue'),'ROSC stops dose prompt');check(run('state.arrest.sidebarTab')==='guidance','ROSC does not force checklist before offer');run('askPostRoscChecklist()');check(elements.arrestEntryModal.innerHTML.includes('Show checklist')&&elements.arrestEntryModal.innerHTML.includes('Not now'),'checklist offered after rhythm');}
 else {check(run('state.arrest.phase')==='Active','CPR timer active '+outcome);check(run('state.arrest.deadline')===1245000,'next deadline starts from explicit confirm '+outcome);check(run('state.arrest.cycles')===2,'next cycle counted '+outcome);}
}
run('state=emptyState();startArrestCycle(1000000);pauseArrestCycle(1120000)');check(run('arrestTiming(state.arrest,1120000).expired'),'expiry cannot become paused zero');run('updateArrestClock(1120000)');check(elements.arrestRhythmCheck.classList.contains('rhythm-due'),'end-of-cycle button highlighted');
for(const d of [{outcome:'Shock',rhythm:'Other',other:'',at:1},{outcome:'Shock',rhythm:'bad',at:1},{outcome:'bad',rhythm:'Asystole',at:1},{outcome:'Shock',rhythm:'VF / pulseless VT',at:2000000}])check(!run(`completeArrestRhythmCheck(${JSON.stringify(d)},1500000)`),'invalid rhythm/action rejected');
run('state=emptyState();startArrestCycle(1000000)');check(run('completeArrestRhythmCheck({outcome:"No shock",rhythm:"Other",other:"Paced rhythm",at:1120000},1120000)'),'Other can be explicitly described');check(run('state.careEvents.some(e=>e.details.includes("Paced rhythm"))'),'Other rhythm text retained');
run('renderArrest();openArrestTab("checklists")');for(const name of ['Arrest checklist','Post ROSC checklist','Preparation for RSI','RSI checklist'])check(elements.arrestSideContent.innerHTML.includes(name),'checklist moved into sidebar '+name);check(!elements.arrestModal.innerHTML.includes('arrest-links'),'no bottom checklist row');run('toggleArrestSidebar(false)');check(!run('state.arrest.sidebarOpen'),'sidebar can close');run('openArrestTab("log")');check(run('state.arrest.sidebarOpen'),'tab opens sidebar');check(elements.arrestSideContent.innerHTML.includes('Action log'),'log section');
run('state=emptyState();startArrestCycle(1000000);openCare("drug");eventDraft.name="Adrenaline";eventDraft.arrestId=state.arrest.id;eventDraft.arrestAction="arrest_other";saveCareEvent()');check(run('state.careEvents.at(-1).arrestAction')==='adrenaline','other-drug actual adrenaline enters reminder tracking');check(run('state.careEvents.at(-1).dose')==='','reference dose not copied');
// Outcome restrictions apply to rendering and to transaction validation.
check(run('JSON.stringify(arrestRhythmOptions("Shock"))')===JSON.stringify(['VF','VT','Torsades']),'only three shock rhythms');
for(const rhythm of ['VF','VT','Torsades','Asystole','PEA']){
 check(!run(`arrestRhythmOptions('ROSC').includes('${rhythm}')`),'ROSC excludes '+rhythm);
 check(!run(`completeArrestRhythmCheck({outcome:'ROSC',rhythm:'${rhythm}',at:100},200)`),'invalid ROSC rejected '+rhythm);
}
for(const rhythm of ['VF','VT']){run('state=emptyState();startArrestCycle(0);state.arrest.rhythm='+JSON.stringify(rhythm)+';state.arrest.priorShocks=3');check(run('arrestReminders(state.arrest,state.careEvents,5000).amiodaroneDue'),'amiodarone reminder with separate '+rhythm);}
for(const [weight,group,joules] of [[5,'Child',20],[16,'Child',64],[40,'Child',160],[40.1,'Adult',160.4],[50,'Adult',200],[200,'Adult',200],[500,'Adult',200]]){
 check(run(`autoArrestWeightGroup({weight:'${weight}',group:'Adult'})`)===group,'automatic group '+weight);
 check(run(`arrestJoules('${weight}')`)===joules,'capped joule reference '+weight);
}
check(run('arrestJoules("")')===null,'no joules with no weight');
run('state=emptyState();renderArrest()');check(elements.arrestModal.innerHTML.includes('>Checklists</button><button class="quiet" data-arrest-close>Notes'),'header checklists next to notes');
check(elements.arrestModal.innerHTML.includes('30s')&&elements.arrestModal.innerHTML.includes('15s'),'dial threshold markers');
check(!elements.arrestModal.innerHTML.includes('class="arrest-control-card paediatric-dose"'),'paediatric colour not whole card');
run('openArrestTab("guidelines")');for(const drug of ['Fentanyl','Ketamine','Rocuronium'])check(elements.arrestSideContent.innerHTML.toLowerCase().includes(drug.toLowerCase()),'RSI drug reference '+drug);
// Every checklist item is independently timestamped and can be unmarked without losing history.
run('state=emptyState()');const sizes=run('ARREST_CHECKLISTS.map(x=>[x.id,x.items.length])');
for(const [id,n] of sizes){for(let i=0;i<n;i++){
 const key=id+':'+i,at=1800000+i*1000;
 check(run(`!!toggleArrestChecklistItem('${key}',true,${at})`),'timestamp checklist '+key);
 check(run(`arrestChecklistStatus('${key}').at`)===new Date(at).toISOString(),'exact checklist time '+key);
 check(!run(`toggleArrestChecklistItem('${key}',true,${at+1})`),'duplicate tick ignored '+key);
}}
const checkedCount=run('state.careEvents.length');check(run('state.careEvents.every(e=>e.arrestAction==="checklist"&&!e.dose)'),'checklists never actual administrations');
check(run('arrestShockCount(state.arrest,state.careEvents)')===0,'checklists never shocks');
run('toggleArrestChecklistItem("arrest:0",false,2000000)');check(!run('arrestChecklistStatus("arrest:0").checklistChecked'),'uncheck clears completion');check(run('state.careEvents.length')===checkedCount+1,'uncheck retains history');check(run('careEventsNote().includes("Checklist")'),'checklist log in output');
run('state=emptyState()');check(run('arrestChecklistStatus("arrest:0")')===null,'new patient resets checklist');
for(const type of ['io','opa','igel','laryngoscopy']){run(`openArrestIntervention('${type}')`);check(elements.arrestEntryModal.innerHTML.includes('type="radio"'),'one-tap size '+type);check(!elements.arrestEntryModal.innerHTML.includes('checked>'),'no assumed size '+type);}
for(const type of ['npa','intubation']){run(`openArrestIntervention('${type}')`);check(elements.arrestEntryModal.innerHTML.includes('data-arrest-size-slider'),'size slider '+type);check(elements.arrestEntryModal.innerHTML.includes('name="size" value=""'),'size not assumed '+type);}
console.log(checks+' arrest workflow and documentation checks passed.');
