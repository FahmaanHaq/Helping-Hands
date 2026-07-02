import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { markEmailVerified } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    verifyEmail(token)
      .then((msg) => {
        setStatus('success');
        setMessage(msg);
        markEmailVerified();
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'This verification link is invalid or has expired.');
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h1>{status === 'success' ? 'Email verified' : status === 'error' ? 'Verification failed' : 'Verifying…'}</h1>
        <p className="hint-text">{message}</p>
        <p><Link to="/dashboard">Go to dashboard</Link></p>
      </div>
    </div>
  );
}
