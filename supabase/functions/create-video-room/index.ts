import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: any = {};
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { sessionId } = body;
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      return new Response(JSON.stringify({ error: 'sessionId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const VIDEOSDK_API_KEY = Deno.env.get('VIDEOSDK_API_KEY');
    const VIDEOSDK_SECRET  = Deno.env.get('VIDEOSDK_SECRET');
    if (!VIDEOSDK_API_KEY || !VIDEOSDK_SECRET) {
      return new Response(JSON.stringify({ error: 'VIDEOSDK credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a fresh JWT signed with the secret (valid 24 h)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(VIDEOSDK_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const payload = btoa(JSON.stringify({
      apikey: VIDEOSDK_API_KEY,
      permissions: ['allow_join', 'allow_mod'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    })).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const sigBuf  = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(`${header}.${payload}`));
    const sig     = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const VIDEOSDK_TOKEN = `${header}.${payload}.${sig}`;

    // Create a new VideoSDK room for this session
    const createRes = await fetch('https://api.videosdk.live/v2/rooms', {
      method: 'POST',
      headers: {
        Authorization: VIDEOSDK_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customRoomId: `session-${sessionId}`.replace(/[^a-zA-Z0-9-]/g, '-').substring(0, 36),
      }),
    });

    const createData = await createRes.json();

    // If room already exists with that customRoomId, VideoSDK returns the existing one
    if (!createRes.ok && createData?.message !== 'Room already exists') {
      console.error('[create-video-room] VideoSDK error:', JSON.stringify(createData));
      return new Response(JSON.stringify({ error: 'Failed to create room', detail: createData }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const roomId = createData.roomId;
    return new Response(JSON.stringify({ roomId, token: VIDEOSDK_TOKEN }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Edge function error:', e);
    return new Response(JSON.stringify({ error: 'Internal server error', detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
