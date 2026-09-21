#ifndef EVENT_DRIVEN_ENGINE_H
#define EVENT_DRIVEN_ENGINE_H

#include <vector>
#include <cstddef>

#include "Neuron.h"
#include "Event.h"
#include "EventQueue.h"
#include "Synapse.h"
#include "WorkloadMonitor.h"
#include "SimulationState.h"

class EventDrivenEngine {
private:
    std::vector<Neuron> neurons;
    std::vector<Synapse> synapses;

    EventQueue eventQueue;
    WorkloadMonitor monitor;

    double current_time;

    int events_processed;
    int spikes_generated;

public:

    // ----------------------------------------
    // Constructor
    // ----------------------------------------

    EventDrivenEngine(
        int neuron_count
    );


    // ----------------------------------------
    // Add event
    // ----------------------------------------

    void addEvent(
        const Event& event
    );


    // ----------------------------------------
    // Add synapse
    // ----------------------------------------

    void addSynapse(
        const Synapse& synapse
    );


    // ----------------------------------------
    // Run event-driven simulation
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

    int getEventsProcessed() const;

    int getSpikesGenerated() const;

    double getCurrentTime() const;

    double getSpikeRate() const;

    int getNeuronUpdates() const;

    std::size_t getQueueOperations() const;
};

#endif