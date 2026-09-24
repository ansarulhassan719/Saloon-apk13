import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import {
  Salon,
  SalonService,
  Booking,
  QueueState,
  BookingStatus,
  BookingType,
  OwnerUser,
  AnalyticsSummary,
  QueueSummary,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) === 8080 ? 3000 : (Number(process.env.PORT) || 3000);

// Enable CORS for all routes and preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Direct project zip download endpoints
app.get(['/download.zip', '/sahjahan-saloon-app.zip', '/api/download-zip'], (_req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'sahjahan-saloon-app.zip');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="sahjahan-saloon-app.zip"');
    res.sendFile(filePath);
  } else {
    res.status(404).send('ZIP file not found');
  }
});

// Persistent database file path
const DATA_DIR = path.resolve(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'salon_db.json');

interface DatabaseSchema {
  salons: Record<string, Salon>;
  services: Record<string, SalonService[]>;
  bookings: Record<string, Booking[]>;
  queueStates: Record<string, Record<string, QueueState>>; // salonId -> date -> QueueState
  owners: OwnerUser[];
  ownerTokens: Record<string, { username: string; salonId: string; expiresAt: number }>;
}

// In-memory DB cache
let db: DatabaseSchema = {
  salons: {},
  services: {},
  bookings: {},
  queueStates: {},
  owners: [],
  ownerTokens: {},
};

// SSE Listeners for real-time queue updates
const sseClients: Map<string, Response[]> = new Map();

function broadcastQueueUpdate(salonId: string) {
  const clients = sseClients.get(salonId) || [];
  const summary = getQueueSummary(salonId);
  const data = JSON.stringify(summary);
  clients.forEach((res) => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {
      // client disconnected
    }
  });
}

// Date helper in YYYY-MM-DD format
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format time string e.g. "2:30 PM"
function formatTimeString(date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Ensure database directory and file
function loadDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
    } catch (err) {
      console.error('Error loading database, initializing default:', err);
      seedDefaultData();
    }
  } else {
    seedDefaultData();
  }
}

