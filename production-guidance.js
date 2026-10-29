/* Production reference scope: the three specialised version-16 interfaces.
 * This file does not load a catalogue, PDF or extracted guideline body.
 * General documentation, care entry and arrest tools remain independent.
 */
const PRODUCTION_GUIDELINES=['Myocardial ischaemia','Falls','Ankle Injury'];
const GUIDELINE_ALIASES={'cpg-eas-3-2':'Myocardial ischaemia','cpg-eas-13-3':'Falls','Ankle fracture':'Ankle Injury'};
function productionGuideline(value){return GUIDELINE_ALIASES[value]||value;}
GUIDELINE_TITLES.splice(0,GUIDELINE_TITLES.length,...PRODUCTION_GUIDELINES);
selectedGuidelines=function(){return [...new Set([...(state.guidelines||[]),v('guidelineUsed')].map(productionGuideline))].filter(n=>PRODUCTION_GUIDELINES.includes(n));};
activeGuidelineName=function(){const active=productionGuideline(state.activeGuideline),selected=selectedGuidelines();return selected.includes(active)?active:selected[0]||'';};
ensureGuideline=function(value){const name=productionGuideline(value);if(!PRODUCTION_GUIDELINES.includes(name))return;state.guidelines=selectedGuidelines();if(!state.guidelines.includes(name))state.guidelines.push(name);state.activeGuideline=name;state.fields.guidelineUsed='';};
matchingGuidelines=function(query=''){const q=query.toLowerCase().trim();return PRODUCTION_GUIDELINES.filter(n=>n.toLowerCase().includes(q)||(n==='Ankle Injury'&&'ankle fracture ottawa'.includes(q))||(n==='Myocardial ischaemia'&&['mi','acs','3.2'].includes(q))||(n==='Falls'&&q==='13.3'));};
selectedGuidelinePanels=function(){const selected=selectedGuidelines(),active=activeGuidelineName();if(!selected.length)return '';return `<nav class="guideline-cards" aria-label="Selected guidelines">${selected.map(n=>`<button data-guideline-tab="${esc(n)}" aria-pressed="${n===active}">${esc(n)}</button>`).join('')}</nav>`+(active==='Myocardial ischaemia'?myocardialPanel():active==='Falls'?fallsPanel():anklePanel());};
diagnosisPanels=function(){return selectedGuidelinePanels();};
// Only the requested guidance functions are exposed. Preserve ordinary free text.
peReminderMatches=function(){return false;};peReminderPanel=function(){return '';};peReminderLauncher=function(){return '';};
matchingCpgs=function(text){return LOCAL.cpgs.filter(c=>c.id==='cardiac'&&c.words.some(w=>new RegExp('(^|[^a-z])'+w+'([^a-z]|$)','i').test(text)));};
// Medicine selection uses the shared contextual reference viewer in care-layout.
// Keep the general guideline picker restricted to the three v16 interfaces.
// Non-transport documentation fields stay available without the extra CPG checklist.
openNonTransportChecklist=function(){renderClinicalPane();if(selectedGuidelines().length)openReference('clinical');};
function openCompactGuidance(){renderClinicalPane();if(selectedGuidelines().length){openReference('clinical');return;}const pane=$('diagnosisPane');pane.innerHTML='<h2>Clinical guidance</h2>'+PRODUCTION_GUIDELINES.map(n=>`<button class="quiet reference-link" data-compact-guidance="${n}">${n}</button>`).join('');openReference('clinical');}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.openCompactGuidance!==undefined)openCompactGuidance();if(b.dataset.compactGuidance){ensureGuideline(b.dataset.compactGuidance);changed();render();renderClinicalPane();openReference('clinical');}});
// Keep copied records current after changes in version-16 timestamp controls.
document.addEventListener('change',e=>{if(e.target.dataset.event!==undefined&&referencePane==='records')showRecordedEntries();});
// Explanation follows the deployed reference scope, rather than source-only tools.
for(let i=APP_TOUR.length-1;i>=0;i--)if(APP_TOUR[i].short==='PE prompt')APP_TOUR.splice(i,1);
const compactTour=APP_TOUR.find(s=>s.short==='Guideline Used');if(compactTour)Object.assign(compactTour,{left:['Myocardial ischaemia','Falls','Ankle Injury'],right:['Select one or more','Read beside the note','Record explicit findings / actions'],description:'Guidelines used offers Myocardial ischaemia, Falls and Ankle Injury. These are the version 16 specialised interfaces. Myocardial treatment steps have editable timestamps. Falls has red/orange flags and separate Yes / No / Not assessed findings; confirm findings before including them in the note. Ankle Injury links to Ottawa Ankle Rules resources. The full NZCPG catalogue and files are retained in source only.'});
const resourceTour=APP_TOUR.find(s=>s.short==='Resources');if(resourceTour)Object.assign(resourceTour,{left:['Ankle Injury','Text / clinical criteria','Instructional video'],right:['External resources','Open in a new tab','Documentation stays in place'],description:'The version 16 ankle guidance provides Ottawa Ankle Rules text and video links, criteria and limitations. No rule or disposition is calculated in the app.'});
