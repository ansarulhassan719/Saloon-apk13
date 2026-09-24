import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Users,
  Ticket,
  Scissors,
  Phone,
  Settings,
  Plus,
  Play,
  CheckCircle,
  SkipForward,
  XCircle,
  RotateCcw,
  Sparkles,
  BarChart3,
  Calendar,
  Clock,
  Store,
  LogOut,
  AlertCircle,
  Search,
  Check,
  Edit2,
  Trash2,
  RefreshCw,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Booking, BookingStatus, SalonService, AnalyticsSummary } from '../types.ts';

type OwnerSubTab = 'queue' | 'bookings' | 'services' | 'salon' | 'analytics' | 'settings';

export const OwnerDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    t,
    salon,
    queue,
    services,
    logoutOwner,
    ownerCallNext,
    ownerStartService,
    ownerCompleteService,
    ownerSkipCustomer,
    ownerRecallCustomer,
    ownerCancelBooking,
    ownerAddWalkIn,
    ownerToggleOnlineBooking,
    ownerToggleSalonStatus,
    ownerStartNewDay,
    ownerUpdateSalon,
    ownerAddService,
    ownerUpdateService,
    ownerDeleteService,
    ownerGetBookings,
    ownerGetAnalytics,
    ownerClearDemoData,
    refreshSalon,
    refreshServices,
    refreshQueue,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<OwnerSubTab>('queue');
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Walk-in modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState(services[0]?.serviceId || '');
  const [walkInNotes, setWalkInNotes] = useState('');
  const [walkInLoading, setWalkInLoading] = useState(false);

  // New / Edit Service Modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<SalonService | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(100);
  const [serviceDuration, setServiceDuration] = useState<number>(15);

  // Salon Profile Form State
  const [salonName, setSalonName] = useState(salon?.name || 'Sahjahan Saloon');
  const [salonLocality, setSalonLocality] = useState(salon?.locality || 'Alargo');
  const [salonPhone, setSalonPhone] = useState(salon?.phone || '');
  const [salonAddress, setSalonAddress] = useState(salon?.address || '');
  const [salonMapsUrl, setSalonMapsUrl] = useState(salon?.googleMapsUrl || '');
  const [openingTime, setOpeningTime] = useState(salon?.openingTime || '08:00');
  const [closingTime, setClosingTime] = useState(salon?.closingTime || '21:30');
  const [weeklyClosedDay, setWeeklyClosedDay] = useState(salon?.weeklyClosedDay || 'Tuesday');
  const [avgDuration, setAvgDuration] = useState(salon?.averageServiceDuration || 15);
  const [salonDesc, setSalonDesc] = useState(salon?.description || '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Action feedback message
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const loadData = useCallback(async () => {
    const b = await ownerGetBookings(filterStatus, filterType);
    setBookingsList(b);
    const a = await ownerGetAnalytics();
    setAnalytics(a);
  }, [filterStatus, filterType, ownerGetBookings, ownerGetAnalytics]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Quick Actions
  const handleCallNext = async () => {
    const res = await ownerCallNext();
    if (res.success && res.booking) {
      showToast(`Called Token #${res.booking.tokenNumber} (${res.booking.customerName})`);
    } else {
      showToast(res.error || 'No waiting customers', 'error');
    }
    loadData();
  };

  const handleStart = async (bookingId: string) => {
    const res = await ownerStartService(bookingId);
    if (res.success) {
      showToast('Service started');
    } else {
      showToast(res.error || 'Failed to start', 'error');
    }
    loadData();
  };

  const handleComplete = async (bookingId: string) => {
    const res = await ownerCompleteService(bookingId);
    if (res.success) {
      showToast('Service completed & revenue updated');
    } else {
      showToast(res.error || 'Failed to complete', 'error');
    }
    loadData();
  };

  const handleSkip = async (bookingId: string) => {
    const res = await ownerSkipCustomer(bookingId);
    if (res.success) {
      showToast('Customer marked as skipped');
    } else {
      showToast(res.error || 'Failed to skip', 'error');
    }
    loadData();
  };

  const handleRecall = async (bookingId: string) => {
    const res = await ownerRecallCustomer(bookingId);
    if (res.success) {
      showToast('Customer recalled to queue');
    } else {
      showToast(res.error || 'Failed to recall', 'error');
    }
    loadData();
  };

  const handleCancel = async (bookingId: string) => {
    const res = await ownerCancelBooking(bookingId);
    if (res.success) {
      showToast('Booking cancelled');
    } else {
      showToast(res.error || 'Failed to cancel', 'error');
    }
    loadData();
  };

  const handleAddWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }

    setWalkInLoading(true);
    const res = await ownerAddWalkIn(walkInName.trim(), walkInPhone.trim(), walkInServiceId, walkInNotes);
    setWalkInLoading(false);

    if (res.success && res.booking) {
      showToast(`Added walk-in Token #${res.booking.tokenNumber}!`);
      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInNotes('');
      loadData();
    } else {
      showToast(res.error || 'Failed to add walk-in', 'error');
    }
  };

  const handleSaveSalonProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await ownerUpdateSalon({
      name: salonName.trim(),
      locality: salonLocality.trim(),
      phone: salonPhone.trim(),
      address: salonAddress.trim(),
      googleMapsUrl: salonMapsUrl.trim(),
      openingTime,
      closingTime,
      weeklyClosedDay,
      averageServiceDuration: Number(avgDuration),
      description: salonDesc.trim(),
    });

    if (success) {
      setSaveStatus('Salon profile updated successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
      refreshSalon();
    } else {
      setSaveStatus('Failed to update salon profile');
    }
  };

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceName('');
    setServicePrice(100);
    setServiceDuration(15);
    setShowServiceModal(true);
  };

  const handleOpenEditService = (service: SalonService) => {
    setEditingService(service);
    setServiceName(service.name);
    setServicePrice(service.price);
    setServiceDuration(service.durationMinutes);
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || servicePrice < 0) {
      showToast('Valid service name and price are required', 'error');
      return;
    }

    if (editingService) {
      const ok = await ownerUpdateService(editingService.serviceId, {
        name: serviceName.trim(),
        price: Number(servicePrice),
        durationMinutes: Number(serviceDuration),
      });
      if (ok) showToast('Service updated');
    } else {
      const ok = await ownerAddService({
        name: serviceName.trim(),
        price: Number(servicePrice),
        durationMinutes: Number(serviceDuration),
      });
      if (ok) showToast('New service added');
    }

    setShowServiceModal(false);
    refreshServices();
  };

  const handleToggleService = async (service: SalonService) => {
    const ok = await ownerUpdateService(service.serviceId, { enabled: !service.enabled });
    if (ok) {
      showToast(`Service ${service.enabled ? 'disabled' : 'enabled'}`);
      refreshServices();
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      const ok = await ownerDeleteService(serviceId);
      if (ok) {
        showToast('Service deleted');
        refreshServices();
      }
    }
  };

  const handleStartNewDay = async () => {
    if (confirm('Start new day? Today’s queue token counter will reset to #1. (History remains stored)')) {
      const res = await ownerStartNewDay();
      if (res.success) {
        showToast('New business day started. Tokens reset to #1.');
        loadData();
      }
    }
  };

  const handleClearDemoData = async () => {
    if (confirm('Clear today’s demo bookings and reset queue?')) {
      const ok = await ownerClearDemoData();
      if (ok) {
        showToast("Today's queue cleared.");
        loadData();
      }
    }
  };

  // Find currently serving booking
  const servingBooking = bookingsList.find((b) => b.status === 'serving');
  const calledBooking = bookingsList.find((b) => b.status === 'called');
  const waitingBookings = bookingsList.filter((b) => b.status === 'waiting');
  const otherBookings = bookingsList.filter(
    (b) => b.status === 'completed' || b.status === 'skipped' || b.status === 'cancelled'
  );

  return (
    <div className="space-y-4 pb-24 animate-fade-in text-white">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xl border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-600'
              : 'bg-red-950/95 text-red-200 border-red-600'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Owner Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded">
              Owner Panel
            </span>
            <span className="text-xs text-slate-400">
              {salon?.name} • {salon?.locality}
            </span>
          </div>
          <h2 className="text-lg font-black text-white mt-1">Management Suite</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              logoutOwner();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/80 hover:text-red-300 text-slate-400 border border-slate-700 transition"
            title="Log Out Owner"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        {[
          { id: 'queue', label: 'Live Queue', icon: Ticket },
          { id: 'bookings', label: 'All Bookings', icon: Calendar },
          { id: 'services', label: 'Services', icon: Scissors },
          { id: 'salon', label: 'Salon Profile', icon: Store },
          { id: 'analytics', label: 'Revenue/Stats', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as OwnerSubTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border whitespace-nowrap transition active:scale-95 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== SUB-TAB 1: LIVE QUEUE (1-TAP OPERATION) ==================== */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          {/* Quick Action Bar: Call Next & Add Walk-in */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCallNext}
              className="py-4 px-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm tracking-wider uppercase shadow-lg shadow-red-900/30 active:scale-95 transition flex items-center justify-center gap-2 border border-red-400"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{t.callNext}</span>
            </button>

            <button
              onClick={() => setShowWalkInModal(true)}
              className="py-4 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm tracking-wider uppercase shadow-lg shadow-blue-900/30 active:scale-95 transition flex items-center justify-center gap-2 border border-blue-400"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>{t.addCustomer}</span>
            </button>
          </div>

          {/* CURRENTLY SERVING BOX */}
          <div className="bg-slate-900/90 border-2 border-emerald-500/80 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                NOW SERVING IN CHAIR
              </span>
              {servingBooking && (
                <span className="text-[10px] text-slate-400">
                  {servingBooking.bookingType.toUpperCase()}
                </span>
              )}
            </div>

            {servingBooking ? (
              <div className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md">
                    #{servingBooking.tokenNumber}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-white">
                      {servingBooking.customerName}
                    </h4>
                    <p className="text-xs text-amber-400 font-semibold">
                      {servingBooking.serviceName} • ₹{servingBooking.priceAtBooking}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      📞 {servingBooking.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleComplete(servingBooking.bookingId)}
                  className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs uppercase shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>COMPLETE</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center text-slate-500 text-xs">
                No customer currently in service chair. Tap CALL NEXT.
              </div>
            )}
          </div>

          {/* CALLED CUSTOMER (IF ANY) */}
          {calledBooking && (
            <div className="bg-slate-900/90 border-2 border-red-500/80 rounded-3xl p-4 shadow-xl space-y-3 animate-pulse">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                🔔 CALLED & WAITING TO ENTER
              </span>

              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500 text-white font-black text-lg flex items-center justify-center">
                    #{calledBooking.tokenNumber}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {calledBooking.customerName}
                    </h4>
                    <p className="text-xs text-amber-400">
                      {calledBooking.serviceName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStart(calledBooking.bookingId)}
                    className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase shadow active:scale-95"
                  >
                    START
                  </button>
                  <button
                    onClick={() => handleSkip(calledBooking.bookingId)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs active:scale-95"
                    title="Skip customer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WAITING QUEUE LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Waiting in Queue ({waitingBookings.length})</span>
              </h3>
            </div>

            {waitingBookings.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
                No customers waiting right now.
              </div>
            ) : (
              <div className="space-y-2">
                {waitingBookings.map((b) => (
                  <div
                    key={b.bookingId}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 font-black text-sm flex items-center justify-center border border-slate-700">
                        #{b.tokenNumber}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>{b.customerName}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-normal">
                            {b.bookingType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {b.serviceName} • ₹{b.priceAtBooking} • {b.bookingTime}
                        </div>
                      </div>
                    </div>

                    {/* Single-tap buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStart(b.bookingId)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-95"
                        title="Start Service"
                      >
                        Start
                      </button>

                      <button
                        onClick={() => handleSkip(b.bookingId)}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400 active:scale-95"
                        title="Skip"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCancel(b.bookingId)}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 active:scale-95"
                        title="Cancel"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECALL SKIPPED CUSTOMERS (IF ANY) */}
          {bookingsList.some((b) => b.status === 'skipped') && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider px-1">
                Skipped Customers (Can Recall)
              </h3>
              <div className="space-y-1.5">
                {bookingsList
                  .filter((b) => b.status === 'skipped')
                  .map((b) => (
                    <div
                      key={b.bookingId}
                      className="bg-slate-950 border border-amber-900/50 rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">
                          #{b.tokenNumber}
                        </span>
                        <span className="text-slate-300">{b.customerName}</span>
                        <span className="text-slate-500">({b.serviceName})</span>
                      </div>
                      <button
                        onClick={() => handleRecall(b.bookingId)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition active:scale-95"
                      >
                        Recall to Queue
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 2: BOOKINGS LIST ==================== */}
      {activeSubTab === 'bookings' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap gap-2 text-xs">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="called">Called</option>
              <option value="serving">Serving</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="online">Online Only</option>
              <option value="walk-in">Walk-in Only</option>
            </select>

            <button
              onClick={loadData}
              className="ml-auto px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 flex items-center gap-1 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Bookings Card List */}
          {bookingsList.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              No bookings matching filter.
            </div>
          ) : (
            <div className="space-y-2">
              {bookingsList.map((b) => (
                <div
                  key={b.bookingId}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 font-black text-sm flex items-center justify-center border border-slate-700">
                      #{b.tokenNumber}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">
                        {b.customerName}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {b.serviceName} • ₹{b.priceAtBooking} • {b.bookingTime}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        📞 {b.phone} • {b.bookingType}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : b.status === 'serving'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : b.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {b.status}
                    </span>

                    {/* Quick action buttons if still waiting */}
                    {b.status === 'waiting' && (
                      <div className="flex gap-1 mt-2 justify-end">
                        <button
                          onClick={() => handleStart(b.bookingId)}
                          className="px-2 py-0.5 rounded bg-emerald-600 text-[10px] text-white font-bold"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => handleCancel(b.bookingId)}
                          className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-red-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 3: SERVICES MANAGEMENT ==================== */}
      {activeSubTab === 'services' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Manage Services & Prices
            </h3>
            <button
              onClick={handleOpenAddService}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 shadow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t.addNewService}</span>
            </button>
          </div>

          <div className="space-y-2">
            {services.map((srv) => (
              <div
                key={srv.serviceId}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{srv.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        srv.enabled
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {srv.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="text-xs text-amber-400 font-bold mt-0.5">
                    ₹{srv.price}{' '}
                    <span className="text-slate-400 font-normal">
                      • {srv.durationMinutes} mins
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleService(srv)}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white"
                  >
                    {srv.enabled ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    onClick={() => handleOpenEditService(srv)}
                    className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700"
                    title="Edit Service"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteService(srv.serviceId)}
                    className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950"
                    title="Delete Service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 4: SALON PROFILE MANAGEMENT ==================== */}
      {activeSubTab === 'salon' && (
        <form
          onSubmit={handleSaveSalonProfile}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-xl text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              Edit Salon Details
            </h3>
            {saveStatus && (
              <span className="text-emerald-400 font-semibold text-xs">
                {saveStatus}
              </span>
            )}
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Salon Name</label>
            <input
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Locality / Area</label>
            <input
              type="text"
              value={salonLocality}
              onChange={(e) => setSalonLocality(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">
              Salon Phone Number (Used by Call Salon button)
            </label>
            <input
              type="tel"
              value={salonPhone}
              onChange={(e) => setSalonPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">
              Exact Address (Alargo)
            </label>
            <input
              type="text"
              value={salonAddress}
              onChange={(e) => setSalonAddress(e.target.value)}
              placeholder="e.g. Main Market, Near Bus Stand, Alargo"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">
              Google Maps URL / Location Link
            </label>
            <input
              type="url"
              value={salonMapsUrl}
              onChange={(e) => setSalonMapsUrl(e.target.value)}
              placeholder="e.g. https://maps.app.goo.gl/..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                {t.openingTime}
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                {t.closingTime}
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                {t.weeklyClosedDay}
              </label>
              <select
                value={weeklyClosedDay}
                onChange={(e) => setWeeklyClosedDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
                <option value="None">None (Open 7 Days)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                Avg Service Mins
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={avgDuration}
                onChange={(e) => setAvgDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Description</label>
            <textarea
              rows={2}
              value={salonDesc}
              onChange={(e) => setSalonDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs uppercase tracking-wider"
          >
            {t.saveChanges}
          </button>
        </form>
      )}

      {/* ==================== SUB-TAB 5: ANALYTICS & REVENUE ==================== */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-3.5">
          <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-600/50 rounded-3xl p-5 shadow-xl">
            <span className="text-xs uppercase font-extrabold text-emerald-400">
              {t.estimatedRevenue} (Today)
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white mt-1">
              ₹{analytics?.estimatedRevenue || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Strictly calculated from priceAtBooking of completed services only.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-400">Total Bookings</span>
              <div className="text-xl font-black text-white mt-1">
                {analytics?.totalCustomers || 0}
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-400">Completed Services</span>
              <div className="text-xl font-black text-emerald-400 mt-1">
                {analytics?.completedServices || 0}
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-400">Online Bookings</span>
              <div className="text-xl font-black text-blue-400 mt-1">
                {analytics?.onlineBookings || 0}
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <span className="text-slate-400">Walk-in Customers</span>
              <div className="text-xl font-black text-amber-400 mt-1">
                {analytics?.walkInCustomers || 0}
              </div>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Service-wise Completed Count
            </h4>
            {analytics?.serviceBreakdown && Object.keys(analytics.serviceBreakdown).length > 0 ? (
              <div className="space-y-1.5">
                {Object.entries(analytics.serviceBreakdown).map(([name, count]) => (
                  <div key={name} className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-300">{name}</span>
                    <span className="font-bold text-amber-400">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No services completed yet today.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 6: SETTINGS ==================== */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl text-xs">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider">
            Operational Controls
          </h3>

          {/* Online Booking Switch */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="font-bold text-white text-sm">Online Booking Switch</div>
              <div className="text-slate-400 text-[11px]">
                {salon?.onlineBookingEnabled ? 'Open for remote tokens' : 'Closed for remote tokens'}
              </div>
            </div>

            <button
              onClick={ownerToggleOnlineBooking}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition active:scale-95 ${
                salon?.onlineBookingEnabled
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-red-500 text-white'
              }`}
            >
              {salon?.onlineBookingEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Salon Status Switch */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="font-bold text-white text-sm">Manual Salon Status</div>
              <div className="text-slate-400 text-[11px]">
                {salon?.isManuallyClosed ? 'Manually Closed' : 'Open as per schedule'}
              </div>
            </div>

            <button
              onClick={ownerToggleSalonStatus}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition active:scale-95 ${
                salon?.isManuallyClosed ? 'bg-red-500 text-white' : 'bg-emerald-500 text-slate-950'
              }`}
            >
              {salon?.isManuallyClosed ? 'CLOSED' : 'OPEN'}
            </button>
          </div>

          {/* Start New Day */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="font-bold text-white text-sm">{t.startNewDay}</div>
              <div className="text-slate-400 text-[11px]">
                Resets daily tokens to #1 for a fresh queue
              </div>
            </div>

            <button
              onClick={handleStartNewDay}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs active:scale-95"
            >
              Start New Day
            </button>
          </div>

          {/* Clear Demo Data */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-red-400 text-sm">{t.resetTodayQueue}</div>
              <div className="text-slate-400 text-[11px]">
                Clear today’s demo bookings and queue
              </div>
            </div>

            <button
              onClick={handleClearDemoData}
              className="px-3.5 py-2 rounded-xl bg-red-950 text-red-300 border border-red-800 font-bold text-xs active:scale-95"
            >
              Reset Queue
            </button>
          </div>
        </div>
      )}

      {/* ==================== WALK-IN CUSTOMER MODAL ==================== */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-sm shadow-2xl text-left space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-white text-base">Add Walk-in Customer</h3>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddWalkInSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Customer Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Suresh"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Select Service
                </label>
                <select
                  value={walkInServiceId}
                  onChange={(e) => setWalkInServiceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {services.map((s) => (
                    <option key={s.serviceId} value={s.serviceId}>
                      {s.name} — ₹{s.price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={walkInNotes}
                  onChange={(e) => setWalkInNotes(e.target.value)}
                  placeholder="e.g. requested short sides"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={walkInLoading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase active:scale-95 transition"
              >
                {walkInLoading ? 'Adding...' : 'Generate Token & Add to Queue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT SERVICE MODAL ==================== */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 w-full max-w-sm shadow-2xl text-left space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-white text-base">
                {editingService ? t.editService : t.addNewService}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {t.serviceName} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. Beard Trim & Style"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {t.price} (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {t.duration}
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase active:scale-95 transition"
              >
                {t.saveChanges}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
