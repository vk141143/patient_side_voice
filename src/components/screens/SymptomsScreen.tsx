import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, ChevronDown, AlertCircle, Camera, Paperclip } from 'lucide-react';

interface SymptomsScreenProps {
  onSubmit: (symptoms: string[], description: string) => void;
  onBack: () => void;
}

const specialties = [
  'General Physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatrician',
  'Orthopedic',
  'ENT Specialist',
  'Cardiologist',
  'Neurologist',
  'Psychiatrist',
  'Ophthalmologist',
  'Urologist',
  'Gastroenterologist',
  'Endocrinologist',
  'Pulmonologist',
  'Oncologist',
  'Dentist',
  'Physiotherapist',
];

const durations = ['Today', '2-3 days', '1 week', '1+ week'];
const severities = ['Mild', 'Moderate', 'Severe'];

export function SymptomsScreen({ onSubmit, onBack }: SymptomsScreenProps) {
  const [specialty, setSpecialty] = useState('');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('');
  const [agreed, setAgreed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = specialties.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (s: string) => {
    setSpecialty(s);
    setSearch('');
    setDropdownOpen(false);
  };

  const handleSubmit = () => {
    if (specialty && agreed) {
      onSubmit([specialty], description);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">What's bothering you?</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">

        {/* Specialty Dropdown */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Doctor Specialty <span className="text-destructive">*</span>
          </label>
          <button
            type="button"
            onClick={() => setDropdownOpen(o => !o)}
            className="w-full h-14 px-4 flex items-center gap-3 rounded-xl border border-border bg-card text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className={`flex-1 text-base truncate ${specialty ? 'text-foreground' : 'text-muted-foreground'}`}>
              {specialty || 'Search or select specialty (e.g., General Phys...)'}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-border">
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full px-3 py-2 text-sm bg-background rounded-lg border border-border focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filtered.length > 0 ? filtered.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelect(s)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-primary/5 transition-colors ${specialty === s ? 'text-primary font-medium bg-primary/5' : 'text-foreground'}`}
                  >
                    {s}
                  </button>
                )) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No results found</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Describe your problem in detail
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="E.g., I've been having a fever since yesterday evening, around 101°F. Also feeling weak and have body aches..."
            className="w-full h-32 px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
          <p className="text-xs text-primary mt-1">This helps doctors understand your condition better</p>
        </div>

        {/* Add more details */}
        <button
          onClick={() => setShowAdvanced(o => !o)}
          className="text-primary text-sm font-medium"
        >
          {showAdvanced ? '− Hide' : '+'} Add more details (optional)
        </button>

        {showAdvanced && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                How long have you had this?
              </label>
              <div className="flex flex-wrap gap-2">
                {durations.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      duration === d
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                How severe is it?
              </label>
              <div className="flex gap-2">
                {severities.map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`flex-1 py-2 rounded-full text-sm font-medium border transition-all ${
                      severity === s
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Attach image or report (optional)
              </label>
              <div className="flex gap-3">
                <button className="flex-1 h-14 rounded-xl border-2 border-dashed border-border bg-card flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Camera className="w-5 h-5" />
                  <span className="text-sm font-medium">Take photo</span>
                </button>
                <button className="flex-1 h-14 rounded-xl border-2 border-dashed border-border bg-card flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Paperclip className="w-5 h-5" />
                  <span className="text-sm font-medium">Upload file</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Consent */}
        <div className="bg-muted rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-border accent-primary flex-shrink-0"
            />
            <div>
              <p className="text-sm text-foreground leading-relaxed">
                I agree to AI-assisted symptom analysis. AI does not replace doctors.
              </p>
              <button className="text-sm text-primary font-semibold mt-1">Learn more</button>
            </div>
          </label>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground pb-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>For emergencies, please call 112 or visit the nearest hospital.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-4 bg-background border-t border-border">
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={handleSubmit}
          disabled={!specialty || !agreed}
        >
          Find a Doctor
        </Button>
      </div>
    </div>
  );
}
