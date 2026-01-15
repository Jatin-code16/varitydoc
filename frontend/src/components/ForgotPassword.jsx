import { useState } from "react";
import api from "../api/client";

function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Request Reset
  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      const res = await api.post("/auth/forgot-password", { username });
      setMessage(res.data.message);
      // For DX, if debug_token is present, maybe auto-fill or hint
      if (res.data.debug_token) {
         console.log("Debug Token:", res.data.debug_token);
         setMessage(res.data.message + " (Check console for token)");
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to initiate reset");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm Reset
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post("/auth/reset-password", {
        username,
        token,
        new_password: newPassword
      });
      setMessage("Password reset successfully! Redirecting...");
      // Maybe wait a bit then go back?
      setTimeout(() => {
          onBackToLogin();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginCard">
        <button 
            type="button"
            className="text-sm text-gray-400 hover:text-white mb-4 flex items-center gap-1"
            onClick={onBackToLogin}
            style={{background: 'none', border:'none', cursor:'pointer', color: 'var(--text-secondary)'}}
        >
            ← Back to Login
        </button>
        
        <div className="loginHeader">
            <h1 className="loginTitle">Reset Password</h1>
            <p className="loginSubtitle">
                {step === 1 ? "Enter your username to receive a reset token." : "Enter the token and your new password."}
            </p>
        </div>
        
        {step === 1 ? (
          <form className="loginForm" onSubmit={handleRequest}>
            <div className="loginField">
              <label className="loginLabel">Username</label>
              <div className="loginPasswordWrapper">
              <input
                className="loginInput"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
              </div>
            </div>
            {message && <div style={{color: 'var(--accent)', marginTop: '10px', fontSize:'0.9rem'}}>{message}</div>}
            {error && <div style={{color: 'var(--error)', marginTop: '10px', fontSize:'0.9rem'}}>{error}</div>}
            
            <button className="loginButton" disabled={loading} style={{marginTop: '20px'}}>
              {loading ? <span className="spinner"></span> : "Send Reset Token"}
            </button>
          </form>
        ) : (
          <form className="loginForm" onSubmit={handleReset}>
            <div className="loginField">
               <label className="loginLabel">Reset Token</label>
               <input
                 className="loginInput"
                 value={token}
                 onChange={(e) => setToken(e.target.value)}
                 placeholder="Enter token"
                 required
               />
            </div>
            <div className="loginField">
               <label className="loginLabel">New Password</label>
               <input
                 className="loginInput"
                 type="password"
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 placeholder="Enter new password"
                 required
                 minLength={6}
               />
            </div>
            {message && <div style={{color: 'var(--success)', marginTop: '10px', fontSize:'0.9rem'}}>{message}</div>}
            {error && <div style={{color: 'var(--error)', marginTop: '10px', fontSize:'0.9rem'}}>{error}</div>}
            
            <button className="loginButton" disabled={loading} style={{marginTop: '20px'}}>
              {loading ? <span className="spinner"></span> : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
