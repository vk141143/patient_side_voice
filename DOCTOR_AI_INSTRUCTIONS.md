# Doctor-Side AI Integration — Implementation Instructions

## Overview

This document explains how to add an AI clinical decision support assistant to the doctor's chat screen. The AI suggests diagnoses and medicines based on patient symptoms. **The doctor always makes the final decision — AI is advisory only.**

---

## 1. What the AI Does

- Reads patient chat messages (symptoms only, no PII)
- Suggests possible diagnoses
- Recommends medicines with dosage and duration
- Flags potential drug interactions
- Suggests follow-up timelines

The AI suggestion appears as a collapsible panel inside the doctor's chat UI. The doctor can use it to pre-fill the prescription form or ignore it entirely.

---

## 2. Files to Create / Modify

| File | Action |
|---|---|
| `supabase/functions/ai-diagnosis-suggest/index.ts` | Create — Edge Function |
| Doctor chat screen (doctor-side equivalent of `ChatScreen.tsx`) | Modify — add AI button + suggestion panel |
| `supabase_schema.sql` | Append — add `ai_suggestion_logs` table |

---

## 3. Step 1 — Add SQL Table for AI Audit Logs

Run this in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS ai_suggestion_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT NOT NULL,
  doctor_id     TEXT NOT NULL,
  prompt_hash   TEXT NOT NULL,
  suggestion    TEXT NOT NULL,
  model_used    TEXT DEFAULT 'gpt-4o',
  shown_at      TIMESTAMPTZ DEFAULT NOW(),
  acted_upon    BOOLEAN DEFAULT FALSE
);

ALTER TABLE ai_suggestion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors read own AI logs"
  ON ai_suggestion_logs FOR SELECT
  USING (auth.uid()::text = doctor_id);

CREATE POLICY "Doctors insert own AI logs"
  ON ai_suggestion_logs FOR INSERT
  WITH CHECK (auth.uid()::text = doctor_id);
```

---

## 4. Step 2 — Create the Edge Function

Create the file `supabase/functions/ai-diagnosis-suggest/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { symptoms } = await req.json();

    if (!symptoms || symptoms.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Insufficient symptom data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a clinical decision support assistant for licensed doctors only.
Based on patient-reported symptoms, provide:
1. Top 2-3 differential diagnoses (most likely first)
2. Recommended medicines with dosage, frequency, and duration
3. Any red flags or drug interaction warnings
4. Suggested follow-up timeline

Format your response clearly with sections.
Always end with: "⚠️ Final clinical decision rests with the treating physician."
Never address the patient directly. This output is for the doctor only.`
          },
          {
            role: 'user',
            content: `Patient symptoms (de-identified):\n${symptoms}`
          }
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    const result = await response.json();
    const suggestion = result.choices?.[0]?.message?.content ?? 'No suggestion available.';

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'AI service unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

Set the secret in Supabase dashboard → Edge Functions → Secrets:
```
OPENAI_API_KEY = sk-...your-key...
ALLOWED_ORIGIN = https://your-domain.com
```

---

## 5. Step 3 — Add AI Panel to Doctor Chat Screen

In the doctor's chat screen component, add these state variables and the handler:

```typescript
const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
const [aiLoading, setAiLoading] = useState(false);
const [showAiPanel, setShowAiPanel] = useState(false);

// Strip PHI before sending to AI
const sanitizeForAI = (text: string): string =>
  text
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[PATIENT]')
    .replace(/\b\d{10}\b/g, '[PHONE]')
    .replace(/\S+@\S+\.\S+/g, '[EMAIL]');

const handleGetAISuggestion = async () => {
  const patientMessages = messages
    .filter(m => m.sender_role === 'patient' && m.type === 'text')
    .map(m => sanitizeForAI(m.content))
    .join('\n');

  if (!patientMessages.trim()) return;

  setAiLoading(true);
  setShowAiPanel(true);

  const { data, error } = await supabase.functions.invoke('ai-diagnosis-suggest', {
    body: { symptoms: patientMessages },
  });

  if (data?.suggestion) {
    setAiSuggestion(data.suggestion);

    // Log to audit table (HIPAA requirement)
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(patientMessages));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    await supabase.from('ai_suggestion_logs').insert({
      session_id: sessionId,
      doctor_id: currentDoctorId,
      prompt_hash: hashHex,
      suggestion: data.suggestion,
      model_used: 'gpt-4o',
    });
  }

  setAiLoading(false);
};
```

---

## 6. Step 4 — AI Suggestion Panel UI

Add this JSX inside the doctor chat screen, above the message input area:

```tsx
{/* AI Suggestion Panel */}
{showAiPanel && (
  <div className="mx-4 mb-3 bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-blue-200">
      <div className="flex items-center gap-2">
        <span className="text-base">🤖</span>
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">AI Clinical Suggestion</span>
        <span className="text-[10px] bg-blue-100 text-blue-500 px-2 py-0.5 rounded-full border border-blue-200">
          Advisory Only
        </span>
      </div>
      <button
        onClick={() => setShowAiPanel(false)}
        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-100"
      >
        <X className="w-3.5 h-3.5 text-blue-400" />
      </button>
    </div>

    <div className="px-4 py-3">
      {aiLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-blue-600">Analyzing symptoms...</span>
        </div>
      ) : (
        <>
          <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
            {aiSuggestion}
          </p>
          <p className="text-[10px] text-blue-400 mt-2 border-t border-blue-100 pt-2">
            This suggestion is generated by AI and is for reference only.
            The treating physician is solely responsible for clinical decisions.
          </p>
        </>
      )}
    </div>
  </div>
)}

