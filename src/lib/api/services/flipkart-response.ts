/**
 * flipkart-response.ts
 *
 * Shared response guard for the Flipkart dashboard services (campaign summary + search terms).
 *
 * The backend sends plain JSON, but some Amazon endpoints arrive wrapped (`{ json: ... }`), so a
 * response is never trusted blindly. unwrapResponse() returns the object that contains ALL the keys
 * the UI reads, looking at the payload itself and at the common wrappers (`json`, `data`,
 * `data.json`). When nothing matches it THROWS an Error that names the missing keys and the keys it
 * received, so React Query reports `isError` (and the component shows its error state) instead of a
 * component crashing on `undefined`.
 *
 * Pass every top-level key the UI dereferences. Example: the KPI cards read `changes` as well as
 * `current_period`, so a backend that has not been updated to send `changes` is reported as
 * "missing key(s) changes" instead of crashing the cards.
 *
 * (flipkart-dashboard.service.ts still has its own private copy of this helper; it can import this one
 * the next time that file is touched.)
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function unwrapResponse<T>(payload: unknown, requiredKeys: string[], endpoint: string): T {
  const candidates: unknown[] = [payload];
  if (isRecord(payload)) {
    candidates.push(payload.json, payload.data);
    if (isRecord(payload.data)) candidates.push(payload.data.json);
  }

  for (const candidate of candidates) {
    if (isRecord(candidate) && requiredKeys.every((key) => candidate[key] != null)) {
      return candidate as T;
    }
  }

  // Describe the best candidate (the one with the most required keys) so the message says what is missing.
  const best = candidates
    .filter(isRecord)
    .sort(
      (a, b) =>
        requiredKeys.filter((k) => b[k] != null).length - requiredKeys.filter((k) => a[k] != null).length
    )[0];
  const received = best ? `[${Object.keys(best).join(", ")}]` : typeof payload;
  const missing = best ? requiredKeys.filter((k) => best[k] == null) : requiredKeys;
  console.error(`Unexpected response from ${endpoint}`, payload);
  throw new Error(
    `Unexpected response from ${endpoint}: missing key(s) ${missing.join(", ")}; received keys ${received}`
  );
}