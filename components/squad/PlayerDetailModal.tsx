import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { type Match, type SquadPlayerStats, type PlayerProfileData } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';
import StatCard from '../StatCard';
import { ImageIcon } from '../icons/ImageIcon';
import { StarterStatusIcon } from '../icons/StarterStatusIcon';

interface PlayerDetailModalProps {
  player: SquadPlayerStats;
  allMatches: Match[];
  profile: PlayerProfileData | undefined;
  onClose: () => void;
  onProfileUpdate: (playerName: string, data: Partial<PlayerProfileData>) => void;
}

const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, allMatches, profile, onClose, onProfileUpdate }) => {
  const { theme } = useTheme();
  const [photoUrlInput, setPhotoUrlInput] = useState(profile?.photoUrl || '');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  const handlePhotoUpdate = () => {
    onProfileUpdate(player.name, { photoUrl: photoUrlInput });
  };
  
  const playerMatches = useMemo(() => 
    allMatches.filter(m => m.players.some(p => p.name === player.name))
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allMatches, player.name]
  );
  
  const playerRecords = useMemo(() => {
    if (playerMatches.length === 0) return { bestGoals: 0, bestAssists: 0 };
    const bestGoals = Math.max(...playerMatches.map(m => m.players.find(p => p.name === player.name)?.goals || 0));
    const bestAssists = Math.max(...playerMatches.map(m => m.players.find(p => p.name === player.name)?.assists || 0));
    return { bestGoals, bestAssists };
  }, [playerMatches, player.name]);

  const getResultStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const base = {
        width: '24px', height: '24px', borderRadius: '6px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
        fontWeight: 'bold', flexShrink: 0, color: theme.colors.textOnAccent
    };
    switch (result) {
      case 'VICTORIA': return { ...base, backgroundColor: theme.colors.win };
      case 'DERROTA': return { ...base, backgroundColor: theme.colors.loss };
      case 'EMPATE': return { ...base, backgroundColor: theme.colors.draw };
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: theme.spacing.medium, animation: 'fadeIn 0.3s ease',
    },
    modal: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, width: '100%', maxWidth: '600px',
      maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      animation: 'scaleUp 0.3s ease', border: `1px solid ${theme.colors.border}`,
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      borderBottom: `1px solid ${theme.colors.border}`, flexShrink: 0,
    },
    title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700, color: theme.colors.primaryText },
    content: {
      overflowY: 'auto', padding: theme.spacing.large,
      display: 'flex', flexDirection: 'column', gap: theme.spacing.large,
    },
    profileHeader: {
        display: 'flex',
        gap: theme.spacing.large,
        alignItems: 'center',
    },
    photoContainer: {
        width: '120px', height: '120px',
        borderRadius: '50%',
        backgroundColor: theme.colors.background,
        border: `2px dashed ${theme.colors.borderStrong}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
    },
    photo: { width: '100%', height: '100%', objectFit: 'cover' },
    photoInputContainer: { flex: 1 },
    photoInput: {
        width: '100%',
        padding: theme.spacing.small,
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium,
        color: theme.colors.primaryText,
        fontSize: '0.8rem',
        marginBottom: theme.spacing.small
    },
    savePhotoButton: {
        background: 'none',
        border: `1px solid ${theme.colors.accent1}`,
        color: theme.colors.accent1,
        padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`,
        borderRadius: theme.borderRadius.medium,
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer'
    },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: theme.spacing.medium },
    section: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    sectionTitle: { fontSize: '0.8rem', fontWeight: 600, color: theme.colors.secondaryText, textTransform: 'uppercase', margin: 0, paddingBottom: '0.25rem', borderBottom: `1px solid ${theme.colors.border}` },
    matchRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `${theme.spacing.small} 0`, borderBottom: `1px solid ${theme.colors.border}`,
    },
    lastMatchRow: { borderBottom: 'none' },
    matchDate: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small },
    matchStats: { display: 'flex', gap: theme.spacing.medium, fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText },
  };

  const modalJSX = (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .subtle-scrollbar::-webkit-scrollbar { width: 6px; }
        .subtle-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .subtle-scrollbar::-webkit-scrollbar-thumb { background-color: ${theme.colors.border}; border-radius: 10px; }
        .subtle-scrollbar { scrollbar-width: thin; scrollbar-color: ${theme.colors.border} transparent; }
      `}</style>
      <div style={styles.backdrop} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <header style={styles.header}>
            <h2 style={styles.title}>Perfil de {player.name}</h2>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><CloseIcon color={theme.colors.primaryText} /></button>
          </header>
          <div style={styles.content} className="subtle-scrollbar">
            <div style={styles.profileHeader}>
                <div style={styles.photoContainer}>
                    {profile?.photoUrl ? (
                        <img src={profile.photoUrl} alt={player.name} style={styles.photo} />
                    ) : (
                        <ImageIcon size={40} color={theme.colors.borderStrong} />
                    )}
                </div>
                <div style={styles.photoInputContainer}>
                    <p style={{...styles.sectionTitle, border: 'none', padding: 0, margin: `0 0 ${theme.spacing.small} 0`}}>Foto del jugador</p>
                    <input 
                        type="text" 
                        placeholder="Pega la URL de la imagen aquí..."
                        value={photoUrlInput}
                        onChange={(e) => setPhotoUrlInput(e.target.value)}
                        style={styles.photoInput}
                    />
                    <button onClick={handlePhotoUpdate} style={styles.savePhotoButton}>Guardar foto</button>
                </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Estadísticas</h3>
              <div style={styles.statsGrid}>
                <StatCard label="Partidos Jugados" value={player.matchesPlayed} />
                <StatCard label="Titular" value={player.starts} />
                <StatCard label="Suplente" value={player.subAppearances} />
                <StatCard label="Goles" value={player.goals} />
                <StatCard label="Asistencias" value={player.assists} />
                <StatCard label="Minutos Jugados" value={player.minutesPlayed} />
                <StatCard label="% Victorias" value={`${player.winRate.toFixed(1)}%`} />
                <StatCard label="Goles / Partido" value={player.gpm.toFixed(2)} />
              </div>
            </div>
            
             <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Récords Personales</h3>
              <div style={styles.statsGrid}>
                <StatCard label="Goles en 1 Partido" value={playerRecords.bestGoals} />
                <StatCard label="Asist. en 1 Partido" value={playerRecords.bestAssists} />
              </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Historial de Partidos</h3>
                <div>
                    {playerMatches.map((match, index) => {
                        const playerPerf = match.players.find(p => p.name === player.name);
                        return (
                            <div key={match.id} style={ index === playerMatches.length - 1 ? {...styles.matchRow, ...styles.lastMatchRow} : styles.matchRow}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium}}>
                                    <span style={styles.matchDate}>{new Date(match.date).toLocaleDateString()}</span>
                                    <div style={getResultStyle(match.result)}>{match.result.charAt(0)}</div>
                                    {playerPerf && <StarterStatusIcon status={playerPerf.status} />}
                                </div>
                                <div style={styles.matchStats}>
                                    {playerPerf && (
                                        <>
                                            {playerPerf.goals > 0 && <span style={{color: theme.colors.primaryText}}>⚽️ {playerPerf.goals}</span>}
                                            {playerPerf.assists > 0 && <span style={{color: theme.colors.primaryText}}>👟 {playerPerf.assists}</span>}
                                            {playerPerf.minutesPlayed && <span style={{color: theme.colors.primaryText}}>⏱️ {playerPerf.minutesPlayed}'</span>}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalJSX, document.body);
};

export default PlayerDetailModal;