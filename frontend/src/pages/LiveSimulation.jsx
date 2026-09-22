import React, { useEffect, useState, useMemo } from 'react';
import EventLog from '../components/EventLog';
import SimulationConfigPanel from '../components/SimulationConfigPanel';
import NeuralNetwork from '../components/NeuralNetwork';
import SnnPlaybackBar from '../components/SnnPlaybackBar';
import { useSnnPlayback } from '../hooks/useSnnPlayback';
import { reconstructExecutionEvents, getBackendStatus, getExperimentHistory } from '../services/simulationApi';

export default function LiveSimulation({
  data,
  onRunSimulation,
  isRunning,
  setIsRunning,
  liveActiveNeurons = new Set(),
  liveActiveSynapses = new Set(),
  liveSpikeCounts = {},
  liveMode = null,
  liveClock = null,
  liveEvents = [],
  wsStatus = 'disconnected',
}) {
  const [backendStatus, setBackendStatus] = useState(null);
  const [recordedEvents, setRecordedEvents] = useState([]);

  useEffect(() => {
    let isMounted = true;
    getBackendStatus().then((status) => {
      if (isMounted) setBackendStatus(status);
    });

    getExperimentHistory().then((history) => {
      if (isMounted && history && history.length > 0) {
        const latest = history[0];
        if (latest.events && latest.events.length > 0) {
          setRecordedEvents(latest.events);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const neuronsCount = data?.neurons ?? 3;
  const synapses = useMemo(() => {
    if (Array.isArray(data?.synapses) && data.synapses.length > 0) {
      return data.synapses;
    }
    const chain = [];
    for (let i = 0; i < neuronsCount - 1; i++) {
      chain.push({
        source: i,
        target: i + 1,
        weight: 1.0,
        delay: 1.0,
      });
    }
    return chain;
  }, [data?.synapses, neuronsCount]);

  // Hook for playback replay when not in a live execution run
  const playback = useSnnPlayback({
    initialEvents: liveEvents.length > 0 ? liveEvents : recordedEvents,
    autoReset: false,
  });

  // Pick active visual states: live if currently running, playback if user is playing replay
  const effectiveActiveNeurons = isRunning ? liveActiveNeurons : playback.activeNeurons;
  const effectiveActiveSynapses = isRunning ? liveActiveSynapses : playback.activeSynapses;
  const effectiveSpikeCounts = isRunning ? liveSpikeCounts : playback.spikeCounts;
  const effectiveMode = isRunning
    ? liveMode || data?.final_mode || 'EVENT-DRIVEN'
    : playback.currentMode || data?.final_mode || 'EVENT-DRIVEN';
  const effectiveClock = isRunning ? liveClock : playback.currentTime;

  const executionLogEvents = data ? reconstructExecutionEvents(data) : [];
  const isBridgeReady = backendStatus?.status === 'ready';

  return (
    <div className="page-container live-simulation-page">
      {/* Simulation Runner Panel */}
      <section className="live-runner-section">
        <SimulationConfigPanel
          onRunComplete={onRunSimulation}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          backendStatus={backendStatus}
        />
      </section>

      {/* Live SNN Dynamic Topology Visualizer */}
      <section className="live-topology-section">
        <NeuralNetwork
          neuronsCount={neuronsCount}
          synapses={synapses}
          activeNeurons={effectiveActiveNeurons}
          activeSynapses={effectiveActiveSynapses}
          spikeCounts={effectiveSpikeCounts}
          simulationMode={effectiveMode}
          playbackTime={effectiveClock}
          showDetails={true}
          interactive={true}
        />

        {/* Playback controller (active when not in live running mode) */}
        {!isRunning && playback.events.length > 0 && (
          <SnnPlaybackBar
            isPlaying={playback.isPlaying}
            onTogglePlay={() => playback.setIsPlaying(!playback.isPlaying)}
            currentIndex={playback.currentIndex}
            totalEvents={playback.events.length}
            currentTime={playback.currentTime}
            speed={playback.speed}
            onSpeedChange={playback.setSpeed}
            onStepForward={playback.stepForward}
            onStepBackward={playback.stepBackward}
            onReset={playback.reset}
            onSeek={playback.seekToProgress}
            currentMode={playback.currentMode}
          />
        )}
      </section>

      {/* Live Console Control Bar */}
      <section className="live-console-card">
        <div className="console-header-bar">
          <div>
            <span className="section-kicker">INTERACTIVE EXECUTION COCKPIT</span>
            <h3 className="section-heading">Live Telemetry &amp; Process State</h3>
          </div>
          <div className="safety-interlock-badge">
            <span
              className={`status-dot ${
                wsStatus === 'connected'
                  ? 'dot-active'
                  : isBridgeReady
                  ? 'dot-event'
                  : 'dot-error'
              }`}
            />
            <span className="mono">
              {wsStatus === 'connected'
                ? 'WEBSOCKET TELEMETRY STREAM ONLINE (PORT 3000/ws)'
                : isBridgeReady
                ? 'API BRIDGE ONLINE (HTTP PORT 3000) — WS CONNECTING'
                : 'API BRIDGE OFFLINE — STATIC LOCAL FEED'}
            </span>
          </div>
        </div>

        {/* Telemetry Readouts */}
        <div className="live-telemetry-strip">
          <div className="telemetry-box">
            <span className="telemetry-label">SIMULATION CLOCK</span>
            <div className="telemetry-val mono">
              {effectiveClock !== null && effectiveClock !== undefined
                ? `${effectiveClock.toFixed(2)} ms`
                : data?.simulation_time !== undefined
                ? `${data.simulation_time.toFixed(2)} ms`
                : '—'}
            </div>
            <span className="telemetry-sub">
              {isRunning ? '⚡ Streaming real-time clock' : 'Total duration'}
            </span>
          </div>

          <div className="telemetry-box">
            <span className="telemetry-label">CURRENT STRATEGY</span>
            <div
              className={`telemetry-val mono ${
                effectiveMode === 'EVENT-DRIVEN' ? 'txt-cyan' : 'txt-amber'
              }`}
            >
              {effectiveMode}
            </div>
            <span className="telemetry-sub">Adaptive controller state</span>
          </div>

          <div className="telemetry-box">
            <span className="telemetry-label">ACTIVE POPULATION</span>
            <div className="telemetry-val mono">
              {neuronsCount}
              <small className="unit-sub"> neurons</small>
            </div>
            <span className="telemetry-sub">{synapses.length} synapses configured</span>
          </div>

          <div className="telemetry-box">
            <span className="telemetry-label">MODE SWITCH COUNT</span>
            <div className="telemetry-val mono">
              {data?.adaptive_mode_switches !== undefined
                ? data.adaptive_mode_switches
                : '—'}
            </div>
            <span className="telemetry-sub">Regime migrations</span>
          </div>
        </div>

        <div className="interlock-notice-box">
          <strong>Process Control Architecture:</strong>
          <p>
            Simulations are executed by the Node.js API bridge invoking <code>build/aed_snn.exe</code> in real time.
            Spikes and synaptic events are streamed over WebSocket (<code>ws://localhost:3000/ws</code>) directly into the neural topology canvas.
          </p>
        </div>
      </section>

      {/* Target IPC / WebSocket Bridge Blueprint */}
      <section className="ipc-blueprint-card">
        <div className="blueprint-header">
          <span className="section-kicker">TECHNICAL INTEGRATION ARCHITECTURE</span>
          <h4>Active Real-Time Simulation Pipeline</h4>
        </div>

        <div className="blueprint-pipeline-diagram">
          <div className="bp-block">
            <span className="bp-tag">C++ SIMULATOR</span>
            <strong>build/aed_snn.exe</strong>
            <p className="mono">Unbuffered stdout streaming → child_process pipe</p>
          </div>
          <span className="bp-connector">⇄ stdio stream</span>
          <div className="bp-block">
            <span className="bp-tag">API BRIDGE</span>
            <strong>Node.js Express &amp; WS (:3000)</strong>
            <p className="mono">/api/simulation/run &amp; ws://localhost:3000/ws</p>
          </div>
          <span className="bp-connector">⇄ WebSocket &amp; HTTP</span>
          <div className="bp-block">
            <span className="bp-tag">FRONTEND SNN TOPOLOGY</span>
            <strong>Dynamic SNN Graph</strong>
            <p className="mono">Scales to N neurons with real-time flash &amp; pulse</p>
          </div>
        </div>
      </section>

      {/* Reconstructed Event Stream */}
      <section className="live-event-section">
        <EventLog events={executionLogEvents} />
      </section>
    </div>
  );
}
