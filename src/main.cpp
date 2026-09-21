#include <iostream>
#include <iomanip>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <cctype>

#include "EventDrivenEngine.h"
#include "TimeDrivenEngine.h"
#include "AdaptiveSimulator.h"
#include "SimulationResult.h"


// ==================================================
// SIMULATION CONFIGURATION SCHEMA & LOADER
// ==================================================

struct SimulationConfig {
    int neurons = 3;
    double dt = 1.0;
    double simulation_time = 30.0;
    double low_threshold = 0.3;
    double high_threshold = 1.0;
    double adaptation_window = 5.0;
    std::string workload = "sparse_dense";
};

SimulationConfig loadSimulationConfig(const std::string& path1, const std::string& path2) {
    SimulationConfig config;
    std::ifstream file(path1);
    if (!file.is_open()) {
        file.open(path2);
    }
    if (!file.is_open()) {
        std::cout << "[CONFIG] No simulation_config.json found; using default parameters.\n";
        return config;
    }

    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();

    auto extractNumber = [&](const std::string& key, double defaultVal) -> double {
        std::size_t pos = content.find("\"" + key + "\"");
        if (pos == std::string::npos) return defaultVal;
        pos = content.find(':', pos);
        if (pos == std::string::npos) return defaultVal;
        pos++;
        while (pos < content.size() && (content[pos] == ' ' || content[pos] == '\t' || content[pos] == '\r' || content[pos] == '\n')) pos++;
        std::size_t endPos = pos;
        while (endPos < content.size() && (isdigit(content[endPos]) || content[endPos] == '.' || content[endPos] == '-' || content[endPos] == 'e' || content[endPos] == 'E')) endPos++;
        try {
            return std::stod(content.substr(pos, endPos - pos));
        } catch (...) {
            return defaultVal;
        }
    };

    auto extractString = [&](const std::string& key, const std::string& defaultVal) -> std::string {
        std::size_t pos = content.find("\"" + key + "\"");
        if (pos == std::string::npos) return defaultVal;
        pos = content.find(':', pos);
        if (pos == std::string::npos) return defaultVal;
        pos = content.find('"', pos);
        if (pos == std::string::npos) return defaultVal;
        pos++;
        std::size_t endPos = content.find('"', pos);
        if (endPos == std::string::npos) return defaultVal;
        return content.substr(pos, endPos - pos);
    };

    config.neurons = static_cast<int>(extractNumber("neurons", 3.0));
    if (config.neurons < 1) config.neurons = 1;

    config.dt = extractNumber("dt", 1.0);
    if (config.dt <= 0.0) config.dt = 1.0;

    config.simulation_time = extractNumber("simulation_time", 30.0);
    if (config.simulation_time <= 0.0) config.simulation_time = 30.0;

    config.low_threshold = extractNumber("low_threshold", 0.3);
    config.high_threshold = extractNumber("high_threshold", 1.0);
    if (config.high_threshold <= config.low_threshold) {
        config.high_threshold = config.low_threshold + 0.1;
    }

    config.adaptation_window = extractNumber("adaptation_window", 5.0);
    if (config.adaptation_window <= 0.0) config.adaptation_window = 5.0;

    config.workload = extractString("workload", "sparse_dense");

    std::cout << "[CONFIG] Loaded configuration from simulation_config.json:\n"
              << "         Neurons: " << config.neurons << "\n"
              << "         dt: " << config.dt << " ms\n"
              << "         Simulation Time: " << config.simulation_time << " ms\n"
              << "         Low Threshold: " << config.low_threshold << "\n"
              << "         High Threshold: " << config.high_threshold << "\n"
              << "         Window: " << config.adaptation_window << " ms\n"
              << "         Workload: " << config.workload << "\n";

    return config;
}


// ==================================================
// WORKLOAD STIMULUS GENERATION
// ==================================================

struct StimulusEvent {
    double time;
    int neuronId;
    double weight;
};

