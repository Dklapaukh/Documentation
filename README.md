# Paramedic Notes

A compact tablet documentation tool, using plain HTML, CSS and JavaScript. No build step, framework, database or patient-data network requests.

## GitHub Pages

The GitHub download places app files at the repository root. Follow `GITHUB-PAGES.md` to upload and publish with Settings → Pages → Deploy from a branch → main → /(root). No build step is needed. The `dist/` paths below describe the development checkout; in the GitHub package these files are at the top level.

## Run and use

Serve `dist/` over HTTP in a modern browser, or publish its contents with any static host. For example, run `python -m http.server 4173 --directory dist`. The local handwriting model loads over HTTP; direct file opening may prevent it loading. Typed entry remains available. Header tabs open History, Assessment, Impression, Vitals & Interventions, Disposition and Output.

History contains the clinical narrative, relevant background, optional Rockwood slider and social-history checkboxes. No score is recorded until the slider is used. Before selection, the description previews score 1. Clear removes the recorded score while retaining that preview. The original NHS PDF is included locally and opens in a non-modal reference dock. Some tablet PDF viewers have limited embedded support; the PDF object includes a direct-link fallback.

Assessment has two narrative fields, Subjective and Objective, each with a guidance-topic dropdown. Structured findings have been removed. No blank field is interpreted as an absent or normal finding.

Impression pairs a provisional-diagnosis dropdown (Myocardial ischaemia, Falls, Pulmonary Embolism (PE), Ankle Injury, Other) with reasoning. Other opens a free-text diagnosis. Each differential has its own evidence for or against it. Copying is blocked when a diagnosis has no reasoning. Pathway checkboxes are limited to Telestroke, PASTA and LAMS, with a field for findings/scores. Ticking a pathway records it as assessed; it does not generate a score.

Disposition includes interventions, response, onward plan and conditional non-transport documentation. Referral checkboxes mean referrals made; there is no automatic referral submission.

Output contains three editable notes mapped to History of Incident, Clinical Impression and Disposition. Short clinical paragraphs and lists are generated from explicit input, without AI inference. Copy a section or all sections. Reset (↺) beside a section discards its manual edits. Changing source fields regenerates output and clears manual output edits. No GP or audit output is included.

## Patient data

Drafts exist only in browser memory. Refreshing or closing discards them. A browser-supported leave warning is requested for nonempty notes. Clipboard text and explicitly exported JSON files remain outside this lifecycle. JSON may contain sensitive health information; store and analyse only within approved workflows. Hosting infrastructure may record ordinary page-access metadata. CPG links do not contain patient text.

## Change local requirements

- `dist/config.js`: CONFIG has basic history/disposition options. LOCAL holds v2 social options, referral tags, pathways, frailty descriptions, verified CPG URLs, keyword matches and documentation prompts. GUIDANCE contains the supplied teaching summary. No framework knowledge is required to edit arrays.
- `dist/app.js`: `render()` builds the six screens. `buildNotes()` maps state to ePRF fields. `reasoningErrors()` checks paired diagnoses/reasoning. `matchingCpgs()` suggests links. Event handlers keep typed data in memory without re-rendering focused text inputs.
- `dist/styles.css`: layout, colours, touch targets and responsive header.
- `dist/index.html`: main page and reference dialogs.
- `dist/rockwood-nhs.pdf`: unchanged NHS source PDF.

Keep social IDs, referral IDs/tags and schemaVersion stable for longitudinal analysis. Labels may be changed independently. When changing disposition strings, update `isNonTransport()` and explicit refusal conditions in app.js. New assessment topics are generated from GUIDANCE keys; each paragraph uses the part before the first colon as its field label. Keep labels stable for analysis.

## Referral tags

| Checkbox | Output tag |
| --- | --- |
| Falls | `[[falls_referral]]` |
| Vulnerable people | `[[vulnerable_people_referral]]` |
| Fire safety | `[[fire_safety_referral]]` |
| Medical alarm | `[[medical_alarm_referral]]` |
| GP | `[[gp_referral]]` |
| Other | `[[other_referral]]` |

Tags are added only for selected checkboxes and are not inferred from narrative. The Other referral needs a description in Referral details. JSON includes stable checkbox IDs, diagnosis fields, treatment events and generated and edited final notes. Unticked or blank values mean no entry, not a negative finding.

## Guidance and references

