import React from 'react';
import type { Match, PlayerPerformance, Incident } from '../types';
import { MatchSortByType } from '../types';
import MatchCard from './MatchCard';
import { FootballIcon } from './icons/FootballIcon';
import { useTheme } from '../contexts/ThemeContext';

interface MatchListProps {
  matches: Match[];
  allMatches: Match[];
  allPlayers: string[];
  allTournaments: string[];
  onDeleteMatch?: (matchId: string) => void;
  onEditMatch?: (matchId: string) => void;
  onUpdateMatchDetails?: (matchId: string, players: PlayerPerformance[], tournament: string, incidents: Incident[]) => void;
  isReadOnly?: boolean;
  sortBy?: MatchSortByType;
}

const MatchList: React.FC<MatchListProps> = ({ matches, allMatches, allPlayers, allTournaments, onDeleteMatch, onEditMatch, onUpdateMatchDetails, isReadOnly = false, sortBy }) => {
  const { theme } = useTheme();

  const styles: { [key: string]: React.CSSProperties } = {
    list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    emptyState: {
      textAlign: 'center', padding: '3rem 2rem', backgroundColor: theme.colors.surface,
      borderRadius: '12px', border: `1px dashed ${theme.colors.border}`, color: theme.colors.secondaryText,
    },
    emptyStateIcon: { marginBottom: '1rem' },
    emptyStateTitle: { margin: '0 0 0.5rem 0', color: theme.colors.primaryText, fontSize: '1.25rem' },
    emptyStateText: { margin: 0, fontSize: '0.9rem' }
  };
  
  if (matches.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}><FootballIcon color={theme.colors.secondaryText} /></div>
        <h3 style={styles.emptyStateTitle}>No se encontraron partidos</h3>
        <p style={styles.emptyStateText}>Prueba de cambiar los filtros o añade un nuevo partido para empezar.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .match-card-enter {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0; /* Start hidden */
        }
      `}</style>
      <div style={styles.list}>
        {matches.map((match, index) => (
          <div 
            key={match.id} 
            className="match-card-enter" 
            style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
          >
            <MatchCard 
              match={match} 
              allMatches={allMatches}
              allPlayers={allPlayers}
              allTournaments={allTournaments}
              onDelete={onDeleteMatch ? () => onDeleteMatch(match.id) : undefined}
              onEdit={onEditMatch ? () => onEditMatch(match.id) : undefined}
              onUpdateMatchDetails={onUpdateMatchDetails}
              isReadOnly={isReadOnly}
              sortBy={sortBy}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default MatchList;