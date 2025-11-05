import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Match } from '../../types';
import Card from '../../components/common/Card';
import YearFilter from '../../components/YearFilter';
import ContributionByResultChart from '../../components/ContributionByResultChart';

interface ContributionMetricsWidgetProps {
  matches: Match[];
}

const ContributionMetricsWidget: React.FC<ContributionMetricsWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string | 'all'>(currentYear);

  const years = useMemo(() => {
    const yearSet = new Set(matches.map(m => new Date(m.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (selectedYear === 'all') {
      return matches;
    }
    return matches.filter(m => new Date(m.date).getFullYear().toString() === selectedYear);
  }, [matches, selectedYear]);

  const goalsByResultData = useMemo(() => {
    const data = {
        VICTORIA: { goalsFor: 0, goalsAgainst: 0, count: 0 },
        EMPATE: { goalsFor: 0, goalsAgainst: 0, count: 0 },
        DERROTA: { goalsFor: 0, goalsAgainst: 0, count: 0 },
    };
    filteredMatches.forEach(m => {
        data[m.result].goalsFor += m.teamScore;
        data[m.result].goalsAgainst += m.opponentScore;
        data[m.result].count++;
    });
    return [
        { result: 'Victorias', goalsFor: data.VICTORIA.count > 0 ? data.VICTORIA.goalsFor / data.VICTORIA.count : 0, goalsAgainst: data.VICTORIA.count > 0 ? data.VICTORIA.goalsAgainst / data.VICTORIA.count : 0 },
        { result: 'Empates', goalsFor: data.EMPATE.count > 0 ? data.EMPATE.goalsFor / data.EMPATE.count : 0, goalsAgainst: data.EMPATE.count > 0 ? data.EMPATE.goalsAgainst / data.EMPATE.count : 0 },
        { result: 'Derrotas', goalsFor: data.DERROTA.count > 0 ? data.DERROTA.goalsFor / data.DERROTA.count : 0, goalsAgainst: data.DERROTA.count > 0 ? data.DERROTA.goalsAgainst / data.DERROTA.count : 0 },
    ].filter(d => (d.goalsFor + d.goalsAgainst) > 0);
  }, [filteredMatches]);

  return (
    <Card title={`Análisis de Goles por Resultado ${selectedYear !== 'all' ? `(${selectedYear})` : ''}`}>
        <YearFilter years={years} selectedYear={selectedYear} onSelectYear={setSelectedYear} />
        {goalsByResultData.length > 0 ? (
            <ContributionByResultChart data={goalsByResultData} />
        ) : (
            <p style={{ color: theme.colors.secondaryText, textAlign: 'center', marginTop: theme.spacing.large }}>
                No hay suficientes datos para el período seleccionado.
            </p>
        )}
    </Card>
  );
};

export default ContributionMetricsWidget;
