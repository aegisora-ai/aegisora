import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifiedApprover {
  readonly actorId: string;
  /** Expiry as epoch milliseconds. */
  readonly expiresAt: number;
}

/** Turns a credential presented by an approval UI into a verified approver identity. */
export interface ApproverVerifier {
  verify(credential: string): VerifiedApprover;
}

export interface HmacApproverVerifierOptions {
  /** Shared secret, at least 32 characters. Keep it out of the agent process where possible. */
  readonly secret: string;
  /** When set, only these actors can be issued or verified. */
  readonly allowedActors?: readonly string[];
  /** Clock, epoch milliseconds. Defaults to Date.now. */
  readonly now?: () => number;
}

export interface HmacApproverVerifier extends ApproverVerifier {
  /** Issues a signed, expiring credential for an approver. */
  issue(actorId: string, ttlMs?: number): string;
}

const MIN_SECRET_LENGTH = 32;
const DEFAULT_TTL_MS = 15 * 60 * 1000;
const MAX_TTL_MS = 24 * 60 * 60 * 1000;
const INVALID = "Approver credential is invalid or expired.";

function validActor(actorId: unknown): actorId is string {
  return typeof actorId === "string" && actorId.length > 0 && actorId.length <= 128 && actorId.trim() === actorId;
}

/**
 * HMAC-SHA256 signed approver credentials: base64url(payload).base64url(signature).
 * A credential is valid until it expires (it is not single-use), so keep the TTL short.
 * For SSO/OIDC, implement ApproverVerifier yourself and map the verified token to an actorId.
 */
export function createHmacApproverVerifier(options: HmacApproverVerifierOptions): HmacApproverVerifier {
  if (!options || typeof options.secret !== "string" || options.secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`secret must be a string of at least ${MIN_SECRET_LENGTH} characters.`);
  }
  const secret = options.secret;
  const now = options.now ?? Date.now;
  const allowed = options.allowedActors ? new Set(options.allowedActors) : undefined;

  const sign = (data: string): Buffer => createHmac("sha256", secret).update(data).digest();

  const verifier: HmacApproverVerifier = {
    issue(actorId: string, ttlMs: number = DEFAULT_TTL_MS): string {
      if (!validActor(actorId)) {
        throw new Error("actorId must be a non-empty string without surrounding whitespace (max 128 characters).");
      }
      if (!Number.isFinite(ttlMs) || ttlMs <= 0 || ttlMs > MAX_TTL_MS) {
        throw new Error("ttlMs must be a positive number of at most 24 hours.");
      }
      if (allowed && !allowed.has(actorId)) {
        throw new Error("Actor is not an allowed approver.");
      }
      const issuedAt = now();
      const payload = Buffer.from(JSON.stringify({ sub: actorId, iat: issuedAt, exp: issuedAt + ttlMs })).toString("base64url");
      return payload + "." + sign(payload).toString("base64url");
    },

    verify(credential: string): VerifiedApprover {
      if (typeof credential !== "string" || credential.length === 0 || credential.length > 2048) {
        throw new Error(INVALID);
      }
      const parts = credential.split(".");
      const payload = parts[0];
      const signature = parts[1];
      if (parts.length !== 2 || payload === undefined || signature === undefined) throw new Error(INVALID);

      const expected = sign(payload);
      const given = Buffer.from(signature, "base64url");
      if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new Error(INVALID);

      let claims: unknown;
      try {
        claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      } catch {
        throw new Error(INVALID);
      }
      const c = claims as { sub?: unknown; exp?: unknown } | null;
      if (!c || typeof c !== "object" || !validActor(c.sub) || typeof c.exp !== "number" || !Number.isFinite(c.exp)) {
        throw new Error(INVALID);
      }
      if (c.exp <= now()) throw new Error(INVALID);
      if (allowed && !allowed.has(c.sub)) throw new Error(INVALID);
      return { actorId: c.sub, expiresAt: c.exp };
    },
  };
  return Object.freeze(verifier);
}