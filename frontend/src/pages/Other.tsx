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
        <span className="font-medium text-base block break-words md:truncate md:max-w-[200px]" title={user.username}>{user.username}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user: any) => <span className="block break-words md:truncate md:max-w-[250px]" title={user.email}>{user.email || '-'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: any) => (
        <Badge type={getRoleBadgeType(user.role)} icon={getRoleIcon(user.role)}>
          {user.role}
        </Badge>
      ),
      width: '140px'
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (user: any) => <span className="text-sm whitespace-nowrap">{formatTimestamp(user.created_at)}</span>,
    },
    {
      key: 'last_login',
      header: 'Last Login',
      render: (user: any) => <span className="text-sm whitespace-nowrap">{user.last_login ? formatTimestamp(user.last_login) : 'Never'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: any) => (
        <Badge type={user.is_active ? 'success' : 'critical'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
      width: '100px'
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black uppercase text-black mb-2 tracking-tighter">Users</h1>
          <p className="text-lg text-gray-600">Manage system access</p>
        </div>
        <Button onClick={loadUsers} variant="primary">Refresh</Button>
      </div>

      <Card>
        <CardContent className="p-0 md:p-0">
          <Table
            columns={columns}
            data={users}
            isLoading={loading}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>

      <div className="mt-4 text-gray-400 text-sm p-4">
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
    <div className="max-w-[900px] mx-auto">
      <h1 className="text-2xl md:text-4xl font-black uppercase text-black mb-8 md:mb-12 tracking-tighter">Settings</h1>
      
      <div className="flex flex-col gap-6 md:gap-8">
        {/* Account Information */}
        <Card>
          <CardContent>
            <h2 className="text-xl md:text-2xl font-black uppercase mb-6">
              Account Information
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold uppercase text-gray-500 mb-1">
                  Username
                </label>
                <div className="text-lg font-bold">
                  {currentUser?.username || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-gray-500 mb-1">
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
            <h2 className="text-xl md:text-2xl font-black uppercase mb-6">
              System Health
            </h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="font-medium">Database</span>
                <Badge type="success">OK</Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="font-medium">Storage</span>
                <Badge type="success">OK</Badge>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="font-medium">Authentication</span>
                <Badge type="success">OK</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Info */}
        <Card>
          <CardContent>
            <h2 className="text-xl md:text-2xl font-black uppercase mb-6">
              Application Information
            </h2>
            <div className="flex flex-col gap-3 text-sm text-gray-500">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Version</span>
                <span className="font-bold text-black">1.0.0</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Environment</span>
                <span className="font-bold text-black">Development</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span>Backend API</span>
                <span className="font-bold text-black">http://localhost:8000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
