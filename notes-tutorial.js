/* Read-only, shared Notes / Pocket Resus tutorial.
 * All examples are fixed illustrations. No example calls a clinical action,
 * changes a case, starts a timer, or records a treatment. Edit the content below.
 */
const NOTES_TUTORIAL=[
 {id:'checkboxes',group:'Documentation',title:'Tick once. Keep useful data.',action:'Use complaint, social-history and pathway checkboxes for quick, consistent entries.',note:'Selected choices remain structured in the JSON export for later analysis. Blank and Not assessed are different from No. The app does not upload or analyse patient data.',visual:'checks'},
 {id:'guidance',group:'Documentation',title:'Keep guidance beside your note.',action:'Tap the header arrow from any screen. Read or search guidance while keeping your entry open.',note:'The arrow at the sidebar’s top-left expands it to full screen. Restore or collapse it to continue. Vitals, GCS and entry drafts stay in place.',visual:'guidance'},
 {id:'prompts',group:'Documentation',title:'See prompts when findings matter.',action:'In Falls, select Yes, No or Not assessed for the four assessment findings.',note:'Head strike and anticoagulant use surface review prompts. Recurrent falls highlights referral criteria. Several findings can show several prompts. These do not determine disposition; confirm findings before adding them to the note.',visual:'prompts'},
 {id:'guidelines',group:'Documentation',title:'Read a guideline. Timestamp an action.',action:'Search Guidelines used and select one or more references. In Myocardial ischaemia, tap + Time for an action performed.',note:'Edit the time and actual details, or record a repeat. Removing a guideline preserves its recorded actions. The deployed choices are Myocardial ischaemia, Falls and Ankle Injury; viewing a reference never records care.',visual:'guidelines'},
 {id:'rapid-entry',group:'Documentation',title:'Record treatment with fewer taps.',action:'Tap or type in the drug picker. Use ↓ then Enter or Tab to select; focus moves to Dose.',note:'Enter the actual dose. Route and unit are editable defaults. IV cannulation opens below the add cards. Airway/access controls use sizes and toggles; Pocket Resus also offers Record Laryngoscopy and add Intubation. The next form remains unrecorded until confirmed.',visual:'entry'},
 {id:'vitals',group:'Documentation',title:'Enter only the vitals you have.',action:'Use Enter, Tab or the arrow keys to move through the table. Touch-screen mode opens handwriting entry.',note:'Every vital is optional. Review recognised numbers before Save. Temp and BGL accept Hi/Low. Missing scoring inputs leave NEWS incomplete. Double-tap a recorded value to edit that observation set.',visual:'vitals'},
 {id:'flags',group:'Documentation',title:'Work through the flag tables.',action:'Open Falls and select the relevant findings in its red and orange tables.',note:'The colours keep the warning groups distinct. An unticked finding is not documented as absent. Separate Yes / No / Not assessed controls retain that distinction; flags do not establish referral eligibility.',visual:'flags'},
 {id:'referrals',group:'Documentation',title:'Leave a searchable referral stamp.',action:'In Disposition → Request referrals, select the referral you are requesting.',note:'Falls adds [[falls_referral]] to the generated note and stays in the structured export. Recurrent falls highlights the pathway for review. A checkbox documents the request; it does not send a referral.',visual:'referral'},
 {id:'copy',group:'Documentation',title:'Review. Copy. Paste into ePRF.',action:'Open Output, review the generated sections, then Copy a section or Copy all.',note:'Your confirmed entries become editable text. JSON retains structured data. Unrecorded drafts stay out of the note. This Notes tab clears on refresh or close; the learning-version email checkbox is inactive.',visual:'copy'},
 {id:'arrest-cycle',group:'Pocket Resus',title:'Keep the two-minute cycle visible.',action:'Open Cardiac arrest and Start CPR. At zero, choose Rhythm check, then Shock, No shock or ROSC.',note:'Shock / No shock starts the next cycle immediately; select the observed rhythm next. ROSC stops the arrest cycle and opens the post-ROSC checklist. Expiry alone records no treatment. The visual cue is not an indication to shock.',visual:'cycle'},
 {id:'arrest-weight',group:'Pocket Resus',title:'Separate references from administrations.',action:'Enter Pt weight for dose and energy references, or use the age-estimate option. Administration opens guidance beside the timer.',note:'Recording a medicine card confirms its displayed dose and route. Other… opens actual dose, route and time entry. Review clocks follow recorded administrations. Guidance also contains RSI and tube-size references; reading a dose does not record it.',visual:'weight'},
 {id:'arrest-support',group:'Pocket Resus',title:'Keep rhythm-related guidance in view.',action:'Recorded rhythms update the support card: PEA shows fluids; torsades history shows magnesium guidance.',note:'Review the reference and record only what occurred. Fluid entry asks for actual volume. A magnesium repeat requires confirmation. Changing cards does not administer or record a medicine.',visual:'support'},
 {id:'arrest-checklists',group:'Pocket Resus',title:'Timestamp the checklist review.',action:'Use the sidebar’s Checklists tab for arrest, post-ROSC, preparation for RSI and RSI. Guidance groups the reversible causes.',note:'Ticks record review times, not interventions. The arrest checklist highlights amber after adrenaline when at least 90 seconds remain in the cycle. Guidance, Action log, Guidelines and Checklists stay beside the timer or expand full screen.',visual:'checklist'},
 {id:'arrest-log',group:'Pocket Resus',title:'Review earlier care and export your view.',action:'Use + Previous shock for shocks before opening the app. In Action log, add the missing time/details and correct entries as needed.',note:'Filter Interventions only, or show checklist Start & finish only. Text export follows those filters; complete JSON retains the audit history. Undo reverses the last action. Pre-app shocks retain an unknown time until edited and do not restart the timer.',visual:'log'}
];

