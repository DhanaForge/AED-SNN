# AED-SNN: Complete User Manual & Platform Guide

**Adaptive Event-Driven Spiking Neural Network Simulator**  
*Research Platform User Documentation & Interface Reference*

---

## 1. Welcome to AED-SNN

### What is this website?
**AED-SNN** is a research workstation designed to simulate, visualize, and analyze **Adaptive Spiking Neural Networks (SNNs)**. 

Traditional neural network simulators use fixed discrete time steps (e.g., simulating every $1\,\text{ms}$ regardless of whether any neuron fires). This wastes enormous computing power during quiet periods. Pure event-driven simulators only compute when a spike occurs, but they degrade when heavy spike bursts arrive.

**AED-SNN solves this with an intelligent dual-engine architecture:**
* **Event-Driven Engine**: Active during low/sparse firing activity ($O(\log E)$ min-heap priority queue).
* **Time-Driven Engine**: Active during dense, high-frequency spike bursts ($\Delta t = 1.0\,\text{ms}$ Euler integration).
* **Adaptive Controller**: Monitors workload spike rates in real-time windows and seamlessly switches execution engines on the fly.

This website connects to the authoritative **C++ simulation backend** through a real-time **WebSocket & REST API bridge**, allowing you to configure arbitrary neuron counts, launch simulations, and watch biological action potentials propagate across the network in real time.

---

## 2. End-to-End System Architecture

Understanding how data travels through the platform:

```text
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  USER CONFIGURATION    │ ───► │  NODE.JS API BRIDGE    │ ───► │  C++ SIMULATION ENGINE │
│  (React UI Parameters) │      │  (Express + WebSocket) │      │  (build/aed_snn.exe)   │
└────────────────────────┘      └────────────────────────┘      └───────────┬────────────┘
            ▲                                                               │
            │                                                               │
            │      Real-Time WebSocket Spikes (ws://localhost:3000/ws)      │
            └───────────────────────────────────────────────────────────────┘
```

1. **User enters parameters** (e.g., $N=10$ neurons, Bursty workload) in the web interface.
2. **React sends HTTP POST** to the Node.js API bridge on port `3000`.
3. **Bridge writes `simulation_config.json`** and spawns the compiled C++ executable `aed_snn.exe`.
4. **C++ simulator streams unbuffered stdout** as spikes occur.
5. **Bridge broadcasts real-time events** (`spike`, `synaptic_event`, `mode_change`, `simulation_clock`) over WebSocket.
6. **Frontend lights up topology nodes and edges** in real time and writes results to historical storage.

---

## 3. Page-by-Page Feature Guide

The navigation sidebar on the left gives access to 7 dedicated research modules:

```text
AED-SNN WORKSTATION
├── 1. Dashboard            (High-level overview & executive metrics)
├── 2. Live Simulation      (Interactive execution cockpit & runner)
├── 3. SNN Architecture     (Dynamic topology graph & LIF inspector)
├── 4. Adaptive Controller  (Dual-engine switching & state machine)
├── 5. Workload Analysis    (Spike rate window curves & heatmaps)
├── 6. Performance Metrics  (Event vs. Time speedup benchmarks)
└── 7. Experiment History   (Recorded ledger & result reproduction)
```

---

### Page 1: Dashboard (`/Dashboard`)

**Purpose**: The central mission-control overview of the latest simulation state.

* **Top Status Pill**: Displays whether the network is currently running under **EVENT-DRIVEN** (Cool Cyan) or **TIME-DRIVEN** (Warm Amber) strategy.
* **Top Metric Grid**:
  * **Simulation Duration**: Total simulated biological time (e.g., $30.00\,\text{ms}$).
  * **Neuron Population**: Active neuron count ($N$).
  * **Total Spikes Fired**: Aggregate action potentials recorded across all windows.
  * **Regime Switches**: Number of times the Adaptive Controller crossed thresholds and migrated execution engines.
  * **Peak Spike Rate**: Maximum instantaneous firing frequency ($\text{spikes/ms}$).
* **Dynamic SNN Topology Preview**: Shows a high-definition preview of the actual neuron chain. Clicking any node focuses on it.
* **Active Controller Status**: Real-time gauge showing current spike rate versus the low ($\theta_{\text{low}}$) and high ($\theta_{\text{high}}$) migration thresholds.
* **Adaptive Regime Timeline**: Color-coded segmented timeline mapping out exactly when the network operated in Event-Driven vs. Time-Driven mode across windows.

---

### Page 2: Live Simulation Cockpit (`/Live Simulation`)

