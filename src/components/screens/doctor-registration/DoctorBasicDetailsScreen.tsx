import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Phone, Mail, MapPin } from 'lucide-react';

interface DoctorBasicDetailsScreenProps {
  onSubmit: (data: BasicDetails) => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export interface BasicDetails {
  fullName: string;
  mobile: string;
  email: string;
  city: string;
  state: string;
  gender: string;
}

export function DoctorBasicDetailsScreen({ onSubmit, onBack, currentStep, totalSteps }: DoctorBasicDetailsScreenProps) {
  const [formData, setFormData] = useState<BasicDetails>({
    fullName: '',
    mobile: '',
    email: '',
    city: '',
    state: '',
    gender: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOtp = () => {
    if (formData.mobile.length >= 10) {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      setOtpVerified(true);
    }
  };

  const isValid = formData.fullName && formData.mobile && formData.email && formData.city && formData.state && otpVerified;

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(formData);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Basic Information</h1>
        </div>
        {/* Progress Bar */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-secondary'}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Step {currentStep} of {totalSteps}</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-5">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name (as per certificate)</Label>
          <Input
            id="fullName"
            placeholder="Dr. John Doe"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        {/* Mobile with OTP */}
        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile Number</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="mobile"
                placeholder="9876543210"
                className="pl-10"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                disabled={otpVerified}
              />
            </div>
            {!otpSent && (
              <Button variant="outline" onClick={handleSendOtp} disabled={formData.mobile.length < 10}>
                Send OTP
              </Button>
            )}
          </div>
          
          {otpSent && !otpVerified && (
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
              <Button variant="outline" onClick={handleVerifyOtp} disabled={otp.length !== 6}>
                Verify
              </Button>
            </div>
          )}
          
          {otpVerified && (
            <p className="text-sm text-success flex items-center gap-1">
              ✓ Mobile verified
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="doctor@email.com"
              className="pl-10"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        {/* City & State */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="city"
                placeholder="Mumbai"
                className="pl-10"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="Maharashtra"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
        </div>

        {/* Gender (Optional) */}
        <div className="space-y-2">
          <Label>Gender (Optional)</Label>
          <div className="flex gap-2">
            {['Male', 'Female', 'Other'].map((gender) => (
              <button
                key={gender}
                onClick={() => setFormData({ ...formData, gender: gender.toLowerCase() })}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  formData.gender === gender.toLowerCase()
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4">
        <Button 
          variant="accent" 
          size="xl" 
          className="w-full" 
          onClick={handleSubmit}
          disabled={!isValid}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
