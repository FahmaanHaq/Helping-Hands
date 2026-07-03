import React, { useEffect, useState } from 'react';
import { registerServiceProvider, getMyServiceProvider, resubmitServiceProvider } from '../services/serviceProviderService';
import StatusBadge from '../components/StatusBadge.jsx';
import DocumentUploadWidget from '../components/DocumentUploadWidget.jsx';
import { useAuth } from '../hooks/useAuth';

const CATEGORY_OPTIONS = ['TUITION', 'COUNSELLING', 'HEALTHCARE', 'SPORTS_COACHING', 'MAINTENANCE', 'OTHER'];
const PROVIDER_DOCUMENT_TYPES = ['QUALIFICATION_CERTIFICATE', 'POLICE_CLEARANCE_REPORT', 'IDENTITY_DOCUMENT', 'ADDITIONAL_PROOF'];

const initialForm = {
  skills: '',
  qualifications: '',
  serviceCategories: [],
  serviceMode: 'ONSITE'
};

function CategoryFieldset({ form, toggleCategory }) {
  return (
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
  );
}

export default function ServiceProviderRegisterPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

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

  const startEditing = () => {
    setForm({
      skills: profile.skills,
      qualifications: profile.qualifications || '',
      serviceCategories: [...profile.serviceCategories],
      serviceMode: profile.serviceMode
    });
    setError(null);
    setEditing(true);
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    if (form.serviceCategories.length === 0) {
      setError('Select at least one service category');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await resubmitServiceProvider(form);
      setProfile(result);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Resubmission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page">Loading…</div>;

  if (profile && editing) {
    return (
      <div className="page">
        <h1>Update &amp; Resubmit Your Registration</h1>
        <p className="hint-text">
          Fix the issue mentioned in your rejection reason below, then resubmit. You have{' '}
          <strong>{profile.resubmissionsRemaining}</strong> resubmission{profile.resubmissionsRemaining === 1 ? '' : 's'} remaining.
          Note: re-verifying police clearance will be required again if your service mode changes.
        </p>

        <form onSubmit={handleResubmit} className="stacked-form">
          <label>
            Skills
            <textarea name="skills" value={form.skills} onChange={handleChange} required />
          </label>
          <label>
            Qualifications
            <textarea name="qualifications" value={form.qualifications} onChange={handleChange} />
          </label>

          <CategoryFieldset form={form} toggleCategory={toggleCategory} />

          <label>
            Service Mode
            <select name="serviceMode" value={form.serviceMode} onChange={handleChange}>
              <option value="ONSITE">Onsite (direct interaction with children)</option>
              <option value="ONLINE_ONLY">Online only</option>
            </select>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Resubmitting…' : 'Resubmit for Verification'}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={submitting}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  if (profile) {
    const canResubmit = profile.verificationStatus === 'REJECTED' && profile.resubmissionsRemaining > 0;
    const outOfResubmissions = profile.verificationStatus === 'REJECTED' && profile.resubmissionsRemaining === 0;

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
          {canResubmit && (
            <>
              <p className="hint-text">
                You can correct the issue above and resubmit — {profile.resubmissionsRemaining} attempt
                {profile.resubmissionsRemaining === 1 ? '' : 's'} remaining.
              </p>
              <button type="button" onClick={startEditing}>Edit &amp; Resubmit</button>
            </>
          )}
          {outOfResubmissions && (
            <p className="form-error">
              You've used all available resubmissions for this profile. Please contact an administrator for further assistance.
            </p>
          )}
          {profile.policeClearanceRequired && !profile.policeClearanceVerified && profile.verificationStatus !== 'REJECTED' && (
            <p className="hint-text">
              Upload your police clearance report below — an administrator will verify it before approval.
            </p>
          )}
        </div>

        <DocumentUploadWidget
          ownerType="SERVICE_PROVIDER"
          ownerId={profile.id}
          allowedTypes={PROVIDER_DOCUMENT_TYPES}
        />
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

        <CategoryFieldset form={form} toggleCategory={toggleCategory} />

        <label>
          Service Mode
          <select name="serviceMode" value={form.serviceMode} onChange={handleChange}>
            <option value="ONSITE">Onsite (direct interaction with children)</option>
            <option value="ONLINE_ONLY">Online only</option>
          </select>
        </label>

        {error && <p className="form-error">{error}</p>}

        {!user?.emailVerified && (
          <p className="form-error">
            Verify your email address before registering as a provider — use the "Resend email" button in the banner above.
          </p>
        )}

        <button type="submit" disabled={submitting || !user?.emailVerified}>
          {submitting ? 'Submitting…' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}
