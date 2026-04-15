import { Button } from '@/components/ui/button';
import { ArrowLeft, Stethoscope, Baby, Heart, Sparkles, Bone, Ear, MoreHorizontal } from 'lucide-react';
import { Specialty } from '@/types/app';
import { useState } from 'react';

interface SelectSpecialtyScreenProps {
  onSelect: (specialty: Specialty) => void;
  onBack: () => void;
}

const specialties = [
  { id: 'general-physician' as Specialty, name: 'General Physician', icon: Stethoscope, description: 'Fever, cold, general health' },
  { id: 'pediatrician' as Specialty, name: 'Pediatrician', icon: Baby, description: 'Child health specialist' },
  { id: 'gynecologist' as Specialty, name: 'Gynecologist', icon: Heart, description: "Women's health" },
  { id: 'dermatologist' as Specialty, name: 'Dermatologist', icon: Sparkles, description: 'Skin, hair, nails' },
  { id: 'orthopedic' as Specialty, name: 'Orthopedic', icon: Bone, description: 'Bones, joints, muscles' },
  { id: 'ent' as Specialty, name: 'ENT Specialist', icon: Ear, description: 'Ear, nose, throat' },
  // { id: 'other' as Specialty, name: 'Other', icon: MoreHorizontal, description: 'Other specialists' },
];

export function SelectSpecialtyScreen({ onSelect, onBack }: SelectSpecialtyScreenProps) {
  const [selected, setSelected] = useState<Specialty | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Select Specialty</h1>
        <p className="text-muted-foreground mt-1">What type of doctor do you need?</p>
      </div>

      {/* Specialties Grid */}
      <div className="flex-1 px-5 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {specialties.map((specialty) => {
            const Icon = specialty.icon;
            const isSelected = selected === specialty.id;
            
            return (
              <button
                key={specialty.id}
                onClick={() => setSelected(specialty.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  isSelected ? 'bg-primary' : 'bg-secondary'
                }`}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`} />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{specialty.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{specialty.description}</p>
              </button>
            );
          })}
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
          Next
        </Button>
      </div>
    </div>
  );
}
