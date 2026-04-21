import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, Search, RefreshCw } from 'lucide-react';

export function HospitalVisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [spinning, setSpinning] = useState(false);

  const fetchVisits = async () => {
    const { data: apts, error: err } = await supabase
      .from('opd_appointments')
      .select('*')
      .order('appointment_date', { ascending: false })
      .order('time_slot', { ascending: true });

    if (err) { setError(err.message); setLoading(false); return; }
    if (!apts?.length) { setVisits([]); setLoading(false); return; }

    // Fetch doctor details
    const doctorIds = [...new Set(apts.map(a => a.doctor_id))];
    const { data: doctors } = await supabase
      .from('doctors')
      .select('firebase_uid, full_name, specialization, hospital_name, clinic_address, city')
      .in('firebase_uid', doctorIds);

    const doctorMap: Record<string, any> = {};
    doctors?.forEach(d => { doctorMap[d.firebase_uid] = d; });

    const merged = apts.map(a => ({ ...a, doctor: doctorMap[a.doctor_id] ?? null }));
    setVisits(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchVisits();

    const sub = supabase
      .channel('opd_admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opd_appointments' },
        () => fetchVisits()
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = visits.filter(v => {
      const matchSearch = !q ||
        v.patient_name?.toLowerCase().includes(q) ||
        v.patient_phone?.includes(q) ||
        v.doctor?.full_name?.toLowerCase().includes(q) ||
        v.doctor?.hospital_name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
    result = [...result].sort((a, b) => {
      const da = new Date(a.appointment_date ?? 0).getTime();
      const db = new Date(b.appointment_date ?? 0).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    setFiltered(result);
  }, [search, statusFilter, sortOrder, visits]);

  const handleRefresh = () => { setSpinning(true); fetchVisits(); setTimeout(() => setSpinning(false), 800); };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending:   'bg-yellow-500/10 text-yellow-400',
      attended:  'bg-green-500/10 text-green-400',
      cancelled: 'bg-red-500/10 text-red-400',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'bg-gray-700 text-gray-400'}`}>{status}</span>;
  };

  const paymentBadge = (method: string, pstatus: string) => (
    <div className="flex flex-col gap-1">
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${method === 'hospital' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
        {method === 'hospital' ? 'Pay at Hospital' : 'Pay Online'}
      </span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pstatus === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
        {pstatus === 'paid' ? 'Paid' : 'Pending'}
      </span>
    </div>
  );

  const counts = {
    all: visits.length,
    pending: visits.filter(v => v.status === 'pending').length,
    attended: visits.filter(v => v.status === 'attended').length,
    cancelled: visits.filter(v => v.status === 'cancelled').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['all', 'pending', 'attended', 'cancelled'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-2xl p-4 border text-left transition-all ${statusFilter === s ? 'border-teal-500 bg-teal-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
            <p className="text-xs text-gray-400 capitalize mb-1">{s}</p>
            <p className={`text-2xl font-bold ${s === 'attended' ? 'text-green-400' : s === 'cancelled' ? 'text-red-400' : s === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
              {counts[s]}
            </p>
          </button>
        ))}
      </div>

      {/* Search + Sort + Refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, phone, doctor or hospital..."
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700">
        <div className="overflow-auto" style={{ maxHeight: '60vh', scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
          <table style={{ minWidth: '1600px', width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1F2937', zIndex: 10 }}>
              <tr className="border-b border-gray-700">
                {['Patient', 'Phone', 'Doctor', 'Hospital', 'Date', 'Time', 'Fee', 'Payment', 'Status', 'Symptoms', 'Description', 'Report', 'Booked At'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={13} className="px-6 py-12 text-center text-gray-500">No hospital visits found</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium whitespace-nowrap">{v.patient_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-teal-400 whitespace-nowrap">{v.patient_phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                    {v.doctor?.full_name ? `Dr. ${v.doctor.full_name}` : '—'}
                    {v.doctor?.specialization && <p className="text-xs text-gray-500">{v.doctor.specialization}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-[160px]">
                    <p className="truncate">{v.doctor?.hospital_name || '—'}</p>
                    {v.doctor?.city && <p className="text-xs text-gray-500">{v.doctor.city}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                    {v.appointment_date ? new Date(v.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{v.time_slot || '—'}</td>
                  <td className="px-4 py-3 text-sm text-white font-semibold whitespace-nowrap">₹{v.fee ?? '—'}</td>
                  <td className="px-4 py-3">{paymentBadge(v.payment_method, v.payment_status)}</td>
                  <td className="px-4 py-3">{statusBadge(v.status)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400" style={{ maxWidth: 160 }}>
                    {v.symptoms?.length > 0 ? v.symptoms.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400" style={{ maxWidth: 200 }}>
                    {v.description || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {v.report_url
                      ? <a href={v.report_url} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline text-xs">View</a>
                      : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {v.created_at ? new Date(v.created_at).toLocaleString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
