import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, InboxIcon, UserCheck, Hand } from 'lucide-react';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { useAuthStore } from '../../store/authStore';
import { formatRelative } from '../../utils/formatters';

type Tab = 'MINE' | 'QUEUE';

type Status = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const COLUMNS: { status: Status; label: string; headerColor: string; cardBorder: string; emptyIcon: React.ReactNode }[] = [
  {
    status: 'CONFIRMED',
    label: 'Accepted',
    headerColor: 'bg-blue-50 border-blue-200 text-blue-800',
    cardBorder: 'border-blue-100',
    emptyIcon: <InboxIcon size={28} className="text-blue-200" />,
  },
  {
    status: 'IN_PROGRESS',
    label: 'In Progress',
    headerColor: 'bg-amber-50 border-amber-200 text-amber-800',
    cardBorder: 'border-amber-100',
    emptyIcon: <Loader2 size={28} className="text-amber-200" />,
  },
  {
    status: 'COMPLETED',
    label: 'Completed',
    headerColor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    cardBorder: 'border-emerald-100',
    emptyIcon: <CheckCircle2 size={28} className="text-emerald-200" />,
  },
];

const typeEmoji: Record<string, string> = {
  ROOM_SERVICE: '🍽️', HOUSEKEEPING: '🧹', MAINTENANCE: '🔧', CONCIERGE: '🔑',
  SPA: '💆', LAUNDRY: '👕', GYM: '🏋️', TRANSPORT: '🚗', RESTAURANT: '🍴', OTHER: '📋',
};

export default function ServiceFulfillment() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('MINE');

  const userId = user?.id;

  // My orders: every order currently assigned to me (any status)
  const { data: myOrders = [] } = useQuery({
    queryKey: ['service-orders', 'assignee', userId],
    queryFn: () => serviceOrdersApi.getByAssignee(userId!),
    enabled: !!userId,
  });

  // Queue: unassigned PENDING orders — anyone can pick from here
  const { data: queue = [] } = useQuery({
    queryKey: ['service-orders', 'queue'],
    queryFn: () => serviceOrdersApi.getQueue(),
    refetchInterval: 15_000, // keep queue fresh
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => serviceOrdersApi.accept(id, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'queue'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'assignee', userId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      serviceOrdersApi.updateStatus(id, status as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'assignee', userId] });
    },
  });

  const advance = (id: string, current: Status) => {
    const next: Partial<Record<Status, Status>> = {
      CONFIRMED: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
    };
    const target = next[current];
    if (target) updateStatusMutation.mutate({ id, status: target });
  };

  const mine = myOrders.filter((o) => o.status !== 'CANCELLED');
  const pending = queue.filter((o) => !o.assignedToUserId);

  const statItems = [
    { label: 'My Active', value: mine.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'CONFIRMED').length, icon: <Loader2 size={18} />, bg: 'from-amber-500 to-amber-600' },
    { label: 'My Completed Today', value: mine.filter((o) => o.status === 'COMPLETED').length, icon: <CheckCircle2 size={18} />, bg: 'from-emerald-500 to-teal-600' },
    { label: 'In Queue', value: pending.length, icon: <Hand size={18} />, bg: 'from-blue-500 to-blue-700' },
    { label: 'My Total', value: mine.length, icon: <UserCheck size={18} />, bg: 'from-navy-600 to-navy-800' },
  ];

  if (!userId) {
    return (
      <div className="text-center py-16 text-sm text-gray-400">
        Loading your profile…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Fulfillment</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Your active assignments and the open service queue
          </p>
        </div>
        <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
          {(['MINE', 'QUEUE'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'MINE' ? <><UserCheck size={14} /> My Orders ({mine.length})</> : <><Hand size={14} /> Queue ({pending.length})</>}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {statItems.map((s) => (
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

      {tab === 'QUEUE' ? (
        // ── QUEUE ────────────────────────────────────────────────────────────────
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-5 text-white">
            <p className="text-sm font-semibold">Open service queue</p>
            <p className="text-xs text-navy-300 mt-0.5">
              Accept an order to add it to your active list. Live-refreshing every 15s.
            </p>
          </div>

          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <InboxIcon size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">The queue is empty</p>
              <p className="text-xs text-gray-400 mt-1">All orders are being handled.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pending.map((req) => (
                <div
                  key={req.orderId}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-navy-200 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{typeEmoji[req.serviceType] ?? '📋'}</span>
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
                    <p className="text-sm text-gray-700 mb-3 leading-snug line-clamp-3">{req.description}</p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">{formatRelative(req.createdAt)}</span>
                    <button
                      onClick={() => acceptMutation.mutate(req.orderId)}
                      disabled={acceptMutation.isPending}
                      className="px-3 py-1.5 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Hand size={12} /> Accept & Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ── MY ORDERS (kanban) ──────────────────────────────────────────────────
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {COLUMNS.map(({ status, label, headerColor, cardBorder, emptyIcon }) => {
            const colItems = mine.filter((r) => r.status === status);
            return (
              <div key={status} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`flex items-center justify-between px-4 py-3 border-b ${headerColor}`}>
                  <h3 className="font-semibold text-sm">{label}</h3>
                  <span className="text-sm font-bold px-2 py-0.5 bg-white/60 rounded-full">{colItems.length}</span>
                </div>

                <div className="p-3 space-y-3 min-h-48">
                  {colItems.map((req) => (
                    <div
                      key={req.orderId}
                      className={`bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all ${cardBorder}`}
                    >
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

                      {status !== 'COMPLETED' && (
                        <button
                          onClick={() => advance(req.orderId, status)}
                          disabled={updateStatusMutation.isPending}
                          className="w-full py-2 text-xs font-semibold bg-navy-900 text-white rounded-xl hover:bg-navy-800 active:scale-95 transition-all disabled:opacity-50"
                        >
                          → {status === 'CONFIRMED' ? 'Start Work' : 'Mark Complete'}
                        </button>
                      )}
                      {status === 'COMPLETED' && req.updatedAt && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 size={12} />
                          Done {formatRelative(req.updatedAt)}
                        </div>
                      )}
                    </div>
                  ))}

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
      )}
    </div>
  );
}
