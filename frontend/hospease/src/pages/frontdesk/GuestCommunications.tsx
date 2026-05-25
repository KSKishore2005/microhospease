import { useState } from 'react';
import { Send, Inbox, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../utils/statusBadge';
import Button from '../../components/common/Button';
import { serviceOrdersApi } from '../../api/serviceOrders';
import type { ServiceOrderResponseDto, ServiceOrderStatus } from '../../api/serviceOrders';
import { formatRelative } from '../../utils/formatters';
import { useToastStore } from '../../store/toastStore';
import { useWorkflowStore } from '../../store/workflowStore';

const TYPE_FILTERS = ['ALL', 'ROOM_SERVICE', 'LAUNDRY', 'SPA', 'GYM', 'FOOD_AND_BEVERAGES'] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

interface Reply { text: string; createdAt: string; }

const WORKFLOW_LABELS: Record<string, { label: string; color: string }> = {
  FORWARDED_TO_MANAGER: { label: 'Forwarded to Manager', color: 'bg-blue-100 text-blue-700' },
  STAFF_ASSIGNED:       { label: 'Staff Assigned',        color: 'bg-purple-100 text-purple-700' },
  STAFF_COMPLETED:      { label: 'Awaiting Verification', color: 'bg-amber-100 text-amber-700' },
  MANAGER_VERIFIED:     { label: 'Verified — Ready to Close', color: 'bg-emerald-100 text-emerald-700' },
};

export default function GuestCommunications() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [selected, setSelected] = useState<ServiceOrderResponseDto | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);
  const addToast = useToastStore((s) => s.addToast);
  const { customStatuses, setStatus, clearStatus } = useWorkflowStore();
  const queryClient = useQueryClient();

  const { data: serviceOrders = [] } = useQuery({ queryKey: ['service-orders'], queryFn: serviceOrdersApi.getAll });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceOrderStatus }) => serviceOrdersApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-orders'] }),
  });

  const [prevOrderId, setPrevOrderId] = useState<string | null>(null);

  if (selected && selected.orderId !== prevOrderId) {
    setPrevOrderId(selected.orderId);
    const stored = localStorage.getItem(`hospease-reply-history-${selected.orderId}`);
    setReplies(stored ? JSON.parse(stored) : []);
    setReplyText('');
  } else if (!selected && prevOrderId !== null) {
    setPrevOrderId(null);
    setReplies([]);
    setReplyText('');
  }

  const handleSendReply = () => {
    if (!selected || !replyText.trim()) return;
    const newReply: Reply = { text: replyText.trim(), createdAt: new Date().toISOString() };
    const updatedReplies = [...replies, newReply];
    localStorage.setItem(`hospease-reply-history-${selected.orderId}`, JSON.stringify(updatedReplies));
    setReplies(updatedReplies);
    setReplyText('');
    addToast('Reply sent successfully to guest!', 'success');
  };

  const handleForwardToManager = (order: ServiceOrderResponseDto) => {
    setStatus(order.orderId, 'FORWARDED_TO_MANAGER');
    addToast('Request forwarded to Manager', 'success');
    queryClient.invalidateQueries({ queryKey: ['service-orders'] });
  };

  const handleMarkCompleted = (order: ServiceOrderResponseDto) => {
    updateStatusMutation.mutate({ id: order.orderId, status: 'COMPLETED' });
    clearStatus(order.orderId);
    setSelected(null);
    addToast('Request marked as completed and sent to Finance', 'success');
  };

  const filtered = typeFilter === 'ALL' ? serviceOrders : serviceOrders.filter((o) => o.serviceType === typeFilter);

  const typeColors: Record<string, string> = {
    ROOM_SERVICE: 'bg-blue-100 text-blue-700',
    LAUNDRY: 'bg-indigo-100 text-indigo-700',
    SPA: 'bg-purple-100 text-purple-700',
    GYM: 'bg-emerald-100 text-emerald-700',
    FOOD_AND_BEVERAGES: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guest Communications</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage messages and guest service requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {[
          { label: 'Pending',     count: serviceOrders.filter((o) => o.status === 'PENDING').length,     bg: 'from-rose-500 to-rose-600' },
          { label: 'Forwarded',   count: Object.values(customStatuses).filter(s => s.status === 'FORWARDED_TO_MANAGER').length, bg: 'from-blue-500 to-blue-600' },
          { label: 'In Progress', count: serviceOrders.filter((o) => o.status === 'IN_PROGRESS').length, bg: 'from-amber-500 to-amber-600' },
          { label: 'Completed',   count: serviceOrders.filter((o) => o.status === 'COMPLETED').length,   bg: 'from-emerald-500 to-teal-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 animate-fade-in-up">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
              <span className="text-sm font-bold">{s.count}</span>
            </div>
            <p className="text-xs font-semibold text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Order list */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <div className="flex gap-1 flex-wrap p-3 border-b border-gray-100">
              {TYPE_FILTERS.map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${typeFilter === t ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {filtered.map((order) => {
                const wf = customStatuses[order.orderId];
                return (
                  <div key={order.orderId} onClick={() => setSelected(order)}
                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${selected?.orderId === order.orderId ? 'bg-navy-50 border-l-2 border-navy-700' : ''}`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${order.status === 'PENDING' && !wf ? 'bg-rose-500 animate-pulse' : 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{order.serviceType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Order #{String(order.orderId).slice(0, 8)}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${typeColors[order.serviceType] ?? 'bg-gray-100 text-gray-600'}`}>
                            {order.serviceType.replace(/_/g, ' ')}
                          </span>
                          {wf && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${WORKFLOW_LABELS[wf.status]?.color}`}>
                              {WORKFLOW_LABELS[wf.status]?.label}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{formatRelative(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-10">
                  <Inbox size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No orders found.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Order detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <Card>
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{selected.serviceType.replace(/_/g, ' ')}</h3>
                  <p className="text-sm text-gray-500 mt-1">Order #{selected.orderId} • {formatRelative(selected.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={statusBadge(selected.status)}>{selected.status.replace('_', ' ')}</Badge>
                  {customStatuses[selected.orderId] && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${WORKFLOW_LABELS[customStatuses[selected.orderId].status]?.color}`}>
                      {WORKFLOW_LABELS[customStatuses[selected.orderId].status]?.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Workflow progress indicator */}
              <div className="flex items-center gap-1 mb-4 text-[10px] text-gray-400 flex-wrap">
                {['Guest Request', 'Front Desk', 'Manager', 'Staff', 'Verified', 'Closed'].map((step, i) => (
                  <span key={step} className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 font-medium">{step}</span>
                    {i < 5 && <ArrowRight size={10} />}
                  </span>
                ))}
              </div>

              {/* Chat Stream */}
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4 border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                <div className="flex flex-col items-start bg-white p-3 rounded-2xl shadow-sm border border-gray-100 max-w-[85%]">
                  <span className="text-[10px] font-bold text-navy-700 uppercase mb-0.5">Guest Request</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.description ?? 'No description provided.'}</p>
                  <span className="text-[9px] text-gray-400 self-end mt-1">{formatRelative(selected.createdAt)}</span>
                </div>
                {replies.map((reply, idx) => (
                  <div key={idx} className="flex flex-col items-end bg-navy-900 text-white p-3 rounded-2xl shadow-sm max-w-[85%] ml-auto">
                    <span className="text-[10px] font-bold text-gold-400 uppercase mb-0.5">Staff Reply</span>
                    <p className="text-sm leading-relaxed">{reply.text}</p>
                    <span className="text-[9px] text-navy-300 self-end mt-1">{formatRelative(reply.createdAt)}</span>
                  </div>
                ))}
              </div>

              {/* Reply input */}
              {selected.status !== 'COMPLETED' && selected.status !== 'CANCELLED' && (
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <label className="font-semibold">Write Reply</label>
                    <span>{replyText.length}/500</span>
                  </div>
                  <div className="flex gap-2">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value.slice(0, 500))}
                      placeholder="Type your response to the guest..." rows={2} className="textarea flex-1 min-h-[50px] resize-none" />
                    <Button onClick={handleSendReply} disabled={!replyText.trim()} icon={<Send size={14} />} size="sm">Send</Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-100 pt-4 mt-4 flex gap-2 flex-wrap">
                {/* Forward to Manager — only if PENDING and not yet forwarded */}
                {selected.status === 'PENDING' && !customStatuses[selected.orderId] && (
                  <Button size="sm" onClick={() => handleForwardToManager(selected)}>
                    Forward to Manager
                  </Button>
                )}
                {/* Mark Completed — only after Manager has verified */}
                {customStatuses[selected.orderId]?.status === 'MANAGER_VERIFIED' && (
                  <Button size="sm" variant="primary" icon={<CheckCircle2 size={14} />}
                    onClick={() => handleMarkCompleted(selected)}>
                    Mark Completed
                  </Button>
                )}
                {/* Cancel — always available unless already done */}
                {selected.status !== 'COMPLETED' && selected.status !== 'CANCELLED' && (
                  <Button variant="ghost" size="sm" className="text-rose-600"
                    onClick={() => { updateStatusMutation.mutate({ id: selected.orderId, status: 'CANCELLED' }); clearStatus(selected.orderId); setSelected(null); }}>
                    Cancel Order
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 text-center gap-3">
              <MessageSquare size={32} className="text-gray-200" />
              <p className="text-sm font-medium text-gray-400">Select an order to view details</p>
              <p className="text-xs text-gray-300">Click any request from the list on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
