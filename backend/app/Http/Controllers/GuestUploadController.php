<?php

namespace App\Http\Controllers;

use App\Mail\GuestPhotoUploadMail;
use App\Models\Event;
use App\Models\GuestUpload;
use App\Models\ActivityLog;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class GuestUploadController extends Controller
{
    /**
     * Generate a shareable link for guests to upload images
     */
    public function generateShareLink(Request $request, Event $event)
    {
        abort_unless($event->owner_user_id === $request->user()->id, 403);

        $validator = Validator::make($request->all(), [
            'guest_name' => 'required|string|max:255',
            'guest_email' => 'required|email|max:255',
            'send_email' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $existingUpload = GuestUpload::where('event_id', $event->id)
            ->where('guest_email', $data['guest_email'])
            ->first();

        if ($existingUpload) {
            return response()->json([
                'message' => 'Upload link already exists for this guest.',
                'data' => [
                    'shareToken' => $existingUpload->share_token,
                    'shareUrl' => url("/upload/{$existingUpload->share_token}"),
                    'guestName' => $existingUpload->guest_name,
                    'guestEmail' => $existingUpload->guest_email,
                    'uploadCount' => $existingUpload->upload_count,
                ],
            ], 200);
        }

        $shareToken = Str::random(32);

        $guestUpload = GuestUpload::create([
            'event_id' => $event->id,
            'share_token' => $shareToken,
            'guest_name' => $data['guest_name'],
            'guest_email' => $data['guest_email'],
            'image_paths' => [],
            'upload_count' => 0,
        ]);

        if ($request->boolean('send_email', false)) {
            $uploadUrl = url("/upload/{$guestUpload->share_token}");
            Mail::to($data['guest_email'])->send(
                new GuestPhotoUploadMail(
                    $data['guest_name'],
                    $data['guest_email'],
                    $event->name,
                    $uploadUrl,
                )
            );
        }

        return response()->json([
            'message' => 'Share link generated.',
            'data' => [
                'shareToken' => $guestUpload->share_token,
                'shareUrl' => url("/upload/{$guestUpload->share_token}"),
                'guestName' => $guestUpload->guest_name,
                'guestEmail' => $guestUpload->guest_email,
                'uploadCount' => $guestUpload->upload_count,
            ],
        ], 201);
    }

    /**
     * Upload images using share token (public endpoint)
     */
    public function uploadImages(Request $request, string $shareToken)
    {
        $guestUpload = GuestUpload::where('share_token', $shareToken)->first();

        if (! $guestUpload) {
            return response()->json(['message' => 'Invalid share link.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'images' => 'required|array|max:5',
            'images.*' => 'required|image|mimes:jpeg,png,webp,gif|max:10240', // 10MB per image
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $images = $request->file('images');
        $uploadedPaths = [];
        $currentImageCount = $guestUpload->upload_count ?? 0;

        if ($currentImageCount + count($images) > 5) {
            return response()->json([
                'message' => 'Maximum 5 images allowed. You have already uploaded ' . $currentImageCount . ' image(s).',
            ], 422);
        }

        foreach ($images as $image) {
            try {
                $filename = Str::uuid() . '.' . $image->getClientOriginalExtension();
                $path = "events/{$guestUpload->event_id}/uploads/{$guestUpload->id}/{$filename}";

                /** @var FilesystemAdapter $disk */
                $disk = Storage::disk('supabase');
                $disk->put($path, file_get_contents($image));

                $url = $disk->url($path);

                $uploadedPaths[] = [
                    'path' => $path,
                    'url' => $url,
                    'filename' => $image->getClientOriginalName(),
                    'uploadedAt' => now()->toISOString(),
                ];
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Failed to upload image: ' . $e->getMessage(),
                ], 500);
            }
        }

        $currentImages = $guestUpload->image_paths ?? [];
        $guestUpload->update([
            'image_paths' => array_merge($currentImages, $uploadedPaths),
            'upload_count' => $guestUpload->upload_count + count($images),
        ]);

        $event = Event::find($guestUpload->event_id);
        if ($event) {
            ActivityLog::logActivity(
                $event->id,
                0, // Guest upload (no authenticated user)
                'images_uploaded',
                "{$guestUpload->guest_name} uploaded " . count($images) . " image(s)",
                [
                    'guest_name' => $guestUpload->guest_name,
                    'guest_email' => $guestUpload->guest_email,
                    'image_count' => count($images),
                    'upload_id' => $guestUpload->id,
                ]
            );
        }

        return response()->json([
            'message' => 'Images uploaded successfully.',
            'data' => [
                'uploadId' => (string) $guestUpload->id,
                'guestName' => $guestUpload->guest_name,
                'guestEmail' => $guestUpload->guest_email,
                'uploadedImages' => $uploadedPaths,
                'totalUploads' => $guestUpload->upload_count,
            ],
        ], 201);
    }

    /**
     * Get all uploads for an event (authenticated, owner only)
     */
    public function getEventUploads(Request $request, Event $event)
    {
        abort_unless($event->owner_user_id === $request->user()->id, 403);

        $uploads = GuestUpload::where('event_id', $event->id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (GuestUpload $upload) => [
                'id' => (string) $upload->id,
                'guestName' => $upload->guest_name,
                'guestEmail' => $upload->guest_email,
                'uploadCount' => $upload->upload_count,
                'images' => $upload->image_paths ?? [],
                'shareToken' => $upload->share_token,
                'shareUrl' => url("/upload/{$upload->share_token}"),
                'uploadedAt' => $upload->created_at?->toISOString(),
                'lastUpdated' => $upload->updated_at?->toISOString(),
            ]);

        return response()->json([
            'data' => $uploads,
            'total' => count($uploads),
        ]);
    }

    /**
     * Get a specific upload record (public, for verifying before uploading)
     */
    public function checkShareLink(string $shareToken)
    {
        $guestUpload = GuestUpload::where('share_token', $shareToken)
            ->with('event')
            ->first();

        if (! $guestUpload) {
            return response()->json(['message' => 'Invalid share link.'], 404);
        }

        $remainingSlots = 5 - ($guestUpload->upload_count ?? 0);

        return response()->json([
            'data' => [
                'isValid' => true,
                'eventName' => $guestUpload->event->name,
                'eventDate' => $guestUpload->event->event_date?->toDateString(),
                'guestName' => $guestUpload->guest_name,
                'guestEmail' => $guestUpload->guest_email,
                'uploadCount' => $guestUpload->upload_count,
                'remainingSlots' => max(0, $remainingSlots),
                'maxImagesExceeded' => $remainingSlots <= 0,
                'images' => $guestUpload->image_paths ?? [],
            ],
        ]);
    }

    /**
     * Get event schedule for a share token (public endpoint)
     */
    public function getScheduleByShareToken(string $shareToken)
    {
        $guestUpload = GuestUpload::query()
            ->where('share_token', $shareToken)
            ->with('event')
            ->first();

        if (! $guestUpload || ! $guestUpload->event) {
            return response()->json(['message' => 'Invalid share link.'], 404);
        }

        $schedules = $guestUpload->event->schedules()
            ->orderBy('date_key')
            ->orderBy('start_time')
            ->orderBy('end_time')
            ->get();

        return response()->json([
            'data' => [
                'eventName' => $guestUpload->event->name,
                'eventDate' => $guestUpload->event->event_date?->toDateString(),
                'schedules' => $schedules,
                'lastUpdatedAt' => $schedules->max('updated_at')?->toISOString(),
            ],
        ]);
    }
}
