import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { resendVerification } from '../services/authService';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    setError(null);
    try {
      await resendVerification();
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="verify-banner">
      <Mail size={18} />
      <span>
        {sent
          ? 'Verification email sent — check your inbox.'
          : 'Please verify your email address to unlock full access.'}
      </span>
      {!sent && (
        <button onClick={handleResend} disabled={sending}>
          {sending ? 'Sending…' : 'Resend email'}
        </button>
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
