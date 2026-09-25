package audit

import (
	"context"
	"encoding/json"
	"errors"
	"sync"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
)

type Sink interface {
	Append(context.Context, domain.AuditEvent) error
}

type MemorySink struct {
	mu       sync.RWMutex
	capacity int
	events   []domain.AuditEvent
}

func NewMemorySink(capacity int) (*MemorySink, error) {
	if capacity <= 0 {
		return nil, errors.New("audit capacity must be greater than zero")
	}

	return &MemorySink{capacity: capacity}, nil
}

func (sink *MemorySink) Append(_ context.Context, event domain.AuditEvent) error {
	sink.mu.Lock()
	defer sink.mu.Unlock()

	if len(sink.events) == sink.capacity {
		copy(sink.events, sink.events[1:])
		sink.events = sink.events[:sink.capacity-1]
	}
	sink.events = append(sink.events, cloneEvent(event))

	return nil
}

func (sink *MemorySink) Events() []domain.AuditEvent {
	sink.mu.RLock()
	defer sink.mu.RUnlock()

	events := make([]domain.AuditEvent, len(sink.events))
	for index, event := range sink.events {
		events[index] = cloneEvent(event)
	}
	return events
}

func cloneEvent(event domain.AuditEvent) domain.AuditEvent {
	cloned := event
	if event.Payload != nil {
		cloned.Payload = make(map[string]json.RawMessage, len(event.Payload))
		for key, value := range event.Payload {
			cloned.Payload[key] = append(json.RawMessage(nil), value...)
		}
	}
	return cloned
}
