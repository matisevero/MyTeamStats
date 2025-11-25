import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { FootballIcon } from '../components/icons/FootballIcon';
import Card from '../components/common/Card';
import { Loader } from '../components/Loader';
import { CloseIcon } from '../components/icons/CloseIcon';

const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  const { loginWithEmail, registerWithEmail } = useAuth();
  const { setCurrentPage } = useData();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Email/Pass State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError("Por favor ingresa email y contraseña.");
        return;
    }
    
    setIsLoggingIn(true);
    setError(null);
    try {
        if (isRegistering) {
            await registerWithEmail(email, password);
        } else {
            await loginWithEmail(email, password);
        }
        // Note: Redirection is handled by App.tsx useEffect on auth state change
    } catch (err: any) {
        handleAuthError(err);
        setIsLoggingIn(false);
    }
  };

  const handleCancel = () => {
      setCurrentPage('recorder'); // Or fallback to previous page if tracked
  };

  const handleAuthError = (err: any) => {
      console.error("Auth Error Details:", err);
      let msg = 'Error al autenticar.';
      
      if (err.code === 'auth/popup-closed-by-user') msg = 'Has cerrado la ventana de inicio de sesión.';
      else if (err.code === 'auth/cancelled-popup-request') msg = 'Operación cancelada.';
      else if (err.code === 'auth/operation-not-allowed') msg = 'Este método de inicio de sesión no está habilitado.';
      else if (err.code === 'auth/unauthorized-domain') msg = 'Dominio no autorizado en Firebase.';
      else if (err.code === 'auth/invalid-email') msg = 'El correo electrónico no es válido.';
      else if (err.code === 'auth/user-disabled') msg = 'Este usuario ha sido deshabilitado.';
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'Correo o contraseña incorrectos.';
      else if (err.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado.';
      else if (err.code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
      else if (err.message) msg = `Error: ${err.message}`;

      setError(msg);
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: theme.spacing.medium,
      background: theme.colors.backgroundGradient,
      position: 'relative',
    },
    cardContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: theme.spacing.large,
      textAlign: 'center',
      padding: theme.spacing.extraLarge,
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: theme.colors.secondaryText,
      padding: '0.5rem',
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
      lineHeight: 1.5,
    },
    button: {
      padding: '0.75rem 1.5rem',
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.medium,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      backgroundColor: theme.colors.surface,
      color: theme.colors.primaryText,
      transition: 'background-color 0.2s',
      boxShadow: theme.shadows.small,
      width: '100%',
      justifyContent: 'center',
    },
    emailButton: {
        backgroundColor: theme.colors.accent1,
        color: theme.colors.textOnAccent,
        border: 'none',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        backgroundColor: theme.colors.background,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.borderRadius.medium,
        color: theme.colors.primaryText,
        fontSize: theme.typography.fontSize.medium,
        outline: 'none',
    },
    error: {
        color: theme.colors.loss,
        fontSize: theme.typography.fontSize.small,
        backgroundColor: `${theme.colors.loss}15`,
        padding: '0.5rem',
        borderRadius: theme.borderRadius.small,
        maxWidth: '100%',
    },
    link: {
        color: theme.colors.accent2,
        cursor: 'pointer',
        textDecoration: 'underline',
        background: 'none',
        border: 'none',
        padding: 0,
        fontSize: theme.typography.fontSize.small,
        fontWeight: 600,
    }
  };

  return (
    <div style={styles.container}>
      <Card style={{ maxWidth: '400px', width: '100%', padding: '0' }}>
        <div style={styles.cardContent}>
            <button onClick={handleCancel} style={styles.closeButton} aria-label="Cancelar">
                <CloseIcon color={theme.colors.secondaryText} />
            </button>
            <div style={styles.logoContainer}>
                <FootballIcon size={40} color={theme.colors.accent1} />
                <h1 style={styles.title}>MyTeam<span style={styles.aiText}>Stats</span></h1>
            </div>

          <div>
            <h2 style={{margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: theme.colors.primaryText}}>
                {isRegistering ? 'Crea tu cuenta' : 'Inicia sesión'}
            </h2>
            <p style={styles.subtitle}>Sincroniza tus equipos en la nube.</p>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <form onSubmit={handleEmailSubmit} style={{width: '100%', display: 'flex', flexDirection: 'column', gap: theme.spacing.medium}}>
              <input 
                type="email" 
                placeholder="Correo electrónico" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={styles.input}
                required
                disabled={isLoggingIn}
              />
              <input 
                type="password" 
                placeholder="Contraseña" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={styles.input}
                required
                minLength={6}
                disabled={isLoggingIn}
              />
              <button type="submit" style={{...styles.button, ...styles.emailButton}} disabled={isLoggingIn}>
                  {isLoggingIn && email ? <Loader /> : (isRegistering ? 'Registrarse' : 'Entrar')}
              </button>
          </form>

          <div>
              <p style={{color: theme.colors.secondaryText, fontSize: theme.typography.fontSize.small, margin: 0}}>
                  {isRegistering ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
                  <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(null); }} 
                    style={styles.link}
                  >
                      {isRegistering ? 'Inicia sesión aquí' : 'Regístrate aquí'}
                  </button>
              </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;