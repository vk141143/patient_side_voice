import { useState, useRef, useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
  X, Mic, MicOff, ChevronRight, Volume2, AlertCircle,
  RotateCcw, Stethoscope, CheckCircle2, Sparkles, Loader2, Zap, Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';
import {
  LANGUAGES, GREETINGS, RECOMMENDATION_TEXT, NO_MATCH_TEXT,
  ASK_SINCE_WHEN, LANGUAGE_LABEL, stopSpeaking, type SupportedLanguage,
} from '@/lib/voiceAssistant';
import { detectSymptoms, buildGeminiResult, type SymptomDetectionResult } from '@/utils/symptomDetector';

// ── locales ───────────────────────────────────────────────────────
const WSR_LOCALE: Record<SupportedLanguage, string> = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', kn: 'kn-IN',
};
const TTS_LOCALE: Record<SupportedLanguage, string> = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', kn: 'kn-IN',
};

// ── voice keyword maps ────────────────────────────────────────────
const SINCE_KEYWORDS: Record<string, string> = {
  'this morning': 'This morning', today: 'Today', yesterday: 'Yesterday',
  'two days': '2 days', '2 days': '2 days', 'three days': '3 days', '3 days': '3 days',
  'four days': '4 days', 'five days': '5 days', 'one week': '1 week',
  'a week': '1 week', '1 week': '1 week', 'two weeks': '2 weeks',
  'a month': '1 month', 'one month': '1 month', 'few hours': 'A few hours',
  'few days': 'A few days', morning: 'This morning',
};

function detectConsultMode(text: string): 'instant' | 'available' | null {
  const t = text.toLowerCase();
  if (t.match(/\b(now|immediately|instant|urgent|right now|asap|quick|fast|chat|talk|speak)\b/)) return 'instant';
  if (t.match(/\b(available|list|browse|choose|select|see|show|search|find|doctors|available doctors)\b/)) return 'available';
  return null;
}

function detectCallType(text: string): 'chat' | 'video' {
  return /\b(video|call|video call)\b/i.test(text) ? 'video' : 'chat';
}

// ── types ─────────────────────────────────────────────────────────
type MicPurpose = 'symptoms' | 'since_when' | 'consult_mode' | 'call_type';

type Step =
  | 'language'
  | 'listening'
  | 'analyzing'
  | 'since_when'
  | 'consult_mode'
  | 'call_type'
  | 'matching'
  | 'match_accepted'
  | 'no_match'
  | 'error';

export interface VoiceAssistantModalProps {
  onClose: () => void;
  onFindDoctor: (specialty: string) => void;
  onSelectDoctor?: (doctor: any, callType: 'chat' | 'video', requestId?: string) => void;
  onStartMatching?: (symptoms: string[], description: string, consultMode: 'instant' | 'available') => void;
  onVoiceSubmit?: (symptoms: string[], description: string, sinceWhen: string, mode: 'instant' | 'available') => void;
  walletBalance?: number;
}

