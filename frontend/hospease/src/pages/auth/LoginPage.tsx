import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import hospeaseLogo from '../../assets/hospease-logo.png';
import hotelBg from '../../assets/hero.jpg';

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
    <div
      className="min-h-screen flex overflow-hidden relative"
      style={{
        fontFamily: "'Inter','Segoe UI',sans-serif",
        backgroundImage: `url(${hotelBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ── Full-page overlay for legibility ── */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'linear-gradient(to bottom, rgba(4,12,30,0.45) 0%, rgba(4,12,30,0.25) 40%, rgba(4,12,30,0.55) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'linear-gradient(to right, rgba(4,12,30,0.35) 0%, transparent 50%, rgba(4,12,30,0.55) 100%)' }} />

      {/* ═══════════════════════════════════════════
          LEFT PANEL — transparent overlay
      ═══════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[56%] relative flex-col justify-between overflow-hidden z-10"
      >

        {/* ── TOP: Logo ── */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-4">
            {/* Glow halo behind the logo */}
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <div style={{
                position: 'absolute', inset: -8,
                borderRadius: 22,
                background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)',
                filter: 'blur(14px)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'relative',
                width: 64, height: 64, borderRadius: 18, padding: 9, flexShrink: 0,
                background: 'linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.10) 100%)',
                border: '1.5px solid rgba(255,255,255,0.42)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 10px 32px rgba(0,0,0,0.35), inset 0 1.5px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.15)',
              }}>
                <img src={hospeaseLogo} alt="HospEase"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <p style={{
                color: '#fff', fontWeight: 900, fontSize: '1.55rem',
                letterSpacing: '-0.6px', lineHeight: 1,
                textShadow: '0 2px 14px rgba(0,0,0,0.55)',
                margin: 0,
              }}>
                HospEase
              </p>
              <div style={{
                height: 2, width: 36, borderRadius: 99,
                background: 'linear-gradient(90deg, #fde68a, #f59e0b)',
                boxShadow: '0 0 8px rgba(251,191,36,0.5)',
              }} />
            </div>
          </div>
        </div>

        {/* ── BOTTOM: Headline + tagline ── */}
        <div className="relative z-10 p-10 pb-12">
          {/* Main headline */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 3.8vw, 3.3rem)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-1.5px',
            color: '#fff',
            textShadow: '0 4px 24px rgba(0,0,0,0.5)',
            marginBottom: 16,
          }}>
            Elevate Every<br />
            <span style={{
              background: 'linear-gradient(92deg, #fde68a 0%, #fbbf24 40%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Guest Experience.
            </span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14.5,
            lineHeight: 1.7,
            maxWidth: 340,
            textShadow: '0 2px 10px rgba(0,0,0,0.4)',
          }}>
            One unified command center for rooms, reservations, housekeeping and revenue — powered by real-time intelligence.
          </p>

        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Glass login card (transparent)
      ═══════════════════════════════════════════ */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-10 relative overflow-hidden z-10"
      >

        {/* ── Glass card ── */}
        <div className="relative w-full" style={{ maxWidth: 400 }}>

          {/* Top shimmer */}
          <div className="absolute top-0 left-10 right-10 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.42),transparent)', borderRadius: 99 }} />

          <div style={{
            background: 'linear-gradient(150deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.004) 50%, rgba(255,255,255,0.012) 100%)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 28,
            backdropFilter: 'blur(14px) saturate(140%)',
            WebkitBackdropFilter: 'blur(14px) saturate(140%)',
            boxShadow: [
              '0 0 0 1px rgba(255,255,255,0.05) inset',
              '0 1px 0 rgba(255,255,255,0.18) inset',
              '0 -1px 0 rgba(255,255,255,0.04) inset',
              '0 24px 70px rgba(0,0,0,0.28)',
              '0 0 40px rgba(255,255,255,0.04)',
            ].join(','),
          }}>
            <div style={{ padding: '40px 38px 36px' }}>

              {/* Heading */}
              <div style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.6px', lineHeight: 1.1, margin: 0 }}>
                  Welcome back
                </h2>
                <p style={{ fontSize: 13.5, color: 'rgba(186,210,255,0.45)', marginTop: 7, margin: '7px 0 0' }}>
                  Sign in to your enterprise portal
                </p>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginBottom: 20, padding: '13px 16px', borderRadius: 14,
                  background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>!</span>
                  </div>
                  <p style={{ color: '#fca5a5', fontSize: 13, fontWeight: 500, lineHeight: 1.5, margin: 0 }}>{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

                {/* Email */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.13em', textTransform: 'uppercase',
                    color: 'rgba(186,210,255,0.48)', marginBottom: 8,
                  }}>
                    Username
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(147,197,253,0.4)', pointerEvents: 'none' }} />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '13px 16px 13px 42px',
                        borderRadius: 14, fontSize: 14, color: '#fff', outline: 'none',
                        background: 'rgba(255,255,255,0.065)', border: '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.105)'; e.target.style.borderColor = 'rgba(96,165,250,0.52)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.16)'; }}
                      onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.065)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(186,210,255,0.48)', marginBottom: 8 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'rgba(147,197,253,0.4)', pointerEvents: 'none' }} />
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} required
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '13px 46px 13px 42px',
                        borderRadius: 14, fontSize: 14, color: '#fff', outline: 'none',
                        background: 'rgba(255,255,255,0.065)', border: '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.105)'; e.target.style.borderColor = 'rgba(96,165,250,0.52)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.16)'; }}
                      onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.065)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', padding: 3, transition: 'color 0.2s', display: 'flex' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.28)')}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                {/* Sign In button */}
                <button
                  type="submit" disabled={loading}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    padding: '15px 24px', borderRadius: 15, fontWeight: 700, fontSize: 15,
                    color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6,
                    background: loading ? 'rgba(29,78,216,0.6)' : 'linear-gradient(135deg,#1d4ed8 0%,#1e40af 50%,#2563eb 100%)',
                    boxShadow: loading ? 'none' : '0 8px 30px rgba(29,78,216,0.42), inset 0 1px 0 rgba(255,255,255,0.14)',
                    opacity: loading ? 0.65 : 1,
                    transition: 'all 0.22s', position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.boxShadow = '0 14px 42px rgba(29,78,216,0.58), inset 0 1px 0 rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = loading ? 'none' : '0 8px 30px rgba(29,78,216,0.42), inset 0 1px 0 rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'none'; }}
                >
                  {!loading && (
                    <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.1) 50%,transparent 62%)', pointerEvents: 'none' }} />
                  )}
                  {loading ? (
                    <>
                      <svg style={{ width: 16, height: 16, animation: 'loginSpin 0.75s linear infinite', flexShrink: 0 }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Authenticating…
                    </>
                  ) : (
                    <> Sign In <ChevronRight size={16} /> </>
                  )}
                </button>
              </form>

              {/* Register link */}
              <p style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(186,210,255,0.36)', marginTop: 26, marginBottom: 0 }}>
                New to HospEase?{' '}
                <Link to="/register"
                  style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#93c5fd')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#60a5fa')}>
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #4ade80; }
          50%        { opacity: 0.6; box-shadow: 0 0 3px #4ade80; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(15,30,70,0.95) inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff;
        }
      `}</style>
    </div>
  );
}
