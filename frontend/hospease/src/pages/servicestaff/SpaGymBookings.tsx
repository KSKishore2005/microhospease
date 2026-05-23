import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { serviceOrdersApi } from '../../api/serviceOrders';
import type { ServiceOrderResponseDto, ServiceType, ServiceOrderStatus } from '../../api/serviceOrders';
import { reservationsApi } from '../../api/reservations';
import { formatDate, formatCurrency, formatRelative } from '../../utils/formatters';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';

interface GymClass {
  id: string;
  name: string;
  time: string;
  duration: number;
  capacity: number;
  enrolled: number;
}

const SPA_GYM_TYPES: { type: ServiceType; label: string; emoji: string }[] = [
  { type: 'SPA', label: 'Spa Treatment', emoji: '💆' },
  { type: 'GYM', label: 'Gym Session', emoji: '🏋️' },
];

const DEFAULT_GYM_CLASSES: GymClass[] = [
  { id: '1', name: 'Morning Yoga', time: '07:00', duration: 60, capacity: 12, enrolled: 8 },
  { id: '2', name: 'HIIT Bootcamp', time: '08:30', duration: 45, capacity: 10, enrolled: 10 },
  { id: '3', name: 'Pilates', time: '10:00', duration: 60, capacity: 8, enrolled: 5 },
  { id: '4', name: 'Evening Stretch', time: '18:00', duration: 45, capacity: 12, enrolled: 3 },
];

