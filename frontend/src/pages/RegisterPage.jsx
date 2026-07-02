import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLE_OPTIONS = [
  { value: 'DONOR', label: 'Donor' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
  { value: 'CHILDRENS_HOME', label: "Children's Home" },
  { value: 'DELIVERY_VOLUNTEER', label: 'Delivery Volunteer' }
  // ADMINISTRATOR is intentionally excluded — admins are provisioned, never self-registered.
];

const initialForm = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  phoneNumber: '',
  role: 'DONOR'
};

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/dashboard');
    } catch {
      // error already captured in context state
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
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
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
        </label>

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

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>

        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
