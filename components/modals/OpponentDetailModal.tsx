import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import type { Match } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import StatCard from '../StatCard';
import DonutChart from '../DonutChart';
import { ChevronIcon } from '../icons/ChevronIcon';

interface OpponentDetailModalProps {
  opponentName: string;
  matches: Match[]; // Matches filtered for this opponent
  onClose: () => void;
}

const OpponentDetailModal: React.FC<OpponentDetailModalProps> = ({ opponentName, matches, onClose }) => {
  const { theme } = useTheme();
  const [isHistoryExpanded, setHistoryExpanded] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const stats = useMemo(() => {
    const wins = matches.filter(m => m.result === 'VICTORIA').length;
    const draws = matches.filter(m => m.result === 'EMPATE').length;
    const losses = matches.filter(m => m.result === 'DERROTA').length;
    const totalMatches = matches.length;
    
    const goalsFor = matches.reduce((sum, m) => sum + m.teamScore, 0);
    const goalsAgainst = matches.reduce((sum, m) => sum + m.opponentScore, 0);
    const points = wins * 3 + draws;
    const possiblePoints = totalMatches * 3;
    
    const effectiveness = possiblePoints > 0 ? (points / possiblePoints) * 100 : 0;

    return { wins, draws, losses, totalMatches, goalsFor, goalsAgainst, points, effectiveness };
  }, [matches]);

  const chartData = [
    { label: 'Victorias', value: stats.wins, color: theme.colors.win },
    { label: 'Empates', value: stats.draws, color: theme.colors.draw },
    { label: 'Derrotas', value: stats.losses, color: theme.colors.loss },
  ];

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
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '600px',
      maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      animation: 'scaleUp 0.3s ease', border: `1px solid ${theme.colors.border}`,
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`, flexShrink: 0,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
      overflowY: 'auto', padding: theme.spacing.large,
      display: 'flex', flexDirection: 'column', gap: theme.spacing.large,
    },
    chartContainer: { display: 'flex', justifyContent: 'center' },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: theme.spacing.medium,
    },
    historySection: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.border}`
    },
    historyHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
        background: 'none', border: 'none', padding: theme.spacing.medium, cursor: 'pointer',
        textAlign: 'left', color: theme.colors.primaryText
    },
    historyTitle: { margin: 0, fontSize: theme.typography.fontSize.medium, fontWeight: 600 },
    historyContent: { padding: `0 ${theme.spacing.medium} ${theme.spacing.medium}`, animation: 'fadeInDown 0.3s ease' },
    matchRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${theme.spacing.small} 0`, borderBottom: `1px solid ${theme.colors.border}`,
    },
    lastMatchRow: { borderBottom: 'none' },
    matchDate: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small },
    matchScore: { fontWeight: 700, color: theme.colors.primaryText, marginLeft: theme.spacing.medium },
    matchTournament: { fontSize: '0.75rem', color: theme.colors.secondaryText, fontStyle: 'italic' }
  };

  const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .subtle-scrollbar::-webkit-scrollbar { width: 6px; }
        .subtle-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .subtle-scrollbar::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 10px; }
        .subtle-scrollbar { scrollbar-width: thin; scrollbar-color: ${theme.colors.border} transparent; }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <header style={styles.header}>
            <h2 style={styles.title}>Historial vs {opponentName}</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          
          <div style={styles.content} className="subtle-scrollbar">
            <div style={styles.chartContainer}>
              <DonutChart data={chartData} />
            </div>
            
            <div style={styles.statsGrid}>
              <StatCard label="Efectividad" value={`${stats.effectiveness.toFixed(0)}%`} />
              <StatCard label="Partidos" value={stats.totalMatches} />
              <StatCard label="Goles a Favor" value={stats.goalsFor} />
              <StatCard label="Goles en Contra" value={stats.goalsAgainst} />
              <StatCard label="Dif. Goles" value={stats.goalsFor - stats.goalsAgainst} />
            </div>
            
            <div style={styles.historySection}>
                <button style={styles.historyHeader} onClick={() => setHistoryExpanded(!isHistoryExpanded)}>
                    <h4 style={styles.historyTitle}>Partidos ({sortedMatches.length})</h4>
                    <ChevronIcon isExpanded={isHistoryExpanded} />
                </button>
                {isHistoryExpanded && (
                    <div style={styles.historyContent}>
                        <div>
                            {sortedMatches.map((match, index) => (
                                <div key={match.id} style={ index === sortedMatches.length - 1 ? {...styles.matchRow, ...styles.lastMatchRow} : styles.matchRow}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: theme.spacing.medium}}>
                                        <span style={styles.matchDate}>{new Date(match.date).toLocaleDateString()}</span>
                                        <div style={getResultStyle(match.result)}>{match.result.charAt(0)}</div>
                                        <span style={styles.matchScore}>{match.teamScore} - {match.opponentScore}</span>
                                    </div>
                                    {match.tournament && <span style={styles.matchTournament}>{match.tournament}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default OpponentDetailModal;