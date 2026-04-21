import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, BadgeCheck, AlertCircle, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { WalletRechargeModal } from '@/components/WalletRechargeModal';

interface AppointmentSummaryScreenProps {
  doctor: any;
  hospital: any;
  date: Date;
  timeSlot: string;
  walletBalance?: number;
  onRecharge?: (amount: number) => void;
  onConfirm: (paymentMethod?: 'online' | 'hospital') => void;
  onBack: () => void;
}

export function AppointmentSummaryScreen({ 
  doctor, 
  hospital, 
  date, 
  timeSlot,
  walletBalance = 0,
  onRecharge,
  onConfirm, 
  onBack 
}: AppointmentSummaryScreenProps) {
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'hospital'>('online');
  const [showWallet, setShowWallet] = useState(false);
  const fee = doctor?.fee ?? doctor?.consult_fee ?? 300;
  const insufficientBalance = paymentMethod === 'online' && walletBalance < fee;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Appointment Summary</h1>
        <p className="text-muted-foreground mt-1">Review and confirm your booking</p>
      </div>

      <div className="flex-1 px-5 space-y-4 overflow-y-auto pb-4">
        {/* Doctor Card */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">{(doctor?.name || doctor?.full_name || 'D').charAt(0)}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{doctor?.name || doctor?.full_name}</h3>
                {doctor?.verified && <BadgeCheck className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">{doctor?.specialization}</p>
            </div>
          </div>
        </div>

        {/* Hospital Card */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{hospital?.name || doctor?.hospital_name || '—'}</h3>
              <p className="text-sm text-muted-foreground">{hospital?.address || doctor?.clinic_address || ''}</p>
              {hospital?.distance && <p className="text-xs text-primary mt-1">{hospital.distance} away</p>}
            </div>
          </div>
        </div>

        {/* Date & Time Card */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold text-foreground">{format(date, 'EEE, d MMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-semibold text-foreground">{timeSlot}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-3">Fee Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Consultation Fee</span>
              <span className="text-foreground">₹{doctor?.fee ?? doctor?.consult_fee ?? 300}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking Fee</span>
              <span className="text-foreground">₹0</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-primary text-lg">₹{doctor?.fee ?? doctor?.consult_fee ?? 300}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-3">Payment Options</h3>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('online')}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                paymentMethod === 'online'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'online' ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {paymentMethod === 'online' && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Pay Online</p>
                <p className="text-xs text-muted-foreground">UPI, Card, Net Banking</p>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('hospital')}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                paymentMethod === 'hospital'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'hospital' ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {paymentMethod === 'hospital' && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Pay at Hospital</p>
                <p className="text-xs text-muted-foreground">Cash or card at reception</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 pb-8 space-y-3">
        {insufficientBalance && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">
                Insufficient balance. Need ₹{fee - walletBalance} more.
              </p>
            </div>
            <button onClick={() => setShowWallet(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
              <Wallet className="w-4 h-4" />
              Recharge Wallet
            </button>
          </div>
        )}
        <Button variant="default" size="xl" className="w-full"
          disabled={insufficientBalance}
          onClick={() => onConfirm(paymentMethod)}>
          Confirm Booking • ₹{fee}
        </Button>
      </div>

      {showWallet && onRecharge && (
        <WalletRechargeModal currentBalance={walletBalance} onRecharge={onRecharge} onClose={() => setShowWallet(false)} />
      )}
    </div>
  );
}
