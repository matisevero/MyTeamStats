
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Match, PlayerPerformance, Incident, TournamentSettings, PlayerProfileData } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { TeamIcon } from './icons/TeamIcon';
import AutocompleteInput from './AutocompleteInput';
import { ChevronIcon } from './icons/ChevronIcon';
import { StarterStatusIcon } from './icons/StarterStatusIcon';
import { CardIcon } from './icons/CardIcon';
import { StatStepper } from './StatStepper';

interface MatchFormProps {
  onAddMatch: (match: Omit<Match, 'id' | 'result' | 'myGoals' | 'myAssists' | 'goalDifference'>) => void;
  onUpdateMatch: (match: Match) => void;
  onCancelEdit: () => void;
  matchToEdit: Match | null;
  allPlayers: string[];
  allTournaments: string[];
  tournamentSettings: Record<string, TournamentSettings>;
  playerProfiles: Record<string, PlayerProfileData>;
  allMyTeamNames: string[];
  allOpponentNames: string[];
}

const MatchForm: React.FC<MatchFormProps> = ({ onAddMatch, onUpdateMatch, onCancelEdit, matchToEdit, allPlayers, allTournaments, tournamentSettings, playerProfiles, allMyTeamNames, allOpponentNames }) => {
  const { theme } = useTheme();
  const [teamName, setTeamName] = useState('Mi Equipo');
  const [opponentName, setOpponentName] = useState('Rival');
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tournament, setTournament] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [players, setPlayers] = useState<PlayerPerformance[]>([]);
  const [incidents, setIncidents] = useState<Omit<Incident, 'id'>[]>([]);
  const [isLineupsExpanded, setIsLineupsExpanded] = useState(false);
  const [editingMinuteIndex, setEditingMinuteIndex] = useState<number | null>(null);

  const isEditMode = !!matchToEdit;

  useEffect(() => {
    if (matchToEdit) {
      setTeamName(matchToEdit.teamName || 'Mi Equipo');
      setOpponentName(matchToEdit.opponentName || 'Rival');
      setTeamScore(matchToEdit.teamScore);
      setOpponentScore(matchToEdit.opponentScore);
      setDate(matchToEdit.date);
      setTournament(matchToEdit.tournament || '');
      setNotes(matchToEdit.notes || '');
      setShowNotes(!!matchToEdit.notes);
      setPlayers(matchToEdit.players || []);
      setIncidents(matchToEdit.incidents || []);
      setIsLineupsExpanded(!!(matchToEdit.players?.length || matchToEdit.teamName !== 'Mi Equipo'));
    } else {
        resetForm();
    }
  }, [matchToEdit]);
  
  // Auto-calculate minutes based on substitutions
  useEffect(() => {
      if (incidents.length > 0) {
          const matchDuration = (tournament && tournamentSettings[tournament]?.matchDuration) || 90;
          
          setPlayers(currentPlayers => {
              let updatedPlayers = [...currentPlayers];
              let changed = false;

              incidents.forEach(inc => {
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
  }, [incidents, tournament, tournamentSettings]);

  const resetForm = () => {
    setTeamName('Mi Equipo');
    setOpponentName('Rival');
    setTeamScore(0);
    setOpponentScore(0);
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setTournament('');
    setShowNotes(false);
    setPlayers([]);
    setIncidents([]);
    setIsLineupsExpanded(false);
    setEditingMinuteIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalPlayers = players.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);
    const finalIncidents = incidents.map(i => ({ ...i, playerName: i.playerName.trim(), playerIn: i.playerIn?.trim() })).filter(i => i.playerName);

    const matchData = {
      teamName,
      opponentName,
      teamScore,
      opponentScore,
      date,
      tournament,
      notes,
      players: finalPlayers,
      incidents: finalIncidents.map(i => ({...i, id: Date.now().toString() + Math.random() })),
    };

    if (isEditMode && matchToEdit) {
      onUpdateMatch({
        ...matchToEdit,
        ...matchData
      });
    } else {
       onAddMatch(matchData);
      resetForm();
    }
  };

  const handleCancel = () => {
    onCancelEdit();
    resetForm();
  };

  const handleResultSelect = (result: 'VICTORIA' | 'EMPATE' | 'DERROTA') => {
    switch (result) {
      case 'VICTORIA':
        setTeamScore(1);
        setOpponentScore(0);
        break;
      case 'EMPATE':
        setTeamScore(0);
        setOpponentScore(0);
        break;
      case 'DERROTA':
        setTeamScore(0);
        setOpponentScore(1);
        break;
    }
  };

  const currentResult = useMemo(() => {
    if (teamScore > opponentScore) return 'VICTORIA';
    if (teamScore < opponentScore) return 'DERROTA';
    return 'EMPATE';
  }, [teamScore, opponentScore]);
  
  const handlePlayerInputChange = (index: number, field: 'name' | 'goals' | 'assists' | 'minutesPlayed', value: string | number) => {
    setPlayers(currentPlayers => {
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
    setPlayers(currentPlayers => {
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
    setPlayers(currentPlayers => {
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
    const selectedTournamentSettings = tournament ? tournamentSettings[tournament] : undefined;
    const playersPerSide = selectedTournamentSettings?.playersPerSide;
    
    let newStatus: PlayerPerformance['status'] = 'starter';
    if (playersPerSide && players.length >= playersPerSide) {
        newStatus = 'substitute';
    }

    const newMinutes = selectedTournamentSettings?.matchDuration ?? 90;

    setPlayers(currentPlayers => [...currentPlayers, { name: '', goals: 0, assists: 0, minutesPlayed: newMinutes, status: newStatus }]);
  };

  const handleRemovePlayerInput = (index: number) => {
    setPlayers(currentPlayers => currentPlayers.filter((_, i) => i !== index));
  }
  
  const handleAddIncident = () => {
    setIncidents(prev => [...prev, { type: 'substitution', playerName: '', playerIn: '', minute: 0 }]);
  };

  const handleRemoveIncident = (index: number) => {
    setIncidents(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleIncidentChange = (index: number, field: 'type' | 'playerName' | 'playerIn' | 'minute', value: string | number) => {
    setIncidents(prev => {
        const newIncidents = [...prev];
        newIncidents[index] = { ...newIncidents[index], [field]: value };
        return newIncidents;
    });
  };

  const usedPlayerNames = useMemo(() => {
      return new Set(players.map(p => p.name.trim().toLowerCase()).filter(n => n));
  }, [players]);

  const styles: { [key: string]: React.CSSProperties } = {
    form: { display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    twoFieldsContainer: { display: 'flex', alignItems: 'flex-end', gap: theme.spacing.medium },
    input: {
      width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, 
      color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium, outline: 'none', 
      transition: 'border-color 0.2s, background-color 0.2s',
    },
    stepper: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium, padding: `0 ${theme.spacing.small}`,
      height: '48px', boxSizing: 'border-box'
    },
    stepperButton: {
      background: 'none', border: 'none', color: theme.colors.primaryText,
      fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer',
      padding: `${theme.spacing.small} ${theme.spacing.medium}`,
      lineHeight: 1,
    },
    stepperValue: {
      fontSize: '1.25rem', fontWeight: 600, color: theme.colors.primaryText,
      minWidth: '30px', textAlign: 'center'
    },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small, flex: 1, minWidth: 0 },
    label: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText, fontWeight: 500, paddingLeft: '0.25rem', },
    textarea: { resize: 'vertical', minHeight: '80px', fontFamily: theme.typography.fontFamily },
    toggleNotesButton: {
      background: 'none', border: `1px dashed ${theme.colors.borderStrong}`, color: theme.colors.secondaryText,
      padding: theme.spacing.small, fontSize: theme.typography.fontSize.small,
      borderRadius: theme.borderRadius.medium, cursor: 'pointer', textAlign: 'center',
      transition: 'background-color 0.2s, color 0.2s', width: '100%',
      height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    buttonGroup: { display: 'flex', gap: theme.spacing.medium, marginTop: theme.spacing.small },
    button: {
      flex: 1, padding: `${theme.spacing.medium} ${theme.spacing.large}`, backgroundColor: theme.colors.accent1,
      color: theme.colors.textOnAccent, border: 'none', borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
      fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s, transform 0.1s ease',
      boxShadow: theme.shadows.small,
    },
    buttonPressed: { transform: 'scale(0.98)', boxShadow: 'none' },
    cancelButton: { backgroundColor: theme.colors.borderStrong, color: theme.colors.primaryText },
    resultButtonGroup: {
        display: 'flex',
        width: '100%',
    },
    resultButton: {
      flex: 1,
      backgroundColor: 'transparent',
      border: `1px solid ${theme.name === 'dark' ? '#131828' : '#c7ced8'}`,
      color: theme.colors.secondaryText,
      padding: theme.spacing.medium,
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: '0.8rem',
      transition: 'all 0.2s',
    },
    firstResultButton: {
        borderRadius: `${theme.borderRadius.medium} 0 0 ${theme.borderRadius.medium}`,
        borderRight: 'none',
    },
    middleResultButton: {
        borderRadius: 0,
    },
    lastResultButton: {
        borderRadius: `0 ${theme.borderRadius.medium} ${theme.borderRadius.medium} 0`,
        borderLeft: 'none',
    },
    activeVictory: {
        backgroundColor: theme.colors.win,
        color: theme.colors.textOnAccent,
        borderColor: theme.colors.win,
    },
    activeDraw: {
        backgroundColor: theme.colors.draw,
        color: theme.colors.textOnAccent,
        borderColor: theme.colors.draw,
    },
    activeDefeat: {
        backgroundColor: theme.colors.loss,
        color: theme.colors.textOnAccent,
        borderColor: theme.colors.loss,
    },
    lineupsContainer: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.small, // Reduced padding for mobile
        borderRadius: theme.borderRadius.medium,
        border: `1px solid ${theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.large,
    },
    playersGrid: { 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: theme.spacing.large,
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
    removePlayerButton: {
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
  };
  
  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Fecha</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} required />
      </div>

      <div style={styles.fieldGroup}>
          <label style={styles.label}>Resultado Rápido</label>
          <div style={styles.resultButtonGroup}>
              <button
                  type="button"
                  onClick={() => handleResultSelect('VICTORIA')}
                  style={{
                      ...styles.resultButton,
                      ...styles.firstResultButton,
                      ...(currentResult === 'VICTORIA' ? styles.activeVictory : {})
                  }}
              >
                  V
              </button>
              <button
                  type="button"
                  onClick={() => handleResultSelect('EMPATE')}
                  style={{
                      ...styles.resultButton,
                      ...styles.middleResultButton,
                      ...(currentResult === 'EMPATE' ? styles.activeDraw : {})
                  }}
              >
                  E
              </button>
              <button
                  type="button"
                  onClick={() => handleResultSelect('DERROTA')}
                  style={{
                      ...styles.resultButton,
                      ...styles.lastResultButton,
                      ...(currentResult === 'DERROTA' ? styles.activeDefeat : {})
                  }}
              >
                  D
              </button>
          </div>
      </div>

      <div style={styles.twoFieldsContainer}>
         <div style={styles.fieldGroup}>
           <label style={styles.label}>{teamName || 'Marcador Equipo'}</label>
           <div style={styles.stepper}>
             <button type="button" onClick={() => setTeamScore(s => Math.max(0, s - 1))} style={styles.stepperButton} aria-label="Reducir marcador equipo">-</button>
             <span style={styles.stepperValue}>{teamScore}</span>
             <button type="button" onClick={() => setTeamScore(s => s + 1)} style={styles.stepperButton} aria-label="Aumentar marcador equipo">+</button>
           </div>
        </div>
        <div style={styles.fieldGroup}>
           <label style={styles.label}>{opponentName || 'Marcador Rival'}</label>
           <div style={styles.stepper}>
             <button type="button" onClick={() => setOpponentScore(s => Math.max(0, s - 1))} style={styles.stepperButton} aria-label="Reducir marcador rival">-</button>
             <span style={styles.stepperValue}>{opponentScore}</span>
             <button type="button" onClick={() => setOpponentScore(s => s + 1)} style={styles.stepperButton} aria-label="Aumentar marcador rival">+</button>
           </div>
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <button type="button" onClick={() => setIsLineupsExpanded(!isLineupsExpanded)} style={{...styles.toggleNotesButton, justifyContent: 'space-between', gap: theme.spacing.small}}>
            <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.small}}><TeamIcon /> Alineaciones y Equipos</span>
            <ChevronIcon isExpanded={isLineupsExpanded} />
        </button>
      </div>

      {isLineupsExpanded && (
        <div style={{...styles.lineupsContainer, animation: 'fadeIn 0.5s ease-in-out'}}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Torneo (Opcional)</label>
            <AutocompleteInput 
              value={tournament} 
              onChange={setTournament} 
              suggestions={allTournaments}
              placeholder="Nombre del Torneo"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium, marginBottom: theme.spacing.medium }}>
            <div style={styles.fieldGroup}>
              <AutocompleteInput value={teamName} onChange={setTeamName} suggestions={allMyTeamNames} placeholder="Mi Equipo"/>
            </div>
            <div style={styles.fieldGroup}>
              <AutocompleteInput value={opponentName} onChange={setOpponentName} suggestions={allOpponentNames} placeholder="Equipo Rival"/>
            </div>
          </div>

          <div style={styles.playersGrid}>
            <div>
                <label style={styles.label}>Mi Equipo</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '2px', marginBottom: theme.spacing.small}}>
                    <span style={{fontSize: '8px', color: theme.colors.secondaryText, width: '20px', textAlign: 'center'}}>Tit</span>
                    <div style={{flex: 1}} /> {/* Spacer for player name */}
                    <span style={{fontSize: '8px', color: theme.colors.secondaryText, width: '24px', textAlign: 'center'}}>Tarj</span>
                    <div style={{width: '34px'}}></div> {/* Spacer for Goals */}
                    <div style={{width: '34px'}}></div> {/* Spacer for Assists */}
                    <span style={{fontSize: '8px', color: theme.colors.secondaryText, width: '28px', textAlign: 'center'}}>Min</span>
                    <div style={{width: '22px'}}></div> {/* Spacer for Delete */}
                </div>
                {players.map((player, index) => {
                    const availablePlayers = allPlayers.filter(p => 
                      !usedPlayerNames.has(p.toLowerCase()) || p.toLowerCase() === player.name.trim().toLowerCase()
                    );

                    return (
                        <div key={`mine-${index}`} style={styles.playerInputContainer}>
                            <div style={styles.playerInputRow}>
                                <button type="button" onClick={() => handleTogglePlayerStatus(index)} style={styles.starterToggleButton} aria-label={`Cambiar estado de titular para ${player.name}`}>
                                    <StarterStatusIcon status={player.status} size={14} />
                                </button>
                                {/* Jersey input removed */}
                                <div style={{flex: 1, minWidth: '80px'}}>
                                  <AutocompleteInput 
                                    placeholder={`Jugador ${index + 1}`} 
                                    value={player.name} 
                                    onChange={(value) => handlePlayerInputChange(index, 'name', value)} 
                                    suggestions={availablePlayers}
                                  />
                                </div>
                                <button type="button" onClick={() => handleTogglePlayerCard(index)} style={styles.cardToggleButton} aria-label={`Añadir/cambiar tarjeta para ${player.name}`}>
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
                                <button type="button" onClick={() => handleRemovePlayerInput(index)} style={styles.removePlayerButton} aria-label={`Eliminar jugador ${index + 1}`}>&times;</button>
                            </div>
                        </div>
                    );
                })}
                <button type="button" onClick={handleAddPlayerInput} style={styles.addPlayerButton}>+ JUGADOR</button>
            </div>
          </div>
           <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.large, marginTop: theme.spacing.large }}>
              <label style={styles.label}>Incidencias del Partido</label>
               {incidents.map((incident, index) => (
                    <div key={index} style={{...styles.playerInputRow, marginBottom: theme.spacing.small, alignItems: 'flex-start'}}>
                        <div style={{flex: 1, display: 'flex', gap: theme.spacing.small, flexDirection: 'column'}}>
                            <div style={{display: 'flex', gap: theme.spacing.small}}>
                                <select
                                    value={incident.type}
                                    onChange={(e) => handleIncidentChange(index, 'type', e.target.value)}
                                    style={{...styles.input, flex: 1, padding: theme.spacing.small, fontSize: '0.8rem', minWidth: 0}}
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
                        <button type="button" onClick={() => handleRemoveIncident(index)} style={{...styles.removePlayerButton, marginTop: '8px'}} aria-label={`Eliminar incidencia ${index + 1}`}>&times;</button>
                    </div>
                ))}
              <button type="button" onClick={handleAddIncident} style={styles.addPlayerButton}>+ INCIDENCIA</button>
           </div>
        </div>
      )}

      {!showNotes && (
        <div style={styles.fieldGroup}>
          <button type="button" onClick={() => setShowNotes(true)} style={styles.toggleNotesButton}>
            + Añadir notas
          </button>
        </div>
      )}

      {showNotes && (
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Notas del partido (Opcional)</label>
          <textarea placeholder="Ej: Jugadores clave, momentos emocionantes..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{...styles.input, ...styles.textarea}} rows={3} />
        </div>
      )}

      <div style={styles.buttonGroup}>
        {isEditMode && (
           <button type="button" onClick={handleCancel} style={{...styles.button, ...styles.cancelButton}}>
              Cancelar
           </button>
        )}
        <button 
            type="submit" 
            style={isPressed ? {...styles.button, ...styles.buttonPressed} : styles.button}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
        >
          {isEditMode ? 'Actualizar partido' : 'Añadir partido'}
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </form>
  );
};

export default MatchForm;