The supplied teaching summary remains available in a searchable, non-modal reference dock. GP and audit material has been removed. Slider descriptions are short summaries retained from the supplied starting tool; the full NHS scale wording is in the reference PDF. NHS source: https://www.england.nhs.uk/south/wp-content/uploads/sites/6/2022/02/rockwood-frailty-scale_.pdf

NZ CPG source: https://cpg.stjohn.org.nz/ . Individual links and selected documentation prompts were checked on 23 October 2026 and are listed with that date in LOCAL.cpgs. Coverage currently includes asthma, headache, myocardial ischaemia, fever, anaphylaxis, meningococcal septicaemia and major trauma triage. All NZ CPGs remain accessible from guidance search. Context suggestions use keywords from history, provisional diagnosis and differentials; mentions can include negation, so the clinician must confirm relevance. This is reference matching, not diagnostic decision support.

Red-flag statuses start blank. Present, Absent and Not assessed remain distinct. Only explicit selections appear in the note. Asthma, cardiac and fever prompts are selected items for documentation, not exhaustive guideline reproductions. Fever guidance includes age-dependent criteria; consult the full guideline, particularly for children. Check the live CPG for current complete criteria. The app never treats an unselected red flag as absent and never concludes that non-transport is safe.

## Checks

Automated note-generation checks cover blank omission, frailty placement, social choices, referral tags, diagnosis reasoning, pathway output, non-transport conditional text and editable output. Browser checks cover header navigation, both assessment panels, the diagnosis dropdown, embedded NHS PDF, diagnosis-specific treatment and falls panels, referral checkboxes and clipboard output. Validate with the actual tablet and ePRF before operational use.

## Diagnosis-specific panels

Selecting Myocardial ischaemia automatically shows the initial treatment section from CPG EAS 3.2, with a timestamp control for every treatment / ECG item. The instructions are condensed without changing their doses or conditions. The STEMI scope distinction and source link remain visible. Source: https://cpg.stjohn.org.nz/tabs/guidelines/cardiac-eas/page/myocardial-ischaemia-eas

Every + Time click creates a distinct performed-action record using the device's local date/time and timezone. The date/time can be edited and repeated entries added. Medication instructions do not prefill the actual administered dose: enter the actual dose in Details. Output includes a chronological treatment timeline in Disposition, with dates, times and timezone. Missing medication doses are stated as not recorded. Clear an incorrect entry with its remove button. These myocardial-ischaemia controls do not infer treatment or administration. The separate Cardiac arrest workspace has explicitly started timers and review reminders.

Selecting Falls automatically shows eight red and five orange flag items from CPG EAS 13.3 as checkboxes. Wording is condensed, with the full source linked. Checked means present. Unchecked means no entry, not absent. No conclusion about safe non-transport is generated. Source: https://cpg.stjohn.org.nz/tabs/guidelines/miscellaneous-eas/page/falls-eas

The two source PDFs were checked on 24 October 2026; both were exported by the CPG site on 24 September 2026. The falls version is 1.0.5.3 (9 June 2025); the myocardial ischaemia version is 1.0.4 (11 September 2023). Review against the live CPG when maintaining this local configuration. Edit DIAGNOSIS in config.js for the diagnosis options, timestampable treatment reference items and falls checklist IDs.

Deliberately recorded treatment events and checked falls flags stay visible and in the output even if the provisional diagnosis changes. This preserves actual documentation; remove incorrect entries explicitly. A new-patient reset clears them. JSON export contains treatmentEvents with ISO timestamps, local editor values, timezone and actual details, plus stable fallsFlags IDs.

## Clinical instrument layout

The interface uses flat integrated sections, fine rules, a compact numbered header and neutral warm-grey surfaces. No rounded cards or floating reference panels are used. Field-specific writing guidance is stored in FIELD_HINTS in app.js and rendered as native input/textarea placeholders. It disappears when a value is entered and returns if the field is cleared. Accessible field labels remain visible. Clinical guideline content and assessment findings are not replaced by placeholders.

Guidance and PDFs share a persistent reference dock. On wider displays it uses its own column beside the editor; below 1050px it uses a separate row above the independently scrollable editor. The dock never creates a backdrop, traps focus or disables writing fields. Header navigation remains available. Close reference restores the full-width editor. The NHS Rockwood PDF and the myocardial-ischaemia/falls guideline links open locally in the dock; these unchanged source PDFs are included for reliable in-app viewing. Other external links open separately. Documents remain references, not automatically entered patient findings.

