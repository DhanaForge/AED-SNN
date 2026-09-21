import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Resolve critical filesystem paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.resolve(PROJECT_ROOT, 'build');
const BINARY_NAME = process.platform === 'win32' ? 'aed_snn.exe' : 'aed_snn';
const EXE_PATH = path.resolve(BUILD_DIR, BINARY_NAME);
const DATA_DIR = path.resolve(PROJECT_ROOT, 'data');
const CONFIG_PATH = path.resolve(DATA_DIR, 'simulation_config.json');
const RESULTS_PATH = path.resolve(DATA_DIR, 'results.json');
const FRONTEND_DATA_RESULTS = path.resolve(PROJECT_ROOT, 'frontend/public/data/results.json');
const FRONTEND_ROOT_RESULTS = path.resolve(PROJECT_ROOT, 'frontend/public/results.json');
const EXPERIMENTS_PATH = path.resolve(__dirname, 'data/experiments.json');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(path.resolve(__dirname, 'data'))) fs.mkdirSync(path.resolve(__dirname, 'data'), { recursive: true });

// Configure CORS for local Vite dev servers
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// ==================================================
// WEBSOCKET SERVER SETUP & BROADCASTING
// ==================================================

const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total active clients: ${clients.size}`);

  // Send initial connection acknowledgement
  ws.send(
    JSON.stringify({
      type: 'connected',
      message: 'AED-SNN Live Simulation Telemetry Stream Connected',
      timestamp: new Date().toISOString(),
    })
  );

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.action === 'run' && data.config) {
        runSimulationProcess(data.config, (err, result) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
          }
        });
      }
    } catch (e) {
      console.error('[WS] Error processing message:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total active clients: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Client socket error:', err);
    clients.delete(ws);
  });
});

function broadcastEvent(eventObj) {
  const payload = JSON.stringify(eventObj);
  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  }
}

// Helper: load experiment history safely
function loadExperiments() {
  try {
    if (fs.existsSync(EXPERIMENTS_PATH)) {
      const data = fs.readFileSync(EXPERIMENTS_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading experiments history:', err);
  }
  return [];
}

// Helper: save experiment history safely
function saveExperiments(experiments) {
  try {
    fs.writeFileSync(EXPERIMENTS_PATH, JSON.stringify(experiments, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving experiments history:', err);
  }
}

// Helper: sync results to frontend public folder
function syncResultsToFrontend(resultsContent) {
  try {
    const pubDataDir = path.dirname(FRONTEND_DATA_RESULTS);
    if (!fs.existsSync(pubDataDir)) fs.mkdirSync(pubDataDir, { recursive: true });
    fs.writeFileSync(FRONTEND_DATA_RESULTS, resultsContent, 'utf8');
    fs.writeFileSync(FRONTEND_ROOT_RESULTS, resultsContent, 'utf8');
  } catch (err) {
    console.warn('Could not sync results to frontend/public:', err.message);
  }
}

// ==================================================
// CORE C++ SIMULATION PROCESS RUNNER
// ==================================================

function runSimulationProcess(config, callback) {
  if (!fs.existsSync(EXE_PATH)) {
    return callback(new Error(`Executable not found at ${EXE_PATH}`));
  }

  // 1. Write configuration file for C++ consumption
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  console.log(`[API Bridge] Written configuration to ${CONFIG_PATH}`);

  // Broadcast simulation start
  broadcastEvent({
    type: 'simulation_start',
    config,
    timestamp: new Date().toISOString(),
  });

  const startTime = Date.now();
  const collectedEvents = [];

  // Spawn C++ simulation process directly
  const child = spawn(EXE_PATH, [], {
    cwd: BUILD_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let lineBuffer = '';
  let inAdaptiveSection = false;
  let lastSpikeNeuron = 0;
  let lastSpikeTime = 0.0;
  let currentWindowSpikes = 0;
  let currentWindowEndTime = 0.0;

  child.stdout.on('data', (chunk) => {
    lineBuffer += chunk.toString();
    const lines = lineBuffer.split(/\r?\n/);
    lineBuffer = lines.pop(); // keep partial line in buffer

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Track entry into the adaptive simulator section
      if (line.includes('[3] ADAPTIVE AED-SNN') || line.includes('ADAPTIVE SIMULATION START')) {
        inAdaptiveSection = true;
      }

      // Only parse telemetry for real-time streaming during the adaptive simulation run
      if (!inAdaptiveSection) continue;

      // 1. Window transition: e.g. "Window: 5.00 -> 10.00 ms"
      const windowMatch = line.match(/Window:\s*([\d\.]+)\s*->\s*([\d\.]+)\s*ms/);
      if (windowMatch) {
        const start = parseFloat(windowMatch[1]);
        const end = parseFloat(windowMatch[2]);
        currentWindowEndTime = end;
        const evt = {
          type: 'window_start',
          time: start,
          end_time: end,
          start_time: start,
        };
        collectedEvents.push(evt);
        broadcastEvent(evt);
        continue;
      }

      // 2. Spike event: e.g. "Spike generated by Neuron 2 at time 10.00 ms"
      const spikeMatch = line.match(/Spike generated by Neuron\s+(\d+)\s+at time\s+([\d\.]+)\s+ms/);
      if (spikeMatch) {
        const neuronId = parseInt(spikeMatch[1], 10);
        const time = parseFloat(spikeMatch[2]);
        lastSpikeNeuron = neuronId;
        lastSpikeTime = time;

        const evt = {
          type: 'spike',
          time,
          neuron_id: neuronId,
        };
        collectedEvents.push(evt);
        broadcastEvent(evt);
        continue;
      }

      // 3. Synaptic propagation: e.g. "  -> Event sent to Neuron 1 at time 9.00 ms"
      // or "  -> Event scheduled for Neuron 1 at time 9.00 ms"
      const synapseMatch = line.match(/-> Event (?:sent to|scheduled for) Neuron\s+(\d+)\s+at time\s+([\d\.]+)\s+ms/);
      if (synapseMatch) {
        const target = parseInt(synapseMatch[1], 10);
        const scheduledTime = parseFloat(synapseMatch[2]);
        const evt = {
          type: 'synaptic_event',
          time: scheduledTime,
          source: lastSpikeNeuron,
          target: target,
          source_time: lastSpikeTime,
        };
        collectedEvents.push(evt);
        broadcastEvent(evt);
        continue;
      }

      // 4. Window spikes count: e.g. "Window spikes: 21"
      const spikesCountMatch = line.match(/Window spikes:\s*(\d+)/);
      if (spikesCountMatch) {
        currentWindowSpikes = parseInt(spikesCountMatch[1], 10);
        continue;
      }

      // 5. Window spike rate: e.g. "Window spike rate: 4.20 spikes/ms"
      const rateMatch = line.match(/Window spike rate:\s*([\d\.]+)\s*spikes\/ms/);
      if (rateMatch) {
        const rate = parseFloat(rateMatch[1]);
        const evt = {
          type: 'workload',
          time: currentWindowEndTime,
          spike_rate: rate,
          spikes: currentWindowSpikes,
        };
        collectedEvents.push(evt);
        broadcastEvent(evt);
        continue;
      }

      // 6. Mode Switch: e.g. "Switched to: TIME-DRIVEN"
      const modeMatch = line.match(/Switched to:\s*(EVENT-DRIVEN|TIME-DRIVEN)/);
      if (modeMatch) {
        const mode = modeMatch[1];
        const evt = {
          type: 'mode_change',
          time: currentWindowEndTime,
          mode: mode,
        };
        collectedEvents.push(evt);
        broadcastEvent(evt);
        continue;
      }
    }
  });

  let stderrOutput = '';
  child.stderr.on('data', (data) => {
    stderrOutput += data.toString();
  });

  child.on('close', (code) => {
    const wallClockMs = Date.now() - startTime;

    if (code !== 0) {
      console.error(`[API Bridge] C++ process exited with code ${code}:`, stderrOutput);
      return callback(new Error(`C++ process exited with code ${code}: ${stderrOutput}`));
    }

    console.log(`[API Bridge] Simulation finished in ${wallClockMs}ms. Captured ${collectedEvents.length} live telemetry events.`);

    try {
      if (!fs.existsSync(RESULTS_PATH)) {
        return callback(new Error('C++ simulator finished but results.json was not created.'));
      }

      const rawResults = fs.readFileSync(RESULTS_PATH, 'utf8');
      const results = JSON.parse(rawResults);

      // Sync results to frontend public folder
      syncResultsToFrontend(rawResults);

      // Record experiment in history
      const history = loadExperiments();
      const expId = `EXP-${String(history.length + 1).padStart(3, '0')}`;
      const newExperiment = {
        id: expId,
        timestamp: new Date().toISOString(),
        wall_clock_ms: wallClockMs,
        config,
        results,
        events: collectedEvents,
      };

      history.unshift(newExperiment);
      saveExperiments(history);

      const completionPayload = {
        success: true,
        experiment_id: expId,
        wall_clock_ms: wallClockMs,
        config,
        results,
        events: collectedEvents,
      };

      // Broadcast completion event
      broadcastEvent({
        type: 'simulation_complete',
        ...completionPayload,
      });

      return callback(null, completionPayload);
    } catch (parseErr) {
      console.error('[API Bridge] Failed to parse results.json:', parseErr);
      return callback(new Error('Generated results.json could not be parsed as valid JSON.'));
    }
  });

  child.on('error', (err) => {
    console.error('[API Bridge] Process spawn error:', err);
    callback(err);
  });
}

// ==================================================
// API ENDPOINTS
// ==================================================

/**
 * GET /api/status
 * Health check & simulator binary readiness
 */
app.get('/api/status', (req, res) => {
  const binaryExists = fs.existsSync(EXE_PATH);
  const resultsExist = fs.existsSync(RESULTS_PATH);

  res.json({
    status: binaryExists ? 'ready' : 'simulator_missing',
    simulator: 'aed_snn',
    engine: 'C++',
    version: '0.2',
    binary_found: binaryExists,
    executable_path: EXE_PATH,
    results_available: resultsExist,
    ws_clients: clients.size,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/simulation/results
 * Returns the most recent authoritative results from data/results.json
 */
app.get('/api/simulation/results', (req, res) => {
  try {
    if (!fs.existsSync(RESULTS_PATH)) {
      return res.status(404).json({
        error: 'Results not found',
        message: 'No simulation has been executed yet.',
      });
    }

    const rawData = fs.readFileSync(RESULTS_PATH, 'utf8');
    const parsed = JSON.parse(rawData);
    res.json(parsed);
  } catch (err) {
    console.error('Error reading results.json:', err);
    res.status(500).json({
      error: 'Invalid simulation result',
      message: err.message,
    });
  }
});

/**
 * POST /api/simulation/run
 * Validates configuration, writes config file, executes C++ engine, streams events & returns results
 */
app.post('/api/simulation/run', (req, res) => {
  const {
    neurons = 3,
    simulation_time = 30.0,
    dt = 1.0,
    low_threshold = 0.3,
    high_threshold = 1.0,
    adaptation_window = 5.0,
    workload = 'sparse_dense',
  } = req.body;

  // Strict Validation
  const errors = [];

  const n = parseInt(neurons, 10);
  if (isNaN(n) || n <= 0 || n > 1000) {
    errors.push('neurons must be a positive integer between 1 and 1000');
  }

  const tSim = parseFloat(simulation_time);
  if (isNaN(tSim) || tSim <= 0 || tSim > 5000) {
    errors.push('simulation_time must be a positive number up to 5000 ms');
  }

  const stepDt = parseFloat(dt);
  if (isNaN(stepDt) || stepDt <= 0 || stepDt > 10.0) {
    errors.push('dt must be a positive step size up to 10.0 ms');
  }

  const lowThresh = parseFloat(low_threshold);
  if (isNaN(lowThresh) || lowThresh < 0) {
    errors.push('low_threshold must be a non-negative number');
  }

  const highThresh = parseFloat(high_threshold);
  if (isNaN(highThresh) || highThresh <= lowThresh) {
    errors.push('high_threshold must be strictly greater than low_threshold');
  }

  const windowDt = parseFloat(adaptation_window);
  if (isNaN(windowDt) || windowDt <= 0 || windowDt > tSim) {
    errors.push('adaptation_window must be greater than 0 and not exceed simulation_time');
  }

  const validWorkloads = ['sparse', 'dense', 'sparse_dense', 'dense_sparse', 'bursty', 'poisson'];
  if (!validWorkloads.includes(workload)) {
    errors.push(`workload must be one of: ${validWorkloads.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Invalid simulation configuration',
      details: errors,
    });
  }

  const sanitizedConfig = {
    neurons: n,
    simulation_time: tSim,
    dt: stepDt,
    low_threshold: lowThresh,
    high_threshold: highThresh,
    adaptation_window: windowDt,
    workload,
  };

  runSimulationProcess(sanitizedConfig, (err, payload) => {
    if (err) {
      return res.status(500).json({
        error: 'Simulation failed',
        message: err.message,
      });
    }
    return res.json(payload);
  });
});

/**
 * GET /api/experiments
 * Returns list of recorded experiment runs
 */
app.get('/api/experiments', (req, res) => {
  const history = loadExperiments();
  res.json(history);
});

/**
 * GET /api/experiments/:id
 * Returns single experiment by ID
 */
app.get('/api/experiments/:id', (req, res) => {
  const history = loadExperiments();
  const exp = history.find((e) => e.id === req.params.id);
  if (!exp) {
    return res.status(404).json({ error: 'Experiment not found', id: req.params.id });
  }
  res.json(exp);
});

// Serve frontend build in production / container environments
const FRONTEND_DIST = path.resolve(PROJECT_ROOT, 'frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.resolve(FRONTEND_DIST, 'index.html'));
  });
}

// Start Express + WebSocket server
server.listen(PORT, () => {
  console.log('==================================================');
  console.log(` AED-SNN API Bridge listening on http://localhost:${PORT}`);
  console.log(` WebSocket Telemetry Stream: ws://localhost:${PORT}/ws`);
  console.log(` Simulator Binary: ${EXE_PATH}`);
  console.log('==================================================');
});
