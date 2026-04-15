import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, User, Sparkles, Shield } from 'lucide-react';
import logoImage from '@/assets/logo.png';

interface DoctorApprovalSuccessScreenProps {
  doctorName: string;
  onGoToDashboard: () => void;
  onCompleteProfile: () => void;
}

export function DoctorApprovalSuccessScreen({ doctorName, onGoToDashboard, onCompleteProfile }: DoctorApprovalSuccessScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Success Animation */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full bg-success/20 flex items-center justify-center animate-scale-in">
            <CheckCircle className="w-16 h-16 text-success" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-accent animate-pulse" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground text-center mb-2">
          Welcome, Dr. {doctorName}!
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Your profile is now verified
        </p>

        {/* Verified Badge */}
        <div className="bg-success/10 border border-success/30 rounded-full px-6 py-3 flex items-center gap-2 mb-8">
          <Shield className="w-5 h-5 text-success" />
          <span className="font-medium text-success">Verified Medical Professional</span>
        </div>

        {/* What's Next */}
        <div className="w-full max-w-sm space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground text-center">What's next?</h2>
          
          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Complete your profile</p>
                <p className="text-xs text-muted-foreground">Add bio, photos & more</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Set your availability</p>
                <p className="text-xs text-muted-foreground">Choose when you can consult</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Start consulting</p>
                <p className="text-xs text-muted-foreground">Help patients across India</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4 space-y-3">
        <Button 
          variant="accent" 
          size="xl" 
          className="w-full" 
          onClick={onGoToDashboard}
        >
          Go to Doctor Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full" 
          onClick={onCompleteProfile}
        >
          <User className="w-4 h-4 mr-2" />
          Complete Profile
        </Button>
      </div>
    </div>
  );
}
