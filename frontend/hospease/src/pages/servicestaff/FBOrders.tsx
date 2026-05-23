import { useState } from 'react';
import { Plus, Clock, ChefHat, Truck, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { serviceOrdersApi } from '../../api/serviceOrders';
import type { ServiceOrderResponseDto, ServiceType, ServiceOrderStatus } from '../../api/serviceOrders';
import { reservationsApi } from '../../api/reservations';
import { formatCurrency, formatRelative } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';

type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const STATUS_FLOW: Record<string, string | null> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  CONFIRMED: 'IN_PROGRESS',
  COMPLETED: null,
  CANCELLED: null,
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock size={14} />,
  IN_PROGRESS: <ChefHat size={14} />,
  CONFIRMED: <Truck size={14} />,
  COMPLETED: <CheckCircle size={14} />,
};

const ORDER_TYPES: { type: ServiceType; label: string }[] = [
  { type: 'RESTAURANT', label: 'Restaurant / Dine-in' },
  { type: 'ROOM_SERVICE', label: 'Room Service' },
];

export default function FBOrders() {
  const { user } = useAuthStore();
  const isServiceStaff = user?.role === 'SERVICE_STAFF';
  const [selected, setSelected] = useState<ServiceOrderResponseDto | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    serviceType: 'RESTAURANT' as ServiceType,
    reservationId: '',
    description: '',
    price: '',
  });

  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['service-orders', 'RESTAURANT'],
    queryFn: () => serviceOrdersApi.getByType('RESTAURANT'),
  });

  // Also fetch room service orders
  const { data: roomServiceOrders = [] } = useQuery({
    queryKey: ['service-orders', 'ROOM_SERVICE'],
    queryFn: () => serviceOrdersApi.getByType('ROOM_SERVICE'),
  });

  const rawAllOrders = [...orders, ...roomServiceOrders];
  const allOrders = (isServiceStaff
    ? rawAllOrders.filter((o) => String(o.assignedToUserId) === String(user?.id))
    : rawAllOrders
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Fetch reservations for picker
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
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'RESTAURANT'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'ROOM_SERVICE'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof serviceOrdersApi.create>[0]) => serviceOrdersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'RESTAURANT'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'ROOM_SERVICE'] });
      setShowNew(false);
      setForm({ serviceType: 'RESTAURANT', reservationId: '', description: '', price: '' });
    },
  });

  const advance = (id: string, currentStatus: string) => {
    const next = STATUS_FLOW[currentStatus];
    if (next) updateStatusMutation.mutate({ id, status: next as ServiceOrderStatus });
  };

  const selectedReservation = activeReservations.find((r) => String(r.reservationId) === form.reservationId);

  const handleCreate = () => {
    createMutation.mutate({
      serviceType: form.serviceType,
      description: form.description || `${form.serviceType === 'RESTAURANT' ? 'Restaurant' : 'Room Service'} order`,
      guestId: selectedReservation?.guestId ?? null,
      reservationId: selectedReservation?.reservationId ?? null,
      roomId: selectedReservation?.roomId ?? null,
      price: parseFloat(form.price) || 0,
    });
  };

  const kanbanColumns: { status: string; label: string; color: string }[] = [
    { status: 'PENDING', label: 'Pending', color: 'bg-gray-50 border-gray-200' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-50 border-amber-200' },
    { status: 'CONFIRMED', label: 'Ready', color: 'bg-blue-50 border-blue-200' },
    { status: 'COMPLETED', label: 'Completed', color: 'bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">F&B Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">Food & beverage order management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowNew(true)}>New Order</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {kanbanColumns.map(({ status, label, color }) => (
          <div key={status} className={`p-3 rounded-xl border ${color}`}>
            <div className="flex items-center gap-2 mb-1">
              {statusIcons[status]}
              <span className="text-xs font-semibold text-gray-600">{label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{allOrders.filter((o) => o.status === status).length}</p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {kanbanColumns.map(({ status, label, color }) => {
          const colOrders = allOrders.filter((o) => o.status === status);
          return (
            <div key={status} className={`rounded-xl border p-4 ${color}`}>
              <div className="flex items-center gap-2 mb-3">
                {statusIcons[status]}
                <h3 className="font-semibold text-sm text-gray-700">{label}</h3>
                <span className="ml-auto text-xs font-bold text-gray-500">{colOrders.length}</span>
              </div>
              <div className="space-y-2">
                {colOrders.map((order) => (
                  <div key={order.orderId} className="bg-white rounded-lg p-3 shadow-sm border border-white cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelected(order)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700">#{String(order.orderId).slice(0, 8)}</span>
                      <Badge variant={statusBadge('info')} className="text-xs">
                        {order.serviceType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{order.roomId ? `Room ${order.roomId}` : 'Dine-in'}</p>
                    <p className="text-xs text-gray-400">{order.description?.slice(0, 30) ?? 'No description'}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatRelative(order.createdAt)}</p>
                    {order.price > 0 && !isServiceStaff && <p className="text-xs font-semibold text-gray-600 mt-1">{formatCurrency(order.price)}</p>}
                    {STATUS_FLOW[status] && (
                      <button onClick={(e) => { e.stopPropagation(); advance(order.orderId, order.status); }}
                        className="mt-2 w-full py-1 text-xs font-medium bg-navy-900 text-white rounded-md hover:bg-navy-800 transition-colors">
                        → {STATUS_FLOW[status]?.replace('_', ' ')}
                      </button>
                    )}
                  </div>
                ))}
                {colOrders.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No orders</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order detail */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order #${String(selected.orderId).slice(0, 8)}`} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Type</p><p className="font-medium">{selected.serviceType.replace('_', ' ')}</p></div>
              <div><p className="text-gray-500">Location</p><p className="font-medium">{selected.roomId ? `Room ${selected.roomId}` : 'Dine-in'}</p></div>
              <div><p className="text-gray-500">Status</p><Badge variant={statusBadge(selected.status)}>{selected.status.replace('_', ' ')}</Badge></div>
              {selected.price > 0 && !isServiceStaff && <div><p className="text-gray-500">Price</p><p className="font-medium">{formatCurrency(selected.price)}</p></div>}
            </div>
            {selected.description && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                {selected.description}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* New Order Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New F&B Order" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </>
        }>
        <div className="space-y-4">
          {createMutation.isError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              Failed to create order. Please try again.
            </div>
          )}

          {/* Order type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ORDER_TYPES.map(({ type, label }) => (
                <button key={type} type="button"
                  onClick={() => setForm((f) => ({ ...f, serviceType: type }))}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.serviceType === type ? 'border-navy-900 bg-navy-50 text-navy-900' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Guest reservation picker (optional for restaurant, required for room service) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Guest Reservation {form.serviceType === 'ROOM_SERVICE' ? '(required)' : '(optional)'}
            </label>
            <select value={form.reservationId}
              onChange={(e) => setForm((f) => ({ ...f, reservationId: e.target.value }))}
              className="select">
              <option value="">— Walk-in / No reservation —</option>
              {activeReservations.map((r) => (
                <option key={r.reservationId} value={r.reservationId}>
                  {r.guestName} — Room {r.roomNumber}
                </option>
              ))}
            </select>
            {selectedReservation && (
              <div className="mt-1 p-2 bg-emerald-50 rounded text-xs text-emerald-700">
                {selectedReservation.guestName} • Room {selectedReservation.roomNumber}
              </div>
            )}
          </div>

          {/* Order description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Description</label>
            <textarea value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="e.g., Grilled salmon with vegetables, 2x orange juice"
              className="textarea" />
          </div>

          {/* Price */}
          {!isServiceStaff && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Amount ($)</label>
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
