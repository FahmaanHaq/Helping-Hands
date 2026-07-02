import React, { useEffect, useState } from 'react';
import { registerServiceProvider, getMyServiceProvider } from '../services/serviceProviderService';
import StatusBadge from '../components/StatusBadge.jsx';

const CATEGORY_OPTIONS = ['TUITION', 'COUNSELLING', 'HEALTHCARE', 'SPORTS_COACHING', 'MAINTENANCE', 'OTHER'];

const initialForm = {
  skills: '',
  qualifications: '',
  serviceCategories: [],
  serviceMode: 'ONSITE'
};

export default function ServiceProviderRegisterPage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyServiceProvider()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleCategory = (category) => {
    setForm((prev) => {
      const has = prev.serviceCategories.includes(category);
      return {
        ...prev,
        serviceCategories: has
          ? prev.serviceCategories.filter((c) => c !== category)
          : [...prev.serviceCategories, category]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.serviceCategories.length === 0) {
      setError('Select at least one service category');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await registerServiceProvider(form);
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
        <h1>Service Provider Profile</h1>
        <div className="profile-card">
          <div className="profile-row"><span>Status</span><StatusBadge status={profile.verificationStatus} /></div>
          <div className="profile-row"><span>Skills</span><strong>{profile.skills}</strong></div>
          <div className="profile-row"><span>Categories</span><strong>{profile.serviceCategories.join(', ')}</strong></div>
          <div className="profile-row"><span>Service Mode</span><strong>{profile.serviceMode}</strong></div>
          <div className="profile-row">
            <span>Police Clearance</span>
            <strong>
              {profile.policeClearanceRequired
                ? (profile.policeClearanceVerified ? 'Required — Verified' : 'Required — Not yet verified')
                : 'Not required (online-only)'}
            </strong>
          </div>
          {profile.verificationStatus === 'REJECTED' && profile.rejectionReason && (
            <p className="form-error">Reason for rejection: {profile.rejectionReason}</p>
          )}
          {profile.policeClearanceRequired && !profile.policeClearanceVerified && (
            <p className="hint-text">
              Document upload for police clearance will be enabled in the next module —
              for now this is verified manually by an administrator.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Register as a Service Provider</h1>
      <p className="hint-text">
        Onsite services that involve direct interaction with children require a
        verified police clearance before approval. Online-only services can bypass this.
      </p>

      <form onSubmit={handleSubmit} className="stacked-form">
        <label>
          Skills
          <textarea name="skills" value={form.skills} onChange={handleChange} required />
        </label>
        <label>
          Qualifications
          <textarea name="qualifications" value={form.qualifications} onChange={handleChange} />
        </label>

        <fieldset>
          <legend>Service Categories</legend>
          {CATEGORY_OPTIONS.map((cat) => (
            <label key={cat} className="checkbox-label">
              <input
                type="checkbox"
                checked={form.serviceCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              {cat.replace('_', ' ')}
            </label>
          ))}
        </fieldset>

        <label>
          Service Mode
          <select name="serviceMode" value={form.serviceMode} onChange={handleChange}>
            <option value="ONSITE">Onsite (direct interaction with children)</option>
            <option value="ONLINE_ONLY">Online only</option>
          </select>
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
