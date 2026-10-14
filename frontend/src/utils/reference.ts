/**
 * Short human-facing code for a request.
 *
 * The API has no reference field, so the trailing digits of the id stand in
 * until it does. Never returns an empty string.
 */
export function referenceFor(id: string): string {
  const digits = id.match(/\d+/g);
  const last = digits?.[digits.length - 1];

  if (last !== undefined && last !== "") {
    return last;
  }

  const tail = id.slice(-4).toUpperCase();

  return tail === "" ? "--" : tail;
}
