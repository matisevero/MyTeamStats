import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import type { Match } from '../../types';
import Card from '../common/Card';

interface PostMatchModalProps {
  match: Match;
  matches: Match[];
  onClose: () => void;
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
    VICTORIA: 'V',
    DERROTA: 'D',
    EMPATE: 'E',
};

const PostMatchModal: React.FC<PostMatchModalProps> = ({ match, matches, onClose }) => {
  const { theme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        document.body.style.overflow = 'auto';
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const streaks = useMemo(() => {
    const sortedMatches = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortedMatches.length === 0) {
      return { resultStreak: { type: 'NONE' as const, count: 0 }, goalStreak: 0, assistStreak: 0 };
    }

    let resultStreak: { type: 'VICTORIA' | 'DERROTA' | 'EMPATE' | 'NONE', count: number } = { type: 'NONE', count: 0 };
    if (sortedMatches.length > 0) {
        const lastResult = sortedMatches[0].result;
        let streakCount = 0;
        for (const m of sortedMatches) {
            if (m.result === lastResult) streakCount++;
            else break;
        }
        if (streakCount >= 2) resultStreak = { type: lastResult, count: streakCount };
    }

    let goalStreak = 0;
    for (const m of sortedMatches) {
        if (m.myGoals > 0) goalStreak++;
        else break;
    }
    
    let assistStreak = 0;
    for (const m of sortedMatches) {
        if (m.myAssists > 0) assistStreak++;
        else break;
    }

    return { resultStreak, goalStreak, assistStreak };
  }, [matches]);

  const hasActiveStreaks = useMemo(() => {
    return streaks.resultStreak.count >= 2 || streaks.goalStreak >= 2 || streaks.assistStreak >= 2;
  }, [streaks]);

  const recentForm = useMemo(() => {
      return matches
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
  }, [matches]);

  const getResultColor = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): string => {
    switch (result) {
      case 'VICTORIA': return theme.colors.win;
      case 'DERROTA': return theme.colors.loss;
      case 'EMPATE': return theme.colors.draw;
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.medium,
      animation: 'fadeIn 0.3s ease-out',
    },
    modalContent: {
      width: '100%', maxWidth: '500px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      animation: 'scaleUp 0.3s ease-out',
    },
    cardWrapper: {
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
    },
    cardContent: {
        overflowY: 'auto',
        padding: theme.spacing.large,
    },
    header: { textAlign: 'center', marginBottom: theme.spacing.medium },
    title: {
        fontSize: '1.75rem', fontWeight: 700, color: theme.colors.primaryText,
        margin: `0 0 ${theme.spacing.extraSmall} 0`,
        background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    subtitle: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, margin: 0 },
    section: { marginBottom: theme.spacing.large },
    sectionTitle: {
      fontSize: theme.typography.fontSize.extraSmall, fontWeight: 700, color: theme.colors.draw,
      textTransform: 'uppercase', letterSpacing: '0.05em', margin: `0 0 ${theme.spacing.medium} 0`,
      textAlign: 'center',
    },
    detailsGrid: {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        textAlign: 'center',
        padding: theme.spacing.medium,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.medium,
        marginBottom: theme.spacing.large,
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.extraSmall,
    },
    statValue: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        fontSize: '1.75rem',
        fontWeight: 700,
        lineHeight: 1.1,
    },
    statLabel: {
        fontSize: theme.typography.fontSize.extraSmall,
        color: theme.colors.secondaryText,
        textTransform: 'uppercase',
    },
    streaksContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: theme.spacing.medium,
        flexWrap: 'wrap',
    },
    streakItem: {
        backgroundColor: theme.colors.background,
        padding: `${theme.spacing.small} ${theme.spacing.medium}`,
        borderRadius: theme.borderRadius.medium,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        fontSize: theme.typography.fontSize.small,
        color: theme.colors.primaryText,
    },
    streakValue: {
        fontWeight: 700,
        marginRight: '0.25rem',
    },
    recentFormContainer: {
        display: 'flex', gap: '4px', justifyContent: 'center',
        backgroundColor: theme.colors.background, padding: theme.spacing.medium,
        borderRadius: theme.borderRadius.medium,
    },
    formBlock: {
        width: '24px', height: '24px', borderRadius: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: theme.colors.textOnAccent, fontWeight: 'bold', fontSize: '0.8rem'
    },
    closeButton: {
      width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.accent1,
      color: theme.colors.textOnAccent, border: 'none', borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer',
      transition: 'background-color 0.2s', marginTop: theme.spacing.medium,
    },
  };

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .modal-scroll::-webkit-scrollbar { width: 6px; }
        .modal-scroll::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 3px; }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <Card style={styles.cardWrapper}>
            <div style={styles.cardContent} className="modal-scroll">
                <div style={styles.header}>
                  <h2 style={styles.title}>Informe Post-Partido</h2>
                  <p style={styles.subtitle}>{new Date(match.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <div style={styles.detailsGrid}>
                    <div style={styles.statItem}>
                        <span style={{...styles.statValue, color: getResultColor(match.result)}}>{match.result}</span>
                        <span style={styles.statLabel}>Resultado</span>
                    </div>
                    <div style={styles.statItem}>
                        <span style={{...styles.statValue, color: theme.colors.primaryText}}>
                            <span style={{fontSize: '1.5rem'}}>⚽️</span> {match.myGoals}
                        </span>
                        <span style={styles.statLabel}>Goles</span>
                    </div>
                    <div style={styles.statItem}>
                        <span style={{...styles.statValue, color: theme.colors.primaryText}}>
                            <span style={{fontSize: '1.5rem'}}>👟</span> {match.myAssists}
                        </span>
                        <span style={styles.statLabel}>Asistencias</span>
                    </div>
                </div>

                {hasActiveStreaks && (
                  <div style={styles.section}>
                      <h4 style={styles.sectionTitle}>Rachas actuales</h4>
                      <div style={styles.streaksContainer}>
                          {streaks.resultStreak.count >= 2 && (
                              <div style={styles.streakItem}>
                                  {streaks.resultStreak.type === 'VICTORIA' && <span>✅</span>}
                                  {streaks.resultStreak.type === 'DERROTA' && <span>❌</span>}
                                  {streaks.resultStreak.type === 'EMPATE' && <span>🤝</span>}
                                  <span><span style={styles.streakValue}>{streaks.resultStreak.count}</span>{streaks.resultStreak.type === 'VICTORIA' ? 'victorias' : (streaks.resultStreak.type === 'EMPATE' ? 'empates' : 'derrotas')}</span>
                              </div>
                          )}
                          {streaks.goalStreak >= 2 && (
                              <div style={styles.streakItem}>
                                  <span style={{fontSize: '1rem'}}>⚽️</span>
                                  <span><span style={styles.streakValue}>{streaks.goalStreak}</span> partidos marcando</span>
                              </div>
                          )}
                          {streaks.assistStreak >= 2 && (
                              <div style={styles.streakItem}>
                                  <span style={{fontSize: '1rem'}}>👟</span>
                                  <span><span style={styles.streakValue}>{streaks.assistStreak}</span> partidos asistiendo</span>
                              </div>
                          )}
                      </div>
                  </div>
                )}

                <div style={styles.section}>
                    <h4 style={styles.sectionTitle}>Forma reciente (Últimos 10)</h4>
                    <div style={styles.recentFormContainer}>
                        {recentForm.map(m => (
                            <div key={m.id} style={{...styles.formBlock, backgroundColor: getResultColor(m.result)}} title={new Date(m.date).toLocaleDateString()}>
                                {resultAbbreviations[m.result]}
                            </div>
                        ))}
                    </div>
                </div>
                
                <button style={styles.closeButton} onClick={onClose}>
                  Entendido
                </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
  
  return createPortal(modalJSX, document.body);
};

export default PostMatchModal;