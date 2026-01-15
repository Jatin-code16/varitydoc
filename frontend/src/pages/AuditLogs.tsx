import React, { useState, useEffect } from 'react';
import { Drawer, Table, Badge } from '@/components/ui';
import { auditAPI } from '@/api/client';
import type { AuditLog } from '@/types';
import { formatTimestamp, formatDate } from '@/lib/utils';
import { Check, X } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await auditAPI.getLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'timestamp', header: 'Time', render: (log: AuditLog) => formatTimestamp(log.timestamp), width: '120px' },
    { key: 'action', header: 'Action', render: (log: AuditLog) => <Badge variant="status" type="OK">{log.action}</Badge>, width: '100px' },
    { key: 'user', header: 'User', render: (log: AuditLog) => log.user },
    { key: 'document', header: 'Document', render: (log: AuditLog) => log.document_name },
    { key: 'result', header: 'Result', render: (log: AuditLog) => (
      <Badge variant="severity" type={log.result === 'SUCCESS' ? 'SUCCESS' : 'CRITICAL'}>
        {log.result === 'SUCCESS' ? <Check size={14} /> : <X size={14} />}
        {log.result}
      </Badge>
    ), width: '120px' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-sm)' }}>
          Audit Logs
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Complete history of system events</p>
      </div>

      <Table columns={columns} data={logs} onRowClick={setSelectedLog} isLoading={isLoading} emptyMessage="No audit logs yet" />

      <Drawer isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Audit Detail">
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div><strong>Action:</strong> {selectedLog.action}</div>
            <div><strong>User:</strong> {selectedLog.user}</div>
            <div><strong>Document:</strong> {selectedLog.document_name}</div>
            <div><strong>Result:</strong> <Badge variant="severity" type={selectedLog.result === 'SUCCESS' ? 'SUCCESS' : 'CRITICAL'}>{selectedLog.result}</Badge></div>
            <div><strong>Timestamp:</strong> {formatDate(selectedLog.timestamp)}</div>
            {selectedLog.ip_address && <div><strong>IP:</strong> {selectedLog.ip_address}</div>}
          </div>
        )}
      </Drawer>
    </div>
  );
};
