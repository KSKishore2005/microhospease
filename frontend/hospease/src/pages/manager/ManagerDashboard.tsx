import { Users, TrendingUp, Hotel, Clock, Star, ArrowRight, BarChart3, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge, { statusBadge } from '../../components/common/Badge';
import { reservationsApi } from '../../api/reservations';
import { roomsApi } from '../../api/rooms';
import { staffApi } from '../../api/staff';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { kpisApi } from '../../api/reporting';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const statusColors: Record<string, string> = {
  AVAILABLE:   'bg-emerald-500',
  OCCUPIED:    'bg-blue-500',
  CLEANING:    'bg-amber-500',
  MAINTENANCE: 'bg-rose-500',
};

export default function ManagerDashboard() {
  const { data: reservations = [] } = useQuery({ queryKey: ['reservations'],   queryFn: reservationsApi.getAll });
  const { data: rooms = [] }        = useQuery({ queryKey: ['rooms'],           queryFn: roomsApi.getAll });
  const { data: staff = [] }        = useQuery({ queryKey: ['staff'],           queryFn: staffApi.getAll });
  const { data: serviceOrders = [] }= useQuery({ queryKey: ['service-orders'],  queryFn: serviceOrdersApi.getAll });
  const { data: kpis = [] }         = useQuery({ queryKey: ['kpis'],            queryFn: kpisApi.getAll });

  const activeStaff    = staff.filter((s) => s.status === 'ACTIVE').length;
  const checkedIn      = reservations.filter((r) => r.status === 'CHECKED_IN').length;
  const totalRooms     = rooms.length;
  const occupancyRate  = totalRooms > 0 ? Math.round((checkedIn / totalRooms) * 100) : 0;
  const pendingOrders  = serviceOrders.filter((o) => o.status === 'PENDING').length;
  const revenueKPI     = kpis.find((k) => k.name.toLowerCase().includes('revenue'));

  const chartData = kpis.slice(0, 12).map((k, i) => ({
    name: `D${i + 1}`,
    current: Number(k.currentValue) || 0,
    target:  Number(k.target) || 0,
  }));

  const roomGroups = [
    { label: 'Available',   count: rooms.filter((r) => r.status === 'AVAILABLE').length,   color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Occupied',    count: rooms.filter((r) => r.status === 'OCCUPIED').length,    color: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50' },
    { label: 'Cleaning',    count: rooms.filter((r) => r.status === 'CLEANING').length,    color: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50' },
    { label: 'Maintenance', count: rooms.filter((r) => r.status === 'MAINTENANCE').length, color: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Panel</h1>
          <p className="text-sm text-gray-400 mt-0.5">Operations overview and performance monitoring</p>
        </div>
        <Link to="/manager/scheduling"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-sm">
          <Clock size={15} /> Staff Scheduling
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Occupancy Rate"   value={`${occupancyRate}%`}                            icon={<Hotel size={20} />}       color="navy"    className="animate-fade-in-up" />
        <StatCard title="Revenue KPI"      value={revenueKPI ? formatCurrency(revenueKPI.currentValue) : '—'} icon={<TrendingUp size={20} />}  color="emerald" className="animate-fade-in-up" />
        <StatCard title="Active Staff"     value={activeStaff}    subtitle={`of ${staff.length} total`} icon={<Users size={20} />}       color="blue"    className="animate-fade-in-up" />
        <StatCard title="Pending Requests" value={pendingOrders}  subtitle="need attention"             icon={<Clock size={20} />}       color="amber"   className="animate-fade-in-up" />
      </div>

      {/* Occupancy meter */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-navy-300 text-sm font-medium">Current Occupancy</p>
            <p className="text-4xl font-bold mt-1">{occupancyRate}<span className="text-2xl text-navy-300">%</span></p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {roomGroups.map((g) => (
              <div key={g.label} className="text-center px-4 py-2 rounded-xl bg-white/8 border border-white/10">
                <p className="text-xl font-bold">{g.count}</p>
                <p className="text-xs text-navy-300 mt-0.5">{g.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full transition-all duration-700"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3">
          {roomGroups.map((g) => (
            <div key={g.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${g.color}`} />
              <span className="text-xs text-navy-300">{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI chart */}
      {chartData.length > 0 && (
        <Card title="KPI Performance" subtitle="Current vs Target" icon={<BarChart3 size={16} />}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="current" stroke="#1a2744" strokeWidth={2.5} dot={false} name="Current Value" />
              <Line type="monotone" dataKey="target"  stroke="#c9a84c" strokeWidth={2}   dot={false} name="Target" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Staff overview */}
        <Card title="Staff Overview" icon={<Users size={16} />}
          action={<Link to="/manager/scheduling" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Schedule <ArrowRight size={11} /></Link>}>
          <div className="space-y-2">
            {staff.slice(0, 7).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-navy-700">{(s.name ?? 'S')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.name ?? `Staff #${s.id}`}</p>
                  <p className="text-xs text-gray-400">{s.department} · {s.role?.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className="text-xs text-gray-400">{s.status}</span>
                </div>
              </div>
            ))}
            {staff.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No staff records found.</p>}
          </div>
        </Card>

        {/* KPI summary */}
        <Card title="KPI Summary" icon={<Target size={16} />}
          action={<Link to="/manager/performance" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Full Report <ArrowRight size={11} /></Link>}>
          <div className="space-y-3">
            {kpis.slice(0, 5).map((kpi) => {
              const pct = Number(kpi.target) > 0
                ? Math.min(100, Math.round((Number(kpi.currentValue) / Number(kpi.target)) * 100))
                : 0;
              const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div key={kpi.kpiId}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-800">{kpi.name}</span>
                    <span className="text-gray-400">{pct}% of target</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {kpis.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No KPIs configured yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
