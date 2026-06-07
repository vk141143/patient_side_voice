import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { create } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateVideoSDKToken(apiKey: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );

  const now = Math.floor(Date.now() / 1000);

  const token = await create(
    { alg: 'HS256', typ: 'JWT' },
    {
      apikey: apiKey,
      permissions: ['allow_join', 'allow_mod'],
      iat: now,
      exp: now + 86400, // 24 hours
    },
    key,
  );

  return token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sessionId } = body;
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      return new Response(JSON.stringify({ error: 'sessionId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read secrets
    const VIDEOSDK_API_KEY = Deno.env.get('VIDEOSDK_API_KEY');
    const VIDEOSDK_SECRET  = Deno.env.get('VIDEOSDK_SECRET');

    if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET) {
      console.error('[create-video-room] Missing VIDEOSDK_API_KEY or VIDEOSDK_SECRET');
      return new Response(JSON.stringify({ error: 'VideoSDK credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate fresh JWT on every request
    const token = await generateVideoSDKToken(VIDEOSDK_API_KEY, VIDEOSDK_SECRET);
    console.log('[create-video-room] JWT generated successfully');

    // Build a deterministic room ID from session ID
    const customRoomId = `session-${sessionId}`
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .substring(0, 36);

    // Try to fetch existing room first (idempotent)
    const getRes = await fetch(`https://api.videosdk.live/v2/rooms/${customRoomId}`, {
      method: 'GET',
      headers: { Authorization: token },
    });

    if (getRes.ok) {
      const existing = await getRes.json();
      console.log('[create-video-room] Reusing existing room:', existing.roomId);
      return new Response(JSON.stringify({ roomId: existing.roomId, token }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Room doesn't exist — create it
    const createRes = await fetch('https://api.videosdk.live/v2/rooms', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customRoomId }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error('[create-video-room] VideoSDK error:', JSON.stringify(createData));
      return new Response(JSON.stringify({ error: 'Failed to create room', detail: createData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[create-video-room] Room created:', createData.roomId);
    return new Response(JSON.stringify({ roomId: createData.roomId, token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('[create-video-room] Unhandled error:', String(e));
    return new Response(JSON.stringify({ error: 'Internal server error', detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