export default function SpaGymBookings() {
  const { user } = useAuthStore();
  const isServiceStaff = user?.role === 'SERVICE_STAFF';
  const [selected, setSelected] = useState<ServiceOrderResponseDto | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [enrollClass, setEnrollClass] = useState<string | null>(null);
  const [enrollResId, setEnrollResId] = useState('');
  const addToast = useToastStore((s) => s.addToast);

  const [gymClasses, setGymClasses] = useState<GymClass[]>(() => {
    const saved = localStorage.getItem('hospease-gym-classes');
    return saved ? JSON.parse(saved) : DEFAULT_GYM_CLASSES;
  });

  const [form, setForm] = useState({
    serviceType: 'SPA' as ServiceType,
    reservationId: '',
    description: '',
    price: '',
  });

  const queryClient = useQueryClient();

  const { data: spaOrders = [] } = useQuery({
    queryKey: ['service-orders', 'SPA'],
    queryFn: () => serviceOrdersApi.getByType('SPA'),
  });
  const { data: gymOrders = [] } = useQuery({
    queryKey: ['service-orders', 'GYM'],
    queryFn: () => serviceOrdersApi.getByType('GYM'),
  });
  const rawBookings = [...spaOrders, ...gymOrders];
  const bookings = (isServiceStaff
    ? rawBookings.filter((b) => String(b.assignedToUserId) === String(user?.id))
    : rawBookings
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const { data: allReservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: reservationsApi.getAll,
  });
  const activeReservations = allReservations.filter(
    (r) => r.status === 'CHECKED_IN' || r.status === 'CONFIRMED'
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceOrderStatus }) => serviceOrdersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'SPA'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'GYM'] });
      setSelected(null);
      addToast('Booking status updated successfully!', 'success');
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof serviceOrdersApi.create>[0]) => serviceOrdersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'SPA'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'GYM'] });
      setShowNew(false);
      setForm({ serviceType: 'SPA', reservationId: '', description: '', price: '' });
      addToast('Booking scheduled successfully!', 'success');
    },
  });

  const selectedReservation = activeReservations.find((r) => String(r.reservationId) === form.reservationId);

  const handleCreate = () => {
    if (!form.reservationId || !selectedReservation) return;
    createMutation.mutate({
      serviceType: form.serviceType,
      description: form.description || `${form.serviceType === 'SPA' ? 'Spa' : 'Gym'} appointment`,
      guestId: selectedReservation.guestId,
      reservationId: selectedReservation.reservationId,
      roomId: selectedReservation.roomId,
      price: parseFloat(form.price) || 0,
    });
  };

  const handleEnrollGuest = () => {
    if (!enrollClass || !enrollResId) return;
    const res = activeReservations.find((r) => String(r.reservationId) === enrollResId);
    if (!res) return;

    const updated = gymClasses.map((c) => {
      if (c.id === enrollClass) {
        if (c.enrolled >= c.capacity) return c;
        return { ...c, enrolled: c.enrolled + 1 };
      }
      return c;
    });

    setGymClasses(updated);
    localStorage.setItem('hospease-gym-classes', JSON.stringify(updated));
    addToast(`Enrolled ${res.guestName} into class successfully!`, 'success');
    setEnrollClass(null);
    setEnrollResId('');
  };

  const today = new Date().toISOString().split('T')[0];
  const spaRevenue = spaOrders.filter((b) => b.status === 'COMPLETED').reduce((s, b) => s + (b.price ?? 0), 0);
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spa & Gym Bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Appointment scheduling and resource allocation</p>
        </div>
        <Button onClick={() => setShowNew(true)} icon={<Plus size={16} />}>New Booking</Button>
      </div>

      {/* Stats — hide Spa Revenue for service staff */}
      <div className="grid sm:grid-cols-3 gap-4 stagger">
        {[
          ...(!isServiceStaff ? [{ label: 'Spa Revenue', value: formatCurrency(spaRevenue), sub: 'from completed services', bg: 'from-purple-500 to-violet-600' }] : []),
          { label: 'Active Bookings', value: String(confirmedBookings), sub: 'pending & confirmed', bg: 'from-blue-500 to-blue-700' },
          { label: 'Total Bookings', value: String(bookings.length), sub: 'all time', bg: 'from-emerald-500 to-teal-600' },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-200">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.bg} opacity-5 rounded-full translate-x-6 -translate-y-6`} />
            <p className="text-xs font-medium text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            <p className="text-xs text-gray-300 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Appointments */}
        <div className="lg:col-span-2">
          <Card title="Appointments" subtitle={formatDate(today)}>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {bookings.map((b) => (
                <div key={b.orderId} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 cursor-pointer transition-all hover:shadow-sm"
                  onClick={() => setSelected(b)}>
                  <span className="text-2xl">{b.serviceType === 'SPA' ? '💆' : '🏋️'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{b.description ?? `${b.serviceType} Service`}</p>
                    <p className="text-sm text-gray-600">{b.serviceType.replace('_', ' ')} {b.roomId ? `• Room ${b.roomId}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelative(b.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    {b.price > 0 && !isServiceStaff && <p className="font-bold text-gray-800">{formatCurrency(b.price)}</p>}
                    <Badge variant={statusBadge(b.status)} className="mt-1">{b.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No spa or gym bookings.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Gym Schedule */}
        <Card title="Gym Classes Today">
          <div className="space-y-3">
            {gymClasses.map((cls) => {
              const isFull = cls.enrolled >= cls.capacity;
              return (
                <div key={cls.id} className={`p-4 rounded-xl border transition-all ${isFull ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-gray-900">{cls.name}</p>
                    <span className={`text-xs font-bold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isFull ? 'Full' : `${cls.capacity - cls.enrolled} spots left`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{cls.time} • {cls.duration} mins • {cls.enrolled}/{cls.capacity} Enrolled</p>
                  <div className="mt-2.5 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isFull ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }} />
                  </div>
                  {!isFull && (
                    <button
                      onClick={() => setEnrollClass(cls.id)}
                      className="mt-3 w-full py-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                    >
                      <UserPlus size={12} /> Enroll Guest
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Enroll Guest Modal */}
      <Modal open={!!enrollClass} onClose={() => setEnrollClass(null)} title="Enroll Guest in Class" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEnrollClass(null)}>Cancel</Button>
            <Button onClick={handleEnrollGuest} disabled={!enrollResId}>Enroll</Button>
          </>
        }>
        <div className="space-y-3">
          <label className="input-label">Select Guest Reservation</label>
          <select value={enrollResId} onChange={(e) => setEnrollResId(e.target.value)} className="select">
            <option value="">— Select Guest —</option>
            {activeReservations.map((r) => (
              <option key={r.reservationId} value={r.reservationId}>
                {r.guestName} (Room {r.roomNumber})
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Booking detail modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={`${selected.serviceType.replace('_', ' ')} — Order #${String(selected.orderId).slice(0, 8)}`} size="md"
          footer={
            <>
              {(selected.status === 'CONFIRMED' || selected.status === 'PENDING' || selected.status === 'IN_PROGRESS') && (
                <>
                  <Button variant="danger" size="sm" onClick={() => updateStatusMutation.mutate({ id: selected.orderId, status: 'CANCELLED' })}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={() => updateStatusMutation.mutate({ id: selected.orderId, status: 'COMPLETED' })}>Mark Completed</Button>
                </>
              )}
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </>
          }>
          <div className="space-y-3 text-sm">
            {[
              ['Service', selected.serviceType.replace('_', ' ')],
              ['Order ID', selected.orderId],
              ['Room ID', selected.roomId || 'N/A'],
              ...(!isServiceStaff ? [['Price', selected.price > 0 ? formatCurrency(selected.price) : 'N/A']] : []),
              ['Status', <Badge key="s" variant={statusBadge(selected.status)}>{selected.status.replace('_', ' ')}</Badge>],
              ['Created', formatDate(selected.createdAt)],
            ].map(([l, v], i) => (
              <div key={i} className="flex items-center gap-2"><span className="text-gray-500 w-20 flex-shrink-0">{l as string}</span><span className="font-medium text-gray-900">{v}</span></div>
            ))}
            {selected.description && <div className="p-3 bg-amber-50 rounded-lg text-amber-700 text-xs">{selected.description}</div>}
          </div>
        </Modal>
      )}

      {/* New booking modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Spa / Gym Booking" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.reservationId || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Booking'}
            </Button>
          </>
        }>
        <div className="space-y-4">
          {createMutation.isError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              Failed to create booking. Please try again.
            </div>
          )}

          {/* Service type */}
          <div>
            <label className="input-label">Service Type</label>
            <div className="grid grid-cols-2 gap-2">
              {SPA_GYM_TYPES.map(({ type, label, emoji }) => (
                <button key={type} type="button"
                  onClick={() => setForm((f) => ({ ...f, serviceType: type }))}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.serviceType === type ? 'border-navy-900 bg-navy-50 text-navy-900' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Guest reservation picker */}
          <div>
            <label className="input-label">Guest Reservation <span className="text-rose-500">*</span></label>
            <select value={form.reservationId}
              onChange={(e) => setForm((f) => ({ ...f, reservationId: e.target.value }))}
              className="select">
              <option value="">— Select a guest reservation —</option>
              {activeReservations.map((r) => (
                <option key={r.reservationId} value={r.reservationId}>
                  {r.guestName} — Room {r.roomNumber} ({r.status})
                </option>
              ))}
            </select>
            {activeReservations.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5">⚠ No checked-in or confirmed reservations found.</p>
            )}
            {selectedReservation && (
              <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl text-xs text-emerald-700 border border-emerald-100">
                ✓ {selectedReservation.guestName} · Room {selectedReservation.roomNumber} · {selectedReservation.roomType}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="input-label">Notes / Description</label>
            <textarea value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Any special requests or notes..."
              className="textarea" />
          </div>

          {/* Price */}
          {!isServiceStaff && (
            <div>
              <label className="input-label">Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="input" />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
