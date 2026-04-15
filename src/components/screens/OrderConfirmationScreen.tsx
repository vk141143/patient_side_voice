import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Clock, Package, CheckCircle } from 'lucide-react';
import { Prescription } from '@/types/app';

interface OrderConfirmationScreenProps {
  prescription: Prescription;
  deliveryAddress: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OrderConfirmationScreen({ 
  prescription, 
  deliveryAddress, 
  onConfirm, 
  onCancel 
}: OrderConfirmationScreenProps) {
  const estimatedDelivery = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-border bg-card">
        <button 
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Confirm Order</h1>
      </div>

      <div className="flex-1 px-5 py-6">
        {/* Order Summary */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Order Summary</h2>
              <p className="text-sm text-muted-foreground">{prescription.medicines.length} medicines</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            {prescription.medicines.map((med, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.dosage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pharmacy */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">M</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Pharmacy</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">MOM Pharmacy</p>
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="text-sm font-medium text-foreground mt-1">{deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Estimated Delivery */}
        <div className="bg-success/10 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm text-success font-medium">Expected Delivery</p>
              <p className="text-sm text-success/80">
                Today by {estimatedDelivery.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-5 pb-8 pt-4 bg-card border-t border-border space-y-3">
        <Button 
          variant="hero" 
          size="xl" 
          className="w-full"
          onClick={onConfirm}
        >
          <CheckCircle className="w-5 h-5" />
          Confirm Order
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
