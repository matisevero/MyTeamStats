import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { useData } from '../contexts/DataContext';

const PlayerLevel: React.FC = () => {
  const { theme } = useTheme();
  const { matches } = useData();
  const playerStats = usePlayerStats(matches);
  const [isHovered, setIsHovered] = useState(false);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.small,
      position: 'relative',
    },
    levelCircle: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: theme.colors.accent1,
      color: theme.colors.textOnAccent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: theme.typography.fontSize.medium,
      border: `2px solid ${theme.colors.surface}`,
      boxShadow: `0 0 5px ${theme.colors.accent1}80`,
      flexShrink: 0,
      zIndex: 2,
    },
    progressContainer: {
      position: 'relative',
      height: '24px',
      width: '150px',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.large,
      border: `1px solid ${theme.colors.borderStrong}`,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      width: `${playerStats.progress}%`,
      background: `linear-gradient(90deg, ${theme.colors.accent1}80, ${theme.colors.accent1})`,
      borderRadius: theme.borderRadius.large,
      transition: 'width 0.5s ease-in-out',
    },
    tooltip: {
      position: 'absolute',
      bottom: '120%',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: theme.colors.surface,
      color: theme.colors.primaryText,
      padding: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      boxShadow: theme.shadows.large,
      border: `1px solid ${theme.colors.border}`,
      zIndex: 10,
      opacity: isHovered ? 1 : 0,
      visibility: isHovered ? 'visible' : 'hidden',
      transition: 'opacity 0.2s, visibility 0.2s',
      fontSize: theme.typography.fontSize.small,
      whiteSpace: 'nowrap',
    }
  };

  return (
    <div 
      style={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.levelCircle} title={`Nivel ${playerStats.level}`}>{playerStats.level}</div>
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}></div>
      </div>
      <div style={styles.tooltip}>
        XP: {Math.floor(playerStats.xp)} / {playerStats.xpToNextLevel}
      </div>
    </div>
  );
};

export default PlayerLevel;
