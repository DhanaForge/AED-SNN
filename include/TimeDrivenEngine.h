#ifndef TIME_DRIVEN_ENGINE_H
#define TIME_DRIVEN_ENGINE_H

#include <vector>

#include "Neuron.h"
#include "Synapse.h"
#include "Event.h"
#include "EventQueue.h"
#include "SimulationState.h"

class TimeDrivenEngine {
private:
    std::vector<Neuron> neurons;
    std::vector<Synapse> synapses;

    EventQueue eventQueue;

    double current_time;
    double time_step;

    int neuron_updates;
    int events_processed;
    int spikes_generated;

public:

    // ----------------------------------------
    // Constructor
    // ----------------------------------------

    TimeDrivenEngine(
        int neuron_count,
        double dt
    );


    // ----------------------------------------
    // Add network connection
    // ----------------------------------------

    void addSynapse(
        const Synapse& synapse
    );


    // ----------------------------------------
    // Add immediate input
    // ----------------------------------------

    void addInput(
        int neuron_id,
        double weight
    );


    // ----------------------------------------
    // Add timestamped event
    // ----------------------------------------

    void addEvent(
        const Event& event
    );


    // ----------------------------------------
    // Run time-driven simulation
    // ----------------------------------------

    void run(
        double end_time
    );


    // ----------------------------------------
    // Simulation state support
    // ----------------------------------------

    SimulationState getState() const;

    void setState(
        const SimulationState& state
    );


    // ----------------------------------------
    // Performance metrics
    // ----------------------------------------

    int getNeuronUpdates() const;

    int getEventsProcessed() const;

    int getSpikesGenerated() const;

    double getCurrentTime() const;
};

#endif