import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, MapPin, RefreshCw } from 'lucide-react';

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [walletFilter, setWalletFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    supabase.from('users').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u => {
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
      const matchGender = genderFilter === 'all' || u.gender === genderFilter;
      const matchWallet = walletFilter === 'all'
        || (walletFilter === 'has' && (u.wallet_balance ?? 0) > 0)
        || (walletFilter === 'empty' && (u.wallet_balance ?? 0) === 0);
      return matchSearch && matchGender && matchWallet;
    }));
  }, [search, genderFilter, walletFilter, users]);

  const handleRefresh = () => { setSpinning(true); fetchUsers(); setTimeout(() => setSpinning(false), 800); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 h-11 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or phone..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none" />
        </div>
        <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}
          className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
          <option value="all">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <select value={walletFilter} onChange={e => setWalletFilter(e.target.value)}
          className="h-11 px-3 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none">
          <option value="all">All Wallets</option>
          <option value="has">Has Balance</option>
          <option value="empty">Empty Wallet</option>
        </select>
        <button onClick={handleRefresh} className="h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">All Users ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-700">
              {['Name', 'Email', 'Phone', 'Age', 'Gender', 'Wallet', 'Bonus Min', 'Referral Code', 'Location', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium whitespace-nowrap">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{u.age || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 capitalize">{u.gender || '—'}</td>
                  <td className="px-4 py-3 text-sm text-teal-400 font-semibold">₹{u.wallet_balance ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-orange-400 font-semibold">{u.bonus_minutes ?? 0} min</td>
                  <td className="px-4 py-3 text-sm text-purple-400 font-mono">{u.referral_code || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                    {u.location_lat ? (
                      <a href={`https://maps.google.com/?q=${u.location_lat},${u.location_lng}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:underline">
                        <MapPin className="w-3 h-3" />{u.location_city || 'View'}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
