import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import Logomark from '../components/Logomark.jsx';
import HeroNetwork from '../components/HeroNetwork.jsx';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { markEmailVerified } = useAuth();

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const hasRun = useRef(false); // prevents a double-invoke (e.g. StrictMode) from consuming the single-use token twice

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    if (hasRun.current) return;
    hasRun.current = true;

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
      <HeroNetwork className="auth-page-network" />
      <div className="auth-form">
        <div className="auth-form-brand">
          <Logomark size={22} />
          <span>Helping Hands</span>
        </div>
        <h1>{status === 'success' ? 'Email verified' : status === 'error' ? 'Verification failed' : 'Verifying…'}</h1>
        <p className="hint-text">{message}</p>
        <p><Link to="/dashboard">Go to dashboard</Link></p>
      </div>
    </div>
  );
}
