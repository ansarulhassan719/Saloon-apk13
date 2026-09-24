import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Clock,
  Ticket,
  Search,
  Phone,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Users,
  XCircle,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { Booking } from '../types.ts';
import { TabType } from './BottomNav.tsx';

interface MyBookingsViewProps {
  onNavigate: (tab: TabType) => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ onNavigate }) => {
  const {
    t,
    savedPhone,
    setSavedPhone,
    getMyBookings,
    activeBooking,
    queue,
    salon,
    openGoogleMaps,
    callSalonPhone,
  } = useApp();

  const [inputPhone, setInputPhone] = useState(savedPhone || '');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [todayBooking, setTodayBooking] = useState<Booking | null>(activeBooking);
  const [previousBookings, setPreviousBookings] = useState<Booking[]>([]);
  const [customersAhead, setCustomersAhead] = useState<number>(0);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);

  const fetchBookings = async (phoneToLookup: string) => {
    const clean = phoneToLookup.replace(/\D/g, '');
    if (clean.length < 10) return;

    setLoading(true);
    setSavedPhone(clean);
    const data = await getMyBookings(clean);
    setLoading(false);
    setSearched(true);

    if (data.todayBooking) {
      setTodayBooking(data.todayBooking);
    } else {
      setTodayBooking(null);
    }
    setPreviousBookings(data.previousBookings || []);
    setCustomersAhead(data.customersAhead || 0);
    setEstimatedWait(data.estimatedWait || 0);
  };

  useEffect(() => {
    if (savedPhone && savedPhone.length >= 10) {
      fetchBookings(savedPhone);
    }
  }, [savedPhone, queue?.nowServingToken, queue?.waitingCount]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings(inputPhone);
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'serving':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t.serving}
          </span>
        );
      case 'called':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500 text-xs font-bold uppercase flex items-center gap-1 animate-bounce">
            <Bell className="w-3.5 h-3.5 text-red-400" />
            {t.called} - PLEASE ENTER!
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-semibold uppercase">
            {t.completed}
          </span>
        );
      case 'skipped':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold uppercase">
            {t.skipped}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold uppercase">
            {t.cancelled}
          </span>
        );
      case 'waiting':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold uppercase">
            {t.waiting}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-2 shadow-inner">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-white">{t.myBookings}</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Live queue tracking & your token history
        </p>
      </div>

      {/* Phone Lookup Box */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-md flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="tel"
            value={inputPhone}
            onChange={(e) => setInputPhone(e.target.value)}
            placeholder={t.phonePlaceholder}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none pl-9 font-mono"
          />
          <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1 transition shrink-0"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Find</span>
        </button>
      </form>

      {/* TODAY'S ACTIVE BOOKING & LIVE QUEUE TRACKER */}
      {todayBooking ? (
        <div className="bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-amber-500/80 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-md">
                Today's Booking
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {todayBooking.serviceName}
              </h3>
              <p className="text-xs text-slate-400">
                {todayBooking.customerName} • ₹{todayBooking.priceAtBooking}
              </p>
            </div>
            {getStatusBadge(todayBooking.status)}
          </div>

          {/* Golden Big Token Display */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 text-center shadow-lg border border-yellow-200">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900/80">
              {t.yourToken}
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight my-0.5">
              #{todayBooking.tokenNumber}
            </div>
            <div className="text-xs font-semibold text-slate-900">
              Booked at: {todayBooking.bookingTime}
            </div>
          </div>

          {/* Queue Status Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
              <div className="text-slate-400 text-[10px]">{t.nowServing}</div>
              <div className="text-base font-black text-amber-400 mt-0.5">
                {queue?.nowServingToken ? `#${queue.nowServingToken}` : '—'}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
              <div className="text-slate-400 text-[10px]">{t.customersAhead}</div>
              <div className="text-base font-black text-white mt-0.5">
                {todayBooking.status === 'completed'
                  ? '0'
                  : todayBooking.status === 'serving'
                  ? '0 (You)'
                  : customersAhead}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
              <div className="text-slate-400 text-[10px]">{t.estimatedWait}</div>
              <div className="text-base font-black text-emerald-400 mt-0.5">
                {todayBooking.status === 'completed'
                  ? 'Done'
                  : todayBooking.status === 'serving'
                  ? 'Now'
                  : `${estimatedWait} m`}
              </div>
            </div>
          </div>

          {/* Status Message */}
          {todayBooking.status === 'called' && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs font-bold text-center animate-pulse">
              🔔 Your token #{todayBooking.tokenNumber} has been called! Please step inside the salon now.
            </div>
          )}

          {todayBooking.status === 'serving' && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-bold text-center">
              ✂️ Your service is currently in progress. Enjoy your haircut!
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={callSalonPhone}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.callSalon}</span>
            </button>

            <button
              onClick={openGoogleMaps}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.getDirections}</span>
            </button>
          </div>
        </div>
      ) : searched ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs space-y-2">
          <Ticket className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
          <p className="font-semibold text-slate-300">No active booking found for today.</p>
          <p>You can easily take a new token right now!</p>
          <button
            onClick={() => onNavigate('book')}
            className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            {t.bookToken}
          </button>
        </div>
      ) : null}

      {/* PREVIOUS BOOKINGS HISTORY */}
      <div className="space-y-2.5 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Booking History
        </h3>

        {previousBookings.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-center text-slate-500 text-xs">
            {t.noBookings}
          </div>
        ) : (
          <div className="space-y-2">
            {previousBookings.map((b) => (
              <div
                key={b.bookingId}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-400 font-black text-xs flex items-center justify-center border border-slate-700">
                    #{b.tokenNumber}
                  </div>
                  <div>
                    <div className="font-bold text-white">{b.serviceName}</div>
                    <div className="text-[11px] text-slate-400">
                      {b.date} • {b.bookingTime}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-amber-400">₹{b.priceAtBooking}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{b.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
