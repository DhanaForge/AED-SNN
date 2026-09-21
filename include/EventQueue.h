#ifndef EVENT_QUEUE_H
#define EVENT_QUEUE_H

#include <queue>
#include <vector>

#include "Event.h"

class EventQueue {
private:
    std::priority_queue<
        Event,
        std::vector<Event>,
        bool (*)(const Event&, const Event&)
    > queue;

    static bool compareEvents(
        const Event& a,
        const Event& b
    );

public:
    EventQueue();

    void push(const Event& event);

    Event pop();

    bool empty() const;

    size_t size() const;

    // Export all pending events.
    std::vector<Event> getAllEvents() const;

    // Restore pending events.
    void setAllEvents(
        const std::vector<Event>& events
    );
};

#endif