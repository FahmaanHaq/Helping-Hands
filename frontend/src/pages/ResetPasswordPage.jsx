import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import Logomark from '../components/Logomark.jsx';
import HeroNetwork from '../components/HeroNetwork.jsx';

function BrandMark() {
  return (
    <div className="auth-form-brand">
      <Logomark size={22} />
      <span>Helping Hands</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <HeroNetwork className="auth-page-network" />
        <div className="auth-form">
          <BrandMark />
          <h1>Invalid link</h1>
          <p className="hint-text">This reset link is missing its token. Request a new one.</p>
          <p><Link to="/forgot-password">Request a new reset link</Link></p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <HeroNetwork className="auth-page-network" />
        <div className="auth-form">
          <BrandMark />
          <h1>Password reset</h1>
          <p className="hint-text">Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <HeroNetwork className="auth-page-network" />
      <form onSubmit={handleSubmit} className="auth-form">
        <BrandMark />
        <h1>Choose a new password</h1>

        <label>
          New Password
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
        </label>
        <label>
          Confirm Password
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
