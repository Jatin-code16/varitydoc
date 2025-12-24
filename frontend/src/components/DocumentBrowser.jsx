import { useState, useEffect } from "react";
import api from "../api/client";

export default function DocumentBrowser({ onNotify, currentUser }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.documents || []);
    } catch (err) {
      onNotify({
        title: "Error",
        message: "Failed to load documents",
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
      onNotify({
        title: "Search",
        message: `Found ${res.data.count} document(s)`,
        variant: "success"
      });
    } catch (err) {
      onNotify({
        title: "Error",
        message: "Search failed",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    onNotify({
      title: "Copied",
      message: "Hash copied to clipboard",
      variant: "success"
    });
  };

  if (loading) {
    return (
      <div className="loadingContainer">
        <div className="spinner"></div>
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="documentBrowser">
      {/* Search Bar */}
      <div className="searchBar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search documents by filename..."
          className="searchInput"
        />
        <button onClick={handleSearch} className="btn btnPrimary">
          🔍 Search
        </button>
        <button onClick={fetchDocuments} className="btn">
          ↻ Reset
        </button>
      </div>

      {/* Document Count */}
      <div className="documentCount">
        <p>Total: <strong>{documents.length}</strong> document(s)</p>
      </div>

      {/* Document Grid */}
      {documents.length === 0 ? (
        <div className="emptyState">
          <p>📁 No documents found</p>
        </div>
      ) : (
        <div className="documentGrid">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="documentCard"
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="docCardHeader">
                <span className="docIcon">📄</span>
                <h4 className="docFilename">{doc.filename}</h4>
              </div>

              <div className="docCardBody">
                <div className="docField">
                  <label>Hash</label>
                  <code className="docHash" title={doc.sha256}>
                    {doc.sha256?.substring(0, 16)}...
                  </code>
                  <button
                    className="btnIcon"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(doc.sha256);
                    }}
                    title="Copy full hash"
                  >
                    📋
                  </button>
                </div>

                <div className="docField">
                  <label>Uploaded By</label>
                  <span>{doc.uploaded_by || "Unknown"}</span>
                </div>

                <div className="docField">
                  <label>Uploaded At</label>
                  <span className="docDate">{formatDate(doc.uploaded_at)}</span>
                </div>

                {doc.signature && (
                  <div className="docSignature">
                    <span className="signatureBadge">🔒 Signed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="modal" onClick={() => setSelectedDoc(null)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>Document Details</h3>
              <button className="btnClose" onClick={() => setSelectedDoc(null)}>
                ✕
              </button>
            </div>

            <div className="modalBody">
              <div className="detailField">
                <label>Filename</label>
                <p className="detailValue">{selectedDoc.filename}</p>
              </div>

              <div className="detailField">
                <label>SHA-256 Hash</label>
                <p className="detailValueMono">{selectedDoc.sha256}</p>
                <button
                  className="btn btnSmall"
                  onClick={() => copyToClipboard(selectedDoc.sha256)}
                >
                  Copy Hash
                </button>
              </div>

              <div className="detailField">
                <label>Uploaded By</label>
                <p className="detailValue">{selectedDoc.uploaded_by || "Unknown"}</p>
              </div>

              <div className="detailField">
                <label>Uploaded At</label>
                <p className="detailValue">{formatDate(selectedDoc.uploaded_at)}</p>
              </div>

              {selectedDoc.signature && (
                <>
                  <div className="detailField">
                    <label>Digital Signature</label>
                    <p className="detailValueMono">{selectedDoc.signature.signature?.substring(0, 100)}...</p>
                  </div>

                  <div className="detailField">
                    <label>Signed By</label>
                    <p className="detailValue">{selectedDoc.signature.signer}</p>
                  </div>

                  <div className="detailField">
                    <label>Algorithm</label>
                    <p className="detailValue">{selectedDoc.signature.algorithm || "RSA-SHA256"}</p>
                  </div>
                </>
              )}
            </div>

            <div className="modalFooter">
              <button className="btn" onClick={() => setSelectedDoc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
