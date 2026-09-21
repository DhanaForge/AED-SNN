import React, { useState } from 'react';

export default function EventLog({ events = [] }) {
  const [filter, setFilter] = useState('ALL');

  const filteredEvents = events.filter((evt) => {
    if (filter === 'ALL') return true;
    if (filter === 'SWITCH') return evt.type === 'SWITCH';
    if (filter === 'STIMULUS') return evt.type === 'INPUT';
    if (filter === 'WINDOW') return evt.type === 'WINDOW';
    return true;
  });

  return (
    <div className="event-log-container">
      <div className="event-log-header">
        <div>
          <span className="section-kicker">CHRONOLOGICAL AUDIT TRAIL</span>
          <h3 className="section-heading">Simulation Event Log</h3>
        </div>

        <div className="event-filter-tabs">
          {['ALL', 'SWITCH', 'STIMULUS', 'WINDOW'].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All Trace Events' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="event-stream-scroller">
        {filteredEvents.length === 0 ? (
          <div className="empty-stream">No events matching selected filter.</div>
        ) : (
          <div className="event-stream-list">
            {filteredEvents.map((evt, idx) => {
              const levelClass = {
                'accent-warn': 'evt-warn',
                'accent-cool': 'evt-cool',
                success: 'evt-success',
                info: 'evt-info',
                neutral: 'evt-neutral',
              }[evt.level] || 'evt-neutral';

              return (
                <div key={`evt-${idx}`} className={`event-row ${levelClass}`}>
                  <div className="evt-timestamp mono">{evt.time}</div>
                  <div className="evt-type-tag mono">{evt.type}</div>
                  <div className="evt-category mono">{evt.category}</div>
                  <div className="evt-description">{evt.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="event-log-footer">
        <span className="source-note mono">
          LOG STATUS: RECONSTRUCTED FROM VERIFIED BACKEND TIME WINDOWS &amp; STIMULUS TIMETABLE
        </span>
      </div>
    </div>
  );
}
