import React from 'react';
import MetricCard from '../components/MetricCard';
import NeuralNetwork from '../components/NeuralNetwork';
import ControllerPanel from '../components/ControllerPanel';
import ModeTimeline from '../components/ModeTimeline';
import SimulationConfigPanel from '../components/SimulationConfigPanel';
import { calculateSummary } from '../services/simulationApi';

export default function Dashboard({
  data,
  setActivePage,
  onRunSimulation,
  isRunning,
  setIsRunning,
}) {
  if (!data) return null;

  const currentWindow =
    data.windows && data.windows.length > 0
      ? data.windows[data.windows.length - 1]
      : null;

  const summary = calculateSummary(data);

  return (
    <div className="page-container dashboard-page">
      {/* AED-SNN Feedback Loop Visual Banner */}
      <section className="control-loop-banner">
        <div className="loop-banner-header">
          <span className="banner-kicker">ARCHITECTURAL CONTROL PIPELINE</span>
          <h3 className="loop-title">The AED-SNN Feedback Cycle</h3>
        </div>

        <div className="loop-stages-row">
          <div className="loop-stage-item">
            <div className="stage-num mono">01</div>
            <div className="stage-content">
              <strong>OBSERVE</strong>
              <small>Workload Monitor samples spikes over Δt = 5.00 ms</small>
            </div>
          </div>
          <span className="loop-arrow">→</span>

          <div className="loop-stage-item">
            <div className="stage-num mono">02</div>
            <div className="stage-content">
              <strong>DECIDE</strong>
              <small>Controller tests hysteresis band (θ: 0.30 – 1.00)</small>
            </div>
          </div>
          <span className="loop-arrow">→</span>

          <div className="loop-stage-item">
            <div className="stage-num mono">03</div>
            <div className="stage-content">
              <strong>EXECUTE</strong>
              <small>Dispatches to Event Engine or Time Engine</small>
            </div>
          </div>
          <span className="loop-arrow">→</span>

          <div className="loop-stage-item">
            <div className="stage-num mono">04</div>
            <div className="stage-content">
              <strong>MEASURE</strong>
              <small>Tallies neuron updates, queue ops &amp; transitions</small>
            </div>
          </div>
          <span className="loop-arrow">→</span>

          <div className="loop-stage-item">
            <div className="stage-num mono">05</div>
            <div className="stage-content">
              <strong>ADAPT</strong>
              <small>Preserves state vectors &amp; recalibrates dynamically</small>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-kicker">ADAPTIVE HYBRID SNN EXECUTION</span>
          <h1 className="hero-title">
            Observe. Decide.<br />
            Execute. Adapt.
          </h1>
          <p className="hero-description">
            Workload-aware execution for spiking neural network simulation. Dynamically
            migrates between asynchronous event-driven priority queues and synchronous
            locked time-steps in response to instantaneous activity regimes.
          </p>
        </div>

        <div className="hero-mode-card">
          <div className="hero-mode-header">
            <span className="mode-card-kicker">CURRENT EXECUTION MODE</span>
            <span className={`mode-signal-dot ${data.final_mode === 'EVENT-DRIVEN' ? 'signal-cyan' : 'signal-amber'}`} />
          </div>
          <h2 className={`hero-mode-name mono ${data.final_mode === 'EVENT-DRIVEN' ? 'txt-cyan' : 'txt-amber'}`}>
            {data.final_mode || '—'}
          </h2>
          <div className="mode-card-stats">
            <div className="stat-col">
              <span className="stat-label">Observed Switches</span>
              <strong className="stat-val mono">{data.adaptive_mode_switches}</strong>
            </div>
            <div className="stat-col">
              <span className="stat-label">Evaluation Windows</span>
              <strong className="stat-val mono">{data.windows?.length || 0}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulation Configuration & Runner */}
      <section className="dashboard-runner-section">
        <SimulationConfigPanel
          onRunComplete={onRunSimulation}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
        />
      </section>

      {/* Core Authoritative Metrics Grid */}
      <section className="metrics-grid">
        <MetricCard
          label="SIMULATION TIME"
          value={data.simulation_time !== undefined ? data.simulation_time.toFixed(2) : '—'}
          unit="ms"
          status="MEASURED"
          description="Total simulated duration completed"
          accent="cyan"
          dataSource="data.simulation_time"
        />

        <MetricCard
          label="LATEST SPIKE RATE"
          value={currentWindow ? currentWindow.spike_rate.toFixed(2) : '—'}
          unit="spikes/ms"
          status="MEASURED"
          description={`Observed in final window (${currentWindow?.start_time}–${currentWindow?.end_time}ms)`}
          accent="cyan"
          dataSource="currentWindow.spike_rate"
        />

        <MetricCard
          label="FIXED EVENT UPDATES"
          value={data.fixed_event_updates}
          unit="updates"
          status="MEASURED"
          description="Baseline neuron evaluations in pure event-driven mode"
          accent="cyan"
          dataSource="data.fixed_event_updates"
        />

        <MetricCard
          label="FIXED TIME UPDATES"
          value={data.fixed_time_updates}
          unit="updates"
          status="MEASURED"
          description="Baseline neuron evaluations in pure time-driven mode"
          accent="amber"
          dataSource="data.fixed_time_updates"
        />

        <MetricCard
          label="ADAPTIVE SWITCHES"
          value={data.adaptive_mode_switches}
          unit="transitions"
          status="MEASURED"
          description="Dynamic regime shifts negotiated by controller"
          accent="emerald"
          dataSource="data.adaptive_mode_switches"
        />

        <MetricCard
          label="PEAK SPIKE RATE"
          value={summary.peakSpikeRate.toFixed(2)}
          unit="spikes/ms"
          status="DERIVED"
          description="Observed burst spike rate peak across all windows"
          accent="neutral"
          dataSource="max(windows.spike_rate)"
        />
      </section>

      {/* Middle Dual Visualizers */}
      <section className="dashboard-split-grid">
        <div className="dashboard-grid-left">
          <NeuralNetwork
            neuronsCount={data?.neurons ?? 3}
            synapses={data?.synapses}
            simulationMode={data?.final_mode || 'EVENT-DRIVEN'}
            showDetails={false}
            interactive={true}
          />
          <div className="panel-footer-action">
            <button
              type="button"
              className="action-link-btn"
              onClick={() => setActivePage('Network')}
            >
              Inspect Neural Topology &amp; LIF Parameters →
            </button>
          </div>
        </div>

        <div className="dashboard-grid-right">
          <ControllerPanel
            currentMode={data.final_mode}
            currentSpikeRate={currentWindow?.spike_rate || 0}
            modeSwitches={data.adaptive_mode_switches}
          />
          <div className="panel-footer-action">
            <button
              type="button"
              className="action-link-btn"
              onClick={() => setActivePage('Controller')}
            >
              Deep Dive into Hysteresis Rules &amp; Tuning →
            </button>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="dashboard-timeline-section">
        <ModeTimeline windows={data.windows} />
      </section>

      {/* Bottom Deep Dive Nav Cards */}
      <section className="research-nav-cards">
        <div className="research-card" onClick={() => setActivePage('Workload')}>
          <div className="card-kicker">WORKLOAD PROFILING</div>
          <h4>Spike Density &amp; Activity Distributions</h4>
          <p>
            Explore window-by-window spike rate curves, volume bars, and future event density metrics.
          </p>
          <span className="card-action-text">View Workload Analysis →</span>
        </div>

        <div className="research-card" onClick={() => setActivePage('Performance')}>
          <div className="card-kicker">QUANTITATIVE AUDIT</div>
          <h4>Baseline Update Comparison</h4>
          <p>
            Compare the measured event updates against time updates and view upcoming benchmark slots.
          </p>
          <span className="card-action-text">View Performance Benchmarks →</span>
        </div>

        <div className="research-card" onClick={() => setActivePage('Experiments')}>
          <div className="card-kicker">RESEARCH PROTOCOLS</div>
          <h4>Benchmark Scenarios &amp; Datasets</h4>
          <p>
            Review active sparse-dense burst protocol, recorded experiment history, and planned benchmarks.
          </p>
          <span className="card-action-text">View Experiment Matrix →</span>
        </div>
      </section>
    </div>
  );
}
