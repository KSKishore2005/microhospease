import { Hotel, TrendingUp, DollarSign } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import { roomsApi } from '../../api/rooms';
import { reservationsApi } from '../../api/reservations';
import { kpisApi } from '../../api/reporting';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function OccupancyReports() {
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: roomsApi.getAll });
  const { data: reservations = [] } = useQuery({ queryKey: ['reservations'], queryFn: reservationsApi.getAll });
  const { data: kpis = [] } = useQuery({ queryKey: ['kpis'], queryFn: kpisApi.getAll });

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100 * 10) / 10 : 0;

  const avgRate = rooms.length > 0
    ? Math.round(rooms.reduce((s, r) => s + r.ratePerNight, 0) / rooms.length)
    : 0;

  // KPI trend data
  const kpiTrend = kpis.slice(0, 30).map((k, i) => ({
    date: `D${i + 1}`,
    occ: k.currentValue,
    target: k.target,
  }));

  // Room type occupancy
  const roomTypes = ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE'];
  const roomTypeData = roomTypes.map((type) => {
    const typeRooms = rooms.filter((r) => r.type === type);
    const occupiedCount = typeRooms.filter((r) => r.status === 'OCCUPIED').length;
    const total = typeRooms.length;
    const occ = total > 0 ? Math.round((occupiedCount / total) * 100) : 0;
    return { type, total, occupied: occupiedCount, occ };
  }).filter((r) => r.total > 0);

  const confirmedRevenue = reservations
    .filter((r) => r.status !== 'CANCELLED')
    .reduce((s, r) => {
      const nights = Math.max(1, Math.ceil((new Date(r.checkOutDate).getTime() - new Date(r.checkInDate).getTime()) / 86400000));
      return s + r.ratePerNight * nights;
    }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Occupancy Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Room occupancy and revenue analysis</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Current Occupancy" value={formatPercent(occupancyRate)} icon={<Hotel size={20} />} color="navy" trend={{ value: 3.2, label: 'vs prior period' }} />
        <StatCard title="Avg Room Rate" value={formatCurrency(avgRate)} icon={<DollarSign size={20} />} color="gold" trend={{ value: 2.7, label: 'vs prior period' }} />
        <StatCard title="Total Revenue" value={formatCurrency(confirmedRevenue)} icon={<TrendingUp size={20} />} color="emerald" trend={{ value: 5.1, label: 'vs prior period' }} />
        <StatCard title="Total Rooms" value={totalRooms} icon={<Hotel size={20} />} color="blue" />
      </div>

      {/* KPI trend */}
      {kpiTrend.length > 0 && (
        <Card title="KPI Trend">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={kpiTrend}>
              <defs>
                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a2744" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1a2744" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="occ" stroke="#1a2744" fill="url(#occGrad)" strokeWidth={2} name="Current Value" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* KPI comparison */}
        {kpiTrend.length > 0 && (
          <Card title="KPI vs Target Trend">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={kpiTrend.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="occ" stroke="#1a2744" strokeWidth={2} dot={false} name="Current" />
                <Line type="monotone" dataKey="target" stroke="#c9a84c" strokeWidth={2} dot={false} name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Occupancy by room type */}
        <Card title="Occupancy by Room Type">
          <div className="space-y-4 mt-2">
            {roomTypeData.map((r) => (
              <div key={r.type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{r.type}</span>
                  <span className="text-gray-600">{r.occupied}/{r.total} rooms ({r.occ}%)</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full">
                  <div className={`h-2.5 rounded-full ${r.occ >= 80 ? 'bg-emerald-500' : r.occ >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${r.occ}%` }} />
                </div>
              </div>
            ))}
            {roomTypeData.length === 0 && <p className="text-sm text-gray-400">No room data available.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
