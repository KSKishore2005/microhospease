import { TrendingUp, Award, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { kpisApi } from '../../api/reporting';
import { formatPercent } from '../../utils/formatters';

export default function PerformanceMonitoring() {
  const { data: serviceOrders = [] } = useQuery({ queryKey: ['service-orders'], queryFn: serviceOrdersApi.getAll });
  const { data: kpis = [] } = useQuery({ queryKey: ['kpis'], queryFn: kpisApi.getAll });

  const totalOrders = serviceOrders.length;
  const completedOrders = serviceOrders.filter((o) => o.status === 'COMPLETED').length;
  const serviceCompletion = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  // Group service orders by type for chart
  const ordersByType = serviceOrders.reduce((acc, o) => {
    acc[o.serviceType] = (acc[o.serviceType] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(ordersByType).map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }));

  // KPI chart data
  const kpiChartData = kpis.slice(0, 8).map((k) => ({ name: k.name.slice(0, 10), score: k.currentValue, target: k.target }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
        <p className="text-sm text-gray-400 mt-0.5">Service fulfillment metrics and KPI tracking</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="KPIs Tracked" value={kpis.length} icon={<Award size={20} />} color="gold" trend={{ value: 2.3, label: 'vs last month' }} />
        <StatCard title="Service Completion" value={formatPercent(serviceCompletion)} icon={<CheckCircle size={20} />} color="emerald" />
        <StatCard title="Total Orders" value={totalOrders} icon={<Clock size={20} />} color="navy" />
        <StatCard title="Completed Orders" value={completedOrders} icon={<TrendingUp size={20} />} color="blue" />
      </div>

      {/* Service orders by type chart */}
      {chartData.length > 0 && (
        <Card title="Service Orders by Type" subtitle="Volume breakdown across all service categories">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1a2744" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* KPI performance */}
        {kpiChartData.length > 0 && (
          <Card title="KPI Performance vs Target">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={kpiChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#1a2744" radius={[4, 4, 0, 0]} name="Current" />
                <Bar dataKey="target" fill="#c9a84c" radius={[4, 4, 0, 0]} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* KPI table */}
        <Card title="KPI Details">
          <div className="space-y-3">
            {kpis.map((k) => {
              const pct = k.target > 0 ? Math.min(100, Math.round((k.currentValue / k.target) * 100)) : 0;
              return (
                <div key={k.kpiId} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{k.name}</p>
                    <span className="text-sm text-gray-600">{k.currentValue} / {k.target}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mb-2">
                    <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Achievement: {pct}%</span>
                    <span>Period: {k.reportingPeriod}</span>
                  </div>
                </div>
              );
            })}
            {kpis.length === 0 && <p className="text-sm text-gray-400">No KPIs available.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
