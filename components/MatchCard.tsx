
import React, { useState, useMemo, useEffect } from 'react';
import type { Match, MatchSortByType, PlayerPerformance, Incident } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { ChevronIcon } from './icons/ChevronIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TeamIcon } from './icons/TeamIcon';
import AutocompleteInput from './AutocompleteInput';
import MatchFormIndicator from './MatchFormIndicator';
import { ShareIcon } from './icons/ShareIcon';
import { StarterStatusIcon } from './icons/StarterStatusIcon';
import { CardIcon } from './icons/CardIcon';
import { StatStepper } from './StatStepper';

interface MatchCardProps {
  match: Match;
  allMatches: Match[];
  allPlayers: string[];
  allTournaments: string[];
  onDelete?: () => void;
  onEdit?: () => void;
  onUpdateMatchDetails?: (matchId: string, players: PlayerPerformance[], tournament: string, incidents: Incident[]) => void;
  isReadOnly?: boolean;
  sortBy?: MatchSortByType;
}

const resultAbbreviations: Record<'VICTORIA' | 'DERROTA' | 'EMPATE', string> = {
  VICTORIA: 'V',
  DERROTA: 'D',
  EMPATE: 'E',
};

const MatchCard: React.FC<MatchCardProps> = ({ match, allMatches, allPlayers, allTournaments, onDelete, onEdit, onUpdateMatchDetails, isReadOnly = false, sortBy }) => {
  const { theme } = useTheme();
  const { tournamentSettings, setViewingPlayerName, playerProfiles, userRole } = useData();
  const { result, teamName, opponentName, teamScore, opponentScore, date, tournament, notes, players, incidents } = match;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingPlayers, setIsEditingPlayers] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState<PlayerPerformance[]>([]);
  const [editingIncidents, setEditingIncidents] = useState<Incident[]>([]);
  const [editingTournament, setEditingTournament] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const [editingMinuteIndex, setEditingMinuteIndex] = useState<number | null>(null);

  const canEdit = ['owner', 'admin', 'editor'].includes(userRole);

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
  
  // Auto-calculate minutes in edit mode
  useEffect(() => {
      if (isEditingPlayers && editingIncidents.length > 0) {
          const matchDuration = (editingTournament && tournamentSettings[editingTournament]?.matchDuration) || 90;
          
          setTeamPlayers(currentPlayers => {
              let updatedPlayers = [...currentPlayers];
              let changed = false;

              editingIncidents.forEach(inc => {
                  if (inc.type === 'substitution' && inc.playerName && inc.playerIn && inc.minute) {
                      // Find Player OUT
                      const playerOutIndex = updatedPlayers.findIndex(p => p.name.trim().toLowerCase() === inc.playerName.trim().toLowerCase());
                      if (playerOutIndex !== -1) {
                          if (updatedPlayers[playerOutIndex].minutesPlayed !== inc.minute) {
                            updatedPlayers[playerOutIndex] = { ...updatedPlayers[playerOutIndex], minutesPlayed: inc.minute };
                            changed = true;
                          }
                      }

                      // Find Player IN
                      const playerInIndex = updatedPlayers.findIndex(p => p.name.trim().toLowerCase() === inc.playerIn?.trim().toLowerCase());
                      if (playerInIndex !== -1) {
                           const minutesIn = Math.max(0, matchDuration - inc.minute);
                           if (updatedPlayers[playerInIndex].minutesPlayed !== minutesIn) {
                                updatedPlayers[playerInIndex] = { ...updatedPlayers[playerInIndex], minutesPlayed: minutesIn };
                                changed = true;
                           }
                      }
                  }
              });
              
              return changed ? updatedPlayers : currentPlayers;
          });
      }
  }, [editingIncidents, editingTournament, tournamentSettings, isEditingPlayers]);

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
    setEditingIncidents(match.incidents?.map(inc => ({...inc})) || []);
    setEditingTournament(match.tournament || '');
    setIsEditingPlayers(true);
  };

  const handleCancelEditPlayers = () => {
    setIsEditingPlayers(false);
    setEditingMinuteIndex(null);
  };
  
  const handleSavePlayers = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateMatchDetails) {
        const finalTeamPlayers = teamPlayers.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);
        const finalIncidents = editingIncidents.map(i => ({...i, playerName: i.playerName.trim(), playerIn: i.playerIn?.trim()})).filter(i => i.playerName);
        onUpdateMatchDetails(match.id, finalTeamPlayers, editingTournament, finalIncidents);
    }
    setIsEditingPlayers(false);
    setEditingMinuteIndex(null);
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
  
  const handleTogglePlayerCard = (index: number) => {
    setTeamPlayers(currentPlayers => {
        const newPlayers = [...currentPlayers];
        const currentCard = newPlayers[index].card;
        let newCard: PlayerPerformance['card'];
        
        switch (currentCard) {
            case undefined: newCard = 'yellow'; break;
            case 'yellow': newCard = 'double_yellow'; break;
            case 'double_yellow': newCard = 'red'; break;
            case 'red': newCard = 'blue'; break;
            case 'blue': newCard = undefined; break;
            default: newCard = undefined;
        }
        
        newPlayers[index] = { ...newPlayers[index], card: newCard };
        return newPlayers;
    });
  };
  
  const handleAddPlayerInput = () => {
    setTeamPlayers(currentPlayers => [...currentPlayers, { name: '', goals: 0, assists: 0, minutesPlayed: 90, status: 'starter' }]);
  };

  const handleRemovePlayerInput = (index: number) => {
    setTeamPlayers(currentPlayers => currentPlayers.filter((_, i) => i !== index));
  };
  
  const handleAddIncident = () => {
    setEditingIncidents(prev => [...prev, { id: Date.now().toString(), type: 'substitution', playerName: '', playerIn: '', minute: 0 }]);
  };

  const handleRemoveIncident = (index: number) => {
    setEditingIncidents(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleIncidentChange = (index: number, field: 'type' | 'playerName' | 'playerIn' | 'minute', value: string | number) => {
    setEditingIncidents(prev => {
        const newIncidents = [...prev];
        newIncidents[index] = { ...newIncidents[index], [field]: value };
        return newIncidents;
    });
  };


  const getBorderColorFromResult = (result: 'VICTORIA' | 'DERROTA' | 'EMPATE'): string => {
    switch (result) {
      case 'VICTORIA': return theme.colors.win;
      case 'DERROTA': return theme.colors.loss;
      case 'EMPATE': return theme.colors.draw;
    }
  };

  const tournamentStyle = tournament ? tournamentSettings[tournament] : null;
  const truncateName = (name: string, length: number = 30): string => {
      if (!name) return '';
      return name.length > length ? `${name.substring(0, length)}...` : name;
  };
  
  const usedPlayerNames = useMemo(() => {
      return new Set(teamPlayers.map(p => p.name.trim().toLowerCase()).filter(n => n));
  }, [teamPlayers]);

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
        // Reduced padding for better mobile fit
        padding: `${theme.spacing.medium} ${theme.spacing.medium}`,
        gap: theme.spacing.small,
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
      // Reduced padding for mobile fit
      padding: theme.spacing.medium,
      paddingTop: theme.spacing.small,
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
        gap: '2px',
        alignItems: 'center',
    },
    minutesInputContainer: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.small,
        height: '30px',
        padding: '0 1px',
        width: '28px',
        justifyContent: 'center',
        flexShrink: 0,
    },
    minutesInput: {
        width: '100%',
        height: '100%',
        border: 'none',
        background: 'transparent',
        color: theme.colors.primaryText,
        fontSize: '0.7rem',
        textAlign: 'center',
        padding: 0,
        outline: 'none',
        fontWeight: 600,
    },
    minutesDisplay: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: theme.colors.primaryText,
        cursor: 'pointer',
    },
    starterToggleButton: {
        background: 'none',
        border: 'none',
        color: theme.colors.secondaryText,
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        flexShrink: 0,
    },
    cardToggleButton: {
        background: 'none',
        border: 'none',
        color: theme.colors.secondaryText,
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        flexShrink: 0,
    },
     removeButton: {
        background: 'none',
        border: `1px solid ${theme.colors.loss}80`,
        color: theme.colors.loss,
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        lineHeight: 1,
        flexShrink: 0,
        marginLeft: '2px',
    },
    input: {
        width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, 
        color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium, outline: 'none', 
        transition: 'border-color 0.2s, background-color 0.2s',
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

  const getIncidentText = (incident: Incident) => {
      if (incident.type === 'penal_atajado') return 'Penal Atajado';
      if (incident.type === 'penal_errado') return 'Penal Errado';
      if (incident.type === 'substitution') return `Cambio (${incident.minute}')`;
      return 'Incidencia';
  };

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
                              <h4 style={styles.sectionHeading}><TeamIcon /> Detalles del Partido</h4>
                              {canEdit && (
                                  <button onClick={handleEditPlayersClick} style={{...styles.actionButton, ...styles.editButton, margin: 0}}>
                                      { (match.players?.length || match.tournament || match.incidents?.length) ? 'Editar' : '+ Añadir Info'}
                                  </button>
                              )}
                          </div>
                          {incidents && incidents.length > 0 && (
                            <div style={{marginBottom: theme.spacing.medium}}>
                                <h5 style={styles.teamLabel}>Incidencias</h5>
                                <ul style={styles.playerList}>
                                    {incidents.map((incident) => (
                                        <li key={incident.id} style={styles.playerListItem}>
                                            {incident.type === 'substitution' ? (
                                                 <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                                                     <div style={{fontWeight: 600, color: theme.colors.secondaryText, marginBottom: '4px'}}>🔄 Min {incident.minute}'</div>
                                                     <div style={{display: 'flex', gap: theme.spacing.medium}}>
                                                         <span style={{color: theme.colors.loss, fontSize: '0.9rem'}}>⬇️ {incident.playerName}</span>
                                                         <span style={{color: theme.colors.win, fontSize: '0.9rem'}}>⬆️ {incident.playerIn}</span>
                                                     </div>
                                                 </div>
                                            ) : (
                                                <>
                                                    <span>{getIncidentText(incident)}</span>
                                                    <span style={{fontWeight: 600}}>{incident.playerName}</span>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                          )}
                          {(match.players?.length) ? (
                              <div style={styles.playersGrid}>
                                  <div>
                                      <h5 style={styles.teamLabel}>{teamName || 'Nuestro Equipo'}</h5>
                                      <ul style={styles.playerList}>
                                          {players.map((player, index) => {
                                            const jerseyNumber = playerProfiles[player.name]?.jerseyNumber;
                                            return (
                                              <li key={index} style={styles.playerListItem}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.small }}>
                                                    <StarterStatusIcon status={player.status} />
                                                    {jerseyNumber && <span style={{fontWeight: 700, color: theme.colors.secondaryText, fontSize: '0.8rem', minWidth: '18px', textAlign: 'center'}}>{jerseyNumber}</span>}
                                                    <span style={styles.playerName} onClick={() => setViewingPlayerName(player.name)}>{player.name}</span>
                                                </div>
                                                <div style={{display: 'flex', alignItems: 'center', gap: theme.spacing.small}}>
                                                  {player.card && <CardIcon card={player.card} size={18} />}
                                                  {player.goals > 0 && <span style={styles.playerStatBadge}>⚽️ {player.goals}</span>}
                                                  {player.assists > 0 && <span style={styles.playerStatBadge}>👟 {player.assists}</span>}
                                                  {player.minutesPlayed !== undefined && <span style={styles.playerStatBadge}>⏱️ {player.minutesPlayed}</span>}
                                                </div>
                                              </li>
                                          )})}
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
                                  <div style={{display: 'flex', alignItems: 'center', gap: '2px', marginBottom: theme.spacing.small}}>
                                    <span style={{fontSize: '8px', color: theme.colors.secondaryText, width: '20px', textAlign: 'center'}}>Tit</span>
                                    <div style={{flex: 1}} /> {/* Spacer for player name */}
                                    <span style={{fontSize: '8px', color: theme.colors.secondaryText, width: '24px', textAlign: 'center'}}>Tarj</span>
                                    <div style={{width: '34px'}}></div> {/* Spacer for Goals */}
                                    <div style={{width: '34px'}}></div> {/* Spacer for Assists */}
                                    <span style={{fontSize: '8px', color: theme.colors.secondaryText, width: '28px', textAlign: 'center'}}>Min</span>
                                    <div style={{width: '22px'}}></div> {/* Spacer for Delete */}
                                  </div>
                                  {teamPlayers.map((player, index) => {
                                      const availablePlayers = allPlayers.filter(p => 
                                          !usedPlayerNames.has(p.toLowerCase()) || p.toLowerCase() === player.name.trim().toLowerCase()
                                      );

                                      return (
                                        <div key={`mine-${index}`} style={styles.playerInputContainer}>
                                            <div style={styles.playerInputRow}>
                                                <button type="button" onClick={() => handleTogglePlayerStatus(index)} style={styles.starterToggleButton}>
                                                    <StarterStatusIcon status={player.status} size={14} />
                                                </button>
                                                {/* Jersey Input Removed */}
                                                <div style={{flex: 1, minWidth: '80px'}}>
                                                  <AutocompleteInput 
                                                    placeholder={`Jugador ${index + 1}`} 
                                                    value={player.name} 
                                                    onChange={(value) => handlePlayerInputChange(index, 'name', value)} 
                                                    suggestions={availablePlayers}
                                                  />
                                                </div>
                                                <button type="button" onClick={() => handleTogglePlayerCard(index)} style={styles.cardToggleButton}>
                                                    <CardIcon card={player.card} size={18} />
                                                </button>
                                                <StatStepper 
                                                    value={player.goals} 
                                                    onChange={(val) => handlePlayerInputChange(index, 'goals', val)} 
                                                    activeColor={theme.colors.accent1}
                                                    label={`Goles de ${player.name}`}
                                                    icon="⚽️"
                                                />
                                                <StatStepper 
                                                    value={player.assists} 
                                                    onChange={(val) => handlePlayerInputChange(index, 'assists', val)} 
                                                    activeColor={theme.colors.accent2} 
                                                    label={`Asistencias de ${player.name}`}
                                                    icon="👟"
                                                />
                                                <div style={styles.minutesInputContainer} title={`Minutos de ${player.name || 'jugador'}`}>
                                                    {editingMinuteIndex === index ? (
                                                        <input 
                                                            type="number" 
                                                            min="0" 
                                                            max="120" 
                                                            value={player.minutesPlayed ?? 90} 
                                                            onChange={e => handlePlayerInputChange(index, 'minutesPlayed', e.target.value)} 
                                                            onBlur={() => setEditingMinuteIndex(null)}
                                                            autoFocus
                                                            style={styles.minutesInput} 
                                                            placeholder="Min" 
                                                        />
                                                    ) : (
                                                        <div style={styles.minutesDisplay} onClick={() => setEditingMinuteIndex(index)}>
                                                            {player.minutesPlayed ?? 90}
                                                        </div>
                                                    )}
                                                </div>
                                                <button type="button" onClick={() => handleRemovePlayerInput(index)} style={styles.removeButton} aria-label={`Eliminar jugador ${index + 1}`}>&times;</button>
                                            </div>
                                        </div>
                                      );
                                  })}
                                  <button type="button" onClick={() => handleAddPlayerInput()} style={styles.addPlayerButton}>+ JUGADOR</button>
                              </div>
                          </div>

                           <div style={{marginTop: theme.spacing.large, borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.medium}}>
                                <h5 style={styles.teamLabel}>Incidencias</h5>
                                {editingIncidents.map((incident, index) => (
                                    <div key={index} style={{...styles.playerInputRow, marginBottom: theme.spacing.small, alignItems: 'flex-start'}}>
                                        <div style={{flex: 1, display: 'flex', gap: theme.spacing.small, flexDirection: 'column'}}>
                                            <div style={{display: 'flex', gap: theme.spacing.small}}>
                                                <select
                                                    value={incident.type}
                                                    onChange={(e) => handleIncidentChange(index, 'type', e.target.value)}
                                                    style={{...styles.minutesInput, width: 'auto', flex: 1, padding: '0.3rem', fontSize: '0.8rem', border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium}}
                                                >
                                                    <option value="substitution">Cambio 🔄</option>
                                                    <option value="penal_errado">Penal Errado</option>
                                                    <option value="penal_atajado">Penal Atajado</option>
                                                </select>
                                                {incident.type === 'substitution' && (
                                                    <div style={{...styles.minutesInputContainer, width: '40px'}} title="Minuto del cambio">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="120"
                                                            value={incident.minute || ''}
                                                            onChange={(e) => handleIncidentChange(index, 'minute', parseInt(e.target.value) || 0)}
                                                            style={styles.minutesInput}
                                                            placeholder="Min"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {incident.type === 'substitution' ? (
                                                <div style={{display: 'flex', gap: theme.spacing.small, alignItems: 'center'}}>
                                                    <div style={{flex: 1, position: 'relative', minWidth: 0}}>
                                                        <span style={{position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: theme.colors.loss}}>⬇️</span>
                                                        <div style={{paddingLeft: '20px'}}>
                                                            <AutocompleteInput
                                                                placeholder="Sale"
                                                                value={incident.playerName}
                                                                onChange={(value) => handleIncidentChange(index, 'playerName', value)}
                                                                suggestions={allPlayers}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div style={{flex: 1, position: 'relative', minWidth: 0}}>
                                                        <span style={{position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: theme.colors.win}}>⬆️</span>
                                                         <div style={{paddingLeft: '20px'}}>
                                                            <AutocompleteInput
                                                                placeholder="Entra"
                                                                value={incident.playerIn || ''}
                                                                onChange={(value) => handleIncidentChange(index, 'playerIn', value)}
                                                                suggestions={allPlayers}
                                                            />
                                                         </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <AutocompleteInput
                                                    placeholder="Jugador"
                                                    value={incident.playerName}
                                                    onChange={(value) => handleIncidentChange(index, 'playerName', value)}
                                                    suggestions={allPlayers}
                                                />
                                            )}
                                        </div>
                                        <button type="button" onClick={() => handleRemoveIncident(index)} style={{...styles.removeButton, marginTop: '8px'}}>&times;</button>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddIncident} style={styles.addPlayerButton}>+ INCIDENCIA</button>
                           </div>

                          <div style={{display: 'flex', justifyContent: 'flex-end', gap: theme.spacing.medium, marginTop: theme.spacing.large}}>
                              <button type="button" onClick={handleCancelEditPlayers} style={{...styles.actionButton, ...styles.editButton}}>Cancelar</button>
                              <button type="submit" style={{...styles.actionButton, border: `1px solid ${theme.colors.win}`, color: theme.colors.win}}>Guardar</button>
                          </div>
                      </form>
                  )}
              </div>
            )}
            
             <div style={styles.actionsContainer}>
                {!isReadOnly && canEdit && (
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