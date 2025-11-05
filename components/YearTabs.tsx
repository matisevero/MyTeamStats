import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface YearTabsProps {
  years: number[];
  selectedYear: string | 'all';
  onSelectYear: (year: string | 'all') => void;
}

const YearTabs: React.FC<YearTabsProps> = ({ years, selectedYear, onSelectYear }) => {
  const { theme } = useTheme();

  const allOptions: (string | 'all')[] = ['all', ...years.map(y => y.toString())];

  const styles: { [key: string]: React.CSSProperties } = {
    scrollContainer: {
        width: '100%',
        overflowX: 'auto',
        scrollbarWidth: 'none',
    },
    container: {
      display: 'flex',
      width: 'max-content',
    },
    button: {
      background: 'none',
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRight: 'none',
      color: theme.colors.secondaryText,
      padding: `${theme.spacing.small} ${theme.spacing.medium}`,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.8rem',
      transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
    },
    firstButton: {
      borderRadius: `${theme.borderRadius.medium} 0 0 ${theme.borderRadius.medium}`,
    },
    lastButton: {
      borderRight: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: `0 ${theme.borderRadius.medium} ${theme.borderRadius.medium} 0`,
    },
    activeButton: {
      backgroundColor: theme.colors.borderStrong,
      color: theme.colors.primaryText,
    },
  };

  return (
    <>
        <style>{`
            .year-tabs-scrollbar::-webkit-scrollbar {
                display: none;
            }
        `}</style>
        <div style={styles.scrollContainer} className="year-tabs-scrollbar">
            <div style={styles.container}>
                {allOptions.map((year, index) => {
                let buttonStyle = styles.button;
                if(index === 0) buttonStyle = {...buttonStyle, ...styles.firstButton};
                if(index === allOptions.length -1) buttonStyle = {...buttonStyle, ...styles.lastButton};

                return (
                    <button
                        key={year}
                        onClick={() => onSelectYear(year)}
                        style={selectedYear === year ? {...buttonStyle, ...styles.activeButton} : buttonStyle}
                    >
                        {year === 'all' ? 'Historial Completo' : year}
                    </button>
                );
                })}
            </div>
        </div>
    </>
  );
};

export default YearTabs;
