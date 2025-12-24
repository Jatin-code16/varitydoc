import { useState, useEffect } from "react";
import api from "../api/client";

export default function AdminDashboard({ onNotify }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users")
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      onNotify({
        title: "Error",
        message: err.response?.data?.detail || "Failed to load dashboard data",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (username) => {
    if (!newRole) {
      onNotify({ title: "Error", message: "Please select a role", variant: "error" });
      return;
    }

    try {
      await api.put(`/admin/users/${username}/role`, { new_role: newRole });
      onNotify({ 
        title: "Success", 
        message: `Role updated to ${newRole}`, 
        variant: "success" 
      });
      setEditingRole(null);
      setNewRole("");
      fetchDashboardData();
    } catch (err) {
      onNotify({
        title: "Error",
        message: err.response?.data?.detail || "Failed to update role",
        variant: "error"
      });
    }
  };

  const handleDeactivateUser = async (username) => {
    if (!confirm(`Are you sure you want to deactivate user "${username}"?`)) {
      return;
    }

    try {
      await api.post(`/admin/users/${username}/deactivate`);
      onNotify({ 
        title: "Success", 
        message: `User ${username} deactivated`, 
        variant: "success" 
      });
      fetchDashboardData();
    } catch (err) {
      onNotify({
        title: "Error",
        message: err.response?.data?.detail || "Failed to deactivate user",
        variant: "error"
      });
    }
  };

  if (loading) {
    return (
      <div className="loadingContainer">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="adminDashboard">
      {/* Statistics Cards */}
      <div className="statsGrid">
        <div className="statCard statCardPrimary">
          <div className="statIcon">📊</div>
          <div className="statContent">
            <h3>{stats?.total_documents || 0}</h3>
            <p>Total Documents</p>
          </div>
        </div>

        <div className="statCard statCardSuccess">
          <div className="statIcon">👥</div>
          <div className="statContent">
            <h3>{stats?.total_users || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="statCard statCardWarning">
          <div className="statIcon">🔔</div>
          <div className="statContent">
            <h3>{stats?.total_alerts || 0}</h3>
            <p>Active Alerts</p>
          </div>
        </div>

        <div className="statCard statCardInfo">
          <div className="statIcon">📝</div>
          <div className="statContent">
            <h3>{stats?.total_audits || 0}</h3>
            <p>Audit Entries</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recent_activity && stats.recent_activity.length > 0 && (
        <div className="recentActivity">
          <h3>Recent Activity</h3>
          <div className="activityList">
            {stats.recent_activity.map((activity, idx) => (
              <div key={idx} className="activityItem">
                <span className={`activityBadge activityBadge${activity.action}`}>
                  {activity.action}
                </span>
                <span className="activityFilename">{activity.filename}</span>
                <span className="activityTime">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Management */}
      <div className="userManagement">
        <h3>User Management</h3>
        <div className="userTable">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.username} className={!user.is_active ? "inactiveRow" : ""}>
                  <td className="usernameTd">{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    {editingRole === user.username ? (
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="roleSelect"
                      >
                        <option value="">Select role...</option>
                        <option value="admin">Admin</option>
                        <option value="document_owner">Document Owner</option>
                        <option value="auditor">Auditor</option>
                        <option value="guest">Guest</option>
                      </select>
                    ) : (
                      <span className={`roleBadgeInline role-${user.role}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`statusBadge ${user.is_active ? "statusActive" : "statusInactive"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString() 
                      : "Never"}
                  </td>
                  <td className="actionsTd">
                    {editingRole === user.username ? (
                      <>
                        <button
                          className="btn btnSmall btnSuccess"
                          onClick={() => handleChangeRole(user.username)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btnSmall"
                          onClick={() => {
                            setEditingRole(null);
                            setNewRole("");
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btnSmall btnPrimary"
                          onClick={() => {
                            setEditingRole(user.username);
                            setNewRole(user.role);
                          }}
                          disabled={!user.is_active}
                        >
                          Edit Role
                        </button>
                        {user.is_active && (
                          <button
                            className="btn btnSmall btnDanger"
                            onClick={() => handleDeactivateUser(user.username)}
                          >
                            Deactivate
                          </button>
                        )}
                      </>
                    )}
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
