import { useState } from 'react';
import { Download, DollarSign, AlertCircle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { invoicesApi } from '../../api/invoices';
import { paymentsApi } from '../../api/payments';
import { formatDate, formatCurrency } from '../../utils/formatters';

type Tab = 'INVOICES' | 'PAYMENTS';

export default function InvoicesPayments() {
  const [tab, setTab] = useState<Tab>('INVOICES');

  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: invoicesApi.getAll });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.getAll });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.markPaid(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
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
          <Button size="xs" variant="ghost" onClick={() => markPaidMutation.mutate(String(row['invoiceId']))}>
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
    { key: 'method', label: 'Method' },
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
    </div>
  );
}
