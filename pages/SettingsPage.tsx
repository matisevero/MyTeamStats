import React, { useRef, useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import pako from 'pako';
import { StarIcon } from '../components/icons/StarIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { TeamIcon } from '../components/icons/TeamIcon';
import SettingsSection from '../components/common/SettingsSection';
import { UserPlusIcon } from '../components/icons/UserPlusIcon';
import { ShareIcon } from '../components/icons/ShareIcon';
import { AlertTriangleIcon } from '../components/icons/AlertTriangleIcon';

declare global {
  interface AIStudio {
    getAppUrl?: () => Promise<string>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

// Helper to convert Uint8Array to a Base64 string
function uint8ArrayToBase64(uint8array: Uint8Array): string {
    let binary = '';
    const len = uint8array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8array[i]);
    }
    return btoa(binary);
}

const TeamEditModal: React.FC<{
    teamName: string;
    onClose: () => void;
    onSave: (newName: string, shieldUrl: string) => void;
    initialShieldUrl: string;
}> = ({ teamName, onClose, onSave, initialShieldUrl }) => {
    const { theme } = useTheme();
    const [name, setName] = useState(teamName);
    const [shieldUrl, setShieldUrl] = useState(initialShieldUrl);
    
    const styles = {
        backdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        modal: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, width: '90%', maxWidth: '400px', boxShadow: theme.shadows.large, border: `1px solid ${theme.colors.border}`},
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderBottom: `1px solid ${theme.colors.border}` },
        title: { margin: 0, fontSize: theme.typography.fontSize.large, fontWeight: 700 },
        content: { padding: theme.spacing.large, display: 'flex', flexDirection: 'column' as 'column', gap: theme.spacing.medium },
        input: { width: '100%', padding: theme.spacing.medium, backgroundColor: theme.colors.background, border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium },
        button: { padding: theme.spacing.medium, border: 'none', borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer', backgroundColor: theme.colors.accent1, color: theme.colors.textOnAccent },
    };

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Editar Equipo</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><CloseIcon color={theme.colors.primaryText} /></button>
                </div>
                <div style={styles.content}>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} style={styles.input} placeholder="Nombre del equipo" />
                    <input type="text" value={shieldUrl} onChange={e => setShieldUrl(e.target.value)} style={styles.input} placeholder="URL del escudo" />
                    <button onClick={() => onSave(name, shieldUrl)} style={styles.button}>Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

