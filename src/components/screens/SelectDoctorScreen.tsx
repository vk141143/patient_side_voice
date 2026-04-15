import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, BadgeCheck, Clock, MapPin } from 'lucide-react';
import { Doctor, Hospital } from '@/types/app';
import doctorMale from '@/assets/doctor-male.jpg';
import doctorFemale from '@/assets/doctor-female.jpg';

interface SelectDoctorScreenProps {
  hospital: Hospital;
  onSelect: (doctor: Doctor & { fee: number }) => void;
  onBack: () => void;
}

// Each clinic has exactly one doctor
const clinicDoctorMap: Record<string, typeof allDoctors[0]> = {};

const allDoctors = [
  { id: '1', hospitalId: '1', name: 'Dr. Priya Sharma',  specialization: 'General Physician', rating: 4.9, experience: '12 years', avatar: doctorFemale, verified: true, fee: 300, slots: ['10:00 AM', '11:30 AM', '2:00 PM'] },
  { id: '2', hospitalId: '2', name: 'Dr. Amit Patel',    specialization: 'General Physician', rating: 4.8, experience: '8 years',  avatar: doctorMale,   verified: true, fee: 500, slots: ['9:30 AM', '12:00 PM', '4:00 PM'] },
  { id: '3', hospitalId: '3', name: 'Dr. Sneha Gupta',   specialization: 'General Physician', rating: 4.7, experience: '6 years',  avatar: doctorFemale, verified: true, fee: 400, slots: ['10:30 AM', '3:00 PM', '5:30 PM'] },
  { id: '4', hospitalId: '4', name: 'Dr. Rahul Verma',   specialization: 'General Physician', rating: 4.9, experience: '15 years', avatar: doctorMale,   verified: true, fee: 600, slots: ['11:00 AM', '1:00 PM', '5:00 PM'] },
];

export function SelectDoctorScreen({ hospital, onSelect, onBack }: SelectDoctorScreenProps) {
  const doctor = allDoctors.find(d => d.hospitalId === hospital.id) ?? allDoctors[0];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Clinic Doctor</h1>
        <div className="flex items-center gap-1 mt-1 text-muted-foreground text-sm">
          <MapPin className="w-3.5 h-3.5" />
          <span>{hospital.name}</span>
        </div>
      </div>

      {/* Single Doctor Card */}
      <div className="flex-1 px-5 pb-4">
        <div className="p-5 rounded-2xl border-2 border-primary bg-primary/5">
          <div className="flex gap-4 mb-4">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-base">{doctor.name}</h3>
                {doctor.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{doctor.specialization}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                  <span className="text-sm font-semibold text-foreground">{doctor.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">{doctor.experience} exp</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-foreground">₹{doctor.fee}</span>
              <p className="text-xs text-muted-foreground">OPD Fee</p>
            </div>
          </div>

          {/* Available Slots */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Available slots today</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {doctor.slots.map((slot, i) => (
                <span key={i} className="px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-foreground">
                  {slot}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        <Button
          variant="default"
          size="xl"
          className="w-full"
          onClick={() => onSelect({ ...doctor })}
        >
          Book Appointment
        </Button>
      </div>
    </div>
  );
}