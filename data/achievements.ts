import type { Achievement, HistoricalRecords, Match } from '../types';
import { MoraleLevel } from '../types';
import { calculateTeamMorale } from '../utils/analytics';

export const achievementsList: Achievement[] = [
  // === Team Defense ===
  {
    id: 'iron_curtain',
    title: 'Muralla Defensiva',
    description: 'Acumula partidos manteniendo el arco en cero (Valla Invicta).',
    progress: (matches) => matches.filter(m => m.opponentScore === 0).length,
    tiers: [
      { name: 'Candado', target: 5, icon: '🔒' },
      { name: 'Muralla', target: 15, icon: '🧱' },
      { name: 'Fortaleza', target: 30, icon: '🏰' },
      { name: 'Invencibles', target: 50, icon: '🛡️' },
    ],
  },
  // === Team Offense ===
  {
    id: 'team_goals',
    title: 'Poder de Fuego',
    description: 'Suma goles a favor en la historia del equipo.',
    progress: (matches) => matches.reduce((sum, m) => sum + m.teamScore, 0),
    tiers: [
      { name: 'Amenaza', target: 50, icon: '💣' },
      { name: 'Artillería', target: 100, icon: '💥' },
      { name: 'Aplanadora', target: 250, icon: '🚜' },
      { name: 'Legendarios', target: 500, icon: '🔥' },
    ],
  },
  // === Streaks ===
  {
    id: 'win_streak',
    title: 'Ola Ganadora',
    description: 'Consigue la mayor racha de victorias consecutivas.',
    progress: (matches, records) => records.longestWinStreak.value,
    tiers: [
      { name: 'Racha', target: 3, icon: '🌊' },
      { name: 'Imparables', target: 5, icon: '🚀' },
      { name: 'Dinastía', target: 10, icon: '👑' },
    ],
  },
  {
    id: 'undefeated_streak',
    title: 'Duros de Matar',
    description: 'Mantengan el invicto (sin perder) durante una serie de partidos.',
    progress: (matches, records) => records.longestUndefeatedStreak.value,
    tiers: [
      { name: 'Sólidos', target: 5, icon: '✊' },
      { name: 'Rocosos', target: 10, icon: '🗿' },
      { name: 'Eternos', target: 20, icon: '♾️' },
    ],
  },
  // === Match Milestones ===
  {
    id: 'goal_fest',
    title: 'Fiesta de Goles',
    description: 'Marca una gran cantidad de goles en un solo partido.',
    progress: (matches, records) => records.bestOffensivePerformance.value,
    tiers: [
      { name: 'Mano', target: 5, icon: '🖐️' },
      { name: 'Siete Bravo', target: 7, icon: '🎰' },
      { name: 'Decena', target: 10, icon: '🔟' },
    ],
  },
  {
    id: 'big_win',
    title: 'Paliza Táctica',
    description: 'Gana un partido por una amplia diferencia de goles.',
    progress: (matches, records) => records.biggestWin.value,
    tiers: [
      { name: 'Superioridad', target: 3, icon: '⚡' },
      { name: 'Baile', target: 5, icon: '💃' },
      { name: 'Histórico', target: 7, icon: '🏛️' },
    ],
  },
  // === Spirit & Resilience ===
  {
    id: 'resilience',
    title: 'Espíritu de Equipo',
    description: 'Consigue una victoria justo después de tocar fondo anímicamente.',
    isSecret: true,
    progress: (matches) => {
      if (matches.length < 5) return 0;
      const sorted = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Check if the condition was ever met in the team's history
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
      { name: 'Resiliencia', target: 1, icon: 'phoenix' }, // Using text as placeholder for specialized icon logic if needed, or just emoji
    ],
  },
];