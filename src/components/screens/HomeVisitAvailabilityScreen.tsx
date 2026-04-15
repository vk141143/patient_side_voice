import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, IndianRupee, AlertCircle, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HomeVisitAvailabilityScreenProps {
  specialty: string;
  onAvailable: () => void;
  onNotAvailable: () => void;
  onBack: () => void;
}

export function HomeVisitAvailabilityScreen({ 
  specialty, 
  onAvailable, 
  onNotAvailable, 
  onBack 
}: HomeVisitAvailabilityScreenProps) {
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setChecking(false);
      // Simulate 80% availability
      setAvailable(Math.random() > 0.2);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="px-5 pt-12 pb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground text-center mb-2">
            Checking Availability
          </h2>
          <p className="text-muted-foreground text-center">
            Finding doctors available for home visits...
          </p>
          
          <div className="w-full max-w-xs mt-8">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (available) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="px-5 pt-12 pb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 px-5">
          {/* Success State */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Doctors Available!</h2>
            <p className="text-muted-foreground mt-1">Home visit doctors are available in your area</p>
          </div>

          {/* Details Card */}
          <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                <p className="font-semibold text-foreground">Within 2-4 hours</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Visit Fee</p>
                <p className="font-semibold text-foreground">₹800 - ₹1,200</p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-accent/10 rounded-2xl p-4 mt-4">
            <p className="text-sm text-muted-foreground">
              💡 The exact fee depends on doctor experience and distance. You'll see the final price before confirming.
            </p>
          </div>
        </div>

        <div className="p-5 pb-8">
          <Button
            variant="default"
            size="xl"
            className="w-full"
            onClick={onAvailable}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Not Available State
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="flex-1 px-5">
        {/* Not Available State */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">No Doctors Available</h2>
          <p className="text-muted-foreground mt-1">Home visit doctors are not available in your area right now</p>
        </div>

        {/* Alternative Option */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-3">Alternative Options</h3>
          
          <button
            onClick={onNotAvailable}
            className="w-full p-4 rounded-xl border-2 border-primary bg-primary/5 flex items-center gap-3"
          >
            <Building2 className="w-6 h-6 text-primary" />
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Visit Hospital Instead</p>
              <p className="text-sm text-muted-foreground">Book an OPD appointment</p>
            </div>
          </button>
        </div>
      </div>

      <div className="p-5 pb-8">
        <Button
          variant="outline"
          size="xl"
          className="w-full"
          onClick={onBack}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
