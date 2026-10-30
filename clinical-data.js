/* Local clinical configuration. Reviewed 25 October 2026, NZ time.
 * Sources are the current NZCPG site/PDF exports (24 September 2026),
 * Royal College of Physicians NEWS2 (2017), and the official GCS assessment aid.
 * These lists prioritise references, never record an administration or procedure.
 */
const DRUG_NAMES = ["0.375% ropivacaine", "0.9% sodium chloride", "1% lignocaine", "10% glucose", "8.4% sodium bicarbonate", "Adenosine", "Adrenaline", "Amiodarone", "Aspirin", "Atropine", "Calcium chloride", "Cefazolin", "Ceftriaxone", "Clopidogrel", "Droperidol", "Enoxaparin", "Fentanyl", "Fentanyl and ketamine", "Glucagon", "Glucose gel", "GTN", "Hydrocortisone", "Ibuprofen", "Ipratropium", "Ketamine", "Labetalol", "Levetiracetam", "Loratadine", "Magnesium", "Metaraminol", "Methoxyflurane", "Metoprolol tartrate", "Midazolam", "Morphine", "Naloxone", "Olanzapine", "Ondansetron", "Oxygen", "Oxytocin", "Paracetamol", "Prednisolone", "Prednisone", "Rocuronium", "Salbutamol", "Suxamethonium", "Tenecteplase", "Ticagrelor", "Tramadol", "Tranexamic acid"];
const GUIDELINES_USED={};
const CARE_CONFIG = {
 checked:'2026-10-25',
 newsSource:'https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/',
 newsChart:'https://www.rcp.ac.uk/media/alxev00t/news2-chart-1_the-news-scoring-system_0_0.pdf',
 newsCredit:'Royal College of Physicians. National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS. Updated report of a working party. London: RCP, 2017.',
 gcsSource:'https://www.glasgowcomascale.org/downloads/GCS-Assessment-Aid.pdf',
 rsiSource:'https://cpg.stjohn.org.nz/tabs/guidelines/intubation-and-ventilation/page/rsi-rapid-sequence-intubation-eas',
 paedSource:'https://cpg.stjohn.org.nz/tabs/guidelines/paediatrics-eas/page/paediatric-equipment-and-drug-doses-eas',
 rsiDrugs:['Fentanyl','Ketamine','Rocuronium','Suxamethonium'],
 rsiActions:['RSI preparation checklist','Preoxygenation','Tracheal intubation','Waveform capnography','Post-intubation checklist'],
 vitals:{
  gcs:{label:'GCS',unit:'/15',min:3,max:15,step:1,start:15},
  rr:{label:'RR',unit:'/min',min:0,max:100,step:1,start:16},
  hr:{label:'HR',unit:'/min',min:0,max:300,step:1,start:80},
  spo2:{label:'SpO₂',unit:'%',min:0,max:100,step:1,start:98},
  o2flow:{label:'O₂ flow',unit:'L/min',min:0,max:999,step:.1,start:0},
  sbp:{label:'Systolic BP',unit:'mmHg',min:0,max:350,step:1,start:120},
  dbp:{label:'Diastolic BP',unit:'mmHg',min:0,max:250,step:1,start:80},
  temp:{label:'Temp',unit:'°C',min:0,max:50,step:.1,start:37},
  bgl:{label:'BGL',unit:'mmol/L',min:0,max:60,step:.1,start:5},
  etco2:{label:'EtCO₂',unit:'mmHg',min:0,max:999,step:.1,start:0},
  crt:{label:'CRT',unit:'s',min:0,max:999,step:.1,start:0}
 },
 gcs:{
  eye:{label:'Eyes',options:[[4,'Spontaneous','Eyes open without a stimulus'],[3,'To sound','Opens after a spoken or shouted request'],[2,'To pressure','Opens after fingertip pressure'],[1,'None','No eye opening; no interfering factor']]},
  verbal:{label:'Verbal',options:[[5,'Orientated','Correct name, place and date'],[4,'Confused','Coherent speech, but disorientated'],[3,'Words','Recognisable individual words'],[2,'Sounds','Moaning or groaning only'],[1,'None','No sound; no interfering factor']]},
  motor:{label:'Motor',options:[[6,'Obeys commands','Follows a two-part instruction'],[5,'Localising','Hand reaches above clavicle toward head/neck stimulus'],[4,'Normal flexion','Rapid elbow flexion without predominantly abnormal features'],[3,'Abnormal flexion','Elbow flexion with predominantly abnormal features'],[2,'Extension','Elbow extension'],[1,'None','No arm/leg movement; no interfering factor']]}
 }
};
