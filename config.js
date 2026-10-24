/* LOCAL CONFIGURATION
 * Edit the labels and option lists here for your service.
 * GUIDANCE preserves the supplied teaching document; review local policy references.
 * Topic field IDs use the original topic and item titles: keep these stable for analysis.
 */
const CONFIG = {
 schemaVersion: "1.0",
 historySources: ["Patient", "Family / whānau", "Carer", "Bystander", "Clinical record", "Other"],
 dispositions: ["Transported", "Not transported — agreed plan", "Declined recommended transport", "Other"],
 referralTypes: ["Falls", "Vulnerable people", "Fire safety", "Medical alarm", "GP", "Other"],
 referralStatuses: ["Discussed", "Offered", "Declined", "Sent", "Accepted", "Pending"],
};
const GUIDANCE = {
  "SUBJECTIVE|Neurological": [
    "Headache: Ask about location and OPQRST (Onset, Provoking, Quality, Radiation, Severity, Timing).",
    "Dizziness / vertigo: Ask about light-headedness, spinning sensation, unsteadiness, and any triggers (e.g. position change).",
    "Visual disturbance: Ask about blurred vision, double vision, and any visual field loss.",
    "Sensory change: Ask about numbness, tingling, or altered sensation, and where it is felt.",
    "Weakness / coordination: Ask about weakness, new onset poor coordination, or difficulty using a limb.",
    "Speech / language: Ask about slurred speech, difficulty finding words, or difficulty understanding speech.",
    "Cognitive change: Ask whether the patient feels confused, disorientated, or has changes in short-term memory.",
    "Seizure-like activity: Ask about witnessed shaking, staring/unresponsiveness, loss of awareness, post-episode confusion, tongue biting, or incontinence.",
    "Gait / movement symptoms: Ask about tremor, involuntary movements, unsteady gait, falls, or new onset of difficulty walking.",
    "Associated symptoms: Ask about neck pain or stiffness, photophobia, nausea, or vomiting.",
    "Relevant history: Ask about symptom onset time and progression, last known well, recent head/neck trauma, falls, fever/infection symptoms, alcohol or drug use/overdose, diabetes/hypoglycaemia risk, seizure history, stroke/TIA history, anticoagulant use, and recent medication changes."
  ],
  "SUBJECTIVE|HEENT (Head, Eyes, Ears, Nose, Throat)": [
    "Headache: Ask about location and OPQRST (Onset, Provoking/Palliating, Quality, Radiation, Severity, Timing).",
    "Nasal symptoms: Ask about congestion/obstruction, discharge, sneezing, or nosebleeds.",
    "Ear symptoms: Ask about ear pain, fullness/pressure, tinnitus, discharge, reduced hearing, or dizziness.",
    "Throat symptoms: Ask about sore throat, hoarseness/voice change, and pain or difficulty swallowing.",
    "Eye symptoms: Ask about pain, redness, itch, watering, light sensitivity, discharge, or vision change.",
    "Facial concerns: Ask about pain location (including teeth if relevant), facial pressure, swelling, numbness, and any recent facial or head trauma.",
    "Relevant history: Ask about recent Upper Respiratory Tract Infections (URTIs), allergy symptoms/exposures, sinus/ear infections, contact lens use (if eye symptoms), and recent dental work (if facial/dental pain)."
  ],
  "SUBJECTIVE|Respiratory System (RS)": [
    "Swallowing difficulty (dysphagia): Ask about difficulty swallowing solids/liquids, and any pain with swallowing.",
    "Voice changes: Ask about hoarseness, muffled voice, or change from baseline.",
    "Throat tightness: Ask about throat tightness or sensation of swelling/obstruction.",
    "Secretions: Ask about difficulty swallowing saliva, drooling, or trouble clearing secretions.",
    "Infective symptoms: Ask about fever, sore throat, or a recent upper respiratory infection.",
    "Recent airway risk: Ask about smoke/chemical exposure, face/neck trauma, recent intubation, or airway surgery.",
    "Shortness of breath (SOB): Ask about onset, duration, triggers, and exertional pattern.",
    "Cough: Ask if dry or productive. Note sputum colour and frequency/amount.",
    "Chest symptoms: Ask about wheeze, chest tightness, or pain on inspiration/expiration.",
    "Dyspnoea patterns: Ask about orthopnoea and paroxysmal nocturnal dyspnoea (PND) and document any observed Cheyne–Stokes respirations.",
    "Relevant medical history: Ask about recent respiratory infections, smoking history, asthma/COPD, and occupational/environmental exposures."
  ],
  "SUBJECTIVE|Cardiovascular System (CVS)": [
    "Chest pain: Ask about location and OPQRST (Onset, Provoking, Quality, Radiation, Severity, Timing).",
    "Palpitations: Ask about fluttering or abnormal heartbeats, what they feel like, onset and duration, frequency/episodes, triggers, and associated symptoms (e.g. dizziness, chest pain, SOB).",
    "Syncope / presyncope: Ask about dizziness, fainting, near-fainting circumstances (exertion/postural), and recovery.",
    "Breathlessness / exercise tolerance: Ask about shortness of breath, degree of limitation (e.g. walking distance, climbing stairs), reduced exercise tolerance, and any recent change.",
    "Peripheral swelling: Ask about ankle/leg swelling and recent weight gain.",
    "Vascular symptoms: Ask about leg cramps or pain on walking, calf pain, unilateral swelling, or colour change.",
    "Relevant history: Ask about IHD/MI, stents/PCI, valve disease, rheumatic fever, heart failure, arrhythmias, cardiac procedures, current cardiovascular medications, and medication compliance."
  ],
  "SUBJECTIVE|Gastrointestinal system (GIT)": [
    "Abdominal pain: Ask about location and OPQRST (Onset, Provoking, Quality, Radiation, Severity, Timing).",
    "Nausea / vomiting: Ask about frequency, amount, contents, and presence of blood or bile.",
    "Appetite and digestion: Ask about reduced appetite, dietary intolerance, bloating, indigestion, or heartburn.",
    "Bowel habit: Ask about diarrhoea/constipation, stool colour, and any blood or mucus.",
    "Reflux and gas: Ask about reflux, belching, or flatulence.",
    "Weight change: Ask about unexplained weight loss or gain.",
    "Recent history: Ask about travel, suspected food poisoning, alcohol intake, or diet changes.",
    "Relevant history: Ask about ulcers, hepatitis, liver disease, Inflammatory bowel disease IBD/ irritable bowel syndrome IBS, gallstones, or abdominal surgery."
  ],
  "SUBJECTIVE|Renal": [
    "Urinary symptoms: Ask about dysuria, frequency, urgency, nocturia, or incontinence.",
    "Pain: Ask about location and OPQRST (Onset, Provoking, Quality, Radiation, Severity, Timing).",
    "Urine changes: Ask about haematuria, cloudy urine and odour",
    "Volume changes: Ask about reduced output or increased output (polyuria).",
    "Systemic symptoms: Ask about fever, rigors, nausea/vomiting, or malaise.",
    "Fluid balance: Ask about oedema and recent weight gain (fluid retention).",
    "Hydration and intake: Ask about usual fluid intake, recent dehydration, or increased thirst.",
    "Relevant history: Ask about recurrent urinary tract infections (UTIs), renal stones, catheterisation including indwelling or suprapubic catheters (IDC/SPC), prostate disease/history, or known kidney disease."
  ],
  "SUBJECTIVE|Female Reproductive System": [
    "Pain: Ask about location and OPQRST (Onset, Provoking, Quality, Radiation, Severity, Timing).",
    "Vaginal bleeding (only if clinically appropriate): Ask about amount, duration, timing in relation to cycle or pregnancy, and presence of clots/spotting.",
    "Vaginal discharge (only if clinically appropriate): Ask about colour, odour, consistency, quantity, and associated itch/irritation.",
    "Menstrual history: Ask about Last Menstrual Period (LMP), cycle length, duration, flow, regularity, and any recent changes.",
    "Pregnancy status: Ask if pregnancy is known or possible, estimated gestation (if known), foetal movements (normal/reduced), presence of contractions (frequency/duration), urge to push, rupture of membranes, and any known pregnancy complications.",
    "Obstetric history (only if clinically appropriate): Ask about gravida/para status, prior miscarriage, ectopic pregnancy, preterm birth, C-section, contractions (frequency/duration), vaginal bleeding or loss of fluid.",
    "Contraception (only if clinically appropriate): Ask about type, duration, adherence, recent changes, and any complications.",
    "Associated urinary / bowel symptoms: Ask about dysuria/urgency, constipation/diarrhoea, or rectal pressure.",
    "Relevant history: Ask about sexually transmitted infections, endometriosis, polycystic ovary syndrome, ectopic pregnancy, miscarriage, and previous gynaecological or obstetric surgeries."
  ],
  "SUBJECTIVE|Male Genitourinary System": [
    "Urinary symptoms: Ask about dysuria, frequency, urgency, nocturia, hesitancy, weak or intermittent stream, straining, terminal dribbling, incomplete emptying, urinary retention, and incontinence.",
    "Pain (only if clinically appropriate): Ask about location and OPQRST (Onset, Provoking, Quality, Radiation, Severity, Timing), including suprapubic, perineal, testicular, lower back, or pelvic pain.",
    "Discharge (only if clinically appropriate): Ask about colour, odour, consistency, and any presence of blood.",
    "Genital changes (only if clinically appropriate): Ask about itching, redness, swelling, lumps, lesions, or trauma.",
    "Urine characteristics (only if clinically appropriate): Ask about haematuria (visible/non-visible), cloudy urine, odour, reduced stream, or acute inability to pass urine.",
    "Relevant history: Ask about STIs, prostatitis, benign prostatic hyperplasia (BPH), prostate cancer, prior urinary retention, catheter use, recent urological procedures, or trauma.",
    "Medication and lifestyle: Ask about erectile dysfunction medications, alpha-blockers or 5 alpha reductase inhibitors, current sexual activity, and recent partner symptoms."
  ],
  "SUBJECTIVE|Endocrine System": [
    "Energy levels: Ask about fatigue, lethargy, or generalised weakness.",
    "Weight change: Ask about unexplained weight loss or gain (without changes in diet/activity).",
    "Temperature tolerance: Ask about heat/cold intolerance, excessive sweating, or shivering.",
    "Appetite / thirst / urination: Ask about increased hunger (polyphagia), increased thirst (polydipsia), and increased urination (polyuria).",
    "Mood and sleep: Ask about irritability, anxiety, low mood, and sleep disturbance.",
    "Relevant endocrine history: Ask about known diabetes, thyroid disease, and adrenal or pituitary disorders.",
    "Family history: Ask about diabetes, thyroid dysfunction, or inherited endocrine conditions."
  ],
  "SUBJECTIVE|Haematological System": [
    "Energy and wellbeing: Ask about fatigue, weakness, or reduced exercise tolerance.",
    "Bleeding tendency: Ask about easy bruising, frequent nosebleeds (epistaxis), gum bleeding, or prolonged bleeding after minor cuts/procedures.",
    "Menstrual history (if applicable): Ask about heavy or prolonged menstruation.",
    "Infection history: Ask about recurrent, prolonged, or severe infections, and poor wound healing.",
    "Systemic symptoms: Ask about night sweats, unexplained weight loss, fever, or chills.",
    "Relevant medical history: Ask about anaemia, clotting disorders, autoimmune disease, or malignancy.",
    "Treatment history: Ask about chemotherapy, radiotherapy, immunotherapy, or immunosuppressant use.",
    "Recent events: Ask about recent viral illness, vaccination, transfusion, or travel.",
    "Family history: Ask about known blood disorders, malignancy, or autoimmune conditions."
  ],
  "SUBJECTIVE|Musculoskeletal System (MSK)": [
    "Pain: Ask about location and OPQRST (Onset, Provoking, Quality, Radiation, Severity, Timing).",
    "Stiffness: Ask about presence, timing (e.g. morning stiffness), duration, and impact on movement.",
    "Weakness: Ask about localised or generalised weakness, whether it is limited by pain, and any associated numbness/tingling.",
    "Joint symptoms: Ask about swelling, redness, warmth, locking, clicking, giving way, or instability.",
    "Mobility and function: Ask about difficulty walking, climbing stairs, lifting/carrying, or completing self-care tasks.",
    "Deformity or limitation: Ask about new deformity, reduced range of movement, change in posture, or new limb limitation.",
    "Injury history: Ask about recent trauma, falls, overuse, or sports injury, and immediate pain/swelling after injury.",
    "Relevant history: Ask about arthritis, gout, osteoporosis, previous fractures, surgeries, or joint replacements."
  ],
  "SUBJECTIVE|Skin / Integumentary System": [
    "Symptoms: Ask about rash, itching, redness, burning, or pain.",
    "Lesions or wounds: Ask about new lumps, ulcers, bruises, sores, or changes in existing lesions (size, colour, shape).",
    "Discharge: Ask about bleeding, oozing, pus, odour, or exudate from wounds/lesions.",
    "Swelling or inflammation: Ask about presence, location, spread, and rapid progression.",
    "Injury / exposure history: Ask about recent trauma, burns, bites/stings, new products, or chemical/irritant exposure.",
    "Past skin conditions: Ask about eczema, psoriasis, dermatitis, cellulitis, fungal infections, acne, or chronic wounds.",
    "Allergy history: Ask about allergies to foods, medications, topical agents, or environmental triggers.",
    "Changes in appearance: Ask about changes in skin colour, texture, dryness, or temperature.",
    "Healing concerns: Ask about delayed healing, chronic ulcers, or previous infection at the site."
  ],
  "SUBJECTIVE|Mental Health Assessment": [
    "Mood: Ask about low/elevated mood, anxiety and irritability.",
    "Thought content / risk: Ask about hopelessness or worthlessness, and suicidal or self-harm thoughts.",
    "Perceptual experiences: Ask about hallucinations (auditory/visual) and feelings of paranoia.",
    "Beliefs: Ask about unusual beliefs or fixed false beliefs (delusions) affecting behaviour.",
    "Cognition: Ask about poor concentration, memory problems, or indecisiveness.",
    "Sleep / appetite / energy: Ask about changes in sleep, appetite/weight, and energy levels.",
    "Psychosocial stressors: Ask about relationship, work/financial stress, trauma, or recent loss.",
    "Medication and substance use: Ask about adherence to prescribed meds, recent changes, and alcohol/drug use."
  ],
  "SUBJECTIVE|Social / Functional / Environmental": [
    "Living situation: Ask who they live with (alone/family/supported accommodation/residential facility).",
    "Home safety: Ask about access (stairs/steps), obstacles/clutter, lighting, heating/cooling, hygiene, and falls risks.",
    "Support systems: Ask what supports are available (family/friends/carers/neighbours/community services) and how often.",
    "Activity/ADLs: Ask about ability to wash, dress, feed, toilet, and mobilise independently.",
    "Mobility: Ask about baseline mobility, use of aids (stick/frame/wheelchair), and level of assistance required.",
    "Mental wellbeing: Ask about mood, isolation, coping, and recent stressors.",
    "Vulnerability concerns: Ask about safety at home and screen for concerns of domestic violence, neglect/self-neglect, exploitation, unsafe environment, or caregiver strain."
  ],
  "OBJECTIVE|Neurological": [
    "Level of consciousness: Assess using AVPU or the Glascow Coma Scale (GCS).",
    "Orientation: Assess orientation to person, place, and time.",
    "Speech: Assess clarity, fluency, comprehension, and rate.",
    "Pupils: Assess size, symmetry, and reactivity to light (PERLA) - Pupils Equal Reactive to Light and Accommodation",
    "Cranial nerves: Assess extraocular movements, facial symmetry, and speech/voice quality (± swallow if indicated).",
    "Motor function: Assess strength, tone, pronator drift, and coordination.",
    "Sensory function: Assess light touch and pinprick (± temperature/proprioception if indicated).",
    "Gait / balance: Assess stance, walking, and unsteadiness.",
    "General observation: Observe for seizure activity, incontinence, or signs of head/neck trauma.",
    "BE-FAST (objective screen): Assess balance, eyes/visual fields, face symmetry, arm drift/strength, and speech."
  ],
  "OBJECTIVE|HEENT (Head, Eyes, Ears, Nose, Throat)": [
    "Head/face: Inspect for trauma, swelling, bruising, deformity, asymmetry, tenderness.",
    "Eyes: Assess conjunctiva/sclera, pupils, extraocular movements, discharge. Note redness or swelling.",
    "Ears: Inspect external ear and canal; assess tympanic membrane appearance (if able). Note discharge.",
    "Nose: Inspect for mucosal swelling/redness, septum alignment (if visible), discharge, bleeding.",
    "Mouth/throat: Inspect mucosa moisture/colour, tonsil size, exudate, lesions, dental condition; note uvula position.",
    "Neck: Inspect/palpate for lymph node enlargement, thyroid swelling/tenderness. Assess tracheal position.",
    "Airway (visible/clinical): Assess patency, voice quality, drooling/secretions, visible oral/pharyngeal swelling. Note stridor/noisy breathing if present."
  ],
  "OBJECTIVE|Respiratory System (RS)": [
    "Speech and voice: Assess ability to speak full sentences and note hoarse or muffled voice.",
    "Airway patency and sounds: Assess for stridor, gurgling, snoring sounds, and audible wheeze.",
    "Work of breathing: Assess respiratory distress, accessory muscle use, retractions, tripod positioning.",
    "Respiratory pattern: Assess rate, rhythm, depth, and overall effort.",
    "Chest movement: Assess chest rise and fall, symmetry of expansion, and tracheal position.",
    "Swelling: Assess for lip, tongue, face, or visible mouth/throat swelling (angioedema).",
    "Secretions: Assess for drooling, pooling secretions, and ability to manage saliva.",
    "Neck: Assess for visible neck swelling, and tenderness.",
    "Skin signs: Assess for urticaria/flushing.",
    "Chest inspection: Assess for deformity, scars, surgical sites and chest expansion.",
    "Palpation: Assess for chest expansion, chest wall tenderness and subcutaneous emphysema.",
    "Percussion: Assess for resonant, dull, or hyperresonant notes.",
    "Auscultation: Assess air entry and note wheezes, crackles diminished or increased breath sounds.",
    "General observation: Assess colour (e.g., pallor/cyanosis)."
  ],
  "OBJECTIVE|Cardiovascular System (CVS)": [
    "Heart rate: Assess rate, rhythm, and regularity.",
    "Blood pressure: Assess blood pressure (include postural measurements if indicated).",
    "JVP: Assess pulsations and height above the sternal angle with the patient positioned at 45 degrees. Document the vertical height in centimetres.",
    "Pulses: Assess presence, strength, symmetry, and character.",
    "Skin and perfusion: Assess colour (pallor/cyanosis/mottling) and diaphoresis.",
    "Capillary refill / temperature: Assess capillary refill time and peripheral temperature.",
    "Auscultation: Assess heart sounds and note murmurs or rubs.",
    "Oedema: Assess for peripheral oedema (ankles), and sacral/tibial oedema if relevant."
  ],
  "OBJECTIVE|ECG": [
    "Rhythm and rate: Identify the rhythm (e.g. sinus or non-sinus) and classify rate as bradycardic, normal, or tachycardic. Note regularity and presence of ectopic beats.",
    "Conduction and intervals: Assess PR interval, QRS duration, and QT interval, noting any prolongation, shortening, AV block, or bundle branch block (BBB).",
    "Morphology and ischaemic changes: Assess QRS morphology and amplitude. Assess for ST segment elevation or depression, and T wave abnormalities (e.g. inversion, peaking, flattening).",
    "Other findings: Document pacing spikes, Q waves, or any other clinically relevant abnormalities."
  ],
  "OBJECTIVE|Gastrointestinal system (GIT)": [
    "General observation: Assess hydration status, skin colour, jaundice, level of distress, and overall appearance.",
    "Emesis / stool (if available): Assess and document vomitus (volume/colour, blood or bile) and stool description.",
    "Inspection: Assess for distension, asymmetry, scars, visible pulsations, hernias, or bruising.",
    "Auscultation: Assess bowel sounds (present/absent, frequency, character).",
    "Palpation: Assess for tenderness, guarding, rebound tenderness, rigidity, and palpable masses.",
    "Percussion: Assess for tenderness, tympany, dullness and signs of fluid/ascites (as indicated).",
    "Special signs (as indicated): Assess Murphy’s sign, Rovsing's sign, McBurney’s point tenderness, or other clinically relevant signs.",
    "Behavioural cues: Assess abdominal movement with respiration and facial expression/guarding during examination."
  ],
  "OBJECTIVE|Renal": [
    "Urine characteristics (if available): Assess colour, clarity, odour, and note blood/sediment.",
    "Urine output: If present, assess IDC/SPC patency, any leakage and record urine output if able.",
    "Suprapubic assessment: Assess for suprapubic tenderness or bladder distension/fullness.",
    "Flank assessment: Assess for flank tenderness and any percussion dullness."
  ],
  "OBJECTIVE|Female Reproductive System": [
    "General appearance: Assess pallor, distress, diaphoresis, and signs of haemodynamic compromise/shock (if relevant).",
    "Abdominal assessment: Assess for distension and inspect for scars/incisions",
    "Oedema (pregnancy-related): Assess for peripheral or facial oedema where relevant (e.g., pre-eclampsia concern).",
    "Obstetric assessment (only if clinically appropriate): Assess fundal height (if ≥20 weeks), signs of imminent delivery (e.g. crowning).  Screen for red flag symptoms (e.g. severe headache, visual disturbance, epigastric pain, sudden swelling, seizure activity). Assess for vaginal bleeding or rupture of membranes.",
    "Female genital observation (only if clinically appropriate): May be indicated for pregnancy-related presentations, urinary catheterisation, trauma, or urgent bleeding concerns. Perform only when clinically indicated, with informed consent, privacy and dignity, and a chaperone."
  ],
  "OBJECTIVE|Male Genitourinary System": [
    "General appearance: Assess distress, pallor, diaphoresis, and fever (if relevant).",
    "Abdominal assessment: Assess for suprapubic distension or tenderness.",
    "Male genital observation (only if clinically appropriate): Assess for visible lesions, discharge, swelling, bleeding, asymmetry, or trauma and perform with consent, privacy/dignity, and a chaperone.",
    "Catheter assessment (only if clinically appropriate): Assess catheter type/presence, patency, output, and urine colour/clarity/odour."
  ],
  "OBJECTIVE|Endocrine System": [
    "Skin / hair: Assess for pigmentation changes, bruising, dryness, and hair loss.",
    "Eyes: Assess for bulging/protrusion of one or both eyes (exophthalmos).",
    "Hands: Assess for tremor.",
    "Neck (thyroid): Assess for thyroid enlargement, nodules, or tenderness (inspect and palpate).",
    "Body composition and Cushingoid features: Assess for central adiposity and features suggestive of Cushing’s syndrome (as clinically indicated).",
    "Extremities: Assess for muscle wasting, oedema, and signs of peripheral neuropathy.",
    "Feet (if diabetic risk/known diabetes): Assess for ulcers, infection, and reduced sensation."
  ],
  "OBJECTIVE|Haematological System": [
    "General appearance: Assess for pallor, jaundice, and signs of acute illness.",
    "Skin: Assess for petechiae, purpura, ecchymosis (bruising), or rash.",
    "Mucous membranes: Assess oral mucosa for pallor, bleeding, ulcers, or signs of infection.",
    "Bleeding sites: Assess for active bleeding or oozing from IV/catheter sites and wounds/surgical sites (if present)."
  ],
  "OBJECTIVE|Musculoskeletal System (MSK)": [
    "General observation: Assess posture, gait, use of aids, and overall mobility.",
    "Inspection: Assess for swelling, redness, bruising, deformity, scars, asymmetry, or muscle wasting.",
    "Palpation: Assess for tenderness, warmth, effusion, crepitus, and joint stability.",
    "Range of motion (ROM): Assess active and passive ROM, noting pain and limitation.",
    "Strength: Assess muscle strength (compare bilaterally where possible).",
    "Functional / gait assessment: Assess walking and weight-bearing (if safe), noting limp, guarding, or instability.",
    "Joint comparison: Assess symmetry, alignment, swelling, and temperature compared with the opposite side.",
    "Neurovascular status (distal): Assess distal pulses/capillary refill and distal sensation (± motor function) for all limbs.",
    "Supports/devices: Assess and document splints, braces, prostheses, or mobility aids in use."
  ],
  "OBJECTIVE|Skin / Integumentary System": [
    "General inspection: Assess skin colour, turgor, moisture, and overall integrity.",
    "Lesions: Assess site, size, shape, border, colour, distribution, and presence of crusting or discharge.",
    "Rash characteristics: Assess distribution (localised/generalised), blanching, raised vs flat, scaling, pustules, or petechiae/purpura.",
    "Wounds: Assess depth, exudate type/amount, odour, wound edges, surrounding erythema, and signs of infection.",
    "Palpation: Assess temperature, tenderness, and induration (if present).",
    "Nails and hair: Assess nail changes (colour, clubbing, pitting) and hair changes (loss, texture).",
    "Pressure areas / sites: Assess pressure areas, burns, surgical wounds, and IV/catheter sites for breakdown or infection.",
    "Clinical photography (if required): Assess suitability and document photographs per the WFA Clinical Photography Policy."
  ],
  "OBJECTIVE|Mental Health Assessment": [
    "Appearance: Assess hygiene, grooming, clothing, and posture.",
    "Behaviour: Assess engagement, eye contact, cooperation, agitation/withdrawal, and psychomotor activity (restless or slowed).",
    "Mood and affect: Assess observed mood and affect (appropriate, flat, reserved, or labile).",
    "Speech: Assess rate, volume, tone.",
    "Thought process: Assess whether thought appears logical/goal-directed, or disorganised.",
    "Orientation: Assess orientation to person, place, and time.",
    "Attention and memory: Assess attention and short-term recall.",
    "Insight and judgement: Assess the patient's insight into the condition/situation and judgement/decision-making. Note immediate safety risks."
  ],
  "OBJECTIVE|Social / Functional / Environmental": [
    "General appearance: Assess hygiene, grooming, and clothing appropriateness for the setting/weather.",
    "Interaction and behaviour: Assess engagement, cooperation, affect, signs of confusion, withdrawal, or agitation.",
    "Communication function: Assess ability to understand information, follow instructions, retain key details, and express needs.",
    "Functional status: Assess observed mobility/transfers and use of aids (e.g., sit-to-stand, walking if safe).",
    "Support presence: Assess and document presence/absence of carers, family, dependents, or support staff at bedside.",
    "Environmental safety (if assessed/known): Assess and document hazards or access issues noted during attendance (e.g., clutter, stairs, poor lighting) where observed.",
    "Assistive equipment: Assess current aids/equipment in use and any immediate need identified (e.g., walker, rails)."
  ],
  "DOCUMENTATION|History of Incident": [
    "PC (Presenting Complaint): The main reason for requesting ambulance assistance.",
    "HPC (History of Presenting Complaint): A summary of how the problem developed.",
    "Record subjective symptoms reported by the patient, grouped by relevant body systems (e.g., CNS, RS, CVS, ABDO, MSK)",
    "Include medically relevant family and social history, such as lifestyle factors and available support. This is a standard component of medical documentation and is particularly important in conditions such as cardiovascular disease."
  ],
  "DOCUMENTATION|Clinical Impression": [
    "Use this section to document:",
    "Objective clinical findings from your assessment, organised by relevant body systems (CNS, RS, CVS, ABDO, MSK).",
    "Impression: Your primary working diagnosis.",
    "Differential diagnosis: Other diagnoses you have considered.",
    "The ABC approach remains essential for the assessment and management of critically unwell patients. However, it should not be used as the sole documentation structure for all cases. For most patients, findings should be documented in body-system assessments to support comprehensive and accurate documentation.",
    "Avoid duplicating information that has already been recorded in the Vitals Obs/Treat tab. Where specifically relevant observations in free text help to illustrate the patient’s clinical journey, this is appropriate; however, the full set of vital signs should not be repeated in free text.",
    "Avoid documenting treatment outcomes, refusals, or safety-netting in the clinical impression. These should be documented in the \"Disposition\" tab.",
    "Specific research-related information (e.g. Telestroke assessments, PASTA, LAMS) should be documented in this section to ensure they are clearly captured and auditable."
  ],
  "DOCUMENTATION|Disposition Tab - Screen 1": [
    "Use this section to document the following:",
    "Treatment: Interventions provided and rationale for decision making.",
    "Result of Treatment: Patient response or outcome to the treatments provided.",
    "En Route: Events or changes during transport.",
    "Non transport advice:",
    "Follow CPG EAS 1.6 for non-transport assessments.",
    "Ensure the Competency checklist is completed.",
    "Ensure a detailed plan including specifics of the safety netting.",
    "When a patient refuses transport, provide a clear explanation including an outline of the advice given, the patient’s reasoning, and confirmation they have understood the risks.",
    "Ensure the ACS form is completed, ticked and signed by both the paramedic and the patient."
  ],
  "DOCUMENTATION|Disposition Tab - Screen 2": [],
  "DOCUMENTATION|Notes to GP": [
    "This defaults to \"Yes\" as standard. Untick if the patient does not want the ePRF sent to their GP. Include the reason for callout, key abnormal findings, treatments provided, and any specific requests/follow-up needed.",
    "If the patient’s NHI is unavailable and they are not being transported, please ensure the ‘Copy to GP’ option is set to ‘Not this time’, as the ePRF cannot be submitted otherwise."
  ],
  "DOCUMENTATION|Flag for audit": [
    "This function should be used to draw auditor attention to specific aspects of the ePRF. It should not be used as a standalone notification. Please clearly document the rationale and any actions taken (e.g. incident vaulted, Shift Manager notified, patient requires a care plan, email sent to the improvement.team@wfa.org.nz).",
    "This function is not intended for requesting feedback on an ePRF. If you would like feedback on the quality of your documentation, this can be obtained by discussing the case with your Shift Manager or by reviewing your quarterly ePRF feedback summary.",
    "The “Flag for Audit” function is not intended for reporting violence and aggression on scene. These incidents should be reported via Vault."
  ],
  "DOCUMENTATION|Non-transporting": [
    "Non-transporting patients carries clinical risk, and these decisions require careful consideration of all available information to ensure the patient can be safely managed outside of the Emergency Department. While non-transport may be appropriate, we cannot completely eliminate the risk of deterioration, so robust safety-netting is essential.",
    "We recommend providing two to three clear safety-netting pathways. Safety-netting goes beyond standard worsening advice and gives the patient specific, proactive plans to follow if their condition changes.",
    "Examples include:",
    "Arranging a timely GP appointment",
    "Having a family member or neighbour/friend check on the patient",
    "Asking a relative to call within a set timeframe",
    "CPA or nursing staff call back",
    "Booking an ECP follow-up appointment (If clinically appropriate)",
    "Family member to stay with the patient",
    "Worsening advice",
    "Patient Information leaflet."
  ]
};

