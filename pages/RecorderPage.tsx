
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Match, MatchSortByType, PlayerPerformance, Incident, TournamentSettings, PlayerProfileData } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import MatchForm from '../components/MatchForm';
import MatchList from '../components/MatchList';
import MatchListControls from '../components/MatchListControls';

const RecorderPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, addMatch, updateMatch, deleteMatch, updateMatchDetails, isShareMode, tournamentSettings, allPlayers, playerProfiles, userRole } = useData();
  
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [lastAddedMatch, setLastAddedMatch] = useState<Match | null>(null);

  const [resultFilter, setResultFilter] = useState<'ALL' | 'VICTORIA' | 'DERROTA' | 'EMPATE'>('ALL');
  const [sortBy, setSortBy] = useState<MatchSortByType>('date_desc');
  const [tournamentFilter, setTournamentFilter] = useState<string>('ALL');

  const canEdit = ['owner', 'admin', 'editor'].includes(userRole);

  const allTournaments = useMemo(() => {
    const tournaments = new Set<string>();
    matches.forEach(match => {
      if (match.tournament && match.tournament.trim()) {
        tournaments.add(match.tournament.trim());
      }
    });
    return Array.from(tournaments).sort();
  }, [matches]);
  
  const allMyTeamNames = useMemo(() => {
    const names = new Set<string>();
    matches.forEach(match => {
      if (match.teamName && match.teamName.trim()) {
        names.add(match.teamName.trim());
      }
    });
    return Array.from(names).sort();
  }, [matches]);

  const allOpponentNames = useMemo(() => {
    const names = new Set<string>();
    matches.forEach(match => {
      if (match.opponentName && match.opponentName.trim()) {
        names.add(match.opponentName.trim());
      }
    });
    return Array.from(names).sort();
  }, [matches]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const filteredAndSortedMatches = useMemo(() => {
    let processedMatches = [...matches];
    if (resultFilter !== 'ALL') {
      processedMatches = processedMatches.filter(m => m.result === resultFilter);
    }
    if (tournamentFilter !== 'ALL') {
      processedMatches = processedMatches.filter(m => m.tournament === tournamentFilter);
    }
    processedMatches.sort((a, b) => {
      switch (sortBy) {
        case 'teamScore_desc': return b.teamScore - a.teamScore;
        case 'teamScore_asc': return a.teamScore - b.teamScore;
        case 'opponentScore_desc': return b.opponentScore - a.opponentScore;
        case 'opponentScore_asc': return a.opponentScore - b.opponentScore;
        case 'date_asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date_desc': default: return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
    return processedMatches;
  }, [matches, resultFilter, sortBy, tournamentFilter]);

  const handleAddMatch = (newMatchData: Omit<Match, 'id' | 'result' | 'myGoals' | 'myAssists' | 'goalDifference'>) => {
    addMatch(newMatchData).then(newMatch => {
        setLastAddedMatch(newMatch);
    });
  };
  
  const handleUpdateMatch = (updatedMatch: Match) => {
    updateMatch(updatedMatch);
    setEditingMatchId(null);
  };

  const handleDeleteMatch = (matchId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este partido? Esta acción no se puede deshacer.")) {
      deleteMatch(matchId);
    }
  };
  
  const handleStartEdit = (matchId: string) => {
    setEditingMatchId(matchId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingMatchId(null);
  };

  const commonStyles = {
    sectionTitle: {
      fontSize: theme.typography.fontSize.large,
      fontWeight: 700,
      color: theme.colors.primaryText,
      marginBottom: theme.spacing.large,
      borderLeft: `4px solid ${theme.colors.accent1}`,
      paddingLeft: theme.spacing.medium,
    },
    errorText: {
      color: theme.colors.loss,
      textAlign: 'center',
      backgroundColor: `${theme.colors.loss}1A`,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
    },
    controlsContainer: { marginBottom: theme.spacing.large },
  };

  if (isShareMode || !canEdit) {
    const styles = {
      mainContent: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: isDesktop ? `${theme.spacing.extraLarge} ${theme.spacing.medium}` : `${theme.spacing.large} ${theme.spacing.medium}`,
      },
      ...commonStyles
    };

    return (
      <main style={styles.mainContent}>
        <div>
          {error && <p style={styles.errorText} role="alert">{error}</p>}
          <h2 style={styles.sectionTitle}>Historial de partidos</h2>
          <div style={styles.controlsContainer}>
            <MatchListControls
              resultFilter={resultFilter}
              setResultFilter={setResultFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              isDesktop={isDesktop}
              allTournaments={allTournaments}
              tournamentFilter={tournamentFilter}
              setTournamentFilter={setTournamentFilter}
              tournamentSettings={tournamentSettings}
            />
          </div>
          <MatchList 
            matches={filteredAndSortedMatches} 
            allMatches={matches}
            allPlayers={allPlayers}
            allTournaments={allTournaments}
            sortBy={sortBy}
            isReadOnly={true}
          />
        </div>
      </main>
    );
  }

  const styles = {
    mainContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      // Restored standard padding for mobile to align sections
      padding: isDesktop ? `${theme.spacing.extraLarge} ${theme.spacing.medium}` : `${theme.spacing.medium} ${theme.spacing.medium}`,
      display: 'grid',
      gap: isDesktop ? theme.spacing.extraLarge : theme.spacing.medium,
      gridTemplateColumns: isDesktop ? '380px 1fr' : '100%',
      width: '100%',
    },
    formContainer: {
      backgroundColor: theme.colors.surface,
      padding: isDesktop ? theme.spacing.large : theme.spacing.medium,
      borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large,
      border: `1px solid ${theme.colors.border}`,
      alignSelf: 'start',
      transition: 'background-color 0.3s, border-color 0.3s',
      ...(isDesktop && {
        position: 'sticky' as 'sticky',
        top: `calc(65px + ${theme.spacing.extraLarge})`,
      }),
    },
    listContainer: {
      minWidth: 0, // Important for grid items to shrink
    },
    ...commonStyles,
  };

  const matchToEdit = editingMatchId ? matches.find(m => m.id === editingMatchId) ?? null : null;
  const formTitle = matchToEdit ? "Editar partido" : "Registrar partido";

  return (
    <>
      <main style={styles.mainContent}>
        <div style={styles.formContainer}>
          <h2 style={styles.sectionTitle}>{formTitle}</h2>
          <MatchForm 
            onAddMatch={handleAddMatch}
            onUpdateMatch={handleUpdateMatch}
            onCancelEdit={handleCancelEdit}
            matchToEdit={matchToEdit}
            allPlayers={allPlayers}
            allTournaments={allTournaments}
            tournamentSettings={tournamentSettings}
            playerProfiles={playerProfiles}
            allMyTeamNames={allMyTeamNames}
            allOpponentNames={allOpponentNames}
          />
        </div>
        <div style={styles.listContainer}>
          {error && <p style={styles.errorText} role="alert">{error}</p>}
          <h2 style={styles.sectionTitle}>Historial de partidos</h2>
          <div style={styles.controlsContainer}>
            <MatchListControls
              resultFilter={resultFilter}
              setResultFilter={setResultFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              isDesktop={isDesktop}
              allTournaments={allTournaments}
              tournamentFilter={tournamentFilter}
              setTournamentFilter={setTournamentFilter}
              tournamentSettings={tournamentSettings}
            />
          </div>
          <MatchList 
            matches={filteredAndSortedMatches} 
            allMatches={matches}
            allPlayers={allPlayers}
            allTournaments={allTournaments}
            onDeleteMatch={handleDeleteMatch}
            onEditMatch={handleStartEdit}
            onUpdateMatchDetails={updateMatchDetails}
            sortBy={sortBy}
            isReadOnly={isShareMode}
          />
        </div>
      </main>
    </>
  );
};

export default RecorderPage;