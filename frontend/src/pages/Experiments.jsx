import React, { useEffect, useState } from 'react';
import ExperimentCard from '../components/ExperimentCard';
import { getExperimentHistory } from '../services/simulationApi';

export default function Experiments({ data, setActivePage, onLoadHistoricalExperiment }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getExperimentHistory()
      .then((records) => {
        if (isMounted) {
          setHistory(records);
          setLoadingHistory(false);
        }
      })
      .catch((err) => {
        console.warn('Could not load experiment records:', err);
        if (isMounted) setLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [data]);

  const currentExperimentParams = {
    'Neuron Population': `${data?.windows ? 3 : 3} LIF Neurons (Feedforward Chain)`,
    'Simulation Duration': `${data?.simulation_time ?? 30.0} ms`,
    'Evaluation Window (Δt)': '5.00 ms',
    'Integration Step (dt)': '1.00 ms',
    'Low Threshold (θ_low)': '0.30 spikes/ms',
    'High Threshold (θ_high)': '1.00 spikes/ms',
    'Stimulus Regimes': 'Sparse (1ms, 21ms) + Dense Burst (8-9ms, 10 spikes)',
  };

  const syntheticExperiments = [
    {
      id: 'sparse-dense-burst',
      title: 'Sparse-Dense Hybrid Burst (Baseline Protocol)',
      category: 'SYNTHETIC STIMULUS PROTOCOL',
      status: 'MEASURED & LOADED',
      description:
        'Standard test protocol designed to trigger both Event-Driven and Time-Driven regimes. Evaluates controller hysteresis across sparse baseline and 100 Hz high-frequency bursts.',
      params: currentExperimentParams,
      isCurrent: true,
    },
    {
      id: 'ultra-sparse-poisson',
      title: 'Ultra-Sparse Poisson Stimulus',
      category: 'SYNTHETIC STIMULUS PROTOCOL',
      status: 'PLANNED',
      description:
        'Evaluates event-driven efficiency under biological Poisson background activity (λ = 2 Hz). Verifies that the simulator never triggers wasteful time-driven updates.',
      params: {
        'Neuron Population': '100 LIF Neurons',
        'Input Distribution': 'Homogeneous Poisson (λ = 2.0 Hz)',
        'Expected Regime': '100% Event-Driven',
        'Target Metric': 'Event Queue Insertion Speed',
      },
      isCurrent: false,
    },
    {
      id: 'continuous-dense-burst',
      title: 'Continuous Dense Saturation Drive',
      category: 'SYNTHETIC STIMULUS PROTOCOL',
      status: 'PLANNED',
      description:
        'High-rate continuous sinusoidal or constant injection drive. Tests sustained performance of locked time-step updates without mode oscillation.',
      params: {
        'Neuron Population': '100 LIF Neurons',
        'Input Frequency': '150 Hz Continuous Drive',
        'Expected Regime': '100% Time-Driven',
        'Target Metric': 'Vectorized Matrix Update FLOPs',
      },
      isCurrent: false,
    },
    {
      id: 'sparse-to-dense-step',
      title: 'Sparse → Dense Step Transition',
      category: 'REGIME SHIFT PROTOCOL',
      status: 'PLANNED',
      description:
        'Instantaneous step change in stimulus frequency from 5 Hz to 200 Hz. Benchmarks latency of controller detection and mode migration penalty.',
      params: {
        'Neuron Population': '50 Neurons',
        'Transition Point': 't = 50.00 ms',
        'Latency Benchmark': 'Controller Detection Time (ms)',
        'State Migration': 'Ring-buffer state vector sync',
      },
      isCurrent: false,
    },
    {
      id: 'dense-to-sparse-step',
      title: 'Dense → Sparse Step Transition',
      category: 'REGIME SHIFT PROTOCOL',
      status: 'PLANNED',
      description:
        'Sudden cessation of high-frequency drive into quiescent baseline. Evaluates down-switch sensitivity and decay time constant.',
      params: {
        'Neuron Population': '50 Neurons',
        'Transition Point': 't = 50.00 ms',
        'Expected Transition': 'TIME-DRIVEN → EVENT-DRIVEN',
        'Stability Check': 'Zero chatter during decay',
      },
      isCurrent: false,
    },
    {
      id: 'bursty-gamma-arrival',
      title: 'Bursty Clustered Gamma Arrival Sequence',
      category: 'BIOLOGICAL PATTERN PROTOCOL',
      status: 'PLANNED',
      description:
        'Biologically plausible cortical burst model with Gamma-distributed inter-spike intervals. Stresses hysteresis dead-band stability under jitter.',
      params: {
        'Neuron Population': '256 Neurons (Recurrent)',
        'Distribution': 'Gamma (Shape k=2, Scale θ=1.5)',
        'Workload Dynamics': 'Non-stationary burst cascades',
        'Evaluation': 'Mode thrashing resistance',
      },
      isCurrent: false,
    },
  ];

  const neuromorphicDatasets = [
    {
      id: 'n-mnist',
      title: 'N-MNIST (Neuromorphic MNIST)',
      category: 'EVENT CAMERA BENCHMARK',
      status: 'NOT YET CONNECTED',
      description:
        'DVS recording of MNIST digits captured with an asynchronous event-based sensor (ATIS). Features natural sparsity with bursts along digit contours.',
      params: {
        'Sensor Resolution': '128 × 128 pixels (2 channels: ON/OFF)',
        'Temporal Precision': 'Microsecond event timestamps',
        'Integration Status': 'Dataset loader in development',
      },
      isCurrent: false,
    },
    {
      id: 'dvs-gesture',
      title: 'DVS 128 Gesture Dataset',
      category: 'EVENT CAMERA BENCHMARK',
      status: 'NOT YET CONNECTED',
      description:
        'Event streams of human hand and arm gestures under varied illumination. Tests real-time workload-aware adaptive scaling.',
      params: {
        Classes: '11 Gesture Categories',
        'Recording Length': '6.0 s per sample',
        'Integration Status': 'C++ AER parser in progress',
      },
      isCurrent: false,
    },
    {
      id: 'shd-audio',
      title: 'Spiking Heidelberg Digits (SHD)',
      category: 'NEUROMORPHIC AUDIO BENCHMARK',
      status: 'NOT YET CONNECTED',
      description:
        'Spiking audio speech recognition dataset generated with a 700-channel artificial cochlea model. Highly sparse phoneme activity.',
      params: {
        'Input Channels': '700 Frequency Channels',
        'Audio Tokens': 'Spoken Digits 0–9 (English & German)',
        'Integration Status': 'HDF5 spike stream loader planned',
      },
      isCurrent: false,
    },
  ];

  const handleInspectExperiment = (exp) => {
    if (onLoadHistoricalExperiment && exp.results) {
      onLoadHistoricalExperiment(exp.results);
      setActivePage('Dashboard');
    }
  };

  return (
    <div className="page-container experiments-page">
      {/* Real Recorded Experiment History Section */}
      <section className="experiment-history-section">
        <div className="section-title-bar">
          <div>
            <span className="section-kicker">HISTORICAL BENCHMARK RUNS</span>
            <h3 className="section-heading">Recorded Experiment History</h3>
          </div>
          <span className="suite-count mono">
            {loadingHistory ? 'LOADING...' : `${history.length} RUNS ARCHIVED`}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="empty-history-box">
            <p>No historical runs recorded yet. Launch a simulation to archive results.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="scientific-table">
              <thead>
                <tr>
                  <th>EXPERIMENT ID</th>
                  <th>TIMESTAMP</th>
                  <th>WORKLOAD</th>
                  <th>NEURONS</th>
                  <th>DURATION</th>
                  <th>WALL CLOCK</th>
                  <th>MODE SWITCHES</th>
                  <th>FINAL MODE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong className="mono txt-cyan">{item.id}</strong>
                    </td>
                    <td className="mono font-dim">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="mono">{item.config?.workload || 'sparse_dense'}</td>
                    <td className="mono">{item.config?.neurons ?? 3}</td>
                    <td className="mono">{item.config?.simulation_time ?? 30.0} ms</td>
                    <td className="mono">
                      {item.wall_clock_ms ? `${item.wall_clock_ms} ms` : '—'}
                    </td>
                    <td className="mono font-semibold">
                      {item.results?.adaptive_mode_switches ?? '—'}
                    </td>
                    <td>
                      <span
                        className={`mode-pill-table ${
                          item.results?.final_mode === 'EVENT-DRIVEN'
                            ? 'pill-event'
                            : 'pill-time'
                        }`}
                      >
                        {item.results?.final_mode || '—'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="inspect-history-btn"
                        onClick={() => handleInspectExperiment(item)}
                        title="Load this experiment's telemetry into the Dashboard"
                      >
                        Inspect Results →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Active Experiment Highlight Banner */}
      <section className="active-exp-section">
        <div className="active-exp-banner">
          <div className="banner-badge-row">
            <span className="live-pulse-dot" />
            <span className="live-exp-tag mono">ACTIVE EXPERIMENT RUN</span>
            <span className="verified-tag">BACKEND DATA ATTACHED</span>
          </div>
          <h3 className="active-exp-title">Sparse-Dense Hybrid Burst Baseline</h3>
          <p className="active-exp-summary">
            Synthetically verified experiment executing on the C++ simulation backend.
            Feeds input events into the feedforward network across baseline quiescent
            intervals and dense 100 Hz bursts to benchmark dynamic mode switching.
          </p>

          <div className="active-params-row">
            {Object.entries(currentExperimentParams).map(([k, v]) => (
              <div key={k} className="active-param-box">
                <span className="param-title">{k}</span>
                <span className="param-detail mono">{v}</span>
              </div>
            ))}
          </div>

          <div className="active-exp-actions">
            <button
              type="button"
              className="primary-exp-btn"
              onClick={() => setActivePage('Dashboard')}
            >
              Inspect Active Dashboard Metrics →
            </button>
            <button
              type="button"
              className="secondary-exp-btn"
              onClick={() => setActivePage('Workload')}
            >
              Analyze Spike Activity Waveforms →
            </button>
          </div>
        </div>
      </section>

      {/* Synthetic Scenarios Grid */}
      <section className="experiment-grid-section">
        <div className="section-title-bar">
          <div>
            <span className="section-kicker">SYNTHETIC BENCHMARK REGIMES</span>
            <h3 className="section-heading">Workload Calibration Scenarios</h3>
          </div>
          <span className="suite-count mono">6 PROTOCOLS CONFIGURED</span>
        </div>

        <div className="experiments-cards-grid">
          {syntheticExperiments.map((exp) => (
            <ExperimentCard
              key={exp.id}
              title={exp.title}
              category={exp.category}
              status={exp.status}
              description={exp.description}
              params={exp.params}
              isCurrent={exp.isCurrent}
              onSelect={() => setActivePage('Dashboard')}
            />
          ))}
        </div>
      </section>

      {/* Neuromorphic Datasets Section */}
      <section className="neuromorphic-datasets-section">
        <div className="section-title-bar">
          <div>
            <span className="section-kicker">NEUROMORPHIC RESEARCH DATASETS</span>
            <h3 className="section-heading">External Neuromorphic Benchmarks</h3>
          </div>
          <span className="suite-count mono">3 PLANNED DATASETS</span>
        </div>

        <div className="experiments-cards-grid">
          {neuromorphicDatasets.map((exp) => (
            <ExperimentCard
              key={exp.id}
              title={exp.title}
              category={exp.category}
              status={exp.status}
              description={exp.description}
              params={exp.params}
              isCurrent={exp.isCurrent}
              onSelect={() => {}}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
