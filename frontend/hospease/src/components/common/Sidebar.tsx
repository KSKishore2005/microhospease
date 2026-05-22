import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Calendar, FileText, Bell, Star, Key, MessageSquare,
  ClipboardList, BedDouble,
  ShoppingCart, Leaf, Layers,
  DollarSign, RotateCcw, BarChart2, Users, Clock, TrendingUp, Hotel,
  Settings, Shield, DownloadCloud, PieChart, Table2, Award,
  LogOut, ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react';
import type { UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';
import { hospeaseLogo } from './HospEaseLogo';

interface NavItem { label: string; path: string; icon: React.ReactNode; }

const navConfig: Record<UserRole, NavItem[]> = {
  GUEST: [
    { label: 'Dashboard',        path: '/guest',                 icon: <Home size={17} /> },
    { label: 'My Reservations',  path: '/guest/reservations',    icon: <Calendar size={17} /> },
    { label: 'My Invoices',      path: '/guest/invoices',        icon: <FileText size={17} /> },
    { label: 'Service Requests', path: '/guest/service-requests',icon: <Bell size={17} /> },
    { label: 'Loyalty Points',   path: '/guest/loyalty',         icon: <Star size={17} /> },
  ],
  FRONT_DESK: [
    { label: 'Dashboard',    path: '/frontdesk',               icon: <Home size={17} /> },
    { label: 'Reservations', path: '/frontdesk/reservations',  icon: <Calendar size={17} /> },
    { label: 'Check In/Out', path: '/frontdesk/checkinout',    icon: <Key size={17} /> },
    { label: 'Communications',path: '/frontdesk/communications',icon: <MessageSquare size={17} /> },
  ],
  HOUSEKEEPING: [
    { label: 'Dashboard',   path: '/housekeeping',             icon: <Home size={17} /> },
    { label: 'Task List',   path: '/housekeeping/tasks',       icon: <ClipboardList size={17} /> },
    { label: 'Room Status', path: '/housekeeping/room-status', icon: <BedDouble size={17} /> },
  ],
  SERVICE_STAFF: [
    { label: 'Dashboard',   path: '/servicestaff',            icon: <Home size={17} /> },
    { label: 'F&B Orders',  path: '/servicestaff/orders',     icon: <ShoppingCart size={17} /> },
    { label: 'Spa & Gym',   path: '/servicestaff/spa-gym',    icon: <Leaf size={17} /> },
    { label: 'Fulfillment', path: '/servicestaff/fulfillment',icon: <Layers size={17} /> },
  ],
  FINANCE: [
    { label: 'Dashboard',          path: '/finance',           icon: <Home size={17} /> },
    { label: 'Invoices & Payments',path: '/finance/invoices',  icon: <DollarSign size={17} /> },
    { label: 'Refunds',            path: '/finance/refunds',   icon: <RotateCcw size={17} /> },
    { label: 'Reconciliation',     path: '/finance/reconciliation', icon: <BarChart2 size={17} /> },
  ],
  MANAGER: [
    { label: 'Dashboard',         path: '/manager',             icon: <Home size={17} /> },
    { label: 'Staff Scheduling',  path: '/manager/scheduling',  icon: <Clock size={17} /> },
    { label: 'Performance',       path: '/manager/performance', icon: <TrendingUp size={17} /> },
    { label: 'Occupancy Reports', path: '/manager/occupancy',   icon: <Hotel size={17} /> },
  ],
  ADMIN: [
    { label: 'Dashboard',      path: '/admin',          icon: <Home size={17} /> },
    { label: 'Users & Roles',  path: '/admin/users',    icon: <Users size={17} /> },
    { label: 'Property Config',path: '/admin/property', icon: <Settings size={17} /> },
    { label: 'Audit Package',  path: '/admin/audit',    icon: <Shield size={17} /> },
  ],
  REPORTING: [
    { label: 'Dashboard',          path: '/reporting',            icon: <Home size={17} /> },
    { label: 'KPIs',               path: '/reporting/kpis',       icon: <PieChart size={17} /> },
    { label: 'Scheduled Reports',  path: '/reporting/scheduled',  icon: <Table2 size={17} /> },
    { label: 'Compliance Exports', path: '/reporting/compliance', icon: <Award size={17} /> },
  ],
};

const roleLabels: Record<UserRole, string> = {
  GUEST: 'Guest Portal', FRONT_DESK: 'Front Desk', HOUSEKEEPING: 'Housekeeping',
  SERVICE_STAFF: 'Service Staff', FINANCE: 'Finance', MANAGER: 'Manager Panel',
  ADMIN: 'Admin Panel', REPORTING: 'Analytics',
};

const roleColors: Record<UserRole, string> = {
  GUEST: 'from-amber-500 to-yellow-400',
  FRONT_DESK: 'from-emerald-500 to-teal-400',
  HOUSEKEEPING: 'from-blue-500 to-cyan-400',
  SERVICE_STAFF: 'from-orange-500 to-amber-400',
  FINANCE: 'from-teal-500 to-green-400',
  MANAGER: 'from-purple-500 to-violet-400',
  ADMIN: 'from-rose-500 to-pink-400',
  REPORTING: 'from-indigo-500 to-blue-400',
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2);
  return <span className="text-xs font-bold text-white">{initials.toUpperCase()}</span>;
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;
  const items = navConfig[user.role as UserRole] ?? [];
  const gradient = roleColors[user.role as UserRole] ?? 'from-navy-500 to-navy-700';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 flex-shrink-0 z-40',
        'bg-navy-950 border-r border-white/5',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* ── Logo ────────────────────────────────── */}
      <div className={cn(
        'flex items-center border-b border-white/8 flex-shrink-0 h-[64px]',
        collapsed ? 'justify-center px-3' : 'px-5 gap-3'
      )}>
        <div className="relative flex-shrink-0">
          <img
            src={hospeaseLogo}
            alt="HospEase"
            className="w-8 h-8 rounded-xl object-contain"
          />
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 blur-sm pointer-events-none" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-none tracking-wide">HospEase</p>
            <p className="text-gold-400 text-[11px] mt-0.5 font-medium truncate">{roleLabels[user.role as UserRole]}</p>
          </div>
        )}
      </div>

      {/* ── Navigation ──────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path.split('/').length === 2}
            className={({ isActive }) =>
              cn(
                'nav-item group relative',
                isActive ? 'nav-item-active' : 'nav-item-inactive',
                collapsed && 'justify-center px-0'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                {/* Gold left indicator for active item */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gold-400 shadow-sm" style={{ boxShadow: '0 0 6px rgba(201,168,76,0.5)' }} />
                )}
                <span className={cn(
                  'flex-shrink-0 w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-colors duration-150',
                  isActive
                    ? `bg-gradient-to-br ${gradient} shadow-sm`
                    : 'group-hover:bg-white/8'
                )}>
                  <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
                </span>
                {!collapsed && (
                  <span className="truncate text-[13px]">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom user section ──────────────────── */}
      <div className="border-t border-white/8 p-2.5 space-y-1 flex-shrink-0">
        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              `bg-gradient-to-br ${gradient}`
            )}>
              <Initials name={user.name ?? 'U'} />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate leading-tight">{user.name}</p>
              <p className="text-gray-500 text-[11px] truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-medium',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={15} />
          {!collapsed && 'Sign Out'}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all text-xs font-medium',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
