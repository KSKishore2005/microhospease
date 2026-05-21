import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore, type AppNotification } from '../../store/notificationStore';
import { useState, useEffect, useRef } from 'react';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { reservationsApi } from '../../api/reservations';
import { housekeepingApi } from '../../api/housekeeping';
import { invoicesApi } from '../../api/invoices';

const roleInfo: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:         { label: 'Administrator',   color: 'text-purple-700',  bg: 'bg-purple-50  ring-1 ring-purple-200' },
  MANAGER:       { label: 'Manager',         color: 'text-blue-700',    bg: 'bg-blue-50    ring-1 ring-blue-200' },
  FRONT_DESK:    { label: 'Front Desk',      color: 'text-emerald-700', bg: 'bg-emerald-50 ring-1 ring-emerald-200' },
  HOUSEKEEPING:  { label: 'Housekeeping',    color: 'text-amber-700',   bg: 'bg-amber-50   ring-1 ring-amber-200' },
  SERVICE_STAFF: { label: 'Service Staff',   color: 'text-orange-700',  bg: 'bg-orange-50  ring-1 ring-orange-200' },
  FINANCE:       { label: 'Finance',         color: 'text-teal-700',    bg: 'bg-teal-50    ring-1 ring-teal-200' },
  REPORTING:     { label: 'Analytics',       color: 'text-indigo-700',  bg: 'bg-indigo-50  ring-1 ring-indigo-200' },
  GUEST:         { label: 'Guest',           color: 'text-yellow-700',  bg: 'bg-yellow-50  ring-1 ring-yellow-200' },
};

const roleGradients: Record<string, string> = {
  ADMIN: 'from-rose-500 to-pink-400', MANAGER: 'from-purple-500 to-violet-400',
  FRONT_DESK: 'from-emerald-500 to-teal-400', HOUSEKEEPING: 'from-blue-500 to-cyan-400',
  SERVICE_STAFF: 'from-orange-500 to-amber-400', FINANCE: 'from-teal-500 to-green-400',
  REPORTING: 'from-indigo-500 to-blue-400', GUEST: 'from-amber-500 to-yellow-400',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatHeaderDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatRelativeShort(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function Header() {
  const { user } = useAuthStore();
  const { notifications, addNotification, markAllRead, getUnread } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const info = roleInfo[user?.role ?? ''] ?? { label: user?.role ?? '', color: 'text-gray-600', bg: 'bg-gray-100' };
  const gradient = roleGradients[user?.role ?? ''] ?? 'from-navy-500 to-navy-700';
  const initials = user?.name?.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';
  const unread = getUnread();

  // ── Polling ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      try {
        if (user.role === 'FRONT_DESK' || user.role === 'MANAGER' || user.role === 'ADMIN') {
          const orders = await serviceOrdersApi.getByStatus('PENDING');
          orders.slice(0, 5).forEach((o) =>
            addNotification({ id: `so-${o.orderId}`, title: 'New Service Request', body: o.serviceType.replace(/_/g, ' '), dot: 'bg-rose-500', createdAt: o.createdAt })
          );
          const reservations = await reservationsApi.getByStatus('CONFIRMED');
          reservations.slice(0, 5).forEach((r) =>
            addNotification({ id: `res-${r.reservationId}`, title: 'Reservation Confirmed', body: `${r.guestName} — Room ${r.roomNumber}`, dot: 'bg-emerald-500', createdAt: r.createdAt })
          );
        }
        if (user.role === 'SERVICE_STAFF') {
          const orders = await serviceOrdersApi.getByAssignee(user.id);
          orders.filter(o => o.status === 'CONFIRMED').slice(0, 5).forEach((o) =>
            addNotification({ id: `mine-${o.orderId}`, title: 'Task Assigned to You', body: o.serviceType.replace(/_/g, ' '), dot: 'bg-blue-500', createdAt: o.createdAt })
          );
        }
        if (user.role === 'HOUSEKEEPING' || user.role === 'MANAGER' || user.role === 'ADMIN') {
          const tasks = await housekeepingApi.getByStatus('PENDING');
          tasks.slice(0, 5).forEach((t) =>
            addNotification({ id: `hk-${t.taskId}`, title: 'Housekeeping Task Pending', body: `Room ${t.roomId}`, dot: 'bg-amber-500', createdAt: t.scheduledAt })
          );
        }
        if (user.role === 'FINANCE' || user.role === 'MANAGER' || user.role === 'ADMIN') {
          const invs = await invoicesApi.getByStatus('UNPAID');
          invs.slice(0, 5).forEach((i) =>
            addNotification({ id: `inv-${i.invoiceId}`, title: 'Unpaid Invoice', body: `Balance due`, dot: 'bg-teal-500', createdAt: i.issuedAt })
          );
        }
      } catch { /* silent — services may be offline */ }
    };

    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [user, addNotification]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-[64px] bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 flex items-center justify-between gap-4">
      {/* Left — greeting */}
      <div className="hidden sm:block min-w-0">
        <p className="text-xs text-gray-400 font-medium">{formatHeaderDate()}</p>
        <h2 className="text-sm font-semibold text-gray-800 leading-tight truncate">
          {getGreeting()}, <span className="text-navy-900">{user?.name?.split(' ')[0]}</span>
        </h2>
      </div>

      {/* Centre — search */}
      <div className="flex-1 max-w-xs hidden md:block">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input placeholder="Search anything..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400 transition-all" />
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Bell size={17} />
            {unread.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-rose-500 rounded-full ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white">
                {unread.length > 9 ? '9+' : unread.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-scale-in">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Notifications {unread.length > 0 && <span className="ml-1 text-xs text-rose-500">({unread.length} new)</span>}</p>
                <span onClick={markAllRead} className="text-xs text-navy-600 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {unread.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">No new notifications</p>
                ) : unread.slice(0, 8).map((n: AppNotification) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatRelativeShort(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-50 text-center">
                <span onClick={() => { markAllRead(); setNotifOpen(false); }} className="text-xs text-navy-600 font-medium cursor-pointer hover:underline">Clear all</span>
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-100 ml-1">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 leading-none">{user?.name?.split(' ')[0]}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${info.bg} ${info.color} mt-0.5 inline-block`}>{info.label}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
