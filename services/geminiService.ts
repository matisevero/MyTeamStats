import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import type { Match, AIHighlight, CoachingInsight, SquadPlayerStats, Achievement, CustomAchievement, AIAchievementSuggestion, PlayerContextStats } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (ai) return ai;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key is missing. AI features will be disabled.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
    return ai;
}

export const generateHighlightsSummary = async (matches: Match[]): Promise<Omit<AIHighlight, 'match'>[]> => {
    const aiInstance = getAI();
    if (!aiInstance) throw new Error("La IA no está configurada.");
    if (matches.length < 3) throw new Error("Se necesitan al menos 3 partidos para generar un análisis.");
    
    const matchesPayload = JSON.stringify(
        matches.map(({ id, date, result, teamScore, opponentScore }) => ({ id, date, result, teamScore, opponentScore }))
    );

    const prompt = `
        Actúa como un analista de datos deportivos experto. A continuación, te proporciono una lista de los partidos de un equipo de fútbol en formato JSON. Tu tarea es analizar estos datos e identificar un máximo de 3 partidos destacados.
        Para cada partido destacado, proporciona un título creativo, una breve explicación (1-2 frases) de por qué es notable, y el 'id' del partido correspondiente.
        Considera destacar partidos por razones como: una gran victoria, una remontada épica, la mayor goleada, un partido con muchos goles, etc.
        Datos de los partidos:
        ${matchesPayload}
        Devuelve tu análisis SÓLO como un objeto JSON que se ajuste al esquema proporcionado.
    `;

    try {
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { highlights: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { matchId: { type: Type.STRING }, title: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["matchId", "title", "reason"] } } }
                }
            }
        });
        
        // @google/genai-sdk: Accessing .text directly as per guidelines.
        const text = response.text.trim();
        if (!text) {
            return [];
        }
        const jsonResponse = JSON.parse(text);
        return jsonResponse.highlights || [];
    } catch (error) {
        console.error("Gemini API call for highlights failed:", error);
        throw new Error("Failed to communicate with the AI model for analysis.");
    }
};

export const generateCoachingInsight = async (matches: Match[]): Promise<CoachingInsight> => {
    const aiInstance = getAI();
    if (!aiInstance) throw new Error("La IA no está configurada.");
    if (matches.length < 5) throw new Error("Se necesitan al menos 5 partidos para una perspectiva.");

    const matchesPayload = JSON.stringify(matches.map(({ date, result, teamScore, opponentScore }) => ({ date, result, teamScore, opponentScore })));
    const prompt = `
        Actúa como un entrenador de fútbol. Analiza el historial de partidos del equipo y proporciona una perspectiva concisa.
        Identifica UNA tendencia positiva clave y UN área principal para la mejora a nivel de equipo (ataque, defensa, consistencia, etc.).
        Datos: ${matchesPayload}
        Devuelve tu análisis SÓLO como un objeto JSON.
    `;

    try {
        // FIX: The error indicates a variable naming inconsistency. Ensuring the variable is named `response` to align with guidelines and fix the "Cannot find name 'response'" error.
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: { positiveTrend: { type: Type.STRING }, areaForImprovement: { type: Type.STRING } }, required: ["positiveTrend", "areaForImprovement"]
                }
            }
        });
        // @google/genai-sdk: Accessing .text directly as per guidelines.
        const text = response.text.trim();
        if (!text) {
          throw new Error("Empty response from AI for coaching insight.");
        }
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini API call for coaching insight failed:", error);
        throw new Error("No se pudo obtener la perspectiva del entrenador.");
    }
};

export const generateMatchHeadline = async (match: Match): Promise<string> => {
  const aiInstance = getAI();
  if (!aiInstance) throw new Error("La IA no está configurada.");

  const { result, teamScore, opponentScore } = match;

  const prompt = `
    Actúa como un periodista deportivo. Crea un titular de no más de 5 palabras para un partido de fútbol con los siguientes detalles. Debe ser pegadizo y emocionante.
    - Resultado: ${result}
    - Marcador: ${teamScore} - ${opponentScore}

    INSTRUCCIONES ESTRICTAS:
    1. Responde ÚNICAMENTE con el titular. Sin introducciones.
    2. Máximo 5 palabras.
    3. NO uses comillas en la respuesta.
  `;

  try {
    // FIX: Renamed variable to `response` for consistency with API guidelines.
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
      }
    });
    
    // @google/genai-sdk: Accessing .text directly as per guidelines.
    return response.text.trim().replace(/["']/g, '') || '';

  } catch (error) {
    console.error("Gemini API call for headline failed:", error);
    throw new Error("Failed to communicate with the AI model for a headline.");
  }
};

