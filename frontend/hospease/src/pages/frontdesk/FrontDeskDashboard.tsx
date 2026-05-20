import { Key, MessageSquare, Calendar, Users, BedDouble, ArrowRight, Clock, CheckCircle2, LogIn, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge, { statusBadge } from '../../components/common/Badge';
import { reservationsApi } from '../../api/reservations';
import { roomsApi } from '../../api/rooms';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { formatDate, formatRelative } from '../../utils/formatters';

export default function FrontDeskDashboard() {
  const today = new Date().toISOString().split('T')[0];

  const { data: reservations = [] } = useQuery({ queryKey: ['reservations'], queryFn: reservationsApi.getAll });
  const { data: rooms = [] }        = useQuery({ queryKey: ['rooms'],        queryFn: roomsApi.getAll });
  const { data: serviceOrders = [] }= useQuery({ queryKey: ['service-orders'], queryFn: serviceOrdersApi.getAll });

  const checkIns    = reservations.filter((r) => r.checkInDate  === today && (r.status === 'CONFIRMED' || r.status === 'CHECKED_IN'));
  const checkOuts   = reservations.filter((r) => r.checkOutDate === today && r.status === 'CHECKED_IN');
  const inHouse     = reservations.filter((r) => r.status === 'CHECKED_IN');
  const pendingOrders = serviceOrders.filter((o) => o.status === 'PENDING').length;

  const available   = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const occupied    = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const cleaning    = rooms.filter((r) => r.status === 'CLEANING').length;
  const maintenance = rooms.filter((r) => r.status === 'MAINTENANCE').length;
  const occupancy   = rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0;

  const roomStatusItems = [
    { label: 'Available',   count: available,   color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Occupied',    count: occupied,    color: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700' },
    { label: 'Cleaning',    count: cleaning,    color: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700' },
    { label: 'Maintenance', count: maintenance, color: 'bg-rose-500',    bg: 'bg-rose-50',    text: 'text-rose-700' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Front Desk</h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link to="/frontdesk/checkinout"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-sm">
          <Key size={15} />
          Check In / Out
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Today's Arrivals"   value={checkIns.length}  subtitle="expected check-ins"  icon={<LogIn size={20} />}         color="emerald" trend={{ value: 12, label: 'vs yesterday' }} className="animate-fade-in-up" />
        <StatCard title="Today's Departures" value={checkOuts.length} subtitle="departures due"       icon={<LogOut size={20} />}        color="rose"    className="animate-fade-in-up" />
        <StatCard title="In-House Guests"    value={inHouse.length}   subtitle={`${occupancy}% occupancy`} icon={<Users size={20} />} color="navy"    className="animate-fade-in-up" />
        <StatCard title="Pending Requests"   value={pendingOrders}    subtitle="require attention"    icon={<MessageSquare size={20} />} color="amber"   className="animate-fade-in-up" />
      </div>

      {/* Occupancy bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Room Occupancy Today</p>
          <span className="text-2xl font-bold text-navy-900">{occupancy}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-navy-700 to-navy-500 rounded-full transition-all duration-700"
            style={{ width: `${occupancy}%` }}
          />
        </div>
        <div className="flex gap-4 mt-4">
          {roomStatusItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`} />
              <span className="text-xs text-gray-500">{item.count} {item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Arrivals */}
        <Card title="Arrivals Today" icon={<LogIn size={16} />}
          action={<Link to="/frontdesk/checkinout" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Manage <ArrowRight size={11} /></Link>}>
          <div className="space-y-3">
            {checkIns.slice(0, 6).map((r) => (
              <div key={r.reservationId} className="flex items-center justify-between hover:bg-gray-50/70 -mx-2 px-2 py-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-emerald-600">{r.guestName?.[0] ?? 'G'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.guestName}</p>
                    <p className="text-xs text-gray-400">Room {r.roomNumber} · {r.roomType}</p>
                  </div>
                </div>
                <Badge variant={statusBadge(r.status)} dot>{r.status.replace('_', ' ')}</Badge>
              </div>
            ))}
            {checkIns.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No arrivals today</p>
              </div>
            )}
          </div>
        </Card>

        {/* Departures */}
        <Card title="Departures Today" icon={<LogOut size={16} />}
          action={<Link to="/frontdesk/checkinout" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Manage <ArrowRight size={11} /></Link>}>
          <div className="space-y-3">
            {checkOuts.slice(0, 6).map((r) => (
              <div key={r.reservationId} className="flex items-center justify-between hover:bg-gray-50/70 -mx-2 px-2 py-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-rose-500">{r.guestName?.[0] ?? 'G'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.guestName}</p>
                    <p className="text-xs text-gray-400">Room {r.roomNumber}</p>
                  </div>
                </div>
                <Badge variant={statusBadge(r.status)} dot>{r.status.replace('_', ' ')}</Badge>
              </div>
            ))}
            {checkOuts.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No departures today</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent service orders */}
        <Card title="Service Requests" icon={<MessageSquare size={16} />}
          action={<Link to="/frontdesk/communications" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">View all <ArrowRight size={11} /></Link>}>
          <div className="space-y-3">
            {serviceOrders.slice(0, 5).map((order) => (
              <div key={order.orderId} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${order.status === 'PENDING' ? 'bg-rose-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{order.serviceType.replace(/_/g, ' ')}</p>
                    <Badge variant={statusBadge(order.status)}>{order.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{order.description ?? 'No description'} · {formatRelative(order.createdAt)}</p>
                </div>
              </div>
            ))}
            {serviceOrders.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No service requests</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
