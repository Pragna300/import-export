import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import config from '../config';
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
  User,
  Settings,
  Camera,
  ChevronDown
} from 'lucide-react';

const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState(() => {
    const cachedProfile = localStorage.getItem('cached_user_profile');
    if (cachedProfile) {
      try { return JSON.parse(cachedProfile); } catch (e) { return { name: 'Loading...', role: '', email: '', photo_url: null }; }
    }
    return { name: 'Loading...', role: '', email: '', photo_url: null };
  });
  const [isDropdownOpen, setDropdownOpen] = React.useState(false);
  const [isEditModalOpen, setEditModalOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ 
    name: userProfile.name !== 'Loading...' ? userProfile.name : '', 
    photo_url: userProfile.photo_url || '' 
  });
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      try {
        const response = await fetch(`${config.API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const updatedProfile = { 
            name: data.name || data.email.split('@')[0], 
            role: data.role === 'user' ? 'employee' : data.role, 
            email: data.email,
            photo_url: data.photo_url 
          };
          setUserProfile(updatedProfile);
          setEditForm({ 
            name: updatedProfile.name, 
            photo_url: updatedProfile.photo_url || '' 
          });
          
          // Cache for instant loading next time
          localStorage.setItem('cached_user_profile', JSON.stringify(updatedProfile));
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        const data = await response.json();
        const updatedProfile = { 
          name: data.name || data.email.split('@')[0], 
          role: data.role === 'user' ? 'employee' : data.role,
          email: data.email,
          photo_url: data.photo_url
        };
        setUserProfile(updatedProfile);
        localStorage.setItem('cached_user_profile', JSON.stringify(updatedProfile));
        setEditModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  const navigation = [
    { name: 'Analytics Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents Module', href: '/dashboard/documents', icon: FileText },
    { name: 'Shipments', href: '/dashboard/shipments', icon: Truck },
    { name: 'HSN Classifier', href: '/dashboard/hsn', icon: Search },
    { name: 'Duty & Risk Module', href: '/dashboard/risk', icon: ShieldAlert },
    { name: 'Live Tracking', href: '/dashboard/tracking', icon: Map },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('cached_user_profile');
    navigate('/');
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
            <div className="relative">
              <button 
                className="flex items-center gap-3 pl-2 hover:bg-slate-50 p-1 rounded-lg transition-colors text-left"
                onClick={() => setDropdownOpen(!isDropdownOpen)}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">{userProfile.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{userProfile.role ? userProfile.role.replace('_', ' ') : 'Employee'}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                  {userProfile.photo_url ? (
                    <img src={userProfile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 mb-2">
                    <p className="text-sm font-bold text-slate-900">{userProfile.name}</p>
                    <p className="text-xs text-slate-500 truncate">{userProfile.email}</p>
                  </div>
                  <button 
                    onClick={() => { setEditModalOpen(true); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                  >
                    <Settings size={16} />
                    Edit Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      
      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button 
              onClick={() => setEditModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-1"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-slate-900 mb-6">Edit Profile</h2>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex justify-center mb-6">
                <label className="relative w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden group cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditForm({ ...editForm, photo_url: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                  {editForm.photo_url ? (
                    <img src={editForm.photo_url} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-400 group-hover:scale-110 transition-transform" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={userProfile.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">* Email address cannot be changed.</p>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-500 mt-1">Click the profile picture above to upload a photo from your device.</p>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg font-medium transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
