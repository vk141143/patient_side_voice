import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, RefreshCw, MessageSquare, FileText, X, ChevronRight } from 'lucide-react';

// ── Chat History Modal ──────────────────────────────────────────────
function ChatHistoryModal({ session, onClose }: { session: any; onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('instant_chat_messages').select('*').eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setMessages(data ?? []); setLoading(false); });
  }, [session.id]);

  const renderMsg = (msg: any) => {
    const isPatient = msg.sender_role === 'patient';
    return (
      <div key={msg.id} className={`flex ${isPatient ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isPatient ? 'bg-teal-500/20 text-teal-100 rounded-br-sm' : 'bg-gray-700 text-gray-100 rounded-bl-sm'}`}>
          <p className="text-xs font-semibold mb-0.5 opacity-70">{isPatient ? session.patient_name : `Dr. ${session.doctor_name}`}</p>
          {(msg.type === 'text' || msg.type === 'system') && <p className="text-sm">{msg.content}</p>}
          {msg.type === 'image' && (
            <a href={msg.file_url} target="_blank" rel="noreferrer">
              <img src={msg.file_url} className="max-w-[200px] rounded-xl" alt={msg.file_name} />
            </a>
          )}
          {msg.type === 'file' && (
            <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-teal-400 hover:underline">
              <FileText className="w-4 h-4" /><span className="text-sm">{msg.file_name ?? 'Document'}</span>
            </a>
          )}
          {msg.type === 'prescription' && (
            <div className="flex items-center gap-2 text-green-400">
              <FileText className="w-4 h-4" /><span className="text-sm font-semibold">Prescription sent</span>
            </div>
          )}
          <p className="text-[10px] opacity-50 mt-1 text-right">
            {new Date(msg.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">Chat History</h3>
            <p className="text-xs text-gray-400">{session.patient_name} ↔ Dr. {session.doctor_name} · {session.specialty}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No messages in this session</p>
          ) : messages.map(renderMsg)}
        </div>
        <div className="px-6 py-3 border-t border-gray-700 flex-shrink-0">
          <p className="text-xs text-gray-500">{messages.length} messages · Session {session.status}</p>
        </div>
      </div>
    </div>
  );
}

