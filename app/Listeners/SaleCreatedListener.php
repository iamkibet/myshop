<?php

namespace App\Listeners;

use App\Events\SaleCreated;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SaleCreatedListener implements ShouldQueue
{
    use InteractsWithQueue;

    protected NotificationService $notificationService;

    /**
     * Create the event listener.
     */
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the event.
     */
    public function handle(SaleCreated $event): void
    {
        \Log::info('SaleCreatedListener: Handling SaleCreated event', [
            'sale_id' => $event->sale->id,
            'manager_id' => $event->sale->manager_id,
            'total_amount' => $event->sale->total_amount
        ]);

        // Create notifications for all admins about the new sale
        $this->notificationService->createSaleNotification($event->sale);
        
        \Log::info('SaleCreatedListener: Notifications created successfully', [
            'sale_id' => $event->sale->id
        ]);
    }
}
