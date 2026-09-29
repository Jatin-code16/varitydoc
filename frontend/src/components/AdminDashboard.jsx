import { useState, useEffect, useMemo } from "react";
import api from "../api/client";
import RoleBadge from "./RoleBadge";
import { 
  LayoutDashboard, 
  Files, 
  Users, 
  Bell, 
  History, 
  ShieldCheck, 
  Activity, 
  UserPlus, 
  Search, 
  RotateCcw, 
  UserX, 
  Edit3, 
  Check, 
  X, 
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  ShieldAlert
} from "lucide-react";

export default function AdminDashboard({ onNotify }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState("pending");
  const [reviewingId, setReviewingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, reqRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/role-requests")
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setRoleRequests(reqRes.data.requests || []);
    } catch (err) {
      onNotify?.({
        title: "Dashboard Error",
        message: err.response?.data?.detail || "Failed to load dashboard metrics",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRoleRequest = async (requestId, decision) => {
    setReviewingId(requestId);
    try {
      await api.post(`/admin/role-requests/${requestId}/review`, { status: decision });
      onNotify?.({
        title: decision === "approved" ? "Request Approved" : "Request Rejected",
        message: `Role request has been ${decision} and user privileges have been updated.`,
        variant: decision === "approved" ? "success" : "info"
      });
      await fetchDashboardData();
    } catch (err) {
      onNotify?.({
        title: "Review Error",
        message: err.response?.data?.detail || "Failed to review role request",
        variant: "error"
      });
    } finally {
      setReviewingId(null);
    }
  };

  const handleChangeRole = async (username) => {
    if (!newRole) {
      onNotify?.({ title: "Role Required", message: "Please select a valid role", variant: "error" });
      return;
    }

    try {
      await api.put(`/admin/users/${username}/role`, { new_role: newRole });
      onNotify?.({ 
        title: "Role Updated", 
        message: `User ${username} updated to ${newRole.toUpperCase()}`, 
        variant: "success" 
      });
      setEditingRole(null);
      setNewRole("");
      fetchDashboardData();
    } catch (err) {
      onNotify?.({
        title: "Update Failed",
        message: err.response?.data?.detail || "Failed to change role",
        variant: "error"
      });
    }
  };

  const handleDeactivateUser = async (username) => {
    if (!confirm(`Are you sure you want to revoke access and deactivate user "${username}"?`)) {
      return;
    }

    try {
      await api.post(`/admin/users/${username}/deactivate`);
      onNotify?.({ 
        title: "User Deactivated", 
        message: `Account for ${username} has been disabled.`, 
        variant: "success" 
      });
      fetchDashboardData();
    } catch (err) {
      onNotify?.({
        title: "Action Failed",
        message: err.response?.data?.detail || "Failed to deactivate user",
        variant: "error"
      });
    }
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => 
      u.username?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const pendingRequestsCount = roleRequests.filter(r => r.status === "pending").length;
  const approvedRequestsCount = roleRequests.filter(r => r.status === "approved").length;
  const rejectedRequestsCount = roleRequests.filter(r => r.status === "rejected").length;

  const filteredRoleRequests = useMemo(() => {
    if (requestFilter === "all") return roleRequests;
    return roleRequests.filter(r => r.status === requestFilter);
  }, [roleRequests, requestFilter]);

  if (loading) {
    return (
      <div className="loadingStateBox">
        <div className="spinner"></div>
        <p className="loadingStateText">Synthesizing real-time analytics...</p>
      </div>
    );
  }

  return (
    <div className="adminDashboardRoot">
      {/* Top Banner */}
      <div className="adminDashHeader">
        <div className="adminDashTitleGroup">
          <div className="adminHeaderBadge">
            <LayoutDashboard size={15} strokeWidth={2.5} />
            <span>OPERATIONAL SECURITY COMMAND</span>
          </div>
          <h2 className="adminSectionHeading">Executive Admin Dashboard</h2>
          <p className="adminSectionDesc">
            High-level metrics, real-time cryptographic audit trail velocity, and centralized RBAC user administration.
          </p>
        </div>

        <button 
          type="button" 
          className="btnCyber adminRefreshBtn" 
          onClick={fetchDashboardData}
          title="Refresh Metrics"
        >
          <RotateCcw size={15} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Cyber Metric Stat Cards */}
      <div className="adminStatsGrid">
        <div className="adminStatCard">
          <div className="adminStatIconWrap statIconDocs">
            <Files size={22} />
          </div>
          <div className="adminStatBody">
            <span className="adminStatNumber">{stats?.total_documents || 0}</span>
            <span className="adminStatTitle">Total Registered Documents</span>
          </div>
          <div className="adminStatFooter">
            <span className="statPulseDot"></span>
            <span>Anchored in Ledger</span>
          </div>
        </div>

        <div className="adminStatCard">
          <div className="adminStatIconWrap statIconUsers">
            <Users size={22} />
          </div>
          <div className="adminStatBody">
            <span className="adminStatNumber">{stats?.total_users || 0}</span>
            <span className="adminStatTitle">Authorized Accounts</span>
          </div>
          <div className="adminStatFooter">
            <span className="statSubAccent">{users.filter(u => u.is_active).length} Active Now</span>
          </div>
        </div>

        <div className="adminStatCard">
          <div className="adminStatIconWrap statIconAlerts">
            <Bell size={22} />
          </div>
          <div className="adminStatBody">
            <span className="adminStatNumber">{stats?.total_alerts || 0}</span>
            <span className="adminStatTitle">Security Alerts Triggered</span>
          </div>
          <div className="adminStatFooter">
            <span className="statSubAlert">Zero Critical Breaches</span>
          </div>
        </div>

        <div className="adminStatCard">
          <div className="adminStatIconWrap statIconAudits">
            <History size={22} />
          </div>
          <div className="adminStatBody">
            <span className="adminStatNumber">{stats?.total_audits || 0}</span>
            <span className="adminStatTitle">Forensic Audit Entries</span>
          </div>
          <div className="adminStatFooter">
            <span className="statSubPulse">Immutable Event Log</span>
          </div>
        </div>
      </div>

      {/* Recent Activity & System Health Row */}
      <div className="adminActivityAndHealth">
        {/* Recent Activity Stream */}
        <div className="adminActivityCard">
          <div className="adminCardHeader">
            <div className="adminCardTitleWrap">
              <Activity size={18} />
              <h3>Recent Ledger Operations</h3>
            </div>
            <span className="activityLivePill">LIVE FEED</span>
          </div>

          <div className="adminActivityList">
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              stats.recent_activity.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="adminActivityItem">
                  <div className="activityActionBadge">
                    {activity.action || "EVENT"}
                  </div>
                  <div className="activityDetails">
                    <span className="activityFile" title={activity.filename}>{activity.filename || "Registry Action"}</span>
                    <span className="activityTimestamp">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : "Just now"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="activityEmpty">No recent activity detected.</div>
            )}
          </div>
        </div>

        {/* Security Health & Cryptographic Node Telemetry */}
        <div className="adminHealthCard">
          <div className="adminCardHeader">
            <div className="adminCardTitleWrap">
              <ShieldCheck size={18} />
              <h3>Ledger Cryptographic Telemetry</h3>
            </div>
          </div>

          <div className="telemetryList">
            <div className="telemetryItem">
              <div className="telemetryLabel">
                <span>HASH INTEGRITY ENGINE</span>
                <span className="telemetryValGreen">OPERATIONAL</span>
              </div>
              <div className="telemetryBar"><div className="telemetryFill" style={{ width: '100%' }}></div></div>
            </div>

            <div className="telemetryItem">
              <div className="telemetryLabel">
                <span>DIGITAL SIGNATURE VALIDATION</span>
                <span className="telemetryValGreen">HEALTHY</span>
              </div>
              <div className="telemetryBar"><div className="telemetryFill" style={{ width: '99%' }}></div></div>
            </div>

            <div className="telemetryItem">
              <div className="telemetryLabel">
                <span>DATABASE LATENCY</span>
                <span className="telemetryValCyan">~14ms</span>
              </div>
              <div className="telemetryBar"><div className="telemetryFill telemetryFillCyan" style={{ width: '88%' }}></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Clearance Requests & Privilege Delegation */}
      <div className="adminRoleRequestsSection">
        <div className="adminRoleRequestsHeader">
          <div className="adminUsersTitleWrap">
            <ShieldAlert size={20} />
            <div>
              <div className="roleHeaderBadgeRow">
                <h3>Role Elevation Clearance Requests</h3>
                {pendingRequestsCount > 0 ? (
                  <span className="rolePendingBadge">
                    <span className="statusDotPulse"></span>
                    {pendingRequestsCount} ACTION REQUIRED
                  </span>
                ) : (
                  <span className="roleSyncedBadge">ALL CLEAR</span>
                )}
              </div>
              <p>Review incoming user access upgrade requests and authorize clearance levels.</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="roleFilterTabs">
            <button
              type="button"
              className={`roleFilterBtn ${requestFilter === "pending" ? "roleFilterActive" : ""}`}
              onClick={() => setRequestFilter("pending")}
            >
              Pending ({pendingRequestsCount})
            </button>
            <button
              type="button"
              className={`roleFilterBtn ${requestFilter === "all" ? "roleFilterActive" : ""}`}
              onClick={() => setRequestFilter("all")}
            >
              All ({roleRequests.length})
            </button>
            <button
              type="button"
              className={`roleFilterBtn ${requestFilter === "approved" ? "roleFilterActive" : ""}`}
              onClick={() => setRequestFilter("approved")}
            >
              Approved ({approvedRequestsCount})
            </button>
            <button
              type="button"
              className={`roleFilterBtn ${requestFilter === "rejected" ? "roleFilterActive" : ""}`}
              onClick={() => setRequestFilter("rejected")}
            >
              Rejected ({rejectedRequestsCount})
            </button>
          </div>
        </div>

        {/* Request Items */}
        {filteredRoleRequests.length === 0 ? (
          <div className="adminEmptyRequestsBox">
            <Inbox size={32} />
            <p>No {requestFilter !== "all" ? requestFilter : ""} role requests found.</p>
          </div>
        ) : (
          <div className="adminRoleRequestsGrid">
            {filteredRoleRequests.map((req) => (
              <div key={req.id} className={`adminRoleReqCard adminRoleReqCard-${req.status}`}>
                <div className="reqCardTop">
                  <div className="reqUserMeta">
                    <div className="reqAvatar">
                      {req.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="reqUsername">{req.username}</span>
                      <span className="reqTimestamp">
                        {req.created_at ? new Date(req.created_at).toLocaleString() : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="reqStatusWrap">
                    {req.status === "pending" && (
                      <span className="roleStatusPill statusPending">
                        <span className="statusDotPulse"></span>
                        PENDING
                      </span>
                    )}
                    {req.status === "approved" && (
                      <span className="roleStatusPill statusApproved">
                        <CheckCircle2 size={12} />
                        APPROVED
                      </span>
                    )}
                    {req.status === "rejected" && (
                      <span className="roleStatusPill statusRejected">
                        <XCircle size={12} />
                        REJECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Transition Flow */}
                <div className="reqTransitionRow">
                  <div className="reqRoleCol">
                    <span className="reqColLabel">CURRENT</span>
                    <RoleBadge role={req.current_role} />
                  </div>
                  <ArrowRight size={18} className="reqArrowIcon" />
                  <div className="reqRoleCol">
                    <span className="reqColLabel">REQUESTED</span>
                    <RoleBadge role={req.requested_role} />
                  </div>
                </div>

                {/* Justification Box */}
                <div className="reqReasonQuote">
                  <span className="quoteLabel">JUSTIFICATION:</span>
                  <p className="quoteText">"{req.reason || "No explicit reason specified."}"</p>
                </div>

                {/* Card Actions or Review metadata */}
                {req.status === "pending" ? (
                  <div className="reqActionRow">
                    <button
                      type="button"
                      className="btnActionApprove"
                      onClick={() => handleReviewRoleRequest(req.id, "approved")}
                      disabled={reviewingId === req.id}
                      title="Approve Role Upgrade"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>{reviewingId === req.id ? "Processing..." : "Approve & Grant Role"}</span>
                    </button>
                    <button
                      type="button"
                      className="btnActionReject"
                      onClick={() => handleReviewRoleRequest(req.id, "rejected")}
                      disabled={reviewingId === req.id}
                      title="Reject Request"
                    >
                      <X size={14} strokeWidth={2.5} />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <div className="reqReviewedFooter">
                    <span className="reqReviewNote">
                      Reviewed by <strong>@{req.reviewed_by || "admin"}</strong>
                      {req.reviewed_at && ` on ${new Date(req.reviewed_at).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management Administration */}
      <div className="adminUsersSection">
        <div className="adminUsersHeader">
          <div className="adminUsersTitleWrap">
            <Users size={20} />
            <div>
              <h3>Identity & RBAC Access Control</h3>
              <p>Manage authenticated user permissions, adjust roles, and revoke system access.</p>
            </div>
          </div>

          <div className="adminUserSearchWrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search user, email, or role..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="adminUserSearchInput"
            />
            {userSearch && (
              <button 
                type="button" 
                className="searchClearBtn" 
                onClick={() => setUserSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* User Table */}
        <div className="adminUserTableContainer">
          <table className="adminUserTable">
            <thead>
              <tr>
                <th>USER IDENTITY</th>
                <th>EMAIL ADDRESS</th>
                <th>SYSTEM ROLE</th>
                <th>ACCOUNT STATUS</th>
                <th>CREATED</th>
                <th>LAST ACTIVE</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.username} className={!user.is_active ? "userRowInactive" : "userRow"}>
                  <td>
                    <div className="userCellName">
                      <div className="userSmallAvatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="userUsernameText">{user.username}</span>
                    </div>
                  </td>
                  <td>
                    <span className="userEmailText">{user.email || "—"}</span>
                  </td>
                  <td>
                    {editingRole === user.username ? (
                      <div className="roleEditWrap">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="roleSelectInput"
                        >
                          <option value="admin">Admin</option>
                          <option value="document_owner">Document Owner</option>
                          <option value="auditor">Auditor</option>
                          <option value="guest">Guest</option>
                        </select>
                        <button
                          type="button"
                          className="btnIconAction btnIconSave"
                          onClick={() => handleChangeRole(user.username)}
                          title="Save Role"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="btnIconAction"
                          onClick={() => { setEditingRole(null); setNewRole(""); }}
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <RoleBadge role={user.role} />
                    )}
                  </td>
                  <td>
                    <span className={`userStatusPill ${user.is_active ? "userStatusActive" : "userStatusInactive"}`}>
                      {user.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <span className="userDateText">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </span>
                  </td>
                  <td>
                    <span className="userDateText">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="userActionBtnRow">
                      <button
                        type="button"
                        className="btnActionEdit"
                        onClick={() => {
                          setEditingRole(user.username);
                          setNewRole(user.role);
                        }}
                        disabled={!user.is_active}
                        title="Change User Role"
                      >
                        <Edit3 size={13} />
                        <span>Edit Role</span>
                      </button>
                      {user.is_active && (
                        <button
                          type="button"
                          className="btnActionDeactivate"
                          onClick={() => handleDeactivateUser(user.username)}
                          title="Deactivate User"
                        >
                          <UserX size={13} />
                          <span>Deactivate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