Use the Guidance and Reference PDF tabs to switch reference content without closing the editor. Source-PDF export dates are unchanged from the previous version. The small PDF viewer includes an Open separately link for devices with limited embedded PDF support.

## Clinical sidebar and Explain app walkthrough

Myocardial-ischaemia treatment controls and falls flag checklists now appear in the Clinical sidebar, never below the writing fields. Choosing either diagnosis opens that tab automatically; the contextual sidebar button reopens it. Recorded treatments and checked falls flags remain in that sidebar if a provisional diagnosis changes, so existing documentation is still visible. The editor remains usable while any sidebar tab is open.

Falls cases (provisional diagnosis Falls or deliberately recorded falls flags) highlight the Falls checkbox in Disposition. The prompt is for clinician review only. It does not tick the checkbox, send a referral or add the referral tag. Only an explicit referral selection produces `[[falls_referral]]`. The red and orange flag tables have distinct labelled headers and colour treatments; meaning does not depend on colour alone.

Assessment guidance omits both the All NZ CPGs link and suggested CPG links, including after searches within assessment guidance. Clinical source links remain available with diagnoses and clinical sidebar content.

The top Explain app button opens a 18-topic animated guide in the sidebar. Previous/Next, numbered topics and Done provide navigation. Each five-second animation plays once, with Pause / Play and Replay. Reduced-motion preferences show all steps as a still demonstration. The guide never changes patient entries; its examples are explicitly illustrative.

Edit `dist/tour.js` for walkthrough titles, captions and example columns. `tourDemo()` renders the local HTML illustrations and `styles.css` controls animation timing. No animation depends on patient entries, an external image service or a library. The app prepares editable plain-text sections for ePRF; it does not infer clinical facts or perform AI transcription.


## Disposition guidance additions

Disposition now has a **Clinical disposition guidance** selector separate from the transport **Outcome**. By default it follows the provisional diagnosis; choosing a reference topic does not change the diagnosis, outcome or generated note. Existing myocardial-ischaemia treatment controls remain available. Recorded treatment events, falls flags and assessment states stay available when changing topics.

The Falls sidebar adds four three-state findings: head strike, anticoagulant use, new mobility difficulty and recurrent falls. Every finding starts **Not assessed**. The checkbox cycles Not assessed → Yes → No → Not assessed; the adjacent buttons select a state directly. The mixed checkbox means Not assessed, the clear checkbox means No, and the tick means Yes. Each Yes independently shows a fixed review prompt, so several can appear together. Red, orange and referral prompts retain distinct headings and colours.

These four states are **excluded from the clinical narrative until the clinician selects “Include these states in the note.”** Confirmation includes all four explicitly labelled states, including Not assessed, without converting an unassessed finding into a negative. Changing any state clears confirmation and removes their generated narrative until reconfirmed. The existing red/orange tables retain their original explicit-selection behaviour. No state calculates referral eligibility, selects an outcome, ticks a referral or sends patient data. Recurrent falls highlights the existing falls referral and the linked CPG eligibility criteria for clinician review.

PE guidance links to MDCalc Wells, PERC and YEARS. The sidebar describes pre-test probability, PERC's low-risk restriction and YEARS' D-dimer requirement; it does not reproduce or calculate those rules. Ankle Injury links to the MDCalc Ottawa Ankle Rule and the requested Emergency Care BC instructional video, with a concise source-based overview of malleolar/midfoot tenderness, four-step weight bearing at both timepoints and rule limitations. The supplied Emergency Care BC URL was unavailable during checking on 24 October 2026, so the panel also includes the same Dr Ian Stiell video from EM Ottawa. Resource links open in a separate tab without replacing the documentation page. Browser draft retention was checked with synthetic text.

Maintain `FALLS_ASSESSMENT` and `DISPOSITION_RESOURCES` in `config.js`. Sources were reviewed on 24 October 2026: the existing Falls CPG, the four linked MDCalc resources, the Emergency Care BC indexed video description, EM Ottawa's video, the Ottawa Hospital Research Institute Ian Stiell page and NSW ACI's adult Ottawa ankle appendix. These are fixed educational references, not AI-generated patient recommendations. Confirm the live resources and local clinical policy when updating them.

