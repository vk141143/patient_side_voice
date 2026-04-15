import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, MapPin, User, Check, X, Loader2 } from 'lucide-react';
import { Appointment, ConsultationType } from '@/types/app';
import doctorFemale from '@/assets/doctor-female.jpg';
import doctorMale from '@/assets/doctor-male.jpg';

interface BookingsScreenProps {
  appointments: Appointment[];
  onViewDetails: (appointment: Appointment) => void;
  onBack: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Loader2 },
  confirmed: { label: 'Confirmed', color: 'bg-primary/10 text-primary', icon: Check },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: X },
};

export function BookingsScreen({ appointments, onViewDetails, onBack }: BookingsScreenProps) {
  const upcomingAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const pastAppointments = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const AppointmentCard = ({ appointment, index }: { appointment: Appointment; index: number }) => {
    const status = statusConfig[appointment.status];
    const StatusIcon = status.icon;
    
    return (
      <div 
        className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm"
        onClick={() => onViewDetails(appointment)}
      >
        <div className="flex items-start gap-3">
          <img 
            src={index % 2 === 0 ? doctorFemale : doctorMale}
            alt={appointment.doctor.name}
            className="w-14 h-14 rounded-xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-foreground truncate">{appointment.doctor.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                <StatusIcon className={`w-3 h-3 ${appointment.status === 'pending' ? 'animate-spin' : ''}`} />
                {status.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{appointment.doctor.specialization}</p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(appointment.date)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {appointment.timeSlot}
              </div>
            </div>
            
            <div className="flex items-center gap-1 mt-1.5 text-xs">
              {appointment.type === 'hospital' ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">{appointment.hospital?.name || 'Hospital Visit'}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-success" />
                  <span className="text-muted-foreground">Home Visit</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <span className="text-sm font-semibold text-foreground">₹{appointment.fee}</span>
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">My Bookings</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-6">
        {/* Upcoming Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming</h2>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt, index) => (
                <AppointmentCard key={apt.id} appointment={apt} index={index} />
              ))}
            </div>
          ) : (
            <div className="bg-secondary/30 rounded-2xl p-6 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming bookings</p>
              <p className="text-sm text-muted-foreground mt-1">Book a doctor to get started</p>
            </div>
          )}
        </div>

        {/* Past Bookings Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Past Bookings</h2>
          {pastAppointments.length > 0 ? (
            <div className="space-y-3">
              {pastAppointments.map((apt, index) => (
                <AppointmentCard key={apt.id} appointment={apt} index={index} />
              ))}
            </div>
          ) : (
            <div className="bg-secondary/30 rounded-2xl p-6 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No past bookings yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
