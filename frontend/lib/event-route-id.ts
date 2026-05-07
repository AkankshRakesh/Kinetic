const EVENT_ROUTE_PREFIX = "evt_";
const EVENT_ID_MULTIPLIER = 7919;
const EVENT_ID_OFFSET = 104729;

export function encodeEventId(id: string | number): string {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return String(id);
  }

  return `${EVENT_ROUTE_PREFIX}${(numericId * EVENT_ID_MULTIPLIER + EVENT_ID_OFFSET).toString(36)}`;
}

export function decodeEventId(routeId?: string | string[] | null): string | null {
  const value = Array.isArray(routeId) ? routeId[0] : routeId;

  if (!value) {
    return null;
  }

  if (!value.startsWith(EVENT_ROUTE_PREFIX)) {
    return /^\d+$/.test(value) ? value : null;
  }

  const encoded = value.slice(EVENT_ROUTE_PREFIX.length);
  const decoded = Number.parseInt(encoded, 36);

  if (!Number.isFinite(decoded)) {
    return null;
  }

  const numericId = (decoded - EVENT_ID_OFFSET) / EVENT_ID_MULTIPLIER;

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  return String(numericId);
}
