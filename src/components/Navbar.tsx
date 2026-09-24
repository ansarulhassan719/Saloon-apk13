import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Scissors, Volume2, VolumeX, Sparkles, Shield, UserCheck } from 'lucide-react';

interface NavbarProps {
  onReplayIntro: () => void;
  onOpenOwner: () => void;
  isOwnerTabActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onReplayIntro, onOpenOwner, isOwnerTabActive }) => {
  const { lang, setLang, t, queue, salon, soundEnabled, setSoundEnabled, isOwnerLoggedIn } = useApp();

  const isOpen = queue?.isSalonOpen ?? false;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-3 py-2.5 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Salon Branding with mini barber pole */}
        <div className="flex items-center gap-2">
          {/* Barber pole pill */}
          <div className="w-5 h-9 rounded-full overflow-hidden border border-amber-400/50 shadow-sm relative shrink-0">
            <div className="w-full h-full barber-pole-stripes" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm tracking-wide text-white leading-tight">
                {salon?.name || 'Sahjahan Saloon'}
              </h1>
              <span className="text-[10px] bg-red-950/80 text-red-300 font-bold px-1.5 py-0.2 rounded border border-red-800/60">
                {salon?.locality || 'Alargo'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-0.5">
              {/* Open / Closed Status indicator */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.2 rounded-full ${
                  isOpen
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                    : 'bg-red-950/80 text-red-300 border border-red-800/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {isOpen ? t.open : t.closed}
              </span>

              {/* Online booking status */}
              <span className="text-[10px] text-slate-400">
                {queue?.onlineBookingOpen ? '• Online ON' : '• Online OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Icons: Language, Sound, Intro, Owner */}
        <div className="flex items-center gap-1">
          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-xs font-bold text-amber-400 transition"
            title="Switch Language / भाषा बदलें"
          >
            {lang === 'en' ? 'हिंदी' : 'EN'}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-300 transition"
            title="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Replay Exciting Intro */}
          <button
            onClick={onReplayIntro}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-amber-400 transition"
            title="Replay Opening Intro"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Owner Dashboard Shortcut */}
          <button
            onClick={onOpenOwner}
            className={`p-1.5 rounded-lg border transition flex items-center justify-center ${
              isOwnerTabActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : isOwnerLoggedIn
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={isOwnerLoggedIn ? 'Owner Logged In' : 'Owner Login'}
          >
            {isOwnerLoggedIn ? (
              <UserCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
