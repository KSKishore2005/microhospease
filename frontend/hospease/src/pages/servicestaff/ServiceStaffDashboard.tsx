import { ShoppingCart, Clock, CheckCircle2, Leaf, ArrowRight, DollarSign, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge, { statusBadge } from '../../components/common/Badge';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { formatRelative, formatCurrency } from '../../utils/formatters';

export default function ServiceStaffDashboard() {
  const { data: restaurantOrders = [] } = useQuery({
    queryKey: ['service-orders', 'RESTAURANT'],
    queryFn: () => serviceOrdersApi.getByType('RESTAURANT'),
  });
  const { data: spaOrders = [] } = useQuery({
    queryKey: ['service-orders', 'SPA'],
    queryFn: () => serviceOrdersApi.getByType('SPA'),
  });

  const orders      = restaurantOrders;
  const pending     = orders.filter((o) => o.status === 'PENDING').length;
  const inProgress  = orders.filter((o) => o.status === 'IN_PROGRESS').length;
  const completed   = orders.filter((o) => o.status === 'COMPLETED').length;
  const confirmedSpa= spaOrders.filter((s) => s.status === 'CONFIRMED' || s.status === 'PENDING').length;

  const fbRevenue   = orders.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + (o.price ?? 0), 0);
  const spaRevenue  = spaOrders.filter((b) => b.status === 'COMPLETED').reduce((s, b) => s + (b.price ?? 0), 0);

  const liveOrders  = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const liveSpa     = spaOrders.filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING');

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Staff Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">F&B orders, spa bookings, and service fulfillment</p>
        </div>
        <div className="flex gap-2">
          <Link to="/servicestaff/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-sm">
            <ShoppingCart size={15} /> F&B Orders
          </Link>
          <Link to="/servicestaff/spa-gym"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-navy-900 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <Leaf size={15} /> Spa & Gym
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Pending Orders"  value={pending}      icon={<ShoppingCart size={20} />} color="amber"   className="animate-fade-in-up" />
        <StatCard title="In Progress"     value={inProgress}   icon={<Clock size={20} />}        color="blue"    className="animate-fade-in-up" />
        <StatCard title="Completed Today" value={completed}    icon={<CheckCircle2 size={20} />} color="emerald" className="animate-fade-in-up" />
        <StatCard title="Spa Bookings"    value={confirmedSpa} icon={<Leaf size={20} />}         color="purple"  className="animate-fade-in-up" />
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'F&B Revenue',     value: fbRevenue,              icon: '🍽️', bg: 'from-orange-500 to-amber-500' },
          { label: 'Spa Revenue',     value: spaRevenue,             icon: '💆', bg: 'from-purple-500 to-violet-500' },
          { label: 'Total Service',   value: fbRevenue + spaRevenue, icon: '💰', bg: 'from-emerald-500 to-teal-500' },
        ].map((item) => (
          <div key={item.label} className={`relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br ${item.bg} text-white`}>
            <div className="absolute -top-4 -right-4 text-5xl opacity-20">{item.icon}</div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live F&B orders */}
        <Card title="Live F&B Orders" icon={<ShoppingCart size={16} />}
          action={<Link to="/servicestaff/orders" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">POS View <ArrowRight size={11} /></Link>}>
          <div className="space-y-2">
            {liveOrders.slice(0, 5).map((order) => (
              <div key={order.orderId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-base flex-shrink-0">🍽️</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">#{String(order.orderId).slice(0, 8)}</p>
                    <p className="text-xs text-gray-400">
                      {order.roomId ? `Room ${order.roomId}` : 'Dine-in'} · {formatRelative(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={statusBadge(order.status)} dot>{order.status.replace('_', ' ')}</Badge>
                  {(order.price ?? 0) > 0 && <span className="text-xs font-bold text-gray-700">{formatCurrency(order.price)}</span>}
                </div>
              </div>
            ))}
            {liveOrders.length === 0 && (
              <div className="text-center py-10">
                <CheckCircle2 size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All orders fulfilled!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Spa bookings */}
        <Card title="Spa & Gym Bookings" icon={<Leaf size={16} />}
          action={<Link to="/servicestaff/spa-gym" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Manage <ArrowRight size={11} /></Link>}>
          <div className="space-y-2">
            {liveSpa.slice(0, 5).map((booking) => (
              <div key={booking.orderId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-base flex-shrink-0">
                    {booking.serviceType === 'SPA' ? '💆' : '🏋️'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{booking.description ?? `${booking.serviceType} Service`}</p>
                    <p className="text-xs text-gray-400">{formatRelative(booking.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={statusBadge(booking.status)} dot>{booking.status.replace('_', ' ')}</Badge>
                  {(booking.price ?? 0) > 0 && <span className="text-xs font-bold text-gray-700">{formatCurrency(booking.price)}</span>}
                </div>
              </div>
            ))}
            {liveSpa.length === 0 && (
              <div className="text-center py-10">
                <Leaf size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No active spa bookings</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
