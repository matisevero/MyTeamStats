import type { Achievement, HistoricalRecords, Match } from '../types';
import { MoraleLevel } from '../types';
import { calculateTeamMorale } from '../utils/analytics';

export const achievementsList: Achievement[] = [
  // === Goals ===
  {
    id: 'goleador',
    title: 'Goleador',
    description: 'Alcanza diferentes hitos de goles marcados a lo largo de tu carrera.',
    progress: (matches) => matches.reduce((sum, m) => sum + m.myGoals, 0),
    tiers: [
      { name: 'Bronce', target: 10, icon: '🥉' },
      { name: 'Plata', target: 50, icon: '🥈' },
      { name: 'Oro', target: 100, icon: '🥇' },
      { name: 'Platino', target: 250, icon: '🏆' },
    ],
  },
  // === Assists ===
  {
    id: 'playmaker',
    title: 'Playmaker',
    description: 'Conviértete en un maestro de las asistencias.',
    progress: (matches) => matches.reduce((sum, m) => sum + m.myAssists, 0),
    tiers: [
      { name: 'Bronce', target: 10, icon: '🥉' },
      { name: 'Plata', target: 50, icon: '🥈' },
      { name: 'Oro', target: 100, icon: '🥇' },
      { name: 'Platino', target: 250, icon: '🏆' },
    ],
  },
  // === Wins ===
  {
    id: 'victorias',
    title: 'Ganador Nato',
    description: 'Acumula victorias y forja una mentalidad ganadora.',
    progress: (matches) => matches.filter(m => m.result === 'VICTORIA').length,
    tiers: [
      { name: 'Bronce', target: 5, icon: '🥉' },
      { name: 'Plata', target: 25, icon: '🥈' },
      { name: 'Oro', target: 50, icon: '🥇' },
      { name: 'Platino', target: 100, icon: '🏆' },
    ],
  },
  // === Streaks ===
  {
    id: 'win_streak',
    title: 'Imparable',
    description: 'Consigue una racha de victorias consecutivas.',
    progress: (matches, records) => records.longestWinStreak.value,
    tiers: [
      { name: 'Bronce', target: 3, icon: '🥉' },
      { name: 'Plata', target: 5, icon: '🥈' },
      { name: 'Oro', target: 10, icon: '🥇' },
    ],
  },
  {
    id: 'undefeated_streak',
    title: 'Fortaleza',
    description: 'Mantente invicto durante una racha de partidos.',
    progress: (matches, records) => records.longestUndefeatedStreak.value,
    tiers: [
      { name: 'Bronce', target: 5, icon: '🥉' },
      { name: 'Plata', target: 7, icon: '🥈' },
      { name: 'Oro', target: 12, icon: '🥇' },
    ],
  },
  // === Single Match Performance ===
  {
    id: 'hat_trick',
    title: 'Hat-Trick Hero',
    description: 'Marca 3 o más goles en un solo partido.',
    progress: (matches, records) => records.bestGoalPerformance.value,
    tiers: [
      { name: 'Hat-Trick', target: 3, icon: '⚽⚽⚽' },
    ],
  },
  {
    id: 'assist_masterclass',
    title: 'Visión de Juego',
    description: 'Da 3 o más asistencias en un solo partido.',
    progress: (matches, records) => records.bestAssistPerformance.value,
    tiers: [
      { name: 'Playmaker', target: 3, icon: '👟👟👟' },
    ],
  },
  // === Secret Achievements ===
  {
    id: 'resilience',
    title: 'Resiliencia',
    description: 'Consigue una victoria justo después de tocar fondo con tu moral.',
    isSecret: true,
    progress: (matches) => {
      if (matches.length < 5) return 0;
      const sorted = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Check if the condition was ever met in the player's history
      for (let i = 4; i < sorted.length; i++) {
        const currentMatch = sorted[i];
        if(currentMatch.result === 'VICTORIA') {
          const matchesBefore = sorted.slice(0, i);
          const moraleCheck = calculateTeamMorale(matchesBefore);
          if(moraleCheck && moraleCheck.level === MoraleLevel.DESCONOCIDO) {
            return 1; // It was unlocked at some point.
          }
        }
      }
      return 0;
    },
    tiers: [
      { name: 'Desbloqueado', target: 1, icon: '💪' },
    ],
  },
];