import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Loader2, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';
import { format, isToday, isFuture, isPast } from 'date-fns';

interface BookingsScreenProps {
  appointments?: any[];
  onViewDetails: (appointment: any) => void;
  onBack: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'bg-yellow-500/10 text-yellow-600' },
  confirmed: { label: 'Confirmed', color: 'bg-primary/10 text-primary' },
  attended:  { label: 'Attended',  color: 'bg-green-500/10 text-green-600' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive' },
};

export function BookingsScreen({ onViewDetails, onBack }: BookingsScreenProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }

    const fetchAppointments = async () => {
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', user.uid)
        .maybeSingle();

      console.log('BookingsScreen: uid=', user.uid, 'userRow=', userRow, 'userErr=', userErr);

      if (!userRow?.name && !userRow?.phone) {
        console.log('BookingsScreen: no name/phone found, showing empty');
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Query by patient_name (primary) — this is what gets saved during booking
      const { data: apts, error } = await supabase
        .from('opd_appointments')
        .select('*')
        .eq('patient_name', userRow.name)
        .order('appointment_date', { ascending: true })
        .order('time_slot', { ascending: true });

      console.log('BookingsScreen: patient_name=', userRow.name, 'apts=', apts, 'error=', error);

      if (error) console.error('BookingsScreen fetch error:', error);

      if (!apts?.length) {
        // Try by phone as fallback
        if (userRow?.phone) {
          const { data: aptsByPhone, error: phoneErr } = await supabase
            .from('opd_appointments')
            .select('*')
            .eq('patient_phone', userRow.phone)
            .order('appointment_date', { ascending: true });
          console.log('BookingsScreen: fallback by phone=', userRow.phone, 'apts=', aptsByPhone, 'err=', phoneErr);
          if (aptsByPhone?.length) {
            const doctorIds = [...new Set(aptsByPhone.map((a: any) => a.doctor_id))];
            const { data: doctors } = await supabase
              .from('doctors')
              .select('firebase_uid, full_name, specialization, hospital_name, clinic_address, selfie_url, city')
              .in('firebase_uid', doctorIds);
            const doctorMap: Record<string, any> = {};
            doctors?.forEach((d: any) => { doctorMap[d.firebase_uid] = d; });
            setAppointments(aptsByPhone.map((a: any) => ({ ...a, doctor: doctorMap[a.doctor_id] ?? null })));
            setLoading(false);
            return;
          }
        }
        setAppointments([]);
        setLoading(false);
        return;
      }

      const doctorIds = [...new Set(apts.map((a: any) => a.doctor_id))];
      const { data: doctors } = await supabase
        .from('doctors')
        .select('firebase_uid, full_name, specialization, hospital_name, clinic_address, selfie_url, city')
        .in('firebase_uid', doctorIds);

      const doctorMap: Record<string, any> = {};
      doctors?.forEach((d: any) => { doctorMap[d.firebase_uid] = d; });

      setAppointments(apts.map((a: any) => ({ ...a, doctor: doctorMap[a.doctor_id] ?? null })));
      setLoading(false);
    };

    fetchAppointments();

    // Realtime updates
    const sub = supabase
      .channel('bookings_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'opd_appointments' },
        () => fetchAppointments()
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const upcoming = appointments.filter(a =>
    a.status !== 'cancelled' && a.status !== 'attended' &&
    (isToday(new Date(a.appointment_date)) || isFuture(new Date(a.appointment_date)))
  );
  const past = appointments.filter(a =>
    a.status === 'attended' || a.status === 'cancelled' ||
    isPast(new Date(a.appointment_date))
  );

  const AppointmentCard = ({ apt }: { apt: any }) => {
    const doc = apt.doctor;
    const status = statusConfig[apt.status] ?? statusConfig.pending;
    const doctorName = doc?.full_name ?? 'Doctor';
    const hospitalName = doc?.hospital_name ?? 'Hospital Visit';

    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm cursor-pointer"
        onClick={() => onViewDetails(apt)}>
        <div className="flex items-start gap-3">
          {doc?.selfie_url ? (
            <img src={doc.selfie_url} alt={doctorName}
              className="w-14 h-14 rounded-xl object-cover border border-border flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">{doctorName.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-foreground truncate">Dr. {doctorName}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{doc?.specialization ?? '—'}</p>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(apt.appointment_date), 'EEE, d MMM, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {apt.time_slot}
              </div>
            </div>

            <div className="flex items-center gap-1 mt-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-muted-foreground truncate">
                {hospitalName}{doc?.city ? `, ${doc.city}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">₹{apt.fee}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              apt.payment_method === 'hospital'
                ? 'bg-orange-500/10 text-orange-500'
                : 'bg-blue-500/10 text-blue-500'
            }`}>
              {apt.payment_method === 'hospital' ? 'Pay at Hospital' : 'Pay Online'}
            </span>
          </div>
          <Button size="sm" variant="outline">View Details</Button>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">My Bookings</h1>
        </div>
      </div>
      <div className="flex items-center justify-center flex-1">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">My Bookings</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming</h2>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
            </div>
          ) : (
            <div className="bg-secondary/30 rounded-2xl p-6 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming bookings</p>
              <p className="text-sm text-muted-foreground mt-1">Book a doctor to get started</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Past Bookings</h2>
          {past.length > 0 ? (
            <div className="space-y-3">
              {past.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
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
