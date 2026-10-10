/**
 * Request body, query and params parsing.
 *
 * A `Parser<T>` is anything with a `parse(input): T` method — which is all we
 * need from zod, without binding the codebase to a particular zod version's
 * generic signature. A parse failure throws, and `errorHandler` turns the
 * resulting `ZodError` into per-field messages.
 */

import type { Request, RequestHandler } from "express";

import { fail } from "../http";

export type Parser<T> = { parse(input: unknown): T };

/** Parses and returns a value, letting a `ZodError` reach the error handler. */
export function parse<T>(parser: Parser<T>, input: unknown): T {
  return parser.parse(input);
}

/**
 * Replaces `req.body` with the parsed result, so handlers work with validated
 * and coerced values rather than the raw JSON.
 */
export function validateBody<T>(parser: Parser<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = parser.parse(req.body ?? {});
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Parses `req.query`, which is always strings (or arrays of them). */
export function query<T>(req: Request, parser: Parser<T>): T {
  return parser.parse(req.query);
}

/**
 * Reads one route parameter as a single string.
 *
 * Express types every param as `string | string[]` because a wildcard route can
 * capture the same name more than once. None of our routes do that, so an array
 * means the URL repeated the segment — the same situation as a name that does
 * not exist, and it is reported that way rather than passed on as a half-read id.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string") {
    throw fail.notFound("That record could not be found.");
  }

  return value;
}
