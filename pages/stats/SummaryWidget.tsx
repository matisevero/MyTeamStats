import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Match } from '../../types';
import Card from '../../components/common/Card';
import StatCard from '../../components/StatCard';
import YearTabs from '../../components/YearTabs';

interface SummaryWidgetProps {
  matches: Match[];
  selectedTeam: string;
}

const SummaryWidget: React.FC<SummaryWidgetProps> = ({ matches, selectedTeam }) => {
  const { theme } = useTheme();
  
  const [showPercentage, setShowPercentage] = useState<'wins' | 'draws' | 'losses' | null>(null);

  const years = useMemo(() => {
    const yearSet = new Set(matches.map(m => new Date(m.date).getFullYear()));
    return Array.from(yearSet).sort((a: number, b: number) => b - a);
  }, [matches]);

  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');

  const filteredMatches = useMemo(() => {
    if (selectedYear === 'all') {
      return matches;
    }
    const yearNum = parseInt(selectedYear);
    return matches.filter(m => new Date(m.date).getFullYear() === yearNum);
  }, [matches, selectedYear]);

  const stats = useMemo(() => {
    const totalMatches = filteredMatches.length;
    if (totalMatches === 0) {
      return {
        wins: 0, draws: 0, losses: 0, points: 0,
        winPercentage: 0, drawPercentage: 0, lossPercentage: 0,
        goalsFor: 0, goalsAgainst: 0, totalMatches: 0,
        efectividad: 0,
      };
    }
    const wins = filteredMatches.filter(m => m.result === 'VICTORIA').length;
    const draws = filteredMatches.filter(m => m.result === 'EMPATE').length;
    const losses = filteredMatches.filter(m => m.result === 'DERROTA').length;
    const points = wins * 3 + draws;

    const goalsFor = filteredMatches.reduce((sum, match) => sum + match.teamScore, 0);
    const goalsAgainst = filteredMatches.reduce((sum, match) => sum + match.opponentScore, 0);
    const efectividad = totalMatches > 0 ? (points / (totalMatches * 3)) * 100 : 0;
    
    return { 
        wins, draws, losses, points,
        winPercentage: totalMatches > 0 ? (wins / totalMatches) * 100 : 0,
        drawPercentage: totalMatches > 0 ? (draws / totalMatches) * 100 : 0,
        lossPercentage: totalMatches > 0 ? (losses / totalMatches) * 100 : 0,
        goalsFor,
        goalsAgainst,
        totalMatches,
        efectividad,
    };
  }, [filteredMatches]);
  
  const handleStatClick = (stat: 'wins' | 'draws' | 'losses') => {
    setShowPercentage(current => (current === stat ? null : stat));
  };
  
  const iconStyle: React.CSSProperties = { fontSize: '1.25rem' };

  const title = `Resumen de ${selectedTeam !== 'all' ? selectedTeam : 'Todos los Equipos'}`

  return (
    <Card title={title}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.medium }}>
            {years.length > 1 && <YearTabs years={years} selectedYear={selectedYear} onSelectYear={setSelectedYear} />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: theme.spacing.medium, marginTop: theme.spacing.medium }}>
                <StatCard label="Puntos" value={stats.points} icon={<span style={iconStyle}>🏆</span>} />
                <StatCard label="Partidos Jugados" value={stats.totalMatches} icon={<span style={iconStyle}>🗓️</span>} />
                
                <div onClick={() => handleStatClick('wins')} style={{cursor: 'pointer'}}>
                    <StatCard 
                        label="Victorias" 
                        value={showPercentage === 'wins' ? `${stats.winPercentage.toFixed(1)}%` : stats.wins}
                        valueStyle={{ color: theme.colors.win }}
                        icon={<span style={iconStyle}>✅</span>} 
                    />
                </div>
                <div onClick={() => handleStatClick('draws')} style={{cursor: 'pointer'}}>
                    <StatCard 
                        label="Empates" 
                        value={showPercentage === 'draws' ? `${stats.drawPercentage.toFixed(1)}%` : stats.draws}
                        valueStyle={{ color: theme.colors.draw }}
                        icon={<span style={iconStyle}>🤝</span>} 
                    />
                </div>
                <div onClick={() => handleStatClick('losses')} style={{cursor: 'pointer'}}>
                    <StatCard 
                        label="Derrotas" 
                        value={showPercentage === 'losses' ? `${stats.lossPercentage.toFixed(1)}%` : stats.losses}
                        valueStyle={{ color: theme.colors.loss }}
                        icon={<span style={iconStyle}>❌</span>} 
                    />
                </div>
                <StatCard label="Goles a Favor" value={stats.goalsFor} icon={<span style={iconStyle}>⚽️</span>} />
                <StatCard label="Goles en Contra" value={stats.goalsAgainst} icon={<span style={iconStyle}>🥅</span>} />
                <StatCard label="Efectividad" value={`${stats.efectividad.toFixed(1)}%`} icon={<span style={iconStyle}>🎯</span>} />
            </div>
      </div>
    </Card>
  );
};

export default SummaryWidget;