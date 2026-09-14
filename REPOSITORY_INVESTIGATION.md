# Repository Investigation: Go Enforcement Sidecar and FastAPI Control Plane

## Proposed issue title

`RFC/EPIC: Complete the Go enforcement sidecar and FastAPI governance control plane`

## Investigation verdict

**Proceed with the proposal, using the boundaries and delivery order in this document.**

The proposal remains correct after rebasing onto the latest upstream `main`, including Aegisora `2.0.0` and the subsequent delegation and collaboration hardening. The `v1alpha1` OpenAPI contract and semantic fixture corpus are unchanged from `v1.5.0`, so the Go implementation remains contract-compatible. Meanwhile, the TypeScript runtime now has a canonical tool authority, scoped single-use authorization receipts, explicit delegated-agent capabilities, stronger governance, correlation and collaboration boundaries, canonical decision/evidence records, and the first Go 1.27 sidecar vertical slice. These additions strengthen the proposal because there is now a real cross-language contract and a clearer runtime authority model around which the data plane and control plane can converge.

The important qualification is that the current Go service is a **decision sidecar**, not yet a complete **enforcement sidecar**. It validates an intent and safely returns `ALLOW`, `BLOCK`, or `ESCALATE`, but it cannot yet prevent a caller from ignoring that answer and calling an upstream directly. The next slice must add a controlled upstream proxy and deployment isolation before this can be called a hard enforcement boundary.

## Executive summary

Aegisora should use:

- a local **Go sidecar** as the low-latency enforcement/data plane;
- a **FastAPI service** as the identity, policy, review, and audit control plane;
- **PostgreSQL** as the authoritative durable store;
- the existing **TypeScript SDK/runtime** as the developer integration and agent-lifecycle layer;
- one versioned contract and semantic fixture corpus shared by every language.

The central security invariant is:

> No governed capability may cross the execution boundary until the canonical enforcement path has produced `ALLOW`, and neither `BLOCK` nor `ESCALATE` may cause an upstream side effect.

A decision endpoint alone does not enforce that invariant. The Go process must ultimately own the only reachable path to protected tool, provider, or API destinations.

## What was rechecked

The investigation was repeated against the post-`2.0.0` upstream `main`, covering:

- `contracts/openapi/v1alpha1/openapi.yaml` — cross-language wire contracts;
- `contracts/conformance/v1alpha1/semantic-fixtures.json` — semantic invariants;
- `core/packages/core` — canonical decision and evidence types;
- `core/packages/runtime` — identity, permissions, enforcement, execution, and finalization;
- `core/packages/audit` — canonical evidence persistence;
- `core/main.py` and `core/interceptor.py` — the Python/FastAPI prototype;
- `services/sidecar` — the Go 1.27 implementation and tests;
- CI and release workflows — required cross-language checks.

### Findings

1. **The control-plane/data-plane split is the right design.** FastAPI is a good home for management workflows and durable state. Go fits a small local process with bounded memory, explicit concurrency, predictable startup, and a narrow attack surface.
2. **The repository now owns a usable shared contract.** Work should extend `v1alpha1`, not invent another sidecar-specific request model.
3. **The TypeScript runtime has valuable canonical behavior.** Aegisora `2.0.0` establishes `ToolRegistry` as the single canonical runtime tool authority, uses scoped single-use authorization receipts, removes legacy runtime authority implementations, and locks down governance and correlation identity boundaries. The latest upstream hardening also adds expiring, revocable, single-use delegation capabilities with scope containment and enforces collaboration task ownership. These semantics should be migration inputs and conformance references, not silently duplicated with different meanings.
4. **The Python interceptor is a prototype, not a production data plane.** It trusts caller-provided tenant data, stores policy in memory, and returns a decision without controlling the downstream call. It should become the control plane instead of competing with Go for enforcement authority.
5. **Identity is the largest remaining security gap.** `agent_claim` is only a claim. The local transport must authenticate a workload, after which the sidecar derives or verifies canonical tenant/agent identity.
6. **The first Go slice is fail closed.** No policy, invalid signature, expiry, scope mismatch, malformed intent, request-ID conflict, and audit append failure cannot produce a successful allow response.
7. **Durability and hard enforcement remain open.** Audit and idempotency are bounded in-memory stores, policy is loaded from a local file, and `ALLOW` does not yet perform an upstream call.

