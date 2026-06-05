// Multilingual symptom keyword dictionary.
// Each key is a canonical English symptom slug.
// Arrays contain every surface form across all 5 supported languages.
// Designed for substring matching after Unicode NFC normalisation.

export type SymptomKey =
  | 'fever' | 'headache' | 'cough' | 'cold' | 'weakness'
  | 'bodyPain' | 'vomiting' | 'dizziness' | 'stomachPain'
  | 'diarrhea' | 'soreThroat' | 'fatigue' | 'nausea'
  | 'chills' | 'dehydration';

export const SYMPTOM_DISPLAY: Record<SymptomKey, string> = {
  fever:       'Fever',
  headache:    'Headache',
  cough:       'Cough',
  cold:        'Cold',
  weakness:    'Weakness',
  bodyPain:    'Body Pain',
  vomiting:    'Vomiting',
  dizziness:   'Dizziness',
  stomachPain: 'Stomach Pain',
  diarrhea:    'Diarrhea',
  soreThroat:  'Sore Throat',
  fatigue:     'Fatigue',
  nausea:      'Nausea',
  chills:      'Chills',
  dehydration: 'Dehydration',
};

// All keywords are matched case-insensitively via .toLowerCase() before search.
export const GENERAL_PHYSICIAN_SYMPTOMS: Record<SymptomKey, string[]> = {
  fever: [
    // English — base + STT phonetic variants
    'fever', 'high fever', 'temperature', 'high temperature', 'feverish', 'running temperature',
    'having fever', 'got fever', 'feeling feverish', 'body heat', 'burning up', 'running a fever',
    // Hindi
    'बुखार', 'तेज बुखार', 'ताप', 'ज्वर', 'ज्वार', 'ज्वार लगना', 'ज्वार लग रहे', 'बुखार है', 'बुखार हो',
    // Telugu — base forms + natural speech conjugations Web Speech API returns
    'జ్వరం', 'జ్వరము', 'జ్వరంగా', 'జ్వరం వస్తోంది', 'జ్వరం ఉంది',
    'తీవ్రమైన జ్వరం', 'జ్వరం వచ్చింది', 'వేడిగా ఉంది',
    // Tamil
    'காய்ச்சல்', 'காய்ச்சல் இருக்கிறது', 'அதிக காய்ச்சல்', 'ஜுரம்',
    // Kannada
    'ಜ್ವರ', 'ಜ್ವರವಿದೆ', 'ತೀವ್ರ ಜ್ವರ', 'ಜ್ವರ ಬಂದಿದೆ', 'ತಾಪ',
  ],
  headache: [
    'headache', 'head pain', 'head ache', 'migraine', 'head hurts', 'head is paining',
    'my head hurts', 'head is spinning', 'head is heavy', 'heavy head', 'splitting headache',
    'सिरदर्द', 'सिर दर्द', 'माइग्रेन', 'सिर में दर्द', 'सिर दुख रहा',
    // Telugu — include conjugated/adjective forms
    'తలనొప్పి', 'తల నొప్పి', 'తల నొప్పిగా', 'తలనొప్పి వస్తోంది', 'మైగ్రేన్',
    'தலைவலி', 'தலை வலி', 'தலை வலிக்கிறது', 'மைக்ரேன்',
    'ತಲೆನೋವು', 'ತಲೆ ನೋವು', 'ತಲೆ ನೋವಿದೆ', 'ಮೈಗ್ರೇನ್',
  ],
  cough: [
    'cough', 'coughing', 'dry cough', 'wet cough', 'persistent cough', 'cough and cold',
    'keeps coughing', 'cannot stop coughing', 'chest cough', 'bad cough', 'cough a lot',
    'खांसी', 'सूखी खांसी', 'खांसी है', 'खांसी हो रही', 'कफ',
    // Telugu — plural + present continuous forms
    'దగ్గు', 'పొడి దగ్గు', 'దగ్గు వస్తోంది', 'దగ్గు ఉంది',
    'దగ్గు వస్తున్నది', 'దగ్గులు వస్తున్నాయి',
    'இருமல்', 'உலர் இருமல்', 'இருமல் வருகிறது', 'இருமுகிறேன்',
    'ಕೆಮ್ಮು', 'ಒಣ ಕೆಮ್ಮು', 'ಕೆಮ್ಮು ಬರುತ್ತಿದೆ', 'ಕೆಮ್ಮಿದೆ',
  ],
  cold: [
    'cold', 'common cold', 'running nose', 'runny nose', 'blocked nose', 'stuffy nose', 'sneezing',
    'nose blocked', 'nose running', 'caught cold', 'got cold', 'nasal congestion', 'nose dripping',
    'जुकाम', 'नाक बहना', 'सर्दी', 'नाक बंद', 'छींक', 'बहती नाक',
    // Telugu — past tense 'పట్టింది' + present continuous 'కారుతోంది'
    'జలుబు', 'జలుబు పట్టింది', 'జలుబు వచ్చింది',
    'ముక్కు కారడం', 'ముక్కు కారుతోంది', 'నాసికా స్రావం',
    'சளி', 'ஜலதோஷம்', 'மூக்கு ஒழுகுகிறது', 'சளி பிடித்திருக்கிறது',
    'ಶೀತ', 'ಮೂಗು ಸೋರುವುದು', 'ನೆಗಡಿ', 'ಶೀತ ಆಗಿದೆ',
  ],
  weakness: [
    'weakness', 'weak', 'tired', 'tiredness', 'no energy', 'low energy', 'lethargic', 'lethargy',
    'feeling weak', 'feel weak', 'no strength', 'cannot work', 'very weak', 'body weak',
    'कमजोरी', 'थकान', 'थका हुआ', 'कमज़ोरी', 'शक्तिहीन', 'कमजोर',
    // Telugu — adjectival 'నీరసంగా', stem 'శక్తి లేకుండా'
    'బలహీనత', 'నీరసం', 'నీరసంగా', 'అలసట', 'అలసిపోయాను',
    'శక్తి లేదు', 'శక్తి లేకుండా',
    'பலவீனம்', 'சோர்வு', 'களைப்பு', 'சக்தியில்லை', 'தளர்ச்சி',
    'ದೌರ್ಬಲ್ಯ', 'ಆಯಾಸ', 'ಶಕ್ತಿ ಇಲ್ಲ', 'ಸುಸ್ತು', 'ದಣಿವು',
  ],
  bodyPain: [
    'body pain', 'body ache', 'bodyache', 'muscle pain', 'muscle ache', 'joint pain',
    'aching', 'whole body pain', 'all over pain',
    'pain all over', 'everything hurts', 'bones aching', 'my body aches', 'knee pain', 'back pain', 'leg pain',
    'बदन दर्द', 'शरीर दर्द', 'पूरे बदन में दर्द', 'मांसपेशी दर्द', 'जोड़ दर्द',
    // Telugu — adjectival forms 'నొప్పిగా'
    'శరీర నొప్పి', 'ఒళ్ళు నొప్పి', 'ఒళ్ళు నొప్పిగా',
    'శరీరం నొప్పి', 'శరీరం నొప్పిగా', 'కండర నొప్పి',
    'உடல் வலி', 'உடம்பு வலி', 'தசை வலி', 'மூட்டு வலி',
    'ದೇಹ ನೋವು', 'ಮೈ ನೋವು', 'ಸ್ನಾಯು ನೋವು', 'ಕೀಲು ನೋವು',
  ],
  vomiting: [
    'vomiting', 'vomit', 'throw up', 'throwing up', 'puking', 'nauseous and vomiting',
    'feel like throwing up', 'want to vomit', 'keep vomiting', 'vomited', 'threw up',
    'उल्टी', 'उल्टियाँ', 'उल्टी हो रही', 'जी मिचलाना', 'उबकाई',
    // Telugu — present continuous 'వస్తోంది', 'అవుతున్నది'
    'వాంతులు', 'వాంతి', 'వాంతి అవుతోంది', 'వాంతి వస్తోంది',
    'వాంతి అవుతున్నది', 'వికారం',
    'வாந்தி', 'வாந்தி வருகிறது', 'வாந்தியெடுக்கிறேன்',
    'ವಾಂತಿ', 'ವಾಂತಿ ಆಗುತ್ತಿದೆ', 'ಓಕರಿಕೆ',
  ],
  dizziness: [
    'dizziness', 'dizzy', 'lightheaded', 'light headed', 'vertigo', 'spinning head',
    'feel dizzy', 'feeling dizzy', 'everything spinning', 'losing balance', 'unsteady', 'head spinning',
    'चक्कर', 'चक्कर आना', 'सिर चकराना', 'भ्रम',
    // Telugu — THE KEY FIX: add verb stem 'తిరుగుతున్న' covers all persons/tenses
    // 'తల తిరగడం' (noun), 'చక్కర్లు' (plural), 'తల తిరుగుతోంది/తున్నది/తున్నాను'
    'తల తిరగడం', 'చక్కర్లు', 'తలతిరిగే', 'వెర్టిగో',
    'తల తిరుగుతోంది', 'తల తిరుగుతున్న', 'తలతిరుగుతోంది',
    'தலைசுற்றல்', 'தலை சுற்றுகிறது', 'தலை சுற்றல்',
    'ತಲೆ ಸುತ್ತು', 'ತಲೆ ತಿರುಗುವಿಕೆ', 'ತಲೆ ಗಿರ್ರನೆ',
  ],
  stomachPain: [
    'stomach pain', 'stomach ache', 'stomachache', 'abdominal pain', 'belly pain',
    'tummy ache', 'tummy pain', 'abdomen pain',
    'pain in stomach', 'stomach hurts', 'stomach is paining', 'cramps', 'stomach cramps', 'gas pain',
    'पेट दर्द', 'पेट में दर्द', 'पेट दुखना', 'उदर शूल',
    // Telugu — adjectival 'నొప్పిగా' + present continuous
    'కడుపు నొప్పి', 'కడుపు నొప్పిగా', 'పొట్ట నొప్పి',
    'పొట్ట నొప్పి వస్తోంది', 'ఉదర నొప్పి',
    'வயிற்று வலி', 'வயிறு வலிக்கிறது', 'வயிற்றில் வலி',
    'ಹೊಟ್ಟೆ ನೋವು', 'ಹೊಟ್ಟೆ ಕಿವಿ', 'ಉದರ ನೋವು',
  ],
  diarrhea: [
    'diarrhea', 'diarrhoea', 'loose motion', 'loose motions', 'watery stool', 'frequent stools',
    'going to toilet frequently', 'frequent bowel', 'running stomach', 'stomach running', 'loose stool',
    'दस्त', 'पतले दस्त', 'लूज मोशन', 'पेचिश',
    // Telugu — plural present continuous 'అవుతున్నాయి'
    'విరేచనాలు', 'విరేచనాలు అవుతున్నాయి', 'వదులుగా మలం', 'డయేరియా',
    'வயிற்றுப்போக்கு', 'மலம் கழிக்கிறது', 'டயேரியா',
    'ಭೇದಿ', 'ಅತಿಸಾರ', 'ಲೂಸ್ ಮೋಷನ್',
  ],
  soreThroat: [
    'sore throat', 'throat pain', 'throat infection', 'throat hurts', 'painful throat',
    'my throat hurts', 'difficulty swallowing', 'hard to swallow', 'throat is sore', 'scratchy throat', 'itchy throat',
    'गले में दर्द', 'गले में खराश', 'खराश', 'गला दर्द',
    // Telugu — adjectival 'నొప్పిగా ఉంది' caught by stem 'నొప్పిగా'
    'గొంతు నొప్పి', 'గొంతు నొప్పిగా', 'గొంతు ఇన్ఫెక్షన్',
    'தொண்டை வலி', 'தொண்டை வலிக்கிறது', 'தொண்டை தொற்று',
    'ಗಂಟಲು ನೋವು', 'ಗಂಟಲು ನೋವಿದೆ',
  ],
  fatigue: [
    'fatigue', 'exhaustion', 'exhausted', 'very tired', 'worn out', 'drained',
    'too tired', 'extremely tired', 'cannot get up', 'no motivation', 'always sleepy', 'sleeping too much',
    'थकान', 'बहुत थकान', 'थका', 'ऊर्जाहीन',
    // Telugu — adjectival 'అలసటగా'
    'అలసట', 'అలసటగా', 'చాలా అలసిపోయాను', 'శ్రమ',
    'சோர்வு', 'மிகவும் சோர்வாக', 'உடல் சோர்வு',
    'ಆಯಾಸ', 'ತುಂಬಾ ಆಯಾಸ', 'ದಣಿದಿದ್ದೇನೆ',
  ],
  nausea: [
    'nausea', 'nauseous', 'feel like vomiting', 'queasy', 'stomach churning',
    'feeling sick', 'feel sick', 'uneasy stomach', 'stomach upset', 'upset stomach',
    'जी मिचलाना', 'मतली', 'उबकाई आना',
    'వికారం', 'వికారంగా అనిపిస్తోంది',
    'குமட்டல்', 'குமட்டுகிறது',
    'ವಾಕರಿಕೆ', 'ಓಕರಿಕೆ ಬರುತ್ತಿದೆ',
  ],
  chills: [
    'chills', 'shivering', 'cold chills', 'feel cold', 'shaking', 'rigor',
    'body shivering', 'cannot stop shivering', 'feeling cold suddenly', 'goosebumps', 'trembling',
    'ठंड लगना', 'कंपकंपी', 'सिहरन', 'ठिठुरना',
    // Telugu — present continuous + adjectival forms
    'చలి', 'వణుకు', 'చలి వణుకు', 'వణుకు వస్తోంది', 'చలిగా ఉంది',
    'குளிர் நடுக்கம்', 'நடுங்குகிறேன்',
    'ನಡುಕ', 'ಚಳಿ ನಡುಕ',
  ],
  dehydration: [
    'dehydration', 'dehydrated', 'very thirsty', 'not drinking water', 'dry mouth',
    'mouth is dry', 'lips dry', 'drinking too much water', 'no urination', 'dark urine',
    'निर्जलीकरण', 'पानी की कमी', 'बहुत प्यास',
    'నీళ్ళు తాగడం లేదు', 'డీహైడ్రేషన్',
    'நீர்ச்சத்து குறைபாடு', 'வாய் வறட்சி',
    'ನಿರ್ಜಲೀಕರಣ', 'ಬಾಯಾರಿಕೆ ಹೆಚ್ಚಾಗಿದೆ',
  ],
};
