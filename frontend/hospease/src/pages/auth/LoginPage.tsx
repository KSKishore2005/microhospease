import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';

const DEMO_ACCOUNTS = [
  { role: 'Admin',         email: 'admin@hospease.com',        password: 'Admin@123',   color: 'text-purple-600 bg-purple-50  hover:bg-purple-100  ring-purple-200'  },
  { role: 'Manager',       email: 'manager@hospease.com',      password: 'Manager@123', color: 'text-blue-600   bg-blue-50    hover:bg-blue-100    ring-blue-200'    },
  { role: 'Front Desk',    email: 'frontdesk@hospease.com',    password: 'Staff@123',   color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 ring-emerald-200' },
  { role: 'Housekeeping',  email: 'housekeeping@hospease.com', password: 'Staff@123',   color: 'text-amber-600  bg-amber-50   hover:bg-amber-100   ring-amber-200'   },
  { role: 'Service Staff', email: 'service@hospease.com',      password: 'Staff@123',   color: 'text-orange-600 bg-orange-50  hover:bg-orange-100  ring-orange-200'  },
  { role: 'Finance',       email: 'finance@hospease.com',      password: 'Staff@123',   color: 'text-teal-600   bg-teal-50    hover:bg-teal-100    ring-teal-200'    },
  { role: 'Auditor',       email: 'auditor@hospease.com',      password: 'Staff@123',   color: 'text-indigo-600 bg-indigo-50  hover:bg-indigo-100  ring-indigo-200'  },
  { role: 'Guest',         email: 'guest@hospease.com',        password: 'Guest@123',   color: 'text-gold-600   bg-gold-50    hover:bg-gold-100    ring-gold-200'    },
];

const roleRedirects: Record<string, string> = {
  ADMIN: '/admin', MANAGER: '/manager', FRONT_DESK: '/frontdesk',
  HOUSEKEEPING: '/housekeeping', SERVICE_STAFF: '/servicestaff',
  FINANCE: '/finance', REPORTING: '/reporting', GUEST: '/guest',
};

const stats = [
  { value: '500+', label: 'Rooms Managed' },
  { value: '12K+', label: 'Guests Served' },
  { value: '98%',  label: 'Satisfaction' },
  { value: '24/7', label: 'Support' },
];

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={roleRedirects[user.role] ?? '/guest'} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      const u = useAuthStore.getState().user;
      navigate(roleRedirects[u?.role ?? ''] ?? '/guest');
    } else {
      setError(result.error ?? 'Login failed. Please check your credentials.');
    }
  };

  const quickLogin = async (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setLoading(true);
    const result = await login(acc.email, acc.password);
    setLoading(false);
    if (result.success) {
      const u = useAuthStore.getState().user;
      navigate(roleRedirects[u?.role ?? ''] ?? '/guest');
    } else {
      setError(result.error ?? 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left branding panel ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-navy-950 flex-col">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-navy-800/40 blur-3xl" />
          <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-gold-500/8 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-navy-700/50 blur-3xl" />
          {/* Grid pattern */}
          <svg className="absolute inset-0 opacity-[0.04]" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl">HospEase</p>
              <p className="text-gold-400 text-xs font-medium">Hospitality Management Suite</p>
            </div>
          </div>

          {/* Main copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-gold-300 text-xs font-medium">Enterprise Grade Platform</span>
            </div>

            <h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
              Premium<br />
              <span className="text-gradient-gold">Hospitality</span><br />
              Management
            </h1>
            <p className="text-gray-400 mt-5 text-base leading-relaxed max-w-sm">
              Streamline operations, delight every guest, and maximize revenue with our all-in-one hotel management platform.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-10">
              {stats.map((s) => (
                <div key={s.label} className="text-center p-3 rounded-xl bg-white/5 border border-white/8">
                  <p className="text-gold-400 text-2xl font-bold leading-none">{s.value}</p>
                  <p className="text-gray-500 text-xs mt-1.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div className="mt-8 space-y-2.5">
              {[
                'Multi-role access control',
                'Real-time room & housekeeping management',
                'Integrated billing & payments',
                'Advanced analytics & KPI tracking',
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-600 text-xs">&copy; 2026 HospEase. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-navy-900 rounded-xl flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-navy-900 text-lg">HospEase</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1.5">
              Sign in to your portal, or{' '}
              <Link to="/register" className="text-navy-700 font-semibold hover:underline">create a guest account</Link>
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospease.com" required
                className="input"
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="input pr-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full justify-center" size="lg" loading={loading} icon={<ArrowRight size={16} />}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          {/* Demo quick login */}
          <div className="mt-7">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Demo Login</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc)}
                  disabled={loading}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold ring-1 transition-all duration-150 ${acc.color}`}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
