import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { submitRating, getRatingForRequest } from '../services/ratingService';

export default function RatingWidget({ requestId, canRate, pledgedByUsername }) {
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRatingForRequest(requestId)
      .then(setRating)
      .catch(() => setRating(null))
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitRating(requestId, score, comment);
      setRating(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (rating) {
    return (
      <div className="rating-widget">
        <h3>Your Rating</h3>
        <div className="rating-stars-display">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={18} fill={n <= rating.score ? '#a5720a' : 'none'} color="#a5720a" />
          ))}
        </div>
        {rating.comment && <p className="hint-text">&quot;{rating.comment}&quot;</p>}
      </div>
    );
  }

  if (!canRate) return null;

  return (
    <div className="rating-widget">
      <h3>Rate {pledgedByUsername}</h3>
      <form onSubmit={handleSubmit} className="stacked-form">
        <div className="rating-stars-input">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="star-button"
              onClick={() => setScore(n)}
              aria-label={`${n} stars`}
            >
              <Star size={24} fill={n <= score ? '#a5720a' : 'none'} color="#a5720a" />
            </button>
          ))}
        </div>
        <label>
          Comment (optional)
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
}
