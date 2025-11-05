import type { Match, HistoricalRecords, HistoricalRecord, CustomAchievement, PlayerMorale } from '../types';
import { MoraleLevel } from '../types';

export const calculateStandardDeviation = (data: number[]): number => {
  if (data.length <= 1) {
    return 0;
  }
  const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
};

export const evaluateCustomAchievement = (achievement: CustomAchievement, matches: Match[]): boolean => {
    const { metric, operator, value, window } = achievement.condition;
    
    const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // NEW LOGIC FOR BREAKING STREAKS
    // This logic checks if the MOST RECENT match broke a previous negative streak.
    if (metric === 'breakWinAfterLossStreak') {
        // Must have a win as the last match to "break" the streak.
        if (sortedMatches.length === 0 || sortedMatches[0].result !== 'VICTORIA') {
            return false;
        }
        // Check the streak of losses *before* the most recent win.
        let lossStreakBefore = 0;
        for (let i = 1; i < sortedMatches.length; i++) {
            if (sortedMatches[i].result === 'DERROTA') {
                lossStreakBefore++;
            } else {
                break;
            }
        }
        // The achievement is for breaking a streak of AT LEAST `value` losses.
        return lossStreakBefore >= value;
    }

    if (metric === 'breakUndefeatedAfterWinlessStreak') {
        // Must have a win or draw as the last match.
        if (sortedMatches.length === 0 || sortedMatches[0].result === 'DERROTA') {
            return false;
        }
        // Check the streak of winless matches *before* the most recent non-loss.
        let winlessStreakBefore = 0;
        for (let i = 1; i < sortedMatches.length; i++) {
            if (sortedMatches[i].result !== 'VICTORIA') {
                winlessStreakBefore++;
            } else {
                break;
            }
        }
        return winlessStreakBefore >= value;
    }

    // EXISTING LOGIC FOR ONGOING STREAKS
    const recentMatches = sortedMatches.slice(0, window);

    if (recentMatches.length < window) {
        return false;
    }

    let streak = 0;
    
    // This logic checks if the streak STARTS from the most recent match.
    // It's intended for achievements like "Currently on a 3-win streak".
    switch (metric) {
        case 'winStreak':
            for (const match of recentMatches) { if (match.result === 'VICTORIA') streak++; else break; }
            break;
        case 'lossStreak':
             for (const match of recentMatches) { if (match.result === 'DERROTA') streak++; else break; }
            break;
        case 'undefeatedStreak':
             for (const match of recentMatches) { if (match.result !== 'DERROTA') streak++; else break; }
            break;
        case 'winlessStreak':
             for (const match of recentMatches) { if (match.result !== 'VICTORIA') streak++; else break; }
            break;
        case 'goalStreak':
             for (const match of recentMatches) { if (match.myGoals > 0) streak++; else break; }
            break;
        case 'assistStreak':
             for (const match of recentMatches) { if (match.myAssists > 0) streak++; else break; }
            break;
        case 'goalDrought':
             for (const match of recentMatches) { if (match.myGoals === 0) streak++; else break; }
            break;
        case 'assistDrought':
             for (const match of recentMatches) { if (match.myAssists === 0) streak++; else break; }
            break;
        default:
            return false;
    }

    if (operator === 'greater_than_or_equal_to') {
        return streak >= value;
    }
    
    return false;
};

