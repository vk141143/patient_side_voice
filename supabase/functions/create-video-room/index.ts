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

    const VIDEOSDK_TOKEN = Deno.env.get('DAILY_API_KEY'); // reusing same secret slot
    if (!VIDEOSDK_TOKEN) {
      return new Response(JSON.stringify({ error: 'VIDEOSDK token not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      console.error('VideoSDK create room error:', createData);
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
