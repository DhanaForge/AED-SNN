import React from 'react';

export default function Sidebar({ activePage, setActivePage, isConnected, onRefresh, isRefreshing, bridgeStatus }) {
  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'Live Simulation', label: 'Live Simulation', icon: '⚡' },
    { id: 'Network', label: 'Network Topology', icon: '🧠' },
    { id: 'Controller', label: 'Adaptive Controller', icon: '🎛️' },
    { id: 'Workload', label: 'Workload Analysis', icon: '📈' },
    { id: 'Performance', label: 'Performance', icon: '⏱️' },
    { id: 'Experiments', label: 'Experiments', icon: '🔬' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span>AED</span>
        </div>
        <div>
          <h1>AED-SNN</h1>
          <span className="brand-sub">Adaptive SNN Simulator</span>
        </div>
      </div>

      <div className="nav-section">
        <p className="nav-heading">SIMULATOR NAVIGATION</p>
        <nav className="nav-menu">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
                type="button"
                id={`nav-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActive && <span className="active-indicator" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="system-status-box">
          <div className="system-status-header">
            <span className={`status-beacon ${isConnected ? 'beacon-online' : 'beacon-offline'}`} />
            <div className="system-status-text">
              <strong>{bridgeStatus?.status === 'ready' ? 'API Bridge Online' : 'C++ Data Feed'}</strong>
              <small>{bridgeStatus?.status === 'ready' ? 'Port 3000 Connected' : isConnected ? 'Local Feed Synced' : 'Backend Disconnected'}</small>
            </div>
          </div>
          <button
            type="button"
            className="reload-feed-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Reload authoritative results.json"
          >
            {isRefreshing ? 'Syncing...' : '↻ Reload Results'}
          </button>
        </div>

        <div className="version-tag">
          <span>AED-SNN v0.2-RESEARCH</span>
          <span className="build-tag">C++ Hybrid Engine</span>
        </div>
      </div>
    </aside>
  );
}