// Small visual vocabulary keeps illustrations consistent and easy to maintain.
function tutorialExample(kind){
 const row=(text,cue=false,extra='')=>`<div class="pn-example-row ${cue?'pn-cue':''} ${extra}">${text}</div>`;
 const tick=text=>`<span class="pn-example-tick">✓</span>${text}`;
 const field=(label,value='—')=>`<div class="pn-example-field"><small>${label}</small><b>${value}</b></div>`;
 const button=text=>`<span class="pn-example-button">${text}</span>`;
 const scenes={
  checks:()=>`<div class="pn-example-segment">Medical <span>ACC</span></div>${row(tick('Chest pain'),true)}${row(tick('Shortness of breath'),true)}${row(tick('Lives alone'),true)}<div class="pn-example-result">Structured choices → JSON</div>`,
  guidance:()=>`<div class="pn-example-split"><div><small>Assessment</small>${row('Subjective…')}${row('Continue typing',true)}${row('Your draft stays open',true)}</div><aside><small>← Guidance</small>${row('Find a topic…')}${row('Read the relevant section',true)}</aside></div>`,
  prompts:()=>`${row('Head strike <strong>Yes</strong>',true)}${row('Review head injury assessment',true,'pn-example-red')}${row('Recurrent falls <strong>Yes</strong>',true)}${row('Review falls referral criteria',true,'pn-example-amber')}`,
  guidelines:()=>`<div class="pn-example-tabs"><b>Myocardial ischaemia</b><span>Falls</span></div>${row('Initial treatment')}${row('Performed action '+button('+ Time'),true)}${row('14:32 · Actual action / details',true)}${row('14:37 · Repeat action',true)}<div class="pn-example-result">Reference ≠ care performed</div>`,
  entry:()=>`${field('Drug','Fentanyl <span class="pn-example-chevron">⌃<br>⌄</span>')}<div class="pn-example-fields">${field('Dose','Actual dose')}${field('Unit','mcg')}${field('Route','IV')}</div>${row('↓ Select → Enter → Dose',true)}${row(button('Record'),true)}<div class="pn-example-result">Inline entry · explicit confirmation</div>`,
  vitals:()=>`<div class="pn-example-table">${row('Vital <span>Reading</span>')}${row('RR <b>18</b>',true)}${row('SpO₂ <b>—</b>',true)}${row('Temp <b>Hi / Low</b>',true)}${row('BGL <b>Hi / Low</b>',true)}</div><div class="pn-example-result">Enter / Tab / arrows → next</div>`,
  flags:()=>`<div class="pn-example-red pn-example-banner">RED FLAGS</div>${row(tick('Select a relevant finding'),true)}<div class="pn-example-amber pn-example-banner">ORANGE FLAGS</div>${row(tick('Select a relevant finding'),true)}<div class="pn-example-result">Unticked ≠ absent</div>`,
  referral:()=>`<h4>Request referrals</h4>${row(tick('Falls'),true)}${row('Generated note',true)}<div class="pn-example-stamp pn-cue">[[falls_referral]]</div><div class="pn-example-result">Searchable text + structured choice</div>`,
  copy:()=>`<div class="pn-example-tabs"><b>Output</b><span>ePRF</span></div>${row('History of Incident',true)}${row('Clinical Impression',true)}${row('Disposition',true)}<div class="pn-example-result">Review → Copy all → Paste</div>`,
  cycle:()=>`<div class="pn-example-dial"><small>CPR cycle</small><b>02:00</b><span>Visual countdown</span></div><div class="pn-example-outcomes pn-cue">${button('Shock')}${button('No shock')}${button('ROSC')}</div><div class="pn-example-result">Confirm outcome → observed rhythm</div>`,
  weight:()=>`${field('Pt weight (kg)','Enter weight')}<div class="pn-example-fields pn-cue">${field('Reference','Dose / route')}${field('Review clock','Since / until review')}</div>${row('Administration → sidebar',true)}${row(button('Record')+' '+button('Other…'),true)}<div class="pn-example-result">Review first · record explicitly</div>`,
  support:()=>`<div class="pn-example-fields"><div>${field('Observed rhythm','PEA')}${row('Fluid reference',true,'pn-example-blue')}</div><div>${field('Torsades history','Recorded')}${row('Magnesium guidance',true,'pn-example-amber')}</div></div>${row('Actual volume / administration',true)}<div class="pn-example-result">A card change records nothing</div>`,
  checklist:()=>`<div class="pn-example-tabs"><span>Guidance</span><b>Checklists</b></div>${row(tick('Team leader identified.'),true)}${row('14:32 · Review recorded',true)}${row('Reversible causes → Guidance',true)}<div class="pn-example-result">Checklist review ≠ intervention</div>`,
  log:()=>`${row(button('+ Previous shock'))}${row('Before app · Time not set',true,'pn-example-amber')}${row('Add time / edit details',true)}<div class="pn-example-fields">${field('Show','Interventions only')}${field('Checklists','Start & finish')}</div><div class="pn-example-result">Export follows the selected view</div>`
 };
 return `<div class="pn-example" aria-hidden="true"><div class="pn-example-top"><span>Paramedic Notes</span><small>ILLUSTRATION</small></div><div class="pn-example-body">${scenes[kind]()}</div></div>`;
}

