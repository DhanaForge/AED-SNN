import React, { useState } from 'react';

export default function SimulationConfigPanel({ onRunComplete, isRunning, setIsRunning }) {
  const [neurons, setNeurons] = useState(3);
  const [simulationTime, setSimulationTime] = useState(30.0);
  const [dt, setDt] = useState(1.0);
  const [lowThreshold, setLowThreshold] = useState(0.30);
  const [highThreshold, setHighThreshold] = useState(1.00);
  const [adaptationWindow, setAdaptationWindow] = useState(5.0);
  const [workload, setWorkload] = useState('sparse_dense');

  const [lastRunNotice, setLastRunNotice] = useState(null);
  const [formError, setFormError] = useState(null);

  const presets = [
    {
      label: 'Default Baseline (30ms, 3N)',
      config: { neurons: 3, simulationTime: 30.0, dt: 1.0, low: 0.3, high: 1.0, win: 5.0, wl: 'sparse_dense' },
    },
    {
      label: 'Extended Run (50ms, 5N)',
      config: { neurons: 5, simulationTime: 50.0, dt: 1.0, low: 0.3, high: 1.0, win: 5.0, wl: 'sparse_dense' },
    },
    {
      label: 'Dense Burst Test',
      config: { neurons: 3, simulationTime: 30.0, dt: 1.0, low: 0.4, high: 1.2, win: 5.0, wl: 'dense' },
    },
    {
      label: 'Ultra-Sparse Quiescent',
      config: { neurons: 3, simulationTime: 30.0, dt: 1.0, low: 0.2, high: 0.8, win: 5.0, wl: 'sparse' },
    },
  ];

  const applyPreset = (p) => {
    setNeurons(p.config.neurons);
    setSimulationTime(p.config.simulationTime);
    setDt(p.config.dt);
    setLowThreshold(p.config.low);
    setHighThreshold(p.config.high);
    setAdaptationWindow(p.config.win);
    setWorkload(p.config.wl);
    setFormError(null);
  };

  const handleRun = async (e) => {
    e.preventDefault();
    setFormError(null);
    setLastRunNotice(null);

    // Client validation
    if (highThreshold <= lowThreshold) {
      setFormError('High Threshold (θ_high) must be strictly greater than Low Threshold (θ_low).');
      return;
    }
    if (adaptationWindow <= 0 || adaptationWindow > simulationTime) {
      setFormError('Adaptation Window must be positive and cannot exceed total simulation time.');
      return;
    }

    const payload = {
      neurons: parseInt(neurons, 10),
      simulation_time: parseFloat(simulationTime),
      dt: parseFloat(dt),
      low_threshold: parseFloat(lowThreshold),
      high_threshold: parseFloat(highThreshold),
      adaptation_window: parseFloat(adaptationWindow),
      workload,
    };

    setIsRunning(true);
    try {
      if (onRunComplete) {
        const res = await onRunComplete(payload);
        setLastRunNotice({
          type: 'success',
          msg: `Simulation completed in ${res?.wall_clock_ms || 0}ms wall-clock time. (Experiment ${res?.experiment_id || 'recorded'})`,
        });
      }
    } catch (err) {
      setFormError(err.message || 'Simulation execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="simulation-config-card">
      <div className="config-header-bar">
        <div>
          <span className="section-kicker">INTERACTIVE SIMULATION CONTROL</span>
          <h3 className="section-heading">C++ Engine Configuration &amp; Runner</h3>
        </div>
        <div className="preset-pill-group">
          <span className="preset-label">PRESETS:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              className="preset-btn"
              onClick={() => applyPreset(p)}
              disabled={isRunning}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleRun} className="config-form">
        <div className="config-grid">
          {/* Column 1: Network Topology & Duration */}
          <div className="config-col">
            <h5 className="col-heading">Network &amp; Integration</h5>

            <div className="input-field">
              <label htmlFor="cfg-neurons">
                Neuron Count (Chain):
                <span className="info-sub">Nodes (0 to N-1)</span>
              </label>
              <input
                id="cfg-neurons"
                type="number"
                min="1"
                max="50"
                value={neurons}
                onChange={(e) => setNeurons(e.target.value)}
                disabled={isRunning}
                required
                className="mono-input"
              />
            </div>

            <div className="input-field">
              <label htmlFor="cfg-simtime">
                Simulation Duration:
                <span className="info-sub">T_sim (ms)</span>
              </label>
              <input
                id="cfg-simtime"
                type="number"
                min="5"
                max="500"
                step="5"
                value={simulationTime}
                onChange={(e) => setSimulationTime(e.target.value)}
                disabled={isRunning}
                required
                className="mono-input"
              />
            </div>

            <div className="input-field">
              <label htmlFor="cfg-dt">
                Integration Step (dt):
                <span className="info-sub">Time precision (ms)</span>
              </label>
              <input
                id="cfg-dt"
                type="number"
                min="0.1"
                max="5.0"
                step="0.1"
                value={dt}
                onChange={(e) => setDt(e.target.value)}
                disabled={isRunning}
                required
                className="mono-input"
              />
            </div>
          </div>

          {/* Column 2: Adaptive Controller Hysteresis */}
          <div className="config-col">
            <h5 className="col-heading">Adaptive Controller &amp; Hysteresis</h5>

            <div className="input-field">
              <label htmlFor="cfg-lowthresh">
                Low Threshold (θ_low):
                <span className="info-sub">spikes/ms → EVENT-DRIVEN</span>
              </label>
              <input
                id="cfg-lowthresh"
                type="number"
                min="0.0"
                max="2.0"
                step="0.05"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(e.target.value)}
                disabled={isRunning}
                required
                className="mono-input"
              />
            </div>

            <div className="input-field">
              <label htmlFor="cfg-highthresh">
                High Threshold (θ_high):
                <span className="info-sub">spikes/ms → TIME-DRIVEN</span>
              </label>
              <input
                id="cfg-highthresh"
                type="number"
                min="0.1"
                max="5.0"
                step="0.05"
                value={highThreshold}
                onChange={(e) => setHighThreshold(e.target.value)}
                disabled={isRunning}
                required
                className="mono-input"
              />
            </div>

            <div className="input-field">
              <label htmlFor="cfg-window">
                Evaluation Window:
                <span className="info-sub">Δt interval (ms)</span>
              </label>
              <input
                id="cfg-window"
                type="number"
                min="1.0"
                max="50.0"
                step="1.0"
                value={adaptationWindow}
                onChange={(e) => setAdaptationWindow(e.target.value)}
                disabled={isRunning}
                required
                className="mono-input"
              />
            </div>
          </div>

          {/* Column 3: Workload Regime Selection */}
          <div className="config-col">
            <h5 className="col-heading">Stimulus Workload Protocol</h5>

            <div className="input-field">
              <label htmlFor="cfg-workload">
                Workload Generator:
                <span className="info-sub">Synthesized stimulus pattern</span>
              </label>
              <select
                id="cfg-workload"
                value={workload}
                onChange={(e) => setWorkload(e.target.value)}
                disabled={isRunning}
                className="mono-select"
              >
                <option value="sparse_dense">Sparse → Dense Hybrid Burst (Baseline)</option>
                <option value="sparse">Sparse Quiescent Baseline (0.1 spk/ms)</option>
                <option value="dense">Continuous Dense Burst (2.0 spk/ms)</option>
                <option value="dense_sparse">Dense Early Burst → Sparse</option>
                <option value="bursty">Dual Cascading Burst Clusters</option>
                <option value="poisson">Poisson Jitter Stream (Pseudo-Random)</option>
              </select>
            </div>

            <div className="workload-summary-hint">
              <span className="hint-label">PROTOCOL SUMMARY:</span>
              <p className="hint-text">
                {workload === 'sparse_dense' && 'Sparse initial stimulus (1ms, 21ms) with an embedded high-frequency 100 Hz burst at 8.0–8.9ms to test dual regime shifts.'}
                {workload === 'sparse' && 'Low-frequency sparse inputs only. Tests event engine with zero idle time-step overhead.'}
                {workload === 'dense' && 'Continuous high-rate spike injection. Tests time-driven engine continuous batch integration.'}
                {workload === 'dense_sparse' && 'Initial dense burst that subsides into quiescent baseline. Benchmarks down-switch recovery.'}
                {workload === 'bursty' && 'Multiple distinct burst clusters at t=4ms and t=18ms. Evaluates hysteresis dead-band stability.'}
                {workload === 'poisson' && 'Heterogeneous arrival intervals. Tests controller stability under stochastic stimulus jitter.'}
              </p>
            </div>
          </div>
        </div>

        {formError && (
          <div className="config-error-banner">
            <span className="err-icon">⚠️</span>
            <span>{formError}</span>
          </div>
        )}

        {lastRunNotice && (
          <div className="config-success-banner">
            <span className="suc-icon">✓</span>
            <span>{lastRunNotice.msg}</span>
          </div>
        )}

        <div className="config-action-row">
          <div className="action-meta">
            <span className="meta-hint mono">
              Target Binary: <code>build/aed_snn.exe</code> | Bridge: <code>http://localhost:3000</code>
            </span>
          </div>

          <button
            type="submit"
            className={`run-simulation-btn ${isRunning ? 'btn-executing' : ''}`}
            disabled={isRunning}
            id="btn-run-simulation"
          >
            {isRunning ? (
              <>
                <span className="btn-spinner" />
                <span>RUNNING SIMULATION...</span>
              </>
            ) : (
              <>
                <span className="btn-icon">⚡</span>
                <span>RUN SIMULATION</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
