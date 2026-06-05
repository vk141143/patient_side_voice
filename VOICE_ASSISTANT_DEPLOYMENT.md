# Hybrid Voice Assistant Deployment Guide

## 🔐 CRITICAL SECURITY: API Keys MUST be stored in Supabase Secrets

**NEVER store API keys in:**
- Frontend code
- React components
- Environment variables in `.env` files that get committed
- Browser-accessible configuration

**ALWAYS store API keys in:**
- Supabase Dashboard → Project Settings → Edge Functions → Secrets
- OR via Supabase CLI (see below)

---

## Step 1: Deploy Supabase Edge Function

### 1.1 Login to Supabase CLI

```bash
npx supabase login
```

### 1.2 Link your project

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

### 1.3 Set the Gemini API secret (SERVER-SIDE ONLY)

```bash
npx supabase secrets set GEMINI_API_KEY=AIzaSyYOUR_ACTUAL_GEMINI_KEY_HERE
```

```bash
npx supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### 1.4 Deploy the edge function

```bash
npx supabase functions deploy analyze-symptoms
```

### 1.5 Verify deployment

```bash
npx supabase functions list
```

You should see `analyze-symptoms` with status `ACTIVE`.

---

## Step 2: Test the Edge Function

```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze-symptoms' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "transcript": "मुझे बुखार और सिरदर्द है",
    "language": "Hindi"
  }'
```

Expected response:

```json
{
  "symptoms": ["Fever", "Headache"],
  "recommendedDoctor": "General Physician",
  "confidence": "High"
}
```

---

## Step 3: Frontend Environment Variables

Create `.env` (or update existing):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

**✅ Safe to commit:** Supabase anon key is public-safe — row-level security (RLS) protects data.

**❌ NEVER commit:** GEMINI_API_KEY (it's server-side only in Supabase secrets)

---

## Architecture

```
User Voice
   ↓
Device Microphone (Web Speech API / SpeechRecognition)
   ↓
Transcript
   ↓
[Frontend] detectSymptoms() — Local dictionary search
   ↓
   ├─→ ✅ Symptoms Found → Display result (source: 'dictionary')
   │
   └─→ ❌ No Match
        ↓
   [Frontend] supabase.functions.invoke('analyze-symptoms')
        ↓
   [Supabase Edge Function] Uses GEMINI_API_KEY from secrets
        ↓
   [Gemini API] Analyzes transcript
        ↓
   [Response] { symptoms, doctor, confidence }
        ↓
   [Frontend] Display result (source: 'gemini')
        ↓
   Device TTS (speechSynthesis) — Native browser TTS
```

---

## Features Implemented

### ✅ Security

- **Zero API keys in frontend** — Gemini key stored only in Supabase secrets
- HTTPS-only edge function calls
- Row-level security on `voice_assistant_sessions` table

### ✅ Multilingual Support

- English, Hindi, Telugu, Tamil, Kannada
- 300+ symptom keywords across all languages
- Verb conjugation support (Telugu: తిరుగుతోంది, తిరుగుతున్నాను, etc.)

### ✅ Hybrid Detection

1. **Dictionary** (instant, offline-capable, Telugu/Hindi robust)
2. **Gemini fallback** (AI-powered, handles edge cases)

### ✅ UI/UX

- Language selection
- Live transcript display
- Animated mic with volume visualization
- Loading states (Analyzing... with spinner)
- Summary card showing:
  - ✓ Detected Symptoms
  - Recommended Doctor
  - Confidence level
  - Language
  - **Detection Source** (Dictionary / Gemini)
  - Full transcript
- Device-native TTS (Android/iOS voices)
- Error handling with retry

### ✅ Future-Ready

- Specialist routing structure in `symptomDetector.ts`:
  ```typescript
  export type SpecialistType =
    | 'General Physician'
    | 'Dermatologist'
    | 'Pediatrician'
    | 'Gynecologist'
    | 'Orthopedic'
    | 'ENT'
    | 'Cardiologist';
  ```
- Extensible symptom dictionaries (add `DERMATOLOGIST_SYMPTOMS`, etc.)

---

## File Structure

```
src/
├── data/
│   └── symptomDictionary.ts          # 300+ multilingual keywords
├── utils/
│   └── symptomDetector.ts            # Dictionary engine + Gemini result builder
├── lib/
│   └── voiceAssistant.ts             # Language config, TTS helpers
├── components/
│   └── screens/
│       └── VoiceAssistantModal.tsx   # Hybrid UI with Gemini fallback

