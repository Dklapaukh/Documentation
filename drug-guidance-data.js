/* NZCPG source references checked 25 Oct 2026. PDFs preserve original source pages.
 * Repeat options are review reminders, never dosing instructions. Keep indication, route and limits together. */
const DRUG_GUIDELINES={"0.375% ropivacaine": [], "0.9% sodium chloride": [], "1% lignocaine": [], "10% glucose": [], "8.4% sodium bicarbonate": [], "Adenosine": [], "Adrenaline": [], "Amiodarone": [], "Aspirin": [], "Atropine": [], "Calcium chloride": [], "Cefazolin": [], "Ceftriaxone": [], "Clopidogrel": [], "Droperidol": [], "Enoxaparin": [], "Fentanyl": [], "Fentanyl and ketamine": [], "Glucagon": [], "Glucose gel": [], "GTN": [], "Hydrocortisone": [], "Ibuprofen": [], "Ipratropium": [], "Ketamine": [], "Labetalol": [], "Levetiracetam": [], "Loratadine": [], "Magnesium": [], "Metaraminol": [], "Methoxyflurane": [], "Metoprolol tartrate": [], "Midazolam": [], "Morphine": [], "Naloxone": [], "Olanzapine": [], "Ondansetron": [], "Oxygen": [], "Oxytocin": [], "Paracetamol": [], "Prednisolone": [], "Prednisone": [], "Rocuronium": [], "Salbutamol": [], "Suxamethonium": [], "Tenecteplase": [], "Ticagrelor": [], "Tramadol": [], "Tranexamic acid": []};
const DRUG_REPEAT_OPTIONS = {
 "Fentanyl": [
  {
   "routes": [
    "IV"
   ],
   "minutes": 5,
   "label": "Analgesia · as required",
   "source": "1.18",
   "wording": "Repeat as required every five minutes."
  },
  {
   "routes": [
    "IM",
    "SC"
   ],
   "minutes": 20,
   "label": "Analgesia · as required · maximum three doses",
   "source": "1.18",
   "wording": "Repeat as required, every 20 minutes, up to a maximum of three doses."
  },
  {
   "routes": [
    "IN"
   ],
   "minutes": 20,
   "label": "Analgesia · as required",
   "source": "14.13",
   "wording": "Repeat as required every 20 minutes."
  }
 ],
 "Morphine": [
  {
   "routes": [
    "IV"
   ],
   "minutes": 5,
   "label": "Analgesia · as required",
   "source": "1.18",
   "wording": "Repeat as required every five minutes."
  },
  {
   "routes": [
    "IM",
    "SC"
   ],
   "minutes": 20,
   "label": "Analgesia · as required · maximum three doses",
   "source": "1.18",
   "wording": "Repeat as required, every 20 minutes, up to a maximum of three doses."
  }
 ],
 "GTN": [
  {
   "routes": [
    "SL"
   ],
   "minutes": 5,
   "label": "Myocardial ischaemia · symptom relief required; review cautions",
   "source": "14.17",
   "wording": "0.4 mg every five minutes. Consider increasing the dosing interval to ten minutes if a caution is present."
  },
  {
   "routes": [
    "SL"
   ],
   "minutes": 10,
   "label": "Myocardial ischaemia · increased interval with a caution",
   "source": "14.17",
   "wording": "0.4 mg every five minutes. Consider increasing the dosing interval to ten minutes if a caution is present."
  }
 ],
 "Glucose gel": [
  {
   "routes": [
    "PO"
   ],
   "minutes": 10,
   "label": "Hypoglycaemia persists or recurs",
   "source": "14.16",
   "wording": "Administer one sachet and repeat every ten minutes if hypoglycaemia persists or recurs."
  }
 ],
 "1% lignocaine": [
  {
   "routes": [
    "IO"
   ],
   "minutes": 15,
   "label": "IO pain · one repeat if needed",
   "source": "14.25",
   "wording": "The intraosseous dose may be repeated once after 15 minutes."
  },
  {
   "routes": [
    "SC"
   ],
   "minutes": 30,
   "label": "Digital ring block · one repeat if effective and pain returns",
   "source": "14.25",
   "wording": "The subcutaneous dose may be repeated once after 30 minutes."
  }
 ],
 "Droperidol": [
  {
   "routes": [
    "IM",
    "IV"
   ],
   "minutes": 20,
   "label": "Acute behavioural disturbance · one repeat if required",
   "source": "14.11",
   "wording": "The dose may be repeated once after 20 minutes."
  }
 ],
 "Ketamine": [
  {
   "routes": [
    "IM",
    "PO"
   ],
   "minutes": 20,
   "label": "Analgesia · repeat limit and indication require review",
   "source": "14.23",
   "wording": "This may be repeated once after 20 minutes."
  },
  {
   "routes": [
    "IV"
   ],
   "minutes": 5,
   "label": "Dissociation · one repeat if required",
   "source": "14.23",
   "wording": "This may be repeated once after five minutes."
  },
  {
   "routes": [
    "IV"
   ],
   "minutes": 5,
   "label": "Acute behavioural disturbance · as required",
   "source": "14.23",
   "wording": "1 mg/kg IV (up to a maximum of 150 mg) every five minutes as required, or"
  },
  {
   "routes": [
    "IM"
   ],
   "minutes": 20,
   "label": "Acute behavioural disturbance · one repeat if required",
   "source": "14.23",
   "wording": "This may be repeated once after 20 minutes."
  },
  {
   "routes": [
    "IV"
   ],
   "minutes": 10,
   "label": "Asthma with severe agitation · as required",
   "source": "14.23",
   "wording": "This may be repeated every 10 minutes as required."
  }
 ],
 "Labetalol": [
  {
   "routes": [
    "IV"
   ],
   "minutes": 5,
   "label": "Hypertension · bolus review; follow indication and infusion guidance",
   "source": "14.24",
   "wording": "Administer additional boluses of 20 mg IV every five minutes as required."
  }
 ],
 "Metaraminol": [
  {
   "routes": [
    "IV"
   ],
   "minutes": 5,
   "label": "Bolus review · choose within 5–10 minute interval",
   "source": "14.28",
   "wording": "Administer 0.5-1 mg IV every 5-10 minutes as required for an adult, or"
  },
  {
   "routes": [
    "IV"
   ],
   "minutes": 10,
   "label": "Bolus review · choose within 5–10 minute interval",
   "source": "14.28",
   "wording": "Administer 0.5-1 mg IV every 5-10 minutes as required for an adult, or"
  }
 ],
 "Naloxone": [
  {
   "routes": [
    "IV"
   ],
   "minutes": 5,
   "label": "Opiate toxicity · as required",
   "source": "14.33",
   "wording": "0.1-0.4 mg IV every five minutes as required for an adult."
  },
  {
   "routes": [
    "IM"
   ],
   "minutes": 10,
   "label": "Opiate toxicity · as required",
   "source": "14.33",
   "wording": "This may be repeated every 10 minutes."
  }
 ],
 "Olanzapine": [
  {
   "routes": [
    "PO"
   ],
   "minutes": 20,
   "label": "Acute behavioural disturbance · one repeat if required",
   "source": "14.34",
   "wording": "The dose may be repeated once after 20 minutes."
  }
 ],
 "Ondansetron": [
  {
   "routes": [
    "IM"
   ],
   "minutes": 20,
   "label": "One IM repeat if required; review subsequent-route limits",
   "source": "14.35",
   "wording": "The IM dose may be repeated once after 20 minutes if required."
  }
 ],
 "Calcium chloride": [
  {
   "routes": [
    "IV"
   ],
   "minutes": 20,
   "label": "Hyperkalaemia · severe ECG changes persist or recur",
   "source": "14.8",
   "wording": "Repeat the dose after 20 minutes if severe ECG changes persist or recur."
  },
  {
   "routes": [
    "IV"
   ],
   "minutes": 10,
   "label": "Arrest from hyperkalaemia · no ROSC after first dose",
   "source": "14.8",
   "wording": "Repeat the dose after 10 minutes if ROSC is not achieved."
  }
 ],
 "8.4% sodium bicarbonate": [
  {
   "routes": [
    "IV"
   ],
   "minutes": 20,
   "label": "Hyperkalaemia · severe ECG changes persist or recur",
   "source": "14.43",
   "wording": "Repeat the dose after 20 minutes if severe ECG changes persist or recur."
  },
  {
   "routes": [
    "IV"
   ],
   "minutes": 10,
   "label": "Arrest from hyperkalaemia · no ROSC after first dose",
   "source": "14.43",
   "wording": "Repeat the dose if ROSC is not achieved within 10 minutes of the first dose."
  }
 ],
 "Tranexamic acid": [
  {
   "routes": [
    "Nebulised"
   ],
   "minutes": 30,
   "label": "Bleeding following tonsillectomy · one repeat",
   "source": "14.47",
   "wording": "Repeat once after 30 minutes."
  }
 ],
 "Midazolam": [
  {
   "routes": [
    "IV"
   ],
   "minutes": 5,
   "label": "Seizures · one repeat; review prior IM dose and total-dose limits",
   "source": "5.8",
   "wording": "This may be repeated once after five minutes."
  },
  {
   "routes": [
    "IM"
   ],
   "minutes": 10,
   "label": "Seizures · one repeat; review total-dose limits",
   "source": "5.8",
   "wording": "This may be repeated once after ten minutes."
  }
 ],
 "Levetiracetam": [
  {
   "routes": [
    "IV"
   ],
   "minutes": 10,
   "label": "Adult seizures · one repeat if continuing or recurring",
   "source": "5.8",
   "wording": "Repeat once after ten minutes for an adult, if the seizure continues or recurs ten minutes after the first dose."
  }
 ],
 "Adrenaline": [
  {
   "routes": [
    "IV",
    "IO"
   ],
   "minutes": 4,
   "label": "Standard cardiac arrest · review rhythm and special circumstances",
   "source": "3.14",
   "wording": "Administer adrenaline IV every four minutes:"
  },
  {
   "routes": [
    "IM"
   ],
   "minutes": 10,
   "label": "Anaphylaxis · not improving",
   "source": "12.12",
   "wording": "Repeat the adrenaline IM every ten minutes if the patient is not improving, or every five minutes if the patient is deteriorating."
  },
  {
   "routes": [
    "IM"
   ],
   "minutes": 5,
   "label": "Anaphylaxis · deteriorating",
   "source": "12.12",
   "wording": "Repeat the adrenaline IM every ten minutes if the patient is not improving, or every five minutes if the patient is deteriorating."
  }
 ]
};
