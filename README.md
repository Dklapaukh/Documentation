# Paramedic Notes

A compact tablet documentation tool, using plain HTML, CSS and JavaScript. No build step, framework, database or patient-data network requests.

## GitHub Pages

The GitHub download places app files at the repository root. Follow `GITHUB-PAGES.md` to upload and publish with Settings → Pages → Deploy from a branch → main → /(root). No build step is needed. The `dist/` paths below describe the development checkout; in the GitHub package these files are at the top level.

## Run and use

Open `dist/index.html` in a modern browser or publish the contents of `dist/` with any static host. Header tabs open History, Assessment, Impression, Disposition and Output.

History contains the clinical narrative, relevant background, optional Rockwood slider and social-history checkboxes. No score is recorded until the slider is used. Clear removes the score. The original NHS PDF is included locally and opens inside a modal. Some tablet PDF viewers have limited embedded support; the PDF object includes a direct-link fallback.

Assessment has two narrative fields, Subjective and Objective. Optional structured findings sit below each. Use System → Finding → Status → Details to capture searchable entries; the adjacent guidance button opens the supplied teaching content. No blank field is interpreted as an absent or normal finding.

Impression pairs provisional diagnosis with reasoning, and each differential with its own evidence for or against it. Copying is blocked when a diagnosis has no reasoning. Pathway checkboxes are limited to Telestroke, PASTA and LAMS, with a field for findings/scores. Ticking a pathway records it as assessed; it does not generate a score.

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

Tags are added only for selected checkboxes and are not inferred from narrative. The Other referral needs a description in Referral details. JSON includes stable checkbox IDs and per-finding mode/topic/label/status/detail, plus generated and edited final notes. Unticked or blank values mean no entry, not a negative finding.

## Guidance and references

The supplied teaching summary remains available in a searchable modal. GP and audit material has been removed. Slider descriptions are short summaries retained from the supplied starting tool; the full NHS scale wording is in the reference PDF. NHS source: https://www.england.nhs.uk/south/wp-content/uploads/sites/6/2022/02/rockwood-frailty-scale_.pdf

NZ CPG source: https://cpg.stjohn.org.nz/ . Individual links and selected documentation prompts were checked on 23 October 2026 and are listed with that date in LOCAL.cpgs. Coverage currently includes asthma, headache, myocardial ischaemia, fever, anaphylaxis, meningococcal septicaemia and major trauma triage. All NZ CPGs remain accessible from guidance search. Context suggestions use keywords from history, provisional diagnosis and differentials; mentions can include negation, so the clinician must confirm relevance. This is reference matching, not diagnostic decision support.

Red-flag statuses start blank. Present, Absent and Not assessed remain distinct. Only explicit selections appear in the note. Asthma, cardiac and fever prompts are selected items for documentation, not exhaustive guideline reproductions. Fever guidance includes age-dependent criteria; consult the full guideline, particularly for children. Check the live CPG for current complete criteria. The app never treats an unselected red flag as absent and never concludes that non-transport is safe.

## Checks

Automated note-generation checks cover blank omission, frailty placement, social choices, referral tags, diagnosis reasoning, pathway output, non-transport conditional text and editable output. Browser checks cover header navigation, both assessment panels, structured finding selection, the embedded NHS PDF, contextual CPG prompts, referral checkboxes and clipboard output. Validate with the actual tablet and ePRF before operational use.
