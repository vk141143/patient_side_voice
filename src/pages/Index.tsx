import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { WelcomeScreen } from '@/components/screens/WelcomeScreen';
import { OTPScreen } from '@/components/screens/OTPScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { SymptomsScreen, ConsultMode } from '@/components/screens/SymptomsScreen';
import { MatchingScreen } from '@/components/screens/MatchingScreen';
import { AvailableDoctorsScreen } from '@/components/screens/AvailableDoctorsScreen';
import { ChatScreen } from '@/components/screens/ChatScreen';
import { PrescriptionScreen } from '@/components/screens/PrescriptionScreen';
import { RecordsScreen } from '@/components/screens/RecordsScreen';
import { UserProfileScreen } from '@/components/screens/UserProfileScreen';
import { UserNotificationsScreen } from '@/components/screens/UserProfileScreen';
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
import { ForgotPasswordScreen } from '@/components/screens/ForgotPasswordScreen';
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
import { Doctor, Hospital, ConsultationType, Specialty, Appointment } from '@/types/app';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

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
    consultations,
    currentPrescription,
    walletBalance,
    deductWallet,
    addToWallet,
    appointments,
    addAppointment,
    cancelAppointment,
  } = useApp();

  const [phone, setPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [consultationType, setConsultationType] = useState<ConsultationType>('hospital');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty>('general-physician');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctorWithFee, setSelectedDoctorWithFee] = useState<(Doctor & { fee: number }) | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [homeVisitAddress, setHomeVisitAddress] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchedSpecialty, setSearchedSpecialty] = useState<string>('');
  const [bonusMinutesForChat, setBonusMinutesForChat] = useState<number>(0);
  const [symptomData, setSymptomData] = useState<{ description: string; symptoms: string[]; reportUrl?: string }>({ description: '', symptoms: [] });
  const [consultMode, setConsultMode] = useState<ConsultMode>('instant');
  const [chatFee, setChatFee] = useState<number>(0); // actual fee to deduct on session end
  const [consultRequestId, setConsultRequestIdState] = useState<string | null>(() => localStorage.getItem('mc_consult_id'));
  const [chatSessionData, setChatSessionData] = useState<any | null>(null);
  const [chatRxId, setChatRxId] = useState<string | null>(null);
  const setConsultRequestId = (id: string | null) => {
    if (id) localStorage.setItem('mc_consult_id', id);
    else localStorage.removeItem('mc_consult_id');
    setConsultRequestIdState(id);
  };

  const handleRecharge = async (amt: number) => {
    await addToWallet(amt);
  };

  const showBottomNav = ['home', 'bookings', 'records', 'prescription', 'user-profile'].includes(currentScreen);
  const TOTAL_DOCTOR_REG_STEPS = 7;

  const renderScreen = () => {
    switch (currentScreen) {
      // Auth flow
      case 'welcome': return <WelcomeScreen onContinue={() => setCurrentScreen('auth-choice')} onGoogleContinue={() => setCurrentScreen('auth-choice')} />;
      case 'auth-choice': return <AuthChoiceScreen onRegister={() => setCurrentScreen('phone-entry')} onLogin={() => setCurrentScreen('login')} onBack={() => setCurrentScreen('welcome')} />;
      case 'phone-entry': return <PhoneEntryScreen onContinue={async (p, e, pw) => {
        setPhone(p); setRegEmail(e); setRegPassword(pw);
        const { registerAndSendVerification } = await import('@/services/auth');
        const { user, error } = await registerAndSendVerification(e, pw);
        if (error) throw new Error(error);
        setCurrentScreen('otp');
      }} onBack={() => setCurrentScreen('auth-choice')} />;
      case 'otp': return <OTPScreen email={regEmail} onVerify={() => setCurrentScreen('profile')} onBack={() => setCurrentScreen('phone-entry')} />;
      case 'profile': return <ProfileScreen phone={phone} email={regEmail} password={regPassword} onComplete={(profile) => { setUser(profile); setCurrentScreen('location-access'); }} onBack={() => setCurrentScreen('otp')} />;
      case 'location-access': return <LocationAccessScreen onGranted={(loc) => { setUserLocation(loc); setUser({ ...user, location: loc }); setCurrentScreen('home'); }} onSkip={() => setCurrentScreen('home')} />;
      case 'login': return <LoginScreen onLogin={(p) => { setUser({ name: p.name, age: p.age ?? '', gender: (p.gender as any) ?? '', phone: p.phone ?? '' }); setCurrentScreen('location-access'); }} onForgotPassword={() => setCurrentScreen('forgot-password')} onBack={() => setCurrentScreen('auth-choice')} />;
      case 'forgot-password': return <ForgotPasswordScreen onBack={() => setCurrentScreen('login')} onSuccess={() => setCurrentScreen('login')} />;

      // Main app
      case 'home': return <HomeScreen user={user} consultations={consultations} walletBalance={walletBalance} onRecharge={handleRecharge} onConsultNow={() => setCurrentScreen('symptoms')} onBookDoctor={() => setCurrentScreen('consultation-type')} onProfile={() => setCurrentScreen('user-profile')} onNotifications={() => setCurrentScreen('user-notifications')} onConsultAgain={() => setCurrentScreen('consult-again')} onBookAppointment={() => setCurrentScreen('select-specialty')} onReferEarn={() => setCurrentScreen('user-profile')} onHelpCentre={() => setCurrentScreen('user-profile')} onRecords={() => setCurrentScreen('records')} />;

      // Consult Now flow
      case 'symptoms': return <SymptomsScreen onSubmit={(symptoms, desc, reportUrl, mode) => {
        setSelectedSymptoms(symptoms);
        setSearchedSpecialty(symptoms[0] || 'General Physician');
        setSymptomData(prev => ({ ...prev, description: desc ?? '', reportUrl }));
        setConsultMode(mode ?? 'instant');
        setCurrentScreen(mode === 'available' ? 'available-doctors' : 'matching');
      }} onBack={() => setCurrentScreen('home')} />;
      case 'matching': return <MatchingScreen symptoms={selectedSymptoms} description={symptomData.description} reportUrl={symptomData.reportUrl} consultMode={consultMode} onMatched={async (reqId, doctorId, sessionData) => {
        setConsultRequestId(reqId);
        setChatSessionData(sessionData);
        const { data: priceRow } = await supabase.from('admin_pricing').select('value').eq('key', 'instant_chat_price').single();
        setChatFee(Number(priceRow?.value) || 99);
        const { data: doc } = await supabase.from('doctors')
          .select('firebase_uid, full_name, specialization, selfie_url, experience_years')
          .eq('firebase_uid', doctorId).maybeSingle();
        if (doc) {
          setCurrentDoctor({ id: doc.firebase_uid, name: doc.full_name, specialization: doc.specialization, avatar: doc.selfie_url ?? '', rating: 4.8, experience: `${doc.experience_years ?? 0} years`, verified: true, fee: 0, availability: 'Available now', firebase_uid: doc.firebase_uid, full_name: doc.full_name, selfie_url: doc.selfie_url } as any);
          setCurrentScreen('chat');
        } else {
          setCurrentScreen('available-doctors');
        }
      }} onCancel={() => setCurrentScreen('home')} onBrowseDoctors={(reqId) => { setConsultRequestId(reqId); setCurrentScreen('available-doctors'); }} />;
      case 'available-doctors': return <AvailableDoctorsScreen specialty={searchedSpecialty} description={symptomData.description} requestId={consultRequestId ?? undefined} walletBalance={walletBalance} onRecharge={handleRecharge} onSelectDoctor={async (doctor, callType) => {
        // Fetch the actual fee stored in the consultation_request
        const { data: reqRow } = await supabase.from('consultation_requests')
          .select('fee').eq('doctor_id', doctor.firebase_uid).eq('status', 'accepted').order('created_at', { ascending: false }).limit(1).single();
        setChatFee(Number(reqRow?.fee) || 0);
        const chatDoctor = {
          id: doctor.firebase_uid ?? doctor.id,
          name: doctor.full_name ?? doctor.name,
          specialization: doctor.specialization,
          avatar: doctor.selfie_url ?? doctor.avatar ?? '',
          rating: 4.8,
          experience: `${doctor.experience_years ?? 0} years`,
          verified: true, fee: 0,
          availability: 'Available now',
          firebase_uid: doctor.firebase_uid,
          full_name: doctor.full_name,
          selfie_url: doctor.selfie_url,
        };
        setCurrentDoctor(chatDoctor as any);
        setCurrentScreen('chat');
      }} onBack={() => setCurrentScreen(consultMode === 'available' ? 'symptoms' : 'matching')} />;
      case 'chat': return currentDoctor ? <ChatScreen doctor={currentDoctor} sessionData={chatSessionData ?? undefined} consultationId={consultRequestId ?? undefined} consultationFee={chatFee} bonusMinutes={bonusMinutesForChat} onEndSession={(rxId?: string) => { if (rxId) setChatRxId(rxId); setCurrentScreen('prescription'); }} onBack={() => setCurrentScreen('home')} onDownloadPrescription={() => {}} /> : null;
      case 'prescription': return <PrescriptionScreen rxId={chatRxId} prescription={currentPrescription ?? null as any} walletBalance={walletBalance} onRecharge={handleRecharge} onConsultAgain={() => setCurrentScreen('symptoms')} onBookSameDoctor={() => setCurrentScreen('symptoms')} onGoHome={() => setCurrentScreen('home')} onOrderMedicines={() => setCurrentScreen('pharmacy-selection')} onSelectDoctor={async (doctor, callType) => {
        // Clear old session data so ChatScreen starts fresh
        setChatSessionData(null);
        setConsultRequestId(null);
        setChatFee(0);

        const chatDoctor = {
          id: doctor.firebase_uid ?? doctor.id,
          name: doctor.full_name ?? doctor.name,
          specialization: doctor.specialization,
          avatar: doctor.selfie_url ?? '',
          rating: 4.8,
          experience: `${doctor.experience_years ?? 0} years`,
          verified: true, fee: 0, availability: 'Available now',
          firebase_uid: doctor.firebase_uid, full_name: doctor.full_name, selfie_url: doctor.selfie_url,
        };
        setCurrentDoctor(chatDoctor as any);
        setSearchedSpecialty(doctor.specialization ?? '');

        // Fetch fee for this doctor
        const { data: priceRow } = await supabase.from('doctor_pricing')
          .select('chat_price').eq('doctor_id', doctor.firebase_uid ?? doctor.id).maybeSingle();
        const fee = Number(priceRow?.chat_price) || 299;
        setChatFee(fee);

        // Create a fresh consultation_request — doctor will get notified and accept
        const { getCurrentUser } = await import('@/services/auth');
        const u = getCurrentUser();
        if (!u) return;
        const { data: userRow } = await supabase.from('users').select('name').eq('id', u.uid).maybeSingle();
        const patientName = userRow?.name || u.email || 'Patient';

        const { data: req } = await supabase.from('consultation_requests').insert({
          patient_id: u.uid,
          patient_name: patientName,
          specialty: doctor.specialization ?? '',
          status: 'searching',
          doctor_id: doctor.firebase_uid ?? doctor.id,
          call_type: callType,
          fee,
          consult_mode: 'available',
        }).select('id').single();

        if (req?.id) {
          setConsultRequestId(req.id);
        }
        // Navigate to chat — ChatScreen will find/wait for the new session doctor creates
        setCurrentScreen('chat');
      }} />;

      // Other main screens
      case 'records': return <RecordsScreen onBack={() => setCurrentScreen('home')} onViewPrescription={() => setCurrentScreen('prescription')} />;
      case 'user-profile': return <UserProfileScreen user={user} onBack={() => setCurrentScreen('home')} onEditProfile={() => setCurrentScreen('profile')} onLogout={async () => { const { logout } = await import('@/services/auth'); await logout(); localStorage.removeItem('mc_screen'); localStorage.removeItem('mc_user'); localStorage.removeItem('mc_wallet'); setCurrentScreen('welcome'); }} onDoctorRegister={() => setCurrentScreen('doctor-welcome')} />;
      case 'user-notifications': return <UserNotificationsScreen onBack={() => setCurrentScreen('home')} />;
      case 'payment': return <PaymentScreen consultationFee={299} onPaymentComplete={() => setCurrentScreen('symptoms')} onBack={() => setCurrentScreen('home')} />;
      case 'pharmacy-selection': return <PharmacySelectionScreen prescription={currentPrescription!} onSendToPharmacy={() => setCurrentScreen('order-confirmation')} onBack={() => setCurrentScreen('prescription')} />;
      case 'order-confirmation': return <OrderConfirmationScreen prescription={currentPrescription!} deliveryAddress="123, Green Valley Apartments, Sector 21, Gurugram, Haryana - 122001" onConfirm={() => setCurrentScreen('order-processing')} onCancel={() => setCurrentScreen('pharmacy-selection')} />;
      case 'order-processing': return <OrderProcessingScreen onProceedToPayment={() => setCurrentScreen('price-payment')} onContactSupport={() => {}} />;
      case 'price-payment': return <PricePaymentScreen medicines={currentPrescription?.medicines ?? []} onPaymentComplete={() => setCurrentScreen('order-tracking')} onBack={() => setCurrentScreen('order-processing')} />;
      case 'order-tracking': return <OrderTrackingScreen orderId="#MOM2024001234" onContactPharmacy={() => {}} onContactSupport={() => {}} onOrderDelivered={() => setCurrentScreen('order-completion')} />;
      case 'order-completion': return <OrderCompletionScreen orderId="#MOM2024001234" onRateExperience={() => {}} onConsultAgain={() => setCurrentScreen('symptoms')} onGoHome={() => setCurrentScreen('home')} />;

      // Bookings
      case 'bookings': return <BookingsScreen appointments={appointments} onViewDetails={(apt) => { setSelectedAppointment(apt); setCurrentScreen('appointment-confirmation'); }} onBack={() => setCurrentScreen('home')} />;

      // Book a Doctor Flow
      case 'consultation-type': return <ConsultationTypeScreen onSelect={(type) => { setConsultationType(type); setCurrentScreen('select-specialty'); }} onBack={() => setCurrentScreen('home')} />;
      case 'select-specialty': return <SelectSpecialtyScreen onSelect={(specialty) => { setSelectedSpecialty(specialty); setCurrentScreen('symptom-description'); }} onBack={() => setCurrentScreen('consultation-type')} />;
      case 'symptom-description': return <SymptomDescriptionScreen specialty={selectedSpecialty} onSubmit={(data) => { setSymptomData({ description: data.description, symptoms: data.symptoms, reportUrl: data.reportUrl }); setCurrentScreen(consultationType === 'hospital' ? 'select-hospital' : 'home-visit-availability'); }} onBack={() => setCurrentScreen('select-specialty')} />;

      // Hospital Flow
      case 'select-hospital': return <SelectHospitalScreen walletBalance={walletBalance} onRecharge={handleRecharge} onSelect={(doctor) => { setSelectedHospital(doctor as any); setSelectedDoctorWithFee(doctor as any); setCurrentScreen('select-time-slot'); }} onBack={() => setCurrentScreen('symptom-description')} />;
      case 'select-doctor': return <SelectDoctorScreen hospital={selectedHospital!} onSelect={(doctor) => { setSelectedDoctorWithFee(doctor); setCurrentScreen('select-time-slot'); }} onBack={() => setCurrentScreen('select-hospital')} />;
      case 'select-time-slot': return <SelectTimeSlotScreen doctor={(selectedDoctorWithFee as any) ?? (selectedHospital as any)} onSelect={(date, slot) => { setSelectedDate(date); setSelectedTimeSlot(slot); setCurrentScreen('appointment-summary'); }} onBack={() => setCurrentScreen('select-hospital')} />;
      case 'appointment-summary': return <AppointmentSummaryScreen doctor={selectedDoctorWithFee ?? (selectedHospital as any)} hospital={selectedHospital!} date={selectedDate} timeSlot={selectedTimeSlot} walletBalance={walletBalance} onRecharge={handleRecharge} onConfirm={async (paymentMethod) => {
        const { getCurrentUser } = await import('@/services/auth');
        const u = getCurrentUser();
        const opdDoc = selectedHospital as any;
        const fee = (selectedDoctorWithFee as any)?.fee ?? (opdDoc as any)?.consult_fee ?? 300;

        // Get patient name from Supabase (same source BookingsScreen uses)
        let patientName = user?.name ?? 'Patient';
        let patientPhone = user?.phone ?? null;
        if (u) {
          const { data: dbUser } = await supabase.from('users').select('name, phone').eq('id', u.uid).maybeSingle();
          if (dbUser?.name) patientName = dbUser.name;
          if (dbUser?.phone) patientPhone = dbUser.phone;
        }

        // Deduct wallet only for online payment
        if (paymentMethod === 'online') {
          await deductWallet(fee);
        }

        await supabase.from('opd_appointments').insert({
          doctor_id: opdDoc?.firebase_uid ?? opdDoc?.id ?? '',
          patient_name: patientName,
          patient_phone: patientPhone,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          time_slot: selectedTimeSlot,
          fee,
          payment_method: paymentMethod ?? 'online',
          payment_status: paymentMethod === 'online' ? 'paid' : 'pending',
          status: 'pending',
          symptoms: symptomData.symptoms,
          description: symptomData.description,
          report_url: symptomData.reportUrl ?? null,
        });
        const newApt: Appointment = {
          id: Date.now().toString(),
          doctor: selectedDoctorWithFee ?? (selectedHospital as any),
          hospital: selectedHospital!,
          type: 'hospital',
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          fee,
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
      case 'prescriptions-list': return <PrescriptionsListScreen prescriptions={currentPrescription ? [currentPrescription] : []} onViewPrescription={() => setCurrentScreen('prescription')} onBack={() => setCurrentScreen('home')} />;
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