Run `node tests/clinical-guidance.cjs` for 564 state, narrative-safety and regression checks, including all 81 falls state combinations. Browser QA covered all 12 direct state choices, the checkbox cycle, simultaneous prompts, confirmation and reset, external-tab links and retained draft, clipboard text, sidebar scrolling, and 390px/768px responsive viewports plus desktop. The supplied Emergency Care BC page could not be verified as playable in this environment. Validate with the operational tablet and ePRF before clinical use.


## Assessment PE reminder

A user-requested **keyword reminder**, not a validated PE decision rule, checks the current Subjective and Objective fields together. All three word groups must be present: tachycardia; hypotension (or hyootension); hypoxia (or hyoxia, hypoxaemia, hypoxemia). Matching is case-insensitive and uses whole words. The order and field do not matter. History, diagnosis, treatment, output edits and guidance text are not scanned; numerical observations are not interpreted. Deleting a required word removes the prompt rather than retaining a past match.

The conservative phrase filter excludes obvious negation, uncertainty, historical wording and questions. It splits at full stops, exclamation marks, semicolons and newlines; it keeps comma-separated lists together so “no tachycardia, hypotension or hypoxia” is not treated as positive. For simplicity it suppresses the entire affected phrase. This can miss positive findings in mixed phrases and cannot reliably resolve negation, contradictions, quoted text, chronology or clinical context. Its absence is not reassurance and never excludes PE. This intentionally small matcher is not clinical language understanding.

When matched, an integrated Assessment / Impression control opens a contextual suggestion with a short explanation and a source link. The clinical sidebar opens on first match if no reference is already open; an existing guidance document or explanation stays open. Typing does not replace the editor or move focus. The fixed explanation reflects PE presentations described in ESC guidance (reviewed 24 October 2026): https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/acute-pulmonary-embolism/ . The three-word trigger itself was specified for this app, not validated by that guideline.

No differential, clinical reasoning, calculated probability, disposition or note content is added automatically. **Add to differentials** is the clinician's explicit action and adds only the diagnosis name, leaving reasoning blank. Existing reasoning validation still blocks copying until it is completed. Duplicate PE entries are prevented for recognised PE names. **PE resources** opens the existing resource panel without changing the diagnosis or transport outcome. The reminder does not bypass the limitations shown with PERC or YEARS.

Maintain aliases/explanation in `PE_REMINDER` in `config.js`, and phrase filtering in `peReminderMatches()` in `app.js`. Maintain the 18 walkthrough topics in `tour.js`: history/source/OPQRST; frailty/social baseline/PDF; assessment/guidance; PE reminder; diagnoses/reasoning/pathways; treatment timestamps; falls states/confirmation; falls flags/referrals; PE/ankle resources; disposition/non-transport; review/copy/output edits; draft/reset/JSON export.

Run `node tests/pe-reminder.cjs` for 99 reminder and walkthrough checks, alongside the 564 existing checks in `tests/clinical-guidance.cjs`. New checks cover incomplete term combinations, aliases, both assessment fields, obvious negation/uncertainty, excluded fields, deletion, no numerical inference, no automatic note entries, existing reasoning validation, all 18 demos, and reduced-motion CSS. Browser checks cover typing focus, suggestion appearance/removal, negated wording and spelling variants, explicit differential addition and duplicate prevention, copying after clinician reasoning, all topic buttons, Pause/Replay, continued writing with Explain open and phone/tablet/desktop layouts. Software checks do not establish clinical validity.


## Vitals & Interventions (schema 6.0)

The new header section sits between Impression and Disposition. Its four controls open **Add vitals**, **Add drug**, **Add intervention** and **Add procedure**. Saved entries have a full timestamp and device timezone, can be edited or explicitly removed, and are sorted chronologically within the new timelines. The prominent clock shows hours/minutes; Recorded at also retains the date for retrospective work and midnight crossings. Draft modal values do not enter notes until explicitly saved. Existing myocardial-ischaemia timestamps remain intact.

**Guideline Used**, below the provisional-diagnosis card, currently offers Seizures and Burns. It records the selected title in Clinical Impression and opens the treatment summary in the existing sidebar. Complete, unmodified source PDFs open in the reference dock. Both summaries were checked against the NZCPG PDF exports dated 24 September 2026 on **25 October 2026, New Zealand time**. Seizures is EAS 5.8; Burns is EAS 4.4. They are summaries, not replacements for the full source, scope, paediatric dosing and cautions. Selecting a reference does not record a treatment or dose.

