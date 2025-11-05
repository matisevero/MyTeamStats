import { useMemo } from 'react';
import type { Match, PlayerStats } from '../types';

const XP_PER_MATCH = 10;
const XP_PER_GOAL = 5;
const XP_PER_ASSIST = 3;

// Exponential scaling for level up requirement
const calculateXPForLevel = (level: number): number => {
  if (level === 1) return 0;
  return Math.floor(100 * Math.pow(1.2, level - 2));
};

export const usePlayerStats = (matches: Match[]): PlayerStats => {
  const stats = useMemo(() => {
    const totalXp = matches.reduce((total, match) => {
      return total + XP_PER_MATCH + (match.myGoals * XP_PER_GOAL) + (match.myAssists * XP_PER_ASSIST);
    }, 0);

    let level = 1;
    let xpForNext = calculateXPForLevel(level + 1);
    let cumulativeXpForLevel = 0;

    while (totalXp >= cumulativeXpForLevel + xpForNext) {
      cumulativeXpForLevel += xpForNext;
      level++;
      xpForNext = calculateXPForLevel(level + 1);
    }
    
    const xpInCurrentLevel = totalXp - cumulativeXpForLevel;
    const progress = xpForNext > 0 ? (xpInCurrentLevel / xpForNext) * 100 : 100;

    return {
      level,
      xp: xpInCurrentLevel,
      xpToNextLevel: xpForNext,
      progress: Math.min(progress, 100), // Cap progress at 100%
    };
  }, [matches]);

  return stats;
};