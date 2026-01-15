import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, LogIn } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { authAPI } from '@/api/client';
import './Login.css';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('auth', JSON.stringify(response));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Shield size={48} />
          <h1>DocVault Trust Console</h1>
          <p>Secure Document Verification</p>
        </div>

        <Card className="login-card">
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              {error && <div className="login-error">{error}</div>}
              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="login-button">
                <LogIn size={20} />
                Sign In
              </Button>
            </form>
            <div className="login-footer">
              Don't have an account? <Link to="/register">Sign up →</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
