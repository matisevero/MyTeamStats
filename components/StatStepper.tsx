
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface StatStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  activeColor: string;
  label: string;
  icon?: React.ReactNode;
}

export const StatStepper: React.FC<StatStepperProps> = ({ value, onChange, activeColor, label, icon }) => {
  const { theme } = useTheme();

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    onChange(value + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(Math.max(0, value - 1));
  };

  const isActive = value > 0;

  return (
    <div style={{ position: 'relative', width: '34px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {value > 0 && (
        <button
          type="button"
          onClick={handleDecrement}
          aria-label={`Reducir ${label}`}
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: theme.colors.loss,
            color: '#fff',
            border: `1px solid ${theme.colors.surface}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 10,
            padding: 0,
            lineHeight: 1,
            boxShadow: theme.shadows.small,
          }}
        >
          -
        </button>
      )}
      <button
        type="button"
        onClick={handleIncrement}
        aria-label={`Aumentar ${label}`}
        title={label}
        style={{
          background: isActive ? `${activeColor}15` : theme.colors.background,
          border: isActive ? `1px solid ${activeColor}` : `1px solid ${theme.colors.borderStrong}`,
          borderRadius: theme.borderRadius.small,
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1px',
          transition: 'all 0.2s ease',
          width: '100%',
          height: '100%',
          color: theme.colors.primaryText,
        }}
      >
        {icon && <span style={{ fontSize: '0.7rem', lineHeight: 1 }}>{icon}</span>}
        <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: isActive ? 700 : 500, 
            color: isActive ? activeColor : theme.colors.secondaryText,
            minWidth: '6px',
            textAlign: 'center'
        }}>
            {value}
        </span>
      </button>
    </div>
  );
};
