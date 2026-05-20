import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main key={pathname} className="flex-1 overflow-y-auto p-6 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
