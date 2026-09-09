import test from "node:test";
import assert from "node:assert/strict";

test(
  "Module 4 - incident API contract constants",
  () => {
    const severities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ];

    const statuses = [
      "OPEN",
      "ACKNOWLEDGED",
      "INVESTIGATING",
      "RESOLVED",
      "CLOSED",
    ];

    assert.deepEqual(
      severities,
      [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
      ],
    );

    assert.deepEqual(
      statuses,
      [
        "OPEN",
        "ACKNOWLEDGED",
        "INVESTIGATING",
        "RESOLVED",
        "CLOSED",
      ],
    );
  },
);
