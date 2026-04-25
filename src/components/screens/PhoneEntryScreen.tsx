import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Smartphone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { checkPhoneExists } from '@/services/auth';

interface PhoneEntryScreenProps {
  onContinue: (phone: string, email: string, password: string) => Promise<void>;
  onBack: () => void;
}

export function PhoneEntryScreen({ onContinue, onBack }: PhoneEntryScreenProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phoneDigits = phone.replace(/\D/g, '');
  const isValid = phoneDigits.length >= 10 && email.includes('@') && password.length >= 6;

  const getPasswordStrength = (pwd: string) => {
    if (!pwd.length) return null;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (pwd.length >= 10 && score >= 2) return { label: 'Strong', bar: 100, barColor: '#22c55e', text: 'text-green-600' };
    if (pwd.length >= 6 && (pwd.length >= 8 || score >= 1)) return { label: 'Medium', bar: 60, barColor: '#fb923c', text: 'text-orange-500' };
    return { label: 'Weak', bar: 30, barColor: '#ef4444', text: 'text-red-600' };
  };

  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      // Check phone uniqueness
      const phoneExists = await checkPhoneExists(`+91 ${phone}`);
      if (phoneExists) { setError('This mobile number is already registered.'); setLoading(false); return; }
      await onContinue(`+91 ${phone}`, email, password);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Create Account</h1>
      </div>

      <div className="flex-1 px-6 pt-6 space-y-5 overflow-y-auto">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground text-center mb-1">Register</h2>
        <p className="text-muted-foreground text-center mb-2 text-sm">Enter your details to create your account</p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Mobile Number</label>
          <div className="flex gap-3">
            <div className="h-14 px-4 flex items-center rounded-xl border-2 border-border bg-card text-foreground font-medium text-base">+91</div>
            <Input type="tel" placeholder="10-digit mobile number" value={phone} onChange={handleChange}
              className="h-14 rounded-xl text-base flex-1 tracking-widest" inputMode="numeric" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
          <Input type="email" placeholder="Enter your email" value={email}
            onChange={e => setEmail(e.target.value)} className="h-14 rounded-xl text-base" />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Create Password</label>
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters"
              value={password} onChange={e => setPassword(e.target.value)} className="h-14 rounded-xl text-base pr-12" />
            <button type="button" onClick={() => setShowPassword(o => !o)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password.length > 0 && password.length < 6 && (
            <p className="text-xs text-destructive mt-1">Password must be at least 6 characters</p>
          )}
          {strength && (
            <div className="mt-2 space-y-1">
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${strength.bar}%`, backgroundColor: strength.barColor }}
                />
              </div>
              <p className={`text-xs font-medium ${strength.text}`}>{strength.label}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <Button variant="hero" size="xl" className="w-full" onClick={handleSubmit} disabled={!isValid || loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
