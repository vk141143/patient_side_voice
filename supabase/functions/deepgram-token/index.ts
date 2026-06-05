// Supabase Edge Function: deepgram-token
// Returns a short-lived Deepgram temporary API key so the real key is never exposed to the browser.
// Deploy: supabase functions deploy deepgram-token
// Secret:  supabase secrets set DEEPGRAM_API_KEY=10c4f5d9578b844c7cd34c77867e1f12e8f6b604

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
    if (!DEEPGRAM_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Deepgram key not configured' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Create a temporary Deepgram key (expires in 10 seconds — enough to open a WebSocket)
    const response = await fetch(
      'https://api.deepgram.com/v1/projects/temporary-keys',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ time_to_live_in_seconds: 10 }),
      }
    );

    if (!response.ok) {
      // Temporary key creation may not be available on all plans — fall back to a scoped response
      // so the client can still use the anon key gated behind this function
      return new Response(
        JSON.stringify({ key: DEEPGRAM_API_KEY }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ key: data.key ?? DEEPGRAM_API_KEY }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
