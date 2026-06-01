import { useState, useMemo } from 'react';
import { CheckCircle, Play, SkipForward, ClipboardList, Loader2, Clock, Users, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../utils/statusBadge';
import Button from '../../components/common/Button';
import { housekeepingApi } from '../../api/housekeeping';
import { roomsApi } from '../../api/rooms';
import { usersApi } from '../../api/users';
import { serviceOrdersApi, type ServiceOrderResponseDto } from '../../api/serviceOrders';
import { useAuthStore } from '../../store/authStore';
import { useRoomStatusStore } from '../../store/roomStatusStore';
import { useToastStore } from '../../store/toastStore';
import { formatRelative } from '../../utils/formatters';

/** Pull a useful error message off an Axios error so failures surface in a
 *  toast instead of being swallowed. */
function errMessage(e: unknown, fallback: string): string {
  const ax = e as { response?: { status?: number; data?: { message?: string } }; message?: string };
  const status = ax?.response?.status;
  const msg = ax?.response?.data?.message;
  if (status === 403) return `Forbidden: your role can't perform this action. (${msg ?? 'no detail'})`;
  if (status === 400) return msg ?? 'Bad request.';
  if (status === 404) return 'Not found — the task may have been removed.';
  if (status === 401) return 'Your session expired. Sign in again.';
  return msg ?? ax?.message ?? fallback;
}

type StatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type ScopeFilter  = 'MINE' | 'ALL';

const statusConfig = {
  PENDING:     { label: 'Pending',     color: 'bg-amber-50 border-amber-200 text-amber-700',   icon: <Clock size={14} className="text-amber-500" /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50 border-blue-200 text-blue-700',       icon: <Loader2 size={14} className="text-blue-500" /> },
  COMPLETED:   { label: 'Completed',   color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <CheckCircle size={14} className="text-emerald-500" /> },
} as const;

/**
 * A unified view-model so we can render both raw HousekeepingTask records and
 * ServiceOrder records assigned to a housekeeper in one list. Without this,
 * service-orders the Manager dispatches via the assign-staff dropdown
 * (which writes service_orders.assigned_to_user_id, NOT a row in
 * housekeeping_tasks) would never appear in the housekeeper's Task List.
 */
type DisplayTask = {
  source: 'HK' | 'SO';
  id: string;
  roomId: string | number | undefined;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | string;
  rawStatus: string;        // for service orders this can be CONFIRMED
  assignedToUserId?: string;
  scheduledAt?: string;
  completedAt?: string;
  // service-order extras
  description?: string;
  serviceType?: string;
};

/** Status mapping for service orders: CONFIRMED ("Ready") is treated like
 * IN_PROGRESS in the housekeeping list so the housekeeper sees a 3-step
 * lifecycle: Pending → In Progress → Completed. The Complete button chains
 * the necessary state-machine transitions internally (IN_PROGRESS → CONFIRMED
 * → COMPLETED) to satisfy the backend state machine. */
function soDisplayStatus(s: string): string {
  if (s === 'CONFIRMED') return 'IN_PROGRESS';
  return s;
}

export default function TaskList() {
  const { user } = useAuthStore();
  const userId = user?.id;

  // Managers/Admins want to see everything; line staff default to their own queue.
  const isManagerView = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const [scope, setScope]   = useState<ScopeFilter>(isManagerView ? 'ALL' : 'MINE');
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const queryClient = useQueryClient();
  const { setFlag } = useRoomStatusStore();
  const addToast = useToastStore((s) => s.addToast);

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['housekeeping'],
    queryFn: housekeepingApi.getAll,
  });

  // Service orders assigned to this user (the second source the original page
  // missed). For housekeeping role we always query; for manager view we query
  // when needed for the team view as well.
  const { data: assignedOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['service-orders', 'assignee', userId],
    queryFn: () => serviceOrdersApi.getByAssignee(userId!),
    enabled: !!userId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    enabled: isManagerView,
  });

  const userMap = useMemo(() => new Map(users.map((u) => [String(u.userId), u.name])), [users]);

  const housekeepingStaff = useMemo(
    () => users.filter((u) => u.role === 'HOUSEKEEPING_STAFF'),
    [users]
  );

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: roomsApi.getAll,
  });

  const roomNumberMap = Object.fromEntries(rooms.map((r) => [r.roomId, r.number]));

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => housekeepingApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['housekeeping'] }),
  });

  /** Service-order mutation. Used for advancing through the kanban states.
   * The backend state machine enforces PENDING → IN_PROGRESS → CONFIRMED →
   * COMPLETED, so completing from IN_PROGRESS requires two API calls in
   * sequence — chained inside completeServiceOrder() below. Errors surface
   * in a toast so the button never feels like a no-op. */
  const completeServiceOrder = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'IN_PROGRESS') {
        await serviceOrdersApi.updateStatus(id, 'CONFIRMED');
        await serviceOrdersApi.updateStatus(id, 'COMPLETED');
      } else if (currentStatus === 'CONFIRMED') {
        await serviceOrdersApi.updateStatus(id, 'COMPLETED');
      } else if (currentStatus === 'PENDING') {
        // Defensive: if user clicks Complete on a PENDING task, walk through
        // all 3 transitions. Backend rejects any illegal step with 400, which
        // surfaces in the toast.
        await serviceOrdersApi.updateStatus(id, 'IN_PROGRESS');
        await serviceOrdersApi.updateStatus(id, 'CONFIRMED');
        await serviceOrdersApi.updateStatus(id, 'COMPLETED');
      }
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'assignee', userId] });
      addToast('Task marked complete', 'success');
    } catch (e) {
      console.error('Failed to complete service order', id, e);
      addToast(errMessage(e, 'Failed to complete task. Please try again.'), 'error');
    }
  };

  const startServiceOrder = async (id: string) => {
    try {
      await serviceOrdersApi.updateStatus(id, 'IN_PROGRESS');
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'assignee', userId] });
      addToast('Task started', 'success');
    } catch (e) {
      console.error('Failed to start service order', id, e);
      addToast(errMessage(e, 'Failed to start task. Please try again.'), 'error');
    }
  };

  // Merge housekeeping_tasks + service_orders into a single unified list. This
  // is the entire fix: the original page only saw HK tasks, so anything the
  // Manager assigned through the service-orders flow was invisible here.
  const unifiedTasks: DisplayTask[] = useMemo(() => {
    const hk: DisplayTask[] = allTasks.map((t) => ({
      source: 'HK',
      id: t.taskId,
      roomId: t.roomId,
      status: t.status,
      rawStatus: t.status,
      assignedToUserId: t.assignedToUserId ? String(t.assignedToUserId) : undefined,
      scheduledAt: t.scheduledAt,
      completedAt: t.completedAt,
    }));
    const so: DisplayTask[] = (assignedOrders as ServiceOrderResponseDto[]).map((o) => ({
      source: 'SO',
      id: String(o.orderId),
      roomId: o.roomId,
      status: soDisplayStatus(o.status),
      rawStatus: o.status,
      assignedToUserId: o.assignedToUserId ? String(o.assignedToUserId) : undefined,
      scheduledAt: o.createdAt,
      description: o.description,
      serviceType: o.serviceType,
    }));
    return [...hk, ...so];
  }, [allTasks, assignedOrders]);

  // First filter by scope (mine vs all), then by status.
  // STRICT FILTERING: Housekeeping role can ONLY see their assigned tasks.
  const scoped = user?.role === 'HOUSEKEEPING'
    ? unifiedTasks.filter((t) => String(t.assignedToUserId) === String(userId))
    : (scope === 'MINE' && userId
        ? unifiedTasks.filter((t) => String(t.assignedToUserId) === String(userId))
        : unifiedTasks);

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
        {(isLoading || ordersLoading) ? (
          <p className="text-center text-sm text-gray-400 py-10">Loading tasks…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-400">
              No assigned housekeeping tasks
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {scope === 'MINE' || !isManagerView
                ? 'Your manager will assign tasks here when they create them.'
                : (filter !== 'ALL' ? `No ${filter.replace('_', ' ').toLowerCase()} tasks` : 'All tasks are complete!')}
            </p>
          </div>
        ) : (
          filtered.map((task) => {
            const cfg = statusConfig[task.status as keyof typeof statusConfig];
            const isCompleted = task.status === 'COMPLETED';
            const isServiceOrder = task.source === 'SO';
            const roomLabel = task.roomId !== undefined
              ? (roomNumberMap[task.roomId as string] ?? String(task.roomId).slice(-3))
              : '—';

            return (
              <div
                key={`${task.source}-${task.id}`}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-wrap items-center justify-between gap-4 transition-all ${
                  isCompleted ? 'opacity-60 border-gray-100' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border-2 ${cfg?.color ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {roomLabel}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">Room {roomLabel}</p>
                      <Badge variant={statusBadge(task.status)} dot>{task.status.replace('_', ' ')}</Badge>
                      {isServiceOrder && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          <Sparkles size={10} /> {task.serviceType?.replace(/_/g, ' ') ?? 'Service Request'}
                        </span>
                      )}
                    </div>
                    {/* Service-order description (guest request text), shown only for SO rows */}
                    {isServiceOrder && task.description && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{task.description}"</p>
                    )}
                    {isManagerView && task.source === 'HK' ? (
                      <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-gray-400">Assigned to:</span>
                        <select
                          value={task.assignedToUserId ?? ''}
                          className="select py-0.5 px-1.5 text-xs bg-white border-gray-200"
                          onChange={async (e) => {
                            const newStaffId = e.target.value;
                            await housekeepingApi.update(task.id, { assignedToUserId: newStaffId || undefined });
                            queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
                          }}
                        >
                          <option value="">Unassigned</option>
                          {housekeepingStaff.map((staff) => (
                            <option key={staff.userId} value={staff.userId}>
                              {staff.name}
                            </option>
                          ))}
                        </select>
                        {task.scheduledAt && <span className="text-xs text-gray-400">· Scheduled: {formatRelative(task.scheduledAt)}</span>}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {task.assignedToUserId
                          ? (String(task.assignedToUserId) === String(userId)
                              ? `Assigned to you`
                              : `Assigned to ${userMap.get(String(task.assignedToUserId)) || `User #${task.assignedToUserId}`}`)
                          : 'Unassigned'}
                        {task.scheduledAt && ` · Submitted ${formatRelative(task.scheduledAt)}`}
                      </p>
                    )}
                    {task.completedAt && (
                      <p className="text-xs text-emerald-600 mt-0.5">✓ Completed {formatRelative(task.completedAt)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {task.status === 'PENDING' && (
                    <Button size="sm" variant="secondary" icon={<Play size={13} />}
                      onClick={() => isServiceOrder
                        ? startServiceOrder(task.id)
                        : updateStatusMutation.mutate({ id: task.id, status: 'IN_PROGRESS' })}>
                      Start
                    </Button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <>
                      <Button size="sm" variant="primary" icon={<CheckCircle size={13} />}
                        onClick={() => {
                          if (isServiceOrder) {
                            completeServiceOrder(task.id, task.rawStatus);
                          } else {
                            updateStatusMutation.mutate({ id: task.id, status: 'COMPLETED' });
                            if (task.roomId !== undefined) setFlag(String(task.roomId), 'CLEAN');
                          }
                        }}>
                        Done
                      </Button>
                      {/* Skip only valid for housekeeping_tasks; service orders use Cancel via service-order flow */}
                      {!isServiceOrder && (
                        <Button size="sm" variant="ghost" icon={<SkipForward size={13} />}
                          onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'CANCELLED' })}>
                          Skip
                        </Button>
                      )}
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
