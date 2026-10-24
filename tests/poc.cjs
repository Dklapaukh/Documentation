/* Deterministic prototype tests. Fake clock exercises timing without real waits.
 * Digit fixtures are 100 isolated held-out MNIST examples; see model licence.
 * Passing these tests is not validation for clinical use or natural handwriting.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const assets=fs.existsSync(path.join(__dirname,'../dist/index.html'))?path.join(__dirname,'../dist'):path.join(__dirname,'..');
const elements={};function element(){const c=new Set();return {innerHTML:'',textContent:'',value:'',style:{},scrollTop:0,hidden:true,open:false,setAttribute(){},focus(){},querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},showModal(){this.open=true;},show(){this.open=true;},close(){this.open=false;},classList:{add:x=>c.add(x),remove:x=>c.delete(x),contains:x=>c.has(x),toggle(x,on){if(on===undefined)on=!c.has(x);on?c.add(x):c.delete(x);return on;}}};}
const document={getElementById:id=>elements[id]||(elements[id]=element()),querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){}};
const context=vm.createContext({document,window:{addEventListener(){},scrollTo(){}},console,requestAnimationFrame(){},setInterval:()=>1});
for(const file of ['config.js','tour.js','clinical-data.js','ink.js','arrest.js','care.js','app.js'])vm.runInContext(fs.readFileSync(path.join(assets,file),'utf8'),context);
const run=code=>vm.runInContext(code,context);let checks=0;function check(ok,msg){assert(ok,msg);checks++;}
run('openCare("vitals")');check(run('vitalDraft.oxygen')==='Air','prototype air default');check(run('vitalDraft.consciousness')==='From GCS','prototype GCS mode');check(run('vitalDraft.assumptions.length')===3,'assumptions explicit');check(run('news2(vitalDraft).total')===null,'default context cannot fabricate missing vitals');
for(const [gcs,score] of [[3,3],[8,3],[13,3],[14,3],[15,0]]){run(`vitalDraft.values.gcs=${gcs}`);check(run('news2(vitalDraft).points.consciousness')===score,'GCS proxy '+gcs);check(run('news2(vitalDraft).consciousnessInferred'),'proxy labelled');}
run('vitalDraft.gcs={eye:4,verbal:"NT",motor:6};vitalDraft.values.gcs=15');check(run('news2(vitalDraft).points.consciousness')===null,'NT blocks inferred LOC');
run('vitalDraft.gcs={};vitalDraft.values.gcs=13;vitalDraft.consciousness="Alert"');check(run('news2(vitalDraft).points.consciousness')===0,'explicit LOC overrides proxy');check(!run('news2(vitalDraft).consciousnessInferred'),'override not labelled inferred');
run('vitalDraft.values.rr="17";vitalDraft.ink={rr:[[[.2,.2],[.2,.8]]]};stashCareDraft();openCare("vitals")');check(run('vitalDraft.values.rr')==='17','header navigation preserves reading');check(run('vitalDraft.ink.rr.length')===1,'header navigation preserves ink');
run('clearCareDrafts()');check(!run('hasUnsavedCare()'),'reset clears unrecorded drafts');
run('openCare("procedure");eventDraft.name="Ketamine";eventDraft.dose="100";eventDraft.unit="mg";eventDraft.route="IV";eventDraft.details="old notes"');const time=run('eventDraft.local');run('chooseProcedureEntry("drug","Fentanyl")');check(run('eventDraft.name')==='Fentanyl','quick selection changes name');check(run('[eventDraft.dose,eventDraft.unit,eventDraft.route,eventDraft.details].every(x=>x==="")'),'different selection clears all actual fields');check(run('eventDraft.local')===time,'selection retains timestamp');
run('eventDraft.dose="10";chooseProcedureEntry("drug","Fentanyl")');check(run('eventDraft.dose')==='10','same selection retained');run('chooseProcedureEntry("intervention","Preoxygenation")');check(run('eventDraft.dose')==='','intervention clears drug amount');
check(elements.careModal.innerHTML.includes('procedure-reference'),'distinct reference sidebar');check(elements.careModal.innerHTML.includes('round-record'),'round record action');check(elements.careModal.innerHTML.indexOf('care-modal-bottom')>elements.careModal.innerHTML.indexOf('event-entry'),'record footer follows entry');check(run('eventEntryMarkup().includes(">Notes<textarea")'),'notes label');
const a={id:'test',phase:'Active',startedAt:1000000,endedAt:null,deadline:1120000,remainingMs:120000,cycles:1,rhythm:'VF / pulseless VT',priorShocks:0,priorAmiodarone:0,group:'Adult',weight:'80',special:false};
function timing(change,now){return run(`arrestTiming(${JSON.stringify({...a,...change})},${now})`);}
check(timing({},1000000).seconds===120,'full two-minute cycle');check(!timing({},1104999).charge,'not early at >15 seconds');check(timing({},1105000).seconds===15&&timing({},1105000).charge,'charge at 15 seconds');check(timing({},1119999).charge,'charge through last second');check(timing({},1120000).expired&&!timing({},1120000).charge,'expiry asks rhythm check');check(timing({},1700000).seconds===0,'background catch-up without negative timer');
for(const rhythm of ['PEA','Asystole','Torsades','Not set'])check(timing({rhythm},1105000).charge,'preparation cue independent of rhythm '+rhythm);
check(!timing({special:true},1105000).charge,'special case suppresses charge');check(!timing({phase:'ROSC'},1105000).charge,'ROSC suppresses charge');
const med=(name,when)=>({arrestId:'test',arrestAction:name.toLowerCase(),name,at:new Date(when).toISOString(),kind:'drug',dose:'',unit:'',route:'',details:''});
function reminders(change={},events=[],now=1000000){return run(`arrestReminders(${JSON.stringify({...a,...change})},${JSON.stringify(events)},${now})`);}
check(!reminders().adrenalineDue&&reminders().adrenalineRemaining===null,'no inferred pre-arrival dose time');
const adr=[med('Adrenaline',1000000)];check(!reminders({},adr,1239999).adrenalineDue,'before four minutes');check(reminders({},adr,1240000).adrenalineDue,'four-minute review due');check(reminders({},adr,1500000).adrenalineDue,'late timer remains overdue');check(reminders({},adr,999999).futureDrugTime,'future drug timestamp flagged');
const adr2=[...adr,med('Adrenaline',1250000)];check(reminders({},adr2,1250000).adrenalineRemaining===240000,'repeat resets from actual timestamp');
for(const phase of ['ROSC','Ended','Ready'])check(!reminders({phase},adr,1500000).adrenalineDue,'inactive phase '+phase);check(!reminders({special:true},adr,1500000).adrenalineDue,'special situation disables medicine prompt');
for(let shocks=0;shocks<=8;shocks++){
 check(reminders({priorShocks:shocks}).amiodaroneDue===(shocks>=3),'first amiodarone shock threshold '+shocks);
 check(reminders({priorShocks:shocks},[med('Amiodarone',1000000)]).amiodaroneDue===(shocks>=6),'second amiodarone shock threshold '+shocks);
 check(!reminders({priorShocks:shocks},[med('Amiodarone',1000000),med('Amiodarone',1100000)]).amiodaroneDue,'no inferred third amiodarone '+shocks);
}
for(const rhythm of ['PEA','Asystole','Torsades','Not set'])check(!reminders({rhythm,priorShocks:8}).amiodaroneDue,'rhythm gate '+rhythm);
check(reminders({priorShocks:2},[{arrestId:'test',arrestAction:'shock',name:'Defibrillation'}]).shocks===3,'prior shocks included');check(!reminders({},[{arrestId:'another-case',arrestAction:'shock',name:'Defibrillation'}]).amiodaroneDue,'different case excluded');
check(run('arrestDoseReference("Adult","80").shock').includes('Maximum setting'),'adult energy device-dependent');
for(const [weight,band,adrenaline,amio1,amio2,energy] of [[5,5,.05,25,12.5,'20–25 J'],[6,10,.1,50,25,'40–50 J'],[12,20,.2,100,50,'80–100 J'],[25,30,.3,150,75,'120–150 J'],[35,40,.4,200,100,'160–200 J']]){
 const d=run(`arrestDoseReference('Child','${weight}')`);check(d.label.includes(band+' kg'),'CPG band '+weight);check(d.adrenaline===adrenaline+' mg IV','adrenaline table '+weight);check(d.amiodarone1===amio1+' mg IV'&&d.amiodarone2===amio2+' mg IV','amiodarone table '+weight);check(d.shock===energy,'joule range '+weight);
}
for(const weight of ['',0,-1,41,'bad'])check(run(`arrestDoseReference('Child',${JSON.stringify(weight)})`)===null,'no invented paediatric values '+weight);
run('state=emptyState();startArrestCycle(1000000);pauseArrestCycle(1050000)');check(run('state.arrest.remainingMs')===70000,'pause preserves remaining milliseconds');run('pauseArrestCycle(1100000)');check(run('state.arrest.deadline')===1170000,'resume without drift');
const before=run('state.careEvents.length');run('arrestDoseReference("Adult","80")');check(run('state.careEvents.length')===before,'reference does not log administration');run('arrestStamp("adrenaline",1110000)');check(run('state.careEvents.at(-1).dose')==='','timestamp never assumes reference dose');check(run('careEventsNote().includes("Dose not recorded")'),'unknown actual dose explicit');
run('stopArrest("ROSC",1120000)');check(run('state.arrest.phase')==='ROSC'&&run('state.arrest.deadline')===null,'ROSC stops cycle');check(!run('arrestReminders(state.arrest,state.careEvents,1500000).adrenalineDue'),'ROSC stops dose prompts');
// Validate the shipped numerical model, not just Python training output.
const data=fs.readFileSync(path.join(assets,'ink-model.bin'));context.modelBuffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);run('const testInkModel=decodeInkModel(modelBuffer)');
const samples=fs.readFileSync(path.join(__dirname,'fixtures/mnist-digits.bin'));let right=0;
for(let i=0;i<samples.length;i+=785){context.testPixels=Float32Array.from(samples.subarray(i+1,i+785),v=>v/255);const r=run('classifyInkDigit(testPixels,testInkModel)');if(r.digit===samples[i])right++;check(r.confidence>=0&&r.confidence<=1,'digit probability bounds');}
check(right>=90,`isolated MNIST smoke test ${right}/100`);
// Disconnected decimal below the previous digit remains a separate component.
const mask=new Uint8Array(30*20);for(let y=2;y<16;y++)for(let x=3;x<6;x++)mask[y*30+x]=1;for(let y=16;y<18;y++)for(let x=7;x<9;x++)mask[y*30+x]=1;for(let y=2;y<16;y++)for(let x=14;x<17;x++)mask[y*30+x]=1;context.testMask=mask;const groups=run('segmentInkMask(testMask,30,20)');check(groups.length===3&&groups[1].h===2,'decimal segmentation');
console.log(`${checks} paper-entry / arrest checks passed; isolated digit fixture ${right}/100 (not handwriting validation).`);
