import React from 'react';
import type { AIHighlight, Match } from '../types';
import MatchCard from './MatchCard';
import { SparklesIcon } from './icons/SparklesIcon';
import { useTheme } from '../contexts/ThemeContext';

interface HighlightCardProps {
  highlight: AIHighlight;
  allMatches: Match[];
  allPlayers: string[];
}

const HighlightCard: React.FC<HighlightCardProps> = ({ highlight, allMatches, allPlayers }) => {
  const { theme } = useTheme();

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      backgroundColor: theme.colors.surface, borderRadius: '12px',
      border: `1px solid ${theme.colors.border}`, padding: '1rem',
    },
    header: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
    title: {
      margin: 0, fontSize: '1.125rem', fontWeight: 700,
      background: `linear-gradient(90deg, ${theme.colors.accent1}, ${theme.colors.accent2})`,
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    reason: { margin: '0 0 1rem 0', color: theme.colors.secondaryText, fontSize: '0.9rem', lineHeight: 1.6 },
    matchPreview: {},
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <SparklesIcon />
        <h4 style={styles.title}>{highlight.title}</h4>
      </div>
      <p style={styles.reason}>{highlight.reason}</p>
      <div style={styles.matchPreview}>
        <MatchCard match={highlight.match} allMatches={allMatches} allPlayers={allPlayers} isReadOnly />
      </div>
    </div>
  );
};

export default HighlightCard;