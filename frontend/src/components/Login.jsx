import { useState } from "react";
import api from "../api/client";
import Signup from "./Signup";
import logoImg from "../assets/logo.png";

function Login({ onLogin, onBackToHome }) {
  const [showSignup, setShowSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (showSignup) {
    return <Signup onBackToLogin={() => setShowSignup(false)} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const res = await api.post("/login", formData);

      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginCard">
        {/* Background Decorations */}
        <div className="loginBgDecor loginBgDecor1"></div>
        <div className="loginBgDecor loginBgDecor2"></div>
        <div className="loginBgDecor loginBgDecor3"></div>

        {onBackToHome && (
          <button 
            type="button" 
            className="loginBackHomeBtn" 
            onClick={onBackToHome}
            title="Return to Home Overview"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Overview</span>
          </button>
        )}

        {/* Header */}
        <div className="loginHeader">
          <div className="loginIcon" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
            <img src={logoImg} alt="DocVault Logo" style={{ width: "76px", height: "76px", objectFit: "contain", filter: "drop-shadow(4px 4px 0px rgba(0,0,0,0.5))" }} />
          </div>
          <h1 className="loginTitle">Welcome to DocVault</h1>
          <p className="loginSubtitle">Secure document verification platform</p>
        </div>

        {/* Form */}
        <form className="loginForm" onSubmit={handleSubmit}>
          <div className="loginField">
            <label htmlFor="username" className="loginLabel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Username
            </label>
            <input
              id="username"
              type="text"
              className="loginInput"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="loginField">
            <label htmlFor="password" className="loginLabel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Password
            </label>
            <div className="loginPasswordWrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="loginInput"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="loginPasswordToggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="loginError" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="loginButton" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>

          <div className="loginDivider">
            <span>OR EXPLORE INSTANTLY</span>
          </div>

          <button
            type="button"
            className="loginGuestBtn"
            onClick={async () => {
              setError(null);
              setLoading(true);
              try {
                const res = await api.post("/login/guest");
                onLogin(res.data);
              } catch (err) {
                setError(err.response?.data?.detail || "Unable to start guest session.");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <div className="guestBtnIcon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="guestBtnText">
              <span className="guestBtnTitle">Continue as Guest</span>
              <span className="guestBtnSub">Instant document verification • No password needed</span>
            </div>
            <svg className="guestBtnArrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </form>

        {/* Footer */}
        <div className="loginFooter">
          <div className="loginSignupPrompt">
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                className="loginLink"
                onClick={() => setShowSignup(true)}
                disabled={loading}
              >
                Sign up here
              </button>
            </p>
          </div>
          <div className="loginFeatures">
            <div className="loginFeature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Secure</span>
            </div>
            <div className="loginFeature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Verified</span>
            </div>
            <div className="loginFeature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
