import { Key, Calendar, Users, BedDouble, ArrowRight, LogIn, LogOut, CheckCircle2, Bell, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge, { statusBadge } from '../../components/common/Badge';
import { reservationsApi } from '../../api/reservations';
import { roomsApi } from '../../api/rooms';
import { serviceOrdersApi } from '../../api/serviceOrders';
import { formatDate, formatRelative } from '../../utils/formatters';
import { useWorkflowStore } from '../../store/workflowStore';
import { useToastStore } from '../../store/toastStore';

export default function FrontDeskDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const { data: reservations = [] } = useQuery({ queryKey: ['reservations'], queryFn: reservationsApi.getAll });
  const { data: rooms = [] }        = useQuery({ queryKey: ['rooms'],        queryFn: roomsApi.getAll });
  const { data: serviceOrders = [] } = useQuery({ queryKey: ['service-orders'], queryFn: serviceOrdersApi.getAll });

  const queryClient = useQueryClient();
  const { customStatuses, setStatus, clearStatus } = useWorkflowStore();
  const addToast = useToastStore((s) => s.addToast);

  const closeMutation = useMutation({
    mutationFn: (orderId: string) => serviceOrdersApi.updateStatus(orderId, 'COMPLETED'),
    onSuccess: (_, orderId) => {
      clearStatus(orderId);
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financeDashboard'] });
      addToast('Request closed and billed successfully', 'success');
    },
  });

  // Service requests that need front desk attention
  const pendingRequests = serviceOrders.filter((o) =>
    o.status === 'PENDING' && !customStatuses[o.orderId]
  );
  const verifiedRequests = serviceOrders.filter((o) =>
    customStatuses[o.orderId]?.status === 'MANAGER_VERIFIED'
  );

  const checkIns   = reservations.filter((r) => r.checkInDate  === today && (r.status === 'CONFIRMED' || r.status === 'CHECKED_IN'));
  const checkOuts  = reservations.filter((r) => r.checkOutDate === today && r.status === 'CHECKED_IN');
  const inHouse    = reservations.filter((r) => r.status === 'CHECKED_IN');
  const approved   = reservations.filter((r) => r.status === 'CONFIRMED');

  const available   = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const occupied    = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const cleaning    = rooms.filter((r) => r.status === 'CLEANING').length;
  const maintenance = rooms.filter((r) => r.status === 'MAINTENANCE').length;
  const occupancy   = rooms.length > 0 ? Math.round((occupied / rooms.length) * 100) : 0;

  const roomStatusItems = [
    { label: 'Available',   count: available,   color: 'bg-emerald-500' },
    { label: 'Occupied',    count: occupied,    color: 'bg-blue-500'    },
    { label: 'Cleaning',    count: cleaning,    color: 'bg-amber-500'   },
    { label: 'Maintenance', count: maintenance, color: 'bg-rose-500'    },
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
          <Key size={15} /> Check In / Out
        </Link>
      </div>

      {/* Stats — no financial data for Front Desk */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard title="Today's Arrivals"   value={checkIns.length}  subtitle="expected check-ins"    icon={<LogIn size={20} />}      color="emerald" className="animate-fade-in-up" />
        <StatCard title="Today's Departures" value={checkOuts.length} subtitle="departures due"         icon={<LogOut size={20} />}     color="rose"    className="animate-fade-in-up" />
        <StatCard title="In-House Guests"    value={inHouse.length}   subtitle={`${occupancy}% occupancy`} icon={<Users size={20} />}  color="navy"    className="animate-fade-in-up" />
        <StatCard title="Approved Bookings"  value={approved.length}  subtitle="confirmed reservations"  icon={<Calendar size={20} />}  color="amber"   className="animate-fade-in-up" />
      </div>

      {/* Occupancy bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Room Occupancy Today</p>
          <span className="text-2xl font-bold text-navy-900">{occupancy}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-navy-700 to-navy-500 rounded-full transition-all duration-700" style={{ width: `${occupancy}%` }} />
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

        {/* Approved Reservations (replaces Pending Service Requests card) */}
        <Card title="Approved Reservations" icon={<Calendar size={16} />}
          action={<Link to="/frontdesk/reservations" className="text-xs font-semibold text-navy-700 hover:underline flex items-center gap-1">View all <ArrowRight size={11} /></Link>}>
          <div className="space-y-3">
            {approved.slice(0, 5).map((r) => (
              <div key={r.reservationId} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                  <BedDouble size={14} className="text-navy-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.guestName}</p>
                    <Badge variant={statusBadge(r.status)}>{r.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Room {r.roomNumber} · Check-in {formatRelative(r.checkInDate)}</p>
                </div>
              </div>
            ))}
            {approved.length === 0 && (
              <div className="text-center py-8">
                <Calendar size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No approved reservations</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Service Request Management */}
      {(pendingRequests.length > 0 || verifiedRequests.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending — forward to manager */}
          <Card title="Guest Requests" subtitle={`${pendingRequests.length} pending`} icon={<Bell size={15} />}>
            <div className="space-y-2">
              {pendingRequests.slice(0, 6).map((req) => (
                <div key={req.orderId} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-gray-200 transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{req.serviceType.replace(/_/g, ' ')}</p>
                    {req.description && <p className="text-xs text-gray-400 truncate mt-0.5">{req.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelative(req.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => { setStatus(req.orderId, 'FORWARDED_TO_MANAGER'); addToast('Request forwarded to Manager', 'success'); }}
                    className="px-3 py-1.5 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5 flex-shrink-0 ml-3"
                  >
                    <Send size={11} /> Forward
                  </button>
                </div>
              ))}
              {pendingRequests.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No pending requests</p>}
            </div>
          </Card>

          {/* Verified — close request */}
          <Card title="Verified & Ready to Close" subtitle={`${verifiedRequests.length} verified`} icon={<CheckCircle2 size={15} />}>
            <div className="space-y-2">
              {verifiedRequests.slice(0, 6).map((req) => {
                const wf = customStatuses[req.orderId];
                return (
                  <div key={req.orderId} className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/30">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{req.serviceType.replace(/_/g, ' ')}</p>
                        <Badge variant="purple">Verified</Badge>
                      </div>
                      {wf?.assignedUserName && <p className="text-xs text-gray-500 mt-0.5">Completed by: {wf.assignedUserName}</p>}
                    </div>
                    <button
                      onClick={() => closeMutation.mutate(req.orderId)}
                      disabled={closeMutation.isPending}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors flex-shrink-0 ml-3"
                    >
                      ✓ Close
                    </button>
                  </div>
                );
              })}
              {verifiedRequests.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No verified requests to close</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
