import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import type { PlayerPairStats } from '../../types';
import { ArrowUpIcon } from '../icons/ArrowUpIcon';
import { ArrowDownIcon } from '../icons/ArrowDownIcon';

interface AssociationListItemProps {
  rank: number;
  pair: PlayerPairStats;
  isLast?: boolean;
}

const AssociationListItem: React.FC<AssociationListItemProps> = ({ rank, pair, isLast }) => {
  const { theme } = useTheme();
  const { setViewingPlayerName } = useData();

  const getImpactColor = (score: number) => {
    if (score > 1) return theme.colors.win;
    if (score < -0.5) return theme.colors.loss;
    return theme.colors.draw;
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'grid',
      gridTemplateColumns: 'auto 20px 1fr auto auto',
      alignItems: 'center',
      gap: theme.spacing.medium,
      padding: `${theme.spacing.small} 0`,
      borderBottom: isLast ? 'none' : `1px solid ${theme.colors.border}`,
      fontSize: '0.875rem',
    },
    movementIndicator: {
      width: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.colors.secondaryText,
    },
    rank: {
      fontWeight: 'bold',
      color: theme.colors.secondaryText,
    },
    playerNames: {
      fontWeight: 600,
      color: theme.colors.primaryText,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    playerName: {
        cursor: 'pointer',
    },
    statsContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '2px',
    },
    secondaryStat: {
      color: theme.colors.secondaryText,
      fontSize: '0.8rem',
      fontWeight: 500,
    },
    statBadge: {
      backgroundColor: getImpactColor(pair.impactScore),
      color: theme.colors.textOnAccent,
      fontWeight: 'bold',
      fontSize: '0.8rem',
      borderRadius: theme.borderRadius.small,
      padding: `2px ${theme.spacing.small}`,
      textAlign: 'center',
      minWidth: '40px',
    },
  };

  const renderMovementIndicator = () => {
    switch (pair.rankMovement) {
      case 'up': return <ArrowUpIcon color={theme.colors.win} />;
      case 'down': return <ArrowDownIcon color={theme.colors.loss} />;
      case 'stable': return <span style={{ color: theme.colors.draw }}>—</span>;
      case 'new': return <span style={{ color: theme.colors.accent2, fontWeight: 'bold' }}>•</span>;
      default: return <span>—</span>;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.movementIndicator} title={`Movimiento: ${pair.rankMovement}`}>
        {renderMovementIndicator()}
      </div>
      <span style={styles.rank}>{rank}.</span>
      <div style={styles.playerNames}>
        <span style={styles.playerName} onClick={() => setViewingPlayerName(pair.player1)}>{pair.player1}</span> & <span style={styles.playerName} onClick={() => setViewingPlayerName(pair.player2)}>{pair.player2}</span>
      </div>
      <div style={styles.statsContainer}>
        <span style={styles.secondaryStat}>{pair.winRate.toFixed(0)}% V</span>
        <span style={styles.secondaryStat}>{pair.efectividad.toFixed(0)}% Efect.</span>
      </div>
      <span style={styles.statBadge}>{pair.impactScore.toFixed(2)}</span>
    </div>
  );
};

export default AssociationListItem;