import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Phone, MessageSquare, Clock, Truck, CheckCircle } from 'lucide-react';

interface OrderTrackingScreenProps {
  orderId: string;
  onContactPharmacy: () => void;
  onContactSupport: () => void;
  onOrderDelivered: () => void;
}

export function OrderTrackingScreen({ 
  orderId, 
  onContactPharmacy, 
  onContactSupport,
  onOrderDelivered 
}: OrderTrackingScreenProps) {
  const [eta, setEta] = useState(45); // minutes
  const [status, setStatus] = useState<'preparing' | 'out-for-delivery' | 'nearby'>('preparing');

  useEffect(() => {
    // Simulate delivery progress
    const interval = setInterval(() => {
      setEta(prev => Math.max(0, prev - 1));
    }, 60000); // Update every minute

    // Simulate status changes
    const timer1 = setTimeout(() => setStatus('out-for-delivery'), 3000);
    const timer2 = setTimeout(() => setStatus('nearby'), 6000);
    const timer3 = setTimeout(() => onOrderDelivered(), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onOrderDelivered]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with Map placeholder */}
      <div className="h-48 bg-muted relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
            <p className="text-sm text-muted-foreground">Live tracking coming soon</p>
          </div>
        </div>
        
        {/* ETA Card */}
        <div className="absolute -bottom-8 left-5 right-5">
          <div className="bg-card rounded-2xl p-4 shadow-lg border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                <p className="text-2xl font-bold text-foreground">{eta} mins</p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                status === 'nearby' ? 'bg-success/10 text-success' :
                status === 'out-for-delivery' ? 'bg-primary/10 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {status === 'nearby' ? 'Nearby' :
                 status === 'out-for-delivery' ? 'On the way' : 'Preparing'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-14 pb-6">
        {/* Order ID */}
        <div className="bg-muted/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Order ID</span>
            <span className="font-mono text-sm font-semibold text-foreground">{orderId}</span>
          </div>
        </div>

        {/* Status Updates */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-4">
          <h2 className="font-semibold text-foreground mb-4">Delivery Status</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="w-0.5 h-6 bg-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">Order Confirmed</p>
                <p className="text-xs text-muted-foreground">Medicines are being prepared</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  status !== 'preparing' ? 'bg-success' : 'bg-primary animate-pulse'
                }`}>
                  {status !== 'preparing' ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Truck className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`w-0.5 h-6 ${status !== 'preparing' ? 'bg-success' : 'bg-muted'}`} />
              </div>
              <div>
                <p className={`font-medium ${status !== 'preparing' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Out for Delivery
                </p>
                <p className="text-xs text-muted-foreground">Your order is on the way</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Package className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Delivered</p>
                <p className="text-xs text-muted-foreground">Waiting for delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacy Contact */}
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">M</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">MOM Pharmacy</p>
              <p className="text-sm text-muted-foreground">Your delivery partner</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" onClick={onContactPharmacy}>
              <Phone className="w-4 h-4" />
              Call
            </Button>
            <Button variant="outline" size="sm" onClick={onContactSupport}>
              <MessageSquare className="w-4 h-4" />
              Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
