import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, completeMfaLogin, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });
  const [mfaUserId, setMfaUserId] = useState(null);
  const [mfaCode, setMfaCode] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(form.usernameOrEmail, form.password);
      if (result.mfaRequired) {
        setMfaUserId(result.userId);
      } else {
        navigate('/dashboard');
      }
    } catch {
      // error already captured in context state
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    try {
      await completeMfaLogin(mfaUserId, mfaCode);
      navigate('/dashboard');
    } catch {
      // error already captured in context state
    }
  };

  if (mfaUserId) {
    return (
      <div className="auth-page">
        <form onSubmit={handleMfaSubmit} className="auth-form">
          <h1>Enter your login code</h1>
          <p className="hint-text">
            Administrator accounts require a second factor. We emailed a 6-digit code —
            it expires in 5 minutes.
          </p>

          <label>
            Login Code
            <input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              autoFocus
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading || mfaCode.length !== 6}>
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          <p>
            <button type="button" className="link-button" onClick={() => setMfaUserId(null)}>
              Back to login
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Sign in to Helping Hands</h1>

        <label>
          Username or Email
          <input
            name="usernameOrEmail"
            value={form.usernameOrEmail}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p><Link to="/forgot-password">Forgot your password?</Link></p>

        <p>
          No account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}
