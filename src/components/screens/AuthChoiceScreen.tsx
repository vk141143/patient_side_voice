import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import logo from '@/assets/logo.png';

interface AuthChoiceScreenProps {
  onRegister: () => void;
  onLogin: () => void;
  onBack: () => void;
}

export function AuthChoiceScreen({ onRegister, onLogin, onBack }: AuthChoiceScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
          <img src={logo} alt="MediCare" className="relative w-16 h-16 object-contain" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-1">
          Medi<span className="text-primary">Care</span>
        </h1>
        <p className="text-muted-foreground text-center mb-10">Choose how you want to continue</p>

        <div className="w-full space-y-4">
          <Button variant="hero" size="xl" className="w-full" onClick={onRegister}>
            <UserPlus className="w-5 h-5" />
            Register New Account
          </Button>

          <Button variant="heroSecondary" size="xl" className="w-full" onClick={onLogin}>
            <LogIn className="w-5 h-5" />
            Already Have Account? Login
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center px-6 pb-8">
        By continuing, you agree to our{' '}
        <span className="text-primary">Terms of Service</span> and{' '}
        <span className="text-primary">Privacy Policy</span>
      </p>
    </div>
  );
}
