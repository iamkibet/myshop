<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Show all notifications page
     */
    public function index(Request $request): Response
    {
        $category = $request->get('category', 'all');
        $page = $request->get('page', 1);
        $perPage = 20;

        $query = \App\Models\Notification::with('readBy')->orderBy('created_at', 'desc');

        if ($category !== 'all') {
            $query->where('category', $category);
        }

        $notifications = $query->paginate($perPage);

        $categories = [
            'all' => 'All Notifications',
            'inventory' => 'Inventory Alerts',
            'sales' => 'Sales Notifications',
            'system' => 'System Notifications',
        ];

        $stats = [
            'total' => \App\Models\Notification::count(),
            'unread' => \App\Models\Notification::unread()->count(),
            'inventory' => \App\Models\Notification::byCategory('inventory')->count(),
            'sales' => \App\Models\Notification::byCategory('sales')->count(),
            'system' => \App\Models\Notification::byCategory('system')->count(),
        ];

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'categories' => $categories,
            'stats' => $stats,
            'currentCategory' => $category,
        ])->with([
            'layout' => 'app',
        ]);
    }

    /**
     * Get recent notifications for dashboard
     */
    public function recent(): JsonResponse
    {
        $notifications = $this->notificationService->getRecentNotifications(10);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $this->notificationService->getUnreadCount(),
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request): JsonResponse
    {
        $request->validate([
            'notification_id' => 'required|integer|exists:notifications,id',
        ]);

        $success = $this->notificationService->markAsRead($request->notification_id);

        return response()->json([
            'success' => $success,
            'unread_count' => $this->notificationService->getUnreadCount(),
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): JsonResponse
    {
        $count = $this->notificationService->markAllAsRead();

        return response()->json([
            'success' => true,
            'marked_count' => $count,
            'unread_count' => 0,
        ]);
    }

    /**
     * Sync notifications with current system state
     */
    public function sync(): JsonResponse
    {
        $this->notificationService->syncNotifications();

        return response()->json([
            'success' => true,
            'message' => 'Notifications synced successfully',
        ]);
    }

    /**
     * Get notification statistics
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => \App\Models\Notification::count(),
            'unread' => \App\Models\Notification::unread()->count(),
            'by_category' => [
                'inventory' => \App\Models\Notification::byCategory('inventory')->count(),
                'sales' => \App\Models\Notification::byCategory('sales')->count(),
                'system' => \App\Models\Notification::byCategory('system')->count(),
            ],
            'recent_unread' => \App\Models\Notification::unread()->recent(7)->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Delete old notifications
     */
    public function cleanup(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $deletedCount = $this->notificationService->cleanupOldNotifications($days);

        return response()->json([
            'success' => true,
            'deleted_count' => $deletedCount,
            'message' => "Deleted {$deletedCount} old notifications",
        ]);
    }

    /**
     * Clear all notifications
     */
    public function clearAll(): JsonResponse
    {
        $this->notificationService->clearAllNotifications();

        return response()->json([
            'success' => true,
            'message' => 'All notifications cleared',
        ]);
    }
}
