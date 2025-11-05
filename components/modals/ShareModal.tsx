import React, { useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { useTheme } from '../../contexts/ThemeContext';
import type { ShareableMoment } from '../../pages/SocialPage';
import { FootballIcon } from '../icons/FootballIcon';
import { ShareIcon } from '../icons/ShareIcon';
import { Loader } from '../Loader';
import { CloseIcon } from '../icons/CloseIcon';
import type { PlayerMorale } from '../../types';
import RadarChart from '../charts/RadarChart';

interface ShareModalProps {
  moment: ShareableMoment;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ moment, onClose }) => {
  const { theme } = useTheme();
  const storyRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backgroundStyle = useMemo(() => {
    let svgBackground = '';

    if (moment.type === 'match' || moment.type === 'match_mvp' || moment.type === 'last_match' || moment.type === 'yearly_summary') {
      svgBackground = `
        <svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="winGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stop-color="${theme.colors.win}" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="${theme.colors.win}" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="1080" height="1350" fill="url(#winGradient)"/>
        </svg>
      `;
    } else if (moment.type === 'achievement') {
      svgBackground = `
        <svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="achGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stop-color="${theme.colors.accent3}" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="${theme.colors.accent3}" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="1080" height="1350" fill="url(#achGradient)"/>
        </svg>
      `;
    } else if (moment.type === 'morale') {
        const morale = moment.data as PlayerMorale;
        const hue = (morale.score / 100) * 120; // 0=red, 120=green
        const moraleColor = `hsl(${hue}, 70%, 45%)`;
         svgBackground = `
            <svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="moraleGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stop-color="${moraleColor}" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="${moraleColor}" stop-opacity="0"/>
                </radialGradient>
              </defs>
              <rect width="1080" height="1350" fill="url(#moraleGradient)"/>
            </svg>
          `;
    }


    if (svgBackground) {
        return {
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svgBackground)}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };
    }
    return {};

  }, [moment.type, theme.colors, moment.data]);

  const generateImage = async (): Promise<string | null> => {
    if (!storyRef.current) return null;
    try {
      return await toPng(storyRef.current, {
        width: 1080,
        height: 1350,
      });
    } catch (err) {
      console.error(err);
      setError('Error al generar la imagen.');
      return null;
    }
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    setError(null);
    const dataUrl = await generateImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `futbolstats-story.png`;
      link.href = dataUrl;
      link.click();
    }
    setIsProcessing(false);
  };

  const handleShare = async () => {
    setIsProcessing(true);
    setError(null);
    const dataUrl = await generateImage();
    if (!dataUrl) {
      setIsProcessing(false);
      return;
    }
    
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `futbolstats-story.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'FútbolStats',
        });
      } else {
        setError('Función de compartir no soportada.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Error al compartir la imagen.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMomentContent = (moment: ShareableMoment) => {
    const styles: { [key: string]: React.CSSProperties } = {
        storyMainText: { fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, margin: '0.5rem 0' },
        storySubText: { fontSize: '1.2rem', color: theme.colors.secondaryText, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' },
    };

    switch (moment.type) {
      case 'match':
      case 'match_mvp':
      case 'last_match':
        const match = moment.data;
        return (
          <div style={{animation: 'fadeInUp 0.5s ease-out backwards'}}>
            <h2 style={styles.storyMainText}>{moment.type === 'match_mvp' ? 'MVP' : match.result}</h2>
            <p style={styles.storySubText}>{new Date(match.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '3rem', width: '80%', margin: '3rem auto 0 auto' }}>
              <div><p style={styles.storyMainText}>{match.myGoals}</p><p style={styles.storySubText}>Goles</p></div>
              <div><p style={styles.storyMainText}>{match.myAssists}</p><p style={styles.storySubText}>Asist.</p></div>
            </div>
          </div>
        );
      case 'achievement':
        const { achievement, tier } = moment.data;
        return (
            <div style={{animation: 'fadeInUp 0.5s ease-out backwards'}}>
                <div style={{ fontSize: '6rem' }}>{tier.icon}</div>
                <h2 style={{...styles.storyMainText, fontSize: '3rem'}}>{achievement.title}</h2>
                <p style={styles.storySubText}>{tier.name} desbloqueado</p>
            </div>
        );
      case 'recent_form':
        const results = moment.data as ('VICTORIA' | 'DERROTA' | 'EMPATE')[];
        const resultStyles = {
            VICTORIA: { color: theme.colors.win, label: 'V' },
            EMPATE: { color: theme.colors.draw, label: 'E' },
            DERROTA: { color: theme.colors.loss, label: 'D' },
        }
        return (
            <div style={{animation: 'fadeInUp 0.5s ease-out backwards'}}>
                <h2 style={{...styles.storyMainText, fontSize: '3rem'}}>Racha Reciente</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '2rem' }}>
                    {results.map((result, index) => (
                        <div key={index} style={{
                            width: '60px', height: '60px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            borderRadius: '0.75rem', backgroundColor: `${resultStyles[result].color}33`,
                            color: resultStyles[result].color, fontSize: '2.5rem', fontWeight: 700
                        }}>
                            {resultStyles[result].label}
                        </div>
                    ))}
                </div>
            </div>
        );
      case 'monthly_summary':
        const stats = moment.data;
        const statGridStyle: React.CSSProperties = {
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem 2rem', marginTop: '2rem', textAlign: 'center'
        };
        return (
            <div style={{animation: 'fadeInUp 0.5s ease-out backwards'}}>
                <h2 style={{...styles.storyMainText, fontSize: '2.8rem', textTransform: 'capitalize'}}>{stats.monthName}</h2>
                <p style={styles.storySubText}>Resumen del Mes</p>
                <div style={statGridStyle}>
                    <div><p style={{...styles.storyMainText, fontSize: '2.8rem'}}>{stats.matches}</p><p style={styles.storySubText}>Partidos</p></div>
                    <div><p style={{...styles.storyMainText, fontSize: '2.8rem'}}>{stats.wins}-{stats.draws}-{stats.losses}</p><p style={styles.storySubText}>Récord</p></div>
                    <div><p style={{...styles.storyMainText, fontSize: '2.8rem'}}>{stats.goals}</p><p style={styles.storySubText}>Goles</p></div>
                    <div><p style={{...styles.storyMainText, fontSize: '2.8rem'}}>{stats.assists}</p><p style={styles.storySubText}>Asist.</p></div>
                </div>
            </div>
        );
      case 'morale':
        const morale = moment.data as PlayerMorale;
        const hue = (morale.score / 100) * 120;
        const color = `hsl(${hue}, 80%, 60%)`;
        return (
            <div style={{animation: 'fadeInUp 0.5s ease-out backwards'}}>
                <h2 style={{...styles.storyMainText, color, textTransform: 'uppercase', fontSize: '3rem' }}>{morale.level}</h2>
                <p style={{...styles.storySubText, fontStyle: 'italic', maxWidth: '80%', margin: '0 auto', textTransform: 'none' }}>"{morale.description}"</p>
                <div style={{marginTop: '3rem'}}>
                    <p style={{...styles.storyMainText, fontSize: '3rem'}}>{morale.score.toFixed(0)}</p>
                    <p style={styles.storySubText}>Puntaje de moral</p>
                    <p style={{...styles.storySubText, fontSize: '1rem', marginTop: '1rem' }}>Basado en {morale.recentMatchesSummary.record} en los últimos {morale.recentMatchesSummary.matchesConsidered} PJ</p>
                </div>
            </div>
        );
      case 'yearly_summary':
        const yearData = moment.data;
        const yearlyStyles = {
            container: { display: 'flex', flexDirection: 'column' as 'column', gap: '1rem', justifyContent: 'center', height: '100%' },
            title: { fontSize: '3rem', fontWeight: 900, margin: 0, lineHeight: 1 },
            subtitle: { fontSize: '1.2rem', color: theme.colors.secondaryText, margin: `0.25rem 0 0 0`, textTransform: 'uppercase' as 'uppercase', letterSpacing: '0.05em' },
            statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' as 'center', margin: '1rem 0' },
            statItem: { display: 'flex', flexDirection: 'column' as 'column' },
            statValue: { fontSize: '2.2rem', fontWeight: 700 },
            statLabel: { fontSize: '0.9rem', color: theme.colors.secondaryText },
            radarContainer: { margin: '-2rem 0 -1.5rem 0' },
            streaksContainer: { display: 'flex', justifyContent: 'space-around', textAlign: 'center' as 'center' },
            duelsContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
            duelColumn: { display: 'flex', flexDirection: 'column' as 'column', gap: '0.5rem' },
            duelTitle: { fontSize: '1.1rem', fontWeight: 700, margin: 0, color: theme.colors.secondaryText, paddingBottom: '0.5rem', borderBottom: `2px solid ${theme.colors.border}` },
            playerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
            playerName: { fontSize: '0.9rem', fontWeight: 500 },
            playerScore: { fontSize: '0.9rem', fontWeight: 700 },
        };
        return (
            <div style={yearlyStyles.container}>
                <div style={{animation: 'fadeInUp 0.5s ease-out backwards'}}>
                    <h2 style={yearlyStyles.title}>Resumen del Año</h2>
                    <p style={yearlyStyles.subtitle}>{yearData.year}</p>
                </div>
                <div style={{...yearlyStyles.statsGrid, animation: 'fadeInUp 0.6s ease-out backwards'}}>
                    <div style={yearlyStyles.statItem}><span style={yearlyStyles.statValue}>{yearData.summaryStats.matches}</span><span style={yearlyStyles.statLabel}>PJ</span></div>
                    <div style={yearlyStyles.statItem}><span style={yearlyStyles.statValue}>{yearData.summaryStats.record}</span><span style={yearlyStyles.statLabel}>V-E-D</span></div>
                    <div style={yearlyStyles.statItem}><span style={yearlyStyles.statValue}>{yearData.summaryStats.goals + yearData.summaryStats.assists}</span><span style={yearlyStyles.statLabel}>G+A</span></div>
                </div>
                 <div style={{...yearlyStyles.radarContainer, animation: 'fadeInUp 0.7s ease-out backwards'}}>
                    <RadarChart playersData={yearData.radarData} size={400} showLegend={false} />
                </div>
                 <div style={{...yearlyStyles.streaksContainer, animation: 'fadeInUp 0.8s ease-out backwards'}}>
                    <div style={yearlyStyles.statItem}><span style={yearlyStyles.statValue}>{yearData.yearlyRecords.longestWinStreak.value}</span><span style={yearlyStyles.statLabel}>Racha Victorias</span></div>
                    <div style={yearlyStyles.statItem}><span style={yearlyStyles.statValue}>{yearData.yearlyRecords.longestUndefeatedStreak.value}</span><span style={yearlyStyles.statLabel}>Racha Invicto</span></div>
                </div>
                 <div style={{...yearlyStyles.duelsContainer, animation: 'fadeInUp 0.9s ease-out backwards'}}>
                    <div style={yearlyStyles.duelColumn}>
                        <h3 style={yearlyStyles.duelTitle}>Mejores Socios</h3>
                        {yearData.topPartners.map((p: any) => <div key={p.name} style={yearlyStyles.playerRow}><span style={yearlyStyles.playerName}>{p.name}</span> <span style={{...yearlyStyles.playerScore, color: theme.colors.win}}>{p.impactScore.toFixed(1)}</span></div>)}
                    </div>
                     <div style={yearlyStyles.duelColumn}>
                        <h3 style={yearlyStyles.duelTitle}>Némesis</h3>
                        {yearData.nemesisRivals.map((p: any) => <div key={p.name} style={yearlyStyles.playerRow}><span style={yearlyStyles.playerName}>{p.name}</span> <span style={{...yearlyStyles.playerScore, color: theme.colors.loss}}>{p.impactScore.toFixed(1)}</span></div>)}
                    </div>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: { 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: theme.spacing.medium, animation: 'fadeIn 0.3s',
    },
    modal: { 
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, 
        width: '100%', maxWidth: '420px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s', 
        border: `1px solid ${theme.colors.border}` 
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderBottom: `1px solid ${theme.colors.border}` },
    title: { margin: 0, fontSize: '1.1rem', fontWeight: 600, color: theme.colors.primaryText },
    content: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large, padding: theme.spacing.large, overflowY: 'auto' },
    storyPreview: {
      aspectRatio: '4 / 5', width: '100%', margin: '0 auto',
      borderRadius: theme.borderRadius.medium, overflow: 'hidden',
      boxShadow: theme.shadows.large, 
    },
    storyContent: {
      width: '100%', height: '100%', display: 'flex',
      flexDirection: 'column', justifyContent: 'space-between',
      padding: '2.5rem', color: theme.colors.primaryText,
      fontFamily: theme.typography.fontFamily, textAlign: 'center',
      background: theme.colors.backgroundGradient,
    },
    storyFooter: {
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: '0.5rem', opacity: 0.8, fontSize: '1rem', fontWeight: 500,
    },
    actions: {
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: theme.spacing.medium, marginTop: theme.spacing.small,
    },
    button: {
      padding: theme.spacing.medium, border: 'none', borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.small, fontWeight: 'bold', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.small,
    },
    downloadButton: { backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText },
    shareButton: { backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent },
    error: { color: theme.colors.loss, fontSize: theme.typography.fontSize.small, textAlign: 'center', margin: 0 },
  };

  const modalJSX = (
     <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <header style={styles.header}>
            <h3 style={styles.title}>{moment.title}</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose} aria-label="Cerrar"><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.content} className="subtle-scrollbar">
            <div style={styles.storyPreview}>
              <div ref={storyRef} style={{...styles.storyContent, ...backgroundStyle}}>
                <div /> {/* Top spacer */}
                {renderMomentContent(moment)}
                <footer style={styles.storyFooter}>
                  <FootballIcon size={20} />
                  <span>FútbolStats</span>
                </footer>
              </div>
            </div>
            <div style={styles.actions}>
              <button onClick={handleDownload} disabled={isProcessing} style={{...styles.button, ...styles.downloadButton}}>
                {isProcessing ? <Loader /> : 'Descargar'}
              </button>
              <button onClick={handleShare} disabled={isProcessing} style={{...styles.button, ...styles.shareButton}}>
                {isProcessing ? <Loader /> : <ShareIcon />}
              </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default ShareModal;