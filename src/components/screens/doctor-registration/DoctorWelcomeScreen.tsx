import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Clock, Users, Globe, CheckCircle } from 'lucide-react';
import logoImage from '@/assets/logo.png';

interface DoctorWelcomeScreenProps {
  onStart: () => void;
  onBack: () => void;
}

export function DoctorWelcomeScreen({ onStart, onBack }: DoctorWelcomeScreenProps) {
  const benefits = [
    { icon: Users, title: 'Earn from consultations', description: 'Flexible income from online, OPD, or home visits' },
    { icon: Clock, title: 'Flexible hours', description: 'Work when you want, set your own availability' },
    { icon: Shield, title: 'Verified profile', description: 'Build trust with a verified professional badge' },
    { icon: Globe, title: 'Nationwide access', description: 'Reach patients across India' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Doctor Registration</h1>
        </div>
      </div>

      <div className="flex-1 px-5 py-8">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <img src={logoImage} alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Join as a Verified Doctor</h1>
          <p className="text-muted-foreground">Complete verification to start consulting patients</p>
        </div>

        {/* Benefits */}
        <div className="space-y-4 mb-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="bg-success/10 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-medium text-foreground">Secure & Compliant</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your data is encrypted and handled as per Telemedicine Practice Guidelines 2020
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4">
        <Button variant="accent" size="xl" className="w-full" onClick={onStart}>
          Start Registration
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          Takes approximately 10 minutes to complete
        </p>
      </div>
    </div>
  );
}
