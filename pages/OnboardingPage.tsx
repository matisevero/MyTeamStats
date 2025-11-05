import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { FootballIcon } from '../components/icons/FootballIcon';
import Card from '../components/common/Card';

const OnboardingPage: React.FC = () => {
  const { theme } = useTheme();
  const { completeOnboarding } = useData();
  const [teamName, setTeamName] = useState('');

  const handleStart = (startOption: 'fresh' | 'examples') => {
    completeOnboarding(teamName, startOption);
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: theme.spacing.medium,
    },
    cardContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing.large,
      textAlign: 'center',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: theme.spacing.medium,
    },
    title: { 
        fontSize: '1.75rem', 
        fontWeight: 700, 
        color: theme.colors.primaryText, 
        margin: 0,
    },
    aiText: { 
        color: theme.colors.accent1,
        background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 900,
    },
    subtitle: {
      color: theme.colors.secondaryText,
      margin: 0,
      fontSize: theme.typography.fontSize.medium,
    },
    input: {
      width: '100%',
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      color: theme.colors.primaryText,
      fontSize: theme.typography.fontSize.medium,
      textAlign: 'center',
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.medium,
      width: '100%',
    },
    button: {
      padding: theme.spacing.medium,
      border: 'none',
      borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.medium,
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    primaryButton: {
      backgroundColor: theme.colors.accent1,
      color: theme.colors.textOnAccent,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      color: theme.colors.secondaryText,
      border: `1px solid ${theme.colors.borderStrong}`,
    },
  };

  return (
    <div style={styles.container}>
      <Card style={{ maxWidth: '400px', width: '100%', padding: '0' }}>
        <div style={styles.cardContent}>
            <div style={styles.logoContainer}>
                <FootballIcon size={40} color={theme.colors.accent1} />
                <h1 style={styles.title}>MyTeam<span style={styles.aiText}>Stats</span></h1>
            </div>

          <h2 style={{margin: 0, fontSize: '1.25rem'}}>¡Bienvenido!</h2>
          <p style={styles.subtitle}>Para empezar, dinos el nombre de tu equipo principal.</p>

          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Nombre de tu equipo"
            style={styles.input}
          />

          <div style={styles.buttonContainer}>
            <button
              onClick={() => handleStart('examples')}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              Cargar datos de ejemplo
            </button>
            <button
              onClick={() => handleStart('fresh')}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              Empezar desde cero
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OnboardingPage;
