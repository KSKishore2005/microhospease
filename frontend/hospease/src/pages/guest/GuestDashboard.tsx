import { Calendar, Star, Bell, FileText, BedDouble, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge, { statusBadge } from '../../components/common/Badge';
import { reservationsApi } from '../../api/reservations';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { guestsApi } from '../../api/guests';
import { useEffectiveGuestId } from '../../hooks/useEffectiveGuestId';
import { formatDate, formatCurrency } from '../../utils/formatters';

const tierConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  BRONZE:   { color: 'text-amber-800',  bg: 'bg-amber-50',  border: 'border-amber-200', icon: '🥉' },
  SILVER:   { color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-300',  icon: '🥈' },
  GOLD:     { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-300', icon: '🥇' },
  PLATINUM: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: '💎' },
};

export default function GuestDashboard() {
  const { effectiveGuestId: guestId, resolving } = useEffectiveGuestId();

  const { data: guest } = useQuery({
    queryKey: ['guest', guestId],
    queryFn: () => guestsApi.getById(guestId!),
    enabled: !!guestId,
  });
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations', 'guest', guestId],
    queryFn: () => reservationsApi.getByGuest(guestId!),
    enabled: !!guestId,
  });
  const { data: serviceOrders = [] } = useQuery({
    queryKey: ['service-orders', 'guest', guestId],
    queryFn: () => serviceOrdersApi.getByGuest(guestId!),
    enabled: !!guestId,
  });

  const active   = reservations.find((r) => r.status === 'CHECKED_IN');
  const upcoming = reservations.filter((r) => r.status === 'CONFIRMED' || r.status === 'PENDING');
  const activeOrders = serviceOrders.filter((o) => o.status === 'PENDING' || o.status === 'IN_PROGRESS');
  const tier = guest?.loyaltyTier ?? 'BRONZE';
  const tc   = tierConfig[tier] ?? tierConfig.BRONZE;

  if (resolving) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-2 border-navy-200 border-t-navy-700 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading your profile…</p>
      </div>
    );
  }

  const quickActions = [
    { to: '/guest/reservations', icon: <Calendar size={20} />, label: 'Book a Room',      color: 'text-navy-700 bg-navy-50 hover:bg-navy-100' },
    { to: '/guest/service-requests', icon: <Bell size={20} />, label: 'Request Service', color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
    { to: '/guest/invoices',     icon: <FileText size={20} />, label: 'View Bill',        color: 'text-teal-700 bg-teal-50 hover:bg-teal-100' },
    { to: '/guest/loyalty',      icon: <Star size={20} />,     label: 'Loyalty Status',   color: 'text-gold-700 bg-gold-50 hover:bg-gold-100' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 p-7 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-64 h-40 rounded-full bg-navy-600/40 blur-3xl" />
        </div>
        <div className="relative flex items-start justify-between flex-wrap gap-5">
          <div>
            <p className="text-navy-300 text-sm font-medium mb-1">Welcome back</p>
            <h2 className="text-3xl font-bold leading-tight">{guest?.name ?? 'Guest'}</h2>
            {tier && (
              <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${tc.bg} ${tc.color} ${tc.border}`}>
                <span>{tc.icon}</span>
                {tier} Member
              </div>
            )}
            {guest?.loyaltyPoints !== undefined && (
              <p className="text-navy-300 text-sm mt-2 flex items-center gap-1.5">
                <Sparkles size={13} />
                {guest.loyaltyPoints?.toLocaleString()} loyalty points
              </p>
            )}
          </div>
          {active && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 min-w-[220px] border border-white/15">
              <p className="text-navy-300 text-xs font-semibold uppercase tracking-wide mb-2">Current Stay</p>
              <p className="font-bold text-2xl">Room {active.roomNumber}</p>
              <p className="text-sm text-navy-200 mt-1">{active.roomType}</p>
              <p className="text-xs text-navy-300 mt-0.5">{formatCurrency(active.ratePerNight)}/night</p>
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-navy-300">Check-out</p>
                <p className="text-sm font-semibold">{formatDate(active.checkOutDate)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Loyalty Tier"  value={tier}                  subtitle={`${guest?.loyaltyPoints ?? 0} points`} icon={<Star size={20} />}     color="gold"    className="animate-fade-in-up" />
        <StatCard title="Total Stays"   value={reservations.length}   subtitle="lifetime visits"                        icon={<BedDouble size={20} />} color="navy"    className="animate-fade-in-up" />
        <StatCard title="Active Stay"   value={active ? 'Yes' : 'No'} subtitle={active ? `Room ${active.roomNumber}` : 'No active stay'} icon={<Calendar size={20} />} color="emerald" className="animate-fade-in-up" />
        <StatCard title="Upcoming"      value={upcoming.length}       subtitle="confirmed reservation(s)"               icon={<Clock size={20} />}     color="blue"    className="animate-fade-in-up" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to}
            className={`flex items-center gap-3 p-4 rounded-2xl border border-transparent hover:border-gray-200 transition-all duration-200 hover:shadow-sm group ${a.color}`}>
            <div className="flex-shrink-0">{a.icon}</div>
            <span className="text-sm font-semibold">{a.label}</span>
            <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reservations */}
        <Card
          title="My Reservations"
          action={<Link to="/guest/reservations" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">View all <ArrowRight size={11} /></Link>}
        >
          {reservations.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No reservations yet</p>
              <p className="text-xs text-gray-400 mt-1">Book your first stay below</p>
              <Link to="/guest/reservations" className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-navy-700 hover:underline">
                Browse rooms <ArrowRight size={11} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.slice(0, 4).map((r) => (
                <div key={r.reservationId} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Room {r.roomNumber} <span className="font-normal text-gray-400">— {r.roomType}</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.checkInDate)} → {formatDate(r.checkOutDate)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={statusBadge(r.status)} dot>{r.status.replace('_', ' ')}</Badge>
                    <span className="text-xs text-gray-400">{formatCurrency(r.ratePerNight)}/night</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Service orders */}
        <Card
          title="Active Service Requests"
          action={<Link to="/guest/service-requests" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">View all <ArrowRight size={11} /></Link>}
        >
          {activeOrders.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <Bell size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No active requests</p>
              <p className="text-xs text-gray-400 mt-1">Request room service, dining, or more</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 4).map((o) => (
                <div key={o.orderId} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                      <Bell size={14} className="text-navy-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{o.serviceType.replace(/_/g, ' ')}</p>
                      {o.description && <p className="text-xs text-gray-400 line-clamp-1">{o.description}</p>}
                    </div>
                  </div>
                  <Badge variant={statusBadge(o.status)} dot>{o.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
