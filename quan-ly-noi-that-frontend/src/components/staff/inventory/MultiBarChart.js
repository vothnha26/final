// MultiBarChart: Bar chart with overlaid line chart (combo chart)
import React from 'react';

// Responsive multi-series bar/line chart with optional value labels and a wrapped HTML legend
const MultiBarChart = ({
  categories = [],
  series = [],
  width = 720,
  height = 260,
  padding = 36,
  showValues = true, // Default to true to always show values
  mode = 'bar', // 'bar' | 'line'
}) => {
  const n = categories.length;
  const m = series.length;
  if (!n || !m) return null;
  const allValues = series.flatMap(s => s.data || []);
  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(0, ...allValues);
  const rangeY = maxVal - minVal || 1;

  // Decide whether to render numeric value labels (avoid clutter if crowded)
  const shouldShowValues =
    typeof showValues === 'boolean' ? showValues : (m <= 2 && n <= 10);

  // Bar settings
  const axisColor = '#E5E7EB';
  const paddingLeft = 60; // Increase left padding for Y-axis labels
  const groupWidth = (width - paddingLeft - padding) / n;
  const barWidth = Math.max(8, Math.min(40, (groupWidth - 8) / m));

  // Y scale (adjusted for new padding)
  const yFor = v => height - padding - ((v - minVal) / rangeY) * (height - padding * 2);
  
  // X position for center of each category (adjusted for new padding)
  const xFor = i => paddingLeft + i * groupWidth + groupWidth / 2;

  // Determine label rotation for dense x-axis
  const maxLabels = 8;
  const rotation = n > maxLabels ? 30 : 0;
  
  // Y-axis ticks (create 5 evenly spaced ticks)
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return minVal + (rangeY / (yTicks - 1)) * i;
  });

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
          {/* Y-axis grid lines and labels */}
          {yTickValues.map((val, i) => {
            const y = yFor(val);
            return (
              <g key={`y-tick-${i}`}>
                {/* Grid line */}
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  stroke={axisColor} 
                  strokeWidth="1" 
                  strokeDasharray="4,4"
                  opacity={0.5}
                />
                {/* Y-axis label */}
                <text 
                  x={paddingLeft - 10} 
                  y={y + 4} 
                  fontSize="10" 
                  textAnchor="end" 
                  fill="#6B7280"
                  fontWeight="500"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}
          
          {/* axes */}
          <line x1={paddingLeft} y1={height - padding} x2={width - padding} y2={height - padding} stroke={axisColor} strokeWidth="2" />
          <line x1={paddingLeft} y1={padding} x2={paddingLeft} y2={height - padding} stroke={axisColor} strokeWidth="2" />

          {/* bars only if mode === 'bar' */}
          {mode === 'bar' && categories.map((cat, i) => {
            const x0 = paddingLeft + i * groupWidth;
            return series.map((s, j) => {
              const v = Number(s.data?.[i] || 0);
              const x = x0 + j * barWidth + (groupWidth - m * barWidth) / 2;
              const y = yFor(v);
              const h = height - padding - y;
              return (
                <g key={`bar-group-${i}-${j}`}>
                  <rect
                    x={x}
                    y={v >= 0 ? y : yFor(0)}
                    width={barWidth - 2}
                    height={Math.abs(h)}
                    fill={s.color || '#2563eb'}
                    rx={2}
                    opacity={0.85}
                  />
                  {/* Value labels on top of bars (always show if enabled) */}
                  {shouldShowValues && v !== 0 && (
                    <text 
                      x={x + (barWidth - 2) / 2}
                      y={v >= 0 ? y - 6 : y + Math.abs(h) + 14}
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                      fill="#374151"
                    >
                      {Math.round(v)}
                    </text>
                  )}
                </g>
              );
            });
          })}

          {/* lines only if mode === 'line' */}
          {mode === 'line' && series.map((s, idx) => {
            const points = (s.data || [])
              .map((v, i) => `${xFor(i)},${yFor(Number(v || 0))}`)
              .join(' ');
            return (
              <g key={`line-${idx}`}>
                <polyline 
                  fill="none" 
                  stroke={s.lineColor || s.color || '#2563eb'} 
                  strokeWidth="2.5" 
                  points={points}
                  opacity={0.9}
                />
                {/* Data point dots */}
                {(s.data || []).map((v, i) => (
                  <circle
                    key={`dot-${idx}-${i}`}
                    cx={xFor(i)}
                    cy={yFor(Number(v || 0))}
                    r="4"
                    fill="white"
                    stroke={s.lineColor || s.color || '#2563eb'}
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}

          {/* x ticks (show at most 8 labels) */}
          {categories.map((c, i) => {
            const step = Math.ceil(n / maxLabels);
            if (i % step !== 0 && i !== n - 1) return null;
            const x = xFor(i);
            const label = String(c).length > 12 ? String(c).slice(0, 11) + '…' : String(c);
            if (rotation) {
              return (
                <g key={`tick-${i}`}>
                  <line x1={x} y1={height - padding} x2={x} y2={height - padding + 4} stroke={axisColor} strokeWidth="1" />
                  <text
                    transform={`translate(${x}, ${height - padding + 14}) rotate(${rotation})`}
                    fontSize="10"
                    textAnchor="end"
                    fill="#6B7280"
                    fontWeight="500"
                  >
                    {label}
                  </text>
                </g>
              );
            }
            return (
              <g key={`tick-${i}`}>
                <line x1={x} y1={height - padding} x2={x} y2={height - padding + 4} stroke={axisColor} strokeWidth="1" />
                <text x={x} y={height - padding + 16} fontSize="10" textAnchor="middle" fill="#6B7280" fontWeight="500">{label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Wrapped legend below the chart to avoid overlap */}
      <div className="flex flex-wrap gap-3 mt-2">
        {series.map((s, i) => (
          <div key={`legend-chip-${i}`} className="flex items-center gap-2 text-sm" title={s.label || `Series ${i + 1}`}>
            <span
              className="inline-block w-3 h-3 rounded"
              style={{ backgroundColor: s.color || '#2563eb' }}
            />
            <span className="text-gray-700">
              {(s.label || `Series ${i + 1}`).length > 32
                ? (s.label || `Series ${i + 1}`).slice(0, 31) + '…'
                : (s.label || `Series ${i + 1}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiBarChart;
