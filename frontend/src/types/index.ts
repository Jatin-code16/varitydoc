// Auth Types
export interface User {
  username: string;
  email?: string;
  role: 'admin' | 'document_owner' | 'auditor' | 'guest';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  username: string;
  role: string;
}

// Document Types
export interface Document {
  id: string;
  name: string;
  hash: string;
  signature?: string;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
  tags?: string[];
}

export interface DocumentVerificationResult {
  verdict: 'AUTHENTIC' | 'TAMPERED' | 'INVALID_SIGNATURE' | 'NOT_FOUND';
  hash_match: boolean;
  signature_valid: boolean;
  document: Document | null;
  reason_codes: string[];
  signed_by?: string;
  algorithm?: string;
  timestamp?: string;
}

// System Types
export interface AuditLog {
  id: string;
  action: 'VERIFY' | 'REGISTER' | 'DELETE' | 'UPDATE';
  user: string;
  document_name: string;
  result: 'SUCCESS' | 'FAILED';
  timestamp: string;
  ip_address?: string;
  details?: Record<string, any>;
}

export interface Alert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_required?: boolean;
}

export interface SystemHealth {
  database: 'OK' | 'WARNING' | 'ERROR';
  storage: 'OK' | 'WARNING' | 'ERROR';
  auth: 'OK' | 'WARNING' | 'ERROR';
  last_check: string;
}