supabase/
├── functions/
│   ├── _shared/
│   │   └── cors.ts                   # CORS headers
│   └── analyze-symptoms/
│       └── index.ts                  # Gemini API integration (server-side)
```

---

## Database Schema

Already exists in `supabase_schema.sql`:

```sql
CREATE TABLE voice_assistant_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             TEXT NOT NULL,
  language            TEXT NOT NULL,
  transcript          TEXT NOT NULL,
  detected_symptoms   TEXT[] DEFAULT '{}',
  doctor_type         TEXT,
  confidence          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE voice_assistant_sessions ENABLE ROW LEVEL SECURITY;
```

---

## Testing Checklist

### Dictionary Detection (Fast Path)

- [ ] English: "I have fever and headache"
- [ ] Hindi: "मुझे बुखार और सिरदर्द है"
- [ ] Telugu: "నాకు జ్వరం మరియు తలనొప్పి ఉంది"
- [ ] Tamil: "எனக்கு காய்ச்சல் மற்றும் தலைவலி"
- [ ] Kannada: "ನನಗೆ ಜ್ವರ ಮತ್ತು ತಲೆನೋವು"

**Expected:** Instant result, `source: 'dictionary'`

### Gemini Fallback (Slow Path)

- [ ] Edge case: "I'm not feeling well, something is wrong"
- [ ] Colloquial: "My body hurts everywhere and I feel dizzy"
- [ ] Non-medical: "Hello doctor" → No symptoms detected

**Expected:** 2-3 second delay, `source: 'gemini'`

### UI States

- [ ] Language selection screen
- [ ] Live transcript during recording
- [ ] Analyzing spinner (Gemini fallback)
- [ ] Summary card with all fields
- [ ] Detection source badge (Dictionary = 📖 / Gemini = ✨)
- [ ] Device TTS reads result
- [ ] "Find General Physician" button works

---

## Troubleshooting

### "Gemini API failed: 401"
- Check `GEMINI_API_KEY` is set: `npx supabase secrets list`
- Verify key is valid at https://aistudio.google.com/apikey

### "Edge function not found"
- Deploy: `npx supabase functions deploy analyze-symptoms`
- Check logs: `npx supabase functions logs analyze-symptoms`

### "No speech detected"
- Check microphone permissions in browser
- Use HTTPS (required for Web Speech API)
- Try Chrome/Edge (best browser support)

### Telugu detection failing
- Verify NFC normalization: all Telugu keywords use Unicode NFC
- Check verb conjugation coverage in `symptomDictionary.ts`

---

## Production Deployment

1. Deploy edge function to production
2. Set `GEMINI_API_KEY` in production Supabase project
3. Update `VITE_SUPABASE_URL` to production URL
4. Deploy frontend to Vercel/Netlify/etc.
5. Test end-to-end with real microphone input

---

## Cost Optimization

**Dictionary-first strategy minimizes AI costs:**

- Dictionary: 0 API calls, instant response
- Gemini: Only when dictionary fails (typically 10-20% of requests)
- Gemini 1.5 Flash: ~$0.00001 per request (effectively free for healthcare use case)

**Estimated monthly cost for 10,000 users:**
- 10,000 sessions
- 20% Gemini fallback = 2,000 API calls
- 2,000 × $0.00001 = **$0.02/month**

---

## Next Steps (Future Enhancements)

1. **Specialist Routing**
   - Add `DERMATOLOGIST_SYMPTOMS`, `PEDIATRICIAN_SYMPTOMS` dictionaries
   - Update `detectSymptoms()` to route by symptom category
   - "Rash" → Dermatologist, "Child fever" → Pediatrician

2. **Deepgram STT** (Replace Web Speech API)
   - More accurate multilingual transcription
   - Better Telugu/Tamil/Kannada support
   - Requires `DEEPGRAM_API_KEY` in Supabase secrets

3. **Context-Aware Gemini**
   - Send chat history for follow-up questions
   - "Where does it hurt?" → "My head" → Understands "head" refers to headache

4. **Voice Quality Checks**
   - Audio level monitoring
   - Background noise detection
   - Auto-retry if transcript is too short

---

**🎉 Deployment Complete!**

The hybrid voice assistant is now secure, scalable, and ready for production use with zero AI costs for common symptoms (dictionary path) and minimal costs for edge cases (Gemini fallback).
