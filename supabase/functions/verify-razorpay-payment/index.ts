import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Native Web Crypto HMAC-SHA256 — no external deps
async function hmacSHA256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      amount,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay secret not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 1. Verify HMAC-SHA256 signature — reject tampered requests ────────────
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated = await hmacSHA256(KEY_SECRET, body);

    if (generated !== razorpay_signature) {
      console.error('Signature mismatch', { generated, received: razorpay_signature });

      // Log failed attempt
      const supabaseFail = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      await supabaseFail.from('wallet_transactions').insert({
        user_id:              userId,
        amount:               Number(amount),
        type:                 'credit',
        method:               'razorpay',
        razorpay_payment_id:  razorpay_payment_id,
        razorpay_order_id:    razorpay_order_id,
        description:          'Wallet recharge — signature verification failed',
        status:               'failed',
      });

      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 2. Prevent duplicate processing — check if payment_id already exists ──
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: existing } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .eq('status', 'success')
      .maybeSingle();

    if (existing) {
      // Already processed — return success idempotently
      console.log('Duplicate payment ignored:', razorpay_payment_id);
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 3. Credit wallet atomically via RPC (FOR UPDATE row lock) ─────────────
    const { data: newBalance, error: rpcError } = await supabase.rpc('add_wallet', {
      p_user_id: userId,
      p_amount:  Number(amount),
    });

    let finalBalance = newBalance;

    if (rpcError) {
      console.error('add_wallet RPC error — falling back to manual update:', rpcError);
      // Fallback: fetch current + update
      const { data: row } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', userId)
        .single();

      const current = Number(row?.wallet_balance) || 0;
      finalBalance  = current + Number(amount);

      await supabase
        .from('users')
        .update({ wallet_balance: finalBalance })
        .eq('id', userId);
    }

    // ── 4. Store transaction record in wallet_transactions ────────────────────
    const { error: txnError } = await supabase.from('wallet_transactions').insert({
      user_id:              userId,
      amount:               Number(amount),
      type:                 'credit',
      method:               'razorpay',
      razorpay_payment_id:  razorpay_payment_id,
      razorpay_order_id:    razorpay_order_id,
      description:          'Wallet recharge via Razorpay',
      status:               'success',
      balance_after:        finalBalance ?? null,
    });

    if (txnError) {
      console.error('wallet_transactions insert error:', txnError);
      // Non-fatal — wallet is already credited, just log the error
    }

    console.log(`Wallet credited: user=${userId}, amount=${amount}, new_balance=${finalBalance}`);

    return new Response(JSON.stringify({ success: true, newBalance: finalBalance }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Unhandled error:', e);
    return new Response(JSON.stringify({ error: 'Internal server error', detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
