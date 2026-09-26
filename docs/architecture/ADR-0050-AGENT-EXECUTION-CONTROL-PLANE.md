# ADR-0050 - Agent Execution Control Plane

## Status

Proposed

## Date

2026-09-26

## Context

Aegisora v4.0 established Execution Continuity with Continuity Seal.

Aegisora v5.0 introduces the Agent Execution Control Plane.

The repository already contains multiple mature enterprise building blocks:

- Agent Fleet
- Enterprise Identity
- Authority and delegation
- Policy registry and lifecycle
- Policy simulation and shadow evaluation
- Control and Decision
- Enterprise Approvals
- Continuity Seal
- Evidence and Audit
- Incident and Containment

The v5.0 objective is therefore not to replace these systems with a second architecture.

The objective is to establish one canonical domain model and one authoritative relationship between these existing capabilities.

## Decision

Aegisora v5.0 adopts the following canonical execution model:

AGENT
  ->
IDENTITY
  ->
AUTHORITY
  ->
POLICY
  ->
SIMULATION
  ->
RISK
  ->
DECISION
  ->
APPROVAL
  ->
CONTINUITY
  ->
ENFORCEMENT
  ->
EXECUTION
  ->
EFFECT
  ->
EVIDENCE
  ->
INVESTIGATION

These are logical domain boundaries.

They do not require every boundary to become a separate service or database.

## Canonical Ownership

### Tenant / Workspace

The authenticated server-side workspace context is authoritative.

Caller supplied metadata must never redefine:

- tenant
- workspace
- agent identity
- capability ownership
- provider ownership
- route ownership

Workspace isolation remains a mandatory security boundary.

### Agent

The canonical Agent represents the governed workload.

An Agent includes:

- stable agent ID
- workspace ID
- lifecycle state
- owner
- environment
- declared capabilities
- declared tools
- declared providers
- last observed state

Existing Agent Fleet types remain the implementation source.

The control plane must expose a canonical read model rather than creating a second agent registry.

### Identity

Identity binds an authenticated workload or principal to a canonical Agent.

Identity resolution must establish:

- workspace
- agent
- authentication method
- principal
- lifecycle status
- identity version

Identity supplied by the caller is a claim.

Canonical identity is resolved and verified by trusted system state.

### Authority

Authority represents what an agent is allowed to invoke.

Authority may include:

- capabilities
- tools
- resources
- providers
- models
- routes
- delegated authority
- workspace boundaries

The effective authority used for a decision must be representable as a stable snapshot or fingerprint.

A later authority mutation must not silently rewrite the authority context of an already authorized execution.

### Policy

Policy determines governance rules applied to an execution intent.

Policy references must include:

- policy ID
- policy version
- policy digest
- lifecycle state
- effective time
- expiry where applicable

Policy versions are immutable.

The active policy used by runtime enforcement must be identifiable from the resulting decision.

The existing policy registry and lifecycle engine remain authoritative implementation components.

### Simulation

Simulation evaluates hypothetical policy or authority state without mutating runtime enforcement state.

Simulation must reuse canonical governance semantics.

The result must be distinguishable from an enforced runtime decision.

No simulation result may itself grant execution authority.

### Risk

Risk represents the security assessment associated with an execution intent.

Risk must remain correlated with:

- request
- agent
- authority context
- policy version
- decision

Risk is an input to governance, not a replacement for policy or enforcement.

### Decision

Decision is the authoritative governance outcome:

- ALLOW
- BLOCK
- ESCALATE

A canonical decision must contain enough immutable context to explain why the runtime reached the outcome.

At minimum:

- decision ID
- request ID
- correlation ID
- agent ID
- decision
- reason code
- risk result
- policy reference
- authority reference or fingerprint
- evaluation timestamp

If an `allowed` compatibility field exists, it must be derived from `decision`.

### Approval

Approval resolves an ESCALATE decision.

An approval must remain bound to the original execution intent.

Approval state must include:

- approval ID
- request ID
- decision ID
- agent ID
- policy version
- authority fingerprint
- expiry
- approver
- resolution state
- single-use consumption state

Approval never bypasses runtime enforcement.

An approved request returns through the runtime enforcement boundary.

