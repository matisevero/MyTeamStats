import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { PlayerPairStats } from '../../types';

interface AssociationHeatmapProps {
  players: string[];
  pairs: PlayerPairStats[];
}

const AssociationHeatmap: React.FC<AssociationHeatmapProps> = ({ players, pairs }) => {
  const { theme } = useTheme();
  const [activeCell, setActiveCell] = useState<{
    player1: string;
    player2: string;
    score: number;
    matches: number;
    rect: DOMRect;
    rowIndex: number;
    colIndex: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveCell(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  const pairMap = useMemo(() => {
    const map = new Map<string, PlayerPairStats>();
    pairs.forEach(pair => {
      const key = [pair.player1, pair.player2].sort().join('-');
      map.set(key, pair);
    });
    return map;
  }, [pairs]);

  const scores = useMemo(() => pairs.map(p => p.impactScore), [pairs]);
  const minScore = Math.min(...scores, -1);
  const maxScore = Math.max(...scores, 1);

  const getColor = (score: number) => {
    const range = maxScore - minScore;
    if (range === 0) return theme.colors.draw;
    const normalized = (score - minScore) / range;
    
    const lossColor = hexToRgb(theme.colors.loss);
    const drawColor = hexToRgb(theme.colors.draw);
    const winColor = hexToRgb(theme.colors.win);

    let r, g, b;
    if (normalized < 0.5) {
        const t = normalized * 2;
        r = Math.round(lossColor.r + t * (drawColor.r - lossColor.r));
        g = Math.round(lossColor.g + t * (drawColor.g - lossColor.g));
        b = Math.round(lossColor.b + t * (drawColor.b - lossColor.b));
    } else {
        const t = (normalized - 0.5) * 2;
        r = Math.round(drawColor.r + t * (winColor.r - drawColor.r));
        g = Math.round(drawColor.g + t * (winColor.g - drawColor.g));
        b = Math.round(drawColor.b + t * (winColor.b - drawColor.b));
    }
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const handleClick = (player1: string, player2: string, rowIndex: number, colIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    const key = [player1, player2].sort().join('-');
    const pair = pairMap.get(key);
    if (pair) {
      if (activeCell && activeCell.player1 === player1 && activeCell.player2 === player2) {
        setActiveCell(null);
      } else {
        setActiveCell({
          player1,
          player2,
          score: pair.impactScore,
          matches: pair.matchesTogether,
          rect: event.currentTarget.getBoundingClientRect(),
          rowIndex,
          colIndex,
        });
      }
    } else {
        setActiveCell(null);
    }
  };

  const getTooltipPosition = (): React.CSSProperties => {
    if (!activeCell || !containerRef.current || !tooltipRef.current) return { opacity: 0, visibility: 'hidden' };

    const containerRect = containerRef.current.getBoundingClientRect();
    const { rect, rowIndex, colIndex } = activeCell;
    const numPlayers = players.length;
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top: number, left: number;
    let transform = '';

    // Default: Top
    top = rect.top - containerRect.top - 8;
    left = rect.left - containerRect.left + rect.width / 2;
    transform = 'translate(-50%, -100%)';
    
    if (rowIndex < 4) { // Bottom
        top = rect.bottom - containerRect.top + 8;
        transform = 'translateX(-50%)';
    } else if (colIndex < 2) { // Right
        left = rect.right - containerRect.left + 8;
        top = rect.top - containerRect.top + rect.height / 2;
        transform = 'translateY(-50%)';
    } else if (colIndex >= numPlayers - 2) { // Left
        left = rect.left - containerRect.left - 8;
        top = rect.top - containerRect.top + rect.height / 2;
        transform = 'translate(-100%, -50%)';
    }
    
    return { top: `${top}px`, left: `${left}px`, transform, opacity: 1, visibility: 'visible' };
  };


  const styles: { [key: string]: React.CSSProperties } = {
    container: { position: 'relative' },
    grid: {
      display: 'grid',
      gridTemplateColumns: `auto repeat(${players.length}, 1fr)`,
      gridTemplateRows: `auto repeat(${players.length}, 1fr)`,
      gap: '2px',
    },
    headerCell: {
      fontSize: '0.6rem',
      fontWeight: 'bold',
      color: theme.colors.secondaryText,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.25rem',
      whiteSpace: 'nowrap',
    },
    verticalHeader: {
      writingMode: 'vertical-rl',
      transform: 'rotate(180deg)',
      textAlign: 'right',
      paddingRight: '0.5rem',
    },
    cell: {
      width: '100%',
      paddingBottom: '100%', // Aspect ratio 1:1
      position: 'relative',
    },
    cellContent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.background,
      borderRadius: '2px',
      cursor: 'pointer',
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.small,
      color: theme.colors.primaryText,
      fontSize: '0.8rem',
      zIndex: 10,
      pointerEvents: 'none',
      boxShadow: theme.shadows.large,
      whiteSpace: 'nowrap',
      transition: 'opacity 0.2s, top 0.2s, left 0.2s, transform 0.2s',
      opacity: 0,
      visibility: 'hidden',
    },
    legendContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.small,
        marginTop: theme.spacing.medium,
    },
    legendLabel: {
        fontSize: '0.7rem',
        color: theme.colors.secondaryText,
    },
    legendBar: {
        width: '100px',
        height: '10px',
        borderRadius: '5px',
    }
  };
  
  const legendGradient = `linear-gradient(to right, ${getColor(minScore)}, ${getColor(minScore + (maxScore - minScore) / 2)}, ${getColor(maxScore)})`;

  return (
    <div ref={containerRef} style={styles.container}>
      <div style={styles.grid}>
        <div style={styles.headerCell}></div>
        {players.map(p => (
          <div key={p} style={styles.headerCell}>{p.substring(0, 3)}.</div>
        ))}
        {players.map((p1, rowIndex) => (
          <React.Fragment key={p1}>
            <div style={{ ...styles.headerCell, ...styles.verticalHeader }}>{p1}</div>
            {players.map((p2, colIndex) => {
              if (rowIndex >= colIndex) {
                return <div key={p2} style={styles.cell}><div style={{...styles.cellContent, background: theme.colors.border, cursor: 'default'}}></div></div>;
              }
              const key = [p1, p2].sort().join('-');
              const pair = pairMap.get(key);
              return (
                <div key={p2} style={styles.cell}>
                  <div
                    style={{
                      ...styles.cellContent,
                      backgroundColor: pair ? getColor(pair.impactScore) : theme.colors.background,
                    }}
                    onClick={(e) => handleClick(p1, p2, rowIndex, colIndex, e)}
                  ></div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      
      <div style={styles.legendContainer}>
        <span style={styles.legendLabel}>Negativo</span>
        <div style={{...styles.legendBar, background: legendGradient}}></div>
        <span style={styles.legendLabel}>Positivo</span>
      </div>

      <div ref={tooltipRef} style={{...styles.tooltip, ...getTooltipPosition() }}>
        {activeCell && (
            <>
                <strong>{activeCell.player1} & {activeCell.player2}</strong>
                <div>Índice: {activeCell.score.toFixed(2)}</div>
                <div>Partidos Juntos: {activeCell.matches}</div>
            </>
        )}
      </div>
    </div>
  );
};

export default AssociationHeatmap;