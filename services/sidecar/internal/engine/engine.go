package engine

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/audit"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/policy"
)

const (
	missingPolicyVersion = "none"
	missingPolicyDigest  = "sha256:none"
)

type PolicyProvider interface {
	Active(time.Time) (policy.Snapshot, bool)
}

type Clock func() time.Time
type IDSource func() string

type Options struct {
	Policies     PolicyProvider
	Audit        audit.Sink
	Clock        Clock
	IDs          IDSource
	CacheEntries int
}

type cachedDecision struct {
	intentDigest string
	envelope     domain.DecisionEnvelope
}

type requestLock struct {
	mu   sync.Mutex
	refs int
}

type Engine struct {
	policies PolicyProvider
	audit    audit.Sink
	clock    Clock
	ids      IDSource

	cacheMu      sync.Mutex
	cacheEntries int
	cache        map[string]cachedDecision
	cacheOrder   []string

	requestLocksMu sync.Mutex
	requestLocks   map[string]*requestLock
}

func New(options Options) (*Engine, error) {
	if options.Policies == nil {
		return nil, errors.New("policy provider is required")
	}
	if options.Audit == nil {
		return nil, errors.New("audit sink is required")
	}
	if options.Clock == nil {
		options.Clock = time.Now
	}
	if options.IDs == nil {
		options.IDs = randomID
	}
	if options.CacheEntries == 0 {
		options.CacheEntries = 10_000
	}
	if options.CacheEntries < 0 {
		return nil, errors.New("cache entries must not be negative")
	}
	return &Engine{
		policies:     options.Policies,
		audit:        options.Audit,
		clock:        options.Clock,
		ids:          options.IDs,
		cacheEntries: options.CacheEntries,
		cache:        make(map[string]cachedDecision),
		requestLocks: make(map[string]*requestLock),
	}, nil
}

func (engine *Engine) Evaluate(ctx context.Context, intent domain.ExecutionIntent) (domain.DecisionEnvelope, error) {
	now := engine.clock().UTC()
	correlationID := intent.CorrelationID
	if correlationID == "" {
		correlationID = engine.ids()
	}

	intentDigest, err := hashIntent(intent)
	if err != nil {
		return domain.DecisionEnvelope{}, fmt.Errorf("hash execution intent: %w", err)
	}
	if intent.RequestID != "" {
		release := engine.lockRequest(intent.RequestID)
		defer release()
	}
	snapshot, hasPolicy := engine.policies.Active(now)
	if intent.RequestID != "" {
		if cached, exists := engine.cached(intent.RequestID); exists {
			if cached.intentDigest != intentDigest {
				return engine.finish(ctx, intent, correlationID, snapshot, policy.Evaluation{
					Decision:   domain.DecisionBlock,
					ReasonCode: "REQUEST_ID_CONFLICT",
					Risk:       domain.Risk{Score: 100, Level: "HIGH"},
				}, now, hasPolicy)
			}
			if cacheMatchesPolicy(cached, snapshot, hasPolicy) {
				return cached.envelope, nil
			}
		}
	}

	if validationErr := intent.Validate(); validationErr != nil {
		envelope, finishErr := engine.finish(ctx, intent, correlationID, snapshot, policy.Evaluation{
			Decision:   domain.DecisionBlock,
			ReasonCode: "INVALID_EXECUTION_INTENT",
			Risk: domain.Risk{
				Score:   100,
				Level:   "HIGH",
				Signals: []string{validationErr.Error()},
			},
		}, now, hasPolicy)
		if finishErr == nil {
			engine.store(intent.RequestID, intentDigest, envelope)
		}
		return envelope, finishErr
	}

	if !hasPolicy {
		envelope, finishErr := engine.finish(ctx, intent, correlationID, policy.Snapshot{}, policy.Evaluation{
			Decision:   domain.DecisionBlock,
			ReasonCode: "POLICY_UNAVAILABLE",
			Risk:       domain.Risk{Score: 100, Level: "HIGH"},
		}, now, false)
		if finishErr == nil {
			engine.store(intent.RequestID, intentDigest, envelope)
		}
		return envelope, finishErr
	}

	evaluation := policy.Evaluate(snapshot, intent)
	envelope, finishErr := engine.finish(ctx, intent, correlationID, snapshot, evaluation, now, true)
	if finishErr == nil {
		engine.store(intent.RequestID, intentDigest, envelope)
	}
	return envelope, finishErr
}

