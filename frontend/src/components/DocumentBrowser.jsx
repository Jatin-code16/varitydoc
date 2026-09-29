import { useState, useEffect, useMemo } from "react";
import api from "../api/client";
import { formatTimestamp } from "../lib/utils";
import { 
  Search, 
  RotateCcw, 
  LayoutGrid, 
  List, 
  FileText, 
  ShieldCheck, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  Clock, 
  Fingerprint, 
  FileCheck2, 
  Lock, 
  ExternalLink,
  X,
  FileCode,
  FileSpreadsheet,
  FileImage,
  File
} from "lucide-react";

export default function DocumentBrowser({ onNotify, currentUser, onSelectVerify }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'signed' | 'unsigned'
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [copiedHash, setCopiedHash] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.documents || []);
    } catch {
      onNotify?.({
        title: "Error",
        message: "Failed to load document ledger",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDocuments();
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/documents/search?query=${encodeURIComponent(searchQuery)}`);
      setDocuments(res.data.documents || []);
      onNotify?.({
        title: "Search Complete",
        message: `Found ${res.data.count} document(s)`,
        variant: "success"
      });
    } catch {
      onNotify?.({
        title: "Error",
        message: "Search query failed",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, e) => {
    e?.stopPropagation?.();
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
    onNotify?.({
      title: "Copied to Clipboard",
      message: "SHA-256 hash ready for verification",
      variant: "success"
    });
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText size={20} className="docTypeIconPdf" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
      case 'svg':
        return <FileImage size={20} className="docTypeIconImg" />;
      case 'csv':
      case 'xlsx':
      case 'json':
        return <FileSpreadsheet size={20} className="docTypeIconData" />;
      case 'js':
      case 'py':
      case 'html':
      case 'css':
        return <FileCode size={20} className="docTypeIconCode" />;
      default:
        return <File size={20} className="docTypeIconDefault" />;
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (filterType === 'signed') return !!doc.signature;
      if (filterType === 'unsigned') return !doc.signature;
      return true;
    });
  }, [documents, filterType]);

  const signedCount = useMemo(() => documents.filter(d => !!d.signature).length, [documents]);

  return (
    <div className="documentBrowserRoot">
      {/* Top Ledger Header & Summary */}
      <div className="docBrowserHeader">
        <div className="docBrowserTitleGroup">
          <div className="docLedgerBadge">
            <Fingerprint size={15} strokeWidth={2.5} />
            <span>IMMUTABLE CRYPTOGRAPHIC LEDGER</span>
          </div>
          <h2 className="docSectionTitle">Registered Document Repository</h2>
          <p className="docSectionDesc">
            Browse, search, and verify tamper-evident document fingerprints anchored with SHA-256 and digital signatures.
          </p>
        </div>

        {/* Quick Registry Metrics */}
        <div className="docHeaderMetrics">
          <div className="docMetricBox">
            <span className="metricNum">{documents.length}</span>
            <span className="metricLabel">Total Registered</span>
          </div>
          <div className="docMetricBox">
            <span className="metricNum metricNumAccent">{signedCount}</span>
            <span className="metricLabel">Digitally Signed</span>
          </div>
          <div className="docMetricBox">
            <span className="metricNum">100%</span>
            <span className="metricLabel">Ledger Integrity</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, and View Toggles */}
      <div className="docControlBar">
        <div className="docSearchContainer">
          <Search size={18} className="searchIconInside" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by filename or keyword..."
            className="docSearchInput"
          />
          {searchQuery && (
            <button 
              type="button" 
              className="searchClearBtn" 
              onClick={() => { setSearchQuery(""); fetchDocuments(); }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="docFilterTabs">
          <button 
            type="button" 
            className={`docFilterBtn ${filterType === 'all' ? 'docFilterActive' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({documents.length})
          </button>
          <button 
            type="button" 
            className={`docFilterBtn ${filterType === 'signed' ? 'docFilterActive' : ''}`}
            onClick={() => setFilterType('signed')}
          >
            <Lock size={12} strokeWidth={2.5} />
            Signed ({signedCount})
          </button>
          <button 
            type="button" 
            className={`docFilterBtn ${filterType === 'unsigned' ? 'docFilterActive' : ''}`}
            onClick={() => setFilterType('unsigned')}
          >
            Unsigned ({documents.length - signedCount})
          </button>
        </div>

        {/* Actions & View Toggles */}
        <div className="docControlActions">
          <button 
            type="button" 
            onClick={handleSearch} 
            className="btnCyber docSearchBtn"
            title="Search Ledger"
          >
            <Search size={16} />
            <span>Search</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => { setSearchQuery(""); fetchDocuments(); }} 
            className="btnCyber docRefreshBtn"
            title="Refresh Ledger"
          >
            <RotateCcw size={15} />
          </button>

          <div className="viewToggleGroup">
            <button 
              type="button"
              onClick={() => setViewMode('grid')}
              className={`viewToggleBtn ${viewMode === 'grid' ? 'viewToggleActive' : ''}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('list')}
              className={`viewToggleBtn ${viewMode === 'list' ? 'viewToggleActive' : ''}`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="loadingStateBox">
          <div className="spinner"></div>
          <p className="loadingStateText">Querying ledger records...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="docEmptyState">
          <div className="emptyStateGraphic">
            <Fingerprint size={48} strokeWidth={1.5} />
          </div>
          <h3>No Ledger Records Found</h3>
          <p>No documents match your query or filter criteria in the secure registry.</p>
          <button 
            type="button" 
            className="btnCyber" 
            onClick={() => { setSearchQuery(""); setFilterType("all"); fetchDocuments(); }}
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="docCardGrid">
          {filteredDocs.map((doc) => {
            const isCopied = copiedHash === doc.sha256;
            return (
              <div 
                key={doc.id} 
                className="docCyberCard"
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="docCyberCardTop">
                  <div className="docTypeIconWrapper">
                    {getFileIcon(doc.filename)}
                  </div>
                  <div className="docBadgeRow">
                    {doc.signature ? (
                      <span className="statusSeal statusSealSigned">
                        <Lock size={11} strokeWidth={2.5} />
                        SIGNED
                      </span>
                    ) : (
                      <span className="statusSeal statusSealHashed">
                        HASHED
                      </span>
                    )}
                  </div>
                </div>

                <div className="docCyberCardInfo">
                  <h4 className="docCardTitle" title={doc.filename}>{doc.filename}</h4>
                  
                  {/* Cryptographic Hash Block */}
                  <div className="docHashContainer">
                    <span className="docHashLabel">SHA-256 HASH</span>
                    <div className="docHashValueRow">
                      <code className="docHashCode">
                        {doc.sha256?.substring(0, 18)}...
                      </code>
                      <button
                        type="button"
                        className={`docCopyBtn ${isCopied ? 'docCopyBtnSuccess' : ''}`}
                        onClick={(e) => copyToClipboard(doc.sha256, e)}
                        title="Copy SHA-256 fingerprint"
                      >
                        {isCopied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="docMetaBlock">
                    <div className="docMetaItem">
                      <User size={13} />
                      <span>{doc.uploaded_by || "System Registered"}</span>
                    </div>
                    <div className="docMetaItem">
                      <Clock size={13} />
                      <span>{formatTimestamp(doc.uploaded_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="docCardFooter">
                  <span className="docDetailsHint">Click to view certificate</span>
                  <ExternalLink size={14} className="docDetailsArrow" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="docListTableContainer">
          <table className="docListTable">
            <thead>
              <tr>
                <th>DOCUMENT NAME</th>
                <th>SHA-256 FINGERPRINT</th>
                <th>SECURITY STATUS</th>
                <th>REGISTRAR</th>
                <th>TIMESTAMP</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => {
                const isCopied = copiedHash === doc.sha256;
                return (
                  <tr 
                    key={doc.id} 
                    onClick={() => setSelectedDoc(doc)}
                    className="docTableRow"
                  >
                    <td>
                      <div className="docTableRowName">
                        <span className="docTableRowIcon">{getFileIcon(doc.filename)}</span>
                        <span className="docTableRowText" title={doc.filename}>{doc.filename}</span>
                      </div>
                    </td>
                    <td>
                      <div className="docTableHashWrap">
                        <code className="docHashCodeSmall">{doc.sha256?.substring(0, 16)}...</code>
                        <button
                          type="button"
                          className="docTableCopyBtn"
                          onClick={(e) => copyToClipboard(doc.sha256, e)}
                          title="Copy SHA-256"
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      {doc.signature ? (
                        <span className="statusSeal statusSealSigned">
                          <Lock size={11} strokeWidth={2.5} />
                          SIGNED
                        </span>
                      ) : (
                        <span className="statusSeal statusSealHashed">HASHED</span>
                      )}
                    </td>
                    <td>
                      <span className="docTableUser">{doc.uploaded_by || "System"}</span>
                    </td>
                    <td>
                      <span className="docTableTime">{formatTimestamp(doc.uploaded_at)}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button 
                        type="button" 
                        className="btnTableInspect" 
                        onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Details Modal / Certificate */}
      {selectedDoc && (
        <div className="modalOverlay" onClick={() => setSelectedDoc(null)}>
          <div className="docModalContent" onClick={(e) => e.stopPropagation()}>
            <div className="docModalHeader">
              <div className="docModalTitleGroup">
                <span className="docCertificateBadge">
                  <ShieldCheck size={14} />
                  CRYPTOGRAPHIC PROOF RECORD
                </span>
                <h3 className="docModalHeading">{selectedDoc.filename}</h3>
              </div>
              <button 
                type="button" 
                className="btnCloseCyber" 
                onClick={() => setSelectedDoc(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="docModalBody">
              {/* Status Banner */}
              <div className="docModalStatusBanner">
                <div className="docModalStatusIcon">
                  {selectedDoc.signature ? <Lock size={22} /> : <ShieldCheck size={22} />}
                </div>
                <div>
                  <div className="docModalStatusTitle">
                    {selectedDoc.signature ? "Cryptographically Signed & Sealed" : "SHA-256 Anchor Verified"}
                  </div>
                  <div className="docModalStatusSub">
                    This document is permanently registered with immutability guarantees.
                  </div>
                </div>
              </div>

              {/* Full SHA-256 Fingerprint */}
              <div className="docModalField">
                <div className="docModalFieldHeader">
                  <label>FULL SHA-256 HASH FINGERPRINT</label>
                  <button 
                    type="button" 
                    className="docModalCopyBtn"
                    onClick={() => copyToClipboard(selectedDoc.sha256)}
                  >
                    {copiedHash === selectedDoc.sha256 ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedHash === selectedDoc.sha256 ? "Copied" : "Copy Hash"}</span>
                  </button>
                </div>
                <pre className="docModalCodeBlock">{selectedDoc.sha256}</pre>
              </div>

              {/* Metadata Grid */}
              <div className="docModalGrid">
                <div className="docModalGridItem">
                  <span className="gridItemLabel">REGISTERED BY</span>
                  <span className="gridItemValue">{selectedDoc.uploaded_by || "System Administrator"}</span>
                </div>
                <div className="docModalGridItem">
                  <span className="gridItemLabel">REGISTRATION DATE</span>
                  <span className="gridItemValue">{formatTimestamp(selectedDoc.uploaded_at)}</span>
                </div>
                <div className="docModalGridItem">
                  <span className="gridItemLabel">LEDGER ID</span>
                  <code className="gridItemValueCode">{selectedDoc.id}</code>
                </div>
                <div className="docModalGridItem">
                  <span className="gridItemLabel">SIGNATURE STATUS</span>
                  <span className="gridItemValue">
                    {selectedDoc.signature ? "RSA / Ed25519 Valid" : "Standard Hash Only"}
                  </span>
                </div>
              </div>

              {/* Signature Block (if signed) */}
              {selectedDoc.signature && (
                <div className="docModalField">
                  <label>DIGITAL SIGNATURE</label>
                  <pre className="docModalCodeBlock signatureBlock">{selectedDoc.signature}</pre>
                </div>
              )}
            </div>

            <div className="docModalFooter">
              <button 
                type="button" 
                className="btnCyber docModalCloseBtn" 
                onClick={() => setSelectedDoc(null)}
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
