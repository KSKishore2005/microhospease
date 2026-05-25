import { ClipboardList, CheckCircle2, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../utils/statusBadge';
import { housekeepingApi } from '../../api/housekeeping';
import { roomsApi } from '../../api/rooms';
import { usersApi } from '../../api/users';
import { useAuthStore } from '../../store/authStore';
import { formatRelative } from '../../utils/formatters';
import { useMemo } from 'react';
import { useRoomStatusStore } from '../../store/roomStatusStore';

export default function HousekeepingDashboard() {
  const { user } = useAuthStore();
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({ queryKey: ['housekeeping'], queryFn: housekeepingApi.getAll });
  const { data: rooms = [], isLoading: roomsLoading }  = useQuery({ queryKey: ['rooms'],                     queryFn: roomsApi.getAll });
  const { data: users = [], isLoading: usersLoading }  = useQuery({ queryKey: ['users'],                     queryFn: usersApi.getAll });
  const { roomFlags } = useRoomStatusStore();

  const userMap = useMemo(() => new Map(users.map((u) => [String(u.userId), u.name])), [users]);

  // Strict role-based filtering
  const tasks = useMemo(() => {
    if (user?.role === 'HOUSEKEEPING') {
      return allTasks.filter((t) => String(t.assignedToUserId) === String(user.id));
    }
    return allTasks;
  }, [allTasks, user]);

  const roomMap = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.roomId, r.number])),
    [rooms]
  );

  const roomsReady = useMemo(() => {
    return rooms.filter((r) => {
      if (r.status === 'AVAILABLE') {
        const flag = roomFlags[r.roomId];
        return flag === 'CLEAN' || flag === 'READY' || !flag;
      }
      return false;
    }).length;
  }, [rooms, roomFlags]);

  const activeRoomsToClean = useMemo(() => {
    const list = rooms
      .map((r) => {
        let displayStatus = 'CLEAN';
        if (r.status === 'OCCUPIED') displayStatus = 'OCCUPIED';
        else if (r.status === 'MAINTENANCE') displayStatus = 'DIRTY';
        else if (r.status === 'CLEANING') displayStatus = 'CLEANING';
        else if (r.status === 'AVAILABLE') {
          const flag = roomFlags[r.roomId];
          displayStatus = flag || 'CLEAN';
        }
        return { ...r, displayStatus };
      })
      .filter((r) => r.displayStatus === 'DIRTY' || r.displayStatus === 'CLEANING');

    const isHousekeeper = user?.role === 'HOUSEKEEPING';
    if (isHousekeeper) {
      const assignedRoomIds = new Set(tasks.map((t) => String(t.roomId)));
      return list.filter((r) => assignedRoomIds.has(String(r.roomId)));
    }
    return list;
  }, [rooms, roomFlags, user, tasks]);

  if (tasksLoading || roomsLoading || usersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-2 border-navy-200 border-t-navy-700 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const pending    = tasks.filter((t) => t.status === 'PENDING').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completed  = tasks.filter((t) => t.status === 'COMPLETED').length;

  const cleaningRooms     = rooms.filter((r) => r.status === 'CLEANING').length;
  const availableRooms    = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const maintenanceRooms  = rooms.filter((r) => r.status === 'MAINTENANCE').length;
  const occupiedRooms     = rooms.filter((r) => r.status === 'OCCUPIED').length;

  const total     = tasks.length;
  const progress  = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Housekeeping Console</h1>
          <p className="text-sm text-gray-400 mt-0.5">Daily operations and room management</p>
        </div>
        <Link to="/housekeeping/tasks"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-sm">
          <ClipboardList size={15} /> View All Tasks
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Pending Tasks"    value={pending}    icon={<ClipboardList size={20} />} color="amber"   className="animate-fade-in-up" />
        <StatCard title="In Progress"      value={inProgress} icon={<Clock size={20} />}         color="blue"    className="animate-fade-in-up" />
        <StatCard title="Completed Today"  value={completed}  icon={<CheckCircle2 size={20} />}  color="emerald" className="animate-fade-in-up" />
        <StatCard title="Rooms Ready"      value={roomsReady} icon={<Sparkles size={20} />}     color="emerald" className="animate-fade-in-up" />
      </div>

      {/* Progress + room status */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Daily progress */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Today's Progress</p>
              <p className="text-xs text-gray-400 mt-0.5">{completed} of {total} tasks complete</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-navy-900">{progress}%</p>
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-4 mt-4">
            {[
              { label: 'Pending',     count: pending,    color: 'text-amber-600' },
              { label: 'In Progress', count: inProgress, color: 'text-blue-600' },
              { label: 'Completed',   count: completed,  color: 'text-emerald-600' },
            ].map((s) => (
              <div key={s.label} className="text-center flex-1">
                <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Room status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Room Status Overview</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Available',   count: availableRooms,   icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
              { label: 'Occupied',    count: occupiedRooms,    icon: '🛏️', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100' },
              { label: 'Cleaning',    count: cleaningRooms,    icon: '🧹', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100' },
              { label: 'Maintenance', count: maintenanceRooms, icon: '🔧', bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-100' },
            ].map((item) => (
              <div key={item.label} className={`p-3.5 rounded-xl border ${item.bg} ${item.border} flex items-center gap-3`}>
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className={`text-xl font-bold ${item.text}`}>{item.count}</p>
                  <p className={`text-xs font-medium ${item.text} opacity-80`}>{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <Card title="Today's Tasks" icon={<ClipboardList size={16} />}
          action={<Link to="/housekeeping/tasks" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">View All <ArrowRight size={11} /></Link>}>
          <div className="space-y-3">
            {tasks.slice(0, 7).map((t) => {
              const staffName = t.assignedToUserId ? (userMap.get(String(t.assignedToUserId)) || `User #${t.assignedToUserId}`) : 'Unassigned';
              const isCompleted = t.status === 'COMPLETED';
              return (
                <div key={t.taskId} className="flex flex-col gap-1 p-3.5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-colors animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">Room {roomMap[t.roomId] ?? t.roomId}</p>
                    <Badge variant={statusBadge(t.status)} dot>{t.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1.5 text-xs text-gray-500">
                    <div>
                      <span className="font-medium text-gray-400">Cleaning Status: </span>
                      <span className={isCompleted ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {isCompleted ? 'Clean' : 'Cleaning Required'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400">Task Type: </span>
                      <span className="text-navy-900 font-medium">Room Cleaning</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400">Assigned Staff: </span>
                      <span className="text-navy-900 font-semibold">{staffName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-400">Timestamp: </span>
                      <span className="text-gray-950 font-medium">{t.scheduledAt ? formatRelative(t.scheduledAt) : '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && (
              <div className="text-center py-10">
                <Sparkles size={28} className="text-gray-200 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-gray-400 font-semibold">No assigned housekeeping tasks</p>
              </div>
            )}
          </div>
        </Card>

        {/* Rooms Needing Cleaning */}
        <Card title="Rooms to Clean" icon={<Sparkles size={16} />}
          action={<Link to="/housekeeping/room-status" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Room Status <ArrowRight size={11} /></Link>}>
          <div className="space-y-2">
            {activeRoomsToClean.slice(0, 7).map((r) => (
              <div key={r.roomId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-600">{r.number}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Room {r.number}</p>
                    <p className="text-xs text-gray-400">{r.type}</p>
                  </div>
                </div>
                <Badge variant={r.displayStatus === 'DIRTY' ? 'danger' : 'warning'}>
                  {r.displayStatus.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {activeRoomsToClean.length === 0 && (
              <div className="text-center py-10">
                <CheckCircle2 size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All rooms are clean and ready!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
