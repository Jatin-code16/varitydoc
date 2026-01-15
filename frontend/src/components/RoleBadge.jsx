import { useState } from "react";

const ROLE_INFO = {
  admin: {
    className: "role-admin",
    icon: "👑",
    label: "Admin",
    description: "Full system access & User Management",
    permissions: [
      "Register documents",
      "Verify documents",
      "View audit logs",
      "Manage users",
      "View all alerts"
    ]
  },
  document_owner: {
    className: "role-document_owner",
    icon: "📝",
    label: "Owner",
    description: "Can register and verify documents",
    permissions: [
      "Register documents",
      "Verify documents",
      "View own alerts"
    ]
  },
  auditor: {
    className: "role-auditor",
    icon: "🔍",
    label: "Auditor",
    description: "Read-only access to audit logs",
    permissions: [
      "View audit logs",
      "Verify documents",
      "View all alerts"
    ]
  },
  guest: {
    className: "role-guest",
    icon: "👤",
    label: "Guest",
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
      <div className={`roleBadge ${info.className}`}>
        <span className="roleBadgeIcon">{info.icon}</span>
        <span className="roleBadgeText">
          {info.label}
        </span>
      </div>
      
      {showTooltip && tooltipVisible && (
        <div className="roleBadgeTooltip">
          <div className="roleBadgeTooltipHeader">
            <span className="roleBadgeTooltipIcon">{info.icon}</span>
            <span className="roleBadgeTooltipTitle">{info.label} Role</span>
          </div>
          <p className="roleBadgeTooltipDesc" style={{ opacity: 0.8, lineHeight: 1.4 }}>
            {info.description}
          </p>
          <div className="roleBadgeTooltipPerms">
            <strong style={{ display: 'block', borderBottom: '1px solid currentColor', paddingBottom: '4px' }}>Permissions:</strong>
            <ul>
              {info.permissions.map((perm, idx) => (
                <li key={idx}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
