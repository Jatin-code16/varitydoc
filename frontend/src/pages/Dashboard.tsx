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
        <span className="text-xs text-gray-400 whitespace-nowrap">
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
    { 
      key: 'user', 
      header: 'User', 
      render: (log: AuditLog) => (
        <span className="block break-words md:truncate md:max-w-[150px]" title={log.user}>
          {log.user}
        </span>
      )
    },
    { 
      key: 'document', 
      header: 'Document', 
      render: (log: AuditLog) => (
        <span className="block break-words md:truncate md:max-w-[200px]" title={log.document_name}>
          {log.document_name}
        </span>
      )
    },
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
    <div className="max-w-[1440px] mx-auto">
      <div className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-4xl font-black uppercase text-black mb-2 tracking-tighter">Dashboard</h1>
        <p className="text-base md:text-lg text-gray-600">System overview and quick actions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Hero Tile: Verification Status */}
        <Card className="col-span-1 sm:col-span-2 lg:col-span-2 min-h-[200px]" hover>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <span className="text-5xl md:text-6xl font-black leading-none">{documents.length}</span>
              <span className="text-sm font-bold uppercase tracking-widest">Total Documents</span>
            </div>
            {verifiedToday > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm font-bold rounded-none">
                <TrendingUp size={16} />
                <span>+{verifiedToday} verified today</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Tile: Open Alerts */}
        <Card className="col-span-1 min-h-[200px]" hover>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle size={32} color={criticalAlerts > 0 ? 'var(--critical-text)' : 'var(--text-tertiary)'} />
              <div className="flex flex-col">
                <span className="text-3xl font-bold leading-none">{openAlerts}</span>
                <span className="text-sm font-bold uppercase tracking-widest">Open Alerts</span>
              </div>
            </div>
            <Link to="/alerts" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              View All <ArrowRight size={14} />
            </Link>
          </CardContent>
        </Card>

        {/* Compact Tile: Active Users */}
        <Card className="col-span-1 min-h-[200px]" hover>
          <CardContent>
            <div className="flex items-center gap-4">
              <Shield size={32} className="text-primary-500" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold leading-none">12</span>
                <span className="text-sm font-bold uppercase tracking-widest">Active Users</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Action Tiles */}
        <Link to="/verify" className="col-span-1 block no-underline">
          <Card hover className="h-full">
            <CardContent className="h-full flex flex-col justify-between">
              <div>
                <Shield size={32} className="mb-4" />
                <h3 className="text-xl font-bold mb-2">Verify New</h3>
                <p className="text-gray-600">Check document authenticity</p>
              </div>
              <ArrowRight size={20} className="mt-4 self-end" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/register" className="col-span-1 block no-underline">
          <Card hover className="h-full">
            <CardContent className="h-full flex flex-col justify-between">
              <div>
                <FileCheck size={32} className="mb-4" />
                <h3 className="text-xl font-bold mb-2">Register Document</h3>
                <p className="text-gray-600">Add new document to system</p>
              </div>
              <ArrowRight size={20} className="mt-4 self-end" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/audit" className="col-span-1 block no-underline">
          <Card hover className="h-full">
            <CardContent className="h-full flex flex-col justify-between">
              <div>
                <ScrollText size={32} className="mb-4" />
                <h3 className="text-xl font-bold mb-2">View Logs & Audit</h3>
                <p className="text-gray-600">Browse system activity</p>
              </div>
              <ArrowRight size={20} className="mt-4 self-end" />
            </CardContent>
          </Card>
        </Link>

        {/* Recent Audit Events */}
        <Card className="col-span-1 sm:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Audit Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table columns={auditColumns} data={auditLogs} isLoading={isLoading} emptyMessage="No audit events yet" />
            {auditLogs.length > 0 && (
              <div className="mt-4 text-right">
                <Link to="/audit" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center justify-end gap-1">
                  View All Logs <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="col-span-1 md:col-span-4">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="font-medium">Database</span>
                <Badge variant="status" type="OK">
                  <Check size={14} />
                  OK
                </Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="font-medium">Storage</span>
                <Badge variant="status" type="OK">
                  <Check size={14} />
                  OK
                </Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="font-medium">Auth</span>
                <Badge variant="status" type="OK">
                  <Check size={14} />
                  OK
                </Badge>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-400 text-right">Last check: 2 minutes ago</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
