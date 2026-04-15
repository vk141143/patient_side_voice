import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Video, PhoneOff, Paperclip, Send, CheckCheck, Info, Download, X, FileText, Camera, FolderOpen, Clock, Wallet } from 'lucide-react';
import { Doctor, Message, Prescription } from '@/types/app';
import doctorFemale from '@/assets/doctor-female.jpg';
import { useApp } from '@/context/AppContext';

interface ChatScreenProps {
  doctor: Doctor;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onEndSession: () => void;
  onBack: () => void;
  onDownloadPrescription?: () => void;
  currentPrescription?: Prescription | null;
  consultationFee?: number;
}

const EXTEND_OPTIONS = [
  { label: '+2 minutes', seconds: 120, price: 20 },
  { label: '+5 minutes', seconds: 300, price: 49 },
  { label: '+10 minutes', seconds: 600, price: 79 },
];

export function ChatScreen({
  doctor, messages, onSendMessage, onEndSession, onBack,
  onDownloadPrescription, currentPrescription, consultationFee = 0,
}: ChatScreenProps) {
  const { walletBalance, setWalletBalance } = useApp();
  const [input, setInput] = useState('');
  const [sessionTime, setSessionTime] = useState(120); // 2 minutes
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [showTimerEnd, setShowTimerEnd] = useState(false);
  const [closeCountdown, setCloseCountdown] = useState(10);
  const [extendSlide, setExtendSlide] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [timerEndShown, setTimerEndShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => {
        if (prev <= 0) { clearInterval(timer); return 0; }
        if (prev === 60 && !warningShown) { setWarningShown(true); setShowWarning(true); }
        if (prev === 1 && !timerEndShown) { setTimerEndShown(true); }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [warningShown, timerEndShown]);

  // Show timer-end popup when session hits 0
  useEffect(() => {
    if (sessionTime === 0 && !showTimerEnd) setShowTimerEnd(true);
  }, [sessionTime]);

  // Close countdown
  useEffect(() => {
    if (!showTimerEnd) return;
    if (closeCountdown <= 0) { onEndSession(); return; }
    const t = setTimeout(() => setCloseCountdown(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [showTimerEnd, closeCountdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (input.trim()) { onSendMessage(input.trim()); setInput(''); }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttach(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'image') onSendMessage(`📷 Sent an image: ${file.name}`);
      else onSendMessage(`📎 Sent a file: ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmEnd = () => {
    if (consultationFee > 0) setWalletBalance(Math.max(0, walletBalance - consultationFee));
    setShowEndConfirm(false);
    onEndSession();
  };

  const handleExtendSelect = (opt: typeof EXTEND_OPTIONS[0]) => {
    if (walletBalance < opt.price) return;
    setWalletBalance(walletBalance - opt.price);
    setSessionTime(prev => prev + opt.seconds);
    setShowExtend(false);
    setExtendSlide(0);
  };

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && extendSlide === 0) setExtendSlide(1);
    if (diff < -50 && extendSlide === 1) setExtendSlide(0);
  };

  const isLow = sessionTime <= 60;
  const isVeryLow = sessionTime <= 30;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border shadow-sm">
        <button onClick={() => setShowEndConfirm(true)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <img src={doctorFemale} alt={doctor.name} className="w-11 h-11 rounded-full object-cover border-2 border-primary/20" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-foreground truncate">{doctor.name}</h2>
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">{doctor.specialization} • ⭐ {doctor.rating}</p>
        </div>
        {/* Timer */}
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
          isVeryLow ? 'bg-destructive text-destructive-foreground animate-pulse' :
          isLow ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
        }`}>
          ⏱ {formatTime(sessionTime)}
        </div>
      </div>

      {/* 1-min warning banner */}
      {showWarning && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm font-semibold text-destructive">1 minute left in your session!</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowWarning(false); setShowExtend(true); }}
              className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold"
            >
              Extend
            </button>
            <button onClick={() => setShowWarning(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <Button variant="heroSecondary" className="flex-1 h-11" onClick={() => {}}>
            <Video className="w-4 h-4" /> Video Call
          </Button>
          <Button variant="outline" className="flex-1 h-11 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setShowEndConfirm(true)}>
            <PhoneOff className="w-4 h-4" /> End Conversation
          </Button>
        </div>

        {/* AI Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">AI Symptom Summary</p>
              <p className="text-xs text-muted-foreground">Based on your inputs: fever, cold symptoms. Doctor will review.</p>
            </div>
          </div>
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'prescription' ? (
              <div className="chat-bubble chat-bubble-doctor bg-success/10 border-success/30">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-success" />
                  <p className="font-medium text-foreground">Prescription Shared</p>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{msg.text}</p>
                <Button variant="outline" size="sm" onClick={onDownloadPrescription} className="w-full">
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
              </div>
            ) : (
              <div className={`chat-bubble ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-doctor'}`}>
                <p>{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] opacity-60">
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'user' && msg.read && <CheckCheck className="w-3 h-3 opacity-60" />}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Extend time bar */}
      {isLow && !showExtend && (
        <div className="px-4 py-2 bg-destructive/5 border-t border-destructive/20 flex items-center justify-between">
          <p className="text-xs text-destructive font-medium">Session ending soon</p>
          <button
            onClick={() => setShowExtend(true)}
            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold"
          >
            + Add Time
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pb-6 pt-2 bg-card border-t border-border relative">
        {showAttach && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAttach(false)} />
            <div className="absolute bottom-full left-4 mb-3 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden w-48">
              <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors border-b border-border"
                onClick={() => { setShowAttach(false); cameraInputRef.current?.click(); }}>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Camera</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors"
                onClick={() => { setShowAttach(false); fileInputRef.current?.click(); }}>
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-accent" />
                </div>
                <span className="text-sm font-medium text-foreground">Upload File</span>
              </button>
            </div>
          </>
        )}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelected(e, 'image')} />
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileSelected(e, 'file')} />

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
              className="absolute right-1 top-1 w-10 h-10 rounded-full gradient-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* End Conversation Confirm */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
          <div className="relative w-full max-w-sm bg-background rounded-2xl p-6 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <PhoneOff className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground text-center mb-2">End Conversation?</h3>
            <p className="text-sm text-muted-foreground text-center mb-3 leading-relaxed">
              Are you sure you want to end this consultation? Your chat history will be saved.
            </p>
            {consultationFee > 0 && (
              <div className="flex items-center justify-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 mb-5">
                <Wallet className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  ₹{consultationFee} will be deducted from wallet
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowEndConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={handleConfirmEnd}>Yes, End</Button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Time Wizard */}
      {showExtend && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowExtend(false); setExtendSlide(0); }} />
          <div className="relative w-full max-w-md bg-background rounded-t-3xl overflow-hidden"
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

            {/* Handle + close */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Extra Time</h3>
              <button onClick={() => { setShowExtend(false); setExtendSlide(0); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Wallet balance */}
            <div className="flex items-center gap-2 px-5 py-3 bg-primary/5 border-b border-border">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Wallet Balance:</span>
              <span className="text-sm font-bold text-primary">₹{walletBalance}</span>
            </div>

            {/* Slide indicator */}
            <div className="flex justify-center gap-1.5 pt-3">
              {[0, 1].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${extendSlide === i ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`} />
              ))}
            </div>

            {/* Slide 0 — prompt */}
            <div className="overflow-hidden">
              <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${extendSlide * 100}%)` }}>
                {/* Slide 0 */}
                <div className="w-full flex-shrink-0 px-5 py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-2">Need more time?</h4>
                  <p className="text-sm text-muted-foreground mb-6">Swipe left or tap below to choose an extension plan</p>
                  <Button variant="hero" size="lg" className="w-full" onClick={() => setExtendSlide(1)}>
                    View Plans →
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">Amount will be deducted from your wallet</p>
                </div>

                {/* Slide 1 — options */}
                <div className="w-full flex-shrink-0 px-5 py-5 space-y-3">
                  {EXTEND_OPTIONS.map(opt => {
                    const canAfford = walletBalance >= opt.price;
                    return (
                      <button key={opt.label}
                        onClick={() => handleExtendSelect(opt)}
                        disabled={!canAfford}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          canAfford
                            ? 'border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10'
                            : 'border-border bg-card opacity-50 cursor-not-allowed'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-foreground">{opt.label}</p>
                            {!canAfford && <p className="text-xs text-destructive">Insufficient balance</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">₹{opt.price}</p>
                        </div>
                      </button>
                    );
                  })}
                  <button onClick={() => setExtendSlide(0)} className="w-full text-center text-sm text-muted-foreground py-2">
                    ← Back
                  </button>
                </div>
              </div>
            </div>
            <div className="pb-8" />
          </div>
        </div>
      )}
      {/* Timer End Popup */}
      {showTimerEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-background rounded-2xl p-6 shadow-xl text-center">
            {/* Countdown ring */}
            <div className="w-20 h-20 rounded-full border-4 border-destructive flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-destructive">{closeCountdown}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Time's Up!</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Your session has ended. Closing chat in <span className="font-bold text-destructive">{closeCountdown}</span> seconds.
            </p>
            <div className="space-y-3">
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={() => {
                  setShowTimerEnd(false);
                  setCloseCountdown(10);
                  setShowExtend(true);
                  setExtendSlide(1);
                }}
              >
                <Clock className="w-4 h-4" /> Add More Time
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full text-destructive border-destructive/30"
                onClick={onEndSession}
              >
                End Chat Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
