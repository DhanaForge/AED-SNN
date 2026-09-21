#ifndef SIMULATION_RESULT_H
#define SIMULATION_RESULT_H

#include <string>
#include <vector>

struct SimulationWindow {
    double start_time;
    double end_time;
    int spikes;
    double spike_rate;
    std::string mode;
};

struct SimulationResult {
    double simulation_time;

    int fixed_event_updates;
    int fixed_time_updates;

    int adaptive_mode_switches;

    std::string final_mode;

    std::vector<SimulationWindow> windows;
};

#endif