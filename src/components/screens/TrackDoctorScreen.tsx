import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, MapPin, Phone, MessageSquare, User, Home } from 'lucide-react';
import { Doctor } from '@/types/app';
import { useEffect, useState } from 'react';
import doctorFemale from '@/assets/doctor-female.jpg';

interface TrackDoctorScreenProps {
  onComplete: () => void;
  onContactDoctor: () => void;
  onGoHome: () => void;
}

const steps = [
  { id: 1, title: 'Doctor Assigned', description: 'Dr. Priya Sharma has been assigned', icon: User },
  { id: 2, title: 'Doctor on the way', description: 'Doctor is heading to your location', icon: MapPin },
  { id: 3, title: 'Doctor Arrived', description: 'Doctor has reached your location', icon: Home },
  { id: 4, title: 'Visit Completed', description: 'Consultation completed successfully', icon: CheckCircle2 },
];

const assignedDoctor: Doctor = {
  id: '1',
  name: 'Dr. Priya Sharma',
  specialization: 'General Physician',
  rating: 4.9,
  experience: '12 years',
  avatar: doctorFemale,
  verified: true,
};

export function TrackDoctorScreen({ onComplete, onContactDoctor, onGoHome }: TrackDoctorScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [eta, setEta] = useState(45);

  useEffect(() => {
    // Simulate progress
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
      setEta((prev) => Math.max(0, prev - 15));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const isCompleted = currentStep === 4;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-8">
        <h1 className="text-2xl font-bold text-primary-foreground">Track Doctor</h1>
        <p className="text-primary-foreground/80 mt-1">
          {isCompleted ? 'Visit completed!' : 'Doctor is on the way'}
        </p>
        
        {!isCompleted && eta > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-2 w-fit">
            <Clock className="w-4 h-4 text-primary-foreground" />
            <span className="text-primary-foreground font-medium">ETA: {eta} mins</span>
          </div>
        )}
      </div>

      <div className="flex-1 px-5 -mt-4 space-y-4 pb-4">
        {/* Doctor Card */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <img 
              src={assignedDoctor.avatar} 
              alt={assignedDoctor.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{assignedDoctor.name}</h3>
              <p className="text-sm text-muted-foreground">{assignedDoctor.specialization}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onContactDoctor}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
              >
                <Phone className="w-5 h-5 text-primary-foreground" />
              </button>
              <button
                onClick={onContactDoctor}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
              >
                <MessageSquare className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Visit Status</h3>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = step.id < currentStep;
              const isFuture = step.id > currentStep;
              
              return (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isPast ? 'bg-success' : isActive ? 'bg-primary animate-pulse' : 'bg-secondary'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isPast || isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`} />
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 h-10 ${
                        isPast ? 'bg-success' : 'bg-border'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`font-medium ${
                      isFuture ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      {step.title}
                    </p>
                    <p className={`text-sm ${
                      isFuture ? 'text-muted-foreground/50' : 'text-muted-foreground'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note */}
        {!isCompleted && (
          <div className="bg-accent/10 rounded-2xl p-4">
            <p className="text-sm text-muted-foreground">
              📞 The doctor will call you 15 minutes before arriving. Please keep your phone accessible.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        {isCompleted ? (
          <Button
            variant="default"
            size="xl"
            className="w-full"
            onClick={onComplete}
          >
            View Prescription
          </Button>
        ) : (
          <Button
            variant="outline"
            size="xl"
            className="w-full"
            onClick={onGoHome}
          >
            Back to Home
          </Button>
        )}
      </div>
    </div>
  );
}
