import React from 'react';

export const SparklesIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.84 5.25a.75.75 0 0 1 1.06 0l1.3 1.3a.75.75 0 0 1 0 1.06l-1.3 1.3a.75.75 0 0 1-1.06-1.06l.72-.72-1.02-1.02-.72.72a.75.75 0 0 1-1.06-1.06l1.3-1.3ZM16.3 3.3a.75.75 0 0 1 1.06 0l2.35 2.35a.75.75 0 0 1 0 1.06l-2.35 2.35a.75.75 0 1 1-1.06-1.06l1.77-1.77-1.77-1.77a.75.75 0 0 1 0-1.06ZM13.84 13.25a.75.75 0 0 1 1.06 0l1.3 1.3a.75.75 0 0 1 0 1.06l-1.3 1.3a.75.75 0 0 1-1.06-1.06l.72-.72-1.02-1.02-.72.72a.75.75 0 0 1-1.06-1.06l1.3-1.3Z" />
    <path d="M4.3 13.3a.75.75 0 0 1 1.06 0l2.35 2.35a.75.75 0 0 1 0 1.06l-2.35 2.35a.75.75 0 1 1-1.06-1.06l1.77-1.77-1.77-1.77a.75.75 0 0 1 0-1.06Z" />
  </svg>
);