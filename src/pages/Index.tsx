import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { WelcomeScreen } from '@/components/screens/WelcomeScreen';
import { OTPScreen } from '@/components/screens/OTPScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { SymptomsScreen } from '@/components/screens/SymptomsScreen';
import { MatchingScreen } from '@/components/screens/MatchingScreen';
import { AvailableDoctorsScreen } from '@/components/screens/AvailableDoctorsScreen';
import { ChatScreen } from '@/components/screens/ChatScreen';
import { PrescriptionScreen } from '@/components/screens/PrescriptionScreen';
import { RecordsScreen } from '@/components/screens/RecordsScreen';
import { UserProfileScreen } from '@/components/screens/UserProfileScreen';
import { PaymentScreen } from '@/components/screens/PaymentScreen';
import { PharmacySelectionScreen } from '@/components/screens/PharmacySelectionScreen';
import { OrderConfirmationScreen } from '@/components/screens/OrderConfirmationScreen';
import { OrderProcessingScreen } from '@/components/screens/OrderProcessingScreen';
import { PricePaymentScreen } from '@/components/screens/PricePaymentScreen';
import { OrderTrackingScreen } from '@/components/screens/OrderTrackingScreen';
import { OrderCompletionScreen } from '@/components/screens/OrderCompletionScreen';
import { ConsultationTypeScreen } from '@/components/screens/ConsultationTypeScreen';
import { SelectSpecialtyScreen } from '@/components/screens/SelectSpecialtyScreen';
import { SymptomDescriptionScreen } from '@/components/screens/SymptomDescriptionScreen';
import { SelectHospitalScreen } from '@/components/screens/SelectHospitalScreen';
import { SelectDoctorScreen } from '@/components/screens/SelectDoctorScreen';
import { SelectTimeSlotScreen } from '@/components/screens/SelectTimeSlotScreen';
import { AppointmentSummaryScreen } from '@/components/screens/AppointmentSummaryScreen';
import { AppointmentConfirmationScreen } from '@/components/screens/AppointmentConfirmationScreen';
import { HomeVisitAvailabilityScreen } from '@/components/screens/HomeVisitAvailabilityScreen';
import { AddressSlotScreen } from '@/components/screens/AddressSlotScreen';
import { HomeVisitConfirmationScreen } from '@/components/screens/HomeVisitConfirmationScreen';
import { TrackDoctorScreen } from '@/components/screens/TrackDoctorScreen';
import { ConsultAgainScreen } from '@/components/screens/ConsultAgainScreen';
import { PrescriptionsListScreen } from '@/components/screens/PrescriptionsListScreen';
import { UploadReportScreen } from '@/components/screens/UploadReportScreen';
import { FamilyMembersScreen } from '@/components/screens/FamilyMembersScreen';
import { BookingsScreen } from '@/components/screens/BookingsScreen';
import { AuthChoiceScreen } from '@/components/screens/AuthChoiceScreen';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { PhoneEntryScreen } from '@/components/screens/PhoneEntryScreen';
import { LocationAccessScreen } from '@/components/screens/LocationAccessScreen';
// Doctor Registration Flow
import { DoctorWelcomeScreen } from '@/components/screens/doctor-registration/DoctorWelcomeScreen';
import { DoctorBasicDetailsScreen } from '@/components/screens/doctor-registration/DoctorBasicDetailsScreen';
import { DoctorIdentityScreen } from '@/components/screens/doctor-registration/DoctorIdentityScreen';
import { DoctorMedicalCredentialsScreen } from '@/components/screens/doctor-registration/DoctorMedicalCredentialsScreen';
import { DoctorProfessionalProfileScreen } from '@/components/screens/doctor-registration/DoctorProfessionalProfileScreen';
import { DoctorPaymentDetailsScreen } from '@/components/screens/doctor-registration/DoctorPaymentDetailsScreen';
import { DoctorLegalConsentScreen } from '@/components/screens/doctor-registration/DoctorLegalConsentScreen';
import { DoctorVerificationStatusScreen } from '@/components/screens/doctor-registration/DoctorVerificationStatusScreen';
import { DoctorApprovalSuccessScreen } from '@/components/screens/doctor-registration/DoctorApprovalSuccessScreen';
import { BottomNav } from '@/components/BottomNav';
import { Doctor, Message, Prescription, Hospital, ConsultationType, Specialty, Appointment } from '@/types/app';

