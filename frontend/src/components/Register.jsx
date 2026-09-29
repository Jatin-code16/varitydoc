import { useEffect, useState } from "react";
import api from "../api/client";
import { UploadCloud, FileText, X, RefreshCw, Zap, ShieldCheck } from "lucide-react";

function Register({ onNotify, onAlertCreated }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState(null);

  const inputId = "register-file";
  const MAX_BYTES = 25 * 1024 * 1024; // 25MB

  const isRegistered = Boolean(result);

  const resetMessages = () => {
    setError(null);
    setResult(null);
  };

  const formatSize = (bytes) => {
    if (typeof bytes !== "number" || Number.isNaN(bytes)) return "";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onNotify?.({
        title: "Copied",
        message: "Hash copied to clipboard.",
        variant: "success",
        timeoutMs: 1400,
      });
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // Clipboard may be blocked by browser permissions; ignore silently.
    }
  };

  useEffect(() => {
    if (!loading) return;
    if (progress < 98) return;
    const t = window.setTimeout(() => setProgress(0), 700);
    return () => window.clearTimeout(t);
  }, [loading, progress]);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer?.files?.[0] ?? null;
    if (dropped) {
      setFile(dropped);
      resetMessages();
    }
  };

  useEffect(() => {
    if (!file) {
      setValidationError(null);
      return;
    }
    if (file.size === 0) {
      setValidationError("File is empty.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setValidationError("File is too large (max 25MB).");
      return;
    }
    setValidationError(null);
  }, [file]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous messages first
    resetMessages();

    if (!file) {
      setError("Please select a file");
      onNotify?.({
        title: "Validation Error",
        message: "Please select a file",
        variant: "error",
      });
      return;
    }

    if (validationError) {
      setError(validationError);
      onNotify?.({
        title: "Validation Error",
        message: validationError,
        variant: "error",
      });
      return;
    }

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (evt) => {
          const total = evt.total ?? 0;
          if (!total) return;
          const pct = Math.min(100, Math.max(0, Math.round((evt.loaded / total) * 100)));
          setProgress(pct);
        },
      });

      // Clear any error state before setting success
      setError(null);
      setResult(response.data);
      
      onNotify?.({
        title: "Success",
        message: `Document ${response.data.signature ? 'digitally signed and ' : ''}registered successfully.`,
        variant: "success",
      });
      
      // Notify parent about alert creation
      if (onAlertCreated) {
        onAlertCreated();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || "Failed to register document";
      
      // Clear any result state before setting error
      setResult(null);
      setError(errorMessage);
      
      onNotify?.({
        title: "Registration Failed",
        message: errorMessage,
        variant: "error",
      });
    } finally {
      setProgress((p) => (p > 0 ? 100 : 0));
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="cardHeader" style={{ marginBottom: "2rem" }}>
        <div>
          <span className="liveStatusBadge" style={{ marginBottom: "0.5rem" }}>
            PHASE 01: IMMUTABLE REGISTRATION
          </span>
          <h2 className="cardTitle" style={{ fontSize: "1.85rem", marginTop: "0.4rem" }}>
            Register Document in Ledger
          </h2>
          <p className="cardSubtitle">
            Upload any file to compute its deterministic SHA-256 cryptographic digest, apply an RSA digital signature, and anchor it into the tamper-evident registry.
          </p>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="filePicker">
          <input
            id={inputId}
            className="fileInput"
            type="file"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              resetMessages();
            }}
          />

          {!file ? (
            <div
              className={isDragging ? "cyberDropzone cyberDropzoneActive" : "cyberDropzone"}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={onDrop}
              onClick={() => document.getElementById(inputId)?.click()}
              role="button"
              tabIndex={0}
            >
              <div className="cyberDropzoneIconWrap">
                <UploadCloud size={38} strokeWidth={2.5} />
              </div>
              <h3 className="cyberDropzoneTitle">
                {isDragging ? "DROP FILE TO ATTACH" : "DRAG & DROP DOCUMENT HERE"}
              </h3>
              <p className="cyberDropzoneSubtitle">
                Click anywhere in this vault zone to select a local document. Supports PDF, DOCX, TXT, images, and binary artifacts (up to 25MB).
              </p>
              <div className="cyberDropzoneFormats">
                <ShieldCheck size={14} /> SHA-256 Cryptographic Digest Engine
              </div>
              <button type="button" className="cyberDropzoneBtn">
                📁 Browse Local Files
              </button>
            </div>
          ) : (
            <div className="stagedCard">
              <div className="stagedCardHeader">
                <span className="stagedStatusBadge">
                  <span className="livePulse"></span>
                  DOCUMENT STAGED & READY
                </span>
                <span className="stagedFormatBadge">
                  {file.name.includes(".") ? file.name.split(".").pop().toUpperCase() : "FILE"}
                </span>
              </div>
              <div className="stagedCardBody">
                <div className="stagedCardIcon">
                  <FileText size={32} strokeWidth={2.5} />
                </div>
                <div className="stagedCardInfo">
                  <h4 className="stagedCardName">{file.name}</h4>
                  <div className="stagedCardMeta">
                    <span className="stagedMetaItem">
                      <strong>SIZE:</strong> {formatSize(file.size)}
                    </span>
                    <span className="stagedMetaItem">
                      <strong>ALGORITHM:</strong> SHA-256 + RSA-2048
                    </span>
                  </div>
                </div>
                <div className="stagedCardActions">
                  <button
                    type="button"
                    className="btn btnSmall btnSecondary"
                    onClick={() => document.getElementById(inputId)?.click()}
                    disabled={loading}
                    title="Change file"
                  >
                    <RefreshCw size={14} /> Change
                  </button>
                  <button
                    type="button"
                    className="btn btnSmall btnQuiet"
                    onClick={() => {
                      setFile(null);
                      resetMessages();
                    }}
                    disabled={loading}
                    title="Remove file"
                  >
                    <X size={14} /> Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {validationError && (
            <div style={{ marginTop: "1rem" }} aria-live="polite">
              <span className="badge" style={{ borderColor: "var(--accent-secondary)", color: "var(--accent-secondary)" }}>
                {validationError}
              </span>
            </div>
          )}
        </div>

        <button 
          className="btn btnPrimary btnRegisterCTA" 
          type="submit" 
          disabled={loading || !file || Boolean(validationError)}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: "20px", height: "20px", borderWidth: "3px", margin: 0 }} />
              CRYPTOGRAPHICALLY SIGNING & REGISTERING…
            </>
          ) : (
            <>
              <Zap size={20} strokeWidth={2.5} />
              REGISTER & SIGN DOCUMENT TO LEDGER
            </>
          )}
        </button>

        {loading && (
          <div className="stagedProgressWrap" aria-label="Registration progress">
            <div className="stagedProgressBar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </form>

      {(error || result) && (
        <div 
          className={`result-card ${error ? 'result-error' : 'result-success'}`}
          aria-live="polite"
        >
          {error && (
            <div className="result-header">
              <div className="result-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="15" y1="9" x2="9" y2="15"></line>
                   <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Upload Failed
              </div>
              <span className="result-badge">ERROR</span>
            </div>
          )}

          {result && (
            <div className="result-header">
              <div className="result-title">
                 <svg className="verified-icon-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                 </svg>
                 Success
              </div>
              <span className="result-badge">REGISTERED</span>
            </div>
          )}

          <div className="result-body">
             {error && (
               <p className="mono" style={{margin: 0}}>{error}</p>
             )}

             {result && (
               <>
                 <p style={{marginBottom: '1.5rem', fontWeight: 500}}>
                   Document registered successfully. Key Vault signature applied.
                 </p>
                 
                 <div className="kv"> {/* Using existing KV logic but wrapper is new */}
                    <div className="result-row">
                      <div className="result-label">Filename</div>
                      <div className="result-value">{result.filename ?? "—"}</div>
                    </div>
                    
                    <div className="result-row">
                      <div className="result-label">SHA-256 Hash</div>
                      <div className="result-value">
                        <div className="code-block mono">{result.sha256}</div>
                        <button 
                          className="copy-btn" 
                          onClick={() => copyToClipboard(result.sha256)} 
                          title="Copy Hash"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                             <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="result-row">
                      <div className="result-label">Status</div>
                      <div className="result-value">{result.status ?? "—"}</div>
                    </div>

                    {result.signature && (
                      <>
                        <div className="result-row">
                          <div className="result-label">
                            <svg width="14" height="14" style={{marginRight: '6px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              <polyline points="9 12 11 14 15 10"/>
                            </svg>
                            Signature
                          </div>
                           <div className="result-value">
                             <div className="code-block mono" style={{fontSize: '0.75rem', maxHeight: '60px', overflowY: 'auto'}}>
                               {typeof result.signature === 'object'
                                 ? (result.signature.signature || JSON.stringify(result.signature, null, 2))
                                 : String(result.signature)}
                             </div>
                           </div>
                        </div>
                        <div className="result-row">
                          <div className="result-label">Algorithm</div>
                          <div className="result-value">{result.signature_algorithm || "RSA-2048"}</div>
                        </div>
                      </>
                    )}
                 </div>
               </>
             )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Register;