/* v2 configuration. These identifiers are stable export/search keys.
 * CPG keywords suggest references only: they do not infer diagnoses or findings.
 * Red-flag prompts are a selected documentation aid, not a complete guideline.
 */
const LOCAL = {
 schemaVersion: '6.0',
 social: [
  {id:'lives_alone',label:'Lives alone',group:'home'},
  {id:'lives_with_family',label:'Lives with family / whānau',group:'home'},
  {id:'supported_accommodation',label:'Supported accommodation',group:'home'},
  {id:'residential_care',label:'Residential care',group:'home'},
  {id:'independent_adls',label:'Independent ADLs'},
  {id:'help_with_adls',label:'Help with ADLs'},
  {id:'mobility_aid',label:'Mobility aid'},
  {id:'carer_support',label:'Carer support'},
  {id:'home_safety_concerns',label:'Home safety concerns'},
  {id:'smoking',label:'Smokes'},
  {id:'alcohol',label:'Alcohol use'},
  {id:'other_substances',label:'Other substance use'}
 ],
 referrals: [
  {id:'falls',label:'Falls',tag:'[[falls_referral]]'},
  {id:'vulnerable_people',label:'Vulnerable people',tag:'[[vulnerable_people_referral]]'},
  {id:'fire_safety',label:'Fire safety',tag:'[[fire_safety_referral]]'},
  {id:'medical_alarm',label:'Medical alarm',tag:'[[medical_alarm_referral]]'},
  {id:'gp',label:'GP',tag:'[[gp_referral]]'},
  {id:'other',label:'Other',tag:'[[other_referral]]'}
 ],
 pathways:['Telestroke','PASTA','LAMS'],
 // Descriptions retained from the user-supplied starting tool. Full NHS wording is in the PDF.
 frailty: [
  ['Very Fit','People who are robust, active, energetic and motivated'],
  ['Well','No active disease symptoms but less fit'],
  ['Managing Well','Medical problems controlled'],
  ['Vulnerable','Not dependent but symptoms slow activities'],
  ['Mildly Frail','Need help with complex tasks'],
  ['Moderately Frail','Need help with outside activities and housekeeping'],
  ['Severely Frail','Completely dependent for personal care'],
  ['Very Severely Frail','Approaching end of life, completely dependent'],
  ['Terminally Ill','Life expectancy under six months, without other evidence of frailty']
 ],
 cpgs:[
  {id:'asthma',title:'Asthma · EAS 2.1',words:['asthma','bronchospasm'],url:'https://cpg.stjohn.org.nz/assets/pdf/guidelines/Exacerbation%20of%20Asthma%20-%20EAS.pdf',checked:'2026-10-23',prompts:[
   'Severe or immediately life-threatening presentation',
   'Repeated nebulised bronchodilator doses (not MDI)',
   'Markedly abnormal observations',
   'Room-air oxygen saturation below 92%',
   'Speech limited to less than full sentences',
   'Mobility below normal',
   'Rapid-onset / brittle asthma'
  ]},
  {id:'headache',title:'Headache',words:['headache','migraine','thunderclap'],url:'https://cpg.stjohn.org.nz/tabs/guidelines/neurological-eas/page/headache-eas',checked:'2026-10-23',prompts:[]},
  {id:'cardiac',title:'Myocardial ischaemia · EAS 3.2',words:['chest pain','chest discomfort','acs','myocardial','ischaemia','ischemia','stemi','angina'],url:'https://cpg.stjohn.org.nz/tabs/guidelines/cardiac-eas/page/myocardial-ischaemia-eas',checked:'2026-10-23',prompts:['Bradycardia or tachyarrhythmia','Evidence of shock'],note:'Record evolving symptoms, ECG changes and transport advice. An initially normal ECG does not exclude ischaemia.'},
  {id:'fever',title:'Fever',words:['fever','febrile','infection','sepsis','rigors'],url:'https://cpg.stjohn.org.nz/tabs/guidelines/infection-eas/page/fever-eas',checked:'2026-10-23',prompts:['New mental-status change confirmed on assessment','Markedly abnormal observations','Shaking chills / rigors','Known neutropenia or recent chemotherapy']},
  {id:'anaphylaxis',title:'Anaphylaxis',words:['anaphylaxis','allergic reaction'],url:'https://cpg.stjohn.org.nz/tabs/guidelines/miscellaneous-eas/page/anaphylaxis-eas',checked:'2026-10-23',prompts:[]},
  {id:'meningococcal',title:'Meningococcal septicaemia',words:['meningococcal','meningitis'],url:'https://cpg.stjohn.org.nz/tabs/guidelines/infection-eas/page/meningococcal-septicaemia-eas',checked:'2026-10-23',prompts:[]},
  {id:'trauma',title:'Major trauma triage',words:['trauma','injury','fracture'],url:'https://cpg.stjohn.org.nz/tabs/guidelines/shock-and-trauma-eas/page/major-trauma-triage-eas',checked:'2026-10-23',prompts:[]}
 ]
};
// GP/audit sections are intentionally absent from the app and guidance search.
for (const key of Object.keys(GUIDANCE)) if (/Notes to GP|Flag for audit|Disposition Tab - Screen 2/.test(key)) delete GUIDANCE[key];

