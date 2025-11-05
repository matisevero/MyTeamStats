import React, { useRef, useState, useEffect } from 'react';
import type { Match } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface RecentFormProps {
  matches: Match[];
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
};

const RecentForm: React.FC<RecentFormProps> = ({ matches }) => {
  const { theme } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  useEffect(() => {
    const checkScrollable = () => {
      const el = scrollContainerRef.current;
      if (el) {
        // Adding a small buffer to be safe
        setIsScrollable(el.scrollWidth > el.clientWidth + 1);
      }
    };

    // Timeout to ensure content has rendered and dimensions are correct
    const timeoutId = setTimeout(checkScrollable, 100);
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [recentMatches]);

  const getResultStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1rem',
      fontWeight: 'bold',
      flexShrink: 0,
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
    };
    switch (result) {
      case 'VICTORIA':
        return { ...baseStyle, color: theme.colors.win };
      case 'DERROTA':
        return { ...baseStyle, color: theme.colors.loss };
      case 'EMPATE':
        return { ...baseStyle, color: theme.colors.draw };
    }
  };
  
  const styles: { [key: string]: React.CSSProperties } = {
    container: { 
      width: '100%',
      position: 'relative'
    },
    formBar: {
      display: 'flex', 
      gap: '0.5rem', 
      justifyContent: 'flex-start',
      backgroundColor: theme.colors.surface, 
      padding: '1rem', 
      borderRadius: '12px',
      border: `1px solid ${theme.colors.border}`, 
      overflowX: 'auto',
      scrollbarWidth: 'none', // For Firefox
      msOverflowStyle: 'none',  // For Internet Explorer and Edge
    },
    noMatchesText: {
      color: theme.colors.secondaryText, 
      fontStyle: 'italic', 
      padding: '1rem',
      backgroundColor: theme.colors.surface, 
      borderRadius: '12px',
      border: `1px solid ${theme.colors.border}`, 
      textAlign: 'center',
    },
    fadeOverlay: {
      position: 'absolute',
      top: '1px',
      right: '1px',
      width: '50px',
      height: 'calc(100% - 2px)',
      background: `linear-gradient(to left, ${theme.colors.surface}, transparent)`,
      pointerEvents: 'none',
      borderRadius: '12px',
    }
  };

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div style={styles.container}>
        {recentMatches.length === 0 ? (
          <p style={styles.noMatchesText}>No hay partidos recientes para mostrar.</p>
        ) : (
          <>
            <div style={styles.formBar} className="no-scrollbar" ref={scrollContainerRef}>
              {recentMatches.map(match => {
                const style = getResultStyle(match.result);
                return (
                  <div 
                    key={match.id} 
                    style={style}
                    title={`Fecha: ${new Date(match.date).toLocaleDateString()}`}
                  >
                    {resultAbbreviations[match.result]}
                  </div>
                );
              })}
            </div>
            {isScrollable && <div style={styles.fadeOverlay} />}
          </>
        )}
      </div>
    </>
  );
};

export default RecentForm;