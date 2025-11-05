import React from 'react';

export const AssistIcon: React.FC<{ size?: number, color?: string }> = ({ size = 18, color = '#00B0FF' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21.44 12.35-8.48 8.48A2 2 0 0 1 11.53 22H4a2 2 0 0 1-2-2V8.47a2 2 0 0 1 .53-1.42l8.48-8.48a2 2 0 0 1 2.82 0l6.09 6.09a2 2 0 0 1 0 2.82z" />
    <line x1="16" x2="16" y1="17" y2="14" />
    <line x1="13" x2="13" y1="14" y2="11" />
    <line x1="10" x2="10" y1="11" y2="8" />
  </svg>
);
