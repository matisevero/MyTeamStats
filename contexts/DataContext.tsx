import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Match, AIInteraction, PlayerPerformance, Goal, CustomAchievement, PlayerProfileData, TeamProfileData } from '../types';
import type { Page } from '../App';
import { initialData } from '../data/initialData';

interface TournamentStyle {
  icon: string;
  color: string;
}

interface DataContextType {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  aiInteractions: AIInteraction[];
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  addMatch: (matchData: Omit<Match, 'id' | 'result' | 'myGoals' | 'myAssists' | 'goalDifference'>) => Match;
  updateMatch: (match: Match) => void;
  deleteMatch: (matchId: string) => void;
  updateMatchPlayers: (matchId: string, players: PlayerPerformance[], tournament: string) => void;
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
  tournamentStyles: Record<string, TournamentStyle>;
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

const TOURNAMENT_ICONS = ['🏆', '🥇', '🏅', '🎖️', '👑', '⭐️', '⚡️', '🔥', '🛡️', '⚔️'];
const TOURNAMENT_COLORS = ['#FFC107', '#C0C0C0', '#CD7F32', '#4CAF50', '#2196F3', '#9C27B0', '#F44336', '#FF9800', '#00BCD4', '#E91E63'];


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useLocalStorage<Match[]>('myTeamStats-matches', initialData.matches);
  const [aiInteractions, setAiInteractions] = useLocalStorage<AIInteraction[]>('myTeamStats-aiInteractions', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('myTeamStats-goals', []);
  const [customAchievements, setCustomAchievements] = useLocalStorage<CustomAchievement[]>('myTeamStats-customAchievements', []);
  const [mainPlayerName, setMainPlayerName] = useLocalStorage<string>('myTeamStats-mainPlayer', 'Yo');
  const [tournamentStyles, setTournamentStyles] = useLocalStorage<Record<string, TournamentStyle>>('myTeamStats-tournamentStyles', {});
  const [playerProfiles, setPlayerProfiles] = useLocalStorage<Record<string, PlayerProfileData>>('myTeamStats-playerProfiles', {});
  
  const [isOnboardingComplete, setIsOnboardingComplete] = useLocalStorage<boolean>('myTeamStats-onboardingComplete', false);
  const [mainTeamName, setMainTeamName] = useLocalStorage<string>('myTeamStats-mainTeamName', 'Mi Equipo');
  const [teamProfiles, setTeamProfiles] = useLocalStorage<Record<string, TeamProfileData>>('myTeamStats-teamProfiles', {});

  const [currentPage, setCurrentPage] = useState<Page>(isShareMode ? 'stats' : 'recorder');
  const [viewingPlayerName, setViewingPlayerName] = useState<string | null>(null);
  
  const completeOnboarding = (teamName: string, startOption: 'fresh' | 'examples') => {
    const finalTeamName = teamName.trim() || 'Mi Equipo';
    setMainTeamName(finalTeamName);

    if (startOption === 'fresh') {
        setMatches([]);
        setAiInteractions([]);
        setGoals([]);
        setCustomAchievements([]);
        setPlayerProfiles({});
        setTournamentStyles({});
        setTeamProfiles({});
    } else { // examples
        const exampleTeamName = 'Los Pibes FC';
        const updatedMatches = initialData.matches.map(match => {
            if (match.teamName === exampleTeamName) {
                return { ...match, teamName: finalTeamName };
            }
            return match;
        });
        setMatches(updatedMatches);
        // Reset other data to be clean
        setAiInteractions([]);
        setGoals([]);
        setCustomAchievements([]);
        setPlayerProfiles({});
        setTournamentStyles({});
        setTeamProfiles({});
    }

    setIsOnboardingComplete(true);
  };

  useEffect(() => {
    const uniqueTournaments = new Set(matches.map(m => m.tournament).filter((t): t is string => !!t));
    const newStyles: Record<string, TournamentStyle> = {};
    let needsUpdate = false;
    
    Array.from(uniqueTournaments).forEach(name => {
      if (!tournamentStyles[name]) {
        const existingCount = Object.keys(tournamentStyles).length + Object.keys(newStyles).length;
        const icon = TOURNAMENT_ICONS[existingCount % TOURNAMENT_ICONS.length];
        const color = TOURNAMENT_COLORS[existingCount % TOURNAMENT_COLORS.length];
        newStyles[name] = { icon, color };
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setTournamentStyles(prev => ({ ...prev, ...newStyles }));
    }
  }, [matches, tournamentStyles, setTournamentStyles]);

  const addMatch = (matchData: Omit<Match, 'id' | 'result' | 'myGoals' | 'myAssists' | 'goalDifference'>): Match => {
    const processed = processMatch(matchData);
    const newMatch: Match = { id: Date.now().toString(), ...processed };
    setMatches(prev => [newMatch, ...prev]);
    return newMatch;
  };
  
  const updateMatch = (match: Match) => {
    const processed = processMatch(match);
    setMatches(prev => prev.map(m => m.id === match.id ? { ...match, ...processed } : m));
  };

  const deleteMatch = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  const updateMatchPlayers = (matchId: string, players: PlayerPerformance[], tournament: string) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const updatedMatch = { ...m, players, tournament };
        return { ...updatedMatch, ...processMatch(updatedMatch) };
      }
      return m;
    }));
  };
  
  const addAIInteraction = (type: AIInteraction['type'], content: any) => {
    const newInteraction: AIInteraction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type,
      content,
    };
    setAiInteractions(prev => [newInteraction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = { id: Date.now().toString(), ...goal };
    setGoals(prev => [newGoal, ...prev]);
  };

  const deleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const addCustomAchievement = (achievement: Omit<CustomAchievement, 'id' | 'unlocked'>) => {
    const newAchievement: CustomAchievement = { id: Date.now().toString(), unlocked: false, ...achievement };
    setCustomAchievements(prev => [...prev, newAchievement]);
  };

  const deleteCustomAchievement = (achievementId: string) => {
    setCustomAchievements(prev => prev.filter(a => a.id !== achievementId));
  };
  
  const updatePlayerProfile = (playerName: string, data: Partial<PlayerProfileData>) => {
    setPlayerProfiles(prev => ({
      ...prev,
      [playerName]: {
        ...(prev[playerName] || {}),
        ...data,
      }
    }));
  };
  
  const updateTeamProfile = (originalName: string, newName: string, profileData: Partial<TeamProfileData>) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) return;

    setTeamProfiles(prev => {
      const newProfiles = { ...prev };
      const existingProfile = newProfiles[originalName] || {};
      
      if (originalName !== trimmedNewName) {
        delete newProfiles[originalName];
      }
      
      newProfiles[trimmedNewName] = { ...existingProfile, ...profileData };
      return newProfiles;
    });

    if (originalName !== trimmedNewName) {
      setMatches(prevMatches => 
        prevMatches.map(match => {
          let updatedMatch = { ...match };
          if (match.teamName === originalName) {
            updatedMatch.teamName = trimmedNewName;
          }
          return updatedMatch;
        })
      );
      if (mainTeamName === originalName) {
          setMainTeamName(trimmedNewName);
      }
    }
  };

  const value = {
    matches, setMatches, aiInteractions, currentPage, setCurrentPage,
    addMatch, updateMatch, deleteMatch, updateMatchPlayers, addAIInteraction,
    setAiInteractions,
    isShareMode,
    goals, addGoal, deleteGoal,
    customAchievements, addCustomAchievement, deleteCustomAchievement,
    mainPlayerName,
    tournamentStyles,
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