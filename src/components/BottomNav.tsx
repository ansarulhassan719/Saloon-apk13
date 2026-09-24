import React from 'react';
import { Home, Scissors, Ticket, Clock, Store, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export type TabType = 'home' | 'services' | 'book' | 'my-bookings' | 'profile' | 'owner';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const { t, activeBooking, isOwnerLoggedIn } = useApp();

  const tabs: { id: TabType; label: string; icon: React.ElementType; badge?: boolean }[] = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'services', label: t.services, icon: Scissors },
    { id: 'book', label: t.bookToken, icon: Ticket },
    { id: 'my-bookings', label: t.myBookings, icon: Clock, badge: Boolean(activeBooking) },
    { id: 'profile', label: t.profile, icon: Store },
  ];

  if (isOwnerLoggedIn) {
    tabs.push({ id: 'owner', label: t.owner, icon: ShieldCheck });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isBookTab = tab.id === 'book';

          if (isBookTab) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="relative -top-3 flex flex-col items-center group active:scale-95 transition"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 transition ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 border-white shadow-amber-500/50'
                      : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-amber-300 shadow-amber-500/30'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-amber-400 mt-0.5 tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition relative active:scale-95 ${
                isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
