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
  Sparkles,
  Send,
  Clock,
  ArrowUpRight,
  ShieldQuestion,
  XCircle,
  RotateCcw
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

  // Role Request states
  const [roleRequests, setRoleRequests] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [requestedRole, setRequestedRole] = useState("document_owner");
  const [requestReason, setRequestReason] = useState("");
  const [submittingRoleReq, setSubmittingRoleReq] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchRoleRequests();
  }, []);

  const fetchRoleRequests = async () => {
    try {
      const res = await api.get("/roles/requests/my");
      setRoleRequests(res.data.requests || []);
    } catch {
      // Non-blocking fallback
    }
  };

  const handleRoleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestedRole) {
      onNotify?.({
        title: "Role Required",
        message: "Please select an access role to request.",
        variant: "error"
      });
      return;
    }

    if (!requestReason.trim()) {
      onNotify?.({
        title: "Justification Required",
        message: "Please state a reason for this clearance elevation.",
        variant: "error"
      });
      return;
    }

    setSubmittingRoleReq(true);
    try {
      await api.post("/roles/request", {
        requested_role: requestedRole,
        reason: requestReason.trim()
      });

      onNotify?.({
        title: "Elevation Request Submitted",
        message: `Request for ${requestedRole.toUpperCase()} has been submitted for administrative review.`,
        variant: "success"
      });

      setRequestReason("");
      setShowRoleModal(false);
      fetchRoleRequests();
    } catch (err) {
      onNotify?.({
        title: "Request Failed",
        message: err.response?.data?.detail || "Failed to submit role elevation request.",
        variant: "error"
      });
    } finally {
      setSubmittingRoleReq(false);
    }
  };

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

    if (formData.new_password.length < 8) {
      onNotify?.({
        title: "Weak Password",
        message: "Password must be at least 8 characters in length",
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

      {/* Role Elevation & Access Clearance */}
      <div className="profileRoleRequestBox">
        <div className="profileSecurityHeader">
          <div className="securityTitleGroup">
            <div className="securityIconWrap">
              <ShieldQuestion size={20} />
            </div>
            <div>
              <h3>Role Elevation & Privilege Delegation</h3>
              <p>Request authorized clearance to different system operational tiers.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btnCyber btnCyberSm"
              onClick={fetchRoleRequests}
              title="Refresh Requests"
            >
              <RotateCcw size={13} />
            </button>
            {!showRoleModal && (
              <button 
                type="button" 
                className="btnCyber btnCyberAccent profileRequestRoleBtn"
                onClick={() => setShowRoleModal(true)}
              >
                <ArrowUpRight size={15} />
                <span>Request Role Access</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal / Inline Form for requesting access */}
        {showRoleModal && (
          <form onSubmit={handleRoleRequestSubmit} className="roleRequestForm">
            <div className="roleRequestFormIntro">
              <span className="formSubheading">SELECT TARGET CLEARANCE LEVEL</span>
              <p>Elevating your clearance tier grants new cryptographic operations across DocVault.</p>
            </div>

            <div className="roleSelectionGrid">
              <label 
                className={`roleOptionCard ${requestedRole === "document_owner" ? "roleOptionSelected" : ""}`}
                onClick={() => setRequestedRole("document_owner")}
              >
                <input 
                  type="radio" 
                  name="requested_role" 
                  value="document_owner" 
                  checked={requestedRole === "document_owner"} 
                  onChange={() => setRequestedRole("document_owner")}
                />
                <div className="roleOptionContent">
                  <div className="roleOptionHeader">
                    <span className="roleOptionTitle">Document Owner</span>
                    <span className="rolePill ownerPill">DOC_OWNER</span>
                  </div>
                  <p className="roleOptionDesc">
                    Enables document registration, SHA-256 sealing, private signature creation, and asset management.
                  </p>
                </div>
              </label>

              <label 
                className={`roleOptionCard ${requestedRole === "auditor" ? "roleOptionSelected" : ""}`}
                onClick={() => setRequestedRole("auditor")}
              >
                <input 
                  type="radio" 
                  name="requested_role" 
                  value="auditor" 
                  checked={requestedRole === "auditor"} 
                  onChange={() => setRequestedRole("auditor")}
                />
                <div className="roleOptionContent">
                  <div className="roleOptionHeader">
                    <span className="roleOptionTitle">Security Auditor</span>
                    <span className="rolePill auditorPill">AUDITOR</span>
                  </div>
                  <p className="roleOptionDesc">
                    Full document registry inspection, audit log verification, compliance monitoring & tamper alerts.
                  </p>
                </div>
              </label>

              <label 
                className={`roleOptionCard ${requestedRole === "admin" ? "roleOptionSelected" : ""}`}
                onClick={() => setRequestedRole("admin")}
              >
                <input 
                  type="radio" 
                  name="requested_role" 
                  value="admin" 
                  checked={requestedRole === "admin"} 
                  onChange={() => setRequestedRole("admin")}
                />
                <div className="roleOptionContent">
                  <div className="roleOptionHeader">
                    <span className="roleOptionTitle">Administrator</span>
                    <span className="rolePill adminPill">ADMIN</span>
                  </div>
                  <p className="roleOptionDesc">
                    Root privileges: Centralized user provisioning, role request approval, system analytics & operational controls.
                  </p>
                </div>
              </label>
            </div>

            <div className="roleReasonField">
              <label htmlFor="role_reason">OPERATIONAL JUSTIFICATION / BUSINESS REASON</label>
              <textarea
                id="role_reason"
                className="roleReasonTextarea"
                rows={3}
                placeholder="Explain why you require this clearance tier (e.g., need to upload department audit contracts or conduct security reviews)..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                required
              />
            </div>

            <div className="roleFormActions">
              <button 
                type="submit" 
                className="btnCyber btnCyberAccent"
                disabled={submittingRoleReq}
              >
                <Send size={15} />
                <span>{submittingRoleReq ? "Transmitting Request..." : "Submit Clearance Request"}</span>
              </button>
              <button 
                type="button" 
                className="btnCyber btnCyberCancel"
                onClick={() => {
                  setShowRoleModal(false);
                  setRequestReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* User's Existing Requests History */}
        <div className="roleRequestHistoryWrap">
          <div className="roleHistoryTitleRow">
            <Clock size={15} />
            <h4>Elevation Requests History</h4>
            {roleRequests.length > 0 && (
              <span className="roleHistoryCount">{roleRequests.length} record{roleRequests.length > 1 ? "s" : ""}</span>
            )}
          </div>

          {roleRequests.length === 0 ? (
            <div className="emptyRoleHistoryBox">
              <p>No role elevation requests on record. Need expanded privileges? Click <strong>Request Role Access</strong> above.</p>
            </div>
          ) : (
            <div className="roleHistoryTableContainer">
              <table className="roleHistoryTable">
                <thead>
                  <tr>
                    <th>TARGET ROLE</th>
                    <th>JUSTIFICATION</th>
                    <th>SUBMITTED</th>
                    <th>STATUS</th>
                    <th>REVIEWED BY</th>
                  </tr>
                </thead>
                <tbody>
                  {roleRequests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <RoleBadge role={req.requested_role} />
                      </td>
                      <td className="reqReasonCell">
                        <span title={req.reason}>{req.reason || "No reason provided"}</span>
                      </td>
                      <td className="reqDateCell">
                        {req.created_at ? new Date(req.created_at).toLocaleString() : "—"}
                      </td>
                      <td>
                        {req.status === "pending" && (
                          <span className="roleStatusPill statusPending">
                            <span className="statusDotPulse"></span>
                            PENDING REVIEW
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
                      </td>
                      <td className="reqReviewerCell">
                        {req.reviewed_by ? (
                          <span className="reviewerTag">@{req.reviewed_by}</span>
                        ) : (
                          <span className="reqWaiting">Awaiting Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
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
                    minLength={8}
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
