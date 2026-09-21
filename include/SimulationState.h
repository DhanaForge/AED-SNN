#ifndef SIMULATION_STATE_H
#define SIMULATION_STATE_H

#include <vector>

#include "Event.h"

struct SimulationState {

    // ----------------------------------------
    // Current simulation time
    // ----------------------------------------

    double current_time;


    // ----------------------------------------
    // Membrane potential of every neuron
    // ----------------------------------------

    std::vector<double> neuron_potentials;


    // ----------------------------------------
    // Events waiting to be processed
    // ----------------------------------------

    std::vector<Event> pending_events;


    // ----------------------------------------
    // Simulation counters
    // ----------------------------------------

    int spikes_generated;

    int events_processed;

    int neuron_updates;
};

#endif