## Current and target architecture

Today:

```text
TypeScript AgentRuntime
  -> in-process identity, permission, policy, security and risk
  -> canonical decision and evidence records
  -> current tool/provider adapters

Python FastAPI prototype
  -> in-memory tenant policy
  -> ALLOW/BLOCK response
  -> no durable authority or controlled execution path

Go 1.27 sidecar
  -> strict v1alpha1 intent decoding
  -> signed policy verification and atomic activation
  -> deterministic BLOCK > ESCALATE > ALLOW evaluation
  -> idempotent decision and bounded audit event
  -> no upstream proxy yet
```

Target:

```text
Agent / TypeScript SDK
          |
          | authenticated local execution intent
          v
+------------------------------------------------+
| Go sidecar                                    |
| workload identity -> canonical capability      |
| strict validation -> active policy snapshot    |
| permission/policy/security/risk evaluation     |
| audit intent + decision                        |
| controlled proxy only when decision == ALLOW   |
+----------------------+-------------------------+
                       |
             ALLOW     |     BLOCK / ESCALATE
                       |              |
                       v              v
              allowlisted upstream   no side effect

FastAPI control plane
  -> PostgreSQL tenants, identities and capabilities
  -> immutable policy versions and signed bundles
  -> sidecar registration and bundle distribution
  -> audit ingestion, evidence queries, and reviews
```

### Authority boundaries

- FastAPI is authoritative for desired identity, capability, policy, route, review, and revocation state.
- PostgreSQL is the durable system of record.
- A sidecar is authoritative for enforcing one verified snapshot for one request.
- The TypeScript SDK constructs intents but cannot assert trusted identity or override a sidecar decision.
- Request `input`, `context`, headers, and caller-provided tenant/agent values are untrusted.
- The website is a management client, never a runtime policy authority.
- Redis may accelerate disposable work but cannot be the only policy or evidence authority.

## Implemented Go 1.27 vertical slice

### Contract types and validation

The model follows the repository's `v1alpha1` contract:

```go
type ExecutionIntent struct {
    RequestID         string                     `json:"request_id"`
    CorrelationID     string                     `json:"correlation_id,omitempty"`
    AgentClaim        string                     `json:"agent_claim"`
    CapabilityRequest CapabilityRequest          `json:"capability_request"`
    Input             map[string]json.RawMessage `json:"input"`
    Context           map[string]json.RawMessage `json:"context"`
}

type Decision string

const (
    DecisionAllow    Decision = "ALLOW"
    DecisionBlock    Decision = "BLOCK"
    DecisionEscalate Decision = "ESCALATE"
)

func (decision Decision) Allowed() bool {
    return decision == DecisionAllow
}
```

`allowed` is constructed from `decision`; it is never independently treated as policy truth. This prevents an unsafe response such as `{"decision":"BLOCK","allowed":true}`.

The HTTP boundary requires JSON, limits body size, rejects unknown fields and trailing values, and validates string sizes plus required object fields before evaluation.

### Signed policy snapshots

Policy bundles are hashed and signed with Ed25519. The digest covers bundle ID, scope, version, expiry, and normalized policy:

```go
payload := struct {
    BundleID  string
    Scope     domain.PolicyScope
    Version   string
    ExpiresAt time.Time
    Policy    any
}{
    BundleID:  bundle.BundleID,
    Scope:     bundle.Scope,
    Version:   bundle.Version,
    ExpiresAt: bundle.ExpiresAt.UTC(),
    Policy:    normalizedPolicy,
}

encoded, _ := json.Marshal(payload)
sum := sha256.Sum256(encoded)
digest := "sha256:" + hex.EncodeToString(sum[:])
```