export const startChatSession = (matches: Match[]): Chat | null => {
  const aiInstance = getAI();
  if (!aiInstance) {
    return null;
  }

  const matchesContext = matches.slice(0, 20).reverse().map(m => 
    `- ${m.date}: ${m.result}, Marcador: ${m.teamScore}-${m.opponentScore}${m.notes ? `, Notas: ${m.notes}` : ''}`
  ).join('\n');

  const chat = aiInstance.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `Eres un entrenador de fútbol y analista de rendimiento para un equipo amateur. Te he proporcionado un historial de los partidos recientes del equipo. Tu tarea es responder a las preguntas del mánager, ofrecer análisis tácticos, identificar tendencias de equipo (fortalezas defensivas, debilidades en ataque, etc.) y dar consejos constructivos para ayudar al equipo a mejorar. Sé perspicaz, motivador y utiliza los datos proporcionados para respaldar tus respuestas. Aquí está el historial de partidos:\n${matchesContext}`
    }
  });

  return chat;
};

export const generateCreativeGoalTitle = async (metric: string, target: number, period: string): Promise<string> => {
  const aiInstance = getAI();
  if (!aiInstance) return `${metric}: ${target}`;

  const prompt = `
    Actúa como un redactor creativo. Crea un título corto, motivador y emocionante para un objetivo de fútbol personal. Máximo 5 palabras.
    El objetivo es: alcanzar ${target} ${metric} durante ${period}.

    Ejemplos de respuesta:
    - "Muro de Acero"
    - "Rey de la Asistencia"
    - "Temporada Goleadora"
    - "Racha Imparable"

    INSTRUCCIONES ESTRICTAS:
    1. Responde ÚNICAMENTE con el título. Sin introducciones.
    2. Máximo 5 palabras.
    3. NO uses comillas en la respuesta.
  `;

  try {
    // FIX: Renamed variable to `response` for consistency with API guidelines.
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });
    // @google/genai-sdk: Accessing .text directly as per guidelines.
    return response.text.trim().replace(/["']/g, '') || `${metric}: ${target}`;
  } catch (error) {
    console.error("Gemini API call for goal title failed:", error);
    return `${metric}: ${target}`;
  }
};

export const generatePlayerComparisonAnalysis = async (players: { name: string; stats: PlayerContextStats; context: 'teammates' | 'opponents' }[]): Promise<string> => {
    const aiInstance = getAI();
    if (!aiInstance) throw new Error("AI is not configured.");
    
    const playersPayload = players.map(p => {
        const contextText = p.context === 'teammates' ? 'como compañeros' : 'como rivales';
        return `
- Jugador: ${p.name} (${contextText})
  - Partidos: ${p.stats.matchesPlayed}
  - Récord: ${p.stats.record.wins}V-${p.stats.record.draws}E-${p.stats.record.losses}D
  - Goles/Partido: ${p.stats.gpm.toFixed(2)}
  - Asist./Partido: ${p.stats.apm.toFixed(2)}
  - % Victorias: ${p.stats.winRate.toFixed(1)}%
    `;
    }).join('');

    const prompt = `
        Actúa como un analista de fútbol experto. Compara el rendimiento de los siguientes jugadores basándote en sus estadísticas.
        Proporciona un análisis conciso (2-3 frases) destacando las fortalezas de cada uno y quién parece tener un mayor impacto general en el resultado del equipo.
        
        Datos de los jugadores:
        ${playersPayload}

        Sé directo y perspicaz en tu análisis.
    `;

    try {
        // FIX: Renamed variable to `response` for consistency with API guidelines.
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.6,
            }
        });
        // @google/genai-sdk: Accessing .text directly as per guidelines.
        return response.text.trim() || '';
    } catch (error) {
        console.error("Gemini API call for player comparison failed:", error);
        throw new Error("Failed to generate player comparison analysis.");
    }
};

