#include "AdaptiveController.h"

AdaptiveController::AdaptiveController(
    double low_threshold,
    double high_threshold
)
    : current_mode(ExecutionMode::EVENT_DRIVEN),
      low_threshold(low_threshold),
      high_threshold(high_threshold),
      mode_switches(0) {
}

ExecutionMode AdaptiveController::decide(double spike_rate) {

    // Low workload -> Event-Driven
    if (spike_rate < low_threshold) {

        if (current_mode != ExecutionMode::EVENT_DRIVEN) {
            current_mode = ExecutionMode::EVENT_DRIVEN;
            mode_switches++;
        }
    }

    // High workload -> Time-Driven
    else if (spike_rate > high_threshold) {

        if (current_mode != ExecutionMode::TIME_DRIVEN) {
            current_mode = ExecutionMode::TIME_DRIVEN;
            mode_switches++;
        }
    }

    // Between thresholds:
    // keep the current mode.
    return current_mode;
}

ExecutionMode AdaptiveController::getCurrentMode() const {
    return current_mode;
}

int AdaptiveController::getModeSwitches() const {
    return mode_switches;
}