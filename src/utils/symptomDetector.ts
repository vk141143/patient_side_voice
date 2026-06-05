// Pure symptom detection engine — language-agnostic substring matching.
// Searches ALL keywords across ALL languages so a Hindi transcript detected
// under "te" locale still resolves correctly, and vice-versa.

import {
  GENERAL_PHYSICIAN_SYMPTOMS,
  SYMPTOM_DISPLAY,
  type SymptomKey,
} from '@/data/symptomDictionary';
import type { SupportedLanguage } from '@/lib/voiceAssistant';

// Future specialist routing stub — add keyword dicts here per specialist
export type SpecialistType =
  | 'General Physician'
  | 'Dermatologist'
  | 'Pediatrician'
  | 'Gynecologist'
  | 'Orthopedic'
  | 'ENT'
  | 'Cardiologist';

export type DetectionSource = 'dictionary' | 'gemini';

export interface SymptomDetectionResult {
  matched: boolean;
  detectedSymptoms: string[];        // English display names, deduped
  confidence: 'High' | 'Medium' | 'Low' | null;
  recommendedDoctor: SpecialistType | null;
  language: SupportedLanguage;
  transcript: string;
  source: DetectionSource;
}

// Normalise to NFC + lowercase for reliable Unicode substring search
function normalise(s: string): string {
  return s.normalize('NFC').toLowerCase();
}

export function detectSymptoms(
  transcript: string,
  lang: SupportedLanguage,
): SymptomDetectionResult {
  const text = normalise(transcript);
  const found = new Set<string>();

  for (const [slug, keywords] of Object.entries(GENERAL_PHYSICIAN_SYMPTOMS)) {
    for (const kw of keywords) {
      if (text.includes(normalise(kw))) {
        found.add(SYMPTOM_DISPLAY[slug as SymptomKey]);
        break; // one match per symptom slug is enough
      }
    }
  }

  const detectedSymptoms = Array.from(found);

  if (detectedSymptoms.length === 0) {
    return {
      matched: false,
      detectedSymptoms: [],
      confidence: null,
      recommendedDoctor: null,
      language: lang,
      transcript,
      source: 'dictionary',
    };
  }

  const confidence: 'High' | 'Medium' =
    detectedSymptoms.length >= 2 ? 'High' : 'Medium';

  return {
    matched: true,
    detectedSymptoms,
    confidence,
    // All symptoms route to General Physician for MVP.
    // Future: inspect detectedSymptoms against specialist keyword maps here.
    recommendedDoctor: 'General Physician',
    language: lang,
    transcript,
    source: 'dictionary',
  };
}

// Build a result from Gemini edge-function response
export function buildGeminiResult(
  transcript: string,
  lang: SupportedLanguage,
  symptoms: string[],
  confidence: 'High' | 'Medium' | 'Low',
): SymptomDetectionResult {
  return {
    matched: symptoms.length > 0,
    detectedSymptoms: symptoms,
    confidence: symptoms.length === 0 ? null : confidence,
    recommendedDoctor: symptoms.length > 0 ? 'General Physician' : null,
    language: lang,
    transcript,
    source: 'gemini',
  };
}
