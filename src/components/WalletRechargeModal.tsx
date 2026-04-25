import { useState } from 'react';
import { X, Wallet, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── PAYMENT GATEWAY (Cashfree) — commented out for now ──────────────
// Will be re-enabled when payment integration is ready for production.
//
// import { supabase } from '@/lib/supabase';
// import { getCurrentUser } from '@/services/auth';
//
// function loadCashfreeSDK(): Promise<void> {
//   return new Promise((resolve, reject) => {
//     if ((window as any).Cashfree) { resolve(); return; }
//     const script = document.createElement('script');
//     script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
//     script.onload = () => resolve();
//     script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
//     document.head.appendChild(script);
//   });
// }
//
// const handlePay = async () => {
//   const user = getCurrentUser();
//   const { data: orderData } = await supabase.functions.invoke('create-cashfree-order', {
//     body: { amount: parsed, userId: user.uid, ... },
//   });
//   const cashfree = (window as any).Cashfree({ mode: 'sandbox' });
//   const result = await cashfree.checkout({ paymentSessionId: orderData.paymentSessionId, redirectTarget: '_modal' });
//   if (result.paymentDetails?.paymentMessage === 'Payment successful') {
//     await supabase.functions.invoke('verify-cashfree-payment', { body: { orderId: orderData.orderId, userId: user.uid } });
//     onRecharge(parsed);
//   }
// };
// ────────────────────────────────────────────────────────────────────

interface WalletRechargeModalProps {
  currentBalance: number;
  onRecharge: (amount: number) => void;
  onClose: () => void;
}

const PRESETS = [100, 200, 500, 1000];

export function WalletRechargeModal({ currentBalance, onRecharge, onClose }: WalletRechargeModalProps) {
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);

  const parsed = parseInt(amount, 10);
  const isValid = !isNaN(parsed) && parsed >= 1;

  const handlePay = () => {
    if (!isValid) return;
    onRecharge(parsed);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-background rounded-t-3xl flex flex-col"
        style={{ height: '80vh' }}>

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
              <p className="text-xs text-muted-foreground">Add money to your MediCare wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-xl font-bold text-foreground">₹{parsed} Added!</p>
            <p className="text-sm text-muted-foreground">Your wallet has been recharged successfully</p>
          </div>
        ) : (
          <>
            {/* Scrollable content */}
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
                    <button
                      key={p}
                      onClick={() => setAmount(String(p))}
                      className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        amount === String(p)
                          ? 'border-primary bg-primary text-primary-foreground shadow-md'
                          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
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
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none"
                    min={1}
                  />
                  {amount && (
                    <button onClick={() => setAmount('')} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isValid && (
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full text-base font-bold"
                  onClick={handlePay}
                >
                  <Wallet className="w-5 h-5" />
                  Add ₹{parsed} to Wallet
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 pt-3 pb-6 border-t border-border bg-background">
              <p className="text-xs text-muted-foreground text-center">
                Secured · Instant credit
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
