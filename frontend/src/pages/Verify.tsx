import React, { useState } from 'react';
import { Upload, Shield, Check, X, AlertTriangle, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { documentAPI } from '@/api/client';
import type { DocumentVerificationResult } from '@/types';
import { formatDate, copyToClipboard, truncateHash } from '@/lib/utils';
import './Verify.css';

export const Verify: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<DocumentVerificationResult | null>(null);
  const [showWhyExpanded, setShowWhyExpanded] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleVerify = async () => {
    if (!file) return;

    setIsVerifying(true);
    try {
      const verifyResult = await documentAPI.verify(file);
      setResult(verifyResult);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyHash = async () => {
    if (result?.document?.hash) {
      const success = await copyToClipboard(result.document.hash);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const getVerdictIcon = () => {
    switch (result?.verdict) {
      case 'AUTHENTIC':
        return <Check size={24} />;
      case 'TAMPERED':
        return <X size={24} />;
      case 'INVALID_SIGNATURE':
        return <AlertTriangle size={24} />;
      default:
        return null;
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-header">
        <Shield size={32} />
        <h1>Verify Document Authenticity</h1>
        <p>Upload a document to check its integrity and signature</p>
      </div>

      {!result ? (
        <div className="verify-upload-section">
          <div
            className={`verify-dropzone ${isDragging ? 'dropzone-active' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload size={48} />
            {file ? (
              <>
                <p className="dropzone-filename">{file.name}</p>
                <p className="dropzone-subtitle">Click to change or drag another file</p>
              </>
            ) : (
              <>
                <p>Drag file here or click to browse</p>
                <p className="dropzone-subtitle">Supports all document types</p>
              </>
            )}
            <input
              id="file-input"
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleVerify}
            disabled={!file}
            isLoading={isVerifying}
            className="verify-button"
          >
            <Shield size={20} />
            Verify Document
          </Button>
        </div>
      ) : (
        <div className="verify-result-section">
          <Card className="verify-hero-card">
            <CardContent>
              <div className="verdict-header">
                <Badge variant="verdict" type={result.verdict === 'NOT_FOUND' ? 'INVALID_SIGNATURE' : result.verdict} icon={getVerdictIcon()}>
                  {result.verdict ? result.verdict.replace(/_/g, ' ') : 'UNKNOWN'}
                </Badge>
              </div>

              <div className="verdict-details">
                <div className="verdict-row">
                  <span className="verdict-label">Hash Match</span>
                  <span className={`verdict-value ${result.hash_match ? 'verdict-success' : 'verdict-error'}`}>
                    {result.hash_match ? <Check size={18} /> : <X size={18} />}
                    {result.hash_match ? 'Verified' : 'Mismatch'}
                  </span>
                </div>

                <div className="verdict-row">
                  <span className="verdict-label">Signature</span>
                  <span className={`verdict-value ${result.signature_valid ? 'verdict-success' : 'verdict-error'}`}>
                    {result.signature_valid ? <Check size={18} /> : <X size={18} />}
                    {result.signature_valid ? 'Valid' : 'Invalid'}
                  </span>
                </div>

                {result.signed_by && (
                  <div className="verdict-row">
                    <span className="verdict-label">Signed by</span>
                    <span className="verdict-value">{result.signed_by}</span>
                  </div>
                )}

                {result.algorithm && (
                  <div className="verdict-row">
                    <span className="verdict-label">Algorithm</span>
                    <Badge variant="status" type="OK">{result.algorithm}</Badge>
                  </div>
                )}

                {result.timestamp && (
                  <div className="verdict-row">
                    <span className="verdict-label">Timestamp</span>
                    <span className="verdict-value verdict-timestamp">{formatDate(result.timestamp)}</span>
                  </div>
                )}

                {result.document?.hash && (
                  <div className="verdict-row verdict-hash">
                    <span className="verdict-label">SHA-256 Hash</span>
                    <div className="hash-container">
                      <code className="hash-value" title={result.document.hash}>
                        {truncateHash(result.document.hash, 32)}
                      </code>
                      <button className="hash-copy-btn" onClick={handleCopyHash}>
                        {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="verdict-expandables">
                <button
                  className="expandable-trigger"
                  onClick={() => setShowWhyExpanded(!showWhyExpanded)}
                >
                  {showWhyExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  Why this verdict?
                </button>

                {showWhyExpanded && (
                  <div className="expandable-content">
                    {result.reason_codes && result.reason_codes.length > 0 ? (
                      <ul className="reason-codes">
                        {result.reason_codes.map((code, i) => (
                          <li key={i}>{code}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No additional details available</p>
                    )}
                  </div>
                )}

                <button
                  className="expandable-trigger"
                  onClick={() => setShowTimeline(!showTimeline)}
                >
                  {showTimeline ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  View full audit timeline
                </button>

                {showTimeline && (
                  <div className="expandable-content">
                    <div className="timeline">
                      <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div>
                          <p className="timeline-title">Document Uploaded</p>
                          <p className="timeline-subtitle">{result.document?.uploaded_at}</p>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div>
                          <p className="timeline-title">Hash Computed</p>
                          <p className="timeline-subtitle">SHA-256 algorithm</p>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div>
                          <p className="timeline-title">Signature Check</p>
                          <p className="timeline-subtitle">{result.signature_valid ? 'Valid' : 'Invalid'}</p>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div>
                          <p className="timeline-title">Result Stored</p>
                          <p className="timeline-subtitle">Verification complete</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="verify-actions">
            <Button variant="primary" onClick={() => { setFile(null); setResult(null); }}>
              Verify Another
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              Print Proof
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
