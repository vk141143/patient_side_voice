import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface MatchingScreenProps {
  symptoms: string[];
  onMatched: () => void;
  onCancel: () => void;
}

export function MatchingScreen({ symptoms, onMatched, onCancel }: MatchingScreenProps) {
  const [countdown, setCountdown] = useState(45);
  const [status, setStatus] = useState<'searching' | 'found'>('searching');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('found');
          setTimeout(onMatched, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 80); // Faster for demo

    return () => clearInterval(timer);
  }, [onMatched]);

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6">
      {/* Cancel Button */}
      <button 
        onClick={onCancel}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Heartbeat Animation */}
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150 animate-pulse-slow" />
        <div className={`relative w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center ${status === 'searching' ? 'animate-heartbeat' : ''}`}>
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              {status === 'searching' ? (
                <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Text */}
      <h2 className="text-2xl font-bold text-foreground text-center mb-2">
        {status === 'searching' 
          ? 'Finding the best doctor for you...' 
          : 'Doctor found!'}
      </h2>
      <p className="text-muted-foreground text-center mb-6">
        {status === 'searching' 
          ? 'Matching with ' + (symptoms[0] || 'a General Physician') 
          : 'Connecting you now...'}
      </p>

      {/* Countdown */}
      {status === 'searching' && (
        <div className="bg-card rounded-2xl px-6 py-4 shadow-sm border border-border/50 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated wait</p>
              <p className="text-xl font-bold text-foreground">{countdown} seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Symptoms */}
      <div className="flex flex-wrap gap-2 justify-center">
        {symptoms.map(s => (
          <span key={s} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full">
            {s}
          </span>
        ))}
      </div>

      {/* Cancel Option */}
      {status === 'searching' && (
        <Button 
          variant="ghost" 
          className="mt-8 text-muted-foreground"
          onClick={onCancel}
        >
          Cancel search
        </Button>
      )}
    </div>
  );
}
