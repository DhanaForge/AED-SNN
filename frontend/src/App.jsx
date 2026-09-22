import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import LiveSimulation from './pages/LiveSimulation';
import Network from './pages/Network';
import Controller from './pages/Controller';
import Workload from './pages/Workload';
import Performance from './pages/Performance';
import Experiments from './pages/Experiments';
import {
  fetchSimulationResults,
  runSimulation,
  getBackendStatus,
  connectSimulationWebSocket,
} from './services/simulationApi';

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState(null);

  // Live WebSocket Telemetry State
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [liveActiveNeurons, setLiveActiveNeurons] = useState(new Set());
  const [liveActiveSynapses, setLiveActiveSynapses] = useState(new Set());
  const [liveSpikeCounts, setLiveSpikeCounts] = useState({});
  const [liveSimClock, setLiveSimClock] = useState(null);
  const [liveMode, setLiveMode] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const [results, status] = await Promise.allSettled([
        fetchSimulationResults(),
        getBackendStatus(),
      ]);

      if (results.status === 'fulfilled') {
        setData(results.value);
        setError(null);
      } else {
        throw results.reason;
      }

      if (status.status === 'fulfilled') {
        setBridgeStatus(status.value);
      }
    } catch (err) {
      console.error('AED-SNN Data Load Error:', err);
      setError(err.message || 'Unable to load simulation results from backend.');
    } finally {
      setLoading(false);
      if (showRefreshing) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([fetchSimulationResults(), getBackendStatus()]).then(
      ([resultsRes, statusRes]) => {
        if (!isMounted) return;
        if (resultsRes.status === 'fulfilled') {
          setData(resultsRes.value);
          setError(null);
        } else {
          setError(resultsRes.reason?.message || 'Unable to connect to simulation feed.');
        }

        if (statusRes.status === 'fulfilled') {
          setBridgeStatus(statusRes.value);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  // Live WebSocket Telemetry Connection
  useEffect(() => {
    const cleanupWs = connectSimulationWebSocket(
      (msg) => {
        if (!msg || !msg.type) return;

        if (msg.type === 'simulation_start') {
          setIsRunning(true);
          setLiveActiveNeurons(new Set());
          setLiveActiveSynapses(new Set());
          setLiveSpikeCounts({});
          setLiveSimClock(0);
          setLiveEvents([{ ...msg, time: 0 }]);
        } else if (msg.type === 'spike') {
          // Trigger neuron flash
          setLiveActiveNeurons((prev) => {
            const next = new Set(prev);
            next.add(msg.neuron_id);
            return next;
          });
          setLiveSpikeCounts((prev) => ({
            ...prev,
            [msg.neuron_id]: (prev[msg.neuron_id] || 0) + 1,
          }));
          setLiveEvents((prev) => [msg, ...prev.slice(0, 99)]);

          // Remove flash after 300ms
          setTimeout(() => {
            setLiveActiveNeurons((prev) => {
              const next = new Set(prev);
              next.delete(msg.neuron_id);
              return next;
            });
          }, 300);
        } else if (msg.type === 'synaptic_event') {
          // Trigger synapse pulse
          const synKey = `${msg.source}->${msg.target}`;
          setLiveActiveSynapses((prev) => {
            const next = new Set(prev);
            next.add(synKey);
            return next;
          });
          setLiveEvents((prev) => [msg, ...prev.slice(0, 99)]);

          // Remove pulse after 350ms
          setTimeout(() => {
            setLiveActiveSynapses((prev) => {
              const next = new Set(prev);
              next.delete(synKey);
              return next;
            });
          }, 350);
        } else if (msg.type === 'simulation_clock') {
          setLiveSimClock(msg.time);
        } else if (msg.type === 'mode_change') {
          setLiveMode(msg.mode);
          setLiveEvents((prev) => [msg, ...prev.slice(0, 99)]);
        } else if (msg.type === 'simulation_complete') {
          setIsRunning(false);
          if (msg.results) {
            setData(msg.results);
            setError(null);
          }
          setLiveEvents((prev) => [msg, ...prev.slice(0, 99)]);
        }
      },
      (status) => {
        setWsStatus(status);
      }
    );

    return () => {
      cleanupWs();
    };
  }, []);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleRunSimulation = async (config) => {
    const payload = await runSimulation(config);
    if (payload?.results) {
      setData(payload.results);
      setError(null);
    }
    return payload;
  };

  const handleLoadHistoricalExperiment = (historicalResults) => {
    if (historicalResults) {
      setData(historicalResults);
    }
  };

  const isConnected = bridgeStatus?.status === 'ready' || (!error && !!data);

  const renderActivePage = () => {
    if (loading && !data) {
      return (
        <div className="state-screen loading-screen">
          <div className="state-card">
            <div className="spinner-orbit">
              <div className="orbit-core" />
            </div>
            <h3 className="mono">INITIALIZING SIMULATION WORKSTATION</h3>
            <p>
              Loading neural network configuration and initializing simulation engines...
            </p>
          </div>
        </div>
      );
    }

    if (error && !data) {
      return (
        <div className="state-screen error-screen">
          <div className="state-card card-error">
            <div className="error-icon-box">⚠️</div>
            <h3 className="mono">SIMULATION BACKEND OFFLINE</h3>
            <p className="error-detail mono">{error}</p>
            <div className="error-guidance">
              <p>
                Ensure the API bridge is running (<code>node backend/server.js</code>) and the C++ binary <code>build/aed_snn.exe</code> is compiled.
              </p>
            </div>
            <button type="button" className="retry-btn" onClick={handleRefresh}>
              ↻ Retry Connection
            </button>
          </div>
        </div>
      );
    }

    switch (activePage) {
      case 'Dashboard':
        return (
          <Dashboard
            data={data}
            setActivePage={setActivePage}
            onRunSimulation={handleRunSimulation}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            bridgeStatus={bridgeStatus}
            liveActiveNeurons={liveActiveNeurons}
            liveActiveSynapses={liveActiveSynapses}
            liveSpikeCounts={liveSpikeCounts}
            liveMode={liveMode}
            liveClock={liveSimClock}
          />
        );
      case 'Live Simulation':
        return (
          <LiveSimulation
            data={data}
            onRunSimulation={handleRunSimulation}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            liveActiveNeurons={liveActiveNeurons}
            liveActiveSynapses={liveActiveSynapses}
            liveSpikeCounts={liveSpikeCounts}
            liveMode={liveMode}
            liveClock={liveSimClock}
            liveEvents={liveEvents}
            wsStatus={wsStatus}
          />
        );
      case 'Network':
        return (
          <Network
            data={data}
            liveActiveNeurons={liveActiveNeurons}
            liveActiveSynapses={liveActiveSynapses}
            liveSpikeCounts={liveSpikeCounts}
            liveMode={liveMode}
            liveClock={liveSimClock}
          />
        );
      case 'Controller':
        return <Controller data={data} />;
      case 'Workload':
        return <Workload data={data} />;
      case 'Performance':
        return <Performance data={data} />;
      case 'Experiments':
        return (
          <Experiments
            data={data}
            setActivePage={setActivePage}
            onLoadHistoricalExperiment={handleLoadHistoricalExperiment}
          />
        );
      default:
        return (
          <Dashboard
            data={data}
            setActivePage={setActivePage}
            onRunSimulation={handleRunSimulation}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            liveActiveNeurons={liveActiveNeurons}
            liveActiveSynapses={liveActiveSynapses}
            liveSpikeCounts={liveSpikeCounts}
            liveMode={liveMode}
            liveClock={liveSimClock}
          />
        );
    }
  };

  return (
    <div className="aed-snn-app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isConnected={isConnected}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        bridgeStatus={bridgeStatus}
      />

      <div className="main-content-viewport">
        <Topbar
          activePage={activePage}
          isConnected={isConnected}
          simulationTime={data?.simulation_time}
          finalMode={data?.final_mode}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          bridgeStatus={bridgeStatus}
        />

        <main className="page-content-scrollable">
          {error && data && (
            <div className="warning-banner">
              <span className="warn-icon">⚠️</span>
              <span>
                Backend notice: {error} (Displaying latest cached simulation telemetry).
              </span>
            </div>
          )}
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default App;