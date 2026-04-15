import { Button } from '@/components/ui/button';
import { Download, MessageSquare, Calendar, FileText, CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Prescription, Doctor } from '@/types/app';
import doctorFemale from '@/assets/doctor-female.jpg';

interface PrescriptionScreenProps {
  prescription: Prescription;
  onConsultAgain: () => void;
  onBookSameDoctor: () => void;
  onGoHome: () => void;
  onOrderMedicines: () => void;
}

export function PrescriptionScreen({ 
  prescription, 
  onConsultAgain, 
  onBookSameDoctor, 
  onGoHome,
  onOrderMedicines
}: PrescriptionScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-8">
        <button 
          onClick={onGoHome}
          className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-4"
        >
          <ArrowLeft className="w-5 h-5 text-primary-foreground" />
        </button>

        <div className="flex items-center gap-4">
          <img 
            src={doctorFemale}
            alt={prescription.doctor.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-foreground/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-primary-foreground">{prescription.doctor.name}</h2>
              <CheckCircle className="w-5 h-5 text-primary-foreground/80" />
            </div>
            <p className="text-primary-foreground/80 text-sm">{prescription.doctor.specialization}</p>
            <p className="text-primary-foreground/60 text-xs mt-1">
              {new Date(prescription.date).toLocaleDateString('en-IN', { 
                weekday: 'short',
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 -mt-4">
        {/* Consultation Summary */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 mb-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Consultation Summary
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Diagnosis</p>
              <p className="text-foreground font-medium">{prescription.diagnosis}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Advice</p>
              <ul className="space-y-1">
                {prescription.advice.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-success mt-1">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 mb-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            💊 Medicines Prescribed
          </h3>
          <div className="space-y-4">
            {prescription.medicines.map((med, i) => (
              <div key={i} className="p-4 bg-secondary/50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{med.name}</h4>
                  <div className="flex gap-1">
                    {med.type && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        med.type === 'generic' ? 'bg-success/10 text-success' :
                        med.type === 'antibiotic' ? 'bg-destructive/10 text-destructive' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {med.type}
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {med.duration}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{med.dosage}</p>
                <p className="text-xs text-muted-foreground mt-1">⏰ {med.timing}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Primary CTA - Order Medicines */}
        {/* <Button 
          variant="hero" 
          size="xl" 
          className="w-full mb-4"
          onClick={onOrderMedicines}
        >
          <ShoppingBag className="w-5 h-5" />
          Order Medicines
        </Button> */}

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button variant="outline" size="lg" className="w-full">
            <Download className="w-5 h-5" />
            Download PDF
          </Button>
          <Button variant="outline" size="lg" className="w-full">
            <FileText className="w-5 h-5" />
            Save to Records
          </Button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            variant="heroSecondary" 
            size="lg" 
            className="w-full"
            onClick={onConsultAgain}
          >
            <MessageSquare className="w-5 h-5" />
            Consult Again
          </Button>
          {/* <Button 
            variant="outline" 
            size="lg" 
            className="w-full"
            onClick={onBookSameDoctor}
          >
            <Calendar className="w-5 h-5" />
            Book Same Doctor
          </Button> */}
        </div>
      </div>
    </div>
  );
}
