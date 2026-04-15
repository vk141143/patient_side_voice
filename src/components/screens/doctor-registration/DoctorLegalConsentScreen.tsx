import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield, Scale, AlertCircle, Database, ExternalLink, CheckSquare } from 'lucide-react';

interface DoctorLegalConsentScreenProps {
  onSubmit: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const consents = [
  {
    id: 'registered',
    icon: Shield,
    title: 'I am a registered medical practitioner',
    description: 'I confirm that I hold a valid medical license',
  },
  {
    id: 'telemedicine',
    icon: Scale,
    title: 'I agree to follow Telemedicine Practice Guidelines',
    description: 'As per the Telemedicine Practice Guidelines 2020',
    link: 'View Telemedicine Guidelines',
  },
  {
    id: 'terms',
    icon: FileText,
    title: 'I accept the platform Terms & Conditions',
    description: 'Including privacy policy and usage terms',
    link: 'View Terms & Privacy Policy',
  },
  {
    id: 'prescription',
    icon: AlertCircle,
    title: 'I understand my prescription responsibility',
    description: 'I am responsible for prescriptions I issue',
  },
  {
    id: 'data',
    icon: Database,
    title: 'I consent to data processing for verification',
    description: 'My data will be used for identity and credential verification',
  },
];

export function DoctorLegalConsentScreen({ onSubmit, onBack, currentStep, totalSteps }: DoctorLegalConsentScreenProps) {
  const [acceptedConsents, setAcceptedConsents] = useState<string[]>([]);

  const toggleConsent = (id: string) => {
    setAcceptedConsents(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const allAccepted = consents.every(c => acceptedConsents.includes(c.id));

  const acceptAll = () => {
    setAcceptedConsents(consents.map(c => c.id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Agreements & Declarations</h1>
        </div>
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

      <div className="flex-1 px-5 py-6 space-y-4 pb-24">
        {/* Accept All */}
        <button
          onClick={acceptAll}
          className="w-full p-4 rounded-xl border border-primary bg-primary/5 flex items-center justify-center gap-2"
        >
          <CheckSquare className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">Accept All</span>
        </button>

        {/* Individual Consents */}
        {consents.map((consent) => {
          const Icon = consent.icon;
          const isAccepted = acceptedConsents.includes(consent.id);

          return (
            <button
              key={consent.id}
              onClick={() => toggleConsent(consent.id)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                isAccepted 
                  ? 'border-success bg-success/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isAccepted 
                    ? 'border-success bg-success' 
                    : 'border-muted-foreground'
                }`}>
                  {isAccepted && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{consent.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{consent.description}</p>
                  {consent.link && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">
                      {consent.link}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* Legal Notice */}
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Important</p>
              <p className="text-xs text-muted-foreground mt-1">
                By submitting, you confirm that all information provided is accurate. 
                False information may lead to legal action and permanent ban from the platform.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4">
        <Button 
          variant="accent" 
          size="xl" 
          className="w-full" 
          onClick={onSubmit}
          disabled={!allAccepted}
        >
          Submit for Verification
        </Button>
      </div>
    </div>
  );
}
