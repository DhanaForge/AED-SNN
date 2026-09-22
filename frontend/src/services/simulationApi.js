/**
 * AED-SNN Simulation API Service
 * 
 * Communicates with the Node.js/Express API Bridge (or Cloud Backend),
 * which securely orchestrates the C++ AED-SNN simulation engine.
 * Includes automatic seamless fallback to the In-Browser LIF Simulation Engine
 * and static public datasets for zero-setup execution on Netlify and mobile devices.
 */

import { runClientSimulation } from './clientSimulationEngine';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Detect if modern browser will block mixed content (HTTP API call from HTTPS origin)
const isBrowser = typeof window !== 'undefined';
const isHttpsOrigin = isBrowser && window.location.protocol === 'https:';
const isMixedContentBlocked = isHttpsOrigin && API_BASE.startsWith('http://');

// Global registry for client-side telemetry subscribers
const clientTelemetryListeners = new Set();

/**
 * Check backend API and C++ simulator readiness
 */
export async function getBackendStatus() {
  if (!isMixedContentBlocked) {
    try {
      const res = await fetch(`${API_BASE}/api/status`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running on configured port
    }
  }

  // If on Netlify / Cloud HTTPS or API bridge not running
  const isNetlifyOrCloud = isBrowser && (
    window.location.hostname.includes('netlify') ||
    window.location.hostname.includes('vercel') ||
    isHttpsOrigin
  );

  return {
    status: isNetlifyOrCloud ? 'client_engine' : 'offline_fallback',
    simulator: 'aed_snn',
    engine: isNetlifyOrCloud ? 'In-Browser Biological LIF SNN' : 'C++ (Offline)',
    version: '1.0',
    binary_found: isNetlifyOrCloud,
    message: isNetlifyOrCloud
      ? 'Running In-Browser LIF Engine (Standalone Netlify Deployment)'
      : 'Connecting via static file feed.',
  };
}

/**
 * Execute simulation with user-defined parameters.
 * Tries cloud/local API bridge first; falls back seamlessly to the
 * in-browser biological LIF simulator with real-time telemetry streaming.
 */
export async function runSimulation(config) {
  // 1. Try authoritative C++ backend if reachable and not blocked by mixed content
  if (!isMixedContentBlocked) {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const payload = await res.json();
        validateSimulationData(payload.results);
        return payload;
      }
    } catch (err) {
      console.warn('API Bridge unreachable; switching to in-browser LIF engine:', err.message);
    }
  }

  // 2. Standalone In-Browser LIF Simulation Engine (Netlify / Mobile / Remote)
  // Notify listeners that simulation is beginning
  const startEvt = {
    type: 'simulation_start',
    config,
    timestamp: new Date().toISOString(),
  };
  clientTelemetryListeners.forEach((fn) => {
    try { fn(startEvt); } catch {}
  });

  const payload = runClientSimulation(config);

  // Stream telemetry events asynchronously so UI visualizer dynamically animates
  if (Array.isArray(payload.events) && payload.events.length > 0) {
    const totalSimTime = payload.results?.simulation_time || 30.0;
    const streamDurationMs = Math.min(1800, Math.max(700, totalSimTime * 30));
    const stepMs = Math.max(16, streamDurationMs / payload.events.length);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < payload.events.length) {
        const evt = payload.events[idx++];
        clientTelemetryListeners.forEach((fn) => {
          try { fn(evt); } catch {}
        });
      } else {
        clearInterval(interval);
        const completeEvt = {
          type: 'simulation_complete',
          results: payload.results,
          wall_clock_ms: payload.wall_clock_ms,
        };
        clientTelemetryListeners.forEach((fn) => {
          try { fn(completeEvt); } catch {}
        });
      }
    }, stepMs);
  }

  validateSimulationData(payload.results);
  return payload;
}

/**
 * Fetches authoritative simulation results
 * Tries API Bridge first, falls back to static /data/results.json
 */
