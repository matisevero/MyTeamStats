import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ value, onChange, suggestions, placeholder }) => {
  const { theme } = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    suggestion =>
      suggestion.toLowerCase().indexOf(value.toLowerCase()) > -1 &&
      suggestion.toLowerCase() !== value.toLowerCase()
  );

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };
  
  const styles: { [key: string]: React.CSSProperties } = {
    container: { position: 'relative', width: '100%' },
    input: {
      width: '100%', boxSizing: 'border-box', padding: theme.spacing.small, backgroundColor: theme.colors.background,
      border: `1px solid ${theme.colors.borderStrong}`, borderRadius: theme.borderRadius.medium, color: theme.colors.primaryText,
      fontSize: theme.typography.fontSize.small,
    },
    suggestionsList: {
      position: 'absolute', top: '100%', left: 0, right: 0,
      backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.borderRadius.medium, zIndex: 10,
      listStyle: 'none', margin: `${theme.spacing.extraSmall} 0 0 0`, padding: 0,
      maxHeight: '150px', overflowY: 'auto',
      boxShadow: theme.shadows.large,
    },
    suggestionItem: {
      padding: theme.spacing.small, cursor: 'pointer',
      fontSize: theme.typography.fontSize.small,
      color: theme.colors.primaryText,
    },
  };

  const suggestionsToShow = (value ? filteredSuggestions : suggestions).slice(0, 5);

  return (
    <div style={styles.container}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
        placeholder={placeholder}
        style={styles.input}
        autoComplete="off"
      />
      {showSuggestions && suggestionsToShow.length > 0 && (
        <ul style={styles.suggestionsList}>
          {suggestionsToShow.map((suggestion, index) => (
            <li
              key={index}
              style={styles.suggestionItem}
              onMouseDown={() => handleSuggestionClick(suggestion)} // use onMouseDown to fire before onBlur
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