func (engine *Engine) lockRequest(requestID string) func() {
	engine.requestLocksMu.Lock()
	lock := engine.requestLocks[requestID]
	if lock == nil {
		lock = &requestLock{}
		engine.requestLocks[requestID] = lock
	}
	lock.refs++
	engine.requestLocksMu.Unlock()

	lock.mu.Lock()
	return func() {
		lock.mu.Unlock()
		engine.requestLocksMu.Lock()
		lock.refs--
		if lock.refs == 0 {
			delete(engine.requestLocks, requestID)
		}
		engine.requestLocksMu.Unlock()
	}
}

func (engine *Engine) finish(
	ctx context.Context,
	intent domain.ExecutionIntent,
	correlationID string,
	snapshot policy.Snapshot,
	evaluation policy.Evaluation,
	now time.Time,
	hasPolicy bool,
) (domain.DecisionEnvelope, error) {
	version := missingPolicyVersion
	digest := missingPolicyDigest
	requestID := intent.RequestID
	if requestID == "" {
		requestID = "invalid:" + correlationID
	}
	if hasPolicy {
		version = snapshot.Bundle.Version
		digest = snapshot.Bundle.Digest
	}

	envelope := domain.NewDecisionEnvelope(
		engine.ids(),
		requestID,
		correlationID,
		evaluation.Decision,
		evaluation.ReasonCode,
		evaluation.Risk,
		version,
		digest,
		now,
	)
	if err := envelope.Validate(); err != nil {
		return domain.DecisionEnvelope{}, fmt.Errorf("invalid decision envelope: %w", err)
	}

	event := domain.AuditEvent{
		EventID:       engine.ids(),
		RequestID:     envelope.RequestID,
		CorrelationID: envelope.CorrelationID,
		DecisionID:    envelope.DecisionID,
		PolicyVersion: envelope.PolicyVersion,
		EventType:     "decision.evaluated",
		OccurredAt:    now,
	}
	if err := engine.audit.Append(ctx, event); err != nil {
		return domain.DecisionEnvelope{}, fmt.Errorf("append decision audit event: %w", err)
	}
	return envelope, nil
}

func (engine *Engine) cached(requestID string) (cachedDecision, bool) {
	engine.cacheMu.Lock()
	defer engine.cacheMu.Unlock()
	value, exists := engine.cache[requestID]
	value.envelope = cloneEnvelope(value.envelope)
	return value, exists
}

func (engine *Engine) store(requestID string, intentDigest string, envelope domain.DecisionEnvelope) {
	if requestID == "" || engine.cacheEntries == 0 {
		return
	}
	engine.cacheMu.Lock()
	defer engine.cacheMu.Unlock()
	value := cachedDecision{intentDigest: intentDigest, envelope: cloneEnvelope(envelope)}
	if _, exists := engine.cache[requestID]; exists {
		engine.cache[requestID] = value
		return
	}
	if len(engine.cacheOrder) == engine.cacheEntries {
		oldest := engine.cacheOrder[0]
		delete(engine.cache, oldest)
		engine.cacheOrder = engine.cacheOrder[1:]
	}
	engine.cache[requestID] = value
	engine.cacheOrder = append(engine.cacheOrder, requestID)
}

func cacheMatchesPolicy(cached cachedDecision, snapshot policy.Snapshot, hasPolicy bool) bool {
	if !hasPolicy {
		return cached.envelope.PolicyVersion == missingPolicyVersion &&
			cached.envelope.PolicyDigest == missingPolicyDigest
	}
	return cached.envelope.PolicyVersion == snapshot.Bundle.Version &&
		cached.envelope.PolicyDigest == snapshot.Bundle.Digest
}

func cloneEnvelope(envelope domain.DecisionEnvelope) domain.DecisionEnvelope {
	cloned := envelope
	cloned.Risk.Signals = append([]string(nil), envelope.Risk.Signals...)
	return cloned
}

func hashIntent(intent domain.ExecutionIntent) (string, error) {
	encoded, err := json.Marshal(intent)
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(encoded)
	return "sha256:" + hex.EncodeToString(sum[:]), nil
}

func randomID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		panic(fmt.Sprintf("generate secure identifier: %v", err))
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", bytes[0:4], bytes[4:6], bytes[6:8], bytes[8:10], bytes[10:16])
}
