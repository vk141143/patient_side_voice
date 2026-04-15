import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppScreen, UserProfile, Doctor, Message, Consultation, Prescription, Appointment } from '@/types/app';

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
        appointments,
        addAppointment,
        cancelAppointment,
      }}
    >
      {children}
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
