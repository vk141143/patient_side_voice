import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Wallet, Smartphone, Shield, Check } from 'lucide-react';

interface PaymentScreenProps {
  consultationFee: number;
  onPaymentComplete: () => void;
  onBack: () => void;
}

const paymentMethods = [
  { id: 'upi', label: 'UPI', icon: Smartphone, description: 'GPay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, description: 'Paytm, Amazon Pay' },
];

export function PaymentScreen({ consultationFee, onPaymentComplete, onBack }: PaymentScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  const tax = Math.round(consultationFee * 0.18);
  const total = consultationFee + tax;

  const handlePayment = () => {
    setProcessing(true);
    // Simulate payment
    setTimeout(() => {
      setProcessing(false);
      onPaymentComplete();
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-card">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Payment</h1>
      </div>

      <div className="flex-1 px-5 py-6">
        {/* Price Breakdown */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Price Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Consultation Fee</span>
              <span className="text-foreground">₹{consultationFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="text-foreground">₹{tax}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-lg text-primary">₹{total}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h2 className="font-semibold text-foreground mb-4">Select Payment Method</h2>
          <div className="space-y-3">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedMethod === method.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedMethod === method.id ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <method.icon className={`w-6 h-6 ${
                    selectedMethod === method.id ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{method.label}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
                {selectedMethod === method.id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-3 bg-success/10 rounded-xl p-4 mb-6">
          <Shield className="w-5 h-5 text-success flex-shrink-0" />
          <p className="text-sm text-success">Your payment is secured with 256-bit encryption</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-4 bg-card border-t border-border">
        <Button 
          variant="hero" 
          size="xl" 
          className="w-full"
          onClick={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay ₹{total}</>
          )}
        </Button>
      </div>
    </div>
  );
}
