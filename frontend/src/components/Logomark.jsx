import React from 'react';

export default function Logomark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 22c0-3 2-5 5-5s5 2 5 5v6c0 2-1.5 3.5-3.5 3.5S11 30 11 28"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M32 22c0-3-2-5-5-5s-5 2-5 5v6c0 2 1.5 3.5 3.5 3.5S29 30 29 28"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="20" cy="10" r="3.2" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
