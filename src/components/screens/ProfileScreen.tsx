import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Tag, ChevronDown, ChevronUp, Loader2, X, FileText, Shield } from 'lucide-react';
import { UserProfile } from '@/types/app';
import { saveProfileToSupabase, getCurrentUser } from '@/services/auth';

interface ProfileScreenProps {
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
  phone?: string;
  email?: string;
  password?: string;
}

const TC_POINTS = [
  'MediCare provides a platform to connect patients with licensed medical professionals.',
  'Consultations on MediCare are not a substitute for emergency medical care.',
  'Users must be 18 years or older to register independently.',
  'All information provided must be accurate and truthful.',
  'MediCare reserves the right to suspend accounts that violate these terms.',
  'Consultation fees are non-refundable once a session has started.',
  'Users are responsible for maintaining the confidentiality of their account credentials.',
  'MediCare may update these terms at any time with prior notice.',
  'By using MediCare, you consent to receiving health-related communications.',
  'Disputes shall be governed by the laws of India.',
];

const PP_POINTS = [
  'We collect personal information including name, age, gender, phone, email, and location.',
  'Your data is used solely to provide and improve MediCare services.',
  'We never sell your personal data to third parties.',
  'All data is encrypted using 256-bit SSL encryption in transit and at rest.',
  'Location data is used only to find nearby doctors and clinics.',
  'Health records are accessible only to you and your treating doctors.',
  'You may request deletion of your data at any time by contacting support.',
  'We use cookies to improve app performance and user experience.',
  'Third-party analytics tools may collect anonymised usage data.',
  'For privacy concerns, contact us at privacy@medicare.app.',
];

function TermsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'tc' | 'pp'>('tc');
  const points = activeTab === 'tc' ? TC_POINTS : PP_POINTS;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-t-3xl flex flex-col" style={{ height: '80vh' }}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <h3 className="text-base font-bold text-foreground">Legal Documents</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 py-3 border-b border-border flex-shrink-0">
          <button onClick={() => setActiveTab('tc')}
            className={`flex items-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'tc' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
            <FileText className="w-4 h-4" /> T&C
          </button>
          <button onClick={() => setActiveTab('pp')}
            className={`flex items-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'pp' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
            <Shield className="w-4 h-4" /> Privacy Policy
          </button>
        </div>

        {/* Content with text reveal animation */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3">
          <h4 className="text-sm font-bold text-foreground mb-3">
            {activeTab === 'tc' ? 'Terms & Conditions' : 'Privacy Policy'}
          </h4>
          {points.map((point, i) => (
            <div key={`${activeTab}-${i}`}
              className="flex items-start gap-3 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{point}</p>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 px-5 pb-8 pt-3 border-t border-border">
          <Button variant="hero" size="lg" className="w-full" onClick={onClose}>
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProfileScreen({ onComplete, onBack, phone = '', email = '', password = '' }: ProfileScreenProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = name.trim() && age && gender && agreedToTerms;

  const handleSubmit = async () => {
    if (!isValid) return;
    setError('');
    setLoading(true);
    const firebaseUser = getCurrentUser();
    if (firebaseUser) {
      const { error: err } = await saveProfileToSupabase(
        firebaseUser.uid,
        firebaseUser.email ?? email,
        name, age, gender, phone,
        promoCode || undefined,
        password || undefined
      );
      if (err) { setError(err); setLoading(false); return; }
    }
    setLoading(false);
    onComplete({ name, age, gender, phone });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4 flex-shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Your Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-4">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">Tell us about yourself</h2>
        <p className="text-muted-foreground text-center mb-6">This helps doctors provide better care</p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-5 pb-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Your Name</label>
            <Input type="text" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} className="h-14 rounded-xl text-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Age</label>
            <Input type="number" placeholder="Enter your age" value={age} onChange={e => setAge(e.target.value)} className="h-14 rounded-xl text-base" min="1" max="120" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Gender</label>
            <div className="flex gap-3">
              {[{ value: 'male', label: 'Male', icon: '👨' }, { value: 'female', label: 'Female', icon: '👩' }, { value: 'other', label: 'Other', icon: '🧑' }].map(option => (
                <button key={option.value} onClick={() => setGender(option.value as typeof gender)}
                  className={`flex-1 h-14 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                    gender === option.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:border-primary/50'
                  }`}>
                  <span>{option.icon}</span>{option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Promo Code */}
          <div>
            <button onClick={() => setShowPromo(o => !o)} className="flex items-center gap-2 text-sm font-medium text-primary">
              <Tag className="w-4 h-4" />
              Have a promo code? (Optional)
              {showPromo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showPromo && (
              <div className="mt-3">
                <Input type="text" placeholder="Enter promo code" value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  className="h-12 rounded-xl text-base tracking-widest font-semibold" maxLength={12} />
                {promoCode.length >= 4 && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium">✓ Promo code will be applied on signup</p>
                )}
              </div>
            )}
          </div>

          {/* T&C Checkbox */}
          <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-4">
            <input type="checkbox" id="terms" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-border accent-primary flex-shrink-0 cursor-pointer" />
            <label htmlFor="terms" className="text-sm text-foreground leading-relaxed cursor-pointer">
              I agree to the{' '}
              <button type="button" onClick={() => setShowTerms(true)} className="text-primary font-semibold hover:underline">
                Terms & Conditions and Privacy Policy
              </button>
            </label>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-6 pb-8 pt-4">
        <Button variant="hero" size="xl" className="w-full" onClick={handleSubmit} disabled={!isValid || loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Get Started'}
        </Button>
        {!agreedToTerms && name && age && gender && (
          <p className="text-xs text-destructive text-center mt-2">Please agree to Terms & Conditions to continue</p>
        )}
      </div>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}