The sidecar receives only a public verification key. Production private-key custody belongs in the control plane or a dedicated signer. Changing any protected field after signing makes activation fail.

Activation compiles before acquiring the write lock and atomically swaps a deeply cloned snapshot. Readers see a complete old or new version, and callers cannot mutate live rules through returned slices, raw JSON buffers, or nested risk signals.

### Deterministic policy behavior

Every match field is optional and behaves as a wildcard. All matching rules are considered with this precedence:

```text
BLOCK > ESCALATE > ALLOW
```

Example:

```json
{
  "default_decision": "BLOCK",
  "rules": [
    {
      "agent_claim": "agent:demo",
      "capability": "provider.generate",
      "provider": "openai",
      "model": "gpt-test",
      "route": "/v1/chat/completions",
      "decision": "ALLOW",
      "reason_code": "OPENAI_ALLOWED",
      "risk": {
        "score": 10,
        "level": "LOW",
        "signals": []
      }
    }
  ]
}
```

A broad allow cannot defeat a narrower matching block merely because it appears first.

### Idempotent decisions

The engine hashes the canonical JSON intent and associates it with `request_id`:

```go
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
```

Calls sharing a request ID are serialized with a reference-counted keyed mutex. Concurrent identical calls receive the exact same decision and create one decision audit event while the active policy version and digest remain unchanged. A policy change, removal, or expiry forces reevaluation, so a cached `ALLOW` cannot survive loss of its authorizing policy. Reusing the ID for different input fails closed. Cached envelopes are deep-copied at the storage boundary so a caller cannot mutate stored risk signals. This cache is bounded and in memory, so proxy execution needs durable or upstream-aware idempotency before retries can span restarts.

### Audit correlation and readiness

Every successfully returned decision is paired with an audit event containing event, request, correlation, decision, and policy identifiers. The sink is currently a bounded in-memory ring. Events and their JSON payload bytes are copied both when appended and when read, preventing callers from mutating stored evidence through shared references. If append itself fails, the engine does not return a successful decision response. A durable write-ahead log and idempotent exporter remain required.

Liveness means the process serves diagnostics. Readiness means a valid, unexpired policy is active:

```text
no configured bundle -> health 200, readiness 503, evaluation BLOCK
valid signed bundle  -> readiness 200
expired bundle       -> readiness 503, evaluation BLOCK
```

## Request and response examples

```http
POST /v1alpha1/execution/intent HTTP/1.1
Content-Type: application/json

{
  "request_id": "req-01J8YQ8R7V",
  "correlation_id": "trace-01J8YQ8R7V",
  "agent_claim": "agent:demo",
  "capability_request": {
    "capability": "provider.generate",
    "provider": "openai",
    "model": "gpt-test",
    "route": "/v1/chat/completions"
  },
  "input": {},
  "context": {}
}
```

```json
{
  "decision_id": "8d01dfee-58c5-43ec-a0c3-d2ba5b05e999",
  "request_id": "req-01J8YQ8R7V",
  "correlation_id": "trace-01J8YQ8R7V",
  "decision": "ALLOW",
  "allowed": true,
  "reason_code": "OPENAI_ALLOWED",
  "risk": {"score": 10, "level": "LOW"},
  "policy_version": "42",
  "policy_digest": "sha256:8a5f...",
  "evaluated_at": "2026-08-29T12:00:00Z"
}
```

A syntactically valid intent receives a decision envelope even when blocked. Transport/schema failures receive an HTTP error. This separates policy outcomes from malformed network input.

## Required next slice: controlled upstream proxy

This is the next priority because it turns advice into enforcement. The proxy must:

