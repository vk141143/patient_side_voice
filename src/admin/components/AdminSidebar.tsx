import { useState } from 'react';
import { LayoutDashboard, Users, Stethoscope, Wallet, GitBranch, LogOut, Menu, X, TrendingUp, MessageSquare, ClipboardList, Hospital, Star, RefreshCw, Banknote, BellRing, Activity, IndianRupee } from 'lucide-react';
import { adminLogout } from '../adminAuth';

export type AdminPage = 'dashboard' | 'users' | 'doctors' | 'wallets' | 'referrals' | 'earnings' | 'feedback' | 'audits' | 'hospital-visits' | 'doctor-ratings' | 'withdrawals' | 'notifications' | 'consultations' | 'pricing' | 'doctor-pricing';

interface AdminSidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  adminName: string;
  open: boolean;
  onToggle: () => void;
}

const navItems: { id: AdminPage; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',       label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'users',           label: 'Users',              icon: Users },
  { id: 'doctors',         label: 'Doctors',            icon: Stethoscope },
  { id: 'wallets',         label: 'Wallets',            icon: Wallet },
  { id: 'referrals',       label: 'Referrals',          icon: GitBranch },
  { id: 'earnings',        label: 'Earnings',           icon: TrendingUp },
  { id: 'feedback',        label: 'Feedback / Reviews', icon: MessageSquare },
  { id: 'audits',          label: 'Audits',             icon: ClipboardList },
  { id: 'hospital-visits', label: 'Hospital Visits',    icon: Hospital },
  { id: 'doctor-ratings',  label: 'Doctor Ratings',     icon: Star },
  { id: 'withdrawals',     label: 'Withdrawals',         icon: Banknote },
  { id: 'notifications',   label: 'Notifications',        icon: BellRing },
  { id: 'consultations',   label: 'Consultations',         icon: Activity },
  { id: 'pricing',         label: 'Pricing',               icon: IndianRupee },
  { id: 'doctor-pricing',  label: 'Doctor Pricing',         icon: Stethoscope },
];

export function AdminSidebar({ activePage, onNavigate, adminName, open, onToggle }: AdminSidebarProps) {
  const handleLogout = () => {
    adminLogout();
    window.location.reload();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-30 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-white font-bold text-lg">MediCare</span>
          </div>
          <button onClick={onToggle} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { onNavigate(item.id); onToggle(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activePage === item.id
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
              <span className="text-teal-400 font-bold text-sm">{adminName.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{adminName}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export function AdminTopBar({ onMenuClick, title, onRefresh }: { onMenuClick: () => void; title: string; onRefresh?: () => void }) {
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    onRefresh?.();
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center gap-4 px-6 sticky top-0 z-10">
      <button onClick={onMenuClick} className="lg:hidden text-gray-400 hover:text-white">
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-semibold text-white flex-1">{title}</h1>
      <button onClick={handleRefresh}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all text-sm">
        <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </header>
  );
}
