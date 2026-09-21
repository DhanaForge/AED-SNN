#include "SimulationResult.h"

#include <fstream>
#include <iomanip>

void saveSimulationResult(
    const SimulationResult& result,
    const std::string& filename
) {
    std::ofstream file(filename);

    if (!file.is_open()) {
        return;
    }

    file << std::fixed << std::setprecision(2);

    file << "{\n";

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

        if (i + 1 < result.windows.size()) {
            file << ",";
        }

        file << "\n";
    }

    file << "  ]\n";

    file << "}\n";
}