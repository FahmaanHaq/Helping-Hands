import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Logomark from '../components/Logomark.jsx';
import HeroNetwork from '../components/HeroNetwork.jsx';
import PasswordField from '../components/PasswordField.jsx';

const ROLE_OPTIONS = [
  { value: 'DONOR', label: 'Donor' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
  { value: 'CHILDRENS_HOME', label: "Children's Home" },
  { value: 'DELIVERY_VOLUNTEER', label: 'Delivery Volunteer' }
  // ADMINISTRATOR is intentionally excluded — admins are provisioned, never self-registered.
];
const VALID_ROLES = new Set(ROLE_OPTIONS.map((o) => o.value));

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Homepage CTAs ("Donate Goods", "Volunteer for Delivery", etc.) pass the
  // visitor's intent via ?role=... — pre-select it rather than defaulting
  // to Donor regardless of which button they actually clicked.
  const requestedRole = searchParams.get('role');
  const initialRole = VALID_ROLES.has(requestedRole) ? requestedRole : 'DONOR';

  const [form, setForm] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: '', phoneNumber: '', role: initialRole
  });
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'password' || name === 'confirmPassword') {
        setPasswordMismatch(next.confirmPassword.length > 0 && next.password !== next.confirmPassword);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    try {
      const { confirmPassword, ...payload } = form; // never sent — client-side check only
      await register(payload);
      navigate('/dashboard');
    } catch {
      // error already captured in context state
    }
  };

  return (
    <div className="auth-page">
      <HeroNetwork className="auth-page-network" />
        <HeroNetwork className="auth-page-network-secondary" />
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-form-brand">
          <Logomark size={22} />
          <span>Helping Hands</span>
        </div>

        <h1>Create your account</h1>

        <label>
          Full Name
          <input name="fullName" value={form.fullName} onChange={handleChange} required />
        </label>

        <label>
          Username
          <input name="username" value={form.username} onChange={handleChange} required />
        </label>

        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>

        <label>
          Password
          <PasswordField
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          Confirm Password
          <PasswordField
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            minLength={8}
            autoComplete="new-password"
            className={passwordMismatch ? 'input-invalid' : ''}
            required
          />
        </label>
        {passwordMismatch && <p className="field-error-text">Passwords don't match</p>}

        <label>
          Phone Number
          <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
        </label>

        <label>
          I am registering as a
          <select name="role" value={form.role} onChange={handleChange}>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={loading || passwordMismatch}>
          {loading ? 'Creating account…' : 'Register'}
        </button>

        <div className="auth-secondary-links">
          <Link to="/login" className="auth-action-link">
            <span className="auth-action-link-icon"><LogIn size={15} /></span>
            <span className="auth-action-link-text">
              Already have an account?
              <small>Sign in instead</small>
            </span>
          </Link>
        </div>
      </form>
    </div>
  );
}
