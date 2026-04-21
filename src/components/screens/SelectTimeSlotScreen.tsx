import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface OpdDoctor {
  id: string;
  firebase_uid: string;
  full_name: string;
  specialization: string;
  hospital_name: string;
  opd_start: string;
  opd_end: string;
  consult_duration: number;
}

interface SelectTimeSlotScreenProps {
  doctor: OpdDoctor;
  onSelect: (date: Date, timeSlot: string) => void;
  onBack: () => void;
}

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number);
  return { h, m };
}

function generateSlots(start: string, end: string, duration: number): string[] {
  const slots: string[] = [];
  const s = parseTime(start || '09:00');
  const e = parseTime(end || '18:00');
  let cur = s.h * 60 + s.m;
  const endMin = e.h * 60 + e.m;
  const dur = duration || 30;
  while (cur + dur <= endMin) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    slots.push(`${h12}:${m.toString().padStart(2, '0')} ${ampm}`);
    cur += dur;
  }
  return slots;
}

function groupSlots(slots: string[]) {
  const morning: string[] = [], afternoon: string[] = [], evening: string[] = [];
  slots.forEach(s => {
    const [time, ampm] = s.split(' ');
    const h = parseInt(time.split(':')[0]);
    const h24 = ampm === 'PM' && h !== 12 ? h + 12 : ampm === 'AM' && h === 12 ? 0 : h;
    if (h24 < 12) morning.push(s);
    else if (h24 < 17) afternoon.push(s);
    else evening.push(s);
  });
  return { morning, afternoon, evening };
}

export function SelectTimeSlotScreen({ doctor, onSelect, onBack }: SelectTimeSlotScreenProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const allSlots = generateSlots(doctor?.opd_start, doctor?.opd_end, doctor?.consult_duration);
  const grouped = groupSlots(allSlots);

  // Fetch booked slots for selected date, with realtime updates
  useEffect(() => {
    if (!doctor?.firebase_uid) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setLoading(true);
    setSelectedSlot(null);

    supabase
      .from('opd_appointments')
      .select('time_slot')
      .eq('doctor_id', doctor.firebase_uid)
      .eq('appointment_date', dateStr)
      .neq('status', 'cancelled')
      .then(({ data }) => {
        setBookedSlots(data?.map(r => r.time_slot) ?? []);
        setLoading(false);
      });

    // Realtime subscription
    const sub = supabase
      .channel(`opd_slots_${doctor.firebase_uid}_${dateStr}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'opd_appointments',
        filter: `doctor_id=eq.${doctor.firebase_uid}`,
      }, () => {
        supabase
          .from('opd_appointments')
          .select('time_slot')
          .eq('doctor_id', doctor.firebase_uid)
          .eq('appointment_date', dateStr)
          .neq('status', 'cancelled')
          .then(({ data }) => setBookedSlots(data?.map(r => r.time_slot) ?? []));
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [selectedDate, doctor?.firebase_uid]);

  // Guard: if doctor is null, go back
  if (!doctor) {
    onBack();
    return null;
  }

  const SlotGrid = ({ slots }: { slots: string[] }) => (
    <div className="grid grid-cols-3 gap-2">
      {slots.map(slot => {
        const booked = bookedSlots.includes(slot);
        const isSelected = selectedSlot === slot;
        return (
          <button
            key={slot}
            disabled={booked}
            onClick={() => setSelectedSlot(slot)}
            className={`py-3 rounded-xl text-sm font-medium transition-all ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : booked
                ? 'bg-muted text-muted-foreground line-through cursor-not-allowed opacity-50'
                : 'bg-card border border-border hover:border-primary text-foreground'
            }`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="px-5 pt-12 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Select Time Slot</h1>
        <p className="text-muted-foreground mt-1">Dr. {doctor.full_name} · {doctor.hospital_name}</p>
      </div>

      {/* Date picker */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date, i) => {
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            return (
              <button key={i} onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 w-16 py-3 rounded-2xl flex flex-col items-center transition-all ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:border-primary'
                }`}>
                <span className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {i === 0 ? 'Today' : format(date, 'EEE')}
                </span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
                <span className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {format(date, 'MMM')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-5 overflow-y-auto space-y-6 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : allSlots.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No slots configured for this doctor.</p>
        ) : (
          <>
            {grouped.morning.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">🌅 Morning</h4>
                <SlotGrid slots={grouped.morning} />
              </div>
            )}
            {grouped.afternoon.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">☀️ Afternoon</h4>
                <SlotGrid slots={grouped.afternoon} />
              </div>
            )}
            {grouped.evening.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">🌆 Evening</h4>
                <SlotGrid slots={grouped.evening} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-5 pb-8">
        <Button variant="default" size="xl" className="w-full" disabled={!selectedSlot}
          onClick={() => selectedSlot && onSelect(selectedDate, selectedSlot)}>
          Confirm Slot
        </Button>
      </div>
    </div>
  );
}
