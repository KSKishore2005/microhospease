import { CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { invoicesApi } from '../../api/invoices';
import { paymentsApi } from '../../api/payments';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function Reconciliation() {
  const today = new Date().toISOString().split('T')[0];

  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: invoicesApi.getAll });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.getAll });

  const totalCollected = payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0);
  const totalRefunded = payments.filter((p) => p.status === 'REFUNDED').reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = invoices.reduce((s, i) => s + i.balanceDue, 0);
  const netTotal = totalCollected - totalRefunded;

  const paidInvoices = invoices.filter((i) => i.status === 'PAID').length;
  const unpaidInvoices = invoices.filter((i) => i.status === 'UNPAID').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE').length;

  const breakdown = [
    { category: 'Paid Invoices', total: invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0), type: 'REVENUE' },
    { category: 'Outstanding', total: totalOutstanding, type: 'UNPAID' },
    { category: 'Refunds', total: totalRefunded, type: 'REFUND' },
  ].filter((b) => b.total > 0);

  const breakdownTotal = breakdown.reduce((s, b) => s + b.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Reconciliation</h1>
          <p className="text-sm text-gray-400 mt-0.5">Financial close summary for {formatDate(today)}</p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />}>Export Report</Button>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl p-5 flex items-center gap-4 ${unpaidInvoices === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
        {unpaidInvoices === 0 ? <CheckCircle size={24} className="text-emerald-600" /> : <AlertCircle size={24} className="text-amber-600" />}
        <div>
          <p className={`font-semibold ${unpaidInvoices === 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
            {unpaidInvoices === 0 ? 'All invoices paid — Day fully reconciled' : `${unpaidInvoices} unpaid invoice${unpaidInvoices > 1 ? 's' : ''} outstanding`}
          </p>
          <p className={`text-sm mt-0.5 ${unpaidInvoices === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {formatDate(today)} • {invoices.length} total invoices
          </p>
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid sm:grid-cols-4 gap-4 stagger">
        {[
          { label: 'Total Collected', value: totalCollected,    bg: 'from-emerald-500 to-teal-600', sign: '+' },
          { label: 'Outstanding',     value: totalOutstanding,  bg: 'from-rose-500 to-rose-600',    sign: '' },
          { label: 'Refunds Issued',  value: totalRefunded,     bg: 'from-amber-500 to-amber-600',  sign: '-' },
          { label: 'Net Position',    value: netTotal,          bg: netTotal >= 0 ? 'from-navy-600 to-navy-800' : 'from-rose-600 to-rose-700', sign: '' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-200">
            <div className={`w-2.5 h-12 rounded-full bg-gradient-to-b ${s.bg} flex-shrink-0`} />
            <div>
              <p className="text-xs font-medium text-gray-400">{s.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{s.sign}{formatCurrency(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Invoice breakdown */}
        <Card title="Invoice Breakdown">
          <div className="space-y-3">
            {breakdown.map((b) => {
              const pct = breakdownTotal > 0 ? Math.min(100, Math.round((b.total / breakdownTotal) * 100)) : 0;
              return (
                <div key={b.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{b.category}</span>
                    <span className="font-semibold">{formatCurrency(b.total)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 bg-navy-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {breakdown.length === 0 && <p className="text-sm text-gray-400">No financial data available.</p>}
          </div>
        </Card>

        {/* Invoice status snapshot */}
        <Card title="Invoice Status Snapshot">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Invoices', value: invoices.length },
              { label: 'Paid', value: paidInvoices },
              { label: 'Unpaid', value: unpaidInvoices },
              { label: 'Overdue', value: overdueInvoices },
              { label: 'Total Payments', value: payments.length },
              { label: 'Refunded', value: payments.filter((p) => p.status === 'REFUNDED').length },
            ].map((k) => (
              <div key={k.label} className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{k.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
