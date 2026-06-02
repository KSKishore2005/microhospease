import { Bell, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore, type AppNotification } from '../../store/notificationStore';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  REPORTING:     { label: 'Reporting',       color: 'text-indigo-700',  bg: 'bg-indigo-50  ring-1 ring-indigo-200' },
  GUEST:         { label: 'Guest',           color: 'text-yellow-700',  bg: 'bg-yellow-50  ring-1 ring-yellow-200' },
};

const roleGradients: Record<string, string> = {
  ADMIN: 'from-rose-500 to-pink-400', MANAGER: 'from-purple-500 to-violet-400',
  FRONT_DESK: 'from-emerald-500 to-teal-400', HOUSEKEEPING: 'from-blue-500 to-cyan-400',
  SERVICE_STAFF: 'from-orange-500 to-amber-400', FINANCE: 'from-teal-500 to-green-400',
  REPORTING: 'from-indigo-500 to-blue-400', GUEST: 'from-amber-500 to-yellow-400',
};

const notifTypeIcons: Record<string, string> = {
  booking: '🏨',
  service: '🛎️',
  payment: '💳',
  system: '⚙️',
  task: '📋',
  housekeeping: '🧹',
};

/**
 * Notification type × frontend role → destination route. Centralises what used
 * to be a chain of inline `if (user.role === 'X' || ...) navigate(...)` blocks
 * scattered through the click handler, so adding a new role/type only requires
 * one map entry. Returns undefined if no route is appropriate.
 */
