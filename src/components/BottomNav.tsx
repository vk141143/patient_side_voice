import { Home, CalendarCheck, FileText, Heart, User } from 'lucide-react';
import { AppScreen } from '@/types/app';

interface BottomNavProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

const navItems = [
  { id: 'home' as AppScreen, icon: Home, label: 'Home' },
  { id: 'bookings' as AppScreen, icon: CalendarCheck, label: 'Bookings' },
  { id: 'prescription' as AppScreen, icon: FileText, label: 'Rx' },
  { id: 'records' as AppScreen, icon: Heart, label: 'Records' },
  { id: 'user-profile' as AppScreen, icon: User, label: 'Profile' },
];

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 pb-6 pt-2 z-50 max-w-md mx-auto">
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const isActive = activeScreen === item.id || 
            (item.id === 'home' && ['home'].includes(activeScreen)) ||
            (item.id === 'bookings' && ['bookings', 'appointment-confirmation'].includes(activeScreen));
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10' : ''}`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
