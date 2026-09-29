import { useEffect, useMemo, useState } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import Verify from "./components/Verify";
import AuditLogs from "./components/AuditLogs";
import AlertPanel from "./components/AlertPanel";
import RoleBadge from "./components/RoleBadge";
import AdminDashboard from "./components/AdminDashboard";
import UserProfile from "./components/UserProfile";
import DocumentBrowser from "./components/DocumentBrowser";
import { 
  Bell, 
  FileUp, 
  ShieldCheck, 
  FolderGit2, 
  UserCheck, 
  LayoutDashboard, 
  History,
  Lock,
  Cpu,
  LogOut,
  Sun,
  Moon,
  Laptop
} from "lucide-react";
import logoImg from "./assets/logo.png";
import api from "./api/client";
import "./App.css";

/* ---------------- TOAST COMPONENT ---------------- */

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const variantClass =
    toast.variant === "success"
      ? "toastSuccess"
      : toast.variant === "error"
      ? "toastError"
      : "";

  return (
    <div
      className={`toast toastIn toastEnhanced ${variantClass}`}
      role="status"
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <p className="toastTitle">{toast.title}</p>
        <button className="btn btnSmall" type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="toastMsg">{toast.message}</p>
    </div>
  );
}

/* ---------------- MAIN APP ---------------- */

