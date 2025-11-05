import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import type { AIInteraction, Match, AIHighlight, CoachingInsight, PlayerMorale, AIGoalSuggestion, AIAchievementSuggestion } from '../types';
import Card from './common/Card';

interface AIInteractionCardProps {
  interaction: AIInteraction;
}

const AIInteractionCard: React.FC<AIInteractionCardProps> = ({ interaction }) => {
  const { theme } = useTheme();
  const { matches } = useData();

  const getInteractionTitleAndIcon = () => {
    switch (interaction.type) {
      case 'match_summary': return { title: 'Resumen de partido', icon: '📝' };
      case 'highlight_analysis': return { title: 'Análisis de partidos destacados', icon: '✨' };
      case 'coach_insight': return { title: 'Perspectiva del entrenador', icon: '🧠' };
      case 'consistency_analysis': return { title: 'Análisis de consistencia', icon: '📊' };
      case 'goal_suggestion': return { title: 'Sugerencia de metas', icon: '🎯' };
      case 'achievement_suggestion': return { title: 'Sugerencia de desafíos', icon: '🏆' };
      case 'match_headline': return { title: 'Titular de partido', icon: '📰' };
      case 'player_comparison': return { title: 'Análisis comparativo', icon: '👥' };
      default: return { title: 'Interacción de IA', icon: '🤖' };
    }
  };

  const { title, icon } = getInteractionTitleAndIcon();
  
  const styles: { [key: string]: React.CSSProperties } = {
    header: { display: 'flex', alignItems: 'center', gap: theme.spacing.medium },
    title: { margin: 0, fontSize: theme.typography.fontSize.medium, fontWeight: 700, color: theme.colors.primaryText },
    date: { fontSize: theme.typography.fontSize.small, color: theme.colors.secondaryText },
    content: { marginTop: theme.spacing.medium, fontSize: theme.typography.fontSize.small, color: theme.colors.primaryText, lineHeight: 1.6 },
    listItem: { padding: `0 0 ${theme.spacing.small} 0`, marginBottom: theme.spacing.small, borderBottom: `1px solid ${theme.colors.border}`},
    lastListItem: { borderBottom: 'none' },
  };

  const renderContent = () => {
    const content = interaction.content;
    switch (interaction.type) {
      case 'match_summary':
        const match = matches.find(m => m.id === content.matchId);
        return <p><strong>Partido del {match ? new Date(match.date).toLocaleDateString() : 'N/A'}:</strong> "{content.summary}"</p>;
      case 'highlight_analysis':
        return (
          <ul>
            {(content as AIHighlight[]).map((h, i) => (
              <li key={i} style={{...styles.listItem, ...(i === (content as AIHighlight[]).length - 1 && styles.lastListItem)}}><strong>{h.title}:</strong> {h.reason}</li>
            ))}
          </ul>
        );
      case 'coach_insight':
        return (
          <ul>
            <li style={styles.listItem}><strong>Tendencia Positiva:</strong> {(content as CoachingInsight).positiveTrend}</li>
            <li style={{...styles.listItem, ...styles.lastListItem}}><strong>Área de Mejora:</strong> {(content as CoachingInsight).areaForImprovement}</li>
          </ul>
        );
      case 'consistency_analysis':
        return <p><strong>Análisis ({content.period === 'all' ? 'Historial Completo' : content.period}):</strong> "{content.analysis}"</p>;
      case 'goal_suggestion':
        return (
            <ul>
              {(content as AIGoalSuggestion[]).map((s, i) => (
                <li key={i} style={{...styles.listItem, ...(i === (content as AIGoalSuggestion[]).length - 1 && styles.lastListItem)}}><strong>{s.title}:</strong> {s.description}</li>
              ))}
            </ul>
          );
      case 'achievement_suggestion':
        return (
            <ul>
              {(content as AIAchievementSuggestion[]).map((s, i) => (
                <li key={i} style={{...styles.listItem, ...(i === (content as AIAchievementSuggestion[]).length - 1 && styles.lastListItem)}}><strong>{s.icon} {s.title}:</strong> {s.description}</li>
              ))}
            </ul>
          );
      case 'match_headline':
        const headlineMatch = matches.find(m => m.id === content.matchId);
        return <p><strong>Partido del {headlineMatch ? new Date(headlineMatch.date).toLocaleDateString() : 'N/A'}:</strong> "{content.headline}"</p>
      case 'player_comparison':
        const { players, context, analysis } = content;
        const playerNames = players.join(' vs ');
        const contextText = context === 'teammates' ? 'compañeros' : 'rivales';
        return (
            <>
                <p style={{ margin: 0 }}><strong>Comparativa ({contextText}): {playerNames}</strong></p>
                <p style={{ fontStyle: 'italic', marginTop: theme.spacing.small }}>"{analysis}"</p>
            </>
        );
      default:
        return <p>{JSON.stringify(content)}</p>;
    }
  };

  return (
    <Card>
      <div style={styles.header}>
        <span>{icon}</span>
        <div>
          <h4 style={styles.title}>{title}</h4>
          <p style={styles.date}>{new Date(interaction.date).toLocaleString(undefined, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
      <div style={styles.content}>
        {renderContent()}
      </div>
    </Card>
  );
};

export default AIInteractionCard;