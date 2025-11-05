import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { PlayerPerformance } from '../../types';

interface StarterStatusIconProps {
  status: PlayerPerformance['status'];
  size?: number;
}

export const StarterStatusIcon: React.FC<StarterStatusIconProps> = ({ status, size = 16 }) => {
  const { theme } = useTheme();

  const styles: { [key: string]: React.CSSProperties } = {
    icon: {
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      verticalAlign: 'middle',
    }
  };

  if (status === 'goalkeeper') {
    return (
        <span style={{ ...styles.icon, fontSize: size }} role="img" aria-label="Arquero">
            🧤
        </span>
    );
  }

  const isStarter = status === 'starter';

  return (
    <svg style={styles.icon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={theme.colors.secondaryText}
        strokeWidth="2.5" 
        fill={isStarter ? theme.colors.secondaryText : 'transparent'} 
      />
    </svg>
  );
};
