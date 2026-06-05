// Voice Assistant — Language config, TTS helpers, and symptom detection re-export.

export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;        // native script
  deepgramCode: string; // Deepgram language param
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English',  deepgramCode: 'en' },
  { code: 'hi', label: 'हिन्दी',   deepgramCode: 'hi' },
  { code: 'te', label: 'తెలుగు',   deepgramCode: 'te' },
  { code: 'ta', label: 'தமிழ்',    deepgramCode: 'ta' },
  { code: 'kn', label: 'ಕನ್ನಡ',   deepgramCode: 'kn' },
];

// ── Greetings ─────────────────────────────────────────────────────
export const GREETINGS: Record<SupportedLanguage, string> = {
  en: 'Hello. I am your healthcare assistant. Please tell me your health problem.',
  hi: 'नमस्ते। मैं आपका स्वास्थ्य सहायक हूँ। कृपया अपनी समस्या बताइए।',
  te: 'నమస్కారం. నేను మీ ఆరోగ్య సహాయకుడిని. మీ సమస్య చెప్పండి.',
  ta: 'வணக்கம். நான் உங்கள் சுகாதார உதவியாளர். உங்கள் பிரச்சனையை கூறுங்கள்.',
  kn: 'ನಮಸ್ಕಾರ. ನಾನು ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ.',
};

// ── Recommendation responses ──────────────────────────────────────
export const RECOMMENDATION_TEXT: Record<SupportedLanguage, string> = {
  en: 'Based on your symptoms, I recommend consulting a General Physician.',
  hi: 'आपके लक्षणों के आधार पर मैं जनरल फिजिशियन से परामर्श करने की सलाह देता हूँ।',
  te: 'మీ లక్షణాల ఆధారంగా జనరల్ ఫిజీషియన్ను సంప్రదించడం మంచిది.',
  ta: 'உங்கள் அறிகுறிகளின் அடிப்படையில் பொது மருத்துவரை அணுக பரிந்துரைக்கிறேன்.',
  kn: 'ನಿಮ್ಮ ಲಕ್ಷಣಗಳ ಆಧಾರದ ಮೇಲೆ ಸಾಮಾನ್ಯ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಲು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ.',
};

export const NO_MATCH_TEXT: Record<SupportedLanguage, string> = {
  en: 'I could not detect specific symptoms. Please describe your problem in more detail.',
  hi: 'मैं कोई विशेष लक्षण नहीं पहचान सका। कृपया अपनी समस्या को और विस्तार से बताइए।',
  te: 'నేను నిర్దిష్ట లక్షణాలను గుర్తించలేకపోయాను. దయచేసి మీ సమస్యను వివరంగా చెప్పండి.',
  ta: 'குறிப்பிட்ட அறிகுறிகளை என்னால் கண்டறிய முடியவில்லை. உங்கள் பிரச்சனையை விரிவாக கூறுங்கள்.',
  kn: 'ನಿರ್ದಿಷ್ಟ ಲಕ್ಷಣಗಳನ್ನು ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ವಿವರವಾಗಿ ತಿಳಿಸಿ.',
};

// ── "Since when" question ───────────────────────────────────────
export const ASK_SINCE_WHEN: Record<SupportedLanguage, string> = {
  en: 'Since when are you experiencing these symptoms? For example: since today, since 2 days, since a week.',
  hi: 'आपको ये लक्षण कब से हैं? जैसे: आज से, दो दिन से, एक हफ्ते से।',
  te: 'ఈ లక్షణాలు మీకు ఎప్పటి నుండి ఉన్నాయి?',
  ta: 'இந்த அறிகுறிகள் எப்போது தொடங்கின?',
  kn: 'ಈ ಲಕ್ಷಣಗಳು ಯಾವಾಗಿನಿಂದ ಇವೆ?',
};

// ── "How do you want help" question ──────────────────────────────
export const ASK_CONSULT_TYPE: Record<SupportedLanguage, string> = {
  en: 'How would you like to consult a doctor? You can choose: Talk to a doctor immediately, Book a doctor appointment, or Request a home visit.',
  hi: 'आप डॉक्टर से कैसे मिलना चाहते हैं? तुरंत डॉक्टर से बात करें, अपॉइंटमेंट बुक करें, या होम विजिट के लिए रिक्वेस्ट करें।',
  te: 'మీరు డాక్టర్‌ను ఎలా సంప్రదించాలనుకుంటున్నారు?',
  ta: 'நீங்கள் எப்படி மருத்துவரை சந்திக்க விரும்புகிறீர்கள்?',
  kn: 'ನೀವು ವೈದ್ಯರನ್ನು ಹೇಗೆ ಸಂಪರ್ಕಿಸಲು ಬಯಸುತ್ತೀರಿ?',
};

// ── Language label for display ────────────────────────────────────
export const LANGUAGE_LABEL: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  kn: 'Kannada',
};

// ── Detection result type (for VoiceAssistantModal compatibility) ─
export interface DetectionResult {
  matched: boolean;
  symptoms: string[];
  doctorType: string | null;
  confidence: 'High' | 'Medium' | 'Low' | null;
}

// Re-export new engine as the single detectSymptoms entry point.
// Converts SymptomDetectionResult → DetectionResult shape for the modal.
export { detectSymptoms } from '@/utils/symptomDetector';

// ── Device-native Text-to-Speech ──────────────────────────────────
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
