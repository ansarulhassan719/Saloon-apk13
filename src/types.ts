export type BookingStatus = 
  | 'waiting' 
  | 'called' 
  | 'serving' 
  | 'completed' 
  | 'skipped' 
  | 'cancelled';

export type BookingType = 'online' | 'walk-in';

export interface Salon {
  salonId: string;
  name: string;
  locality: string;
  phone: string;
  address: string;
  description: string;
  logo: string;
  photos: string[];
  googleMapsUrl: string;
  latitude: number | null;
  longitude: number | null;
  openingTime: string; // e.g. "08:00"
  closingTime: string; // e.g. "21:30"
  weeklyClosedDay: string; // e.g. "Tuesday"
  onlineBookingEnabled: boolean;
  isManuallyClosed: boolean;
  averageServiceDuration: number; // in minutes (default 15)
  maxDailyBookings: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalonService {
  serviceId: string;
  salonId: string;
  name: string;
  price: number;
  durationMinutes: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  bookingId: string;
  salonId: string;
  customerId: string;
  customerName: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  priceAtBooking: number;
  tokenNumber: number;
  date: string; // YYYY-MM-DD
  bookingTime: string; // e.g. "2:30 PM"
  status: BookingStatus;
  bookingType: BookingType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  calledAt?: string;
  servingAt?: string;
  completedAt?: string;
}

export interface QueueState {
  salonId: string;
  date: string; // YYYY-MM-DD
  lastTokenNumber: number;
  currentServingToken: number | null;
  currentCalledToken: number | null;
  updatedAt: string;
}

export interface QueueSummary {
  salonId: string;
  date: string;
  nowServingToken: number | null;
  nowServingCustomerName: string | null;
  nowServingService: string | null;
  calledToken: number | null;
  calledCustomerName: string | null;
  waitingCount: number;
  waitingTokens: number[];
  estimatedWaitMinutes: number;
  isSalonOpen: boolean;
  onlineBookingOpen: boolean;
  totalBookingsToday: number;
}

export interface AnalyticsSummary {
  date: string;
  totalCustomers: number;
  onlineBookings: number;
  walkInCustomers: number;
  completedServices: number;
  cancelledBookings: number;
  skippedBookings: number;
  estimatedRevenue: number;
  serviceBreakdown: { [serviceName: string]: number };
}

export interface OwnerUser {
  id: string;
  username: string;
  name: string;
  salonId: string;
}