std::vector<StimulusEvent> generateWorkload(const std::string& workload, double simTime) {
    std::vector<StimulusEvent> events;

    if (workload == "sparse") {
        if (simTime >= 1.0) events.push_back({1.0, 0, 1.0});
        if (simTime >= 21.0) events.push_back({21.0, 0, 1.0});
    } else if (workload == "dense") {
        for (double t = 1.0; t < simTime && t <= 20.0; t += 0.5) {
            events.push_back({t, 0, 1.0});
        }
    } else if (workload == "dense_sparse") {
        for (int i = 0; i < 10 && (2.0 + i * 0.1 < simTime); i++) {
            events.push_back({2.0 + (i * 0.1), 0, 1.0});
        }
        if (simTime >= 15.0) events.push_back({15.0, 0, 1.0});
        if (simTime >= 25.0) events.push_back({25.0, 0, 1.0});
    } else if (workload == "bursty") {
        for (int i = 0; i < 6 && (4.0 + i * 0.15 < simTime); i++) {
            events.push_back({4.0 + (i * 0.15), 0, 1.0});
        }
        for (int i = 0; i < 6 && (18.0 + i * 0.15 < simTime); i++) {
            events.push_back({18.0 + (i * 0.15), 0, 1.0});
        }
    } else if (workload == "poisson") {
        double t = 1.5;
        double intervals[] = { 1.2, 0.4, 2.5, 0.3, 0.2, 1.8, 3.1, 0.4, 0.3, 2.0, 0.5, 1.1 };
        int idx = 0;
        while (t < simTime && idx < 12) {
            events.push_back({t, 0, 1.0});
            t += intervals[idx++];
        }
    } else {
        // Default baseline: "sparse_dense"
        if (simTime >= 1.0) events.push_back({1.0, 0, 1.0});
        for (int i = 0; i < 10 && (8.0 + i * 0.1 < simTime); i++) {
            events.push_back({8.0 + (i * 0.1), 0, 1.0});
        }
        if (simTime >= 21.0) events.push_back({21.0, 0, 1.0});
    }

    return events;
}


// ==================================================
// SAVE REAL SIMULATION RESULTS AS JSON
// ==================================================

void saveSimulationResult(
    const SimulationResult& result,
    int neurons,
    const std::vector<Synapse>& synapses,
    const std::string& filename
) {
    std::ofstream file(filename);

    if (!file.is_open()) {
        std::cerr
            << "ERROR: Could not open "
            << filename
            << "\n";
        return;
    }

    file << std::fixed
         << std::setprecision(2);

    file << "{\n";

    file << "  \"neurons\": "
         << neurons
         << ",\n";

    file << "  \"synapses\": [\n";
    for (std::size_t i = 0; i < synapses.size(); ++i) {
        file << "    { \"source\": " << synapses[i].source_neuron
             << ", \"target\": " << synapses[i].target_neuron
             << ", \"weight\": " << synapses[i].weight
             << ", \"delay\": " << synapses[i].delay << " }";
        if (i + 1 < synapses.size()) {
            file << ",";
        }
        file << "\n";
    }
    file << "  ],\n";

    file << "  \"simulation_time\": "
         << result.simulation_time
         << ",\n";

    file << "  \"fixed_event_updates\": "
         << result.fixed_event_updates
         << ",\n";

    file << "  \"fixed_time_updates\": "
         << result.fixed_time_updates
         << ",\n";

    file << "  \"adaptive_mode_switches\": "
         << result.adaptive_mode_switches
         << ",\n";

    file << "  \"final_mode\": \""
         << result.final_mode
         << "\",\n";

    file << "  \"windows\": [\n";

    for (
        std::size_t i = 0;
        i < result.windows.size();
        ++i
    ) {

        const auto& window =
            result.windows[i];

        file << "    {\n";

        file << "      \"start_time\": "
             << window.start_time
             << ",\n";

        file << "      \"end_time\": "
             << window.end_time
             << ",\n";

        file << "      \"spikes\": "
             << window.spikes
             << ",\n";

        file << "      \"spike_rate\": "
             << window.spike_rate
             << ",\n";

        file << "      \"mode\": \""
             << window.mode
             << "\"\n";

        file << "    }";

        if (
            i + 1 <
            result.windows.size()
        ) {
            file << ",";
        }

        file << "\n";
    }

    file << "  ]\n";

    file << "}\n";

    file.close();

    std::cout
        << "\nResults saved to: "
        << filename
        << "\n";
}


// ==================================================
// MAIN
// ==================================================