function App() {
  // 1️⃣ ALL HOOKS FIRST — NO RETURNS ABOVE THIS

  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("docvault.auth");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState("register");
  const [unauthView, setUnauthView] = useState("landing");
  const [toast, setToast] = useState(null);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [userPermissions, setUserPermissions] = useState([]);
  
  const notify = (payload) => {
    const next = {
      title: payload?.title ?? "Notice",
      message: payload?.message ?? "",
      variant: payload?.variant ?? "info",
    };
    setToast(next);

    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(
      () => setToast(null),
      payload?.timeoutMs ?? 2400
    );
  };

  const [themePref, setThemePref] = useState(() => {
    return localStorage.getItem("docvault.theme") ?? "system";
  });

  const tabs = useMemo(() => {
    if (auth?.role === "guest") {
      return [
        { id: "verify", label: "Verify", description: "Tamper & integrity check", icon: ShieldCheck },
        { id: "documents", label: "Documents", description: "Browse document ledger", icon: FolderGit2 },
        { id: "profile", label: "Profile", description: "Identity & RBAC claims", icon: UserCheck },
      ];
    }

    const baseTabs = [
      { id: "register", label: "Register", description: "Cryptographic hash & sign", icon: FileUp },
      { id: "verify", label: "Verify", description: "Tamper & integrity check", icon: ShieldCheck },
      { id: "documents", label: "Documents", description: "Browse document ledger", icon: FolderGit2 },
      { id: "profile", label: "Profile", description: "Identity & RBAC claims", icon: UserCheck },
    ];

    if (auth?.role === "admin") {
      baseTabs.push({
        id: "dashboard",
        label: "Dashboard",
        description: "System overview & stats",
        icon: LayoutDashboard,
      });
      baseTabs.push({
        id: "audit",
        label: "Audit logs",
        description: "Append-oriented audit trail",
        icon: History,
      });
    }

    return baseTabs;
  }, [auth]);

  useEffect(() => {
    if (auth?.role === "guest" && activeTab === "register") {
      setActiveTab("verify");
    }
  }, [auth, activeTab]);

  useEffect(() => {
    if (themePref === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themePref);
    }
    localStorage.setItem("docvault.theme", themePref);
  }, [themePref]);

  // Fetch user info and unread alerts when authenticated
  useEffect(() => {
    if (!auth) return;

    const fetchUserInfo = async () => {
      try {
        const response = await api.get("/me");
        setUnreadAlerts(response.data.unread_alerts || 0);
        setUserPermissions(response.data.permissions || []);
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };

    fetchUserInfo();
    
    // Poll for new alerts every 60 seconds
    const interval = setInterval(fetchUserInfo, 60000);
    return () => clearInterval(interval);
  }, [auth]);

  // 2️⃣ HANDLERS

  const handleLogin = (authData) => {
    setAuth(authData);
    localStorage.setItem("docvault.auth", JSON.stringify(authData));
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem("docvault.auth");
    setActiveTab("register");
    setUnauthView("landing");
  };

  const refreshUnreadAlerts = () => {
    if (!auth) return;
    api.get("/me")
      .then((res) => setUnreadAlerts(res.data.unread_alerts || 0))
      .catch(console.error);
  };

  // 3️⃣ NOW IT IS SAFE TO RETURN CONDITIONALLY

  if (!auth) {
    if (unauthView === "login") {
      return (
        <Login 
          onLogin={handleLogin} 
          onBackToHome={() => setUnauthView("landing")} 
        />
      );
    }
    return (
      <LandingPage
        onLaunchLogin={() => setUnauthView("login")}
        onLaunchGuest={async () => {
          try {
            const res = await api.post("/login/guest");
            handleLogin(res.data);
          } catch (err) {
            alert(err.response?.data?.detail || "Unable to start guest session. Please verify backend connection.");
          }
        }}
        themePref={themePref}
        setThemePref={setThemePref}
      />
    );
  }

  /* ---------- UI ---------- */
  return (
    <>
      <div className="enterpriseLayout">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="enterpriseSidebar">
          {/* Logo Branding */}
          <div className="sidebarBrand">
            <div className="sidebarLogoBox">
              <img src={logoImg} alt="DocVault Logo" className="sidebarLogo" />
            </div>
            <div className="sidebarBrandText">
              <h1 className="sidebarTitle">DOCVAULT</h1>
              <span className="sidebarSubtitle">ZERO-KNOWLEDGE VAULT</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="sidebarSectionLabel">MODULES</div>
          <nav className="sidebarNav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  className={isActive ? "sidebarNavItem sidebarNavItemActive" : "sidebarNavItem"}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="sidebarNavIcon">
                    {Icon && <Icon size={18} strokeWidth={2.5} />}
                  </span>
                  <div className="sidebarNavText">
                    <span className="sidebarNavLabel">{tab.label}</span>
                    <span className="sidebarNavHint">{tab.description}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer: User Card & Logout */}
          <div className="sidebarFooter">
            <div className="sidebarUserCard">
              <div className="sidebarAvatar">
                {auth?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="sidebarUserInfo">
                <span className="sidebarUserName">{auth?.username || 'User'}</span>
                <RoleBadge role={auth?.role} />
              </div>
              <button
                type="button"
                className="sidebarLogoutBtn"
                onClick={handleLogout}
                title="Sign out of DocVault"
                aria-label="Logout"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="logoutIconSvg"
                  style={{ width: '18px', height: '18px', display: 'block', flexShrink: 0 }}
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2.5" />
                  <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2.5" />
                  <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2.5" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN WORKSPACE */}
        <div className="enterpriseMain">
          {/* Executive Top Header Bar */}
          <header className="enterpriseTopBar">
            <div className="topBarLeft">
              <div className="topBarBreadcrumb">
                <span className="breadcrumbRoot">DocVault</span>
                <span className="breadcrumbSlash">/</span>
                <span className="breadcrumbCurrent">
                  {tabs.find((t) => t.id === activeTab)?.label || "Registry"}
                </span>
              </div>
            </div>

            <div className="topBarRight">
              <div className="topBarFeatureBadge" title="Cryptographically Anchored">
                <ShieldCheck size={14} strokeWidth={2.5} />
                <span>SHA-256 LEDGER</span>
              </div>

              {/* Alert Bell Button */}
              <button
                className="alertBellBtn"
                onClick={() => setAlertPanelOpen(true)}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={2.5} />
                {unreadAlerts > 0 && (
                  <span className="alertBellBadge">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>
                )}
              </button>

              {/* Modern Segmented Theme Switcher */}
              <div className="segmentedThemeSwitch" role="group" aria-label="Theme selector">
                <button
                  type="button"
                  className={themePref === "system" ? "segmentedBtn segmentedBtnActive" : "segmentedBtn"}
                  onClick={() => setThemePref("system")}
                  title="System Theme"
                >
                  <Laptop size={13} strokeWidth={2.5} />
                  <span>Sys</span>
                </button>
                <button
                  type="button"
                  className={themePref === "light" ? "segmentedBtn segmentedBtnActive" : "segmentedBtn"}
                  onClick={() => setThemePref("light")}
                  title="Light Theme"
                >
                  <Sun size={13} strokeWidth={2.5} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  className={themePref === "dark" ? "segmentedBtn segmentedBtnActive" : "segmentedBtn"}
                  onClick={() => setThemePref("dark")}
                  title="Dark Theme"
                >
                  <Moon size={13} strokeWidth={2.5} />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Workspace Panel */}
          <main className="enterprisePanel">
            <div className="panel">
              {activeTab === "register" && <Register onNotify={notify} onAlertCreated={refreshUnreadAlerts} />}
              {activeTab === "verify" && <Verify onNotify={notify} onAlertCreated={refreshUnreadAlerts} />}
              {activeTab === "documents" && <DocumentBrowser onNotify={notify} currentUser={auth} onSelectVerify={() => setActiveTab("verify")} />}
              {activeTab === "profile" && <UserProfile onNotify={notify} currentUser={auth} />}
              {activeTab === "dashboard" && auth.role === "admin" && (
                <AdminDashboard onNotify={notify} />
              )}
              {activeTab === "audit" && auth.role === "admin" && (
                <AuditLogs onNotify={notify} />
              )}
            </div>
          </main>
        </div>

        <AlertPanel 
          isOpen={alertPanelOpen} 
          onClose={() => {
            setAlertPanelOpen(false);
            refreshUnreadAlerts();
          }} 
          onNotify={notify}
        />

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </>
  );
}

export default App;
