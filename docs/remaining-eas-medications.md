# Remaining EAS medicine dose controls — 31 October 2026

Baseline: canonical Site version 52, commit `c3b448db39fd9ad62b2925bfcd2ee2e1104c5dcc`. All 45 EAS medicine monographs were already published. This release interprets the requested remaining medications as the remaining dose-control integration in that existing EAS collection. ECP and the Calculator remain deferred.

Added 74 dosage clocks across 33 existing references: 56 fixed amounts and 18 actual-dose entries for ranges, route-dependent amounts or conditional doses. There are now 92 clocks in total. Existing adult weight calculations are unchanged; no new weight, dilution, infusion or pump calculator was added. Enoxaparin gains ten selectable SC table cells in its existing monograph, reusing the tenecteplase selection workflow.

Single-route fixed amounts record in place. Alternative routes open the existing confirmation form and require the actual route. Variable/conditional amounts start blank with the correct unit and require actual dose/time confirmation. The source remains beside the clock. No range endpoint, cumulative maximum, reduced dose, weight, age, caution or contraindication status is automatically selected. The original wording, conditions, cautions and source metadata are retained separately from actual administration. No automatic repeats are introduced.

The enoxaparin table fills Add Drug without recording or inferring patient weight/age. The main Record action confirms administration. Table labels use SC, and medicine identity is retained during existing provenance cleanup.

## Paediatric route colours

IV tables use blue borders, headings, column headers and dose buttons; IM tables use amber. IM/PO and IM/SC source rows use the IM colour but keep both published route labels and require actual-route selection. Other routes retain the neutral existing treatment. All original 195 table rows and 34 links remain unchanged. Colours are supplementary to text and do not select a route.

## Published coverage

| EAS reference | New clocks | New table cells |
| --- | ---: | ---: |
| CPG EAS 14.17 · GTN (Glyceryl Trinitrate) Spray - EAS | 4 | 0 |
| CPG EAS 14.41 · Ropivacaine 0.75% - EAS | 2 | 0 |
| CPG EAS 14.25 · Lignocaine 1% - EAS | 1 | 0 |
| CPG EAS 14.43 · Sodium Bicarbonate 8.4% - EAS | 5 | 0 |
| CPG EAS 14.2 · Adenosine - EAS | 2 | 0 |
| CPG EAS 14.4 · Amiodarone - EAS | 2 | 0 |
| CPG EAS 14.7 · Atropine - EAS | 1 | 0 |
| CPG EAS 14.8 · Calcium Chloride - EAS | 3 | 0 |
| CPG EAS 14.49 · Cefazolin - EAS | 1 | 0 |
| CPG EAS 14.9 · Ceftriaxone - EAS | 2 | 0 |
| CPG EAS 14.11 · Droperidol - EAS | 9 | 0 |
| CPG EAS 14.12 · Enoxaparin - EAS | 1 | 10 |
| CPG EAS 14.13 · Fentanyl - EAS | 4 | 0 |
| CPG EAS 14.15 · Glucagon - EAS | 1 | 0 |
| CPG EAS 14.16 · Glucose Gel - EAS | 1 | 0 |
| CPG EAS 14.20 · Hydrocortisone - EAS | 1 | 0 |
| CPG EAS 14.22 · Ipratropium - EAS | 1 | 0 |
| CPG EAS 14.24 · Labetalol - EAS | 2 | 0 |
| CPG EAS 14.51 · Levetiracetam - EAS | 1 | 0 |
| CPG EAS 14.27 · Magnesium Sulphate - EAS | 4 | 0 |
| CPG EAS 14.28 · Metaraminol - EAS | 2 | 0 |
| CPG EAS 14.29 · Methoxyflurane - EAS | 1 | 0 |
| CPG EAS 14.52 · Metoprolol Tartrate - EAS | 1 | 0 |
| CPG EAS 14.32 · Morphine - EAS | 3 | 0 |
| CPG EAS 14.33 · Naloxone - EAS | 2 | 0 |
| CPG EAS 14.34 · Olanzapine - EAS | 2 | 0 |
| CPG EAS 14.36 · Oxytocin - EAS | 2 | 0 |
| CPG EAS 14.37 · Paracetamol - EAS | 2 | 0 |
| CPG EAS 14.40 · Rocuronium - EAS | 2 | 0 |
| CPG EAS 14.42 · Salbutamol - EAS | 2 | 0 |
| CPG EAS 14.44 · Suxamethonium - EAS | 1 | 0 |
| CPG EAS 14.46 · Tramadol - EAS | 1 | 0 |
| CPG EAS 14.47 · Tranexamic Acid - EAS | 5 | 0 |

## Source-only instructions retained

Adrenaline and midazolam monographs direct dosing to individual indication guidelines; those cross-references remain unchanged. GTN IV and other infusion-rate instructions remain reading-only. Amiodarone tachydysrhythmia and oxytocin IV infusions are not converted into bolus clocks. RSI cross-references, maximum-only lignocaine SC wording, salbutamol MDI breath/puff sequence and four broader medicine-context guidelines retain their existing workflows. This release does not import indication pathways or invent missing doses. The separate paediatric fixed-age passages remain published text; their table links and existing selectors are unchanged.

## Provenance and checks

- Retained official 28 October 2026 snapshot reused; no new clinical edition or independent clinical sign-off is claimed. Each added specification pins the exact source hash and leaf passage; source drift fails the build and disables runtime bindings.
- All 55 original native bodies/hashes, 172 original PDF pages, 195 paediatric table rows and 34 complete five-band link subsets pass independent source comparisons.
- Five focused JavaScript suites pass: paediatric tables (504 checks), dosage placement/table selection (67), adult dose pilot (1,148), first medicine batch (57), remaining medicines (584), plus source comparisons. Eleven existing documentation, recording, navigation, medicine and Pocket/tutorial suites also pass.
- `tests/production-scope.cjs` fails at its obsolete “exactly three selection choices” assertion on both the untouched canonical version and this release. It predates the expanded pilot and source-PDF companion. It was not changed as part of this bounded task.
- Browser QA: both ondansetron route colours and computed header/button colours; 20 kg IM selection fills 2 mg IM without an event; cefazolin clock logs one 1 g IV event; hydrocortisone blocks missing route and logs 100 mg IM only after selection; fentanyl actual-dose entry starts blank and logs confirmed 25 mcg IV; enoxaparin older 70–79 kg cell fills 60 mg SC with zero events before Record.
- No physical tablet testing performed.

## GitHub package

The upload ZIP contains the generated production app with index.html at the repository root, plus this release note and continuation handover. It excludes the inactive full CPG collection and Site credentials/configuration. The complete editable source and retained original CPG sources remain in the canonical Site repository.
