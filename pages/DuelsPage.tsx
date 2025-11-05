import React, { useState, useMemo } from 'react';
import type { SquadPlayerStats } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { UsersIcon } from '../components/icons/UsersIcon';

const SquadPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches } = useData();
  const [sortConfig, setSortConfig] = useState<{ key: keyof SquadPlayerStats; direction: 'asc' | 'desc' }>({ key: 'matchesPlayed', direction: 'desc' });

  const squadStats: SquadPlayerStats[] = useMemo(() => {
    const playerStats: { [name: string]: Omit<SquadPlayerStats, 'name' | 'winRate' | 'gpm' | 'apm' | 'minutesPercentage' | 'efectividad' | 'cleanSheets'> } = {};

    matches.forEach(match => {
        match.players.forEach(p => {
            if (!p.name) return;
            if (!playerStats[p.name]) {
                playerStats[p.name] = {
                    matchesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    record: { wins: 0, draws: 0, losses: 0 },
                    minutesPlayed: 0,
                    starts: 0,
                    subAppearances: 0,
                };
            }
            const stats = playerStats[p.name];
            stats.matchesPlayed++;
            if (match.result === 'VICTORIA') stats.record.wins++;
            else if (match.result === 'EMPATE') stats.record.draws++;
            else stats.record.losses++;

            stats.goals += p.goals;
            stats.assists += p.assists;
            stats.minutesPlayed += p.minutesPlayed || 0;
            if (p.status === 'starter' || p.status === 'goalkeeper') {
                stats.starts++;
            } else if (p.status === 'substitute') {
                stats.subAppearances++;
            }
        });
    });

    const statsArray = Object.entries(playerStats).map(([name, stats]) => {
      const points = stats.record.wins * 3 + stats.record.draws;
      return {
      name,
      ...stats,
      winRate: stats.matchesPlayed > 0 ? (stats.record.wins / stats.matchesPlayed) * 100 : 0,
      efectividad: stats.matchesPlayed > 0 ? (points / (stats.matchesPlayed * 3)) * 100 : 0,
      gpm: stats.matchesPlayed > 0 ? stats.goals / stats.matchesPlayed : 0,
      apm: stats.matchesPlayed > 0 ? stats.assists / stats.matchesPlayed : 0,
      minutesPlayed: stats.minutesPlayed,
      cleanSheets: 0, // Placeholder
    }});
    
    if (statsArray.length === 0) return [];

    const maxMinutes = Math.max(...statsArray.map(p => p.minutesPlayed));

    return statsArray.map(player => ({
      ...player,
      minutesPercentage: maxMinutes > 0 ? (player.minutesPlayed / maxMinutes) * 100 : 0,
    }));
  }, [matches]);

  const sortedSquad = useMemo(() => {
    return [...squadStats].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      if (sortConfig.key === 'record') {
          const pointsA = a.record.wins * 3 + a.record.draws;
          const pointsB = b.record.wins * 3 + b.record.draws;
          if (pointsA < pointsB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (pointsA > pointsB) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return b.matchesPlayed - a.matchesPlayed; // Secondary sort
    });
  }, [squadStats, sortConfig]);

  const requestSort = (key: keyof SquadPlayerStats) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: keyof SquadPlayerStats) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'desc' ? ' ↓' : ' ↑';
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium },
    tableWrapper: { overflowX: 'auto', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.medium },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: `${theme.spacing.small} ${theme.spacing.medium}`, textAlign: 'left', fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 600, borderBottom: `2px solid ${theme.colors.borderStrong}`, cursor: 'pointer', whiteSpace: 'nowrap' },
    tr: { transition: 'background-color 0.2s' },
    td: { padding: `${theme.spacing.medium}`, fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, borderBottom: `1px solid ${theme.colors.border}`, whiteSpace: 'nowrap' },
    noDataContainer: { textAlign: 'center', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, color: theme.colors.secondaryText, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}` },
  };

  if (squadStats.length === 0) {
      return (
          <main style={styles.container}>
            <h2 style={styles.pageTitle}>Plantel</h2>
            <div style={styles.noDataContainer}>
                <UsersIcon size={40} color={theme.colors.secondaryText} />
                <p style={{ marginTop: theme.spacing.medium }}>Añade jugadores a tus partidos para ver las estadísticas del plantel.</p>
            </div>
          </main>
      )
  }

  return (
    <>
    <style>{`
        .table-row:hover { background-color: ${theme.colors.background}; }
    `}</style>
    <main style={styles.container}>
      <h2 style={styles.pageTitle}>Plantel del Equipo</h2>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => requestSort('name')}>Nombre{getSortIndicator('name')}</th>
              <th style={styles.th} onClick={() => requestSort('matchesPlayed')}>PJ{getSortIndicator('matchesPlayed')}</th>
              <th style={styles.th} onClick={() => requestSort('record')}>Récord{getSortIndicator('record')}</th>
              <th style={styles.th} onClick={() => requestSort('winRate')}>% Vic.{getSortIndicator('winRate')}</th>
              <th style={styles.th} onClick={() => requestSort('goals')}>Goles{getSortIndicator('goals')}</th>
              <th style={styles.th} onClick={() => requestSort('assists')}>Asist.{getSortIndicator('assists')}</th>
              <th style={styles.th} onClick={() => requestSort('gpm')}>G/P{getSortIndicator('gpm')}</th>
              <th style={styles.th} onClick={() => requestSort('apm')}>A/P{getSortIndicator('apm')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedSquad.map(player => (
              <tr key={player.name} style={styles.tr} className="table-row">
                <td style={{...styles.td, fontWeight: 'bold'}}>{player.name}</td>
                <td style={styles.td}>{player.matchesPlayed}</td>
                <td style={styles.td}>{`${player.record.wins}-${player.record.draws}-${player.record.losses}`}</td>
                <td style={styles.td}>{player.winRate.toFixed(1)}%</td>
                <td style={styles.td}>{player.goals}</td>
                <td style={styles.td}>{player.assists}</td>
                <td style={styles.td}>{player.gpm.toFixed(2)}</td>
                <td style={styles.td}>{player.apm.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
    </>
  );
};

export default SquadPage;