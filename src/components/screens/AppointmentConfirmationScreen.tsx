import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MapPin, Calendar, Clock, Navigation, X, CalendarPlus, Phone, AlertTriangle } from 'lucide-react';
import { Doctor, Hospital } from '@/types/app';
import { format } from 'date-fns';

interface AppointmentConfirmationScreenProps {
  bookingId: string;
  doctor: Doctor | null;
  hospital: Hospital | null;
  date: Date;
  timeSlot: string;
  onAddToCalendar: () => void;
  onGetDirections: () => void;
  onContactHospital: () => void;
  onCancel: () => void;
  onGoHome: () => void;
}

export function AppointmentConfirmationScreen({
  bookingId,
  doctor,
  hospital,
  date,
  timeSlot,
  onAddToCalendar,
  onGetDirections,
  onContactHospital,
  onCancel,
  onGoHome,
}: AppointmentConfirmationScreenProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  const doctorName = doctor?.name || 'Doctor';
  const doctorSpecialization = doctor?.specialization || 'Specialist';
  const hospitalName = hospital?.name || 'Hospital';
  const hospitalAddress = hospital?.address || 'Address not available';

  const handleDirections = () => {
    const query = encodeURIComponent(`${hospitalName} ${hospitalAddress}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleAddToCalendar = () => {
    setCalendarAdded(true);
    onAddToCalendar();
  };

  const handleCancelConfirmed = () => {
    setShowCancelConfirm(false);
    onCancel();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Success Header */}
      <div className="gradient-primary px-5 pt-16 pb-10 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">Appointment Booked!</h1>
        <p className="text-primary-foreground/80 mt-2">Booking ID: {bookingId}</p>
      </div>

      <div className="flex-1 px-5 -mt-4 space-y-4 pb-4 overflow-y-auto">
        {/* Appointment Details Card */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          {/* Doctor Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{doctorName.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{doctorName}</h3>
              <p className="text-sm text-muted-foreground">{doctorSpecialization}</p>
            </div>
          </div>

          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{hospitalName}</p>
                <p className="text-sm text-muted-foreground">{hospitalAddress}</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{format(date, 'd MMM yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium text-foreground">{timeSlot}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-border grid grid-cols-3 gap-2">
            <button
              onClick={handleAddToCalendar}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${calendarAdded ? 'bg-primary/10' : 'bg-secondary hover:bg-secondary/80'}`}
            >
              <CalendarPlus className={`w-5 h-5 ${calendarAdded ? 'text-primary' : 'text-primary'}`} />
              <span className="text-xs text-foreground">{calendarAdded ? 'Added ✓' : 'Add to Calendar'}</span>
            </button>
            <button
              onClick={handleDirections}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Navigation className="w-5 h-5 text-primary" />
              <span className="text-xs text-foreground">Directions</span>
            </button>
            <button
              onClick={onContactHospital}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Phone className="w-5 h-5 text-primary" />
              <span className="text-xs text-foreground">Contact</span>
            </button>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-accent/10 rounded-2xl p-4">
          <h4 className="font-medium text-foreground mb-2">📋 Things to remember</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Arrive 15 minutes before your appointment</li>
            <li>• Carry any previous medical records</li>
            <li>• Bring a valid ID proof</li>
          </ul>
        </div>

        {/* Cancel Option */}
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="w-full p-4 rounded-2xl border border-destructive/50 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/5 transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="font-medium">Cancel Appointment</span>
        </button>
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        <Button variant="default" size="xl" className="w-full" onClick={onGoHome}>
          Back to Home
        </Button>
      </div>

      {/* Cancel Confirm Popup */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative w-full max-w-sm bg-background rounded-2xl p-6 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground text-center mb-2">Cancel Appointment?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              Are you sure you want to cancel this appointment with <span className="font-semibold text-foreground">{doctorName}</span> at {hospitalName}?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
                No, Keep it
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={handleCancelConfirmed}
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
