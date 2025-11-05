import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import type { SquadPlayerStats } from '../../types';
import Card from '../common/Card';
import AutocompleteInput from '../AutocompleteInput';
import RadarChart from '../charts/RadarChart';

// Helper to safely access nested properties
const getValue = (obj: any, path: string): number | null => {
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    return typeof value === 'number' ? value : null;
};

interface PlayerComparatorProps {
  squadStats: SquadPlayerStats[];
  allPlayerNames: string[];
}

const PlayerComparator: React.FC<PlayerComparatorProps> = ({ squadStats, allPlayerNames }) => {
  const { theme } = useTheme();
  const { setViewingPlayerName } = useData();
  const [selectedPlayers, setSelectedPlayers] = useState<(string | null)[]>([null, null, null]);
  
  const handleSelectPlayer = (index: number, name: string | null) => {
    setSelectedPlayers(prev => {
        const newSelection = [...prev];
        newSelection[index] = name;
        return newSelection;
    });
  };

  const radarChartData = useMemo(() => {
    const playersForChart = selectedPlayers
      .map(name => squadStats.find(p => p.name === name))
      .filter((p): p is SquadPlayerStats => !!p);

    if (playersForChart.length === 0) return [];
    
    const radarMetrics: { label: string; key: keyof SquadPlayerStats }[] = [
      { label: 'G/P', key: 'gpm' },
      { label: 'A/P', key: 'apm' },
      { label: 'Efect.', key: 'efectividad' },
      { label: 'PJ', key: 'matchesPlayed' },
      { label: 'Min', key: 'minutesPlayed' },
    ];
    
    const colors = [theme.colors.accent1, theme.colors.accent2, theme.colors.accent3];

    return playersForChart.map((player, index) => ({
      name: player.name,
      color: colors[index % colors.length],
      data: radarMetrics.map(metric => ({
        label: metric.label,
        value: player[metric.key] as number,
      })),
    }));
  }, [selectedPlayers, squadStats, theme.colors]);
  
  const comparisonMetrics: { key: string; label: string; format: (val: number) => string; }[] = [
    { key: 'matchesPlayed', label: 'PJ', format: val => val.toString() },
    { key: 'goals', label: 'Goles', format: val => val.toString() },
    { key: 'assists', label: 'Asistencias', format: val => val.toString() },
    { key: 'gpm', label: 'G/P', format: val => val.toFixed(2) },
    { key: 'apm', label: 'A/P', format: val => val.toFixed(2) },
    { key: 'starts', label: 'Titularidades', format: val => val.toString() },
    { key: 'subAppearances', label: 'Suplencias', format: val => val.toString() },
    { key: 'efectividad', label: 'Efectividad', format: val => `${val.toFixed(1)}%` },
    { key: 'winRate', label: '% Victorias', format: val => `${val.toFixed(1)}%` },
    { key: 'record.wins', label: 'G', format: val => val.toString() },
    { key: 'record.draws', label: 'E', format: val => val.toString() },
    { key: 'record.losses', label: 'P', format: val => val.toString() },
  ];
  
  const styles: { [key: string]: React.CSSProperties } = {
    comparatorStatsTable: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.8rem',
    },
    comparatorStatsTh: {
        padding: '0.5rem',
        borderBottom: `1px solid ${theme.colors.border}`,
    },
    comparatorStatsTd: {
        padding: '0.5rem',
        borderTop: `1px solid ${theme.colors.border}`,
    },
    clickableName: {
        cursor: 'pointer',
        textDecoration: 'underline',
        textDecorationColor: `${theme.colors.primaryText}50`,
    }
  };

  return (
    <Card title="Comparador de Jugadores">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.large }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.medium }}>
              {selectedPlayers.map((player, index) => (
                  <AutocompleteInput 
                      key={index}
                      value={player || ''}
                      onChange={(name) => handleSelectPlayer(index, name)}
                      suggestions={allPlayerNames.filter(p => !selectedPlayers.includes(p) || p === player)}
                      placeholder={`Jugador ${index + 1}`}
                  />
              ))}
          </div>
          {selectedPlayers.some(p => p) && (
              <>
                  <div>
                      <table style={styles.comparatorStatsTable}>
                          <thead>
                              <tr>
                                  <th style={{...styles.comparatorStatsTh, width: '25%', textAlign: 'left', color: theme.colors.secondaryText }}>Métrica</th>
                                  {selectedPlayers.map((player, index) => (
                                      <th key={index} style={{
                                          ...styles.comparatorStatsTh,
                                          textAlign: 'center',
                                          fontWeight: 'bold',
                                          color: theme.colors.primaryText
                                      }}>
                                          {player ? (
                                            <span style={styles.clickableName} onClick={() => setViewingPlayerName(player)}>{player}</span>
                                          ) : '-'}
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody>
                              {comparisonMetrics.map((metric) => {
                                  const values = selectedPlayers.map(name => {
                                      const playerStats = squadStats.find(p => p.name === name);
                                      return playerStats ? getValue(playerStats, metric.key) : null;
                                  });
                                  const validValues = values.filter((v): v is number => v !== null);
                                  
                                  const isLosses = metric.key === 'record.losses';
                                  const bestValue = isLosses 
                                      ? (validValues.length > 0 ? Math.min(...validValues) : Infinity)
                                      : (validValues.length > 0 ? Math.max(...validValues) : -Infinity);

                                  return (
                                      <tr key={metric.key}>
                                          <td style={{...styles.comparatorStatsTd, color: theme.colors.secondaryText, fontWeight: 600 }}>{metric.label}</td>
                                          {values.map((value, playerIndex) => {
                                              const isBest = value === bestValue && (isLosses ? bestValue < Infinity : bestValue > -Infinity);
                                              return (
                                                  <td key={playerIndex} style={{
                                                      ...styles.comparatorStatsTd, 
                                                      textAlign: 'center', 
                                                      fontWeight: isBest ? 'bold' : 'normal', 
                                                      color: isBest ? theme.colors.primaryText : theme.colors.secondaryText 
                                                  }}>
                                                      {value !== null ? metric.format(value) : '-'}
                                                  </td>
                                              )
                                          })}
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
                  {radarChartData.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', marginTop: theme.spacing.medium }}>
                      <RadarChart playersData={radarChartData} size={300} />
                  </div>}
              </>
          )}
      </div>
    </Card>
  );
};

export default PlayerComparator;