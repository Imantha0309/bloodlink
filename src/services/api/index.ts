/**
 * Public surface of the API layer.
 */

export { request, type RequestOptions } from "./client";
export {
  ApiError,
  apiErrorMessage,
  isApiErrorCode,
  type ApiErrorCode,
} from "./errors";
