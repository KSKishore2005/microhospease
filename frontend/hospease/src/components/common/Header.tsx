import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

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
  ADMIN: 'from-rose-500 to-pink-400',
  MANAGER: 'from-purple-500 to-violet-400',
  FRONT_DESK: 'from-emerald-500 to-teal-400',
  HOUSEKEEPING: 'from-blue-500 to-cyan-400',
  SERVICE_STAFF: 'from-orange-500 to-amber-400',
  FINANCE: 'from-teal-500 to-green-400',
  REPORTING: 'from-indigo-500 to-blue-400',
  GUEST: 'from-amber-500 to-yellow-400',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatHeaderDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function Header() {
  const { user } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const info = roleInfo[user?.role ?? ''] ?? { label: user?.role ?? '', color: 'text-gray-600', bg: 'bg-gray-100' };
  const gradient = roleGradients[user?.role ?? ''] ?? 'from-navy-500 to-navy-700';
  const initials = user?.name?.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

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
          <input
            placeholder="Search anything..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-400 transition-all"
          />
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-scale-in">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <span className="text-xs text-navy-600 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { title: 'New reservation confirmed', time: '2m ago', dot: 'bg-emerald-500' },
                  { title: 'Room 204 needs cleaning', time: '15m ago', dot: 'bg-amber-500' },
                  { title: 'Payment received — INV-0042', time: '1h ago', dot: 'bg-blue-500' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-50 text-center">
                <span className="text-xs text-navy-600 font-medium cursor-pointer hover:underline">View all notifications</span>
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
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${info.bg} ${info.color} mt-0.5 inline-block`}>
              {info.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
