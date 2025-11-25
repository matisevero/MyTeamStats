
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { PlayerPerformance } from '../../types';

interface CardIconProps {
  card?: PlayerPerformance['card'];
  size?: number;
}

export const CardIcon: React.FC<CardIconProps> = ({ card, size = 24 }) => {
  const { theme } = useTheme();

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    card: {
      width: '60%',
      height: '80%',
      borderRadius: '2px',
      position: 'absolute',
      border: `1px solid ${theme.colors.surface}`,
    },
  };

  switch (card) {
    case 'yellow':
      return <div style={styles.container} title="Tarjeta Amarilla"><div style={{...styles.card, backgroundColor: theme.colors.accent3}}></div></div>;
    case 'double_yellow':
      return <div style={styles.container} title="Doble Amarilla (Expulsión)">
        <div style={{...styles.card, backgroundColor: theme.colors.accent3, transform: 'translateX(-20%) rotate(-5deg)'}}></div>
        <div style={{...styles.card, backgroundColor: theme.colors.loss, transform: 'translateX(20%) rotate(10deg)', zIndex: 1}}></div>
      </div>;
    case 'red':
      return <div style={styles.container} title="Tarjeta Roja"><div style={{...styles.card, backgroundColor: theme.colors.loss}}></div></div>;
    case 'blue':
      return <div style={styles.container} title="Tarjeta Azul"><div style={{...styles.card, backgroundColor: theme.colors.accent2}}></div></div>;
    default:
      return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.secondaryText}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            title="Añadir tarjeta"
        >
            <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
            <line x1="12" y1="9" x2="12" y2="15"></line>
            <line x1="9" y1="12" x2="15" y2="12"></line>
        </svg>
      );
  }
};
