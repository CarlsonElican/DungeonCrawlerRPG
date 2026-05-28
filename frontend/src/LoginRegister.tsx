import React, { useState } from 'react';
import { api } from './api';

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
      setIsRegistering(false); // Switch to login form after successful registration
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
    <div className="auth-container">
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={isRegistering ? handleRegister : handleLogin}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        {isRegistering && (
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
      </form>
      <p>
        {isRegistering ? (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => setIsRegistering(false)}>
              Login
            </button>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <button type="button" onClick={() => setIsRegistering(true)}>
              Register
            </button>
          </>
        )}
      </p>
    </div>
  );
};

export default LoginRegister;