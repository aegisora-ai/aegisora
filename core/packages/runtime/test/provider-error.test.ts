import assert from "node:assert/strict";
import test from "node:test";

import { ProviderError } from "../src/errors/provider-error";

test("ProviderError is an instance of Error and ProviderError", () => {
  const error = new ProviderError("openai", "request failed");

  assert.ok(error instanceof Error);
  assert.ok(error instanceof ProviderError);
});

test("ProviderError sets name, provider, and message", () => {
  const provider = "anthropic";
  const message = "rate limit exceeded";
  const error = new ProviderError(provider, message);

  assert.equal(error.name, "ProviderError");
  assert.equal(error.provider, provider);
  assert.equal(error.message, message);
});
