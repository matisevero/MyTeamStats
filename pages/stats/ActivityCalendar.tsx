import React, { useState, useMemo } from 'react';
import type { Match } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import Card from '../../components/common/Card';
import YearFilter from '../../components/YearFilter';

interface ActivityCalendarProps {
  matches: Match[];
}

type CalendarView = 'heatmap' | 'summary' | 'log';

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ matches }) => {
  const { theme } = useTheme();
  const { tournamentSettings } = useData();
  
  const years = useMemo(() => {
    const yearSet = new Set(matches.map(m => new Date(m.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [matches]);

  const getInitialYear = () => {
    if (years.length > 0) return years[0].toString();
    return new Date().getFullYear().toString();
  };

  const [selectedYear, setSelectedYear] = useState<string>(getInitialYear());
  const [view, setView] = useState<CalendarView>('heatmap');
  const [highlightedStat, setHighlightedStat] = useState<string | null>(null);
  
  const yearToDisplay = parseInt(selectedYear);

  const statsByMonth = useMemo(() => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthlyData: { month: string; count: number; matches: Match[] }[] = months.map(m => ({
      month: m, count: 0, matches: []
    }));
    matches.forEach(match => {
      const date = new Date(match.date);
      if (date.getFullYear() === yearToDisplay) {
        const monthIndex = date.getMonth();
        monthlyData[monthIndex].count++;
        monthlyData[monthIndex].matches.push(match);
      }
    });
    monthlyData.forEach(monthData => {
        monthData.matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return monthlyData;
  }, [matches, yearToDisplay]);

  const maxCountInMonth = useMemo(() => 
    Math.max(1, ...statsByMonth.map(m => m.count)),
  [statsByMonth]);
  
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
    container: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    viewSwitcher: { display: 'flex', width: '100%' },
    viewButton: {
      background: 'none', border: `1px solid ${theme.colors.borderStrong}`, borderRight: 'none', color: theme.colors.secondaryText,
      padding: `${theme.spacing.small} ${theme.spacing.medium}`, cursor: 'pointer', fontWeight: 600,
      fontSize: '0.8rem', flex: 1, transition: 'background-color 0.2s, color 0.2s',
    },
    viewButtonFirst: { borderRadius: `${theme.borderRadius.medium} 0 0 ${theme.borderRadius.medium}`},
    viewButtonLast: { borderRight: `1px solid ${theme.colors.borderStrong}`, borderRadius: `0 ${theme.borderRadius.medium} ${theme.borderRadius.medium} 0`},
    activeViewButton: { backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText, },
    viewContainer: { width: '100%', minHeight: '150px' },
    barChartContainer: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    barRow: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    monthLabelBar: { flexBasis: '50px', textAlign: 'right', fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText },
    barWrapper: { flex: 1, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.small, height: '24px' },
    bar: { height: '100%', borderRadius: theme.borderRadius.small, transition: 'width 0.5s ease-out', display: 'flex', alignItems: 'center' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small, maxHeight: '400px', overflowY: 'auto', paddingRight: theme.spacing.small },
    monthGroup: {},
    monthHeader: {
        fontSize: theme.typography.fontSize.medium, fontWeight: 700, color: theme.colors.primaryText,
        margin: `0 0 ${theme.spacing.medium} 0`, paddingBottom: theme.spacing.small,
        borderBottom: `2px solid ${theme.colors.border}`,
    },
    matchRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.medium,
        padding: `${theme.spacing.small} 0`, borderBottom: `1px solid ${theme.colors.border}`,
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
  };
  
  const renderActivityGrid = () => {
    const getResultBlockStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
        const baseStyle = { ...activityGridStyles.matchBlock };
        switch (result) {
            case 'VICTORIA': return { ...baseStyle, backgroundColor: theme.colors.win };
            case 'DERROTA': return { ...baseStyle, backgroundColor: theme.colors.loss };
            case 'EMPATE': return { ...baseStyle, backgroundColor: theme.colors.draw };
        }
    };
    
    const activityGridStyles: { [key: string]: React.CSSProperties } = {
        gridContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.small,
        },
        monthRow: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.medium,
        },
        monthLabel: {
            flexBasis: '40px',
            textAlign: 'right',
            fontSize: theme.typography.fontSize.small,
            color: theme.colors.secondaryText,
            flexShrink: 0,
        },
        matchesContainer: {
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            minHeight: '24px',
            alignItems: 'center',
        },
        matchBlock: {
            width: '20px',
            height: '20px',
            borderRadius: theme.borderRadius.small,
            border: `1px solid ${theme.colors.surface}80`,
        },
        noMatchesText: {
            color: theme.colors.secondaryText,
            fontSize: theme.typography.fontSize.small,
            fontStyle: 'italic',
        }
    };

    return (
        <div style={activityGridStyles.gridContainer}>
            {statsByMonth.map(({ month, matches: monthMatches }) => (
                <div key={month} style={activityGridStyles.monthRow}>
                    <span style={activityGridStyles.monthLabel}>{month.substring(0, 3)}.</span>
                    <div style={activityGridStyles.matchesContainer}>
                        {monthMatches.length > 0 ? (
                            monthMatches.map(match => (
                                <div
                                    key={match.id}
                                    style={getResultBlockStyle(match.result)}
                                    title={`Fecha: ${new Date(match.date).toLocaleDateString()}\nResultado: ${match.result}`}
                                ></div>
                            ))
                        ) : (
                            <span style={activityGridStyles.noMatchesText}>-</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const renderSummary = () => {
    const stackedBarSegmentStyle: React.CSSProperties = {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.textOnAccent,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 700,
        overflow: 'hidden',
        transition: 'transform 0.2s ease-out, flex-grow 0.5s ease-out',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        cursor: 'pointer',
    };
    
    const handleHighlight = (key: string) => {
        setHighlightedStat(key);
        setTimeout(() => setHighlightedStat(null), 500);
    };

    return (
        <div style={styles.barChartContainer}>
        {statsByMonth.map(({ month, count, matches: monthMatches }) => {
            const wins = monthMatches.filter(m => m.result === 'VICTORIA').length;
            const draws = monthMatches.filter(m => m.result === 'EMPATE').length;
            const losses = monthMatches.filter(m => m.result === 'DERROTA').length;

            return (
            <div key={month} style={styles.barRow}>
                <span style={styles.monthLabelBar}>{month.substring(0, 3)}.</span>
                <div style={styles.barWrapper}>
                {count > 0 && (
                    <div style={{ ...styles.bar, width: `${(count / maxCountInMonth) * 100}%` }}>
                        {wins > 0 && (
                            <div 
                                style={{ ...stackedBarSegmentStyle, flexGrow: wins, backgroundColor: theme.colors.win, transform: highlightedStat === `${month}-wins` ? 'scale(1.1)' : 'scale(1)' }}
                                onClick={() => handleHighlight(`${month}-wins`)}
                            >
                                {wins > 0 && wins}
                            </div>
                        )}
                        {draws > 0 && (
                            <div 
                                style={{ ...stackedBarSegmentStyle, flexGrow: draws, backgroundColor: theme.colors.draw, transform: highlightedStat === `${month}-draws` ? 'scale(1.1)' : 'scale(1)' }}
                                onClick={() => handleHighlight(`${month}-draws`)}
                            >
                                {draws > 0 && draws}
                            </div>
                        )}
                        {losses > 0 && (
                            <div 
                                style={{ ...stackedBarSegmentStyle, flexGrow: losses, backgroundColor: theme.colors.loss, transform: highlightedStat === `${month}-losses` ? 'scale(1.1)' : 'scale(1)' }}
                                onClick={() => handleHighlight(`${month}-losses`)}
                            >
                                {losses > 0 && losses}
                            </div>
                        )}
                    </div>
                )}
                </div>
            </div>
            );
        })}
        </div>
    );
  };

  const renderLog = () => (
    <div style={styles.listContainer} className="subtle-log-scrollbar">
      {statsByMonth.filter(m => m.count > 0).reverse().map(({ month, matches: monthMatches }) => (
        <div key={month} style={styles.monthGroup}>
          <h4 style={styles.monthHeader}>{month}</h4>
          {monthMatches.reverse().map((match, index) => {
            const tournamentStyle = match.tournament ? tournamentSettings[match.tournament] : null;
            return (
              <div key={match.id} style={ index === monthMatches.length - 1 ? {...styles.matchRow, ...styles.lastMatchRow} : styles.matchRow}>
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
                          <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px'}}>{match.tournament}</span>
                      </div>
                  )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  );

  return (
    <Card title={`Calendario de actividad (${selectedYear})`}>
      <style>{`
        .subtle-log-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .subtle-log-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .subtle-log-scrollbar::-webkit-scrollbar-thumb {
            background-color: ${theme.colors.border};
            border-radius: 10px;
            border: 2px solid ${theme.colors.surface};
        }
        .subtle-log-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: ${theme.colors.border} transparent;
        }
      `}</style>
      <div style={styles.container}>
        <YearFilter years={years} selectedYear={selectedYear} onSelectYear={(year) => setSelectedYear(year as string)} showAllTime={false} />
        <div style={styles.viewSwitcher}>
           <button onClick={() => setView('heatmap')} style={view === 'heatmap' ? {...styles.viewButton, ...styles.viewButtonFirst, ...styles.activeViewButton} : {...styles.viewButton, ...styles.viewButtonFirst}}>Mapa de actividad</button>
           <button onClick={() => setView('summary')} style={view === 'summary' ? {...styles.viewButton, ...styles.activeViewButton} : styles.viewButton}>Resumen mensual</button>
           <button onClick={() => setView('log')} style={view === 'log' ? {...styles.viewButton, ...styles.viewButtonLast, ...styles.activeViewButton} : {...styles.viewButton, ...styles.viewButtonLast}}>Registro anual</button>
        </div>
        <div style={styles.viewContainer}>
          {view === 'heatmap' && renderActivityGrid()}
          {view === 'summary' && renderSummary()}
          {view === 'log' && renderLog()}
        </div>
      </div>
    </Card>
  );
};

export default ActivityCalendar;