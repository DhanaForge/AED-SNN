#include "WorkloadMonitor.h"

// ==================================================
// CONSTRUCTOR
// ==================================================

WorkloadMonitor::WorkloadMonitor()
    : events_processed(0),
      spikes_generated(0),
      neuron_updates(0),
      observation_time(0.0),
      queue_operations(0) {
}


// ==================================================
// RECORD EVENT
// ==================================================

void WorkloadMonitor::recordEvent() {

    events_processed++;
}


// ==================================================
// RECORD SPIKE
// ==================================================

void WorkloadMonitor::recordSpike() {

    spikes_generated++;
}


// ==================================================
// RECORD NEURON UPDATE
// ==================================================

void WorkloadMonitor::recordNeuronUpdate() {

    neuron_updates++;
}


// ==================================================
// RECORD QUEUE OPERATION
// ==================================================

void WorkloadMonitor::recordQueueOperation() {

    queue_operations++;
}


// ==================================================
// SET EVENTS PROCESSED
// ==================================================

void WorkloadMonitor::setEventsProcessed(
    int value
) {

    events_processed =
        value;
}


// ==================================================
// SET SPIKES GENERATED
// ==================================================

void WorkloadMonitor::setSpikesGenerated(
    int value
) {

    spikes_generated =
        value;
}


// ==================================================
// SET NEURON UPDATES
// ==================================================

void WorkloadMonitor::setNeuronUpdates(
    int value
) {

    neuron_updates =
        value;
}


// ==================================================
// SET QUEUE OPERATIONS
// ==================================================

void WorkloadMonitor::setQueueOperations(
    std::size_t value
) {

    queue_operations =
        value;
}


// ==================================================
// SET OBSERVATION TIME
// ==================================================

void WorkloadMonitor::setObservationTime(
    double time
) {

    observation_time =
        time;
}


// ==================================================
// GET EVENTS PROCESSED
// ==================================================

int WorkloadMonitor::getEventsProcessed() const {

    return events_processed;
}


// ==================================================
// GET SPIKES GENERATED
// ==================================================

int WorkloadMonitor::getSpikesGenerated() const {

    return spikes_generated;
}


// ==================================================
// GET NEURON UPDATES
// ==================================================

int WorkloadMonitor::getNeuronUpdates() const {

    return neuron_updates;
}


// ==================================================
// GET QUEUE OPERATIONS
// ==================================================

std::size_t WorkloadMonitor::getQueueOperations() const {

    return queue_operations;
}


// ==================================================
// GET OBSERVATION TIME
// ==================================================

double WorkloadMonitor::getObservationTime() const {

    return observation_time;
}


// ==================================================
// GET SPIKE RATE
// ==================================================

double WorkloadMonitor::getSpikeRate() const {

    if (
        observation_time <= 0.0
    ) {

        return 0.0;
    }

    return
        spikes_generated /
        observation_time;
}


// ==================================================
// RESET
// ==================================================

void WorkloadMonitor::reset() {

    events_processed = 0;

    spikes_generated = 0;

    neuron_updates = 0;

    observation_time = 0.0;

    queue_operations = 0;
}