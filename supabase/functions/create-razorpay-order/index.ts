import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { amount, userId, userName, userEmail, userPhone } = await req.json();

    if (!amount || !userId) {
      return new Response(JSON.stringify({ error: 'amount and userId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID');
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!KEY_ID || !KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Razorpay amount is in paise (1 INR = 100 paise)
    const amountPaise = Math.round(Number(amount) * 100);

    // Unique receipt — max 40 chars
    const receipt = `w_${userId.substring(0, 15)}_${Date.now()}`.slice(0, 40);

    const payload = {
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        userId,
        userName:  userName  ?? 'Patient',
        userEmail: userEmail ?? '',
        userPhone: userPhone ?? '',
        purpose:   'wallet_recharge',
      },
    };

    const credentials = btoa(`${KEY_ID}:${KEY_SECRET}`);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Razorpay order error:', data);
      return new Response(JSON.stringify({ error: 'Failed to create order', detail: data }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      orderId:  data.id,
      amount:   Number(amount),
      currency: 'INR',
      keyId:    KEY_ID,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Unhandled error:', e);
    return new Response(JSON.stringify({ error: 'Internal server error', detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
