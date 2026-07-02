import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, HeartHandshake, Truck, FilePlus, Search, Handshake, CheckCircle2 } from 'lucide-react';
import Logomark from '../components/Logomark.jsx';
import { getFeaturedRequests } from '../services/publicService';

const HOW_IT_WORKS = [
  { icon: FilePlus, title: 'Post Request', text: "Children's homes post their needs for goods or services" },
  { icon: Search, title: 'Match & Accept', text: 'Donors or service providers review and accept requests' },
  { icon: Handshake, title: 'Coordinate', text: 'Delivery volunteers pick up and transport donations' },
  { icon: CheckCircle2, title: 'Complete', text: 'Delivery confirmed and feedback provided' }
];

function FeaturedCard({ request }) {
  const category = request.requestType === 'GOODS' ? request.goodsCategory : request.serviceCategory;
  return (
    <div className="featured-card">
      <div className="featured-card-header">
        <span className="featured-card-type">
          {request.requestType === 'GOODS' ? <Package size={14} /> : <HeartHandshake size={14} />}
          {request.requestType}
        </span>
        <span className={`urgency-pill urgency-${request.urgency.toLowerCase()}`}>{request.urgency}</span>
      </div>
      <h3>{request.title}</h3>
      <p className="hint-text">{request.childrensHomeName}</p>
      {category && <p className="hint-text">{category.replace('_', ' ')}{request.quantity ? ` × ${request.quantity}` : ''}</p>}
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    getFeaturedRequests().then(setFeatured).catch(() => setFeatured([]));
  }, []);

  return (
    <div className="public-page">
      <header className="public-nav">
        <div className="public-nav-brand">
          <Logomark size={24} />
          <span>Helping Hands</span>
        </div>
        <div className="public-nav-links">
          <Link to="/login">Login / Signup</Link>
        </div>
      </header>

      <section className="public-hero">
        <h1>Connecting Communities Through Compassion</h1>
        <p>
          A platform that coordinates goods, services, and delivery volunteers to support
          children&apos;s homes. Transparent, verified, and accountable at every step.
        </p>
        <div className="public-hero-ctas">
          <Link to="/register" className="btn-primary">
            <Package size={16} /> Donate Goods
          </Link>
          <Link to="/register" className="btn-secondary">
            <HeartHandshake size={16} /> Offer Services
          </Link>
          <Link to="/register" className="btn-secondary">
            <Truck size={16} /> Volunteer for Delivery
          </Link>
        </div>
      </section>

      <section className="public-section">
        <h2>Featured Requests</h2>
        <p className="hint-text">Help fulfil these needs from children&apos;s homes</p>

        {featured === null ? (
          <p className="hint-text">Loading…</p>
        ) : featured.length === 0 ? (
          <p className="hint-text">No open requests right now — check back soon.</p>
        ) : (
          <div className="featured-grid">
            {featured.map((r) => <FeaturedCard key={r.id} request={r} />)}
          </div>
        )}
      </section>

      <section className="public-section public-how-it-works">
        <h2 style={{ textAlign: 'center' }}>How It Works</h2>
        <div className="how-it-works-grid">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="how-it-works-step">
              <div className="how-it-works-icon"><step.icon size={22} /></div>
              <strong>{step.title}</strong>
              <p className="hint-text">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
