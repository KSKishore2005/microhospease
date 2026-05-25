import { useState } from 'react';
import { ArrowDown, ArrowUp, Search, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { reservationsApi } from '../../api/reservations';
import type { ReservationResponseDto } from '../../api/reservations';
import { formatDate, formatCurrency } from '../../utils/formatters';

type Mode = 'CHECKIN' | 'CHECKOUT';

export default function CheckInOut() {
  const [mode, setMode] = useState<Mode>('CHECKIN');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ReservationResponseDto | null>(null);
  const [done, setDone] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: reservationsApi.getAll,
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.updateStatus(id, 'CHECKED_IN'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.updateStatus(id, 'CHECKED_OUT'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  const arrivals = reservations.filter((r) => r.status === 'CONFIRMED');
  const departures = reservations.filter((r) => r.status === 'CHECKED_IN');
  const list = mode === 'CHECKIN' ? arrivals : departures;

  const filtered = list.filter((r) =>
    r.guestName.toLowerCase().includes(search.toLowerCase()) ||
    String(r.reservationId).toLowerCase().includes(search.toLowerCase()) ||
    r.roomNumber.includes(search)
  );

  const handleAction = () => {
    if (!selected) return;
    if (mode === 'CHECKIN') {
      checkInMutation.mutate(selected.reservationId, {
        onSuccess: () => {
          setDone((prev) => [...prev, selected.reservationId]);
          setSelected(null);
        },
      });
    } else {
      checkOutMutation.mutate(selected.reservationId, {
        onSuccess: () => {
          setDone((prev) => [...prev, selected.reservationId]);
          setSelected(null);
        },
      });
    }
  };

  const nights = (r: ReservationResponseDto) =>
    Math.max(1, Math.ceil((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / 86400000));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check In / Check Out</h1>
        <p className="text-sm text-gray-400 mt-0.5">Process guest arrivals and departures</p>
      </div>

      {/* Mode toggle */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
        {(['CHECKIN', 'CHECKOUT'] as Mode[]).map((m) => (
          <button key={m} onClick={() => { setMode(m); setSearch(''); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {m === 'CHECKIN' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
            {m === 'CHECKIN' ? 'Check In' : 'Check Out'}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${mode === m ? 'bg-navy-100 text-navy-700' : 'bg-gray-200 text-gray-500'}`}>
              {m === 'CHECKIN' ? arrivals.length : departures.length}
            </span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${mode === 'CHECKIN' ? 'arriving' : 'departing'} guests...`}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-900/20 bg-white" />
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isDone = done.includes(r.reservationId);
          return (
            <div key={r.reservationId} className={`bg-white rounded-xl border shadow-sm p-5 flex flex-wrap items-center justify-between gap-4 transition-all ${isDone ? 'opacity-50 border-gray-100' : 'border-gray-100 hover:shadow-md'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${mode === 'CHECKIN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {r.roomNumber}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{r.guestName}</p>
                  <p className="text-xs text-gray-500">{r.reservationId} • {r.roomType}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {mode === 'CHECKIN' ? `Arrives ${formatDate(r.checkInDate)}` : `Departing ${formatDate(r.checkOutDate)}`} • {nights(r)}N
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isDone ? (
                  <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                    <CheckCircle size={16} /> {mode === 'CHECKIN' ? 'Checked In' : 'Checked Out'}
                  </div>
                ) : (
                  <>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(r.ratePerNight * nights(r))}</p>
                    </div>
                    <Button size="sm" variant={mode === 'CHECKIN' ? 'primary' : 'danger'} onClick={() => setSelected(r)}>
                      {mode === 'CHECKIN' ? 'Check In' : 'Check Out'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No {mode === 'CHECKIN' ? 'arrivals' : 'departures'} found.</p>
          </div>
        )}
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)}
          title={mode === 'CHECKIN' ? `Check In – ${selected.guestName}` : `Check Out – ${selected.guestName}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
              <Button variant={mode === 'CHECKIN' ? 'primary' : 'gold'} onClick={handleAction}
                disabled={checkInMutation.isPending || checkOutMutation.isPending}>
                Confirm {mode === 'CHECKIN' ? 'Check In' : 'Check Out'}
              </Button>
            </>
          }>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Room', `${selected.roomNumber} (${selected.roomType})`],
                ['Reservation ID', selected.reservationId],
                ['Check-In', formatDate(selected.checkInDate)],
                ['Check-Out', formatDate(selected.checkOutDate)],
              ].map(([l, v]) => (
                <div key={String(l)}><p className="text-gray-500 text-xs">{l}</p><p className="font-medium text-gray-900">{v}</p></div>
              ))}
            </div>
            {selected.specialRequests && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 mb-1">Special Requests</p>
                <p className="text-sm text-amber-700">{selected.specialRequests}</p>
              </div>
            )}
            <div className="p-4 bg-navy-50 rounded-xl">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-bold text-navy-900">{formatCurrency(selected.ratePerNight * nights(selected))}</span>
              </div>
            </div>
            {mode === 'CHECKIN' && (
              <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                ✓ Key cards to be issued for Room {selected.roomNumber}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
