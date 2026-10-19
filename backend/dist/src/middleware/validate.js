"use strict";
/**
 * Request body, query and params parsing.
 *
 * A `Parser<T>` is anything with a `parse(input): T` method — which is all we
 * need from zod, without binding the codebase to a particular zod version's
 * generic signature. A parse failure throws, and `errorHandler` turns the
 * resulting `ZodError` into per-field messages.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
exports.validateBody = validateBody;
exports.query = query;
exports.param = param;
const http_1 = require("../http");
/** Parses and returns a value, letting a `ZodError` reach the error handler. */
function parse(parser, input) {
    return parser.parse(input);
}
/**
 * Replaces `req.body` with the parsed result, so handlers work with validated
 * and coerced values rather than the raw JSON.
 */
function validateBody(parser) {
    return (req, _res, next) => {
        try {
            req.body = parser.parse(req.body ?? {});
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/** Parses `req.query`, which is always strings (or arrays of them). */
function query(req, parser) {
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
function param(req, name) {
    const value = req.params[name];
    if (typeof value !== "string") {
        throw http_1.fail.notFound("That record could not be found.");
    }
    return value;
}
