import React from 'react';
import WorkloadChart from '../components/WorkloadChart';
import MetricCard from '../components/MetricCard';
import { calculateSummary } from '../services/simulationApi';

export default function Workload({ data }) {
  const summary = calculateSummary(data);

  return (
    <div className="page-container workload-page">
      {/* Workload Statistical Overview */}
      <section className="metrics-grid">
        <MetricCard
          label="TOTAL SPIKES"
          value={summary.totalSpikes}
          unit="spikes"
          status="MEASURED"
          description="Total spikes accumulated across all windows"
          accent="cyan"
          dataSource="sum(windows.spikes)"
        />

        <MetricCard
          label="PEAK SPIKE RATE"
          value={summary.peakSpikeRate.toFixed(2)}
          unit="spikes/ms"
          status="MEASURED"
          description="Highest window rate observed (Window 1 burst)"
          accent="amber"
          dataSource="max(windows.spike_rate)"
        />

        <MetricCard
          label="AVERAGE SPIKE RATE"
          value={summary.avgSpikeRate.toFixed(2)}
          unit="spikes/ms"
          status="DERIVED"
          description="Mean spike frequency across 6 evaluation windows"
          accent="neutral"
          dataSource="mean(windows.spike_rate)"
        />

        <MetricCard
          label="WINDOW PARTITION"
          value={`${summary.eventDrivenWindows}E / ${summary.timeDrivenWindows}T`}
          unit=""
          status="MEASURED"
          description="5 Event-Driven windows vs 1 Time-Driven window"
          accent="emerald"
          dataSource="windows.mode tally"
        />
      </section>

      {/* Main Scientific Workload Chart */}
      <section className="workload-chart-section">
        <WorkloadChart windows={data?.windows || []} />
      </section>

      {/* Tabular Window Breakdown */}
      <section className="workload-table-section">
        <div className="table-header-bar">
          <div>
            <span className="section-kicker">EXACT WINDOW MEASUREMENTS</span>
            <h4 className="section-heading">Simulation Window Telemetry Table</h4>
          </div>
          <span className="table-badge mono">6 EVALUATION WINDOWS</span>
        </div>

        <div className="table-wrapper">
          <table className="scientific-table">
            <thead>
              <tr>
                <th>WINDOW</th>
                <th>START (ms)</th>
                <th>END (ms)</th>
                <th>DURATION (ms)</th>
                <th>SPIKES DETECTED</th>
                <th>SPIKE RATE (spk/ms)</th>
                <th>ADAPTED STRATEGY</th>
              </tr>
            </thead>
            <tbody>
              {data?.windows?.map((w, idx) => (
                <tr key={`win-row-${idx}`}>
                  <td className="mono">Window {idx}</td>
                  <td className="mono">{w.start_time.toFixed(2)}</td>
                  <td className="mono">{w.end_time.toFixed(2)}</td>
                  <td className="mono">{(w.end_time - w.start_time).toFixed(2)}</td>
                  <td className="mono">{w.spikes}</td>
                  <td className="mono font-semibold">{w.spike_rate.toFixed(2)}</td>
                  <td>
                    <span
                      className={`mode-pill-table ${
                        w.mode === 'EVENT-DRIVEN' ? 'pill-event' : 'pill-time'
                      }`}
                    >
                      {w.mode}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Future Workload Metrics (Labeled: AVAILABLE AFTER BACKEND METRIC INTEGRATION) */}
      <section className="future-metrics-section">
        <div className="future-header">
          <span className="section-kicker">PLANNED RESEARCH TELEMETRY</span>
          <h4 className="section-heading">Future Workload Telemetry Slots</h4>
          <p className="future-sub">
            These metrics represent upcoming instrumentation points in <code>WorkloadMonitor.cpp</code>.
            In accordance with scientific integrity guidelines, placeholders are reserved without fabricating values.
          </p>
        </div>

        <div className="future-grid">
          <div className="future-slot-card">
            <span className="future-badge">AVAILABLE AFTER BACKEND METRIC INTEGRATION</span>
            <h5>Event Density (events / ms)</h5>
            <p>
              Quantifies input and synaptic queue arrival rates per millisecond across heterogeneous layers.
            </p>
            <div className="future-placeholder-val mono">—</div>
          </div>

          <div className="future-slot-card">
            <span className="future-badge">AVAILABLE AFTER BACKEND METRIC INTEGRATION</span>
            <h5>Active Neuron Ratio (%)</h5>
            <p>
              Measures percentage of population neurons receiving subthreshold integration in current window.
            </p>
            <div className="future-placeholder-val mono">—</div>
          </div>

          <div className="future-slot-card">
            <span className="future-badge">AVAILABLE AFTER BACKEND METRIC INTEGRATION</span>
            <h5>Event Queue Length (Peak / Mean)</h5>
            <p>
              Tracks instantaneous min-heap depth in <code>EventQueue.cpp</code> to analyze memory access overhead.
            </p>
            <div className="future-placeholder-val mono">—</div>
          </div>

          <div className="future-slot-card">
            <span className="future-badge">AVAILABLE AFTER BACKEND METRIC INTEGRATION</span>
            <h5>Burstiness Index (Fano Factor)</h5>
            <p>
              Calculates variance-to-mean ratio of inter-spike intervals to diagnose burst clustering.
            </p>
            <div className="future-placeholder-val mono">—</div>
          </div>

          <div className="future-slot-card">
            <span className="future-badge">AVAILABLE AFTER BACKEND METRIC INTEGRATION</span>
            <h5>Inter-Arrival Distribution</h5>
            <p>
              Classifies incoming stimuli as Poisson-distributed, periodic, or clustered deterministic cascades.
            </p>
            <div className="future-placeholder-val mono">—</div>
          </div>

          <div className="future-slot-card">
            <span className="future-badge">AVAILABLE AFTER BACKEND METRIC INTEGRATION</span>
            <h5>Synaptic Fan-Out Dispersion</h5>
            <p>
              Profiles post-synaptic transmission fan-out across recurrent connection matrices.
            </p>
            <div className="future-placeholder-val mono">—</div>
          </div>
        </div>
      </section>
    </div>
  );
}
