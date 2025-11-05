import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Goal, GoalMetric, AIAchievementSuggestion, CustomAchievement, Match } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import Card from '../components/common/Card';
import { achievementsList } from '../data/achievements';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { TargetIcon } from '../components/icons/TargetIcon';
import { calculateHistoricalRecords } from '../utils/analytics';
import { generateAchievementSuggestions, generateCreativeGoalTitle } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Loader } from '../components/Loader';

const metricLabels: Record<GoalMetric, string> = {
  myGoals: 'Goles',
  myAssists: 'Asistencias',
  VICTORIA: 'Victorias',
  winRate: '% de Victorias',
  gpm: 'Goles por Partido',
  longestWinStreak: 'Racha de Victorias',
  longestUndefeatedStreak: 'Racha Invicta',
};
const metricIcons: Record<GoalMetric, React.ReactNode> = {
  myGoals: <span style={{ fontSize: '1.5rem' }}>⚽️</span>,
  myAssists: <span style={{ fontSize: '1.5rem' }}>👟</span>,
  VICTORIA: <span style={{ fontSize: '1.5rem' }}>✅</span>,
  winRate: <span style={{ fontSize: '1.5rem' }}>📈</span>,
  gpm: <span style={{ fontSize: '1.5rem' }}>🎯</span>,
  longestWinStreak: <span style={{ fontSize: '1.5rem' }}>🔥</span>,
  longestUndefeatedStreak: <span style={{ fontSize: '1.5rem' }}>🛡️</span>,
};

const formatPeriod = (startDate?: string, endDate?: string): string => {
    if (!startDate || !endDate) return "Histórico";
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Adjust for timezone differences by using UTC methods for date components
    const startUTC = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const endUTC = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

    if (startUTC.getUTCDate() === 1 && endUTC.getUTCDate() >= 28 && startUTC.getUTCMonth() === 0 && endUTC.getUTCMonth() === 11 && startUTC.getUTCFullYear() === endUTC.getUTCFullYear()) {
        return `Temporada ${startUTC.getUTCFullYear()}`;
    }
    
    const startMonth = startUTC.toLocaleString('es-ES', { month: 'short' });
    const endMonth = endUTC.toLocaleString('es-ES', { month: 'short' });

    if (startUTC.getUTCFullYear() === endUTC.getUTCFullYear()) {
        if (startUTC.getUTCMonth() === endUTC.getUTCMonth()) {
            return `${startMonth}. ${startUTC.getUTCFullYear()}`;
        }
        return `${startMonth}. - ${endMonth}. ${startUTC.getUTCFullYear()}`;
    }
    
    return `${startMonth}. ${startUTC.getUTCFullYear()} - ${endMonth}. ${endUTC.getUTCFullYear()}`;
};


const GoalCard: React.FC<{ goal: Goal; progress: number; onDelete: () => void; }> = ({ goal, progress, onDelete }) => {
    const { theme } = useTheme();
    const progressPercentage = Math.min((progress / goal.target) * 100, 100);
    const styles = {
        goalCard: { display: 'flex', flexDirection: 'column' as 'column', gap: '1rem', position: 'relative' as 'relative' },
        goalHeader: { display: 'flex', alignItems: 'center', gap: '1rem' },
        goalTitleContainer: { flex: 1 },
        goalTitle: { margin: 0, fontSize: '1.125rem', color: theme.colors.primaryText, },
        goalPeriod: { margin: `0.25rem 0 0 0`, fontSize: '0.75rem', color: theme.colors.secondaryText, fontStyle: 'italic' },
        progressInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
        progressText: { fontSize: '0.875rem', color: theme.colors.secondaryText },
        progressValue: { fontSize: '1.125rem', fontWeight: 700, color: theme.colors.primaryText },
        progressBarContainer: { width: '100%', backgroundColor: theme.colors.border, borderRadius: '6px', overflow: 'hidden', height: '8px' },
        progressBar: { height: '100%', backgroundColor: theme.colors.accent1, transition: 'width 0.5s ease-in-out', borderRadius: '6px' },
        deleteButton: { position: 'absolute' as 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: theme.colors.secondaryText, cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, padding: '0.25rem' },
    };
    return (
        <Card style={styles.goalCard}>
            <button onClick={onDelete} style={styles.deleteButton} aria-label="Eliminar meta">&times;</button>
            <div style={styles.goalHeader}>
                {metricIcons[goal.metric]}
                <div style={styles.goalTitleContainer}>
                    <h4 style={styles.goalTitle}>{goal.title}</h4>
                    <p style={styles.goalPeriod}>{formatPeriod(goal.startDate, goal.endDate)}</p>
                </div>
            </div>
            <div>
                <div style={styles.progressInfo}><span style={styles.progressText}>Progreso</span><span style={styles.progressValue}>{progress.toFixed(goal.metric === 'gpm' ? 2 : 0)} / {goal.target}</span></div>
                <div style={styles.progressBarContainer}><div style={{ ...styles.progressBar, width: `${progressPercentage}%` }} /></div>
            </div>
        </Card>
    );
};

const ProgressPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, goals, addGoal, deleteGoal, customAchievements, addCustomAchievement, deleteCustomAchievement, addAIInteraction } = useData();
  const currentYear = new Date().getFullYear();

  const [goalMetric, setGoalMetric] = useState<GoalMetric>('myGoals');
  const [goalTarget, setGoalTarget] = useState<number | string>('');
  const [goalTitle, setGoalTitle] = useState('');
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // New state for period selection
  const [periodType, setPeriodType] = useState<'year' | 'range' | 'all'>('year');
  const [selectedYearForGoal, setSelectedYearForGoal] = useState<string>(currentYear.toString());
  const [startMonth, setStartMonth] = useState(''); // YYYY-MM
  const [endMonth, setEndMonth] = useState(''); // YYYY-MM

  const [aiAchievementSuggestions, setAiAchievementSuggestions] = useState<AIAchievementSuggestion[]>([]);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  const historicalRecords = useMemo(() => calculateHistoricalRecords(matches), [matches]);
  const [seenAchievements, setSeenAchievements] = useLocalStorage<Record<string, boolean>>('seenAchievements', {});
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);

  const allAchievementsWithProgress = useMemo(() => {
    return achievementsList.map(ach => {
      const currentProgress = ach.progress(matches, historicalRecords);
      const unlockedTiers = ach.tiers.filter(t => currentProgress >= t.target);
      const nextTier = ach.tiers.find(t => currentProgress < t.target);
      return { ...ach, currentProgress, unlockedTiers, nextTier };
    });
  }, [matches, historicalRecords]);

  useEffect(() => {
    const newUnlocks: string[] = [];
    allAchievementsWithProgress.forEach(ach => {
      ach.unlockedTiers.forEach((tier, index) => {
        const key = `${ach.id}-${index}`;
        if (!seenAchievements[key]) {
          newUnlocks.push(`${ach.title} (${tier.name})`);
        }
      });
    });

    if (newUnlocks.length > 0) {
      setNewlyUnlocked(newUnlocks);
      const timer = setTimeout(() => {
        setSeenAchievements(prev => {
          const updated = { ...prev };
          allAchievementsWithProgress.forEach(ach => {
            ach.unlockedTiers.forEach((tier, index) => {
              updated[`${ach.id}-${index}`] = true;
            });
          });
          return updated;
        });
      }, 500);
      const clearTimer = setTimeout(() => setNewlyUnlocked([]), 3500);
      return () => { clearTimeout(timer); clearTimeout(clearTimer); };
    }
  }, [allAchievementsWithProgress, seenAchievements, setSeenAchievements]);

    const seasonalStats = useMemo(() => {
        const statsByYear: { [year: string]: { [key in GoalMetric]?: number } & { matchesPlayed: number } } = {};
        const years = Array.from(new Set(matches.map(m => new Date(m.date).getFullYear())));
        
        years.forEach(year => {
            const yearMatches = matches.filter(m => new Date(m.date).getFullYear() === year);
            const totalMatches = yearMatches.length;
            if (totalMatches > 0) {
                const wins = yearMatches.filter(m => m.result === 'VICTORIA').length;
                const goals = yearMatches.reduce((sum, m) => sum + m.myGoals, 0);
                const assists = yearMatches.reduce((sum, m) => sum + m.myAssists, 0);
                const records = calculateHistoricalRecords(yearMatches);

                statsByYear[year] = {
                    matchesPlayed: totalMatches,
                    myGoals: goals,
                    myAssists: assists,
                    VICTORIA: wins,
                    winRate: (wins / totalMatches) * 100,
                    gpm: goals / totalMatches,
                    longestWinStreak: records.longestWinStreak.value,
                    longestUndefeatedStreak: records.longestUndefeatedStreak.value,
                };
            }
        });
        return statsByYear;
    }, [matches]);

    const historicalContext = useMemo(() => {
        let relevantMatches: Match[];

        if (periodType === 'all') {
            relevantMatches = matches;
        } else if (periodType === 'year') {
            relevantMatches = matches.filter(m => new Date(m.date).getFullYear().toString() === selectedYearForGoal);
        } else { // range
            if (!startMonth || !endMonth || startMonth > endMonth) {
                relevantMatches = [];
            } else {
                const [startY, startM] = startMonth.split('-').map(Number);
                const [endY, endM] = endMonth.split('-').map(Number);
                const startDate = new Date(startY, startM - 1, 1);
                const endDate = new Date(endY, endM, 0, 23, 59, 59); // End of the last day of the month
                relevantMatches = matches.filter(m => {
                    const matchDate = new Date(m.date);
                    return matchDate >= startDate && matchDate <= endDate;
                });
            }
        }

        const totalMatches = relevantMatches.length;
        if (totalMatches === 0) return { currentValue: 0, historicalBest: 0 };

        let currentValue: number;
        let historicalBest: number;
        
        const allSeasonalValues = Object.values(seasonalStats).map(s => s[goalMetric] || 0);

        switch (goalMetric) {
            case 'myGoals':
            case 'myAssists':
            case 'VICTORIA':
                currentValue = relevantMatches.reduce((sum, m) => {
                    if (goalMetric === 'VICTORIA') return m.result === 'VICTORIA' ? sum + 1 : sum;
                    return sum + (m[goalMetric] || 0);
                }, 0);
                historicalBest = Math.max(0, ...allSeasonalValues);
                break;
            case 'winRate':
                const wins = relevantMatches.filter(m => m.result === 'VICTORIA').length;
                currentValue = (wins / totalMatches) * 100;
                historicalBest = Math.max(0, ...allSeasonalValues);
                break;
            case 'gpm':
                const totalGoals = relevantMatches.reduce((sum, m) => sum + m.myGoals, 0);
                currentValue = totalGoals / totalMatches;
                historicalBest = Math.max(0, ...allSeasonalValues);
                break;
            case 'longestWinStreak':
            case 'longestUndefeatedStreak':
                const records = calculateHistoricalRecords(relevantMatches);
                currentValue = records[goalMetric].value;
                historicalBest = historicalRecords[goalMetric].value; // The all-time record is the historical best for streaks
                break;
            default:
                currentValue = 0;
                historicalBest = 0;
        }

        if (periodType === 'all') {
            historicalBest = currentValue;
        }

        return { currentValue, historicalBest };
    }, [matches, goalMetric, periodType, selectedYearForGoal, startMonth, endMonth, seasonalStats, historicalRecords]);

    const suggestedTargets = useMemo(() => {
        const { currentValue, historicalBest } = historicalContext;
        let realistic: number, ambitious: number;

        switch (goalMetric) {
            case 'myGoals':
            case 'myAssists':
            case 'VICTORIA':
                realistic = Math.ceil(currentValue * 1.15) || 5;
                ambitious = Math.ceil(historicalBest * 1.1) || 10;
                break;
            case 'winRate':
                realistic = Math.min(100, Math.ceil((currentValue + 5) / 5) * 5);
                ambitious = Math.min(100, Math.ceil((historicalBest + 2) / 5) * 5);
                break;
            case 'gpm':
                realistic = parseFloat((currentValue * 1.15).toFixed(2)) || 0.5;
                ambitious = parseFloat((historicalBest * 1.1).toFixed(2)) || 1;
                break;
            case 'longestWinStreak':
            case 'longestUndefeatedStreak':
                realistic = currentValue + 1;
                ambitious = historicalBest + 1;
                break;
            default:
                realistic = 1;
                ambitious = 2;
        }
        
        if (ambitious <= realistic) {
            ambitious = realistic + (['winRate'].includes(goalMetric) ? 5 : ['gpm'].includes(goalMetric) ? 0.25 : Math.max(1, Math.ceil(realistic * 0.2)));
            if (goalMetric === 'winRate') ambitious = Math.min(100, ambitious);
            if (goalMetric === 'gpm') ambitious = parseFloat(ambitious.toFixed(2));
        }

        return { realistic: Math.max(1, realistic), ambitious: Math.max(1, ambitious) };
    }, [historicalContext, goalMetric]);

    const difficultyLabel = useMemo(() => {
        const target = Number(goalTarget);
        if (!target) return '';
        const { currentValue, historicalBest } = historicalContext;
        if (target <= currentValue) return 'Fácil';
        if (target <= historicalBest) return 'Desafiante';
        if (target > historicalBest * 1.5) return '¡Épica!';
        if (target > historicalBest) return '¡Nuevo Récord!';
        return 'Ambicioso';
    }, [goalTarget, historicalContext]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(goalTarget);
    if (!target || target <= 0) return;

    let startDate: string | undefined;
    let endDate: string | undefined;

    if (periodType === 'year') {
        startDate = `${selectedYearForGoal}-01-01`;
        endDate = `${selectedYearForGoal}-12-31`;
    } else if (periodType === 'range' && startMonth && endMonth) {
        const [startY, startM] = startMonth.split('-').map(Number);
        const [endY, endM] = endMonth.split('-').map(Number);
        
        startDate = `${startY}-${String(startM).padStart(2, '0')}-01`;
        const lastDayOfMonth = new Date(endY, endM, 0).getDate();
        endDate = `${endY}-${String(endM).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    }
    
    addGoal({ metric: goalMetric, target, title: goalTitle, startDate, endDate });
    setGoalTarget('');
    setGoalTitle('');
    setIsTitleManuallyEdited(false);
  };

  const handleGenerateAdvice = async () => {
    setIsGeneratingAdvice(true);
    setAdviceError(null);
    setAiAchievementSuggestions([]);
    try {
        const achievementSuggestions = await generateAchievementSuggestions(matches, [...achievementsList, ...customAchievements]);
        setAiAchievementSuggestions(achievementSuggestions);
        if (achievementSuggestions.length > 0) addAIInteraction('achievement_suggestion', achievementSuggestions);
    } catch (error: any) {
        setAdviceError(error.message || "Error al generar consejos.");
    } finally {
        setIsGeneratingAdvice(false);
    }
  };
  
  const handleAddSuggestionAsAchievement = (suggestion: AIAchievementSuggestion) => {
    addCustomAchievement(suggestion);
    setAiAchievementSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
  };

  const getProgressForGoal = (goal: Goal) => {
    const relevantMatches = goal.startDate && goal.endDate
        ? matches.filter(m => {
            const matchDate = new Date(m.date);
            // Simple string comparison is not reliable, convert to dates
            const startDate = new Date(goal.startDate!);
            const endDate = new Date(goal.endDate!);
            // Set time to 0 to compare dates only
            matchDate.setHours(0,0,0,0);
            startDate.setHours(0,0,0,0);
            endDate.setHours(0,0,0,0);
            return matchDate >= startDate && matchDate <= endDate;
        })
        : matches;

    const records = calculateHistoricalRecords(relevantMatches);
    const totalMatches = relevantMatches.length;

    switch (goal.metric) {
        case 'myGoals': return relevantMatches.reduce((sum, m) => sum + m.myGoals, 0);
        case 'myAssists': return relevantMatches.reduce((sum, m) => sum + m.myAssists, 0);
        case 'VICTORIA': return relevantMatches.filter(m => m.result === 'VICTORIA').length;
        case 'winRate': return totalMatches > 0 ? (relevantMatches.filter(m => m.result === 'VICTORIA').length / totalMatches) * 100 : 0;
        case 'gpm': return totalMatches > 0 ? relevantMatches.reduce((sum, m) => sum + m.myGoals, 0) / totalMatches : 0;
        case 'longestWinStreak': return records.longestWinStreak.value;
        case 'longestUndefeatedStreak': return records.longestUndefeatedStreak.value;
        default: return 0;
    }
  };
  
  const debouncedGenerateTitle = useCallback(
    debounce(async (metric: GoalMetric, target: number, period: string) => {
      if (isTitleManuallyEdited || target <= 0) return;
      setIsGeneratingTitle(true);
      const title = await generateCreativeGoalTitle(metricLabels[metric], target, period);
      setGoalTitle(title);
      setIsGeneratingTitle(false);
    }, 1000),
    [isTitleManuallyEdited]
  );
  
  const periodTextForAI = useMemo(() => {
    if (periodType === 'all') return 'histórico';
    if (periodType === 'year') return `la temporada ${selectedYearForGoal}`;
    if (periodType === 'range' && startMonth && endMonth) {
        const [startY, startM] = startMonth.split('-').map(Number);
        const [endY, endM] = endMonth.split('-').map(Number);
        const formatMonth = (year: number, month: number) => new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });

        if (startMonth === endMonth) return `${formatMonth(startY, startM)} de ${startY}`;
        if (startY === endY) return `entre ${formatMonth(startY, startM)} y ${formatMonth(endY, endM)} de ${startY}`;
        return `de ${formatMonth(startY, startM)} ${startY} a ${formatMonth(endY, endM)} ${endY}`;
    }
    return '';
  }, [periodType, selectedYearForGoal, startMonth, endMonth]);
  
  useEffect(() => {
    const target = Number(goalTarget);
    if (target > 0 && !isTitleManuallyEdited && periodTextForAI) {
      debouncedGenerateTitle(goalMetric, target, periodTextForAI);
    }
  }, [goalTarget, goalMetric, periodTextForAI, isTitleManuallyEdited, debouncedGenerateTitle]);

  const { historicalGoals, seasonalGoals } = useMemo(() => {
    const historical: Goal[] = [];
    const seasonal: Goal[] = [];
    goals.forEach(g => {
        if (g.startDate && g.endDate) {
            seasonal.push(g);
        } else {
            historical.push(g);
        }
    });
    seasonal.sort((a,b) => new Date(b.startDate!).getTime() - new Date(a.startDate!).getTime());
    return { historicalGoals: historical, seasonalGoals: seasonal };
  }, [goals]);
  
  const availableYears = useMemo(() => Array.from(new Set(matches.map(m => new Date(m.date).getFullYear()))).sort((a, b) => b - a), [matches]);

  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    matches.forEach(m => {
        const date = new Date(m.date);
        monthSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(monthSet).sort().reverse();
  }, [matches]);

  useEffect(() => {
    if(availableMonths.length > 0 && !startMonth) {
        setStartMonth(availableMonths[0]);
        setEndMonth(availableMonths[0]);
    }
  }, [availableMonths, startMonth]);
  
  useEffect(() => {
    if (startMonth > endMonth) {
      setEndMonth(startMonth);
    }
  }, [startMonth, endMonth]);
  
  const endMonthOptions = useMemo(() => {
    return availableMonths.filter(month => month <= startMonth); // reverse sorted, so <= works
  }, [availableMonths, startMonth]);

  const formatMonthYear = (monthYear: string) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  };
  
  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.extraLarge },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent2}`, paddingLeft: theme.spacing.medium },
    sectionTitle: { fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText, marginBottom: theme.spacing.large, paddingLeft: theme.spacing.medium, display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    section: { display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.large },
    form: { display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.large },
    formRow: { display: 'flex', gap: theme.spacing.medium, alignItems: 'flex-start', flexWrap: 'wrap' as 'wrap' },
    fieldGroup: { display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.small, flex: 1, minWidth: '120px' },
    label: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 500, height: '1.2em' },
    input: { width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium },
    button: { padding: '0.875rem 1.25rem', backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent, border: 'none', borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end', marginTop: '1.2rem' },
    goalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: theme.spacing.large },
    achievementsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: theme.spacing.large },
    achievementCard: { display: 'flex', flexDirection: 'column' as 'column', gap: '0.75rem' },
    achHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
    achTitle: { margin: 0, fontSize: theme.typography.fontSize.large, color: theme.colors.primaryText, flex: 1 },
    achTiers: { display: 'flex', gap: '0.5rem', fontSize: '1.5rem' },
    achTierIcon: { opacity: 0.3 },
    unlockedTier: { opacity: 1 },
    description: { margin: 0, fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, lineHeight: 1.6 },
    notification: { position: 'fixed' as 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: theme.colors.surface, color: theme.colors.primaryText, padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderRadius: theme.borderRadius.medium, boxShadow: theme.shadows.large, border: `1px solid ${theme.colors.accent1}`, zIndex: 9999, display: 'flex', alignItems: 'center', gap: theme.spacing.medium, animation: 'notification-fade-in-out 3s ease-in-out forwards' },
    headerCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    aiButton: { background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`, border: 'none', color: theme.name === 'dark' ? '#121829' : '#FFFFFF', padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderRadius: theme.borderRadius.medium, cursor: 'pointer', fontWeight: 700, fontSize: theme.typography.fontSize.medium, display: 'inline-flex', alignItems: 'center', gap: theme.spacing.small, transition: 'opacity 0.2s', alignSelf: 'center' },
    suggestionCard: { border: `1px dashed ${theme.colors.accent2}`, display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.medium },
    suggestionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.medium },
    suggestionTitle: { margin: 0, fontSize: '1rem', fontWeight: 'bold', flex: 1, minWidth: 0 },
    addSuggestionButton: { background: 'none', border: `1px solid ${theme.colors.win}`, color: theme.colors.win, borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    deleteCustomButton: { position: 'absolute' as 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: theme.colors.secondaryText, cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, padding: '0.25rem' },
    suggestionSubtitle: { fontSize: theme.typography.fontSize.medium, fontWeight: 700, color: theme.colors.primaryText, margin: `0 0 ${theme.spacing.medium} 0`, paddingBottom: theme.spacing.small, borderBottom: `1px solid ${theme.colors.border}` },
    contextBox: { backgroundColor: theme.colors.background, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, border: `1px solid ${theme.colors.border}`, textAlign: 'center' as 'center'},
    suggestionButton: { background: theme.colors.surface, border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.primaryText, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium, flex: 1, cursor: 'pointer', textAlign: 'center' as 'center' },
    difficultyLabel: { fontSize: theme.typography.fontSize.extraSmall, fontWeight: 600, color: theme.colors.accent2, height: '1em' },
    periodTypeSelector: { display: 'flex' },
    periodTypeButton: { flex: 1, background: 'none', border: `1px solid ${theme.colors.borderStrong}`, borderRight: 'none', color: theme.colors.secondaryText, padding: '0.5rem', cursor: 'pointer', fontWeight: 600 },
    periodTypeButtonFirst: { borderRadius: `${theme.borderRadius.medium} 0 0 ${theme.borderRadius.medium}`},
    periodTypeButtonLast: { borderRight: `1px solid ${theme.colors.borderStrong}`, borderRadius: `0 ${theme.borderRadius.medium} ${theme.borderRadius.medium} 0`},
    activePeriodType: { backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText },
  };

  const notificationText = newlyUnlocked.length === 1 ? `¡Has desbloqueado ${newlyUnlocked[0]}!` : `¡Has desbloqueado ${newlyUnlocked.length} nuevo(s) logro(s)!`;

  return (
    <>
      <style>{`@keyframes notification-fade-in-out { 0%, 100% { opacity: 0; transform: translate(-50%, -20px); } 15%, 85% { opacity: 1; transform: translate(-50%, 0); } }`}</style>
      <main style={styles.container}>
        {newlyUnlocked.length > 0 && <div style={styles.notification}><TrophyIcon /><span>{notificationText}</span></div>}
        <h2 style={styles.pageTitle}>Mi progreso</h2>
        
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><TargetIcon color={theme.colors.accent1} /> Metas</h3>
          <Card title="Constructor de metas inteligente">
            <form onSubmit={handleAddGoal} style={styles.form}>
              <div style={styles.formRow}>
                  <div style={styles.fieldGroup}>
                      <label style={styles.label}>1. Elige una métrica</label>
                      <select value={goalMetric} onChange={e => setGoalMetric(e.target.value as GoalMetric)} style={styles.input}>
                          {Object.entries(metricLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>2. Elige un período</label>
                    <div style={styles.periodTypeSelector}>
                        <button type="button" onClick={() => setPeriodType('year')} style={periodType === 'year' ? {...styles.periodTypeButton, ...styles.periodTypeButtonFirst, ...styles.activePeriodType} : {...styles.periodTypeButton, ...styles.periodTypeButtonFirst}}>Temporada</button>
                        <button type="button" onClick={() => setPeriodType('range')} style={periodType === 'range' ? {...styles.periodTypeButton, ...styles.activePeriodType} : styles.periodTypeButton}>Meses</button>
                        <button type="button" onClick={() => setPeriodType('all')} style={periodType === 'all' ? {...styles.periodTypeButton, ...styles.periodTypeButtonLast, ...styles.activePeriodType} : {...styles.periodTypeButton, ...styles.periodTypeButtonLast}}>Histórico</button>
                    </div>
                  </div>
              </div>
                
              {periodType === 'year' && (
                  <div style={styles.fieldGroup}>
                      <select value={selectedYearForGoal} onChange={e => setSelectedYearForGoal(e.target.value)} style={styles.input}>
                          {availableYears.map(year => <option key={year} value={year.toString()}>Temporada {year}</option>)}
                      </select>
                  </div>
              )}
              {periodType === 'range' && (
                  <div style={styles.formRow}>
                      <div style={styles.fieldGroup}>
                          <label style={styles.label}>Desde</label>
                          <select value={startMonth} onChange={e => setStartMonth(e.target.value)} style={styles.input}>
                              {availableMonths.map(month => <option key={month} value={month}>{formatMonthYear(month)}</option>)}
                          </select>
                      </div>
                      <div style={styles.fieldGroup}>
                          <label style={styles.label}>Hasta</label>
                           <select value={endMonth} onChange={e => setEndMonth(e.target.value)} style={styles.input}>
                              {endMonthOptions.map(month => <option key={month} value={month}>{formatMonthYear(month)}</option>)}
                          </select>
                      </div>
                  </div>
              )}

              <div style={styles.contextBox}>
                <strong>Contexto:</strong> Valor actual del período <strong>{historicalContext.currentValue.toFixed(2)}</strong> / Récord histórico <strong>{historicalContext.historicalBest.toFixed(2)}</strong>.
              </div>

              <div>
                <label style={styles.label}>3. Establece un objetivo</label>
                <div style={{...styles.formRow, alignItems: 'stretch' }}>
                    <button type="button" onClick={() => setGoalTarget(suggestedTargets.realistic)} style={styles.suggestionButton}>
                      <div style={{fontWeight: 700}}>Meta Realista</div>
                      <div style={{fontSize: '1.5rem', color: theme.colors.accent1}}>{suggestedTargets.realistic.toFixed(goalMetric === 'gpm' || goalMetric === 'winRate' ? 2 : 0)}</div>
                    </button>
                    <button type="button" onClick={() => setGoalTarget(suggestedTargets.ambitious)} style={styles.suggestionButton}>
                      <div style={{fontWeight: 700}}>Meta Ambiciosa</div>
                      <div style={{fontSize: '1.5rem', color: theme.colors.accent2}}>{suggestedTargets.ambitious.toFixed(goalMetric === 'gpm' || goalMetric === 'winRate' ? 2 : 0)}</div>
                    </button>
                    <div style={{...styles.fieldGroup, flex: 0.8}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                          <label style={{...styles.label, height: 'auto'}}>Personalizada</label>
                          <span style={styles.difficultyLabel}>{difficultyLabel}</span>
                      </div>
                      <input type="number" step="0.01" min="1" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} style={styles.input} placeholder="Ej: 20" required/>
                  </div>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                  <label style={styles.label}>4. Nombra tu meta {isGeneratingTitle && <Loader />}</label>
                  <input type="text" value={goalTitle} onChange={e => { setGoalTitle(e.target.value); setIsTitleManuallyEdited(true); }} style={styles.input} placeholder="Título creativo de la meta..." required/>
              </div>

              <button type="submit" style={styles.button}>Añadir meta</button>
            </form>
          </Card>
        </section>
        
        {seasonalGoals.length > 0 && (
            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Metas de temporada</h3>
                <div style={styles.goalsGrid}>{seasonalGoals.map(goal => <GoalCard key={goal.id} goal={goal} progress={getProgressForGoal(goal)} onDelete={() => deleteGoal(goal.id)} />)}</div>
            </section>
        )}
        {historicalGoals.length > 0 && (
            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Metas Históricas</h3>
                <div style={styles.goalsGrid}>{historicalGoals.map(goal => <GoalCard key={goal.id} goal={goal} progress={getProgressForGoal(goal)} onDelete={() => deleteGoal(goal.id)} />)}</div>
            </section>
        )}
        
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><TrophyIcon size={24} /> Vitrina de trofeos</h3>
           <Card>
              <div style={{display: 'flex', flexDirection: 'column', gap: theme.spacing.extraLarge}}>
                <div>
                    <h4 style={{...styles.sectionTitle, fontSize: '1.1rem', color: theme.colors.secondaryText, border: 'none', paddingLeft: 0, marginBottom: theme.spacing.medium}}>Logros principales</h4>
                    <div style={styles.achievementsGrid}>
                      {allAchievementsWithProgress.map(ach => {
                        const isUnlocked = ach.unlockedTiers.length > 0;
                        if (ach.isSecret && !isUnlocked) return null;

                        const nextTier = ach.nextTier;
                        const progressPercentage = nextTier ? Math.min((ach.currentProgress / nextTier.target) * 100, 100) : 100;

                        return (
                          <Card key={ach.id} style={{...styles.achievementCard, opacity: isUnlocked ? 1 : 0.5}}>
                            <div style={styles.achHeader}>
                              <h4 style={styles.achTitle}>{ach.title}</h4>
                              <div style={styles.achTiers}>
                                {ach.tiers.map((tier, index) => (
                                  <span key={index} style={ach.unlockedTiers.includes(tier) ? styles.unlockedTier : styles.achTierIcon} title={`${tier.name}: ${tier.target}`}>
                                    {tier.icon}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p style={styles.description}>{ach.description}</p>
                            {nextTier && (
                                <div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem'}}>
                                        <span style={{fontSize: '0.75rem', color: theme.colors.secondaryText}}>Próximo: {nextTier.name}</span>
                                        <span style={{fontSize: '0.875rem', fontWeight: 700, color: theme.colors.primaryText}}>{ach.currentProgress} / {nextTier.target}</span>
                                    </div>
                                    <div style={{width: '100%', backgroundColor: theme.colors.border, borderRadius: '6px', overflow: 'hidden', height: '6px' }}>
                                        <div style={{ height: '100%', backgroundColor: theme.colors.accent2, transition: 'width 0.5s ease', borderRadius: '6px', width: `${progressPercentage}%` }} />
                                    </div>
                                </div>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                </div>
                 <section style={styles.section}>
                    <h3 style={{...styles.sectionTitle, fontSize: '1.1rem', color: theme.colors.secondaryText, border: 'none', paddingLeft: 0, marginBottom: theme.spacing.medium}}><SparklesIcon /> Desafíos del Entrenador IA</h3>
                    <div style={styles.achievementsGrid}>
                        {customAchievements.map(ach => (
                          <Card key={ach.id} style={{...styles.achievementCard, opacity: ach.unlocked ? 1 : 0.5, position: 'relative'}}>
                            <button onClick={() => deleteCustomAchievement(ach.id)} style={styles.deleteCustomButton} aria-label="Eliminar logro">&times;</button>
                            <div style={styles.achHeader}>
                                <h4 style={styles.achTitle}>{ach.title}</h4>
                                <div style={styles.achTiers}><span style={{opacity: ach.unlocked ? 1 : 0.4}}>{ach.icon}</span></div>
                            </div>
                            <p style={styles.description}>{ach.description}</p>
                          </Card>
                        ))}
                        {aiAchievementSuggestions.map((s, i) => (
                          <Card key={`ach-sugg-${i}`} style={styles.suggestionCard}>
                            <div style={styles.suggestionHeader}>
                                <h4 style={styles.suggestionTitle}>{s.icon} {s.title}</h4>
                                <button onClick={() => handleAddSuggestionAsAchievement(s)} style={styles.addSuggestionButton} aria-label="Añadir desafío sugerido">+</button>
                            </div>
                            <p style={styles.description}>{s.description}</p>
                          </Card>
                        ))}
                    </div>
                    {!isGeneratingAdvice && <button onClick={handleGenerateAdvice} style={styles.aiButton} disabled={matches.length < 5}>{matches.length < 5 ? 'Necesitas 5 partidos' : 'Generar nuevos desafíos'}</button>}
                    {isGeneratingAdvice && <div style={{display: 'flex', justifyContent: 'center', padding: '1rem'}}><Loader /></div>}
                    {adviceError && <p style={{color: theme.colors.loss, textAlign: 'center'}}>{adviceError}</p>}
                </section>
              </div>
           </Card>
        </section>
      </main>
    </>
  );
};

// Helper to prevent excessive API calls
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  
  return debounced as (...args: Parameters<F>) => void;
}


export default ProgressPage;