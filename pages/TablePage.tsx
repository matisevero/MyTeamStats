
import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { TableIcon } from '../components/icons/TableIcon';
import RadarChart from '../components/charts/RadarChart';
import Card from '../components/common/Card';
import OpponentDetailModal from '../components/modals/OpponentDetailModal';

interface YearlyStats {
  year: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface TournamentStats {
  tournament: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface OpponentStats {
  opponent: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  effectiveness: number;
}

const radarMetrics: { label: string; key: keyof YearlyStats }[] = [
    { label: 'Pts', key: 'points' },
    { label: 'PJ', key: 'matchesPlayed' },
    { label: 'V', key: 'wins' },
    { label: 'GF', key: 'goalsFor' },
    { label: 'GC', key: 'goalsAgainst' },
    { label: 'DG', key: 'goalDifference' },
];

const TablePage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, activeTeams } = useData();
  const [sortConfig, setSortConfig] = useState<{ key: keyof YearlyStats; direction: 'asc' | 'desc' }>({ key: 'year', direction: 'desc' });
  const [tournamentSortConfig, setTournamentSortConfig] = useState<{ key: keyof TournamentStats; direction: 'asc' | 'desc' }>({ key: 'points', direction: 'desc' });
  const [opponentSortConfig, setOpponentSortConfig] = useState<{ key: keyof OpponentStats; direction: 'asc' | 'desc' }>({ key: 'matchesPlayed', direction: 'desc' });
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  
  const [visibleYears, setVisibleYears] = useState<Set<number>>(new Set());
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const relevantMatches = useMemo(() => {
    if (selectedTeam === 'all') {
        return matches.filter(m => activeTeams.includes(m.teamName));
    }
    return matches.filter(m => m.teamName === selectedTeam);
  }, [matches, selectedTeam, activeTeams]);

  const yearlyData = useMemo(() => {
    const statsByYear: Record<number, Omit<YearlyStats, 'year' | 'goalDifference'>> = {};

    relevantMatches.forEach(match => {
      const year = new Date(match.date).getFullYear();
      if (!statsByYear[year]) {
        statsByYear[year] = {
          matchesPlayed: 0, wins: 0, draws: 0, losses: 0, points: 0,
          goalsFor: 0, goalsAgainst: 0,
        };
      }

      const yearStats = statsByYear[year];
      yearStats.matchesPlayed++;
      if (match.result === 'VICTORIA') {
        yearStats.wins++;
        yearStats.points += 3;
      } else if (match.result === 'EMPATE') {
        yearStats.draws++;
        yearStats.points += 1;
      } else {
        yearStats.losses++;
      }
      yearStats.goalsFor += match.teamScore;
      yearStats.goalsAgainst += match.opponentScore;
    });

    return Object.entries(statsByYear).map(([year, stats]) => {
      const { goalsFor, goalsAgainst } = stats;
      return {
        ...stats,
        year: Number(year),
        goalDifference: goalsFor - goalsAgainst,
      };
    });
  }, [relevantMatches]);
  
  const tournamentData = useMemo(() => {
    const statsByTournament: Record<string, Omit<TournamentStats, 'tournament' | 'goalDifference'>> = {};

    relevantMatches.forEach(match => {
        const tournament = match.tournament || 'Sin Torneo';
        if (!statsByTournament[tournament]) {
            statsByTournament[tournament] = {
                matchesPlayed: 0, wins: 0, draws: 0, losses: 0, points: 0,
                goalsFor: 0, goalsAgainst: 0,
            };
        }

        const tournamentStats = statsByTournament[tournament];
        tournamentStats.matchesPlayed++;
        if (match.result === 'VICTORIA') {
            tournamentStats.wins++;
            tournamentStats.points += 3;
        } else if (match.result === 'EMPATE') {
            tournamentStats.draws++;
            tournamentStats.points += 1;
        } else {
            tournamentStats.losses++;
        }
        tournamentStats.goalsFor += match.teamScore;
        tournamentStats.goalsAgainst += match.opponentScore;
    });

    return Object.entries(statsByTournament).map(([tournament, stats]) => {
        const { goalsFor, goalsAgainst } = stats;
        return {
            ...stats,
            tournament: tournament,
            goalDifference: goalsFor - goalsAgainst,
        };
    });
  }, [relevantMatches]);

