
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

  const CELL_SIZE = 22; // Ultra compact cell size
  const HEADER_HEIGHT = 110; // Height for vertical text names

  const styles: { [key: string]: React.CSSProperties } = {
    wrapper: {
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
    },
    scrollContainer: {
        overflow: 'auto',
        maxHeight: '600px',
        maxWidth: '100%',
        position: 'relative',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.medium,
    },
    grid: {
      display: 'grid',
      // 1st column auto, rest fixed small size
      gridTemplateColumns: `auto repeat(${players.length}, ${CELL_SIZE}px)`,
      // 1st row taller for vertical text, rest fixed small size
      gridTemplateRows: `${HEADER_HEIGHT}px repeat(${players.length}, ${CELL_SIZE}px)`,
      gap: '1px',
      backgroundColor: theme.colors.border, // Gap color
      width: 'max-content', // Shrink to fit
    },
    cornerCell: {
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 20,
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        borderRight: `1px solid ${theme.colors.border}`,
    },
    headerCell: {
      fontSize: '9px', // Approx 7pt
      fontWeight: 'bold',
      color: theme.colors.secondaryText,
      backgroundColor: theme.colors.surface,
      position: 'sticky',
      top: 0,
      zIndex: 10,
      borderBottom: `1px solid ${theme.colors.border}`,
      // Vertical Text Styling
      writingMode: 'vertical-rl',
      transform: 'rotate(180deg)', 
      whiteSpace: 'nowrap',
      padding: '4px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start', // Aligns text to bottom (because of rotation)
      height: `${HEADER_HEIGHT}px`,
      width: `${CELL_SIZE}px`,
    },
    verticalHeader: {
      position: 'sticky',
      left: 0,
      zIndex: 10,
      borderRight: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surface,
      height: `${CELL_SIZE}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      fontSize: '9px', // Approx 7pt
      fontWeight: 600,
      color: theme.colors.secondaryText,
      whiteSpace: 'nowrap',
      paddingRight: '6px',
      paddingLeft: '4px',
    },
    cell: {
      width: `${CELL_SIZE}px`,
      height: `${CELL_SIZE}px`,
      position: 'relative',
      backgroundColor: theme.colors.background,
    },
    cellContent: {
      width: '100%',
      height: '100%',
      cursor: 'pointer',
      transition: 'opacity 0.1s',
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.small,
      color: theme.colors.primaryText,
      fontSize: '0.8rem',
      zIndex: 30,
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
        height: '8px',
        borderRadius: '4px',
    }
  };
  
  const legendGradient = `linear-gradient(to right, ${getColor(minScore)}, ${getColor(minScore + (maxScore - minScore) / 2)}, ${getColor(maxScore)})`;

  return (
    <div ref={containerRef} style={styles.wrapper}>
      <div style={styles.scrollContainer} className="subtle-scrollbar">
          <div style={styles.grid}>
            <div style={styles.cornerCell}></div>
            {/* Top Headers (Vertical Text) */}
            {players.map(p => (
              <div key={`h-${p}`} style={styles.headerCell} title={p}>{p}</div>
            ))}
            
            {/* Rows */}
            {players.map((p1, rowIndex) => (
              <React.Fragment key={`r-${p1}`}>
                {/* Left Header (Horizontal Text) */}
                <div style={styles.verticalHeader} title={p1}>{p1}</div>
                
                {/* Data Cells */}
                {players.map((p2, colIndex) => {
                  // Diagonal and mirrored cells blank or specific style
                  if (rowIndex >= colIndex) {
                    return <div key={`${p1}-${p2}`} style={styles.cell}><div style={{width: '100%', height: '100%', background: theme.colors.border, cursor: 'default', opacity: 0.3}}></div></div>;
                  }
                  
                  const key = [p1, p2].sort().join('-');
                  const pair = pairMap.get(key);
                  
                  return (
                    <div key={`${p1}-${p2}`} style={styles.cell}>
                      <div
                        style={{
                          ...styles.cellContent,
                          backgroundColor: pair ? getColor(pair.impactScore) : theme.colors.background,
                        }}
                        onClick={(e) => handleClick(p1, p2, rowIndex, colIndex, e)}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      ></div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
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
