
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
      gridTemplateColumns: '20px 16px 1fr auto',
      alignItems: 'center',
      gap: theme.spacing.small,
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
      textAlign: 'center',
    },
    namesContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    playerName: {
      fontWeight: 600,
      color: theme.colors.primaryText,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      cursor: 'pointer',
      fontSize: '0.9rem',
    },
    plusSign: {
        color: theme.colors.accent2,
        fontWeight: 700,
        fontSize: '0.8rem',
        marginLeft: '2px',
    },
    rightSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        minWidth: '70px',
    },
    statBadge: {
      backgroundColor: getImpactColor(pair.impactScore),
      color: theme.colors.textOnAccent,
      fontWeight: 'bold',
      fontSize: '0.9rem',
      borderRadius: theme.borderRadius.small,
      padding: `2px ${theme.spacing.medium}`,
      textAlign: 'center',
      width: '100%',
    },
    statsText: {
        color: theme.colors.secondaryText,
        fontSize: '0.65rem',
        fontWeight: 500,
        textAlign: 'center',
        lineHeight: 1.2,
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
      <span style={styles.rank}>{rank}.</span>
      <div style={styles.movementIndicator} title={`Movimiento: ${pair.rankMovement}`}>
        {renderMovementIndicator()}
      </div>
      
      <div style={styles.namesContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
            <span style={{...styles.playerName, flex: '0 1 auto'}} onClick={() => setViewingPlayerName(pair.player1)}>{pair.player1}</span>
            <span style={styles.plusSign}>+</span>
        </div>
        <span style={styles.playerName} onClick={() => setViewingPlayerName(pair.player2)}>{pair.player2}</span>
      </div>

      <div style={styles.rightSection}>
        <span style={styles.statBadge}>{pair.impactScore.toFixed(2)}</span>
        <div style={styles.statsText}>
            <div>{pair.winRate.toFixed(0)}% Vic</div>
            <div>{pair.efectividad.toFixed(0)}% Efec</div>
        </div>
      </div>
    </div>
  );
};

export default AssociationListItem;
