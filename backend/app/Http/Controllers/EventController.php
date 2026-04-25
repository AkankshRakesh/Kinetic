<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::query()
            ->withCount([
                'invitations',
                'invitations as accepted_count' => fn ($query) => $query->where('status', 'accepted'),
            ])
            ->where('owner_user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (Event $event) => $this->serializeEvent($event));

        return response()->json(['data' => $events]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'eventDate' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $event = Event::create([
            'owner_user_id' => $request->user()->id,
            'name' => trim($data['name']),
            'location' => trim($data['location']),
            'event_date' => $data['eventDate'],
            'region' => trim($data['location']),
            'status' => 'active',
        ]);

        $event->loadCount([
            'invitations',
            'invitations as accepted_count' => fn ($query) => $query->where('status', 'accepted'),
        ]);

        return response()->json([
            'message' => 'Event created.',
            'data' => $this->serializeEvent($event),
        ], 201);
    }

    public function show(Request $request, Event $event)
    {
        abort_unless($event->owner_user_id === $request->user()->id, 404);

        $event->loadCount([
            'invitations',
            'invitations as accepted_count' => fn ($query) => $query->where('status', 'accepted'),
        ]);

        return response()->json(['data' => $this->serializeEvent($event)]);
    }

    private function serializeEvent(Event $event): array
    {
        return [
            'id' => (string) $event->id,
            'name' => $event->name,
            'location' => $event->location,
            'eventDate' => $event->event_date?->toDateString(),
            'region' => $event->region,
            'status' => strtoupper($event->status),
            'invitationCount' => $event->invitations_count ?? 0,
            'acceptedCount' => $event->accepted_count ?? 0,
            'createdAt' => $event->created_at?->toISOString(),
        ];
    }
}
