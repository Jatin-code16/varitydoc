import { useState, useEffect } from "react";
import api from "../api/client";

function AlertPanel({ isOpen, onClose, onNotify }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, unread, critical

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  // Poll for new alerts every 30 seconds when panel is open
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/alerts");
      setAlerts(response.data.alerts || []);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      onNotify?.({
        title: "Error",
        message: "Failed to fetch alerts",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/read`);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
      onNotify?.({
        title: "Success",
        message: "Alert marked as read",
        variant: "success",
        timeoutMs: 1500,
      });
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
      onNotify?.({
        title: "Error",
        message: "Failed to mark alert as read",
        variant: "error",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/alerts/read-all");
      setAlerts((prev) =>
        prev.map((alert) => ({ ...alert, is_read: true }))
      );
      onNotify?.({
        title: "Success",
        message: "All alerts marked as read",
        variant: "success",
        timeoutMs: 1500,
      });
    } catch (err) {
      console.error("Failed to mark all alerts as read:", err);
      onNotify?.({
        title: "Error",
        message: "Failed to mark all alerts as read",
        variant: "error",
      });
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await api.delete(`/alerts?alert_ids=${alertId}`);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      onNotify?.({
        title: "Success",
        message: "Alert deleted",
        variant: "success",
        timeoutMs: 1500,
      });
    } catch (err) {
      console.error("Failed to delete alert:", err);
      onNotify?.({
        title: "Error",
        message: "Failed to delete alert",
        variant: "error",
      });
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        );
      case "WARNING":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        );
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "unread") return !alert.is_read;
    if (filter === "critical") return alert.severity === "CRITICAL";
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="alertPanelOverlay" onClick={onClose}>
      <div className="alertPanel" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="alertPanelHeader">
          <div>
            <h3 className="alertPanelTitle">
              Notifications
              {unreadCount > 0 && (
                <span className="alertUnreadBadge">{unreadCount}</span>
              )}
            </h3>
            <p className="alertPanelSubtitle">Stay updated on security events</p>
          </div>
          <button className="alertPanelClose" onClick={onClose} title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="alertFilterTabs">
          <button
            className={filter === "all" ? "alertFilterTab alertFilterTabActive" : "alertFilterTab"}
            onClick={() => setFilter("all")}
          >
            All ({alerts.length})
          </button>
          <button
            className={filter === "unread" ? "alertFilterTab alertFilterTabActive" : "alertFilterTab"}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={filter === "critical" ? "alertFilterTab alertFilterTabActive" : "alertFilterTab"}
            onClick={() => setFilter("critical")}
          >
            Critical ({alerts.filter((a) => a.severity === "CRITICAL").length})
          </button>
        </div>

        {/* Actions - MOVED MARK ALL BUTTON HERE */}
        {unreadCount > 0 && (
          <div className="alertActions">
            <button className="alertActionBtn" onClick={markAllAsRead}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Mark all as read
            </button>
          </div>
        )}

        {/* Alert List */}
        <div className="alertList">
          {loading && alerts.length === 0 ? (
            <div className="alertEmpty">
              <div className="spinner"></div>
              <p>Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="alertEmpty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p>No {filter !== "all" ? filter : ""} alerts</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`alertItem ${!alert.is_read ? "alertItemUnread" : ""} alertItem${alert.severity}`}
              >
                <div className="alertItemIcon">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="alertItemContent">
                  <div className="alertItemHeader">
                    <span className="alertItemTitle">{alert.title}</span>
                    <span className="alertItemTime">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="alertItemMessage">{alert.message}</p>
                  {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                    <div className="alertItemMeta">
                      {alert.metadata.document_name && (
                        <span className="alertMetaTag">
                          📄 {alert.metadata.document_name}
                        </span>
                      )}
                      {alert.metadata.user && (
                        <span className="alertMetaTag">
                          👤 {alert.metadata.user}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="alertItemActions">
                  {!alert.is_read && (
                    <button
                      className="alertActionIconBtn"
                      onClick={() => markAsRead(alert.id)}
                      title="Mark as read"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  )}
                  <button
                    className="alertActionIconBtn alertActionIconBtnDanger"
                    onClick={() => deleteAlert(alert.id)}
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertPanel;
