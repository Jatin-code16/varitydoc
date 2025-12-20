import { useEffect, useState } from "react";
import api from "../api/client";

function Register({ onNotify }) {
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

      setResult(response.data);
      onNotify?.({
        title: "Registered",
        message: "Document hash stored successfully.",
        variant: "success",
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to register document"
      );
      onNotify?.({
        title: "Register failed",
        message: err.response?.data?.detail || "Failed to register document",
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
          <h2 className="cardTitle">Register document</h2>
          <p className="cardSubtitle">
            Upload a file to store its SHA-256 hash for future verification.
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
                  {file ? "Selected file" : "Upload a document"}
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
                Uploading…
              </>
            ) : (
              "Register"
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
              <p className="noticeTitle">Register result</p>
              <div className="statusBox statusBad" role="status" style={{ marginBottom: "12px" }}>
                <div className="statusBoxTitle">
                  <span>Upload failed</span>
                  <span className="badge">ERROR</span>
                </div>
                <div className="statusBoxBody mono">{error}</div>
              </div>
            </>
          )}

          {result && (
            <>
              <p className="noticeTitle">Register result</p>

              <div className="statusBox statusGood" role="status" style={{ marginBottom: "12px" }}>
                <div className="statusBoxTitle">
                  <span>Registered</span>
                  <span className="badge badgeAccent">SUCCESS</span>
                </div>
                <div className="statusBoxBody">The hash has been stored for future verification.</div>
              </div>

              <div className="kv">
                <div className="kvRow">
                  <div className="kvKey">Filename</div>
                  <div>{result.filename ?? "—"}</div>
                </div>
                <div className="kvRow">
                  <div className="kvKey">SHA-256</div>
                  <div className="valueRow">
                    <div className="mono valueMain">{result.sha256 ?? "—"}</div>
                    <span className="tooltip">
                      <button
                        className={
                          copied ? "btn btnSmall copiedFlash" : "btn btnSmall"
                        }
                        type="button"
                        onClick={() => copyToClipboard(result.sha256)}
                        disabled={!result.sha256}
                      >
                        Copy
                      </button>
                      <span
                        className={
                          copied ? "tooltipText tooltipShow" : "tooltipText"
                        }
                      >
                        Copied!
                      </span>
                    </span>
                  </div>
                </div>
                <div className="kvRow">
                  <div className="kvKey">Status</div>
                  <div>{result.status ?? "—"}</div>
                </div>
                <div className="kvRow">
                  <div className="kvKey">Storage</div>
                  <div>{result.storage ?? "—"}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default Register;
