# AED-SNN: Adaptive Event-Driven Spiking Neural Network Simulator

[![C++20](https://img.shields.io/badge/C%2B%2B-20-blue.svg)](https://isocpp.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An advanced, research-grade **Adaptive Event-Driven Spiking Neural Network Simulator (AED-SNN)** combining a high-performance C++ simulation engine, an unbuffered Node.js/WebSocket telemetry bridge, and an interactive React workstation with real-time dynamic neural topology visualization.

---

## ⚡ Key Highlights

* **Authentic Population Scaling ($N_0 \dots N_{N-1}$)**:
  Configure arbitrary neuron populations (e.g. $N=5, 10, 20, 50, 100$). The C++ engine simulates the exact network and synchronizes topology nodes and synaptic pathways without static mocks.
* **Dual Execution Regimes (Hybrid Engine)**:
  * **Event-Driven Engine**: Exact subthreshold analytical integration at spike arrival moments using a min-heap priority queue ($O(\log E)$).
  * **Time-Driven Engine**: Fixed discrete time-step Euler integration ($\Delta t = 1.0\,\text{ms}$) optimized for high-frequency bursty regimes.
* **Dynamic Adaptive Controller**:
  Continuous windowed workload monitoring ($\rho(t)$) dynamically switches between Event-Driven and Time-Driven execution modes when crossing configured activity thresholds ($\theta_{\text{low}}, \theta_{\text{high}}$).
* **Real-Time WebSocket Telemetry (`ws://localhost:3000/ws`)**:
  Unbuffered C++ simulation stdout streaming delivers action potentials and synaptic transmissions to the browser with millisecond latency.
* **Multi-Scale Topology Layout**:
  * **Linear Feedforward Chain** ($N \le 6$)
  * **Multi-Row Serpentine Grid** ($7 \le N \le 24$) with smooth cubic Bézier row-hop connections.
  * **Scalable Matrix Grid** ($N \ge 25$) with canvas zoom, pan navigation, neuron search, and activity filtering.
* **Integrated SNN Propagation Scrubber**:
  Full event replay engine supporting Play/Pause, Step Forward/Backward, timeline scrubbing, and variable speed ($0.25\times$ to $4.0\times$).

---

## 🏛️ System Architecture

```text
       ┌────────────────────────────────────────────────────────┐
       │             React 19 / Vite Research UI                │
       │    Dynamic SNN Topology • Event Replay • Telemetry     │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTP POST / WebSocket
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             Node.js / Express API Bridge               │
       │      /api/simulation/run • ws://localhost:3000/ws      │
       └───────────────────────────┬────────────────────────────┘
                                   │ Process Spawn / Pipes
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │            C++ AED-SNN Simulation Engine               │
       │  LIF Neuron Chain • Adaptive Controller • Dual Engines │
       └────────────────────────────────────────────────────────┘
```

---

## 🔬 Neuronal Dynamics (Leaky Integrate-and-Fire)

Between synaptic event arrivals, membrane subthreshold potential evolves according to:

$$\tau_m \frac{dV}{dt} = -(V(t) - V_{\text{rest}}) + I_{\text{syn}}(t)$$

When the membrane potential crosses the threshold $V(t) \ge V_{\text{thresh}} = 1.00\,\text{mV}$:
1. An action potential (spike) is generated.
2. The potential resets to $V(t^+) = V_{\text{reset}} = 0.00\,\text{mV}$.
3. Postsynaptic transmission events are scheduled with latency $d = 1.0\,\text{ms}$ and synaptic weight $w = 1.0$.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
* **C++ Compiler**: GCC / MinGW (`g++` supporting C++17 or C++20) and **CMake** ($\ge 3.16$).
* **Node.js**: Version 18+ and `npm`.

### 1. Build the C++ Simulator
```bash
# Clone the repository
git clone https://github.com/DhanaForge/AED-SNN.git
cd AED-SNN

# Build C++ simulator binary
cmake -B build -S .
cmake --build build --config Release
```

### 2. Start the API Bridge
```bash
cd backend
npm install
node server.js
```
*API Bridge will listen on `http://localhost:3000` with WebSocket stream on `ws://localhost:3000/ws`.*

### 3. Launch the Frontend Research UI
```bash
cd ../frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🚢 Cloud Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions:
* **Frontend on Vercel / Netlify**: Built-in SPA rewrites via `vercel.json` and `netlify.toml`.
* **Full-Stack Container on Render / Railway**: 1-click Docker build via [`Dockerfile`](Dockerfile).

---

## 📂 Project Structure

```text
AED-SNN/
├── CMakeLists.txt             # Root CMake build definition
├── Dockerfile                 # All-in-one container definition
├── DEPLOYMENT.md              # Deployment guide (Vercel, Netlify, Render)
├── include/                   # C++ Header declarations
│   ├── Neuron.h               # LIF neuron model
│   ├── Event.h                # Discrete spike event structures
│   ├── EventQueue.h           # Min-heap priority event queue
│   ├── EventDrivenEngine.h    # Event-driven subthreshold solver
│   ├── TimeDrivenEngine.h     # Discrete Euler integration engine
│   ├── AdaptiveController.h   # Regime transition logic
│   ├── AdaptiveSimulator.h    # Hybrid orchestration harness
│   └── WorkloadMonitor.h      # Spike frequency rate estimators
├── src/
│   └── main.cpp               # C++ Entrypoint & JSON config parser
├── backend/
│   ├── server.js              # Express API & WebSocket bridge
│   ├── package.json
│   └── data/experiments.json  # Recorded historical experiments
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── NeuralNetwork.jsx      # Dynamic SNN topology visualizer
    │   │   ├── SnnPlaybackBar.jsx     # Propagation scrubber & controls
    │   │   ├── SimulationConfigPanel.jsx
    │   │   └── ...
    │   ├── hooks/
    │   │   └── useSnnPlayback.js      # Replay synchronization hook
    │   ├── pages/                     # Dashboard, Network, Cockpit, etc.
    │   └── services/
    │       └── simulationApi.js       # HTTP client & WebSocket manager
    ├── vercel.json
    ├── netlify.toml
    └── package.json
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
