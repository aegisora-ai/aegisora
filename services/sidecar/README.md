# Aegisora Go Sidecar

Go 1.27 implementation of the Aegisora `v1alpha1` local enforcement data plane.

The current vertical slice accepts an execution intent, validates it, evaluates an active signed policy bundle, records a correlated audit event, and returns exactly one canonical decision: `ALLOW`, `BLOCK`, or `ESCALATE`.

It is fail closed:

- no valid unexpired policy means `BLOCK` and readiness `503`;
- a caller cannot activate an unsigned, modified, or expired bundle;
- policy scope mismatch means `BLOCK`;
- duplicate request IDs return the original decision only when the intent is identical and the same policy version and digest remain active;
- an audit write failure prevents a successful decision response;
- `allowed` is always derived from `decision == ALLOW`.

This slice is an authorization and policy-evaluation service. It does not yet proxy an approved upstream call, persist audit events to disk, poll a FastAPI control plane, or authenticate the local workload transport. Those hard-boundary features are intentionally separate follow-up PRs.

## Request path

```text
POST /v1alpha1/execution/intent
        |
        +--> strict JSON, size, and contract validation
        +--> request-ID replay/conflict check
        +--> valid, unexpired, Ed25519-verified active bundle
        +--> tenant-scoped agent/capability policy evaluation
        +--> deny-overrides decision resolution
        +--> bounded correlated audit event
        |
        +--> ALLOW | BLOCK | ESCALATE
```

The sidecar implements the models in:

- `contracts/openapi/v1alpha1/openapi.yaml`
- `contracts/conformance/v1alpha1/semantic-fixtures.json`

Go tests load the shared semantic fixtures directly, so contract drift fails the sidecar build.

## Build and test

Run from this directory:

```bash
make fmt-check
make vet
make test
make test-race
make verify
make build VERSION=0.1.0 COMMIT="$(git rev-parse --short HEAD)"
make tools
```

The service and local policy tools are written to `bin/`, which is ignored by Git.

## Create and sign a local policy

Production signing belongs in the FastAPI control plane or a dedicated signing service. The local tools exist only for development and conformance testing.

Generate an Ed25519 key pair:

```bash
make tools
./bin/aegisora-policy-keygen > /tmp/aegisora-policy-keypair.json
```

The file contains base64-encoded `public_key` and `private_key` values. Keep the private key out of the repository. Export the private key, then sign the example bundle:

```bash
export AEGISORA_POLICY_PRIVATE_KEY="<private_key>"
./bin/aegisora-policy-sign \
  -bundle ./examples/policy-bundle.unsigned.json \
  > /tmp/aegisora-policy.signed.json
```

The digest covers the bundle ID, scope, version, expiry, and normalized policy document. The Ed25519 signature covers that digest. Editing any protected field after signing makes activation fail.

## Run with the signed policy

```bash
export AEGISORA_SIDECAR_POLICY_BUNDLE=/tmp/aegisora-policy.signed.json
export AEGISORA_SIDECAR_POLICY_PUBLIC_KEY="<public_key>"
make run
```

Submit the example intent from another terminal:

```bash
curl --fail-with-body \
  -H 'Content-Type: application/json' \
  --data-binary @./examples/intent-openai.json \
  http://127.0.0.1:8081/v1alpha1/execution/intent
```

The OpenAI rule returns an `ALLOW` envelope. Changing the provider to `anthropic` returns `ESCALATE`; any unmatched provider returns the default `BLOCK`.

## HTTP endpoints

| Endpoint | Behavior |
| --- | --- |
| `GET /healthz` | Operational liveness plus build metadata |
| `GET /readyz` | Compatibility readiness endpoint |
| `GET /v1alpha1/health` | Contract health response |
| `GET /v1alpha1/readiness` | `ready` only while an active bundle is valid and unexpired |
| `GET /v1alpha1/policies/active` | Active policy version, digest, and expiry |
| `POST /v1alpha1/execution/intent` | Strictly validate and evaluate an execution intent |

Malformed transport input returns an HTTP error. A valid execution intent always receives a decision envelope, including fail-closed policy outcomes.

## Configuration

| Environment variable | Default | Meaning |
| --- | --- | --- |
| `AEGISORA_SIDECAR_HTTP_ADDRESS` | `127.0.0.1:8081` | HTTP listener |
| `AEGISORA_SIDECAR_READ_HEADER_TIMEOUT` | `5s` | Header-read timeout |
| `AEGISORA_SIDECAR_READ_TIMEOUT` | `15s` | Total request-read timeout, including the body |
| `AEGISORA_SIDECAR_SHUTDOWN_TIMEOUT` | `10s` | Graceful-shutdown deadline |
| `AEGISORA_SIDECAR_MAX_BODY_BYTES` | `1048576` | Maximum execution-intent body size |
| `AEGISORA_SIDECAR_AUDIT_CAPACITY` | `10000` | In-memory bounded audit-event capacity |
| `AEGISORA_SIDECAR_DECISION_CACHE_SIZE` | `10000` | In-memory idempotency decision capacity |
| `AEGISORA_SIDECAR_POLICY_BUNDLE` | unset | Signed policy bundle JSON path |
| `AEGISORA_SIDECAR_POLICY_PUBLIC_KEY` | unset | Base64 Ed25519 verification key |

The policy path and public key must be configured together. Starting without both is allowed for liveness diagnostics, but the process remains not ready and governed requests fail closed.

## Policy dialect implemented by this slice

The OpenAPI contract intentionally leaves `PolicyBundle.policy` extensible. This sidecar currently compiles a deliberately small deterministic dialect:

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

Every match field is optional and acts as a wildcard when omitted. All matching rules are considered; precedence is `BLOCK > ESCALATE > ALLOW`. This deny-overrides rule prevents an earlier broad allow rule from defeating a narrower block rule.

## PR boundaries

Recommended follow-up slices:

1. Controlled upstream proxy and strict route allowlisting, proving zero upstream calls for `BLOCK` and `ESCALATE`.
2. Unix-domain-socket workload authentication and canonical identity derivation.
3. FastAPI bundle polling, public-key rotation, monotonic rollback protection, and last-known-good storage.
4. Durable audit WAL, idempotent batch delivery, and review-request creation.
5. TypeScript SDK distributed-mode client with no direct-execution fallback.

See [Repository Investigation](../../REPOSITORY_INVESTIGATION.md) and [Go Sidecar and FastAPI Control Plane](../../docs/architecture/go-sidecar-fastapi-control-plane.md) for the broader architecture and planned delivery slices.