int main() {

    std::cout
        << std::fixed
        << std::setprecision(2)
        << std::unitbuf;


    std::cout
        << "==================================================\n"
        << "        AED-SNN RESEARCH BACKEND ENGINE\n"
        << "==================================================\n";


    // Load simulation configuration (falls back to defaults if not present)
    SimulationConfig config = loadSimulationConfig(
        "../data/simulation_config.json",
        "data/simulation_config.json"
    );

    const int NEURONS = config.neurons;
    const double DT = config.dt;
    const double SIMULATION_TIME = config.simulation_time;
    const double ADAPTATION_WINDOW = config.adaptation_window;
    const double LOW_THRESHOLD = config.low_threshold;
    const double HIGH_THRESHOLD = config.high_threshold;

    std::vector<Synapse> synapses;
    for (int i = 0; i < NEURONS - 1; ++i) {
        synapses.push_back({i, i + 1, 1.0, 1.0});
    }

    std::vector<StimulusEvent> stimulusEvents = generateWorkload(config.workload, SIMULATION_TIME);


    // ==================================================
    // 1. FIXED EVENT-DRIVEN BASELINE
    // ==================================================

    std::cout
        << "\n\n[1] FIXED EVENT-DRIVEN BASELINE\n"
        << "--------------------------------------------------\n";

    EventDrivenEngine eventEngine(NEURONS);

    for (const auto& syn : synapses) {
        eventEngine.addSynapse(syn);
    }

    for (const auto& ev : stimulusEvents) {
        if (ev.neuronId < NEURONS) {
            eventEngine.addEvent({ev.time, ev.neuronId, ev.weight});
        }
    }

    eventEngine.run(SIMULATION_TIME);

    std::cout
        << "Events processed: "
        << eventEngine.getEventsProcessed()
        << "\n";

    std::cout
        << "Spikes generated: "
        << eventEngine.getSpikesGenerated()
        << "\n";

    std::cout
        << "Neuron updates: "
        << eventEngine.getNeuronUpdates()
        << "\n";

    std::cout
        << "Queue operations: "
        << eventEngine.getQueueOperations()
        << "\n";


    // ==================================================
    // 2. FIXED TIME-DRIVEN BASELINE
    // ==================================================

    std::cout
        << "\n\n[2] FIXED TIME-DRIVEN BASELINE\n"
        << "--------------------------------------------------\n";

    TimeDrivenEngine timeEngine(NEURONS, DT);

    for (const auto& syn : synapses) {
        timeEngine.addSynapse(syn);
    }

    for (const auto& ev : stimulusEvents) {
        if (ev.neuronId < NEURONS) {
            timeEngine.addEvent({ev.time, ev.neuronId, ev.weight});
        }
    }

    timeEngine.run(SIMULATION_TIME);

    std::cout
        << "Events processed: "
        << timeEngine.getEventsProcessed()
        << "\n";

    std::cout
        << "Spikes generated: "
        << timeEngine.getSpikesGenerated()
        << "\n";

    std::cout
        << "Neuron updates: "
        << timeEngine.getNeuronUpdates()
        << "\n";


    // ==================================================
    // 3. ADAPTIVE AED-SNN
    // ==================================================

    std::cout
        << "\n\n[3] ADAPTIVE AED-SNN\n"
        << "--------------------------------------------------\n";

    AdaptiveSimulator adaptive(
        NEURONS,
        DT,
        LOW_THRESHOLD,
        HIGH_THRESHOLD,
        ADAPTATION_WINDOW
    );

    for (const auto& syn : synapses) {
        adaptive.addSynapse(syn);
    }

    for (const auto& ev : stimulusEvents) {
        if (ev.neuronId < NEURONS) {
            adaptive.addInput(ev.time, ev.neuronId, ev.weight);
        }
    }

    adaptive.run(SIMULATION_TIME);


    // ==================================================
    // ADAPTIVE RESULTS
    // ==================================================

    std::cout
        << "\nAdaptive final time: "
        << adaptive.getCurrentTime()
        << " ms\n";

    std::cout
        << "Adaptive mode switches: "
        << adaptive.getModeSwitches()
        << "\n";

    std::cout
        << "Final execution mode: ";

    if (
        adaptive.getCurrentMode()
        ==
        ExecutionMode::EVENT_DRIVEN
    ) {
        std::cout << "EVENT-DRIVEN\n";
    }
    else {
        std::cout << "TIME-DRIVEN\n";
    }


    // ==================================================
    // FINAL COMPARISON
    // ==================================================

    std::cout
        << "\n\n==================================================\n"
        << "             FINAL COMPARISON\n"
        << "==================================================\n";

    std::cout
        << "\nFixed Event-Driven neuron updates : "
        << eventEngine.getNeuronUpdates()
        << "\n";

    std::cout
        << "Fixed Time-Driven neuron updates  : "
        << timeEngine.getNeuronUpdates()
        << "\n";

    std::cout
        << "Adaptive mode switches            : "
        << adaptive.getModeSwitches()
        << "\n";

    std::cout
        << "\n==================================================\n"
        << "              BACKEND RUN COMPLETE\n"
        << "==================================================\n";


    // ==================================================
    // CREATE JSON RESULT
    // ==================================================

    SimulationResult result;

    result.simulation_time =
        adaptive.getCurrentTime();

    result.fixed_event_updates =
        eventEngine.getNeuronUpdates();

    result.fixed_time_updates =
        timeEngine.getNeuronUpdates();

    result.adaptive_mode_switches =
        adaptive.getModeSwitches();

    if (
        adaptive.getCurrentMode()
        ==
        ExecutionMode::EVENT_DRIVEN
    ) {
        result.final_mode = "EVENT-DRIVEN";
    }
    else {
        result.final_mode = "TIME-DRIVEN";
    }

    result.windows =
        adaptive.getWindowResults();


    // ==================================================
    // SAVE JSON
    // ==================================================

    saveSimulationResult(
        result,
        NEURONS,
        synapses,
        "../data/results.json"
    );

    // Also write to data/results.json if directory exists in current working dir
    std::ofstream localTest("data/results.json");
    if (localTest.is_open()) {
        localTest.close();
        saveSimulationResult(result, NEURONS, synapses, "data/results.json");
    }

    return 0;
}