import { useState } from 'react';
import { CheckCircle, Play, SkipForward, ClipboardList, Loader2, Clock, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { housekeepingApi } from '../../api/housekeeping';
import { roomsApi } from '../../api/rooms';
import { useAuthStore } from '../../store/authStore';
import { formatRelative } from '../../utils/formatters';

type StatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type ScopeFilter  = 'MINE' | 'ALL';

const statusConfig = {
  PENDING:     { label: 'Pending',     color: 'bg-amber-50 border-amber-200 text-amber-700',   icon: <Clock size={14} className="text-amber-500" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50 border-blue-200 text-blue-700',       icon: <Loader2 size={14} className="text-blue-500" /> },
  COMPLETED:   { label: 'Completed',   color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <CheckCircle size={14} className="text-emerald-500" /> },
} as const;

export default function TaskList() {
  const { user } = useAuthStore();
  const userId = user?.id;

  // Managers/Admins want to see everything; line staff default to their own queue.
  const isManagerView = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const [scope, setScope]   = useState<ScopeFilter>(isManagerView ? 'ALL' : 'MINE');
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const queryClient = useQueryClient();

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['housekeeping'],
    queryFn: housekeepingApi.getAll,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const roomNumberMap = Object.fromEntries(rooms.map((r) => [r.roomId, r.number]));

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => housekeepingApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['housekeeping'] }),
  });

  // First filter by scope (mine vs all), then by status.
  const scoped = scope === 'MINE' && userId
    ? allTasks.filter((t) => String(t.assignedToUserId) === String(userId))
    : allTasks;

  const filtered = scoped.filter((t) => filter === 'ALL' || t.status === filter);

  const completedCount = scoped.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = scoped.filter((t) => t.status === 'IN_PROGRESS').length;
  const pendingCount = scoped.filter((t) => t.status === 'PENDING').length;
  const progressPct = scoped.length > 0 ? Math.round((completedCount / scoped.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {scope === 'MINE' ? 'My Tasks' : 'All Tasks'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {scope === 'MINE'
              ? 'Rooms assigned to you for today'
              : 'Daily room cleaning assignments — team view'}
          </p>
        </div>

        {/* Scope toggle (only managers see "ALL") */}
        {isManagerView && (
          <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
            {(['MINE', 'ALL'] as ScopeFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  scope === s ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s === 'MINE' ? <><ClipboardList size={14} /> Mine</> : <><Users size={14} /> Team</>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress card */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-navy-300 text-sm font-medium">
              {scope === 'MINE' ? "Today's Progress" : "Team Progress"}
            </p>
            <p className="text-4xl font-bold mt-1">{progressPct}<span className="text-2xl text-navy-300">%</span></p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Pending',     count: pendingCount,    bg: 'bg-amber-500/20  border-amber-400/30' },
              { label: 'In Progress', count: inProgressCount, bg: 'bg-blue-500/20   border-blue-400/30' },
              { label: 'Completed',   count: completedCount,  bg: 'bg-emerald-500/20 border-emerald-400/30' },
            ].map((s) => (
              <div key={s.label} className={`text-center px-4 py-2 rounded-xl border ${s.bg}`}>
                <p className="text-xl font-bold">{s.count}</p>
                <p className="text-xs text-navy-300 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-navy-300 mt-2">{completedCount} of {scoped.length} tasks completed</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === s ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-center text-sm text-gray-400 py-10">Loading tasks…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-400">
              {scope === 'MINE'
                ? 'No tasks assigned to you'
                : 'No tasks found'}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {scope === 'MINE'
                ? 'Your manager will assign tasks here when they create them.'
                : (filter !== 'ALL' ? `No ${filter.replace('_', ' ').toLowerCase()} tasks` : 'All tasks are complete!')}
            </p>
          </div>
        ) : (
          filtered.map((task) => {
            const cfg = statusConfig[task.status as keyof typeof statusConfig];
            const isCompleted = task.status === 'COMPLETED';
            return (
              <div
                key={task.taskId}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-wrap items-center justify-between gap-4 transition-all ${
                  isCompleted ? 'opacity-60 border-gray-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border-2 ${cfg?.color ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {roomNumberMap[task.roomId] ?? String(task.roomId).slice(-3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">Room {roomNumberMap[task.roomId] ?? task.roomId}</p>
                      <Badge variant={statusBadge(task.status)} dot>{task.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.assignedToUserId
                        ? (String(task.assignedToUserId) === String(userId)
                            ? `Assigned to you`
                            : `Assigned to user #${task.assignedToUserId}`)
                        : 'Unassigned'}
                      {task.scheduledAt && ` · Scheduled: ${formatRelative(task.scheduledAt)}`}
                    </p>
                    {task.completedAt && (
                      <p className="text-xs text-emerald-600 mt-0.5">✓ Completed {formatRelative(task.completedAt)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {task.status === 'PENDING' && (
                    <Button size="sm" variant="secondary" icon={<Play size={13} />}
                      onClick={() => updateStatusMutation.mutate({ id: task.taskId, status: 'IN_PROGRESS' })}>
                      Start
                    </Button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <>
                      <Button size="sm" variant="primary" icon={<CheckCircle size={13} />}
                        onClick={() => updateStatusMutation.mutate({ id: task.taskId, status: 'COMPLETED' })}>
                        Done
                      </Button>
                      <Button size="sm" variant="ghost" icon={<SkipForward size={13} />}
                        onClick={() => updateStatusMutation.mutate({ id: task.taskId, status: 'CANCELLED' })}>
                        Skip
                      </Button>
                    </>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                      <CheckCircle size={15} /> Done
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
