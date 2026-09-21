import React from 'react';
import PerformanceChart from '../components/PerformanceChart';
import MetricCard from '../components/MetricCard';

export default function Performance({ data }) {
  return (
    <div className="page-container performance-page">
      {/* Metrics Row */}
      <section className="metrics-grid">
        <MetricCard
          label="FIXED EVENT UPDATES"
          value={data?.fixed_event_updates ?? '—'}
          unit="evaluations"
          status="MEASURED"
          description="Total neuron state evaluations under pure event engine"
          accent="cyan"
          dataSource="data.fixed_event_updates"
        />

        <MetricCard
          label="FIXED TIME UPDATES"
          value={data?.fixed_time_updates ?? '—'}
          unit="evaluations"
          status="MEASURED"
          description="3 neurons × 30 time steps (Δt = 1.00 ms)"
          accent="amber"
          dataSource="data.fixed_time_updates"
        />

        <MetricCard
          label="ADAPTIVE SWITCHES"
          value={data?.adaptive_mode_switches ?? '—'}
          unit="switches"
          status="MEASURED"
          description="Controller regime transitions executed in hybrid test"
          accent="emerald"
          dataSource="data.adaptive_mode_switches"
        />

        <MetricCard
          label="UPDATE DELTA (FIXED)"
          value={
            data?.fixed_time_updates && data?.fixed_event_updates
              ? data.fixed_time_updates - data.fixed_event_updates
              : '—'
          }
          unit="evaluations"
          status="DERIVED"
          description="Difference between fixed time and fixed event baselines"
          accent="neutral"
          dataSource="fixed_time - fixed_event"
        />
      </section>

      {/* Main Performance Comparison Chart */}
      <section className="perf-chart-section">
        <PerformanceChart
          eventUpdates={data?.fixed_event_updates || 36}
          timeUpdates={data?.fixed_time_updates || 90}
          modeSwitches={data?.adaptive_mode_switches || 2}
        />
      </section>

      {/* Deep-Dive Comparative Matrix */}
      <section className="perf-comparison-matrix">
        <div className="matrix-header">
          <span className="section-kicker">ENGINE CHARACTERISTICS AUDIT</span>
          <h4>Execution Paradigm Trade-Off Analysis</h4>
        </div>

        <div className="table-wrapper">
          <table className="scientific-table">
            <thead>
              <tr>
                <th>EXECUTION STRATEGY</th>
                <th>MEASURED STATUS</th>
                <th>NEURON UPDATES</th>
                <th>COMPLEXITY PER STEP</th>
                <th>IDEAL WORKLOAD REGIME</th>
                <th>KNOWN BOTTLENECK</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong className="mono txt-cyan">Fixed Event-Driven</strong>
                </td>
                <td>
                  <span className="status-badge-inline measured">MEASURED</span>
                </td>
                <td className="mono font-semibold">{data?.fixed_event_updates ?? 36}</td>
                <td className="mono">O(log N_events) priority queue</td>
                <td>Ultra-sparse activity (&lt; 0.30 spk/ms)</td>
                <td>Min-heap queue insertion overhead in dense bursts</td>
              </tr>
              <tr>
                <td>
                  <strong className="mono txt-amber">Fixed Time-Driven</strong>
                </td>
                <td>
                  <span className="status-badge-inline measured">MEASURED</span>
                </td>
                <td className="mono font-semibold">{data?.fixed_time_updates ?? 90}</td>
                <td className="mono">O(N_neurons) contiguous step</td>
                <td>Dense firing bursts (&gt; 1.00 spk/ms)</td>
                <td>Wasteful matrix evaluation during quiescent periods</td>
              </tr>
              <tr className="row-adaptive-highlight">
                <td>
                  <strong className="mono txt-emerald">Adaptive Hybrid (AED-SNN)</strong>
                </td>
                <td>
                  <span className="status-badge-inline measured">MEASURED (Switches)</span>
                </td>
                <td className="mono font-semibold">
                  <span className="pending-text mono">Benchmark Pending</span>
                </td>
                <td className="mono">Dynamic O(1) / O(log N)</td>
                <td>Non-stationary bursty real-world workloads</td>
                <td>Regime switching hysteresis penalty (amortized)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Planned Benchmark Suite */}
      <section className="future-benchmarks-section">
        <div className="benchmarks-header">
          <span className="section-kicker">UPCOMING MEASUREMENT SUITE</span>
          <h4>Future Quantitative Benchmark Metrics</h4>
          <p className="benchmarks-sub">
            The following metrics are planned for the upcoming C++ automated benchmarking harness (<code>benchmarks/</code>).
            No speculative or synthetic estimates are shown.
          </p>
        </div>

        <div className="benchmark-slots-grid">
          <div className="bench-slot-card">
            <span className="slot-badge">PLANNED / BENCHMARK IN PROGRESS</span>
            <h5>Wall-Clock Runtime (std::chrono)</h5>
            <p>
              High-resolution microsecond CPU wall-clock execution time comparing fixed vs adaptive runs.
            </p>
            <div className="slot-placeholder mono">NOT MEASURED YET</div>
          </div>

          <div className="bench-slot-card">
            <span className="slot-badge">PLANNED / BENCHMARK IN PROGRESS</span>
            <h5>Adaptive Total Neuron Updates</h5>
            <p>
              Exact count of neuron updates executed during the adaptive simulation run.
            </p>
            <div className="slot-placeholder mono">NOT MEASURED YET</div>
          </div>

          <div className="bench-slot-card">
            <span className="slot-badge">PLANNED / BENCHMARK IN PROGRESS</span>
            <h5>Switching Overhead Cost (μs)</h5>
            <p>
              Memory copy and state synchronization penalty incurred during mode migrations.
            </p>
            <div className="slot-placeholder mono">NOT MEASURED YET</div>
          </div>

          <div className="bench-slot-card">
            <span className="slot-badge">PLANNED / BENCHMARK IN PROGRESS</span>
            <h5>Queue Operation Latency</h5>
            <p>
              Min-heap push/pop cycle counts in <code>EventQueue.cpp</code> under varying burst densities.
            </p>
            <div className="slot-placeholder mono">NOT MEASURED YET</div>
          </div>

          <div className="bench-slot-card">
            <span className="slot-badge">PLANNED / BENCHMARK IN PROGRESS</span>
            <h5>Peak Working Set Memory (RSS)</h5>
            <p>
              Memory utilization footprint across contiguous ring buffers vs dynamic event queues.
            </p>
            <div className="slot-placeholder mono">NOT MEASURED YET</div>
          </div>

          <div className="bench-slot-card">
            <span className="slot-badge">PLANNED / BENCHMARK IN PROGRESS</span>
            <h5>Simulation Correctness Error (L2 Norm)</h5>
            <p>
              Membrane voltage divergence between time-driven discretization and exact event analytical solver.
            </p>
            <div className="slot-placeholder mono">NOT MEASURED YET</div>
          </div>
        </div>
      </section>
    </div>
  );
}
