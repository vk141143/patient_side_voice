import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, RefreshCw } from 'lucide-react';

export function WalletsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  const fetchData = () => {
    setLoading(true);
    supabase.from('users').select('id, name, email, phone, wallet_balance, bonus_minutes, created_at')
      .order('wallet_balance', { ascending: false })
      .then(({ data }) => {
        const d = data ?? [];
        setUsers(d);
        setTotalBalance(d.reduce((s, u) => s + (u.wallet_balance ?? 0), 0));
        setLoading(false);
      });
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u => {
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const bal = u.wallet_balance ?? 0;
      const matchBal = balanceFilter === 'all'
        || (balanceFilter === 'high' && bal >= 500)
        || (balanceFilter === 'mid' && bal >= 100 && bal < 500)
        || (balanceFilter === 'low' && bal > 0 && bal < 100)
        || (balanceFilter === 'zero' && bal === 0);
      return matchSearch && matchBal;
    }));
  }, [search, balanceFilter, users]);

  const handleRefresh = () => { setSpinning(true); fetchData(); setTimeout(() => setSpinning(false), 800); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Total Wallet Balance</p>
          <p className="text-2xl font-bold text-teal-400">₹{totalBalance}</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Users with Balance</p>
          <p className="text-2xl font-bold text-white">{users.filter(u => (u.wallet_balance ?? 0) > 0).length}</p>
        </div>
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Avg. Balance</p>
          <p className="text-2xl font-bold text-white">₹{users.length ? Math.round(totalBalance / users.length) : 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
        </div>
        <select value={balanceFilter} onChange={e => setBalanceFilter(e.target.value)}
          className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
          <option value="all">All Balances</option>
          <option value="high">₹500+</option>
          <option value="mid">₹100–499</option>
          <option value="low">₹1–99</option>
          <option value="zero">Zero Balance</option>
        </select>
        <button onClick={handleRefresh} className="h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">Wallet Balances ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-700">
              {['User', 'Email', 'Phone', 'Wallet Balance', 'Bonus Minutes', 'Joined'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-medium">{u.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{u.phone || '—'}</td>
                  <td className="px-6 py-4"><span className={`text-sm font-bold ${(u.wallet_balance ?? 0) > 0 ? 'text-teal-400' : 'text-gray-500'}`}>₹{u.wallet_balance ?? 0}</span></td>
                  <td className="px-6 py-4 text-sm text-orange-400 font-semibold">{u.bonus_minutes ?? 0} min</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
