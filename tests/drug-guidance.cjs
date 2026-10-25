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
for(const name of run('DRUG_NAMES')){
 const refs=run(`DRUG_GUIDELINES[${JSON.stringify(name)}]`);check(refs?.length>0,'reference for '+name);
 for(const ref of refs){check(fs.existsSync(path.join(assets,ref.pdf)),'packaged PDF '+ref.code);check(ref.url.startsWith('https://cpg.stjohn.org.nz/tabs/'),'official source '+name);}
}
check(run('drugReferenceName(" fentanyl ")')==='Fentanyl','exact case-insensitive catalogue lookup');check(run('drugReferenceName("fent")')==='','no partial guideline guess');check(run('drugReferenceName("custom drug")')==='','no custom guideline guess');
check(run('repeatOptions("Fentanyl","IV")[0].minutes')===5,'fentanyl IV five');check(run('repeatOptions("Fentanyl","IN")[0].minutes')===20,'fentanyl IN twenty');check(run('repeatOptions("Fentanyl","IM")[0].label.includes("maximum three doses")'),'limit visible');
check(run('repeatOptions("Aspirin","PO").length')===0,'no invented aspirin repeat');check(run('repeatOptions("Amiodarone","IV").length')===0,'no stale timed amiodarone repeat');check(run('repeatOptions("Fentanyl","").length')===0,'route required');check(run('repeatOptions("Fentanyl","PO").length')===0,'wrong route excluded');
const record={kind:'drug',name:'Fentanyl',route:'IV',at:new Date(1000000).toISOString(),repeatReminder:run('repeatOptions("Fentanyl","IV")[0]')};
function due(change,now){return run(`repeatDue(${JSON.stringify({...record,...change})},${now})`);}
check(!due({},1299999).overdue,'not early');check(due({},1300000).overdue,'exact deadline');check(due({},1900000).overdue,'background catch-up');check(!due({},999999).overdue,'future administration does not alert early');check(due({at:'invalid'},1900000)===null,'invalid timestamp rejected');check(due({repeatDismissed:true},1900000)===null,'dismissed one-shot');check(due({repeatReminder:null},1900000)===null,'default off');check(due({route:'IM'},1900000)===null,'stale route rejected');check(due({name:'Aspirin'},1900000)===null,'stale drug rejected');check(due({kind:'intervention'},1900000)===null,'interventions excluded');
run('state=emptyState();openCare("drug");eventDraft.name="Fentanyl";eventDraft.route="IV";eventDraft.repeatReminder={...repeatOptions("Fentanyl","IV")[0]};eventDraft.repeatPanel=true;eventDraft.local="2026-10-25T12:00";eventDraft.details="Synthetic note";saveCareEvent()');
check(run('state.careEvents.length')===1,'explicit save logs one event');check(run('state.careEvents[0].repeatReminder.minutes')===5,'opt-in stored');check(!run('"repeatPanel" in state.careEvents[0]'),'view state not saved');check(run('state.careEvents[0].dose')==='','no dose assumption');check(!run('careEventsNote().includes("repeat review")'),'reminder not clinical finding');check(!run('careEventsNote().includes("allergies")'),'allergies placeholder not clinical finding');
run('state.fields.background="Allergy: penicillin";openCare("drug");eventDraft.name="Fentanyl";updateDrugGuidance(true)');check(elements.drugGuidanceContent.innerHTML.includes('Allergy: penicillin'),'background available verbatim');check(elements.drugGuidanceContent.innerHTML.includes('Not separately recorded'),'not recorded distinguished from negative');check(elements.drugGuidanceContent.innerHTML.includes('IV bolus for analgesia:'),'inline source dose');
run('eventDraft.name="Aspirin";updateDrugGuidance(true)');check(!elements.drugGuidanceContent.innerHTML.includes('IV bolus for analgesia:'),'changing drug replaces reference');
run('state=emptyState();updateRepeatNotifications(1900000)');check(elements.repeatNotifications.hidden,'reset clears active alerts');
const app=fs.readFileSync(path.join(assets,'app.js'),'utf8');check(app.includes("t.dataset.field==='disposition'&&isNonTransport())openNonTransportChecklist()"),'non-transport opens checklist');check(fs.existsSync(path.join(assets,'cpg-non-transport.pdf')),'checklist packaged');
console.log(checks+' drug guidance, repeat reminder and non-transport checks passed.');
