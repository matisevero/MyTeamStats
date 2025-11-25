import React, { useState } from 'react';
import type { Match } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { ChevronIcon } from '../../components/icons/ChevronIcon';

interface HistoricalAnalysisProps {
  matches: Match[];
}

interface MonthlyStats {
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  matchCount: number;
  matches: Match[];
}

const monthOrder = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const HistoricalAnalysis: React.FC<HistoricalAnalysisProps> = ({ matches }) => {
  const { theme } = useTheme();
  const { tournamentSettings, setViewingPlayerName } = useData();

  const statsByYearAndMonth = React.useMemo(() => {
    const data: Record<string, Record<string, MonthlyStats>> = {};
    
    matches.forEach(match => {
      const date = new Date(match.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('es-ES', { month: 'long' });
      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
      
      if (!data[year]) data[year] = {};
      if (!data[year][capitalizedMonth]) {
        data[year][capitalizedMonth] = { wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, matchCount: 0, matches: [] };
      }
      
      const stats = data[year][capitalizedMonth];
      stats.matchCount++;
      stats.goals += match.myGoals;
      stats.assists += match.myAssists;
      if (match.result === 'VICTORIA') stats.wins++;
      else if (match.result === 'EMPATE') stats.draws++;
      else if (match.result === 'DERROTA') stats.losses++;
      stats.matches.push(match);
    });

    for (const year in data) {
        for (const month in data[year]) {
            data[year][month].matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
    }

    return data;
  }, [matches]);
  
  const sortedYears = Object.keys(statsByYearAndMonth).sort((a, b) => parseInt(b) - parseInt(a));

  const getInitialState = () => {
    if (sortedYears.length === 0) {
      return { year: null, month: null };
    }
    const latestYear = sortedYears[0];
    const monthsOfLatestYear = Object.keys(statsByYearAndMonth[latestYear]).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    const latestMonth = monthsOfLatestYear.length > 0 ? monthsOfLatestYear[monthsOfLatestYear.length - 1] : null;

    return {
      year: latestYear,
      month: latestMonth ? `${latestYear}-${latestMonth}` : null,
    };
  };

  const initialState = getInitialState();
  const [expandedYear, setExpandedYear] = useState<string | null>(initialState.year);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(initialState.month);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);


  const getResultStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const base = {
        width: '24px', height: '24px', borderRadius: '6px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
        fontWeight: 'bold', flexShrink: 0, color: theme.colors.textOnAccent
    };
    switch (result) {
      case 'VICTORIA': return { ...base, backgroundColor: theme.colors.win };
      case 'DERROTA': return { ...base, backgroundColor: theme.colors.loss };
      case 'EMPATE': return { ...base, backgroundColor: theme.colors.draw };
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    yearContainer: {},
    yearHeader: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: theme.spacing.medium, backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.medium, cursor: 'pointer',
      border: `1px solid ${theme.colors.borderStrong}`,
    },
    yearTitle: { margin: 0, fontSize: theme.typography.fontSize.medium, fontWeight: 600 },
    monthContainer: {
      paddingLeft: theme.spacing.large,
      marginTop: theme.spacing.small,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.small,
    },
    monthHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: theme.spacing.medium, backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.medium, cursor: 'pointer',
        border: `1px solid ${theme.colors.border}`,
    },
    monthTitleContainer: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.5rem',
    },
    monthTitle: { margin: 0, textTransform: 'capitalize' },
    monthSummary: {
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
    },
    matchListContainer: {
        padding: `${theme.spacing.small} ${theme.spacing.medium}`,
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        borderTop: 'none',
        borderRadius: `0 0 ${theme.borderRadius.medium} ${theme.borderRadius.medium}`
    },
    matchRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.medium,
        padding: `${theme.spacing.small} 0`, borderBottom: `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    lastMatchRow: { borderBottom: 'none' },
    matchDate: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, flexShrink: 0 },
    matchInfo: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    matchScore: { color: theme.colors.primaryText, fontWeight: 600 },
    tournamentBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.small,
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.small,
      padding: `2px ${theme.spacing.small}`,
      color: theme.colors.secondaryText,
      fontSize: theme.typography.fontSize.extraSmall,
      fontWeight: 600,
    },
    matchDetailsContainer: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.medium,
        borderBottom: `1px solid ${theme.colors.border}`,
        animation: 'fadeInDown 0.3s ease-out forwards',
    },
    detailsTitle: {
        margin: `0 0 ${theme.spacing.small} 0`,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
        color: theme.colors.secondaryText,
    },
    playerList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.small,
    },
    playerListItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.primaryText,
    },
    playerName: {
        cursor: 'pointer',
    },
    playerStats: {
        display: 'flex',
        gap: theme.spacing.medium,
    },
    noPlayersText: {
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.secondaryText,
        fontStyle: 'italic',
        margin: 0,
    },
  };

  return (
    <>
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in-down {
          animation: fadeInDown 0.3s ease-out forwards;
        }
        .match-row-hover:hover {
          background-color: ${theme.colors.border}20;
        }
      `}</style>
      <div style={styles.container}>
        {sortedYears.map(year => (
          <div key={year} style={styles.yearContainer}>
            <div style={styles.yearHeader} onClick={() => setExpandedYear(expandedYear === year ? null : year)}>
              <h4 style={styles.yearTitle}>{year}</h4>
              <ChevronIcon isExpanded={expandedYear === year} />
            </div>
            {expandedYear === year && (
              <div style={styles.monthContainer} className="fade-in-down">
                {Object.keys(statsByYearAndMonth[year]).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)).reverse().map(month => {
                  const stats = statsByYearAndMonth[year][month];
                  const key = `${year}-${month}`;
                  const isExpanded = expandedMonth === key;

                  const points = stats.wins * 3 + stats.draws;
                  const maxPoints = stats.matchCount * 3;
                  const effectiveness = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
                  
                  let recordColor = theme.colors.draw;
                  if (effectiveness > 50) {
                      recordColor = theme.colors.win;
                  } else if (effectiveness < 50 && maxPoints > 0) {
                      recordColor = theme.colors.loss;
                  }

                  return (
                      <div key={key}>
                          <div style={styles.monthHeader} onClick={() => setExpandedMonth(isExpanded ? null : key)}>
                              <div style={styles.monthTitleContainer}>
                                <h5 style={styles.monthTitle}>{month}</h5>
                                <span style={{...styles.monthSummary, color: recordColor}}>
                                    ({stats.wins}-{stats.draws}-{stats.losses})
                                </span>
                              </div>
                              <ChevronIcon isExpanded={isExpanded} />
                          </div>
                          {isExpanded && stats.matches.length > 0 && (
                              <div style={styles.matchListContainer} className="fade-in-down">
                                  {stats.matches.map((match, index) => {
                                      const tournamentStyle = match.tournament ? tournamentSettings[match.tournament] : null;
                                      const isMatchExpanded = expandedMatchId === match.id;

                                      return (
                                        <React.Fragment key={match.id}>
                                            <div 
                                                style={ index === stats.matches.length - 1 ? {...styles.matchRow, ...styles.lastMatchRow} : styles.matchRow}
                                                className="match-row-hover"
                                                onClick={() => setExpandedMatchId(isMatchExpanded ? null : match.id)}
                                            >
                                                <div style={styles.matchInfo}>
                                                    <span style={styles.matchDate}>{new Date(match.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                                                    <div style={getResultStyle(match.result)}>{match.result.charAt(0)}</div>
                                                    <span style={styles.matchScore}>{`${match.teamScore} - ${match.opponentScore}`}</span>
                                                </div>
                                                {match.tournament && tournamentStyle && (
                                                    <div style={{
                                                        ...styles.tournamentBadge,
                                                        backgroundColor: `${tournamentStyle.color}26`,
                                                        borderColor: `${tournamentStyle.color}80`,
                                                        color: tournamentStyle.color,
                                                    }}>
                                                        <span>{tournamentStyle.icon}</span>
                                                        <span>{match.tournament}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {isMatchExpanded && (
                                                <div style={styles.matchDetailsContainer}>
                                                    <h6 style={styles.detailsTitle}>Alineación y Goleadores</h6>
                                                    {(match.players && match.players.length > 0) ? (
                                                        <ul style={styles.playerList}>
                                                            {match.players.map((player, pIndex) => (
                                                                <li key={pIndex} style={styles.playerListItem}>
                                                                    <span style={styles.playerName} onClick={() => setViewingPlayerName(player.name)}>{player.name}</span>
                                                                    <div style={styles.playerStats}>
                                                                        {player.goals > 0 && <span>⚽️ {player.goals}</span>}
                                                                        {player.assists > 0 && <span>👟 {player.assists}</span>}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p style={styles.noPlayersText}>No se registraron jugadores para este partido.</p>
                                                    )}
                                                </div>
                                            )}
                                        </React.Fragment>
                                      )
                                  })}
                              </div>
                          )}
                      </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default HistoricalAnalysis;