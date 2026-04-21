import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Paperclip, Send, CheckCheck, X, FileText, Camera, FolderOpen, Clock, Wallet, Loader2, Pill, ChevronDown, ChevronUp, Video } from 'lucide-react';
import { Doctor, Prescription } from '@/types/app';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';
import { useApp } from '@/context/AppContext';
import { saveMessages, getMessages, getLastMessageTime, appendMessage, clearSession } from '@/lib/chatDB';

interface ChatScreenProps {
  doctor: Doctor;
  sessionId?: string;
  sessionData?: any;       // full chat_sessions row passed from MatchingScreen
  consultationId?: string;
  messages?: any[];
  onSendMessage?: (text: string) => void;
  onEndSession: (rxId?: string) => void;
  onBack: () => void;
  onDownloadPrescription?: () => void;
  currentPrescription?: Prescription | null;
  consultationFee?: number;
  bonusMinutes?: number;
}

const EXTEND_OPTIONS = [
  { label: '+2 minutes', seconds: 120, price: 20 },
  { label: '+5 minutes', seconds: 300, price: 49 },
  { label: '+10 minutes', seconds: 600, price: 79 },
];

// v2
export function ChatScreen({
  doctor, sessionId: propSessionId, sessionData, consultationId,
  onEndSession, onBack, onDownloadPrescription,
  consultationFee = 0, bonusMinutes = 0,
}: ChatScreenProps) {
  const { walletBalance, deductWallet } = useApp();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(propSessionId ?? sessionData?.id ?? null);
  const [sessionTime, setSessionTime] = useState(120 + bonusMinutes * 60);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [showTimerEnd, setShowTimerEnd] = useState(false);
  const [closeCountdown, setCloseCountdown] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [warningShown, setWarningShown] = useState(false);
  const [connecting, setConnecting] = useState(!propSessionId && !sessionData?.id);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [endedDoctorName, setEndedDoctorName] = useState('');
  const [timerPaused, setTimerPaused] = useState(false);
  const timerPausedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<any>(null);
  const sessionPollRef = useRef<any>(null);
  const sessionFindRef = useRef<any>(null);

  const user = getCurrentUser();
  const doctorName = (doctor as any).full_name ?? doctor.name;
  const doctorAvatar = (doctor as any).selfie_url ?? doctor.avatar;

  // Step 1: Find session by consultation_id if not provided
  useEffect(() => {
    if (propSessionId || sessionData?.id) {
      setSessionId(propSessionId ?? sessionData.id);
      setConnecting(false);
      return;
    }
    if (!consultationId) { setConnecting(false); return; }

    let retries = 0;
    const find = async () => {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('consultation_id', consultationId)
        .maybeSingle();
      if (data?.id) {
        clearTimeout(sessionFindRef.current);
        setSessionId(data.id);
        setConnecting(false);
      } else if (retries < 10) {
        retries++;
        sessionFindRef.current = setTimeout(find, 1000);
      } else {
        setConnecting(false);
      }
    };
    find();
    return () => { clearTimeout(sessionFindRef.current); };
  }, [consultationId, propSessionId, sessionData]);

  // Step 2: Load from IndexedDB instantly, then delta fetch from DB
  useEffect(() => {
    if (!sessionId) return;

    const init = async () => {
      // Load cached messages instantly
      const cached = await getMessages(sessionId);
      if (cached.length) setMessages(cached);

      // Delta fetch — only new messages since last cached
      const lastTime = await getLastMessageTime(sessionId);
      let query = supabase.from('instant_chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
      if (lastTime) query = query.gt('created_at', lastTime);
      const { data: newMsgs } = await query;
      if (newMsgs?.length) {
        await saveMessages(newMsgs);
        const all = await getMessages(sessionId);
        setMessages(all);
        // Apply timer state from any system messages in history
        const lastTimerMsg = [...newMsgs].reverse().find(
          m => m.type === 'system' && (m.content === '__timer_pause__' || m.content === '__timer_resume__')
        );
        if (lastTimerMsg?.content === '__timer_pause__') {
          timerPausedRef.current = true; setTimerPaused(true);
        } else if (lastTimerMsg?.content === '__timer_resume__') {
          timerPausedRef.current = false; setTimerPaused(false);
        }
        // Mark doctor messages as read
        const unread = newMsgs.filter(m => m.sender_role === 'doctor' && !m.is_read);
        if (unread.length) supabase.from('instant_chat_messages').update({ is_read: true }).in('id', unread.map(m => m.id));
      }
    };
    init();

    // Realtime for instant delivery
    const msgChannel = supabase
      .channel(`chat_rt_${sessionId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'instant_chat_messages' },
        async (payload) => {
          const msg = payload.new as any;
          if (msg.session_id !== sessionId) return;

          // Handle timer control system messages — don't show in chat
          if (msg.type === 'system') {
            if (msg.content === '__timer_pause__') {
              timerPausedRef.current = true;
              setTimerPaused(true);
            } else if (msg.content === '__timer_resume__') {
              timerPausedRef.current = false;
              setTimerPaused(false);
            }
            // Still save to IndexedDB but add to messages for banner rendering
            await appendMessage(msg);
            setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
            return;
          }

          await appendMessage(msg);
          setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
          if (msg.sender_role === 'doctor' && !msg.is_read) {
            supabase.from('instant_chat_messages').update({ is_read: true }).eq('id', msg.id);
          }
        })
      .subscribe();

    // 5s poll safety net — delta fetch only
    pollRef.current = setInterval(async () => {
      const lastTime = await getLastMessageTime(sessionId);
      let query = supabase.from('instant_chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
      if (lastTime) query = query.gt('created_at', lastTime);
      const { data } = await query;
      if (data?.length) {
        await saveMessages(data);
        const all = await getMessages(sessionId);
        setMessages(all);
      }
    }, 5000);

    // Session end: realtime (unfiltered — REPLICA IDENTITY FULL not guaranteed)
    const sessionChannel = supabase
      .channel(`session_status_${sessionId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_sessions' },
        async () => {
          const { data } = await supabase.from('chat_sessions')
            .select('status, doctor_name').eq('id', sessionId).maybeSingle();
          if (data?.status === 'ended') {
            clearInterval(sessionPollRef.current);
            clearInterval(pollRef.current);
            setEndedDoctorName(data.doctor_name ?? doctorName);
            setSessionEnded(true);
          }
        })
      .subscribe();

    // Session end: 2s poll (primary reliable path)
    sessionPollRef.current = setInterval(async () => {
      const { data } = await supabase.from('chat_sessions')
        .select('status, doctor_name').eq('id', sessionId).maybeSingle();
      if (data?.status === 'ended') {
        clearInterval(sessionPollRef.current);
        clearInterval(pollRef.current);
        setEndedDoctorName(data.doctor_name ?? doctorName);
        setSessionEnded(true);
      }
    }, 2000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(sessionPollRef.current);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId]);

  // Track latest prescription message
  useEffect(() => {
    const rxMsg = [...messages].reverse().find(m => m.type === 'prescription');
    if (rxMsg) setLatestRxId(rxMsg.content?.replace('__prescription__:', ''));
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Session timer — pauses when doctor is writing prescription
  useEffect(() => {
    const timer = setInterval(() => {
      if (timerPausedRef.current) return; // skip tick while paused
      setSessionTime(prev => {
        if (prev <= 0) { clearInterval(timer); setShowTimerEnd(true); return 0; }
        if (prev === 60 && !warningShown) { setWarningShown(true); setShowExtend(true); }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [warningShown]);

  // Close countdown
  useEffect(() => {
    if (!showTimerEnd) return;
    if (closeCountdown <= 0) { handleEndSession(); return; }
    const t = setTimeout(() => setCloseCountdown(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [showTimerEnd, closeCountdown]);

  const sendMessage = async (type: string, content?: string, fileUrl?: string, fileName?: string, fileType?: string) => {
    if (!sessionId || !user) return;
    const { data: msg } = await supabase.from('instant_chat_messages').insert({
      session_id: sessionId,
      sender_id: user.uid,
      sender_role: 'patient',
      type,
      content: content ?? null,
      file_url: fileUrl ?? null,
      file_name: fileName ?? null,
      file_type: fileType ?? null,
      is_read: false,
    }).select().single();
    if (msg) {
      await appendMessage(msg);
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
    }
  };

  const handleSend = () => {
    if (input.trim()) { sendMessage('text', input.trim()); setInput(''); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File must be less than 10MB'); return; }
    setUploading(true);
    setShowAttach(false);
    const path = `${sessionId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data: up } = await supabase.storage.from('instant-chat-files').upload(path, file, { upsert: true });
    if (up) {
      const { data: urlData } = supabase.storage.from('instant-chat-files').getPublicUrl(up.path);
      const msgType = file.type.startsWith('image/') ? 'image' : 'file';
      await sendMessage(msgType, null, urlData.publicUrl, file.name, file.type);
      // Show video suggestion popup for 6 seconds
      setShowVideoSuggestion(true);
      clearTimeout(videoSuggestionTimer.current);
      videoSuggestionTimer.current = setTimeout(() => setShowVideoSuggestion(false), 6000);
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleEndSession = async () => {
    clearInterval(pollRef.current);
    clearInterval(sessionPollRef.current);

    if (sessionId) {
      // 1. Mark session ended
      await supabase.from('chat_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      // 2. Record doctor earning using correct table schema
      if (consultationFee > 0) {
        const { data: sess } = await supabase.from('chat_sessions')
          .select('doctor_id, patient_name').eq('id', sessionId).single();
        if (sess?.doctor_id) {
          await supabase.from('doctor_earnings').insert({
            doctor_id:    sess.doctor_id,
            appointment_id: null,          // instant chat has no OPD appointment
            patient_name: sess.patient_name ?? 'Patient',
            fee:          consultationFee,
            source:       'instant_chat',
            earned_at:    new Date().toISOString(),
          });
        }
      }

      await clearSession(sessionId);
    }

    // 3. Deduct from patient wallet
    if (consultationFee > 0) {
      await deductWallet(consultationFee);
    }

    localStorage.removeItem('mc_consult_id');
    setShowEndConfirm(false);
    onEndSession(latestRxId ?? undefined);
  };

  const handleExtend = async (opt: typeof EXTEND_OPTIONS[0]) => {
    if (walletBalance < opt.price) return;
    await deductWallet(opt.price);
    setSessionTime(prev => prev + opt.seconds);
    setShowExtend(false);
    setShowTimerEnd(false);
    setCloseCountdown(10);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const isLow = sessionTime <= 60;
  const isVeryLow = sessionTime <= 30;

  const [showVideoSuggestion, setShowVideoSuggestion] = useState(false);
  const videoSuggestionTimer = useRef<any>(null);
  const [expandedRx, setExpandedRx] = useState<string | null>(null);
  const [rxCache, setRxCache] = useState<Record<string, any>>({});
  const [latestRxId, setLatestRxId] = useState<string | null>(null);

  const fetchRx = async (rxId: string) => {
    if (rxCache[rxId]) { setExpandedRx(rxId); return; }
    const { data } = await supabase.from('chat_prescriptions').select('*').eq('id', rxId).single();
    if (data) { setRxCache(p => ({ ...p, [rxId]: data })); setExpandedRx(rxId); }
  };

  const renderMessage = (msg: any) => {
    const isMe = msg.sender_role === 'patient';

    // Timer control system messages — invisible in chat
    if (msg.type === 'system' && (
      msg.content === '__timer_pause__' ||
      msg.content === '__timer_resume__'
    )) {
      return null;
    }

    // System: doctor writing prescription
    if (msg.type === 'system' && msg.content === '__writing_prescription__') {
      return (
        <div key={msg.id} className="flex justify-center">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full text-xs font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Doctor is writing your prescription...
          </div>
        </div>
      );
    }

    // System: prescription updated
    if (msg.type === 'system' && msg.content === '__prescription_updated__') {
      return (
        <div key={msg.id} className="flex justify-center">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-xs font-semibold">
            <span>📄</span>
            Prescription Updated
          </div>
        </div>
      );
    }

    // Prescription ready
    if (msg.type === 'prescription') {
      const rxId = msg.content?.replace('__prescription__:', '');
      const rx = rxCache[rxId];
      const isOpen = expandedRx === rxId;
      return (
        <div key={msg.id} className="flex justify-start">
          <div className="max-w-[85%] w-full">
            <button
              onClick={() => isOpen ? setExpandedRx(null) : fetchRx(rxId)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl rounded-bl-sm bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Pill className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-emerald-800">Prescription Ready</p>
                <p className="text-xs text-emerald-600">Tap to view your prescription</p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-emerald-600" />}
            </button>

            {isOpen && rx && (
              <div className="mt-2 bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="bg-emerald-600 px-4 py-3">
                  <p className="text-white font-bold text-sm">Dr. {rx.doctor_name}</p>
                  <p className="text-emerald-100 text-xs">{rx.doctor_specialty}</p>
                  <p className="text-emerald-200 text-[10px] mt-0.5">
                    {new Date(rx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="p-4 space-y-3">
                  {/* Diagnosis */}
                  {rx.diagnosis && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Diagnosis</p>
                      <p className="text-sm text-foreground">{rx.diagnosis}</p>
                    </div>
                  )}

                  {/* Medicines */}
                  {rx.medicines?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Medicines</p>
                      <div className="space-y-2">
                        {rx.medicines.map((med: any, i: number) => (
                          <div key={i} className="bg-secondary rounded-xl px-3 py-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">{med.name}</p>
                              {med.type && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">{med.type}</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ')}
                            </p>
                            {med.instructions && <p className="text-xs text-amber-600 mt-0.5">⚠ {med.instructions}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advice */}
                  {rx.advice?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Advice</p>
                      <ul className="space-y-1">
                        {rx.advice.map((a: string, i: number) => (
                          <li key={i} className="text-xs text-foreground flex gap-2"><span className="text-emerald-500 flex-shrink-0">•</span>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Follow-up */}
                  {rx.follow_up && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Follow-up</p>
                      <p className="text-xs text-blue-800 mt-0.5">{rx.follow_up}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        {msg.type === 'image' ? (
          <div className={`max-w-[70%] rounded-2xl overflow-hidden border border-border ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
            <img src={msg.file_url} alt={msg.file_name ?? 'image'} className="w-full max-h-48 object-cover" />
            <div className={`px-3 py-1 text-[10px] text-muted-foreground ${isMe ? 'bg-primary/10 text-right' : 'bg-secondary'}`}>
              {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ) : msg.type === 'file' ? (
          <a href={msg.file_url} target="_blank" rel="noreferrer"
            className={`max-w-[75%] flex items-center gap-3 px-4 py-3 rounded-2xl border border-border ${isMe ? 'bg-primary/10 rounded-br-sm' : 'bg-secondary rounded-bl-sm'}`}>
            <FileText className="w-8 h-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{msg.file_name ?? 'File'}</p>
              <p className="text-xs text-primary">Tap to open</p>
            </div>
          </a>
        ) : (
          <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm'}`}>
            <p className="text-sm">{msg.content}</p>
            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] opacity-60">
                {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isMe && msg.is_read && <CheckCheck className="w-3 h-3 opacity-60" />}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (connecting) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-semibold text-foreground">Connecting to Dr. {doctorName}...</p>
        <p className="text-sm text-muted-foreground">Setting up your chat session</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border shadow-sm">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        {doctorAvatar
          ? <img src={doctorAvatar} alt={doctorName} className="w-11 h-11 rounded-full object-cover border-2 border-primary/20" />
          : <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20"><span className="text-lg font-bold text-primary">{doctorName?.charAt(0)}</span></div>
        }
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">Dr. {doctorName}</h2>
          <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
          timerPaused
            ? 'bg-amber-100 text-amber-700 border border-amber-300'
            : isVeryLow ? 'bg-destructive text-destructive-foreground animate-pulse'
            : isLow ? 'bg-destructive/10 text-destructive'
            : 'bg-primary/10 text-primary'
        }`}>
          {timerPaused ? '⏸ Paused' : `⏱ ${formatTime(sessionTime)}`}
        </div>
        <button
          onClick={() => setShowEndConfirm(true)}
          className="ml-1 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-colors flex-shrink-0">
          End
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>Chat started. Say hello to Dr. {doctorName}!</p>
          </div>
        )}
        {messages.map(renderMessage)}
        {uploading && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 bg-primary/10 rounded-2xl px-4 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-primary">Uploading...</span>
            </div>
          </div>
        )}
        {/* Switch to Video suggestion */}
        {showVideoSuggestion && (
          <div className="flex justify-center">
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 shadow-sm max-w-[90%]">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Video className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-800">Switch to Video?</p>
                <p className="text-[10px] text-blue-600">Better experience for sharing reports</p>
              </div>
              <button onClick={() => setShowVideoSuggestion(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-100 flex-shrink-0">
                <X className="w-3.5 h-3.5 text-blue-500" />
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2 bg-card border-t border-border relative">
        {showAttach && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAttach(false)} />
            <div className="absolute bottom-full left-4 mb-3 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden w-48">
              <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors border-b border-border"
                onClick={() => { setShowAttach(false); cameraInputRef.current?.click(); }}>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Camera className="w-5 h-5 text-primary" /></div>
                <span className="text-sm font-medium text-foreground">Camera / Photo</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                onClick={() => { setShowAttach(false); fileInputRef.current?.click(); }}>
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-accent" /></div>
                <span className="text-sm font-medium text-foreground">Upload File / PDF</span>
              </button>
            </div>
          </>
        )}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAttach(o => !o)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showAttach ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="w-full h-12 pl-4 pr-12 rounded-full bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20" />
            <button onClick={handleSend} disabled={!input.trim()}
              className="absolute right-1 top-1 w-10 h-10 rounded-full gradient-primary flex items-center justify-center disabled:opacity-50">
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* End Confirm */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
          <div className="relative w-full max-w-sm bg-background rounded-2xl p-6 shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">End Consultation?</h3>
            <p className="text-sm text-muted-foreground mb-1">Your chat history will be saved.</p>
            {consultationFee > 0 && (
              <p className="text-sm font-semibold text-destructive mb-5">
                ₹{consultationFee} will be deducted from your wallet.
              </p>
            )}
            {!consultationFee && <div className="mb-5" />}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowEndConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleEndSession}>Yes, End</Button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Time */}
      {showExtend && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExtend(false)} />
          <div className="relative w-full max-w-md bg-background rounded-t-3xl p-6 space-y-3">
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-2" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-foreground">Add More Time</h3>
              <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
                <Wallet className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-bold text-primary">₹{walletBalance}</span>
              </div>
            </div>
            {EXTEND_OPTIONS.map(opt => (
              <button key={opt.label} onClick={() => handleExtend(opt)} disabled={walletBalance < opt.price}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${walletBalance >= opt.price ? 'border-primary/30 bg-primary/5 hover:border-primary' : 'border-border opacity-50 cursor-not-allowed'}`}>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-bold text-foreground">{opt.label}</span>
                </div>
                <span className="text-lg font-bold text-primary">₹{opt.price}</span>
              </button>
            ))}
            <div className="pb-4" />
          </div>
        </div>
      )}

      {/* Timer End */}
      {showTimerEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-background rounded-2xl p-6 shadow-xl text-center">
            <div className="w-20 h-20 rounded-full border-4 border-destructive flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-destructive">{closeCountdown}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Time's Up!</h3>
            <p className="text-sm text-muted-foreground mb-5">Closing in {closeCountdown}s</p>
            <div className="space-y-3">
              <Button variant="hero" size="lg" className="w-full" onClick={() => { setShowTimerEnd(false); setShowExtend(true); }}>
                <Clock className="w-4 h-4" /> Add More Time
              </Button>
              <Button variant="outline" size="lg" className="w-full text-destructive border-destructive/30" onClick={handleEndSession}>End Chat</Button>
            </div>
          </div>
        </div>
      )}

      {/* Session Ended by Doctor Popup */}
      {sessionEnded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-background rounded-2xl p-6 text-center w-full max-w-sm shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏥</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Consultation Ended</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Dr. {endedDoctorName} has ended the consultation. Thank you for using our service.
            </p>
            <div className="space-y-3">
              {latestRxId && (
                <Button variant="hero" size="lg" className="w-full" onClick={() => {
                  setSessionEnded(false);
                  fetchRx(latestRxId);
                  setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}>View Prescription</Button>
              )}
              <Button variant="outline" size="lg" className="w-full" onClick={() => onEndSession(latestRxId ?? undefined)}>Go Home</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
