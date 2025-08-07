<?php

namespace App\Http\Middleware;

use App\Models\Wallet;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWalletExists
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isManager()) {
            // Ensure wallet exists for manager
            Wallet::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'balance' => 0,
                    'total_earned' => 0,
                    'total_paid_out' => 0,
                ]
            );
        }

        return $next($request);
    }
}
