import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, ChevronDown, AlertCircle, Camera, Paperclip, X, FileText, Loader2, Zap, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type ConsultMode = 'instant' | 'available';

interface SymptomsScreenProps {
  onSubmit: (symptoms: string[], description?: string, reportUrl?: string, mode?: ConsultMode) => void;
  onBack: () => void;
}

const specialties = [
  'General Physician','Gynecologist','Dermatologist','Pediatrician','Orthopedic',
  'ENT Specialist','Cardiologist','Neurologist','Psychiatrist','Ophthalmologist',
  'Urologist','Gastroenterologist','Endocrinologist','Pulmonologist','Oncologist',
  'Dentist','Physiotherapist',
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
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<ConsultMode>('instant');
  const [instantPrice, setInstantPrice] = useState(99);
  const [availablePrice, setAvailablePrice] = useState(299);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch prices + realtime subscription for instant admin updates
  useEffect(() => {
    const loadPrices = async () => {
      const { data } = await supabase.from('admin_pricing').select('key, value')
        .in('key', ['instant_chat_price', 'available_chat_price']);
      data?.forEach(row => {
        if (row.key === 'instant_chat_price') setInstantPrice(Number(row.value) || 99);
        if (row.key === 'available_chat_price') setAvailablePrice(Number(row.value) || 299);
      });
    };
    loadPrices();

    // Realtime: fires whenever admin saves a price
    const channel = supabase.channel('pricing_symptoms')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'admin_pricing' },
        (payload) => {
          const row = payload.new as any;
          if (row.key === 'instant_chat_price') setInstantPrice(Number(row.value) || 99);
          if (row.key === 'available_chat_price') setAvailablePrice(Number(row.value) || 299);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = specialties.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be less than 10MB'); return; }
    setUploading(true);
    const path = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data: up } = await supabase.storage.from('consultation-reports').upload(path, file, { upsert: true });
    if (up) {
      const { data: urlData } = supabase.storage.from('consultation-reports').getPublicUrl(up.path);
      setUploadedFile({ name: file.name, url: urlData.publicUrl, type: file.type });
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">What's bothering you?</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">

        {/* Specialty */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Doctor Specialty <span className="text-destructive">*</span>
          </label>
          <button type="button" onClick={() => setDropdownOpen(o => !o)}
            className="w-full h-14 px-4 flex items-center gap-3 rounded-xl border border-border bg-card text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className={`flex-1 text-base truncate ${specialty ? 'text-foreground' : 'text-muted-foreground'}`}>
              {specialty || 'Search or select specialty (e.g., General Phys...)'}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-border">
                <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full px-3 py-2 text-sm bg-background rounded-lg border border-border focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filtered.length > 0 ? filtered.map(s => (
                  <button key={s} type="button" onClick={() => { setSpecialty(s); setSearch(''); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-primary/5 transition-colors ${specialty === s ? 'text-primary font-medium bg-primary/5' : 'text-foreground'}`}>
                    {s}
                  </button>
                )) : <p className="px-4 py-3 text-sm text-muted-foreground">No results found</p>}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Describe your problem in detail</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="E.g., I've been having a fever since yesterday evening, around 101°F. Also feeling weak and have body aches..."
            className="w-full h-32 px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" />
          <p className="text-xs text-primary mt-1">This helps doctors understand your condition better</p>
        </div>

        {/* Add more details */}
        <button onClick={() => setShowAdvanced(o => !o)} className="text-primary text-sm font-medium">
          {showAdvanced ? '− Hide' : '+'} Add more details (optional)
        </button>

        {showAdvanced && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">How long have you had this?</label>
              <div className="flex flex-wrap gap-2">
                {durations.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${duration === d ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground hover:border-primary/50'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">How severe is it?</label>
              <div className="flex gap-2">
                {severities.map(s => (
                  <button key={s} onClick={() => setSeverity(s)}
                    className={`flex-1 py-2 rounded-full text-sm font-medium border transition-all ${severity === s ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground hover:border-primary/50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Attach image or report (optional)</label>
              {uploadedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/5">
                  {uploadedFile.type.startsWith('image/') ? (
                    <img src={uploadedFile.url} className="w-12 h-12 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">Uploaded ✓</p>
                  </div>
                  <button onClick={() => setUploadedFile(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => photoRef.current?.click()} disabled={uploading}
                    className="flex-1 h-14 rounded-xl border-2 border-dashed border-border bg-card flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    <span className="text-sm font-medium">{uploading ? 'Uploading...' : 'Take photo'}</span>
                  </button>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex-1 h-14 rounded-xl border-2 border-dashed border-border bg-card flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                    <Paperclip className="w-5 h-5" />
                    <span className="text-sm font-medium">Upload file</span>
                  </button>
                </div>
              )}
              <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
              <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>
        )}

        {/* ── Consultation Mode Selector ── */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">How do you want to consult?</label>
          <div className="space-y-3">

            {/* Option 1: Instant */}
            <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${mode === 'instant' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`}>
              <input type="radio" name="consultMode" value="instant" checked={mode === 'instant'} onChange={() => setMode('instant')} className="mt-1 accent-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">Talk instantly with a doctor</span>
                  <span className="ml-auto text-sm font-bold text-primary">₹{instantPrice}</span>
                </div>
                <p className="text-xs text-muted-foreground">Get matched with the first available doctor. Chat for 5 minutes.</p>
              </div>
            </label>

            {/* Option 2: Available Doctors */}
            <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${mode === 'available' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'}`}>
              <input type="radio" name="consultMode" value="available" checked={mode === 'available'} onChange={() => setMode('available')} className="mt-1 accent-primary" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-foreground">Talk with available doctors</span>
                  <span className="ml-auto text-sm font-bold text-primary">Starts ₹{availablePrice}</span>
                </div>
                <p className="text-xs text-muted-foreground">Browse online doctors, choose by specialty. Chat 10 min · Video 10 min.</p>
              </div>
            </label>

          </div>
        </div>

        {/* AI Consent */}
        <div className="bg-muted rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-border accent-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-foreground leading-relaxed">I agree to AI-assisted symptom analysis. AI does not replace doctors.</p>
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
      <div className="px-5 pb-8 pt-4 bg-background border-t border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Consultation fee</span>
          <span className="text-lg font-bold text-primary">
            {mode === 'instant' ? `₹${instantPrice}` : `Starts ₹${availablePrice}`}
          </span>
        </div>
        <Button variant="hero" size="xl" className="w-full"
          onClick={() => { if (specialty && agreed) onSubmit([specialty], description, uploadedFile?.url, mode); }}
          disabled={!specialty || !agreed}>
          Find a Doctor
        </Button>
      </div>
    </div>
  );
}
