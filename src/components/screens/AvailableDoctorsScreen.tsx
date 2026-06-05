import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Star, MessageSquare, Video, Wallet, AlertCircle, Loader2, X, Clock, ShieldCheck, Mic, MicOff, Volume2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';
import { WalletRechargeModal } from '@/components/WalletRechargeModal';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// ── voice helpers ──────────────────────────────────────────────────
function ttsSpeak(text: string, onDone?: () => void) {
  if (!('speechSynthesis' in window)) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const doSpeak = () => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-IN'; utt.rate = 0.92; utt.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const pick = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en')) || null;
    if (pick) utt.voice = pick;
    utt.onend = () => onDone?.();
    utt.onerror = () => onDone?.();
    window.speechSynthesis.speak(utt);
  };
  if (window.speechSynthesis.getVoices().length > 0) doSpeak();
  else { const h = () => { window.speechSynthesis.removeEventListener('voiceschanged', h); doSpeak(); }; window.speechSynthesis.addEventListener('voiceschanged', h); }
}

function detectChoice(text: string, count: number): number {
  const t = text.toLowerCase();
  const maps = [
    ['first', '1st', 'one', 'number one'],
    ['second', '2nd', 'two', 'number two'],
    ['third', '3rd', 'three', 'number three'],
  ];
  for (let i = 0; i < Math.min(count, maps.length); i++) {
    if (maps[i].some(k => t.includes(k))) return i;
  }
  return -1;
}

function detectCallType(text: string): 'chat' | 'video' | null {
  const t = text.toLowerCase();
  if (/\bvideo\b/.test(t)) return 'video';
  if (/\bchat\b/.test(t)) return 'chat';
  return null;
}

// ─────────────────────────────────────────────────────────────────

interface AvailableDoctorsScreenProps {
  specialty: string;
  description?: string;
  requestId?: string;
  walletBalance: number;
  onRecharge: (amount: number) => void;
  onSelectDoctor: (doctor: any, callType: 'chat' | 'video', requestId?: string) => void;
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

  // voice state
  const [voiceActive, setVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceHint, setVoiceHint] = useState('');

  const pendingDocRef = useRef<any>(null);
  const voiceStepRef = useRef<'choose_doctor' | 'choose_type'>('choose_doctor');
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTRef = useRef('');
  // keep latest values accessible in callbacks without stale closures
  const doctorPricingRef = useRef<Record<string, { chat: number; video: number }>>({});
  const defaultChatRef = useRef(299);
  const defaultVideoRef = useRef(499);
  const doctorsRef = useRef<any[]>([]);

  const { transcript, resetTranscript } = useSpeechRecognition();

  // sync refs
  useEffect(() => { doctorPricingRef.current = doctorPricing; }, [doctorPricing]);
  useEffect(() => { defaultChatRef.current = defaultChatPrice; }, [defaultChatPrice]);
  useEffect(() => { defaultVideoRef.current = defaultVideoPrice; }, [defaultVideoPrice]);
  useEffect(() => { doctorsRef.current = doctors; }, [doctors]);

