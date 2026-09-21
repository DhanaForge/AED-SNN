import React from 'react';

export default function ControllerPanel({ currentMode, currentSpikeRate = 0, modeSwitches = 0 }) {
  const lowThreshold = 0.30;
  const highThreshold = 1.00;

  // Calculate pointer position on the 0.0 - 1.5 spikes/ms scale (percentage 0 to 100%)
  const maxScaleRate = 1.5;
  const clampedRate = Math.min(Math.max(currentSpikeRate, 0), maxScaleRate);
  const pointerPercent = (clampedRate / maxScaleRate) * 100;
  const lowThreshPercent = (lowThreshold / maxScaleRate) * 100; // 20%
  const highThreshPercent = (highThreshold / maxScaleRate) * 100; // 66.6%

  const isEvent = currentMode === 'EVENT-DRIVEN';

  return (
    <div className="controller-panel-card">
      <div className="controller-header">
        <div>
          <span className="section-kicker">HYBRID EXECUTION CONTROL</span>
          <h3 className="section-heading">Adaptive Controller</h3>
        </div>
        <div className="controller-status-pill">
          <span className={`status-indicator-dot ${isEvent ? 'dot-event' : 'dot-time'}`} />
          <span className="strategy-text mono">{currentMode || 'INITIALIZING'}</span>
        </div>
      </div>

      {/* Mode Status Hero Banner */}
      <div className={`active-mode-banner ${isEvent ? 'mode-event' : 'mode-time'}`}>
        <div className="banner-left">
          <span className="banner-kicker">ACTIVE STRATEGY</span>
          <h2 className="banner-title mono">{currentMode || '—'}</h2>
          <p className="banner-desc">
            {isEvent
              ? 'Low workload detected. Asynchronous spike-driven propagation active with zero idle time-step overhead.'
              : 'Dense burst detected. Synchronous locked time-step propagation active for continuous batch updates.'}
          </p>
        </div>
        <div className="banner-stat">
          <span className="stat-label">RECORDED SWITCHES</span>
          <span className="stat-val mono">{modeSwitches}</span>
        </div>
      </div>

      {/* Visual Threshold Bar & Hysteresis Range */}
      <div className="threshold-visualizer">
        <div className="threshold-bar-labels">
          <span className="thresh-label">0.00 (Sparse)</span>
          <span className="thresh-label label-low" style={{ left: `${lowThreshPercent}%` }}>
            θ_low: 0.30
          </span>
          <span className="thresh-label label-high" style={{ left: `${highThreshPercent}%` }}>
            θ_high: 1.00
          </span>
          <span className="thresh-label label-dense">1.50+ (Dense Burst)</span>
        </div>

        <div className="threshold-track">
          {/* Zone 1: Event-driven preferred */}
          <div
            className="zone zone-event"
            style={{ width: `${lowThreshPercent}%` }}
            title="Event-Driven Target Zone (< 0.30)"
          >
            <span>EVENT-DRIVEN ZONE</span>
          </div>

          {/* Zone 2: Hysteresis dead-band */}
          <div
            className="zone zone-deadband"
            style={{ width: `${highThreshPercent - lowThreshPercent}%` }}
            title="Hysteresis Dead-Band (0.30 - 1.00): Retains current mode"
          >
            <span>HYSTERESIS DEAD-BAND</span>
          </div>

          {/* Zone 3: Time-driven preferred */}
          <div
            className="zone zone-time"
            style={{ width: `${100 - highThreshPercent}%` }}
            title="Time-Driven Target Zone (> 1.00)"
          >
            <span>TIME-DRIVEN ZONE</span>
          </div>

          {/* Current Spike Rate Marker */}
          <div
            className="rate-pointer-marker"
            style={{ left: `${pointerPercent}%` }}
            title={`Current Spike Rate: ${currentSpikeRate.toFixed(2)} spikes/ms`}
          >
            <div className="pointer-flag mono">{currentSpikeRate.toFixed(2)}</div>
            <div className="pointer-pin" />
          </div>
        </div>

        <div className="threshold-meta-notes">
          <span className="rate-caption mono">
            Current Rate: <strong>{currentSpikeRate.toFixed(2)} spikes/ms</strong>
          </span>
          <span className="window-caption mono">Evaluation Window: Δt = 5.00 ms</span>
        </div>
      </div>

      {/* Controller Decision Logic Breakdown */}
      <div className="controller-rules-grid">
        <div className="rule-card">
          <div className="rule-tag tag-sparse">UP-SWITCH CONDITION</div>
          <h4>Event-Driven → Time-Driven</h4>
          <p className="rule-formula mono">Spike Rate &gt; θ_high (1.00 spikes/ms)</p>
          <span className="rule-desc">
            Triggered when high-frequency bursts saturate event-queue overhead, pivoting to matrix time-step updates.
          </span>
        </div>

        <div className="rule-card">
          <div className="rule-tag tag-dense">DOWN-SWITCH CONDITION</div>
          <h4>Time-Driven → Event-Driven</h4>
          <p className="rule-formula mono">Spike Rate &lt; θ_low (0.30 spikes/ms)</p>
          <span className="rule-desc">
            Triggered when network falls quiescent, avoiding wasteful continuous evaluation of non-firing neurons.
          </span>
        </div>

        <div className="rule-card">
          <div className="rule-tag tag-hysteresis">HYSTERESIS STABILITY</div>
          <h4>Dead-Band Retention</h4>
          <p className="rule-formula mono">0.30 ≤ Spike Rate ≤ 1.00</p>
          <span className="rule-desc">
            Prevents rapid mode thrashing/chatter by preserving the active execution engine when in the intermediate regime.
          </span>
        </div>
      </div>
    </div>
  );
}
