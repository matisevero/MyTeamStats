import React from 'react';

export const GoalIcon: React.FC<{ size?: number, color?: string }> = ({ size = 18, color = '#00E676' }) => (
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
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 0-4.95 1.82" />
    <path d="M22 12a10 10 0 0 1-1.82 4.95" />
    <path d="M12 22a10 10 0 0 1-4.95-1.82" />
    <path d="M2 12a10 10 0 0 0 1.82 4.95" />
  </svg>
);
