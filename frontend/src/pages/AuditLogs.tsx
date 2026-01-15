import React, { useState, useEffect } from 'react';
import { Drawer, Table, Badge } from '@/components/ui';
import { auditAPI } from '@/api/client';
import type { AuditLog } from '@/types';
import { formatTimestamp, formatDate } from '@/lib/utils';
import { Check, X, Search } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');

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

  const filteredLogs = logs.filter(log => {
    const search = searchQuery.toLowerCase();
    return (
      (log.user.toLowerCase().includes(search) || 
       log.document_name.toLowerCase().includes(search) ||
       log.action.toLowerCase().includes(search)) &&
      (resultFilter === 'ALL' || log.result === resultFilter)
    );
  });

  const columns = [
    { 
      key: 'timestamp', 
      header: 'Time', 
      render: (log: AuditLog) => (
        <span className="whitespace-nowrap">{formatTimestamp(log.timestamp)}</span>
      ), 
      width: '120px' 
    },
    { 
      key: 'action', 
      header: 'Action', 
      render: (log: AuditLog) => <Badge variant="status" type="OK">{log.action}</Badge>, 
      width: '100px' 
    },
    { 
      key: 'user', 
      header: 'User', 
      render: (log: AuditLog) => (
        <span className="block break-words md:truncate md:max-w-[200px]" title={log.user}>
          {log.user}
        </span>
      ) 
    },
    { 
      key: 'document', 
      header: 'Document', 
      render: (log: AuditLog) => (
        <span className="block break-words md:truncate md:max-w-[300px]" title={log.document_name}>
          {log.document_name}
        </span>
      ) 
    },
    { 
      key: 'result', 
      header: 'Result', 
      render: (log: AuditLog) => (
        <Badge variant="severity" type={log.result === 'SUCCESS' ? 'SUCCESS' : 'CRITICAL'}>
          {log.result === 'SUCCESS' ? <Check size={14} /> : <X size={14} />}
          {log.result}
        </Badge>
      ), 
      width: '120px' 
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto">
      <div className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-4xl font-black uppercase text-black mb-2 tracking-tighter">
          Audit Logs
        </h1>
        <p className="text-lg text-gray-600">Complete history of system events</p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-end p-1">
        <div className="flex-1">
          <label className="font-bold text-sm mb-1 block uppercase tracking-wider">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, document, or action..."
              className="w-full pl-10 p-2 text-base font-medium border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all"
            />
          </div>
        </div>
        <div className="w-full md:w-64">
           <label className="font-bold text-sm mb-1 block uppercase tracking-wider">Result</label>
           <select 
             value={resultFilter}
             onChange={(e) => setResultFilter(e.target.value)}
             className="w-full p-2 h-[42px] md:h-[46px] bg-white text-base font-medium border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all"
           >
             <option value="ALL">All Results</option>
             <option value="SUCCESS">Success</option>
             <option value="CRITICAL">Critical</option>
           </select>
        </div>
      </div>

      <Table columns={columns} data={filteredLogs} onRowClick={setSelectedLog} isLoading={isLoading} emptyMessage="No audit logs match criteria" />

      <Drawer isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Audit Detail">
        {selectedLog && (
          <div className="flex flex-col gap-4">
            <div className="pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase text-gray-500 block mb-1">Action</span>
              <span className="font-medium text-lg">{selectedLog.action}</span>
            </div>
            
            <div className="pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase text-gray-500 block mb-1">User</span>
              <span className="font-mono text-sm break-all">{selectedLog.user}</span>
            </div>

            <div className="pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase text-gray-500 block mb-1">Document</span>
              <span className="font-medium break-words">{selectedLog.document_name}</span>
            </div>

            <div className="pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase text-gray-500 block mb-1">Result</span>
              <Badge variant="severity" type={selectedLog.result === 'SUCCESS' ? 'SUCCESS' : 'CRITICAL'}>
                {selectedLog.result}
              </Badge>
            </div>

            <div className="pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase text-gray-500 block mb-1">Timestamp</span>
              <span className="font-mono text-sm">{formatDate(selectedLog.timestamp)}</span>
            </div>

            {selectedLog.ip_address && (
              <div className="pb-2 border-b border-gray-100">
                <span className="text-xs font-bold uppercase text-gray-500 block mb-1">IP Address</span>
                <span className="font-mono text-sm">{selectedLog.ip_address}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
