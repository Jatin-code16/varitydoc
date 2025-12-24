import { useState } from "react";

const ROLE_INFO = {
  admin: {
    color: "#ff6b6b",
    icon: "👑",
    description: "Full system access with user management",
    permissions: [
      "Register documents",
      "Verify documents",
      "View audit logs",
      "Manage users",
      "Update roles",
      "View all alerts"
    ]
  },
  document_owner: {
    color: "#4dabf7",
    icon: "📝",
    description: "Can register and verify documents",
    permissions: [
      "Register documents",
      "Verify documents",
      "View own alerts"
    ]
  },
  auditor: {
    color: "#51cf66",
    icon: "🔍",
    description: "Read-only access to audit logs",
    permissions: [
      "View audit logs",
      "Verify documents",
      "View all alerts"
    ]
  },
  guest: {
    color: "#868e96",
    icon: "👤",
    description: "Limited read-only access",
    permissions: [
      "Verify documents only"
    ]
  }
};

function RoleBadge({ role, showTooltip = true }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  const roleKey = role?.toLowerCase() || "guest";
  const info = ROLE_INFO[roleKey] || ROLE_INFO.guest;

  return (
    <div 
      className="roleBadgeWrapper"
      onMouseEnter={() => showTooltip && setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <div 
        className="roleBadge" 
        style={{ 
          borderColor: `${info.color}40`,
          background: `${info.color}20`
        }}
      >
        <span className="roleBadgeIcon">{info.icon}</span>
        <span className="roleBadgeText" style={{ color: info.color }}>
          {role || "Guest"}
        </span>
      </div>
      
      {showTooltip && tooltipVisible && (
        <div className="roleBadgeTooltip">
          <div className="roleBadgeTooltipHeader">
            <span className="roleBadgeTooltipIcon">{info.icon}</span>
            <span className="roleBadgeTooltipTitle">{role || "Guest"}</span>
          </div>
          <p className="roleBadgeTooltipDesc">{info.description}</p>
          <div className="roleBadgeTooltipPerms">
            <strong>Permissions:</strong>
            <ul>
              {info.permissions.map((perm, idx) => (
                <li key={idx}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {perm}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleBadge;
