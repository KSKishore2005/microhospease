import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, InboxIcon, UserCheck } from 'lucide-react';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { useAuthStore } from '../../store/authStore';
import { useWorkflowStore } from '../../store/workflowStore';
import { useToastStore } from '../../store/toastStore';
import { formatRelative } from '../../utils/formatters';

type Status = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const COLUMNS: { status: Status; label: string; headerColor: string; cardBorder: string; emptyIcon: React.ReactNode }[] = [
  { status: 'CONFIRMED',   label: 'Accepted',    headerColor: 'bg-blue-50 border-blue-200 text-blue-800',     cardBorder: 'border-blue-100',    emptyIcon: <InboxIcon size={28} className="text-blue-200" /> },
  { status: 'IN_PROGRESS', label: 'In Progress', headerColor: 'bg-amber-50 border-amber-200 text-amber-800',  cardBorder: 'border-amber-100',   emptyIcon: <Loader2 size={28} className="text-amber-200" /> },
  { status: 'COMPLETED',   label: 'Completed',   headerColor: 'bg-emerald-50 border-emerald-200 text-emerald-800', cardBorder: 'border-emerald-100', emptyIcon: <CheckCircle2 size={28} className="text-emerald-200" /> },
];

const typeEmoji: Record<string, string> = {
  ROOM_SERVICE: '🍽️', HOUSEKEEPING: '🧹', MAINTENANCE: '🔧', CONCIERGE: '🔑',
  SPA: '💆', LAUNDRY: '👕', GYM: '🏋️', TRANSPORT: '🚗', RESTAURANT: '🍴', OTHER: '📋',
};

export default function ServiceFulfillment() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { customStatuses, setStatus, getStatus } = useWorkflowStore();
  const addToast = useToastStore((s) => s.addToast);
  const userId = user?.id;

  // My assigned orders
  const { data: myOrders = [] } = useQuery({
    queryKey: ['service-orders', 'assignee', userId],
    queryFn: () => serviceOrdersApi.getByAssignee(userId!),
    enabled: !!userId,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => serviceOrdersApi.accept(id, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'assignee', userId] });
      addToast('Task started — marked as In Progress', 'success');
    },
  });

  const mine = myOrders.filter((o) => o.status !== 'CANCELLED');

  const statItems = [
    { label: 'My Active',         value: mine.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'CONFIRMED').length, icon: <Loader2 size={18} />,      bg: 'from-amber-500 to-amber-600' },
    { label: 'My Completed',      value: mine.filter((o) => o.status === 'COMPLETED').length,                               icon: <CheckCircle2 size={18} />, bg: 'from-emerald-500 to-teal-600' },
    { label: 'Awaiting Verify',   value: Object.values(customStatuses).filter(s => s.status === 'STAFF_COMPLETED').length, icon: <UserCheck size={18} />,     bg: 'from-blue-500 to-blue-700' },
    { label: 'My Total',          value: mine.length,                                                                       icon: <UserCheck size={18} />,     bg: 'from-navy-600 to-navy-800' },
  ];

  if (!userId) {
    return <div className="text-center py-16 text-sm text-gray-400">Loading your profile…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Fulfillment</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your active assignments — tasks assigned by the Manager</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {statItems.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-200">
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

      {/* Kanban — MY ORDERS only (queue is hidden for staff) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {COLUMNS.map(({ status, label, headerColor, cardBorder, emptyIcon }) => {
          // Items explicitly assigned to me that match DB status
          const colItems = mine.filter((r) => {
            const isStaffCompleted = getStatus(r.orderId)?.status === 'STAFF_COMPLETED';
            // STAFF_COMPLETED items remain in IN_PROGRESS on DB but show in Completed col
            if (status === 'COMPLETED') {
              return r.status === 'COMPLETED' || isStaffCompleted;
            }
            if (status === 'IN_PROGRESS') {
              return r.status === 'IN_PROGRESS' && !isStaffCompleted;
            }
            return r.status === status;
          });

          return (
            <div key={status} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`flex items-center justify-between px-4 py-3 border-b ${headerColor}`}>
                <h3 className="font-semibold text-sm">{label}</h3>
                <span className="text-sm font-bold px-2 py-0.5 bg-white/60 rounded-full">{colItems.length}</span>
              </div>

              <div className="p-3 space-y-3 min-h-48">
                {colItems.map((req) => {
                  const isStaffCompleted = getStatus(req.orderId)?.status === 'STAFF_COMPLETED';
                  const isConfirmed = req.status === 'CONFIRMED';
                  const isInProgress = req.status === 'IN_PROGRESS' && !isStaffCompleted;

                  return (
                    <div key={req.orderId} className={`bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all ${cardBorder}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xl flex-shrink-0 mt-0.5">{typeEmoji[req.serviceType] ?? '📋'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 uppercase tracking-wide truncate">
                            {req.serviceType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {req.roomId ? `Room ${req.roomId}` : 'No room'}
                          </p>
                        </div>
                      </div>

                      {req.description && (
                        <p className="text-sm text-gray-700 mb-2 leading-snug line-clamp-2">{req.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mb-3">{formatRelative(req.createdAt)}</p>

                      {/* Start Work button */}
                      {isConfirmed && (
                        <button onClick={() => acceptMutation.mutate(req.orderId)}
                          disabled={acceptMutation.isPending}
                          className="w-full py-2 text-xs font-semibold bg-navy-900 text-white rounded-xl hover:bg-navy-800 active:scale-95 transition-all disabled:opacity-50">
                          → Start Work
                        </button>
                      )}

                      {/* Mark Complete — transitions to STAFF_COMPLETED in store only */}
                      {isInProgress && (
                        <button onClick={() => {
                          setStatus(req.orderId, 'STAFF_COMPLETED');
                          addToast('Marked as complete — awaiting manager verification', 'success');
                        }}
                          className="w-full py-2 text-xs font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-500 active:scale-95 transition-all">
                          ✓ Mark Complete
                        </button>
                      )}

                      {/* Already completed by staff — waiting for manager */}
                      {isStaffCompleted && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 rounded-lg px-2 py-1.5">
                          <UserCheck size={12} />
                          Awaiting Manager Verification
                        </div>
                      )}

                      {/* Fully completed */}
                      {req.status === 'COMPLETED' && !isStaffCompleted && req.updatedAt && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 size={12} />
                          Done {formatRelative(req.updatedAt)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {colItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    {emptyIcon}
                    <p className="text-xs text-gray-400 mt-2">No {label.toLowerCase()} orders</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {mine.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <InboxIcon size={32} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">No tasks assigned to you yet</p>
          <p className="text-xs text-gray-400 mt-1">The manager will assign tasks to you from the Manager Panel.</p>
        </div>
      )}
    </div>
  );
}
