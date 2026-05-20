import { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { TrendingUp, Hotel, Star, DollarSign } from 'lucide-react';
import { kpisApi } from '../../api/reporting';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function KPIs() {
  const [period, setPeriod] = useState<7 | 14 | 30>(30);

  const { data: kpis = [] } = useQuery({ queryKey: ['kpis'], queryFn: kpisApi.getAll });

  const data = kpis.slice(0, period);
  const latest = data[data.length - 1];
  const first = data[0];

  const avgValue = data.length > 0
    ? Math.round(data.reduce((s, k) => s + k.currentValue, 0) / data.length * 10) / 10
    : 0;

  const avgTarget = data.length > 0
    ? Math.round(data.reduce((s, k) => s + k.target, 0) / data.length * 10) / 10
    : 0;

  const trendData = data.map((k, i) => ({
    date: `D${i + 1}`,
    current: k.currentValue,
    target: k.target,
  }));

  const radarData = data.length > 0
    ? [
        { metric: 'Current vs Target', value: avgTarget > 0 ? Math.round((avgValue / avgTarget) * 100) : 0 },
        { metric: 'KPI Coverage', value: Math.min(100, kpis.length * 10) },
        { metric: 'Avg Performance', value: Math.min(100, Math.round(avgValue)) },
        { metric: 'Target Met', value: data.filter((k) => k.currentValue >= k.target).length > 0 ? Math.round((data.filter((k) => k.currentValue >= k.target).length / data.length) * 100) : 0 },
        { metric: 'F&B Attach', value: 72 },
        { metric: 'Spa Attach', value: 48 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Executive hospitality performance metrics</p>
        </div>
        <div className="flex p-1 bg-gray-100 rounded-lg gap-1">
          {([7, 14, 30] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${period === p ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500'}`}>{p}D</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Avg KPI Value" value={formatPercent(avgValue)} icon={<Hotel size={20} />} color="navy"
          trend={latest && first ? { value: Math.round((latest.currentValue - first.currentValue) * 10) / 10, label: 'period change' } : undefined} />
        <StatCard title="Avg Target" value={formatCurrency(avgTarget)} icon={<DollarSign size={20} />} color="gold" />
        <StatCard title="KPIs Tracked" value={kpis.length} icon={<TrendingUp size={20} />} color="emerald" />
        <StatCard title="Targets Met" value={data.filter((k) => k.currentValue >= k.target).length} icon={<Star size={20} />} color="blue" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* KPI trend */}
        <Card title="KPI Trends" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={period === 7 ? 0 : period === 14 ? 1 : 4} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="current" stroke="#1a2744" strokeWidth={2} dot={false} name="Current Value" />
              <Line yAxisId="right" type="monotone" dataKey="target" stroke="#c9a84c" strokeWidth={2} dot={false} name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar */}
        {radarData.length > 0 && (
          <Card title="Performance Index" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Radar name="Score" dataKey="value" stroke="#1a2744" fill="#1a2744" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Detail table */}
      <Card title="KPI Summary Table" subtitle={`Showing ${data.length} KPIs`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['KPI Name', 'Definition', 'Reporting Period', 'Current Value', 'Target', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((kpi) => {
                const met = kpi.currentValue >= kpi.target;
                return (
                  <tr key={kpi.kpiId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{kpi.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{kpi.definition}</td>
                    <td className="px-4 py-3 text-gray-700">{kpi.reportingPeriod}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{kpi.currentValue}</td>
                    <td className="px-4 py-3 text-gray-700">{kpi.target}</td>
                    <td className={`px-4 py-3 font-bold ${met ? 'text-emerald-600' : 'text-rose-500'}`}>{met ? '↑ Met' : '↓ Below'}</td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No KPI data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
