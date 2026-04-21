import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Stethoscope, Clock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';

interface MatchingScreenProps {
  symptoms: string[];
  description?: string;
  duration?: string;
  severity?: string;
  reportUrl?: string;
  consultMode?: 'instant' | 'available';
  onMatched: (requestId: string, doctorId: string, sessionData: any) => void;
  onCancel: () => void;
  onBrowseDoctors: (requestId: string) => void;
}

export function MatchingScreen({
  symptoms, description, duration, severity, reportUrl, consultMode = 'instant',
  onMatched, onCancel, onBrowseDoctors,
}: MatchingScreenProps) {
  const [countdown, setCountdown] = useState(45);
  const [status, setStatus] = useState<'searching' | 'timeout' | 'accepted'>('searching');
  const [requestId, setRequestId] = useState<string | null>(null);
  const timerRef = useRef<any>(null);
  const pollRef = useRef<any>(null);
  const realtimeRef = useRef<any>(null);
  const matchedRef = useRef(false); // prevent double-fire

  // Get session by consultation_id with retries
  const getSessionAndNavigate = async (reqId: string, doctorId: string) => {
    if (matchedRef.current) return;
    matchedRef.current = true;

    let retries = 0;
    const find = async () => {
      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('consultation_id', reqId)
        .maybeSingle();

      if (data) {
        clearInterval(timerRef.current);
        clearInterval(pollRef.current);
        if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
        setStatus('accepted');
        setTimeout(() => onMatched(reqId, doctorId, data), 800);
      } else if (retries < 10) {
        retries++;
        setTimeout(find, 1000); // retry — doctor may not have created session yet
      } else {
        // Fallback: navigate with just the request ID
        clearInterval(timerRef.current);
        clearInterval(pollRef.current);
        setStatus('accepted');
        setTimeout(() => onMatched(reqId, doctorId, null), 800);
      }
    };
    find();
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    const createRequest = async () => {
      const { data: userRow } = await supabase
        .from('users').select('name').eq('id', user.uid).maybeSingle();
      const patientName = userRow?.name || user.displayName || user.email || 'Patient';

      const { data, error } = await supabase
        .from('consultation_requests')
        .insert({
          patient_id: user.uid,
          patient_name: patientName,
          specialty: symptoms[0] ?? 'General Physician',
          description: description ?? null,
          duration: duration ?? null,
          severity: severity ?? null,
          report_url: reportUrl ?? null,
          status: 'searching',
          call_type: 'chat',
          consult_mode: consultMode,
        })
        .select('id')
        .single();

      if (error || !data) { console.error('Request create error:', error); return; }
      const reqId = data.id;
      setRequestId(reqId);

      // 1. Realtime subscription — instant detection
      realtimeRef.current = supabase
        .channel(`req_watch_${reqId}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'consultation_requests' },
          (payload) => {
            const updated = payload.new as any;
            if (updated.id === reqId && updated.status === 'accepted' && updated.doctor_id) {
              getSessionAndNavigate(reqId, updated.doctor_id);
            }
          })
        .subscribe();

      // 2. Poll every 3s as backup
      pollRef.current = setInterval(async () => {
        const { data: updated } = await supabase
          .from('consultation_requests')
          .select('status, doctor_id')
          .eq('id', reqId)
          .single();
        if (updated?.status === 'accepted' && updated?.doctor_id) {
          clearInterval(pollRef.current);
          getSessionAndNavigate(reqId, updated.doctor_id);
        }
      }, 3000);
    };

    createRequest();

    // 45s countdown
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setStatus('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(pollRef.current);
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, []);

  useEffect(() => {
    if (status === 'timeout' && requestId) {
      supabase.from('consultation_requests').update({ status: 'timeout' }).eq('id', requestId);
    }
  }, [status, requestId]);

  const handleCancel = async () => {
    clearInterval(timerRef.current);
    clearInterval(pollRef.current);
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    if (requestId) await supabase.from('consultation_requests').update({ status: 'cancelled' }).eq('id', requestId);
    onCancel();
  };

  if (status === 'timeout') {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">No doctors responded</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          No {symptoms[0]} doctor accepted your request. Browse available doctors to chat directly.
        </p>
        <Button variant="hero" size="xl" className="w-full mb-3" onClick={() => onBrowseDoctors(requestId!)}>
          <Users className="w-5 h-5" /> Browse Available Doctors
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={handleCancel}>Cancel</Button>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 animate-pulse">
          <Stethoscope className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Doctor accepted!</h2>
        <p className="text-muted-foreground">Connecting you now...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6">
      <button onClick={handleCancel} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
        <X className="w-5 h-5 text-muted-foreground" />
      </button>
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150 animate-pulse" />
        <div className="relative w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-lg">
              <Stethoscope className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-foreground text-center mb-2">Finding the best doctor for you...</h2>
      <p className="text-muted-foreground text-center mb-6">
        {consultMode === 'instant' ? '⚡ Instant match · 5 min chat' : '👥 Matching with available doctors'} · {symptoms[0] || 'General Physician'}
      </p>
      <div className="bg-card rounded-2xl px-6 py-4 shadow-sm border border-border/50 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estimated wait</p>
            <p className="text-xl font-bold text-foreground">{countdown} seconds</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {symptoms.map(s => <span key={s} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full">{s}</span>)}
      </div>
      <Button variant="ghost" className="text-muted-foreground" onClick={handleCancel}>Cancel search</Button>
    </div>
  );
}
