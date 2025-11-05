import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ChartData {
  match: number;
  goals: number;
  assists: number;
}

interface PerformanceTrendChartProps {
  data: ChartData[];
}

const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = ({ data }) => {
  const { theme } = useTheme();

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      backgroundColor: theme.colors.surface, padding: '1.5rem',
      borderRadius: '12px', border: `1px solid ${theme.colors.border}`,
    },
    noDataText: {
      color: theme.colors.secondaryText, fontStyle: 'italic', textAlign: 'center',
      margin: '1rem 0', minHeight: '200px', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    },
    legend: {
      display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
      gap: '1.5rem', marginTop: '1rem',
    },
    legendItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    legendColorBox: { width: '14px', height: '14px', borderRadius: '4px' },
    legendLabel: { fontSize: '0.875rem', color: theme.colors.primaryText },
  };

  if (data.length < 2) {
    return (
      <div style={styles.container}>
        <p style={styles.noDataText}>Se necesitan al menos 2 partidos para mostrar una tendencia.</p>
      </div>
    );
  }

  const SvgWidth = 500;
  const SvgHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = SvgWidth - padding.left - padding.right;
  const chartHeight = SvgHeight - padding.top - padding.bottom;

  const maxX = data.length;
  const maxY = Math.max(...data.map(d => d.goals), ...data.map(d => d.assists), 1);

  const getX = (index: number) => padding.left + (index / (maxX - 1)) * chartWidth;
  const getY = (value: number) => SvgHeight - padding.bottom - (value / maxY) * chartHeight;

  // Calculate all points once for efficiency
  const calculatedPoints = data.map((d, i) => ({
    x: getX(i),
    goalY: getY(d.goals),
    assistY: getY(d.assists),
  }));

  const goalPoints = calculatedPoints.map(p => `${p.x},${p.goalY}`).join(' ');
  const assistPoints = calculatedPoints.map(p => `${p.x},${p.assistY}`).join(' ');

  const yAxisLabels = [];
  const numYLabels = 5;
  for (let i = 0; i <= numYLabels; i++) {
    const value = Math.round((maxY / numYLabels) * i);
    yAxisLabels.push(value);
  }

  return (
    <div style={styles.container}>
      <svg viewBox={`0 0 ${SvgWidth} ${SvgHeight}`} style={{ width: '100%', height: 'auto' }}>
        {yAxisLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={padding.left} y1={getY(label)}
              x2={SvgWidth - padding.right} y2={getY(label)}
              stroke={theme.colors.border} strokeWidth="1"
            />
            <text x={padding.left - 8} y={getY(label) + 4} fill={theme.colors.secondaryText} fontSize="14" textAnchor="end">
              {label}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          if (i === 0 || i === data.length - 1 || (data.length > 10 && i % Math.floor(data.length/5) === 0) || (data.length <=10 && i % 2 === 0)) {
            return (
              <text key={i} x={getX(i)} y={SvgHeight - padding.bottom + 15} fill={theme.colors.secondaryText} fontSize="14" textAnchor="middle">
                P{d.match}
              </text>
            )
          }
          return null;
        })}
        <text x={(SvgWidth + padding.left - padding.right)/2} y={SvgHeight - 5} fill={theme.colors.secondaryText} fontSize="16" textAnchor="middle">Partidos</text>

        <polyline points={goalPoints} fill="none" stroke={theme.colors.accent1} strokeWidth="2" />
        <polyline points={assistPoints} fill="none" stroke={theme.colors.accent2} strokeWidth="2" />

        {calculatedPoints.map((p, i) => (
          <React.Fragment key={i}>
            <circle cx={p.x} cy={p.goalY} r="3" fill={theme.colors.accent1} stroke={theme.colors.surface} strokeWidth="1" />
            <circle cx={p.x} cy={p.assistY} r="3" fill={theme.colors.accent2} stroke={theme.colors.surface} strokeWidth="1" />
          </React.Fragment>
        ))}
      </svg>
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendColorBox, backgroundColor: theme.colors.accent1 }} />
          <span style={styles.legendLabel}>Goles Acumulados</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendColorBox, backgroundColor: theme.colors.accent2 }} />
          <span style={styles.legendLabel}>Asistencias Acumuladas</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrendChart;