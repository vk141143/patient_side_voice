import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, MessageSquare, Calendar } from 'lucide-react';
import { Consultation } from '@/types/app';
import doctorFemale from '@/assets/doctor-female.jpg';
import doctorMale from '@/assets/doctor-male.jpg';

interface ConsultAgainScreenProps {
  consultations: Consultation[];
  onConsultAgain: (consultation: Consultation) => void;
  onBack: () => void;
}

export function ConsultAgainScreen({ consultations, onConsultAgain, onBack }: ConsultAgainScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Consult Again</h1>
        <p className="text-muted-foreground mt-1">Chat with your previous doctors</p>
      </div>

      {/* Consultations List */}
      <div className="flex-1 px-5 space-y-3 overflow-y-auto pb-8">
        {consultations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground">No Previous Consultations</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your consultation history will appear here
            </p>
          </div>
        ) : (
          consultations.map((consultation, index) => (
            <div
              key={consultation.id}
              className="bg-card rounded-2xl p-4 border border-border"
            >
              <div className="flex items-start gap-3">
                <img
                  src={index % 2 === 0 ? doctorFemale : doctorMale}
                  alt={consultation.doctor.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{consultation.doctor.name}</h3>
                  <p className="text-sm text-muted-foreground">{consultation.doctor.specialization}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-success fill-success" />
                      <span className="text-xs text-foreground">{consultation.doctor.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {new Date(consultation.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 px-2 py-1 bg-secondary rounded-full w-fit">
                    <span className="text-xs text-muted-foreground">{consultation.issue}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => onConsultAgain(consultation)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat Again
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
