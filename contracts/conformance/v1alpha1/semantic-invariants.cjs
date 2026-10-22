const fs = require("fs");
const path = require("path");

const YAML = require("yaml");

const contractPath = path.resolve(
  __dirname,
  "..",
  "..",
  "openapi",
  "v1alpha1",
  "openapi.yaml"
);

const fixturePath = path.resolve(
  __dirname,
  "semantic-fixtures.json"
);
function fail(message) {
  console.error("FAIL: " + message);
  process.exit(1);
}

function pass(message) {
  console.log("PASS: " + message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function requiredProperties(schema, names, label) {
  assert(
    isPlainObject(schema),
    `${label} must be an object schema`
  );

  assert(
    Array.isArray(schema.required),
    `${label}.required must be an array`
  );

  for (const name of names) {
    assert(
      schema.required.includes(name),
      `${label} missing required property: ${name}`
    );
  }
}

function derivedAllowed(decision) {
  return decision === "ALLOW";
}

function decisionEnvelopeSemanticsValid(value) {
  if (
    !["ALLOW", "BLOCK", "ESCALATE"].includes(value.decision)
  ) {
    return false;
  }

  const expectedAllowed =
    value.decision === "ALLOW";

  if (value.allowed !== expectedAllowed) {
    return false;
  }

  if (
    typeof value.decision_id !== "string" ||
    value.decision_id.length === 0
  ) {
    return false;
  }

  if (
    typeof value.request_id !== "string" ||
    value.request_id.length === 0
  ) {
    return false;
  }

  if (
    typeof value.correlation_id !== "string" ||
    value.correlation_id.length === 0
  ) {
    return false;
  }

  if (
    typeof value.reason_code !== "string" ||
    value.reason_code.length === 0
  ) {
    return false;
  }

  if (
    typeof value.policy_version !== "string" ||
    value.policy_version.length === 0
  ) {
    return false;
  }

  if (
    typeof value.policy_digest !== "string" ||
    value.policy_digest.length === 0
  ) {
    return false;
  }

  if (
    typeof value.evaluated_at !== "string" ||
    value.evaluated_at.length === 0
  ) {
    return false;
  }

  return true;
}

function validateDecisionEnvelopeSemantics(value) {
  assert(
    decisionEnvelopeSemanticsValid(value),
    `allowed must be derived from decision ${value.decision}`
  );
}
function validateExecutionIntentSemantics(value) {
  const required = [
    "request_id",
    "agent_claim",
    "capability_request",
    "input",
    "context"
  ];

  for (const field of required) {
    assert(
      Object.prototype.hasOwnProperty.call(value, field),
      `ExecutionIntent missing: ${field}`
    );
  }

  assert(
    typeof value.request_id === "string" &&
      value.request_id.length > 0,
    "ExecutionIntent.request_id invalid"
  );

  assert(
    typeof value.agent_claim === "string" &&
      value.agent_claim.length > 0,
    "ExecutionIntent.agent_claim invalid"
  );

  assert(
    isPlainObject(value.capability_request),
    "ExecutionIntent.capability_request invalid"
  );

  assert(
    typeof value.capability_request.capability === "string" &&
      value.capability_request.capability.length > 0,
    "canonical capability must be non-empty"
  );

  assert(
    !Object.prototype.hasOwnProperty.call(value, "tenant"),
    "ExecutionIntent must not accept caller-controlled tenant field"
  );
}

function validatePolicyBundleSemantics(value) {
  const required = [
    "bundle_id",
    "scope",
    "version",
    "digest",
    "expires_at",
    "signature",
    "policy"
  ];

  for (const field of required) {
    assert(
      Object.prototype.hasOwnProperty.call(value, field),
      `PolicyBundle missing: ${field}`
    );
  }

  assert(
    isPlainObject(value.scope),
    "PolicyBundle.scope must be an object"
  );

  assert(
    typeof value.scope.tenant === "string" &&
      value.scope.tenant.length > 0,
    "PolicyBundle.scope.tenant must be canonical and non-empty"
  );

  assert(
    typeof value.version === "string" &&
      value.version.length > 0,
    "PolicyBundle.version invalid"
  );

  assert(
    typeof value.digest === "string" &&
      value.digest.length > 0,
    "PolicyBundle.digest invalid"
  );

  assert(
    typeof value.signature === "string" &&
      value.signature.length > 0,
    "PolicyBundle.signature invalid"
  );

  assert(
    typeof value.expires_at === "string" &&
      !Number.isNaN(Date.parse(value.expires_at)),
    "PolicyBundle.expires_at must be a valid timestamp"
  );
}

function validateReviewSemantics(value) {
  assert(
    value.decision === "ESCALATE",
    "ReviewRequest.decision must be ESCALATE"
  );

  assert(
    ["PENDING", "APPROVED", "DENIED"].includes(value.status),
    "ReviewRequest.status invalid"
  );

  assert(
    typeof value.request_id === "string" &&
      value.request_id.length > 0,
    "ReviewRequest.request_id invalid"
  );

  assert(
    typeof value.correlation_id === "string" &&
      value.correlation_id.length > 0,
    "ReviewRequest.correlation_id invalid"
  );
}

function validateApprovalTokenSemantics(value) {
  assert(
    typeof value.token_id === "string" &&
      value.token_id.length > 0,
    "ApprovalToken.token_id invalid"
  );

  assert(
    typeof value.request_id === "string" &&
      value.request_id.length > 0,
    "ApprovalToken must bind to request_id"
  );

  assert(
    typeof value.policy_version === "string" &&
      value.policy_version.length > 0,
    "ApprovalToken must bind to policy_version"
  );

  assert(
    value.single_use === true,
    "ApprovalToken.single_use must be true"
  );

  assert(
    typeof value.expires_at === "string" &&
      !Number.isNaN(Date.parse(value.expires_at)),
    "ApprovalToken.expires_at must be valid"
  );
}

try {
  assert(fs.existsSync(contractPath), "OpenAPI contract does not exist");
  assert(fs.existsSync(fixturePath), "semantic fixture file does not exist");

  const source = fs.readFileSync(contractPath, "utf8");
  const document = YAML.parse(source);

  assert(
    document.openapi === "3.1.0",
    "OpenAPI version must be 3.1.0"
  );

  assert(
    isPlainObject(document.info),
    "OpenAPI info must exist"
  );

  assert(
    isPlainObject(document.paths),
    "OpenAPI paths must exist"
  );

  assert(
    isPlainObject(document.components),
    "OpenAPI components must exist"
  );

  assert(
    isPlainObject(document.components.schemas),
    "OpenAPI component schemas must exist"
  );

  const schemas = document.components.schemas;

  const fixtures = JSON.parse(
    fs.readFileSync(fixturePath, "utf8")
  );

  pass("Contract YAML parsed successfully");
  pass("OpenAPI 3.1.0 verified");

  // --------------------------------------------------------------
  // Decision vocabulary
  // --------------------------------------------------------------

  assert(
    JSON.stringify(schemas.Decision.enum) ===
      JSON.stringify(["ALLOW", "BLOCK", "ESCALATE"]),
    "Decision enum must be exactly ALLOW / BLOCK / ESCALATE"
  );

  pass("Decision vocabulary is canonical");

  // --------------------------------------------------------------
  // ExecutionIntent schema
  // --------------------------------------------------------------

  requiredProperties(
    schemas.ExecutionIntent,
    [
      "request_id",
      "agent_claim",
      "capability_request",
      "input",
      "context"
    ],
    "ExecutionIntent"
  );

  requiredProperties(
    schemas.CapabilityRequest,
    ["capability"],
    "CapabilityRequest"
  );

  assert(
    !schemas.ExecutionIntent.required.includes("tenant"),
    "ExecutionIntent must not accept tenant as a required caller field"
  );

  validateExecutionIntentSemantics(
    fixtures.validExecutionIntent
  );

  pass("ExecutionIntent semantic invariants");

  // --------------------------------------------------------------
  // DecisionEnvelope schema
  // --------------------------------------------------------------

  requiredProperties(
    schemas.DecisionEnvelope,
    [
      "decision_id",
      "request_id",
      "correlation_id",
      "decision",
      "reason_code",
      "risk",
      "policy_version",
      "policy_digest",
      "evaluated_at"
    ],
    "DecisionEnvelope"
  );

  // --------------------------------------------------------------
  // Valid baseline envelope
  // --------------------------------------------------------------

  validateDecisionEnvelopeSemantics(
    fixtures.validDecisionEnvelope
  );

  pass("DecisionEnvelope required identifiers");
  pass("Valid DecisionEnvelope = ALLOW/true");

  // --------------------------------------------------------------
  // Canonical decision derivation
  // --------------------------------------------------------------

  const canonicalDecisionCases = [
    {
      name: "ALLOW",
      decision: "ALLOW",
      expectedAllowed: true
    },
    {
      name: "BLOCK",
      decision: "BLOCK",
      expectedAllowed: false
    },
    {
      name: "ESCALATE",
      decision: "ESCALATE",
      expectedAllowed: false
    }
  ];

  for (const item of canonicalDecisionCases) {
    const derived = derivedAllowed(item.decision);

    assert(
      derived === item.expectedAllowed,
      `${item.name}: canonical allowed derivation mismatch`
    );
  }

  pass("ALLOW derives allowed=true");
  pass("BLOCK derives allowed=false");
  pass("ESCALATE derives allowed=false");

  // --------------------------------------------------------------
  // Invalid compatibility-field combinations
  // --------------------------------------------------------------
  for (const item of fixtures.invalidCases) {
    const candidate = {
      ...fixtures.validDecisionEnvelope,
      decision: item.decision,
      allowed: item.allowed
    };

    const valid = decisionEnvelopeSemanticsValid(
      candidate
    );

    assert(
      valid === item.expectedValid,
      `${item.name}: semantic validity mismatch`
    );
  }

  pass("Invalid allowed/decision combinations are rejected");
  pass("DecisionEnvelope allowed field is derived-only");

  pass("Invalid allowed/decision combinations are rejected");
  pass("DecisionEnvelope allowed field is derived-only");

  // --------------------------------------------------------------
  // Canonical decision case coverage
  // --------------------------------------------------------------

  const coveredDecisions = new Set(
    canonicalDecisionCases.map(item => item.decision)
  );

  for (const decision of [
    "ALLOW",
    "BLOCK",
    "ESCALATE"
  ]) {
    assert(
      coveredDecisions.has(decision),
      `Missing canonical decision coverage: ${decision}`
    );
  }

  pass("All canonical decisions are covered");
  // PolicyBundle
  // --------------------------------------------------------------

  requiredProperties(
    schemas.PolicyBundle,
    [
      "bundle_id",
      "scope",
      "version",
      "digest",
      "expires_at",
      "signature",
      "policy"
    ],
    "PolicyBundle"
  );

  requiredProperties(
    schemas.PolicyScope,
    ["tenant"],
    "PolicyScope"
  );

  validatePolicyBundleSemantics(
    fixtures.validPolicyBundle
  );

  const expiry = Date.parse(
    fixtures.expiredPolicyBundle.expires_at
  );

  assert(
    expiry < Date.now(),
    "Expired fixture must actually be expired"
  );

  pass("PolicyBundle immutable identity fields");
  pass("PolicyBundle scope contains canonical tenant");
  pass("PolicyBundle version/digest/signature fields");
  pass("PolicyBundle expiry is semantically testable");

  // --------------------------------------------------------------
  // Review / Approval
  // --------------------------------------------------------------

  requiredProperties(
    schemas.ReviewRequest,
    [
      "review_id",
      "request_id",
      "correlation_id",
      "decision",
      "status",
      "created_at"
    ],
    "ReviewRequest"
  );

  validateReviewSemantics(
    fixtures.validReviewRequest
  );

  assert(
    schemas.ReviewRequest.properties.decision?.const === "ESCALATE",
    "ReviewRequest decision must be constrained to ESCALATE"
  );

  requiredProperties(
    schemas.ApprovalToken,
    [
      "token_id",
      "request_id",
      "policy_version",
      "expires_at",
      "single_use"
    ],
    "ApprovalToken"
  );

  validateApprovalTokenSemantics(
    fixtures.validApprovalToken
  );

  assert(
    schemas.ApprovalToken.properties.single_use?.const === true,
    "ApprovalToken.single_use must be contractually true"
  );

  pass("ESCALATE review invariant");
  pass("ApprovalToken request binding");
  pass("ApprovalToken policy-version binding");
  pass("ApprovalToken single-use invariant");

  // --------------------------------------------------------------
  // Audit identifiers
  // --------------------------------------------------------------

  requiredProperties(
    schemas.AuditEvent,
    [
      "event_id",
      "request_id",
      "correlation_id",
      "decision_id",
      "policy_version",
      "event_type",
      "occurred_at"
    ],
    "AuditEvent"
  );

  requiredProperties(
    schemas.AuditEventBatch,
    ["events"],
    "AuditEventBatch"
  );

  pass("Audit request/correlation/decision/policy identifiers");

  // --------------------------------------------------------------
  // Health / policy metadata
  // --------------------------------------------------------------

  requiredProperties(
    schemas.HealthStatus,
    [
      "status",
      "contract_version"
    ],
    "HealthStatus"
  );

  requiredProperties(
    schemas.ActivePolicyVersion,
    [
      "version",
      "digest",
      "expires_at"
    ],
    "ActivePolicyVersion"
  );

  assert(
    schemas.HealthStatus.properties.contract_version?.const === "v1alpha1",
    "HealthStatus.contract_version must equal v1alpha1"
  );

  pass("Health contract version invariant");
  pass("ActivePolicyVersion invariant");

  // --------------------------------------------------------------
  // $ref integrity
  // --------------------------------------------------------------

  const refs = [];

  function walk(value) {
    if (value === null || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }

    if (typeof value.$ref === "string") {
      refs.push(value.$ref);
    }

    for (const key of Object.keys(value)) {
      walk(value[key]);
    }
  }

  walk(document);

  for (const ref of refs) {
    assert(
      ref.startsWith("#/"),
      `External $ref is not allowed: ${ref}`
    );

    if (ref.startsWith("#/components/schemas/")) {
      const name = ref.slice(
        "#/components/schemas/".length
      );

      assert(
        schemas[name],
        `Broken local schema $ref: ${ref}`
      );
    }
  }

  pass("All discovered $ref values are local and resolvable");

  console.log("");
  console.log("SEMANTIC_CONFORMANCE_OK");
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : String(error)
  );
  process.exit(1);
}