**CAS Call** in Disposition records `CAS Call: Yes` when explicitly checked; an unchecked box makes no negative assertion. It does not place a call. **Send Learning Version to Author’s email** in Output is an inactive placeholder. Ticking it only changes that local control. It is excluded from patient notes and the JSON state and has no email address, mailto action, anonymisation, network request or sending mechanism.

### Vital sets and input

Vitals open as a paper-like sheet below the always-visible navigation header. Large canvas areas accept handwritten GCS, RR, SpO₂, HR, systolic/diastolic BP, temperature and BGL. `ink.js` recognises digits locally using the included model; no ink or patient data is sent to a recognition service. Readings appear beside the ink and remain editable using the small **Read as** field. Undo/Clear apply to each pad. Review every displayed reading before Save; saving confirms the readings. Unread or pending ink blocks saving rather than silently disappearing. Raw strokes are retained with saved sets for review. Header navigation preserves unfinished entry drafts; Cancel discards the current draft and New patient clears all drafts. Record, Save and Cancel actions are in the bottom toolbar.

The model was trained on MNIST isolated digits. Its held-out isolated-digit accuracy of 97.27% is **not clinical handwriting validation**. Natural handwriting, touching digits and decimal segmentation can fail. Browser QA recognised a drawn “17”; real pen/tablet use remains to be evaluated. Model metadata and attribution are in `docs/ink-model-metadata.json` and `docs/INK_MODEL_LICENSE.txt`; the model and test examples are distributed under CC BY-SA 3.0. `tools/train-ink-model.py` is an optional reproducible training script, not a runtime dependency.

Each numerical vital also has a full-screen scroll wheel. BP uses two columns. Scroll or tap to select; tapping outside the number wheels accepts valid selections. Opening a wheel centres a convenient starting position but does not record that value. An untouched blank remains blank. Cancel/Escape discards pending wheel choices. BP must contain both values and systolic cannot be lower than diastolic; this is enforced both when accepting BP wheels and when saving the set. Counts use whole numbers; temperature and BGL allow one decimal, including comma-to-decimal normalisation. Invalid recognised characters are rejected, not guessed.

GCS can be entered as a total on the paper. Its Components control opens a second full-screen view with 15 scored options across Eyes (4), Verbal (5) and Motor (6). Checkboxes are mutually exclusive within each category and can be cleared. Each category additionally supports NT (not testable). A total is calculated only for three valid scored responses; missing/NT components never become a score of 1. Component descriptions and the official assessment-aid link are included.

### NEWS2

The current RCP **NEWS2** is used, not the archived original NEWS. Complete scoring requires the six physiological inputs, air/oxygen status, consciousness and applicability. For this proof of concept, new sets visibly default to adult at least 16 / not pregnant, room air, Scale 1 and **From GCS**. These assumptions are editable and labelled in the saved note. No measured vital defaults to normal. The requested consciousness proxy scores GCS 15 as 0 and GCS 3–14 as 3; missing or not-testable GCS remains incomplete. This is a prototype scoring assumption, not a validated conversion to ACVPU. Explicit ACVPU/new-confusion assessment overrides it. BGL and diastolic BP do not score. Scale 1 is the standard setting. Scale 2 requires explicit clinician authorisation for confirmed hypercapnic respiratory failure, and its oxygen-dependent thresholds are applied. Switching scales clears that authorisation.

Individual components show score numbers and colour bands 0/1/2/3. The aggregate distinguishes low, a single parameter scoring 3, medium (5–6) and high (7+). An incomplete or inapplicable set never produces a zero total. This is a calculated score, not a disposition or treatment decision. Clinical concern must not be discounted because a score is low. The original colour chart and RCP attribution are available from Scoring reference. Thresholds and applicability were checked against the RCP 2017 chart/report; the app does not reproduce a modified version of the RCP chart.

Saved `vitalSets` contain numerical values, GCS components, oxygen/consciousness/scale/applicability fields, timestamp/timezone and a structured NEWS2 result. Saved sets appear in Clinical Impression. The scoring functions are `numericVital`, `vitalErrors`, `gcsTotal` and `news2` in `care.js`.

### Drugs, actions and RSI

The editable drug combobox accepts a custom name and lists matching configured names. Drugs named in the selected Guideline Used treatment section appear first, alphabetically within that group; other matches follow alphabetically. This is a reference convenience, not authority to administer every listed drug. The starting catalogue was taken from the current NZCPG medicines calculator, with oxygen and suxamethonium added from the relevant guidelines. Actual dose, unit, route and Notes are separate fields. A blank dose is explicitly written as **Dose not recorded**; supplying a dose requires a positive number and a unit. Add intervention is free text with optional details.

