import { Button } from '@/components/ui/button';
import { Bell, Wallet, Clock, Users, Star, MessageSquare, Heart, ChevronRight, CalendarCheck, Gift, HelpCircle } from 'lucide-react';
import { UserProfile, Consultation } from '@/types/app';
import doctorFemale from '@/assets/doctor-female.jpg';
import doctorMale from '@/assets/doctor-male.jpg';
import { useState } from 'react';
import { WalletRechargeModal } from '@/components/WalletRechargeModal';

interface HomeScreenProps {
  user: UserProfile;
  consultations: Consultation[];
  walletBalance: number;
  onRecharge: (amount: number) => void;
  onConsultNow: () => void;
  onBookDoctor: () => void;
  onProfile: () => void;
  onNotifications: () => void;
  onConsultAgain: (consultation: Consultation) => void;
  onBookAppointment: () => void;
  onReferEarn: () => void;
  onHelpCentre: () => void;
  onRecords: () => void;
}

export function HomeScreen({
  user, consultations, walletBalance, onRecharge,
  onConsultNow, onBookDoctor, onProfile, onNotifications, onConsultAgain,
  onBookAppointment, onReferEarn, onHelpCentre, onRecords,
}: HomeScreenProps) {
  const [showWallet, setShowWallet] = useState(false);
  const quickActions = [
    { icon: CalendarCheck, label: 'Book Appointment', color: 'text-primary',     action: onBookAppointment },
    { icon: Gift,          label: 'Refer & Earn',     color: 'text-accent',      action: onReferEarn },
    { icon: HelpCircle,    label: 'Help Centre',      color: 'text-success',     action: onHelpCentre },
    { icon: Heart,         label: 'Records',          color: 'text-destructive', action: onRecords },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/80 text-sm">Welcome back</p>
            <h1 className="text-2xl font-bold text-primary-foreground">
              Hi, {user.name?.split(' ')[0] || 'there'} 👋
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onNotifications}
              className="w-11 h-11 rounded-full bg-primary-foreground/10 backdrop-blur flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-primary-foreground" />
            </button>
            <button
              onClick={() => setShowWallet(true)}
              className="w-11 h-11 rounded-full bg-primary-foreground/10 backdrop-blur flex items-center justify-center relative"
            >
              <Wallet className="w-5 h-5 text-primary-foreground" />
              {walletBalance > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  ₹{walletBalance}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur rounded-full px-4 py-2.5">
          <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-primary-foreground/90">All doctors are verified by medical councils</span>
        </div>
      </div>

      {/* Main CTAs */}
      <div className="px-5 -mt-4 space-y-3">
        <Button 
          variant="accent" 
          size="xl" 
          className="w-full shadow-lg"
          onClick={onConsultNow}
        >
          <MessageSquare className="w-5 h-5" />
          Consult a Doctor Now
        </Button>
        <Button 
          variant="heroSecondary" 
          size="lg" 
          className="w-full"
          onClick={onBookDoctor}
        >
          <Clock className="w-5 h-5" />
          Book a Doctor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-5 mt-6">
        <div className="stat-card">
          <Clock className="w-6 h-6 text-primary mb-2" />
          <span className="text-lg font-bold text-foreground">45s</span>
          <span className="text-xs text-muted-foreground">Avg. wait</span>
        </div>
        <div className="stat-card">
          <Users className="w-6 h-6 text-success mb-2" />
          <span className="text-lg font-bold text-foreground">500+</span>
          <span className="text-xs text-muted-foreground">Doctors</span>
        </div>
        <div className="stat-card">
          <Star className="w-6 h-6 text-accent mb-2" />
          <span className="text-lg font-bold text-foreground">4.8</span>
          <span className="text-xs text-muted-foreground">Rating</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 px-5">
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
          {quickActions.map((action, index) => (
            <button key={index} className="quick-action-card" onClick={action.action}>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <span className="text-xs font-medium text-foreground text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Consultations */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Recent Consultations</h2>
          <button className="text-sm text-primary font-medium">View all</button>
        </div>
        <div className="space-y-3">
          {consultations.slice(0, 2).map((consultation, index) => (
            <div 
              key={consultation.id}
              className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={index === 0 ? doctorFemale : doctorMale}
                  alt={consultation.doctor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{consultation.doctor.name}</h3>
                  <p className="text-sm text-muted-foreground">{consultation.issue}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(consultation.date).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onConsultAgain(consultation)}
                >
                  Chat again
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Modal */}
      {showWallet && (
        <WalletRechargeModal
          currentBalance={walletBalance}
          onRecharge={(amt) => { onRecharge(amt); }}
          onClose={() => setShowWallet(false)}
        />
      )}
    </div>
  );
}
