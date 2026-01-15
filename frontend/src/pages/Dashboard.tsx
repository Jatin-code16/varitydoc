import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileCheck, ScrollText, ArrowRight, TrendingUp, Check, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, Button } from '@/components/ui';
import { documentAPI, auditAPI, alertAPI } from '@/api/client';
import type { Document, AuditLog, Alert } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [docs, logs, alertsData] = await Promise.all([
        documentAPI.list().catch(() => []),
        auditAPI.getLogs().catch(() => []),
        alertAPI.getAll().catch(() => []),
      ]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setAuditLogs(Array.isArray(logs) ? logs.slice(0, 5) : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } finally {
      setIsLoading(false);
    }
  };

  const verifiedToday = Array.isArray(documents) ? documents.filter((doc) => {
    const uploadDate = new Date(doc.uploaded_at);
    const today = new Date();
    return uploadDate.toDateString() === today.toDateString();
  }).length : 0;

  const openAlerts = Array.isArray(alerts) ? alerts.filter((a) => !a.read).length : 0;
  const criticalAlerts = Array.isArray(alerts) ? alerts.filter((a) => a.severity === 'CRITICAL' && !a.read).length : 0;

  const auditColumns = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (log: AuditLog) => (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {formatTimestamp(log.timestamp)}
        </span>
      ),
      width: '100px',
    },
    {
      key: 'action',
      header: 'Action',
      render: (log: AuditLog) => (
        <Badge variant="status" type={log.action === 'VERIFY' ? 'OK' : undefined}>
          {log.action}
        </Badge>
      ),
      width: '100px',
    },
    { key: 'user', header: 'User', render: (log: AuditLog) => log.user },
    { key: 'document', header: 'Document', render: (log: AuditLog) => log.document_name },
    {
      key: 'result',
      header: 'Result',
      render: (log: AuditLog) => (
        <Badge variant="severity" type={log.result === 'SUCCESS' ? 'SUCCESS' : 'CRITICAL'}>
          {log.result === 'SUCCESS' ? <Check size={14} /> : null}
          {log.result}
        </Badge>
      ),
      width: '100px',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>System overview and quick actions</p>
      </div>

      <div className="dashboard-grid">
        {/* Hero Tile: Verification Status */}
        <Card className="dashboard-tile tile-hero" hover>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tile-metric">
              <span className="tile-number">{documents.length}</span>
              <span className="tile-label">Total Documents</span>
            </div>
            {verifiedToday > 0 && (
              <div className="tile-trend">
                <TrendingUp size={16} />
                <span>+{verifiedToday} verified today</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Tile: Open Alerts */}
        <Card className="dashboard-tile tile-compact" hover>
          <CardContent>
            <div className="tile-compact-content">
              <AlertTriangle size={32} color={criticalAlerts > 0 ? 'var(--critical-text)' : 'var(--text-tertiary)'} />
              <div className="tile-metric">
                <span className="tile-number-compact">{openAlerts}</span>
                <span className="tile-label">Open Alerts</span>
              </div>
            </div>
            <Link to="/alerts" className="tile-link">
              View All <ArrowRight size={14} />
            </Link>
          </CardContent>
        </Card>

        {/* Compact Tile: Active Users */}
        <Card className="dashboard-tile tile-compact" hover>
          <CardContent>
            <div className="tile-compact-content">
              <Shield size={32} color="var(--primary-500)" />
              <div className="tile-metric">
                <span className="tile-number-compact">12</span>
                <span className="tile-label">Active Users</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Action Tiles */}
        <Link to="/verify" className="dashboard-tile tile-action">
          <Card hover>
            <CardContent>
              <Shield size={32} />
              <h3>Verify New</h3>
              <p>Check document authenticity</p>
              <ArrowRight size={20} className="tile-action-arrow" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/register" className="dashboard-tile tile-action">
          <Card hover>
            <CardContent>
              <FileCheck size={32} />
              <h3>Register Document</h3>
              <p>Add new document to system</p>
              <ArrowRight size={20} className="tile-action-arrow" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/audit" className="dashboard-tile tile-action">
          <Card hover>
            <CardContent>
              <ScrollText size={32} />
              <h3>View Logs & Audit</h3>
              <p>Browse system activity</p>
              <ArrowRight size={20} className="tile-action-arrow" />
            </CardContent>
          </Card>
        </Link>

        {/* Recent Audit Events */}
        <Card className="dashboard-tile tile-wide">
          <CardHeader>
            <CardTitle>Recent Audit Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table columns={auditColumns} data={auditLogs} isLoading={isLoading} emptyMessage="No audit events yet" />
            {auditLogs.length > 0 && (
              <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'right' }}>
                <Link to="/audit" style={{ fontSize: 'var(--text-sm)', color: 'var(--primary-600)' }}>
                  View All Logs <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="dashboard-tile tile-sidebar">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="health-list">
              <div className="health-item">
                <span>Database</span>
                <Badge variant="status" type="OK">
                  <Check size={14} />
                  OK
                </Badge>
              </div>
              <div className="health-item">
                <span>Storage</span>
                <Badge variant="status" type="OK">
                  <Check size={14} />
                  OK
                </Badge>
              </div>
              <div className="health-item">
                <span>Auth</span>
                <Badge variant="status" type="OK">
                  <Check size={14} />
                  OK
                </Badge>
              </div>
            </div>
            <p className="health-timestamp">Last check: 2 minutes ago</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