export function VoiceAssistantModal({
  onClose, onFindDoctor, onSelectDoctor, onStartMatching, onVoiceSubmit, walletBalance = 0,
}: VoiceAssistantModalProps) {
  const [step, setStep] = useState<Step>('language');
  const [lang, setLang] = useState<SupportedLanguage | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [result, setResult] = useState<SymptomDetectionResult | null>(null);
  const [sinceWhen, setSinceWhen] = useState('');
  const [consultMode, setConsultMode] = useState<'instant' | 'available' | null>(null);
  const [callType, setCallType] = useState<'chat' | 'video'>('chat');
  const [volume, setVolume] = useState(0);
  const [countdown, setCountdown] = useState(120);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [acceptedDoctor, setAcceptedDoctor] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [instantPrice, setInstantPrice] = useState(99);

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const ttsGuardRef = useRef(false);
  const listeningStartedRef = useRef(false);
  const mediaRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const volRafRef = useRef<number>(0);
  const micPurposeRef = useRef<MicPurpose>('symptoms');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef('');
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<any>(null);
  const matchedRef = useRef(false);
  const sinceWhenRef = useRef('');

  useEffect(() => () => { cleanup(); }, []);

  const cleanup = () => {
    SpeechRecognition.stopListening();
    stopSpeaking();
    stopVol();
    mediaRef.current?.getTracks().forEach(t => t.stop());
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
  };

  // ── volume ────────────────────────────────────────────────────
  const stopVol = () => {
    cancelAnimationFrame(volRafRef.current);
    analyserRef.current?.disconnect(); analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {}); audioCtxRef.current = null;
    setVolume(0);
  };
  const startVol = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaRef.current = stream;
      const ctx = new AudioContext(); audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyserRef.current = analyser;
      src.connect(analyser);
      const tick = () => {
        const d = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(d);
        setVolume(d.reduce((a, b) => a + b, 0) / d.length / 128);
        volRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* non-critical */ }
  };

  // ── TTS ──────────────────────────────────────────────────────
  const ttsSay = useCallback((
    text: string, l: SupportedLanguage, onDone?: () => void,
  ) => {
    if (!('speechSynthesis' in window)) { onDone?.(); return; }
    if (ttsGuardRef.current) return;
    ttsGuardRef.current = true;
    stopSpeaking(); setIsSpeaking(true);
    const locale = TTS_LOCALE[l];
    const speak = () => {
      const voices = window.speechSynthesis.getVoices();
      const pick =
        voices.find(v => v.lang === locale && /female|woman|zira|heera|lekha|neerja/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith(locale.split('-')[0]) && /female|woman|zira|heera|lekha|neerja/i.test(v.name)) ||
        voices.find(v => v.lang === locale) ||
        voices.find(v => v.lang.startsWith(locale.split('-')[0])) || null;
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = locale; utt.rate = 0.92; utt.pitch = 1.1;
      if (pick) utt.voice = pick;
      utt.onend = () => { ttsGuardRef.current = false; setIsSpeaking(false); onDone?.(); };
      utt.onerror = () => { ttsGuardRef.current = false; setIsSpeaking(false); onDone?.(); };
      window.speechSynthesis.speak(utt);
    };
    if (window.speechSynthesis.getVoices().length > 0) speak();
    else {
      const h = () => { window.speechSynthesis.removeEventListener('voiceschanged', h); speak(); };
      window.speechSynthesis.addEventListener('voiceschanged', h);
    }
  }, []);

  // ── mic ───────────────────────────────────────────────────────
  const startMic = async (l: SupportedLanguage, purpose: MicPurpose) => {
    micPurposeRef.current = purpose;
    resetTranscript(); lastTranscriptRef.current = '';
    setIsListening(true); startVol();
    await SpeechRecognition.startListening({ continuous: true, language: WSR_LOCALE[l], interimResults: true });
  };
  const stopMic = async () => {
    await SpeechRecognition.stopListening();
    setIsListening(false); stopVol();
    mediaRef.current?.getTracks().forEach(t => t.stop()); mediaRef.current = null;
  };

  // ── 2-second silence → auto-process follow-up answers ─────────
  useEffect(() => {
    if (!isListening || micPurposeRef.current === 'symptoms') return;
    if (transcript === lastTranscriptRef.current) return;
    lastTranscriptRef.current = transcript;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (transcript.trim().length < 2) return;
    silenceTimerRef.current = setTimeout(() => handleFollowUp(transcript.trim()), 2000);
    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
  }, [transcript, isListening]);

  // ── INTERRUPT: if user speaks DURING TTS, cancel and process ──
  useEffect(() => {
    if (!isSpeaking) return;
    if (transcript === lastTranscriptRef.current) return;
    lastTranscriptRef.current = transcript;
    if (transcript.trim().length < 3) return;
    stopSpeaking();
    ttsGuardRef.current = false;
    setIsSpeaking(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => handleFollowUp(transcript.trim()), 800);
  }, [transcript, isSpeaking]);

  // ── STEP 1: language ──────────────────────────────────────────
  const handleLanguageSelect = useCallback((selected: SupportedLanguage) => {
    if (!browserSupportsSpeechRecognition) {
      setErrorMsg('Your browser does not support voice recognition. Please use Chrome or Edge.');
      setStep('error'); return;
    }
    ttsGuardRef.current = false; listeningStartedRef.current = false;
    resetTranscript(); setLang(selected); setStep('listening');
    setResult(null); setSinceWhen(''); sinceWhenRef.current = ''; setConsultMode(null);
    ttsSay(GREETINGS[selected], selected, () => {
      if (!listeningStartedRef.current) { listeningStartedRef.current = true; startMic(selected, 'symptoms'); }
    });
  }, [browserSupportsSpeechRecognition, resetTranscript, ttsSay]);

  // ── STEP 2: user stops describing symptoms ───────────────────
  const handleStopSymptoms = useCallback(async () => {
    stopSpeaking(); await stopMic();
    if (!lang) return;
    const text = transcript.trim();
    if (!text) {
      ttsGuardRef.current = false;
      ttsSay("Sorry, I couldn't hear you. Could you please say that again?", lang, () => startMic(lang, 'symptoms'));
      return;
    }

    const dict = detectSymptoms(text, lang);
    if (dict.matched) { setResult(dict); logSession(dict); askSinceWhen(dict, lang); return; }

    setStep('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-symptoms', {
        body: { transcript: text, language: LANGUAGE_LABEL[lang] },
      });
      if (error) throw error;
      const gr = buildGeminiResult(text, lang, data.symptoms ?? [], data.confidence ?? 'Low');
      setResult(gr); logSession(gr);
      if (gr.matched) askSinceWhen(gr, lang);
      else { setStep('no_match'); ttsGuardRef.current = false; ttsSay(NO_MATCH_TEXT[lang], lang); }
    } catch {
      const fb = detectSymptoms(text, lang);
      setResult(fb); setStep(fb.matched ? 'since_when' : 'no_match');
      ttsGuardRef.current = false;
      ttsSay(fb.matched ? `${RECOMMENDATION_TEXT[lang]} ${ASK_SINCE_WHEN[lang]}` : NO_MATCH_TEXT[lang], lang, fb.matched ? () => startMic(lang, 'since_when') : undefined);
    }
  }, [lang, transcript, ttsSay]);

  const askSinceWhen = (r: SymptomDetectionResult, l: SupportedLanguage) => {
    const sympList = r.detectedSymptoms.join(', ');
    setStep('since_when'); setStatusMsg('Tell me since when...');
    ttsGuardRef.current = false;
    ttsSay(`I detected ${sympList}. ${RECOMMENDATION_TEXT[l]} ${ASK_SINCE_WHEN[l]}`, l, () => {
      startMic(l, 'since_when');
    });
  };

  // ── follow-up voice handler ───────────────────────────────────
  const handleFollowUp = async (text: string) => {
    if (!lang) return;
    const purpose = micPurposeRef.current;
    await stopMic();
    stopSpeaking(); ttsGuardRef.current = false;

    if (purpose === 'since_when') {
      const tl = text.toLowerCase();
      let found = '';
      for (const [kw, val] of Object.entries(SINCE_KEYWORDS)) {
        if (tl.includes(kw)) { found = val; break; }
      }
      const since = found || text;
      setSinceWhen(since);
      sinceWhenRef.current = since;
      setStep('consult_mode');
      setStatusMsg('Listening — say "talk now" or "available doctors"...');
      ttsSay(
        `You have had these symptoms since ${since}. Would you like to talk to a doctor immediately, or browse available doctors? Say "talk now" for instant, or "available doctors" to see the list.`,
        lang, () => startMic(lang, 'consult_mode'),
      );
      return;
    }

    if (purpose === 'consult_mode') {
      const mode = detectConsultMode(text) ?? 'instant';
      setConsultMode(mode);
      const symptoms = result?.detectedSymptoms ?? [];
      const specialty = result?.recommendedDoctor ?? 'General Physician';
      const since = sinceWhenRef.current;
      const description = [
        `Symptoms: ${symptoms.join(', ')}`,
        since ? `Since: ${since}` : '',
        `Detected via voice assistant`,
      ].filter(Boolean).join('. ');
      const msgText = mode === 'available'
        ? `Opening available doctors for you.`
        : `Great! Searching for a doctor now. Instant consultation costs rupees ${instantPrice}.`;
      ttsSay(msgText, lang, () => {
        if (onVoiceSubmit) onVoiceSubmit([specialty], description, since, mode);
        if (mode === 'available') onClose();
      });
      return;
    }

    if (purpose === 'call_type') {
      const ct = detectCallType(text);
      setCallType(ct);
      ttsSay(
        `Great! Starting a ${ct} consultation. Searching for a doctor now.`,
        lang, () => startInstantMatch(lang, ct),
      );
      return;
    }
  };

  // ── instant match: create request, 120s countdown ─────────────
  const startInstantMatch = async (l: SupportedLanguage, ct: 'chat' | 'video') => {
    setStep('matching'); matchedRef.current = false;
    const user = getCurrentUser();
    if (!user) return;

    const { data: userRow } = await supabase.from('users').select('name').eq('id', user.uid).maybeSingle();
    const patientName = userRow?.name || user.displayName || user.email || 'Patient';
    const { data: priceRow } = await supabase.from('admin_pricing').select('value').eq('key', 'instant_chat_price').single();
    const fee = Number(priceRow?.value) || 99;
    setInstantPrice(fee);

    await supabase.from('consultation_requests').update({ status: 'cancelled' }).eq('patient_id', user.uid).eq('status', 'searching');

    const since = sinceWhenRef.current;
    const { data: req } = await supabase.from('consultation_requests').insert({
      patient_id: user.uid, patient_name: patientName,
      specialty: result?.recommendedDoctor ?? 'General Physician',
      description: result?.detectedSymptoms.join(', ') ?? '',
      duration: since || null,
      status: 'searching', call_type: ct, consult_mode: 'instant', fee,
    }).select('id').single();

    if (!req) return;
    const reqId = req.id; setRequestId(reqId);

    let secs = 120; setCountdown(120);
    countdownTimerRef.current = setInterval(() => {
      secs--;
      setCountdown(secs);
      if (secs === 90 && l) { ttsGuardRef.current = false; ttsSay('Still searching. Please wait.', l); }
      if (secs === 60 && l) { ttsGuardRef.current = false; ttsSay('One minute remaining. Looking for a doctor.', l); }
      if (secs === 30 && l) { ttsGuardRef.current = false; ttsSay('30 seconds remaining.', l); }
      if (secs <= 0) {
        clearInterval(countdownTimerRef.current!);
        supabase.from('consultation_requests').update({ status: 'timeout' }).eq('id', reqId);
        ttsGuardRef.current = false;
        ttsSay('No doctor accepted in time. Please try browsing available doctors.', l);
        setStep('no_match');
      }
    }, 1000);

    realtimeRef.current = supabase.channel(`voice_req_${reqId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'consultation_requests' }, (payload) => {
        const u = payload.new as any;
        if (u.id === reqId && u.status === 'accepted' && u.doctor_id) onDoctorAccepted(reqId, u.doctor_id, l, ct);
      }).subscribe();

    pollRef.current = setInterval(async () => {
      const { data: u } = await supabase.from('consultation_requests').select('status, doctor_id').eq('id', reqId).single();
      if (u?.status === 'accepted' && u?.doctor_id) { clearInterval(pollRef.current!); onDoctorAccepted(reqId, u.doctor_id, l, ct); }
    }, 3000);
  };

  const onDoctorAccepted = async (reqId: string, doctorId: string, l: SupportedLanguage, ct: 'chat' | 'video') => {
    if (matchedRef.current) return; matchedRef.current = true;
    clearInterval(countdownTimerRef.current!); clearInterval(pollRef.current!);
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);

    const { data: doc } = await supabase.from('doctors')
      .select('full_name, specialization, experience_years').eq('firebase_uid', doctorId).single();

    setAcceptedDoctor({ ...doc, firebase_uid: doctorId });
    setStep('match_accepted');

    const name = doc?.full_name ?? 'a doctor';
    const exp = doc?.experience_years ? `with ${doc.experience_years} years of experience` : '';
    const msg = `Great news! Doctor ${name} ${exp} has accepted your request. Connecting you now for your ${ct} consultation.`;
    ttsGuardRef.current = false;
    ttsSay(msg, l, async () => {
      let retries = 0;
      const find = async () => {
        const { data: sess } = await supabase.from('chat_sessions').select('*').eq('consultation_id', reqId).maybeSingle();
        if (sess && onSelectDoctor) { onSelectDoctor({ firebase_uid: doctorId, ...doc }, ct, reqId); }
        else if (retries++ < 8) setTimeout(find, 1500);
        else if (onSelectDoctor) onSelectDoctor({ firebase_uid: doctorId, ...doc }, ct, reqId);
      };
      find();
    });
  };

  const logSession = (d: SymptomDetectionResult) => {
    const user = getCurrentUser();
    if (!user) return;
    supabase.from('voice_assistant_sessions').insert({
      user_id: user.uid, language: d.language, transcript: d.transcript,
      detected_symptoms: d.detectedSymptoms, doctor_type: d.recommendedDoctor, confidence: d.confidence,
    });
  };

  const handleReset = () => {
    cleanup();
    ttsGuardRef.current = false; listeningStartedRef.current = false; matchedRef.current = false;
    resetTranscript(); setStep('language'); setLang(null); setResult(null);
    setErrorMsg(''); setIsListening(false); setSinceWhen(''); sinceWhenRef.current = ''; setConsultMode(null);
    setStatusMsg(''); setRequestId(null); setAcceptedDoctor(null); setCountdown(120);
  };

  const handleClose = () => { cleanup(); onClose(); };

  // ── RENDER ────────────────────────────────────────────────────

  if (step === 'language') return (
    <ModalShell onClose={handleClose} title="Voice Assistant">
      <div className="px-5 pb-8">
        <p className="text-center text-muted-foreground text-sm mb-6">Select your language / भाषा चुनें</p>
        <div className="space-y-3">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => handleLanguageSelect(l.code)}
              className="w-full flex items-center justify-between bg-secondary border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-all rounded-2xl px-5 py-4 active:scale-[0.98]">
              <span className="text-xl font-semibold text-foreground">{l.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </ModalShell>
  );

  if (step === 'listening') return (
    <ModalShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-8 flex flex-col items-center">
        {isSpeaking && <SpeakingBadge />}
        <AutoMicButton isListening={isListening} isSpeaking={isSpeaking} volume={volume}
          manual onClick={isListening ? handleStopSymptoms : () => lang && startMic(lang, 'symptoms')} />
        <p className="text-base font-bold text-foreground mb-1">
          {isSpeaking ? 'Please wait...' : isListening ? '🎙 Listening — Tap to Stop' : 'Tap mic to speak'}
        </p>
        <p className="text-xs text-muted-foreground text-center mb-5">
          {isListening ? 'Describe your symptoms clearly' : 'Tap the microphone and describe your problem'}
        </p>
        {transcript && <TranscriptBox text={transcript} />}
      </div>
    </ModalShell>
  );

  if (step === 'analyzing') return (
    <ModalShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <SpinnerStep label="Analyzing your symptoms..." sub="Using AI to understand your health concern"
        icon={<Sparkles className="w-10 h-10 text-primary animate-pulse" />} />
    </ModalShell>
  );

  // ── voice-driven follow-up steps ──────────────────────────────
  if (['since_when', 'consult_mode', 'call_type'].includes(step)) {
    const questionMap: Record<string, string> = {
      since_when: 'Since when are you having these symptoms?',
      consult_mode: 'Talk now (instant) or browse available doctors?',
      call_type: 'Chat or Video call?',
    };
    return (
      <ModalShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
        <div className="px-5 pb-8 flex flex-col items-center gap-4">
          {isSpeaking && <SpeakingBadge />}
          <AutoMicButton isListening={isListening} isSpeaking={isSpeaking} volume={volume} />
          <p className="text-sm font-bold text-foreground text-center">{questionMap[step]}</p>
          <p className="text-xs text-muted-foreground text-center">{statusMsg}</p>
          {transcript && <TranscriptBox text={transcript} />}

          {result?.matched && (
            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
              <div className="flex flex-wrap gap-1.5">
                {result.detectedSymptoms.map(s => (
                  <span key={s} className="flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />{s}
                  </span>
                ))}
              </div>
              {sinceWhen && <p className="text-xs text-emerald-700 mt-1">Since: {sinceWhen}</p>}
            </div>
          )}

          {step === 'consult_mode' && (
            <div className="w-full grid grid-cols-2 gap-3 mt-1">
              <button onClick={() => { stopSpeaking(); ttsGuardRef.current = false; handleFollowUp('talk now'); }}
                className="flex flex-col items-center gap-1.5 border-2 border-primary/30 bg-primary/5 rounded-2xl p-3 active:scale-95">
                <Zap className="w-6 h-6 text-primary" />
                <span className="text-xs font-bold text-primary">Talk Now</span>
                <span className="text-[10px] text-muted-foreground">₹{instantPrice}</span>
              </button>
              <button onClick={() => { stopSpeaking(); ttsGuardRef.current = false; handleFollowUp('available doctors'); }}
                className="flex flex-col items-center gap-1.5 border-2 border-border rounded-2xl p-3 active:scale-95">
                <Users className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">Browse Doctors</span>
              </button>
            </div>
          )}
        </div>
      </ModalShell>
    );
  }

  // ── instant matching (120s countdown) ─────────────────────────
  if (step === 'matching') return (
    <ModalShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-8 flex flex-col items-center gap-5">
        {isSpeaking && <SpeakingBadge />}

        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
              className="text-primary transition-all duration-1000"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - countdown / 120)}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{countdown}</span>
            <span className="text-xs text-muted-foreground">seconds</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-base font-bold text-foreground">Searching for a doctor...</p>
          <p className="text-xs text-muted-foreground mt-1">
            {callType === 'video' ? '🎥 Video call' : '💬 Chat'} · {result?.recommendedDoctor ?? 'General Physician'}
          </p>
        </div>

        {result?.detectedSymptoms && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {result.detectedSymptoms.map(s => (
              <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{s}</span>
            ))}
          </div>
        )}

        {sinceWhen && <p className="text-xs text-muted-foreground">Since {sinceWhen}</p>}

        <button onClick={async () => {
          clearInterval(countdownTimerRef.current!); clearInterval(pollRef.current!);
          if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
          if (requestId) await supabase.from('consultation_requests').update({ status: 'cancelled' }).eq('id', requestId);
          handleReset();
        }} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
          Cancel search
        </button>
      </div>
    </ModalShell>
  );

  // ── doctor accepted ───────────────────────────────────────────
  if (step === 'match_accepted') return (
    <ModalShell onClose={handleClose} title="Voice Assistant">
      <div className="px-5 pb-8 flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Stethoscope className="w-10 h-10 text-green-600" />
        </div>
        <p className="text-xl font-bold text-foreground">Doctor Accepted! 🎉</p>
        {acceptedDoctor && (
          <div className="bg-card border border-border rounded-2xl p-4 w-full text-left space-y-1">
            <p className="text-base font-bold text-foreground">Dr. {acceptedDoctor.full_name}</p>
            <p className="text-sm text-muted-foreground">{acceptedDoctor.specialization}</p>
            <p className="text-sm text-muted-foreground">{acceptedDoctor.experience_years} years experience</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">Connecting you now for your {callType} consultation...</p>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    </ModalShell>
  );

  // ── no match ─────────────────────────────────────────────────
  if (step === 'no_match') return (
    <ModalShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-8 space-y-4">
        {isSpeaking && <SpeakingBadge />}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <p className="font-semibold text-amber-800 mb-1">Symptoms Not Detected</p>
          <p className="text-sm text-amber-700">{lang ? NO_MATCH_TEXT[lang] : ''}</p>
          {result?.transcript && <p className="text-xs text-amber-600 italic mt-2">"{result.transcript}"</p>}
        </div>
        <button onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 border-2 border-border text-muted-foreground font-semibold py-3 rounded-2xl hover:border-primary hover:text-primary transition-colors">
          <RotateCcw className="w-4 h-4" />Try Again
        </button>
      </div>
    </ModalShell>
  );

  // ── error ─────────────────────────────────────────────────────
  return (
    <ModalShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="font-semibold text-foreground mb-2">Something went wrong</p>
        <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
        <button onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-2xl">
          <RotateCcw className="w-4 h-4" />Try Again
        </button>
      </div>
    </ModalShell>
  );
}

// ── sub-components ────────────────────────────────────────────────
function SpeakingBadge() {
  return (
    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-1">
      <Volume2 className="w-4 h-4 text-primary animate-pulse" />
      <span className="text-sm text-primary font-medium">Speaking — you can interrupt anytime</span>
    </div>
  );
}

function AutoMicButton({ isListening, isSpeaking, volume, onClick, manual = false }: {
  isListening: boolean; isSpeaking: boolean; volume: number; onClick?: () => void; manual?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center my-4">
      {isListening && (
        <>
          <span className="absolute rounded-full bg-primary/20"
            style={{ width: `${80 + volume * 50}px`, height: `${80 + volume * 50}px`, transition: 'width 0.08s, height 0.08s' }} />
          <span className="absolute w-28 h-28 rounded-full bg-primary/10 animate-ping" />
        </>
      )}
      <div onClick={manual ? onClick : undefined}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
          manual ? 'cursor-pointer active:scale-95' : ''
        } ${isListening ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
        {isListening ? <Mic className="w-9 h-9" /> : <MicOff className="w-9 h-9" />}
      </div>
    </div>
  );
}

function TranscriptBox({ text }: { text: string }) {
  return (
    <div className="w-full bg-secondary rounded-2xl px-4 py-3">
      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide font-bold">Live Transcript</p>
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function SpinnerStep({ label, sub, icon }: { label: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="px-5 pb-8 flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
        {icon}
        <Loader2 className="w-24 h-24 text-primary/20 animate-spin absolute" />
      </div>
      <p className="text-base font-bold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground text-center">{sub}</p>
    </div>
  );
}

function ModalShell({ children, title, onClose, onBack }: {
  children: React.ReactNode; title: string; onClose: () => void; onBack?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-t-3xl animate-fade-in" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="sticky top-0 bg-background z-10 pt-4 pb-3 px-5 border-b border-border">
          <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onBack && (
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-foreground">{title}</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}
