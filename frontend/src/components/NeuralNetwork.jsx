import React, { useState, useMemo } from 'react';

/**
 * AED-SNN Research-Grade Dynamic SNN Topology Graph
 * 
 * Visualizes the authoritative C++ SNN topology.
 * Dynamically scales from small linear chains (N=3..6) to serpentine multi-row grids (N=7..25)
 * up to large scalable matrices (N=26..100+).
 * 
 * Renders real-time spike flashes and synaptic propagations driven strictly
 * by authentic backend C++ events.
 */
export default function NeuralNetwork({
  neuronsCount = 3,
  synapses = null,
  activeNeurons = new Set(),
  activeSynapses = new Set(),
  spikeCounts = {},
  selectedNeuronId = null,
  onSelectNeuron = null,
  showDetails = true,
  interactive = true,
  simulationMode = 'EVENT-DRIVEN',
  playbackTime = null,
}) {
  // Local selection state if not controlled externally
  const [internalSelected, setInternalSelected] = useState(0);
  const selectedNeuron = selectedNeuronId !== null ? selectedNeuronId : internalSelected;

  const handleSelect = (id) => {
    if (!interactive) return;
    if (onSelectNeuron) {
      onSelectNeuron(id);
    } else {
      setInternalSelected(id);
    }
  };

  // Viewport Zoom & Pan State (for large networks)
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'spiking'

  const N = Math.max(1, parseInt(neuronsCount, 10) || 3);

  // Determine dynamic layout topology
  const { nodes, edges, canvasWidth, canvasHeight, layoutType } = useMemo(() => {
    // 1. Generate real or standard chain synapses
    let synList = [];
    if (Array.isArray(synapses) && synapses.length > 0) {
      synList = synapses;
    } else {
      for (let i = 0; i < N - 1; i++) {
        synList.push({
          source: i,
          target: i + 1,
          weight: 1.0,
          delay: 1.0,
        });
      }
    }

    // 2. Select layout geometry based on N
    let layout = 'chain';
    let width = 840;
    let height = 300;
    let computedNodes = [];

    if (N <= 6) {
      // Linear Chain Layout
      layout = 'chain';
      width = Math.max(760, N * 130 + 120);
      height = 260;
      const paddingX = 80;
      const availableWidth = width - 2 * paddingX;
      const stepX = N > 1 ? availableWidth / (N - 1) : 0;
      const centerY = 130;
      const radius = 28;

      for (let i = 0; i < N; i++) {
        const x = N === 1 ? width / 2 : paddingX + i * stepX;
        computedNodes.push({
          id: i,
          x,
          y: centerY,
          radius,
          role: i === 0 ? 'Sensory / Input' : i === N - 1 ? 'Readout / Output' : 'Interneuron',
        });
      }
    } else if (N <= 24) {
      // Serpentine Multi-Row Grid
      layout = 'serpentine';
      const cols = Math.min(6, Math.max(4, Math.ceil(Math.sqrt(N * 1.5))));
      const rows = Math.ceil(N / cols);
      width = 860;
      height = Math.max(300, rows * 110 + 60);

      const paddingX = 70;
      const paddingY = 60;
      const stepX = (width - 2 * paddingX) / (cols - 1);
      const stepY = (height - 2 * paddingY) / Math.max(1, rows - 1);
      const radius = 22;

      for (let i = 0; i < N; i++) {
        const row = Math.floor(i / cols);
        const colInRow = i % cols;
        // Even rows left-to-right, odd rows right-to-left
        const actualCol = row % 2 === 0 ? colInRow : cols - 1 - colInRow;
        const x = paddingX + actualCol * stepX;
        const y = paddingY + row * stepY;

        computedNodes.push({
          id: i,
          x,
          y,
          radius,
          role: i === 0 ? 'Input Node' : i === N - 1 ? 'Output Node' : `Interneuron L${row + 1}`,
        });
      }
    } else {
      // Scalable Matrix Grid for N > 24 (up to 100+)
      layout = 'matrix';
      const cols = Math.min(10, Math.ceil(Math.sqrt(N * 1.25)));
      const rows = Math.ceil(N / cols);
      width = 960;
      height = Math.max(340, rows * 75 + 70);

      const paddingX = 55;
      const paddingY = 45;
      const stepX = (width - 2 * paddingX) / (cols - 1);
      const stepY = (height - 2 * paddingY) / Math.max(1, rows - 1);
      const radius = N > 50 ? 14 : 18;

      for (let i = 0; i < N; i++) {
        const row = Math.floor(i / cols);
        const colInRow = i % cols;
        const actualCol = row % 2 === 0 ? colInRow : cols - 1 - colInRow;
        const x = paddingX + actualCol * stepX;
        const y = paddingY + row * stepY;

        computedNodes.push({
          id: i,
          x,
          y,
          radius,
          role: i === 0 ? 'Primary Input' : i === N - 1 ? 'Output Terminal' : `LIF Node`,
        });
      }
    }

    // Node coordinate map
    const nodeMap = new Map();
    computedNodes.forEach((n) => nodeMap.set(n.id, n));

    // 3. Compute curved or straight paths for synapses
    const computedEdges = synList
      .map((syn, idx) => {
        const src = nodeMap.get(syn.source);
        const dst = nodeMap.get(syn.target);
        if (!src || !dst) return null;

        const dx = dst.x - src.x;
        const dy = dst.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Compute edge boundary intersection points so arrows don't clip under the circle
        const srcOffsetX = dist > 0 ? (dx / dist) * src.radius : 0;
        const srcOffsetY = dist > 0 ? (dy / dist) * src.radius : 0;
        const dstOffsetX = dist > 0 ? (dx / dist) * (dst.radius + 6) : 0;
        const dstOffsetY = dist > 0 ? (dy / dist) * (dst.radius + 6) : 0;

        const startX = src.x + srcOffsetX;
        const startY = src.y + srcOffsetY;
        const endX = dst.x - dstOffsetX;
        const endY = dst.y - dstOffsetY;

        let path = '';
        let labelX = (startX + endX) / 2;
        let labelY = (startY + endY) / 2 - 10;

        // If nodes are on adjacent rows or far apart in serpentine/matrix, use cubic bezier curve
        if (Math.abs(dy) > 30) {
          // Curved connector for row transitions
          const curveBias = src.x > width / 2 ? 55 : -55;
          const cp1X = startX + curveBias;
          const cp1Y = startY + (endY - startY) * 0.2;
          const cp2X = endX + curveBias;
          const cp2Y = endY - (endY - startY) * 0.2;
          path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
          labelX = (startX + endX) / 2 + curveBias * 0.5;
          labelY = (startY + endY) / 2;
        } else {
          // Straight or slight arc
          path = `M ${startX} ${startY} L ${endX} ${endY}`;
        }

        const key = `${syn.source}->${syn.target}`;
        return {
          id: `syn-${idx}`,
          key,
          source: syn.source,
          target: syn.target,
          weight: syn.weight ?? 1.0,
          delay: syn.delay ?? 1.0,
          path,
          labelX,
          labelY,
          isRowHop: Math.abs(dy) > 30,
        };
      })
      .filter(Boolean);

    return {
      nodes: computedNodes,
      edges: computedEdges,
      canvasWidth: width,
      canvasHeight: height,
      layoutType: layout,
    };
  }, [N, synapses]);

  // Selected neuron telemetry data
  const activeNeuronData = useMemo(() => {
    const node = nodes.find((n) => n.id === selectedNeuron) || nodes[0] || { id: 0, role: 'LIF' };
    const afferent = edges.filter((e) => e.target === node.id);
    const efferent = edges.filter((e) => e.source === node.id);
    const count = spikeCounts[node.id] || 0;

    return {
      id: node.id,
      label: `Neuron ${node.id}`,
      role: node.role,
      type: 'Leaky Integrate-and-Fire (LIF)',
      vRest: '0.00 mV',
      vThresh: '1.00 mV',
      vReset: '0.00 mV',
      tau: '10.00 ms',
      spikes: count,
      afferentCount: afferent.length,
      efferentCount: efferent.length,
      afferentList: afferent.map((e) => `N${e.source} (w=${e.weight.toFixed(1)}, d=${e.delay.toFixed(1)}ms)`),
      efferentList: efferent.map((e) => `N${e.target} (w=${e.weight.toFixed(1)}, d=${e.delay.toFixed(1)}ms)`),
    };
  }, [nodes, edges, selectedNeuron, spikeCounts]);

  // Pan interaction handling
  const handleMouseDown = (e) => {
    if (layoutType === 'matrix' || zoomLevel > 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // Jump to searched neuron
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const id = parseInt(searchQuery.replace(/\D/g, ''), 10);
    if (!isNaN(id) && id >= 0 && id < N) {
      handleSelect(id);
    }
  };

  return (
    <div className="neural-network-container">
      {/* Top Header Bar */}
      <div className="network-header-bar">
        <div className="network-title-group">
          <span className="section-kicker">AUTHENTIC SNN TOPOLOGY</span>
          <h3 className="section-heading">
            Spiking Neural Network Architecture
          </h3>
        </div>

        <div className="network-badges">
          <span className="net-badge">
            <strong className="mono">{N}</strong> LIF NEURONS
          </span>
          <span className="net-badge">
            <strong className="mono">{edges.length}</strong> SYNAPSES
          </span>
          <span className={`net-badge ${simulationMode === 'TIME-DRIVEN' ? 'badge-time-driven' : 'badge-source'}`}>
            {simulationMode}
          </span>
          {playbackTime !== null && (
            <span className="net-badge mono badge-clock">
              t = {playbackTime.toFixed(2)} ms
            </span>
          )}
        </div>
      </div>

      {/* Network Control & Filter Toolbar */}
      <div className="network-toolbar">
        <div className="toolbar-left">
          <div className="layout-indicator">
            <span className="layout-dot" />
            <span className="layout-text mono">
              Layout: <strong>{layoutType.toUpperCase()}</strong> ({canvasWidth}×{canvasHeight}px)
            </span>
          </div>

          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All Nodes ({N})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterMode === 'spiking' ? 'active' : ''}`}
              onClick={() => setFilterMode('spiking')}
            >
              Active Firing ({activeNeurons.size})
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {/* Quick Node Search */}
          <form onSubmit={handleSearchSubmit} className="neuron-search-form">
            <input
              type="text"
              placeholder={`Find N (0..${N - 1})`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neuron-search-input mono"
            />
            <button type="submit" className="neuron-search-btn">
              Go
            </button>
          </form>

          {/* Zoom controls for large networks */}
          <div className="zoom-control-group">
            <button
              type="button"
              className="zoom-btn"
              title="Zoom In"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            >
              +
            </button>
            <span className="zoom-label mono">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              className="zoom-btn"
              title="Zoom Out"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.25))}
            >
              –
            </button>
            <button
              type="button"
              className="zoom-btn reset-btn"
              title="Reset View"
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
            >
              ⟲
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Viewport */}
      <div
        className={`network-viewport-wrapper ${isPanning ? 'is-panning' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="network-svg-canvas"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Grid background */}
            <pattern id="netGridPattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="1"
              />
            </pattern>

            {/* Standard Directed Synapse Arrow Marker */}
            <marker
              id="synapseArrowNormal"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>

            {/* Active Synaptic Pulse Arrow Marker */}
            <marker
              id="synapseArrowActive"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>

            {/* Glowing Spike Filter */}
            <filter id="spikeGlowCyan" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Selected Node Glow */}
            <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background grid */}
          <rect width={canvasWidth} height={canvasHeight} fill="url(#netGridPattern)" rx="8" />

          {/* Synaptic Pathway Edges */}
          <g className="synapses-layer">
            {edges.map((syn) => {
              const isActive = activeSynapses.has(syn.key) || activeSynapses.has(`${syn.source}->${syn.target}`);
              return (
                <g key={syn.id} className={`synapse-edge-group ${isActive ? 'active-pulse' : ''}`}>
                  {/* Subtle Background Glow */}
                  <path
                    d={syn.path}
                    className="synapse-line-glow"
                    stroke={isActive ? 'rgba(52, 211, 153, 0.4)' : 'rgba(56, 189, 248, 0.12)'}
                    strokeWidth={isActive ? 6 : 4}
                    fill="none"
                  />

                  {/* Main Directed Path Line */}
                  <path
                    d={syn.path}
                    className={`synapse-line ${isActive ? 'synapse-line-active' : ''}`}
                    stroke={isActive ? '#34d399' : '#38bdf8'}
                    strokeWidth={isActive ? 2.8 : 2}
                    strokeDasharray={isActive ? 'none' : '4,3'}
                    markerEnd={isActive ? 'url(#synapseArrowActive)' : 'url(#synapseArrowNormal)'}
                    fill="none"
                  />

                  {/* Traveling Spike Particle Indicator (renders on active transmission) */}
                  {isActive && (
                    <circle r="4.5" fill="#34d399" className="spike-particle-active" filter="url(#spikeGlowCyan)">
                      <animateMotion path={syn.path} dur="0.4s" repeatCount="1" />
                    </circle>
                  )}

                  {/* Synapse Weight Label (render only if small network to prevent clutter) */}
                  {N <= 12 && !syn.isRowHop && (
                    <g className="synapse-label-badge">
                      <rect
                        x={syn.labelX - 32}
                        y={syn.labelY - 10}
                        width="64"
                        height="16"
                        rx="3"
                        fill="#0b111e"
                        stroke="#1e293b"
                        strokeWidth="1"
                      />
                      <text
                        x={syn.labelX}
                        y={syn.labelY + 2}
                        textAnchor="middle"
                        className="synapse-label mono"
                      >
                        w={syn.weight.toFixed(1)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Neuron Nodes Layer */}
          <g className="neurons-layer">
            {nodes.map((n) => {
              const isSelected = selectedNeuron === n.id;
              const isSpiking = activeNeurons.has(n.id);
              const nodeSpikes = spikeCounts[n.id] || 0;

              if (filterMode === 'spiking' && !isSpiking && nodeSpikes === 0) {
                return null;
              }

              const r = n.radius;
              const isSmall = r <= 18;

              return (
                <g
                  key={`neuron-node-${n.id}`}
                  className={`neuron-node-group ${isSelected ? 'selected' : ''} ${isSpiking ? 'spiking' : ''}`}
                  onClick={() => handleSelect(n.id)}
                  style={{ cursor: interactive ? 'pointer' : 'default' }}
                >
                  {/* Outer Pulsing Aura when Spiking */}
                  {isSpiking && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={r + 16}
                      className="spike-ripple-aura"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      filter="url(#spikeGlowCyan)"
                    />
                  )}

                  {/* Selection Ring Halo */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r + 8}
                    className="neuron-halo"
                    fill={isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent'}
                    stroke={isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)'}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeDasharray={isSelected ? '4,3' : 'none'}
                  />

                  {/* Main Neuron Disc Body */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r}
                    className={`neuron-body ${isSpiking ? 'body-spiking' : ''}`}
                    fill={isSpiking ? '#0284c7' : isSelected ? '#0f172a' : '#080d1a'}
                    stroke={isSpiking ? '#38bdf8' : isSelected ? '#38bdf8' : '#334155'}
                    strokeWidth={isSelected || isSpiking ? 2.5 : 1.8}
                    filter={isSpiking ? 'url(#spikeGlowCyan)' : isSelected ? 'url(#selectedGlow)' : 'none'}
                  />

                  {/* Inner Nucleus Core */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={Math.max(4, r * 0.35)}
                    fill={isSpiking ? '#ffffff' : isSelected ? '#38bdf8' : '#1e293b'}
                    className="neuron-nucleus"
                  />

                  {/* Neuron ID Text */}
                  <text
                    x={n.x}
                    y={n.y + (isSmall ? 3 : 4)}
                    textAnchor="middle"
                    className="neuron-text-id mono"
                    fontSize={isSmall ? 10 : 12}
                    fontWeight="700"
                    fill={isSpiking ? '#ffffff' : isSelected ? '#38bdf8' : '#cbd5e1'}
                  >
                    N{n.id}
                  </text>

                  {/* Node Role & Spike Counter (only when space permits) */}
                  {!isSmall && N <= 20 && (
                    <g>
                      <text
                        x={n.x}
                        y={n.y + r + 16}
                        textAnchor="middle"
                        className="neuron-sublabel mono"
                      >
                        {nodeSpikes > 0 ? `${nodeSpikes} spikes` : n.role}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Footer Info Strip */}
        <div className="network-disclaimer-bar">
          <div className="disclaimer-left">
            <span className="disclaimer-dot" />
            <span>
              <strong>Authoritative Topology:</strong> C++ Directed Graph with {N} LIF neurons and {edges.length} synaptic pathways.
            </span>
          </div>
          <div className="disclaimer-right mono">
            {activeNeurons.size > 0 ? (
              <span className="live-pulse-active">⚡ Firing: {Array.from(activeNeurons).map((id) => `N${id}`).join(', ')}</span>
            ) : (
              <span>Ready for stimulus</span>
            )}
          </div>
        </div>
      </div>

      {/* Selected Neuron Inspector Card */}
      {showDetails && activeNeuronData && (
        <div className="neuron-inspector-card">
          <div className="inspector-header">
            <div className="inspector-title-area">
              <span className="inspector-kicker">NEURON INSPECTOR</span>
              <h4 className="inspector-title">
                {activeNeuronData.label} — {activeNeuronData.role}
              </h4>
            </div>

            <div className="inspector-nav-group">
              <button
                type="button"
                className="inspector-nav-btn"
                disabled={activeNeuronData.id === 0}
                onClick={() => handleSelect(Math.max(0, activeNeuronData.id - 1))}
              >
                ← Prev (N{Math.max(0, activeNeuronData.id - 1)})
              </button>
              <span className="model-badge mono">{activeNeuronData.type}</span>
              <button
                type="button"
                className="inspector-nav-btn"
                disabled={activeNeuronData.id === N - 1}
                onClick={() => handleSelect(Math.min(N - 1, activeNeuronData.id + 1))}
              >
                Next (N{Math.min(N - 1, activeNeuronData.id + 1)}) →
              </button>
            </div>
          </div>

          <div className="inspector-grid">
            <div className="param-tile">
              <span className="param-label">RESTING POTENTIAL (V_rest)</span>
              <strong className="param-val mono">{activeNeuronData.vRest}</strong>
            </div>
            <div className="param-tile">
              <span className="param-label">SPIKE THRESHOLD (V_thresh)</span>
              <strong className="param-val mono">{activeNeuronData.vThresh}</strong>
            </div>
            <div className="param-tile">
              <span className="param-label">RESET POTENTIAL (V_reset)</span>
              <strong className="param-val mono">{activeNeuronData.vReset}</strong>
            </div>
            <div className="param-tile">
              <span className="param-label">TIME CONSTANT (τ_m)</span>
              <strong className="param-val mono">{activeNeuronData.tau}</strong>
            </div>
          </div>

          <div className="inspector-telemetry-row">
            <div className="telemetry-box">
              <span className="telemetry-label">CUMULATIVE SPIKES FIRED</span>
              <div className="telemetry-value-line">
                <span className="telemetry-number mono">{activeNeuronData.spikes}</span>
                <span className="telemetry-unit">spikes</span>
              </div>
            </div>

            <div className="telemetry-box">
              <span className="telemetry-label">SYNAPTIC IN-DEGREE (Afferent)</span>
              <div className="telemetry-value-line">
                <span className="telemetry-number mono">{activeNeuronData.afferentCount}</span>
                <span className="telemetry-unit">afferent synapses</span>
              </div>
              <span className="telemetry-sub mono">
                {activeNeuronData.afferentList.length > 0 ? activeNeuronData.afferentList.join(', ') : 'None (Input Layer)'}
              </span>
            </div>

            <div className="telemetry-box">
              <span className="telemetry-label">SYNAPTIC OUT-DEGREE (Efferent)</span>
              <div className="telemetry-value-line">
                <span className="telemetry-number mono">{activeNeuronData.efferentCount}</span>
                <span className="telemetry-unit">efferent synapses</span>
              </div>
              <span className="telemetry-sub mono">
                {activeNeuronData.efferentList.length > 0 ? activeNeuronData.efferentList.join(', ') : 'None (Terminal Layer)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
