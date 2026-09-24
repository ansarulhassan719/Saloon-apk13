import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Scissors, Clock, Sparkles, Check, ArrowRight } from 'lucide-react';
import { SalonService } from '../types.ts';

interface ServicesViewProps {
  onSelectServiceToBook: (service: SalonService) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onSelectServiceToBook }) => {
  const { services, t, queue } = useApp();

  const enabledServices = services.filter((s) => s.enabled);

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-2 shadow-inner">
          <Scissors className="w-6 h-6 transform -rotate-45" />
        </div>
        <h2 className="text-xl font-black text-white">{t.services}</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Sahjahan Saloon – Alargo • Professional grooming menu
        </p>
      </div>

      {/* Services List */}
      {enabledServices.length === 0 ? (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          <Scissors className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t.noServices}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enabledServices.map((service) => (
            <div
              key={service.serviceId}
              className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 shadow-lg flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                  <Scissors className="w-5 h-5 transform -rotate-45" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-snug">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {service.durationMinutes} {t.minutes}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Price and Book Action */}
              <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                <span className="text-lg font-black text-amber-400">
                  ₹{service.price}
                </span>

                <button
                  onClick={() => onSelectServiceToBook(service)}
                  disabled={!queue?.onlineBookingOpen}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    queue?.onlineBookingOpen
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>{t.bookToken}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Online booking closed banner if closed */}
      {!queue?.onlineBookingOpen && (
        <div className="bg-amber-950/40 border border-amber-600/30 text-amber-300 p-3.5 rounded-2xl text-xs text-center">
          {t.onlineClosedMsg}
        </div>
      )}
    </div>
  );
};
