#ifndef NEURON_H
#define NEURON_H

class Neuron {
private:
    double membrane_potential;
    double threshold;
    double reset_potential;

public:
    Neuron();

    void receiveInput(double input);

    bool update();

    double getPotential() const;

    // Restore membrane potential during
    // adaptive execution switching.
    void setPotential(double potential);

    void reset();
};

#endif