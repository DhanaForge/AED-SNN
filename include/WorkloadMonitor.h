#ifndef WORKLOAD_MONITOR_H
#define WORKLOAD_MONITOR_H

#include <cstddef>

class WorkloadMonitor {
private:
    int events_processed;
    int spikes_generated;
    int neuron_updates;

    double observation_time;

    std::size_t queue_operations;

public:

    // ----------------------------------------
    // Constructor
    // ----------------------------------------

    WorkloadMonitor();


    // ----------------------------------------
    // Record measurements
    // ----------------------------------------

    void recordEvent();

    void recordSpike();

    void recordNeuronUpdate();

    void recordQueueOperation();


    // ----------------------------------------
    // Restore measurements
    // ----------------------------------------

    void setEventsProcessed(
        int value
    );

    void setSpikesGenerated(
        int value
    );

    void setNeuronUpdates(
        int value
    );

    void setQueueOperations(
        std::size_t value
    );

    void setObservationTime(
        double time
    );


    // ----------------------------------------
    // Get measurements
    // ----------------------------------------

    int getEventsProcessed() const;

    int getSpikesGenerated() const;

    int getNeuronUpdates() const;

    std::size_t getQueueOperations() const;

    double getObservationTime() const;

    double getSpikeRate() const;


    // ----------------------------------------
    // Reset measurements
    // ----------------------------------------

    void reset();
};

#endif