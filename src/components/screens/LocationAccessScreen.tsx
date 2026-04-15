import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface LocationAccessScreenProps {
  onGranted: (location: { lat: number; lng: number; city?: string }) => void;
  onSkip: () => void;
}

export function LocationAccessScreen({ onGranted, onSkip }: LocationAccessScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAllow = () => {
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let city: string | undefined;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          city = data.address?.city || data.address?.town || data.address?.village;
        } catch {
          // city remains undefined — coords still captured
        }
        setLoading(false);
        onGranted({ lat, lng, city });
      },
      () => {
        setLoading(false);
        setError('Location access denied. You can skip for now.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex justify-end px-4 py-4">
        <button
          onClick={onSkip}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
          <MapPin className="w-12 h-12 text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-foreground text-center mb-3">
          Allow Location Access
        </h2>
        <p className="text-muted-foreground text-center mb-4 leading-relaxed">
          MediCare uses your location to connect you with nearby doctors and provide better healthcare services in your area.
        </p>

        <div className="w-full bg-primary/5 rounded-xl p-4 mb-8 space-y-2">
          {[
            'Find doctors near you',
            'Faster home visit matching',
            'Region-specific health insights',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              {item}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-destructive text-sm text-center mb-4">{error}</p>
        )}
      </div>

      <div className="px-6 pb-8 space-y-3">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={handleAllow}
          disabled={loading}
        >
          <MapPin className="w-5 h-5" />
          {loading ? 'Getting location...' : 'Allow Location Access'}
        </Button>
        <Button
          variant="ghost"
          size="xl"
          className="w-full text-muted-foreground"
          onClick={onSkip}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
