import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import type { Match, PlayerContextStats } from '../../types';
import { generateMatchHeadline, generatePlayerComparisonAnalysis } from '../../services/geminiService';
import { CloseIcon } from '../icons/CloseIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { Loader } from '../Loader';
import { FootballIcon } from '../icons/FootballIcon';
import { ShareIcon } from '../icons/ShareIcon';
import AutocompleteInput from '../AutocompleteInput';
import MatchList from '../MatchList';
import RadarChart from '../charts/RadarChart';
import YearFilter from '../YearFilter';

interface PlayerCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: string[];
  allMatches: Match[];
  onAnalysisGenerated: (analysisData: any) => void;
}

const calculateContextStats = (contextMatches: Match[]): PlayerContextStats | null => {
    if (contextMatches.length === 0) return null;
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
      myGoals, myAssists,
      gpm: matchesPlayed > 0 ? myGoals / matchesPlayed : 0,
      apm: matchesPlayed > 0 ? myAssists / matchesPlayed : 0,
      points,
      matches: [...contextMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
};

const ComparativeStatRow: React.FunctionComponent<{ label: string; values: (number | undefined)[]; format: (v: number) => string; }> = ({ label, values, format }) => {
    const { theme } = useTheme();
    const validValues = values.filter(v => typeof v === 'number') as number[];
    const maxValue = validValues.length > 0 ? Math.max(...validValues) : -Infinity;

    const styles: { [key: string]: React.CSSProperties } = {
        statRow: { display: 'grid', gridTemplateColumns: '1.5fr 2fr', alignItems: 'center', gap: '1rem' },
        statLabel: { color: theme.colors.secondaryText, fontSize: '0.8rem', fontWeight: 500, textAlign: 'right' },
        statValuesContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: '0.5rem' },
        statValue: { fontSize: '1.1rem', fontWeight: 500, padding: '0.25rem', borderRadius: theme.borderRadius.small, transition: 'color 0.2s' },
    };

    return (
        <div style={styles.statRow}>
            <span style={styles.statLabel}>{label}</span>
            <div style={styles.statValuesContainer}>
                {values.map((value, index) => (
                    <span
                        key={index}
                        style={{
                            ...styles.statValue,
                            color: value === maxValue ? theme.colors.primaryText : theme.colors.secondaryText,
                            fontWeight: value === maxValue ? 700 : 500
                        }}
                    >
                        {typeof value === 'number' ? format(value) : '-'}
                    </span>
                ))}
            </div>
        </div>
    );
};

