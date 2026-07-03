import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, HeartHandshake, Truck, FilePlus, Search, Handshake, CheckCircle2, LogIn,
  ShieldCheck, Eye, Users, TrendingUp, Gift, ArrowRight, Home as HomeIcon
} from 'lucide-react';
import Logomark from '../components/Logomark.jsx';
import HeroNetwork from '../components/HeroNetwork.jsx';
import FloatingGifts from '../components/FloatingGifts.jsx';
import { getFeaturedRequests, getImpactStats } from '../services/publicService';

const HOW_IT_WORKS = [
  { icon: FilePlus, title: 'Post Request', text: "Children's homes post their needs for goods or services" },
  { icon: Search, title: 'Match & Accept', text: 'Donors or service providers review and accept requests' },
  { icon: Handshake, title: 'Coordinate', text: 'Delivery volunteers pick up and transport donations' },
  { icon: CheckCircle2, title: 'Complete', text: 'Delivery confirmed and feedback provided' }
];

/**
 * Rounds DOWN to a tidy display threshold (5+, 10+, 100+, 1k+) rather than
 * showing a raw count — professional and never overstates, since flooring
 * can only ever understate reality, never inflate it. Small numbers (<5)
 * are shown exactly rather than rounded, since "0+" or "2+" would look odd
 * and there's nothing to round meaningfully yet.
 */
function formatImpactCount(count) {
  if (count < 5) return String(count);
  if (count < 100) return `${Math.floor(count / 5) * 5}+`;
  if (count < 1000) return `${Math.floor(count / 100) * 100}+`;
  return `${Math.floor(count / 1000)}k+`;
}

const IMPACT_STAT_CONFIG = [
  { key: 'donors', label: 'Donors', icon: Users },
  { key: 'deliveryVolunteers', label: 'Delivery Volunteers', icon: Truck },
  { key: 'verifiedHomes', label: 'Verified Homes', icon: HomeIcon },
  { key: 'completedRequests', label: 'Requests Fulfilled', icon: CheckCircle2 }
];

function ImpactStatsSection() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getImpactStats().then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats) return null;

  // If the platform is brand new (nothing fulfilled yet), a stats bar of
  // zeros undercuts trust rather than building it — better to say nothing
  // than to visibly show "0 Requests Fulfilled" on a trust-focused section.
  const total = Object.values(stats).reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;

  return (
    <section className="impact-stats-section">
      <div className="public-container impact-stats-grid">
        {IMPACT_STAT_CONFIG.map(({ key, label, icon: Icon }) => (
          <div key={key} className="impact-stat">
            <div className="impact-stat-icon"><Icon size={20} /></div>
            <div className="impact-stat-value">{formatImpactCount(stats[key])}</div>
            <div className="impact-stat-label">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const WHY_US = [
  {
    icon: ShieldCheck, tint: 'rgba(31, 111, 80, 0.1)', color: '#1f6f50',
    title: 'Verified & Safe', text: "Every children's home is government-registered and verified before it can post a single request."
  },
  {
    icon: Eye, tint: 'rgba(165, 114, 10, 0.1)', color: '#a5720a',
    title: 'Fully Transparent', text: 'Track every donation from pledge to delivery, with a complete status history you can see.'
  },
  {
    icon: Users, tint: 'rgba(58, 90, 140, 0.1)', color: '#3a5a8c',
    title: 'Background-Checked Providers', text: 'Service providers with direct child contact require verified police clearance — no exceptions.'
  },
  {
    icon: TrendingUp, tint: 'rgba(179, 38, 30, 0.08)', color: '#b3261e',
    title: 'Real, Tracked Impact', text: 'Reputation scores and completion tracking mean reliability is rewarded, not assumed.'
  }
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
        <div className="public-container public-nav-inner">
          <div className="public-nav-brand">
            <Logomark size={24} />
            <span>Helping Hands</span>
          </div>
          <Link to="/login" className="btn-nav-cta">
            <LogIn size={16} />
            Login / Signup
          </Link>
        </div>
      </header>

      <section className="public-hero">
        <HeroNetwork />
        <FloatingGifts />
        <div className="public-container public-hero-inner">
          <h1>Connecting Communities Through Compassion</h1>
          <p>
            A platform that coordinates goods, services, and delivery volunteers to support
            children&apos;s homes. Transparent, verified, and accountable at every step.
          </p>
          <div className="public-hero-ctas">
            <Link to="/register?role=DONOR" className="btn-primary">
              <Package size={16} /> Donate Goods
            </Link>
            <Link to="/register?role=SERVICE_PROVIDER" className="btn-secondary">
              <HeartHandshake size={16} /> Offer Services
            </Link>
            <Link to="/register?role=DELIVERY_VOLUNTEER" className="btn-secondary">
              <Truck size={16} /> Volunteer for Delivery
            </Link>
          </div>
          <div className="trust-badges">
            <span className="trust-badge"><ShieldCheck size={13} /> Verified Homes Only</span>
            <span className="trust-badge"><Eye size={13} /> Full Transparency</span>
            <span className="trust-badge"><Gift size={13} /> No Money Involved — Direct Help</span>
          </div>
        </div>
      </section>

      <ImpactStatsSection />

      <section className="public-section">
        <div className="public-container">
          <h2>Why Helping Hands</h2>
          <p className="hint-text">Built around child safety and trust, not just convenience.</p>
          <div className="why-us-grid">
            {WHY_US.map((item, i) => (
              <div key={i} className="why-us-card">
                <div className="why-us-icon" style={{ background: item.tint, color: item.color }}>
                  <item.icon size={22} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <h2>Featured Requests</h2>
          <p className="hint-text">Help fulfil these needs from children&apos;s homes</p>

          {featured === null ? (
            <p className="hint-text">Loading…</p>
          ) : featured.length === 0 ? (
            <div className="featured-empty">
              <div className="featured-empty-icon"><Gift size={26} /></div>
              <p className="hint-text">No open requests right now — check back soon.</p>
            </div>
          ) : (
            <div className="featured-grid">
              {featured.map((r) => <FeaturedCard key={r.id} request={r} />)}
            </div>
          )}
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="public-how-it-works">
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
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <div className="closing-cta">
            <h2>Ready to make a difference?</h2>
            <p>Join donors, service providers, and delivery volunteers already supporting verified children&apos;s homes.</p>
            <div className="closing-cta-ctas">
              <Link to="/register" className="btn-primary">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn-secondary">
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="public-footer">
        <div className="public-container public-footer-inner">
          <div className="public-footer-brand">
            <Logomark size={20} />
            <div>
              <div>Helping Hands</div>
              <div className="public-footer-tagline">Connecting communities through compassion.</div>
            </div>
          </div>
          <div className="public-footer-meta">
            © {new Date().getFullYear()} Helping Hands. Built for verified, transparent giving.
          </div>
        </div>
      </footer>
    </div>
  );
}
