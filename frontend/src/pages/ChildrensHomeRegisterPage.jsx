import React, { useEffect, useState } from 'react';
import { registerChildrensHome, getMyChildrensHome } from '../services/childrensHomeService';
import StatusBadge from '../components/StatusBadge.jsx';

const initialForm = {
  homeName: '',
  registrationNumber: '',
  contactNumber: '',
  contactEmail: '',
  address: '',
  description: ''
};

export default function ChildrensHomeRegisterPage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyChildrensHome()
      .then(setProfile)
      .catch(() => setProfile(null)) // 404 = not registered yet, that's expected
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await registerChildrensHome(form);
      setProfile(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page">Loading…</div>;

  if (profile) {
    return (
      <div className="page">
        <h1>Children&apos;s Home Profile</h1>
        <div className="profile-card">
          <div className="profile-row">
            <span>Status</span>
            <StatusBadge status={profile.verificationStatus} />
          </div>
          <div className="profile-row"><span>Home Name</span><strong>{profile.homeName}</strong></div>
          <div className="profile-row"><span>Registration Number</span><strong>{profile.registrationNumber}</strong></div>
          <div className="profile-row"><span>Contact</span><strong>{profile.contactNumber} · {profile.contactEmail}</strong></div>
          <div className="profile-row"><span>Address</span><strong>{profile.address}</strong></div>
          {profile.description && <div className="profile-row"><span>Description</span><strong>{profile.description}</strong></div>}
          {profile.verificationStatus === 'REJECTED' && profile.rejectionReason && (
            <p className="form-error">Reason for rejection: {profile.rejectionReason}</p>
          )}
          {profile.verificationStatus !== 'APPROVED' && (
            <p className="hint-text">
              Your home must be approved by an administrator before you can post donation or service requests.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Register Your Children&apos;s Home</h1>
      <p className="hint-text">
        This submits your home for verification. An administrator will review your
        details before you can start posting requests.
      </p>

      <form onSubmit={handleSubmit} className="stacked-form">
        <label>
          Home Name
          <input name="homeName" value={form.homeName} onChange={handleChange} required />
        </label>
        <label>
          Government Registration Number
          <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} required />
        </label>
        <label>
          Contact Number
          <input name="contactNumber" value={form.contactNumber} onChange={handleChange} required />
        </label>
        <label>
          Contact Email
          <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} required />
        </label>
        <label>
          Address
          <textarea name="address" value={form.address} onChange={handleChange} required />
        </label>
        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
