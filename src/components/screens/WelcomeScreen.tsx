import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';
import logo from '@/assets/logo.png';

interface WelcomeScreenProps {
  onContinue: () => void;
  onGoogleContinue?: () => void;
}

export function WelcomeScreen({ onContinue, onGoogleContinue }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
        {/* Logo Animation */}
        <div className="relative mb-8 animate-float">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
          <img 
            src={logo} 
            alt="MediCare" 
            className="relative w-24 h-24 object-contain"
          />
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Medi<span className="text-primary">Care</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg text-muted-foreground text-center max-w-xs leading-relaxed">
          Talk to a verified doctor in under{' '}
          <span className="text-primary font-semibold">60 seconds</span>
        </p>

        {/* Trust Indicators */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <span className="trust-badge">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified Doctors
          </span>
          <span className="trust-badge">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            100% Private
          </span>
          <span className="trust-badge">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            24/7 Available
          </span>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 pb-8 pt-4">
        <Button 
          variant="hero" 
          size="xl" 
          className="w-full"
          onClick={onContinue}
        >
          <Smartphone className="w-5 h-5" />
          Continue with Phone
        </Button>

        <p className="text-xs text-muted-foreground text-center pt-4">
          By continuing, you agree to our{' '}
          <span className="text-primary">Terms of Service</span> and{' '}
          <span className="text-primary">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