  const opponentData = useMemo(() => {
    const statsByOpponent: Record<string, Omit<OpponentStats, 'opponent' | 'goalDifference' | 'effectiveness'>> = {};

    relevantMatches.forEach(match => {
        const opponent = match.opponentName || 'Desconocido';
        if (!statsByOpponent[opponent]) {
            statsByOpponent[opponent] = {
                matchesPlayed: 0, wins: 0, draws: 0, losses: 0, points: 0,
                goalsFor: 0, goalsAgainst: 0,
            };
        }

        const oppStats = statsByOpponent[opponent];
        oppStats.matchesPlayed++;
        if (match.result === 'VICTORIA') {
            oppStats.wins++;
            oppStats.points += 3;
        } else if (match.result === 'EMPATE') {
            oppStats.draws++;
            oppStats.points += 1;
        } else {
            oppStats.losses++;
        }
        oppStats.goalsFor += match.teamScore;
        oppStats.goalsAgainst += match.opponentScore;
    });

    return Object.entries(statsByOpponent).map(([opponent, stats]) => {
        const { goalsFor, goalsAgainst, points, matchesPlayed } = stats;
        const maxPoints = matchesPlayed * 3;
        return {
            ...stats,
            opponent: opponent,
            goalDifference: goalsFor - goalsAgainst,
            effectiveness: maxPoints > 0 ? (points / maxPoints) * 100 : 0
        };
    });
  }, [relevantMatches]);

  const maxValues = useMemo(() => {
    if (yearlyData.length === 0) return {};
    const maxes: Partial<Record<keyof YearlyStats, number>> = {};
    const keysToCompare: (keyof YearlyStats)[] = ['points', 'matchesPlayed', 'wins', 'draws', 'goalsFor', 'goalDifference'];
    keysToCompare.forEach(key => { maxes[key] = Math.max(...yearlyData.map(d => d[key])); });
    return maxes;
  }, [yearlyData]);

  const minValues = useMemo(() => {
    if (yearlyData.length === 0) return {};
    const mins: Partial<Record<keyof YearlyStats, number>> = {};
    const keysToCompare: (keyof YearlyStats)[] = ['losses', 'goalsAgainst'];
    keysToCompare.forEach(key => { mins[key] = Math.min(...yearlyData.map(d => d[key])); });
    return mins;
  }, [yearlyData]);
  
  useEffect(() => {
    if (yearlyData.length > 0) {
      setVisibleYears(new Set(yearlyData.map(d => d.year)));
    }
  }, [yearlyData]);

