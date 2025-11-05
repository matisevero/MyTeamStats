import React, { useState, useEffect, useMemo } from 'react';
import type { Match, PlayerPerformance } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { TeamIcon } from './icons/TeamIcon';
import AutocompleteInput from './AutocompleteInput';
import { ChevronIcon } from './icons/ChevronIcon';
import { StarterStatusIcon } from './icons/StarterStatusIcon';

interface MatchFormProps {
  onAddMatch: (match: Omit<Match, 'id' | 'result' | 'myGoals' | 'myAssists' | 'goalDifference'>) => void;
  onUpdateMatch: (match: Match) => void;
  onCancelEdit: () => void;
  matchToEdit: Match | null;
  allPlayers: string[];
  allTournaments: string[];
  allMyTeamNames: string[];
  allOpponentNames: string[];
}

const MatchForm: React.FC<MatchFormProps> = ({ onAddMatch, onUpdateMatch, onCancelEdit, matchToEdit, allPlayers, allTournaments, allMyTeamNames, allOpponentNames }) => {
  const { theme } = useTheme();
  const [teamName, setTeamName] = useState('Mi Equipo');
  const [opponentName, setOpponentName] = useState('Rival');
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [players, setPlayers] = useState<PlayerPerformance[]>([]);
  const [isLineupsExpanded, setIsLineupsExpanded] = useState(false);

  const isEditMode = !!matchToEdit;

  useEffect(() => {
    if (matchToEdit) {
      setTeamName(matchToEdit.teamName || 'Mi Equipo');
      setOpponentName(matchToEdit.opponentName || 'Rival');
      setTeamScore(matchToEdit.teamScore);
      setOpponentScore(matchToEdit.opponentScore);
      setDate(matchToEdit.date);
      setNotes(matchToEdit.notes || '');
      setShowNotes(!!matchToEdit.notes);
      setPlayers(matchToEdit.players || []);
      setIsLineupsExpanded(!!(matchToEdit.players?.length || matchToEdit.teamName !== 'Mi Equipo'));
    } else {
        resetForm();
    }
  }, [matchToEdit]);
  
  const resetForm = () => {
    setTeamName('Mi Equipo');
    setOpponentName('Rival');
    setTeamScore(0);
    setOpponentScore(0);
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowNotes(false);
    setPlayers([]);
    setIsLineupsExpanded(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalPlayers = players.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name);

    const matchData = {
      teamName,
      opponentName,
      teamScore,
      opponentScore,
      date,
      tournament: isEditMode ? matchToEdit.tournament : '',
      notes,
      players: finalPlayers,
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

  const handleAddPlayerInput = () => {
    setPlayers(currentPlayers => [...currentPlayers, { name: '', goals: 0, assists: 0, minutesPlayed: 90, status: 'starter' }]);
  };

  const handleRemovePlayerInput = (index: number) => {
    setPlayers(currentPlayers => currentPlayers.filter((_, i) => i !== index));
  }
  
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
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small, flex: 1, },
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
        padding: theme.spacing.medium,
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
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        lineHeight: 1,
        flexShrink: 0,
    },
    starterToggleButton: {
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
    }
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
                {players.map((player, index) => (
                    <div key={`mine-${index}`} style={styles.playerInputContainer}>
                        <div style={styles.playerInputRow}>
                            <button type="button" onClick={() => handleTogglePlayerStatus(index)} style={styles.starterToggleButton} aria-label={`Cambiar estado de titular para ${player.name}`}>
                                <StarterStatusIcon status={player.status} />
                            </button>
                            <div style={{flex: 1}}><AutocompleteInput placeholder={`Jugador ${index + 1}`} value={player.name} onChange={(value) => handlePlayerInputChange(index, 'name', value)} suggestions={allPlayers}/></div>
                            <input type="number" min="0" value={player.goals} onChange={e => handlePlayerInputChange(index, 'goals', e.target.value)} style={styles.statInput} aria-label={`Goles de ${player.name || 'compañero'}`} />
                            <input type="number" min="0" value={player.assists} onChange={e => handlePlayerInputChange(index, 'assists', e.target.value)} style={styles.statInput} aria-label={`Asistencias de ${player.name || 'compañero'}`} />
                            <input type="number" min="0" max="120" value={player.minutesPlayed ?? 90} onChange={e => handlePlayerInputChange(index, 'minutesPlayed', e.target.value)} style={styles.statInput} aria-label={`Minutos de ${player.name || 'compañero'}`} placeholder="Min" />
                            <button type="button" onClick={() => handleRemovePlayerInput(index)} style={styles.removePlayerButton} aria-label={`Eliminar jugador ${index + 1}`}>&times;</button>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={handleAddPlayerInput} style={styles.addPlayerButton}>+ JUGADOR</button>
            </div>
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