/* Diagnosis-specific documentation. Checked against the official CPG PDFs on
 * 24 October 2026 (PDF exports dated 24 September 2026).
 * Display text is condensed; the source links remain available beside each panel.
 * Drug guidance is a reference, never a pre-filled administration record.
 */
const DIAGNOSIS = {
 options: ['Myocardial ischaemia', 'Falls', 'Other'],
 myocardial: {
  url: 'https://cpg.stjohn.org.nz/tabs/guidelines/cardiac-eas/page/myocardial-ischaemia-eas',
  pdf: 'https://cpg.stjohn.org.nz/assets/pdf/guidelines/Myocardial%20Ischaemia%20-%20EAS.pdf',
  scope: 'Adults with suspected myocardial ischaemia. STEMI requires the applicable PCI or fibrinolysis pathway.',
  treatments: [
   {id:'ecg_initial', action:'12-lead ECG', prompt:'Obtain an initial 12-lead ECG.'},
   {id:'ecg_v4r', action:'V4R ECG', prompt:'Suspected inferior STEMI: obtain another 12-lead ECG with V4R positioning.'},
   {id:'ecg_posterior', action:'Posterior ECG', prompt:'Suspected posterior STEMI: obtain another 12-lead ECG using V7–9 positions.'},
   {id:'aspirin', action:'Aspirin PO', medication:true, prompt:'Give aspirin orally: 300 mg.'},
   {id:'gtn_initial', action:'GTN SL', medication:true, prompt:'Give GTN sublingually: 0.4 mg.'},
   {id:'gtn_repeat', action:'Repeat GTN SL', medication:true, prompt:'Repeat GTN at 5-minute intervals only while symptom relief continues; use 10-minute intervals when a caution applies.'},
   {id:'opiate', action:'Opiate IV', medication:true, prompt:'For significant pain persisting after GTN, administer an IV opiate.'},
   {id:'ecg_repeat', action:'Repeat 12-lead ECG', prompt:'Repeat 12-lead ECGs at 15–30-minute intervals to identify evolving changes.'}
  ]
 },
 falls: {
  url:'https://cpg.stjohn.org.nz/tabs/guidelines/miscellaneous-eas/page/falls-eas',
  pdf:'https://cpg.stjohn.org.nz/assets/pdf/guidelines/Falls%20-%20EAS.pdf',
  red:[
   {id:'significant_injury',label:'Injury of clinical significance'},
   {id:'significant_pain',label:'Pain of clinical significance'},
   {id:'abnormal_vitals',label:'Vital signs outside the normal range'},
   {id:'stroke',label:'Findings suggesting stroke'},
   {id:'headache',label:'Headache with concerning characteristics'},
   {id:'visual_change',label:'Newly developed visual disturbance'},
   {id:'unable_mobilise',label:'Cannot mobilise despite normally being able to'},
   {id:'unstable_condition',label:'A contributing medical condition that is not stable'}
  ],
  orange:[
   {id:'recurrent_falls',label:'At least two falls during the preceding week'},
   {id:'postural_hypotension',label:'Orthostatic (postural) hypotension'},
   {id:'medication_change',label:'Medication changed recently'},
   {id:'minor_injury',label:'Minor injury needing non-urgent care'},
   {id:'reduced_mobility',label:'Newly impaired mobility, with weight-bearing still possible'}
  ]
 }
};