1. Resolve upstreams only from signed policy and trusted configuration.
2. Reject arbitrary caller-provided URLs, hosts, schemes, and redirect targets.
3. Authenticate and validate the workload before evaluation.
4. Use one immutable policy snapshot for evaluation and route selection.
5. Create audit evidence before or around execution as required by policy.
6. Make zero upstream requests for `BLOCK`, `ESCALATE`, malformed input, expired policy, or unknown identity/capability/route.
7. Apply explicit connect, header, body, response, and total deadlines.
8. Define redirect, streaming, cancellation, retry, and response-size behavior.
9. Bind retries to idempotency so ambiguous failures cannot duplicate side effects.
10. Be deployed so the workload cannot directly reach the protected destination.

The critical adversarial test uses a counting upstream:

```go
var upstreamCalls atomic.Int64

upstream := httptest.NewServer(http.HandlerFunc(
    func(w http.ResponseWriter, r *http.Request) {
        upstreamCalls.Add(1)
        w.WriteHeader(http.StatusOK)
    },
))

// ALLOW increments once.
// BLOCK, ESCALATE, bad policy, identity mismatch, and route mismatch
// leave upstreamCalls unchanged.
```

Passing that test is necessary but not sufficient: deployment/network policy must prevent direct access around the proxy.

## FastAPI control-plane scope

FastAPI owns management state and workflows, not the synchronous hot path for every action. It must:

- authenticate operators and sidecars separately and enforce tenant-aware RBAC;
- manage tenants, workload identities, agents, capabilities, models, and routes;
- validate policies and compile a normalized sidecar representation;
- persist immutable policy versions in PostgreSQL;
- hash, sign, publish, revoke, and intentionally roll back bundles;
- serve updates with authenticated conditional polling initially;
- rotate signing keys without an unverified transition window;
- ingest idempotent audit batches and expose evidence queries;
- persist escalation requests and reviewer actions;
- issue short-lived, single-use approval tokens bound to the original intent digest, identity, capability, policy version, and expiry.

It may provide a reference evaluator for conformance, but should not be a required network hop for deterministic local rules.

## Human-review semantics

`ESCALATE` means “do not execute yet,” not “allow and notify.”

1. The sidecar records the escalation and original intent digest.
2. FastAPI creates a tenant-scoped pending review.
3. An authorized reviewer approves or denies it.
4. Approval issues a short-lived, single-use token bound to the exact intent and policy version.
5. The client resubmits through the sidecar.
6. The sidecar validates the token and rechecks non-overridable safety rules.

Approval never directly invokes the upstream or bypasses the sidecar.

## Failure semantics

| Condition | Required behavior |
| --- | --- |
| No policy loaded | not ready; `BLOCK` execution |
| Control plane unavailable with valid unexpired snapshot | continue last-known-good and report degraded state |
| Snapshot expired, malformed, incompatible, or unverifiable | fail closed |
| Unknown workload identity or capability/route | `BLOCK` and audit |
| Required remote analysis unavailable | explicit `BLOCK` or `ESCALATE`; never implicit allow |
| Duplicate ID with identical intent | return the compatible original result |
| Duplicate ID with different intent | conflict/`BLOCK` and audit |
| Audit export unavailable | retain locally within a configured durable bound |
| Required durability unavailable for high-impact action | fail closed according to policy |
| Sidecar unavailable | SDK returns enforcement unavailable; no direct fallback |
| Unexpected older policy | reject unless authenticated rollback authorizes it |

## Security requirements

- Prefer a filesystem-permissioned Unix domain socket for the local API.
- Bind loopback TCP only when explicitly configured and secure it independently.
- Use mTLS between sidecars and the control plane.
- Derive tenant/workload identity from credentials or pinned configuration.
- Treat `agent_claim` as a claim that must match canonical identity.
- Prevent metadata from overriding trusted provider, model, route, or policy fields.
- Source destinations from signed configuration and constrain redirects/DNS behavior.
- Redact credentials and sensitive input from logs and evidence.
- Support key rotation, revocation, and intentional rollback.
- Bind approvals to one intent and prevent replay.
- Bound request/response size, decompression, concurrency, rate, and deadlines.
- Preserve request, correlation, decision, evidence, and policy identifiers end to end.

