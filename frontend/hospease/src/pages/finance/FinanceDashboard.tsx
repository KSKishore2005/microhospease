import { DollarSign, TrendingUp, TrendingDown, RotateCcw, ArrowRight, FileText, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge, { statusBadge } from '../../components/common/Badge';
import { invoicesApi } from '../../api/invoices';
import { paymentsApi } from '../../api/payments';
import { formatCurrency, formatDate, formatRelative } from '../../utils/formatters';

export default function FinanceDashboard() {
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: invoicesApi.getAll });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.getAll });

  const totalRevenue     = invoices.reduce((s, i) => s + (i.amountPaid ?? 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + (i.balanceDue ?? 0), 0);
  const pendingRefunds   = payments.filter((p) => p.status === 'REFUNDED').length;
  const netPosition      = totalRevenue - totalOutstanding;

  // Build daily chart data
  const paymentsByDay = payments.slice(0, 30).reduce<Record<string, number>>((acc, p) => {
    const date = (p.paidAt ?? new Date().toISOString()).split('T')[0];
    acc[date] = (acc[date] ?? 0) + (p.amount ?? 0);
    return acc;
  }, {});

  const chartData = Object.entries(paymentsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, revenue]) => ({
      date: date.slice(5),
      revenue: Math.round(revenue),
      expenses: Math.round(revenue * 0.55),
    }));

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Financial overview and ledger summary</p>
        </div>
        <Link to="/finance/invoices"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-sm">
          <FileText size={15} /> Invoices & Payments
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Total Collected"  value={formatCurrency(totalRevenue)}     icon={<TrendingUp size={20} />}   color="emerald" trend={{ value: 8.3, label: 'vs last week' }} className="animate-fade-in-up" />
        <StatCard title="Outstanding"      value={formatCurrency(totalOutstanding)}  icon={<TrendingDown size={20} />} color="rose"    className="animate-fade-in-up" />
        <StatCard title="Net Position"     value={formatCurrency(netPosition)}       icon={<DollarSign size={20} />}   color="navy"    className="animate-fade-in-up" />
        <StatCard title="Refunds Issued"   value={pendingRefunds}                    icon={<RotateCcw size={20} />}    color="amber"   className="animate-fade-in-up" />
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 ? (
        <Card title="Revenue vs Estimated Expenses" subtitle="Last 14 days">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#1a2744" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1a2744" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#c9a84c" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Area type="monotone" dataKey="revenue"  stroke="#1a2744" strokeWidth={2.5} fill="url(#gradRev)"  name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#c9a84c" strokeWidth={2}   fill="url(#gradExp)"  name="Expenses (est.)" strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      ) : (
        <Card title="Revenue vs Estimated Expenses">
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-sm text-gray-400">No payment data yet to chart.</p>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent invoices */}
        <Card title="Recent Invoices" icon={<FileText size={16} />}
          action={<Link to="/finance/invoices" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">View All <ArrowRight size={11} /></Link>}>
          <div className="space-y-2">
            {recentInvoices.map((inv) => (
              <div key={inv.invoiceId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-navy-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {String(inv.invoiceId).slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(inv.issuedAt ?? inv.dueDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(inv.totalAmount)}</p>
                  <Badge variant={statusBadge(inv.status)} dot>{inv.status}</Badge>
                </div>
              </div>
            ))}
            {recentInvoices.length === 0 && (
              <div className="text-center py-10">
                <FileText size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No invoices yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent payments */}
        <Card title="Recent Payments" icon={<CreditCard size={16} />}
          action={<Link to="/finance/invoices" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">View All <ArrowRight size={11} /></Link>}>
          <div className="space-y-2">
            {payments.slice(0, 5).map((p) => (
              <div key={p.paymentId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CreditCard size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.method ?? 'Payment'}</p>
                    <p className="text-xs text-gray-400">{p.paidAt ? formatRelative(p.paidAt) : 'Pending'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(p.amount ?? 0)}</p>
                  <Badge variant={statusBadge(p.status)} dot>{p.status}</Badge>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="text-center py-10">
                <CreditCard size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No payments recorded yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
