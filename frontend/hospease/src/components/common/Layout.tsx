import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-[260px] h-full animate-slide-left">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile topbar with hamburger */}
        <div className="lg:hidden flex items-center h-[48px] px-4 bg-navy-950 border-b border-white/8">
          <button onClick={() => setMobileOpen(true)} className="text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Menu size={20} />
          </button>
          <span className="text-white font-bold text-sm ml-3">HospEase</span>
        </div>
        <Header />
        <main key={pathname} className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in-up">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
