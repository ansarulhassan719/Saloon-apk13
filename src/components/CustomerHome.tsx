import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Ticket,
  Phone,
  Navigation,
  Scissors,
  Users,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { TabType } from './BottomNav.tsx';

interface CustomerHomeProps {
  onNavigate: (tab: TabType) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({ onNavigate }) => {
  const {
    t,
    salon,
    queue,
    activeBooking,
    openGoogleMaps,
    callSalonPhone,
  } = useApp();

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'info' | 'error' } | null>(null);

  const handleDirections = () => {
    const res = openGoogleMaps();
    if (!res.success && res.message) {
      setFeedbackMsg({ text: res.message, type: 'error' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleCall = () => {
    const res = callSalonPhone();
    if (!res.success && res.message) {
      setFeedbackMsg({ text: res.message, type: 'error' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const isOpen = queue?.isSalonOpen ?? false;
  const isOnlineOpen = queue?.onlineBookingOpen ?? false;
  const servingToken = queue?.nowServingToken;
  const waitingCount = queue?.waitingCount ?? 0;
  const waitMinutes = queue?.estimatedWaitMinutes ?? 0;

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Toast Alert for missing phone or location info */}
      {feedbackMsg && (
        <div className="bg-amber-950/90 border border-amber-500/70 text-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-bounce">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Hero Card: Sahjahan Saloon – Alargo */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 p-5 shadow-2xl text-center">
        {/* Decorative corner glows */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Logo Badge & Barber Pole */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-6 h-12 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-md relative">
            <div className="w-full h-full barber-pole-stripes" />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center text-amber-400">
              <Scissors className="w-7 h-7 transform -rotate-45" />
            </div>
          </div>

          <div className="w-6 h-12 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-md relative">
            <div className="w-full h-full barber-pole-stripes" />
          </div>
        </div>

        {/* Salon Name and Locality */}
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
          {salon?.name || 'Sahjahan Saloon'}
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-1 rounded-full bg-red-950/80 border border-red-700/50 text-red-300 text-xs font-bold uppercase tracking-wider">
          <span>📍 {salon?.locality || 'Alargo'}</span>
        </div>

        {/* Operational Status Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${
              isOpen
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
                : 'bg-red-950/90 text-red-300 border-red-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            {isOpen ? t.open : t.closed}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${
              isOnlineOpen
                ? 'bg-blue-950/90 text-blue-300 border-blue-600'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isOnlineOpen ? t.onlineBookingOn : t.onlineBookingOff}
          </span>
        </div>
      </div>

      {/* Live Queue Overview Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* 1. Now Serving */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-3 text-center shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
          <div className="text-[11px] font-semibold text-slate-400 leading-tight flex items-center justify-center gap-1">
            <Scissors className="w-3 h-3 text-amber-400" />
            <span>{t.nowServing}</span>
          </div>
          <div className="my-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              {servingToken ? `#${servingToken}` : '—'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {queue?.nowServingCustomerName || (servingToken ? 'In Service' : 'None')}
          </div>
        </div>

        {/* 2. People Waiting */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center shadow-lg flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 leading-tight flex items-center justify-center gap-1">
            <Users className="w-3 h-3 text-blue-400" />
            <span>{t.peopleWaiting}</span>
          </div>
          <div className="my-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {waitingCount}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {waitingCount === 0 ? 'Empty Queue' : 'In Line'}
          </div>
        </div>

        {/* 3. Estimated Wait */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center shadow-lg flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 leading-tight flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{t.estimatedWait}</span>
          </div>
          <div className="my-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {waitMinutes > 0 ? `${waitMinutes}` : '0'}
            </span>
            <span className="text-xs text-slate-400 font-semibold ml-0.5">m</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {waitMinutes > 0 ? `${waitMinutes}-${waitMinutes + 10} min` : 'No Wait'}
          </div>
        </div>
      </div>

      {/* Customer's Active Live Token Banner (If booked) */}
      {activeBooking && (activeBooking.status === 'waiting' || activeBooking.status === 'called' || activeBooking.status === 'serving') && (
        <div
          onClick={() => onNavigate('my-bookings')}
          className="cursor-pointer bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-2 border-amber-500 rounded-2xl p-3.5 shadow-xl relative overflow-hidden active:scale-[0.99] transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-md">
                #{activeBooking.tokenNumber}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-400">{t.yourToken}</span>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                      activeBooking.status === 'called'
                        ? 'bg-red-500 text-white animate-pulse'
                        : activeBooking.status === 'serving'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {activeBooking.status === 'called' ? '🔔 YOUR TURN!' : activeBooking.status}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  {activeBooking.serviceName} • {activeBooking.customerName}
                </div>
              </div>
            </div>

            <div className="text-right flex items-center gap-1">
              <div className="text-xs text-amber-300 font-semibold">
                {activeBooking.status === 'called' ? 'Enter Now' : 'Track Queue'}
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>
      )}

      {/* 4 MAIN ACTION BUTTONS (Large Touch Ergonomics) */}
      <div className="space-y-2.5 pt-1">
        {/* 1. BOOK TOKEN (Primary Gold Button) */}
        <button
          onClick={() => onNavigate('book')}
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-base tracking-wider uppercase shadow-[0_6px_25px_rgba(245,158,11,0.4)] active:scale-[0.98] transition flex items-center justify-between border-2 border-yellow-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950/20 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-left leading-tight">
              {t.bookToken}
              <span className="block text-[11px] font-semibold text-slate-900/80 normal-case tracking-normal">
                {isOnlineOpen ? 'Get instant live digital token' : 'Check status & queue'}
              </span>
            </span>
          </div>
          <ChevronRight className="w-6 h-6 stroke-[3]" />
        </button>

        {/* 2. CALL SALON */}
        <button
          onClick={handleCall}
          className="w-full py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center">
              <Phone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="leading-tight">{t.callSalon}</div>
              <div className="text-[11px] text-slate-400 font-normal">
                {salon?.phone ? salon.phone : 'Direct salon phone dialer'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* 3. GET DIRECTIONS */}
        <button
          onClick={handleDirections}
          className="w-full py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-700/60 flex items-center justify-center">
              <Navigation className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-left">
              <div className="leading-tight">{t.getDirections}</div>
              <div className="text-[11px] text-slate-400 font-normal">
                {salon?.address ? salon.address : 'Open in Google Maps'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* 4. VIEW SERVICES */}
        <button
          onClick={() => onNavigate('services')}
          className="w-full py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-left">
              <div className="leading-tight">{t.viewServices}</div>
              <div className="text-[11px] text-slate-400 font-normal">
                Hair Cutting, Shaving, Facial prices
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Salon Timings & Features Strip */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3.5 text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">{t.openingTime} - {t.closingTime}</span>
          <span className="font-semibold text-white">
            {salon?.openingTime || '08:00 AM'} – {salon?.closingTime || '09:30 PM'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{t.weeklyClosedDay}</span>
          <span className="font-semibold text-amber-400">
            {salon?.weeklyClosedDay || 'Tuesday'}
          </span>
        </div>
      </div>
    </div>
  );
};
