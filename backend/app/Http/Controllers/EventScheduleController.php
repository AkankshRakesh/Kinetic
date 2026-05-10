<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventSchedule;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EventScheduleController extends Controller
{
    /**
     * Get all schedules for a specific event.
     */
    public function index(Event $event): JsonResponse
    {
        $schedules = $event->schedules()
            ->orderBy('date_key')
            ->orderBy('start_time')
            ->orderBy('end_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Create a new schedule event.
     */
    public function store(Request $request, Event $event): JsonResponse
    {
        // Verify user owns the event
        if ($event->owner_user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to create schedules for this event.',
            ], 403);
        }

        $validated = $request->validate([
            'date_key' => 'required|string|regex:/^\d{4}-\d{2}-\d{2}$/',
            'start_time' => 'required|string|regex:/^\d{2}:\d{2}$/',
            'end_time' => 'required|string|regex:/^\d{2}:\d{2}$/',
            'title' => 'required|string|max:255',
            'note' => 'nullable|string|max:1000',
            'color' => 'required|string|regex:/^#[0-9a-fA-F]{6}$/',
        ]);

        // Validate that start_time is before end_time
        if ($validated['start_time'] >= $validated['end_time']) {
            return response()->json([
                'success' => false,
                'message' => 'Start time must be before end time.',
            ], 422);
        }

        // Check for conflicts with existing events on the same date
        $conflicts = $event->schedules()
            ->where('date_key', $validated['date_key'])
            ->where(function ($query) use ($validated) {
                // Event overlaps if: (new_start < existing_end) AND (new_end > existing_start)
                $query->whereRaw("start_time < ? AND end_time > ?", [
                    $validated['end_time'],
                    $validated['start_time']
                ]);
            })
            ->get();

        if ($conflicts->isNotEmpty()) {
            $conflictingEvents = $conflicts->map(function ($event) {
                return "{$event->title} ({$event->start_time} - {$event->end_time})";
            })->join(', ');

            return response()->json([
                'success' => false,
                'message' => "Time slot conflicts with: {$conflictingEvents}",
                'conflicts' => $conflicts,
            ], 409);
        }

        $schedule = $event->schedules()->create([
            'user_id' => $request->user()->id,
            'date_key' => $validated['date_key'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'title' => $validated['title'],
            'note' => $validated['note'],
            'color' => $validated['color'],
        ]);

        // Log the activity
        ActivityLog::logActivity(
            $event->id,
            $request->user()->id,
            'schedule_created',
            "Created schedule: {$schedule->title}",
            [
                'schedule_id' => $schedule->id,
                'title' => $schedule->title,
                'date' => $schedule->date_key,
                'time' => "{$schedule->start_time} - {$schedule->end_time}",
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Added {$schedule->title} on {$schedule->date_key} from {$schedule->start_time} to {$schedule->end_time}.",
            'data' => $schedule,
        ], 201);
    }

    /**
     * Get a specific schedule event.
     */
    public function show(Event $event, EventSchedule $schedule): JsonResponse
    {
        // Verify schedule belongs to event
        if ($schedule->event_id !== $event->id) {
            return response()->json([
                'success' => false,
                'message' => 'Schedule not found for this event.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $schedule,
        ]);
    }

    /**
     * Update a schedule event.
     */
    public function update(Request $request, Event $event, EventSchedule $schedule): JsonResponse
    {
        // Verify schedule belongs to event
        if ($schedule->event_id !== $event->id) {
            return response()->json([
                'success' => false,
                'message' => 'Schedule not found for this event.',
            ], 404);
        }

        // Verify user owns the event
        if ($event->owner_user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update schedules for this event.',
            ], 403);
        }

        $validated = $request->validate([
            'date_key' => 'sometimes|string|regex:/^\d{4}-\d{2}-\d{2}$/',
            'start_time' => 'sometimes|string|regex:/^\d{2}:\d{2}$/',
            'end_time' => 'sometimes|string|regex:/^\d{2}:\d{2}$/',
            'title' => 'sometimes|string|max:255',
            'note' => 'nullable|string|max:1000',
            'color' => 'sometimes|string|regex:/^#[0-9a-fA-F]{6}$/',
        ]);

        // If times are being updated, validate them
        $startTime = $validated['start_time'] ?? $schedule->start_time;
        $endTime = $validated['end_time'] ?? $schedule->end_time;
        $dateKey = $validated['date_key'] ?? $schedule->date_key;

        if ($startTime >= $endTime) {
            return response()->json([
                'success' => false,
                'message' => 'Start time must be before end time.',
            ], 422);
        }

        // Check for conflicts with other events on the same date (excluding this schedule)
        $conflicts = $event->schedules()
            ->where('date_key', $dateKey)
            ->where('id', '!=', $schedule->id)
            ->where(function ($query) use ($startTime, $endTime) {
                // Event overlaps if: (new_start < existing_end) AND (new_end > existing_start)
                $query->whereRaw("start_time < ? AND end_time > ?", [
                    $endTime,
                    $startTime
                ]);
            })
            ->get();

        if ($conflicts->isNotEmpty()) {
            $conflictingEvents = $conflicts->map(function ($event) {
                return "{$event->title} ({$event->start_time} - {$event->end_time})";
            })->join(', ');

            return response()->json([
                'success' => false,
                'message' => "Time slot conflicts with: {$conflictingEvents}",
                'conflicts' => $conflicts,
            ], 409);
        }

        $schedule->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Schedule updated successfully.',
            'data' => $schedule,
        ]);
    }

    /**
     * Delete a schedule event.
     */
    public function destroy(Request $request, Event $event, EventSchedule $schedule): JsonResponse
    {
        // Verify schedule belongs to event
        if ($schedule->event_id !== $event->id) {
            return response()->json([
                'success' => false,
                'message' => 'Schedule not found for this event.',
            ], 404);
        }

        // Verify user owns the event
        if ($event->owner_user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete schedules for this event.',
            ], 403);
        }

        $title = $schedule->title;
        $schedule->delete();

        // Log the activity
        ActivityLog::logActivity(
            $event->id,
            $request->user()->id,
            'schedule_deleted',
            "Deleted schedule: {$title}",
            [
                'schedule_id' => $schedule->id,
                'title' => $title,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Deleted {$title}.",
        ]);
    }
}
