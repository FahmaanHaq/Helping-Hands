import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const msg = await forgotPassword(email);
      setMessage(msg);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Forgot your password?</h1>
        <p className="hint-text">
          Enter the email you registered with — if it matches an account, we&apos;ll send a reset link.
        </p>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        {message && <p className="hint-text" style={{ color: 'var(--hh-primary)' }}>{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Reset Link'}
        </button>

        <p><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}
