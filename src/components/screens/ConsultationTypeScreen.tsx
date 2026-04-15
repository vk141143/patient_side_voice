import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Home } from 'lucide-react';
import { ConsultationType } from '@/types/app';
import { useState } from 'react';

interface ConsultationTypeScreenProps {
  onSelect: (type: ConsultationType) => void;
  onBack: () => void;
}

export function ConsultationTypeScreen({ onSelect, onBack }: ConsultationTypeScreenProps) {
  const [selected, setSelected] = useState<ConsultationType | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Book a Doctor</h1>
        <p className="text-muted-foreground mt-1">Choose how you'd like to consult</p>
      </div>

      {/* Options */}
      <div className="flex-1 px-5 space-y-4">
        {/* Hospital Visit Card */}
        <button
          onClick={() => setSelected('hospital')}
          className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${
            selected === 'hospital'
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              selected === 'hospital' ? 'bg-primary' : 'bg-secondary'
            }`}>
              <Building2 className={`w-7 h-7 ${selected === 'hospital' ? 'text-primary-foreground' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Visit Hospital</h3>
              <p className="text-muted-foreground mt-1">
                Book an appointment at a nearby hospital or clinic
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-secondary rounded-full text-xs text-muted-foreground">OPD Booking</span>
                <span className="px-2 py-1 bg-secondary rounded-full text-xs text-muted-foreground">In-person</span>
              </div>
            </div>
          </div>
        </button>

        {/* Home Visit Card */}
        <button
          onClick={() => {}}
          disabled
          className="w-full p-6 rounded-2xl border-2 text-left border-border bg-card opacity-60 cursor-not-allowed relative"
        >
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-orange-400/20 border border-orange-400/40 rounded-full">
            <span className="text-[10px] font-semibold text-orange-500">Coming Soon</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-secondary">
              <Home className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Home Visit</h3>
              <p className="text-muted-foreground mt-1">
                Request a doctor to visit your home
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-secondary rounded-full text-xs text-muted-foreground">Doctor at Home</span>
                <span className="px-2 py-1 bg-secondary rounded-full text-xs text-muted-foreground">Comfortable home visit</span>
              </div>
            </div>
          </div>
        </button>

        {/* Info Card */}
        <div className="bg-accent/10 rounded-2xl p-4 mt-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Home visits are ideal for elderly patients or when hospital travel is difficult.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        <Button
          variant="default"
          size="xl"
          className="w-full"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
