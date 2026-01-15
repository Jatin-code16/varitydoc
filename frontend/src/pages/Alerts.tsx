import React, { useState, useEffect } from 'react';
import { Badge, Card, CardContent, Button } from '@/components/ui';
import { alertAPI } from '@/api/client';
import type { Alert } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'CRITICAL' | 'WARNING'>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const data = await alertAPI.getAll();
    setAlerts(Array.isArray(data) ? data : []);
  };

  const filteredAlerts = Array.isArray(alerts) ? alerts.filter((a) => {
    if (filter === 'unread') return !a.read;
    if (filter === 'CRITICAL' || filter === 'WARNING') return a.severity === filter;
    return true;
  }) : [];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-xl)' }}>Alerts</h1>
      
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
        {['all', 'unread', 'CRITICAL', 'WARNING'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f as any)}
          >
            {f}
          </Button>
        ))}
      </div>

      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="alerts-empty-content">
            <p style={{ fontSize: 'var(--text-xl)', color: 'var(--success-text)' }}>✓ No active alerts</p>
            <p style={{ color: 'var(--text-tertiary)', marginTop: 'var(--spacing-sm)' }}>All systems operating normally</p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {filteredAlerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <Badge variant="severity" type={alert.severity}>
                      {alert.severity === 'CRITICAL' && <XCircle size={14} />}
                      {alert.severity === 'WARNING' && <AlertTriangle size={14} />}
                      {alert.severity === 'INFO' && <Info size={14} />}
                      {alert.severity}
                    </Badge>
                    <h3 style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>{alert.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{alert.message}</p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 'var(--spacing-sm)' }}>
                      {formatTimestamp(alert.timestamp)}
                    </p>
                  </div>
                  {!alert.read && (
                    <Button size="sm" variant="secondary" onClick={() => alertAPI.markAsRead(alert.id).then(loadAlerts)}>
                      Mark as Read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