### Continuity

Continuity proves that an execution remains bound to the authorization that produced it.

Continuity must remain correlated with:

- execution ID
- authorization or decision identity
- policy version
- authority context
- approval where applicable
- request correlation

Continuity Seal remains the runtime primitive for this boundary.

### Enforcement

Runtime is the final enforcement authority.

The canonical decision is not sufficient to cause a side effect unless the runtime enforcement boundary accepts it.

Required invariant:

BLOCK and ESCALATE do not reach protected upstream systems.

Control-plane failure must not create a direct-execution bypass.

### Execution

Execution represents the actual side-effecting operation after enforcement.

Execution must carry stable identity and correlation with:

- request
- decision
- authorization
- continuity
- agent
- provider/tool route

Execution state must be observable independently of the original request.

### Effect

Effect represents what actually happened at the protected boundary.

The system must distinguish:

- intended action
- authorized action
- attempted action
- actual effect

Where reconciliation is possible, effect state must be correlated with execution identity.

### Evidence

Evidence provides durable proof of governance and execution.

Evidence must allow reconstruction of:

EVENT
  ->
TRACE
  ->
DECISION
  ->
AUTHORIZATION
  ->
CONTINUITY
  ->
EXECUTION
  ->
EFFECT

Evidence must retain stable identifiers rather than depending on UI-specific references.

### Investigation

Investigation is an operator-facing reconstruction of the canonical event chain.

Investigation must not invent a separate security model.

It consumes the canonical evidence graph.

Incident investigation must be able to navigate from incident to evidence, execution, decision, policy, authority, and agent.

## Control Plane vs Runtime Data Plane

The control plane owns durable organizational state.

The runtime data plane owns latency-sensitive enforcement.

CONTROL PLANE

- agents
- identities
- authority
- policies
- simulation
- risk configuration
- approvals
- incidents
- evidence
- audit

RUNTIME DATA PLANE

- identity validation
- policy enforcement
- continuity validation
- execution boundary
- local evidence production

The control plane must not become a normal per-request database dependency.

Runtime must operate from validated local state or an explicitly defined last-known-good policy state.

## Contract Evolution

Aegisora already contains:

contracts/openapi/v1alpha1/
contracts/conformance/v1alpha1/

These remain the contract baseline.

v5.0 must evolve the existing contract rather than create a parallel incompatible v1alpha1 contract tree.

Cross-language implementations must converge on the same:

- decision vocabulary
- execution intent semantics
- identity semantics
- policy reference semantics
- approval binding
- audit identifiers
- failure behavior

Go, TypeScript, and Python implementations must not independently redefine governance semantics.

## Existing Implementation Mapping

| Canonical Domain | Existing Foundation |
| --- | --- |
| Agent | enterprise/agents |
| Identity | enterprise/identity |
| Authority | delegation, transitive authority, blast radius |
| Policy | enterprise/policies |
| Simulation | policy simulator and compromise simulation |
| Risk | enterprise risk |
| Decision | enterprise/control |
| Approval | enterprise/approvals |
| Continuity | continuity-seal |
| Enforcement | runtime execution boundary |
| Evidence | enterprise/evidence and audit |
| Incident | incident and containment systems |

The canonical layer should compose these capabilities.

It should not duplicate them.

## Non-Goals

This ADR does not:

- create a second policy engine
- create a second identity registry
- move runtime enforcement into the control plane
- add a database dependency to the execution hot path
- redesign the dashboard
- replace existing v4.0 security primitives
- define global infrastructure implementation details

## Phase A Exit Criteria

Phase A is complete when:

- canonical identifiers are defined
- domain ownership is explicit
- authority context can be represented immutably
- policy references are versioned
- decision envelopes are stable
- approval binding is explicit
- continuity binding is explicit
- evidence correlation is explicit
- control-plane/data-plane trust boundaries are explicit
- existing modules have one canonical integration direction
- no second competing governance engine is introduced

## Consequence

Future v5.0 features must integrate into this model.

A new feature is not considered part of the control plane merely because it has a UI page.

A control-plane capability must produce or consume canonical state that participates in the governed execution chain.

The primary architectural objective is one authoritative execution graph across the organization.