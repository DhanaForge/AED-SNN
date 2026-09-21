#include "AdaptiveSimulator.h"

#include <iostream>

AdaptiveSimulator::AdaptiveSimulator(
    int neuron_count,
    double time_step,
    double low_threshold,
    double high_threshold,
    double adaptation_window
)
    : neuron_count(neuron_count),
      time_step(time_step),
      current_time(0.0),
      end_time(0.0),
      adaptation_window(adaptation_window),
      event_engine(neuron_count),
      time_engine(neuron_count, time_step),
      controller(
          low_threshold,
          high_threshold
      ),
      current_mode(
          ExecutionMode::EVENT_DRIVEN
      ),
      total_mode_switches(0) {
}

void AdaptiveSimulator::addSynapse(
    const Synapse& synapse
) {
    event_engine.addSynapse(synapse);
    time_engine.addSynapse(synapse);
}

void AdaptiveSimulator::addInput(
    double time,
    int neuron_id,
    double weight
) {
    event_engine.addEvent({
        time,
        neuron_id,
        weight
    });

    time_engine.addEvent({
        time,
        neuron_id,
        weight
    });
}

void AdaptiveSimulator::run(
    double simulation_end_time
) {
    end_time = simulation_end_time;

    current_time = 0.0;

    current_mode =
        ExecutionMode::EVENT_DRIVEN;

    total_mode_switches = 0;

    window_results.clear();

    std::cout
        << "\n========================================\n"
        << "       ADAPTIVE SIMULATION START\n"
        << "========================================\n";

    std::cout
        << "Initial mode: EVENT-DRIVEN\n";

    while (current_time < end_time) {

        double window_start =
            current_time;

        double window_end =
            current_time +
            adaptation_window;

        if (window_end > end_time) {
            window_end = end_time;
        }

        std::cout
            << "\n----------------------------------------\n"
            << "Window: "
            << window_start
            << " -> "
            << window_end
            << " ms\n";

        int spikes_before = 0;

        if (
            current_mode ==
            ExecutionMode::EVENT_DRIVEN
        ) {
            spikes_before =
                event_engine.getSpikesGenerated();
        }
        else {
            spikes_before =
                time_engine.getSpikesGenerated();
        }

        // -----------------------------------------
        // EXECUTE CURRENT MODE
        // -----------------------------------------

        if (
            current_mode ==
            ExecutionMode::EVENT_DRIVEN
        ) {
            event_engine.run(window_end);
        }
        else {
            time_engine.run(window_end);
        }

        // -----------------------------------------
        // MEASURE WORKLOAD
        // -----------------------------------------

        int spikes_after = 0;

        if (
            current_mode ==
            ExecutionMode::EVENT_DRIVEN
        ) {
            spikes_after =
                event_engine.getSpikesGenerated();
        }
        else {
            spikes_after =
                time_engine.getSpikesGenerated();
        }

        int window_spikes =
            spikes_after -
            spikes_before;

        double window_duration =
            window_end -
            window_start;

        double spike_rate = 0.0;

        if (window_duration > 0.0) {
            spike_rate =
                static_cast<double>(
                    window_spikes
                ) /
                window_duration;
        }

        std::string mode_name;

        if (
            current_mode ==
            ExecutionMode::EVENT_DRIVEN
        ) {
            mode_name =
                "EVENT-DRIVEN";
        }
        else {
            mode_name =
                "TIME-DRIVEN";
        }

        // -----------------------------------------
        // SAVE REAL WINDOW RESULT
        // -----------------------------------------

        window_results.push_back({
            window_start,
            window_end,
            window_spikes,
            spike_rate,
            mode_name
        });

        std::cout
            << "Window spikes: "
            << window_spikes
            << "\n";

        std::cout
            << "Window spike rate: "
            << spike_rate
            << " spikes/ms\n";

        // -----------------------------------------
        // ADAPTIVE DECISION
        // -----------------------------------------

        ExecutionMode next_mode =
            controller.decide(
                spike_rate
            );

        std::cout
            << "Controller decision: ";

        if (
            next_mode ==
            ExecutionMode::EVENT_DRIVEN
        ) {
            std::cout
                << "EVENT-DRIVEN\n";
        }
        else {
            std::cout
                << "TIME-DRIVEN\n";
        }

        // -----------------------------------------
        // MODE SWITCH
        // -----------------------------------------

        if (next_mode != current_mode) {

            std::cout
                << ">>> MODE SWITCH <<<\n";

            SimulationState state;

            if (
                current_mode ==
                ExecutionMode::EVENT_DRIVEN
            ) {
                state =
                    event_engine.getState();
            }
            else {
                state =
                    time_engine.getState();
            }

            state.current_time =
                window_end;

            if (
                next_mode ==
                ExecutionMode::EVENT_DRIVEN
            ) {
                event_engine.setState(
                    state
                );
            }
            else {
                time_engine.setState(
                    state
                );
            }

            current_mode =
                next_mode;

            total_mode_switches++;

            std::cout
                << "Switched to: ";

            if (
                current_mode ==
                ExecutionMode::EVENT_DRIVEN
            ) {
                std::cout
                    << "EVENT-DRIVEN\n";
            }
            else {
                std::cout
                    << "TIME-DRIVEN\n";
            }
        }

        current_time =
            window_end;
    }

    std::cout
        << "\n========================================\n"
        << "       ADAPTIVE SIMULATION END\n"
        << "========================================\n";

    std::cout
        << "Final simulation time: "
        << current_time
        << " ms\n";

    std::cout
        << "Total mode switches: "
        << total_mode_switches
        << "\n";
}

ExecutionMode
AdaptiveSimulator::getCurrentMode() const {
    return current_mode;
}

double
AdaptiveSimulator::getCurrentTime() const {
    return current_time;
}

int
AdaptiveSimulator::getModeSwitches() const {
    return total_mode_switches;
}

const std::vector<SimulationWindow>&
AdaptiveSimulator::getWindowResults() const {
    return window_results;
}