const SettingsPage: React.FC = () => {
  const { theme } = useTheme();
  const { 
      matches, aiInteractions,
      setMatches, setAiInteractions, 
      setCurrentPage,
      mainTeamName, setMainTeamName,
      teamProfiles, updateTeamProfile
  } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [copyStatus, setCopyStatus] = useState('Generar enlace para compartir');
  const [inviteStatus, setInviteStatus] = useState('Copiar enlace de invitación');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);

  const myTeams = useMemo(() => {
    const teams = new Set<string>();
    matches.forEach(m => {
        if (m.teamName) teams.add(m.teamName);
    });
    return Array.from(teams).sort();
  }, [matches]);

  const handleExportJSON = () => {
    const dataToExport = { matches, aiInteractions, teamProfiles, mainTeamName };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myteamstats-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const matchesToCsv = () => {
    const header = ['match_id', 'date', 'tournament', 'my_team', 'opponent_team', 'my_team_score', 'opponent_team_score', 'result', 'player_name', 'goals', 'assists', 'minutes_played', 'status'];
    const rows = matches.flatMap(match => 
        match.players.map(player => [
            match.id,
            match.date,
            match.tournament || '',
            match.teamName,
            match.opponentName,
            match.teamScore,
            match.opponentScore,
            match.result,
            player.name,
            player.goals,
            player.assists,
            player.minutesPlayed || 0,
            player.status
        ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    );
    return [header.join(','), ...rows].join('\n');
  };

  const handleExportCSV = () => {
      const csvContent = matchesToCsv();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'myteamstats-matches.csv';
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImportClick = (type: 'json' | 'csv') => {
      if (type === 'json') fileInputRef.current?.click();
      else csvInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'json' | 'csv') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (window.confirm("¡ADVERTENCIA! Esto reemplazará todos los datos de partidos existentes. ¿Estás seguro?")) {
            if (type === 'json') {
                const importedData = JSON.parse(text);
                setMatches(importedData.matches || []);
                if(importedData.aiInteractions) setAiInteractions(importedData.aiInteractions);
            } else { // CSV
                const lines = text.split(/\r?\n/);
                const header = lines[0].split(',').map(h => h.replace(/"/g, ''));
                const matchMap: Record<string, any> = {};

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i]) continue;
                    const data = lines[i].split(',').map(d => d.replace(/"/g, ''));
                    const row: any = {};
                    header.forEach((h, index) => row[h] = data[index]);
                    
                    if (!matchMap[row.match_id]) {
                        matchMap[row.match_id] = {
                            id: row.match_id, date: row.date, tournament: row.tournament,
                            teamName: row.my_team, opponentName: row.opponent_team,
                            teamScore: parseInt(row.my_team_score), opponentScore: parseInt(row.opponent_team_score),
                            result: row.result, players: []
                        };
                    }
                    matchMap[row.match_id].players.push({
                        name: row.player_name, goals: parseInt(row.goals), assists: parseInt(row.assists),
                        minutesPlayed: parseInt(row.minutes_played), status: row.status,
                    });
                }
                
                const importedMatches = Object.values(matchMap);
                setMatches(importedMatches as any);
            }
            alert("¡Datos importados con éxito!");
            setCurrentPage('recorder');
        }
      } catch (error) {
        alert(`Error al importar: ${error instanceof Error ? error.message : 'Error desconocido.'}`);
      } finally {
        if(fileInputRef.current) fileInputRef.current.value = '';
        if(csvInputRef.current) csvInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };
  
  const handleCopyShareableLink = async () => {
    setCopyStatus('Generando...');
    try {
      const allData = { matches, aiInteractions, teamProfiles, mainTeamName };
      const jsonString = JSON.stringify(allData);
      const compressed = pako.deflate(jsonString);
      const base64Data = uint8ArrayToBase64(compressed);

      let appUrl = '';
      if (window.aistudio && typeof window.aistudio.getAppUrl === 'function') {
        try { appUrl = await window.aistudio.getAppUrl(); } 
        catch (apiError) { console.error('window.aistudio.getAppUrl() failed:', apiError); }
      }
      if (!appUrl) {
        appUrl = 'https://myteamstats-gestor-de-equipos-116892541314.us-west1.run.app';
      }

      const shareUrl = new URL(appUrl);
      shareUrl.searchParams.set('data', base64Data);
  
      await navigator.clipboard.writeText(shareUrl.toString());
      setCopyStatus('¡Enlace copiado!');
    } catch (err) {
      console.error('Failed to create shareable link:', err);
      setCopyStatus('Error al generar');
    } finally {
      setTimeout(() => setCopyStatus('Generar enlace para compartir'), 2000);
    }
  };

  const handleCopyInviteLink = async () => {
    setInviteStatus('Copiando...');
    try {
        let appUrl = '';
        if (window.aistudio && typeof window.aistudio.getAppUrl === 'function') {
            try { appUrl = await window.aistudio.getAppUrl(); } 
            catch (apiError) { console.error('window.aistudio.getAppUrl() failed:', apiError); }
        }
        if (!appUrl) {
            appUrl = 'https://myteamstats-gestor-de-equipos-116892541314.us-west1.run.app';
        }
        await navigator.clipboard.writeText(appUrl);
        setInviteStatus('¡Enlace copiado!');
    } catch (err) {
        console.error('Failed to copy invite link:', err);
        setInviteStatus('Error al copiar');
    } finally {
        setTimeout(() => setInviteStatus('Copiar enlace de invitación'), 2000);
    }
  };

  const handleResetData = () => {
    if (window.confirm("¿ESTÁS SEGURO? Esta acción borrará TODOS tus datos (partidos, interacciones IA, etc.) de forma permanente y no se puede deshacer.")) {
        setMatches([]);
        setAiInteractions([]);
        window.localStorage.removeItem('myTeamStats-matches');
        window.localStorage.removeItem('myTeamStats-aiInteractions');
        window.localStorage.removeItem('myTeamStats-goals');
        window.localStorage.removeItem('myTeamStats-customAchievements');
        window.localStorage.removeItem('myTeamStats-mainPlayer');
        window.localStorage.removeItem('myTeamStats-tournamentStyles');
        window.localStorage.removeItem('myTeamStats-playerProfiles');
        window.localStorage.removeItem('myTeamStats-onboardingComplete');
        window.localStorage.removeItem('myTeamStats-mainTeamName');
        window.localStorage.removeItem('myTeamStats-teamProfiles');
        window.location.reload();
    }
  };
  
  const handleSaveTeam = (originalName: string, newName: string, shieldUrl: string) => {
    updateTeamProfile(originalName, newName, { shieldUrl });
    setEditingTeam(null);
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '800px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.large },
    pageTitle: {
      fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText,
      margin: 0, borderLeft: `4px solid ${theme.colors.accent2}`, paddingLeft: theme.spacing.medium,
    },
    cardContent: { display: 'flex', flexDirection: 'column', gap: theme.spacing.medium },
    description: { color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, lineHeight: 1.6, margin: `0 0 ${theme.spacing.small} 0` },
    button: {
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium, fontSize: theme.typography.fontSize.medium,
      fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', display: 'flex',
      alignItems: 'center', justifyContent: 'center', gap: theme.spacing.medium,
      background: theme.colors.surface,
      color: theme.colors.primaryText,
    },
    resetButton: { backgroundColor: `${theme.colors.loss}e0`, color: theme.colors.textOnAccent, border: 'none' },
    teamList: { display: 'flex', flexDirection: 'column', gap: theme.spacing.small },
    teamItem: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium, padding: theme.spacing.small, borderRadius: theme.borderRadius.medium, backgroundColor: theme.colors.background },
    teamShield: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', backgroundColor: theme.colors.border },
    teamName: { flex: 1, fontWeight: 600 },
    iconButton: { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondaryText },
    dataButtonsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.medium },
  };

  return (
    <main style={styles.container}>
      {editingTeam && (
          <TeamEditModal 
              teamName={editingTeam}
              initialShieldUrl={teamProfiles[editingTeam]?.shieldUrl || ''}
              onClose={() => setEditingTeam(null)}
              onSave={(newName, shieldUrl) => handleSaveTeam(editingTeam, newName, shieldUrl)}
          />
      )}
      <h2 style={styles.pageTitle}>Ajustes</h2>
      
      <SettingsSection title={<><TeamIcon /> Mis Equipos</>} defaultOpen={true}>
          <div style={styles.cardContent}>
              <p style={styles.description}>
                  Gestiona tus equipos. Haz clic en la estrella ★ para seleccionar tu equipo principal.
              </p>
              <div style={styles.teamList}>
                  {myTeams.map(team => (
                      <div key={team} style={styles.teamItem}>
                          <button onClick={() => setMainTeamName(team)} style={styles.iconButton} aria-label={`Marcar ${team} como principal`}>
                              <StarIcon color={team === mainTeamName ? theme.colors.accent3 : theme.colors.secondaryText} isFilled={team === mainTeamName}/>
                          </button>
                          {teamProfiles[team]?.shieldUrl ? (
                              <img src={teamProfiles[team]?.shieldUrl} alt={`Escudo de ${team}`} style={styles.teamShield} />
                          ) : (
                              <div style={{...styles.teamShield, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><TeamIcon /></div>
                          )}
                          <span style={styles.teamName}>{team}</span>
                          <button onClick={() => setEditingTeam(team)} style={styles.iconButton} aria-label={`Editar ${team}`}>
                              <PencilIcon color={theme.colors.secondaryText} />
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      </SettingsSection>
      
      <SettingsSection title={<><UserPlusIcon /> Invitar a Amigos</>}>
        <div style={styles.cardContent}>
            <p style={styles.description}>
                Comparte esta aplicación con tus amigos para que puedan gestionar sus propios equipos.
            </p>
            <button onClick={handleCopyInviteLink} style={{...styles.button, backgroundColor: theme.colors.accent2, color: theme.colors.textOnAccent, border: 'none' }}>
                <ShareIcon /> {inviteStatus}
            </button>
        </div>
      </SettingsSection>

      <SettingsSection title={<><ShareIcon /> Gestión de Datos</>}>
        <div style={styles.cardContent}>
            <p style={styles.description}>
                Genera un enlace para compartir una vista de solo lectura de tus datos.
            </p>
            <button onClick={handleCopyShareableLink} style={{...styles.button, backgroundColor: theme.colors.accent2, color: theme.colors.textOnAccent, border: 'none' }}>
                <ShareIcon /> {copyStatus}
            </button>
            <hr style={{width: '100%', border: 'none', borderTop: `1px solid ${theme.colors.border}`, margin: `${theme.spacing.large} 0`}}/>
            <p style={styles.description}>
                Exporta o importa todos los datos de tu aplicación. CSV es ideal para hojas de cálculo.
            </p>
            <div style={styles.dataButtonsGrid}>
                <button onClick={() => handleExportJSON()} style={styles.button}>Exportar JSON</button>
                <button onClick={() => handleImportClick('json')} style={styles.button}>Importar JSON</button>
                <button onClick={handleExportCSV} style={styles.button}>Exportar CSV</button>
                <button onClick={() => handleImportClick('csv')} style={styles.button}>Importar CSV</button>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'json')} accept=".json" style={{ display: 'none' }} />
            <input type="file" ref={csvInputRef} onChange={(e) => handleFileChange(e, 'csv')} accept=".csv" style={{ display: 'none' }} />
        </div>
      </SettingsSection>

       <SettingsSection title={<><AlertTriangleIcon color={theme.colors.loss} /> Zona de Peligro</>}>
        <div style={styles.cardContent}>
            <p style={styles.description}>
                Borra todos los datos de la aplicación y comienza desde cero. Esta acción no se puede deshacer.
            </p>
            <button onClick={handleResetData} style={{...styles.button, ...styles.resetButton}}>
                Restablecer todos los datos
            </button>
        </div>
      </SettingsSection>

      <div style={{ textAlign: 'center', color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, marginTop: theme.spacing.large }}>
        Versión 2.1.0
      </div>
    </main>
  );
};

export default SettingsPage;
