import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { UserProfile } from '@/types/app';

interface ProfileScreenProps {
  onComplete: (profile: UserProfile) => void;
  onBack: () => void;
  phone?: string;
}

export function ProfileScreen({ onComplete, onBack, phone = '' }: ProfileScreenProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  const isValid = name.trim() && age && gender;

  const handleSubmit = () => {
    if (isValid) {
      onComplete({ name, age, gender, phone });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Your Profile</h1>
      </div>

      <div className="flex-1 px-6 pt-4 overflow-y-auto">
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">Tell us about yourself</h2>
        <p className="text-muted-foreground text-center mb-8">This helps doctors provide better care</p>

        <div className="space-y-5">
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
            <button onClick={() => setShowPromo(o => !o)}
              className="flex items-center gap-2 text-sm font-medium text-primary">
              <Tag className="w-4 h-4" />
              Have a promo code? (Optional)
              {showPromo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showPromo && (
              <div className="mt-3">
                <Input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  className="h-12 rounded-xl text-base tracking-widest font-semibold"
                  maxLength={12}
                />
                {promoCode.length >= 4 && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium">✓ Promo code will be applied on signup</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-6">
        <Button variant="hero" size="xl" className="w-full" onClick={handleSubmit} disabled={!isValid}>
          Get Started
        </Button>
      </div>
    </div>
  );
}