## Proposed PR sequence

### PR 1 — Go decision-sidecar foundation

Status: implemented on the current feature branch.

- Go 1.27 service and container build;
- `v1alpha1` types and strict decoding;
- all three decisions and deny-overrides evaluation;
- signed bundle verification and atomic activation;
- idempotent decisions and bounded audit;
- readiness and active-policy metadata;
- shared-fixture, integration, and race tests;
- CI/release validation and local signing tools.

### PR 2 — Controlled proxy and no-side-effect proof

- signed/pinned upstream route table;
- controlled execute/proxy endpoint;
- redirect, timeout, cancellation, streaming, and size policy;
- counting-upstream adversarial tests;
- deployment proof that protected upstreams are isolated.

### PR 3 — Workload identity

- Unix-domain-socket transport by default;
- peer or pinned workload authentication;
- canonical tenant/agent resolution;
- claim-mismatch and metadata-confusion tests.

This can be combined with PR 2 if identity is required to define the proxy API cleanly, while remaining a separately reviewable concern in code.

### PR 4 — Control-plane policy distribution

- authenticated FastAPI bundle endpoint;
- conditional polling with bounded backoff;
- monotonic version and authorized rollback rules;
- key rotation/revocation;
- atomic last-known-good persistence and outage tests.

### PR 5 — Durable audit and escalation

- local write-ahead log and idempotent batches;
- persistent review state;
- request-bound single-use approval tokens;
- restart, replay, and partial-delivery tests.

### PR 6 — TypeScript distributed mode

- typed sidecar client and correlation propagation;
- clear blocked/escalated/unavailable errors;
- no direct fallback in distributed mode;
- cross-language end-to-end conformance.

## Epic acceptance criteria

- [ ] One OpenAPI contract validates Python, Go, and TypeScript models.
- [ ] Shared semantic fixtures fail CI on implementation drift.
- [x] Go verifies and atomically activates a scoped, signed, expiring bundle.
- [x] Go returns all three decisions with correlation and policy evidence.
- [x] Missing/invalid/expired policy and scope mismatch fail closed.
- [x] Concurrent identical IDs produce one stable decision and audit event.
- [ ] Only `ALLOW` reaches a controlled test upstream.
- [ ] Deployment prevents direct workload access to that upstream.
- [ ] Workload and operator identities are authenticated independently.
- [ ] FastAPI stores immutable policies and authoritative state in PostgreSQL.
- [ ] Policy polling tolerates outage only while last-known-good remains valid.
- [ ] Audit delivery is durable and idempotent across restart/outage.
- [ ] Approved escalations are single-use, expire, and return through the sidecar.
- [ ] TypeScript cannot silently bypass distributed enforcement.
- [ ] mTLS, RBAC, key lifecycle, redaction, route allowlisting, limits, and rollback are validated.
- [ ] Latency, throughput, and failure benchmarks are documented.

## Non-goals for the first enforcement release

- a general-purpose service mesh;
- transparent interception of every network protocol;
- a new unrestricted policy language;
- arbitrary sidecar plugins;
- multi-region active/active control plane;
- a production administration UI;
- optimization without representative profiling.

## Final proposal verdict

The proposal fits the updated repository provided these distinctions remain explicit:

1. the implemented Go slice makes trustworthy decisions but does not yet own side effects;
2. authenticated workload identity and controlled routing are required, not optional hardening;
3. FastAPI owns governance state/publication, while Go enforces a verified snapshot;
4. TypeScript remains the integration layer and cannot fall back to direct execution;
5. one contract, fixture corpus, and decision vocabulary govern all implementations.

The recommended immediate continuation is PR 2: controlled upstream proxying plus adversarial proof that every non-`ALLOW` path produces zero upstream calls.
