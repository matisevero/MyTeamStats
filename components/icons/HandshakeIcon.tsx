import React from 'react';

export const HandshakeIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
    <path d="m5 15 2 2" />
    <path d="M22 12v2a2 2 0 0 1-2 2H7l-2 2-4-4 4-4 2 2h3.5a2 2 0 0 1 2 2V8" />
    <path d="M17 5 15 3" />
    <path d="M2 12v-2a2 2 0 0 1 2-2h13l2-2 4 4-4 4-2-2H8.5a2 2 0 0 1-2-2V8" />
  </svg>
);