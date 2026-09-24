import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Sparkles, MapPin, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { soundEffects } from '../soundEffects.ts';

interface SplashIntroProps {
  onEnter: () => void;
  lang: 'en' | 'hi';
}

export const SplashIntro: React.FC<SplashIntroProps> = ({ onEnter, lang }) => {
  const [muted, setMuted] = useState(false);

  const handleStart = () => {
    if (!muted) {
      soundEffects.playScissorSnip();
      setTimeout(() => soundEffects.playChime(), 180);
    }
    onEnter();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#070a12] via-[#0d1322] to-[#05070d] text-white p-6 overflow-hidden select-none">
        {/* Background glow effects */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls: Mute toggle & Skip */}
        <div className="w-full flex items-center justify-between relative z-10 pt-2 max-w-md">
          <button
            onClick={() => setMuted(!muted)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300 active:scale-95 transition"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{muted ? 'Sound Off' : 'Sound On'}</span>
          </button>

          <button
            onClick={onEnter}
            className="text-xs tracking-wider uppercase font-semibold text-amber-400/90 hover:text-amber-300 border-b border-amber-400/40 pb-0.5 active:scale-95 transition"
          >
            {lang === 'hi' ? 'सीधे अंदर जाएं ➔' : 'Skip Intro ➔'}
          </button>
        </div>

        {/* Centerpiece: Barber Pole + Chrome Shears + Neon Typography */}
        <div className="flex flex-col items-center justify-center my-auto relative z-10 w-full max-w-sm text-center">
          {/* Animated Barber Pole Cylinder */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mb-6"
          >
            {/* Pole Glass Shell */}
            <div className="w-16 h-36 rounded-full p-1 bg-gradient-to-b from-amber-400 via-amber-200 to-amber-600 shadow-[0_0_35px_rgba(245,158,11,0.4)] relative flex items-center justify-center">
              {/* Inner rotating barber stripes */}
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-900 relative shadow-inner">
                <div className="w-full h-full barber-pole-stripes-fast" />
                {/* 3D Glass reflection overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-black/50 pointer-events-none rounded-full" />
              </div>

              {/* Chrome Caps */}
              <div className="absolute -top-3 w-12 h-4 rounded-t-full bg-gradient-to-b from-amber-200 to-amber-600 shadow-md border border-amber-300" />
              <div className="absolute -bottom-3 w-12 h-4 rounded-b-full bg-gradient-to-t from-amber-200 to-amber-600 shadow-md border border-amber-300" />
            </div>

            {/* Crossed Barber Scissor Badge */}
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -bottom-2 -right-3 w-12 h-12 rounded-full bg-slate-950 border-2 border-amber-400 shadow-xl flex items-center justify-center"
            >
              <Scissors className="w-6 h-6 text-amber-400 transform -rotate-45" />
            </motion.div>
          </motion.div>

          {/* Salon Name & Metallic Chrome Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>PREMIUM GROOMING & QUEUE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_15px_rgba(245,158,11,0.5)]">
              SAHJAН SALOON
            </h1>

            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-lg tracking-wider">
              <MapPin className="w-5 h-5 text-red-500 fill-red-500" />
              <span className="bg-red-950/80 text-red-200 px-3 py-0.5 rounded-full border border-red-500/40 text-sm">
                ALARGO (अलारगो)
              </span>
            </div>

            <p className="text-slate-400 text-xs max-w-xs mx-auto pt-1 leading-relaxed">
              {lang === 'hi'
                ? 'लाइव कतार ट्रैकिंग • ऑनलाइन टोकन • हेयर कटिंग, शेविंग एवं फेशियल'
                : 'Live Queue Tracking • Instant Remote Token • Zero Waiting Room Rush'}
            </p>
          </motion.div>
        </div>

        {/* Bottom CTA Button: Heavy Exciting Entry */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="w-full max-w-sm relative z-10 pb-4 space-y-3"
        >
          <button
            onClick={handleStart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-base tracking-wider uppercase shadow-[0_8px_30px_rgba(245,158,11,0.45)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.6)] active:scale-[0.98] transition flex items-center justify-center gap-3 border-2 border-yellow-200"
          >
            <span>{lang === 'hi' ? 'सैलून टोकन कतार खोलें' : 'ENTER SALOON APP'}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <p className="text-center text-[11px] text-slate-500">
            {lang === 'hi'
              ? 'टोकन लें, घर बैठे कतार देखें और समय से पहुंचें'
              : 'Book your token from home & track live turn without waiting'}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
