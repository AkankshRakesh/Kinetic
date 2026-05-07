/**
 * Session-based activity logging using localStorage
 * Logs are cleared on sign out
 */

export interface SessionActivityLog {
  id: string;
  action: string;
  description: string;
  metadata?: Record<string, string | number | boolean | undefined>;
  timestamp: number; // milliseconds since epoch
}

const STORAGE_KEY = "event_activity_logs";

/**
 * Get all activity logs for the current session
 */
export function getSessionActivityLogs(eventId: string): SessionActivityLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const allLogs = JSON.parse(data) as Record<string, SessionActivityLog[]>;
    return (allLogs[eventId] || []).sort((a, b) => b.timestamp - a.timestamp);
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
    const data = localStorage.getItem(STORAGE_KEY);
    const allLogs = data ? JSON.parse(data) : {};
    
    if (!allLogs[eventId]) {
      allLogs[eventId] = [];
    }

    const log: SessionActivityLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      description,
      metadata,
      timestamp: Date.now(),
    };

    allLogs[eventId].push(log);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allLogs));
    
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
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear activity logs:", error);
  }
}

/**
 * Clear activity logs for a specific event
 */
export function clearEventActivityLogs(eventId: string): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    
    const allLogs = JSON.parse(data) as Record<string, SessionActivityLog[]>;
    delete allLogs[eventId];
    
    if (Object.keys(allLogs).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLogs));
    }
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
  };
  return colors[action] || "#e9e1d8";
}
