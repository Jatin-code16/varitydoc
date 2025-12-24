import { useState, useEffect } from "react";
import api from "../api/client";

export default function UserProfile({ onNotify, currentUser }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/me");
      setProfileData(res.data);
    } catch (err) {
      onNotify({
        title: "Error",
        message: "Failed to load profile",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      onNotify({
        title: "Error",
        message: "New passwords do not match",
        variant: "error"
      });
      return;
    }

    if (formData.new_password.length < 6) {
      onNotify({
        title: "Error",
        message: "Password must be at least 6 characters",
        variant: "error"
      });
      return;
    }

    try {
      await api.post("/users/change-password", {
        current_password: formData.current_password,
        new_password: formData.new_password
      });

      onNotify({
        title: "Success",
        message: "Password changed successfully",
        variant: "success"
      });

      setFormData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      setEditMode(false);
    } catch (err) {
      onNotify({
        title: "Error",
        message: err.response?.data?.detail || "Failed to change password",
        variant: "error"
      });
    }
  };

  if (loading) {
    return (
      <div className="loadingContainer">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="userProfile">
      <div className="profileHeader">
        <div className="profileAvatar">
          {profileData?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="profileInfo">
          <h2>{profileData?.username}</h2>
          <p className="profileEmail">{profileData?.email || "No email set"}</p>
        </div>
      </div>

      <div className="profileSections">
        {/* Account Details */}
        <div className="profileSection">
          <h3>Account Details</h3>
          <div className="profileGrid">
            <div className="profileField">
              <label>Role</label>
              <span className={`roleBadgeInline role-${profileData?.role}`}>
                {profileData?.role}
              </span>
            </div>

            <div className="profileField">
              <label>Status</label>
              <span className={`statusBadge ${profileData?.is_active ? "statusActive" : "statusInactive"}`}>
                {profileData?.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="profileField">
              <label>Member Since</label>
              <span>
                {profileData?.created_at 
                  ? new Date(profileData.created_at).toLocaleDateString() 
                  : "Unknown"}
              </span>
            </div>

            <div className="profileField">
              <label>Last Login</label>
              <span>
                {profileData?.last_login 
                  ? new Date(profileData.last_login).toLocaleString() 
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="profileSection">
          <h3>Your Permissions</h3>
          <div className="permissionsList">
            {profileData?.permissions?.length > 0 ? (
              profileData.permissions.map((perm, idx) => (
                <div key={idx} className="permissionBadge">
                  ✓ {perm.replace(/_/g, " ")}
                </div>
              ))
            ) : (
              <p className="noPermissions">No permissions assigned</p>
            )}
          </div>
          <p className="roleDescription">{profileData?.role_description}</p>
        </div>

        {/* Security Settings */}
        <div className="profileSection">
          <h3>Security Settings</h3>
          
          {!editMode ? (
            <button 
              className="btn btnPrimary"
              onClick={() => setEditMode(true)}
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="passwordForm">
              <div className="formGroup">
                <label htmlFor="current_password">Current Password</label>
                <input
                  type="password"
                  id="current_password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                  required
                  className="input"
                />
              </div>

              <div className="formGroup">
                <label htmlFor="new_password">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                  required
                  minLength={6}
                  className="input"
                />
              </div>

              <div className="formGroup">
                <label htmlFor="confirm_password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm_password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                  required
                  minLength={6}
                  className="input"
                />
              </div>

              <div className="formActions">
                <button type="submit" className="btn btnSuccess">
                  Update Password
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      current_password: "",
                      new_password: "",
                      confirm_password: ""
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Statistics */}
        <div className="profileSection">
          <h3>Activity Summary</h3>
          <div className="profileGrid">
            <div className="profileField">
              <label>Unread Alerts</label>
              <span className="statNumber">{profileData?.unread_alerts || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
