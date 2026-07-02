import React from 'react';

/**
 * Purely decorative — a loose network of linked nodes that drift and pulse
 * softly, standing in for "connecting communities" without being a literal
 * illustration. Respects prefers-reduced-motion via the CSS (see
 * .hero-network in index.css) rather than JS, so it degrades to a static
 * graphic automatically.
 */
const NODES = [
  { x: 60, y: 40, r: 5, delay: 0 },
  { x: 160, y: 90, r: 7, delay: 0.6 },
  { x: 90, y: 160, r: 4, delay: 1.1 },
  { x: 220, y: 40, r: 4, delay: 0.3 },
  { x: 260, y: 140, r: 6, delay: 0.9 },
  { x: 320, y: 80, r: 5, delay: 1.4 },
  { x: 30, y: 120, r: 3, delay: 1.7 },
  { x: 190, y: 200, r: 4, delay: 0.5 }
];

const LINKS = [
  [0, 1], [1, 2], [1, 3], [3, 5], [4, 5], [2, 6], [1, 4], [4, 7]
];

export default function HeroNetwork() {
  return (
    <svg className="hero-network" viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {LINKS.map(([a, b], i) => (
        <line
          key={i}
          x1={NODES[a].x} y1={NODES[a].y}
          x2={NODES[b].x} y2={NODES[b].y}
          className="hero-network-link"
          style={{ animationDelay: `${(i % 5) * 0.4}s` }}
        />
      ))}
      {NODES.map((n, i) => (
        <circle
          key={i}
          cx={n.x} cy={n.y} r={n.r}
          className="hero-network-node"
          style={{ animationDelay: `${n.delay}s` }}
        />
      ))}
    </svg>
  );
}
