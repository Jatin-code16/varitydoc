import React, { useState, useEffect } from 'react';
import { Card, CardContent, Badge, Table, Button } from '@/components/ui';
import { userAPI } from '@/api/client';
import type { User } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { Users as UsersIcon, Shield, Eye, FileText } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={14} />;
      case 'auditor': return <Eye size={14} />;
      case 'document_owner': return <FileText size={14} />;
      default: return <UsersIcon size={14} />;
    }
  };

  const getRoleBadgeType = (role: string): 'primary' | 'success' | 'warning' | 'critical' => {
    switch (role) {
      case 'admin': return 'critical';
      case 'auditor': return 'warning';
      case 'document_owner': return 'primary';
      default: return 'success';
    }
  };

  const columns = [
    {
      key: 'username',
      header: 'Username',
      render: (user: any) => (
        <div style={{ fontWeight: 'var(--font-medium)' }}>{user.username}</div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user: any) => user.email || '-',
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: any) => (
        <Badge type={getRoleBadgeType(user.role)} icon={getRoleIcon(user.role)}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (user: any) => formatTimestamp(user.created_at),
    },
    {
      key: 'last_login',
      header: 'Last Login',
      render: (user: any) => user.last_login ? formatTimestamp(user.last_login) : 'Never',
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: any) => (
        <Badge type={user.is_active ? 'success' : 'critical'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>Users</h1>
        <Button onClick={loadUsers}>Refresh</Button>
      </div>

      <Card>
        <CardContent>
          <Table
            columns={columns}
            data={users}
            loading={loading}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>

      <div style={{ marginTop: 'var(--spacing-lg)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
        Total users: {users.length}
      </div>
    </div>
  );
};

export const Settings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({
          username: payload.sub,
          role: payload.role,
        });
      } catch (error) {
        console.error('Failed to parse token:', error);
      }
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-xl)' }}>Settings</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        {/* Account Information */}
        <Card>
          <CardContent>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-md)' }}>
              Account Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                  Username
                </label>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)' }}>
                  {currentUser?.username || '-'}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                  Role
                </label>
                <Badge type={
                  currentUser?.role === 'admin' ? 'critical' :
                  currentUser?.role === 'auditor' ? 'warning' : 'primary'
                }>
                  {currentUser?.role || '-'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardContent>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-md)' }}>
              System Health
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Database</span>
                <Badge type="success">OK</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Storage</span>
                <Badge type="success">OK</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Authentication</span>
                <Badge type="success">OK</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Info */}
        <Card>
          <CardContent>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-md)' }}>
              Application Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Version</span>
                <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Environment</span>
                <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>Development</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Backend API</span>
                <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>http://localhost:8000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
