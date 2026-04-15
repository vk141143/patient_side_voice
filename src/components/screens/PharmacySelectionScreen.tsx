import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Shield, Truck, Edit2, CheckCircle } from 'lucide-react';
import { Prescription } from '@/types/app';

interface PharmacySelectionScreenProps {
  prescription: Prescription;
  onSendToPharmacy: () => void;
  onBack: () => void;
}

export function PharmacySelectionScreen({ prescription, onSendToPharmacy, onBack }: PharmacySelectionScreenProps) {
  const [address, setAddress] = useState('123, Green Valley Apartments, Sector 21, Gurugram, Haryana - 122001');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-card">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Order Medicines</h1>
      </div>

      <div className="flex-1 px-5 py-6">
        {/* Pharmacy Partner Card */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">M</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">MOM Pharmacy</h2>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-success/10 rounded-full">
                  <CheckCircle className="w-3 h-3 text-success" />
                  <span className="text-xs font-medium text-success">Verified</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Trusted Pharmacy Partner</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-border">
            <div className="text-center">
              <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Fast Delivery</p>
            </div>
            <div className="text-center">
              <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Licensed</p>
            </div>
            <div className="text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">24/7 Support</p>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Delivery Address
            </h3>
            <button className="flex items-center gap-1 text-primary text-sm font-medium">
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{address}</p>
        </div>

        {/* Medicines Summary */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-4">
          <h3 className="font-semibold text-foreground mb-3">Prescription Summary</h3>
          <div className="space-y-2">
            {prescription.medicines.map((med, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="font-medium text-foreground text-sm">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.dosage} • {med.duration}</p>
                </div>
                {med.type && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    med.type === 'generic' ? 'bg-success/10 text-success' :
                    med.type === 'antibiotic' ? 'bg-destructive/10 text-destructive' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {med.type}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            ⚠️ This platform only connects you to the pharmacy. Medicine pricing and delivery are handled by MOM Pharmacy. 
            We do not sell medicines directly.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-4 bg-card border-t border-border">
        <Button 
          variant="hero" 
          size="xl" 
          className="w-full"
          onClick={onSendToPharmacy}
        >
          <Truck className="w-5 h-5" />
          Send Prescription to MOM Pharmacy
        </Button>
      </div>
    </div>
  );
}
