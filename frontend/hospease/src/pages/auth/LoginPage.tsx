import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Zap, Shield, BarChart3, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { hospeaseLogo } from '../../components/common/HospEaseLogo';

/* ─── Demo accounts ───────────────────────────────────────── */
const DEMO_ACCOUNTS = [
  { role: 'Admin',         emoji: '👑', email: 'admin@hospease.com',        password: 'Admin@123'   },
  { role: 'Manager',       emoji: '📊', email: 'manager@hospease.com',      password: 'Manager@123' },
  { role: 'Front Desk',    emoji: '🛎️', email: 'frontdesk@hospease.com',    password: 'Staff@123'   },
  { role: 'Housekeeping',  emoji: '🧹', email: 'housekeeping@hospease.com', password: 'Staff@123'   },
  { role: 'Service Staff', emoji: '🍽️', email: 'service@hospease.com',      password: 'Staff@123'   },
  { role: 'Finance',       emoji: '💰', email: 'finance@hospease.com',      password: 'Staff@123'   },
  { role: 'Auditor',       emoji: '📋', email: 'auditor@hospease.com',      password: 'Staff@123'   },
  { role: 'Guest',         emoji: '🛏️', email: 'guest@hospease.com',        password: 'Guest@123'   },
];

const roleRedirects: Record<string, string> = {
  ADMIN: '/admin', MANAGER: '/manager', FRONT_DESK: '/frontdesk',
  HOUSEKEEPING: '/housekeeping', SERVICE_STAFF: '/servicestaff',
  FINANCE: '/finance', REPORTING: '/reporting', GUEST: '/guest',
};

/* ─── Floating feature cards ──────────────────────────────── */
const features = [
  { icon: <Zap size={16} />,      title: 'Real-time Updates',    desc: 'Live room & booking status' },
  { icon: <Shield size={16} />,   title: 'Role-Based Access',    desc: 'Granular permissions' },
  { icon: <BarChart3 size={16} />, title: 'Smart Analytics',     desc: 'KPIs & revenue insights' },
  { icon: <Users size={16} />,    title: 'Guest Management',     desc: 'Loyalty & preferences' },
];

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [activeDemo, setActiveDemo]     = useState<string | null>(null);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
    setActiveDemo(acc.email);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setLoading(true);
    const result = await login(acc.email, acc.password);
    setLoading(false);
    setActiveDemo(null);
    if (result.success) {
      const u = useAuthStore.getState().user;
      navigate(roleRedirects[u?.role ?? ''] ?? '/guest');
    } else {
      setError(result.error ?? 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL  — dark cinematic branding
      ════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1630 40%, #0f1f3d 70%, #0a1628 100%)' }}>

        {/* Animated glowing orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, #c9a227 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 -right-32 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', animationDelay: '1s' }} />
          <div className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] rounded-full opacity-15 blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', animationDelay: '2s' }} />
        </div>

        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Diagonal accent line */}
        <div className="absolute top-0 right-0 w-px h-full opacity-10" style={{ background: 'linear-gradient(to bottom, transparent 0%, #c9a227 40%, transparent 100%)' }} />

        <div className="relative flex flex-col justify-between h-full p-12 z-10">
          {/* Logo */}
          <div className={`flex items-center gap-3 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #c9a227, #f0c040)' }}>
                <img src={hospeaseLogo} alt="HospEase" className="w-10 h-10 object-contain" />
              </div>
              <div className="absolute -inset-1 rounded-2xl blur-sm opacity-40 animate-pulse-glow" style={{ background: 'linear-gradient(135deg, #c9a227, #f0c040)' }} />
            </div>
            <div>
              <p className="text-white font-bold text-xl tracking-tight">HospEase</p>
              <p className="text-xs font-medium" style={{ color: '#c9a227' }}>Hospitality Management Suite</p>
            </div>
          </div>

          {/* Main content */}
          <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8" style={{ borderColor: 'rgba(201,162,39,0.3)', background: 'rgba(201,162,39,0.08)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c9a227' }} />
              <span className="text-xs font-semibold" style={{ color: '#c9a227' }}>Enterprise-Grade Platform</span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Elevate Your<br />
              <span style={{ background: 'linear-gradient(90deg, #c9a227 0%, #f0c040 50%, #c9a227 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Hospitality
              </span>
            </h1>
            <p className="text-gray-400 mt-5 text-base leading-relaxed max-w-xs">
              One unified platform to manage rooms, guests, staff, and revenue — from check-in to check-out.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3 mt-10">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className={`p-4 rounded-2xl border transition-all duration-700 hover:scale-105 cursor-default`}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    transitionDelay: `${300 + i * 80}ms`,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(16px)',
                  }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5" style={{ background: 'rgba(201,162,39,0.15)', color: '#c9a227' }}>
                    {f.icon}
                  </div>
                  <p className="text-white text-xs font-semibold">{f.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/8">
              {[['500+', 'Rooms'], ['12K+', 'Guests'], ['98%', 'Satisfaction']].map(([val, lbl]) => (
                <div key={lbl}>
                  <p className="text-2xl font-bold" style={{ color: '#c9a227' }}>{val}</p>
                  <p className="text-gray-500 text-xs">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-700 text-xs">© 2026 HospEase. All rights reserved.</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL  — form
      ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto" style={{ background: '#f8fafc' }}>
        <div className={`w-full max-w-md transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e, #1a2744)' }}>
              <img src={hospeaseLogo} alt="HospEase" className="w-8 h-8 object-contain" />
            </div>
            <span className="font-bold text-gray-900 text-xl">HospEase</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-2">
              Sign in to your portal, or{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: '#1a2744' }}>
                create a guest account
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 rounded-2xl border flex items-start gap-3 animate-fade-in-right" style={{ background: '#fff5f5', borderColor: '#fecaca' }}>
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7 mb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hospease.com" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all bg-gray-50 hover:bg-white"
                  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.15)'; e.target.style.borderColor = '#c9a227'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <button type="button" className="text-xs font-medium hover:underline" style={{ color: '#1a2744' }}>Forgot password?</button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none transition-all bg-gray-50 hover:bg-white"
                    onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.15)'; e.target.style.borderColor = '#c9a227'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]"
                style={{ background: loading ? '#1a2744' : 'linear-gradient(135deg, #0a0f1e 0%, #1a2744 100%)', boxShadow: loading ? '' : '0 4px 24px rgba(10,15,30,0.25)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo Quick Login */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Quick Demo</span>
              </div>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isActive = activeDemo === acc.email;
                return (
                  <button
                    key={acc.email}
                    onClick={() => quickLogin(acc)}
                    disabled={loading}
                    className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                    style={{
                      background: isActive ? '#f0f4ff' : '#fafafa',
                      borderColor: isActive ? '#c7d2fe' : '#e5e7eb',
                      color: '#374151',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.borderColor = '#a5b4fc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? '#f0f4ff' : '#fafafa'; e.currentTarget.style.borderColor = isActive ? '#c7d2fe' : '#e5e7eb'; }}
                  >
                    {/* Shimmer on active */}
                    {isActive && (
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_0.8s_infinite]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }} />
                    )}
                    <span className="text-base flex-shrink-0">{acc.emoji}</span>
                    <span className="truncate">{acc.role}</span>
                    {isActive && (
                      <svg className="animate-spin w-3 h-3 ml-auto flex-shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">Click any role to instantly demo that portal</p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">© 2026 HospEase · All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
