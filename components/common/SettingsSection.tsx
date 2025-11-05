import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronIcon } from '../icons/ChevronIcon';

interface SettingsSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children, defaultOpen = false }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const styles: React.CSSProperties = {
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.small,
      overflow: 'hidden',
      transition: 'all 0.3s ease-in-out',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${theme.spacing.medium} ${theme.spacing.large}`,
      cursor: 'pointer',
      userSelect: 'none',
    },
    title: {
      fontSize: theme.typography.fontSize.medium,
      fontWeight: 600,
      color: theme.colors.primaryText,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.medium,
    },
    content: {
      padding: `0 ${theme.spacing.large} ${theme.spacing.large}`,
      animation: 'fadeInContent 0.5s ease-out',
    },
  };

  return (
    <>
      <style>{`
        @keyframes fadeInContent {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={styles.container}>
        <div style={styles.header} onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0} aria-expanded={isOpen}>
          <h3 style={styles.title}>{title}</h3>
          <ChevronIcon isExpanded={isOpen} />
        </div>
        {isOpen && <div style={styles.content}>{children}</div>}
      </div>
    </>
  );
};

export default SettingsSection;
