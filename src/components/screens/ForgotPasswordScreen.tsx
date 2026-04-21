import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Eye, EyeOff, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { forgotPassword } from '@/services/auth';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  oobCode?: string; // auto-passed when opened from Firebase email link
}

type Step = 'email' | 'sent' | 'reset' | 'done';

export function ForgotPasswordScreen({ onBack, onSuccess, oobCode: initialCode }: ForgotPasswordScreenProps) {
  // If oobCode is passed from URL, jump straight to reset step
  const [step, setStep] = useState<Step>(initialCode ? 'reset' : 'email');
  const [email, setEmail] = useState('');
  const [oobCode] = useState(initialCode ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendLink = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await forgotPassword(email);
    setLoading(false);
    if (err) { setError(err); return; }
    setStep('sent');
  };

  const handleResetPassword = async () => {
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStep('done');
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      const map: Record<string, string> = {
        'auth/invalid-action-code': 'Reset link is invalid or expired. Request a new one.',
        'auth/expired-action-code': 'Reset link has expired. Request a new one.',
        'auth/weak-password': 'Password must be at least 6 characters.',
      };
      setError(map[err.code] ?? 'Failed to reset password. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          {step === 'reset' || step === 'done' ? 'Reset Password' : 'Forgot Password'}
        </h1>
      </div>

      <div className="flex-1 px-6 pt-6">

        {/* Step 1: Enter email */}
        {step === 'email' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center mb-2">Reset Password</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Enter your registered email. We'll send you a password reset link.
            </p>
            {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-4"><p className="text-sm text-destructive">{error}</p></div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <Input type="email" placeholder="Enter your email" value={email}
                  onChange={e => setEmail(e.target.value)} className="h-14 rounded-xl text-base" />
              </div>
              <Button variant="hero" size="xl" className="w-full" onClick={handleSendLink} disabled={!email || loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Email sent — wait for user to click link */}
        {step === 'sent' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center mb-2">Check your email</h2>
            <p className="text-sm text-muted-foreground text-center mb-4 leading-relaxed">
              We sent a password reset link to{' '}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground font-medium mb-1">What to do next:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open the email from MediCare</li>
                <li>Click the <span className="text-primary font-medium">"Reset Password"</span> link</li>
                <li>You'll be taken directly to the new password screen</li>
              </ol>
            </div>
            <button onClick={handleSendLink} disabled={loading}
              className="w-full text-center text-sm text-primary font-medium hover:underline">
              {loading ? 'Sending...' : 'Resend email'}
            </button>
          </>
        )}

        {/* Step 3: Set new password (reached via email link with oobCode) */}
        {step === 'reset' && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center mb-2">Set New Password</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Enter and confirm your new password below.
            </p>
            {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-4"><p className="text-sm text-destructive">{error}</p></div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                <div className="relative">
                  <Input type={showNew ? 'text' : 'password'} placeholder="Min. 6 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="h-14 rounded-xl text-base pr-12" />
                  <button type="button" onClick={() => setShowNew(o => !o)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <div className="relative">
                  <Input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter new password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="h-14 rounded-xl text-base pr-12" />
                  <button type="button" onClick={() => setShowConfirm(o => !o)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
              <Button variant="hero" size="xl" className="w-full" onClick={handleResetPassword}
                disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save New Password'}
              </Button>
            </div>
          </>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Password Updated!</h2>
            <p className="text-sm text-muted-foreground text-center">
              Your password has been reset successfully. Redirecting to login...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
