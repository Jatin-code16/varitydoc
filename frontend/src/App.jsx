import { useEffect, useMemo, useState } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import Verify from "./components/Verify";
import AuditLogs from "./components/AuditLogs";
import AlertPanel from "./components/AlertPanel";
import RoleBadge from "./components/RoleBadge";
import AdminDashboard from "./components/AdminDashboard";
import UserProfile from "./components/UserProfile";
import DocumentBrowser from "./components/DocumentBrowser";
import ParticleBackground from "./components/ParticleBackground";
import AnimatedGradientBg from "./components/AnimatedGradientBg";
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
    const baseTabs = [
      { id: "register", label: "Register", description: "Store a document hash" },
      { id: "verify", label: "Verify", description: "Check document authenticity" },
      { id: "documents", label: "Documents", description: "Browse all documents" },
      { id: "profile", label: "Profile", description: "Account settings" },
    ];

    if (auth?.role === "admin") {
      baseTabs.push({
        id: "dashboard",
        label: "Dashboard",
        description: "Admin overview",
      });
      baseTabs.push({
        id: "audit",
        label: "Audit logs",
        description: "View activity history",
      });
    }

    return baseTabs;
  }, [auth]);

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
  };

  const refreshUnreadAlerts = () => {
    if (!auth) return;
    api.get("/me")
      .then((res) => setUnreadAlerts(res.data.unread_alerts || 0))
      .catch(console.error);
  };

  // 3️⃣ NOW IT IS SAFE TO RETURN CONDITIONALLY

  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  /* ---------- UI ---------- */
  return (
    <>
      <AnimatedGradientBg />
      <ParticleBackground />
      <div className="appShell">
      
      {/* HEADER: Unified into one glass panel */}
      <header className="appHeader">
        <div className="headerContent">
          
          {/* TOP ROW: Title Left, User Right */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full mb-6">
            
            {/* Logo / Title Area */}
            <div>
              <h1 className="appTitle">DocVault</h1>
              <p className="appSubtitle">
                Secure document registration and verification
              </p>
            </div>

            {/* User & Logout Area */}
            <div className="flex items-center gap-4">
              
              {/* Alert Bell */}
              <button
                className="alertBellBtn"
                onClick={() => setAlertPanelOpen(true)}
                title="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadAlerts > 0 && (
                  <span className="alertBellBadge">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>
                )}
              </button>

              {/* User Badge */}
              <div className="userBadge">
                <div className="userAvatar">
                  {auth?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="userInfo">
                  <div className="userName">{auth?.username || 'User'}</div>
                  <RoleBadge role={auth?.role} />
                </div>
              </div>

              {/* Logout Button */}
              <button
                className="btn btnSmall btnLogout"
                onClick={handleLogout}
                title="Logout"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* BOTTOM ROW: Chips & Theme */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4 mt-4">
            
            <div className="flex flex-wrap gap-2">
              <span className="chip chipAnimated">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                SHA-256
              </span>
              <span className="chip chipAnimated">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Audit trail
              </span>
              <span className="chip chipAnimated">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Tamper detection
              </span>
            </div>

            <div className="themeSelectorButtons">
              {["system", "light", "dark"].map((t) => (
                <button
                  key={t}
                  className={themePref === t ? "themeBtn themeBtnActive" : "themeBtn"}
                  onClick={() => setThemePref(t)}
                  title={`Switch to ${t} theme`}
                >
                  {t === "system" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  )}
                  {t === "light" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  )}
                  {t === "dark" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  )}
                  <span>{t}</span>
                </button>
              ))}
            </div>

          </div>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={
              tab.id === activeTab ? "tabButton tabButtonActive" : "tabButton"
            }
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tabLabel">{tab.label}</span>
            <span className="tabHint">{tab.description}</span>
          </button>
        ))}
      </nav>

      <main className="panel">
        {activeTab === "register" && <Register onNotify={notify} onAlertCreated={refreshUnreadAlerts} />}
        {activeTab === "verify" && <Verify onNotify={notify} onAlertCreated={refreshUnreadAlerts} />}
        {activeTab === "documents" && <DocumentBrowser onNotify={notify} currentUser={auth} />}
        {activeTab === "profile" && <UserProfile onNotify={notify} currentUser={auth} />}
        {activeTab === "dashboard" && auth.role === "admin" && (
          <AdminDashboard onNotify={notify} />
        )}
        {activeTab === "audit" && auth.role === "admin" && (
          <AuditLogs onNotify={notify} />
        )}
      </main>

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