function saveDatabase() {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

// Password hash for default owner account: username 'owner', password 'sahjahan123'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('sahjahan123', 10);

function seedDefaultData() {
  const initialSalonId = 'sahjahan-alargo';
  const today = getTodayDateString();

  db.salons = {
    [initialSalonId]: {
      salonId: initialSalonId,
      name: 'Sahjahan Saloon',
      locality: 'Alargo',
      phone: '', // Owner enters their real phone number
      address: '', // Owner enters their real address
      description: 'Welcome to Sahjahan Saloon – Alargo. Clean haircuts, smooth shaving, refreshing facials, and traditional barber craftsmanship. Take a digital token or walk in anytime!',
      logo: '',
      photos: [],
      googleMapsUrl: '', // Owner enters exact Google Maps location
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
    },
  };

  db.services = {
    [initialSalonId]: [
      {
        serviceId: 'srv-1',
        salonId: initialSalonId,
        name: 'Hair Cutting',
        price: 100,
        durationMinutes: 20,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        serviceId: 'srv-2',
        salonId: initialSalonId,
        name: 'Shaving',
        price: 50,
        durationMinutes: 10,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        serviceId: 'srv-3',
        salonId: initialSalonId,
        name: 'Facial',
        price: 200,
        durationMinutes: 30,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  // Demo queue setup
  db.bookings = {
    [initialSalonId]: [
      {
        bookingId: 'demo-b1',
        salonId: initialSalonId,
        customerId: 'cust-demo-1',
        customerName: 'Rahul Kumar',
        phone: '9876543210',
        serviceId: 'srv-1',
        serviceName: 'Hair Cutting',
        priceAtBooking: 100,
        tokenNumber: 1,
        date: today,
        bookingTime: '08:30 AM',
        status: 'serving',
        bookingType: 'walk-in',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        servingAt: new Date().toISOString(),
      },
      {
        bookingId: 'demo-b2',
        salonId: initialSalonId,
        customerId: 'cust-demo-2',
        customerName: 'Aman Verma',
        phone: '9812345678',
        serviceId: 'srv-2',
        serviceName: 'Shaving',
        priceAtBooking: 50,
        tokenNumber: 2,
        date: today,
        bookingTime: '09:00 AM',
        status: 'waiting',
        bookingType: 'online',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        bookingId: 'demo-b3',
        salonId: initialSalonId,
        customerId: 'cust-demo-3',
        customerName: 'Mohd. Imran',
        phone: '9898989898',
        serviceId: 'srv-3',
        serviceName: 'Facial',
        priceAtBooking: 200,
        tokenNumber: 3,
        date: today,
        bookingTime: '09:15 AM',
        status: 'waiting',
        bookingType: 'online',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  db.queueStates = {
    [initialSalonId]: {
      [today]: {
        salonId: initialSalonId,
        date: today,
        lastTokenNumber: 3,
        currentServingToken: 1,
        currentCalledToken: null,
        updatedAt: new Date().toISOString(),
      },
    },
  };

  db.owners = [
    {
      id: 'owner-1',
      username: 'owner',
      name: 'Saloon Owner',
      salonId: initialSalonId,
    },
  ];

  db.ownerTokens = {};

  saveDatabase();
}

loadDatabase();

// Authentication middleware for Owner routes
function authenticateOwner(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Owner login required' });
  }

  const token = authHeader.split(' ')[1];
  const session = db.ownerTokens[token];

  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Session expired or invalid, please log in again' });
  }

  (req as unknown as { owner: typeof session }).owner = session;
  next();
}

// Queue Calculation Helper
function getQueueSummary(salonId: string, targetDate?: string): QueueSummary {
  const salon = db.salons[salonId];
  const date = targetDate || getTodayDateString();

  if (!salon) {
    return {
      salonId,
      date,
      nowServingToken: null,
      nowServingCustomerName: null,
      nowServingService: null,
      calledToken: null,
      calledCustomerName: null,
      waitingCount: 0,
      waitingTokens: [],
      estimatedWaitMinutes: 0,
      isSalonOpen: false,
      onlineBookingOpen: false,
      totalBookingsToday: 0,
    };
  }

  const bookings = (db.bookings[salonId] || []).filter((b) => b.date === date);
  const servingBooking = bookings.find((b) => b.status === 'serving');
  const calledBooking = bookings.find((b) => b.status === 'called');
  const waitingBookings = bookings.filter((b) => b.status === 'waiting' || b.status === 'called');

  // Check if today matches weekly closed day
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isWeeklyClosed = salon.weeklyClosedDay.toLowerCase() === todayDayName.toLowerCase();
  const isSalonOpen = !salon.isManuallyClosed && !isWeeklyClosed;

  const avgDuration = salon.averageServiceDuration || 15;
  const estimatedWaitMinutes = waitingBookings.length * avgDuration;

  return {
    salonId,
    date,
    nowServingToken: servingBooking ? servingBooking.tokenNumber : null,
    nowServingCustomerName: servingBooking ? servingBooking.customerName : null,
    nowServingService: servingBooking ? servingBooking.serviceName : null,
    calledToken: calledBooking ? calledBooking.tokenNumber : null,
    calledCustomerName: calledBooking ? calledBooking.customerName : null,
    waitingCount: waitingBookings.length,
    waitingTokens: waitingBookings.map((b) => b.tokenNumber),
    estimatedWaitMinutes,
    isSalonOpen,
    onlineBookingOpen: salon.onlineBookingEnabled && isSalonOpen,
    totalBookingsToday: bookings.length,
  };
}

// Atomic Token Allocation
function allocateNextToken(salonId: string, date: string): number {
  if (!db.queueStates[salonId]) {
    db.queueStates[salonId] = {};
  }
  if (!db.queueStates[salonId][date]) {
    db.queueStates[salonId][date] = {
      salonId,
      date,
      lastTokenNumber: 0,
      currentServingToken: null,
      currentCalledToken: null,
      updatedAt: new Date().toISOString(),
    };
  }

  const state = db.queueStates[salonId][date];
  state.lastTokenNumber += 1;
  state.updatedAt = new Date().toISOString();
  saveDatabase();
  return state.lastTokenNumber;
}

// ======================== API ROUTES ========================

// 1. Get Salons
app.get('/api/salons', (_req: Request, res: Response) => {
  const list = Object.values(db.salons);
  res.json({ salons: list });
});

// 2. Get Single Salon
app.get('/api/salons/:salonId', (req: Request, res: Response) => {
  const salon = db.salons[req.params.salonId];
  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }
  const summary = getQueueSummary(salon.salonId);
  res.json({ salon, queueSummary: summary });
});

// 3. Update Salon Details (Owner)
app.put('/api/salons/:salonId', authenticateOwner, (req: Request, res: Response) => {
  const salon = db.salons[req.params.salonId];
  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }

  const {
    name,
    locality,
    phone,
    address,
    description,
    logo,
    photos,
    googleMapsUrl,
    latitude,
    longitude,
    openingTime,
    closingTime,
    weeklyClosedDay,
    onlineBookingEnabled,
    isManuallyClosed,
    averageServiceDuration,
    maxDailyBookings,
  } = req.body;

  if (name !== undefined) salon.name = String(name).trim();
  if (locality !== undefined) salon.locality = String(locality).trim();
  if (phone !== undefined) salon.phone = String(phone).trim();
  if (address !== undefined) salon.address = String(address).trim();
  if (description !== undefined) salon.description = String(description).trim();
  if (logo !== undefined) salon.logo = String(logo);
  if (photos !== undefined && Array.isArray(photos)) salon.photos = photos;
  if (googleMapsUrl !== undefined) salon.googleMapsUrl = String(googleMapsUrl).trim();
  if (latitude !== undefined) salon.latitude = latitude ? Number(latitude) : null;
  if (longitude !== undefined) salon.longitude = longitude ? Number(longitude) : null;
  if (openingTime !== undefined) salon.openingTime = String(openingTime);
  if (closingTime !== undefined) salon.closingTime = String(closingTime);
  if (weeklyClosedDay !== undefined) salon.weeklyClosedDay = String(weeklyClosedDay);
  if (onlineBookingEnabled !== undefined) salon.onlineBookingEnabled = Boolean(onlineBookingEnabled);
  if (isManuallyClosed !== undefined) salon.isManuallyClosed = Boolean(isManuallyClosed);
  if (averageServiceDuration !== undefined) salon.averageServiceDuration = Math.max(1, Number(averageServiceDuration));
  if (maxDailyBookings !== undefined) salon.maxDailyBookings = Math.max(1, Number(maxDailyBookings));

  salon.updatedAt = new Date().toISOString();
  saveDatabase();
  broadcastQueueUpdate(salon.salonId);

  res.json({ success: true, salon });
});

// 4. Get Services
app.get('/api/salons/:salonId/services', (req: Request, res: Response) => {
  const services = db.services[req.params.salonId] || [];
  res.json({ services });
});

// 5. Add Service (Owner)
app.post('/api/salons/:salonId/services', authenticateOwner, (req: Request, res: Response) => {
  const { salonId } = req.params;
  const { name, price, durationMinutes } = req.body;

  if (!name || typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'Valid service name and price are required' });
  }

  if (!db.services[salonId]) {
    db.services[salonId] = [];
  }

  const newService: SalonService = {
    serviceId: `srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    salonId,
    name: name.trim(),
    price: Number(price),
    durationMinutes: Number(durationMinutes) || 15,
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.services[salonId].push(newService);
  saveDatabase();
  res.json({ success: true, service: newService });
});

// 6. Update Service (Owner)
app.put('/api/salons/:salonId/services/:serviceId', authenticateOwner, (req: Request, res: Response) => {
  const { salonId, serviceId } = req.params;
  const services = db.services[salonId] || [];
  const service = services.find((s) => s.serviceId === serviceId);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const { name, price, durationMinutes, enabled } = req.body;
  if (name !== undefined) service.name = String(name).trim();
  if (price !== undefined && typeof price === 'number') service.price = Number(price);
  if (durationMinutes !== undefined) service.durationMinutes = Number(durationMinutes);
  if (enabled !== undefined) service.enabled = Boolean(enabled);

  service.updatedAt = new Date().toISOString();
  saveDatabase();
  res.json({ success: true, service });
});

// 7. Delete Service (Owner)
app.delete('/api/salons/:salonId/services/:serviceId', authenticateOwner, (req: Request, res: Response) => {
  const { salonId, serviceId } = req.params;
  if (!db.services[salonId]) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const initialCount = db.services[salonId].length;
  db.services[salonId] = db.services[salonId].filter((s) => s.serviceId !== serviceId);

  if (db.services[salonId].length === initialCount) {
    return res.status(404).json({ error: 'Service not found' });
  }

  saveDatabase();
  res.json({ success: true, message: 'Service removed successfully' });
});

// 8. Live Queue SSE Stream
app.get('/api/salons/:salonId/live-stream', (req: Request, res: Response) => {
  const { salonId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients.has(salonId)) {
    sseClients.set(salonId, []);
  }
  sseClients.get(salonId)!.push(res);

  // Send initial state immediately
  const summary = getQueueSummary(salonId);
  res.write(`data: ${JSON.stringify(summary)}\n\n`);

  req.on('close', () => {
    const clients = sseClients.get(salonId) || [];
    sseClients.set(
      salonId,
      clients.filter((client) => client !== res)
    );
  });
});

// 9. Get Queue Summary (REST)
app.get('/api/salons/:salonId/queue', (req: Request, res: Response) => {
  const { salonId } = req.params;
  const summary = getQueueSummary(salonId);
  res.json(summary);
});

// 10. Customer Remote Booking / Token Generation
app.post('/api/salons/:salonId/bookings', (req: Request, res: Response) => {
  const { salonId } = req.params;
  const salon = db.salons[salonId];

  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }

  const summary = getQueueSummary(salonId);
  if (!summary.isSalonOpen) {
    return res.status(400).json({ error: 'Salon is currently closed' });
  }
  if (!summary.onlineBookingOpen) {
    return res.status(400).json({ error: 'Online booking is currently closed. Please visit or call the salon.' });
  }

  const { customerName, phone, serviceId, notes, preferredTime } = req.body;

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  // Validate phone number: minimum 10 digits
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
  }

  // Validate service
  const services = db.services[salonId] || [];
  const service = services.find((s) => s.serviceId === serviceId);

  if (!service || !service.enabled) {
    return res.status(400).json({ error: 'Selected service is not currently available' });
  }

  const today = getTodayDateString();
  const todayBookings = (db.bookings[salonId] || []).filter((b) => b.date === today);

  // Check capacity
  if (todayBookings.length >= (salon.maxDailyBookings || 60)) {
    return res.status(400).json({ error: 'Daily booking limit reached. Please visit as walk-in.' });
  }

  // Prevent multiple active waiting tokens for the exact same phone on the same day
  const existingActive = todayBookings.find(
    (b) => b.phone === cleanPhone && (b.status === 'waiting' || b.status === 'called' || b.status === 'serving')
  );
  if (existingActive) {
    return res.status(400).json({
      error: `You already have an active Token #${existingActive.tokenNumber} in the queue!`,
      existingBooking: existingActive,
    });
  }

  // Atomic token number generation
  const tokenNumber = allocateNextToken(salonId, today);

  const newBooking: Booking = {
    bookingId: `bkg-${Date.now()}-${tokenNumber}`,
    salonId,
    customerId: `cust-${cleanPhone}`,
    customerName: customerName.trim(),
    phone: cleanPhone,
    serviceId: service.serviceId,
    serviceName: service.name,
    priceAtBooking: service.price, // Stored at booking time
    tokenNumber,
    date: today,
    bookingTime: preferredTime ? String(preferredTime) : formatTimeString(),
    status: 'waiting',
    bookingType: 'online',
    notes: notes ? String(notes).trim() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!db.bookings[salonId]) {
    db.bookings[salonId] = [];
  }
  db.bookings[salonId].push(newBooking);
  saveDatabase();
  broadcastQueueUpdate(salonId);

  // Calculate customers ahead
  const waitingAhead = todayBookings.filter(
    (b) => (b.status === 'waiting' || b.status === 'called') && b.tokenNumber < tokenNumber
  ).length;

  res.status(201).json({
    success: true,
    booking: newBooking,
    customersAhead: waitingAhead,
    estimatedWaitMinutes: waitingAhead * (salon.averageServiceDuration || 15),
  });
});

