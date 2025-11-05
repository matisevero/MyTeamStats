import React from 'react';

interface ChevronIconProps {
  isExpanded: boolean;
}

export const ChevronIcon: React.FC<ChevronIconProps> = ({ isExpanded }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      color: '#5C6BC0',
      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s ease-in-out',
    }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);