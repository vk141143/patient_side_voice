import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Wallet, Users, Clock, RefreshCw } from 'lucide-react';

export function EarningsPage() {
  const [data, setData] = useState({ totalWallet: 0, totalUsers: 0, totalBonusMin: 0, completedReferrals: 0, opdRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, refRes, opdRes] = await Promise.all([
      supabase.from('users').select('wallet_balance, bonus_minutes'),
      supabase.from('referrals').select('status'),
      supabase.from('opd_appointments').select('fee').eq('status', 'attended').eq('payment_status', 'paid'),
    ]);
    const users = usersRes.data ?? [];
    const refs = refRes.data ?? [];
    const opd = opdRes.data ?? [];
    setData({
      totalWallet: users.reduce((s, u) => s + (u.wallet_balance ?? 0), 0),
      totalUsers: users.length,
      totalBonusMin: users.reduce((s, u) => s + (u.bonus_minutes ?? 0), 0),
      completedReferrals: refs.filter(r => r.status === 'completed').length,
      opdRevenue: opd.reduce((s, o) => s + (o.fee ?? 0), 0),
    });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => { setSpinning(true); fetchData(); setTimeout(() => setSpinning(false), 800); };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  const cards = [
    { label: 'Total Wallet Funds', value: `₹${data.totalWallet}`, icon: Wallet, color: 'text-teal-400', bg: 'bg-teal-500/10', desc: 'Sum of all user wallets' },
    { label: 'OPD Revenue', value: `₹${data.opdRevenue}`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', desc: 'Paid attended OPD visits' },
    { label: 'Estimated Revenue', value: `₹${Math.round((data.totalWallet + data.opdRevenue) * 0.85)}`, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10', desc: '85% of total funds' },
    { label: 'Active Users', value: data.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: 'Registered users' },
    { label: 'Bonus Minutes Issued', value: `${data.totalBonusMin} min`, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10', desc: 'Via referral program' },
    { label: 'Referral Conversions', value: data.completedReferrals, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'Completed referrals' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-end">
        <button onClick={handleRefresh} className="h-11 px-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-sm font-medium text-gray-300">{card.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
