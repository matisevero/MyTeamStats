import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { MoraleLevel, type Match, type HistoricalRecords, type PlayerMorale } from '../../types';
import { calculateHistoricalRecords, calculateTeamMorale } from '../../utils/analytics';
import Card from '../../components/common/Card';
import StatCard from '../../components/StatCard';
import RecentForm from '../../components/RecentForm';
import { Loader } from '../../components/Loader';
import YearTabs from '../../components/YearTabs';

interface StreaksWidgetProps {
  matches: Match[];
}

const MoraleDisplay: React.FC<{ morale: PlayerMorale | null, isLoading: boolean }> = ({ morale, isLoading }) => {
    const { theme } = useTheme();

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: theme.colors.secondaryText, padding: theme.spacing.large }}><Loader /> <p>Calculando moral...</p></div>;
    }

    if (!morale) {
        return null;
    }
    
    const moraleConfig = {
        [MoraleLevel.MODO_D10S]: { icon: '👑', color: '#FFD700' },
        [MoraleLevel.ESTELAR]: { icon: '🔥', color: theme.colors.win },
        [MoraleLevel.INSPIRADO]: { icon: '✨', color: theme.colors.accent1 },
        [MoraleLevel.CONFIADO]: { icon: '✅', color: theme.colors.accent2 },
        [MoraleLevel.SOLIDO]: { icon: '💪', color: theme.colors.draw },
        [MoraleLevel.REGULAR]: { icon: '😐', color: theme.colors.secondaryText },
        [MoraleLevel.DUDOSO]: { icon: '🤔', color: '#FFB74D' },
        [MoraleLevel.BLOQUEADO]: { icon: '❌', color: '#FF8A65' },
        [MoraleLevel.EN_CAIDA_LIBRE]: { icon: '📉', color: theme.colors.loss },
        [MoraleLevel.DESCONOCIDO]: { icon: '❓', color: '#B00020' },
    }[morale.level];

    const trendIndicator = morale.trend && {
        up: { icon: '▲', color: theme.colors.win },
        down: { icon: '▼', color: theme.colors.loss },
    }[morale.trend];

    const styles: { [key: string]: React.CSSProperties } = {
        moraleCard: {
            backgroundColor: theme.colors.background,
            borderRadius: theme.borderRadius.large,
            padding: theme.spacing.large,
            display: 'flex',
            flexDirection: 'column' as 'column',
            gap: theme.spacing.medium,
            textAlign: 'center' as 'center',
            border: `1px solid ${moraleConfig.color}80`,
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.medium
        },
        icon: { fontSize: '1.75rem' },
        level: { 
            fontSize: theme.typography.fontSize.large, 
            fontWeight: 700, 
            color: moraleConfig.color 
        },
        barContainer: {
            position: 'relative',
            height: '10px',
            background: `linear-gradient(to right, ${theme.colors.loss}, ${theme.colors.draw}, ${theme.colors.win})`,
            borderRadius: theme.borderRadius.small,
        },
        marker: {
            position: 'absolute',
            top: '50%',
            left: `${morale.score}%`,
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'left 0.5s ease-out',
        },
        markerArrow: {
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${theme.colors.primaryText}`,
        },
        markerValue: {
            backgroundColor: theme.colors.primaryText,
            color: theme.colors.surface,
            padding: '2px 6px',
            borderRadius: theme.borderRadius.small,
            fontWeight: 'bold',
            fontSize: '0.8rem',
        },
        description: {
            fontSize: theme.typography.fontSize.small,
            color: theme.colors.secondaryText,
            lineHeight: 1.6,
            margin: 0,
            fontStyle: 'italic',
        }
    };

    return (
        <div style={styles.moraleCard}>
            <div style={styles.header}>
                <span style={styles.icon}>{moraleConfig.icon}</span>
                <h4 style={styles.level}>{morale.level}</h4>
                {trendIndicator && (
                    <span style={{ color: trendIndicator.color, fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {trendIndicator.icon}
                    </span>
                )}
            </div>
             <div style={styles.barContainer}>
                <div style={styles.marker}>
                    <span style={styles.markerValue}>{morale.score.toFixed(0)}</span>
                    <div style={styles.markerArrow}></div>
                </div>
            </div>
            <p style={styles.description}>"{morale.description}"</p>
        </div>
    );
};


const StreaksWidget: React.FC<StreaksWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();
  
  const years = useMemo(() => {
    const yearSet = new Set(matches.map(m => new Date(m.date).getFullYear()));
    return Array.from(yearSet).sort((a: number, b: number) => b - a);
  }, [matches]);
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');

  const [morale, setMorale] = useState<PlayerMorale | null>(null);
  const [isMoraleLoading, setIsMoraleLoading] = useState(true);
  const [moraleError, setMoraleError] = useState<string | null>(null);

  const currentFullYear = new Date().getFullYear();
  const showCurrentStreaks = selectedYear === 'all' || selectedYear === currentFullYear.toString();

  const filteredMatches = useMemo(() => {
    if (selectedYear === 'all') return matches;
    return matches.filter(m => new Date(m.date).getFullYear().toString() === selectedYear);
  }, [matches, selectedYear]);
  
  useEffect(() => {
    const fetchMorale = () => {
        setIsMoraleLoading(true);
        setMoraleError(null);
        setMorale(null);

        const moraleData = calculateTeamMorale(filteredMatches);
        
        if (!moraleData) {
            setIsMoraleLoading(false);
            return;
        }

        const moraleDescriptions: Record<MoraleLevel, string> = {
            [MoraleLevel.MODO_D10S]: "Barrilete cósmico... ¿De qué planeta viniste? Estás en un nivel donde cada pelota que tocas tiene destino de genialidad. Disfrútalo, porque esto es historia.",
            [MoraleLevel.ESTELAR]: "Estás en racha. Te sientes imparable, con la confianza por las nubes para intentar cualquier cosa y que te salga bien. El rival te teme.",
            [MoraleLevel.INSPIRADO]: "Las ideas fluyen y las piernas responden. Estás viendo la jugada antes que los demás y marcando la diferencia en cada intervención.",
            [MoraleLevel.CONFIADO]: "Sientes que el equipo puede contar contigo. Estás tomando buenas decisiones, juegas con seguridad y tu aporte es consistentemente positivo.",
            [MoraleLevel.SOLIDO]: "Cumplidor y fiable. Estás haciendo tu trabajo sin grandes lujos pero con efectividad. Aportas equilibrio y seguridad al equipo.",
            [MoraleLevel.REGULAR]: "Un rendimiento estándar. Tienes momentos buenos y otros no tanto, pero te mantienes en partido. Hay margen para crecer.",
            [MoraleLevel.DUDOSO]: "Un poco desconectado. Las cosas no están saliendo como esperas y te cuesta encontrar tu ritmo. Es momento de simplificar el juego.",
            [MoraleLevel.BLOQUEADO]: "Mentalmente fuera de partido. Sientes que cada decisión es la incorrecta y la frustración empieza a pesar. Necesitas un reseteo.",
            [MoraleLevel.EN_CAIDA_LIBRE]: "Una racha muy negativa te ha quitado toda la confianza. Cada pelota parece pesar una tonelada y el arco rival se ve lejano.",
            [MoraleLevel.DESCONOCIDO]: "Tu rendimiento actual es irreconocible. La tribuna empieza a impacientarse... hay riesgo de que te incendien el auto.",
        };
        
        const finalMorale: PlayerMorale = {
            level: moraleData.level,
            score: moraleData.score,
            description: moraleDescriptions[moraleData.level],
            trend: moraleData.trend,
            recentMatchesSummary: moraleData.recentMatchesSummary,
        };
        
        setMorale(finalMorale);
        setIsMoraleLoading(false);
    };
    
    fetchMorale();
  }, [filteredMatches]);

  const currentStreaks = useMemo(() => {
    const sortedMatches = [...filteredMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortedMatches.length === 0) {
      return { 
        winStreak: 0,
        undefeatedStreak: 0,
        goalStreak: 0,
        cleanSheetStreak: 0,
      };
    }
    
    let winStreak = 0;
    for (const match of sortedMatches) { if (match.result === 'VICTORIA') winStreak++; else break; }
    
    let undefeatedStreak = 0;
    for (const match of sortedMatches) { if (match.result !== 'DERROTA') undefeatedStreak++; else break; }
    
    let goalStreak = 0;
    for (const match of sortedMatches) { if (match.myGoals > 0) goalStreak++; else break; }
    
    let cleanSheetStreak = 0;
    for (const match of sortedMatches) { if (match.opponentScore === 0) cleanSheetStreak++; else break; }

    return { winStreak, undefeatedStreak, goalStreak, cleanSheetStreak };
  }, [filteredMatches]);

  const historicalRecords: HistoricalRecords = useMemo(() => 
    calculateHistoricalRecords(filteredMatches), 
  [filteredMatches]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    sectionTitle: {
      color: theme.colors.secondaryText,
      fontSize: theme.typography.fontSize.small,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      margin: `0 0 ${theme.spacing.medium} 0`,
      paddingBottom: theme.spacing.small,
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    streakLabel: { color: theme.colors.secondaryText, fontStyle: 'italic', textAlign: 'center' },
    recordsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: theme.spacing.medium,
    },
  };
  
  const iconStyle: React.CSSProperties = { fontSize: '1.25rem' };
  const title = `Rachas y récords ${selectedYear !== 'all' ? `(${selectedYear})` : ''}`;
  
  const activeStreaksToShow = [
    { label: "Victorias consecutivas", value: currentStreaks.winStreak, icon: <span style={iconStyle}>✅</span> },
    { label: "Partidos invicto", value: currentStreaks.undefeatedStreak, icon: <span style={iconStyle}>🛡️</span> },
    { label: "Partidos marcando", value: currentStreaks.goalStreak, icon: <span style={iconStyle}>⚽️</span> },
    { label: "Vallas invictas", value: currentStreaks.cleanSheetStreak, icon: <span style={iconStyle}>🧤</span> },
  ];

  return (
    <Card title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.medium }}>
        {years.length > 0 && <YearTabs years={years} selectedYear={selectedYear} onSelectYear={setSelectedYear} />}
        <div style={styles.container}>
            <div>
                <h4 style={styles.sectionTitle}>Moral del equipo</h4>
                <MoraleDisplay morale={morale} isLoading={isMoraleLoading} />
                {moraleError && <p style={{color: theme.colors.loss, fontSize: '0.8rem', textAlign: 'center'}}>{moraleError}</p>}
            </div>

            {showCurrentStreaks && (
            <div>
                <h4 style={styles.sectionTitle}>Rachas Activas</h4>
                <div style={styles.recordsGrid}>
                    {activeStreaksToShow.map(streak => (
                        <StatCard key={streak.label} label={streak.label} value={streak.value} icon={streak.icon} />
                    ))}
                </div>
                <div style={{marginTop: theme.spacing.large}}>
                    <RecentForm matches={filteredMatches} />
                </div>
            </div>
            )}

            <div>
            <h4 style={styles.sectionTitle}>Récords históricos ({selectedYear === 'all' ? 'Totales' : selectedYear})</h4>
            <div style={styles.recordsGrid}>
                <StatCard label="📈 Victorias seguidas" value={historicalRecords.longestWinStreak.value} count={historicalRecords.longestWinStreak.count} />
                <StatCard label="🛡️ Partidos invicto" value={historicalRecords.longestUndefeatedStreak.value} count={historicalRecords.longestUndefeatedStreak.count} />
                <StatCard label="🔥 Partidos marcando" value={historicalRecords.longestGoalStreak.value} count={historicalRecords.longestGoalStreak.count} />
                <StatCard label="🧤 Vallas invictas" value={historicalRecords.longestCleanSheetStreak.value} count={historicalRecords.longestCleanSheetStreak.count} />
                <StatCard label="📉 Derrotas seguidas" value={historicalRecords.longestLossStreak.value} count={historicalRecords.longestLossStreak.count} />
                <StatCard label="❌ Partidos sin ganar" value={historicalRecords.longestWinlessStreak.value} count={historicalRecords.longestWinlessStreak.count} />
                <StatCard label="❄️ Sequía de goles" value={historicalRecords.longestGoalDrought.value} count={historicalRecords.longestGoalDrought.count} />
                <StatCard label="🔝 Goles en 1 partido" value={historicalRecords.bestGoalPerformance.value} count={historicalRecords.bestGoalPerformance.count} />
            </div>
            </div>
        </div>
      </div>
    </Card>
  );
};

export default StreaksWidget;
