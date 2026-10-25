"""Rebuild the in-app text from the original packaged NZCPG pages.
Run with PyMuPDF installed; no Python is needed to use the website.
Body font and heading styles are checked explicitly to avoid copying page chrome.
"""
from pathlib import Path
import json, re
import fitz
root=Path(__file__).resolve().parents[1]
asset=root/'dist' if (root/'dist').exists() else root
result={}
for path in sorted((asset/'cpg-drugs').glob('*.pdf')):
 sections=[];current=None
 for page in fitz.open(path):
  for block in page.get_text('dict',sort=True)['blocks']:
   lines=[]
   for line in block.get('lines',[]):
    spans=[s for s in line['spans'] if 9 <= s['size'] <= 14]
    if not spans:continue
    text=' '.join(s['text'].strip() for s in spans).strip()
    if text:lines.append((text,all(('Heavy'in s['font']or'Bold'in s['font'])for s in spans)))
   if not lines:continue
   if all(heading for _,heading in lines):
    title=' '.join(t for t,_ in lines)
    if title=='More Information':continue
    current={'title':title,'paragraphs':[]};sections.append(current)
   else:
    if current is None:current={'title':'Guideline','paragraphs':[]};sections.append(current)
    # Original PDF body paragraphs, including indented bullets, stay in source order.
    current['paragraphs'].append(' '.join(t for t,_ in lines))
 sections=[s for s in sections if s['paragraphs']]
 # General treatment pages have an unheaded initial treatment section.
 if sections and sections[0]['title']=='Guideline':sections[0]['title']='Dose / treatment'
 # The current morphine medicine page delegates doses to analgesia EAS 1.18.
 if path.name=='eas-14-32.pdf':
  sections.append({'title':'Dose','paragraphs':[
   'Analgesia for acute pain · EAS 1.18.',
   'IV bolus dosage: 1-5 mg IV for an adult. See the paediatric drug dose tables for a child. Repeat as required every five minutes.',
   'IM and SC dosage: 5-10 mg IM/SC for an adult. See the paediatric drug dose tables for a child. Halve the dose if the patient is frail or has signs of shock. Repeat as required, every 20 minutes, up to a maximum of three doses.'
  ]})
 assert sections,path
 result[str(path.relative_to(asset))]=sections
(asset/'drug-guidance-content.js').write_text('/* Original NZCPG text, extracted from packaged source PDFs; checked 25 Oct 2026.\n * No patient-specific recommendation or dose selection is generated. */\nconst DRUG_GUIDELINE_CONTENT = '+json.dumps(result,ensure_ascii=False,indent=1)+';\n')
source=root/'docs/non-transport-source.json'
if source.exists():
 with (asset/'drug-guidance-content.js').open('a') as f:f.write('const NON_TRANSPORT_CHECKLIST = '+json.dumps(json.loads(source.read_text()),ensure_ascii=False,indent=1)+';\n')
print(len(result),'guidelines extracted')
