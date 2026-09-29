import { useState, useEffect } from "react";
import api from "../api/client";
import RoleBadge from "./RoleBadge";
import { 
  User, 
  Mail, 
  Calendar, 
  Fingerprint, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders,
  Sparkles
} from "lucide-react";

export default function UserProfile({ onNotify, currentUser }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
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
    } catch {
      onNotify?.({
        title: "Error",
        message: "Failed to load user profile credentials",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    onNotify?.({
      title: "Copied",
      message: "User ID copied to clipboard",
      variant: "success"
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      onNotify?.({
        title: "Password Mismatch",
        message: "New password and confirmation do not match",
        variant: "error"
      });
      return;
    }

    if (formData.new_password.length < 6) {
      onNotify?.({
        title: "Weak Password",
        message: "Password must be at least 6 characters in length",
        variant: "error"
      });
      return;
    }

    try {
      await api.post("/users/change-password", {
        current_password: formData.current_password,
        new_password: formData.new_password
      });

      onNotify?.({
        title: "Password Updated",
        message: "Your credentials have been securely refreshed",
        variant: "success"
      });

      setFormData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      setEditMode(false);
    } catch (err) {
      onNotify?.({
        title: "Update Failed",
        message: err.response?.data?.detail || "Failed to update password",
        variant: "error"
      });
    }
  };

  if (loading) {
    return (
      <div className="loadingStateBox">
        <div className="spinner"></div>
        <p className="loadingStateText">Verifying cryptographic identity...</p>
      </div>
    );
  }

  const userId = profileData?.id || profileData?.user_id || (currentUser?.username ? `usr_${currentUser.username}` : "usr_sec_auth");

  const permissionsList = Array.isArray(profileData?.permissions)
    ? profileData.permissions
    : profileData?.permissions && typeof profileData.permissions === "object"
    ? Object.entries(profileData.permissions)
        .filter(([_, allowed]) => Boolean(allowed))
        .map(([perm]) => perm)
    : [];

  const formatPerm = (perm) =>
    String(perm)
      .replace(/^can_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="userProfileRoot">
      {/* Identity Hero Card */}
      <div className="profileHeroCard">
        <div className="profileHeroLeft">
          <div className="profileHeroAvatar">
            <span>{profileData?.username?.charAt(0).toUpperCase() || 'U'}</span>
            <div className="avatarOnlineDot" title="Active Session"></div>
          </div>
          <div className="profileHeroMeta">
            <div className="profileHeroBadgeRow">
              <span className="profileSecurityChip">
                <ShieldCheck size={12} strokeWidth={2.5} />
                VERIFIED IDENTITY
              </span>
              <RoleBadge role={profileData?.role} />
            </div>
            <h2 className="profileHeroName">{profileData?.username || "Authenticated User"}</h2>
            <div className="profileHeroEmail">
              <Mail size={14} />
              <span>{profileData?.email || `${profileData?.username || 'user'}@docvault.local`}</span>
            </div>
          </div>
        </div>

        {/* Quick Identity Stats */}
        <div className="profileHeroStats">
          <div className="profileStatItem">
            <span className="profileStatLabel">ACCOUNT STATUS</span>
            <span className="profileStatValGreen">ACTIVE & HEALTHY</span>
          </div>
          <div className="profileStatItem">
            <span className="profileStatLabel">CRYPTO PROTOCOL</span>
            <span className="profileStatVal">SHA-256 / HS256</span>
          </div>
        </div>
      </div>

      {/* Grid: Credentials & Claims */}
      <div className="profileDetailsGrid">
        {/* Identity Credentials Box */}
        <div className="profileCardBox">
          <div className="profileCardBoxHeader">
            <Fingerprint size={18} />
            <h3>Identity & Ledger Claims</h3>
          </div>

          <div className="profileCredentialList">
            <div className="profileCredItem">
              <span className="credLabel">UNIQUE USER ID</span>
              <div className="credValueRow">
                <code className="credCode">{userId}</code>
                <button
                  type="button"
                  className="credCopyBtn"
                  onClick={() => handleCopyId(userId)}
                  title="Copy User ID"
                >
                  {copiedId ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="profileCredItem">
              <span className="credLabel">SYSTEM ROLE LEVEL</span>
              <div style={{ marginTop: "4px" }}>
                <RoleBadge role={profileData?.role} />
              </div>
            </div>

            <div className="profileCredItem">
              <span className="credLabel">MEMBER SINCE</span>
              <div className="credTimeWrap">
                <Calendar size={14} />
                <span>
                  {profileData?.created_at && !isNaN(new Date(profileData.created_at).getTime())
                    ? new Date(profileData.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) 
                    : "Founding Member"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RBAC Capabilities Matrix */}
        <div className="profileCardBox">
          <div className="profileCardBoxHeader">
            <Sliders size={18} />
            <h3>Authorized Capabilities (RBAC)</h3>
          </div>

          <p className="profileCardBoxSub">
            Your role grants the following system permissions across the cryptographic ledger:
          </p>

          <div className="profilePermsGrid">
            {permissionsList.length > 0 ? (
              permissionsList.map((perm, idx) => (
                <div key={idx} className="profilePermCard">
                  <CheckCircle2 size={15} className="permCheckIcon" />
                  <span className="permCardText">{formatPerm(perm)}</span>
                </div>
              ))
            ) : (
              <p className="noPermissions">Standard read-only guest permissions active</p>
            )}
          </div>
        </div>
      </div>

      {/* Security & Password Management */}
      <div className="profileSecurityBox">
        <div className="profileSecurityHeader">
          <div className="securityTitleGroup">
            <div className="securityIconWrap">
              <KeyRound size={20} />
            </div>
            <div>
              <h3>Security & Credential Management</h3>
              <p>Keep your cryptographic vault access secure by rotating your password regularly.</p>
            </div>
          </div>

          {!editMode && (
            <button 
              type="button" 
              className="btnCyber profileChangePwdBtn"
              onClick={() => setEditMode(true)}
            >
              <Lock size={15} />
              <span>Change Password</span>
            </button>
          )}
        </div>

        {editMode && (
          <form onSubmit={handlePasswordChange} className="profilePasswordForm">
            <div className="passwordFormGrid">
              {/* Current Password */}
              <div className="passwordFormField">
                <label htmlFor="current_password">CURRENT PASSWORD</label>
                <div className="passwordInputWrap">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="current_password"
                    value={formData.current_password}
                    onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                    placeholder="Enter current password"
                    required
                    className="passwordInput"
                  />
                  <button
                    type="button"
                    className="passwordToggleBtn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="passwordFormField">
                <label htmlFor="new_password">NEW SECURE PASSWORD</label>
                <div className="passwordInputWrap">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="new_password"
                    value={formData.new_password}
                    onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="passwordInput"
                  />
                  <button
                    type="button"
                    className="passwordToggleBtn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="passwordFormField">
                <label htmlFor="confirm_password">CONFIRM NEW PASSWORD</label>
                <div className="passwordInputWrap">
                  <input
                    type="password"
                    id="confirm_password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                    placeholder="Repeat new password"
                    required
                    minLength={6}
                    className="passwordInput"
                  />
                </div>
              </div>
            </div>

            <div className="passwordFormActions">
              <button type="submit" className="btnCyber btnCyberAccent">
                <Check size={16} strokeWidth={2.5} />
                <span>Save New Password</span>
              </button>
              <button 
                type="button" 
                className="btnCyber btnCyberCancel"
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
