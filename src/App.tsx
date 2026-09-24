/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav, TabType } from './components/BottomNav.tsx';
import { CustomerHome } from './components/CustomerHome.tsx';
import { ServicesView } from './components/ServicesView.tsx';
import { BookingView } from './components/BookingView.tsx';
import { MyBookingsView } from './components/MyBookingsView.tsx';
import { SalonProfileView } from './components/SalonProfileView.tsx';
import { OwnerDashboard } from './components/OwnerDashboard.tsx';
import { OwnerLogin } from './components/OwnerLogin.tsx';
import { SplashIntro } from './components/SplashIntro.tsx';
import { SalonService } from './types.ts';

function MainLayout() {
  const { lang, isOwnerLoggedIn } = useApp();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showOwnerLoginModal, setShowOwnerLoginModal] = useState<boolean>(false);
  const [preselectedService, setPreselectedService] = useState<SalonService | null>(null);

  const handleSelectServiceToBook = (service: SalonService) => {
    setPreselectedService(service);
    setActiveTab('book');
  };

  const handleOpenOwner = () => {
    if (isOwnerLoggedIn) {
      setActiveTab('owner');
    } else {
      setShowOwnerLoginModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Heavy Exciting Opening Splash Screen */}
      {showSplash && (
        <SplashIntro
          lang={lang}
          onEnter={() => setShowSplash(false)}
        />
      )}

      {/* Android Mobile Frame Wrapper */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col relative shadow-2xl bg-[#0b0f19] min-h-screen border-x border-slate-800/60">
        {/* Top Sticky Navbar */}
        <Navbar
          onReplayIntro={() => setShowSplash(true)}
          onOpenOwner={handleOpenOwner}
          isOwnerTabActive={activeTab === 'owner'}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'home' && (
            <CustomerHome onNavigate={setActiveTab} />
          )}

          {activeTab === 'services' && (
            <ServicesView onSelectServiceToBook={handleSelectServiceToBook} />
          )}

          {activeTab === 'book' && (
            <BookingView
              preselectedService={preselectedService}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'my-bookings' && (
            <MyBookingsView onNavigate={setActiveTab} />
          )}

          {activeTab === 'profile' && (
            <SalonProfileView
              onNavigate={setActiveTab}
              onOpenOwnerLogin={handleOpenOwner}
            />
          )}

          {activeTab === 'owner' && (
            <OwnerDashboard onClose={() => setActiveTab('home')} />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      </div>

      {/* Owner Login Modal */}
      {showOwnerLoginModal && (
        <OwnerLogin
          onSuccess={() => {
            setShowOwnerLoginModal(false);
            setActiveTab('owner');
          }}
          onCancel={() => setShowOwnerLoginModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
