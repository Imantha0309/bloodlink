/**
 * Request/response plumbing: typed failures, the async wrapper, and the single
 * error handler that turns anything thrown into the JSON error envelope.
 *
 * Every failure the app can act on carries an `ApiErrorCode`, so the client
 * never has to read a status code or parse a message to decide what happened.
 */

import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";

import type { ApiErrorCode } from "./codes";

/** The body shape every failure returns. */
export type ErrorEnvelope = {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
};

export class HttpError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string>;

  constructor(status: number, code: ApiErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  toEnvelope(): ErrorEnvelope {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.fields ? { fields: this.fields } : {}),
      },
    };
  }
}

/**
 * The failure constructors routes actually use.
 *
 * The default messages are the same copy the app shows, so a failure raised
 * without a specific explanation still reads as a sentence rather than a code.
 */
export const fail = {
  validation(message: string, fields?: Record<string, string>): HttpError {
    return new HttpError(422, "validation", message, fields);
  },

  unauthorized(message = "Your session has expired. Please sign in again."): HttpError {
    return new HttpError(401, "unauthorized", message);
  },

  invalidCredentials(message = "Incorrect email or password."): HttpError {
    return new HttpError(401, "invalid_credentials", message);
  },

  accountLocked(message = "This account is temporarily locked. Please try again later."): HttpError {
    return new HttpError(423, "account_locked", message);
  },

  notFound(message: string): HttpError {
    return new HttpError(404, "not_found", message);
  },

  /**
   * A rule that was understood but not allowed — an out-of-district bank, a
   * request another donor already took, a stage transition that isn't legal.
   * The message is shown verbatim, so it must be written for a person.
   */
  conflict(message: string): HttpError {
    return new HttpError(409, "conflict", message);
  },

  unknown(message = "Something went wrong. Please try again."): HttpError {
    return new HttpError(500, "unknown", message);
  },
};

/** Wraps an async route so a rejection reaches `errorHandler` instead of hanging. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}

/** Turns a Zod failure into per-field messages a form can attach to inputs. */
function fromZod(error: ZodError): HttpError {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";

    // First message per field wins — showing a field's second complaint as well
    // just makes the form harder to read.
    if (fields[key] === undefined) {
      fields[key] = issue.message;
    }
  }

  return fail.validation("Please check the highlighted fields.", fields);
}

/**
 * The last handler in the chain. Anything reaching here is either one of our
 * own failures or a bug — and a bug must not leak its stack to the client.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json(error.toEnvelope());
    return;
  }

  if (error instanceof ZodError) {
    const mapped = fromZod(error);
    res.status(mapped.status).json(mapped.toEnvelope());
    return;
  }

  // Duplicate-key races (the "one accepted donor" index is the one that
  // matters) surface as a driver error rather than a rule we checked.
  if (typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000) {
    const conflict = fail.conflict("That was already recorded by someone else.");
    res.status(conflict.status).json(conflict.toEnvelope());
    return;
  }

  console.error("[bloodlink] unhandled error:", error);

  const fallback = fail.unknown();
  res.status(fallback.status).json(fallback.toEnvelope());
}
