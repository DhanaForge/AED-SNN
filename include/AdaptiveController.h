#ifndef ADAPTIVE_CONTROLLER_H
#define ADAPTIVE_CONTROLLER_H

enum class ExecutionMode {
    EVENT_DRIVEN,
    TIME_DRIVEN
};

class AdaptiveController {
private:
    ExecutionMode current_mode;

    double low_threshold;
    double high_threshold;

    int mode_switches;

public:
    AdaptiveController(
        double low_threshold,
        double high_threshold
    );

    ExecutionMode decide(double spike_rate);

    ExecutionMode getCurrentMode() const;

    int getModeSwitches() const;
};

#endif