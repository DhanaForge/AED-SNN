import React from 'react';

export default function MetricCard({
  label,
  value,
  unit = '',
  status = 'MEASURED',
  description = '',
  accent = 'cyan',
  dataSource = '',
}) {
  const accentClass = {
    cyan: 'metric-cyan',
    amber: 'metric-amber',
    emerald: 'metric-emerald',
    neutral: 'metric-neutral',
  }[accent] || 'metric-cyan';

  return (
    <div className={`metric-card ${accentClass}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {status && (
          <span className={`metric-status-tag tag-${status.toLowerCase().replace(/\s+/g, '-')}`}>
            {status}
          </span>
        )}
      </div>

      <div className="metric-body">
        <div className="metric-value-row">
          <span className="metric-value mono">
            {value !== undefined && value !== null ? value : '—'}
          </span>
          {unit && <span className="metric-unit">{unit}</span>}
        </div>

        {description && <p className="metric-description">{description}</p>}
      </div>

      {dataSource && (
        <div className="metric-footer">
          <span className="metric-source mono">{dataSource}</span>
        </div>
      )}
    </div>
  );
}
