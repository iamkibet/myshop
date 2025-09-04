<?php

namespace App\Providers;

use App\Events\SaleCreated;
use App\Listeners\SaleCreatedListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Event::listen(
            SaleCreated::class,
            SaleCreatedListener::class,
        );
    }
}
