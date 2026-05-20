import type {
  Room, Guest, Reservation, Invoice, ServiceRequest, HousekeepingTask,
  MaintenanceRequest, FBOrder, SpaBooking, StaffMember, ShiftSchedule,
  KPIData, FinancialRecord, RefundRequest, AuditLog, RoomTypeConfig,
  LoyaltyTransaction, Message, ComplianceExport, ScheduledReport, User,
} from '../types';

// ─── Users ────────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: 'u1', name: 'Alice Admin', email: 'admin@hospease.com', role: 'ADMIN', department: 'Administration', createdAt: '2023-01-01' },
  { id: 'u2', name: 'Mark Manager', email: 'manager@hospease.com', role: 'MANAGER', department: 'Operations', createdAt: '2023-02-01' },
  { id: 'u3', name: 'Fiona Desk', email: 'frontdesk@hospease.com', role: 'FRONT_DESK', department: 'Front Office', createdAt: '2023-03-01' },
  { id: 'u4', name: 'Hannah Keep', email: 'housekeeping@hospease.com', role: 'HOUSEKEEPING', department: 'Housekeeping', createdAt: '2023-04-01' },
  { id: 'u5', name: 'Sam Service', email: 'service@hospease.com', role: 'SERVICE_STAFF', department: 'F&B', createdAt: '2023-05-01' },
  { id: 'u6', name: 'Frank Finance', email: 'finance@hospease.com', role: 'FINANCE', department: 'Finance', createdAt: '2023-06-01' },
  { id: 'u7', name: 'Rita Report', email: 'reporting@hospease.com', role: 'REPORTING', department: 'Analytics', createdAt: '2023-07-01' },
  { id: 'u8', name: 'James Wilson', email: 'guest@hospease.com', role: 'GUEST', createdAt: '2024-01-15' },
];

export const mockCredentials: Record<string, string> = {
  'admin@hospease.com': 'admin123',
  'manager@hospease.com': 'manager123',
  'frontdesk@hospease.com': 'frontdesk123',
  'housekeeping@hospease.com': 'housekeeping123',
  'service@hospease.com': 'service123',
  'finance@hospease.com': 'finance123',
  'reporting@hospease.com': 'reporting123',
  'guest@hospease.com': 'guest123',
};

// ─── Rooms ────────────────────────────────────────────────────────────────────
const roomAmenities = {
  STANDARD: ['WiFi', 'TV', 'Air Conditioning', 'Mini Fridge', 'Coffee Maker'],
  DELUXE: ['WiFi', 'Smart TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker', 'Bathrobe', 'City View'],
  SUITE: ['WiFi', 'Smart TV', 'Air Conditioning', 'Full Bar', 'Kitchenette', 'Jacuzzi', 'Living Room', 'Sea View'],
  PRESIDENTIAL: ['WiFi', 'Smart TV', 'Air Conditioning', 'Full Bar', 'Full Kitchen', 'Private Pool', 'Butler Service', 'Panoramic View', 'Private Terrace'],
};

