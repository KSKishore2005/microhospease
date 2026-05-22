import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Star, Shield, Coffee, Sparkles, Activity,
  MapPin, Menu, X, Phone, Mail, Clock, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { hospeaseLogo } from '../components/common/HospEaseLogo';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80',
    title: "Redefining Luxury,",
    highlight: "One Stay at a Time",
    sub: "A symphony of comfort, elegance, and world-class hospitality — tailored exclusively for you.",
  },
  {
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80',
    title: "Experience the Art of",
    highlight: "Refined Hospitality",
    sub: "Every moment meticulously curated to elevate your senses beyond imagination.",
  },
  {
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80',
    title: "Your Sanctuary,",
    highlight: "Your Escape",
    sub: "Step into a world where every detail is a reflection of impeccable taste and care.",
  },
];

const ROOMS_DATA = [
  { name: 'Standard Sanctuary', type: 'SINGLE', price: 120, capacity: '1 Guest', beds: '1 King Bed', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80' },
  { name: 'Deluxe Haven', type: 'DOUBLE', price: 190, capacity: '2 Guests', beds: '2 Queen Beds', img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80' },
  { name: 'Executive Suite', type: 'SUITE', price: 320, capacity: '3 Guests', beds: 'King + Lounge', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80' },
  { name: 'Presidential Oasis', type: 'DELUXE', price: 550, capacity: '4 Guests', beds: 'Grand King Suite', img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80' },
];

const SERVICES = [
  { icon: <Coffee size={22} />, name: 'Fine Dining', desc: 'Michelin-inspired menus crafted by world-class culinary artisans.', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80' },
  { icon: <Sparkles size={22} />, name: 'Spa & Wellness', desc: 'Holistic therapies and premium rejuvenating spa treatments.', img: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80' },
  { icon: <Activity size={22} />, name: 'Elite Fitness', desc: 'State-of-the-art gym with personal trainers and yoga studios.', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80' },
  { icon: <Shield size={22} />, name: '24/7 Concierge', desc: 'Round-the-clock dedicated butler and concierge services.', img: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=600&q=80' },
];

const STATS = [
  { value: '15+', label: 'Years of Excellence' },
  { value: '5★', label: 'Luxury Rating' },
  { value: '2,400+', label: 'Happy Guests' },
  { value: '24/7', label: 'Concierge Service' },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getPortalPath = () => {
    if (!user) return '/login';
    const paths: Record<string, string> = {
      GUEST: '/guest', FRONT_DESK: '/frontdesk', HOUSEKEEPING: '/housekeeping',
      SERVICE_STAFF: '/servicestaff', FINANCE: '/finance', MANAGER: '/manager',
      ADMIN: '/admin', REPORTING: '/reporting',
    };
    return paths[user.role] ?? '/login';
  };

  const filteredRooms = roomFilter === 'ALL' ? ROOMS_DATA : ROOMS_DATA.filter((r) => r.type === roomFilter);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/95 backdrop-blur-md shadow-xl py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={hospeaseLogo} alt="HospEase" className="w-9 h-9 rounded-xl object-contain shadow-md" />
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">HospEase</span>
              <p className="text-[10px] text-amber-400/70 font-medium -mt-0.5 hidden sm:block">Smart Hotel Management</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            {[['Home', '#home'], ['About', '#about'], ['Services', '#services'], ['Rooms', '#rooms']].map(([label, href]) => (
              <a key={label} href={href} className="text-gray-300 hover:text-amber-400 transition-colors">{label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={getPortalPath()} className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 rounded-full hover:opacity-90 transition-all shadow-md">
                My Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2.5 text-sm font-semibold text-amber-300 border border-amber-400/30 rounded-full hover:bg-amber-400/10 transition-all">Sign In</Link>
                <Link to="/register" className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 rounded-full hover:opacity-90 transition-all shadow-md">Get Started</Link>
              </>
            )}
          </div>

          <button className="md:hidden text-amber-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/98 border-t border-slate-800 px-6 py-6 flex flex-col gap-4">
            {[['Home', '#home'], ['About', '#about'], ['Services', '#services'], ['Rooms', '#rooms']].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileMenuOpen(false)} className="text-gray-300 font-semibold hover:text-amber-400 text-base">{label}</a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
              {isAuthenticated ? (
                <Link to={getPortalPath()} className="py-3 text-center font-bold bg-amber-400 text-slate-950 rounded-xl">My Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="py-3 text-center font-semibold text-amber-400 border border-amber-400/30 rounded-xl">Sign In</Link>
                  <Link to="/register" className="py-3 text-center font-bold bg-amber-400 text-slate-950 rounded-xl">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section id="home" className="relative h-screen w-full bg-slate-950 overflow-hidden">
        {HERO_SLIDES.map((s, idx) => (
          <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === slide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img src={s.image} alt="Hotel" className="w-full h-full object-cover scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-900/60" />
          </div>
        ))}

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/15 border border-amber-400/30 rounded-full mb-6">
            <Star size={12} className="text-amber-400" fill="currentColor" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">5-Star Luxury Hotel</span>
          </div>
          {HERO_SLIDES.map((s, idx) => (
            <div key={idx} className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-opacity duration-1000 ${idx === slide ? 'opacity-100' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/15 border border-amber-400/30 rounded-full mb-6">
                <Star size={12} className="text-amber-400" fill="currentColor" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">5-Star Luxury Hotel</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-white leading-tight mb-4">
                {s.title}<br />
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">{s.highlight}</span>
              </h1>
              <p className="text-gray-300 max-w-lg text-base md:text-lg mb-10 leading-relaxed">{s.sub}</p>
              <div className="flex gap-4 flex-wrap justify-center">
                <Link to="/login" className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black rounded-full hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300">
                  Book Your Stay
                </Link>
                <a href="#rooms" className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-full hover:bg-white/20 transition-all flex items-center gap-2">
                  Explore Rooms <ArrowRight size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-amber-400' : 'w-2 bg-white/30'}`} />
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 right-8 z-30 flex flex-col items-center gap-1 text-white/40">
          <span className="text-[10px] font-bold uppercase tracking-widest rotate-90 mb-2">Scroll</span>
          <ChevronDown size={16} className="animate-bounce" />
        </div>
      </section>

      {/* ── Stats Belt ─────────────────────────────────────────── */}
      <div className="bg-slate-950 border-t border-amber-500/20">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── About Section ──────────────────────────────────────── */}
      <section id="about" className="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 to-orange-400/10 rounded-3xl blur-2xl" />
          <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" alt="About HospEase" className="relative rounded-3xl shadow-2xl object-cover w-full h-[420px]" />
          <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-xl p-5 flex items-center gap-4 border border-gray-100">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><Star size={22} fill="currentColor" /></div>
            <div>
              <p className="font-black text-slate-900 text-lg">5-Star Rated</p>
              <p className="text-xs text-gray-400 font-semibold">Consistently Excellence</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full border border-amber-100">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-amber-700 uppercase tracking-widest">About HospEase</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
            Where Luxury Meets<br />
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Genuine Comfort</span>
          </h2>
          <p className="text-gray-500 leading-relaxed text-base">
            HospEase represents the pinnacle of bespoke hospitality. We blend timeless elegance with modern technology to craft an experience that's entirely personal — from the moment you arrive to the moment you leave.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            {[['15+', 'Years of excellence in luxury hospitality'], ['24/7', 'Dedicated butler and concierge service']].map(([v, l]) => (
              <div key={v}>
                <p className="text-3xl font-black text-slate-900">{v}</p>
                <p className="text-sm text-gray-400 mt-1 leading-snug">{l}</p>
              </div>
            ))}
          </div>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-amber-400 font-bold rounded-full hover:bg-slate-800 transition-all">
            Reserve a Room <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Services Section ───────────────────────────────────── */}
      <section id="services" className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-xs font-black tracking-widest uppercase mb-3">Our Signature Amenities</p>
            <h2 className="text-3xl md:text-5xl font-black text-white">Premium Services & Experiences</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => (
              <div key={i} className="group relative rounded-3xl overflow-hidden h-72 flex flex-col justify-end p-6 border border-white/8 hover:border-amber-400/40 transition-all duration-300">
                <img src={s.img} alt={s.name} className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mb-3 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all duration-300 border border-amber-400/30">
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-black text-white mb-1 group-hover:text-amber-300 transition-colors">{s.name}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rooms Section ──────────────────────────────────────── */}
      <section id="rooms" className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <p className="text-amber-600 text-xs font-black tracking-widest uppercase mb-2">Our Accommodations</p>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900">Luxury Rooms & Suites</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'SINGLE', 'DOUBLE', 'SUITE', 'DELUXE'].map((f) => (
              <button key={f} onClick={() => setRoomFilter(f)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${roomFilter === f ? 'bg-slate-900 border-slate-900 text-amber-400 shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-slate-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRooms.map((r, i) => (
            <div key={i} className="group bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="h-52 overflow-hidden relative">
                <img src={r.img} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-amber-400 text-xs font-black px-3 py-1.5 rounded-full border border-amber-400/20">
                  ${r.price}<span className="text-amber-300/70">/night</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-black text-slate-900 text-base leading-snug">{r.name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold mt-1.5 mb-4">
                  <span className="flex items-center gap-1"><MapPin size={11} /> Premium Wing</span>
                  <span>· {r.beds}</span>
                  <span>· {r.capacity}</span>
                </div>
                <button onClick={() => navigate('/login')}
                  className="w-full py-2.5 rounded-2xl bg-gray-50 group-hover:bg-slate-900 group-hover:text-amber-400 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2">
                  Book Now <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="mx-6 mb-20 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 border border-amber-400/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-8 py-16 text-center">
          <p className="text-amber-400 text-xs font-black tracking-widest uppercase mb-3">Limited Availability</p>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Ready for an Unforgettable Stay?</h2>
          <p className="text-gray-400 text-base mb-8 max-w-md mx-auto">Join thousands of guests who have experienced the HospEase difference. Book your stay today.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black rounded-full hover:scale-105 transition-all shadow-xl shadow-amber-500/20">
              Create Account & Book
            </Link>
            <Link to="/login" className="px-8 py-4 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all">
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-800 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={hospeaseLogo} alt="HospEase" className="w-9 h-9 rounded-xl object-contain" />
              <div>
                <span className="font-black text-white text-lg">HospEase</span>
                <p className="text-amber-400/70 text-[10px] font-medium">Smart Hotel Management System</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed">Redefining luxury hospitality through innovation and impeccable service. Your perfect stay awaits.</p>
          </div>
          {/* Links */}
          <div>
            <p className="text-white font-bold mb-4 text-sm">Quick Links</p>
            <div className="flex flex-col gap-2 text-sm">
              {[['Home', '#home'], ['About', '#about'], ['Services', '#services'], ['Rooms', '#rooms']].map(([l, h]) => (
                <a key={l} href={h} className="hover:text-amber-400 transition-colors">{l}</a>
              ))}
            </div>
          </div>
          {/* Contact */}
          <div>
            <p className="text-white font-bold mb-4 text-sm">Contact</p>
            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex items-center gap-2"><Phone size={14} className="text-amber-400" /> +1 (555) 100-HOSP</div>
              <div className="flex items-center gap-2"><Mail size={14} className="text-amber-400" /> hello@hospease.com</div>
              <div className="flex items-center gap-2"><Clock size={14} className="text-amber-400" /> Check-in 3 PM · Check-out 11 AM</div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} HospEase Hotel Group. All rights reserved.</p>
          <p>Built with care for exceptional hospitality experiences.</p>
        </div>
      </footer>
    </div>
  );
}
