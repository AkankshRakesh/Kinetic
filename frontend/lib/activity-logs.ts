/**
 * Session-based activity logging using localStorage.
 * Logs are scoped to the current auth token and cleared on sign out.
 */

export interface SessionActivityLog {
  id: string;
  action: string;
  description: string;
  metadata?: Record<string, string | number | boolean | undefined>;
  timestamp: number; // milliseconds since epoch
}

const STORAGE_KEY = "event_activity_logs";
const AUTH_SESSION_KEY = "kinetic.auth.session";

export const ACTIVITY_LOGS_UPDATED_EVENT = "event_activity_logs_updated";

type SessionLogStore = Record<string, Record<string, SessionActivityLog[]>>;

function getSessionLogKey(): string {
  if (typeof window === "undefined") {
    return "anonymous";
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!rawSession) {
      return "anonymous";
    }

    const session = JSON.parse(rawSession) as {
      accessToken?: string;
      user?: {
        id?: string | number;
        email?: string;
      };
    };

    if (session.accessToken) {
      return `token:${session.accessToken}`;
    }

    if (session.user?.id) {
      return `user:${session.user.id}`;
    }

    if (session.user?.email) {
      return `email:${session.user.email.toLowerCase()}`;
    }
  } catch {
    return "anonymous";
  }

  return "anonymous";
}

function readStore(): SessionLogStore {
  if (typeof window === "undefined") {
    return {};
  }

  const data = window.localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return {};
  }

  const parsed = JSON.parse(data) as unknown;
  if (!parsed || typeof parsed !== "object") {
    return {};
  }

  return parsed as SessionLogStore;
}

function writeStore(store: SessionLogStore): void {
  if (typeof window === "undefined") {
    return;
  }

  if (Object.keys(store).length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function notifyActivityLogsUpdated(eventId?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(ACTIVITY_LOGS_UPDATED_EVENT, { detail: { eventId } }));
}

/**
 * Get all activity logs for the current session
 */
export function getSessionActivityLogs(eventId: string): SessionActivityLog[] {
  try {
    const sessionKey = getSessionLogKey();
    const store = readStore();
    return [...(store[sessionKey]?.[eventId] || [])].sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

/**
 * Log an activity to the current session
 */
export function logSessionActivity(
  eventId: string,
  action: string,
  description: string,
  metadata?: Record<string, string | number | boolean | undefined>
): SessionActivityLog {
  try {
    const sessionKey = getSessionLogKey();
    const allLogs = readStore();
    
    if (!allLogs[sessionKey]) {
      allLogs[sessionKey] = {};
    }

    if (!allLogs[sessionKey][eventId]) {
      allLogs[sessionKey][eventId] = [];
    }

    const log: SessionActivityLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      action,
      description,
      metadata,
      timestamp: Date.now(),
    };

    allLogs[sessionKey][eventId].push(log);
    writeStore(allLogs);
    notifyActivityLogsUpdated(eventId);
    
    return log;
  } catch (error) {
    console.error("Failed to log activity:", error);
    return {
      id: "",
      action,
      description,
      metadata,
      timestamp: Date.now(),
    };
  }
}

/**
 * Clear all activity logs from the session
 */
export function clearSessionActivityLogs(): void {
  try {
    const sessionKey = getSessionLogKey();
    const allLogs = readStore();
    delete allLogs[sessionKey];
    writeStore(allLogs);
    notifyActivityLogsUpdated();
  } catch (error) {
    console.error("Failed to clear activity logs:", error);
  }
}

/**
 * Clear activity logs for a specific event
 */
export function clearEventActivityLogs(eventId: string): void {
  try {
    const sessionKey = getSessionLogKey();
    const allLogs = readStore();

    if (!allLogs[sessionKey]) {
      return;
    }

    delete allLogs[sessionKey][eventId];

    if (Object.keys(allLogs[sessionKey]).length === 0) {
      delete allLogs[sessionKey];
    }

    writeStore(allLogs);
    notifyActivityLogsUpdated(eventId);
  } catch (error) {
    console.error("Failed to clear event activity logs:", error);
  }
}

/**
 * Format an action string to human-readable text
 */
export function formatAction(action: string): string {
  const actions: Record<string, string> = {
    schedule_created: "Schedule Created",
    schedule_updated: "Schedule Updated",
    schedule_deleted: "Schedule Deleted",
    images_uploaded: "Images Uploaded",
    guest_invited: "Guest Invited",
    guest_accepted: "Guest Accepted",
    guest_deleted: "Guest Deleted",
    upload_link_created: "Upload Link Created",
    event_created: "Event Created",
  };
  return actions[action] || action.replace(/_/g, " ");
}

/**
 * Get a color for an action type
 */
export function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    schedule_created: "#a7f3d0",
    schedule_updated: "#fca5a5",
    schedule_deleted: "#ff6b6b",
    images_uploaded: "#67d4ff",
    guest_invited: "#ffb77b",
    guest_accepted: "#c4b5fd",
    guest_deleted: "#ff9e9e",
    upload_link_created: "#a7f3d0",
    event_created: "#f3bf7a",
  };
  return colors[action] || "#e9e1d8";
}
