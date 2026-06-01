import { useState } from 'react';
import { Plus, Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../utils/statusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { serviceOrdersApi, type ServiceType } from '../../api/serviceOrders';
import { reservationsApi } from '../../api/reservations';
import { useEffectiveGuestId } from '../../hooks/useEffectiveGuestId';
import { formatDate, formatRelative } from '../../utils/formatters';
import { useWorkflowStore } from '../../store/workflowStore';

const SERVICE_TYPES: { type: ServiceType; label: string; icon: string }[] = [
  { type: 'ROOM_SERVICE',        label: 'Room Service',     icon: '🍽️' },
  { type: 'FOOD_AND_BEVERAGES',  label: 'Food & Beverage',  icon: '🍴' },
  { type: 'HOUSEKEEPING',        label: 'Housekeeping',     icon: '🧹' },
  { type: 'LAUNDRY',             label: 'Laundry',          icon: '👕' },
  { type: 'SPA',                 label: 'Spa',              icon: '💆' },
  { type: 'GYM',                 label: 'Gym',              icon: '🏋️' },
];

const TYPE_ICON: Record<string, string> = Object.fromEntries(
  SERVICE_TYPES.map(({ type, icon }) => [type, icon]),
);

export default function ServiceRequests() {
  const { effectiveGuestId: guestId } = useEffectiveGuestId();
  const queryClient = useQueryClient();
  const { customStatuses } = useWorkflowStore();

  const [showNew,       setShowNew]       = useState(false);
  const [serviceType,   setServiceType]   = useState<ServiceType>('ROOM_SERVICE');
  const [description,   setDescription]   = useState('');
  const [reservationId, setReservationId] = useState('');

  // Guest's service orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['service-orders', 'guest', guestId],
    queryFn: () => serviceOrdersApi.getByGuest(guestId!),
    enabled: !!guestId,
  });

  // Active reservations to pick from (CONFIRMED or CHECKED_IN)
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations', 'guest', guestId],
    queryFn: () => reservationsApi.getByGuest(guestId!),
    enabled: !!guestId,
  });

  const activeReservations = reservations.filter(
    (r) => r.status === 'CHECKED_IN',
  );

  const selectedReservation = activeReservations.find(
    (r) => String(r.reservationId) === reservationId,
  );

  const createMutation = useMutation({
    mutationFn: serviceOrdersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'guest', guestId] });
      setShowNew(false);
      setDescription('');
      setReservationId('');
      setServiceType('ROOM_SERVICE');
    },
  });

  const handleSubmit = () => {
    if (!guestId || !reservationId || !selectedReservation) return;
    createMutation.mutate({
      guestId,
      reservationId: String(selectedReservation.reservationId),
      roomId: String(selectedReservation.roomId),
      serviceType,
      description,
      price: 0,          // Staff sets the actual price after accepting
    });
  };

  const canSubmit = !!reservationId && !!selectedReservation && !createMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-sm text-gray-400 mt-0.5">Submit and track in-room service requests</p>
        </div>
        <Button onClick={() => setShowNew(true)} icon={<Plus size={16} />} disabled={activeReservations.length === 0}>New Request</Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {[
          { label: 'Pending',     filter: 'PENDING',     bg: 'from-blue-500 to-blue-700' },
          { label: 'In Progress', filter: 'IN_PROGRESS', bg: 'from-amber-500 to-amber-600' },
          { label: 'Completed',   filter: 'COMPLETED',   bg: 'from-emerald-500 to-teal-600' },
        ].map(({ label, filter, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 animate-fade-in-up">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
              <span className="text-sm font-bold">{orders.filter((o) => o.status === filter).length}</span>
            </div>
            <p className="text-xs font-semibold text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* No checked-in reservation warning */}
      {!isLoading && activeReservations.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">!</span>
          <div>
            <p className="font-semibold">Checked-In Reservation Required</p>
            <p className="text-xs text-amber-600 mt-0.5 animate-pulse">
              Room service, housekeeping, laundry, and maintenance requests are strictly restricted to guests who are currently checked into their rooms. If you have an upcoming confirmed reservation, please check in at the front desk to activate these services.
            </p>
          </div>
        </div>
      )}

      {/* Orders list */}
      <Card padding={false}>
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">Loading requests…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No service requests yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((req) => (
              <div key={req.orderId} className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="text-2xl shrink-0">{TYPE_ICON[req.serviceType] ?? '📋'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{req.serviceType.replace(/_/g, ' ')}</p>
                    <Badge variant={statusBadge(customStatuses[req.orderId]?.status ?? req.status)}>
                      {(customStatuses[req.orderId]?.status ?? req.status).replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {req.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{req.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>Submitted {formatRelative(req.createdAt)}</span>
                    {req.room && <span>Room {req.room.number}</span>}
                  </div>
                  {/* Workflow timeline */}
                  <div className="flex items-center gap-1 mt-3">
                    {[
                      { label: 'Submitted', done: true },
                      { label: 'Front Desk', done: !!customStatuses[req.orderId] || req.status === 'CONFIRMED' || req.status === 'IN_PROGRESS' || req.status === 'COMPLETED' },
                      { label: 'Manager', done: ['STAFF_ASSIGNED', 'STAFF_COMPLETED', 'MANAGER_VERIFIED'].includes(customStatuses[req.orderId]?.status ?? '') },
                      { label: 'Staff', done: ['STAFF_COMPLETED', 'MANAGER_VERIFIED'].includes(customStatuses[req.orderId]?.status ?? '') || req.status === 'COMPLETED' },
                      { label: 'Completed', done: req.status === 'COMPLETED' || customStatuses[req.orderId]?.status === 'MANAGER_VERIFIED' },
                    ].map((step, i) => (
                      <div key={step.label} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${step.done ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                        <span className={`text-[10px] font-medium ${step.done ? 'text-emerald-600' : 'text-gray-300'}`}>{step.label}</span>
                        {i < 4 && <div className={`w-3 h-px ${step.done ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* New request modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Service Request" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleSubmit} icon={<Bell size={15} />} disabled={!canSubmit}>
              {createMutation.isPending ? 'Submitting…' : 'Submit Request'}
            </Button>
          </>
        }>
        <div className="space-y-5">

          {/* Reservation picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Linked Reservation <span className="text-rose-500">*</span>
            </label>
            {activeReservations.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                No active reservations. You need a Confirmed or Checked-In reservation.
              </p>
            ) : (
              <select value={reservationId} onChange={(e) => setReservationId(e.target.value)}
                className="select">
                <option value="">— Select reservation —</option>
                {activeReservations.map((r) => (
                  <option key={r.reservationId} value={String(r.reservationId)}>
                    Room {r.roomNumber} ({r.roomType}) · {formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)} · {r.status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Service type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <div className="grid grid-cols-3 gap-2">
              {SERVICE_TYPES.map(({ type, label, icon }) => (
                <button key={type} onClick={() => setServiceType(type)}
                  className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-xs font-medium transition-all ${serviceType === type ? 'border-navy-700 bg-navy-50 text-navy-800' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                  <span className="text-lg">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Describe your request in detail…"
              className="textarea" />
          </div>

          {createMutation.isError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              Submission failed — please try again.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
