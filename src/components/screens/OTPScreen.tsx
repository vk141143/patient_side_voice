import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface OTPScreenProps {
  phone: string;
  onVerify: () => void;
  onBack: () => void;
}

export function OTPScreen({ phone, onVerify, onBack }: OTPScreenProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      setTimeout(onVerify, 300);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Verify Phone</h1>
      </div>

      <div className="flex-1 px-6 pt-8">
        {/* Illustration */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          Enter verification code
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          We sent a 6-digit code to{' '}
          <span className="text-foreground font-medium">{phone || '+91 98765 43210'}</span>
        </p>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-3 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-border bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          ))}
        </div>

        {/* Resend */}
        <div className="text-center">
          {timer > 0 ? (
            <p className="text-muted-foreground">
              Resend code in <span className="text-primary font-semibold">{timer}s</span>
            </p>
          ) : (
            <button 
              onClick={() => setTimer(30)}
              className="text-primary font-semibold hover:underline"
            >
              Resend Code
            </button>
          )}
        </div>
      </div>

      {/* Continue Button */}
      <div className="px-6 pb-8 pt-4">
        <Button 
          variant="hero" 
          size="xl" 
          className="w-full"
          onClick={onVerify}
          disabled={!otp.every(d => d)}
        >
          Verify & Continue
        </Button>
      </div>
    </div>
  );
}
