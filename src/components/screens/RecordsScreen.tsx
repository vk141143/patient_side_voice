import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ClipboardList, MessageSquare, Download, ChevronRight, Clock, Hospital, Loader2 } from 'lucide-react';
import { Prescription } from '@/types/app';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth';

interface RecordsScreenProps {
  onBack: () => void;
  onViewPrescription: (prescription: Prescription) => void;
}

const tabs = [
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  { id: 'reports',       label: 'Reports',       icon: ClipboardList },
  { id: 'consultations', label: 'History',        icon: MessageSquare },
];

export function RecordsScreen({ onBack, onViewPrescription }: RecordsScreenProps) {
  const [activeTab, setActiveTab] = useState('consultations');
  const [consultations, setConsultations] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    const loadHistory = async () => {
      setLoading(true);

      // Instant chat sessions
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id, doctor_name, specialty, started_at, ended_at, status')
        .eq('patient_id', user.uid)
        .order('started_at', { ascending: false });

      // OPD appointments — query by patient_name (from DB) or fallback to uid match
      const { data: userRow } = await supabase.from('users').select('name').eq('id', user.uid).maybeSingle();
      const patientName = userRow?.name ?? '';

      const { data: opd } = await supabase
        .from('opd_appointments')
        .select('id, appointment_date, time_slot, status, fee, doctor_id')
        .eq('patient_name', patientName)
        .order('appointment_date', { ascending: false });

      // Fetch doctor details for OPD appointments separately
      const doctorIds = [...new Set((opd ?? []).map(o => o.doctor_id).filter(Boolean))];
      const { data: opdDoctors } = doctorIds.length
        ? await supabase.from('doctors').select('firebase_uid, full_name, specialization').in('firebase_uid', doctorIds)
        : { data: [] };
      const doctorMap: Record<string, any> = {};
      (opdDoctors ?? []).forEach(d => { doctorMap[d.firebase_uid] = d; });

      const chatItems = (sessions ?? []).map(s => {
        const start = s.started_at ? new Date(s.started_at) : null;
        const end   = s.ended_at   ? new Date(s.ended_at)   : null;
        const durationMin = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;
        return {
          id: s.id,
          type: 'chat' as const,
          doctorName: s.doctor_name ?? 'Doctor',
          specialty: s.specialty ?? '',
          date: s.started_at ?? '',
          duration: durationMin ? `${durationMin} min` : null,
          slot: null,
          status: s.status,
          fee: null,
        };
      });

      const opdItems = (opd ?? []).map(o => ({
        id: o.id,
        type: 'opd' as const,
        doctorName: doctorMap[o.doctor_id]?.full_name ?? 'Doctor',
        specialty: doctorMap[o.doctor_id]?.specialization ?? '',
        date: o.appointment_date ?? '',
        duration: null,
        slot: o.time_slot,
        status: o.status,
        fee: o.fee,
      }));

      const all = [...chatItems, ...opdItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setConsultations(all);

      // Prescriptions from chat_prescriptions
      const { data: rxList } = await supabase
        .from('chat_prescriptions')
        .select('id, doctor_name, doctor_specialty, diagnosis, created_at')
        .eq('patient_id', user.uid)
        .order('created_at', { ascending: false });

      setPrescriptions(rxList ?? []);
      setLoading(false);
    };

    loadHistory();
  }, []);

  const statusBadge = (status: string, type: string) => {
    const label = type === 'chat' ? 'Chat' : 'OPD';
    const color = ['ended', 'completed', 'attended'].includes(status)
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'pending' ? 'bg-amber-100 text-amber-700'
      : 'bg-gray-100 text-gray-600';
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${color}`}>{label}</span>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Health Records</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">Your digital medical locker</p>
      </div>

      {/* Tabs */}
      <div className="px-5 -mt-3">
        <div className="bg-card rounded-2xl p-1.5 shadow-md border border-border/50 flex gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : activeTab === 'consultations' ? (
          <div className="space-y-3">
            {consultations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No consultations yet</h3>
                <p className="text-sm text-muted-foreground">Your consultations will appear here</p>
              </div>
            ) : consultations.map(item => (
              <div key={`${item.type}-${item.id}`} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.type === 'chat' ? 'bg-primary/10' : 'bg-emerald-100'
                  }`}>
                    {item.type === 'chat'
                      ? <MessageSquare className="w-5 h-5 text-primary" />
                      : <Hospital className="w-5 h-5 text-emerald-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">Dr. {item.doctorName}</p>
                      {statusBadge(item.status, item.type)}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.specialty}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {item.slot && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />{item.slot}
                        </span>
                      )}
                      {item.duration && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />{item.duration}
                        </span>
                      )}
                      {item.fee && (
                        <span className="text-xs font-semibold text-primary">₹{item.fee}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'prescriptions' ? (
          <div className="space-y-3">
            {prescriptions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No prescriptions yet</h3>
                <p className="text-sm text-muted-foreground">Your prescriptions will appear here</p>
              </div>
            ) : prescriptions.map(rx => (
              <div key={rx.id} className="bg-card rounded-xl p-4 border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Dr. {rx.doctor_name}</p>
                    <p className="text-xs text-muted-foreground">{rx.doctor_specialty}</p>
                    {rx.diagnosis && <p className="text-xs text-muted-foreground mt-0.5 truncate">{rx.diagnosis}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Reports tab
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No reports yet</h3>
            <p className="text-sm text-muted-foreground">Your uploaded reports will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
