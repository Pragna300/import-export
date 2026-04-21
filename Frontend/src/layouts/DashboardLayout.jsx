import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Truck, 
  Search, 
  ShieldAlert, 
  Map,
  LogOut, 
  Menu, 
  X,
  Bell,
  User
} from 'lucide-react';

const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Analytics Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents Module', href: '/dashboard/documents', icon: FileText },
    { name: 'Shipments Module', href: '/dashboard/shipments', icon: Truck },
    { name: 'HSN Module', href: '/dashboard/hsn', icon: Search },
    { name: 'Duty & Risk Module', href: '/dashboard/risk', icon: ShieldAlert },
    { name: 'Live Tracking', href: '/dashboard/tracking', icon: Map },
  ];

  const handleLogout = () => {
    // Clear tokens/etc later
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* Sidebar */}
      <aside className={`bg-brand-navy text-white w-64 fixed h-full transition-transform duration-300 z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-700/50">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-xl">S</div>
            <span className="font-bold text-xl tracking-tight">SHNOOR</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white/80 rounded-r-full" />
                )}
                
                <item.icon 
                  size={18} 
                  className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:text-blue-600'}`} 
                />
                <span className="flex-1">{item.name}</span>
                
                {isActive && <div className="absolute inset-0 animate-shimmer-subtle pointer-events-none opacity-10" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 w-full px-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 Transition-colors w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 min-w-0 w-full overflow-x-hidden transition-all duration-300 lg:ml-64`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <button 
            className="p-2 -mr-2 text-slate-500 lg:hidden" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 flex justify-end items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-blue-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Admin User</p>
                <p className="text-xs text-slate-500 capitalize">Operations Employee</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                <User size={24} />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
