import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Wallet, GitBranch, TrendingUp, UserCheck, Clock } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalWalletBalance: number;
  totalReferrals: number;
  completedReferrals: number;
  totalBonusMinutes: number;
  recentUsers: any[];
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalWalletBalance: 0, totalReferrals: 0,
    completedReferrals: 0, totalBonusMinutes: 0, recentUsers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [usersRes, referralsRes, recentRes] = await Promise.all([
        supabase.from('users').select('wallet_balance, bonus_minutes'),
        supabase.from('referrals').select('status'),
        supabase.from('users').select('name, email, created_at, wallet_balance').order('created_at', { ascending: false }).limit(5),
      ]);

      const users = usersRes.data ?? [];
      const referrals = referralsRes.data ?? [];

      setStats({
        totalUsers: users.length,
        totalWalletBalance: users.reduce((s, u) => s + (u.wallet_balance ?? 0), 0),
        totalReferrals: referrals.length,
        completedReferrals: referrals.filter(r => r.status === 'completed').length,
        totalBonusMinutes: users.reduce((s, u) => s + (u.bonus_minutes ?? 0), 0),
        recentUsers: recentRes.data ?? [],
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: 'Total Users',        value: stats.totalUsers,           icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    { label: 'Total Wallet (₹)',   value: `₹${stats.totalWalletBalance}`, icon: Wallet, color: 'text-teal-400',  bg: 'bg-teal-500/10' },
    { label: 'Total Referrals',    value: stats.totalReferrals,       icon: GitBranch,  color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Completed Referrals',value: stats.completedReferrals,   icon: UserCheck,  color: 'text-green-400',  bg: 'bg-green-500/10' },
    { label: 'Total Bonus Minutes',value: stats.totalBonusMinutes,    icon: Clock,      color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Earnings (est.)',    value: `₹${stats.totalWalletBalance * 0.1 | 0}`, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">{card.label}</p>
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">Recent Registrations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-700">
              {['Name', 'Email', 'Wallet', 'Joined'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {stats.recentUsers.map((u, i) => (
                <tr key={i} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-medium">{u.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-teal-400 font-semibold">₹{u.wallet_balance ?? 0}</td>
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
