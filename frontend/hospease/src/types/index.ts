export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'FRONT_DESK'
  | 'HOUSEKEEPING'
  | 'SERVICE_STAFF'
  | 'FINANCE'
  | 'REPORTING'
  | 'GUEST';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  createdAt: string;
}

export type RoomStatus = 'CLEAN' | 'DIRTY' | 'INSPECTING' | 'OUT_OF_ORDER' | 'OCCUPIED';
export type RoomType = 'STANDARD' | 'DELUXE' | 'SUITE' | 'PRESIDENTIAL';
export type ReservationStatus = 'CONFIRMED' | 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'REFUNDED';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  description: string;
  lastCleaned?: string;
  assignedHousekeeper?: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  idType: 'PASSPORT' | 'DRIVER_LICENSE' | 'NATIONAL_ID';
  idNumber: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  loyaltyPoints: number;
  totalStays: number;
  createdAt: string;
}

export interface Reservation {
  id: string;
  confirmationNumber: string;
  guestId: string;
  guestName: string;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  guestId: string;
  guestName: string;
  reservationId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
  issuedAt: string;
  dueAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'ROOM' | 'DINING' | 'SPA' | 'MINIBAR' | 'LAUNDRY' | 'OTHER';
  quantity: number;
  unitPrice: number;
  amount: number;
  date: string;
}

export interface ServiceRequest {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  type: 'ROOM_SERVICE' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'AMENITIES' | 'CONCIERGE';
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  type: 'CHECKOUT_CLEAN' | 'STAYOVER_CLEAN' | 'TURNDOWN' | 'DEEP_CLEAN' | 'INSPECTION';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  assignedTo: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedMinutes: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface MaintenanceRequest {
  id: string;
  roomNumber?: string;
  location: string;
  category: 'PLUMBING' | 'HVAC' | 'ELECTRICAL' | 'FURNITURE' | 'APPLIANCE' | 'STRUCTURAL';
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  estimatedCost?: number;
}

export interface FBOrder {
  id: string;
  orderNumber: string;
  guestName?: string;
  roomNumber?: string;
  tableNumber?: string;
  type: 'ROOM_SERVICE' | 'RESTAURANT' | 'BAR' | 'POOL_BAR';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  gratuity: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  notes?: string;
}

export interface SpaBooking {
  id: string;
  guestId: string;
  guestName: string;
  service: string;
  therapist: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  status: 'ACTIVE' | 'ON_LEAVE' | 'OFF_DUTY';
  phone: string;
  startDate: string;
  performanceScore: number;
}

export interface ShiftSchedule {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  startTime: string;
  endTime: string;
  department: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'SWAPPED' | 'ABSENT';
}

export interface KPIData {
  date: string;
  occupancyRate: number;
  revPAR: number;
  adr: number;
  totalRevenue: number;
  roomRevenue: number;
  fbRevenue: number;
  spaRevenue: number;
  guestSatisfaction: number;
  checkIns: number;
  checkOuts: number;
  newReservations: number;
}

export interface FinancialRecord {
  id: string;
  date: string;
  type: 'REVENUE' | 'EXPENSE' | 'REFUND' | 'DEPOSIT';
  category: string;
  description: string;
  amount: number;
  reference: string;
  status: 'POSTED' | 'PENDING' | 'VOIDED';
}

export interface RefundRequest {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  guestName: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  processedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface RoomTypeConfig {
  id: string;
  name: string;
  type: RoomType;
  basePrice: number;
  weekendPrice: number;
  capacity: number;
  amenities: string[];
  description: string;
  totalRooms: number;
}

export interface LoyaltyTransaction {
  id: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'BONUS';
  points: number;
  description: string;
  date: string;
  balance: number;
}

export interface Message {
  id: string;
  fromName: string;
  fromRole: string;
  toName?: string;
  subject: string;
  body: string;
  type: 'INTERNAL' | 'GUEST_REQUEST' | 'PRE_ARRIVAL' | 'COMPLAINT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'RESOLVED';
  createdAt: string;
}

export interface ComplianceExport {
  id: string;
  name: string;
  type: 'TAX' | 'LODGING' | 'OCCUPANCY' | 'FINANCIAL';
  period: string;
  format: 'CSV' | 'PDF' | 'XLSX';
  status: 'PENDING' | 'GENERATED' | 'FAILED';
  generatedAt?: string;
  fileSize?: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  nextRun: string;
  lastRun?: string;
  recipients: string[];
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED';
}
