/* Persistent sidebar destinations. Switching areas never navigates the note
 * or opens/closes a drug entry. Each reference type keeps its reading state. */
const SIDEBAR_AREAS=[['records','Records','Vitals and interventions'],['assessment','Assessment','Assessment guidance'],['guideline','Guidelines','Guidelines'],['medicine','Medicines','Medicines'],['checklist','Checklists','Checklists']];
const sidebarReferenceViews={};
let sidebarLastPane='clinical';
let sidebarAssessmentMode='OBJECTIVE';
// Assessment changes presentation only; topic wording comes directly from GUIDANCE.
const sidebarBaseSearchHelp=searchHelp;
searchHelp=function(){
 const tabs=$('assessmentTabs'),root=$('helpResults');
 tabs.hidden=!guidanceAssessment;
 if(!guidanceAssessment){root.removeAttribute('role');root.removeAttribute('aria-labelledby');sidebarBaseSearchHelp();return;}
 if(['OBJECTIVE','SUBJECTIVE'].includes(guidanceMode))sidebarAssessmentMode=guidanceMode;
 guidanceMode=sidebarAssessmentMode;
 for(const b of document.querySelectorAll('[data-assessment-tab]')){
  const active=b.dataset.assessmentTab===sidebarAssessmentMode;
  b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;
 }
 root.setAttribute('role','tabpanel');
 root.setAttribute('aria-labelledby',sidebarAssessmentMode==='OBJECTIVE'?'assessmentObjectiveTab':'assessmentSubjectiveTab');
 const q=$('helpSearch').value.trim().toLowerCase();
 const results=Object.entries(GUIDANCE).filter(([key,paragraphs])=>key.startsWith(sidebarAssessmentMode+'|')&&(key+' '+paragraphs.join(' ')).toLowerCase().includes(q));
 root.innerHTML=results.map(([key,paragraphs])=>`<details class="assessment-topic"><summary>${esc(key.split('|')[1])}</summary><div class="helpblock">${paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div></details>`).join('')||'<p>No matching guidance.</p>';
};
// Search stays inside the selected assessment tab.
$('helpSearch').oninput=()=>{guidanceMode=guidanceAssessment?sidebarAssessmentMode:'';searchHelp();};
function sidebarSelectAssessment(mode){
 if(!['OBJECTIVE','SUBJECTIVE'].includes(mode))return;
 guidanceAssessment=true;guidanceMode=mode;searchHelp();$('guidancePane').scrollTop=0;
}
document.addEventListener('click',e=>{
 const tab=e.target.closest('[data-assessment-tab]');
 if(tab)sidebarSelectAssessment(tab.dataset.assessmentTab);
});
document.addEventListener('keydown',e=>{
 const tab=e.target.closest('[data-assessment-tab]');
 if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();
 const mode=e.key==='Home'?'OBJECTIVE':e.key==='End'?'SUBJECTIVE':tab.dataset.assessmentTab==='OBJECTIVE'?'SUBJECTIVE':'OBJECTIVE';
 sidebarSelectAssessment(mode);$(mode==='OBJECTIVE'?'assessmentObjectiveTab':'assessmentSubjectiveTab').focus();
});
function sidebarIcon(area){
 if(['guideline','medicine','checklist'].includes(area))return pilotTabIcon(area);
 const path=area==='records'?'<path d="M3 5h18v15H3zM3 10h18M9 5v15M3 15h18"/>':'<path d="M9 4h6v3H9zM9 5H5v16h14V5h-4M8 12h8M8 16h5"/>';
 return `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
}
function sidebarNavigationMarkup(){return `<div class="sidebar-navigation" role="group" aria-label="Sidebar areas">${SIDEBAR_AREAS.map(([area,label,title])=>`<button class="quiet sidebar-area" data-sidebar-area="${area}" aria-label="${title}" title="${title}" aria-pressed="false">${sidebarIcon(area)}<span>${label}</span></button>`).join('')}</div>`;}
function sidebarCurrentArea(){
 if(referencePane==='records')return 'records';
 if(referencePane==='guidance')return 'assessment';
 if(referencePane==='drug'){const id=$('drugGuidanceContent')?.querySelector('[data-pilot-source]')?.dataset.pilotSource;return PILOT_REFS.get(id)?.kind||'medicine';}
 if(referencePane==='clinical')return (PILOT_REFS.get(pilotView.id)||CPG_PILOT.referenceGroups?.[pilotView.id])?.kind||pilotView.kind||'guideline';
 return '';
}
function sidebarSync(){
 const active=sidebarCurrentArea();
 for(const b of document.querySelectorAll('[data-sidebar-area]'))b.setAttribute('aria-pressed',String(b.dataset.sidebarArea===active));
}
function sidebarRememberReference(){
 if(!['clinical','drug'].includes(referencePane))return;
 const pane=referencePane==='drug'?$('drugGuidanceContent'):$('diagnosisPane');
 if(!pane?.querySelector('[data-pilot-source], [data-pilot-home], .drug-cpg'))return;
 const view=pilotCapture();sidebarReferenceViews[view.kind]=view;
}
function sidebarOpenArea(area){
 sidebarRememberReference();
 if(area==='records'){showRecordedEntries();return;}
 if(area==='assessment'){
  if(!guidanceAssessment||!$('helpResults').querySelector('.assessment-topic')){guidanceMode=sidebarAssessmentMode;guidanceAssessment=true;searchHelp();}
  openReference('guidance');return;
 }
 if(!['guideline','medicine','checklist'].includes(area))return;
 if(['clinical','drug'].includes(referencePane)&&sidebarCurrentArea()===area){
  if(pilotView.id||referencePane==='drug'){const view={id:'',query:'',scope:'all',scroll:0,expanded:[],kind:area};pilotShow('',{restore:view});}
  return;
 }
 const view=sidebarReferenceViews[area]||{id:'',query:'',scope:'all',scroll:0,expanded:[],kind:area};
 pilotShow(view.id,{restore:{...view,expanded:[...view.expanded]},back:true});
}
const sidebarBaseOpen=openReference;
openReference=function(pane){
 if(referencePane!==pane)sidebarRememberReference();
 sidebarBaseOpen(pane);sidebarLastPane=pane;sidebarSync();
};
const sidebarBaseClose=closeReference;
closeReference=function(){sidebarRememberReference();sidebarBaseClose();sidebarSync();};
const sidebarBasePilotShow=pilotShow;
pilotShow=function(id,options){sidebarRememberReference();return sidebarBasePilotShow(id,options);};
const sidebarBaseShowSource=showRecordedSource;
showRecordedSource=function(id){if(PILOT_REFS.has(id))pilotShow(id);else sidebarBaseShowSource(id);};
// Capture the global arrows before the older contextual toggle handlers.
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.id==='toggleGuidance'||b.id==='closeReference'){
  e.preventDefault();e.stopImmediatePropagation();
  if(referencePane)closeReference();
  else if(sidebarLastPane==='clinical')sidebarOpenArea(pilotView.kind||'guideline');
  else if(sidebarLastPane==='records')sidebarOpenArea('records');
  else if(sidebarLastPane==='guidance')sidebarOpenArea('assessment');
  else openReference(sidebarLastPane);
 }else if(b.dataset.sidebarArea){e.preventDefault();sidebarOpenArea(b.dataset.sidebarArea);}
},true);
const sidebarDock=$('referenceDock');
if(sidebarDock?.insertAdjacentHTML&&!sidebarDock.querySelector('.sidebar-navigation'))sidebarDock.insertAdjacentHTML('afterbegin',sidebarNavigationMarkup());
sidebarSync();
