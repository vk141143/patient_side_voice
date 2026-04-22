import { Button } from '@/components/ui/button';
import { Bell, Wallet, Clock, MessageSquare, Heart, ChevronRight, CalendarCheck, Gift, HelpCircle, Hospital } from 'lucide-react';
import { UserProfile } from '@/types/app';
import { useState, useEffect } from 'react';
import { WalletRechargeModal } from '@/components/WalletRechargeModal';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';

// ── Real consultations fetched from DB ────────────────────────────
function RecentConsultations({ onConsultAgain }: { onConsultAgain: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setLoading(false); return; }

    const load = async () => {
      // Fetch last 2 instant chat sessions
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id, doctor_name, specialty, started_at, ended_at, status')
        .eq('patient_id', user.uid)
        .order('started_at', { ascending: false })
        .limit(2);

      // Fetch last 2 OPD appointments
      const { data: opd } = await supabase
        .from('opd_appointments')
        .select('id, appointment_date, time_slot, status, doctors:doctor_id(full_name, specialization, selfie_url)')
        .eq('patient_name', user.displayName ?? user.email ?? '')
        .order('appointment_date', { ascending: false })
        .limit(2);

      const chatItems = (sessions ?? []).map(s => ({
        id: s.id,
        type: 'chat',
        doctorName: s.doctor_name ?? 'Doctor',
        specialty: s.specialty ?? '',
        date: s.started_at,
        duration: s.started_at && s.ended_at
          ? `${Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)} min`
          : null,
        status: s.status,
      }));

      const opdItems = (opd ?? []).map(o => ({
        id: o.id,
        type: 'opd',
        doctorName: (o.doctors as any)?.full_name ?? 'Doctor',
        specialty: (o.doctors as any)?.specialization ?? '',
        date: o.appointment_date,
        duration: o.time_slot,
        status: o.status,
      }));

      // Merge and sort by date, take top 2
      const all = [...chatItems, ...opdItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 2);

      setItems(all);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="h-20 flex items-center justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (items.length === 0) return (
    <div className="text-center py-6 text-muted-foreground text-sm">
      <p>No consultations yet. Start your first consultation!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.type === 'chat' ? 'bg-primary/10' : 'bg-emerald-100'
            }`}>
              {item.type === 'chat'
                ? <MessageSquare className="w-5 h-5 text-primary" />
                : <Hospital className="w-5 h-5 text-emerald-600" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">Dr. {item.doctorName}</h3>
              <p className="text-xs text-muted-foreground">{item.specialty}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                {item.duration && (
                  <><span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{item.duration}
                  </span></>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  item.status === 'ended' || item.status === 'completed' || item.status === 'attended'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>{item.type === 'chat' ? 'Chat' : 'OPD'}</span>
              </div>
            </div>
            <button onClick={onConsultAgain}
              className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors flex-shrink-0">
              Again <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface HomeScreenProps {
  user: UserProfile;
  walletBalance: number;
  onRecharge: (amount: number) => void;
  onConsultNow: () => void;
  onBookDoctor: () => void;
  onProfile: () => void;
  onNotifications: () => void;
  onConsultAgain: () => void;
  onBookAppointment: () => void;
  onReferEarn: () => void;
  onHelpCentre: () => void;
  onRecords: () => void;
}

export function HomeScreen({
  user, walletBalance, onRecharge,
  onConsultNow, onBookDoctor, onProfile, onNotifications,
  onBookAppointment, onReferEarn, onHelpCentre, onRecords,
}: HomeScreenProps) {
  const [showWallet, setShowWallet] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const firebaseUser = getCurrentUser();
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    const fetchUnread = () => {
      const stored = localStorage.getItem(`notif_read_${uid}`);
      const readIds: string[] = stored ? JSON.parse(stored) : [];
      supabase
        .from('admin_notifications')
        .select('id')
        .or(`target_id.eq.${uid},target_type.eq.all_users`)
        .then(({ data }) => {
          const all = (data ?? []).map(r => r.id);
          setUnreadCount(all.filter(id => !readIds.includes(id)).length);
        });
    };

    fetchUnread();

    const sub = supabase
      .channel(`home_notif_${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        () => fetchUnread()
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);
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
              className="relative p-2 rounded-full bg-primary-foreground/10 backdrop-blur"
            >
              <Bell className="w-5 h-5 text-primary-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
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
          <button className="text-sm text-primary font-medium" onClick={onRecords}>View all</button>
        </div>
        <RecentConsultations onConsultAgain={onConsultNow} />
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
