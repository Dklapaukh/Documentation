/* Dependency-free regression checks for the explicitly requested keyword prompt.
 * Clinical accuracy is not established by these software tests.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const assets=fs.existsSync(path.join(__dirname,'../dist/index.html'))?path.join(__dirname,'../dist'):path.join(__dirname,'..');
const elements={};function element(){return {innerHTML:'',textContent:'',value:'',style:{},scrollTop:0,hidden:true,addEventListener(){},setAttribute(){},focus(){},querySelectorAll:()=>[],classList:{add(){},remove(){},contains:()=>false}};}
const document={getElementById:id=>elements[id]||(elements[id]=element()),querySelectorAll:()=>[],querySelector:()=>element(),addEventListener(){}};
const context=vm.createContext({document,window:{addEventListener(){},scrollTo(){}},console,requestAnimationFrame(){}});
for(const file of ['config.js','tour.js','clinical-data.js','ink.js','arrest.js','care.js','app.js'])vm.runInContext(fs.readFileSync(path.join(assets,file),'utf8'),context);
const run=code=>vm.runInContext(code,context);let checks=0;
function check(condition,message){assert(condition,message);checks++;}
function assessment(subjective='',objective=''){run(`state=emptyState();state.fields.subjective=${JSON.stringify(subjective)};state.fields.objective=${JSON.stringify(objective)}`);}
check(!run('peReminderMatches()'),'blank assessment');
// All eight complete/incomplete combinations: no single finding or pair suffices.
for(let mask=0;mask<8;mask++){
 assessment(['tachycardia','hypotension','hypoxia'].filter((_,i)=>mask&(1<<i)).join('. '));
 check(run('peReminderMatches()')===(mask===7),'three terms required '+mask);
}
for(const lowBp of ['hypotension','hyootension'])for(const oxygen of ['hypoxia','hyoxia','hypoxaemia','hypoxemia']){
 assessment('TACHYCARDIA',`${lowBp}. ${oxygen}.`);
 check(run('peReminderMatches()'),'spelling + split fields');
 const before=run('JSON.stringify(state)');run('peReminderPanel();peReminderLauncher();renderTour()');
 check(run('JSON.stringify(state)')===before,'no inferred patient entries');
 check(!run('buildNotes()["Clinical Impression"].includes("Pulmonary Embolism")'),'suggestion excluded from notes');
}
for(const phrase of ['no tachycardia','tachycardia absent','tachycardia not assessed','without tachycardia','denies tachycardia','previous tachycardia','history of tachycardia','possible tachycardia','query tachycardia','tachycardia?','rule out tachycardia','risk of tachycardia','if tachycardia','check for tachycardia']){
 assessment(phrase,'hypotension. hypoxia');check(!run('peReminderMatches()'),'exclude non-affirmed phrase '+phrase);
}
for(const phrase of ['no hypotension or hypoxia','hypotension and hypoxia not assessed','denies hypotension, hypoxia']){
 assessment('tachycardia',phrase);check(!run('peReminderMatches()'),'negated lists stay negated');
}
assessment('tachycardia','hypotension. no hypoxia');check(!run('peReminderMatches()'),'negative hypoxia');
assessment('tachycardia','hypotension. hypoxia');check(run('peReminderMatches()'),'positive hypoxia');
run('state.fields.objective="hypotension"');check(!run('peReminderMatches()'),'deletion removes match');
assessment();run('state.fields.hpc="tachycardia hypotension hypoxia";state.fields.treatment="tachycardia hypotension hypoxia"');check(!run('peReminderMatches()'),'other sections excluded');
assessment('tachycardiac hypotensions hypoxias');check(!run('peReminderMatches()'),'whole words only');
assessment('HR 130, BP 80/40, SpO2 85%');check(!run('peReminderMatches()'),'no inference from numerical observations');
assessment('tachycardia','hypotension. hypoxia');
check(run('peReminderPanel().includes("not a validated rule")'),'transparent limitation');
run('state.differentials.push({diagnosis:"PE",reasoning:""})');check(run('peAlreadyRecorded()'),'prevent duplicate PE');
run('state.differentials=[];state.fields.diagnosis="Pulmonary Embolism (PE)"');check(run('peAlreadyRecorded()'),'recognise provisional PE');
check(run('reasoningErrors().length>0'),'clinician reasoning still required');
check(run('APP_TOUR.length===18'),'comprehensive walkthrough');
const draft=run('JSON.stringify(state)');
for(let i=0;i<18;i++){
 run(`tourStep=${i};renderTour()`);
 check(elements.explainContent.innerHTML.includes('tourDemo'),'animated demo '+i);
 check(elements.explainContent.innerHTML.includes('tourReplay')&&elements.explainContent.innerHTML.includes('tourPause'),'playback controls '+i);
}
check(run('JSON.stringify(state)')===draft,'all demos preserve draft');
check(fs.readFileSync(path.join(assets,'styles.css'),'utf8').includes('@media(prefers-reduced-motion:reduce)'),'reduced motion');
console.log(`${checks} PE reminder and walkthrough checks passed.`);
