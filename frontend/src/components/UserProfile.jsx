import { useState, useEffect } from "react";
import api from "../api/client";
import RoleBadge from "./RoleBadge";

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
          <div className="profileEmail">
            {profileData?.email || "No email set"}
          </div>
        </div>
      </div>
      
      <div className="profileGrid">
        {/* Account Details */}
        <div className="profileSection">
          <h3>Account Details</h3>
          
          <div className="profileField">
            <span className="profileFieldLabel">System Role</span>
            <RoleBadge role={profileData?.role} />
          </div>

          <div className="profileField">
            <span className="profileFieldLabel">Member Since</span>
            <div className="profileFieldValue">
              {profileData?.created_at 
                ? new Date(profileData.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) 
                : "Unknown"}
            </div>
          </div>
          
           <div className="profileField">
            <span className="profileFieldLabel">User ID</span>
            <div className="profileFieldValue" style={{fontSize: '0.9rem'}}>
               {profileData?.id || "—"}
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="profileSection">
           <h3>Permissions</h3>
           <div style={{marginTop: '1rem'}}>
             {profileData?.permissions?.length > 0 ? (
               profileData.permissions.map((perm, idx) => (
                 <span key={idx} className="permChip">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                   </svg>
                   {perm.replace(/_/g, " ")}
                 </span>
               ))
             ) : (
               <p className="noPermissions">No permissions assigned</p>
             )}
           </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="profileSection" style={{marginTop: '3rem', borderTop: '4px solid var(--border)', paddingTop: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
             <h3>Security Settings</h3>
        </div>
        
        {!editMode ? (
          <button 
            className="btn"
            onClick={() => setEditMode(true)}
            style={{maxWidth: '300px'}}
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="securityForm">
            <div className="profileField">
              <label htmlFor="current_password">Current Password</label>
              <input
                type="password"
                id="current_password"
                value={formData.current_password}
                onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="profileField">
                  <label htmlFor="new_password">New Password</label>
                  <input
                    type="password"
                    id="new_password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>

                <div className="profileField">
                  <label htmlFor="confirm_password">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirm_password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
            </div>

            <div className="formActions">
              <button type="submit" className="btn btnPrimary">
                Update Password
              </button>
              <button 
                type="button" 
                className="btn btnQuiet"
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
    </div>
  );
}
