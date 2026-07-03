import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { resendMfa } from '../services/authService';
import Logomark from '../components/Logomark.jsx';
import HeroNetwork from '../components/HeroNetwork.jsx';
import PasswordField from '../components/PasswordField.jsx';

export default function LoginPage() {
  const { login, completeMfaLogin, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });
  const [mfaUserId, setMfaUserId] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent
  const [resendError, setResendError] = useState(null);

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

  const handleResend = async () => {
    setResendState('sending');
    setResendError(null);
    try {
      await resendMfa(mfaUserId);
      setResendState('sent');
      setTimeout(() => setResendState('idle'), 120000); // matches the 2-minute backend cooldown
    } catch (err) {
      setResendError(err.response?.data?.message || 'Failed to resend');
      setResendState('idle');
    }
  };

  if (mfaUserId) {
    return (
      <div className="auth-page">
        <HeroNetwork className="auth-page-network" />
        <HeroNetwork className="auth-page-network-secondary" />
        <form onSubmit={handleMfaSubmit} className="auth-form">
          <div className="auth-form-brand">
            <Logomark size={22} />
            <span>Helping Hands</span>
          </div>

          <h1>Enter your login code</h1>
          <p className="hint-text">
            Administrator accounts require a second factor. We emailed a 6-digit code —
            it expires in 5 minutes. Not seeing it? Check spam, or resend below.
          </p>

          <label>
            Login Code
            <input
              className="otp-input"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="••••••"
              autoFocus
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {resendError && <p className="form-error">{resendError}</p>}

          <button type="submit" disabled={loading || mfaCode.length !== 6}>
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          <div className="resend-row">
            <button
              type="button"
              className="link-button"
              onClick={handleResend}
              disabled={resendState !== 'idle'}
            >
              {resendState === 'sending' ? 'Sending…' : resendState === 'sent' ? 'Code sent — check your inbox' : 'Resend code'}
            </button>
            <button type="button" className="link-button" onClick={() => setMfaUserId(null)}>
              Back to login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <HeroNetwork className="auth-page-network" />
        <HeroNetwork className="auth-page-network-secondary" />
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-form-brand">
          <Logomark size={22} />
          <span>Helping Hands</span>
        </div>

        <h1>Sign in</h1>

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
          <PasswordField
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
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
