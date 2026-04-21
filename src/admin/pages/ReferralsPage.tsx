import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, RefreshCw } from 'lucide-react';

export function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const fetchData = () => {
    setLoading(true);
    supabase.from('referrals').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setReferrals(data ?? []); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(referrals.filter(r => {
      const matchSearch = !q || r.referral_code?.toLowerCase().includes(q) || r.referrer_id?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    }));
  }, [search, statusFilter, referrals]);

  const handleRefresh = () => { setSpinning(true); fetchData(); setTimeout(() => setSpinning(false), 800); };

  const pending = referrals.filter(r => r.status === 'pending').length;
  const completed = referrals.filter(r => r.status === 'completed').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Total Referrals</p>
          <p className="text-2xl font-bold text-white">{referrals.length}</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{pending}</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">{completed}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code or referrer ID..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <button onClick={handleRefresh} className="h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">All Referrals ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-700">
              {['Referrer ID', 'Referred ID', 'Code Used', 'Status', 'Bonus Granted', 'Date', 'Completed'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No referrals found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{r.referrer_id?.substring(0, 12)}...</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{r.referred_id?.substring(0, 12)}...</td>
                  <td className="px-4 py-3 text-sm text-purple-400 font-mono font-bold">{r.referral_code}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3"><span className={`text-sm font-semibold ${r.bonus_granted ? 'text-green-400' : 'text-gray-500'}`}>{r.bonus_granted ? '✓ Yes' : '✗ No'}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{r.completed_at ? new Date(r.completed_at).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
