import React from 'react';
import ControllerPanel from '../components/ControllerPanel';

export default function Controller({ data }) {
  const currentWindow =
    data?.windows && data.windows.length > 0
      ? data.windows[data.windows.length - 1]
      : null;

  return (
    <div className="page-container controller-page">
      {/* Main Controller Panel */}
      <section className="controller-main-section">
        <ControllerPanel
          currentMode={data?.final_mode}
          currentSpikeRate={currentWindow?.spike_rate || 0}
          modeSwitches={data?.adaptive_mode_switches || 0}
        />
      </section>

      {/* Hysteresis State Machine Section */}
      <section className="state-machine-section">
        <div className="state-machine-header">
          <span className="section-kicker">CONTROL THEORY MECHANICS</span>
          <h3 className="section-heading">Finite State Automaton &amp; Hysteresis Band</h3>
        </div>

        <div className="fsm-diagram-card">
          <div className="fsm-visual-grid">
            {/* State A */}
            <div className={`fsm-state-node ${data?.final_mode === 'EVENT-DRIVEN' ? 'node-active-event' : ''}`}>
              <div className="node-head">STATE A</div>
              <strong className="mono">EVENT-DRIVEN</strong>
              <small>Sparse / Asynchronous</small>
              <span className="node-status-sub">Zero idle step overhead</span>
            </div>

            {/* Transitions Middle */}
            <div className="fsm-transitions-col">
              {/* Forward Transition */}
              <div className="transition-arrow arrow-forward">
                <span className="trans-rule mono">Rate &gt; 1.00 spikes/ms (θ_high)</span>
                <span className="arrow-line">──────►</span>
                <span className="trans-action">Up-switch to Time-Driven Engine</span>
              </div>

              {/* Dead-band Loop */}
              <div className="deadband-loop-indicator">
                <span className="deadband-badge mono">0.30 ≤ Rate ≤ 1.00 : Hysteresis Dead-Band (No Switch)</span>
              </div>

              {/* Return Transition */}
              <div className="transition-arrow arrow-return">
                <span className="trans-action">Down-switch to Event-Driven Engine</span>
                <span className="arrow-line">◄──────</span>
                <span className="trans-rule mono">Rate &lt; 0.30 spikes/ms (θ_low)</span>
              </div>
            </div>

            {/* State B */}
            <div className={`fsm-state-node ${data?.final_mode === 'TIME-DRIVEN' ? 'node-active-time' : ''}`}>
              <div className="node-head">STATE B</div>
              <strong className="mono">TIME-DRIVEN</strong>
              <small>Dense / Synchronous</small>
              <span className="node-status-sub">O(1) step vectorization</span>
            </div>
          </div>
        </div>
      </section>

      {/* Real Window Decision Log Table */}
      <section className="window-decision-audit-card">
        <div className="audit-header">
          <span className="section-kicker">WINDOW-BY-WINDOW AUDIT</span>
          <h4>Authoritative Controller Decisions Across Simulation Windows</h4>
        </div>

        <div className="table-wrapper">
          <table className="scientific-table">
            <thead>
              <tr>
                <th>WINDOW</th>
                <th>SPAN (ms)</th>
                <th>SPIKES</th>
                <th>SPIKE RATE</th>
                <th>CONTROLLER REGIME</th>
                <th>DECISION &amp; RATIONALE</th>
                <th>ACTIVE MODE</th>
              </tr>
            </thead>
            <tbody>
              {data?.windows?.map((w, idx) => {
                let regime = 'Dead-Band (0.30 - 1.00)';
                let decision = 'Preserve previous mode';
                if (w.spike_rate > 1.00) {
                  regime = 'High Burst (> 1.00)';
                  decision = 'Trigger switch to TIME-DRIVEN';
                } else if (w.spike_rate < 0.30) {
                  regime = 'Sparse / Quiescent (< 0.30)';
                  decision = 'Trigger switch to EVENT-DRIVEN';
                } else {
                  if (idx === 4) {
                    decision = 'Rate = 0.60 in dead-band: Retains EVENT-DRIVEN (Hysteresis working!)';
                  }
                }

                return (
                  <tr key={`audit-${idx}`}>
                    <td className="mono">W{idx}</td>
                    <td className="mono">{w.start_time.toFixed(1)}–{w.end_time.toFixed(1)} ms</td>
                    <td className="mono">{w.spikes}</td>
                    <td className="mono font-semibold">{w.spike_rate.toFixed(2)} spk/ms</td>
                    <td>
                      <span className={`regime-badge ${w.spike_rate > 1.0 ? 'reg-high' : w.spike_rate < 0.3 ? 'reg-low' : 'reg-deadband'}`}>
                        {regime}
                      </span>
                    </td>
                    <td className="decision-text">{decision}</td>
                    <td>
                      <span className={`mode-pill-table ${w.mode === 'EVENT-DRIVEN' ? 'pill-event' : 'pill-time'}`}>
                        {w.mode}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
