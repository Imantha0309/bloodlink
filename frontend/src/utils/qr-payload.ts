/**
 * The one place a BloodLink QR payload is written or read.
 *
 * Every code the app puts in a QR — an identity pass on a profile, an intake
 * ticket at the donor desk — is built here, and every scan is read back through
 * `decodeQrPayload`. Three screens used to parse these formats independently and
 * disagree: one accepted only the strict intake shape, one fell back to a literal
 * `"scanned"` token when a code had no colons, and one guessed at meaning from
 * `?donor=...&bloodGroup=...` query strings. A single strict decoder is what
 * stops that from drifting again.
 *
 * The wire format is deliberately opaque. A pass carries a random secret and
 * nothing else — no name, no blood group — because a QR is readable by any
 * camera pointed at it, and identity is something the server decides to reveal
 * after checking who is asking.
 *
 * ## Format
 *
 *     bloodlink-pass:v1:<secret>
 *     bloodlink-intake:v1:<requestId>:<secret>
 *
 * The `v1` segment is the format version, not part of the prefix, so a future
 * `v2` can be added without the v1 reader silently mis-reading it.
 */

const PASS_PREFIX = "bloodlink-pass";
const INTAKE_PREFIX = "bloodlink-intake";
const VERSION = "v1";

/** A person's identity pass, as shown on their profile. */
export type PassPayload = {
  kind: "pass";
  /** Opaque secret; only its hash is known to the server. */
  secret: string;
};

/** A single-use intake ticket for one donation, shown on the donor's phone. */
export type IntakePayload = {
  kind: "intake";
  requestId: string;
  /** Opaque secret; only its hash is known to the server. */
  secret: string;
};

export type BloodLinkPayload = PassPayload | IntakePayload;

/**
 * Secrets are hex UUIDs without dashes.
 *
 * Anything looser would let a colon sneak into a segment and change the split,
 * which is why the encoder refuses it rather than trusting the caller.
 */
const SECRET_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

/** Request ids are Mongo ObjectIds in practice; kept permissive but colon-free. */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Builds the payload shown as a user's identity pass. */
export function encodePass(secret: string): string {
  return `${PASS_PREFIX}:${VERSION}:${secret}`;
}

/** Builds the payload shown as a donor's intake ticket. */
export function encodeIntake(requestId: string, secret: string): string {
  return `${INTAKE_PREFIX}:${VERSION}:${requestId}:${secret}`;
}

/**
 * The secret from a pass payload, or null when the code is not a pass.
 *
 * Narrower than `decodeQrPayload` at the call sites that only care about a
 * profile pass, so a scan screen cannot accidentally read an intake ticket as
 * an identity.
 */
export function passSecretOf(raw: string): string | null {
  const payload = decodeQrPayload(raw);

  return payload?.kind === "pass" ? payload.secret : null;
}

/**
 * Reads a scanned code, or returns null when it is not one of ours.
 *
 * Strict on purpose. A truncated or unrelated code returns null so the caller can
 * say so, rather than the scan being quietly coerced into a valid-looking one —
 * the failure mode that let `donor-check-in-modal` invent a `"scanned"` token
 * and hand the server a check-in it would only reject later.
 *
 * Accepts the pre-v1 `bloodlink-intake:<requestId>:<secret>` spelling too,
 * because an intake ticket is valid for fifteen minutes and a donor who opened
 * one just before an update should still be able to walk through the desk.
 */
export function decodeQrPayload(raw: string): BloodLinkPayload | null {
  const value = raw.trim();

  if (value.length === 0) {
    return null;
  }

  const segments = value.split(":");

  if (segments.length < 3) {
    return null;
  }

  const [prefix, version, ...rest] = segments;

  // Pre-v1 intake: the request id sat where the version now does.
  if (prefix === INTAKE_PREFIX && version !== VERSION) {
    const legacyRequestId = version;
    const legacySecret = rest[0];

    if (rest.length !== 1 || !isSegment(legacyRequestId, REQUEST_ID_PATTERN) || !isSegment(legacySecret, SECRET_PATTERN)) {
      return null;
    }

    return { kind: "intake", requestId: legacyRequestId, secret: legacySecret };
  }

  if (version !== VERSION) {
    // A future format. Unknown on purpose — never guess at what we cannot read.
    return null;
  }

  if (prefix === PASS_PREFIX && rest.length === 1 && isSegment(rest[0], SECRET_PATTERN)) {
    return { kind: "pass", secret: rest[0] };
  }

  if (prefix === INTAKE_PREFIX && rest.length === 2 && isSegment(rest[0], REQUEST_ID_PATTERN) && isSegment(rest[1], SECRET_PATTERN)) {
    return { kind: "intake", requestId: rest[0], secret: rest[1] };
  }

  return null;
}

/** An intake payload, or null when the code is not an intake ticket. */
export function intakePayloadOf(raw: string): IntakePayload | null {
  const payload = decodeQrPayload(raw);

  return payload?.kind === "intake" ? payload : null;
}

function isSegment(value: string | undefined, pattern: RegExp): boolean {
  return value !== undefined && pattern.test(value);
}
