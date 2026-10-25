/* Run with node tests/clinical-guidance.cjs. No dependencies or patient data.
 * DOM stubs test state-to-note safety and reference behaviour; browser QA checks UI.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
// Supports both the development dist/ layout and the root-layout GitHub package.
const assetRoot=fs.existsSync(path.join(__dirname,'../dist/index.html'))?path.join(__dirname,'../dist'):path.join(__dirname,'..');
const elements={};
function element(){const classes=new Set();return {innerHTML:'',dataset:{},textContent:'',value:'',style:{},scrollTop:0,hidden:true,addEventListener(){},setAttribute(){},focus(){},querySelectorAll:()=>[],classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}};}
const document={getElementById:id=>elements[id]||(elements[id]=element()),querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){}};
const context=vm.createContext({document,window:{addEventListener(){},scrollTo(){}},console,requestAnimationFrame(){},setInterval:()=>1});
for(const file of ['config.js','tour.js','clinical-data.js','ink.js','arrest.js','arrest-entry.js','arrest-checklists.js','drug-guidance-data.js','drug-guidance-content.js','drug-guidance.js','care.js','app.js'])vm.runInContext(fs.readFileSync(path.join(assetRoot,file),'utf8'),context);
const run=code=>vm.runInContext(code,context);
let checks=0;function check(condition,message){assert(condition,message);checks++;}
check(run('Object.values(state.fallsAssessment).every(x=>x==="Not assessed")'),'default states');
check(run('!state.fallsAssessmentConfirmed'),'no default confirmation');
check(run('Object.values(buildNotes()).every(x=>!x)'),'blank draft omits states');
const ids=['head_strike','anticoagulants','new_mobility','recurrent_falls'];
for(const id of ids)for(const state of ['Yes','No','Not assessed']){
 run('state=emptyState()');run(`setFallsAssessment(${JSON.stringify(id)},${JSON.stringify(state)})`);
 check(run(`state.fallsAssessment[${JSON.stringify(id)}]===${JSON.stringify(state)}`),id+' '+state);
 check(!run('buildNotes()["Clinical Impression"].includes("Falls assessment — clinician confirmed")'),'no automatic narrative');
 run('state.fallsAssessmentConfirmed=true');
 check(run(`confirmedFallsAssessmentNote().includes(FALLS_ASSESSMENT.items.find(x=>x.id===${JSON.stringify(id)}).label+": "+${JSON.stringify(state)})`),'explicit confirmed state');
 run(`setFallsAssessment(${JSON.stringify(id)},${JSON.stringify(state==='Yes'?'No':'Yes')})`);
 check(run('!state.fallsAssessmentConfirmed&&confirmedFallsAssessmentNote()===""'),'state edit revokes inclusion');
}
// Exhaust all 81 combinations; every Yes must produce its own simultaneous prompt.
for(let combination=0;combination<81;combination++){
 let n=combination;const values={};for(const id of ids){values[id]=['Yes','No','Not assessed'][n%3];n=Math.floor(n/3);}
 run(`state=emptyState();state.fallsAssessment=${JSON.stringify(values)}`);
 const markup=run('fallsAssessmentPrompts()');
 const titles=run('FALLS_ASSESSMENT.items.map(x=>({id:x.id,title:x.title}))');
 for(const f of titles)check(markup.includes(f.title)===(values[f.id]==='Yes'),'conditional prompt '+f.id);
 check(run('state.referrals.length===0&&!buildNotes().Disposition.includes("[[falls_referral]]")'),'no inferred referral');
 check(run('confirmedFallsAssessmentNote()===""'),'pending states excluded');
}
run('state=emptyState();state.fields.diagnosis="Other";state.fields.diagnosisOther="Uncertain cause";state.fields.diagnosisReason="Test reasoning";state.fields.disposition="Transported";state.fields.subjective="Entered text"');
const baseline=run('JSON.stringify(buildNotes())');
for(const topic of ['Myocardial ischaemia','Falls','Pulmonary Embolism (PE)','Ankle Injury']){
 run(`state.fields.dispositionGuidance=${JSON.stringify(topic)}`);
 check(run('clinicalTopic()')===topic,'guidance topic');
 check(run('JSON.stringify(buildNotes())')===baseline,'references do not change diagnosis/outcome/note');
 check(run('state.fields.disposition==="Transported"'),'transport outcome preserved');
}
run('state.fields.dispositionGuidance="Pulmonary Embolism (PE)"');
check(run('pePanel().includes("Clinical risk assessment")'),'PE heading');
check(run('pePanel().includes("low clinical pre-test probability")'),'PERC limitation');
check(run('pePanel().includes("D-dimer")'),'YEARS testing requirement');
const urls=[
 'https://www.mdcalc.com/calc/115/wells-criteria-pulmonary-embolism',
 'https://www.mdcalc.com/calc/347/perc-rule-pulmonary-embolism',
 'https://www.mdcalc.com/calc/4067/years-algorithm-for-pulmonary-embolism-pe',
 'https://www.mdcalc.com/calc/1670/ottawa-ankle-rule',
 'https://emergencycarebc.ca/clinical_resource/procedural-video/ottawa-ankle-rules/'
];
const html=run('pePanel()+anklePanel()');
for(const url of urls)check(html.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`),'new-tab resource '+url);
check(run('anklePanel().includes("Ottawa Ankle Rules")'),'ankle heading');
check(run('anklePanel().includes("four steps both immediately after injury")'),'two-timepoint weight bearing');
check(run('anklePanel().includes("does not establish a sprain")'),'rule limitation');
check(run('DIAGNOSIS.options.includes("Myocardial ischaemia")&&DIAGNOSIS.options.includes("Falls")'),'existing clinical options');
run('state=emptyState();addTreatmentEvent("aspirin");state.treatmentEvents[0].detail="300 mg";state.fields.dispositionGuidance="Ankle Injury"');
check(run('treatmentNote().includes("Aspirin PO: 300 mg")'),'existing treatment timeline preserved');
run('showHelp("SUBJECTIVE|Respiratory System (RS)")');check(!elements.helpResults.innerHTML.includes('<a'),'assessment links remain removed');
const draft=run('JSON.stringify(state)');run('showTour()');check(run('JSON.stringify(state)')===draft,'tour keeps draft');
console.log(`${checks} guidance safety and regression checks passed.`);
