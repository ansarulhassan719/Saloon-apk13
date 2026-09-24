import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Scissors,
  Phone,
  Navigation,
  Clock,
  MapPin,
  Calendar,
  Ticket,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { TabType } from './BottomNav.tsx';

interface SalonProfileViewProps {
  onNavigate: (tab: TabType) => void;
  onOpenOwnerLogin: () => void;
}

export const SalonProfileView: React.FC<SalonProfileViewProps> = ({
  onNavigate,
  onOpenOwnerLogin,
}) => {
  const {
    salon,
    services,
    t,
    openGoogleMaps,
    callSalonPhone,
    isOwnerLoggedIn,
  } = useApp();

  const enabledServices = services.filter((s) => s.enabled);

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Top Banner & Logo */}
      <div className="bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden">
        {/* Barber Emblem */}
        <div className="w-20 h-20 rounded-3xl bg-slate-950 border-2 border-amber-400 text-amber-400 mx-auto flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(245,158,11,0.25)] relative">
          <Scissors className="w-10 h-10 transform -rotate-45" />
          <div className="absolute -bottom-2 w-8 h-3 rounded-full bg-amber-400 text-[8px] font-black text-slate-950 flex items-center justify-center uppercase">
            EST.
          </div>
        </div>

        <h2 className="text-2xl font-black text-white">{salon?.name || 'Sahjahan Saloon'}</h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-1 rounded-full bg-red-950/80 border border-red-700/50 text-red-300 text-xs font-bold uppercase">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <span>{salon?.locality || 'Alargo'}</span>
        </div>

        <p className="text-xs text-slate-300 max-w-sm mx-auto mt-3 leading-relaxed">
          {salon?.description || 'Clean cuts, stylish grooming, beard trimming, and premium service for every customer.'}
        </p>

        {/* 3 Main Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <button
            onClick={() => onNavigate('book')}
            className="py-3 px-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition"
          >
            <Ticket className="w-4 h-4 stroke-[2.5]" />
            <span>{t.bookToken}</span>
          </button>

          <button
            onClick={callSalonPhone}
            className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>{t.callSalon}</span>
          </button>

          <button
            onClick={openGoogleMaps}
            className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition"
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            <span>{t.getDirections}</span>
          </button>
        </div>
      </div>

      {/* Contact & Location Details */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3.5 text-xs">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Location & Contact</span>
        </h3>

        {/* Phone */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
          <span className="text-slate-400">{t.phone}:</span>
          <div className="text-right">
            {salon?.phone && salon.phone.trim().length > 0 ? (
              <a
                href={`tel:${salon.phone}`}
                className="font-bold text-amber-400 flex items-center gap-1 hover:underline"
              >
                <span>{salon.phone}</span>
                <Phone className="w-3.5 h-3.5 text-emerald-400 inline" />
              </a>
            ) : (
              <span className="text-slate-500 italic">Not configured yet</span>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
          <span className="text-slate-400">Address:</span>
          <div className="text-right max-w-[65%]">
            {salon?.address && salon.address.trim().length > 0 ? (
              <span className="font-semibold text-white">{salon.address}</span>
            ) : (
              <span className="text-slate-500 italic">Alargo (exact address pending owner input)</span>
            )}
          </div>
        </div>

        {/* Google Maps Link / Directions */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-slatue-400">Google Maps:</span>
          <button
            onClick={openGoogleMaps}
            className="text-blue-400 font-bold flex items-center gap-1 hover:underline"
          >
            <span>Open in Maps</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Timings */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-slate-400">Operating Hours:</span>
          <span className="font-semibold text-white">
            {salon?.openingTime || '08:00 AM'} - {salon?.closingTime || '09:30 PM'}
          </span>
        </div>

        {/* Weekly Closed Day */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{t.weeklyClosedDay}:</span>
          <span className="font-bold text-amber-400">
            {salon?.weeklyClosedDay || 'Tuesday'}
          </span>
        </div>
      </div>

      {/* Services & Pricing Quick View */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span>Services & Rates</span>
          </h3>
          <button
            onClick={() => onNavigate('services')}
            className="text-amber-400 font-bold hover:underline"
          >
            View All
          </button>
        </div>

        <div className="space-y-2">
          {enabledServices.map((service) => (
            <div
              key={service.serviceId}
              className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80"
            >
              <div>
                <span className="font-bold text-white text-xs">{service.name}</span>
                <span className="text-[10px] text-slate-500 block">
                  ~{service.durationMinutes} mins
                </span>
              </div>
              <span className="font-black text-amber-400 text-sm">
                ₹{service.price}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Download App Code ZIP */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-lg space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-white">Download Project (.zip)</h4>
            <p className="text-[11px] text-slate-400">Complete application source code archive</p>
          </div>
        </div>
        <a
          href="/download.zip"
          download="sahjahan-saloon-app.zip"
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>DOWNLOAD APP ZIP (54 KB)</span>
        </a>
      </div>

      {/* Owner Access Footnote */}
      <div className="pt-2 text-center">
        <button
          onClick={onOpenOwnerLogin}
          className="text-xs text-slate-500 hover:text-amber-400 transition flex items-center justify-center gap-1.5 mx-auto"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isOwnerLoggedIn ? 'Go to Owner Dashboard' : 'Salon Owner Login'}</span>
        </button>
      </div>
    </div>
  );
};
