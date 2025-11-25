import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MatchSortByType, TournamentSettings } from '../types';

interface MatchListControlsProps {
  resultFilter: 'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE';
  setResultFilter: (filter: 'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE') => void;
  sortBy: MatchSortByType;
  setSortBy: (sort: MatchSortByType) => void;
  isDesktop: boolean;
  allTournaments: string[];
  tournamentFilter: string;
  setTournamentFilter: (filter: string) => void;
  tournamentSettings: Record<string, TournamentSettings>;
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE' | 'ALL', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
  ALL: 'Todos'
};

const MatchListControls: React.FC<MatchListControlsProps> = ({
  resultFilter,
  setResultFilter,
  sortBy,
  setSortBy,
  isDesktop,
  allTournaments,
  tournamentFilter,
  setTournamentFilter,
  tournamentSettings,
}) => {
  const { theme } = useTheme();

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.small,
      border: `1px solid ${theme.colors.border}`,
      flexDirection: isDesktop ? 'row' : 'column',
    },
    filterGroup: {
      display: 'flex',
      gap: theme.spacing.small,
      alignItems: 'center',
      width: isDesktop ? 'auto' : '100%',
    },
    label: {
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.secondaryText,
      fontWeight: 500,
      flexShrink: 0,
    },
    buttonGroup: {
        display: 'flex',
        flex: 1,
    },
    button: {
      background: 'none',
      border: `1px solid ${theme.colors.borderStrong}`,
      color: theme.colors.secondaryText,
      padding: `${theme.spacing.small} ${theme.spacing.medium}`,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.8rem',
      transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
      flex: 1,
    },
    firstButton: {
        borderRadius: `${theme.borderRadius.medium} 0 0 ${theme.borderRadius.medium}`,
        borderRight: 'none',
    },
    middleButton: {
        borderRadius: 0,
        borderRight: 'none',
    },
    lastButton: {
        borderRadius: `0 ${theme.borderRadius.medium} ${theme.borderRadius.medium} 0`,
    },
    activeButton: {
      backgroundColor: theme.colors.borderStrong,
      color: theme.colors.primaryText,
    },
    select: {
      backgroundColor: theme.colors.background,
      color: theme.colors.primaryText,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.small,
      fontSize: theme.typography.fontSize.small,
      fontWeight: 600,
      cursor: 'pointer',
      flex: 1,
    }
  };
  
  const filterOptions: ('ALL' | 'VICTORIA' | 'EMPATE' | 'DERROTA')[] = ['ALL', 'VICTORIA', 'EMPATE', 'DERROTA'];

  return (
    <div style={styles.container}>
      <div style={styles.filterGroup}>
        <span style={styles.label}>Filtrar:</span>
        <div style={styles.buttonGroup}>
        {filterOptions.map((option, index) => {
          let buttonStyle = styles.button;
          if(index === 0) buttonStyle = {...buttonStyle, ...styles.firstButton};
          else if(index === filterOptions.length -1) buttonStyle = {...buttonStyle, ...styles.lastButton};
          else buttonStyle = {...buttonStyle, ...styles.middleButton};

          return (
          <button
            key={option}
            onClick={() => setResultFilter(option)}
            style={resultFilter === option ? {...buttonStyle, ...styles.activeButton} : buttonStyle}
          >
            {resultAbbreviations[option]}
          </button>
        )})}
        </div>
      </div>
      {allTournaments.length > 0 && (
        <div style={styles.filterGroup}>
          <span style={styles.label}>Torneo:</span>
          <select value={tournamentFilter} onChange={e => setTournamentFilter(e.target.value)} style={styles.select}>
            <option value="ALL">Todos los torneos</option>
            {allTournaments.map(tournament => {
              const style = tournamentSettings[tournament];
              const icon = style ? `${style.icon} ` : '';
              return (
                <option key={tournament} value={tournament}>{icon}{tournament}</option>
              )
            })}
          </select>
        </div>
      )}
      <div style={styles.filterGroup}>
        <span style={styles.label}>Ordenar por:</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as MatchSortByType)} style={styles.select}>
            <option value="date_desc">Más RECIENTES</option>
            <option value="date_asc">Más ANTIGUOS</option>
            <option value="teamScore_desc">Más GOLES A FAVOR</option>
            <option value="teamScore_asc">Menos GOLES A FAVOR</option>
            <option value="opponentScore_desc">Más GOLES EN CONTRA</option>
            <option value="opponentScore_asc">Menos GOLES EN CONTRA</option>
        </select>
      </div>
    </div>
  );
};

export default MatchListControls;