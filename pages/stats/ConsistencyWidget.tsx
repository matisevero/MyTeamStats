import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import type { Match } from '../../types';
import { calculateStandardDeviation } from '../../utils/analytics';
import { generateConsistencyAnalysis } from '../../services/geminiService';
import { Loader } from '../../components/Loader';
import { SparklesIcon } from '../../components/icons/SparklesIcon';
import { InfoIcon } from '../../components/icons/InfoIcon';
import { ActivityIcon } from '../../components/icons/ActivityIcon';
import Card from '../../components/common/Card';
import YearTabs from '../../components/YearTabs';

interface ConsistencyWidgetProps {
  matches: Match[];
}

const ConsistencyWidget: React.FC<ConsistencyWidgetProps> = ({ matches }) => {
  const { theme } = useTheme();
  const { addAIInteraction } = useData();

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInfoVisible, setInfoVisible] = useState(false);

  const years = useMemo(() => {
    const yearSet = new Set(matches.map(m => new Date(m.date).getFullYear()));
    return Array.from(yearSet).sort((a: number, b: number) => b - a);
  }, [matches]);
  const [selectedYear, setSelectedYear] = useState<string | 'all'>('all');

  const calculateConsistencyForMatches = (filteredMatches: Match[]): number => {
    if (filteredMatches.length < 2) return 5; // Default score
    const contributions = [...filteredMatches]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      // FIX: Added nullish coalescing to handle cases where myGoals or myAssists might be undefined, preventing arithmetic errors.
      .map(m => (Number(m.myGoals) || 0) + (Number(m.myAssists) || 0));
    const stdDev = calculateStandardDeviation(contributions);
    return Math.max(0, 10 - stdDev * 4);
  };
  
  const monthlyConsistencyData = useMemo(() => {
    if (selectedYear === 'all') return [];

    const yearMatches = matches.filter(m => new Date(m.date).getFullYear().toString() === selectedYear);
    const statsByMonth: { [key: number]: Match[] } = {};

    yearMatches.forEach(match => {
        const monthIndex = new Date(match.date).getMonth();
        if (!statsByMonth[monthIndex]) {
            statsByMonth[monthIndex] = [];
        }
        statsByMonth[monthIndex].push(match);
    });

    const monthOrderShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const result: { month: string, score: number }[] = [];

    for (let i = 0; i < 12; i++) {
        if (statsByMonth[i] && statsByMonth[i].length > 1) {
            result.push({
                month: monthOrderShort[i],
                score: calculateConsistencyForMatches(statsByMonth[i]),
            });
        }
    }

    return result;
  }, [matches, selectedYear]);

  const yearlyConsistencyData = useMemo(() => {
    const data: { year: number; score: number }[] = [];
    const yearSet = new Set<number>(matches.map(m => new Date(m.date).getFullYear()));
    const sortedYears = Array.from(yearSet).sort((a: number, b: number) => a - b);
    
    sortedYears.forEach((year: number) => {
      const yearMatches = matches.filter(m => new Date(m.date).getFullYear() === year);
      if (yearMatches.length > 1) {
        data.push({ year: year, score: calculateConsistencyForMatches(yearMatches) });
      }
    });
    return data;
  }, [matches]);

  const { score: consistencyScore, contributions: contributionsPerMatch } = useMemo(() => {
    const filteredMatches = selectedYear === 'all'
      ? matches
      : matches.filter(m => new Date(m.date).getFullYear().toString() === selectedYear);
      
    // FIX: Added nullish coalescing to handle cases where myGoals or myAssists might be undefined, preventing arithmetic errors.
    const contributions = filteredMatches.length > 0 ? [...filteredMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(m => (Number(m.myGoals) || 0) + (Number(m.myAssists) || 0)) : [];

    return { score: calculateConsistencyForMatches(filteredMatches), contributions };
  }, [matches, selectedYear]);

  const handleGenerateAnalysis = async () => {
    if (contributionsPerMatch.length < 5) {
      setError("Se necesitan al menos 5 partidos para un análisis de consistencia.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await generateConsistencyAnalysis(contributionsPerMatch);
      setAnalysis(result);
      addAIInteraction('consistency_analysis', { period: selectedYear, analysis: result });
    } catch (err: any) {
      setError(err.message || "No se pudo generar el análisis.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate path data for a smooth curve
  const svgPath = (points: [number, number][]) => {
    const line = (pointA: [number, number], pointB: [number, number]) => {
        const lengthX = pointB[0] - pointA[0];
        const lengthY = pointB[1] - pointA[1];
        return {
            length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
            angle: Math.atan2(lengthY, lengthX)
        };
    };
    const controlPoint = (current: [number, number], previous: [number, number], next: [number, number], reverse: boolean) => {
        const p = previous || current;
        const n = next || current;
        const smoothing = 0.2;
        const o = line(p, n);
        const angle = o.angle + (reverse ? Math.PI : 0);
        const length = o.length * smoothing;
        const x = current[0] + Math.cos(angle) * length;
        const y = current[1] + Math.sin(angle) * length;
        return [x, y];
    };
    return points.reduce((acc, point, i, a) => {
      if (i === 0) return `M ${point[0]},${point[1]}`;
      const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point, false);
      const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
      return `${acc} C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
    }, '');
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.large },
    widgetTitleContainer: {
        margin: '0 0 1rem 0',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        position: 'relative'
    },
    widgetTitle: {
        color: theme.colors.secondaryText,
        margin: 0
    },
    infoIcon: {
        cursor: 'pointer',
        color: theme.colors.secondaryText
    },
    infoTooltip: {
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-8px)',
        width: '250px',
        backgroundColor: theme.colors.background,
        color: theme.colors.primaryText,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.medium,
        boxShadow: theme.shadows.large,
        zIndex: 10,
        fontSize: theme.typography.fontSize.small,
        lineHeight: 1.6,
        textAlign: 'left',
        opacity: isInfoVisible ? 1 : 0,
        visibility: isInfoVisible ? 'visible' : 'hidden',
        transition: 'opacity 0.2s, visibility 0.2s',
    },
    progressBarContainer: {
        width: '100%',
        padding: `${theme.spacing.large} 0`,
    },
    progressBar: {
        position: 'relative',
        height: '10px',
        background: `linear-gradient(to right, ${theme.colors.loss}, ${theme.colors.draw}, ${theme.colors.win})`,
        borderRadius: theme.borderRadius.small,
    },
    marker: {
        position: 'absolute',
        top: '50%',
        left: `${consistencyScore * 10}%`,
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
    lineChartContainer: {
        width: '100%',
        marginTop: theme.spacing.medium,
    },
    chartTitle: {
        textAlign: 'center',
        margin: `0 0 ${theme.spacing.small} 0`,
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.secondaryText,
        fontWeight: 600,
    },
    analysisContainer: { textAlign: 'center', width: '100%', marginTop: theme.spacing.medium },
    aiButton: {
        background: 'none', border: `1px solid ${theme.colors.borderStrong}`, color: theme.colors.primaryText,
        padding: `${theme.spacing.small} ${theme.spacing.medium}`, borderRadius: theme.borderRadius.medium,
        cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex',
        alignItems: 'center', gap: theme.spacing.small, transition: 'background-color 0.2s',
    },
    analysisText: {
        fontStyle: 'italic', color: theme.colors.primaryText, lineHeight: 1.6,
        margin: `${theme.spacing.medium} 0 0 0`, padding: theme.spacing.medium,
        backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.border}`,
    },
    errorText: { color: theme.colors.loss, fontSize: theme.typography.fontSize.small },
  };
  
  const SvgWidth = 500;
  const SvgHeight = 150;
  const padding = { top: 40, right: 20, bottom: 20, left: 20 };
  const chartWidth = SvgWidth - padding.left - padding.right;
  const chartHeight = SvgHeight - padding.top - padding.bottom;

  const minYear = yearlyConsistencyData[0]?.year;
  const maxYear = yearlyConsistencyData[yearlyConsistencyData.length - 1]?.year;

  const chartPoints = yearlyConsistencyData.map(d => {
      const x = padding.left + ((d.year - minYear) / Math.max(1, maxYear - minYear)) * chartWidth;
      const y = SvgHeight - padding.bottom - (d.score / 10) * chartHeight;
      return [x, y] as [number, number];
  });
  const pathData = svgPath(chartPoints);

  const title = `Índice de consistencia`;

  return (
    <Card title={title}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.medium }}>
            {years.length > 1 && <YearTabs years={years} selectedYear={selectedYear} onSelectYear={setSelectedYear} />}
            <div style={styles.container}>
                <div style={styles.widgetTitleContainer}>
                    <ActivityIcon size={20} color={theme.colors.secondaryText} />
                    <h4 style={styles.widgetTitle}>Índice de consistencia</h4>
                    <div 
                        style={styles.infoIcon}
                        onMouseEnter={() => setInfoVisible(true)}
                        onMouseLeave={() => setInfoVisible(false)}
                    >
                        <InfoIcon />
                    </div>
                    <div style={styles.infoTooltip}>
                        El índice de consistencia mide la regularidad de tus contribuciones (Goles + Asistencias) por partido. Una puntuación alta indica un rendimiento estable, mientras que una baja sugiere un estilo de juego más de rachas. Se calcula a partir de la desviación estándar de tus contribuciones.
                    </div>
                </div>
                
                <div style={styles.progressBarContainer}>
                    <div style={styles.progressBar}>
                    <div style={styles.marker}>
                        <span style={styles.markerValue}>{consistencyScore.toFixed(1)}</span>
                        <div style={styles.markerArrow}></div>
                    </div>
                    </div>
                </div>
                
                {selectedYear !== 'all' && monthlyConsistencyData.length > 1 && (() => {
                    const monthlySvgWidth = 500;
                    const monthlySvgHeight = 150;
                    const monthlyPadding = { top: 40, right: 20, bottom: 20, left: 20 };
                    const monthlyChartWidth = monthlySvgWidth - monthlyPadding.left - monthlyPadding.right;
                    const monthlyChartHeight = monthlySvgHeight - monthlyPadding.top - monthlyPadding.bottom;
                    
                    const monthlyChartPoints = monthlyConsistencyData.map((d, i) => {
                    const x = monthlyPadding.left + (monthlyChartWidth / Math.max(1, monthlyConsistencyData.length - 1)) * i;
                    const y = monthlySvgHeight - monthlyPadding.bottom - (d.score / 10) * monthlyChartHeight;
                    return [x, y] as [number, number];
                    });
                    const monthlyPathData = svgPath(monthlyChartPoints);
                    
                    return (
                    <div style={styles.lineChartContainer}>
                        <h5 style={styles.chartTitle}>Evolución Mensual ({selectedYear})</h5>
                        <svg viewBox={`0 0 ${monthlySvgWidth} ${monthlySvgHeight}`} style={{ width: '100%', height: 'auto' }}>
                        <path d={monthlyPathData} fill="none" stroke={theme.colors.accent2} strokeWidth="3" />
                        {monthlyChartPoints.map(([x, y], i) => (
                            <g key={i}>
                            <circle cx={x} cy={y} r="5" fill={theme.colors.accent2} stroke={theme.colors.surface} strokeWidth="2" />
                            <text x={x} y={y - 18} fill={theme.colors.primaryText} fontSize="28" fontWeight="bold" textAnchor="middle">{monthlyConsistencyData[i].score.toFixed(1)}</text>
                            <text x={x} y={monthlySvgHeight - 5} fill={theme.colors.secondaryText} fontSize="12" textAnchor="middle">{monthlyConsistencyData[i].month}</text>
                            </g>
                        ))}
                        </svg>
                    </div>
                    );
                })()}

                {selectedYear === 'all' && yearlyConsistencyData.length > 1 && (
                    <div style={styles.lineChartContainer}>
                    <h5 style={styles.chartTitle}>Evolución anual</h5>
                    <svg viewBox={`0 0 ${SvgWidth} ${SvgHeight}`} style={{ width: '100%', height: 'auto' }}>
                        <path d={pathData} fill="none" stroke={theme.colors.accent1} strokeWidth="3" />
                        {chartPoints.map(([x, y], i) => (
                        <g key={i}>
                            <circle cx={x} cy={y} r="5" fill={theme.colors.accent1} stroke={theme.colors.surface} strokeWidth="2" />
                            <text x={x} y={y - 18} fill={theme.colors.primaryText} fontSize="28" fontWeight="bold" textAnchor="middle">{yearlyConsistencyData[i].score.toFixed(1)}</text>
                            <text x={x} y={SvgHeight - 5} fill={theme.colors.secondaryText} fontSize="12" textAnchor="middle">{yearlyConsistencyData[i].year}</text>
                        </g>
                        ))}
                    </svg>
                    </div>
                )}
                
                <div style={styles.analysisContainer}>
                    {analysis ? (
                    <p style={styles.analysisText}>{analysis}</p>
                    ) : (
                    <button
                        onClick={handleGenerateAnalysis}
                        disabled={isLoading || contributionsPerMatch.length < 5}
                        style={styles.aiButton}
                    >
                        {isLoading ? <Loader /> : <SparklesIcon />}
                        {contributionsPerMatch.length < 5 ? "Necesitas 5 partidos" : "Análisis IA"}
                    </button>
                    )}
                    {error && <p style={styles.errorText}>{error}</p>}
                </div>
            </div>
        </div>
    </Card>
  );
};

export default ConsistencyWidget;