Add procedure currently contains **RSI**. Enter patient group and weight for references, plus child age for the guideline cuffed-ETT estimate. Child tube estimates use EAS 7.2; an infant gets a range, not a chosen tube. Adult ETT size remains clinician-selected because the reviewed RSI guidance supplies no weight-only adult tube formula. No tube estimate is recorded as actual equipment used. The adult dose reference supports 25–500 kg; use the full CPG outside that range. The reference applies the EAS 9.3 dose caps, adult neuromuscular-blocker rounding and conditional/reduced-dose cautions. The complete RSI and paediatric equipment PDFs remain accessible.

Quick controls select the relevant drug or intervention without recording it. They stay accessible while entering successive actions. The round **Record** button commits one performed action, clears the actual-entry fields and keeps the procedure open. A manually edited date/time persists for retrospective entries; **Now** restores current-time entry for subsequent records. Each new real-time entry gets a fresh timestamp. Cancel/Done do not undo already recorded entries. Pending entry text must be recorded or cleared before Done, Selecting a different drug or intervention deliberately clears the unsaved actual dose, unit, route and Notes. Re-selecting the same item retains them. Drugs and interventions occupy two grouped columns; the distinct blue sidebar contains references only. Procedure context/weight are retained with recorded actions, but reference doses never populate actual-dose fields or the narrative. Actions appear in Disposition and remain editable in the new header section.

### Maintenance and verification

- `dist/clinical-data.js`: the two guideline summaries/links, local medicine names, vital units/ranges, GCS descriptions and source URLs.
- `dist/care.js`: scoring, reference calculations, full-screen editors, wheel interaction and confirmed-entry-to-note mapping.
- `dist/app.js`: header integration, Guideline Used, CAS, output placeholder and existing note generation.
- `dist/styles.css` / `dist/index.html`: responsive instrument styling and native dialog containers.
- `dist/tour.js`: 18 animated demonstrations, including paper input, prototype assumptions and cardiac arrest.
- `dist/ink.js` / `ink-model.bin`: local pen input, digit recognition and review controls.
- `dist/arrest.js`: timer state, reference tables, reminders and explicit event logging.
- `dist/cpg-seizures.pdf`, `cpg-burns.pdf`, `cpg-rsi.pdf`, `cpg-paediatric-equipment.pdf`: unchanged NZCPG source exports.

Run `node tests/poc.cjs`, `node tests/care.cjs`, `node tests/clinical-guidance.cjs` and `node tests/pe-reminder.cjs`. There are **1,168 software checks**: 219 paper/arrest checks, 286 care checks, 564 guidance checks and 99 reminder/walkthrough checks. Coverage includes NEWS2 boundaries, GCS combinations/NT/proxy overrides, BP rejection, explicit saves, procedure clearing, actual-dose separation, 2-minute/15-second thresholds, pause/background timing, four-minute adrenaline reviews, third/sixth-shock amiodarone reviews, prior counts, ROSC/special situations and paediatric reference bands. The model smoke fixture classified 100 isolated held-out digits; this is not a natural-handwriting accuracy estimate.

Browser QA covered actual drawn-digit recognition, draft retention through header navigation, paper layouts at phone/tablet sizes, procedure selection clearing, grouped controls, bottom actions, a live two-minute countdown and charge cue, third/sixth-shock reminders, undo, four-minute medicine review and ROSC checklist access. Existing regression checks preserve the note editor, guidance, referral and copy mapping. These are software checks, not clinical validation or operational tablet/ePRF testing.

## Cardiac arrest workspace

The header button beside Explain app opens a full-screen workspace with a circular two-minute dial and digital countdown. **Start / New cycle** explicitly starts each cycle; expiry requests a rhythm check and compressor change, without starting another cycle or recording a shock. The final 15 seconds flash **CHARGE DEFIB**, a preparation cue only: shock only when indicated. Reduced-motion settings replace flashing with a steady warning.

Pause freezes the cycle only; medicine intervals continue. Returning to notes keeps the timer running in this tab. Deadline-based calculations catch up after backgrounding, but this is a visual browser prototype, not a guaranteed real-time alarm or defibrillator control. Refresh loses the session. Session elapsed time is not an assumed arrest-onset time.

