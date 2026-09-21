import React, { useState } from 'react';

export default function ModeTimeline({ windows = [], onSelectWindow }) {
  const [selectedWindowIdx, setSelectedWindowIdx] = useState(null);

  if (!windows || windows.length === 0) {
    return (
      <div className="empty-timeline-box">
        <p>NO WINDOW TELEMETRY DATA AVAILABLE</p>
      </div>
    );
  }

  const activeWindow =
    selectedWindowIdx !== null ? windows[selectedWindowIdx] : windows[windows.length - 1];

  return (
    <div className="mode-timeline-container">
      <div className="timeline-header-bar">
        <div>
          <span className="section-kicker">TEMPORAL EXECUTION CHRONICLE</span>
          <h3 className="section-heading">Mode Transition Timeline</h3>
        </div>
        <div className="timeline-meta-tags">
          <span className="timeline-badge mono">{windows.length} EVALUATION WINDOWS</span>
          <span className="timeline-badge badge-real">AUTHORITATIVE BACKEND TRACE</span>
        </div>
      </div>

      {/* Horizontal scientific timeline segments */}
      <div className="timeline-track-wrapper">
        <div className="timeline-segments-grid">
          {windows.map((win, idx) => {
            const isEvent = win.mode === 'EVENT-DRIVEN';
            const isSelected = selectedWindowIdx === idx;

            return (
              <div
                key={`win-${idx}`}
                className={`timeline-segment-card ${isEvent ? 'seg-event' : 'seg-time'} ${
                  isSelected ? 'seg-selected' : ''
                }`}
                onClick={() => {
                  setSelectedWindowIdx(idx);
                  if (onSelectWindow) onSelectWindow(win, idx);
                }}
                title={`Window ${idx}: ${win.start_time.toFixed(1)}–${win.end_time.toFixed(1)}ms (${win.mode})`}
              >
                <div className="segment-top-row">
                  <span className="segment-id mono">W{idx}</span>
                  <span className={`segment-mode-tag ${isEvent ? 'tag-event' : 'tag-time'}`}>
                    {isEvent ? 'EVENT' : 'TIME'}
                  </span>
                </div>

                <div className="segment-time mono">
                  {win.start_time.toFixed(1)}–{win.end_time.toFixed(1)} ms
                </div>

                <div className="segment-metrics-row">
                  <div className="seg-submetric">
                    <span className="sub-lbl">SPIKES</span>
                    <strong className="sub-val mono">{win.spikes}</strong>
                  </div>
                  <div className="seg-submetric">
                    <span className="sub-lbl">RATE</span>
                    <strong className="sub-val mono">{win.spike_rate.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Micro spike activity bar indicator */}
                <div className="segment-activity-bar">
                  <div
                    className="activity-fill"
                    style={{ width: `${Math.min((win.spike_rate / 4.5) * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Window Detail Drawer */}
      {activeWindow && (
        <div className="selected-window-detail">
          <div className="detail-header">
            <span className="detail-tag mono">
              WINDOW {selectedWindowIdx !== null ? selectedWindowIdx : windows.length - 1} INSPECTION
            </span>
            <span className="detail-interval mono">
              Interval: {activeWindow.start_time.toFixed(2)} ms → {activeWindow.end_time.toFixed(2)} ms (Δt = 5.00 ms)
            </span>
          </div>

          <div className="detail-tiles-row">
            <div className="detail-tile">
              <span className="detail-label">MODE ADOPTED</span>
              <strong
                className={`detail-value mono ${
                  activeWindow.mode === 'EVENT-DRIVEN' ? 'txt-cyan' : 'txt-amber'
                }`}
              >
                {activeWindow.mode}
              </strong>
            </div>

            <div className="detail-tile">
              <span className="detail-label">SPIKE COUNT</span>
              <strong className="detail-value mono">{activeWindow.spikes} spikes</strong>
            </div>

            <div className="detail-tile">
              <span className="detail-label">OBSERVED SPIKE RATE</span>
              <strong className="detail-value mono">
                {activeWindow.spike_rate.toFixed(2)} spikes/ms
              </strong>
            </div>

            <div className="detail-tile">
              <span className="detail-label">CONTROLLER ACTION</span>
              <span className="detail-status mono">
                {activeWindow.spike_rate > 1.0
                  ? 'High threshold exceeded (Switch/Retain TIME)'
                  : activeWindow.spike_rate < 0.3
                  ? 'Low threshold satisfied (Switch/Retain EVENT)'
                  : 'Hysteresis dead-band (Retain prior mode)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
