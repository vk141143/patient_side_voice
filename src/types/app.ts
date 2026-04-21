export type AppScreen = 
  | 'welcome'
  | 'auth-choice'
  | 'login'
  | 'phone-entry'
  | 'otp'
  | 'profile'
  | 'location-access'
  | 'available-doctors'
  | 'forgot-password'
  | 'home'
  | 'symptoms'
  | 'matching'
  | 'chat'
  | 'prescription'
  | 'records'
  | 'notifications'
  | 'user-profile'
  | 'payment'
  | 'pharmacy-selection'
  | 'order-confirmation'
  | 'order-processing'
  | 'price-payment'
  | 'order-tracking'
  | 'order-completion'
  // Bookings
  | 'bookings'
  // Book a Doctor Flow
  | 'consultation-type'
  | 'select-specialty'
  | 'symptom-description'
  // Hospital Visit Flow
  | 'select-hospital'
  | 'select-doctor'
  | 'select-time-slot'
  | 'appointment-summary'
  | 'appointment-confirmation'
  // Home Visit Flow
  | 'home-visit-availability'
  | 'address-slot'
  | 'home-visit-confirmation'
  | 'track-doctor'
  // Quick Actions
  | 'consult-again'
  | 'prescriptions-list'
  | 'upload-report'
  | 'family-members'
  // Doctor Registration Flow
  | 'doctor-welcome'
  | 'doctor-basic-details'
  | 'doctor-identity'
  | 'doctor-medical-credentials'
  | 'doctor-professional-profile'
  | 'doctor-payment-details'
  | 'doctor-legal-consent'
  | 'doctor-verification-status'
  | 'doctor-approval-success';

export type ConsultationType = 'hospital' | 'home';

export type Specialty = 
  | 'general-physician'
  | 'pediatrician'
  | 'gynecologist'
  | 'dermatologist'
  | 'orthopedic'
  | 'ent'
  | 'other';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  availableDoctors: number;
  opdFeeRange: string;
  image?: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  hospital?: Hospital;
  type: ConsultationType;
  date: Date;
  timeSlot: string;
  fee: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  address?: string;
}

export interface UserProfile {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other' | '';
  phone: string;
  location?: { lat: number; lng: number; city?: string };
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  experience: string;
  avatar: string;
  verified: boolean;
  fee?: number;
  availability?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'doctor' | 'system';
  text: string;
  timestamp: Date;
  read?: boolean;
  type?: 'text' | 'prescription';
  prescriptionId?: string;
}

export interface Consultation {
  id: string;
  doctor: Doctor;
  date: Date;
  issue: string;
  status: 'completed' | 'ongoing' | 'scheduled';
}

export interface Prescription {
  id: string;
  doctor: Doctor;
  date: Date;
  diagnosis: string;
  advice: string[];
  medicines: Medicine[];
}

export interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  timing: string;
  type?: 'generic' | 'branded' | 'antibiotic';
  purpose?: string;
  price?: number;
}

export interface MedicineOrder {
  id: string;
  prescription: Prescription;
  status: 'pending' | 'sent' | 'reviewing' | 'confirmed' | 'out-for-delivery' | 'delivered';
  pharmacy: {
    name: string;
    logo: string;
    verified: boolean;
  };
  deliveryAddress: string;
  estimatedDelivery: Date;
  totalAmount: number;
  deliveryCharge: number;
  paymentMethod?: 'upi' | 'card' | 'cod' | 'pharmacy';
}

export interface HealthRecord {
  id: string;
  type: 'prescription' | 'report' | 'consultation';
  title: string;
  date: Date;
  doctor?: Doctor;
  fileUrl?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: string;
  gender: 'male' | 'female' | 'other';
}
