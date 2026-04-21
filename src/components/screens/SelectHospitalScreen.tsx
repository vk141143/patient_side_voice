import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Search, MapPin, Clock, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface OpdDoctor {
  id: string;
  firebase_uid: string;
  full_name: string;
  specialization: string;
  experience_years: number;
  city: string;
  hospital_name: string;
  clinic_address: string;
  opd_start: string;
  opd_end: string;
  consult_duration: number;
  rating?: number;
  gender?: string;
}

interface SelectHospitalScreenProps {
  onSelect: (doctor: OpdDoctor) => void;
  onBack: () => void;
  walletBalance: number;
  onRecharge: (amount: number) => void;
}

export function SelectHospitalScreen({ onSelect, onBack }: SelectHospitalScreenProps) {
  const [doctors, setDoctors] = useState<OpdDoctor[]>([]);
  const [filtered, setFiltered] = useState<OpdDoctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OpdDoctor | null>(null);

  useEffect(() => {
    supabase
      .from('doctors')
      .select('id, firebase_uid, full_name, specialization, experience_years, city, hospital_name, clinic_address, opd_start, opd_end, consult_duration, gender')
      .eq('status', 'approved')
      .eq('service_opd', true)
      .order('full_name')
      .then(({ data, error }) => {
        if (error) console.error('OPD doctors fetch error:', error);
        setDoctors((data as OpdDoctor[]) ?? []);
        setFiltered((data as OpdDoctor[]) ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      doctors.filter(d =>
        !q ||
        d.full_name?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.city?.toLowerCase().includes(q) ||
        d.hospital_name?.toLowerCase().includes(q)
      )
    );
  }, [search, doctors]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="px-5 pt-12 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Book OPD Visit</h1>
        <p className="text-muted-foreground mt-1">Choose a doctor for hospital visit</p>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 h-12 px-4 rounded-xl border border-border bg-card focus-within:border-primary transition-colors">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search doctor, specialty or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto space-y-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No OPD doctors available</p>
            <p className="text-sm mt-1">Check back later</p>
          </div>
        ) : filtered.map(doc => {
          const isSelected = selected?.id === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => setSelected(doc)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">{doc.full_name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">Dr. {doc.full_name}</p>
                      <p className="text-sm text-primary">{doc.specialization}</p>
                    </div>
                    {doc.experience_years && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{doc.experience_years} yrs exp</span>
                    )}
                  </div>
                  {doc.hospital_name && (
                    <div className="flex items-center gap-1 mt-1.5 text-muted-foreground text-xs">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{doc.hospital_name}{doc.city ? `, ${doc.city}` : ''}</span>
                    </div>
                  )}
                  {(doc.opd_start && doc.opd_end) && (
                    <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>OPD: {doc.opd_start} – {doc.opd_end}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 pb-8">
        <Button variant="default" size="xl" className="w-full" disabled={!selected} onClick={() => selected && onSelect(selected)}>
          Continue
        </Button>
      </div>
    </div>
  );
}
