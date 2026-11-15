import assert from "node:assert/strict";
import test from "node:test";

import { AgentMemory, type MemoryEntry } from "../src/agent/memory";

function entry(id: string, content: string): MemoryEntry {
  return { id, content, createdAt: new Date("2026-01-01T00:00:00.000Z") };
}

test("add followed by all returns stored entries in insertion order", () => {
  const memory = new AgentMemory();
  const first = entry("1", "first memory");
  const second = entry("2", "second memory");

  memory.add(first);
  memory.add(second);

  assert.deepEqual(memory.all(), [first, second]);
});

test("search matches content as a case-insensitive substring", () => {
  const memory = new AgentMemory();
  const match = entry("1", "Hello World");
  const other = entry("2", "goodbye");

  memory.add(match);
  memory.add(other);

  assert.deepEqual(memory.search("WORLD"), [match]);
  assert.deepEqual(memory.search("hello"), [match]);
});

test("search returns an empty array when nothing matches", () => {
  const memory = new AgentMemory();
  memory.add(entry("1", "Hello World"));

  assert.deepEqual(memory.search("missing"), []);
});

test("clear empties the memory", () => {
  const memory = new AgentMemory();
  memory.add(entry("1", "first memory"));
  memory.add(entry("2", "second memory"));

  memory.clear();

  assert.deepEqual(memory.all(), []);
});
