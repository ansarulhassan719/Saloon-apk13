import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Salon,
  SalonService,
  Booking,
  QueueSummary,
  OwnerUser,
  AnalyticsSummary,
} from '../types.ts';
import { Language, translations } from '../translations.ts';
import { soundEffects } from '../soundEffects.ts';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations.en;
  salon: Salon | null;
  services: SalonService[];
  queue: QueueSummary | null;
  loading: boolean;
  error: string | null;
  activeBooking: Booking | null;
  savedPhone: string;
  setSavedPhone: (phone: string) => void;
  ownerUser: OwnerUser | null;
  isOwnerLoggedIn: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  refreshSalon: () => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshQueue: () => Promise<void>;
  bookToken: (
    customerName: string,
    phone: string,
    serviceId: string,
    preferredTime?: string,
    notes?: string
  ) => Promise<{ success: boolean; booking?: Booking; error?: string; customersAhead?: number; estimatedWaitMinutes?: number }>;
  getMyBookings: (phone?: string) => Promise<{ todayBooking?: Booking; previousBookings: Booking[]; customersAhead: number; estimatedWait: number }>;
  loginOwner: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutOwner: () => void;
  ownerCallNext: () => Promise<{ success: boolean; booking?: Booking; error?: string }>;
  ownerStartService: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  ownerCompleteService: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  ownerSkipCustomer: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  ownerRecallCustomer: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  ownerCancelBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  ownerAddWalkIn: (name: string, phone: string, serviceId: string, notes?: string) => Promise<{ success: boolean; booking?: Booking; error?: string }>;
  ownerToggleOnlineBooking: () => Promise<boolean>;
  ownerToggleSalonStatus: () => Promise<boolean>;
  ownerStartNewDay: () => Promise<{ success: boolean; message?: string }>;
  ownerUpdateSalon: (data: Partial<Salon>) => Promise<boolean>;
  ownerAddService: (data: { name: string; price: number; durationMinutes?: number }) => Promise<boolean>;
  ownerUpdateService: (serviceId: string, data: Partial<SalonService>) => Promise<boolean>;
  ownerDeleteService: (serviceId: string) => Promise<boolean>;
  ownerGetBookings: (status?: string, type?: string) => Promise<Booking[]>;
  ownerGetAnalytics: () => Promise<AnalyticsSummary | null>;
  ownerClearDemoData: () => Promise<boolean>;
  openGoogleMaps: () => { success: boolean; message?: string };
  callSalonPhone: () => { success: boolean; message?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SALON_ID = 'sahjahan-alargo';

const DEFAULT_SALON: Salon = {
  salonId: 'sahjahan-alargo',
  name: 'Sahjahan Saloon',
  locality: 'Alargo',
  phone: '',
  address: '',
  description: 'Welcome to Sahjahan Saloon – Alargo. Clean haircuts, smooth shaving, refreshing facials, and traditional barber craftsmanship. Take a digital token or walk in anytime!',
  logo: '',
  photos: [],
  googleMapsUrl: '',
  latitude: null,
  longitude: null,
  openingTime: '08:00',
  closingTime: '21:30',
  weeklyClosedDay: 'Tuesday',
  onlineBookingEnabled: true,
  isManuallyClosed: false,
  averageServiceDuration: 15,
  maxDailyBookings: 60,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SERVICES: SalonService[] = [
  { serviceId: 'srv-1', salonId: 'sahjahan-alargo', name: 'Hair Cutting', price: 100, durationMinutes: 20, enabled: true, createdAt: '', updatedAt: '' },
  { serviceId: 'srv-2', salonId: 'sahjahan-alargo', name: 'Shaving', price: 50, durationMinutes: 10, enabled: true, createdAt: '', updatedAt: '' },
  { serviceId: 'srv-3', salonId: 'sahjahan-alargo', name: 'Facial', price: 200, durationMinutes: 30, enabled: true, createdAt: '', updatedAt: '' },
];

const DEFAULT_QUEUE: QueueSummary = {
  salonId: 'sahjahan-alargo',
  date: new Date().toISOString().slice(0, 10),
  nowServingToken: null,
  nowServingCustomerName: null,
  nowServingService: null,
  calledToken: null,
  calledCustomerName: null,
  waitingCount: 0,
  waitingTokens: [],
  estimatedWaitMinutes: 0,
  isSalonOpen: true,
  onlineBookingOpen: true,
  totalBookingsToday: 0,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('sahjahan_lang') as Language) || 'en';
  });

  const [salon, setSalon] = useState<Salon>(DEFAULT_SALON);
  const [services, setServices] = useState<SalonService[]>(DEFAULT_SERVICES);
  const [queue, setQueue] = useState<QueueSummary>(DEFAULT_QUEUE);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [savedPhone, setSavedPhoneState] = useState<string>(() => {
    return localStorage.getItem('sahjahan_phone') || '';
  });

  const [activeBooking, setActiveBooking] = useState<Booking | null>(() => {
    try {
      const stored = localStorage.getItem('sahjahan_active_booking');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [ownerToken, setOwnerToken] = useState<string | null>(() => {
    return localStorage.getItem('sahjahan_owner_token') || null;
  });

  const [ownerUser, setOwnerUser] = useState<OwnerUser | null>(() => {
    try {
      const stored = localStorage.getItem('sahjahan_owner_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('sahjahan_lang', newLang);
  };

  const setSavedPhone = (phone: string) => {
    setSavedPhoneState(phone);
    localStorage.setItem('sahjahan_phone', phone);
  };

  const t = translations[lang] || translations.en;

  // 1. Fetch Salon Details
  const refreshSalon = useCallback(async () => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.salon) {
        setSalon(data.salon);
      }
      if (data?.queueSummary) {
        setQueue(data.queueSummary);
      }
    } catch (err) {
      console.warn('Silent note: using cached salon info', err);
    }
  }, []);

  // 2. Fetch Services
  const refreshServices = useCallback(async () => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/services`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.services) && data.services.length > 0) {
        setServices(data.services);
      }
    } catch (err) {
      console.warn('Silent note: using default services', err);
    }
  }, []);

  // 3. Fetch Live Queue Summary
  const refreshQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/queue`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.salonId) {
        setQueue(data);
      }
    } catch (err) {
      console.warn('Silent note: queue refresh pending', err);
    }
  }, []);

  // Sync active booking status if any
  const syncActiveBooking = useCallback(async () => {
    if (!activeBooking) return;
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/bookings/${activeBooking.bookingId}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.booking) {
          const prevStatus = activeBooking.status;
          setActiveBooking(data.booking);
          localStorage.setItem('sahjahan_active_booking', JSON.stringify(data.booking));

          // Chime or speak when called
          if (prevStatus !== 'called' && data.booking.status === 'called') {
            soundEffects.playChime();
            soundEffects.speakToken(data.booking.tokenNumber, data.booking.customerName, lang);
          }
        }
      }
    } catch {
      // offline fallback
    }
  }, [activeBooking, lang]);

  // Initial load
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await Promise.allSettled([refreshSalon(), refreshServices(), refreshQueue()]);
      if (mounted) setLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, [refreshSalon, refreshServices, refreshQueue]);

  // Periodic queue auto-sync every 3.5 seconds (clean HTTP polling, zero connection leakage)
  useEffect(() => {
    let isFetching = false;
    const interval = setInterval(async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        await Promise.allSettled([refreshQueue(), syncActiveBooking()]);
      } finally {
        isFetching = false;
      }
    }, 3500);

    return () => {
      clearInterval(interval);
    };
  }, [refreshQueue, syncActiveBooking]);

  // Book Token (Customer)
  const bookToken = async (
    customerName: string,
    phone: string,
    serviceId: string,
    preferredTime?: string,
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          serviceId,
          preferredTime,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to book token' };
      }

      setActiveBooking(data.booking);
      localStorage.setItem('sahjahan_active_booking', JSON.stringify(data.booking));
      setSavedPhone(phone);
      soundEffects.playChime();
      await refreshQueue();

      return {
        success: true,
        booking: data.booking,
        customersAhead: data.customersAhead,
        estimatedWaitMinutes: data.estimatedWaitMinutes,
      };
    } catch {
      return { success: false, error: 'Network error. Please check your internet connection.' };
    }
  };

  // Get My Bookings (Customer)
  const getMyBookings = async (phoneParam?: string) => {
    const p = phoneParam || savedPhone;
    if (!p) return { previousBookings: [], customersAhead: 0, estimatedWait: 0 };

    try {
      const res = await fetch(`/api/salons/${SALON_ID}/bookings/my?phone=${encodeURIComponent(p)}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      if (data.todayBooking) {
        setActiveBooking(data.todayBooking);
        localStorage.setItem('sahjahan_active_booking', JSON.stringify(data.todayBooking));
      }
      return data;
    } catch {
      return { previousBookings: [], customersAhead: 0, estimatedWait: 0 };
    }
  };

  // Owner Login
  const loginOwner = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/owner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      setOwnerToken(data.token);
      setOwnerUser(data.owner);
      localStorage.setItem('sahjahan_owner_token', data.token);
      localStorage.setItem('sahjahan_owner_user', JSON.stringify(data.owner));
      return { success: true };
    } catch {
      return { success: false, error: 'Network error during login' };
    }
  };

  // Owner Logout
  const logoutOwner = () => {
    setOwnerToken(null);
    setOwnerUser(null);
    localStorage.removeItem('sahjahan_owner_token');
    localStorage.removeItem('sahjahan_owner_user');
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ownerToken || ''}`,
  });

  // Owner Queue Actions
  const ownerCallNext = async () => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/call-next`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      soundEffects.playChime();
      soundEffects.speakToken(data.booking.tokenNumber, data.booking.customerName, 'hi');
      await refreshQueue();
      return { success: true, booking: data.booking };
    } catch {
      return { success: false, error: 'Failed to call next customer' };
    }
  };

  const ownerStartService = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/start-service/${bookingId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      soundEffects.playScissorSnip();
      await refreshQueue();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to start service' };
    }
  };

  const ownerCompleteService = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/complete/${bookingId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      soundEffects.playChime();
      await refreshQueue();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to complete service' };
    }
  };

  const ownerSkipCustomer = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/skip/${bookingId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      await refreshQueue();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to skip customer' };
    }
  };

  const ownerRecallCustomer = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/recall/${bookingId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      await refreshQueue();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to recall customer' };
    }
  };

  const ownerCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/cancel/${bookingId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      await refreshQueue();
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to cancel booking' };
    }
  };

  const ownerAddWalkIn = async (name: string, phone: string, serviceId: string, notes?: string) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/walk-in`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ customerName: name, phone, serviceId, notes }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      soundEffects.playChime();
      await refreshQueue();
      return { success: true, booking: data.booking };
    } catch {
      return { success: false, error: 'Failed to add walk-in customer' };
    }
  };

  const ownerToggleOnlineBooking = async () => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/toggle-online-booking`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        if (salon) salon.onlineBookingEnabled = data.onlineBookingEnabled;
        await refreshSalon();
        return true;
      }
    } catch {
      // error
    }
    return false;
  };

  const ownerToggleSalonStatus = async () => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/toggle-salon-status`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        if (salon) salon.isManuallyClosed = data.isManuallyClosed;
        await refreshSalon();
        return true;
      }
    } catch {
      // error
    }
    return false;
  };

  const ownerStartNewDay = async () => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/start-new-day`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      await refreshQueue();
      return { success: res.ok, message: data.message };
    } catch {
      return { success: false, message: 'Failed to start new day' };
    }
  };

  const ownerUpdateSalon = async (data: Partial<Salon>) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await refreshSalon();
        return true;
      }
    } catch {
      // error
    }
    return false;
  };

  const ownerAddService = async (data: { name: string; price: number; durationMinutes?: number }) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/services`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await refreshServices();
        return true;
      }
    } catch {
      // error
    }
    return false;
  };

  const ownerUpdateService = async (serviceId: string, data: Partial<SalonService>) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/services/${serviceId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await refreshServices();
        return true;
      }
    } catch {
      // error
    }
    return false;
  };

  const ownerDeleteService = async (serviceId: string) => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/services/${serviceId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        await refreshServices();
        return true;
      }
    } catch {
      // error
    }
    return false;
  };

  const ownerGetBookings = async (status?: string, type?: string) => {
    try {
      let url = `/api/salons/${SALON_ID}/owner/bookings?`;
      if (status) url += `status=${status}&`;
      if (type) url += `type=${type}&`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.bookings || [];
      }
    } catch {
      // error
    }
    return [];
  };

  const ownerGetAnalytics = async () => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/analytics`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        return (await res.json()) as AnalyticsSummary;
      }
    } catch {
      // error
    }
    return null;
  };

  const ownerClearDemoData = async () => {
    try {
      const res = await fetch(`/api/salons/${SALON_ID}/owner/clear-demo-data`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        await refreshQueue();
        return true;
      }
    } catch {
      // error
    }
    return false;
  };

  // Google Maps helper
  const openGoogleMaps = (): { success: boolean; message?: string } => {
    if (!salon) return { success: false, message: 'Salon details not loaded' };

    if (salon.googleMapsUrl && salon.googleMapsUrl.trim().length > 0) {
      window.open(salon.googleMapsUrl.trim(), '_blank', 'noopener,noreferrer');
      return { success: true };
    }

    if (salon.latitude && salon.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return { success: true };
    }

    if (salon.address && salon.address.trim().length > 0) {
      const query = encodeURIComponent(`${salon.address}, ${salon.locality}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return { success: true };
    }

    return {
      success: false,
      message: t.noLocationMsg,
    };
  };

  // Phone Call helper
  const callSalonPhone = (): { success: boolean; message?: string } => {
    if (!salon || !salon.phone || salon.phone.trim().length === 0) {
      return {
        success: false,
        message: t.noPhoneMsg,
      };
    }

    const clean = salon.phone.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${clean}`;
    return { success: true };
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        salon,
        services,
        queue,
        loading,
        error,
        activeBooking,
        savedPhone,
        setSavedPhone,
        ownerUser,
        isOwnerLoggedIn: Boolean(ownerToken),
        soundEnabled,
        setSoundEnabled,
        refreshSalon,
        refreshServices,
        refreshQueue,
        bookToken,
        getMyBookings,
        loginOwner,
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
        openGoogleMaps,
        callSalonPhone,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
