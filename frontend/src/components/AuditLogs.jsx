import { useEffect, useMemo, useState } from "react";
import api from "../api/client";

function AuditLogs({ onNotify }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/audit-logs");
      setLogs(response.data.audit_logs || []);
    } catch {
      setError("Failed to load audit logs");
      onNotify?.({
        title: "Audit logs",
        message: "Failed to load audit logs.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTimestamp = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  };

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (logs ?? []).filter((row) => {
      const haystack =
        `${row?.timestamp ?? ""} ${row?.action ?? ""} ${row?.filename ?? ""} ${row?.result ?? ""} ${row?.stored_hash ?? ""}`.toLowerCase();
      const matchesQuery = q ? haystack.includes(q) : true;
      const matchesResult =
        resultFilter === "all" ? true : String(row?.result ?? "").toLowerCase() === resultFilter;
      return matchesQuery && matchesResult;
    });
  }, [logs, query, resultFilter]);

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
        title: "Export",
        message: "Audit logs CSV downloaded.",
        variant: "success",
      });
    } catch (e) {
      console.error(e);
      onNotify?.({
        title: "Export",
        message: "Could not generate CSV.",
        variant: "error",
      });
    }
  };

  return (
    <section>
      <div className="cardHeader">
        <div>
          <h2 className="cardTitle">Audit logs</h2>
          <p className="cardSubtitle">A record of register/verify operations.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            className="btn btnSmall"
            type="button"
            onClick={exportCsv}
            disabled={loading || filteredLogs.length === 0}
          >
            Export CSV
          </button>
          <button className="btn" type="button" onClick={fetchLogs} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2" style={{ marginTop: "10px" }}>
        <label className="field">
          <span className="label">Search</span>
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by filename, action, result, hash…"
            aria-label="Search audit logs"
          />
        </label>

        <label className="field">
          <span className="label">Result</span>
          <select
            className="input"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            aria-label="Filter audit logs by result"
          >
            <option value="all">All</option>
            <option value="authentic">AUTHENTIC</option>
            <option value="not_authentic">NOT_AUTHENTIC</option>
            <option value="success">SUCCESS</option>
            <option value="failed">FAILED</option>
          </select>
        </label>
      </div>

      {error && (
        <div className="notice" aria-live="polite">
          <p className="noticeTitle">Request failed</p>
          <div className="mono">{error}</div>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="notice">
          <p className="noticeTitle">No logs yet</p>
          <div>Run a register/verify action to generate audit entries.</div>
        </div>
      )}

      {!loading && !error && logs.length > 0 && filteredLogs.length === 0 && (
        <div className="notice" aria-live="polite">
          <p className="noticeTitle">No matches</p>
          <div>Try clearing filters to see audit entries.</div>
        </div>
      )}

      {filteredLogs.length > 0 && (
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Filename</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr key={log.id ?? `${log.filename}-${log.timestamp}`} className="staggerItem"
                  >
                  <td>{formatTimestamp(log.timestamp)}</td>
                  <td>{log.action ?? "—"}</td>
                  <td>{log.filename ?? "—"}</td>
                  <td>
                    <span
                      className={
                        log.result === "AUTHENTIC" || log.result === "SUCCESS"
                          ? "badge badgeAccent badgeGlow"
                          : "badge"
                      }
                    >
                      {log.result ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AuditLogs;
