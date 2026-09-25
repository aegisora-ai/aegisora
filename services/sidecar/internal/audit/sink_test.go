package audit

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
)

func TestMemorySinkIsBounded(t *testing.T) {
	sink, err := NewMemorySink(2)
	if err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"one", "two", "three"} {
		if err := sink.Append(context.Background(), domain.AuditEvent{EventID: id}); err != nil {
			t.Fatal(err)
		}
	}
	events := sink.Events()
	if len(events) != 2 || events[0].EventID != "two" || events[1].EventID != "three" {
		t.Fatalf("Events() = %#v", events)
	}
}

func TestMemorySinkIsolatesPayloads(t *testing.T) {
	sink, err := NewMemorySink(2)
	if err != nil {
		t.Fatal(err)
	}

	event := domain.AuditEvent{
		EventID: "event-1",
		Payload: map[string]json.RawMessage{
			"decision": json.RawMessage(`"ALLOW"`),
		},
	}
	if err := sink.Append(context.Background(), event); err != nil {
		t.Fatal(err)
	}

	event.Payload["decision"][1] = 'X'
	returned := sink.Events()
	returned[0].Payload["decision"][1] = 'Y'

	if got := string(sink.Events()[0].Payload["decision"]); got != `"ALLOW"` {
		t.Fatalf("stored payload = %s, want isolated original", got)
	}
}
