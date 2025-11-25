
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Match, AIInteraction, PlayerPerformance, Goal, CustomAchievement, PlayerProfileData, TeamProfileData, Incident, TournamentSettings } from '../types';
import type { Page } from '../App';
import { initialData } from '../data/initialData';
import { useAuth } from './AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, onSnapshot, collection, addDoc, writeBatch, getDocs } from 'firebase/firestore';

interface DataContextType {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  aiInteractions: AIInteraction[];
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  addMatch: (matchData: Omit<Match, 'id' | 'result' | 'myGoals' | 'myAssists' | 'goalDifference'>) => Match;
  updateMatch: (match: Match) => void;
  deleteMatch: (matchId: string) => void;
  updateMatchDetails: (matchId: string, players: PlayerPerformance[], tournament: string, incidents: Incident[]) => void;
  addAIInteraction: (type: AIInteraction['type'], content: any) => void;
  setAiInteractions: React.Dispatch<React.SetStateAction<AIInteraction[]>>;
  isShareMode: boolean;
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  deleteGoal: (goalId: string) => void;
  customAchievements: CustomAchievement[];
  addCustomAchievement: (achievement: Omit<CustomAchievement, 'id' | 'unlocked'>) => void;
  deleteCustomAchievement: (achievementId: string) => void;
  mainPlayerName: string;
  tournamentSettings: Record<string, TournamentSettings>;
  updateTournamentSettings: (originalName: string, newName: string, settings: Partial<TournamentSettings>) => void;
  deleteTournament: (tournamentName: string) => void;
  playerProfiles: Record<string, PlayerProfileData>;
  updatePlayerProfile: (playerName: string, data: Partial<PlayerProfileData>) => void;
  isOnboardingComplete: boolean;
  completeOnboarding: (teamName: string, startOption: 'fresh' | 'examples') => void;
  mainTeamName: string;
  setMainTeamName: React.Dispatch<React.SetStateAction<string>>;
  teamProfiles: Record<string, TeamProfileData>;
  updateTeamProfile: (originalName: string, newName: string, profileData: Partial<TeamProfileData>) => void;
  viewingPlayerName: string | null;
  setViewingPlayerName: React.Dispatch<React.SetStateAction<string | null>>;
  roster: string[];
  addPlayerToRoster: (playerName: string) => void;
  deletePlayerFromRoster: (playerName: string) => void;
  updatePlayerName: (oldName: string, newName: string) => void;
  allPlayers: string[];
  myTeamPlayers: string[];
  myTeams: string[];
  activeTeams: string[];
  isSyncing: boolean;
  importFromFile: (data: any) => Promise<void>;
  deleteTeam: (teamName: string) => void;
  resetAccount: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const isShareMode = new URLSearchParams(window.location.search).get('share') === 'true';

const processMatch = (matchData: Omit<Match, 'id' | 'result' | 'myGoals' | 'myAssists' | 'goalDifference'> | Match): Omit<Match, 'id'> => {
  const result = matchData.teamScore > matchData.opponentScore ? 'VICTORIA' : matchData.teamScore < matchData.opponentScore ? 'DERROTA' : 'EMPATE';
  const myGoals = matchData.players.reduce((sum, p) => sum + p.goals, 0);
  const myAssists = matchData.players.reduce((sum, p) => sum + p.assists, 0);
  const goalDifference = matchData.teamScore - matchData.opponentScore;

  return {
    ...matchData,
    teamName: matchData.teamName || 'Mi Equipo',
    opponentName: matchData.opponentName || 'Rival',
    result,
    myGoals,
    myAssists,
    goalDifference,
  };
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  // Local Storage State
  const [localMatches, setLocalMatches] = useLocalStorage<Match[]>('myTeamStats-matches', initialData.matches);
  const [localAiInteractions, setLocalAiInteractions] = useLocalStorage<AIInteraction[]>('myTeamStats-aiInteractions', []);
  const [localGoals, setLocalGoals] = useLocalStorage<Goal[]>('myTeamStats-goals', []);
  const [localCustomAchievements, setLocalCustomAchievements] = useLocalStorage<CustomAchievement[]>('myTeamStats-customAchievements', []);
  const [localMainPlayerName, setLocalMainPlayerName] = useLocalStorage<string>('myTeamStats-mainPlayer', 'Yo');
  const [localTournamentSettings, setLocalTournamentSettings] = useLocalStorage<Record<string, TournamentSettings>>('myTeamStats-tournamentSettings', {});
  const [localPlayerProfiles, setLocalPlayerProfiles] = useLocalStorage<Record<string, PlayerProfileData>>('myTeamStats-playerProfiles', {});
  const [localRoster, setLocalRoster] = useLocalStorage<string[]>('myTeamStats-roster', []);
  const [localIsOnboardingComplete, setLocalIsOnboardingComplete] = useLocalStorage<boolean>('myTeamStats-onboardingComplete', false);
  const [localMainTeamName, setLocalMainTeamName] = useLocalStorage<string>('myTeamStats-mainTeamName', 'Mi Equipo');
  const [localTeamProfiles, setLocalTeamProfiles] = useLocalStorage<Record<string, TeamProfileData>>('myTeamStats-teamProfiles', {});

  // Cloud State (In-memory, synced via Firestore listener)
  const [cloudMatches, setCloudMatches] = useState<Match[]>([]);
  const [cloudTeamData, setCloudTeamData] = useState<any>(null); // Holds settings, roster, etc.
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState<Page>(isShareMode ? 'stats' : 'recorder');
  const [viewingPlayerName, setViewingPlayerName] = useState<string | null>(null);

  // Derived State based on Auth
  const matches = currentUser ? cloudMatches : localMatches;
  const aiInteractions = currentUser ? (cloudTeamData?.aiInteractions || []) : localAiInteractions;
  const goals = currentUser ? (cloudTeamData?.goals || []) : localGoals;
  const customAchievements = currentUser ? (cloudTeamData?.customAchievements || []) : localCustomAchievements;
  const mainPlayerName = currentUser ? (cloudTeamData?.mainPlayerName || 'Yo') : localMainPlayerName;
  const tournamentSettings = currentUser ? (cloudTeamData?.tournamentSettings || {}) : localTournamentSettings;
  const playerProfiles = currentUser ? (cloudTeamData?.playerProfiles || {}) : localPlayerProfiles;
  const roster = currentUser ? (cloudTeamData?.roster || []) : localRoster;
  
  const isOnboardingComplete = currentUser 
    ? (cloudTeamData?.onboardingCompleted === true) 
    : localIsOnboardingComplete;

  const mainTeamName = currentUser ? (cloudTeamData?.name || 'Mi Equipo') : localMainTeamName;
  const teamProfiles = currentUser ? (cloudTeamData?.teamProfiles || {}) : localTeamProfiles;

  // 1. User Sync & Active Team Detection
  useEffect(() => {
    if (!currentUser) {
        setActiveTeamId(null);
        return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    const setupUser = async () => {
        setIsSyncing(true);
        try {
            const userSnap = await getDoc(userDocRef);
            
            if (!userSnap.exists()) {
                // New User: Migration Strategy
                const newTeamRef = doc(collection(db, 'teams'));
                
                const hasLocalData = localMatches.length > 0 && localMatches[0].id !== '1'; 
                const migrationOnboardingStatus = hasLocalData ? true : false;

                const initialTeamData = {
                    name: localMainTeamName,
                    ownerId: currentUser.uid,
                    roster: localRoster,
                    goals: localGoals,
                    customAchievements: localCustomAchievements,
                    tournamentSettings: localTournamentSettings,
                    playerProfiles: localPlayerProfiles,
                    aiInteractions: localAiInteractions,
                    mainPlayerName: localMainPlayerName,
                    teamProfiles: localTeamProfiles,
                    createdAt: new Date().toISOString(),
                    onboardingCompleted: migrationOnboardingStatus
                };

                const batch = writeBatch(db);
                batch.set(userDocRef, { 
                    email: currentUser.email, 
                    activeTeamId: newTeamRef.id,
                    teams: [newTeamRef.id] 
                });
                batch.set(newTeamRef, initialTeamData);
                
                localMatches.forEach(match => {
                    const matchRef = doc(collection(db, `teams/${newTeamRef.id}/matches`));
                    batch.set(matchRef, match);
                });

                await batch.commit();
            }
        } catch (error) {
            console.error("Error initializing user/team data:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    setupUser();

    // Listen to User Doc
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            setActiveTeamId(userData.activeTeamId);
        }
    }, (error) => {
        console.error("Error fetching user data (Check Firestore Rules):", error);
    });

    return () => unsubscribeUser();
  }, [currentUser]);

  // 2. Team Data & Matches Sync (Dependent on activeTeamId)
  useEffect(() => {
      if (!activeTeamId) {
          setCloudTeamData(null);
          setCloudMatches([]);
          return;
      }

      const teamDocRef = doc(db, 'teams', activeTeamId);
      const unsubTeam = onSnapshot(teamDocRef, (teamSnap) => {
          if (teamSnap.exists()) {
              setCloudTeamData(teamSnap.data());
          }
      }, (error) => {
          console.error("Error listening to team data:", error);
      });

      const matchesColRef = collection(db, `teams/${activeTeamId}/matches`);
      const unsubMatches = onSnapshot(matchesColRef, (snapshot) => {
          const loadedMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
          setCloudMatches(loadedMatches.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }, (error) => {
          console.error("Error listening to matches:", error);
      });

      return () => {
          unsubTeam();
          unsubMatches();
      }
  }, [activeTeamId]);


  // Computed properties
  const myTeams = useMemo(() => {
    const teams = new Set<string>();
    matches.forEach(m => { if (m.teamName) teams.add(m.teamName); });
    if (mainTeamName) teams.add(mainTeamName);
    return Array.from(teams).sort();
  }, [matches, mainTeamName]);

  const activeTeams = useMemo(() => {
    return myTeams.filter(team => !teamProfiles[team]?.isHidden);
  }, [myTeams, teamProfiles]);

  const myTeamPlayers = useMemo(() => {
    const playersFromMatches = new Set<string>();
    matches.forEach(match => {
        match.players?.forEach(p => { if (p.name.trim()) playersFromMatches.add(p.name.trim()); });
    });
    const all = new Set([...playersFromMatches, ...roster]);
    return Array.from(all).sort();
  }, [matches, roster]);

  const allPlayers = useMemo(() => {
    const players = new Set<string>();
    matches.forEach(match => {
      match.players?.forEach(p => { if (p && p.name.trim()) players.add(p.name.trim()); });
      match.opponentPlayers?.forEach(p => { if (p && p.name.trim()) players.add(p.name.trim()); });
    });
    roster.forEach(p => players.add(p));
    return Array.from(players).sort();
  }, [matches, roster]);

  // -- Action Handlers -- 

  const updateCloudTeamData = async (data: any) => {
      if (!currentUser || !activeTeamId) return;
      try {
        await updateDoc(doc(db, 'teams', activeTeamId), data);
      } catch (e) {
          console.error("Error updating team data:", e);
      }
  };

  const setMatches = (action: React.SetStateAction<Match[]>) => {
      if (!currentUser) setLocalMatches(action);
  };
  const setAiInteractions = (action: React.SetStateAction<AIInteraction[]>) => {
      if (!currentUser) setLocalAiInteractions(action);
      else {
          const newData = typeof action === 'function' ? action(aiInteractions) : action;
          updateCloudTeamData({ aiInteractions: newData });
      }
  };
  const setMainTeamName = (action: React.SetStateAction<string>) => {
      if (!currentUser) setLocalMainTeamName(action);
      else {
          const newName = typeof action === 'function' ? action(mainTeamName) : action;
          updateCloudTeamData({ name: newName });
      }
  };

  // CRUD Operations

  const addMatch = (matchData: Omit<Match, 'id' | 'result' | 'myGoals' | 'myAssists' | 'goalDifference'>): Match => {
    const processed = processMatch(matchData);
    
    if (currentUser) {
        const newMatchId = Date.now().toString(); 
        const asyncAdd = async () => {
            if (activeTeamId) {
               await addDoc(collection(db, `teams/${activeTeamId}/matches`), processed); 
            }
        }
        asyncAdd();
        return { id: newMatchId, ...processed }; 
    } else {
        const newMatch: Match = { id: Date.now().toString(), ...processed };
        setLocalMatches(prev => [newMatch, ...prev]);
        return newMatch;
    }
  };
  
  const updateMatch = (match: Match) => {
    const processed = processMatch(match);
    if (currentUser) {
        const asyncUpdate = async () => {
            if (activeTeamId) {
                await setDoc(doc(db, `teams/${activeTeamId}/matches`, match.id), { ...match, ...processed });
            }
        }
        asyncUpdate();
    } else {
        setLocalMatches(prev => prev.map(m => m.id === match.id ? { ...match, ...processed } : m));
    }
  };

  const deleteMatch = (matchId: string) => {
    if (currentUser) {
         const asyncDelete = async () => {
            if (activeTeamId) {
                try {
                    await deleteDoc(doc(db, `teams/${activeTeamId}/matches`, matchId));
                } catch (e) {
                    console.error("Error deleting match:", e);
                }
            }
        }
        asyncDelete();
    } else {
        setLocalMatches(prev => prev.filter(m => m.id !== matchId));
    }
  };

  const updateMatchDetails = (matchId: string, players: PlayerPerformance[], tournament: string, incidents: Incident[]) => {
    const currentMatches = currentUser ? cloudMatches : localMatches;
    const matchToUpdate = currentMatches.find(m => m.id === matchId);
    if (matchToUpdate) {
        const updatedMatch = { ...matchToUpdate, players, tournament, incidents };
        updateMatch({ ...updatedMatch, ...processMatch(updatedMatch) });
    }
  };
  
  const addAIInteraction = (type: AIInteraction['type'], content: any) => {
    const newInteraction: AIInteraction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type,
      content,
    };
    if (currentUser) {
        updateCloudTeamData({ aiInteractions: [newInteraction, ...aiInteractions] });
    } else {
        setLocalAiInteractions(prev => [newInteraction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal = { id: Date.now().toString(), ...goal };
    if(currentUser) updateCloudTeamData({ goals: [...goals, newGoal] });
    else setLocalGoals(prev => [newGoal, ...prev]);
  };
  const deleteGoal = (id: string) => {
      if(currentUser) updateCloudTeamData({ goals: goals.filter(g => g.id !== id) });
      else setLocalGoals(prev => prev.filter(g => g.id !== id));
  }

  const addCustomAchievement = (ach: Omit<CustomAchievement, 'id' | 'unlocked'>) => {
      const newAch = { id: Date.now().toString(), unlocked: false, ...ach };
      if(currentUser) updateCloudTeamData({ customAchievements: [...customAchievements, newAch] });
      else setLocalCustomAchievements(prev => [...prev, newAch]);
  }
  const deleteCustomAchievement = (id: string) => {
      if(currentUser) updateCloudTeamData({ customAchievements: customAchievements.filter(a => a.id !== id) });
      else setLocalCustomAchievements(prev => prev.filter(a => a.id !== id));
  }

  const addPlayerToRoster = (playerName: string) => {
    const trimmed = playerName.trim();
    if(trimmed && !roster.includes(trimmed)) {
        if(currentUser) updateCloudTeamData({ roster: [...roster, trimmed].sort() });
        else setLocalRoster(prev => [...prev, trimmed].sort());
    }
  }
  const deletePlayerFromRoster = (name: string) => {
      if(currentUser) updateCloudTeamData({ roster: roster.filter(p => p !== name) });
      else setLocalRoster(prev => prev.filter(p => p !== name));
  }

  const updatePlayerProfile = (name: string, data: Partial<PlayerProfileData>) => {
      const newProfiles = { ...playerProfiles, [name]: { ...(playerProfiles[name] || {}), ...data } };
      if(currentUser) updateCloudTeamData({ playerProfiles: newProfiles });
      else setLocalPlayerProfiles(newProfiles);
  }

  const updateTeamProfile = (originalName: string, newName: string, data: Partial<TeamProfileData>) => {
      const trimmedNew = newName.trim();
      if (!trimmedNew) return;
      
      const newProfiles = { ...teamProfiles };
      const existing = newProfiles[originalName] || {};
      if (originalName !== trimmedNew) delete newProfiles[originalName];
      newProfiles[trimmedNew] = { ...existing, ...data };

      if (currentUser) {
          updateCloudTeamData({ teamProfiles: newProfiles });
          if (originalName === mainTeamName) updateCloudTeamData({ name: trimmedNew });
      } else {
          setLocalTeamProfiles(newProfiles);
          if (originalName !== trimmedNew) {
              setLocalMatches(prev => prev.map(m => m.teamName === originalName ? { ...m, teamName: trimmedNew } : m));
              if (localMainTeamName === originalName) setLocalMainTeamName(trimmedNew);
          }
      }
  }
  
  const updateTournamentSettings = (o: string, n: string, s: Partial<TournamentSettings>) => {
      const newS = { ...tournamentSettings };
      const exist = newS[o] || { icon: '🏆', color: '#FFC107' };
      if(o !== n) delete newS[o];
      newS[n] = { ...exist, ...s };
      if(currentUser) updateCloudTeamData({ tournamentSettings: newS });
      else setLocalTournamentSettings(newS);
  }
  
  const deleteTournament = (name: string) => {
      const newS = { ...tournamentSettings };
      delete newS[name];
      if(currentUser) updateCloudTeamData({ tournamentSettings: newS });
      else setLocalTournamentSettings(newS);
  }

  const updatePlayerName = (oldName: string, newName: string) => {
      if (!currentUser) {
          const trimmedNew = newName.trim();
          if (!trimmedNew || trimmedNew === oldName) return;
          setLocalRoster(prev => prev.map(n => n === oldName ? trimmedNew : n).sort());
          setLocalMatches(prev => prev.map(m => ({
            ...m,
            players: m.players.map(p => p.name === oldName ? { ...p, name: trimmedNew } : p),
            opponentPlayers: m.opponentPlayers?.map(p => p.name === oldName ? { ...p, name: trimmedNew } : p) || [],
            incidents: m.incidents?.map(i => i.playerName === oldName ? { ...i, playerName: trimmedNew } : i)
          })));
      } else {
          console.warn("Renaming players in cloud mode is not fully supported in this version due to high write volume.");
      }
  }

  const completeOnboarding = (name: string, option: 'fresh' | 'examples') => {
      if (currentUser) {
          updateCloudTeamData({ name, onboardingCompleted: true });
          if (option === 'examples' && activeTeamId) {
              initialData.matches.forEach(m => {
                  addDoc(collection(db, `teams/${activeTeamId}/matches`), m);
              });
          }
      } else {
          setLocalMainTeamName(name);
          setLocalIsOnboardingComplete(true);
          if (option === 'fresh') {
              setLocalMatches([]);
              setLocalRoster([]);
          }
      }
  }

  const importFromFile = async (data: any) => {
    if (currentUser) {
        if (!activeTeamId) return;
        setIsSyncing(true);
        try {
            // 1. Update Top Level Fields (Merged or overwritten)
            const teamUpdates: any = {};
            // We overwrite these fields to ensure consistency with the imported file
            teamUpdates.aiInteractions = data.aiInteractions || [];
            teamUpdates.goals = data.goals || [];
            teamUpdates.customAchievements = data.customAchievements || [];
            teamUpdates.tournamentSettings = data.tournamentSettings || {};
            teamUpdates.playerProfiles = data.playerProfiles || {};
            teamUpdates.teamProfiles = data.teamProfiles || {};
            teamUpdates.roster = data.roster || [];
            if (data.mainTeamName) teamUpdates.name = data.mainTeamName;

            await updateCloudTeamData(teamUpdates);

            // 2. Replace Matches
            // This allows "wiping" data if data.matches is empty
            const batchSize = 400; 
            
            // A. Delete ALL existing matches in batches
            const existingChunks: Match[][] = [];
            for (let i = 0; i < cloudMatches.length; i += batchSize) {
                existingChunks.push(cloudMatches.slice(i, i + batchSize));
            }
            
            for (const chunk of existingChunks) {
                const batch = writeBatch(db);
                chunk.forEach(m => batch.delete(doc(db, `teams/${activeTeamId}/matches`, m.id)));
                await batch.commit();
            }

            // B. Add new matches in batches (if any)
            if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
                const newMatches = data.matches;
                const newChunks: any[][] = [];
                for (let i = 0; i < newMatches.length; i += batchSize) {
                    newChunks.push(newMatches.slice(i, i + batchSize));
                }

                for (const chunk of newChunks) {
                    const batch = writeBatch(db);
                    chunk.forEach(m => {
                        const processed = processMatch(m);
                        const id = m.id || Date.now().toString() + Math.random();
                        batch.set(doc(db, `teams/${activeTeamId}/matches`, id), { ...m, ...processed, id });
                    });
                    await batch.commit();
                }
            }
        } catch (error) {
            console.error("Import error:", error);
            throw error;
        } finally {
            setIsSyncing(false);
        }
    } else {
        // Local Import
        setLocalMatches(data.matches || []);
        setLocalAiInteractions(data.aiInteractions || []);
        setLocalGoals(data.goals || []);
        setLocalCustomAchievements(data.customAchievements || []);
        setLocalTournamentSettings(data.tournamentSettings || {});
        setLocalPlayerProfiles(data.playerProfiles || {});
        setLocalTeamProfiles(data.teamProfiles || {});
        setLocalRoster(data.roster || []);
        if (data.mainTeamName) setLocalMainTeamName(data.mainTeamName);
    }
  };

  const deleteTeam = async (teamName: string) => {
      if (currentUser) {
          if (!activeTeamId) return;
          setIsSyncing(true);
          try {
              // 1. Delete associated matches (Client side filtering for batch delete)
              const teamMatches = cloudMatches.filter(m => m.teamName === teamName);
              const batchSize = 400;
              const matchChunks: Match[][] = [];
              for (let i = 0; i < teamMatches.length; i += batchSize) {
                  matchChunks.push(teamMatches.slice(i, i + batchSize));
              }

              for (const chunk of matchChunks) {
                  const batch = writeBatch(db);
                  chunk.forEach(m => batch.delete(doc(db, `teams/${activeTeamId}/matches`, m.id)));
                  await batch.commit();
              }

              // 2. Remove from teamProfiles
              const newProfiles = { ...teamProfiles };
              delete newProfiles[teamName];
              
              const updates: any = { teamProfiles: newProfiles };
              
              // 3. Update mainTeamName if it was the one deleted
              if (mainTeamName === teamName) {
                  updates.name = "Mi Equipo"; // Fallback
              }

              await updateCloudTeamData(updates);

          } catch (error) {
              console.error("Error deleting team:", error);
          } finally {
              setIsSyncing(false);
          }
      } else {
          // Local deletion
          setLocalMatches(prev => prev.filter(m => m.teamName !== teamName));
          setLocalTeamProfiles(prev => {
              const copy = { ...prev };
              delete copy[teamName];
              return copy;
          });
          if (localMainTeamName === teamName) {
              setLocalMainTeamName("Mi Equipo");
          }
      }
  };

  const resetAccount = async () => {
      if (currentUser) {
          setIsSyncing(true);
          try {
              // 1. Get User Data to find all teams
              const userDocRef = doc(db, 'users', currentUser.uid);
              const userSnap = await getDoc(userDocRef);
              
              if (userSnap.exists()) {
                  const userData = userSnap.data();
                  const allTeamIds = userData.teams || [];

                  // 2. Iterate and Destroy ALL TEAMS
                  for (const teamId of allTeamIds) {
                      const matchesRef = collection(db, `teams/${teamId}/matches`);
                      const snapshot = await getDocs(matchesRef);
                      
                      // Delete matches in batches
                      const batch = writeBatch(db);
                      snapshot.docs.forEach(d => batch.delete(d.ref));
                      await batch.commit();

                      // Delete team doc
                      await deleteDoc(doc(db, 'teams', teamId));
                  }
                  
                  // 3. Create Fresh Start (New Team)
                  const newTeamRef = doc(collection(db, 'teams'));
                  const initialTeamData = {
                      name: "Mi Equipo",
                      ownerId: currentUser.uid,
                      createdAt: new Date().toISOString(),
                      onboardingCompleted: false // Force onboarding again
                  };
                  
                  const batch = writeBatch(db);
                  batch.set(userDocRef, { 
                      email: currentUser.email, 
                      activeTeamId: newTeamRef.id,
                      teams: [newTeamRef.id] 
                  });
                  batch.set(newTeamRef, initialTeamData);
                  await batch.commit();
              }
              
              window.location.reload();
          } catch (error) {
              console.error("Error resetting account:", error);
          } finally {
              setIsSyncing(false);
          }
      } else {
          // Local reset
          localStorage.clear();
          window.location.reload();
      }
  };

  const value = {
    matches, setMatches, aiInteractions, currentPage, setCurrentPage,
    addMatch, updateMatch, deleteMatch, updateMatchDetails, addAIInteraction,
    setAiInteractions,
    isShareMode,
    goals, addGoal, deleteGoal,
    customAchievements, addCustomAchievement, deleteCustomAchievement,
    mainPlayerName,
    tournamentSettings,
    updateTournamentSettings,
    deleteTournament,
    playerProfiles,
    updatePlayerProfile,
    isOnboardingComplete,
    completeOnboarding,
    mainTeamName,
    setMainTeamName,
    teamProfiles,
    updateTeamProfile,
    viewingPlayerName,
    setViewingPlayerName,
    roster,
    addPlayerToRoster,
    deletePlayerFromRoster,
    updatePlayerName,
    allPlayers,
    myTeamPlayers,
    myTeams,
    activeTeams,
    isSyncing,
    importFromFile,
    deleteTeam,
    resetAccount
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