  // cleanup on unmount
  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    SpeechRecognition.stopListening();
  }, []);

  const getDoctorChatPrice = (uid: string) => doctorPricing[uid]?.chat ?? defaultChatPrice;
  const getDoctorVideoPrice = (uid: string) => doctorPricing[uid]?.video ?? defaultVideoPrice;

  // ── load doctors ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: adminPrices } = await supabase.from('admin_pricing').select('key, value')
        .in('key', ['available_chat_price', 'available_video_price']);
      let defChat = 299, defVideo = 499;
      adminPrices?.forEach(row => {
        if (row.key === 'available_chat_price') defChat = Number(row.value) || 299;
        if (row.key === 'available_video_price') defVideo = Number(row.value) || 499;
      });
      setDefaultChatPrice(defChat); defaultChatRef.current = defChat;
      setDefaultVideoPrice(defVideo); defaultVideoRef.current = defVideo;

      const { data, error } = await supabase.from('doctors')
        .select('firebase_uid, full_name, specialization, experience_years, selfie_url, chat_enabled, is_online, service_chat, service_opd, status');
      if (error) { setLoading(false); return; }

      const approved = (data ?? []).filter(d => d.status === 'approved');
      const specLower = specialty.toLowerCase().trim();
      const matched = specLower
        ? approved.filter(d => d.specialization?.toLowerCase().trim() === specLower)
        : approved;
      setDoctors(matched); doctorsRef.current = matched;
      setLoading(false);

      let pricing: Record<string, { chat: number; video: number }> = {};
      if (matched.length > 0) {
        const ids = matched.map(d => d.firebase_uid);
        const { data: pricingRows } = await supabase.from('doctor_pricing')
          .select('doctor_id, chat_price, video_price').in('doctor_id', ids);
        pricingRows?.forEach(p => { pricing[p.doctor_id] = { chat: p.chat_price, video: p.video_price }; });
        setDoctorPricing(pricing); doctorPricingRef.current = pricing;
      }

      // auto-announce via TTS after load
      if (matched.length === 0) return;
      const lines = matched.slice(0, 3).map((d, i) => {
        const chat = pricing[d.firebase_uid]?.chat ?? defChat;
        const vid = pricing[d.firebase_uid]?.video ?? defVideo;
        return `${['First', 'Second', 'Third'][i]}: Doctor ${d.full_name}, ${d.experience_years} years experience. Chat rupees ${chat}, Video rupees ${vid}.`;
      });
      const speech = `I found ${matched.length} doctor${matched.length > 1 ? 's' : ''}. ${lines.join(' ')} Say first, second${matched.length > 2 ? ', or third' : ''} to choose, then say chat or video.`;
      setIsSpeaking(true);
      setVoiceHint(`Say "first", "second"${matched.length > 2 ? ', "third"' : ''} to choose a doctor`);
      ttsSpeak(speech, () => {
        setIsSpeaking(false);
        startListening('choose_doctor');
      });
    };
    load();

    const ch = supabase.channel('pricing_available_doctors')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_pricing' }, (payload) => {
        const row = payload.new as any;
        if (row.key === 'available_chat_price') { setDefaultChatPrice(Number(row.value) || 299); defaultChatRef.current = Number(row.value) || 299; }
        if (row.key === 'available_video_price') { setDefaultVideoPrice(Number(row.value) || 499); defaultVideoRef.current = Number(row.value) || 499; }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [specialty]);

  // ── voice: silence detection ────────────────────────────────────
  useEffect(() => {
    if (!voiceActive) return;
    if (transcript === lastTRef.current) return;
    lastTRef.current = transcript;
    if (silenceRef.current) clearTimeout(silenceRef.current);
    if (transcript.trim().length < 2) return;
    silenceRef.current = setTimeout(() => processVoice(transcript.trim()), 1800);
  }, [transcript, voiceActive]);

  const startListening = (step: 'choose_doctor' | 'choose_type') => {
    voiceStepRef.current = step;
    resetTranscript(); lastTRef.current = '';
    setVoiceActive(true);
    SpeechRecognition.startListening({ continuous: true, language: 'en-IN', interimResults: true });
  };

  const stopListening = () => {
    setVoiceActive(false);
    SpeechRecognition.stopListening();
    if (silenceRef.current) clearTimeout(silenceRef.current);
  };

  const processVoice = (text: string) => {
    stopListening();
    window.speechSynthesis.cancel();

    if (voiceStepRef.current === 'choose_doctor') {
      const docs = doctorsRef.current;
      const idx = detectChoice(text, docs.length);
      if (idx >= 0) {
        const doc = docs[idx];
        pendingDocRef.current = doc;
        const chat = doctorPricingRef.current[doc.firebase_uid]?.chat ?? defaultChatRef.current;
        const vid = doctorPricingRef.current[doc.firebase_uid]?.video ?? defaultVideoRef.current;
        const msg = `You selected Doctor ${doc.full_name}, ${doc.experience_years} years experience. Chat costs rupees ${chat}, video call costs rupees ${vid}. Say chat or video to proceed.`;
        setVoiceHint('Say "chat" or "video"');
        setIsSpeaking(true);
        ttsSpeak(msg, () => { setIsSpeaking(false); startListening('choose_type'); });
      } else {
        setIsSpeaking(true);
        ttsSpeak(`Sorry, I didn't catch that. Please say first${doctorsRef.current.length > 1 ? ', second' : ''}${doctorsRef.current.length > 2 ? ', or third' : ''} to choose a doctor.`, () => {
          setIsSpeaking(false);
          startListening('choose_doctor');
        });
      }
      return;
    }

    if (voiceStepRef.current === 'choose_type') {
      const ct = detectCallType(text);
      if (ct && pendingDocRef.current) {
        handleRequest(pendingDocRef.current, ct);
      } else {
        setIsSpeaking(true);
        ttsSpeak('Please say chat or video.', () => { setIsSpeaking(false); startListening('choose_type'); });
      }
    }
  };

  // ── request doctor ──────────────────────────────────────────────
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
        patient_id: user.uid, patient_name: patientName, specialty,
        description: description ?? null, status: 'searching',
        doctor_id: doctor.firebase_uid, call_type: callType, fee,
      }).select('id').single();
      reqId = data?.id ?? null;
    } else {
      await supabase.from('consultation_requests')
        .update({ status: 'searching', doctor_id: doctor.firebase_uid, call_type: callType, fee })
        .eq('id', reqId);
    }
    if (!reqId) { setRequestingDoctor(null); return; }
    setWaitingRequestId(reqId);

    let count = 30; setWaitCountdown(30);
    const timer = setInterval(() => {
      count--; setWaitCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        supabase.from('consultation_requests').update({ status: 'timeout' }).eq('id', reqId!);
        setRequestingDoctor(null); setWaitingRequestId(null); setRejectedDoctor(doctor.firebase_uid);
      }
    }, 1000);

    const poll = setInterval(async () => {
      const { data: updated } = await supabase.from('consultation_requests').select('status').eq('id', reqId!).single();
      if (updated?.status === 'accepted') { clearInterval(timer); clearInterval(poll); setRequestingDoctor(null); onSelectDoctor(doctor, callType, reqId!); }
      else if (updated?.status === 'rejected') { clearInterval(timer); clearInterval(poll); setRequestingDoctor(null); setWaitingRequestId(null); setRejectedDoctor(doctor.firebase_uid); }
    }, 2000);

    const sub = supabase.channel(`avail_req_${reqId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'consultation_requests' }, (payload) => {
        const updated = payload.new as any;
        if (updated.id !== reqId) return;
        clearInterval(timer); clearInterval(poll);
        if (updated.status === 'accepted') { setRequestingDoctor(null); onSelectDoctor(doctor, callType, reqId!); }
        else if (updated.status === 'rejected') { setRequestingDoctor(null); setWaitingRequestId(null); setRejectedDoctor(doctor.firebase_uid); }
        supabase.removeChannel(sub);
      }).subscribe();
  };

  const handleCancelRequest = async () => {
    if (waitingRequestId) await supabase.from('consultation_requests').update({ status: 'cancelled' }).eq('id', waitingRequestId);
    setRequestingDoctor(null); setWaitingRequestId(null);
  };

  // ── render ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* header */}
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

      {/* voice status bar */}
      {(isSpeaking || voiceActive) && (
        <div className="flex items-center gap-2 mx-4 mt-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
          {isSpeaking
            ? <><Volume2 className="w-4 h-4 text-primary animate-pulse flex-shrink-0" /><span className="text-xs text-primary font-medium">Speaking…</span></>
            : <><Mic className="w-4 h-4 text-primary animate-pulse flex-shrink-0" /><span className="text-xs text-primary font-medium">Listening — {voiceHint}</span></>
          }
          <button onClick={() => { stopListening(); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
            className="ml-auto text-xs text-muted-foreground hover:text-destructive">Stop</button>
        </div>
      )}

      {/* live transcript */}
      {voiceActive && transcript && (
        <div className="mx-4 mt-2 bg-secondary rounded-xl px-4 py-2">
          <p className="text-xs text-muted-foreground">{transcript}</p>
        </div>
      )}

      {/* doctor list */}
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
        ) : doctors.map((doctor, idx) => {
          const isRequesting = requestingDoctor === doctor.firebase_uid;
          const isRejected = rejected === doctor.firebase_uid;
          return (
            <div key={doctor.firebase_uid} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  {doctor.selfie_url
                    ? <img src={doctor.selfie_url} alt={doctor.full_name} className="w-20 h-20 rounded-xl object-cover" />
                    : <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-2xl font-bold text-primary">{doctor.full_name?.charAt(0)}</span></div>
                  }
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
                  {/* voice number badge */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">{idx + 1}</span>
                  </div>
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
