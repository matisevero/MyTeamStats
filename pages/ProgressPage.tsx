import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Goal, GoalMetric, AIAchievementSuggestion, CustomAchievement, Match, AchievementConditionMetric, Achievement } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import Card from '../components/common/Card';
import { achievementsList } from '../data/achievements';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { TargetIcon } from '../components/icons/TargetIcon';
import { calculateHistoricalRecords, evaluateCustomAchievement } from '../utils/analytics';
import { generateAchievementSuggestions, generateCreativeGoalTitle } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Loader } from '../components/Loader';
import { ChevronIcon } from '../components/icons/ChevronIcon';

const metricLabels: Record<GoalMetric, string> = {
  myGoals: 'Goles',
  points: 'Puntos',
  efectividad: 'Efectividad',
  cleanSheets: 'Vallas Invictas',
  longestWinStreak: 'Racha de Victorias',
  longestUndefeatedStreak: 'Racha de Partidos Invictos',
  winRate: '% de Victorias',
  VICTORIA: 'Partidos Ganados'
};
const metricIcons: Record<GoalMetric, React.ReactNode> = {
  myGoals: <span style={{ fontSize: '1.5rem' }}>⚽️</span>,
  VICTORIA: <span style={{ fontSize: '1.5rem' }}>✅</span>,
  winRate: <span style={{ fontSize: '1.5rem' }}>📈</span>,
  longestWinStreak: <span style={{ fontSize: '1.5rem' }}>🔥</span>,
  longestUndefeatedStreak: <span style={{ fontSize: '1.5rem' }}>🛡️</span>,
  points: <span style={{ fontSize: '1.5rem' }}>🏆</span>,
  efectividad: <span style={{ fontSize: '1.5rem' }}>🎯</span>,
  cleanSheets: <span style={{ fontSize: '1.5rem' }}>🧤</span>,
};

const creatableAchievementMetricLabels: Partial<Record<AchievementConditionMetric, string>> = {
  winStreak: 'Racha de victorias',
  undefeatedStreak: 'Racha sin perder',
  goalStreak: 'Racha marcando goles',
  assistStreak: 'Racha asistiendo',
  breakWinAfterLossStreak: 'Victoria tras racha de derrotas',
};