{/* AI Trigger Button — add next to prescription button in doctor toolbar */}
<button
  onClick={handleGetAISuggestion}
  disabled={aiLoading}
  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-50"
>
  🤖 AI Suggest
</button>
```

---

## 7. Environment Variables Required

Add to `.env` (never commit to git):

```env
# Already present
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Add for AI feature
OPENAI_API_KEY=sk-...   # Set in Supabase Edge Function secrets, NOT in .env
```

> The `OPENAI_API_KEY` must be set as a **Supabase Edge Function secret**, not in the frontend `.env` file. It must never be exposed to the browser.

---

## 8. HIPAA Checklist Before Enabling AI in Production

- [ ] Sign BAA with OpenAI (https://openai.com/policies/business-associate-agreement) or use AWS Bedrock (BAA included with AWS HIPAA eligibility)
- [ ] Confirm `ai_suggestion_logs` table is created and RLS is enabled
- [ ] Confirm `sanitizeForAI()` strips all PHI before sending to AI
- [ ] Confirm AI API key is only in Supabase Edge Function secrets
- [ ] Confirm AI panel is only visible to the doctor, never the patient
- [ ] Add disclaimer text: "AI suggestions are advisory only"
- [ ] Test that AI suggestions are logged to `ai_suggestion_logs`

---

## 9. AWS Bedrock Alternative (Recommended for HIPAA)

AWS Bedrock is the preferred AI provider for HIPAA because:
- BAA is included with AWS HIPAA eligibility (no separate agreement needed)
- Data stays within your AWS region
- Supports Claude 3 (Anthropic) and Titan models

Replace the OpenAI call in the Edge Function with:

```typescript
// Using AWS Bedrock Claude 3 Sonnet
const response = await fetch(
  `https://bedrock-runtime.${Deno.env.get('AWS_REGION')}.amazonaws.com/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // AWS Signature V4 signing required — use aws4fetch library
    },
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 600,
      messages: [{ role: 'user', content: symptoms }],
    }),
  }
);
```

See: https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html

---

*Doctor-Side AI Instructions | Instant Doctor Connect | July 2025*
