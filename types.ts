import type { ReactNode } from 'react';

export interface PlayerPerformance {
  name: string;
  goals: number;
  assists: number;
  minutesPlayed?: number;
  status: 'starter' | 'substitute' | 'goalkeeper';
  card?: 'yellow' | 'double_yellow' | 'red' | 'blue';
}

export interface Incident {
  id: string;
  type: 'penal_errado' | 'penal_atajado' | 'substitution';
  playerName: string; // Functions as "Player OUT" for substitutions
  playerIn?: string; // Only for substitutions
  minute?: number;
}

export interface Match {
  id: string;
  result: 'VICTORIA' | 'DERROTA' | 'EMPATE';
  teamName: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  date: string;
  tournament?: string;
  notes?: string;
  players: PlayerPerformance[]; // Players of my team
  opponentPlayers?: PlayerPerformance[]; // Players of opponent team
  incidents?: Incident[];
  // Calculated fields
  myGoals: number;
  myAssists: number;
  goalDifference: number;
}

export interface AIInteraction {
  id: string;
  date: string;
  type: 'highlight_analysis' | 'coach_insight' | 'match_headline' | 'achievement_suggestion' | 'consistency_analysis' | 'player_comparison' | 'match_summary' | 'goal_suggestion';
  content: any;
}

export interface AIHighlight {
  matchId: string;
  title: string;
  reason: string;
  match: Match;
}

export interface CoachingInsight {
  positiveTrend: string;
  areaForImprovement: string;
}

export type MatchSortByType = 'date_desc' | 'date_asc' | 'teamScore_desc' | 'teamScore_asc' | 'opponentScore_desc' | 'opponentScore_asc';

export interface SquadPlayerStats {
  name: string;
  matchesPlayed: number;
  starts: number;
  subAppearances: number;
  winRate: number;
  efectividad: number;
  goals: number;
  assists: number;
  gpm: number;
  apm: number;
  record: { wins: number; draws: number; losses: number };
  minutesPlayed: number;
  minutesPercentage: number;
  cleanSheets: number;
  goalsAgainst?: number;
  isGoalkeeper?: boolean;
  jerseyNumber?: number;
}

export interface PlayerPairStats {
  player1: string;
  player2: string;
  matchesTogether: number;
  points: number;
  goals: number;
  assists: number;
  minutes: number;
  impactScore: number;
  wins: number;
  winRate: number;
  efectividad: number;
  rankMovement?: 'up' | 'down' | 'stable' | 'new';
}

export interface HistoricalRecord {
  value: number;
  count: number;
}

export interface HistoricalRecords {
  longestWinStreak: HistoricalRecord;
  longestUndefeatedStreak: HistoricalRecord;
  longestDrawStreak: HistoricalRecord;
  longestLossStreak: HistoricalRecord;
  longestWinlessStreak: HistoricalRecord;
  longestGoalStreak: HistoricalRecord;
  longestAssistStreak: HistoricalRecord;
  longestGoalDrought: HistoricalRecord;
  longestAssistDrought: HistoricalRecord;
  longestCleanSheetStreak: HistoricalRecord;

  bestGoalPerformance: HistoricalRecord;
  bestAssistPerformance: HistoricalRecord;
  bestOffensivePerformance: HistoricalRecord; // most goals scored in a match
  bestDefensivePerformance: HistoricalRecord; // least goals conceded in a match
  biggestWin: HistoricalRecord; // biggest goal difference in a win
}


export enum MoraleLevel {
  MODO_D10S = "MODO D10S",
  ESTELAR = "Estelar",
  INSPIRADO = "Inspirado",
  CONFIADO = "Confiado",
  SOLIDO = "Sólido",
  REGULAR = "Regular",
  DUDOSO = "Dudoso",
  BLOQUEADO = "Bloqueado",
  EN_CAIDA_LIBRE = "En Caída Libre",
  DESCONOCIDO = "Desconocido",
}

export interface PlayerMorale {
  level: MoraleLevel;
  score: number;
  description: string;
  trend: 'up' | 'down' | 'same' | 'new';
  recentMatchesSummary: {
    matchesConsidered: number;
    record: string;
    goals: number;
    assists: number;
  };
}

export type GoalMetric = 'myGoals' | 'points' | 'efectividad' | 'cleanSheets' | 'longestWinStreak' | 'longestUndefeatedStreak' | 'winRate' | 'VICTORIA';

export interface Goal {
  id: string;
  metric: GoalMetric;
  target: number;
  title: string;
  startDate?: string;
  endDate?: string;
}

export type AchievementConditionMetric = 'winStreak' | 'lossStreak' | 'undefeatedStreak' | 'winlessStreak' | 'goalStreak' | 'assistStreak' | 'goalDrought' | 'assistDrought' | 'breakWinAfterLossStreak' | 'breakUndefeatedAfterWinlessStreak';
export interface AchievementCondition {
  metric: AchievementConditionMetric;
  operator: 'greater_than_or_equal_to';
  value: number;
  window: number; // number of recent matches to check
}
export interface CustomAchievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    condition: AchievementCondition;
    unlocked: boolean;
}

export interface AchievementTier {
  name: string;
  target: number;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  isSecret?: boolean;
  progress: (matches: Match[], records: HistoricalRecords) => number;
  tiers: AchievementTier[];
}

export interface AIAchievementSuggestion extends Omit<CustomAchievement, 'id' | 'unlocked'> {}
export interface AIGoalSuggestion {
    title: string;
    description: string;
    metric: GoalMetric;
    target: number;
    period: 'season' | 'month' | 'all-time';
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  progress: number;
}

export interface PlayerContextStats {
  matchesPlayed: number;
  winRate: number;
  record: { wins: number; draws: number; losses: number };
  myGoals: number;
  myAssists: number;
  gpm: number;
  apm: number;
  points: number;
  matches: Match[];
}

export interface PlayerProfile {
  teammateStats: PlayerContextStats | null;
  opponentStats: PlayerContextStats | null;
}

export interface TeammateStats {
  name: string;
  matches: number;
  winRate: number;
  avgPoints: number;
  totalGoalsInCommon: number;
  totalAssistsInCommon: number;
}
export interface OpponentStats {
  name: string;
  matches: number;
  winRateAgainst: number;
  avgPointsAgainst: number;
}

export interface TournamentSettings {
  icon: string;
  color: string;
  matchDuration?: number;
  playersPerSide?: number;
}

export interface PlayerProfileData {
  photoUrl?: string;
  jerseyNumber?: number;
}

export interface TeamProfileData {
  shieldUrl?: string;
  isHidden?: boolean;
}