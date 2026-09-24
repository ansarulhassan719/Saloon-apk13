import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Ticket,
  CheckCircle2,
  Clock,
  Phone,
  Navigation,
  Scissors,
  Users,
  AlertCircle,
  Sparkles,
  ArrowRight,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Booking, SalonService } from '../types.ts';
import { TabType } from './BottomNav.tsx';

interface BookingViewProps {
  preselectedService?: SalonService | null;
  onNavigate: (tab: TabType) => void;
}

export const BookingView: React.FC<BookingViewProps> = ({ preselectedService, onNavigate }) => {
  const {
    t,
    services,
    queue,
    salon,
    bookToken,
    savedPhone,
    openGoogleMaps,
    callSalonPhone,
  } = useApp();

  const enabledServices = services.filter((s) => s.enabled);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState(savedPhone || '');
  const [selectedServiceId, setSelectedServiceId] = useState(
    preselectedService?.serviceId || (enabledServices[0]?.serviceId || '')
  );
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    booking: Booking;
    customersAhead: number;
    estimatedWaitMinutes: number;
  } | null>(null);

  const isOnlineOpen = queue?.onlineBookingOpen ?? false;
  const isSalonOpen = queue?.isSalonOpen ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!selectedServiceId) {
      setErrorMsg('Please select a service');
      return;
    }

    setLoading(true);
    const result = await bookToken(
      customerName.trim(),
      cleanPhone,
      selectedServiceId,
      preferredTime.trim() || undefined,
      notes.trim() || undefined
    );
    setLoading(false);

    if (result.success && result.booking) {
      setConfirmedBooking({
        booking: result.booking,
        customersAhead: result.customersAhead || 0,
        estimatedWaitMinutes: result.estimatedWaitMinutes || 0,
      });

      // Celebration confetti
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981'],
        });
      } catch {
        // confetti fallback
      }
    } else {
      setErrorMsg(result.error || 'Failed to book token. Please try again.');
    }
  };

  // If Online Booking or Salon is closed
  if (!isSalonOpen) {
    return (
      <div className="space-y-4 pb-20 animate-fade-in">
        <div className="bg-red-950/60 border border-red-800 rounded-3xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-900/60 text-red-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{t.closed}</h2>
          <p className="text-sm text-red-200">{t.salonClosedMsg}</p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOnlineOpen) {
    return (
      <div className="space-y-4 pb-20 animate-fade-in">
        <div className="bg-amber-950/60 border border-amber-800 rounded-3xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-900/60 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">{t.onlineBookingOff}</h2>
          <p className="text-sm text-amber-200">{t.onlineClosedMsg}</p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={callSalonPhone}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <Phone className="w-4 h-4" />
              <span>{t.callSalon}</span>
            </button>
            <button
              onClick={openGoogleMaps}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              <span>{t.getDirections}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // BOOKING CONFIRMATION SCREEN
  if (confirmedBooking) {
    const { booking, customersAhead, estimatedWaitMinutes } = confirmedBooking;
    return (
      <div className="space-y-4 pb-20 animate-scale-up">
        {/* Confirmed Banner */}
        <div className="bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-emerald-500/80 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 mx-auto flex items-center justify-center mb-3 shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-white">
            {t.bookingConfirmed} ✓
          </h2>
          <p className="text-xs text-emerald-400 font-semibold mt-0.5">
            {salon?.name} • {salon?.locality}
          </p>

          {/* Golden Big Token Badge */}
          <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-xl border-2 border-yellow-200 max-w-xs mx-auto">
            <div className="text-xs uppercase font-extrabold tracking-widest text-slate-900/80">
              {t.yourToken}
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tight my-1">
              #{booking.tokenNumber}
            </div>
            <div className="text-[11px] font-bold text-slate-900 bg-white/40 rounded-full px-3 py-0.5 inline-block">
              {t.waiting}
            </div>
          </div>

          {/* Details Table */}
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 text-xs text-left space-y-2 text-slate-300">
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">{t.name}:</span>
              <span className="font-bold text-white">{booking.customerName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">{t.services}:</span>
              <span className="font-bold text-amber-400">
                {booking.serviceName} (₹{booking.priceAtBooking})
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">{t.bookingTime}:</span>
              <span className="font-bold text-white">{booking.bookingTime}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">{t.customersAhead}:</span>
              <span className="font-bold text-amber-400">{customersAhead}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t.estimatedWait}:</span>
              <span className="font-bold text-emerald-400">
                {estimatedWaitMinutes > 0
                  ? `${estimatedWaitMinutes}–${estimatedWaitMinutes + 10} ${t.minutes}`
                  : 'Approx. 5–10 minutes'}
              </span>
            </div>
          </div>

          {/* Notice */}
          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
            {t.bookingSuccessMsg}
          </p>
        </div>

        {/* 3 Action Buttons on Confirmation */}
        <div className="space-y-2.5">
          <button
            onClick={() => onNavigate('my-bookings')}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>VIEW LIVE QUEUE & MY BOOKINGS</span>
          </button>

          <button
            onClick={openGoogleMaps}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>{t.getDirections}</span>
          </button>

          <button
            onClick={callSalonPhone}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>{t.callSalon}</span>
          </button>
        </div>
      </div>
    );
  }

  // BOOKING FORM SCREEN
  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-2 shadow-inner">
          <Ticket className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-black text-white">{t.bookToken}</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Take a remote digital token and track your queue position
        </p>
      </div>

      {/* Current Queue Live Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 rounded-2xl p-3.5 shadow-md flex items-center justify-around text-center text-xs">
        <div>
          <div className="text-slate-400">{t.nowServing}</div>
          <div className="text-lg font-black text-amber-400 mt-0.5">
            {queue?.nowServingToken ? `#${queue.nowServingToken}` : '—'}
          </div>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div>
          <div className="text-slate-400">{t.peopleWaiting}</div>
          <div className="text-lg font-black text-white mt-0.5">
            {queue?.waitingCount ?? 0}
          </div>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div>
          <div className="text-slate-400">{t.estimatedWait}</div>
          <div className="text-lg font-black text-emerald-400 mt-0.5">
            ~{queue?.estimatedWaitMinutes ?? 0} m
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-red-950/80 border border-red-600 text-red-200 p-3 rounded-xl text-xs flex items-center gap-2 shadow-md">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4"
      >
        {/* 1. Customer Name */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {t.name} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t.namePlaceholder}
              required
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition pl-10"
            />
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* 2. Mobile Number */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {t.phone} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
              maxLength={13}
              required
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition pl-10 font-mono"
            />
            <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Used to securely view and track your token.
          </span>
        </div>

        {/* 3. Service Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {t.selectService} <span className="text-red-400">*</span>
          </label>
          <div className="space-y-2 mt-1">
            {enabledServices.map((service) => {
              const isSelected = selectedServiceId === service.serviceId;
              return (
                <div
                  key={service.serviceId}
                  onClick={() => setSelectedServiceId(service.serviceId)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{service.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {service.durationMinutes} {t.minutes}
                      </div>
                    </div>
                  </div>
                  <span className="font-black text-amber-400 text-sm">
                    ₹{service.price}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Preferred Time (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {t.preferredTime}
          </label>
          <input
            type="text"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            placeholder={t.preferredTimePlaceholder}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-base tracking-wider uppercase shadow-[0_6px_25px_rgba(245,158,11,0.4)] active:scale-[0.98] transition flex items-center justify-center gap-2 border-2 border-yellow-200 mt-2 disabled:opacity-50"
        >
          {loading ? (
            <span>GENERATING TOKEN...</span>
          ) : (
            <>
              <span>{t.confirmBooking}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
