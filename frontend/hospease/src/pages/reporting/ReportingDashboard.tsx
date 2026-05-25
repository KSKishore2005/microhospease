import { BarChart3, PieChart, Table2, Award, TrendingUp, ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import { kpisApi, reportsApi, auditPackagesApi } from '../../api/reporting';
import { invoicesApi } from '../../api/invoices';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function ReportingDashboard() {
  const { data: kpis = [], isLoading: kpisLoading }          = useQuery({ queryKey: ['kpis'],           queryFn: kpisApi.getAll });
  const { data: reports = [], isLoading: reportsLoading }       = useQuery({ queryKey: ['reports'],        queryFn: reportsApi.getAll });
  const { data: auditPackages = [], isLoading: auditLoading } = useQuery({ queryKey: ['audit-packages'], queryFn: auditPackagesApi.getAll });
  const { data: invoices = [], isLoading: invoicesLoading }      = useQuery({ queryKey: ['invoices'],       queryFn: invoicesApi.getAll });

  if (kpisLoading || reportsLoading || auditLoading || invoicesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-2 border-navy-200 border-t-navy-700 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const avgKPI  = kpis.length > 0
    ? Math.round((kpis.reduce((s, k) => s + Number(k.currentValue), 0) / kpis.length) * 10) / 10
    : 0;
  const totalRev = invoices.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0);

  const kpiTrend = kpis.slice(0, 20).map((k, i) => ({
    name: `D${i + 1}`,
    value: Number(k.currentValue) || 0,
    target: Number(k.target) || 0,
  }));

  const revBreakdown = invoices.slice(0, 8).map((inv, i) => ({
    date: inv.issuedAt ? inv.issuedAt.slice(5, 10) : `D${i + 1}`,
    Revenue: inv.totalAmount ?? 0,
  }));

  const quickLinks = [
    { to: '/reporting/kpis',       icon: <PieChart size={22} />,  label: 'KPI Dashboard',       desc: 'Executive hospitality metrics',      color: 'from-navy-600 to-navy-800' },
    { to: '/reporting/scheduled',  icon: <Table2 size={22} />,    label: 'Scheduled Reports',   desc: 'Auto-generated report schedules',    color: 'from-gold-500 to-gold-600' },
    { to: '/reporting/compliance', icon: <Award size={22} />,     label: 'Compliance Exports',  desc: 'Tax, lodging & regulatory exports',  color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporting Portal</h1>
        <p className="text-sm text-gray-400 mt-0.5">Executive dashboards, KPIs, and compliance exports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Avg KPI Value"    value={formatPercent(avgKPI)} icon={<TrendingUp size={20} />} color="navy"    trend={{ value: 3.8, label: 'vs prior period' }} className="animate-fade-in-up" />
        <StatCard title="Invoice Revenue"  value={formatCurrency(totalRev)} icon={<BarChart3 size={20} />} color="emerald" className="animate-fade-in-up" />
        <StatCard title="Total Reports"    value={reports.length}        icon={<FileText size={20} />}   color="gold"    className="animate-fade-in-up" />
        <StatCard title="Audit Packages"   value={auditPackages.length}  icon={<Award size={20} />}      color="purple"  className="animate-fade-in-up" />
      </div>

      {/* Quick navigation */}
      <div className="grid sm:grid-cols-3 gap-4">
        {quickLinks.map((item) => (
          <Link key={item.to} to={item.to}
            className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* KPI trend */}
        {kpiTrend.length > 0 ? (
          <Card title="KPI Value Trend" subtitle="Current vs Target">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={kpiTrend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#1a2744" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#1a2744" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#c9a84c" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#c9a84c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11 }} />
                <Area type="monotone" dataKey="value"  stroke="#1a2744" strokeWidth={2.5} fill="url(#kpiGrad)"    name="Current" />
                <Area type="monotone" dataKey="target" stroke="#c9a84c" strokeWidth={1.5} fill="url(#targetGrad)" name="Target" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card title="KPI Value Trend">
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-gray-400">No KPI data available yet.</p>
            </div>
          </Card>
        )}

        {/* Revenue breakdown */}
        {revBreakdown.length > 0 ? (
          <Card title="Invoice Revenue" subtitle="Recent invoices">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revBreakdown} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 11 }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Bar dataKey="Revenue" fill="#1a2744" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card title="Invoice Revenue">
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-gray-400">No invoice data available yet.</p>
            </div>
          </Card>
        )}
      </div>

      {/* KPI details */}
      {kpis.length > 0 && (
        <Card title="KPI Performance Details" icon={<PieChart size={16} />}
          action={<Link to="/reporting/kpis" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Full KPIs <ArrowRight size={11} /></Link>}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kpis.slice(0, 6).map((kpi) => {
              const pct = Number(kpi.target) > 0
                ? Math.min(100, Math.round((Number(kpi.currentValue) / Number(kpi.target)) * 100))
                : 0;
              const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div key={kpi.kpiId} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-800 truncate">{kpi.name}</p>
                    <span className="text-xs font-bold text-gray-600">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>{Number(kpi.currentValue).toFixed(1)}</span>
                    <span>Target: {Number(kpi.target).toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
