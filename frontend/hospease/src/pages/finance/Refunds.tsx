import { useState } from 'react';
import { Check, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../utils/statusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { paymentsApi } from '../../api/payments';
import type { PaymentResponseDto } from '../../api/payments';
import { formatCurrency, formatRelative, formatDate } from '../../utils/formatters';

interface SectionProps {
  title: string;
  items: PaymentResponseDto[];
  color: string;
  onSelect: (p: PaymentResponseDto) => void;
}

const Section = ({ title, items, color, onSelect }: SectionProps) => (
  <Card title={title} subtitle={`${items.length} payment${items.length !== 1 ? 's' : ''}`}>
    {items.length === 0 ? (
      <p className="text-gray-400 text-sm">None.</p>
    ) : (
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.paymentId} className={`p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${color}`} onClick={() => onSelect(p)}>
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <p className="font-semibold text-gray-900">{String(p.paymentId).slice(0, 16)}...</p>
                <p className="text-xs text-gray-500">Invoice: {p.invoiceId} • {p.method}</p>
                <p className="text-xs text-gray-500">{p.paidAt ? formatRelative(p.paidAt) : 'Pending'}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                <Badge variant={statusBadge(p.status)} className="mt-1">{p.status}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
);

export default function Refunds() {
  const [selected, setSelected] = useState<PaymentResponseDto | null>(null);

  const queryClient = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentsApi.getAll,
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.refund(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelected(null);
    },
  });

  const successPayments = payments.filter((p) => p.status === 'SUCCESS');
  const refundedPayments = payments.filter((p) => p.status === 'REFUNDED');
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">Review and process refund requests</p>
      </div>

      <div className="grid grid-cols-3 gap-4 stagger">
        {[
          { label: 'Pending',    count: pendingPayments.length,  bg: 'from-amber-500 to-amber-600', icon: <Clock size={18} /> },
          { label: 'Successful', count: successPayments.length,  bg: 'from-blue-500 to-blue-700',   icon: <Check size={18} /> },
          { label: 'Refunded',   count: refundedPayments.length, bg: 'from-emerald-500 to-teal-600', icon: <Check size={18} /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 animate-fade-in-up">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <Section title="Successful Payments — Refundable" items={successPayments} color="bg-blue-50 border-blue-100" onSelect={setSelected} />
        <Section title="Refunded" items={refundedPayments} color="bg-gray-50 border-gray-100" onSelect={setSelected} />
      </div>

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Payment Details" size="md"
          footer={
            <>
              {selected.status === 'SUCCESS' && (
                <Button variant="danger" icon={<Check size={14} />} onClick={() => refundMutation.mutate(selected.paymentId)}
                  disabled={refundMutation.isPending}>
                  {refundMutation.isPending ? 'Processing...' : 'Process Refund'}
                </Button>
              )}
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </>
          }>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Payment ID', selected.paymentId],
                ['Invoice', selected.invoiceId],
                ['Amount', formatCurrency(selected.amount)],
                ['Status', <Badge key="s" variant={statusBadge(selected.status)}>{selected.status}</Badge>],
                ['Method', selected.method],
                ['Paid At', selected.paidAt ? formatDate(selected.paidAt) : 'N/A'],
              ].map(([l, v], i) => (
                <div key={i}><p className="text-gray-500 text-xs">{l}</p><div className="font-medium text-gray-900 mt-0.5">{v}</div></div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
