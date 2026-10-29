/* Exact specialised panels from published Site version 16.
 * Source commit b3bad1d7a1926b5546ba201218469ca1aa37dc1c.
 * Shared clinical configuration is unchanged from that version.
 * Deliberately excludes the full catalogue and later generic source viewer. */
function externalResource(resource){return `<a class="external-resource" href="${resource.url}" target="_blank" rel="noopener noreferrer">${esc(resource.label)} ↗<span class="sr-only"> (opens in a new tab)</span></a>`;}

function myocardialPanel(){
 return `<section class="diagnosis-panel"><div class="rowhead"><h3>Myocardial ischaemia · initial treatment</h3><a href="${DIAGNOSIS.myocardial.url}" target="_blank" rel="noopener noreferrer">CPG EAS 3.2 ↗</a></div><p class="subtle">${esc(DIAGNOSIS.myocardial.scope)}</p>${DIAGNOSIS.myocardial.treatments.map(t=>`<div class="treatment-row"><div class="treatment-heading"><span>${esc(t.prompt)}</span><button class="quiet" data-stamp="${t.id}" aria-label="Timestamp ${esc(t.action)}">+ Time</button></div>${state.treatmentEvents.map((e,i)=>({e,i})).filter(({e})=>e.treatmentId===t.id).map(({e,i})=>`<div class="time-entry"><input type="datetime-local" data-event="${i}" data-part="at" aria-label="${esc(t.action)} time ${i+1}" value="${esc(e.local)}"><input data-event="${i}" data-part="detail" aria-label="${esc(t.action)} details ${i+1}" value="${esc(e.detail)}" placeholder="${t.medication?'Actual dose / details':'Details'}"><button class="quiet" data-remove-event="${i}" aria-label="Remove ${esc(t.action)} time ${i+1}">✕</button></div>`).join('')}</div>`).join('')}</section>`;
}

function fallsAssessmentControls(){
 return `<section class="falls-assessment"><h3>Falls assessment</h3><p class="subtle">Yes / No / Not assessed. These states enter the note only after confirmation.</p>${FALLS_ASSESSMENT.items.map(f=>{
  const current=state.fallsAssessment[f.id];
  return `<div class="assessment-state-row"><label class="assessment-state-label"><input type="checkbox" data-falls-cycle="${f.id}" aria-label="${esc(f.label)}" aria-describedby="falls-state-${f.id}" ${current==='Yes'?'checked':''}>${esc(f.label)}</label><div class="state-options" role="group" aria-label="${esc(f.label)} state">${FALLS_ASSESSMENT.states.map(option=>`<button class="quiet" data-falls-state="${f.id}" data-value="${option}" aria-label="${esc(f.label+' — '+option)}" aria-pressed="${current===option}">${option}</button>`).join('')}</div><span class="sr-only" id="falls-state-${f.id}">Current state: ${current}. Checkbox cycles Yes, No, Not assessed.</span></div>`;
 }).join('')}<label class="confirmation-check"><input id="confirmFallsAssessment" type="checkbox" ${state.fallsAssessmentConfirmed?'checked':''}>Include these states in the note</label><div class="falls-warnings" aria-live="polite">${fallsAssessmentPrompts()}</div></section>`;
}

function fallsAssessmentPrompts(){
 return FALLS_ASSESSMENT.items.filter(f=>state.fallsAssessment[f.id]==='Yes').map(f=>`<section class="clinical-prompt ${f.level}"><h3>${esc(f.title)}</h3><p>${esc(f.prompt)}</p>${f.id==='recurrent_falls'?`<p>${esc(FALLS_ASSESSMENT.eligibility)}</p><a href="${DIAGNOSIS.falls.url}" target="_blank" rel="noopener noreferrer">Falls pathway · CPG EAS 13.3 ↗</a>`:''}</section>`).join('');
}

function confirmedFallsAssessmentNote(){
 if(!state.fallsAssessmentConfirmed)return '';
 return 'Falls assessment — clinician confirmed\n'+FALLS_ASSESSMENT.items.map(f=>`${f.label}: ${state.fallsAssessment[f.id]}`).join('\n');
}

function fallsPanel(){
 const table=(name,items,context)=>`<section class="falls-table ${name.toLowerCase()}"><h3>${name} flags</h3><p class="subtle">${context}</p>${items.map(f=>`<label class="flag-check"><input type="checkbox" data-check="fallsFlags" value="${f.id}" ${state.fallsFlags.includes(f.id)?'checked':''}>${esc(f.label)}</label>`).join('')}</section>`;
 return `<section class="diagnosis-panel"><div class="rowhead"><h3>Falls</h3><a href="${DIAGNOSIS.falls.url}" target="_blank" rel="noopener noreferrer">CPG EAS 13.3 ↗</a></div><p class="subtle">Red / orange flags: tick findings present. Unticked flags are not recorded as absent.</p>${fallsAssessmentControls()}<div class="grid">${table('Red',DIAGNOSIS.falls.red,'ED assessment, usually by ambulance')}${table('Orange',DIAGNOSIS.falls.orange,'Primary-care follow-up')}</div></section>`;
}

function anklePanel(){
 const ankle=DISPOSITION_RESOURCES.ankle;
 return `<section class="diagnosis-panel resource-panel"><h3>Ankle Injury</h3><h4>Ottawa Ankle Rules</h4><section class="resource-row">${externalResource(ankle.text)}</section><section class="resource-row">${externalResource(ankle.video)}<p>Dr Ian Stiell demonstrates ankle and foot assessment. If this page is unavailable, use the same video from EM Ottawa:</p>${externalResource(ankle.fallback)}</section>${ankle.criteria.map(c=>`<section class="resource-row"><h4>${esc(c.label)}</h4><p>${esc(c.description)}</p></section>`).join('')}<p class="clinical-scope">${esc(ankle.limitations)}</p></section>`;
}
