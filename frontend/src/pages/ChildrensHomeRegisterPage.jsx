import React, { useEffect, useState } from 'react';
import { registerChildrensHome, getMyChildrensHome, resubmitChildrensHome } from '../services/childrensHomeService';
import StatusBadge from '../components/StatusBadge.jsx';
import DocumentUploadWidget from '../components/DocumentUploadWidget.jsx';

const HOME_DOCUMENT_TYPES = ['GOVERNMENT_REGISTRATION_CERTIFICATE', 'NCPA_DOCUMENT', 'ADDITIONAL_PROOF'];

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
  const [editing, setEditing] = useState(false);

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

  const startEditing = () => {
    setForm({
      homeName: profile.homeName,
      registrationNumber: profile.registrationNumber,
      contactNumber: profile.contactNumber,
      contactEmail: profile.contactEmail,
      address: profile.address,
      description: profile.description || ''
    });
    setError(null);
    setEditing(true);
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await resubmitChildrensHome(form);
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
        </p>

        <form onSubmit={handleResubmit} className="stacked-form">
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
          {profile.verificationStatus !== 'APPROVED' && profile.verificationStatus !== 'REJECTED' && (
            <p className="hint-text">
              Your home must be approved by an administrator before you can post donation or service requests.
            </p>
          )}
        </div>

        <DocumentUploadWidget
          ownerType="CHILDRENS_HOME"
          ownerId={profile.id}
          allowedTypes={HOME_DOCUMENT_TYPES}
        />
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
