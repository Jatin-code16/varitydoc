import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { 
  History, 
  Search, 
  Download, 
  RotateCcw, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Clock, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Terminal,
  Filter
} from "lucide-react";

function AuditLogs({ onNotify }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/audit-logs");
      setLogs(response.data.audit_logs || []);
    } catch {
      setError("Failed to load audit logs from the cryptographic ledger");
      onNotify?.({
        title: "Audit Logs",
        message: "Failed to connect to audit trail service.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTimestamp = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(d);
  };

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (logs ?? []).filter((row) => {
      const haystack =
        `${row?.timestamp ?? ""} ${row?.action ?? ""} ${row?.filename ?? ""} ${row?.result ?? ""} ${row?.stored_hash ?? ""}`.toLowerCase();
      const matchesQuery = q ? haystack.includes(q) : true;
      const resStr = String(row?.result ?? "").toLowerCase();
      
      let matchesResult = true;
      if (resultFilter === "authentic") {
        matchesResult = resStr === "authentic" || resStr === "success";
      } else if (resultFilter === "tampered") {
        matchesResult = resStr === "not_authentic" || resStr === "failed" || resStr.includes("tamper");
      } else if (resultFilter !== "all") {
        matchesResult = resStr === resultFilter;
      }

      return matchesQuery && matchesResult;
    });
  }, [logs, query, resultFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const authentic = logs.filter(l => {
      const r = String(l?.result || "").toLowerCase();
      return r === "authentic" || r === "success";
    }).length;
    const tampered = logs.filter(l => {
      const r = String(l?.result || "").toLowerCase();
      return r === "not_authentic" || r === "failed" || r.includes("tamper");
    }).length;
    return { total, authentic, tampered };
  }, [logs]);

  const exportCsv = () => {
    try {
      const rows = filteredLogs ?? [];
      const headers = ["timestamp", "action", "filename", "result", "stored_hash"];
      const escape = (value) => {
        const s = String(value ?? "");
        const needsQuotes = /[",\n\r]/.test(s);
        const safe = s.replaceAll('"', '""');
        return needsQuotes ? `"${safe}"` : safe;
      };

      const lines = [headers.join(",")];
      for (const r of rows) {
        lines.push(headers.map((h) => escape(r?.[h])).join(","));
      }
      const csv = `${lines.join("\n")}\n`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      onNotify?.({
        title: "Export Success",
        message: `Exported ${rows.length} audit trail records to CSV.`,
        variant: "success",
      });
    } catch {
      onNotify?.({
        title: "Export Failed",
        message: "Could not generate audit log CSV.",
        variant: "error",
      });
    }
  };

  const getResultBadge = (result) => {
    const r = String(result || "").toUpperCase();
    if (r === "AUTHENTIC" || r === "SUCCESS") {
      return (
        <span className="auditBadge auditBadgeAuthentic">
          <CheckCircle2 size={13} strokeWidth={2.5} />
          {r}
        </span>
      );
    }
    if (r === "NOT_AUTHENTIC" || r === "FAILED" || r.includes("TAMPER")) {
      return (
        <span className="auditBadge auditBadgeTampered">
          <AlertTriangle size={13} strokeWidth={2.5} />
          {r}
        </span>
      );
    }
    return (
      <span className="auditBadge auditBadgeNeutral">
        {r || "LOGGED"}
      </span>
    );
  };

  return (
    <div className="auditLogsRoot">
      {/* Top Ledger Header */}
      <div className="auditHeader">
        <div className="auditTitleGroup">
          <div className="auditHeaderBadge">
            <History size={15} strokeWidth={2.5} />
            <span>IMMUTABLE EVENT TRAIL</span>
          </div>
          <h2 className="auditSectionTitle">System Audit & Verification Trail</h2>
          <p className="auditSectionDesc">
            Chronological cryptographic record of all document registrations, hash verifications, and tamper detection events.
          </p>
        </div>

        {/* Action Controls */}
        <div className="auditHeaderActions">
          <button
            className="btnCyber auditExportBtn"
            type="button"
            onClick={exportCsv}
            disabled={loading || filteredLogs.length === 0}
            title="Download CSV export"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button 
            className="btnCyber auditRefreshBtn" 
            type="button" 
            onClick={fetchLogs} 
            disabled={loading}
            title="Refresh event log"
          >
            <RotateCcw size={15} />
            <span>{loading ? "Syncing..." : "Sync"}</span>
          </button>
        </div>
      </div>

      {/* Forensic Metric Counters */}
      <div className="auditStatsRow">
        <div className="auditStatCard">
          <span className="auditStatNum">{stats.total}</span>
          <span className="auditStatLabel">Total Recorded Events</span>
        </div>
        <div className="auditStatCard auditStatCardGreen">
          <span className="auditStatNum">{stats.authentic}</span>
          <span className="auditStatLabel">Authentic Verifications</span>
        </div>
        <div className="auditStatCard auditStatCardRed">
          <span className="auditStatNum">{stats.tampered}</span>
          <span className="auditStatLabel">Tamper / Failed Events</span>
        </div>
      </div>

      {/* Control Bar: Search & Result Filters */}
      <div className="auditControlBar">
        <div className="auditSearchInputWrap">
          <Search size={18} className="auditSearchIcon" />
          <input
            className="auditSearchInput"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename, action, result, or hash snippet..."
            aria-label="Search audit logs"
          />
          {query && (
            <button 
              type="button" 
              className="searchClearBtn" 
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="auditFilterPills">
          <button
            type="button"
            className={`auditFilterPill ${resultFilter === 'all' ? 'auditFilterPillActive' : ''}`}
            onClick={() => setResultFilter('all')}
          >
            All Events ({logs.length})
          </button>
          <button
            type="button"
            className={`auditFilterPill ${resultFilter === 'authentic' ? 'auditFilterPillActive' : ''}`}
            onClick={() => setResultFilter('authentic')}
          >
            <ShieldCheck size={13} />
            Authentic ({stats.authentic})
          </button>
          <button
            type="button"
            className={`auditFilterPill ${resultFilter === 'tampered' ? 'auditFilterPillActive' : ''}`}
            onClick={() => setResultFilter('tampered')}
          >
            <ShieldAlert size={13} />
            Tampered ({stats.tampered})
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="auditErrorNotice">
          <AlertTriangle size={18} />
          <div>
            <strong>Ledger Sync Failed:</strong> {error}
          </div>
        </div>
      )}

      {/* Logs Table */}
      {loading ? (
        <div className="loadingStateBox">
          <div className="spinner"></div>
          <p className="loadingStateText">Verifying cryptographic hash tree...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="docEmptyState">
          <div className="emptyStateGraphic">
            <History size={48} strokeWidth={1.5} />
          </div>
          <h3>No Audit Records Found</h3>
          <p>
            {logs.length === 0
              ? "Run a document registration or verification to create initial immutable audit records."
              : "No event records match your search query."}
          </p>
          {(query || resultFilter !== 'all') && (
            <button 
              type="button" 
              className="btnCyber"
              onClick={() => { setQuery(""); setResultFilter("all"); }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="auditTableContainer">
          <table className="auditTable">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ACTION TYPE</th>
                <th>DOCUMENT NAME</th>
                <th>VERIFICATION RESULT</th>
                <th>STORED HASH (SHA-256)</th>
                <th style={{ textAlign: "right" }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr 
                  key={log.id ?? `${log.filename}-${log.timestamp}-${idx}`}
                  className="auditTableRow"
                  onClick={() => setSelectedEvent(log)}
                >
                  <td className="auditCellTime">
                    <div className="auditTimeWrap">
                      <Clock size={13} className="auditClockIcon" />
                      <span>{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="auditActionTag">
                      {log.action || "OPERATION"}
                    </span>
                  </td>
                  <td className="auditCellFilename">
                    <div className="auditFileWrap">
                      <FileText size={15} />
                      <span className="auditFileName" title={log.filename}>{log.filename || "—"}</span>
                    </div>
                  </td>
                  <td>
                    {getResultBadge(log.result)}
                  </td>
                  <td className="auditCellHash">
                    <code className="auditHashCode">
                      {log.stored_hash ? `${log.stored_hash.substring(0, 14)}...` : "—"}
                    </code>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button 
                      type="button" 
                      className="auditInspectBtn"
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(log); }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Forensic Event Details Modal */}
      {selectedEvent && (
        <div className="modalOverlay" onClick={() => setSelectedEvent(null)}>
          <div className="docModalContent" onClick={(e) => e.stopPropagation()}>
            <div className="docModalHeader">
              <div className="docModalTitleGroup">
                <span className="docCertificateBadge">
                  <Terminal size={14} />
                  AUDIT EVENT RECORD
                </span>
                <h3 className="docModalHeading">{selectedEvent.action || "System Event"}</h3>
              </div>
              <button 
                type="button" 
                className="btnCloseCyber" 
                onClick={() => setSelectedEvent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="docModalBody">
              <div className="docModalGrid">
                <div className="docModalGridItem">
                  <span className="gridItemLabel">TIMESTAMP</span>
                  <span className="gridItemValue">{formatTimestamp(selectedEvent.timestamp)}</span>
                </div>
                <div className="docModalGridItem">
                  <span className="gridItemLabel">VERIFICATION STATUS</span>
                  <div style={{ marginTop: "4px" }}>{getResultBadge(selectedEvent.result)}</div>
                </div>
                <div className="docModalGridItem">
                  <span className="gridItemLabel">TARGET FILE</span>
                  <span className="gridItemValue">{selectedEvent.filename || "—"}</span>
                </div>
                <div className="docModalGridItem">
                  <span className="gridItemLabel">RECORD ID</span>
                  <code className="gridItemValueCode">{selectedEvent.id || "autogen-ledger-seq"}</code>
                </div>
              </div>

              {selectedEvent.stored_hash && (
                <div className="docModalField" style={{ marginTop: "1rem" }}>
                  <label>RECORDED SHA-256 HASH</label>
                  <pre className="docModalCodeBlock">{selectedEvent.stored_hash}</pre>
                </div>
              )}

              <div className="docModalField" style={{ marginTop: "1rem" }}>
                <label>RAW EVENT PAYLOAD</label>
                <pre className="docModalCodeBlock signatureBlock">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            <div className="docModalFooter">
              <button 
                type="button" 
                className="btnCyber docModalCloseBtn" 
                onClick={() => setSelectedEvent(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
