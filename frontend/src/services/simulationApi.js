/**
 * AED-SNN Simulation API Service
 * 
 * Communicates with the Node.js/Express API Bridge (http://localhost:3000),
 * which securely orchestrates the C++ AED-SNN simulation engine.
 * Includes automatic fallback to static /data/results.json if the bridge is offline.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Check backend API and C++ simulator readiness
 */
export async function getBackendStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    console.warn('API Bridge not reachable on port 3000; fallback mode active.');
  }

  return {
    status: 'offline_fallback',
    simulator: 'aed_snn',
    engine: 'C++',
    version: '0.2',
    binary_found: false,
    message: 'Connecting via static file feed.',
  };
}

/**
 * Execute C++ simulation with user-defined parameters
 */
export async function runSimulation(config) {
  const res = await fetch(`${API_BASE}/api/simulation/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    let errorDetail = 'Simulation run failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.message || errJson.details?.join(', ') || errJson.error || errorDetail;
    } catch {
      errorDetail = `Server responded with status ${res.status}`;
    }
    throw new Error(errorDetail);
  }

  const payload = await res.json();
  validateSimulationData(payload.results);
  return payload;
}

/**
 * Fetches authoritative simulation results
 * Tries API Bridge first, falls back to static /data/results.json
 */
export async function fetchSimulationResults() {
  // 1. Try API Bridge
  try {
    const res = await fetch(`${API_BASE}/api/simulation/results?_t=${Date.now()}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      validateSimulationData(data);
      return data;
    }
  } catch {
    // API Bridge not running, fallback to static public files
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
    lastError?.message || 'Failed to load authoritative simulation results from backend.'
  );
}

/**
 * Retrieves recorded experiment runs from API bridge
 */
export async function getExperimentHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/experiments?_t=${Date.now()}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch experiment history:', err.message);
  }
  return [];
}

/**
 * Retrieves single experiment by ID
 */
export async function getExperimentById(id) {
  const res = await fetch(`${API_BASE}/api/experiments/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Experiment ${id} not found.`);
  }
  return await res.json();
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
 * @param {Function} onMessage - Callback for parsed telemetry events
 * @param {Function} onStatusChange - Callback for socket connection status ('connecting' | 'connected' | 'disconnected' | 'error')
 * @returns {Function} cleanup - Function to disconnect the socket
 */
export function connectSimulationWebSocket(onMessage, onStatusChange) {
  let ws = null;
  let reconnectTimer = null;
  let isClosedManually = false;

  const getWsUrl = () => {
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = loc.hostname || 'localhost';
    return `${protocol}//${host}:3000/ws`;
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
          reconnectTimer = setTimeout(connect, 3000);
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
        reconnectTimer = setTimeout(connect, 3000);
      }
    }
  };

  connect();

  return () => {
    isClosedManually = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
  };
}

