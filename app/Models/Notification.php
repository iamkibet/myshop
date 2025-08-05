<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'message',
        'icon',
        'action_data',
        'category',
        'is_read',
        'read_at',
        'read_by',
        'metadata',
    ];

    protected $casts = [
        'action_data' => 'array',
        'metadata' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /**
     * Get the user who marked this notification as read
     */
    public function readBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'read_by');
    }

    /**
     * Scope for unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for read notifications
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Scope for notifications by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope for recent notifications
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($userId = null): bool
    {
        $currentUserId = $userId ?? (\Illuminate\Support\Facades\Auth::id() ?? null);
        return $this->update([
            'is_read' => true,
            'read_at' => now(),
            'read_by' => $currentUserId,
        ]);
    }

    /**
     * Mark notification as unread
     */
    public function markAsUnread(): bool
    {
        return $this->update([
            'is_read' => false,
            'read_at' => null,
            'read_by' => null,
        ]);
    }

    /**
     * Get formatted timestamp
     */
    public function getFormattedTimestampAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }

    /**
     * Get action URL if available
     */
    public function getActionUrlAttribute(): ?string
    {
        if (!$this->action_data) {
            return null;
        }

        $action = $this->action_data;
        
        switch ($action['type'] ?? '') {
            case 'sale':
                return isset($action['id']) ? "/receipts/{$action['id']}" : '/sales';
            case 'product':
                return isset($action['id']) ? "/products/{$action['id']}" : '/products';
            case 'low_stock':
                return '/admin-dashboard?tab=inventory';
            case 'out_of_stock':
                return '/admin-dashboard?tab=inventory';
            default:
                return $action['url'] ?? null;
        }
    }
} 