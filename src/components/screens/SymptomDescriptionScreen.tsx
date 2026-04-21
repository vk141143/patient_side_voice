import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, FileText, X, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { Specialty } from '@/types/app';
import { supabase } from '@/lib/supabase';

interface SymptomDescriptionScreenProps {
  specialty: Specialty;
  onSubmit: (data: { description: string; symptoms: string[]; hasReport: boolean; reportUrl?: string }) => void;
  onBack: () => void;
}

const symptomsBySpecialty: Record<Specialty, string[]> = {
  'general-physician': ['Fever', 'Cold / Cough', 'Headache', 'Body pain', 'Weakness', 'Vomiting', 'Diarrhea', 'Loss of appetite', 'Others'],
  'pediatrician':      ['Child fever', 'Cough', 'Ear pain', 'Rash', 'Vomiting', 'Diarrhea', 'Poor feeding', 'Crying excessively', 'Others'],
  'gynecologist':      ['Irregular periods', 'Pelvic pain', 'Vaginal discharge', 'Pregnancy concern', 'Hormonal issues', 'Breast pain', 'Menstrual cramps', 'Others'],
  'dermatologist':     ['Acne', 'Rash / Redness', 'Itching', 'Hair fall', 'Nail problem', 'Dry skin', 'Pigmentation', 'Wound / Scar', 'Others'],
  'orthopedic':        ['Joint pain', 'Back pain', 'Knee pain', 'Fracture', 'Muscle spasm', 'Swelling', 'Sports injury', 'Neck pain', 'Others'],
  'ent':               ['Ear pain', 'Hearing loss', 'Sore throat', 'Nasal congestion', 'Sinusitis', 'Tonsil pain', 'Voice change', 'Nose bleed', 'Others'],
  'other':             ['Fever', 'Pain', 'Weakness', 'Swelling', 'Rash', 'Breathing issue', 'Others'],
};

export function SymptomDescriptionScreen({ specialty, onSubmit, onBack }: SymptomDescriptionScreenProps) {
  const [description, setDescription] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string; file: File } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const quickSymptoms = symptomsBySpecialty[specialty] ?? symptomsBySpecialty['general-physician'];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { alert('File must be less than 5MB'); return; }
      setUploadedFile({ name: file.name, type: file.type, file });
    }
    setShowUploadMenu(false);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    setUploading(true);
    let reportUrl: string | undefined;
    if (uploadedFile?.file) {
      const path = `${Date.now()}_${uploadedFile.name.replace(/\s+/g, '_')}`;
      const { data: up } = await supabase.storage
        .from('patient-reports')
        .upload(path, uploadedFile.file, { upsert: true });
      if (up) {
        const { data: urlData } = supabase.storage.from('patient-reports').getPublicUrl(up.path);
        reportUrl = urlData.publicUrl;
      }
    }
    setUploading(false);
    onSubmit({ description, symptoms: selectedSymptoms, hasReport: !!uploadedFile, reportUrl });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Describe Your Problem</h1>
        <p className="text-muted-foreground mt-1">Help us understand your symptoms better</p>
      </div>

      <div className="flex-1 px-5 space-y-6 overflow-y-auto">
        {/* Description Text Area */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Tell us what's bothering you
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your symptoms in detail... (e.g., I've been having a headache since yesterday with mild fever)"
            className="w-full h-32 p-4 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Quick Symptoms */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Quick select symptoms
          </label>
          <div className="flex flex-wrap gap-2">
            {quickSymptoms.map((symptom) => (
              <button
                key={symptom}
                onClick={() => toggleSymptom(symptom)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedSymptoms.includes(symptom)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {symptom}
                {selectedSymptoms.includes(symptom) && (
                  <X className="w-3 h-3 ml-1 inline" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Report */}
        <div className="relative">
          <label className="text-sm font-medium text-foreground mb-3 block">
            Upload report or photo (optional)
          </label>

          {uploadedFile ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-primary bg-primary/5">
              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm text-primary font-medium flex-1 truncate">{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowUploadMenu(o => !o)}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-all flex items-center justify-center gap-3"
            >
              <Camera className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Tap to upload photo or document</span>
            </button>
          )}

          {showUploadMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUploadMenu(false)} />
              <div className="absolute bottom-full left-0 mb-2 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden w-52">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors border-b border-border"
                  onClick={() => { setShowUploadMenu(false); photoRef.current?.click(); }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Camera / Photo</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                  onClick={() => { setShowUploadMenu(false); fileRef.current?.click(); }}
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Upload Document</span>
                </button>
              </div>
            </>
          )}

          <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={handleFile} />
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        <Button
          variant="default"
          size="xl"
          className="w-full"
          disabled={(!description && selectedSymptoms.length === 0) || uploading}
          onClick={handleSubmit}
        >
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
