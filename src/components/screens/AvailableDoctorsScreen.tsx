import { useState } from 'react';
import { ArrowLeft, Star, MessageSquare, ShieldCheck, Wallet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Doctor } from '@/types/app';
import doctorFemale from '@/assets/doctor-female.jpg';
import doctorMale from '@/assets/doctor-male.jpg';
import { WalletRechargeModal } from '@/components/WalletRechargeModal';

interface AvailableDoctorsScreenProps {
  specialty: string;
  doctors: Doctor[];
  walletBalance: number;
  onRecharge: (amount: number) => void;
  onSelectDoctor: (doctor: Doctor) => void;
  onBack: () => void;
}

export function AvailableDoctorsScreen({
  specialty,
  doctors,
  walletBalance,
  onRecharge,
  onSelectDoctor,
  onBack,
}: AvailableDoctorsScreenProps) {
  const [showWallet, setShowWallet] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Available Doctors</h1>
            <p className="text-sm text-muted-foreground">{doctors.length} {specialty} found</p>
          </div>
        </div>

        {/* Wallet balance chip */}
        <button
          onClick={() => setShowWallet(true)}
          className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5"
        >
          <Wallet className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">₹{walletBalance}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Specialty tag */}
        <div>
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {specialty}
          </span>
        </div>

        {/* Doctor cards */}
        {doctors.map((doctor) => {
          const fee = doctor.fee ?? 499;
          const canChat = walletBalance >= fee;
          const isFemale =
            doctor.name.toLowerCase().includes('sneha') ||
            doctor.name.toLowerCase().includes('priya') ||
            doctor.name.toLowerCase().includes('neha') ||
            doctor.name.toLowerCase().includes('anita') ||
            doctor.name.toLowerCase().includes('kavya');
          const avatar = doctor.avatar || (isFemale ? doctorFemale : doctorMale);
          const isAvailableNow = doctor.availability === 'Available now' || !doctor.availability;

          return (
            <div key={doctor.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex gap-4 mb-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img src={avatar} alt={doctor.name} className="w-20 h-20 rounded-xl object-cover" />
                  {doctor.verified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground">{doctor.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{doctor.specialization}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                    <span className="text-sm font-semibold text-foreground">{doctor.rating}</span>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">{doctor.experience} exp</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isAvailableNow ? 'bg-green-500' : 'bg-orange-400'}`} />
                      <span className={`text-xs font-medium ${isAvailableNow ? 'text-green-600' : 'text-orange-500'}`}>
                        {doctor.availability || 'Available now'}
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">₹{fee}</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              {canChat ? (
                <Button variant="hero" size="lg" className="w-full" onClick={() => onSelectDoctor(doctor)}>
                  <MessageSquare className="w-4 h-4" />
                  Start Chat
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive font-medium">
                      Insufficient balance. Need ₹{fee - walletBalance} more to chat.
                    </p>
                  </div>
                  <Button
                    variant="heroSecondary"
                    size="lg"
                    className="w-full"
                    onClick={() => setShowWallet(true)}
                  >
                    <Wallet className="w-4 h-4" />
                    Recharge Wallet
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            All doctors are verified by medical councils. Your consultation is 100% private and secure.
          </p>
        </div>
      </div>

      {/* Wallet Modal */}
      {showWallet && (
        <WalletRechargeModal
          currentBalance={walletBalance}
          onRecharge={onRecharge}
          onClose={() => setShowWallet(false)}
        />
      )}
    </div>
  );
}
