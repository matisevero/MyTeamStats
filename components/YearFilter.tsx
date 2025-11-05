import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface YearFilterProps {
  years: number[];
  selectedYear: string | 'all';
  onSelectYear: (year: string | 'all') => void;
  showAllTime?: boolean;
  size?: 'small' | 'medium';
  allTimeLabel?: string;
}

const YearFilter: React.FC<YearFilterProps> = ({ years, selectedYear, onSelectYear, showAllTime = true, size = 'medium', allTimeLabel = 'Historial Completo' }) => {
  const { theme } = useTheme();

  const baseSelectStyle: React.CSSProperties = {
      width: '100%',
      backgroundColor: theme.colors.background,
      color: theme.colors.primaryText,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      fontWeight: 600,
      cursor: 'pointer',
      outline: 'none',
      appearance: 'none',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="${encodeURIComponent(theme.colors.secondaryText)}" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')`,
      backgroundRepeat: 'no-repeat',
  };
  
  const sizeStyles: Record<'small' | 'medium', React.CSSProperties> = {
      medium: {
          padding: theme.spacing.medium,
          fontSize: theme.typography.fontSize.medium,
          backgroundPosition: `right ${theme.spacing.medium} center`,
          paddingRight: `calc(1rem + ${theme.spacing.large})`,
      },
      small: {
          height: '38px',
          fontSize: theme.typography.fontSize.small,
          paddingLeft: theme.spacing.medium,
          paddingRight: `calc(1rem + ${theme.spacing.medium})`,
          backgroundPosition: `right ${theme.spacing.small} center`,
      }
  };

  const selectStyle = { ...baseSelectStyle, ...sizeStyles[size] };

  const allOptions = showAllTime ? ['all', ...years] : years;

  return (
    <select 
        value={selectedYear} 
        onChange={e => onSelectYear(e.target.value as 'all' | string)} 
        style={selectStyle}
        aria-label="Seleccionar año"
    >
        {allOptions.map(year => (
            <option key={year} value={year.toString()}>
                {year === 'all' ? allTimeLabel : year}
            </option>
        ))}
    </select>
  );
};

export default YearFilter;