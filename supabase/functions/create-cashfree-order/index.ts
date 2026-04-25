import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('FUNCTION STARTED: create-cashfree-order');

  try {
    // Step 1: Safe JSON parsing
    console.log('STEP 1: before json parse');
    let body: any;
    try {
      body = await req.json();
    } catch {
      console.error('STEP 1 FAILED: invalid JSON body');
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('STEP 2: after json parse', { amount: body.amount, userId: body.userId ? 'exists' : 'MISSING' });

    const amount = Number(body.amount);
    const userId: string = body.userId || '';
    const userPhone: string = body.userPhone || '9999999999';
    const userEmail: string = body.userEmail || 'user@example.com';
    const userName: string = body.userName || 'Patient';

    if (!amount || !userId) {
      return new Response(JSON.stringify({ error: 'amount and userId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Check env secrets
    const APP_ID = Deno.env.get('CASHFREE_APP_ID');
    const SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');

    console.log('STEP 3: ENV check', {
      APP_ID: APP_ID ? 'exists' : 'MISSING',
      SECRET_KEY: SECRET_KEY ? 'exists' : 'MISSING',
    });

    if (!APP_ID || !SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Cashfree credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Safe orderId — max 45 chars, no undefined crash
    const safeUserId = userId.substring(0, 20);
    const orderId = `w_${safeUserId}_${Date.now()}`.slice(0, 45);
    console.log('STEP 4: orderId generated', orderId);

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: safeUserId || 'guest',
        customer_phone: userPhone,
        customer_email: userEmail,
        customer_name: userName,
      },
      order_meta: {
        return_url: `https://yourdomain.com/payment-return?order_id={order_id}`,
        notify_url: '',
      },
    };

    // Step 3: Call Cashfree — safe response parsing
    console.log('STEP 5: before Cashfree fetch');
    const res = await fetch('https://sandbox.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'x-api-version': '2022-09-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    console.log('STEP 6: Cashfree raw response:', rawText);

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    if (!res.ok) {
      console.error('Cashfree order error:', data);
      return new Response(JSON.stringify({ error: 'Failed to create order', detail: data }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('STEP 7: success', { orderId: data.order_id, hasSessionId: !!data.payment_session_id });

    return new Response(JSON.stringify({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      amount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('UNHANDLED ERROR:', e);
    return new Response(JSON.stringify({ error: 'Internal server error', detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
