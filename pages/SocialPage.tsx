import React, { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { achievementsList } from '../data/achievements';
import { calculateHistoricalRecords, calculateTeamMorale } from '../utils/analytics';
import MomentPreviewCard from '../components/social/MomentPreviewCard';
import ShareModal from '../components/modals/ShareModal';
import { StarIcon } from '../components/icons/StarIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { AwardIcon } from '../components/icons/AwardIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { MoraleLevel, type TeammateStats, type OpponentStats, Match, PlayerMorale } from '../types';

export interface ShareableMoment {
  type: 'match' | 'achievement' | 'match_mvp' | 'last_match' | 'recent_form' | 'monthly_summary' | 'morale' | 'yearly_summary';
  title: string;
  date: string;
  data: any;
  icon: React.ReactNode;
}

const SocialPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, mainPlayerName } = useData();
  const [selectedMoment, setSelectedMoment] = useState<ShareableMoment | null>(null);

  const shareableMoments: ShareableMoment[] = useMemo(() => {
    const moments: ShareableMoment[] = [];
    if (matches.length < 3) return [];

    const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 1. Last Match
    const lastMatch = sortedMatches[0];
    if (lastMatch) {
      const resultIcons: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = { VICTORIA: '✅', EMPATE: '🤝', DERROTA: '❌' };
      moments.push({
        type: 'last_match',
        title: 'Último resultado',
        date: new Date(lastMatch.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        data: lastMatch,
        icon: <span style={{ fontSize: '1.5rem' }}>{resultIcons[lastMatch.result]}</span>,
      });
    }

    // 2. Recent Form
    const recentFormMatches = sortedMatches.slice(0, 5);
    if (recentFormMatches.length === 5) {
      moments.push({
        type: 'recent_form',
        title: 'Racha de últimos 5',
        date: 'Forma Reciente',
        data: recentFormMatches.map(m => m.result),
        icon: <TrendingUpIcon />,
      });
    }

    // 3. Monthly Summary (for the last month with activity)
    if (sortedMatches.length > 0) {
        const lastMatchDate = new Date(sortedMatches[0].date);
        const lastActivityMonth = lastMatchDate.getMonth();
        const lastActivityYear = lastMatchDate.getFullYear();

        const lastMonthWithMatches = sortedMatches.filter(m => {
            const d = new Date(m.date);
            return d.getFullYear() === lastActivityYear && d.getMonth() === lastActivityMonth;
        });

        if (lastMonthWithMatches.length > 0) {
            const wins = lastMonthWithMatches.filter(m => m.result === 'VICTORIA').length;
            const draws = lastMonthWithMatches.filter(m => m.result === 'EMPATE').length;
            const losses = lastMonthWithMatches.filter(m => m.result === 'DERROTA').length;
            const goals = lastMonthWithMatches.reduce((sum, m) => sum + m.myGoals, 0);
            const assists = lastMonthWithMatches.reduce((sum, m) => sum + m.myAssists, 0);
            const monthName = new Date(lastActivityYear, lastActivityMonth).toLocaleString('es-ES', { month: 'long' });
            
            moments.push({
                type: 'monthly_summary',
                title: `Resumen de ${monthName}`,
                date: 'Estadísticas del mes',
                data: {
                    monthName,
                    matches: lastMonthWithMatches.length,
                    wins, draws, losses, goals, assists
                },
                icon: <CalendarIcon />,
            });
        }
    }
    
    // 4. Player Morale
    const moraleData = calculateTeamMorale(matches);
    if (moraleData) {
        const moraleDescriptions: Record<MoraleLevel, string> = {
            [MoraleLevel.MODO_D10S]: "Barrilete cósmico... ¿De qué planeta viniste?",
            [MoraleLevel.ESTELAR]: "Imparable, con la confianza por las nubes.",
            [MoraleLevel.INSPIRADO]: "Viendo la jugada antes que los demás y marcando la diferencia.",
            [MoraleLevel.CONFIADO]: "Tomando buenas decisiones, jugando con seguridad.",
            [MoraleLevel.SOLIDO]: "Cumplidor y fiable. Aportando equilibrio al equipo.",
            [MoraleLevel.REGULAR]: "Rendimiento estándar, con momentos buenos y otros no tanto.",
            [MoraleLevel.DUDOSO]: "Un poco desconectado, costando encontrar el ritmo.",
            [MoraleLevel.BLOQUEADO]: "Mentalmente fuera de partido, la frustración pesa.",
            [MoraleLevel.EN_CAIDA_LIBRE]: "Una racha negativa ha quitado toda la confianza.",
            [MoraleLevel.DESCONOCIDO]: "Rendimiento irreconocible... hay riesgo de incendio.",
        };
        const finalMorale = { ...moraleData, description: moraleDescriptions[moraleData.level] };
        moments.push({
            type: 'morale',
            title: `Moral: ${moraleData.level}`,
            date: 'Análisis de rendimiento',
            data: finalMorale,
            icon: <BrainIcon />,
        });
    }

    // NEW: Yearly Summary
    const yearsWithMatches = Array.from(new Set(matches.map(m => new Date(m.date).getFullYear()))).sort((a,b) => b-a);
    if (yearsWithMatches.length > 0) {
        const latestYear = yearsWithMatches[0];
        const yearlyMatches = matches.filter(m => new Date(m.date).getFullYear() === latestYear);
        
        if (yearlyMatches.length > 5) {
            const wins = yearlyMatches.filter(m => m.result === 'VICTORIA').length;
            const draws = yearlyMatches.filter(m => m.result === 'EMPATE').length;
            const losses = yearlyMatches.filter(m => m.result === 'DERROTA').length;
            const goals = yearlyMatches.reduce((sum, m) => sum + m.myGoals, 0);
            const assists = yearlyMatches.reduce((sum, m) => sum + m.myAssists, 0);
            const points = wins * 3 + draws;
            const efectividad = (points / (yearlyMatches.length * 3)) * 100;
            const winRate = (wins / yearlyMatches.length) * 100;
            const gpm = goals / yearlyMatches.length;
            const apm = assists / yearlyMatches.length;

            const yearlyRecords = calculateHistoricalRecords(yearlyMatches);

            // Calculate duels for the year
            const teammateData: Record<string, { matches: number; totalImpactScore: number }> = {};
            const opponentData: Record<string, { matches: number; totalImpactScore: number }> = {};
            yearlyMatches.forEach(match => {
                match.players?.forEach(player => {
                    if (player.name.toLowerCase() === mainPlayerName?.toLowerCase() || !player.name.trim()) return;
                    if (!teammateData[player.name]) teammateData[player.name] = { matches: 0, totalImpactScore: 0 };
                    teammateData[player.name].matches++;
                    let matchScore = 0; if (match.result === 'VICTORIA') matchScore += 3; else if (match.result === 'EMPATE') matchScore += 1; else matchScore -= 1;
                    matchScore += match.myGoals * 1.5 + match.myAssists * 1;
                    teammateData[player.name].totalImpactScore += matchScore;
                });
                match.opponentPlayers?.forEach(player => {
                    if (!player.name.trim()) return;
                    if (!opponentData[player.name]) opponentData[player.name] = { matches: 0, totalImpactScore: 0 };
                    opponentData[player.name].matches++;
                     let matchScore = 0; if (match.result === 'VICTORIA') matchScore += 3; else if (match.result === 'EMPATE') matchScore += 1; else matchScore -= 2;
                    matchScore += match.myGoals * 1.5 + match.myAssists * 1;
                    opponentData[player.name].totalImpactScore += matchScore;
                });
            });
            const topPartners = Object.entries(teammateData).map(([name, data]) => ({ name, impactScore: data.totalImpactScore/data.matches })).sort((a,b) => b.impactScore - a.impactScore).slice(0,2);
            const nemesisRivals = Object.entries(opponentData).map(([name, data]) => ({ name, impactScore: data.totalImpactScore/data.matches })).sort((a,b) => a.impactScore - b.impactScore).slice(0,2);

            const radarMetrics = [{ label: 'G/P', value: gpm }, { label: 'A/P', value: apm }, { label: '% V', value: winRate }, { label: 'Efect.', value: efectividad }, { label: 'PJ', value: yearlyMatches.length }];

            moments.push({
                type: 'yearly_summary',
                title: `Resumen del Año ${latestYear}`,
                date: 'Análisis Anual',
                data: {
                    year: latestYear,
                    summaryStats: {
                        matches: yearlyMatches.length,
                        record: `${wins}-${draws}-${losses}`,
                        goals, assists,
                    },
                    yearlyRecords,
                    topPartners,
                    nemesisRivals,
                    radarData: [{ name: latestYear.toString(), data: radarMetrics, color: theme.colors.accent1 }]
                },
                icon: <AwardIcon />,
            });
        }
    }

    // 5. Most Recent Impressive Win
    const recentWin = sortedMatches.find(m => m.result === 'VICTORIA' && (m.myGoals + m.myAssists >= 2));
    if (recentWin) {
      moments.push({
        type: 'match',
        title: 'Última gran victoria',
        date: new Date(recentWin.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        data: recentWin,
        icon: <StarIcon />,
      });
    }

    // 6. Latest Unlocked Achievement
    const historicalRecords = calculateHistoricalRecords(matches);
    const latestUnlocked = achievementsList
        .map(ach => {
            const progress = ach.progress(matches, historicalRecords);
            const unlockedTier = [...ach.tiers].reverse().find(t => progress >= t.target);
            return unlockedTier ? { achievement: ach, tier: unlockedTier } : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .pop();
    
    if (latestUnlocked) {
        moments.push({
            type: 'achievement',
            title: 'Último logro desbloqueado',
            date: 'Logro',
            data: latestUnlocked,
            icon: <TrophyIcon />,
        });
    }

    // 7. A top performance match (most goals + assists)
    if (matches.length > 0) {
        const topPerformanceMatch = [...matches].sort((a, b) => (b.myGoals + b.myAssists) - (a.myGoals + a.myAssists))[0];
        if (topPerformanceMatch && (!recentWin || topPerformanceMatch.id !== recentWin.id)) {
            moments.push({
                type: 'match_mvp',
                title: 'Actuación estelar',
                date: new Date(topPerformanceMatch.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                data: topPerformanceMatch,
                icon: <AwardIcon />,
            });
        }
    }

    return moments;
  }, [matches, mainPlayerName, theme.colors.accent1]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.extraLarge,
    },
    pageTitle: {
      fontSize: theme.typography.fontSize.extraLarge,
      fontWeight: 700,
      color: theme.colors.primaryText,
      margin: 0,
      borderLeft: `4px solid ${theme.colors.accent1}`,
      paddingLeft: theme.spacing.medium,
    },
    grid: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.medium,
    },
    noMoments: {
        textAlign: 'center',
        padding: '3rem 2rem',
        backgroundColor: theme.colors.surface,
        borderRadius: '12px',
        border: `1px dashed ${theme.colors.border}`,
        color: theme.colors.secondaryText,
    }
  };
  
  if (matches.length < 3) {
      return (
        <main style={styles.container}>
            <h2 style={styles.pageTitle}>Centro Social</h2>
            <div style={styles.noMoments}>
                <p>Registra más partidos para generar momentos para compartir en tus redes sociales.</p>
            </div>
        </main>
      );
  }

  return (
    <main style={styles.container}>
      <h2 style={styles.pageTitle}>Centro Social</h2>
      <p style={{ color: theme.colors.secondaryText, marginTop: `-${theme.spacing.medium}` }}>
        Genera imágenes para compartir tus mejores momentos en redes sociales.
      </p>
      <div style={styles.grid}>
        {shareableMoments.map((moment, index) => (
          <MomentPreviewCard
            key={index}
            title={moment.title}
            icon={moment.icon}
            date={moment.date}
            onOpen={() => setSelectedMoment(moment)}
          />
        ))}
      </div>

      {selectedMoment && (
        <ShareModal
          moment={selectedMoment}
          onClose={() => setSelectedMoment(null)}
        />
      )}
    </main>
  );
};

export default SocialPage;