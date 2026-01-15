import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  FileCheck,
  ScrollText,
  AlertTriangle,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { Badge, Button, Drawer } from '@/components/ui';
import { authAPI, alertAPI } from '@/api/client';
import type { Alert, User } from '@/types';
// import './AppShell.css'; // Removed, migrated to Tailwind

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Default to closed on mobile (assumed width < 768) and open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await alertAPI.getAll();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setAlerts([]);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const unreadCount = Array.isArray(alerts) ? alerts.filter((a) => !a.read).length : 0;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/verify', label: 'Verify', icon: Shield },
    { path: '/register', label: 'Register', icon: FileCheck },
    { path: '/audit', label: 'Audit Logs', icon: ScrollText },
    { path: '/alerts', label: 'Alerts', icon: AlertTriangle, badge: unreadCount },
    { path: '/users', label: 'Users', icon: Users, adminOnly: true },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="flex h-screen bg-gray-50 flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="min-h-[4rem] md:h-16 h-auto py-2 bg-white border-b-2 md:border-b-4 border-black flex flex-wrap items-center justify-between px-4 z-30 shrink-0 relative gap-2 md:gap-4">
        <div className="flex items-center gap-4">
          <button
            className="flex md:hidden items-center justify-center p-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 text-xl font-black uppercase">
            <Shield size={24} />
            <span className="hidden md:inline">DocVault</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4 hidden md:flex items-center px-4 h-10 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search... (⌘K)" 
            className="flex-1 ml-2 border-none outline-none font-bold placeholder:font-normal"
          />
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4">
          <button
            className="relative p-2 hover:bg-gray-100 rounded-full"
            onClick={() => setAlertsOpen(true)}
            aria-label="View alerts"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex flex-col items-end">
            <span className="text-sm font-bold hidden md:inline">{user?.username}</span>
            <Badge variant="role" type={user?.role} className="max-w-[100px] truncate">
              {user?.role}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden border-8 border-black"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 md:border-r-4 border-black transition-transform duration-300 flex flex-col pt-16 md:pt-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 md:border-r-4
          `}
        >
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 p-3 rounded-none border-2 border-transparent transition-all
                    ${isActive 
                      ? 'bg-primary-100 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                      : 'hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full border border-red-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t-2 md:border-t-4 border-black bg-gray-50">
            <button
              className="flex w-full items-center gap-3 p-3 hover:bg-red-50 text-red-600 font-bold border-2 border-transparent hover:border-red-600 hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] transition-all"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-gray-50/50 w-full">
          {children}
        </main>
      </div>

      {/* Alerts Drawer */}
      <Drawer
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        title="Alerts"
      >
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-4">
            <p className="text-xl font-bold">✓ No active alerts</p>
            <p className="text-sm">All systems operating normally</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${alert.read ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="severity" type={alert.severity}>
                    {alert.severity}
                  </Badge>
                  <span className="text-xs font-mono opacity-60">{alert.timestamp}</span>
                </div>
                <h4 className="font-bold mb-1">{alert.title}</h4>
                <p className="text-sm mb-3">{alert.message}</p>
                {!alert.read && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      alertAPI.markAsRead(alert.id);
                      setAlerts((prev) =>
                        prev.map((a) => (a.id === alert.id ? { ...a, read: true } : a))
                      );
                    }}
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
};