export const calculateHistoricalRecords = (matches: Match[]): HistoricalRecords => {
  const initialRecord: HistoricalRecord = { value: 0, count: 0 };
  const records: HistoricalRecords = {
    longestWinStreak: { ...initialRecord },
    longestUndefeatedStreak: { ...initialRecord },
    longestDrawStreak: { ...initialRecord },
    longestLossStreak: { ...initialRecord },
    longestWinlessStreak: { ...initialRecord },
    longestGoalStreak: { ...initialRecord },
    longestAssistStreak: { ...initialRecord },
    longestGoalDrought: { ...initialRecord },
    longestAssistDrought: { ...initialRecord },
    longestCleanSheetStreak: { ...initialRecord },
    bestGoalPerformance: { ...initialRecord },
    bestAssistPerformance: { ...initialRecord },
    bestOffensivePerformance: { ...initialRecord },
    bestDefensivePerformance: { ...initialRecord },
    biggestWin: { ...initialRecord },
  };

  if (matches.length === 0) {
    return records;
  }

  const sortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Single match records
  records.bestGoalPerformance.value = Math.max(0, ...sortedMatches.map(m => m.myGoals));
  records.bestAssistPerformance.value = Math.max(0, ...sortedMatches.map(m => m.myAssists));
  records.bestOffensivePerformance.value = Math.max(0, ...sortedMatches.map(m => m.teamScore));
  records.bestDefensivePerformance.value = Math.min(...sortedMatches.map(m => m.opponentScore));
  records.biggestWin.value = Math.max(0, ...sortedMatches.filter(m => m.result === 'VICTORIA').map(m => m.goalDifference));


  if (records.bestGoalPerformance.value > 0) {
    records.bestGoalPerformance.count = sortedMatches.filter(m => m.myGoals === records.bestGoalPerformance.value).length;
  }
  if (records.bestAssistPerformance.value > 0) {
    records.bestAssistPerformance.count = sortedMatches.filter(m => m.myAssists === records.bestAssistPerformance.value).length;
  }
  
  // Streak calculation
  const streakData: { [key: string]: number[] } = {
    win: [], undefeated: [], draw: [], loss: [], winless: [],
    goal: [], assist: [], goalDrought: [], assistDrought: [],
    cleanSheet: [],
  };

  let currentWin = 0, currentUndefeated = 0, currentDraw = 0, currentLoss = 0, currentWinless = 0,
      currentGoal = 0, currentAssist = 0, currentGoalDrought = 0, currentAssistDrought = 0,
      currentCleanSheet = 0;

  for (const match of sortedMatches) {
    // Result streaks
    if (match.result === 'VICTORIA') {
      currentWin++; currentUndefeated++;
      if (currentWinless > 0) streakData.winless.push(currentWinless); currentWinless = 0;
      if (currentLoss > 0) streakData.loss.push(currentLoss); currentLoss = 0;
      if (currentDraw > 0) streakData.draw.push(currentDraw); currentDraw = 0;
    } else if (match.result === 'EMPATE') {
      currentDraw++; currentUndefeated++; currentWinless++;
      if (currentWin > 0) streakData.win.push(currentWin); currentWin = 0;
      if (currentLoss > 0) streakData.loss.push(currentLoss); currentLoss = 0;
    } else { // DERROTA
      currentLoss++; currentWinless++;
      if (currentWin > 0) streakData.win.push(currentWin); currentWin = 0;
      if (currentDraw > 0) streakData.draw.push(currentDraw); currentDraw = 0;
      if (currentUndefeated > 0) streakData.undefeated.push(currentUndefeated); currentUndefeated = 0;
    }
    
    // Performance streaks
    if (match.myGoals > 0) {
      currentGoal++;
      if (currentGoalDrought > 0) streakData.goalDrought.push(currentGoalDrought); currentGoalDrought = 0;
    } else {
      currentGoalDrought++;
      if (currentGoal > 0) streakData.goal.push(currentGoal); currentGoal = 0;
    }

    if (match.myAssists > 0) {
      currentAssist++;
      if (currentAssistDrought > 0) streakData.assistDrought.push(currentAssistDrought); currentAssistDrought = 0;
    } else {
      currentAssistDrought++;
      if (currentAssist > 0) streakData.assist.push(currentAssist); currentAssist = 0;
    }

    if (match.opponentScore === 0) {
        currentCleanSheet++;
    } else {
        if (currentCleanSheet > 0) streakData.cleanSheet.push(currentCleanSheet);
        currentCleanSheet = 0;
    }
  }

  // Push final streaks
  if (currentWin > 0) streakData.win.push(currentWin);
  if (currentUndefeated > 0) streakData.undefeated.push(currentUndefeated);
  if (currentDraw > 0) streakData.draw.push(currentDraw);
  if (currentLoss > 0) streakData.loss.push(currentLoss);
  if (currentWinless > 0) streakData.winless.push(currentWinless);
  if (currentGoal > 0) streakData.goal.push(currentGoal);
  if (currentAssist > 0) streakData.assist.push(currentAssist);
  if (currentGoalDrought > 0) streakData.goalDrought.push(currentGoalDrought);
  if (currentAssistDrought > 0) streakData.assistDrought.push(currentAssistDrought);
  if (currentCleanSheet > 0) streakData.cleanSheet.push(currentCleanSheet);
  
  // Helper to calculate final record
  const calculateRecord = (streaks: number[]): HistoricalRecord => {
    if (streaks.length === 0) return { value: 0, count: 0 };
    const maxValue = Math.max(0, ...streaks);
    if (maxValue === 0) return { value: 0, count: 0 };
    const count = streaks.filter(s => s === maxValue).length;
    return { value: maxValue, count };
  };

  records.longestWinStreak = calculateRecord(streakData.win);
  records.longestUndefeatedStreak = calculateRecord(streakData.undefeated);
  records.longestDrawStreak = calculateRecord(streakData.draw);
  records.longestLossStreak = calculateRecord(streakData.loss);
  records.longestWinlessStreak = calculateRecord(streakData.winless);
  records.longestGoalStreak = calculateRecord(streakData.goal);
  records.longestAssistStreak = calculateRecord(streakData.assist);
  records.longestGoalDrought = calculateRecord(streakData.goalDrought);
  records.longestAssistDrought = calculateRecord(streakData.assistDrought);
  records.longestCleanSheetStreak = calculateRecord(streakData.cleanSheet);
  
  return records;
};

