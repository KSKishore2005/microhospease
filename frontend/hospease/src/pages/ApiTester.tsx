import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface QueryParam { name: string; placeholder: string; }

interface Endpoint {
  id: string;
  method: Method;
  path: string;
  desc: string;
  pathParams?: string[];
  queryParams?: QueryParam[];
  defaultBody?: string;
  noAuth?: boolean;
}

interface ServiceDef {
  name: string;
  color: string;
  healthPath: string;
  endpoints: Endpoint[];
}

interface Result {
  status: number | null;
  data: unknown;
  error: string | null;
  ms: number;
  loading: boolean;
}

// ─── Endpoint Definitions ────────────────────────────────────────────────────

const SERVICES: ServiceDef[] = [
  {
    name: 'AUTH',
    color: 'violet',
    healthPath: '/api/users/roles',
    endpoints: [
      {
        id: 'auth-login', method: 'POST', path: '/api/auth/login',
        desc: 'Login — returns JWT token', noAuth: true,
        defaultBody: JSON.stringify({ email: 'admin@hospease.com', password: 'Admin@123' }, null, 2),
      },
      {
        id: 'auth-register', method: 'POST', path: '/api/auth/register',
        desc: 'Register new user account', noAuth: true,
        defaultBody: JSON.stringify({ name: 'Test User', email: 'test@hospease.com', phone: '+1-555-000-0099', password: 'Test@123', role: 'GUEST' }, null, 2),
      },
      { id: 'auth-logout', method: 'POST', path: '/api/auth/logout', desc: 'Logout current session' },
    ],
  },
  {
    name: 'USERS',
    color: 'blue',
    healthPath: '/api/users/',
    endpoints: [
      { id: 'users-list',     method: 'GET',    path: '/api/users/',                  desc: 'Get all users' },
      { id: 'users-roles',    method: 'GET',    path: '/api/users/roles',              desc: 'Get all available roles' },
      { id: 'users-by-id',   method: 'GET',    path: '/api/users/{id}',              desc: 'Get user by ID',    pathParams: ['id'] },
      { id: 'users-by-email',method: 'GET',    path: '/api/users/email/{email}',     desc: 'Get user by email', pathParams: ['email'] },
      {
        id: 'users-create', method: 'POST', path: '/api/users/', desc: 'Create new user',
        defaultBody: JSON.stringify({ name: 'New Staff', email: 'newstaff@hospease.com', phone: '+1-555-000-0099', password: 'Staff@123', role: 'FRONT_DESK_STAFF' }, null, 2),
      },
      { id: 'users-delete',  method: 'DELETE', path: '/api/users/{id}',              desc: 'Delete user by ID', pathParams: ['id'] },
      { id: 'audit-list',    method: 'GET',    path: '/api/audit-logs/',              desc: 'Get all audit logs' },
      { id: 'audit-by-user', method: 'GET',    path: '/api/audit-logs/user/{userId}',desc: 'Audit logs by user ID', pathParams: ['userId'] },
    ],
  },
  {
    name: 'ROOMS',
    color: 'emerald',
    healthPath: '/api/rooms/',
    endpoints: [
      { id: 'rooms-list',      method: 'GET',    path: '/api/rooms/',                  desc: 'Get all rooms' },
      { id: 'rooms-available', method: 'GET',    path: '/api/rooms/available',          desc: 'Get available rooms' },
      { id: 'rooms-by-id',    method: 'GET',    path: '/api/rooms/{id}',              desc: 'Get room by ID',   pathParams: ['id'] },
      { id: 'rooms-by-type',  method: 'GET',    path: '/api/rooms/type/{type}',       desc: 'Rooms by type (SINGLE / DOUBLE / SUITE)', pathParams: ['type'] },
      {
        id: 'rooms-create', method: 'POST', path: '/api/rooms/', desc: 'Create a new room',
        defaultBody: JSON.stringify({ number: '105', type: 'SINGLE', capacity: 1, amenitiesJson: '["WiFi","TV","Air Conditioning"]', status: 'AVAILABLE', ratePerNight: 120.00 }, null, 2),
      },
      { id: 'rooms-status', method: 'PATCH', path: '/api/rooms/{id}/status', desc: 'Update room status', pathParams: ['id'], queryParams: [{ name: 'status', placeholder: 'AVAILABLE / OCCUPIED / MAINTENANCE' }] },
      { id: 'rooms-delete', method: 'DELETE', path: '/api/rooms/{id}', desc: 'Delete room by ID', pathParams: ['id'] },
      { id: 'hk-list',     method: 'GET',    path: '/api/housekeeping-tasks/',            desc: 'Get all housekeeping tasks' },
      { id: 'hk-by-id',   method: 'GET',    path: '/api/housekeeping-tasks/{id}',        desc: 'Get task by ID', pathParams: ['id'] },
      { id: 'hk-by-room', method: 'GET',    path: '/api/housekeeping-tasks/room/{roomId}',desc: 'Tasks by room ID', pathParams: ['roomId'] },
      { id: 'hk-by-status',method: 'GET',   path: '/api/housekeeping-tasks/status/{status}',desc: 'Tasks by status', pathParams: ['status'] },
      {
        id: 'hk-create', method: 'POST', path: '/api/housekeeping-tasks/', desc: 'Create housekeeping task',
        defaultBody: JSON.stringify({ roomId: 1, assignedToUserId: 4, scheduledAt: '2026-05-21T09:00:00' }, null, 2),
      },
      { id: 'hk-status', method: 'PATCH', path: '/api/housekeeping-tasks/{id}/status', desc: 'Update task status', pathParams: ['id'], queryParams: [{ name: 'status', placeholder: 'PENDING / IN_PROGRESS / COMPLETED' }] },
      { id: 'staff-list', method: 'GET', path: '/api/staff/',  desc: 'Get all staff members' },
      { id: 'shifts-list', method: 'GET', path: '/api/shifts/', desc: 'Get all shifts' },
    ],
  },
  {
    name: 'GUESTS',
    color: 'pink',
    healthPath: '/api/v1/guests/',
    endpoints: [
      { id: 'guests-list',     method: 'GET',    path: '/api/v1/guests/',                      desc: 'Get all guests' },
      { id: 'guests-by-id',   method: 'GET',    path: '/api/v1/guests/{id}',                  desc: 'Get guest by ID',    pathParams: ['id'] },
      { id: 'guests-by-email',method: 'GET',    path: '/api/v1/guests/email/{email}',         desc: 'Get guest by email', pathParams: ['email'] },
      {
        id: 'guests-create', method: 'POST', path: '/api/v1/guests/', desc: 'Create a new guest',
        defaultBody: JSON.stringify({ name: 'Alice Johnson', email: 'alice@email.com', phone: '+1-555-300-0001' }, null, 2),
      },
      { id: 'guests-delete', method: 'DELETE', path: '/api/v1/guests/{id}', desc: 'Delete guest by ID', pathParams: ['id'] },
      { id: 'res-list',     method: 'GET',    path: '/api/v1/reservations/',                 desc: 'Get all reservations' },
      { id: 'res-by-id',   method: 'GET',    path: '/api/v1/reservations/{id}',             desc: 'Get reservation by ID',       pathParams: ['id'] },
      { id: 'res-by-guest',method: 'GET',    path: '/api/v1/reservations/guest/{guestId}',  desc: 'Reservations by guest ID',    pathParams: ['guestId'] },
      { id: 'res-by-status',method:'GET',    path: '/api/v1/reservations/status/{status}',  desc: 'Reservations by status',      pathParams: ['status'] },
      {
        id: 'res-create', method: 'POST', path: '/api/v1/reservations/', desc: 'Create a new reservation',
        defaultBody: JSON.stringify({ guestId: 1, roomId: 3, checkInDate: '2026-06-01', checkOutDate: '2026-06-05', specialRequests: 'High floor preferred' }, null, 2),
      },
      { id: 'res-status', method: 'PATCH', path: '/api/v1/reservations/{id}/status', desc: 'Update reservation status', pathParams: ['id'], queryParams: [{ name: 'status', placeholder: 'CONFIRMED / CHECKED_IN / CHECKED_OUT / CANCELLED' }] },
      { id: 'res-delete', method: 'DELETE', path: '/api/v1/reservations/{id}', desc: 'Delete reservation', pathParams: ['id'] },
    ],
  },
  {
    name: 'ORDERS',
    color: 'orange',
    healthPath: '/api/service-orders/',
    endpoints: [
      { id: 'orders-list',     method: 'GET',    path: '/api/service-orders/',                 desc: 'Get all service orders' },
      { id: 'orders-by-id',   method: 'GET',    path: '/api/service-orders/{id}',             desc: 'Get order by ID',       pathParams: ['id'] },
      { id: 'orders-by-guest',method: 'GET',    path: '/api/service-orders/guest/{guestId}',  desc: 'Orders by guest ID',    pathParams: ['guestId'] },
      { id: 'orders-by-res',  method: 'GET',    path: '/api/service-orders/reservation/{reservationId}', desc: 'Orders by reservation ID', pathParams: ['reservationId'] },
      { id: 'orders-by-type', method: 'GET',    path: '/api/service-orders/type/{type}',      desc: 'Orders by type (GYM / SPA / FOOD_AND_BEVERAGES / LAUNDRY / OTHER)', pathParams: ['type'] },
      { id: 'orders-by-status',method:'GET',    path: '/api/service-orders/status/{status}',  desc: 'Orders by status',      pathParams: ['status'] },
      {
        id: 'orders-create', method: 'POST', path: '/api/service-orders/', desc: 'Create a service order',
        defaultBody: JSON.stringify({ guestId: 1, reservationId: 1, roomId: 4, serviceType: 'SPA', description: 'Full body massage 60 min', price: 85.00 }, null, 2),
      },
      { id: 'orders-status', method: 'PATCH',  path: '/api/service-orders/{id}/status', desc: 'Update order status', pathParams: ['id'], queryParams: [{ name: 'status', placeholder: 'PENDING / IN_PROGRESS / COMPLETED / CANCELLED' }] },
      { id: 'orders-delete', method: 'DELETE', path: '/api/service-orders/{id}',        desc: 'Delete order by ID', pathParams: ['id'] },
    ],
  },
  {
    name: 'FINANCE',
    color: 'teal',
    healthPath: '/api/invoices/',
    endpoints: [
      { id: 'inv-list',     method: 'GET',    path: '/api/invoices/',                       desc: 'Get all invoices' },
      { id: 'inv-by-id',   method: 'GET',    path: '/api/invoices/{id}',                   desc: 'Get invoice by ID',            pathParams: ['id'] },
      { id: 'inv-by-guest',method: 'GET',    path: '/api/invoices/guest/{guestId}',        desc: 'Invoices by guest ID',         pathParams: ['guestId'] },
      { id: 'inv-by-res',  method: 'GET',    path: '/api/invoices/reservation/{reservationId}', desc: 'Invoice by reservation ID', pathParams: ['reservationId'] },
      { id: 'inv-by-status',method:'GET',    path: '/api/invoices/status/{status}',        desc: 'Invoices by status (UNPAID / PAID / OVERDUE / CANCELLED)', pathParams: ['status'] },
      {
        id: 'inv-create', method: 'POST', path: '/api/invoices/', desc: 'Create an invoice',
        defaultBody: JSON.stringify({ guestId: 1, reservationId: 1, lineItemsJson: '[{"description":"Room charge 3 nights","quantity":3,"unitPrice":180.00,"total":540.00}]', totalAmount: 540.00, currency: 'USD', dueDate: '2026-06-01' }, null, 2),
      },
      { id: 'inv-pay',      method: 'PATCH',  path: '/api/invoices/{id}/pay',     desc: 'Mark invoice as PAID',      pathParams: ['id'] },
      { id: 'inv-overdue',  method: 'PATCH',  path: '/api/invoices/{id}/overdue', desc: 'Mark invoice as OVERDUE',   pathParams: ['id'] },
      { id: 'inv-cancel',   method: 'PATCH',  path: '/api/invoices/{id}/cancel',  desc: 'Cancel invoice',            pathParams: ['id'] },
      { id: 'inv-delete',   method: 'DELETE', path: '/api/invoices/{id}',         desc: 'Delete invoice',            pathParams: ['id'] },
      { id: 'pay-list',     method: 'GET',    path: '/api/payments/',              desc: 'Get all payments' },
      { id: 'pay-by-id',   method: 'GET',    path: '/api/payments/{id}',          desc: 'Get payment by ID',         pathParams: ['id'] },
      { id: 'pay-by-guest',method: 'GET',    path: '/api/payments/guest/{guestId}', desc: 'Payments by guest ID',    pathParams: ['guestId'] },
      { id: 'pay-by-inv',  method: 'GET',    path: '/api/payments/invoice/{invoiceId}', desc: 'Payments by invoice ID', pathParams: ['invoiceId'] },
      {
        id: 'pay-create', method: 'POST', path: '/api/payments/', desc: 'Create a payment',
        queryParams: [{ name: 'invoiceId', placeholder: '1' }, { name: 'guestId', placeholder: '1' }],
        defaultBody: JSON.stringify({ amount: 400.00, method: 'CARD' }, null, 2),
      },
      { id: 'pay-refund', method: 'PATCH', path: '/api/payments/{id}/refund', desc: 'Refund a payment', pathParams: ['id'] },
    ],
  },
  {
    name: 'REPORTING',
    color: 'indigo',
    healthPath: '/api/reports/',
    endpoints: [
      { id: 'rep-list',     method: 'GET',    path: '/api/reports/',           desc: 'Get all reports' },
      { id: 'rep-by-id',   method: 'GET',    path: '/api/reports/{id}',       desc: 'Get report by ID',   pathParams: ['id'] },
      { id: 'rep-by-scope',method: 'GET',    path: '/api/reports/scope/{scope}', desc: 'Reports by scope (OCCUPANCY / FINANCE / STAFF / HOUSEKEEPING / SERVICES / GENERAL)', pathParams: ['scope'] },
      {
        id: 'rep-create', method: 'POST', path: '/api/reports/', desc: 'Create a new report',
        defaultBody: JSON.stringify({ reportType: 'Weekly Summary', scope: 'GENERAL', generatedByStaffId: 5, contentSummary: 'Weekly performance summary for May 2026' }, null, 2),
      },
      { id: 'kpi-list',    method: 'GET',    path: '/api/kpis/',              desc: 'Get all KPIs' },
      { id: 'kpi-by-id',  method: 'GET',    path: '/api/kpis/{id}',          desc: 'Get KPI by ID',      pathParams: ['id'] },
      {
        id: 'kpi-create', method: 'POST', path: '/api/kpis/', desc: 'Create a new KPI',
        defaultBody: JSON.stringify({ name: 'Revenue Growth', definition: 'Month-over-month revenue growth %', target: 10.00, currentValue: 7.50, reportingPeriod: 'JUN-2026' }, null, 2),
      },
      { id: 'kpi-delete',      method: 'DELETE', path: '/api/kpis/{id}',          desc: 'Delete KPI by ID',        pathParams: ['id'] },
      { id: 'pkg-list',        method: 'GET',    path: '/api/audit-packages/',    desc: 'Get all audit packages' },
      { id: 'pkg-by-id',      method: 'GET',    path: '/api/audit-packages/{id}',desc: 'Get audit package by ID', pathParams: ['id'] },
      {
        id: 'pkg-create', method: 'POST', path: '/api/audit-packages/', desc: 'Create an audit package',
        defaultBody: JSON.stringify({ periodStart: '2026-05-01', periodEnd: '2026-05-31', contentsJson: '{"invoiceCount":30,"totalRevenue":45000}' }, null, 2),
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const METHOD_STYLE: Record<Method, string> = {
  GET:    'bg-emerald-100 text-emerald-700',
  POST:   'bg-blue-100   text-blue-700',
  PUT:    'bg-amber-100  text-amber-700',
  PATCH:  'bg-orange-100 text-orange-700',
  DELETE: 'bg-rose-100   text-rose-700',
};

const COLOR_STYLE: Record<string, string> = {
  violet:  'bg-violet-100 text-violet-700 border-violet-200',
  blue:    'bg-blue-100   text-blue-700   border-blue-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pink:    'bg-pink-100   text-pink-700   border-pink-200',
  orange:  'bg-orange-100 text-orange-700 border-orange-200',
  teal:    'bg-teal-100   text-teal-700   border-teal-200',
  indigo:  'bg-indigo-100 text-indigo-700 border-indigo-200',
};

function statusColor(code: number | null) {
  if (!code) return 'text-gray-500';
  if (code < 300) return 'text-emerald-600';
  if (code < 400) return 'text-amber-600';
  return 'text-rose-600';
}

function buildUrl(path: string, pathValues: Record<string, string>, queryValues: Record<string, string>) {
  let url = path;
  Object.entries(pathValues).forEach(([k, v]) => { url = url.replace(`{${k}}`, encodeURIComponent(v)); });
  const q = Object.entries(queryValues).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return q ? `${url}?${q}` : url;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApiTester() {
  const [token, setToken]               = useState('');
  const [loginEmail, setLoginEmail]     = useState('admin@hospease.com');
  const [loginPassword, setLoginPassword] = useState('Admin@123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError]     = useState('');
  const [activeService, setActiveService] = useState('AUTH');
  const [results, setResults]           = useState<Record<string, Result>>({});
  const [pathVals, setPathVals]         = useState<Record<string, Record<string, string>>>({});
  const [queryVals, setQueryVals]       = useState<Record<string, Record<string, string>>>({});
  const [bodies, setBodies]             = useState<Record<string, string>>({});
  const [expanded, setExpanded]         = useState<Record<string, boolean>>({});
  const [health, setHealth]             = useState<Record<string, 'checking' | 'up' | 'down'>>({});

  // Load token from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('hospease-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        const t = parsed?.state?.token;
        if (t && t !== 'mock-jwt-token') setToken(t);
      }
    } catch { /* ignore */ }
  }, []);

  // Initialize bodies from defaultBody
  useEffect(() => {
    const init: Record<string, string> = {};
    SERVICES.forEach(s => s.endpoints.forEach(e => { if (e.defaultBody) init[e.id] = e.defaultBody; }));
    setBodies(init);
  }, []);

  // Health check all services
  const checkHealth = useCallback(async () => {
    const init: Record<string, 'checking'> = {};
    SERVICES.forEach(s => { init[s.name] = 'checking'; });
    setHealth(init);
    await Promise.all(
      SERVICES.map(async (s) => {
        try {
          await axios.get(s.healthPath, { headers: token ? { Authorization: `Bearer ${token}` } : {}, timeout: 4000 });
          setHealth(prev => ({ ...prev, [s.name]: 'up' }));
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          // 401/403 means service is up but requires auth — still "up"
          if (status === 401 || status === 403) setHealth(prev => ({ ...prev, [s.name]: 'up' }));
          else setHealth(prev => ({ ...prev, [s.name]: 'down' }));
        }
      })
    );
  }, [token]);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  // Quick login
  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await axios.post('/api/auth/login', { email: loginEmail, password: loginPassword });
      const t = res.data.token;
      setToken(t);
      // Also save to localStorage so the main app can pick it up
      const existing = JSON.parse(localStorage.getItem('hospease-auth') ?? '{}');
      if (existing.state) { existing.state.token = t; localStorage.setItem('hospease-auth', JSON.stringify(existing)); }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const status = (err as { response?: { status?: number } })?.response?.status;
      setLoginError(msg ?? (status === 500 ? 'Server error — check backend logs or seed the database.' : 'Login failed.'));
    } finally {
      setLoginLoading(false);
    }
  };

  // Run an endpoint
  const runEndpoint = async (ep: Endpoint) => {
    const pv = pathVals[ep.id] ?? {};
    const qv = queryVals[ep.id] ?? {};
    const url = buildUrl(ep.path, pv, qv);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!ep.noAuth && token) headers['Authorization'] = `Bearer ${token}`;
    setResults(r => ({ ...r, [ep.id]: { status: null, data: null, error: null, ms: 0, loading: true } }));
    const t0 = Date.now();
    try {
      const body = bodies[ep.id];
      let parsed: unknown;
      try { parsed = body ? JSON.parse(body) : undefined; } catch { parsed = body; }
      const res = await axios({ method: ep.method, url, headers, data: parsed, timeout: 10000 });
      setResults(r => ({ ...r, [ep.id]: { status: res.status, data: res.data, error: null, ms: Date.now() - t0, loading: false } }));
      // If this was a login response, grab the token
      if (ep.id === 'auth-login' && res.data?.token) setToken(res.data.token);
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: unknown } };
      setResults(r => ({
        ...r,
        [ep.id]: {
          status: axErr.response?.status ?? 0,
          data: axErr.response?.data ?? null,
          error: axErr.response ? `${axErr.response.status} Error` : 'Network error — backend not reachable',
          ms: Date.now() - t0,
          loading: false,
        },
      }));
    }
  };

  const service = SERVICES.find(s => s.name === activeService)!;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">HospEase API Tester</h1>
            <p className="text-xs text-gray-500 mt-0.5">Test all backend endpoints — confirm services and database are connected</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${token ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {token ? '🔐 Authenticated' : '🔓 No Token'}
            </span>
            {token && (
              <button onClick={() => setToken('')} className="text-xs text-rose-500 hover:text-rose-700 underline">
                Clear Token
              </button>
            )}
            <button onClick={checkHealth} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
              Re-check Health
            </button>
            <a href="/" className="text-xs px-3 py-1.5 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors" style={{ backgroundColor: '#1e293b' }}>
              ← Back to App
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Login Panel ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Login — Get Token</h2>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg w-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <button onClick={handleLogin} disabled={loginLoading}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loginLoading ? 'Logging in…' : 'Login'}
            </button>
            {/* Quick account buttons */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: 'Admin',   email: 'admin@hospease.com',        pw: 'Admin@123'   },
                { label: 'Manager', email: 'manager@hospease.com',      pw: 'Manager@123' },
                { label: 'Guest',   email: 'guest@hospease.com',        pw: 'Guest@123'   },
                { label: 'Finance', email: 'finance@hospease.com',      pw: 'Staff@123'   },
              ].map(a => (
                <button key={a.label} onClick={() => { setLoginEmail(a.email); setLoginPassword(a.pw); }}
                  className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors">
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          {loginError && <p className="mt-2 text-xs text-rose-600">{loginError}</p>}
          {token && (
            <div className="mt-3 p-2.5 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Current Token:</p>
              <p className="text-xs text-gray-700 font-mono break-all">{token.slice(0, 80)}…</p>
            </div>
          )}
        </div>

        {/* ── Health Status ────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Service Health</h2>
          <div className="flex gap-3 flex-wrap">
            {SERVICES.map(s => {
              const h = health[s.name];
              return (
                <div key={s.name} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${h === 'up' ? 'bg-emerald-500' : h === 'down' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-xs font-medium text-gray-700">{s.name}</span>
                  <span className={`text-xs ${h === 'up' ? 'text-emerald-600' : h === 'down' ? 'text-rose-600' : 'text-amber-600'}`}>
                    {h === 'up' ? 'UP' : h === 'down' ? 'DOWN' : '…'}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            DOWN = service not running or database not connected. AUTH/USER being DOWN will cause 500 on login.
          </p>
        </div>

        {/* ── Service Tabs + Endpoints ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-gray-100">
            {SERVICES.map(s => {
              const h = health[s.name];
              return (
                <button key={s.name} onClick={() => setActiveService(s.name)}
                  className={`px-5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeService === s.name
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${h === 'up' ? 'bg-emerald-500' : h === 'down' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                  {s.name}
                </button>
              );
            })}
          </div>

          {/* Endpoint list */}
          <div className="divide-y divide-gray-50">
            {service.endpoints.map(ep => {
              const result = results[ep.id];
              const isOpen = expanded[ep.id];
              const pv = pathVals[ep.id] ?? {};
              const qv = queryVals[ep.id] ?? {};
              const hasInput = (ep.pathParams?.length ?? 0) > 0 || (ep.queryParams?.length ?? 0) > 0 || ['POST', 'PUT', 'PATCH'].includes(ep.method);

              return (
                <div key={ep.id} className="px-5 py-4">
                  {/* Header row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${METHOD_STYLE[ep.method]}`}>
                      {ep.method}
                    </span>
                    <code className="text-xs text-gray-700 font-mono flex-1 min-w-0 truncate">{ep.path}</code>
                    <span className="text-xs text-gray-400 hidden sm:block">{ep.desc}</span>
                    {result && !result.loading && (
                      <span className={`text-xs font-bold ${statusColor(result.status)}`}>
                        {result.status ?? 'ERR'} · {result.ms}ms
                      </span>
                    )}
                    <div className="flex gap-1.5 ml-auto flex-shrink-0">
                      {hasInput && (
                        <button onClick={() => setExpanded(e => ({ ...e, [ep.id]: !e[ep.id] }))}
                          className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors">
                          {isOpen ? 'Hide' : 'Params'}
                        </button>
                      )}
                      <button onClick={() => runEndpoint(ep)} disabled={result?.loading}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50">
                        {result?.loading ? '…' : 'Send'}
                      </button>
                    </div>
                  </div>

                  {/* Inputs (expanded) */}
                  {isOpen && (
                    <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-100">
                      {ep.pathParams && ep.pathParams.length > 0 && (
                        <div className="flex gap-3 flex-wrap">
                          {ep.pathParams.map(p => (
                            <div key={p}>
                              <label className="block text-xs text-gray-500 mb-1">Path: <code className="text-gray-700">{`{${p}}`}</code></label>
                              <input value={pv[p] ?? ''} onChange={e => setPathVals(prev => ({ ...prev, [ep.id]: { ...pv, [p]: e.target.value } }))}
                                placeholder={`Enter ${p}`}
                                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg w-36 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                          ))}
                        </div>
                      )}
                      {ep.queryParams && ep.queryParams.length > 0 && (
                        <div className="flex gap-3 flex-wrap">
                          {ep.queryParams.map(p => (
                            <div key={p.name}>
                              <label className="block text-xs text-gray-500 mb-1">Query: <code className="text-gray-700">{p.name}</code></label>
                              <input value={qv[p.name] ?? ''} onChange={e => setQueryVals(prev => ({ ...prev, [ep.id]: { ...qv, [p.name]: e.target.value } }))}
                                placeholder={p.placeholder}
                                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                          ))}
                        </div>
                      )}
                      {['POST', 'PUT', 'PATCH'].includes(ep.method) && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Request Body (JSON)</label>
                          <textarea
                            value={bodies[ep.id] ?? ''}
                            onChange={e => setBodies(b => ({ ...b, [ep.id]: e.target.value }))}
                            rows={6}
                            className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Response */}
                  {result && !result.loading && (
                    <div className={`mt-3 rounded-lg p-3 text-xs font-mono ${result.error ? 'bg-rose-50 border border-rose-100' : 'bg-gray-50 border border-gray-100'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-bold ${statusColor(result.status)}`}>
                          {result.status ?? 'Network Error'}
                        </span>
                        <span className="text-gray-400">{result.ms}ms</span>
                        {result.error && <span className="text-rose-600">{result.error}</span>}
                      </div>
                      <pre className="text-gray-700 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                        {result.data !== null ? JSON.stringify(result.data, null, 2) : result.error}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Credentials Reference ────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Seeded Credentials</h2>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-6">Email</th>
                  <th className="pb-2 pr-6">Password</th>
                  <th className="pb-2 pr-6">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { email: 'admin@hospease.com',        pw: 'Admin@123',   role: 'ADMINISTRATOR' },
                  { email: 'manager@hospease.com',      pw: 'Manager@123', role: 'MANAGER' },
                  { email: 'frontdesk@hospease.com',    pw: 'Staff@123',   role: 'FRONT_DESK_STAFF' },
                  { email: 'housekeeping@hospease.com', pw: 'Staff@123',   role: 'HOUSEKEEPING_STAFF' },
                  { email: 'service@hospease.com',      pw: 'Staff@123',   role: 'RESTAURANT_SERVICE_STAFF' },
                  { email: 'finance@hospease.com',      pw: 'Staff@123',   role: 'FINANCE_OFFICER' },
                  { email: 'auditor@hospease.com',      pw: 'Staff@123',   role: 'AUDITOR' },
                  { email: 'guest@hospease.com',        pw: 'Guest@123',   role: 'GUEST' },
                  { email: 'guest2@hospease.com',       pw: 'Guest@123',   role: 'GUEST' },
                ].map(c => (
                  <tr key={c.email}>
                    <td className="py-1.5 pr-6 text-gray-700 font-mono">{c.email}</td>
                    <td className="py-1.5 pr-6 text-gray-700 font-mono">{c.pw}</td>
                    <td className="py-1.5 pr-6">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLOR_STYLE[
                        c.role === 'ADMINISTRATOR' ? 'violet' :
                        c.role === 'MANAGER' ? 'blue' :
                        c.role === 'GUEST' ? 'pink' :
                        c.role.includes('FINANCE') ? 'teal' :
                        c.role.includes('AUDIT') ? 'indigo' : 'emerald'
                      ]}`}>{c.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
