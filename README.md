# Paramedic Notes

A compact tablet documentation tool, using plain HTML, CSS and JavaScript. No build step, framework, database or patient-data network requests.

## GitHub Pages

The GitHub download places app files at the repository root. Follow `GITHUB-PAGES.md` to upload and publish with Settings → Pages → Deploy from a branch → main → /(root). No build step is needed. The `dist/` paths below describe the development checkout; in the GitHub package these files are at the top level.

## Run and use

Open `dist/index.html` in a modern browser or publish the contents of `dist/` with any static host. Header tabs open History, Assessment, Impression, Disposition and Output.

History contains the clinical narrative, relevant background, optional Rockwood slider and social-history checkboxes. No score is recorded until the slider is used. Before selection, the description previews score 1. Clear removes the recorded score while retaining that preview. The original NHS PDF is included locally and opens in a non-modal reference dock. Some tablet PDF viewers have limited embedded support; the PDF object includes a direct-link fallback.

Assessment has two narrative fields, Subjective and Objective, each with a guidance-topic dropdown. Structured findings have been removed. No blank field is interpreted as an absent or normal finding.

Impression pairs a provisional-diagnosis dropdown (Myocardial ischaemia, Falls, Other) with reasoning. Other opens a free-text diagnosis. Each differential has its own evidence for or against it. Copying is blocked when a diagnosis has no reasoning. Pathway checkboxes are limited to Telestroke, PASTA and LAMS, with a field for findings/scores. Ticking a pathway records it as assessed; it does not generate a score.

Disposition includes interventions, response, onward plan and conditional non-transport documentation. Referral checkboxes mean referrals made; there is no automatic referral submission.

Output contains three editable notes mapped to History of Incident, Clinical Impression and Disposition. Short clinical paragraphs and lists are generated from explicit input, without AI inference. Copy a section or all sections. Reset (↺) beside a section discards its manual edits. Changing source fields regenerates output and clears manual output edits. No GP or audit output is included.

## Patient data

Drafts exist only in browser memory. Refreshing or closing discards them. A browser-supported leave warning is requested for nonempty notes. Clipboard text and explicitly exported JSON files remain outside this lifecycle. JSON may contain sensitive health information; store and analyse only within approved workflows. Hosting infrastructure may record ordinary page-access metadata. CPG links do not contain patient text.

## Change local requirements

- `dist/config.js`: CONFIG has basic history/disposition options. LOCAL holds v2 social options, referral tags, pathways, frailty descriptions, verified CPG URLs, keyword matches and documentation prompts. GUIDANCE contains the supplied teaching summary. No framework knowledge is required to edit arrays.
- `dist/app.js`: `render()` builds the five screens. `buildNotes()` maps state to ePRF fields. `reasoningErrors()` checks paired diagnoses/reasoning. `matchingCpgs()` suggests links. Event handlers keep typed data in memory without re-rendering focused text inputs.
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

Every + Time click creates a distinct performed-action record using the device's local date/time and timezone. The date/time can be edited and repeated entries added. Medication instructions do not prefill the actual administered dose: enter the actual dose in Details. Output includes a chronological treatment timeline in Disposition, with dates, times and timezone. Missing medication doses are stated as not recorded. Clear an incorrect entry with its remove button. No treatment reminder, countdown or automatic administration is inferred from the reference.

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

The top Explain app button opens a four-step illustrated guide in the sidebar: prepare/copy notes, guidance while writing, relevant CPG references, and falls flags/referrals. Previous/Next, numbered steps and Done provide navigation. The guide does not change patient entries. Its examples are explicitly illustrative, not patient information.

Edit `dist/tour.js` for walkthrough titles, alt text, captions and image paths. The four scalable images are in `dist/tour/`; edit the SVGs to change illustrations. For the GitHub package, these paths are relative to the repository root. Keep the tour folder beside index.html. The app prepares editable plain-text sections for ePRF: it does not infer clinical facts or perform AI transcription.
