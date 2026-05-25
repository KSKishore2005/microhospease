import { Users, TrendingUp, Hotel, Clock, ArrowRight, BarChart3, Target, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { reservationsApi } from '../../api/reservations';
import { roomsApi } from '../../api/rooms';
import { staffApi, shiftsApi } from '../../api/staff';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { usersApi } from '../../api/users';
import { kpisApi } from '../../api/reporting';
import { formatCurrency } from '../../utils/formatters';
import { useWorkflowStore } from '../../store/workflowStore';
import { useToastStore } from '../../store/toastStore';

export default function ManagerDashboard() {
  const { data: reservations = [], isLoading: resLoading } = useQuery({ queryKey: ['reservations'],    queryFn: reservationsApi.getAll });
  const { data: rooms = [], isLoading: roomsLoading }        = useQuery({ queryKey: ['rooms'],            queryFn: roomsApi.getAll });
  const { data: staff = [], isLoading: staffLoading }        = useQuery({ queryKey: ['staff'],            queryFn: staffApi.getAll });
  const { data: shifts = [], isLoading: shiftsLoading }       = useQuery({ queryKey: ['shifts'],           queryFn: shiftsApi.getAll });
  const { data: serviceOrders = [], isLoading: ordersLoading }= useQuery({ queryKey: ['service-orders'],  queryFn: serviceOrdersApi.getAll });
  const { data: kpis = [], isLoading: kpisLoading }         = useQuery({ queryKey: ['kpis'],            queryFn: kpisApi.getAll });
  const { data: allUsers = [], isLoading: usersLoading }     = useQuery({ queryKey: ['users'],           queryFn: usersApi.getAll });

  const queryClient = useQueryClient();
  const { customStatuses, setStatus } = useWorkflowStore();
  const addToast = useToastStore((s) => s.addToast);

  const [assignMap, setAssignMap] = useState<Record<string, string>>({});

  const assignMutation = useMutation({
    mutationFn: ({ orderId, userId }: { orderId: string; userId: string }) =>
      serviceOrdersApi.assign(orderId, userId),
    onSuccess: (_, { orderId, userId }) => {
      const staffMember = allUsers.find((u) => String(u.userId) === String(userId));
      setStatus(orderId, 'STAFF_ASSIGNED', { assignedUserId: userId, assignedUserName: staffMember?.name });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      addToast(`Task assigned to ${staffMember?.name ?? 'staff'}`, 'success');
    },
  });

  if (resLoading || roomsLoading || staffLoading || shiftsLoading || ordersLoading || kpisLoading || usersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-2 border-navy-200 border-t-navy-700 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const handleVerify = (orderId: string) => {
    setStatus(orderId, 'MANAGER_VERIFIED');
    addToast('Task verified — Front Desk can now close it', 'success');
  };

  const serviceStaff = allUsers.filter(
    (u) =>
      (u.role === 'RESTAURANT_SERVICE_STAFF' ||
       u.role === 'HOUSEKEEPING_STAFF' ||
       u.role === 'FRONT_DESK_STAFF') &&
      u.status === 'ACTIVE'
  );

  const activeStaffCount = staff.filter((s) => s.status === 'ACTIVE').length;
  const checkedIn     = reservations.filter((r) => r.status === 'CHECKED_IN').length;
  const totalRooms    = rooms.length;
  const occupancyRate = totalRooms > 0 ? Math.round((checkedIn / totalRooms) * 100) : 0;
  const revenueKPI    = kpis.find((k) => k.name.toLowerCase().includes('revenue'));

  const chartData = kpis.slice(0, 12).map((k, i) => ({
    name: `D${i + 1}`, current: Number(k.currentValue) || 0, target: Number(k.target) || 0,
  }));

  const roomGroups = [
    { label: 'Available',   count: rooms.filter((r) => r.status === 'AVAILABLE').length,   color: 'bg-emerald-500' },
    { label: 'Occupied',    count: rooms.filter((r) => r.status === 'OCCUPIED').length,    color: 'bg-blue-500'    },
    { label: 'Cleaning',    count: rooms.filter((r) => r.status === 'CLEANING').length,    color: 'bg-amber-500'   },
    { label: 'Maintenance', count: rooms.filter((r) => r.status === 'MAINTENANCE').length, color: 'bg-rose-500'    },
  ];

  // Active requests (not completed or cancelled)
  const activeRequests = serviceOrders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

  const getWorkflowStatusLabel = (orderId: string, dbStatus: string) => {
    const wf = customStatuses[orderId];
    if (!wf) {
      if (dbStatus === 'PENDING') return 'Pending Front Desk';
      return dbStatus.replace(/_/g, ' ');
    }
    if (wf.status === 'FORWARDED_TO_MANAGER') return 'Forwarded to Manager';
    if (wf.status === 'STAFF_ASSIGNED') return `Assigned: ${wf.assignedUserName || 'Staff'}`;
    if (wf.status === 'ACCEPTED') return 'Accepted';
    if (wf.status === 'IN_PROGRESS') return 'In Progress';
    if (wf.status === 'STAFF_COMPLETED') return 'Awaiting Verification';
    if (wf.status === 'MANAGER_VERIFIED') return 'Verified (Awaiting Closure)';
    return dbStatus.replace(/_/g, ' ');
  };

  const getWorkflowStatusBadge = (orderId: string, dbStatus: string) => {
    const wf = customStatuses[orderId];
    if (!wf) {
      if (dbStatus === 'PENDING') return 'danger';
      return 'info';
    }
    if (wf.status === 'FORWARDED_TO_MANAGER') return 'warning';
    if (wf.status === 'STAFF_ASSIGNED') return 'info';
    if (wf.status === 'ACCEPTED') return 'info';
    if (wf.status === 'IN_PROGRESS') return 'warning';
    if (wf.status === 'STAFF_COMPLETED') return 'warning';
    if (wf.status === 'MANAGER_VERIFIED') return 'success';
    return 'info';
  };

  // Staff availability tracker today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter((s) => s.startTime?.startsWith(todayStr));

  const getStaffTodayShift = (staffId: string) => {
    const shift = todayShifts.find((s) => String(s.staffId) === String(staffId));
    return shift ? `On Shift: ${shift.shiftType || 'Scheduled'}` : 'Off Duty';
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Panel</h1>
          <p className="text-sm text-gray-400 mt-0.5">Operations overview and performance monitoring</p>
        </div>
        <Link to="/manager/scheduling"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-xl hover:bg-navy-800 transition-colors shadow-sm">
          <Clock size={15} /> Staff Scheduling
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Occupancy Rate"    value={`${occupancyRate}%`} icon={<Hotel size={20} />}      color="navy"    className="animate-fade-in-up" />
        <StatCard title="Revenue KPI"       value={revenueKPI ? formatCurrency(revenueKPI.currentValue) : '—'} icon={<TrendingUp size={20} />} color="emerald" className="animate-fade-in-up" />
        <StatCard title="Active Staff"      value={activeStaffCount} subtitle={`of ${staff.length} total`}  icon={<Users size={20} />}      color="blue"    className="animate-fade-in-up" />
        <StatCard title="Active Requests"   value={activeRequests.length} subtitle="requests in progress" icon={<ClipboardList size={20} />} color="amber" className="animate-fade-in-up" />
      </div>

      {/* Unified Operational Coordination Dashboard */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Requests Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Active Service Requests" subtitle="Monitor and coordinate active operations" icon={<ClipboardList size={16} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase">
                    <th className="py-3 px-2">Request</th>
                    <th className="py-3 px-2">Location</th>
                    <th className="py-3 px-2">Workflow Status</th>
                    <th className="py-3 px-2">Assignee</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeRequests.map((order) => {
                    const statusLabel = getWorkflowStatusLabel(order.orderId, order.status);
                    const statusBadgeVar = getWorkflowStatusBadge(order.orderId, order.status);
                    const wf = customStatuses[order.orderId];
                    const isStaffCompleted = wf?.status === 'STAFF_COMPLETED';
                    
                    const assignedUserId = order.assignedToUserId || wf?.assignedUserId;
                    const isAssigned = !!assignedUserId;
                    const assignedUser = allUsers.find((u) => String(u.userId) === String(assignedUserId));
                    const assignedName = assignedUser?.name || wf?.assignedUserName || 'Assigned';
                    
                    const canAssign = !isAssigned && (!wf || wf.status === 'FORWARDED_TO_MANAGER');

                    return (
                      <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-2">
                          <div className="font-semibold text-gray-900">{order.serviceType.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">{order.description || 'No description'}</div>
                        </td>
                        <td className="py-3.5 px-2 text-gray-600 font-medium">
                          {order.roomId ? `Room ${order.roomId}` : 'Dine-in'}
                        </td>
                        <td className="py-3.5 px-2">
                          <Badge variant={statusBadgeVar}>{statusLabel}</Badge>
                        </td>
                        <td className="py-3.5 px-2">
                          {canAssign ? (
                            <select
                              value={assignMap[order.orderId] ?? ''}
                              onChange={(e) => setAssignMap((m) => ({ ...m, [order.orderId]: e.target.value }))}
                              className="select py-1 text-xs max-w-[150px]">
                              <option value="">— Select Staff —</option>
                              {serviceStaff.map((u) => {
                                const roleLabel = u.role.replace(/_STAFF/g, '').replace(/RESTAURANT_/g, '');
                                return (
                                  <option key={u.userId} value={u.userId}>
                                    {u.name} ({roleLabel})
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <span className="text-xs text-gray-800 font-semibold bg-navy-50/50 px-2 py-1 rounded-lg border border-navy-100/50 inline-block">
                              {assignedName}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          {canAssign && (
                            <button
                              disabled={!assignMap[order.orderId] || assignMutation.isPending}
                              onClick={() => assignMutation.mutate({ orderId: order.orderId, userId: assignMap[order.orderId] })}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 disabled:opacity-50 transition-colors">
                              Assign
                            </button>
                          )}
                          {isStaffCompleted && (
                            <button
                              onClick={() => handleVerify(order.orderId)}
                              className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
                              Verify
                            </button>
                          )}
                          {!canAssign && !isStaffCompleted && (
                            <span className="text-xs text-gray-400 italic">
                              {order.status === 'IN_PROGRESS' ? 'In progress' : 'Assigned'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {activeRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-sm text-gray-400">
                        No active service requests at this time.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Staff Availability Tracker */}
        <div>
          <Card title="Staff Availability" subtitle="Live shift statuses today" icon={<Users size={16} />}>
            <div className="space-y-3">
              {staff.map((member) => {
                const shiftStatus = getStaffTodayShift(member.id);
                const isShiftActive = shiftStatus.startsWith('On Shift');
                return (
                  <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-50 bg-gray-50/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center font-bold text-navy-700 text-xs">
                        {(member.name ?? 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{member.name}</div>
                        <div className="text-xs text-gray-400">{member.department} · {member.role?.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <Badge variant={isShiftActive ? 'success' : 'gray'} className="text-xs">
                      {shiftStatus}
                    </Badge>
                  </div>
                );
              })}
              {staff.length === 0 && (
                <p className="text-center py-6 text-sm text-gray-400">No staff members found.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Occupancy meter */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-navy-300 text-sm font-medium">Current Occupancy</p>
            <p className="text-4xl font-bold mt-1">{occupancyRate}<span className="text-2xl text-navy-300">%</span></p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {roomGroups.map((g) => (
              <div key={g.label} className="text-center px-4 py-2 rounded-xl bg-white/8 border border-white/10">
                <p className="text-xl font-bold">{g.count}</p>
                <p className="text-xs text-navy-300 mt-0.5">{g.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full transition-all duration-700" style={{ width: `${occupancyRate}%` }} />
        </div>
        <div className="flex gap-4 mt-3">
          {roomGroups.map((g) => (
            <div key={g.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${g.color}`} />
              <span className="text-xs text-navy-300">{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI chart */}
      {chartData.length > 0 && (
        <Card title="KPI Performance" subtitle="Current vs Target" icon={<BarChart3 size={16} />}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="current" stroke="#1a2744" strokeWidth={2.5} dot={false} name="Current Value" />
              <Line type="monotone" dataKey="target"  stroke="#c9a84c" strokeWidth={2}   dot={false} name="Target" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Staff overview */}
        <Card title="Staff Overview" icon={<Users size={16} />}
          action={<Link to="/manager/scheduling" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Schedule <ArrowRight size={11} /></Link>}>
          <div className="space-y-2">
            {staff.slice(0, 7).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-navy-700">{(s.name ?? 'S')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.name ?? `Staff #${s.id}`}</p>
                  <p className="text-xs text-gray-400">{s.department} · {s.role?.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className="text-xs text-gray-400">{s.status}</span>
                </div>
              </div>
            ))}
            {staff.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No staff records found.</p>}
          </div>
        </Card>

        {/* KPI summary */}
        <Card title="KPI Summary" icon={<Target size={16} />}
          action={<Link to="/manager/performance" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">Full Report <ArrowRight size={11} /></Link>}>
          <div className="space-y-3">
            {kpis.slice(0, 5).map((kpi) => {
              const pct = Number(kpi.target) > 0 ? Math.min(100, Math.round((Number(kpi.currentValue) / Number(kpi.target)) * 100)) : 0;
              const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <div key={kpi.kpiId}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-800">{kpi.name}</span>
                    <span className="text-gray-400">{pct}% of target</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {kpis.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No KPIs configured yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