const formatPeriod = (startDate?: string, endDate?: string): string => {
    if (!startDate || !endDate) return "Histórico";
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startUTC = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const endUTC = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

    if (startUTC.getUTCDate() === 1 && endUTC.getUTCDate() >= 28 && startUTC.getUTCMonth() === 0 && endUTC.getUTCMonth() === 11 && startUTC.getUTCFullYear() === endUTC.getUTCFullYear()) {
        return `Temporada ${startUTC.getUTCFullYear()}`;
    }
    
    const startMonth = startUTC.toLocaleString('es-ES', { month: 'short' });

    if (startUTC.getUTCFullYear() === endUTC.getUTCFullYear() && startUTC.getUTCMonth() === endUTC.getUTCMonth()) {
        const monthName = startUTC.toLocaleString('es-ES', { month: 'long' });
        return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${startUTC.getUTCFullYear()}`;
    }
    
    return `${startMonth}. ${startUTC.getUTCFullYear()} - ${endUTC.toLocaleString('es-ES', { month: 'short' })}. ${endUTC.getUTCFullYear()}`;
};

// Debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
};


const GoalCard: React.FC<{ goal: Goal; progress: number; onDelete: () => void; }> = ({ goal, progress, onDelete }) => {
    const { theme } = useTheme();
    const { isShareMode } = useData();
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
            {!isShareMode && <button onClick={onDelete} style={styles.deleteButton} aria-label="Eliminar meta">&times;</button>}
            <div style={styles.goalHeader}>
                {metricIcons[goal.metric]}
                <div style={styles.goalTitleContainer}>
                    <h4 style={styles.goalTitle}>{goal.title}</h4>
                    <p style={styles.goalPeriod}>{formatPeriod(goal.startDate, goal.endDate)}</p>
                </div>
            </div>
            <div>
                <div style={styles.progressInfo}><span style={styles.progressText}>Progreso</span><span style={styles.progressValue}>{progress.toFixed(['efectividad', 'winRate'].includes(goal.metric) ? 1 : 0)} / {goal.target}</span></div>
                <div style={styles.progressBarContainer}><div style={{ ...styles.progressBar, width: `${progressPercentage}%` }} /></div>
            </div>
        </Card>
    );
};

const ProgressPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, goals, addGoal, deleteGoal, customAchievements, addCustomAchievement, deleteCustomAchievement, addAIInteraction, isShareMode } = useData();
  
  const [activeView, setActiveView] = useState<'goals' | 'achievements'>('goals');
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
  const [showCompletedAchievements, setShowCompletedAchievements] = useState(false);

  // State for Goal Constructor
  const [goalMetric, setGoalMetric] = useState<GoalMetric>('myGoals');
  const [goalTarget, setGoalTarget] = useState<number | string>('');
  const [goalTitle, setGoalTitle] = useState('');
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(`season-${new Date().getFullYear().toString()}`);

  const { periodType, periodValue } = useMemo(() => {
    if (selectedPeriod === 'all-time') {
      return { periodType: 'all-time' as const, periodValue: 'all-time' };
    }
    const [type, ...valueParts] = selectedPeriod.split('-');
    return { periodType: type as 'season' | 'month', periodValue: valueParts.join('-') };
  }, [selectedPeriod]);


  // State for Achievement Constructor
  const [achTitle, setAchTitle] = useState('');
  const [achDescription, setAchDescription] = useState('');
  const [achIcon, setAchIcon] = useState('🏆');
  const [achMetric, setAchMetric] = useState<AchievementConditionMetric>('winStreak');
  const [achValue, setAchValue] = useState<number | string>('');

  // State for AI Suggestions
  const [aiAchievementSuggestions, setAiAchievementSuggestions] = useState<AIAchievementSuggestion[]>([]);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  const historicalRecords = useMemo(() => calculateHistoricalRecords(matches), [matches]);
  
  const getRelevantMatches = useCallback((pType: typeof periodType, pValue: typeof periodValue) => {
    if (pType === 'all-time') {
      return matches;
    } else if (pType === 'season') {
      return matches.filter(m => new Date(m.date).getFullYear().toString() === pValue);
    } else { // month
      const [year, month] = pValue.split('-').map(Number);
      return matches.filter(m => {
          const d = new Date(m.date);
          return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1;
      });
    }
  }, [matches]);

  const historicalContext = useMemo(() => {
    const relevantMatches = getRelevantMatches(periodType, periodValue);
    const totalMatches = relevantMatches.length;
    if (totalMatches === 0) return { currentValue: 0, historicalBest: 0 };
    
    let currentValue: number = 0;
    const records = calculateHistoricalRecords(relevantMatches);

    const points = relevantMatches.reduce((sum, m) => sum + (m.result === 'VICTORIA' ? 3 : m.result === 'EMPATE' ? 1 : 0), 0);

    switch (goalMetric) {
        case 'myGoals': currentValue = relevantMatches.reduce((sum, m) => sum + m.myGoals, 0); break;
        case 'points': currentValue = points; break;
        case 'efectividad': currentValue = totalMatches > 0 ? (points / (totalMatches * 3)) * 100 : 0; break;
        case 'cleanSheets': currentValue = relevantMatches.filter(m => m.opponentScore === 0).length; break;
        case 'longestWinStreak': currentValue = records.longestWinStreak.value; break;
        case 'longestUndefeatedStreak': currentValue = records.longestUndefeatedStreak.value; break;
        case 'winRate': currentValue = totalMatches > 0 ? (relevantMatches.filter(m => m.result === 'VICTORIA').length / totalMatches) * 100 : 0; break;
        case 'VICTORIA': currentValue = relevantMatches.filter(m => m.result === 'VICTORIA').length; break;
    }

    return { currentValue, historicalBest: 0 }; // Historical best needs more complex logic across all periods
  }, [matches, goalMetric, periodType, periodValue, getRelevantMatches]);
    
    const suggestedTargets = useMemo(() => {
        const { currentValue } = historicalContext;
        let realistic = Math.ceil(currentValue * 1.15) || 5;
        let ambitious = Math.ceil(currentValue * 1.5) || 10;
        
        if (goalMetric.includes('Rate') || goalMetric.includes('efectividad')) {
            realistic = Math.min(100, Math.ceil((currentValue + 5) / 5) * 5);
            ambitious = Math.min(100, Math.ceil((currentValue + 10) / 5) * 5);
        } else if (goalMetric.includes('Streak')) {
            realistic = currentValue + 1;
            ambitious = currentValue + 2;
        }

        if (ambitious <= realistic) {
          ambitious = realistic + (goalMetric.includes('Rate') ? 5 : 1);
        }

        return { realistic: Math.max(1, realistic), ambitious: Math.max(1, ambitious) };
    }, [historicalContext, goalMetric]);
    
    const difficultyLabel = useMemo(() => {
        const target = Number(goalTarget);
        if (!target) return '';
        const { currentValue } = historicalContext;
        if (target <= currentValue) return 'Fácil';
        if (target <= suggestedTargets.realistic) return 'Desafiante';
        if (target > suggestedTargets.ambitious * 1.5) return '¡Épica!';
        if (target > suggestedTargets.ambitious) return '¡Nuevo Récord!';
        return 'Ambicioso';
    }, [goalTarget, historicalContext, suggestedTargets]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(goalTarget);
    if (!target || target <= 0) return;

    let startDate: string | undefined;
    let endDate: string | undefined;
    
    if (periodType === 'season') {
        startDate = `${periodValue}-01-01`;
        endDate = `${periodValue}-12-31`;
    } else if (periodType === 'month') {
        const [year, month] = periodValue.split('-');
        startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toISOString().split('T')[0];
        const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
        endDate = new Date(Date.UTC(Number(year), Number(month) - 1, lastDay, 23, 59, 59)).toISOString().split('T')[0];
    }
    
    addGoal({ metric: goalMetric, target, title: goalTitle, startDate, endDate });
    setGoalTarget('');
    setGoalTitle('');
    setIsTitleManuallyEdited(false);
  };
  
  const handleAddCustomAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(achValue);
    if (!achTitle.trim() || !achDescription.trim() || !achIcon.trim() || !value || value <= 0) {
        alert("Por favor, completa todos los campos del desafío con un objetivo válido.");
        return;
    }

    const newAchievement: Omit<CustomAchievement, 'id' | 'unlocked'> = {
      title: achTitle.trim(),
      description: achDescription.trim(),
      icon: achIcon.trim(),
      condition: {
        metric: achMetric,
        operator: 'greater_than_or_equal_to',
        value: value,
        window: value,
      }
    };
    addCustomAchievement(newAchievement);

    // Reset form
    setAchTitle('');
    setAchDescription('');
    setAchIcon('🏆');
    setAchMetric('winStreak');
    setAchValue('');
  };

  const handleGenerateAdvice = async () => {
    setIsGeneratingAdvice(true);
    setAdviceError(null);
    setAiAchievementSuggestions([]);
    try {
        const allCurrentAchievements = [...achievementsList, ...customAchievements];
        const achievementSuggestions = await generateAchievementSuggestions(matches, allCurrentAchievements);
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

  const getProgressForGoal = useCallback((goal: Goal) => {
    const relevantMatches = goal.startDate && goal.endDate
        ? matches.filter(m => {
            const matchDate = new Date(m.date);
            const startDate = new Date(goal.startDate!);
            const endDate = new Date(goal.endDate!);
            // Adjust for timezone by using UTC dates for comparison
            const matchUTCDate = new Date(Date.UTC(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate()));
            const startUTCDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
            const endUTCDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
            return matchUTCDate >= startUTCDate && matchUTCDate <= endUTCDate;
        })
        : matches;

    const records = calculateHistoricalRecords(relevantMatches);
    const totalMatches = relevantMatches.length;
    const points = relevantMatches.reduce((sum, m) => sum + (m.result === 'VICTORIA' ? 3 : m.result === 'EMPATE' ? 1 : 0), 0);

    switch (goal.metric) {
        case 'myGoals': return relevantMatches.reduce((sum, m) => sum + m.myGoals, 0);
        case 'points': return points;
        case 'efectividad': return totalMatches > 0 ? (points / (totalMatches * 3)) * 100 : 0;
        case 'cleanSheets': return relevantMatches.filter(m => m.opponentScore === 0).length;
        case 'VICTORIA': return relevantMatches.filter(m => m.result === 'VICTORIA').length;
        case 'winRate': return totalMatches > 0 ? (relevantMatches.filter(m => m.result === 'VICTORIA').length / totalMatches) * 100 : 0;
        case 'longestWinStreak': return records.longestWinStreak.value;
        case 'longestUndefeatedStreak': return records.longestUndefeatedStreak.value;
        default: return 0;
    }
  }, [matches]);

  const { activeGoals, completedGoals } = useMemo(() => {
    const active: Goal[] = [];
    const completed: Goal[] = [];
    goals.forEach(goal => {
        const progress = getProgressForGoal(goal);
        if (progress >= goal.target) {
            completed.push(goal);
        } else {
            active.push(goal);
        }
    });
    completed.sort((a,b) => (b.startDate && a.startDate) ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime() : 0);
    return { activeGoals: active, completedGoals: completed };
  }, [goals, getProgressForGoal]);

  const { activeCustomAchievements, completedCustomAchievements } = useMemo(() => {
    const active: CustomAchievement[] = [];
    const completed: CustomAchievement[] = [];
    customAchievements.forEach(ach => {
      if (evaluateCustomAchievement(ach, matches)) {
        completed.push(ach);
      } else {
        active.push(ach);
      }
    });
    return { activeCustomAchievements: active, completedCustomAchievements: completed };
  }, [customAchievements, matches]);
  
  const debouncedGenerateTitle = useCallback(
    debounce(async (metric: GoalMetric, target: number, period: string) => {
      if (isShareMode || isTitleManuallyEdited || target <= 0) return;
      setIsGeneratingTitle(true);
      const title = await generateCreativeGoalTitle(metricLabels[metric], target, period);
      setGoalTitle(title);
      setIsGeneratingTitle(false);
    }, 1000),
    [isTitleManuallyEdited, isShareMode]
  );
  
  const periodTextForAI = useMemo(() => {
    if (periodType === 'all-time') return 'histórico';
    if (periodType === 'season') return `la temporada ${periodValue}`;
    if (periodType === 'month') {
        const [year, month] = periodValue.split('-');
        return `${new Date(Number(year), Number(month) - 1).toLocaleString('es-ES', { month: 'long' })} de ${year}`;
    }
    return '';
  }, [periodType, periodValue]);
  
  useEffect(() => {
    const target = Number(goalTarget);
    if (target > 0 && !isTitleManuallyEdited && periodTextForAI) {
      debouncedGenerateTitle(goalMetric, target, periodTextForAI);
    }
  }, [goalTarget, goalMetric, periodTextForAI, isTitleManuallyEdited, debouncedGenerateTitle]);
  
  const seasonOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear + 1, currentYear + 2].map(String);
  }, []);

  const monthOptions = useMemo(() => {
    const options: { value: string, label: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1);
        const label = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        options.push({ value: `${year}-${month}`, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  }, []);
  
  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.large },
    pageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.large,
        flexWrap: 'wrap' as 'wrap',
        marginBottom: theme.spacing.medium,
    },
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
    aiButton: { background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`, border: 'none', color: theme.name === 'dark' ? '#121829' : '#FFFFFF', padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderRadius: theme.borderRadius.medium, cursor: 'pointer', fontWeight: 700, fontSize: theme.typography.fontSize.medium, display: 'inline-flex', alignItems: 'center', gap: theme.spacing.small, transition: 'opacity 0.2s', alignSelf: 'center' },
    suggestionCard: { border: `1px dashed ${theme.colors.accent2}`, display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.medium },
    suggestionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.medium },
    suggestionTitle: { margin: 0, fontSize: '1rem', fontWeight: 'bold', flex: 1, minWidth: 0 },
    addSuggestionButton: { background: 'none', border: `1px solid ${theme.colors.win}`, color: theme.colors.win, borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    contextBox: { backgroundColor: theme.colors.background, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, border: `1px solid ${theme.colors.border}`, textAlign: 'center' as 'center'},
    suggestionButton: { background: theme.colors.surface, border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.primaryText, padding: theme.spacing.medium, borderRadius: theme.borderRadius.medium, flex: 1, cursor: 'pointer', textAlign: 'center' as 'center' },
    difficultyLabel: { fontSize: theme.typography.fontSize.extraSmall, fontWeight: 600, color: theme.colors.accent2, height: '1em' },
    viewSwitcher: { display: 'flex', marginBottom: theme.spacing.large, backgroundColor: theme.colors.surface, padding: '4px', borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}` },
    tabButton: { flex: 1, padding: theme.spacing.small, background: 'none', border: 'none', color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', borderRadius: '6px' },
    activeTabButton: { color: theme.colors.primaryText, backgroundColor: theme.colors.borderStrong, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    collapsibleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: `${theme.spacing.small} ${theme.spacing.medium}`, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}`, marginTop: theme.spacing.extraLarge },
  };

  type AchievementCardData = (Achievement & {type: 'predefined', currentProgress: number, unlockedTiers: any[], nextTier: any}) | (CustomAchievement & {type: 'custom'});

  const AchievementDisplayCard: React.FC<{achievement: AchievementCardData}> = ({ achievement }) => {
    const styles = {
        achievementCard: { 
            display: 'flex', 
            flexDirection: 'column' as 'column', 
            gap: '0.75rem', 
            opacity: (achievement.type === 'predefined' && achievement.unlockedTiers.length > 0) || (achievement.type === 'custom' && achievement.unlocked) ? 1 : 0.5 
        },
        achHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
        achTitle: { margin: 0, fontSize: '1rem', fontWeight: 600, color: theme.colors.primaryText, flex: 1 },
        achTiers: { display: 'flex', gap: '0.5rem', fontSize: '1.5rem' },
        achTierIcon: { opacity: 0.3 },
        unlockedTier: { opacity: 1 },
        description: { margin: 0, fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, lineHeight: 1.6 },
    };

    if (achievement.type === 'predefined') {
        const { title, description, tiers, currentProgress, unlockedTiers, nextTier } = achievement;
        const progressPercentage = nextTier ? Math.min((currentProgress / nextTier.target) * 100, 100) : 100;

        return (
            <Card style={styles.achievementCard}>
                <div style={styles.achHeader}>
                    <h4 style={styles.achTitle}>{title}</h4>
                    <div style={styles.achTiers}>
                        {tiers.map((tier, index) => (
                            <span key={index} style={unlockedTiers.includes(tier) ? styles.unlockedTier : styles.achTierIcon} title={`${tier.name}: ${tier.target}`}>{tier.icon}</span>
                        ))}
                    </div>
                </div>
                <p style={styles.description}>{description}</p>
                {nextTier && !isShareMode && (
                    <div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem'}}>
                            <span style={{fontSize: '0.75rem', color: theme.colors.secondaryText}}>Próximo: {nextTier.name}</span>
                            <span style={{fontSize: '0.875rem', fontWeight: 700, color: theme.colors.primaryText}}>{currentProgress} / {nextTier.target}</span>
                        </div>
                        <div style={{width: '100%', backgroundColor: theme.colors.border, borderRadius: '6px', overflow: 'hidden', height: '6px' }}>
                            <div style={{ height: '100%', backgroundColor: theme.colors.accent2, transition: 'width 0.5s ease', borderRadius: '6px', width: `${progressPercentage}%` }} />
                        </div>
                    </div>
                )}
            </Card>
        );
    }
    
    // Custom achievement
    const { id, title, description, icon, unlocked } = achievement;
    return (
        <Card style={{...styles.achievementCard, position: 'relative'}}>
            {!isShareMode && <button onClick={() => deleteCustomAchievement(id)} style={{position: 'absolute' as 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: theme.colors.secondaryText, cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, padding: '0.25rem'}} aria-label="Eliminar logro">&times;</button>}
            <div style={styles.achHeader}>
                <h4 style={styles.achTitle}>{title}</h4>
                <div style={styles.achTiers}><span style={{opacity: unlocked ? 1 : 0.4}}>{icon}</span></div>
            </div>
            <p style={styles.description}>{description}</p>
        </Card>
    );
  };


  return (
    <main style={styles.container}>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Mi progreso</h2>
      </div>
      
      <div style={styles.viewSwitcher}>
        <button onClick={() => setActiveView('goals')} style={activeView === 'goals' ? {...styles.tabButton, ...styles.activeTabButton} : styles.tabButton}>
            <TargetIcon size={16} /> Metas
        </button>
        <button onClick={() => setActiveView('achievements')} style={activeView === 'achievements' ? {...styles.tabButton, ...styles.activeTabButton} : styles.tabButton}>
            <TrophyIcon size={16} /> Logros
        </button>
      </div>

      {activeView === 'goals' && (
        <div style={{animation: 'fadeInContent 0.5s ease-out'}}>
          {!isShareMode && (
            <section style={styles.section}>
              <Card title="Constructor de metas inteligente">
                <form onSubmit={handleAddGoal} style={styles.form}>
                  <div style={{...styles.formRow, alignItems: 'stretch'}}>
                      <div style={styles.fieldGroup}>
                          <label style={styles.label}>1. Elige una métrica</label>
                          <select value={goalMetric} onChange={e => setGoalMetric(e.target.value as GoalMetric)} style={styles.input}>
                              {Object.entries(metricLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                          </select>
                      </div>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>2. Elige un período</label>
                        <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} style={styles.input}>
                            <option value="all-time">Histórico</option>
                            <optgroup label="Por Temporada">
                                {seasonOptions.map(year => <option key={`season-${year}`} value={`season-${year}`}>Temporada {year}</option>)}
                            </optgroup>
                            <optgroup label="Por Mes">
                                {monthOptions.map(opt => <option key={`month-${opt.value}`} value={`month-${opt.value}`}>{opt.label}</option>)}
                            </optgroup>
                        </select>
                      </div>
                  </div>
                    
                  <div style={styles.contextBox}>
                    <strong>Contexto para el período:</strong> Valor actual <strong>{historicalContext.currentValue.toFixed(2)}</strong>
                  </div>

                  <div>
                    <label style={styles.label}>3. Establece un objetivo</label>
                    <div style={{...styles.formRow, alignItems: 'stretch' }}>
                        <button type="button" onClick={() => setGoalTarget(suggestedTargets.realistic)} style={styles.suggestionButton}>
                          <div style={{fontWeight: 700}}>Meta Realista</div>
                          <div style={{fontSize: '1.5rem', color: theme.colors.accent1}}>{suggestedTargets.realistic.toFixed(goalMetric === 'efectividad' || goalMetric === 'winRate' ? 1 : 0)}</div>
                        </button>
                        <button type="button" onClick={() => setGoalTarget(suggestedTargets.ambitious)} style={styles.suggestionButton}>
                          <div style={{fontWeight: 700}}>Meta Ambiciosa</div>
                          <div style={{fontSize: '1.5rem', color: theme.colors.accent2}}>{suggestedTargets.ambitious.toFixed(goalMetric === 'efectividad' || goalMetric === 'winRate' ? 1 : 0)}</div>
                        </button>
                        <div style={{...styles.fieldGroup, flex: 0.8}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                              <label style={{...styles.label, height: 'auto'}}>Personalizada</label>
                              <span style={styles.difficultyLabel}>{difficultyLabel}</span>
                          </div>
                          <input type="number" step="0.1" min="1" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} style={styles.input} placeholder="Ej: 20" required/>
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
          )}

          {activeGoals.length > 0 && (
              <section style={styles.section}>
                  <h3 style={styles.sectionTitle}>Metas Activas</h3>
                  <div style={styles.goalsGrid}>{activeGoals.map(goal => <GoalCard key={goal.id} goal={goal} progress={getProgressForGoal(goal)} onDelete={() => deleteGoal(goal.id)} />)}</div>
              </section>
          )}

          <section>
              <div style={styles.collapsibleHeader} onClick={() => setShowCompletedGoals(!showCompletedGoals)}>
                  <h3 style={{...styles.sectionTitle, margin: 0, border: 'none', padding: 0 }}>Metas Históricas</h3>
                  <ChevronIcon isExpanded={showCompletedGoals} />
              </div>
              {showCompletedGoals && (
                  <div style={{...styles.goalsGrid, marginTop: theme.spacing.large, animation: 'fadeInContent 0.5s ease-out'}}>
                      {completedGoals.length > 0 ? (
                          completedGoals.map(goal => <GoalCard key={goal.id} goal={goal} progress={getProgressForGoal(goal)} onDelete={() => deleteGoal(goal.id)} />)
                      ) : (
                          <p style={{ color: theme.colors.secondaryText, textAlign: 'center', gridColumn: '1 / -1', fontStyle: 'italic' }}>
                              Aquí aparecerán las metas que completes.
                          </p>
                      )}
                  </div>
              )}
          </section>
        </div>
      )}

      {activeView === 'achievements' && (
        <div style={{animation: 'fadeInContent 0.5s ease-out'}}>
             {!isShareMode && (
                <section style={styles.section}>
                    <h3 style={styles.sectionTitle}>Constructor de Desafíos</h3>
                    <Card>
                        <form onSubmit={handleAddCustomAchievement} style={styles.form}>
                            <div style={{...styles.formRow, flexWrap: 'nowrap'}}>
                                <div style={{...styles.fieldGroup, flex: 0.5}}>
                                    <label style={styles.label}>Ícono (Emoji)</label>
                                    <input type="text" value={achIcon} onChange={e => setAchIcon(e.target.value)} style={styles.input} maxLength={2} />
                                </div>
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Título del Desafío</label>
                                    <input type="text" value={achTitle} onChange={e => setAchTitle(e.target.value)} style={styles.input} placeholder="Ej: Espíritu Remontador" required />
                                </div>
                            </div>
                             <div style={styles.fieldGroup}>
                                <label style={styles.label}>Descripción</label>
                                <input type="text" value={achDescription} onChange={e => setAchDescription(e.target.value)} style={styles.input} placeholder="Explica brevemente el desafío" required />
                            </div>
                            <div style={styles.formRow}>
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Condición</label>
                                    <select value={achMetric} onChange={e => setAchMetric(e.target.value as AchievementConditionMetric)} style={styles.input}>
                                      {Object.entries(creatableAchievementMetricLabels).map(([key, label]) => (
                                          <option key={key} value={key}>{label}</option>
                                      ))}
                                    </select>
                                </div>
                                <div style={styles.fieldGroup}>
                                    <label style={styles.label}>Objetivo (Nº de Partidos)</label>
                                    <input type="number" min="1" value={achValue} onChange={e => setAchValue(e.target.value)} style={styles.input} placeholder="Ej: 3" required />
                                </div>
                            </div>
                            <button type="submit" style={{...styles.button, alignSelf: 'center'}}>Crear desafío</button>
                        </form>
                        <div style={{ borderTop: `1px solid ${theme.colors.border}`, margin: `${theme.spacing.large} 0`, textAlign: 'center' }}>
                            <h4 style={{ margin: `${theme.spacing.large} 0`, color: theme.colors.secondaryText }}>¿Necesitas inspiración?</h4>
                            {aiAchievementSuggestions.length === 0 && (
                                <button onClick={handleGenerateAdvice} disabled={isGeneratingAdvice} style={styles.aiButton}>
                                    {isGeneratingAdvice ? <Loader /> : <SparklesIcon />}
                                    Sugerencias del Entrenador IA
                                </button>
                            )}
                            {adviceError && <p style={{color: theme.colors.loss}}>{adviceError}</p>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.medium, marginTop: theme.spacing.large }}>
                                {aiAchievementSuggestions.map((suggestion, index) => (
                                    <Card key={index} style={styles.suggestionCard}>
                                        <div style={styles.suggestionHeader}>
                                            <h5 style={styles.suggestionTitle}>{suggestion.icon} {suggestion.title}</h5>
                                            <button onClick={() => handleAddSuggestionAsAchievement(suggestion)} style={styles.addSuggestionButton} aria-label="Añadir sugerencia como desafío">+</button>
                                        </div>
                                        <p style={{margin: 0, fontSize: '0.8rem', color: theme.colors.secondaryText}}>{suggestion.description}</p>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </Card>
                </section>
             )}
            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Logros de Carrera</h3>
                <div style={styles.achievementsGrid}>
                    {achievementsList.map((ach) => {
                        const currentProgress = ach.progress(matches, historicalRecords);
                        const unlockedTiers = ach.tiers.filter(t => currentProgress >= t.target);
                        const nextTier = ach.tiers.find(t => currentProgress < t.target);
                        const achievementData = { ...ach, type: 'predefined' as const, currentProgress, unlockedTiers, nextTier };
                        return <AchievementDisplayCard key={`predefined-${ach.id}`} achievement={achievementData} />;
                    })}
                </div>
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Mis Desafíos Activos</h3>
                {activeCustomAchievements.length > 0 ? (
                    <div style={styles.achievementsGrid}>
                        {activeCustomAchievements.map(ach => {
                            const achievementData = { ...ach, unlocked: false, type: 'custom' as const };
                            return <AchievementDisplayCard key={`custom-${ach.id}`} achievement={achievementData} />;
                        })}
                    </div>
                ) : (
                    <p style={{ color: theme.colors.secondaryText, textAlign: 'center', fontStyle: 'italic' }}>No tienes desafíos personalizados activos.</p>
                )}
            </section>
            
            <section>
              <div style={styles.collapsibleHeader} onClick={() => setShowCompletedAchievements(!showCompletedAchievements)}>
                  <h3 style={{...styles.sectionTitle, margin: 0, border: 'none', padding: 0 }}>Desafíos Históricos</h3>
                  <ChevronIcon isExpanded={showCompletedAchievements} />
              </div>
              {showCompletedAchievements && (
                  <div style={{...styles.achievementsGrid, marginTop: theme.spacing.large, animation: 'fadeInContent 0.5s ease-out'}}>
                      {completedCustomAchievements.length > 0 ? (
                          completedCustomAchievements.map(ach => {
                              const achievementData = { ...ach, unlocked: true, type: 'custom' as const };
                              return <AchievementDisplayCard key={`custom-${ach.id}`} achievement={achievementData} />;
                          })
                      ) : (
                          <p style={{ color: theme.colors.secondaryText, textAlign: 'center', gridColumn: '1 / -1', fontStyle: 'italic' }}>
                              Aquí aparecerán los desafíos que completes.
                          </p>
                      )}
                  </div>
              )}
          </section>
        </div>
      )}
      <style>{`
        @keyframes fadeInContent {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
};

export default ProgressPage;