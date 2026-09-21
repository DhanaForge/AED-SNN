import React, { useState } from 'react';

export default function WorkloadChart({ windows = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!windows || windows.length === 0) {
    return (
      <div className="empty-chart-box">
        <p>NO WORKLOAD DATA AVAILABLE</p>
      </div>
    );
  }

  // Chart dimensions
  const svgWidth = 640;
  const svgHeight = 220;
  const padding = { top: 25, right: 35, bottom: 40, left: 45 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const maxRate = Math.max(...windows.map((w) => w.spike_rate), 4.5);
  const maxSpikes = Math.max(...windows.map((w) => w.spikes), 22);

  // Coordinates helper
  const getX = (idx) => padding.left + (idx + 0.5) * (chartW / windows.length);
  const getYRate = (rate) => padding.top + chartH - (rate / maxRate) * chartH;

  // Threshold Y coords
  const yLowThresh = getYRate(0.30);
  const yHighThresh = getYRate(1.00);

  // Construct line path for spike rate
  const rateLinePath = windows
    .map((w, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getYRate(w.spike_rate)}`)
    .join(' ');

  const rateAreaPath = `${rateLinePath} L ${getX(windows.length - 1)} ${padding.top + chartH} L ${getX(
    0
  )} ${padding.top + chartH} Z`;

  return (
    <div className="workload-charts-card">
      <div className="chart-header-bar">
        <div>
          <span className="section-kicker">SCIENTIFIC METRIC VISUALIZATION</span>
          <h3 className="section-heading">Workload Dynamics &amp; Burst Profiling</h3>
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-marker line-rate" /> Spike Rate (spikes/ms)
          </span>
          <span className="legend-item">
            <span className="legend-marker bar-spikes" /> Spike Volume
          </span>
          <span className="legend-item">
            <span className="legend-marker thresh-ref" /> Controller Thresholds
          </span>
        </div>
      </div>

      <div className="chart-svg-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="scientific-svg-chart"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <pattern id="gridLines" width="40" height="25" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 25"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartW}
            height={chartH}
            fill="url(#gridLines)"
          />

          {/* Threshold Reference Lines */}
          {/* High Threshold line = 1.00 */}
          <line
            x1={padding.left}
            y1={yHighThresh}
            x2={padding.left + chartW}
            y2={yHighThresh}
            stroke="#f59e0b"
            strokeDasharray="4,4"
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          <text
            x={padding.left + chartW + 4}
            y={yHighThresh + 3}
            fill="#f59e0b"
            fontSize="9"
            className="mono"
          >
            θ_high (1.0)
          </text>

          {/* Low Threshold line = 0.30 */}
          <line
            x1={padding.left}
            y1={yLowThresh}
            x2={padding.left + chartW}
            y2={yLowThresh}
            stroke="#38bdf8"
            strokeDasharray="4,4"
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          <text
            x={padding.left + chartW + 4}
            y={yLowThresh + 3}
            fill="#38bdf8"
            fontSize="9"
            className="mono"
          >
            θ_low (0.3)
          </text>

          {/* Y-Axis Labels */}
          {[0, 1.0, 2.0, 3.0, 4.0].map((tick) => {
            const yPos = getYRate(tick);
            return (
              <g key={`ytick-${tick}`}>
                <line
                  x1={padding.left - 4}
                  y1={yPos}
                  x2={padding.left}
                  y2={yPos}
                  stroke="#475569"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  className="mono"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Spike count volume bars */}
          {windows.map((w, idx) => {
            const barW = (chartW / windows.length) * 0.45;
            const x = getX(idx) - barW / 2;
            const barH = (w.spikes / maxSpikes) * chartH;
            const y = padding.top + chartH - barH;
            const isHovered = hoveredIdx === idx;

            return (
              <rect
                key={`bar-${idx}`}
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={w.mode === 'TIME-DRIVEN' ? '#f59e0b' : '#0284c7'}
                opacity={isHovered ? 0.9 : 0.4}
                rx="2"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}

          {/* Spike rate gradient area */}
          <path d={rateAreaPath} fill="url(#rateGradient)" />

          {/* Spike rate curve */}
          <path
            d={rateLinePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {windows.map((w, idx) => {
            const cx = getX(idx);
            const cy = getYRate(w.spike_rate);
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={`pt-${idx}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={w.mode === 'TIME-DRIVEN' ? '#f59e0b' : '#38bdf8'}
                  stroke="#07090e"
                  strokeWidth="2"
                />

                {/* X-Axis Window Labels */}
                <text
                  x={cx}
                  y={padding.top + chartH + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  className="mono"
                >
                  {w.start_time}–{w.end_time}m
                </text>
              </g>
            );
          })}

          {/* Hover Callout Box */}
          {hoveredIdx !== null && windows[hoveredIdx] && (
            <g>
              {(() => {
                const w = windows[hoveredIdx];
                const cx = getX(hoveredIdx);
                const cy = getYRate(w.spike_rate);
                const tipX = Math.min(Math.max(cx - 65, padding.left), padding.left + chartW - 130);
                const tipY = cy > padding.top + 65 ? cy - 55 : cy + 15;

                return (
                  <g>
                    <rect
                      x={tipX}
                      y={tipY}
                      width="130"
                      height="46"
                      rx="4"
                      fill="#0b1320"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"
                    />
                    <text
                      x={tipX + 8}
                      y={tipY + 16}
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="600"
                      className="mono"
                    >
                      W{hoveredIdx}: {w.start_time}–{w.end_time} ms
                    </text>
                    <text x={tipX + 8} y={tipY + 29} fill="#38bdf8" fontSize="9" className="mono">
                      Rate: {w.spike_rate.toFixed(2)} spk/ms
                    </text>
                    <text x={tipX + 8} y={tipY + 41} fill="#94a3b8" fontSize="9" className="mono">
                      Count: {w.spikes} | {w.mode}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