Adrenaline and amiodarone buttons explicitly timestamp an action; they never assume an actual dose or route. Shock timestamps do not assume energy. Use Edit to enter actual amounts and retrospective times. Undo last log removes that action and updates counts/reminders, without rewinding timer phase. Prior shocks and prior amiodarone default to zero and must be confirmed for an existing arrest.

Standard non-traumatic CPG review prompts use adrenaline at four-minute intervals from the last logged administration. An unknown first-dose time is not invented. For VF/pulseless VT, amiodarone review appears after three shocks, then six shocks, accounting for prior shocks/doses. Torsades, special/manual situations and ROSC suppress the standard amiodarone prompts; special/manual and ROSC suppress standard medicine/charge reminders. No reference determines that a drug or shock should be given to a particular patient.

**Patient weight / doses** opens the reference sidebar. Adult arrest references show adrenaline 1 mg IV, amiodarone 300 mg then 150 mg IV, and the defibrillator's maximum adult energy rather than an invented fixed joule value. Child references use the NZCPG 5/10/20/30/40 kg bands, rounding weight up to the next band. Children over 40 kg and special situations require the full CPG. References never fill the actual-administration fields.

Local, unmodified PDFs provide Cardiac arrest, Treatment following ROSC, Airway backup / preparation while awaiting CCP for RSI, and the RSI checklist. Embedded PDF viewing has a separate-tab fallback. The ROSC button pauses the cycle and opens the post-ROSC checklist.

Sources reviewed 25 October 2026: NZCPG Cardiac arrest EAS 3.14 v1.1.0.1 (16 June 2026), Amiodarone EAS 14.4, Treatment following ROSC EAS 3.15, paediatric equipment EAS 7.2, Airway backup EAS 9.2 and RSI EAS 9.4. Source PDFs were exported 24 September 2026. The primary current arrest and amiodarone guidelines specify the sixth-shock second dose; a stale 15-minute repeat string in calculator data is not used for reminder timing. Review the complete current CPG and local requirements when maintaining these fixed reference summaries.

## Drug reference sidebar and repeat review (v11)

Only the requested drug-reference, repeat-reminder and non-transport behaviours changed in this update. Selecting a listed drug in **Add drug** opens its original NZCPG source pages beside the entry fields. All 49 catalogue names have references; GTN offers its spray and IV references separately. Where no dedicated medicine monograph exists, the sidebar labels the relevant clinical guideline explicitly (for example, hypoglycaemia for 10% glucose). Custom names do not open a guessed guideline. A live NZCPG link and separate PDF fallback are provided. The reference files are original pages extracted from the official EAS export dated 24 September 2026, checked on 25 October 2026. Page provenance is in `docs/drug-guidance-sources.json`.

The sidebar's **Patient allergies** area is a placeholder: no separate allergies field was added and no negative allergy status is assumed. Existing Background text is accessible verbatim when present, without trying to extract or interpret allergies.

The small bell beside the drug-entry information expands an optional **Repeat review** selector. It starts Off. Select the recorded route, then an applicable verified interval/indication. Conditions and repeat limits remain visible. Options are deliberately configured from primary guideline text, rather than interpreting duration-of-effect values or stale calculator strings. Not every medicine/indication has a fixed timed-repeat option; if none is configured, the control directs the clinician to the full guideline. The timer is a one-shot review reminder, not authorisation, a recommended dose, or a maximum-dose check.

The reminder begins only when the administration is explicitly recorded, using its actual editable timestamp. A past administration may immediately produce an overdue review banner. A future timestamp does not trigger early. The banner appears below navigation, can be dismissed, and never records a repeat administration or adds a reminder/allergy statement to the clinical narrative. Several overdue reminders may coexist. Changing the drug or an incompatible route clears an unsaved interval. Removing the event or resetting the patient removes its active reminder. Reminders are in-tab visual notifications only: no OS notification permission, sound, background service or persistent storage was added. Browser suspension can delay display; refreshing discards reminders with the draft.

Selecting either non-transport outcome automatically opens the **Non-transport pause and checklist** from EAS 1.6 in the existing reference sidebar. Opening it does not mark it completed, imply that its criteria are met, or change clinical reasoning.

Maintain `drug-guidance-data.js` for catalogue/source mappings and reviewed repeat options, and `drug-guidance.js` for the sidebar and reminder logic. Keep `cpg-drugs/` beside `index.html` when uploading to GitHub. Run `node tests/drug-guidance.cjs` alongside the four existing test scripts. There are 182 focused checks plus 1,168 regression checks (1,350 total).

