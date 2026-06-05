// Supabase Edge Function: analyze-symptoms
// Server-side Gemini API call — GEMINI_API_KEY lives only in Supabase secrets.
// Frontend never sees the key, never calls Gemini directly.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface AnalyzeRequest {
  transcript: string;
  language: string;
}

interface AnalysisResult {
  symptoms: string[];
  recommendedDoctor: string;
  confidence: 'Low' | 'Medium' | 'High';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured in Supabase secrets');
    }

    const body: AnalyzeRequest = await req.json();
    const { transcript, language } = body;

    if (!transcript?.trim()) {
      return new Response(
        JSON.stringify({ error: 'transcript is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a healthcare symptom extraction engine.

Analyze the patient statement and extract medical symptoms.
Return ONLY valid JSON — no markdown, no code blocks, no extra text.

Schema:
{
  "symptoms": ["Fever", "Headache"],
  "recommendedDoctor": "General Physician",
  "confidence": "High"
}

Rules:
- Extract ONLY medical symptoms
- Symptom names must be in English regardless of input language
- recommendedDoctor is always "General Physician"
- confidence: "High" if 2+ symptoms, "Medium" if 1, "Low" if 0
- Return empty symptoms array if no medical symptoms found

Patient language: ${language}
Patient statement: ${transcript}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
        }),
      }
    );

    if (!geminiRes.ok) {
      throw new Error(`Gemini API returned ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Strip markdown fences if Gemini adds them despite instructions
    const cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    let result: AnalysisResult;
    try {
      const parsed = JSON.parse(cleaned);
      result = {
        symptoms:          Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
        recommendedDoctor: parsed.recommendedDoctor ?? 'General Physician',
        confidence:        ['Low', 'Medium', 'High'].includes(parsed.confidence)
                             ? parsed.confidence
                             : 'Low',
      };
    } catch {
      // JSON parse failed — return safe default
      result = { symptoms: [], recommendedDoctor: 'General Physician', confidence: 'Low' };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[analyze-symptoms]', err);
    return new Response(
      JSON.stringify({
        symptoms: [],
        recommendedDoctor: 'General Physician',
        confidence: 'Low',
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
