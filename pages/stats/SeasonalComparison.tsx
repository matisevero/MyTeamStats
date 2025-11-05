import React, { useState, useEffect } from 'react';
import type { Match } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useMemo } from 'react';

interface YearlyStats {
  year: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  totalMatches: number;
}

const SeasonalComparisonChart: React.FC<{
    data: YearlyStats[];
    yKey1: 'wins';
    yKey2: 'draws';
    yKey3?: 'losses';
    label1: string;
    label2: string;
    label3?: string;
    color1: string;
    color2: string;
    color3?: string;
}> = ({ data, yKey1, yKey2, yKey3, label1, label2, label3, color1, color2, color3 }) => {
    const { theme } = useTheme();
    const [activeValue, setActiveValue] = useState<{ key: string, value: number, x: number, y: number } | null>(null);

    useEffect(() => {
        if (activeValue) {
            const timer = setTimeout(() => setActiveValue(null), 1500);
            return () => clearTimeout(timer);
        }
    }, [activeValue]);

    const SvgWidth = 500;
    const SvgHeight = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = SvgWidth - padding.left - padding.right;
    const chartHeight = SvgHeight - padding.top - padding.bottom;

    const totalValues = data.map(d => d[yKey1] + d[yKey2] + (yKey3 ? d[yKey3] : 0));
    const maxY = Math.max(...totalValues, 5);

    const barGroupWidth = chartWidth / data.length;
    const barWidth = barGroupWidth * 0.5;

    const styles: { [key: string]: React.CSSProperties } = {
        chartContainer: { position: 'relative', width: '100%' },
        legend: {
            display: 'flex', justifyContent: 'center', gap: '1.5rem',
            marginTop: '1rem', fontSize: '0.875rem', color: theme.colors.primaryText,
        },
        legendItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
        legendColorBox: { width: '14px', height: '14px', borderRadius: '4px' },
    };

    return (
        <>
            <style>{`
                @keyframes pop-up {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div style={styles.chartContainer}>
                <svg viewBox={`0 0 ${SvgWidth} ${SvgHeight}`} style={{ width: '100%', height: 'auto' }}>
                    {[...Array(6)].map((_, i) => {
                        const y = padding.top + (chartHeight / 5) * i;
                        const value = Math.round(maxY - (maxY / 5) * i);
                        return (
                            <g key={i}>
                                <line x1={padding.left} y1={y} x2={SvgWidth - padding.right} y2={y} stroke={theme.colors.border} />
                                <text x={padding.left - 8} y={y + 4} fill={theme.colors.secondaryText} fontSize="10" textAnchor="end">{value}</text>
                            </g>
                        );
                    })}

                    {data.map((d, i) => {
                        const x = padding.left + barGroupWidth * i + (barGroupWidth - barWidth) / 2;

                        const height1 = (d[yKey1] / maxY) * chartHeight;
                        const height2 = (d[yKey2] / maxY) * chartHeight;
                        const height3 = yKey3 ? (d[yKey3] / maxY) * chartHeight : 0;
                        
                        const y1 = SvgHeight - padding.bottom - height1;
                        const y2 = y1 - height2;
                        const y3 = y2 - height3;
                        
                        const handleBarClick = (key: string, value: number, barX: number, barY: number, barHeight: number) => {
                            if (value > 0) {
                                setActiveValue({ key, value, x: barX + barWidth / 2, y: barY + barHeight / 2 });
                            }
                        };

                        return (
                            <g key={d.year}>
                                <rect x={x} y={y1} width={barWidth} height={height1} fill={color1} cursor={d[yKey1] > 0 ? "pointer" : "default"} onClick={() => handleBarClick(`${d.year}-${yKey1}`, d[yKey1], x, y1, height1)} />
                                <rect x={x} y={y2} width={barWidth} height={height2} fill={color2} cursor={d[yKey2] > 0 ? "pointer" : "default"} onClick={() => handleBarClick(`${d.year}-${yKey2}`, d[yKey2], x, y2, height2)} />
                                {yKey3 && <rect x={x} y={y3} width={barWidth} height={height3} fill={color3 || '#000'} cursor={d[yKey3] > 0 ? "pointer" : "default"} onClick={() => handleBarClick(`${d.year}-${yKey3}`, d[yKey3] as number, x, y3, height3)} />}

                                <text x={x + barWidth / 2} y={SvgHeight - padding.bottom + 15} fill={theme.colors.secondaryText} fontSize="12" textAnchor="middle">
                                    {d.year}
                                </text>
                            </g>
                        );
                    })}

                    {activeValue && (
                        <text
                            x={activeValue.x}
                            y={activeValue.y}
                            fill={theme.colors.primaryText}
                            fontSize="28"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ animation: 'pop-up 0.3s ease-out forwards', pointerEvents: 'none', stroke: theme.colors.surface, strokeWidth: 2, paintOrder: 'stroke' }}
                        >
                            {activeValue.value}
                        </text>
                    )}
                </svg>
                <div style={styles.legend}>
                    <div style={styles.legendItem}>
                        <span style={{ ...styles.legendColorBox, backgroundColor: color1 }} />
                        <span>{label1}</span>
                    </div>
                    <div style={styles.legendItem}>
                        <span style={{ ...styles.legendColorBox, backgroundColor: color2 }} />
                        <span>{label2}</span>
                    </div>
                    {label3 && color3 && (
                        <div style={styles.legendItem}>
                            <span style={{ ...styles.legendColorBox, backgroundColor: color3 }} />
                            <span>{label3}</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const GoalsComparisonChart: React.FC<{ data: YearlyStats[] }> = ({ data }) => {
    const { theme } = useTheme();
    const [activeValue, setActiveValue] = useState<{ value: number, x: number, y: number } | null>(null);
  
    useEffect(() => {
      if (activeValue) {
        const timer = setTimeout(() => setActiveValue(null), 1500);
        return () => clearTimeout(timer);
      }
    }, [activeValue]);
  
    const styles: { [key: string]: React.CSSProperties } = {
        chartContainer: { position: 'relative', width: '100%' },
        legend: { display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', fontSize: '0.875rem', color: theme.colors.primaryText },
        legendItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
        legendColorBox: { width: '14px', height: '14px', borderRadius: '4px' },
    };
  
    const SvgWidth = 500;
    const SvgHeight = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = SvgWidth - padding.left - padding.right;
    const chartHeight = SvgHeight - padding.top - padding.bottom;
  
    const allValues = data.flatMap(d => [d.goalsFor, d.goalsAgainst]);
    const maxY = Math.max(...allValues, 1);
    
    const barGroupWidth = chartWidth / data.length;
    const barWidth = barGroupWidth * 0.35;
  
    return (
      <>
        <style>{`
            @keyframes pop-up-value {
                from { opacity: 0; transform: translateY(5px) scale(0.9); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
        `}</style>
        <div style={styles.chartContainer}>
          <svg viewBox={`0 0 ${SvgWidth} ${SvgHeight}`} style={{ width: '100%', height: 'auto' }}>
            {[...Array(6)].map((_, i) => {
              const y = padding.top + (chartHeight / 5) * i;
              const value = Math.round(maxY - (maxY / 5) * i);
              return (
                <g key={i}>
                  <line x1={padding.left} y1={y} x2={SvgWidth - padding.right} y2={y} stroke={theme.colors.border} />
                  <text x={padding.left - 8} y={y + 4} fill={theme.colors.secondaryText} fontSize="10" textAnchor="end">{value}</text>
                </g>
              );
            })}
  
            {data.map((d, i) => {
              const groupX = padding.left + barGroupWidth * i;
              const x1 = groupX + (barGroupWidth * 0.15);
              const x2 = x1 + barWidth;
  
              const goalsForHeight = (d.goalsFor / maxY) * chartHeight;
              const goalsAgainstHeight = (d.goalsAgainst / maxY) * chartHeight;
              
              const y1 = SvgHeight - padding.bottom - goalsForHeight;
              const y2 = SvgHeight - padding.bottom - goalsAgainstHeight;
  
              const handleBarClick = (value: number, barX: number, barY: number) => {
                  if (value > 0) {
                      setActiveValue({ value: Math.round(value), x: barX + barWidth / 2, y: barY - 15 });
                  }
              };
  
              return (
                <g key={d.year}>
                  <rect x={x1} y={y1} width={barWidth} height={goalsForHeight} fill={theme.colors.win} cursor={d.goalsFor > 0 ? "pointer" : "default"} onClick={() => handleBarClick(d.goalsFor, x1, y1)} />
                  <rect x={x2} y={y2} width={barWidth} height={goalsAgainstHeight} fill={theme.colors.loss} cursor={d.goalsAgainst > 0 ? "pointer" : "default"} onClick={() => handleBarClick(d.goalsAgainst, x2, y2)} />
                  <text x={groupX + barGroupWidth / 2} y={SvgHeight - padding.bottom + 15} fill={theme.colors.secondaryText} fontSize="12" textAnchor="middle">
                    {d.year}
                  </text>
                </g>
              );
            })}
  
            {activeValue && (
              <text
                x={activeValue.x} y={activeValue.y} fill={theme.colors.primaryText}
                fontSize="28" fontWeight="bold" textAnchor="middle" dominantBaseline="middle"
                style={{ animation: 'pop-up-value 0.3s ease-out forwards', pointerEvents: 'none', stroke: theme.colors.surface, strokeWidth: 2, paintOrder: 'stroke' }}
              >
                {activeValue.value}
              </text>
            )}
          </svg>
          <div style={styles.legend}>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendColorBox, backgroundColor: theme.colors.win }} />
              <span>Goles a Favor</span>
            </div>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendColorBox, backgroundColor: theme.colors.loss }} />
              <span>Goles en Contra</span>
            </div>
          </div>
        </div>
      </>
    );
  };

interface SeasonalComparisonProps {
  matches: Match[];
}

const SeasonalComparison: React.FC<SeasonalComparisonProps> = ({ matches }) => {
  const { theme } = useTheme();

  const yearlyData = useMemo(() => {
    const stats: Record<string, Omit<YearlyStats, 'year'>> = {};

    matches.forEach(match => {
      const year = new Date(match.date).getFullYear().toString();
      if (!stats[year]) {
        stats[year] = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, totalMatches: 0 };
      }
      
      stats[year].totalMatches++;
      stats[year].goalsFor += match.teamScore;
      stats[year].goalsAgainst += match.opponentScore;
      if (match.result === 'VICTORIA') stats[year].wins++;
      else if (match.result === 'EMPATE') stats[year].draws++;
      else stats[year].losses++;
    });
    
    return Object.entries(stats).map(([year, yearStats]) => ({ year, ...yearStats })).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [matches]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', gap: theme.spacing.extraLarge },
    chartSection: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    chartTitle: {
      fontSize: theme.typography.fontSize.medium,
      fontWeight: 600,
      color: theme.colors.primaryText,
      margin: 0,
      textAlign: 'center',
    },
    noDataText: {
        color: theme.colors.secondaryText,
        textAlign: 'center',
        padding: `${theme.spacing.extraLarge} 0`,
    },
  };
  
  if (yearlyData.length < 1) {
    return <p style={styles.noDataText}>No hay suficientes datos para una comparación por temporada.</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.chartSection}>
        <h4 style={styles.chartTitle}>Comparación de resultados</h4>
        <SeasonalComparisonChart
            data={yearlyData}
            yKey1="wins"
            yKey2="draws"
            yKey3="losses"
            label1="Victorias"
            label2="Empates"
            label3="Derrotas"
            color1={theme.colors.win}
            color2={theme.colors.draw}
            color3={theme.colors.loss}
        />
      </div>
      <div style={styles.chartSection}>
        <h4 style={styles.chartTitle}>Comparación de Goles</h4>
         <GoalsComparisonChart data={yearlyData} />
      </div>
    </div>
  );
};

export default SeasonalComparison;
