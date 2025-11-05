import React, { useState, useMemo } from 'react';
import type { Match, MatchSortByType, PlayerPerformance } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { ChevronIcon } from './icons/ChevronIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TeamIcon } from './icons/TeamIcon';
import AutocompleteInput from './AutocompleteInput';
import MatchFormIndicator from './MatchFormIndicator';
import { ShareIcon } from './icons/ShareIcon';
import { StarterStatusIcon } from './icons/StarterStatusIcon';

interface MatchCardProps {
  match: Match;
  allMatches: Match[];
  allPlayers: string[];
  allTournaments: string[];
  onDelete?: () => void;
  onEdit?: () => void;
  onUpdateMatchPlayers?: (matchId: string, players: PlayerPerformance[], tournament: string) => void;
  isReadOnly?: boolean;
  sortBy?: MatchSortByType;
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
};

const MatchCard: React.FC<MatchCardProps> = ({ match, allMatches, allPlayers, allTournaments, onDelete, onEdit, onUpdateMatchPlayers, isReadOnly = false, sortBy }) => {
  const { theme } = useTheme();
  const { tournamentStyles, setViewingPlayerName } = useData();
  const { result, teamName, opponentName, teamScore, opponentScore, date, tournament, notes, players } = match;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingPlayers, setIsEditingPlayers] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState<PlayerPerformance[]>([]);
  const [editingTournament, setEditingTournament] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

  const matchForm = useMemo(() => {
    const currentTournament = match.tournament;
    
    // 1. Filter matches by the current tournament
    const tournamentMatches = allMatches.filter(m => m.tournament === currentTournament);

    // 2. Sort the filtered matches chronologically
    const sortedMatches = tournamentMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 3. Find the index of the current match within this filtered & sorted list
    const currentIndex = sortedMatches.findIndex(m => m.id === match.id);
    if (currentIndex < 0) return [];
    
    // 4. Get the 5 matches before it
    const startIndex = Math.max(0, currentIndex - 5);
    const formMatches = sortedMatches.slice(startIndex, currentIndex);
    
    // 5. Map to just the results
    return formMatches.map(m => m.result);
  }, [match.id, match.tournament, allMatches]);

  const handleShare = async () => {
    setShareStatus('copying');
    
    const resultIcons = { VICTORIA: '✅', EMPATE: '🟰', DERROTA: '❌' };
    const resultTextMap = {
      VICTORIA: 'Victoria',
      DERROTA: 'Derrota',
      EMPATE: 'Empate'
    };
    
    let playerStats = players.map(p => {
        let line = `- ${p.name}`;
        if (p.goals > 0) line += ` ⚽️${p.goals}`;
        if (p.assists > 0) line += ` 👟${p.assists}`;
        return line;
    }).join('\n');

    if (!playerStats) playerStats = "Sin contribuciones individuales registradas."

    const textToCopy = `📋 Informe del Partido
${resultIcons[match.result]} ${teamName} ${teamScore} - ${opponentScore} ${opponentName}
${resultTextMap[match.result]}

${playerStats}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShareStatus('copied');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setShareStatus('error');
    } finally {
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };
  
  const getShareButtonText = () => {
    switch (shareStatus) {
      case 'copying': return 'Copiando...';
      case 'copied': return '¡Copiado!';
      case 'error': return 'Error';
      default: return 'Compartir Marcador';
    }
  };


  const getResultStyle = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): React.CSSProperties => {
    const baseStyle = styles.resultBadge;
    switch (result) {
      case 'VICTORIA':
        return { ...baseStyle, backgroundColor: `${theme.colors.win}26`, color: theme.colors.win, border: `1px solid ${theme.colors.win}80` };
      case 'DERROTA':
        return { ...baseStyle, backgroundColor: `${theme.colors.loss}26`, color: theme.colors.loss, border: `1px solid ${theme.colors.loss}80` };
      case 'EMPATE':
        return { ...baseStyle, backgroundColor: `${theme.colors.draw}33`, color: theme.colors.draw, border: `1px solid ${theme.colors.draw}80` };
    }
  };

  const handleEditPlayersClick = () => {
    setTeamPlayers(match.players || []);
    setEditingTournament(match.tournament || '');
    setIsEditingPlayers(true);
  };

  const handleCancelEditPlayers = () => {
    setIsEditingPlayers(false);
  };
  
  const handleSavePlayers = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateMatchPlayers) {
        const finalTeamPlayers = teamPlayers.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);
        onUpdateMatchPlayers(match.id, finalTeamPlayers, editingTournament);
    }
    setIsEditingPlayers(false);
  };

  const handlePlayerInputChange = (index: number, field: 'name' | 'goals' | 'assists' | 'minutesPlayed', value: string | number) => {
    setTeamPlayers(currentPlayers => {
        const newPlayers = [...currentPlayers];
        const updatedPlayer = { ...newPlayers[index] };

        if (field === 'name') {
            updatedPlayer.name = value as string;
        } else {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue >= 0) {
                updatedPlayer[field] = numValue;
            }
        }
        
        newPlayers[index] = updatedPlayer;
        return newPlayers;
    });
  };

  const handleTogglePlayerStatus = (index: number) => {
    setTeamPlayers(currentPlayers => {
        const newPlayers = [...currentPlayers];
        const currentStatus = newPlayers[index].status;
        let newStatus: PlayerPerformance['status'] = 'starter';
        if (currentStatus === 'starter') {
            newStatus = 'goalkeeper';
        } else if (currentStatus === 'goalkeeper') {
            newStatus = 'substitute';
        }
        newPlayers[index] = { ...newPlayers[index], status: newStatus };
        return newPlayers;
    });
  };
  
  const handleAddPlayerInput = () => {
    setTeamPlayers(currentPlayers => [...currentPlayers, { name: '', goals: 0, assists: 0, minutesPlayed: 90, status: 'starter' }]);
  };

  const getBorderColorFromResult = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): string => {
    switch (result) {
      case 'VICTORIA': return theme.colors.win;
      case 'DERROTA': return theme.colors.loss;
      case 'EMPATE': return theme.colors.draw;
    }
  };

  const tournamentStyle = tournament ? tournamentStyles[tournament] : null;
  const truncateName = (name: string, length: number = 30): string => {
      if (!name) return '';
      return name.length > length ? `${name.substring(0, length)}...` : name;
  };

  const dateObj = new Date(date);
  const day = dateObj.getUTCDate();
  const month = dateObj.toLocaleString('es-ES', { month: 'short' });
  const year = dateObj.getFullYear().toString().slice(-2);

  const styles: { [key: string]: React.CSSProperties } = {
    card: {
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.medium, transition: 'background-color 0.2s, box-shadow 0.2s, border-color 0.3s',
      border: `1px solid ${getBorderColorFromResult(result)}`,
    },
    mainInfoRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${theme.spacing.medium} ${theme.spacing.large}`,
        gap: theme.spacing.medium,
    },
    toggleRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${theme.spacing.small} ${theme.spacing.large}`,
        borderTop: `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
        backgroundColor: theme.colors.background,
        borderBottomLeftRadius: isExpanded ? 0 : theme.borderRadius.large,
        borderBottomRightRadius: isExpanded ? 0 : theme.borderRadius.large,
    },
    resultBadge: {
      fontSize: theme.typography.fontSize.large, fontWeight: 700,
      borderRadius: theme.borderRadius.medium,
      width: '40px', height: '40px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    scoreDisplayContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.extraSmall,
        flex: 1,
        minWidth: 0,
    },
    scoreRow: {
        display: 'flex',
        alignItems: 'baseline',
        gap: theme.spacing.medium,
    },
    scoreValue: {
        fontSize: theme.typography.fontSize.large,
        fontWeight: 700,
        color: theme.colors.primaryText,
        width: '30px',
        textAlign: 'right',
        flexShrink: 0,
    },
    scoreTeamName: {
        fontSize: theme.typography.fontSize.medium,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    dateContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.colors.secondaryText,
      lineHeight: 1.1,
      fontSize: '9px',
      fontWeight: 600,
      textAlign: 'center',
      textTransform: 'uppercase',
      flexShrink: 0,
    },
    dateDay: {
        fontSize: '14px',
        fontWeight: 700,
        color: theme.colors.primaryText,
    },
    tournamentBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.small,
      backgroundColor: tournamentStyle ? `${tournamentStyle.color}26` : theme.colors.background,
      border: `1px solid ${tournamentStyle ? `${tournamentStyle.color}80` : theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`,
      color: tournamentStyle ? tournamentStyle.color : theme.colors.secondaryText,
      fontSize: theme.typography.fontSize.extraSmall,
      fontWeight: 600,
    },
    cardBody: {
      padding: theme.spacing.large, paddingTop: theme.spacing.medium,
    },
    actionsContainer: {
      display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
      gap: theme.spacing.medium, marginTop: theme.spacing.large,
      flexWrap: 'wrap',
    },
    actionButton: {
      background: 'none', fontSize: theme.typography.fontSize.extraSmall, fontWeight: 600, cursor: 'pointer',
      padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, borderRadius: theme.borderRadius.small,
      transition: 'color 0.2s, background-color 0.2s, border-color 0.2s', display: 'flex', alignItems: 'center', gap: theme.spacing.small,
    },
    editButton: { border: `1px solid ${theme.colors.draw}`, color: theme.colors.secondaryText },
    deleteButton: { border: `1px solid ${theme.colors.loss}80`, color: theme.colors.loss },
    notesSection: { marginBottom: theme.spacing.large },
    sectionHeading: {
      fontSize: theme.typography.fontSize.extraSmall, fontWeight: 700, color: theme.colors.draw, textTransform: 'uppercase',
      letterSpacing: '0.05em', margin: `0 0 ${theme.spacing.small} 0`, display: 'flex', alignItems: 'center', gap: theme.spacing.small,
    },
    notesText: { fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' },
    shareContainer: {
      display: 'flex',
      justifyContent: 'center',
      padding: `${theme.spacing.medium} 0 0 0`,
    },
    shareButton: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.small,
        background: 'none',
        border: `1px solid ${theme.colors.accent2}`,
        color: theme.colors.accent2,
        padding: `${theme.spacing.small} ${theme.spacing.large}`,
        borderRadius: theme.borderRadius.medium,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: theme.typography.fontSize.small,
        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s, opacity 0.2s',
        minWidth: '130px',
        justifyContent: 'center',
    },
    playersSection: { borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.large, marginTop: theme.spacing.large },
    playersHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.medium,
    },
    playersGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: theme.spacing.large },
    playerList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    playerListItem: {
        fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, backgroundColor: theme.colors.background,
        padding: `${theme.spacing.extraSmall} ${theme.spacing.small}`, borderRadius: theme.borderRadius.small,
        border: `1px solid ${theme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    playerName: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
    },
    playerStatBadge: {
        backgroundColor: theme.colors.border,
        color: theme.colors.secondaryText,
        padding: '2px 6px',
        borderRadius: theme.borderRadius.small,
        fontSize: '0.7rem',
        fontWeight: 600,
        marginLeft: theme.spacing.small
    },
    teamHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: theme.spacing.small,
    },
    addPlayerButton: {
        background: 'none',
        border: `1px dashed ${theme.colors.borderStrong}`,
        color: theme.colors.secondaryText,
        padding: theme.spacing.small,
        fontSize: theme.typography.fontSize.extraSmall,
        borderRadius: theme.borderRadius.medium,
        cursor: 'pointer',
        transition: 'background-color 0.2s, color 0.2s',
        width: '100%',
        marginTop: theme.spacing.small,
        fontWeight: 600,
    },
    teamLabel: {
        fontSize: theme.typography.fontSize.small, fontWeight: 600, color: theme.colors.secondaryText,
        margin: `0 0 ${theme.spacing.small} 0`,
    },
    playerInputContainer: {
        marginBottom: theme.spacing.small,
    },
    playerInputRow: {
        display: 'flex',
        gap: theme.spacing.small,
        alignItems: 'center',
    },
    statInput: {
        width: '40px',
        padding: '0.3rem',
        textAlign: 'center' as 'center',
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium,
        color: theme.colors.primaryText
    },
  };
  
  const resultStyle = getResultStyle(result);
  
  const shareButtonStyle = { ...styles.shareButton };
  if (shareStatus === 'copied') {
      shareButtonStyle.backgroundColor = `${theme.colors.win}20`;
      shareButtonStyle.borderColor = theme.colors.win;
      shareButtonStyle.color = theme.colors.win;
  } else if (shareStatus === 'error') {
      shareButtonStyle.backgroundColor = `${theme.colors.loss}20`;
      shareButtonStyle.borderColor = theme.colors.loss;
      shareButtonStyle.color = theme.colors.loss;
  } else if (shareStatus === 'copying') {
      shareButtonStyle.opacity = 0.7;
  }

  return (
    <div style={styles.card}>
      <div style={styles.mainInfoRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.medium, flex: 1, minWidth: 0 }}>
          <span style={resultStyle}>{resultAbbreviations[result]}</span>
          <div style={styles.scoreDisplayContainer}>
            <div style={styles.scoreRow}>
              <span style={styles.scoreValue}>{teamScore}</span>
              <span style={{...styles.scoreTeamName, fontWeight: result === 'VICTORIA' ? 700 : 500, color: result === 'VICTORIA' ? theme.colors.primaryText : theme.colors.secondaryText}}>
                {truncateName(teamName)}
              </span>
            </div>
            <div style={styles.scoreRow}>
              <span style={styles.scoreValue}>{opponentScore}</span>
              <span style={{...styles.scoreTeamName, fontWeight: result === 'DERROTA' ? 700 : 500, color: result === 'DERROTA' ? theme.colors.primaryText : theme.colors.secondaryText}}>
                {truncateName(opponentName)}
              </span>
            </div>
          </div>
        </div>
        <div style={styles.dateContainer}>
            <span style={styles.dateDay}>{day}</span>
            <span>{month}</span>
            <span>{year}</span>
        </div>
      </div>
      <div style={styles.toggleRow} onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex={0} aria-expanded={isExpanded}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, minWidth: 0, gap: theme.spacing.medium }}>
            {tournament ? (
              <div style={styles.tournamentBadge} title={tournament}>
                <span style={{ fontSize: '1em' }}>{tournamentStyle?.icon || '🏆'}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tournament}</span>
              </div>
            ) : <div /> /* Empty div for spacing */}
            {matchForm.length > 0 && <MatchFormIndicator form={matchForm} />}
        </div>
        <ChevronIcon isExpanded={isExpanded} />
      </div>
      
      {isExpanded && (
        <div style={{ ...styles.cardBody, animation: 'fadeIn 0.5s ease-in-out' }}>
            {notes && (
              <div style={styles.notesSection}>
                <h4 style={styles.sectionHeading}>Notas</h4>
                <p style={styles.notesText}>{notes}</p>
              </div>
            )}
            
            {!isReadOnly && (
              <div style={styles.shareContainer}>
                  <button
                      onClick={handleShare}
                      style={shareButtonStyle}
                      disabled={shareStatus !== 'idle'}
                  >
                      <ShareIcon />
                      <span>{getShareButtonText()}</span>
                  </button>
              </div>
            )}
            
            {!isReadOnly && (
              <div style={styles.playersSection}>
                  {!isEditingPlayers ? (
                      <div>
                          <div style={styles.playersHeader}>
                              <h4 style={styles.sectionHeading}><TeamIcon /> Jugadores del Partido</h4>
                              <button onClick={handleEditPlayersClick} style={{...styles.actionButton, ...styles.editButton, margin: 0}}>
                                  { (match.players?.length || match.tournament) ? 'Editar' : '+ Añadir Info'}
                              </button>
                          </div>
                          {(match.players?.length) ? (
                              <div style={styles.playersGrid}>
                                  <div>
                                      <h5 style={styles.teamLabel}>{teamName || 'Nuestro Equipo'}</h5>
                                      <ul style={styles.playerList}>
                                          {players.map((player, index) => (
                                              <li key={index} style={styles.playerListItem}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.small }}>
                                                    <StarterStatusIcon status={player.status} />
                                                    <span style={styles.playerName} onClick={() => setViewingPlayerName(player.name)}>{player.name}</span>
                                                </div>
                                                <div>
                                                  {player.goals > 0 && <span style={styles.playerStatBadge}>⚽️ {player.goals}</span>}
                                                  {player.assists > 0 && <span style={styles.playerStatBadge}>👟 {player.assists}</span>}
                                                  {player.minutesPlayed && player.minutesPlayed > 0 && <span style={styles.playerStatBadge}>⏱️ {player.minutesPlayed}'</span>}
                                                </div>
                                              </li>
                                          ))}
                                          {players.length === 0 && <li style={{...styles.playerListItem, color: theme.colors.secondaryText, fontStyle: 'italic'}}>No hay jugadores</li>}
                                      </ul>
                                  </div>
                              </div>
                          ) : null}
                      </div>
                  ) : (
                      <form onSubmit={handleSavePlayers}>
                          <div style={styles.playersHeader}>
                              <h4 style={styles.sectionHeading}><TeamIcon /> Editar Info del Partido</h4>
                          </div>
                          <div style={{marginBottom: theme.spacing.large}}>
                            <h5 style={styles.teamLabel}>Torneo</h5>
                            <AutocompleteInput 
                                placeholder="Ej: Liga Semanal" 
                                value={editingTournament} 
                                onChange={setEditingTournament} 
                                suggestions={allTournaments}
                            />
                          </div>
                          <div style={styles.playersGrid}>
                              <div>
                                  <div style={styles.teamHeader}>
                                      <h5 style={styles.teamLabel}>{teamName || 'Nuestro Equipo'}</h5>
                                  </div>
                                  {teamPlayers.map((player, index) => (
                                    <div key={`mine-${index}`} style={styles.playerInputContainer}>
                                        <div style={styles.playerInputRow}>
                                            <button type="button" onClick={() => handleTogglePlayerStatus(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                                <StarterStatusIcon status={player.status} />
                                            </button>
                                          <div style={{flex: 1}}><AutocompleteInput placeholder={`Jugador ${index + 1}`} value={player.name} onChange={(value) => handlePlayerInputChange(index, 'name', value)} suggestions={allPlayers}/></div>
                                          <input type="number" min="0" value={player.goals} onChange={e => handlePlayerInputChange(index, 'goals', e.target.value)} style={styles.statInput} aria-label={`Goles de ${player.name || 'compañero'}`} />
                                          <input type="number" min="0" value={player.assists} onChange={e => handlePlayerInputChange(index, 'assists', e.target.value)} style={styles.statInput} aria-label={`Asistencias de ${player.name || 'compañero'}`} />
                                          <input type="number" min="0" max="120" value={player.minutesPlayed ?? 90} onChange={e => handlePlayerInputChange(index, 'minutesPlayed', e.target.value)} style={styles.statInput} aria-label={`Minutos de ${player.name || 'compañero'}`} />
                                        </div>
                                    </div>
                                  ))}
                                  <button type="button" onClick={() => handleAddPlayerInput()} style={styles.addPlayerButton}>+ JUGADOR</button>
                              </div>
                          </div>
                          <div style={{display: 'flex', justifyContent: 'flex-end', gap: theme.spacing.medium, marginTop: theme.spacing.small}}>
                              <button type="button" onClick={handleCancelEditPlayers} style={{...styles.actionButton, ...styles.editButton}}>Cancelar</button>
                              <button type="submit" style={{...styles.actionButton, border: `1px solid ${theme.colors.win}`, color: theme.colors.win}}>Guardar</button>
                          </div>
                      </form>
                  )}
              </div>
            )}
            
             <div style={styles.actionsContainer}>
                {!isReadOnly && (
                  <>
                    <button onClick={onEdit} style={{...styles.actionButton, ...styles.editButton}} aria-label="Editar partido">EDITAR</button>
                    <button onClick={onDelete} style={{...styles.actionButton, ...styles.deleteButton}} aria-label="Eliminar partido">
                      <TrashIcon />
                    </button>
                  </>
                )}
             </div>
        </div>
      )}
      <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
      `}</style>
    </div>
  );
};

export default MatchCard;