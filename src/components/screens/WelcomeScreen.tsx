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
      <div className="px-6 pb-8 pt-4 space-y-4">
        <Button 
          variant="hero" 
          size="xl" 
          className="w-full"
          onClick={onContinue}
        >
          <Smartphone className="w-5 h-5" />
          Continue with Phone
        </Button>

        <Button 
          variant="heroSecondary" 
          size="xl" 
          className="w-full"
          onClick={onGoogleContinue || onContinue}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        <p className="text-xs text-muted-foreground text-center pt-2">
          By continuing, you agree to our{' '}
          <span className="text-primary">Terms of Service</span> and{' '}
          <span className="text-primary">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
