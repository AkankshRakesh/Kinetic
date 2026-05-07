import { apiGet } from "./client";

export interface ActivityLog {
  id: number;
  event_id: number;
  user_id: number;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface ActivityLogsResponse {
  success: boolean;
  data?: ActivityLog[];
  total?: number;
  message?: string;
}

/**
 * Get activity logs for an event
 * @param eventId The event ID
 * @param limit Number of logs to return (max 20)
 */
export async function getActivityLogs(
  eventId: string,
  limit: number = 5
): Promise<{ logs: ActivityLog[]; total: number }> {
  try {
    const response = await apiGet<ActivityLogsResponse>(
      `/api/events/${eventId}/activity-logs?limit=${Math.min(limit, 20)}`
    );
    return {
      logs: (response.data as ActivityLog[]) || [],
      total: response.total || 0,
    };
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return { logs: [], total: 0 };
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
