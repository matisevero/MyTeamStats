import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: ChartSegment[];
}

const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const { theme } = useTheme();

  // Filter out data with 0 value to not render them in the chart or legend
  const validData = data.filter(item => item.value > 0);
  const total = validData.reduce((sum, item) => sum + item.value, 0);

  const styles: { [key: string]: React.CSSProperties } = {
    chartContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' },
    chartWrapper: { position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    centerText: { position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column' },
    totalValue: { fontSize: '3rem', fontWeight: 900, color: theme.colors.primaryText },
    totalLabel: { fontSize: '0.8rem', color: theme.colors.secondaryText, textTransform: 'uppercase' },
    legend: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    legendColorBox: { width: '14px', height: '14px', borderRadius: '4px' },
    legendLabel: { fontSize: '0.875rem', color: theme.colors.primaryText },
  };

  if (total === 0) {
    return (
      <div style={styles.chartWrapper}>
        <svg viewBox="0 0 100 100" width="150" height="150">
          <circle cx="50" cy="50" r="45" fill="none" stroke={theme.colors.border} strokeWidth="10" />
        </svg>
        <div style={styles.centerText}>
          <span style={styles.totalValue}>0</span>
          <span style={styles.totalLabel}>Partidos</span>
        </div>
      </div>
    );
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let accumulatedLength = 0;

  return (
    <div style={styles.chartContainer}>
      <div style={styles.chartWrapper}>
        <svg viewBox="0 0 100 100" width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background/track circle, ensuring the chart always looks "full" */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke={theme.colors.border} strokeWidth="10" />
          
          {validData.map((item, index) => {
            const segmentLength = (item.value / total) * circumference;
            // Keyframes will be generated for each segment, which is slightly inefficient but works in this context.
            const animationKeyframes = `
              @keyframes draw-segment-${index} {
                from { 
                  stroke-dasharray: 0 ${circumference};
                }
                to { 
                  stroke-dasharray: ${segmentLength} ${circumference};
                }
              }
            `;
            const segmentStyle: React.CSSProperties = {
              strokeDasharray: `0 ${circumference}`, // Initial state for animation
              strokeDashoffset: -accumulatedLength,
              animation: `draw-segment-${index} 0.8s ${index * 0.15}s ease-out forwards`,
            };
            
            accumulatedLength += segmentLength;
            
            return (
              <React.Fragment key={index}>
                <style>{animationKeyframes}</style>
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="10"
                  strokeLinecap="round" // Use "round" for a nicer look between segments
                  style={segmentStyle}
                />
              </React.Fragment>
            );
          })}
        </svg>
        <div style={styles.centerText}>
          <span style={styles.totalValue}>{total}</span>
          <span style={styles.totalLabel}>Partidos</span>
        </div>
      </div>
      <div style={styles.legend}>
        {validData.map((item, index) => (
          <div key={index} style={styles.legendItem}>
            <span style={{ ...styles.legendColorBox, backgroundColor: item.color }} />
            <span style={styles.legendLabel}>{item.label} ({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;