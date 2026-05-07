import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export interface EventSchedule {
  id: number;
  event_id: number;
  user_id: number;
  date_key: string;
  start_time: string;
  end_time: string;
  title: string;
  note: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface EventScheduleResponse {
  success: boolean;
  message?: string;
  data?: EventSchedule | EventSchedule[];
  conflicts?: EventSchedule[];
}

/**
 * Get all schedule events for an event
 */
export async function getEventSchedules(eventId: string): Promise<EventSchedule[]> {
  try {
    const response = await apiGet<EventScheduleResponse>(
      `/api/events/${eventId}/schedule`
    );
    return (response.data as EventSchedule[]) || [];
  } catch {
    return [];
  }
}

/**
 * Create a new schedule event
 */
export async function createEventSchedule(
  eventId: string,
  data: Omit<EventSchedule, "id" | "event_id" | "user_id" | "created_at" | "updated_at">
): Promise<EventSchedule> {
  const response = await apiPost<EventScheduleResponse>(
    `/api/events/${eventId}/schedule`,
    data
  );
  return response.data as EventSchedule;
}

/**
 * Update a schedule event
 */
export async function updateEventSchedule(
  eventId: string,
  scheduleId: number,
  data: Partial<Omit<EventSchedule, "id" | "event_id" | "user_id" | "created_at" | "updated_at">>
): Promise<EventSchedule> {
  const response = await apiPatch<EventScheduleResponse>(
    `/api/events/${eventId}/schedule/${scheduleId}`,
    data
  );
  return response.data as EventSchedule;
}

/**
 * Delete a schedule event
 */
export async function deleteEventSchedule(
  eventId: string,
  scheduleId: number
): Promise<string> {
  const response = await apiDelete<EventScheduleResponse>(
    `/api/events/${eventId}/schedule/${scheduleId}`
  );
  return response.message || "Schedule deleted successfully";
}
