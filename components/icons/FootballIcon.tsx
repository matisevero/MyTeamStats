import React from 'react';

export const FootballIcon: React.FC<{ color?: string; size?: number }> = ({ color = '#00E676', size = 32 }) => (
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
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="2" x2="12" y2="22"></line>
    <path d="M12 2a10 10 0 0 0-4.95 1.82"></path>
    <path d="M12 22a10 10 0 0 1-4.95-1.82"></path>
    <path d="M2 12a10 10 0 0 0 1.82 4.95"></path>
    <path d="M22 12a10 10 0 0 1-1.82 4.95"></path>
  </svg>
);