export const calculateTeamMorale = (matches: Match[]): PlayerMorale | null => {
  const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const calculateScoreForWindow = (matchesToCalc: Match[]): number | null => {
    if (matchesToCalc.length < 3) {
      return null;
    }
    let weightedScoreSum = 0;
    let weightSum = 0;
    matchesToCalc.forEach((match, index) => {
      const weight = 1.0 - (index * 0.1);
      let matchScore = 0;
      if (match.result === 'VICTORIA') {
        matchScore += 3;
      } else if (match.result === 'EMPATE') {
        matchScore += 1;
      } else {
        matchScore -= 2;
      }
      matchScore += match.myGoals * 1;
      matchScore += match.myAssists * 0.5;
      matchScore += (match.goalDifference ?? 0) * 0.2;
      weightedScoreSum += matchScore * weight;
      weightSum += weight;
    });
    const averageWeightedScore = weightSum > 0 ? weightedScoreSum / weightSum : 0;
    const MIN_RAW_SCORE = -5;
    const MAX_RAW_SCORE = 15;
    let finalScore = ((averageWeightedScore - MIN_RAW_SCORE) / (MAX_RAW_SCORE - MIN_RAW_SCORE)) * 100;
    return Math.max(0, Math.min(100, finalScore));
  };

  const MORALE_WINDOW = 8;
  const currentMatches = sortedMatches.slice(0, MORALE_WINDOW);
  const previousMatches = sortedMatches.slice(1, MORALE_WINDOW + 1);

  const currentScore = calculateScoreForWindow(currentMatches);
  const previousScore = calculateScoreForWindow(previousMatches);
  
  if (currentScore === null) {
    return null;
  }
  
  let trend: 'up' | 'down' | 'same' | 'new';
  if (previousScore === null || sortedMatches.length <= MORALE_WINDOW) {
    trend = 'new';
  } else if (currentScore > previousScore + 1) {
    trend = 'up';
  } else if (currentScore < previousScore - 1) {
    trend = 'down';
  } else {
    trend = 'same';
  }

  let level: MoraleLevel;
  if (currentScore === 100) level = MoraleLevel.MODO_D10S;
  else if (currentScore >= 90) level = MoraleLevel.ESTELAR;
  else if (currentScore >= 80) level = MoraleLevel.INSPIRADO;
  else if (currentScore >= 70) level = MoraleLevel.CONFIADO;
  else if (currentScore >= 60) level = MoraleLevel.SOLIDO;
  else if (currentScore >= 50) level = MoraleLevel.REGULAR;
  else if (currentScore >= 40) level = MoraleLevel.DUDOSO;
  else if (currentScore >= 30) level = MoraleLevel.BLOQUEADO;
  else if (currentScore >= 10) level = MoraleLevel.EN_CAIDA_LIBRE;
  else level = MoraleLevel.DESCONOCIDO;

  let wins = 0, draws = 0, losses = 0, goals = 0, assists = 0;
  currentMatches.forEach((match) => {
    if (match.result === 'VICTORIA') wins++;
    else if (match.result === 'EMPATE') draws++;
    else losses++;
    goals += match.myGoals;
    assists += match.myAssists;
  });

  const recentMatchesSummary = {
    matchesConsidered: currentMatches.length,
    record: `${wins}V-${draws}E-${losses}D`,
    goals,
    assists,
  };
  
  return { level, score: currentScore, recentMatchesSummary, trend, description: '' };
};