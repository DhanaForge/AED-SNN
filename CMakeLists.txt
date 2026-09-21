cmake_minimum_required(VERSION 3.15)

project(AED_SNN)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

add_executable(aed_snn
    src/main.cpp
    src/Neuron.cpp
    src/EventQueue.cpp
    src/EventDrivenEngine.cpp
    src/TimeDrivenEngine.cpp
    src/WorkloadMonitor.cpp
    src/AdaptiveController.cpp
    src/AdaptiveSimulator.cpp
)