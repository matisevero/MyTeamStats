import React, { useMemo, useState } from 'react';
import type { Match } from '../../types';
import Card from '../../components/common/Card';
import MomentumChart from './MomentumChart';
import YearTabs from '../../components/YearTabs';
import { useTheme } from '../../contexts/ThemeContext';

interface MomentumWidgetProps {
  matches: Match[];
}

const MomentumWidget: React.FC<MomentumWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();
  
  const years = useMemo(() => {
    const yearSet = new Set(matches.map(m => new Date(m.date).getFullYear()));
    return Array.from(yearSet).sort((a: number, b: number) => b - a);
  }, [matches]);
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');

  const title = `Temporada Momentum ${selectedYear !== 'all' ? `(${selectedYear})` : ''}`;

  return (
    <Card title={title}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.medium }}>
            {years.length > 0 && <YearTabs years={years} selectedYear={selectedYear} onSelectYear={setSelectedYear} />}
            <div style={{marginTop: '1rem'}}>
                <MomentumChart matches={matches} year={selectedYear} />
            </div>
        </div>
    </Card>
  );
};

export default MomentumWidget;