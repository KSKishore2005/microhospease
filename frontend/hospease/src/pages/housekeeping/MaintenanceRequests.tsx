import { useState } from 'react';
import { Plus, Wrench, Clock, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { serviceOrdersApi } from '../../api/serviceOrders';
import type { ServiceOrderResponseDto, ServiceOrderStatus } from '../../api/serviceOrders';
import { formatRelative, formatDate } from '../../utils/formatters';

const priorityConfig: Record<string, { icon: string; label: string; badge: string }> = {
  IN_PROGRESS: { icon: '⚠️', label: 'In Progress', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  PENDING:     { icon: '📋', label: 'Pending',     badge: 'bg-gray-50 text-gray-700 border-gray-200' },
  COMPLETED:   { icon: '✅', label: 'Completed',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function MaintenanceRequests() {
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<ServiceOrderResponseDto | null>(null);
  const [form, setForm] = useState({ description: '', roomId: '' });

  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['service-orders', 'MAINTENANCE'],
    queryFn: () => serviceOrdersApi.getByType('MAINTENANCE'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof serviceOrdersApi.create>[0]) => serviceOrdersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders', 'MAINTENANCE'] });
      setShowNew(false);
      setForm({ description: '', roomId: '' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceOrderStatus }) => serviceOrdersApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-orders', 'MAINTENANCE'] }),
  });

  const pending    = requests.filter((r) => r.status === 'PENDING');
  const inProgress = requests.filter((r) => r.status === 'IN_PROGRESS');
  const open       = [...pending, ...inProgress];
  const resolved   = requests.filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const submit = () => {
    if (!form.description) return;
    createMutation.mutate({
      serviceType: 'MAINTENANCE',
      description: form.description,
      roomId: form.roomId || null,
      guestId: null,
      reservationId: null,
      price: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-sm text-gray-400 mt-0.5">Log and track engineering issues</p>
        </div>
        <Button onClick={() => setShowNew(true)} icon={<Plus size={16} />}>New Request</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {[
          { label: 'Pending',     count: pending.length,    icon: <Clock size={18} />,        bg: 'from-amber-500 to-amber-600' },
          { label: 'In Progress', count: inProgress.length, icon: <Wrench size={18} />,       bg: 'from-blue-500 to-blue-700' },
          { label: 'Open Total',  count: open.length,       icon: <AlertTriangle size={18} />, bg: 'from-rose-500 to-rose-600' },
          { label: 'Resolved',    count: resolved.length,   icon: <CheckCircle2 size={18} />, bg: 'from-emerald-500 to-teal-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-200">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active requests */}
      <Card title="Active Requests" subtitle={`${open.length} open issue${open.length !== 1 ? 's' : ''}`} icon={<Wrench size={15} />}>
        <div className="space-y-2">
          {open.map((req) => {
            const cfg = priorityConfig[req.status];
            return (
              <div key={req.orderId}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-50 hover:border-gray-200 hover:bg-gray-50/50 cursor-pointer transition-all group"
                onClick={() => setSelected(req)}>
                <span className="text-xl mt-0.5 flex-shrink-0">{cfg?.icon ?? '📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{req.description?.slice(0, 50) ?? 'Maintenance Issue'}</p>
                    <Badge variant={statusBadge(req.status)} dot>{req.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                    <span>{formatRelative(req.createdAt)}</span>
                    {req.roomId && <span className="flex items-center gap-1">📍 Room {req.roomId}</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-1" />
              </div>
            );
          })}
          {open.length === 0 && (
            <div className="text-center py-10">
              <CheckCircle2 size={32} className="text-emerald-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">No active requests</p>
              <p className="text-xs text-gray-300 mt-0.5">All issues are resolved!</p>
            </div>
          )}
        </div>
      </Card>

      {resolved.length > 0 && (
        <Card title="Resolved" subtitle={`${resolved.length} completed`} icon={<CheckCircle2 size={15} />}>
          <div className="space-y-1">
            {resolved.map((req) => (
              <div key={req.orderId} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors opacity-70">
                <div className="min-w-0 mr-4">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {(req.description ?? 'Issue').slice(0, 50)}
                  </p>
                  <p className="text-xs text-gray-400">{formatRelative(req.createdAt)}</p>
                </div>
                <Badge variant={statusBadge(req.status)}>{req.status.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* New Request Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Maintenance Request" subtitle="Describe the issue and affected location" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={submit} loading={createMutation.isPending}
              disabled={!form.description || createMutation.isPending}>
              Submit Request
            </Button>
          </>
        }>
        <div className="space-y-4">
          {createMutation.isError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              Failed to submit request. Please try again.
            </div>
          )}
          <div>
            <label className="input-label">Room / Location <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={form.roomId}
              onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
              placeholder="e.g., Room 302 or Lobby"
              className="input" />
          </div>
          <div>
            <label className="input-label">Issue Description <span className="text-rose-500">*</span></label>
            <textarea value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Describe the issue in detail — what's broken, where, and when you noticed it..."
              className="textarea" />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)}
          title="Maintenance Request Details"
          subtitle={`Request #${String(selected.orderId).slice(0, 8)}`}
          size="md"
          footer={
            <div className="flex gap-2">
              {selected.status === 'PENDING' && (
                <Button size="sm" onClick={() => {
                  updateStatusMutation.mutate({ id: selected.orderId, status: 'IN_PROGRESS' });
                  setSelected(null);
                }}>
                  Accept & Start
                </Button>
              )}
              {selected.status === 'IN_PROGRESS' && (
                <Button size="sm" variant="primary" icon={<CheckCircle2 size={14} />}
                  onClick={() => {
                    updateStatusMutation.mutate({ id: selected.orderId, status: 'COMPLETED' });
                    setSelected(null);
                  }}>
                  Mark Complete
                </Button>
              )}
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </div>
          }>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Status', <Badge key="s" variant={statusBadge(selected.status)} dot>{selected.status.replace('_', ' ')}</Badge>],
                ['Order ID', String(selected.orderId).slice(0, 12) + '...'],
                ['Room / Location', selected.roomId || 'Not specified'],
                ['Reported', formatDate(selected.createdAt)],
              ].map(([l, v], i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 text-xs mb-1">{l}</p>
                  <div className="font-semibold text-gray-900">{v}</div>
                </div>
              ))}
            </div>
            {selected.description && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-400 text-xs mb-1.5">Description</p>
                <p className="text-gray-700 leading-relaxed">{selected.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