**Purpose**: The primary interactive laboratory where you configure and execute live simulations.

* **C++ Engine Configuration Panel**:
  * **Neuron Population ($N$)**: Adjust the number of neurons ($1 \dots 100+$).
  * **Simulation Time**: Total duration to simulate in milliseconds ($5.0 \dots 500.0\,\text{ms}$).
  * **Integration Step ($\Delta t$)**: Discrete step size for Time-Driven integration ($0.1 \dots 5.0\,\text{ms}$).
  * **Low Threshold ($\theta_{\text{low}}$)**: Spike rate below which the engine switches back to Event-Driven mode.
  * **High Threshold ($\theta_{\text{high}}$)**: Spike rate above which the engine escalates to Time-Driven mode.
  * **Adaptation Window**: Window duration ($5.0\,\text{ms}$) for calculating instantaneous spike rate.
  * **Stimulus Workload Preset Dropdown**:
    * `sparse_dense`: Starts quiet, transitions into heavy burst, then relaxes.
    * `bursty`: High-frequency clustered spikes triggering immediate time-driven escalation.
    * `sparse`: Minimal firing, remaining in energy-efficient event-driven mode.
    * `dense`: Continuous heavy firing.
    * `poisson`: Stochastically distributed event arrivals.
  * **"RUN SIMULATION" Button**: Launches the C++ binary and triggers live streaming.
* **Real-Time SNN Topology Canvas**:
  * During a live run, this canvas lights up automatically as C++ emits spikes.
  * Spiking neurons flash with an expanding cyan ripple aura.
  * Synapses light up with emerald laser pulses as neurotransmitters propagate.
* **SNN Replay & Scrubbing Controller**:
  * **▶ PLAY / ⏸ PAUSE**: Watch the activation wavefront travel across neurons in slow motion or high speed.
  * **⏮ Reset**: Return to time $t = 0.00\,\text{ms}$.
  * **⏪ Step Back / ⏩ Step Forward**: Step frame-by-frame through individual spike events.
  * **Timeline Slider**: Drag the scrubber to any millisecond in the simulation trace.
  * **Speed Multiplier**: Choose $0.25\times$, $0.5\times$, $1.0\times$, $2.0\times$, or $4.0\times$.
* **Live Telemetry Strip**: Displays current simulation clock, active strategy, population count, and switch counter.
* **Chronological Event Log**: Real-time terminal log listing every spike, window observation, and mode migration.

---

### Page 3: SNN Architecture & Topology (`/Network`)

**Purpose**: Deep structural inspection of the neural network's physical connectivity and biological LIF parameters.

* **Multi-Scale Graph Viewport**:
  * **Small Networks ($N \le 6$)**: Rendered as an elegant linear feedforward pipeline.
  * **Medium Networks ($7 \le N \le 24$)**: Arranged in a **serpentine multi-row grid** (Row 0 left-to-right, Row 1 right-to-left) with cubic Bézier curve row-hop connections to eliminate visual tangling.
  * **Large Networks ($N \ge 25$)**: Compact matrix grid with **Zoom In (+)**, **Zoom Out (–)**, **Reset (⟲)**, and canvas drag panning.
  * **Neuron Search Bar**: Type any index (e.g. `12`) to instantly focus on and inspect that node.
  * **Activity Filter**: Toggle between `All Nodes` and `Active Firing Only`.
* **Selected Neuron Inspector**:
  Clicking any neuron reveals its biological specifications:
  * **Resting Potential ($V_{\text{rest}}$)**: $0.00\,\text{mV}$
  * **Spike Threshold ($V_{\text{thresh}}$)**: $1.00\,\text{mV}$
  * **Reset Potential ($V_{\text{reset}}$)**: $0.00\,\text{mV}$
  * **Membrane Time Constant ($\tau_m$)**: $10.00\,\text{ms}$
  * **Cumulative Spikes Fired**: Exact count of spikes emitted by this specific neuron.
  * **Afferent Synapses (Inputs)**: Upstream neurons feeding into this node with weights and transmission delays.
  * **Efferent Synapses (Outputs)**: Downstream target neurons.
* **Mathematical Model Card**: Formal differential equations of the Leaky Integrate-and-Fire model.
* **Verified Synaptic Manifest Table**: Full table listing every directed synapse (`SYN-01`, `SYN-02`, etc.), source neuron, target neuron, weight ($w=1.00$), propagation delay ($d=1.00\,\text{ms}$), and plasticity rule.

---

### Page 4: Adaptive Controller (`/Controller`)

