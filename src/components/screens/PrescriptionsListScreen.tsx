import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Download, Calendar, Pill } from 'lucide-react';
import { Prescription } from '@/types/app';
import doctorFemale from '@/assets/doctor-female.jpg';
import doctorMale from '@/assets/doctor-male.jpg';

interface PrescriptionsListScreenProps {
  prescriptions: Prescription[];
  onViewPrescription: (prescription: Prescription) => void;
  onBack: () => void;
}

export function PrescriptionsListScreen({ prescriptions, onViewPrescription, onBack }: PrescriptionsListScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
        <p className="text-muted-foreground mt-1">All your digital prescriptions</p>
      </div>

      {/* Prescriptions List */}
      <div className="flex-1 px-5 space-y-3 overflow-y-auto pb-8">
        {prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground">No Prescriptions Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your prescriptions will appear here after consultations
            </p>
          </div>
        ) : (
          prescriptions.map((prescription, index) => (
            <div
              key={prescription.id}
              className="bg-card rounded-2xl p-4 border border-border"
            >
              <div className="flex items-start gap-3">
                <img
                  src={index % 2 === 0 ? doctorFemale : doctorMale}
                  alt={prescription.doctor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{prescription.doctor.name}</h3>
                  <p className="text-sm text-muted-foreground">{prescription.diagnosis}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {new Date(prescription.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Pill className="w-3 h-3" />
                      <span className="text-xs">{prescription.medicines.length} medicines</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {}}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => onViewPrescription(prescription)}
                >
                  View
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