const PlayerCompareModal: React.FC<PlayerCompareModalProps> = ({ isOpen, onClose, allPlayers, allMatches, onAnalysisGenerated }) => {
  const { theme } = useTheme();
  const [player1, setPlayer1] = useState<string | null>(null);
  const [player2, setPlayer2] = useState<string | null>(null);
  const [player3, setPlayer3] = useState<string | null>(null);
  const [showThirdPlayer, setShowThirdPlayer] = useState(false);
  const [context, setContext] = useState<'teammates' | 'opponents'>('teammates');
  const [historyView, setHistoryView] = useState<'player1' | 'player2' | 'player3'>('player1');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setPlayer1(null);
      setPlayer2(null);
      setPlayer3(null);
      setShowThirdPlayer(false);
      setHistoryView('player1');
      setAnalysis(null);
      setIsAnalyzing(false);
      setAnalysisError(null);
      setSelectedYear('all');
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  useEffect(() => {
    setAnalysis(null);
    setAnalysisError(null);
  }, [player1, player2, player3, context, selectedYear]);

  const playerContexts = useMemo(() => {
    const getContext = (playerName: string | null): 'teammate' | 'opponent' | 'both' | null => {
        if (!playerName) return null;
        const isTeammate = allMatches.some(m => m.players?.some(p => p.name === playerName));
        const isOpponent = allMatches.some(m => m.opponentPlayers?.some(p => p.name === playerName));
        if (isTeammate && isOpponent) return 'both';
        if (isTeammate) return 'teammate';
        if (isOpponent) return 'opponent';
        return null;
    };
    return {
        player1: getContext(player1),
        player2: getContext(player2),
    };
  }, [player1, player2, allMatches]);

  const isMixedContext = useMemo(() => {
    const p1Context = playerContexts.player1;
    const p2Context = playerContexts.player2;
    return (
        !player3 &&
        p1Context && p2Context &&
        (p1Context === 'teammate' || p1Context === 'both') &&
        (p2Context === 'opponent' || p2Context === 'both')
    );
  }, [player3, playerContexts]);

  const availableYears = useMemo(() => {
    const playerMatches = allMatches.filter(m => 
      [player1, player2, player3].some(p => 
        p && (m.players?.some(pl => pl.name === p) || m.opponentPlayers?.some(pl => pl.name === p))
      )
    );
    const yearSet = new Set<number>(playerMatches.map(m => new Date(m.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [player1, player2, player3, allMatches]);
  
  const filteredMatches = useMemo(() => 
    selectedYear === 'all' 
      ? allMatches 
      : allMatches.filter(m => new Date(m.date).getFullYear().toString() === selectedYear),
  [allMatches, selectedYear]);

  const getPlayerStats = (playerName: string | null): PlayerContextStats | null => {
    if (!playerName) return null;
    let contextMatches: Match[];
    if (isMixedContext) {
        contextMatches = filteredMatches.filter(m => 
            context === 'teammates' 
                ? m.players?.some(p => p.name === playerName)
                : m.opponentPlayers?.some(p => p.name === playerName)
        );
    } else {
        contextMatches = filteredMatches.filter(m => 
            context === 'teammates' 
                ? m.players?.some(p => p.name === playerName)
                : m.opponentPlayers?.some(p => p.name === playerName)
        );
    }
    return calculateContextStats(contextMatches);
  };
  
  const player1Stats = useMemo(() => getPlayerStats(player1), [player1, filteredMatches, context, isMixedContext]);
  const player2Stats = useMemo(() => getPlayerStats(player2), [player2, filteredMatches, context, isMixedContext]);
  const player3Stats = useMemo(() => getPlayerStats(player3), [player3, filteredMatches, context, isMixedContext]);

  const radarChartData = useMemo(() => {
    const players = [
      { name: player1, stats: player1Stats },
      { name: player2, stats: player2Stats },
      { name: player3, stats: player3Stats },
    ].filter(p => p.name && p.stats);

    if (players.length === 0) return [];

    const radarMetrics: { label: string; key: keyof PlayerContextStats }[] = [
      { label: 'G/P', key: 'gpm' },
      { label: 'A/P', key: 'apm' },
      { label: '% V', key: 'winRate' },
      { label: 'PJ', key: 'matchesPlayed' },
      { label: 'Pts', key: 'points' },
    ];
    
    const colors = [theme.colors.accent1, theme.colors.accent2, theme.colors.accent3];

    return players.map((player, index) => ({
      name: player.name!,
      color: colors[index % colors.length],
      data: radarMetrics.map(metric => ({
        label: metric.label,
        value: player.stats![metric.key] as number,
      })),
    }));
  }, [player1, player2, player3, player1Stats, player2Stats, player3Stats, theme.colors]);

  const handleAnalysis = async () => {
    const playersForAnalysis = [
        { name: player1, stats: player1Stats, context: isMixedContext ? 'teammate' : context },
        { name: player2, stats: player2Stats, context: isMixedContext ? 'opponent' : context },
        { name: player3, stats: player3Stats, context: context },
    ].filter(p => p.name && p.stats) as { name: string; stats: PlayerContextStats; context: 'teammates' | 'opponents' }[];

    if (playersForAnalysis.length < 2) {
        setAnalysisError("Selecciona al menos 2 jugadores con datos para analizar.");
        return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);

    try {
        const result = await generatePlayerComparisonAnalysis(playersForAnalysis);
        setAnalysis(result);
        onAnalysisGenerated({ players: playersForAnalysis.map(p => p.name), context, analysis: result });
    } catch (error) {
        setAnalysisError("No se pudo generar el análisis. Inténtalo de nuevo.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const currentHistoryMatches = useMemo(() => {
      if (historyView === 'player1') return player1Stats?.matches;
      if (historyView === 'player2') return player2Stats?.matches;
      if (historyView === 'player3') return player3Stats?.matches;
      return [];
  }, [historyView, player1Stats, player2Stats, player3Stats]);

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '800px',
      maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      animation: 'scaleUp 0.3s ease', border: `1px solid ${theme.colors.border}`,
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`, flexShrink: 0,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
      overflowY: 'auto', padding: theme.spacing.large, display: 'grid',
      gridTemplateColumns: '1fr', gap: theme.spacing.large,
    },
    playerSelection: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium,
      alignItems: 'center',
    },
    contextSelector: {
        display: 'flex', backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.borderStrong}`, padding: '0.25rem', gridColumn: '1 / -1'
    },
    contextButton: { flex: 1, background: 'none', border: 'none', color: theme.colors.secondaryText, padding: '0.5rem', borderRadius: theme.borderRadius.small, cursor: 'pointer', fontWeight: 600 },
    activeContext: { backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText },
    addPlayerButton: { gridColumn: '1 / -1', background: 'none', border: `1px dashed ${theme.colors.borderStrong}`, color: theme.colors.secondaryText, padding: '0.5rem', borderRadius: theme.borderRadius.medium, cursor: 'pointer' },
    analysisSection: { display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' },
    analysisText: { fontStyle: 'italic', color: theme.colors.primaryText, lineHeight: 1.6, margin: 0, padding: '1rem', backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium, border: `1px solid ${theme.colors.border}`},
  };
  
  const player1Label = player1 ? (isMixedContext ? `Yo (Con ${player1})` : player1) : 'Jugador 1';
  const player2Label = player2 ? (isMixedContext ? `Yo (Contra ${player2})` : player2) : 'Jugador 2';
  const player3Label = player3 || 'Jugador 3';

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); } }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <header style={styles.header}>
            <h2 style={styles.title}>Comparativa de Jugadores</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.content} className="subtle-scrollbar">
              <div style={styles.playerSelection}>
                  <AutocompleteInput value={player1 || ''} onChange={setPlayer1} suggestions={allPlayers} placeholder="Jugador 1" />
                  <AutocompleteInput value={player2 || ''} onChange={setPlayer2} suggestions={allPlayers.filter(p => p !== player1)} placeholder="Jugador 2" />
                  {showThirdPlayer && <AutocompleteInput value={player3 || ''} onChange={setPlayer3} suggestions={allPlayers.filter(p => p !== player1 && p !== player2)} placeholder="Jugador 3" />}
                  {isMixedContext ? (
                    <div style={{...styles.contextSelector, padding: '0.75rem', justifyContent: 'center', fontWeight: 600}}>
                        <span style={{color: theme.colors.accent1}}>Sinergia</span> vs <span style={{color: theme.colors.accent2}}>Desafío</span>
                    </div>
                  ) : (
                    <div style={styles.contextSelector}>
                        <button onClick={() => setContext('teammates')} style={context === 'teammates' ? {...styles.contextButton, ...styles.activeContext} : styles.contextButton}>Compañeros</button>
                        <button onClick={() => setContext('opponents')} style={context === 'opponents' ? {...styles.contextButton, ...styles.activeContext} : styles.contextButton}>Rivales</button>
                    </div>
                  )}
                  {!showThirdPlayer && !isMixedContext && <button onClick={() => setShowThirdPlayer(true)} style={styles.addPlayerButton}>+ Añadir jugador</button>}
              </div>
              
              <YearFilter years={availableYears} selectedYear={selectedYear} onSelectYear={setSelectedYear} />

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr', gap: '1rem'}}>
                  <div>
                    {radarChartData.length > 0 && <RadarChart playersData={radarChartData} size={250} />}
                  </div>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', textAlign: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                        <span></span>
                        <span style={{fontWeight: 'bold'}}>{player1Label}</span>
                        <span style={{fontWeight: 'bold'}}>{player2Label}</span>
                        {showThirdPlayer && <span style={{fontWeight: 'bold'}}>{player3Label}</span>}
                    </div>
                    <ComparativeStatRow label="Partidos Jugados" values={[player1Stats?.matchesPlayed, player2Stats?.matchesPlayed, showThirdPlayer ? player3Stats?.matchesPlayed : undefined]} format={v => v.toString()} />
                    <ComparativeStatRow label="% Victorias" values={[player1Stats?.winRate, player2Stats?.winRate, showThirdPlayer ? player3Stats?.winRate : undefined]} format={v => `${v.toFixed(1)}%`} />
                    <ComparativeStatRow label="Goles / Partido" values={[player1Stats?.gpm, player2Stats?.gpm, showThirdPlayer ? player3Stats?.gpm : undefined]} format={v => v.toFixed(2)} />
                    <ComparativeStatRow label="Asist. / Partido" values={[player1Stats?.apm, player2Stats?.apm, showThirdPlayer ? player3Stats?.apm : undefined]} format={v => v.toFixed(2)} />
                    <ComparativeStatRow label="Puntos" values={[player1Stats?.points, player2Stats?.points, showThirdPlayer ? player3Stats?.points : undefined]} format={v => v.toString()} />
                  </div>
              </div>
              
              <div style={styles.analysisSection}>
                  {analysis && <p style={styles.analysisText}>{analysis}</p>}
                  {!analysis && (
                      <button onClick={handleAnalysis} disabled={isAnalyzing} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: `1px solid ${theme.colors.accent2}`, color: theme.colors.accent2, padding: '0.5rem 1rem', borderRadius: theme.borderRadius.medium, cursor: 'pointer'}}>
                          {isAnalyzing ? <Loader /> : <SparklesIcon />}
                          <span>Análisis IA</span>
                      </button>
                  )}
                  {analysisError && <p style={{color: theme.colors.loss}}>{analysisError}</p>}
              </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default PlayerCompareModal;