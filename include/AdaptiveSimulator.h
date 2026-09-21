#ifndef ADAPTIVE_SIMULATOR_H
#define ADAPTIVE_SIMULATOR_H

#include <vector>

#include "EventDrivenEngine.h"
#include "TimeDrivenEngine.h"
#include "AdaptiveController.h"
#include "SimulationState.h"
#include "SimulationResult.h"

class AdaptiveSimulator {
private:

    int neuron_count;

    double time_step;

    double current_time;

    double end_time;

    double adaptation_window;

    EventDrivenEngine event_engine;

    TimeDrivenEngine time_engine;

    AdaptiveController controller;

    ExecutionMode current_mode;

    int total_mode_switches;

    std::vector<SimulationWindow> window_results;

public:

    AdaptiveSimulator(
        int neuron_count,
        double time_step,
        double low_threshold,
        double high_threshold,
        double adaptation_window
    );

    void addSynapse(
        const Synapse& synapse
    );

    void addInput(
        double time,
        int neuron_id,
        double weight
    );

    void run(
        double end_time
    );

    ExecutionMode getCurrentMode() const;

    double getCurrentTime() const;

    int getModeSwitches() const;

    const std::vector<SimulationWindow>&
    getWindowResults() const;
};

#endif