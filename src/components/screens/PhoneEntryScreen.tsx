import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Smartphone } from 'lucide-react';

interface PhoneEntryScreenProps {
  onContinue: (phone: string) => void;
  onBack: () => void;
}

export function PhoneEntryScreen({ onContinue, onBack }: PhoneEntryScreenProps) {
  const [phone, setPhone] = useState('');

  const isValid = phone.replace(/\D/g, '').length >= 10;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Enter Mobile Number</h1>
      </div>

      <div className="flex-1 px-6 pt-8">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          What's your number?
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          We'll send a verification code to this number
        </p>

        <div className="flex gap-3">
          <div className="h-14 px-4 flex items-center rounded-xl border-2 border-border bg-card text-foreground font-medium text-base">
            +91
          </div>
          <Input
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={handleChange}
            className="h-14 rounded-xl text-base flex-1 text-lg tracking-widest"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={() => onContinue(`+91 ${phone}`)}
          disabled={!isValid}
        >
          Send OTP
        </Button>
      </div>
    </div>
  );
}
