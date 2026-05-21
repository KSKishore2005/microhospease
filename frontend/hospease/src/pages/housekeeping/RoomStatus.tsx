import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BedDouble, Wrench, Sparkles, Users } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import { roomsApi } from '../../api/rooms';
import { useRoomStatusStore, type RoomFlag } from '../../store/roomStatusStore';
import { cn } from '../../utils/cn';

// Frontend display states mapped from DB status + local flags
type DisplayStatus = 'DIRTY' | 'CLEANING' | 'CLEAN' | 'READY' | 'OCCUPIED';

const displayConfig: Record<DisplayStatus, { color: string; dot: string; label: string }> = {
  DIRTY:    { color: 'bg-rose-50 border-rose-200',     dot: 'bg-rose-500',    label: 'Dirty'    },
  CLEANING: { color: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-500',   label: 'Cleaning' },
  CLEAN:    { color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Clean'   },
  READY:    { color: 'bg-blue-50 border-blue-200',     dot: 'bg-blue-500',    label: 'Ready'    },
  OCCUPIED: { color: 'bg-gray-50 border-gray-200',     dot: 'bg-gray-400',    label: 'Occupied' },
};

const DISPLAY_OPTIONS: DisplayStatus[] = ['DIRTY', 'CLEANING', 'CLEAN', 'READY'];

export default function RoomStatus() {
  const [filter, setFilter] = useState<DisplayStatus | 'ALL'>('ALL');
  const queryClient = useQueryClient();
  const { roomFlags, setFlag, clearFlag, getFlag } = useRoomStatusStore();

  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: roomsApi.getAll });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => roomsApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  // Map a DB room + local flag to a display status
  const getDisplayStatus = (dbStatus: string, roomId: string): DisplayStatus => {
    if (dbStatus === 'OCCUPIED')    return 'OCCUPIED';
    if (dbStatus === 'MAINTENANCE') return 'DIRTY';
    if (dbStatus === 'CLEANING')    return 'CLEANING';
    if (dbStatus === 'AVAILABLE') {
      const flag = getFlag(roomId);
      if (flag === 'READY') return 'READY';
      if (flag === 'CLEAN') return 'CLEAN';
      return 'CLEAN'; // default for available
    }
    return 'DIRTY';
  };

  // Transition a room to a new display status
  const transition = async (roomId: string, to: DisplayStatus) => {
    if (to === 'DIRTY') {
      clearFlag(roomId);
      await roomsApi.updateStatus(roomId, 'MAINTENANCE');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } else if (to === 'CLEANING') {
      // Backend doesn't allow MAINTENANCE → CLEANING directly; sequence via AVAILABLE
      clearFlag(roomId);
      await roomsApi.updateStatus(roomId, 'AVAILABLE');
      await roomsApi.updateStatus(roomId, 'CLEANING');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } else if (to === 'CLEAN') {
      setFlag(roomId, 'CLEAN');
      await roomsApi.updateStatus(roomId, 'AVAILABLE');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    } else if (to === 'READY') {
      setFlag(roomId, 'READY');
      await roomsApi.updateStatus(roomId, 'AVAILABLE');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    }
  };

  const displayRooms = rooms.map((r) => ({
    ...r,
    displayStatus: getDisplayStatus(r.status, r.roomId),
  }));

  const filtered = filter === 'ALL' ? displayRooms : displayRooms.filter((r) => r.displayStatus === filter);

  const counts: Record<DisplayStatus, number> = {
    DIRTY:    displayRooms.filter((r) => r.displayStatus === 'DIRTY').length,
    CLEANING: displayRooms.filter((r) => r.displayStatus === 'CLEANING').length,
    CLEAN:    displayRooms.filter((r) => r.displayStatus === 'CLEAN').length,
    READY:    displayRooms.filter((r) => r.displayStatus === 'READY').length,
    OCCUPIED: displayRooms.filter((r) => r.displayStatus === 'OCCUPIED').length,
  };

  const stats = [
    { label: 'Dirty',    value: counts.DIRTY,    icon: <Wrench size={18} />,    bg: 'from-rose-500 to-rose-600'     },
    { label: 'Cleaning', value: counts.CLEANING,  icon: <Sparkles size={18} />, bg: 'from-amber-500 to-amber-600'   },
    { label: 'Clean',    value: counts.CLEAN,     icon: <BedDouble size={18} />, bg: 'from-emerald-500 to-teal-600' },
    { label: 'Ready',    value: counts.READY,     icon: <BedDouble size={18} />, bg: 'from-blue-500 to-blue-700'    },
    { label: 'Occupied', value: counts.OCCUPIED,  icon: <Users size={18} />,    bg: 'from-gray-400 to-gray-500'     },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Room Status Board</h1>
        <p className="text-sm text-gray-400 mt-0.5">Update and track room cleaning status in real-time</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-200">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
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
      <div className="flex p-1 bg-gray-100 rounded-xl w-fit gap-1 flex-wrap">
        <button onClick={() => setFilter('ALL')}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === 'ALL' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          All Rooms <span className="ml-1 text-xs text-gray-400">({rooms.length})</span>
        </button>
        {(['DIRTY', 'CLEANING', 'CLEAN', 'READY', 'OCCUPIED'] as DisplayStatus[]).map((s) => {
          const cfg = displayConfig[s];
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === s ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {cfg.label} <span className="ml-1 text-xs text-gray-400">({counts[s] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((room) => {
          const cfg = displayConfig[room.displayStatus];
          const options = DISPLAY_OPTIONS.filter((s) => s !== room.displayStatus);
          return (
            <div key={room.roomId} className={`rounded-2xl border-2 p-4 transition-all hover:shadow-md ${cfg.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xl text-gray-900">{room.number}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ring-4 ring-current/20`} />
              </div>
              <p className="text-xs text-gray-500 mb-2">{room.type}</p>
              <Badge variant={statusBadge(room.displayStatus === 'DIRTY' ? 'danger' : room.displayStatus === 'CLEANING' ? 'warning' : 'success')} className="text-xs mb-3">
                {cfg.label}
              </Badge>

              {room.displayStatus !== 'OCCUPIED' && (
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {options.map((s) => {
                    const sCfg = displayConfig[s];
                    return (
                      <button key={s} onClick={() => transition(room.roomId, s)}
                        disabled={updateStatusMutation.isPending}
                        className={cn('px-1.5 py-1 rounded-lg text-xs font-medium transition-all border disabled:opacity-50 hover:opacity-80', sCfg.color)}>
                        {sCfg.label}
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
