import React from 'react';
import { Gift, Heart, Star, Sparkles } from 'lucide-react';

const ICONS = [
  { Icon: Gift, top: '62%', left: '6%', size: 22, delay: '0s' },
  { Icon: Heart, top: '20%', left: '38%', size: 16, delay: '0.8s' },
  { Icon: Star, top: '75%', left: '32%', size: 14, delay: '1.6s' },
  { Icon: Sparkles, top: '38%', left: '20%', size: 18, delay: '1.1s' }
];

export default function FloatingGifts() {
  return (
    <div className="floating-gifts" aria-hidden="true">
      {ICONS.map(({ Icon, top, left, size, delay }, i) => (
        <span key={i} className="floating-gift" style={{ top, left, animationDelay: delay }}>
          <Icon size={size} />
        </span>
      ))}
    </div>
  );
}
