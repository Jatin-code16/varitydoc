import { useEffect, useState } from "react";
import api from "../api/client";
import { UploadCloud, FileText, X, RefreshCw, ShieldCheck, CheckCircle2 } from "lucide-react";

function Verify({ onNotify, onAlertCreated }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [progress, setProgress] = useState(0);
  const [animateResult, setAnimateResult] = useState(false);
  const [shakeWarn, setShakeWarn] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const inputId = "verify-file";

  const isAuthentic = result?.result === "AUTHENTIC";
  const hashesMatch =
    Boolean(result?.stored_hash) &&
    Boolean(result?.uploaded_hash) &&
    result.stored_hash === result.uploaded_hash;

  const MAX_BYTES = 25 * 1024 * 1024; // 25MB

  useEffect(() => {
    if (!result) return;
    setAnimateResult(true);
    const popT = window.setTimeout(() => setAnimateResult(false), 500);

    if (!isAuthentic) {
      setShakeWarn(true);
      const shakeT = window.setTimeout(() => setShakeWarn(false), 450);
      return () => {
        window.clearTimeout(popT);
        window.clearTimeout(shakeT);
      };
    }

    return () => window.clearTimeout(popT);
  }, [result, isAuthentic]);

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

  const copyToClipboard = async (key, text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onNotify?.({
        title: "Copied",
        message: "Hash copied to clipboard.",
        variant: "success",
        timeoutMs: 1400,
      });
      window.setTimeout(() => setCopiedKey(null), 900);
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

    if (!file) {
      setError("Please select a file");
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/verify", formData, {
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

      setResult(response.data);

      const ok = response.data?.result === "AUTHENTIC";
      onNotify?.({
        title: ok ? "Verified" : "Tampered",
        message: ok
          ? "Document matches the stored hash."
          : "Hash mismatch detected. Please check the file.",
        variant: ok ? "success" : "error",
      });
      
      // Notify parent about alert creation (if tampering detected)
      if (!ok && onAlertCreated) {
        onAlertCreated();
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Verification failed"
      );
      onNotify?.({
        title: "Verification failed",
        message: err.response?.data?.detail || "Verification failed",
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
            PHASE 02: CRYPTOGRAPHIC VERIFICATION
          </span>
          <h2 className="cardTitle" style={{ fontSize: "1.85rem", marginTop: "0.4rem" }}>
            Verify Document Integrity
          </h2>
          <p className="cardSubtitle">
            Upload any document to recompute its SHA-256 hash and cryptographically verify that it has not been tampered with or modified.
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
                {isDragging ? "DROP FILE TO VERIFY" : "DRAG & DROP DOCUMENT TO VERIFY"}
              </h3>
              <p className="cyberDropzoneSubtitle">
                Select any document to compare its computed SHA-256 fingerprint against the registered document record.
              </p>
              <div className="cyberDropzoneFormats">
                <ShieldCheck size={14} /> Zero-Knowledge Tamper Detection Engine
              </div>
              <button type="button" className="cyberDropzoneBtn">
                📁 Browse Document to Check
              </button>
            </div>
          ) : (
            <div className="stagedCard">
              <div className="stagedCardHeader">
                <span className="stagedStatusBadge">
                  <span className="livePulse"></span>
                  READY FOR INTEGRITY AUDIT
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
                      <strong>TARGET:</strong> Tamper Detection & Ledger Match
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
              COMPUTING SHA-256 & VERIFYING WITH REGISTRY…
            </>
          ) : (
            <>
              <ShieldCheck size={20} strokeWidth={2.5} />
              VERIFY DOCUMENT INTEGRITY AGAINST REGISTRY
            </>
          )}
        </button>

        {loading && (
          <div className="stagedProgressWrap" aria-label="Verification progress">
            <div className="stagedProgressBar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </form>

      {(error || result) && (
        <div 
          className={`result-card ${(!result && error) || (result && !isAuthentic) ? 'result-error' : 'result-success'}`}
          aria-live="polite"
        >
          {error && (
            <div className="result-header">
               <div className="result-title">
                  {error.toLowerCase().includes("not registered") ? (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Not Registered
                    </>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Verification Error
                    </>
                  )}
               </div>
               <span className="result-badge">ERROR</span>
            </div>
          )}

          {result && (
            <div className="result-header">
               {isAuthentic ? (
                 <>
                   <div className="result-title">
                      <svg className="verified-icon-anim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Verified
                   </div>
                   <span className="result-badge">VALID MATCH</span>
                 </>
               ) : (
                 <>
                   <div className="result-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      Verification Failed
                   </div>
                   <span className="result-badge">TAMPERED</span>
                 </>
               )}
            </div>
          )}

          <div className="result-body">
             {error && <p className="mono">{error}</p>}

             {result && (
               <>
                 <p style={{marginBottom: '1.5rem', fontWeight: 500}}>
                   {isAuthentic
                    ? "Document integrity confirmed. Cryptographic hashes match."
                    : "CRITICAL: Document hash does not match stored record. File may be modified."}
                 </p>

                 <div className="kv">
                    <div className="result-row">
                      <div className="result-label">Filename</div>
                      <div className="result-value">{result.filename ?? "—"}</div>
                    </div>

                    <div className="result-row">
                      <div className="result-label">Stored Hash</div>
                      <div className="result-value">
                         <div className="code-block mono">{result.stored_hash ?? "—"}</div>
                         <button 
                            className="copy-btn" 
                            onClick={() => copyToClipboard("stored", result.stored_hash)}
                            disabled={!result.stored_hash}
                            title="Copy Stored Hash"
                         >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                         </button>
                      </div>
                    </div>

                    <div className="result-row">
                      <div className="result-label">Uploaded Hash</div>
                      <div className="result-value">
                         <div className="code-block mono">{result.uploaded_hash ?? "—"}</div>
                         <button 
                            className="copy-btn" 
                            onClick={() => copyToClipboard("uploaded", result.uploaded_hash)}
                            disabled={!result.uploaded_hash}
                            title="Copy Uploaded Hash"
                         >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                         </button>
                      </div>
                    </div>

                    {result.signature_valid !== undefined && (
                      <>
                        <div className="result-row">
                           <div className="result-label">Signature Status</div>
                           <div className="result-value" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
                              {result.signature_valid ? (
                                <span style={{display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'var(--success, green)'}}>
                                   <svg width="16" height="16" style={{marginRight: '6px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"/>
                                   </svg>
                                   VALID SIGNATURE
                                </span>
                              ) : (
                                <span style={{display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'var(--error, red)'}}>
                                   <svg width="16" height="16" style={{marginRight: '6px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="15" y1="9" x2="9" y2="15"></line>
                                      <line x1="9" y1="9" x2="15" y2="15"></line>
                                   </svg>
                                   INVALID SIGNATURE
                                </span>
                              )}
                           </div>
                        </div>

                        {result.signature && (
                          <div className="result-row">
                             <div className="result-label">Signature</div>
                             <div className="result-value">
                                <div className="code-block mono" style={{fontSize: '0.75rem', maxHeight: '60px', overflowY: 'auto'}}>
                                   {typeof result.signature === 'object'
                                     ? (result.signature.signature || JSON.stringify(result.signature, null, 2))
                                     : String(result.signature)}
                                </div>
                             </div>
                          </div>
                        )}
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

export default Verify;
