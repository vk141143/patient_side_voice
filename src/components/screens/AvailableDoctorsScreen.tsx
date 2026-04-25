import { useState, useEffect } from 'react';
import { ArrowLeft, Star, MessageSquare, Video, Wallet, AlertCircle, Loader2, X, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';
import { WalletRechargeModal } from '@/components/WalletRechargeModal';

interface AvailableDoctorsScreenProps {
  specialty: string;
  description?: string;
  requestId?: string;
  walletBalance: number;
  onRecharge: (amount: number) => void;
  onSelectDoctor: (doctor: any, callType: 'chat' | 'video') => void;
  onBack: () => void;
}

export function AvailableDoctorsScreen({
  specialty, description, requestId: existingRequestId,
  walletBalance, onRecharge, onSelectDoctor, onBack,
}: AvailableDoctorsScreenProps) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWallet, setShowWallet] = useState(false);
  const [requestingDoctor, setRequestingDoctor] = useState<string | null>(null);
  const [requestingType, setRequestingType] = useState<'chat' | 'video'>('chat');
  const [waitingRequestId, setWaitingRequestId] = useState<string | null>(null);
  const [waitCountdown, setWaitCountdown] = useState(30);
  const [rejected, setRejectedDoctor] = useState<string | null>(null);
  const [defaultChatPrice, setDefaultChatPrice] = useState(299);
  const [defaultVideoPrice, setDefaultVideoPrice] = useState(499);
  const [doctorPricing, setDoctorPricing] = useState<Record<string, { chat: number; video: number }>>({});

  useEffect(() => {
    const load = async () => {
      // 1. Fetch admin default prices
      const { data: adminPrices } = await supabase.from('admin_pricing').select('key, value')
        .in('key', ['available_chat_price', 'available_video_price']);
      let defChat = 299, defVideo = 499;
      adminPrices?.forEach(row => {
        if (row.key === 'available_chat_price') defChat = Number(row.value) || 299;
        if (row.key === 'available_video_price') defVideo = Number(row.value) || 499;
      });
      setDefaultChatPrice(defChat);
      setDefaultVideoPrice(defVideo);

      // 2. Fetch all doctors — filter client-side to avoid PostgREST 400 on status column
      const { data, error } = await supabase.from('doctors')
        .select('firebase_uid, full_name, specialization, experience_years, selfie_url, chat_enabled, is_online, service_chat, service_opd, status');
      if (error) { console.error('[AvailableDoctors] fetch error:', error); setLoading(false); return; }

      const approved = (data ?? []).filter(d => d.status === 'approved');
      const specLower = specialty.toLowerCase().trim();
      const matched = specLower
        ? approved.filter(d => d.specialization?.toLowerCase().trim() === specLower)
        : approved;
      setDoctors(matched);
      setLoading(false);

      // 3. Fetch per-doctor pricing for matched doctors
      if (matched.length > 0) {
        const ids = matched.map(d => d.firebase_uid);
        const { data: pricingRows } = await supabase.from('doctor_pricing')
          .select('doctor_id, chat_price, video_price')
          .in('doctor_id', ids);
        const map: Record<string, { chat: number; video: number }> = {};
        pricingRows?.forEach(p => { map[p.doctor_id] = { chat: p.chat_price, video: p.video_price }; });
        setDoctorPricing(map);
      }
    };
    load();

    const pricingChannel = supabase.channel('pricing_available_doctors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_pricing' }, (payload) => {
        const row = payload.new as any;
        if (row.key === 'available_chat_price') setDefaultChatPrice(Number(row.value) || 299);
        if (row.key === 'available_video_price') setDefaultVideoPrice(Number(row.value) || 499);
      }).subscribe();

    return () => { supabase.removeChannel(pricingChannel); };
  }, [specialty]);

  const getDoctorChatPrice = (uid: string) => doctorPricing[uid]?.chat ?? defaultChatPrice;
  const getDoctorVideoPrice = (uid: string) => doctorPricing[uid]?.video ?? defaultVideoPrice;

  const handleRequest = async (doctor: any, callType: 'chat' | 'video') => {
    const user = getCurrentUser();
    if (!user) return;

    const fee = callType === 'chat' ? getDoctorChatPrice(doctor.firebase_uid) : getDoctorVideoPrice(doctor.firebase_uid);
    if (walletBalance < fee) { setShowWallet(true); return; }

    setRequestingDoctor(doctor.firebase_uid);
    setRequestingType(callType);
    setRejectedDoctor(null);

    const { data: userRow } = await supabase.from('users').select('name').eq('id', user.uid).maybeSingle();
    const patientName = userRow?.name || user.displayName || user.email || 'Patient';

    let reqId = existingRequestId ?? null;
    if (!reqId) {
      const { data } = await supabase.from('consultation_requests').insert({
        patient_id: user.uid,
        patient_name: patientName,
        specialty,
        description: description ?? null,
        status: 'searching',
        doctor_id: doctor.firebase_uid,
        call_type: callType,
        fee,
      }).select('id').single();
      reqId = data?.id ?? null;
    } else {
      await supabase.from('consultation_requests')
        .update({ status: 'searching', doctor_id: doctor.firebase_uid, call_type: callType, fee })
        .eq('id', reqId);
    }

    if (!reqId) { setRequestingDoctor(null); return; }
    setWaitingRequestId(reqId);

    let count = 30;
    setWaitCountdown(30);
    const timer = setInterval(() => {
      count--;
      setWaitCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        supabase.from('consultation_requests').update({ status: 'timeout' }).eq('id', reqId!);
        setRequestingDoctor(null);
        setWaitingRequestId(null);
        setRejectedDoctor(doctor.firebase_uid);
      }
    }, 1000);

    // Poll every 2s for acceptance (realtime filter unreliable without REPLICA IDENTITY FULL)
    const poll = setInterval(async () => {
      const { data: updated } = await supabase.from('consultation_requests')
        .select('status').eq('id', reqId!).single();
      if (updated?.status === 'accepted') {
        clearInterval(timer);
        clearInterval(poll);
        setRequestingDoctor(null);
        onSelectDoctor(doctor, callType);
      } else if (updated?.status === 'rejected') {
        clearInterval(timer);
        clearInterval(poll);
        setRequestingDoctor(null);
        setWaitingRequestId(null);
        setRejectedDoctor(doctor.firebase_uid);
      }
    }, 2000);

    // Realtime as bonus
    const sub = supabase.channel(`avail_req_${reqId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'consultation_requests' }, (payload) => {
        const updated = payload.new as any;
        if (updated.id !== reqId) return;
        clearInterval(timer); clearInterval(poll);
        if (updated.status === 'accepted') {
          setRequestingDoctor(null);
          onSelectDoctor(doctor, callType);
        } else if (updated.status === 'rejected') {
          setRequestingDoctor(null);
          setWaitingRequestId(null);
          setRejectedDoctor(doctor.firebase_uid);
        }
        supabase.removeChannel(sub);
      }).subscribe();
  };

  const handleCancelRequest = async () => {
    if (waitingRequestId) await supabase.from('consultation_requests').update({ status: 'cancelled' }).eq('id', waitingRequestId);
    setRequestingDoctor(null);
    setWaitingRequestId(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Available Doctors</h1>
            <p className="text-sm text-muted-foreground">{specialty} · {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowWallet(true)} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-primary">₹{walletBalance}</span>
        </button>
      </div>

      {/* Price info bar */}
      <div className="flex gap-3 px-4 py-3 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2 flex-1 bg-card rounded-xl px-3 py-2 border border-border">
          <MessageSquare className="w-4 h-4 text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground">Chat · 10 min</p>
            <p className="text-sm font-bold text-foreground">from ₹{defaultChatPrice}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 bg-card rounded-xl px-3 py-2 border border-border">
          <Video className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-[10px] text-muted-foreground">Video · 10 min</p>
            <p className="text-sm font-bold text-foreground">from ₹{defaultVideoPrice}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium text-foreground">No {specialty} doctors found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different specialty</p>
          </div>
        ) : doctors.map(doctor => {
          const isRequesting = requestingDoctor === doctor.firebase_uid;
          const isRejected = rejected === doctor.firebase_uid;

          return (
            <div key={doctor.firebase_uid} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              {/* Doctor info */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  {doctor.selfie_url
                    ? <img src={doctor.selfie_url} alt={doctor.full_name} className="w-20 h-20 rounded-xl object-cover" />
                    : <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-2xl font-bold text-primary">{doctor.full_name?.charAt(0)}</span></div>
                  }
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-base font-bold text-foreground">Dr. {doctor.full_name}</h3>
                    <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{doctor.specialization}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                    <span className="text-sm font-semibold text-foreground">4.8</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">{doctor.experience_years} yrs exp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${doctor.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className={`text-xs font-medium ${doctor.is_online ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {doctor.is_online ? 'Online now' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Chat · ₹{getDoctorChatPrice(doctor.firebase_uid)}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">Video · ₹{getDoctorVideoPrice(doctor.firebase_uid)}</span>
                  </div>
                </div>
              </div>

              {/* Action area */}
              {isRejected ? (
                <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2.5">
                  <X className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive font-medium">Doctor unavailable right now. Try another.</p>
                </div>
              ) : isRequesting ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Waiting for {requestingType === 'video' ? 'video call' : 'chat'} to be accepted...
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{waitCountdown}s remaining</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleCancelRequest} className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-1">
                    Cancel request
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* Chat button */}
                  {walletBalance >= getDoctorChatPrice(doctor.firebase_uid) ? (
                    <button onClick={() => handleRequest(doctor, 'chat')}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Chat · ₹{getDoctorChatPrice(doctor.firebase_uid)}
                    </button>
                  ) : (
                    <button onClick={() => setShowWallet(true)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-primary transition-colors">
                      <AlertCircle className="w-4 h-4" />
                      ₹{getDoctorChatPrice(doctor.firebase_uid)}
                    </button>
                  )}

                  {/* Video button */}
                  {walletBalance >= getDoctorVideoPrice(doctor.firebase_uid) ? (
                    <button onClick={() => handleRequest(doctor, 'video')}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-colors">
                      <Video className="w-4 h-4" />
                      Video · ₹{getDoctorVideoPrice(doctor.firebase_uid)}
                    </button>
                  ) : (
                    <button onClick={() => setShowWallet(true)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-blue-400 transition-colors">
                      <Video className="w-4 h-4" />
                      ₹{getDoctorVideoPrice(doctor.firebase_uid)}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">All doctors are verified · 100% private & secure</p>
      </div>

      {showWallet && <WalletRechargeModal currentBalance={walletBalance} onRecharge={onRecharge} onClose={() => setShowWallet(false)} />}
    </div>
  );
}
