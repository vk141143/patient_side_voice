import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Wallet, Smartphone, Banknote, Check, Shield, Info } from 'lucide-react';
import { Medicine } from '@/types/app';

interface PricePaymentScreenProps {
  medicines: Medicine[];
  onPaymentComplete: (method: string) => void;
  onBack: () => void;
}

const paymentOptions = [
  { id: 'pharmacy', label: 'Pay via MOM Pharmacy', icon: Wallet, description: 'UPI, Cards, Net Banking' },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, description: 'Pay when you receive' },
];

export function PricePaymentScreen({ medicines, onPaymentComplete, onBack }: PricePaymentScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState('pharmacy');
  const [processing, setProcessing] = useState(false);

  // Calculate prices (simulated)
  const medicineTotal = medicines.reduce((sum, med) => sum + (med.price || 99), 0);
  const deliveryCharge = 49;
  const total = medicineTotal + deliveryCharge;

  const handlePayment = () => {
    if (selectedMethod === 'cod') {
      onPaymentComplete('cod');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentComplete(selectedMethod);
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
        <h1 className="text-lg font-semibold text-foreground">Medicine Payment</h1>
      </div>

      <div className="flex-1 px-5 py-6">
        {/* Medicine Price List */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-4">
          <h2 className="font-semibold text-foreground mb-4">Medicine Prices</h2>
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Prices provided by MOM Pharmacy
          </p>
          <div className="space-y-3">
            {medicines.map((med, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium text-foreground text-sm">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.duration}</p>
                </div>
                <span className="font-semibold text-foreground">₹{med.price || 99}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Medicines Total</span>
              <span className="text-foreground">₹{medicineTotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Charges</span>
              <span className="text-foreground">₹{deliveryCharge}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-semibold text-foreground">Total Amount</span>
              <span className="font-bold text-lg text-primary">₹{total}</span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="mb-6">
          <h2 className="font-semibold text-foreground mb-4">Payment Method</h2>
          <div className="space-y-3">
            {paymentOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setSelectedMethod(option.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedMethod === option.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedMethod === option.id ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <option.icon className={`w-6 h-6 ${
                    selectedMethod === option.id ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                {selectedMethod === option.id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pharmacy Notice */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Payment is processed by <strong>MOM Pharmacy</strong>. Your payment details are secured and not stored by us.
            </p>
          </div>
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
          ) : selectedMethod === 'cod' ? (
            'Place Order (Cash on Delivery)'
          ) : (
            `Pay ₹${total}`
          )}
        </Button>
      </div>
    </div>
  );
}