// 11. Customer Booking Lookup (by phone or bookingId)
app.get('/api/salons/:salonId/bookings/my', (req: Request, res: Response) => {
  const { salonId } = req.params;
  const phone = String(req.query.phone || '').replace(/\D/g, '');

  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number required' });
  }

  const allBookings = db.bookings[salonId] || [];
  const userBookings = allBookings
    .filter((b) => b.phone === phone)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const today = getTodayDateString();
  const todayBooking = userBookings.find((b) => b.date === today);
  const previousBookings = userBookings.filter((b) => b.date !== today);

  // Compute live position for today's active booking
  let customersAhead = 0;
  let estimatedWait = 0;
  if (todayBooking && (todayBooking.status === 'waiting' || todayBooking.status === 'called')) {
    const waitingList = allBookings.filter(
      (b) => b.date === today && (b.status === 'waiting' || b.status === 'called') && b.tokenNumber < todayBooking.tokenNumber
    );
    customersAhead = waitingList.length;
    const salon = db.salons[salonId];
    estimatedWait = customersAhead * (salon?.averageServiceDuration || 15);
  }

  res.json({
    todayBooking,
    previousBookings,
    customersAhead,
    estimatedWait,
  });
});

// 12. Single Booking Info
app.get('/api/salons/:salonId/bookings/:bookingId', (req: Request, res: Response) => {
  const { salonId, bookingId } = req.params;
  const bookings = db.bookings[salonId] || [];
  const booking = bookings.find((b) => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const today = getTodayDateString();
  let customersAhead = 0;
  if (booking.date === today && (booking.status === 'waiting' || booking.status === 'called')) {
    customersAhead = bookings.filter(
      (b) => b.date === today && (b.status === 'waiting' || b.status === 'called') && b.tokenNumber < booking.tokenNumber
    ).length;
  }

  res.json({ booking, customersAhead });
});

// ======================== OWNER DASHBOARD ROUTES ========================

// 13. Owner Login
app.post('/api/owner/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Check username match
  const owner = db.owners.find((o) => o.username.toLowerCase() === String(username).toLowerCase());
  if (!owner) {
    return res.status(401).json({ error: 'Invalid owner credentials' });
  }

  // Validate password (default: 'sahjahan123')
  const isValid = bcrypt.compareSync(String(password), DEFAULT_PASSWORD_HASH);
  if (!isValid && String(password) !== 'sahjahan123') {
    return res.status(401).json({ error: 'Invalid owner credentials' });
  }

  // Create session token
  const token = `owner-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  db.ownerTokens[token] = {
    username: owner.username,
    salonId: owner.salonId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  saveDatabase();

  res.json({
    success: true,
    token,
    owner: {
      id: owner.id,
      username: owner.username,
      name: owner.name,
      salonId: owner.salonId,
    },
  });
});

// 14. Owner Get Today's Bookings & Queue (with filters)
app.get('/api/salons/:salonId/owner/bookings', authenticateOwner, (req: Request, res: Response) => {
  const { salonId } = req.params;
  const statusFilter = req.query.status as string | undefined;
  const typeFilter = req.query.type as string | undefined;
  const date = (req.query.date as string) || getTodayDateString();

  const allBookings = (db.bookings[salonId] || []).filter((b) => b.date === date);

  let filtered = allBookings;
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter((b) => b.status === statusFilter);
  }
  if (typeFilter && typeFilter !== 'all') {
    filtered = filtered.filter((b) => b.bookingType === typeFilter);
  }

  // Sort by token number ascending
  filtered.sort((a, b) => a.tokenNumber - b.tokenNumber);

  res.json({ bookings: filtered, total: allBookings.length });
});

// 15. Owner Add Walk-in Customer
app.post('/api/salons/:salonId/owner/walk-in', authenticateOwner, (req: Request, res: Response) => {
  const { salonId } = req.params;
  const { customerName, phone, serviceId, notes } = req.body;

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  const cleanPhone = String(phone || '').replace(/\D/g, '') || '0000000000';
  const services = db.services[salonId] || [];
  const service = services.find((s) => s.serviceId === serviceId) || services[0];

  if (!service) {
    return res.status(400).json({ error: 'No active service available' });
  }

  const today = getTodayDateString();
  const tokenNumber = allocateNextToken(salonId, today);

  const newBooking: Booking = {
    bookingId: `bkg-${Date.now()}-${tokenNumber}`,
    salonId,
    customerId: `cust-walkin-${cleanPhone}-${tokenNumber}`,
    customerName: customerName.trim(),
    phone: cleanPhone,
    serviceId: service.serviceId,
    serviceName: service.name,
    priceAtBooking: service.price,
    tokenNumber,
    date: today,
    bookingTime: formatTimeString(),
    status: 'waiting',
    bookingType: 'walk-in',
    notes: notes ? String(notes).trim() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!db.bookings[salonId]) {
    db.bookings[salonId] = [];
  }
  db.bookings[salonId].push(newBooking);
  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.status(201).json({ success: true, booking: newBooking });
});

// 16. Owner Call Next Waiting Customer
app.post('/api/salons/:salonId/owner/call-next', authenticateOwner, (req: Request, res: Response) => {
  const { salonId } = req.params;
  const today = getTodayDateString();
  const bookings = db.bookings[salonId] || [];

  // Find next waiting customer with lowest token number
  const nextWaiting = bookings
    .filter((b) => b.date === today && b.status === 'waiting')
    .sort((a, b) => a.tokenNumber - b.tokenNumber)[0];

  if (!nextWaiting) {
    return res.status(404).json({ error: 'No waiting customers in the queue' });
  }

  // Reset any other called booking to waiting if owner jumps
  bookings.forEach((b) => {
    if (b.date === today && b.status === 'called' && b.bookingId !== nextWaiting.bookingId) {
      b.status = 'waiting';
    }
  });

  nextWaiting.status = 'called';
  nextWaiting.calledAt = new Date().toISOString();
  nextWaiting.updatedAt = new Date().toISOString();

  // Update queue state
  if (db.queueStates[salonId] && db.queueStates[salonId][today]) {
    db.queueStates[salonId][today].currentCalledToken = nextWaiting.tokenNumber;
  }

  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, booking: nextWaiting });
});

// 17. Owner Start Service
app.post('/api/salons/:salonId/owner/start-service/:bookingId', authenticateOwner, (req: Request, res: Response) => {
  const { salonId, bookingId } = req.params;
  const today = getTodayDateString();
  const bookings = db.bookings[salonId] || [];
  const booking = bookings.find((b) => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  // Any currently serving booking is moved or kept? Only one serving booking active at a time
  bookings.forEach((b) => {
    if (b.date === today && b.status === 'serving' && b.bookingId !== booking.bookingId) {
      b.status = 'completed'; // auto-complete previous if uncompleted
      b.completedAt = new Date().toISOString();
    }
  });

  booking.status = 'serving';
  booking.servingAt = new Date().toISOString();
  booking.updatedAt = new Date().toISOString();

  if (db.queueStates[salonId] && db.queueStates[salonId][today]) {
    db.queueStates[salonId][today].currentServingToken = booking.tokenNumber;
    if (db.queueStates[salonId][today].currentCalledToken === booking.tokenNumber) {
      db.queueStates[salonId][today].currentCalledToken = null;
    }
  }

  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, booking });
});

// 18. Owner Complete Service
app.post('/api/salons/:salonId/owner/complete/:bookingId', authenticateOwner, (req: Request, res: Response) => {
  const { salonId, bookingId } = req.params;
  const today = getTodayDateString();
  const bookings = db.bookings[salonId] || [];
  const booking = bookings.find((b) => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'completed';
  booking.completedAt = new Date().toISOString();
  booking.updatedAt = new Date().toISOString();

  if (db.queueStates[salonId] && db.queueStates[salonId][today]) {
    if (db.queueStates[salonId][today].currentServingToken === booking.tokenNumber) {
      db.queueStates[salonId][today].currentServingToken = null;
    }
    if (db.queueStates[salonId][today].currentCalledToken === booking.tokenNumber) {
      db.queueStates[salonId][today].currentCalledToken = null;
    }
  }

  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, booking });
});

// 19. Owner Skip Customer
app.post('/api/salons/:salonId/owner/skip/:bookingId', authenticateOwner, (req: Request, res: Response) => {
  const { salonId, bookingId } = req.params;
  const today = getTodayDateString();
  const bookings = db.bookings[salonId] || [];
  const booking = bookings.find((b) => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'skipped';
  booking.updatedAt = new Date().toISOString();

  if (db.queueStates[salonId] && db.queueStates[salonId][today]) {
    if (db.queueStates[salonId][today].currentCalledToken === booking.tokenNumber) {
      db.queueStates[salonId][today].currentCalledToken = null;
    }
    if (db.queueStates[salonId][today].currentServingToken === booking.tokenNumber) {
      db.queueStates[salonId][today].currentServingToken = null;
    }
  }

  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, booking });
});

// 20. Owner Recall Skipped Customer
app.post('/api/salons/:salonId/owner/recall/:bookingId', authenticateOwner, (req: Request, res: Response) => {
  const { salonId, bookingId } = req.params;
  const bookings = db.bookings[salonId] || [];
  const booking = bookings.find((b) => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'waiting';
  booking.updatedAt = new Date().toISOString();

  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, booking });
});

// 21. Owner Cancel Booking
app.post('/api/salons/:salonId/owner/cancel/:bookingId', authenticateOwner, (req: Request, res: Response) => {
  const { salonId, bookingId } = req.params;
  const today = getTodayDateString();
  const bookings = db.bookings[salonId] || [];
  const booking = bookings.find((b) => b.bookingId === bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'cancelled';
  booking.updatedAt = new Date().toISOString();

  if (db.queueStates[salonId] && db.queueStates[salonId][today]) {
    if (db.queueStates[salonId][today].currentCalledToken === booking.tokenNumber) {
      db.queueStates[salonId][today].currentCalledToken = null;
    }
    if (db.queueStates[salonId][today].currentServingToken === booking.tokenNumber) {
      db.queueStates[salonId][today].currentServingToken = null;
    }
  }

  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, booking });
});

// 22. Start New Day (Daily Token System)
app.post('/api/salons/:salonId/owner/start-new-day', authenticateOwner, (req: Request, res: Response) => {
  const { salonId } = req.params;
  const today = getTodayDateString();

  if (!db.queueStates[salonId]) {
    db.queueStates[salonId] = {};
  }

  // Create clean queue for today starting at #0 so next is #1
  db.queueStates[salonId][today] = {
    salonId,
    date: today,
    lastTokenNumber: 0,
    currentServingToken: null,
    currentCalledToken: null,
    updatedAt: new Date().toISOString(),
  };

  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, message: 'New day started successfully. Tokens reset to #1.' });
});

// 23. Owner Toggle Online Booking
app.post('/api/salons/:salonId/owner/toggle-online-booking', authenticateOwner, (req: Request, res: Response) => {
  const { salonId } = req.params;
  const salon = db.salons[salonId];

  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }

  salon.onlineBookingEnabled = !salon.onlineBookingEnabled;
  salon.updatedAt = new Date().toISOString();
  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, onlineBookingEnabled: salon.onlineBookingEnabled });
});

// 24. Owner Toggle Salon Open/Closed
app.post('/api/salons/:salonId/owner/toggle-salon-status', authenticateOwner, (req: Request, res: Response) => {
  const { salonId } = req.params;
  const salon = db.salons[salonId];

  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }

  salon.isManuallyClosed = !salon.isManuallyClosed;
  salon.updatedAt = new Date().toISOString();
  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, isManuallyClosed: salon.isManuallyClosed });
});

// 25. Owner Analytics
app.get('/api/salons/:salonId/owner/analytics', authenticateOwner, (req: Request, res: Response) => {
  const { salonId } = req.params;
  const date = (req.query.date as string) || getTodayDateString();
  const bookings = (db.bookings[salonId] || []).filter((b) => b.date === date);

  let totalCustomers = bookings.length;
  let onlineBookings = 0;
  let walkInCustomers = 0;
  let completedServices = 0;
  let cancelledBookings = 0;
  let skippedBookings = 0;
  let estimatedRevenue = 0;
  const serviceBreakdown: Record<string, number> = {};

  bookings.forEach((b) => {
    if (b.bookingType === 'online') onlineBookings++;
    if (b.bookingType === 'walk-in') walkInCustomers++;

    if (b.status === 'completed') {
      completedServices++;
      // Revenue strictly calculated from actual priceAtBooking for completed bookings
      estimatedRevenue += b.priceAtBooking || 0;

      // Count in service breakdown
      serviceBreakdown[b.serviceName] = (serviceBreakdown[b.serviceName] || 0) + 1;
    } else if (b.status === 'cancelled') {
      cancelledBookings++;
    } else if (b.status === 'skipped') {
      skippedBookings++;
    }
  });

  const analytics: AnalyticsSummary = {
    date,
    totalCustomers,
    onlineBookings,
    walkInCustomers,
    completedServices,
    cancelledBookings,
    skippedBookings,
    estimatedRevenue,
    serviceBreakdown,
  };

  res.json(analytics);
});

// 26. Reset / Clear Demo Queue
app.post('/api/salons/:salonId/owner/clear-demo-data', authenticateOwner, (req: Request, res: Response) => {
  const { salonId } = req.params;
  const today = getTodayDateString();

  // Remove today's bookings
  if (db.bookings[salonId]) {
    db.bookings[salonId] = db.bookings[salonId].filter((b) => b.date !== today);
  }

  // Reset queue state
  if (db.queueStates[salonId]) {
    db.queueStates[salonId][today] = {
      salonId,
      date: today,
      lastTokenNumber: 0,
      currentServingToken: null,
      currentCalledToken: null,
      updatedAt: new Date().toISOString(),
    };
  }

  saveDatabase();
  broadcastQueueUpdate(salonId);

  res.json({ success: true, message: "Today's queue cleared successfully." });
});

// ======================== VITE & STATIC FILES ========================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`💈 SAHJAН SALOON server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