/* Disposition references reviewed 24 October 2026.
 * These are links and fixed educational prompts, not locally calculated rules.
 * 'Not assessed' is a distinct persisted value and never treated as No.
 */
const FALLS_ASSESSMENT = {
 states: ['Yes','No','Not assessed'],
 items: [
  {id:'head_strike',label:'Head strike reported',level:'warning',title:'Review head injury assessment',prompt:'Review head injury guidance and the injury history before disposition; assess any concerning or evolving symptoms.'},
  {id:'anticoagulants',label:'Anticoagulant use reported',level:'warning',title:'Review bleeding and head injury considerations',prompt:'Consider the reported anticoagulant and relevant bleeding risk, including possible head injury. Review the applicable head injury guidance; this finding alone does not determine disposition.'},
  {id:'new_mobility',label:'New mobility difficulty',level:'caution',title:'Further mobility assessment before disposition',prompt:'Compare mobility with baseline and assess the new limitation. Review the existing red/orange flag distinctions; this checkbox does not establish whether the patient can weight bear.'},
  {id:'recurrent_falls',label:'Recurrent falls',level:'referral',title:'Review falls prevention referral eligibility',prompt:'Review the falls prevention pathway and eligibility criteria below. Recurrent falls alone do not automatically establish eligibility or a safe disposition.'}
 ],
 eligibility: 'The CPG calls for a falls-risk assessment when the patient is aged 65 or over, lives independently and is not being transported to ED by ambulance. When abnormalities are identified, the guideline calls for consent and referral to a falls prevention service, or GP referral if no pathway is available. Residential-care facilities manage their residents’ falls prevention; independent units within a care complex count as independent living.'
};
const DISPOSITION_RESOURCES = {
 checked:'2026-10-24',
 pe: {
  title:'Pulmonary Embolism (PE)',
  tools:[
   {label:'Wells’ Criteria for PE · MDCalc',url:'https://www.mdcalc.com/calc/115/wells-criteria-pulmonary-embolism',description:'Estimates clinical pre-test probability to support selection of an appropriate PE diagnostic pathway. It is not a stand-alone diagnostic test or a disposition decision.'},
   {label:'PERC Rule · MDCalc',url:'https://www.mdcalc.com/calc/347/perc-rule-pulmonary-embolism',description:'Use only after sufficiently low clinical pre-test probability has been established. A negative result is not valid for moderate- or high-risk patients. Check population restrictions and exclusions.'},
   {label:'YEARS Algorithm · MDCalc',url:'https://www.mdcalc.com/calc/4067/years-algorithm-for-pulmonary-embolism-pe',description:'Combines clinical assessment with D-dimer testing to guide further investigation. Requires the appropriate D-dimer assay, units and thresholds; do not apply it to haemodynamically unstable patients.'}
  ]
 },
 ankle:{
  title:'Ankle Injury',
  text:{label:'Text / clinical criteria · MDCalc',url:'https://www.mdcalc.com/calc/1670/ottawa-ankle-rule'},
  video:{label:'Instructional video · Emergency Care BC',url:'https://emergencycarebc.ca/clinical_resource/procedural-video/ottawa-ankle-rules/'},
  fallback:{label:'Same video · EM Ottawa (Dr Ian Stiell)',url:'https://www.youtube.com/watch?v=Dqq09sR0vuc'},
  criteria:[
   {label:'Malleolar zone',description:'With pain in this zone, ankle imaging criteria include bony tenderness at the posterior edge of the distal 6 cm or tip of either malleolus, or the weight-bearing criterion below.'},
   {label:'Midfoot zone',description:'With pain in this zone, foot imaging criteria include bony tenderness over the navicular or base of the fifth metatarsal, or the weight-bearing criterion below.'},
   {label:'Four-step weight bearing',description:'Inability to take four steps both immediately after injury and in the emergency department is an alternative imaging criterion for either painful zone. Document both timepoints; limping alone is not inability to take four steps.'}
  ],
  limitations:'Use only in an appropriate, alert patient with recent blunt ankle or midfoot trauma and a reliable examination. Check the source’s age and exclusion criteria and local policy. The rule informs radiography: a negative result does not establish a sprain or by itself justify non-transport.',
  sources:['https://ohri.ca/en/find-researcher/istiell','https://aci.health.nsw.gov.au/ecat/appendices/ottawa-ankle-adult']
 }
};
// Preserve existing topics and add the two requested guidance choices.
DIAGNOSIS.options.splice(DIAGNOSIS.options.indexOf('Other'),0,'Pulmonary Embolism (PE)','Ankle Injury');


/* A user-requested reminder, NOT a validated clinical decision rule.
 * Restrict matching to the current Subjective / Objective fields. Explicit aliases
 * support common spellings; do not broaden this into a generic diagnosis engine.
 * The conservative phrase filter is not clinical language understanding.
 */
const PE_REMINDER = {
 terms:[['tachycardia'],['hypotension','hyootension'],['hypoxia','hyoxia','hypoxaemia','hypoxemia']],
 explanation:'PE can cause tachycardia, low blood pressure and impaired oxygenation. These findings are non-specific: consider PE alongside other causes.',
 limitation:'Keyword prompt only — confirm findings and timing. This combination is not a validated rule; no prompt does not exclude PE.',
 source:{label:'ESC pulmonary embolism guidance',url:'https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/acute-pulmonary-embolism/'},
 checked:'2026-10-24'
};