function AppContent() {
  const {
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
  } = useApp();

  const [phone, setPhone] = useState('');
  const [consultationType, setConsultationType] = useState<ConsultationType>('hospital');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>('general-physician');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctorWithFee, setSelectedDoctorWithFee] = useState<(Doctor & { fee: number }) | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [homeVisitAddress, setHomeVisitAddress] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [searchedSpecialty, setSearchedSpecialty] = useState<string>('');

  const sampleDoctor: Doctor = {
    id: '1',
    name: 'Dr. Priya Sharma',
    specialization: 'General Physician',
    rating: 4.9,
    experience: '12 years',
    avatar: '',
    verified: true,
    fee: 599,
    availability: 'Available now',
  };

  const samplePrescription: Prescription = {
    id: '1',
    doctor: sampleDoctor,
    date: new Date(),
    diagnosis: 'Viral Fever with mild upper respiratory infection',
    advice: [
      'Take plenty of rest and stay hydrated',
      'Avoid cold foods and drinks',
      'Monitor temperature every 4 hours',
      'Revisit if fever persists beyond 3 days',
    ],
    medicines: [
      { name: 'Paracetamol 650mg', dosage: '1 tablet when fever > 100°F', duration: '3 days', timing: 'Every 6 hours if needed', type: 'generic', price: 45 },
      { name: 'Cetirizine 10mg', dosage: '1 tablet at bedtime', duration: '5 days', timing: 'Night only', type: 'generic', price: 35 },
      { name: 'Vitamin C 500mg', dosage: '1 tablet daily', duration: '7 days', timing: 'After breakfast', type: 'branded', price: 120 },
    ],
  };

  const sampleAppointments: Appointment[] = [
    {
      id: '1',
      doctor: sampleDoctor,
      hospital: { id: '1', name: 'Apollo Clinic', address: 'Sector 21, Gurugram', distance: '2.5 km', rating: 4.5, availableDoctors: 12, opdFeeRange: '₹300-500' },
      type: 'hospital',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      timeSlot: '10:30 AM',
      fee: 500,
      status: 'confirmed',
    },
    {
      id: '2',
      doctor: { ...sampleDoctor, id: '2', name: 'Dr. Amit Patel', specialization: 'Dermatologist' },
      type: 'home',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      timeSlot: '4:00 PM',
      fee: 800,
      status: 'pending',
      address: '123, Green Valley Apartments',
    },
    {
      id: '3',
      doctor: { ...sampleDoctor, id: '3', name: 'Dr. Neha Singh', specialization: 'Pediatrician' },
      hospital: { id: '2', name: 'Max Hospital', address: 'Saket, Delhi', distance: '8 km', rating: 4.8, availableDoctors: 25, opdFeeRange: '₹500-800' },
      type: 'hospital',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      timeSlot: '11:00 AM',
      fee: 600,
      status: 'completed',
    },
  ];

  const showBottomNav = ['home', 'bookings', 'records', 'prescription', 'user-profile'].includes(currentScreen);
  const TOTAL_DOCTOR_REG_STEPS = 7;

  const handleSendMessage = (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text, timestamp: new Date(), read: true };
    addMessage(userMsg);
    setTimeout(() => {
      const responses = [
        "I understand. Can you tell me when the symptoms started?",
        "Have you taken any medication for this?",
        "Based on what you've told me, this seems like a viral infection. Let me prescribe something for you.",
      ];
      const doctorMsg: Message = { id: (Date.now() + 1).toString(), sender: 'doctor', text: responses[Math.floor(Math.random() * responses.length)], timestamp: new Date() };
      addMessage(doctorMsg);
    }, 1500);
  };

  const handleDoctorsFound = (specialty: string) => {
    const pool: Doctor[] = [
      { id: 'd1', name: 'Dr. Sneha Reddy', specialization: specialty, rating: 4.8, experience: '9 years', avatar: '', verified: true, fee: 499, availability: 'Available now' },
      { id: 'd2', name: 'Dr. Vikram Singh', specialization: specialty, rating: 4.7, experience: '11 years', avatar: '', verified: true, fee: 549, availability: 'Available in 10 min' },
      { id: 'd3', name: 'Dr. Priya Sharma', specialization: specialty, rating: 4.9, experience: '12 years', avatar: '', verified: true, fee: 599, availability: 'Available now' },
    ];
    setAvailableDoctors(pool);
    setCurrentScreen('available-doctors');
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    setCurrentDoctor(doctor);
    addMessage({
      id: '0',
      sender: 'doctor',
      text: `Hello! I'm ${doctor.name}. I've reviewed your concern. Can you tell me more about how you're feeling?`,
      timestamp: new Date(),
    });
    setCurrentScreen('chat');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      // Auth flow
      case 'welcome': return <WelcomeScreen onContinue={() => setCurrentScreen('auth-choice')} onGoogleContinue={() => setCurrentScreen('auth-choice')} />;
      case 'auth-choice': return <AuthChoiceScreen onRegister={() => setCurrentScreen('phone-entry')} onLogin={() => setCurrentScreen('login')} onBack={() => setCurrentScreen('welcome')} />;
      case 'phone-entry': return <PhoneEntryScreen onContinue={(p) => { setPhone(p); setCurrentScreen('otp'); }} onBack={() => setCurrentScreen('auth-choice')} />;
      case 'otp': return <OTPScreen phone={phone} onVerify={() => setCurrentScreen('profile')} onBack={() => setCurrentScreen('phone-entry')} />;
      case 'profile': return <ProfileScreen phone={phone} onComplete={(profile) => { setUser(profile); setCurrentScreen('location-access'); }} onBack={() => setCurrentScreen('otp')} />;
      case 'location-access': return <LocationAccessScreen onGranted={(loc) => { setUserLocation(loc); setUser({ ...user, location: loc }); setCurrentScreen('home'); }} onSkip={() => setCurrentScreen('home')} />;
      case 'login': return <LoginScreen onLogin={() => setCurrentScreen('location-access')} onBack={() => setCurrentScreen('auth-choice')} />;

      // Main app
      case 'home': return <HomeScreen user={user} consultations={consultations} walletBalance={walletBalance} onRecharge={(amt) => setWalletBalance(walletBalance + amt)} onConsultNow={() => setCurrentScreen('symptoms')} onBookDoctor={() => setCurrentScreen('consultation-type')} onProfile={() => setCurrentScreen('user-profile')} onNotifications={() => {}} onConsultAgain={() => setCurrentScreen('consult-again')} onBookAppointment={() => setCurrentScreen('select-specialty')} onReferEarn={() => setCurrentScreen('user-profile')} onHelpCentre={() => setCurrentScreen('user-profile')} onRecords={() => setCurrentScreen('records')} />;

      // Consult Now flow
      case 'symptoms': return <SymptomsScreen onSubmit={(symptoms) => { setSelectedSymptoms(symptoms); setSearchedSpecialty(symptoms[0] || 'General Physician'); setCurrentScreen('matching'); }} onBack={() => setCurrentScreen('home')} />;
      case 'matching': return <MatchingScreen symptoms={selectedSymptoms} onMatched={() => handleDoctorsFound(searchedSpecialty || 'General Physician')} onCancel={() => setCurrentScreen('home')} />;
      case 'available-doctors': return <AvailableDoctorsScreen specialty={searchedSpecialty} doctors={availableDoctors} walletBalance={walletBalance} onRecharge={(amt) => setWalletBalance(walletBalance + amt)} onSelectDoctor={handleSelectDoctor} onBack={() => setCurrentScreen('symptoms')} />;
      case 'chat': return <ChatScreen doctor={currentDoctor || sampleDoctor} messages={messages} consultationFee={currentDoctor?.fee ?? 0} onSendMessage={handleSendMessage} onEndSession={() => { setCurrentPrescription(samplePrescription); setCurrentScreen('prescription'); }} onBack={() => { setCurrentPrescription(samplePrescription); setCurrentScreen('prescription'); }} currentPrescription={currentPrescription} onDownloadPrescription={() => {}} />;
      case 'prescription': return <PrescriptionScreen prescription={currentPrescription || samplePrescription} onConsultAgain={() => setCurrentScreen('symptoms')} onBookSameDoctor={() => setCurrentScreen('symptoms')} onGoHome={() => setCurrentScreen('home')} onOrderMedicines={() => setCurrentScreen('pharmacy-selection')} />;

      // Other main screens
      case 'records': return <RecordsScreen onBack={() => setCurrentScreen('home')} onViewPrescription={() => setCurrentScreen('prescription')} />;
      case 'user-profile': return <UserProfileScreen user={user} onBack={() => setCurrentScreen('home')} onEditProfile={() => setCurrentScreen('profile')} onLogout={() => { localStorage.removeItem('mc_screen'); localStorage.removeItem('mc_user'); localStorage.removeItem('mc_wallet'); setCurrentScreen('welcome'); }} onDoctorRegister={() => setCurrentScreen('doctor-welcome')} />;
      case 'payment': return <PaymentScreen consultationFee={299} onPaymentComplete={() => setCurrentScreen('symptoms')} onBack={() => setCurrentScreen('home')} />;
      case 'pharmacy-selection': return <PharmacySelectionScreen prescription={currentPrescription || samplePrescription} onSendToPharmacy={() => setCurrentScreen('order-confirmation')} onBack={() => setCurrentScreen('prescription')} />;
      case 'order-confirmation': return <OrderConfirmationScreen prescription={currentPrescription || samplePrescription} deliveryAddress="123, Green Valley Apartments, Sector 21, Gurugram, Haryana - 122001" onConfirm={() => setCurrentScreen('order-processing')} onCancel={() => setCurrentScreen('pharmacy-selection')} />;
      case 'order-processing': return <OrderProcessingScreen onProceedToPayment={() => setCurrentScreen('price-payment')} onContactSupport={() => {}} />;
      case 'price-payment': return <PricePaymentScreen medicines={(currentPrescription || samplePrescription).medicines} onPaymentComplete={() => setCurrentScreen('order-tracking')} onBack={() => setCurrentScreen('order-processing')} />;
      case 'order-tracking': return <OrderTrackingScreen orderId="#MOM2024001234" onContactPharmacy={() => {}} onContactSupport={() => {}} onOrderDelivered={() => setCurrentScreen('order-completion')} />;
      case 'order-completion': return <OrderCompletionScreen orderId="#MOM2024001234" onRateExperience={() => {}} onConsultAgain={() => setCurrentScreen('symptoms')} onGoHome={() => setCurrentScreen('home')} />;

      // Bookings
      case 'bookings': return <BookingsScreen appointments={appointments} onViewDetails={(apt) => { setSelectedAppointment(apt); setCurrentScreen('appointment-confirmation'); }} onBack={() => setCurrentScreen('home')} />;

      // Book a Doctor Flow
      case 'consultation-type': return <ConsultationTypeScreen onSelect={(type) => { setConsultationType(type); setCurrentScreen('select-specialty'); }} onBack={() => setCurrentScreen('home')} />;
      case 'select-specialty': return <SelectSpecialtyScreen onSelect={(specialty) => { setSelectedSpecialty(specialty); setCurrentScreen('symptom-description'); }} onBack={() => setCurrentScreen('consultation-type')} />;
      case 'symptom-description': return <SymptomDescriptionScreen specialty={selectedSpecialty} onSubmit={() => setCurrentScreen(consultationType === 'hospital' ? 'select-hospital' : 'home-visit-availability')} onBack={() => setCurrentScreen('select-specialty')} />;

      // Hospital Flow
      case 'select-hospital': return <SelectHospitalScreen walletBalance={walletBalance} onRecharge={(amt) => setWalletBalance(walletBalance + amt)} onSelect={(hospital) => { setSelectedHospital(hospital); setCurrentScreen('select-doctor'); }} onBack={() => setCurrentScreen('symptom-description')} />;
      case 'select-doctor': return <SelectDoctorScreen hospital={selectedHospital!} onSelect={(doctor) => { setSelectedDoctorWithFee(doctor); setCurrentScreen('select-time-slot'); }} onBack={() => setCurrentScreen('select-hospital')} />;
      case 'select-time-slot': return <SelectTimeSlotScreen doctor={selectedDoctorWithFee!} onSelect={(date, slot) => { setSelectedDate(date); setSelectedTimeSlot(slot); setCurrentScreen('appointment-summary'); }} onBack={() => setCurrentScreen('select-doctor')} />;
      case 'appointment-summary': return <AppointmentSummaryScreen doctor={selectedDoctorWithFee!} hospital={selectedHospital!} date={selectedDate} timeSlot={selectedTimeSlot} onConfirm={() => {
        const newApt: Appointment = {
          id: Date.now().toString(),
          doctor: selectedDoctorWithFee!,
          hospital: selectedHospital!,
          type: 'hospital',
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          fee: selectedDoctorWithFee?.fee ?? 0,
          status: 'confirmed',
        };
        addAppointment(newApt);
        setSelectedAppointment(newApt);
        setCurrentScreen('appointment-confirmation');
      }} onBack={() => setCurrentScreen('select-time-slot')} />;
      case 'appointment-confirmation': {
        const apt = selectedAppointment;
        const doc = apt?.doctor || selectedDoctorWithFee;
        const hosp = apt?.hospital || selectedHospital;
        const dt = apt?.date || selectedDate;
        const slot = apt?.timeSlot || selectedTimeSlot;
        const bookId = apt?.id ? `#APT${apt.id}` : '#APT2024001234';
        return <AppointmentConfirmationScreen
          bookingId={bookId} doctor={doc} hospital={hosp} date={dt} timeSlot={slot}
          onAddToCalendar={() => { if (apt) addAppointment(apt); }}
          onGetDirections={() => {}}
          onContactHospital={() => {}}
          onCancel={() => { if (apt?.id) cancelAppointment(apt.id); setCurrentScreen('bookings'); }}
          onGoHome={() => setCurrentScreen('home')}
        />;
      }

      // Home Visit Flow
      case 'home-visit-availability': return <HomeVisitAvailabilityScreen specialty={selectedSpecialty} onAvailable={() => setCurrentScreen('address-slot')} onNotAvailable={() => setCurrentScreen('select-hospital')} onBack={() => setCurrentScreen('symptom-description')} />;
      case 'address-slot': return <AddressSlotScreen onSubmit={({ address, date, timeSlot }) => { setHomeVisitAddress(address); setSelectedDate(date); setSelectedTimeSlot(timeSlot); setCurrentScreen('home-visit-confirmation'); }} onBack={() => setCurrentScreen('home-visit-availability')} />;
      case 'home-visit-confirmation': return <HomeVisitConfirmationScreen address={homeVisitAddress} date={selectedDate} timeSlot={selectedTimeSlot} onConfirm={() => setCurrentScreen('track-doctor')} onBack={() => setCurrentScreen('address-slot')} />;
      case 'track-doctor': return <TrackDoctorScreen onComplete={() => setCurrentScreen('prescription')} onContactDoctor={() => {}} onGoHome={() => setCurrentScreen('home')} />;

      // Quick Actions
      case 'consult-again': return <ConsultAgainScreen consultations={consultations} onConsultAgain={() => setCurrentScreen('chat')} onBack={() => setCurrentScreen('home')} />;
      case 'prescriptions-list': return <PrescriptionsListScreen prescriptions={[samplePrescription]} onViewPrescription={() => setCurrentScreen('prescription')} onBack={() => setCurrentScreen('home')} />;
      case 'upload-report': return <UploadReportScreen onUpload={() => setCurrentScreen('records')} onBack={() => setCurrentScreen('home')} />;
      case 'family-members': return <FamilyMembersScreen members={[]} onAddMember={() => {}} onBack={() => setCurrentScreen('home')} />;

      // Doctor Registration Flow
      case 'doctor-welcome': return <DoctorWelcomeScreen onStart={() => setCurrentScreen('doctor-basic-details')} onBack={() => setCurrentScreen('user-profile')} />;
      case 'doctor-basic-details': return <DoctorBasicDetailsScreen onSubmit={(data) => { setDoctorName(data.fullName); setCurrentScreen('doctor-identity'); }} onBack={() => setCurrentScreen('doctor-welcome')} currentStep={1} totalSteps={TOTAL_DOCTOR_REG_STEPS} />;
      case 'doctor-identity': return <DoctorIdentityScreen onSubmit={() => setCurrentScreen('doctor-medical-credentials')} onBack={() => setCurrentScreen('doctor-basic-details')} currentStep={2} totalSteps={TOTAL_DOCTOR_REG_STEPS} />;
      case 'doctor-medical-credentials': return <DoctorMedicalCredentialsScreen onSubmit={() => setCurrentScreen('doctor-professional-profile')} onBack={() => setCurrentScreen('doctor-identity')} currentStep={3} totalSteps={TOTAL_DOCTOR_REG_STEPS} />;
      case 'doctor-professional-profile': return <DoctorProfessionalProfileScreen onSubmit={() => setCurrentScreen('doctor-payment-details')} onBack={() => setCurrentScreen('doctor-medical-credentials')} currentStep={4} totalSteps={TOTAL_DOCTOR_REG_STEPS} />;
      case 'doctor-payment-details': return <DoctorPaymentDetailsScreen onSubmit={() => setCurrentScreen('doctor-legal-consent')} onBack={() => setCurrentScreen('doctor-professional-profile')} currentStep={5} totalSteps={TOTAL_DOCTOR_REG_STEPS} />;
      case 'doctor-legal-consent': return <DoctorLegalConsentScreen onSubmit={() => setCurrentScreen('doctor-verification-status')} onBack={() => setCurrentScreen('doctor-payment-details')} currentStep={6} totalSteps={TOTAL_DOCTOR_REG_STEPS} />;
      case 'doctor-verification-status': return <DoctorVerificationStatusScreen onEditDetails={() => setCurrentScreen('doctor-basic-details')} onContactSupport={() => {}} onRefresh={() => setCurrentScreen('doctor-approval-success')} />;
      case 'doctor-approval-success': return <DoctorApprovalSuccessScreen doctorName={doctorName.split(' ').slice(-1)[0] || 'Doctor'} onGoToDashboard={() => setCurrentScreen('home')} onCompleteProfile={() => setCurrentScreen('user-profile')} />;

      default: return <WelcomeScreen onContinue={() => setCurrentScreen('auth-choice')} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      {renderScreen()}
      {showBottomNav && <BottomNav activeScreen={currentScreen} onNavigate={setCurrentScreen} />}
    </div>
  );
}

const Index = () => (
  <ThemeProvider>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </ThemeProvider>
);

export default Index;
