import React, { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const designSystem = {
  spacing: {
    extraSmall: '0.25rem', // 4px
    small: '0.5rem',      // 8px
    medium: '1rem',       // 16px
    large: '1.5rem',      // 24px
    extraLarge: '2rem',   // 32px
  },
  borderRadius: {
    small: '6px',
    medium: '8px',
    large: '12px',
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    fontSize: {
      extraSmall: '0.75rem', // 12px
      small: '0.875rem',    // 14px
      medium: '1rem',       // 16px
      large: '1.125rem',    // 18px
      extraLarge: '1.5rem', // 24px
    }
  },
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
    large: '0 8px 16px rgba(0, 0, 0, 0.2)',
  }
};

const darkTheme = {
  name: 'dark',
  ...designSystem,
  colors: {
    background: '#121829',
    backgroundGradient: 'linear-gradient(180deg, #1A2238 0%, #121829 100%)',
    surface: '#1A2238',
    primaryText: '#FFFFFF',
    secondaryText: '#9FA8DA',
    border: '#2A3452',
    borderStrong: '#3F4A6E',
    accent1: '#00E676',
    accent2: '#00B0FF',
    accent3: '#FFCA28',
    win: '#00E676',
    loss: '#FF5252',
    draw: '#5C6BC0',
    textOnAccent: '#121829',
  },
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.2)',
    medium: '0 5px 10px rgba(0, 0, 0, 0.25)',
    large: '0 8px 16px rgba(0, 0, 0, 0.3)',
  }
};

const lightTheme = {
  name: 'light',
  ...designSystem,
  colors: {
    background: '#F4F6FA',
    backgroundGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F4F6FA 100%)',
    surface: '#FFFFFF',
    primaryText: '#121829',
    secondaryText: '#5A647F',
    border: '#DDE1E9',
    borderStrong: '#C5CED9',
    accent1: '#00C865',
    accent2: '#0099E6',
    accent3: '#FFA000',
    win: '#00C865',
    loss: '#E53935',
    draw: '#3949AB',
    textOnAccent: '#FFFFFF',
  },
  shadows: {
    small: '0 1px 2px rgba(26, 34, 56, 0.06)',
    medium: '0 3px 6px rgba(26, 34, 56, 0.08)',
    large: '0 6px 12px rgba(26, 34, 56, 0.1)',
  }
};

type Theme = typeof darkTheme;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useLocalStorage<'dark' | 'light'>('app-theme', 'dark');

  const toggleTheme = () => {
    setThemeName(prev => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  const theme = useMemo(() => (themeName === 'dark' ? darkTheme : lightTheme), [themeName]);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};