import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  valueStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  count?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, valueStyle = {}, icon, count }) => {
  const { theme } = useTheme();
  const [displayValue, setDisplayValue] = useState<string | number>(typeof value === 'number' ? 0 : value);
  const valueRef = useRef(0);
  const isNumeric = typeof value === 'number';

  useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(value);
      return;
    }

    const targetValue = value;
    const startValue = valueRef.current;
    valueRef.current = targetValue;

    const duration = 1000; // 1 second animation
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      const animatedValue = Math.floor(startValue + (targetValue - startValue) * percentage);
      setDisplayValue(animatedValue);

      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

  }, [value, isNumeric]);

  const styles: { [key: string]: React.CSSProperties } = {
    card: {
      backgroundColor: theme.colors.background,
      padding: '1rem',
      borderRadius: '12px',
      border: `1px solid ${theme.colors.borderStrong}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: '0.25rem',
    },
    valueContainer: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: '0.5rem',
      width: '100%',
    },
    value: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: theme.colors.primaryText,
      lineHeight: 1.1,
    },
    countBadge: {
      backgroundColor: theme.colors.border,
      color: theme.colors.secondaryText,
      padding: '2px 6px',
      borderRadius: theme.borderRadius.small,
      fontSize: '0.75rem',
      fontWeight: 700,
    },
    labelContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: theme.colors.secondaryText
    },
    label: {
      fontSize: '0.8rem',
      fontWeight: 500,
    },
  };

  return (
    <div style={styles.card}>
       <div style={styles.valueContainer}>
        <span style={{...styles.value, ...valueStyle}}>{isNumeric ? displayValue : value}</span>
        {count && count > 1 && <span style={styles.countBadge}>x{count}</span>}
      </div>
      <div style={styles.labelContainer}>
        {icon}
        <span style={styles.label}>{label}</span>
      </div>
    </div>
  );
};

export default StatCard;