let notesTutorialDialog=null,notesTutorialIndex=0,notesTutorialReturn=null;
function createNotesTutorial(){
 if(notesTutorialDialog)return;
 const dialog=document.createElement('dialog');dialog.id='notesTutorial';dialog.setAttribute('aria-labelledby','notesTutorialTitle');
 dialog.innerHTML=`<div class="pn-tutorial-heading"><div><small>PARAMEDIC NOTES + POCKET RESUS</small><h2 id="notesTutorialTitle">Tutorial</h2></div><button type="button" class="quiet" data-tutorial-close aria-label="Close tutorial">×</button></div><div class="pn-tutorial-progress" role="progressbar" aria-label="Tutorial progress" aria-valuemin="0" aria-valuemax="100"><span></span></div><label class="pn-tutorial-topics"><span>Jump to</span><select aria-label="Tutorial topic">${['Documentation','Pocket Resus'].map(group=>`<optgroup label="${group}">${NOTES_TUTORIAL.map((item,i)=>item.group===group?`<option value="${i}">${String(i+1).padStart(2,'0')} · ${esc(item.title)}</option>`:'').join('')}</optgroup>`).join('')}</select></label><div class="pn-tutorial-pages" aria-label="Scrollable tutorial steps" tabindex="0">${NOTES_TUTORIAL.map((item,i)=>`<section class="pn-tutorial-slide" aria-labelledby="tutorial-title-${i}" data-tutorial-id="${item.id}"><div class="pn-tutorial-slide-heading"><small>${item.group} · ${String(i+1).padStart(2,'0')} / ${NOTES_TUTORIAL.length}</small><h3 id="tutorial-title-${i}">${esc(item.title)}</h3></div><div class="pn-tutorial-visual">${tutorialExample(item.visual)}</div><div class="pn-tutorial-copy"><p class="pn-tutorial-action">${esc(item.action)}</p><p class="pn-tutorial-note">${esc(item.note)}</p><small>Illustrative examples never change your case.</small></div></section>`).join('')}</div><div class="pn-tutorial-controls"><button type="button" class="quiet" data-tutorial-prev>← Back</button><div><button type="button" class="quiet" data-tutorial-pause aria-pressed="false">Pause</button><button type="button" class="quiet" data-tutorial-replay>Replay</button><span class="pn-tutorial-count" aria-live="polite"></span></div><button type="button" data-tutorial-next>Next ↓</button></div>`;
 document.body.append(dialog);notesTutorialDialog=dialog;
 const pages=dialog.querySelector('.pn-tutorial-pages');
 pages.addEventListener('scroll',()=>{
  const slides=[...pages.children],line=pages.scrollTop+pages.clientHeight*.35,origin=slides[0].offsetTop;
  let current=0;slides.forEach((slide,i)=>{if(slide.offsetTop-origin<=line)current=i;});
  if(current!==notesTutorialIndex)activateNotesTutorial(current);
 },{passive:true});
 dialog.querySelector('select').addEventListener('change',e=>goNotesTutorial(Number(e.target.value)));
 dialog.querySelector('[data-tutorial-close]').onclick=closeNotesTutorial;
 dialog.querySelector('[data-tutorial-prev]').onclick=()=>goNotesTutorial(notesTutorialIndex-1);
 dialog.querySelector('[data-tutorial-next]').onclick=()=>notesTutorialIndex===NOTES_TUTORIAL.length-1?closeNotesTutorial():goNotesTutorial(notesTutorialIndex+1);
 dialog.querySelector('[data-tutorial-pause]').onclick=e=>{const paused=e.currentTarget.getAttribute('aria-pressed')!=='true';dialog.classList.toggle('pn-paused',paused);e.currentTarget.setAttribute('aria-pressed',String(paused));e.currentTarget.textContent=paused?'Play':'Pause';};
 dialog.querySelector('[data-tutorial-replay]').onclick=()=>{const slide=pages.children[notesTutorialIndex];slide.classList.remove('is-active');void slide.offsetWidth;slide.classList.add('is-active');};
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeNotesTutorial();});
 dialog.addEventListener('keydown',e=>{if(e.target.tagName==='SELECT')return;if(['ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();goNotesTutorial(notesTutorialIndex+(e.key==='ArrowRight'?1:-1));}});
}
function activateNotesTutorial(index){
 notesTutorialIndex=Math.max(0,Math.min(index,NOTES_TUTORIAL.length-1));const dialog=notesTutorialDialog;
 [...dialog.querySelectorAll('.pn-tutorial-slide')].forEach((slide,i)=>slide.classList.toggle('is-active',i===notesTutorialIndex));
 dialog.querySelector('select').value=String(notesTutorialIndex);
 const amount=Math.round((notesTutorialIndex+1)/NOTES_TUTORIAL.length*100),progress=dialog.querySelector('.pn-tutorial-progress');
 progress.setAttribute('aria-valuenow',String(amount));progress.setAttribute('aria-valuetext',`Step ${notesTutorialIndex+1} of ${NOTES_TUTORIAL.length}`);progress.firstElementChild.style.width=amount+'%';
 dialog.querySelector('[data-tutorial-prev]').disabled=notesTutorialIndex===0;
 dialog.querySelector('[data-tutorial-next]').textContent=notesTutorialIndex===NOTES_TUTORIAL.length-1?'Done':'Next ↓';
 dialog.querySelector('.pn-tutorial-count').textContent=`${notesTutorialIndex+1} / ${NOTES_TUTORIAL.length}`;
}
function goNotesTutorial(index){
 activateNotesTutorial(index);const pages=notesTutorialDialog.querySelector('.pn-tutorial-pages');
 // Instant paging keeps keyboard / repeated taps deterministic; the illustration
 // itself animates. Touch scrolling remains natural between full-height steps.
 pages.scrollTo({top:pages.children[notesTutorialIndex].offsetTop-pages.children[0].offsetTop,behavior:'instant'});
}
function showNotesTutorial(start='checkboxes'){
 createNotesTutorial();if(!notesTutorialDialog.open){const el=document.activeElement;notesTutorialReturn={el,start:el?.selectionStart,end:el?.selectionEnd};notesTutorialDialog.showModal();}
 notesTutorialDialog.classList.remove('pn-paused');const pause=notesTutorialDialog.querySelector('[data-tutorial-pause]');pause.setAttribute('aria-pressed','false');pause.textContent='Pause';
 goNotesTutorial(Math.max(0,NOTES_TUTORIAL.findIndex(item=>item.id===start)));
}
function closeNotesTutorial(){
 notesTutorialDialog?.close();const previous=notesTutorialReturn;notesTutorialReturn=null;
 if(previous?.el?.isConnected){previous.el.focus();if(previous.start!=null&&previous.el.setSelectionRange)previous.el.setSelectionRange(previous.start,previous.end);}
}
// Preserve existing function/launch hooks, replacing only the tutorial surface.
showTour=function(){showNotesTutorial();};
$('helpButton').textContent='Tutorial';$('helpButton').setAttribute('aria-label','Tutorial');$('helpButton').onclick=showTour;
$('showExplain').textContent='Tutorial';$('showExplain').onclick=showTour;
window.addEventListener('message',e=>{if(e.origin===location.origin&&pocketFrame&&e.source===pocketFrame.contentWindow&&e.data?.type==='notes-tutorial-open')showNotesTutorial('arrest-cycle');});
