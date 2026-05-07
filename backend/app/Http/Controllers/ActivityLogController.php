<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ActivityLogController extends Controller
{
    /**
     * Get recent activity logs for an event.
     * 
     * @param int $limit Number of logs to return (default 5, max 20)
     */
    public function index(Request $request, Event $event): JsonResponse
    {
        $limit = min((int) $request->query('limit', 5), 20);

        $logs = $event->activityLogs()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->with('user:id,name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs,
            'total' => $event->activityLogs()->count(),
        ]);
    }
}
