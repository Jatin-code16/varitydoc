import { useEffect, useMemo, useState } from "react";
import Register from "./components/Register";
import Verify from "./components/Verify";
import AuditLogs from "./components/AuditLogs";
import "./App.css";

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const variantClass =
    toast.variant === "success"
      ? "toastSuccess"
      : toast.variant === "error"
        ? "toastError"
        : "";

  return (
    <div className={`toast toastIn toastEnhanced ${variantClass}`} role="status" aria-live="polite">
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

function App() {
  const tabs = useMemo(
    () => [
      { id: "register", label: "Register", description: "Store a document hash" },
      { id: "verify", label: "Verify", description: "Check document authenticity" },
      { id: "audit", label: "Audit logs", description: "View activity history" },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState("register");
  const activeTabMeta = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  const [toast, setToast] = useState(null);

  const [themePref, setThemePref] = useState(() => {
    return localStorage.getItem("docvault.theme") ?? "system";
  });

  useEffect(() => {
    if (themePref === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themePref);
    }
    localStorage.setItem("docvault.theme", themePref);
  }, [themePref]);

  const notify = (payload) => {
    const next = {
      title: payload?.title ?? "Notice",
      message: payload?.message ?? "",
      variant: payload?.variant ?? "info",
    };
    setToast(next);

    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), payload?.timeoutMs ?? 2400);
  };

  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="appTitle">DocVault</h1>
            <p className="appSubtitle">Secure document registration and verification</p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Security badges">
              <span className="chip">SHA-256</span>
              <span className="chip">Audit trail</span>
              <span className="chip">Tamper detection</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="subtle" style={{ marginTop: "2px" }}>
              Theme
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Theme toggle">
              <button
                type="button"
                className={
                  themePref === "system" ? "btn btnSmall btnPrimary" : "btn btnSmall"
                }
                onClick={() => setThemePref("system")}
              >
                System
              </button>
              <button
                type="button"
                className={
                  themePref === "light" ? "btn btnSmall btnPrimary" : "btn btnSmall"
                }
                onClick={() => setThemePref("light")}
              >
                Light
              </button>
              <button
                type="button"
                className={
                  themePref === "dark" ? "btn btnSmall btnPrimary" : "btn btnSmall"
                }
                onClick={() => setThemePref("dark")}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="tabs scrollReveal" aria-label="DocVault sections">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            type="button"
            className={
              tab.id === activeTab ? "tabButton tabButtonActive" : "tabButton"
            }
            onClick={() => setActiveTab(tab.id)}
            aria-current={tab.id === activeTab ? "page" : undefined}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <span className="tabLabel">{tab.label}</span>
            <span className="tabHint">{tab.description}</span>
          </button>
        ))}
      </nav>

      <main className="panel scrollReveal" aria-label={activeTabMeta.label} style={{ animationDelay: "0.3s" }}>
        {activeTab === "register" && <Register onNotify={notify} />}
        {activeTab === "verify" && <Verify onNotify={notify} />}
        {activeTab === "audit" && <AuditLogs onNotify={notify} />}
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
