import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';

export function AuditsPage() {
  const [activeTab, setActiveTab] = useState<'customer' | 'doctor'>('customer');
  const [customerLogs, setCustomerLogs] = useState<any[]>([]);
  const [doctorLogs, setDoctorLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [spinning, setSpinning] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      supabase.from('customer_login').select('*').order('login_at', { ascending: false }),
      supabase.from('login_logs').select('*').order('login_at', { ascending: false }),
    ]).then(([c, d]) => {
      if (c.error) console.error('customer_login error:', c.error);
      if (d.error) console.error('login_logs error:', d.error);
      setCustomerLogs(c.data ?? []);
      setDoctorLogs(d.data ?? []);
      if (c.error || d.error) setError((c.error?.message || d.error?.message) ?? null);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    const customerSub = supabase.channel('customer_login_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customer_login' },
        (payload) => setCustomerLogs(prev => [payload.new as any, ...prev]))
      .subscribe();
    const doctorSub = supabase.channel('login_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'login_logs' },
        (payload) => setDoctorLogs(prev => [payload.new as any, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(customerSub); supabase.removeChannel(doctorSub); };
  }, []);

  const handleRefresh = () => { setSpinning(true); fetchData(); setTimeout(() => setSpinning(false), 800); };

  const applyFilters = (rows: any[], dateField: string) => {
    let r = rows.filter(row => {
      const q = search.toLowerCase();
      const matchSearch = !q || row.email?.toLowerCase().includes(q) || row.ip_address?.includes(q);
      const matchStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchSearch && matchStatus;
    });
    r = [...r].sort((a, b) => {
      const da = new Date(a[dateField] ?? 0).getTime();
      const db = new Date(b[dateField] ?? 0).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return r;
  };

  const filteredCustomer = applyFilters(customerLogs, 'login_at');
  const filteredDoctor = applyFilters(doctorLogs, 'login_at');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setActiveTab('customer')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'customer' ? 'bg-teal-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          Customers ({customerLogs.length})
        </button>
        <button onClick={() => setActiveTab('doctor')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'doctor' ? 'bg-teal-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
          Doctors ({doctorLogs.length})
        </button>
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or IP..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
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
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 space-y-1">
          <p className="text-sm text-red-400 font-semibold">Error: {error}</p>
          <p className="text-xs text-gray-400">Fix: Run this in Supabase SQL Editor:</p>
          <code className="text-xs text-yellow-400 block bg-gray-900 rounded px-3 py-2">
            ALTER TABLE customer_login ENABLE ROW LEVEL SECURITY;<br/>
            CREATE POLICY "allow_read" ON customer_login FOR SELECT USING (true);<br/>
            ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;<br/>
            CREATE POLICY "allow_read" ON login_logs FOR SELECT USING (true);
          </code>
        </div>
      )}

      {activeTab === 'customer' && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700" style={{ maxHeight: '500px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ overflow: 'auto', maxHeight: '500px', scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
            <table style={{ minWidth: '1100px', width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#1F2937', zIndex: 10 }}>
                <tr className="border-b border-gray-700">
                  {['Email', 'IP Address', 'City', 'Region', 'Country', 'Coordinates', 'Device', 'Browser', 'OS', 'Status', 'Login At'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredCustomer.length === 0 ? (
                  <tr><td colSpan={11} className="px-6 py-12 text-center text-gray-500">No customer login records found</td></tr>
                ) : filteredCustomer.map(row => (
                  <tr key={row.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-teal-400 whitespace-nowrap" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.email || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{row.ip_address || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{row.location_city || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{row.location_region || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{row.location_country || '—'}</td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                      {row.latitude && row.longitude
                        ? <a href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
                            {Number(row.latitude).toFixed(4)}, {Number(row.longitude).toFixed(4)}
                          </a>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{row.device_type || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{row.browser || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{row.os || '—'}</td>
                    <td className="px-3 py-2.5">
                      {row.status === 'success'
                        ? <span className="flex items-center gap-1 text-xs font-semibold text-green-400"><CheckCircle className="w-3 h-3" /> success</span>
                        : <span className="flex items-center gap-1 text-xs font-semibold text-red-400"><XCircle className="w-3 h-3" /> {row.status || 'failed'}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {row.login_at ? new Date(row.login_at).toLocaleString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctor Tab */}
      {activeTab === 'doctor' && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700">
          <div style={{ overflow: 'auto', maxHeight: '480px', scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
            <table style={{ minWidth: '1500px', width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#1F2937', zIndex: 10 }}>
                <tr className="border-b border-gray-700">
                  {['Email', 'Firebase UID', 'IP Address', 'Location', 'Coordinates', 'Device Info', 'Online', 'Chat', 'OPD', 'Status', 'Login At', 'Online Changed At'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredDoctor.length === 0 ? (
                  <tr><td colSpan={12} className="px-6 py-12 text-center text-gray-500">No doctor login records found</td></tr>
                ) : filteredDoctor.map(row => (
                  <tr key={row.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-teal-400 whitespace-nowrap" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.email || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.firebase_uid || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{row.ip_address || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.location_name || '—'}</td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                      {row.latitude && row.longitude
                        ? <a href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">
                            {Number(row.latitude).toFixed(4)}, {Number(row.longitude).toFixed(4)}
                          </a>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.device_info || '—'}</td>
                    <td className="px-3 py-2.5">
                      {row.is_online
                        ? <span className="flex items-center gap-1 text-xs font-semibold text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Online</span>
                        : <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> Offline</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.chat_enabled
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400">On</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-700 text-gray-500">Off</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.opd_enabled
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400">On</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-700 text-gray-500">Off</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.status === 'success'
                        ? <span className="flex items-center gap-1 text-xs font-semibold text-green-400"><CheckCircle className="w-3 h-3" /> success</span>
                        : <span className="flex items-center gap-1 text-xs font-semibold text-red-400"><XCircle className="w-3 h-3" /> {row.status || 'failed'}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {row.login_at ? new Date(row.login_at).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {row.online_changed_at ? new Date(row.online_changed_at).toLocaleString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
