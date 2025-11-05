import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Match } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateStandardDeviation } from '../../utils/analytics';

interface MomentumChartProps {
  matches: Match[];
  year: string;
}

const MomentumChart: React.FC<MomentumChartProps> = ({ matches, year }) => {
  const { theme } = useTheme();
  const [activeMatch, setActiveMatch] = useState<{ match: Match; index: number; element: HTMLElement } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const yearToDisplayMatches = useMemo(() => {
    let yearToFilter: number;

    if (year === 'all') {
      const latestYear = Math.max(...matches.map(m => new Date(m.date).getFullYear()));
      yearToFilter = isFinite(latestYear) ? latestYear : new Date().getFullYear();
    } else {
      yearToFilter = parseInt(year);
    }

    return matches
      .filter(m => new Date(m.date).getFullYear() === yearToFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches, year]);

  const consistencyData = useMemo(() => {
    const WINDOW_SIZE = 10;
    
    // Chronologically sorted matches are needed for the moving average calculation.
    const allSortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return yearToDisplayMatches.map((match) => {
        // Find the index of the current match in the full sorted list to define the window
        const currentMatchIndex = allSortedMatches.findIndex(m => m.id === match.id);
        if (currentMatchIndex === -1) return 5; // Default score if something is wrong
        
        const startIndex = Math.max(0, currentMatchIndex - WINDOW_SIZE + 1);
        const windowMatches = allSortedMatches.slice(startIndex, currentMatchIndex + 1);

        const contributions = windowMatches.map(m => m.myGoals + m.myAssists);
        
        if (contributions.length < 2) {
            return 5; // Default score if not enough data for deviation
        }

        const stdDev = calculateStandardDeviation(contributions);
        const score = Math.max(0, 10 - stdDev * 4);
        return score;
    });
  }, [matches, yearToDisplayMatches]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setActiveMatch(null);
      }
    };

    if (activeMatch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMatch]);

  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 140 });

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        setChartDimensions({ width: chartRef.current.offsetWidth, height: 140 });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [yearToDisplayMatches]);
  
  const linePoints = useMemo(() => {
    if (chartDimensions.width === 0 || consistencyData.length === 0) return "";
    return consistencyData.map((score, index) => {
      const x = (index + 0.5) * (chartDimensions.width / yearToDisplayMatches.length);
      const y = (1 - score / 10) * chartDimensions.height;
      return `${x},${y}`;
    }).join(' ');
  }, [consistencyData, chartDimensions, yearToDisplayMatches.length]);

  const areaPoints = useMemo(() => {
    if (!linePoints) return "";
    const firstX = 0;
    const lastX = chartDimensions.width;
    const bottomY = chartDimensions.height;
    return `${firstX},${bottomY} ${linePoints} ${lastX},${bottomY}`;
  }, [linePoints, chartDimensions]);
  
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'relative',
      width: '100%',
      padding: '1rem 0',
    },
    chart: {
      display: 'flex',
      gap: '2px',
      height: '140px',
      position: 'relative',
      width: '100%',
    },
    centerLine: {
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: '1px',
      backgroundColor: theme.colors.borderStrong,
      transform: 'translateY(-0.5px)',
    },
    barColumn: {
      flex: 1,
      minWidth: '2px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
    },
    topHalf: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column-reverse',
    },
    bottomHalf: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    bar: {
      width: '100%',
      borderRadius: '2px',
      transition: 'transform 0.2s, opacity 0.2s',
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: theme.colors.background,
      color: theme.colors.primaryText,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      boxShadow: theme.shadows.large,
      zIndex: 100,
      pointerEvents: 'none',
      fontSize: theme.typography.fontSize.medium,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.small,
      opacity: 0,
      transform: 'translateY(10px)',
      transition: 'opacity 0.2s, transform 0.2s',
      whiteSpace: 'nowrap',
    },
    tooltipVisible: {
        opacity: 1,
        transform: 'translateY(0)',
    },
    tooltipDate: {
        fontWeight: 600,
        color: theme.colors.primaryText,
    },
    tooltipStats: {
        color: theme.colors.secondaryText,
    },
    svgOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    },
    legend: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '1rem',
      flexWrap: 'wrap',
      fontSize: '0.8rem',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: theme.colors.secondaryText,
    },
    legendColorBox: {
      width: '12px',
      height: '12px',
      borderRadius: '3px',
    },
    legendLine: {
      width: '12px',
      height: '2px',
      backgroundColor: theme.colors.accent2,
    },
  };

  if (yearToDisplayMatches.length === 0) {
    return <p style={{ textAlign: 'center', color: theme.colors.secondaryText }}>No hay partidos registrados en el período seleccionado.</p>;
  }
  
  const getBar = (match: Match) => {
    const { result } = match;
    let style: React.CSSProperties = { ...styles.bar };
    
    switch(result) {
        case 'VICTORIA':
            style.backgroundColor = theme.colors.win;
            style.height = '80%';
            return <div style={style}></div>;
        case 'DERROTA':
            style.backgroundColor = theme.colors.loss;
            style.height = '80%';
            return <div style={style}></div>;
        case 'EMPATE':
            style.backgroundColor = theme.colors.draw;
            style.height = '30%';
            return <div style={style}></div>;
        default:
            return null;
    }
  }

  const handleClick = (match: Match, index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMatch && activeMatch.match.id === match.id) {
        setActiveMatch(null);
    } else {
        setActiveMatch({ match, index, element: e.currentTarget });
    }
  };
  
  const getTooltipPosition = () => {
    if (!activeMatch || !chartRef.current) return {};
    const chartRect = chartRef.current.getBoundingClientRect();
    const barRect = activeMatch.element.getBoundingClientRect();
    const tooltipHeight = tooltipRef.current?.offsetHeight || 80;
    
    const barIsTopHalf = barRect.top < chartRect.top + chartRect.height / 2;
    
    const top = barIsTopHalf 
      ? barRect.bottom - chartRect.top + 10 
      : barRect.top - chartRect.top - tooltipHeight - 10;
      
    let left = barRect.left - chartRect.left + (barRect.width / 2);

    if (tooltipRef.current) {
        const tooltipWidth = tooltipRef.current.offsetWidth;
        if (left - tooltipWidth / 2 < 5) {
            left = tooltipWidth / 2 + 5;
        }
        if (left + tooltipWidth / 2 > chartRect.width - 5) {
            left = chartRect.width - tooltipWidth / 2 - 5;
        }
    }

    return {
        top: `${top}px`,
        left: `${left}px`,
        transform: `translateX(-50%)`,
    };
  }

  return (
    <div style={styles.container}>
      <div style={styles.chart} ref={chartRef}>
        <div style={styles.centerLine} />
        {yearToDisplayMatches.map((match, index) => (
          <div 
              key={match.id} 
              style={styles.barColumn}
              onClick={(e) => handleClick(match, index, e)}
          >
            <div style={styles.topHalf}>
              {match.result !== 'DERROTA' && getBar(match)}
            </div>
            <div style={styles.bottomHalf}>
              {match.result === 'DERROTA' && getBar(match)}
            </div>
          </div>
        ))}
         <svg style={styles.svgOverlay}>
          <defs>
            <linearGradient id="consistencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.colors.accent2} stopOpacity={0.4}/>
              <stop offset="100%" stopColor={theme.colors.accent2} stopOpacity={0}/>
            </linearGradient>
          </defs>
          {areaPoints && <polyline points={areaPoints} fill="url(#consistencyGradient)" stroke="none" />}
          {linePoints && <polyline points={linePoints} fill="none" stroke={theme.colors.accent2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      </div>
      <div
        ref={tooltipRef}
        style={{ ...styles.tooltip, ...(activeMatch ? { ...styles.tooltipVisible, ...getTooltipPosition() } : {}) }}
      >
        {activeMatch && (
            <>
                <div style={styles.tooltipDate}>
                    {new Date(activeMatch.match.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                </div>
                <div style={styles.tooltipStats}>
                    {activeMatch.match.result} (⚽️{activeMatch.match.myGoals}, 👟{activeMatch.match.myAssists})
                </div>
                 <div style={{ ...styles.tooltipStats, color: theme.colors.accent2, fontWeight: 'bold' }}>
                    Índice Consistencia: {consistencyData[activeMatch.index].toFixed(1)}
                </div>
            </>
        )}
      </div>
       <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{...styles.legendColorBox, backgroundColor: theme.colors.win}} /> Victoria
        </div>
        <div style={styles.legendItem}>
          <span style={{...styles.legendColorBox, backgroundColor: theme.colors.draw}} /> Empate
        </div>
        <div style={styles.legendItem}>
          <span style={{...styles.legendColorBox, backgroundColor: theme.colors.loss}} /> Derrota
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendLine} /> Índice consistencia
        </div>
      </div>
    </div>
  );
};

export default MomentumChart;