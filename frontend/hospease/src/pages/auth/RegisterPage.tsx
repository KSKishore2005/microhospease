import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';

const features = [
  { icon: '🛏️', text: 'Book & manage reservations online' },
  { icon: '🔔', text: 'Request in-room services anytime' },
  { icon: '📄', text: 'View bills and payment history' },
  { icon: '⭐', text: 'Earn and redeem loyalty rewards' },
];

export default function RegisterPage() {
  const { register, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleRedirects: Record<string, string> = {
    ADMIN: '/admin', MANAGER: '/manager', FRONT_DESK: '/frontdesk',
    HOUSEKEEPING: '/housekeeping', SERVICE_STAFF: '/servicestaff',
    FINANCE: '/finance', REPORTING: '/reporting', GUEST: '/guest',
  };

  if (isAuthenticated && user) {
    return <Navigate to={roleRedirects[user.role] ?? '/guest'} replace />;
  }

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const result = await register(form.name.trim(), form.email.trim(), form.phone.trim(), form.password);
    setLoading(false);
    if (result.success) navigate('/guest', { replace: true });
    else setError(result.error ?? 'Registration failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left branding panel ─────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-navy-950 flex-col">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-navy-800/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gold-500/8 blur-3xl" />
          <svg className="absolute inset-0 opacity-[0.04]" width="100%" height="100%">
            <defs>
              <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
        </div>

        <div className="relative flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl">HospEase</p>
              <p className="text-gold-400 text-xs font-medium">Guest Portal</p>
            </div>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Your stay,<br />
              <span className="text-gradient-gold">perfectly managed.</span>
            </h2>
            <p className="text-gray-400 mt-4 text-base leading-relaxed">
              Create your guest account to access a world of premium hospitality services at your fingertips.
            </p>
            <div className="mt-8 space-y-4">
              {features.map((f) => (
                <div key={f.text} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-lg flex-shrink-0">
                    {f.icon}
                  </div>
                  <span className="text-gray-300 text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-600 text-xs">&copy; 2026 HospEase. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────── */}
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
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 bg-navy-50 rounded-xl flex items-center justify-center">
                <UserPlus size={17} className="text-navy-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
            </div>
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-navy-700 font-semibold hover:underline">Sign in</Link>
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
              <label className="input-label">Full Name</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" required className="input" />
            </div>
            <div>
              <label className="input-label">Email Address</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required className="input" />
            </div>
            <div>
              <label className="input-label">
                Phone Number
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" className="input" />
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={set('password')} placeholder="Min. 6 characters" required minLength={6}
                  className="input pr-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={set('confirmPassword')} placeholder="Re-enter password" required
                  className="input pr-11"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full justify-center" size="lg" loading={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-5 text-xs text-gray-400 text-center leading-relaxed">
            By registering you agree to our{' '}
            <span className="text-gray-500 font-medium cursor-pointer hover:underline">Terms of Service</span> and{' '}
            <span className="text-gray-500 font-medium cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
