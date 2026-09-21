import React from 'react';

export default function ExperimentCard({
  title,
  category,
  status = 'PLANNED',
  description,
  params = {},
  isCurrent = false,
  onSelect,
}) {
  const statusClass = {
    'MEASURED & LOADED': 'status-loaded',
    PLANNED: 'status-planned',
    'NOT YET CONNECTED': 'status-unconnected',
  }[status] || 'status-planned';

  return (
    <div className={`experiment-card ${isCurrent ? 'exp-current' : ''}`}>
      <div className="exp-top-row">
        <span className="exp-category">{category}</span>
        <span className={`exp-status-pill ${statusClass}`}>{status}</span>
      </div>

      <h4 className="exp-title">{title}</h4>
      <p className="exp-description">{description}</p>

      {/* Parameter grid */}
      <div className="exp-params-grid">
        {Object.entries(params).map(([key, val]) => (
          <div key={key} className="exp-param-item">
            <span className="param-k">{key}:</span>
            <span className="param-v mono">{val}</span>
          </div>
        ))}
      </div>

      <div className="exp-footer-row">
        {isCurrent ? (
          <span className="active-tag mono">● ACTIVE TELEMETRY LOADED</span>
        ) : (
          <button
            type="button"
            className="exp-action-btn"
            disabled={status !== 'MEASURED & LOADED'}
            onClick={onSelect}
          >
            {status === 'MEASURED & LOADED' ? 'Inspect Results' : 'Execution Pipeline Pending'}
          </button>
        )}
      </div>
    </div>
  );
}
