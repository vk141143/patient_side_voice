import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Briefcase, Clock, MessageSquare, Building, Home, Stethoscope } from 'lucide-react';

interface DoctorProfessionalProfileScreenProps {
  onSubmit: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const specializations = [
  'General Physician',
  'Pediatrician',
  'Gynecologist',
  'Dermatologist',
  'Orthopedic',
  'ENT Specialist',
  'Cardiologist',
  'Neurologist',
  'Psychiatrist',
  'Dentist',
  'Other',
];

const languages = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati', 'Punjabi'];

export function DoctorProfessionalProfileScreen({ onSubmit, onBack, currentStep, totalSteps }: DoctorProfessionalProfileScreenProps) {
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English', 'Hindi']);
  const [servicePreferences, setServicePreferences] = useState({
    online: true,
    hospital: true,
    homeVisit: false,
  });
  const [consultationDuration, setConsultationDuration] = useState('10');

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const isValid = specialization && experience && hospitalName && selectedLanguages.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Professional Information</h1>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-secondary'}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Step {currentStep} of {totalSteps}</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6 pb-24">
        {/* Specialization */}
        <div className="space-y-3">
          <Label>Specialization</Label>
          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSpecialization(spec)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  specialization === spec
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-primary/10'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="space-y-2">
          <Label htmlFor="experience">Years of Experience</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="experience"
              placeholder="e.g., 5"
              type="number"
              className="pl-10"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </div>
        </div>

        {/* Hospital Name */}
        <div className="space-y-2">
          <Label htmlFor="hospital">Current Hospital/Clinic Name</Label>
          <Input
            id="hospital"
            placeholder="e.g., Apollo Hospital"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
          />
        </div>

        {/* Languages */}
        <div className="space-y-3">
          <Label>Languages Spoken</Label>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedLanguages.includes(lang)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-primary/10'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Service Preferences */}
        <div className="space-y-3">
          <Label>Service Preferences</Label>
          <div className="space-y-2">
            {[
              { key: 'online', icon: MessageSquare, label: 'Online Chat Consultation', color: 'text-primary' },
              { key: 'hospital', icon: Building, label: 'Hospital OPD Consultation', color: 'text-accent' },
              { key: 'homeVisit', icon: Home, label: 'Home Visit Consultation', color: 'text-success' },
            ].map(({ key, icon: Icon, label, color }) => (
              <button
                key={key}
                onClick={() => setServicePreferences(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-all ${
                  servicePreferences[key as keyof typeof servicePreferences]
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-sm font-medium text-foreground flex-1 text-left">{label}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  servicePreferences[key as keyof typeof servicePreferences]
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}>
                  {servicePreferences[key as keyof typeof servicePreferences] && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Consultation Duration */}
        <div className="space-y-3">
          <Label>Preferred Consultation Duration</Label>
          <div className="flex gap-2">
            {['5', '10', '15'].map((duration) => (
              <button
                key={duration}
                onClick={() => setConsultationDuration(duration)}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  consultationDuration === duration
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground hover:border-primary/50'
                }`}
              >
                <Clock className="w-4 h-4" />
                {duration} min
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4">
        <Button 
          variant="accent" 
          size="xl" 
          className="w-full" 
          onClick={onSubmit}
          disabled={!isValid}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
