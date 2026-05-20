import { useState } from 'react';
import { Plus, Search, BedDouble, CalendarCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { reservationsApi } from '../../api/reservations';
import { roomsApi } from '../../api/rooms';
import { useEffectiveGuestId } from '../../hooks/useEffectiveGuestId';
import { formatDate, formatCurrency } from '../../utils/formatters';
import type { ReservationResponseDto } from '../../api/reservations';
import type { RoomResponseDto } from '../../api/rooms';

const ROOM_TYPE_COLORS: Record<string, string> = {
  SINGLE:  'bg-blue-50 text-blue-700',
  DOUBLE:  'bg-emerald-50 text-emerald-700',
  SUITE:   'bg-purple-50 text-purple-700',
  DELUXE:  'bg-amber-50 text-amber-700',
};

function nights(checkIn: string, checkOut: string) {
  return Math.max(1, Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
  ));
}

// ── Booking form ──────────────────────────────────────────────────────────────
function BookingForm({ guestId, onClose }: { guestId: string; onClose: () => void }) {
  const queryClient = useQueryClient();

  const [checkIn,  setCheckIn]  = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [special,  setSpecial]  = useState('');
  const [roomType, setRoomType] = useState<string>('');
  const [selected, setSelected] = useState<RoomResponseDto | null>(null);

  const { data: availableRooms = [], isLoading } = useQuery({
    queryKey: ['rooms', 'available'],
    queryFn: roomsApi.getAvailable,
  });

  const filtered = roomType
    ? availableRooms.filter((r) => r.type === roomType)
    : availableRooms;

  const roomTypes = [...new Set(availableRooms.map((r) => r.type))];

  const createMutation = useMutation({
    mutationFn: reservationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'guest', guestId] });
      onClose();
    },
  });

  const bookingErrorMsg = (() => {
    if (!createMutation.isError) return null;
    const err = createMutation.error as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message
      ?? 'Booking failed — please verify your dates and try again.';
  })();

  const stayNights = checkIn && checkOut ? nights(checkIn, checkOut) : 0;
  const total = selected && stayNights > 0 ? selected.ratePerNight * stayNights : 0;

  const today = new Date().toISOString().split('T')[0];

  const handleConfirm = () => {
    if (!selected || !checkIn || !checkOut || stayNights < 1) return;
    createMutation.mutate({
      guestId,
      roomId: selected.roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      specialRequests: special || undefined,
    });
  };

  return (
    <div className="space-y-5">
      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-In Date</label>
          <input type="date" value={checkIn} min={today}
            onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-Out Date</label>
          <input type="date" value={checkOut} min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/20" />
        </div>
      </div>

      {/* Room type filter */}
      {roomTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setRoomType('')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${roomType === '' ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              All
            </button>
            {roomTypes.map((t) => (
              <button key={t} onClick={() => setRoomType(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${roomType === t ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Room list */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Room <span className="text-gray-400 font-normal">({filtered.length} available)</span>
        </label>
        {isLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Loading rooms…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No available rooms{roomType ? ` of type ${roomType}` : ''}.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filtered.map((room) => (
              <div key={room.roomId} onClick={() => setSelected(room)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${selected?.roomId === room.roomId ? 'border-navy-700 bg-navy-50 ring-1 ring-navy-300' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BedDouble size={16} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Room {room.number}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROOM_TYPE_COLORS[room.type] ?? 'bg-gray-100 text-gray-600'}`}>{room.type}</span>
                        <span className="text-xs text-gray-500">Capacity {room.capacity}</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-navy-800">
                    {formatCurrency(room.ratePerNight)}<span className="text-xs font-normal text-gray-400">/night</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Special requests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Requests <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea value={special} onChange={(e) => setSpecial(e.target.value)} rows={2}
          placeholder="e.g. High floor, extra pillows, early check-in…"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/20 resize-none" />
      </div>

      {/* Summary */}
      {selected && stayNights > 0 && (
        <div className="p-4 bg-navy-50 rounded-xl border border-navy-100">
          <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-2">Booking Summary</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Room</span><span className="font-medium">{selected.number} — {selected.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Dates</span><span className="font-medium">{formatDate(checkIn)} → {formatDate(checkOut)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Nights</span><span className="font-medium">{stayNights}</span></div>
            <div className="flex justify-between border-t border-navy-100 pt-1 mt-1">
              <span className="font-semibold text-navy-900">Total</span>
              <span className="font-bold text-navy-900">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}

      {bookingErrorMsg && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {bookingErrorMsg}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} icon={<CalendarCheck size={15} />}
          disabled={!selected || stayNights < 1 || createMutation.isPending}>
          {createMutation.isPending ? 'Booking…' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Reservations() {
  const { effectiveGuestId, resolving, failed, error, retry } = useEffectiveGuestId();
  const queryClient = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [showBook, setShowBook] = useState(false);
  const [selected, setSelected] = useState<ReservationResponseDto | null>(null);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations', 'guest', effectiveGuestId],
    queryFn: () => reservationsApi.getByGuest(effectiveGuestId!),
    enabled: !!effectiveGuestId,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.updateStatus(id, 'CANCELLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'guest', effectiveGuestId] });
      setSelected(null);
    },
  });

  const filtered = reservations.filter((r) => {
    const q = search.toLowerCase();
    return (
      String(r.reservationId).toLowerCase().includes(q) ||
      r.roomNumber.includes(search) ||
      r.roomType.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  const canCancel = (status: string) => status === 'PENDING' || status === 'CONFIRMED';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reservations</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your bookings and stays</p>
        </div>
        <Button onClick={() => setShowBook(true)} icon={<Plus size={16} />}>Book a Room</Button>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'All',        filter: (_s: string) => true,                                color: 'bg-gray-50 text-gray-700 border-gray-200' },
          { label: 'Upcoming',   filter: (s: string) => s === 'CONFIRMED' || s === 'PENDING', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Active',     filter: (s: string) => s === 'CHECKED_IN',                   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Completed',  filter: (s: string) => s === 'CHECKED_OUT',                  color: 'bg-purple-50 text-purple-700 border-purple-200' },
        ].map(({ label, filter, color }) => (
          <div key={label} className={`rounded-xl border p-3 ${color}`}>
            <p className="text-xl font-bold">{reservations.filter((r) => filter(r.status)).length}</p>
            <p className="text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by room, type, or status…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 bg-white" />
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-center text-sm text-gray-400 py-10">Loading reservations…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 text-sm py-8">
            {search ? 'No reservations match your search.' : 'No reservations yet — book your first room!'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const n = nights(r.checkInDate, r.checkOutDate);
            return (
              <div key={r.reservationId} onClick={() => setSelected(r)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm shrink-0">
                    {r.roomNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{r.roomType} Room</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROOM_TYPE_COLORS[r.roomType] ?? 'bg-gray-100 text-gray-600'}`}>{r.roomType}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)} • {n} night{n !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(r.ratePerNight * n)}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(r.ratePerNight)}/night</p>
                  </div>
                  <Badge variant={statusBadge(r.status)}>{r.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book modal */}
      <Modal open={showBook} onClose={() => setShowBook(false)} title="Book a Room" size="lg">
        {effectiveGuestId ? (
          <BookingForm guestId={effectiveGuestId} onClose={() => setShowBook(false)} />
        ) : resolving ? (
          <div className="text-center py-10 space-y-2">
            <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400">Setting up your guest profile…</p>
          </div>
        ) : failed ? (
          <div className="text-center py-8 space-y-3 max-w-md mx-auto">
            <p className="text-sm text-rose-700 font-semibold">Could not set up your guest profile.</p>
            {error && (
              <p className="text-xs text-gray-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-left">
                {error}
              </p>
            )}
            <Button size="sm" variant="secondary" onClick={retry}>Try Again</Button>
          </div>
        ) : (
          <div className="text-center py-10 space-y-2">
            <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400">Loading…</p>
          </div>
        )}
      </Modal>

      {/* Detail modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)}
          title={`Reservation #${selected.reservationId}`} size="md"
          footer={
            <div className="flex justify-between w-full">
              {canCancel(selected.status) ? (
                <Button variant="danger" size="sm"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(String(selected.reservationId))}>
                  {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Reservation'}
                </Button>
              ) : <span />}
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </div>
          }>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Room',        `${selected.roomNumber} (${selected.roomType})`],
                ['Status',      selected.status.replace('_', ' ')],
                ['Check-In',    formatDate(selected.checkInDate)],
                ['Check-Out',   formatDate(selected.checkOutDate)],
                ['Nights',      String(nights(selected.checkInDate, selected.checkOutDate))],
                ['Rate',        `${formatCurrency(selected.ratePerNight)}/night`],
              ].map(([l, v]) => (
                <div key={String(l)}>
                  <p className="text-xs text-gray-500">{l}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {selected.specialRequests && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Special Requests</p>
                <p className="text-sm text-gray-700">{selected.specialRequests}</p>
              </div>
            )}
            <div className="p-4 bg-navy-50 rounded-xl border border-navy-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Total</span>
                <span className="font-bold text-navy-900">
                  {formatCurrency(selected.ratePerNight * nights(selected.checkInDate, selected.checkOutDate))}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
