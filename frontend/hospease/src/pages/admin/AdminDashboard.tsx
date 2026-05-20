import { Users, Settings, Shield, Activity, ArrowRight, CheckCircle2, XCircle, Loader2, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge, { statusBadge } from '../../components/common/Badge';
import { usersApi, auditLogsApi } from '../../api/users';
import { roomsApi } from '../../api/rooms';
import { formatRelative } from '../../utils/formatters';

const roleColors: Record<string, string> = {
  ADMIN:         'bg-purple-100 text-purple-700',
  MANAGER:       'bg-blue-100   text-blue-700',
  FRONT_DESK:    'bg-emerald-100 text-emerald-700',
  HOUSEKEEPING:  'bg-amber-100  text-amber-700',
  SERVICE_STAFF: 'bg-orange-100 text-orange-700',
  FINANCE:       'bg-teal-100   text-teal-700',
  REPORTING:     'bg-indigo-100 text-indigo-700',
  GUEST:         'bg-yellow-100 text-yellow-700',
};

export default function AdminDashboard() {
  const { data: users = [],     isSuccess: usersOk,  isError: usersErr,  isLoading: usersLoading }  = useQuery({ queryKey: ['users'],      queryFn: usersApi.getAll });
  const { data: auditLogs = [], isSuccess: auditOk,  isError: auditErr,  isLoading: auditLoading }  = useQuery({ queryKey: ['audit-logs'], queryFn: auditLogsApi.getAll });
  const { data: rooms = [],     isSuccess: roomsOk,  isError: roomsErr,  isLoading: roomsLoading }  = useQuery({ queryKey: ['rooms'],      queryFn: roomsApi.getAll });

  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const recentLogs  = auditLogs.slice(0, 8);

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});
  const roleEntries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
  const maxCount    = Math.max(...Object.values(roleCounts), 1);

  const adminNav = [
    { to: '/admin/users',    icon: <Users size={22} />,    label: 'Users & Roles',          desc: 'Manage accounts & permissions',       color: 'from-navy-600 to-navy-800' },
    { to: '/admin/property', icon: <Settings size={22} />, label: 'Property Configuration', desc: 'Rooms, pricing, facilities',           color: 'from-gold-500 to-gold-600' },
    { to: '/admin/audit',    icon: <Shield size={22} />,   label: 'Audit Package',          desc: 'System logs & compliance snapshots',  color: 'from-emerald-500 to-teal-600' },
  ];

  const services = [
    { name: 'User Service',    ok: usersOk, err: usersErr, loading: usersLoading, detail: usersOk ? `${users.length} users` : 'Port 8084' },
    { name: 'Room Service',    ok: roomsOk, err: roomsErr, loading: roomsLoading, detail: roomsOk ? `${rooms.length} rooms` : 'Port 8082' },
    { name: 'Audit Service',   ok: auditOk, err: auditErr, loading: auditLoading, detail: auditOk ? `${auditLogs.length} events` : 'Port 8084' },
    { name: 'API Gateway',     ok: usersOk || roomsOk, err: !usersOk && !roomsOk && (usersErr || roomsErr), loading: false, detail: 'Port 8765' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-400 mt-0.5">System administration and configuration</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Total Users"   value={users.length}     icon={<Users size={20} />}    color="navy"    className="animate-fade-in-up" />
        <StatCard title="Active Users"  value={activeUsers}      icon={<Activity size={20} />} color="emerald" className="animate-fade-in-up" />
        <StatCard title="Total Rooms"   value={rooms.length}     icon={<Settings size={20} />} color="gold"    className="animate-fade-in-up" />
        <StatCard title="Audit Events"  value={auditLogs.length} icon={<Shield size={20} />}   color="blue"    className="animate-fade-in-up" />
      </div>

      {/* Quick nav */}
      <div className="grid sm:grid-cols-3 gap-4">
        {adminNav.map((item) => (
          <Link key={item.to} to={item.to}
            className="group relative overflow-hidden flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Role distribution */}
        <Card title="User Role Distribution" icon={<Users size={16} />}>
          <div className="space-y-3">
            {roleEntries.map(([role, count]) => {
              const pct = Math.round((count / users.length) * 100);
              const barPct = Math.round((count / maxCount) * 100);
              return (
                <div key={role} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap w-32 text-center ${roleColors[role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {role.replace('_', ' ')}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-navy-600 to-navy-400 rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-8 text-right">{count}</span>
                </div>
              );
            })}
            {roleEntries.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No users found.</p>}
          </div>
        </Card>

        {/* Recent audit activity */}
        <Card title="Recent Audit Activity" icon={<Shield size={16} />}
          action={<Link to="/admin/audit" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Full Log <ArrowRight size={11} /></Link>}>
          <div className="space-y-1">
            {recentLogs.map((log) => (
              <div key={log.auditId} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield size={12} className="text-navy-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{log.userName} · {log.resourceType} · {formatRelative(log.timestamp)}</p>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="text-center py-10">
                <Shield size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No audit logs yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* System health */}
      <Card title="Service Health" icon={<Server size={16} />}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {services.map((s) => {
            const isOnline = s.ok && !s.err;
            const isError  = s.err;
            const isLoading = s.loading;
            return (
              <div key={s.name} className={`p-4 rounded-xl border transition-all ${
                isError   ? 'bg-rose-50    border-rose-100' :
                isOnline  ? 'bg-emerald-50 border-emerald-100' :
                            'bg-gray-50    border-gray-100'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {isLoading ? (
                    <Loader2 size={13} className="animate-spin text-gray-400" />
                  ) : isError ? (
                    <XCircle size={13} className="text-rose-500" />
                  ) : isOnline ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  )}
                  <span className={`text-xs font-bold uppercase tracking-wide ${
                    isError ? 'text-rose-600' : isOnline ? 'text-emerald-600' : 'text-gray-500'
                  }`}>
                    {isLoading ? 'Checking' : isError ? 'Error' : isOnline ? 'Online' : 'Unknown'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.detail}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