export const generateConsistencyAnalysis = async (contributions: number[]): Promise<string> => {
    const aiInstance = getAI();
    if (!aiInstance) throw new Error("AI is not configured.");

    const contributionsPayload = contributions.join(', ');
    const average = (contributions.reduce((a, b) => a + b, 0) / contributions.length).toFixed(2);
    
    const prompt = `
        Actúa como un analista de rendimiento. A continuación te doy una serie de contribuciones ofensivas (goles + asistencias) de un jugador/equipo en los últimos partidos:
        [${contributionsPayload}]

        El promedio de contribución es ${average}.

        Analiza la consistencia de este rendimiento en 1-2 frases. ¿Es un rendimiento regular y estable, o es un rendimiento de rachas con picos altos y bajos?
        Da una conclusión clara.
    `;

    try {
        // FIX: Renamed variable to `response` for consistency with API guidelines.
        const response = await aiInstance.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
            }
        });
        // @google/genai-sdk: Accessing .text directly as per guidelines.
        return response.text.trim() || '';
    } catch (error) {
        console.error("Gemini API call for consistency analysis failed:", error);
        throw new Error("Failed to generate consistency analysis.");
    }
};

export const generateAchievementSuggestions = async (matches: Match[], existingAchievements: (Achievement | CustomAchievement)[]): Promise<AIAchievementSuggestion[]> => {
    const aiInstance = getAI();
    if (!aiInstance) throw new Error("AI is not configured.");
    if (matches.length < 5) return [];

    const statsSummary = `El equipo ha jugado ${matches.length} partidos. Goles totales: ${matches.reduce((s, m) => s + m.myGoals, 0)}. Asistencias totales: ${matches.reduce((s, m) => s + m.myAssists, 0)}.`;
    const existingTitles = existingAchievements.map(a => a.title).join(', ');

    const prompt = `
      Actúa como un gamification designer y entrenador de fútbol. Basado en el resumen de estadísticas de un equipo, sugiere 2 desafíos creativos y alcanzables para motivarlos.
      Estadísticas: ${statsSummary}.
      Desafíos existentes: ${existingTitles}.
      No repitas ideas de los desafíos existentes.
      
      Para cada sugerencia, proporciona un 'title' (título corto y motivador), 'description' (una frase explicando el desafío), un 'icon' (un solo emoji), y la 'condition' (un objeto JSON que defina la regla).
      
      La 'condition' debe tener:
      - "metric": una de ['winStreak', 'undefeatedStreak', 'goalStreak', 'assistStreak', 'breakWinAfterLossStreak'].
      - "operator": siempre "greater_than_or_equal_to".
      - "value": el número objetivo para la métrica (ej. 3 para una racha de 3 victorias).
      - "window": el número de partidos recientes donde se debe cumplir la condición (para rachas, debería ser igual a 'value').
      
      Ejemplo de 'breakWinAfterLossStreak': Consigue una victoria justo después de una racha de 'value' o más derrotas.
      
      Devuelve tu análisis SÓLO como un objeto JSON que se ajuste al esquema proporcionado.
    `;

    try {
      // FIX: Renamed variable to `response` for consistency with API guidelines.
      const response = await aiInstance.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    condition: {
                      type: Type.OBJECT,
                      properties: {
                        metric: { type: Type.STRING },
                        operator: { type: Type.STRING },
                        value: { type: Type.NUMBER },
                        window: { type: Type.NUMBER },
                      },
                      required: ["metric", "operator", "value", "window"]
                    }
                  },
                  required: ["title", "description", "icon", "condition"]
                }
              }
            }
          }
        }
      });
      // @google/genai-sdk: Accessing .text directly as per guidelines.
      const text = response.text.trim();
      if (!text) {
        return [];
      }
      const jsonResponse = JSON.parse(text);
      return jsonResponse.suggestions || [];
    } catch (error) {
      console.error("Gemini API call for achievement suggestions failed:", error);
      throw new Error("Failed to get AI suggestions.");
    }
};