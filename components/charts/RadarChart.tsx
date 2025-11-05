import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface RadarChartData {
  label: string;
  value: number;
}

interface PlayerData {
  name: string;
  data: RadarChartData[];
  color: string;
  isDashed?: boolean;
}

interface RadarChartProps {
  playersData: PlayerData[];
  size?: number;
  showLegend?: boolean;
  maxValues?: number[];
}

const RadarChart: React.FC<RadarChartProps> = ({ playersData, size = 300, showLegend = true, maxValues: propMaxValues }) => {
  const { theme } = useTheme();
  const [activePoint, setActivePoint] = useState<{ playerIndex: number; pointIndex: number } | null>(null);
  
  if (playersData.length === 0 || playersData[0].data.length === 0) {
    return null;
  }

  const numAxes = playersData[0].data.length;
  const angleSlice = (Math.PI * 2) / numAxes;
  const radius = size / 2.8;
  const center = size / 2;

  const maxValues = propMaxValues || playersData[0].data.map((_, i) => {
    return Math.max(...playersData.map(p => p.data[i].value), 1);
  });

  const axes = playersData[0].data.map((item, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    return {
      label: item.label,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });
  
  const numLevels = 5;
  const levelFactor = radius / numLevels;

  const gridLevels = Array.from({ length: numLevels }, (_, i) => {
    const levelRadius = levelFactor * (i + 1);
    return playersData[0].data.map((_, j) => {
      const angle = angleSlice * j - Math.PI / 2;
      return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
    }).join(' ');
  });

  const playersPointsAndPaths = playersData.map(player => {
    const points = player.data.map((item, i) => {
      const value = item.value;
      const normalizedValue = maxValues[i] > 0 ? value / maxValues[i] : 0;
      const pointRadius = normalizedValue * radius;
      const angle = angleSlice * i - Math.PI / 2;
      const x = center + pointRadius * Math.cos(angle);
      const y = center + pointRadius * Math.sin(angle);
      
      const textXOffset = (x - center) * 0.2;
      const textYOffset = (y - center) * 0.2;
      
      return {
        x,
        y,
        value,
        textX: x + textXOffset,
        textY: y + textYOffset,
      };
    });
    const path = points.map(p => `${p.x},${p.y}`).join(' ');
    return { path, points };
  });

  const styles: { [key: string]: React.CSSProperties } = {
    legend: {
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        marginTop: '1rem',
    },
    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    legendColorBox: {
        width: '14px',
        height: '14px',
        borderRadius: '4px',
    },
    legendLabel: {
        fontSize: '0.875rem',
        color: theme.colors.primaryText,
    },
  };
  
  const handleBackgroundClick = () => {
    setActivePoint(null);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <style>{`
        @keyframes popIn { 
          from { opacity: 0; transform: scale(0.8); } 
          to { opacity: 1; transform: scale(1); } 
        }
      `}</style>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onClick={handleBackgroundClick}>
        {/* Background Grid */}
        {gridLevels.map((path, i) => (
          <polygon
            key={`level-${i}`}
            points={path}
            fill="none"
            stroke={theme.colors.border}
            strokeWidth="1"
          />
        ))}

        {/* Axes Lines and Labels */}
        {axes.map((axis, i) => (
          <g key={`axis-${i}`}>
            <line
              x1={center}
              y1={center}
              x2={axis.x}
              y2={axis.y}
              stroke={theme.colors.borderStrong}
              strokeWidth="1"
            />
            <text
              x={axis.x + (axis.x - center) * 0.1}
              y={axis.y + (axis.y - center) * 0.1}
              dy="0.33em"
              fill={theme.colors.secondaryText}
              fontSize="12"
              fontWeight="600"
              textAnchor={axis.x > center + 1 ? 'start' : axis.x < center - 1 ? 'end' : 'middle'}
            >
              {axis.label}
            </text>
          </g>
        ))}

        {/* Player Data Polygons */}
        {playersPointsAndPaths.map(({ path }, i) => (
          <polygon
            key={`player-poly-${i}`}
            points={path}
            fill={playersData[i].color}
            fillOpacity="0.3"
            stroke={playersData[i].color}
            strokeWidth="2"
            strokeDasharray={playersData[i].isDashed ? "4 4" : "none"}
          />
        ))}
        
        {/* Player Data Points (Circles and Click Targets) */}
        {playersPointsAndPaths.map(({ points }, i) => (
          <g key={`player-points-${i}`}>
            {points.map((point, j) => (
              <g key={`point-${i}-${j}`}>
                {/* Visible point circle */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={playersData[i].color}
                  stroke={theme.colors.surface}
                  strokeWidth="2"
                />
                {/* Larger invisible click target */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="transparent"
                  cursor="pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePoint(activePoint && activePoint.playerIndex === i && activePoint.pointIndex === j ? null : { playerIndex: i, pointIndex: j });
                  }}
                />
              </g>
            ))}
          </g>
        ))}

        {/* Active Point Value Text (Rendered on top) */}
        {activePoint && (() => {
            const { playerIndex, pointIndex } = activePoint;
            const point = playersPointsAndPaths[playerIndex].points[pointIndex];
            const playerColor = playersData[playerIndex].color;
            const formattedValue = (val: number) => {
                if (Number.isInteger(val)) return val.toString();
                if (val > 10) return val.toFixed(0);
                return val.toFixed(1);
            };

            return (
                <text
                    x={point.textX}
                    y={point.textY}
                    dy="0.33em"
                    fill={playerColor}
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    stroke={theme.colors.surface}
                    strokeWidth="3"
                    paintOrder="stroke"
                    style={{ pointerEvents: 'none', animation: 'popIn 0.2s ease-out forwards' }}
                >
                    {formattedValue(point.value)}
                </text>
            )
        })()}
      </svg>
      {showLegend && (
          <div style={styles.legend}>
            {playersData.map((player, i) => (
                <div key={i} style={styles.legendItem}>
                    <span style={{ ...styles.legendColorBox, backgroundColor: player.color }} />
                    <span style={styles.legendLabel}>{player.name}</span>
                </div>
            ))}
          </div>
      )}
    </div>
  );
};

export default RadarChart;