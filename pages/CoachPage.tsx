import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { startChatSession } from '../services/geminiService';
import { Loader } from '../components/Loader';
import type { Chat } from '@google/genai';
import AIInteractionCard from '../components/AIInteractionCard';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const CoachPage: React.FC = () => {
  const { theme } = useTheme();
  const { matches, aiInteractions, isShareMode } = useData();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matches.length > 0) {
        try {
            const chatSession = startChatSession(matches);
            if (chatSession) {
                setChat(chatSession);
                setMessages([{ role: 'model', text: '¡Hola! Soy tu entrenador de IA. He analizado el historial de partidos de tu equipo. ¿Sobre qué te gustaría hablar?' }]);
                setError(null);
            } else {
                setError("El servicio de IA no está configurado. Por favor, añade una clave de API.");
            }
        } catch (e: any) {
            setError(`Error al iniciar el chat: ${e.message}`);
        }
    }
  }, [matches]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: input });
      const modelMessage: Message = { role: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { role: 'model', text: 'Lo siento, he tenido un problema al procesar tu solicitud. Inténtalo de nuevo.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: `${theme.spacing.extraLarge} ${theme.spacing.medium}`, display: 'flex', flexDirection: 'column', gap: theme.spacing.extraLarge },
    pageTitle: {
      fontSize: theme.typography.fontSize.extraLarge, fontWeight: 700, color: theme.colors.primaryText,
      margin: 0, borderLeft: `4px solid ${theme.colors.accent2}`, paddingLeft: theme.spacing.medium,
    },
    chatWindow: {
      height: '60vh',
      backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large,
      boxShadow: theme.shadows.large, border: `1px solid ${theme.colors.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    messagesContainer: {
      flex: 1, padding: theme.spacing.large, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: theme.spacing.large,
    },
    messageBubble: { padding: `${theme.spacing.medium} ${theme.spacing.large}`, borderRadius: theme.borderRadius.large, maxWidth: '80%', lineHeight: 1.6 },
    userMessage: { backgroundColor: theme.colors.accent2, color: theme.colors.textOnAccent, alignSelf: 'flex-end', borderRadius: `${theme.borderRadius.large} ${theme.borderRadius.large} 0 ${theme.borderRadius.large}` },
    modelMessage: { backgroundColor: theme.colors.background, color: theme.colors.primaryText, alignSelf: 'flex-start', borderRadius: `${theme.borderRadius.large} ${theme.borderRadius.large} ${theme.borderRadius.large} 0` },
    inputForm: { display: 'flex', padding: theme.spacing.medium, borderTop: `1px solid ${theme.colors.border}`, gap: theme.spacing.medium },
    input: {
      flex: 1, padding: theme.spacing.medium, backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium,
      color: theme.colors.primaryText, fontSize: theme.typography.fontSize.medium, outline: 'none',
    },
    button: {
      padding: `${theme.spacing.medium} ${theme.spacing.large}`, backgroundColor: theme.colors.accent2,
      color: theme.colors.textOnAccent, border: 'none', borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.medium, fontWeight: 'bold', cursor: 'pointer',
    },
    historyContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.medium,
    },
     errorText: { color: theme.colors.loss, textAlign: 'center', padding: '1rem', backgroundColor: `${theme.colors.loss}20`, borderRadius: theme.borderRadius.medium},
  };

  return (
    <main style={styles.container}>
      <h2 style={styles.pageTitle}>Pizarra del Entrenador IA</h2>
      <div style={styles.chatWindow}>
        <div style={styles.messagesContainer}>
          {error && <p style={styles.errorText}>{error}</p>}
          {messages.map((msg, index) => (
            <div key={index} style={ msg.role === 'user' ? { ...styles.messageBubble, ...styles.userMessage } : { ...styles.messageBubble, ...styles.modelMessage }}>
              {msg.text}
            </div>
          ))}
          {isLoading && (
            <div style={{ ...styles.messageBubble, ...styles.modelMessage, display: 'flex', gap: theme.spacing.medium, alignItems: 'center' }}>
              <Loader /><span>Pensando...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            style={styles.input} placeholder={isShareMode ? "Chat desactivado en modo de solo lectura" : (error ? "Chat no disponible" : "Pregunta sobre el rendimiento del equipo...")} disabled={isLoading || matches.length === 0 || !!error || isShareMode}
          />
          <button type="submit" style={styles.button} disabled={isLoading || matches.length === 0 || !!error || isShareMode}>Enviar</button>
        </form>
      </div>
      
      <div>
        <h3 style={{ ...styles.pageTitle, fontSize: '1.5rem' }}>Historial de interacciones con IA</h3>
        {aiInteractions.length > 0 ? (
            <div style={styles.historyContainer}>
                {aiInteractions.map(interaction => (
                    <AIInteractionCard key={interaction.id} interaction={interaction} />
                ))}
            </div>
        ) : (
            <p style={{ color: theme.colors.secondaryText, textAlign: 'center', padding: '2rem', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.large, border: `1px dashed ${theme.colors.border}` }}>
                Aquí aparecerán todos los análisis que generes con la IA en la aplicación.
            </p>
        )}
      </div>
    </main>
  );
};

export default CoachPage;