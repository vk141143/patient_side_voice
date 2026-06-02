import { useState } from 'react';
import { Shield, FileText, Lock, Eye, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrivacyConsentScreenProps {
  onAccept: () => void;
}

const CONSENT_KEY = 'mc_hipaa_consent_v1';

export function hasAcceptedConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

const sections = [
  {
    icon: <Eye className="w-5 h-5 text-primary" />,
    title: 'What Information We Collect',
    body: 'We collect your name, email, phone number, age, gender, location, and health information you share during consultations (symptoms, chat messages, prescriptions, and uploaded medical files). This is Protected Health Information (PHI) under HIPAA.',
  },
  {
    icon: <Lock className="w-5 h-5 text-primary" />,
    title: 'How We Protect Your Data',
    body: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your health data is stored on HIPAA-compliant servers. We use Row Level Security so only you and your treating doctor can access your records.',
  },
  {
    icon: <FileText className="w-5 h-5 text-primary" />,
    title: 'How We Use Your Information',
    body: 'Your PHI is used solely to provide telehealth services — connecting you with doctors, generating prescriptions, and maintaining your health records. We do not sell your data. We do not use your PHI to train AI models without your explicit consent.',
  },
  {
    icon: <Shield className="w-5 h-5 text-primary" />,
    title: 'Your HIPAA Rights',
    body: 'You have the right to: (1) access and receive a copy of your health records, (2) request corrections to your records, (3) know who has accessed your records, (4) request restrictions on how your data is used, and (5) request deletion of your account and data.',
  },
];

export function PrivacyConsentScreen({ onAccept }: PrivacyConsentScreenProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    if (!checked) return;
    localStorage.setItem(CONSENT_KEY, 'accepted');
    onAccept();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero px-6 pt-12 pb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Your Privacy Matters</h1>
        <p className="text-white/80 text-sm leading-relaxed">
          Before you begin, please review how we handle your health information in compliance with HIPAA.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {/* HIPAA badge */}
        <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-2xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-success">HIPAA Compliant Platform</p>
            <p className="text-xs text-muted-foreground">Your health data is protected under federal law</p>
          </div>
        </div>

        {/* Expandable sections */}
        {sections.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-4 text-left"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {s.icon}
              </div>
              <span className="flex-1 font-semibold text-foreground text-sm">{s.title}</span>
              {expanded === i
                ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              }
            </button>
            {expanded === i && (
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            )}
          </div>
        ))}

        {/* Third-party notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">Third-Party Services</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            We use VideoSDK for video consultations and Razorpay/Cashfree for payments. These services may receive limited information necessary to provide their services. All vendors are bound by data protection agreements.
          </p>
        </div>

        {/* Consent checkbox */}
        <button
          onClick={() => setChecked(c => !c)}
          className="w-full flex items-start gap-3 bg-card border-2 border-border rounded-2xl px-4 py-4 text-left transition-colors"
          style={{ borderColor: checked ? 'hsl(var(--primary))' : undefined }}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
            checked ? 'bg-primary border-primary' : 'border-border'
          }`}>
            {checked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            I have read and agree to the{' '}
            <span className="text-primary font-semibold">Privacy Notice</span> and{' '}
            <span className="text-primary font-semibold">Terms of Service</span>. I consent to the collection and use of my health information as described above.
          </p>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 pt-4 bg-background border-t border-border">
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          disabled={!checked}
          onClick={handleAccept}
        >
          <Shield className="w-4 h-4" />
          I Agree — Continue Securely
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          You can review this notice anytime in Settings → Privacy
        </p>
      </div>
    </div>
  );
}
