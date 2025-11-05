import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import type { Match } from '../../types';
import { generateMatchHeadline } from '../../services/geminiService';
import { CloseIcon } from '../icons/CloseIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { Loader } from '../Loader';
import { FootballIcon } from '../icons/FootballIcon';
import { ShareIcon } from '../icons/ShareIcon';

interface ShareStoryModalProps {
  match: Match;
  onClose: () => void;
}

const ShareStoryModal: React.FC<ShareStoryModalProps> = ({ match, onClose }) => {
  const { theme } = useTheme();
  const { addAIInteraction } = useData();
  const storyRef = useRef<HTMLDivElement>(null);
  const [headline, setHeadline] = useState('¡Gran Partido!');
  const [isGeneratingHeadline, setIsGeneratingHeadline] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const defaultHeadlines = {
        VICTORIA: "¡Noche de Gloria!",
        EMPATE: "Punto a Punto",
        DERROTA: "A Seguir Luchando"
    };
    setHeadline(defaultHeadlines[match.result]);
  }, [match]);
  
  const handleGenerateHeadline = async () => {
    setIsGeneratingHeadline(true);
    setError(null);
    try {
      const generatedHeadline = await generateMatchHeadline(match);
      setHeadline(generatedHeadline);
      addAIInteraction('match_headline', { matchId: match.id, headline: generatedHeadline });
    } catch (err) {
      setError('Error al generar el titular.');
    } finally {
      setIsGeneratingHeadline(false);
    }
  };

  const handleDownload = () => {
    if (!storyRef.current) return;
    setIsGeneratingImage(true);
    toPng(storyRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `partido-${match.date}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => setError('Error al generar la imagen.'))
      .finally(() => setIsGeneratingImage(false));
  };

  const handleShare = async () => {
    if (!storyRef.current) return;
    setIsGeneratingImage(true);
    try {
        const dataUrl = await toPng(storyRef.current, { cacheBust: true, pixelRatio: 2 });
        const blob = await (await fetch(dataUrl)).blob();

        if (navigator.share && navigator.canShare({ files: [new File([blob], `partido-${match.date}.png`, { type: 'image/png' })] })) {
            await navigator.share({
                files: [new File([blob], `partido-${match.date}.png`, { type: 'image/png' })],
                title: 'Informe de Partido',
            });
        } else {
            setError('La API para compartir no está disponible en este navegador.');
        }
    } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError('Error al compartir la imagen.');
        }
    } finally {
        setIsGeneratingImage(false);
    }
  };
  
  const resultColors = {
      VICTORIA: { bg: theme.colors.win, text: theme.colors.textOnAccent },
      DERROTA: { bg: theme.colors.loss, text: theme.colors.textOnAccent },
      EMPATE: { bg: theme.colors.draw, text: theme.colors.textOnAccent }
  };
  
  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: { 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.medium,
        animation: 'fadeIn 0.3s',
    },
    modal: { 
        backgroundColor: theme.colors.surface, 
        borderRadius: theme.borderRadius.large, 
        width: '100%', 
        maxWidth: '400px', 
        maxHeight: '90vh',
        display: 'flex', 
        flexDirection: 'column', 
        animation: 'scaleUp 0.3s', 
        border: `1px solid ${theme.colors.border}` 
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderBottom: `1px solid ${theme.colors.border}` },
    title: { margin: 0, fontSize: '1.1rem', fontWeight: 600, color: theme.colors.primaryText },
    content: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large, padding: theme.spacing.large, overflowY: 'auto' },
    storyPreview: { aspectRatio: '9 / 16', width: '100%', borderRadius: theme.borderRadius.medium, overflow: 'hidden', boxShadow: theme.shadows.large, background: theme.colors.backgroundGradient },
    storyCard: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: theme.spacing.large, color: theme.colors.primaryText, fontFamily: theme.typography.fontFamily },
    storyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeInDown 0.5s ease-out' },
    storyResult: { padding: '0.25rem 0.75rem', borderRadius: '99px', fontWeight: 700, fontSize: '0.8rem', backgroundColor: resultColors[match.result].bg, color: resultColors[match.result].text },
    storyDate: { fontSize: '0.8rem', fontWeight: 500, color: theme.colors.secondaryText },
    storyHeadline: { fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', margin: 'auto 0', animation: 'fadeInUp 0.6s 0.2s ease-out backwards' },
    storyStats: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', animation: 'fadeInUp 0.7s 0.4s ease-out backwards' },
    statItem: { textAlign: 'center', animation: 'popIn 0.5s ease-out' },
    statValue: { fontSize: '2rem', fontWeight: 700 },
    statLabel: { fontSize: '0.9rem', color: theme.colors.secondaryText },
    storyFooter: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: 0.7, animation: 'fadeInUp 0.8s 0.6s ease-out backwards' },
    controls: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium },
    headlineEditor: { display: 'flex', gap: theme.spacing.small },
    input: { flex: 1, padding: theme.spacing.medium, backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText, fontSize: '1rem' },
    aiButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: 'none', border: `1px solid ${theme.colors.accent2}`, color: theme.colors.accent2, borderRadius: theme.borderRadius.medium, cursor: 'pointer' },
    actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium },
    actionButton: { padding: '0.875rem 1.25rem', border: 'none', borderRadius: theme.borderRadius.medium, fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.small },
    downloadButton: { backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText },
    shareButton: { backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent },
    error: { color: theme.colors.loss, fontSize: '0.8rem', textAlign: 'center', margin: 0 },
  };
  
  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        .modal-scroll::-webkit-scrollbar { width: 6px; }
        .modal-scroll::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 3px; }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <header style={styles.header}>
            <h3 style={styles.title}>Crear historia</h3>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose} aria-label="Cerrar"><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.content} className="modal-scroll">
            <div style={styles.storyPreview}>
              <div ref={storyRef} style={styles.storyCard}>
                <header style={styles.storyHeader}>
                  <span style={styles.storyResult}>{match.result}</span>
                  <span style={styles.storyDate}>{new Date(match.date).toLocaleDateString()}</span>
                </header>
                <h2 style={styles.storyHeadline}>{headline}</h2>
                <div style={styles.storyStats}>
                  <div style={{...styles.statItem, animationDelay: '0.5s'}}><span style={styles.statValue}>{match.myGoals}</span><span style={styles.statLabel}>Goles</span></div>
                  <div style={{...styles.statItem, animationDelay: '0.6s'}}><span style={styles.statValue}>{match.myAssists}</span><span style={styles.statLabel}>Asist.</span></div>
                </div>
                <footer style={styles.storyFooter}><FootballIcon size={16} /><span style={{fontSize: '0.8rem'}}>FútbolStats</span></footer>
              </div>
            </div>

            <div style={styles.controls}>
                <div style={styles.headlineEditor}>
                    <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} style={styles.input} />
                    <button onClick={handleGenerateHeadline} disabled={isGeneratingHeadline} style={styles.aiButton} aria-label="Generar titular con IA">
                        {isGeneratingHeadline ? <Loader /> : <SparklesIcon />}
                    </button>
                </div>
                <div style={styles.actions}>
                    <button onClick={handleDownload} disabled={isGeneratingImage} style={styles.downloadButton}>
                        {isGeneratingImage ? <Loader /> : 'Descargar'}
                    </button>
                    <button onClick={handleShare} disabled={isGeneratingImage} style={styles.shareButton}>
                        <ShareIcon /> {isGeneratingImage ? '' : 'Compartir'}
                    </button>
                </div>
                {error && <p style={styles.error}>{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
  return createPortal(modalJSX, document.body);
};

export default ShareStoryModal;