export const mockRooms: Room[] = [
  // Floor 1 – Standard
  { id: 'r101', number: '101', floor: 1, type: 'STANDARD', status: 'OCCUPIED', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Comfortable standard room on ground floor.', lastCleaned: '2026-05-19T08:00:00Z' },
  { id: 'r102', number: '102', floor: 1, type: 'STANDARD', status: 'DIRTY', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Comfortable standard room on ground floor.', lastCleaned: '2026-05-18T10:30:00Z' },
  { id: 'r103', number: '103', floor: 1, type: 'STANDARD', status: 'CLEAN', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Comfortable standard room on ground floor.' },
  { id: 'r104', number: '104', floor: 1, type: 'STANDARD', status: 'OCCUPIED', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Comfortable standard room.' },
  { id: 'r105', number: '105', floor: 1, type: 'STANDARD', status: 'CLEAN', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Comfortable standard room.' },
  { id: 'r106', number: '106', floor: 1, type: 'STANDARD', status: 'OUT_OF_ORDER', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Under maintenance.' },
  { id: 'r107', number: '107', floor: 1, type: 'STANDARD', status: 'CLEAN', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Comfortable standard room.' },
  { id: 'r108', number: '108', floor: 1, type: 'STANDARD', status: 'INSPECTING', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Under inspection.' },
  { id: 'r109', number: '109', floor: 1, type: 'STANDARD', status: 'CLEAN', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Comfortable standard room.' },
  { id: 'r110', number: '110', floor: 1, type: 'STANDARD', status: 'DIRTY', capacity: 2, pricePerNight: 150, amenities: roomAmenities.STANDARD, description: 'Comfortable standard room.' },
  // Floor 2 – Standard
  { id: 'r201', number: '201', floor: 2, type: 'STANDARD', status: 'OCCUPIED', capacity: 2, pricePerNight: 165, amenities: roomAmenities.STANDARD, description: 'Standard room with partial city view.' },
  { id: 'r202', number: '202', floor: 2, type: 'STANDARD', status: 'CLEAN', capacity: 2, pricePerNight: 165, amenities: roomAmenities.STANDARD, description: 'Standard room.' },
  { id: 'r203', number: '203', floor: 2, type: 'STANDARD', status: 'DIRTY', capacity: 2, pricePerNight: 165, amenities: roomAmenities.STANDARD, description: 'Standard room.' },
  { id: 'r204', number: '204', floor: 2, type: 'STANDARD', status: 'CLEAN', capacity: 2, pricePerNight: 165, amenities: roomAmenities.STANDARD, description: 'Standard room.' },
  { id: 'r205', number: '205', floor: 2, type: 'STANDARD', status: 'OCCUPIED', capacity: 2, pricePerNight: 165, amenities: roomAmenities.STANDARD, description: 'Standard room.' },
  // Floor 3 – Deluxe
  { id: 'r301', number: '301', floor: 3, type: 'DELUXE', status: 'OCCUPIED', capacity: 2, pricePerNight: 250, amenities: roomAmenities.DELUXE, description: 'Elegant deluxe room with city view.' },
  { id: 'r302', number: '302', floor: 3, type: 'DELUXE', status: 'CLEAN', capacity: 2, pricePerNight: 250, amenities: roomAmenities.DELUXE, description: 'Elegant deluxe room.' },
  { id: 'r303', number: '303', floor: 3, type: 'DELUXE', status: 'DIRTY', capacity: 2, pricePerNight: 250, amenities: roomAmenities.DELUXE, description: 'Elegant deluxe room.' },
  { id: 'r304', number: '304', floor: 3, type: 'DELUXE', status: 'OCCUPIED', capacity: 3, pricePerNight: 275, amenities: roomAmenities.DELUXE, description: 'Spacious deluxe triple.' },
  { id: 'r305', number: '305', floor: 3, type: 'DELUXE', status: 'CLEAN', capacity: 2, pricePerNight: 250, amenities: roomAmenities.DELUXE, description: 'Elegant deluxe room.' },
  // Floor 4 – Deluxe
  { id: 'r401', number: '401', floor: 4, type: 'DELUXE', status: 'CLEAN', capacity: 2, pricePerNight: 280, amenities: roomAmenities.DELUXE, description: 'Premium deluxe with panoramic view.' },
  { id: 'r402', number: '402', floor: 4, type: 'DELUXE', status: 'OCCUPIED', capacity: 2, pricePerNight: 280, amenities: roomAmenities.DELUXE, description: 'Premium deluxe room.' },
  { id: 'r403', number: '403', floor: 4, type: 'DELUXE', status: 'INSPECTING', capacity: 2, pricePerNight: 280, amenities: roomAmenities.DELUXE, description: 'Premium deluxe room.' },
  { id: 'r404', number: '404', floor: 4, type: 'DELUXE', status: 'DIRTY', capacity: 2, pricePerNight: 280, amenities: roomAmenities.DELUXE, description: 'Premium deluxe room.' },
  { id: 'r405', number: '405', floor: 4, type: 'DELUXE', status: 'CLEAN', capacity: 2, pricePerNight: 280, amenities: roomAmenities.DELUXE, description: 'Premium deluxe room.' },
  // Floor 5 – Suites
  { id: 'r501', number: '501', floor: 5, type: 'SUITE', status: 'OCCUPIED', capacity: 4, pricePerNight: 500, amenities: roomAmenities.SUITE, description: 'Luxurious suite with sea view and jacuzzi.' },
  { id: 'r502', number: '502', floor: 5, type: 'SUITE', status: 'CLEAN', capacity: 4, pricePerNight: 500, amenities: roomAmenities.SUITE, description: 'Luxurious suite.' },
  { id: 'r503', number: '503', floor: 5, type: 'SUITE', status: 'DIRTY', capacity: 4, pricePerNight: 550, amenities: roomAmenities.SUITE, description: 'Corner suite with wrap-around view.' },
  { id: 'r504', number: '504', floor: 5, type: 'SUITE', status: 'CLEAN', capacity: 4, pricePerNight: 500, amenities: roomAmenities.SUITE, description: 'Luxurious suite.' },
  // Floor 6 – Presidential
  { id: 'r601', number: '601', floor: 6, type: 'PRESIDENTIAL', status: 'CLEAN', capacity: 6, pricePerNight: 1500, amenities: roomAmenities.PRESIDENTIAL, description: 'The pinnacle of luxury. Full-floor presidential suite.' },
  { id: 'r602', number: '602', floor: 6, type: 'PRESIDENTIAL', status: 'OCCUPIED', capacity: 4, pricePerNight: 1200, amenities: roomAmenities.PRESIDENTIAL, description: 'Executive presidential suite.' },
];

// ─── Guests ───────────────────────────────────────────────────────────────────
export const mockGuests: Guest[] = [
  { id: 'g1', name: 'James Wilson', email: 'guest@hospease.com', phone: '+1-555-0101', nationality: 'American', idType: 'PASSPORT', idNumber: 'US123456', loyaltyTier: 'GOLD', loyaltyPoints: 12450, totalStays: 14, createdAt: '2022-03-15' },
  { id: 'g2', name: 'Elena Petrova', email: 'elena.p@email.com', phone: '+7-555-0202', nationality: 'Russian', idType: 'PASSPORT', idNumber: 'RU789012', loyaltyTier: 'PLATINUM', loyaltyPoints: 48200, totalStays: 42, createdAt: '2020-06-10' },
  { id: 'g3', name: 'Thomas Beck', email: 'thomas.b@email.com', phone: '+49-555-0303', nationality: 'German', idType: 'PASSPORT', idNumber: 'DE345678', loyaltyTier: 'SILVER', loyaltyPoints: 5600, totalStays: 7, createdAt: '2023-01-20' },
  { id: 'g4', name: 'Priya Sharma', email: 'priya.s@email.com', phone: '+91-555-0404', nationality: 'Indian', idType: 'PASSPORT', idNumber: 'IN901234', loyaltyTier: 'GOLD', loyaltyPoints: 18900, totalStays: 21, createdAt: '2021-09-05' },
  { id: 'g5', name: 'Carlos Mendez', email: 'carlos.m@email.com', phone: '+52-555-0505', nationality: 'Mexican', idType: 'PASSPORT', idNumber: 'MX567890', loyaltyTier: 'BRONZE', loyaltyPoints: 1200, totalStays: 3, createdAt: '2024-02-14' },
  { id: 'g6', name: 'Yuki Tanaka', email: 'yuki.t@email.com', phone: '+81-555-0606', nationality: 'Japanese', idType: 'PASSPORT', idNumber: 'JP234567', loyaltyTier: 'PLATINUM', loyaltyPoints: 65000, totalStays: 58, createdAt: '2019-11-30' },
  { id: 'g7', name: 'Sarah Mitchell', email: 'sarah.m@email.com', phone: '+44-555-0707', nationality: 'British', idType: 'PASSPORT', idNumber: 'GB890123', loyaltyTier: 'GOLD', loyaltyPoints: 22100, totalStays: 19, createdAt: '2021-05-22' },
  { id: 'g8', name: 'Ahmed Hassan', email: 'ahmed.h@email.com', phone: '+971-555-0808', nationality: 'Emirati', idType: 'NATIONAL_ID', idNumber: 'AE456789', loyaltyTier: 'SILVER', loyaltyPoints: 7800, totalStays: 9, createdAt: '2022-12-08' },
];

// ─── Reservations ─────────────────────────────────────────────────────────────
export const mockReservations: Reservation[] = [
  { id: 'res1', confirmationNumber: 'HE-2026-001', guestId: 'g1', guestName: 'James Wilson', roomId: 'r501', roomNumber: '501', roomType: 'SUITE', checkIn: '2026-05-18', checkOut: '2026-05-22', nights: 4, adults: 2, children: 0, status: 'CHECKED_IN', totalAmount: 2000, paidAmount: 2000, paymentStatus: 'PAID', specialRequests: 'High floor, sea view preferred', createdAt: '2026-04-10' },
  { id: 'res2', confirmationNumber: 'HE-2026-002', guestId: 'g2', guestName: 'Elena Petrova', roomId: 'r602', roomNumber: '602', roomType: 'PRESIDENTIAL', checkIn: '2026-05-15', checkOut: '2026-05-25', nights: 10, adults: 2, children: 2, status: 'CHECKED_IN', totalAmount: 12000, paidAmount: 12000, paymentStatus: 'PAID', specialRequests: 'Airport transfer, champagne on arrival', createdAt: '2026-03-20' },
  { id: 'res3', confirmationNumber: 'HE-2026-003', guestId: 'g3', guestName: 'Thomas Beck', roomId: 'r301', roomNumber: '301', roomType: 'DELUXE', checkIn: '2026-05-19', checkOut: '2026-05-21', nights: 2, adults: 1, children: 0, status: 'CHECKED_IN', totalAmount: 500, paidAmount: 500, paymentStatus: 'PAID', createdAt: '2026-05-01' },
  { id: 'res4', confirmationNumber: 'HE-2026-004', guestId: 'g4', guestName: 'Priya Sharma', roomId: 'r402', roomNumber: '402', roomType: 'DELUXE', checkIn: '2026-05-20', checkOut: '2026-05-24', nights: 4, adults: 2, children: 1, status: 'CONFIRMED', totalAmount: 1120, paidAmount: 560, paymentStatus: 'PARTIAL', specialRequests: 'Crib needed', createdAt: '2026-05-05' },
  { id: 'res5', confirmationNumber: 'HE-2026-005', guestId: 'g5', guestName: 'Carlos Mendez', roomId: 'r104', roomNumber: '104', roomType: 'STANDARD', checkIn: '2026-05-21', checkOut: '2026-05-23', nights: 2, adults: 2, children: 0, status: 'CONFIRMED', totalAmount: 300, paidAmount: 0, paymentStatus: 'PENDING', createdAt: '2026-05-12' },
  { id: 'res6', confirmationNumber: 'HE-2026-006', guestId: 'g6', guestName: 'Yuki Tanaka', roomId: 'r502', roomNumber: '502', roomType: 'SUITE', checkIn: '2026-05-22', checkOut: '2026-05-29', nights: 7, adults: 2, children: 0, status: 'CONFIRMED', totalAmount: 3500, paidAmount: 3500, paymentStatus: 'PAID', specialRequests: 'Vegetarian meals', createdAt: '2026-04-25' },
  { id: 'res7', confirmationNumber: 'HE-2026-007', guestId: 'g7', guestName: 'Sarah Mitchell', roomId: 'r201', roomNumber: '201', roomType: 'STANDARD', checkIn: '2026-05-17', checkOut: '2026-05-19', nights: 2, adults: 1, children: 0, status: 'CHECKED_OUT', totalAmount: 330, paidAmount: 330, paymentStatus: 'PAID', createdAt: '2026-04-30' },
  { id: 'res8', confirmationNumber: 'HE-2026-008', guestId: 'g8', guestName: 'Ahmed Hassan', roomId: 'r304', roomNumber: '304', roomType: 'DELUXE', checkIn: '2026-05-19', checkOut: '2026-05-26', nights: 7, adults: 2, children: 2, status: 'CHECKED_IN', totalAmount: 1925, paidAmount: 1925, paymentStatus: 'PAID', specialRequests: 'Halal meals required', createdAt: '2026-04-15' },
  { id: 'res9', confirmationNumber: 'HE-2026-009', guestId: 'g3', guestName: 'Thomas Beck', roomId: 'r103', roomNumber: '103', roomType: 'STANDARD', checkIn: '2026-06-01', checkOut: '2026-06-05', nights: 4, adults: 1, children: 0, status: 'CONFIRMED', totalAmount: 600, paidAmount: 300, paymentStatus: 'PARTIAL', createdAt: '2026-05-10' },
  { id: 'res10', confirmationNumber: 'HE-2026-010', guestId: 'g5', guestName: 'Carlos Mendez', roomId: 'r205', roomNumber: '205', roomType: 'STANDARD', checkIn: '2026-05-10', checkOut: '2026-05-14', nights: 4, adults: 2, children: 0, status: 'CHECKED_OUT', totalAmount: 660, paidAmount: 660, paymentStatus: 'PAID', createdAt: '2026-04-20' },
];

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const mockInvoices: Invoice[] = [
  {
    id: 'inv1', invoiceNumber: 'INV-2026-0001', guestId: 'g1', guestName: 'James Wilson', reservationId: 'res1',
    items: [
      { id: 'ii1', description: 'Suite Room - 4 nights', category: 'ROOM', quantity: 4, unitPrice: 500, amount: 2000, date: '2026-05-18' },
      { id: 'ii2', description: 'Room Service - Dinner', category: 'DINING', quantity: 1, unitPrice: 85, amount: 85, date: '2026-05-19' },
      { id: 'ii3', description: 'Mini Bar', category: 'MINIBAR', quantity: 1, unitPrice: 45, amount: 45, date: '2026-05-19' },
      { id: 'ii4', description: 'Spa - Swedish Massage', category: 'SPA', quantity: 1, unitPrice: 180, amount: 180, date: '2026-05-20' },
    ],
    subtotal: 2310, tax: 231, total: 2541, paidAmount: 2000, balance: 541, status: 'PARTIAL', issuedAt: '2026-05-18', dueAt: '2026-05-22',
  },
  {
    id: 'inv2', invoiceNumber: 'INV-2026-0002', guestId: 'g2', guestName: 'Elena Petrova', reservationId: 'res2',
    items: [
      { id: 'ii5', description: 'Presidential Suite - 10 nights', category: 'ROOM', quantity: 10, unitPrice: 1200, amount: 12000, date: '2026-05-15' },
      { id: 'ii6', description: 'Airport Transfer', category: 'OTHER', quantity: 1, unitPrice: 150, amount: 150, date: '2026-05-15' },
      { id: 'ii7', description: 'Butler Service Premium', category: 'OTHER', quantity: 10, unitPrice: 200, amount: 2000, date: '2026-05-15' },
      { id: 'ii8', description: 'Fine Dining - Restaurant', category: 'DINING', quantity: 5, unitPrice: 320, amount: 1600, date: '2026-05-16' },
    ],
    subtotal: 15750, tax: 1575, total: 17325, paidAmount: 17325, balance: 0, status: 'PAID', issuedAt: '2026-05-15', dueAt: '2026-05-25',
  },
  {
    id: 'inv3', invoiceNumber: 'INV-2026-0003', guestId: 'g7', guestName: 'Sarah Mitchell', reservationId: 'res7',
    items: [
      { id: 'ii9', description: 'Standard Room - 2 nights', category: 'ROOM', quantity: 2, unitPrice: 165, amount: 330, date: '2026-05-17' },
      { id: 'ii10', description: 'Laundry Service', category: 'LAUNDRY', quantity: 1, unitPrice: 25, amount: 25, date: '2026-05-18' },
    ],
    subtotal: 355, tax: 35.5, total: 390.5, paidAmount: 390.5, balance: 0, status: 'PAID', issuedAt: '2026-05-17', dueAt: '2026-05-19',
  },
];

// ─── Service Requests ─────────────────────────────────────────────────────────
export const mockServiceRequests: ServiceRequest[] = [
  { id: 'sr1', guestId: 'g1', guestName: 'James Wilson', roomNumber: '501', type: 'ROOM_SERVICE', description: 'Please deliver breakfast for 2 at 8 AM', status: 'COMPLETED', priority: 'MEDIUM', assignedTo: 'Sam Service', createdAt: '2026-05-19T07:00:00Z', resolvedAt: '2026-05-19T08:15:00Z' },
  { id: 'sr2', guestId: 'g2', guestName: 'Elena Petrova', roomNumber: '602', type: 'CONCIERGE', description: 'Book dinner reservation at La Belle restaurant for 4 people tonight at 8 PM', status: 'IN_PROGRESS', priority: 'HIGH', assignedTo: 'Fiona Desk', createdAt: '2026-05-19T14:00:00Z' },
  { id: 'sr3', guestId: 'g8', guestName: 'Ahmed Hassan', roomNumber: '304', type: 'HOUSEKEEPING', description: 'Extra towels and toiletries needed', status: 'OPEN', priority: 'LOW', createdAt: '2026-05-19T15:30:00Z' },
  { id: 'sr4', guestId: 'g3', guestName: 'Thomas Beck', roomNumber: '301', type: 'MAINTENANCE', description: 'Air conditioning not working properly', status: 'IN_PROGRESS', priority: 'HIGH', assignedTo: 'Maintenance Team', createdAt: '2026-05-19T10:00:00Z' },
  { id: 'sr5', guestId: 'g1', guestName: 'James Wilson', roomNumber: '501', type: 'AMENITIES', description: 'Request additional pillows and blanket', status: 'COMPLETED', priority: 'LOW', assignedTo: 'Hannah Keep', createdAt: '2026-05-18T21:00:00Z', resolvedAt: '2026-05-18T21:45:00Z' },
  { id: 'sr6', guestId: 'g4', guestName: 'Priya Sharma', roomNumber: '402', type: 'ROOM_SERVICE', description: 'Late checkout requested – can we extend to 2 PM?', status: 'OPEN', priority: 'MEDIUM', createdAt: '2026-05-19T09:00:00Z' },
];

// ─── Housekeeping Tasks ───────────────────────────────────────────────────────
export const mockHousekeepingTasks: HousekeepingTask[] = [
  { id: 'hk1', roomId: 'r102', roomNumber: '102', floor: 1, type: 'CHECKOUT_CLEAN', status: 'IN_PROGRESS', assignedTo: 'Maria Lopez', priority: 'HIGH', estimatedMinutes: 45, createdAt: '2026-05-19T09:00:00Z' },
  { id: 'hk2', roomId: 'r203', roomNumber: '203', floor: 2, type: 'STAYOVER_CLEAN', status: 'PENDING', assignedTo: 'Hannah Keep', priority: 'MEDIUM', estimatedMinutes: 30, createdAt: '2026-05-19T09:00:00Z' },
  { id: 'hk3', roomId: 'r303', roomNumber: '303', floor: 3, type: 'CHECKOUT_CLEAN', status: 'COMPLETED', assignedTo: 'Maria Lopez', priority: 'HIGH', estimatedMinutes: 50, createdAt: '2026-05-19T07:00:00Z', completedAt: '2026-05-19T08:10:00Z' },
  { id: 'hk4', roomId: 'r404', roomNumber: '404', floor: 4, type: 'STAYOVER_CLEAN', status: 'PENDING', assignedTo: 'Jake Torres', priority: 'MEDIUM', estimatedMinutes: 35, createdAt: '2026-05-19T09:00:00Z' },
  { id: 'hk5', roomId: 'r503', roomNumber: '503', floor: 5, type: 'CHECKOUT_CLEAN', status: 'PENDING', assignedTo: 'Hannah Keep', priority: 'HIGH', estimatedMinutes: 75, createdAt: '2026-05-19T09:00:00Z' },
  { id: 'hk6', roomId: 'r110', roomNumber: '110', floor: 1, type: 'STAYOVER_CLEAN', status: 'IN_PROGRESS', assignedTo: 'Jake Torres', priority: 'LOW', estimatedMinutes: 30, createdAt: '2026-05-19T11:00:00Z' },
  { id: 'hk7', roomId: 'r301', roomNumber: '301', floor: 3, type: 'TURNDOWN', status: 'PENDING', assignedTo: 'Maria Lopez', priority: 'MEDIUM', estimatedMinutes: 20, notes: 'Leave chocolates on pillow', createdAt: '2026-05-19T09:00:00Z' },
  { id: 'hk8', roomId: 'r403', roomNumber: '403', floor: 4, type: 'INSPECTION', status: 'PENDING', assignedTo: 'Hannah Keep', priority: 'HIGH', estimatedMinutes: 15, createdAt: '2026-05-19T09:00:00Z' },
];

// ─── Maintenance Requests ─────────────────────────────────────────────────────
export const mockMaintenanceRequests: MaintenanceRequest[] = [
  { id: 'mr1', roomNumber: '106', location: 'Room 106', category: 'PLUMBING', description: 'Bathroom sink leaking. Water dripping from faucet joint.', status: 'IN_PROGRESS', priority: 'HIGH', reportedBy: 'Hannah Keep', assignedTo: 'Bob Plumber', createdAt: '2026-05-18T10:00:00Z', estimatedCost: 250 },
  { id: 'mr2', roomNumber: '301', location: 'Room 301', category: 'HVAC', description: 'Air conditioning unit not cooling properly. Temperature stuck at 24°C.', status: 'OPEN', priority: 'HIGH', reportedBy: 'Thomas Beck', assignedTo: 'HVAC Team', createdAt: '2026-05-19T10:00:00Z', estimatedCost: 500 },
  { id: 'mr3', location: 'Lobby', category: 'ELECTRICAL', description: 'Three ceiling lights in lobby are flickering and need bulb replacement.', status: 'OPEN', priority: 'MEDIUM', reportedBy: 'Fiona Desk', createdAt: '2026-05-19T08:00:00Z', estimatedCost: 80 },
  { id: 'mr4', roomNumber: '204', location: 'Room 204', category: 'FURNITURE', description: 'Desk chair broken – one wheel missing.', status: 'RESOLVED', priority: 'LOW', reportedBy: 'Maria Lopez', assignedTo: 'Maintenance Team', createdAt: '2026-05-17T12:00:00Z', resolvedAt: '2026-05-18T09:00:00Z', estimatedCost: 120 },
  { id: 'mr5', location: 'Pool Area', category: 'STRUCTURAL', description: 'Pool deck tiles cracked near main entrance. Safety hazard.', status: 'OPEN', priority: 'URGENT', reportedBy: 'Mark Manager', createdAt: '2026-05-19T07:30:00Z', estimatedCost: 2000 },
];

// ─── F&B Orders ───────────────────────────────────────────────────────────────
export const mockFBOrders: FBOrder[] = [
  {
    id: 'fb1', orderNumber: 'RS-001', guestName: 'James Wilson', roomNumber: '501', type: 'ROOM_SERVICE',
    items: [
      { id: 'oi1', name: 'Club Sandwich', category: 'Sandwiches', quantity: 2, unitPrice: 22, amount: 44 },
      { id: 'oi2', name: 'Caesar Salad', category: 'Salads', quantity: 1, unitPrice: 18, amount: 18 },
      { id: 'oi3', name: 'Fresh Orange Juice', category: 'Beverages', quantity: 2, unitPrice: 8, amount: 16 },
    ],
    subtotal: 78, tax: 7.8, gratuity: 11.7, total: 97.5, status: 'DELIVERED', createdAt: '2026-05-19T12:30:00Z',
  },
  {
    id: 'fb2', orderNumber: 'RS-002', guestName: 'Elena Petrova', roomNumber: '602', type: 'ROOM_SERVICE',
    items: [
      { id: 'oi4', name: 'Wagyu Steak', category: 'Mains', quantity: 2, unitPrice: 85, amount: 170 },
      { id: 'oi5', name: 'Truffle Risotto', category: 'Mains', quantity: 1, unitPrice: 45, amount: 45 },
      { id: 'oi6', name: 'Champagne - Dom Pérignon', category: 'Beverages', quantity: 1, unitPrice: 280, amount: 280 },
    ],
    subtotal: 495, tax: 49.5, gratuity: 74.25, total: 618.75, status: 'PREPARING', createdAt: '2026-05-19T19:00:00Z', estimatedDelivery: '2026-05-19T19:45:00Z',
  },
  {
    id: 'fb3', orderNumber: 'RT-003', tableNumber: 'T-12', type: 'RESTAURANT',
    items: [
      { id: 'oi7', name: 'Grilled Salmon', category: 'Mains', quantity: 1, unitPrice: 38, amount: 38 },
      { id: 'oi8', name: 'Tiramisu', category: 'Desserts', quantity: 1, unitPrice: 14, amount: 14 },
      { id: 'oi9', name: 'Sparkling Water', category: 'Beverages', quantity: 2, unitPrice: 5, amount: 10 },
    ],
    subtotal: 62, tax: 6.2, gratuity: 9.3, total: 77.5, status: 'PENDING', createdAt: '2026-05-19T13:15:00Z',
  },
  {
    id: 'fb4', orderNumber: 'RS-004', guestName: 'Ahmed Hassan', roomNumber: '304', type: 'ROOM_SERVICE',
    items: [
      { id: 'oi10', name: 'Halal Breakfast Set', category: 'Breakfast', quantity: 4, unitPrice: 28, amount: 112 },
      { id: 'oi11', name: 'Fresh Fruit Platter', category: 'Appetizers', quantity: 1, unitPrice: 22, amount: 22 },
    ],
    subtotal: 134, tax: 13.4, gratuity: 20.1, total: 167.5, status: 'DELIVERED', createdAt: '2026-05-19T08:00:00Z',
  },
];

// ─── Spa Bookings ─────────────────────────────────────────────────────────────
export const mockSpaBookings: SpaBooking[] = [
  { id: 'spa1', guestId: 'g1', guestName: 'James Wilson', service: 'Swedish Massage', therapist: 'Ana Silva', room: 'Spa Room 1', date: '2026-05-20', startTime: '10:00', endTime: '11:00', duration: 60, price: 180, status: 'CONFIRMED', notes: 'No strong pressure' },
  { id: 'spa2', guestId: 'g2', guestName: 'Elena Petrova', service: 'Hot Stone Therapy', therapist: 'Maria Santos', room: 'Spa Room 2', date: '2026-05-19', startTime: '14:00', endTime: '15:30', duration: 90, price: 250, status: 'COMPLETED' },
  { id: 'spa3', guestId: 'g4', guestName: 'Priya Sharma', service: 'Facial Treatment', therapist: 'Ana Silva', room: 'Facial Suite', date: '2026-05-21', startTime: '11:00', endTime: '12:00', duration: 60, price: 150, status: 'CONFIRMED' },
  { id: 'spa4', guestId: 'g8', guestName: 'Ahmed Hassan', service: 'Deep Tissue Massage', therapist: 'Carlos Ruiz', room: 'Spa Room 3', date: '2026-05-19', startTime: '16:00', endTime: '17:00', duration: 60, price: 200, status: 'CONFIRMED' },
  { id: 'spa5', guestId: 'g6', guestName: 'Yuki Tanaka', service: 'Couples Massage', therapist: 'Ana Silva & Maria Santos', room: 'Couples Suite', date: '2026-05-23', startTime: '15:00', endTime: '16:30', duration: 90, price: 420, status: 'CONFIRMED', notes: 'Anniversary celebration' },
];

// ─── Staff Members ────────────────────────────────────────────────────────────
export const mockStaff: StaffMember[] = [
  { id: 'st1', name: 'Alice Admin', email: 'admin@hospease.com', role: 'ADMIN', department: 'Administration', shift: 'MORNING', status: 'ACTIVE', phone: '+1-555-1001', startDate: '2020-01-15', performanceScore: 98 },
  { id: 'st2', name: 'Mark Manager', email: 'manager@hospease.com', role: 'MANAGER', department: 'Operations', shift: 'MORNING', status: 'ACTIVE', phone: '+1-555-1002', startDate: '2020-03-01', performanceScore: 95 },
  { id: 'st3', name: 'Fiona Desk', email: 'frontdesk@hospease.com', role: 'FRONT_DESK', department: 'Front Office', shift: 'MORNING', status: 'ACTIVE', phone: '+1-555-1003', startDate: '2021-06-15', performanceScore: 92 },
  { id: 'st4', name: 'Hannah Keep', email: 'housekeeping@hospease.com', role: 'HOUSEKEEPING', department: 'Housekeeping', shift: 'MORNING', status: 'ACTIVE', phone: '+1-555-1004', startDate: '2021-09-01', performanceScore: 89 },
  { id: 'st5', name: 'Sam Service', email: 'service@hospease.com', role: 'SERVICE_STAFF', department: 'F&B', shift: 'AFTERNOON', status: 'ACTIVE', phone: '+1-555-1005', startDate: '2022-02-01', performanceScore: 91 },
  { id: 'st6', name: 'Frank Finance', email: 'finance@hospease.com', role: 'FINANCE', department: 'Finance', shift: 'MORNING', status: 'ACTIVE', phone: '+1-555-1006', startDate: '2020-07-15', performanceScore: 94 },
  { id: 'st7', name: 'Maria Lopez', email: 'maria.l@hospease.com', role: 'HOUSEKEEPING', department: 'Housekeeping', shift: 'MORNING', status: 'ACTIVE', phone: '+1-555-1007', startDate: '2021-11-01', performanceScore: 88 },
  { id: 'st8', name: 'Jake Torres', email: 'jake.t@hospease.com', role: 'HOUSEKEEPING', department: 'Housekeeping', shift: 'AFTERNOON', status: 'ACTIVE', phone: '+1-555-1008', startDate: '2022-05-15', performanceScore: 85 },
  { id: 'st9', name: 'Anna Chen', email: 'anna.c@hospease.com', role: 'FRONT_DESK', department: 'Front Office', shift: 'NIGHT', status: 'ACTIVE', phone: '+1-555-1009', startDate: '2022-08-01', performanceScore: 90 },
  { id: 'st10', name: 'David Kim', email: 'david.k@hospease.com', role: 'SERVICE_STAFF', department: 'F&B', shift: 'MORNING', status: 'ON_LEAVE', phone: '+1-555-1010', startDate: '2023-01-10', performanceScore: 87 },
];

// ─── Shift Schedules ──────────────────────────────────────────────────────────
export const mockSchedules: ShiftSchedule[] = [
  { id: 'sch1', staffId: 'st3', staffName: 'Fiona Desk', role: 'FRONT_DESK', date: '2026-05-19', shift: 'MORNING', startTime: '07:00', endTime: '15:00', department: 'Front Office', status: 'CONFIRMED' },
  { id: 'sch2', staffId: 'st9', staffName: 'Anna Chen', role: 'FRONT_DESK', date: '2026-05-19', shift: 'NIGHT', startTime: '23:00', endTime: '07:00', department: 'Front Office', status: 'SCHEDULED' },
  { id: 'sch3', staffId: 'st4', staffName: 'Hannah Keep', role: 'HOUSEKEEPING', date: '2026-05-19', shift: 'MORNING', startTime: '08:00', endTime: '16:00', department: 'Housekeeping', status: 'CONFIRMED' },
  { id: 'sch4', staffId: 'st7', staffName: 'Maria Lopez', role: 'HOUSEKEEPING', date: '2026-05-19', shift: 'MORNING', startTime: '08:00', endTime: '16:00', department: 'Housekeeping', status: 'CONFIRMED' },
  { id: 'sch5', staffId: 'st8', staffName: 'Jake Torres', role: 'HOUSEKEEPING', date: '2026-05-19', shift: 'AFTERNOON', startTime: '15:00', endTime: '23:00', department: 'Housekeeping', status: 'SCHEDULED' },
  { id: 'sch6', staffId: 'st5', staffName: 'Sam Service', role: 'SERVICE_STAFF', date: '2026-05-19', shift: 'AFTERNOON', startTime: '14:00', endTime: '22:00', department: 'F&B', status: 'CONFIRMED' },
  { id: 'sch7', staffId: 'st10', staffName: 'David Kim', role: 'SERVICE_STAFF', date: '2026-05-19', shift: 'MORNING', startTime: '06:00', endTime: '14:00', department: 'F&B', status: 'ABSENT' },
];

// ─── KPI Data (30 days) ───────────────────────────────────────────────────────
export const mockKPIData: KPIData[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2026-04-20');
  date.setDate(date.getDate() + i);
  const occ = 65 + Math.random() * 25;
  const adr = 280 + Math.random() * 120;
  return {
    date: date.toISOString().split('T')[0],
    occupancyRate: Math.round(occ * 10) / 10,
    revPAR: Math.round(occ / 100 * adr * 10) / 10,
    adr: Math.round(adr * 10) / 10,
    totalRevenue: Math.round((42000 + Math.random() * 18000) * 10) / 10,
    roomRevenue: Math.round((28000 + Math.random() * 12000) * 10) / 10,
    fbRevenue: Math.round((8000 + Math.random() * 4000) * 10) / 10,
    spaRevenue: Math.round((3000 + Math.random() * 2000) * 10) / 10,
    guestSatisfaction: Math.round((4.1 + Math.random() * 0.8) * 10) / 10,
    checkIns: Math.round(8 + Math.random() * 12),
    checkOuts: Math.round(6 + Math.random() * 10),
    newReservations: Math.round(5 + Math.random() * 15),
  };
});

// ─── Financial Records ────────────────────────────────────────────────────────
export const mockFinancialRecords: FinancialRecord[] = [
  { id: 'fr1', date: '2026-05-19', type: 'REVENUE', category: 'Room Revenue', description: 'Room charges - Suite 501', amount: 500, reference: 'res1', status: 'POSTED' },
  { id: 'fr2', date: '2026-05-19', type: 'REVENUE', category: 'F&B Revenue', description: 'Room service order RS-001', amount: 97.5, reference: 'fb1', status: 'POSTED' },
  { id: 'fr3', date: '2026-05-19', type: 'REVENUE', category: 'Spa Revenue', description: 'Hot stone therapy - Elena Petrova', amount: 250, reference: 'spa2', status: 'POSTED' },
  { id: 'fr4', date: '2026-05-19', type: 'REVENUE', category: 'Room Revenue', description: 'Room charges - Presidential 602', amount: 1200, reference: 'res2', status: 'POSTED' },
  { id: 'fr5', date: '2026-05-19', type: 'EXPENSE', category: 'Payroll', description: 'Daily payroll allocation', amount: 8500, reference: 'PAY-2026-05-19', status: 'POSTED' },
  { id: 'fr6', date: '2026-05-19', type: 'EXPENSE', category: 'F&B Cost', description: 'Food & beverage inventory replenishment', amount: 3200, reference: 'PO-2026-045', status: 'PENDING' },
  { id: 'fr7', date: '2026-05-18', type: 'REVENUE', category: 'Room Revenue', description: 'Room charges - Deluxe 301', amount: 250, reference: 'res3', status: 'POSTED' },
  { id: 'fr8', date: '2026-05-18', type: 'REFUND', category: 'Guest Refund', description: 'Partial refund for early checkout', amount: 165, reference: 'REF-2026-003', status: 'POSTED' },
  { id: 'fr9', date: '2026-05-17', type: 'DEPOSIT', category: 'Reservation Deposit', description: 'Advance deposit - Reservation HE-2026-006', amount: 3500, reference: 'res6', status: 'POSTED' },
  { id: 'fr10', date: '2026-05-17', type: 'REVENUE', category: 'Miscellaneous', description: 'Parking fees', amount: 120, reference: 'PARK-001', status: 'POSTED' },
];

// ─── Refund Requests ──────────────────────────────────────────────────────────
export const mockRefundRequests: RefundRequest[] = [
  { id: 'rr1', invoiceId: 'inv3', invoiceNumber: 'INV-2026-0003', guestName: 'Sarah Mitchell', amount: 165, reason: 'Early checkout due to family emergency', status: 'PROCESSED', requestedBy: 'Fiona Desk', requestedAt: '2026-05-19T10:00:00Z', approvedBy: 'Mark Manager', processedAt: '2026-05-19T11:30:00Z' },
  { id: 'rr2', invoiceId: 'inv1', invoiceNumber: 'INV-2026-0001', guestName: 'James Wilson', amount: 180, reason: 'Spa service quality complaint – therapist was 20 mins late', status: 'PENDING', requestedBy: 'Fiona Desk', requestedAt: '2026-05-19T14:00:00Z' },
  { id: 'rr3', invoiceId: 'inv2', invoiceNumber: 'INV-2026-0002', guestName: 'Elena Petrova', amount: 85, reason: 'Incorrect charge on mini bar items not consumed', status: 'APPROVED', requestedBy: 'Frank Finance', requestedAt: '2026-05-18T16:00:00Z', approvedBy: 'Mark Manager' },
];

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const mockAuditLogs: AuditLog[] = [
  { id: 'al1', userId: 'u1', userName: 'Alice Admin', action: 'USER_CREATED', module: 'User Management', details: 'Created new HOUSEKEEPING user: Jake Torres', ipAddress: '192.168.1.10', timestamp: '2026-05-19T09:00:00Z' },
  { id: 'al2', userId: 'u2', userName: 'Mark Manager', action: 'REFUND_APPROVED', module: 'Finance', details: 'Approved refund REF-2026-003 for $165 - Sarah Mitchell', ipAddress: '192.168.1.11', timestamp: '2026-05-19T11:30:00Z' },
  { id: 'al3', userId: 'u3', userName: 'Fiona Desk', action: 'CHECK_IN', module: 'Reservations', details: 'Checked in James Wilson, Room 501, Conf: HE-2026-001', ipAddress: '192.168.1.12', timestamp: '2026-05-18T14:00:00Z' },
  { id: 'al4', userId: 'u1', userName: 'Alice Admin', action: 'ROLE_UPDATED', module: 'User Management', details: 'Updated role for anna.c@hospease.com from SERVICE_STAFF to FRONT_DESK', ipAddress: '192.168.1.10', timestamp: '2026-05-17T10:00:00Z' },
  { id: 'al5', userId: 'u6', userName: 'Frank Finance', action: 'REPORT_GENERATED', module: 'Reporting', details: 'Generated monthly financial reconciliation report for April 2026', ipAddress: '192.168.1.16', timestamp: '2026-05-15T09:00:00Z' },
  { id: 'al6', userId: 'u3', userName: 'Fiona Desk', action: 'CHECK_OUT', module: 'Reservations', details: 'Checked out Sarah Mitchell, Room 201, Conf: HE-2026-007', ipAddress: '192.168.1.12', timestamp: '2026-05-19T11:00:00Z' },
];

// ─── Room Type Configs ────────────────────────────────────────────────────────
export const mockRoomTypeConfigs: RoomTypeConfig[] = [
  { id: 'rtc1', name: 'Standard Room', type: 'STANDARD', basePrice: 150, weekendPrice: 185, capacity: 2, amenities: roomAmenities.STANDARD, description: 'Comfortable and cozy rooms ideal for solo travelers and couples.', totalRooms: 15 },
  { id: 'rtc2', name: 'Deluxe Room', type: 'DELUXE', basePrice: 250, weekendPrice: 310, capacity: 3, amenities: roomAmenities.DELUXE, description: 'Premium rooms with city views and upgraded amenities.', totalRooms: 10 },
  { id: 'rtc3', name: 'Suite', type: 'SUITE', basePrice: 500, weekendPrice: 620, capacity: 4, amenities: roomAmenities.SUITE, description: 'Luxurious suites with separate living areas and sea views.', totalRooms: 4 },
  { id: 'rtc4', name: 'Presidential Suite', type: 'PRESIDENTIAL', basePrice: 1200, weekendPrice: 1500, capacity: 6, amenities: roomAmenities.PRESIDENTIAL, description: 'The ultimate luxury experience with butler service and panoramic views.', totalRooms: 2 },
];

// ─── Loyalty Transactions ─────────────────────────────────────────────────────
export const mockLoyaltyTransactions: LoyaltyTransaction[] = [
  { id: 'lt1', type: 'EARN', points: 2000, description: 'Stay: Suite 501, 4 nights (HE-2026-001)', date: '2026-05-18', balance: 12450 },
  { id: 'lt2', type: 'EARN', points: 850, description: 'Room service and spa charges', date: '2026-05-19', balance: 13300 },
  { id: 'lt3', type: 'REDEEM', points: -500, description: 'Redeemed for free breakfast voucher', date: '2026-05-20', balance: 12800 },
  { id: 'lt4', type: 'BONUS', points: 1000, description: 'Gold member anniversary bonus', date: '2026-04-15', balance: 10450 },
  { id: 'lt5', type: 'EARN', points: 1650, description: 'Stay: Deluxe 402, 3 nights (HE-2025-188)', date: '2025-12-10', balance: 9450 },
  { id: 'lt6', type: 'EXPIRE', points: -200, description: 'Points expired (inactive > 12 months)', date: '2025-06-01', balance: 7800 },
];

// ─── Messages ─────────────────────────────────────────────────────────────────
export const mockMessages: Message[] = [
  { id: 'msg1', fromName: 'James Wilson', fromRole: 'GUEST', toName: 'Front Desk', subject: 'Early Check-in Request', body: 'Hi, I arrive at 11 AM. Is early check-in possible for room 501?', type: 'GUEST_REQUEST', priority: 'MEDIUM', status: 'READ', createdAt: '2026-05-18T08:00:00Z' },
  { id: 'msg2', fromName: 'Elena Petrova', fromRole: 'GUEST', toName: 'Concierge', subject: 'Restaurant Reservation for 4', body: 'Please book La Belle Époque for 4 persons tonight at 8 PM. Corporate account.', type: 'GUEST_REQUEST', priority: 'HIGH', status: 'REPLIED', createdAt: '2026-05-19T14:00:00Z' },
  { id: 'msg3', fromName: 'Mark Manager', fromRole: 'MANAGER', toName: 'All Staff', subject: 'VIP Arrival - Presidential Suite', body: 'VIP guest Elena Petrova (Platinum member) is in-house. Ensure all requests are handled with priority.', type: 'INTERNAL', priority: 'HIGH', status: 'READ', createdAt: '2026-05-15T09:00:00Z' },
  { id: 'msg4', fromName: 'Yuki Tanaka', fromRole: 'GUEST', subject: 'Pre-Arrival: Dietary Requirements', body: 'I am strictly vegetarian. Please ensure all meals prepared for room 502 are vegetarian.', type: 'PRE_ARRIVAL', priority: 'HIGH', status: 'UNREAD', createdAt: '2026-05-21T10:00:00Z' },
  { id: 'msg5', fromName: 'Ahmed Hassan', fromRole: 'GUEST', subject: 'Complaint: Noise from Corridor', body: 'There was excessive noise from corridor staff last night around midnight. Very disruptive.', type: 'COMPLAINT', priority: 'HIGH', status: 'UNREAD', createdAt: '2026-05-19T07:30:00Z' },
];

// ─── Compliance Exports ───────────────────────────────────────────────────────
export const mockComplianceExports: ComplianceExport[] = [
  { id: 'ce1', name: 'April 2026 Tax Report', type: 'TAX', period: 'April 2026', format: 'PDF', status: 'GENERATED', generatedAt: '2026-05-05T09:00:00Z', fileSize: '2.4 MB' },
  { id: 'ce2', name: 'Q1 2026 Lodging Report', type: 'LODGING', period: 'Q1 2026', format: 'XLSX', status: 'GENERATED', generatedAt: '2026-04-10T10:00:00Z', fileSize: '856 KB' },
  { id: 'ce3', name: 'April 2026 Occupancy Data', type: 'OCCUPANCY', period: 'April 2026', format: 'CSV', status: 'GENERATED', generatedAt: '2026-05-03T11:00:00Z', fileSize: '124 KB' },
  { id: 'ce4', name: 'May 2026 Financial Audit', type: 'FINANCIAL', period: 'May 2026', format: 'PDF', status: 'PENDING' },
];

// ─── Scheduled Reports ────────────────────────────────────────────────────────
export const mockScheduledReports: ScheduledReport[] = [
  { id: 'sr1', name: 'Daily Occupancy Summary', type: 'Occupancy', frequency: 'DAILY', nextRun: '2026-05-20T06:00:00Z', lastRun: '2026-05-19T06:00:00Z', recipients: ['manager@hospease.com', 'admin@hospease.com'], status: 'ACTIVE' },
  { id: 'sr2', name: 'Weekly Revenue Report', type: 'Financial', frequency: 'WEEKLY', nextRun: '2026-05-25T07:00:00Z', lastRun: '2026-05-18T07:00:00Z', recipients: ['finance@hospease.com', 'manager@hospease.com'], status: 'ACTIVE' },
  { id: 'sr3', name: 'Monthly KPI Dashboard', type: 'KPI', frequency: 'MONTHLY', nextRun: '2026-06-01T08:00:00Z', lastRun: '2026-05-01T08:00:00Z', recipients: ['admin@hospease.com'], status: 'ACTIVE' },
  { id: 'sr4', name: 'Weekly Housekeeping Performance', type: 'Operations', frequency: 'WEEKLY', nextRun: '2026-05-25T08:00:00Z', lastRun: '2026-05-18T08:00:00Z', recipients: ['manager@hospease.com', 'housekeeping@hospease.com'], status: 'PAUSED' },
];
