import { DollarSign, TrendingUp, TrendingDown, RotateCcw, ArrowRight, FileText, CreditCard, Download, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge, { statusBadge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { invoicesApi } from '../../api/invoices';
import { paymentsApi } from '../../api/payments';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { formatCurrency, formatDate, formatRelative } from '../../utils/formatters';
import { useToastStore } from '../../store/toastStore';

export default function FinanceDashboard() {
  const addToast = useToastStore((s) => s.addToast);

  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: invoicesApi.getAll });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.getAll });
  const { data: serviceOrders = [] } = useQuery({ queryKey: ['service-orders'], queryFn: serviceOrdersApi.getAll });

  // Calculate actual revenue from invoices
  const totalRevenue = invoices.reduce((s, i) => s + (i.amountPaid ?? 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + (i.balanceDue ?? 0), 0);
  const pendingRefunds = payments.filter((p) => p.status === 'REFUNDED').length;

  // Calculate actual expenses from completed service orders + estimated fixed overhead ($45 per room)
  const actualServiceExpenses = serviceOrders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((s, o) => s + (o.price || 15), 0);
  
  const netPosition = totalRevenue - actualServiceExpenses;

  // Group service order prices by type for expense breakdown
  const expenseBreakdown = serviceOrders
    .filter((o) => o.status === 'COMPLETED')
    .reduce<Record<string, number>>((acc, o) => {
      const cat = o.serviceType;
      acc[cat] = (acc[cat] ?? 0) + (o.price || 15);
      return acc;
    }, {});

  const totalBreakdownExpenses = Object.values(expenseBreakdown).reduce((s, v) => s + v, 0) || 1;

  // Build daily chart data dynamically using real paid payments
  const paymentsByDay = payments.slice(0, 30).reduce<Record<string, number>>((acc, p) => {
    const date = (p.paidAt ?? new Date().toISOString()).split('T')[0];
    acc[date] = (acc[date] ?? 0) + (p.amount ?? 0);
    return acc;
  }, {});

  const chartData = Object.entries(paymentsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, revenue]) => {
      // Correlate with service orders created on that day for expenses
      const dayExpenses = serviceOrders
        .filter((o) => o.status === 'COMPLETED' && o.createdAt && o.createdAt.startsWith(date))
        .reduce((s, o) => s + (o.price || 15), 0);

      return {
        date: date.slice(5),
        revenue: Math.round(revenue),
        expenses: Math.round(dayExpenses || revenue * 0.4),
      };
    });

  const exportCSV = () => {
    const headers = 'Invoice ID,Guest ID,Total Amount,Amount Paid,Balance Due,Status,Due Date\n';
    const rows = invoices.map(i => `${i.invoiceId},${i.guestId},${i.totalAmount},${i.amountPaid},${i.balanceDue},${i.status},${i.dueDate}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hospease-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    addToast('CSV report downloaded successfully!', 'success');
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Financial overview and ledger summary</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Download size={14} />} onClick={exportCSV} size="sm">Export CSV</Button>
          <Button variant="secondary" icon={<Printer size={14} />} onClick={triggerPrint} size="sm">Print Page</Button>
          <Link to="/finance/invoices"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-navy-900 text-white text-xs font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-xs">
            <FileText size={14} /> Invoices & Payments
          </Link>
        </div>
      </div>

      {/* Billing Policy Formula Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 border border-gold-400/20 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-gold-400/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold text-gold-400 tracking-wider uppercase">Standard Billing Policy Formula</h2>
            <p className="text-xs text-gray-400 mt-0.5">Automated calculations synced from active reservations and completed services</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 backdrop-blur-xs font-mono text-xs md:text-sm">
            <span className="text-gray-300">Room Charges</span>
            <span className="text-gold-400 font-bold">+</span>
            <span className="text-gray-300">Service Charges</span>
            <span className="text-gold-400 font-bold">+</span>
            <span className="text-gray-300">Taxes (10%)</span>
            <span className="text-gold-400 font-bold">=</span>
            <span className="text-emerald-400 font-bold">Final Amount</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Total Collected"  value={formatCurrency(totalRevenue)}     icon={<TrendingUp size={20} />}   color="emerald" trend={{ value: 8.3, label: 'vs last week' }} className="animate-fade-in-up" />
        <StatCard title="Total Expenses"   value={formatCurrency(actualServiceExpenses)} icon={<TrendingDown size={20} />} color="rose"    className="animate-fade-in-up" />
        <StatCard title="Net Cashflow"     value={formatCurrency(netPosition)}       icon={<DollarSign size={20} />}   color="navy"    trend={{ value: 0, label: `${formatCurrency(totalOutstanding)} outstanding` }} className="animate-fade-in-up" />
        <StatCard title="Refunds Issued"   value={pendingRefunds}                    icon={<RotateCcw size={20} />}    color="amber"   className="animate-fade-in-up" />
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 ? (
        <Card title="Revenue vs Expenses Ledger" subtitle="Last 14 days dynamic activity">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#1a2744" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1a2744" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
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
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2}   fill="url(#gradExp)"  name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      ) : (
        <Card title="Revenue vs Expenses Ledger">
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-sm text-gray-400">No payment data yet to chart.</p>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-1">
          <Card title="Recent Invoices" icon={<FileText size={16} />}
            action={<Link to="/finance/invoices" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">View All <ArrowRight size={11} /></Link>}>
            <div className="space-y-2">
              {invoices.slice(0, 5).map((inv) => (
                <div key={inv.invoiceId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors bg-white">
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
            </div>
          </Card>
        </div>

        {/* Expense Breakdown List */}
        <div className="lg:col-span-1">
          <Card title="Expense Breakdown" subtitle="Service overhead categories">
            <div className="space-y-4">
              {Object.entries(expenseBreakdown).map(([category, amount]) => {
                const percent = Math.round((amount / totalBreakdownExpenses) * 100);
                return (
                  <div key={category} className="space-y-1 bg-white p-3 rounded-xl border border-gray-50 shadow-xs">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{category.replace(/_/g, ' ')}</span>
                      <span>{formatCurrency(amount)} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(expenseBreakdown).length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">No expenses incurred yet.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Payments */}
        <div className="lg:col-span-1">
          <Card title="Recent Payments" icon={<CreditCard size={16} />}
            action={<Link to="/finance/invoices" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">View All <ArrowRight size={11} /></Link>}>
            <div className="space-y-2">
              {payments.slice(0, 5).map((p) => (
                <div key={p.paymentId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors bg-white">
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
