import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRequest } from '../services/requestService';
import { useAuth } from '../hooks/useAuth';

const GOODS_CATEGORIES = ['FOOD', 'BOOKS', 'CLOTHING', 'MEDICAL_SUPPLIES', 'EDUCATIONAL_MATERIALS', 'OTHER_GOODS'];
const SERVICE_CATEGORIES = ['TUITION', 'COUNSELLING', 'HEALTHCARE', 'SPORTS_COACHING', 'MAINTENANCE', 'OTHER'];
const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const initialForm = {
  requestType: 'GOODS',
  goodsCategory: GOODS_CATEGORIES[0],
  serviceCategory: SERVICE_CATEGORIES[0],
  title: '',
  description: '',
  quantity: '',
  urgency: 'MEDIUM'
};

export default function CreateRequestPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        requestType: form.requestType,
        goodsCategory: form.requestType === 'GOODS' ? form.goodsCategory : null,
        serviceCategory: form.requestType === 'SERVICE' ? form.serviceCategory : null,
        title: form.title,
        description: form.description,
        quantity: form.requestType === 'GOODS' && form.quantity ? Number(form.quantity) : null,
        urgency: form.urgency
      };
      const created = await createRequest(payload);
      navigate(`/requests/${created.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>New Request</h1>
      <p className="hint-text">
        Your home must be an approved profile before a request can be created.
      </p>

      <form onSubmit={handleSubmit} className="stacked-form">
        <label>
          Request Type
          <select name="requestType" value={form.requestType} onChange={handleChange}>
            <option value="GOODS">Goods</option>
            <option value="SERVICE">Service</option>
          </select>
        </label>

        {form.requestType === 'GOODS' ? (
          <label>
            Goods Category
            <select name="goodsCategory" value={form.goodsCategory} onChange={handleChange}>
              {GOODS_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </label>
        ) : (
          <label>
            Service Category
            <select name="serviceCategory" value={form.serviceCategory} onChange={handleChange}>
              {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </label>
        )}

        <label>
          Title
          <input name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} />
        </label>

        {form.requestType === 'GOODS' && (
          <label>
            Quantity
            <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleChange} />
          </label>
        )}

        <label>
          Urgency
          <select name="urgency" value={form.urgency} onChange={handleChange}>
            {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>

        {error && <p className="form-error">{error}</p>}

        {!user?.emailVerified && (
          <p className="form-error">
            Verify your email address before creating a request — use the "Resend email" button in the banner above.
          </p>
        )}

        <button type="submit" disabled={submitting || !user?.emailVerified}>
          {submitting ? 'Creating…' : 'Create Request'}
        </button>
      </form>
    </div>
  );
}
