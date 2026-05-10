import { useState } from 'react';
import { X, Wallet, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';

interface WalletRechargeModalProps {
  currentBalance: number;
  onRecharge: (amount: number) => void;
  onClose: () => void;
}

const PRESETS = [100, 200, 500, 1000];

function loadRazorpaySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

export function WalletRechargeModal({ currentBalance, onRecharge, onClose }: WalletRechargeModalProps) {
  const [amount, setAmount]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [paidAmt, setPaidAmt]   = useState(0);

  const parsed  = parseInt(amount, 10);
  const isValid = !isNaN(parsed) && parsed >= 1;

  const handlePay = async () => {
    if (!isValid || loading) return;
    setError(null);
    setLoading(true);

    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Not logged in');

      // Fetch user details for prefill
      const { data: userRow } = await supabase
        .from('users').select('name, phone').eq('id', user.uid).maybeSingle();

      // 1. Create Razorpay order via Edge Function
      const { data: orderData, error: fnErr } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount,
          userId:    user.uid,
          userName:  userRow?.name  ?? user.displayName ?? 'Patient',
          userEmail: user.email     ?? '',
          userPhone: userRow?.phone ?? '',
        },
      });

      if (fnErr || !orderData?.orderId) {
        throw new Error(orderData?.error ?? 'Failed to create payment order');
      }

      // 2. Load Razorpay SDK
      await loadRazorpaySDK();

      // 3. Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const options = {
          key:         orderData.keyId,
          amount:      parsed * 100,          // paise
          currency:    'INR',
          name:        'MediCare Wallet',
          description: 'Wallet Recharge',
          order_id:    orderData.orderId,
          prefill: {
            name:    userRow?.name  ?? '',
            email:   user.email     ?? '',
            contact: userRow?.phone ?? '',
          },
          theme: { color: '#0ea5e9' },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
          handler: async (response: any) => {
            try {
              // 4. Verify signature + credit wallet via Edge Function
              const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('verify-razorpay-payment', {
                body: {
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  userId: user.uid,
                  amount: parsed,
                },
              });

              if (verifyErr || !verifyData?.success) {
                throw new Error(verifyData?.error ?? 'Payment verification failed');
              }

              // 5. Update local wallet state
              onRecharge(parsed);
              setPaidAmt(parsed);
              setSuccess(true);
              resolve();
            } catch (e: any) {
              reject(e);
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          reject(new Error(resp.error?.description ?? 'Payment failed'));
        });
        rzp.open();
      });

    } catch (e: any) {
      if (e.message !== 'Payment cancelled') {
        setError(e.message ?? 'Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-background rounded-t-3xl flex flex-col" style={{ height: '80vh' }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Recharge Wallet</h2>
              <p className="text-xs text-muted-foreground">Secure payment via Razorpay</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-xl font-bold text-foreground">₹{paidAmt} Added!</p>
            <p className="text-sm text-muted-foreground">Your wallet has been recharged successfully</p>
            <Button variant="hero" size="lg" className="w-full mt-2" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">

              {/* Balance card */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Current Balance</p>
                  <p className="text-2xl font-bold text-primary">₹{currentBalance}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Quick presets */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Quick Add</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map((p) => (
                    <button key={p} onClick={() => setAmount(String(p))}
                      className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        amount === String(p)
                          ? 'border-primary bg-primary text-primary-foreground shadow-md'
                          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
                      }`}>
                      ₹{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Enter Custom Amount</p>
                <div className="flex items-center h-14 rounded-xl border-2 border-border bg-card px-4 gap-2 focus-within:border-primary transition-colors">
                  <span className="text-lg font-bold text-muted-foreground">₹</span>
                  <input type="number" placeholder="0" value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(null); }}
                    className="flex-1 bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none"
                    min={1} />
                  {amount && (
                    <button onClick={() => setAmount('')} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {isValid && (
                <Button variant="hero" size="xl" className="w-full text-base font-bold"
                  onClick={handlePay} disabled={loading}>
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    : <><Wallet className="w-5 h-5" /> Pay ₹{parsed}</>
                  }
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 pt-3 pb-6 border-t border-border bg-background">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                <p className="text-xs text-muted-foreground">100% Secure · Powered by Razorpay</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
