import { useState } from 'react';
import { Download, DollarSign, AlertCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { invoicesApi, parseLineItems } from '../../api/invoices';
import { paymentsApi } from '../../api/payments';
import type { PaymentMethod } from '../../api/payments';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useToastStore } from '../../store/toastStore';

type Tab = 'INVOICES' | 'PAYMENTS';

export default function InvoicesPayments() {
  const [tab, setTab] = useState<Tab>('INVOICES');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: invoicesApi.getAll });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.getAll });

  const payInvoiceMutation = useMutation({
    mutationFn: ({ invoiceId, guestId, amount, method }: { invoiceId: string; guestId: string; amount: number; method: PaymentMethod }) =>
      paymentsApi.create(invoiceId, guestId, { amount, method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      addToast('Payment recorded successfully!', 'success');
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to record payment.';
      addToast(errMsg, 'error');
    }
  });

  const invoiceColumns = [
    { key: 'invoiceId', label: 'Invoice #', sortable: true },
    { key: 'guestId', label: 'Guest ID', sortable: true },
    { key: 'issuedAt', label: 'Issued', sortable: true, render: (v: unknown) => formatDate(String(v)) },
    { key: 'dueDate', label: 'Due', render: (v: unknown) => formatDate(String(v)) },
    { key: 'totalAmount', label: 'Total', render: (v: unknown) => formatCurrency(Number(v)) },
    { key: 'amountPaid', label: 'Paid', render: (v: unknown) => <span className="text-emerald-700 font-semibold">{formatCurrency(Number(v))}</span> },
    { key: 'balanceDue', label: 'Balance', render: (v: unknown) => (
      <span className={Number(v) > 0 ? 'text-rose-600 font-bold' : 'text-gray-400'}>
        {formatCurrency(Number(v))}
      </span>
    )},
    { key: 'status', label: 'Status', render: (v: unknown) => <Badge variant={statusBadge(String(v))} dot>{String(v)}</Badge> },
    {
      key: 'invoiceId', label: 'Action',
      render: (_v: unknown, row: Record<string, unknown>) => (
        row['status'] !== 'PAID' ? (
          <Button size="xs" variant="ghost" onClick={() => {
            setSelectedInvoice(row);
            setPaymentAmount(Number(row['balanceDue']));
            setPaymentMethod('CREDIT_CARD');
            setIsPaymentModalOpen(true);
          }}>
            Mark Paid
          </Button>
        ) : (
          <Button size="xs" variant="ghost" icon={<Download size={12} />}
            onClick={() => {
              const id = String(row['invoiceId']);
              const guest = String(row['guestId'] ?? '');
              const total = String(row['totalAmount'] ?? '');
              const blob = new Blob(
                [`Invoice: ${id}\nGuest: ${guest}\nTotal: $${total}\nStatus: PAID`],
                { type: 'text/plain' }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `invoice-${id.slice(0, 8)}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}>
            Export
          </Button>
        )
      ),
    },
  ];

  const paymentColumns = [
    { key: 'paymentId', label: 'Payment ID', sortable: true },
    { key: 'invoiceId', label: 'Invoice', sortable: true },
    { key: 'guestId', label: 'Guest ID' },
    { key: 'paidAt', label: 'Paid At', sortable: true, render: (v: unknown) => v ? formatDate(String(v)) : '—' },
    {
      key: 'method',
      label: 'Method',
      render: (v: unknown) => {
        const methodStr = String(v);
        const config: Record<string, { label: string; bg: string }> = {
          CASH: { label: '💵 Cash', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
          CREDIT_CARD: { label: '💳 Credit Card', bg: 'bg-blue-50 text-blue-700 border border-blue-100' },
          DEBIT_CARD: { label: '🏦 Debit Card', bg: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
        };
        const current = config[methodStr] || { label: methodStr, bg: 'bg-gray-50 text-gray-700' };
        return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${current.bg}`}>{current.label}</span>;
      }
    },
    { key: 'amount', label: 'Amount', render: (v: unknown) => <span className="text-emerald-700 font-bold">{formatCurrency(Number(v))}</span> },
    { key: 'status', label: 'Status', render: (v: unknown) => <Badge variant={statusBadge(String(v))} dot>{String(v)}</Badge> },
  ];

  const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const outstanding = invoices.reduce((s, i) => s + i.balanceDue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices & Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Comprehensive ledger and invoice management</p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />}>Export</Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 stagger">
        {[
          {
            label: 'Total Collected',
            value: formatCurrency(totalCollected),
            icon: <DollarSign size={18} />,
            bg: 'from-emerald-500 to-teal-600',
            sub: `${invoices.filter((i) => i.status === 'PAID').length} paid invoices`,
          },
          {
            label: 'Outstanding Balances',
            value: formatCurrency(outstanding),
            icon: <AlertCircle size={18} />,
            bg: 'from-amber-500 to-amber-600',
            sub: `${invoices.filter((i) => i.status !== 'PAID').length} unpaid`,
          },
          {
            label: 'Total Invoices',
            value: String(invoices.length),
            icon: <FileText size={18} />,
            bg: 'from-navy-600 to-navy-800',
            sub: `${payments.length} payments recorded`,
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-200">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-fit gap-1">
        {(['INVOICES', 'PAYMENTS'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'INVOICES' ? `Invoices (${invoices.length})` : `Payments (${payments.length})`}
          </button>
        ))}
      </div>

      <Card padding={false}>
        <div className="p-6">
          {tab === 'INVOICES' ? (
            <Table
              columns={invoiceColumns as Parameters<typeof Table>[0]['columns']}
              data={invoices as unknown as Record<string, unknown>[]}
              keyField="invoiceId"
              searchable
              searchKeys={['invoiceId', 'guestId']}
            />
          ) : (
            <Table
              columns={paymentColumns as Parameters<typeof Table>[0]['columns']}
              data={payments as unknown as Record<string, unknown>[]}
              keyField="paymentId"
              searchable
              searchKeys={['paymentId', 'invoiceId', 'guestId']}
            />
          )}
        </div>
      </Card>

      {/* Payment Selection Modal */}
      <Modal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        subtitle={`Invoice #${String(selectedInvoice?.invoiceId ?? '').slice(0, 8)} | Guest ID: ${selectedInvoice?.guestId}`}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={payInvoiceMutation.isPending}
              onClick={() => {
                if (selectedInvoice) {
                  payInvoiceMutation.mutate({
                    invoiceId: String(selectedInvoice.invoiceId),
                    guestId: String(selectedInvoice.guestId),
                    amount: paymentAmount,
                    method: paymentMethod,
                  });
                }
              }}
            >
              Confirm Payment
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedInvoice && parseLineItems(selectedInvoice.lineItemsJson).length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Invoice Line Items</label>
              <div className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50/50">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-[10px] text-gray-500 font-semibold animate-none">
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parseLineItems(selectedInvoice.lineItemsJson).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-100/30 transition-colors">
                        <td className="px-3 py-2 text-gray-700 font-medium">{item.description}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-800">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Outstanding Balance</label>
            <p className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(Number(selectedInvoice?.balanceDue ?? 0))}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'CASH', label: 'Cash', icon: '💵' },
                { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
                { value: 'DEBIT_CARD', label: 'Debit Card', icon: '🏦' }
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value as PaymentMethod)}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    paymentMethod === m.value
                      ? 'border-gold-500 bg-gold-50/20 text-gold-700 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600 bg-white'
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Amount to Pay ($)</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              max={Number(selectedInvoice?.balanceDue ?? 0)}
              min={0.01}
              step={0.01}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-navy-500 font-semibold"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
