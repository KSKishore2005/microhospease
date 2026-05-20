import { useState } from 'react';
import { Send, ListFilter, MessageSquare, Inbox } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { serviceOrdersApi } from '../../api/serviceOrders';
import type { ServiceOrderResponseDto } from '../../api/serviceOrders';
import { formatRelative } from '../../utils/formatters';

const TYPE_FILTERS = ['ALL', 'ROOM_SERVICE', 'MAINTENANCE', 'CONCIERGE', 'HOUSEKEEPING', 'OTHER'] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

export default function GuestCommunications() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [selected, setSelected] = useState<ServiceOrderResponseDto | null>(null);

  const queryClient = useQueryClient();

  const { data: serviceOrders = [] } = useQuery({
    queryKey: ['service-orders'],
    queryFn: serviceOrdersApi.getAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => serviceOrdersApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-orders'] }),
  });

  const filtered = typeFilter === 'ALL'
    ? serviceOrders
    : serviceOrders.filter((o) => o.serviceType === typeFilter);

  const typeColors: Record<string, string> = {
    ROOM_SERVICE: 'bg-blue-100 text-blue-700',
    MAINTENANCE: 'bg-rose-100 text-rose-700',
    CONCIERGE: 'bg-emerald-100 text-emerald-700',
    HOUSEKEEPING: 'bg-purple-100 text-purple-700',
    SPA: 'bg-purple-100 text-purple-700',
    OTHER: 'bg-gray-100 text-gray-600',
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
          { label: 'Pending',    count: serviceOrders.filter((o) => o.status === 'PENDING').length,     bg: 'from-rose-500 to-rose-600' },
          { label: 'In Progress', count: serviceOrders.filter((o) => o.status === 'IN_PROGRESS').length, bg: 'from-amber-500 to-amber-600' },
          { label: 'Completed',  count: serviceOrders.filter((o) => o.status === 'COMPLETED').length,   bg: 'from-emerald-500 to-teal-600' },
          { label: 'Total',      count: serviceOrders.length,                                            bg: 'from-navy-600 to-navy-800' },
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
            {/* Filter tabs */}
            <div className="flex gap-1 flex-wrap p-3 border-b border-gray-100">
              {TYPE_FILTERS.map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${typeFilter === t ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <div key={order.orderId} onClick={() => setSelected(order)}
                  className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${selected?.orderId === order.orderId ? 'bg-navy-50 border-l-2 border-navy-700' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${order.status === 'PENDING' ? 'bg-rose-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{order.serviceType.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Order #{String(order.orderId).slice(0, 8)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[order.serviceType] ?? 'bg-gray-100 text-gray-600'}`}>{order.serviceType.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-gray-400">{formatRelative(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadge(selected.status)}>{selected.status.replace('_', ' ')}</Badge>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed mb-4">
                {selected.description ?? 'No description provided.'}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {selected.status === 'PENDING' && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: selected.orderId, status: 'IN_PROGRESS' })}>
                        Accept & Start
                      </Button>
                    )}
                    {selected.status === 'IN_PROGRESS' && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: selected.orderId, status: 'COMPLETED' })}>
                        Mark Completed
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: selected.orderId, status: 'CANCELLED' })}
                      className="text-rose-600">
                      Cancel
                    </Button>
                  </div>
                  <Button icon={<Send size={14} />} size="sm">Send Reply</Button>
                </div>
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
