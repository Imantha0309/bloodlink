/**
 * Wraps an async route handler so a rejected promise reaches Express's error
 * middleware. Express 4 does not forward async rejections on its own, and an
 * unhandled one would crash the process instead of returning a 500.
 */

import type { NextFunction, Request, RequestHandler, Response } from "express";

export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}
