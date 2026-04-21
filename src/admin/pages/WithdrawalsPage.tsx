import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Check, X, Eye, RefreshCw } from 'lucide-react';

function DoctorEarningsModal({ doctor, onClose }: { doctor: any; onClose: () => void }) {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch OPD earnings from opd_appointments
    Promise.all([
      supabase.from('opd_appointments')
        .select('fee, appointment_date, time_slot, patient_name, payment_status')
        .eq('doctor_id', doctor.firebase_uid)
        .eq('status', 'attended')
        .order('appointment_date', { ascending: false }),
    ]).then(([opd]) => {
      const opdRows = (opd.data ?? []).map((r: any) => ({ ...r, source: 'OPD' }));
      setEarnings(opdRows);
      setLoading(false);
    });
  }, [doctor.firebase_uid]);

  const opdTotal = earnings.filter(e => e.source === 'OPD').reduce((s, e) => s + (e.fee ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">Dr. {doctor.full_name}</h3>
            <p className="text-xs text-gray-400">{doctor.specialization}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="bg-teal-500/10 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">OPD Earnings</p>
            <p className="text-xl font-bold text-teal-400">₹{opdTotal}</p>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-xl font-bold text-white">₹{opdTotal}</p>
          </div>
        </div>

        {/* Earnings list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : earnings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No earnings yet</p>
          ) : earnings.map((e, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm text-white font-medium">{e.patient_name ?? '—'}</p>
                <p className="text-xs text-gray-500">{e.appointment_date} · {e.time_slot}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-teal-400">₹{e.fee}</p>
                <span className="text-xs bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full">{e.source}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WithdrawalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [spinning, setSpinning] = useState(false);
  const [viewDoctor, setViewDoctor] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('doctor_withdraw_requests')
      .select('*')
      .order('requested_at', { ascending: false });
    if (error) console.error('withdraw fetch error:', error);

    if (!data?.length) { setRequests([]); setLoading(false); return; }

    // Fetch doctor details
    const doctorIds = [...new Set(data.map(r => r.doctor_id))];
    const { data: doctors } = await supabase
      .from('doctors')
      .select('firebase_uid, full_name, specialization, hospital_name, selfie_url, account_holder, account_number, ifsc_code')
      .in('firebase_uid', doctorIds);

    const doctorMap: Record<string, any> = {};
    doctors?.forEach(d => { doctorMap[d.firebase_uid] = d; });

    setRequests(data.map(r => ({ ...r, doctor: doctorMap[r.doctor_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    const sub = supabase.channel('withdraw_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctor_withdraw_requests' }, fetchRequests)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = requests.filter(r => {
      const matchSearch = !q || r.doctor?.full_name?.toLowerCase().includes(q) || r.doctor_name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
    result = [...result].sort((a, b) => {
      const da = new Date(a.requested_at ?? 0).getTime();
      const db = new Date(b.requested_at ?? 0).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    setFiltered(result);
  }, [search, statusFilter, sortOrder, requests]);

  const handleRefresh = () => { setSpinning(true); fetchRequests(); setTimeout(() => setSpinning(false), 800); };

  const handleAction = async (id: string, status: 'completed' | 'rejected') => {
    setActionLoading(id);
    const { error } = await supabase.from('doctor_withdraw_requests').update({ status }).eq('id', id);
    if (error) console.error('withdraw update error:', error);
    await fetchRequests();
    setActionLoading(null);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending:   'bg-yellow-500/10 text-yellow-400',
      completed: 'bg-green-500/10 text-green-400',
      rejected:  'bg-red-500/10 text-red-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] ?? 'bg-gray-700 text-gray-400'}`}>{s}</span>;
  };

  const counts = {
    all:       requests.length,
    pending:   requests.filter(r => r.status === 'pending').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected:  requests.filter(r => r.status === 'rejected').length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['all', 'pending', 'completed', 'rejected'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-2xl p-4 border text-left transition-all ${statusFilter === s ? 'border-teal-500 bg-teal-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
            <p className="text-xs text-gray-400 capitalize mb-1">{s}</p>
            <p className={`text-2xl font-bold ${s === 'completed' ? 'text-green-400' : s === 'rejected' ? 'text-red-400' : s === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
              {counts[s]}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search doctor name..."
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
          <table style={{ minWidth: '1200px', width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1F2937', zIndex: 10 }}>
              <tr className="border-b border-gray-700">
                {['Doctor', 'Specialization', 'OPD Amount', 'Chat Amount', 'Total', 'Period', 'Bank Details', 'Status', 'Requested At', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-500">No withdrawal requests</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.doctor?.selfie_url
                        ? <img src={r.doctor.selfie_url} className="w-8 h-8 rounded-full object-cover border border-gray-600" />
                        : <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center"><span className="text-xs font-bold text-teal-400">{(r.doctor?.full_name ?? 'D').charAt(0)}</span></div>
                      }
                      <span className="text-sm text-white font-medium whitespace-nowrap">Dr. {r.doctor?.full_name ?? r.doctor_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{r.doctor?.specialization ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-teal-400 whitespace-nowrap">₹{r.opd_amount}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-400 whitespace-nowrap">₹{r.chat_amount}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white whitespace-nowrap">₹{r.total_amount}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {r.period_from && r.period_to
                      ? <>{new Date(r.period_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} → {new Date(r.period_to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {r.doctor?.account_number ? (
                      <div>
                        <p>{r.doctor.account_holder}</p>
                        <p className="font-mono">{r.doctor.account_number}</p>
                        <p>{r.doctor.ifsc_code}</p>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(r.status)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {r.requested_at ? new Date(r.requested_at).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewDoctor(r.doctor)} title="View Earnings"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-teal-500/20 text-gray-400 hover:text-teal-400 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(r.id, 'completed')} disabled={actionLoading === r.id} title="Mark Completed"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleAction(r.id, 'rejected')} disabled={actionLoading === r.id} title="Reject"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewDoctor && <DoctorEarningsModal doctor={viewDoctor} onClose={() => setViewDoctor(null)} />}
    </div>
  );
}
