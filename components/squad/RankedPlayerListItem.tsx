import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import type { PlayerPairStats } from '../../types';

interface RankedPlayerListItemProps {
  rank: number;
  playerName: string;
  statValue: number | string;
  rankMovement?: 'up' | 'down' | 'stable' | 'new';
  secondaryStatValue: string;
  isLast?: boolean;
}

const RankedPlayerListItem: React.FC<RankedPlayerListItemProps> = ({ rank, playerName, statValue, rankMovement, secondaryStatValue, isLast }) => {
  const { theme } = useTheme();
  const { setViewingPlayerName } = useData();

  const getStatColor = (value: number | string) => {
    if (typeof value === 'number' && value > 0) return theme.colors.win;
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
    playerName: {
      fontWeight: 600,
      color: theme.colors.primaryText,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      cursor: 'pointer',
    },
    secondaryStat: {
      color: theme.colors.secondaryText,
      fontSize: '0.8rem',
      fontWeight: 500,
      textAlign: 'right',
    },
    statBadge: {
      backgroundColor: getStatColor(statValue),
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
    const commonSvgProps = {
        width: 16,
        height: 16,
        viewBox: "0 0 24 24",
        fill: "none",
        strokeWidth: "2.5",
        strokeLinecap: "round" as "round",
        strokeLinejoin: "round" as "round",
    };

    switch (rankMovement) {
      case 'up': return <svg {...commonSvgProps} stroke={theme.colors.win}><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
      case 'down': return <svg {...commonSvgProps} stroke={theme.colors.loss}><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
      case 'stable': return <span style={{ color: theme.colors.draw }}>—</span>;
      case 'new': return <span style={{ color: theme.colors.accent2, fontWeight: 'bold' }}>•</span>;
      default: return <span>—</span>;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.movementIndicator} title={`Movimiento: ${rankMovement}`}>
        {renderMovementIndicator()}
      </div>
      <span style={styles.rank}>{rank}.</span>
      <span style={styles.playerName} onClick={() => setViewingPlayerName(playerName)}>{playerName}</span>
      <span style={styles.secondaryStat}>{secondaryStatValue}</span>
      <span style={styles.statBadge}>{statValue}</span>
    </div>
  );
};

export default RankedPlayerListItem;