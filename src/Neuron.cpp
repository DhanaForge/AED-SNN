#include "Neuron.h"

Neuron::Neuron()
    : membrane_potential(0.0),
      threshold(1.0),
      reset_potential(0.0) {
}

void Neuron::receiveInput(double input) {
    membrane_potential += input;
}

bool Neuron::update() {
    if (membrane_potential >= threshold) {
        reset();
        return true;
    }

    return false;
}

double Neuron::getPotential() const {
    return membrane_potential;
}

void Neuron::setPotential(double potential) {
    membrane_potential = potential;
}

void Neuron::reset() {
    membrane_potential = reset_potential;
}