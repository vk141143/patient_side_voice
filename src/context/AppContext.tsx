import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppScreen, UserProfile, Doctor, Message, Consultation, Prescription, Appointment } from '@/types/app';
import { supabase } from '@/lib/supabase';
import { onAuthChange } from '@/services/auth';
import { getCurrentUser } from '@/services/auth';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppContextType {
  currentScreen: AppScreen;
  setCurrentScreen: (screen: AppScreen) => void;
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  userLocation: { lat: number; lng: number; city?: string } | null;
  setUserLocation: (loc: { lat: number; lng: number; city?: string } | null) => void;
  selectedSymptoms: string[];
  setSelectedSymptoms: (symptoms: string[]) => void;
  currentDoctor: Doctor | null;
  setCurrentDoctor: (doctor: Doctor | null) => void;
  messages: Message[];
  addMessage: (message: Message) => void;
  consultations: Consultation[];
  currentPrescription: Prescription | null;
  setCurrentPrescription: (prescription: Prescription | null) => void;
  walletBalance: number;
  setWalletBalance: (balance: number) => void;
  deductWallet: (amount: number) => Promise<boolean>;
  addToWallet: (amount: number) => Promise<void>;
  appointments: Appointment[];
  addAppointment: (apt: Appointment) => void;
  cancelAppointment: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sampleDoctor: Doctor = {
  id: '1',
  name: 'Dr. Priya Sharma',
  specialization: 'General Physician',
  rating: 4.9,
  experience: '12 years',
  avatar: '',
  verified: true,
};

const sampleConsultations: Consultation[] = [
  {
    id: '1',
    doctor: sampleDoctor,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    issue: 'Fever & Cold',
    status: 'completed',
  },
  {
    id: '2',
    doctor: { ...sampleDoctor, id: '2', name: 'Dr. Amit Patel', specialization: 'Dermatologist' },
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    issue: 'Skin Rash',
    status: 'completed',
  },
];

// ── Global OPD Rating Popup ────────────────────────────────────────────────────
function GlobalRatingPopup({ apt, onClose }: { apt: any; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const doctorName = apt.doctor?.full_name ?? 'Doctor';

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    const user = getCurrentUser();
    await supabase.from('doctor_ratings').insert({
      appointment_id: apt.id,
      doctor_id: apt.doctor_id,
      patient_name: apt.patient_name,
      patient_user_id: user?.uid ?? null,
      rating,
      review: review.trim() || null,
    });
    await supabase.from('opd_appointments').update({ rating_submitted: true }).eq('id', apt.id);
    setSubmitting(false);
    setDone(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-t-3xl p-6 space-y-5">
        <div className="w-10 h-1 rounded-full bg-border mx-auto" />
        {done ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <Star className="w-8 h-8 text-green-500 fill-green-500" />
            </div>
            <p className="text-lg font-bold text-foreground">Thank you!</p>
            <p className="text-sm text-muted-foreground mt-1">Your feedback has been submitted.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Rate Your Hospital Visit</h3>
                <p className="text-sm text-muted-foreground">How was your experience with Dr. {doctorName}?</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              {apt.doctor?.selfie_url ? (
                <img src={apt.doctor.selfie_url} className="w-12 h-12 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{doctorName.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">Dr. {doctorName}</p>
                <p className="text-xs text-muted-foreground">{apt.doctor?.specialization}</p>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}>
                  <Star className={`w-10 h-10 transition-all ${s <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <textarea value={review} onChange={e => setReview(e.target.value)}
              placeholder="Share your experience (optional)..."
              className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm outline-none focus:border-primary resize-none" />
            <Button variant="hero" size="lg" className="w-full" disabled={rating === 0 || submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreenState] = useState<AppScreen>(() => {
    const saved = localStorage.getItem('mc_screen');
    return (saved as AppScreen) || 'welcome';
  });
  const [user, setUserState] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('mc_user');
      return saved ? JSON.parse(saved) : { name: '', age: '', gender: '', phone: '' };
    } catch { return { name: '', age: '', gender: '', phone: '' }; }
  });

  const setCurrentScreen = (screen: AppScreen) => {
    // Don't persist auth/onboarding screens — always restart those fresh
    const authScreens: AppScreen[] = ['welcome', 'auth-choice', 'phone-entry', 'otp', 'profile', 'location-access', 'login'];
    if (!authScreens.includes(screen)) {
      localStorage.setItem('mc_screen', screen);
    } else {
      localStorage.removeItem('mc_screen');
    }
    setCurrentScreenState(screen);
  };

  const setUser = (u: UserProfile) => {
    localStorage.setItem('mc_user', JSON.stringify(u));
    setUserState(u);
  };
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [consultations] = useState<Consultation[]>(sampleConsultations);
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city?: string } | null>(null);
  const [walletBalance, setWalletBalanceState] = useState<number>(() => {
    const saved = localStorage.getItem('mc_wallet');
    return saved ? parseInt(saved, 10) : 0;
  });

  const setWalletBalance = (bal: number) => {
    localStorage.setItem('mc_wallet', String(bal));
    setWalletBalanceState(bal);
  };

  // Deduct from wallet — always reads fresh balance from DB to avoid stale closure
  const deductWallet = async (amount: number): Promise<boolean> => {
    const firebaseUser = getCurrentUser();
    if (!firebaseUser) return false;

    // Fetch current balance from DB (source of truth)
    const { data: row, error: fetchErr } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', firebaseUser.uid)
      .single();
    if (fetchErr || !row) { console.error('deductWallet fetch error:', fetchErr); return false; }

    const currentBal = Number(row.wallet_balance) || 0;
    if (currentBal < amount) return false; // insufficient
    const newBal = currentBal - amount;

    const { error } = await supabase
      .from('users')
      .update({ wallet_balance: newBal })
      .eq('id', firebaseUser.uid);
    if (error) { console.error('deductWallet update error:', error); return false; }

    setWalletBalanceState(newBal);
    localStorage.setItem('mc_wallet', String(newBal));
    return true;
  };

  // Add to wallet — always reads fresh balance from DB to avoid stale closure
  const addToWallet = async (amount: number): Promise<void> => {
    const firebaseUser = getCurrentUser();
    if (!firebaseUser) return;

    // Fetch current balance from DB (source of truth)
    const { data: row } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', firebaseUser.uid)
      .single();

    const currentBal = Number(row?.wallet_balance) || 0;
    const newBal = currentBal + amount;

    await supabase.from('users').update({ wallet_balance: newBal }).eq('id', firebaseUser.uid);
    setWalletBalanceState(newBal);
    localStorage.setItem('mc_wallet', String(newBal));
  };

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem('mc_appointments');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map((a: Appointment) => ({ ...a, date: new Date(a.date) }));
    } catch { return []; }
  });

  const addAppointment = (apt: Appointment) => {
    setAppointments(prev => {
      const updated = [apt, ...prev.filter(a => a.id !== apt.id)];
      localStorage.setItem('mc_appointments', JSON.stringify(updated));
      return updated;
    });
  };

  const cancelAppointment = (id: string) => {
    setAppointments(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a);
      localStorage.setItem('mc_appointments', JSON.stringify(updated));
      return updated;
    });
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  // Global OPD rating popup — fires when doctor marks attended from any screen
  const [ratingApt, setRatingApt] = useState<any | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    // Watch for attended status on this patient's appointments
    const sub = supabase
      .channel('global_opd_rating')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'opd_appointments' },
        async (payload) => {
          const updated = payload.new as any;
          if (updated.status !== 'attended' || updated.rating_submitted) return;
          // Fetch doctor details for the popup
          const { data: doc } = await supabase
            .from('doctors')
            .select('full_name, specialization, selfie_url, firebase_uid')
            .eq('firebase_uid', updated.doctor_id)
            .maybeSingle();
          setRatingApt({ ...updated, doctor: doc });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  // Load wallet balance from Supabase on auth + realtime sync
  useEffect(() => {
    let realtimeChannel: any = null;
    let currentUid: string | null = null;

    const setupWallet = async (uid: string) => {
      currentUid = uid;

      // 1. Initial fetch from DB
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', uid)
        .maybeSingle();

      if (!error && data?.wallet_balance != null) {
        setWalletBalanceState(Number(data.wallet_balance));
        localStorage.setItem('mc_wallet', String(data.wallet_balance));
      }

      // 2. Remove any existing channel before creating new one
      if (realtimeChannel) {
        await supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      // 3. Realtime: poll every 3s as primary (REPLICA IDENTITY FULL may not be set)
      //    + realtime as bonus for instant updates
      const pollInterval = setInterval(async () => {
        if (currentUid !== uid) { clearInterval(pollInterval); return; }
        const { data: fresh } = await supabase
          .from('users').select('wallet_balance').eq('id', uid).maybeSingle();
        if (fresh?.wallet_balance != null) {
          const newBal = Number(fresh.wallet_balance);
          setWalletBalanceState(prev => {
            if (prev !== newBal) {
              localStorage.setItem('mc_wallet', String(newBal));
              return newBal;
            }
            return prev;
          });
        }
      }, 3000);

      // 4. Realtime subscription (fires instantly if REPLICA IDENTITY FULL is set)
      realtimeChannel = supabase
        .channel(`wallet_${uid}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'users',
        }, async (payload) => {
          // Without REPLICA IDENTITY FULL, re-fetch to get latest value
          const { data: fresh } = await supabase
            .from('users').select('wallet_balance').eq('id', uid).maybeSingle();
          if (fresh?.wallet_balance != null) {
            const newBal = Number(fresh.wallet_balance);
            setWalletBalanceState(newBal);
            localStorage.setItem('mc_wallet', String(newBal));
            clearInterval(pollInterval); // realtime is working, stop polling
          }
        })
        .subscribe();

      return pollInterval;
    };

    let pollInterval: any = null;

    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        pollInterval = await setupWallet(firebaseUser.uid);
      } else {
        currentUid = null;
        if (pollInterval) clearInterval(pollInterval);
        if (realtimeChannel) supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    });

    return () => {
      unsub();
      if (pollInterval) clearInterval(pollInterval);
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        user,
        setUser,
        userLocation,
        setUserLocation,
        selectedSymptoms,
        setSelectedSymptoms,
        currentDoctor,
        setCurrentDoctor,
        messages,
        addMessage,
        consultations,
        currentPrescription,
        setCurrentPrescription,
        walletBalance,
        setWalletBalance,
        deductWallet,
        addToWallet,
        appointments,
        addAppointment,
        cancelAppointment,
      }}
    >
      {children}
      {/* Global OPD rating popup */}
      {ratingApt && <GlobalRatingPopup apt={ratingApt} onClose={() => setRatingApt(null)} />}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
