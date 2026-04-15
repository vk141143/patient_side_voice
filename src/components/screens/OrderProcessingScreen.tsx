import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Package, Truck, Home, MessageSquare } from 'lucide-react';

interface OrderProcessingScreenProps {
  onProceedToPayment: () => void;
  onContactSupport: () => void;
}

const steps = [
  { id: 'sent', label: 'Prescription Sent', icon: CheckCircle },
  { id: 'reviewing', label: 'Pharmacy Reviewing', icon: Clock },
  { id: 'confirmed', label: 'Order Confirmed', icon: Package },
  { id: 'delivery', label: 'Out for Delivery', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
];

export function OrderProcessingScreen({ onProceedToPayment, onContactSupport }: OrderProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Simulate order processing
    const timers = [
      setTimeout(() => setCurrentStep(1), 2000),
      setTimeout(() => setCurrentStep(2), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-foreground/20 mx-auto mb-4 flex items-center justify-center">
          {currentStep < 2 ? (
            <div className="w-10 h-10 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <CheckCircle className="w-10 h-10 text-primary-foreground" />
          )}
        </div>
        <h1 className="text-xl font-bold text-primary-foreground mb-2">
          {currentStep < 2 ? 'Processing Your Order' : 'Order Confirmed!'}
        </h1>
        <p className="text-primary-foreground/80 text-sm">
          {currentStep < 2 
            ? 'MOM Pharmacy is reviewing your prescription' 
            : 'Your medicines are being prepared'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex-1 px-5 py-6 -mt-4">
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border/50">
          <h2 className="font-semibold text-foreground mb-4">Order Status</h2>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;

              return (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isComplete ? 'bg-success' :
                      isCurrent ? 'bg-primary animate-pulse' :
                      'bg-muted'
                    }`}>
                      <step.icon className={`w-5 h-5 ${
                        isComplete || isCurrent ? 'text-white' : 'text-muted-foreground'
                      }`} />
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 h-8 ${
                        isComplete ? 'bg-success' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className={`font-medium ${
                      isComplete || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-primary mt-1">In progress...</p>
                    )}
                    {isComplete && (
                      <p className="text-xs text-success mt-1">Completed</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order ID */}
        <div className="bg-muted/50 rounded-xl p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Order ID</span>
            <span className="font-mono text-sm font-semibold text-foreground">#MOM2024001234</span>
          </div>
        </div>

        {/* Contact Support */}
        <button 
          onClick={onContactSupport}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-primary font-medium"
        >
          <MessageSquare className="w-5 h-5" />
          Contact MOM Pharmacy
        </button>
      </div>

      {/* CTA */}
      {currentStep >= 2 && (
        <div className="px-5 pb-8 pt-4 bg-card border-t border-border">
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full"
            onClick={onProceedToPayment}
          >
            Proceed to Payment
          </Button>
        </div>
      )}
    </div>
  );
}
