/* Run: node tests/care.cjs. Clinical scoring boundary and documentation-safety tests.
 * Expected values transcribed independently from RCP NEWS2 and NZCPG 9.3 / 7.2.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const assets=fs.existsSync(path.join(__dirname,'../dist/index.html'))?path.join(__dirname,'../dist'):path.join(__dirname,'..');
const elements={};function element(){return {innerHTML:'',dataset:{},textContent:'',value:'',style:{},scrollTop:0,hidden:true,open:false,setAttribute(){},focus(){},querySelectorAll:()=>[],querySelector:()=>element(),addEventListener(){},showModal(){this.open=true;},close(){this.open=false;},classList:{add(){},remove(){},contains:()=>false}};}
const document={getElementById:id=>elements[id]||(elements[id]=element()),querySelectorAll:()=>[],querySelector:()=>element(),addEventListener(){}};
const context=vm.createContext({document,window:{addEventListener(){},scrollTo(){}},console,requestAnimationFrame(){},setInterval:()=>1});
for(const file of ['config.js','tour.js','clinical-data.js','ink.js','arrest.js','drug-guidance-data.js','drug-guidance-content.js','drug-guidance.js','care.js','app.js'])vm.runInContext(fs.readFileSync(path.join(assets,file),'utf8'),context);
const run=code=>vm.runInContext(code,context);let checks=0;
function check(ok,message){assert(ok,message);checks++;}
const normal={values:{rr:'16',spo2:'98',hr:'80',sbp:'120',dbp:'80',temp:'37',bgl:'5'},gcs:{eye:4,verbal:5,motor:6},oxygen:'Air',consciousness:'Alert',scale:'1',scale2Confirmed:false,eligibility:'Adult ≥16, not pregnant'};
function obs(changes={}){return {...normal,...changes,values:{...normal.values,...changes.values}};}
function news(d){return run(`news2(${JSON.stringify(d)})`);}
check(news(normal).total===0,'normal complete set is zero');
const boundaries={rr:[[0,3],[8,3],[9,1],[11,1],[12,0],[20,0],[21,2],[24,2],[25,3],[100,3]],spo2:[[0,3],[91,3],[92,2],[93,2],[94,1],[95,1],[96,0],[100,0]],hr:[[0,3],[40,3],[41,1],[50,1],[51,0],[90,0],[91,1],[110,1],[111,2],[130,2],[131,3],[300,3]],sbp:[[0,3],[90,3],[91,2],[100,2],[101,1],[110,1],[111,0],[219,0],[220,3],[350,3]],temp:[[0,3],[35,3],[35.1,1],[36,1],[36.1,0],[38,0],[38.1,1],[39,1],[39.1,2],[50,2]]};
for(const [key,pairs] of Object.entries(boundaries))for(const [value,score] of pairs)check(news(obs({values:{[key]:String(value)}})).points[key]===score,`${key} ${value} -> ${score}`);
for(const oxygen of ['Air','Oxygen'])for(const [s,air,o2] of [[83,3,3],[84,2,2],[85,2,2],[86,1,1],[87,1,1],[88,0,0],[92,0,0],[93,0,1],[94,0,1],[95,0,2],[96,0,2],[97,0,3],[100,0,3]])check(news(obs({values:{spo2:String(s)},oxygen,scale:'2',scale2Confirmed:true})).points.spo2===(oxygen==='Air'?air:o2),'scale 2 '+oxygen+' '+s);
check(news(obs({scale:'2',scale2Confirmed:false})).total===null,'scale 2 needs explicit authorisation');
check(news(obs({scale:'2',scale2Confirmed:true,oxygen:''})).points.spo2===null,'scale 2 needs oxygen status');
for(const c of ['New confusion','Voice','Pain','Unresponsive'])check(news(obs({consciousness:c})).points.consciousness===3,'ACVPU '+c);
check(news(obs({oxygen:'Oxygen'})).total===2,'oxygen uplift');
for(const key of ['rr','spo2','hr','sbp','temp'])check(news(obs({values:{[key]:''}})).total===null,'missing '+key+' never zero');
for(const field of ['oxygen','consciousness','eligibility'])check(news(obs({[field]:''})).total===null,'missing '+field);
check(news(obs({eligibility:'Not applicable'})).total===null,'no score when not applicable');
check(news(obs({gcs:{eye:4,verbal:5,motor:6},consciousness:''})).total===null,'GCS 15 does not imply Alert');
check(news(obs({values:{bgl:'',dbp:'80'},gcs:{}})).total===0,'GCS/BGL do not contribute');
check(news(obs({values:{rr:'25'}})).band==='single','single parameter 3 flagged');
check(news(obs({values:{rr:'21',spo2:'93'}})).total===4,'aggregate four');
check(news(obs({values:{rr:'21',spo2:'93',hr:'95'}})).total===5,'independent worked example');
check(news(obs({values:{rr:'21',spo2:'93',hr:'95'}})).band==='medium','five medium');
check(news(obs({values:{rr:'25',spo2:'91'}})).total===6,'six');
check(news(obs({values:{rr:'25',spo2:'91',hr:'95'}})).band==='high','seven high');
check(news(obs({values:{rr:'30',spo2:'80',hr:'140',sbp:'80',dbp:'40',temp:'34'},oxygen:'Oxygen',consciousness:'Unresponsive'})).total===20,'all highest components');
for(let e=1;e<=4;e++)for(let v=1;v<=5;v++)for(let m=1;m<=6;m++)check(run(`gcsTotal({eye:${e},verbal:${v},motor:${m}})`)===e+v+m,'GCS '+e+v+m);
for(const g of [{},{eye:4},{eye:4,verbal:5},{eye:4,verbal:'NT',motor:6},{eye:0,verbal:5,motor:6}])check(run(`gcsTotal(${JSON.stringify(g)})`)===null,'incomplete / NT GCS');
check(run('gcsText({eye:4,verbal:"NT",motor:6})').includes('VNT'),'NT retained');
check(run('numericVital("","rr")')===null,'empty is not zero');
check(run('numericVital("0","rr")')===0,'measured zero retained');
check(run('numericVital("37,5","temp")')===37.5,'comma handwriting conversion');
for(const [key,value] of [['rr','12x'],['hr','Infinity'],['spo2','101'],['temp','37.55'],['rr','12.5'],['bgl','-1']])check(Number.isNaN(run(`numericVital(${JSON.stringify(value)},${JSON.stringify(key)})`)),'reject invalid '+key+' '+value);
check(run(`vitalErrors(${JSON.stringify(obs({values:{sbp:'70',dbp:'80'}}))}).length>0`),'reject inverted BP');
check(run(`vitalErrors(${JSON.stringify(obs({values:{sbp:'80',dbp:'80'}}))}).length===0`),'equal BP allowed per request');
check(run(`vitalErrors(${JSON.stringify(obs({values:{dbp:''}}))}).length>0`),'pair BP values');
for(const [w,nmb] of [[50,100],[60,100],[70,150],[80,150],[90,200],[100,200],[150,200]]){const r=run(`rsiReference('${w}','Adult','')`);check(r.block===nmb,'adult NMB table '+w);check(r.ketamine===Math.min(w*2,200),'ketamine cap '+w);check(r.fentanyl===Math.min(w*2,200),'fentanyl cap '+w);}
check(run('rsiReference("20","Child","4").block')===40,'paediatric NMB not adult-rounded');
check(run('rsiReference("20","Child","8").tube').includes('5.5 mm'),'age-based cuffed tube');
check(run('rsiReference("5","Child","0.5").tube')==='3–4 mm cuffed','infant size range');
check(run('rsiReference("80","Adult","").tube').includes('Clinician selection'),'no invented adult weight-only tube');
for(const args of [['','Adult',''],['0','Adult',''],['NaN','Adult',''],['80','','']])check(run(`rsiReference(...${JSON.stringify(args)})`)===null,'reference requires valid weight/category');
run('state=emptyState();state.fields.guidelineUsed="Seizures"');check(run('priorityDrugs().slice(0,2).join(",")')==='Levetiracetam,Midazolam','guideline drugs first, alphabetical within group');
check(run('priorityDrugs("mid").join(",")')==='Midazolam','typed filter');
check(run('priorityDrugs("","RSI").slice(0,4).join(",")')==='Fentanyl,Ketamine,Rocuronium,Suxamethonium','RSI priority');
check(run('guidelineUsedPanel().includes("Seizures · Treatment")'),'selected treatment section');
run('state.fields.guidelineUsed="Burns"');check(run('guidelineUsedPanel().includes("Burns · Treatment")'),'burns treatment');
const before=run('JSON.stringify(state)');run('rsiReference("80","Adult","");guidelineUsedPanel();priorityDrugs()');check(run('JSON.stringify(state)')===before,'references never document actions');
run('eventDraft={...freshCareTime(),name:"Ketamine",kind:"drug",dose:"",unit:"",route:"",details:"",index:null};saveCareEvent()');
check(run('careEventsNote().includes("Dose not recorded")'),'unknown actual dose explicit');
check(!run('careEventsNote().includes("160 mg")'),'reference dose never assumed');
run('eventDraft={...freshCareTime(),name:"Ketamine",kind:"drug",dose:"20",unit:"",route:"IV",details:"",index:null}');check(!run('saveCareEvent()'),'dose needs unit');
run('eventDraft.unit="mg";saveCareEvent()');check(run('careEventsNote().includes("20 mg")'),'actual dose recorded');
run('state.casCall=true');check(run('buildNotes().Disposition.includes("CAS Call: Yes")'),'CAS checkbox output');
const notes=run('JSON.stringify(buildNotes())');run('learningEmailRequested=true');check(run('JSON.stringify(buildNotes())')===notes,'learning checkbox does not alter notes');
check(!run('JSON.stringify(state).includes("learningEmail")'),'learning placeholder excluded from patient export');
check(run('sections.join("|")').includes('Impression|Vitals & Interventions|Disposition'),'header insertion');
run(`vitalDraft={...${JSON.stringify(normal)},...freshCareTime(),index:null};saveVitalSet()`);check(run('state.vitalSets.length')===1,'explicit save adds set');
check(run('buildNotes()["Clinical Impression"].includes("NEWS2 0")'),'saved score in output');
run('vitalDraft={...freshCareTime(),values:{sbp:"70",dbp:"80"},gcs:{},oxygen:"",consciousness:"",scale:"1",eligibility:"",index:null}');check(!run('saveVitalSet()')&&run('state.vitalSets.length')===1,'invalid BP cannot enter saved notes');
console.log(`${checks} care scoring and documentation checks passed.`);
