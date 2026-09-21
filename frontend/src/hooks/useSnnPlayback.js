import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSnnPlayback
 * 
 * Manages playback, stepping, time scrubbing, and live animation
 * of real C++ AED-SNN spike and synaptic propagation events.
 */
export function useSnnPlayback({
  initialEvents = [],
  autoReset = false,
} = {}) {
  const [events, setEvents] = useState(initialEvents);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1.0); // 0.25x, 0.5x, 1x, 2x, 4x
  const [activeNeurons, setActiveNeurons] = useState(new Set());
  const [activeSynapses, setActiveSynapses] = useState(new Set());
  const [spikeCounts, setSpikeCounts] = useState({});
  const [currentMode, setCurrentMode] = useState('EVENT-DRIVEN');
  const [currentTime, setCurrentTime] = useState(0);

  const neuronTimersRef = useRef(new Map());
  const synapseTimersRef = useRef(new Map());
  const playbackTimerRef = useRef(null);

  // Sync events if changed from external source
  useEffect(() => {
    if (initialEvents && initialEvents.length > 0) {
      setEvents(initialEvents);
      if (autoReset) {
        setCurrentIndex(0);
        setSpikeCounts({});
        setActiveNeurons(new Set());
        setActiveSynapses(new Set());
      }
    }
  }, [initialEvents, autoReset]);

  // Flash a neuron on spike
  const triggerNeuronSpike = useCallback((neuronId, durationMs = 280) => {
    setActiveNeurons((prev) => {
      const next = new Set(prev);
      next.add(neuronId);
      return next;
    });

    setSpikeCounts((prev) => ({
      ...prev,
      [neuronId]: (prev[neuronId] || 0) + 1,
    }));

    // Clear existing timer if any
    if (neuronTimersRef.current.has(neuronId)) {
      clearTimeout(neuronTimersRef.current.get(neuronId));
    }

    const timer = setTimeout(() => {
      setActiveNeurons((prev) => {
        const next = new Set(prev);
        next.delete(neuronId);
        return next;
      });
      neuronTimersRef.current.delete(neuronId);
    }, durationMs);

    neuronTimersRef.current.set(neuronId, timer);
  }, []);

  // Flash a synapse on transmission
  const triggerSynapsePulse = useCallback((source, target, durationMs = 320) => {
    const key = `${source}->${target}`;
    setActiveSynapses((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    if (synapseTimersRef.current.has(key)) {
      clearTimeout(synapseTimersRef.current.get(key));
    }

    const timer = setTimeout(() => {
      setActiveSynapses((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      synapseTimersRef.current.delete(key);
    }, durationMs);

    synapseTimersRef.current.set(key, timer);
  }, []);

  // Process a single simulation event
  const processEvent = useCallback(
    (evt, scaleSpeed = 1.0) => {
      if (!evt) return;

      if (evt.time !== undefined) {
        setCurrentTime(evt.time);
      }

      const pulseDuration = Math.max(120, Math.round(280 / scaleSpeed));

      if (evt.type === 'spike' && evt.neuron_id !== undefined) {
        triggerNeuronSpike(evt.neuron_id, pulseDuration);
      } else if (evt.type === 'synaptic_event' && evt.source !== undefined && evt.target !== undefined) {
        triggerSynapsePulse(evt.source, evt.target, pulseDuration + 40);
      } else if (evt.type === 'mode_change' && evt.mode) {
        setCurrentMode(evt.mode);
      } else if (evt.type === 'window_start' && evt.mode) {
        setCurrentMode(evt.mode);
      }
    },
    [triggerNeuronSpike, triggerSynapsePulse]
  );

  // Handle incoming live telemetry event from WebSocket
  const handleLiveEvent = useCallback(
    (evt) => {
      processEvent(evt, 1.0);
    },
    [processEvent]
  );

  // Step forward one event
  const stepForward = useCallback(() => {
    if (currentIndex >= events.length) return;
    const evt = events[currentIndex];
    processEvent(evt, speed);
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, events, processEvent, speed]);

  // Step backward
  const stepBackward = useCallback(() => {
    if (currentIndex <= 0) return;
    const targetIndex = currentIndex - 1;
    // Recalculate state up to targetIndex
    const newSpikeCounts = {};
    let newTime = 0;
    let newMode = 'EVENT-DRIVEN';

    for (let i = 0; i < targetIndex; i++) {
      const e = events[i];
      if (e.type === 'spike' && e.neuron_id !== undefined) {
        newSpikeCounts[e.neuron_id] = (newSpikeCounts[e.neuron_id] || 0) + 1;
      }
      if (e.time !== undefined) newTime = e.time;
      if (e.mode) newMode = e.mode;
    }

    setSpikeCounts(newSpikeCounts);
    setCurrentTime(newTime);
    setCurrentMode(newMode);
    setCurrentIndex(targetIndex);
    setActiveNeurons(new Set());
    setActiveSynapses(new Set());
  }, [currentIndex, events]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
      return;
    }

    if (currentIndex >= events.length) {
      setIsPlaying(false);
      return;
    }

    // Calculate delay to next event
    const currentEvt = events[currentIndex];
    const nextEvt = currentIndex + 1 < events.length ? events[currentIndex + 1] : null;

    let delayMs = 150;
    if (currentEvt && nextEvt && typeof nextEvt.time === 'number' && typeof currentEvt.time === 'number') {
      const simDelta = Math.max(0, nextEvt.time - currentEvt.time);
      delayMs = Math.max(40, Math.min(600, (simDelta * 80) / speed));
    } else {
      delayMs = Math.round(150 / speed);
    }

    playbackTimerRef.current = setTimeout(() => {
      processEvent(currentEvt, speed);
      setCurrentIndex((idx) => idx + 1);
    }, delayMs);

    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    };
  }, [isPlaying, currentIndex, events, speed, processEvent]);

  // Reset playback
  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setSpikeCounts({});
    setActiveNeurons(new Set());
    setActiveSynapses(new Set());
    setCurrentTime(events[0]?.time ?? 0);
  }, [events]);

  // Seek to progress (0.0 to 1.0)
  const seekToProgress = useCallback(
    (progress) => {
      const targetIdx = Math.max(0, Math.min(events.length - 1, Math.round(progress * (events.length - 1))));
      setIsPlaying(false);

      const newSpikeCounts = {};
      let newTime = 0;
      let newMode = 'EVENT-DRIVEN';

      for (let i = 0; i <= targetIdx; i++) {
        const e = events[i];
        if (e.type === 'spike' && e.neuron_id !== undefined) {
          newSpikeCounts[e.neuron_id] = (newSpikeCounts[e.neuron_id] || 0) + 1;
        }
        if (e.time !== undefined) newTime = e.time;
        if (e.mode) newMode = e.mode;
      }

      setSpikeCounts(newSpikeCounts);
      setCurrentTime(newTime);
      setCurrentMode(newMode);
      setCurrentIndex(targetIdx);
      setActiveNeurons(new Set());
      setActiveSynapses(new Set());
    },
    [events]
  );

  return {
    events,
    setEvents,
    isPlaying,
    setIsPlaying,
    currentIndex,
    speed,
    setSpeed,
    activeNeurons,
    activeSynapses,
    spikeCounts,
    currentMode,
    currentTime,
    stepForward,
    stepBackward,
    reset,
    seekToProgress,
    handleLiveEvent,
    triggerNeuronSpike,
    triggerSynapsePulse,
  };
}
