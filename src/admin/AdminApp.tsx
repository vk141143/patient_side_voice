import { useState } from 'react';
import { AdminLogin } from './components/AdminLogin';
import { AdminSidebar, AdminTopBar, AdminPage } from './components/AdminSidebar';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { WalletsPage } from './pages/WalletsPage';
import { ReferralsPage } from './pages/ReferralsPage';
import { EarningsPage } from './pages/EarningsPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { AuditsPage } from './pages/AuditsPage';
import { HospitalVisitsPage } from './pages/HospitalVisitsPage';
import { DoctorRatingsPage } from './pages/DoctorRatingsPage';
import { WithdrawalsPage } from './pages/WithdrawalsPage';
import { NotificationsAdminPage } from './pages/NotificationsAdminPage';
import { ConsultationsMonitorPage } from './pages/ConsultationsMonitorPage';
import { PricingPage } from './pages/PricingPage';
import { DoctorPricingPage } from './pages/DoctorPricingPage';
import { getAdminSession } from './adminAuth';

const PAGE_TITLES: Record<AdminPage, string> = {
  dashboard:         'Dashboard',
  users:             'Users',
  doctors:           'Doctors',
  wallets:           'Wallets',
  referrals:         'Referrals',
  earnings:          'Earnings',
  feedback:          'Feedback / Reviews',
  audits:            'Audits',
  'hospital-visits': 'Hospital Visits',
  'doctor-ratings':  'Doctor Ratings',
  'withdrawals':     'Withdrawals',
  'notifications':   'Notifications',
  'consultations':   'Consultations Monitor',
  'pricing':         'Pricing',
  'doctor-pricing':  'Doctor Pricing',
};

export function AdminApp() {
  const [session, setSession] = useState(getAdminSession);
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!session) {
    return <AdminLogin onLogin={() => setSession(getAdminSession())} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage key={refreshKey} />;
      case 'users':     return <UsersPage key={refreshKey} />;
      case 'doctors':   return <DoctorsPage key={refreshKey} />;
      case 'wallets':   return <WalletsPage key={refreshKey} />;
      case 'referrals': return <ReferralsPage key={refreshKey} />;
      case 'earnings':  return <EarningsPage key={refreshKey} />;
      case 'feedback':        return <FeedbackPage key={refreshKey} />;
      case 'audits':          return <AuditsPage key={refreshKey} />;
      case 'hospital-visits': return <HospitalVisitsPage key={refreshKey} />;
      case 'doctor-ratings':  return <DoctorRatingsPage key={refreshKey} />;
      case 'withdrawals':     return <WithdrawalsPage key={refreshKey} />;
      case 'notifications':   return <NotificationsAdminPage key={refreshKey} />;
      case 'consultations':   return <ConsultationsMonitorPage key={refreshKey} />;
      case 'pricing':          return <PricingPage key={refreshKey} />;
      case 'doctor-pricing':   return <DoctorPricingPage key={refreshKey} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <AdminSidebar
        activePage={activePage}
        onNavigate={(page) => { setActivePage(page); setSidebarOpen(false); }}
        adminName={session.name}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <AdminTopBar onMenuClick={() => setSidebarOpen(o => !o)} title={PAGE_TITLES[activePage]} onRefresh={() => setRefreshKey(k => k + 1)} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
