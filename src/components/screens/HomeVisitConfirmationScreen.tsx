import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, Banknote, BadgeCheck } from 'lucide-react';
import { Doctor } from '@/types/app';
import { format } from 'date-fns';
import { useState } from 'react';
import doctorFemale from '@/assets/doctor-female.jpg';

interface HomeVisitConfirmationScreenProps {
  address: string;
  date: Date;
  timeSlot: string;
  onConfirm: (paymentMethod: 'online' | 'after-visit') => void;
  onBack: () => void;
}

const assignedDoctor: Doctor = {
  id: '1',
  name: 'Dr. Priya Sharma',
  specialization: 'General Physician',
  rating: 4.9,
  experience: '12 years',
  avatar: doctorFemale,
  verified: true,
};

export function HomeVisitConfirmationScreen({ 
  address, 
  date, 
  timeSlot, 
  onConfirm, 
  onBack 
}: HomeVisitConfirmationScreenProps) {
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'after-visit'>('online');

  const visitFee = 1000;
  const serviceFee = 50;
  const total = visitFee + serviceFee;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Confirm Home Visit</h1>
        <p className="text-muted-foreground mt-1">Review your booking details</p>
      </div>

      <div className="flex-1 px-5 space-y-4 overflow-y-auto pb-4">
        {/* Assigned Doctor */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-2">Assigned Doctor</p>
          <div className="flex items-center gap-3">
            <img 
              src={assignedDoctor.avatar} 
              alt={assignedDoctor.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{assignedDoctor.name}</h3>
                {assignedDoctor.verified && <BadgeCheck className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">{assignedDoctor.specialization}</p>
              <p className="text-xs text-muted-foreground">{assignedDoctor.experience} experience</p>
            </div>
          </div>
        </div>

        {/* Visit Details */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Visit Address</p>
              <p className="font-medium text-foreground">{address}</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">{format(date, 'd MMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time Slot</p>
                <p className="font-medium text-foreground text-sm">{timeSlot}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-3">Fee Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Doctor Visit Fee</span>
              <span className="text-foreground">₹{visitFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="text-foreground">₹{serviceFee}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-primary text-lg">₹{total}</span>
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
              onClick={() => setPaymentMethod('after-visit')}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                paymentMethod === 'after-visit'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'after-visit' ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {paymentMethod === 'after-visit' && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
              <Banknote className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Pay After Visit</p>
                <p className="text-xs text-muted-foreground">Cash or UPI to doctor</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        <Button
          variant="default"
          size="xl"
          className="w-full"
          onClick={() => onConfirm(paymentMethod)}
        >
          Confirm Home Visit • ₹{total}
        </Button>
      </div>
    </div>
  );
}
