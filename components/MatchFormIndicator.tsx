import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface MatchFormIndicatorProps {
  form: Array<'VICTORIA' | 'DERROTA' | 'EMPATE'>;
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
};

const MatchFormIndicator: React.FC<MatchFormIndicatorProps> = ({ form }) => {
  const { theme } = useTheme();

  const getResultStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '22px',
      height: '22px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '0.75rem',
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
    };
    switch (result) {
      case 'VICTORIA':
        return { ...baseStyle, color: theme.colors.win };
      case 'DERROTA':
        return { ...baseStyle, color: theme.colors.loss };
      case 'EMPATE':
        return { ...baseStyle, color: theme.colors.draw };
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
  };

  // Reverse the form array to show most recent on the left
  const reversedForm = [...form].reverse();

  return (
    <div style={styles.container}>
      {reversedForm.map((result, index) => (
        <div key={index} style={getResultStyle(result)} title={result}>
          {resultAbbreviations[result]}
        </div>
      ))}
    </div>
  );
};

export default MatchFormIndicator;