**Purpose**: Explains the mathematical theory and state transitions of the dual-engine switching mechanism.

* **Regime State Machine Diagram**:
  Visualizes the hysteretic control loop:
  * $\rho(t) < \theta_{\text{low}} \implies$ **EVENT-DRIVEN REGIME**
  * $\rho(t) > \theta_{\text{high}} \implies$ **TIME-DRIVEN REGIME**
  * $\theta_{\text{low}} \le \rho(t) \le \theta_{\text{high}} \implies$ **HYSTERESIS BAND** (prevents high-frequency mode chatter).
* **Threshold Comparator**: Live bars showing configured $\theta_{\text{low}}$ and $\theta_{\text{high}}$ versus observed workload rates.
* **Engine Characteristics Table**: Direct side-by-side comparison of Event-Driven vs. Time-Driven advantages, complexity, and optimal workload scenarios.

---

### Page 5: Workload Analysis (`/Workload`)

**Purpose**: Detailed temporal breakdown of firing rates and workload distributions across time windows.

* **Workload Spike Rate Curve**: Interactive SVG chart plotting spike frequency ($\text{spikes/ms}$) over time.
* **Threshold Reference Lines**: Clear visual markers showing the upper and lower migration boundaries.
* **Window Breakdown Cards**: Granular cards for each adaptation window (e.g., $0.0\to5.0\,\text{ms}$, $5.0\to10.0\,\text{ms}$) detailing spikes recorded, rate, and chosen operating mode.

---

### Page 6: Performance Metrics (`/Performance`)

**Purpose**: Computational efficiency and benchmark verification.

* **Computational Update Comparison**:
  * **Event-Driven Updates**: Number of analytical subthreshold solves executed.
  * **Time-Driven Updates**: Number of discrete Euler step integrations executed.
* **Speedup Factor**: Quantifies the computational savings of adaptive switching compared to naive fixed-step simulation.
* **Memory Complexity**: Min-heap memory bounds ($O(E)$) versus circular array buffer overhead.

---

### Page 7: Experiment History (`/Experiments`)

**Purpose**: Historical archive and scientific reproducibility ledger.

* **Experiment Ledger Table**: Records every simulation run executed by the C++ engine (`EXP-001`, `EXP-002`, ...).
* **Logged Parameters**: Date/time, neuron count, simulation duration, workload preset, mode switches, wall-clock execution time (ms), and final mode.
* **"Inspect Results →" Button**: Clicking this button loads any past experiment's complete dataset directly into the Dashboard and SNN Topology viewer for instant retrospective analysis.

---

## 4. Quick Tutorial: Running Your First Simulation

Follow these 4 simple steps to test the system:

1. Click **Live Simulation** in the left sidebar.
2. In the **Simulation Configuration Panel**:
   * Change **Neuron Population** to `10`.
   * Select **Stimulus Workload Preset** $\rightarrow$ `bursty`.
3. Click the cyan **"RUN SIMULATION"** button.
   * Watch the status dot turn green (**STREAMING**).
   * Notice the 10 neurons in the topology graph light up as spikes propagate from $N_0$ through $N_9$.
   * Observe the strategy switch to **TIME-DRIVEN** as the burst rate exceeds threshold.
4. When finished, click **"▶ PLAY"** in the playback bar below the graph to replay the spike propagation in slow motion ($0.5\times$). Click any neuron (e.g. $N_4$) to view its individual spike count!

---

## 5. Frequently Asked Questions (FAQ)

### Q1: Can the website run if the C++ backend is offline?
**Yes.** The frontend features an automatic **offline fallback mode**. If `http://localhost:3000` is unreachable, it automatically loads pre-recorded experiment telemetry from `data/results.json`. You can explore the full UI, inspect topologies, and use the playback scrubber freely. To run *new live simulations*, start the backend server with `node backend/server.js`.

### Q2: How do I change the neuron model parameters?
The biological LIF parameters ($\tau_m = 10.00\,\text{ms}$, $V_{\text{thresh}} = 1.00\,\text{mV}$, $V_{\text{reset}} = 0.00\,\text{mV}$) are defined in `include/Neuron.h` and instantiated in `src/main.cpp`.

### Q3: Why does the topology graph look different when I choose 5 vs 25 neurons?
The topology engine is **adaptive**:
* For $N \le 6$, it renders a linear feedforward pipeline.
* For $7 \le N \le 24$, it automatically wraps into a serpentine multi-row grid so nodes don't overlap.
* For $N \ge 25$, it activates a scalable matrix with zoom and pan controls.
