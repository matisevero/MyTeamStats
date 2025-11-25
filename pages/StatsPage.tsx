import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Match, AIHighlight, CoachingInsight } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { generateHighlightsSummary, generateCoachingInsight } from '../services/geminiService';
import HighlightCard from '../components/HighlightCard';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Loader } from '../components/Loader';
import Card from '../components/common/Card';
import HistoricalAnalysis from './stats/HistoricalAnalysis';
import { ChatBubbleIcon } from '../components/icons/ChatBubbleIcon';
import SeasonalComparison from './stats/SeasonalComparison';
import SummaryWidget from './stats/SummaryWidget';
import ActivityCalendar from './stats/ActivityCalendar';
import StreaksWidget from './stats/StreaksWidget';
import ConsistencyWidget from './stats/ConsistencyWidget';
import MomentumWidget from './stats/MomentumWidget';

const StatsPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, addAIInteraction, isShareMode, activeTeams } = useData();
  
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [highlights, setHighlights] = useState<AIHighlight[]>([]);
  const [isGeneratingHighlights, setIsGeneratingHighlights] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);

  const [coachingInsight, setCoachingInsight] = useState<CoachingInsight | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredMatchesForStats = useMemo(() => {
    if (selectedTeam === 'all') {
      // If 'all', we still might want to filter by active teams if we want to hide stats from hidden teams
      // But usually 'all' implies all visible history. Let's stick to all matches for 'all' 
      // OR filter matches where teamName is in activeTeams.
      // Let's filter by activeTeams to respect the "Hidden" setting globally.
      return matches.filter(m => activeTeams.includes(m.teamName));
    }
    return matches.filter(m => m.teamName === selectedTeam);
  }, [matches, selectedTeam, activeTeams]);

  const allPlayers = useMemo(() => {
    const players = new Set<string>();
    filteredMatchesForStats.forEach(match => {
      match.players?.forEach(p => {
        if (p && p.name.trim()) {
          players.add(p.name.trim());
        }
      });
      match.opponentPlayers?.forEach(p => {
        if (p && p.name.trim()) {
          players.add(p.name.trim());
        }
      });
    });
    return Array.from(players).sort();
  }, [filteredMatchesForStats]);
  
  const handleAnalyzePerformance = useCallback(async () => {
    setIsGeneratingHighlights(true);
    setHighlightsError(null);
    try {
      const result = await generateHighlightsSummary(filteredMatchesForStats);
      const populatedHighlights = result.map(h => ({ ...h, match: filteredMatchesForStats.find(m => m.id === h.matchId)! })).filter(h => h.match);
      setHighlights(populatedHighlights);
      addAIInteraction('highlight_analysis', populatedHighlights);
    } catch (err: any) { setHighlightsError(err.message || "Error al generar el análisis."); }
    finally { setIsGeneratingHighlights(false); }
  }, [filteredMatchesForStats, addAIInteraction]);

  const handleGetCoachingInsight = useCallback(async () => {
    setIsGeneratingInsight(true);
    setInsightError(null);
    try {
        const result = await generateCoachingInsight(filteredMatchesForStats);
        setCoachingInsight(result);
        addAIInteraction('coach_insight', result);
    } catch (err: any) { setInsightError(err.message || "Error al generar la perspectiva."); }
    finally { setIsGeneratingInsight(false); }
  }, [filteredMatchesForStats, addAIInteraction]);


  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.large,
        flexWrap: 'wrap',
    },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent2}`, paddingLeft: '1rem' },
    filterContainer: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium, flex: 1, maxWidth: '400px' },
    filterLabel: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, fontWeight: 500 },
    filterSelect: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        color: theme.colors.primaryText,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.small,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
        cursor: 'pointer',
    },
    desktopGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: theme.spacing.large,
        alignItems: 'start',
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.large,
    }
  };
  
  const aiCard = (
    <Card title="Análisis con IA">
      {highlights.length === 0 && !isGeneratingHighlights && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: theme.colors.secondaryText, margin: `0 0 ${theme.spacing.large} 0`, lineHeight: 1.6 }}>Descubre los partidos más determinantes del equipo.</p>
          {!isShareMode && (
              <button onClick={handleAnalyzePerformance} style={{ background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`, border: 'none', color: theme.name === 'dark' ? '#121829' : '#FFFFFF', padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderRadius: theme.borderRadius.medium, cursor: 'pointer', fontWeight: 700, fontSize: theme.typography.fontSize.medium, display: 'inline-flex', alignItems: 'center', gap: theme.spacing.small, transition: 'opacity 0.2s' }} disabled={filteredMatchesForStats.length < 3}>
              <SparklesIcon /> {filteredMatchesForStats.length < 3 ? 'necesitas 3 partidos' : 'Analizar Partidos Clave'}
              </button>
          )}
        </div>
      )}
      {isGeneratingHighlights && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: theme.colors.secondaryText, padding: theme.spacing.extraLarge }}><Loader /> <p>Analizando...</p></div>}
      {highlightsError && <p style={{ color: theme.colors.loss, textAlign: 'center', padding: theme.spacing.medium, backgroundColor: `${theme.colors.loss}1A`, borderRadius: theme.borderRadius.medium }}>{highlightsError}</p>}
      {highlights.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: theme.spacing.large }}>{highlights.map(h => <HighlightCard key={h.matchId} highlight={h} allMatches={filteredMatchesForStats} allPlayers={allPlayers} />)}</div>}

      <div style={{ borderTop: `1px solid ${theme.colors.border}`, marginTop: '1.5rem', paddingTop: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', textAlign: 'center', color: theme.colors.secondaryText, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><ChatBubbleIcon size={20} /> Perspectiva del Entrenador</h4>
        {coachingInsight ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><h5 style={{ margin: '0 0 0.5rem 0', color: theme.colors.win }}>📈 Tendencia positiva</h5><p style={{ margin: 0, color: theme.colors.primaryText, lineHeight: 1.6 }}>{coachingInsight.positiveTrend}</p></div>
            <div><h5 style={{ margin: '0 0 0.5rem 0', color: theme.colors.draw }}>🎯 Área de mejora</h5><p style={{ margin: 0, color: theme.colors.primaryText, lineHeight: 1.6 }}>{coachingInsight.areaForImprovement}</p></div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: theme.colors.secondaryText, margin: `0 0 ${theme.spacing.large} 0`, lineHeight: 1.6, fontSize: '0.9rem' }}>Obtén un análisis rápido del rendimiento del equipo.</p>
            {!isShareMode && (
              <button onClick={handleGetCoachingInsight} style={{ background: 'none', border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.primaryText, padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderRadius: theme.borderRadius.medium, cursor: 'pointer', fontWeight: 700, fontSize: theme.typography.fontSize.small, display: 'inline-flex', alignItems: 'center', gap: theme.spacing.small, transition: 'background-color 0.2s' }} disabled={isGeneratingInsight || filteredMatchesForStats.length < 5}>
                  {isGeneratingInsight ? <Loader /> : <SparklesIcon />}
                  {filteredMatchesForStats.length < 5 ? 'necesitas 5 partidos' : 'Obtener perspectiva'}
              </button>
            )}
          </div>
        )}
        {isGeneratingInsight && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: theme.colors.secondaryText, padding: theme.spacing.large }}><Loader /> <p>Generando...</p></div>}
        {insightError && <p style={{ color: theme.colors.loss, textAlign: 'center', padding: theme.spacing.medium, backgroundColor: `${theme.colors.loss}1A`, borderRadius: theme.borderRadius.medium }}>{insightError}</p>}
      </div>
  </Card>
  );

  return (
    <main style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>Dashboard</h2>
        {activeTeams.length > 1 && (
            <div style={styles.filterContainer}>
                <label style={styles.filterLabel}>Mostrando para:</label>
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={styles.filterSelect}>
                    <option value="all">Todos mis equipos</option>
                    {activeTeams.map(team => <option key={team} value={team}>{team}</option>)}
                </select>
            </div>
        )}
      </div>

      {isDesktop ? (
        <div style={styles.desktopGrid}>
            <div style={styles.column}>
                <SummaryWidget matches={filteredMatchesForStats} selectedTeam={selectedTeam} />
                <StreaksWidget matches={filteredMatchesForStats} />
                <ConsistencyWidget matches={filteredMatchesForStats} />
            </div>
            <div style={styles.column}>
                <MomentumWidget matches={filteredMatchesForStats} />
                <ActivityCalendar matches={filteredMatchesForStats} />
                <Card title="Análisis histórico"><HistoricalAnalysis matches={filteredMatchesForStats} /></Card>
            </div>
            <div style={styles.column}>
                <Card title="Comparación por temporada"><SeasonalComparison matches={filteredMatchesForStats} /></Card>
                {aiCard}
            </div>
        </div>
      ) : (
        <>
            <SummaryWidget matches={filteredMatchesForStats} selectedTeam={selectedTeam} />
            <StreaksWidget matches={filteredMatchesForStats} />
            <ConsistencyWidget matches={filteredMatchesForStats} />
            <MomentumWidget matches={filteredMatchesForStats} />
            <Card title="Comparación por temporada"><SeasonalComparison matches={filteredMatchesForStats} /></Card>
            <ActivityCalendar matches={filteredMatchesForStats} />
            <Card title="Análisis histórico"><HistoricalAnalysis matches={filteredMatchesForStats} /></Card>
            {aiCard}
        </>
      )}

    </main>
  );
};

export default StatsPage;