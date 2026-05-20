import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Shield, Activity, Coffee, Sparkles, MapPin, Calendar, Users, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80',
    title: "Unveiling the World's",
    highlight: "Finest Luxury Stay",
    sub: "A symphony of luxury, comfort, and personalized hospitality services."
  },
  {
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80',
    title: "Experience Luxury",
    highlight: "Beyond Imagination",
    sub: "Every stay is meticulously curated to elevate your sensory experience."
  }
];

const ROOMS_DATA = [
  { name: 'Standard Sanctuary', type: 'SINGLE', price: 120, capacity: '1 Guest', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80' },
  { name: 'Deluxe Haven', type: 'DOUBLE', price: 190, capacity: '2 Guests', img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80' },
  { name: 'Executive Suite', type: 'SUITE', price: 320, capacity: '3 Guests', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80' },
  { name: 'Presidential Oasis', type: 'DELUXE', price: 550, capacity: '4 Guests', img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80' }
];

const SERVICES = [
  { icon: <Coffee size={24} />, name: 'Food & Fine Dining', desc: 'Savor gourmet dishes handcrafted by Michelin-starred culinary experts.', bg: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80' },
  { icon: <Sparkles size={24} />, name: 'Spa & Wellness', desc: 'Indulge in holistic therapies and premium rejuvenating spa treatments.', bg: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80' },
  { icon: <Activity size={24} />, name: 'Elite Fitness & Yoga', desc: 'Reach your peak potential with personal trainers and advanced equipment.', bg: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80' }
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const getPortalPath = () => {
    if (!user) return '/login';
    const paths: Record<string, string> = {
      GUEST: '/guest', FRONT_DESK: '/frontdesk', HOUSEKEEPING: '/housekeeping',
      SERVICE_STAFF: '/servicestaff', FINANCE: '/finance', MANAGER: '/manager',
      ADMIN: '/admin', REPORTING: '/reporting'
    };
    return paths[user.role] ?? '/login';
  };

  const filteredRooms = roomFilter === 'ALL' ? ROOMS_DATA : ROOMS_DATA.filter((r) => r.type === roomFilter);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-yellow-500/10 shadow-lg px-6 py-4 flex items-center justify-between text-yellow-100">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center text-slate-900 font-extrabold text-xl shadow-md">H</div>
          <span className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-amber-400 bg-clip-text text-transparent">HospEase</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wider">
          {['HOME', 'ABOUT', 'SERVICES', 'ROOMS'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-gray-300 hover:text-amber-400 transition-colors">{item}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <Link to={getPortalPath()} className="px-5 py-2.5 text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-full transition-all duration-300 shadow-md hover:shadow-amber-400/20">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="px-5 py-2.5 text-sm font-semibold text-amber-400 border border-amber-400/30 rounded-full hover:bg-amber-400/10 transition-all">Sign In</Link>
              <Link to="/register" className="px-5 py-2.5 text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-full transition-all shadow-md">Join Now</Link>
            </>
          )}
        </div>

        <button className="md:hidden text-amber-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[73px] left-0 w-full bg-slate-900 border-b border-slate-800 shadow-xl z-40 flex flex-col p-6 gap-4 text-center">
          {['HOME', 'ABOUT', 'SERVICES', 'ROOMS'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300 hover:text-amber-400">{item}</a>
          ))}
          <div className="flex flex-col gap-2.5 pt-4">
            {isAuthenticated ? (
              <Link to={getPortalPath()} className="py-3 text-slate-900 bg-amber-400 rounded-xl font-bold">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="py-3 text-amber-400 border border-amber-400/30 rounded-xl">Sign In</Link>
                <Link to="/register" className="py-3 text-slate-900 bg-amber-400 rounded-xl font-bold">Register</Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="home" className="relative h-[85vh] w-full bg-slate-950 overflow-hidden">
        {HERO_SLIDES.map((s, idx) => (
          <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === slide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img src={s.image} alt="Hotel slide" className="w-full h-full object-cover scale-105 animate-subtle-zoom" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <h1 className="text-4xl md:text-7xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                {s.title} <br />
                <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-amber-500 bg-clip-text text-transparent">{s.highlight}</span>
              </h1>
              <p className="text-gray-300 max-w-xl text-sm md:text-lg mb-8 leading-relaxed">{s.sub}</p>
              <div className="flex gap-4">
                <Link to="/login" className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-slate-950 font-bold rounded-full transition-all hover:scale-105 shadow-lg">Book Stays</Link>
                <a href="#rooms" className="px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white font-bold rounded-full transition-all">Explore Rooms</a>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Booking Quick Bar */}
      <div className="relative z-20 max-w-6xl mx-auto -mt-16 w-[92%] bg-white rounded-3xl shadow-xl border border-gray-100 p-5 md:p-8 grid md:grid-cols-4 gap-4 items-center">
        {[
          { label: 'Check In', value: 'Select Date', icon: <Calendar size={18} /> },
          { label: 'Check Out', value: 'Select Date', icon: <Calendar size={18} /> },
          { label: 'Guests', value: '2 Adults, 0 Kids', icon: <Users size={18} /> },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100/70 cursor-pointer transition-colors">
            <div className="text-amber-500">{f.icon}</div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">{f.label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{f.value}</p>
            </div>
          </div>
        ))}
        <button onClick={() => navigate('/login')} className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold transition-all shadow-md flex items-center justify-center gap-2">
          <span>Find Rooms</span> <ArrowRight size={16} />
        </button>
      </div>

      {/* About Section */}
      <section id="about" className="py-20 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl opacity-20 blur-lg" />
          <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" alt="Spa and Pool" className="relative rounded-3xl shadow-lg object-cover w-full h-[400px] transition-transform duration-500 group-hover:scale-[1.01]" />
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Star size={20} fill="currentColor" /></div>
            <div><p className="font-extrabold text-slate-800">5-Star Luxury</p><p className="text-xs text-gray-400 font-bold">Standard of Excellence</p></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /><span className="text-xs font-bold text-amber-700 tracking-wide uppercase">About HospEase</span></div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">A Symphony of <br /><span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">Luxury & Comfort</span></h2>
          <p className="text-gray-600 leading-relaxed">HospEase represents the peak of bespoke hospitality services. We combine classic, elegant design with state-of-the-art automation systems to create a flawless experience for all guests.</p>
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div><p className="text-3xl font-extrabold text-slate-900 mb-1">15+</p><p className="text-xs font-bold text-gray-400 uppercase">Years of Excellence</p></div>
            <div><p className="text-3xl font-extrabold text-slate-900 mb-1">24/7</p><p className="text-xs font-bold text-gray-400 uppercase">Personalized Butler</p></div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-900 text-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-amber-400 text-xs font-bold tracking-widest uppercase">Our Signature Amenities</p>
            <h2 className="text-3xl md:text-5xl font-extrabold">Exceptional Premium Services</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map((s, i) => (
              <div key={i} className="group relative rounded-3xl overflow-hidden h-80 flex flex-col justify-end p-6 border border-white/10 hover:border-amber-400/30 transition-all shadow-md">
                <img src={s.bg} alt={s.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-40 group-hover:opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="relative z-10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/25 text-amber-400 flex items-center justify-center mb-4 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all duration-300">{s.icon}</div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">{s.name}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Showcase */}
      <section id="rooms" className="py-20 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <p className="text-amber-600 text-xs font-bold tracking-widest uppercase">Explore Accommodations</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">Luxury Rooms & Suites</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['ALL', 'SINGLE', 'DOUBLE', 'SUITE', 'DELUXE'].map((f) => (
              <button key={f} onClick={() => setRoomFilter(f)} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${roomFilter === f ? 'bg-slate-900 border-slate-900 text-amber-400 shadow-md' : 'bg-white border-gray-200 text-slate-600 hover:border-gray-300'}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRooms.map((r, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="h-56 overflow-hidden relative">
                <img src={r.img} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-amber-400 text-xs font-extrabold px-3 py-1.5 rounded-full">${r.price}/Night</div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{r.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-semibold"><MapPin size={12} /> Premium Wing · {r.capacity}</div>
                </div>
                <button onClick={() => navigate('/login')} className="w-full py-3 rounded-2xl bg-gray-50 group-hover:bg-slate-900 group-hover:text-amber-400 text-slate-700 font-bold transition-all flex items-center justify-center gap-2">Book Now <ArrowRight size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 text-gray-400 py-12 px-6 border-t-2 border-amber-500/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-bold text-sm">H</div>
            <span className="font-extrabold text-white">HospEase Grand Hotel</span>
          </div>
          <p>© {new Date().getFullYear()} HospEase Hotel Group. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
