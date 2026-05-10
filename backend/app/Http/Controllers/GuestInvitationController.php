<?php

namespace App\Http\Controllers;

use App\Mail\GuestInvitationMail;
use App\Mail\GuestPhotoUploadMail;
use App\Mail\GuestCalendarScheduleMail;
use App\Models\Event;
use App\Models\GuestInvitation;
use App\Models\GuestUpload;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class GuestInvitationController extends Controller
{
    public function index(Request $request, Event $event)
    {
        abort_unless($event->owner_user_id === $request->user()->id, 404);

        $invitations = GuestInvitation::query()
            ->where('event_id', $event->id)
            ->where('invited_by_user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (GuestInvitation $invitation) => [
                'id' => (string) $invitation->id,
                'guestName' => $invitation->guest_name,
                'guestEmail' => $invitation->guest_email,
                'customMessage' => $invitation->custom_message,
                'additionalGuestNames' => $invitation->additional_guest_names ?? [],
                'peopleCount' => $invitation->people_count,
                'guestResponseMessage' => $invitation->guest_response_message,
                'status' => strtoupper($invitation->status),
                'sentAt' => $invitation->sent_at?->toISOString(),
                'acceptedAt' => $invitation->accepted_at?->toISOString(),
                'rejectedAt' => $invitation->rejected_at?->toISOString(),
            ]);

        return response()->json(['data' => $invitations]);
    }

    public function send(Request $request, Event $event)
    {
        abort_unless($event->owner_user_id === $request->user()->id, 404);

        $request->merge([
            'guestEmail' => strtolower((string) $request->input('guestEmail', '')),
        ]);

        $validator = Validator::make($request->all(), [
            'guestName' => 'required|string|max:255',
            'guestEmail' => [
                'required',
                'email',
                'max:255',
                Rule::unique('guest_invitations', 'guest_email')->where('event_id', $event->id),
            ],
            'customMessage' => 'nullable|string|max:1000',
            'additionalGuestNames' => 'sometimes|array|max:20',
            'additionalGuestNames.*' => 'required|string|max:255|distinct',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $additionalGuestNames = collect($data['additionalGuestNames'] ?? [])
            ->map(fn (string $guestName) => trim($guestName))
            ->filter()
            ->values()
            ->all();
        $acceptToken = Str::random(64);
        $invitation = GuestInvitation::create([
            'invited_by_user_id' => $request->user()?->id,
            'event_id' => $event->id,
            'guest_name' => trim($data['guestName']),
            'guest_email' => strtolower($data['guestEmail']),
            'custom_message' => $data['customMessage'] ?? null,
            'additional_guest_names' => $additionalGuestNames,
            'people_count' => 1 + count($additionalGuestNames),
            'status' => 'pending',
            'accept_token_hash' => hash('sha256', $acceptToken),
            'sent_at' => now(),
        ]);

        Mail::to($data['guestEmail'])->send(
            new GuestInvitationMail(
                $data['guestName'],
                $data['guestEmail'],
                $data['customMessage'] ?? null,
                $this->buildAcceptUrl($acceptToken),
                $additionalGuestNames,
                $event->name
            )
        );

        return response()->json([
            'message' => 'Invitation email sent successfully.',
            'data' => [
                'id' => (string) $invitation->id,
                'guestName' => $invitation->guest_name,
                'guestEmail' => $invitation->guest_email,
                'customMessage' => $invitation->custom_message,
                'additionalGuestNames' => $invitation->additional_guest_names ?? [],
                'peopleCount' => $invitation->people_count,
                'guestResponseMessage' => $invitation->guest_response_message,
                'status' => strtoupper($invitation->status),
                'sentAt' => $invitation->sent_at?->toISOString(),
                'acceptedAt' => $invitation->accepted_at?->toISOString(),
                'rejectedAt' => $invitation->rejected_at?->toISOString(),
            ],
        ], 201);
    }

    public function destroy(Request $request, Event $event, GuestInvitation $invitation)
    {
        abort_unless($event->owner_user_id === $request->user()->id, 404);
        abort_unless($invitation->event_id === $event->id, 404);

        $guestUploadIds = [];
        $imagePaths = [];

        if ($invitation->status === 'accepted') {
            $guestUploads = GuestUpload::query()
                ->where('event_id', $event->id)
                ->where('guest_email', $invitation->guest_email)
                ->get();

            $guestUploadIds = $guestUploads->pluck('id')->all();
            $imagePaths = $guestUploads
                ->flatMap(fn (GuestUpload $upload) => collect($upload->image_paths ?? [])->pluck('path'))
                ->filter()
                ->values()
                ->all();
        }

        DB::transaction(function () use ($invitation, $guestUploadIds): void {
            if ($guestUploadIds !== []) {
                GuestUpload::query()->whereIn('id', $guestUploadIds)->delete();
            }

            $invitation->delete();
        });

        if ($imagePaths !== []) {
            Storage::disk('supabase')->delete($imagePaths);
        }

        return response()->json([
            'message' => $invitation->status === 'accepted'
                ? 'Invitation and guest uploads deleted.'
                : 'Invitation deleted.',
        ]);
    }

    public function accept(string $token)
    {
        return $this->respondToInvitation($token, 'accepted');
    }

    public function respond(Request $request, string $token)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:accepted,rejected',
            'message' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        return $this->respondToInvitation($token, $data['status'], $data['message'] ?? null);
    }

    private function respondToInvitation(string $token, string $status, ?string $message = null)
    {
        $invitation = GuestInvitation::where('accept_token_hash', hash('sha256', $token))->first();

        if (! $invitation) {
            return response()->json(['message' => 'Invitation link is invalid.'], 404);
        }

        $timestampColumn = $status === 'accepted' ? 'accepted_at' : 'rejected_at';

        $invitation->forceFill([
            'status' => $status,
            'guest_response_message' => $message,
            'accepted_at' => $status === 'accepted' ? ($invitation->accepted_at ?? now()) : null,
            'rejected_at' => $status === 'rejected' ? ($invitation->rejected_at ?? now()) : null,
            $timestampColumn => $invitation->{$timestampColumn} ?? now(),
        ])->save();

        $uploadUrl = null;

        // If invitation is accepted, create upload share link and send email
        if ($status === 'accepted') {
            $uploadUrl = $this->createAndEmailUploadLink($invitation);
        }

        return response()->json([
            'message' => $status === 'accepted' ? 'Invitation accepted.' : 'Invitation rejected.',
            'data' => [
                'guestName' => $invitation->guest_name,
                'guestEmail' => $invitation->guest_email,
                'additionalGuestNames' => $invitation->additional_guest_names ?? [],
                'peopleCount' => $invitation->people_count,
                'guestResponseMessage' => $invitation->guest_response_message,
                'status' => strtoupper($invitation->status),
                'acceptedAt' => $invitation->accepted_at?->toISOString(),
                'rejectedAt' => $invitation->rejected_at?->toISOString(),
                'uploadUrl' => $uploadUrl,
            ],
        ]);
    }

    private function buildAcceptUrl(string $token): string
    {
        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');

        return "{$frontendUrl}/invite/accept?token={$token}";
    }

    private function createAndEmailUploadLink(GuestInvitation $invitation): string
    {
        // Check if upload record already exists for this guest at this event
        $existingUpload = GuestUpload::where('event_id', $invitation->event_id)
            ->where('guest_email', $invitation->guest_email)
            ->first();

        // If it doesn't exist, create one
        if (! $existingUpload) {
            $shareToken = Str::random(32);
            $existingUpload = GuestUpload::create([
                'event_id' => $invitation->event_id,
                'share_token' => $shareToken,
                'guest_name' => $invitation->guest_name,
                'guest_email' => $invitation->guest_email,
                'image_paths' => [],
                'upload_count' => 0,
            ]);
        }

        // Build the upload URL
        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $uploadUrl = "{$frontendUrl}/upload/{$existingUpload->share_token}";

        // Send email with upload link
        Mail::to($invitation->guest_email)->send(
            new GuestPhotoUploadMail(
                $invitation->guest_name,
                $invitation->guest_email,
                $invitation->event->name,
                $uploadUrl,
            )
        );

        // Send calendar schedule email
        $calendarUrl = "{$frontendUrl}/upload/{$existingUpload->share_token}/calendar";
        Mail::to($invitation->guest_email)->send(
            new GuestCalendarScheduleMail(
                $invitation->guest_name,
                $invitation->guest_email,
                $invitation->event->name,
                $calendarUrl,
                $invitation->event->event_date,
            )
        );

        return $uploadUrl;
    }
}