export async function fetchSimulationResults() {
  // 1. Try API Bridge
  if (!isMixedContentBlocked) {
    try {
      const res = await fetch(`${API_BASE}/api/simulation/results?_t=${Date.now()}`, {
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = await res.json();
        validateSimulationData(data);
        return data;
      }
    } catch {
      // API Bridge not running, fallback to static public files
    }
  }

  // 2. Static file fallbacks
  const endpoints = ['/data/results.json', '/results.json'];
  let lastError = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(`${url}?_t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        validateSimulationData(data);
        return data;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message || 'Failed to load simulation results from dataset.'
  );
}

/**
 * Retrieves recorded experiment runs
 * Tries API bridge first, falls back to static experiments.json
 */
export async function getExperimentHistory() {
  if (!isMixedContentBlocked) {
    try {
      const res = await fetch(`${API_BASE}/api/experiments?_t=${Date.now()}`, {
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      // fallback
    }
  }

  const endpoints = ['/data/experiments.json', '/experiments.json'];
  for (const url of endpoints) {
    try {
      const res = await fetch(`${url}?_t=${Date.now()}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch {}
  }

  return [];
}

/**
 * Retrieves single experiment by ID
 */
export async function getExperimentById(id) {
  if (!isMixedContentBlocked) {
    try {
      const res = await fetch(`${API_BASE}/api/experiments/${encodeURIComponent(id)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
  }

  const history = await getExperimentHistory();
  const match = history.find((exp) => exp.id === id);
  if (match) return match;

  throw new Error(`Experiment ${id} not found.`);
}

/**
 * Validates that simulation data adheres to authoritative C++ AED-SNN schema
 */
function validateSimulationData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid simulation payload: Expected JSON object.');
  }

  if (typeof data.simulation_time !== 'number') {
    throw new Error('Simulation payload missing required field: simulation_time');
  }

  if (!Array.isArray(data.windows)) {
    throw new Error('Simulation payload missing required array: windows');
  }
}

/**
 * Derives statistical summaries strictly from authoritative window data
 */
export function calculateSummary(data) {
  if (!data || !data.windows || data.windows.length === 0) {
    return {
      totalSpikes: 0,
      peakSpikeRate: 0,
      avgSpikeRate: 0,
      totalWindows: 0,
      eventDrivenWindows: 0,
      timeDrivenWindows: 0,
    };
  }

  const windows = data.windows;
  const totalSpikes = windows.reduce((acc, w) => acc + (w.spikes || 0), 0);
  const peakSpikeRate = Math.max(...windows.map((w) => w.spike_rate || 0));
  const avgSpikeRate =
    windows.reduce((acc, w) => acc + (w.spike_rate || 0), 0) / windows.length;
  const eventDrivenWindows = windows.filter((w) => w.mode === 'EVENT-DRIVEN').length;
  const timeDrivenWindows = windows.filter((w) => w.mode === 'TIME-DRIVEN').length;

  return {
    totalSpikes,
    peakSpikeRate,
    avgSpikeRate,
    totalWindows: windows.length,
    eventDrivenWindows,
    timeDrivenWindows,
  };
}

/**
 * Reconstructs accurate chronological event chronicle from backend trace
 */
export function reconstructExecutionEvents(data) {
  if (!data || !data.windows) return [];

  const events = [
    {
      time: '0.00 ms',
      type: 'INIT',
      category: 'System',
      description: 'Simulator initialized with LIF neuron chain, Δt = 1.00 ms.',
      level: 'info',
    },
  ];

  data.windows.forEach((w, idx) => {
    events.push({
      time: `${w.end_time.toFixed(2)} ms`,
      type: 'WINDOW',
      category: 'Workload Monitor',
      description: `Window ${idx} observed: ${w.spikes} spikes, rate = ${w.spike_rate.toFixed(2)} spikes/ms (${w.start_time.toFixed(1)}–${w.end_time.toFixed(1)} ms).`,
      level: 'neutral',
    });

    // Detect mode switches between consecutive windows
    if (idx > 0 && data.windows[idx - 1].mode !== w.mode) {
      events.push({
        time: `${w.start_time.toFixed(2)} ms`,
        type: 'SWITCH',
        category: 'Adaptive Controller',
        description: `Threshold triggered: Switched mode from ${data.windows[idx - 1].mode} → ${w.mode}.`,
        level: w.mode === 'TIME-DRIVEN' ? 'accent-warn' : 'accent-cool',
      });
    }
  });

  events.push({
    time: `${data.simulation_time.toFixed(2)} ms`,
    type: 'COMPLETE',
    category: 'System',
    description: `Simulation execution complete. Final Mode: ${data.final_mode}. Total Mode Switches: ${data.adaptive_mode_switches}.`,
    level: 'success',
  });

  return events;
}

/**
 * Establishes a WebSocket connection to the AED-SNN telemetry stream
 * Or registers with the in-browser simulation engine when deployed statically.
 */
export function connectSimulationWebSocket(onMessage, onStatusChange) {
  // Always register callback with local client telemetry listener
  if (onMessage) {
    clientTelemetryListeners.add(onMessage);
  }

  // If mixed content is blocked (e.g. static Netlify without cloud backend configured),
  // do not open a failing connection to localhost
  if (isMixedContentBlocked) {
    if (onStatusChange) onStatusChange('connected');
    return () => {
      if (onMessage) clientTelemetryListeners.delete(onMessage);
    };
  }

  let ws = null;
  let reconnectTimer = null;
  let isClosedManually = false;

  const getWsUrl = () => {
    try {
      const url = new URL(API_BASE);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${url.host}/ws`;
    } catch {
      return 'ws://localhost:3000/ws';
    }
  };

  const connect = () => {
    if (isClosedManually) return;
    try {
      if (onStatusChange) onStatusChange('connecting');
      ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        if (onStatusChange) onStatusChange('connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (onMessage) onMessage(payload);
        } catch (e) {
          console.error('[WS Client] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        if (onStatusChange) onStatusChange('disconnected');
        if (!isClosedManually) {
          reconnectTimer = setTimeout(connect, 4000);
        }
      };

      ws.onerror = () => {
        if (onStatusChange) onStatusChange('error');
        try {
          ws.close();
        } catch {}
      };
    } catch {
      if (onStatusChange) onStatusChange('disconnected');
      if (!isClosedManually) {
        reconnectTimer = setTimeout(connect, 4000);
      }
    }
  };

  connect();

  return () => {
    isClosedManually = true;
    if (onMessage) clientTelemetryListeners.delete(onMessage);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
  };
}