## Simplified forms and inline guidance (v13)

History no longer displays Background. Treatment now has one **Treatment and en route** field. The Disposition subsection contains only Outcome; Clinical disposition guidance, Handover / onward plan and CAS Call controls are removed from that subsection. The referral heading is **Request referrals**, and generated notes say **Referrals requested**, retaining the existing searchable tags. No referral is submitted by this app.

**Add vitals** now lives in the global header as a green button. The Vitals & Interventions screen retains saved records and its drug, intervention and procedure buttons. Opening vitals from another unfinished entry preserves that entry for return. The reference dock no longer displays Clinical / Guidance / PDF / Explain tabs; it displays only the opened context, with a close control. Existing contextual launchers still open their own content.

An empty Add drug screen has no reference sidebar. Entering a drug name reveals it; listed drugs show the original guideline text directly, rather than depending on an embedded PDF or following a link. Native accordions start closed except Contraindications and Dose (or Dose / treatment for general clinical guidelines). Reference titles distinguish the source indication where no dedicated medicine sheet exists. Source text comes from the original packaged NZCPG pages; `tools/extract-drug-sections.py` rebuilds `drug-guidance-content.js` using PyMuPDF. Morphine's dose section is sourced from Analgesia for Acute Pain, EAS 1.18, because its current medicine page delegates dosing. The original PDFs remain in the package for provenance. The 0.9% sodium chloride reference currently uses Bleeding Following Trauma EAS 4.23; that clinical context is labelled, not presented as a universal fluid regimen. Patient allergies remains a closed placeholder, with no assumed negative allergy status.

The number pad beside **Actual dose** supports digits, one decimal, backspace and Clear. It changes the draft actual-dose field only. It never copies a reference dose, assumes an administration, selects a unit/route or records an entry without Record. The existing opt-in repeat review control remains available.

Non-transport opens the specific resource requested: https://cpg.stjohn.org.nz/tabs/checklists/page/non-transport-pause-and-checklist . Its introduction and six checklist items are displayed directly, using the current public NZCPG page content checked 25 October 2026. This replaces the EAS 1.6 PDF pane used in v11. This web checklist has six items; the separately published EAS 1.6 PDF includes an additional EWS item. The app follows the explicitly requested checklist page without merging versions. Review selections stay in this patient's tab, clear with New patient, and do not write clinical findings, assert eligibility, or mark the existing competency field completed. `docs/non-transport-source.json` holds the exact source text and URL.

Run the six test scripts, including `node tests/simplified-ui.cjs`. All 2,823 checks passed (1,473 new UI/content checks plus 1,350 existing checks). Browser checks cover empty/selected drug states, default accordion states, number-pad entry, inline content, header vitals/draft retention and the specific non-transport checklist. Upload `drug-guidance-content.js` with the other scripts when updating GitHub Pages.

## Drug entry and notification controls (v15)

Drug remains at the top. Dose, Unit and Route are equal-width columns below it. The iOS-style number pad sits directly below Dose and changes only the draft actual dose; unit/route are still explicit inputs. Existing dose validation and the bottom Record/Cancel actions are unchanged.

**Repeat notification** replaces Repeat review. Once a drug and route are selected, the configured guideline interval and its original wording are visible by default. When several contexts apply, the labelled context selector keeps the indication/limits visible. The usual/default configured interval is shown first; this does not establish that the indication applies. Notification remains optional: **On/Off** enables/disables it. Opening the time control shows an iOS-style hours/minutes scroll wheel. **Done** applies the selected time and enables the notification; **Cancel/Escape** leaves the current selection unchanged. Zero time is rejected; the supported range is 1–1,439 minutes. A changed interval is labelled **Custom time**, while the guideline's original interval and wording remain unchanged.

The one-shot notification uses the selected interval from the explicitly recorded administration timestamp. It never authorises a repeat administration, counts prior doses, determines appropriateness, or changes guideline text. Editing a saved custom notification restores its chosen interval. Changing drug/route clears an incompatible notification; where no fixed interval is configured the app does not invent one. Notifications remain in-tab visual prompts and are discarded on refresh with the rest of the draft.

All 2,914 checks passed, including 91 new drug-entry/wheel checks. Run `node tests/drug-entry.cjs` with the six existing test scripts. Primary-source wording was checked against the current local NZCPG EAS export, previously downloaded and reviewed on 25 October 2026.
