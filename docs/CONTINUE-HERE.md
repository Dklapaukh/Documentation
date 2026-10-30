# Paramedic Notes — continuation handover

Updated 31 October 2026. Read this first and open the latest canonical Site source before editing. Do not rebuild from a screenshot or a previous zip.

## App and workflow

- Site project: `appgprj_6adb085265e48191b103204ad4241d56`
- Live app: https://paramedic-notes-tablet.danyaklapaukh.chatgpt.site
- Canonical checkout when retained: `/workspace/sites/paramedic-notes`
- Follow the Sites skill and `AGENTS.md`; keep current access settings.
- Static source in `dist/`; build with `python3 tools/build-production.py`; publish `out/` only, using the Sites source helper. `dist/` includes the inactive full source collection and must not be published directly.
- No backend, AI recommendations, conflict detection or full collection import in this iteration.

## Current complete state

- 55 reference pilot: 45 EAS medicine monographs, eight guidelines, two standalone checklists. Clinical source wording remains immutable, with separate interaction annotations.
- 92 adult dose clocks plus tenecteplase and enoxaparin table selection. Single-route fixed clocks log in place; alternative routes and variable/conditional amounts require actual-dose/route confirmation. Existing weight doses require weight and actual-dose confirmation, with published rounding only. Infusions remain text. Clocks are compact and in Dosage, not Administration.
- Latest first EAS expansion: clopidogrel, ibuprofen, loratadine, prednisone/prednisolone, ticagrelor. See `docs/eas-medicine-dose-batch-1.md`.
- Prednisone and prednisolone are separate actual drug identities. The official EAS reference is combined; the separate ECP edition is not imported or substituted. User explicitly deferred ECP content. Future Medicines destinations: EAS / ECP / Calculator; ECP and Calculator tabs not yet built.
- Latest addition: 34 paediatric drug-table links across 20 current references expand matching tables immediately below the source text. Fixed values fill Add Drug without recording. Ranges require actual dose, multi-route rows require route. Prednisone/prednisolone table rows are distinct. No calculator or automatic weight selection. See `docs/paediatric-inline-tables.md`.
- Latest bounded release: 74 additional EAS dosage clocks across 33 existing references (56 fixed amounts, 18 explicit actual-dose entries), ten enoxaparin SC table cells, and blue IV / amber IM paediatric tables. All 45 EAS monographs were already published; no ECP or new indication-pathway content was added. See `docs/remaining-eas-medications.md` for coverage, source-only exceptions and verification.
- Existing notes, vitals/GCS, draft preservation, checklist logging/filter, intervention delete/Edit/Undo and historical saved-case compatibility remain intact. Main section is Drugs & Interventions; sidebar Records table remains Interventions.

## Constraints to preserve

- Word-for-word published wording, doses, punctuation, table cells and source metadata. No clinical guesses or generic partial-name linking. Show source edition/date; identify unverified/new sources.
- Modern off-white compact UI, minimise scrolling, consistent controls. Sidebar changes must preserve other app areas.
- Medicines/checklists excluded from Guidelines used. Falls flag tables integral to the guideline, flat styling, not standalone checklists. Standalone checklists retain shared unique identity and checked state.
- Viewing a reference or selecting a dose does not administer. Repeated administrations are separate events. Actual dose/time and entry time remain separate. Frozen source snapshots preserve historical records.
- Back below search restores source reading position/open sections. Preserve unrelated entry drafts and notes during navigation.

## Focused checks

Always build first. For a dose-table change:

```
python3 tests/paediatric-source.py
node tests/paediatric-tables.cjs
node tests/dosage-controls.cjs
node tests/dose-pilot.cjs
node tests/medicine-dose-batch.cjs
node tests/remaining-medicines.cjs
python3 tests/medicine-import.py
```

Known baseline failure: `tests/production-scope.cjs` predates the expanded pilot and fails “exactly three selection choices” on untouched canonical v52 too. Do not report it as a new regression; see the latest release note.

Add browser checks for the changed interaction. Broader tests are warranted for affected workflow/record/navigation changes; avoid repeating unchanged checks or re-downloading retained PDFs unnecessarily. Browser automation uses CUA through the Sites managed preview only.

## Next work requires a concrete user scope

First collect user acceptance findings in one batch. Further EAS dose integration, ECP tab/import and a standalone paediatric calculator are possible later tasks, not automatically authorised by this handover. Prefer one bounded feature or one named medicine batch per task. Keep this handover current after each completed release and report only changes, checks and unresolved items.
