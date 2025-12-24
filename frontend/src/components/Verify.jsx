import { useEffect, useState } from "react";
import api from "../api/client";

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
      <div className="cardHeader">
        <div>
          <h2 className="cardTitle">Verify document</h2>
          <p className="cardSubtitle">
            Upload a file to compare its hash against the registered value.
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
          <div
            className={isDragging ? "dropzone dropzoneActive" : "dropzone"}
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
          >
            <label className="dropzoneLabel" htmlFor={inputId}>
              <span className="dropzoneLeft">
                <span className="dropzoneTitle">
                  {file ? "Selected file" : "Upload to verify"}
                </span>
                <span className="dropzoneHint">
                  {file ? file.name : "Click to browse or drag & drop"}
                </span>
              </span>
              <span className="chip chipAccent">Browse</span>
            </label>
            <div className="subtle" style={{ marginTop: "8px" }}>
              {file ? formatSize(file.size) : "Tip: you can also drag & drop a file here."}
            </div>
            {validationError && (
              <div className="subtle" style={{ marginTop: "8px" }} aria-live="polite">
                <span className="badge" style={{ borderColor: "color-mix(in oklab, var(--error) 60%, var(--border))" }}>
                  {validationError}
                </span>
              </div>
            )}
          </div>
        </div>

        {file && !loading && !result && (
          <div className="filePreview">
            <div className="filePreviewIcon">📄</div>
            <div className="filePreviewInfo">
              <div className="filePreviewName">{file.name}</div>
              <div className="filePreviewSize">{formatSize(file.size)}</div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button className="btn btnPrimary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Verifying…
              </>
            ) : (
              "Verify"
            )}
          </button>
          <button
            className="btn btnSmall btnQuiet"
            type="button"
            onClick={() => {
              setFile(null);
              resetMessages();
            }}
            disabled={loading || !file}
          >
            Clear
          </button>
        </div>

        {loading && (
          <div className="progressWrap" aria-label="Upload progress">
            <div className="progressBar" style={{ "--progress": `${progress}%` }} />
          </div>
        )}
      </form>

      {(error || result) && (
        <div
          className={result ? "notice noticeStrong" : "notice"}
          style={{ marginTop: "14px" }}
          aria-live="polite"
        >
          {error && (
            <>
              <p className="noticeTitle">Request failed</p>
              <div className="mono">{error}</div>
            </>
          )}

          {result && (
            <>
              <p className="noticeTitle">Verification result</p>

              <div
                className={`${
                  isAuthentic ? "statusBox statusGood" : "statusBox statusBad"
                } ${animateResult ? "resultPop" : ""} ${!isAuthentic && shakeWarn ? "shake" : ""}`}
                style={{ marginBottom: "12px" }}
                role="status"
              >
                <div className="statusBoxTitle">
                  <span>{isAuthentic ? "Verified" : "Verification failed"}</span>
                  <span className={isAuthentic ? "badge badgeAccent" : "badge"}>
                    {result.result ?? "—"}
                  </span>
                </div>
                <div className="statusBoxBody">
                  {isAuthentic
                    ? "This file matches the stored hash."
                    : "This file does not match the stored hash (possible tampering or wrong file)."}
                </div>
              </div>

              <div className="statusBox" style={{ marginBottom: "12px" }} aria-label="Hash match">
                <div className="statusBoxTitle">
                  <span>Hash match</span>
                  <span
                    className={hashesMatch ? "badge" : "badge"}
                    style={{
                      borderColor: hashesMatch
                        ? "color-mix(in oklab, var(--success) 60%, var(--border))"
                        : "color-mix(in oklab, var(--error) 60%, var(--border))",
                      background: hashesMatch
                        ? "color-mix(in oklab, var(--success) 16%, transparent)"
                        : "color-mix(in oklab, var(--error) 14%, transparent)",
                    }}
                  >
                    {hashesMatch ? "MATCH" : "MISMATCH"}
                  </span>
                </div>
                <div className="statusBoxBody">
                  {hashesMatch
                    ? "Stored hash equals uploaded hash."
                    : "Stored hash differs from uploaded hash."}
                </div>
              </div>

              <div className="kv">
                <div className="kvRow">
                  <div className="kvKey">Filename</div>
                  <div>{result.filename ?? "—"}</div>
                </div>
                <div className="kvRow">
                  <div className="kvKey">Stored hash</div>
                  <div className="valueRow">
                    <div className="mono valueMain">{result.stored_hash ?? "—"}</div>
                    <span className="tooltip">
                      <button
                        className={
                          copiedKey === "stored"
                            ? "btn btnSmall copiedFlash"
                            : "btn btnSmall"
                        }
                        type="button"
                        onClick={() => copyToClipboard("stored", result.stored_hash)}
                        disabled={!result.stored_hash}
                        aria-label="Copy stored hash"
                      >
                        Copy
                      </button>
                      <span
                        className={
                          copiedKey === "stored"
                            ? "tooltipText tooltipShow"
                            : "tooltipText"
                        }
                      >
                        Copied!
                      </span>
                    </span>
                  </div>
                </div>
                <div className="kvRow">
                  <div className="kvKey">Uploaded hash</div>
                  <div className="valueRow">
                    <div className="mono valueMain">{result.uploaded_hash ?? "—"}</div>
                    <span className="tooltip">
                      <button
                        className={
                          copiedKey === "uploaded"
                            ? "btn btnSmall copiedFlash"
                            : "btn btnSmall"
                        }
                        type="button"
                        onClick={() => copyToClipboard("uploaded", result.uploaded_hash)}
                        disabled={!result.uploaded_hash}
                        aria-label="Copy uploaded hash"
                      >
                        Copy
                      </button>
                      <span
                        className={
                          copiedKey === "uploaded"
                            ? "tooltipText tooltipShow"
                            : "tooltipText"
                        }
                      >
                        Copied!
                      </span>
                    </span>
                  </div>
                </div>
                
                {/* Signature Verification Section */}
                {result.signature_valid !== undefined && (
                  <>
                    <div className="kvRow">
                      <div className="kvKey">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Signature Status
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {result.signature_valid ? (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span style={{ color: "var(--success)" }}>Valid</span>
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="15" y1="9" x2="9" y2="15"/>
                              <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                            <span style={{ color: "var(--error)" }}>Invalid</span>
                          </>
                        )}
                      </div>
                    </div>
                    {result.signature && (
                      <div className="kvRow">
                        <div className="kvKey">Signature</div>
                        <div className="mono" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
                          {result.signature.substring(0, 50)}...
                        </div>
                      </div>
                    )}
                    {result.signed_by && (
                      <div className="kvRow">
                        <div className="kvKey">Signed by</div>
                        <div>{result.signed_by}</div>
                      </div>
                    )}
                    {result.signature_algorithm && (
                      <div className="kvRow">
                        <div className="kvKey">Algorithm</div>
                        <div>{result.signature_algorithm}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default Verify;
