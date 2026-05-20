import { useState } from 'react';
import {
  ListFilter, CalendarDays, Users, TrendingUp, LogIn,
  CheckCircle2, LogOut, XCircle, AlertCircle, FileText,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { reservationsApi } from '../../api/reservations';
import type { ReservationResponseDto } from '../../api/reservations';
import { invoicesApi } from '../../api/invoices';
import { formatDate, formatCurrency } from '../../utils/formatters';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
const ALL_STATUSES: (ReservationStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];

/** Allowed forward transitions per the backend state machine. */
const NEXT_STATUS: Partial<Record<ReservationStatus, { target: ReservationStatus; label: string; icon: React.ReactNode; variant: 'primary' | 'gold' | 'danger' }>> = {
  PENDING:    { target: 'CONFIRMED',   label: 'Confirm Booking', icon: <CheckCircle2 size={13} />, variant: 'primary' },
  CONFIRMED:  { target: 'CHECKED_IN',  label: 'Check In Guest',  icon: <LogIn size={13} />,        variant: 'primary' },
  CHECKED_IN: { target: 'CHECKED_OUT', label: 'Check Out',       icon: <LogOut size={13} />,       variant: 'gold' },
};

const CAN_CANCEL: ReservationStatus[] = ['PENDING', 'CONFIRMED'];

interface PendingAction {
  reservation: ReservationResponseDto;
  target: ReservationStatus;
  label: string;
}

export default function ReservationManagement() {
  const [filter, setFilter] = useState<ReservationStatus | 'ALL'>('ALL');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const queryClient = useQueryClient();

  // Generate-invoice mutation. Used both:
  //   (a) automatically right after a successful CHECKED_OUT transition
  //       (defensive — the backend already auto-generates, this just covers
  //       the case where finance-service was unreachable from the backend), and
  //   (b) manually via the "Generate Invoice" button on a CHECKED_OUT row.
  const generateInvoiceMutation = useMutation({
    mutationFn: (reservationId: string) => invoicesApi.generateForReservation(reservationId),
    onSuccess: () => {
      setToast({ kind: 'ok', msg: 'Invoice generated successfully.' });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        // Already exists — surface as info, not an error.
        setToast({ kind: 'ok', msg: 'Invoice already exists for this reservation.' });
      } else {
        setToast({ kind: 'err', msg: msg ?? 'Could not generate invoice. Please try again.' });
      }
      setTimeout(() => setToast(null), 5000);
    },
  });

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: reservationsApi.getAll,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      reservationsApi.updateStatus(id, status),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      // After a successful check-out the backend should auto-generate the
      // invoice via Feign — but trigger it client-side too as a belt-and-braces
      // measure in case finance-service was unreachable from the backend. The
      // backend returns 409 ConflictException if the invoice already exists,
      // which we silently treat as success.
      if (vars.status === 'CHECKED_OUT') {
        generateInvoiceMutation.mutate(vars.id);
      }
      setPending(null);
      setActionError(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Status change failed. Please try again.';
      setActionError(msg);
    },
  });

  const filtered = filter === 'ALL' ? reservations : reservations.filter((r) => r.status === filter);

  const today = new Date().toISOString().split('T')[0];

  const stats = {
    pending:    reservations.filter((r) => r.status === 'PENDING').length,
    today:      reservations.filter((r) => r.checkInDate === today).length,
    checkedIn:  reservations.filter((r) => r.status === 'CHECKED_IN').length,
    revenue:    reservations.filter((r) => r.status !== 'CANCELLED').reduce((s, r) => {
      const nights = Math.max(1, Math.ceil((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / 86_400_000));
      return s + r.ratePerNight * nights;
    }, 0),
  };

  const statItems = [
    { label: 'Pending Approval',  value: stats.pending,                 icon: <AlertCircle size={18} />,  gradient: 'from-amber-500 to-amber-600' },
    { label: "Today's Arrivals",  value: stats.today,                   icon: <CalendarDays size={18} />, gradient: 'from-navy-600 to-navy-800' },
    { label: 'Currently In-House',value: stats.checkedIn,               icon: <LogIn size={18} />,        gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Revenue Booked',    value: formatCurrency(stats.revenue), icon: <TrendingUp size={18} />,   gradient: 'from-gold-500 to-gold-600' },
  ];

  function openAction(row: ReservationResponseDto, target: ReservationStatus, label: string) {
    setActionError(null);
    setPending({ reservation: row, target, label });
  }

  function confirmAction() {
    if (!pending) return;
    statusMutation.mutate({ id: String(pending.reservation.reservationId), status: pending.target });
  }

  const columns = [
    { key: 'reservationId', label: 'Reservation ID', sortable: true },
    { key: 'guestName', label: 'Guest', sortable: true },
    { key: 'roomNumber', label: 'Room', sortable: true },
    { key: 'roomType', label: 'Type' },
    { key: 'checkInDate', label: 'Check-In', sortable: true, render: (v: unknown) => formatDate(String(v)) },
    { key: 'checkOutDate', label: 'Check-Out', sortable: true, render: (v: unknown) => formatDate(String(v)) },
    { key: 'ratePerNight', label: 'Rate/Night', render: (v: unknown) => formatCurrency(Number(v)) },
    {
      key: 'status', label: 'Status',
      render: (v: unknown) => <Badge variant={statusBadge(String(v))} dot>{String(v).replace('_', ' ')}</Badge>,
    },
    {
      key: 'reservationId', label: 'Actions',
      render: (_v: unknown, row: Record<string, unknown>) => {
        const r = row as unknown as ReservationResponseDto;
        const next = NEXT_STATUS[r.status as ReservationStatus];
        const canCancel = CAN_CANCEL.includes(r.status as ReservationStatus);
        // CHECKED_OUT is terminal but supports re-triggering invoice generation
        // (covers the case where the auto-trigger on checkout failed due to a
        // transient finance-service outage).
        const canGenerateInvoice = r.status === 'CHECKED_OUT';
        return (
          <div className="flex gap-1.5 justify-end">
            {next && (
              <Button
                size="xs"
                variant={next.variant}
                icon={next.icon}
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); openAction(r, next.target, next.label); }}
              >
                {next.label}
              </Button>
            )}
            {canCancel && (
              <Button
                size="xs"
                variant="ghost"
                icon={<XCircle size={12} />}
                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); openAction(r, 'CANCELLED', 'Cancel Reservation'); }}
              >
                Cancel
              </Button>
            )}
            {canGenerateInvoice && (
              <Button
                size="xs"
                variant="secondary"
                icon={<FileText size={12} />}
                loading={generateInvoiceMutation.isPending}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  generateInvoiceMutation.mutate(String(r.reservationId));
                }}
              >
                Generate Invoice
              </Button>
            )}
            {!next && !canCancel && !canGenerateInvoice && (
              <span className="text-xs text-gray-300">—</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reservation Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Approve, check-in, and complete guest stays. New guest bookings arrive as <span className="font-semibold text-amber-700">PENDING</span> — confirm them here to make the rooms officially held.
        </p>
      </div>

      {/* Transient toast for invoice-generation feedback */}
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium animate-fade-in-up ${
            toast.kind === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {statItems.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-200">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400 truncate">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table with status filter */}
      <Card padding={false}>
        <div className="flex items-center gap-2 flex-wrap px-6 py-4 border-b border-gray-50">
          <ListFilter size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Status</span>
          {ALL_STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filter === s
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}>
              {s.replace('_', ' ')}
              {s !== 'ALL' && (
                <span className={`ml-1.5 ${filter === s ? 'text-white/70' : 'text-gray-400'}`}>
                  {reservations.filter((r) => r.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-center text-sm text-gray-400 py-10">Loading reservations…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">
              {filter === 'ALL' ? 'No reservations yet.' : `No ${filter.toLowerCase().replace('_', ' ')} reservations.`}
            </p>
          ) : (
            <Table
              columns={columns as Parameters<typeof Table>[0]['columns']}
              data={filtered as unknown as Record<string, unknown>[]}
              keyField="reservationId"
              searchable
              searchKeys={['guestName', 'reservationId', 'roomNumber']}
            />
          )}
        </div>
      </Card>

      {/* Confirmation modal */}
      {pending && (
        <Modal
          open={!!pending}
          onClose={() => { setPending(null); setActionError(null); }}
          title={pending.label}
          subtitle={`Reservation #${pending.reservation.reservationId} — ${pending.reservation.guestName}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setPending(null); setActionError(null); }}>
                Cancel
              </Button>
              <Button
                variant={pending.target === 'CANCELLED' ? 'danger' : 'primary'}
                loading={statusMutation.isPending}
                disabled={statusMutation.isPending}
                onClick={confirmAction}
              >
                {pending.target === 'CANCELLED' ? 'Yes, cancel it' : `Confirm — ${pending.label}`}
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                ['Guest', pending.reservation.guestName],
                ['Room', `${pending.reservation.roomNumber} (${pending.reservation.roomType})`],
                ['Check-In', formatDate(pending.reservation.checkInDate)],
                ['Check-Out', formatDate(pending.reservation.checkOutDate)],
              ].map(([l, v]) => (
                <div key={String(l)} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                  <p className="font-semibold text-gray-900">{v}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-navy-50 rounded-xl border border-navy-100 flex items-center justify-between">
              <span className="text-xs text-gray-600">Status change</span>
              <div className="flex items-center gap-2">
                <Badge variant={statusBadge(pending.reservation.status)} dot>
                  {pending.reservation.status.replace('_', ' ')}
                </Badge>
                <span className="text-gray-400 text-xs">→</span>
                <Badge variant={statusBadge(pending.target)} dot>
                  {pending.target.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {pending.target === 'CHECKED_IN' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                ✓ Room {pending.reservation.roomNumber} will be marked OCCUPIED. Key cards should be issued to the guest.
              </div>
            )}
            {pending.target === 'CHECKED_OUT' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                ✓ Room {pending.reservation.roomNumber} will be flagged for housekeeping (CLEANING).
              </div>
            )}
            {pending.target === 'CANCELLED' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                ⚠ This will free the room from this reservation. Cannot be undone — but the booking history is preserved.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
