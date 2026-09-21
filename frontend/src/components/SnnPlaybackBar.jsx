import React from 'react';

/**
 * SnnPlaybackBar
 * 
 * Interactive control bar for scrubbing, stepping, and playing back
 * real C++ AED-SNN spike and synaptic propagation events.
 */
export default function SnnPlaybackBar({
  isPlaying,
  onTogglePlay,
  currentIndex,
  totalEvents,
  currentTime,
  speed,
  onSpeedChange,
  onStepForward,
  onStepBackward,
  onReset,
  onSeek,
  currentMode,
}) {
  const progress = totalEvents > 1 ? (currentIndex / (totalEvents - 1)) * 100 : 0;

  return (
    <div className="snn-playback-bar">
      <div className="playback-controls-group">
        <button
          type="button"
          className="pb-btn reset-btn"
          title="Reset to Start"
          onClick={onReset}
          disabled={currentIndex === 0 && !isPlaying}
        >
          ⏮
        </button>

        <button
          type="button"
          className="pb-btn step-btn"
          title="Step Backward"
          onClick={onStepBackward}
          disabled={currentIndex === 0 || isPlaying}
        >
          ⏪
        </button>

        <button
          type="button"
          className={`pb-btn play-btn ${isPlaying ? 'is-playing' : ''}`}
          title={isPlaying ? 'Pause Replay' : 'Play Propagation Trace'}
          onClick={onTogglePlay}
        >
          {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
        </button>

        <button
          type="button"
          className="pb-btn step-btn"
          title="Step Forward"
          onClick={onStepForward}
          disabled={currentIndex >= totalEvents || isPlaying}
        >
          ⏩
        </button>
      </div>

      {/* Scrubber & Progress */}
      <div className="playback-scrubber-group">
        <div className="scrubber-header">
          <span className="scrubber-clock mono">
            SIM TIME: <strong>{currentTime ? currentTime.toFixed(2) : '0.00'} ms</strong>
          </span>
          <span className="scrubber-meta mono">
            Trace Event {Math.min(currentIndex, totalEvents)} of {totalEvents}
          </span>
          <span className={`scrubber-mode-badge mono ${currentMode === 'TIME-DRIVEN' ? 'mode-td' : 'mode-ed'}`}>
            {currentMode}
          </span>
        </div>

        <div className="scrubber-track-container">
          <input
            type="range"
            min="0"
            max={Math.max(1, totalEvents - 1)}
            value={currentIndex}
            onChange={(e) => onSeek && onSeek(parseInt(e.target.value, 10) / Math.max(1, totalEvents - 1))}
            className="playback-slider"
          />
          <div className="slider-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Speed Controls */}
      <div className="playback-speed-group">
        <span className="speed-label mono">SPEED:</span>
        {[0.25, 0.5, 1.0, 2.0, 4.0].map((s) => (
          <button
            key={s}
            type="button"
            className={`speed-btn mono ${speed === s ? 'active' : ''}`}
            onClick={() => onSpeedChange && onSpeedChange(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
