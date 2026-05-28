import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import hospeaseLogo from '../../assets/hospease-logo.png';

const roleRedirects: Record<string, string> = {
  ADMIN: '/admin', MANAGER: '/manager', FRONT_DESK: '/frontdesk',
  HOUSEKEEPING: '/housekeeping', SERVICE_STAFF: '/servicestaff',
  FINANCE: '/finance', REPORTING: '/reporting', GUEST: '/guest',
};

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 lg:p-12 overflow-y-auto" style={{ background: '#f8fafc' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
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
          <div className="mb-5 p-4 rounded-2xl border flex items-start gap-3" style={{ background: '#fff5f5', borderColor: '#fecaca' }}>
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7">
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

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 HospEase · All rights reserved</p>
      </div>
    </div>
  );
}
