
import React, { useEffect, useMemo } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { useData } from './contexts/DataContext';
import { useAuth } from './contexts/AuthContext';

import Header from './components/Header';
import RecorderPage from './pages/RecorderPage';
import StatsPage from './pages/StatsPage';
import SquadPage from './pages/SquadPage';
import CoachPage from './pages/CoachPage';
import SettingsPage from './pages/SettingsPage';
import TablePage from './pages/TablePage';
import ProgressPage from './pages/ProgressPage';
import SocialPage from './pages/SocialPage';
import LoginPage from './pages/LoginPage';
import { InfoIcon } from './components/icons/InfoIcon';
import OnboardingPage from './pages/OnboardingPage';
import PlayerDetailModal from './components/squad/PlayerDetailModal';
import type { SquadPlayerStats } from './types';
import { Loader } from './components/Loader';

export type Page = 'recorder' | 'stats' | 'squad' | 'progress' | 'coach' | 'settings' | 'table' | 'social' | 'login';

const App: React.FC = () => {
  const { theme } = useTheme();
  const { 
    matches, 
    currentPage, 
    isShareMode, 
    setCurrentPage, 
    isOnboardingComplete, 
    viewingPlayerName, 
    setViewingPlayerName, 
    playerProfiles, 
    updatePlayerProfile 
  } = useData();
  
  const { currentUser, loading } = useAuth();

  // Redirect from login page if user is already authenticated
  useEffect(() => {
    if (currentUser && currentPage === 'login') {
      setCurrentPage('recorder');
    }
  }, [currentUser, currentPage, setCurrentPage]);

  // Fallback for share mode if somehow navigated to a restricted page
  useEffect(() => {
    if (isShareMode && (currentPage === 'settings' || currentPage === 'recorder')) {
      setCurrentPage('stats');
    }
  }, [currentPage, isShareMode, setCurrentPage]);

  const allSquadStats: SquadPlayerStats[] = useMemo(() => {
    const playerStats: { [name: string]: Omit<SquadPlayerStats, 'name' | 'winRate' | 'gpm' | 'apm' | 'minutesPercentage' | 'efectividad' | 'cleanSheets'> } = {};
    const playerCleanSheets: Record<string, number> = {};

    matches.forEach(match => {
        if (match.opponentScore === 0) {
            match.players.forEach(p => {
                if(p.name) {
                    playerCleanSheets[p.name] = (playerCleanSheets[p.name] || 0) + 1;
                }
            });
        }

        match.players.forEach(p => {
            if (!p.name) return;
            if (!playerStats[p.name]) {
                playerStats[p.name] = {
                    matchesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    minutesPlayed: 0,
                    starts: 0,
                    subAppearances: 0,
                    record: { wins: 0, draws: 0, losses: 0 },
                };
            }
            const stats = playerStats[p.name];
            stats.matchesPlayed++;
            if (match.result === 'VICTORIA') stats.record.wins++;
            else if (match.result === 'EMPATE') stats.record.draws++;
            else stats.record.losses++;

            stats.goals += p.goals;
            stats.assists += p.assists;
            stats.minutesPlayed += p.minutesPlayed ?? 0;
            if (p.status === 'starter' || p.status === 'goalkeeper') {
                stats.starts++;
            } else if (p.status === 'substitute') {
                stats.subAppearances++;
            }
        });
    });

    const statsArray = Object.entries(playerStats).map(([name, stats]) => {
      const points = stats.record.wins * 3 + stats.record.draws;
      return {
        name,
        ...stats,
        winRate: stats.matchesPlayed > 0 ? (stats.record.wins / stats.matchesPlayed) * 100 : 0,
        efectividad: stats.matchesPlayed > 0 ? (points / (stats.matchesPlayed * 3)) * 100 : 0,
        gpm: stats.matchesPlayed > 0 ? stats.goals / stats.matchesPlayed : 0,
        apm: stats.matchesPlayed > 0 ? stats.assists / stats.matchesPlayed : 0,
        minutesPlayed: stats.minutesPlayed,
        cleanSheets: playerCleanSheets[name] || 0,
      };
    });

    if (statsArray.length === 0) return [];

    const maxMinutes = Math.max(...statsArray.map(p => p.minutesPlayed));

    return statsArray.map(player => ({
      ...player,
      minutesPercentage: maxMinutes > 0 ? (player.minutesPlayed / maxMinutes) * 100 : 0,
    }));
  }, [matches]);
  
  const playerToViewStats = useMemo(() => {
    if (!viewingPlayerName) return null;
    return allSquadStats.find(p => p.name === viewingPlayerName) || null;
  }, [viewingPlayerName, allSquadStats]);


  const styles: { [key: string]: React.CSSProperties } = {
    appContainer: {
      minHeight: '100vh',
      background: theme.colors.backgroundGradient,
      color: theme.colors.primaryText,
      fontFamily: theme.typography.fontFamily,
      transition: 'background 0.3s, color 0.3s',
    },
    shareBanner: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: theme.colors.surface,
      color: theme.colors.secondaryText,
      padding: '0.5rem 1rem',
      textAlign: 'center',
      zIndex: 2000,
      borderTop: `1px solid ${theme.colors.border}`,
      boxShadow: `0 -2px 10px rgba(0,0,0,0.1)`,
      fontSize: '0.8rem',
    },
    shareBannerText: {
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    },
    loaderContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: theme.colors.background,
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'stats':
        return <StatsPage />;
      case 'table':
        return <TablePage />;
      case 'squad':
        return <SquadPage />;
      case 'progress':
        return <ProgressPage />;
      case 'coach':
        return <CoachPage />;
      case 'social':
        return <SocialPage />;
      case 'settings':
        return isShareMode ? <StatsPage /> : <SettingsPage />;
      case 'login':
        return <LoginPage />;
      case 'recorder':
      default:
        return isShareMode ? <StatsPage /> : <RecorderPage />;
    }
  };

  if (loading) {
      return (
          <div style={styles.loaderContainer}>
              <Loader />
          </div>
      );
  }

  // Check for onboarding only if not logging in and not in share mode
  if (!isOnboardingComplete && !isShareMode && currentPage !== 'login') {
    return (
        <div style={styles.appContainer}>
            <OnboardingPage />
        </div>
    );
  }

  const showHeader = currentPage !== 'login';

  return (
    <div style={styles.appContainer}>
      <style>{`
        @keyframes pageFadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .page-transition-container {
          animation: pageFadeInUp 0.4s ease-out forwards;
        }
      `}</style>
      {showHeader && <Header />}
      <div 
        key={currentPage} 
        style={{ 
            paddingTop: showHeader ? '65px' : '0', 
            paddingBottom: isShareMode ? '50px' : '0' 
        }} 
        className="page-transition-container"
      >
        {renderPage()}
      </div>
       {isShareMode && (
        <div style={styles.shareBanner}>
            <p style={styles.shareBannerText}>
                <InfoIcon size={16} /> Modo de solo lectura.
            </p>
        </div>
      )}

      {playerToViewStats && (
          <PlayerDetailModal
              player={playerToViewStats}
              allMatches={matches}
              profile={playerProfiles[playerToViewStats.name]}
              onClose={() => setViewingPlayerName(null)}
              onProfileUpdate={updatePlayerProfile}
          />
      )}
    </div>
  );
};

export default App;