import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { checkEmailVerified, resendVerificationEmail } from '@/services/auth';

interface OTPScreenProps {
  phone?: string;
  email?: string;
  onVerify: () => void;
  onBack: () => void;
}

export function OTPScreen({ email = '', onVerify, onBack }: OTPScreenProps) {
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  // Auto-poll every 3 seconds to check if user clicked the link
  useEffect(() => {
    const interval = setInterval(async () => {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        clearInterval(interval);
        setVerified(true);
        setTimeout(onVerify, 1200);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [onVerify]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const handleCheckNow = async () => {
    setChecking(true);
    setError('');
    const isVerified = await checkEmailVerified();
    setChecking(false);
    if (isVerified) {
      setVerified(true);
      setTimeout(onVerify, 1000);
    } else {
      setError('Email not verified yet. Please click the link in your inbox.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    const { error: err } = await resendVerificationEmail();
    setResending(false);
    if (err) setError(err);
    else setResendTimer(60);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Verify Email</h1>
      </div>

      <div className="flex-1 px-6 pt-8 flex flex-col items-center">
        <div className={`w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center transition-colors ${verified ? 'bg-green-500/10' : 'bg-primary/10'}`}>
          {verified
            ? <CheckCircle2 className="w-10 h-10 text-green-500" />
            : <Mail className="w-10 h-10 text-primary" />
          }
        </div>

        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          {verified ? 'Email Verified!' : 'Check your email'}
        </h2>
        <p className="text-muted-foreground text-center mb-2 leading-relaxed">
          {verified
            ? 'Your email has been verified. Taking you to the next step...'
            : <>We sent a verification link to{' '}<span className="text-foreground font-semibold">{email}</span></>
          }
        </p>

        {!verified && (
          <p className="text-sm text-muted-foreground text-center mb-8">
            Click the link in the email to verify your account. This page will update automatically And the mail will be on spam
          </p>
        )}

        {error && (
          <div className="w-full bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}

        {!verified && (
          <div className="w-full space-y-3">
            <Button variant="hero" size="xl" className="w-full" onClick={handleCheckNow} disabled={checking}>
              {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : "I've verified my email"}
            </Button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Resend email in <span className="text-primary font-semibold">{resendTimer}s</span>
                </p>
              ) : (
                <button onClick={handleResend} disabled={resending} className="text-sm text-primary font-semibold hover:underline">
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-primary/5 rounded-xl p-3 mt-4">
              <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Checking automatically every few seconds...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
