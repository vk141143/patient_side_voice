import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('FUNCTION STARTED: verify-cashfree-payment');

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
    console.log('STEP 2: after json parse', { orderId: body.orderId, userId: body.userId ? 'exists' : 'MISSING' });

    const orderId: string = body.orderId || '';
    const userId: string = body.userId || '';

    if (!orderId || !userId) {
      return new Response(JSON.stringify({ error: 'orderId and userId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Check env secrets
    const APP_ID = Deno.env.get('CASHFREE_APP_ID');
    const SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY'); // manually added secret name

    console.log('STEP 3: ENV check', {
      APP_ID: APP_ID ? 'exists' : 'MISSING',
      SECRET_KEY: SECRET_KEY ? 'exists' : 'MISSING',
      SUPABASE_URL: SUPABASE_URL ? 'exists' : 'MISSING',
      SUPABASE_SERVICE_KEY: SUPABASE_SERVICE_KEY ? 'exists' : 'MISSING',
    });

    if (!APP_ID || !SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration missing — check secrets' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Verify with Cashfree — safe response parsing
    console.log('STEP 4: before Cashfree fetch');
    const res = await fetch(`https://sandbox.cashfree.com/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-api-version': '2022-09-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
      },
    });

    const rawText = await res.text();
    console.log('STEP 5: Cashfree raw response:', rawText);

    let orderData: any;
    try {
      orderData = JSON.parse(rawText);
    } catch {
      orderData = rawText;
    }

    if (!res.ok || orderData.order_status !== 'PAID') {
      console.log('STEP 5: payment not PAID, status:', orderData.order_status);
      return new Response(JSON.stringify({
        success: false,
        status: orderData.order_status ?? 'UNKNOWN',
        error: 'Payment not completed',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use actual amount from Cashfree — never trust frontend
    const actualAmount = Number(orderData.order_amount);
    console.log('STEP 6: payment PAID, actualAmount:', actualAmount);

    // Step 4: Init Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Step 5: Idempotency check — prevent double credit
    console.log('STEP 7: idempotency check');
    const { data: existing } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existing) {
      console.log('STEP 7: already processed, skipping');
      return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 6: Fetch current wallet balance
    console.log('STEP 8: fetching user wallet');
    const { data: userRow, error: fetchErr } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (fetchErr || !userRow) {
      console.error('STEP 8 FAILED: user not found', fetchErr);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newBalance = Number(userRow.wallet_balance || 0) + actualAmount;
    console.log('STEP 9: updating wallet', { old: userRow.wallet_balance, new: newBalance });

    // Step 7: Credit wallet
    const { error: updateErr } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId);

    if (updateErr) {
      console.error('STEP 9 FAILED: wallet update error', updateErr);
      return new Response(JSON.stringify({ error: 'Failed to credit wallet', detail: updateErr }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 8: Log transaction
    console.log('STEP 10: logging transaction');
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      order_id: orderId,
      amount: actualAmount,
      type: 'credit',
      status: 'success',
      gateway: 'cashfree',
      created_at: new Date().toISOString(),
    });

    console.log('STEP 11: all done, success');
    return new Response(JSON.stringify({ success: true, newBalance }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('UNHANDLED ERROR:', e);
    return new Response(JSON.stringify({ error: 'Internal server error', detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
