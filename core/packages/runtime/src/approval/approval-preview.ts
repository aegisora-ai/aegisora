export interface RuntimeApprovalPreview {
  readonly resourceType?: string;
  readonly tool?: string;
  /** Clipped copy of the request input, safe to show to a human reviewer. */
  readonly input: unknown;
  /** True when anything was shortened or omitted. The reviewer has not seen the full request. */
  readonly truncated: boolean;
}

const MAX_STRING = 1000;
const MAX_ARRAY = 20;
const MAX_KEYS = 25;
const MAX_DEPTH = 4;
const MAX_NODES = 200;

interface ClipState {
  truncated: boolean;
  nodes: number;
}

function clipString(value: string, state: ClipState): string {
  if (value.length <= MAX_STRING) return value;
  state.truncated = true;
  return value.slice(0, MAX_STRING) + "...";
}

function clip(value: unknown, depth: number, state: ClipState): unknown {
  state.nodes += 1;
  if (state.nodes > MAX_NODES) {
    state.truncated = true;
    return "[truncated]";
  }
  if (value === null || value === undefined || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value === "string") return clipString(value, state);
  if (typeof value !== "object") return "[unsupported]";
  if (depth >= MAX_DEPTH) {
    state.truncated = true;
    return "[nested]";
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY) state.truncated = true;
    return value.slice(0, MAX_ARRAY).map((item) => clip(item, depth + 1, state));
  }
  const source = value as Record<string, unknown>;
  const keys = Object.keys(source);
  if (keys.length > MAX_KEYS) state.truncated = true;
  const out: Record<string, unknown> = {};
  for (const key of keys.slice(0, MAX_KEYS)) {
    out[key] = clip(source[key], depth + 1, state);
  }
  return out;
}

/** Builds a bounded, immutable-by-copy preview of an approval request. */
export function buildApprovalPreview(request: unknown): RuntimeApprovalPreview {
  const r = request && typeof request === "object" && !Array.isArray(request)
    ? (request as Record<string, unknown>)
    : {};
  const state: ClipState = { truncated: false, nodes: 0 };
  return {
    ...(typeof r.resourceType === "string" ? { resourceType: clipString(r.resourceType, state) } : {}),
    ...(typeof r.tool === "string" ? { tool: clipString(r.tool, state) } : {}),
    input: clip(r.input, 0, state),
    truncated: state.truncated,
  };
}