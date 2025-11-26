
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
import SettingsSection from '../components/common/SettingsSection';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ChevronIcon } from '../components/icons/ChevronIcon';

const HEADERS: { key: keyof SquadPlayerStats; label: string; isNumeric: boolean }[] = [
    { key: 'jerseyNumber', label: '#', isNumeric: true },
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
  const { matches, setViewingPlayerName, myTeamPlayers, addPlayerToRoster, deletePlayerFromRoster, playerProfiles, updatePlayerProfile, activeTeams, userRole } = useData();
  const [sortConfig, setSortConfig] = useState<{ key: keyof SquadPlayerStats; direction: 'asc' | 'desc' }>({ key: 'matchesPlayed', direction: 'desc' });

  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  
  const [editingJersey, setEditingJersey] = useState<string | null>(null);
  const [jerseyInput, setJerseyInput] = useState('');

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevGoleadoresRef = useRef<SquadPlayerStats[]>([]);
  const prevAsistidoresRef = useRef<SquadPlayerStats[]>([]);
  const prevVallasInvictasRef = useRef<SquadPlayerStats[]>([]);
  const prevAssociationsRef = useRef<PlayerPairStats[]>([]);
  
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  const canEdit = ['owner', 'admin', 'editor'].includes(userRole);
  
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const relevantMatches = useMemo(() => {
    if (selectedTeam === 'all') {
        return matches.filter(m => activeTeams.includes(m.teamName));
    }
    return matches.filter(m => m.teamName === selectedTeam);
  }, [matches, selectedTeam, activeTeams]);
  
  const squadStats: SquadPlayerStats[] = useMemo(() => {
    const playerStats: { [name: string]: Omit<SquadPlayerStats, 'name' | 'winRate' | 'gpm' | 'apm' | 'minutesPercentage' | 'efectividad' | 'cleanSheets' | 'jerseyNumber'> & { isGoalkeeper: boolean; goalsAgainst: number } } = {};
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
        jerseyNumber: playerProfiles[name]?.jerseyNumber,
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
  }, [relevantMatches, playerProfiles]);
  
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
    if (relevantMatches.length < 3) return { pairs: [], topPlayers: [], allPlayers: [], allPairs: [] };

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
                if (p1.status === 'goalkeeper' || p2.status === 'goalkeeper') {
                    continue;
                }
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

    const allRawPairs = Object.values(pairStats).map(pair => {
        const pointsPerMatch = pair.points / pair.matchesTogether;
        const goalsPerMatch = pair.goals / pair.matchesTogether;
        const assistsPerMatch = pair.assists / pair.matchesTogether;
        const impactScore = (pointsPerMatch * 1.5) + (goalsPerMatch * 1) + (assistsPerMatch * 0.75);
        const winRate = pair.matchesTogether > 0 ? (pair.wins / pair.matchesTogether) * 100 : 0;
        const efectividad = pair.matchesTogether > 0 ? (pair.points / (pair.matchesTogether * 3)) * 100 : 0;
        return { ...pair, impactScore, winRate, efectividad };
    });

    // Filter for the "Top List"
    const sortedPairs = allRawPairs
        .filter(pair => pair.matchesTogether > 2)
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

    // Get players who actually have associations and calculate max impact for sorting
    const playersWithAssociations = new Set<string>();
    const playerMaxImpact: Record<string, number> = {};

    allRawPairs.forEach(pair => {
        if (pair.matchesTogether > 0) {
            playersWithAssociations.add(pair.player1);
            playersWithAssociations.add(pair.player2);
            
            const currentMax1 = playerMaxImpact[pair.player1] ?? -Infinity;
            playerMaxImpact[pair.player1] = Math.max(currentMax1, pair.impactScore);
            
            const currentMax2 = playerMaxImpact[pair.player2] ?? -Infinity;
            playerMaxImpact[pair.player2] = Math.max(currentMax2, pair.impactScore);
        }
    });

    // Filter squad stats to only include players with associations and sort by MAX Impact (descending)
    const allPlayers = [...squadStats]
        .filter(p => playersWithAssociations.has(p.name))
        .sort((a, b) => {
            const impactA = playerMaxImpact[a.name] ?? -Infinity;
            const impactB = playerMaxImpact[b.name] ?? -Infinity;
            if (Math.abs(impactA - impactB) > 0.001) return impactB - impactA;
            return b.matchesPlayed - a.matchesPlayed;
        })
        .map(p => p.name);

    const topPlayers = [...squadStats].sort((a,b) => b.matchesPlayed - a.matchesPlayed).slice(0, 12).map(p => p.name);

    return { pairs: withMovement, allPairs: allRawPairs, topPlayers, allPlayers };
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

  const displayedSquad = useMemo(() => {
      if (showAllPlayers) return sortedSquad;
      return sortedSquad.slice(0, 30);
  }, [sortedSquad, showAllPlayers]);

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
  
  const handleJerseyEditStart = (player: SquadPlayerStats) => {
    if (!canEdit) return;
    setEditingJersey(player.name);
    setJerseyInput(player.jerseyNumber?.toString() || '');
  };

  const handleJerseyEditSave = () => {
    if (!editingJersey) return;
    const newNumber = jerseyInput.trim() === '' ? undefined : parseInt(jerseyInput, 10);
    if (newNumber !== undefined && isNaN(newNumber)) return;
    updatePlayerProfile(editingJersey, { jerseyNumber: newNumber });
    setEditingJersey(null);
  };
  
  const getCellContent = (player: SquadPlayerStats, key: keyof SquadPlayerStats) => {
    const value = player[key];
    switch(key) {
        case 'jerseyNumber':
            if (editingJersey === player.name) {
                return <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={jerseyInput}
                    onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setJerseyInput(numericValue);
                    }}
                    onBlur={handleJerseyEditSave}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleJerseyEditSave(); }}
                    autoFocus
                    style={{ width: '40px', textAlign: 'center', backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.accent1}`, borderRadius: '4px', fontSize: theme.typography.fontSize.extraSmall, padding: theme.spacing.extraSmall }}
                />;
            }
            return <div onClick={() => handleJerseyEditStart(player)} style={{ cursor: canEdit ? 'pointer' : 'default', minWidth: '40px', textAlign: 'center' }}>{value || '-'}</div>;
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

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
        addPlayerToRoster(newPlayerName);
        setNewPlayerName('');
        setIsAddingPlayer(false);
    }
  };
  
  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.large,
        flexWrap: 'wrap',
    },
    pageTitle: { fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText, margin: 0, borderLeft: `4px solid ${theme.colors.accent1}`, paddingLeft: theme.spacing.medium },
    filterContainer: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    filterLabel: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, fontWeight: 500 },
    filterSelect: {
        backgroundColor: theme.colors.surface,
        color: theme.colors.primaryText,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.small,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
        cursor: 'pointer',
    },
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
    desktopGrid: {
        display: 'grid',
        // REORDERED: Main content (Table) first, Side panel (Carousel) second
        gridTemplateColumns: 'minmax(0, 1fr) 420px',
        gap: theme.spacing.extraLarge,
        alignItems: 'start',
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.large,
    },
    showMoreButton: {
        width: '100%',
        padding: theme.spacing.medium,
        backgroundColor: theme.colors.background,
        border: 'none',
        borderTop: `1px solid ${theme.colors.border}`,
        color: theme.colors.accent2,
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        borderBottomLeftRadius: theme.borderRadius.large,
        borderBottomRightRadius: theme.borderRadius.large,
    }
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
  
  const filteredCards = isDesktop 
    ? analysisCards.filter(c => c.type !== 'associations') 
    : analysisCards;

  const analysisContent = (
    <div style={styles.carouselWrapper}>
        <div ref={scrollContainerRef} style={styles.carouselContainer} onScroll={handleScroll} className="carousel-scrollbar">
            {filteredCards.map((card, index) => (
                <div key={index} style={styles.carouselSlide}>
                    <Card title={<>{card.icon} {card.title}</>}>
                        <p style={styles.cardDescription}>{card.description}</p>
                        {card.type === 'associations' && (
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
            {filteredCards.map((_, index) => (
                <button key={index} style={index === activeSlide ? {...styles.dot, ...styles.activeDot} : styles.dot} onClick={() => scrollToSlide(index)} aria-label={`Ir a la tarjeta ${index + 1}`}/>
            ))}
        </div>
    </div>
  );
  
  const tableContent = (
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
          {displayedSquad.map(player => (
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
      {sortedSquad.length > 30 && (
          <button 
            onClick={() => setShowAllPlayers(!showAllPlayers)} 
            style={styles.showMoreButton}
          >
              {showAllPlayers ? 'Mostrar menos' : `Ver todos los jugadores (${sortedSquad.length})`}
              <span style={{marginLeft: '8px'}}><ChevronIcon isExpanded={showAllPlayers} /></span>
          </button>
      )}
    </div>
  );

  const rosterManagementContent = canEdit ? (
    <div>
        {!isAddingPlayer ? (
            <button
                onClick={() => setIsAddingPlayer(true)}
                style={{
                    width: '100%',
                    padding: theme.spacing.medium,
                    background: 'none',
                    border: `1px dashed ${theme.colors.borderStrong}`,
                    color: theme.colors.secondaryText,
                    borderRadius: theme.borderRadius.medium,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: theme.typography.fontSize.small,
                }}
            >
                + Añadir Jugador al Plantel
            </button>
        ) : (
            <div style={{ animation: 'fadeInContent 0.5s ease-out' }}>
                <form onSubmit={handleAddPlayer} style={{ display: 'flex', gap: theme.spacing.small }}>
                    <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="Nombre del jugador"
                        style={{
                            flex: 1,
                            padding: theme.spacing.medium,
                            background: theme.colors.background,
                            border: `1px solid ${theme.colors.borderStrong}`,
                            borderRadius: theme.borderRadius.medium,
                            color: theme.colors.primaryText,
                        }}
                        autoFocus
                    />
                    <button
                        type="submit"
                        style={{
                            padding: `0 ${theme.spacing.medium}`,
                            border: 'none',
                            background: theme.colors.accent1,
                            color: theme.colors.textOnAccent,
                            borderRadius: theme.borderRadius.medium,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                    >
                        Añadir
                    </button>
                </form>
            </div>
        )}
    </div>
  ) : null;


  return (
    <>
    <style>{`
        .table-row:hover { background-color: ${theme.colors.background}; }
        .subtle-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
        .subtle-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .subtle-scrollbar::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 10px; }
        .subtle-scrollbar { scrollbar-width: thin; scrollbar-color: ${theme.colors.border} transparent; }
        .carousel-scrollbar { scrollbar-width: none; }
        .carousel-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes fadeInContent {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
    <main style={styles.container}>
        <div style={styles.header}>
            <h2 style={styles.pageTitle}>Plantel del Equipo</h2>
            {activeTeams.length > 1 && (
                 <div style={styles.filterContainer}>
                    <label style={styles.filterLabel}>Equipo:</label>
                    <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={styles.filterSelect}>
                        <option value="all">Todos mis equipos</option>
                        {activeTeams.map(team => <option key={team} value={team}>{team}</option>)}
                    </select>
                </div>
            )}
        </div>
      
      {squadStats.length === 0 && myTeamPlayers.length === 0 ? (
         <div style={styles.noDataContainer}>
            <UsersIcon size={40} color={theme.colors.secondaryText} />
            <p style={{ marginTop: theme.spacing.medium }}>Añade jugadores para ver las estadísticas del plantel.</p>
            {rosterManagementContent}
        </div>
      ) : (
        isDesktop ? (
            <>
                <div style={styles.desktopGrid}>
                    <div style={styles.column}>
                        {tableContent}
                    </div>
                    <div style={styles.column}>
                        {analysisContent}
                        <PlayerComparator squadStats={squadStats} allPlayerNames={allPlayerNames} />
                        {rosterManagementContent}
                    </div>
                </div>
                <div style={{ marginTop: theme.spacing.extraLarge }}>
                   <Card title="Mejores Asociaciones (Mapa de Calor)">
                        <p style={styles.cardDescription}>Análisis de la química y rendimiento entre todos los jugadores.</p>
                        <AssociationHeatmap 
                            players={associationData.allPlayers} 
                            pairs={associationData.allPairs} 
                        />
                   </Card>
                </div>
            </>
        ) : (
            <>
                {analysisContent}
                {rosterManagementContent}
                {tableContent}
                <PlayerComparator squadStats={squadStats} allPlayerNames={allPlayerNames} />
            </>
        )
      )}
    </main>
    </>
  );
};

export default SquadPage;
