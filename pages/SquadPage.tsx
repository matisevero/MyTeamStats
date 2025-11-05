import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { SquadPlayerStats, PlayerPairStats } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { UsersIcon } from '../components/icons/UsersIcon';
import Card from '../components/common/Card';
import RankedPlayerListItem from '../components/squad/RankedPlayerListItem';
import PlayerComparator from '../components/squad/PlayerComparator';
import AssociationHeatmap from '../components/squad/AssociationHeatmap';
import AssociationListItem from '../components/squad/AssociationListItem';

const HEADERS: { key: keyof SquadPlayerStats; label: string; isNumeric: boolean }[] = [
    { key: 'name', label: 'Nombre', isNumeric: false },
    { key: 'matchesPlayed', label: 'PJ', isNumeric: true },
    { key: 'starts', label: 'Titular/Sup.', isNumeric: false },
    { key: 'minutesPlayed', label: 'Minutos', isNumeric: true },
    { key: 'record', label: 'Récord', isNumeric: false },
    { key: 'winRate', label: '% Vic.', isNumeric: true },
    { key: 'goals', label: 'Goles', isNumeric: true },
    { key: 'assists', label: 'Asist.', isNumeric: true },
    { key: 'gpm', label: 'G/P', isNumeric: true },
    { key: 'apm', label: 'A/P', isNumeric: true },
];

const SquadPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, setViewingPlayerName } = useData();
  const [sortConfig, setSortConfig] = useState<{ key: keyof SquadPlayerStats; direction: 'asc' | 'desc' }>({ key: 'matchesPlayed', direction: 'desc' });

  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevGoleadoresRef = useRef<SquadPlayerStats[]>([]);
  const prevAsistidoresRef = useRef<SquadPlayerStats[]>([]);
  const prevVallasInvictasRef = useRef<SquadPlayerStats[]>([]);
  const prevAssociationsRef = useRef<PlayerPairStats[]>([]);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const myTeams = useMemo(() => {
    const teams = new Set<string>();
    matches.forEach(m => {
        if (m.teamName) teams.add(m.teamName);
    });
    return Array.from(teams).sort();
  }, [matches]);

  const relevantMatches = useMemo(() => {
    return selectedTeam === 'all' 
      ? matches 
      : matches.filter(m => m.teamName === selectedTeam);
  }, [matches, selectedTeam]);
  
  const squadStats: SquadPlayerStats[] = useMemo(() => {
    const playerStats: { [name: string]: Omit<SquadPlayerStats, 'name' | 'winRate' | 'gpm' | 'apm' | 'minutesPercentage' | 'efectividad' | 'cleanSheets'> & { isGoalkeeper: boolean; goalsAgainst: number } } = {};
    const playerCleanSheets: Record<string, number> = {};

    relevantMatches.forEach(match => {
        if (match.opponentScore === 0) {
            match.players.forEach(p => {
                if(p.name) {
                    playerCleanSheets[p.name] = (playerCleanSheets[p.name] || 0) + 1;
                }
            });
        }

        match.players.forEach(p => {
            if (!p.name) return;
            if (!playerStats[p.name]) {
                playerStats[p.name] = {
                    matchesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    minutesPlayed: 0,
                    starts: 0,
                    subAppearances: 0,
                    record: { wins: 0, draws: 0, losses: 0 },
                    isGoalkeeper: false,
                    goalsAgainst: 0,
                };
            }
            const stats = playerStats[p.name];
            stats.matchesPlayed++;
            if (match.result === 'VICTORIA') stats.record.wins++;
            else if (match.result === 'EMPATE') stats.record.draws++;
            else stats.record.losses++;

            stats.goals += p.goals;
            stats.assists += p.assists;
            stats.minutesPlayed += p.minutesPlayed ?? 0;
            if (p.status === 'starter' || p.status === 'goalkeeper') {
                stats.starts++;
            } else if (p.status === 'substitute') {
                stats.subAppearances++;
            }
            
            if (p.status === 'goalkeeper') {
                stats.isGoalkeeper = true;
                stats.goalsAgainst += match.opponentScore;
            }
        });
    });

    const statsArray = Object.entries(playerStats).map(([name, stats]) => {
      const points = stats.record.wins * 3 + stats.record.draws;
      return {
        name,
        ...stats,
        winRate: stats.matchesPlayed > 0 ? (stats.record.wins / stats.matchesPlayed) * 100 : 0,
        efectividad: stats.matchesPlayed > 0 ? (points / (stats.matchesPlayed * 3)) * 100 : 0,
        gpm: stats.matchesPlayed > 0 ? stats.goals / stats.matchesPlayed : 0,
        apm: stats.matchesPlayed > 0 ? stats.assists / stats.matchesPlayed : 0,
        minutesPlayed: stats.minutesPlayed,
        cleanSheets: playerCleanSheets[name] || 0,
      };
    });

    if (statsArray.length === 0) return [];

    const maxMinutes = Math.max(...statsArray.map(p => p.minutesPlayed));

    return statsArray.map(player => ({
      ...player,
      minutesPercentage: maxMinutes > 0 ? (player.minutesPlayed / maxMinutes) * 100 : 0,
    }));
  }, [relevantMatches]);
  
  const topGoleadores = useMemo(() => {
    const sorted = [...squadStats].sort((a,b) => b.goals - a.goals || b.matchesPlayed - a.matchesPlayed).slice(0, 10);
    const previousRanking = prevGoleadoresRef.current;
    
    const withMovement = sorted.map((player, index) => {
        const oldIndex = previousRanking.findIndex(p => p.name === player.name);
        let rankMovement: PlayerPairStats['rankMovement'] = 'stable';
        if (oldIndex === -1) rankMovement = 'new';
        else if (index < oldIndex) rankMovement = 'up';
        else if (index > oldIndex) rankMovement = 'down';
        return { ...player, rankMovement };
    });
    
    prevGoleadoresRef.current = sorted;
    return withMovement;
  }, [squadStats]);
  
  const topAsistidores = useMemo(() => {
    const sorted = [...squadStats].sort((a,b) => b.assists - a.assists || b.matchesPlayed - a.matchesPlayed).slice(0, 10);
    const previousRanking = prevAsistidoresRef.current;
    
    const withMovement = sorted.map((player, index) => {
        const oldIndex = previousRanking.findIndex(p => p.name === player.name);
        let rankMovement: PlayerPairStats['rankMovement'] = 'stable';
        if (oldIndex === -1) rankMovement = 'new';
        else if (index < oldIndex) rankMovement = 'up';
        else if (index > oldIndex) rankMovement = 'down';
        return { ...player, rankMovement };
    });
    
    prevAsistidoresRef.current = sorted;
    return withMovement;
  }, [squadStats]);

  const topVallasInvictas = useMemo(() => {
    const goalkeepers = squadStats.filter(p => p.isGoalkeeper);
    const sorted = [...goalkeepers].sort((a,b) => b.cleanSheets - a.cleanSheets || b.matchesPlayed - a.matchesPlayed).slice(0, 10);
    const previousRanking = prevVallasInvictasRef.current;
    
    const withMovement = sorted.map((player, index) => {
        const oldIndex = previousRanking.findIndex(p => p.name === player.name);
        let rankMovement: PlayerPairStats['rankMovement'] = 'stable';
        if (oldIndex === -1) rankMovement = 'new';
        else if (index < oldIndex) rankMovement = 'up';
        else if (index > oldIndex) rankMovement = 'down';
        return { ...player, rankMovement };
    });
    
    prevVallasInvictasRef.current = sorted;
    return withMovement;
  }, [squadStats]);
  
  const associationData = useMemo(() => {
    if (relevantMatches.length < 3) return { pairs: [], topPlayers: [] };

    const pairStats: Record<string, {
        player1: string; player2: string; matchesTogether: number;
        points: number; goals: number; assists: number; minutes: number; wins: number;
    }> = {};

    relevantMatches.forEach(match => {
        const playersInMatch = match.players;
        if (playersInMatch.length < 2) return;

        for (let i = 0; i < playersInMatch.length; i++) {
            for (let j = i + 1; j < playersInMatch.length; j++) {
                const p1 = playersInMatch[i]; const p2 = playersInMatch[j];
                if (!p1.name || !p2.name) continue;

                const pairKey = [p1.name, p2.name].sort().join('-');
                if (!pairStats[pairKey]) {
                    pairStats[pairKey] = { player1: p1.name, player2: p2.name, matchesTogether: 0, points: 0, goals: 0, assists: 0, minutes: 0, wins: 0 };
                }

                const stats = pairStats[pairKey];
                stats.matchesTogether++;
                if (match.result === 'VICTORIA') {
                    stats.points += 3;
                    stats.wins++;
                }
                if (match.result === 'EMPATE') stats.points += 1;
                stats.goals += p1.goals + p2.goals;
                stats.assists += p1.assists + p2.assists;
                stats.minutes += Math.min(p1.minutesPlayed || 0, p2.minutesPlayed || 0);
            }
        }
    });

    const sortedPairs = Object.values(pairStats)
        .filter(pair => pair.matchesTogether > 2)
        .map(pair => {
            const pointsPerMatch = pair.points / pair.matchesTogether;
            const goalsPerMatch = pair.goals / pair.matchesTogether;
            const assistsPerMatch = pair.assists / pair.matchesTogether;
            const impactScore = (pointsPerMatch * 1.5) + (goalsPerMatch * 1) + (assistsPerMatch * 0.75);
            const winRate = pair.matchesTogether > 0 ? (pair.wins / pair.matchesTogether) * 100 : 0;
            const efectividad = pair.matchesTogether > 0 ? (pair.points / (pair.matchesTogether * 3)) * 100 : 0;
            return { ...pair, impactScore, winRate, efectividad };
        })
        .sort((a, b) => b.impactScore - a.impactScore);

    const previousRanking = prevAssociationsRef.current;
    const withMovement = sortedPairs.map((pair, index) => {
        const pairKey = [pair.player1, pair.player2].sort().join('-');
        const oldIndex = previousRanking.findIndex(p => [p.player1, p.player2].sort().join('-') === pairKey);
        
        let rankMovement: PlayerPairStats['rankMovement'] = 'stable';
        if (oldIndex === -1) rankMovement = 'new';
        else if (index < oldIndex) rankMovement = 'up';
        else if (index > oldIndex) rankMovement = 'down';
        
        return { ...pair, rankMovement };
    });
    
    prevAssociationsRef.current = sortedPairs;

    const topPlayers = [...squadStats].sort((a,b) => b.matchesPlayed - a.matchesPlayed).slice(0, 12).map(p => p.name);

    return { pairs: withMovement, topPlayers };
  }, [relevantMatches, squadStats]);
  
  const analysisCards = useMemo(() => [
    {
      icon: '🤝',
      title: 'Mejores Asociaciones',
      description: 'Análisis de la química y rendimiento entre los jugadores del equipo.',
      data: associationData,
      type: 'associations'
    },
    {
      icon: '⚽️',
      title: 'Top Goleadores',
      description: 'Máximos anotadores del equipo en el período seleccionado.',
      data: topGoleadores.filter(p => p.goals > 0),
      type: 'goleadores'
    },
    {
      icon: '👟',
      title: 'Top Asistidores',
      description: 'Jugadores con más asistencias en el período seleccionado.',
      data: topAsistidores.filter(p => p.assists > 0),
      type: 'asistidores'
    },
    {
      icon: '🧤',
      title: 'Vallas Invictas',
      description: 'Arqueros con más partidos sin recibir goles.',
      data: topVallasInvictas.filter(p => p.cleanSheets > 0),
      type: 'vallas'
    },
  ], [associationData, topGoleadores, topAsistidores, topVallasInvictas]);

  const allPlayerNames = useMemo(() => squadStats.map(p => p.name).sort(), [squadStats]);

  const sortedSquad = useMemo(() => {
    return [...squadStats].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      if (sortConfig.key === 'record') {
          const pointsA = a.record.wins * 3 + a.record.draws;
          const pointsB = b.record.wins * 3 + b.record.draws;
          if (pointsA < pointsB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (pointsA > pointsB) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return b.matchesPlayed - a.matchesPlayed; // Secondary sort
    });
  }, [squadStats, sortConfig]);

  const requestSort = (key: keyof SquadPlayerStats) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: keyof SquadPlayerStats) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'desc' ? ' ↓' : ' ↑';
  };
  
  const getCellContent = (player: SquadPlayerStats, key: keyof SquadPlayerStats) => {
    const value = player[key];
    switch(key) {
        case 'name':
            return <div style={{fontWeight: 'bold', cursor: 'pointer'}} onClick={() => setViewingPlayerName(player.name)}>{value}</div>;
        case 'starts':
            return `${player.starts}-${player.subAppearances}`;
        case 'record':
            const record = value as SquadPlayerStats['record'];
            return `${record.wins}-${record.draws}-${record.losses}`;
        case 'minutesPlayed':
             return (
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.small }}>
                    <span>{player.minutesPlayed}</span>
                    <div style={styles.progressBarContainer} title={`${player.minutesPercentage.toFixed(1)}%`}>
                        <div style={{...styles.progressBar, width: `${player.minutesPercentage}%` }}></div>
                    </div>
                </div>
            );
        case 'goals':
            if (player.isGoalkeeper) {
                return `(-${player.goalsAgainst ?? 0})`;
            }
            return value;
        case 'winRate':
            return `${(value as number).toFixed(1)}%`;
        case 'gpm':
        case 'apm':
            return (value as number).toFixed(2);
        default:
            return value;
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
        const { scrollLeft, offsetWidth } = scrollContainerRef.current;
        const newActiveSlide = Math.round(scrollLeft / offsetWidth);
        if (newActiveSlide !== activeSlide) {
            setActiveSlide(newActiveSlide);
        }
    }
  };

  const scrollToSlide = (index: number) => {
      if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
              left: scrollContainerRef.current.offsetWidth * index,
              behavior: 'smooth',
          });
      }
  };
  
  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium },
    tableWrapper: { overflowX: 'auto', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.medium },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: `${theme.spacing.small} ${theme.spacing.medium}`, textAlign: 'left', fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 600, borderBottom: `2px solid ${theme.colors.borderStrong}`, cursor: 'pointer', whiteSpace: 'nowrap' },
    tr: { transition: 'background-color 0.2s' },
    td: { padding: `${theme.spacing.medium}`, fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, borderBottom: `1px solid ${theme.colors.border}`, whiteSpace: 'nowrap' },
    noDataContainer: { textAlign: 'center', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, color: theme.colors.secondaryText, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px solid ${theme.colors.border}` },
    progressBarContainer: {
        width: isDesktop ? '100px' : '50px',
        height: '8px',
        backgroundColor: theme.colors.border,
        borderRadius: '4px',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: theme.colors.accent1,
        borderRadius: '4px',
        transition: 'width 0.3s ease-out'
    },
    filterContainer: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    filterLabel: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, fontWeight: 500 },
    filterSelect: {
        flex: 1,
        backgroundColor: theme.colors.background,
        color: theme.colors.primaryText,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.small,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
        cursor: 'pointer',
    },
    carouselWrapper: {
        width: '100%',
        maxWidth: '420px',
        margin: '0 auto',
    },
    carouselContainer: {
        display: 'flex',
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        paddingBottom: theme.spacing.medium,
    },
    carouselSlide: {
        flex: '0 0 100%',
        scrollSnapAlign: 'center',
        width: '100%',
    },
    cardDescription: {
        fontSize: '0.875rem',
        color: theme.colors.secondaryText,
        margin: `0 0 ${theme.spacing.medium} 0`,
        textAlign: 'center',
    },
    paginationContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: theme.spacing.small,
        marginTop: theme.spacing.medium,
        marginBottom: theme.spacing.large,
    },
    dot: {
        width: '8px', height: '8px', borderRadius: '50%',
        background: theme.colors.borderStrong, border: 'none', cursor: 'pointer',
        padding: 0, transition: 'all 0.3s ease',
    },
    activeDot: {
        background: theme.colors.accent1,
        transform: 'scale(1.25)',
    },
  };

  if (matches.length === 0) {
      return (
          <main style={styles.container}>
            <h2 style={styles.pageTitle}>Plantel</h2>
            <div style={styles.noDataContainer}>
                <UsersIcon size={40} color={theme.colors.secondaryText} />
                <p style={{ marginTop: theme.spacing.medium }}>Añade jugadores a tus partidos para ver las estadísticas del plantel.</p>
            </div>
          </main>
      )
  }

  return (
    <>
    <style>{`
        .table-row:hover { background-color: ${theme.colors.background}; }
        .subtle-scrollbar::-webkit-scrollbar { height: 8px; }
        .subtle-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .subtle-scrollbar::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 10px; }
        .subtle-scrollbar { scrollbar-width: thin; scrollbar-color: ${theme.colors.border} transparent; }
        .carousel-scrollbar { scrollbar-width: none; }
        .carousel-scrollbar::-webkit-scrollbar { display: none; }
    `}</style>
    <main style={styles.container}>
      <h2 style={styles.pageTitle}>Plantel del Equipo</h2>
      
      {myTeams.length > 1 && (
        <Card>
            <div style={styles.filterContainer}>
                <label style={styles.filterLabel}>Mostrando plantel de:</label>
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={styles.filterSelect}>
                    <option value="all">Todos mis equipos</option>
                    {myTeams.map(team => <option key={team} value={team}>{team}</option>)}
                </select>
            </div>
        </Card>
      )}

      {squadStats.length === 0 ? (
         <div style={styles.noDataContainer}>
            <UsersIcon size={40} color={theme.colors.secondaryText} />
            <p style={{ marginTop: theme.spacing.medium }}>No hay jugadores registrados para {selectedTeam} en el historial.</p>
        </div>
      ) : (
        <>
            <div style={styles.carouselWrapper}>
                <div ref={scrollContainerRef} style={styles.carouselContainer} onScroll={handleScroll} className="carousel-scrollbar">
                    {analysisCards.map((card, index) => (
                        <div key={index} style={styles.carouselSlide}>
                            <Card title={<>{card.icon} {card.title}</>}>
                                <p style={styles.cardDescription}>{card.description}</p>
                                {card.type === 'associations' && (
                                    isDesktop ? (
                                        <AssociationHeatmap 
                                            players={associationData.topPlayers} 
                                            pairs={associationData.pairs} 
                                        />
                                    ) : (
                                        <div>
                                            {associationData.pairs.slice(0, 10).map((pair, index, arr) => (
                                                <AssociationListItem
                                                    key={`${pair.player1}-${pair.player2}`}
                                                    rank={index + 1}
                                                    pair={pair}
                                                    isLast={index === arr.length - 1}
                                                />
                                            ))}
                                        </div>
                                    )
                                )}
                                {(card.type === 'goleadores' || card.type === 'asistidores' || card.type === 'vallas') && 
                                  (card.data as (SquadPlayerStats & { rankMovement: PlayerPairStats['rankMovement'] })[]).map((player, index, arr) => (
                                    <RankedPlayerListItem
                                      key={player.name}
                                      rank={index + 1}
                                      playerName={player.name}
                                      statValue={card.type === 'goleadores' ? player.goals : card.type === 'asistidores' ? player.assists : player.cleanSheets}
                                      rankMovement={player.rankMovement}
                                      secondaryStatValue={
                                          card.type === 'goleadores' ? `${player.gpm.toFixed(2)} G/P` :
                                          card.type === 'asistidores' ? `${player.apm.toFixed(2)} A/P` :
                                          `${player.matchesPlayed > 0 ? ((player.cleanSheets / player.matchesPlayed) * 100).toFixed(0) : 0}% V.I.`
                                      }
                                      isLast={index === arr.length - 1}
                                    />
                                ))}
                            </Card>
                        </div>
                    ))}
                </div>
                <div style={styles.paginationContainer}>
                    {analysisCards.map((_, index) => (
                        <button key={index} style={index === activeSlide ? {...styles.dot, ...styles.activeDot} : styles.dot} onClick={() => scrollToSlide(index)} aria-label={`Ir a la tarjeta ${index + 1}`}/>
                    ))}
                </div>
            </div>
            
            <div style={styles.tableWrapper} className="subtle-scrollbar">
              <table style={styles.table}>
                <thead>
                  <tr>
                    {HEADERS.map(header => (
                      <th key={header.key} style={styles.th} onClick={() => requestSort(header.key)}>
                        {header.label}{getSortIndicator(header.key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedSquad.map(player => (
                    <tr key={player.name} style={styles.tr} className="table-row">
                      {HEADERS.map(header => (
                          <td key={header.key} style={{...styles.td, ...(header.isNumeric && {textAlign: 'right'})}}>
                              {getCellContent(player, header.key)}
                          </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PlayerComparator squadStats={squadStats} allPlayerNames={allPlayerNames} />
        </>
      )}
    </main>
    </>
  );
};

export default SquadPage;