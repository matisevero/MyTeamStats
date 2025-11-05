import React, { useState, useEffect, useMemo } from 'react';
import type { Match } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { achievementsList } from '../data/achievements';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Card from '../components/common/Card';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { calculateHistoricalRecords } from '../utils/analytics';

const AchievementsPage: React.FC<{ matches: Match[] }> = ({ matches }) => {
  const { theme } = useTheme();
  
  const allAchievements = achievementsList;
  const historicalRecords = useMemo(() => calculateHistoricalRecords(matches), [matches]);

  const unlockedAchievementIds = useMemo(() => {
    const unlocked = new Set<string>();
    allAchievements.forEach(ach => {
      const progress = ach.progress(matches, historicalRecords);
      if (ach.tiers.some(t => progress >= t.target)) {
        unlocked.add(ach.id);
      }
    });
    return unlocked;
  }, [matches, allAchievements, historicalRecords]);

  const [seenAchievements, setSeenAchievements] = useLocalStorage<Record<string, boolean>>('seenAchievements', {});
  
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  useEffect(() => {
    const newAchievements = Array.from(unlockedAchievementIds).filter((id: string) => !seenAchievements[id]);

    if (newAchievements.length > 0) {
      setNewlyUnlocked(newAchievements);

      const timer = setTimeout(() => {
        setSeenAchievements(prev => {
          const updated = { ...prev };
          newAchievements.forEach((id: string) => {
            updated[id] = true;
          });
          return updated;
        });
      }, 500);

      const clearTimer = setTimeout(() => {
        setNewlyUnlocked([]);
      }, 3000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [unlockedAchievementIds, seenAchievements, setSeenAchievements]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.extraLarge },
    pageTitle: {
      fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText,
      margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium,
    },
    headerCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerText: {
      margin: 0,
    },
    headerCount: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: theme.colors.accent1,
    },
    achievementsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: theme.spacing.large },
    achievementCard: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.large,
      opacity: 0.5,
      transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out, box-shadow 0.5s ease-in-out',
    },
    unlocked: {
      opacity: 1,
    },
    newlyUnlocked: {
      animation: 'unlock-animation 2s ease-out forwards',
    },
    iconContainer: {
      flexShrink: 0,
      color: theme.colors.accent1,
      fontSize: '2rem',
    },
    infoContainer: {},
    title: {
      margin: `0 0 ${theme.spacing.small} 0`,
      fontSize: theme.typography.fontSize.large,
      color: theme.colors.primaryText,
    },
    description: {
      margin: 0,
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.secondaryText,
      lineHeight: 1.6,
    },
    notification: {
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: theme.colors.surface,
      color: theme.colors.primaryText,
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderRadius: theme.borderRadius.medium,
      boxShadow: theme.shadows.large,
      border: `1px solid ${theme.colors.accent1}`,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.medium,
      animation: 'notification-fade-in-out 3s ease-in-out forwards',
    }
  };

  const unlockedCount = unlockedAchievementIds.size;
  const totalCount = allAchievements.length;

  return (
    <>
      <style>{`
        @keyframes unlock-animation {
          0% {
            transform: scale(1);
            box-shadow: ${theme.shadows.medium};
            opacity: 0.5;
          }
          25% {
            transform: scale(1.05);
            box-shadow: 0 0 20px 5px ${theme.colors.accent1}40;
            opacity: 1;
          }
          50% {
            transform: scale(1);
            box-shadow: ${theme.shadows.medium};
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes notification-fade-in-out {
          0% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          85% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
        }
      `}</style>
      <main style={styles.container}>
        {newlyUnlocked.length > 0 && (
          <div style={styles.notification}>
            <TrophyIcon />
            <span>¡Has desbloqueado {newlyUnlocked.length} nuevo{newlyUnlocked.length > 1 ? 's' : ''} logro{newlyUnlocked.length > 1 ? 's' : ''}!</span>
          </div>
        )}
        <h2 style={styles.pageTitle}>Tu Vitrina de Trofeos</h2>
        <Card style={styles.headerCard}>
          <h3 style={styles.headerText}>Logros Desbloqueados</h3>
          <span style={styles.headerCount}>{unlockedCount} / {totalCount}</span>
        </Card>
        <div style={styles.achievementsGrid}>
          {allAchievements.map(ach => {
            const isUnlocked = unlockedAchievementIds.has(ach.id);
            const isNew = newlyUnlocked.includes(ach.id);
            
            let cardStyle = styles.achievementCard;
            if (isUnlocked) {
                cardStyle = { ...cardStyle, ...styles.unlocked };
            }
            if (isNew) {
                cardStyle = { ...cardStyle, ...styles.newlyUnlocked };
            }

            return (
              <Card key={ach.id} style={cardStyle}>
                <div style={styles.iconContainer}>{ach.tiers[0].icon}</div>
                <div style={styles.infoContainer}>
                  <h4 style={styles.title}>{ach.title}</h4>
                  <p style={styles.description}>{ach.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </main>
    </>
  );
};

export default AchievementsPage;