// ── Prescription Modal ──────────────────────────────────────────────
function PrescriptionModal({ session, onClose }: { session: any; onClose: () => void }) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('chat_prescriptions').select('*').eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPrescriptions(data ?? []); setLoading(false); });
  }, [session.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">Prescriptions</h3>
            <p className="text-xs text-gray-400">{session.patient_name} · Dr. {session.doctor_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : prescriptions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No prescriptions for this session</p>
          ) : prescriptions.map(p => (
            <div key={p.id} className="bg-gray-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" />
                <p className="text-sm font-bold text-white">Prescription</p>
                <span className="ml-auto text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</span>
              </div>
              {p.diagnosis && <div><p className="text-xs text-gray-500 mb-1">Diagnosis</p><p className="text-sm text-white">{p.diagnosis}</p></div>}
              {p.advice?.length > 0 && (
                <div><p className="text-xs text-gray-500 mb-1">Advice</p>
                  <ul className="space-y-1">{p.advice.map((a: string, i: number) => <li key={i} className="text-sm text-gray-300">• {a}</li>)}</ul>
                </div>
              )}
              {p.medicines && (
                <div><p className="text-xs text-gray-500 mb-2">Medicines</p>
                  <div className="space-y-2">
                    {(Array.isArray(p.medicines) ? p.medicines : []).map((m: any, i: number) => (
                      <div key={i} className="bg-gray-700 rounded-lg px-3 py-2">
                        <p className="text-sm font-semibold text-white">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.dosage} · {m.duration} · {m.timing}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Journey Modal ───────────────────────────────────────────────────
function JourneyModal({ session, onClose }: { session: any; onClose: () => void }) {
  const req = session.consultation_request;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700 flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h3 className="text-base font-bold text-white">Consultation Journey</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">1</div><div className="w-0.5 flex-1 bg-gray-700 mt-1" /></div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-white">Patient searched for doctor</p>
              <p className="text-xs text-gray-400 mt-1">Specialty: <span className="text-teal-400">{session.specialty}</span></p>
              {req?.description && <p className="text-xs text-gray-400 mt-1">Description: {req.description}</p>}
              {req?.severity && <p className="text-xs text-gray-400">Severity: {req.severity}</p>}
              {req?.duration && <p className="text-xs text-gray-400">Duration: {req.duration}</p>}
              {req?.report_url && <a href={req.report_url} target="_blank" rel="noreferrer" className="text-xs text-teal-400 hover:underline">View attached report</a>}
              <p className="text-xs text-gray-600 mt-1">{req?.created_at ? new Date(req.created_at).toLocaleString('en-IN') : ''}</p>
            </div>
          </div>
          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">2</div><div className="w-0.5 flex-1 bg-gray-700 mt-1" /></div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-white">Doctor accepted</p>
              <p className="text-xs text-gray-400 mt-1">Dr. {session.doctor_name}</p>
              <p className="text-xs text-gray-600">{session.started_at ? new Date(session.started_at).toLocaleString('en-IN') : ''}</p>
            </div>
          </div>
          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${session.status === 'ended' ? 'bg-teal-500' : 'bg-gray-600'}`}>3</div></div>
            <div>
              <p className="text-sm font-semibold text-white">Chat {session.status === 'ended' ? 'completed' : 'in progress'}</p>
              {session.ended_at && <p className="text-xs text-gray-400 mt-1">Ended: {new Date(session.ended_at).toLocaleString('en-IN')}</p>}
              {session.duration_minutes > 0 && <p className="text-xs text-gray-400">Duration: {session.duration_minutes} min</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export function ConsultationsMonitorPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [spinning, setSpinning] = useState(false);
  const [chatModal, setChatModal] = useState<any | null>(null);
  const [rxModal, setRxModal] = useState<any | null>(null);
  const [journeyModal, setJourneyModal] = useState<any | null>(null);

  const fetchSessions = async () => {
    const { data: sess } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (!sess?.length) { setSessions([]); setLoading(false); return; }

    // Fetch consultation requests (has fee, call_type, consult_mode)
    const consultIds = sess.filter(s => s.consultation_id).map(s => s.consultation_id);
    const { data: reqs } = consultIds.length
      ? await supabase.from('consultation_requests').select('*').in('id', consultIds)
      : { data: [] };

    const reqMap: Record<string, any> = {};
    (reqs ?? []).forEach(r => { reqMap[r.id] = r; });

    setSessions(sess.map(s => ({ ...s, consultation_request: s.consultation_id ? reqMap[s.consultation_id] : null })));
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
    const sub = supabase.channel('sessions_monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, fetchSessions)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = sessions.filter(s => {
      const matchSearch = !q || s.patient_name?.toLowerCase().includes(q) || s.doctor_name?.toLowerCase().includes(q) || s.specialty?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
    result = [...result].sort((a, b) => {
      const da = new Date(a.started_at ?? 0).getTime();
      const db = new Date(b.started_at ?? 0).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    setFiltered(result);
  }, [search, statusFilter, sortOrder, sessions]);

  const handleRefresh = () => { setSpinning(true); fetchSessions(); setTimeout(() => setSpinning(false), 800); };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { active: 'bg-green-500/10 text-green-400', ended: 'bg-gray-700 text-gray-400', expired: 'bg-red-500/10 text-red-400' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] ?? 'bg-gray-700 text-gray-400'}`}>{s}</span>;
  };

  const counts = { all: sessions.length, active: sessions.filter(s => s.status === 'active').length, ended: sessions.filter(s => s.status === 'ended').length };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['all', 'active', 'ended'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-2xl p-4 border text-left transition-all ${statusFilter === s ? 'border-teal-500 bg-teal-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
            <p className="text-xs text-gray-400 capitalize mb-1">{s}</p>
            <p className={`text-2xl font-bold ${s === 'active' ? 'text-green-400' : 'text-white'}`}>{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, doctor or specialty..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
        </div>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
          className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <button onClick={handleRefresh} className="h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700">
        <div className="overflow-auto" style={{ maxHeight: '60vh', scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
          <table style={{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1F2937', zIndex: 10 }}>
              <tr className="border-b border-gray-700">
                {['Patient', 'Doctor', 'Specialty', 'Type', 'Fee', 'Status', 'Started At', 'Ended At', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">No consultations found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium whitespace-nowrap">{s.patient_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-teal-400 whitespace-nowrap">Dr. {s.doctor_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{s.specialty || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {s.consultation_request?.call_type
                      ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.consultation_request.call_type === 'video' ? 'bg-blue-500/10 text-blue-400' : 'bg-teal-500/10 text-teal-400'}`}>
                          {s.consultation_request.call_type}
                        </span>
                      : <span className="text-xs text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                    {s.consultation_request?.fee ? `₹${s.consultation_request.fee}` : '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(s.status)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{s.started_at ? new Date(s.started_at).toLocaleString('en-IN') : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{s.ended_at ? new Date(s.ended_at).toLocaleString('en-IN') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setJourneyModal(s)} title="Full Journey"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-teal-500/20 text-gray-400 hover:text-teal-400 transition-colors text-xs font-medium">
                        <ChevronRight className="w-3.5 h-3.5" /> Journey
                      </button>
                      <button onClick={() => setChatModal(s)} title="Chat History"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors text-xs font-medium">
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </button>
                      <button onClick={() => setRxModal(s)} title="Prescriptions"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors text-xs font-medium">
                        <FileText className="w-3.5 h-3.5" /> Rx
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {chatModal    && <ChatHistoryModal session={chatModal} onClose={() => setChatModal(null)} />}
      {rxModal      && <PrescriptionModal session={rxModal} onClose={() => setRxModal(null)} />}
      {journeyModal && <JourneyModal session={journeyModal} onClose={() => setJourneyModal(null)} />}
    </div>
  );
}