const NOTIF_ROUTES: Record<string, Partial<Record<string, string>>> = {
  booking: {
    GUEST:       '/guest/reservations',
    FRONT_DESK:  '/frontdesk/reservations',
    MANAGER:     '/frontdesk/reservations',
    ADMIN:       '/frontdesk/reservations',
  },
  service: {
    GUEST:       '/guest/service-requests',
    FRONT_DESK:  '/frontdesk/communications',
    MANAGER:     '/frontdesk/communications',
    ADMIN:       '/frontdesk/communications',
  },
  payment: {
    GUEST:       '/guest/invoices',
    FINANCE:     '/finance/invoices',
    MANAGER:     '/finance/invoices',
    ADMIN:       '/finance/invoices',
  },
  task: {
    SERVICE_STAFF: '/servicestaff/fulfillment',
  },
  housekeeping: {
    HOUSEKEEPING: '/housekeeping/tasks',
    MANAGER:      '/housekeeping/tasks',
    ADMIN:        '/housekeeping/tasks',
  },
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
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Header() {
  const { user } = useAuthStore();
  const { addNotification, markOneRead, markAllRead, getUnread } = useNotificationStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const info = roleInfo[user?.role ?? ''] ?? { label: user?.role ?? '', color: 'text-gray-600', bg: 'bg-gray-100' };
  const gradient = roleGradients[user?.role ?? ''] ?? 'from-navy-500 to-navy-700';
  const initials = user?.name?.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';
  const unread = getUnread();

  const handleNotifClick = (n: AppNotification) => {
    markOneRead(n.id);
    setNotifOpen(false);

    if (!user) return;
    const target = NOTIF_ROUTES[n.type]?.[user.role];
    if (target) navigate(target);
  };

  // ── Polling ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      try {
        if (user.role === 'FRONT_DESK' || user.role === 'MANAGER' || user.role === 'ADMIN') {
          const orders = await serviceOrdersApi.getByStatus('PENDING');
          orders.slice(0, 5).forEach((o) =>
            addNotification({ id: `so-${o.orderId}`, title: 'New Service Request', body: o.serviceType.replace(/_/g, ' '), dot: 'bg-rose-500', createdAt: o.createdAt, type: 'service' })
          );
          const reservations = await reservationsApi.getByStatus('CONFIRMED');
          reservations.slice(0, 5).forEach((r) =>
            addNotification({ id: `res-${r.reservationId}`, title: 'Reservation Confirmed', body: `${r.guestName} — Room ${r.roomNumber}`, dot: 'bg-emerald-500', createdAt: r.createdAt, type: 'booking' })
          );
        }
        if (user.role === 'SERVICE_STAFF') {
          const orders = await serviceOrdersApi.getByAssignee(user.id);
          orders.filter(o => o.status === 'CONFIRMED').slice(0, 5).forEach((o) =>
            addNotification({ id: `mine-${o.orderId}`, title: 'Task Assigned to You', body: o.serviceType.replace(/_/g, ' '), dot: 'bg-blue-500', createdAt: o.createdAt, type: 'task' })
          );
        }
        if (user.role === 'GUEST') {
          try {
            const guestId = useAuthStore.getState().guestId;
            if (guestId) {
              const orders = await serviceOrdersApi.getByGuest(guestId);
              orders.filter(o => o.status === 'COMPLETED').slice(0, 3).forEach((o) =>
                addNotification({ id: `guest-done-${o.orderId}`, title: 'Service Completed', body: o.serviceType.replace(/_/g, ' '), dot: 'bg-emerald-500', createdAt: o.createdAt, type: 'service' })
              );
              const reservations = await reservationsApi.getByGuest(guestId);
              reservations.filter(r => r.status === 'CONFIRMED').slice(0, 3).forEach((r) =>
                addNotification({ id: `guest-res-${r.reservationId}`, title: 'Booking Confirmed', body: `Room ${r.roomNumber} — ${r.roomType}`, dot: 'bg-blue-500', createdAt: r.createdAt, type: 'booking' })
              );
            }
          } catch { /* guest service may be offline */ }
        }
        if (user.role === 'HOUSEKEEPING' || user.role === 'MANAGER' || user.role === 'ADMIN') {
          const tasks = await housekeepingApi.getByStatus('PENDING');
          tasks.slice(0, 5).forEach((t) =>
            addNotification({ id: `hk-${t.taskId}`, title: 'Housekeeping Task Pending', body: `Room ${t.roomId}`, dot: 'bg-amber-500', createdAt: t.scheduledAt, type: 'housekeeping' })
          );
        }
        if (user.role === 'FINANCE' || user.role === 'MANAGER' || user.role === 'ADMIN') {
          const invs = await invoicesApi.getByStatus('UNPAID');
          invs.slice(0, 5).forEach((i) =>
            addNotification({ id: `inv-${i.invoiceId}`, title: 'Unpaid Invoice', body: `Balance due`, dot: 'bg-teal-500', createdAt: i.issuedAt, type: 'payment' })
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

      {/* Centre — search bar removed per UX request. Spacer keeps the
          layout's space-between rhythm so date stays left, bell/user stay right. */}
      <div className="flex-1" />

      {/* Right — actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button onClick={() => setNotifOpen(!notifOpen)}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              unread.length > 0
                ? 'text-gold-600 hover:bg-gold-50 hover:text-gold-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}>
            <Bell size={17} className={unread.length > 0 ? 'bell-ring' : ''} />
            {unread.length > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                {unread.length > 9 ? '9+' : unread.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[340px] notif-panel rounded-2xl shadow-2xl z-50 animate-slide-down overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between bg-gradient-to-r from-navy-900 to-navy-800 text-white">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-gold-400" />
                  <p className="text-sm font-semibold">Notifications</p>
                  {unread.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">{unread.length}</span>
                  )}
                </div>
                {unread.length > 0 && (
                  <span onClick={markAllRead} className="text-[11px] text-gold-400 font-medium cursor-pointer hover:underline">Clear all</span>
                )}
              </div>
              <div className="divide-y divide-gray-50/80 max-h-80 overflow-y-auto bg-white/95">
                {unread.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-medium">No new notifications</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">You're all caught up!</p>
                  </div>
                ) : unread.slice(0, 10).map((n: AppNotification) => (
                  <div key={n.id} onClick={() => handleNotifClick(n)} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors group cursor-pointer">
                    <span className="text-base mt-0.5 flex-shrink-0">{notifTypeIcons[n.type ?? 'system'] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{n.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatRelativeShort(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); markOneRead(n.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all flex-shrink-0"
                      title="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              {unread.length > 0 && (
                <div className="p-2.5 border-t border-gray-100/80 text-center bg-gray-50/50">
                  <span onClick={() => { markAllRead(); setNotifOpen(false); }} className="text-[11px] text-navy-600 font-semibold cursor-pointer hover:underline">
                    Mark all as read
                  </span>
                </div>
              )}
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
