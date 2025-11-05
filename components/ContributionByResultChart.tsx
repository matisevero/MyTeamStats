import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ChartData {
  result: string;
  goalsFor: number;
  goalsAgainst: number;
}

interface ContributionByResultChartProps {
  data: ChartData[];
}

const ContributionByResultChart: React.FC<ContributionByResultChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const [activeValue, setActiveValue] = useState<{ key: string, value: number, x: number, y: number } | null>(null);

  useEffect(() => {
    if (activeValue) {
      const timer = setTimeout(() => setActiveValue(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [activeValue]);


  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      padding: '1.5rem 0 0 0',
    },
    legend: {
      display: 'flex', justifyContent: 'center', gap: '1.5rem',
      marginTop: '1rem', fontSize: '0.875rem', color: theme.colors.primaryText,
    },
    legendItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    legendColorBox: { width: '14px', height: '14px', borderRadius: '4px' },
  };

  const SvgWidth = 500;
  const SvgHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = SvgWidth - padding.left - padding.right;
  const chartHeight = SvgHeight - padding.top - padding.bottom;

  const allValues = data.flatMap(d => [d.goalsFor, d.goalsAgainst]);
  const maxY = Math.max(...allValues, 1);
  
  const barGroupWidth = chartWidth / data.length;
  const barWidth = barGroupWidth * 0.35;

  return (
    <>
      <style>{`
          @keyframes pop-up-value {
              from { opacity: 0; transform: translateY(5px) scale(0.9); }
              to { opacity: 1; transform: translateY(0) scale(1); }
          }
      `}</style>
      <div style={styles.container}>
        <svg viewBox={`0 0 ${SvgWidth} ${SvgHeight}`} style={{ width: '100%', height: 'auto' }}>
          {/* Y-axis grid and labels */}
          {[...Array(6)].map((_, i) => {
            const y = padding.top + (chartHeight / 5) * i;
            const value = parseFloat((maxY - (maxY / 5) * i).toFixed(1));
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={SvgWidth - padding.right} y2={y} stroke={theme.colors.border} />
                <text x={padding.left - 8} y={y + 4} fill={theme.colors.secondaryText} fontSize="10" textAnchor="end">{value}</text>
              </g>
            );
          })}

          {/* Bars and X-axis labels */}
          {data.map((d, i) => {
            const groupX = padding.left + barGroupWidth * i;
            const x1 = groupX + (barGroupWidth * 0.15);
            const x2 = x1 + barWidth;

            const goalsForHeight = (d.goalsFor / maxY) * chartHeight;
            const goalsAgainstHeight = (d.goalsAgainst / maxY) * chartHeight;
            
            const y1 = SvgHeight - padding.bottom - goalsForHeight;
            const y2 = SvgHeight - padding.bottom - goalsAgainstHeight;

            const handleBarClick = (key: string, value: number, barX: number, barY: number, barHeight: number) => {
                if (value > 0) {
                    setActiveValue({ key, value: Math.round(value * 100) / 100, x: barX + barWidth / 2, y: barY - 15 });
                }
            };

            return (
              <g key={d.result}>
                {/* Goal For Bar */}
                <rect x={x1} y={y1} width={barWidth} height={goalsForHeight} fill={theme.colors.win} cursor={d.goalsFor > 0 ? "pointer" : "default"} onClick={() => handleBarClick(`${d.result}-for`, d.goalsFor, x1, y1, goalsForHeight)} />
                {/* Goal Against Bar */}
                <rect x={x2} y={y2} width={barWidth} height={goalsAgainstHeight} fill={theme.colors.loss} cursor={d.goalsAgainst > 0 ? "pointer" : "default"} onClick={() => handleBarClick(`${d.result}-against`, d.goalsAgainst, x2, y2, goalsAgainstHeight)} />

                {/* X-axis Label */}
                <text x={groupX + barGroupWidth / 2} y={SvgHeight - padding.bottom + 15} fill={theme.colors.secondaryText} fontSize="12" textAnchor="middle">
                  {d.result}
                </text>
              </g>
            );
          })}

          {activeValue && (
            <text
              x={activeValue.x}
              y={activeValue.y}
              fill={theme.colors.primaryText}
              fontSize="28"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ animation: 'pop-up-value 0.3s ease-out forwards', pointerEvents: 'none', stroke: theme.colors.surface, strokeWidth: 2, paintOrder: 'stroke' }}
            >
              {activeValue.value.toFixed(1)}
            </text>
          )}
        </svg>
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendColorBox, backgroundColor: theme.colors.win }} />
            <span>Goles a Favor (Promedio)</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendColorBox, backgroundColor: theme.colors.loss }} />
            <span>Goles en Contra (Promedio)</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContributionByResultChart;
