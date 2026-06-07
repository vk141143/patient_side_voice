import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Mic, MicOff, Volume2, AlertCircle,
  RotateCcw, Stethoscope, CheckCircle2, Sparkles, Loader2, Zap, Users, ShieldCheck, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';
import {
  LANGUAGES, RECOMMENDATION_TEXT, NO_MATCH_TEXT,
  ASK_SINCE_WHEN, LANGUAGE_LABEL, stopSpeaking, type SupportedLanguage,
} from '@/lib/voiceAssistant';
import { detectSymptoms, buildGeminiResult, type SymptomDetectionResult } from '@/utils/symptomDetector';

const WSR_LOCALE: Record<SupportedLanguage, string> = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', kn: 'kn-IN',
};
const TTS_LOCALE: Record<SupportedLanguage, string> = {
  en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', kn: 'kn-IN',
};

const SINCE_KEYWORDS: Record<string, string> = {
  'this morning': 'This morning', today: 'Today', yesterday: 'Yesterday',
  'two days': '2 days', '2 days': '2 days', 'three days': '3 days', '3 days': '3 days',
  'one week': '1 week', 'a week': '1 week', '1 week': '1 week',
  'two weeks': '2 weeks', 'a month': '1 month', 'one month': '1 month',
  'few hours': 'A few hours', 'few days': 'A few days', morning: 'This morning',
};

function detectConsultMode(text: string): 'instant' | 'available' | null {
  const t = text.toLowerCase();
  if (t.match(/\b(now|immediately|instant|urgent|right now|asap|quick|fast|chat|talk|speak)\b/)) return 'instant';
  if (t.match(/\b(available|list|browse|choose|select|see|show|search|find|doctors)\b/)) return 'available';
  return null;
}

type MicPurpose = 'symptoms' | 'since_when' | 'consult_mode';
type Step = 'permission' | 'language' | 'listening' | 'analyzing' | 'since_when' | 'consult_mode' | 'matching' | 'match_accepted' | 'no_match' | 'error';

export interface VoiceAssistantModalProps {
  onClose: () => void;
  onFindDoctor: (specialty: string) => void;
  onSelectDoctor?: (doctor: any, callType: 'chat' | 'video', requestId?: string) => void;
  onVoiceSubmit?: (symptoms: string[], description: string, sinceWhen: string, mode: 'instant' | 'available') => void;
  walletBalance?: number;
}

export function VoiceAssistantModal({
  onClose, onFindDoctor, onSelectDoctor, onVoiceSubmit, walletBalance = 0,
}: VoiceAssistantModalProps) {
  const [step, setStep] = useState<Step>('permission');
  const [lang, setLang] = useState<SupportedLanguage | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<SymptomDetectionResult | null>(null);
  const [sinceWhen, setSinceWhen] = useState('');
  const [volume, setVolume] = useState(0);
  const [countdown, setCountdown] = useState(120);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [acceptedDoctor, setAcceptedDoctor] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [instantPrice, setInstantPrice] = useState(99);
  const [permState, setPermState] = useState<'idle' | 'requesting' | 'denied'>('idle');

  // refs — never trigger re-render
  const ttsGuardRef = useRef(false);
  const mediaRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const volRafRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const gotResultRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<any>(null);
  const matchedRef = useRef(false);
  const sinceWhenRef = useRef('');
  const langRef = useRef<SupportedLanguage | null>(null);
  const resultRef = useRef<SymptomDetectionResult | null>(null);

  // keep refs in sync
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { resultRef.current = result; }, [result]);

  useEffect(() => () => cleanup(), []);

  const cleanup = () => {
    abortRecognition();
    stopSpeaking();
    stopVol();
    mediaRef.current?.getTracks().forEach(t => t.stop());
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
  };

  // ── Volume ────────────────────────────────────────────────────
  const stopVol = () => {
    cancelAnimationFrame(volRafRef.current);
    analyserRef.current?.disconnect(); analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {}); audioCtxRef.current = null;
    setVolume(0);
  };

  const startVol = (stream: MediaStream) => {
    try {
      stopVol();
      const ctx = new AudioContext(); audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 256; analyserRef.current = an;
      src.connect(an);
      const tick = () => {
        const d = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(d);
        setVolume(d.reduce((a, b) => a + b, 0) / d.length / 128);
        volRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* non-critical */ }
  };

  // ── Microphone permission ─────────────────────────────────────
  const requestPermission = async () => {
    setPermState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaRef.current = stream;
      // Unlock AudioContext on mobile (must happen inside user gesture)
      try {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') await ctx.resume();
        ctx.close();
      } catch { /* ignore */ }
      setStep('language');
    } catch {
      setPermState('denied');
      setErrorMsg('Microphone access denied. Please allow microphone in your browser/app settings and try again.');
    }
  };

  // ── Native Speech Recognition ─────────────────────────────────
  const abortRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    stopVol();
  };

  const startRecognition = useCallback((locale: string, purpose: MicPurpose, onResult: (text: string) => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setErrorMsg('Speech recognition is not supported. Please use Chrome or Samsung Internet.');
      setStep('error');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }

    transcriptRef.current = '';
    gotResultRef.current = false;
    setTranscript('');

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = locale;
    // continuous: true so mobile doesn't cut off mid-sentence
    // On iOS Safari continuous is ignored but still works for one utterance
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    if (mediaRef.current && mediaRef.current.active) {
      startVol(mediaRef.current);
    }
    setIsListening(true);

    rec.onresult = (e: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interimText += t;
      }

      if (finalText) {
        transcriptRef.current = (transcriptRef.current + ' ' + finalText).trim();
        gotResultRef.current = true;
        setTranscript(transcriptRef.current);
        // reset silence window on every new final word
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          abortRecognition();
          onResult(transcriptRef.current.trim());
        }, 2000); // 2s silence → process (longer than desktop to handle mobile pauses)
      } else if (interimText) {
        setTranscript((transcriptRef.current + ' ' + interimText).trim());
        // reset silence window on interim too — user is still speaking
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          abortRecognition();
          if (transcriptRef.current.trim()) onResult(transcriptRef.current.trim());
        }, 2500);
      }
    };

    rec.onend = () => {
      // On mobile, continuous recognition can end unexpectedly — restart if we haven't
      // processed yet and the silence timer is still running
      if (silenceTimerRef.current !== null) {
        // timer is pending, let it fire naturally — don't restart
        recognitionRef.current = null;
        setIsListening(false);
        stopVol();
        return;
      }
      // No timer pending — check if we got something to process
      if (gotResultRef.current && transcriptRef.current.trim()) {
        recognitionRef.current = null;
        setIsListening(false);
        stopVol();
        onResult(transcriptRef.current.trim());
        return;
      }
      // Got nothing — restart silently so user doesn't have to tap again
      // (mobile drops recognition randomly, especially on first attempt)
      recognitionRef.current = null;
      if (!gotResultRef.current) {
        setIsListening(false);
        stopVol();
        // Small delay before restart to avoid rapid-fire on iOS
        setTimeout(() => {
          if (langRef.current) {
            startRecognition(locale, purpose, onResult);
          }
        }, 300);
      } else {
        setIsListening(false);
        stopVol();
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        recognitionRef.current = null;
        setIsListening(false);
        stopVol();
        setPermState('denied');
        setErrorMsg('Microphone access denied.');
        setStep('error');
        return;
      }
      if (e.error === 'aborted') {
        // intentional abort — do nothing
        return;
      }
      // 'no-speech', 'network', 'audio-capture' on mobile — restart
      recognitionRef.current = null;
      if (!gotResultRef.current) {
        setTimeout(() => {
          if (langRef.current) startRecognition(locale, purpose, onResult);
        }, 300);
      } else {
        setIsListening(false);
        stopVol();
      }
    };

    try { rec.start(); } catch { setIsListening(false); }
  }, []);

  // ── TTS ───────────────────────────────────────────────────────
  const ttsSay = useCallback((text: string, l: SupportedLanguage, onDone?: () => void) => {
    if (!('speechSynthesis' in window)) { onDone?.(); return; }
    if (ttsGuardRef.current) { onDone?.(); return; }
    ttsGuardRef.current = true;
    stopSpeaking(); setIsSpeaking(true);
    const locale = TTS_LOCALE[l];
    const speak = () => {
      const voices = window.speechSynthesis.getVoices();
      const lc = locale.split('-')[0];
      const femRe = /female|woman|zira|heera|lekha|neerja|veena|samantha|karen|google uk english female/i;
      const pick =
        voices.find(v => v.lang === locale && femRe.test(v.name)) ||
        voices.find(v => v.lang.startsWith(lc) && femRe.test(v.name)) ||
        voices.find(v => v.lang === locale) ||
        voices.find(v => v.lang.startsWith(lc)) || null;
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = locale; utt.rate = 1.0; utt.pitch = 1.05;
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

  // ── Language select → skip greeting, start mic immediately ────
  const handleLanguageSelect = useCallback((selected: SupportedLanguage) => {
    ttsGuardRef.current = false;
    setLang(selected); langRef.current = selected;
    setStep('listening');
    setResult(null); resultRef.current = null;
    setSinceWhen(''); sinceWhenRef.current = '';
    setTranscript(''); transcriptRef.current = '';
    // Start mic immediately — no greeting delay
    startRecognition(WSR_LOCALE[selected], 'symptoms', handleSymptomsResult);
  }, [startRecognition]);

  // ── Symptoms result ───────────────────────────────────────────
  const handleSymptomsResult = useCallback(async (text: string) => {
    const l = langRef.current || 'en';
    if (!text) return; // user taps mic again

    const dict = detectSymptoms(text, l);
    if (dict.matched) {
      setResult(dict); resultRef.current = dict;
      logSession(dict); askSinceWhen(dict, l);
      return;
    }

    setStep('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-symptoms', {
        body: { transcript: text, language: LANGUAGE_LABEL[l] },
      });
      if (error) throw error;
      const gr = buildGeminiResult(text, l, data.symptoms ?? [], data.confidence ?? 'Low');
      setResult(gr); resultRef.current = gr;
      logSession(gr);
      if (gr.matched) askSinceWhen(gr, l);
      else { setStep('no_match'); ttsGuardRef.current = false; ttsSay(NO_MATCH_TEXT[l], l); }
    } catch {
      const fb = detectSymptoms(text, l);
      setResult(fb); resultRef.current = fb;
      if (fb.matched) { logSession(fb); askSinceWhen(fb, l); }
      else { setStep('no_match'); ttsGuardRef.current = false; ttsSay(NO_MATCH_TEXT[l], l); }
    }
  }, [ttsSay]);

  const askSinceWhen = (r: SymptomDetectionResult, l: SupportedLanguage) => {
    setStep('since_when');
    ttsGuardRef.current = false;
    ttsSay(
      `${RECOMMENDATION_TEXT[l]} ${ASK_SINCE_WHEN[l]}`,
      l,
      () => startRecognition(WSR_LOCALE[l], 'since_when', handleSinceWhenResult),
    );
  };

  // ── Since when result ─────────────────────────────────────────
  const handleSinceWhenResult = useCallback((text: string) => {
    const l = langRef.current || 'en';
    const tl = text.toLowerCase();
    let found = '';
    for (const [kw, val] of Object.entries(SINCE_KEYWORDS)) {
      if (tl.includes(kw)) { found = val; break; }
    }
    const since = found || text;
    setSinceWhen(since); sinceWhenRef.current = since;
    setStep('consult_mode');
    ttsGuardRef.current = false;
    ttsSay(
      'Would you like to talk to a doctor immediately, or browse available doctors?',
      l,
      () => startRecognition(WSR_LOCALE[l], 'consult_mode', handleConsultModeResult),
    );
  }, [ttsSay, startRecognition]);

  // ── Consult mode result ───────────────────────────────────────
  const handleConsultModeResult = useCallback((text: string) => {
    const l = langRef.current || 'en';
    const mode = detectConsultMode(text) ?? 'instant';
    const specialty = resultRef.current?.recommendedDoctor ?? 'General Physician';
    const since = sinceWhenRef.current;
    const description = [
      `Symptoms: ${resultRef.current?.detectedSymptoms.join(', ')}`,
      since ? `Since: ${since}` : '',
    ].filter(Boolean).join('. ');
    ttsGuardRef.current = false;
    const msg = mode === 'available'
      ? 'Opening available doctors for you.'
      : `Searching for a doctor now.`;
    ttsSay(msg, l, () => {
      if (onVoiceSubmit) onVoiceSubmit([specialty], description, since, mode);
      if (mode === 'available') onClose();
    });
  }, [ttsSay, onVoiceSubmit, onClose]);

  const handleManualConsultMode = (mode: 'instant' | 'available') => {
    stopSpeaking(); ttsGuardRef.current = false;
    abortRecognition();
    handleConsultModeResult(mode === 'instant' ? 'talk now' : 'available doctors');
  };

  const handleManualSinceWhen = (opt: string) => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    abortRecognition();
    handleSinceWhenResult(opt);
  };

  // ── Manual mic tap on listening screen ───────────────────────
  const handleMicTap = () => {
    const l = langRef.current;
    if (!l) return;
    if (isListening) {
      // manual stop → process captured text
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      abortRecognition();
      const captured = transcriptRef.current.trim();
      if (captured) handleSymptomsResult(captured);
    } else {
      setTranscript(''); transcriptRef.current = '';
      startRecognition(WSR_LOCALE[l], 'symptoms', handleSymptomsResult);
    }
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
    ttsGuardRef.current = false; matchedRef.current = false;
    setTranscript(''); transcriptRef.current = '';
    setStep('language'); setLang(null); langRef.current = null;
    setResult(null); resultRef.current = null;
    setErrorMsg(''); setIsListening(false);
    setSinceWhen(''); sinceWhenRef.current = '';
    setRequestId(null); setAcceptedDoctor(null); setCountdown(120);
  };

  const handleClose = () => { cleanup(); onClose(); };

  // ── RENDER ────────────────────────────────────────────────────

  if (step === 'permission') return (
    <PopupShell onClose={handleClose} title="Voice Assistant">
      <div className="flex flex-col items-center gap-5 px-6 pb-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-primary" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground mb-1">Microphone Permission Required</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tap below to allow microphone access. This is required for the voice assistant to hear you.
          </p>
        </div>
        {permState === 'denied' ? (
          <div className="w-full bg-destructive/10 border border-destructive/20 rounded-2xl p-4 text-sm text-destructive font-medium">
            {errorMsg}
          </div>
        ) : null}
        <button
          onClick={requestPermission}
          disabled={permState === 'requesting'}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-4 rounded-2xl disabled:opacity-60 active:scale-[0.98] transition-all"
        >
          {permState === 'requesting'
            ? <><Loader2 className="w-5 h-5 animate-spin" />Requesting...</>
            : <><Mic className="w-5 h-5" />Allow Microphone & Start</>
          }
        </button>
        {permState === 'denied' && (
          <button onClick={requestPermission}
            className="w-full flex items-center justify-center gap-2 border-2 border-border text-foreground font-semibold py-3 rounded-2xl">
            <RotateCcw className="w-4 h-4" />Try Again
          </button>
        )}
      </div>
    </PopupShell>
  );

  if (step === 'language') return (
    <PopupShell onClose={handleClose} title="Voice Assistant">
      <div className="px-5 pb-6">
        <p className="text-center text-muted-foreground text-sm mb-4">Select your language / भाषा चुनें</p>
        <div className="space-y-2">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => handleLanguageSelect(l.code)}
              className="w-full flex items-center justify-between bg-secondary border-2 border-transparent hover:border-primary hover:bg-primary/5 transition-all rounded-2xl px-5 py-3.5 active:scale-[0.98]">
              <span className="text-lg font-semibold text-foreground">{l.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </PopupShell>
  );

  if (step === 'listening') return (
    <PopupShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-6 flex flex-col items-center gap-3">
        {isSpeaking && <SpeakingBadge />}
        <MicButton isListening={isListening} isSpeaking={isSpeaking} volume={volume} onClick={handleMicTap} />
        <p className="text-sm font-bold text-foreground text-center">
          {isSpeaking ? 'Please wait...' : isListening ? '🎙 Listening — tap to stop' : 'Tap mic to speak'}
        </p>
        <p className="text-xs text-muted-foreground text-center">
          {isListening ? 'Describe your symptoms clearly' : 'Tap the microphone and describe your problem'}
        </p>
        {transcript ? <TranscriptBox text={transcript} /> : null}
      </div>
    </PopupShell>
  );

  if (step === 'analyzing') return (
    <PopupShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-6 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          <Loader2 className="w-24 h-24 text-primary/20 animate-spin absolute" />
        </div>
        <p className="text-base font-bold text-foreground">Analyzing your symptoms...</p>
        <p className="text-xs text-muted-foreground text-center">Using AI to understand your concern</p>
      </div>
    </PopupShell>
  );

  if (step === 'since_when' || step === 'consult_mode') return (
    <PopupShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-6 flex flex-col items-center gap-4">
        {isSpeaking && <SpeakingBadge />}
        <MicButton isListening={isListening} isSpeaking={isSpeaking} volume={volume} />
        <p className="text-sm font-bold text-foreground text-center">
          {step === 'since_when' ? 'Since when are you having these symptoms?' : 'How would you like to consult?'}
        </p>
        {transcript ? <TranscriptBox text={transcript} /> : null}

        {result?.matched && (
          <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
            <div className="flex flex-wrap gap-1.5">
              {result.detectedSymptoms.map(s => (
                <span key={s} className="flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />{s}
                </span>
              ))}
            </div>
            {sinceWhen ? <p className="text-xs text-emerald-700 mt-1.5">Since: {sinceWhen}</p> : null}
          </div>
        )}

        {step === 'since_when' && (
          <div className="w-full grid grid-cols-3 gap-2">
            {['Today', 'Yesterday', '2–3 Days', '1 Week', '2 Weeks', '1 Month+'].map(opt => (
              <button key={opt} onClick={() => handleManualSinceWhen(opt)}
                className="border-2 border-border rounded-xl py-2 text-xs font-semibold text-foreground hover:border-primary hover:bg-primary/5 transition-all active:scale-95">
                {opt}
              </button>
            ))}
          </div>
        )}

        {step === 'consult_mode' && (
          <div className="w-full grid grid-cols-2 gap-3">
            <button onClick={() => handleManualConsultMode('instant')}
              className="flex flex-col items-center gap-1.5 border-2 border-primary/30 bg-primary/5 rounded-2xl p-4 active:scale-95 transition-all">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-xs font-bold text-primary">Talk Now</span>
              <span className="text-[10px] text-muted-foreground">₹{instantPrice}</span>
            </button>
            <button onClick={() => handleManualConsultMode('available')}
              className="flex flex-col items-center gap-1.5 border-2 border-border rounded-2xl p-4 active:scale-95 transition-all">
              <Users className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">Browse Doctors</span>
            </button>
          </div>
        )}
      </div>
    </PopupShell>
  );

  if (step === 'matching') return (
    <PopupShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-6 flex flex-col items-center gap-4">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
              className="text-primary transition-all duration-1000"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - countdown / 120)}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{countdown}</span>
            <span className="text-xs text-muted-foreground">sec</span>
          </div>
        </div>
        <p className="text-base font-bold text-foreground">Searching for a doctor...</p>
        {result?.detectedSymptoms && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {result.detectedSymptoms.map(s => (
              <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{s}</span>
            ))}
          </div>
        )}
        <button onClick={async () => {
          clearInterval(countdownTimerRef.current!); clearInterval(pollRef.current!);
          if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
          if (requestId) await supabase.from('consultation_requests').update({ status: 'cancelled' }).eq('id', requestId);
          handleReset();
        }} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
          Cancel search
        </button>
      </div>
    </PopupShell>
  );

  if (step === 'match_accepted') return (
    <PopupShell onClose={handleClose} title="Voice Assistant">
      <div className="px-5 pb-6 flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Stethoscope className="w-10 h-10 text-green-600" />
        </div>
        <p className="text-xl font-bold text-foreground">Doctor Accepted! 🎉</p>
        {acceptedDoctor && (
          <div className="bg-card border border-border rounded-2xl p-4 w-full text-left space-y-1">
            <p className="text-base font-bold text-foreground">Dr. {acceptedDoctor.full_name}</p>
            <p className="text-sm text-muted-foreground">{acceptedDoctor.specialization}</p>
          </div>
        )}
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    </PopupShell>
  );

  if (step === 'no_match') return (
    <PopupShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-6 space-y-4">
        {isSpeaking && <SpeakingBadge />}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <p className="font-semibold text-amber-800 mb-1">Symptoms Not Detected</p>
          <p className="text-sm text-amber-700">{lang ? NO_MATCH_TEXT[lang] : ''}</p>
          {result?.transcript ? <p className="text-xs text-amber-600 italic mt-2">"{result.transcript}"</p> : null}
        </div>
        <button onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 border-2 border-border text-muted-foreground font-semibold py-3 rounded-2xl hover:border-primary hover:text-primary transition-colors">
          <RotateCcw className="w-4 h-4" />Try Again
        </button>
      </div>
    </PopupShell>
  );

  // error
  return (
    <PopupShell onClose={handleClose} title="Voice Assistant" onBack={handleReset}>
      <div className="px-5 pb-6 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="font-semibold text-foreground">Something went wrong</p>
        <p className="text-sm text-muted-foreground">{errorMsg}</p>
        <button onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-2xl">
          <RotateCcw className="w-4 h-4" />Try Again
        </button>
      </div>
    </PopupShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function SpeakingBadge() {
  return (
    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
      <Volume2 className="w-4 h-4 text-primary animate-pulse" />
      <span className="text-sm text-primary font-medium">Speaking...</span>
    </div>
  );
}

function MicButton({ isListening, isSpeaking, volume, onClick }: {
  isListening: boolean; isSpeaking: boolean; volume: number; onClick?: () => void;
}) {
  return (
    <div className="relative flex items-center justify-center my-2">
      {isListening && (
        <>
          <span className="absolute rounded-full bg-primary/20"
            style={{ width: `${80 + volume * 50}px`, height: `${80 + volume * 50}px`, transition: 'width 0.08s, height 0.08s' }} />
          <span className="absolute w-28 h-28 rounded-full bg-primary/10 animate-ping" />
        </>
      )}
      <button onClick={onClick} disabled={isSpeaking}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
          isListening ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
        }`}>
        {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
      </button>
    </div>
  );
}

function TranscriptBox({ text }: { text: string }) {
  return (
    <div className="w-full bg-secondary rounded-2xl px-4 py-3">
      <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide font-bold">Transcript</p>
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}

// Centered popup (not bottom sheet)
function PopupShell({ children, title, onClose, onBack }: {
  children: React.ReactNode; title: string; onClose: () => void; onBack?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-background rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="sticky top-0 bg-background z-10 flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
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
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}
