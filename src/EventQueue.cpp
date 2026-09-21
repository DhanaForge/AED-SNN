#include "EventQueue.h"
#include <stdexcept>

bool EventQueue::compareEvents(
    const Event& a,
    const Event& b
) {
    return a.time > b.time;
}

EventQueue::EventQueue()
    : queue(compareEvents) {
}

void EventQueue::push(const Event& event) {
    queue.push(event);
}

Event EventQueue::pop() {

    if (queue.empty()) {
        throw std::runtime_error(
            "Cannot pop from an empty event queue."
        );
    }

    Event event = queue.top();

    queue.pop();

    return event;
}

bool EventQueue::empty() const {
    return queue.empty();
}

size_t EventQueue::size() const {
    return queue.size();
}


// ==================================================
// GET ALL PENDING EVENTS
// ==================================================

std::vector<Event> EventQueue::getAllEvents() const {

    // Make a copy because reading a priority_queue
    // directly would modify the original queue.
    auto temporary_queue = queue;

    std::vector<Event> events;

    while (!temporary_queue.empty()) {

        events.push_back(
            temporary_queue.top()
        );

        temporary_queue.pop();
    }

    return events;
}


// ==================================================
// RESTORE PENDING EVENTS
// ==================================================

void EventQueue::setAllEvents(
    const std::vector<Event>& events
) {

    // Clear the existing queue first.
    while (!queue.empty()) {
        queue.pop();
    }

    // Insert restored events.
    for (const Event& event : events) {
        queue.push(event);
    }
}