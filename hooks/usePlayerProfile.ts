import { useMemo } from 'react';
import type { Match, PlayerProfile, PlayerContextStats } from '../types';

const calculateContextStats = (contextMatches: Match[]): PlayerContextStats | null => {
  if (contextMatches.length === 0) {
    return null;
  }
  
  const matchesPlayed = contextMatches.length;
  const wins = contextMatches.filter(m => m.result === 'VICTORIA').length;
  const draws = contextMatches.filter(m => m.result === 'EMPATE').length;
  const losses = matchesPlayed - wins - draws;
  const myGoals = contextMatches.reduce((sum, m) => sum + m.myGoals, 0);
  const myAssists = contextMatches.reduce((sum, m) => sum + m.myAssists, 0);
  const points = (wins * 3) + draws;

  return {
    matchesPlayed,
    winRate: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0,
    record: { wins, draws, losses },
    myGoals,
    myAssists,
    gpm: matchesPlayed > 0 ? myGoals / matchesPlayed : 0,
    apm: matchesPlayed > 0 ? myAssists / matchesPlayed : 0,
    points,
    matches: [...contextMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
};

export const usePlayerProfile = (
  playerName: string | null,
  allMatches: Match[],
  year: string | 'all'
): PlayerProfile | null => {
  return useMemo(() => {
    if (!playerName) {
      return null;
    }

    const filteredMatches = year === 'all'
      ? allMatches
      : allMatches.filter(match => new Date(match.date).getFullYear().toString() === year);

    const teammateMatches = filteredMatches.filter(match => 
      match.players?.some(p => p.name === playerName)
    );

    const opponentMatches = filteredMatches.filter(match => 
      match.opponentPlayers?.some(p => p.name === playerName)
    );

    return {
      teammateStats: calculateContextStats(teammateMatches),
      opponentStats: calculateContextStats(opponentMatches),
    };

  }, [playerName, allMatches, year]);
};