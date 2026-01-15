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
} from 'lucide-react';
import { Badge, Button, Drawer } from '@/components/ui';
import { authAPI, alertAPI } from '@/api/client';
import type { Alert, User } from '@/types';
import './AppShell.css';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

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
    <div className="app-shell">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-logo">
            <Shield size={24} />
            <span>DocVault</span>
          </div>
        </div>

        <div className="topbar-search">
          <Search size={18} />
          <input type="text" placeholder="Search... (⌘K)" />
        </div>

        <div className="topbar-right">
          <button
            className="topbar-icon-btn"
            onClick={() => setAlertsOpen(true)}
            aria-label="View alerts"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="topbar-badge">{unreadCount}</span>}
          </button>

          <div className="topbar-user">
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user?.username}</span>
              <Badge variant="role" type={user?.role}>
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <>
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="sidebar-badge">{item.badge}</span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className={`sidebar-item sidebar-item-logout`}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">{children}</main>

      {/* Alerts Drawer */}
      <Drawer
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        title="Alerts"
      >
        {alerts.length === 0 ? (
          <div className="alerts-empty">
            <p>✓ No active alerts</p>
            <p className="alerts-empty-subtitle">All systems operating normally</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert-item ${alert.read ? 'alert-item-read' : ''}`}
              >
                <Badge variant="severity" type={alert.severity}>
                  {alert.severity}
                </Badge>
                <h4 className="alert-title">{alert.title}</h4>
                <p className="alert-message">{alert.message}</p>
                <span className="alert-timestamp">{alert.timestamp}</span>
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
