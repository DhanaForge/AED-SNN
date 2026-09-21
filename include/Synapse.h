#ifndef SYNAPSE_H
#define SYNAPSE_H

struct Synapse {
    int source_neuron;
    int target_neuron;

    double weight;
    double delay;
};

#endif