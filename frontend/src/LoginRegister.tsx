import React, { useState } from 'react';
import { api } from './api';
import { Shield, KeyRound, Mail, User as UserIcon, LogIn, UserPlus } from 'lucide-react';
import './app.css';

interface User {
  user_id: number;
  username: string;
  email: string;
  created_at: string;
}

interface LoginRegisterProps {
  onLoginSuccess: (user: User) => void;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/users/register', { username, email, password });
      setMessage(`Registration successful! Welcome, ${response.data.username}. Please log in.`);
      setIsRegistering(false);
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await api.post('/users/login', { username, password });
      setMessage(`Login successful! Welcome, ${response.data.username}.`);
      onLoginSuccess(response.data);
      localStorage.setItem("token", response.data.access_token);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Check your username and password.');
    }
  };

  return (
    <div className="auth-screen-wrapper">
      <div className="auth-card">
        <div className="auth-icon-badge">
          <Shield size={36} />
        </div>

        <h2 className="auth-title">
          {isRegistering ? 'Create Account' : 'Dungeon Crawler RPG'}
        </h2>
        <p className="auth-subtitle">
          {isRegistering
            ? 'Sign up to begin your journey into the dark unknown.'
            : 'Enter the gateway to manage your heroes and loot.'}
        </p>

        {message && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'left' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text)' }} />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="Enter your traveler name..."
              />
            </div>
          </div>

          {isRegistering && (
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text)' }} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="name@domain.com"
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label htmlFor="password" className="form-label">Security Key / Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text)' }} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegistering ? 'Register Account' : 'Enter Dungeon'}
          </button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        <p style={{ fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>
          {isRegistering ? (
            <>
              Already registered?{' '}
              <button type="button" onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '0.9rem', textDecoration: 'underline' }}>
                Login here
              </button>
            </>
          ) : (
            <>
              First time here?{' '}
              <button type="button" onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: '0.9rem', textDecoration: 'underline' }}>
                Create account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default LoginRegister;