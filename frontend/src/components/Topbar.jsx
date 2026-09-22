import React from 'react';

export default function Topbar({
  activePage,
  isConnected,
  simulationTime,
  finalMode,
  onRefresh,
  isRefreshing,
  bridgeStatus,
}) {
  const isBridgeReady = bridgeStatus?.status === 'ready';
  const isClientEngine = bridgeStatus?.status === 'client_engine';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <p className="eyebrow">NEUROCOMPUTING RESEARCH WORKSTATION</p>
        <div className="title-row">
          <h2 className="topbar-title">{activePage}</h2>
          <span className="research-badge">
            {isBridgeReady
              ? 'BRIDGE CONNECTED (:3000)'
              : isClientEngine
              ? 'STANDALONE CLOUD SNN'
              : 'LAB VERIFIED'}
          </span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-meta-item">
          <span className="meta-label">SIM TIME</span>
          <strong className="meta-value mono">
            {simulationTime !== undefined && simulationTime !== null
              ? `${Number(simulationTime).toFixed(2)} ms`
              : '—'}
          </strong>
        </div>

        <div className="topbar-meta-item">
          <span className="meta-label">ACTIVE STRATEGY</span>
          <span className={`meta-mode-pill ${finalMode === 'EVENT-DRIVEN' ? 'pill-event' : 'pill-time'}`}>
            {finalMode || '—'}
          </span>
        </div>

        <div className="topbar-status-badge">
          <span className={`status-dot ${isBridgeReady || isClientEngine || isConnected ? 'dot-active' : 'dot-error'}`} />
          <span>
            {isBridgeReady
              ? 'API BRIDGE ACTIVE (:3000)'
              : isClientEngine
              ? 'IN-BROWSER ENGINE ACTIVE'
              : isConnected
              ? 'BACKEND DATA CONNECTED'
              : 'DATA FEED OFFLINE'}
          </span>
        </div>

        <button
          type="button"
          className="topbar-sync-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Reload simulation data from backend"
        >
          {isRefreshing ? '⌛ Syncing' : '↻ Sync Data'}
        </button>
      </div>
    </header>
  );
}
