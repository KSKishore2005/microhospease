import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BedDouble, Wrench, Sparkles, Users } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import { roomsApi } from '../../api/rooms';
import { cn } from '../../utils/cn';

type RoomStatusType = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING';

const STATUS_OPTIONS: RoomStatusType[] = ['AVAILABLE', 'CLEANING', 'MAINTENANCE'];

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  AVAILABLE:   { color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Available' },
  CLEANING:    { color: 'bg-amber-50 border-amber-200',     dot: 'bg-amber-500',   label: 'Cleaning'  },
  MAINTENANCE: { color: 'bg-rose-50 border-rose-200',       dot: 'bg-rose-500',    label: 'Maintenance' },
  OCCUPIED:    { color: 'bg-blue-50 border-blue-200',       dot: 'bg-blue-500',    label: 'Occupied'  },
};

const allStatuses: RoomStatusType[] = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING'];

export default function RoomStatus() {
  const [statusFilter, setStatusFilter] = useState<RoomStatusType | 'ALL'>('ALL');

  const queryClient = useQueryClient();

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => roomsApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const filtered = rooms.filter((r) =>
    statusFilter === 'ALL' || r.status === statusFilter,
  );

  const updateStatus = (id: string, status: string) => {
    if (status === 'OCCUPIED') return;
    updateStatusMutation.mutate({ id, status });
  };

  const counts = {
    AVAILABLE:   rooms.filter((r) => r.status === 'AVAILABLE').length,
    OCCUPIED:    rooms.filter((r) => r.status === 'OCCUPIED').length,
    CLEANING:    rooms.filter((r) => r.status === 'CLEANING').length,
    MAINTENANCE: rooms.filter((r) => r.status === 'MAINTENANCE').length,
  };

  const stats = [
    { label: 'Available',    value: counts.AVAILABLE,   icon: <BedDouble size={18} />,  bg: 'from-emerald-500 to-teal-600'  },
    { label: 'Occupied',     value: counts.OCCUPIED,    icon: <Users size={18} />,      bg: 'from-blue-500 to-blue-700'     },
    { label: 'Cleaning',     value: counts.CLEANING,    icon: <Sparkles size={18} />,   bg: 'from-amber-500 to-amber-600'   },
    { label: 'Maintenance',  value: counts.MAINTENANCE, icon: <Wrench size={18} />,     bg: 'from-rose-500 to-rose-600'     },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Room Status Board</h1>
        <p className="text-sm text-gray-400 mt-0.5">Update and track room cleaning status in real-time</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-200"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-fit gap-1">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${statusFilter === 'ALL' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All Rooms
          <span className={`ml-1.5 text-xs ${statusFilter === 'ALL' ? 'text-navy-500' : 'text-gray-400'}`}>({rooms.length})</span>
        </button>
        {allStatuses.map((s) => {
          const cfg = statusConfig[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${statusFilter === s ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {cfg?.label ?? s}
              <span className={`ml-1.5 text-xs ${statusFilter === s ? 'text-navy-500' : 'text-gray-400'}`}>
                ({counts[s] ?? 0})
              </span>
            </button>
          );
        })}
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((room) => {
          const cfg = statusConfig[room.status] ?? { color: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400', label: room.status };
          return (
            <div key={room.roomId} className={`rounded-2xl border-2 p-4 transition-all hover:shadow-md ${cfg.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xl text-gray-900">{room.number}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ring-4 ring-current/20`} />
              </div>
              <p className="text-xs text-gray-500 mb-2">{room.type}</p>
              <Badge variant={statusBadge(room.status)} className="text-xs mb-3">{cfg.label}</Badge>

              {room.status !== 'OCCUPIED' && (
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {STATUS_OPTIONS.filter((s) => s !== room.status).map((s) => {
                    const sCfg = statusConfig[s];
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(room.roomId, s)}
                        disabled={updateStatusMutation.isPending}
                        className={cn(
                          'px-1.5 py-1 rounded-lg text-xs font-medium transition-all border disabled:opacity-50',
                          sCfg?.color ?? 'bg-gray-50 border-gray-200',
                          'hover:opacity-80',
                        )}
                      >
                        {sCfg?.label ?? s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16">
            <BedDouble size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 font-medium">No rooms match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