  const sortedYearlyData = useMemo(() => {
    return [...yearlyData].sort((a, b) => {
      const aVal = a[sortConfig.key] as number;
      const bVal = b[sortConfig.key] as number;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [yearlyData, sortConfig]);
  
  const sortedTournamentData = useMemo(() => {
    return [...tournamentData].sort((a, b) => {
        if (tournamentSortConfig.key === 'tournament') {
            return tournamentSortConfig.direction === 'asc' ? a.tournament.localeCompare(b.tournament) : b.tournament.localeCompare(a.tournament);
        }
        const aVal = a[tournamentSortConfig.key] as number;
        const bVal = b[tournamentSortConfig.key] as number;
        if (aVal < bVal) return tournamentSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return tournamentSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [tournamentData, tournamentSortConfig]);

  const sortedOpponentData = useMemo(() => {
    return [...opponentData].sort((a, b) => {
        if (opponentSortConfig.key === 'opponent') {
            return opponentSortConfig.direction === 'asc' ? a.opponent.localeCompare(b.opponent) : b.opponent.localeCompare(a.opponent);
        }
        const aVal = a[opponentSortConfig.key] as number;
        const bVal = b[opponentSortConfig.key] as number;
        if (aVal < bVal) return opponentSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return opponentSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [opponentData, opponentSortConfig]);

  const requestSort = (key: keyof YearlyStats) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') { direction = 'asc'; }
    setSortConfig({ key, direction });
  };
  
  const requestTournamentSort = (key: keyof TournamentStats) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (tournamentSortConfig.key === key && tournamentSortConfig.direction === 'desc') { direction = 'asc'; }
    setTournamentSortConfig({ key, direction });
  };

  const requestOpponentSort = (key: keyof OpponentStats) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (opponentSortConfig.key === key && opponentSortConfig.direction === 'desc') { direction = 'asc'; }
    setOpponentSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof YearlyStats) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'desc' ? ' ↓' : ' ↑';
  };
  
  const getTournamentSortIndicator = (key: keyof TournamentStats) => {
    if (tournamentSortConfig.key !== key) return null;
    return tournamentSortConfig.direction === 'desc' ? ' ↓' : ' ↑';
  };

  const getOpponentSortIndicator = (key: keyof OpponentStats) => {
    if (opponentSortConfig.key !== key) return null;
    return opponentSortConfig.direction === 'desc' ? ' ↓' : ' ↑';
  };
  
  const historicalMaxValuesForRadar = useMemo(() => {
    if (yearlyData.length === 0) { return radarMetrics.map(() => 1); }
    return radarMetrics.map(metric => {
      if (metric.key === 'points' || metric.key === 'wins') {
        return 100; // These are now percentages
      }
      return Math.max(...yearlyData.map(y => Math.abs(y[metric.key] as number)), 1);
    });
  }, [yearlyData]);
  
  const radarChartData = useMemo(() => {
    if (yearlyData.length === 0) return [];
    const colors = [theme.colors.accent1, theme.colors.accent2, theme.colors.accent3, theme.colors.win, theme.colors.draw, '#FF7043', '#7E57C2', '#26A69A'];
    const sortedVisibleData = [...yearlyData].sort((a,b) => b.year - a.year);
    const currentYear = new Date().getFullYear();
    
    const maxGC = historicalMaxValuesForRadar[radarMetrics.findIndex(m => m.key === 'goalsAgainst')];

    return sortedVisibleData
      .filter(yearStat => visibleYears.has(yearStat.year))
      .map((yearStat, index) => ({
        name: yearStat.year.toString(),
        color: colors[index % colors.length],
        isDashed: yearStat.year === currentYear,
        data: radarMetrics.map(metric => {
            let value: number;
            const matchesPlayed = yearStat.matchesPlayed > 0 ? yearStat.matchesPlayed : 1;

            switch(metric.key) {
                case 'points':
                    value = (yearStat.points / (matchesPlayed * 3)) * 100;
                    break;
                case 'wins':
                    value = (yearStat.wins / matchesPlayed) * 100;
                    break;
                case 'goalsAgainst':
                    value = Math.max(0, maxGC - (yearStat[metric.key] as number));
                    break;
                default:
                    value = yearStat[metric.key] as number;
            }
            return { label: metric.label, value: value };
        }),
      }));
  }, [yearlyData, visibleYears, theme.colors, historicalMaxValuesForRadar]);
  
  const toggleYearVisibility = (year: number) => {
    setVisibleYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) newSet.delete(year);
      else newSet.add(year);
      return newSet;
    });
  };

  const headers: { key: keyof YearlyStats; label: string; isNumeric: boolean }[] = [ { key: 'year', label: 'Año', isNumeric: true }, { key: 'points', label: 'Pts', isNumeric: true }, { key: 'matchesPlayed', label: 'PJ', isNumeric: true }, { key: 'wins', label: 'V', isNumeric: true }, { key: 'draws', label: 'E', isNumeric: true }, { key: 'losses', label: 'D', isNumeric: true }, { key: 'goalsFor', label: 'GF', isNumeric: true }, { key: 'goalsAgainst', label: 'GC', isNumeric: true }, { key: 'goalDifference', label: 'DG', isNumeric: true }];
  const tournamentHeaders: { key: keyof TournamentStats; label: string; isNumeric: boolean }[] = [ { key: 'tournament', label: 'Torneo', isNumeric: false }, { key: 'points', label: 'Pts', isNumeric: true }, { key: 'matchesPlayed', label: 'PJ', isNumeric: true }, { key: 'wins', label: 'V', isNumeric: true }, { key: 'draws', label: 'E', isNumeric: true }, { key: 'losses', label: 'D', isNumeric: true }, { key: 'goalsFor', label: 'GF', isNumeric: true }, { key: 'goalsAgainst', label: 'GC', isNumeric: true }, { key: 'goalDifference', label: 'DG', isNumeric: true }];
  const opponentHeaders: { key: keyof OpponentStats; label: string; isNumeric: boolean }[] = [ { key: 'opponent', label: 'Rival', isNumeric: false }, { key: 'matchesPlayed', label: 'PJ', isNumeric: true }, { key: 'wins', label: 'V', isNumeric: true }, { key: 'draws', label: 'E', isNumeric: true }, { key: 'losses', label: 'D', isNumeric: true }, { key: 'goalsFor', label: 'GF', isNumeric: true }, { key: 'goalsAgainst', label: 'GC', isNumeric: true }, { key: 'effectiveness', label: '% Efect.', isNumeric: true }];

  const getCellStyling = (stats: YearlyStats, key: keyof YearlyStats): React.CSSProperties => {
    const value = stats[key];
    const isPositiveMax = ['points', 'wins', 'goalsFor', 'goalDifference'].includes(key);
    const isNegativeMin = ['losses', 'goalsAgainst'].includes(key);
    if (isPositiveMax && value === maxValues[key] && value > 0) { return { fontWeight: 700, color: theme.colors.win }; }
    if (isNegativeMin && value === minValues[key]) { return { fontWeight: 700, color: theme.colors.win }; }
    return {};
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.large,
        flexWrap: 'wrap',
    },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium },
    filterContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.medium,
        flex: 1,
        maxWidth: '400px',
        minWidth: '250px',
    },
    filterLabel: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, fontWeight: 500 },
    filterSelect: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        color: theme.colors.primaryText,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.small,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
        cursor: 'pointer',
    },
    tableWrapper: { overflowX: 'auto', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.medium },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: `${theme.spacing.small} ${theme.spacing.medium}`, textAlign: 'left', fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 600, borderBottom: `2px solid ${theme.colors.borderStrong}`, cursor: 'pointer', whiteSpace: 'nowrap' },
    tr: { transition: 'background-color 0.2s' },
    td: { padding: `${theme.spacing.medium}`, fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, borderBottom: `1px solid ${theme.colors.border}`, whiteSpace: 'nowrap' },
    stickyColumn: { position: 'sticky', left: 0, backgroundColor: theme.colors.surface, borderRight: `1px solid ${theme.colors.borderStrong}`, zIndex: 1 },
    numeric: { textAlign: 'right' },
    noDataContainer: { textAlign: 'center', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, color: theme.colors.secondaryText, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}` },
    chartAndLegendContainer: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large, alignItems: 'center', },
    legendContainer: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing.small, },
    legendButton: { background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.medium, padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: theme.spacing.small, fontSize: theme.typography.fontSize.small, transition: 'all 0.2s ease', },
    legendColorBox: { width: '12px', height: '12px', borderRadius: '3px' },
    sectionTitle: { fontSize: theme.typography.fontSize.large, fontWeight: 600, color: theme.colors.primaryText, marginBottom: 0, marginTop: theme.spacing.large },
    desktopGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.extraLarge, alignItems: 'start' },
    column: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    clickableRow: { cursor: 'pointer' }
  };

  if (matches.length === 0) {
    return (
        <main style={styles.container}>
            <h2 style={styles.pageTitle}>Historial y Rendimiento</h2>
            <div style={styles.noDataContainer}>
                <TableIcon size={40} color={theme.colors.secondaryText} />
                <p style={{ marginTop: theme.spacing.medium }}>No hay partidos registrados para mostrar en la tabla.</p>
            </div>
        </main>
    )
  }

  const RadarChartComponent = yearlyData.length > 0 && (
    <Card>
        <div style={styles.chartAndLegendContainer}>
            <RadarChart 
                playersData={radarChartData} 
                size={350} 
                showLegend={false}
                maxValues={historicalMaxValuesForRadar}
            />
            <div style={styles.legendContainer}>
                {yearlyData.sort((a,b) => b.year - a.year).map((yearStat) => {
                    const isVisible = visibleYears.has(yearStat.year);
                    const color = radarChartData.find(d => d.name === yearStat.year.toString())?.color || theme.colors.secondaryText;
                    return (
                        <button key={yearStat.year} onClick={() => toggleYearVisibility(yearStat.year)} style={{...styles.legendButton, color: isVisible ? theme.colors.primaryText : theme.colors.secondaryText, opacity: isVisible ? 1 : 0.6 }}>
                            <span style={{...styles.legendColorBox, backgroundColor: color }}></span>
                            {yearStat.year}
                        </button>
                    );
                })}
            </div>
        </div>
    </Card>
  );

  const YearlyTableComponent = (
    <>
      <h3 style={styles.sectionTitle}>Rendimiento Anual</h3>
      <div style={styles.tableWrapper} className="subtle-scrollbar">
        <table style={styles.table}>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={header.key} style={{...styles.th, ...(header.isNumeric && styles.numeric), ...(index === 0 && styles.stickyColumn) }} className={index === 0 ? 'sticky-column' : ''} onClick={() => requestSort(header.key)}>
                  {header.label}
                  {getSortIndicator(header.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedYearlyData.map(stats => (
              <tr key={stats.year} style={styles.tr} className="table-row">
                <td style={{...styles.td, ...styles.numeric, fontWeight: 700, ...styles.stickyColumn}} className="sticky-column">{stats.year}</td>
                <td style={{...styles.td, ...styles.numeric, fontWeight: 700, ...getCellStyling(stats, 'points')}}>{stats.points}</td>
                <td style={{...styles.td, ...styles.numeric, ...getCellStyling(stats, 'matchesPlayed')}}>{stats.matchesPlayed}</td>
                <td style={{...styles.td, ...styles.numeric, ...getCellStyling(stats, 'wins')}}>{stats.wins}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.draws}</td>
                <td style={{...styles.td, ...styles.numeric, ...getCellStyling(stats, 'losses')}}>{stats.losses}</td>
                <td style={{...styles.td, ...styles.numeric, ...getCellStyling(stats, 'goalsFor')}}>{stats.goalsFor}</td>
                <td style={{...styles.td, ...styles.numeric, ...getCellStyling(stats, 'goalsAgainst')}}>{stats.goalsAgainst}</td>
                <td style={{...styles.td, ...styles.numeric, ...getCellStyling(stats, 'goalDifference')}}>{stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const TournamentTableComponent = tournamentData.length > 0 && (
    <>
      <h3 style={styles.sectionTitle}>Rendimiento por Torneo</h3>
      <div style={styles.tableWrapper} className="subtle-scrollbar">
        <table style={styles.table}>
          <thead>
            <tr>
              {tournamentHeaders.map((header, index) => (
                <th key={header.key} style={{...styles.th, ...(header.isNumeric && styles.numeric), ...(index === 0 && styles.stickyColumn) }} className={index === 0 ? 'sticky-column' : ''} onClick={() => requestTournamentSort(header.key as keyof TournamentStats)}>
                  {header.label}
                  {getTournamentSortIndicator(header.key as keyof TournamentStats)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTournamentData.map(stats => (
              <tr key={stats.tournament} style={styles.tr} className="table-row">
                <td style={{...styles.td, fontWeight: 700, ...styles.stickyColumn}} className="sticky-column">{stats.tournament}</td>
                <td style={{...styles.td, ...styles.numeric, fontWeight: 700}}>{stats.points}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.matchesPlayed}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.wins}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.draws}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.losses}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.goalsFor}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.goalsAgainst}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const OpponentTableComponent = opponentData.length > 0 && (
    <>
      <h3 style={styles.sectionTitle}>Historial vs Rivales</h3>
      <div style={styles.tableWrapper} className="subtle-scrollbar">
        <table style={styles.table}>
          <thead>
            <tr>
              {opponentHeaders.map((header, index) => (
                <th key={header.key} style={{...styles.th, ...(header.isNumeric && styles.numeric), ...(index === 0 && styles.stickyColumn) }} className={index === 0 ? 'sticky-column' : ''} onClick={() => requestOpponentSort(header.key as keyof OpponentStats)}>
                  {header.label}
                  {getOpponentSortIndicator(header.key as keyof OpponentStats)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedOpponentData.map(stats => (
              <tr key={stats.opponent} style={{...styles.tr, ...styles.clickableRow}} className="table-row" onClick={() => setSelectedOpponent(stats.opponent)}>
                <td style={{...styles.td, fontWeight: 700, ...styles.stickyColumn, cursor: 'pointer'}} className="sticky-column">{stats.opponent}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.matchesPlayed}</td>
                <td style={{...styles.td, ...styles.numeric, color: theme.colors.win, fontWeight: 600}}>{stats.wins}</td>
                <td style={{...styles.td, ...styles.numeric, color: theme.colors.draw, fontWeight: 600}}>{stats.draws}</td>
                <td style={{...styles.td, ...styles.numeric, color: theme.colors.loss, fontWeight: 600}}>{stats.losses}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.goalsFor}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.goalsAgainst}</td>
                <td style={{...styles.td, ...styles.numeric}}>{stats.effectiveness.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <>
    <style>{`
        .table-row:hover { background-color: ${theme.colors.background}; }
        .table-row:hover .sticky-column { background-color: ${theme.colors.background}; }
        .subtle-scrollbar::-webkit-scrollbar { height: 8px; }
        .subtle-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .subtle-scrollbar::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 10px; }
        .subtle-scrollbar { scrollbar-width: thin; scrollbar-color: ${theme.colors.border} transparent; }
    `}</style>
    <main style={styles.container}>
        <div style={styles.header}>
            <h2 style={styles.pageTitle}>Historial y Rendimiento</h2>
            {activeTeams.length > 1 && (
                <div style={styles.filterContainer}>
                    <label style={styles.filterLabel}>Mostrando para:</label>
                    <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={styles.filterSelect}>
                        <option value="all">Todos mis equipos</option>
                        {activeTeams.map(team => <option key={team} value={team}>{team}</option>)}
                    </select>
                </div>
            )}
        </div>

        {selectedOpponent && (
            <OpponentDetailModal 
                opponentName={selectedOpponent}
                matches={relevantMatches.filter(m => m.opponentName === selectedOpponent)}
                onClose={() => setSelectedOpponent(null)}
            />
        )}

      {isDesktop ? (
          <div style={styles.desktopGrid}>
            <div style={styles.column}>
              {RadarChartComponent}
              {OpponentTableComponent}
            </div>
            <div style={styles.column}>
              {YearlyTableComponent}
              {TournamentTableComponent}
            </div>
          </div>
      ) : (
        <>
          {RadarChartComponent}
          {OpponentTableComponent}
          {YearlyTableComponent}
          {TournamentTableComponent}
        </>
      )}
    </main>
    </>
  );
};

export default TablePage;
